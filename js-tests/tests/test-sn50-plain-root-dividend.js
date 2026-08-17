import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.SN50_PLAIN_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const NETUID = 50;
const ROOT_NETUID = 0;
const ROOT_STAKE_TAO = 98n;
const RAO_PER_TAO = 1_000_000_000n;
const ROOT_STAKE = ROOT_STAKE_TAO * RAO_PER_TAO;
const TEST_BALANCE = 100n * RAO_PER_TAO;
const INITIAL_SWAP_TAO = 6n;
const INITIAL_SWAP_AMOUNT = INITIAL_SWAP_TAO * RAO_PER_TAO;
const U64_MAX = 18_446_744_073_709_551_615n;
const FAST_TEMPO = 1;
const MAX_EARNING_EPOCHS = 20;
const TX_TIMEOUT_MS = 180_000;

const keyring = new Keyring({ type: "sr25519" });
const alice = keyring.addFromUri("//Alice");
const validatorColdkey = keyring.addFromUri(`//Sn50Plain//${RUN_ID}//coldkey`);
const validatorHotkey = keyring.addFromUri(`//Sn50Plain//${RUN_ID}//hotkey`);
const LOG_FILE = `test-sn50-plain-root-dividend-${RUN_ID}.log`;
const logger = createTempLogger(LOG_FILE);
logger.captureConsole();

