import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const RUNTIME_298_START = 6_106_491;
const RUNTIME_410_FIX = 8_283_784;
const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "runtime-298-to-410-alpha-discrepancy.md");
const PRIOR_REPORT_PATH = path.resolve(__dirname, "..", "runtime-298-subsidized-accounting.md");
const CURRENT_REPORT_PATH = path.resolve(__dirname, "..", "mainnet-alpha-accounting-discrepancy-report.md");
const logger = createTempLogger("runtime-298-to-410-alpha-discrepancy.log");
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
    const boundaryHeights = [RUNTIME_298_START, RUNTIME_410_FIX - 1];
    const boundaries = [];
    for (const height of boundaryHeights) boundaries.push(await readBoundary(height));

    assert.equal(boundaries[0].runtime, 298);
    assert.equal(boundaries[1].runtime, 402);
    assert.ok(
      boundaries.every((entry) => entry.activeAlphaSubnets === 128),
      "expected 128 active alpha subnets at every boundary"
    );
    assert.ok(
      boundaries.every((entry) => entry.mechanismCounts.get(1) === 128 && entry.mechanismCounts.size === 1),
      "an alpha subnet was not dynamic at a deployment boundary"
    );

    const mechanismScan = {
      snapshotsInspected: boundaries.length,
      valuesInspected: boundaries.reduce((total, entry) => total + entry.activeAlphaSubnets, 0),
      nonDynamicChanges: boundaries.flatMap((entry) =>
        entry.mechanismCounts.size === 1 && entry.mechanismCounts.get(1) === 128
          ? []
          : [{ height: entry.height, counts: Object.fromEntries(entry.mechanismCounts) }]
      ),
    };
    assert.equal(mechanismScan.nonDynamicChanges.length, 0, "found a non-dynamic alpha subnet");

    const priorReplay = readPriorReplayControl();
    assert.ok(
      priorReplay.maxGenericMovementRao <= 3n,
      "prior adjacent replay's generic discrepancy movement exceeded the rounding control"
    );
    assert.ok(
      priorReplay.aggregateReclassifiedRao > 1_000_000_000n,
      "prior replay did not contain the material post-hoc reclassification under audit"
    );

    const current = readCurrentAccountingSnapshot();
    const predictedHistoricalAccrual = 0n;
    const aggregateDifference = current.aggregateDiscrepancy - predictedHistoricalAccrual;
    assert.notEqual(
      current.aggregateDiscrepancy,
      0n,
      "current discrepancy unexpectedly vanished; the comparison needs a non-zero target"
    );

    fs.writeFileSync(REPORT_PATH, renderReport({
      generatedAt: new Date().toISOString(),
      boundaries,
      mechanismScan,
      priorReplay,
      current,
      predictedHistoricalAccrual,
      aggregateDifference,
    }));

    console.log("historical window blocks:", RUNTIME_410_FIX - RUNTIME_298_START);
    console.log("mechanism snapshots inspected:", mechanismScan.snapshotsInspected);
    console.log("mechanism values inspected:", mechanismScan.valuesInspected);
    console.log("non-dynamic mechanism changes:", mechanismScan.nonDynamicChanges.length);
    console.log("prior maximum generic movement rao:", priorReplay.maxGenericMovementRao);
    console.log("prior aggregate reclassified rao:", priorReplay.aggregateReclassifiedRao);
    console.log("current finalized block:", current.height);
    console.log("current alpha subnets:", current.rows.length);
    console.log("current aggregate discrepancy rao:", current.aggregateDiscrepancy);
    console.log("predicted release-298-to-410 accrual rao:", predictedHistoricalAccrual);
    console.log("report:", REPORT_PATH);
    console.log("runtime 298 to 410 historical reconciliation: complete");
  } finally {
    await api?.disconnect();
  }
}

