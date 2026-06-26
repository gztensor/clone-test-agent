import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import os from "node:os";

import { Keyring } from "@polkadot/api";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.STAKING_LOAD_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const TX_COUNT = Number(process.env.STAKING_LOAD_TX_COUNT ?? 400);
const FUND_BATCH_SIZE = Number(process.env.STAKING_LOAD_FUND_BATCH_SIZE ?? 100);
const SUBMIT_CONCURRENCY = Number(process.env.STAKING_LOAD_SUBMIT_CONCURRENCY ?? 64);
const BASELINE_BLOCKS = Number(process.env.STAKING_LOAD_BASELINE_BLOCKS ?? 8);
const LOAD_BLOCKS = Number(process.env.STAKING_LOAD_BLOCKS ?? 20);
const STAKE_AMOUNT = BigInt(process.env.STAKING_LOAD_STAKE_AMOUNT ?? "1000000000");
const FUND_AMOUNT = BigInt(process.env.STAKING_LOAD_FUND_AMOUNT ?? "5000000000");
const MAX_PRICE = 18_446_744_073_709_551_615n;
const HALF_PERQUINTILL = 500_000_000_000_000_000n;
const FUND_SOURCE_URI = process.env.STAKING_LOAD_FUND_SOURCE_URI ?? "//Alice";
const LOGGER = createTempLogger("test-staking-load-block-production.log");

LOGGER.captureConsole();

const keyring = new Keyring({ type: "sr25519" });
const fundSource = keyring.addFromUri(FUND_SOURCE_URI);

let api;

async function main() {
  await LOGGER.start();
  api = await connectApi(WS_ENDPOINT, { log: console.log });

  try {
    assertMetadataAvailable();

    const nodePid = findNodeSubtensorPid();
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const startHeader = await api.rpc.chain.getHeader();
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("start_block:", startHeader.number.toString());
    console.log("node_pid:", nodePid ?? "not visible from this process namespace");
    console.log("run_id:", RUN_ID);
    console.log(
      "config:",
      `tx_count=${TX_COUNT}`,
      `stake_amount=${STAKE_AMOUNT}`,
      `fund_amount=${FUND_AMOUNT}`,
      `submit_concurrency=${SUBMIT_CONCURRENCY}`,
      `baseline_blocks=${BASELINE_BLOCKS}`,
      `load_blocks=${LOAD_BLOCKS}`
    );

    const targets = await findNonHalfBalancerTargets();
    assert.ok(targets.length > 0, "no initialized non-0.5 balancer staking targets found");
    console.log("target_count:", targets.length);
    console.log(
      "target_samples:",
      targets
        .slice(0, 12)
        .map((target) => `netuid=${target.netuid},weight=${formatPerquintill(target.weight)},raw=${target.weight}`)
        .join("; ")
    );

    const signers = createLoadSigners(TX_COUNT);
    await fundSigners(signers);

    console.log("collecting baseline blocks...");
    const baselineCpuStart = readCpuSample(nodePid);
    const baselineBlocks = await collectBlocks(BASELINE_BLOCKS, new Set());
    const baselineCpuEnd = readCpuSample(nodePid);
    printSummary("baseline", summarizeBlocks(baselineBlocks), summarizeCpu(baselineCpuStart, baselineCpuEnd));

    const signed = await signLoadExtrinsics(signers, targets);
    console.log("signed_load_transactions:", signed.length);

    const loadHashes = new Set(signed.map(({ hash }) => hash));
    const loadCpuStart = readCpuSample(nodePid);
    const submitStartedAt = Date.now();
    const submitPromise = submitSignedExtrinsics(signed);
    const loadBlocks = await collectBlocks(LOAD_BLOCKS, loadHashes);
    const submitResults = await submitPromise;
    const loadCpuEnd = readCpuSample(nodePid);

    const accepted = submitResults.filter((result) => result.ok).length;
    const rejected = submitResults.filter((result) => !result.ok);
    const included = loadBlocks.reduce((sum, block) => sum + block.loadExtrinsics, 0);
    const loadSummary = summarizeBlocks(loadBlocks);
    const loadCpu = summarizeCpu(loadCpuStart, loadCpuEnd);

    printSummary("load", loadSummary, loadCpu);
    console.log("submit_elapsed_ms:", Date.now() - submitStartedAt);
    console.log("submitted_ok:", accepted);
    console.log("submitted_rejected:", rejected.length);
    console.log("included_load_extrinsics_observed:", included);
    console.log("max_load_extrinsics_in_block:", Math.max(0, ...loadBlocks.map((block) => block.loadExtrinsics)));
    console.log("max_total_extrinsics_in_block:", Math.max(0, ...loadBlocks.map((block) => block.extrinsics)));
    if (rejected.length > 0) {
      console.log("rejection_samples:", rejected.slice(0, 10).map((result) => `${result.hash}:${result.error}`).join("; "));
    }

    assert.ok(accepted > 0, "no load transactions were accepted into the transaction pool");
    assert.ok(included > 0, "no load transactions were observed in produced blocks");
    console.log("staking load block production scenario: ok");
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
    ["Balances.transfer", transferCall(api, fundSource.address, 1n)],
    ["SubtensorModule.addStakeLimit", api.tx.subtensorModule?.addStakeLimit],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubtensorModule.Keys", api.query.subtensorModule?.keys],
    ["Swap.PalSwapInitialized", api.query.swap?.palSwapInitialized],
    ["Swap.SwapBalancer", api.query.swap?.swapBalancer],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `${missing.map(([name]) => name).join(", ")} unavailable`);
}

