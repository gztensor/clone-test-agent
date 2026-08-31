import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { blake2AsHex } from "@polkadot/util-crypto";
import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const PRIOR_RUNTIME = Number(process.env.PRIOR_RUNTIME ?? 452);
const CANDIDATE_RUNTIME = Number(process.env.CANDIDATE_RUNTIME ?? 452);
const PRE_UPGRADE_HEADS = Number(process.env.PRE_UPGRADE_HEADS ?? 6);
const POST_UPGRADE_HEADS = Number(process.env.POST_UPGRADE_HEADS ?? 10);
const TEST_TIMEOUT_MS = Number(process.env.MIGRATION_TEST_TIMEOUT_MS ?? 20 * 60_000);
const MIGRATION_NAME = "migrate_rebuild_conviction_aggregates";
const CODE_STORAGE_KEY = "0x3a636f6465";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_WASM_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "subtensor-reference",
  "target",
  "release",
  "wbuild",
  "node-subtensor-runtime",
  "node_subtensor_runtime.compact.compressed.wasm",
);
const WASM_PATH = process.env.RUNTIME_WASM_PATH ?? DEFAULT_WASM_PATH;
const logger = createTempLogger("rebuild-conviction-aggregates-migration.log");

async function main() {
  await logger.start();
  const api = await connectApi(WS_ENDPOINT, { log: (...args) => logger.info(...args) });

  try {
    assertRequiredStorage(api);

    const initialRuntime = await api.rpc.state.getRuntimeVersion();
    assert.equal(
      initialRuntime.specVersion.toNumber(),
      PRIOR_RUNTIME,
      `expected pre-upgrade runtime ${PRIOR_RUNTIME}`,
    );
    assert.ok(fs.existsSync(WASM_PATH), `runtime wasm not found: ${WASM_PATH}`);
    const candidateCodeHash = blake2AsHex(fs.readFileSync(WASM_PATH), 256);
    const initialCodeHash = (await api.rpc.state.getStorageHash(CODE_STORAGE_KEY)).toHex();
    assert.notEqual(
      initialCodeHash,
      candidateCodeHash,
      "fresh clone already contains the candidate runtime code",
    );
    const initialMarker = await api.query.subtensorModule.hasMigrationRun(MIGRATION_NAME);
    assert.equal(initialMarker.isTrue, false, "migration marker is already set before upgrade");
    await logger.info(`initial_runtime=${initialRuntime.specVersion.toNumber()}`);
    await logger.info(`initial_code_hash=${initialCodeHash}`);
    await logger.info(`candidate_code_hash=${candidateCodeHash}`);
    await logger.info(`initial_migration_marker=${initialMarker.isTrue}`);

    const observations = await observeUpgrade(api, candidateCodeHash);
    const activationIndex = observations.findIndex(
      ({ codeHash }) => codeHash === candidateCodeHash,
    );
    assert.ok(activationIndex >= 0, `candidate code hash ${candidateCodeHash} was not observed`);

    const activation = observations[activationIndex];
    const prior = observations[activationIndex - 1];
    assert.ok(prior, "no block immediately before runtime activation was observed");
    assert.equal(prior.height + 1, activation.height, "runtime activation observations are not adjacent");
    assert.equal(prior.specVersion, PRIOR_RUNTIME, "unexpected runtime before activation");
    assert.notEqual(prior.codeHash, candidateCodeHash, "candidate code was active before activation");
    assert.equal(activation.specVersion, CANDIDATE_RUNTIME, "unexpected candidate runtime version");

    const completion = await findMigrationCompletion(api, observations, activationIndex);
    const cadence = calculateCadence(observations, activationIndex, completion?.height);
    await logCadence(cadence, activation, completion);

    const beforeMarker = await api.query.subtensorModule.hasMigrationRun.at(
      activation.hash,
      MIGRATION_NAME,
    );
    await logger.info(`marker_at_runtime_activation=${beforeMarker.isTrue}`);

    const failures = [];
    if (!completion) {
      failures.push(
        `${MIGRATION_NAME} marker remained false for ${POST_UPGRADE_HEADS} blocks after runtime ${CANDIDATE_RUNTIME} activation`,
      );
    } else {
      const previousHash = (await api.rpc.chain.getBlockHash(completion.height - 1)).toString();
      const previousMarker = await api.query.subtensorModule.hasMigrationRun.at(
        previousHash,
        MIGRATION_NAME,
      );
      if (previousMarker.isTrue) {
        failures.push("migration marker was already true in the block before its observed boundary");
      }

      const blocksAfterActivation = completion.height - activation.height;
      await logger.info(`migration_completion_block=${completion.height}`);
      await logger.info(`migration_completion_hash=${completion.hash}`);
      await logger.info(`migration_blocks_after_runtime_activation=${blocksAfterActivation}`);
      if (blocksAfterActivation > 1) {
        failures.push(
          `migration completed ${blocksAfterActivation} blocks after activation instead of in the first block executed by the new runtime`,
        );
      }

      const auditFailures = await auditRebuiltState(
        api,
        completion.hash,
        previousHash,
        completion.height,
      );
      failures.push(...auditFailures);
    }

    if (!cadence.migrationIntervalMs) {
      failures.push("could not identify the migration block's wall-clock interval");
    } else if (cadence.migrationIntervalMs > cadence.cadenceLimitMs) {
      failures.push(
        `migration interval ${cadence.migrationIntervalMs}ms exceeded cadence limit ${cadence.cadenceLimitMs}ms`,
      );
    }

    const postActivationHeads = observations.length - activationIndex - 1;
    if (postActivationHeads < POST_UPGRADE_HEADS) {
      failures.push(
        `only ${postActivationHeads} post-activation heads observed; expected ${POST_UPGRADE_HEADS}`,
      );
    }

    for (const failure of failures) {
      await logger.info(`failure=${failure}`);
    }
    await logger.info(`verification=${failures.length === 0 ? "passed" : "failed"}`);
    assert.equal(failures.length, 0, `${failures.length} migration verification failure(s)`);
  } finally {
    await api.disconnect();
    await logger.flush();
  }
}

