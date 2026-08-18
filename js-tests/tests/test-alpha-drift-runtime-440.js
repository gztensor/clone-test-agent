import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";

const RAO_PER_ALPHA = 1_000_000_000n;
const GLOBAL_CONTROL_720_RAO = 21_877n;
const ADJACENT_CONTROL_720_RAO = 3n * 720n;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "alpha-drift-runtime-440.md");
const CONTROL_REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "mainnet-alpha-accounting-two-tempos-report.md"
);

async function main() {
  process.env.WS_ENDPOINT ??= "ws://127.0.0.1:9944";
  process.env.EXPECTED_RUNTIME_VERSION = "448";
  process.env.ALPHA_ACCOUNTING_DISTANCE = "max-tempo";
  process.env.REQUIRE_EPOCH_FOR_ALL = "1";
  process.env.STORAGE_PAGE_DELAY_MS ??= "0";
  process.env.ALPHA_ACCOUNTING_REPORT_TITLE =
    "Alpha-accounting drift under historical runtime 440";
  process.env.ALPHA_ACCOUNTING_REPORT_FILENAME = "alpha-drift-runtime-440.md";
  process.env.ALPHA_ACCOUNTING_LOG_FILENAME = "alpha-drift-runtime-440.log";

  const { main: runComparison } = await import("./mainnet-alpha-accounting-two-tempos.js");
  await waitForFullCandidateWindow();
  const result = await runComparison();
  const controls = readSubnetControls();
  fs.appendFileSync(REPORT_PATH, renderCandidateAnalysis(result, controls));
  const legacyRootLedger = await analyzeLegacyRootLedger(result);
  fs.appendFileSync(REPORT_PATH, renderLegacyRootLedger(legacyRootLedger));
}

async function analyzeLegacyRootLedger(result) {
  let api;
  try {
    api = await connectApi(process.env.WS_ENDPOINT, {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 120_000,
    });
    assert.ok(api.query.subtensorModule.rootClaimable, "runtime 440 RootClaimable is missing");
    assert.ok(api.query.subtensorModule.rootClaimed, "runtime 440 RootClaimed is missing");
    const [earlierRates, laterRates, earlierClaimed, laterClaimed] = await Promise.all([
      readRootClaimableRates(api, result.pair.earlier.hash, "earlier"),
      readRootClaimableRates(api, result.pair.later.hash, "later"),
      readRootClaimedTotals(api, result.pair.earlier.hash, "earlier"),
      readRootClaimedTotals(api, result.pair.later.hash, "later"),
    ]);
    const hotkeys = new Set([...earlierRates.keys(), ...laterRates.keys()]);
    const stakes = new Map(await Promise.all([...hotkeys].map(async (hotkey) => {
      const [earlierStake, laterStake] = await Promise.all([
        api.query.subtensorModule.totalHotkeyAlpha.at(result.pair.earlier.hash, hotkey, 0),
        api.query.subtensorModule.totalHotkeyAlpha.at(result.pair.later.hash, hotkey, 0),
      ]);
      return [hotkey, {
        earlier: earlierStake.toBigInt(),
        later: laterStake.toBigInt(),
      }];
    })));
    const changedRootStakeHotkeys = [...stakes.values()].filter(
      (stake) => stake.earlier !== stake.later
    ).length;

    const rows = result.comparisons.map((comparison) => {
      let earlierGrossClaimable = 0n;
      let laterGrossClaimable = 0n;
      for (const hotkey of hotkeys) {
        const stake = stakes.get(hotkey) ?? { earlier: 0n, later: 0n };
        const earlierRate = earlierRates.get(hotkey)?.get(comparison.netuid) ?? 0n;
        const laterRate = laterRates.get(hotkey)?.get(comparison.netuid) ?? 0n;
        earlierGrossClaimable += (earlierRate * stake.earlier) >> 32n;
        laterGrossClaimable += (laterRate * stake.later) >> 32n;
      }
      const grossClaimableChange = laterGrossClaimable - earlierGrossClaimable;
      const claimedDelta = (laterClaimed.totals.get(comparison.netuid) ?? 0n) -
        (earlierClaimed.totals.get(comparison.netuid) ?? 0n);
      const unstakedLedgerGrowth = grossClaimableChange - claimedDelta;
      const observedMissingAlpha = -comparison.discrepancyChange;
      const residual = observedMissingAlpha - unstakedLedgerGrowth;
      return {
        netuid: comparison.netuid,
        observedMissingAlpha,
        grossClaimableChange,
        claimedDelta,
        unstakedLedgerGrowth,
        residual,
        residualPct: ratioPercent(absBigInt(residual), absBigInt(observedMissingAlpha)),
      };
    });
    const signalRows = rows.filter((row) => row.observedMissingAlpha > 1_000_000_000n);
    const worstResidual = signalRows.reduce((worst, row) =>
      absBigInt(row.residual) > absBigInt(worst.residual) ? row : worst, signalRows[0]);
    const worstRelative = signalRows.reduce((worst, row) =>
      row.residualPct > worst.residualPct ? row : worst, signalRows[0]);
    assert.ok(signalRows.length >= 120, "legacy root ledger does not explain an all-subnet signal");
    assert.ok(worstRelative.residualPct < 0.1, "legacy root ledger residual exceeds 0.1%");
    console.log("legacy RootClaimed entries:", earlierClaimed.entryCount, "->", laterClaimed.entryCount);
    console.log("root hotkeys with stake movement:", changedRootStakeHotkeys);
    console.log(
      "largest legacy-ledger residual:",
      worstResidual.netuid,
      `${formatSignedAlpha(worstResidual.residual)} alpha`
    );
    console.log(
      "largest relative legacy-ledger residual:",
      worstRelative.netuid,
      `${worstRelative.residualPct.toFixed(6)}%`
    );
    return {
      rows,
      signalRows,
      worstResidual,
      worstRelative,
      earlierClaimedEntries: earlierClaimed.entryCount,
      laterClaimedEntries: laterClaimed.entryCount,
      changedRootStakeHotkeys,
    };
  } finally {
    await api?.disconnect();
  }
}

