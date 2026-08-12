import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const PHASE = process.env.SNAPSHOT_PHASE;
const BLOCKS_PER_DAY = 7_200;
const ONE_YEAR_BLOCKS = BLOCKS_PER_DAY * 365 + 1_800;
const FORECAST_YEARS = 10;
const FORECAST_BLOCKS = ONE_YEAR_BLOCKS * FORECAST_YEARS;
const MIGRATION_NAME = "migrate_backfill_historical_alpha_burned";
const MAINNET_GENESIS = "0x2f0555cc76fc2840a25a6ea3b9637146806f1f44b090c175ffde2a7e5ab36c03";
const NETUID_ONE_HISTORICAL_BURN = 661_707_044_125_477n;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.resolve(__dirname, "..", "temp");
const BEFORE_JSON = path.join(TEMP_DIR, "subnet-ownership-alpha-before.json");
const REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "subnet-ownership-alpha-accounting-report.md"
);
const logger = createTempLogger(`test-subnet-ownership-alpha-accounting-${PHASE ?? "invalid"}.log`);
logger.captureConsole();

let api;

async function main() {
  await logger.start();
  assert.ok(PHASE === "before" || PHASE === "after", "SNAPSHOT_PHASE must be before or after");

  api = await connectApi(WS_ENDPOINT, { log: console.log, timeoutMs: 120_000 });
  try {
    if (PHASE === "after") {
      assert.ok(fs.existsSync(BEFORE_JSON), `pre-upgrade snapshot missing: ${BEFORE_JSON}`);
      await waitForMigrationAndBlocks();
    }

    const snapshot = await captureSnapshot(PHASE);
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(TEMP_DIR, `subnet-ownership-alpha-${PHASE}.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`
    );

    if (PHASE === "after") {
      const before = JSON.parse(fs.readFileSync(BEFORE_JSON, "utf8"));
      assert.notEqual(
        snapshot.specVersion,
        before.specVersion,
        `runtime spec version did not change from ${before.specVersion}`
      );
      fs.writeFileSync(REPORT_PATH, renderReport(before, snapshot));
      console.log("report:", REPORT_PATH);
    }

    console.log(
      `${PHASE} snapshot complete: subnets=${snapshot.subnets.length}`,
      `king_mismatches=${snapshot.kingMismatches.length}`,
      `alpha_discrepancies_gt_1pct=${snapshot.alphaDiscrepancies.length}`
    );
    assert.equal(snapshot.kingMismatches.length, 0, "local king calculation disagrees with runtime RPC");
  } finally {
    await api?.disconnect();
  }
}

async function waitForMigrationAndBlocks() {
  const start = (await api.rpc.chain.getHeader()).number.toNumber();
  const deadline = Date.now() + 180_000;
  let latest = start;
  let migrationComplete = false;

  while (Date.now() < deadline) {
    latest = (await api.rpc.chain.getHeader()).number.toNumber();
    migrationComplete = await migrationHasRun();
    if (latest >= start + 2 && migrationComplete) {
      console.log(
        `post-upgrade readiness: block advanced ${start} -> ${latest}; ${MIGRATION_NAME}=true`
      );
      return;
    }
    await delay(2_000);
  }

  assert.fail(
    `post-upgrade readiness timed out: block ${start} -> ${latest}; ${MIGRATION_NAME}=${migrationComplete}`
  );
}

async function migrationHasRun() {
  const query = api.query.subtensorModule?.hasMigrationRun;
  if (!query) return false;
  const key = `0x${Buffer.from(MIGRATION_NAME).toString("hex")}`;
  return (await query(key)).isTrue;
}