let api;
let originalTempo;
let originalWeightsSetRateLimit;
let originalLastUpdate;
let tempoChanged = false;
let weightsSetRateLimitChanged = false;
let lastUpdateChanged = false;
let lastObservedFinalizedBlock = -1n;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, { log: console.log });

  try {
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const startHeader = await api.rpc.chain.getHeader();
    const finalizedHeader = await api.rpc.chain.getHeader(await api.rpc.chain.getFinalizedHead());
    lastObservedFinalizedBlock = finalizedHeader.number.toBigInt();

    console.log("chain:", (await api.rpc.system.chain()).toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("start block:", startHeader.number.toString());
    console.log("run id:", RUN_ID);
    console.log("log file:", LOG_FILE);
    console.log("validator coldkey:", validatorColdkey.address);
    console.log("validator hotkey:", validatorHotkey.address);

    assertMetadataAvailable();
    await assertAliceIsSudo();
    await assertBasketMigrationComplete();

    const researchState = await readResearchState();
    console.log("SN50 research-state:", JSON.stringify(researchState, bigintReplacer));

    assert.equal(researchState.n, 256, "SN50 occupancy differs from the research snapshot");
    assert.equal(researchState.maxAllowedUids, 256, "SN50 capacity differs from the research snapshot");
    assert.equal(researchState.immunityPeriod, 65_535, "SN50 immunity differs from the research snapshot");
    assert.ok(researchState.burnRao > 0n, "SN50 registration burn is not positive");
    assert.equal(researchState.maxAllowedValidators, 64, "SN50 validator capacity differs from research");
    assert.ok(researchState.permitsUsed >= 8, "SN50 unexpectedly uses fewer than eight permits");
    assert.ok(
      researchState.permitsUsed <= researchState.maxAllowedValidators,
      "SN50 uses more permits than its configured maximum"
    );
    assert.equal(researchState.commitReveal, false, "SN50 unexpectedly enables commit-reveal");
    assert.equal(researchState.weightsVersion, 100n, "SN50 weights version differs from research");
    assert.ok(
      researchState.consensusPositive >= 235,
      `SN50 has only ${researchState.consensusPositive} consensus-positive UIDs`
    );
    assert.ok(
      researchState.incentivePositive >= 235,
      `SN50 has only ${researchState.incentivePositive} incentive-positive UIDs`
    );

    originalTempo = researchState.tempo;
    originalWeightsSetRateLimit = researchState.weightsSetRateLimit;
    const before = await readUidVectors();

    await fund(validatorColdkey.address, TEST_BALANCE);
    await submitAndWait(
      validatorColdkey,
      api.tx.subtensorModule.rootRegister(validatorHotkey.address),
      "register experiment hotkey on root"
    );
    await submitAndWait(
      validatorColdkey,
      api.tx.subtensorModule.addStakeLimit(
        validatorHotkey.address,
        ROOT_NETUID,
        ROOT_STAKE,
        U64_MAX,
        false
      ),
      `stake ${ROOT_STAKE_TAO} TAO on root`
    );
    await submitAndWait(
      validatorColdkey,
      api.tx.subtensorModule.burnedRegister(NETUID, validatorHotkey.address),
      `burn-register experiment hotkey on subnet ${NETUID}`
    );

    const uidOption = await api.query.subtensorModule.uids(NETUID, validatorHotkey.address);
    assert.equal(uidOption.isSome, true, `experiment hotkey was not registered on subnet ${NETUID}`);
    const uid = uidOption.unwrap().toNumber();
    const registrationBlock = (await api.query.subtensorModule.blockAtRegistration(NETUID, uid)).toBigInt();
    console.log(
      "registered SN50 neuron:",
      `uid=${uid}`,
      `registration_block=${registrationBlock}`,
      `previous_consensus=${before.consensus[uid]}`,
      `previous_incentive=${before.incentive[uid]}`
    );

    const stake = await readEffectiveStake();
    console.log("effective stake after registration:", formatStake(stake));
    assert.equal(stake.rootStakeRao, ROOT_STAKE, "root stake is not exactly 98 TAO");
    assert.ok(stake.effectiveStakeRao < stake.thresholdRao, "98 TAO unexpectedly passes weight threshold");

    const destinations = Array.from({ length: researchState.n }, (_, targetUid) => targetUid)
      .filter((targetUid) => targetUid !== uid);
    const uniformWeights = destinations.map(() => 1);

    const initialWeightError = await submitExpectFailure(
      validatorHotkey,
      api.tx.subtensorModule.setWeights(
        NETUID,
        destinations,
        uniformWeights,
        researchState.weightsVersion
      ),
      "submit uniform SN50 weights before epoch"
    );
    console.log("initial set-weights rejection:", initialWeightError);
    assert.match(initialWeightError, /NotEnoughStakeToSetWeights/);

    await submitAndWait(
      validatorColdkey,
      api.tx.subtensorModule.moveStake(
        validatorHotkey.address,
        validatorHotkey.address,
        ROOT_NETUID,
        NETUID,
        INITIAL_SWAP_AMOUNT
      ),
      `move ${INITIAL_SWAP_TAO} TAO of root stake into SN50 alpha stake`
    );

    const fundedStake = await readEffectiveStake();
    console.log("effective stake after self-funded move:", formatStake(fundedStake));
    assert.equal(
      fundedStake.rootStakeRao,
      ROOT_STAKE - INITIAL_SWAP_AMOUNT,
      "root stake did not decrease by the requested 6 TAO"
    );
    assert.ok(
      fundedStake.effectiveStakeRao >= fundedStake.thresholdRao,
      "moving 6 TAO to SN50 did not reach the effective-stake threshold"
    );

    await setAcceleratedSubnetSettings();
    tempoChanged = true;
    weightsSetRateLimitChanged = true;
    await waitForEpochAdvance();

    const permitted = await readNeuronAndBasketState(uid);
    console.log("after funded permit epoch:", formatNeuronAndBasketState(permitted));
    assert.equal(permitted.permit, true, "self-funded effective stake did not obtain a validator permit");

    await submitAndWait(
      validatorHotkey,
      api.tx.subtensorModule.setWeights(
        NETUID,
        destinations,
        uniformWeights,
        researchState.weightsVersion
      ),
      "submit uniform weights across all non-self SN50 UIDs"
    );

    await normalizeCloneWeightTimestamp(uid);

    const earning = await waitForRootDividend(uid);
    console.log("first positive root-dividend epoch:", formatNeuronAndBasketState(earning));
    assert.equal(earning.permit, true, "validator lost its permit before earning");
    assert.ok(earning.validatorTrust > 0n, "uniform weights established no consensus-overlapping trust");
    assert.ok(earning.dividends > 0n, "uniform weights established no validator dividends");
    assert.ok(earning.rootAlphaDividendRao > 0n, "validator dividends produced no root alpha");
    assert.ok(
      earning.pendingBasketAlphaRao > 0n || earning.basketOwedRao > 0n,
      "positive root alpha was neither queued nor deposited into the root basket"
    );

    console.log(
      "experiment conclusion:",
      "98 TAO kept entirely on root cannot set weights, but moving 6 TAO into SN50 alpha",
      "crosses 1,000 effective stake; uniform weights then earn validator and root dividends."
    );
    console.log("SN50 plain root-dividend experiment: passed");
  } finally {
    await restoreTemporaryState();
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
    ["SubtensorModule.rootRegister", api.tx.subtensorModule?.rootRegister],
    ["SubtensorModule.burnedRegister", api.tx.subtensorModule?.burnedRegister],
    ["SubtensorModule.addStakeLimit", api.tx.subtensorModule?.addStakeLimit],
    ["SubtensorModule.moveStake", api.tx.subtensorModule?.moveStake],
    ["SubtensorModule.setWeights", api.tx.subtensorModule?.setWeights],
    ["SubtensorModule.Tempo", api.query.subtensorModule?.tempo],
    ["SubtensorModule.WeightsSetRateLimit", api.query.subtensorModule?.weightsSetRateLimit],
    ["SubtensorModule.LastUpdate", api.query.subtensorModule?.lastUpdate],
    ["SubtensorModule.RootAlphaDividendsPerSubnet", api.query.subtensorModule?.rootAlphaDividendsPerSubnet],
    ["SubtensorModule.PendingBasketDeposits", api.query.subtensorModule?.pendingBasketDeposits],
  ].filter(([, value]) => !value);
  assert.equal(missing.length, 0, `missing metadata: ${missing.map(([name]) => name).join(", ")}`);
}

