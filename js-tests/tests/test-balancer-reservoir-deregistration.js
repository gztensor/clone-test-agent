import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";
import { clearLastRateLimitedBlocks } from "../lib/rate-limit-storage.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.RESERVOIR_DEREG_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const FUND_AMOUNT = BigInt(process.env.RESERVOIR_DEREG_FUND_AMOUNT ?? "10000000000000");
const NETWORK_LOCK_COST = BigInt(process.env.RESERVOIR_DEREG_NETWORK_LOCK_COST ?? "1000000000");
const BASE_SUBNET_TAO = BigInt(process.env.RESERVOIR_DEREG_BASE_SUBNET_TAO ?? "2000000000");
const TAO_RESERVOIR = BigInt(process.env.RESERVOIR_DEREG_TAO_RESERVOIR ?? "3000000000");
const BASE_ALPHA_IN = BigInt(process.env.RESERVOIR_DEREG_BASE_ALPHA_IN ?? "0");
const BASE_ALPHA_OUT = BigInt(process.env.RESERVOIR_DEREG_BASE_ALPHA_OUT ?? "0");
const ALPHA_RESERVOIR = BigInt(process.env.RESERVOIR_DEREG_ALPHA_RESERVOIR ?? "700000000");
const STAKER_ALPHA = BigInt(process.env.RESERVOIR_DEREG_STAKER_ALPHA ?? "9000000000");
const I96F32_ZERO_STORAGE = `0x${"00".repeat(16)}`;

const keyring = new Keyring({ type: "sr25519" });
const alice = keyring.addFromUri(process.env.SUDO_URI ?? "//Alice");
const owner = keyring.addFromUri(`//BalancerReservoirDereg//${RUN_ID}//owner`);
const ownerHotkey = keyring.addFromUri(`//BalancerReservoirDereg//${RUN_ID}//owner-hotkey`);
const staker = keyring.addFromUri(`//BalancerReservoirDereg//${RUN_ID}//staker`);
const stakerHotkey = keyring.addFromUri(`//BalancerReservoirDereg//${RUN_ID}//staker-hotkey`);
const logger = createTempLogger("test-balancer-reservoir-deregistration.log");
logger.captureConsole();