function assertRequiredStorage(api) {
  const missing = [
    ["HasMigrationRun", api.query.subtensorModule?.hasMigrationRun],
    ["Lock", api.query.subtensorModule?.lock],
    ["LockingColdkeys", api.query.subtensorModule?.lockingColdkeys],
    ["HotkeyLock", api.query.subtensorModule?.hotkeyLock],
    ["DecayingHotkeyLock", api.query.subtensorModule?.decayingHotkeyLock],
    ["OwnerLock", api.query.subtensorModule?.ownerLock],
    ["DecayingOwnerLock", api.query.subtensorModule?.decayingOwnerLock],
    ["DecayingLock", api.query.subtensorModule?.decayingLock],
    ["SubnetOwnerHotkey", api.query.subtensorModule?.subnetOwnerHotkey],
    ["Timestamp.Now", api.query.timestamp?.now],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `missing storage: ${missing.map(([name]) => name).join(", ")}`);
}

async function observeUpgrade(api, candidateCodeHash) {
  const observations = [];
  let unsubscribe;
  let settled = false;
  let queue = Promise.resolve();
  let timeout;

  await logger.info(`waiting_for_pre_upgrade_heads=${PRE_UPGRADE_HEADS}`);

  const done = new Promise((resolve, reject) => {
    timeout = setTimeout(() => reject(new Error("timed out observing runtime upgrade")), TEST_TIMEOUT_MS);

    api.rpc.chain
      .subscribeNewHeads((header) => {
        const receivedAtMs = Date.now();
        queue = queue
          .then(async () => {
            if (settled) return;
            const height = header.number.toNumber();
            const hash = header.hash.toString();
            const [runtime, timestamp, codeHash] = await Promise.all([
              api.rpc.state.getRuntimeVersion(hash),
              api.query.timestamp.now.at(hash),
              api.rpc.state.getStorageHash(CODE_STORAGE_KEY, hash),
            ]);
            const observation = {
              height,
              hash,
              receivedAtMs,
              timestampMs: Number(timestamp.toBigInt()),
              specVersion: runtime.specVersion.toNumber(),
              codeHash: codeHash.toHex(),
            };
            observations.push(observation);
            await logger.info(
              `head block=${height} runtime=${observation.specVersion} code_hash=${observation.codeHash} received_at_ms=${receivedAtMs} chain_timestamp_ms=${observation.timestampMs}`,
            );

            const activationIndex = observations.findIndex(
              ({ codeHash: observedCodeHash }) => observedCodeHash === candidateCodeHash,
            );
            if (activationIndex < 0 && observations.length === PRE_UPGRADE_HEADS) {
              await logger.info("READY_FOR_RUNTIME_UPGRADE");
            }
            if (
              activationIndex >= 0 &&
              observations.length - activationIndex - 1 >= POST_UPGRADE_HEADS
            ) {
              settled = true;
              clearTimeout(timeout);
              resolve();
            }
          })
          .catch(reject);
      })
      .then((callback) => {
        unsubscribe = callback;
      })
      .catch(reject);
  });

  try {
    await done;
    await queue;
  } finally {
    settled = true;
    clearTimeout(timeout);
    await unsubscribe?.();
  }

  return observations;
}

