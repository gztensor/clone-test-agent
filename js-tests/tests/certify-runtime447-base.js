import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";

const MIGRATION_NAMES = [
  "migrate_fix_rao_alpha_out_accounting",
  "migrate_rebase_recycled_alpha_asset_counters",
  "migrate_backfill_historical_alpha_burned",
];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "runtime447-base-certification.md");
const MAX_ACCEPTED_ABSOLUTE_DISCREPANCY = 100_000n * 1_000_000_000n;

async function main() {
  process.env.WS_ENDPOINT = "ws://127.0.0.1:9944";
  process.env.EXPECTED_RUNTIME_VERSION = "447";
  process.env.ALPHA_ACCOUNTING_DISTANCE = "1";
  process.env.STORAGE_PAGE_DELAY_MS = "0";
  process.env.ALPHA_ACCOUNTING_REPORT_TITLE = "Runtime-447 base accounting certification";
  process.env.ALPHA_ACCOUNTING_REPORT_FILENAME = "runtime447-base-certification.md";
  process.env.ALPHA_ACCOUNTING_LOG_FILENAME = "runtime447-base-certification.log";

  const { main: runComparison } = await import("./mainnet-alpha-accounting-two-tempos.js");
  const result = await runComparison();
  assert.equal(result.comparisons.length, 128, "expected 128 active alpha subnets");

  let api;
  try {
    api = await connectApi(process.env.WS_ENDPOINT, {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 120_000,
    });
    const finalizedHash = await api.rpc.chain.getFinalizedHead();
    const [header, runtime, genesisHash, markerEntries] = await Promise.all([
      api.rpc.chain.getHeader(finalizedHash),
      api.rpc.state.getRuntimeVersion(finalizedHash),
      api.rpc.chain.getBlockHash(0),
      api.query.subtensorModule.hasMigrationRun.entriesAt(finalizedHash),
    ]);
    const markerMap = new Map(markerEntries.map(([key, value]) => [
      key.args[0].toUtf8(),
      value.isTrue,
    ]));
    const markers = Object.fromEntries(MIGRATION_NAMES.map((name) => [
      name,
      markerMap.get(name) ?? false,
    ]));

    assert.equal(runtime.specVersion.toNumber(), 447);
    assert.ok(Object.values(markers).every(Boolean), `missing migration marker: ${JSON.stringify(markers)}`);

    const latestRows = result.comparisons.map((row) => row.later);
    const largestAbsoluteRow = latestRows.reduce((largest, row) => (
      absolute(BigInt(row.discrepancy)) > absolute(BigInt(largest.discrepancy)) ? row : largest
    ));
    const accountingStateAccepted =
      absolute(BigInt(largestAbsoluteRow.discrepancy)) <= MAX_ACCEPTED_ABSOLUTE_DISCREPANCY;

    fs.appendFileSync(REPORT_PATH, renderCertification({
      result,
      finalizedHeight: header.number.toNumber(),
      finalizedHash: finalizedHash.toString(),
      stateRoot: header.stateRoot.toString(),
      genesisHash: genesisHash.toString(),
      runtimeName: runtime.specName.toString(),
      runtimeVersion: runtime.specVersion.toNumber(),
      markers,
      largestAbsoluteRow,
      accountingStateAccepted,
    }));
    console.log("base certification markers:", JSON.stringify(markers));
    console.log("base certification finalized block:", header.number.toString(), finalizedHash.toString());
    console.log(
      "base certification largest absolute discrepancy:",
      largestAbsoluteRow.netuid,
      formatSignedAlpha(largestAbsoluteRow.discrepancy),
    );
    assert.ok(
      accountingStateAccepted,
      `rejected stale/uncorrected base: subnet ${largestAbsoluteRow.netuid} has ` +
        `${formatSignedAlpha(largestAbsoluteRow.discrepancy)} alpha discrepancy`,
    );
    console.log("base certification: complete");
  } finally {
    await api?.disconnect();
  }
}

function renderCertification(snapshot) {
  const latestRows = snapshot.result.comparisons.map((row) => row.later);
  return `\n## Base-state certification\n\n` +
    `- Finalized block: ${snapshot.finalizedHeight.toLocaleString("en-US")} (\`${snapshot.finalizedHash}\`)\n` +
    `- State root: \`${snapshot.stateRoot}\`\n` +
    `- Genesis hash: \`${snapshot.genesisHash}\`\n` +
    `- Runtime: \`${snapshot.runtimeName}/${snapshot.runtimeVersion}\`\n` +
    `- Active alpha subnets: ${latestRows.length}\n\n` +
    `- Accounting-state verdict: **${snapshot.accountingStateAccepted ? "ACCEPTED" : "REJECTED"}**\n` +
    `- Largest absolute discrepancy: subnet ${snapshot.largestAbsoluteRow.netuid}, ` +
    `${formatSignedAlpha(snapshot.largestAbsoluteRow.discrepancy)} α\n` +
    `- Rejection bound: ${formatAlpha(MAX_ACCEPTED_ABSOLUTE_DISCREPANCY)} α absolute discrepancy\n\n` +
    `| Required migration marker | Set |\n|---|---|\n` +
    Object.entries(snapshot.markers)
      .map(([name, value]) => `| \`${name}\` | ${value ? "yes" : "no"} |\n`)
      .join("") +
    `\n## Certified accounting components\n\n` +
    `| Netuid | Actual staked α | SubnetAlphaOut α | AlphaBurned α | Pending α | Protocol α | Calculated staked α | Signed discrepancy α |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|---:|\n` +
    latestRows.map((row) =>
      `| ${row.netuid} | ${formatAlpha(row.actualStake)} | ${formatAlpha(row.alphaOut)} | ` +
      `${formatAlpha(row.burned)} | ${formatAlpha(row.pending)} | ${formatAlpha(row.protocol)} | ` +
      `${formatAlpha(row.calculatedStake)} | ${formatSignedAlpha(row.discrepancy)} |\n`
    ).join("");
}

function absolute(value) {
  return value < 0n ? -value : value;
}

function formatAlpha(raw) {
  const value = BigInt(raw);
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
