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
const FIRST_361_BLOCK = Number(process.env.FIRST_361_BLOCK ?? 7_063_679);
const LAST_361_BLOCK = Number(process.env.LAST_361_BLOCK ?? 7_091_125);
const RPC_DELAY_MS = Number(process.env.RPC_DELAY_MS ?? 350);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "mainnet-runtime-361-code-boundaries.md");
const logger = createTempLogger("mainnet-runtime-361-code-boundaries.log");
logger.captureConsole();

let provider;
const hashCache = new Map();

async function main() {
  await logger.start();
  provider = new WsProvider(WS_ENDPOINT, undefined, {}, 120_000);
  await provider.isReady;

  try {
    assert.ok(Number.isInteger(FIRST_361_BLOCK));
    assert.ok(Number.isInteger(LAST_361_BLOCK));
    assert.ok(LAST_361_BLOCK > FIRST_361_BLOCK);
    const firstHash = await blockHashAt(FIRST_361_BLOCK);
    const lastHash = await blockHashAt(LAST_361_BLOCK);
    const changes = await rpc("state_queryStorage", [["0x3a636f6465"], firstHash, lastHash]);
    assert.ok(changes.length >= 1, "expected the initial :code value");

    let previousCodeHash;
    const transitions = [];
    for (const [index, changeSet] of changes.entries()) {
      const codeChange = changeSet.changes.find(([key]) => key === "0x3a636f6465");
      assert.ok(codeChange?.[1], `missing :code value in change set ${index}`);
      const codeHash = blake2AsHex(hexToU8a(codeChange[1]), 256);
      if (index === 0) {
        previousCodeHash = codeHash;
        continue;
      }
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

    assert.ok(
      transitions.every((entry) => entry.beforeVersion === 361 && entry.afterVersion === 361),
      "every internal runtime-361 code transition must preserve spec version 361"
    );

    fs.writeFileSync(REPORT_PATH, renderReport(previousCodeHash, transitions));
    console.log("transitions", transitions.length);
    console.log("report", REPORT_PATH);
    console.log("runtime 361 same-spec code mapping: complete");
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
  return `# Mainnet runtime-361 same-spec code boundaries

Generated: ${new Date().toISOString()}

- Search interval: ${FIRST_361_BLOCK.toLocaleString("en-US")}–${LAST_361_BLOCK.toLocaleString("en-US")}
- state_queryStorage was used over :code, so every code change in the interval is included without sampling gaps.
- Code hash at the end of the interval: \`${finalCodeHash}\`
- Same-spec code transitions found: ${transitions.length}

| First changed post-state block | Version before | Version after | Previous block hash | Changed block hash | Code hash before | Code hash after |
|---:|---:|---:|---|---|---|---|
${rows.length > 0 ? rows.join("\n") : "| none | 361 | 361 | n/a | n/a | n/a | n/a |"}
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
