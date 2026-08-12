import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.ADD_STAKE_LIMIT_REFUND_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const FUND_SOURCE_URI = process.env.ADD_STAKE_LIMIT_REFUND_FUND_SOURCE_URI ?? "//Alice";
const OWNER_URI = process.env.ADD_STAKE_LIMIT_REFUND_OWNER_URI ?? `//AddStakeLimitRefund//${RUN_ID}//owner`;
const OWNER_HOTKEY_URI =
  process.env.ADD_STAKE_LIMIT_REFUND_OWNER_HOTKEY_URI ?? `//AddStakeLimitRefund//${RUN_ID}//owner-hotkey`;
const STAKER_URI = process.env.ADD_STAKE_LIMIT_REFUND_STAKER_URI ?? `//AddStakeLimitRefund//${RUN_ID}//staker`;
const OWNER_EXTRA_FUND_AMOUNT = BigInt(process.env.ADD_STAKE_LIMIT_REFUND_OWNER_EXTRA_FUND_AMOUNT ?? "100000000000");
const STAKER_FUND_AMOUNT = BigInt(process.env.ADD_STAKE_LIMIT_REFUND_STAKER_FUND_AMOUNT ?? "1500000000000");
const REQUESTED_STAKE = BigInt(process.env.ADD_STAKE_LIMIT_REFUND_REQUESTED_STAKE ?? "900000000000");
const PRICE_MULTIPLIER = BigInt(process.env.ADD_STAKE_LIMIT_REFUND_PRICE_MULTIPLIER ?? "2");

