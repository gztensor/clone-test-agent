import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { createTempLogger } from "../lib/file-log.js";

const logger = createTempLogger("mainnet-clone-runtime-upgrade-smoke.log");

async function main() {
  await logger.start();
  logger.captureConsole();
  const wasmPath = process.env.RUNTIME_WASM_PATH;
  assert.ok(wasmPath, "RUNTIME_WASM_PATH is required");
  const wasm = fs.readFileSync(wasmPath);
  const provider = new WsProvider("ws://127.0.0.1:9944");
  let api;
  try {
    api = await ApiPromise.create({ provider });
    await api.isReady;
    const code = await api.rpc.state.getStorage("0x3a636f6465");
    assert.ok(code.isSome, "Runtime code must exist");
    assert.equal(code.unwrap().toHex(), `0x${wasm.toString("hex")}`, "Installed runtime must match supplied WASM exactly");
    await logger.info("WASM SHA-256:", createHash("sha256").update(wasm).digest("hex"));
    const version = await api.rpc.state.getRuntimeVersion();
    await logger.info("Runtime:", version.specName.toString(), version.specVersion.toString());
    assert.ok(api.tx.system.remark, "Runtime metadata must expose system.remark");
    let previous = (await api.rpc.chain.getHeader()).number.toBigInt();
    let advances = 0;
    const deadline = Date.now() + 180_000;
    await logger.info("Initial block:", previous);
    while (advances < 2 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      const current = (await api.rpc.chain.getHeader()).number.toBigInt();
      assert.ok(current >= previous, "Block height must not regress");
      if (current > previous) {
        advances += 1;
        await logger.info("Block advanced:", previous, "->", current);
      }
      previous = current;
    }
    assert.equal(advances, 2, "Upgraded runtime must produce blocks across two separate polls");
    await logger.info("PASS: exact runtime code, readable metadata, and continued block production");
  } finally {
    if (api) await api.disconnect();
    else await provider.disconnect();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
