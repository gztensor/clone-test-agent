# Subnet ownership conviction and alpha accounting

Generated: 2026-08-12T19:26:40.322Z

## Run summary

| Phase | Block | Runtime | Migration complete | Subnets | King calculation mismatches | Alpha discrepancies >1% |
|---|---:|---|---|---:|---:|---:|
| before | 9 | node-subtensor/443 | false | 128 | 0 | 121 |
| after | 16 | node-subtensor/445 | true | 128 | 0 | 26 |

> **Migration verification:** the historical-alpha correction applied on the clone despite its non-mainnet genesis `0x57a26328383c75e8d0089bced04da375d90811ad2b0072633efdccfb1bf13c80`. Subnet 1 expected approximately `+661,707.044125477 α` and observed `+661,730.798373523 α`; this closely matched after other generation-rebase corrections. After all migrations, `26` subnets exceed 1% discrepancy.

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

Snapshot clone block: `9`; projection mainnet block: `8829629` (`0x53d7f3241f0598740fba684428e81f507532a312d5a30883b73b9614c7d1e086`)

Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α now | Owner-UID withheld | Mode | Threshold growth α/day | Gate | Mature | Ownership result | Predicted king |
|---:|---|---|---:|---:|---:|---|---:|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,833.478 | 248,442.2267 | 57.87% (1,708.2532 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 332,852.4356 | 82.62% (2,438.8914 α/day) | burn | 720 | met | yes | owner remains king | `5CFxLBv…juK17J` |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 246,381.2049 | 280,268.7519 | 0.00% (0 α/day) | burn | 720 | not met | yes | 17.1 days (block 8952795) | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.1165 | 350,341.1071 | 7.02% (207.123 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 299,876.4389 | 42.23% (1,246.6396 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 271,588.0911 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CfSg4e…GxJrMA` |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 312,992.4312 | 90.42% (2,669.2966 α/day) | recycle | 453.0703 | not met | yes | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,572.4092 | 303,474.3247 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5F6tnxz…tQjw8y` |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 394,101.2161 | 50.00% (1,476.0083 α/day) | burn | 720 | met | yes | owner remains king | `5Fsbube…4mJJZ9` |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,046.8498 | 311,809.46 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 298,059.7781 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 336,024.0049 | 99.40% (2,934.2811 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 241,972.2443 | 71.26% (2,103.4789 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,413.1214 | 305,919.7258 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 128,284.9483 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,310.2371 | 29,224.4056 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 487,150.1772 | 302,563.2589 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5E7eSeR…HCen2B` |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 322,151.3358 | 6.64% (195.9222 α/day) | burn | 720 | met | yes | owner remains king | `5DCSySU…NwoWyG` |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 254,532.0554 | 38.01% (1,121.956 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 287,647.414 | 315,156.7118 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | 3.0 days (block 8851337) | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 344,633.3945 | 45.13% (1,332.1147 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 342,468.0079 | 52.08% (1,537.4454 α/day) | burn | 720 | met | yes | owner remains king | `5CUu1Qh…oD4dyP` |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 476,840.0653 | 404,088.9136 | 100.00% (2,952.0165 α/day) | burn | 720 | met | yes | owner remains king | `5HKsviv…5rM28H` |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 271,756.1297 | 364,168.2385 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | owner remains king | `5ELpkVn…e6YVcL` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 411,655.2161 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 2,553.3413 | 77,666.6347 | 50.04% (1,477.1406 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 321,707.1984 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,349.6214 | 465,262.1012 | 15.79% (466.0099 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 289,848.0593 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 338,256.1049 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 158,649.5688 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | owner remains king | `5CDZ527…pQfftn` |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 342,720.4833 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DWgkCS…uS9Qad` |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.5271 | 230,181.4054 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,307.2365 | 251,772.8033 | 0.00% (0 α/day) | recycle | 720 | not met | yes | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,183.1062 | 298,851.4928 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 62,787.4239 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 357,253.9216 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 38,442.8296 | 147,307.7086 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 186,549.0921 | 316,641.8553 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | 22.2 days (block 8989581) | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 32,698.8734 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 297,515.6612 | 71.96% (2,124.1484 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 259,502.6142 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 305,277.0885 | 79.84% (2,356.757 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 401,235.6986 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2915 | 301,173.5442 | 64.44% (1,902.1497 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 173,963.3345 | 351,070.1598 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,593.4882 | 129,551.2895 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 310,751.805 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 201,785.8851 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 323,689.805 | 0.00% (0.0037 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.4617 | 369,482.5065 | 0.00% (0 α/day) | recycle | 720 | met | yes | owner remains king | `5FTVrwE…ZouKg1` |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 295,210.0071 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 458,743.5237 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 377,418.9692 | 33.29% (982.8731 α/day) | burn | 720 | met | yes | owner remains king | `5DUB7kN…L9Wgpr` |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 279,932.0289 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 264,638.9264 | 64.47% (1,903.0952 α/day) | burn | 720 | met | yes | owner remains king | `5GU4Xkd…1mVXFu` |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 82,576.0111 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 29,728.6291 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 387,345.8068 | 319,371.6959 | 100.00% (2,952.0165 α/day) | burn | 720 | met | yes | owner remains king | `5EF9dnw…FjNdve` |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,073,423.5196 | 373,892.1574 | 50.00% (1,476.0082 α/day) | burn | 720 | met | yes | owner remains king | `5CXLwkK…hA9rhR` |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 436,863.2657 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5ECEsYL…c8jUbn` |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 148,964.7464 | 263,936.3147 | 13.34% (393.7444 α/day) | recycle | 680.6256 | not met | yes | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 381,724.5035 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,047.7282 | 334,075.071 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CS3g6n…Ks2xbV` |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 322,317.0027 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 335,555.0768 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DRPoRi…MzcpZV` |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 81,821.8006 | 3.85% (113.6281 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 601,812.5491 | 360,649.6406 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CSuegT…4rQbbb` |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 112,774.0984 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,831.6224 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 418,510.5678 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 504,436.3888 | 248,678.8252 | 100.00% (2,952.0165 α/day) | burn | 720 | met | yes | owner remains king | `5DUuFhF…16k2GU` |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 940,167.7702 | 328,036.592 | 100.00% (2,952.0165 α/day) | burn | 720 | met | yes | owner remains king | `5Dnkprj…K8pFhW` |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 333,590.6259 | 63.00% (1,859.7876 α/day) | recycle | 534.0212 | met | yes | owner remains king | `5Dnffft…bXGH7L` |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,610.2123 | 350,854.5764 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5G1Qj93…sQzs6g` |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 101,466.5381 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 321,182.4798 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DqALXR…DdohsE` |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 65,003.2487 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 352,216.6862 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5EWwdZB…6HSxoF` |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 180,579.2602 | 91.78% (2,709.2916 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 198,523.6117 | 260,433.7833 | 1.02% (30.211 α/day) | burn | 720 | not met | yes | 8.8 days (block 8892791) | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 63,702.983 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 265,515.3095 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 57,328.7242 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 250,783.0019 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | 0.00% (0 α/day) | burn | 0 | met | no | owner remains king | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,809.824 | 150,725.5582 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 345,802.1083 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5HK4vbG…LPgXpY` |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 276,392.5852 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 14,011.2393 | 87.14% (2,572.4749 α/day) | recycle | 462.7525 | met | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 73,528.5507 | 99,344.695 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 38,287.5229 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,285.343 | 318,019.5855 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DAoDtM…DhfNNK` |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 158,282.7578 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 282,349.3049 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 149,658.0268 | 67,292.3803 | 41.06% (1,212.0436 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 94,168.9279 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 588,406.4972 | 279,026.3348 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5HWVxik…BtFxvK` |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 21,752.9329 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 328,267.4999 | 179,978.9096 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 230,150.4793 | 90.22% (2,663.3893 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 84,313.9315 | 25.06% (739.8379 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 9,666.5397 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 306,296.3343 | 95.27% (2,812.4852 α/day) | recycle | 438.7515 | not met | yes | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 200,542.6496 | 192,217.324 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 272,897.1107 | 237,698.1761 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5D7FVSM…ezvyHy` |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 141,230.2564 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 319,531.1117 | 153,051.5515 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,573.3452 | 140,892.0282 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 249,296.3507 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 344,269.4712 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 186,576.2737 | 80.00% (2,361.606 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 81,418.2163 | 142,647.4254 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 139,458.6128 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 152,749.1977 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 49,832.2033 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 161,680.3093 | 157,738.6159 | 100.00% (2,952.0165 α/day) | recycle | 424.7984 | met | yes | owner remains king | `5DwRMxJ…RozmGE` |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 118,221.1563 | 202,404.892 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 149,333.5518 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,234.1888 | 254,673.1137 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 276,664.6954 | 60.79% (1,794.6108 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 100,469.8763 | 49,483.145 | 100.00% (2,952.0165 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 185,035.4345 | 41.11% (1,213.5262 α/day) | burn | 720 | met | yes | owner remains king | `5GxsywP…Nba82o` |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 330,478.3563 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5GZPtUj…AEDjmt` |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 232,582.143 | 100.00% (2,952.0165 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 122,563.1229 | 110,763.5577 | 30.07% (887.7584 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 280,281.9648 | 70.63% (2,085.1129 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5742 | 267,678.5344 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |

## After upgrade: subnet kings and takeover projection

Snapshot clone block: `16`; projection mainnet block: `8829636` (`0x29ad3cce6b7039f4113e0f5903e6aa59bb38ef548ae01ffa97664fd65a71681a`)

Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α now | Owner-UID withheld | Mode | Threshold growth α/day | Gate | Mature | Ownership result | Predicted king |
|---:|---|---|---:|---:|---:|---|---:|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,833.4781 | 164,050.1279 | 57.94% (1,710.3059 α/day) | burn | 548.9694 | met | yes | owner remains king | `5HCFWvR…1wgDHh` |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 269,253.988 | 82.62% (2,438.8914 α/day) | burn | 476.1109 | met | yes | owner remains king | `5CFxLBv…juK17J` |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 246,384.3901 | 205,970.6071 | 0.00% (0 α/day) | burn | 720 | met | yes | 0 | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.1165 | 279,298.2767 | 7.02% (207.123 α/day) | burn | 699.2877 | not met | yes | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 150,690.8671 | 42.23% (1,246.6396 α/day) | burn | 595.336 | not met | yes | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 243,342.9459 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CfSg4e…GxJrMA` |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 307,076.9512 | 90.42% (2,669.2966 α/day) | recycle | 453.0703 | not met | yes | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,572.4092 | 218,531.5127 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5F6tnxz…tQjw8y` |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 264,395.8118 | 50.00% (1,476.0083 α/day) | burn | 572.3992 | met | yes | owner remains king | `5Fsbube…4mJJZ9` |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,046.82 | 239,522.7055 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 170,546.1559 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 183,811.4397 | 99.40% (2,934.2811 α/day) | burn | 426.5719 | not met | yes | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 181,009.8859 | 71.26% (2,103.4789 α/day) | burn | 509.6521 | not met | yes | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,412.9968 | 174,901.9784 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 70,975.5699 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,310.3051 | 17,663.4146 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 487,150.2283 | 257,312.3071 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5E7eSeR…HCen2B` |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 270,930.4989 | 6.64% (195.9222 α/day) | burn | 700.4078 | met | yes | owner remains king | `5DCSySU…NwoWyG` |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 153,945.521 | 38.01% (1,121.956 α/day) | burn | 607.8044 | met | yes | owner remains king | `5CK49hD…VAQRfC` |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 287,657.5032 | 183,355.5027 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | 0 | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 262,225.1099 | 45.13% (1,332.1147 α/day) | burn | 586.7885 | not met | yes | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 223,504.4097 | 52.08% (1,537.4454 α/day) | burn | 566.2555 | met | yes | owner remains king | `5CUu1Qh…oD4dyP` |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 476,839.846 | 269,831.8056 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | owner remains king | `5HKsviv…5rM28H` |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 271,763.5412 | 294,677.9884 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | owner remains king | `5ELpkVn…e6YVcL` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 324,386.7702 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 2,553.3946 | 66,937.6342 | 50.04% (1,477.1406 α/day) | burn | 572.2859 | not met | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 199,147.6014 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,349.6214 | 312,609.365 | 15.79% (466.0099 α/day) | burn | 673.399 | met | yes | owner remains king | `5Evgh9Q…5dco3P` |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 228,765.824 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 264,941.9257 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 88,755.9692 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | owner remains king | `5CDZ527…pQfftn` |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 331,481.2094 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DWgkCS…uS9Qad` |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.5272 | 163,020.8729 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,306.7525 | 202,474.2707 | 0.00% (0 α/day) | recycle | 720 | not met | yes | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,183.0996 | 262,603.738 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 45,905.5868 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 236,326.477 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 38,442.5445 | 88,286.9979 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 186,557.2857 | 167,696.8508 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | 0 | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 12,480.8005 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 178,420.1751 | 71.96% (2,124.1484 α/day) | burn | 507.5852 | met | yes | owner remains king | `5FCSevL…2DYkXX` |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 216,439.0585 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 219,447.9543 | 79.84% (2,356.757 α/day) | burn | 484.3243 | not met | yes | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 337,918.2954 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2916 | 198,985.6353 | 64.44% (1,902.1497 α/day) | burn | 529.785 | not met | yes | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 173,963.134 | 249,685.9057 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,593.7974 | 68,394.2628 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 231,036.7729 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 115,931.2403 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 272,901.9618 | 0.00% (0.0037 α/day) | burn | 719.9996 | not met | yes | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.4614 | 237,048.6522 | 0.00% (0 α/day) | recycle | 720 | met | yes | owner remains king | `5FTVrwE…ZouKg1` |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 187,485.4614 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 398,376.8563 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 316,751.0673 | 33.29% (982.8731 α/day) | burn | 621.7127 | met | yes | owner remains king | `5DUB7kN…L9Wgpr` |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 238,868.8572 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 185,791.2426 | 64.47% (1,903.0952 α/day) | burn | 529.6905 | met | yes | owner remains king | `5GU4Xkd…1mVXFu` |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 43,755.511 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 13,532.6523 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 387,345.6934 | 262,990.1676 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | owner remains king | `5EF9dnw…FjNdve` |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,073,423.0225 | 306,944.1083 | 50.00% (1,476.0082 α/day) | burn | 572.3992 | met | yes | owner remains king | `5CXLwkK…hA9rhR` |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 347,892.1574 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5ECEsYL…c8jUbn` |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 148,964.7181 | 241,209.3741 | 13.34% (393.7444 α/day) | recycle | 680.6256 | not met | yes | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 294,469.1532 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,047.7202 | 290,607.6082 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CS3g6n…Ks2xbV` |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 228,375.4179 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 239,590.5128 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DRPoRi…MzcpZV` |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 41,032.4326 | 3.85% (113.6281 α/day) | burn | 708.6372 | not met | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 601,811.0405 | 275,535.218 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5CSuegT…4rQbbb` |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 78,646.4982 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,817.5055 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 322,296.8954 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 504,432.6566 | 210,352.1527 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | owner remains king | `5DUuFhF…16k2GU` |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 940,168.2387 | 181,141.8851 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | yes | owner remains king | `5Dnkprj…K8pFhW` |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 270,982.9493 | 63.00% (1,859.7876 α/day) | recycle | 534.0212 | met | yes | owner remains king | `5Dnffft…bXGH7L` |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,610.2123 | 270,705.478 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5G1Qj93…sQzs6g` |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 53,477.8487 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 251,019.1567 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DqALXR…DdohsE` |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 49,203.0694 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 292,725.3722 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5EWwdZB…6HSxoF` |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 157,087.5106 | 91.78% (2,709.2916 α/day) | burn | 449.0708 | not met | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 198,531.9834 | 164,079.5802 | 1.02% (30.211 α/day) | burn | 716.9789 | met | yes | 0 | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 38,202.8769 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 210,165.4559 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 50,478.9578 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 194,778.584 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | 0.00% (0 α/day) | burn | 0 | met | no | owner remains king | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,808.6151 | 80,880.5635 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 318,712.3957 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5HK4vbG…LPgXpY` |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 197,575.7047 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 2,372.7124 | 87.14% (2,572.4749 α/day) | recycle | 462.7525 | met | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 73,528.0506 | 53,890.4961 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 16,476.739 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,285.2493 | 208,374.2244 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5DAoDtM…DhfNNK` |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 89,566.0698 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 175,509.7202 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 149,657.874 | 38,150.6651 | 41.06% (1,212.0436 α/day) | burn | 598.7956 | met | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 61,956.7691 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 588,402.1594 | 153,477.9954 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5HWVxik…BtFxvK` |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 14,553.1728 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 328,265.1298 | 113,124.5907 | 0.00% (0 α/day) | burn | 720 | met | no | owner remains king | `5HdSGJg…xTvKfe` |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 134,784.8538 | 90.22% (2,663.3893 α/day) | burn | 453.6611 | not met | yes | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 56,606.6601 | 25.06% (739.8379 α/day) | burn | 646.0162 | not met | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 0 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 271,395.5946 | 95.27% (2,812.4852 α/day) | recycle | 438.7515 | not met | yes | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 200,542.0544 | 127,442.6401 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 272,896.9858 | 148,507.7379 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5D7FVSM…ezvyHy` |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 76,342.8581 | 0.00% (0 α/day) | burn | 720 | not met | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 319,528.7213 | 104,887.5634 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,573.339 | 71,198.0627 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | owner remains king | `5DyQkk4…Vd3XUk` |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 172,475.3365 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 241,802.0643 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 85,441.2213 | 80.00% (2,361.606 α/day) | burn | 483.8394 | not met | yes | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 81,417.6093 | 71,955.1775 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 81,437.5132 | 0.00% (0 α/day) | burn | 720 | met | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 67,000.4404 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 32,209.3407 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 161,680.833 | 117,792.5953 | 100.00% (2,952.0165 α/day) | recycle | 424.7984 | met | yes | owner remains king | `5DwRMxJ…RozmGE` |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 118,220.9413 | 160,562.0863 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 71,680.4632 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,233.6481 | 220,030.8243 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 153,231.2778 | 60.79% (1,794.6108 α/day) | burn | 540.5389 | met | yes | owner remains king | `5EL9y2g…34ZdNf` |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 100,469.2524 | 20,737.1493 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | met | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 154,290.3223 | 41.11% (1,213.5262 α/day) | burn | 598.6474 | met | yes | owner remains king | `5GxsywP…Nba82o` |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 221,107.9659 | 0.00% (0 α/day) | burn | 720 | met | yes | owner remains king | `5GZPtUj…AEDjmt` |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 110,670.2881 | 100.00% (2,952.0165 α/day) | burn | 424.7984 | not met | yes | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 122,564.2208 | 50,234.0637 | 30.07% (887.7584 α/day) | burn | 631.2242 | met | no | owner remains king | `5FZD47W…AJ5ggD` |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 165,026.992 | 70.63% (2,085.1129 α/day) | burn | 511.4887 | not met | yes | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5742 | 245,606.1709 | 0.00% (0 α/day) | burn | 720 | not met | yes | not projected within 10y | — |

## Before upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,484,422.267183304 | 165,012.699896644 | 17,184.489564018 | 96.97482357 | 1,659,729.728281817 | 2,302,128.102899072 | -642,398.374617255 | 27.9045% | **DISCREPANCY >1%** |
| 2 | 3,328,524.356043044 | 186,958.253739906 | 277.903743213 | 165.500851158 | 2,711,313.00299156 | 3,141,122.697708767 | -429,809.694717207 | 13.6833% | **DISCREPANCY >1%** |
| 3 | 2,802,687.518698846 | 0.468119708 | 164,513.112997802 | 165.12659535 | 2,078,448.8879906 | 2,638,008.810985986 | -559,559.922995386 | 21.2114% | **DISCREPANCY >1%** |
| 4 | 3,503,411.071435473 | 13,456.73137153 | 157,411.336736275 | 166.029751178 | 2,811,300.435005442 | 3,332,376.97357649 | -521,076.538571048 | 15.6367% | **DISCREPANCY >1%** |
| 5 | 2,998,764.389298738 | 209,823.537800336 | 3,605.489629913 | 167.281869929 | 1,525,624.786765432 | 2,785,168.07999856 | -1,259,543.293233128 | 45.2232% | **DISCREPANCY >1%** |
| 6 | 2,715,880.911458657 | 23,468.530961558 | 97,097.786802825 | 170.346869978 | 2,451,996.683773013 | 2,595,144.246824296 | -143,147.563051283 | 5.5159% | **DISCREPANCY >1%** |
| 7 | 3,129,924.311512733 | 0 | 23,076.821212896 | 170.075388497 | 3,089,552.962272271 | 3,106,677.41491134 | -17,124.452639069 | 0.5512% | OK |
| 8 | 3,034,743.246777442 | 170,998.084151705 | 68,566.965402812 | 170.086928514 | 2,204,088.317242778 | 2,795,008.110294411 | -590,919.793051633 | 21.1419% | **DISCREPANCY >1%** |
| 9 | 3,941,012.160853394 | 189,930.97794848 | 162,570.722790839 | 171.118320425 | 2,662,702.753243412 | 3,588,339.34179365 | -925,636.588550238 | 25.7956% | **DISCREPANCY >1%** |
| 10 | 3,118,094.600023772 | 223,846.079166223 | 3,919.775094447 | 172.688883125 | 2,413,820.773748008 | 2,890,156.056879977 | -476,335.283131969 | 16.4812% | **DISCREPANCY >1%** |
| 11 | 2,980,597.781308894 | 58,843.162874805 | 129,208.229871262 | 173.661334543 | 1,724,261.701431808 | 2,792,372.727228284 | -1,068,111.025796476 | 38.2510% | **DISCREPANCY >1%** |
| 12 | 3,360,240.048608388 | 222,508.114052081 | 0 | 175.292698014 | 1,856,786.281218517 | 3,137,556.641858293 | -1,280,770.360639776 | 40.8206% | **DISCREPANCY >1%** |
| 13 | 2,419,722.443340406 | 148,967.172896852 | 16,582.21426827 | 175.761479049 | 1,828,953.545731635 | 2,253,997.294696235 | -425,043.7489646 | 18.8573% | **DISCREPANCY >1%** |
| 14 | 3,059,197.25751119 | 220,189.208395156 | 129,813.067943654 | 176.278374955 | 1,767,865.10047261 | 2,709,018.702797425 | -941,153.602324815 | 34.7414% | **DISCREPANCY >1%** |
| 15 | 1,282,849.48291697 | 52,905.700586193 | 218,445.792375374 | 177.096217272 | 716,745.344324384 | 1,011,320.893738131 | -294,575.549413747 | 29.1278% | **DISCREPANCY >1%** |
| 16 | 292,244.056082386 | 106,491.578931276 | 9,125.331581653 | 179.086571522 | 219,971.692133916 | 176,448.058997935 | +43,523.633135981 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,632.589421456 | 35,067.621313474 | 112,040.914287056 | 179.357596006 | 2,591,753.716854974 | 2,878,344.69622492 | -286,590.979369946 | 9.9567% | **DISCREPANCY >1%** |
| 18 | 3,221,513.3581729 | 82,212.573733221 | 184,937.037344576 | 416.502768782 | 2,728,012.390175507 | 2,953,947.244326321 | -225,934.854150814 | 7.6485% | **DISCREPANCY >1%** |
| 19 | 2,545,320.554298479 | 203,827.261478907 | 720.303572897 | 181.424919927 | 1,558,366.405120635 | 2,340,591.564326748 | -782,225.159206113 | 33.4199% | **DISCREPANCY >1%** |
| 20 | 3,151,567.118117668 | 223,846.079145155 | 0 | 183.646865502 | 1,852,324.660431886 | 2,927,537.392107011 | -1,075,212.731675125 | 36.7275% | **DISCREPANCY >1%** |
| 21 | 3,446,333.944539729 | 160,850.042236821 | 12,526.594993624 | 184.583376084 | 2,641,137.2895972 | 3,272,772.7239332 | -631,635.434336 | 19.2997% | **DISCREPANCY >1%** |
| 22 | 3,424,680.078972077 | 161,827.727614681 | 8,538.815663423 | 185.742051125 | 2,253,922.90864158 | 3,254,127.793642848 | -1,000,204.885001268 | 30.7364% | **DISCREPANCY >1%** |
| 23 | 4,040,889.136284042 | 117,779.002762432 | 257,565.47245039 | 186.241550725 | 2,717,035.06015898 | 3,665,358.419520495 | -948,323.359361515 | 25.8725% | **DISCREPANCY >1%** |
| 24 | 3,641,682.385197894 | 75,925.654771513 | 113,298.120046902 | 187.496276129 | 2,964,647.656840732 | 3,452,271.11410335 | -487,623.457262618 | 14.1247% | **DISCREPANCY >1%** |
| 25 | 4,116,552.160734956 | 223,846.079136167 | 0 | 187.348350609 | 3,262,570.098652547 | 3,892,518.73324818 | -629,948.634595633 | 16.1835% | **DISCREPANCY >1%** |
| 26 | 776,666.346869401 | 73,459.26989387 | 16,231.463886896 | 188.88574583 | 673,306.86442606 | 686,786.727342805 | -13,479.862916745 | 1.9627% | **DISCREPANCY >1%** |
| 27 | 3,217,071.984189999 | 223,846.079203415 | 114.576078423 | 192.326060423 | 2,010,230.893396306 | 2,992,919.002847738 | -982,688.109451432 | 32.8337% | **DISCREPANCY >1%** |
| 28 | 4,652,621.012171653 | 176,806.130994487 | 146,397.416279417 | 190.210187197 | 3,144,789.333292944 | 4,329,227.254710552 | -1,184,437.921417608 | 27.3591% | **DISCREPANCY >1%** |
| 29 | 2,898,480.592659301 | 0 | 0 | 192.726660978 | 2,306,335.831049477 | 2,898,287.865998323 | -591,952.034948846 | 20.4241% | **DISCREPANCY >1%** |
| 30 | 3,382,561.048550954 | 223,846.079129087 | 22,914.692387486 | 193.461152421 | 2,667,110.572279116 | 3,135,606.81588196 | -468,496.243602844 | 14.9411% | **DISCREPANCY >1%** |
| 31 | 1,586,495.687500347 | 223,846.079187058 | 38,096.765184011 | 193.694922339 | 893,531.693731475 | 1,324,359.148206939 | -430,827.454475464 | 32.5310% | **DISCREPANCY >1%** |
| 32 | 3,427,204.832587246 | 0 | 94,980.465258985 | 195.8959026 | 3,333,422.893428039 | 3,332,028.471425661 | +1,394.422002378 | 0.0418% | OK |
| 33 | 2,301,814.054268018 | 89,682.65958267 | 87,385.74265516 | 196.090754836 | 1,649,218.144611554 | 2,124,549.561275352 | -475,331.416663798 | 22.3732% | **DISCREPANCY >1%** |
| 34 | 2,517,728.033211587 | 0 | 133,523.052880715 | 196.353990375 | 2,043,591.427143987 | 2,384,008.626340497 | -340,417.19919651 | 14.2791% | **DISCREPANCY >1%** |
| 35 | 2,988,514.927713479 | 0 | 95,598.20397956 | 199.133908836 | 2,644,675.94827133 | 2,892,717.589825083 | -248,041.641553753 | 8.5746% | **DISCREPANCY >1%** |
| 36 | 627,874.239072002 | 9,298.851890397 | 37,538.851627533 | 200.003480336 | 464,701.809419829 | 580,836.532073736 | -116,134.722653907 | 19.9943% | **DISCREPANCY >1%** |
| 37 | 3,572,539.215572503 | 223,846.079137807 | 0 | 200.373593991 | 2,381,932.136047951 | 3,348,492.762840705 | -966,560.626792754 | 28.8655% | **DISCREPANCY >1%** |
| 38 | 1,473,077.086140111 | 139,486.240803376 | 104,917.044740189 | 845.101524232 | 886,266.551300017 | 1,227,828.699072314 | -341,562.147772297 | 27.8183% | **DISCREPANCY >1%** |
| 39 | 3,166,418.553195886 | 172,663.511264212 | 29,373.416255258 | 201.780998142 | 1,695,429.468557074 | 2,964,179.844678274 | -1,268,750.3761212 | 42.8027% | **DISCREPANCY >1%** |
| 40 | 326,988.733918726 | 74,153.423804429 | 128,034.305600759 | 202.517385206 | 176,741.448835177 | 124,598.487128332 | +52,142.961706845 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,156.611654056 | 204,063.185350324 | 217,217.580368984 | 203.976763425 | 1,802,863.651482052 | 2,553,671.869171323 | -750,808.217689271 | 29.4011% | **DISCREPANCY >1%** |
| 42 | 2,595,026.142096049 | 223,846.079158774 | 0 | 205.919954633 | 2,183,122.943907032 | 2,370,974.142982642 | -187,851.19907561 | 7.9229% | **DISCREPANCY >1%** |
| 43 | 3,052,770.884567396 | 179,562.708609502 | 418.387877525 | 206.016150215 | 2,212,435.691834392 | 2,872,583.771930154 | -660,148.080095762 | 22.9809% | **DISCREPANCY >1%** |
| 44 | 4,012,356.985556405 | 82,938.546710406 | 126,786.906898353 | 206.02933626 | 3,398,459.104068 | 3,802,425.502611386 | -403,966.398543386 | 10.6239% | **DISCREPANCY >1%** |
| 45 | 3,011,735.442172559 | 186,957.988153914 | 0 | 209.877745753 | 2,008,703.116929344 | 2,824,567.576272892 | -815,864.459343548 | 28.8845% | **DISCREPANCY >1%** |
| 46 | 3,510,701.597918791 | 140,033.673137159 | 93,394.806384354 | 209.017693858 | 2,515,548.15997582 | 3,277,064.10070342 | -761,515.9407276 | 23.2377% | **DISCREPANCY >1%** |
| 47 | 1,295,512.895427735 | 221,936.771527767 | 22,924.082606544 | 210.661885483 | 687,673.465762526 | 1,050,441.379407941 | -362,767.913645415 | 34.5348% | **DISCREPANCY >1%** |
| 48 | 3,107,518.04985937 | 0 | 101,664.859193657 | 211.700853083 | 2,328,846.687272452 | 3,005,641.48981263 | -676,794.802540178 | 22.5174% | **DISCREPANCY >1%** |
| 49 | 2,017,858.850546894 | 120,325.749958529 | 164,458.675753828 | 211.470969167 | 1,164,300.147403006 | 1,732,862.95386537 | -568,562.806462364 | 32.8106% | **DISCREPANCY >1%** |
| 50 | 3,236,898.049890369 | 84,285.185243783 | 40,263.969667629 | 212.87041999 | 2,747,775.456897652 | 3,112,136.024558967 | -364,360.567661315 | 11.7077% | **DISCREPANCY >1%** |
| 51 | 3,694,825.065195113 | 105,922.936515629 | 153,198.597707004 | 213.014881545 | 2,389,201.875098131 | 3,435,490.516090935 | -1,046,288.640992804 | 30.4552% | **DISCREPANCY >1%** |
| 52 | 2,952,100.070821844 | 223,846.079128825 | 90.395967424 | 214.761205249 | 1,893,408.234763284 | 2,727,948.834520346 | -834,540.599757062 | 30.5922% | **DISCREPANCY >1%** |
| 53 | 4,587,435.236941434 | 165,100.951333266 | 83,431.340568136 | 215.141069526 | 4,002,412.306866003 | 4,338,687.803970506 | -336,275.497104503 | 7.7506% | **DISCREPANCY >1%** |
| 54 | 3,774,189.691772849 | 104,605.505486405 | 43,761.132345373 | 217.262086186 | 3,186,263.949667802 | 3,625,605.791854885 | -439,341.842187083 | 12.1177% | **DISCREPANCY >1%** |
| 55 | 2,799,320.289393601 | 9,506.992017657 | 94,545.881062638 | 219.134605116 | 2,407,570.599805009 | 2,695,048.28170819 | -287,477.681903181 | 10.6668% | **DISCREPANCY >1%** |
| 56 | 2,646,389.264136623 | 147,253.342830014 | 13,997.922202342 | 218.28250361 | 1,876,658.38095267 | 2,484,919.716600657 | -608,261.335647987 | 24.4781% | **DISCREPANCY >1%** |
| 57 | 825,760.111178675 | 223,846.079159495 | 70,615.680938887 | 219.6489637 | 442,264.988899287 | 531,078.702116593 | -88,813.713217306 | 16.7232% | **DISCREPANCY >1%** |
| 58 | 297,286.290570974 | 161,966.767161337 | 0 | 70.223144242 | 228,682.61780516 | 135,249.300265395 | +93,433.317539765 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,716.959417721 | 71,891.198873536 | 122,883.114116497 | 224.495433125 | 2,648,586.34800194 | 2,998,718.150994563 | -350,131.802992623 | 11.6760% | **DISCREPANCY >1%** |
| 60 | 3,738,921.573624944 | 121,459.892472139 | 40,528.882878666 | 223.011153479 | 3,088,309.198855045 | 3,576,709.78712066 | -488,400.588265615 | 13.6550% | **DISCREPANCY >1%** |
| 61 | 4,368,632.657147251 | 113,406.497793948 | 81,347.938388218 | 223.599154643 | 3,497,985.843054945 | 4,173,654.621810442 | -675,668.778755497 | 16.1889% | **DISCREPANCY >1%** |
| 62 | 2,639,363.147155989 | 1,029.291966503 | 43,102.132893188 | 224.315194557 | 2,431,187.062364878 | 2,595,007.407101741 | -163,820.344736863 | 6.3129% | **DISCREPANCY >1%** |
| 63 | 3,817,245.034631839 | 0 | 147,121.106363448 | 225.616747369 | 2,963,791.083203702 | 3,669,898.311521022 | -706,107.22831732 | 19.2405% | **DISCREPANCY >1%** |
| 64 | 3,340,750.710189858 | 44,721.605785854 | 166,748.351173323 | 226.063767972 | 2,925,100.024232174 | 3,129,054.689462709 | -203,954.665230535 | 6.5180% | **DISCREPANCY >1%** |
| 65 | 3,223,170.02667184 | 204,139.305947923 | 71.722624687 | 229.953625592 | 2,290,879.611105601 | 3,018,729.044473638 | -727,849.433368037 | 24.1111% | **DISCREPANCY >1%** |
| 66 | 3,355,550.767963545 | 58,498.893235066 | 83,262.913449555 | 229.876365693 | 2,399,574.013147158 | 3,213,559.084913231 | -813,985.071766073 | 25.3297% | **DISCREPANCY >1%** |
| 67 | 818,218.005618122 | 94,182.859728691 | 132,264.88633962 | 229.548133094 | 415,753.341684633 | 591,540.711416717 | -175,787.369732084 | 29.7168% | **DISCREPANCY >1%** |
| 68 | 3,606,496.406104598 | 51,820.059551198 | 169,944.720871921 | 230.15642729 | 2,757,678.262310717 | 3,384,501.469254189 | -626,823.206943472 | 18.5203% | **DISCREPANCY >1%** |
| 69 | 1,127,740.983729383 | 223,846.079187092 | 59,604.102841208 | 231.154576664 | 789,692.225967185 | 844,059.647124419 | -54,367.421157234 | 6.4411% | **DISCREPANCY >1%** |
| 70 | 38,316.22374926 | 148.169094182 | 0 | 167.182726702 | 38,149.040995632 | 38,000.871928376 | +148.169067256 | 0.3899% | OK |
| 71 | 4,185,105.677766843 | 96,876.088940082 | 85,705.37638208 | 234.451983468 | 3,225,073.636749908 | 4,002,289.760461213 | -777,216.123711305 | 19.4192% | **DISCREPANCY >1%** |
| 72 | 2,486,788.251902087 | 221,779.667597505 | 0 | 235.603932792 | 2,105,694.740466461 | 2,264,772.98037179 | -159,078.239905329 | 7.0240% | **DISCREPANCY >1%** |
| 73 | 3,280,365.920420528 | 223,846.079132607 | 0 | 236.105893997 | 1,813,676.942884909 | 3,056,283.735393924 | -1,242,606.792509015 | 40.6574% | **DISCREPANCY >1%** |
| 74 | 3,335,906.259227667 | 0 | 94,292.343237338 | 237.356012717 | 2,712,295.874311409 | 3,241,376.559977612 | -529,080.685666203 | 16.3227% | **DISCREPANCY >1%** |
| 75 | 3,508,545.764052575 | 203,423.332505008 | 16,893.104898524 | 237.228181438 | 2,709,395.891317406 | 3,287,992.098467605 | -578,596.207150199 | 17.5972% | **DISCREPANCY >1%** |
| 76 | 1,014,665.381470641 | 179,713.432857498 | 4,053.056546057 | 239.707430145 | 539,215.189087256 | 830,659.184636941 | -291,443.995549685 | 35.0858% | **DISCREPANCY >1%** |
| 77 | 3,211,824.798076511 | 0 | 560,753.334406754 | 239.999075655 | 2,512,507.442349621 | 2,650,831.464594102 | -138,324.022244481 | 5.2181% | **DISCREPANCY >1%** |
| 78 | 650,032.486811965 | 6,499.356268383 | 93,439.420139376 | 241.779702579 | 497,791.007489218 | 549,851.930701627 | -52,060.923212409 | 9.4681% | **DISCREPANCY >1%** |
| 79 | 3,522,166.862271233 | 63,794.223490279 | 150,690.200996417 | 241.600830685 | 2,929,780.461334615 | 3,307,440.836953852 | -377,660.375619237 | 11.4185% | **DISCREPANCY >1%** |
| 80 | 1,805,792.602432742 | 144,923.552045991 | 42,374.70227022 | 242.090831563 | 1,575,661.087864241 | 1,618,252.257284968 | -42,591.169420727 | 2.6319% | **DISCREPANCY >1%** |
| 81 | 2,604,337.832756389 | 20,523.249052955 | 112,246.681951056 | 243.414012908 | 1,643,122.255968379 | 2,471,324.48773947 | -828,202.231771091 | 33.5124% | **DISCREPANCY >1%** |
| 82 | 637,029.829536987 | 1,033.20576559 | 203,656.438410755 | 244.745850252 | 387,646.14878236 | 432,095.43951039 | -44,449.29072803 | 10.2869% | **DISCREPANCY >1%** |
| 83 | 2,655,153.094539082 | 0 | 208,332.711813588 | 245.256934043 | 2,105,495.312152469 | 2,446,575.125791451 | -341,079.813638982 | 13.9411% | **DISCREPANCY >1%** |
| 84 | 573,287.241545722 | 4,045.485421068 | 25,365.155475257 | 245.999999472 | 499,568.25457856 | 543,630.600649925 | -44,062.346071365 | 8.1051% | **DISCREPANCY >1%** |
| 85 | 2,507,830.019391255 | 101,240.455860461 | 63,690.179621261 | 248.014358267 | 1,950,373.413274667 | 2,342,651.369551266 | -392,277.956276599 | 16.7450% | **DISCREPANCY >1%** |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,255.581541561 | 223,698.068303363 | 51,054.043826615 | 250.166257857 | 811,937.38714958 | 1,232,253.303153726 | -420,315.916004146 | 34.1095% | **DISCREPANCY >1%** |
| 88 | 3,458,021.082944634 | 42,432.314973574 | 95,634.813463234 | 250.870198749 | 3,189,628.068539638 | 3,319,703.084309077 | -130,075.015769439 | 3.9182% | **DISCREPANCY >1%** |
| 89 | 2,763,925.852090179 | 184,424.496583798 | 187,748.849811315 | 252.328223113 | 1,978,297.520002656 | 2,391,500.177471953 | -413,202.657469297 | 17.2779% | **DISCREPANCY >1%** |
| 90 | 140,112.393099798 | 116,392.269522858 | 0 | 89.032188467 | 140,001.653399788 | 23,631.091388473 | +116,370.562011315 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,446.950070142 | 160,524.915777216 | 55,172.213589911 | 253.197144677 | 543,685.801296443 | 777,496.623558338 | -233,810.822261895 | 30.0722% | **DISCREPANCY >1%** |
| 92 | 382,875.228663509 | 176,927.850467173 | 41,186.988026446 | 255.178151524 | 165,518.197370141 | 164,505.212018366 | +1,012.985351775 | 0.6157% | OK |
| 93 | 3,180,195.854592287 | 181,921.200099591 | 10,625.450947767 | 255.306172541 | 2,086,451.787267245 | 2,987,393.897372388 | -900,942.110105143 | 30.1581% | **DISCREPANCY >1%** |
| 94 | 1,582,827.5781042 | 216,580.400930509 | 6,977.120150346 | 257.371739565 | 901,263.328629545 | 1,359,012.68528378 | -457,749.356654235 | 33.6824% | **DISCREPANCY >1%** |
| 95 | 2,823,493.04876599 | 223,698.068303101 | 92,584.118277643 | 257.028885663 | 1,759,219.58729414 | 2,506,953.833299583 | -747,734.246005443 | 29.8264% | **DISCREPANCY >1%** |
| 96 | 672,923.803045531 | 130,829.78226522 | 67,499.464576751 | 258.313063545 | 387,490.176423779 | 474,336.243140015 | -86,846.066716236 | 18.3089% | **DISCREPANCY >1%** |
| 97 | 941,689.278695497 | 24,305.834427164 | 251,255.811515221 | 259.065141943 | 624,754.286624672 | 665,868.567611169 | -41,114.280986497 | 6.1745% | **DISCREPANCY >1%** |
| 98 | 2,790,263.348044368 | 176,154.008844017 | 0 | 261.435730688 | 1,537,507.711157861 | 2,613,847.903469663 | -1,076,340.192311802 | 41.1783% | **DISCREPANCY >1%** |
| 99 | 217,529.329419552 | 72,004.601807409 | 0 | 272.650694747 | 145,941.59538324 | 145,252.076917396 | +689.518465844 | 0.4747% | OK |
| 100 | 1,799,789.095590657 | 201,831.869356847 | 8,577.774654887 | 262.477567767 | 1,136,482.892106863 | 1,589,116.974011156 | -452,634.081904293 | 28.4833% | **DISCREPANCY >1%** |
| 101 | 2,301,504.793430326 | 96,709.729814995 | 147,162.212142243 | 263.978266758 | 1,352,453.090541984 | 2,057,368.87320633 | -704,915.782664346 | 34.2629% | **DISCREPANCY >1%** |
| 102 | 843,139.314854854 | 50,526.561897738 | 158,995.005398752 | 264.295649425 | 571,127.582889633 | 633,353.451908939 | -62,225.869019306 | 9.8248% | **DISCREPANCY >1%** |
| 103 | 96,665.397144062 | 99,945.222911754 | 0 | 63.12211178 | 75,398.326108155 | 0 | +75,398.326108155 | ∞% | **DISCREPANCY >1%** |
| 104 | 3,062,963.342942101 | 0 | 8,693.224149186 | 266.763791118 | 2,725,130.208756965 | 3,054,003.355001797 | -328,873.146244832 | 10.7685% | **DISCREPANCY >1%** |
| 105 | 1,922,173.239530911 | 24,337.695348448 | 196,109.398896326 | 267.242109169 | 1,278,846.154813373 | 1,701,458.903176968 | -422,612.748363595 | 24.8382% | **DISCREPANCY >1%** |
| 106 | 2,376,981.760564706 | 144,209.176940372 | 53,273.846844962 | 269.301424903 | 1,487,849.779485208 | 2,179,229.435354469 | -691,379.655869261 | 31.7258% | **DISCREPANCY >1%** |
| 107 | 1,412,302.563889882 | 75,002.822267192 | 259,165.198913629 | 269.014369494 | 768,379.69328733 | 1,077,865.528339567 | -309,485.835052237 | 28.7128% | **DISCREPANCY >1%** |
| 108 | 1,530,515.515126298 | 44,888.690492425 | 38,862.313667517 | 271.752965261 | 1,054,527.794798477 | 1,446,492.758001095 | -391,964.963202618 | 27.0976% | **DISCREPANCY >1%** |
| 109 | 1,408,920.281801709 | 223,698.068310612 | 70,026.821602108 | 272.413033399 | 715,168.920824128 | 1,114,922.97885559 | -399,754.058031462 | 35.8548% | **DISCREPANCY >1%** |
| 110 | 2,492,963.507197642 | 0 | 114,614.938825144 | 272.551432269 | 1,729,173.602489589 | 2,378,076.016940229 | -648,902.41445064 | 27.2868% | **DISCREPANCY >1%** |
| 111 | 3,442,694.711521751 | 192,321.702770461 | 337,717.260844435 | 273.903836716 | 2,421,207.348894766 | 2,912,381.844070139 | -491,174.495175373 | 16.8650% | **DISCREPANCY >1%** |
| 112 | 1,865,762.736981223 | 173,200.851403845 | 85,660.90276259 | 275.726524844 | 858,535.424827937 | 1,606,625.256289944 | -748,089.831462007 | 46.5628% | **DISCREPANCY >1%** |
| 113 | 1,426,474.253958655 | 223,287.331033099 | 24,443.416711791 | 276.823731003 | 723,051.673206953 | 1,178,466.682482762 | -455,415.009275809 | 38.6447% | **DISCREPANCY >1%** |
| 114 | 1,394,586.127889164 | 54,534.060998196 | 206,406.548782749 | 276.314211223 | 818,971.595299437 | 1,133,369.203896996 | -314,397.608597559 | 27.7400% | **DISCREPANCY >1%** |
| 115 | 1,527,491.977031515 | 196,982.31937977 | 0 | 278.241311562 | 674,736.540831756 | 1,330,231.416340183 | -655,494.875508427 | 49.2767% | **DISCREPANCY >1%** |
| 116 | 498,322.033277975 | 129,797.29432009 | 46,438.331747847 | 278.098963556 | 322,456.895400295 | 321,808.308246482 | +648.587153813 | 0.2015% | OK |
| 117 | 1,577,386.159372488 | 0 | 110,042.604483153 | 280.659242896 | 1,182,843.699577966 | 1,467,062.895646439 | -284,219.196068473 | 19.3733% | **DISCREPANCY >1%** |
| 118 | 2,024,048.920306349 | 153,349.352006901 | 100,459.246518578 | 280.259844736 | 1,610,600.660779731 | 1,769,960.061936134 | -159,359.401156403 | 9.0035% | **DISCREPANCY >1%** |
| 119 | 1,493,335.518002894 | 127,462.331317651 | 0 | 282.161251258 | 720,015.01421028 | 1,365,591.025433985 | -645,576.011223705 | 47.2744% | **DISCREPANCY >1%** |
| 120 | 2,546,731.136709875 | 3,986.862247885 | 172,130.504874982 | 282.028677013 | 2,203,582.648794662 | 2,370,331.740909995 | -166,749.092115333 | 7.0348% | **DISCREPANCY >1%** |
| 121 | 2,766,646.954076083 | 211,264.855121109 | 0 | 283.990935576 | 1,535,311.697079252 | 2,555,098.108019398 | -1,019,786.410940146 | 39.9118% | **DISCREPANCY >1%** |
| 122 | 494,831.449887162 | 223,698.06146747 | 41,001.922983965 | 285.071585446 | 212,399.087082206 | 229,846.393850281 | -17,447.306768075 | 7.5908% | **DISCREPANCY >1%** |
| 123 | 1,850,354.345164228 | 117,012.394161995 | 40,622.003819962 | 286.954694251 | 1,545,775.094847816 | 1,692,432.99248802 | -146,657.897640204 | 8.6655% | **DISCREPANCY >1%** |
| 124 | 3,304,783.563189016 | 92,313.326894099 | 196,706.271624392 | 286.202246441 | 2,213,958.401766367 | 3,015,477.762424084 | -801,519.360657717 | 26.5801% | **DISCREPANCY >1%** |
| 125 | 2,325,821.430010415 | 223,698.068375433 | 7,964.547109056 | 288.897169573 | 1,109,743.523235324 | 2,093,869.917356353 | -984,126.394121029 | 47.0003% | **DISCREPANCY >1%** |
| 126 | 1,107,635.577479887 | 101,570.16062343 | 215,477.375953641 | 288.623123332 | 506,364.309783089 | 790,299.417779484 | -283,935.107996395 | 35.9275% | **DISCREPANCY >1%** |
| 127 | 2,802,819.648141101 | 201,728.715858691 | 45.025794905 | 290.3213441 | 1,653,334.165428989 | 2,600,755.585143405 | -947,421.419714416 | 36.4286% | **DISCREPANCY >1%** |
| 128 | 2,676,785.343533691 | 0 | 34,715.84016103 | 291.261683829 | 2,459,320.890947386 | 2,641,778.241688832 | -182,457.350741446 | 6.9066% | **DISCREPANCY >1%** |

## After upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,484,429.267183304 | 826,743.498270167 | 17,184.489564018 | 8.761008791 | 1,659,801.187848141 | 1,640,492.518340328 | +19,308.669507813 | 1.1770% | **DISCREPANCY >1%** |
| 2 | 3,328,531.356043044 | 635,713.572381259 | 277.903743213 | 172.500851142 | 2,711,313.00299156 | 2,692,367.37906743 | +18,945.62392413 | 0.7036% | OK |
| 3 | 2,802,698.398481609 | 578,475.334942498 | 164,516.992780565 | 172.126595335 | 2,078,448.8879906 | 2,059,533.944163211 | +18,914.943827389 | 0.9184% | OK |
| 4 | 3,503,421.721637558 | 553,023.967435256 | 157,414.98693836 | 173.029751163 | 2,811,300.435005442 | 2,792,809.737512779 | +18,490.697492663 | 0.6620% | OK |
| 5 | 2,998,771.896537086 | 1,488,257.228963462 | 3,605.996868261 | 174.281869913 | 1,525,624.786765432 | 1,506,734.38883545 | +18,890.397929982 | 1.2537% | **DISCREPANCY >1%** |
| 6 | 2,715,887.911458657 | 185,360.665463109 | 97,097.786802825 | 177.346869963 | 2,451,996.683773013 | 2,433,252.11232276 | +18,744.571450253 | 0.7703% | OK |
| 7 | 3,129,931.311512733 | 36,084.978602376 | 23,076.821212896 | 177.075388483 | 3,089,552.962272271 | 3,070,592.436308978 | +18,960.525963293 | 0.6174% | OK |
| 8 | 3,034,754.148215924 | 780,868.154271859 | 68,570.866841294 | 177.086928499 | 2,204,088.317242778 | 2,185,138.040174272 | +18,950.277068506 | 0.8672% | OK |
| 9 | 3,941,020.457850385 | 1,134,490.320449541 | 162,572.01978783 | 178.118320411 | 2,662,702.753243412 | 2,643,779.999292603 | +18,922.753950809 | 0.7157% | OK |
| 10 | 3,118,101.600023772 | 718,954.77036203 | 3,919.775094447 | 179.688883111 | 2,413,820.773748008 | 2,395,047.365684184 | +18,773.408063824 | 0.7838% | OK |
| 11 | 2,980,606.14532312 | 1,145,934.992162841 | 129,209.593885488 | 180.661334527 | 1,724,261.701431808 | 1,705,280.897940264 | +18,980.803491544 | 1.1130% | **DISCREPANCY >1%** |
| 12 | 3,360,247.048608388 | 1,522,132.651258694 | 0 | 182.292698 | 1,856,786.281218517 | 1,837,932.104651694 | +18,854.176566823 | 1.0258% | **DISCREPANCY >1%** |
| 13 | 2,419,729.443340406 | 593,048.370031793 | 16,582.21426827 | 182.761479035 | 1,828,953.545731635 | 1,809,916.097561308 | +19,037.448170327 | 1.0518% | **DISCREPANCY >1%** |
| 14 | 3,059,204.25751119 | 1,180,371.405325601 | 129,813.067943654 | 183.278374939 | 1,767,865.10047261 | 1,748,836.505866996 | +19,028.594605614 | 1.0880% | **DISCREPANCY >1%** |
| 15 | 1,282,858.988071219 | 354,654.991781899 | 218,448.297529623 | 184.096217258 | 716,745.344324384 | 709,571.602542439 | +7,173.741781945 | 1.0109% | **DISCREPANCY >1%** |
| 16 | 292,251.056082386 | 106,491.578931276 | 9,125.331581653 | 186.086571508 | 219,971.692133916 | 176,448.058997949 | +43,523.633135967 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,642.046177454 | 340,475.604612198 | 112,043.371043054 | 186.35759599 | 2,591,753.716854974 | 2,572,936.712926212 | +18,817.003928762 | 0.7313% | OK |
| 18 | 3,221,520.3581729 | 327,278.331731401 | 184,937.037344576 | 423.502768768 | 2,728,012.390175507 | 2,708,881.486328155 | +19,130.903847352 | 0.7062% | OK |
| 19 | 2,545,327.709646974 | 1,005,152.040322882 | 720.458921392 | 188.424919912 | 1,558,366.405120635 | 1,539,266.785482788 | +19,099.619637847 | 1.2408% | **DISCREPANCY >1%** |
| 20 | 3,151,574.118117668 | 1,318,019.090795353 | 0 | 190.646865488 | 1,852,324.660431886 | 1,833,364.380456827 | +18,960.279975059 | 1.0341% | **DISCREPANCY >1%** |
| 21 | 3,446,340.944539729 | 811,563.250445903 | 12,526.594993624 | 191.58337607 | 2,641,137.2895972 | 2,622,059.515724132 | +19,077.773873068 | 0.7275% | OK |
| 22 | 3,424,687.078972077 | 1,181,104.166041112 | 8,538.815663423 | 192.74205111 | 2,253,922.90864158 | 2,234,851.355216432 | +19,071.553425148 | 0.8533% | OK |
| 23 | 4,040,896.136284042 | 1,085,012.60808004 | 257,565.47245039 | 193.24155071 | 2,717,035.06015898 | 2,698,124.814202902 | +18,910.245956078 | 0.7008% | OK |
| 24 | 3,641,689.385197894 | 581,611.381123771 | 113,298.120046902 | 194.496276113 | 2,964,647.656840732 | 2,946,585.387751108 | +18,062.269089624 | 0.6129% | OK |
| 25 | 4,116,559.160734956 | 872,691.458855825 | 0 | 194.348350595 | 3,262,570.098652547 | 3,243,673.353528536 | +18,896.745124011 | 0.5825% | OK |
| 26 | 776,673.346869401 | 91,065.541425466 | 16,231.463886896 | 195.885745816 | 673,306.86442606 | 669,180.455811223 | +4,126.408614837 | 0.6166% | OK |
| 27 | 3,217,078.984189999 | 1,225,488.394288307 | 114.576078423 | 199.326060407 | 2,010,230.893396306 | 1,991,276.687762862 | +18,954.205633444 | 0.9518% | OK |
| 28 | 4,652,630.696835296 | 1,380,136.946029568 | 146,400.10094306 | 197.21018718 | 3,144,789.333292944 | 3,125,896.439675488 | +18,892.893617456 | 0.6043% | OK |
| 29 | 2,898,487.592659301 | 610,829.352749762 | 0 | 199.726660963 | 2,306,335.831049477 | 2,287,458.513248576 | +18,877.317800901 | 0.8252% | OK |
| 30 | 3,382,568.048550954 | 710,234.099517005 | 22,914.692387486 | 200.461152404 | 2,667,110.572279116 | 2,649,218.795494059 | +17,891.776785057 | 0.6753% | OK |
| 31 | 1,586,502.687500347 | 660,846.230518782 | 38,096.765184011 | 200.694922325 | 893,531.693731475 | 887,358.996875229 | +6,172.696856246 | 0.6956% | OK |
| 32 | 3,427,211.832587246 | 17,419.272873098 | 94,980.465258985 | 202.895902584 | 3,333,422.893428039 | 3,314,609.198552579 | +18,813.69487546 | 0.5675% | OK |
| 33 | 2,301,821.488129727 | 584,226.582883127 | 87,386.176516869 | 203.090754822 | 1,649,218.144611554 | 1,630,005.637974909 | +19,212.506636645 | 1.1786% | **DISCREPANCY >1%** |
| 34 | 2,517,738.03170896 | 359,469.273754254 | 133,526.051378088 | 203.353990359 | 2,043,591.427143987 | 2,024,539.352586259 | +19,052.074557728 | 0.9410% | OK |
| 35 | 2,988,521.927713479 | 266,886.343998939 | 95,598.20397956 | 206.133908821 | 2,644,675.94827133 | 2,625,831.245826159 | +18,844.702445171 | 0.7176% | OK |
| 36 | 627,881.239072002 | 131,286.518958231 | 37,538.851627533 | 207.003480322 | 464,701.809419829 | 458,848.865005916 | +5,852.944413913 | 1.2755% | **DISCREPANCY >1%** |
| 37 | 3,572,546.215572503 | 1,209,281.44508295 | 0 | 207.373593976 | 2,381,932.136047951 | 2,363,057.396895577 | +18,874.739152374 | 0.7987% | OK |
| 38 | 1,473,085.668350261 | 485,297.062238848 | 104,918.626950339 | 852.101524217 | 886,266.551300017 | 882,017.877636857 | +4,248.67366316 | 0.4816% | OK |
| 39 | 3,166,425.553195886 | 1,460,083.628868387 | 29,373.416255258 | 208.780998127 | 1,695,429.468557074 | 1,676,759.727074114 | +18,669.74148296 | 1.1134% | **DISCREPANCY >1%** |
| 40 | 326,995.733918726 | 74,153.423804429 | 128,034.305600759 | 209.517385192 | 176,741.448835177 | 124,598.487128346 | +52,142.961706831 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,163.611654056 | 973,744.279818439 | 217,217.580368984 | 210.976763409 | 1,802,863.651482052 | 1,783,990.774703224 | +18,872.876778828 | 1.0579% | **DISCREPANCY >1%** |
| 42 | 2,595,033.142096049 | 430,642.557214966 | 0 | 212.919954619 | 2,183,122.943907032 | 2,164,177.664926464 | +18,945.278980568 | 0.8754% | OK |
| 43 | 3,052,777.884567396 | 857,879.953518064 | 418.387877525 | 213.0161502 | 2,212,435.691834392 | 2,194,266.527021607 | +18,169.164812785 | 0.8280% | OK |
| 44 | 4,012,367.924612871 | 506,394.124946002 | 126,790.845954819 | 213.029336245 | 3,398,459.104068 | 3,378,969.924375805 | +19,489.179692195 | 0.5767% | OK |
| 45 | 3,011,742.442172559 | 1,021,886.089454556 | 0 | 216.877745738 | 2,008,703.116929344 | 1,989,639.474972265 | +19,063.641957079 | 0.9581% | OK |
| 46 | 3,510,708.597918791 | 920,454.734537479 | 93,394.806384354 | 216.017693844 | 2,515,548.15997582 | 2,496,643.039303114 | +18,905.120672706 | 0.7572% | OK |
| 47 | 1,295,519.895427735 | 588,653.185177574 | 22,924.082606544 | 217.661885469 | 687,673.465762526 | 683,724.965758148 | +3,948.500004378 | 0.5774% | OK |
| 48 | 3,107,525.04985937 | 695,492.461656953 | 101,664.859193657 | 218.700853068 | 2,328,846.687272452 | 2,310,149.028155692 | +18,697.65911676 | 0.8093% | OK |
| 49 | 2,017,866.173416144 | 694,094.772062343 | 164,458.998623078 | 218.470969152 | 1,164,300.147403006 | 1,159,093.931761571 | +5,206.215641435 | 0.4491% | OK |
| 50 | 3,236,905.049890369 | 467,621.462714429 | 40,263.969667629 | 219.870419974 | 2,747,775.456897652 | 2,728,799.747088337 | +18,975.709809315 | 0.6953% | OK |
| 51 | 3,694,836.004473923 | 1,171,146.945421614 | 153,202.536985814 | 220.01488153 | 2,389,201.875098131 | 2,370,266.507184965 | +18,935.367913166 | 0.7988% | OK |
| 52 | 2,952,107.070821844 | 1,077,162.060889068 | 90.395967424 | 221.761205235 | 1,893,408.234763284 | 1,874,632.852760117 | +18,775.382003167 | 1.0015% | **DISCREPANCY >1%** |
| 53 | 4,587,446.229047678 | 520,242.333818612 | 83,435.33267438 | 222.141069512 | 4,002,412.306866003 | 3,983,546.421485174 | +18,865.885380829 | 0.4735% | OK |
| 54 | 3,774,196.691772849 | 562,924.886719164 | 43,761.132345373 | 224.262086172 | 3,186,263.949667802 | 3,167,286.41062214 | +18,977.539045662 | 0.5991% | OK |
| 55 | 2,799,327.289393601 | 316,092.836118957 | 94,545.881062638 | 226.1346051 | 2,407,570.599805009 | 2,388,462.437606906 | +19,108.162198103 | 0.8000% | OK |
| 56 | 2,646,396.264136623 | 774,485.915914827 | 13,997.922202342 | 225.282503594 | 1,876,658.38095267 | 1,857,687.14351586 | +18,971.23743681 | 1.0212% | **DISCREPANCY >1%** |
| 57 | 825,767.111178675 | 317,596.320183395 | 70,615.680938887 | 226.648963686 | 442,264.988899287 | 437,328.461092707 | +4,936.52780658 | 1.1287% | **DISCREPANCY >1%** |
| 58 | 297,293.290570974 | 161,966.767161337 | 0 | 77.223144227 | 228,682.61780516 | 135,249.30026541 | +93,433.31753975 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,723.959417721 | 440,939.168981065 | 122,883.114116497 | 231.495433111 | 2,648,586.34800194 | 2,629,670.180887048 | +18,916.167114892 | 0.7193% | OK |
| 60 | 3,738,928.573624944 | 628,958.607866544 | 40,528.882878666 | 230.011153464 | 3,088,309.198855045 | 3,069,211.07172627 | +19,098.127128775 | 0.6222% | OK |
| 61 | 4,368,641.684413816 | 808,370.14496251 | 81,349.965654783 | 230.599154629 | 3,497,985.843054945 | 3,478,690.974641894 | +19,294.868413051 | 0.5546% | OK |
| 62 | 2,639,372.235443744 | 184,174.273336392 | 43,104.221180943 | 231.315194543 | 2,431,187.062364878 | 2,411,862.425731866 | +19,324.636633012 | 0.8012% | OK |
| 63 | 3,817,253.881916889 | 725,439.396179942 | 147,122.953648498 | 232.616747354 | 2,963,791.083203702 | 2,944,458.915341095 | +19,332.167862607 | 0.6565% | OK |
| 64 | 3,340,761.704731164 | 267,933.276542149 | 166,752.345714629 | 233.063767957 | 2,925,100.024232174 | 2,905,843.018706429 | +19,257.005525745 | 0.6626% | OK |
| 65 | 3,223,177.02667184 | 939,351.125453697 | 71.722624687 | 236.953625578 | 2,290,879.611105601 | 2,283,517.224967878 | +7,362.386137723 | 0.3224% | OK |
| 66 | 3,355,557.767963545 | 876,389.726869251 | 83,262.913449555 | 236.876365679 | 2,399,574.013147158 | 2,395,668.25127906 | +3,905.761868098 | 0.1630% | OK |
| 67 | 818,225.005618122 | 275,635.793013465 | 132,264.88633962 | 236.548133079 | 415,753.341684633 | 410,087.778131958 | +5,665.563552675 | 1.3815% | **DISCREPANCY >1%** |
| 68 | 3,606,507.220121364 | 681,206.505097183 | 169,948.534888687 | 237.156427275 | 2,757,678.262310717 | 2,755,115.023708219 | +2,563.238602498 | 0.0930% | OK |
| 69 | 1,127,747.983729383 | 281,678.898945926 | 59,604.102841208 | 238.154576649 | 789,692.225967185 | 786,226.8273656 | +3,465.398601585 | 0.4407% | OK |
| 70 | 38,323.22374926 | 148.169094182 | 0 | 174.182726687 | 38,149.040995632 | 38,000.871928391 | +148.169067241 | 0.3899% | OK |
| 71 | 4,185,112.677766843 | 876,438.347763752 | 85,705.37638208 | 241.451983454 | 3,225,073.636749908 | 3,222,727.501637557 | +2,346.135112351 | 0.0727% | OK |
| 72 | 2,486,795.251902087 | 383,273.725113362 | 0 | 242.603932778 | 2,105,694.740466461 | 2,103,278.922855947 | +2,415.817610514 | 0.1148% | OK |
| 73 | 3,280,372.920420528 | 1,468,954.069047113 | 0 | 243.105893983 | 1,813,676.942884909 | 1,811,175.745479432 | +2,501.197405477 | 0.1380% | OK |
| 74 | 3,335,913.259227667 | 531,791.422968235 | 94,292.343237338 | 244.356012703 | 2,712,295.874311409 | 2,709,585.137009391 | +2,710.737302018 | 0.1000% | OK |
| 75 | 3,508,556.365515116 | 784,604.879643725 | 16,896.706361065 | 244.228181423 | 2,709,395.891317406 | 2,706,810.551328903 | +2,585.339988503 | 0.0955% | OK |
| 76 | 1,014,672.381470641 | 475,840.83810665 | 4,053.056546057 | 246.70743013 | 539,215.189087256 | 534,531.779387804 | +4,683.409699452 | 0.8761% | OK |
| 77 | 3,211,831.798076511 | 140,886.89655137 | 560,753.334406754 | 246.99907564 | 2,512,507.442349621 | 2,509,944.568042747 | +2,562.874306874 | 0.1021% | OK |
| 78 | 650,039.486811965 | 64,569.373140067 | 93,439.420139376 | 248.779702564 | 497,791.007489218 | 491,781.913829958 | +6,009.09365926 | 1.2219% | **DISCREPANCY >1%** |
| 79 | 3,522,175.40837992 | 444,229.939659842 | 150,691.747105104 | 248.600830669 | 2,929,780.461334615 | 2,927,005.120784305 | +2,775.34055031 | 0.0948% | OK |
| 80 | 1,805,799.602432742 | 192,549.794495279 | 42,374.70227022 | 249.090831546 | 1,575,661.087864241 | 1,570,626.014835697 | +5,035.073028544 | 0.3205% | OK |
| 81 | 2,604,346.371969444 | 851,302.349232435 | 112,248.221164111 | 250.414012894 | 1,643,122.255968379 | 1,640,545.387560004 | +2,576.868408375 | 0.1570% | OK |
| 82 | 637,036.829536987 | 51,351.621683119 | 203,656.438410755 | 251.745850237 | 387,646.14878236 | 381,777.023592876 | +5,869.125189484 | 1.5373% | **DISCREPANCY >1%** |
| 83 | 2,655,160.094539082 | 345,172.824104195 | 208,332.711813588 | 252.256934028 | 2,105,495.312152469 | 2,101,402.301687271 | +4,093.010465198 | 0.1947% | OK |
| 84 | 573,294.241545722 | 43,139.508392941 | 25,365.155475257 | 252.999999457 | 499,568.25457856 | 504,536.577678067 | -4,968.323099507 | 0.9847% | OK |
| 85 | 2,507,837.128956982 | 496,360.999970373 | 63,690.289186988 | 255.014358252 | 1,950,373.413274667 | 1,947,530.825441369 | +2,842.587833298 | 0.1459% | OK |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,262.581541561 | 647,402.902423667 | 51,054.043826615 | 257.166257843 | 811,937.38714958 | 808,548.469033436 | +3,388.918116144 | 0.4191% | OK |
| 88 | 3,458,028.175459399 | 175,269.312981134 | 95,634.905977999 | 257.870198733 | 3,189,628.068539638 | 3,186,866.086301533 | +2,761.982238105 | 0.0866% | OK |
| 89 | 2,763,932.852090179 | 600,426.954984618 | 187,748.849811315 | 259.328223098 | 1,978,297.520002656 | 1,975,497.719071148 | +2,799.800931508 | 0.1417% | OK |
| 90 | 140,119.393099798 | 116,392.269522858 | 0 | 96.032188452 | 140,001.653399788 | 23,631.091388488 | +116,370.5620113 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,454.267951639 | 399,376.775480423 | 55,172.531471408 | 260.197144663 | 543,685.801296443 | 538,644.763855145 | +5,041.037441298 | 0.9358% | OK |
| 92 | 382,882.228663509 | 176,927.850467173 | 41,186.988026446 | 262.17815151 | 165,518.197370141 | 164,505.21201838 | +1,012.985351761 | 0.6157% | OK |
| 93 | 3,180,205.031470475 | 1,085,835.159306595 | 10,627.627825955 | 262.306172525 | 2,086,451.787267245 | 2,083,479.9381654 | +2,971.849101845 | 0.1426% | OK |
| 94 | 1,582,834.5781042 | 680,196.760099128 | 6,977.120150346 | 264.37173955 | 901,263.328629545 | 895,396.326115176 | +5,867.002514369 | 0.6552% | OK |
| 95 | 2,823,500.04876599 | 975,818.72867639 | 92,584.118277643 | 264.028885649 | 1,759,219.58729414 | 1,754,833.172926308 | +4,386.414367832 | 0.2499% | OK |
| 96 | 672,930.803045531 | 223,924.687813565 | 67,499.464576751 | 265.31306353 | 387,490.176423779 | 381,241.337591685 | +6,248.838832094 | 1.6390% | **DISCREPANCY >1%** |
| 97 | 941,698.260338353 | 70,872.776437572 | 251,257.793158077 | 266.065141928 | 624,754.286624672 | 619,301.625600776 | +5,452.661023896 | 0.8804% | OK |
| 98 | 2,790,270.348044368 | 1,255,490.393926426 | 0 | 268.435730674 | 1,537,507.711157861 | 1,534,511.518387268 | +2,996.192770593 | 0.1952% | OK |
| 99 | 217,536.329419552 | 72,004.601807409 | 0 | 279.650694732 | 145,941.59538324 | 145,252.076917411 | +689.518465829 | 0.4747% | OK |
| 100 | 1,799,796.095590657 | 659,972.413440104 | 8,577.774654887 | 269.47756775 | 1,136,482.892106863 | 1,130,976.429927916 | +5,506.462178947 | 0.4868% | OK |
| 101 | 2,301,511.793430326 | 806,501.042836516 | 147,162.212142243 | 270.978266744 | 1,352,453.090541984 | 1,347,577.560184823 | +4,875.530357161 | 0.3617% | OK |
| 102 | 843,146.314854854 | 118,084.708059441 | 158,995.005398752 | 271.29564941 | 571,127.582889633 | 565,795.305747251 | +5,332.277142382 | 0.9424% | OK |
| 103 | 96,672.397144062 | 99,945.222911754 | 0 | 54.995329358 | 75,413.452890563 | 0 | +75,413.452890563 | ∞% | **DISCREPANCY >1%** |
| 104 | 3,062,970.342942101 | 340,321.172598343 | 8,693.224149186 | 273.763791103 | 2,725,130.208756965 | 2,713,682.182403469 | +11,448.026353496 | 0.4218% | OK |
| 105 | 1,922,180.793806211 | 451,644.439901403 | 196,109.953171626 | 274.242109154 | 1,278,846.154813373 | 1,274,152.158624028 | +4,693.996189345 | 0.3684% | OK |
| 106 | 2,376,988.760564706 | 838,637.534343767 | 53,273.846844962 | 276.301424888 | 1,487,849.779485208 | 1,484,801.077951089 | +3,048.701534119 | 0.2053% | OK |
| 107 | 1,412,312.141125273 | 389,715.783508211 | 259,167.77614902 | 276.014369479 | 768,379.69328733 | 763,152.567098563 | +5,227.126188767 | 0.6849% | OK |
| 108 | 1,530,522.515126298 | 442,784.567664372 | 38,862.313667517 | 278.752965246 | 1,054,527.794798477 | 1,048,596.880829163 | +5,930.913969314 | 0.5656% | OK |
| 109 | 1,408,927.281801709 | 626,919.832814457 | 70,026.821602108 | 279.413033383 | 715,168.920824128 | 711,701.214351761 | +3,467.706472367 | 0.4872% | OK |
| 110 | 2,492,971.120034324 | 653,602.202903777 | 114,615.551661826 | 279.551432255 | 1,729,173.602489589 | 1,724,473.814036466 | +4,699.788453123 | 0.2725% | OK |
| 111 | 3,442,701.711521751 | 686,963.807461569 | 337,717.260844435 | 280.903836701 | 2,421,207.348894766 | 2,417,739.739379046 | +3,467.60951572 | 0.1434% | OK |
| 112 | 1,865,769.736981223 | 925,696.620748774 | 85,660.90276259 | 282.726524829 | 858,535.424827937 | 854,129.48694503 | +4,405.937882907 | 0.5158% | OK |
| 113 | 1,426,481.253958655 | 682,486.06189204 | 24,443.416711791 | 283.823730988 | 723,051.673206953 | 719,267.951623836 | +3,783.721583117 | 0.5260% | OK |
| 114 | 1,394,594.655959569 | 373,811.447473431 | 206,408.076853154 | 283.314211207 | 818,971.595299437 | 814,091.817421777 | +4,879.77787766 | 0.5994% | OK |
| 115 | 1,527,498.977031515 | 857,494.572895518 | 0 | 285.241311547 | 674,736.540831756 | 669,719.16282445 | +5,017.378007306 | 0.7491% | OK |
| 116 | 498,329.033277975 | 129,797.29432009 | 46,438.331747847 | 285.09896354 | 322,456.895400295 | 321,808.308246498 | +648.587153797 | 0.2015% | OK |
| 117 | 1,577,393.159372488 | 289,424.602021989 | 110,042.604483153 | 287.659242881 | 1,182,843.699577966 | 1,177,638.293624465 | +5,205.405953501 | 0.4420% | OK |
| 118 | 2,024,055.920306349 | 317,975.810452995 | 100,459.246518578 | 287.25984472 | 1,610,600.660779731 | 1,605,333.603490056 | +5,267.057289675 | 0.3280% | OK |
| 119 | 1,493,342.518002894 | 776,537.885713869 | 0 | 289.161251244 | 720,015.01421028 | 716,515.471037781 | +3,499.543172499 | 0.4884% | OK |
| 120 | 2,546,741.759690444 | 174,299.388959302 | 172,134.127855551 | 289.028676998 | 2,203,582.648794662 | 2,200,019.214198593 | +3,563.434596069 | 0.1619% | OK |
| 121 | 2,766,653.954076083 | 1,234,341.176086707 | 0 | 290.990935562 | 1,535,311.697079252 | 1,532,021.787053814 | +3,289.910025438 | 0.2147% | OK |
| 122 | 494,838.449887162 | 246,465.034375573 | 41,001.922983965 | 292.071585431 | 212,399.087082206 | 207,079.420942193 | +5,319.666140013 | 2.5689% | **DISCREPANCY >1%** |
| 123 | 1,850,361.345164228 | 266,836.118126159 | 40,622.003819962 | 293.954694236 | 1,545,775.094847816 | 1,542,609.268523871 | +3,165.826323945 | 0.2052% | OK |
| 124 | 3,304,792.88395198 | 897,004.632666029 | 196,708.592387356 | 293.202246427 | 2,213,958.401766367 | 2,210,786.456652168 | +3,171.945114199 | 0.1434% | OK |
| 125 | 2,325,828.430010415 | 1,211,161.002135291 | 7,964.547109056 | 295.897169557 | 1,109,743.523235324 | 1,106,406.983596511 | +3,336.539638813 | 0.3015% | OK |
| 126 | 1,107,642.577479887 | 389,824.564372371 | 215,477.375953641 | 295.623123316 | 506,364.309783089 | 502,045.014030559 | +4,319.29575253 | 0.8603% | OK |
| 127 | 2,802,826.648141101 | 1,152,511.702574029 | 45.025794905 | 297.321344086 | 1,653,334.165428989 | 1,649,972.598428081 | +3,361.567000908 | 0.2037% | OK |
| 128 | 2,676,792.343533691 | 186,014.794503201 | 34,715.84016103 | 298.261683814 | 2,459,320.890947386 | 2,455,763.447185646 | +3,557.44376174 | 0.1448% | OK |

## Discrepancies greater than 1%

| Phase | Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| before | 1 | 2,484,422.267183304 | 165,012.699896644 | 17,184.489564018 | 96.97482357 | 1,659,729.728281817 | 2,302,128.102899072 | -642,398.374617255 | 27.9045% | **DISCREPANCY >1%** |
| before | 2 | 3,328,524.356043044 | 186,958.253739906 | 277.903743213 | 165.500851158 | 2,711,313.00299156 | 3,141,122.697708767 | -429,809.694717207 | 13.6833% | **DISCREPANCY >1%** |
| before | 3 | 2,802,687.518698846 | 0.468119708 | 164,513.112997802 | 165.12659535 | 2,078,448.8879906 | 2,638,008.810985986 | -559,559.922995386 | 21.2114% | **DISCREPANCY >1%** |
| before | 4 | 3,503,411.071435473 | 13,456.73137153 | 157,411.336736275 | 166.029751178 | 2,811,300.435005442 | 3,332,376.97357649 | -521,076.538571048 | 15.6367% | **DISCREPANCY >1%** |
| before | 5 | 2,998,764.389298738 | 209,823.537800336 | 3,605.489629913 | 167.281869929 | 1,525,624.786765432 | 2,785,168.07999856 | -1,259,543.293233128 | 45.2232% | **DISCREPANCY >1%** |
| before | 6 | 2,715,880.911458657 | 23,468.530961558 | 97,097.786802825 | 170.346869978 | 2,451,996.683773013 | 2,595,144.246824296 | -143,147.563051283 | 5.5159% | **DISCREPANCY >1%** |
| before | 8 | 3,034,743.246777442 | 170,998.084151705 | 68,566.965402812 | 170.086928514 | 2,204,088.317242778 | 2,795,008.110294411 | -590,919.793051633 | 21.1419% | **DISCREPANCY >1%** |
| before | 9 | 3,941,012.160853394 | 189,930.97794848 | 162,570.722790839 | 171.118320425 | 2,662,702.753243412 | 3,588,339.34179365 | -925,636.588550238 | 25.7956% | **DISCREPANCY >1%** |
| before | 10 | 3,118,094.600023772 | 223,846.079166223 | 3,919.775094447 | 172.688883125 | 2,413,820.773748008 | 2,890,156.056879977 | -476,335.283131969 | 16.4812% | **DISCREPANCY >1%** |
| before | 11 | 2,980,597.781308894 | 58,843.162874805 | 129,208.229871262 | 173.661334543 | 1,724,261.701431808 | 2,792,372.727228284 | -1,068,111.025796476 | 38.2510% | **DISCREPANCY >1%** |
| before | 12 | 3,360,240.048608388 | 222,508.114052081 | 0 | 175.292698014 | 1,856,786.281218517 | 3,137,556.641858293 | -1,280,770.360639776 | 40.8206% | **DISCREPANCY >1%** |
| before | 13 | 2,419,722.443340406 | 148,967.172896852 | 16,582.21426827 | 175.761479049 | 1,828,953.545731635 | 2,253,997.294696235 | -425,043.7489646 | 18.8573% | **DISCREPANCY >1%** |
| before | 14 | 3,059,197.25751119 | 220,189.208395156 | 129,813.067943654 | 176.278374955 | 1,767,865.10047261 | 2,709,018.702797425 | -941,153.602324815 | 34.7414% | **DISCREPANCY >1%** |
| before | 15 | 1,282,849.48291697 | 52,905.700586193 | 218,445.792375374 | 177.096217272 | 716,745.344324384 | 1,011,320.893738131 | -294,575.549413747 | 29.1278% | **DISCREPANCY >1%** |
| before | 16 | 292,244.056082386 | 106,491.578931276 | 9,125.331581653 | 179.086571522 | 219,971.692133916 | 176,448.058997935 | +43,523.633135981 | 24.6665% | **DISCREPANCY >1%** |
| before | 17 | 3,025,632.589421456 | 35,067.621313474 | 112,040.914287056 | 179.357596006 | 2,591,753.716854974 | 2,878,344.69622492 | -286,590.979369946 | 9.9567% | **DISCREPANCY >1%** |
| before | 18 | 3,221,513.3581729 | 82,212.573733221 | 184,937.037344576 | 416.502768782 | 2,728,012.390175507 | 2,953,947.244326321 | -225,934.854150814 | 7.6485% | **DISCREPANCY >1%** |
| before | 19 | 2,545,320.554298479 | 203,827.261478907 | 720.303572897 | 181.424919927 | 1,558,366.405120635 | 2,340,591.564326748 | -782,225.159206113 | 33.4199% | **DISCREPANCY >1%** |
| before | 20 | 3,151,567.118117668 | 223,846.079145155 | 0 | 183.646865502 | 1,852,324.660431886 | 2,927,537.392107011 | -1,075,212.731675125 | 36.7275% | **DISCREPANCY >1%** |
| before | 21 | 3,446,333.944539729 | 160,850.042236821 | 12,526.594993624 | 184.583376084 | 2,641,137.2895972 | 3,272,772.7239332 | -631,635.434336 | 19.2997% | **DISCREPANCY >1%** |
| before | 22 | 3,424,680.078972077 | 161,827.727614681 | 8,538.815663423 | 185.742051125 | 2,253,922.90864158 | 3,254,127.793642848 | -1,000,204.885001268 | 30.7364% | **DISCREPANCY >1%** |
| before | 23 | 4,040,889.136284042 | 117,779.002762432 | 257,565.47245039 | 186.241550725 | 2,717,035.06015898 | 3,665,358.419520495 | -948,323.359361515 | 25.8725% | **DISCREPANCY >1%** |
| before | 24 | 3,641,682.385197894 | 75,925.654771513 | 113,298.120046902 | 187.496276129 | 2,964,647.656840732 | 3,452,271.11410335 | -487,623.457262618 | 14.1247% | **DISCREPANCY >1%** |
| before | 25 | 4,116,552.160734956 | 223,846.079136167 | 0 | 187.348350609 | 3,262,570.098652547 | 3,892,518.73324818 | -629,948.634595633 | 16.1835% | **DISCREPANCY >1%** |
| before | 26 | 776,666.346869401 | 73,459.26989387 | 16,231.463886896 | 188.88574583 | 673,306.86442606 | 686,786.727342805 | -13,479.862916745 | 1.9627% | **DISCREPANCY >1%** |
| before | 27 | 3,217,071.984189999 | 223,846.079203415 | 114.576078423 | 192.326060423 | 2,010,230.893396306 | 2,992,919.002847738 | -982,688.109451432 | 32.8337% | **DISCREPANCY >1%** |
| before | 28 | 4,652,621.012171653 | 176,806.130994487 | 146,397.416279417 | 190.210187197 | 3,144,789.333292944 | 4,329,227.254710552 | -1,184,437.921417608 | 27.3591% | **DISCREPANCY >1%** |
| before | 29 | 2,898,480.592659301 | 0 | 0 | 192.726660978 | 2,306,335.831049477 | 2,898,287.865998323 | -591,952.034948846 | 20.4241% | **DISCREPANCY >1%** |
| before | 30 | 3,382,561.048550954 | 223,846.079129087 | 22,914.692387486 | 193.461152421 | 2,667,110.572279116 | 3,135,606.81588196 | -468,496.243602844 | 14.9411% | **DISCREPANCY >1%** |
| before | 31 | 1,586,495.687500347 | 223,846.079187058 | 38,096.765184011 | 193.694922339 | 893,531.693731475 | 1,324,359.148206939 | -430,827.454475464 | 32.5310% | **DISCREPANCY >1%** |
| before | 33 | 2,301,814.054268018 | 89,682.65958267 | 87,385.74265516 | 196.090754836 | 1,649,218.144611554 | 2,124,549.561275352 | -475,331.416663798 | 22.3732% | **DISCREPANCY >1%** |
| before | 34 | 2,517,728.033211587 | 0 | 133,523.052880715 | 196.353990375 | 2,043,591.427143987 | 2,384,008.626340497 | -340,417.19919651 | 14.2791% | **DISCREPANCY >1%** |
| before | 35 | 2,988,514.927713479 | 0 | 95,598.20397956 | 199.133908836 | 2,644,675.94827133 | 2,892,717.589825083 | -248,041.641553753 | 8.5746% | **DISCREPANCY >1%** |
| before | 36 | 627,874.239072002 | 9,298.851890397 | 37,538.851627533 | 200.003480336 | 464,701.809419829 | 580,836.532073736 | -116,134.722653907 | 19.9943% | **DISCREPANCY >1%** |
| before | 37 | 3,572,539.215572503 | 223,846.079137807 | 0 | 200.373593991 | 2,381,932.136047951 | 3,348,492.762840705 | -966,560.626792754 | 28.8655% | **DISCREPANCY >1%** |
| before | 38 | 1,473,077.086140111 | 139,486.240803376 | 104,917.044740189 | 845.101524232 | 886,266.551300017 | 1,227,828.699072314 | -341,562.147772297 | 27.8183% | **DISCREPANCY >1%** |
| before | 39 | 3,166,418.553195886 | 172,663.511264212 | 29,373.416255258 | 201.780998142 | 1,695,429.468557074 | 2,964,179.844678274 | -1,268,750.3761212 | 42.8027% | **DISCREPANCY >1%** |
| before | 40 | 326,988.733918726 | 74,153.423804429 | 128,034.305600759 | 202.517385206 | 176,741.448835177 | 124,598.487128332 | +52,142.961706845 | 41.8487% | **DISCREPANCY >1%** |
| before | 41 | 2,975,156.611654056 | 204,063.185350324 | 217,217.580368984 | 203.976763425 | 1,802,863.651482052 | 2,553,671.869171323 | -750,808.217689271 | 29.4011% | **DISCREPANCY >1%** |
| before | 42 | 2,595,026.142096049 | 223,846.079158774 | 0 | 205.919954633 | 2,183,122.943907032 | 2,370,974.142982642 | -187,851.19907561 | 7.9229% | **DISCREPANCY >1%** |
| before | 43 | 3,052,770.884567396 | 179,562.708609502 | 418.387877525 | 206.016150215 | 2,212,435.691834392 | 2,872,583.771930154 | -660,148.080095762 | 22.9809% | **DISCREPANCY >1%** |
| before | 44 | 4,012,356.985556405 | 82,938.546710406 | 126,786.906898353 | 206.02933626 | 3,398,459.104068 | 3,802,425.502611386 | -403,966.398543386 | 10.6239% | **DISCREPANCY >1%** |
| before | 45 | 3,011,735.442172559 | 186,957.988153914 | 0 | 209.877745753 | 2,008,703.116929344 | 2,824,567.576272892 | -815,864.459343548 | 28.8845% | **DISCREPANCY >1%** |
| before | 46 | 3,510,701.597918791 | 140,033.673137159 | 93,394.806384354 | 209.017693858 | 2,515,548.15997582 | 3,277,064.10070342 | -761,515.9407276 | 23.2377% | **DISCREPANCY >1%** |
| before | 47 | 1,295,512.895427735 | 221,936.771527767 | 22,924.082606544 | 210.661885483 | 687,673.465762526 | 1,050,441.379407941 | -362,767.913645415 | 34.5348% | **DISCREPANCY >1%** |
| before | 48 | 3,107,518.04985937 | 0 | 101,664.859193657 | 211.700853083 | 2,328,846.687272452 | 3,005,641.48981263 | -676,794.802540178 | 22.5174% | **DISCREPANCY >1%** |
| before | 49 | 2,017,858.850546894 | 120,325.749958529 | 164,458.675753828 | 211.470969167 | 1,164,300.147403006 | 1,732,862.95386537 | -568,562.806462364 | 32.8106% | **DISCREPANCY >1%** |
| before | 50 | 3,236,898.049890369 | 84,285.185243783 | 40,263.969667629 | 212.87041999 | 2,747,775.456897652 | 3,112,136.024558967 | -364,360.567661315 | 11.7077% | **DISCREPANCY >1%** |
| before | 51 | 3,694,825.065195113 | 105,922.936515629 | 153,198.597707004 | 213.014881545 | 2,389,201.875098131 | 3,435,490.516090935 | -1,046,288.640992804 | 30.4552% | **DISCREPANCY >1%** |
| before | 52 | 2,952,100.070821844 | 223,846.079128825 | 90.395967424 | 214.761205249 | 1,893,408.234763284 | 2,727,948.834520346 | -834,540.599757062 | 30.5922% | **DISCREPANCY >1%** |
| before | 53 | 4,587,435.236941434 | 165,100.951333266 | 83,431.340568136 | 215.141069526 | 4,002,412.306866003 | 4,338,687.803970506 | -336,275.497104503 | 7.7506% | **DISCREPANCY >1%** |
| before | 54 | 3,774,189.691772849 | 104,605.505486405 | 43,761.132345373 | 217.262086186 | 3,186,263.949667802 | 3,625,605.791854885 | -439,341.842187083 | 12.1177% | **DISCREPANCY >1%** |
| before | 55 | 2,799,320.289393601 | 9,506.992017657 | 94,545.881062638 | 219.134605116 | 2,407,570.599805009 | 2,695,048.28170819 | -287,477.681903181 | 10.6668% | **DISCREPANCY >1%** |
| before | 56 | 2,646,389.264136623 | 147,253.342830014 | 13,997.922202342 | 218.28250361 | 1,876,658.38095267 | 2,484,919.716600657 | -608,261.335647987 | 24.4781% | **DISCREPANCY >1%** |
| before | 57 | 825,760.111178675 | 223,846.079159495 | 70,615.680938887 | 219.6489637 | 442,264.988899287 | 531,078.702116593 | -88,813.713217306 | 16.7232% | **DISCREPANCY >1%** |
| before | 58 | 297,286.290570974 | 161,966.767161337 | 0 | 70.223144242 | 228,682.61780516 | 135,249.300265395 | +93,433.317539765 | 69.0822% | **DISCREPANCY >1%** |
| before | 59 | 3,193,716.959417721 | 71,891.198873536 | 122,883.114116497 | 224.495433125 | 2,648,586.34800194 | 2,998,718.150994563 | -350,131.802992623 | 11.6760% | **DISCREPANCY >1%** |
| before | 60 | 3,738,921.573624944 | 121,459.892472139 | 40,528.882878666 | 223.011153479 | 3,088,309.198855045 | 3,576,709.78712066 | -488,400.588265615 | 13.6550% | **DISCREPANCY >1%** |
| before | 61 | 4,368,632.657147251 | 113,406.497793948 | 81,347.938388218 | 223.599154643 | 3,497,985.843054945 | 4,173,654.621810442 | -675,668.778755497 | 16.1889% | **DISCREPANCY >1%** |
| before | 62 | 2,639,363.147155989 | 1,029.291966503 | 43,102.132893188 | 224.315194557 | 2,431,187.062364878 | 2,595,007.407101741 | -163,820.344736863 | 6.3129% | **DISCREPANCY >1%** |
| before | 63 | 3,817,245.034631839 | 0 | 147,121.106363448 | 225.616747369 | 2,963,791.083203702 | 3,669,898.311521022 | -706,107.22831732 | 19.2405% | **DISCREPANCY >1%** |
| before | 64 | 3,340,750.710189858 | 44,721.605785854 | 166,748.351173323 | 226.063767972 | 2,925,100.024232174 | 3,129,054.689462709 | -203,954.665230535 | 6.5180% | **DISCREPANCY >1%** |
| before | 65 | 3,223,170.02667184 | 204,139.305947923 | 71.722624687 | 229.953625592 | 2,290,879.611105601 | 3,018,729.044473638 | -727,849.433368037 | 24.1111% | **DISCREPANCY >1%** |
| before | 66 | 3,355,550.767963545 | 58,498.893235066 | 83,262.913449555 | 229.876365693 | 2,399,574.013147158 | 3,213,559.084913231 | -813,985.071766073 | 25.3297% | **DISCREPANCY >1%** |
| before | 67 | 818,218.005618122 | 94,182.859728691 | 132,264.88633962 | 229.548133094 | 415,753.341684633 | 591,540.711416717 | -175,787.369732084 | 29.7168% | **DISCREPANCY >1%** |
| before | 68 | 3,606,496.406104598 | 51,820.059551198 | 169,944.720871921 | 230.15642729 | 2,757,678.262310717 | 3,384,501.469254189 | -626,823.206943472 | 18.5203% | **DISCREPANCY >1%** |
| before | 69 | 1,127,740.983729383 | 223,846.079187092 | 59,604.102841208 | 231.154576664 | 789,692.225967185 | 844,059.647124419 | -54,367.421157234 | 6.4411% | **DISCREPANCY >1%** |
| before | 71 | 4,185,105.677766843 | 96,876.088940082 | 85,705.37638208 | 234.451983468 | 3,225,073.636749908 | 4,002,289.760461213 | -777,216.123711305 | 19.4192% | **DISCREPANCY >1%** |
| before | 72 | 2,486,788.251902087 | 221,779.667597505 | 0 | 235.603932792 | 2,105,694.740466461 | 2,264,772.98037179 | -159,078.239905329 | 7.0240% | **DISCREPANCY >1%** |
| before | 73 | 3,280,365.920420528 | 223,846.079132607 | 0 | 236.105893997 | 1,813,676.942884909 | 3,056,283.735393924 | -1,242,606.792509015 | 40.6574% | **DISCREPANCY >1%** |
| before | 74 | 3,335,906.259227667 | 0 | 94,292.343237338 | 237.356012717 | 2,712,295.874311409 | 3,241,376.559977612 | -529,080.685666203 | 16.3227% | **DISCREPANCY >1%** |
| before | 75 | 3,508,545.764052575 | 203,423.332505008 | 16,893.104898524 | 237.228181438 | 2,709,395.891317406 | 3,287,992.098467605 | -578,596.207150199 | 17.5972% | **DISCREPANCY >1%** |
| before | 76 | 1,014,665.381470641 | 179,713.432857498 | 4,053.056546057 | 239.707430145 | 539,215.189087256 | 830,659.184636941 | -291,443.995549685 | 35.0858% | **DISCREPANCY >1%** |
| before | 77 | 3,211,824.798076511 | 0 | 560,753.334406754 | 239.999075655 | 2,512,507.442349621 | 2,650,831.464594102 | -138,324.022244481 | 5.2181% | **DISCREPANCY >1%** |
| before | 78 | 650,032.486811965 | 6,499.356268383 | 93,439.420139376 | 241.779702579 | 497,791.007489218 | 549,851.930701627 | -52,060.923212409 | 9.4681% | **DISCREPANCY >1%** |
| before | 79 | 3,522,166.862271233 | 63,794.223490279 | 150,690.200996417 | 241.600830685 | 2,929,780.461334615 | 3,307,440.836953852 | -377,660.375619237 | 11.4185% | **DISCREPANCY >1%** |
| before | 80 | 1,805,792.602432742 | 144,923.552045991 | 42,374.70227022 | 242.090831563 | 1,575,661.087864241 | 1,618,252.257284968 | -42,591.169420727 | 2.6319% | **DISCREPANCY >1%** |
| before | 81 | 2,604,337.832756389 | 20,523.249052955 | 112,246.681951056 | 243.414012908 | 1,643,122.255968379 | 2,471,324.48773947 | -828,202.231771091 | 33.5124% | **DISCREPANCY >1%** |
| before | 82 | 637,029.829536987 | 1,033.20576559 | 203,656.438410755 | 244.745850252 | 387,646.14878236 | 432,095.43951039 | -44,449.29072803 | 10.2869% | **DISCREPANCY >1%** |
| before | 83 | 2,655,153.094539082 | 0 | 208,332.711813588 | 245.256934043 | 2,105,495.312152469 | 2,446,575.125791451 | -341,079.813638982 | 13.9411% | **DISCREPANCY >1%** |
| before | 84 | 573,287.241545722 | 4,045.485421068 | 25,365.155475257 | 245.999999472 | 499,568.25457856 | 543,630.600649925 | -44,062.346071365 | 8.1051% | **DISCREPANCY >1%** |
| before | 85 | 2,507,830.019391255 | 101,240.455860461 | 63,690.179621261 | 248.014358267 | 1,950,373.413274667 | 2,342,651.369551266 | -392,277.956276599 | 16.7450% | **DISCREPANCY >1%** |
| before | 87 | 1,507,255.581541561 | 223,698.068303363 | 51,054.043826615 | 250.166257857 | 811,937.38714958 | 1,232,253.303153726 | -420,315.916004146 | 34.1095% | **DISCREPANCY >1%** |
| before | 88 | 3,458,021.082944634 | 42,432.314973574 | 95,634.813463234 | 250.870198749 | 3,189,628.068539638 | 3,319,703.084309077 | -130,075.015769439 | 3.9182% | **DISCREPANCY >1%** |
| before | 89 | 2,763,925.852090179 | 184,424.496583798 | 187,748.849811315 | 252.328223113 | 1,978,297.520002656 | 2,391,500.177471953 | -413,202.657469297 | 17.2779% | **DISCREPANCY >1%** |
| before | 90 | 140,112.393099798 | 116,392.269522858 | 0 | 89.032188467 | 140,001.653399788 | 23,631.091388473 | +116,370.562011315 | 492.4468% | **DISCREPANCY >1%** |
| before | 91 | 993,446.950070142 | 160,524.915777216 | 55,172.213589911 | 253.197144677 | 543,685.801296443 | 777,496.623558338 | -233,810.822261895 | 30.0722% | **DISCREPANCY >1%** |
| before | 93 | 3,180,195.854592287 | 181,921.200099591 | 10,625.450947767 | 255.306172541 | 2,086,451.787267245 | 2,987,393.897372388 | -900,942.110105143 | 30.1581% | **DISCREPANCY >1%** |
| before | 94 | 1,582,827.5781042 | 216,580.400930509 | 6,977.120150346 | 257.371739565 | 901,263.328629545 | 1,359,012.68528378 | -457,749.356654235 | 33.6824% | **DISCREPANCY >1%** |
| before | 95 | 2,823,493.04876599 | 223,698.068303101 | 92,584.118277643 | 257.028885663 | 1,759,219.58729414 | 2,506,953.833299583 | -747,734.246005443 | 29.8264% | **DISCREPANCY >1%** |
| before | 96 | 672,923.803045531 | 130,829.78226522 | 67,499.464576751 | 258.313063545 | 387,490.176423779 | 474,336.243140015 | -86,846.066716236 | 18.3089% | **DISCREPANCY >1%** |
| before | 97 | 941,689.278695497 | 24,305.834427164 | 251,255.811515221 | 259.065141943 | 624,754.286624672 | 665,868.567611169 | -41,114.280986497 | 6.1745% | **DISCREPANCY >1%** |
| before | 98 | 2,790,263.348044368 | 176,154.008844017 | 0 | 261.435730688 | 1,537,507.711157861 | 2,613,847.903469663 | -1,076,340.192311802 | 41.1783% | **DISCREPANCY >1%** |
| before | 100 | 1,799,789.095590657 | 201,831.869356847 | 8,577.774654887 | 262.477567767 | 1,136,482.892106863 | 1,589,116.974011156 | -452,634.081904293 | 28.4833% | **DISCREPANCY >1%** |
| before | 101 | 2,301,504.793430326 | 96,709.729814995 | 147,162.212142243 | 263.978266758 | 1,352,453.090541984 | 2,057,368.87320633 | -704,915.782664346 | 34.2629% | **DISCREPANCY >1%** |
| before | 102 | 843,139.314854854 | 50,526.561897738 | 158,995.005398752 | 264.295649425 | 571,127.582889633 | 633,353.451908939 | -62,225.869019306 | 9.8248% | **DISCREPANCY >1%** |
| before | 103 | 96,665.397144062 | 99,945.222911754 | 0 | 63.12211178 | 75,398.326108155 | 0 | +75,398.326108155 | ∞% | **DISCREPANCY >1%** |
| before | 104 | 3,062,963.342942101 | 0 | 8,693.224149186 | 266.763791118 | 2,725,130.208756965 | 3,054,003.355001797 | -328,873.146244832 | 10.7685% | **DISCREPANCY >1%** |
| before | 105 | 1,922,173.239530911 | 24,337.695348448 | 196,109.398896326 | 267.242109169 | 1,278,846.154813373 | 1,701,458.903176968 | -422,612.748363595 | 24.8382% | **DISCREPANCY >1%** |
| before | 106 | 2,376,981.760564706 | 144,209.176940372 | 53,273.846844962 | 269.301424903 | 1,487,849.779485208 | 2,179,229.435354469 | -691,379.655869261 | 31.7258% | **DISCREPANCY >1%** |
| before | 107 | 1,412,302.563889882 | 75,002.822267192 | 259,165.198913629 | 269.014369494 | 768,379.69328733 | 1,077,865.528339567 | -309,485.835052237 | 28.7128% | **DISCREPANCY >1%** |
| before | 108 | 1,530,515.515126298 | 44,888.690492425 | 38,862.313667517 | 271.752965261 | 1,054,527.794798477 | 1,446,492.758001095 | -391,964.963202618 | 27.0976% | **DISCREPANCY >1%** |
| before | 109 | 1,408,920.281801709 | 223,698.068310612 | 70,026.821602108 | 272.413033399 | 715,168.920824128 | 1,114,922.97885559 | -399,754.058031462 | 35.8548% | **DISCREPANCY >1%** |
| before | 110 | 2,492,963.507197642 | 0 | 114,614.938825144 | 272.551432269 | 1,729,173.602489589 | 2,378,076.016940229 | -648,902.41445064 | 27.2868% | **DISCREPANCY >1%** |
| before | 111 | 3,442,694.711521751 | 192,321.702770461 | 337,717.260844435 | 273.903836716 | 2,421,207.348894766 | 2,912,381.844070139 | -491,174.495175373 | 16.8650% | **DISCREPANCY >1%** |
| before | 112 | 1,865,762.736981223 | 173,200.851403845 | 85,660.90276259 | 275.726524844 | 858,535.424827937 | 1,606,625.256289944 | -748,089.831462007 | 46.5628% | **DISCREPANCY >1%** |
| before | 113 | 1,426,474.253958655 | 223,287.331033099 | 24,443.416711791 | 276.823731003 | 723,051.673206953 | 1,178,466.682482762 | -455,415.009275809 | 38.6447% | **DISCREPANCY >1%** |
| before | 114 | 1,394,586.127889164 | 54,534.060998196 | 206,406.548782749 | 276.314211223 | 818,971.595299437 | 1,133,369.203896996 | -314,397.608597559 | 27.7400% | **DISCREPANCY >1%** |
| before | 115 | 1,527,491.977031515 | 196,982.31937977 | 0 | 278.241311562 | 674,736.540831756 | 1,330,231.416340183 | -655,494.875508427 | 49.2767% | **DISCREPANCY >1%** |
| before | 117 | 1,577,386.159372488 | 0 | 110,042.604483153 | 280.659242896 | 1,182,843.699577966 | 1,467,062.895646439 | -284,219.196068473 | 19.3733% | **DISCREPANCY >1%** |
| before | 118 | 2,024,048.920306349 | 153,349.352006901 | 100,459.246518578 | 280.259844736 | 1,610,600.660779731 | 1,769,960.061936134 | -159,359.401156403 | 9.0035% | **DISCREPANCY >1%** |
| before | 119 | 1,493,335.518002894 | 127,462.331317651 | 0 | 282.161251258 | 720,015.01421028 | 1,365,591.025433985 | -645,576.011223705 | 47.2744% | **DISCREPANCY >1%** |
| before | 120 | 2,546,731.136709875 | 3,986.862247885 | 172,130.504874982 | 282.028677013 | 2,203,582.648794662 | 2,370,331.740909995 | -166,749.092115333 | 7.0348% | **DISCREPANCY >1%** |
| before | 121 | 2,766,646.954076083 | 211,264.855121109 | 0 | 283.990935576 | 1,535,311.697079252 | 2,555,098.108019398 | -1,019,786.410940146 | 39.9118% | **DISCREPANCY >1%** |
| before | 122 | 494,831.449887162 | 223,698.06146747 | 41,001.922983965 | 285.071585446 | 212,399.087082206 | 229,846.393850281 | -17,447.306768075 | 7.5908% | **DISCREPANCY >1%** |
| before | 123 | 1,850,354.345164228 | 117,012.394161995 | 40,622.003819962 | 286.954694251 | 1,545,775.094847816 | 1,692,432.99248802 | -146,657.897640204 | 8.6655% | **DISCREPANCY >1%** |
| before | 124 | 3,304,783.563189016 | 92,313.326894099 | 196,706.271624392 | 286.202246441 | 2,213,958.401766367 | 3,015,477.762424084 | -801,519.360657717 | 26.5801% | **DISCREPANCY >1%** |
| before | 125 | 2,325,821.430010415 | 223,698.068375433 | 7,964.547109056 | 288.897169573 | 1,109,743.523235324 | 2,093,869.917356353 | -984,126.394121029 | 47.0003% | **DISCREPANCY >1%** |
| before | 126 | 1,107,635.577479887 | 101,570.16062343 | 215,477.375953641 | 288.623123332 | 506,364.309783089 | 790,299.417779484 | -283,935.107996395 | 35.9275% | **DISCREPANCY >1%** |
| before | 127 | 2,802,819.648141101 | 201,728.715858691 | 45.025794905 | 290.3213441 | 1,653,334.165428989 | 2,600,755.585143405 | -947,421.419714416 | 36.4286% | **DISCREPANCY >1%** |
| before | 128 | 2,676,785.343533691 | 0 | 34,715.84016103 | 291.261683829 | 2,459,320.890947386 | 2,641,778.241688832 | -182,457.350741446 | 6.9066% | **DISCREPANCY >1%** |
| after | 1 | 2,484,429.267183304 | 826,743.498270167 | 17,184.489564018 | 8.761008791 | 1,659,801.187848141 | 1,640,492.518340328 | +19,308.669507813 | 1.1770% | **DISCREPANCY >1%** |
| after | 5 | 2,998,771.896537086 | 1,488,257.228963462 | 3,605.996868261 | 174.281869913 | 1,525,624.786765432 | 1,506,734.38883545 | +18,890.397929982 | 1.2537% | **DISCREPANCY >1%** |
| after | 11 | 2,980,606.14532312 | 1,145,934.992162841 | 129,209.593885488 | 180.661334527 | 1,724,261.701431808 | 1,705,280.897940264 | +18,980.803491544 | 1.1130% | **DISCREPANCY >1%** |
| after | 12 | 3,360,247.048608388 | 1,522,132.651258694 | 0 | 182.292698 | 1,856,786.281218517 | 1,837,932.104651694 | +18,854.176566823 | 1.0258% | **DISCREPANCY >1%** |
| after | 13 | 2,419,729.443340406 | 593,048.370031793 | 16,582.21426827 | 182.761479035 | 1,828,953.545731635 | 1,809,916.097561308 | +19,037.448170327 | 1.0518% | **DISCREPANCY >1%** |
| after | 14 | 3,059,204.25751119 | 1,180,371.405325601 | 129,813.067943654 | 183.278374939 | 1,767,865.10047261 | 1,748,836.505866996 | +19,028.594605614 | 1.0880% | **DISCREPANCY >1%** |
| after | 15 | 1,282,858.988071219 | 354,654.991781899 | 218,448.297529623 | 184.096217258 | 716,745.344324384 | 709,571.602542439 | +7,173.741781945 | 1.0109% | **DISCREPANCY >1%** |
| after | 16 | 292,251.056082386 | 106,491.578931276 | 9,125.331581653 | 186.086571508 | 219,971.692133916 | 176,448.058997949 | +43,523.633135967 | 24.6665% | **DISCREPANCY >1%** |
| after | 19 | 2,545,327.709646974 | 1,005,152.040322882 | 720.458921392 | 188.424919912 | 1,558,366.405120635 | 1,539,266.785482788 | +19,099.619637847 | 1.2408% | **DISCREPANCY >1%** |
| after | 20 | 3,151,574.118117668 | 1,318,019.090795353 | 0 | 190.646865488 | 1,852,324.660431886 | 1,833,364.380456827 | +18,960.279975059 | 1.0341% | **DISCREPANCY >1%** |
| after | 33 | 2,301,821.488129727 | 584,226.582883127 | 87,386.176516869 | 203.090754822 | 1,649,218.144611554 | 1,630,005.637974909 | +19,212.506636645 | 1.1786% | **DISCREPANCY >1%** |
| after | 36 | 627,881.239072002 | 131,286.518958231 | 37,538.851627533 | 207.003480322 | 464,701.809419829 | 458,848.865005916 | +5,852.944413913 | 1.2755% | **DISCREPANCY >1%** |
| after | 39 | 3,166,425.553195886 | 1,460,083.628868387 | 29,373.416255258 | 208.780998127 | 1,695,429.468557074 | 1,676,759.727074114 | +18,669.74148296 | 1.1134% | **DISCREPANCY >1%** |
| after | 40 | 326,995.733918726 | 74,153.423804429 | 128,034.305600759 | 209.517385192 | 176,741.448835177 | 124,598.487128346 | +52,142.961706831 | 41.8487% | **DISCREPANCY >1%** |
| after | 41 | 2,975,163.611654056 | 973,744.279818439 | 217,217.580368984 | 210.976763409 | 1,802,863.651482052 | 1,783,990.774703224 | +18,872.876778828 | 1.0579% | **DISCREPANCY >1%** |
| after | 52 | 2,952,107.070821844 | 1,077,162.060889068 | 90.395967424 | 221.761205235 | 1,893,408.234763284 | 1,874,632.852760117 | +18,775.382003167 | 1.0015% | **DISCREPANCY >1%** |
| after | 56 | 2,646,396.264136623 | 774,485.915914827 | 13,997.922202342 | 225.282503594 | 1,876,658.38095267 | 1,857,687.14351586 | +18,971.23743681 | 1.0212% | **DISCREPANCY >1%** |
| after | 57 | 825,767.111178675 | 317,596.320183395 | 70,615.680938887 | 226.648963686 | 442,264.988899287 | 437,328.461092707 | +4,936.52780658 | 1.1287% | **DISCREPANCY >1%** |
| after | 58 | 297,293.290570974 | 161,966.767161337 | 0 | 77.223144227 | 228,682.61780516 | 135,249.30026541 | +93,433.31753975 | 69.0822% | **DISCREPANCY >1%** |
| after | 67 | 818,225.005618122 | 275,635.793013465 | 132,264.88633962 | 236.548133079 | 415,753.341684633 | 410,087.778131958 | +5,665.563552675 | 1.3815% | **DISCREPANCY >1%** |
| after | 78 | 650,039.486811965 | 64,569.373140067 | 93,439.420139376 | 248.779702564 | 497,791.007489218 | 491,781.913829958 | +6,009.09365926 | 1.2219% | **DISCREPANCY >1%** |
| after | 82 | 637,036.829536987 | 51,351.621683119 | 203,656.438410755 | 251.745850237 | 387,646.14878236 | 381,777.023592876 | +5,869.125189484 | 1.5373% | **DISCREPANCY >1%** |
| after | 90 | 140,119.393099798 | 116,392.269522858 | 0 | 96.032188452 | 140,001.653399788 | 23,631.091388488 | +116,370.5620113 | 492.4468% | **DISCREPANCY >1%** |
| after | 96 | 672,930.803045531 | 223,924.687813565 | 67,499.464576751 | 265.31306353 | 387,490.176423779 | 381,241.337591685 | +6,248.838832094 | 1.6390% | **DISCREPANCY >1%** |
| after | 103 | 96,672.397144062 | 99,945.222911754 | 0 | 54.995329358 | 75,413.452890563 | 0 | +75,413.452890563 | ∞% | **DISCREPANCY >1%** |
| after | 122 | 494,838.449887162 | 246,465.034375573 | 41,001.922983965 | 292.071585431 | 212,399.087082206 | 207,079.420942193 | +5,319.666140013 | 2.5689% | **DISCREPANCY >1%** |

## Accounting definitions

- Actual staked alpha: sum of every `TotalHotkeyAlpha(hotkey, netuid)` value.
- Pending alpha: `PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + PendingOwnerCut + PendingBasketDeposits`.
- Calculated staked alpha: saturating `SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha - pending alpha`.
- Discrepancy percentage: `abs(actual - calculated) / calculated × 100`.
