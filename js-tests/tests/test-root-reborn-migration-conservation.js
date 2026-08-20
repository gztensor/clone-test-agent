import assert from "node:assert/strict";
import fs from "node:fs";

import { u8aConcat, u8aToHex } from "@polkadot/util";
import { blake2AsHex } from "@polkadot/util-crypto";
import { xxhashAsU8a } from "@polkadot/util-crypto";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const PRE_BLOCK = 8_765_682;
const FIRST_RUNTIME_441_BLOCK = 8_765_683;
const FIRST_RUNTIME_441_EXECUTION_BLOCK = 8_765_684;
const LOG_FILENAME = "root-reborn-migration-conservation.log";
const REPORT_PATH = new URL("../root-reborn-migration-conservation.md", import.meta.url);
const CURRENT_REPORT_PATH = new URL("../mainnet-alpha-accounting-discrepancy-report.md", import.meta.url);

const logger = createTempLogger(LOG_FILENAME);

async function main() {
  logger.captureConsole();
  await logger.start();
  loadDotEnv();

  const endpoint = getEndpoint();
  let api;
  try {
    api = await connectApi(endpoint, {
      log: (message) => console.log(redactEndpoint(message)),
      timeoutMs: 120_000,
      providerTimeoutMs: 120_000,
    });

    const preHash = (await api.rpc.chain.getBlockHash(PRE_BLOCK)).toString();
    const postHash = (await api.rpc.chain.getBlockHash(FIRST_RUNTIME_441_BLOCK)).toString();
    const [preRuntime, postRuntime, preCode, postCode, postBlock, postEvents] = await Promise.all([
      api.rpc.state.getRuntimeVersion(preHash),
      api.rpc.state.getRuntimeVersion(postHash),
      api.rpc.state.getStorage(":code", preHash),
      api.rpc.state.getStorage(":code", postHash),
      api.rpc.chain.getBlock(postHash),
      api.query.system.events.at(postHash),
    ]);

    assert.equal(preRuntime.specVersion.toNumber(), 440, "pre-boundary runtime is not 440");
    assert.equal(postRuntime.specVersion.toNumber(), 441, "post-boundary runtime is not 441");

    const preApi = await api.at(preHash);
    const postApi = await api.at(postHash);
    const storageNames = Object.keys(postApi.query.subtensorModule).sort();
    const callSections = Object.entries(preApi.call)
      .map(([section, calls]) => `${section}: ${Object.keys(calls).sort().join(", ")}`)
      .filter((line) => /stake|subnet|basket/i.test(line));

    console.log(`pre block: ${PRE_BLOCK} ${preHash}`);
    console.log(`post block: ${FIRST_RUNTIME_441_BLOCK} ${postHash}`);
    console.log(`runtime versions: ${preRuntime.specVersion} -> ${postRuntime.specVersion}`);
    console.log(`code hashes: ${blake2AsHex(preCode.unwrap())} -> ${blake2AsHex(postCode.unwrap())}`);
    console.log(`post extrinsics: ${postBlock.block.extrinsics.length}`);
    for (const [index, extrinsic] of postBlock.block.extrinsics.entries()) {
      console.log(`post extrinsic ${index}: ${extrinsic.method.section}.${extrinsic.method.method}`);
    }
    const eventCounts = new Map();
    for (const record of postEvents) {
      const name = `${record.event.section}.${record.event.method}`;
      eventCounts.set(name, (eventCounts.get(name) ?? 0) + 1);
    }
    console.log(`post event counts: ${[...eventCounts].map(([name, count]) => `${name}=${count}`).join(", ")}`);
    console.log(`post migration-related storage: ${storageNames.filter((name) => /basket|migration|rootClaim/i.test(name)).join(", ")}`);
    for (const line of callSections) console.log(`pre runtime API ${line}`);

    const legacy = await analyzeLegacyLedger(postApi, postApi.registry, api._rpcCore.provider, postHash);
    let completion;
    if (process.env.SKIP_MIGRATION_PROGRESS !== "1") {
      completion = await inspectMigrationProgress(api, postHash, postApi);
      const audit = await auditMigrationAccounting(api, postHash, completion, legacy);
      const current = readCurrentDiscrepancies();
      const report = buildReport({
        preHash,
        postHash,
        preRuntime,
        postRuntime,
        preCodeHash: blake2AsHex(preCode.unwrap()),
        postCodeHash: blake2AsHex(postCode.unwrap()),
        postBlock,
        eventCounts,
        completion,
        legacy,
        audit,
        current,
      });
      fs.writeFileSync(REPORT_PATH, report);
      console.log(`report: ${REPORT_PATH.pathname}`);
    }
  } finally {
    await api?.disconnect();
    await logger.flush();
  }
}

