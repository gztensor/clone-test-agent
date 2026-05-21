// js-tests/tests/clone-smoke-test.js
import { ApiPromise, WsProvider } from "@polkadot/api";

const provider = new WsProvider("ws://127.0.0.1:9944");
const api = await ApiPromise.create({ provider });

const chain = await api.rpc.system.chain();
const header = await api.rpc.chain.getHeader();

console.log("chain:", chain.toString());
console.log("block:", header.number.toString());

await api.disconnect();

