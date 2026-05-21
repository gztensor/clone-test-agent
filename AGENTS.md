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
8. You have read-only access to the subtensor code in `./subtensor-reference` folder. Use it for reference when you write JS tests.
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
3. Run clone-smoke-test.js to ensure connectivity and correct operation of the clone
4. Runtime upgrade
5. Run clone-smoke-test.js again
6. Write and execute JS test
7. Cleanup by calling `stop-local-clone.sh`
8. Create git commit with commit message no longer than 1 line and push

## Make the mainnet clone

- Run `./scripts/clone-mainnet.sh` in the foreground.
- Wait for `../../clones/mainnet-clone` directory to appear (no longer than 1 mintue), if it does not appear, stop execution.
- Wait for the script to finish. It may run for extended time about 30 minutes or even longer. You may check the sync status, but having best block of 0 is normal, even if highest block is high numbers.
- When the script exits with 0 error, check that `../../clones/mainnet-clone` folder and `../../clones/mainnet-clone-chainspec.json` file exist. If not, stop execution.

## Start the mainnet clone

- Run `./scripts/start-local-clone` in the foreground.
- The node will initialize and start responding only in 90-120 seconds or more.

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
