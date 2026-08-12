import assert from "node:assert/strict";
import fs from "node:fs";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const SAMPLE_BLOCKS = Number(process.env.STAKING_BLOCK_TIME_SAMPLE_BLOCKS ?? 360);
const LONG_BLOCK_THRESHOLD_MS = Number(process.env.STAKING_BLOCK_TIME_LONG_THRESHOLD_MS ?? 18_000);
const POLL_MS = Number(process.env.STAKING_BLOCK_TIME_POLL_MS ?? 750);
const LOG_EVERY_BLOCK = process.env.STAKING_BLOCK_TIME_LOG_EVERY_BLOCK === "1";
const TRACK_ROOT_CLAIMS = process.env.STAKING_BLOCK_TIME_TRACK_ROOT_CLAIMS !== "0";
const LOGGER = createTempLogger("mainnet-staking-block-time-correlation.log");

LOGGER.captureConsole();

let api;

async function main() {
  await LOGGER.start();
  api = await connectApi(WS_ENDPOINT, { log: (message) => console.log(redactEndpoint(message)) });

  try {
    assertMetadataAvailable();

    const chain = await api.rpc.system.chain();
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const startHeader = await api.rpc.chain.getHeader();

    console.log("network: mainnet");
    console.log("endpoint:", redactEndpoint(WS_ENDPOINT));
    console.log("chain:", chain.toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("start_block:", startHeader.number.toString());
    console.log("sample_blocks:", SAMPLE_BLOCKS);
    console.log("long_block_threshold_ms:", LONG_BLOCK_THRESHOLD_MS);
    console.log("staking_call_match:", "section=subtensorModule method contains stake|unstake|delegate");
    console.log("track_root_claims:", TRACK_ROOT_CLAIMS);
    if (TRACK_ROOT_CLAIMS) {
      console.log("root_claim_swap_measure:", "RootClaimed events whose coldkey RootClaimType at block is Swap");
      console.log("root_sell_measure:", "SubtensorModule.SubnetRootSellTao non-zero entries at block hash");
    }

    const samples = await collectSamples(SAMPLE_BLOCKS);
    printSummary(samples);

    console.log("mainnet staking block time correlation: completed");
  } finally {
    await api?.disconnect();
    await LOGGER.flush();
  }
}

function assertMetadataAvailable() {
  const missing = [
    ["Timestamp.Now", api.query.timestamp?.now],
    ["System.Events", api.query.system?.events],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `${missing.map(([name]) => name).join(", ")} unavailable`);
}

async function collectSamples(targetBlocks) {
  const samples = [];
  let previousHeader = await api.rpc.chain.getHeader();
  let previousNumber = previousHeader.number.toNumber();
  let previousHash = previousHeader.hash.toString();
  let previousTimestamp = await blockTimestampMs(previousHash);
  const deadline = Date.now() + Math.max(600_000, targetBlocks * 30_000);

  while (samples.length < targetBlocks && Date.now() < deadline) {
    await sleep(POLL_MS);
    const latestHeader = await api.rpc.chain.getHeader();
    const latestNumber = latestHeader.number.toNumber();
    if (latestNumber <= previousNumber) continue;

    for (let number = previousNumber + 1; number <= latestNumber && samples.length < targetBlocks; number += 1) {
      const hash = (await api.rpc.chain.getBlockHash(number)).toString();
      const [timestamp, signedBlock, events] = await Promise.all([
        blockTimestampMs(hash),
        api.rpc.chain.getBlock(hash),
        api.query.system.events.at(hash),
      ]);
      const extrinsics = signedBlock.block.extrinsics;
      const stakingExtrinsics = extrinsics.filter(isStakingExtrinsic);
      const successfulStakingExtrinsics = countSuccessfulStakingExtrinsics(extrinsics, events);
      const rootClaims = TRACK_ROOT_CLAIMS ? await rootClaimMetricsAt(hash, events) : emptyRootClaimMetrics();
      const sample = {
        number,
        hash,
        deltaMs: timestamp - previousTimestamp,
        extrinsics: extrinsics.length,
        stakingExtrinsics: stakingExtrinsics.length,
        successfulStakingExtrinsics,
        stakingMethods: methodCounts(stakingExtrinsics),
        ...rootClaims,
      };

      samples.push(sample);
      if (
        LOG_EVERY_BLOCK ||
        sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS ||
        sample.stakingExtrinsics > 0 ||
        sample.rootClaimEvents > 0 ||
        sample.rootSellNetuids.length > 0
      ) {
        console.log(
          "block_sample:",
          `number=${sample.number}`,
          `delta_ms=${sample.deltaMs}`,
          `extrinsics=${sample.extrinsics}`,
          `staking_extrinsics=${sample.stakingExtrinsics}`,
          `successful_staking_extrinsics=${sample.successfulStakingExtrinsics}`,
          `staking_methods=${formatMethodCounts(sample.stakingMethods)}`,
          `root_claim_events=${sample.rootClaimEvents}`,
          `root_claim_swap_events=${sample.rootClaimSwapEvents}`,
          `root_claim_keep_events=${sample.rootClaimKeepEvents}`,
          `root_claim_unknown_events=${sample.rootClaimUnknownEvents}`,
          `root_sell_netuid_count=${sample.rootSellNetuids.length}`,
          `root_sell_netuids=${sample.rootSellNetuids.length === 0 ? "none" : sample.rootSellNetuids.join(",")}`,
          `root_sell_tao=${sample.rootSellTao}`
        );
      }

      previousNumber = number;
      previousHash = hash;
      previousTimestamp = timestamp;
    }
  }

  assert.equal(samples.length, targetBlocks, `observed ${samples.length}/${targetBlocks} requested blocks`);
  console.log("end_block:", previousNumber);
  console.log("end_hash:", previousHash);
  return samples;
}

async function blockTimestampMs(hash) {
  const value = await api.query.timestamp.now.at(hash);
  return Number(value.toBigInt());
}

function isStakingExtrinsic(extrinsic) {
  const method = extrinsic.method;
  if (method.section !== "subtensorModule") return false;

  const methodName = method.method.toLowerCase();
  return (
    methodName.includes("stake") ||
    methodName.includes("unstake") ||
    methodName.includes("delegate") ||
    methodName.startsWith("swap_hotkey")
  );
}

function countSuccessfulStakingExtrinsics(extrinsics, events) {
  let successful = 0;

  for (const [index, extrinsic] of extrinsics.entries()) {
    if (!isStakingExtrinsic(extrinsic)) continue;

    const success = events.some(({ phase, event }) => {
      return (
        phase.isApplyExtrinsic &&
        phase.asApplyExtrinsic.toNumber() === index &&
        event.section === "system" &&
        event.method === "ExtrinsicSuccess"
      );
    });
    if (success) successful += 1;
  }

  return successful;
}

async function rootClaimMetricsAt(hash, events) {
  const rootClaimEvents = events
    .map(({ event }) => event)
    .filter((event) => event.section === "subtensorModule" && event.method === "RootClaimed");

  let rootClaimSwapEvents = 0;
  let rootClaimKeepEvents = 0;
  let rootClaimUnknownEvents = 0;

  for (const event of rootClaimEvents) {
    const coldkey = extractRootClaimColdkey(event);
    if (!coldkey || !api.query.subtensorModule?.rootClaimType) {
      rootClaimUnknownEvents += 1;
      continue;
    }

    const claimType = (await api.query.subtensorModule.rootClaimType.at(hash, coldkey)).toString();
    if (claimType === "Swap") {
      rootClaimSwapEvents += 1;
    } else if (claimType === "Keep" || claimType.startsWith("{\"keepSubnets\"") || claimType.includes("KeepSubnets")) {
      rootClaimKeepEvents += 1;
    } else {
      rootClaimUnknownEvents += 1;
    }
  }

  const rootSellEntries = api.query.subtensorModule?.subnetRootSellTao
    ? await api.query.subtensorModule.subnetRootSellTao.entriesAt(hash)
    : [];
  const rootSellNonZero = rootSellEntries
    .map(([key, value]) => ({
      netuid: key.args[0].toNumber(),
      tao: value.toBigInt(),
    }))
    .filter((entry) => entry.tao > 0n)
    .sort((left, right) => left.netuid - right.netuid);

  return {
    rootClaimEvents: rootClaimEvents.length,
    rootClaimSwapEvents,
    rootClaimKeepEvents,
    rootClaimUnknownEvents,
    rootSellNetuids: rootSellNonZero.map((entry) => entry.netuid),
    rootSellTao: rootSellNonZero.reduce((total, entry) => total + entry.tao, 0n).toString(),
  };
}

function emptyRootClaimMetrics() {
  return {
    rootClaimEvents: 0,
    rootClaimSwapEvents: 0,
    rootClaimKeepEvents: 0,
    rootClaimUnknownEvents: 0,
    rootSellNetuids: [],
    rootSellTao: "0",
  };
}

function extractRootClaimColdkey(event) {
  if (event.data && typeof event.data === "object" && !Array.isArray(event.data) && "coldkey" in event.data) {
    return event.data.coldkey.toString();
  }

  if (event.data?.length > 0) {
    return event.data[0].toString();
  }

  const json = event.data.toJSON();
  if (json && typeof json === "object" && "coldkey" in json) {
    return json.coldkey;
  }

  return null;
}

function methodCounts(extrinsics) {
  const counts = new Map();
  for (const extrinsic of extrinsics) {
    const key = `${extrinsic.method.section}.${extrinsic.method.method}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function printSummary(samples) {
  const longBlocks = samples.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS);
  const stakingBlocks = samples.filter((sample) => sample.stakingExtrinsics > 0);
  const noStakingBlocks = samples.filter((sample) => sample.stakingExtrinsics === 0);
  const totalStakingExtrinsics = sum(samples.map((sample) => sample.stakingExtrinsics));
  const totalSuccessfulStakingExtrinsics = sum(samples.map((sample) => sample.successfulStakingExtrinsics));
  const rootClaimBlocks = samples.filter((sample) => sample.rootClaimEvents > 0);
  const rootClaimSwapBlocks = samples.filter((sample) => sample.rootClaimSwapEvents > 0);
  const rootSellBlocks = samples.filter((sample) => sample.rootSellNetuids.length > 0);
  const noRootClaimSwapBlocks = samples.filter((sample) => sample.rootClaimSwapEvents === 0);
  const noRootSellBlocks = samples.filter((sample) => sample.rootSellNetuids.length === 0);
  const correlation = pearson(
    samples.map((sample) => sample.stakingExtrinsics),
    samples.map((sample) => sample.deltaMs)
  );
  const rootClaimSwapCorrelation = pearson(
    samples.map((sample) => sample.rootClaimSwapEvents),
    samples.map((sample) => sample.deltaMs)
  );
  const rootSellNetuidCorrelation = pearson(
    samples.map((sample) => sample.rootSellNetuids.length),
    samples.map((sample) => sample.deltaMs)
  );
  const rootSellTaoCorrelation = pearson(
    samples.map((sample) => Number(sample.rootSellTao)),
    samples.map((sample) => sample.deltaMs)
  );

  console.log(
    "summary:",
    `blocks=${samples.length}`,
    `avg_ms=${round(avg(samples.map((sample) => sample.deltaMs)), 2)}`,
    `min_ms=${Math.min(...samples.map((sample) => sample.deltaMs))}`,
    `max_ms=${Math.max(...samples.map((sample) => sample.deltaMs))}`,
    `long_blocks=${longBlocks.length}`,
    `staking_blocks=${stakingBlocks.length}`,
    `total_staking_extrinsics=${totalStakingExtrinsics}`,
    `total_successful_staking_extrinsics=${totalSuccessfulStakingExtrinsics}`,
    `pearson_staking_count_vs_delta=${Number.isNaN(correlation) ? "n/a" : round(correlation, 4)}`,
    `root_claim_blocks=${rootClaimBlocks.length}`,
    `root_claim_swap_blocks=${rootClaimSwapBlocks.length}`,
    `root_sell_blocks=${rootSellBlocks.length}`,
    `pearson_root_claim_swap_count_vs_delta=${Number.isNaN(rootClaimSwapCorrelation) ? "n/a" : round(rootClaimSwapCorrelation, 4)}`,
    `pearson_root_sell_netuid_count_vs_delta=${Number.isNaN(rootSellNetuidCorrelation) ? "n/a" : round(rootSellNetuidCorrelation, 4)}`,
    `pearson_root_sell_tao_vs_delta=${Number.isNaN(rootSellTaoCorrelation) ? "n/a" : round(rootSellTaoCorrelation, 4)}`
  );

  console.log(
    "staking_vs_no_staking:",
    `staking_blocks=${stakingBlocks.length}`,
    `staking_avg_ms=${round(avgOrZero(stakingBlocks.map((sample) => sample.deltaMs)), 2)}`,
    `staking_long_blocks=${stakingBlocks.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS).length}`,
    `no_staking_blocks=${noStakingBlocks.length}`,
    `no_staking_avg_ms=${round(avgOrZero(noStakingBlocks.map((sample) => sample.deltaMs)), 2)}`,
    `no_staking_long_blocks=${noStakingBlocks.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS).length}`
  );

  console.log(
    "root_claim_swaps_vs_no_swaps:",
    `root_claim_swap_blocks=${rootClaimSwapBlocks.length}`,
    `root_claim_swap_avg_ms=${round(avgOrZero(rootClaimSwapBlocks.map((sample) => sample.deltaMs)), 2)}`,
    `root_claim_swap_long_blocks=${rootClaimSwapBlocks.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS).length}`,
    `no_root_claim_swap_blocks=${noRootClaimSwapBlocks.length}`,
    `no_root_claim_swap_avg_ms=${round(avgOrZero(noRootClaimSwapBlocks.map((sample) => sample.deltaMs)), 2)}`,
    `no_root_claim_swap_long_blocks=${noRootClaimSwapBlocks.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS).length}`
  );

  console.log(
    "root_sells_vs_no_sells:",
    `root_sell_blocks=${rootSellBlocks.length}`,
    `root_sell_avg_ms=${round(avgOrZero(rootSellBlocks.map((sample) => sample.deltaMs)), 2)}`,
    `root_sell_long_blocks=${rootSellBlocks.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS).length}`,
    `no_root_sell_blocks=${noRootSellBlocks.length}`,
    `no_root_sell_avg_ms=${round(avgOrZero(noRootSellBlocks.map((sample) => sample.deltaMs)), 2)}`,
    `no_root_sell_long_blocks=${noRootSellBlocks.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS).length}`
  );

  for (const [count, blocks] of groupByRootClaimSwapCount(samples)) {
    console.log(
      "root_claim_swap_count_bucket:",
      `root_claim_swap_events=${count}`,
      `blocks=${blocks.length}`,
      `avg_ms=${round(avg(blocks.map((sample) => sample.deltaMs)), 2)}`,
      `long_blocks=${blocks.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS).length}`,
      `max_ms=${Math.max(...blocks.map((sample) => sample.deltaMs))}`
    );
  }

  for (const [count, blocks] of groupByRootSellNetuidCount(samples)) {
    console.log(
      "root_sell_netuid_count_bucket:",
      `root_sell_netuid_count=${count}`,
      `blocks=${blocks.length}`,
      `avg_ms=${round(avg(blocks.map((sample) => sample.deltaMs)), 2)}`,
      `long_blocks=${blocks.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS).length}`,
      `max_ms=${Math.max(...blocks.map((sample) => sample.deltaMs))}`
    );
  }

  for (const [count, blocks] of groupByStakingCount(samples)) {
    console.log(
      "staking_count_bucket:",
      `staking_extrinsics=${count}`,
      `blocks=${blocks.length}`,
      `avg_ms=${round(avg(blocks.map((sample) => sample.deltaMs)), 2)}`,
      `long_blocks=${blocks.filter((sample) => sample.deltaMs >= LONG_BLOCK_THRESHOLD_MS).length}`,
      `max_ms=${Math.max(...blocks.map((sample) => sample.deltaMs))}`
    );
  }

  for (const sample of [...samples].sort((a, b) => b.deltaMs - a.deltaMs).slice(0, 16)) {
    console.log(
      "slow_block:",
      `number=${sample.number}`,
      `delta_ms=${sample.deltaMs}`,
      `extrinsics=${sample.extrinsics}`,
      `staking_extrinsics=${sample.stakingExtrinsics}`,
      `successful_staking_extrinsics=${sample.successfulStakingExtrinsics}`,
      `staking_methods=${formatMethodCounts(sample.stakingMethods)}`,
      `root_claim_events=${sample.rootClaimEvents}`,
      `root_claim_swap_events=${sample.rootClaimSwapEvents}`,
      `root_sell_netuid_count=${sample.rootSellNetuids.length}`,
      `root_sell_netuids=${sample.rootSellNetuids.length === 0 ? "none" : sample.rootSellNetuids.join(",")}`,
      `root_sell_tao=${sample.rootSellTao}`
    );
  }
}

function groupByStakingCount(samples) {
  const groups = new Map();
  for (const sample of samples) {
    if (!groups.has(sample.stakingExtrinsics)) groups.set(sample.stakingExtrinsics, []);
    groups.get(sample.stakingExtrinsics).push(sample);
  }
  return [...groups.entries()].sort(([left], [right]) => left - right);
}

function groupByRootClaimSwapCount(samples) {
  const groups = new Map();
  for (const sample of samples) {
    if (!groups.has(sample.rootClaimSwapEvents)) groups.set(sample.rootClaimSwapEvents, []);
    groups.get(sample.rootClaimSwapEvents).push(sample);
  }
  return [...groups.entries()].sort(([left], [right]) => left - right);
}

function groupByRootSellNetuidCount(samples) {
  const groups = new Map();
  for (const sample of samples) {
    const count = sample.rootSellNetuids.length;
    if (!groups.has(count)) groups.set(count, []);
    groups.get(count).push(sample);
  }
  return [...groups.entries()].sort(([left], [right]) => left - right);
}

function formatMethodCounts(counts) {
  if (counts.size === 0) return "none";
  return [...counts.entries()].map(([method, count]) => `${method}:${count}`).join(",");
}

function defaultEndpoint() {
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

function avg(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function avgOrZero(values) {
  return values.length === 0 ? 0 : avg(values);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function pearson(leftValues, rightValues) {
  if (leftValues.length !== rightValues.length || leftValues.length < 2) return Number.NaN;

  const leftAvg = avg(leftValues);
  const rightAvg = avg(rightValues);
  let numerator = 0;
  let leftDenominator = 0;
  let rightDenominator = 0;

  for (let index = 0; index < leftValues.length; index += 1) {
    const leftDelta = leftValues[index] - leftAvg;
    const rightDelta = rightValues[index] - rightAvg;
    numerator += leftDelta * rightDelta;
    leftDenominator += leftDelta ** 2;
    rightDenominator += rightDelta ** 2;
  }

  const denominator = Math.sqrt(leftDenominator * rightDenominator);
  return denominator === 0 ? Number.NaN : numerator / denominator;
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(async (error) => {
  await LOGGER.error(error);
  await LOGGER.flush();
  process.exit(1);
});
