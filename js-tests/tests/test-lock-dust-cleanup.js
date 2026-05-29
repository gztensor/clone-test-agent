import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.LOCK_DUST_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const FUND_SOURCE_URI = process.env.LOCK_DUST_FUND_SOURCE_URI ?? "//Alice";
const TEST_COLDKEY_URI = process.env.LOCK_DUST_COLDKEY_URI ?? `//LockDustCleanup//${RUN_ID}//coldkey`;
const SOURCE_FUND_AMOUNT = BigInt(process.env.LOCK_DUST_SOURCE_FUND_AMOUNT ?? "100000000000");
const STAKE_AMOUNT = BigInt(process.env.LOCK_DUST_STAKE_AMOUNT ?? "10000000000");
const DUST_LOCK_AMOUNT = BigInt(process.env.LOCK_DUST_LOCK_AMOUNT ?? "101");
const FAST_DECAY_RATE = BigInt(process.env.LOCK_DUST_FAST_DECAY_RATE ?? "1");
const MIN_PRICE = 0n;

const keyring = new Keyring({ type: "sr25519" });
const fundSource = keyring.addFromUri(FUND_SOURCE_URI);
const testColdkey = keyring.addFromUri(TEST_COLDKEY_URI);
const logger = createTempLogger("test-lock-dust-cleanup.log");
logger.captureConsole();

let api;
let originalUnlockRate;
let originalMaturityRate;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, { log: console.log });

  try {
    const chain = await api.rpc.system.chain();
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const startHeader = await api.rpc.chain.getHeader();
    console.log("chain:", chain.toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("start block:", startHeader.number.toString());
    console.log("run id:", RUN_ID);
    console.log("test coldkey:", testColdkey.address);

    assertMetadataAvailable();

    originalUnlockRate = (await api.query.subtensorModule.unlockRate()).toBigInt();
    originalMaturityRate = (await api.query.subtensorModule.maturityRate()).toBigInt();
    console.log("original rates:", `unlock=${originalUnlockRate}`, `maturity=${originalMaturityRate}`);

    const { netuid, hotkey } = await findTestHotkey();
    const aggregateStorage = await aggregateStorageForLock(testColdkey.address, netuid, hotkey);
    console.log("test subnet:", netuid);
    console.log("test hotkey:", hotkey);
    console.log("test aggregate storage:", aggregateStorage);

    await fundAccount(testColdkey.address, SOURCE_FUND_AMOUNT, "test coldkey");
    await setLockRates(FAST_DECAY_RATE, FAST_DECAY_RATE, "set fast lock dust decay rates");

    const alphaAdded = await addStake(testColdkey, hotkey, netuid);
    assert.ok(alphaAdded > DUST_LOCK_AMOUNT, `addStake returned too little alpha: ${alphaAdded}`);
    console.log("alpha added:", alphaAdded.toString());

    await lockStake(testColdkey, hotkey, netuid, DUST_LOCK_AMOUNT);
    const lockAfterAdd = await requireLock(testColdkey.address, netuid, hotkey, "dust lock after add");
    const aggregateAfterAdd = await requireAggregateLock(
      aggregateStorage,
      netuid,
      hotkey,
      "aggregate dust lock after add"
    );
    assert.equal(lockAfterAdd.lockedMass, DUST_LOCK_AMOUNT, "lockStake should persist the small active lock");
    assert.equal(
      aggregateAfterAdd.lockedMass,
      DUST_LOCK_AMOUNT,
      `${aggregateStorage} should include the small active lock`
    );
    await assertLockingColdkeysContains(netuid, hotkey, testColdkey.address, "after lockStake");
    console.log("lock after add:", formatLock(lockAfterAdd));
    console.log("aggregate after add:", formatLock(aggregateAfterAdd));
    console.log("LockingColdkeys contains test coldkey after lockStake: ok");

    await waitForFinalizedBlocks(2);
    const unstakeAmount = alphaAdded / 4n;
    assert.ok(unstakeAmount > 0n, "not enough alpha to trigger unstake cleanup");
    const unstakeResult = await submitAndWait(
      testColdkey,
      api.tx.subtensorModule.removeStakeLimit(hotkey, netuid, unstakeAmount, MIN_PRICE, false),
      "removeStakeLimit to trigger lock roll-forward cleanup"
    );
    const alphaRemoved = assertStakeRemovedEvent(unstakeResult.events, hotkey, netuid);
    console.log("alpha unstaked:", alphaRemoved.toString());

    await assertNoLock(testColdkey.address, netuid, hotkey, "dust lock after unstake cleanup");
    await assertNoAggregateLock(aggregateStorage, netuid, hotkey, "aggregate dust lock after unstake cleanup");
    await assertLockingColdkeysDoesNotContain(netuid, hotkey, testColdkey.address, "after dust cleanup");
    console.log("Lock dust cleanup removed Lock, aggregate lock, and LockingColdkeys entry: ok");
  } finally {
    if (api && originalUnlockRate !== undefined && originalMaturityRate !== undefined) {
      await setLockRates(originalUnlockRate, originalMaturityRate, "restore original lock rates");
    }
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
    ["SubtensorModule.addStake", api.tx.subtensorModule?.addStake],
    ["SubtensorModule.lockStake", api.tx.subtensorModule?.lockStake],
    ["SubtensorModule.removeStakeLimit", api.tx.subtensorModule?.removeStakeLimit],
    ["SubtensorModule.Lock", api.query.subtensorModule?.lock],
    ["SubtensorModule.HotkeyLock", api.query.subtensorModule?.hotkeyLock],
    ["SubtensorModule.DecayingHotkeyLock", api.query.subtensorModule?.decayingHotkeyLock],
    ["SubtensorModule.OwnerLock", api.query.subtensorModule?.ownerLock],
    ["SubtensorModule.DecayingOwnerLock", api.query.subtensorModule?.decayingOwnerLock],
    ["SubtensorModule.DecayingLock", api.query.subtensorModule?.decayingLock],
    ["SubtensorModule.LockingColdkeys", api.query.subtensorModule?.lockingColdkeys],
    ["SubtensorModule.UnlockRate", api.query.subtensorModule?.unlockRate],
    ["SubtensorModule.MaturityRate", api.query.subtensorModule?.maturityRate],
    ["SubtensorModule.Keys", api.query.subtensorModule?.keys],
    ["SubtensorModule.SubnetOwnerHotkey", api.query.subtensorModule?.subnetOwnerHotkey],
    ["SubtensorModule.TransferToggle", api.query.subtensorModule?.transferToggle],
    ["Swap.PalSwapInitialized or Swap.SwapV3Initialized", initializedSubnetStorage()],
  ].filter(([, value]) => !value);

  assert.equal(
    missing.length,
    0,
    `${missing.map(([name]) => name).join(", ")} unavailable; run after upgrading the clone to the dust-lock runtime`
  );
}

