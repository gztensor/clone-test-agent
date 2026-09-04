import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { blake2AsHex, xxhashAsHex } from "@polkadot/util-crypto";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const PRIOR_RUNTIME = Number(process.env.PRIOR_RUNTIME ?? 452);
const CANDIDATE_RUNTIME = Number(process.env.CANDIDATE_RUNTIME ?? 454);
const PAGE_SIZE = Number(process.env.CLEANUP_PAGE_SIZE ?? 1000);
const POST_COMPLETION_HEADS = Number(process.env.POST_COMPLETION_HEADS ?? 4);
const TEST_TIMEOUT_MS = Number(process.env.CLEANUP_MIGRATION_TIMEOUT_MS ?? 60 * 60_000);
const CODE_STORAGE_KEY = "0x3a636f6465";
const STORAGE_BLOAT_MIGRATION = "migrate_storage_bloat_v3";
const STAKING_HOTKEYS_MIGRATION = "migrate_cleanup_staking_hotkeys_v2";
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
const logger = createTempLogger("runtime-454-cleanup-migrations.log");

const CLEAR_TARGETS = [
  "TotalHotkeyStake",
  "PendingdHotkeyEmission",
  "PendingdHotkeyEmissionUntouchable",
  "LastHotkeyEmissionDrain",
  "StakeDeltaSinceLastEmissionDrain",
  "TotalColdkeyStake",
  "LastAddStakeIncrease",
  "ColdkeyArbitrationBlock",
];

const CLEAR_IF_ZERO_TARGETS = [
  ["Alpha", "alpha"],
  ["TotalHotkeyShares", "totalHotkeyShares"],
  ["TotalHotkeyAlpha", "totalHotkeyAlpha"],
  ["TotalHotkeyAlphaLastEpoch", "totalHotkeyAlphaLastEpoch"],
  ["StakingHotkeys", "stakingHotkeys"],
  ["AlphaV2", "alphaV2"],
];

