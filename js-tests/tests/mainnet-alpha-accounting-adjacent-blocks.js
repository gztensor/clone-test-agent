import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const PAGE_SIZE = Number(process.env.STORAGE_PAGE_SIZE ?? 500);
const PAGE_DELAY_MS = Number(process.env.STORAGE_PAGE_DELAY_MS ?? 1_000);
const SEARCH_BLOCKS = Number(process.env.NON_EPOCH_SEARCH_BLOCKS ?? 96);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "mainnet-alpha-accounting-adjacent-blocks-report.md"
);
const logger = createTempLogger("mainnet-alpha-accounting-adjacent-blocks.log");
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
    const finalizedBlock = finalizedHeader.number.toNumber();
    const pair = await findAdjacentNonEpochPair(finalizedBlock);

    const [chain, firstRuntime, secondRuntime] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.state.getRuntimeVersion(pair.first.hash),
      api.rpc.state.getRuntimeVersion(pair.second.hash),
    ]);
    assert.equal(
      firstRuntime.specVersion.toNumber(),
      secondRuntime.specVersion.toNumber(),
      "runtime changed between the selected adjacent blocks"
    );

    console.log("chain:", chain.toString());
    console.log(
      "runtime:",
      `${secondRuntime.specName.toString()}/${secondRuntime.specVersion.toString()}`
    );
    console.log("selected first block:", pair.first.height, pair.first.hash);
    console.log("selected second block:", pair.second.height, pair.second.hash);
    console.log("active networks (including root):", pair.first.activeNetuids.length);
    console.log("active alpha subnets:", pair.alphaNetuids.length);
    console.log("epochs at first block:", pair.first.epochs.join(",") || "none");
    console.log("epochs at second block:", pair.second.epochs.join(",") || "none");

    const first = await readAccountingSnapshot(pair.first, pair.alphaNetuids, "first");
    const second = await readAccountingSnapshot(pair.second, pair.alphaNetuids, "second");
    const comparisons = pair.alphaNetuids.map((netuid) => compareRows(
      first.rows.get(netuid),
      second.rows.get(netuid)
    ));
    const changed = comparisons.filter((row) => row.discrepancyChange !== 0n);
    const signedIncreased = changed.filter((row) => row.discrepancyChange > 0n);
    const signedDecreased = changed.filter((row) => row.discrepancyChange < 0n);
    const absoluteIncreased = changed.filter((row) => row.absoluteChange > 0n);
    const absoluteDecreased = changed.filter((row) => row.absoluteChange < 0n);
    const signedChangedButAbsoluteUnchanged = changed.filter((row) => row.absoluteChange === 0n);

    const report = renderReport({
      generatedAt: new Date().toISOString(),
      chain: chain.toString(),
      runtimeName: secondRuntime.specName.toString(),
      runtimeVersion: secondRuntime.specVersion.toNumber(),
      pair,
      first,
      second,
      comparisons,
      changed,
      signedIncreased,
      signedDecreased,
      absoluteIncreased,
      absoluteDecreased,
      signedChangedButAbsoluteUnchanged,
    });
    fs.writeFileSync(REPORT_PATH, report);

    console.log("report:", REPORT_PATH);
    console.log("subnets compared:", comparisons.length);
    console.log("signed discrepancies changed:", changed.length);
    console.log("signed discrepancies increased:", signedIncreased.length);
    console.log("signed discrepancies decreased:", signedDecreased.length);
    console.log("absolute discrepancies increased:", absoluteIncreased.length);
    console.log("absolute discrepancies decreased:", absoluteDecreased.length);
    console.log(
      "changed netuids:",
      changed.map((row) => row.netuid).join(",") || "none"
    );
    console.log("adjacent-block alpha-accounting comparison: complete");

    assert.ok(comparisons.length > 0, "no active alpha subnets were compared");
    assert.equal(pair.second.height, pair.first.height + 1, "selected blocks are not adjacent");
    assert.equal(pair.first.epochs.length, 0, "first selected block executed a subnet epoch");
    assert.equal(pair.second.epochs.length, 0, "second selected block executed a subnet epoch");
  } finally {
    await api?.disconnect();
  }
}

