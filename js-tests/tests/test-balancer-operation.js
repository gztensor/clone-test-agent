import assert from "node:assert/strict";

import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const TRANSFER_AMOUNT = 1_000_000_000n;
const STAKE_AMOUNT = 1_000_000_000n;
const HALF_PERQUINTILL = 500_000_000_000_000_000n;
const MIN_BALANCER_WEIGHT = 450_000_000_000_000_000n;
const MAX_BALANCER_WEIGHT = 550_000_000_000_000_000n;
const MAX_BLOCKS_TO_WAIT = Number(process.env.MAX_EPOCH_WAIT_BLOCKS ?? 360);
const TRANSFER_SOURCE_URI = process.env.TRANSFER_SOURCE_URI ?? "//Alice";
const TRANSFER_DEST_URI = process.env.TRANSFER_DEST_URI ?? "//Bob";

const keyring = new Keyring({ type: "sr25519" });
const transferSource = keyring.addFromUri(TRANSFER_SOURCE_URI);
const transferDest = keyring.addFromUri(TRANSFER_DEST_URI);

const provider = new WsProvider(WS_ENDPOINT);
const api = await ApiPromise.create({ provider });

try {
  const chain = await api.rpc.system.chain();
  const runtimeVersion = await api.rpc.state.getRuntimeVersion();
  const startHeader = await api.rpc.chain.getHeader();
  console.log("chain:", chain.toString());
  console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
  console.log("start block:", startHeader.number.toString());

  const failures = [];
  await check("balance transfer", assertTransferWorks, failures);

  if (await check("balancer storage availability", assertBalancerStorageAvailable, failures)) {
    const balancerSummary = await assertBalancerWeights();
    const epochSummary = await assertEpochUpdatesReserves(balancerSummary.sampleNetuid);
    await assertStakingWorks(epochSummary.netuid);
  }

  assert.equal(failures.length, 0, `balancer operation test failed:\n${failures.join("\n")}`);
} finally {
  await api.disconnect();
}

async function check(label, fn, failures) {
  try {
    await fn();
    console.log(`${label}: ok`);
    return true;
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
    console.error(`${label}: ${error.message}`);
    return false;
  }
}

function assertBalancerStorageAvailable() {
  const missing = [
    ["Swap.SwapBalancer", api.query.swap?.swapBalancer],
    ["Swap.PalSwapInitialized", api.query.swap?.palSwapInitialized],
    ["SubtensorModule.SubnetTAO", api.query.subtensorModule?.subnetTAO],
    ["SubtensorModule.SubnetAlphaIn", api.query.subtensorModule?.subnetAlphaIn],
    ["SubtensorModule.addStake", api.tx.subtensorModule?.addStake],
    ["SubtensorModule.Keys", api.query.subtensorModule?.keys],
    ["SubtensorModule.TotalHotkeyAlpha", api.query.subtensorModule?.totalHotkeyAlpha],
  ].filter(([, query]) => !query);

  assert.equal(
    missing.length,
    0,
    `${missing.map(([name]) => name).join(", ")} unavailable; run this test after upgrading the clone to the current subtensor-reference runtime`
  );
}

async function assertBalancerWeights() {
  const initializedEntries = await api.query.swap.palSwapInitialized.entries();
  const initializedNetuids = new Set(
    initializedEntries
      .filter(([, initialized]) => initialized.isTrue)
      .map(([key]) => key.args[0].toNumber())
  );

  assert.ok(initializedNetuids.size > 0, "no subnets have PalSwapInitialized=true");

  const balancers = (await api.query.swap.swapBalancer.entries())
    .filter(([key]) => initializedNetuids.has(key.args[0].toNumber()))
    .map(([key, value]) => ({
      netuid: key.args[0].toNumber(),
      weight: extractQuotePerquintill(value),
    }))
    .filter(({ weight }) => weight !== null);

  assert.ok(balancers.length > 0, "no initialized subnet balancer weights could be decoded");

  for (const { netuid, weight } of balancers) {
    assert.ok(
      weight >= MIN_BALANCER_WEIGHT && weight <= MAX_BALANCER_WEIGHT,
      `netuid ${netuid} balancer weight ${weight} is outside 0.45-0.55`
    );
  }

  const nonHalf = balancers.filter(({ weight }) => weight !== HALF_PERQUINTILL);
  assert.ok(nonHalf.length > 0, "expected at least one initialized subnet balancer weight not equal to 0.5");

  console.log("initialized balancers checked:", balancers.length);
  console.log(
    "non-0.5 balancer samples:",
    nonHalf.slice(0, 10).map(({ netuid, weight }) => `${netuid}:${formatPerquintill(weight)}`).join(", ")
  );

  return { sampleNetuid: nonHalf[0].netuid };
}

