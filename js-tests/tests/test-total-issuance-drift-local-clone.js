import assert from "node:assert/strict";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const SAMPLE_BLOCKS = Number(process.env.TOTAL_ISSUANCE_DRIFT_SAMPLE_BLOCKS ?? "12");
const POLL_MS = Number(process.env.TOTAL_ISSUANCE_DRIFT_POLL_MS ?? "3000");
const logger = createTempLogger("test-total-issuance-drift-local-clone.log");
logger.captureConsole();

let api;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, { log: console.log });

  try {
    assertMetadataAvailable();
    assert.ok(Number.isInteger(SAMPLE_BLOCKS) && SAMPLE_BLOCKS >= 2, "SAMPLE_BLOCKS must be an integer >= 2");
    assert.ok(Number.isInteger(POLL_MS) && POLL_MS > 0, "POLL_MS must be a positive integer");

    const chain = await api.rpc.system.chain();
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    console.log("chain:", chain.toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("endpoint:", WS_ENDPOINT);
    console.log("sample blocks:", SAMPLE_BLOCKS);

    const samples = [];
    let lastBlock = -1;

    while (samples.length < SAMPLE_BLOCKS) {
      const header = await api.rpc.chain.getHeader();
      const block = header.number.toNumber();

      if (block !== lastBlock) {
        const hash = header.hash.toString();
        const sample = await sampleIssuance(block, hash);
        samples.push(sample);
        lastBlock = block;
        console.log(
          "sample:",
          `index=${samples.length}`,
          `block=${sample.block}`,
          `hash=${sample.hash}`,
          `balances=${sample.balances}`,
          `subtensor=${sample.subtensor}`,
          `diff=${sample.diff}`
        );
      }

      if (samples.length < SAMPLE_BLOCKS) {
        await sleep(POLL_MS);
      }
    }

    const diffChanges = [];
    for (let i = 1; i < samples.length; i += 1) {
      const previous = samples[i - 1];
      const current = samples[i];
      if (current.diff !== previous.diff) {
        diffChanges.push({ previous, current, delta: current.diff - previous.diff });
      }
    }

    console.log("first diff:", samples[0].diff.toString());
    console.log("last diff:", samples.at(-1).diff.toString());
    console.log("net drift:", (samples.at(-1).diff - samples[0].diff).toString());
    console.log("diff changes:", diffChanges.length);

    for (const change of diffChanges) {
      console.log(
        "diff change:",
        `fromBlock=${change.previous.block}`,
        `toBlock=${change.current.block}`,
        `from=${change.previous.diff}`,
        `to=${change.current.diff}`,
        `delta=${change.delta}`
      );
    }

    assert.equal(diffChanges.length, 0, "Balances/Subtensor total issuance difference drifted");
    console.log("total issuance drift local clone: difference stayed constant");
  } finally {
    await api?.disconnect();
    await logger.flush();
  }
}

function assertMetadataAvailable() {
  const missing = [
    ["Balances.TotalIssuance", api.query.balances?.totalIssuance],
    ["SubtensorModule.TotalIssuance", api.query.subtensorModule?.totalIssuance],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `${missing.map(([name]) => name).join(", ")} unavailable`);
}

async function sampleIssuance(block, hash) {
  const [balances, subtensor] = await Promise.all([
    api.query.balances.totalIssuance.at(hash),
    api.query.subtensorModule.totalIssuance.at(hash),
  ]);

  return {
    block,
    hash,
    balances: balances.toBigInt(),
    subtensor: subtensor.toBigInt(),
    diff: balances.toBigInt() - subtensor.toBigInt(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(async (err) => {
  await logger.error(err);
  await logger.flush();
  process.exit(1);
});
