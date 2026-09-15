import assert from "node:assert/strict";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

const WS_ENDPOINT = "ws://127.0.0.1:9944";
const PAGE_SIZE = 500;
const CLAIMED_VICTIM = 100_000_000n;
const CONTROLLED_TEST_HOTKEY = "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"; // //Dave

const logger = createTempLogger("test-runtime-458-mainnet-sharepool-exposure.log");
logger.captureConsole();

async function main() {
  await logger.start();
  const api = await connectApi(WS_ENDPOINT, { log: console.log, timeoutMs: 180_000 });
  try {
    await api.isReady;
    assert.equal(api.runtimeVersion.specVersion.toNumber(), 458, "scan requires runtime 458");
    const header = await api.rpc.chain.getHeader();
    const snapshotHash = await api.rpc.chain.getBlockHash(header.number);
    const view = await api.at(snapshotHash);

    const [denominatorEntries, valueEntries] = await Promise.all([
      pagedEntries(view.query.subtensorModule.totalHotkeySharesV2),
      pagedEntries(view.query.subtensorModule.totalHotkeyAlpha),
    ]);
    const denominators = new Map(denominatorEntries.map(([key, value]) => [
      poolKey(key.args[0], key.args[1]), decodeSafeFloat(value),
    ]));
    const values = new Map(valueEntries.map(([key, value]) => [
      poolKey(key.args[0], key.args[1]), value.toBigInt(),
    ]));

    let rows = 0;
    let nonzeroRows = 0;
    let overRatioRows = 0;
    let claimedSweepRows = 0;
    let externalClaimedSweepRows = 0;
    let valuelessStaleRows = 0;
    const findings = [];
    const candidatePools = new Set();
    await forEachPaged(view.query.subtensorModule.alphaV2, async ([key, value]) => {
      rows += 1;
      const share = decodeSafeFloat(value);
      if (share.mantissa === 0n) return;
      nonzeroRows += 1;
      const hotkey = key.args[0].toString();
      const coldkey = key.args[1].toString();
      const netuid = key.args[2].toNumber();
      const id = poolKey(key.args[0], key.args[2]);
      const denominator = denominators.get(id) ?? zero();
      const poolValue = values.get(id) ?? 0n;
      const overRatio = denominator.mantissa !== 0n && compareSafeFloat(share, denominator) > 0;
      const valuelessStale = poolValue === 0n && share.mantissa !== 0n;
      const drainResidual = overRatio ? subtractSafeFloat(share, denominator) : share;
      const claimedSweep = (overRatio || valuelessStale)
        && compareSafeFloat(drainResidual, fromInteger(CLAIMED_VICTIM)) >= 0;
      const controlledTestRow = hotkey === CONTROLLED_TEST_HOTKEY && netuid === 64;
      if (overRatio) overRatioRows += 1;
      if (valuelessStale) valuelessStaleRows += 1;
      if (claimedSweep) claimedSweepRows += 1;
      if (claimedSweep && !controlledTestRow) externalClaimedSweepRows += 1;
      if (overRatio) candidatePools.add(id);
      if ((overRatio || valuelessStale) && findings.length < 100) {
        findings.push({ hotkey, coldkey, netuid, id, poolValue, share, denominator, drainResidual, overRatio, valuelessStale, claimedSweep, controlledTestRow });
      }
    });

    const candidateMembers = new Map([...candidatePools].map((id) => [id, []]));
    await forEachPaged(view.query.subtensorModule.alphaV2, async ([key, value]) => {
      const id = poolKey(key.args[0], key.args[2]);
      if (!candidatePools.has(id)) return;
      const share = decodeSafeFloat(value);
      if (share.mantissa === 0n) return;
      candidateMembers.get(id).push({
        coldkey: key.args[1].toString(),
        share,
        quote: safeFloatQuote(values.get(id) ?? 0n, share, denominators.get(id) ?? zero()),
      });
    });

    let immediatelyExposedPools = 0;
    let immediatelyExposedRao = 0n;
    for (const finding of findings.filter(({ overRatio }) => overRatio)) {
      const members = candidateMembers.get(finding.id);
      const otherQuote = members
        .filter(({ coldkey }) => coldkey !== finding.coldkey)
        .reduce((sum, member) => sum + member.quote, 0n);
      finding.memberCount = members.length;
      finding.otherQuote = otherQuote;
      if (otherQuote > 0n) {
        immediatelyExposedPools += 1;
        immediatelyExposedRao += otherQuote;
      }
    }

    console.log("runtime:", api.runtimeVersion.specVersion.toString());
    console.log("snapshot block:", header.number.toString(), snapshotHash.toHex());
    console.log("denominator pools:", denominatorEntries.length);
    console.log("value pools:", valueEntries.length);
    console.log("AlphaV2 rows:", rows);
    console.log("nonzero AlphaV2 rows:", nonzeroRows);
    console.log("individual S > D rows:", overRatioRows);
    console.log("zero-value pools with stale S rows:", valuelessStaleRows);
    console.log(`rows whose post-drain S-D can claim ${CLAIMED_VICTIM} rao:`, claimedSweepRows);
    console.log("such rows outside the controlled SN64 test state:", externalClaimedSweepRows);
    console.log("S>D pools with another currently positive quote:", immediatelyExposedPools);
    console.log("other members' currently quoted alpha exposed to a full-pool withdrawal:", immediatelyExposedRao.toString());
    for (const finding of findings) console.log("finding:", formatFinding(finding));

    assert.equal(findings.filter(({ overRatio }) => overRatio).length, overRatioRows);
    assert.equal(externalClaimedSweepRows, 0, "cloned mainnet state contains an external residual large enough for the claimed sweep");
  } finally {
    await api.disconnect();
    await logger.flush();
  }
}