async function main() {
  await logger.start();
  assert.ok(fs.existsSync(WASM_PATH), `runtime wasm not found: ${WASM_PATH}`);

  const api = await connectApi(WS_ENDPOINT, {
    log: (...args) => logger.info(...args),
    providerTimeoutMs: 300_000,
  });

  try {
    assertRequiredStorage(api);
    const wasm = fs.readFileSync(WASM_PATH);
    const candidateCodeHash = blake2AsHex(wasm, 256);
    const initialRuntime = await api.rpc.state.getRuntimeVersion();
    const initialCodeHash = (await api.rpc.state.getStorageHash(CODE_STORAGE_KEY)).toHex();

    assert.equal(initialRuntime.specVersion.toNumber(), PRIOR_RUNTIME, "unexpected clone runtime");
    assert.notEqual(initialCodeHash, candidateCodeHash, "candidate runtime is already active");
    assert.equal(
      (await migrationMarker(api, STORAGE_BLOAT_MIGRATION)).isTrue,
      false,
      "storage-bloat v3 marker is already set",
    );
    assert.equal(
      (await migrationMarker(api, STAKING_HOTKEYS_MIGRATION)).isTrue,
      false,
      "staking-hotkeys v2 marker is already set",
    );

    await logger.info(`initial_runtime=${initialRuntime.specVersion.toNumber()}`);
    await logger.info(`initial_code_hash=${initialCodeHash}`);
    await logger.info(`candidate_wasm_path=${WASM_PATH}`);
    await logger.info(`candidate_wasm_bytes=${wasm.length}`);
    await logger.info(`candidate_code_hash=${candidateCodeHash}`);

    const beforeHeader = await api.rpc.chain.getHeader();
    const beforeHash = beforeHeader.hash.toString();
    await logger.info(`pre_upgrade_audit_block=${beforeHeader.number.toNumber()}`);
    await logger.info(`pre_upgrade_audit_hash=${beforeHash}`);
    const before = await auditState(api, beforeHash, "before");
    assert.ok(
      before.staking.staleRelationships > 0,
      "snapshot has no stale StakingHotkeys relationship to exercise the cleanup",
    );
    await logger.info(
      `pre_upgrade_bloat_rows_to_scan=${Object.values(before.bloat.targets)
        .reduce((sum, target) => sum + target.rows, 0)}`,
    );

    await logger.info("READY_FOR_RUNTIME_UPGRADE");
    const observations = await observeUntilComplete(api, candidateCodeHash);
    const activationIndex = observations.findIndex(({ codeHash }) => codeHash === candidateCodeHash);
    assert.ok(activationIndex >= 1, "candidate activation boundary was not observed");

    const prior = observations[activationIndex - 1];
    const activation = observations[activationIndex];
    assert.equal(prior.height + 1, activation.height, "activation observations are not adjacent");
    assert.equal(prior.specVersion, PRIOR_RUNTIME, "unexpected runtime before activation");
    assert.equal(activation.specVersion, CANDIDATE_RUNTIME, "candidate is not runtime 454");
    assert.equal(prior.storageBloatDone, false, "storage migration completed before activation");
    assert.equal(prior.stakingHotkeysDone, false, "staking migration completed before activation");

    const storageCompletion = observations
      .slice(activationIndex)
      .find(({ storageBloatDone }) => storageBloatDone);
    const stakingCompletion = observations
      .slice(activationIndex)
      .find(({ stakingHotkeysDone }) => stakingHotkeysDone);
    assert.ok(storageCompletion, "storage-bloat migration did not complete");
    assert.ok(stakingCompletion, "staking-hotkeys migration did not complete");
    assert.ok(
      storageCompletion.height <= stakingCompletion.height,
      "staking-hotkeys cleanup completed before its storage-bloat dependency",
    );
    assert.ok(
      observations.slice(activationIndex, observations.indexOf(storageCompletion) + 1)
        .some(({ storageProgress }) => storageProgress),
      "storage-bloat progress cursor was never observed",
    );
    assert.ok(
      observations.slice(activationIndex, observations.indexOf(stakingCompletion) + 1)
        .some(({ stakingProgress }) => stakingProgress),
      "staking-hotkeys progress cursor was never observed",
    );

    const storageBlocksAfterActivation = storageCompletion.height - activation.height;
    const stakingBlocksAfterActivation = stakingCompletion.height - activation.height;
    await logger.info(`runtime_activation_block=${activation.height}`);
    await logger.info(`storage_bloat_completion_block=${storageCompletion.height}`);
    await logger.info(`storage_bloat_blocks_after_activation=${storageBlocksAfterActivation}`);
    await logger.info(`storage_bloat_inclusive_execution_blocks=${storageBlocksAfterActivation + 1}`);
    await logger.info(`staking_hotkeys_completion_block=${stakingCompletion.height}`);
    await logger.info(`staking_hotkeys_blocks_after_activation=${stakingBlocksAfterActivation}`);
    await logger.info(`total_inclusive_execution_blocks=${stakingBlocksAfterActivation + 1}`);
    await logCadence(observations, activation.height, stakingCompletion.height);

    const after = await auditState(api, stakingCompletion.hash, "after");
    for (const storageName of CLEAR_TARGETS) {
      assert.equal(
        after.bloat.targets[storageName].rows,
        0,
        `${storageName} still contains rows after cleanup`,
      );
    }
    for (const [storageName] of CLEAR_IF_ZERO_TARGETS) {
      assert.equal(
        after.bloat.targets[storageName].zeroRows,
        0,
        `${storageName} still contains exact-zero rows after cleanup`,
      );
      if (storageName !== "StakingHotkeys") {
        assertSetContained(
          before.bloat.targets[storageName].nonzeroKeys,
          after.bloat.targets[storageName].nonzeroKeys,
          `${storageName} lost a pre-upgrade nonzero row`,
        );
      }
    }
    assert.equal(after.staking.staleRelationships, 0, "stale StakingHotkeys relationships remain");
    assert.equal(after.staking.emptyRows, 0, "empty StakingHotkeys rows remain");
    assert.ok(
      after.staking.relationships < before.staking.relationships,
      "StakingHotkeys relationship count did not decrease",
    );

    await logger.info(
      `staking_relationships_removed_by_count=${before.staking.relationships - after.staking.relationships}`,
    );
    await logger.info("verification=passed");
  } finally {
    await api.disconnect();
    await logger.flush();
  }
}

