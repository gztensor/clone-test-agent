import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";
import { xxhashAsHex } from "@polkadot/util-crypto";

loadDotenv();

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const PAGE_SIZE = Number(process.env.STORAGE_PAGE_SIZE ?? 500);
const PAGE_DELAY_MS = Number(process.env.STORAGE_PAGE_DELAY_MS ?? 1_000);
const DISTANCE_MODE = process.env.ALPHA_ACCOUNTING_DISTANCE ?? "two-common-tempos";
const REQUIRE_EPOCH_FOR_ALL = process.env.REQUIRE_EPOCH_FOR_ALL === "1";
const EXPECTED_RUNTIME_VERSION = process.env.EXPECTED_RUNTIME_VERSION === undefined
  ? null
  : Number(process.env.EXPECTED_RUNTIME_VERSION);
const REPORT_TITLE = process.env.ALPHA_ACCOUNTING_REPORT_TITLE ??
  "Mainnet alpha-accounting discrepancy over two tempos";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(
  __dirname,
  "..",
  process.env.ALPHA_ACCOUNTING_REPORT_FILENAME ??
    "mainnet-alpha-accounting-two-tempos-report.md"
);
const logger = createTempLogger(
  process.env.ALPHA_ACCOUNTING_LOG_FILENAME ?? "mainnet-alpha-accounting-two-tempos.log"
);
logger.captureConsole();

let api;
let pendingBasketReadMode = "runtime metadata";

export async function main() {
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
    const laterMetadata = await readNetworkMetadata(finalizedHash.toString(), finalizedHeight);
    const alphaNetuids = laterMetadata.activeNetuids.filter((netuid) => netuid > 0);
    const tempoDistribution = countValues(alphaNetuids.map(
      (netuid) => laterMetadata.tempo.get(netuid) ?? 0
    ));
    const commonTempo = selectCommonTempo(tempoDistribution);
    const distance = selectDistance(DISTANCE_MODE, commonTempo, alphaNetuids, laterMetadata.tempo);
    const earlierHeight = finalizedHeight - distance;
    assert.ok(earlierHeight > 0, "finalized height is too low for a two-tempo comparison");

    const earlierHash = (await api.rpc.chain.getBlockHash(earlierHeight)).toString();
    const earlierMetadata = await readNetworkMetadata(earlierHash, earlierHeight);
    assert.deepEqual(
      earlierMetadata.activeNetuids,
      laterMetadata.activeNetuids,
      "active network set changed during the selected interval"
    );

    const [chain, earlierRuntime, laterRuntime] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.state.getRuntimeVersion(earlierHash),
      api.rpc.state.getRuntimeVersion(finalizedHash),
    ]);
    assert.equal(
      earlierRuntime.specVersion.toNumber(),
      laterRuntime.specVersion.toNumber(),
      "runtime changed during the selected interval"
    );
    if (EXPECTED_RUNTIME_VERSION !== null) {
      assert.equal(
        laterRuntime.specVersion.toNumber(),
        EXPECTED_RUNTIME_VERSION,
        "unexpected runtime version for the selected interval"
      );
    }

    const pair = {
      earlier: { height: earlierHeight, hash: earlierHash, metadata: earlierMetadata },
      later: {
        height: finalizedHeight,
        hash: finalizedHash.toString(),
        metadata: laterMetadata,
      },
      commonTempo,
      distance,
      alphaNetuids,
    };

    console.log("chain:", chain.toString());
    console.log(
      "runtime:",
      `${laterRuntime.specName.toString()}/${laterRuntime.specVersion.toString()}`
    );
    console.log("tempo distribution:", formatDistribution(tempoDistribution));
    console.log("selected common alpha-subnet tempo:", commonTempo);
    console.log("block distance:", distance);
    console.log("earlier block:", earlierHeight, earlierHash);
    console.log("later block:", finalizedHeight, finalizedHash.toString());
    console.log("active networks including root:", laterMetadata.activeNetuids.length);
    console.log("active alpha subnets:", alphaNetuids.length);

    const earlier = await readAccountingSnapshot(pair.earlier, alphaNetuids, "earlier");
    const later = await readAccountingSnapshot(pair.later, alphaNetuids, "later");
    const comparisons = alphaNetuids.map((netuid) => compareRows({
      earlier: earlier.rows.get(netuid),
      later: later.rows.get(netuid),
      tempo: laterMetadata.tempo.get(netuid) ?? 0,
      epochCount: (laterMetadata.epochIndex.get(netuid) ?? 0n) -
        (earlierMetadata.epochIndex.get(netuid) ?? 0n),
      lastEpochAdvance: (laterMetadata.lastEpoch.get(netuid) ?? 0n) -
        (earlierMetadata.lastEpoch.get(netuid) ?? 0n),
    }));
    const changed = comparisons.filter((row) => row.discrepancyChange !== 0n);
    const signedIncreased = changed.filter((row) => row.discrepancyChange > 0n);
    const signedDecreased = changed.filter((row) => row.discrepancyChange < 0n);
    const absoluteIncreased = changed.filter((row) => row.absoluteChange > 0n);
    const absoluteDecreased = changed.filter((row) => row.absoluteChange < 0n);
    const nonEpochBaselineBound = BigInt(distance) * 3n;
    const aboveBaseline = changed.filter(
      (row) => absBigInt(row.discrepancyChange) > nonEpochBaselineBound
    );
    if (REQUIRE_EPOCH_FOR_ALL) {
      const missingEpoch = comparisons.filter((row) => row.epochCount < 1n);
      assert.equal(
        missingEpoch.length,
        0,
        `subnets without an epoch in the selected interval: ${missingEpoch.map((row) => row.netuid).join(", ")}`
      );
    }

    const report = renderReport({
      generatedAt: new Date().toISOString(),
      chain: chain.toString(),
      runtimeName: laterRuntime.specName.toString(),
      runtimeVersion: laterRuntime.specVersion.toNumber(),
      tempoDistribution,
      pair,
      comparisons,
      changed,
      signedIncreased,
      signedDecreased,
      absoluteIncreased,
      absoluteDecreased,
      nonEpochBaselineBound,
      aboveBaseline,
      reportTitle: REPORT_TITLE,
    });
    fs.writeFileSync(REPORT_PATH, report);

    console.log("report:", REPORT_PATH);
    console.log("subnets compared:", comparisons.length);
    console.log("signed discrepancies increased:", signedIncreased.length);
    console.log("signed discrepancies decreased:", signedDecreased.length);
    console.log("signed discrepancies unchanged:", comparisons.length - changed.length);
    console.log("absolute discrepancies increased:", absoluteIncreased.length);
    console.log("absolute discrepancies decreased:", absoluteDecreased.length);
    console.log("movements above non-epoch rounding baseline:", aboveBaseline.length);
    console.log("epoch counts:", formatDistribution(countValues(
      comparisons.map((row) => row.epochCount.toString())
    )));
    console.log("alpha-accounting comparison: complete");

    if (DISTANCE_MODE === "two-common-tempos") {
      assert.equal(pair.distance, pair.commonTempo * 2);
    }
    assert.ok(comparisons.length > 0, "no active alpha subnets were compared");
    return {
      chain: chain.toString(),
      runtimeName: laterRuntime.specName.toString(),
      runtimeVersion: laterRuntime.specVersion.toNumber(),
      pair,
      comparisons,
      changed,
    };
  } finally {
    await api?.disconnect();
  }
}