async function findTestHotkey() {
  const initializedEntries = await initializedSubnetStorage().entries();
  const initializedNetuids = initializedEntries
    .filter(([, initialized]) => initialized.isTrue)
    .map(([key]) => key.args[0].toNumber())
    .sort((a, b) => a - b);

  for (const netuid of initializedNetuids) {
    const transferEnabled = await api.query.subtensorModule.transferToggle(netuid);
    if (!transferEnabled.isTrue) continue;

    const ownerHotkey = (await api.query.subtensorModule.subnetOwnerHotkey(netuid)).toString();
    const hotkeys = (await api.query.subtensorModule.keys.entries(netuid))
      .map(([, hotkey]) => hotkey.toString())
      .filter((hotkey, index, all) => hotkey && hotkey !== ownerHotkey && all.indexOf(hotkey) === index);
    for (const hotkey of hotkeys) {
      if (await hasNoDecayingHotkeyLock(netuid, hotkey)) {
        return { netuid, hotkey };
      }
    }
  }

  throw new Error("no initialized transfer-enabled subnet with a non-owner hotkey and no decaying hotkey lock found");
}

function initializedSubnetStorage() {
  return api.query.swap?.palSwapInitialized ?? api.query.swap?.swapV3Initialized;
}

async function fundAccount(address, amount, label) {
  await submitAndWait(
    fundSource,
    api.tx.sudo.sudo(api.tx.balances.forceSetBalance(address, amount)),
    `sudo fund ${label}`
  );
  const free = (await api.query.system.account(address)).data.free.toBigInt();
  assert.ok(free >= amount, `${label} funding failed: free=${free}`);
  console.log(`${label} funded:`, free.toString());
}

