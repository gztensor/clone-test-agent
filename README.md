# Clone Test Agent

This project is a small harness for using Codex to create and run JavaScript regression tests against a local Subtensor mainnet clone.

The goal is to make advanced local blockchain testing repeatable: build or reuse a patched mainnet clone, start a local validator node, optionally upgrade it to the runtime in `subtensor-reference/`, then run focused JS tests through `@polkadot/api`.

## What Happens

The normal workflow is:

1. `scripts/clone-mainnet.sh` verifies or creates a patched mainnet clone chainspec under `../../clones`.
2. `scripts/start-local-clone.sh` starts a local node from that chainspec at `ws://127.0.0.1:9944`.
3. `js-tests/tests/clone-smoke-test.js` confirms the websocket endpoint is usable.
4. `js-tests/scripts/update-runtime-with-alice.js` submits a sudo runtime upgrade from Alice using the wasm in `subtensor-reference/`.
5. Feature tests under `js-tests/tests/` exercise runtime behavior against the upgraded local clone.
6. `scripts/stop-local-clone.sh` stops the node so no background process is left running.

The current focused regression test is `js-tests/tests/test-balancer-operation.js`. It verifies that balancer storage is initialized, initialized balancer weights stay in the `0.45-0.55` range with at least one subnet not exactly `0.5`, balance transfers work, and epoch activity updates subnet reserves within the configured wait window.

## How To Use

### Manual Build Process

This repository expects a sibling Subtensor checkout for the node binary, plus the read-only `subtensor-reference/` tree in this workspace for runtime reference and wasm upgrades:

```text
development/
  subtensor/
  agents/codex-tester/
```

Build the node binary manually in the sibling `subtensor/` checkout:

```sh
cd ../../subtensor
cargo build --release
```

Build the runtime wasm used for upgrades in `subtensor-reference/`:

```sh
cd /path/to/agents/codex-tester
cd subtensor-reference
cargo build --release -p node-subtensor-runtime
```

The runtime upgrade script expects this file:

```text
subtensor-reference/target/release/wbuild/node-subtensor-runtime/node_subtensor_runtime.compact.compressed.wasm
```

Install JS dependencies:

```sh
cd js-tests
npm install
```

Create or reuse the local clone chainspec:

```sh
./scripts/clone-mainnet.sh
```

Start the local clone in another terminal:

```sh
./scripts/start-local-clone.sh
```

The node may take 90-120 seconds or more before `ws://127.0.0.1:9944` responds.

Run the smoke test:

```sh
cd js-tests
npm test
```

Upgrade the local clone to the current reference runtime:

```sh
npm run runtime:update:alice
```

Run the balancer operation test:

```sh
npm run test:balancer-operation
```

Stop the local clone when finished:

```sh
./scripts/stop-local-clone.sh
```

### Prompt Examples

Use prompts like these with Codex:

```text
Re-read AGENTS.md and write a JS test that verifies balance transfers after a runtime upgrade.
```

```text
Re-read AGENTS.md and write a test that verifies balancer initialization, non-default balancer weights, balance transfers, and reserve updates after an epoch.
```

```text
Run the local clone workflow, upgrade to the runtime in subtensor-reference, execute the balancer operation test, then stop the node.
```

```text
Inspect the failed JS test output and node logs, explain the likely runtime issue, and make the smallest test change needed to capture it.
```

## Notes

- `subtensor-reference/` is read-only reference material for tests.
- Local clone data and chainspec files live outside this repo under `../../clones`.
- Do not leave a local node running after a test session.
- Keep new JS tests focused and descriptive; avoid broad refactors during runtime investigations.