async function readRootClaimableRates(api, hash, label) {
  const entries = await api.query.subtensorModule.rootClaimable.entriesAt(hash);
  console.log(`${label} RootClaimable hotkeys:`, entries.length);
  return new Map(entries.map(([key, value]) => [
    key.args[0].toString(),
    new Map([...value].map(([netuid, rate]) => [netuid.toNumber(), rate.bits.toBigInt()])),
  ]));
}

async function readRootClaimedTotals(api, hash, label) {
  const entries = await api.query.subtensorModule.rootClaimed.entriesAt(hash);
  console.log(`${label} RootClaimed entries:`, entries.length);
  const totals = new Map();
  for (const [key, value] of entries) {
    const netuid = key.args[0].toNumber();
    totals.set(netuid, (totals.get(netuid) ?? 0n) + value.toBigInt());
  }
  return { totals, entryCount: entries.length };
}

function renderLegacyRootLedger(analysis) {
  return `\n## Legacy root-dividend ledger attribution\n\n` +
    `Runtime 440 keeps earned root dividends outside stake in \`RootClaimable\` until ` +
    `automatic or manual claims materialize them. The base accounting formula does not ` +
    `subtract that legacy liability. Reconstructing its change at both snapshots as ` +
    `\`Δ(sum(RootClaimableRate × root stake) - sum(RootClaimed))\` explains all ` +
    `${analysis.signalRows.length} material subnet movements to within 0.1%.\n\n` +
    `- \`RootClaimed\` entries: ${analysis.earlierClaimedEntries.toLocaleString("en-US")} → ` +
    `${analysis.laterClaimedEntries.toLocaleString("en-US")}\n` +
    `- Root hotkeys whose stake changed through automatic claims: ` +
    `${analysis.changedRootStakeHotkeys}\n` +
    `- Largest absolute residual: subnet ${analysis.worstResidual.netuid}, ` +
    `${formatSignedAlpha(analysis.worstResidual.residual)} α\n` +
    `- Largest relative residual among movements above 1 α: subnet ` +
    `${analysis.worstRelative.netuid}, ${analysis.worstRelative.residualPct.toFixed(6)}%\n\n` +
    `| Netuid | Observed newly missing α | Gross claimable entitlement Δ α | ` +
    `RootClaimed increase α | Net unstaked ledger growth α | Unexplained residual α | Residual |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|\n` +
    analysis.rows.map((row) =>
      `| ${row.netuid} | ${formatSignedAlpha(row.observedMissingAlpha)} | ` +
      `${formatSignedAlpha(row.grossClaimableChange)} | ${formatSignedAlpha(row.claimedDelta)} | ` +
      `${formatSignedAlpha(row.unstakedLedgerGrowth)} | ${formatSignedAlpha(row.residual)} | ` +
      `${row.residualPct.toFixed(6)}% |\n`
    ).join("");
}

