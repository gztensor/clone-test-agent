import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const NETWORK = "mainnet";
const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const START_NETUID = Number(process.env.START_NETUID ?? 1);
const END_NETUID = Number(process.env.END_NETUID ?? 128);
const BLOCKS_PER_DAY = 7200n;
const ONE_YEAR_BLOCKS = 7200n * 365n + 1800n;
const CSV_REPORT_URL = new URL("../temp/mainnet-most-convicted-owner-hotkeys-filtered.csv", import.meta.url);
const logger = createTempLogger("mainnet-most-convicted-owner-hotkeys-filtered.log");
logger.captureConsole();

let api;

async function main() {
  await logger.start();
  api = await connectApi(WS_ENDPOINT, { log: (message) => console.log(redactEndpoint(message)) });

  try {
    assertMetadataAvailable();

    const chain = await api.rpc.system.chain();
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();
    const finalizedHash = await api.rpc.chain.getFinalizedHead();
    const header = await api.rpc.chain.getHeader(finalizedHash);
    const blockNumber = header.number.toBigInt();
    const mismatches = [];
    const excluded = [];
    const reportRows = [];
    const [networkAddedByNetuid, ownerHotkeyByNetuid, alphaOutByNetuid, registeredAtByNetuid] =
      await Promise.all([
        readNetuidMap(finalizedHash, "networksAdded", (value) => value.isTrue),
        readNetuidMap(finalizedHash, "subnetOwnerHotkey", (value) => value.toString()),
        readNetuidMap(finalizedHash, "subnetAlphaOut", (value) => value.toBigInt()),
        readNetuidMap(finalizedHash, "networkRegisteredAt", (value) => value.toBigInt()),
      ]);
    const totalAlphaOut = sumActiveAlphaOut(networkAddedByNetuid, alphaOutByNetuid);

    console.log("network:", NETWORK);
    console.log("endpoint:", redactEndpoint(WS_ENDPOINT));
    console.log("chain:", chain.toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("block:", blockNumber.toString());
    console.log("block hash:", finalizedHash.toString());
    console.log("subnets checked:", `${START_NETUID}..${END_NETUID}`);
    console.log("total active SubnetAlphaOut in checked range:", totalAlphaOut.toString());
    console.log("minimum age blocks:", ONE_YEAR_BLOCKS.toString());
    console.log("minimum conviction threshold:", "10% of SubnetAlphaOut");

    for (let netuid = START_NETUID; netuid <= END_NETUID; netuid += 1) {
      const networkAdded = networkAddedByNetuid.get(netuid) ?? false;
      const owner = ownerHotkeyByNetuid.get(netuid);
      const mostConvictedHotkey = await getMostConvictedHotkey(finalizedHash, netuid);
      const mostConvicted = optionAccountToString(mostConvictedHotkey);

      if (!networkAdded || mostConvicted === owner) {
        continue;
      }

      const convictionBits = mostConvicted
        ? decodeU64F64Bits(await getHotkeyConviction(finalizedHash, mostConvicted, netuid))
        : 0n;
      const alphaOut = alphaOutByNetuid.get(netuid) ?? 0n;
      const registeredAt = registeredAtByNetuid.get(netuid) ?? 0n;
      const ageBlocks = blockNumber >= registeredAt ? blockNumber - registeredAt : 0n;
      const convictionBelowThreshold = convictionBits * 10n < (alphaOut << 64n);
      const registeredLessThanOneYearAgo = ageBlocks < ONE_YEAR_BLOCKS;
      const row = {
          netuid,
          networkAdded,
          owner,
          mostConvicted,
          convictionBits,
          alphaOut,
          alphaOutShare: formatShare(alphaOut, totalAlphaOut),
          registeredAt,
          ageBlocks,
          ageDays: formatAgeDays(ageBlocks),
      };

      if (convictionBelowThreshold || registeredLessThanOneYearAgo) {
        const excludedRow = { ...row, convictionBelowThreshold, registeredLessThanOneYearAgo };
        excluded.push(excludedRow);
        reportRows.push({ ...excludedRow, status: "excluded" });
      } else {
        mismatches.push(row);
        reportRows.push({
          ...row,
          status: "included",
          convictionBelowThreshold,
          registeredLessThanOneYearAgo,
        });
      }
    }

    reportRows.sort(compareReportRows);
    const csv = toCsv(reportRows);
    fs.mkdirSync(new URL("../temp/", import.meta.url), { recursive: true });
    fs.writeFileSync(CSV_REPORT_URL, `${csv}\n`);
    console.log("csv report:", fileURLToPathString(CSV_REPORT_URL));
    console.log(csv);

    console.log("excluded subnet count:", excluded.length);
    for (const row of excluded) {
      console.log(
        "excluded subnet:",
        `netuid=${row.netuid}`,
        `network_added=${row.networkAdded}`,
        `owner=${row.owner}`,
        `most_convicted=${row.mostConvicted ?? "<none>"}`,
        `conviction=${formatU64F64(row.convictionBits)}`,
        `subnet_alpha_out=${row.alphaOut}`,
        `subnet_alpha_out_share=${row.alphaOutShare}`,
        `registered_at=${row.registeredAt}`,
        `age_blocks=${row.ageBlocks}`,
        `age_days=${row.ageDays}`,
        `conviction_below_threshold=${row.convictionBelowThreshold}`,
        `registered_less_than_one_year_ago=${row.registeredLessThanOneYearAgo}`
      );
    }

    console.log("different subnet count after exclusions:", mismatches.length);
    if (mismatches.length === 0) {
      console.log("different subnets after exclusions: none");
    } else {
      for (const row of mismatches) {
        console.log(
          "different subnet:",
          `netuid=${row.netuid}`,
          `network_added=${row.networkAdded}`,
          `owner=${row.owner}`,
          `most_convicted=${row.mostConvicted ?? "<none>"}`,
          `conviction=${formatU64F64(row.convictionBits)}`,
          `subnet_alpha_out=${row.alphaOut}`,
          `subnet_alpha_out_share=${row.alphaOutShare}`,
          `registered_at=${row.registeredAt}`,
          `age_blocks=${row.ageBlocks}`,
          `age_days=${row.ageDays}`
        );
      }
    }

    console.log("mainnet filtered most convicted owner hotkey comparison: ok");
  } finally {
    await api?.disconnect();
  }
}

function assertMetadataAvailable() {
  const missing = [
    [
      "StakeInfoRuntimeApi.getMostConvictedHotkeyOnSubnet",
      api.call.stakeInfoRuntimeApi?.getMostConvictedHotkeyOnSubnet,
    ],
    ["StakeInfoRuntimeApi.getHotkeyConviction", api.call.stakeInfoRuntimeApi?.getHotkeyConviction],
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.SubnetOwnerHotkey", api.query.subtensorModule?.subnetOwnerHotkey],
    ["SubtensorModule.SubnetAlphaOut", api.query.subtensorModule?.subnetAlphaOut],
    ["SubtensorModule.NetworkRegisteredAt", api.query.subtensorModule?.networkRegisteredAt],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `${missing.map(([name]) => name).join(", ")} unavailable on mainnet`);
}

async function getMostConvictedHotkey(blockHash, netuid) {
  const method = api.call.stakeInfoRuntimeApi.getMostConvictedHotkeyOnSubnet;
  if (typeof method.at === "function") {
    return withRateLimitRetry(() => method.at(blockHash, netuid));
  }
  return withRateLimitRetry(() => method(netuid));
}

async function getHotkeyConviction(blockHash, hotkey, netuid) {
  const method = api.call.stakeInfoRuntimeApi.getHotkeyConviction;
  if (typeof method.at === "function") {
    return withRateLimitRetry(() => method.at(blockHash, hotkey, netuid));
  }
  return withRateLimitRetry(() => method(hotkey, netuid));
}

async function readNetuidMap(blockHash, storageName, decode) {
  const entries = await withRateLimitRetry(() => api.query.subtensorModule[storageName].entriesAt(blockHash));
  const values = new Map();
  for (const [key, value] of entries) {
    values.set(key.args[0].toNumber(), decode(value));
  }
  return values;
}

async function withRateLimitRetry(operation) {
  let delayMs = 1_000;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const value = await operation();
      await sleep(100);
      return value;
    } catch (error) {
      if (!isRateLimitError(error) || attempt === 6) {
        throw error;
      }
      console.log(`rate limited; retrying in ${delayMs}ms`);
      await sleep(delayMs);
      delayMs *= 2;
    }
  }
  throw new Error("unreachable rate limit retry state");
}