let api;

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

    if (!assertMetadataAvailable()) {
      return;
    }

    await repairIssuanceMirrorIfNeeded("pre-test setup");
    await fundAccounts();
    await assertIssuanceMatch("initial");
    await prepareRegistration();

    const netuid = await registerSubnet();
    await setupReservoirFixture(netuid);

    const before = await snapshot(netuid);
    console.log(
      "before deregistration:",
      `netuid=${netuid}`,
      `subnetAccount=${before.subnetAccount}`,
      `subnetFree=${before.subnetFree}`,
      `subnetTAO=${before.subnetTao}`,
      `taoReservoir=${before.taoReservoir}`,
      `alphaReservoir=${before.alphaReservoir}`,
      `ownerFree=${before.ownerFree}`,
      `stakerFree=${before.stakerFree}`
    );
    assert.equal(before.taoReservoir, TAO_RESERVOIR, "forced BalancerTaoReservoir was not non-zero");
    assert.equal(before.alphaReservoir, ALPHA_RESERVOIR, "forced BalancerAlphaReservoir was not non-zero");

    await submitAndWait(alice, api.tx.sudo.sudo(api.tx.subtensorModule.rootDissolveNetwork(netuid)), "sudo root_dissolve_network");
    await assertIssuanceMatch("after root_dissolve_network");

    const after = await snapshot(netuid);
    const ownerGain = after.ownerFree - before.ownerFree;
    const stakerGain = after.stakerFree - before.stakerFree;
    const combinedRecipientGain = ownerGain + stakerGain;
    const expectedRecipientGain = ((BASE_SUBNET_TAO + TAO_RESERVOIR) * STAKER_ALPHA) / (STAKER_ALPHA + ALPHA_RESERVOIR);

    console.log(
      "after deregistration:",
      `netuid=${netuid}`,
      `networkAdded=${after.networkAdded}`,
      `subnetTAO=${after.subnetTao}`,
      `taoReservoir=${after.taoReservoir}`,
      `alphaReservoir=${after.alphaReservoir}`,
      `ownerFree=${after.ownerFree}`,
      `stakerFree=${after.stakerFree}`,
      `ownerGain=${ownerGain}`,
      `stakerGain=${stakerGain}`,
      `combinedRecipientGain=${combinedRecipientGain}`
    );

    assert.equal(after.networkAdded, false, "subnet should be deregistered");
    assert.equal(after.taoReservoir, 0n, "BalancerTaoReservoir should be cleared during deregistration");
    assert.equal(after.alphaReservoir, 0n, "BalancerAlphaReservoir should be cleared during deregistration");
    assert.ok(
      combinedRecipientGain >= expectedRecipientGain,
      `reservoir TAO was not returned according to reservoir-aware alpha weights: gain=${combinedRecipientGain}, expected at least ${expectedRecipientGain}`
    );

    await assertIssuanceMatch("final");
    console.log("balancer reservoir deregistration scenario: ok");
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
  if (!api.query.swap?.balancerTaoReservoir || !api.query.swap?.balancerAlphaReservoir) {
    console.log(
      "balancer reservoir deregistration scenario: skipped missing PR reservoir storage",
      `available_swap_storage=${Object.keys(api.query.swap ?? {}).sort().join(",")}`
    );
    return false;
  }

  const missing = [
    ["Balances.TotalIssuance", api.query.balances?.totalIssuance],
    ["Balances.transfer", api.tx.balances?.transferKeepAlive ?? api.tx.balances?.transferAllowDeath ?? api.tx.balances?.transfer],
    ["SubtensorModule.TotalIssuance", api.query.subtensorModule?.totalIssuance],
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.SubnetTAO", api.query.subtensorModule?.subnetTAO],
    ["SubtensorModule.SubnetAlphaIn", api.query.subtensorModule?.subnetAlphaIn],
    ["SubtensorModule.SubnetAlphaOut", api.query.subtensorModule?.subnetAlphaOut],
    ["SubtensorModule.SubnetProtocolAlpha", api.query.subtensorModule?.subnetProtocolAlpha],
    ["SubtensorModule.Alpha", api.query.subtensorModule?.alpha],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubtensorModule.TotalHotkeyShares", api.query.subtensorModule?.totalHotkeyShares],
    ["SubtensorModule.SubnetLimit", api.query.subtensorModule?.subnetLimit],
    ["SubtensorModule.NetworkRateLimit", api.query.subtensorModule?.networkRateLimit],
    ["SubtensorModule.NetworkRegistrationStartBlock", api.query.subtensorModule?.networkRegistrationStartBlock],
    ["SubtensorModule.NetworkImmunityPeriod", api.query.subtensorModule?.networkImmunityPeriod],
    ["SubtensorModule.NetworkMinLockCost", api.query.subtensorModule?.networkMinLockCost],
    ["SubtensorModule.NetworkLastLockCost", api.query.subtensorModule?.networkLastLockCost],
    ["SubtensorModule.NetworkRegisteredAt", api.query.subtensorModule?.networkRegisteredAt],
    ["SubtensorModule.SubnetMovingPrice", api.query.subtensorModule?.subnetMovingPrice],
    ["SubtensorModule.registerNetwork", api.tx.subtensorModule?.registerNetwork],
    ["SubtensorModule.rootDissolveNetwork", api.tx.subtensorModule?.rootDissolveNetwork],
    ["Sudo.sudo", api.tx.sudo?.sudo],
    ["System.setStorage", api.tx.system?.setStorage],
    ["Utility.batch", api.tx.utility?.batch],
    ["Swap.BalancerTaoReservoir", api.query.swap?.balancerTaoReservoir],
    ["Swap.BalancerAlphaReservoir", api.query.swap?.balancerAlphaReservoir],
  ].filter(([, value]) => !value);

  assert.equal(
    missing.length,
    0,
    `${missing.map(([name]) => name).join(", ")} unavailable; run after upgrading the clone to the PR runtime`
  );
  return true;
}

async function fundAccounts() {
  await signedBatch(alice, [owner.address, staker.address].map((address) => balancesTransfer(address, FUND_AMOUNT)), "fund reservoir deregistration accounts");
  console.log("funded accounts:", `owner=${owner.address}`, `staker=${staker.address}`, `amount=${FUND_AMOUNT}`);
}