async function pagedEntries(query) {
  const all = [];
  await forEachPaged(query, (entry) => all.push(entry));
  return all;
}

async function forEachPaged(query, callback) {
  let startKey;
  while (true) {
    const page = await query.entriesPaged({ args: [], pageSize: PAGE_SIZE, startKey });
    for (const entry of page) await callback(entry);
    if (page.length < PAGE_SIZE) return;
    const nextKey = page.at(-1)[0].toHex();
    assert.notEqual(nextKey, startKey, "storage pagination did not advance");
    startKey = nextKey;
  }
}

function poolKey(hotkey, netuid) {
  return `${hotkey.toString()}:${netuid.toString()}`;
}

function zero() {
  return { mantissa: 0n, exponent: 0 };
}

function fromInteger(value) {
  if (value === 0n) return zero();
  let mantissa = value;
  let exponent = 0;
  while (mantissa <= 100_000_000_000_000_000_000n) {
    mantissa *= 10n;
    exponent -= 1;
  }
  return { mantissa, exponent };
}

function decodeSafeFloat(value) {
  const json = value.toJSON();
  return {
    mantissa: BigInt((json?.mantissa ?? json?.[0] ?? 0).toString()),
    exponent: Number(json?.exponent ?? json?.[1] ?? 0),
  };
}

function compareSafeFloat(left, right) {
  if (left.mantissa === 0n) return right.mantissa === 0n ? 0 : -1;
  if (right.mantissa === 0n) return 1;
  if (left.exponent !== right.exponent) return left.exponent > right.exponent ? 1 : -1;
  if (left.mantissa === right.mantissa) return 0;
  return left.mantissa > right.mantissa ? 1 : -1;
}

function subtractSafeFloat(left, right) {
  if (right.mantissa === 0n) return { ...left };
  if (left.exponent >= right.exponent) {
    const aligned = right.mantissa / power10(left.exponent - right.exponent);
    return normalizeSafeFloat(left.mantissa > aligned ? left.mantissa - aligned : 0n, left.exponent);
  }
  const aligned = left.mantissa / power10(right.exponent - left.exponent);
  return normalizeSafeFloat(aligned > right.mantissa ? aligned - right.mantissa : 0n, right.exponent);
}

function safeFloatQuote(value, share, denominator) {
  if (value === 0n || denominator.mantissa === 0n) return 0n;
  const valueFloat = fromInteger(value);
  const result = normalizeSafeFloat(
    (valueFloat.mantissa * share.mantissa) / denominator.mantissa,
    valueFloat.exponent + share.exponent - denominator.exponent,
  );
  const integer = result.exponent >= 0
    ? result.mantissa * (10n ** BigInt(result.exponent))
    : result.mantissa / (10n ** BigInt(-result.exponent));
  return integer > value ? value : integer;
}

function normalizeSafeFloat(mantissa, exponent) {
  if (mantissa === 0n) return zero();
  const maximum = 1_000_000_000_000_000_000_000n;
  while (mantissa > maximum) {
    mantissa /= 10n;
    exponent += 1;
  }
  while (mantissa <= maximum / 10n) {
    mantissa *= 10n;
    exponent -= 1;
  }
  return { mantissa, exponent };
}

function power10(exponent) {
  if (exponent > 22) return 10_000_000_000_000_000_000_000n;
  return 10n ** BigInt(exponent);
}

function formatFinding(finding) {
  return [
    `hotkey=${finding.hotkey}`,
    `coldkey=${finding.coldkey}`,
    `netuid=${finding.netuid}`,
    `V=${finding.poolValue}`,
    `S=${finding.share.mantissa}e${finding.share.exponent}`,
    `D=${finding.denominator.mantissa}e${finding.denominator.exponent}`,
    `overRatio=${finding.overRatio}`,
    `valuelessStale=${finding.valuelessStale}`,
    `SminusD=${finding.drainResidual.mantissa}e${finding.drainResidual.exponent}`,
    `claimedSweep=${finding.claimedSweep}`,
    `controlledTestRow=${finding.controlledTestRow}`,
    `members=${finding.memberCount ?? "n/a"}`,
    `otherQuote=${finding.otherQuote ?? "n/a"}`,
  ].join(" ");
}

main().catch(async (error) => {
  console.error(error);
  await logger.flush();
  process.exit(1);
});
