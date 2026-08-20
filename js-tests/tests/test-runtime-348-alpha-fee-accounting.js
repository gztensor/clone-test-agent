import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Keyring } from "@polkadot/api";
import { xxhashAsHex } from "@polkadot/util-crypto";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const NETUID = 1;
const TAO = 1_000_000_000n;
const FUNDING = 2n * TAO;
const STAKE_TAO = TAO;
const FAILING_UNSTAKE_ALPHA = 100_000_000n;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, "..", "runtime-348-alpha-fee-accounting.md");
const logger = createTempLogger("runtime-348-alpha-fee-accounting.log");
logger.captureConsole();

async function main() {
  await logger.start();
  const api = await connectApi(WS_ENDPOINT, {
    log: (message) => console.log(message),
    timeoutMs: 120_000,
    providerTimeoutMs: 300_000,
  });

  try {
    const runtime = await api.rpc.state.getRuntimeVersion();
    assert.equal(runtime.specVersion.toNumber(), 448, "runtime-348 candidate is not active");

    const keyring = new Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice");
    const probe = keyring.addFromUri("//Runtime348AlphaFeeFailedCallFinal");
    assert.equal((await api.query.sudo.key()).toString(), alice.address, "Alice is not sudo");
    const existentialDeposit = toBigInt(api.consts.balances.existentialDeposit);

    const hotkeyEntries = await api.query.subtensorModule.keys.entries(NETUID);
    assert.ok(hotkeyEntries.length > 0, `subnet ${NETUID} has no hotkeys`);
    const hotkey = hotkeyEntries[0][1].toString();
    console.log("alpha-fee coldkey:", probe.address);
    console.log("stake hotkey:", hotkey);

    const result = await runFailedCallScenario(api, alice, probe, hotkey, existentialDeposit);
    const actualFeeEffect = result.actualChange - result.baselineActualChange;
    const calculatedFeeEffect = result.calculatedChange - result.baselineCalculatedChange;
    const discrepancyFeeEffect = result.discrepancyChange - result.baselineDiscrepancyChange;
    const unaccountedAlpha = -actualFeeEffect;
    console.log("failed-call actual change rao:", result.actualChange.toString());
    console.log("failed-call calculated change rao:", result.calculatedChange.toString());
    console.log("failed-call discrepancy change rao:", result.discrepancyChange.toString());
    console.log("failed-call alphaOut change rao:", (result.after.alphaOut - result.before.alphaOut).toString());
    console.log("failed-call pending change rao:", (result.after.pending - result.before.pending).toString());
    console.log("failed-call protocol change rao:", (result.after.protocol - result.before.protocol).toString());
    console.log("baseline actual change rao:", result.baselineActualChange.toString());
    console.log("baseline calculated change rao:", result.baselineCalculatedChange.toString());
    console.log("baseline discrepancy change rao:", result.baselineDiscrepancyChange.toString());
    assert.equal(result.baselineActualChange, 0n, "empty baseline block changed actual stake");
    assert.ok(actualFeeEffect < 0n, "failed call did not remove actual stake as a fee");
    assert.ok(unaccountedAlpha > 3n, "fee effect did not exceed ordinary rounding");

    fs.writeFileSync(REPORT_PATH, renderReport({
      generatedAt: new Date().toISOString(),
      runtime: runtime.specVersion.toNumber(),
      hotkey,
      probe: probe.address,
      result,
      actualFeeEffect,
      calculatedFeeEffect,
      discrepancyFeeEffect,
      unaccountedAlpha,
    }));

    console.log("expected dispatch error:", result.dispatchError);
    console.log("actual stake change rao:", result.actualChange.toString());
    console.log("calculated stake change rao:", result.calculatedChange.toString());
    console.log("discrepancy change rao:", result.discrepancyChange.toString());
    console.log("baseline discrepancy change rao:", result.baselineDiscrepancyChange.toString());
    console.log("source-attributed fee effect rao:", actualFeeEffect.toString());
    console.log("unaccounted alpha fee rao:", unaccountedAlpha.toString());
    console.log("report:", REPORT_PATH);
    console.log("runtime-348 alpha-fee accounting reproduction: complete");
  } finally {
    await api.disconnect();
  }
}

