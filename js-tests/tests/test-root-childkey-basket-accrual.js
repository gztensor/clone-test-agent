import assert from "node:assert/strict";
import { randomInt } from "node:crypto";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.ROOT_CHILDKEY_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const NETUID = 1;
const ROOT_NETUID = 0;
const RAO_PER_TAO = 1_000_000_000n;
const ROOT_STAKE = 1_100n * RAO_PER_TAO;
const TEST_BALANCE = 2_000n * RAO_PER_TAO;
const U64_MAX = 18_446_744_073_709_551_615n;
const FAST_TEMPO = 1;
const MAX_ACTIVATION_BLOCKS = Number(process.env.MAX_ACTIVATION_BLOCKS ?? 20);
const MAX_ACCRUAL_BLOCKS = Number(process.env.MAX_ACCRUAL_BLOCKS ?? 100);
const TX_TIMEOUT_MS = Number(process.env.TX_TIMEOUT_MS ?? 180_000);

const keyring = new Keyring({ type: "sr25519" });
const alice = keyring.addFromUri("//Alice");
const rootColdkey = keyring.addFromUri(`//RootChildkeyBasket//${RUN_ID}//coldkey`);
const rootHotkey = keyring.addFromUri(`//RootChildkeyBasket//${RUN_ID}//hotkey`);
const LOG_FILE = `test-root-childkey-basket-accrual-${RUN_ID}.log`;
const logger = createTempLogger(LOG_FILE);
logger.captureConsole();

let api;
let originalTempo;
let originalChildkeyCooldown;
let tempoChanged = false;
let cooldownChanged = false;
let lastObservedFinalizedBlock = -1n;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, { log: console.log });

  try {
    const startHeader = await api.rpc.chain.getHeader();
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const finalizedHeader = await api.rpc.chain.getHeader(await api.rpc.chain.getFinalizedHead());
    lastObservedFinalizedBlock = finalizedHeader.number.toBigInt();
    console.log("chain:", (await api.rpc.system.chain()).toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("start block:", startHeader.number.toString());
    console.log("run id:", RUN_ID);
    console.log("log file:", LOG_FILE);
    console.log("root coldkey:", rootColdkey.address);
    console.log("root hotkey:", rootHotkey.address);

    assertMetadataAvailable();
    await assertAliceIsSudo();
    await assertBasketMigrationComplete();

    originalTempo = (await api.query.subtensorModule.tempo(NETUID)).toNumber();
    originalChildkeyCooldown = (await api.query.subtensorModule.pendingChildKeyCooldown()).toBigInt();
    console.log(
      "original subnet settings:",
      `tempo=${originalTempo}`,
      `pending_childkey_cooldown=${originalChildkeyCooldown}`
    );

    const selectedChild = await selectRandomActiveValidator();
    console.log(
      "selected subnet 1 validator:",
      `uid=${selectedChild.uid}`,
      `hotkey=${selectedChild.hotkey}`,
      `dividends=${selectedChild.dividends}`
    );

    await fund(rootColdkey.address, TEST_BALANCE);
    await submitAndWait(
      rootColdkey,
      api.tx.subtensorModule.rootRegister(rootHotkey.address),
      "register root validator"
    );
    await submitAndWait(
      rootColdkey,
      api.tx.subtensorModule.addStakeLimit(rootHotkey.address, ROOT_NETUID, ROOT_STAKE, U64_MAX, false),
      "stake 1100 TAO on root hotkey"
    );

    const rootUid = (await api.query.subtensorModule.uids(ROOT_NETUID, rootHotkey.address)).unwrap().toNumber();
    const actualRootStake = (
      await api.query.subtensorModule.totalHotkeyAlpha(rootHotkey.address, ROOT_NETUID)
    ).toBigInt();
    console.log("root validator registered:", `uid=${rootUid}`, `stake_rao=${actualRootStake}`);
    assert.equal(actualRootStake, ROOT_STAKE, "new root validator does not have exactly 1100 TAO stake");

    const beforeAssignment = await readBasketRuntimeState();
    console.log("basket before child assignment:", formatBasketState(beforeAssignment));
    assert.equal(beforeAssignment.owed, 0n, "fresh root coldkey unexpectedly has basket owed");
    assert.equal(beforeAssignment.positions.length, 0, "fresh root coldkey unexpectedly has basket positions");

    await setChildkeyCooldown(0n);
    cooldownChanged = true;
    await submitAndWait(
      rootColdkey,
      api.tx.subtensorModule.setChildren(rootHotkey.address, NETUID, [[U64_MAX, selectedChild.hotkey]]),
      "assign all root stake to subnet 1 childkey"
    );
    console.log("childkey scheduled:", `proportion=${U64_MAX}`, `child=${selectedChild.hotkey}`);

    const scheduledEpoch = await subnetEpochIndex();
    await setSubnetTempo(FAST_TEMPO);
    tempoChanged = true;
    console.log("waiting for childkey activation epoch:", `epoch_index=${scheduledEpoch}`);
    const activation = await waitForChildActivation(selectedChild.hotkey, scheduledEpoch);
    console.log(
      "childkey activated:",
      `block=${activation.block}`,
      `epoch_index=${activation.epochIndex}`,
      `child=${selectedChild.hotkey}`
    );

    const baseline = await readBasketRuntimeState();
    console.log("basket after activation epoch (earning baseline):", formatBasketState(baseline));

    const earningEpoch = await waitForNextEpoch(activation.epochIndex, MAX_ACCRUAL_BLOCKS);
    console.log(
      "earning epoch observed:",
      `block=${earningEpoch.block}`,
      `epoch_index=${earningEpoch.epochIndex}`
    );

    const accrued = await waitForBasketAccrual(baseline.owed, rootHotkey.address, earningEpoch.epochIndex);
    console.log("basket after earning epoch:", formatBasketState(accrued));
    console.log(
      "experiment result:",
      `owed_before_rao=${baseline.owed}`,
      `owed_after_rao=${accrued.owed}`,
      `owed_delta_rao=${accrued.owed - baseline.owed}`,
      `positions=${accrued.positions.length}`
    );

    assert.ok(accrued.owed > baseline.owed, "root basket owed did not increase after the earning epoch");
    assert.ok(accrued.positions.length > 0, "get_root_basket_positions returned no positions");
    const rootPosition = accrued.positions.find((position) => position.hotkey === rootHotkey.address);
    assert.ok(rootPosition, "get_root_basket_positions omitted the new root validator hotkey");
    assert.ok(rootPosition.shares > 0n, "new root validator basket position has zero owed shares");
    assert.ok(rootPosition.payout > 0n, "new root validator basket position has zero payout");
    assert.equal(
      accrued.owed,
      accrued.positions.reduce((sum, position) => sum + position.payout, 0n),
      "get_root_basket_owed differs from the sum of get_root_basket_positions payouts"
    );
    assert.deepEqual(
      accrued.positions,
      accrued.rpcPositions,
      "runtime API positions differ from betaBasket_getStakerPositions"
    );
    assert.equal(accrued.owed, accrued.rpcOwed, "runtime API owed differs from betaBasket_getStakerOwed");

    console.log("root childkey beta-basket accrual test: passed");
  } finally {
    await restoreSubnetSettings();
    await api?.disconnect();
    await logger.flush();
  }
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});

