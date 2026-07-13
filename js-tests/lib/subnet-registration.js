import assert from "node:assert/strict";

const DEFAULT_WAIT_BLOCKS = Number(process.env.REGISTER_SUBNET_WAIT_BLOCKS ?? 300);
const DEFAULT_CLEANUP_WAIT_BLOCKS = Number(process.env.DISSOLVE_CLEANUP_WAIT_BLOCKS ?? 300);

export async function subnetLimitForImmediateRegistration(api, extraSlots = 1) {
  const activeCount = await activeNonRootSubnetCount(api);
  const cleanupQueueLength = await storageVecLength(api.query.subtensorModule?.dissolveCleanupQueue);
  const registrationQueueLength = await storageVecLength(api.query.subtensorModule?.networkRegistrationQueue);
  return activeCount + cleanupQueueLength + registrationQueueLength + extraSlots;
}

export async function registerSubnetAndWait(api, signer, hotkey, submitAndWait, label, options = {}) {
  const hotkeyAddress = hotkey.address ?? hotkey;
  const ownerAddress = options.ownerAddress ?? signer.address;
  const waitBlocks = options.waitBlocks ?? DEFAULT_WAIT_BLOCKS;
  const beforeNetuids = await matchingOwnerHotkeyNetuids(api, hotkeyAddress);

  const result = await submitAndWait(signer, api.tx.subtensorModule.registerNetwork(hotkeyAddress), label);
  const addedEvent = findSubtensorEvent(result.events, "NetworkAdded");
  if (addedEvent) {
    const netuid = addedEvent.event.data[0].toNumber();
    await assertRegisteredSubnet(api, netuid, hotkeyAddress, ownerAddress, label);
    return netuid;
  }

  const queuedEvent = findSubtensorEvent(result.events, "NetworkRegistrationQueued");
  assert.ok(queuedEvent, `${label} emitted neither NetworkAdded nor NetworkRegistrationQueued`);
  console.log(
    `${label}: NetworkRegistrationQueued; waiting for SubnetOwnerHotkey correlation`,
    `hotkey=${hotkeyAddress}`,
    `wait_blocks=${waitBlocks}`
  );

  const netuid = await waitForOwnerHotkeySubnet(api, hotkeyAddress, beforeNetuids, waitBlocks);
  await assertRegisteredSubnet(api, netuid, hotkeyAddress, ownerAddress, label);
  return netuid;
}

export async function waitForDissolveCleanup(api, netuid, label, waitBlocks = DEFAULT_CLEANUP_WAIT_BLOCKS) {
  for (let waited = 0; waited <= waitBlocks; waited += 1) {
    const [networkAdded, subnetTao, cleanupQueue] = await Promise.all([
      api.query.subtensorModule.networksAdded(netuid),
      api.query.subtensorModule.subnetTAO(netuid),
      api.query.subtensorModule?.dissolveCleanupQueue ? api.query.subtensorModule.dissolveCleanupQueue() : [],
    ]);
    const queued = Array.from(cleanupQueue).some((queuedNetuid) => queuedNetuid.toNumber() === netuid);

    if (networkAdded.isFalse && subnetTao.toBigInt() === 0n && !queued) {
      console.log(`${label}: dissolve cleanup completed`, `netuid=${netuid}`, `waited_blocks=${waited}`);
      return;
    }

    await waitForFinalizedBlock(api);
  }

  throw new Error(`${label}: dissolve cleanup did not complete for netuid ${netuid} within ${waitBlocks} finalized blocks`);
}

function findSubtensorEvent(events, method) {
  return events.find(({ event }) => event.section === "subtensorModule" && event.method === method);
}

async function waitForOwnerHotkeySubnet(api, hotkeyAddress, beforeNetuids, waitBlocks) {
  for (let waited = 0; waited <= waitBlocks; waited += 1) {
    const candidates = (await matchingOwnerHotkeyNetuids(api, hotkeyAddress)).filter(
      (netuid) => !beforeNetuids.includes(netuid)
    );
    for (const netuid of candidates) {
      if ((await api.query.subtensorModule.networksAdded(netuid)).isTrue) {
        return netuid;
      }
    }
    await waitForFinalizedBlock(api);
  }

  throw new Error(
    `queued subnet registration did not materialize for owner hotkey ${hotkeyAddress} within ${waitBlocks} finalized blocks`
  );
}

async function matchingOwnerHotkeyNetuids(api, hotkeyAddress) {
  assert.ok(
    api.query.subtensorModule?.subnetOwnerHotkey,
    "SubtensorModule.SubnetOwnerHotkey is required to correlate queued subnet registration"
  );

  const entries = await api.query.subtensorModule.subnetOwnerHotkey.entries();
  return entries
    .filter(([, value]) => value.toString() === hotkeyAddress)
    .map(([key]) => key.args[0].toNumber());
}

async function activeNonRootSubnetCount(api) {
  const entries = await api.query.subtensorModule.networksAdded.entries();
  return entries.filter(([key, value]) => value.isTrue && key.args[0].toNumber() !== 0).length;
}

async function storageVecLength(query) {
  if (!query) {
    return 0;
  }
  const value = await query();
  return value.length;
}

async function assertRegisteredSubnet(api, netuid, hotkeyAddress, ownerAddress, label) {
  assert.equal((await api.query.subtensorModule.networksAdded(netuid)).isTrue, true, `${label}: ${netuid} was not added`);
  if (api.query.subtensorModule.subnetOwnerHotkey) {
    assert.equal(
      (await api.query.subtensorModule.subnetOwnerHotkey(netuid)).toString(),
      hotkeyAddress,
      `${label}: unexpected SubnetOwnerHotkey(${netuid})`
    );
  }
  if (ownerAddress && api.query.subtensorModule.subnetOwner) {
    assert.equal(
      (await api.query.subtensorModule.subnetOwner(netuid)).toString(),
      ownerAddress,
      `${label}: unexpected SubnetOwner(${netuid})`
    );
  }
}

async function waitForFinalizedBlock(api) {
  const before = (await api.rpc.chain.getFinalizedHead()).toString();
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
      .subscribeFinalizedHeads((header) => {
        if (header.hash.toString() !== before) {
          finish(resolve, header);
        }
      })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => finish(reject, error));
  });
}