async function setLockRates(unlockRate, maturityRate, label) {
  const calls = [
    [api.query.subtensorModule.unlockRate.key(), u8aToHex(api.createType("u64", unlockRate).toU8a())],
    [api.query.subtensorModule.maturityRate.key(), u8aToHex(api.createType("u64", maturityRate).toU8a())],
  ];
  await submitAndWait(fundSource, api.tx.sudo.sudo(api.tx.system.setStorage(calls)), label);
  const storedUnlockRate = (await api.query.subtensorModule.unlockRate()).toBigInt();
  const storedMaturityRate = (await api.query.subtensorModule.maturityRate()).toBigInt();
  assert.equal(storedUnlockRate, unlockRate, "UnlockRate was not updated");
  assert.equal(storedMaturityRate, maturityRate, "MaturityRate was not updated");
  console.log("lock rates:", `unlock=${storedUnlockRate}`, `maturity=${storedMaturityRate}`);
}

async function addStake(signer, hotkey, netuid) {
  const result = await submitAndWait(
    signer,
    api.tx.subtensorModule.addStake(hotkey, netuid, STAKE_AMOUNT),
    "addStake for dust cleanup test"
  );
  return assertStakeAddedEvent(result.events, hotkey, netuid);
}

async function lockStake(signer, hotkey, netuid, amount) {
  const result = await submitAndWait(
    signer,
    api.tx.subtensorModule.lockStake(hotkey, netuid, amount),
    "lockStake dust amount"
  );
  assertEvent(result.events, "StakeLocked", ({ event }) => {
    const [, eventHotkey, eventNetuid, eventAmount] = event.data;
    return (
      eventHotkey.toString() === hotkey &&
      eventNetuid.toNumber() === netuid &&
      eventAmount.toBigInt() === amount
    );
  });
}

async function requireLock(coldkey, netuid, hotkey, label) {
  const maybeLock = await api.query.subtensorModule.lock(coldkey, netuid, hotkey);
  assert.ok(maybeLock.isSome, `${label}: expected Lock(${coldkey}, ${netuid}, ${hotkey}) to exist`);
  return decodeLockState(maybeLock.unwrap());
}

async function assertNoLock(coldkey, netuid, hotkey, label) {
  const maybeLock = await api.query.subtensorModule.lock(coldkey, netuid, hotkey);
  assert.ok(maybeLock.isNone, `${label}: unexpected Lock(${coldkey}, ${netuid}, ${hotkey}) exists`);
}

async function requireAggregateLock(storageName, netuid, hotkey, label) {
  const maybeLock = await queryAggregateLock(storageName, netuid, hotkey);
  assert.ok(maybeLock.isSome, `${label}: expected ${aggregateLabel(storageName, netuid, hotkey)} to exist`);
  return decodeLockState(maybeLock.unwrap());
}

async function assertNoAggregateLock(storageName, netuid, hotkey, label) {
  const maybeLock = await queryAggregateLock(storageName, netuid, hotkey);
  assert.ok(maybeLock.isNone, `${label}: unexpected ${aggregateLabel(storageName, netuid, hotkey)} exists`);
}

async function assertLockingColdkeysContains(netuid, hotkey, coldkey, label) {
  const coldkeys = await lockingColdkeys(netuid, hotkey);
  assert.ok(
    coldkeys.includes(coldkey),
    `${label}: expected LockingColdkeys(${netuid}, ${hotkey}) to contain ${coldkey}; got ${coldkeys.join(",")}`
  );
}

async function assertLockingColdkeysDoesNotContain(netuid, hotkey, coldkey, label) {
  const coldkeys = await lockingColdkeys(netuid, hotkey);
  assert.ok(
    !coldkeys.includes(coldkey),
    `${label}: expected LockingColdkeys(${netuid}, ${hotkey}) to omit ${coldkey}; got ${coldkeys.join(",")}`
  );
}

async function lockingColdkeys(netuid, hotkey) {
  return (await api.query.subtensorModule.lockingColdkeys(netuid, hotkey)).map((coldkey) => coldkey.toString());
}

