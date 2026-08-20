import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Keyring } from "@polkadot/api";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const EXPECTED_WASM_SHA256 = "2a4b6dba3a1a2169155c9660ec4e9806332cd8034ba293d774bfa3e364329912";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const WASM_PATH = process.env.RUNTIME_WASM_PATH ?? path.resolve(
  REPO_ROOT,
  ".runtime-search/artifacts/runtime423-patched-no-migrations-as-448.compact.compressed.wasm",
);
const REPORT_PATH = path.resolve(__dirname, "..", "runtime-423-upgrade-boundary.md");
const logger = createTempLogger("runtime-423-upgrade-boundary.log");
logger.captureConsole();

async function main() {
  await logger.start();
  assert.ok(fs.existsSync(WASM_PATH), `runtime wasm not found: ${WASM_PATH}`);
  const wasm = fs.readFileSync(WASM_PATH);
  assert.equal(sha256(wasm), EXPECTED_WASM_SHA256, "unexpected candidate WASM");

  let api;
  try {
    api = await connectApi(WS_ENDPOINT, {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 300_000,
    });
    const alice = new Keyring({ type: "sr25519" }).addFromUri("//Alice");
    assert.equal((await api.query.sudo.key()).toString(), alice.address, "Alice is not sudo");
    assert.equal((await api.rpc.state.getRuntimeVersion()).specVersion.toNumber(), 447);

    const beforeHead = await api.rpc.chain.getFinalizedHead();
    const beforeHeader = await api.rpc.chain.getHeader(beforeHead);
    console.log("pre-submission finalized block:", beforeHeader.number.toString(), beforeHead.toString());
    console.log("candidate wasm:", WASM_PATH);
    console.log("candidate wasm sha256:", EXPECTED_WASM_SHA256);

    const inclusionHash = await submitAndWait(
      api,
      alice,
      api.tx.sudo.sudo(api.tx.system.setCode(`0x${wasm.toString("hex")}`)),
    );
    console.log("setCode finalized in:", inclusionHash);

    const observed = await waitForRuntime(api, 448);
    const activation = await findActivationBoundary(api, observed, 447, 448);
    const activationHeight = activation.header.number.toNumber();
    const priorHash = await api.rpc.chain.getBlockHash(activationHeight - 1);
    const priorRuntime = await api.rpc.state.getRuntimeVersion(priorHash);
    assert.equal(priorRuntime.specVersion.toNumber(), 447, "activation boundary does not begin at 447");

    await api.disconnect();
    api = await connectApi(WS_ENDPOINT, {
      log: (message) => console.log(message),
      timeoutMs: 120_000,
      providerTimeoutMs: 300_000,
    });
    const before = await readSnapshot(api, priorHash.toString(), activationHeight - 1);
    const after = await readSnapshot(api, activation.hash, activationHeight);
    const markerChanges = compareMarkers(before.markers, after.markers);
    const rows = before.netuids.map((netuid) => compareAccounting(before, after, netuid));
    const noEpochRows = rows.filter((row) => row.epochs === 0n);
    const maxNoEpochMovement = noEpochRows.reduce(
      (best, row) => abs(row.discrepancyChange) > abs(best.discrepancyChange) ? row : best,
      noEpochRows[0],
    );

    assert.deepEqual(after.netuids, before.netuids, "active subnet set changed at upgrade boundary");
    assert.deepEqual(markerChanges, [], "a migration marker changed at the upgrade boundary");
    assert.ok(noEpochRows.length > 0, "every subnet executed an epoch at the upgrade boundary");
    assert.ok(
      abs(maxNoEpochMovement.discrepancyChange) <= 10_000n,
      `non-epoch discrepancy discontinuity on subnet ${maxNoEpochMovement.netuid}: ` +
        `${maxNoEpochMovement.discrepancyChange} rao`,
    );

    fs.writeFileSync(REPORT_PATH, renderReport({
      wasmSha256: EXPECTED_WASM_SHA256,
      inclusionHash,
      before,
      after,
      markerChanges,
      rows,
      noEpochRows,
      maxNoEpochMovement,
    }));
    console.log("upgrade boundary:", `${before.height}/${before.hash} -> ${after.height}/${after.hash}`);
    console.log("migration marker changes:", markerChanges.length);
    console.log("non-epoch subnets:", noEpochRows.length);
    console.log(
      "largest non-epoch discrepancy movement:",
      maxNoEpochMovement.netuid,
      maxNoEpochMovement.discrepancyChange.toString(),
      "rao",
    );
    console.log("report:", REPORT_PATH);
    console.log("runtime-423 upgrade-boundary verification: complete");
  } finally {
    await api?.disconnect();
  }
}

