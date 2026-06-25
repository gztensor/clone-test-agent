import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";
import { clearLastRateLimitedBlocks } from "../lib/rate-limit-storage.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.DISSOLVE_RESERVOIR_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const SUDO_URI = process.env.SUDO_URI ?? "//Alice";
const FUND_AMOUNT = BigInt(process.env.DISSOLVE_RESERVOIR_FUND_AMOUNT ?? "20000000000");
const NETWORK_LOCK_COST = BigInt(process.env.DISSOLVE_RESERVOIR_NETWORK_LOCK_COST ?? "1000000000");
const STAKE_AMOUNT = BigInt(process.env.DISSOLVE_RESERVOIR_STAKE_AMOUNT ?? "1000000000");
const RESERVOIR_TAO = BigInt(process.env.DISSOLVE_RESERVOIR_TAO ?? "5000000000");
const RESERVOIR_ALPHA = BigInt(process.env.DISSOLVE_RESERVOIR_ALPHA ?? "1");
const PROTOCOL_ALPHA_IN = BigInt(process.env.DISSOLVE_RESERVOIR_PROTOCOL_ALPHA_IN ?? "1");
const MAX_PRICE = 18_446_744_073_709_551_615n;

const keyring = new Keyring({ type: "sr25519" });
const sudo = keyring.addFromUri(SUDO_URI);
const subnetOwner = keyring.addFromUri(`//DissolveReservoir//${RUN_ID}//owner`);
const ownerHotkey = keyring.addFromUri(`//DissolveReservoir//${RUN_ID}//owner-hotkey`);
const staker = keyring.addFromUri(`//DissolveReservoir//${RUN_ID}//staker`);
const logger = createTempLogger("test-dissolve-network-reservoir-recovery.log");
logger.captureConsole();

let api;
let sawIssuanceDrift = false;

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

    assertMetadataAvailable();
    await assertIssuanceMatch("initial");
    await fundTestAccounts();

    const globals = await captureRegistrationGlobals();
    let netuid = null;

    try {
      await enableSubnetRegistration();
      await clearLastRateLimitedBlocks(api, sudo, submitAndWait, "sudo clear subnet registration rate limits");
      netuid = await registerSubnet();
      await enableSubtoken(netuid);
      await assertIssuanceMatch("after subnet registration");

      const alphaAdded = await addStake(netuid);
      assert.ok(alphaAdded > 0n, "addStakeLimit should mint alpha for the test staker");
      await assertIssuanceMatch("after staker addStakeLimit");

      const subnetAccount = await getSubnetAccountId(netuid);
      await backAndSeedReservoirs(netuid, subnetAccount);
      const before = await snapshot(netuid, subnetAccount, "before rootDissolveNetwork");
      assert.ok(before.taoReservoir > 0n, "BalancerTaoReservoir must be non-zero before deregistration");
      assert.ok(before.alphaReservoir > 0n, "BalancerAlphaReservoir must be non-zero before deregistration");
      assert.ok(before.subnetTao > 0n, "SubnetTAO must be non-zero before deregistration");
      assert.ok(before.stakerAlpha > 0n, "test staker alpha must be non-zero before deregistration");

      await rootDissolveNetwork(netuid);

      const [ownerAfter, stakerAfter] = await Promise.all([
        freeBalance(subnetOwner.address),
        freeBalance(staker.address),
      ]);
      const recipientIncrease = ownerAfter + stakerAfter - before.ownerFree - before.stakerFree;
      const minimumExpectedRecovery = ((before.subnetTao + before.taoReservoir) * 90n) / 100n;

      assert.ok(
        recipientIncrease >= minimumExpectedRecovery,
        `deregistration did not return the TAO pot including reservoir to owner/staker: increase=${recipientIncrease}, expected_at_least=${minimumExpectedRecovery}, subnet_tao=${before.subnetTao}, tao_reservoir=${before.taoReservoir}`
      );
      assert.equal((await api.query.subtensorModule.networksAdded(netuid)).isFalse, true, "network was not removed");
      assert.equal((await api.query.swap.balancerTaoReservoir(netuid)).toBigInt(), 0n, "TAO reservoir was not cleared");
      assert.equal((await api.query.swap.balancerAlphaReservoir(netuid)).toBigInt(), 0n, "alpha reservoir was not cleared");
      await assertIssuanceMatch("after rootDissolveNetwork");

      console.log(
        "dissolve reservoir recovery: ok",
        `netuid=${netuid}`,
        `subnet_account=${subnetAccount}`,
        `staker_alpha=${before.stakerAlpha}`,
        `subnet_tao_before=${before.subnetTao}`,
        `tao_reservoir_before=${before.taoReservoir}`,
        `alpha_reservoir_before=${before.alphaReservoir}`,
        `recipient_increase=${recipientIncrease}`,
        `minimum_expected_recovery=${minimumExpectedRecovery}`,
        `owner_free_after=${ownerAfter}`,
        `staker_free_after=${stakerAfter}`
      );
    } finally {
      await restoreRegistrationGlobals(globals);
    }
  } finally {
    await api?.disconnect();
    await logger.flush();
  }
}