async function assertAliceIsSudo() {
  assert.equal((await api.query.sudo.key()).toString(), alice.address, "Alice is not sudo");
}

async function assertBasketMigrationComplete() {
  const entries = await api.query.subtensorModule.hasMigrationRun.entries();
  const migration = entries.find(([key]) => key.args[0].toUtf8() === "migrate_seed_beta_basket_v2");
  assert.ok(migration?.[1].isTrue, "migrate_seed_beta_basket_v2 has not completed");
  console.log("basket migration complete: migrate_seed_beta_basket_v2=true");
}

async function readResearchState() {
  const [
    n,
    maxAllowedUids,
    immunityPeriod,
    burn,
    maxAllowedValidators,
    permits,
    consensus,
    incentive,
    commitReveal,
    weightsVersion,
    tempo,
    weightsSetRateLimit,
    threshold,
    taoWeight,
  ] = await Promise.all([
    api.query.subtensorModule.subnetworkN(NETUID),
    api.query.subtensorModule.maxAllowedUids(NETUID),
    api.query.subtensorModule.immunityPeriod(NETUID),
    api.query.subtensorModule.burn(NETUID),
    api.query.subtensorModule.maxAllowedValidators(NETUID),
    api.query.subtensorModule.validatorPermit(NETUID),
    api.query.subtensorModule.consensus(NETUID),
    api.query.subtensorModule.incentive(NETUID),
    api.query.subtensorModule.commitRevealWeightsEnabled(NETUID),
    api.query.subtensorModule.weightsVersionKey(NETUID),
    api.query.subtensorModule.tempo(NETUID),
    api.query.subtensorModule.weightsSetRateLimit(NETUID),
    api.query.subtensorModule.stakeThreshold(),
    api.query.subtensorModule.taoWeight(),
  ]);

  return {
    n: n.toNumber(),
    maxAllowedUids: maxAllowedUids.toNumber(),
    immunityPeriod: immunityPeriod.toNumber(),
    burnRao: burn.toBigInt(),
    maxAllowedValidators: maxAllowedValidators.toNumber(),
    permitsUsed: Array.from(permits).filter((value) => value.isTrue).length,
    consensusPositive: Array.from(consensus).filter((value) => value.toBigInt() > 0n).length,
    incentivePositive: Array.from(incentive).filter((value) => value.toBigInt() > 0n).length,
    commitReveal: commitReveal.isTrue,
    weightsVersion: weightsVersion.toBigInt(),
    tempo: tempo.toNumber(),
    weightsSetRateLimit: weightsSetRateLimit.toBigInt(),
    thresholdRao: threshold.toBigInt(),
    taoWeightRaw: taoWeight.toBigInt(),
  };
}

