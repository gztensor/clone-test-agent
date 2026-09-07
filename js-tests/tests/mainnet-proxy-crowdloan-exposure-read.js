import { ApiPromise, WsProvider } from "@polkadot/api";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const AFFECTED_PROXY_TYPES = new Set(["NonTransfer", "NonFungible"]);
const RAO_PER_TAO = 1_000_000_000n;
const ALPHA_RAO_PER_ALPHA = 1_000_000_000n;
const RUNTIME_API_BATCH_SIZE = 8;
const logger = createTempLogger("mainnet-proxy-crowdloan-exposure-read.log");

async function main() {
  await logger.start();
  logger.captureConsole();

  const provider = new WsProvider(WS_ENDPOINT);
  const api = await ApiPromise.create({ provider });
  await api.isReady;

  try {
    const blockHash = await api.rpc.chain.getFinalizedHead();
    const apiAt = await api.at(blockHash);
    const [header, runtimeVersion, proxyEntries] = await Promise.all([
      api.rpc.chain.getHeader(blockHash),
      api.rpc.state.getRuntimeVersion(blockHash),
      apiAt.query.proxy.proxies.entries(),
    ]);
    const proxyFilterEvidence = await getProxyFilterEvidence(apiAt);

    const affected = collectAffectedOwners(proxyEntries);
    const owners = [...affected.keys()];
    const accounts = await apiAt.query.system.account.multi(owners);
    const existentialDeposit = toBigInt(api.consts.balances.existentialDeposit);

    let liquidRao = 0n;
    let nonTransferLiquidRao = 0n;
    let nonFungibleOnlyLiquidRao = 0n;
    const liquidByOwner = new Map();
    for (let index = 0; index < owners.length; index += 1) {
      const owner = owners[index];
      const types = affected.get(owner).types;
      const reducible = exactExpendablePoliteBalance(accounts[index], existentialDeposit);
      liquidByOwner.set(owner, reducible);
      liquidRao += reducible;
      if (types.has("NonTransfer")) {
        nonTransferLiquidRao += reducible;
      } else {
        nonFungibleOnlyLiquidRao += reducible;
      }
    }

    const nonTransferOwners = owners.filter((owner) => affected.get(owner).types.has("NonTransfer"));
    const availability = await getStakeAvailability(apiAt, nonTransferOwners);
    const stakeExposureByOwner = await calculateStakeExposureByOwner(apiAt, availability);
    const delegateExposure = calculateDelegateExposure(affected, liquidByOwner, stakeExposureByOwner);
    const maxImmediateDelegate = maximumBy(delegateExposure, "immediateTao");
    const maxEventualDelegate = maximumBy(delegateExposure, "eventualTao");
    const maxAvailableAlphaDelegate = maximumBy(delegateExposure, "availableAlpha");
    const maxTotalAlphaDelegate = maximumBy(delegateExposure, "totalAlpha");
    const byNetuid = aggregateAvailability(availability);
    const root = byNetuid.get(0) ?? zeroAvailability();
    byNetuid.delete(0);

    const subnetRows = [];
    let availableAlphaRao = 0n;
    let lockedAlphaRao = 0n;
    let totalAlphaRao = 0n;
    let availableAlphaTaoProceedsRao = 0n;
    let totalAlphaTaoProceedsRao = 0n;

    for (const [netuid, amounts] of byNetuid) {
      const availableSimulation = await simulateAlphaSale(apiAt, netuid, amounts.available);
      const totalSimulation = await simulateAlphaSale(apiAt, netuid, amounts.total);
      availableAlphaRao += amounts.available;
      lockedAlphaRao += amounts.locked;
      totalAlphaRao += amounts.total;
      availableAlphaTaoProceedsRao += availableSimulation.taoAmount;
      totalAlphaTaoProceedsRao += totalSimulation.taoAmount;
      subnetRows.push({ netuid, ...amounts, availableSimulation, totalSimulation });
    }

    subnetRows.sort((left, right) => compareBigIntDesc(
      left.totalSimulation.taoAmount,
      right.totalSimulation.taoAmount,
    ));

    const immediateTaoRao = liquidRao + root.available + availableAlphaTaoProceedsRao;
    const eventualTaoRao = liquidRao + root.total + totalAlphaTaoProceedsRao;
    const counts = proxyCounts(affected);

    console.log("MAINNET CLONE AFFECTED-PROXY EXPOSURE (READ ONLY)");
    console.log(`endpoint=${WS_ENDPOINT}`);
    console.log(`finalizedBlock=${header.number.toString()}`);
    console.log(`finalizedHash=${blockHash.toString()}`);
    console.log(`specVersion=${runtimeVersion.specVersion.toString()}`);
    console.log(`allProxyOwners=${proxyEntries.length}`);
    console.log(`affectedOwners=${owners.length}`);
    console.log(`nonTransferOwners=${counts.nonTransferOwners}`);
    console.log(`nonFungibleOwners=${counts.nonFungibleOwners}`);
    console.log(`ownersWithBoth=${counts.ownersWithBoth}`);
    console.log(`affectedDefinitions=${counts.affectedDefinitions}`);
    console.log(`zeroDelayDefinitions=${counts.zeroDelayDefinitions}`);
    console.log(`delayedDefinitions=${counts.delayedDefinitions}`);
    console.log("");
    console.log("ACTUAL RUNTIME FILTER EVIDENCE");
    for (const row of proxyFilterEvidence) {
      console.log([
        `proxyType=${row.name}`,
        `crowdloan.contribute=${row.crowdloanContribute}`,
        `contracts.call=${row.contractsCall}`,
        `evm.call=${row.evmCall}`,
        `subtensor.remove_stake=${row.removeStake}`,
      ].join(" "));
    }
    console.log("");
    console.log("TAO EXPOSURE");
    console.log(`liquidAllAffected=${formatToken(liquidRao, RAO_PER_TAO)}`);
    console.log(`liquidNonTransfer=${formatToken(nonTransferLiquidRao, RAO_PER_TAO)}`);
    console.log(`liquidNonFungibleOnly=${formatToken(nonFungibleOnlyLiquidRao, RAO_PER_TAO)}`);
    console.log(`rootStakeAvailableNonTransfer=${formatToken(root.available, RAO_PER_TAO)}`);
    console.log(`rootStakeLockedNonTransfer=${formatToken(root.locked, RAO_PER_TAO)}`);
    console.log(`rootStakeTotalNonTransfer=${formatToken(root.total, RAO_PER_TAO)}`);
    console.log(`availableAlphaSaleProceeds=${formatToken(availableAlphaTaoProceedsRao, RAO_PER_TAO)}`);
    console.log(`totalAlphaSaleProceedsAtSnapshotPools=${formatToken(totalAlphaTaoProceedsRao, RAO_PER_TAO)}`);
    console.log(`immediatelyExtractableTaoEstimate=${formatToken(immediateTaoRao, RAO_PER_TAO)}`);
    console.log(`eventualTaoEstimateAfterLocksClear=${formatToken(eventualTaoRao, RAO_PER_TAO)}`);
    console.log(`distinctAffectedDelegates=${delegateExposure.length}`);
    console.log(`maxSingleDelegateImmediateAffectedOwners=${maxImmediateDelegate?.owners ?? 0}`);
    console.log(`maxSingleDelegateImmediateTao=${formatToken(maxImmediateDelegate?.immediateTao ?? 0n, RAO_PER_TAO)}`);
    console.log(`maxSingleDelegateEventualAffectedOwners=${maxEventualDelegate?.owners ?? 0}`);
    console.log(`maxSingleDelegateEventualTao=${formatToken(maxEventualDelegate?.eventualTao ?? 0n, RAO_PER_TAO)}`);
    console.log(`maxSingleDelegateAvailableAlpha=${formatToken(maxAvailableAlphaDelegate?.availableAlpha ?? 0n, ALPHA_RAO_PER_ALPHA)}`);
    console.log(`maxSingleDelegateTotalAlpha=${formatToken(maxTotalAlphaDelegate?.totalAlpha ?? 0n, ALPHA_RAO_PER_ALPHA)}`);
    console.log("");
    console.log("ALPHA EXPOSURE (NONTRANSFER OWNERS; NOMINAL SUM ACROSS SUBNET TOKENS)");
    console.log(`availableAlpha=${formatToken(availableAlphaRao, ALPHA_RAO_PER_ALPHA)}`);
    console.log(`lockedAlpha=${formatToken(lockedAlphaRao, ALPHA_RAO_PER_ALPHA)}`);
    console.log(`totalAlpha=${formatToken(totalAlphaRao, ALPHA_RAO_PER_ALPHA)}`);
    console.log("");
    console.log("PER-SUBNET NONTRANSFER ALPHA EXPOSURE");
    console.log("netuid\tavailable_alpha\tlocked_alpha\ttotal_alpha\tavailable_sale_tao\ttotal_sale_tao");
    for (const row of subnetRows) {
      console.log([
        row.netuid,
        formatToken(row.available, ALPHA_RAO_PER_ALPHA),
        formatToken(row.locked, ALPHA_RAO_PER_ALPHA),
        formatToken(row.total, ALPHA_RAO_PER_ALPHA),
        formatToken(row.availableSimulation.taoAmount, RAO_PER_TAO),
        formatToken(row.totalSimulation.taoAmount, RAO_PER_TAO),
      ].join("\t"));
    }
  } finally {
    await api.disconnect();
    await logger.flush();
  }
}