async function findNonHalfBalancerTargets() {
  const initializedEntries = await api.query.swap.palSwapInitialized.entries();
  const targets = [];

  for (const [key, initialized] of initializedEntries) {
    if (!initialized.isTrue) continue;
    const netuid = key.args[0].toNumber();
    if (netuid === 0) continue;

    const weight = extractQuotePerquintill(await api.query.swap.swapBalancer(netuid));
    if (weight === null || weight === HALF_PERQUINTILL) continue;

    const keyEntries = await api.query.subtensorModule.keys.entries(netuid);
    const hotkeys = keyEntries.map(([, value]) => value.toString()).filter(Boolean).slice(0, 8);
    for (const hotkey of hotkeys) {
      targets.push({ netuid, hotkey, weight });
    }
  }

  return targets;
}

function createLoadSigners(count) {
  return Array.from({ length: count }, (_, index) => keyring.addFromUri(`//StakingLoad//${RUN_ID}//${index}`));
}

async function fundSigners(signers) {
  console.log("funding_signers:", signers.length);
  for (let offset = 0; offset < signers.length; offset += FUND_BATCH_SIZE) {
    const chunk = signers.slice(offset, offset + FUND_BATCH_SIZE);
    const calls = chunk.map((signer) => transferCall(api, signer.address, FUND_AMOUNT));
    const result = await submitAndWait(fundSource, api.tx.utility.batchAll(calls), `fund signers ${offset}-${offset + chunk.length - 1}`);
    assertExtrinsicSuccess(result.events, `fund signers ${offset}-${offset + chunk.length - 1}`);
    console.log("funded_signer_batch:", offset, offset + chunk.length - 1);
  }
}

async function signLoadExtrinsics(signers, targets) {
  const signed = [];
  for (let index = 0; index < signers.length; index++) {
    const signer = signers[index];
    const target = targets[index % targets.length];
    const tx = api.tx.subtensorModule.addStakeLimit(target.hotkey, target.netuid, STAKE_AMOUNT, MAX_PRICE, false);
    await tx.signAsync(signer, { nonce: 0 });
    signed.push({ tx, hash: tx.hash.toHex(), netuid: target.netuid });
  }
  return signed;
}

async function submitSignedExtrinsics(signed) {
  const results = new Array(signed.length);
  let next = 0;

  async function worker() {
    while (next < signed.length) {
      const index = next++;
      const item = signed[index];
      try {
        await api.rpc.author.submitExtrinsic(item.tx);
        results[index] = { ok: true, hash: item.hash, netuid: item.netuid };
      } catch (error) {
        results[index] = { ok: false, hash: item.hash, netuid: item.netuid, error: error.message };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(SUBMIT_CONCURRENCY, signed.length) }, () => worker()));
  return results;
}

async function collectBlocks(count, loadHashes) {
  const blocks = [];
  let previousNumber = (await api.rpc.chain.getHeader()).number.toNumber();
  let previousObservedAt = Date.now();
  const deadline = Date.now() + Math.max(180_000, count * 30_000);

  while (blocks.length < count && Date.now() < deadline) {
    await sleep(1_000);
    const header = await api.rpc.chain.getHeader();
    const number = header.number.toNumber();
    if (number <= previousNumber) continue;

    const observedAt = Date.now();
    const signedBlock = await api.rpc.chain.getBlock(header.hash);
    const hashes = signedBlock.block.extrinsics.map((extrinsic) => extrinsic.hash.toHex());
    const loadExtrinsics = hashes.filter((hash) => loadHashes.has(hash)).length;
    const block = {
      number,
      deltaMs: observedAt - previousObservedAt,
      extrinsics: hashes.length,
      loadExtrinsics,
    };
    blocks.push(block);
    previousNumber = number;
    previousObservedAt = observedAt;
    console.log(
      "block_sample:",
      `number=${block.number}`,
      `delta_ms=${block.deltaMs}`,
      `extrinsics=${block.extrinsics}`,
      `load_extrinsics=${block.loadExtrinsics}`
    );
  }

  assert.equal(blocks.length, count, `observed ${blocks.length}/${count} requested blocks`);
  return blocks;
}

