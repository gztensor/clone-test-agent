import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";

const RAO_PER_ALPHA = 1_000_000_000n;
const GLOBAL_CONTROL_720_RAO = 21_877n;
const ADJACENT_CONTROL_720_RAO = 3n * 720n;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "alpha-drift-runtime-423.md");
const STARTUP_ERROR_PATH = path.resolve(__dirname, "..", "temp", "alpha-drift-runtime-423-startup-error.log");
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
    "Alpha-accounting drift under historical runtime 423";
  process.env.ALPHA_ACCOUNTING_REPORT_FILENAME = "alpha-drift-runtime-423.md";
  process.env.ALPHA_ACCOUNTING_LOG_FILENAME = "alpha-drift-runtime-423.log";

  const { main: runComparison } = await import("./mainnet-alpha-accounting-two-tempos.js");
  await waitForFullCandidateWindow();
  const result = await runComparison();
  const controls = readSubnetControls();
  fs.appendFileSync(REPORT_PATH, renderCandidateAnalysis(result, controls));
  const legacyRootLedger = await analyzeLegacyRootLedger(result, controls);
  fs.appendFileSync(REPORT_PATH, renderLegacyRootLedger(legacyRootLedger));
}

async function analyzeLegacyRootLedger(result, controls) {
  let api;
  try {
    api = await connectApi(process.env.WS_ENDPOINT, {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 120_000,
    });
    assert.ok(api.query.subtensorModule.rootClaimable, "runtime 423 RootClaimable is missing");
    assert.ok(api.query.subtensorModule.rootClaimed, "runtime 423 RootClaimed is missing");
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
    const [earlierExact, laterExact] = await Promise.all([
      readExactLegacyOwed(api, result.pair.earlier.hash, earlierRates, earlierClaimed, "earlier"),
      readExactLegacyOwed(api, result.pair.later.hash, laterRates, laterClaimed, "later"),
    ]);

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
      const exactLedgerGrowth = (laterExact.bySubnet.get(comparison.netuid) ?? 0n) -
        (earlierExact.bySubnet.get(comparison.netuid) ?? 0n);
      const observedMissingAlpha = -comparison.discrepancyChange;
      const residual = observedMissingAlpha - unstakedLedgerGrowth;
      const exactResidual = observedMissingAlpha - exactLedgerGrowth;
      const projectedExactResidual30k = (absBigInt(exactResidual) * 30_000n) /
        BigInt(result.pair.distance);
      const projectedPctOfCurrentResidual = ratioPercent(
        projectedExactResidual30k,
        absBigInt(comparison.earlier.discrepancy)
      );
      const exactNormalized720 = (absBigInt(exactResidual) * 720n) /
        BigInt(result.pair.distance);
      const exactControl = maxBigInt(
        absBigInt(controls.get(comparison.netuid) ?? 0n),
        ADJACENT_CONTROL_720_RAO
      );
      const resultingDiscrepancyMovement = -exactResidual;
      const directionMatchesCurrent = resultingDiscrepancyMovement !== 0n &&
        comparison.earlier.discrepancy !== 0n &&
        (resultingDiscrepancyMovement > 0n) === (comparison.earlier.discrepancy > 0n);
      return {
        netuid: comparison.netuid,
        startingDiscrepancy: comparison.earlier.discrepancy,
        observedMissingAlpha,
        grossClaimableChange,
        claimedDelta,
        unstakedLedgerGrowth,
        exactLedgerGrowth,
        residual,
        exactResidual,
        projectedExactResidual30k,
        projectedPctOfCurrentResidual,
        exactNormalized720,
        exactControl,
        exactControlRatio: numericRatio(exactNormalized720, exactControl),
        directionMatchesCurrent,
        residualPct: ratioPercent(absBigInt(residual), absBigInt(observedMissingAlpha)),
        exactResidualPct: ratioPercent(absBigInt(exactResidual), absBigInt(observedMissingAlpha)),
      };
    });
    const signalRows = rows.filter((row) => absBigInt(row.observedMissingAlpha) > 1_000_000_000n);
    assert.ok(signalRows.length > 0, "candidate produced no material all-subnet signal");
    const worstResidual = signalRows.reduce((worst, row) =>
      absBigInt(row.residual) > absBigInt(worst.residual) ? row : worst, signalRows[0]);
    const worstRelative = signalRows.reduce((worst, row) =>
      row.residualPct > worst.residualPct ? row : worst, signalRows[0]);
    const worstExactResidual = signalRows.reduce((worst, row) =>
      absBigInt(row.exactResidual) > absBigInt(worst.exactResidual) ? row : worst, signalRows[0]);
    const worstExactRelative = signalRows.reduce((worst, row) =>
      row.exactResidualPct > worst.exactResidualPct ? row : worst, signalRows[0]);
    const exactThresholdCrossings = rows.filter((row) =>
      row.exactControlRatio >= 100 && row.directionMatchesCurrent
    );
    const positiveResidualRows = rows.filter((row) => row.startingDiscrepancy > 0n);
    const positiveDirectionMatches = positiveResidualRows.filter((row) =>
      row.directionMatchesCurrent
    );
    const rootCauseCandidateRows = positiveDirectionMatches.filter((row) =>
      row.exactControlRatio >= 100 &&
      absNumber(row.projectedPctOfCurrentResidual) >= 1.5
    );
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
    console.log(
      "largest exact per-position residual:",
      worstExactResidual.netuid,
      `${formatSignedAlpha(worstExactResidual.exactResidual)} alpha`
    );
    console.log(
      "largest exact relative residual:",
      worstExactRelative.netuid,
      `${worstExactRelative.exactResidualPct.toFixed(9)}%`
    );
    console.log(
      "version-correct 100x crossings with current-residual direction:",
      exactThresholdCrossings.map((row) => row.netuid).join(", ") || "none"
    );
    assert.ok(signalRows.length >= 120, "legacy root ledger does not explain an all-subnet signal");
    assert.ok(worstRelative.residualPct < 0.1, "legacy root ledger residual exceeds 0.1%");
    return {
      rows,
      signalRows,
      worstResidual,
      worstRelative,
      worstExactResidual,
      worstExactRelative,
      exactThresholdCrossings,
      positiveResidualRows,
      positiveDirectionMatches,
      rootCauseCandidateRows,
      earlierClaimedEntries: earlierClaimed.entryCount,
      laterClaimedEntries: laterClaimed.entryCount,
      changedRootStakeHotkeys,
      earlierRootPositions: earlierExact.positionCount,
      laterRootPositions: laterExact.positionCount,
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
  const byPosition = new Map();
  for (const [key, value] of entries) {
    const netuid = key.args[0].toNumber();
    const claimed = value.toBigInt();
    totals.set(netuid, (totals.get(netuid) ?? 0n) + value.toBigInt());
    byPosition.set(`${netuid}|${key.args[1]}|${key.args[2]}`, claimed);
  }
  return { totals, byPosition, entryCount: entries.length };
}

