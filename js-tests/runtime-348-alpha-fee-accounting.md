# Runtime 348 alpha-paid transaction-fee accounting

Generated: 2026-08-20T06:52:38.001Z

## Result

Runtime 348 reproduces an unaccounted alpha burn when a transaction cannot pay its fee in TAO. The deliberately below-minimum `removeStake` call failed with `subtensorModule.AmountTooLow: Stake amount is too low.`, so none of its stake-removal or swap logic executed. The immediately preceding empty block changed actual stake by exactly zero. In the failed transaction block, pre-dispatch fee charging removed **0.011312733 α** from actual stake and did not change `AlphaBurned`. Because the failed dispatch never entered stake-removal/swap logic and the fee handler writes only the stake pool, this is an equal unaccounted accounting effect of **-0.011312733 α**.

This moves `actual - calculated` in the opposite direction from the broad positive current residual, so this defect cannot by itself explain the current 1–2% discrepancy. It can contribute to negative subnet outliers.

| Interval | Exact blocks | Actual stake Δ α | Calculated stake Δ α | Signed discrepancy Δ α | AlphaBurned Δ α |
|---|---|---:|---:|---:|---:|
| Failed alpha-paid call | 10517→10518 | -0.011312733 | -0.019226896 | +0.007914163 | 0 |

Probe: `5CXB2XUYCZRgr5yQidRTtDktNpERwH7HqngBozjby6BNDE4g`; hotkey: `5FnWMK2TA5cWRXJRNyESbiKcHVMfcSCxadNzEoSSQ771gibF`; quoted fee: 0.000089148 TAO. No subnet-1 epoch executed. Exact transaction comparison hashes: `0x19bfbbfe25900011d6371632bd96395aa2814b066f4d9340543076f8a5a5fd0f` → `0xbe77d7d6bb297ac1dd6947e71b8169c9c5d127a8f1b073eee6d3311f8d754c98`. The later-named `SubnetProtocolAlpha` value is read from its raw storage key and included in calculated liabilities. `PendingBasketDeposits` is unknown to runtime 348 and cannot change in this block, so it cancels from the adjacent-block movement.
