# Historical runtime search for alpha-accounting drift

Generated: 2026-08-18

## Verdict

The first tested historical runtime that recreates material alpha-accounting drift is
**runtime 440**. Runtime 441 does not recreate it. The causal boundary is therefore the
runtime-441 **Root Reborn** change.

The accelerated clone result is not marginal:

- 127 of 128 alpha subnets crossed the 100× corrected-control stopping threshold.
- Subnet 70 reached **60,674,374.1×** its corrected runtime-447 control.
- Its signed discrepancy moved by **-500.866958157 α** over 1,800 blocks.
- Reconstructing runtime 440's unstaked legacy root-dividend ledger explains
  **500.863834067 α** of that movement.
- The remaining subnet-70 residual is **0.003124090 α**, or **0.000623%**.
- Across all material subnet movements, the worst relative reconstruction residual is
  **0.013232%**, on subnet 1.

This result was reproduced from a second copy of the certified pristine runtime-447 clone.
The final report and logs are from that independent reproduction.

## What the discrepancy actually represents in runtime 440

Runtime 440 splits validator dividends into alpha-staker and root-staker portions. The
alpha-staker portion is materialized as stake, but the root-staker portion is accumulated
as a per-hotkey cumulative rate in `RootClaimable`. It remains outside
`TotalHotkeyAlpha` until an automatic or manual root claim materializes it. `RootClaimed`
is the per-position watermark that prevents repeat claims.

`SubnetAlphaOut` already includes the earned root-dividend alpha. The accounting formula
used by this investigation subtracts current pending-emission fields, but runtime 440's
earned and still-unclaimed root dividend is no longer in those pending fields. It is in the
legacy owed ledger. Consequently, the formula temporarily treats this alpha as staked even
though it is still owed and unstaked.

For runtime 440, the missing liability per subnet is:

```text
legacy_root_owed =
    sum_hotkey(RootClaimableRate[hotkey][netuid] * root_stake[hotkey])
    - sum_hotkey,coldkey(RootClaimed[netuid][hotkey][coldkey])
```

The corresponding historical accounting identity is:

```text
actual_staked ≈
    SubnetAlphaOut
    - AlphaBurned
    - current_pending
    - SubnetProtocolAlpha
    - legacy_root_owed
```

The final test evaluates `legacy_root_owed` independently at both exact snapshot hashes.
This matters because automatic claims can convert alpha to TAO and add it to root stake;
42 root hotkeys changed root stake in the final interval. A fixed-stake extrapolation would
therefore be incorrect.

## Why runtime 441 stops the drift

Runtime 441 is the Root Reborn release (`8b9d55c723e00d0d713eed799de627e94603dfd4`).
It replaces the runtime-440 root-claim path with deferred and pending beta-basket deposits:

- root dividends are routed through `DeferredRootAlphaDividends` while seeding;
- normal epoch credits are queued in `PendingBasketDeposits`;
- the accounting report explicitly subtracts `PendingBasketDeposits`;
- deposits then materialize into basket holdings rather than accumulating in the legacy
  `RootClaimable`/`RootClaimed` owed ledger.

The dynamic boundary agrees with the source change: runtime 440 produces hundreds of alpha
of apparent drift per subnet, while runtime 441 returns to the same rao-scale noise as
runtimes 443 and 445.

This is a historical liability-accounting boundary, not evidence that current runtime 447
continues to create material discrepancy. The runtime-447 adjacent-block and epoch controls
remain at rao scale.

## Candidate matrix

All candidates advertise local spec 448, include the non-migration runtime-446
generation-scoped `AlphaBurned` fix, retain the PR-1321 dividend subtraction already present
in these versions, and disable all runtime-upgrade migrations.

| Source runtime | Source commit | Dynamic result | Largest raw movement | Largest subnet-control ratio | 100× crossings |
|---:|---|---|---:|---:|---:|
| 445 | `d3f40e44bda9019c606aeb0c907bb52ba7fe386c` | control/no acceleration | 0.000053273 α | 1.260× | 0 |
| 444 | not deployed | skipped | n/a | n/a | n/a |
| 443 | `c02a376ecee28718970962562fece409b695df72` | control/no acceleration | 0.000052850 α | 1.260× | 0 |
| 442 | `ec112cb0e68469fa1c5e5ae67dece043033f6673` | statically bounded by 443 and 441 | n/a | n/a | 0 inferred |
| 441 | `8b9d55c723e00d0d713eed799de627e94603dfd4` | control/no acceleration | 0.000053362 α | 1.227× | 0 |
| **440** | `e4ffa2e1325c6c7db618dbceaf396310a170990c` | **root cause reproduced** | **500.866958157 α** | **60,674,374.1×** | **127** |