async function findMigrationCompletion(api, observations, activationIndex) {
  for (const observation of observations.slice(activationIndex)) {
    const marker = await api.query.subtensorModule.hasMigrationRun.at(
      observation.hash,
      MIGRATION_NAME,
    );
    await logger.info(`marker block=${observation.height} value=${marker.isTrue}`);
    if (marker.isTrue) return observation;
  }
  return null;
}

function calculateCadence(observations, activationIndex, completionHeight) {
  const intervals = [];
  for (let index = 1; index < observations.length; index += 1) {
    intervals.push({
      from: observations[index - 1].height,
      to: observations[index].height,
      wallMs: observations[index].receivedAtMs - observations[index - 1].receivedAtMs,
      chainMs: observations[index].timestampMs - observations[index - 1].timestampMs,
    });
  }

  const preIntervals = intervals
    .filter(({ to }) => to < observations[activationIndex].height)
    .map(({ wallMs }) => wallMs);
  const postIntervals = intervals
    .filter(({ from }) => from > observations[activationIndex].height)
    .map(({ wallMs }) => wallMs);
  const baselineMedianMs = median(preIntervals);
  const cadenceLimitMs = Math.max(baselineMedianMs * 2, baselineMedianMs + 6_000);
  const activationInterval = intervals.find(
    ({ to }) => to === observations[activationIndex].height,
  );
  const migrationInterval = intervals.find(({ to }) => to === completionHeight);

  return {
    intervals,
    preIntervals,
    postIntervals,
    baselineMedianMs,
    cadenceLimitMs,
    activationIntervalMs: activationInterval?.wallMs ?? null,
    migrationIntervalMs: migrationInterval?.wallMs ?? null,
  };
}

async function logCadence(cadence, activation, completion) {
  await logger.info(`runtime_activation_block=${activation.height}`);
  await logger.info(`runtime_activation_hash=${activation.hash}`);
  await logger.info(`pre_upgrade_interval_count=${cadence.preIntervals.length}`);
  await logger.info(`pre_upgrade_wall_median_ms=${cadence.baselineMedianMs}`);
  await logger.info(`runtime_activation_wall_interval_ms=${cadence.activationIntervalMs}`);
  await logger.info(`migration_wall_interval_ms=${cadence.migrationIntervalMs}`);
  await logger.info(`post_upgrade_wall_median_ms=${median(cadence.postIntervals)}`);
  await logger.info(`post_upgrade_wall_max_ms=${maximum(cadence.postIntervals)}`);
  await logger.info(`cadence_acceptance_limit_ms=${cadence.cadenceLimitMs}`);
  await logger.info(`migration_completion_observed=${Boolean(completion)}`);
  for (const interval of cadence.intervals) {
    await logger.info(
      `interval ${interval.from}->${interval.to} wall_ms=${interval.wallMs} chain_ms=${interval.chainMs}`,
    );
  }
}

