import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const PAGE_SIZE = Number(process.env.STORAGE_PAGE_SIZE ?? 1_000);
const PAGE_DELAY_MS = Number(process.env.STORAGE_PAGE_DELAY_MS ?? 300);
const POST_UPGRADE_OFFSET = Number(process.env.POST_UPGRADE_OFFSET ?? 5);
const TWO_TEMPO_BLOCKS = 720;
const MIGRATION_NAMES = [
  "migrate_fix_rao_alpha_out_accounting",
  "migrate_rebase_recycled_alpha_asset_counters",
  "migrate_backfill_historical_alpha_burned",
];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "mainnet-alpha-accounting-post-446-to-current-report.md"
);
const TWO_TEMPO_REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "mainnet-alpha-accounting-two-tempos-report.md"
);
const logger = createTempLogger("mainnet-alpha-accounting-post-446-to-current.log");
logger.captureConsole();

let api;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, {
    log: (message) => console.log(redactEndpoint(message)),
    timeoutMs: 120_000,
    providerTimeoutMs: 120_000,
  });

  try {
    assertMetadata();

    const finalizedHash = await api.rpc.chain.getFinalizedHead();
    const finalizedHeader = await api.rpc.chain.getHeader(finalizedHash);
    const finalizedHeight = finalizedHeader.number.toNumber();
    const versionCache = new Map();
    const runtime446Start = await findFirstRuntimeAtLeast(446, finalizedHeight, versionCache);
    const runtime447Start = await findFirstRuntimeAtLeast(447, finalizedHeight, versionCache);
    const earlierHeight = runtime446Start + POST_UPGRADE_OFFSET;
    assert.ok(earlierHeight < runtime447Start, "post-446 snapshot is not in runtime 446");

    const earlierHash = (await api.rpc.chain.getBlockHash(earlierHeight)).toString();
    const [chain, earlierRuntime, laterRuntime, earlierNetuids, laterNetuids] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.state.getRuntimeVersion(earlierHash),
      api.rpc.state.getRuntimeVersion(finalizedHash),
      readActiveNetuids(earlierHash),
      readActiveNetuids(finalizedHash.toString()),
    ]);
    assert.equal(earlierRuntime.specVersion.toNumber(), 446, "earlier snapshot is not runtime 446");
    assert.deepEqual(earlierNetuids, laterNetuids, "active alpha-subnet set changed in interval");

    const migrationStatus = await readMigrationStatus(earlierHash);
    assert.ok(
      Object.values(migrationStatus).every(Boolean),
      `accounting migration was incomplete at earlier snapshot: ${JSON.stringify(migrationStatus)}`
    );
    const priorNoise = readTwoTempoNoise();
    const intervalBlocks = finalizedHeight - earlierHeight;

    console.log("chain:", chain.toString());
    console.log("runtime 446 first post-state block:", runtime446Start);
    console.log("runtime 447 first post-state block:", runtime447Start);
    console.log("earlier snapshot:", earlierHeight, earlierHash);
    console.log("later snapshot:", finalizedHeight, finalizedHash.toString());
    console.log("interval blocks:", intervalBlocks);
    console.log("earlier runtime:", earlierRuntime.specVersion.toString());
    console.log("later runtime:", laterRuntime.specVersion.toString());
    console.log("active alpha subnets:", earlierNetuids.length);
    console.log("migration markers:", JSON.stringify(migrationStatus));
    console.log("prior two-tempo maximum movement rao:", priorNoise.maxMovement.toString());

    const earlier = await readAccountingSnapshot(
      { height: earlierHeight, hash: earlierHash },
      earlierNetuids,
      "post-446"
    );
    const later = await readAccountingSnapshot(
      { height: finalizedHeight, hash: finalizedHash.toString() },
      laterNetuids,
      "recent"
    );
    const comparisons = earlierNetuids.map((netuid) => compareRows(
      earlier.rows.get(netuid),
      later.rows.get(netuid),
      intervalBlocks,
      priorNoise.maxMovement
    ));
    const changed = comparisons.filter((row) => row.discrepancyChange !== 0n);
    const signedIncreased = changed.filter((row) => row.discrepancyChange > 0n);
    const signedDecreased = changed.filter((row) => row.discrepancyChange < 0n);
    const absoluteIncreased = changed.filter((row) => row.absoluteChange > 0n);
    const absoluteDecreased = changed.filter((row) => row.absoluteChange < 0n);
    const largest = [...changed].sort((left, right) =>
      compareBigInt(absBigInt(right.discrepancyChange), absBigInt(left.discrepancyChange))
    )[0];

    const report = renderReport({
      generatedAt: new Date().toISOString(),
      chain: chain.toString(),
      runtime446Start,
      runtime447Start,
      earlierRuntime: earlierRuntime.specVersion.toNumber(),
      laterRuntime: laterRuntime.specVersion.toNumber(),
      migrationStatus,
      priorNoise,
      intervalBlocks,
      earlier,
      later,
      comparisons,
      changed,
      signedIncreased,
      signedDecreased,
      absoluteIncreased,
      absoluteDecreased,
      largest,
    });
    fs.writeFileSync(REPORT_PATH, report);

    console.log("report:", REPORT_PATH);
    console.log("subnets compared:", comparisons.length);
    console.log("signed discrepancies increased:", signedIncreased.length);
    console.log("signed discrepancies decreased:", signedDecreased.length);
    console.log("signed discrepancies unchanged:", comparisons.length - changed.length);
    console.log("absolute discrepancies increased:", absoluteIncreased.length);
    console.log("absolute discrepancies decreased:", absoluteDecreased.length);
    console.log("largest movement netuid:", largest?.netuid ?? "none");
    console.log("largest movement rao:", largest?.discrepancyChange ?? 0n);
    console.log("largest raw noise ratio:", largest?.rawNoiseRatio ?? "0x");
    console.log("largest normalized noise ratio:", largest?.normalizedNoiseRatio ?? "0x");
    console.log("post-446 to current alpha-accounting comparison: complete");

    assert.ok(comparisons.length > 0, "no active alpha subnets were compared");
  } finally {
    await api?.disconnect();
  }
}