async function captureSnapshot(phase) {
  assertMetadata();
  const blockHash = await api.rpc.chain.getFinalizedHead();
  const [header, runtimeVersion, chain] = await Promise.all([
    api.rpc.chain.getHeader(blockHash),
    api.rpc.state.getRuntimeVersion(blockHash),
    api.rpc.system.chain(),
  ]);
  const block = header.number.toNumber();
  const cloneMainnetBaseBlock = await readCloneMainnetBaseBlock(blockHash, block);
  const projectionBlock = cloneMainnetBaseBlock === null ? block : cloneMainnetBaseBlock + block;

  console.log(
    `capturing ${phase}: chain=${chain} block=${block} hash=${blockHash}`,
    `runtime=${runtimeVersion.specName}/${runtimeVersion.specVersion}`,
    `projection_block=${projectionBlock}`
  );

  const [unlockRateCodec, maturityRateCodec, networkEntries, totalHotkeyEntries] =
    await Promise.all([
      api.query.subtensorModule.unlockRate.at(blockHash),
      api.query.subtensorModule.maturityRate.at(blockHash),
      api.query.subtensorModule.networksAdded.entriesAt(blockHash),
      api.query.subtensorModule.totalHotkeyAlpha.entriesAt(blockHash),
    ]);
  const unlockRate = Number(unlockRateCodec.toString());
  const maturityRate = Number(maturityRateCodec.toString());
  const netuids = networkEntries
    .filter(([, added]) => added.isTrue)
    .map(([key]) => key.args[0].toNumber())
    .filter((netuid) => netuid > 0)
    .sort((a, b) => a - b);

  const actualStake = new Map(netuids.map((netuid) => [netuid, 0n]));
  for (const [key, value] of totalHotkeyEntries) {
    const netuid = key.args[1].toNumber();
    actualStake.set(netuid, (actualStake.get(netuid) ?? 0n) + codecBigInt(value));
  }

  const [ownerRows, aggregateLocks, pending, basketPending] = await Promise.all([
    readOwnerRows(blockHash, netuids),
    readAggregateLocks(blockHash),
    readPendingBySubnet(blockHash, netuids),
    readPendingBasketBySubnet(blockHash),
  ]);
  for (const [netuid, amount] of basketPending) {
    const row = pending.get(netuid);
    if (row) row.basket += amount;
  }

  const hotkeys = collectHotkeys(ownerRows, aggregateLocks);
  const owningColdkeys = await readOwningColdkeys(blockHash, hotkeys);
  const kingMismatches = [];
  const alphaDiscrepancies = [];
  const subnets = [];

  for (const ownerRow of ownerRows) {
    const { netuid } = ownerRow;
    const [
      alphaOutCodec,
      protocolAlphaCodec,
      burnedAlphaCodec,
      registeredAtCodec,
      tempoCodec,
      lastEpochBlockCodec,
      pendingEpochAtCodec,
    ] =
      await Promise.all([
        api.query.subtensorModule.subnetAlphaOut.at(blockHash, netuid),
        optionalAt(api.query.subtensorModule.subnetProtocolAlpha, blockHash, netuid),
        optionalAt(api.query.alphaAssets?.alphaBurned, blockHash, netuid),
        api.query.subtensorModule.networkRegisteredAt.at(blockHash, netuid),
        api.query.subtensorModule.tempo.at(blockHash, netuid),
        optionalAt(api.query.subtensorModule.lastEpochBlock, blockHash, netuid),
        optionalAt(api.query.subtensorModule.pendingEpochAt, blockHash, netuid),
      ]);
    const rpcKingCodec = await getMostConvictedHotkey(blockHash, netuid);
    const alphaOut = codecBigInt(alphaOutCodec);
    const protocolAlpha = codecBigInt(protocolAlphaCodec);
    const burnedAlpha = codecBigInt(burnedAlphaCodec);
    const pendingRow = pending.get(netuid);
    const pendingAlpha = Object.values(pendingRow).reduce((sum, value) => sum + value, 0n);
    const calculatedStake = saturatingSub(alphaOut, burnedAlpha, protocolAlpha, pendingAlpha);
    const actual = actualStake.get(netuid) ?? 0n;
    const difference = actual - calculatedStake;
    const discrepancyPct = percentDifference(actual, calculatedStake);
    const discrepancyOverOnePercent =
      calculatedStake === 0n ? actual !== 0n : discrepancyPct > 1;
    if (discrepancyOverOnePercent) alphaDiscrepancies.push(netuid);

    const locks = aggregateLocks
      .filter((lock) => lock.netuid === netuid)
      .map((lock) => ({ ...lock, ownerAddress: ownerRow.ownerHotkey }));
    const rpcDomainScores = scoreLocks(locks, block, unlockRate, maturityRate, ownerRow.ownerHotHex);
    const localKing = selectKing(rpcDomainScores);
    const rpcKing = optionAccount(rpcKingCodec);
    if (localKing?.hex !== rpcKing?.hex) {
      kingMismatches.push({ netuid, local: localKing?.address, rpc: rpcKing?.address });
    }

    const thresholdBase =
      phase === "before" ? alphaOut : saturatingSub(alphaOut, burnedAlpha, protocolAlpha);
    const threshold = Number(thresholdBase) / 10;
    const registeredAt = Number(registeredAtCodec.toString());
    const tempo = Number(tempoCodec.toString());
    const projection = projectTakeover({
      phase,
      block: projectionBlock,
      netuid,
      tempo,
      lastEpochBlock: Number(codecBigInt(lastEpochBlockCodec)),
      pendingEpochAt: Number(codecBigInt(pendingEpochAtCodec)),
      registeredAt,
      threshold,
      locks,
      unlockRate,
      maturityRate,
      ownerHotHex: ownerRow.ownerHotHex,
      ownerColdHex: ownerRow.ownerColdHex,
      owningColdkeys,
    });
    const projectionScores = scoreLocks(
      locks,
      projectionBlock,
      unlockRate,
      maturityRate,
      ownerRow.ownerHotHex
    );

    subnets.push({
      phase,
      netuid,
      ownerHotkey: ownerRow.ownerHotkey,
      ownerColdkey: ownerRow.ownerColdkey,
      kingHotkey: rpcKing?.address ?? null,
      kingColdkey: rpcKing ? owningColdkeys.get(rpcKing.hex)?.address ?? null : null,
      totalConviction: projectionScores.total,
      threshold,
      thresholdBase: thresholdBase.toString(),
      thresholdMet: projectionScores.total >= threshold,
      registeredAt,
      mature: projectionBlock >= registeredAt + ONE_YEAR_BLOCKS,
      tempo,
      projection,
      alphaOut: alphaOut.toString(),
      burnedAlpha: burnedAlpha.toString(),
      protocolAlpha: protocolAlpha.toString(),
      pendingServer: pendingRow.server.toString(),
      pendingValidator: pendingRow.validator.toString(),
      pendingRoot: pendingRow.root.toString(),
      pendingOwner: pendingRow.owner.toString(),
      pendingBasket: pendingRow.basket.toString(),
      pendingAlpha: pendingAlpha.toString(),
      actualStake: actual.toString(),
      calculatedStake: calculatedStake.toString(),
      difference: difference.toString(),
      discrepancyPct,
      discrepancyOverOnePercent,
    });
  }

  return {
    phase,
    capturedAt: new Date().toISOString(),
    genesisHash: api.genesisHash.toHex(),
    chain: chain.toString(),
    block,
    cloneMainnetBaseBlock,
    projectionBlock,
    blockHash: blockHash.toString(),
    specName: runtimeVersion.specName.toString(),
    specVersion: runtimeVersion.specVersion.toNumber(),
    unlockRate,
    maturityRate,
    migrationComplete: await migrationHasRun(),
    pendingBasketStorageAvailable: Boolean(api.query.subtensorModule.pendingBasketDeposits),
    alphaBurnedStorageAvailable: Boolean(api.query.alphaAssets?.alphaBurned),
    kingMismatches,
    alphaDiscrepancies,
    subnets,
  };
}