const keyring = new Keyring({ type: "sr25519" });
const fundSource = keyring.addFromUri(FUND_SOURCE_URI);
const owner = keyring.addFromUri(OWNER_URI);
const ownerHotkey = keyring.addFromUri(OWNER_HOTKEY_URI);
const staker = keyring.addFromUri(STAKER_URI);
const logger = createTempLogger("test-add-stake-limit-unused-refund-localnet.log");
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
    const header = await api.rpc.chain.getHeader();
    console.log("chain:", chain.toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("start block:", header.number.toString());
    console.log("run id:", RUN_ID);
    console.log("owner:", owner.address);
    console.log("owner hotkey:", ownerHotkey.address);
    console.log("staker:", staker.address);

    await fundTestAccounts();
    const netuid = await registerSubnet();
    const subnetAccount = await getSubnetAccountId(netuid);
    await ensureSubtokenEnabled(netuid);

    const currentPrice = await currentAlphaPrice(netuid);
    const limitPrice = currentPrice * PRICE_MULTIPLIER;
    console.log("stake setup:", `netuid=${netuid}`, `subnetAccount=${subnetAccount}`);
    console.log("price limit:", `current=${currentPrice}`, `limit=${limitPrice}`);
    assert.ok(limitPrice > currentPrice, "limit price must be above the current price");

    const before = await snapshot(netuid, subnetAccount);
    const result = await submitAndWait(
      staker,
      api.tx.subtensorModule.addStakeLimit(ownerHotkey.address, netuid, REQUESTED_STAKE, limitPrice, true),
      "partial addStakeLimit"
    );
    const after = await snapshot(netuid, subnetAccount);
    const stakeAdded = stakeAddedFromEvents(result.events, ownerHotkey.address, netuid);
    const txFee = transactionFeePaidFromEvents(result.events, staker.address);

    assert.ok(stakeAdded.tao > 0n, "addStakeLimit should execute a non-zero TAO amount");
    assert.ok(stakeAdded.alpha > 0n, "addStakeLimit should stake non-zero alpha");
    assert.ok(
      stakeAdded.tao < REQUESTED_STAKE,
      `order did not hit limit price: executed ${stakeAdded.tao}, requested ${REQUESTED_STAKE}`
    );

    const userFreeSpent = before.stakerFree - after.stakerFree;
    const subnetFreeDelta = after.subnetFree - before.subnetFree;
    const subnetTaoDelta = after.subnetTao - before.subnetTao;
    const hotkeyAlphaDelta = after.hotkeyAlpha - before.hotkeyAlpha;
    const expectedUserSpent = stakeAdded.tao + txFee;

    assert.equal(hotkeyAlphaDelta, stakeAdded.alpha, "TotalHotkeyAlpha delta should equal StakeAdded alpha");
    assert.equal(userFreeSpent, expectedUserSpent, "staker free balance should decrease only by executed stake plus tx fee");
    assert.ok(
      userFreeSpent < REQUESTED_STAKE,
      `unused requested amount was not preserved in staker free balance: spent ${userFreeSpent}, requested ${REQUESTED_STAKE}`
    );
    assert.equal(
      subnetFreeDelta,
      subnetTaoDelta,
      "subnet account free balance should not retain TAO beyond the SubnetTAO reserve delta"
    );
    assert.ok(
      subnetFreeDelta < REQUESTED_STAKE,
      `subnet account retained the full requested stake: delta ${subnetFreeDelta}, requested ${REQUESTED_STAKE}`
    );
    assert.equal(after.balancesIssuance, before.balancesIssuance, "Balances.TotalIssuance changed during addStakeLimit");
    assert.equal(
      after.subtensorIssuance,
      before.subtensorIssuance,
      "SubtensorModule.TotalIssuance changed during addStakeLimit"
    );

    console.log(
      "partial addStakeLimit refund check: ok",
      `netuid=${netuid}`,
      `requested=${REQUESTED_STAKE}`,
      `executedTao=${stakeAdded.tao}`,
      `alpha=${stakeAdded.alpha}`,
      `txFee=${txFee}`,
      `userFreeSpent=${userFreeSpent}`,
      `subnetFreeDelta=${subnetFreeDelta}`,
      `subnetTaoDelta=${subnetTaoDelta}`,
      `balancesIssuance=${after.balancesIssuance}`,
      `subtensorIssuance=${after.subtensorIssuance}`
    );
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
    ["Balances.transfer", balancesTransfer],
    ["Balances.TotalIssuance", api.query.balances?.totalIssuance],
    ["SubtensorModule.addStakeLimit", api.tx.subtensorModule?.addStakeLimit],
    ["SubtensorModule.registerNetwork", api.tx.subtensorModule?.registerNetwork],
    ["SubtensorModule.startCall", api.tx.subtensorModule?.startCall],
    ["SubtensorModule.NetworkLastLockCost", api.query.subtensorModule?.networkLastLockCost],
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.NetworkRateLimit", api.query.subtensorModule?.networkRateLimit],
    ["SubtensorModule.NetworkRegistrationStartBlock", api.query.subtensorModule?.networkRegistrationStartBlock],
    ["SubtensorModule.SubnetAlphaIn", api.query.subtensorModule?.subnetAlphaIn],
    ["SubtensorModule.SubnetLimit", api.query.subtensorModule?.subnetLimit],
    ["SubtensorModule.SubnetTAO", api.query.subtensorModule?.subnetTAO],
    ["SubtensorModule.SubtokenEnabled", api.query.subtensorModule?.subtokenEnabled],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["SubtensorModule.TotalIssuance", api.query.subtensorModule?.totalIssuance],
    ["Sudo.sudo", api.tx.sudo?.sudo],
    ["System.setStorage", api.tx.system?.setStorage],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `${missing.map(([name]) => name).join(", ")} unavailable`);
}

async function waitForBlockProduction() {
  const observed = [];
  let previous = (await api.rpc.chain.getHeader()).number.toBigInt();
  const deadline = Date.now() + 180_000;

  while (Date.now() < deadline && observed.length < 2) {
    await sleep(3_000);
    const current = (await api.rpc.chain.getHeader()).number.toBigInt();
    if (current > previous) {
      observed.push(current);
      previous = current;
      console.log("observed produced block:", current.toString());
    }
  }

  assert.equal(observed.length, 2, `block production did not advance twice; observed ${observed.length} advances`);
}