async function prepareRegistration() {
  const activeCount = await activeNonRootSubnetCount();
  await sudoSetStorage(
    [
      [api.query.subtensorModule.subnetLimit.key(), storageValueHex("u16", activeCount + 1)],
      [api.query.subtensorModule.networkRateLimit.key(), storageValueHex("u64", 0n)],
      [api.query.subtensorModule.networkRegistrationStartBlock.key(), storageValueHex("u64", 0n)],
      [api.query.subtensorModule.networkImmunityPeriod.key(), storageValueHex("u64", 0n)],
      [api.query.subtensorModule.networkMinLockCost.key(), storageValueHex("u64", NETWORK_LOCK_COST)],
      [api.query.subtensorModule.networkLastLockCost.key(), storageValueHex("u64", NETWORK_LOCK_COST)],
    ],
    "sudo enable subnet registration"
  );
  const cleared = await clearLastRateLimitedBlocks(api, alice, submitAndWait, "clear registration rate limits");
  console.log("registration prepared:", `activeCount=${activeCount}`, `rateLimitClearMode=${cleared.mode}`);
}

async function registerSubnet() {
  const result = await submitAndWait(owner, api.tx.subtensorModule.registerNetwork(ownerHotkey.address), "registerNetwork");
  const event = result.events.find(
    ({ event }) => event.section === "subtensorModule" && event.method === "NetworkAdded"
  );
  assert.ok(event, "registerNetwork did not emit NetworkAdded");
  const netuid = event.event.data[0].toNumber();
  assert.equal((await api.query.subtensorModule.networksAdded(netuid)).isTrue, true, "registered subnet missing");
  console.log("registered subnet:", `netuid=${netuid}`, `owner=${owner.address}`, `ownerHotkey=${ownerHotkey.address}`);
  return netuid;
}

async function setupReservoirFixture(netuid) {
  const subnetAccount = await getSubnetAccountId(netuid);
  await sudoSetStorage(
    [
      [api.query.subtensorModule.networkRegisteredAt.key(netuid), storageValueHex("u64", 0n)],
      [api.query.subtensorModule.subnetMovingPrice.key(netuid), I96F32_ZERO_STORAGE],
      [api.query.subtensorModule.subnetTAO.key(netuid), storageValueHex("u64", BASE_SUBNET_TAO)],
      [api.query.subtensorModule.subnetAlphaIn.key(netuid), storageValueHex("u64", BASE_ALPHA_IN)],
      [api.query.subtensorModule.subnetAlphaOut.key(netuid), storageValueHex("u64", BASE_ALPHA_OUT)],
      [api.query.subtensorModule.subnetProtocolAlpha.key(netuid), storageValueHex("u64", 0n)],
      [api.query.subtensorModule.totalHotkeyAlpha.key(stakerHotkey.address, netuid), storageValueHex("u64", STAKER_ALPHA)],
      [api.query.subtensorModule.totalHotkeyShares.key(stakerHotkey.address, netuid), storageValueHex("u128", u64f64Bits(STAKER_ALPHA))],
      [api.query.subtensorModule.alpha.key(stakerHotkey.address, staker.address, netuid), storageValueHex("u128", u64f64Bits(STAKER_ALPHA))],
      [api.query.swap.balancerTaoReservoir.key(netuid), storageValueHex("u64", TAO_RESERVOIR)],
      [api.query.swap.balancerAlphaReservoir.key(netuid), storageValueHex("u64", ALPHA_RESERVOIR)],
    ],
    "sudo force reservoir deregistration fixture"
  );
  await submitAndWait(
    alice,
    balancesTransfer(subnetAccount, BASE_SUBNET_TAO + TAO_RESERVOIR),
    "fund subnet account with base TAO and TAO reservoir"
  );
  console.log(
    "fixture prepared:",
    `netuid=${netuid}`,
    `subnetAccount=${subnetAccount}`,
    `baseSubnetTao=${BASE_SUBNET_TAO}`,
    `taoReservoir=${TAO_RESERVOIR}`,
    `alphaReservoir=${ALPHA_RESERVOIR}`,
    `stakerAlpha=${STAKER_ALPHA}`
  );
}