async function assertTransferWorks() {
  const senderBefore = (await api.query.system.account(transferSource.address)).data.free.toBigInt();
  assert.ok(
    senderBefore > TRANSFER_AMOUNT,
    `transfer source ${transferSource.address} has ${senderBefore}, cannot transfer ${TRANSFER_AMOUNT}; set TRANSFER_SOURCE_URI to a funded local test account`
  );

  const before = (await api.query.system.account(transferDest.address)).data.free.toBigInt();
  await submitAndWait(
    api,
    transferSource,
    balancesTransfer(api, transferDest.address, TRANSFER_AMOUNT),
    `balances transfer ${transferSource.address} -> ${transferDest.address}`
  );
  const after = (await api.query.system.account(transferDest.address)).data.free.toBigInt();

  assert.equal(after - before, TRANSFER_AMOUNT, "recipient free balance did not increase by transfer amount");
  console.log("transfer credited:", TRANSFER_AMOUNT.toString());
}

async function assertEpochUpdatesReserves(preferredNetuid) {
  let watched = await reserveSnapshots();
  assert.ok(watched.length > 0, "no initialized subnets have non-zero reserves to watch");

  watched.sort((a, b) => (a.netuid === preferredNetuid ? -1 : b.netuid === preferredNetuid ? 1 : a.netuid - b.netuid));
  console.log(
    "watching reserves:",
    watched.slice(0, 10).map(({ netuid, tao, alpha }) => `${netuid}:tao=${tao},alpha=${alpha}`).join("; ")
  );

  for (let blocks = 1; blocks <= MAX_BLOCKS_TO_WAIT; blocks++) {
    const header = await waitForFinalizedBlock();
    const latest = await reserveSnapshots();
    const changed = latest.find((current) => {
      const previous = watched.find(({ netuid }) => netuid === current.netuid);
      return previous && (previous.tao !== current.tao || previous.alpha !== current.alpha);
    });

    if (changed) {
      const previous = watched.find(({ netuid }) => netuid === changed.netuid);
      console.log("reserve update block:", header.number.toString());
      console.log(
        `reserve changed netuid ${changed.netuid}: tao ${previous.tao}->${changed.tao}, alpha ${previous.alpha}->${changed.alpha}`
      );
      return { netuid: changed.netuid };
    }

    if (blocks % 30 === 0) {
      console.log(`waited ${blocks}/${MAX_BLOCKS_TO_WAIT} finalized blocks for reserve update`);
    }
  }

  throw new Error(`no SubnetTAO/SubnetAlphaIn reserve changed within ${MAX_BLOCKS_TO_WAIT} finalized blocks`);
}