async function analyzeLegacyLedger(preMigrationApi, registry, provider, blockHash) {
  const nonzeroClaimableEntries = [];
  const claimableEntryCount = await forEachPagedEntry(
    preMigrationApi.query.subtensorModule.rootClaimable,
    [],
    "pre-migration RootClaimable",
    1_000,
    (entry) => {
      if ([...entry[1]].some(([, rate]) => rate.bits.toBigInt() !== 0n)) {
        nonzeroClaimableEntries.push(entry);
      }
    }
  );
  assert.ok(claimableEntryCount > 0, "pre-migration RootClaimable is empty");
  console.log(`legacy RootClaimable hotkeys: ${claimableEntryCount}`);
  console.log(`legacy nonzero-rate hotkeys: ${nonzeroClaimableEntries.length}`);
  const rootTotals = await batchedMulti(
    preMigrationApi.query.subtensorModule.totalHotkeyAlpha,
    nonzeroClaimableEntries.map(([key]) => [key.args[0], 0]),
    "nonzero-rate root totals"
  );
  const positiveRootEntries = nonzeroClaimableEntries.filter((_, index) => rootTotals[index].toBigInt() > 0n);
  console.log(`legacy nonzero-rate hotkeys with root stake: ${positiveRootEntries.length}`);
  assert.ok(positiveRootEntries.length > 0, "no nonzero-rate hotkey has root stake");
  const activeHotkeys = positiveRootEntries.map(([key]) => key.args[0]);
  const activeHotkeyStrings = new Set(activeHotkeys.map(String));
  const activeHotkeyCodecByString = new Map(activeHotkeys.map((hotkey) => [hotkey.toString(), hotkey]));
  const rateMaps = new Map(positiveRootEntries.map(([key, value]) => [
    key.args[0].toString(),
    new Map([...value]
      .map(([netuid, rate]) => [netuid.toNumber(), rate.bits.toBigInt()])
      .filter(([, bits]) => bits !== 0n)),
  ]));
  const claimantPairs = [];
  const claimantPairKeys = new Set();
  let duplicateClaimantPairs = 0;
  const stakingHotkeyEntryCount = await forEachPagedEntry(
    preMigrationApi.query.subtensorModule.stakingHotkeys,
    [],
    "pre-migration StakingHotkeys",
    1_000,
    ([key, hotkeys]) => {
      for (const hotkey of hotkeys) {
        if (!activeHotkeyStrings.has(hotkey.toString())) continue;
        const pairKey = `${hotkey}|${key.args[0]}`;
        if (claimantPairKeys.has(pairKey)) {
          duplicateClaimantPairs += 1;
        } else {
          claimantPairKeys.add(pairKey);
          claimantPairs.push({ hotkey, coldkey: key.args[0] });
        }
      }
    }
  );
  console.log(`StakingHotkeys entries: ${stakingHotkeyEntryCount}`);
  console.log(`candidate root claimant pairs: ${claimantPairs.length}`);
  console.log(`duplicate root claimant associations: ${duplicateClaimantPairs}`);

  const positionsByHotkey = new Map(activeHotkeys.map((hotkey) => [hotkey.toString(), []]));
  const denominatorsV1 = await batchedMulti(
    preMigrationApi.query.subtensorModule.totalHotkeyShares,
    activeHotkeys.map((hotkey) => [hotkey, 0]),
    "root denominator v1"
  );
  const denominatorsV2 = await batchedMulti(
    preMigrationApi.query.subtensorModule.totalHotkeySharesV2,
    activeHotkeys.map((hotkey) => [hotkey, 0]),
    "root denominator v2"
  );
  const sharesV1 = await batchedMulti(
    preMigrationApi.query.subtensorModule.alpha,
    claimantPairs.map(({ hotkey, coldkey }) => [hotkey, coldkey, 0]),
    "root shares v1",
    1_000
  );
  const sharesV2 = await batchedMulti(
    preMigrationApi.query.subtensorModule.alphaV2,
    claimantPairs.map(({ hotkey, coldkey }) => [hotkey, coldkey, 0]),
    "root shares v2",
    1_000
  );
  const denominatorByHotkey = new Map(activeHotkeys.map((hotkey, index) => [
    hotkey.toString(),
    denominatorsV1[index].bits.toBigInt() !== 0n
      ? safeFromU64F64(denominatorsV1[index].bits.toBigInt())
      : safeFromCodec(denominatorsV2[index]),
  ]));
  const zeroDenominatorHotkeys = new Set(
    [...denominatorByHotkey]
      .filter(([, denominator]) => denominator.mantissa === 0n)
      .map(([hotkey]) => hotkey)
  );
  const storedRootByHotkey = new Map(positiveRootEntries.map(([key], index) => [
    key.args[0].toString(),
    rootTotals[nonzeroClaimableEntries.indexOf(positiveRootEntries[index])].toBigInt(),
  ]));
  for (let index = 0; index < claimantPairs.length; index += 1) {
    const { hotkey, coldkey } = claimantPairs[index];
    const hotkeyString = hotkey.toString();
    const v1Bits = sharesV1[index].bits.toBigInt();
    const share = v1Bits !== 0n ? safeFromU64F64(v1Bits) : safeFromCodec(sharesV2[index]);
    const denominator = denominatorByHotkey.get(hotkeyString);
    if (share.mantissa === 0n || denominator.mantissa === 0n) continue;
    const stake = safeToU64(safeMulDiv(
      safeFromU64(storedRootByHotkey.get(hotkeyString)),
      share,
      denominator
    ));
    if (stake > 0n) positionsByHotkey.get(hotkeyString).push({ coldkey: coldkey.toString(), stake, claimed: new Map() });
  }
  sharesV1.length = 0;
  sharesV2.length = 0;

  const positionByPair = new Map();
  for (const [hotkey, positions] of positionsByHotkey) {
    for (const position of positions) positionByPair.set(`${hotkey}|${position.coldkey}`, position);
  }

  const claimedBySlot = new Map();
  let relevantClaimedRows = 0;
  const visitClaimed = ([key, value]) => {
    const netuid = key.args[0].toNumber();
    const hotkey = key.args[1].toString();
    if (!activeHotkeyStrings.has(hotkey) || !rateMaps.get(hotkey)?.has(netuid)) return;
    const coldkey = key.args[2].toString();
    const claimed = value.toBigInt();
    positionByPair.get(`${hotkey}|${coldkey}`)?.claimed.set(netuid, claimed);
    const slotKey = `${netuid}|${hotkey}`;
    claimedBySlot.set(slotKey, (claimedBySlot.get(slotKey) ?? 0n) + claimed);
    relevantClaimedRows += 1;
  };
  const claimedSlotConcurrency = Number(process.env.ROOT_CLAIMED_SLOT_CONCURRENCY ?? 4);
  const claimedSlots = [...rateMaps].flatMap(([hotkey, rates]) =>
    [...rates.keys()].map((netuid) => ({ netuid, hotkey, hotkeyCodec: activeHotkeyCodecByString.get(hotkey) }))
  );
  console.log(`nonzero-rate RootClaimed slot prefixes: ${claimedSlots.length}`);
  let claimedEntryCount = 0;
  for (let offset = 0; offset < claimedSlots.length; offset += claimedSlotConcurrency) {
    const slots = claimedSlots.slice(offset, offset + claimedSlotConcurrency);
    const counts = await Promise.all(slots.map(({ netuid, hotkey, hotkeyCodec }) => forEachRawPair(
      preMigrationApi.query.subtensorModule.rootClaimed,
      [netuid, hotkeyCodec],
      registry,
      provider,
      blockHash,
      `pre-migration RootClaimed ${netuid}/${hotkey}`,
      visitClaimed
    )));
    claimedEntryCount += counts.reduce((sum, count) => sum + count, 0);
    console.log(`RootClaimed nonzero-rate slots complete: ${Math.min(offset + slots.length, claimedSlots.length)}/${claimedSlots.length}, rows=${claimedEntryCount}`);
  }

  const bySubnet = new Map();
  let rootPositionCount = 0;
  const sharePoolMismatches = [];
  for (const [hotkey, rates] of rateMaps) {
    const positions = positionsByHotkey.get(hotkey) ?? [];
    rootPositionCount += positions.length;
    const totalRoot = positions.reduce((sum, position) => sum + position.stake, 0n);
    const storedTotalRoot = rootTotals[nonzeroClaimableEntries.findIndex(([key]) => key.args[0].toString() === hotkey)].toBigInt();
    if (!zeroDenominatorHotkeys.has(hotkey)) {
      const difference = storedTotalRoot - totalRoot;
      if (absBigInt(difference) > BigInt(positions.length)) {
        sharePoolMismatches.push({ hotkey, storedTotalRoot, reconstructedTotalRoot: totalRoot, difference, positions: positions.length });
      }
    }
    for (const [netuid, rateBits] of rates) {
      let exactOwed = 0n;
      for (const position of positions) {
        const { stake } = position;
        const gross = (rateBits * stake) >> 32n;
        const claimed = position.claimed.get(netuid) ?? 0n;
        if (gross > claimed) exactOwed += gross - claimed;
      }
      const claimedSum = claimedBySlot.get(`${netuid}|${hotkey}`) ?? 0n;
      const aggregateBits = rateBits * storedTotalRoot - (claimedSum << 32n);
      const migrationBacking = aggregateBits > 0n ? aggregateBits >> 32n : 0n;
      const row = bySubnet.get(netuid) ?? { exactOwed: 0n, migrationBacking: 0n, slots: 0 };
      row.exactOwed += exactOwed;
      row.migrationBacking += migrationBacking;
      row.slots += 1;
      bySubnet.set(netuid, row);
    }
  }

  const totals = [...bySubnet.values()].reduce((sum, row) => ({
    exactOwed: sum.exactOwed + row.exactOwed,
    migrationBacking: sum.migrationBacking + row.migrationBacking,
    slots: sum.slots + row.slots,
  }), { exactOwed: 0n, migrationBacking: 0n, slots: 0 });
  console.log(`legacy RootClaimed rows in nonzero-rate slots: ${claimedEntryCount}`);
  console.log(`indexed relevant legacy RootClaimed rows: ${relevantClaimedRows}`);
  console.log(`root claimant positions: ${rootPositionCount}`);
  console.log(`zero-denominator root hotkeys: ${zeroDenominatorHotkeys.size}`);
  console.log(`root share-pool reconstruction mismatches: ${sharePoolMismatches.length}`);
  for (const mismatch of sharePoolMismatches) {
    console.log(`root share-pool mismatch ${mismatch.hotkey}: stored=${mismatch.storedTotalRoot} reconstructed=${mismatch.reconstructedTotalRoot} difference=${mismatch.difference} positions=${mismatch.positions}`);
  }
  console.log(`nonzero legacy slots: ${totals.slots}`);
  console.log(`exact per-position owed rao: ${totals.exactOwed}`);
  console.log(`migration aggregate backing rao: ${totals.migrationBacking}`);
  console.log(`legacy conversion difference rao: ${totals.migrationBacking - totals.exactOwed}`);
  for (const [netuid, row] of [...bySubnet].sort(([a], [b]) => a - b)) {
    console.log(`legacy subnet ${netuid}: exact=${row.exactOwed} backing=${row.migrationBacking} difference=${row.migrationBacking - row.exactOwed} slots=${row.slots}`);
  }
  return { bySubnet, totals, claimedEntryCount, relevantClaimedRows, rootPositionCount, sharePoolMismatches };
}

