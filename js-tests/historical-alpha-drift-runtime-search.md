# Historical runtime search for the residual alpha-accounting discrepancy

Generated: 2026-08-20

## Current verdict

The stopping root-cause candidate is **runtime 298** (`v3.2.3`,
`6309d35929e484ebff70c7da68547fb9c60f0d11`). It introduced a subsidized-buy path that
subtracts bought alpha from `SubnetAlphaOut` while still queueing the full emitted alpha
for stake. The resulting version-correct discrepancy increases by exactly `bought_alpha`.
The path is absent from runtime 297 and remains present through runtime 326.

The final adjacent-block reproduction found 127 materially subsidized subnets and a
maximum mechanism residual of only 2 rao. All 122 positive current-residual subnets moved
in the matching direction. Aggregate drift was `12.963919978 α` per block; projected over
30,000 blocks it is `388,917.599340 α`, or `99.835819%` of the certified current signed
residual `389,557.175298267 α`. Even the weakest subnet was `1,872,323×` the corrected
720-block control maximum. The result reproduced from a second pristine clone with no
migration-marker change and only a 3-rao maximum activation discontinuity. The search is
therefore stopped at the runtime-297→298 source boundary.

Two initially large signals are now proven false leads for this question:

1. Pre–Root Reborn runtimes accumulate earned but unstaked root dividends in
   `RootClaimable`/`RootClaimed`. The fixed current-runtime formula omits that historical
   liability and therefore reports tens or hundreds of alpha of apparent epoch drift.
   Exact per-position reconstruction removes more than 99.98% of that movement.
2. The runtime-441 Root Reborn seed migration did introduce a real
   `-43,392.612317710 α` conversion error, but its sign and subnet distribution are
   incompatible with the current `+389,557.175298267 α` aggregate residual.

Runtime 446 remains excluded as a cause. Every candidate runs over a freshly corrected
runtime-447 snapshot, receives only the ongoing generation-scoped burned-alpha fix, and
has all historical migrations disabled.

## Decision scale

The corrected current runtime moves at most `0.000021877 α` over 720 blocks in the
two-tempo control. If the historical defect created roughly 100% of today's residual over
about 2,000,000 blocks, a 30,000-block projection should be around 1.5% of the same
starting residual—approximately 37,500× the observed `0.00004%` control movement.

`100×` remains a conservative search threshold, not sufficient causal proof. A stopping
candidate must also match the current residual's sign and broad per-subnet distribution,
show a conserved component-level mechanism, and reproduce from the pristine snapshot.

## Root Reborn adjacent-block migration audit

- Last runtime-440 post-state: block 8,765,682
- Runtime-441 code installed in post-state: block 8,765,683
- First block executed by runtime 441: block 8,765,684
- Seed migration complete: block 8,766,239
- Exact legacy entitlement removed: `144,534.813286094 α`
- Basket backing created: `101,142.200968384 α`
- Conversion error: `-43,392.612317710 α`

The migration clipped after aggregation:

```text
max(rate * total_root_stake - sum(position_claimed), 0)
```

The exact liability requires clipping each position independently:

```text
sum(max(rate * position_stake - position_claimed, 0))
```

Overclaimed positions therefore cancelled underclaimed positions. This is a real migration
bug, but it does not explain today's discrepancy: 125 of 128 subnet signs are opposite and
only two non-zero subnet signs match.

## Candidate results

All dynamically tested candidates advertised local spec 448, passed pre/post smoke tests,
changed no migration marker at activation, and covered at least one epoch on every alpha
subnet. Version-correct rows include exact per-position legacy root owed where applicable.