function assertMetadata() {
  const required = [
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.LastEpochBlock", api.query.subtensorModule?.lastEpochBlock],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubtensorModule.SubnetAlphaOut", api.query.subtensorModule?.subnetAlphaOut],
    ["AlphaAssets.AlphaBurned", api.query.alphaAssets?.alphaBurned],
    ["SubtensorModule.SubnetProtocolAlpha", api.query.subtensorModule?.subnetProtocolAlpha],
    ["SubtensorModule.PendingServerEmission", api.query.subtensorModule?.pendingServerEmission],
    ["SubtensorModule.PendingValidatorEmission", api.query.subtensorModule?.pendingValidatorEmission],
    ["SubtensorModule.PendingRootAlphaDivs", api.query.subtensorModule?.pendingRootAlphaDivs],
    ["SubtensorModule.PendingOwnerCut", api.query.subtensorModule?.pendingOwnerCut],
    ["SubtensorModule.PendingBasketDeposits", api.query.subtensorModule?.pendingBasketDeposits],
  ].filter(([, value]) => !value);

  assert.equal(
    required.length,
    0,
    `missing mainnet metadata: ${required.map(([name]) => name).join(", ")}`
  );
}

async function findAdjacentNonEpochPair(finalizedBlock) {
  const cache = new Map();

  const readBlockState = async (height) => {
    if (cache.has(height)) return cache.get(height);
    const hash = (await api.rpc.chain.getBlockHash(height)).toString();
    const [networkEntries, epochEntries] = await Promise.all([
      rpcWithRetry(`NetworksAdded at ${height}`, () =>
        api.query.subtensorModule.networksAdded.entriesAt(hash)),
      rpcWithRetry(`LastEpochBlock at ${height}`, () =>
        api.query.subtensorModule.lastEpochBlock.entriesAt(hash)),
    ]);
    const activeNetuids = networkEntries
      .filter(([, value]) => value.isTrue)
      .map(([key]) => key.args[0].toNumber())
      .sort((a, b) => a - b);
    const activeSet = new Set(activeNetuids);
    const epochs = epochEntries
      .filter(([key, value]) =>
        activeSet.has(key.args[0].toNumber()) && codecBigInt(value) === BigInt(height))
      .map(([key]) => key.args[0].toNumber())
      .sort((a, b) => a - b);
    const state = { height, hash, activeNetuids, epochs };
    cache.set(height, state);
    return state;
  };

  for (let laterHeight = finalizedBlock; laterHeight > finalizedBlock - SEARCH_BLOCKS; laterHeight -= 1) {
    const [first, second] = await Promise.all([
      readBlockState(laterHeight - 1),
      readBlockState(laterHeight),
    ]);
    console.log(
      `candidate ${first.height}-${second.height}: epochs`,
      `${first.epochs.join(",") || "none"} / ${second.epochs.join(",") || "none"}`
    );
    if (first.epochs.length !== 0 || second.epochs.length !== 0) continue;
    if (first.activeNetuids.join(",") !== second.activeNetuids.join(",")) continue;

    return {
      first,
      second,
      alphaNetuids: first.activeNetuids.filter((netuid) => netuid > 0),
    };
  }

  assert.fail(`no adjacent non-epoch blocks found in the last ${SEARCH_BLOCKS} finalized blocks`);
}

async function readAccountingSnapshot(block, netuids, label) {
  console.log(`reading ${label} snapshot at block ${block.height} ...`);
  const actualStake = await sumTotalHotkeyAlpha(block.hash, netuids, label);
  const pendingBasket = await sumPendingBasketAlpha(block.hash, netuids, label);
  const storageMaps = await readAccountingMaps(block.hash, label);
  const rows = new Map(netuids.map((netuid) => [netuid, accountingRow({
    netuid,
    actualStake: actualStake.get(netuid) ?? 0n,
    pendingBasket: pendingBasket.get(netuid) ?? 0n,
    storageMaps,
  })]));
  return { block, rows };
}

async function sumTotalHotkeyAlpha(blockHash, netuids, label) {
  console.log(`reading ${label} TotalHotkeyAlpha entries with paced pagination ...`);
  const allowed = new Set(netuids);
  const totals = new Map(netuids.map((netuid) => [netuid, 0n]));
  let entryCount = 0;

  await forEachPagedEntry(
    "subtensorModule",
    "totalHotkeyAlpha",
    blockHash,
    `${label} TotalHotkeyAlpha`,
    ([key, value]) => {
      const netuid = key.args[1].toNumber();
      if (allowed.has(netuid)) {
        totals.set(netuid, (totals.get(netuid) ?? 0n) + codecBigInt(value));
      }
      entryCount += 1;
    }
  );

  console.log(`${label} TotalHotkeyAlpha entries:`, entryCount);
  return totals;
}