async function readCloneMainnetBaseBlock(blockHash, localBlock) {
  const entries = await api.query.system.blockHash.entriesAt(blockHash);
  const highest = entries.reduce((max, [key]) => Math.max(max, key.args[0].toNumber()), 0);
  // A patched clone retains the mainnet BlockHash window while restarting local numbering at 0.
  // At state block N, the highest retained hash key is normally N-1.
  return highest > localBlock + 100_000 ? highest + 1 : null;
}

function assertMetadata() {
  const required = [
    ["NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubnetOwner", api.query.subtensorModule?.subnetOwner],
    ["SubnetOwnerHotkey", api.query.subtensorModule?.subnetOwnerHotkey],
    ["NetworkRegisteredAt", api.query.subtensorModule?.networkRegisteredAt],
    ["TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubnetAlphaOut", api.query.subtensorModule?.subnetAlphaOut],
    ["HotkeyLock", api.query.subtensorModule?.hotkeyLock],
    ["DecayingHotkeyLock", api.query.subtensorModule?.decayingHotkeyLock],
    ["OwnerLock", api.query.subtensorModule?.ownerLock],
    ["DecayingOwnerLock", api.query.subtensorModule?.decayingOwnerLock],
    ["UnlockRate", api.query.subtensorModule?.unlockRate],
    ["MaturityRate", api.query.subtensorModule?.maturityRate],
    ["StakeInfoRuntimeApi.getMostConvictedHotkeyOnSubnet", api.call.stakeInfoRuntimeApi?.getMostConvictedHotkeyOnSubnet],
  ].filter(([, value]) => !value);
  assert.equal(required.length, 0, `missing metadata: ${required.map(([name]) => name).join(", ")}`);
}