async function fundTestAccounts() {
  const ownerAmount = (await networkLockCost()) + OWNER_EXTRA_FUND_AMOUNT;
  await submitAndWait(fundSource, balancesTransfer(owner.address, ownerAmount), "fund subnet owner");
  await submitAndWait(fundSource, balancesTransfer(staker.address, STAKER_FUND_AMOUNT), "fund staker");

  const ownerFree = await freeBalance(owner.address);
  const stakerFree = await freeBalance(staker.address);
  assert.ok(ownerFree >= ownerAmount, `owner funding failed: ${ownerFree} < ${ownerAmount}`);
  assert.ok(stakerFree >= REQUESTED_STAKE, `staker funding failed: ${stakerFree} < ${REQUESTED_STAKE}`);
  console.log("funded:", `ownerFree=${ownerFree}`, `stakerFree=${stakerFree}`);
}

async function registerSubnet() {
  await prepareSubnetRegistration();
  const result = await submitAndWait(owner, api.tx.subtensorModule.registerNetwork(ownerHotkey.address), "registerNetwork");
  const event = result.events.find(
    ({ event }) => event.section === "subtensorModule" && event.method === "NetworkAdded"
  );
  assert.ok(event, "registerNetwork did not emit NetworkAdded");
  const netuid = event.event.data[0].toNumber();
  assert.equal((await api.query.subtensorModule.networksAdded(netuid)).isTrue, true, `netuid ${netuid} was not added`);
  console.log("registered subnet:", netuid);
  return netuid;
}

async function prepareSubnetRegistration() {
  const activeCount = await activeNonRootSubnetCount();
  const subnetLimit = (await api.query.subtensorModule.subnetLimit()).toNumber();
  const targetLimit = Math.max(subnetLimit, activeCount + 1);
  await submitAndWait(
    fundSource,
    api.tx.sudo.sudo(api.tx.system.setStorage([
      [api.query.subtensorModule.subnetLimit.key(), storageValueHex("u16", targetLimit)],
      [api.query.subtensorModule.networkRateLimit.key(), storageValueHex("u64", 0n)],
      [api.query.subtensorModule.networkRegistrationStartBlock.key(), storageValueHex("u64", 0n)],
    ])),
    "sudo prepare subnet registration"
  );
  console.log("registration settings:", `subnetLimit=${targetLimit}`, "networkRateLimit=0", "startBlock=0");
}

async function activeNonRootSubnetCount() {
  const entries = await api.query.subtensorModule.networksAdded.entries();
  return entries.filter(([key, added]) => key.args[0].toNumber() !== 0 && added.isTrue).length;
}

async function ensureSubtokenEnabled(netuid) {
  if ((await api.query.subtensorModule.subtokenEnabled(netuid)).isTrue) {
    console.log("subtoken already enabled:", netuid);
    return;
  }

  await submitAndWait(owner, api.tx.subtensorModule.startCall(netuid), "startCall");
  assert.equal((await api.query.subtensorModule.subtokenEnabled(netuid)).isTrue, true, "startCall did not enable subtoken");
  console.log("subtoken enabled:", netuid);
}

async function snapshot(netuid, subnetAccount) {
  const [stakerAccount, subnetAccountInfo, subnetTao, hotkeyAlpha, balancesIssuance, subtensorIssuance] =
    await Promise.all([
      api.query.system.account(staker.address),
      api.query.system.account(subnetAccount),
      api.query.subtensorModule.subnetTAO(netuid),
      api.query.subtensorModule.totalHotkeyAlpha(ownerHotkey.address, netuid),
      api.query.balances.totalIssuance(),
      api.query.subtensorModule.totalIssuance(),
    ]);

  const state = {
    stakerFree: stakerAccount.data.free.toBigInt(),
    subnetFree: subnetAccountInfo.data.free.toBigInt(),
    subnetTao: subnetTao.toBigInt(),
    hotkeyAlpha: hotkeyAlpha.toBigInt(),
    balancesIssuance: balancesIssuance.toBigInt(),
    subtensorIssuance: subtensorIssuance.toBigInt(),
  };
  console.log(
    "snapshot:",
    `stakerFree=${state.stakerFree}`,
    `subnetFree=${state.subnetFree}`,
    `subnetTao=${state.subnetTao}`,
    `hotkeyAlpha=${state.hotkeyAlpha}`,
    `balancesIssuance=${state.balancesIssuance}`,
    `subtensorIssuance=${state.subtensorIssuance}`
  );
  return state;
}

