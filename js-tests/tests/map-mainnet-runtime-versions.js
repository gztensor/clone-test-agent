import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WsProvider } from "@polkadot/api";

import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const TARGET_VERSIONS = (process.env.RUNTIME_VERSIONS ?? "445,444,443,442,441,440,439,438,437,432,431,430,424,423,422,421,420,419,418,417,416,415,414,413,412,411,402,401,393,392,391,385,377,374,373,372,367,366,365,362,361,352,351,350,349,348,347,345,343,338,334,326,323,320,315,306,302,301,298,297")
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
  [432, ["v432", "8586e65ec279644a6837cf25b12333064c77474e"]],
  [431, ["v431", "32f3b652cfa74df5f8f595a5be051bf5bb86925f"]],
  [430, ["v430", "9c8e26e7fccc76327ab5204f7978aa2e4d86efd6"]],
  [424, ["main@spec-424", "bb51677451dc74f2152d44a9a0c30b18b5e634fc"]],
  [423, ["main@spec-423", "06032d518fbaead1ddc2039e9e6aa55715026364"]],
  [422, ["main@spec-422", "e367ae64709a22cfeb7ec114814a14f0db137a83"]],
  [421, ["main@spec-421", "6016381e4fb230d17643cca948afe296eb06faac"]],
  [419, ["main@spec-419", "fa83646297f45a1a8108f70ba2ebf32d4f35b5c2"]],
  [417, ["main@spec-417", "49164bd68afd71e48e3c80d268ed80f22b98a2b1"]],
  [416, ["main@spec-416", "34a284751cc3151ae8017451919101f59e39744d"]],
  [415, ["main@spec-415", "1104f2aab5acdf69fe967a787c7ae1cc5fdf170c"]],
  [413, ["main@spec-413", "ec2212c53fc7c0252af80c28e50a959cce2f9890"]],
  [411, ["main@spec-411", "486037ba45b87a453b1d660177cc1b105d0298c6"]],
  [402, ["v3.3.15-402", "6844ee37f0b8cb02baf9ff8d3ca4319cfb33f361"]],
  [401, ["v3.3.14-401", "40a451f366900d00ec0b3781e4c5a4a92ba9a6b6"]],
  [393, ["v3.3.13-393", "4a2e4b1282dbcf4e020b3f97f9a0c7442b756792"]],
  [392, ["main@spec-392", "036cfe087be3c50c988185af465a20cea2b132c9"]],
  [391, ["v3.3.12-391", "7a727dd4d219a953391e91ed2f7aa942050938f1"]],
  [385, ["v3.3.11-385", "7eb6f9bb7c9ea19d60d11890d04ca352f9257fa8"]],
  [377, ["v3.3.9-377", "b2e2cdebaf39c1badfc1af1cd0b5de5d0ddebb4c"]],
  [374, ["v3.3.7-374", "a8d2ad019e18ecbc010a4b5e04524c05c15bab8a"]],
  [373, ["v3.3.7-373", "206e7c890d2ac4268257cfd205bcf80100225241"]],
  [372, ["v3.3.6-372", "fffba8c072984cd417689666dc8b0c9e80dc9f81"]],
  [367, ["v3.3.4-367", "8f13194c6e56f218910b4a9c708199cc38f64c40"]],
  [366, ["v3.3.3-366", "d65dbaedf833e1b55ba6f1487c333ffe49f062d2"]],
  [365, ["v3.3.2-365", "6e3d24cea446b3241524bb319b72bf506e8e8eb4"]],
  [362, ["v3.3.1-362", "8834a7c737583c8ab8d6c3abdbd4865e039e24a9"]],
  [361, ["v3.3.0-361", "52378dc3e911cdfc7b8e3cf1160a6e0e4dde4fd6"]],
  [352, ["v3.2.19-352", "024a3049157b83329e041f3e60ae3da611a022bb"]],
  [351, ["v3.2.18-351", "3face26e735211188ec776b4559f185d3b2c952f"]],
  [350, ["v3.2.17-350", "4d3a7ab3422f587c3f3faa855dd03d73ccbcbfdf"]],
  [349, ["v3.2.16-349", "20cbabc70fb2528d166ab2a296a1d656a6e5a106"]],
  [348, ["v3.2.15-348", "459fa72d1468b6dc7485de7392996de50169fbf8"]],
  [347, ["v3.2.15-347", "6304dbedc34c6b271546a9338d9b870ceb1ac625"]],
  [345, ["3.2.14-345", "8f33f8cbf6b958b9ec215424a50d96cd2fc5e5ae"]],
  [343, ["v3.2.13-343", "b179867c306fb6a28345896f422910e603799d70"]],
  [338, ["v3.2.11-338", "1f520ed9587ce588994d48937aca0de8262cf784"]],
  [334, ["v3.2.10-334", "6218ecc5cdab527a649c8fa5b0194db3f884571c"]],
  [326, ["v3.2.9-326", "ae2b37364ce53cf9af44d4088f4ef53ad859f8b8"]],
  [323, ["v3.2.9-323", "79010a36cdb8391bb5de5c86acd0387d71f462c9"]],
  [320, ["v3.2.8-320", "835a2c90294705b5963043f5ef31460304df2475"]],
  [315, ["v3.2.7", "81ee047fd124f8837555fd79e8a3957688c5b0c6"]],
  [306, ["v3.2.6", "737e4acb173cddbe6fde9c6085853ef8b8f02a80"]],
  [302, ["v3.2.5", "67c7ac6923b498c15f5541fd0e9ddcbeed38c3b7"]],
  [301, ["v3.2.4", "312c0be95983a98bed4120526351a94219d00449"]],
  [298, ["v3.2.3", "6309d35929e484ebff70c7da68547fb9c60f0d11"]],
  [297, ["v3.2.2", "7b541095b057a68e0090d8348bdc96a70dc56be8"]],
]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = process.env.RUNTIME_MAP_REPORT_PATH
  ? path.resolve(process.env.RUNTIME_MAP_REPORT_PATH)
  : path.resolve(__dirname, "..", "mainnet-runtime-version-map.md");
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