async function readOwnerRows(blockHash, netuids) {
  return Promise.all(
    netuids.map(async (netuid) => {
      const [ownerHot, ownerCold] = await Promise.all([
        api.query.subtensorModule.subnetOwnerHotkey.at(blockHash, netuid),
        api.query.subtensorModule.subnetOwner.at(blockHash, netuid),
      ]);
      return {
        netuid,
        ownerHotkey: ownerHot.toString(),
        ownerHotHex: ownerHot.toHex(),
        ownerColdkey: ownerCold.toString(),
        ownerColdHex: ownerCold.toHex(),
      };
    })
  );
}

async function readAggregateLocks(blockHash) {
  const definitions = [
    ["hotkeyLock", false, true],
    ["decayingHotkeyLock", false, false],
    ["ownerLock", true, true],
    ["decayingOwnerLock", true, false],
  ];
  const results = [];
  for (const [storage, ownerLock, perpetual] of definitions) {
    const entries = await api.query.subtensorModule[storage].entriesAt(blockHash);
    for (const [key, value] of entries) {
      const netuid = key.args[0].toNumber();
      const hotkey = ownerLock ? null : account(key.args[1]);
      results.push({ netuid, hotkey, ownerLock, perpetual, ...decodeLock(value) });
    }
  }
  return results;
}

async function readPendingBySubnet(blockHash, netuids) {
  const result = new Map();
  for (const netuid of netuids) {
    const [server, validator, root, owner] = await Promise.all([
      optionalAt(api.query.subtensorModule.pendingServerEmission, blockHash, netuid),
      optionalAt(api.query.subtensorModule.pendingValidatorEmission, blockHash, netuid),
      optionalAt(api.query.subtensorModule.pendingRootAlphaDivs, blockHash, netuid),
      optionalAt(api.query.subtensorModule.pendingOwnerCut, blockHash, netuid),
    ]);
    result.set(netuid, {
      server: codecBigInt(server),
      validator: codecBigInt(validator),
      root: codecBigInt(root),
      owner: codecBigInt(owner),
      basket: 0n,
    });
  }
  return result;
}

async function readPendingBasketBySubnet(blockHash) {
  const query = api.query.subtensorModule.pendingBasketDeposits;
  if (!query) return new Map();
  const result = new Map();
  for (const [key, value] of await query.entriesAt(blockHash)) {
    const netuid = key.args[1].toNumber();
    result.set(netuid, (result.get(netuid) ?? 0n) + codecBigInt(value));
  }
  return result;
}

function collectHotkeys(ownerRows, locks) {
  const result = new Map(ownerRows.map((row) => [row.ownerHotHex, { hex: row.ownerHotHex, address: row.ownerHotkey }]));
  for (const lock of locks) {
    if (lock.hotkey) result.set(lock.hotkey.hex, lock.hotkey);
  }
  return result;
}

async function readOwningColdkeys(blockHash, hotkeys) {
  const result = new Map();
  await Promise.all(
    [...hotkeys.values()].map(async (hotkey) => {
      const coldkey = await api.query.subtensorModule.owner.at(blockHash, hotkey.address);
      result.set(hotkey.hex, account(coldkey));
    })
  );
  return result;
}