async function readUidVectors() {
  const [permits, consensus, incentive] = await Promise.all([
    api.query.subtensorModule.validatorPermit(NETUID),
    api.query.subtensorModule.consensus(NETUID),
    api.query.subtensorModule.incentive(NETUID),
  ]);
  return {
    permits: Array.from(permits).map((value) => value.isTrue),
    consensus: Array.from(consensus).map((value) => value.toBigInt()),
    incentive: Array.from(incentive).map((value) => value.toBigInt()),
  };
}

async function readEffectiveStake() {
  const [rootStake, alphaStake, threshold, taoWeight] = await Promise.all([
    api.query.subtensorModule.totalHotkeyAlpha(validatorHotkey.address, ROOT_NETUID),
    api.query.subtensorModule.totalHotkeyAlpha(validatorHotkey.address, NETUID),
    api.query.subtensorModule.stakeThreshold(),
    api.query.subtensorModule.taoWeight(),
  ]);
  const rootStakeRao = rootStake.toBigInt();
  const alphaStakeRao = alphaStake.toBigInt();
  const taoWeightRaw = taoWeight.toBigInt();
  return {
    rootStakeRao,
    alphaStakeRao,
    taoWeightRaw,
    effectiveStakeRao: alphaStakeRao + (rootStakeRao * taoWeightRaw) / U64_MAX,
    thresholdRao: threshold.toBigInt(),
  };
}

function formatStake(stake) {
  const shortfall =
    stake.effectiveStakeRao < stake.thresholdRao
      ? stake.thresholdRao - stake.effectiveStakeRao
      : 0n;
  const surplus =
    stake.effectiveStakeRao > stake.thresholdRao
      ? stake.effectiveStakeRao - stake.thresholdRao
      : 0n;
  return [
    `root_tao=${formatUnits(stake.rootStakeRao)}`,
    `local_alpha=${formatUnits(stake.alphaStakeRao)}`,
    `tao_weight=${Number(stake.taoWeightRaw) / Number(U64_MAX)}`,
    `effective=${formatUnits(stake.effectiveStakeRao)}`,
    `threshold=${formatUnits(stake.thresholdRao)}`,
    `shortfall=${formatUnits(shortfall)}`,
    `surplus=${formatUnits(surplus)}`,
  ].join(" ");
}

async function readNeuronAndBasketState(uid) {
  const [
    permit,
    consensus,
    incentive,
    dividends,
    validatorTrust,
    rootAlpha,
    pendingAlpha,
    positionsRaw,
  ] =
    await Promise.all([
      api.query.subtensorModule.validatorPermit(NETUID),
      api.query.subtensorModule.consensus(NETUID),
      api.query.subtensorModule.incentive(NETUID),
      api.query.subtensorModule.dividends(NETUID),
      api.query.subtensorModule.validatorTrust(NETUID),
      api.query.subtensorModule.rootAlphaDividendsPerSubnet(NETUID, validatorHotkey.address),
      api.query.subtensorModule.pendingBasketDeposits(validatorHotkey.address, NETUID),
      callRootBasketPositions(),
    ]);
  const basketPositions = decodePositions(positionsRaw);
  return {
    block: (await api.rpc.chain.getHeader()).number.toBigInt(),
    epoch: (await api.query.subtensorModule.subnetEpochIndex(NETUID)).toBigInt(),
    permit: permit[uid]?.isTrue ?? false,
    consensus: consensus[uid]?.toBigInt() ?? 0n,
    incentive: incentive[uid]?.toBigInt() ?? 0n,
    dividends: dividends[uid]?.toBigInt() ?? 0n,
    validatorTrust: validatorTrust[uid]?.toBigInt() ?? 0n,
    rootAlphaDividendRao: rootAlpha.toBigInt(),
    pendingBasketAlphaRao: pendingAlpha.toBigInt(),
    basketPositions,
    basketOwedRao: basketPositions.reduce((sum, position) => sum + position.payout, 0n),
  };
}

