import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.LOCALNET_ALPHA_DRAIN_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const MIN_STAKE_TAO = 2_000_000n;
const MINIMUM_BUY_SEARCH_WINDOW = 100n;
const SWAP_MINIMUM_RESERVE = 1_000_000n;
const MAX_PRICE = 18_446_744_073_709_551_615n;
const LONG_TERM_WAIT_BLOCKS = Number(process.env.LONG_TERM_WAIT_BLOCKS ?? 30);

const keyring = new Keyring({ type: "sr25519" });
const alice = keyring.addFromUri("//Alice");
const ownerHotkey = keyring.addFromUri(`//AlphaReserveDrain//${RUN_ID}//owner-hotkey`);
const logger = createTempLogger("test-localnet-subnet-alpha-reserve-drain.log");
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
    console.log("owner coldkey:", alice.address);
    console.log("owner hotkey:", ownerHotkey.address);

    assertMetadataAvailable();
    await assertAliceIsSudo();
    await prepareSubnetRegistration();

    const netuid = await registerSubnet();
    await enableSubtoken(netuid);
    const initial = await readReserves(netuid);
    console.log("created netuid:", netuid);
    console.log("initial reserves:", formatReserves(initial));
    assert.ok(
      initial.alphaIn >= SWAP_MINIMUM_RESERVE,
      `fresh subnet alpha reserve should start at or above ${SWAP_MINIMUM_RESERVE}, got ${initial.alphaIn}`
    );

    const { amount: minimumDrainTao, result: drainResult, rejected } = await executeSmallestAcceptedBuy(netuid);
    const alphaBought = stakeAddedFromEvents(drainResult.events, ownerHotkey.address, netuid);
    const afterDrain = await readReserves(netuid);
    console.log("pre-drain rejected buy amounts:", rejected.map((amount) => amount.toString()).join(", "));
    console.log("minimum accepted drain buy:", `${minimumDrainTao} rao`);
    console.log("alpha bought:", alphaBought.toString());
    console.log("reserves after drain:", formatReserves(afterDrain));
    assert.ok(alphaBought > 0n, "minimum buy should buy positive alpha");
    assert.ok(
      afterDrain.alphaIn < SWAP_MINIMUM_RESERVE,
      `expected alpha reserve below ${SWAP_MINIMUM_RESERVE}, got ${afterDrain.alphaIn}`
    );

    await expectDispatchError(
      api.tx.subtensorModule.addStakeLimit(ownerHotkey.address, netuid, MIN_STAKE_TAO, MAX_PRICE, false),
      "buy after alpha reserve below minimum",
      "ReservesTooLow"
    );
    console.log("post-drain buy rejected with reserve error:", `alpha_in=${afterDrain.alphaIn}`);

    const waitStart = await currentBlockNumber();
    await waitForBlocks(LONG_TERM_WAIT_BLOCKS);
    const waitEnd = await currentBlockNumber();
    const afterWait = await readReserves(netuid);
    console.log(
      "reserves after no-user-action wait:",
      `start_block=${waitStart}`,
      `end_block=${waitEnd}`,
      `waited_blocks=${waitEnd - waitStart}`,
      formatReserves(afterWait)
    );
    assert.ok(
      afterWait.alphaIn < SWAP_MINIMUM_RESERVE,
      `expected alpha reserve to stay below ${SWAP_MINIMUM_RESERVE} without user action, got ${afterWait.alphaIn}`
    );

    await expectDispatchError(
      api.tx.subtensorModule.addStakeLimit(ownerHotkey.address, netuid, MIN_STAKE_TAO, MAX_PRICE, false),
      "buy after waiting without user action",
      "ReservesTooLow"
    );
    console.log("post-wait buy still rejected with reserve error:", `alpha_in=${afterWait.alphaIn}`);
    console.log("localnet subnet alpha reserve drain: ok");
  } finally {
    await api?.disconnect();
    await logger.flush();
  }
}

main().catch(async (err) => {
  await logger.error(err);
  await logger.flush();
  process.exit(1);
});