async function getProxyFilterEvidence(apiAt) {
  const filters = await apiAt.call.proxyFilterRuntimeApi.getProxyFilters([3, 5]);
  return filters.toHuman().map((filter) => {
    const calls = filter.filterMode.Allow;
    const hasCall = (palletName, callName) => calls.some((call) =>
      call.palletName === palletName && call.callName === callName,
    );
    return {
      name: filter.name,
      crowdloanContribute: hasCall("Crowdloan", "contribute"),
      contractsCall: hasCall("Contracts", "call"),
      evmCall: hasCall("EVM", "call"),
      removeStake: hasCall("SubtensorModule", "remove_stake"),
    };
  });
}

function collectAffectedOwners(entries) {
  const owners = new Map();
  for (const [storageKey, value] of entries) {
    const owner = storageKey.args[0].toString();
    const definitions = [...value[0]].filter((definition) =>
      AFFECTED_PROXY_TYPES.has(definition.proxyType.toString()),
    );
    if (definitions.length === 0) {
      continue;
    }

    const current = owners.get(owner) ?? { types: new Set(), definitions: [] };
    for (const definition of definitions) {
      current.types.add(definition.proxyType.toString());
      current.definitions.push({
        type: definition.proxyType.toString(),
        delegate: definition.delegate.toString(),
        delay: Number(definition.delay.toString()),
      });
    }
    owners.set(owner, current);
  }
  return owners;
}

