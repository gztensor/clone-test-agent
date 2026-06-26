import assert from "node:assert/strict";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const SAMPLE_BLOCKS = Number(process.env.BLOCK_EPOCH_SAMPLE_BLOCKS ?? 240);
const DELAY_THRESHOLD_MS = Number(process.env.BLOCK_EPOCH_DELAY_THRESHOLD_MS ?? 18_000);
const POLL_MS = Number(process.env.BLOCK_EPOCH_POLL_MS ?? 750);
const LOG_EVERY_BLOCK = process.env.BLOCK_EPOCH_LOG_EVERY_BLOCK === "1";
const LOGGER = createTempLogger("mainnet-block-time-epoch-correlation.log");

LOGGER.captureConsole();

let api;

async function main() {
  await LOGGER.start();
  api = await connectApi(WS_ENDPOINT, { log: console.log });

  try {
    assertMetadataAvailable();

    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const startHeader = await api.rpc.chain.getHeader();
    const maxEpochsPerBlock = await api.query.subtensorModule.maxEpochsPerBlock();
    const tempoEntries = await api.query.subtensorModule.tempo.entries();
    const runningSubnets = tempoEntries
      .map(([key, value]) => ({ netuid: key.args[0].toNumber(), tempo: value.toNumber() }))
      .filter((subnet) => subnet.tempo > 0)
      .sort((a, b) => a.netuid - b.netuid);

    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("start_block:", startHeader.number.toString());
    console.log("sample_blocks:", SAMPLE_BLOCKS);
    console.log("delay_threshold_ms:", DELAY_THRESHOLD_MS);
    console.log("max_epochs_per_block:", maxEpochsPerBlock.toString());
    console.log("running_subnet_count:", runningSubnets.length);
    console.log(
      "tempo_samples:",
      runningSubnets.slice(0, 16).map((subnet) => `${subnet.netuid}:${subnet.tempo}`).join(",")
    );

    const samples = await collectSamples(SAMPLE_BLOCKS);
    printSummary(samples);
    console.log("mainnet block time epoch correlation: completed");
  } finally {
    await api?.disconnect();
    await LOGGER.flush();
  }
}

main().catch(async (error) => {
  await LOGGER.error(error);
  await LOGGER.flush();
  process.exit(1);
});