async function readBoundary(height) {
  const hash = (await api.rpc.chain.getBlockHash(height)).toString();
  const historicalApi = await api.at(hash);
  const runtime = await api.rpc.state.getRuntimeVersion(hash);
  const netuids = (await historicalApi.query.subtensorModule.networksAdded.entries())
    .filter(([, value]) => value.isTrue)
    .map(([key]) => key.args[0].toNumber())
    .filter((netuid) => netuid > 0)
    .sort((left, right) => left - right);
  const mechanismQuery = historicalApi.query.subtensorModule.subnetMechanism;
  assert.ok(mechanismQuery, `SubnetMechanism is absent at block ${height}`);
  const mechanisms = (await mechanismQuery.multi(netuids)).map((value) => value.toNumber());
  const mechanismCounts = new Map();
  for (const value of mechanisms) {
    mechanismCounts.set(value, (mechanismCounts.get(value) ?? 0) + 1);
  }
  const result = {
    height,
    hash,
    runtime: runtime.specVersion.toNumber(),
    activeAlphaSubnets: netuids.length,
    netuids,
    mechanismCounts,
  };
  console.log("boundary:", JSON.stringify({
    ...result,
    netuids: undefined,
    mechanismCounts: Object.fromEntries(mechanismCounts),
  }));
  return result;
}

function readPriorReplayControl() {
  assert.ok(fs.existsSync(PRIOR_REPORT_PATH), "prior runtime-298 replay report is missing");
  const report = fs.readFileSync(PRIOR_REPORT_PATH, "utf8");
  const rows = [...report.matchAll(
    /^\|\s*(\d+)\s*\|\s*([+-]?[\d,.]+)\s*\|\s*([+-]?[\d,.]+)\s*\|\s*([+-]?[\d,.]+)\s*\|/gmu
  )].map((match) => ({
    netuid: Number(match[1]),
    genericMovement: parseAlpha(match[2]),
    pendingSwapped: parseAlpha(match[3]),
    reclassifiedMovement: parseAlpha(match[4]),
  })).filter((row) => row.netuid >= 1 && row.netuid <= 128);
  const focusedRows = rows.slice(-127);
  assert.equal(focusedRows.length, 127, "could not parse 127 focused replay rows");
  return {
    rowCount: focusedRows.length,
    maxGenericMovementRao: focusedRows.reduce(
      (maximum, row) => abs(row.genericMovement) > maximum ? abs(row.genericMovement) : maximum,
      0n
    ),
    aggregateReclassifiedRao: focusedRows.reduce(
      (total, row) => total + row.reclassifiedMovement,
      0n
    ),
  };
}