function assertRequiredStorage(api) {
  const required = [
    ["HasMigrationRun", api.query.subtensorModule?.hasMigrationRun],
    ["Alpha", api.query.subtensorModule?.alpha],
    ["AlphaV2", api.query.subtensorModule?.alphaV2],
    ["TotalHotkeyShares", api.query.subtensorModule?.totalHotkeyShares],
    ["TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["TotalHotkeyAlphaLastEpoch", api.query.subtensorModule?.totalHotkeyAlphaLastEpoch],
    ["StakingHotkeys", api.query.subtensorModule?.stakingHotkeys],
    ["BasketClaimed", api.query.subtensorModule?.basketClaimed],
    ["Timestamp.Now", api.query.timestamp?.now],
  ].filter(([, query]) => !query);
  assert.equal(required.length, 0, `missing storage: ${required.map(([name]) => name).join(", ")}`);
}

async function observeUntilComplete(api, candidateCodeHash) {
  const observations = [];
  let unsubscribe;
  let settled = false;
  let queue = Promise.resolve();
  let completionIndex = -1;

  const done = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("timed out observing migrations")), TEST_TIMEOUT_MS);

    api.rpc.chain
      .subscribeNewHeads((header) => {
        const receivedAtMs = Date.now();
        queue = queue.then(async () => {
          if (settled) return;
          const height = header.number.toNumber();
          const hash = header.hash.toString();
          const [runtime, timestamp, codeHash, storageMarker, stakingMarker, storageProgress, stakingProgress] =
            await Promise.all([
              api.rpc.state.getRuntimeVersion(hash),
              api.query.timestamp.now.at(hash),
              api.rpc.state.getStorageHash(CODE_STORAGE_KEY, hash),
              migrationMarker(api, STORAGE_BLOAT_MIGRATION, hash),
              migrationMarker(api, STAKING_HOTKEYS_MIGRATION, hash),
              storageExists(api, storageKey("StorageBloatCleanupMigration"), hash),
              storageExists(api, storageKey("StakingHotkeysCleanupMigration"), hash),
            ]);
          const observation = {
            height,
            hash,
            receivedAtMs,
            timestampMs: Number(timestamp.toBigInt()),
            specVersion: runtime.specVersion.toNumber(),
            codeHash: codeHash.toHex(),
            storageBloatDone: storageMarker.isTrue,
            stakingHotkeysDone: stakingMarker.isTrue,
            storageProgress,
            stakingProgress,
          };
          observations.push(observation);
          await logger.info(
            `head block=${height} runtime=${observation.specVersion} code_hash=${observation.codeHash} ` +
              `storage_done=${observation.storageBloatDone} storage_progress=${storageProgress} ` +
              `staking_done=${observation.stakingHotkeysDone} staking_progress=${stakingProgress} ` +
              `received_at_ms=${receivedAtMs} chain_timestamp_ms=${observation.timestampMs}`,
          );

          if (codeHash.toHex() === candidateCodeHash && observation.stakingHotkeysDone) {
            if (completionIndex < 0) completionIndex = observations.length - 1;
            if (observations.length - completionIndex - 1 >= POST_COMPLETION_HEADS) {
              settled = true;
              clearTimeout(timeout);
              resolve();
            }
          }
        }).catch(reject);
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
    await unsubscribe?.();
  }
  return observations;
}

async function auditState(api, hash, phase) {
  const apiAt = await api.at(hash);
  const targets = {};
  let totalRemovableRows = 0;

  for (const storageName of CLEAR_TARGETS) {
    const rows = await countRawKeys(api, storagePrefix(storageName), hash, `${phase}_${storageName}`);
    targets[storageName] = { rows, zeroRows: null, nonzeroKeys: new Set() };
    totalRemovableRows += rows;
  }

  const alphaPairs = new Set();
  const alphaV2Pairs = new Set();
  for (const [storageName, queryName] of CLEAR_IF_ZERO_TARGETS) {
    const pairDestination = storageName === "Alpha"
      ? alphaPairs
      : storageName === "AlphaV2"
        ? alphaV2Pairs
        : null;
    const stats = await collectKnownMap(
      apiAt.query.subtensorModule[queryName],
      `${phase}_${storageName}`,
      pairDestination,
    );
    targets[storageName] = stats;
    totalRemovableRows += stats.zeroRows;
  }

  const basketPairs = new Set();
  await collectKnownMap(
    apiAt.query.subtensorModule.basketClaimed,
    `${phase}_BasketClaimed`,
    basketPairs,
  );
  const staking = await auditStakingHotkeys(
    apiAt.query.subtensorModule.stakingHotkeys,
    alphaPairs,
    alphaV2Pairs,
    basketPairs,
    phase,
  );
  await logger.info(`${phase}_bloat_total_removable_rows=${totalRemovableRows}`);
  await logger.info(`${phase}_staking_audit=${JSON.stringify(staking)}`);
  return { bloat: { targets, totalRemovableRows }, staking };
}

async function collectKnownMap(query, label, pairDestination = null) {
  let rows = 0;
  let zeroRows = 0;
  const nonzeroKeys = new Set();
  await forEachEntry(query, label, async ([key, value]) => {
    rows += 1;
    if (codecIsZero(value)) {
      zeroRows += 1;
      return;
    }
    nonzeroKeys.add(key.toHex());
    if (pairDestination) {
      pairDestination.add(pairKey(key.args[0].toString(), key.args[1].toString()));
    }
  });
  await logger.info(`${label}_rows=${rows} zero_rows=${zeroRows} nonzero_rows=${nonzeroKeys.size}`);
  return { rows, zeroRows, nonzeroKeys };
}