function proxyCounts(affected) {
  const values = [...affected.values()];
  const definitions = values.flatMap((value) => value.definitions);
  return {
    nonTransferOwners: values.filter((value) => value.types.has("NonTransfer")).length,
    nonFungibleOwners: values.filter((value) => value.types.has("NonFungible")).length,
    ownersWithBoth: values.filter((value) => value.types.size === 2).length,
    affectedDefinitions: definitions.length,
    zeroDelayDefinitions: definitions.filter((definition) => definition.delay === 0).length,
    delayedDefinitions: definitions.filter((definition) => definition.delay > 0).length,
  };
}

function exactExpendablePoliteBalance(accountInfo, existentialDeposit) {
  const free = toBigInt(accountInfo.data.free);
  const reserved = toBigInt(accountInfo.data.reserved);
  const frozen = toBigInt(accountInfo.data.frozen);
  const consumers = toBigInt(accountInfo.consumers);
  const providers = toBigInt(accountInfo.providers);
  let untouchable = frozen > reserved ? frozen - reserved : 0n;
  const canDecreaseProvider = consumers === 0n || providers > 1n;
  if (free > 0n && !canDecreaseProvider && existentialDeposit > untouchable) {
    untouchable = existentialDeposit;
  }
  return free > untouchable ? free - untouchable : 0n;
}

async function getStakeAvailability(apiAt, owners) {
  const rows = [];
  for (let offset = 0; offset < owners.length; offset += RUNTIME_API_BATCH_SIZE) {
    const batch = owners.slice(offset, offset + RUNTIME_API_BATCH_SIZE);
    const result = await apiAt.call.stakeInfoRuntimeApi.getStakeAvailabilityForColdkeys(batch, null);
    for (const [coldkey, netuids] of result) {
      rows.push([coldkey.toString(), netuids]);
    }
  }
  return rows;
}

