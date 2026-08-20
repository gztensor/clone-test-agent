import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";

const MATERIAL_RAO = 1_000_000n;
const ROUNDING_TOLERANCE_RAO = 10_000n;
const CONTROL_720_BLOCK_MAX_RAO = 21_877n;
const CURRENT_SIGNED_RESIDUAL_RAO = 389_557_175_298_267n;
const PROJECTION_BLOCKS = 30_000n;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "runtime-298-subsidized-accounting.md");
const ERROR_PATH = path.resolve(
  __dirname,
  "..",
  "temp",
  "runtime-298-subsidized-accounting-error.log"
);

async function main() {
  fs.rmSync(ERROR_PATH, { force: true });
  const endpoint = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
  const laterHeight = await findAdjacentAllSubnetNonEpochBlock(endpoint);

  process.env.WS_ENDPOINT = endpoint;
  process.env.EXPECTED_RUNTIME_VERSION = "448";
  process.env.ALPHA_ACCOUNTING_DISTANCE = "1";
  process.env.ALPHA_ACCOUNTING_LATER_BLOCK = String(laterHeight);
  process.env.REQUIRE_EPOCH_FOR_ALL = "0";
  process.env.STORAGE_PAGE_DELAY_MS ??= "0";
  process.env.ALPHA_ACCOUNTING_REPORT_TITLE =
    "Runtime 298 subsidized-buy accounting reproduction";
  process.env.ALPHA_ACCOUNTING_REPORT_FILENAME = "runtime-298-subsidized-accounting.md";
  process.env.ALPHA_ACCOUNTING_LOG_FILENAME = "runtime-298-subsidized-accounting.log";

  const { main: runComparison } = await import("./mainnet-alpha-accounting-two-tempos.js");
  const result = await runComparison();
  assert.ok(
    result.comparisons.every((row) => row.epochCount === 0n && row.lastEpochAdvance === 0n),
    "an alpha subnet executed an epoch in the selected adjacent-block interval"
  );

  const supplemental = await readSupplementalAccounting(endpoint, result);
  const rows = result.comparisons.map((row, index) => {
    const pendingSwappedDelta = supplemental.laterPendingSwapped[index] -
      supplemental.earlierPendingSwapped[index];
    const alphaOutEmission = supplemental.alphaOutEmission[index];
    const boughtAlpha = alphaOutEmission - row.alphaOutChange;
    const correctedMovement = row.discrepancyChange + pendingSwappedDelta;
    const mechanismResidual = correctedMovement - boughtAlpha;
    return {
      ...row,
      pendingSwappedDelta,
      alphaOutEmission,
      boughtAlpha,
      correctedMovement,
      mechanismResidual,
    };
  });
  const subsidized = rows.filter((row) => row.boughtAlpha > MATERIAL_RAO);
  const aggregateBought = subsidized.reduce((total, row) => total + row.boughtAlpha, 0n);
  const projectedAggregate = aggregateBought * PROJECTION_BLOCKS;
  const projectionDifference = abs(projectedAggregate - CURRENT_SIGNED_RESIDUAL_RAO);
  const positiveResidualSubnets = subsidized.filter((row) => row.earlier.discrepancy > 0n);
  const minimumControlRatio = subsidized.reduce((minimum, row) => {
    const ratio = row.boughtAlpha * 720n / CONTROL_720_BLOCK_MAX_RAO;
    return minimum === null || ratio < minimum ? ratio : minimum;
  }, null);

  assert.ok(subsidized.length > 0, "no material subsidized subnet was active");
  assert.ok(
    subsidized.every((row) => row.pendingSwappedDelta > MATERIAL_RAO),
    "a subsidized subnet did not queue material unsold PendingAlphaSwapped"
  );
  assert.ok(
    subsidized.every((row) => row.correctedMovement > MATERIAL_RAO),
    "version-correct discrepancy did not increase on every subsidized subnet"
  );
  assert.ok(
    subsidized.every((row) => abs(row.mechanismResidual) <= ROUNDING_TOLERANCE_RAO),
    "bought alpha does not explain the version-correct discrepancy movement"
  );
  assert.ok(
    positiveResidualSubnets.length >= 120,
    "the candidate does not match the broad positive residual distribution"
  );
  assert.ok(minimumControlRatio >= 100n, "candidate movement is below the 100x control gate");
  assert.ok(
    projectionDifference * 100n <= CURRENT_SIGNED_RESIDUAL_RAO,
    "30,000-block aggregate projection differs from the current signed residual by more than 1%"
  );

  fs.appendFileSync(REPORT_PATH, renderFocusedResult(result, subsidized, {
    aggregateBought,
    projectedAggregate,
    projectionDifference,
    positiveResidualSubnets: positiveResidualSubnets.length,
    minimumControlRatio,
  }));
}