| Source runtime | Source commit | Classification | Worst exact residual over 1,800 blocks | 30k projection | Projection / relevant residual | Current positive direction? |
|---:|---|---|---:|---:|---:|---|
| 445 | `d3f40e44bda9019c606aeb0c907bb52ba7fe386c` | no acceleration | rao-scale | rao-scale | negligible | no broad signal |
| 444 | not deployed | skipped | n/a | n/a | n/a | n/a |
| 443 | `c02a376ecee28718970962562fece409b695df72` | no acceleration | rao-scale | rao-scale | negligible | no broad signal |
| 442 | `ec112cb0e68469fa1c5e5ae67dece043033f6673` | source-bounded | n/a | n/a | negligible inferred | no |
| 441 | `8b9d55c723e00d0d713eed799de627e94603dfd4` | no acceleration | rao-scale | rao-scale | negligible | no broad signal |
| 440 | `e4ffa2e1325c6c7db618dbceaf396310a170990c` | historical-liability false positive | millialpha scale | far below expected | far below 1.5% | no |
| 439 | `cda8fd76ad2a7014cac632933237abf1ddaa9b30` | no causal acceleration | `+0.011454872 α` | `0.190914533 α` | `0.008018%` | opposite |
| 438 | `c1463f2cc62e7de70aa3379ee53cfc5f060bde42` | accounting-equivalent to 439 | n/a | n/a | same bound | no |
| 437 | `2d52647c415aa987ab93dbd7de4ddc5eaf7aa083` | conservation source-bound | n/a | n/a | bounded | no |
| 432 | `8586e65ec279644a6837cf25b12333064c77474e` | no causal acceleration | `+0.011316420 α` | `0.188607 α` | `0.007739%` | 0/122 positive subnets |
| 431–425 | not deployed | skipped | n/a | n/a | n/a | n/a |
| 424 | `bb51677451dc74f2152d44a9a0c30b18b5e634fc` | no causal acceleration | `+0.011204266 α` | `0.186737766 α` | `0.007568%` | 0/123 positive subnets |
| 423 | `06032d518fbaead1ddc2039e9e6aa55715026364` | no causal acceleration | `+0.011906333 α` | `0.198438883 α` | `0.008043%` | 0/123 positive subnets |
| 422 | `e367ae64709a22cfeb7ec114814a14f0db137a83` | no causal acceleration | `+0.011118491 α` | `0.185205291 α` | `0.007756%` | 0/121 positive subnets |
| 421 | `6016381e4fb230d17643cca948afe296eb06faac` | no causal acceleration | `+0.011420136 α` | `0.190229916 α` | `0.008001%` | 0/121 positive subnets |
| 420 | not deployed | skipped | n/a | n/a | n/a | n/a |
| 419 | `fa83646297f45a1a8108f70ba2ebf32d4f35b5c2` | no causal acceleration | `+0.011126109 α` | `0.185332187 α` | `0.007795%` | 0/120 positive subnets |
| 418 | not deployed | skipped | n/a | n/a | n/a | n/a |
| 417 | `49164bd68afd71e48e3c80d268ed80f22b98a2b1` | no causal acceleration | `+0.012016857 α` | `0.200169744 α` | `0.008425%` | 0/120 positive subnets |
| 416 | `34a284751cc3151ae8017451919101f59e39744d` | no causal acceleration | `+0.011745117 α` | `0.195643259 α` | `0.008230%` | 0/120 positive subnets |
| 415 | `1104f2aab5acdf69fe967a787c7ae1cc5fdf170c` | no causal acceleration | `+0.011576726 α` | `0.192838300 α` | `0.008111%` | 0/120 positive subnets |
| 414 | not deployed | skipped | n/a | n/a | n/a | n/a |
| 413 | `ec2212c53fc7c0252af80c28e50a959cce2f9890` | no causal acceleration | `+0.012040355 α` | `0.200561160 α` | `0.008443%` | 0/120 positive subnets |
| 412 | not deployed | skipped | n/a | n/a | n/a | n/a |
| 411 | `486037ba45b87a453b1d660177cc1b105d0298c6` | no causal acceleration | `+0.011627066 α` | `0.193676835 α` | `0.008607%` | 0/118 positive subnets |
| 402 | `6844ee37f0b8cb02baf9ff8d3ca4319cfb33f361` | no causal acceleration | `+0.011576249 α` | `0.192830355 α` | `0.008113%` | 0/120 positive subnets |
| 401 | `40a451f366900d00ec0b3781e4c5a4a92ba9a6b6` | no causal acceleration | `+0.012018257 α` | `0.200193064 α` | `0.008417%` | 0/120 positive subnets |
| 393 | `4a2e4b1282dbcf4e020b3f97f9a0c7442b756792` | no causal acceleration | `+0.011553813 α` | `0.192456629 α` | `0.008088%` | 0/120 positive subnets |
| 392 | `036cfe087be3c50c988185af465a20cea2b132c9` | accounting-equivalent to 393 with migrations disabled | n/a | n/a | same bound | no |
| 391 | `7a727dd4d219a953391e91ed2f7aa942050938f1` | accounting-equivalent in no-extrinsic run | n/a | n/a | same bound | no |
| 385 | `7eb6f9bb7c9ea19d60d11890d04ca352f9257fa8` | no causal acceleration | `+0.011206812 α` | `0.18667649 α` | `0.007865%` | 0/121 positive subnets |
| 377 | `b2e2cdebaf39c1badfc1af1cd0b5de5d0ddebb4c` | no causal acceleration | `+0.011526850 α` | `0.192007495 α` | `0.008087%` | 0/120 positive subnets |
| 374 | `a8d2ad019e18ecbc010a4b5e04524c05c15bab8a` | no causal acceleration | `+0.011567308 α` | `0.192681421 α` | `0.008098%` | 0/120 positive subnets |
| 373 | `206e7c890d2ac4268257cfd205bcf80100225241` | no causal acceleration | `+0.012167284 α` | `0.202675469 α` | `0.008525%` | 0/120 positive subnets |
| 372 | `fffba8c072984cd417689666dc8b0c9e80dc9f81` | no causal acceleration | `+0.011989107 α` | `0.199707501 α` | `0.008401%` | 0/120 positive subnets |
| 367 | `8f13194c6e56f218910b4a9c708199cc38f64c40` | no causal acceleration | `+0.011777885 α` | `0.196189089 α` | `0.008272%` | 0/120 positive subnets |
| 366 | `d65dbaedf833e1b55ba6f1487c333ffe49f062d2` | accounting-equivalent to 367 in no-registration run | n/a | n/a | same bound | no |
| 365 | `6e3d24cea446b3241524bb319b72bf506e8e8eb4` | accounting-equivalent in no-extrinsic run | n/a | n/a | same bound | no |
| 362 | `8834a7c737583c8ab8d6c3abdbd4865e039e24a9` | no causal acceleration | `+0.012092395 α` | `0.201428012 α` | `0.008466%` | 0/120 positive subnets |
| 361 | `52378dc3e911cdfc7b8e3cf1160a6e0e4dde4fd6` | no causal acceleration | `+0.011296482 α` | `0.188170161 α` | `0.007921%` | 0/121 positive subnets |
| 352 | `024a3049157b83329e041f3e60ae3da611a022bb` | no causal acceleration | `+0.011382772 α` | `0.189607529 α` | `0.007972%` | 0/121 positive subnets |
| 351 | `3face26e735211188ec776b4559f185d3b2c952f` | accounting-equivalent to 352 in no-extrinsic run | n/a | n/a | same bound | no |
| 350 | `4d3a7ab3422f587c3f3faa855dd03d73ccbcbfdf` | alpha-accounting-equivalent to 351 | n/a | n/a | same bound | no |
| 349 | `20cbabc70fb2528d166ab2a296a1d656a6e5a106` | accounting-equivalent in no-liquidity-extrinsic run | n/a | n/a | same bound | no |
| 348 | `459fa72d1468b6dc7485de7392996de50169fbf8` | no causal acceleration; real negative alpha-fee defect isolated | `+0.011920591 alpha` | `0.198566202 alpha` | `0.008374%` | 0/120 positive subnets |
| 347 | `6304dbedc34c6b271546a9338d9b870ceb1ac625` | no causal acceleration after reachable EMA initialization | `+0.011447707 alpha` | `0.190689178 alpha` | `0.008044%` | 0/120 positive subnets |
| 345 | `8f33f8cbf6b958b9ec215424a50d96cd2fc5e5ae` | accounting-equivalent to 347 in no-stake-extrinsic run | n/a | n/a | same bound | no |
| 343 | `b179867c306fb6a28345896f422910e603799d70` | no causal acceleration | `+0.010983507 alpha` | `0.182956807 alpha` | `0.007701%` | 0/121 positive subnets |
| 326 | `becf842519f4bcfa97509c5d6fc8030d9ea9c40d` | causal window; original formula false negative | n/a | n/a | matching mechanism | yes |
| 323 | `79010a36cdb8391bb5de5c86acd0387d71f462c9` | causal path source-bounded by 326 | n/a | n/a | matching mechanism | yes |
| 320 | `835a2c90294705b5963043f5ef31460304df2475` | causal path source-bounded by 326 | n/a | n/a | matching mechanism | yes |
| 315 | `81ee047fd124f8837555fd79e8a3957688c5b0c6` | causal positive path plus separate negative owner-skip defect | `-740.054137951 alpha` raw competing step | n/a | mixed defects | positive path present |
| 306 | `737e4acb173cddbe6fde9c6085853ef8b8f02a80` | causal positive path plus negative owner-skip defect | n/a | n/a | mixed defects | positive path present |
| 302 | `67c7ac6923b498c15f5541fd0e9ddcbeed38c3b7` | causal positive path plus negative owner-skip subset | n/a | n/a | mixed defects | positive path present |
| 301 | `312c0be95983a98bed4120526351a94219d00449` | causal positive path plus negative owner-skip subset | n/a | n/a | mixed defects | positive path present |
| 298 | `6309d35929e484ebff70c7da68547fb9c60f0d11` | **root-cause boundary: subsidized buy** | `+12.963919978 alpha/block` aggregate | `+388,917.599340 alpha` aggregate | `99.835819%` | 122/122 positive subnets |