async function calculateStakeExposureByOwner(apiAt, rows) {
  const result = new Map();
  for (const [owner, netuids] of rows) {
    const exposure = {
      immediateTao: 0n,
      eventualTao: 0n,
      availableAlpha: 0n,
      totalAlpha: 0n,
    };
    for (const [netuidCodec, value] of netuids) {
      const netuid = Number(netuidCodec.toString());
      const total = toBigInt(value.total);
      const available = toBigInt(value.available);
      if (netuid === 0) {
        exposure.immediateTao += available;
        exposure.eventualTao += total;
      } else {
        exposure.availableAlpha += available;
        exposure.totalAlpha += total;
        exposure.immediateTao += (await simulateAlphaSale(apiAt, netuid, available)).taoAmount;
        exposure.eventualTao += (await simulateAlphaSale(apiAt, netuid, total)).taoAmount;
      }
    }
    result.set(owner, exposure);
  }
  return result;
}

function calculateDelegateExposure(affected, liquidByOwner, stakeExposureByOwner) {
  const grants = new Map();
  for (const [owner, value] of affected) {
    for (const definition of value.definitions) {
      const owners = grants.get(definition.delegate) ?? new Map();
      const types = owners.get(owner) ?? new Set();
      types.add(definition.type);
      owners.set(owner, types);
      grants.set(definition.delegate, owners);
    }
  }

  const exposure = [];
  for (const owners of grants.values()) {
    let immediateTao = 0n;
    let eventualTao = 0n;
    let availableAlpha = 0n;
    let totalAlpha = 0n;
    for (const [owner, types] of owners) {
      const liquid = liquidByOwner.get(owner) ?? 0n;
      immediateTao += liquid;
      eventualTao += liquid;
      if (types.has("NonTransfer")) {
        immediateTao += stakeExposureByOwner.get(owner)?.immediateTao ?? 0n;
        eventualTao += stakeExposureByOwner.get(owner)?.eventualTao ?? 0n;
        availableAlpha += stakeExposureByOwner.get(owner)?.availableAlpha ?? 0n;
        totalAlpha += stakeExposureByOwner.get(owner)?.totalAlpha ?? 0n;
      }
    }
    exposure.push({ owners: owners.size, immediateTao, eventualTao, availableAlpha, totalAlpha });
  }
  return exposure;
}

function maximumBy(rows, field) {
  return rows.reduce((maximum, row) =>
    maximum === null || row[field] > maximum[field] ? row : maximum,
  null);
}

function aggregateAvailability(rows) {
  const byNetuid = new Map();
  for (const [, netuids] of rows) {
    for (const [netuidCodec, value] of netuids) {
      const netuid = Number(netuidCodec.toString());
      const current = byNetuid.get(netuid) ?? zeroAvailability();
      current.total += toBigInt(value.total);
      current.locked += toBigInt(value.locked);
      current.available += toBigInt(value.available);
      byNetuid.set(netuid, current);
    }
  }
  return byNetuid;
}

async function simulateAlphaSale(apiAt, netuid, alphaRao) {
  if (alphaRao === 0n) {
    return { taoAmount: 0n };
  }
  const result = await apiAt.call.swapRuntimeApi.simSwapAlphaForTao(netuid, alphaRao);
  return { taoAmount: toBigInt(result.taoAmount) };
}

function zeroAvailability() {
  return { total: 0n, locked: 0n, available: 0n };
}

function toBigInt(value) {
  return BigInt(value.toString().replaceAll(",", ""));
}

function compareBigIntDesc(left, right) {
  return left === right ? 0 : left > right ? -1 : 1;
}

function formatToken(raw, denominator) {
  const whole = raw / denominator;
  const fraction = (raw % denominator).toString().padStart(9, "0").replace(/0+$/, "");
  return fraction.length === 0 ? whole.toString() : `${whole}.${fraction}`;
}

main().catch((error) => {
  void logger.error(error);
  process.exit(1);
});
