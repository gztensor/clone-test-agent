import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const STAKE_AMOUNT = BigInt(process.env.LOCK_TEST_STAKE_AMOUNT ?? "10000000000");
const SOURCE_FUND_AMOUNT = BigInt(process.env.LOCK_TEST_SOURCE_FUND_AMOUNT ?? "100000000000");
const MIN_PRICE = 0n;
const RUN_ID = process.env.LOCK_TEST_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const FUND_SOURCE_URI = process.env.LOCK_TEST_FUND_SOURCE_URI ?? "//Alice";
const TRANSFER_SOURCE_URI = process.env.TRANSFER_SOURCE_URI ?? `//LockConvictionTest//${RUN_ID}//source`;
const TRANSFER_DEST_URI = process.env.TRANSFER_DEST_URI ?? `//LockConvictionTest//${RUN_ID}//destination`;
const BLOCKS_BETWEEN_LOCK_ACTIONS = Number(process.env.LOCK_TEST_WAIT_BLOCKS ?? 3);

const keyring = new Keyring({ type: "sr25519" });
const fundSource = keyring.addFromUri(FUND_SOURCE_URI);
const source = keyring.addFromUri(TRANSFER_SOURCE_URI);
const destination = keyring.addFromUri(TRANSFER_DEST_URI);
const logger = createTempLogger("test-locks-conviction.log");
logger.captureConsole();

let api;

async function main() {
  await logger.start();
  api = await connect();

  try {
  const chain = await api.rpc.system.chain();
  const runtimeVersion = await api.rpc.state.getRuntimeVersion();
  const startHeader = await api.rpc.chain.getHeader();
  console.log("chain:", chain.toString());
  console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
  console.log("start block:", startHeader.number.toString());

  assertLockMetadataAvailable();

  const rates = await readRates();
  console.log("lock rates:", `unlock=${rates.unlockRate}`, `maturity=${rates.maturityRate}`);

  const { netuid, hotkeys } = await findTestSubnet();
  const [originHotkey, destinationHotkey] = hotkeys;
  console.log("run id:", RUN_ID);
  console.log("source coldkey:", source.address);
  console.log("destination coldkey:", destination.address);
  console.log("test subnet:", netuid);
  console.log("origin hotkey:", originHotkey);
  console.log("move-lock destination hotkey:", destinationHotkey);

  await fundSourceAccount();

  const alphaAdded = await addStake(originHotkey, netuid);
  assert.ok(alphaAdded > 4n, "addStake returned too little alpha to exercise lock transfer");
  console.log("alpha added:", alphaAdded.toString());

  const initialLockAmount = alphaAdded / 2n;
  await lockStake(source, originHotkey, netuid, initialLockAmount, "initial lockStake");
  let sourceLock = await requireLock(source.address, netuid, originHotkey, "source initial lock");
  assert.equal(sourceLock.lockedMass, initialLockAmount, "initial Lock.lockedMass did not match locked amount");
  await requireAggregateLock("hotkeyLock", netuid, originHotkey, "initial perpetual aggregate lock");
  await assertNoLock(destination.address, netuid, originHotkey, "destination should start without this lock");
  console.log("initial lock:", formatLock(sourceLock));

  await expectDispatchError(
    api.tx.subtensorModule.lockStake(destinationHotkey, netuid, 1n),
    source,
    "lockStake to second hotkey",
    "LockHotkeyMismatch"
  );
  console.log("wrong-hotkey lock rejected: ok");

  await expectDispatchError(
    api.tx.subtensorModule.removeStakeLimit(originHotkey, netuid, alphaAdded, MIN_PRICE, false),
    source,
    "remove locked stake",
    "StakeUnavailable"
  );
  console.log("over-unstake while locked rejected: ok");

  await submitAndWait(
    api,
    source,
    api.tx.subtensorModule.setPerpetualLock(netuid, false),
    "setPerpetualLock false"
  );
  await requireDecayingFlag(source.address, netuid);
  await requireAggregateLock("decayingHotkeyLock", netuid, originHotkey, "decaying aggregate lock");
  console.log("setPerpetualLock(false): ok");

  await waitForFinalizedBlocks(BLOCKS_BETWEEN_LOCK_ACTIONS);
  const topUpAmount = initialLockAmount / 4n;
  assert.ok(topUpAmount > 0n, "top-up amount rounded to zero");
  await lockStake(source, originHotkey, netuid, topUpAmount, "top-up lockStake");
  sourceLock = await requireLock(source.address, netuid, originHotkey, "source top-up lock");
  assert.ok(
    sourceLock.lockedMass > initialLockAmount,
    `top-up did not increase locked mass: ${sourceLock.lockedMass} <= ${initialLockAmount}`
  );
  assert.ok(sourceLock.lastUpdate > 0n, "top-up lock did not record a last_update block");
  console.log("top-up lock:", formatLock(sourceLock));

  const transferBefore = await requireLock(source.address, netuid, originHotkey, "source pre-transfer lock");
  const unlockedAlpha = alphaAdded - transferBefore.lockedMass;
  const sameSubnetTransferAmount = unlockedAlpha + transferBefore.lockedMass / 2n;
  assert.ok(
    sameSubnetTransferAmount > unlockedAlpha,
    "same-subnet transfer amount must exceed unlocked alpha to move part of the lock"
  );

  await submitAndWait(
    api,
    source,
    api.tx.subtensorModule.transferStake(
      destination.address,
      originHotkey,
      netuid,
      netuid,
      sameSubnetTransferAmount
    ),
    "same-subnet transferStake"
  );

  const sourceAfterTransfer = await requireLock(source.address, netuid, originHotkey, "source post-transfer lock");
  const destinationAfterTransfer = await requireLock(
    destination.address,
    netuid,
    originHotkey,
    "destination transferred lock"
  );
  assert.ok(
    sourceAfterTransfer.lockedMass < transferBefore.lockedMass,
    "same-subnet transfer did not reduce source locked mass"
  );
  assert.ok(destinationAfterTransfer.lockedMass > 0n, "same-subnet transfer did not move locked mass");
  console.log("source lock after same-subnet transfer:", formatLock(sourceAfterTransfer));
  console.log("destination lock after same-subnet transfer:", formatLock(destinationAfterTransfer));

  await fundDestinationFees();

  await submitAndWait(
    api,
    destination,
    api.tx.subtensorModule.moveLock(destinationHotkey, netuid),
    "moveLock"
  );
  await assertNoLock(destination.address, netuid, originHotkey, "moved lock should leave origin hotkey");
  const movedLock = await requireLock(destination.address, netuid, destinationHotkey, "moved destination lock");
  assert.ok(movedLock.lockedMass > 0n, "moveLock created an empty lock");
  console.log("moved destination lock:", formatLock(movedLock));

  await submitAndWait(
    api,
    destination,
    api.tx.subtensorModule.setPerpetualLock(netuid, true),
    "setPerpetualLock true"
  );
  await assertNoDecayingFlag(destination.address, netuid);
  await requireAggregateLock("hotkeyLock", netuid, destinationHotkey, "moved perpetual aggregate lock");
  console.log("setPerpetualLock(true): ok");

  console.log("locks and conviction live-clone test: ok");
  console.log("not tested on this clone: owner-coldkey immediate conviction and owner reassignment require controlling an existing subnet owner; ownership reassignment is also disabled in current coinbase code.");
  } finally {
    await api.disconnect();
  }
}