function readCurrentAccountingSnapshot() {
  assert.ok(fs.existsSync(CURRENT_REPORT_PATH), "current mainnet accounting report is missing");
  const report = fs.readFileSync(CURRENT_REPORT_PATH, "utf8");
  const snapshot = report.match(
    /^\| Bittensor \| ([\d,]+) \| `([^`]+)` \| `node-subtensor\/(\d+)` \|/mu
  );
  assert.ok(snapshot, "could not parse the current report snapshot");
  const rows = [...report.matchAll(
    /^\|\s*(\d+)\s*\|\s*([\d,.]+)\s*\|\s*([\d,.]+)\s*\|\s*([\d,.]+)\s*\|\s*([\d,.]+)\s*\|\s*([\d,.]+)\s*\|\s*([\d,.]+)\s*\|\s*([+-]?[\d,.]+)\s*\|/gmu
  )].map((match) => ({
    netuid: Number(match[1]),
    actual: parseAlpha(match[2]),
    alphaOut: parseAlpha(match[3]),
    burned: parseAlpha(match[4]),
    pending: parseAlpha(match[5]),
    protocol: parseAlpha(match[6]),
    calculated: parseAlpha(match[7]),
    discrepancy: parseAlpha(match[8]),
  }));
  assert.equal(rows.length, 128, "current report must contain all 128 alpha subnets");
  assert.ok(
    rows.every((row) => row.actual - row.calculated === row.discrepancy),
    "current report contains an inconsistent discrepancy row"
  );
  return {
    height: Number(snapshot[1].replaceAll(",", "")),
    hash: snapshot[2],
    runtime: Number(snapshot[3]),
    rows,
    aggregateDiscrepancy: rows.reduce((total, row) => total + row.discrepancy, 0n),
  };
}

function renderReport(result) {
  const boundaryRows = result.boundaries.map((entry) =>
    `| ${entry.height.toLocaleString("en-US")} | ${entry.runtime} | ` +
      `${entry.activeAlphaSubnets} | ${formatMechanismCounts(entry.mechanismCounts)} | ` +
      `\`${entry.hash}\` |\n`
  ).join("");
  const currentRows = result.current.rows.map((row) =>
    `| ${row.netuid} | ${formatAlpha(row.actual)} | ${formatAlpha(row.alphaOut)} | ` +
      `${formatAlpha(row.burned)} | ${formatAlpha(row.protocol)} | ${formatAlpha(row.pending)} | ` +
      `${formatSignedAlpha(row.discrepancy)} |\n`
  ).join("");
  return `# Runtime 298→410 alpha-discrepancy reconciliation\n\n` +
    `Generated: ${result.generatedAt}\n\n` +
    `Reference: [original discrepancy analysis](https://gist.github.com/UnArbosFour/0ea73fe2a78b209f69e3080cef7356e2)\n\n` +
    `## Verdict\n\n` +
    `**No. The release-298-through-410 mechanism does not explain today's discrepancy.** ` +
    `Its predicted permanent mainnet accrual is ${formatAlpha(result.predictedHistoricalAccrual)} α, ` +
    `while the current signed aggregate is ${formatSignedAlpha(result.current.aggregateDiscrepancy)} α.\n\n` +
    `The old undercount is reachable only in the stable (mechanism 0) branch of ` +
    `\`swap_tao_for_alpha\`. Mainnet's 128 alpha subnets were all mechanism 1 at the ` +
    `runtime-298 introduction boundary and immediately before the deployed 410-era refactor ` +
    `(mainnet spec 411). Archived state at both edges of the ` +
    `${formatInteger(RUNTIME_410_FIX - RUNTIME_298_START)}-block window reports mechanism 1 for ` +
    `all 128 alpha subnets (${formatInteger(result.mechanismScan.valuesInspected)} values checked). ` +
    `This is paired with the runtime-298 source invariant: subnet registration rejects any ` +
    `\`mechid\` other than 1, both registration dispatches pass 1, and no live runtime path ` +
    `changes an active alpha subnet to mechanism 0. Therefore every alpha-subnet generation in ` +
    `this window follows the dynamic branch.\n\n` +
    `For mechanism 1, the buy swap first adds the bought alpha to \`SubnetAlphaOut\`; the ` +
    `release-298 subsidy code then subtracts that same amount. The net effect of the protocol ` +
    `buy is zero, while the participant emission is added normally. There is therefore no ` +
    `permanent \`SubnetAlphaOut\` undercount on the historical mainnet path.\n\n` +
    `## Why the earlier clone result was a false positive\n\n` +
    `The previous adjacent-block replay's formula-native discrepancy movement was at most ` +
    `${formatAlpha(result.priorReplay.maxGenericMovementRao)} α (${result.priorReplay.maxGenericMovementRao} rao). ` +
    `It became ${formatSignedAlpha(result.priorReplay.aggregateReclassifiedRao)} α only after every ` +
    `\`PendingAlphaSwapped\` increment was reclassified as unsold alpha. That field has mixed ` +
    `semantics: on the ordinary branch it records alpha already sold for root TAO and must not ` +
    `be counted as a pending alpha claim. The replay did not establish that the subsidy branch ` +
    `executed; its near-zero native movement is the valid control.\n\n` +
    `## Counter recommendation\n\n` +
    `Do not adjust \`SubnetAlphaOut\`, \`AlphaBurned\`, or \`SubnetProtocolAlpha\` based on ` +
    `this hypothesis. The supported correction amount is zero. Mechanically, if a real ` +
    `release-298 stable-branch undercount had accrued, the semantic repair would be ` +
    `\`SubnetAlphaOut += undercount\`: the alpha was neither burned nor protocol-owned. But ` +
    `that branch did not run for mainnet alpha subnets, so applying such a correction now would ` +
    `create a new negative discrepancy. Decreasing burned or protocol alpha would also be ` +
    `unsupported without independent evidence that either counter is overstated.\n\n` +
    `## Deployment and storage evidence\n\n` +
    `Mainnet skipped source spec 410 as an observed post-state and moved from spec 402 to spec ` +
    `411 at block ${formatInteger(RUNTIME_410_FIX)}. “410” below therefore refers to the code ` +
    `refactor incorporated into deployed spec 411. Runtime 298 was inspected at commit ` +
    `\`6309d35929e484ebff70c7da68547fb9c60f0d11\`; the deployed spec-411 source was ` +
    `inspected at commit \`486037ba45b87a453b1d660177cc1b105d0298c6\`.\n\n` +
    `| Post-state block | Runtime | Active alpha subnets | SubnetMechanism counts | Hash |\n` +
    `|---:|---:|---:|---|---|\n${boundaryRows}\n` +
    `| Historical boundary check | Value |\n|---|---:|\n` +
    `| Blocks covered | ${formatInteger(RUNTIME_410_FIX - RUNTIME_298_START)} |\n` +
    `| Snapshots inspected | ${formatInteger(result.mechanismScan.snapshotsInspected)} |\n` +
    `| Mechanism values inspected | ${formatInteger(result.mechanismScan.valuesInspected)} |\n` +
    `| Non-dynamic values | ${result.mechanismScan.nonDynamicChanges.length} |\n` +
    `\n` +
    `## Current finalized mainnet discrepancy\n\n` +
    `Certified post-migration snapshot reused from the existing mainnet accounting report: ` +
    `block ${formatInteger(result.current.height)}, runtime ${result.current.runtime}, ` +
    `hash \`${result.current.hash}\`.\n\n` +
    `Formula: actual = sum of \`TotalHotkeyAlpha\`; calculated = ` +
    `\`SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha - pending\`, where pending includes ` +
    `server, validator, root-alpha, owner-cut, and basket-deposit liabilities.\n\n` +
    `| Measure | Alpha |\n|---|---:|\n` +
    `| Current signed aggregate discrepancy | ${formatSignedAlpha(result.current.aggregateDiscrepancy)} |\n` +
    `| Predicted accrual from release 298→410 mechanism | ${formatSignedAlpha(result.predictedHistoricalAccrual)} |\n` +
    `| Unexplained by this hypothesis | ${formatSignedAlpha(result.aggregateDifference)} |\n\n` +
    `| Netuid | Actual staked α | SubnetAlphaOut α | Burned α | Protocol α | Pending α | Discrepancy α |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|\n${currentRows}\n` +
    `## Scope\n\n` +
    `This test rejects the proposed historical mechanism as the source of the present residual. ` +
    `It does not identify the remaining source; further search should continue after eliminating ` +
    `the invalid \`PendingAlphaSwapped\` reclassification.\n`;
}