function assertMetadata() {
  const required = [
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubtensorModule.SubnetAlphaOut", api.query.subtensorModule?.subnetAlphaOut],
    ["AlphaAssets.AlphaBurned", api.query.alphaAssets?.alphaBurned],
    ["SubtensorModule.SubnetProtocolAlpha", api.query.subtensorModule?.subnetProtocolAlpha],
    ["SubtensorModule.PendingServerEmission", api.query.subtensorModule?.pendingServerEmission],
    ["SubtensorModule.PendingValidatorEmission", api.query.subtensorModule?.pendingValidatorEmission],
    ["SubtensorModule.PendingRootAlphaDivs", api.query.subtensorModule?.pendingRootAlphaDivs],
    ["SubtensorModule.PendingOwnerCut", api.query.subtensorModule?.pendingOwnerCut],
    ["SubtensorModule.PendingBasketDeposits", api.query.subtensorModule?.pendingBasketDeposits],
    ["SubtensorModule.HasMigrationRun", api.query.subtensorModule?.hasMigrationRun],
  ].filter(([, value]) => !value);
  assert.equal(
    required.length,
    0,
    `missing mainnet metadata: ${required.map(([name]) => name).join(", ")}`
  );
}

async function findFirstRuntimeAtLeast(target, latestHeight, cache) {
  const versionAt = async (height) => {
    if (cache.has(height)) return cache.get(height);
    const hash = await api.rpc.chain.getBlockHash(height);
    const version = (await api.rpc.state.getRuntimeVersion(hash)).specVersion.toNumber();
    cache.set(height, version);
    console.log(`runtime search block ${height}:`, version);
    return version;
  };

  assert.ok(await versionAt(latestHeight) >= target, `latest runtime is below ${target}`);
  let high = latestHeight;
  let step = 1_024;
  let low = Math.max(0, high - step);
  while (await versionAt(low) >= target) {
    high = low;
    step *= 2;
    low = Math.max(0, high - step);
    if (low === 0) break;
  }
  assert.ok(await versionAt(low) < target, `could not bracket runtime ${target}`);

  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (await versionAt(middle) >= target) high = middle;
    else low = middle;
  }
  assert.equal(await versionAt(high), target, `first runtime >=${target} is not ${target}`);
  return high;
}