main().catch(async (error) => {
  if (/TotalIssuance .*does not match Balances\.TotalIssuance/.test(error.message)) {
    sawIssuanceDrift = true;
    await logger.info("ISSUANCE_DRIFT_DETECTED: leave local clone running for inspection");
  }
  await logger.error(error);
  await logger.flush();
  process.exit(sawIssuanceDrift ? 2 : 1);
});

function assertMetadataAvailable() {
  const missing = [
    ["Balances.TotalIssuance", api.query.balances?.totalIssuance],
    [
      "Balances.transfer",
      api.tx.balances?.transferKeepAlive ?? api.tx.balances?.transferAllowDeath ?? api.tx.balances?.transfer,
    ],
    ["Utility.batch", api.tx.utility?.batch],
    ["SubtensorModule.TotalIssuance", api.query.subtensorModule?.totalIssuance],
    ["SubtensorModule.registerNetwork", api.tx.subtensorModule?.registerNetwork],
    ["SubtensorModule.rootDissolveNetwork", api.tx.subtensorModule?.rootDissolveNetwork],
    ["SubtensorModule.addStakeLimit", api.tx.subtensorModule?.addStakeLimit],
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.SubnetOwner", api.query.subtensorModule?.subnetOwner],
    ["SubtensorModule.SubnetTAO", api.query.subtensorModule?.subnetTAO],
    ["SubtensorModule.SubnetAlphaIn", api.query.subtensorModule?.subnetAlphaIn],
    ["SubtensorModule.SubnetProtocolAlpha", api.query.subtensorModule?.subnetProtocolAlpha],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubtensorModule.SubtokenEnabled", api.query.subtensorModule?.subtokenEnabled],
    ["SubtensorModule.SubnetLimit", api.query.subtensorModule?.subnetLimit],
    ["SubtensorModule.NetworkRateLimit", api.query.subtensorModule?.networkRateLimit],
    ["SubtensorModule.NetworkRegistrationStartBlock", api.query.subtensorModule?.networkRegistrationStartBlock],
    ["SubtensorModule.NetworkImmunityPeriod", api.query.subtensorModule?.networkImmunityPeriod],
    ["SubtensorModule.NetworkMinLockCost", api.query.subtensorModule?.networkMinLockCost],
    ["SubtensorModule.NetworkLastLockCost", api.query.subtensorModule?.networkLastLockCost],
    ["Swap.BalancerTaoReservoir", api.query.swap?.balancerTaoReservoir],
    ["Swap.BalancerAlphaReservoir", api.query.swap?.balancerAlphaReservoir],
    ["Sudo.sudo", api.tx.sudo?.sudo],
    ["System.setStorage", api.tx.system?.setStorage],
  ].filter(([, value]) => !value);

  assert.equal(
    missing.length,
    0,
    `${missing.map(([name]) => name).join(", ")} unavailable; run after upgrading the clone to the PR runtime`
  );
}

async function fundTestAccounts() {
  await signedBatch(
    sudo,
    [
      balancesTransfer(subnetOwner.address, FUND_AMOUNT),
      balancesTransfer(staker.address, FUND_AMOUNT),
    ],
    "fund reservoir deregistration accounts"
  );
  await assertIssuanceMatch("after funding transfers");
  console.log(
    "funded test accounts:",
    `owner=${subnetOwner.address}`,
    `staker=${staker.address}`,
    `amount=${FUND_AMOUNT}`
  );
}

async function captureRegistrationGlobals() {
  const [subnetLimit, rateLimit, startBlock, immunity, minLock, lastLock] = await Promise.all([
    api.query.subtensorModule.subnetLimit(),
    api.query.subtensorModule.networkRateLimit(),
    api.query.subtensorModule.networkRegistrationStartBlock(),
    api.query.subtensorModule.networkImmunityPeriod(),
    api.query.subtensorModule.networkMinLockCost(),
    api.query.subtensorModule.networkLastLockCost(),
  ]);

  return {
    subnetLimit: subnetLimit.toBigInt(),
    rateLimit: rateLimit.toBigInt(),
    startBlock: startBlock.toBigInt(),
    immunity: immunity.toBigInt(),
    minLock: minLock.toBigInt(),
    lastLock: lastLock.toBigInt(),
  };
}