async function aggregateStorageForLock(coldkey, netuid, hotkey) {
  const ownerHotkey = (await api.query.subtensorModule.subnetOwnerHotkey(netuid)).toString();
  const isOwnerLock = hotkey === ownerHotkey;
  const maybeDecayingLock = await api.query.subtensorModule.decayingLock(coldkey, netuid);
  const isPerpetual = maybeDecayingLock.isSome && maybeDecayingLock.unwrap().isFalse;

  if (isOwnerLock) {
    return isPerpetual ? "ownerLock" : "decayingOwnerLock";
  }
  return isPerpetual ? "hotkeyLock" : "decayingHotkeyLock";
}

async function hasNoDecayingHotkeyLock(netuid, hotkey) {
  return (await api.query.subtensorModule.decayingHotkeyLock(netuid, hotkey)).isNone;
}

function queryAggregateLock(storageName, netuid, hotkey) {
  if (storageName === "ownerLock" || storageName === "decayingOwnerLock") {
    return api.query.subtensorModule[storageName](netuid);
  }
  return api.query.subtensorModule[storageName](netuid, hotkey);
}

function aggregateLabel(storageName, netuid, hotkey) {
  if (storageName === "ownerLock" || storageName === "decayingOwnerLock") {
    return `${storageName}(${netuid})`;
  }
  return `${storageName}(${netuid}, ${hotkey})`;
}

function decodeLockState(lockState) {
  const lockedMass = structField(lockState, "lockedMass", "locked_mass").toBigInt();
  const conviction = structField(lockState, "conviction").toString();
  const lastUpdate = structField(lockState, "lastUpdate", "last_update").toBigInt();
  return { lockedMass, conviction, lastUpdate };
}

function structField(value, ...names) {
  for (const name of names) {
    if (value[name]) return value[name];
    const field = value.get?.(name);
    if (field) return field;
  }
  throw new Error(`could not decode field ${names.join("/")} from ${value.toString()}`);
}

function assertStakeAddedEvent(events, hotkey, netuid) {
  const event = assertEvent(events, "StakeAdded", ({ event }) => {
    const [, eventHotkey, , alphaStaked, eventNetuid] = event.data;
    return (
      eventHotkey.toString() === hotkey &&
      eventNetuid.toNumber() === netuid &&
      alphaStaked.toBigInt() > 0n
    );
  });
  return event.event.data[3].toBigInt();
}

function assertStakeRemovedEvent(events, hotkey, netuid) {
  const event = assertEvent(events, "StakeRemoved", ({ event }) => {
    const [, eventHotkey, , alphaUnstaked, eventNetuid] = event.data;
    return (
      eventHotkey.toString() === hotkey &&
      eventNetuid.toNumber() === netuid &&
      alphaUnstaked.toBigInt() > 0n
    );
  });
  return event.event.data[3].toBigInt();
}

function assertEvent(events, method, predicate) {
  const event = events.find((record) => {
    return (
      record.event.section === "subtensorModule" &&
      record.event.method === method &&
      (!predicate || predicate(record))
    );
  });
  assert.ok(event, `${method} event not found`);
  return event;
}

async function submitAndWait(signer, tx, label) {
  return new Promise((resolve, reject) => {
    console.log(`submitting tx: ${label}`);
    let unsubscribe;
    let settled = false;
    const timeout = setTimeout(
      () => finish(reject, new Error(`${label} timed out waiting for finalization`)),
      Number(process.env.SUBMIT_TIMEOUT_MS ?? 180_000)
    );

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
            const [error] = event.data;
            finish(reject, new Error(`${label} failed: ${formatDispatchError(error)}`));
            return;
          }
        }
      }

      if (status.isFinalized) {
        finish(resolve, { blockHash: status.asFinalized.toString(), events });
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => finish(reject, error));
  });
}

async function waitForFinalizedBlocks(count) {
  for (let i = 0; i < count; i++) {
    const header = await waitForFinalizedBlock();
    console.log("finalized wait block:", header.number.toString());
  }
}

function waitForFinalizedBlock() {
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      unsubscribe?.();
      fn(value);
    };

    api.rpc.chain
      .subscribeFinalizedHeads((header) => finish(resolve, header))
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => finish(reject, error));
  });
}

function formatDispatchError(error) {
  if (!error.isModule) {
    return error.toString();
  }

  const decoded = api.registry.findMetaError(error.asModule);
  return `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
}

function formatLock(lock) {
  return `locked_mass=${lock.lockedMass} conviction=${lock.conviction} last_update=${lock.lastUpdate}`;
}