async function assertStakingWorks(netuid) {
  const hotkey = await findExistingHotkey(netuid);
  const senderBefore = (await api.query.system.account(transferSource.address)).data.free.toBigInt();
  assert.ok(
    senderBefore > STAKE_AMOUNT,
    `staking source ${transferSource.address} has ${senderBefore}, cannot stake ${STAKE_AMOUNT}`
  );

  const alphaBefore = (await api.query.subtensorModule.totalHotkeyAlpha(hotkey, netuid)).toBigInt();
  const result = await submitAndWait(
    api,
    transferSource,
    api.tx.subtensorModule.addStake(hotkey, netuid, STAKE_AMOUNT),
    `add stake on netuid ${netuid}`
  );
  const alphaAfter = (await api.query.subtensorModule.totalHotkeyAlpha(hotkey, netuid)).toBigInt();

  assert.ok(alphaAfter > alphaBefore, `staking did not increase TotalHotkeyAlpha for netuid ${netuid}`);
  assertStakeAddedEvent(result.events, hotkey, netuid);
  console.log(
    `stake added on epoch-updated netuid ${netuid}: hotkey=${hotkey}, alpha ${alphaBefore}->${alphaAfter}`
  );
}

async function findExistingHotkey(netuid) {
  const keyEntries = await api.query.subtensorModule.keys.entries(netuid);
  assert.ok(keyEntries.length > 0, `netuid ${netuid} has no registered hotkeys in Keys storage`);

  const hotkey = keyEntries[0][1].toString();
  assert.notEqual(hotkey, "", `netuid ${netuid} first hotkey decoded to an empty address`);
  return hotkey;
}

function assertStakeAddedEvent(events, hotkey, netuid) {
  const event = events.find(({ event }) => {
    if (event.section !== "subtensorModule" || event.method !== "StakeAdded") {
      return false;
    }

    const [, eventHotkey, , alphaStaked, eventNetuid] = event.data;
    return (
      eventHotkey.toString() === hotkey &&
      eventNetuid.toNumber() === netuid &&
      alphaStaked.toBigInt() > 0n
    );
  });

  assert.ok(event, `StakeAdded event not found for hotkey ${hotkey} on netuid ${netuid}`);
}

async function reserveSnapshots() {
  const initializedEntries = await api.query.swap.palSwapInitialized.entries();
  const initializedNetuids = initializedEntries
    .filter(([, initialized]) => initialized.isTrue)
    .map(([key]) => key.args[0].toNumber());

  const snapshots = [];
  for (const netuid of initializedNetuids) {
    const [tao, alpha] = await Promise.all([
      api.query.subtensorModule.subnetTAO(netuid),
      api.query.subtensorModule.subnetAlphaIn(netuid),
    ]);
    const snapshot = {
      netuid,
      tao: tao.toBigInt(),
      alpha: alpha.toBigInt(),
    };
    if (snapshot.tao > 0n || snapshot.alpha > 0n) {
      snapshots.push(snapshot);
    }
  }
  return snapshots;
}

function balancesTransfer(api, dest, amount) {
  if (api.tx.balances.transferKeepAlive) {
    return api.tx.balances.transferKeepAlive(dest, amount);
  }
  if (api.tx.balances.transferAllowDeath) {
    return api.tx.balances.transferAllowDeath(dest, amount);
  }
  return api.tx.balances.transfer(dest, amount);
}

async function submitAndWait(api, signer, tx, label) {
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

function waitForFinalizedBlock() {
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      unsubscribe?.();
      fn(value);
    };

    api.rpc.chain
      .subscribeFinalizedHeads((header) => finish(resolve, header))
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

function extractQuotePerquintill(value) {
  const json = value.toJSON();

  if (typeof json === "number" || typeof json === "string") {
    return BigInt(json);
  }

  if (json && typeof json === "object") {
    const quote = json.quote ?? json.Quote;
    if (typeof quote === "number" || typeof quote === "string") {
      return BigInt(quote);
    }
  }

  const human = value.toHuman();
  if (human && typeof human === "object") {
    const quote = human.quote ?? human.Quote;
    if (typeof quote === "string") {
      return BigInt(quote.replaceAll(",", ""));
    }
  }

  return null;
}

function formatPerquintill(value) {
  const integer = value / 1_000_000_000_000_000_000n;
  const fractional = (value % 1_000_000_000_000_000_000n).toString().padStart(18, "0");
  return `${integer}.${fractional.slice(0, 6)}`;
}
