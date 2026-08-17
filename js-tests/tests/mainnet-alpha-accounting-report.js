import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const GIST_URL = "https://gist.github.com/UnArbosFour/0ea73fe2a78b209f69e3080cef7356e2";
const PRIOR_OUTLIERS = [15, 36, 57, 67, 78, 82, 96, 122];
const MIGRATION_NAMES = [
  "migrate_fix_rao_alpha_out_accounting",
  "migrate_rebase_recycled_alpha_asset_counters",
  "migrate_backfill_historical_alpha_burned",
];
const PAGE_SIZE = Number(process.env.STORAGE_PAGE_SIZE ?? 500);
const PAGE_DELAY_MS = Number(process.env.STORAGE_PAGE_DELAY_MS ?? 1_500);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "mainnet-alpha-accounting-discrepancy-report.md");
const logger = createTempLogger("mainnet-alpha-accounting-report.log");
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
    const [header, runtimeVersion, chain] = await Promise.all([
      api.rpc.chain.getHeader(finalizedHash),
      api.rpc.state.getRuntimeVersion(finalizedHash),
      api.rpc.system.chain(),
    ]);
    const block = header.number.toNumber();

    console.log("chain:", chain.toString());
    console.log(
      "runtime:",
      `${runtimeVersion.specName.toString()}/${runtimeVersion.specVersion.toString()}`
    );
    console.log("finalized block:", block);
    console.log("finalized hash:", finalizedHash.toString());

    const migrationStatus = await readMigrationStatus(finalizedHash);
    console.log("migration markers:", JSON.stringify(migrationStatus));

    const netuids = await readActiveNetuids(finalizedHash);
    console.log("active alpha subnets:", netuids.length);

    const actualStake = await sumTotalHotkeyAlpha(finalizedHash, netuids);
    const pendingBasket = await sumPendingBasketAlpha(finalizedHash, netuids);
    const storageMaps = await readAccountingMaps(finalizedHash);
    const rows = netuids.map((netuid) => accountingRow({
      netuid,
      actualStake: actualStake.get(netuid) ?? 0n,
      pendingBasket: pendingBasket.get(netuid) ?? 0n,
      storageMaps,
    }));

    const outliers = rows.filter((row) => row.discrepancyPct === null || row.discrepancyPct > 1);
    const priorRows = PRIOR_OUTLIERS.map((netuid) => rows.find((row) => row.netuid === netuid))
      .filter(Boolean);
    const report = renderReport({
      generatedAt: new Date().toISOString(),
      chain: chain.toString(),
      runtimeName: runtimeVersion.specName.toString(),
      runtimeVersion: runtimeVersion.specVersion.toNumber(),
      block,
      blockHash: finalizedHash.toString(),
      migrationStatus,
      rows,
      outliers,
      priorRows,
    });

    fs.writeFileSync(REPORT_PATH, report);
    console.log("report:", REPORT_PATH);
    console.log("subnets checked:", rows.length);
    console.log("current discrepancies >1%:", outliers.length);
    console.log(
      "prior outliers still >1%:",
      priorRows.filter((row) => row.discrepancyPct === null || row.discrepancyPct > 1)
        .map((row) => row.netuid)
        .join(",") || "none"
    );
    console.log("mainnet alpha-accounting report: complete");

    assert.ok(rows.length > 0, "no active alpha subnets were read");
    assert.ok(
      Object.values(migrationStatus).every(Boolean),
      `not all accounting migration markers are set: ${JSON.stringify(migrationStatus)}`
    );
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

async function readMigrationStatus(blockHash) {
  return Object.fromEntries(await Promise.all(MIGRATION_NAMES.map(async (name) => {
    const key = `0x${Buffer.from(name).toString("hex")}`;
    return [name, (await api.query.subtensorModule.hasMigrationRun.at(blockHash, key)).isTrue];
  })));
}

async function readActiveNetuids(blockHash) {
  const entries = await api.query.subtensorModule.networksAdded.entriesAt(blockHash);
  return entries
    .filter(([, value]) => value.isTrue)
    .map(([key]) => key.args[0].toNumber())
    .filter((netuid) => netuid > 0)
    .sort((a, b) => a - b);
}

async function sumTotalHotkeyAlpha(blockHash, netuids) {
  console.log("reading TotalHotkeyAlpha entries with paced pagination ...");
  const allowed = new Set(netuids);
  const totals = new Map(netuids.map((netuid) => [netuid, 0n]));
  let entryCount = 0;

  await forEachPagedEntry(
    "subtensorModule",
    "totalHotkeyAlpha",
    blockHash,
    "TotalHotkeyAlpha",
    ([key, value]) => {
      const netuid = key.args[1].toNumber();
      if (allowed.has(netuid)) {
        totals.set(netuid, (totals.get(netuid) ?? 0n) + codecBigInt(value));
      }
      entryCount += 1;
    }
  );

  console.log("TotalHotkeyAlpha entries:", entryCount);
  return totals;
}

async function sumPendingBasketAlpha(blockHash, netuids) {
  console.log("reading PendingBasketDeposits entries with paced pagination ...");
  const allowed = new Set(netuids);
  const totals = new Map(netuids.map((netuid) => [netuid, 0n]));
  let entryCount = 0;

  await forEachPagedEntry(
    "subtensorModule",
    "pendingBasketDeposits",
    blockHash,
    "PendingBasketDeposits",
    ([key, value]) => {
      const netuid = key.args[1].toNumber();
      if (allowed.has(netuid)) {
        totals.set(netuid, (totals.get(netuid) ?? 0n) + codecBigInt(value));
      }
      entryCount += 1;
    }
  );

  console.log("PendingBasketDeposits entries:", entryCount);
  return totals;
}