async function readMigrationStatus(blockHash) {
  return Object.fromEntries(await Promise.all(MIGRATION_NAMES.map(async (name) => {
    const key = `0x${Buffer.from(name).toString("hex")}`;
    return [name, (await api.query.subtensorModule.hasMigrationRun.at(blockHash, key)).isTrue];
  })));
}

async function readActiveNetuids(blockHash) {
  return (await api.query.subtensorModule.networksAdded.entriesAt(blockHash))
    .filter(([, value]) => value.isTrue)
    .map(([key]) => key.args[0].toNumber())
    .filter((netuid) => netuid > 0)
    .sort((left, right) => left - right);
}

function readTwoTempoNoise() {
  assert.ok(fs.existsSync(TWO_TEMPO_REPORT_PATH), "two-tempo reference report is missing");
  const report = fs.readFileSync(TWO_TEMPO_REPORT_PATH, "utf8");
  const match = report.match(/largest raw discrepancy movement was ([\d,.]+) α/i);
  assert.ok(match, "could not parse maximum movement from two-tempo reference report");
  return {
    blocks: TWO_TEMPO_BLOCKS,
    maxMovement: parseAlpha(match[1]),
    reportPath: TWO_TEMPO_REPORT_PATH,
  };
}

async function readAccountingSnapshot(block, netuids, label) {
  console.log(`reading ${label} accounting snapshot at block ${block.height} ...`);
  const actualStake = await sumDoubleMap(
    "totalHotkeyAlpha",
    block.hash,
    netuids,
    `${label} TotalHotkeyAlpha`
  );
  const pendingBasket = await sumDoubleMap(
    "pendingBasketDeposits",
    block.hash,
    netuids,
    `${label} PendingBasketDeposits`
  );
  const storageMaps = await readAccountingMaps(block.hash, label);
  return {
    block,
    rows: new Map(netuids.map((netuid) => [netuid, accountingRow({
      netuid,
      actualStake: actualStake.get(netuid) ?? 0n,
      pendingBasket: pendingBasket.get(netuid) ?? 0n,
      storageMaps,
    })])),
  };
}

async function sumDoubleMap(method, blockHash, netuids, label) {
  console.log(`reading ${label} entries with paced pagination ...`);
  const allowed = new Set(netuids);
  const totals = new Map(netuids.map((netuid) => [netuid, 0n]));
  let entryCount = 0;
  await forEachPagedEntry("subtensorModule", method, blockHash, label, ([key, value]) => {
    const netuid = key.args[1].toNumber();
    if (allowed.has(netuid)) {
      totals.set(netuid, (totals.get(netuid) ?? 0n) + codecBigInt(value));
    }
    entryCount += 1;
  });
  console.log(`${label} entries:`, entryCount);
  return totals;
}

async function readAccountingMaps(blockHash, label) {
  const definitions = [
    ["alphaOut", api.query.subtensorModule.subnetAlphaOut],
    ["burned", api.query.alphaAssets.alphaBurned],
    ["protocol", api.query.subtensorModule.subnetProtocolAlpha],
    ["pendingServer", api.query.subtensorModule.pendingServerEmission],
    ["pendingValidator", api.query.subtensorModule.pendingValidatorEmission],
    ["pendingRoot", api.query.subtensorModule.pendingRootAlphaDivs],
    ["pendingOwner", api.query.subtensorModule.pendingOwnerCut],
  ];
  const result = {};
  for (const [name, query] of definitions) {
    console.log(`reading ${label} ${name} entries ...`);
    result[name] = new Map(
      (await rpcWithRetry(`${label} ${name}.entriesAt`, () => query.entriesAt(blockHash)))
        .map(([key, value]) => [key.args[0].toNumber(), codecBigInt(value)])
    );
    await delay(PAGE_DELAY_MS);
  }
  return result;
}