The isolated `100×` crossings after liability correction occur on pre-existing
negative/outlier residuals (principally netuids 70, 84, 90, and 103). They fail the sign,
scale, and distribution tests and are not stopping candidates.

## Deployed descent below runtime 424

Mainnet boundaries currently mapped are:

| Runtime | First post-state block | Previous runtime |
|---:|---:|---:|
| 424 | 8,513,820 | 423 |
| 423 | 8,486,593 | 422 |
| 422 | 8,472,455 | 421 |
| 421 | 8,466,530 | 419 |
| 420 | not deployed | n/a |
| 419 | 8,427,138 | 417 |
| 418 | not deployed | n/a |
| 417 | 8,379,018 | 416 |
| 416 | 8,364,552 | 415 |
| 415 | 8,334,450 | 413 |
| 414 | not deployed | n/a |
| 413 | 8,313,748 | 411 |
| 412 | not deployed | n/a |
| 411 | 8,283,784 | 402 |
| 402 | 8,141,364 | 401 |
| 401 | 8,036,576 | 393 |
| 393 | 7,830,798 | 392 |
| 392 | 7,818,783 | 391 |
| 391 | 7,782,857 | 385 |
| 385 | 7,782,670 | 377 |
| 377 | 7,537,139 | 374 |
| 374 | 7,487,601 | 373 |
| 373 | 7,435,433 | 372 |
| 372 | 7,430,358 | 367 |
| 367 | 7,287,033 | 366 |
| 366 | 7,257,645 | 365 |
| 365 | 7,135,419 | 362 |
| 362 | 7,091,126 | 361 |
| 361 | 7,063,679 | 352 |
| 352 | 7,062,933 | 351 |
| 351 | 7,056,677 | 350 |
| 350 | 7,034,932 | 349 |
| 349 | 7,006,896 | 348 |
| 348 | 6,955,236 | 347 |
| 347 | 6,911,073 | 345 |
| 345 | 6,856,279 | 343 |
| 343 | 6,834,037 | 338 |
| 338 | 6,813,653 | 334 |
| 334 | 6,811,690 | 326 |
| 326 | 6,608,228 | 323 |
| 323 | 6,560,485 | 320 |
| 320 | 6,523,566 | 315 |
| 315 | 6,414,634 | 306 |
| 306 | 6,321,411 | 302 |
| 302 | 6,262,253 | 301 |
| 301 | 6,205,194 | 298 |
| 298 | 6,106,491 | 297 |