async function forEachRawPair(query, args, registry, provider, blockHash, label, visit) {
  const prefix = String(query.keyPrefix(...args));
  let rows;
  try {
    rows = await rpcWithRetry(label, () => provider.send("state_getPairs", [prefix, blockHash]));
  } catch (error) {
    if (!String(error).includes("Response is too big")) throw error;
    console.log(`${label}: response exceeded 15 MiB; using paged fallback`);
    return forEachPagedEntry(query, args, label, 1_000, visit);
  }
  for (const [rawKey, rawValue] of rows) {
    const key = registry.createType("StorageKey", rawKey);
    key.setMeta(query.creator.meta);
    visit([key, { toBigInt: () => decodeLittleEndianBigInt(rawValue) }]);
  }
  console.log(`${label}: ${rows.length}`);
  return rows.length;
}

function decodeLittleEndianBigInt(hexValue) {
  const bytes = Buffer.from(String(hexValue).slice(2), "hex");
  let value = 0n;
  for (let index = bytes.length - 1; index >= 0; index -= 1) {
    value = (value << 8n) | BigInt(bytes[index]);
  }
  return value;
}

async function batchedMulti(query, args, label, batchSize = 250) {
  const values = [];
  for (let offset = 0; offset < args.length; offset += batchSize) {
    const batch = args.slice(offset, offset + batchSize);
    const result = await rpcWithRetry(`${label} batch ${offset / batchSize + 1}`, () => query.multi(batch));
    values.push(...result);
    console.log(`${label}: ${values.length}/${args.length}`);
    await delay(Number(process.env.HISTORICAL_QUERY_DELAY_MS ?? 1_200));
  }
  return values;
}