async function forEachPagedEntry(section, method, blockHash, label, visit) {
  const apiAt = await api.at(blockHash);
  const queryAt = apiAt.query[section][method];
  let startKey;
  let pageNumber = 0;
  while (true) {
    const page = await rpcWithRetry(
      `${label} page ${pageNumber + 1}`,
      () => queryAt.entriesPaged({ args: [], pageSize: PAGE_SIZE, startKey })
    );
    pageNumber += 1;
    console.log(`${label} page ${pageNumber}:`, page.length);
    for (const entry of page) visit(entry);
    if (page.length < PAGE_SIZE) return;
    const nextStartKey = page.at(-1)[0].toHex();
    assert.notEqual(nextStartKey, startKey, `${label} pagination did not advance`);
    startKey = nextStartKey;
    await delay(PAGE_DELAY_MS);
  }
}

async function rpcWithRetry(label, operation) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("Too Many Requests") && !message.includes("-32029")) throw error;
      if (attempt === 8) throw error;
      const waitMs = attempt * 3_000;
      console.log(`${label}: rate limited, retrying in ${waitMs}ms`);
      await delay(waitMs);
    }
  }
  assert.fail(`${label}: retry loop exhausted`);
}

function accountingRow({ netuid, actualStake, pendingBasket, storageMaps }) {
  const alphaOut = storageMaps.alphaOut.get(netuid) ?? 0n;
  const burned = storageMaps.burned.get(netuid) ?? 0n;
  const protocol = storageMaps.protocol.get(netuid) ?? 0n;
  const pending = (storageMaps.pendingServer.get(netuid) ?? 0n) +
    (storageMaps.pendingValidator.get(netuid) ?? 0n) +
    (storageMaps.pendingRoot.get(netuid) ?? 0n) +
    (storageMaps.pendingOwner.get(netuid) ?? 0n) + pendingBasket;
  const calculatedStake = alphaOut - burned - pending - protocol;
  const discrepancy = actualStake - calculatedStake;
  return {
    netuid,
    alphaOut,
    burned,
    pending,
    protocol,
    actualStake,
    calculatedStake,
    discrepancy,
  };
}

function compareRows(earlier, later, intervalBlocks, noiseMax) {
  assert.equal(earlier.netuid, later.netuid);
  const discrepancyChange = later.discrepancy - earlier.discrepancy;
  const normalizedMovement = (absBigInt(discrepancyChange) * BigInt(TWO_TEMPO_BLOCKS)) /
    BigInt(intervalBlocks);
  return {
    netuid: earlier.netuid,
    earlier,
    later,
    discrepancyChange,
    absoluteChange: absBigInt(later.discrepancy) - absBigInt(earlier.discrepancy),
    normalizedMovement,
    rawNoiseRatio: formatRatio(absBigInt(discrepancyChange), noiseMax),
    normalizedNoiseRatio: formatRatio(normalizedMovement, noiseMax),
    actualStakeChange: later.actualStake - earlier.actualStake,
    calculatedStakeChange: later.calculatedStake - earlier.calculatedStake,
    alphaOutChange: later.alphaOut - earlier.alphaOut,
    burnedChange: later.burned - earlier.burned,
    pendingChange: later.pending - earlier.pending,
    protocolChange: later.protocol - earlier.protocol,
  };
}