function assertMetadata() {
  const required = [
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.Tempo", api.query.subtensorModule?.tempo],
    ["SubtensorModule.LastEpochBlock", api.query.subtensorModule?.lastEpochBlock],
    ["SubtensorModule.SubnetEpochIndex", api.query.subtensorModule?.subnetEpochIndex],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubtensorModule.SubnetAlphaOut", api.query.subtensorModule?.subnetAlphaOut],
    ["AlphaAssets.AlphaBurned", api.query.alphaAssets?.alphaBurned],
    ["SubtensorModule.SubnetProtocolAlpha", api.query.subtensorModule?.subnetProtocolAlpha],
    ["SubtensorModule.PendingServerEmission", api.query.subtensorModule?.pendingServerEmission],
    ["SubtensorModule.PendingValidatorEmission", api.query.subtensorModule?.pendingValidatorEmission],
    ["SubtensorModule.PendingRootAlphaDivs", api.query.subtensorModule?.pendingRootAlphaDivs],
    ["SubtensorModule.PendingOwnerCut", api.query.subtensorModule?.pendingOwnerCut],
  ].filter(([, value]) => !value);

  assert.equal(
    required.length,
    0,
    `missing mainnet metadata: ${required.map(([name]) => name).join(", ")}`
  );
}

async function readNetworkMetadata(blockHash, height) {
  console.log(`reading network and epoch metadata at block ${height} ...`);
  const [networkEntries, tempoEntries, lastEpochEntries, epochIndexEntries] = await Promise.all([
    rpcWithRetry(`NetworksAdded at ${height}`, () =>
      api.query.subtensorModule.networksAdded.entriesAt(blockHash)),
    rpcWithRetry(`Tempo at ${height}`, () =>
      api.query.subtensorModule.tempo.entriesAt(blockHash)),
    rpcWithRetry(`LastEpochBlock at ${height}`, () =>
      api.query.subtensorModule.lastEpochBlock.entriesAt(blockHash)),
    rpcWithRetry(`SubnetEpochIndex at ${height}`, () =>
      api.query.subtensorModule.subnetEpochIndex.entriesAt(blockHash)),
  ]);
  return {
    activeNetuids: networkEntries
      .filter(([, value]) => value.isTrue)
      .map(([key]) => key.args[0].toNumber())
      .sort((a, b) => a - b),
    tempo: entryMap(tempoEntries, (value) => value.toNumber()),
    lastEpoch: entryMap(lastEpochEntries, codecBigInt),
    epochIndex: entryMap(epochIndexEntries, codecBigInt),
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
  if (!api.query.subtensorModule?.[method]) {
    assert.equal(
      method,
      "pendingBasketDeposits",
      `missing double-map metadata: SubtensorModule.${method}`
    );
    pendingBasketReadMode = "raw runtime-447 storage keys";
    return sumRawPendingBasketDeposits(blockHash, netuids, label);
  }

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

async function sumRawPendingBasketDeposits(blockHash, netuids, label) {
  const storagePrefix = xxhashAsHex("SubtensorModule", 128) +
    xxhashAsHex("PendingBasketDeposits", 128).slice(2);
  const allowed = new Set(netuids);
  const totals = new Map(netuids.map((netuid) => [netuid, 0n]));
  let startKey;
  let pageNumber = 0;
  let entryCount = 0;

  console.log(`reading ${label} through raw runtime-447 storage keys ...`);
  while (true) {
    const page = await rpcWithRetry(
      `${label} raw-key page ${pageNumber + 1}`,
      () => api.rpc.state.getKeysPaged(storagePrefix, PAGE_SIZE, startKey, blockHash)
    );
    pageNumber += 1;
    console.log(`${label} raw-key page ${pageNumber}:`, page.length);
    if (page.length === 0) break;

    const values = await rpcWithRetry(
      `${label} raw-value page ${pageNumber}`,
      () => api.rpc.state.queryStorageAt(page, blockHash)
    );
    assert.equal(values.length, page.length, `${label} raw key/value count mismatch`);
    for (let index = 0; index < page.length; index += 1) {
      const keyBytes = Buffer.from(page[index].toHex().slice(2), "hex");
      const valueBytes = Buffer.from(values[index].toHex().slice(2), "hex");
      assert.equal(keyBytes.length, 82, `${label} unexpected raw key length`);
      assert.equal(valueBytes.length, 8, `${label} unexpected AlphaBalance length`);
      const netuid = keyBytes.readUInt16LE(keyBytes.length - 2);
      if (allowed.has(netuid)) {
        totals.set(netuid, (totals.get(netuid) ?? 0n) + valueBytes.readBigUInt64LE());
      }
      entryCount += 1;
    }

    if (page.length < PAGE_SIZE) break;
    const nextStartKey = page.at(-1).toHex();
    assert.notEqual(nextStartKey, startKey, `${label} raw pagination did not advance`);
    startKey = nextStartKey;
    await delay(PAGE_DELAY_MS);
  }
  console.log(`${label} raw entries:`, entryCount);
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
    result[name] = entryMap(
      await rpcWithRetry(`${label} ${name}.entriesAt`, () => query.entriesAt(blockHash)),
      codecBigInt
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
    discrepancyPct: percentDifference(discrepancy, calculatedStake),
  };
}

function compareRows({ earlier, later, tempo, epochCount, lastEpochAdvance }) {
  assert.equal(earlier.netuid, later.netuid);
  return {
    netuid: earlier.netuid,
    earlier,
    later,
    tempo,
    epochCount,
    lastEpochAdvance,
    discrepancyChange: later.discrepancy - earlier.discrepancy,
    absoluteChange: absBigInt(later.discrepancy) - absBigInt(earlier.discrepancy),
    actualStakeChange: later.actualStake - earlier.actualStake,
    calculatedStakeChange: later.calculatedStake - earlier.calculatedStake,
    alphaOutChange: later.alphaOut - earlier.alphaOut,
    burnedChange: later.burned - earlier.burned,
    pendingChange: later.pending - earlier.pending,
    protocolChange: later.protocol - earlier.protocol,
  };
}

function renderReport(snapshot) {
  const epochDistribution = countValues(
    snapshot.comparisons.map((row) => row.epochCount.toString())
  );
  const maxMovement = snapshot.changed.reduce(
    (maximum, row) => absBigInt(row.discrepancyChange) > maximum
      ? absBigInt(row.discrepancyChange)
      : maximum,
    0n
  );
  const unchangedNetuids = snapshot.comparisons
    .filter((row) => row.discrepancyChange === 0n)
    .map((row) => row.netuid)
    .join(", ") || "none";
  const absoluteIncreaseNetuids = snapshot.absoluteIncreased
    .map((row) => row.netuid)
    .join(", ") || "none";
  const totalEpochs = snapshot.comparisons.reduce(
    (sum, row) => sum + row.epochCount,
    0n,
  );
  const intervalDescription = totalEpochs > 0n
    ? "epoch-spanning interval"
    : "measured interval, in which no subnet epoch executed";
  const baselineVerdict = snapshot.aboveBaseline.length === 0
    ? "No movement exceeded the previously observed adjacent-block rounding baseline."
    : `${snapshot.aboveBaseline.length} movement(s) exceeded the previously observed ` +
      `adjacent-block rounding baseline and require component-level interpretation.`;
  const genesisScaleUpperBound = maxMovement *
    BigInt(Math.ceil(snapshot.pair.later.height / snapshot.pair.distance));
  const movementScale = EXPECTED_RUNTIME_VERSION === null
    ? `Even extrapolating that worst observed rate across the chain's entire block height ` +
      `gives only ${formatAlpha(genesisScaleUpperBound)} α, so this effect cannot explain ` +
      `residuals of hundreds or thousands of alpha.`
    : `Historical-candidate significance is assessed against the corrected runtime-447 ` +
      `controls below; the accelerated clone's local block height is not used for extrapolation.`;
  const verdict = snapshot.signedIncreased.length === 0
    ? `No subnet's signed discrepancy increased in the ${intervalDescription}. It decreased on ` +
      `${snapshot.signedDecreased.length} alpha subnets and was unchanged on ` +
      `${snapshot.comparisons.length - snapshot.changed.length} (${unchangedNetuids}). ` +
      baselineVerdict
    : `${snapshot.signedIncreased.length} subnet(s) increased signed discrepancy in the ` +
      `${intervalDescription}: ${snapshot.signedIncreased.map((row) => row.netuid).join(", ")}. ` +
      baselineVerdict;

  return `# ${snapshot.reportTitle}\n\n` +
    `Generated: ${snapshot.generatedAt}\n\n` +
    `## Result\n\n` +
    `${verdict}\n\n` +
    `The largest raw discrepancy movement was ${formatAlpha(maxMovement)} α. ${movementScale} ` +
    `Measurements are exact to one rao; every non-zero movement is reported below.\n\n` +
    `Absolute discrepancy increased on: ${absoluteIncreaseNetuids}. Absolute discrepancy decreased on ` +
    `${snapshot.absoluteDecreased.length} changed subnets.\n\n` +
    `| Chain | Runtime | Networks inspected | Alpha subnets compared | Block distance | Common alpha tempo | Signed Δ increased | Signed Δ decreased | Signed Δ unchanged | Absolute discrepancy increased | Absolute discrepancy decreased | Above non-epoch baseline |\n` +
    `|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n` +
    `| ${snapshot.chain} | \`${snapshot.runtimeName}/${snapshot.runtimeVersion}\` | ` +
    `${snapshot.pair.later.metadata.activeNetuids.length} | ${snapshot.comparisons.length} | ` +
    `${snapshot.pair.distance} | ${snapshot.pair.commonTempo} | ` +
    `${snapshot.signedIncreased.length} | ${snapshot.signedDecreased.length} | ` +
    `${snapshot.comparisons.length - snapshot.changed.length} | ` +
    `${snapshot.absoluteIncreased.length} | ${snapshot.absoluteDecreased.length} | ` +
    `${snapshot.aboveBaseline.length} |\n\n` +
    `Root (netuid 0) is included in the network count but excluded from the alpha-accounting formula.\n\n` +
    `## Selected blocks and epoch verification\n\n` +
    `| Snapshot | Block | Hash |\n|---|---:|---|\n` +
    `| Earlier | ${snapshot.pair.earlier.height.toLocaleString("en-US")} | \`${snapshot.pair.earlier.hash}\` |\n` +
    `| Later | ${snapshot.pair.later.height.toLocaleString("en-US")} | \`${snapshot.pair.later.hash}\` |\n\n` +
    `The blocks are exactly ${snapshot.pair.distance} blocks apart. The common alpha-subnet tempo is ${snapshot.pair.commonTempo} blocks. Exact epoch executions were measured from the change in \`SubnetEpochIndex\`, which the runtime increments after every successful subnet epoch.\n\n` +
    distributionTable("Tempo", snapshot.tempoDistribution) + `\n` +
    distributionTable("Epochs executed in interval", epochDistribution) + `\n` +
    `## Discrepancy changes\n\n` +
    discrepancyTable(snapshot.changed, snapshot.nonEpochBaselineBound) +
    `\n## Component changes\n\n` +
    componentTable(snapshot.changed) +
    `\n## Method\n\n` +
    `For each active alpha subnet at both exact block hashes:\n\n` +
    `- Actual staked alpha = \`sum(TotalHotkeyAlpha(hotkey, netuid))\`.\n` +
    `- Pending alpha = \`PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + PendingOwnerCut + PendingBasketDeposits\`.\n` +
    `- Calculated staked alpha = \`SubnetAlphaOut - AlphaBurned - pending alpha - SubnetProtocolAlpha\`.\n` +
    `- Signed discrepancy Δ = \`actual staked alpha - calculated staked alpha\`.\n` +
    `- Discrepancy movement = \`Δ(later) - Δ(earlier)\`.\n\n` +
    `PendingBasketDeposits read mode: ${pendingBasketReadMode}. Historical runtimes that ` +
    `predate this storage item are measured from the still-present runtime-447 raw keys.\n\n` +
    `The “above baseline” marker is comparative, not a tolerance in the accounting formula. It uses the preceding adjacent-block measurement of 2–3 rao per block to identify movements too large to be explained by that observed drift.\n`;
}

function discrepancyTable(rows, baselineBound) {
  if (rows.length === 0) return `_None._\n`;
  return `| Netuid | Tempo | Epochs | LastEpochBlock advance | Δ earlier α | Δ later α | Signed Δ change α | Absolute direction | Above baseline |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|---|---|\n` +
    rows.map((row) =>
      `| ${row.netuid} | ${row.tempo} | ${row.epochCount.toString()} | ` +
      `${row.lastEpochAdvance.toString()} | ${formatSignedAlpha(row.earlier.discrepancy)} | ` +
      `${formatSignedAlpha(row.later.discrepancy)} | ${formatSignedAlpha(row.discrepancyChange)} | ` +
      `${absoluteDirection(row.absoluteChange)} | ` +
      `${absBigInt(row.discrepancyChange) > baselineBound ? "**yes**" : "no"} |\n`
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

function distributionTable(label, distribution) {
  return `| ${label} | Subnet count |\n|---:|---:|\n` +
    [...distribution.entries()]
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([value, count]) => `| ${value} | ${count} |\n`)
      .join("");
}

function entryMap(entries, decode) {
  return new Map(entries.map(([key, value]) => [key.args[0].toNumber(), decode(value)]));
}

function countValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function selectCommonTempo(distribution) {
  const positive = [...distribution.entries()].filter(([tempo]) => Number(tempo) > 0);
  assert.ok(positive.length > 0, "no positive tempo found for active alpha subnets");
  positive.sort(([leftTempo, leftCount], [rightTempo, rightCount]) =>
    rightCount - leftCount || Number(leftTempo) - Number(rightTempo));
  return Number(positive[0][0]);
}

function selectDistance(mode, commonTempo, netuids, tempo) {
  if (mode === "two-common-tempos") return commonTempo * 2;
  if (mode === "max-tempo") {
    const maximum = Math.max(...netuids.map((netuid) => tempo.get(netuid) ?? 0));
    assert.ok(maximum > 0, "no positive maximum tempo found");
    return maximum;
  }
  const explicit = Number(mode);
  assert.ok(Number.isSafeInteger(explicit) && explicit > 0, `invalid distance: ${mode}`);
  return explicit;
}

function formatDistribution(distribution) {
  return [...distribution.entries()].map(([value, count]) => `${value}:${count}`).join(",");
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(async (error) => {
    await logger.error(error);
    await logger.flush();
    process.exit(1);
  });
}