function stakeAddedFromEvents(events, hotkey, netuid) {
  const event = events.find(({ event }) => {
    if (event.section !== "subtensorModule" || event.method !== "StakeAdded") return false;
    const [, eventHotkey, taoStaked, alphaStaked, eventNetuid] = event.data;
    return eventHotkey.toString() === hotkey && eventNetuid.toNumber() === netuid && taoStaked.toBigInt() > 0n && alphaStaked.toBigInt() > 0n;
  });
  assert.ok(event, `StakeAdded event not found for hotkey ${hotkey} on netuid ${netuid}`);
  return {
    tao: event.event.data[2].toBigInt(),
    alpha: event.event.data[3].toBigInt(),
    fee: event.event.data[5]?.toBigInt() ?? 0n,
  };
}

function transactionFeePaidFromEvents(events, signer) {
  const event = events.find(({ event }) => event.section === "transactionPayment" && event.method === "TransactionFeePaid");
  if (!event) {
    console.log("TransactionFeePaid event not found; assuming zero tx fee");
    return 0n;
  }

  const [who, actualFee] = event.event.data;
  assert.equal(who.toString(), signer, "TransactionFeePaid signer did not match staker");
  return actualFee.toBigInt();
}

async function getSubnetAccountId(netuid) {
  const encoded = await api._rpcCore.provider.send("subnetInfo_getSubnetAccountId", [netuid, null]);
  const account = api.createType("Option<AccountId32>", Uint8Array.from(encoded));
  assert.ok(account.isSome, `subnet account id not found for netuid ${netuid}`);
  return account.unwrap().toString();
}

async function currentAlphaPrice(netuid) {
  const value = await api._rpcCore.provider.send("swap_currentAlphaPrice", [netuid, null]);
  return BigInt(value.toString());
}

async function networkLockCost() {
  try {
    const value = await api._rpcCore.provider.send("subnetInfo_getLockCost", []);
    return BigInt(value.toString());
  } catch {
    return (await api.query.subtensorModule.networkLastLockCost()).toBigInt();
  }
}

async function freeBalance(address) {
  return (await api.query.system.account(address)).data.free.toBigInt();
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

async function submitAndWait(signer, tx, label) {
  console.log("submitting:", label);
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      try {
        unsubscribe?.();
      } catch {
        // ignore unsubscribe races
      }
      fn(value);
    };

    tx.signAndSend(signer, ({ status, dispatchError, events }) => {
      if (dispatchError) {
        finish(reject, new Error(`${label} dispatch failed: ${formatDispatchError(dispatchError)}`));
        return;
      }

      if (status.isInBlock || status.isFinalized) {
        const failed = events.find(({ event }) => event.section === "system" && event.method === "ExtrinsicFailed");
        if (failed) {
          finish(reject, new Error(`${label} extrinsic failed: ${formatDispatchError(failed.event.data[0])}`));
          return;
        }

        for (const { event } of events) {
          if (["balances", "subtensorModule", "system", "transactionPayment"].includes(event.section)) {
            console.log("event:", event.section, event.method, event.data.toString());
          }
        }
        finish(resolve, { status, events });
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => finish(reject, error));
  });
}

function formatDispatchError(dispatchError) {
  if (dispatchError.isModule) {
    const decoded = api.registry.findMetaError(dispatchError.asModule);
    return `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
  }
  return dispatchError.toString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