async function findAdjacentAllSubnetNonEpochBlock(endpoint) {
  let api;
  try {
    api = await connectApi(endpoint, {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 120_000,
    });
    for (let attempt = 0; attempt < 240; attempt += 1) {
      const laterHash = await api.rpc.chain.getFinalizedHead();
      const laterHeader = await api.rpc.chain.getHeader(laterHash);
      const laterHeight = laterHeader.number.toNumber();
      if (laterHeight < 2) {
        await delay(250);
        continue;
      }
      const earlierHash = await api.rpc.chain.getBlockHash(laterHeight - 1);
      const runtime = await api.rpc.state.getRuntimeVersion(laterHash);
      if (runtime.specVersion.toNumber() !== 448) {
        await delay(250);
        continue;
      }
      const [earlierApi, laterApi] = await Promise.all([
        api.at(earlierHash),
        api.at(laterHash),
      ]);
      const networkEntries = await laterApi.query.subtensorModule.networksAdded.entries();
      const netuids = networkEntries
        .filter(([, exists]) => exists.isTrue)
        .map(([key]) => key.args[0].toNumber())
        .filter((netuid) => netuid !== 0)
        .sort((a, b) => a - b);
      const [earlierMarkers, laterMarkers] = await Promise.all([
        earlierApi.query.subtensorModule.lastMechansimStepBlock.multi(netuids),
        laterApi.query.subtensorModule.lastMechansimStepBlock.multi(netuids),
      ]);
      const noEpoch = earlierMarkers.every(
        (marker, index) => marker.toBigInt() === laterMarkers[index].toBigInt()
      );
      if (noEpoch) return laterHeight;
      await delay(250);
    }
    throw new Error("could not find an adjacent block without any alpha-subnet epoch");
  } finally {
    await api?.disconnect();
  }
}

async function readSupplementalAccounting(endpoint, result) {
  let api;
  try {
    api = await connectApi(endpoint, {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 120_000,
    });
    const [earlierApi, laterApi] = await Promise.all([
      api.at(result.pair.earlier.hash),
      api.at(result.pair.later.hash),
    ]);
    const netuids = result.comparisons.map((row) => row.netuid);
    const [earlierPendingSwapped, laterPendingSwapped, alphaOutEmission] = await Promise.all([
      earlierApi.query.subtensorModule.pendingAlphaSwapped.multi(netuids),
      laterApi.query.subtensorModule.pendingAlphaSwapped.multi(netuids),
      laterApi.query.subtensorModule.subnetAlphaOutEmission.multi(netuids),
    ]);
    return {
      earlierPendingSwapped: earlierPendingSwapped.map((value) => value.toBigInt()),
      laterPendingSwapped: laterPendingSwapped.map((value) => value.toBigInt()),
      alphaOutEmission: alphaOutEmission.map((value) => value.toBigInt()),
    };
  } finally {
    await api?.disconnect();
  }
}

