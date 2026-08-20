# Plan: locate the historical runtime that created the alpha-accounting discrepancy

## Objective

Find the historical runtime transition that explains the **current** 1–2% alpha-accounting discrepancy, including its sign, magnitude, and per-subnet distribution. A historical candidate is not sufficient merely because the current-runtime formula reports accelerated drift: each candidate must first be evaluated with the accounting liabilities that existed in that runtime.

Runtime 446's accounting repair remains excluded as a cause: every candidate receives the ongoing burned-alpha accounting fix, while the already-corrected runtime-447 snapshot supplies the data and no accounting migration is rerun.

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

For historical runtimes, extend `pending` with every issued-but-not-yet-staked liability represented by that runtime. In runtime 440 this includes the exact outstanding legacy root entitlement:

```text
legacy_root_owed = sum_hotkey,coldkey(
    max(0,
        RootClaimable[hotkey][netuid] * root_stake(hotkey, coldkey)
        - RootClaimed[netuid][hotkey][coldkey]
    )
)

historical_calculated = calculated - legacy_root_owed
historical_discrepancy = actual - historical_calculated
```

The fixed-current-runtime formula remains useful for detecting a semantic boundary, but its signal must not be classified as an accounting defect until version-specific liabilities have been included.

Root (netuid 0) is included in network and epoch checks but excluded from this alpha-subnet formula.

## Known controls