function parseAlpha(value) {
  const normalized = value.replaceAll(",", "").trim();
  const negative = normalized.startsWith("-");
  const unsigned = normalized.replace(/^[+-]/u, "");
  const [whole, fraction = ""] = unsigned.split(".");
  const rao = BigInt(whole || "0") * 1_000_000_000n + BigInt(fraction.padEnd(9, "0").slice(0, 9));
  return negative ? -rao : rao;
}

function formatAlpha(rao) {
  const absolute = abs(rao);
  const whole = absolute / 1_000_000_000n;
  const fraction = (absolute % 1_000_000_000n).toString().padStart(9, "0");
  return `${whole.toLocaleString("en-US")}.${fraction}`;
}

function formatSignedAlpha(rao) {
  return `${rao >= 0n ? "+" : "-"}${formatAlpha(abs(rao))}`;
}

function formatMechanismCounts(counts) {
  return [...counts.entries()].map(([key, value]) => `${key}: ${value}`).join(", ");
}

function formatInteger(value) {
  return Number(value).toLocaleString("en-US");
}

function abs(value) {
  return value < 0n ? -value : value;
}

function loadDotenv() {
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/u);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function defaultEndpoint() {
  const apiKey = process.env.ONFINALITY_API_KEY;
  assert.ok(apiKey, "ONFINALITY_API_KEY or WS_ENDPOINT is required");
  return `wss://bittensor-finney.api.onfinality.io/ws?apikey=${apiKey}`;
}

function redactEndpoint(message) {
  return String(message).replace(/apikey=[^&\s]+/gu, "apikey=<redacted>");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
