import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WsProvider } from "@polkadot/api";

import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const TARGET_VERSIONS = (process.env.RUNTIME_VERSIONS ?? "445,444,443,442,441,440,439,438,437")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter(Number.isInteger);
const SUPPLIED_FIX_BLOCK = Number(process.env.SUPPLIED_FIX_BLOCK ?? 4_962_968);
const RPC_DELAY_MS = Number(process.env.RPC_DELAY_MS ?? 350);
const SOURCE_TAGS = new Map([
  [445, ["v445", "d3f40e44bda9019c606aeb0c907bb52ba7fe386c"]],
  [443, ["v443", "c02a376ecee28718970962562fece409b695df72"]],
  [442, ["v442", "ec112cb0e68469fa1c5e5ae67dece043033f6673"]],
  [441, ["v441", "8b9d55c723e00d0d713eed799de627e94603dfd4"]],
  [440, ["v440", "e4ffa2e1325c6c7db618dbceaf396310a170990c"]],
  [439, ["v439", "cda8fd76ad2a7014cac632933237abf1ddaa9b30"]],
  [438, ["v438", "c1463f2cc62e7de70aa3379ee53cfc5f060bde42"]],
  [437, ["v437", "2d52647c415aa987ab93dbd7de4ddc5eaf7aa083"]],
]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "mainnet-runtime-version-map.md");
const logger = createTempLogger("mainnet-runtime-version-map.log");
logger.captureConsole();

let provider;
const runtimeCache = new Map();
const hashCache = new Map();

async function main() {
  await logger.start();
  console.log("Connecting to", redactEndpoint(WS_ENDPOINT));
  provider = new WsProvider(WS_ENDPOINT, undefined, {}, 120_000);
  await provider.isReady;
  console.log("Connected.");

  try {
    const finalizedHash = await rpc("chain_getFinalizedHead", []);
    const finalizedHeader = await rpc("chain_getHeader", [finalizedHash]);
    const finalizedHeight = Number.parseInt(finalizedHeader.number, 16);
    const chain = await rpc("system_chain", []);
    const current = await runtimeAt(finalizedHeight);

    console.log("chain:", chain);
    console.log("finalized block:", finalizedHeight, finalizedHash);
    console.log("current runtime:", current.specName, current.specVersion);

    const boundaries = [];
    for (const target of TARGET_VERSIONS) {
      assert.ok(target <= current.specVersion, `target ${target} is newer than current runtime`);
      const firstAtLeast = await firstBlockAtOrAboveVersion(target, finalizedHeight);
      const at = await runtimeAt(firstAtLeast);
      const before = firstAtLeast > 0 ? await runtimeAt(firstAtLeast - 1) : null;
      const blockHash = await blockHashAt(firstAtLeast);
      const codeHash = await rpc("state_getStorageHash", ["0x3a636f6465", blockHash]);
      const deployed = at.specVersion === target;

      boundaries.push({
        target,
        source: SOURCE_TAGS.get(target) ?? null,
        deployed,
        firstBlock: firstAtLeast,
        blockHash,
        codeHash,
        beforeVersion: before?.specVersion ?? null,
        atVersion: at.specVersion,
      });
      console.log(
        `runtime ${target}:`,
        deployed ? `first post-state block ${firstAtLeast}` : "not observed",
        `(${before?.specVersion ?? "genesis"} -> ${at.specVersion})`,
        codeHash
      );
    }

    const suppliedBoundary = [];
    for (const height of [SUPPLIED_FIX_BLOCK - 1, SUPPLIED_FIX_BLOCK, SUPPLIED_FIX_BLOCK + 1]) {
      const runtime = await runtimeAt(height);
      suppliedBoundary.push({ height, ...runtime, hash: await blockHashAt(height) });
      console.log(
        "supplied PR #1321 boundary:",
        height,
        runtime.specName,
        runtime.specVersion,
        suppliedBoundary.at(-1).hash
      );
    }

    fs.writeFileSync(REPORT_PATH, renderReport({
      generatedAt: new Date().toISOString(),
      chain,
      finalizedHeight,
      finalizedHash,
      current,
      boundaries,
      suppliedBoundary,
    }));
    console.log("report:", REPORT_PATH);
    console.log("runtime version mapping: complete");
  } finally {
    await provider?.disconnect();
  }
}

async function firstBlockAtOrAboveVersion(target, high) {
  let low = 0;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const runtime = await runtimeAt(middle);
    if (runtime.specVersion >= target) high = middle;
    else low = middle + 1;
  }
  return low;
}

async function runtimeAt(height) {
  if (runtimeCache.has(height)) return runtimeCache.get(height);
  const hash = await blockHashAt(height);
  const version = await rpc("state_getRuntimeVersion", [hash]);
  const runtime = {
    specName: version.specName,
    specVersion: Number(version.specVersion),
  };
  runtimeCache.set(height, runtime);
  return runtime;
}

async function blockHashAt(height) {
  if (hashCache.has(height)) return hashCache.get(height);
  const hash = await rpc("chain_getBlockHash", [height]);
  hashCache.set(height, hash);
  return hash;
}

async function rpc(method, params) {
  let lastError;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const result = await provider.send(method, params);
      await delay(RPC_DELAY_MS);
      return result;
    } catch (error) {
      lastError = error;
      const waitMs = Math.min(30_000, RPC_DELAY_MS * (2 ** attempt));
      console.log(`RPC ${method} attempt ${attempt} failed; retrying in ${waitMs} ms:`, error.message);
      await delay(waitMs);
    }
  }
  throw lastError;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderReport({
  generatedAt,
  chain,
  finalizedHeight,
  finalizedHash,
  current,
  boundaries,
  suppliedBoundary,
}) {
  const rows = boundaries.map((row) =>
    `| ${row.target} | ${row.deployed ? "yes" : "no"} | ${row.source?.[0] ?? "n/a"} | ` +
    `${row.source ? `\`${row.source[1]}\`` : "n/a"} | ${row.firstBlock.toLocaleString("en-US")} | ` +
    `${row.beforeVersion ?? "genesis"} | ${row.atVersion} | \`${row.blockHash}\` | \`${row.codeHash}\` |`
  );
  const suppliedRows = suppliedBoundary.map((row) =>
    `| ${row.height.toLocaleString("en-US")} | ${row.specName} | ${row.specVersion} | \`${row.hash}\` |`
  );

  return `# Mainnet runtime version map

Generated: ${generatedAt}

- Chain: ${chain}
- Finalized head: ${finalizedHeight.toLocaleString("en-US")} (\`${finalizedHash}\`)
- Current runtime: ${current.specName}/${current.specVersion}

## Deployed boundaries

The boundary is the first block whose post-state reports a runtime version greater than or equal to the requested version. The **deployed** column is **yes** only when that exact version is observed.

| Requested version | Deployed | Source tag | Source commit | First post-state block | Previous version | Version at block | Block hash | Runtime code hash |
|---:|---|---|---|---:|---:|---:|---|---|
${rows.join("\n")}

## Supplied PR #1321 fix block

| Block | Runtime name | Runtime version | Block hash |
|---:|---|---:|---|
${suppliedRows.join("\n")}
`;
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