function renderReport(snapshot) {
  const absoluteIncreaseNetuids = snapshot.absoluteIncreased
    .map((row) => row.netuid)
    .join(", ") || "none";
  const largestMovement = absBigInt(snapshot.largest.discrepancyChange);
  const rateVerdict = compareRatioStrings(snapshot.largest.normalizedNoiseRatio, "2.000x") > 0
    ? `The normalized largest movement is ${snapshot.largest.normalizedNoiseRatio} the previous two-tempo maximum, so it is materially above that experiment's observed noise rate.`
    : `The normalized largest movement is ${snapshot.largest.normalizedNoiseRatio} the previous two-tempo maximum. It is the same order of magnitude as the two-tempo noise rather than a materially larger drift rate.`;

  return `# Mainnet alpha-accounting movement after runtime 446 migration\n\n` +
    `Generated: ${snapshot.generatedAt}\n\n` +
    `## Result\n\n` +
    `From five blocks after runtime 446 began through the recent finalized snapshot, the largest discrepancy movement was ${formatSignedAlpha(snapshot.largest.discrepancyChange)} on subnet ${snapshot.largest.netuid}. In raw terms this is ${snapshot.largest.rawNoiseRatio} the maximum movement in the 720-block experiment, across an interval ${formatRatio(BigInt(snapshot.intervalBlocks), BigInt(snapshot.priorNoise.blocks))} as long. ${rateVerdict}\n\n` +
    `Signed discrepancy increased on ${snapshot.signedIncreased.length} subnet(s), decreased on ${snapshot.signedDecreased.length}, and was unchanged on ${snapshot.comparisons.length - snapshot.changed.length}. Absolute discrepancy increased on ${snapshot.absoluteIncreased.length}: ${absoluteIncreaseNetuids}.\n\n` +
    `| Networks inspected | Alpha subnets compared | Interval blocks | Runtime at earlier snapshot | Runtime at recent snapshot | Largest raw movement α | Prior 720-block maximum α | Raw ratio | 720-block normalized movement α | Normalized ratio |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n` +
    `| ${snapshot.comparisons.length + 1} | ${snapshot.comparisons.length} | ` +
    `${snapshot.intervalBlocks.toLocaleString("en-US")} | ${snapshot.earlierRuntime} | ` +
    `${snapshot.laterRuntime} | ${formatAlpha(largestMovement)} | ` +
    `${formatAlpha(snapshot.priorNoise.maxMovement)} | ${snapshot.largest.rawNoiseRatio} | ` +
    `${formatAlpha(snapshot.largest.normalizedMovement)} | ` +
    `${snapshot.largest.normalizedNoiseRatio} |\n\n` +
    `Root (netuid 0) is counted as a network but excluded from the alpha-accounting formula.\n\n` +
    `## Snapshots and migration verification\n\n` +
    `| Item | Block | Hash / value |\n|---|---:|---|\n` +
    `| First runtime-446 post-state | ${snapshot.runtime446Start.toLocaleString("en-US")} | runtime 446 |\n` +
    `| Earlier accounting snapshot | ${snapshot.earlier.block.height.toLocaleString("en-US")} | \`${snapshot.earlier.block.hash}\` |\n` +
    `| First runtime-447 post-state | ${snapshot.runtime447Start.toLocaleString("en-US")} | runtime 447 |\n` +
    `| Recent accounting snapshot | ${snapshot.later.block.height.toLocaleString("en-US")} | \`${snapshot.later.block.hash}\` |\n\n` +
    `The earlier snapshot is ${POST_UPGRADE_OFFSET} blocks after the first state reporting runtime 446. All three accounting migration markers were already set:\n\n` +
    `| Migration | Complete at earlier snapshot |\n|---|---|\n` +
    Object.entries(snapshot.migrationStatus)
      .map(([name, complete]) => `| \`${name}\` | ${complete ? "yes" : "**no**"} |\n`)
      .join("") +
    `\n## Discrepancy movement by subnet\n\n` +
    movementTable(snapshot.changed) +
    `\n## Component movement\n\n` +
    componentTable(snapshot.changed) +
    `\n## Method and comparison\n\n` +
    `- Actual staked alpha = \`sum(TotalHotkeyAlpha(hotkey, netuid))\`.\n` +
    `- Pending alpha = \`PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + PendingOwnerCut + PendingBasketDeposits\`.\n` +
    `- Calculated staked alpha = \`SubnetAlphaOut - AlphaBurned - pending alpha - SubnetProtocolAlpha\`.\n` +
    `- Signed discrepancy Δ = \`actual staked alpha - calculated staked alpha\`.\n` +
    `- 720-block normalized movement = \`abs(long movement) × 720 / long interval blocks\`.\n` +
    `- The noise reference is the largest raw movement in \`mainnet-alpha-accounting-two-tempos-report.md\`: ${formatAlpha(snapshot.priorNoise.maxMovement)} α over 720 blocks.\n\n` +
    `This two-snapshot comparison includes ordinary extrinsics and the runtime-447 transition. Normalization tests whether the long-run accumulation rate is noticeably greater; it does not prove which individual transition produced each rao.\n`;
}

