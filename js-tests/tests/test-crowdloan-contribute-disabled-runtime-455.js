import assert from "node:assert/strict";
import crypto from "node:crypto";

import { Keyring } from "@polkadot/api";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:9944";
const EXPECTED_RUNTIME = 455;
const EXPECTED_WASM_SHA256 =
  "1573350f826db1e85107121fc030a2cd6eec940ee4ed3b2078080481ca6adb7c";
const RAO_PER_TAO = 1_000_000_000n;
const TX_TIMEOUT_MS = 90_000;
const logger = createTempLogger("crowdloan-contribute-disabled-runtime-455.log");

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

    assertCrowdloanSurface(api);
    await logger.info("crowdloan_call_surface=present_with_expected_indices");

    const bobFree = (await api.query.system.account(bob.address)).data.free.toBigInt();
    if (bobFree < 5n * RAO_PER_TAO) {
      const funded = await submit(
        api,
        api.tx.balances.transferAllowDeath(bob.address, 5n * RAO_PER_TAO),
        alice,
      );
      assertEvent(funded.events, "balances", "Transfer");
      await logger.info(`funded_test_signer=${bob.address} block=${funded.block}`);
    }

    const nextIdBefore = (await api.query.crowdloan.nextCrowdloanId()).toNumber();
    const currentBlock = (await api.rpc.chain.getHeader()).number.toNumber();
    const minimumDuration = api.consts.crowdloan.minimumBlockDuration.toNumber();
    const deposit = 10n * RAO_PER_TAO;
    const minimumContribution = 1n * RAO_PER_TAO;
    const cap = 20n * RAO_PER_TAO;
    const end = currentBlock + minimumDuration + 100;

    const created = await submit(
      api,
      api.tx.crowdloan.create(
        deposit,
        minimumContribution,
        cap,
        end,
        null,
        charlie.address,
      ),
      alice,
    );
    assertEvent(created.events, "crowdloan", "Created");
    assert.equal((await api.query.crowdloan.nextCrowdloanId()).toNumber(), nextIdBefore + 1);
    const crowdloanId = nextIdBefore;
    await logger.info(`created_crowdloan_id=${crowdloanId} block=${created.block}`);

    const loanBefore = await api.query.crowdloan.crowdloans(crowdloanId);
    assert.ok(loanBefore.isSome, "created crowdloan is absent");
    const fundsAccount = loanBefore.unwrap().fundsAccount.toString();
    const bobContributionBefore = await api.query.crowdloan.contributions(
      crowdloanId,
      bob.address,
    );
    const fundsBalanceBefore = (await api.query.system.account(fundsAccount)).data.free.toBigInt();

    const blocked = await submit(
      api,
      api.tx.crowdloan.contribute(crowdloanId, minimumContribution),
      bob,
      "crowdloan.DisabledTemporarily",
    );
    assertNoEvent(blocked.events, "crowdloan", "Contributed");

    const [loanAfter, bobContributionAfter, fundsAccountAfter] = await Promise.all([
      api.query.crowdloan.crowdloans(crowdloanId),
      api.query.crowdloan.contributions(crowdloanId, bob.address),
      api.query.system.account(fundsAccount),
    ]);
    assert.equal(loanAfter.toHex(), loanBefore.toHex(), "failed contribution changed crowdloan state");
    assert.equal(
      bobContributionAfter.toHex(),
      bobContributionBefore.toHex(),
      "failed contribution created a contribution row",
    );
    assert.equal(
      fundsAccountAfter.data.free.toBigInt(),
      fundsBalanceBefore,
      "failed contribution changed the crowdloan funds balance",
    );
    await logger.info(
      `contribute_result=${blocked.error} state_unchanged=true block=${blocked.block}`,
    );

    const unauthorized = await submit(
      api,
      api.tx.crowdloan.updateCap(crowdloanId, 21n * RAO_PER_TAO),
      bob,
      "crowdloan.InvalidOrigin",
    );
    await logger.info(`unauthorized_update_cap_result=${unauthorized.error}`);

    const updateMin = await submit(
      api,
      api.tx.crowdloan.updateMinContribution(crowdloanId, 2n * RAO_PER_TAO),
      alice,
    );
    assertEvent(updateMin.events, "crowdloan", "MinContributionUpdated");

    const updateCap = await submit(
      api,
      api.tx.crowdloan.updateCap(crowdloanId, 25n * RAO_PER_TAO),
      alice,
    );
    assertEvent(updateCap.events, "crowdloan", "CapUpdated");

    const setMaximum = await submit(
      api,
      api.tx.crowdloan.setMaxContribution(crowdloanId, 12n * RAO_PER_TAO),
      alice,
    );
    assertEvent(setMaximum.events, "crowdloan", "MaxContributionUpdated");

    const laterBlock = (await api.rpc.chain.getHeader()).number.toNumber();
    const updateEnd = await submit(
      api,
      api.tx.crowdloan.updateEnd(crowdloanId, laterBlock + minimumDuration + 100),
      alice,
    );
    assertEvent(updateEnd.events, "crowdloan", "EndUpdated");
    await logger.info("creator_updates=passed");

    const withdraw = await submit(
      api,
      api.tx.crowdloan.withdraw(crowdloanId),
      alice,
      "crowdloan.DepositCannotBeWithdrawn",
    );
    await logger.info(`withdraw_guard_result=${withdraw.error}`);

    const finalize = await submit(
      api,
      api.tx.crowdloan.finalize(crowdloanId),
      alice,
      "crowdloan.CapNotRaised",
    );
    await logger.info(`finalize_guard_result=${finalize.error}`);

    const refunded = await submit(api, api.tx.crowdloan.refund(crowdloanId), alice);
    assertEvent(refunded.events, "crowdloan", "AllRefunded");

    const dissolved = await submit(api, api.tx.crowdloan.dissolve(crowdloanId), alice);
    assertEvent(dissolved.events, "crowdloan", "Dissolved");
    assert.ok((await api.query.crowdloan.crowdloans(crowdloanId)).isNone);
    assert.ok((await api.query.crowdloan.contributions(crowdloanId, alice.address)).isNone);
    assert.ok((await api.query.crowdloan.maxContributions(crowdloanId)).isNone);
    await logger.info(`refund_and_dissolve=passed block=${dissolved.block}`);

    const finalBlock = (await api.rpc.chain.getHeader()).number.toNumber();
    assert.ok(finalBlock > currentBlock, "block production did not advance during the test");
    await logger.info(`block_range=${currentBlock}-${finalBlock}`);
    await logger.info("crowdloan_runtime_455_verification=passed");
  } finally {
    await api.disconnect();
    await logger.flush();
  }
}