async function auditStakingHotkeys(query, alphaPairs, alphaV2Pairs, basketPairs, phase) {
  let rows = 0;
  let relationships = 0;
  let staleRelationships = 0;
  let emptyRows = 0;
  const staleExamples = [];

  await forEachEntry(query, `${phase}_StakingHotkeysRelationships`, async ([key, value]) => {
    rows += 1;
    const coldkey = key.args[0].toString();
    if (value.length === 0) emptyRows += 1;
    for (const hotkeyCodec of value) {
      relationships += 1;
      const hotkey = hotkeyCodec.toString();
      const pair = pairKey(hotkey, coldkey);
      if (!alphaPairs.has(pair) && !alphaV2Pairs.has(pair) && !basketPairs.has(pair)) {
        staleRelationships += 1;
        if (staleExamples.length < 20) staleExamples.push(pair);
      }
    }
  });
  await logger.info(`${phase}_stale_relationship_examples=${JSON.stringify(staleExamples)}`);
  return { rows, relationships, staleRelationships, emptyRows };
}

async function forEachEntry(query, label, visit) {
  let startKey;
  let pages = 0;
  let entriesSeen = 0;
  for (;;) {
    const entries = await query.entriesPaged({ args: [], pageSize: PAGE_SIZE, startKey });
    if (entries.length === 0) break;
    pages += 1;
    for (const entry of entries) {
      await visit(entry);
      entriesSeen += 1;
    }
    const nextKey = entries.at(-1)[0].toHex();
    assert.notEqual(nextKey, startKey, `${label} pagination did not advance`);
    startKey = nextKey;
    if (pages === 1 || pages % 100 === 0) {
      await logger.info(`${label}_progress_pages=${pages} entries=${entriesSeen}`);
    }
  }
  await logger.info(`${label}_scan_complete_pages=${pages} entries=${entriesSeen}`);
}

async function countRawKeys(api, prefix, hash, label) {
  let startKey;
  let rows = 0;
  let pages = 0;
  for (;;) {
    const keys = await api.rpc.state.getKeysPaged(prefix, PAGE_SIZE, startKey, hash);
    if (keys.length === 0) break;
    pages += 1;
    rows += keys.length;
    const nextKey = keys.at(-1).toHex();
    assert.notEqual(nextKey, startKey, `${label} raw pagination did not advance`);
    startKey = nextKey;
  }
  await logger.info(`${label}_raw_rows=${rows} pages=${pages}`);
  return rows;
}

async function migrationMarker(api, name, hash = undefined) {
  return hash
    ? api.query.subtensorModule.hasMigrationRun.at(hash, name)
    : api.query.subtensorModule.hasMigrationRun(name);
}

async function storageExists(api, key, hash) {
  const value = await api.rpc.state.getStorage(key, hash);
  return value !== null && value !== undefined && value.toHex() !== "0x";
}

function storagePrefix(storageName) {
  return xxhashAsHex("SubtensorModule", 128) + xxhashAsHex(storageName, 128).slice(2);
}

function storageKey(storageName) {
  return storagePrefix(storageName);
}

function codecIsZero(codec) {
  const json = codec.toJSON();
  if (Array.isArray(json)) return json.length === 0;
  if (json && typeof json === "object" && "mantissa" in json) {
    return BigInt(json.mantissa) === 0n;
  }
  if (json && typeof json === "object" && "bits" in json) {
    return BigInt(json.bits) === 0n;
  }
  if (typeof codec.toBigInt === "function") return codec.toBigInt() === 0n;
  return BigInt(codec.toString()) === 0n;
}

function pairKey(hotkey, coldkey) {
  return `${hotkey}|${coldkey}`;
}

function assertSetContained(before, after, message) {
  const missing = [];
  for (const key of before) {
    if (!after.has(key)) {
      missing.push(key);
      if (missing.length === 5) break;
    }
  }
  assert.equal(missing.length, 0, `${message}: ${missing.join(", ")}`);
}

async function logCadence(observations, activationHeight, completionHeight) {
  const intervals = [];
  for (let index = 1; index < observations.length; index += 1) {
    intervals.push({
      from: observations[index - 1].height,
      to: observations[index].height,
      wallMs: observations[index].receivedAtMs - observations[index - 1].receivedAtMs,
      chainMs: observations[index].timestampMs - observations[index - 1].timestampMs,
    });
  }
  const migrationIntervals = intervals.filter(
    ({ to }) => to >= activationHeight && to <= completionHeight,
  );
  const wallValues = migrationIntervals.map(({ wallMs }) => wallMs);
  await logger.info(`migration_block_intervals=${JSON.stringify(migrationIntervals)}`);
  await logger.info(`migration_interval_wall_ms_max=${Math.max(...wallValues)}`);
  await logger.info(
    `migration_interval_wall_ms_average=${(
      wallValues.reduce((sum, value) => sum + value, 0) / wallValues.length
    ).toFixed(3)}`,
  );
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