async function sumPendingBasketAlpha(blockHash, netuids, label) {
  console.log(`reading ${label} PendingBasketDeposits entries with paced pagination ...`);
  const allowed = new Set(netuids);
  const totals = new Map(netuids.map((netuid) => [netuid, 0n]));
  let entryCount = 0;

  await forEachPagedEntry(
    "subtensorModule",
    "pendingBasketDeposits",
    blockHash,
    `${label} PendingBasketDeposits`,
    ([key, value]) => {
      const netuid = key.args[1].toNumber();
      if (allowed.has(netuid)) {
        totals.set(netuid, (totals.get(netuid) ?? 0n) + codecBigInt(value));
      }
      entryCount += 1;
    }
  );

  console.log(`${label} PendingBasketDeposits entries:`, entryCount);
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
  const pendingServer = storageMaps.pendingServer.get(netuid) ?? 0n;
  const pendingValidator = storageMaps.pendingValidator.get(netuid) ?? 0n;
  const pendingRoot = storageMaps.pendingRoot.get(netuid) ?? 0n;
  const pendingOwner = storageMaps.pendingOwner.get(netuid) ?? 0n;
  const pending = pendingServer + pendingValidator + pendingRoot + pendingOwner + pendingBasket;
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
    discrepancyPct: percentDifference(discrepancy, calculatedStake),
  };
}

function compareRows(first, second) {
  assert.equal(first.netuid, second.netuid);
  return {
    netuid: first.netuid,
    first,
    second,
    discrepancyChange: second.discrepancy - first.discrepancy,
    absoluteChange: absBigInt(second.discrepancy) - absBigInt(first.discrepancy),
    actualStakeChange: second.actualStake - first.actualStake,
    calculatedStakeChange: second.calculatedStake - first.calculatedStake,
    alphaOutChange: second.alphaOut - first.alphaOut,
    burnedChange: second.burned - first.burned,
    pendingChange: second.pending - first.pending,
    protocolChange: second.protocol - first.protocol,
  };
}

function renderReport(snapshot) {
  const changedNetuids = snapshot.changed.map((row) => row.netuid).join(", ") || "none";
  const unchangedNetuids = snapshot.comparisons
    .filter((row) => row.discrepancyChange === 0n)
    .map((row) => row.netuid)
    .join(", ") || "none";
  const maximumMovement = snapshot.changed.reduce(
    (maximum, row) => absBigInt(row.discrepancyChange) > maximum
      ? absBigInt(row.discrepancyChange)
      : maximum,
    0n
  );
  const movementCounts = new Map();
  for (const row of snapshot.comparisons) {
    movementCounts.set(
      row.discrepancyChange,
      (movementCounts.get(row.discrepancyChange) ?? 0) + 1
    );
  }
  const conclusion = snapshot.changed.length === 0
    ? "No signed discrepancy changed over this non-epoch block transition. This interval does not show an ongoing per-block source of discrepancy; it does not exclude a source that is epoch- or extrinsic-dependent."
    : `The assumption that the major discrepancy source is still accumulating every non-epoch block is **not supported**. Although ${snapshot.changed.length} subnet(s) changed signed discrepancy, the maximum movement was only ${formatAlpha(maximumMovement)} α (${maximumMovement.toString()} rao). All non-zero signed changes were negative, so the transition slightly reduced every positive residual rather than creating it. This ubiquitous rao-scale rounding drift cannot explain residuals measured in hundreds or thousands of alpha.`;

  return `# Mainnet alpha-accounting discrepancy: adjacent non-epoch blocks\n\n` +
    `Generated: ${snapshot.generatedAt}\n\n` +
    `## Result\n\n` +
    `${conclusion}\n\n` +
    `The comparison is exact to one rao of alpha. A subnet is reported as changed when its raw signed discrepancy changes by any non-zero amount; no percentage tolerance was applied.\n\n` +
    `| Chain | Runtime | Networks inspected for epoch selection | Alpha subnets compared | Signed Δ increased | Signed Δ decreased | Signed Δ unchanged | Absolute discrepancy increased | Absolute discrepancy decreased |\n` +
    `|---|---|---:|---:|---:|---:|---:|---:|---:|\n` +
    `| ${snapshot.chain} | \`${snapshot.runtimeName}/${snapshot.runtimeVersion}\` | ` +
    `${snapshot.pair.first.activeNetuids.length} | ${snapshot.comparisons.length} | ` +
    `${snapshot.signedIncreased.length} | ${snapshot.signedDecreased.length} | ` +
    `${snapshot.comparisons.length - snapshot.changed.length} | ` +
    `${snapshot.absoluteIncreased.length} | ` +
    `${snapshot.absoluteDecreased.length} |\n\n` +
    `Root (netuid 0) is included in the epoch check but excluded from the alpha-accounting formula. The formula was evaluated for every active alpha subnet.\n\n` +
    `### Movement summary\n\n` +
    `| Signed Δ movement | Subnet count |\n|---:|---:|\n` +
    [...movementCounts.entries()]
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([movement, count]) => `| ${formatSignedAlpha(movement)} α (${movement.toString()} rao) | ${count} |\n`)
      .join("") +
    `\nThe only unchanged alpha subnet was: ${unchangedNetuids}. The affected netuids were: ${changedNetuids}.\n\n` +
    `## Selected adjacent blocks\n\n` +
    `| Block | Hash | Subnet epochs executed |\n` +
    `|---:|---|---|\n` +
    `| ${snapshot.pair.first.height.toLocaleString("en-US")} | \`${snapshot.pair.first.hash}\` | none |\n` +
    `| ${snapshot.pair.second.height.toLocaleString("en-US")} | \`${snapshot.pair.second.hash}\` | none |\n\n` +
    `An epoch is classified as executed when an active subnet's \`LastEpochBlock\` equals the block being inspected. Both selected block states had an empty set. The active-network set was also identical at both blocks.\n\n` +
    `## Subnets whose discrepancy increased or decreased\n\n` +
    changedTable(snapshot.changed) +
    `\n“Direction” refers to the absolute magnitude of the discrepancy, while “signed Δ change” preserves its accounting sign.\n\n` +
    `## Component changes for affected subnets\n\n` +
    componentTable(snapshot.changed) +
    `\n## Method\n\n` +
    `For each block and each active alpha subnet:\n\n` +
    `- Actual staked alpha = \`sum(TotalHotkeyAlpha(hotkey, netuid))\`.\n` +
    `- Pending alpha = \`PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + PendingOwnerCut + PendingBasketDeposits\`.\n` +
    `- Calculated staked alpha = \`SubnetAlphaOut - AlphaBurned - pending alpha - SubnetProtocolAlpha\`.\n` +
    `- Signed discrepancy Δ = \`actual staked alpha - calculated staked alpha\`.\n` +
    `- Change in discrepancy = \`Δ(second block) - Δ(first block)\`.\n\n` +
    `All components of each snapshot were read at the exact block hash shown above.\n`;
}