function movementTable(rows) {
  if (rows.length === 0) return `_None._\n`;
  return `| Netuid | Δ post-446 α | Δ recent α | Signed movement α | Absolute direction | Raw/noise | 720-block normalized α | Normalized/noise |\n` +
    `|---:|---:|---:|---:|---|---:|---:|---:|\n` +
    rows.map((row) =>
      `| ${row.netuid} | ${formatSignedAlpha(row.earlier.discrepancy)} | ` +
      `${formatSignedAlpha(row.later.discrepancy)} | ${formatSignedAlpha(row.discrepancyChange)} | ` +
      `${absoluteDirection(row.absoluteChange)} | ${row.rawNoiseRatio} | ` +
      `${formatAlpha(row.normalizedMovement)} | ${row.normalizedNoiseRatio} |\n`
    ).join("");
}

function componentTable(rows) {
  if (rows.length === 0) return `_None._\n`;
  return `| Netuid | Actual staked change α | Calculated staked change α | SubnetAlphaOut change α | AlphaBurned change α | Pending change α | Protocol change α |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|\n` +
    rows.map((row) =>
      `| ${row.netuid} | ${formatSignedAlpha(row.actualStakeChange)} | ` +
      `${formatSignedAlpha(row.calculatedStakeChange)} | ${formatSignedAlpha(row.alphaOutChange)} | ` +
      `${formatSignedAlpha(row.burnedChange)} | ${formatSignedAlpha(row.pendingChange)} | ` +
      `${formatSignedAlpha(row.protocolChange)} |\n`
    ).join("");
}

function codecBigInt(value) {
  if (value === null || value === undefined) return 0n;
  if (typeof value.toBigInt === "function") return value.toBigInt();
  return BigInt(value.toString());
}

function parseAlpha(value) {
  const normalized = value.replaceAll(",", "");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 1_000_000_000n + BigInt(fraction.padEnd(9, "0").slice(0, 9));
}

function formatAlpha(raw) {
  const value = BigInt(raw);
  const sign = value < 0n ? "-" : "";
  const absolute = absBigInt(value);
  const whole = absolute / 1_000_000_000n;
  const fraction = (absolute % 1_000_000_000n)
    .toString()
    .padStart(9, "0")
    .replace(/0+$/, "");
  return `${sign}${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
}

function formatSignedAlpha(raw) {
  const value = BigInt(raw);
  return `${value > 0n ? "+" : ""}${formatAlpha(value)}`;
}

function formatRatio(numerator, denominator) {
  if (denominator === 0n) return "∞";
  const scaled = (numerator * 1_000n) / denominator;
  return `${(Number(scaled) / 1_000).toFixed(3)}x`;
}

function compareRatioStrings(left, right) {
  return Number(left.replace("x", "")) - Number(right.replace("x", ""));
}

function absoluteDirection(change) {
  if (change > 0n) return "increased";
  if (change < 0n) return "decreased";
  return "unchanged";
}

function compareBigInt(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function absBigInt(value) {
  return value < 0n ? -value : value;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultEndpoint() {
  assert.ok(
    process.env.ONFINALITY_API_KEY,
    "ONFINALITY_API_KEY is required for mainnet unless WS_ENDPOINT is set"
  );
  return `wss://bittensor-finney.api.onfinality.io/ws?apikey=${process.env.ONFINALITY_API_KEY}`;
}

function loadDotenv() {
  for (const dotenvPath of [".env", "../.env"]) {
    if (!fs.existsSync(dotenvPath)) continue;
    for (const line of fs.readFileSync(dotenvPath, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

function redactEndpoint(endpoint) {
  return endpoint.replace(/(apikey=)[^&]+/i, "$1<redacted>");
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