async function auditRebuiltState(api, blockHash, classificationHash, blockHeight) {
  const apiAt = await api.at(blockHash);
  const classificationApiAt = await api.at(classificationHash);
  const [ownerEntries, flagEntries, lockEntries, reverseEntries] = await Promise.all([
    classificationApiAt.query.subtensorModule.subnetOwnerHotkey.entries(),
    apiAt.query.subtensorModule.decayingLock.entries(),
    apiAt.query.subtensorModule.lock.entries(),
    apiAt.query.subtensorModule.lockingColdkeys.entries(),
  ]);

  const owners = new Map(
    ownerEntries.map(([key, value]) => [key.args[0].toNumber(), value.toString()]),
  );
  const defaultOwner = api.createType("AccountId32", new Uint8Array(32)).toString();
  const perpetual = new Set();
  for (const [key, value] of flagEntries) {
    assert.equal(value.toJSON(), false, "DecayingLock may only store false");
    perpetual.add(`${key.args[0]}|${key.args[1].toNumber()}`);
  }

  const expected = {
    hotkeyLock: new Map(),
    decayingHotkeyLock: new Map(),
    ownerLock: new Map(),
    decayingOwnerLock: new Map(),
  };
  const expectedReverse = new Set();
  const failures = [];
  let futureTimestampRows = 0;
  let migrationTimestampRows = 0;

  for (const [key, value] of lockEntries) {
    const [coldkeyCodec, netuidCodec, hotkeyCodec] = key.args;
    const coldkey = coldkeyCodec.toString();
    const netuid = netuidCodec.toNumber();
    const hotkey = hotkeyCodec.toString();
    const lock = decodeLockState(value);
    const isOwner = (owners.get(netuid) ?? defaultOwner) === hotkey;
    const isPerpetual = perpetual.has(`${coldkey}|${netuid}`);
    const storageName = aggregateStorageName(isOwner, isPerpetual);
    const aggregateKey = isOwner ? String(netuid) : `${netuid}|${hotkey}`;

    addLock(expected[storageName], aggregateKey, lock);
    expectedReverse.add(`${netuid}|${hotkey}|${coldkey}`);

    if (lock.lastUpdate > BigInt(blockHeight)) futureTimestampRows += 1;
    if (lock.lastUpdate === BigInt(blockHeight)) migrationTimestampRows += 1;
    if (lock.lockedMass === 0n && lock.convictionBits === 0n) {
      failures.push(`dust Lock(${coldkey},${netuid},${hotkey}) was retained`);
    }
  }

  // Patched mainnet chainspecs restart the local header at zero while canonical lock timestamps
  // retain their mainnet heights. roll_lock_state intentionally refuses to roll backward in that
  // environment. On a height-contiguous chain, every retained row must share the migration height.
  if (futureTimestampRows === 0 && migrationTimestampRows !== lockEntries.length) {
    failures.push(
      `${lockEntries.length - migrationTimestampRows} Lock rows were not rolled to block ${blockHeight}`,
    );
  }

  const actualReverse = new Set(
    reverseEntries.map(([key]) => {
      const [netuid, hotkey, coldkey] = key.args;
      return `${netuid.toNumber()}|${hotkey.toString()}|${coldkey.toString()}`;
    }),
  );
  compareSets("LockingColdkeys", expectedReverse, actualReverse, failures);

  const actual = {
    hotkeyLock: await readNetuidHotkeyAggregates(apiAt, "hotkeyLock"),
    decayingHotkeyLock: await readNetuidHotkeyAggregates(apiAt, "decayingHotkeyLock"),
    ownerLock: await readNetuidAggregates(apiAt, "ownerLock"),
    decayingOwnerLock: await readNetuidAggregates(apiAt, "decayingOwnerLock"),
  };
  for (const storageName of Object.keys(expected)) {
    compareAggregates(storageName, expected[storageName], actual[storageName], failures);
  }

  await logger.info(`audit_classification_hash=${classificationHash}`);
  await logger.info(`audit_lock_rows=${lockEntries.length}`);
  await logger.info(`audit_future_timestamp_rows=${futureTimestampRows}`);
  await logger.info(`audit_migration_timestamp_rows=${migrationTimestampRows}`);
  await logger.info(`audit_height_contiguous=${futureTimestampRows === 0}`);
  await logger.info(`audit_reverse_rows=${reverseEntries.length}`);
  await logger.info(`audit_hotkey_aggregate_rows=${actual.hotkeyLock.size}`);
  await logger.info(`audit_decaying_hotkey_aggregate_rows=${actual.decayingHotkeyLock.size}`);
  await logger.info(`audit_owner_aggregate_rows=${actual.ownerLock.size}`);
  await logger.info(`audit_decaying_owner_aggregate_rows=${actual.decayingOwnerLock.size}`);
  await logger.info(`audit_failures=${failures.length}`);
  return failures;
}