function assertMetadataAvailable() {
  const missing = [
    ["Sudo.sudo", api.tx.sudo?.sudo],
    ["System.setStorage", api.tx.system?.setStorage],
    ["Balances.forceSetBalance", api.tx.balances?.forceSetBalance],
    ["SubtensorModule.setPendingChildkeyCooldown", api.tx.subtensorModule?.setPendingChildkeyCooldown],
    ["SubtensorModule.addStakeLimit", api.tx.subtensorModule?.addStakeLimit],
    ["SubtensorModule.rootRegister", api.tx.subtensorModule?.rootRegister],
    ["SubtensorModule.setChildren", api.tx.subtensorModule?.setChildren],
    ["SubtensorModule.HasMigrationRun", api.query.subtensorModule?.hasMigrationRun],
    ["SubtensorModule.PendingChildKeyCooldown", api.query.subtensorModule?.pendingChildKeyCooldown],
    ["SubtensorModule.ChildKeys", api.query.subtensorModule?.childKeys],
    ["SubtensorModule.SubnetEpochIndex", api.query.subtensorModule?.subnetEpochIndex],
    ["SubtensorModule.ValidatorPermit", api.query.subtensorModule?.validatorPermit],
    ["SubtensorModule.Dividends", api.query.subtensorModule?.dividends],
    ["SubtensorModule.Keys", api.query.subtensorModule?.keys],
    ["SubtensorModule.Uids", api.query.subtensorModule?.uids],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["raw RPC provider", api._rpcCore?.provider],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `missing metadata: ${missing.map(([name]) => name).join(", ")}`);
}

async function assertAliceIsSudo() {
  const sudoKey = await api.query.sudo.key();
  assert.equal(sudoKey.toString(), alice.address, `Alice is not sudo; sudo key is ${sudoKey.toString()}`);
}

