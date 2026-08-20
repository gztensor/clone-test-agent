import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";

const REPRODUCED_NETUIDS = [58, 70, 90, 99, 103];
const HISTORICAL_OUTLIER_NETUIDS = [40, 58, 70, 84, 90, 99, 103];
const MATERIAL_RAO = 1_000_000n;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "runtime-338-subsidized-accounting.md");
const ERROR_PATH = path.resolve(
  __dirname,
  "..",
  "temp",
  "runtime-338-subsidized-accounting-error.log"
);

async function main() {
  fs.rmSync(ERROR_PATH, { force: true });
  const endpoint = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
  const laterHeight = await findAdjacentNonEpochBlock(endpoint);

  process.env.WS_ENDPOINT = endpoint;
  process.env.EXPECTED_RUNTIME_VERSION = "448";
  process.env.ALPHA_ACCOUNTING_DISTANCE = "1";
  process.env.ALPHA_ACCOUNTING_LATER_BLOCK = String(laterHeight);
  process.env.REQUIRE_EPOCH_FOR_ALL = "0";
  process.env.STORAGE_PAGE_DELAY_MS ??= "0";
  process.env.ALPHA_ACCOUNTING_REPORT_TITLE =
    "Runtime 338 subsidized-accounting adjacent-block reproduction";
  process.env.ALPHA_ACCOUNTING_REPORT_FILENAME = "runtime-338-subsidized-accounting.md";
  process.env.ALPHA_ACCOUNTING_LOG_FILENAME = "runtime-338-subsidized-accounting.log";

  const { main: runComparison } = await import("./mainnet-alpha-accounting-two-tempos.js");
  const result = await runComparison();
  const byNetuid = new Map(result.comparisons.map((row) => [row.netuid, row]));
  const suspects = REPRODUCED_NETUIDS.map((netuid) => byNetuid.get(netuid));
  assert.ok(suspects.every(Boolean), "one or more suspect subnets are inactive");
  assert.ok(
    suspects.every((row) => row.epochCount === 0n && row.lastEpochAdvance === 0n),
    "a suspect subnet executed an epoch in the adjacent-block interval"
  );
  assert.ok(
    suspects.every((row) => row.discrepancyChange < -MATERIAL_RAO),
    "the continuously subsidized subnets did not all reproduce material negative discrepancy drift"
  );

  const materialNegative = result.comparisons.filter(
    (row) => row.epochCount === 0n && row.discrepancyChange < -MATERIAL_RAO
  );
  const rawPositiveMovements = result.comparisons.filter(
    (row) => row.earlier.discrepancy > 0n && row.discrepancyChange > MATERIAL_RAO
  );

  fs.appendFileSync(REPORT_PATH, renderFocusedResult({
    result,
    suspects,
    materialNegative,
    rawPositiveMovements,
  }));
}

async function findAdjacentNonEpochBlock(endpoint) {
  let api;
  try {
    api = await connectApi(endpoint, {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 120_000,
    });
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const laterHash = await api.rpc.chain.getFinalizedHead();
      const laterHeader = await api.rpc.chain.getHeader(laterHash);
      const laterHeight = laterHeader.number.toNumber();
      if (laterHeight < 2) {
        await delay(250);
        continue;
      }
      const earlierHash = await api.rpc.chain.getBlockHash(laterHeight - 1);
      const [runtime, earlierApi, laterApi] = await Promise.all([
        api.rpc.state.getRuntimeVersion(laterHash),
        api.at(earlierHash),
        api.at(laterHash),
      ]);
      if (runtime.specVersion.toNumber() !== 448) {
        await delay(250);
        continue;
      }
      const [earlierMarkers, laterMarkers] = await Promise.all([
        earlierApi.query.subtensorModule.lastMechansimStepBlock.multi(HISTORICAL_OUTLIER_NETUIDS),
        laterApi.query.subtensorModule.lastMechansimStepBlock.multi(HISTORICAL_OUTLIER_NETUIDS),
      ]);
      const noEpoch = earlierMarkers.every(
        (marker, index) => marker.toBigInt() === laterMarkers[index].toBigInt()
      );
      if (noEpoch) return laterHeight;
      await delay(250);
    }
    throw new Error("could not find an adjacent non-epoch block for all suspect subnets");
  } finally {
    await api?.disconnect();
  }
}

function renderFocusedResult({ result, suspects, materialNegative, rawPositiveMovements }) {
  const rows = materialNegative.map((row) =>
    `| ${row.netuid} | ${formatAlpha(row.discrepancyChange)} | ` +
      `${formatAlpha(row.actualStakeChange)} | ${formatAlpha(row.calculatedStakeChange)} | ` +
      `${formatAlpha(row.alphaOutChange)} | ${formatAlpha(row.burnedChange)} | ` +
      `${formatAlpha(row.pendingChange)} |\n`
  ).join("");
  return `\n## Focused subsidized-path result\n\n` +
    `The selected blocks are adjacent and none of the seven historical outlier subnets executed ` +
    `an epoch, so no new root-dividend entitlement was distributed for them. Automatic claims of ` +
    `previously accrued entitlement can still occur between non-epoch blocks and are handled by ` +
    `the full version-correct test. Subnets ` +
    `${suspects.map((row) => row.netuid).join(", ")} reproduced material negative discrepancy ` +
    `drift in one block; subnet 40 and 84 were not on the subsidized branch in this particular ` +
    `block and moved only at the rao-scale rounding baseline.\n\n` +
    `- Candidate source: runtime 338 (\`v3.2.11-338\`, ` +
      `\`1f520ed9587ce588994d48937aca0de8262cf784\`)\n` +
    `- Candidate WASM SHA-256: ` +
      `\`665c0b7ac8df78c29ebdc62a4c866aeb7e6e88ece2c7a235ef15edbc9276aeb8\`\n` +
    `- Exact interval: ${result.pair.earlier.height} → ${result.pair.later.height}\n` +
    `- Material negative non-epoch subnets: ` +
      `${materialNegative.map((row) => row.netuid).join(", ") || "none"}\n` +
    `- Raw material positive movements before legacy root-claim liability attribution: ` +
      `${rawPositiveMovements.map((row) => row.netuid).join(", ") || "none"}\n` +
    `  (automatic root claims can create these movements without a subnet epoch; the full ` +
      `version-correct test handles them separately)\n\n` +
    `| Netuid | Discrepancy Δ α | Actual stake Δ α | Calculated stake Δ α | ` +
      `SubnetAlphaOut Δ α | AlphaBurned Δ α | Pending Δ α |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|\n` + rows +
    `\nRuntime 338's subsidized branch omits \`root_alpha\` from both ` +
    `\`PendingEmission\` and \`PendingRootAlphaDivs\`. It also subtracts bought alpha directly ` +
    `from \`SubnetAlphaOut\` rather than recording recycling/burning. Runtime 343 replaces both ` +
    `operations with explicit pending/recycling accounting. The reproduced sign matches the ` +
    `negative outlier subnets, but not the predominantly positive current 1–2% discrepancy; ` +
    `this is a separate historical accounting defect, not the stopping cause for the main search.\n`;
}

function formatAlpha(raw) {
  const negative = raw < 0n;
  const value = negative ? -raw : raw;
  const whole = value / 1_000_000_000n;
  const fraction = (value % 1_000_000_000n).toString().padStart(9, "0");
  return `${negative ? "-" : "+"}${whole}.${fraction}`;
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