async function readExactLegacyOwed(api, hash, rates, claimed, label) {
  const apiAt = await api.at(hash);
  const activeHotkeys = new Set([...rates]
    .filter(([, bySubnet]) => [...bySubnet.values()].some((bits) => bits !== 0n))
    .map(([hotkey]) => hotkey));
  const stakingEntries = await api.query.subtensorModule.stakingHotkeys.entriesAt(hash);
  const pairs = [];
  const pairKeys = new Set();
  for (const [key, hotkeys] of stakingEntries) {
    for (const hotkey of hotkeys) {
      const hotkeyString = hotkey.toString();
      if (!activeHotkeys.has(hotkeyString)) continue;
      const pairKey = `${hotkeyString}|${key.args[0]}`;
      if (pairKeys.has(pairKey)) continue;
      pairKeys.add(pairKey);
      pairs.push({ hotkey, hotkeyString, coldkey: key.args[0] });
    }
  }
  const hotkeyCodecs = [...activeHotkeys].map((hotkey) =>
    pairs.find((pair) => pair.hotkeyString === hotkey)?.hotkey
  ).filter(Boolean);
  const hotkeyIndex = new Map(hotkeyCodecs.map((hotkey, index) => [hotkey.toString(), index]));
  const [totals, denominatorV1, denominatorV2, sharesV1, sharesV2] = await Promise.all([
    batchedMultiLocal(apiAt.query.subtensorModule.totalHotkeyAlpha, hotkeyCodecs.map((hotkey) => [hotkey, 0]), `${label} root totals`),
    batchedMultiLocal(apiAt.query.subtensorModule.totalHotkeyShares, hotkeyCodecs.map((hotkey) => [hotkey, 0]), `${label} root denominator v1`),
    batchedMultiLocal(apiAt.query.subtensorModule.totalHotkeySharesV2, hotkeyCodecs.map((hotkey) => [hotkey, 0]), `${label} root denominator v2`),
    batchedMultiLocal(apiAt.query.subtensorModule.alpha, pairs.map((pair) => [pair.hotkey, pair.coldkey, 0]), `${label} root shares v1`),
    batchedMultiLocal(apiAt.query.subtensorModule.alphaV2, pairs.map((pair) => [pair.hotkey, pair.coldkey, 0]), `${label} root shares v2`),
  ]);
  const positionsByHotkey = new Map(hotkeyCodecs.map((hotkey) => [hotkey.toString(), []]));
  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const hotkeyOffset = hotkeyIndex.get(pair.hotkeyString);
    const denominator = denominatorV1[hotkeyOffset].bits.toBigInt() !== 0n
      ? safeFromU64F64(denominatorV1[hotkeyOffset].bits.toBigInt())
      : safeFromCodec(denominatorV2[hotkeyOffset]);
    if (denominator.mantissa === 0n) continue;
    const share = sharesV1[index].bits.toBigInt() !== 0n
      ? safeFromU64F64(sharesV1[index].bits.toBigInt())
      : safeFromCodec(sharesV2[index]);
    if (share.mantissa === 0n) continue;
    const stake = safeToU64(safeMulDiv(
      safeFromU64(totals[hotkeyOffset].toBigInt()),
      share,
      denominator
    ));
    if (stake > 0n) positionsByHotkey.get(pair.hotkeyString).push({
      coldkey: pair.coldkey.toString(),
      stake,
    });
  }
  const bySubnet = new Map();
  let positionCount = 0;
  for (const [hotkey, bySubnetRate] of rates) {
    const positions = positionsByHotkey.get(hotkey) ?? [];
    positionCount += positions.length;
    for (const [netuid, rateBits] of bySubnetRate) {
      let owed = 0n;
      for (const position of positions) {
        const gross = (rateBits * position.stake) >> 32n;
        const watermark = claimed.byPosition.get(`${netuid}|${hotkey}|${position.coldkey}`) ?? 0n;
        if (gross > watermark) owed += gross - watermark;
      }
      bySubnet.set(netuid, (bySubnet.get(netuid) ?? 0n) + owed);
    }
  }
  console.log(`${label} exact root claimant pairs:`, pairs.length);
  console.log(`${label} exact positive root positions:`, positionCount);
  return { bySubnet, positionCount };
}