function renderFocusedResult(result, subsidized, significance) {
  const rows = subsidized.map((row) =>
    `| ${row.netuid} | ${formatAlpha(row.discrepancyChange)} | ` +
      `${formatAlpha(row.pendingSwappedDelta)} | ${formatAlpha(row.correctedMovement)} | ` +
      `${formatAlpha(row.alphaOutEmission)} | ${formatAlpha(row.alphaOutChange)} | ` +
      `${formatAlpha(row.boughtAlpha)} | ${formatAlpha(row.mechanismResidual)} |\n`
  ).join("");
  return `\n## Focused subsidized-buy accounting result\n\n` +
    `The selected blocks are adjacent and no alpha subnet executed an epoch. Runtime 298 ` +
    `uses \`PendingAlphaSwapped\` for two different things: normally it records alpha already ` +
    `sold for root TAO, but on the subsidized path the root sell is skipped and the same field ` +
    `holds unsold alpha that will be staked at the next epoch. The generic legacy formula ` +
    `excludes the whole field and therefore reports a transient negative movement. Adding only ` +
    `the observed unsold increment gives the version-correct movement.\n\n` +
    `- Candidate source: runtime 298 (\`v3.2.3\`, ` +
      `\`6309d35929e484ebff70c7da68547fb9c60f0d11\`)\n` +
    `- Candidate WASM SHA-256: ` +
      `\`3eb5e2d335ebd3dfbcbf8293822d98a9b7a01f5801378f1bda947a65557292a1\`\n` +
    `- Exact interval: ${result.pair.earlier.height} → ${result.pair.later.height}\n` +
    `- Material subsidized subnets: ${subsidized.map((row) => row.netuid).join(", ")}\n` +
    `- Positive current-residual subnets moving in the matching direction: ` +
      `${significance.positiveResidualSubnets}\n` +
    `- Aggregate bought alpha per block: ${formatAlpha(significance.aggregateBought)}\n` +
    `- Aggregate projection over 30,000 blocks: ` +
      `${formatAlpha(significance.projectedAggregate)}\n` +
    `- Certified current signed residual: ${formatAlpha(CURRENT_SIGNED_RESIDUAL_RAO)}\n` +
    `- Projection match: ${formatPercent(significance.projectedAggregate, CURRENT_SIGNED_RESIDUAL_RAO)} ` +
      `(difference ${formatAlpha(significance.projectionDifference)})\n` +
    `- Minimum per-subnet ratio to the corrected 720-block control maximum: ` +
      `${significance.minimumControlRatio.toLocaleString("en-US")}x\n` +
    `- Deployed positive-defect window: runtime 298 block 6,106,491 through runtime 326 ` +
      `(runtime 334 begins at block 6,811,690); runtime 297 lacks the subsidized path.\n` +
    `- The later complete recycling fix is commit ` +
      `\`6a76ecc0d\` ("hotfix: epoch w/subsidy fix (#2187)"), deployed in runtime 343.\n` +
    `- Maximum mechanism residual: ` +
      `${formatAlpha(subsidized.reduce((maximum, row) =>
        abs(row.mechanismResidual) > abs(maximum) ? row.mechanismResidual : maximum, 0n))}\n\n` +
    `| Netuid | Generic discrepancy Δ α | Unsold pending-swapped Δ α | ` +
      `Version-correct discrepancy Δ α | Minted AlphaOut α | SubnetAlphaOut Δ α | ` +
      `Bought alpha α | Corrected Δ − bought α |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|---:|\n` + rows +
    `\nFor every listed subnet, the corrected discrepancy increases by the bought-alpha amount ` +
    `within rounding tolerance. The exact source operation is the direct subtraction of bought ` +
    `alpha from \`SubnetAlphaOut\` while the full emitted alpha remains queued for staking.\n`;
}

function formatAlpha(raw) {
  const negative = raw < 0n;
  const value = negative ? -raw : raw;
  const whole = value / 1_000_000_000n;
  const fraction = (value % 1_000_000_000n).toString().padStart(9, "0");
  return `${negative ? "-" : "+"}${whole}.${fraction}`;
}

function formatPercent(numerator, denominator) {
  const scaled = numerator * 100_000_000n / denominator;
  const whole = scaled / 1_000_000n;
  const fraction = (scaled % 1_000_000n).toString().padStart(6, "0");
  return `${whole}.${fraction}%`;
}

function abs(value) {
  return value < 0n ? -value : value;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  const message = `${error?.stack ?? error}\n`;
  fs.mkdirSync(path.dirname(ERROR_PATH), { recursive: true });
  fs.writeFileSync(ERROR_PATH, message);
  console.error(error);
  process.exit(1);
});
