import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WsProvider } from "@polkadot/api";
import { hexToU8a } from "@polkadot/util";
import { blake2AsHex } from "@polkadot/util-crypto";

import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const RUNTIME_VERSION = Number(process.env.RUNTIME_VERSION ?? 349);
const FIRST_RUNTIME_BLOCK = Number(process.env.FIRST_RUNTIME_BLOCK ?? 7_006_896);
const LAST_RUNTIME_BLOCK = Number(process.env.LAST_RUNTIME_BLOCK ?? 7_034_931);
const RPC_DELAY_MS = Number(process.env.RPC_DELAY_MS ?? 350);
const CODE_QUERY_CHUNK_BLOCKS = Number(process.env.CODE_QUERY_CHUNK_BLOCKS ?? 25_000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = process.env.RUNTIME_CODE_REPORT_PATH
  ? path.resolve(process.env.RUNTIME_CODE_REPORT_PATH)
  : path.resolve(__dirname, "..", `mainnet-runtime-${RUNTIME_VERSION}-code-boundaries.md`);
const logger = createTempLogger(`mainnet-runtime-${RUNTIME_VERSION}-code-boundaries.log`);
logger.captureConsole();

let provider;
const hashCache = new Map();

async function main() {
  await logger.start();
  provider = new WsProvider(WS_ENDPOINT, undefined, {}, 120_000);
  await provider.isReady;

  try {
    assert.ok(Number.isInteger(RUNTIME_VERSION));
    assert.ok(Number.isInteger(FIRST_RUNTIME_BLOCK));
    assert.ok(Number.isInteger(LAST_RUNTIME_BLOCK));
    assert.ok(Number.isInteger(CODE_QUERY_CHUNK_BLOCKS) && CODE_QUERY_CHUNK_BLOCKS > 0);
    assert.ok(LAST_RUNTIME_BLOCK > FIRST_RUNTIME_BLOCK);

    let previousCodeHash;
    const transitions = [];
    for (
      let chunkStart = FIRST_RUNTIME_BLOCK;
      chunkStart <= LAST_RUNTIME_BLOCK;
      chunkStart += CODE_QUERY_CHUNK_BLOCKS
    ) {
      const chunkEnd = Math.min(chunkStart + CODE_QUERY_CHUNK_BLOCKS - 1, LAST_RUNTIME_BLOCK);
      console.log(`querying :code blocks ${chunkStart}-${chunkEnd}`);
      const changes = await rpc("state_queryStorage", [["0x3a636f6465"],
        await blockHashAt(chunkStart), await blockHashAt(chunkEnd)]);
      assert.ok(changes.length >= 1, `expected initial :code value for chunk ${chunkStart}-${chunkEnd}`);

      for (const [index, changeSet] of changes.entries()) {
        const codeChange = changeSet.changes.find(([key]) => key === "0x3a636f6465");
        assert.ok(codeChange?.[1], `missing :code value in chunk ${chunkStart}, change set ${index}`);
        const codeHash = blake2AsHex(hexToU8a(codeChange[1]), 256);
        if (previousCodeHash === undefined) {
          previousCodeHash = codeHash;
          continue;
        }
        if (codeHash === previousCodeHash) continue;

        const header = await rpc("chain_getHeader", [changeSet.block]);
        const firstChanged = Number.parseInt(header.number, 16);
        const beforeVersion = await runtimeVersionAt(firstChanged - 1);
        const afterVersion = await runtimeVersionAt(firstChanged);
        transitions.push({
          firstChanged,
          beforeBlockHash: await blockHashAt(firstChanged - 1),
          afterBlockHash: changeSet.block,
          beforeCodeHash: previousCodeHash,
          afterCodeHash: codeHash,
          beforeVersion,
          afterVersion,
        });
        previousCodeHash = codeHash;
      }
    }

    assert.ok(
      transitions.every(
        (entry) => entry.beforeVersion === RUNTIME_VERSION && entry.afterVersion === RUNTIME_VERSION
      ),
      `every internal runtime-${RUNTIME_VERSION} code transition must preserve spec version ${RUNTIME_VERSION}`
    );

    fs.writeFileSync(REPORT_PATH, renderReport(previousCodeHash, transitions));
    console.log("transitions", transitions.length);
    console.log("report", REPORT_PATH);
    console.log(`runtime ${RUNTIME_VERSION} same-spec code mapping: complete`);
  } finally {
    await provider?.disconnect();
  }
}

async function runtimeVersionAt(height) {
  const version = await rpc("state_getRuntimeVersion", [await blockHashAt(height)]);
  return Number(version.specVersion);
}

async function blockHashAt(height) {
  if (hashCache.has(height)) return hashCache.get(height);
  const value = await rpc("chain_getBlockHash", [height]);
  hashCache.set(height, value);
  return value;
}

async function rpc(method, params) {
  let lastError;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const value = await provider.send(method, params);
      await delay(RPC_DELAY_MS);
      return value;
    } catch (error) {
      lastError = error;
      const waitMs = Math.min(30_000, RPC_DELAY_MS * (2 ** attempt));
      console.log(`RPC ${method} attempt ${attempt} failed; retrying in ${waitMs} ms:`, error.message);
      await delay(waitMs);
    }
  }
  throw lastError;
}

function renderReport(finalCodeHash, transitions) {
  const rows = transitions.map((entry) =>
    `| ${entry.firstChanged.toLocaleString("en-US")} | ${entry.beforeVersion} | ${entry.afterVersion} | ` +
    `\`${entry.beforeBlockHash}\` | \`${entry.afterBlockHash}\` | ` +
    `\`${entry.beforeCodeHash}\` | \`${entry.afterCodeHash}\` |`
  );
  return `# Mainnet runtime-${RUNTIME_VERSION} same-spec code boundaries

Generated: ${new Date().toISOString()}

- Search interval: ${FIRST_RUNTIME_BLOCK.toLocaleString("en-US")}–${LAST_RUNTIME_BLOCK.toLocaleString("en-US")}
- state_queryStorage was used over :code in contiguous chunks of at most ${CODE_QUERY_CHUNK_BLOCKS.toLocaleString("en-US")} blocks, so every code change in the interval is included without sampling gaps.
- Code hash at the end of the interval: \`${finalCodeHash}\`
- Same-spec code transitions found: ${transitions.length}

| First changed post-state block | Version before | Version after | Previous block hash | Changed block hash | Code hash before | Code hash after |
|---:|---:|---:|---|---|---|---|
${rows.length > 0 ? rows.join("\n") : `| none | ${RUNTIME_VERSION} | ${RUNTIME_VERSION} | n/a | n/a | n/a | n/a |`}
`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultEndpoint() {
  assert.ok(process.env.ONFINALITY_API_KEY, "ONFINALITY_API_KEY is required unless WS_ENDPOINT is set");
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

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