async function readNetuidHotkeyAggregates(apiAt, storageName) {
  const entries = await apiAt.query.subtensorModule[storageName].entries();
  return new Map(
    entries.map(([key, value]) => [
      `${key.args[0].toNumber()}|${key.args[1].toString()}`,
      decodeLockState(value),
    ]),
  );
}

async function readNetuidAggregates(apiAt, storageName) {
  const entries = await apiAt.query.subtensorModule[storageName].entries();
  return new Map(
    entries.map(([key, value]) => [String(key.args[0].toNumber()), decodeLockState(value)]),
  );
}

function decodeLockState(value) {
  return {
    lockedMass: parseBigIntish(structField(value, "lockedMass", "locked_mass")),
    convictionBits: decodeConvictionBits(structField(value, "conviction")),
    lastUpdate: parseBigIntish(structField(value, "lastUpdate", "last_update")),
  };
}

function decodeConvictionBits(value) {
  if (value?.bits !== undefined) return parseBigIntish(value.bits);
  if (value?.toBigInt) return value.toBigInt();
  const json = value.toJSON?.();
  if (json?.bits !== undefined) return parseBigIntish(json.bits);
  return parseBigIntish(JSON.parse(value.toString()).bits);
}

function structField(value, ...names) {
  for (const name of names) {
    if (value[name] !== undefined) return value[name];
    const field = value.get?.(name);
    if (field !== undefined) return field;
  }
  const json = value.toJSON?.();
  for (const name of names) {
    if (json?.[name] !== undefined) return json[name];
  }
  throw new Error(`could not decode ${names.join("/")} from ${value}`);
}

function parseBigIntish(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value.replaceAll(",", ""));
  throw new Error(`could not decode bigint from ${value}`);
}

function aggregateStorageName(isOwner, isPerpetual) {
  if (isOwner) return isPerpetual ? "ownerLock" : "decayingOwnerLock";
  return isPerpetual ? "hotkeyLock" : "decayingHotkeyLock";
}

function addLock(map, key, lock) {
  const old = map.get(key);
  if (!old) {
    map.set(key, { ...lock });
    return;
  }
  map.set(key, {
    lockedMass: old.lockedMass + lock.lockedMass,
    convictionBits: old.convictionBits + lock.convictionBits,
    lastUpdate: old.lastUpdate,
  });
}

function compareSets(name, expected, actual, failures) {
  for (const key of expected) {
    if (!actual.has(key)) failures.push(`${name} missing ${key}`);
  }
  for (const key of actual) {
    if (!expected.has(key)) failures.push(`${name} has orphan ${key}`);
  }
}

function compareAggregates(name, expected, actual, failures) {
  for (const [key, expectedLock] of expected) {
    const actualLock = actual.get(key);
    if (!actualLock) {
      failures.push(`${name}(${key}) missing`);
      continue;
    }
    if (
      expectedLock.lockedMass !== actualLock.lockedMass ||
      expectedLock.convictionBits !== actualLock.convictionBits
    ) {
      failures.push(
        `${name}(${key}) expected mass=${expectedLock.lockedMass} conviction_bits=${expectedLock.convictionBits}; actual mass=${actualLock.lockedMass} conviction_bits=${actualLock.convictionBits}`,
      );
    }
    if (actualLock.lastUpdate !== expectedLock.lastUpdate) {
      failures.push(
        `${name}(${key}) last_update=${actualLock.lastUpdate}, expected ${expectedLock.lastUpdate}`,
      );
    }
  }
  for (const key of actual.keys()) {
    if (!expected.has(key)) failures.push(`${name}(${key}) has no canonical Lock rows`);
  }
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
}

function maximum(values) {
  return values.length === 0 ? 0 : Math.max(...values);
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