async function readAccountingMaps(blockHash) {
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
    console.log(`reading ${name} entries ...`);
    result[name] = new Map(
      (await rpcWithRetry(`${name}.entriesAt`, () => query.entriesAt(blockHash))).map(([key, value]) => [
        key.args[0].toNumber(),
        codecBigInt(value),
      ])
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
  const difference = actualStake - calculatedStake;
  const discrepancyPct = percentDifference(actualStake, calculatedStake);

  return {
    netuid,
    alphaOut,
    burned,
    pending,
    protocol,
    actualStake,
    calculatedStake,
    difference,
    discrepancyPct,
  };
}

function renderReport(snapshot) {
  const markersComplete = Object.values(snapshot.migrationStatus).every(Boolean);
  const oldStillOutlying = snapshot.priorRows.filter(
    (row) => row.discrepancyPct === null || row.discrepancyPct > 1
  );
  const maxRow = [...snapshot.rows].sort((a, b) => percentForSort(b) - percentForSort(a))[0];
  const verdict = snapshot.outliers.length === 0
    ? "**Verified:** no active subnet has a discrepancy greater than 1%."
    : `**Residual discrepancies remain:** ${snapshot.outliers.length} active subnet(s) exceed 1%.`;

  return `# Mainnet staked-alpha accounting discrepancy report\n\n` +
    `Generated: ${snapshot.generatedAt}\n\n` +
    `Reference: [original discrepancy report](${GIST_URL})\n\n` +
    `## Snapshot\n\n` +
    `| Chain | Finalized block | Block hash | Runtime | Active alpha subnets | Migration markers complete | Discrepancies >1% |\n` +
    `|---|---:|---|---|---:|---|---:|\n` +
    `| ${snapshot.chain} | ${snapshot.block.toLocaleString("en-US")} | \`${snapshot.blockHash}\` | ` +
    `\`${snapshot.runtimeName}/${snapshot.runtimeVersion}\` | ${snapshot.rows.length} | ` +
    `${markersComplete ? "yes" : "**no**"} | ${snapshot.outliers.length} |\n\n` +
    `${verdict}\n\n` +
    `The largest current absolute percentage discrepancy is subnet ${maxRow.netuid} at ` +
    `${formatPercent(maxRow.discrepancyPct)}. The gist's eight post-migration outliers are ` +
    `${oldStillOutlying.length === 0 ? "all now below 1%" : `still above 1% on: ${oldStillOutlying.map((row) => row.netuid).join(", ")}`}.\n\n` +
    `### Migration markers\n\n` +
    `| Migration | Complete |\n|---|---|\n` +
    Object.entries(snapshot.migrationStatus)
      .map(([name, complete]) => `| \`${name}\` | ${complete ? "yes" : "**no**"} |\n`)
      .join("") +
    `\n## Previous eight outliers\n\n` +
    accountingTable(snapshot.priorRows) +
    `\n## Current accounting for all active subnets\n\n` +
    accountingTable(snapshot.rows) +
    `\n## Method\n\n` +
    `- Total alpha staked: sum of every \`TotalHotkeyAlpha(hotkey, netuid)\` value.\n` +
    `- Pending alpha: \`PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + ` +
    `PendingOwnerCut + PendingBasketDeposits\`.\n` +
    `- Calculated alpha staked: \`SubnetAlphaOut - AlphaBurned - pending alpha - SubnetProtocolAlpha\`.\n` +
    `- Delta: \`sum(TotalHotkeyAlpha) - calculated alpha staked\`.\n` +
    `- Discrepancy: \`abs(delta) / calculated alpha staked × 100\`.\n` +
    `- Every storage value was read at the same finalized block hash shown above.\n`;
}

function accountingTable(rows) {
  return `| Netuid | Total alpha staked α | SubnetAlphaOut α | AlphaBurned α | Pending α | Protocol α | ` +
    `Calculated staked α | Δ α | Δ % | Result |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|\n` +
    rows.map((row) =>
      `| ${row.netuid} | ${formatAlpha(row.actualStake)} | ${formatAlpha(row.alphaOut)} | ` +
      `${formatAlpha(row.burned)} | ${formatAlpha(row.pending)} | ${formatAlpha(row.protocol)} | ` +
      `${formatAlpha(row.calculatedStake)} | ${formatSignedAlpha(row.difference)} | ` +
      `${formatPercent(row.discrepancyPct)} | ` +
      `${row.discrepancyPct === null || row.discrepancyPct > 1 ? "**DISCREPANCY >1%**" : "OK"} |\n`
    ).join("");
}

function codecBigInt(value) {
  if (value === null || value === undefined) return 0n;
  if (typeof value.toBigInt === "function") return value.toBigInt();
  return BigInt(value.toString());
}

function percentDifference(actual, calculated) {
  if (calculated === 0n) return actual === 0n ? 0 : null;
  const scaled = (absBigInt(actual - calculated) * 1_000_000_000n) / absBigInt(calculated);
  return Number(scaled) / 10_000_000;
}

function percentForSort(row) {
  return row.discrepancyPct === null ? Number.POSITIVE_INFINITY : row.discrepancyPct;
}

function formatPercent(value) {
  return value === null ? "∞" : `${value.toFixed(6)}%`;
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