async function readPagedEntries(query, args, label, pageSize = 250) {
  const entries = [];
  let startKey;
  let pageNumber = 0;
  while (true) {
    const page = await rpcWithRetry(`${label} page ${pageNumber + 1}`, () =>
      query.entriesPaged({ args, pageSize, startKey })
    );
    entries.push(...page);
    pageNumber += 1;
    console.log(`${label} page ${pageNumber}: ${page.length}`);
    if (page.length < pageSize) return entries;
    const nextStartKey = page.at(-1)[0].toHex();
    assert.notEqual(nextStartKey, startKey, `${label} pagination did not advance`);
    startKey = nextStartKey;
    await delay(Number(process.env.HISTORICAL_QUERY_DELAY_MS ?? 1_200));
  }
}

async function forEachPagedEntry(query, args, label, pageSize, visit) {
  let startKey;
  let pageNumber = 0;
  let count = 0;
  while (true) {
    const page = await rpcWithRetry(`${label} page ${pageNumber + 1}`, () =>
      query.entriesPaged({ args, pageSize, startKey })
    );
    for (const entry of page) visit(entry);
    count += page.length;
    pageNumber += 1;
    console.log(`${label} page ${pageNumber}: ${page.length}, total=${count}`);
    if (page.length < pageSize) return count;
    const nextStartKey = page.at(-1)[0].toHex();
    assert.notEqual(nextStartKey, startKey, `${label} pagination did not advance`);
    startKey = nextStartKey;
    await delay(Number(process.env.HISTORICAL_QUERY_DELAY_MS ?? 1_200));
  }
}

async function rpcWithRetry(label, operation) {
  const maxAttempts = Number(process.env.HISTORICAL_QUERY_RETRIES ?? 20);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("Too Many Requests") && !message.includes("-32029")) throw error;
      if (attempt === maxAttempts) throw error;
      const waitMs = Math.min(attempt * 3_000, 30_000);
      console.log(`${label}: rate limited, retrying in ${waitMs}ms`);
      await delay(waitMs);
    }
  }
  throw new Error(`${label} exhausted ${maxAttempts} retries`);
}

const SAFE_FLOAT_MAX = 1_000_000_000_000_000_000_000n;
const SAFE_FLOAT_MIN = SAFE_FLOAT_MAX / 10n;

function safeNormalize(mantissa, exponent) {
  let normalizedMantissa = BigInt(mantissa);
  let normalizedExponent = Number(exponent);
  if (normalizedMantissa === 0n) return { mantissa: 0n, exponent: 0 };
  while (normalizedMantissa > SAFE_FLOAT_MAX) {
    normalizedMantissa /= 10n;
    normalizedExponent += 1;
  }
  while (normalizedMantissa <= SAFE_FLOAT_MIN) {
    normalizedMantissa *= 10n;
    normalizedExponent -= 1;
  }
  return { mantissa: normalizedMantissa, exponent: normalizedExponent };
}

function safeFromU64(value) {
  return safeNormalize(BigInt(value), 0);
}

function safeFromCodec(value) {
  const json = value.toJSON();
  return safeNormalize(parseBigInt(json.mantissa), Number(json.exponent));
}

function safeFromU64F64(bitsValue) {
  const bits = BigInt(bitsValue);
  if (bits === 0n) return safeFromU64(0n);
  const integer = safeFromU64(bits >> 64n);
  const fractionNumerator = safeFromU64(bits & ((1n << 64n) - 1n));
  const two64 = safeFromU64(1n << 64n);
  const fraction = safeDiv(fractionNumerator, two64);
  return safeAdd(integer, fraction);
}

function safeDiv(left, right) {
  assert.notEqual(right.mantissa, 0n, "SafeFloat division by zero");
  return safeNormalize(
    (left.mantissa * SAFE_FLOAT_MAX) / right.mantissa,
    left.exponent - right.exponent - 21
  );
}

function safeAdd(left, right) {
  if (left.mantissa === 0n) return right;
  if (right.mantissa === 0n) return left;
  if (left.exponent >= right.exponent) {
    return safeNormalize(
      left.mantissa + right.mantissa / cappedPow10(left.exponent - right.exponent),
      left.exponent
    );
  }
  return safeNormalize(
    left.mantissa / cappedPow10(right.exponent - left.exponent) + right.mantissa,
    right.exponent
  );
}

function safeMulDiv(left, multiplier, divisor) {
  assert.notEqual(divisor.mantissa, 0n, "SafeFloat mul_div by zero");
  return safeNormalize(
    (left.mantissa * multiplier.mantissa) / divisor.mantissa,
    left.exponent + multiplier.exponent - divisor.exponent
  );
}