function formatNeuronAndBasketState(state) {
  return [
    `block=${state.block}`,
    `epoch=${state.epoch}`,
    `permit=${state.permit}`,
    `consensus=${state.consensus}`,
    `incentive=${state.incentive}`,
    `dividends=${state.dividends}`,
    `validator_trust=${state.validatorTrust}`,
    `root_alpha_rao=${state.rootAlphaDividendRao}`,
    `pending_basket_alpha_rao=${state.pendingBasketAlphaRao}`,
    `basket_owed_rao=${state.basketOwedRao}`,
    `basket_positions=${state.basketPositions.length}`,
  ].join(" ");
}

async function callRootBasketPositions() {
  const argument = api.createType("AccountId32", validatorColdkey.address).toHex();
  return api.rpc.state.call("BetaBasketRuntimeApi_get_root_basket_positions", argument);
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

async function fund(address, amount) {
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.balances.forceSetBalance(address, amount)),
    `fund experiment coldkey with ${formatUnits(amount)} TAO`
  );
}

async function setSubnetTempo(tempo) {
  await setStorage(
    [[api.query.subtensorModule.tempo.key(NETUID), storageValueHex("u16", tempo)]],
    `set subnet ${NETUID} tempo to ${tempo}`
  );
}

async function setAcceleratedSubnetSettings() {
  await setStorage(
    [
      [api.query.subtensorModule.tempo.key(NETUID), storageValueHex("u16", FAST_TEMPO)],
      [api.query.subtensorModule.weightsSetRateLimit.key(NETUID), storageValueHex("u64", 0)],
    ],
    `set subnet ${NETUID} tempo=${FAST_TEMPO} and weights rate limit=0`
  );
}

async function setWeightsSetRateLimit(rateLimit) {
  await setStorage(
    [
      [
        api.query.subtensorModule.weightsSetRateLimit.key(NETUID),
        storageValueHex("u64", rateLimit),
      ],
    ],
    `set subnet ${NETUID} weights rate limit to ${rateLimit}`
  );
}

async function normalizeCloneWeightTimestamp(uid) {
  originalLastUpdate = Array.from(await api.query.subtensorModule.lastUpdate(NETUID)).map((value) =>
    value.toBigInt()
  );
  const registrations = await api.query.subtensorModule.blockAtRegistration.entries(NETUID);
  let newestTargetRegistration = 0n;
  for (const [key, value] of registrations) {
    const targetUid = key.args[1].toNumber();
    if (targetUid !== uid && value.toBigInt() > newestTargetRegistration) {
      newestTargetRegistration = value.toBigInt();
    }
  }
  const normalized = [...originalLastUpdate];
  normalized[uid] = newestTargetRegistration + 1n;
  await setLastUpdate(normalized, "normalize clone-local weight timestamp above target registrations");
  lastUpdateChanged = true;
  console.log(
    "normalized clone weight timestamp:",
    `uid=${uid}`,
    `local_last_update=${originalLastUpdate[uid]}`,
    `newest_target_registration=${newestTargetRegistration}`,
    `normalized_last_update=${normalized[uid]}`
  );
}

