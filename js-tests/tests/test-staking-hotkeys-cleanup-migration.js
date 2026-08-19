import assert from "node:assert/strict";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const PAGE_SIZE = Number(process.env.STAKING_HOTKEYS_PAGE_SIZE ?? 1000);
const MIGRATION_TIMEOUT_MS = Number(
  process.env.STAKING_HOTKEYS_MIGRATION_TIMEOUT_MS ?? 30 * 60_000,
);
const PRIOR_RUNTIME = 447;
const CANDIDATE_RUNTIME = 448;
const MIGRATION_NAME = "migrate_cleanup_staking_hotkeys";
const logger = createTempLogger("staking-hotkeys-cleanup-migration.log");

async function main() {
  await logger.start();
  const api = await connectApi(WS_ENDPOINT, { log: (...args) => logger.info(...args) });

  try {
    assertRequiredStorage(api);
    const currentRuntime = await api.rpc.state.getRuntimeVersion();
    assert.equal(
      currentRuntime.specVersion.toNumber(),
      CANDIDATE_RUNTIME,
      `expected runtime ${CANDIDATE_RUNTIME}`,
    );

    const observedHead = await api.rpc.chain.getHeader();
    await logger.info(`test_start_block=${observedHead.number.toString()}`);
    await logger.info(`test_start_wall_clock=${new Date().toISOString()}`);

    const activation = await findRuntimeActivation(api);
    const beforeHeight = activation.height - 1;
    const beforeHash = await api.rpc.chain.getBlockHash(beforeHeight);
    await logger.info(`runtime_activation_block=${activation.height}`);
    await logger.info(`runtime_activation_hash=${activation.hash}`);
    await logger.info(`pre_migration_audit_block=${beforeHeight}`);
    await logger.info(`pre_migration_audit_hash=${beforeHash.toString()}`);

    const before = await auditAt(api, beforeHash.toString(), "before");
    assert.ok(
      before.staleRelationships > 0,
      "pre-upgrade mainnet state had no stale StakingHotkeys relationships to exercise cleanup",
    );

    await waitForMigration(api);
    const completion = await findMigrationCompletion(api);
    const activationTimestampMs = await blockTimestampMs(api, activation.hash);
    const completionTimestampMs = await blockTimestampMs(api, completion.hash);
    const elapsedBlocks = completion.height - activation.height;
    const inclusiveBlocks = elapsedBlocks + 1;
    const elapsedChainMs = completionTimestampMs - activationTimestampMs;

    await logger.info(`migration_completed_block=${completion.height}`);
    await logger.info(`migration_completed_hash=${completion.hash}`);
    await logger.info(`migration_elapsed_blocks=${elapsedBlocks}`);
    await logger.info(`migration_inclusive_block_span=${inclusiveBlocks}`);
    await logger.info(`migration_activation_timestamp_ms=${activationTimestampMs}`);
    await logger.info(`migration_completion_timestamp_ms=${completionTimestampMs}`);
    await logger.info(`migration_elapsed_chain_ms=${elapsedChainMs}`);
    await logger.info(`migration_elapsed_chain_seconds=${(elapsedChainMs / 1000).toFixed(3)}`);

    const after = await auditAt(api, completion.hash, "after");
    assert.equal(
      after.staleRelationships,
      0,
      `found ${after.staleRelationships} StakingHotkeys relationships with neither stake nor basket state`,
    );
    assert.equal(after.emptyRows, 0, `found ${after.emptyRows} empty StakingHotkeys rows`);
    assert.ok(
      after.relationships < before.relationships,
      "StakingHotkeys relationship count did not decrease",
    );
    assert.ok(
      before.staleRelationships >= before.relationships - after.relationships,
      "more StakingHotkeys relationships disappeared than the pre-upgrade stale count",
    );

    await logger.info(`relationships_removed_by_count=${before.relationships - after.relationships}`);
    await logger.info("staking_hotkeys_cleanup_verification=passed");
  } finally {
    await api.disconnect();
    await logger.flush();
  }
}