function projectTakeover(params) {
  const maturityBlock = params.registeredAt + ONE_YEAR_BLOCKS;
  const currentScores = scoreLocks(
    params.locks,
    params.block,
    params.unlockRate,
    params.maturityRate,
    params.ownerHotHex
  );
  const currentKing = selectKing(currentScores);
  const currentKingCold = currentKing ? params.owningColdkeys.get(currentKing.hex) : null;
  const canTakeOverNow =
    params.block >= maturityBlock &&
    currentScores.total >= params.threshold &&
    currentKing &&
    currentKingCold &&
    !isDefaultAccount(currentKingCold.hex) &&
    currentKingCold.hex !== params.ownerColdHex;
  if (canTakeOverNow) {
    return {
      status: "immediate",
      block: params.block,
      blocks: 0,
      king: currentKing.address,
      kingColdkey: currentKingCold.address,
      conviction: currentScores.total,
    };
  }
  const firstEligibleBlock = Math.max(params.block + 1, maturityBlock);
  if (params.tempo === 0) return { status: "no epochs", block: null, blocks: null, king: null };

  let checkBlock = nextEpochBlock(params);
  while (checkBlock < firstEligibleBlock) {
    const periods = Math.ceil((firstEligibleBlock - checkBlock) / epochPeriod(params.phase, params.tempo));
    checkBlock += periods * epochPeriod(params.phase, params.tempo);
  }

  const end = params.block + FORECAST_BLOCKS;
  for (; checkBlock <= end; checkBlock += epochPeriod(params.phase, params.tempo)) {
    const scores = scoreLocks(
      params.locks,
      checkBlock,
      params.unlockRate,
      params.maturityRate,
      params.ownerHotHex
    );
    if (scores.total < params.threshold) continue;
    const king = selectKing(scores);
    if (!king) continue;
    const kingCold = params.owningColdkeys.get(king.hex);
    if (!kingCold || isDefaultAccount(kingCold.hex) || kingCold.hex === params.ownerColdHex) continue;
    return {
      status: "projected",
      block: checkBlock,
      blocks: checkBlock - params.block,
      king: king.address,
      kingColdkey: kingCold.address,
      conviction: scores.total,
    };
  }
  return {
    status: `not projected within ${FORECAST_YEARS}y`,
    block: null,
    blocks: null,
    king: null,
  };
}

function nextEpochBlock(params) {
  // The dynamic-tempo migration deliberately preserves the first legacy epoch slot.
  // Compute it in the virtual mainnet block domain because clone-local scheduler state is rebased.
  const period = params.tempo + 1;
  const remainder = (params.block + params.netuid + 1) % period;
  return params.block + (params.tempo - remainder || period);
}

function epochPeriod(phase, tempo) {
  return phase === "before" ? tempo + 1 : tempo;
}

function scoreLocks(locks, now, unlockRate, maturityRate, ownerHotHex) {
  const scores = new Map();
  let total = 0;
  for (const lock of locks) {
    const conviction = rollLock(lock, now, unlockRate, maturityRate);
    const hotkey = lock.ownerLock
      ? { hex: ownerHotHex, address: lock.ownerAddress }
      : lock.hotkey;
    if (!hotkey) continue;
    const existing = scores.get(hotkey.hex) ?? { ...hotkey, score: 0 };
    existing.score += conviction;
    scores.set(hotkey.hex, existing);
    total += conviction;
  }
  scores.total = total;
  return scores;
}

function rollLock(lock, now, unlockRate, maturityRate) {
  const dt = Math.max(0, now - lock.lastUpdate);
  if (dt === 0) return lock.ownerLock ? lock.lockedMass : lock.conviction;
  const unlockDecay = expDecay(dt, unlockRate);
  const maturityDecay = expDecay(dt, maturityRate);
  const mass = lock.perpetual ? lock.lockedMass : unlockDecay * lock.lockedMass;
  if (lock.ownerLock) return mass;
  const fromExisting = maturityDecay * lock.conviction;
  let fromMass = 0;
  if (lock.perpetual) {
    fromMass = lock.lockedMass * (1 - maturityDecay);
  } else if (unlockRate === maturityRate) {
    fromMass = lock.lockedMass * (dt / maturityRate) * maturityDecay;
  } else if (unlockRate > 0 && maturityRate > 0) {
    fromMass = lock.lockedMass * unlockRate * (unlockDecay - maturityDecay) / (unlockRate - maturityRate);
  }
  return Math.max(0, fromExisting + fromMass);
}

function expDecay(dt, rate) {
  return rate === 0 ? 0 : Math.exp(-dt / rate);
}

function selectKing(scores) {
  let king;
  for (const value of scores.values()) {
    if (!value || typeof value !== "object") continue;
    if (!king || value.score > king.score || (value.score === king.score && value.hex > king.hex)) {
      king = value;
    }
  }
  return king;
}

function decodeLock(value) {
  return {
    lockedMass: Number(codecBigInt(field(value, "lockedMass", "locked_mass"))),
    conviction: Number(convictionBits(field(value, "conviction"))) / 2 ** 64,
    lastUpdate: Number(codecBigInt(field(value, "lastUpdate", "last_update"))),
  };
}