The paragraph below records the interim descent interpretation. Its runtime-326 conclusion
is superseded by the focused runtime-298 result and correction immediately after it.

The 423→424 change altered Balancer exponent precision and swap input handling used by
root-alpha selling; runtime 423's completed behavioral test nevertheless failed the
version-correct sign, scale, distribution, and conservation criteria. Runtime 422, which
predates the large runtime-423 testnet merge, also failed those criteria under its native
legacy epoch scheduler. Runtimes 421, 419, 417, 416, 415, and 413 also failed after complete marker warm-ups
and native 1,801-block measurements. Runtime 411 likewise failed after raw-reading its frozen pre-existing `SubnetProtocolAlpha` keys as a constant baseline and reconstructing exact legacy root liabilities. Runtimes 402 and 401 also failed after the same exact-liability correction; their AlphaAssets backports kept burned-alpha accounting observable without changing historical emission behavior. Runtime 393 required a narrow compatibility adapter for the runtime-447 snapshot's V2 stake entries; after preserving runtime 393's old `U64F64` share-pool arithmetic, it also failed the sign, scale, and distribution criteria. Runtime 392 adds only a disabled historical migration relative to 393, and runtime 391 differs only in unused hotkey-swap dispatch behavior, so both inherit runtime 393's bound for this controlled experiment. Runtimes 385, 377, 374, 373, 372, 367, 362, 361, 352, 348, 347, 343, 338, 334, and 326 then failed the corrected broad-positive sign and distribution criteria under native 1,801-block measurements. Runtime 326 required a final semantic correction: it predates `RootClaimable`, sells root alpha immediately, stores `PendingRootDivs` in TAO, and records already-sold alpha in `PendingAlphaSwapped`; neither legacy item is an outstanding alpha liability. With that version-correct formula, no positive current-residual subnet moved in the matching direction, the largest global-control ratio was `0.962060x`, and no subnet crossed `100x`. Runtime 323 is source-bounded by runtime 326: its only reachable automatic coinbase difference redirects the same incentive amount to a per-subnet auto-stake destination and cannot change total staked alpha; its epoch diff is comments and its hook additions are disabled migrations. Runtime 320 is also source-bounded: its only epoch difference omits writing informational `StakeWeight`, while its remaining changes are user-call validation/dispatch paths. Runtimes 366 and 365 are source-bounded by runtime 367; runtimes 351, 350, and 349 are source-bounded by runtime 352; and runtime 345 is source-bounded by runtime 347 because its only difference is unused stake-swap TAO-flow bookkeeping. Exact `:code` storage-change scans selected the recorded source tags. Runtime 348 additionally exposed a real negative-sign alpha-paid transaction-fee accounting defect, isolated separately. Runtime 338 exposed another separately reproduced negative defect: its subsidized path omits `root_alpha` from pending liabilities and directly subtracts bought alpha without burn/recycling accounting. The adjacent-block reproduction found 13 dynamically subsidized subnets, with stable material negative drift on 58, 70, 90, 99, and 103. Neither negative defect explains the broad positive residual. Runtime 373 was behaviorally tested because its older SDK/frontier revision prevented a pure source bound. Runtimes 420, 418, 414, and 412 were not deployed; runtime 315 is the next candidate.