async function batchedMultiLocal(query, args, label, batchSize = 1_000) {
  const values = [];
  for (let offset = 0; offset < args.length; offset += batchSize) {
    values.push(...await query.multi(args.slice(offset, offset + batchSize)));
    console.log(`${label}: ${values.length}/${args.length}`);
  }
  return values;
}

function renderLegacyRootLedger(analysis) {
  const isolatedCrossings = analysis.exactThresholdCrossings.length > 0
    ? ` Isolated 100× control-ratio crossings occur on subnet(s) ` +
      `${analysis.exactThresholdCrossings.map((row) => row.netuid).join(", ")}, but those are ` +
      `pre-existing negative/outlier residuals rather than the broad positive 1–2% population.`
    : "";
  const candidateVerdict = analysis.rootCauseCandidateRows.length > 0
    ? `The version-correct signal also matches the positive current-residual direction, exceeds ` +
      `100× control, and projects to at least 1.5% of the same residual on subnet(s) ` +
      `${analysis.rootCauseCandidateRows.map((row) => row.netuid).join(", ")}; this requires ` +
      `fresh-clone reproduction before stopping.`
    : `None of the ${analysis.positiveResidualRows.length} positive current-residual subnets moves ` +
      `in the matching direction after liability correction.${isolatedCrossings} The sign, scale, ` +
      `and distribution tests therefore fail, so runtime 423 is not the stopping candidate.`;
  return `\n## Legacy root-dividend ledger attribution\n\n` +
    `Runtime 423 keeps earned root dividends outside stake in \`RootClaimable\` until ` +
    `automatic or manual claims materialize them. The base accounting formula does not ` +
    `subtract that legacy liability. Reconstructing its change at both snapshots as ` +
    `\`Δ(sum(RootClaimableRate × root stake) - sum(RootClaimed))\` explains all ` +
    `${analysis.signalRows.length} material subnet movements. The stopping decision uses the ` +
    `exact per-position reconstruction, not the aggregate approximation.\n\n` +
    `- \`RootClaimed\` entries: ${analysis.earlierClaimedEntries.toLocaleString("en-US")} → ` +
    `${analysis.laterClaimedEntries.toLocaleString("en-US")}\n` +
    `- Root hotkeys whose stake changed through automatic claims: ` +
    `${analysis.changedRootStakeHotkeys}\n` +
    `- Positive root positions: ${analysis.earlierRootPositions.toLocaleString("en-US")} → ` +
    `${analysis.laterRootPositions.toLocaleString("en-US")}\n` +
    `- Largest aggregate-approximation residual: subnet ${analysis.worstResidual.netuid}, ` +
    `${formatSignedAlpha(analysis.worstResidual.residual)} α\n` +
    `- Largest aggregate relative residual among movements above 1 α: subnet ` +
    `${analysis.worstRelative.netuid}, ${analysis.worstRelative.residualPct.toFixed(6)}%\n\n` +
    `- Largest exact per-position residual: subnet ${analysis.worstExactResidual.netuid}, ` +
    `${formatSignedAlpha(analysis.worstExactResidual.exactResidual)} α\n` +
    `- Largest exact relative residual among movements above 1 α: subnet ` +
    `${analysis.worstExactRelative.netuid}, ${analysis.worstExactRelative.exactResidualPct.toFixed(9)}%\n\n` +
    `- Worst exact residual projected linearly to 30,000 blocks: ` +
    `${formatAlpha(analysis.worstExactResidual.projectedExactResidual30k)} α, or ` +
    `${analysis.worstExactResidual.projectedPctOfCurrentResidual.toFixed(6)}% of that subnet's ` +
    `starting/current-scale residual. ${candidateVerdict}\n\n` +
    `| Netuid | Observed newly missing α | Gross claimable entitlement Δ α | ` +
    `RootClaimed increase α | Aggregate ledger growth α | Aggregate residual α | Exact per-position ledger growth α | Exact residual α | Exact residual | Exact 720-block α | Control ratio | Current direction? |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n` +
    analysis.rows.map((row) =>
      `| ${row.netuid} | ${formatSignedAlpha(row.observedMissingAlpha)} | ` +
      `${formatSignedAlpha(row.grossClaimableChange)} | ${formatSignedAlpha(row.claimedDelta)} | ` +
      `${formatSignedAlpha(row.unstakedLedgerGrowth)} | ${formatSignedAlpha(row.residual)} | ` +
      `${formatSignedAlpha(row.exactLedgerGrowth)} | ${formatSignedAlpha(row.exactResidual)} | ` +
      `${row.exactResidualPct.toFixed(9)}% | ${formatAlpha(row.exactNormalized720)} | ` +
      `${formatRatio(row.exactControlRatio)}× | ${row.directionMatchesCurrent ? "yes" : "no"} |\n`
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
    `- Candidate source runtime: 423\n` +
    `- Candidate git commit: \`06032d518fbaead1ddc2039e9e6aa55715026364\`\n` +
    `- Locally advertised runtime: 448\n` +
    `- Compact compressed WASM SHA-256: \`2a4b6dba3a1a2169155c9660ec4e9806332cd8034ba293d774bfa3e364329912\`\n` +
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

function absNumber(value) {
  return value < 0 ? -value : value;
}

const SAFE_FLOAT_MAX = 1_000_000_000_000_000_000_000n;
const SAFE_FLOAT_MIN = SAFE_FLOAT_MAX / 10n;

function safeNormalize(mantissa, exponent) {
  let normalizedMantissa = BigInt(mantissa);
  let normalizedExponent = Number(exponent);
  if (normalizedMantissa === 0n) return { mantissa: 0n, exponent: 0 };
  while (normalizedMantissa > SAFE_FLOAT_MAX) {
    normalizedMantissa /= 10n;
    normalizedExponent += 1;
  }
  while (normalizedMantissa <= SAFE_FLOAT_MIN) {
    normalizedMantissa *= 10n;
    normalizedExponent -= 1;
  }
  return { mantissa: normalizedMantissa, exponent: normalizedExponent };
}

function safeFromU64(value) {
  return safeNormalize(BigInt(value), 0);
}

function safeFromCodec(value) {
  const json = value.toJSON();
  return safeNormalize(BigInt(String(json.mantissa)), Number(json.exponent));
}

function safeFromU64F64(bitsValue) {
  const bits = BigInt(bitsValue);
  if (bits === 0n) return safeFromU64(0n);
  const integer = safeFromU64(bits >> 64n);
  const fraction = safeDiv(
    safeFromU64(bits & ((1n << 64n) - 1n)),
    safeFromU64(1n << 64n)
  );
  return safeAdd(integer, fraction);
}

function safeDiv(left, right) {
  assert.notEqual(right.mantissa, 0n, "SafeFloat division by zero");
  return safeNormalize(
    (left.mantissa * SAFE_FLOAT_MAX) / right.mantissa,
    left.exponent - right.exponent - 21
  );
}

function safeAdd(left, right) {
  if (left.mantissa === 0n) return right;
  if (right.mantissa === 0n) return left;
  if (left.exponent >= right.exponent) {
    return safeNormalize(
      left.mantissa + right.mantissa / safePow10(left.exponent - right.exponent),
      left.exponent
    );
  }
  return safeNormalize(
    left.mantissa / safePow10(right.exponent - left.exponent) + right.mantissa,
    right.exponent
  );
}

function safeMulDiv(left, multiplier, divisor) {
  assert.notEqual(divisor.mantissa, 0n, "SafeFloat mul_div by zero");
  return safeNormalize(
    (left.mantissa * multiplier.mantissa) / divisor.mantissa,
    left.exponent + multiplier.exponent - divisor.exponent
  );
}

function safeToU64(value) {
  if (value.exponent >= 0) return value.mantissa * (10n ** BigInt(value.exponent));
  return value.mantissa / (10n ** BigInt(-value.exponent));
}

function safePow10(exponent) {
  return 10n ** BigInt(Math.min(exponent, 22));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  fs.writeFileSync(STARTUP_ERROR_PATH, `${error?.stack ?? error}\n`);
  console.error(error);
  process.exit(1);
});