function field(value, ...names) {
  for (const name of names) {
    if (value[name] !== undefined) return value[name];
    const found = value.get?.(name);
    if (found !== undefined) return found;
  }
  const json = value.toJSON?.();
  for (const name of names) {
    if (json?.[name] !== undefined) return json[name];
  }
  throw new Error(`missing ${names.join("/")} in ${value}`);
}

function convictionBits(value) {
  if (value?.bits !== undefined) return codecBigInt(value.bits);
  const json = value?.toJSON?.();
  if (json?.bits !== undefined) return codecBigInt(json.bits);
  if (value?.toBigInt) return value.toBigInt();
  const parsed = JSON.parse(value.toString());
  return codecBigInt(parsed.bits);
}

function codecBigInt(value) {
  if (value === null || value === undefined) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value.replaceAll(",", ""));
  if (value.toBigInt) return value.toBigInt();
  return BigInt(value.toString().replaceAll(",", ""));
}

function account(value) {
  return { address: value.toString(), hex: value.toHex() };
}

function optionAccount(value) {
  if (value?.isNone) return null;
  return account(value?.isSome ? value.unwrap() : value);
}

function isDefaultAccount(hex) {
  return /^0x0+$/.test(hex);
}

async function getMostConvictedHotkey(blockHash, netuid) {
  const method = api.call.stakeInfoRuntimeApi.getMostConvictedHotkeyOnSubnet;
  return typeof method.at === "function" ? method.at(blockHash, netuid) : method(netuid);
}

async function optionalAt(query, blockHash, ...args) {
  return query ? query.at(blockHash, ...args) : null;
}

function saturatingSub(value, ...subtrahends) {
  return subtrahends.reduce((result, amount) => (result > amount ? result - amount : 0n), value);
}

function percentDifference(actual, calculated) {
  if (calculated === 0n) return actual === 0n ? 0 : null;
  const scaled = (absBigInt(actual - calculated) * 1_000_000n) / calculated;
  return Number(scaled) / 10_000;
}

function absBigInt(value) {
  return value < 0n ? -value : value;
}

function renderReport(before, after) {
  const discrepancyRows = [...before.subnets, ...after.subnets].filter(
    (row) => row.discrepancyOverOnePercent
  );
  return `# Subnet ownership conviction and alpha accounting\n\n` +
    `Generated: ${new Date().toISOString()}\n\n` +
    `## Run summary\n\n` +
    `| Phase | Block | Runtime | Migration complete | Subnets | King calculation mismatches | Alpha discrepancies >1% |\n` +
    `|---|---:|---|---|---:|---:|---:|\n` +
    summaryRow(before) + summaryRow(after) + `\n` +
    migrationFinding(before, after) +
    `The pre-upgrade ownership threshold is \`10% × SubnetAlphaOut\`. The post-upgrade threshold is ` +
    `\`10% × (SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha)\`. Conviction forecasts roll the ` +
    `four aggregate lock buckets forward with the runtime exponential equations and evaluate only scheduled epoch ` +
    `checks. Clone-local block numbers are rebased onto the preserved mainnet BlockHash window before evaluating ` +
    `registration age or lock evolution. Forecasts assume no future lock transactions and hold alpha supply/counters ` +
    `constant. “Not projected” means no ` +
    `qualifying different-owner king was found in the ${FORECAST_YEARS}-year forecast window.\n\n` +
    taoswapComparison(before, after) +
    changedTakeoverSection(before, after) +
    ownershipSection(before) + ownershipSection(after) +
    alphaSection(before) + alphaSection(after) +
    `## Discrepancies greater than 1%\n\n` +
    (discrepancyRows.length === 0
      ? `None.\n\n`
      : alphaTable(discrepancyRows, true) + `\n`) +
    `## Accounting definitions\n\n` +
    `- Actual staked alpha: sum of every \`TotalHotkeyAlpha(hotkey, netuid)\` value.\n` +
    `- Pending alpha: \`PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + ` +
    `PendingOwnerCut + PendingBasketDeposits\`.\n` +
    `- Calculated staked alpha: saturating \`SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha - pending alpha\`.\n` +
    `- Discrepancy percentage: \`abs(actual - calculated) / calculated × 100\`.\n`;
}