Correction after the runtime-298 focused replay: the earlier runtime-326 classification
above treated all `PendingAlphaSwapped` as already sold. That is true on the normal branch
but false on the subsidized branch, where the root sell is skipped and the field holds
unsold alpha. Runtime 326, 323, and 320 are therefore inside the causal positive window,
not negative controls. The competing negative bugs described below remain real, but they
coexist with rather than remove the positive subsidized-buy mechanism.

Runtime 315 exposed another real negative-sign defect: owner-associated immune miner
incentives were skipped after issuance without being staked, burned, recycled, or recorded
as pending. Runtime 320 adds the missing burn/recycle operation. The warmed 1,801-block
runtime-315 run had 127 decreasing discrepancies, zero increasing discrepancies, and zero
matching movements among the 122 positive current-residual subnets; the largest negative
step was `-740.054137951 alpha`. It therefore cannot explain today's broad positive
residual. Runtime 306 was the next source-audit candidate.

Runtime 306 contains the same skipped owner-associated incentive branch. Its reachable
automatic differences from 315 preserve the accounting invariant: auto-stake changes only
the destination; childkey burn reduces both distributed stake and `SubnetAlphaOut`; the
remaining automatic changes are refactors/events. Its explicit-call changes and disabled
migrations are unreachable in this run. Runtime 306 is therefore source-bounded by the
completed runtime-315 negative result. Runtime 302 is next.

