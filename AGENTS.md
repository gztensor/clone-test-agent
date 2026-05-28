# AGENTS.md

This repository may be used for advanced local blockchain testing against a locally running clone of mainnet.

Read and follow these instructions before making changes.

# General Rules

1. Prefer minimal and targeted changes.
2. Do not modify unrelated code.
3. Do not commit changes unless explicitly instructed.
4. Do not rewrite or refactor unrelated files.
5. Preserve existing comments and formatting whenever practical.
6. Explain suspected runtime bugs before modifying runtime logic.
7. Prefer adding regression tests before changing runtime code.
8. You have read-only access to the subtensor code in `./subtensor-reference` folder. Use it for reference when you write JS tests. As an expetion you are allowed to build the subtensor if you are asked to do it explicitly.
9. Never leave background node processes running after finishing work.

# Permissions

You are allowed without asking permission to:
- download and install npm packages in this folder
- build subtensor and refresh the local mainnet clone under the sibling subtensor/clones directories
- start the existing local mainnet clone node
- run the JS tests against ws://127.0.0.1:9944
- check whether the local node is listening on ws://127.0.0.1:9944
- stop the smoke-test process that is waiting on the unavailable websocket
- stop the local node process you attempted to start
- run the local node in the foreground
- check whether the foreground node bound ws://127.0.0.1:9944

# Main Workflow

All prompts should be handled using the following steps that are described in more details below in this file:

1. Make the mainnet clone
2. Start the mainnet clone
3. Confirm block production, not just websocket availability
4. Run clone-smoke-test.js to ensure connectivity and correct operation of the clone
5. Runtime upgrade
6. Run clone-smoke-test.js again
7. Write and execute JS test
7a. If the JS test was edited after any run, rerun the final saved test file end-to-end before cleanup.
8. Cleanup by calling `stop-local-clone.sh`
9. Commit and push

## Make the mainnet clone

- Run `./scripts/clone-mainnet.sh` in the foreground.
- Wait for `../../clones/mainnet-clone` directory to appear (no longer than 1 mintue), if it does not appear, stop execution.
- Wait for the script to finish. It may run for extended time about 30 minutes or even longer. You may check the sync status, but having best block of 0 is normal, even if highest block is high numbers.
- When the script exits with 0 error, check that `../../clones/mainnet-clone` folder and `../../clones/mainnet-clone-chainspec.json` file exist. If not, stop execution.

## Start the mainnet clone

- Run `./scripts/start-local-clone` in the foreground.
- The node will initialize and start responding only in 90-120 seconds or more.
- Do not treat `ws://127.0.0.1:9944` listening as sufficient readiness.
- After the websocket starts listening, wait until the node is actively producing blocks before running smoke tests, runtime upgrades, or JS tests.
- Verify block production by polling `api.rpc.chain.getHeader()` until the block number increases at least twice across separate polls.
- Only continue once block height is advancing. If block height is stuck, keep waiting or report that the clone is not ready.

## Runtime upgrade

- Execute JS script by running `npm run runtime:update:alice`

## Write and execute JS test

Add new tests under:

```text
js-tests/
```

Rules:
1. Use code in `./subtensor-reference` in read-only mode as subject under test.
2. Never delete or overwrite tests created in previous sessions.
3. You may modify tests created during the current session until the current testing goal is achieved.
4. Prefer creating new files per feature, bug, or investigation.
5. Preserve historical regression and reproduction tests.
6. Do not refactor unrelated existing tests.
7. Do not rename existing test files unless explicitly instructed.
8. If a test becomes obsolete, comment why instead of deleting it.

Use descriptive filenames such as:

```text
test-lock-conviction-decay.js
test-total-issuance-slash-refund.js
test-owner-replacement-after-conviction.js
```

Avoid generic names such as:

```text
test.js
debug.js
tmp.js
```

After you execute the test, whether the functionality is confimed to work ok or fails, output the results.

Final verification rule:
- After any edit to a JS test file, always run the final saved file version end-to-end against a fresh or still-running upgraded clone.
- Do not count earlier inline probes, partial reproductions, or pre-edit runs as final verification.
- If the node was stopped after a partial run, restart the local clone, confirm block production again, run the runtime upgrade if needed, and execute the final test file.
- Only report the test as passed if the final saved file version was executed after the last edit and completed successfully.
- If the final saved file cannot be executed, say explicitly that only syntax or partial inline verification was completed.

## Commit and push

- When the LLM model believes the requested test or investigation is done, it must create a git commit and push it.
- This applies every time a test was added or modified and the final results have been reported.
- If the final saved test file was not executed end-to-end after the last edit, LLM must either:
  - restart the clone workflow and run the final saved test file before committing, or
  - explicitly report that the work is not done and must not commit yet.
- Do not leave completed test changes uncommitted.
- The commit message must be one line.

## Polkadot API script pattern

- All JS scripts/tests that use `@polkadot/api` must wrap execution in `async function main() { ... }`.
- At the bottom of the file, call `main().catch((err) => { console.error(err); process.exit(1); });`.
- Do not use top-level awaited API setup as the script entrypoint.
- After creating the API with `ApiPromise.create({ provider })`, always `await api.isReady` before making RPC, query, or tx calls.
- Always disconnect in a `finally` block.

## Test output logs

- Route JS test command output through files under `js-tests/temp/`: do not rely on the standard output and use file i/o in the tests. Use fs for text file blocking output only. Do not try to rely on console.log when you monitor tests. Prefer using the existing `js-tests/lib/file-log.js` helper for JS test logs.
- Keep `js-tests/temp/.gitkeep` tracked and ignore generated files in that folder.
- When reporting test results, read and summarize the relevant `js-tests/temp/*.log` file.
- Do not leave important test output only in terminal scrollback.

## Sandbox websocket workaround

- Saved JS files that use `@polkadot/api` against `ws://127.0.0.1:9944` may hang when run inside the Codex sandbox, even though equivalent inline `node --input-type=module -e ...` probes work.
- When running saved Polkadot JS scripts/tests against the local clone websocket, run them outside the sandbox with escalated permissions.
- This applies to commands such as:
  - `node tests/clone-smoke-test.js`
  - `npm run test`
  - `npm run runtime:update:alice`
  - `npm run test:locks-conviction`
- If a saved JS test stalls at `ApiPromise.create({ provider })` while the node is listening and producing blocks, stop the hanging test process and rerun the saved file outside the sandbox.
- Do not “fix” this by rewriting the test as inline Node. Final verification must still execute the saved test file.

## Building subtensor

- Change directory to `../../subtensor`
- Run `cargo build --release --workspace --all-targets`

## Testing on a live Testnet

- Use the endpoint `wss://test.finney.opentensor.ai:443`
- When you need test TAO, use the funded account id: `//TestnetFunded`

## Testing on a live Mainnet

- Use the endpoint: `wss://bittensor-finney.api.onfinality.io/ws?apikey=<api_key>`
- Use ONFINALITY_API_KEY from .env file to replace <api_key> placeholder
- Do not test with real balances, so any tests will be read-only
