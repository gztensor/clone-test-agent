import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "runtime-347-ema-reachability.md");
const logger = createTempLogger("runtime-347-ema-reachability.log");
logger.captureConsole();

async function main() {
  await logger.start();
  let api;
  try {
    api = await connectApi(process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944", {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 120_000,
    });
    await api.isReady;

    assert.ok(api.query.subtensorModule.networksAdded, "NetworksAdded storage is missing");
    assert.ok(api.query.subtensorModule.subnetEmaTaoFlow, "SubnetEmaTaoFlow storage is missing");

    const finalizedHash = await api.rpc.chain.getFinalizedHead();
    const [header, runtime, networkEntries, emaEntries] = await Promise.all([
      api.rpc.chain.getHeader(finalizedHash),
      api.rpc.state.getRuntimeVersion(finalizedHash),
      api.query.subtensorModule.networksAdded.entriesAt(finalizedHash),
      api.query.subtensorModule.subnetEmaTaoFlow.entriesAt(finalizedHash),
    ]);
    const activeNetuids = networkEntries
      .filter(([, value]) => value.isTrue)
      .map(([key]) => key.args[0].toNumber())
      .sort((left, right) => left - right);
    const emaNetuids = new Set(emaEntries.map(([key]) => key.args[0].toNumber()));
    const missingAll = activeNetuids.filter((netuid) => !emaNetuids.has(netuid));
    const activeAlphaNetuids = activeNetuids.filter((netuid) => netuid > 0);
    const missingAlpha = activeAlphaNetuids.filter((netuid) => !emaNetuids.has(netuid));

    console.log("block:", header.number.toString(), finalizedHash.toString());
    console.log("runtime:", runtime.specVersion.toString());
    console.log("active networks:", activeNetuids.length);
    console.log("active alpha subnets:", activeAlphaNetuids.length);
    console.log("SubnetEmaTaoFlow entries:", emaEntries.length);
    console.log("active networks missing EMA:", missingAll.join(",") || "none");
    console.log("active alpha subnets missing EMA:", missingAlpha.join(",") || "none");

    fs.writeFileSync(REPORT_PATH, `# Runtime 347 EMA-branch reachability\n\n` +
      `Generated: ${new Date().toISOString()}\n\n` +
      `- Clone block: ${header.number.toString()} (\`${finalizedHash.toString()}\`)\n` +
      `- Snapshot runtime: ${runtime.specVersion.toString()}\n` +
      `- Active networks: ${activeNetuids.length}\n` +
      `- Active alpha subnets: ${activeAlphaNetuids.length}\n` +
      `- Stored \`SubnetEmaTaoFlow\` entries: ${emaEntries.length}\n` +
      `- Active networks without an EMA entry: ${missingAll.length ? missingAll.join(", ") : "none"}\n` +
      `- Active alpha subnets without an EMA entry: ${missingAlpha.length ? missingAlpha.join(", ") : "none"}\n\n` +
      `Runtime 347 and 348 differ in automatic accounting only when ` +
      `\`SubnetEmaTaoFlow::get(netuid)\` returns \`None\`. ` +
      `${missingAlpha.length === 0
        ? "Every active alpha subnet in the synced state has an entry, so that branch is unreachable during the controlled no-registration drift run."
        : "At least one active alpha subnet can enter the differing initialization branch, so runtime 347 requires a behavioral run."}\n`);

    assert.equal(
      missingAlpha.length,
      0,
      `runtime 347's differing EMA initialization branch is reachable for: ${missingAlpha.join(", ")}`
    );
    console.log("runtime-347 EMA reachability check: complete");
  } finally {
    await api?.disconnect();
    await logger.flush();
  }
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