function isRateLimitError(error) {
  return String(error?.message ?? error).includes("Too Many Requests");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function optionAccountToString(value) {
  if (value?.isNone) {
    return undefined;
  }
  if (value?.isSome) {
    return value.unwrap().toString();
  }

  const json = value.toJSON?.();
  if (json === null || json === undefined) {
    return undefined;
  }
  return value.toString();
}

function decodeU64F64Bits(value) {
  if (value?.bits !== undefined) {
    return parseBigIntish(value.bits);
  }
  if (value.toBigInt) {
    return value.toBigInt();
  }

  const json = value.toJSON?.();
  if (json?.bits !== undefined) {
    return parseBigIntish(json.bits);
  }

  const human = value.toHuman?.();
  if (human?.bits !== undefined) {
    return parseBigIntish(human.bits);
  }

  const parsed = JSON.parse(value.toString());
  return parseBigIntish(parsed.bits);
}

function parseBigIntish(value) {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    return BigInt(value);
  }
  if (typeof value === "string") {
    return BigInt(value.replaceAll(",", ""));
  }
  if (value?.toString && value.toString !== Object.prototype.toString) {
    return BigInt(value.toString().replaceAll(",", ""));
  }
  throw new Error(`could not decode bigint value from ${value}`);
}

function formatU64F64(bits) {
  const whole = bits >> 64n;
  const fraction = bits & ((1n << 64n) - 1n);
  const decimal = (fraction * 1_000_000n) >> 64n;
  return `${whole}.${decimal.toString().padStart(6, "0")}`;
}