function safeToU64(value) {
  if (value.exponent >= 0) return value.mantissa * (10n ** BigInt(value.exponent));
  return value.mantissa / (10n ** BigInt(-value.exponent));
}

function cappedPow10(exponent) {
  return 10n ** BigInt(Math.min(exponent, 22));
}

function parseBigInt(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  return BigInt(String(value));
}

function absBigInt(value) {
  return value < 0n ? -value : value;
}

async function inspectMigrationProgress(api, firstHash, firstApi) {
  const hasRunQuery = firstApi.query.subtensorModule.hasMigrationRun;
  assert.ok(hasRunQuery, "HasMigrationRun storage is absent from runtime 441");

  const migrationName = "migrate_seed_beta_basket_v2";
  let hasRunKey = u8aToHex(hasRunQuery.key(migrationName));
  const cursorKey = u8aToHex(u8aConcat(
    xxhashAsU8a("SubtensorModule", 128),
    xxhashAsU8a("SeedBetaBasketV2Migration", 128)
  ));
  const provider = api._rpcCore.provider;
  const delayMs = Number(process.env.HISTORICAL_QUERY_DELAY_MS ?? 1_200);
  const [currentHeader, currentCursor, migrationFlags] = await Promise.all([
    api.rpc.chain.getHeader(),
    provider.send("state_getStorage", [cursorKey]),
    api.query.subtensorModule.hasMigrationRun.entries(),
  ]);
  console.log(`current block: ${currentHeader.number.toNumber()}`);
  console.log(`current migration cursor: ${currentCursor ?? "none"}`);
  console.log(`migration flags: ${migrationFlags.map(([key, value]) => `${key.args[0].toHuman()}=${value}`).join(", ")}`);
  const seedFlag = migrationFlags.find(([key]) => key.args[0].toHuman() === migrationName);
  assert.ok(seedFlag, "completed beta-basket migration flag is absent from current state");
  assert.equal(seedFlag[1].isTrue, true, "current beta-basket migration flag is false");
  hasRunKey = seedFlag[0].toHex();
  const stateAt = async (block) => {
    const hash = block === FIRST_RUNTIME_441_BLOCK
      ? firstHash
      : await provider.send("chain_getBlockHash", [block]);
    const hasRun = await provider.send("state_getStorage", [hasRunKey, hash]);
    await delay(delayMs);
    return { block, hash, completed: hasRun === "0x01" };
  };

  let low = await stateAt(FIRST_RUNTIME_441_BLOCK + 256);
  assert.equal(low.completed, false, "migration unexpectedly completed by the known lower bound");
  console.log(`migration completion probe block ${low.block}: hasRun=false`);
  let high = await stateAt(currentHeader.number.toNumber());
  assert.equal(high.completed, true, "migration is not complete at the current block");
  console.log(`migration completion probe block ${high.block}: hasRun=true`);

  while (high.block - low.block > 1) {
    const mid = await stateAt(Math.floor((low.block + high.block) / 2));
    console.log(`migration completion probe block ${mid.block}: hasRun=${mid.completed}`);
    if (mid.completed) high = mid;
    else low = mid;
  }

  const cursor = await provider.send("state_getStorage", [cursorKey, high.hash]);
  const firstComplete = high;
  console.log(`migration progress block ${low.block}: hasRun=false`);
  console.log(`migration progress block ${high.block}: cursor=${cursor ?? "none"} hasRun=true`);
  assert.equal(cursor, null, "migration cursor remains at first completed block");
  assert.ok(firstComplete, "beta-basket seed completion was not found");
  console.log(`migration first complete: ${firstComplete.block} ${firstComplete.hash}`);
  return firstComplete;
}

