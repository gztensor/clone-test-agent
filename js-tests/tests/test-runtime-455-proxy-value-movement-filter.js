import assert from "node:assert/strict";
import crypto from "node:crypto";

import { Keyring } from "@polkadot/api";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const EXPECTED_RUNTIME = 455;
const EXPECTED_WASM_SHA256 =
  "2e2b35c57cd9a2eb0f724332d2b830f21d361a0f80b1eaf2f916fef8856d8095";
const RAO_PER_TAO = 1_000_000_000n;
const TX_TIMEOUT_MS = 90_000;
const logger = createTempLogger("runtime-455-proxy-value-movement-filter.log");

const keyring = new Keyring({ type: "sr25519" });
const alice = keyring.addFromUri("//Alice");
const bob = keyring.addFromUri("//Bob");
const charlie = keyring.addFromUri("//Charlie");

async function main() {
  await logger.start();
  const api = await connectApi(WS_ENDPOINT, { log: (...args) => logger.info(...args) });

  try {
    const runtime = await api.rpc.state.getRuntimeVersion();
    assert.equal(runtime.specVersion.toNumber(), EXPECTED_RUNTIME);
    await logger.info(`runtime=${runtime.specName}/${runtime.specVersion}`);

    const runtimeCode = await api.rpc.state.getStorage("0x3a636f6465");
    assert.ok(runtimeCode, "runtime :code storage is missing");
    const runtimeHash = crypto
      .createHash("sha256")
      .update(Buffer.from(runtimeCode.toU8a(true)))
      .digest("hex");
    assert.equal(runtimeHash, EXPECTED_WASM_SHA256, "active runtime is not the supplied WASM");
    await logger.info(`runtime_wasm_sha256=${runtimeHash}`);

    assert.equal(typeof api.tx.crowdloan?.contribute, "function");
    assert.equal(typeof api.call.proxyFilterRuntimeApi?.getProxyFilters, "function");

    await fundTestSigner(api);
    await verifyDirectContributionLifecycle(api);
    await verifyDeprecatedSwapCalls(api);
    const violations = await auditRestrictedProxyFilters(api);

    assert.deepEqual(
      violations,
      [],
      `restricted proxy filters still allow value-moving calls: ${violations.join(", ")}`,
    );
    await logger.info("runtime_455_proxy_value_movement_verification=passed");
  } finally {
    await api.disconnect();
    await logger.flush();
  }
}

async function verifyDeprecatedSwapCalls(api) {
  const addLiquidity = await submit(
    api,
    api.tx.swap.addLiquidity(alice.address, 1, -10, 10, 1),
    alice,
    "swap.Deprecated",
  );
  const modifyPosition = await submit(
    api,
    api.tx.swap.modifyPosition(alice.address, 1, 0, 1),
    alice,
    "swap.Deprecated",
  );
  await logger.info(
    `deprecated_swap_guards=passed add_liquidity_block=${addLiquidity.block} modify_position_block=${modifyPosition.block}`,
  );
}

async function fundTestSigner(api) {
  const free = (await api.query.system.account(bob.address)).data.free.toBigInt();
  if (free >= 5n * RAO_PER_TAO) return;

  const result = await submit(
    api,
    api.tx.balances.transferAllowDeath(bob.address, 5n * RAO_PER_TAO),
    alice,
  );
  assertEvent(result.events, "balances", "Transfer");
  await logger.info(`funded_test_signer=${bob.address} block=${result.block}`);
}

async function verifyDirectContributionLifecycle(api) {
  const crowdloanId = (await api.query.crowdloan.nextCrowdloanId()).toNumber();
  const currentBlock = (await api.rpc.chain.getHeader()).number.toNumber();
  const minimumDuration = api.consts.crowdloan.minimumBlockDuration.toNumber();
  const deposit = 10n * RAO_PER_TAO;
  const contribution = 1n * RAO_PER_TAO;

  const created = await submit(
    api,
    api.tx.crowdloan.create(
      deposit,
      contribution,
      20n * RAO_PER_TAO,
      currentBlock + minimumDuration + 100,
      null,
      charlie.address,
    ),
    alice,
  );
  assertEvent(created.events, "crowdloan", "Created");

  const loanBefore = (await api.query.crowdloan.crowdloans(crowdloanId)).unwrap();
  const fundsAccount = loanBefore.fundsAccount.toString();
  const fundsBefore = (await api.query.system.account(fundsAccount)).data.free.toBigInt();

  const contributed = await submit(
    api,
    api.tx.crowdloan.contribute(crowdloanId, contribution),
    bob,
  );
  assertEvent(contributed.events, "crowdloan", "Contributed");

  const loanAfter = (await api.query.crowdloan.crowdloans(crowdloanId)).unwrap();
  const bobContribution = await api.query.crowdloan.contributions(crowdloanId, bob.address);
  const fundsAfter = (await api.query.system.account(fundsAccount)).data.free.toBigInt();
  assert.equal(loanAfter.raised.toBigInt(), loanBefore.raised.toBigInt() + contribution);
  assert.equal(bobContribution.unwrap().toBigInt(), contribution);
  assert.equal(fundsAfter, fundsBefore + contribution);
  await logger.info(
    `direct_contribute=passed crowdloan_id=${crowdloanId} amount_rao=${contribution} block=${contributed.block}`,
  );

  const withdrew = await submit(api, api.tx.crowdloan.withdraw(crowdloanId), bob);
  assertEvent(withdrew.events, "crowdloan", "Withdrew");
  assert.ok((await api.query.crowdloan.contributions(crowdloanId, bob.address)).isNone);

  const refunded = await submit(api, api.tx.crowdloan.refund(crowdloanId), alice);
  assertEvent(refunded.events, "crowdloan", "AllRefunded");

  const dissolved = await submit(api, api.tx.crowdloan.dissolve(crowdloanId), alice);
  assertEvent(dissolved.events, "crowdloan", "Dissolved");
  assert.ok((await api.query.crowdloan.crowdloans(crowdloanId)).isNone);
  await logger.info(`direct_crowdloan_cleanup=passed block=${dissolved.block}`);
}