async function setLastUpdate(values, label) {
  await setStorage(
    [[api.query.subtensorModule.lastUpdate.key(NETUID), storageValueHex("Vec<u64>", values)]],
    label
  );
}

async function setStorage(pairs, label) {
  await submitAndWait(alice, api.tx.sudo.sudo(api.tx.system.setStorage(pairs)), label);
}

async function restoreTemporaryState() {
  if (!api) return;
  try {
    if (lastUpdateChanged && originalLastUpdate) {
      await setLastUpdate(originalLastUpdate, "restore SN50 LastUpdate vector");
      console.log("restored SN50 LastUpdate vector");
    }
    if (weightsSetRateLimitChanged && originalWeightsSetRateLimit !== undefined) {
      await setWeightsSetRateLimit(originalWeightsSetRateLimit);
      console.log("restored SN50 weights rate limit:", originalWeightsSetRateLimit.toString());
    }
    if (tempoChanged && originalTempo !== undefined) {
      await setSubnetTempo(originalTempo);
      console.log("restored SN50 tempo:", originalTempo);
    }
  } catch (error) {
    console.log("failed to restore temporary state:", error);
  }
}

async function waitForRootDividend(uid) {
  for (let epoch = 1; epoch <= MAX_EARNING_EPOCHS; epoch += 1) {
    await waitForEpochAdvance();
    const state = await readNeuronAndBasketState(uid);
    console.log(`earning epoch ${epoch}:`, formatNeuronAndBasketState(state));
    if (state.dividends > 0n && state.rootAlphaDividendRao > 0n) return state;
  }
  throw new Error(`no positive validator/root dividend within ${MAX_EARNING_EPOCHS} epochs`);
}

async function waitForEpochAdvance() {
  const before = (await api.query.subtensorModule.subnetEpochIndex(NETUID)).toBigInt();
  for (let blocks = 0; blocks < 20; blocks += 1) {
    const header = await waitForFinalizedBlock();
    const current = (await api.query.subtensorModule.subnetEpochIndex(NETUID)).toBigInt();
    if (current > before) {
      console.log("SN50 epoch advanced:", `block=${header.number}`, `from=${before}`, `to=${current}`);
      return current;
    }
  }
  throw new Error("SN50 epoch did not advance within 20 finalized blocks");
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

async function submitAndWait(signer, txOrPromise, label) {
  const tx = await txOrPromise;
  console.log("submit:", label);
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let settled = false;
    const timeout = setTimeout(
      () => finish(reject, new Error(`${label} timed out after ${TX_TIMEOUT_MS}ms`)),
      TX_TIMEOUT_MS
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

async function submitExpectFailure(signer, txOrPromise, label) {
  const tx = await txOrPromise;
  console.log("submit expecting failure:", label);
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let settled = false;
    const timeout = setTimeout(
      () => finish(reject, new Error(`${label} timed out after ${TX_TIMEOUT_MS}ms`)),
      TX_TIMEOUT_MS
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
        finish(resolve, formatDispatchError(dispatchError));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        const failure = events.find(
          ({ event }) => event.section === "system" && event.method === "ExtrinsicFailed"
        );
        if (failure) {
          finish(resolve, formatDispatchError(failure.event.data[0]));
          return;
        }
      }
      if (status.isFinalized) {
        finish(reject, new Error(`${label} unexpectedly succeeded at ${status.asFinalized}`));
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => {
        if (/Invalid Transaction: Custom error: 1/.test(error.message)) {
          finish(
            resolve,
            "SubtensorModule.NotEnoughStakeToSetWeights (validation Custom error 1: StakeAmountTooLow)"
          );
          return;
        }
        finish(reject, error);
      });
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

function formatUnits(rao) {
  const whole = rao / RAO_PER_TAO;
  const fractional = (rao % RAO_PER_TAO).toString().padStart(9, "0").replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : whole.toString();
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function bigintReplacer(_key, value) {
  return typeof value === "bigint" ? value.toString() : value;
}
