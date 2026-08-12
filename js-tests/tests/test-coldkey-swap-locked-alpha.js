import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { blake2AsHex, decodeAddress } from "@polkadot/util-crypto";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.COLDKEY_SWAP_LOCK_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const FUND_SOURCE_URI = process.env.COLDKEY_SWAP_LOCK_FUND_SOURCE_URI ?? "//Alice";
const SOURCE_FUND_AMOUNT = BigInt(process.env.COLDKEY_SWAP_LOCK_SOURCE_FUND_AMOUNT ?? "5000000000000");
const STAKE_AMOUNT = BigInt(process.env.COLDKEY_SWAP_LOCK_STAKE_AMOUNT ?? "10000000000");

const keyring = new Keyring({ type: "sr25519" });
const fundSource = keyring.addFromUri(FUND_SOURCE_URI);
const sourceColdkey = keyring.addFromUri(`//ColdkeySwapLockedAlpha//${RUN_ID}//source`);
const newColdkey = keyring.addFromUri(`//ColdkeySwapLockedAlpha//${RUN_ID}//new`);
const logger = createTempLogger("test-coldkey-swap-locked-alpha.log");
logger.captureConsole();

let api;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, { log: console.log });

  try {
    await waitForBlockProduction();
    assertMetadataAvailable();

    const chain = await api.rpc.system.chain();
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const startHeader = await api.rpc.chain.getHeader();
    console.log("chain:", chain.toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("start block:", startHeader.number.toString());
    console.log("run id:", RUN_ID);
    console.log("source coldkey:", sourceColdkey.address);
    console.log("new coldkey:", newColdkey.address);

    const { netuid, hotkey } = await findTransferEnabledSubnet();
    console.log("test subnet:", netuid);
    console.log("stake hotkey:", hotkey);

    await prepareTestState();

    const alphaAdded = await addStake(sourceColdkey, hotkey, netuid);
    assert.ok(alphaAdded > 4n, `addStake returned too little alpha: ${alphaAdded}`);
    const lockAmount = alphaAdded / 2n;
    await lockStake(sourceColdkey, hotkey, netuid, lockAmount);

    const sourceStakeBefore = await readPairStake(hotkey, sourceColdkey.address, netuid);
    const newStakeBefore = await readPairStake(hotkey, newColdkey.address, netuid);
    const sourceLockBefore = await requireLock(sourceColdkey.address, netuid, hotkey, "source before coldkey swap");
    const aggregateBefore = await requireAggregateLock(netuid, hotkey, "aggregate before coldkey swap");
    assert.equal(newStakeBefore, 0n, "new coldkey should start with zero pair stake");
    await assertNoLock(newColdkey.address, netuid, hotkey, "new coldkey before coldkey swap");
    assert.ok(sourceStakeBefore >= lockAmount, `source stake ${sourceStakeBefore} is below lock ${lockAmount}`);
    console.log("source pair stake before swap:", sourceStakeBefore.toString());
    console.log("source lock before swap:", formatLock(sourceLockBefore));
    console.log("aggregate lock before swap:", formatLock(aggregateBefore));

    await announceColdkeySwap();
    await expectDispatchError(
      api.tx.subtensorModule.swapColdkeyAnnounced(newColdkey.address),
      sourceColdkey,
      "swapColdkeyAnnounced with locked alpha to default new coldkey",
      "AccountRejectsLockedAlpha"
    );
    await assertNoLock(newColdkey.address, netuid, hotkey, "new coldkey after rejected coldkey swap");
    assert.equal(
      await readPairStake(hotkey, newColdkey.address, netuid),
      0n,
      "new coldkey should not receive stake after rejected swap"
    );
    console.log("default new coldkey rejected locked-alpha coldkey swap as expected");

    const optInResult = await submitAndWait(
      newColdkey,
      api.tx.subtensorModule.setRejectLockedAlpha(false),
      "new coldkey opts into locked alpha"
    );
    assertEvent(optInResult.events, "RejectLockedAlphaUpdated", ({ event }) => {
      const [eventColdkey, enabled] = event.data;
      return eventColdkey.toString() === newColdkey.address && enabled.isFalse;
    });
    await ensureColdkeySwapAnnouncement();

    const swapResult = await submitAndWait(
      sourceColdkey,
      api.tx.subtensorModule.swapColdkeyAnnounced(newColdkey.address),
      "swapColdkeyAnnounced with opted-in locked-alpha destination"
    );
    assertEvent(swapResult.events, "ColdkeySwapped", ({ event }) => {
      const [oldColdkey, eventNewColdkey] = event.data;
      return oldColdkey.toString() === sourceColdkey.address && eventNewColdkey.toString() === newColdkey.address;
    });

    const sourceStakeAfter = await readPairStake(hotkey, sourceColdkey.address, netuid);
    const newStakeAfter = await readPairStake(hotkey, newColdkey.address, netuid);
    const newLockAfter = await requireLock(newColdkey.address, netuid, hotkey, "new coldkey after coldkey swap");
    const aggregateAfter = await requireAggregateLock(netuid, hotkey, "aggregate after coldkey swap");
    await assertNoLock(sourceColdkey.address, netuid, hotkey, "source after coldkey swap");

    assert.equal(sourceStakeAfter, 0n, "source coldkey stake should be moved by coldkey swap");
    assert.ok(newStakeAfter >= lockAmount, `new coldkey stake ${newStakeAfter} is below lock ${lockAmount}`);
    assert.ok(newLockAfter.lockedMass > 0n, "locked mass should move to new coldkey");
    assert.ok(
      newLockAfter.lockedMass <= sourceLockBefore.lockedMass,
      `locked mass should not increase during swap roll-forward: before=${sourceLockBefore.lockedMass} after=${newLockAfter.lockedMass}`
    );
    assert.ok(newLockAfter.convictionBits >= sourceLockBefore.convictionBits, "conviction should not be dropped during swap");
    assert.ok(aggregateAfter.lockedMass > 0n, "aggregate lock should remain populated after swap");

    const owner = await api.query.subtensorModule.owner(hotkey);
    assert.notEqual(owner.toString(), sourceColdkey.address, "stake hotkey owner should not be overwritten by coldkey swap");

    console.log("source pair stake after swap:", sourceStakeAfter.toString());
    console.log("new pair stake after swap:", newStakeAfter.toString());
    console.log("new lock after swap:", formatLock(newLockAfter));
    console.log("aggregate lock after swap:", formatLock(aggregateAfter));
    console.log("coldkey swap with locked alpha after destination opt-in: ok");
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

function assertMetadataAvailable() {
  const missing = [
    ["Sudo.sudo", api.tx.sudo?.sudo],
    ["System.setStorage", api.tx.system?.setStorage],
    ["Balances.forceSetBalance", api.tx.balances?.forceSetBalance],
    ["SubtensorModule.addStake", api.tx.subtensorModule?.addStake],
    ["SubtensorModule.lockStake", api.tx.subtensorModule?.lockStake],
    ["SubtensorModule.announceColdkeySwap", api.tx.subtensorModule?.announceColdkeySwap],
    ["SubtensorModule.swapColdkeyAnnounced", api.tx.subtensorModule?.swapColdkeyAnnounced],
    ["SubtensorModule.setRejectLockedAlpha", api.tx.subtensorModule?.setRejectLockedAlpha],
    ["SubtensorModule.Lock", api.query.subtensorModule?.lock],
    ["SubtensorModule.HotkeyLock", api.query.subtensorModule?.hotkeyLock],
    ["SubtensorModule.DecayingHotkeyLock", api.query.subtensorModule?.decayingHotkeyLock],
    ["SubtensorModule.AlphaV2", api.query.subtensorModule?.alphaV2],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubtensorModule.TotalHotkeySharesV2", api.query.subtensorModule?.totalHotkeySharesV2],
    ["SubtensorModule.ColdkeySwapAnnouncementDelay", api.query.subtensorModule?.coldkeySwapAnnouncementDelay],
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.Keys", api.query.subtensorModule?.keys],
    ["SubtensorModule.Owner", api.query.subtensorModule?.owner],
    ["SubtensorModule.TransferToggle", api.query.subtensorModule?.transferToggle],
  ].filter(([, value]) => !value);

  assert.equal(
    missing.length,
    0,
    `${missing.map(([name]) => name).join(", ")} unavailable; run after upgrading the clone to a locked-alpha coldkey-swap runtime`
  );
}

async function prepareTestState() {
  const calls = [
    api.tx.balances.forceSetBalance(sourceColdkey.address, SOURCE_FUND_AMOUNT),
    api.tx.balances.forceSetBalance(newColdkey.address, SOURCE_FUND_AMOUNT),
    api.tx.system.setStorage([
      [api.query.subtensorModule.coldkeySwapAnnouncementDelay.key(), api.createType("u64", 0).toHex()],
    ]),
  ];
  const batched = api.tx.utility?.batchAll ? api.tx.utility.batchAll(calls) : api.tx.utility.batch(calls);
  await submitAndWait(fundSource, api.tx.sudo.sudo(batched), "sudo fund accounts and shorten coldkey swap delay");

  const sourceFree = (await api.query.system.account(sourceColdkey.address)).data.free.toBigInt();
  const newFree = (await api.query.system.account(newColdkey.address)).data.free.toBigInt();
  const delay = await api.query.subtensorModule.coldkeySwapAnnouncementDelay();
  assert.ok(sourceFree >= SOURCE_FUND_AMOUNT, `source funding failed: ${sourceFree}`);
  assert.ok(newFree >= SOURCE_FUND_AMOUNT, `new coldkey funding failed: ${newFree}`);
  assert.equal(delay.toBigInt(), 0n, `coldkey swap delay was not shortened: ${delay}`);
  console.log("source funded:", sourceFree.toString());
  console.log("new coldkey funded:", newFree.toString());
  console.log("coldkey swap announcement delay:", delay.toString());
}

async function findTransferEnabledSubnet() {
  const networkEntries = await api.query.subtensorModule.networksAdded.entries();
  for (const [key, added] of networkEntries) {
    if (!added.isTrue) continue;
    const netuid = key.args[0].toNumber();
    if (netuid === 0) continue;
    if ((await api.query.subtensorModule.transferToggle(netuid)).isFalse) continue;
    const keys = await api.query.subtensorModule.keys.entries(netuid);
    const hotkey = keys.find(([, value]) => value.toString())?.[1]?.toString();
    if (hotkey) {
      return { netuid, hotkey };
    }
  }
  throw new Error("no initialized transfer-enabled subnet with at least one hotkey found");
}

async function addStake(signer, hotkey, netuid) {
  const result = await submitAndWait(
    signer,
    api.tx.subtensorModule.addStake(hotkey, netuid, STAKE_AMOUNT),
    "addStake before coldkey swap"
  );
  return assertStakeAddedEvent(result.events, hotkey, netuid);
}

async function lockStake(signer, hotkey, netuid, amount) {
  const result = await submitAndWait(
    signer,
    api.tx.subtensorModule.lockStake(hotkey, netuid, amount),
    "lockStake before coldkey swap"
  );
  assertEvent(result.events, "StakeLocked", ({ event }) => {
    const [, eventHotkey, eventNetuid, eventAmount] = event.data;
    return eventHotkey.toString() === hotkey && eventNetuid.toNumber() === netuid && eventAmount.toBigInt() === amount;
  });
}

async function announceColdkeySwap() {
  const newColdkeyHash = blake2AsHex(decodeAddress(newColdkey.address), 256);
  const result = await submitAndWait(
    sourceColdkey,
    api.tx.subtensorModule.announceColdkeySwap(newColdkeyHash),
    "announceColdkeySwap"
  );
  assertEvent(result.events, "ColdkeySwapAnnounced", ({ event }) => {
    const [who, eventHash] = event.data;
    return who.toString() === sourceColdkey.address && eventHash.toString() === newColdkeyHash;
  });
  console.log("announced new coldkey hash:", newColdkeyHash);
}

async function ensureColdkeySwapAnnouncement() {
  const announcement = await api.query.subtensorModule.coldkeySwapAnnouncements(sourceColdkey.address);
  if (announcement.isSome) {
    console.log("coldkey swap announcement remained after rejected swap");
    return;
  }

  console.log("coldkey swap announcement was cleared after rejected swap; reannouncing");
  await announceColdkeySwap();
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

async function requireAggregateLock(netuid, hotkey, label) {
  const hotkeyLock = await api.query.subtensorModule.hotkeyLock(netuid, hotkey);
  const decayingHotkeyLock = await api.query.subtensorModule.decayingHotkeyLock(netuid, hotkey);
  const maybeLock = hotkeyLock.isSome ? hotkeyLock : decayingHotkeyLock;
  assert.ok(maybeLock.isSome, `${label}: expected aggregate lock for netuid ${netuid}, hotkey ${hotkey}`);
  return decodeLockState(maybeLock.unwrap());
}

async function readPairStake(hotkey, coldkey, netuid) {
  const [share, totalHotkeyStake, totalHotkeyShares] = await Promise.all([
    readAlphaShare(hotkey, coldkey, netuid),
    api.query.subtensorModule.totalHotkeyAlpha(hotkey, netuid),
    readTotalHotkeyShares(hotkey, netuid),
  ]);

  if (share.numerator === 0n || totalHotkeyStake.toBigInt() === 0n || totalHotkeyShares.numerator === 0n) {
    return 0n;
  }
  return fixedMulDivToBigInt(share, totalHotkeyStake.toBigInt(), totalHotkeyShares);
}

async function readAlphaShare(hotkey, coldkey, netuid) {
  if (api.query.subtensorModule?.alpha) {
    const legacyShare = await readOptionalStorage(api.query.subtensorModule.alpha, hotkey, coldkey, netuid);
    if (legacyShare) {
      return decodeFixedRational(legacyShare);
    }
  }

  const shareV2 = await api.query.subtensorModule.alphaV2(hotkey, coldkey, netuid);
  return decodeFixedRational(shareV2);
}

async function readTotalHotkeyShares(hotkey, netuid) {
  if (api.query.subtensorModule?.totalHotkeyShares) {
    const legacyShares = await readOptionalStorage(api.query.subtensorModule.totalHotkeyShares, hotkey, netuid);
    if (legacyShares) {
      return decodeFixedRational(legacyShares);
    }
  }

  const sharesV2 = await api.query.subtensorModule.totalHotkeySharesV2(hotkey, netuid);
  return decodeFixedRational(sharesV2);
}

async function readOptionalStorage(query, ...args) {
  const storageKey = query.key(...args);
  const storage = await api.rpc.state.getStorage(storageKey);
  if (!storage || storage.isNone || storage.isEmpty || storage.unwrap?.().isEmpty) {
    return undefined;
  }
  return query(...args);
}

async function waitForBlockProduction() {
  const observed = [];
  let previous = (await api.rpc.chain.getHeader()).number.toBigInt();
  const deadline = Date.now() + 180_000;

  while (Date.now() < deadline && observed.length < 2) {
    await sleep(6_000);
    const current = (await api.rpc.chain.getHeader()).number.toBigInt();
    if (current > previous) {
      observed.push(current);
      previous = current;
      console.log("observed produced block:", current.toString());
    }
  }

  assert.equal(observed.length, 2, `block production did not advance twice; observed ${observed.length} advances`);
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

async function expectDispatchError(tx, signer, label, expectedName) {
  await assert.rejects(
    () => submitAndWait(signer, tx, label),
    (error) => {
      assert.match(error.message, new RegExp(`\\b${expectedName}\\b`));
      return true;
    }
  );
}

function decodeLockState(lockState) {
  const lockedMass = structField(lockState, "lockedMass", "locked_mass").toBigInt();
  const convictionValue = structField(lockState, "conviction");
  const conviction = convictionValue.toString();
  const convictionBits = decodeConvictionBits(convictionValue);
  const lastUpdate = structField(lockState, "lastUpdate", "last_update").toBigInt();
  return { lockedMass, conviction, convictionBits, lastUpdate };
}

function decodeConvictionBits(value) {
  if (value.toBigInt) {
    return value.toBigInt();
  }

  const json = value.toJSON?.();
  if (json?.bits !== undefined) {
    return parseBigIntish(json.bits);
  }

  const human = value.toHuman?.();
  if (human?.bits !== undefined) {
    return parseBigIntish(human.bits);
  }

  const parsed = JSON.parse(value.toString());
  return parseBigIntish(parsed.bits);
}

function decodeFixedRational(value) {
  const human = value.toHuman?.();
  if (human?.mantissa !== undefined || value.mantissa !== undefined || value.get?.("mantissa")) {
    const mantissa = parseBigIntish(human?.mantissa ?? structField(value, "mantissa").toString());
    const exponent = Number(String(human?.exponent ?? structField(value, "exponent").toString()).replaceAll(",", ""));
    return rationalFromDecimalExponent(mantissa, exponent);
  }

  const bits = value.toBigInt ? value.toBigInt() : parseBigIntish(value.toString());
  return { numerator: bits, denominator: 1n << 64n };
}

function rationalFromDecimalExponent(mantissa, exponent) {
  if (exponent >= 0) {
    return { numerator: mantissa * 10n ** BigInt(exponent), denominator: 1n };
  }

  return { numerator: mantissa, denominator: 10n ** BigInt(-exponent) };
}

function fixedMulDivToBigInt(multiplier, value, divisor) {
  assert.ok(divisor.numerator > 0n, "total hotkey shares must be positive");
  return multiplier.numerator * value * divisor.denominator / (multiplier.denominator * divisor.numerator);
}

function parseBigIntish(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value.replaceAll(",", ""));
  throw new Error(`could not decode bigint from ${value}`);
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
    return eventHotkey.toString() === hotkey && eventNetuid.toNumber() === netuid && alphaStaked.toBigInt() > 0n;
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