Runtime 302 already skips miner incentives for the subnet owner's hotkey without staking
them or reducing `SubnetAlphaOut`. Runtime 306 only expands the affected set to bounded
owner-associated immune hotkeys; it does not change the sign. The remaining automatic
change is commit-reveal bookkeeping. Runtime 302 is therefore source-bounded as a subset
of the runtime-315 negative defect. Runtime 301 is next.

Runtime 301 has the same automatic coinbase and epoch accounting as runtime 302. Its
changes are confined to explicit stake/weight calls, runtime APIs, and consensus/build
plumbing. It therefore inherits runtime 302's negative-only bound. Runtime 298 is next.

Runtime 298 is the stopping candidate. Relative to runtime 297 it introduces subsidized TAO
buying. The buy subtracts `bought_alpha` directly from `SubnetAlphaOut`; the root-alpha sell
is skipped, but runtime 298 still adds `root_alpha` to `PendingAlphaSwapped` and the remainder
to `PendingEmission`, then stakes their sum at epoch. The issued amount queued for stake is
therefore larger than the net `SubnetAlphaOut` increase by exactly `bought_alpha`.

The final saved adjacent-block test isolated this branch from epochs and the competing
owner-associated negative defect. On all 127 subsidized subnets:

```text
version-correct discrepancy movement
    = generic movement + unsold PendingAlphaSwapped increase
    = bought_alpha ± 2 rao
```

The aggregate one-block rate projected to 30,000 blocks matches `99.835819%` of the current
signed residual, all 122 positive residuals share its direction, and the minimum normalized
control ratio is `1,872,323x`. A second pristine-clone replay reproduced the result. Mainnet
runtime 298 began at block 6,106,491; runtime 334 began at block 6,811,690 and changed this
positive variant into the separately documented negative variant. The descent stops here.

## Saved evidence

- Runtime boundary map: `mainnet-runtime-version-map.md`
- Root Reborn audit test: `tests/test-root-reborn-migration-conservation.js`
- Root Reborn audit report: `root-reborn-migration-conservation.md`
- Runtime 439 tests/reports: `tests/test-runtime-439-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-439.js`, `runtime-439-upgrade-boundary.md`,
  `alpha-drift-runtime-439.md`
- Runtime 432 tests/reports: `tests/test-runtime-432-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-432.js`, `runtime-432-upgrade-boundary.md`,
  `alpha-drift-runtime-432.md`