async function runFailedCallScenario(api, alice, signer, hotkey, existentialDeposit) {
  const label = "alpha-paid failed call";
  await submitAndWait(
    api,
    alice,
    api.tx.sudo.sudo(api.tx.balances.forceSetBalance(signer.address, FUNDING)),
    `${label}: fund signer`,
  );
  await submitAndWait(
    api,
    signer,
    api.tx.subtensorModule.addStake(hotkey, NETUID, STAKE_TAO),
    `${label}: create alpha stake`,
  );
  await submitAndWait(
    api,
    alice,
    api.tx.sudo.sudo(api.tx.balances.forceSetBalance(signer.address, existentialDeposit)),
    `${label}: reduce TAO to existential deposit`,
  );
  assert.equal(
    toBigInt((await api.query.system.account(signer.address)).data.free),
    existentialDeposit,
    `${label}: signer is not at existential deposit`,
  );

  const tx = api.tx.subtensorModule.removeStake(hotkey, NETUID, FAILING_UNSTAKE_ALPHA);
  const paymentInfo = await tx.paymentInfo(signer);
  const failure = await submitAndWaitExpectedFailure(api, signer, tx, `${label}: remove stake`);
  assert.match(failure.dispatchError, /subtensorModule\.AmountTooLow/);
  const inclusionHash = failure.hash;
  const afterHeader = await api.rpc.chain.getHeader(inclusionHash);
  const afterHeight = afterHeader.number.toNumber();
  const beforeHeight = afterHeight - 1;
  const baselineHeight = beforeHeight - 1;
  const baselineHash = (await api.rpc.chain.getBlockHash(baselineHeight)).toString();
  const beforeHash = (await api.rpc.chain.getBlockHash(beforeHeight)).toString();
  const baseline = await readSubnetSnapshot(api, baselineHash, hotkey);
  const before = await readSubnetSnapshot(api, beforeHash, hotkey);
  const after = await readSubnetSnapshot(api, inclusionHash, hotkey);
  assert.equal(
    after.epochMarker,
    before.epochMarker,
    `${label}: subnet epoch executed in transaction block; rerun from a fresh clone`,
  );
  assert.equal(
    before.epochMarker,
    baseline.epochMarker,
    `${label}: subnet epoch executed in baseline block; rerun from a fresh clone`,
  );
  assert.equal(after.burned, before.burned, `${label}: AlphaBurned changed`);
  const actualChange = after.actual - before.actual;
  const calculatedChange = after.calculated - before.calculated;
  const discrepancyChange = after.discrepancy - before.discrepancy;
  const hotkeyChange = after.hotkeyTotal - before.hotkeyTotal;
  const baselineActualChange = before.actual - baseline.actual;
  const baselineCalculatedChange = before.calculated - baseline.calculated;
  const baselineDiscrepancyChange = before.discrepancy - baseline.discrepancy;
  assert.equal(hotkeyChange, actualChange, `${label}: another hotkey changed stake`);
  console.log(`${label} blocks:`, `${beforeHeight}->${afterHeight}`);
  console.log(`${label} quoted fee rao:`, paymentInfo.partialFee.toString());
  return {
    dispatchError: failure.dispatchError,
    baselineHeight,
    baselineHash,
    baseline,
    paymentFee: toBigInt(paymentInfo.partialFee),
    beforeHeight,
    beforeHash,
    afterHeight,
    afterHash: inclusionHash,
    before,
    after,
    actualChange,
    calculatedChange,
    discrepancyChange,
    hotkeyChange,
    baselineActualChange,
    baselineCalculatedChange,
    baselineDiscrepancyChange,
  };
}

async function readSubnetSnapshot(api, hash, hotkey) {
  const apiAt = await api.at(hash);
  const [stakeEntries, hotkeyTotal, alphaOut, burned, pendingServer, pendingValidator,
    pendingRoot, pendingOwner, epochMarker, protocol] = await Promise.all([
    apiAt.query.subtensorModule.totalHotkeyAlpha.entries(),
    apiAt.query.subtensorModule.totalHotkeyAlpha(hotkey, NETUID),
    apiAt.query.subtensorModule.subnetAlphaOut(NETUID),
    apiAt.query.alphaAssets.alphaBurned(NETUID),
    apiAt.query.subtensorModule.pendingServerEmission(NETUID),
    apiAt.query.subtensorModule.pendingValidatorEmission(NETUID),
    apiAt.query.subtensorModule.pendingRootAlphaDivs(NETUID),
    apiAt.query.subtensorModule.pendingOwnerCut(NETUID),
    apiAt.query.subtensorModule.lastMechansimStepBlock(NETUID),
    readRawIdentityNetuidU64(api, hash, "SubnetProtocolAlpha", NETUID),
  ]);
  const actual = stakeEntries.reduce((total, [key, value]) =>
    key.args[1].toNumber() === NETUID ? total + toBigInt(value) : total,
  0n);
  const pending = toBigInt(pendingServer) + toBigInt(pendingValidator) +
    toBigInt(pendingRoot) + toBigInt(pendingOwner);
  const alphaOutValue = toBigInt(alphaOut);
  const burnedValue = toBigInt(burned);
  const protocolValue = toBigInt(protocol);
  const calculated = alphaOutValue - burnedValue - pending - protocolValue;
  return {
    actual,
    calculated,
    discrepancy: actual - calculated,
    hotkeyTotal: toBigInt(hotkeyTotal),
    alphaOut: alphaOutValue,
    burned: burnedValue,
    pending,
    protocol: protocolValue,
    epochMarker: toBigInt(epochMarker),
  };
}