async function auditRestrictedProxyFilters(api) {
  const filters = await api.call.proxyFilterRuntimeApi.getProxyFilters(null);
  const byName = new Map();

  for (const filter of filters) {
    const name = utf8(filter.name);
    const calls = filter.filterMode.isAllow
      ? filter.filterMode.asAllow.map(
          (call) => `${utf8(call.palletName)}::${utf8(call.callName)}`,
        )
      : [];
    byName.set(name, { allowAll: filter.filterMode.isAllowAll, calls });
  }

  const violations = [];
  for (const proxyName of ["NonTransfer", "NonFungible"]) {
    const filter = byName.get(proxyName);
    assert.ok(filter, `${proxyName} filter metadata is missing`);
    assert.equal(filter.allowAll, false, `${proxyName} unexpectedly allows all calls`);

    const crowdloanCalls = filter.calls.filter((call) => call.startsWith("Crowdloan::"));
    const contractsCalls = filter.calls.filter((call) => call.startsWith("Contracts::"));
    const swapCalls = filter.calls.filter((call) => call.startsWith("Swap::"));

    await logger.info(`${proxyName}_crowdloan_calls=${JSON.stringify(crowdloanCalls)}`);
    await logger.info(`${proxyName}_contracts_calls=${JSON.stringify(contractsCalls)}`);
    await logger.info(`${proxyName}_swap_calls=${JSON.stringify(swapCalls)}`);

    assert.deepEqual(crowdloanCalls, [], `${proxyName} still allows Crowdloan calls`);
    assert.deepEqual(contractsCalls, [], `${proxyName} still allows Contracts calls`);
    assert.ok(filter.calls.includes("System::remark"), `${proxyName} lost System::remark`);

    if (crowdloanCalls.length > 0) violations.push(`${proxyName}:Crowdloan`);
    if (contractsCalls.length > 0) violations.push(`${proxyName}:Contracts`);
  }

  const nonCritical = byName.get("NonCritical");
  assert.ok(nonCritical, "NonCritical filter metadata is missing");
  assert.ok(
    nonCritical.calls.includes("Crowdloan::contribute"),
    "Crowdloan::contribute was removed from the ordinary NonCritical proxy scope",
  );

  await logger.info(`restricted_proxy_value_movement_violations=${JSON.stringify(violations)}`);
  return violations;
}

function utf8(value) {
  return Buffer.from(value.toU8a(true)).toString("utf8");
}

async function submit(api, tx, signer, expectedError = null) {
  return new Promise((resolve, reject) => {
    let unsubscribe;
    let timer;
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe?.();
      fn(value);
    };

    timer = setTimeout(
      () => finish(reject, new Error(`transaction did not finalize within ${TX_TIMEOUT_MS}ms`)),
      TX_TIMEOUT_MS,
    );

    tx.signAndSend(signer, async ({ status, events, dispatchError }) => {
      if (!status.isFinalized) return;

      const failedEvent = events.find(
        ({ event }) => event.section === "system" && event.method === "ExtrinsicFailed",
      );
      const errorCodec = dispatchError ?? failedEvent?.event.data[0];
      const errorName = errorCodec ? formatDispatchError(api, errorCodec) : null;

      try {
        if (expectedError === null) {
          assert.equal(errorName, null, "transaction failed unexpectedly");
        } else {
          assert.equal(errorName, expectedError, "transaction failed with the wrong error");
        }
        const header = await api.rpc.chain.getHeader(status.asFinalized);
        finish(resolve, { block: header.number.toNumber(), error: errorName, events });
      } catch (error) {
        finish(reject, error);
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error) => finish(reject, error));
  });
}

function formatDispatchError(api, error) {
  if (!error.isModule) return error.toString();
  const decoded = api.registry.findMetaError(error.asModule);
  return `${decoded.section}.${decoded.name}`;
}

function assertEvent(events, section, method) {
  assert.ok(
    events.some(({ event }) => event.section === section && event.method === method),
    `expected ${section}.${method} event`,
  );
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