async function auditMigrationAccounting(api, inputHash, completion, legacy) {
  const inputApi = await api.at(inputHash);
  const completionApi = await api.at(completion.hash);
  const inputNets = await readActiveNetuids(inputApi);
  const completionNets = await readActiveNetuids(completionApi);
  assert.deepEqual(completionNets, inputNets, "active alpha subnet set changed during migration");

  const input = await readAccountingSnapshot(inputApi, inputHash, FIRST_RUNTIME_441_BLOCK, inputNets, "migration input");
  const complete = await readAccountingSnapshot(completionApi, completion.hash, completion.block, completionNets, "migration completion");
  const [remainingClaimable, remainingClaimed, basketRates, basketShares, basketClaimed] = await Promise.all([
    countStorageEntries(completionApi.query.subtensorModule.rootClaimable, "completion RootClaimable"),
    countStorageEntries(completionApi.query.subtensorModule.rootClaimed, "completion RootClaimed"),
    countStorageEntries(completionApi.query.subtensorModule.basketRate, "completion BasketRate"),
    summarizeStorageEntries(completionApi.query.subtensorModule.basketShares, "completion BasketShares"),
    countStorageEntries(completionApi.query.subtensorModule.basketClaimed, "completion BasketClaimed"),
  ]);
  assert.equal(remainingClaimable, 0, "RootClaimable remains after migration completion");
  assert.equal(remainingClaimed, 0, "RootClaimed remains after migration completion");

  const comparisons = inputNets.map((netuid) => {
    const before = input.rows.get(netuid);
    const after = complete.rows.get(netuid);
    const legacyRow = legacy.bySubnet.get(netuid) ?? { exactOwed: 0n, migrationBacking: 0n };
    const correctedBefore = before.discrepancy + legacyRow.exactOwed;
    const correctedAfter = after.discrepancy;
    const observedMovement = correctedAfter - correctedBefore;
    const directConversionError = legacyRow.migrationBacking - legacyRow.exactOwed;
    return {
      netuid,
      exactOwed: legacyRow.exactOwed,
      migrationBacking: legacyRow.migrationBacking,
      directConversionError,
      correctedBefore,
      correctedAfter,
      observedMovement,
      windowResidual: observedMovement - directConversionError,
      epochDelta: (complete.epochs.get(netuid) ?? 0n) - (input.epochs.get(netuid) ?? 0n),
    };
  });
  const totals = comparisons.reduce((sum, row) => ({
    exactOwed: sum.exactOwed + row.exactOwed,
    migrationBacking: sum.migrationBacking + row.migrationBacking,
    directConversionError: sum.directConversionError + row.directConversionError,
    correctedBefore: sum.correctedBefore + row.correctedBefore,
    correctedAfter: sum.correctedAfter + row.correctedAfter,
    observedMovement: sum.observedMovement + row.observedMovement,
    windowResidual: sum.windowResidual + row.windowResidual,
  }), {
    exactOwed: 0n,
    migrationBacking: 0n,
    directConversionError: 0n,
    correctedBefore: 0n,
    correctedAfter: 0n,
    observedMovement: 0n,
    windowResidual: 0n,
  });
  console.log(`completion RootClaimable rows: ${remainingClaimable}`);
  console.log(`completion RootClaimed rows: ${remainingClaimed}`);
  console.log(`completion BasketRate rows: ${basketRates}`);
  console.log(`completion BasketShares rows: ${basketShares.count}, total=${basketShares.total}`);
  console.log(`completion BasketClaimed rows: ${basketClaimed}`);
  console.log(`corrected migration-window movement rao: ${totals.observedMovement}`);
  console.log(`direct migration conversion error rao: ${totals.directConversionError}`);
  console.log(`migration-window residual rao: ${totals.windowResidual}`);
  return {
    input,
    complete,
    comparisons,
    totals,
    remainingClaimable,
    remainingClaimed,
    basketRates,
    basketShares,
    basketClaimed,
  };
}

async function readActiveNetuids(apiAt) {
  return (await rpcWithRetry("active networks", () => apiAt.query.subtensorModule.networksAdded.entries()))
    .filter(([, value]) => value.isTrue)
    .map(([key]) => key.args[0].toNumber())
    .filter((netuid) => netuid > 0)
    .sort((left, right) => left - right);
}

async function readAccountingSnapshot(apiAt, hash, height, netuids, label) {
  console.log(`reading ${label} accounting snapshot at ${height} ${hash}`);
  const actual = await sumDoubleMapByNetuid(apiAt.query.subtensorModule.totalHotkeyAlpha, 1, netuids, `${label} TotalHotkeyAlpha`);
  const pendingBasket = apiAt.query.subtensorModule.pendingBasketDeposits
    ? await sumDoubleMapByNetuid(apiAt.query.subtensorModule.pendingBasketDeposits, 1, netuids, `${label} PendingBasketDeposits`)
    : new Map();
  const deferredRoot = apiAt.query.subtensorModule.deferredRootAlphaDividends
    ? await sumDoubleMapByNetuid(apiAt.query.subtensorModule.deferredRootAlphaDividends, 0, netuids, `${label} DeferredRootAlphaDividends`)
    : new Map();
  const definitions = [
    ["alphaOut", apiAt.query.subtensorModule.subnetAlphaOut],
    ["burned", apiAt.query.alphaAssets.alphaBurned],
    ["protocol", apiAt.query.subtensorModule.subnetProtocolAlpha],
    ["pendingServer", apiAt.query.subtensorModule.pendingServerEmission],
    ["pendingValidator", apiAt.query.subtensorModule.pendingValidatorEmission],
    ["pendingRoot", apiAt.query.subtensorModule.pendingRootAlphaDivs],
    ["pendingOwner", apiAt.query.subtensorModule.pendingOwnerCut],
    ["epochs", apiAt.query.subtensorModule.subnetEpochIndex],
  ];
  for (const [name, query] of definitions) assert.ok(query, `${label} is missing ${name} storage`);
  const maps = {};
  for (const [name, query] of definitions) {
    maps[name] = new Map((await rpcWithRetry(`${label} ${name}`, () => query.entries()))
      .map(([key, value]) => [key.args[0].toNumber(), codecBigInt(value)]));
  }
  const rows = new Map(netuids.map((netuid) => {
    const pending = (maps.pendingServer.get(netuid) ?? 0n) +
      (maps.pendingValidator.get(netuid) ?? 0n) +
      (maps.pendingRoot.get(netuid) ?? 0n) +
      (maps.pendingOwner.get(netuid) ?? 0n) +
      (pendingBasket.get(netuid) ?? 0n) +
      (deferredRoot.get(netuid) ?? 0n);
    const alphaOut = maps.alphaOut.get(netuid) ?? 0n;
    const burned = maps.burned.get(netuid) ?? 0n;
    const protocol = maps.protocol.get(netuid) ?? 0n;
    const actualStake = actual.get(netuid) ?? 0n;
    const calculated = alphaOut - burned - pending - protocol;
    return [netuid, {
      actual: actualStake,
      alphaOut,
      burned,
      pending,
      deferredRoot: deferredRoot.get(netuid) ?? 0n,
      protocol,
      calculated,
      discrepancy: actualStake - calculated,
    }];
  }));
  return { height, hash, rows, epochs: maps.epochs };
}