function taoswapComparison(before, after) {
  const beforeThree = before.subnets.find((row) => row.netuid === 3);
  const afterThree = after.subnets.find((row) => row.netuid === 3);
  if (!beforeThree || !afterThree) return "";
  return `## Subnet 3 comparison with TaoSwap\n\n` +
    `At review time, the [TaoSwap conviction page](https://taoswap.org/explore/subnets/3/conviction) ` +
    `showed approximately \`244.29K α\` conviction against the live pre-upgrade \`281.36K α\` threshold, ` +
    `with about \`19 days\` still maturing. This clone was exported from a different mainnet block, so its corrected ` +
    `pre-upgrade snapshot is \`${formatAlphaNumber(beforeThree.totalConviction)} α\` against ` +
    `\`${formatAlphaNumber(beforeThree.threshold)} α\`, predicting ` +
    `\`${takeoverInterval(beforeThree.projection)}\`. After the experimental upgrade, subnet 3 requires ` +
    `\`${formatAlphaNumber(afterThree.threshold)} α\`; the existing conviction already clears that threshold, ` +
    `so its takeover interval is \`${takeoverInterval(afterThree.projection)}\`.\n\n`;
}

function changedTakeoverSection(before, after) {
  const beforeByNetuid = new Map(before.subnets.map((row) => [row.netuid, row]));
  const changed = after.subnets
    .map((afterRow) => ({ before: beforeByNetuid.get(afterRow.netuid), after: afterRow }))
    .filter(({ before: beforeRow, after: afterRow }) =>
      takeoverInterval(beforeRow.projection) !== takeoverInterval(afterRow.projection) ||
      beforeRow.projection.king !== afterRow.projection.king
    );
  let result = `## Changed subnet ownership takeover predictions\n\n` +
    `| Subnet netuid | Predicted takeover time interval before | Predicted takeover king before | Predicted takeover time interval after | Predicted takeover king after |\n` +
    `|---:|---|---|---|---|\n`;
  if (changed.length === 0) return `${result}| — | — | — | — | — |\n\n`;
  result += changed.map(({ before: beforeRow, after: afterRow }) =>
    `| ${afterRow.netuid} | ${takeoverInterval(beforeRow.projection)} | ` +
    `${shortAccount(beforeRow.projection.king)} | ${takeoverInterval(afterRow.projection)} | ` +
    `${shortAccount(afterRow.projection.king)} |\n`
  ).join("");
  return `${result}\n`;
}

function takeoverInterval(projection) {
  if (projection.status === "immediate") return "0";
  if (projection.status === "projected") return formatDuration(projection.blocks);
  return projection.status;
}

function migrationFinding(before, after) {
  const beforeOne = before.subnets.find((row) => row.netuid === 1);
  const afterOne = after.subnets.find((row) => row.netuid === 1);
  const observedBackfill = BigInt(afterOne.burnedAlpha) - BigInt(beforeOne.burnedAlpha);
  const backfillApplied =
    observedBackfill > 0n && observedBackfill * 100n >= NETUID_ONE_HISTORICAL_BURN * 99n;
  if (backfillApplied) {
    const comparison = observedBackfill === NETUID_ONE_HISTORICAL_BURN
      ? "exactly matched"
      : "closely matched after other generation-rebase corrections";
    return `> **Migration verification:** the historical-alpha correction applied on the clone despite its ` +
      `non-mainnet genesis \`${after.genesisHash}\`. Subnet 1 expected approximately ` +
      `\`+${formatAlpha(NETUID_ONE_HISTORICAL_BURN)} α\` and observed ` +
      `\`+${formatAlpha(observedBackfill)} α\`; this ${comparison}. After all migrations, ` +
      `\`${after.alphaDiscrepancies.length}\` subnets exceed 1% discrepancy.\n\n`;
  }
  if (after.genesisHash === MAINNET_GENESIS || after.alphaDiscrepancies.length === 0) return "";
  return `> **Critical migration finding:** the clone genesis is \`${after.genesisHash}\`, not the ` +
    `hard-coded mainnet genesis \`${MAINNET_GENESIS}\`. The historical-alpha migration marked itself complete ` +
    `but skipped its corrections. Subnet 1 should have received a historical ` +
    `\`+${formatAlpha(NETUID_ONE_HISTORICAL_BURN)} α\` backfill; instead its observed ` +
    `\`AlphaBurned\` values were \`${formatAlpha(beforeOne.burnedAlpha)} α → ` +
    `${formatAlpha(afterOne.burnedAlpha)} α\` (other upgrade rebases can change the counter), and ` +
    `\`${after.alphaDiscrepancies.length}\` subnets still exceed 1% discrepancy after the upgrade.\n\n`;
}