function assertMetadataAvailable() {
  const missing = [
    ["SubtensorModule.Tempo", api.query.subtensorModule?.tempo],
    ["SubtensorModule.SubnetEpochIndex", api.query.subtensorModule?.subnetEpochIndex],
    ["SubtensorModule.MaxEpochsPerBlock", api.query.subtensorModule?.maxEpochsPerBlock],
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
  let previousEpochs = await epochMapAt(previousHash);
  const deadline = Date.now() + Math.max(300_000, targetBlocks * 30_000);

  while (samples.length < targetBlocks && Date.now() < deadline) {
    await sleep(POLL_MS);
    const latestHeader = await api.rpc.chain.getHeader();
    const latestNumber = latestHeader.number.toNumber();
    if (latestNumber <= previousNumber) continue;

    for (let number = previousNumber + 1; number <= latestNumber && samples.length < targetBlocks; number += 1) {
      const hash = (await api.rpc.chain.getBlockHash(number)).toString();
      const timestamp = await blockTimestampMs(hash);
      const currentEpochs = await epochMapAt(hash);
      const events = await subtensorEventsAt(hash);
      const advancedNetuids = advancedEpochNetuids(previousEpochs, currentEpochs);
      const sample = {
        number,
        hash,
        deltaMs: timestamp !== null && previousTimestamp !== null ? timestamp - previousTimestamp : null,
        observedLagMs: Date.now() - (timestamp ?? Date.now()),
        epochCount: advancedNetuids.length,
        advancedNetuids,
        deferredNetuids: eventNetuids(events, "EpochDeferred"),
        skippedNetuids: eventNetuids(events, "EpochSkipped"),
        subtensorEvents: events.map((event) => event.method),
      };

      samples.push(sample);
      if (LOG_EVERY_BLOCK || sample.deltaMs >= DELAY_THRESHOLD_MS || sample.epochCount > 1 || sample.deferredNetuids.length > 0) {
        console.log(
          "block_sample:",
          `number=${sample.number}`,
          `delta_ms=${sample.deltaMs ?? "n/a"}`,
          `epoch_count=${sample.epochCount}`,
          `advanced_netuids=${sample.advancedNetuids.length === 0 ? "none" : sample.advancedNetuids.join(",")}`,
          `deferred_netuids=${sample.deferredNetuids.length === 0 ? "none" : sample.deferredNetuids.join(",")}`,
          `skipped_netuids=${sample.skippedNetuids.length === 0 ? "none" : sample.skippedNetuids.join(",")}`,
          `events=${sample.subtensorEvents.length === 0 ? "none" : sample.subtensorEvents.join(",")}`
        );
      }

      previousNumber = number;
      previousHash = hash;
      previousTimestamp = timestamp;
      previousEpochs = currentEpochs;
    }
  }

  assert.equal(samples.length, targetBlocks, `observed ${samples.length}/${targetBlocks} requested blocks`);
  console.log("end_block:", previousNumber);
  console.log("end_hash:", previousHash);
  return samples;
}

async function blockTimestampMs(hash) {
  if (!api.query.timestamp?.now) return null;
  const value = await api.query.timestamp.now.at(hash);
  return Number(value.toBigInt());
}

async function epochMapAt(hash) {
  const entries = await api.query.subtensorModule.subnetEpochIndex.entriesAt(hash);
  return new Map(entries.map(([key, value]) => [key.args[0].toNumber(), value.toBigInt()]));
}

async function subtensorEventsAt(hash) {
  const events = await api.query.system.events.at(hash);
  return events
    .map(({ event }) => event)
    .filter((event) => event.section === "subtensorModule")
    .map((event) => ({
      method: event.method,
      data: event.data.toJSON(),
    }));
}

function advancedEpochNetuids(previousEpochs, currentEpochs) {
  const advanced = [];
  for (const [netuid, current] of currentEpochs) {
    const previous = previousEpochs.get(netuid) ?? 0n;
    if (current > previous) {
      advanced.push(netuid);
    }
  }
  return advanced.sort((a, b) => a - b);
}

function eventNetuids(events, method) {
  return events
    .filter((event) => event.method === method)
    .map((event) => {
      if (event.data && typeof event.data === "object" && "netuid" in event.data) return Number(event.data.netuid);
      if (Array.isArray(event.data)) return Number(event.data[0]);
      return null;
    })
    .filter((netuid) => Number.isInteger(netuid))
    .sort((a, b) => a - b);
}

function printSummary(samples) {
  const withDelta = samples.filter((sample) => sample.deltaMs !== null);
  const delayed = withDelta.filter((sample) => sample.deltaMs >= DELAY_THRESHOLD_MS);
  const multiEpoch = withDelta.filter((sample) => sample.epochCount > 1);
  const delayedMultiEpoch = delayed.filter((sample) => sample.epochCount > 1);
  const delayedSingleOrNoEpoch = delayed.filter((sample) => sample.epochCount <= 1);
  const epochBlocks = withDelta.filter((sample) => sample.epochCount > 0);
  const noEpochBlocks = withDelta.filter((sample) => sample.epochCount === 0);
  const deferredBlocks = withDelta.filter((sample) => sample.deferredNetuids.length > 0);

  console.log(
    "summary:",
    `blocks=${samples.length}`,
    `avg_ms=${round(avg(withDelta.map((sample) => sample.deltaMs)), 2)}`,
    `min_ms=${Math.min(...withDelta.map((sample) => sample.deltaMs))}`,
    `max_ms=${Math.max(...withDelta.map((sample) => sample.deltaMs))}`,
    `delayed_blocks=${delayed.length}`,
    `epoch_blocks=${epochBlocks.length}`,
    `multi_epoch_blocks=${multiEpoch.length}`,
    `deferred_blocks=${deferredBlocks.length}`
  );

  console.log(
    "delay_epoch_correlation:",
    `delayed_with_multi_epoch=${delayedMultiEpoch.length}`,
    `delayed_without_multi_epoch=${delayedSingleOrNoEpoch.length}`,
    `multi_epoch_delayed=${multiEpoch.filter((sample) => sample.deltaMs >= DELAY_THRESHOLD_MS).length}/${multiEpoch.length}`,
    `single_or_no_epoch_delayed=${delayedSingleOrNoEpoch.length}/${withDelta.length - multiEpoch.length}`,
    `avg_epoch_block_ms=${round(avgOrZero(epochBlocks.map((sample) => sample.deltaMs)), 2)}`,
    `avg_no_epoch_block_ms=${round(avgOrZero(noEpochBlocks.map((sample) => sample.deltaMs)), 2)}`,
    `avg_multi_epoch_block_ms=${round(avgOrZero(multiEpoch.map((sample) => sample.deltaMs)), 2)}`
  );

  for (const [epochCount, blocks] of groupByEpochCount(withDelta)) {
    console.log(
      "epoch_count_bucket:",
      `epoch_count=${epochCount}`,
      `blocks=${blocks.length}`,
      `avg_ms=${round(avg(blocks.map((sample) => sample.deltaMs)), 2)}`,
      `delayed=${blocks.filter((sample) => sample.deltaMs >= DELAY_THRESHOLD_MS).length}`,
      `max_ms=${Math.max(...blocks.map((sample) => sample.deltaMs))}`
    );
  }

  for (const sample of [...withDelta].sort((a, b) => b.deltaMs - a.deltaMs).slice(0, 12)) {
    console.log(
      "slow_block:",
      `number=${sample.number}`,
      `delta_ms=${sample.deltaMs}`,
      `epoch_count=${sample.epochCount}`,
      `advanced_netuids=${sample.advancedNetuids.length === 0 ? "none" : sample.advancedNetuids.join(",")}`,
      `deferred_netuids=${sample.deferredNetuids.length === 0 ? "none" : sample.deferredNetuids.join(",")}`,
      `skipped_netuids=${sample.skippedNetuids.length === 0 ? "none" : sample.skippedNetuids.join(",")}`
    );
  }
}

function groupByEpochCount(samples) {
  const groups = new Map();
  for (const sample of samples) {
    if (!groups.has(sample.epochCount)) groups.set(sample.epochCount, []);
    groups.get(sample.epochCount).push(sample);
  }
  return [...groups.entries()].sort(([left], [right]) => left - right);
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function avgOrZero(values) {
  return values.length === 0 ? 0 : avg(values);
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