function assertMetadataAvailable() {
  const missing = [
    ["Sudo.sudo", api.tx.sudo?.sudo],
    ["System.setStorage", api.tx.system?.setStorage],
    ["SubtensorModule.registerNetwork", api.tx.subtensorModule?.registerNetwork],
    ["SubtensorModule.addStakeLimit", api.tx.subtensorModule?.addStakeLimit],
    ["SubtensorModule.SubnetTAO", api.query.subtensorModule?.subnetTAO],
    ["SubtensorModule.SubnetAlphaIn", api.query.subtensorModule?.subnetAlphaIn],
    ["SubtensorModule.SubnetAlphaOut", api.query.subtensorModule?.subnetAlphaOut],
    ["SubtensorModule.SubnetLimit", api.query.subtensorModule?.subnetLimit],
    ["SubtensorModule.NetworkRateLimit", api.query.subtensorModule?.networkRateLimit],
    ["SubtensorModule.NetworkRegistrationStartBlock", api.query.subtensorModule?.networkRegistrationStartBlock],
    ["SubtensorModule.NetworkImmunityPeriod", api.query.subtensorModule?.networkImmunityPeriod],
    ["SubtensorModule.NetworkMinLockCost", api.query.subtensorModule?.networkMinLockCost],
    ["SubtensorModule.NetworkLastLockCost", api.query.subtensorModule?.networkLastLockCost],
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.SubtokenEnabled", api.query.subtensorModule?.subtokenEnabled],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `missing metadata: ${missing.map(([name]) => name).join(", ")}`);
}

async function assertAliceIsSudo() {
  const sudoKey = await api.query.sudo.key();
  assert.equal(sudoKey.toString(), alice.address, `Alice is not sudo; sudo key is ${sudoKey.toString()}`);
}

async function prepareSubnetRegistration() {
  const activeCount = await activeNonRootSubnetCount();
  const subnetLimit = (await api.query.subtensorModule.subnetLimit()).toNumber();
  const targetLimit = Math.max(subnetLimit, activeCount + 1);
  const entries = [
    [api.query.subtensorModule.subnetLimit.key(), storageValueHex("u16", targetLimit)],
    [api.query.subtensorModule.networkRateLimit.key(), storageValueHex("u64", 0n)],
    [api.query.subtensorModule.networkRegistrationStartBlock.key(), storageValueHex("u64", 0n)],
    [api.query.subtensorModule.networkImmunityPeriod.key(), storageValueHex("u64", 0n)],
    [api.query.subtensorModule.networkMinLockCost.key(), storageValueHex("u64", SWAP_MINIMUM_RESERVE)],
    [api.query.subtensorModule.networkLastLockCost.key(), storageValueHex("u64", SWAP_MINIMUM_RESERVE)],
  ];

  await submitAndWait(alice, api.tx.sudo.sudo(api.tx.system.setStorage(entries)), "sudo prepare subnet registration");
  console.log(
    "registration settings:",
    `subnet_limit=${targetLimit}`,
    `lock_cost=${SWAP_MINIMUM_RESERVE}`
  );
}

async function activeNonRootSubnetCount() {
  const entries = await api.query.subtensorModule.networksAdded.entries();
  return entries.filter(([key, value]) => value.isTrue && key.args[0].toNumber() !== 0).length;
}

async function registerSubnet() {
  const result = await submitAndWait(
    alice,
    api.tx.subtensorModule.registerNetwork(ownerHotkey.address),
    "registerNetwork"
  );
  const event = result.events.find(
    ({ event }) => event.section === "subtensorModule" && event.method === "NetworkAdded"
  );
  assert.ok(event, "NetworkAdded event not found");
  const netuid = event.event.data[0].toNumber();
  assert.equal((await api.query.subtensorModule.networksAdded(netuid)).isTrue, true, `${netuid} was not added`);
  return netuid;
}

async function executeSmallestAcceptedBuy(netuid) {
  const sim = await simSwapTaoForAlpha(netuid, MIN_STAKE_TAO);
  const simulatedMinimum = MIN_STAKE_TAO + sim.taoFee;
  const rejected = [];
  const firstAttempt = simulatedMinimum > 2n ? simulatedMinimum - 2n : MIN_STAKE_TAO;
  const maxAttempt = simulatedMinimum + MINIMUM_BUY_SEARCH_WINDOW;

  console.log(
    "minimum buy simulation:",
    `tao_amount=${sim.taoAmount}`,
    `alpha_amount=${sim.alphaAmount}`,
    `tao_fee=${sim.taoFee}`,
    `simulated_minimum=${simulatedMinimum}`
  );

  for (let amount = firstAttempt; amount <= maxAttempt; amount += 1n) {
    try {
      const result = await submitAndWait(
        alice,
        api.tx.subtensorModule.addStakeLimit(ownerHotkey.address, netuid, amount, MAX_PRICE, false),
        `buy candidate ${amount} rao`
      );
      return { amount, result, rejected };
    } catch (error) {
      if (!/\bAmountTooLow\b/.test(error.message)) {
        throw error;
      }
      rejected.push(amount);
    }
  }

  throw new Error(
    `no accepted buy found between ${firstAttempt} and ${maxAttempt} rao; rejected=${rejected.join(",")}`
  );
}

async function simSwapTaoForAlpha(netuid, tao) {
  const bytes = await api._rpcCore.provider.send("swap_simSwapTaoForAlpha", [
    netuid,
    Number(tao),
    null,
  ]);
  const decoded = api.createType("(u64,u64,u64,u64,u64,u64)", Uint8Array.from(bytes));
  const [taoAmount, alphaAmount, taoFee, alphaFee, taoSlippage, alphaSlippage] = decoded;

  return {
    taoAmount: taoAmount.toBigInt(),
    alphaAmount: alphaAmount.toBigInt(),
    taoFee: taoFee.toBigInt(),
    alphaFee: alphaFee.toBigInt(),
    taoSlippage: taoSlippage.toBigInt(),
    alphaSlippage: alphaSlippage.toBigInt(),
  };
}

async function enableSubtoken(netuid) {
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(
      api.tx.system.setStorage([
        [api.query.subtensorModule.subtokenEnabled.key(netuid), storageValueHex("bool", true)],
      ])
    ),
    `sudo enable subtoken trading for netuid ${netuid}`
  );

  assert.equal(
    (await api.query.subtensorModule.subtokenEnabled(netuid)).isTrue,
    true,
    `subtoken trading was not enabled for netuid ${netuid}`
  );
  console.log("subtoken trading enabled:", netuid);
}