Runtime 442 was not run as a separate full clone. Runtime 443 differs from 442 only in the
`stake_into_basket` dispatch gate and version bump, while runtime 441 was also dynamically
clean. Neither side of 442 contains an epoch-accounting signal. Runtime 440 is separated
from 441 by the much larger Root Reborn change and was tested dynamically twice.

## Independent runtime-440 reproduction

### Upgrade boundary

- Candidate source: runtime 440 at
  `e4ffa2e1325c6c7db618dbceaf396310a170990c`
- Compact compressed WASM SHA-256:
  `aad13277b04f6a6afa8947c40b36c2da7fb51efd299b1fde23cb56ef6bc016b5`
- Exact activation: block 184 runtime 447 → block 185 runtime 448
- Activation hash:
  `0xb67a34f0fc1421bba2092cea509c52c4bd5e3d0c4ef71752c86beb021498b2c2`
- `HasMigrationRun` marker changes: 0
- Non-epoch subnets checked at activation: 127
- Largest non-epoch activation movement: 3 rao
- Pre-upgrade smoke test: passed
- Post-upgrade smoke test: passed

### Epoch interval

- Earlier snapshot: block 465,
  `0xb4f910a2ea49132ee4a8723631742905c3ee388fb721e52bf2bb509d2f2a4436`
- Later snapshot: block 2,265,
  `0xfe9468aac748ed7a1d341fd7d3145e953dffa6366673e602da934582d6ef00c1`
- Distance: 1,800 blocks
- Alpha subnets: 128
- Epoch coverage: all alpha subnets executed at least one epoch
- Signed discrepancy decreased: 127 subnets
- Signed discrepancy unchanged: subnet 86
- 100× threshold crossings: 127

### Subnet 70 component proof

| Component | 1,800-block change |
|---|---:|
| Actual `TotalHotkeyAlpha` sum | +478.436111915 α |
| Formula-calculated staked alpha | +979.303070072 α |
| `SubnetAlphaOut` | +1,717.307188366 α |
| `AlphaBurned` | +738.004118291 α |
| Current pending alpha | +0.000000003 α |
| `SubnetProtocolAlpha` | 0 α |
| Observed newly missing alpha | +500.866958157 α |
| Gross legacy claimable-entitlement change | +583.671418767 α |
| `RootClaimed` increase | +82.807584700 α |
| Net unstaked legacy-ledger growth | +500.863834067 α |
| Unexplained residual | +0.003124090 α (0.000623%) |

## Controls and safeguards

- Base state was certified as runtime 447 with all three relevant runtime-446 migration
  markers already set.
- The runtime-440 candidate used no migration or backfill. Its activation boundary was
  checked separately from epochs.
- The runtime-446 patch applied to candidates only prevents old subnet generations from
  reusing `AlphaBurned`/issuance counters; it does not change existing synced counters.
- The PR-1321-equivalent `alpha_divs = dividend - root_divs` behavior and its unit test are
  present in runtime 440.
- Runtime-440 metadata predates `PendingBasketDeposits`, but the synced runtime-447 raw keys
  still exist. The final test reads those keys directly using the known
  `Blake2_128Concat<AccountId32> + Identity<NetUid>` layout and 8-byte `AlphaBalance`
  values, so the pending term is not silently omitted.
- The accelerated clone's local block height is not used for extrapolation. Candidate
  significance is measured only against corrected runtime-447 controls.

## Saved tests and evidence

- Runtime map: `mainnet-runtime-version-map.md`
- Certified base: `runtime447-base-certification.md`
- Base manifest: `runtime447-base-manifest.md`
- Final boundary test: `tests/test-runtime-440-upgrade-boundary.js`
- Final drift and ledger-attribution test: `tests/test-alpha-drift-runtime-440.js`
- Shared exact-block reader: `tests/mainnet-alpha-accounting-two-tempos.js`
- Boundary report: `runtime-440-upgrade-boundary.md`
- Full candidate report: `alpha-drift-runtime-440.md`
- Boundary log: `temp/runtime-440-upgrade-boundary.log`
- Full candidate log: `temp/alpha-drift-runtime-440.log`

The final saved runtime-440 boundary and drift tests were both executed end-to-end after
their last edits against the independently restored pristine clone.