function sumActiveAlphaOut(networkAddedByNetuid, alphaOutByNetuid) {
  let total = 0n;
  for (let netuid = START_NETUID; netuid <= END_NETUID; netuid += 1) {
    if (networkAddedByNetuid.get(netuid) ?? false) {
      total += alphaOutByNetuid.get(netuid) ?? 0n;
    }
  }
  return total;
}

function formatShare(value, total) {
  if (total === 0n) {
    return "0.000000000000";
  }
  const scaled = (value * 1_000_000_000_000n) / total;
  const whole = scaled / 1_000_000_000_000n;
  const fraction = scaled % 1_000_000_000_000n;
  return `${whole}.${fraction.toString().padStart(12, "0")}`;
}

function formatAgeDays(ageBlocks) {
  const scaled = (ageBlocks * 10_000n) / BLOCKS_PER_DAY;
  const whole = scaled / 10_000n;
  const fraction = scaled % 10_000n;
  return `${whole}.${fraction.toString().padStart(4, "0")}`;
}

function compareReportRows(a, b) {
  if (a.ageBlocks !== b.ageBlocks) {
    return a.ageBlocks > b.ageBlocks ? -1 : 1;
  }
  if (a.alphaOut !== b.alphaOut) {
    return a.alphaOut > b.alphaOut ? -1 : 1;
  }
  return a.netuid - b.netuid;
}

function toCsv(rows) {
  const headers = [
    "netuid",
    "status",
    "subnet_age_days",
    "subnet_alpha_out_share",
    "subnet_alpha_out",
    "conviction",
    "registered_at",
    "age_blocks",
    "owner",
    "most_convicted",
    "conviction_below_threshold",
    "registered_less_than_one_year_ago",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.netuid,
        row.status,
        row.ageDays,
        row.alphaOutShare,
        row.alphaOut,
        formatU64F64(row.convictionBits),
        row.registeredAt,
        row.ageBlocks,
        row.owner,
        row.mostConvicted ?? "",
        row.convictionBelowThreshold,
        row.registeredLessThanOneYearAgo,
      ]
        .map(csvValue)
        .join(",")
    );
  }
  return lines.join("\n");
}

function csvValue(value) {
  const string = String(value);
  if (!/[",\n\r]/.test(string)) {
    return string;
  }
  return `"${string.replaceAll('"', '""')}"`;
}

function fileURLToPathString(url) {
  return fileURLToPath(url);
}

function defaultEndpoint() {
  assert.ok(
    process.env.ONFINALITY_API_KEY,
    "ONFINALITY_API_KEY is required for mainnet unless WS_ENDPOINT is set"
  );
  return `wss://bittensor-finney.api.onfinality.io/ws?apikey=${process.env.ONFINALITY_API_KEY}`;
}

function loadDotenv() {
  for (const path of [".env", "../.env"]) {
    if (!fs.existsSync(path)) {
      continue;
    }

    for (const line of fs.readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) {
        continue;
      }

      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

function redactEndpoint(endpoint) {
  return endpoint.replace(/(apikey=)[^&]+/i, "$1<redacted>");
}

main().catch(async (err) => {
  await logger.error(err);
  await logger.flush();
  process.exit(1);
});