async function readRawIdentityNetuidU64(api, hash, storageName, netuid) {
  const prefix = xxhashAsHex("SubtensorModule", 128) +
    xxhashAsHex(storageName, 128).slice(2);
  const netuidHex = Buffer.from([netuid & 0xff, (netuid >> 8) & 0xff]).toString("hex");
  const value = await api.rpc.state.getStorage(`${prefix}${netuidHex}`, hash);
  if (value.isNone) return 0n;
  const bytes = Buffer.from(value.unwrap().toHex().slice(2), "hex");
  assert.equal(bytes.length, 8, `${storageName} unexpected u64 length`);
  return bytes.readBigUInt64LE();
}

async function submitAndWait(api, signer, tx, label) {
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
        finish(reject, new Error(`${label}: ${formatDispatchError(api, dispatchError)}`));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        const failed = events.find(({ event }) =>
          event.section === "system" && event.method === "ExtrinsicFailed"
        );
        if (failed) {
          finish(reject, new Error(`${label}: ${formatDispatchError(api, failed.event.data[0])}`));
          return;
        }
      }
      if (status.isFinalized) finish(resolve, status.asFinalized.toString());
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch((error) => finish(reject, error));
  });
}

async function submitAndWaitExpectedFailure(api, signer, tx, label) {
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let settled = false;
    let observedError;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      unsubscribe?.();
      fn(value);
    };
    tx.signAndSend(signer, ({ status, dispatchError, events }) => {
      if (dispatchError) observedError = formatDispatchError(api, dispatchError);
      const failed = events.find(({ event }) =>
        event.section === "system" && event.method === "ExtrinsicFailed"
      );
      if (failed) observedError = formatDispatchError(api, failed.event.data[0]);
      if (status.isFinalized) {
        if (!observedError) {
          finish(reject, new Error(`${label}: expected dispatch failure, but call succeeded`));
          return;
        }
        finish(resolve, { hash: status.asFinalized.toString(), dispatchError: observedError });
      }
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

function renderReport(result) {
  const value = result.result;
  return `# Runtime 348 alpha-paid transaction-fee accounting\n\n` +
    `Generated: ${result.generatedAt}\n\n` +
    `## Result\n\n` +
    `Runtime 348 reproduces an unaccounted alpha burn when a transaction cannot pay its ` +
    `fee in TAO. The deliberately below-minimum \`removeStake\` call failed with ` +
    `\`${value.dispatchError}\`, so none of its stake-removal or swap logic executed. ` +
    `The immediately preceding empty block changed actual stake by exactly zero. In the failed ` +
    `transaction block, pre-dispatch fee charging removed ` +
    `**${formatAlpha(-result.actualFeeEffect)} α** from actual stake and did not change ` +
    `\`AlphaBurned\`. Because the failed dispatch never entered stake-removal/swap logic and ` +
    `the fee handler writes only the stake pool, this is an equal unaccounted accounting effect ` +
    `of **${formatSignedAlpha(result.actualFeeEffect)} α**.\n\n` +
    `This moves \`actual - calculated\` in the opposite direction ` +
    `from the broad positive current residual, so this defect cannot by itself explain the ` +
    `current 1–2% discrepancy. It can contribute to negative subnet outliers.\n\n` +
    `| Interval | Exact blocks | Actual stake Δ α | Calculated stake Δ α | Signed discrepancy Δ α | AlphaBurned Δ α |\n` +
    `|---|---|---:|---:|---:|---:|\n` +
    `| Failed alpha-paid call | ${value.beforeHeight}→${value.afterHeight} | ` +
    `${formatSignedAlpha(value.actualChange)} | ${formatSignedAlpha(value.calculatedChange)} | ` +
    `${formatSignedAlpha(value.discrepancyChange)} | ` +
    `${formatSignedAlpha(value.after.burned - value.before.burned)} |\n\n` +
    `Probe: \`${result.probe}\`; hotkey: \`${result.hotkey}\`; quoted fee: ` +
    `${formatAlpha(value.paymentFee)} TAO. No subnet-${NETUID} epoch executed. Exact ` +
    `transaction comparison hashes: \`${value.beforeHash}\` → \`${value.afterHash}\`. ` +
    `The later-named \`SubnetProtocolAlpha\` value is read from its raw storage key and ` +
    `included in calculated liabilities. \`PendingBasketDeposits\` is unknown to runtime 348 ` +
    `and cannot change in this block, so it cancels from the adjacent-block movement.\n`;
}

function toBigInt(value) {
  if (typeof value?.toBigInt === "function") return value.toBigInt();
  return BigInt(value.toString());
}

function formatAlpha(raw) {
  const value = BigInt(raw);
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / TAO;
  const fraction = (absolute % TAO).toString().padStart(9, "0").replace(/0+$/, "");
  return `${sign}${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
}

function formatSignedAlpha(raw) {
  const value = BigInt(raw);
  return `${value > 0n ? "+" : ""}${formatAlpha(value)}`;
}

function abs(value) {
  return value < 0n ? -value : value;
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