- Runtime 424 tests/reports: `tests/test-runtime-424-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-424.js`, `runtime-424-upgrade-boundary.md`,
  `alpha-drift-runtime-424.md`
- Runtime 423 tests/reports: `tests/test-runtime-423-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-423.js`, `runtime-423-upgrade-boundary.md`,
  `alpha-drift-runtime-423.md`
- Runtime 411 tests/reports: `tests/test-runtime-411-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-411.js`, `runtime-411-upgrade-boundary.md`,
  `alpha-drift-runtime-411.md`
- Runtime 402 tests/reports: `tests/test-runtime-402-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-402.js`, `runtime-402-upgrade-boundary.md`,
  `alpha-drift-runtime-402.md`
- Runtime 401 tests/reports: `tests/test-runtime-401-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-401.js`, `runtime-401-upgrade-boundary.md`,
  `alpha-drift-runtime-401.md`
- Runtime 393 tests/reports: `tests/test-runtime-393-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-393.js`, `runtime-393-upgrade-boundary.md`,
  `alpha-drift-runtime-393.md`
- Runtime 385 tests/reports: `tests/test-runtime-385-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-385.js`, `runtime-385-upgrade-boundary.md`,
  `alpha-drift-runtime-385.md`
- Runtime 377 tests/reports: `tests/test-runtime-377-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-377.js`, `runtime-377-upgrade-boundary.md`,
  `alpha-drift-runtime-377.md`
- Runtime 374 provenance/tests/reports: `tests/map-mainnet-runtime-374-code-boundaries.js`,
  `mainnet-runtime-374-code-boundaries.md`, `tests/test-runtime-374-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-374.js`, `runtime-374-upgrade-boundary.md`,
  `alpha-drift-runtime-374.md`
- Runtime 373 tests/reports: `tests/test-runtime-373-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-373.js`, `runtime-373-upgrade-boundary.md`,
  `alpha-drift-runtime-373.md`
- Runtime 372 provenance/tests/reports: `tests/map-mainnet-runtime-372-code-boundaries.js`,
  `mainnet-runtime-372-code-boundaries.md`, `tests/test-runtime-372-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-372.js`, `runtime-372-upgrade-boundary.md`,
  `alpha-drift-runtime-372.md`
- Runtime 367 provenance/tests/reports: `tests/map-mainnet-runtime-367-code-boundaries.js`,
  `mainnet-runtime-367-code-boundaries.md`, `tests/test-runtime-367-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-367.js`, `runtime-367-upgrade-boundary.md`,
  `alpha-drift-runtime-367.md`
- Runtime 362 provenance/tests/reports: `tests/map-mainnet-runtime-362-code-boundaries.js`,
  `mainnet-runtime-362-code-boundaries.md`, `tests/test-runtime-362-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-362.js`, `runtime-362-upgrade-boundary.md`,
  `alpha-drift-runtime-362.md`
- Runtime 361 provenance/tests/reports: `tests/map-mainnet-runtime-361-code-boundaries.js`,
  `mainnet-runtime-361-code-boundaries.md`, `tests/test-runtime-361-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-361.js`, `runtime-361-upgrade-boundary.md`,
  `alpha-drift-runtime-361.md`
- Runtime 352 provenance/tests/reports: `tests/map-mainnet-runtime-352-code-boundaries.js`,
  `mainnet-runtime-352-code-boundaries.md`, `tests/test-runtime-352-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-352.js`, `runtime-352-upgrade-boundary.md`,
  `alpha-drift-runtime-352.md`
- Runtime 351 provenance/source-bound report: `tests/map-mainnet-runtime-351-code-boundaries.js`,
  `mainnet-runtime-351-code-boundaries.md`
- Runtime 350 provenance/source-bound report: `tests/map-mainnet-runtime-350-code-boundaries.js`,
  `mainnet-runtime-350-code-boundaries.md`