async function enableSubnetRegistration() {
  const activeCount = await countNonRootSubnets();
  await sudoSetStorage(
    [
      [api.query.subtensorModule.subnetLimit.key(), storageValueHex("u16", BigInt(activeCount + 1))],
      [api.query.subtensorModule.networkRateLimit.key(), storageValueHex("u64", 0n)],
      [api.query.subtensorModule.networkRegistrationStartBlock.key(), storageValueHex("u64", 0n)],
      [api.query.subtensorModule.networkImmunityPeriod.key(), storageValueHex("u64", 0n)],
      [api.query.subtensorModule.networkMinLockCost.key(), storageValueHex("u64", NETWORK_LOCK_COST)],
      [api.query.subtensorModule.networkLastLockCost.key(), storageValueHex("u64", NETWORK_LOCK_COST)],
    ],
    "sudo enable one fresh subnet registration"
  );
  console.log("subnet registration controls lowered:", `active_count=${activeCount}`, `lock_cost=${NETWORK_LOCK_COST}`);
}

async function restoreRegistrationGlobals(globals) {
  await sudoSetStorage(
    [
      [api.query.subtensorModule.subnetLimit.key(), storageValueHex("u16", globals.subnetLimit)],
      [api.query.subtensorModule.networkRateLimit.key(), storageValueHex("u64", globals.rateLimit)],
      [api.query.subtensorModule.networkRegistrationStartBlock.key(), storageValueHex("u64", globals.startBlock)],
      [api.query.subtensorModule.networkImmunityPeriod.key(), storageValueHex("u64", globals.immunity)],
      [api.query.subtensorModule.networkMinLockCost.key(), storageValueHex("u64", globals.minLock)],
      [api.query.subtensorModule.networkLastLockCost.key(), storageValueHex("u64", globals.lastLock)],
    ],
    "sudo restore subnet registration controls"
  );
}

async function registerSubnet() {
  const result = await submitAndWait(
    subnetOwner,
    api.tx.subtensorModule.registerNetwork(ownerHotkey.address),
    "register fresh subnet"
  );
  const event = result.events.find(
    ({ event }) => event.section === "subtensorModule" && event.method === "NetworkAdded"
  );
  assert.ok(event, "registerNetwork did not emit NetworkAdded");
  const netuid = event.event.data[0].toNumber();
  assert.equal((await api.query.subtensorModule.networksAdded(netuid)).isTrue, true, "registered subnet missing");
  assert.equal((await api.query.subtensorModule.subnetOwner(netuid)).toString(), subnetOwner.address, "unexpected owner");
  console.log("registered fresh subnet:", `netuid=${netuid}`, `owner=${subnetOwner.address}`, `hotkey=${ownerHotkey.address}`);
  return netuid;
}

async function enableSubtoken(netuid) {
  await sudoSetStorage(
    [[api.query.subtensorModule.subtokenEnabled.key(netuid), storageValueHex("bool", true)]],
    `sudo enable subtoken for netuid ${netuid}`
  );
  assert.equal((await api.query.subtensorModule.subtokenEnabled(netuid)).isTrue, true, "subtoken was not enabled");
}

async function addStake(netuid) {
  const result = await submitAndWait(
    staker,
    api.tx.subtensorModule.addStakeLimit(ownerHotkey.address, netuid, STAKE_AMOUNT, MAX_PRICE, false),
    "staker addStakeLimit"
  );
  const event = result.events.find(({ event }) => {
    if (event.section !== "subtensorModule" || event.method !== "StakeAdded") return false;
    const [, eventHotkey, , alphaStaked, eventNetuid] = event.data;
    return eventHotkey.toString() === ownerHotkey.address && eventNetuid.toNumber() === netuid && alphaStaked.toBigInt() > 0n;
  });
  assert.ok(event, "StakeAdded event not found for test staker");
  const alphaAdded = event.event.data[3].toBigInt();
  console.log("staker alpha minted:", `netuid=${netuid}`, `stake_tao=${STAKE_AMOUNT}`, `alpha_added=${alphaAdded}`);
  return alphaAdded;
}

async function backAndSeedReservoirs(netuid, subnetAccount) {
  await submitAndWait(
    sudo,
    balancesTransfer(subnetAccount, RESERVOIR_TAO),
    "transfer TAO backing to subnet account for reservoir"
  );
  await sudoSetStorage(
    [
      [api.query.subtensorModule.subnetAlphaIn.key(netuid), storageValueHex("u64", PROTOCOL_ALPHA_IN)],
      [api.query.subtensorModule.subnetProtocolAlpha.key(netuid), storageValueHex("u64", 0n)],
      [api.query.swap.balancerTaoReservoir.key(netuid), storageValueHex("u64", RESERVOIR_TAO)],
      [api.query.swap.balancerAlphaReservoir.key(netuid), storageValueHex("u64", RESERVOIR_ALPHA)],
    ],
    `sudo seed non-zero protocol reservoirs on netuid ${netuid}`
  );
  await assertIssuanceMatch("after reservoir backing and seeding");
}