- Corrected adjacent-block drift on runtime 447: `-2` to `-3` rao per block on 127 alpha subnets; subnet 86 was unchanged.
- Corrected two-tempo noise maximum: `0.000021877 alpha` over 720 blocks.
- Corrected long-run maximum after runtime 446: `0.000868309 alpha` over 29,628 blocks, equivalent to `0.000021101 alpha` per 720 blocks (`0.964x` the two-tempo maximum).
- Runtime 446 first appeared in post-state at block 8,843,319. The three accounting migrations were complete by block 8,843,324.
- The [PR #1321 root-dividend fix](https://github.com/RaoFoundation/subtensor/pull/1321) changes alpha dividends from the full validator dividend to `dividend - root_divs`. The PR was closed without merge, but the same source patch is present in git commit `956263fbb8994386bf209d307b062955ce42d83a` (`sub out root divs to get alpha divs`). Mainnet block 4,962,968 is the supplied live-fix boundary and must be verified against chain runtime history before using it to map candidates.
- The first pass found a large fixed-formula signal in runtime 440 and no signal in runtime 441. Runtime 440 keeps issued root dividends in `RootClaimable`/`RootClaimed` until claim, whereas runtime 441 Root Reborn replaces that path with deferred/pending beta-basket accounting.
- Reconstructing runtime 440's legacy owed ledger explained more than 99.98% of the apparent movement. Therefore runtime 440 is currently a **version-specific accounting false positive**, not a proven explanation of today's discrepancy.
- Runtime 441 first appeared in mainnet post-state at block 8,765,683; the exact pre/post hashes and migration-completion interval must be reverified during the audit rather than assumed from the existing map.
- The final saved Root Reborn audit reverified that boundary and followed the migration through completion at block 8,766,239. It found a real `-43,392.612317710 alpha` conversion error: the migration seeded `101,142.200968384 alpha` from `144,534.813286094 alpha` of exact per-position entitlement because aggregate clipping allowed overclaimed positions to cancel underclaimed positions.
- That migration error does **not** explain the present residual: its aggregate sign is negative while the recent aggregate residual is `+389,557.175298267 alpha`; 125 of 128 subnet signs are opposite and only two non-zero signs match. The migration audit branch is therefore complete and the descending runtime search must continue.
- Runtime 439 was tested from the corrected runtime-447 base with the version-correct exact legacy-root liability. Its worst unexplained movement was only `0.011454872 alpha` over 1,800 blocks (linearly `0.190914533 alpha`, or `0.008018%` of the relevant starting residual, over 30,000 blocks) and moved opposite to today's mostly positive residual. It is elevated above rao-scale noise but approximately 180 times smaller than the expected `1.5%` signal, so it is not the stopping candidate.
- Runtime 438 is accounting-equivalent to runtime 439 in the relevant emission path. Runtime 437 changes epoch scheduling and mechanism-vector handling but preserves accounting conservation; source-level bounding may skip these versions only when the equivalence and conservation argument is recorded in the final matrix.
- Runtime 432 was tested with exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.011316420 alpha` over 1,800 blocks, projecting to `0.188607 alpha` or `0.007739%` of the relevant present-scale residual over 30,000 blocks. None of the 122 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals and failed the sign, scale, and distribution criteria. Runtime 432 is therefore not the stopping candidate.
- Mainnet moved directly from runtime 424 to runtime 432; runtime versions 425–431 were not deployed and are excluded from the behavioral descent.
- Runtime 424 was tested over 1,800 blocks with exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.011204266 alpha`, projecting to `0.186737766 alpha` or `0.007568%` of the relevant current-scale residual over 30,000 blocks. None of the 123 positive-residual subnets moved in the matching direction. Runtime 424 is not the stopping candidate.
- Runtime 423 was tested over 1,800 blocks with exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.011906333 alpha`, projecting to `0.198438883 alpha` or `0.008043%` of the relevant current-scale residual over 30,000 blocks. None of the 123 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 70, 84, 90, and 103. Runtime 423 is therefore not the stopping candidate.
- Runtime 422 was tested over its native 1,801-block maximum epoch period using the legacy `LastMechansimStepBlock` marker and exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.011118491 alpha`, projecting to `0.185205291 alpha` or `0.007756%` of the relevant current-scale residual over 30,000 blocks. None of the 121 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 58, 70, 84, 90, 99, and 103. Runtime 422 is therefore not the stopping candidate.
- Runtime 421 was tested over a warmed 1,801-block native legacy epoch interval using `LastMechansimStepBlock` and exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.011420136 alpha`, projecting to `0.190229916 alpha` or `0.008001%` of the relevant current-scale residual over 30,000 blocks. None of the 121 positive-residual subnets moved in the matching direction. Runtime 421 is therefore not the stopping candidate.
- Runtime 420 was not deployed.
- Runtime 419 was tested over a warmed 1,801-block native legacy epoch interval using `LastMechansimStepBlock` and exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.011126109 alpha`, projecting to `0.185332187 alpha` or `0.007795%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 419 is therefore not the stopping candidate. Runtime 417 is the next lower deployed behavioral candidate.
- Runtime 418 was not deployed.
- Runtime 417 was tested over a warmed 1,801-block native legacy epoch interval using `LastMechansimStepBlock` and exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.012016857 alpha`, projecting to `0.200169744 alpha` or `0.008425%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 417 is therefore not the stopping candidate. Runtime 416 is the next lower deployed behavioral candidate.
- Runtime 416 was tested over a warmed 1,801-block native legacy epoch interval using `LastMechansimStepBlock` and exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.011745117 alpha`, projecting to `0.195643259 alpha` or `0.008230%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 416 is therefore not the stopping candidate. Runtime 415 is the next lower deployed behavioral candidate.
- Runtime 415 was tested over a warmed 1,801-block native legacy epoch interval using `LastMechansimStepBlock` and exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.011576726 alpha`, projecting to `0.192838300 alpha` or `0.008111%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 415 is therefore not the stopping candidate. Runtime 414 was not deployed; runtime 413 is the next lower deployed behavioral candidate.
- Runtime 413 was tested over a warmed 1,801-block native legacy epoch interval using `LastMechansimStepBlock` and exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.012040355 alpha`, projecting to `0.200561160 alpha` or `0.008443%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 413 is therefore not the stopping candidate. Runtime 412 was not deployed; runtime 411 is the next lower deployed behavioral candidate.
- Runtime 411 was tested over a warmed 1,801-block native legacy epoch interval using `LastMechansimStepBlock` and exact per-position legacy-root liabilities. Because this runtime predates `SubnetProtocolAlpha`, the still-present runtime-447 values were read as a frozen raw-storage baseline; their zero delta cannot create or hide drift. Its worst unexplained movement was `+0.011627066 alpha`, projecting to `0.193676835 alpha` or `0.008607%` of the relevant current-scale residual over 30,000 blocks. None of the 118 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 16, 40, 58, 70, 84, 90, 99, 103, and 116. Runtime 411 is therefore not the stopping candidate. Mainnet moved directly from runtime 402 to runtime 411, so runtime 402 is next.
- Runtime 402 was tested over a warmed 1,801-block native legacy epoch interval using `LastMechansimStepBlock` and exact per-position legacy-root liabilities. It predates both `SubnetProtocolAlpha` and AlphaAssets, so the former was retained as a frozen raw-storage baseline and the generation-scoped burned-alpha accounting control was backported without changing runtime 402's emission behavior. Its worst unexplained movement was `+0.011576249 alpha`, projecting to `0.192830355 alpha` or `0.008113%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 402 is therefore not the stopping candidate. Runtime 401 is next.
- Runtime 401 was tested over a warmed 1,801-block native legacy epoch interval with the same generation-scoped burned-alpha control and exact per-position legacy-root liabilities. Its worst unexplained movement was `+0.012018257 alpha`, projecting to `0.200193064 alpha` or `0.008417%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 401 is therefore not the stopping candidate. Mainnet moved directly from runtime 393 to runtime 401, so runtime 393 is next.
- Runtime 393 was tested over a warmed 1,801-block native legacy epoch interval after adding a narrow storage-compatibility adapter for the runtime-447 snapshot's `AlphaV2` and `TotalHotkeySharesV2` entries. The adapter converted those entries to runtime 393's `U64F64` representation lazily and preserved the historical share-pool arithmetic; it did not import runtime 401's `SafeFloat` emission logic. Exact per-position legacy-root liabilities explain the material raw movement. The worst unexplained movement was `+0.011553813 alpha`, projecting to `0.192456629 alpha` or `0.008088%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 393 is therefore not the stopping candidate. Runtime 392 is next.
- Runtime 392 differs from runtime 393 only by the latter's bad-hotkey-swap migration, its tests, and the spec bump. With all historical migrations disabled, the candidate accounting and automatic state-transition code is identical to the completed runtime-393 test. Runtime 392 is therefore source-bounded as noncausal. Runtime 391 differs from runtime 392 only in hotkey-swap dispatch logic, errors, CI, and the spec bump; because the controlled drift run submits no hotkey-swap extrinsics, runtime 391 is also accounting-equivalent for this experiment. Runtime 385 is the next deployed behavioral candidate.
- Runtime 385 was tested over a warmed 1,801-block native legacy epoch interval with the generation-scoped burned-alpha control, PR #1321-equivalent split, disabled migrations, and the same narrow V2-to-`U64F64` snapshot adapter. Exact per-position legacy-root liabilities explain the material raw movement. The worst unexplained movement was `+0.011206812 alpha`, projecting to `0.18667649 alpha` or `0.007865%` of the relevant current-scale residual over 30,000 blocks. None of the 121 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 58, 70, 84, 90, 99, and 103. Runtime 385 is therefore not the stopping candidate. Runtime 377 is next.
- Runtime 377 was tested over a warmed 1,801-block native legacy epoch interval with the same narrowly scoped controls and V2-to-`U64F64` snapshot adapter. Exact per-position legacy-root liabilities explain the material raw movement. The worst unexplained movement was `+0.011526850 alpha`, projecting to `0.192007495 alpha` or `0.008087%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 377 is therefore not the stopping candidate. Runtime 374 is next, subject to resolving which spec-374 code deployment immediately preceded runtime 377.
- Mainnet spec 374 first appeared at block 7,487,601 with code hash `0xea87b25a4d45b609617886b4e4629454f5cf900a4f6406adf368f362985805fe`. An exact `state_queryStorage` scan of `:code` through block 7,537,138 found zero same-spec code transitions, so the deployed source is the original `v3.3.7-374` tag (`a8d2ad019e18ecbc010a4b5e04524c05c15bab8a`); the later `v3.3.8-374` tag was not deployed in this interval.
- Runtime 374 was tested over a warmed 1,801-block native legacy epoch interval with the same narrowly scoped controls and V2-to-`U64F64` snapshot adapter. Exact per-position legacy-root liabilities explain the material raw movement. The worst unexplained movement was `+0.011567308 alpha`, projecting to `0.192681421 alpha` or `0.008098%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 374 is therefore not the stopping candidate. Runtime 373 is next.
- Runtime 373 was tested behaviorally because it uses an older SDK/frontier revision even though its pallet accounting source matches runtime 374. Over a warmed 1,801-block native legacy epoch interval, exact per-position legacy-root liabilities explain the material raw movement. The worst unexplained movement was `+0.012167284 alpha`, projecting to `0.202675469 alpha` or `0.008525%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 373 is therefore not the stopping candidate. Runtime 372 is next.
- Mainnet spec 372 first appeared at block 7,430,358 with code hash `0xb48092c7fac62e6823ff3e5be1b26dd4505d8028fe8607f10f1ad6dddc7ef50e`. An exact `state_queryStorage` scan of `:code` through block 7,435,432 found zero same-spec code transitions. The deployed source is `v3.3.6-372` (`fffba8c072984cd417689666dc8b0c9e80dc9f81`); the similarly named `v3.3.5-372` tag still advertises spec 371 and is not the deployed spec-372 source.
- Runtime 372 was tested over a warmed 1,801-block native legacy epoch interval with the same narrowly scoped controls and V2-to-`U64F64` snapshot adapter. Exact per-position legacy-root liabilities explain the material raw movement. The worst unexplained movement was `+0.011989107 alpha`, projecting to `0.199707501 alpha` or `0.008401%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 372 is therefore not the stopping candidate. Mainnet's previous deployed runtime was 367, so runtime 367 is next.
- Mainnet spec 367 first appeared at block 7,287,033 with code hash `0xb675942c3fa127e4430385e5a3b4deb4f39ab8b96e1650624bff22316d233cfc`. An exact `state_queryStorage` scan of `:code` through block 7,430,357 found zero same-spec code transitions, selecting `v3.3.4-367` (`8f13194c6e56f218910b4a9c708199cc38f64c40`) as the deployed source.
- Runtime 367 was tested over a warmed 1,801-block native legacy epoch interval with the same narrowly scoped controls and V2-to-`U64F64` snapshot adapter. Exact per-position legacy-root liabilities explain the material raw movement. The worst unexplained movement was `+0.011777885 alpha`, projecting to `0.196189089 alpha` or `0.008272%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 367 is therefore not the stopping candidate. Mainnet's previous deployed runtime was 366, so runtime 366 is next.
- Runtime 366 differs from runtime 367 only in subnet-registration user-liquidity toggling, matching dispatch weights/tests, and the spec bump. The controlled no-extrinsic drift interval cannot reach that registration branch, so runtime 366 is source-bounded as accounting-equivalent to runtime 367. Runtime 365 differs from 366 only in the default childkey cooldown and `RootClaimed` adjustments during an explicit root-stake move; neither childkey nor stake-move extrinsics are submitted. Runtime 365 is therefore source-bounded by the same completed result. Mainnet moved directly from runtime 365 to runtime 362, whose epoch and accounting changes require a behavioral test.
- Runtime 362 was tested over a warmed 1,801-block native legacy epoch interval with the same narrowly scoped controls and V2-to-`U64F64` snapshot adapter. Its activation changed no migration marker and moved any non-epoch discrepancy by at most 3 rao. Exact per-position legacy-root liabilities explain the material raw movement. The worst unexplained movement was `+0.012092395 alpha`, projecting to `0.201428012 alpha` or `0.008466%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 362 is therefore not the stopping candidate. Mainnet's previous deployed runtime was 361, so runtime 361 is next.
- Runtime 361 was behaviorally tested because its uncapped alpha-in injection changes automatic prices and subsequent emission volumes relative to runtime 362. Mainnet used a single code hash for its entire deployment. Over a warmed 1,801-block native legacy epoch interval, exact per-position legacy-root liabilities again explain the material raw movement. The worst unexplained movement was `+0.011296482 alpha`, projecting to `0.188170161 alpha` or `0.007921%` of the relevant current-scale residual over 30,000 blocks. None of the 121 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 58, 70, 84, 90, 99, and 103. Runtime 361 is therefore not the stopping candidate. Mainnet's previous deployed runtime was 352, so runtime 352 is next.
- Runtime 352 was behaviorally tested because it predates the large runtime-361 coinbase/claim-root refactor; its short 746-block mainnet deployment alone was not used to source-bound it. Mainnet used a single code hash throughout. Over a warmed 1,801-block native legacy epoch interval, exact per-position legacy-root liabilities again explain the material raw movement. The worst unexplained movement was `+0.011382772 alpha`, projecting to `0.189607529 alpha` or `0.007972%` of the relevant current-scale residual over 30,000 blocks. None of the 121 positive-residual subnets moved in the matching direction. Isolated `100x` crossings occurred only on negative/outlier residuals 58, 70, 84, 90, 99, and 103. Runtime 352 is therefore not the stopping candidate. Mainnet's previous deployed runtime was 351, so runtime 351 is next.
- Runtime 351 used one code hash throughout mainnet. It differs from runtime 352 only in TAO-flow bookkeeping inside explicit add/remove-stake swap extrinsics and the spec bump. Since the controlled drift run submits no extrinsics, runtime 351 is source-bounded as accounting-equivalent to the completed runtime-352 result. Runtime 350 is next.
- Runtime 350 used one code hash throughout mainnet. Its only difference from runtime 351 is TAO fee accounting when protocol liquidity is withdrawn; alpha principal/fees and all automatic epoch accounting are unchanged. It is therefore source-bounded by runtime 352 for this alpha-discrepancy experiment. Runtime 349 is next.
- Runtime 349 used one code hash throughout mainnet. Its differences from runtime 350 are confined to user-liquidity/admin dispatch behavior and tests; the controlled drift run submits no such extrinsics, and automatic alpha accounting is identical. Runtime 349 is source-bounded by runtime 352. Runtime 348 is next.
- Mainnet runtime 348 also used one code hash throughout its deployment. It contains a real alpha-accounting defect in the alpha-paid transaction-fee path: the fee handler reduces a staker's alpha position without increasing `AlphaBurned` or reducing `SubnetAlphaOut`. A saved failed-dispatch reproduction isolated `-0.011313480 alpha` of unaccounted stake movement with zero call-side stake-removal or swap execution. This defect has the opposite sign from the broad positive current residual and requires a fee-bearing extrinsic, so it can explain only negative/outlier discrepancy contributions, not the epoch-driven 1–2% population under search.
- Runtime 348 was then tested over a warmed 1,801-block native legacy epoch interval on an archive clone. Exact per-position legacy-root liabilities explain the material raw movement. The worst unexplained movement was `+0.011920591 alpha`, projecting to `0.198566202 alpha` or `0.008374%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction. The isolated `100x` crossings were confined to negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 348 is therefore not the stopping candidate. Mainnet's previous deployed runtime, 347, is next.
- Runtime 347 could not be source-bounded by 348 because the synced state lacks `SubnetEmaTaoFlow` entries for active subnets 58, 70, 86, 90, 99, and 103, making runtime 347's older initialization branch reachable. A full warmed 1,801-block run exercised it. Exact per-position legacy-root liabilities again explain the material raw movement. The worst unexplained movement was `+0.011447707 alpha`, projecting to `0.190689178 alpha` or `0.008044%` of the relevant current-scale residual over 30,000 blocks. None of the 120 positive-residual subnets moved in the matching direction; the `100x` crossings remained confined to negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 347 is not the stopping candidate.
- Runtime 345 used one code hash throughout mainnet and differs from runtime 347 only in TAO-flow bookkeeping inside explicit add/remove-stake swap extrinsics. The controlled drift interval submits no such extrinsics, so runtime 345 is source-bounded by the completed runtime-347 result. Runtime 343 changes automatic coinbase subnet selection and is the next behavioral candidate.
- Runtime 343 used one code hash throughout mainnet and was tested over the full warmed 1,801-block interval because it predates runtime 345's automatic preselection of emission-eligible subnets. Exact per-position legacy-root liabilities explain the raw movement. The worst unexplained movement was `+0.010983507 alpha`, projecting to `0.182956807 alpha` or `0.007701%` of the relevant current-scale residual over 30,000 blocks. None of the 121 positive-residual subnets moved in the matching direction. Runtime 343 is not the stopping candidate. Runtime 338 is next and crosses the old single-`PendingEmission` to split server/validator-pending liability boundary, so its formula must include the historical liability explicitly.
- Runtime 338 was tested over a fresh, warmed 1,801-block interval with live legacy `PendingEmission`, frozen synced split-pending balances, and exact per-position legacy-root liabilities. None of the 118 positive current-residual subnets moved in the matching direction after liability correction, so runtime 338 does not explain the broad positive 1–2% discrepancy. It does contain a separate negative-sign defect in its subsidized issuance branch: `root_alpha` is omitted from both pending destinations, and bought alpha is subtracted directly from `SubnetAlphaOut` without recycling/burn accounting. A final saved adjacent-block test reproduced negative drift on 13 dynamically subsidized subnets, including stable `-0.28` to `-0.35 alpha` one-block movements on 58, 70, 90, 99, and 103. Runtime 343 replaces both paths with explicit pending/recycling accounting. The full exact-liability run left `100x` matching crossings only on negative/outlier subnets 16, 40, 58, 70, 84, 90, 99, 103, and 116. Preserve this as a source of negative outlier discrepancies, but continue the main search at runtime 334.
- Runtime 334 was tested over a warmed 1,801-block interval with the same version-correct legacy pending terms and exact per-position root liabilities. None of the 120 positive current-residual subnets moved in the matching direction after liability correction. The isolated `100x` crossings were again confined to negative/outlier residuals 40, 58, 70, 84, 90, 99, and 103. Runtime 334 therefore fails the required sign and distribution tests and is not the stopping candidate. Continue at the previous deployed runtime, 326.
- The original runtime-326 interpretation was incomplete. `PendingAlphaSwapped` normally records alpha already sold, but on the subsidized branch the root sell is skipped and the same field contains **unsold** alpha queued for staking. Excluding the entire field hid the positive bought-alpha drift. Runtime 326 shares this mixed-field behavior with runtime 298 and is inside the causal source window.
- Runtime 323 used one code hash throughout its mainnet deployment. Relative to runtime 326, the only automatic coinbase change selects the per-subnet rather than global auto-stake destination; it passes the same incentive amount to the same stake-increase routine, so the sum of `TotalHotkeyAlpha` is unchanged. Its epoch diff only removes comments, and its added hook calls are disabled historical migrations. Runtime 323 is therefore source-bounded as alpha-accounting-equivalent to the completed no-extrinsic, no-migration runtime-326 result. Runtime 320 is next.
- Runtime 320 used one code hash throughout mainnet. Relative to runtime 323, its only epoch change omits writing the informational `StakeWeight` vector; coinbase and all stake, pending, pool, burn, and protocol accounting are unchanged. The remaining changes are explicit user-call validation/dispatch behavior. Runtime 320 is therefore source-bounded by runtime 326 for this no-extrinsic drift experiment. Runtime 315 is the next deployed behavioral candidate.
- Runtime 315 used one code hash throughout mainnet and was tested over a warmed 1,801-block interval. It produced material deterministic **negative** discrepancy steps: 127 subnet discrepancies decreased, none increased, none of the 122 positive current-residual subnets moved in the matching direction, and all 61 `100x` crossings had the opposite sign. Source comparison with runtime 320 isolates the cause: runtime 315 skipped incentives assigned to immune subnet-owner-associated hotkeys without staking, burning, recycling, or recording a liability, while `SubnetAlphaOut` had already been issued. Runtime 320 added the missing burn/recycle operation (and removed the owner-hotkey cap). This is a real historical negative-drift defect but cannot explain the broad positive current residual. Continue at runtime 306.
- Runtime 306 used one code hash throughout mainnet. It contains the identical skipped owner-associated incentive defect as runtime 315. The automatic 306→315 differences either preserve amounts (moving invariant root quantities out of a loop, adding an event and auto-stake destination) or add a childkey burn whose recycled amount is subtracted from both the distributed stake and `SubnetAlphaOut`; explicit extrinsic and disabled migration changes are unreachable here. Runtime 306 is therefore source-bounded by runtime 315 and cannot reverse the observed drift to match today's positive residual. Runtime 302 is next.
- Runtime 302 used one code hash throughout mainnet. It already skips subnet-owner-hotkey incentives without staking or reducing `SubnetAlphaOut`; runtime 306 merely expands that same negative defect to a bounded set of owner-associated immune hotkeys. Its other automatic 302→306 difference changes commit-reveal bookkeeping, not emission amounts; migrations and transaction extensions are disabled or unreachable. Runtime 302 is therefore source-bounded as having only a subset of runtime 315's negative drift. Runtime 301 is next.
- Runtime 301 used one code hash throughout mainnet and has the same coinbase/epoch accounting as runtime 302, including the negative subnet-owner-hotkey skip. Its 301→302 changes are explicit stake/weights calls, runtime APIs, and build/consensus plumbing, none reached by a no-extrinsic epoch run. Runtime 301 is source-bounded by runtime 302. Runtime 298 is next.
- Runtime 298 is the stopping root-cause candidate. Relative to runtime 297, it introduces the subsidized buy path. On a subsidized subnet it subtracts bought alpha directly from `SubnetAlphaOut`, skips the root-alpha sell, but still queues the full emitted alpha as `PendingEmission + PendingAlphaSwapped` and later stakes that full amount. A focused adjacent-block test proved that the version-correct discrepancy increases by exactly `bought_alpha` on all 127 materially subsidized subnets, with only 1–2 rao residual. All 122 positive current-residual subnets moved in the matching direction. The aggregate reproduced rate was `12.963919978 alpha` per block; a 30,000-block projection is `388,917.599340 alpha`, or `99.835819%` of the certified current signed residual `389,557.175298267 alpha`. The weakest subnet still measured `1,872,323x` the corrected 720-block control maximum. The result reproduced from a second pristine clone; its upgrade boundary was runtime 447 block 699 to local runtime 448 block 700, no migration marker changed, and the largest non-epoch activation discontinuity was 3 rao. The causal path begins at mainnet runtime 298 block 6,106,491, is absent from runtime 297, and remains through runtime 326. Runtime 334 changes the branch to a separately observed negative defect; commit `6a76ecc0d` (PR #2187), deployed in runtime 343, performs the complete recycling fix. Stop the descending search here.

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

1. Before measuring drift, inventory the candidate's complete set of issued-but-not-staked liabilities and define the version-correct accounting formula. Do not assume the runtime-447 pending fields are exhaustive.
2. Accelerate local block production without changing tempo, emission, stake, burn, or accounting storage. Record the acceleration method and prove state-transition order is unchanged.
3. Detect successful epochs from the strongest marker available in that candidate:
   - prefer `SubnetEpochIndex` increments;
   - otherwise use `LastEpochBlock`/the historical epoch marker and verify the corresponding emission distribution state change.
4. Continue until every active alpha subnet has executed at least one epoch after the candidate baseline. Current state includes non-uniform tempos, so do not assume that 360 blocks covers every subnet.
5. Capture exact pre-epoch and post-epoch accounting snapshots where practical, plus one aggregate snapshot after all subnets have crossed an epoch.
6. For every subnet calculate both the fixed-current-runtime discrepancy and the version-correct discrepancy, including:
   - signed and absolute discrepancy before and after;
   - discrepancy movement in rao and alpha;
   - movement per executed epoch;
   - movement normalized to 720 blocks;
   - ratio to that subnet's runtime-447 control movement;
   - ratio to the global `0.000021877 alpha` two-tempo maximum;
   - component deltas for actual stake, calculated stake, `SubnetAlphaOut`, `AlphaBurned`, pending alpha, and protocol alpha.
   - deltas of every version-specific liability, including exact legacy root owed where present.
7. Separate the upgrade-block movement, ordinary non-epoch per-block drift, extrinsic-driven movement, and the epoch step. A candidate is not implicated merely because its raw discrepancy is larger after many blocks.

For runtime 440, calculate legacy root owed per `(hotkey, coldkey, netuid)` using the historical runtime's fixed-point operations, saturation, floor/rounding, and negative-to-zero behavior. Do not approximate it as `rate × TotalHotkeyAlpha - sum(RootClaimed)`: per-position rounding and clipping can leave a millialpha residual that is still far above the rao-scale control threshold.

## Phase 6: audit the runtime-441 Root Reborn migration

This audit is mandatory before continuing below runtime 440 or attributing today's discrepancy to Root Reborn. It has now completed, with the non-causal result summarized under **Known controls**; the steps remain here as the reproducibility specification.

1. Reverify the exact last runtime-440 block and first runtime-441 block on mainnet, including hashes, runtime code hashes, and whether an epoch or relevant extrinsic executed in either block.
2. Read all 128 alpha subnets at the exact adjacent pre/post hashes. Capture:
   - the standard accounting components;
   - every `RootClaimable` rate and `RootClaimed` watermark;
   - every root-stake position needed to calculate exact pre-upgrade owed alpha;
   - Root Reborn migration markers/cursors and storage versions;
   - beta-basket holdings, shares, rates, NAV/accounting totals, escrow stake, `DeferredRootAlphaDividends`, and `PendingBasketDeposits` after activation.
3. Calculate exact legacy owed alpha immediately before activation for every `(hotkey, coldkey, netuid)`, then aggregate it by subnet, validator hotkey, and beneficiary coldkey.
4. Determine every destination used by the Root Reborn seed migration. For each subnet, reconcile:

```text
legacy liability removed
    = basket assets/stake created
    + deferred root dividends created
    + pending basket deposits created
    + claims materialized during the boundary
    + alpha explicitly recycled or burned
    + legacy liability retained after the boundary
    + conversion_error
```

5. If the migration spans multiple blocks, keep the adjacent activation comparison but also follow every migration cursor to the first block where seeding is complete. Separate migration writes from normal block issuance, epochs, basket flushes, claims, and extrinsics at every step.
6. Use exact runtime arithmetic and storage semantics. Reconcile both alpha units and economic ownership: a validator-basket asset and a staker's basket entitlement must not be counted twice.
7. Compare signed `conversion_error` with the current discrepancy at a recent reference block:
   - same sign per subnet;
   - similar per-subnet distribution;
   - magnitude sufficient to explain the current 1–2%;
   - aggregate error conserved against issuance, burn, protocol, pending, and stake totals.
8. Reproduce the migration audit locally from a snapshot immediately before runtime 441 when possible. Upgrade with the original runtime-441 migration enabled, then run the final saved audit test end-to-end.

Classify the Root Reborn audit as follows:

- **Explains current discrepancy:** a concrete migration conversion error has the same sign and approximately the same per-subnet magnitude/distribution as today's residual. Stop the historical descent, reproduce it, and report the exact migration operation that lost, duplicated, or misclassified alpha.
- **Conserves correctly:** legacy owed is fully represented in the new basket/deferred/pending/recycled destinations within exact arithmetic and rounding bounds. Mark runtime 440's original signal as a formula false positive and continue below runtime 440.
- **Inconclusive:** missing historical state or mixed epoch/extrinsic activity prevents conservation proof. Expand the block window, replay locally, or add storage-level reconstruction; do not declare Root Reborn causal and do not silently skip the boundary.

## Decision rule

Classify an iteration as follows:

- **Formula/semantic false positive:** the fixed-current-runtime formula crosses the threshold, but a liability or ownership category native to that historical runtime explains the movement. Correct the formula, retain the result as a semantic boundary, and apply the decision rule again to the version-correct discrepancy. Runtime 440 currently has this classification.
- **No acceleration:** the version-correct 720-block-normalized movement remains within the runtime-447 control envelope and no repeatable epoch step appears. Restore the pristine clone and test the next lower deployed runtime.
- **Borderline/elevated:** version-correct normalized movement exceeds the per-subnet control but is less than `100x` the corrected control, or the movement cannot be isolated from another transition. Run at least one additional epoch and repeat from a fresh clone before deciding. Do not discard these results; a state-dependent or partial defect may be smaller than the linear estimate.
- **Root-cause candidate found:** an epoch produces a deterministic step in the **version-correct** accounting discrepancy that is at least `100x` the corrected control after normalization, has matching conservation/component evidence, plausibly matches the current discrepancy's sign and distribution, and reproduces from the pristine snapshot. Stop descending, preserve all artifacts, and report the candidate version and exact source diff. A result at or above `1,000x` is exceptionally strong evidence, but `1,000x` is not required to stop.

The `100x` threshold is a search/stopping threshold, not an accounting tolerance. It remains far below the approximately `37,500x` signal predicted by the simple 2,000,000-to-30,000-block scaling argument. All non-zero rao differences remain in the tables. If a clearly structural error moves substantial alpha but does not fit the numerical threshold, stop and report it with the evidence rather than continuing blindly.

## Descending search loop

The descent is complete. Runtime 298 is the first deployed version with the matching positive defect; runtime 297 is the lower source control and lacks the subsidized path. The initial runtime-326 classification has been corrected because its formula treated all `PendingAlphaSwapped` as already sold and missed the branch-dependent unsold liability. Runtime 298 passed the sign, scale, distribution, component-conservation, boundary, and pristine-reproduction gates by a wide margin, so no lower candidate should be tested. Runtime 338's subsidized-path defect and runtime 315's skipped owner-associated incentive defect remain separately proven negative-drift causes; Root Reborn remains a real but sign-incompatible migration shortfall. The following loop is retained as the completed procedure rather than an instruction to continue:

1. Restore the identical runtime-447 base state.
2. Prepare the historical candidate as local spec 448.
3. Apply only the burned-alpha behavioral control and PR #1321 control if missing.
4. Prove no migrations will run.
5. Build, upgrade, smoke-test, and capture the post-upgrade baseline.
6. Run through at least one verified epoch per active alpha subnet.
7. Calculate and normalize both fixed-formula and version-correct drift.
8. Apply the decision rule.
9. If there is no acceleration, stop/clean the node, archive the iteration report, and continue to the next lower deployed runtime.
10. If a fixed-formula signal is explained by a historical liability, record it as a false positive and continue after any mandatory transition audit.
11. If a version-correct root-cause candidate is found, stop the search immediately after reproduction and report.

Do not continue below a found candidate until the boundary is confirmed and semantic false positives are excluded. After a positive result at version `N`, test `N+1` from the pristine base if it was not already tested successfully; this establishes the narrow transition where the defect disappeared or appeared.

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
- the version-specific liability inventory and both fixed-formula and corrected rows
- normalized comparison with adjacent-block, two-tempo, and post-446 controls

Save the Root Reborn audit separately without overwriting candidate reports:

- `js-tests/tests/test-root-reborn-migration-conservation.js`
- `js-tests/temp/root-reborn-migration-conservation.log`
- `js-tests/root-reborn-migration-conservation.md`
- exact adjacent runtime-440/runtime-441 block hashes and code hashes
- exact migration-completion block and every migration cursor/marker transition
- per-position legacy owed input and per-subnet destination/conversion-error tables
- comparison of signed conversion error with the current 1–2% discrepancy

The final report must contain a compact version matrix:

| Candidate source version | Git commit | Burn fix applied | PR #1321 fix applied/already present | Epochs observed | Max raw movement | Max 720-block-normalized movement | Noise ratio | Verdict |
|---:|---|---|---|---:|---:|---:|---:|---|

## Final verification and cleanup

1. Execute each final saved JS test file end-to-end after its last edit; inline probes do not count.
2. Read and summarize the corresponding saved log.
3. For a positive result, reproduce from a newly restored pristine clone before declaring the root cause. For Root Reborn specifically, require both the adjacent-block migration-conservation proof and the signed comparison with the current discrepancy.
4. Stop the local node with `./scripts/stop-local-clone.sh` and verify no background node/test process remains.
5. Preserve the pristine snapshot until the search boundary and report have been reviewed.
6. Commit and push the plan/tests/reports only after final saved-file verification, without including unrelated workspace changes.
