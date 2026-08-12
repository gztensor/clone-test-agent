# Subnet ownership conviction and alpha accounting

Generated: 2026-08-12T21:19:53.039Z

## Run summary

| Phase | Block | Runtime | All 3 migration markers | Subnets | King calculation mismatches | Alpha discrepancies >1% |
|---|---:|---|---|---:|---:|---:|
| before | 7 | node-subtensor/443 | false | 128 | 0 | 121 |
| after | 24 | node-subtensor/445 | true | 128 | 0 | 8 |

> **Migration verification:** all three migration markers and their state effects were verified on the clone despite its non-mainnet genesis `0x57a26328383c75e8d0089bced04da375d90811ad2b0072633efdccfb1bf13c80`. Subnet 1 `SubnetAlphaOut` increased by `16,858.48162745 α` including the expected `16,841.48162745 α` repair. Its expected historical burn backfill was approximately `+661,707.044125477 α` and observed `+661,730.798373523 α`; this closely matched after normal post-snapshot burn activity. Generation-counter rebases for subnets 16, 40, 58, 70, 86, 90, 92, 99, 103, 116 were also observed. After all three migrations, `8` subnets exceed 1% discrepancy.

### Generation-counter rebase verification

Observed values are pre-upgrade minus post-upgrade counters; small differences from the embedded offsets come from normal counter activity between snapshots.

| Netuid | Issuance expected α | Issuance observed α | Burned expected α | Burned observed α | Recycled expected α | Recycled observed α | Result |
|---:|---:|---:|---:|---:|---:|---:|---|
| 116 | 10,946 | +10,929 | 0 | 0 | 0 | 0 | verified |
| 92 | 68,575.13622273 | +68,558.13622273 | 0 | 0 | 0 | 0 | verified |
| 40 | 126,076 | +126,053.928009493 | 51,803.789083976 | +51,803.789083976 | 0 | 0 | verified |
| 16 | 176,862 | +176,845 | 42,912.779090897 | +42,912.779090897 | 0 | 0 | verified |
| 58 | 227,233 | +227,216 | 93,219.350226399 | +93,219.350226399 | 0 | 0 | verified |
| 99 | 317,241.269686137 | +317,221.861853331 | 591.633301496 | +591.633301496 | 1,518.370122169 | +1,518.370122169 | verified |
| 90 | 345,144.192991428 | +345,127.192991428 | 116,392.269522858 | +116,392.269522858 | 80.950014273 | +80.950014273 | verified |
| 86 | 415,723.558271648 | +415,723.558271648 | 167,757.35619872 | +167,757.35619872 | 0 | 0 | verified |
| 103 | 529,768.402624963 | +529,751.402624963 | 78,741.954591065 | +78,741.954591065 | 0 | 0 | verified |
| 70 | 589,757.917904445 | +589,740.917904445 | 148.169094182 | +148.169094182 | 3,904.269338445 | +3,904.269338445 | verified |

The pre-upgrade ownership threshold is `10% × SubnetAlphaOut`. The post-upgrade threshold is `10% × (SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha)`. Conviction forecasts roll the four aggregate lock buckets forward with the runtime exponential equations and evaluate only scheduled epoch checks. Clone-local block numbers are rebased onto the preserved mainnet BlockHash window before evaluating registration age or lock evolution. Forecasts assume no future lock transactions. They extrapolate owner-UID incentive withholding from the current `MinerBurned` fraction: `SubnetAlphaOutEmission × (1 - enabled owner cut) × 50% miner share × MinerBurned`. In burn mode this increases future `AlphaBurned`; in recycle mode it reduces future `SubnetAlphaOut`. The current emission, owner-cut, and withholding rates are held constant, as is future protocol-owned alpha. All takeover intervals in this report use this moving-threshold method. A takeover prediction also requires the subnet to pass its one-year ownership age gate. A threshold crossing is reported as an ownership change only when the projected king belongs to a different coldkey than the current owner; otherwise the result is `owner remains king`. “Not projected” means total conviction did not reach the moving threshold in the 10-year forecast window.

## TaoSwap gate-estimate comparison

TaoSwap's API field `gate_eta_days` forecasts when total conviction reaches the moving 10% threshold. The TaoSwap observations below came from its public subnet API near the clone snapshot.

| Netuid | Clone moving-threshold takeover ETA | TaoSwap gate ETA | Predicted takeover king |
|---:|---|---|---|
| 3 | 17.1 days | 18 days (block 8,830,031) | `5E6yHkm…MUpnqG` |
| 20 | 3.0 days | 3 days (block 8,830,181) | `5ED4s3B…qpwW2Q` |
| 24 | 16.8 days | 17 days (block 8,830,006) | `5ELpkVn…e6YVcL` |
| 39 | 22.2 days | 23 days (block 8,830,031) | `5GP7c3f…SWVCMi` |
| 81 | 8.8 days | 9 days (block 8,830,031) | `5H47sFL…n4wdDa` |

## Changed subnet ownership takeover predictions

| Subnet netuid | Predicted takeover time interval before | Predicted takeover king before | Predicted takeover time interval after | Predicted takeover king after |
|---:|---|---|---|---|
| 3 | 17.1 days | `5E6yHkm…MUpnqG` | 0 | `5E6yHkm…MUpnqG` |
| 20 | 3.0 days | `5ED4s3B…qpwW2Q` | 0 | `5ED4s3B…qpwW2Q` |
| 39 | 22.2 days | `5GP7c3f…SWVCMi` | 0 | `5GP7c3f…SWVCMi` |
| 81 | 8.8 days | `5H47sFL…n4wdDa` | 0 | `5H47sFL…n4wdDa` |

## Before upgrade: subnet kings and takeover projection