async function readReserves(netuid) {
  const [tao, alphaIn, alphaOut] = await Promise.all([
    api.query.subtensorModule.subnetTAO(netuid),
    api.query.subtensorModule.subnetAlphaIn(netuid),
    api.query.subtensorModule.subnetAlphaOut(netuid),
  ]);
  return {
    tao: tao.toBigInt(),
    alphaIn: alphaIn.toBigInt(),
    alphaOut: alphaOut.toBigInt(),
  };
}

async function currentBlockNumber() {
  const header = await api.rpc.chain.getHeader();
  return header.number.toNumber();
}

async function waitForBlocks(blocks) {
  assert.ok(Number.isInteger(blocks) && blocks > 0, `invalid wait block count: ${blocks}`);

  const start = await currentBlockNumber();
  const target = start + blocks;
  console.log("waiting without user action:", `start_block=${start}`, `target_block=${target}`);

  while ((await currentBlockNumber()) < target) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

function stakeAddedFromEvents(events, hotkey, netuid) {
  const event = events.find(({ event }) => {
    if (event.section !== "subtensorModule" || event.method !== "StakeAdded") return false;
    const [, eventHotkey, , alphaStaked, eventNetuid] = event.data;
    return eventHotkey.toString() === hotkey && eventNetuid.toNumber() === netuid && alphaStaked.toBigInt() > 0n;
  });
  assert.ok(event, `StakeAdded event not found for ${hotkey} on netuid ${netuid}`);
  return event.event.data[3].toBigInt();
}

async function expectDispatchError(tx, label, expectedName) {
  await assert.rejects(
    () => submitAndWait(alice, tx, label),
    (error) => {
      assert.match(error.message, new RegExp(`\\b${expectedName}\\b`));
      return true;
    }
  );
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

function formatReserves(reserves) {
  return `tao=${reserves.tao} alpha_in=${reserves.alphaIn} alpha_out=${reserves.alphaOut}`;
}
