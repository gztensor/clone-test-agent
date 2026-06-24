import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { blake2AsHex } from "@polkadot/util-crypto";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const NETUID = Number(process.env.LIMIT_ORDERS_NETUID ?? "1");
const BIG_BUY_AMOUNT = BigInt(process.env.LIMIT_ORDERS_BIG_BUY_AMOUNT ?? "1000000000000");
const TINY_BUY_AMOUNT = BigInt(process.env.LIMIT_ORDERS_TINY_BUY_AMOUNT ?? "1");
const U64_MAX = "18446744073709551615";

const keyring = new Keyring({ type: "sr25519" });
const alice = keyring.addFromUri("//Alice");
const bob = keyring.addFromUri("//Bob");
const charlie = keyring.addFromUri("//Charlie");

const logger = createTempLogger("test-limit-orders-zero-share-devnet.log");
logger.captureConsole();

let api;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, { log: console.log });

  try {
    await assertMetadataAvailable();
    await waitForBlockProduction();
    await ensureSubtokenEnabled();

    const chain = await api.rpc.system.chain();
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const header = await api.rpc.chain.getHeader();
    console.log("chain:", chain.toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("block:", header.number.toString());

    const chainId = (await api.query.evmChainId.chainId()).toBigInt();
    const hotkey = (await api.query.subtensorModule.subnetOwnerHotkey(NETUID)).toString();
    console.log("chain id:", chainId.toString());
    console.log("netuid:", NETUID);
    console.log("order hotkey:", hotkey);

    const bigBuyer = makeLimitBuyOrder(alice, hotkey, BIG_BUY_AMOUNT, chainId);
    const tinyBuyer = makeLimitBuyOrder(bob, hotkey, TINY_BUY_AMOUNT, chainId);
    console.log("big order id:", bigBuyer.id);
    console.log("tiny order id:", tinyBuyer.id);

    const beforeAlice = await freeBalance(alice.address);
    const beforeBob = await freeBalance(bob.address);

    const result = await submitAndWait(
      charlie,
      api.tx.limitOrders.executeBatchedOrders(NETUID, [bigBuyer.signedOrder, tinyBuyer.signedOrder]),
      "execute zero-share batch"
    );

    assert.equal(result.dispatchError, "limitOrders.ZeroShareInBatch");
    assert.equal((await api.query.limitOrders.orders(bigBuyer.id)).toString(), "");
    assert.equal((await api.query.limitOrders.orders(tinyBuyer.id)).toString(), "");
    assert.equal(await freeBalance(alice.address), beforeAlice, "big buyer balance changed despite failed batch");
    assert.equal(await freeBalance(bob.address), beforeBob, "tiny buyer balance changed despite failed batch");

    console.log("zero-share batch rejected atomically:", result.dispatchError);
    console.log("buyer balances unchanged:", `alice=${beforeAlice}`, `bob=${beforeBob}`);
    console.log("limit order zero-share devnet test: ok");
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

async function assertMetadataAvailable() {
  const missing = [
    ["LimitOrders.executeBatchedOrders", api.tx.limitOrders?.executeBatchedOrders],
    ["LimitOrders.Orders", api.query.limitOrders?.orders],
    ["LimitOrders.ZeroShareInBatch", api.errors.limitOrders?.ZeroShareInBatch],
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.SubtokenEnabled", api.query.subtensorModule?.subtokenEnabled],
    ["SubtensorModule.SubnetOwnerHotkey", api.query.subtensorModule?.subnetOwnerHotkey],
    ["AdminUtils.sudoSetSubtokenEnabled", api.tx.adminUtils?.sudoSetSubtokenEnabled],
    ["Sudo.sudo", api.tx.sudo?.sudo],
    ["EVMChainId.ChainId", api.query.evmChainId?.chainId],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `${missing.map(([name]) => name).join(", ")} unavailable`);
  assert.equal((await api.query.subtensorModule.networksAdded(NETUID)).isTrue, true, `netuid ${NETUID} is not registered`);
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

async function ensureSubtokenEnabled() {
  if ((await api.query.subtensorModule.subtokenEnabled(NETUID)).isTrue) {
    console.log("subtoken already enabled");
    return;
  }

  const result = await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.adminUtils.sudoSetSubtokenEnabled(NETUID, true)),
    "enable subtoken for limit-order swap"
  );
  assert.equal(result.dispatchError, null, `failed to enable subtoken: ${result.dispatchError}`);
  assert.equal((await api.query.subtensorModule.subtokenEnabled(NETUID)).isTrue, true, "subtoken enable did not persist");
  console.log("subtoken enabled for netuid:", NETUID);
}

function makeLimitBuyOrder(signer, hotkey, amount, chainId) {
  const order = api.createType("PalletLimitOrdersVersionedOrder", {
    v1: {
      signer: signer.address,
      hotkey,
      netuid: NETUID,
      orderType: "LimitBuy",
      amount,
      limitPrice: U64_MAX,
      expiry: Date.now() + 3_600_000,
      feeRate: 0,
      feeRecipient: charlie.address,
      relayer: null,
      maxSlippage: null,
      chainId,
      partialFillsEnabled: false,
    },
  });
  const signature = signer.sign(order.toU8a());

  return {
    id: blake2AsHex(order.toU8a()),
    signedOrder: {
      order,
      signature: { sr25519: signature },
      partialFill: null,
    },
  };
}

async function submitAndWait(signer, tx, label) {
  console.log("submitting:", label);
  return new Promise((resolve, reject) => {
    let unsubscribe;
    tx.signAndSend(signer, (result) => {
      if (!result.status.isInBlock && !result.status.isFinalized) return;

      const dispatchError = result.dispatchError ? decodeDispatchError(result.dispatchError) : null;
      console.log(`${label}:`, result.status.type, dispatchError ?? "ok");
      for (const { event } of result.events) {
        if (["system", "limitOrders", "subtensorModule"].includes(event.section)) {
          console.log("event:", event.section, event.method, event.data.toString());
        }
      }

      if (unsubscribe) unsubscribe();
      resolve({ dispatchError, events: result.events });
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch(reject);
  });
}

function decodeDispatchError(dispatchError) {
  if (dispatchError.isModule) {
    const decoded = api.registry.findMetaError(dispatchError.asModule);
    return `${decoded.section}.${decoded.name}`;
  }
  return dispatchError.toString();
}

async function freeBalance(address) {
  return (await api.query.system.account(address)).data.free.toBigInt();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
