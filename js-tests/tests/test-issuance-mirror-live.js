import assert from "node:assert/strict";
import fs from "node:fs";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const NETWORK = parseNetwork();
const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint(NETWORK);
const LOOKBACK_BLOCKS = Number(process.env.ISSUANCE_MIRROR_LOOKBACK_BLOCKS ?? "720");
const BLOCK_STRIDE = Number(process.env.ISSUANCE_MIRROR_BLOCK_STRIDE ?? "1");
const START_BLOCK = optionalNumber(process.env.ISSUANCE_MIRROR_START_BLOCK);
const END_BLOCK = optionalNumber(process.env.ISSUANCE_MIRROR_END_BLOCK);
const MAX_EPOCH_DETAIL_BLOCKS = Number(process.env.ISSUANCE_MIRROR_MAX_EPOCH_DETAIL_BLOCKS ?? "40");
const RPC_CONCURRENCY = Number(process.env.ISSUANCE_MIRROR_RPC_CONCURRENCY ?? "16");
const WINDOW_LABEL =
  START_BLOCK === undefined && END_BLOCK === undefined
    ? `lookback-${LOOKBACK_BLOCKS}`
    : `blocks-${START_BLOCK ?? "auto"}-${END_BLOCK ?? "finalized"}`;
const logger = createTempLogger(`issuance-mirror-${NETWORK}-${WINDOW_LABEL}-stride-${BLOCK_STRIDE}.log`);
logger.captureConsole();

let api;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, { log: (message) => console.log(redactEndpoint(message)) });

  try {
    assertMetadataAvailable();

    const chain = await api.rpc.system.chain();
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const finalizedHash = await api.rpc.chain.getFinalizedHead();
    const finalizedHeader = await api.rpc.chain.getHeader(finalizedHash);
    const finalizedBlock = finalizedHeader.number.toNumber();
    const endBlock = END_BLOCK ?? finalizedBlock;
    const startBlock = START_BLOCK ?? Math.max(0, endBlock - LOOKBACK_BLOCKS + 1);

    assert.ok(startBlock <= endBlock, `start block ${startBlock} must be <= end block ${endBlock}`);

    console.log("network:", NETWORK);
    console.log("endpoint:", redactEndpoint(WS_ENDPOINT));
    console.log("chain:", chain.toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("finalized block:", finalizedBlock);
    console.log("finalized hash:", finalizedHash.toString());
    console.log("start block:", startBlock);
    console.log("end block:", endBlock);
    console.log("lookback blocks:", endBlock - startBlock + 1);
    console.log("block stride:", BLOCK_STRIDE);

    const blocks = range(startBlock, endBlock, BLOCK_STRIDE);
    if (blocks.at(-1) !== endBlock) {
      blocks.push(endBlock);
    }
    console.log("fetching block hashes...");
    const blockHashes = await mapLimit(blocks, RPC_CONCURRENCY, async (block) => {
      const hash = await api.rpc.chain.getBlockHash(block);
      return [block, hash.toString()];
    });
    console.log("block hashes fetched:", blockHashes.length);

    const storageKeys = [api.query.balances.totalIssuance.key(), api.query.subtensorModule.totalIssuance.key()];
    console.log("fetching issuance storage...");
    const samples = await mapLimit(blockHashes, RPC_CONCURRENCY, async ([block, hash]) => {
      const [balancesIssuance, subtensorIssuance] = await api.rpc.state.queryStorageAt(storageKeys, hash);
      const balances = decodeIssuance(balancesIssuance);
      const subtensor = decodeIssuance(subtensorIssuance);
      return {
        block,
        hash,
        balances,
        subtensor,
        diff: balances - subtensor,
      };
    });
    console.log("issuance storage fetched:", samples.length);

    samples.sort((a, b) => a.block - b.block);

    const mismatchSamples = samples.filter((sample) => sample.diff !== 0n);
    const diffChanges = [];
    for (let i = 1; i < samples.length; i += 1) {
      const previous = samples[i - 1];
      const current = samples[i];
      if (current.diff !== previous.diff) {
        diffChanges.push({
          previous,
          current,
          delta: current.diff - previous.diff,
        });
      }
    }

    console.log("samples:", samples.length);
    console.log("mismatch samples:", mismatchSamples.length);
    console.log("diff changes:", diffChanges.length);
    console.log("first diff:", samples[0].diff.toString());
    console.log("last diff:", samples.at(-1).diff.toString());
    console.log("net drift over window:", (samples.at(-1).diff - samples[0].diff).toString());
    console.log("absolute drift over changed transitions:", sumAbs(diffChanges.map((change) => change.delta)).toString());
    console.log("classification:", classifyDrift(samples.length, mismatchSamples, diffChanges));

    if (mismatchSamples.length > 0) {
      const firstMismatch = mismatchSamples[0];
      const lastMismatch = mismatchSamples.at(-1);
      console.log(
        "first mismatch:",
        `block=${firstMismatch.block}`,
        `balances=${firstMismatch.balances}`,
        `subtensor=${firstMismatch.subtensor}`,
        `diff=${firstMismatch.diff}`
      );
      console.log(
        "last mismatch:",
        `block=${lastMismatch.block}`,
        `balances=${lastMismatch.balances}`,
        `subtensor=${lastMismatch.subtensor}`,
        `diff=${lastMismatch.diff}`
      );
    }

    for (const change of diffChanges) {
      console.log(
        "diff change:",
        `block=${change.current.block}`,
        `from=${change.previous.diff}`,
        `to=${change.current.diff}`,
        `delta=${change.delta}`
      );
    }

    await logEpochCorrelation(diffChanges);

    console.log("issuance mirror live check: completed");
  } finally {
    await api?.disconnect();
  }
}