async function assertBasketMigrationComplete() {
  const entries = await api.query.subtensorModule.hasMigrationRun.entries();
  const migration = entries.find(([key]) => key.args[0].toUtf8() === "migrate_seed_beta_basket_v2");
  assert.ok(migration?.[1].isTrue, "migrate_seed_beta_basket_v2 has not completed");
  console.log("basket migration complete: migrate_seed_beta_basket_v2=true");
}

async function selectRandomActiveValidator() {
  const [permits, dividends] = await Promise.all([
    api.query.subtensorModule.validatorPermit(NETUID),
    api.query.subtensorModule.dividends(NETUID),
  ]);
  const candidates = [];

  for (let uid = 0; uid < permits.length; uid++) {
    if (!permits[uid].isTrue || !dividends[uid] || dividends[uid].toBigInt() === 0n) continue;
    const hotkey = (await api.query.subtensorModule.keys(NETUID, uid)).toString();
    candidates.push({ uid, hotkey, dividends: dividends[uid].toBigInt() });
  }

  assert.ok(candidates.length > 0, "subnet 1 has no active validator-permit hotkeys with dividends");
  console.log("eligible subnet 1 validators:", candidates.length);
  return candidates[randomInt(candidates.length)];
}

async function fund(address, amount) {
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.balances.forceSetBalance(address, amount)),
    `fund experiment coldkey ${address}`
  );
}

async function setChildkeyCooldown(cooldown) {
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.subtensorModule.setPendingChildkeyCooldown(cooldown)),
    `set pending childkey cooldown to ${cooldown}`
  );
}

async function setSubnetTempo(tempo) {
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(
      api.tx.system.setStorage([
        [api.query.subtensorModule.tempo.key(NETUID), storageValueHex("u16", tempo)],
      ])
    ),
    `set subnet 1 tempo to ${tempo}`
  );
}

async function restoreSubnetSettings() {
  if (!api) return;

  try {
    if (tempoChanged && originalTempo !== undefined) {
      await setSubnetTempo(originalTempo);
      console.log("restored subnet 1 tempo:", originalTempo);
    }
    if (cooldownChanged && originalChildkeyCooldown !== undefined) {
      await setChildkeyCooldown(originalChildkeyCooldown);
      console.log("restored pending childkey cooldown:", originalChildkeyCooldown);
    }
  } catch (error) {
    console.log("failed to restore temporary subnet settings:", error);
  }
}

async function waitForChildActivation(childHotkey, epochBefore) {
  for (let blocks = 1; blocks <= MAX_ACTIVATION_BLOCKS; blocks++) {
    const header = await waitForFinalizedBlock();
    const [epochIndex, children] = await Promise.all([
      subnetEpochIndex(),
      api.query.subtensorModule.childKeys(rootHotkey.address, NETUID),
    ]);
    const active = Array.from(children).some(
      ([proportion, child]) => proportion.toBigInt() === U64_MAX && child.toString() === childHotkey
    );
    if (active && epochIndex > epochBefore) {
      return { block: header.number.toNumber(), epochIndex };
    }
    console.log(
      "waiting for childkey activation:",
      `block=${header.number}`,
      `epoch_index=${epochIndex}`,
      `active=${active}`
    );
  }
  throw new Error(`childkey did not activate within ${MAX_ACTIVATION_BLOCKS} finalized blocks`);
}

async function waitForNextEpoch(previousEpoch, maxBlocks) {
  for (let blocks = 1; blocks <= maxBlocks; blocks++) {
    const header = await waitForFinalizedBlock();
    const epochIndex = await subnetEpochIndex();
    if (epochIndex > previousEpoch) {
      return { block: header.number.toNumber(), epochIndex };
    }
  }
  throw new Error(`subnet 1 epoch did not advance within ${maxBlocks} finalized blocks`);
}

async function waitForBasketAccrual(previousOwed, expectedHotkey, earningEpochIndex) {
  for (let blocks = 0; blocks <= MAX_ACCRUAL_BLOCKS; blocks++) {
    const state = await readBasketRuntimeState();
    const found = state.positions.some(
      (position) => position.hotkey === expectedHotkey && position.shares > 0n && position.payout > 0n
    );
    if (state.owed > previousOwed && found) return state;

    if (blocks === MAX_ACCRUAL_BLOCKS) break;
    if (blocks % 10 === 0) {
      console.log(
        "waiting for queued basket deposit flush:",
        `earning_epoch=${earningEpochIndex}`,
        `waited_blocks=${blocks}`,
        `owed=${state.owed}`,
        `positions=${state.positions.length}`
      );
    }
    await waitForFinalizedBlock();
  }
  throw new Error(`root basket did not accrue within ${MAX_ACCRUAL_BLOCKS} blocks after earning epoch`);
}

