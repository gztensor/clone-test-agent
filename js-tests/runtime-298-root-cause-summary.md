# Runtime 298 alpha-accounting root-cause summary

Generated: 2026-08-20

## Verdict

Runtime 298 is the stopping root-cause candidate for the present broad positive
alpha-accounting residual. It is the first deployed runtime that contains the matching
subsidized-buy path; runtime 297 does not contain it.

On the subsidized branch, runtime 298:

1. buys alpha from the subnet pool;
2. subtracts the bought amount directly from `SubnetAlphaOut`;
3. skips selling `root_alpha`;
4. nevertheless queues `root_alpha` in `PendingAlphaSwapped` and queues the remainder in
   `PendingEmission`;
5. stakes the sum of both fields at the epoch.

Consequently, the full emitted alpha becomes stake even though the net `SubnetAlphaOut`
increase was reduced by the bought amount:

```text
version-correct discrepancy increase = bought_alpha
```

`PendingAlphaSwapped` has mixed semantics in this runtime. It is already-sold alpha on the
normal branch but unsold, queued alpha on the subsidized branch. The earlier runtime-326
analysis excluded the whole field and was therefore a formula false negative.

## Final reproduced evidence

| Check | Result |
|---|---:|
| Historical source | runtime 298, `v3.2.3` |
| Source commit | `6309d35929e484ebff70c7da68547fb9c60f0d11` |
| Candidate WASM SHA-256 | `3eb5e2d335ebd3dfbcbf8293822d98a9b7a01f5801378f1bda947a65557292a1` |
| Independent upgrade boundary | block 699 runtime 447 → block 700 local runtime 448 |
| Migration-marker changes | 0 |
| Maximum activation discontinuity | 3 rao |
| Focused adjacent interval | blocks 3,428 → 3,429 |
| Epochs in focused interval | 0 on all 128 alpha subnets |
| Material subsidized subnets | 127 of 128 |
| Positive current-residual subnets matching direction | 122 of 122 |
| Maximum `corrected movement - bought_alpha` | 2 rao |
| Aggregate reproduced drift | `+12.963919978 α/block` |
| 30,000-block projection | `+388,917.599340 α` |
| Certified current signed residual | `+389,557.175298267 α` |
| Projection match | `99.835819%` |
| Minimum per-subnet ratio to 720-block control maximum | `1,872,323×` |

The same exact component identity was observed in the first replay and reproduced after a
second restore from the certified pristine runtime-447 snapshot.

## Source boundary

| Runtime | First post-state block | Accounting behavior |
|---:|---:|---|
| 297 | 6,067,943 | No subsidized-buy path; lower source control |
| 298 | 6,106,491 | Introduces the positive bought-alpha discrepancy |
| 326 | 6,608,228 | Still contains the runtime-298 mixed-field path |
| 334 | 6,811,690 | Changes the branch to the separately reproduced negative root-alpha omission |
| 343 | 6,834,037 | Complete recycling behavior deployed |

The complete later correction is commit `6a76ecc0d` (`hotfix: epoch w/subsidy fix (#2187)`),
which recycles bought alpha and unsold root alpha instead of leaving either outside the
accounting destinations.

## Controls and limitations

- Runtime-446 historical migrations did not run. Only the ongoing generation-scoped
  burned-alpha control was backported.
- The PR #1321-equivalent root/alpha dividend split was already present.
- The raw 1,801-block runtime-298 report is not authoritative for direction because it
  excluded all `PendingAlphaSwapped` and also contains the competing negative
  owner-associated incentive defect. The focused adjacent-block report isolates the
  subsidized-buy mechanism exactly.
- The 30,000-block number is a linear projection at the reproduced runtime-447 snapshot's
  prices and subsidy state. It demonstrates matching scale for the stopping rule; it is not
  a block-by-block integration of the historical runtime-298-through-326 deployment.

## Saved verification

- Test: `tests/test-runtime-298-upgrade-boundary.js`
- Test: `tests/test-alpha-drift-runtime-298.js`
- Final focused test: `tests/test-runtime-298-subsidized-accounting.js`
- Boundary report: `runtime-298-upgrade-boundary.md`
- Raw epoch report: `alpha-drift-runtime-298.md`
- Final component report: `runtime-298-subsidized-accounting.md`
- Final logs: `temp/runtime-298-upgrade-boundary.log`,
  `temp/alpha-drift-runtime-298.log`, and `temp/runtime-298-subsidized-accounting.log`

The final saved focused test was executed end-to-end after its last edit and exited 0.
