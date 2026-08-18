# Plan: locate the historical runtime that created the alpha-accounting discrepancy

## Objective

Find the newest historical runtime whose epoch execution produces an alpha-accounting drift materially larger than the noise measured on corrected runtime 447. Runtime 446's accounting repair must be excluded as a cause: every candidate receives the ongoing burned-alpha accounting fix, while the already-corrected runtime-447 snapshot supplies the data and no accounting migration is rerun.

The accounting invariant is evaluated per active alpha subnet:

```text
actual = sum(TotalHotkeyAlpha(hotkey, netuid))
pending = PendingServerEmission
        + PendingValidatorEmission
        + PendingRootAlphaDivs
        + PendingOwnerCut
        + PendingBasketDeposits
calculated = SubnetAlphaOut - AlphaBurned - pending - SubnetProtocolAlpha
discrepancy = actual - calculated
```

Root (netuid 0) is included in network and epoch checks but excluded from this alpha-subnet formula.

## Known controls

- Corrected adjacent-block drift on runtime 447: `-2` to `-3` rao per block on 127 alpha subnets; subnet 86 was unchanged.
- Corrected two-tempo noise maximum: `0.000021877 alpha` over 720 blocks.
- Corrected long-run maximum after runtime 446: `0.000868309 alpha` over 29,628 blocks, equivalent to `0.000021101 alpha` per 720 blocks (`0.964x` the two-tempo maximum).
- Runtime 446 first appeared in post-state at block 8,843,319. The three accounting migrations were complete by block 8,843,324.
- The [PR #1321 root-dividend fix](https://github.com/RaoFoundation/subtensor/pull/1321) changes alpha dividends from the full validator dividend to `dividend - root_divs`. The PR was closed without merge, but the same source patch is present in git commit `956263fbb8994386bf209d307b062955ce42d83a` (`sub out root divs to get alpha divs`). Mainnet block 4,962,968 is the supplied live-fix boundary and must be verified against chain runtime history before using it to map candidates.

These values form the control envelope. Raw movement over a longer run is not sufficient evidence; every result must also be normalized to 720 blocks and compared with the control per subnet and with the global `0.000021877 alpha` maximum.

The `100x` search threshold is intentionally conservative relative to the expected historical signal. If the defect accumulated 100% of the present residual over approximately 2,000,000 blocks, linear scaling predicts about `30,000 / 2,000,000 = 1.5%` of that residual over 30,000 blocks. Corrected runtime 447 moved only about `0.00004%` of the residual over the same scale, so the expected defective signal is approximately `1.5% / 0.00004% = 37,500x` the observed drift. This comparison is valid only when both percentages use the same denominator. Reports must therefore show raw alpha movement and movement as a percentage of the same starting residual, and must also normalize by executed epochs because the suspected defect is epoch-driven.

## Safety and reproducibility rules

1. Keep one pristine, stopped runtime-447 clone as the common base state. Never run a candidate directly on that copy.
2. Create or restore a disposable working copy from the pristine clone for every candidate. Each iteration must start at the same block hash and storage root.
3. Use an isolated git worktree or disposable branch for historical runtime builds. Record the original commit, patched-tree diff, and WASM hash.
4. Do not push, publish, or use real balances. Alice is sudo only on the local clone.
5. Do not allow historical runtime migrations to mutate the freshly corrected state. Verify this rather than assuming version guards will skip them.
6. Stop every node and test process after each iteration. Preserve logs and reports; preserve the pristine clone.
7. Never interpret a failed upgrade, storage incompatibility, panic, or stalled epoch as accounting evidence. Report it as candidate incompatibility and resolve or document it separately.

## Phase 1: create and certify the runtime-447 base snapshot

1. Run `./scripts/clone-mainnet.sh` in the foreground and wait for successful completion.
2. Confirm the new clone data directory and chainspec exist.
3. Start the clone, wait for websocket readiness, and prove block production by observing at least two block-height increases.
4. Run `clone-smoke-test.js` and save its log under `js-tests/temp/`.
5. At one finalized local block, record:
   - block number and hash;
   - state root and genesis hash;
   - runtime name/version (`447` expected);
   - active network list and tempo distribution;
   - all three runtime-446 accounting migration markers;
   - the discrepancy and every formula component for all 128 alpha subnets.
6. Require all three migration markers to be true:
   - `migrate_fix_rao_alpha_out_accounting`;
   - `migrate_rebase_recycled_alpha_asset_counters`;
   - `migrate_backfill_historical_alpha_burned`.
7. Stop the clone cleanly. Save this stopped data directory as the pristine base, with a checksum/manifest. Every candidate begins from a disposable copy of this exact state.

## Phase 2: map deployed runtime versions to source commits

1. Build a descending candidate list beginning with runtime 445, then 444, 443, and so on. Runtime 446 is excluded because it is the repair under control.
2. Do not assume every spec version has a matching tag. For each deployed version:
   - locate its first mainnet block with historical `state_getRuntimeVersion` queries;
   - record the on-chain `:code` hash at that boundary;
   - locate the release commit using tags, release branches, and `git log -S 'spec_version: <N>'`;
   - verify the source runtime version and, where possible, match the published WASM/code hash.
3. Verify the supplied block 4,962,968 boundary and record which spec version became active there.
4. For each candidate, record whether the PR #1321-equivalent patch is already present. Detect behaviorally in `pallets/subtensor/src/coinbase/run_coinbase.rs`: alpha dividends must accumulate `dividend - root_divs`, not the full `dividend` in addition to separately recorded root dividends.
5. Store the mapping in the eventual report so a result names both the spec version and exact git commit.

## Phase 3: prepare one historical candidate

Repeat this phase for one candidate at a time, starting at runtime 445 and descending.

1. Restore a fresh disposable clone from the pristine runtime-447 base.
2. Check out the exact historical source commit in the build worktree.
3. Change only the candidate WASM `spec_version` to `448`. Keep the candidate identity separately in build metadata and the report; `448` is only the monotonically acceptable local upgrade number above the cloned state's `447`.
4. Backport the non-migration part of the runtime-446 burned-alpha accounting repair:
   - preserve correct generation-scoped `AlphaBurned`, `TotalAlphaIssuance`, and `AlphaRecycled` behavior when a netuid is dissolved and reused;
   - apply the relevant runtime behavior from the version-446 accounting fix (not its historical correction tables or backfill migrations);
   - add focused unit tests proving counters belong to the current subnet generation and ongoing burns are accounted once.
5. Inspect `run_coinbase.rs` for the PR #1321 behavior. If absent, apply the minimal equivalent of commit `956263fbb`:
   - compute `root_divs = dividend * root_prop`;
   - compute `alpha_divs = dividend - root_divs`;
   - add only `alpha_divs` to `alpha_dividends`;
   - continue adding `root_divs` to `root_dividends`.
6. Add or retain a regression test proving root dividends are not also included in alpha dividends. The sum of the two paths must equal the original dividend within fixed-point rounding.
7. Audit all `on_runtime_upgrade` hooks and storage-version migrations in the historical candidate. Since the base snapshot is already corrected:
   - disable candidate migrations for this experiment or make their skip conditions explicit;
   - do not include runtime-446 correction/backfill tables;
   - prove with a dry run or pre/post storage assertions that the upgrade itself does not rewrite the accounting components.
8. Build `node-subtensor` and the compact runtime WASM. Record:
   - historical commit;
   - complete patch diff;
   - Rust toolchain and build command;
   - WASM path, size, and SHA-256 hash;
   - unit-test results.

If the historical code cannot compile with the required two control fixes, resolve only compatibility issues needed for those fixes and document every change. Do not silently import later emission logic, because that could remove the bug being searched for.

## Phase 4: upgrade and establish the candidate baseline

1. Start the disposable clone and prove block production.
2. Run the pre-upgrade smoke test.
3. At an exact pre-upgrade block hash, capture all discrepancy components for every alpha subnet.
4. Upgrade through `npm run runtime:update:alice` using the candidate-as-448 WASM.
5. Wait for the upgrade block to finalize and confirm the on-chain runtime reports spec 448 and the expected WASM hash.
6. Run the post-upgrade smoke test.
7. Confirm no migration ran and no accounting component received a step change from the upgrade itself. Compare the first post-upgrade snapshot with the pre-upgrade snapshot, accounting separately for normal per-block issuance.
8. Capture a candidate baseline at an exact post-upgrade block before the first candidate epoch. Record each subnet's epoch marker/counter at that block.

Abort the iteration as invalid if a historical migration ran, the accounting state changed discontinuously during upgrade, the active subnet set changed, or block production/epoch execution is not healthy.

## Phase 5: observe epoch drift

1. Accelerate local block production without changing tempo, emission, stake, burn, or accounting storage. Record the acceleration method and prove state-transition order is unchanged.
2. Detect successful epochs from the strongest marker available in that candidate:
   - prefer `SubnetEpochIndex` increments;
   - otherwise use `LastEpochBlock`/the historical epoch marker and verify the corresponding emission distribution state change.
3. Continue until every active alpha subnet has executed at least one epoch after the candidate baseline. Current state includes non-uniform tempos, so do not assume that 360 blocks covers every subnet.
4. Capture exact pre-epoch and post-epoch accounting snapshots where practical, plus one aggregate snapshot after all subnets have crossed an epoch.
5. For every subnet calculate:
   - signed and absolute discrepancy before and after;
   - discrepancy movement in rao and alpha;
   - movement per executed epoch;
   - movement normalized to 720 blocks;
   - ratio to that subnet's runtime-447 control movement;
   - ratio to the global `0.000021877 alpha` two-tempo maximum;
   - component deltas for actual stake, calculated stake, `SubnetAlphaOut`, `AlphaBurned`, pending alpha, and protocol alpha.
6. Separate the upgrade-block movement, ordinary non-epoch per-block drift, extrinsic-driven movement, and the epoch step. A candidate is not implicated merely because its raw discrepancy is larger after many blocks.

## Decision rule

Classify an iteration as follows:

- **No acceleration:** the 720-block-normalized movement remains within the runtime-447 control envelope and no repeatable epoch step appears. Restore the pristine clone and test the next lower deployed runtime.
- **Borderline/elevated:** normalized movement exceeds the per-subnet control but is less than `100x` the corrected control, or the movement cannot be isolated from another transition. Run at least one additional epoch and repeat from a fresh clone before deciding. Do not discard these results; a state-dependent or partial defect may be smaller than the linear estimate.
- **Root-cause candidate found:** an epoch produces a deterministic accounting step that is at least `100x` the corrected control after normalization, has matching component evidence, and reproduces from the pristine snapshot. Stop descending, preserve all artifacts, and report the candidate version and exact source diff. A result at or above `1,000x` is exceptionally strong evidence, but `1,000x` is not required to stop.

The `100x` threshold is a search/stopping threshold, not an accounting tolerance. It remains far below the approximately `37,500x` signal predicted by the simple 2,000,000-to-30,000-block scaling argument. All non-zero rao differences remain in the tables. If a clearly structural error moves substantial alpha but does not fit the numerical threshold, stop and report it with the evidence rather than continuing blindly.

## Descending search loop

For candidate versions `445, 444, 443, ...`:

1. Restore the identical runtime-447 base state.
2. Prepare the historical candidate as local spec 448.
3. Apply only the burned-alpha behavioral control and PR #1321 control if missing.
4. Prove no migrations will run.
5. Build, upgrade, smoke-test, and capture the post-upgrade baseline.
6. Run through at least one verified epoch per active alpha subnet.
7. Calculate and normalize drift.
8. Apply the decision rule.
9. If there is no acceleration, stop/clean the node, archive the iteration report, and continue to the next lower deployed runtime.
10. If a root-cause candidate is found, stop the search immediately after reproduction and report.

Do not continue below a found candidate until the boundary is confirmed. After a positive result at version `N`, test `N+1` from the pristine base if it was not already tested successfully; this establishes the narrow transition where the defect disappeared or appeared.

## Required artifacts

Save per-candidate artifacts without overwriting prior runs:

- `js-tests/tests/test-alpha-drift-runtime-<version>.js`
- `js-tests/temp/alpha-drift-runtime-<version>.log`
- `js-tests/alpha-drift-runtime-<version>.md`
- candidate git SHA, release-boundary block, and original spec version
- applied patch and `git diff --check` result
- compiled WASM SHA-256
- pre/post upgrade smoke-test logs
- migration dry-run or no-migration proof
- exact block hashes and epoch markers for every accounting snapshot
- all 128 alpha-subnet discrepancy/component rows
- normalized comparison with adjacent-block, two-tempo, and post-446 controls

The final report must contain a compact version matrix:

| Candidate source version | Git commit | Burn fix applied | PR #1321 fix applied/already present | Epochs observed | Max raw movement | Max 720-block-normalized movement | Noise ratio | Verdict |
|---:|---|---|---|---:|---:|---:|---:|---|

## Final verification and cleanup

1. Execute each final saved JS test file end-to-end after its last edit; inline probes do not count.
2. Read and summarize the corresponding saved log.
3. For a positive result, reproduce from a newly restored pristine clone before declaring the root cause.
4. Stop the local node with `./scripts/stop-local-clone.sh` and verify no background node/test process remains.
5. Preserve the pristine snapshot until the search boundary and report have been reviewed.
6. Commit and push the plan/tests/reports only after final saved-file verification, without including unrelated workspace changes.