function assertRequiredStorage(api) {
  assert.ok(
    api.query.subtensorModule?.hasMigrationRun,
    "SubtensorModule.HasMigrationRun is not available",
  );
  assert.ok(
    api.query.subtensorModule?.stakingHotkeys,
    "SubtensorModule.StakingHotkeys is not available",
  );
  assert.ok(api.query.subtensorModule?.alpha, "SubtensorModule.Alpha is not available");
  assert.ok(api.query.subtensorModule?.alphaV2, "SubtensorModule.AlphaV2 is not available");
  assert.ok(
    api.query.subtensorModule?.basketClaimed,
    "SubtensorModule.BasketClaimed is not available",
  );
  assert.ok(api.query.timestamp?.now, "Timestamp.Now is not available");
}

async function findRuntimeActivation(api) {
  const head = await api.rpc.chain.getHeader();
  let height = head.number.toNumber();

  while (height > 0) {
    const hash = await api.rpc.chain.getBlockHash(height);
    const runtime = await api.rpc.state.getRuntimeVersion(hash);
    assert.equal(
      runtime.specVersion.toNumber(),
      CANDIDATE_RUNTIME,
      `unexpected runtime ${runtime.specVersion.toString()} at block ${height}`,
    );

    const priorHash = await api.rpc.chain.getBlockHash(height - 1);
    const priorRuntime = await api.rpc.state.getRuntimeVersion(priorHash);
    if (priorRuntime.specVersion.toNumber() === PRIOR_RUNTIME) {
      return { height, hash: hash.toString() };
    }

    assert.equal(
      priorRuntime.specVersion.toNumber(),
      CANDIDATE_RUNTIME,
      `expected runtime ${PRIOR_RUNTIME} or ${CANDIDATE_RUNTIME} at block ${height - 1}`,
    );
    height -= 1;
  }

  throw new Error(`could not locate runtime ${CANDIDATE_RUNTIME} activation`);
}

async function waitForMigration(api) {
  const deadline = Date.now() + MIGRATION_TIMEOUT_MS;
  let lastLoggedBlock = -1;

  while (Date.now() < deadline) {
    const hash = await api.rpc.chain.getFinalizedHead();
    const [completed, header] = await Promise.all([
      api.query.subtensorModule.hasMigrationRun.at(hash, MIGRATION_NAME),
      api.rpc.chain.getHeader(hash),
    ]);
    const block = header.number.toNumber();

    if (completed.isTrue) {
      await logger.info(`migration_observed_complete_block=${block}`);
      return;
    }

    if (lastLoggedBlock < 0 || block - lastLoggedBlock >= 10) {
      await logger.info(`migration_pending_block=${block}`);
      lastLoggedBlock = block;
    }
    await delay(1000);
  }

  throw new Error(`migration did not complete within ${MIGRATION_TIMEOUT_MS}ms`);
}

async function findMigrationCompletion(api) {
  const head = await api.rpc.chain.getHeader();
  let height = head.number.toNumber();
  let hash = await api.rpc.chain.getBlockHash(height);
  let completed = await api.query.subtensorModule.hasMigrationRun.at(hash, MIGRATION_NAME);
  assert.ok(completed.isTrue, "migration completion marker is not set at the current head");

  while (height > 0) {
    const priorHash = await api.rpc.chain.getBlockHash(height - 1);
    const priorCompleted = await api.query.subtensorModule.hasMigrationRun.at(
      priorHash,
      MIGRATION_NAME,
    );
    if (!priorCompleted.isTrue) {
      return { height, hash: hash.toString() };
    }
    height -= 1;
    hash = priorHash;
    completed = priorCompleted;
  }

  throw new Error("could not locate migration completion boundary");
}

async function blockTimestampMs(api, hash) {
  const value = await api.query.timestamp.now.at(hash);
  return Number(value.toBigInt());
}