async function subnetEpochIndex() {
  return (await api.query.subtensorModule.subnetEpochIndex(NETUID)).toBigInt();
}

async function waitForFinalizedBlock() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const header = await api.rpc.chain.getHeader(await api.rpc.chain.getFinalizedHead());
    const block = header.number.toBigInt();
    if (block > lastObservedFinalizedBlock) {
      lastObservedFinalizedBlock = block;
      return header;
    }
    await sleep(500);
  }
  throw new Error("timed out waiting for a newer finalized block");
}

async function readBasketRuntimeState() {
  const header = await api.rpc.chain.getHeader();
  const blockHash = header.hash.toHex();
  const argument = api.createType("AccountId32", rootColdkey.address).toHex();
  const [owedRaw, positionsRaw, rpcOwedRaw, rpcPositionsRaw] = await Promise.all([
    api.rpc.state.call("BetaBasketRuntimeApi_get_root_basket_owed", argument, blockHash),
    api.rpc.state.call("BetaBasketRuntimeApi_get_root_basket_positions", argument, blockHash),
    api._rpcCore.provider.send("betaBasket_getStakerOwed", [rootColdkey.address, blockHash]),
    api._rpcCore.provider.send("betaBasket_getStakerPositions", [rootColdkey.address, blockHash]),
  ]);

  return {
    block: header.number.toBigInt(),
    blockHash,
    owed: api.createType("u64", owedRaw).toBigInt(),
    positions: decodePositions(positionsRaw),
    rpcOwed: decodeRpcU64(rpcOwedRaw),
    rpcPositions: decodePositions(rpcBytes(rpcPositionsRaw)),
  };
}

function decodePositions(encoded) {
  return Array.from(api.createType("Vec<(AccountId32,u64,u64)>", encoded)).map(
    ([hotkey, shares, payout]) => ({
      hotkey: hotkey.toString(),
      shares: shares.toBigInt(),
      payout: payout.toBigInt(),
    })
  );
}

function decodeRpcU64(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string" && !value.startsWith("0x")) return BigInt(value);
  return api.createType("u64", typeof value === "string" ? value : Uint8Array.from(value)).toBigInt();
}

function rpcBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (Array.isArray(value)) return Uint8Array.from(value);
  if (typeof value === "string" && value.startsWith("0x")) return value;
  return Uint8Array.from(value);
}

function formatBasketState(state) {
  const positions = state.positions
    .map((position) => `${position.hotkey}:shares=${position.shares},payout=${position.payout}`)
    .join(";");
  return [
    `block=${state.block}`,
    `hash=${state.blockHash}`,
    `owed_rao=${state.owed}`,
    `positions=[${positions}]`,
    `rpc_owed_rao=${state.rpcOwed}`,
    `rpc_positions=${state.rpcPositions.length}`,
  ].join(" ");
}

async function submitAndWait(signer, txOrPromise, label) {
  const tx = await txOrPromise;
  console.log("submit:", label);
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let settled = false;
    const timeout = setTimeout(() => finish(reject, new Error(`${label} timed out after ${TX_TIMEOUT_MS}ms`)), TX_TIMEOUT_MS);

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribe?.();
      fn(value);
    };

    tx.signAndSend(signer, ({ status, events, dispatchError }) => {
      if (dispatchError) {
        finish(reject, new Error(`${label} failed: ${formatDispatchError(dispatchError)}`));
        return;
      }

      if (status.isInBlock || status.isFinalized) {
        for (const { event } of events) {
          if (event.section === "system" && event.method === "ExtrinsicFailed") {
            finish(reject, new Error(`${label} failed: ${formatDispatchError(event.data[0])}`));
            return;
          }
          if (event.section === "sudo" && event.method === "Sudid" && event.data[0].isErr) {
            finish(reject, new Error(`${label} sudo failed: ${formatDispatchError(event.data[0].asErr)}`));
            return;
          }
        }
      }

      if (status.isFinalized) {
        console.log("finalized:", label, status.asFinalized.toString());
        finish(resolve, { blockHash: status.asFinalized.toString(), events });
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => finish(reject, error));
  });
}

function formatDispatchError(error) {
  if (!error.isModule) return error.toString();
  const decoded = api.registry.findMetaError(error.asModule);
  return `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
}

function storageValueHex(type, value) {
  return u8aToHex(api.createType(type, value).toU8a());
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