async function connect() {
  return connectApi(WS_ENDPOINT, { log: console.log });
}

main().then(() => logger.flush()).catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});

function assertLockMetadataAvailable() {
  const missing = [
    ["SubtensorModule.lockStake", api.tx.subtensorModule?.lockStake],
    ["SubtensorModule.moveLock", api.tx.subtensorModule?.moveLock],
    ["SubtensorModule.setPerpetualLock", api.tx.subtensorModule?.setPerpetualLock],
    ["SubtensorModule.addStake", api.tx.subtensorModule?.addStake],
    ["SubtensorModule.removeStakeLimit", api.tx.subtensorModule?.removeStakeLimit],
    ["SubtensorModule.transferStake", api.tx.subtensorModule?.transferStake],
    ["SubtensorModule.Lock", api.query.subtensorModule?.lock],
    ["SubtensorModule.HotkeyLock", api.query.subtensorModule?.hotkeyLock],
    ["SubtensorModule.DecayingHotkeyLock", api.query.subtensorModule?.decayingHotkeyLock],
    ["SubtensorModule.DecayingLock", api.query.subtensorModule?.decayingLock],
    ["SubtensorModule.UnlockRate", api.query.subtensorModule?.unlockRate],
    ["SubtensorModule.MaturityRate", api.query.subtensorModule?.maturityRate],
    ["SubtensorModule.Keys", api.query.subtensorModule?.keys],
    ["SubtensorModule.TransferToggle", api.query.subtensorModule?.transferToggle],
    ["Swap.PalSwapInitialized or Swap.SwapV3Initialized", initializedSubnetStorage()],
  ].filter(([, value]) => !value);

  assert.equal(
    missing.length,
    0,
    `${missing.map(([name]) => name).join(", ")} unavailable; run after upgrading the clone to a Conviction v2 runtime`
  );
}