async function auditAt(api, blockHash, phase) {
  const apiAt = await api.at(blockHash);
  const stakedPairs = new Set();
  const alphaStats = await collectNonzeroPairs(
    apiAt.query.subtensorModule.alpha,
    stakedPairs,
    `${phase}_Alpha`,
  );
  const alphaV2Stats = await collectNonzeroPairs(
    apiAt.query.subtensorModule.alphaV2,
    stakedPairs,
    `${phase}_AlphaV2`,
  );

  const basketPairs = new Set();
  const basketStats = await collectNonzeroPairs(
    apiAt.query.subtensorModule.basketClaimed,
    basketPairs,
    `${phase}_BasketClaimed`,
  );

  let rows = 0;
  let relationships = 0;
  let relationshipsWithStake = 0;
  let basketProtectedWithoutStake = 0;
  let staleRelationships = 0;
  let emptyRows = 0;
  const staleExamples = [];

  await forEachEntry(
    apiAt.query.subtensorModule.stakingHotkeys,
    `${phase}_StakingHotkeys`,
    async ([key, value]) => {
      const coldkey = key.args[0].toString();
      let rowRelationships = 0;
      rows += 1;

      for (const hotkeyCodec of value) {
        const hotkey = hotkeyCodec.toString();
        const pair = pairKey(hotkey, coldkey);
        rowRelationships += 1;
        relationships += 1;

        if (stakedPairs.has(pair)) {
          relationshipsWithStake += 1;
        } else if (basketPairs.has(pair)) {
          basketProtectedWithoutStake += 1;
        } else {
          staleRelationships += 1;
          if (staleExamples.length < 20) {
            staleExamples.push(`${coldkey}|${hotkey}`);
          }
        }
      }

      if (rowRelationships === 0) {
        emptyRows += 1;
      }
    },
  );

  const stats = {
    rows,
    relationships,
    relationshipsWithStake,
    basketProtectedWithoutStake,
    staleRelationships,
    emptyRows,
  };
  await logger.info(`${phase}_audit=${JSON.stringify(stats)}`);
  await logger.info(`${phase}_stale_examples=${JSON.stringify(staleExamples)}`);
  await logger.info(
    `${phase}_alpha_rows=${alphaStats.rows} ${phase}_alpha_zero_rows=${alphaStats.zeroRows}`,
  );
  await logger.info(
    `${phase}_alpha_v2_rows=${alphaV2Stats.rows} ${phase}_alpha_v2_zero_rows=${alphaV2Stats.zeroRows}`,
  );
  await logger.info(
    `${phase}_basket_claimed_rows=${basketStats.rows} ` +
      `${phase}_basket_claimed_zero_rows=${basketStats.zeroRows}`,
  );
  return stats;
}

async function collectNonzeroPairs(query, destination, label) {
  let rows = 0;
  let zeroRows = 0;

  await forEachEntry(query, label, async ([key, value]) => {
    rows += 1;
    if (codecIsZero(value)) {
      zeroRows += 1;
      return;
    }

    const hotkey = key.args[0].toString();
    const coldkey = key.args[1].toString();
    destination.add(pairKey(hotkey, coldkey));
  });

  return { rows, zeroRows };
}

async function forEachEntry(query, label, visit) {
  let startKey;
  let pages = 0;
  let entriesSeen = 0;

  for (;;) {
    const entries = await query.entriesPaged({ args: [], pageSize: PAGE_SIZE, startKey });
    if (entries.length === 0) {
      break;
    }

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

function pairKey(hotkey, coldkey) {
  return `${hotkey}|${coldkey}`;
}

function codecIsZero(codec) {
  const json = codec.toJSON();
  if (json && typeof json === "object" && "mantissa" in json) {
    return BigInt(json.mantissa) === 0n;
  }
  if (json && typeof json === "object" && "bits" in json) {
    return BigInt(json.bits) === 0n;
  }
  if (typeof codec.toBigInt === "function") {
    return codec.toBigInt() === 0n;
  }
  return BigInt(codec.toString()) === 0n;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