async function waitForFullCandidateWindow() {
  let api;
  try {
    api = await connectApi(process.env.WS_ENDPOINT, {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 120_000,
    });
    const startHash = await api.rpc.chain.getFinalizedHead();
    const [startHeader, runtime, tempoEntries] = await Promise.all([
      api.rpc.chain.getHeader(startHash),
      api.rpc.state.getRuntimeVersion(startHash),
      api.query.subtensorModule.tempo.entriesAt(startHash),
    ]);
    assert.equal(runtime.specVersion.toNumber(), 448, "candidate runtime is not active");
    const maxTempo = Math.max(...tempoEntries.map(([, value]) => value.toNumber()));
    assert.ok(maxTempo > 0, "no positive subnet tempo found");
    const startHeight = startHeader.number.toNumber();
    console.log("candidate-only window check starts:", startHeight, startHash.toString());
    console.log("required candidate-only history:", maxTempo, "blocks");

    while (true) {
      const currentHash = await api.rpc.chain.getFinalizedHead();
      const currentHeader = await api.rpc.chain.getHeader(currentHash);
      const currentHeight = currentHeader.number.toNumber();
      let earlierRuntimeVersion = null;
      if (currentHeight > maxTempo) {
        const earlierHash = await api.rpc.chain.getBlockHash(currentHeight - maxTempo);
        const earlierRuntime = await api.rpc.state.getRuntimeVersion(earlierHash);
        earlierRuntimeVersion = earlierRuntime.specVersion.toNumber();
      }
      console.log(
        "candidate window progress:",
        currentHeight,
        `(runtime ${earlierRuntimeVersion ?? "n/a"} at ${currentHeight - maxTempo})`
      );
      if (earlierRuntimeVersion === 448) break;
      await delay(5_000);
    }
  } finally {
    await api?.disconnect();
  }
}

function renderCandidateAnalysis(result, controls) {
  const rows = result.comparisons.map((row) => analyzeRow(row, result.pair.distance, controls));
  const maxGlobal = rows.reduce((best, row) => row.globalControlRatio > best.globalControlRatio
    ? row
    : best, rows[0]);
  const maxSubnet = rows.reduce((best, row) => row.subnetControlRatio > best.subnetControlRatio
    ? row
    : best, rows[0]);
  const thresholdCrossings = rows.filter((row) => row.subnetControlRatio >= 100);

  return `\n## Historical-candidate normalization\n\n` +
    `- Candidate source runtime: 440\n` +
    `- Candidate git commit: \`e4ffa2e1325c6c7db618dbceaf396310a170990c\`\n` +
    `- Locally advertised runtime: 448\n` +
    `- Compact compressed WASM SHA-256: \`aad13277b04f6a6afa8947c40b36c2da7fb51efd299b1fde23cb56ef6bc016b5\`\n` +
    `- Runtime-447 global control: ${formatAlpha(GLOBAL_CONTROL_720_RAO)} α per 720 blocks\n` +
    `- Search threshold: 100× each subnet's corrected control, floored at the adjacent-block 3-rao-per-block envelope\n\n` +
    `Largest ratio to the global control: subnet ${maxGlobal.netuid}, ${formatRatio(maxGlobal.globalControlRatio)}×. ` +
    `Largest ratio to its subnet control: subnet ${maxSubnet.netuid}, ${formatRatio(maxSubnet.subnetControlRatio)}×. ` +
    `${thresholdCrossings.length} subnet(s) crossed the 100× search threshold` +
    `${thresholdCrossings.length ? `: ${thresholdCrossings.map((row) => row.netuid).join(", ")}` : ""}. ` +
    `A crossing is a search signal; the root-cause verdict still requires component evidence and reproduction from the pristine clone.\n\n` +
    normalizedTable(rows) + `\n` +
    `## All-subnet component deltas\n\n` +
    allComponentTable(result.comparisons);
}