function summaryRow(snapshot) {
  return `| ${snapshot.phase} | ${snapshot.block} | ${snapshot.specName}/${snapshot.specVersion} | ` +
    `${snapshot.migrationComplete} | ${snapshot.subnets.length} | ${snapshot.kingMismatches.length} | ` +
    `${snapshot.alphaDiscrepancies.length} |\n`;
}

function ownershipSection(snapshot) {
  return `## ${capitalize(snapshot.phase)} upgrade: subnet kings and takeover projection\n\n` +
    `Snapshot clone block: \`${snapshot.block}\`; projection mainnet block: ` +
    `\`${snapshot.projectionBlock ?? snapshot.block}\` (\`${snapshot.blockHash}\`)\n\n` +
    `Unlock rate: \`${snapshot.unlockRate}\`; maturity rate: \`${snapshot.maturityRate}\`\n\n` +
    `| Netuid | Current owner hotkey | RPC king | Conviction α | Required α | Gate | Mature | Projected takeover | Projected king |\n` +
    `|---:|---|---|---:|---:|---|---|---|---|\n` +
    snapshot.subnets.map(ownershipRow).join("") + `\n`;
}

function ownershipRow(row) {
  const eta = row.projection.status === "immediate"
    ? "0"
    : row.projection.status === "projected"
    ? `${formatDuration(row.projection.blocks)} (block ${row.projection.block})`
    : row.projection.status;
  return `| ${row.netuid} | ${shortAccount(row.ownerHotkey)} | ${shortAccount(row.kingHotkey)} | ` +
    `${formatAlphaNumber(row.totalConviction)} | ${formatAlphaNumber(row.threshold)} | ` +
    `${row.thresholdMet ? "met" : "not met"} | ${row.mature ? "yes" : "no"} | ${eta} | ` +
    `${shortAccount(row.projection.king)} |\n`;
}

function alphaSection(snapshot) {
  return `## ${capitalize(snapshot.phase)} upgrade: staked alpha consistency\n\n` +
    alphaTable(snapshot.subnets, false) + `\n`;
}

function alphaTable(rows, includePhase) {
  const phaseHeader = includePhase ? " Phase |" : "";
  const phaseDivider = includePhase ? "---|" : "";
  return `|${phaseHeader} Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |\n` +
    `|${phaseDivider}---:|---:|---:|---:|---:|---:|---:|---:|---:|---|\n` +
    rows.map((row) => {
      const phase = includePhase ? ` ${row.phase ?? ""} |` : "";
      return `|${phase} ${row.netuid} | ${formatAlpha(row.alphaOut)} | ${formatAlpha(row.burnedAlpha)} | ` +
        `${formatAlpha(row.protocolAlpha)} | ${formatAlpha(row.pendingAlpha)} | ${formatAlpha(row.actualStake)} | ` +
        `${formatAlpha(row.calculatedStake)} | ${formatSignedAlpha(row.difference)} | ` +
        `${row.discrepancyPct === null ? "∞" : row.discrepancyPct.toFixed(4)}% | ` +
        `${row.discrepancyOverOnePercent ? "**DISCREPANCY >1%**" : "OK"} |\n`;
    }).join("");
}

function formatAlpha(raw) {
  const value = BigInt(raw);
  const whole = value / 1_000_000_000n;
  const fraction = (value % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  return `${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
}

function formatSignedAlpha(raw) {
  const value = BigInt(raw);
  return `${value > 0n ? "+" : value < 0n ? "-" : ""}${formatAlpha(absBigInt(value))}`;
}

function formatAlphaNumber(raw) {
  return (raw / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function formatDuration(blocks) {
  if (blocks < BLOCKS_PER_DAY) return `${blocks.toLocaleString()} blocks`;
  const days = blocks / BLOCKS_PER_DAY;
  return days < 365 ? `${days.toFixed(1)} days` : `${(days / 365).toFixed(2)} years`;
}

function shortAccount(value) {
  return value ? `\`${value.slice(0, 7)}…${value.slice(-6)}\`` : "—";
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