async function rootDissolveNetwork(netuid) {
  const result = await submitAndWait(
    sudo,
    api.tx.sudo.sudo(api.tx.subtensorModule.rootDissolveNetwork(netuid)),
    `sudo rootDissolveNetwork ${netuid}`
  );
  const removed = result.events.find(
    ({ event }) => event.section === "subtensorModule" && event.method === "NetworkRemoved"
  );
  assert.ok(removed, "rootDissolveNetwork did not emit NetworkRemoved");
  console.log("root dissolved subnet:", `netuid=${netuid}`);
}

async function snapshot(netuid, subnetAccount, label) {
  const [subnetTao, alphaIn, protocolAlpha, taoReservoir, alphaReservoir, stakerAlpha, ownerFree, stakerFree, subnetFree] =
    await Promise.all([
      api.query.subtensorModule.subnetTAO(netuid),
      api.query.subtensorModule.subnetAlphaIn(netuid),
      api.query.subtensorModule.subnetProtocolAlpha(netuid),
      api.query.swap.balancerTaoReservoir(netuid),
      api.query.swap.balancerAlphaReservoir(netuid),
      api.query.subtensorModule.totalHotkeyAlpha(ownerHotkey.address, netuid),
      freeBalance(subnetOwner.address),
      freeBalance(staker.address),
      freeBalance(subnetAccount),
    ]);

  const snap = {
    subnetTao: subnetTao.toBigInt(),
    alphaIn: alphaIn.toBigInt(),
    protocolAlpha: protocolAlpha.toBigInt(),
    taoReservoir: taoReservoir.toBigInt(),
    alphaReservoir: alphaReservoir.toBigInt(),
    stakerAlpha: stakerAlpha.toBigInt(),
    ownerFree,
    stakerFree,
    subnetFree,
  };

  console.log(
    `${label}:`,
    `subnet_tao=${snap.subnetTao}`,
    `alpha_in=${snap.alphaIn}`,
    `protocol_alpha=${snap.protocolAlpha}`,
    `tao_reservoir=${snap.taoReservoir}`,
    `alpha_reservoir=${snap.alphaReservoir}`,
    `staker_alpha=${snap.stakerAlpha}`,
    `owner_free=${snap.ownerFree}`,
    `staker_free=${snap.stakerFree}`,
    `subnet_free=${snap.subnetFree}`
  );
  return snap;
}

async function assertIssuanceMatch(label) {
  const [balancesIssuance, subtensorIssuance] = await Promise.all([
    api.query.balances.totalIssuance(),
    api.query.subtensorModule.totalIssuance(),
  ]);
  const balances = balancesIssuance.toBigInt();
  const subtensor = subtensorIssuance.toBigInt();
  if (subtensor !== balances) {
    sawIssuanceDrift = true;
  }
  assert.equal(
    subtensor,
    balances,
    `${label}: SubtensorModule.TotalIssuance ${subtensor} does not match Balances.TotalIssuance ${balances}`
  );
  console.log(`${label}: issuance match`, balances.toString());
}

async function countNonRootSubnets() {
  const entries = await api.query.subtensorModule.networksAdded.entries();
  return entries.filter(([key, added]) => key.args[0].toNumber() !== 0 && added.isTrue).length;
}

async function getSubnetAccountId(netuid) {
  const encoded = await api._rpcCore.provider.send("subnetInfo_getSubnetAccountId", [netuid, null]);
  const account = api.createType("Option<AccountId32>", Uint8Array.from(encoded));
  assert.ok(account.isSome, `subnet account id not found for netuid ${netuid}`);
  return account.unwrap().toString();
}

async function freeBalance(address) {
  return (await api.query.system.account(address)).data.free.toBigInt();
}

async function sudoSetStorage(entries, label) {
  return submitAndWait(sudo, api.tx.sudo.sudo(api.tx.system.setStorage(entries)), label);
}

async function signedBatch(signer, calls, label) {
  const batched = api.tx.utility?.batchAll ? api.tx.utility.batchAll(calls) : api.tx.utility.batch(calls);
  return submitAndWait(signer, batched, label);
}

async function submitAndWait(signer, tx, label) {
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

      if (status.isInBlock || status.isFinalized) {
        const blockHash = status.isFinalized ? status.asFinalized.toString() : status.asInBlock.toString();
        finish(resolve, { blockHash, events });
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => finish(reject, error));
  });
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

function storageValueHex(type, value) {
  return u8aToHex(api.createType(type, value).toU8a());
}

function formatDispatchError(error) {
  if (!error.isModule) {
    return error.toString();
  }
  const decoded = api.registry.findMetaError(error.asModule);
  return `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
}