Snapshot clone block: `7`; projection mainnet block: `8829627` (`0x2992089e82a28a5488bc15ab791fb68111ebdf9558ed53d3c5dffde365b53b90`)

Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α now | Owner-UID withheld | Mode | Threshold growth α/day | Gate | Mature | Ownership result | Predicted king |
|---:|---|---|---:|---:|---:|---|---:|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,833.478 | 248,442.0267 | 57.87% (1,708.2532 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 332,852.2356 | 82.62% (2,438.8914 α/day) | burn | 720 | met | yes | owner remains king | `5CFxLBv…juK17J` |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 246,380.2948 | 280,268.441 | 0.00% (0 α/day) | burn | 720 | not met | yes | 17.1 days (block 8952795) | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.1165 | 350,340.8029 | 7.02% (207.123 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 299,876.2244 | 42.23% (1,246.6396 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 271,587.8911 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CfSg4e…GxJrMA` |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 312,992.2312 | 90.42% (2,669.2966 α/day) | recycle | 453.0703 | not met | yes | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,572.4092 | 303,474.0132 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5F6tnxz…tQjw8y` |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 394,100.979 | 50.00% (1,476.0083 α/day) | burn | 720 | met | yes | owner remains king | `5Fsbube…4mJJZ9` |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,046.8583 | 311,809.26 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 298,059.5392 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 336,023.8049 | 99.40% (2,934.2811 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 241,972.0443 | 71.26% (2,103.4789 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,413.1571 | 305,919.5258 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 128,284.6767 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,310.2177 | 29,224.2056 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 487,150.1625 | 302,562.9887 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5E7eSeR…HCen2B` |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 322,151.1358 | 6.64% (195.9222 α/day) | burn | 720 | met | yes | owner remains king | `5DCSySU…NwoWyG` |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 254,531.851 | 38.01% (1,121.956 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 287,644.5313 | 315,156.5118 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | 3.0 days (block 8851337) | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 344,633.1945 | 45.13% (1,332.1147 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 342,467.8079 | 52.08% (1,537.4454 α/day) | burn | 720 | met | yes | owner remains king | `5CUu1Qh…oD4dyP` |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 476,840.1279 | 404,088.7136 | 100.00% (2,952.0165 α/day) | burn | 720 | met | yes | owner remains king | `5HKsviv…5rM28H` |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 271,754.0121 | 364,168.0385 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | owner remains king | `5ELpkVn…e6YVcL` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 411,655.0161 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 2,553.326 | 77,666.4347 | 50.04% (1,477.1406 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 321,706.9984 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,349.6213 | 465,261.8245 | 15.79% (466.0099 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 289,847.8593 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 338,255.9049 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 158,649.3688 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | owner remains king | `5CDZ527…pQfftn` |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 342,720.2833 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DWgkCS…uS9Qad` |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.5271 | 230,181.193 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,307.3748 | 251,772.5176 | 0.00% (0 α/day) | recycle | 720 | not met | yes | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,183.1081 | 298,851.2928 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 62,787.2239 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 357,253.7216 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 38,442.911 | 147,307.4634 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 186,546.7511 | 316,641.6553 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | 22.2 days (block 8989581) | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 32,698.6734 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 297,515.4612 | 71.96% (2,124.1484 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 259,502.4142 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 305,276.8885 | 79.84% (2,356.757 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 401,235.386 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2915 | 301,173.3442 | 64.44% (1,902.1497 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 173,963.3918 | 351,069.9598 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,593.3998 | 129,551.0895 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 310,751.605 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 201,785.6758 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 323,689.605 | 0.00% (0.0037 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.4618 | 369,482.194 | 0.00% (0 α/day) | recycle | 720 | met | yes | owner remains king | `5FTVrwE…ZouKg1` |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 295,209.8071 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 458,743.2096 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 377,418.7692 | 33.29% (982.8731 α/day) | burn | 720 | met | yes | owner remains king | `5DUB7kN…L9Wgpr` |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 279,931.8289 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 264,638.7264 | 64.47% (1,903.0952 α/day) | burn | 720 | met | yes | owner remains king | `5GU4Xkd…1mVXFu` |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 82,575.8111 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 29,728.4291 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 387,345.8393 | 319,371.4959 | 100.00% (2,952.0165 α/day) | burn | 720 | met | yes | owner remains king | `5EF9dnw…FjNdve` |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,073,423.6617 | 373,891.9574 | 50.00% (1,476.0082 α/day) | burn | 720 | met | yes | owner remains king | `5CXLwkK…hA9rhR` |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 436,863.0078 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5ECEsYL…c8jUbn` |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 148,964.7545 | 263,936.0551 | 13.34% (393.7444 α/day) | recycle | 680.6256 | not met | yes | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 381,724.2507 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,047.7305 | 334,074.7569 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CS3g6n…Ks2xbV` |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 322,316.8027 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 335,554.8768 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DRPoRi…MzcpZV` |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 81,821.6006 | 3.85% (113.6281 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 601,812.9802 | 360,649.3316 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CSuegT…4rQbbb` |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 112,773.8984 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,831.4224 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 418,510.3678 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 504,437.4551 | 248,678.6252 | 100.00% (2,952.0165 α/day) | burn | 720 | met | yes | owner remains king | `5DUuFhF…16k2GU` |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 940,167.6364 | 328,036.392 | 100.00% (2,952.0165 α/day) | burn | 720 | met | yes | owner remains king | `5Dnkprj…K8pFhW` |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 333,590.4259 | 63.00% (1,859.7876 α/day) | recycle | 534.0212 | met | yes | owner remains king | `5Dnffft…bXGH7L` |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,610.2123 | 350,854.2735 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5G1Qj93…sQzs6g` |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 101,466.3381 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 321,182.2798 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DqALXR…DdohsE` |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 65,003.0487 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 352,216.4421 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5EWwdZB…6HSxoF` |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 180,579.0602 | 91.78% (2,709.2916 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 198,521.2198 | 260,433.5393 | 1.02% (30.211 α/day) | burn | 720 | not met | yes | 8.8 days (block 8892791) | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 63,702.783 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 265,515.1095 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 57,328.5242 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 250,782.7988 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | 0.00% (0 α/day) | burn | 0 | met | no | owner remains king | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,810.1694 | 150,725.3582 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 345,801.9057 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5HK4vbG…LPgXpY` |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 276,392.3852 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 14,011.0393 | 87.14% (2,572.4749 α/day) | recycle | 462.7525 | met | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 73,528.6936 | 99,344.4859 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 38,287.3229 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,285.3698 | 318,019.3233 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DAoDtM…DhfNNK` |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 158,282.5578 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 282,349.1049 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 149,658.0705 | 67,292.1803 | 41.06% (1,212.0436 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 94,168.6713 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 588,407.7365 | 279,026.1348 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5HWVxik…BtFxvK` |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 21,752.7329 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 328,268.1771 | 179,978.7096 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 230,150.2793 | 90.22% (2,663.3893 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 84,313.7315 | 25.06% (739.8379 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 9,666.3397 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 306,296.1343 | 95.27% (2,812.4852 α/day) | recycle | 438.7515 | not met | yes | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 200,542.8197 | 192,217.1081 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 272,897.1464 | 237,697.9761 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5D7FVSM…ezvyHy` |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 141,229.9828 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 319,531.7947 | 153,051.3515 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,573.3469 | 140,891.8282 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 249,296.1332 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 344,269.2712 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 186,576.0737 | 80.00% (2,361.606 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 81,418.3897 | 142,647.2254 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 139,458.3691 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 152,748.9977 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 49,832.0033 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 161,680.1597 | 157,738.4159 | 100.00% (2,952.0165 α/day) | recycle | 424.7984 | met | yes | owner remains king | `5DwRMxJ…RozmGE` |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 118,221.2178 | 202,404.692 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 149,333.3518 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,234.3433 | 254,672.8102 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 276,664.4954 | 60.79% (1,794.6108 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 100,470.0546 | 49,482.945 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 185,035.2345 | 41.11% (1,213.5262 α/day) | burn | 720 | met | yes | owner remains king | `5GxsywP…Nba82o` |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 330,478.09 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5GZPtUj…AEDjmt` |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 232,581.943 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 122,562.8092 | 110,763.3577 | 30.07% (887.7584 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 280,281.7648 | 70.63% (2,085.1129 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5742 | 267,678.3344 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |

## After upgrade: subnet kings and takeover projection

Snapshot clone block: `24`; projection mainnet block: `8829644` (`0x473a338a2337971ffe125ab9b47f096b3ea1c8eda9649a7ca03693bad05575fd`)

Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α now | Owner-UID withheld | Mode | Threshold growth α/day | Gate | Mature | Ownership result | Predicted king |
|---:|---|---|---:|---:|---:|---|---:|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,833.4782 | 165,735.0761 | 57.94% (1,710.3059 α/day) | burn | 548.9694 | met | yes | owner remains king | `5HCFWvR…1wgDHh` |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 270,920.5488 | 82.62% (2,438.8914 α/day) | burn | 476.1109 | met | yes | owner remains king | `5CFxLBv…juK17J` |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 246,388.0301 | 207,632.6456 | 0.00% (0 α/day) | burn | 720 | met | yes | 0 | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.1165 | 280,964.8299 | 7.02% (207.123 α/day) | burn | 699.2877 | not met | yes | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 152,352.0209 | 42.23% (1,246.6396 α/day) | burn | 595.336 | not met | yes | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 245,010.7848 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CfSg4e…GxJrMA` |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 308,744.2666 | 90.42% (2,669.2966 α/day) | recycle | 453.0703 | not met | yes | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,572.4092 | 220,196.4986 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5F6tnxz…tQjw8y` |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 266,056.8612 | 50.00% (1,476.0083 α/day) | burn | 572.3992 | met | yes | owner remains king | `5Fsbube…4mJJZ9` |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,046.7859 | 241,188.4037 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 172,208.4444 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 185,473.1904 | 99.40% (2,934.2811 α/day) | burn | 426.5719 | not met | yes | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 182,670.0153 | 71.26% (2,103.4789 α/day) | burn | 509.6521 | not met | yes | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,412.8543 | 176,568.264 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 70,976.3699 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,310.3827 | 21,955.4925 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 487,150.2868 | 258,976.0719 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5E7eSeR…HCen2B` |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 272,592.2943 | 6.64% (195.9222 α/day) | burn | 700.4078 | met | yes | owner remains king | `5DCSySU…NwoWyG` |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 155,611.1586 | 38.01% (1,121.956 α/day) | burn | 607.8044 | met | yes | owner remains king | `5CK49hD…VAQRfC` |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 287,669.0333 | 185,019.0202 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | 0 | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 263,892.3719 | 45.13% (1,332.1147 α/day) | burn | 586.7885 | not met | yes | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 225,170.9687 | 52.08% (1,537.4454 α/day) | burn | 566.2555 | met | yes | owner remains king | `5CUu1Qh…oD4dyP` |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 476,839.5953 | 271,497.6088 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | owner remains king | `5HKsviv…5rM28H` |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 271,772.0113 | 296,341.5508 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | owner remains king | `5ELpkVn…e6YVcL` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 326,048.8222 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 2,553.4555 | 66,938.4342 | 50.04% (1,477.1406 α/day) | burn | 572.2859 | not met | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 200,809.595 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,349.6215 | 314,273.6316 | 15.79% (466.0099 α/day) | burn | 673.399 | met | yes | owner remains king | `5Evgh9Q…5dco3P` |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 230,418.7724 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 266,593.8459 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 88,756.7692 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | owner remains king | `5CDZ527…pQfftn` |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 333,146.1973 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DWgkCS…uS9Qad` |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.5272 | 164,678.3588 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,306.1994 | 204,136.8889 | 0.00% (0 α/day) | recycle | 720 | not met | yes | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,183.0921 | 264,261.8053 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 45,906.3868 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 237,990.2803 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 38,442.2187 | 88,287.7979 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 186,566.6496 | 169,358.8296 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | 0 | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 17,661.9794 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 180,077.4781 | 71.96% (2,124.1484 α/day) | burn | 507.5852 | met | yes | owner remains king | `5FCSevL…2DYkXX` |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 218,100.7798 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 221,104.2614 | 79.84% (2,356.757 α/day) | burn | 484.3243 | not met | yes | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 339,576.867 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2916 | 200,648.6491 | 64.44% (1,902.1497 α/day) | burn | 529.785 | not met | yes | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 173,962.9048 | 251,348.0572 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,594.1508 | 68,395.0628 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 232,696.0072 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 115,932.0403 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 274,562.8195 | 0.00% (0.0037 α/day) | burn | 719.9996 | not met | yes | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.4612 | 238,705.5146 | 0.00% (0 α/day) | recycle | 720 | met | yes | owner remains king | `5FTVrwE…ZouKg1` |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 189,147.0764 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 400,034.3038 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 318,411.6508 | 33.29% (982.8731 α/day) | burn | 621.7127 | met | yes | owner remains king | `5DUB7kN…L9Wgpr` |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 240,531.8295 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 187,450.3409 | 64.47% (1,903.0952 α/day) | burn | 529.6905 | met | yes | owner remains king | `5GU4Xkd…1mVXFu` |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 43,756.311 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 22,855.3874 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 387,345.5638 | 264,684.6723 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | owner remains king | `5EF9dnw…FjNdve` |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,073,422.4543 | 308,642.8884 | 50.00% (1,476.0082 α/day) | burn | 572.3992 | met | yes | owner remains king | `5CXLwkK…hA9rhR` |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 349,588.7094 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5ECEsYL…c8jUbn` |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 148,964.6856 | 242,906.0206 | 13.34% (393.7444 α/day) | recycle | 680.6256 | not met | yes | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 296,167.69 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,047.711 | 292,300.5681 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CS3g6n…Ks2xbV` |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 228,869.4863 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 239,791.6646 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DRPoRi…MzcpZV` |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 41,033.2326 | 3.85% (113.6281 α/day) | burn | 708.6372 | not met | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 601,809.3164 | 275,536.018 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CSuegT…4rQbbb` |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 78,647.2982 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,833.1224 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 322,297.6954 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 504,428.3912 | 210,352.9527 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | owner remains king | `5DUuFhF…16k2GU` |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 940,168.7742 | 181,142.6851 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | owner remains king | `5Dnkprj…K8pFhW` |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 270,983.7493 | 63.00% (1,859.7876 α/day) | recycle | 534.0212 | met | yes | owner remains king | `5Dnffft…bXGH7L` |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,610.2123 | 270,706.278 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5G1Qj93…sQzs6g` |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 53,478.6487 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 251,019.9567 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DqALXR…DdohsE` |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 49,203.8694 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 292,726.1722 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5EWwdZB…6HSxoF` |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 157,088.3106 | 91.78% (2,709.2916 α/day) | burn | 449.0708 | not met | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 198,541.5509 | 164,080.3802 | 1.02% (30.211 α/day) | burn | 716.9789 | met | yes | 0 | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 38,203.6769 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 210,166.2559 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 50,479.7578 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 194,779.384 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | 0.00% (0 α/day) | burn | 0 | met | no | owner remains king | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,807.2336 | 80,881.3635 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 318,713.1957 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5HK4vbG…LPgXpY` |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 197,576.5047 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 14,012.7393 | 87.14% (2,572.4749 α/day) | recycle | 462.7525 | met | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 73,527.4792 | 53,891.2961 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 16,477.539 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,285.1423 | 208,375.0244 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DAoDtM…DhfNNK` |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 89,566.8698 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 175,510.5202 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 149,657.6993 | 38,151.4651 | 41.06% (1,212.0436 α/day) | burn | 598.7956 | met | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 61,957.5691 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 588,397.202 | 153,478.7954 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5HWVxik…BtFxvK` |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 14,613.1361 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 328,262.4211 | 113,125.3907 | 0.00% (0 α/day) | burn | 720 | met | no | owner remains king | `5HdSGJg…xTvKfe` |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 134,785.6538 | 90.22% (2,663.3893 α/day) | burn | 453.6611 | not met | yes | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 56,607.4601 | 25.06% (739.8379 α/day) | burn | 646.0162 | not met | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 7,547.7129 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 271,396.3946 | 95.27% (2,812.4852 α/day) | recycle | 438.7515 | not met | yes | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 200,541.3741 | 127,443.4401 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 272,896.8431 | 148,508.5379 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5D7FVSM…ezvyHy` |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 76,343.6581 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 319,525.9894 | 104,888.3634 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,573.332 | 71,198.8627 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | owner remains king | `5DyQkk4…Vd3XUk` |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 172,476.1365 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 241,802.8643 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 85,442.0213 | 80.00% (2,361.606 α/day) | burn | 483.8394 | not met | yes | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 81,416.9156 | 71,955.9775 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 81,438.3132 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 67,001.2404 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 32,210.1407 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 161,681.4316 | 117,793.3953 | 100.00% (2,952.0165 α/day) | recycle | 424.7984 | met | yes | owner remains king | `5DwRMxJ…RozmGE` |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 118,220.6956 | 160,562.8863 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 71,681.2632 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,233.0301 | 220,031.6243 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 153,232.0778 | 60.79% (1,794.6108 α/day) | burn | 540.5389 | met | yes | owner remains king | `5EL9y2g…34ZdNf` |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 100,468.5393 | 20,737.9493 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 154,291.1223 | 41.11% (1,213.5262 α/day) | burn | 598.6474 | met | yes | owner remains king | `5GxsywP…Nba82o` |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 221,108.7659 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5GZPtUj…AEDjmt` |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 110,671.0881 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 122,565.4755 | 50,234.8637 | 30.07% (887.7584 α/day) | burn | 631.2242 | met | no | owner remains king | `5FZD47W…AJ5ggD` |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 165,027.792 | 70.63% (2,085.1129 α/day) | burn | 511.4887 | not met | yes | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5742 | 245,606.9709 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |

## Before upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,484,420.267183304 | 165,012.699896644 | 17,184.489564018 | 94.974823574 | 1,659,729.728281817 | 2,302,128.102899068 | -642,398.374617251 | 27.9045% | **DISCREPANCY >1%** |
| 2 | 3,328,522.356043044 | 186,958.253739906 | 277.903743213 | 163.500851163 | 2,711,313.00299156 | 3,141,122.697708762 | -429,809.694717202 | 13.6833% | **DISCREPANCY >1%** |
| 3 | 2,802,684.4101882 | 0.468119708 | 164,512.004487156 | 163.126595354 | 2,078,448.8879906 | 2,638,008.810985982 | -559,559.922995382 | 21.2114% | **DISCREPANCY >1%** |
| 4 | 3,503,408.028518813 | 13,456.73137153 | 157,410.293819615 | 164.029751182 | 2,811,300.435005442 | 3,332,376.973576486 | -521,076.538571044 | 15.6367% | **DISCREPANCY >1%** |
| 5 | 2,998,762.244375434 | 209,823.537800336 | 3,605.344706609 | 165.281869933 | 1,525,624.786765432 | 2,785,168.079998556 | -1,259,543.293233124 | 45.2232% | **DISCREPANCY >1%** |
| 6 | 2,715,878.911458657 | 23,468.530961558 | 97,097.786802825 | 168.346869983 | 2,451,996.683773013 | 2,595,144.246824291 | -143,147.563051278 | 5.5159% | **DISCREPANCY >1%** |
| 7 | 3,129,922.311512733 | 0 | 23,076.821212896 | 168.075388501 | 3,089,552.962272271 | 3,106,677.414911336 | -17,124.452639065 | 0.5512% | OK |
| 8 | 3,034,740.132079124 | 170,998.084151705 | 68,565.850704494 | 168.086928518 | 2,204,088.317242778 | 2,795,008.110294407 | -590,919.793051629 | 21.1419% | **DISCREPANCY >1%** |
| 9 | 3,941,009.790283152 | 189,930.97794848 | 162,570.352220597 | 169.118320429 | 2,662,702.753243412 | 3,588,339.341793646 | -925,636.588550234 | 25.7956% | **DISCREPANCY >1%** |
| 10 | 3,118,092.600023772 | 223,846.079166223 | 3,919.775094447 | 170.688883129 | 2,413,820.773748008 | 2,890,156.056879973 | -476,335.283131965 | 16.4812% | **DISCREPANCY >1%** |
| 11 | 2,980,595.391593411 | 58,843.162874805 | 129,207.840155779 | 171.661334547 | 1,724,261.701431808 | 2,792,372.72722828 | -1,068,111.025796472 | 38.2510% | **DISCREPANCY >1%** |
| 12 | 3,360,238.048608388 | 222,508.114052081 | 0 | 173.292698018 | 1,856,786.281218517 | 3,137,556.641858289 | -1,280,770.360639772 | 40.8206% | **DISCREPANCY >1%** |
| 13 | 2,419,720.443340406 | 148,967.172896852 | 16,582.21426827 | 173.761479054 | 1,828,953.545731635 | 2,253,997.29469623 | -425,043.748964595 | 18.8573% | **DISCREPANCY >1%** |
| 14 | 3,059,195.25751119 | 220,189.208395156 | 129,813.067943654 | 174.278374959 | 1,767,865.10047261 | 2,709,018.702797421 | -941,153.602324811 | 34.7414% | **DISCREPANCY >1%** |
| 15 | 1,282,846.767151671 | 52,905.700586193 | 218,445.076610075 | 175.096217276 | 716,745.344324384 | 1,011,320.893738127 | -294,575.549413743 | 29.1278% | **DISCREPANCY >1%** |
| 16 | 292,242.056082386 | 106,491.578931276 | 9,125.331581653 | 177.086571526 | 219,971.692133916 | 176,448.058997931 | +43,523.633135985 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,629.887492927 | 35,067.621313474 | 112,040.212358527 | 177.35759601 | 2,591,753.716854974 | 2,878,344.696224916 | -286,590.979369942 | 9.9567% | **DISCREPANCY >1%** |
| 18 | 3,221,511.3581729 | 82,212.573733221 | 184,937.037344576 | 414.502768787 | 2,728,012.390175507 | 2,953,947.244326316 | -225,934.854150809 | 7.6485% | **DISCREPANCY >1%** |
| 19 | 2,545,318.509915175 | 203,827.261478907 | 720.259189593 | 179.424919931 | 1,558,366.405120635 | 2,340,591.564326744 | -782,225.159206109 | 33.4199% | **DISCREPANCY >1%** |
| 20 | 3,151,565.118117668 | 223,846.079145155 | 0 | 181.646865507 | 1,852,324.660431886 | 2,927,537.392107006 | -1,075,212.73167512 | 36.7275% | **DISCREPANCY >1%** |
| 21 | 3,446,331.944539729 | 160,850.042236821 | 12,526.594993624 | 182.583376088 | 2,641,137.2895972 | 3,272,772.723933196 | -631,635.434335996 | 19.2997% | **DISCREPANCY >1%** |
| 22 | 3,424,678.078972077 | 161,827.727614681 | 8,538.815663423 | 183.74205113 | 2,253,922.90864158 | 3,254,127.793642843 | -1,000,204.885001263 | 30.7364% | **DISCREPANCY >1%** |
| 23 | 4,040,887.136284042 | 117,779.002762432 | 257,565.47245039 | 184.24155073 | 2,717,035.06015898 | 3,665,358.41952049 | -948,323.35936151 | 25.8725% | **DISCREPANCY >1%** |
| 24 | 3,641,680.385197894 | 75,925.654771513 | 113,298.120046902 | 185.496276133 | 2,964,647.656840732 | 3,452,271.114103346 | -487,623.457262614 | 14.1247% | **DISCREPANCY >1%** |
| 25 | 4,116,550.160734956 | 223,846.079136167 | 0 | 185.348350615 | 3,262,570.098652547 | 3,892,518.733248174 | -629,948.634595627 | 16.1835% | **DISCREPANCY >1%** |
| 26 | 776,664.346869401 | 73,459.26989387 | 16,231.463886896 | 186.885745834 | 673,306.86442606 | 686,786.727342801 | -13,479.862916741 | 1.9627% | **DISCREPANCY >1%** |
| 27 | 3,217,069.984189999 | 223,846.079203415 | 114.576078423 | 190.326060427 | 2,010,230.893396306 | 2,992,919.002847734 | -982,688.109451428 | 32.8337% | **DISCREPANCY >1%** |
| 28 | 4,652,618.245123336 | 176,806.130994487 | 146,396.6492311 | 188.210187201 | 3,144,789.333292944 | 4,329,227.254710548 | -1,184,437.921417604 | 27.3591% | **DISCREPANCY >1%** |
| 29 | 2,898,478.592659301 | 0 | 0 | 190.726660982 | 2,306,335.831049477 | 2,898,287.865998319 | -591,952.034948842 | 20.4241% | **DISCREPANCY >1%** |
| 30 | 3,382,559.048550954 | 223,846.079129087 | 22,914.692387486 | 191.461152427 | 2,667,110.572279116 | 3,135,606.815881954 | -468,496.243602838 | 14.9411% | **DISCREPANCY >1%** |
| 31 | 1,586,493.687500347 | 223,846.079187058 | 38,096.765184011 | 191.694922343 | 893,531.693731475 | 1,324,359.148206935 | -430,827.45447546 | 32.5310% | **DISCREPANCY >1%** |
| 32 | 3,427,202.832587246 | 0 | 94,980.465258985 | 193.895902604 | 3,333,422.893428039 | 3,332,028.471425657 | +1,394.422002382 | 0.0418% | OK |
| 33 | 2,301,811.930310345 | 89,682.65958267 | 87,385.618697487 | 194.090754841 | 1,649,218.144611554 | 2,124,549.561275347 | -475,331.416663793 | 22.3732% | **DISCREPANCY >1%** |
| 34 | 2,517,725.176498951 | 0 | 133,522.196168079 | 194.353990379 | 2,043,591.427143987 | 2,384,008.626340493 | -340,417.199196506 | 14.2791% | **DISCREPANCY >1%** |
| 35 | 2,988,512.927713479 | 0 | 95,598.20397956 | 197.133908841 | 2,644,675.94827133 | 2,892,717.589825078 | -248,041.641553748 | 8.5746% | **DISCREPANCY >1%** |
| 36 | 627,872.239072002 | 9,298.851890397 | 37,538.851627533 | 198.00348034 | 464,701.809419829 | 580,836.532073732 | -116,134.722653903 | 19.9943% | **DISCREPANCY >1%** |
| 37 | 3,572,537.215572503 | 223,846.079137807 | 0 | 198.373593996 | 2,381,932.136047951 | 3,348,492.7628407 | -966,560.626792749 | 28.8655% | **DISCREPANCY >1%** |
| 38 | 1,473,074.634078787 | 139,486.240803376 | 104,916.592678865 | 843.101524237 | 886,266.551300017 | 1,227,828.699072309 | -341,562.147772292 | 27.8183% | **DISCREPANCY >1%** |
| 39 | 3,166,416.553195886 | 172,663.511264212 | 29,373.416255258 | 199.780998147 | 1,695,429.468557074 | 2,964,179.844678269 | -1,268,750.376121195 | 42.8027% | **DISCREPANCY >1%** |
| 40 | 326,986.733918726 | 74,153.423804429 | 128,034.305600759 | 200.51738521 | 176,741.448835177 | 124,598.487128328 | +52,142.961706849 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,154.611654056 | 204,063.185350324 | 217,217.580368984 | 201.976763429 | 1,802,863.651482052 | 2,553,671.869171319 | -750,808.217689267 | 29.4011% | **DISCREPANCY >1%** |
| 42 | 2,595,024.142096049 | 223,846.079158774 | 0 | 203.919954638 | 2,183,122.943907032 | 2,370,974.142982637 | -187,851.199075605 | 7.9229% | **DISCREPANCY >1%** |
| 43 | 3,052,768.884567396 | 179,562.708609502 | 418.387877525 | 204.01615022 | 2,212,435.691834392 | 2,872,583.771930149 | -660,148.080095757 | 22.9809% | **DISCREPANCY >1%** |
| 44 | 4,012,353.860108263 | 82,938.546710406 | 126,785.781450211 | 204.029336264 | 3,398,459.104068 | 3,802,425.502611382 | -403,966.398543382 | 10.6239% | **DISCREPANCY >1%** |
| 45 | 3,011,733.442172559 | 186,957.988153914 | 0 | 207.877745757 | 2,008,703.116929344 | 2,824,567.576272888 | -815,864.459343544 | 28.8845% | **DISCREPANCY >1%** |
| 46 | 3,510,699.597918791 | 140,033.673137159 | 93,394.806384354 | 207.017693862 | 2,515,548.15997582 | 3,277,064.100703416 | -761,515.940727596 | 23.2377% | **DISCREPANCY >1%** |
| 47 | 1,295,510.895427735 | 221,936.771527767 | 22,924.082606544 | 208.661885487 | 687,673.465762526 | 1,050,441.379407937 | -362,767.913645411 | 34.5348% | **DISCREPANCY >1%** |
| 48 | 3,107,516.04985937 | 0 | 101,664.859193657 | 209.700853087 | 2,328,846.687272452 | 3,005,641.489812626 | -676,794.802540174 | 22.5174% | **DISCREPANCY >1%** |
| 49 | 2,017,856.758301987 | 120,325.749958529 | 164,458.583508921 | 209.470969171 | 1,164,300.147403006 | 1,732,862.953865366 | -568,562.80646236 | 32.8106% | **DISCREPANCY >1%** |
| 50 | 3,236,896.049890369 | 84,285.185243783 | 40,263.969667629 | 210.870419995 | 2,747,775.456897652 | 3,112,136.024558962 | -364,360.56766131 | 11.7077% | **DISCREPANCY >1%** |
| 51 | 3,694,821.93968395 | 105,922.936515629 | 153,197.472195841 | 211.014881549 | 2,389,201.875098131 | 3,435,490.516090931 | -1,046,288.6409928 | 30.4552% | **DISCREPANCY >1%** |
| 52 | 2,952,098.070821844 | 223,846.079128825 | 90.395967424 | 212.761205253 | 1,893,408.234763284 | 2,727,948.834520342 | -834,540.599757058 | 30.5922% | **DISCREPANCY >1%** |
| 53 | 4,587,432.096333947 | 165,100.951333266 | 83,430.199960649 | 213.14106953 | 4,002,412.306866003 | 4,338,687.803970502 | -336,275.497104499 | 7.7506% | **DISCREPANCY >1%** |
| 54 | 3,774,187.691772849 | 104,605.505486405 | 43,761.132345373 | 215.26208619 | 3,186,263.949667802 | 3,625,605.791854881 | -439,341.842187079 | 12.1177% | **DISCREPANCY >1%** |
| 55 | 2,799,318.289393601 | 9,506.992017657 | 94,545.881062638 | 217.13460512 | 2,407,570.599805009 | 2,695,048.281708186 | -287,477.681903177 | 10.6668% | **DISCREPANCY >1%** |
| 56 | 2,646,387.264136623 | 147,253.342830014 | 13,997.922202342 | 216.282503614 | 1,876,658.38095267 | 2,484,919.716600653 | -608,261.335647983 | 24.4781% | **DISCREPANCY >1%** |
| 57 | 825,758.111178675 | 223,846.079159495 | 70,615.680938887 | 217.648963704 | 442,264.988899287 | 531,078.702116589 | -88,813.713217302 | 16.7232% | **DISCREPANCY >1%** |
| 58 | 297,284.290570974 | 161,966.767161337 | 0 | 68.223144246 | 228,682.61780516 | 135,249.300265391 | +93,433.317539769 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,714.959417721 | 71,891.198873536 | 122,883.114116497 | 222.495433129 | 2,648,586.34800194 | 2,998,718.150994559 | -350,131.802992619 | 11.6760% | **DISCREPANCY >1%** |
| 60 | 3,738,919.573624944 | 121,459.892472139 | 40,528.882878666 | 221.011153483 | 3,088,309.198855045 | 3,576,709.787120656 | -488,400.588265611 | 13.6550% | **DISCREPANCY >1%** |
| 61 | 4,368,630.077930071 | 113,406.497793948 | 81,347.359171038 | 221.599154647 | 3,497,985.843054945 | 4,173,654.621810438 | -675,668.778755493 | 16.1889% | **DISCREPANCY >1%** |
| 62 | 2,639,360.550503866 | 1,029.291966503 | 43,101.536241065 | 222.315194562 | 2,431,187.062364878 | 2,595,007.407101736 | -163,820.344736858 | 6.3129% | **DISCREPANCY >1%** |
| 63 | 3,817,242.50683843 | 0 | 147,120.578570039 | 223.616747373 | 2,963,791.083203702 | 3,669,898.311521018 | -706,107.228317316 | 19.2405% | **DISCREPANCY >1%** |
| 64 | 3,340,747.568890309 | 44,721.605785854 | 166,747.209873774 | 224.063767977 | 2,925,100.024232174 | 3,129,054.689462704 | -203,954.66523053 | 6.5180% | **DISCREPANCY >1%** |
| 65 | 3,223,168.02667184 | 204,139.305947923 | 71.722624687 | 227.953625596 | 2,290,879.611105601 | 3,018,729.044473634 | -727,849.433368033 | 24.1111% | **DISCREPANCY >1%** |
| 66 | 3,355,548.767963545 | 58,498.893235066 | 83,262.913449555 | 227.876365697 | 2,399,574.013147158 | 3,213,559.084913227 | -813,985.071766069 | 25.3297% | **DISCREPANCY >1%** |
| 67 | 818,216.005618122 | 94,182.859728691 | 132,264.88633962 | 227.548133098 | 415,753.341684633 | 591,540.711416713 | -175,787.36973208 | 29.7168% | **DISCREPANCY >1%** |
| 68 | 3,606,493.316383071 | 51,820.059551198 | 169,943.631150394 | 228.156427294 | 2,757,678.262310717 | 3,384,501.469254185 | -626,823.206943468 | 18.5203% | **DISCREPANCY >1%** |
| 69 | 1,127,738.983729383 | 223,846.079187092 | 59,604.102841208 | 229.154576668 | 789,692.225967185 | 844,059.647124415 | -54,367.42115723 | 6.4411% | **DISCREPANCY >1%** |
| 70 | 38,314.22374926 | 148.169094182 | 0 | 165.182726706 | 38,149.040995632 | 38,000.871928372 | +148.16906726 | 0.3899% | OK |
| 71 | 4,185,103.677766843 | 96,876.088940082 | 85,705.37638208 | 232.451983472 | 3,225,073.636749908 | 4,002,289.760461209 | -777,216.123711301 | 19.4192% | **DISCREPANCY >1%** |
| 72 | 2,486,786.251902087 | 221,779.667597505 | 0 | 233.603932797 | 2,105,694.740466461 | 2,264,772.980371785 | -159,078.239905324 | 7.0240% | **DISCREPANCY >1%** |
| 73 | 3,280,363.920420528 | 223,846.079132607 | 0 | 234.105894002 | 1,813,676.942884909 | 3,056,283.735393919 | -1,242,606.79250901 | 40.6574% | **DISCREPANCY >1%** |
| 74 | 3,335,904.259227667 | 0 | 94,292.343237338 | 235.356012721 | 2,712,295.874311409 | 3,241,376.559977608 | -529,080.685666199 | 16.3227% | **DISCREPANCY >1%** |
| 75 | 3,508,542.735061204 | 203,423.332505008 | 16,892.075907153 | 235.228181442 | 2,709,395.891317406 | 3,287,992.098467601 | -578,596.207150195 | 17.5972% | **DISCREPANCY >1%** |
| 76 | 1,014,663.381470641 | 179,713.432857498 | 4,053.056546057 | 237.70743015 | 539,215.189087256 | 830,659.184636936 | -291,443.99554968 | 35.0858% | **DISCREPANCY >1%** |
| 77 | 3,211,822.798076511 | 0 | 560,753.334406754 | 237.999075659 | 2,512,507.442349621 | 2,650,831.464594098 | -138,324.022244477 | 5.2181% | **DISCREPANCY >1%** |
| 78 | 650,030.486811965 | 6,499.356268383 | 93,439.420139376 | 239.779702584 | 497,791.007489218 | 549,851.930701622 | -52,060.923212404 | 9.4681% | **DISCREPANCY >1%** |
| 79 | 3,522,164.420528107 | 63,794.223490279 | 150,689.759253291 | 239.600830689 | 2,929,780.461334615 | 3,307,440.836953848 | -377,660.375619233 | 11.4185% | **DISCREPANCY >1%** |
| 80 | 1,805,790.602432742 | 144,923.552045991 | 42,374.70227022 | 240.090831567 | 1,575,661.087864241 | 1,618,252.257284964 | -42,591.169420723 | 2.6319% | **DISCREPANCY >1%** |
| 81 | 2,604,335.392983943 | 20,523.249052955 | 112,246.24217861 | 241.414012912 | 1,643,122.255968379 | 2,471,324.487739466 | -828,202.231771087 | 33.5124% | **DISCREPANCY >1%** |
| 82 | 637,027.829536987 | 1,033.20576559 | 203,656.438410755 | 242.745850256 | 387,646.14878236 | 432,095.439510386 | -44,449.290728026 | 10.2869% | **DISCREPANCY >1%** |
| 83 | 2,655,151.094539082 | 0 | 208,332.711813588 | 243.256934049 | 2,105,495.312152469 | 2,446,575.125791445 | -341,079.813638976 | 13.9411% | **DISCREPANCY >1%** |
| 84 | 573,285.241545722 | 4,045.485421068 | 25,365.155475257 | 243.999999476 | 499,568.25457856 | 543,630.600649921 | -44,062.346071361 | 8.1051% | **DISCREPANCY >1%** |
| 85 | 2,507,827.988089285 | 101,240.455860461 | 63,690.148319291 | 246.014358271 | 1,950,373.413274667 | 2,342,651.369551262 | -392,277.956276595 | 16.7450% | **DISCREPANCY >1%** |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,253.581541561 | 223,698.068303363 | 51,054.043826615 | 248.166257862 | 811,937.38714958 | 1,232,253.303153721 | -420,315.916004141 | 34.1095% | **DISCREPANCY >1%** |
| 88 | 3,458,019.056514442 | 42,432.314973574 | 95,634.787033042 | 248.870198753 | 3,189,628.068539638 | 3,319,703.084309073 | -130,075.015769435 | 3.9182% | **DISCREPANCY >1%** |
| 89 | 2,763,923.852090179 | 184,424.496583798 | 187,748.849811315 | 250.328223118 | 1,978,297.520002656 | 2,391,500.177471948 | -413,202.657469292 | 17.2779% | **DISCREPANCY >1%** |
| 90 | 140,110.393099798 | 116,392.269522858 | 0 | 87.032188471 | 140,001.653399788 | 23,631.091388469 | +116,370.562011319 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,444.859251066 | 160,524.915777216 | 55,172.122770835 | 251.197144681 | 543,685.801296443 | 777,496.623558334 | -233,810.822261891 | 30.0722% | **DISCREPANCY >1%** |
| 92 | 382,873.228663509 | 176,927.850467173 | 41,186.988026446 | 253.178151528 | 165,518.197370141 | 164,505.212018362 | +1,012.985351779 | 0.6157% | OK |
| 93 | 3,180,193.232628307 | 181,921.200099591 | 10,624.828983787 | 253.306172547 | 2,086,451.787267245 | 2,987,393.897372382 | -900,942.110105137 | 30.1581% | **DISCREPANCY >1%** |
| 94 | 1,582,825.5781042 | 216,580.400930509 | 6,977.120150346 | 255.37173957 | 901,263.328629545 | 1,359,012.685283775 | -457,749.35665423 | 33.6824% | **DISCREPANCY >1%** |
| 95 | 2,823,491.04876599 | 223,698.068303101 | 92,584.118277643 | 255.028885667 | 1,759,219.58729414 | 2,506,953.833299579 | -747,734.246005439 | 29.8264% | **DISCREPANCY >1%** |
| 96 | 672,921.803045531 | 130,829.78226522 | 67,499.464576751 | 256.313063549 | 387,490.176423779 | 474,336.243140011 | -86,846.066716232 | 18.3089% | **DISCREPANCY >1%** |
| 97 | 941,686.712507074 | 24,305.834427164 | 251,255.245326798 | 257.065141947 | 624,754.286624672 | 665,868.567611165 | -41,114.280986493 | 6.1745% | **DISCREPANCY >1%** |
| 98 | 2,790,261.348044368 | 176,154.008844017 | 0 | 259.435730692 | 1,537,507.711157861 | 2,613,847.903469659 | -1,076,340.192311798 | 41.1783% | **DISCREPANCY >1%** |
| 99 | 217,527.329419552 | 72,004.601807409 | 0 | 270.650694752 | 145,941.59538324 | 145,252.076917391 | +689.518465849 | 0.4747% | OK |
| 100 | 1,799,787.095590657 | 201,831.869356847 | 8,577.774654887 | 260.477567771 | 1,136,482.892106863 | 1,589,116.974011152 | -452,634.081904289 | 28.4833% | **DISCREPANCY >1%** |
| 101 | 2,301,502.793430326 | 96,709.729814995 | 147,162.212142243 | 261.978266763 | 1,352,453.090541984 | 2,057,368.873206325 | -704,915.782664341 | 34.2629% | **DISCREPANCY >1%** |
| 102 | 843,137.314854854 | 50,526.561897738 | 158,995.005398752 | 262.29564943 | 571,127.582889633 | 633,353.451908934 | -62,225.869019301 | 9.8248% | **DISCREPANCY >1%** |
| 103 | 96,663.397144062 | 99,945.222911754 | 0 | 61.122111784 | 75,398.326108155 | 0 | +75,398.326108155 | ∞% | **DISCREPANCY >1%** |
| 104 | 3,062,961.342942101 | 0 | 8,693.224149186 | 264.763791122 | 2,725,130.208756965 | 3,054,003.355001793 | -328,873.146244828 | 10.7685% | **DISCREPANCY >1%** |
| 105 | 1,922,171.081169756 | 24,337.695348448 | 196,109.240535171 | 265.242109173 | 1,278,846.154813373 | 1,701,458.903176964 | -422,612.748363591 | 24.8382% | **DISCREPANCY >1%** |
| 106 | 2,376,979.760564706 | 144,209.176940372 | 53,273.846844962 | 267.301424908 | 1,487,849.779485208 | 2,179,229.435354464 | -691,379.655869256 | 31.7258% | **DISCREPANCY >1%** |
| 107 | 1,412,299.827524324 | 75,002.822267192 | 259,164.462548071 | 267.014369498 | 768,379.69328733 | 1,077,865.528339563 | -309,485.835052233 | 28.7128% | **DISCREPANCY >1%** |
| 108 | 1,530,513.515126298 | 44,888.690492425 | 38,862.313667517 | 269.752965266 | 1,054,527.794798477 | 1,446,492.75800109 | -391,964.963202613 | 27.0976% | **DISCREPANCY >1%** |
| 109 | 1,408,918.281801709 | 223,698.068310612 | 70,026.821602108 | 270.413033403 | 715,168.920824128 | 1,114,922.978855586 | -399,754.058031458 | 35.8548% | **DISCREPANCY >1%** |
| 110 | 2,492,961.332104349 | 0 | 114,614.763731851 | 270.551432274 | 1,729,173.602489589 | 2,378,076.016940224 | -648,902.414450635 | 27.2868% | **DISCREPANCY >1%** |
| 111 | 3,442,692.711521751 | 192,321.702770461 | 337,717.260844435 | 271.90383672 | 2,421,207.348894766 | 2,912,381.844070135 | -491,174.495175369 | 16.8650% | **DISCREPANCY >1%** |
| 112 | 1,865,760.736981223 | 173,200.851403845 | 85,660.90276259 | 273.726524848 | 858,535.424827937 | 1,606,625.25628994 | -748,089.831462003 | 46.5628% | **DISCREPANCY >1%** |
| 113 | 1,426,472.253958655 | 223,287.331033099 | 24,443.416711791 | 274.823731008 | 723,051.673206953 | 1,178,466.682482757 | -455,415.009275804 | 38.6447% | **DISCREPANCY >1%** |
| 114 | 1,394,583.69129673 | 54,534.060998196 | 206,406.112190315 | 274.314211227 | 818,971.595299437 | 1,133,369.203896992 | -314,397.608597555 | 27.7400% | **DISCREPANCY >1%** |
| 115 | 1,527,489.977031515 | 196,982.31937977 | 0 | 276.241311566 | 674,736.540831756 | 1,330,231.416340179 | -655,494.875508423 | 49.2767% | **DISCREPANCY >1%** |
| 116 | 498,320.033277975 | 129,797.29432009 | 46,438.331747847 | 276.09896356 | 322,456.895400295 | 321,808.308246478 | +648.587153817 | 0.2015% | OK |
| 117 | 1,577,384.159372488 | 0 | 110,042.604483153 | 278.659242901 | 1,182,843.699577966 | 1,467,062.895646434 | -284,219.196068468 | 19.3733% | **DISCREPANCY >1%** |
| 118 | 2,024,046.920306349 | 153,349.352006901 | 100,459.246518578 | 278.25984474 | 1,610,600.660779731 | 1,769,960.06193613 | -159,359.401156399 | 9.0035% | **DISCREPANCY >1%** |
| 119 | 1,493,333.518002894 | 127,462.331317651 | 0 | 280.161251263 | 720,015.01421028 | 1,365,591.02543398 | -645,576.0112237 | 47.2744% | **DISCREPANCY >1%** |
| 120 | 2,546,728.101568921 | 3,986.862247885 | 172,129.469734028 | 280.028677018 | 2,203,582.648794662 | 2,370,331.74090999 | -166,749.092115328 | 7.0348% | **DISCREPANCY >1%** |
| 121 | 2,766,644.954076083 | 211,264.855121109 | 0 | 281.99093558 | 1,535,311.697079252 | 2,555,098.108019394 | -1,019,786.410940142 | 39.9118% | **DISCREPANCY >1%** |
| 122 | 494,829.449887162 | 223,698.06146747 | 41,001.922983965 | 283.07158545 | 212,399.087082206 | 229,846.393850277 | -17,447.306768071 | 7.5908% | **DISCREPANCY >1%** |
| 123 | 1,850,352.345164228 | 117,012.394161995 | 40,622.003819962 | 284.954694255 | 1,545,775.094847816 | 1,692,432.992488016 | -146,657.8976402 | 8.6655% | **DISCREPANCY >1%** |
| 124 | 3,304,780.900114264 | 92,313.326894099 | 196,705.60854964 | 284.202246445 | 2,213,958.401766367 | 3,015,477.76242408 | -801,519.360657713 | 26.5801% | **DISCREPANCY >1%** |
| 125 | 2,325,819.430010415 | 223,698.068375433 | 7,964.547109056 | 286.897169577 | 1,109,743.523235324 | 2,093,869.917356349 | -984,126.394121025 | 47.0003% | **DISCREPANCY >1%** |
| 126 | 1,107,633.577479887 | 101,570.16062343 | 215,477.375953641 | 286.623123336 | 506,364.309783089 | 790,299.41777948 | -283,935.107996391 | 35.9275% | **DISCREPANCY >1%** |
| 127 | 2,802,817.648141101 | 201,728.715858691 | 45.025794905 | 288.321344105 | 1,653,334.165428989 | 2,600,755.5851434 | -947,421.419714411 | 36.4286% | **DISCREPANCY >1%** |
| 128 | 2,676,783.343533691 | 0 | 34,715.84016103 | 289.261683833 | 2,459,320.890947386 | 2,641,778.241688828 | -182,457.350741442 | 6.9066% | **DISCREPANCY >1%** |

## After upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,501,278.748810754 | 826,743.498270167 | 17,184.489564018 | 15.812127615 | 1,659,802.136729299 | 1,657,334.948848954 | +2,467.187880345 | 0.1488% | OK |
| 2 | 3,345,196.964040125 | 635,713.572381259 | 277.903743213 | 180.500851124 | 2,711,313.00299156 | 2,709,024.987064529 | +2,288.015927031 | 0.0844% | OK |
| 3 | 2,819,323.221265905 | 578,475.334942498 | 164,521.430729524 | 180.12659532 | 2,078,448.8879906 | 2,076,146.328998563 | +2,302.558992037 | 0.1109% | OK |
| 4 | 3,520,091.42848237 | 553,023.967435256 | 157,419.162324009 | 181.029751143 | 2,811,300.435005442 | 2,809,467.268971962 | +1,833.16603348 | 0.0652% | OK |
| 5 | 3,015,384.018752628 | 1,488,257.228963462 | 3,606.580808359 | 182.281869898 | 1,525,624.786765432 | 1,523,337.927110909 | +2,286.859654523 | 0.1501% | OK |
| 6 | 2,732,566.299790194 | 185,360.665463109 | 97,097.786802825 | 185.346869944 | 2,451,996.683773013 | 2,449,922.500654316 | +2,074.183118697 | 0.0846% | OK |
| 7 | 3,146,604.465762276 | 36,084.978602376 | 23,076.821212896 | 185.075388466 | 3,089,552.962272271 | 3,087,257.590558538 | +2,295.371713733 | 0.0743% | OK |
| 8 | 3,051,408.469658292 | 780,868.154271859 | 68,575.329537746 | 185.086928483 | 2,204,088.317242778 | 2,201,779.898920204 | +2,308.418322574 | 0.1048% | OK |
| 9 | 3,957,632.438609605 | 1,134,490.320449541 | 162,573.50594857 | 186.118320393 | 2,662,702.753243412 | 2,660,382.493891101 | +2,320.259352311 | 0.0872% | OK |
| 10 | 3,134,758.582622149 | 718,954.77036203 | 3,919.775094447 | 187.68888309 | 2,413,820.773748008 | 2,411,696.348282582 | +2,124.425465426 | 0.0880% | OK |
| 11 | 2,997,230.592939121 | 1,145,934.992162841 | 129,211.156807569 | 188.661334509 | 1,724,261.701431808 | 1,721,895.782634202 | +2,365.918797606 | 0.1374% | OK |
| 12 | 3,376,864.554834653 | 1,522,132.651258694 | 0 | 190.292697982 | 1,856,786.281218517 | 1,854,541.610877977 | +2,244.67034054 | 0.1210% | OK |
| 13 | 2,436,330.737011332 | 593,048.370031793 | 16,582.21426827 | 190.761479017 | 1,828,953.545731635 | 1,826,509.391232252 | +2,444.154499383 | 0.1338% | OK |
| 14 | 3,075,867.112800798 | 1,180,371.405325601 | 129,813.067943654 | 191.278374924 | 1,767,865.10047261 | 1,765,491.361156619 | +2,373.739315991 | 0.1344% | OK |
| 15 | 1,282,869.851056783 | 354,654.991781899 | 218,451.160515187 | 192.09621724 | 716,745.344324384 | 709,571.602542457 | +7,173.741781927 | 1.0109% | **DISCREPANCY >1%** |
| 16 | 292,259.056082386 | 63,578.799840379 | 9,125.331581653 | 194.08657149 | 219,971.692133916 | 219,360.838088864 | +610.854045052 | 0.2784% | OK |
| 17 | 3,042,282.505908094 | 340,475.604612198 | 112,046.182772653 | 194.357595973 | 2,591,753.716854974 | 2,589,566.36092727 | +2,187.355927704 | 0.0844% | OK |
| 18 | 3,238,138.312094939 | 327,278.331731401 | 184,937.037344576 | 431.502768752 | 2,728,012.390175507 | 2,725,491.44025021 | +2,520.949925297 | 0.0924% | OK |
| 19 | 2,561,984.266490204 | 1,005,152.040322882 | 720.640479472 | 196.424919897 | 1,558,366.405120635 | 1,555,915.160767953 | +2,451.244352682 | 0.1575% | OK |
| 20 | 3,168,209.292701726 | 1,318,019.090795353 | 0 | 198.646865472 | 1,852,324.660431886 | 1,849,991.555040901 | +2,333.105390985 | 0.1261% | OK |
| 21 | 3,463,013.564191977 | 811,563.250445903 | 12,526.594993624 | 199.583376052 | 2,641,137.2895972 | 2,638,724.135376398 | +2,413.154220802 | 0.0914% | OK |
| 22 | 3,441,352.668431855 | 1,181,104.166041112 | 8,538.815663423 | 200.742051093 | 2,253,922.90864158 | 2,251,508.944676227 | +2,413.963965353 | 0.1072% | OK |
| 23 | 4,057,554.168276604 | 1,085,012.60808004 | 257,565.47245039 | 201.241550693 | 2,717,035.06015898 | 2,714,774.846195481 | +2,260.213963499 | 0.0832% | OK |
| 24 | 3,658,325.009569796 | 581,611.381123771 | 113,298.120046902 | 202.496276099 | 2,964,647.656840732 | 2,963,213.012123024 | +1,434.644717708 | 0.0484% | OK |
| 25 | 4,133,179.680992624 | 872,691.458855825 | 0 | 202.348350578 | 3,262,570.098652547 | 3,260,285.873786221 | +2,284.224866326 | 0.0700% | OK |
| 26 | 776,681.346869401 | 91,065.541425466 | 16,231.463886896 | 203.885745799 | 673,306.86442606 | 669,180.45581124 | +4,126.40861482 | 0.6166% | OK |
| 27 | 3,233,698.9199479 | 1,225,488.394288307 | 114.576078423 | 207.326060391 | 2,010,230.893396306 | 2,007,888.623520779 | +2,342.269875527 | 0.1166% | OK |
| 28 | 4,669,276.435186276 | 1,380,136.946029568 | 146,403.172997377 | 205.210187163 | 3,144,789.333292944 | 3,142,531.105972168 | +2,258.227320776 | 0.0718% | OK |
| 29 | 2,915,017.076415333 | 610,829.352749762 | 0 | 207.726660946 | 2,306,335.831049477 | 2,303,979.997004625 | +2,355.834044852 | 0.1022% | OK |
| 30 | 3,399,087.251228136 | 710,234.099517005 | 22,914.692387486 | 208.46115238 | 2,667,110.572279116 | 2,665,729.998171265 | +1,380.574107851 | 0.0517% | OK |
| 31 | 1,586,510.687500347 | 660,846.230518782 | 38,096.765184011 | 208.694922308 | 893,531.693731475 | 887,358.996875246 | +6,172.696856229 | 0.6956% | OK |
| 32 | 3,443,861.710863182 | 17,419.272873098 | 94,980.465258985 | 210.895902567 | 3,333,422.893428039 | 3,331,251.076828532 | +2,171.816599507 | 0.0651% | OK |
| 33 | 2,318,396.847785227 | 584,226.582883127 | 87,386.677180377 | 211.090754806 | 1,649,218.144611554 | 1,646,572.496966917 | +2,645.647644637 | 0.1606% | OK |
| 34 | 2,534,367.644986637 | 359,469.273754254 | 133,529.482634268 | 211.353990342 | 2,043,591.427143987 | 2,041,157.534607773 | +2,433.892536214 | 0.1192% | OK |
| 35 | 3,005,102.601215576 | 266,886.343998939 | 95,598.20397956 | 214.133908806 | 2,644,675.94827133 | 2,642,403.919328271 | +2,272.028943059 | 0.0859% | OK |
| 36 | 627,889.239072002 | 131,286.518958231 | 37,538.851627533 | 215.003480306 | 464,701.809419829 | 458,848.865005932 | +5,852.944413897 | 1.2755% | **DISCREPANCY >1%** |
| 37 | 3,589,184.247813866 | 1,209,281.44508295 | 0 | 215.37359396 | 2,381,932.136047951 | 2,379,687.429136956 | +2,244.706910995 | 0.0943% | OK |
| 38 | 1,473,095.476578779 | 485,297.062238848 | 104,920.435178857 | 860.1015242 | 886,266.551300017 | 882,017.877636874 | +4,248.673663143 | 0.4816% | OK |
| 39 | 3,183,045.341273671 | 1,460,083.628868387 | 29,373.416255258 | 216.780998108 | 1,695,429.468557074 | 1,693,371.515151918 | +2,057.953405156 | 0.1215% | OK |
| 40 | 327,003.733918726 | 22,349.634720453 | 128,034.305600759 | 217.517385175 | 176,741.448835177 | 176,402.276212339 | +339.172622838 | 0.1922% | OK |
| 41 | 2,991,736.6415601 | 973,744.279818439 | 217,217.580368984 | 218.976763392 | 1,802,863.651482052 | 1,800,555.804609285 | +2,307.846872767 | 0.1281% | OK |
| 42 | 2,611,650.35504635 | 430,642.557214966 | 0 | 220.9199546 | 2,183,122.943907032 | 2,180,786.877876784 | +2,336.066030248 | 0.1071% | OK |
| 43 | 3,069,340.955743484 | 857,879.953518064 | 418.387877525 | 221.016150183 | 2,212,435.691834392 | 2,210,821.598197712 | +1,614.09363668 | 0.0730% | OK |
| 44 | 4,028,958.147127308 | 506,394.124946002 | 126,795.351723784 | 221.029336228 | 3,398,459.104068 | 3,395,547.641121294 | +2,911.462946706 | 0.0857% | OK |
| 45 | 3,028,372.580160125 | 1,021,886.089454556 | 0 | 224.877745722 | 2,008,703.116929344 | 2,006,261.612959847 | +2,441.503969497 | 0.1216% | OK |
| 46 | 3,527,330.112922602 | 920,454.734537479 | 93,394.806384354 | 224.017693827 | 2,515,548.15997582 | 2,513,256.554306942 | +2,291.605668878 | 0.0911% | OK |
| 47 | 1,295,527.895427735 | 588,653.185177574 | 22,924.082606544 | 225.661885453 | 687,673.465762526 | 683,724.965758164 | +3,948.500004362 | 0.5774% | OK |
| 48 | 3,124,117.392974097 | 695,492.461656953 | 101,664.859193657 | 226.700853051 | 2,328,846.687272452 | 2,326,733.371270436 | +2,113.316002016 | 0.0908% | OK |
| 49 | 2,017,874.54242826 | 694,094.772062343 | 164,459.367635194 | 226.470969136 | 1,164,300.147403006 | 1,159,093.931761587 | +5,206.215641419 | 0.4491% | OK |
| 50 | 3,253,513.627143332 | 467,621.462714429 | 40,263.969667629 | 227.870419958 | 2,747,775.456897652 | 2,745,400.324341316 | +2,375.132556336 | 0.0865% | OK |
| 51 | 3,711,409.13442306 | 1,171,146.945421614 | 153,207.043087243 | 228.014881512 | 2,389,201.875098131 | 2,386,827.131032691 | +2,374.74406544 | 0.0994% | OK |
| 52 | 2,968,723.220758344 | 1,077,162.060889068 | 90.395967424 | 229.761205217 | 1,893,408.234763284 | 1,891,241.002696635 | +2,167.232066649 | 0.1145% | OK |
| 53 | 4,604,025.270594133 | 520,242.333818612 | 83,439.899021052 | 230.141069496 | 4,002,412.306866003 | 4,000,112.896684973 | +2,299.41018103 | 0.0574% | OK |
| 54 | 3,790,802.527472405 | 562,924.886719164 | 43,761.132345373 | 232.262086155 | 3,186,263.949667802 | 3,183,884.246321713 | +2,379.703346089 | 0.0747% | OK |
| 55 | 2,815,957.011788429 | 316,092.836118957 | 94,545.881062638 | 234.134605083 | 2,407,570.599805009 | 2,405,084.160001751 | +2,486.439803258 | 0.1033% | OK |
| 56 | 2,662,987.247577012 | 774,485.915914827 | 13,997.922202342 | 233.282503578 | 1,876,658.38095267 | 1,874,270.126956265 | +2,388.253996405 | 0.1274% | OK |
| 57 | 825,775.111178675 | 317,596.320183395 | 70,615.680938887 | 234.648963669 | 442,264.988899287 | 437,328.461092724 | +4,936.527806563 | 1.1287% | **DISCREPANCY >1%** |
| 58 | 297,301.290570974 | 68,747.416934938 | 0 | 85.22314421 | 228,682.61780516 | 228,468.650491826 | +213.967313334 | 0.0936% | OK |
| 59 | 3,210,669.005940408 | 440,939.168981065 | 122,883.114116497 | 239.495433093 | 2,648,586.34800194 | 2,646,607.227409753 | +1,979.120592187 | 0.0747% | OK |
| 60 | 3,755,916.374664376 | 628,958.607866544 | 40,528.882878666 | 238.011153446 | 3,088,309.198855045 | 3,086,190.87276572 | +2,118.326089325 | 0.0686% | OK |
| 61 | 4,385,609.525455985 | 808,370.14496251 | 81,352.286497032 | 238.599154611 | 3,497,985.843054945 | 3,495,648.494841832 | +2,337.348213113 | 0.0668% | OK |
| 62 | 2,656,341.091437124 | 184,174.273336392 | 43,106.612547856 | 239.315194523 | 2,431,187.062364878 | 2,428,820.890358353 | +2,366.172006525 | 0.0974% | OK |
| 63 | 3,834,241.36527798 | 725,439.396179942 | 147,125.068953644 | 240.616747338 | 2,963,791.083203702 | 2,961,436.283397056 | +2,354.799806646 | 0.0795% | OK |
| 64 | 3,357,695.872437893 | 267,933.276542149 | 166,756.914706905 | 241.063767941 | 2,925,100.024232174 | 2,922,764.617420898 | +2,335.406811276 | 0.0799% | OK |
| 65 | 3,228,117.711423861 | 939,351.125453697 | 71.722624687 | 244.95362556 | 2,290,879.611105601 | 2,288,449.909719917 | +2,429.701385684 | 0.1061% | OK |
| 66 | 3,357,569.286790594 | 876,389.726869251 | 83,262.913449555 | 244.876365661 | 2,399,574.013147158 | 2,397,671.770106127 | +1,902.243041031 | 0.0793% | OK |
| 67 | 818,233.005618122 | 275,635.793013465 | 132,264.88633962 | 244.548133063 | 415,753.341684633 | 410,087.778131974 | +5,665.563552659 | 1.3815% | **DISCREPANCY >1%** |
| 68 | 3,606,519.578980255 | 681,206.505097183 | 169,952.893747578 | 245.156427258 | 2,757,678.262310717 | 2,755,115.023708236 | +2,563.238602481 | 0.0930% | OK |
| 69 | 1,127,755.983729383 | 281,678.898945926 | 59,604.102841208 | 246.154576631 | 789,692.225967185 | 786,226.827365618 | +3,465.398601567 | 0.4407% | OK |
| 70 | 38,331.22374926 | 0 | 0 | 182.18272667 | 38,149.040995632 | 38,149.04102259 | -0.000026958 | 0.0000% | OK |
| 71 | 4,185,120.677766843 | 876,438.347763752 | 85,705.37638208 | 249.451983437 | 3,225,073.636749908 | 3,222,727.501637574 | +2,346.135112334 | 0.0727% | OK |
| 72 | 2,486,803.251902087 | 383,273.725113362 | 0 | 250.603932762 | 2,105,694.740466461 | 2,103,278.922855963 | +2,415.817610498 | 0.1148% | OK |
| 73 | 3,280,380.920420528 | 1,468,954.069047113 | 0 | 251.105893965 | 1,813,676.942884909 | 1,811,175.74547945 | +2,501.197405459 | 0.1380% | OK |
| 74 | 3,335,921.259227667 | 531,791.422968235 | 94,292.343237338 | 252.356012684 | 2,712,295.874311409 | 2,709,585.13700941 | +2,710.737301999 | 0.1000% | OK |
| 75 | 3,508,568.481457029 | 784,604.879643725 | 16,900.822302978 | 252.228181405 | 2,709,395.891317406 | 2,706,810.551328921 | +2,585.339988485 | 0.0955% | OK |
| 76 | 1,014,680.381470641 | 475,840.83810665 | 4,053.056546057 | 254.707430113 | 539,215.189087256 | 534,531.779387821 | +4,683.409699435 | 0.8761% | OK |
| 77 | 3,211,839.798076511 | 140,886.89655137 | 560,753.334406754 | 254.999075623 | 2,512,507.442349621 | 2,509,944.568042764 | +2,562.874306857 | 0.1021% | OK |
| 78 | 650,047.486811965 | 64,569.373140067 | 93,439.420139376 | 256.779702547 | 497,791.007489218 | 491,781.913829975 | +6,009.093659243 | 1.2219% | **DISCREPANCY >1%** |
| 79 | 3,522,185.175371893 | 444,229.939659842 | 150,693.514097077 | 256.600830652 | 2,929,780.461334615 | 2,927,005.120784322 | +2,775.340550293 | 0.0948% | OK |
| 80 | 1,805,807.602432742 | 192,549.794495279 | 42,374.70227022 | 257.09083153 | 1,575,661.087864241 | 1,570,626.014835713 | +5,035.073028528 | 0.3205% | OK |
| 81 | 2,604,356.131084093 | 851,302.349232435 | 112,249.98027876 | 258.414012877 | 1,643,122.255968379 | 1,640,545.387560021 | +2,576.868408358 | 0.1570% | OK |
| 82 | 637,044.829536987 | 51,351.621683119 | 203,656.438410755 | 259.745850219 | 387,646.14878236 | 381,777.023592894 | +5,869.125189466 | 1.5373% | **DISCREPANCY >1%** |
| 83 | 2,655,168.094539082 | 345,172.824104195 | 208,332.711813588 | 260.256934012 | 2,105,495.312152469 | 2,101,402.301687287 | +4,093.010465182 | 0.1947% | OK |
| 84 | 573,302.241545722 | 43,139.508392941 | 25,365.155475257 | 260.999999439 | 499,568.25457856 | 504,536.577678085 | -4,968.323099525 | 0.9847% | OK |
| 85 | 2,507,845.254188665 | 496,360.999970373 | 63,690.414418671 | 263.014358235 | 1,950,373.413274667 | 1,947,530.825441386 | +2,842.587833281 | 0.1459% | OK |
| 86 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,270.581541561 | 647,402.902423667 | 51,054.043826615 | 265.166257826 | 811,937.38714958 | 808,548.469033453 | +3,388.918116127 | 0.4191% | OK |
| 88 | 3,458,036.281203651 | 175,269.312981134 | 95,635.011722251 | 265.870198715 | 3,189,628.068539638 | 3,186,866.086301551 | +2,761.982238087 | 0.0866% | OK |
| 89 | 2,763,940.852090179 | 600,426.954984618 | 187,748.849811315 | 267.32822308 | 1,978,297.520002656 | 1,975,497.719071166 | +2,799.80093149 | 0.1417% | OK |
| 90 | 140,127.393099798 | 0 | 0 | 104.032188435 | 140,001.653399788 | 140,023.360911363 | -21.707511575 | 0.0155% | OK |
| 91 | 993,462.631269244 | 399,376.775480423 | 55,172.894789013 | 268.197144647 | 543,685.801296443 | 538,644.763855161 | +5,041.037441282 | 0.9358% | OK |
| 92 | 382,890.228663509 | 176,927.850467173 | 41,186.988026446 | 270.178151494 | 165,518.197370141 | 164,505.212018396 | +1,012.985351745 | 0.6157% | OK |
| 93 | 3,180,215.51933591 | 1,085,835.159306595 | 10,630.11569139 | 270.306172509 | 2,086,451.787267245 | 2,083,479.938165416 | +2,971.849101829 | 0.1426% | OK |
| 94 | 1,582,842.5781042 | 680,196.760099128 | 6,977.120150346 | 272.371739533 | 901,263.328629545 | 895,396.326115193 | +5,867.002514352 | 0.6552% | OK |
| 95 | 2,823,508.04876599 | 975,818.72867639 | 92,584.118277643 | 272.028885632 | 1,759,219.58729414 | 1,754,833.172926325 | +4,386.414367815 | 0.2499% | OK |
| 96 | 672,938.803045531 | 223,924.687813565 | 67,499.464576751 | 273.313063513 | 387,490.176423779 | 381,241.337591702 | +6,248.838832077 | 1.6390% | **DISCREPANCY >1%** |
| 97 | 941,708.525040323 | 70,872.776437572 | 251,260.057860047 | 274.06514191 | 624,754.286624672 | 619,301.625600794 | +5,452.661023878 | 0.8804% | OK |
| 98 | 2,790,278.348044368 | 1,255,490.393926426 | 0 | 276.435730657 | 1,537,507.711157861 | 1,534,511.518387285 | +2,996.192770576 | 0.1952% | OK |
| 99 | 217,544.329419552 | 71,412.968505913 | 0 | 287.650694716 | 145,941.59538324 | 145,843.710218923 | +97.885164317 | 0.0671% | OK |
| 100 | 1,799,804.095590657 | 659,972.413440104 | 8,577.774654887 | 277.477567732 | 1,136,482.892106863 | 1,130,976.429927934 | +5,506.462178929 | 0.4868% | OK |
| 101 | 2,301,519.793430326 | 806,501.042836516 | 147,162.212142243 | 278.978266727 | 1,352,453.090541984 | 1,347,577.56018484 | +4,875.530357144 | 0.3617% | OK |
| 102 | 843,154.314854854 | 118,084.708059441 | 158,995.005398752 | 279.295649394 | 571,127.582889633 | 565,795.305747267 | +5,332.277142366 | 0.9424% | OK |
| 103 | 96,680.397144062 | 21,203.268320689 | 0 | 54.433265495 | 75,422.014954409 | 75,422.695557878 | -0.680603469 | 0.0009% | OK |
| 104 | 3,062,978.342942101 | 340,321.172598343 | 8,693.224149186 | 281.763791087 | 2,725,130.208756965 | 2,713,682.182403485 | +11,448.02635348 | 0.4218% | OK |
| 105 | 1,922,189.427280623 | 451,644.439901403 | 196,110.586646038 | 282.242109137 | 1,278,846.154813373 | 1,274,152.158624045 | +4,693.996189328 | 0.3684% | OK |
| 106 | 2,376,996.760564706 | 838,637.534343767 | 53,273.846844962 | 284.301424871 | 1,487,849.779485208 | 1,484,801.077951106 | +3,048.701534102 | 0.2053% | OK |
| 107 | 1,412,323.086452273 | 389,715.783508211 | 259,170.72147602 | 284.014369462 | 768,379.69328733 | 763,152.56709858 | +5,227.12618875 | 0.6849% | OK |
| 108 | 1,530,530.515126298 | 442,784.567664372 | 38,862.313667517 | 286.752965229 | 1,054,527.794798477 | 1,048,596.88082918 | +5,930.913969297 | 0.5656% | OK |
| 109 | 1,408,935.281801709 | 626,919.832814457 | 70,026.821602108 | 287.413033366 | 715,168.920824128 | 711,701.214351778 | +3,467.70647235 | 0.4872% | OK |
| 110 | 2,492,979.820435386 | 653,602.202903777 | 114,616.252062888 | 287.551432239 | 1,729,173.602489589 | 1,724,473.814036482 | +4,699.788453107 | 0.2725% | OK |
| 111 | 3,442,709.711521751 | 686,963.807461569 | 337,717.260844435 | 288.903836685 | 2,421,207.348894766 | 2,417,739.739379062 | +3,467.609515704 | 0.1434% | OK |
| 112 | 1,865,777.736981223 | 925,696.620748774 | 85,660.90276259 | 290.726524813 | 858,535.424827937 | 854,129.486945046 | +4,405.937882891 | 0.5158% | OK |
| 113 | 1,426,489.253958655 | 682,486.06189204 | 24,443.416711791 | 291.823730971 | 723,051.673206953 | 719,267.951623853 | +3,783.7215831 | 0.5260% | OK |
| 114 | 1,394,604.402315899 | 373,811.447473431 | 206,409.823209484 | 291.31421119 | 818,971.595299437 | 814,091.817421794 | +4,879.777877643 | 0.5994% | OK |
| 115 | 1,527,506.977031515 | 857,494.572895518 | 0 | 293.24131153 | 674,736.540831756 | 669,719.162824467 | +5,017.378007289 | 0.7491% | OK |
| 116 | 498,337.033277975 | 129,797.29432009 | 46,438.331747847 | 293.098963523 | 322,456.895400295 | 321,808.308246515 | +648.58715378 | 0.2015% | OK |
| 117 | 1,577,401.159372488 | 289,424.602021989 | 110,042.604483153 | 295.659242863 | 1,182,843.699577966 | 1,177,638.293624483 | +5,205.405953483 | 0.4420% | OK |
| 118 | 2,024,063.920306349 | 317,975.810452995 | 100,459.246518578 | 295.259844704 | 1,610,600.660779731 | 1,605,333.603490072 | +5,267.057289659 | 0.3280% | OK |
| 119 | 1,493,350.518002894 | 776,537.885713869 | 0 | 297.161251227 | 720,015.01421028 | 716,515.471037798 | +3,499.543172482 | 0.4884% | OK |
| 120 | 2,546,753.900214508 | 174,299.388959302 | 172,138.268379615 | 297.02867698 | 2,203,582.648794662 | 2,200,019.214198611 | +3,563.434596051 | 0.1619% | OK |
| 121 | 2,766,661.954076083 | 1,234,341.176086707 | 0 | 298.990935544 | 1,535,311.697079252 | 1,532,021.787053832 | +3,289.91002542 | 0.2147% | OK |
| 122 | 494,846.449887162 | 246,465.034375573 | 41,001.922983965 | 300.071585414 | 212,399.087082206 | 207,079.42094221 | +5,319.666139996 | 2.5689% | **DISCREPANCY >1%** |
| 123 | 1,850,369.345164228 | 266,836.118126159 | 40,622.003819962 | 301.954694218 | 1,545,775.094847816 | 1,542,609.268523889 | +3,165.826323927 | 0.2052% | OK |
| 124 | 3,304,803.536251671 | 897,004.632666029 | 196,711.244687047 | 301.202246409 | 2,213,958.401766367 | 2,210,786.456652186 | +3,171.945114181 | 0.1434% | OK |
| 125 | 2,325,836.430010415 | 1,211,161.002135291 | 7,964.547109056 | 303.897169539 | 1,109,743.523235324 | 1,106,406.983596529 | +3,336.539638795 | 0.3015% | OK |
| 126 | 1,107,650.577479887 | 389,824.564372371 | 215,477.375953641 | 303.623123299 | 506,364.309783089 | 502,045.014030576 | +4,319.295752513 | 0.8603% | OK |
| 127 | 2,802,834.648141101 | 1,152,511.702574029 | 45.025794905 | 305.321344069 | 1,653,334.165428989 | 1,649,972.598428098 | +3,361.567000891 | 0.2037% | OK |
| 128 | 2,676,800.343533691 | 186,014.794503201 | 34,715.84016103 | 306.261683797 | 2,459,320.890947386 | 2,455,763.447185663 | +3,557.443761723 | 0.1448% | OK |

## Discrepancies greater than 1%

| Phase | Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| before | 1 | 2,484,420.267183304 | 165,012.699896644 | 17,184.489564018 | 94.974823574 | 1,659,729.728281817 | 2,302,128.102899068 | -642,398.374617251 | 27.9045% | **DISCREPANCY >1%** |
| before | 2 | 3,328,522.356043044 | 186,958.253739906 | 277.903743213 | 163.500851163 | 2,711,313.00299156 | 3,141,122.697708762 | -429,809.694717202 | 13.6833% | **DISCREPANCY >1%** |
| before | 3 | 2,802,684.4101882 | 0.468119708 | 164,512.004487156 | 163.126595354 | 2,078,448.8879906 | 2,638,008.810985982 | -559,559.922995382 | 21.2114% | **DISCREPANCY >1%** |
| before | 4 | 3,503,408.028518813 | 13,456.73137153 | 157,410.293819615 | 164.029751182 | 2,811,300.435005442 | 3,332,376.973576486 | -521,076.538571044 | 15.6367% | **DISCREPANCY >1%** |
| before | 5 | 2,998,762.244375434 | 209,823.537800336 | 3,605.344706609 | 165.281869933 | 1,525,624.786765432 | 2,785,168.079998556 | -1,259,543.293233124 | 45.2232% | **DISCREPANCY >1%** |
| before | 6 | 2,715,878.911458657 | 23,468.530961558 | 97,097.786802825 | 168.346869983 | 2,451,996.683773013 | 2,595,144.246824291 | -143,147.563051278 | 5.5159% | **DISCREPANCY >1%** |
| before | 8 | 3,034,740.132079124 | 170,998.084151705 | 68,565.850704494 | 168.086928518 | 2,204,088.317242778 | 2,795,008.110294407 | -590,919.793051629 | 21.1419% | **DISCREPANCY >1%** |
| before | 9 | 3,941,009.790283152 | 189,930.97794848 | 162,570.352220597 | 169.118320429 | 2,662,702.753243412 | 3,588,339.341793646 | -925,636.588550234 | 25.7956% | **DISCREPANCY >1%** |
| before | 10 | 3,118,092.600023772 | 223,846.079166223 | 3,919.775094447 | 170.688883129 | 2,413,820.773748008 | 2,890,156.056879973 | -476,335.283131965 | 16.4812% | **DISCREPANCY >1%** |
| before | 11 | 2,980,595.391593411 | 58,843.162874805 | 129,207.840155779 | 171.661334547 | 1,724,261.701431808 | 2,792,372.72722828 | -1,068,111.025796472 | 38.2510% | **DISCREPANCY >1%** |
| before | 12 | 3,360,238.048608388 | 222,508.114052081 | 0 | 173.292698018 | 1,856,786.281218517 | 3,137,556.641858289 | -1,280,770.360639772 | 40.8206% | **DISCREPANCY >1%** |
| before | 13 | 2,419,720.443340406 | 148,967.172896852 | 16,582.21426827 | 173.761479054 | 1,828,953.545731635 | 2,253,997.29469623 | -425,043.748964595 | 18.8573% | **DISCREPANCY >1%** |
| before | 14 | 3,059,195.25751119 | 220,189.208395156 | 129,813.067943654 | 174.278374959 | 1,767,865.10047261 | 2,709,018.702797421 | -941,153.602324811 | 34.7414% | **DISCREPANCY >1%** |
| before | 15 | 1,282,846.767151671 | 52,905.700586193 | 218,445.076610075 | 175.096217276 | 716,745.344324384 | 1,011,320.893738127 | -294,575.549413743 | 29.1278% | **DISCREPANCY >1%** |
| before | 16 | 292,242.056082386 | 106,491.578931276 | 9,125.331581653 | 177.086571526 | 219,971.692133916 | 176,448.058997931 | +43,523.633135985 | 24.6665% | **DISCREPANCY >1%** |
| before | 17 | 3,025,629.887492927 | 35,067.621313474 | 112,040.212358527 | 177.35759601 | 2,591,753.716854974 | 2,878,344.696224916 | -286,590.979369942 | 9.9567% | **DISCREPANCY >1%** |
| before | 18 | 3,221,511.3581729 | 82,212.573733221 | 184,937.037344576 | 414.502768787 | 2,728,012.390175507 | 2,953,947.244326316 | -225,934.854150809 | 7.6485% | **DISCREPANCY >1%** |
| before | 19 | 2,545,318.509915175 | 203,827.261478907 | 720.259189593 | 179.424919931 | 1,558,366.405120635 | 2,340,591.564326744 | -782,225.159206109 | 33.4199% | **DISCREPANCY >1%** |
| before | 20 | 3,151,565.118117668 | 223,846.079145155 | 0 | 181.646865507 | 1,852,324.660431886 | 2,927,537.392107006 | -1,075,212.73167512 | 36.7275% | **DISCREPANCY >1%** |
| before | 21 | 3,446,331.944539729 | 160,850.042236821 | 12,526.594993624 | 182.583376088 | 2,641,137.2895972 | 3,272,772.723933196 | -631,635.434335996 | 19.2997% | **DISCREPANCY >1%** |
| before | 22 | 3,424,678.078972077 | 161,827.727614681 | 8,538.815663423 | 183.74205113 | 2,253,922.90864158 | 3,254,127.793642843 | -1,000,204.885001263 | 30.7364% | **DISCREPANCY >1%** |
| before | 23 | 4,040,887.136284042 | 117,779.002762432 | 257,565.47245039 | 184.24155073 | 2,717,035.06015898 | 3,665,358.41952049 | -948,323.35936151 | 25.8725% | **DISCREPANCY >1%** |
| before | 24 | 3,641,680.385197894 | 75,925.654771513 | 113,298.120046902 | 185.496276133 | 2,964,647.656840732 | 3,452,271.114103346 | -487,623.457262614 | 14.1247% | **DISCREPANCY >1%** |
| before | 25 | 4,116,550.160734956 | 223,846.079136167 | 0 | 185.348350615 | 3,262,570.098652547 | 3,892,518.733248174 | -629,948.634595627 | 16.1835% | **DISCREPANCY >1%** |
| before | 26 | 776,664.346869401 | 73,459.26989387 | 16,231.463886896 | 186.885745834 | 673,306.86442606 | 686,786.727342801 | -13,479.862916741 | 1.9627% | **DISCREPANCY >1%** |
| before | 27 | 3,217,069.984189999 | 223,846.079203415 | 114.576078423 | 190.326060427 | 2,010,230.893396306 | 2,992,919.002847734 | -982,688.109451428 | 32.8337% | **DISCREPANCY >1%** |
| before | 28 | 4,652,618.245123336 | 176,806.130994487 | 146,396.6492311 | 188.210187201 | 3,144,789.333292944 | 4,329,227.254710548 | -1,184,437.921417604 | 27.3591% | **DISCREPANCY >1%** |
| before | 29 | 2,898,478.592659301 | 0 | 0 | 190.726660982 | 2,306,335.831049477 | 2,898,287.865998319 | -591,952.034948842 | 20.4241% | **DISCREPANCY >1%** |
| before | 30 | 3,382,559.048550954 | 223,846.079129087 | 22,914.692387486 | 191.461152427 | 2,667,110.572279116 | 3,135,606.815881954 | -468,496.243602838 | 14.9411% | **DISCREPANCY >1%** |
| before | 31 | 1,586,493.687500347 | 223,846.079187058 | 38,096.765184011 | 191.694922343 | 893,531.693731475 | 1,324,359.148206935 | -430,827.45447546 | 32.5310% | **DISCREPANCY >1%** |
| before | 33 | 2,301,811.930310345 | 89,682.65958267 | 87,385.618697487 | 194.090754841 | 1,649,218.144611554 | 2,124,549.561275347 | -475,331.416663793 | 22.3732% | **DISCREPANCY >1%** |
| before | 34 | 2,517,725.176498951 | 0 | 133,522.196168079 | 194.353990379 | 2,043,591.427143987 | 2,384,008.626340493 | -340,417.199196506 | 14.2791% | **DISCREPANCY >1%** |
| before | 35 | 2,988,512.927713479 | 0 | 95,598.20397956 | 197.133908841 | 2,644,675.94827133 | 2,892,717.589825078 | -248,041.641553748 | 8.5746% | **DISCREPANCY >1%** |
| before | 36 | 627,872.239072002 | 9,298.851890397 | 37,538.851627533 | 198.00348034 | 464,701.809419829 | 580,836.532073732 | -116,134.722653903 | 19.9943% | **DISCREPANCY >1%** |
| before | 37 | 3,572,537.215572503 | 223,846.079137807 | 0 | 198.373593996 | 2,381,932.136047951 | 3,348,492.7628407 | -966,560.626792749 | 28.8655% | **DISCREPANCY >1%** |
| before | 38 | 1,473,074.634078787 | 139,486.240803376 | 104,916.592678865 | 843.101524237 | 886,266.551300017 | 1,227,828.699072309 | -341,562.147772292 | 27.8183% | **DISCREPANCY >1%** |
| before | 39 | 3,166,416.553195886 | 172,663.511264212 | 29,373.416255258 | 199.780998147 | 1,695,429.468557074 | 2,964,179.844678269 | -1,268,750.376121195 | 42.8027% | **DISCREPANCY >1%** |
| before | 40 | 326,986.733918726 | 74,153.423804429 | 128,034.305600759 | 200.51738521 | 176,741.448835177 | 124,598.487128328 | +52,142.961706849 | 41.8487% | **DISCREPANCY >1%** |
| before | 41 | 2,975,154.611654056 | 204,063.185350324 | 217,217.580368984 | 201.976763429 | 1,802,863.651482052 | 2,553,671.869171319 | -750,808.217689267 | 29.4011% | **DISCREPANCY >1%** |
| before | 42 | 2,595,024.142096049 | 223,846.079158774 | 0 | 203.919954638 | 2,183,122.943907032 | 2,370,974.142982637 | -187,851.199075605 | 7.9229% | **DISCREPANCY >1%** |
| before | 43 | 3,052,768.884567396 | 179,562.708609502 | 418.387877525 | 204.01615022 | 2,212,435.691834392 | 2,872,583.771930149 | -660,148.080095757 | 22.9809% | **DISCREPANCY >1%** |
| before | 44 | 4,012,353.860108263 | 82,938.546710406 | 126,785.781450211 | 204.029336264 | 3,398,459.104068 | 3,802,425.502611382 | -403,966.398543382 | 10.6239% | **DISCREPANCY >1%** |
| before | 45 | 3,011,733.442172559 | 186,957.988153914 | 0 | 207.877745757 | 2,008,703.116929344 | 2,824,567.576272888 | -815,864.459343544 | 28.8845% | **DISCREPANCY >1%** |
| before | 46 | 3,510,699.597918791 | 140,033.673137159 | 93,394.806384354 | 207.017693862 | 2,515,548.15997582 | 3,277,064.100703416 | -761,515.940727596 | 23.2377% | **DISCREPANCY >1%** |
| before | 47 | 1,295,510.895427735 | 221,936.771527767 | 22,924.082606544 | 208.661885487 | 687,673.465762526 | 1,050,441.379407937 | -362,767.913645411 | 34.5348% | **DISCREPANCY >1%** |
| before | 48 | 3,107,516.04985937 | 0 | 101,664.859193657 | 209.700853087 | 2,328,846.687272452 | 3,005,641.489812626 | -676,794.802540174 | 22.5174% | **DISCREPANCY >1%** |
| before | 49 | 2,017,856.758301987 | 120,325.749958529 | 164,458.583508921 | 209.470969171 | 1,164,300.147403006 | 1,732,862.953865366 | -568,562.80646236 | 32.8106% | **DISCREPANCY >1%** |
| before | 50 | 3,236,896.049890369 | 84,285.185243783 | 40,263.969667629 | 210.870419995 | 2,747,775.456897652 | 3,112,136.024558962 | -364,360.56766131 | 11.7077% | **DISCREPANCY >1%** |
| before | 51 | 3,694,821.93968395 | 105,922.936515629 | 153,197.472195841 | 211.014881549 | 2,389,201.875098131 | 3,435,490.516090931 | -1,046,288.6409928 | 30.4552% | **DISCREPANCY >1%** |
| before | 52 | 2,952,098.070821844 | 223,846.079128825 | 90.395967424 | 212.761205253 | 1,893,408.234763284 | 2,727,948.834520342 | -834,540.599757058 | 30.5922% | **DISCREPANCY >1%** |
| before | 53 | 4,587,432.096333947 | 165,100.951333266 | 83,430.199960649 | 213.14106953 | 4,002,412.306866003 | 4,338,687.803970502 | -336,275.497104499 | 7.7506% | **DISCREPANCY >1%** |
| before | 54 | 3,774,187.691772849 | 104,605.505486405 | 43,761.132345373 | 215.26208619 | 3,186,263.949667802 | 3,625,605.791854881 | -439,341.842187079 | 12.1177% | **DISCREPANCY >1%** |
| before | 55 | 2,799,318.289393601 | 9,506.992017657 | 94,545.881062638 | 217.13460512 | 2,407,570.599805009 | 2,695,048.281708186 | -287,477.681903177 | 10.6668% | **DISCREPANCY >1%** |
| before | 56 | 2,646,387.264136623 | 147,253.342830014 | 13,997.922202342 | 216.282503614 | 1,876,658.38095267 | 2,484,919.716600653 | -608,261.335647983 | 24.4781% | **DISCREPANCY >1%** |
| before | 57 | 825,758.111178675 | 223,846.079159495 | 70,615.680938887 | 217.648963704 | 442,264.988899287 | 531,078.702116589 | -88,813.713217302 | 16.7232% | **DISCREPANCY >1%** |
| before | 58 | 297,284.290570974 | 161,966.767161337 | 0 | 68.223144246 | 228,682.61780516 | 135,249.300265391 | +93,433.317539769 | 69.0822% | **DISCREPANCY >1%** |
| before | 59 | 3,193,714.959417721 | 71,891.198873536 | 122,883.114116497 | 222.495433129 | 2,648,586.34800194 | 2,998,718.150994559 | -350,131.802992619 | 11.6760% | **DISCREPANCY >1%** |
| before | 60 | 3,738,919.573624944 | 121,459.892472139 | 40,528.882878666 | 221.011153483 | 3,088,309.198855045 | 3,576,709.787120656 | -488,400.588265611 | 13.6550% | **DISCREPANCY >1%** |
| before | 61 | 4,368,630.077930071 | 113,406.497793948 | 81,347.359171038 | 221.599154647 | 3,497,985.843054945 | 4,173,654.621810438 | -675,668.778755493 | 16.1889% | **DISCREPANCY >1%** |
| before | 62 | 2,639,360.550503866 | 1,029.291966503 | 43,101.536241065 | 222.315194562 | 2,431,187.062364878 | 2,595,007.407101736 | -163,820.344736858 | 6.3129% | **DISCREPANCY >1%** |
| before | 63 | 3,817,242.50683843 | 0 | 147,120.578570039 | 223.616747373 | 2,963,791.083203702 | 3,669,898.311521018 | -706,107.228317316 | 19.2405% | **DISCREPANCY >1%** |
| before | 64 | 3,340,747.568890309 | 44,721.605785854 | 166,747.209873774 | 224.063767977 | 2,925,100.024232174 | 3,129,054.689462704 | -203,954.66523053 | 6.5180% | **DISCREPANCY >1%** |
| before | 65 | 3,223,168.02667184 | 204,139.305947923 | 71.722624687 | 227.953625596 | 2,290,879.611105601 | 3,018,729.044473634 | -727,849.433368033 | 24.1111% | **DISCREPANCY >1%** |
| before | 66 | 3,355,548.767963545 | 58,498.893235066 | 83,262.913449555 | 227.876365697 | 2,399,574.013147158 | 3,213,559.084913227 | -813,985.071766069 | 25.3297% | **DISCREPANCY >1%** |
| before | 67 | 818,216.005618122 | 94,182.859728691 | 132,264.88633962 | 227.548133098 | 415,753.341684633 | 591,540.711416713 | -175,787.36973208 | 29.7168% | **DISCREPANCY >1%** |
| before | 68 | 3,606,493.316383071 | 51,820.059551198 | 169,943.631150394 | 228.156427294 | 2,757,678.262310717 | 3,384,501.469254185 | -626,823.206943468 | 18.5203% | **DISCREPANCY >1%** |
| before | 69 | 1,127,738.983729383 | 223,846.079187092 | 59,604.102841208 | 229.154576668 | 789,692.225967185 | 844,059.647124415 | -54,367.42115723 | 6.4411% | **DISCREPANCY >1%** |
| before | 71 | 4,185,103.677766843 | 96,876.088940082 | 85,705.37638208 | 232.451983472 | 3,225,073.636749908 | 4,002,289.760461209 | -777,216.123711301 | 19.4192% | **DISCREPANCY >1%** |
| before | 72 | 2,486,786.251902087 | 221,779.667597505 | 0 | 233.603932797 | 2,105,694.740466461 | 2,264,772.980371785 | -159,078.239905324 | 7.0240% | **DISCREPANCY >1%** |
| before | 73 | 3,280,363.920420528 | 223,846.079132607 | 0 | 234.105894002 | 1,813,676.942884909 | 3,056,283.735393919 | -1,242,606.79250901 | 40.6574% | **DISCREPANCY >1%** |
| before | 74 | 3,335,904.259227667 | 0 | 94,292.343237338 | 235.356012721 | 2,712,295.874311409 | 3,241,376.559977608 | -529,080.685666199 | 16.3227% | **DISCREPANCY >1%** |
| before | 75 | 3,508,542.735061204 | 203,423.332505008 | 16,892.075907153 | 235.228181442 | 2,709,395.891317406 | 3,287,992.098467601 | -578,596.207150195 | 17.5972% | **DISCREPANCY >1%** |
| before | 76 | 1,014,663.381470641 | 179,713.432857498 | 4,053.056546057 | 237.70743015 | 539,215.189087256 | 830,659.184636936 | -291,443.99554968 | 35.0858% | **DISCREPANCY >1%** |
| before | 77 | 3,211,822.798076511 | 0 | 560,753.334406754 | 237.999075659 | 2,512,507.442349621 | 2,650,831.464594098 | -138,324.022244477 | 5.2181% | **DISCREPANCY >1%** |
| before | 78 | 650,030.486811965 | 6,499.356268383 | 93,439.420139376 | 239.779702584 | 497,791.007489218 | 549,851.930701622 | -52,060.923212404 | 9.4681% | **DISCREPANCY >1%** |
| before | 79 | 3,522,164.420528107 | 63,794.223490279 | 150,689.759253291 | 239.600830689 | 2,929,780.461334615 | 3,307,440.836953848 | -377,660.375619233 | 11.4185% | **DISCREPANCY >1%** |
| before | 80 | 1,805,790.602432742 | 144,923.552045991 | 42,374.70227022 | 240.090831567 | 1,575,661.087864241 | 1,618,252.257284964 | -42,591.169420723 | 2.6319% | **DISCREPANCY >1%** |
| before | 81 | 2,604,335.392983943 | 20,523.249052955 | 112,246.24217861 | 241.414012912 | 1,643,122.255968379 | 2,471,324.487739466 | -828,202.231771087 | 33.5124% | **DISCREPANCY >1%** |
| before | 82 | 637,027.829536987 | 1,033.20576559 | 203,656.438410755 | 242.745850256 | 387,646.14878236 | 432,095.439510386 | -44,449.290728026 | 10.2869% | **DISCREPANCY >1%** |
| before | 83 | 2,655,151.094539082 | 0 | 208,332.711813588 | 243.256934049 | 2,105,495.312152469 | 2,446,575.125791445 | -341,079.813638976 | 13.9411% | **DISCREPANCY >1%** |
| before | 84 | 573,285.241545722 | 4,045.485421068 | 25,365.155475257 | 243.999999476 | 499,568.25457856 | 543,630.600649921 | -44,062.346071361 | 8.1051% | **DISCREPANCY >1%** |
| before | 85 | 2,507,827.988089285 | 101,240.455860461 | 63,690.148319291 | 246.014358271 | 1,950,373.413274667 | 2,342,651.369551262 | -392,277.956276595 | 16.7450% | **DISCREPANCY >1%** |
| before | 87 | 1,507,253.581541561 | 223,698.068303363 | 51,054.043826615 | 248.166257862 | 811,937.38714958 | 1,232,253.303153721 | -420,315.916004141 | 34.1095% | **DISCREPANCY >1%** |
| before | 88 | 3,458,019.056514442 | 42,432.314973574 | 95,634.787033042 | 248.870198753 | 3,189,628.068539638 | 3,319,703.084309073 | -130,075.015769435 | 3.9182% | **DISCREPANCY >1%** |
| before | 89 | 2,763,923.852090179 | 184,424.496583798 | 187,748.849811315 | 250.328223118 | 1,978,297.520002656 | 2,391,500.177471948 | -413,202.657469292 | 17.2779% | **DISCREPANCY >1%** |
| before | 90 | 140,110.393099798 | 116,392.269522858 | 0 | 87.032188471 | 140,001.653399788 | 23,631.091388469 | +116,370.562011319 | 492.4468% | **DISCREPANCY >1%** |
| before | 91 | 993,444.859251066 | 160,524.915777216 | 55,172.122770835 | 251.197144681 | 543,685.801296443 | 777,496.623558334 | -233,810.822261891 | 30.0722% | **DISCREPANCY >1%** |
| before | 93 | 3,180,193.232628307 | 181,921.200099591 | 10,624.828983787 | 253.306172547 | 2,086,451.787267245 | 2,987,393.897372382 | -900,942.110105137 | 30.1581% | **DISCREPANCY >1%** |
| before | 94 | 1,582,825.5781042 | 216,580.400930509 | 6,977.120150346 | 255.37173957 | 901,263.328629545 | 1,359,012.685283775 | -457,749.35665423 | 33.6824% | **DISCREPANCY >1%** |
| before | 95 | 2,823,491.04876599 | 223,698.068303101 | 92,584.118277643 | 255.028885667 | 1,759,219.58729414 | 2,506,953.833299579 | -747,734.246005439 | 29.8264% | **DISCREPANCY >1%** |
| before | 96 | 672,921.803045531 | 130,829.78226522 | 67,499.464576751 | 256.313063549 | 387,490.176423779 | 474,336.243140011 | -86,846.066716232 | 18.3089% | **DISCREPANCY >1%** |
| before | 97 | 941,686.712507074 | 24,305.834427164 | 251,255.245326798 | 257.065141947 | 624,754.286624672 | 665,868.567611165 | -41,114.280986493 | 6.1745% | **DISCREPANCY >1%** |
| before | 98 | 2,790,261.348044368 | 176,154.008844017 | 0 | 259.435730692 | 1,537,507.711157861 | 2,613,847.903469659 | -1,076,340.192311798 | 41.1783% | **DISCREPANCY >1%** |
| before | 100 | 1,799,787.095590657 | 201,831.869356847 | 8,577.774654887 | 260.477567771 | 1,136,482.892106863 | 1,589,116.974011152 | -452,634.081904289 | 28.4833% | **DISCREPANCY >1%** |
| before | 101 | 2,301,502.793430326 | 96,709.729814995 | 147,162.212142243 | 261.978266763 | 1,352,453.090541984 | 2,057,368.873206325 | -704,915.782664341 | 34.2629% | **DISCREPANCY >1%** |
| before | 102 | 843,137.314854854 | 50,526.561897738 | 158,995.005398752 | 262.29564943 | 571,127.582889633 | 633,353.451908934 | -62,225.869019301 | 9.8248% | **DISCREPANCY >1%** |
| before | 103 | 96,663.397144062 | 99,945.222911754 | 0 | 61.122111784 | 75,398.326108155 | 0 | +75,398.326108155 | ∞% | **DISCREPANCY >1%** |
| before | 104 | 3,062,961.342942101 | 0 | 8,693.224149186 | 264.763791122 | 2,725,130.208756965 | 3,054,003.355001793 | -328,873.146244828 | 10.7685% | **DISCREPANCY >1%** |
| before | 105 | 1,922,171.081169756 | 24,337.695348448 | 196,109.240535171 | 265.242109173 | 1,278,846.154813373 | 1,701,458.903176964 | -422,612.748363591 | 24.8382% | **DISCREPANCY >1%** |
| before | 106 | 2,376,979.760564706 | 144,209.176940372 | 53,273.846844962 | 267.301424908 | 1,487,849.779485208 | 2,179,229.435354464 | -691,379.655869256 | 31.7258% | **DISCREPANCY >1%** |
| before | 107 | 1,412,299.827524324 | 75,002.822267192 | 259,164.462548071 | 267.014369498 | 768,379.69328733 | 1,077,865.528339563 | -309,485.835052233 | 28.7128% | **DISCREPANCY >1%** |
| before | 108 | 1,530,513.515126298 | 44,888.690492425 | 38,862.313667517 | 269.752965266 | 1,054,527.794798477 | 1,446,492.75800109 | -391,964.963202613 | 27.0976% | **DISCREPANCY >1%** |
| before | 109 | 1,408,918.281801709 | 223,698.068310612 | 70,026.821602108 | 270.413033403 | 715,168.920824128 | 1,114,922.978855586 | -399,754.058031458 | 35.8548% | **DISCREPANCY >1%** |
| before | 110 | 2,492,961.332104349 | 0 | 114,614.763731851 | 270.551432274 | 1,729,173.602489589 | 2,378,076.016940224 | -648,902.414450635 | 27.2868% | **DISCREPANCY >1%** |
| before | 111 | 3,442,692.711521751 | 192,321.702770461 | 337,717.260844435 | 271.90383672 | 2,421,207.348894766 | 2,912,381.844070135 | -491,174.495175369 | 16.8650% | **DISCREPANCY >1%** |
| before | 112 | 1,865,760.736981223 | 173,200.851403845 | 85,660.90276259 | 273.726524848 | 858,535.424827937 | 1,606,625.25628994 | -748,089.831462003 | 46.5628% | **DISCREPANCY >1%** |
| before | 113 | 1,426,472.253958655 | 223,287.331033099 | 24,443.416711791 | 274.823731008 | 723,051.673206953 | 1,178,466.682482757 | -455,415.009275804 | 38.6447% | **DISCREPANCY >1%** |
| before | 114 | 1,394,583.69129673 | 54,534.060998196 | 206,406.112190315 | 274.314211227 | 818,971.595299437 | 1,133,369.203896992 | -314,397.608597555 | 27.7400% | **DISCREPANCY >1%** |
| before | 115 | 1,527,489.977031515 | 196,982.31937977 | 0 | 276.241311566 | 674,736.540831756 | 1,330,231.416340179 | -655,494.875508423 | 49.2767% | **DISCREPANCY >1%** |
| before | 117 | 1,577,384.159372488 | 0 | 110,042.604483153 | 278.659242901 | 1,182,843.699577966 | 1,467,062.895646434 | -284,219.196068468 | 19.3733% | **DISCREPANCY >1%** |
| before | 118 | 2,024,046.920306349 | 153,349.352006901 | 100,459.246518578 | 278.25984474 | 1,610,600.660779731 | 1,769,960.06193613 | -159,359.401156399 | 9.0035% | **DISCREPANCY >1%** |
| before | 119 | 1,493,333.518002894 | 127,462.331317651 | 0 | 280.161251263 | 720,015.01421028 | 1,365,591.02543398 | -645,576.0112237 | 47.2744% | **DISCREPANCY >1%** |
| before | 120 | 2,546,728.101568921 | 3,986.862247885 | 172,129.469734028 | 280.028677018 | 2,203,582.648794662 | 2,370,331.74090999 | -166,749.092115328 | 7.0348% | **DISCREPANCY >1%** |
| before | 121 | 2,766,644.954076083 | 211,264.855121109 | 0 | 281.99093558 | 1,535,311.697079252 | 2,555,098.108019394 | -1,019,786.410940142 | 39.9118% | **DISCREPANCY >1%** |
| before | 122 | 494,829.449887162 | 223,698.06146747 | 41,001.922983965 | 283.07158545 | 212,399.087082206 | 229,846.393850277 | -17,447.306768071 | 7.5908% | **DISCREPANCY >1%** |
| before | 123 | 1,850,352.345164228 | 117,012.394161995 | 40,622.003819962 | 284.954694255 | 1,545,775.094847816 | 1,692,432.992488016 | -146,657.8976402 | 8.6655% | **DISCREPANCY >1%** |
| before | 124 | 3,304,780.900114264 | 92,313.326894099 | 196,705.60854964 | 284.202246445 | 2,213,958.401766367 | 3,015,477.76242408 | -801,519.360657713 | 26.5801% | **DISCREPANCY >1%** |
| before | 125 | 2,325,819.430010415 | 223,698.068375433 | 7,964.547109056 | 286.897169577 | 1,109,743.523235324 | 2,093,869.917356349 | -984,126.394121025 | 47.0003% | **DISCREPANCY >1%** |
| before | 126 | 1,107,633.577479887 | 101,570.16062343 | 215,477.375953641 | 286.623123336 | 506,364.309783089 | 790,299.41777948 | -283,935.107996391 | 35.9275% | **DISCREPANCY >1%** |
| before | 127 | 2,802,817.648141101 | 201,728.715858691 | 45.025794905 | 288.321344105 | 1,653,334.165428989 | 2,600,755.5851434 | -947,421.419714411 | 36.4286% | **DISCREPANCY >1%** |
| before | 128 | 2,676,783.343533691 | 0 | 34,715.84016103 | 289.261683833 | 2,459,320.890947386 | 2,641,778.241688828 | -182,457.350741442 | 6.9066% | **DISCREPANCY >1%** |
| after | 15 | 1,282,869.851056783 | 354,654.991781899 | 218,451.160515187 | 192.09621724 | 716,745.344324384 | 709,571.602542457 | +7,173.741781927 | 1.0109% | **DISCREPANCY >1%** |
| after | 36 | 627,889.239072002 | 131,286.518958231 | 37,538.851627533 | 215.003480306 | 464,701.809419829 | 458,848.865005932 | +5,852.944413897 | 1.2755% | **DISCREPANCY >1%** |
| after | 57 | 825,775.111178675 | 317,596.320183395 | 70,615.680938887 | 234.648963669 | 442,264.988899287 | 437,328.461092724 | +4,936.527806563 | 1.1287% | **DISCREPANCY >1%** |
| after | 67 | 818,233.005618122 | 275,635.793013465 | 132,264.88633962 | 244.548133063 | 415,753.341684633 | 410,087.778131974 | +5,665.563552659 | 1.3815% | **DISCREPANCY >1%** |
| after | 78 | 650,047.486811965 | 64,569.373140067 | 93,439.420139376 | 256.779702547 | 497,791.007489218 | 491,781.913829975 | +6,009.093659243 | 1.2219% | **DISCREPANCY >1%** |
| after | 82 | 637,044.829536987 | 51,351.621683119 | 203,656.438410755 | 259.745850219 | 387,646.14878236 | 381,777.023592894 | +5,869.125189466 | 1.5373% | **DISCREPANCY >1%** |
| after | 96 | 672,938.803045531 | 223,924.687813565 | 67,499.464576751 | 273.313063513 | 387,490.176423779 | 381,241.337591702 | +6,248.838832077 | 1.6390% | **DISCREPANCY >1%** |
| after | 122 | 494,846.449887162 | 246,465.034375573 | 41,001.922983965 | 300.071585414 | 212,399.087082206 | 207,079.42094221 | +5,319.666139996 | 2.5689% | **DISCREPANCY >1%** |

## Accounting definitions

- Actual staked alpha: sum of every `TotalHotkeyAlpha(hotkey, netuid)` value.
- Pending alpha: `PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + PendingOwnerCut + PendingBasketDeposits`.
- Calculated staked alpha: saturating `SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha - pending alpha`.
- Discrepancy percentage: `abs(actual - calculated) / calculated × 100`.