- Runtime 349 provenance/source-bound report: `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-349-code-boundaries.md`
- Runtime 348 provenance/tests/reports: `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-348-code-boundaries.md`, `tests/test-runtime-348-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-348.js`, `tests/test-runtime-348-alpha-fee-accounting.js`,
  `runtime-348-upgrade-boundary.md`, `alpha-drift-runtime-348.md`,
  `runtime-348-alpha-fee-accounting.md`
- Runtime 347 provenance/tests/reports: `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-347-code-boundaries.md`, `tests/test-runtime-347-ema-reachability.js`,
  `tests/test-runtime-347-upgrade-boundary.js`, `tests/test-alpha-drift-runtime-347.js`,
  `runtime-347-ema-reachability.md`, `runtime-347-upgrade-boundary.md`,
  `alpha-drift-runtime-347.md`
- Runtime 345 provenance/source-bound report: `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-345-code-boundaries.md`
- Runtime 343 provenance/tests/reports: `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-343-code-boundaries.md`, `tests/test-runtime-343-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-343.js`, `runtime-343-upgrade-boundary.md`,
  `alpha-drift-runtime-343.md`
- Runtime 338 provenance/tests/reports: `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-338-code-boundaries.md`, `tests/test-runtime-338-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-338.js`, `tests/test-runtime-338-subsidized-accounting.js`,
  `runtime-338-upgrade-boundary.md`, `alpha-drift-runtime-338.md`,
  `runtime-338-subsidized-accounting.md`
- Runtime 334 provenance/tests/reports: `tests/map-mainnet-runtime-versions.js`,
  `mainnet-runtime-334-code-boundaries.md`, `tests/test-runtime-334-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-334.js`, `runtime-334-upgrade-boundary.md`,
  `alpha-drift-runtime-334.md`
- Runtime 326 provenance/tests/reports: `tests/map-mainnet-runtime-versions.js`,
  `mainnet-runtime-326-code-boundaries.md`, `tests/test-runtime-326-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-326.js`, `runtime-326-upgrade-boundary.md`,
  `alpha-drift-runtime-326.md`
- Runtime 323 provenance/source-bound report: `tests/map-mainnet-runtime-versions.js`,
  `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-323-code-boundaries.md`
- Runtime 320 provenance/source-bound report: `tests/map-mainnet-runtime-versions.js`,
  `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-320-code-boundaries.md`
- Runtime 315 provenance/tests/reports: `tests/map-mainnet-runtime-versions.js`,
  `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-315-code-boundaries.md`, `tests/test-runtime-315-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-315.js`, `runtime-315-upgrade-boundary.md`,
  `alpha-drift-runtime-315.md`
- Runtime 306 provenance/source-bound report: `tests/map-mainnet-runtime-versions.js`,
  `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-306-code-boundaries.md`
- Runtime 302 provenance/source-bound report: `tests/map-mainnet-runtime-versions.js`,
  `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-302-code-boundaries.md`
- Runtime 301 provenance/source-bound report: `tests/map-mainnet-runtime-versions.js`,
  `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-301-code-boundaries.md`
- Runtime 298 provenance/tests/reports: `tests/map-mainnet-runtime-versions.js`,
  `tests/map-mainnet-runtime-349-code-boundaries.js`,
  `mainnet-runtime-298-code-boundaries.md`, `tests/test-runtime-298-upgrade-boundary.js`,
  `tests/test-alpha-drift-runtime-298.js`, `tests/test-runtime-298-subsidized-accounting.js`,
  `runtime-298-upgrade-boundary.md`, `alpha-drift-runtime-298.md`,
  `runtime-298-subsidized-accounting.md`

Every dynamically completed candidate result above comes from the final saved test file
executed end-to-end after its last edit. Runtimes 392, 391, 366, 365, 351, 350, 349, and 345 are explicitly
source-bounded. Runtime 298 is the reproduced stopping candidate and runtime 297 is its lower source control.