function analyzeRow(row, distance, controls) {
  const absoluteMovement = absBigInt(row.discrepancyChange);
  const normalized720 = (absoluteMovement * 720n) / BigInt(distance);
  const subnetControl = maxBigInt(
    absBigInt(controls.get(row.netuid) ?? 0n),
    ADJACENT_CONTROL_720_RAO
  );
  return {
    ...row,
    absoluteMovement,
    normalized720,
    movementPctOfStart: ratioPercent(absoluteMovement, absBigInt(row.earlier.discrepancy)),
    perEpoch: row.epochCount > 0n ? row.discrepancyChange / row.epochCount : null,
    subnetControl,
    subnetControlRatio: numericRatio(normalized720, subnetControl),
    globalControlRatio: numericRatio(normalized720, GLOBAL_CONTROL_720_RAO),
  };
}

function normalizedTable(rows) {
  return `| Netuid | Tempo | Epochs | Starting discrepancy α | Signed movement α | Movement / start | Movement / epoch α | 720-block normalized α | Subnet control α | Subnet-control ratio | Global-control ratio |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n` +
    rows.map((row) =>
      `| ${row.netuid} | ${row.tempo} | ${row.epochCount} | ` +
      `${formatSignedAlpha(row.earlier.discrepancy)} | ${formatSignedAlpha(row.discrepancyChange)} | ` +
      `${formatPercent(row.movementPctOfStart)} | ` +
      `${row.perEpoch === null ? "n/a" : formatSignedAlpha(row.perEpoch)} | ` +
      `${formatAlpha(row.normalized720)} | ${formatAlpha(row.subnetControl)} | ` +
      `${formatRatio(row.subnetControlRatio)}× | ${formatRatio(row.globalControlRatio)}× |\n`
    ).join("");
}

function allComponentTable(rows) {
  return `| Netuid | Actual staked Δ α | Calculated staked Δ α | SubnetAlphaOut Δ α | AlphaBurned Δ α | Pending Δ α | Protocol Δ α |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|\n` +
    rows.map((row) =>
      `| ${row.netuid} | ${formatSignedAlpha(row.actualStakeChange)} | ` +
      `${formatSignedAlpha(row.calculatedStakeChange)} | ${formatSignedAlpha(row.alphaOutChange)} | ` +
      `${formatSignedAlpha(row.burnedChange)} | ${formatSignedAlpha(row.pendingChange)} | ` +
      `${formatSignedAlpha(row.protocolChange)} |\n`
    ).join("");
}

function readSubnetControls() {
  const report = fs.readFileSync(CONTROL_REPORT_PATH, "utf8");
  const section = report.split("## Discrepancy changes\n")[1]?.split("\n## ")[0] ?? "";
  const controls = new Map();
  for (const line of section.split("\n")) {
    if (!/^\| \d+ \|/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    controls.set(Number(cells[0]), parseAlpha(cells[6]));
  }
  if (controls.size === 0) throw new Error("failed to parse runtime-447 subnet controls");
  return controls;
}

function parseAlpha(value) {
  const cleaned = value.replace(/[+,]/g, "").trim();
  const negative = cleaned.startsWith("-");
  const unsigned = negative ? cleaned.slice(1) : cleaned;
  const [whole, fraction = ""] = unsigned.split(".");
  const raw = BigInt(whole || "0") * RAO_PER_ALPHA +
    BigInt(fraction.padEnd(9, "0").slice(0, 9) || "0");
  return negative ? -raw : raw;
}

function formatAlpha(raw) {
  const value = BigInt(raw);
  const sign = value < 0n ? "-" : "";
  const absolute = absBigInt(value);
  const whole = absolute / RAO_PER_ALPHA;
  const fraction = (absolute % RAO_PER_ALPHA).toString().padStart(9, "0").replace(/0+$/, "");
  return `${sign}${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
}

function formatSignedAlpha(raw) {
  const value = BigInt(raw);
  return `${value > 0n ? "+" : ""}${formatAlpha(value)}`;
}

function ratioPercent(numerator, denominator) {
  if (denominator === 0n) return numerator === 0n ? 0 : Infinity;
  return Number(numerator * 100_000_000n / denominator) / 1_000_000;
}

function numericRatio(numerator, denominator) {
  if (denominator === 0n) return numerator === 0n ? 0 : Infinity;
  return Number(numerator * 1_000_000n / denominator) / 1_000_000;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value.toFixed(6)}%` : "∞";
}

function formatRatio(value) {
  if (!Number.isFinite(value)) return "∞";
  if (value >= 100) return value.toFixed(1);
  if (value >= 1) return value.toFixed(3);
  return value.toFixed(6);
}

function maxBigInt(left, right) {
  return left > right ? left : right;
}

function absBigInt(value) {
  return value < 0n ? -value : value;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