async function submitAndWait(api, signer, tx) {
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      unsubscribe?.();
      fn(value);
    };
    tx.signAndSend(signer, ({ status, dispatchError, events }) => {
      if (dispatchError) {
        finish(reject, new Error(`setCode dispatch failed: ${formatDispatchError(api, dispatchError)}`));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        const failed = events.find(({ event }) =>
          event.section === "system" && event.method === "ExtrinsicFailed");
        if (failed) {
          finish(reject, new Error(`setCode failed: ${formatDispatchError(api, failed.event.data[0])}`));
          return;
        }
      }
      if (status.isFinalized) finish(resolve, status.asFinalized.toString());
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch((error) => finish(reject, error));
  });
}

function formatDispatchError(api, error) {
  if (!error.isModule) return error.toString();
  const decoded = api.registry.findMetaError(error.asModule);
  return `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
}

async function waitForRuntime(api, expectedVersion) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const hash = await api.rpc.chain.getFinalizedHead();
    const [header, runtime] = await Promise.all([
      api.rpc.chain.getHeader(hash),
      api.rpc.state.getRuntimeVersion(hash),
    ]);
    console.log("runtime poll:", header.number.toString(), runtime.specVersion.toString());
    if (runtime.specVersion.toNumber() === expectedVersion) {
      return { hash: hash.toString(), header };
    }
    await delay(1_000);
  }
  throw new Error(`runtime ${expectedVersion} did not activate`);
}

async function findActivationBoundary(api, observed, priorVersion, activeVersion) {
  let activationHeight = observed.header.number.toNumber();
  while (activationHeight > 0) {
    const priorHash = await api.rpc.chain.getBlockHash(activationHeight - 1);
    const priorRuntime = await api.rpc.state.getRuntimeVersion(priorHash);
    if (priorRuntime.specVersion.toNumber() === priorVersion) break;
    assert.equal(
      priorRuntime.specVersion.toNumber(),
      activeVersion,
      `unexpected runtime while locating activation at block ${activationHeight - 1}`,
    );
    activationHeight -= 1;
  }
  assert.ok(activationHeight > 0, "could not locate runtime activation boundary");
  const hash = await api.rpc.chain.getBlockHash(activationHeight);
  const [header, runtime] = await Promise.all([
    api.rpc.chain.getHeader(hash),
    api.rpc.state.getRuntimeVersion(hash),
  ]);
  assert.equal(runtime.specVersion.toNumber(), activeVersion);
  console.log("exact runtime activation:", activationHeight, hash.toString());
  return { hash: hash.toString(), header };
}

async function readSnapshot(api, hash, height) {
  console.log("reading upgrade-boundary snapshot:", height, hash);
  const apiAt = await api.at(hash);
  const [networkEntries, markerEntries, epochEntries] = await Promise.all([
    apiAt.query.subtensorModule.networksAdded.entries(),
    apiAt.query.subtensorModule.hasMigrationRun.entries(),
    apiAt.query.subtensorModule.subnetEpochIndex.entries(),
  ]);
  const netuids = networkEntries
    .filter(([, value]) => value.isTrue)
    .map(([key]) => key.args[0].toNumber())
    .filter((netuid) => netuid > 0)
    .sort((left, right) => left - right);
  const actualStake = await sumDoubleMap(apiAt.query.subtensorModule.totalHotkeyAlpha, netuids);
  const pendingBasket = await sumDoubleMap(apiAt.query.subtensorModule.pendingBasketDeposits, netuids);
  const maps = {};
  for (const [name, query] of [
    ["alphaOut", apiAt.query.subtensorModule.subnetAlphaOut],
    ["burned", apiAt.query.alphaAssets.alphaBurned],
    ["protocol", apiAt.query.subtensorModule.subnetProtocolAlpha],
    ["pendingServer", apiAt.query.subtensorModule.pendingServerEmission],
    ["pendingValidator", apiAt.query.subtensorModule.pendingValidatorEmission],
    ["pendingRoot", apiAt.query.subtensorModule.pendingRootAlphaDivs],
    ["pendingOwner", apiAt.query.subtensorModule.pendingOwnerCut],
  ]) {
    maps[name] = singleMap(await query.entries());
  }
  return {
    height,
    hash,
    netuids,
    markers: new Map(markerEntries.map(([key, value]) => [key.args[0].toUtf8(), value.isTrue])),
    epochs: singleMap(epochEntries),
    rows: new Map(netuids.map((netuid) => {
      const pending = (maps.pendingServer.get(netuid) ?? 0n) +
        (maps.pendingValidator.get(netuid) ?? 0n) +
        (maps.pendingRoot.get(netuid) ?? 0n) +
        (maps.pendingOwner.get(netuid) ?? 0n) +
        (pendingBasket.get(netuid) ?? 0n);
      const alphaOut = maps.alphaOut.get(netuid) ?? 0n;
      const burned = maps.burned.get(netuid) ?? 0n;
      const protocol = maps.protocol.get(netuid) ?? 0n;
      const actual = actualStake.get(netuid) ?? 0n;
      return [netuid, {
        actual,
        alphaOut,
        burned,
        pending,
        protocol,
        calculated: alphaOut - burned - pending - protocol,
        discrepancy: actual - (alphaOut - burned - pending - protocol),
      }];
    })),
  };
}

async function sumDoubleMap(query, netuids) {
  const allowed = new Set(netuids);
  const totals = new Map(netuids.map((netuid) => [netuid, 0n]));
  let startKey;
  while (true) {
    const page = await query.entriesPaged({ args: [], pageSize: 500, startKey });
    for (const [key, value] of page) {
      const netuid = key.args[1].toNumber();
      if (allowed.has(netuid)) totals.set(netuid, (totals.get(netuid) ?? 0n) + toBigInt(value));
    }
    if (page.length < 500) return totals;
    const nextKey = page.at(-1)[0].toHex();
    assert.notEqual(nextKey, startKey, "storage pagination did not advance");
    startKey = nextKey;
  }
}

function singleMap(entries) {
  return new Map(entries.map(([key, value]) => [key.args[0].toNumber(), toBigInt(value)]));
}

function compareAccounting(before, after, netuid) {
  const left = before.rows.get(netuid);
  const right = after.rows.get(netuid);
  return {
    netuid,
    epochs: (after.epochs.get(netuid) ?? 0n) - (before.epochs.get(netuid) ?? 0n),
    discrepancyBefore: left.discrepancy,
    discrepancyAfter: right.discrepancy,
    discrepancyChange: right.discrepancy - left.discrepancy,
    actualChange: right.actual - left.actual,
    alphaOutChange: right.alphaOut - left.alphaOut,
    burnedChange: right.burned - left.burned,
    pendingChange: right.pending - left.pending,
    protocolChange: right.protocol - left.protocol,
  };
}

function compareMarkers(before, after) {
  const names = [...new Set([...before.keys(), ...after.keys()])].sort();
  return names.filter((name) => before.get(name) !== after.get(name)).map((name) => ({
    name,
    before: before.get(name),
    after: after.get(name),
  }));
}

function renderReport(snapshot) {
  return `# Runtime 423 upgrade-boundary verification\n\n` +
    `Generated: ${new Date().toISOString()}\n\n` +
    `## Result\n\n` +
    `The patched historical runtime activated as local runtime 448 without changing any ` +
    `\`HasMigrationRun\` marker. Across ${snapshot.noEpochRows.length} subnets that did not execute ` +
    `an epoch in the activation block, the largest discrepancy movement was ` +
    `${formatSignedAlpha(snapshot.maxNoEpochMovement.discrepancyChange)} α on subnet ` +
    `${snapshot.maxNoEpochMovement.netuid}.\n\n` +
    `- Candidate WASM SHA-256: \`${snapshot.wasmSha256}\`\n` +
    `- \`setCode\` finalized in: \`${snapshot.inclusionHash}\`\n` +
    `- Runtime boundary: block ${snapshot.before.height} (447) → block ${snapshot.after.height} (448)\n` +
    `- Migration-marker changes: ${snapshot.markerChanges.length}\n\n` +
    `## Accounting movement at activation\n\n` +
    `| Netuid | Epochs | Discrepancy before α | Discrepancy after α | Discrepancy Δ α | Actual stake Δ α | SubnetAlphaOut Δ α | Burned Δ α | Pending Δ α | Protocol Δ α |\n` +
    `|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n` +
    snapshot.rows.map((row) =>
      `| ${row.netuid} | ${row.epochs} | ${formatSignedAlpha(row.discrepancyBefore)} | ` +
      `${formatSignedAlpha(row.discrepancyAfter)} | ${formatSignedAlpha(row.discrepancyChange)} | ` +
      `${formatSignedAlpha(row.actualChange)} | ${formatSignedAlpha(row.alphaOutChange)} | ` +
      `${formatSignedAlpha(row.burnedChange)} | ${formatSignedAlpha(row.pendingChange)} | ` +
      `${formatSignedAlpha(row.protocolChange)} |\n`,
    ).join("");
}

function formatSignedAlpha(raw) {
  const value = BigInt(raw);
  const absolute = abs(value);
  const whole = absolute / 1_000_000_000n;
  const fraction = (absolute % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  return `${value > 0n ? "+" : value < 0n ? "-" : ""}` +
    `${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
}

function toBigInt(value) {
  return typeof value.toBigInt === "function" ? value.toBigInt() : BigInt(value.toString());
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function abs(value) {
  return value < 0n ? -value : value;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
