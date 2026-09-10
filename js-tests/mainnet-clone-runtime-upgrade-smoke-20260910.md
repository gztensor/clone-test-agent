# Fresh mainnet clone runtime upgrade smoke test — 2026-09-10

Result: PASS. A newly synced mainnet clone upgraded from runtime 455 to 456 using `sudo(system.setCode)` and continued producing blocks.

- Supplied artifact: `/Users/grigorizaitsev/development/tmp/node_subtensor_runtime.compact.compressed.wasm`
- Size: 2,717,452 bytes
- SHA-256: `15debc17670739f2295b33849918dd87fd8e1c05a89beca5871ca0cea41d6409`
- The prior chainspec was moved to `../../clones/mainnet-clone-chainspec.pre-20260910.json` to force a fresh sync through `scripts/clone-mainnet.sh`. The script exited 0 and produced a new chainspec and clone directory.
- Before smoke testing, separate `api.rpc.chain.getHeader()` polls observed blocks 0 → 1 → 2.
- `tests/clone-smoke-test.js` completed before the upgrade at block 3 and after the upgrade at block 8.
- `npm run runtime:update:alice` finalized the upgrade in block `0x520d4e4a263d4db0e1f4af3784e9cf74030cb8fb970401a22bb7421b0752f2b4` and reconnected to runtime 456.
- The final saved `tests/test-mainnet-clone-runtime-upgrade-smoke.js` executed end-to-end after its last edit and exited 0. It verified exact on-chain WASM equality, readable runtime metadata, and block advancement 9 → 10 → 11.
- Cleanup used `scripts/stop-local-clone.sh`.

Run the added test from `js-tests/` with:

```sh
RUNTIME_WASM_PATH=/path/to/runtime.compact.compressed.wasm node tests/test-mainnet-clone-runtime-upgrade-smoke.js
```

Evidence logs, retained locally under the ignored `js-tests/temp/` directory:

- `mainnet-clone-20260910.log`
- `mainnet-clone-node-20260910.log`
- `mainnet-clone-readiness-20260910.log`
- `mainnet-clone-pre-upgrade-20260910.log`
- `mainnet-clone-upgrade-20260910.log`
- `mainnet-clone-post-upgrade-20260910.log`
- `mainnet-clone-runtime-upgrade-smoke.log`

The sync/export log contained transaction-validation codec panics and essential-task shutdown messages. Clone creation nevertheless exited 0, and the exported local clone passed the checks above. The cause of those sync-time messages was not investigated. This is a runtime installation and liveness smoke test; it does not certify individual pallet behavior or migration correctness.