function assertMetadataAvailable() {
  const missing = [
    ["Balances.TotalIssuance", api.query.balances?.totalIssuance],
    ["SubtensorModule.TotalIssuance", api.query.subtensorModule?.totalIssuance],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `${missing.map(([name]) => name).join(", ")} unavailable`);
}

async function logEpochCorrelation(diffChanges) {
  if (diffChanges.length === 0) {
    console.log("epoch correlation: no diff changes to inspect");
    return;
  }

  const inspectedChanges = diffChanges.slice(0, MAX_EPOCH_DETAIL_BLOCKS);

  if (!api.query.subtensorModule?.subnetEpochIndex) {
    console.log("epoch correlation: SubtensorModule.SubnetEpochIndex unavailable; logging SubtensorModule events instead");
    for (const change of inspectedChanges) {
      const eventMethods = await subtensorEventMethods(change.current.hash);
      console.log(
        "event detail:",
        `block=${change.current.block}`,
        `diffDelta=${change.delta}`,
        `subtensorEvents=${eventMethods.length === 0 ? "none" : eventMethods.join(",")}`
      );
    }
    return;
  }

  let changesWithEpochAdvance = 0;

  for (const change of inspectedChanges) {
    const previousBlockHash =
      change.current.block > 0 ? (await api.rpc.chain.getBlockHash(change.current.block - 1)).toString() : change.previous.hash;
    const advancedNetuids = await advancedEpochNetuids(previousBlockHash, change.current.hash);
    if (advancedNetuids.length > 0) {
      changesWithEpochAdvance += 1;
    }

    console.log(
      "epoch detail:",
      `block=${change.current.block}`,
      `diffDelta=${change.delta}`,
      `advancedEpochNetuids=${advancedNetuids.length === 0 ? "none" : advancedNetuids.join(",")}`
    );
  }

  console.log(
    "epoch correlation summary:",
    `inspectedDiffChanges=${inspectedChanges.length}`,
    `changesWithEpochAdvance=${changesWithEpochAdvance}`,
    `changesWithoutEpochAdvance=${inspectedChanges.length - changesWithEpochAdvance}`
  );
}

async function subtensorEventMethods(hash) {
  const events = await api.query.system.events.at(hash);
  return events
    .map(({ event }) => event)
    .filter((event) => event.section === "subtensorModule")
    .map((event) => event.method);
}

async function advancedEpochNetuids(previousHash, currentHash) {
  const [previousEntries, currentEntries] = await Promise.all([
    api.query.subtensorModule.subnetEpochIndex.entriesAt(previousHash),
    api.query.subtensorModule.subnetEpochIndex.entriesAt(currentHash),
  ]);
  const previousByNetuid = new Map(previousEntries.map(([key, value]) => [key.args[0].toNumber(), value.toBigInt()]));
  const advanced = [];

  for (const [key, value] of currentEntries) {
    const netuid = key.args[0].toNumber();
    const previous = previousByNetuid.get(netuid);
    if (previous !== undefined && value.toBigInt() > previous) {
      advanced.push(netuid);
    }
  }

  return advanced;
}

function classifyDrift(sampleCount, mismatchSamples, diffChanges) {
  if (mismatchSamples.length === 0) {
    return "balances and Subtensor total issuance matched for every sampled block";
  }

  if (diffChanges.length === 0) {
    return "mismatched, but the mismatch did not drift during the sampled window";
  }

  if (diffChanges.length >= sampleCount - 1) {
    return "mismatched and drifting on every sampled block transition";
  }

  return "mismatched and drifting only on some sampled block transitions";
}

function sumAbs(values) {
  return values.reduce((total, value) => total + (value < 0n ? -value : value), 0n);
}

function decodeIssuance(storageData) {
  return api.createType("u64", storageData.toU8a()).toBigInt();
}

function range(start, end, step) {
  const values = [];
  assert.ok(Number.isInteger(step) && step > 0, `ISSUANCE_MIRROR_BLOCK_STRIDE must be a positive integer, got ${step}`);

  for (let value = start; value <= end; value += step) {
    values.push(value);
  }
  return values;
}

async function mapLimit(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

function parseNetwork() {
  const networkArgIndex = process.argv.findIndex((arg) => arg === "--network");
  const networkArg =
    process.argv.find((arg) => arg.startsWith("--network="))?.slice("--network=".length) ??
    (networkArgIndex >= 0 ? process.argv[networkArgIndex + 1] : undefined);
  const network = (networkArg ?? process.env.NETWORK ?? "testnet").toLowerCase();

  assert.ok(["testnet", "mainnet"].includes(network), `unsupported network: ${network}`);
  return network;
}

function optionalNumber(value) {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  assert.ok(Number.isInteger(parsed), `expected integer block number, got ${value}`);
  return parsed;
}

function defaultEndpoint(network) {
  if (network === "testnet") {
    return "wss://test.finney.opentensor.ai:443";
  }

  assert.ok(
    process.env.ONFINALITY_API_KEY,
    "ONFINALITY_API_KEY is required for mainnet unless WS_ENDPOINT is set"
  );
  return `wss://bittensor-finney.api.onfinality.io/ws?apikey=${process.env.ONFINALITY_API_KEY}`;
}

function loadDotenv() {
  for (const path of [".env", "../.env"]) {
    if (!fs.existsSync(path)) {
      continue;
    }

    for (const line of fs.readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) {
        continue;
      }

      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

function redactEndpoint(endpoint) {
  return endpoint.replace(/(apikey=)[^&]+/i, "$1<redacted>");
}

main().catch(async (err) => {
  await logger.error(err);
  await logger.flush();
  process.exit(1);
});
