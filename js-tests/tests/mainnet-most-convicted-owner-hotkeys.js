import assert from "node:assert/strict";
import fs from "node:fs";

import { connectApi } from "../lib/api.js";
import { createTempLogger } from "../lib/file-log.js";

loadDotenv();

const NETWORK = "mainnet";
const WS_ENDPOINT = process.env.WS_ENDPOINT ?? defaultEndpoint();
const START_NETUID = Number(process.env.START_NETUID ?? 1);
const END_NETUID = Number(process.env.END_NETUID ?? 128);
const logger = createTempLogger("mainnet-most-convicted-owner-hotkeys.log");
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
    const mismatches = [];

    console.log("network:", NETWORK);
    console.log("endpoint:", redactEndpoint(WS_ENDPOINT));
    console.log("chain:", chain.toString());
    console.log("runtime:", runtimeVersion.specName.toString(), runtimeVersion.specVersion.toString());
    console.log("block:", header.number.toString());
    console.log("block hash:", finalizedHash.toString());
    console.log("subnets checked:", `${START_NETUID}..${END_NETUID}`);

    for (let netuid = START_NETUID; netuid <= END_NETUID; netuid += 1) {
      const [networkAdded, ownerHotkey, mostConvictedHotkey] = await Promise.all([
        api.query.subtensorModule.networksAdded.at(finalizedHash, netuid),
        api.query.subtensorModule.subnetOwnerHotkey.at(finalizedHash, netuid),
        getMostConvictedHotkey(finalizedHash, netuid),
      ]);
      const owner = ownerHotkey.toString();
      const mostConvicted = optionAccountToString(mostConvictedHotkey);
      const matches = mostConvicted === owner;

      if (!matches) {
        mismatches.push({ netuid, networkAdded: networkAdded.isTrue, owner, mostConvicted });
      }
    }

    console.log("different subnet count:", mismatches.length);
    if (mismatches.length === 0) {
      console.log("different subnets: none");
    } else {
      for (const row of mismatches) {
        console.log(
          "different subnet:",
          `netuid=${row.netuid}`,
          `network_added=${row.networkAdded}`,
          `owner=${row.owner}`,
          `most_convicted=${row.mostConvicted ?? "<none>"}`
        );
      }
    }

    console.log("mainnet most convicted owner hotkey comparison: ok");
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
    ["SubtensorModule.NetworksAdded", api.query.subtensorModule?.networksAdded],
    ["SubtensorModule.SubnetOwnerHotkey", api.query.subtensorModule?.subnetOwnerHotkey],
  ].filter(([, value]) => !value);

  assert.equal(missing.length, 0, `${missing.map(([name]) => name).join(", ")} unavailable on mainnet`);
}

async function getMostConvictedHotkey(blockHash, netuid) {
  const method = api.call.stakeInfoRuntimeApi.getMostConvictedHotkeyOnSubnet;
  if (typeof method.at === "function") {
    return method.at(blockHash, netuid);
  }
  return method(netuid);
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