async function snapshot(netuid) {
  const subnetAccount = await getSubnetAccountId(netuid);
  const [networkAdded, subnetAccountInfo, ownerInfo, stakerInfo, subnetTao, taoReservoir, alphaReservoir] =
    await Promise.all([
      api.query.subtensorModule.networksAdded(netuid),
      api.query.system.account(subnetAccount),
      api.query.system.account(owner.address),
      api.query.system.account(staker.address),
      api.query.subtensorModule.subnetTAO(netuid),
      api.query.swap.balancerTaoReservoir(netuid),
      api.query.swap.balancerAlphaReservoir(netuid),
    ]);
  return {
    subnetAccount,
    networkAdded: networkAdded.isTrue,
    subnetFree: subnetAccountInfo.data.free.toBigInt(),
    ownerFree: ownerInfo.data.free.toBigInt(),
    stakerFree: stakerInfo.data.free.toBigInt(),
    subnetTao: subnetTao.toBigInt(),
    taoReservoir: taoReservoir.toBigInt(),
    alphaReservoir: alphaReservoir.toBigInt(),
  };
}

async function activeNonRootSubnetCount() {
  const entries = await api.query.subtensorModule.networksAdded.entries();
  return entries.filter(([key, added]) => key.args[0].toNumber() !== 0 && added.isTrue).length;
}

async function getSubnetAccountId(netuid) {
  const encoded = await api._rpcCore.provider.send("subnetInfo_getSubnetAccountId", [netuid, null]);
  const account = api.createType("Option<AccountId32>", Uint8Array.from(encoded));
  assert.ok(account.isSome, `subnet account id not found for netuid ${netuid}`);
  return account.unwrap().toString();
}

async function repairIssuanceMirrorIfNeeded(label) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const balances = (await api.query.balances.totalIssuance()).toBigInt();
    const subtensor = (await api.query.subtensorModule.totalIssuance()).toBigInt();
    const diff = balances - subtensor;
    if (diff === 0n) {
      console.log(`${label}: issuance matched`, balances.toString());
      return;
    }

    const target = diff > 0n ? balances + diff : balances;
    console.log(
      `${label}: repairing issuance mirror`,
      `attempt=${attempt}`,
      `balances=${balances}`,
      `subtensor=${subtensor}`,
      `diff=${diff}`
    );
    await submitAndWait(
      alice,
      api.tx.sudo.sudo(api.tx.system.setStorage([
        [api.query.subtensorModule.totalIssuance.key(), storageValueHex("u64", target)],
      ])),
      `sudo repair Subtensor TotalIssuance mirror attempt ${attempt}`
    );
  }

  await assertIssuanceMatch(`${label} repaired`);
}

async function assertIssuanceMatch(label) {
  const [balancesIssuance, subtensorIssuance] = await Promise.all([
    api.query.balances.totalIssuance(),
    api.query.subtensorModule.totalIssuance(),
  ]);
  const balances = balancesIssuance.toBigInt();
  const subtensor = subtensorIssuance.toBigInt();
  assert.equal(
    subtensor,
    balances,
    `${label}: SubtensorModule.TotalIssuance ${subtensor} does not match Balances.TotalIssuance ${balances}`
  );
  console.log(`${label}: issuance match`, balances.toString());
}

async function sudoBatch(calls, label) {
  const batched = api.tx.utility.batchAll ? api.tx.utility.batchAll(calls) : api.tx.utility.batch(calls);
  await submitAndWait(alice, api.tx.sudo.sudo(batched), label);
}

async function signedBatch(signer, calls, label) {
  const batched = api.tx.utility.batchAll ? api.tx.utility.batchAll(calls) : api.tx.utility.batch(calls);
  await submitAndWait(signer, batched, label);
}

async function sudoSetStorage(entries, label) {
  await submitAndWait(alice, api.tx.sudo.sudo(api.tx.system.setStorage(entries)), label);
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

function formatDispatchError(error) {
  if (!error.isModule) {
    return error.toString();
  }

  const decoded = api.registry.findMetaError(error.asModule);
  return `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
}

function storageValueHex(type, value) {
  return u8aToHex(api.createType(type, value).toU8a());
}

function u64f64Bits(value) {
  return value << 64n;
}