function assertCrowdloanSurface(api) {
  const expectedCalls = [
    "create",
    "contribute",
    "withdraw",
    "finalize",
    "refund",
    "dissolve",
    "updateMinContribution",
    "updateEnd",
    "updateCap",
    "setMaxContribution",
  ];

  for (const [index, name] of expectedCalls.entries()) {
    const call = api.tx.crowdloan?.[name];
    assert.equal(typeof call, "function", `crowdloan.${name} is missing from metadata`);
    assert.equal(call.callIndex[1], index, `crowdloan.${name} call index changed`);
  }

  for (const name of [
    "crowdloans",
    "nextCrowdloanId",
    "contributions",
    "maxContributions",
    "currentCrowdloanId",
    "hasMigrationRun",
  ]) {
    assert.equal(
      typeof api.query.crowdloan?.[name],
      "function",
      `crowdloan.${name} storage is missing from metadata`,
    );
  }
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
      const error = errorCodec ? formatDispatchError(api, errorCodec) : null;

      try {
        if (expectedError === null) {
          assert.equal(error, null, `transaction failed unexpectedly: ${error}`);
        } else {
          assert.equal(error, expectedError, "transaction failed with the wrong error");
        }

        const header = await api.rpc.chain.getHeader(status.asFinalized);
        finish(resolve, {
          block: header.number.toNumber(),
          error,
          events,
        });
      } catch (submissionError) {
        finish(reject, submissionError);
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

function assertNoEvent(events, section, method) {
  assert.ok(
    !events.some(({ event }) => event.section === section && event.method === method),
    `unexpected ${section}.${method} event`,
  );
}

main().catch(async (error) => {
  await logger.error(error);
  await logger.flush();
  process.exit(1);
});