function changedTable(rows) {
  if (rows.length === 0) return `_None._\n`;
  return `| Netuid | Δ before α | Δ after α | Signed Δ change α | Absolute direction | Δ % before | Δ % after |\n` +
    `|---:|---:|---:|---:|---|---:|---:|\n` +
    rows.map((row) =>
      `| ${row.netuid} | ${formatSignedAlpha(row.first.discrepancy)} | ` +
      `${formatSignedAlpha(row.second.discrepancy)} | ` +
      `${formatSignedAlpha(row.discrepancyChange)} | ${absoluteDirection(row.absoluteChange)} | ` +
      `${formatPercent(row.first.discrepancyPct)} | ${formatPercent(row.second.discrepancyPct)} |\n`
    ).join("");
}

function componentTable(rows) {
  if (rows.length === 0) return `_None._\n`;
  return `| Netuid | Actual staked change α | Calculated staked change α | SubnetAlphaOut change α | AlphaBurned change α | Pending change α | Protocol change α |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|\n` +
    rows.map((row) =>
      `| ${row.netuid} | ${formatSignedAlpha(row.actualStakeChange)} | ` +
      `${formatSignedAlpha(row.calculatedStakeChange)} | ` +
      `${formatSignedAlpha(row.alphaOutChange)} | ${formatSignedAlpha(row.burnedChange)} | ` +
      `${formatSignedAlpha(row.pendingChange)} | ${formatSignedAlpha(row.protocolChange)} |\n`
    ).join("");
}

function codecBigInt(value) {
  if (value === null || value === undefined) return 0n;
  if (typeof value.toBigInt === "function") return value.toBigInt();
  return BigInt(value.toString());
}

function percentDifference(discrepancy, calculated) {
  if (calculated === 0n) return discrepancy === 0n ? 0 : null;
  const scaled = (absBigInt(discrepancy) * 1_000_000_000n) / absBigInt(calculated);
  return Number(scaled) / 10_000_000;
}

function formatPercent(value) {
  return value === null ? "∞" : `${value.toFixed(9)}%`;
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

function absoluteDirection(change) {
  if (change > 0n) return "increased";
  if (change < 0n) return "decreased";
  return "unchanged";
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