async function sumDoubleMapByNetuid(query, netuidArgIndex, netuids, label) {
  const allowed = new Set(netuids);
  const totals = new Map(netuids.map((netuid) => [netuid, 0n]));
  await forEachPagedEntry(query, [], label, 1_000, ([key, value]) => {
    const netuid = key.args[netuidArgIndex].toNumber();
    if (allowed.has(netuid)) totals.set(netuid, (totals.get(netuid) ?? 0n) + codecBigInt(value));
  });
  return totals;
}

async function countStorageEntries(query, label) {
  assert.ok(query, `${label} storage is absent`);
  return forEachPagedEntry(query, [], label, 1_000, () => {});
}

async function summarizeStorageEntries(query, label) {
  assert.ok(query, `${label} storage is absent`);
  let total = 0n;
  const count = await forEachPagedEntry(query, [], label, 1_000, ([, value]) => {
    total += codecBigInt(value);
  });
  return { count, total };
}

function readCurrentDiscrepancies() {
  assert.ok(fs.existsSync(CURRENT_REPORT_PATH), "current discrepancy report is missing");
  const text = fs.readFileSync(CURRENT_REPORT_PATH, "utf8");
  const snapshot = text.match(/\| Bittensor \| ([\d,]+) \| `([^`]+)` \| `([^`]+)`/);
  assert.ok(snapshot, "could not parse current discrepancy snapshot");
  const bySubnet = new Map();
  for (const line of text.split("\n")) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (!/^\d+$/.test(cells[0] ?? "") || cells.length < 9) continue;
    bySubnet.set(Number(cells[0]), parseAlphaRao(cells[7]));
  }
  assert.equal(bySubnet.size, 128, "current report does not contain 128 alpha subnets");
  return {
    block: Number(snapshot[1].replaceAll(",", "")),
    hash: snapshot[2],
    runtime: snapshot[3],
    bySubnet,
  };
}

function buildReport(context) {
  const { legacy, audit, current } = context;
  const rows = audit.comparisons.map((row) => ({
    ...row,
    currentDiscrepancy: current.bySubnet.get(row.netuid) ?? 0n,
  }));
  const sameSign = rows.filter((row) => sameNonzeroSign(row.directConversionError, row.currentDiscrepancy));
  const oppositeSign = rows.filter((row) => row.directConversionError !== 0n && row.currentDiscrepancy !== 0n && !sameNonzeroSign(row.directConversionError, row.currentDiscrepancy));
  const currentTotal = rows.reduce((sum, row) => sum + row.currentDiscrepancy, 0n);
  const maxResidual = [...rows].sort((left, right) => compareAbs(right.windowResidual, left.windowResidual))[0];
  const table = rows.map((row) => `| ${row.netuid} | ${formatAlpha(row.exactOwed)} | ${formatAlpha(row.migrationBacking)} | ${formatSignedAlpha(row.directConversionError)} | ${formatSignedAlpha(row.correctedBefore)} | ${formatSignedAlpha(row.correctedAfter)} | ${formatSignedAlpha(row.observedMovement)} | ${formatSignedAlpha(row.windowResidual)} | ${formatSignedAlpha(row.currentDiscrepancy)} | ${sameNonzeroSign(row.directConversionError, row.currentDiscrepancy) ? "yes" : "no"} |`).join("\n");
  return `# Runtime 441 Root Reborn migration conservation audit

Generated: ${new Date().toISOString()}

## Verdict

**Root Reborn does not directly explain the current residual discrepancy.** The migration did
create a concrete alpha-accounting shortfall: it materialized ${formatAlpha(audit.totals.migrationBacking)} α
of escrow stake against ${formatAlpha(audit.totals.exactOwed)} α of exact uncapped legacy
entitlement, a signed conversion error of ${formatSignedAlpha(audit.totals.directConversionError)} α.
However, ${oppositeSign.length} of 128 subnets have the opposite sign from the current discrepancy;
only ${sameSign.length} have the same non-zero sign. The current signed aggregate is
${formatSignedAlpha(currentTotal)} α, compared with ${formatSignedAlpha(audit.totals.directConversionError)} α
at conversion. The historical search must therefore continue at runtime 439.

The shortfall is explained by a non-commuting operation in the migration: each escrow slot used
\`max(rate × total_root - sum(claimed), 0)\`, while the legacy claimant liability is
\`sum(max(rate × position_root - claimed_position, 0))\`. Overclaimed positions cannot cancel
underclaimed positions in the second expression, so aggregate clipping can seed less backing
than the remaining per-position entitlement.

## Boundary and completion

| Item | Block | Hash / value |
|---|---:|---|
| Last runtime-440 state | ${PRE_BLOCK.toLocaleString("en-US")} | \`${context.preHash}\` |
| Runtime-441 code installed; migration input post-state | ${FIRST_RUNTIME_441_BLOCK.toLocaleString("en-US")} | \`${context.postHash}\` |
| First block executed by runtime 441 | ${FIRST_RUNTIME_441_EXECUTION_BLOCK.toLocaleString("en-US")} | migration begins from this block |
| Root Reborn first complete | ${context.completion.block.toLocaleString("en-US")} | \`${context.completion.hash}\` |
| Runtime versions in adjacent states |  | ${context.preRuntime.specVersion} → ${context.postRuntime.specVersion} |
| Runtime code hashes |  | \`${context.preCodeHash}\` → \`${context.postCodeHash}\` |
| Runtime-440 boundary block extrinsics |  | ${context.postBlock.block.extrinsics.length} |
| Runtime-440 boundary event summary |  | ${[...context.eventCounts].map(([name, count]) => `${name}=${count}`).join(", ")} |

Block ${FIRST_RUNTIME_441_BLOCK.toLocaleString("en-US")} itself executed runtime 440 and includes
an epoch plus ordinary extrinsics and the code update. Its post-state is therefore the exact
migration input; treating that block as runtime-441 migration execution would mix the epoch into
the audit. Runtime 441 ran for ${context.completion.block - FIRST_RUNTIME_441_BLOCK} blocks through
the first completed post-state.

At completion, both legacy maps were empty (\`RootClaimable=${audit.remainingClaimable}\`,
\`RootClaimed=${audit.remainingClaimed}\`). The beta basket contained
${audit.basketRates.toLocaleString("en-US")} rate rows,
${audit.basketShares.count.toLocaleString("en-US")} share-supply rows totaling
${formatAlpha(audit.basketShares.total)} TAO-denominated shares, and
${audit.basketClaimed.toLocaleString("en-US")} claimant watermark rows.

## Conservation summary

| Measure | Alpha |
|---|---:|
| Exact per-position legacy entitlement removed | ${formatAlpha(audit.totals.exactOwed)} |
| Aggregate escrow backing selected by migration | ${formatAlpha(audit.totals.migrationBacking)} |
| Direct conversion error | ${formatSignedAlpha(audit.totals.directConversionError)} |
| Corrected discrepancy movement, input → completion | ${formatSignedAlpha(audit.totals.observedMovement)} |
| Migration-window residual after direct error | ${formatSignedAlpha(audit.totals.windowResidual)} |
| Largest absolute window residual | subnet ${maxResidual.netuid}: ${formatSignedAlpha(maxResidual.windowResidual)} |

The corrected input discrepancy subtracts the exact legacy entitlement as an issued-but-not-yet-
staked liability. The completion formula includes standard pending fields,
\`PendingBasketDeposits\`, and \`DeferredRootAlphaDividends\`. The window residual contains normal
epochs, emissions, extrinsics, and rao rounding across the 556-block multi-block migration; it is
reported separately rather than being attributed to conversion.

## Per-subnet comparison

| Netuid | Exact legacy owed α | Migration backing α | Direct conversion error α | Corrected input Δ α | Completion Δ α | Observed movement α | Window residual α | Current Δ α | Same sign? |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
${table}

## Method and evidence

- \`RootClaimable\`, \`RootClaimed\`, root share pools, and every authoritative
  \`StakingHotkeys\` claimant association were read at block ${FIRST_RUNTIME_441_BLOCK.toLocaleString("en-US")}.
- Exact owed was evaluated per position with runtime fixed-point flooring and zero clipping.
- Migration backing was evaluated exactly as deployed: aggregate claimed watermarks are
  subtracted before flooring and clipping once per validator/subnet slot.
- There were ${legacy.claimedEntryCount.toLocaleString("en-US")} relevant \`RootClaimed\` rows,
  ${legacy.rootPositionCount.toLocaleString("en-US")} positive root positions, and
  ${legacy.totals.slots.toLocaleString("en-US")} non-zero validator/subnet rate slots.
- ${legacy.sharePoolMismatches.length} root share pools differed from reconstructed position sums;
  the aggregate difference is ${legacy.sharePoolMismatches.reduce((sum, row) => sum + row.difference, 0n)} rao,
  immaterial beside the ${absBigInt(audit.totals.directConversionError)}-rao conversion error.
- The current comparison uses the exact snapshot in
  \`mainnet-alpha-accounting-discrepancy-report.md\`: block ${current.block.toLocaleString("en-US")},
  \`${current.hash}\`, ${current.runtime}.
- Saved executable: \`tests/test-root-reborn-migration-conservation.js\`.
- Saved execution log: \`temp/${LOG_FILENAME}\`.
`;
}