async function submitAndWait(signer, tx, label) {
  return new Promise((resolve, reject) => {
    let unsubscribe;
    tx.signAndSend(signer, (result) => {
      if (result.status.isInBlock || result.status.isFinalized) {
        unsubscribe?.();
        resolve(result);
      } else if (result.isError) {
        unsubscribe?.();
        reject(new Error(`${label} failed with status ${result.status.type}`));
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => reject(new Error(`${label}: ${error.message}`)));
  });
}

function assertExtrinsicSuccess(events, label) {
  const failed = events.find(({ event }) => event.section === "system" && event.method === "ExtrinsicFailed");
  assert.equal(failed, undefined, `${label} emitted ExtrinsicFailed`);
}

function transferCall(currentApi, dest, amount) {
  return currentApi.tx.balances?.transferKeepAlive?.(dest, amount)
    ?? currentApi.tx.balances?.transferAllowDeath?.(dest, amount)
    ?? currentApi.tx.balances?.transfer?.(dest, amount);
}

function summarizeBlocks(blocks) {
  const deltas = blocks.map((block) => block.deltaMs);
  return {
    blocks: blocks.length,
    avgMs: Math.round(avg(deltas)),
    minMs: Math.min(...deltas),
    maxMs: Math.max(...deltas),
    avgExtrinsics: round(avg(blocks.map((block) => block.extrinsics)), 2),
    maxExtrinsics: Math.max(...blocks.map((block) => block.extrinsics)),
    totalLoadExtrinsics: blocks.reduce((sum, block) => sum + block.loadExtrinsics, 0),
  };
}

function printSummary(label, blockSummary, cpuSummary) {
  console.log(
    `${label}_summary:`,
    `blocks=${blockSummary.blocks}`,
    `avg_ms=${blockSummary.avgMs}`,
    `min_ms=${blockSummary.minMs}`,
    `max_ms=${blockSummary.maxMs}`,
    `avg_extrinsics=${blockSummary.avgExtrinsics}`,
    `max_extrinsics=${blockSummary.maxExtrinsics}`,
    `load_extrinsics=${blockSummary.totalLoadExtrinsics}`,
    `system_cpu_pct=${cpuSummary?.systemPct ?? "n/a"}`,
    `node_cpu_total_machine_pct=${cpuSummary?.processTotalMachinePct ?? "n/a"}`,
    `node_cpu_one_core_pct=${cpuSummary?.oneCorePct ?? "n/a"}`
  );
}

function readCpuSample(pid) {
  const system = readSystemCpuTicks();
  if (!pid) return { ...system, processTicks: null, atMs: Date.now() };

  try {
    const stat = execFileSync("cat", [`/proc/${pid}/stat`], { encoding: "utf8" }).trim();
    const afterComm = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    const utime = BigInt(afterComm[11]);
    const stime = BigInt(afterComm[12]);
    return { ...system, processTicks: utime + stime, atMs: Date.now() };
  } catch (error) {
    console.log("cpu_sample_error:", error.message);
    return { ...system, processTicks: null, atMs: Date.now() };
  }
}

function summarizeCpu(start, end) {
  if (!start || !end) return null;
  const totalDelta = Number(end.totalTicks - start.totalTicks);
  const idleDelta = Number(end.idleTicks - start.idleTicks);
  const elapsedSeconds = (end.atMs - start.atMs) / 1000;
  if (totalDelta <= 0 || idleDelta < 0 || elapsedSeconds <= 0) return null;

  const summary = {
    systemPct: round(((totalDelta - idleDelta) / totalDelta) * 100, 2),
    processTotalMachinePct: "n/a",
    oneCorePct: "n/a",
  };

  if (start.processTicks !== null && end.processTicks !== null) {
    const processDelta = Number(end.processTicks - start.processTicks);
    if (processDelta >= 0) {
      const hz = Number(execFileSync("getconf", ["CLK_TCK"], { encoding: "utf8" }).trim());
      summary.processTotalMachinePct = round((processDelta / totalDelta) * 100, 2);
      summary.oneCorePct = round((processDelta / (elapsedSeconds * hz)) * 100, 2);
    }
  }

  return summary;
}

function readSystemCpuTicks() {
  const totalStat = execFileSync("cat", ["/proc/stat"], { encoding: "utf8" }).split("\n")[0];
  const values = totalStat.trim().split(/\s+/).slice(1).map((value) => BigInt(value));
  const totalTicks = values.reduce((sum, value) => sum + value, 0n);
  const idleTicks = (values[3] ?? 0n) + (values[4] ?? 0n);
  return { totalTicks, idleTicks };
}

function findNodeSubtensorPid() {
  try {
    const output = execFileSync("pgrep", ["-f", "node-subtensor.*--base-path"], { encoding: "utf8" }).trim();
    return Number(output.split("\n")[0]);
  } catch {
    return null;
  }
}

function extractQuotePerquintill(value) {
  const json = value.toJSON();
  if (typeof json === "number") return BigInt(json);
  if (typeof json === "string") return BigInt(json.replace(/,/g, ""));
  if (json && typeof json === "object") {
    for (const candidate of Object.values(json)) {
      if (typeof candidate === "number") return BigInt(candidate);
      if (typeof candidate === "string") return BigInt(candidate.replace(/,/g, ""));
    }
  }
  return null;
}

function formatPerquintill(value) {
  return (Number(value) / 1e18).toFixed(6);
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