async function readRates() {
  const [unlockRate, maturityRate] = await Promise.all([
    api.query.subtensorModule.unlockRate(),
    api.query.subtensorModule.maturityRate(),
  ]);
  return {
    unlockRate: unlockRate.toBigInt(),
    maturityRate: maturityRate.toBigInt(),
  };
}

async function findTestSubnet() {
  const initializedEntries = await initializedSubnetStorage().entries();
  const initializedNetuids = initializedEntries
    .filter(([, initialized]) => initialized.isTrue)
    .map(([key]) => key.args[0].toNumber())
    .sort((a, b) => a - b);

  for (const netuid of initializedNetuids) {
    const transferEnabled = await api.query.subtensorModule.transferToggle(netuid);
    if (!transferEnabled.isTrue) continue;

    const hotkeys = (await api.query.subtensorModule.keys.entries(netuid))
      .map(([, hotkey]) => hotkey.toString())
      .filter((hotkey, index, all) => hotkey && all.indexOf(hotkey) === index);

    if (hotkeys.length >= 2) {
      return { netuid, hotkeys: hotkeys.slice(0, 2) };
    }
  }

  throw new Error("no initialized transfer-enabled subnet with at least two hotkeys found");
}

function initializedSubnetStorage() {
  return api.query.swap?.palSwapInitialized ?? api.query.swap?.swapV3Initialized;
}

async function addStake(hotkey, netuid) {
  const result = await submitAndWait(
    api,
    source,
    api.tx.subtensorModule.addStake(hotkey, netuid, STAKE_AMOUNT),
    `addStake on netuid ${netuid}`
  );
  return assertStakeAddedEvent(result.events, hotkey, netuid);
}

async function lockStake(signer, hotkey, netuid, amount, label) {
  const result = await submitAndWait(
    api,
    signer,
    api.tx.subtensorModule.lockStake(hotkey, netuid, amount),
    label
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
  const maybeLock = await api.query.subtensorModule[storageName](netuid, hotkey);
  assert.ok(maybeLock.isSome, `${label}: expected ${storageName}(${netuid}, ${hotkey}) to exist`);
  return decodeLockState(maybeLock.unwrap());
}

async function requireDecayingFlag(coldkey, netuid) {
  const maybeFlag = await api.query.subtensorModule.decayingLock(coldkey, netuid);
  assert.ok(maybeFlag.isSome, `expected DecayingLock(${coldkey}, ${netuid}) to exist`);
  assert.equal(maybeFlag.unwrap().toString(), "false", "DecayingLock flag should store false sentinel");
}

async function assertNoDecayingFlag(coldkey, netuid) {
  const maybeFlag = await api.query.subtensorModule.decayingLock(coldkey, netuid);
  assert.ok(maybeFlag.isNone, `expected DecayingLock(${coldkey}, ${netuid}) to be absent`);
}

async function fundDestinationFees() {
  const minimumFree = 100_000_000n;
  const topUp = 1_000_000_000n;
  const destinationFree = (await api.query.system.account(destination.address)).data.free.toBigInt();
  if (destinationFree >= minimumFree) {
    return;
  }

  await submitAndWait(
    api,
    source,
    balancesTransfer(destination.address, topUp),
    `fee balance transfer ${source.address} -> ${destination.address}`
  );
  console.log("destination fee balance funded:", topUp.toString());
}

async function fundSourceAccount() {
  if (source.address === fundSource.address) {
    return;
  }

  const sourceFree = (await api.query.system.account(source.address)).data.free.toBigInt();
  if (sourceFree >= SOURCE_FUND_AMOUNT / 2n) {
    return;
  }

  const funderFree = (await api.query.system.account(fundSource.address)).data.free.toBigInt();
  assert.ok(
    funderFree > SOURCE_FUND_AMOUNT,
    `fund source ${fundSource.address} has ${funderFree}, cannot transfer ${SOURCE_FUND_AMOUNT}`
  );

  await submitAndWait(
    api,
    fundSource,
    balancesTransfer(source.address, SOURCE_FUND_AMOUNT),
    `source balance transfer ${fundSource.address} -> ${source.address}`
  );
  console.log("source funded:", SOURCE_FUND_AMOUNT.toString());
}

function balancesTransfer(dest, amount) {
  if (api.tx.balances.transferKeepAlive) {
    return api.tx.balances.transferKeepAlive(dest, amount);
  }
  if (api.tx.balances.transferAllowDeath) {
    return api.tx.balances.transferAllowDeath(dest, amount);
  }
  return api.tx.balances.transfer(dest, amount);
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

async function expectDispatchError(tx, signer, label, expectedName) {
  await assert.rejects(
    () => submitAndWait(api, signer, tx, label),
    (error) => {
      assert.match(error.message, new RegExp(`\\b${expectedName}\\b`));
      return true;
    }
  );
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
    await waitForFinalizedBlock();
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