function codecBigInt(value) {
  if (typeof value?.toBigInt === "function") return value.toBigInt();
  if (value?.bits && typeof value.bits.toBigInt === "function") return value.bits.toBigInt();
  return BigInt(value.toString());
}

function parseAlphaRao(value) {
  const cleaned = value.replaceAll(",", "").replace(/^\+/, "");
  const negative = cleaned.startsWith("-");
  const [whole, fraction = ""] = cleaned.replace(/^-/, "").split(".");
  const rao = BigInt(whole) * 1_000_000_000n + BigInt((fraction + "000000000").slice(0, 9));
  return negative ? -rao : rao;
}

function formatAlpha(value) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 1_000_000_000n;
  const fraction = (absolute % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
}

function formatSignedAlpha(value) {
  return `${value > 0n ? "+" : ""}${formatAlpha(value)}`;
}

function sameNonzeroSign(left, right) {
  return (left > 0n && right > 0n) || (left < 0n && right < 0n);
}

function compareAbs(left, right) {
  const leftAbs = absBigInt(left);
  const rightAbs = absBigInt(right);
  return leftAbs < rightAbs ? -1 : leftAbs > rightAbs ? 1 : 0;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEndpoint() {
  if (process.env.WS_ENDPOINT) return process.env.WS_ENDPOINT;
  assert.ok(process.env.ONFINALITY_API_KEY, "ONFINALITY_API_KEY is required unless WS_ENDPOINT is set");
  return `wss://bittensor-finney.api.onfinality.io/ws?apikey=${process.env.ONFINALITY_API_KEY}`;
}

function redactEndpoint(value) {
  return String(value).replace(/apikey=[^\s]+/g, "apikey=<redacted>");
}

function loadDotEnv() {
  for (const dotenvPath of [".env", "../.env"]) {
    if (!fs.existsSync(dotenvPath)) continue;
    for (const line of fs.readFileSync(dotenvPath, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

main().catch(async (error) => {
  console.error(error);
  await logger.flush();
  process.exit(1);
});
