# Subnet ownership conviction and alpha accounting

Generated: 2026-08-12T17:43:16.929Z

## Run summary

| Phase | Block | Runtime | Migration complete | Subnets | King calculation mismatches | Alpha discrepancies >1% |
|---|---:|---|---|---:|---:|---:|
| before | 8 | node-subtensor/443 | false | 128 | 0 | 121 |
| after | 28 | node-subtensor/445 | true | 128 | 0 | 26 |

> **Migration verification:** the historical-alpha correction applied on the clone despite its non-mainnet genesis `0x57a26328383c75e8d0089bced04da375d90811ad2b0072633efdccfb1bf13c80`. Subnet 1 expected approximately `+661,707.044125477 α` and observed `+661,730.798373523 α`; this closely matched after other generation-rebase corrections. After all migrations, `26` subnets exceed 1% discrepancy.

The pre-upgrade ownership threshold is `10% × SubnetAlphaOut`. The post-upgrade threshold is `10% × (SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha)`. Conviction forecasts roll the four aggregate lock buckets forward with the runtime exponential equations and evaluate only scheduled epoch checks. Clone-local block numbers are rebased onto the preserved mainnet BlockHash window before evaluating registration age or lock evolution. Forecasts assume no future lock transactions and hold alpha supply/counters constant. “Not projected” means no qualifying different-owner king was found in the 10-year forecast window.

## Subnet 3 comparison with TaoSwap

At review time, the [TaoSwap conviction page](https://taoswap.org/explore/subnets/3/conviction) showed approximately `244.29K α` conviction against the live pre-upgrade `281.36K α` threshold, with about `19 days` still maturing. This clone was exported from a different mainnet block, so its corrected pre-upgrade snapshot is `246,380.7499 α` against `280,268.5964 α`, predicting `11.8 days`. After the experimental upgrade, subnet 3 requires `205,971.8071 α`; the existing conviction already clears that threshold, so its takeover interval is `0`.

## Changed subnet ownership takeover predictions

| Subnet netuid | Predicted takeover time interval before | Predicted takeover king before | Predicted takeover time interval after | Predicted takeover king after |
|---:|---|---|---|---|
| 3 | 11.8 days | `5E6yHkm…MUpnqG` | 0 | `5E6yHkm…MUpnqG` |
| 20 | 2.8 days | `5ED4s3B…qpwW2Q` | 0 | `5ED4s3B…qpwW2Q` |
| 24 | 29.6 days | `5ELAvsv…v5WvWX` | 29.7 days | `5ELAvsv…v5WvWX` |
| 39 | 19.2 days | `5GP7c3f…SWVCMi` | 0 | `5GP7c3f…SWVCMi` |
| 81 | 7.9 days | `5H47sFL…n4wdDa` | 0 | `5H47sFL…n4wdDa` |

## Before upgrade: subnet kings and takeover projection

Snapshot clone block: `8`; projection mainnet block: `8829628` (`0xf5e8f8acebf0427693e89a25a0f021c47970def901f2513968cd73a5a904c19a`)

Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α | Gate | Mature | Projected takeover | Projected king |
|---:|---|---|---:|---:|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,833.478 | 248,442.1267 | not met | yes | not projected within 10y | — |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 332,852.3356 | met | yes | not projected within 10y | — |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 246,380.7499 | 280,268.5964 | not met | yes | 11.8 days (block 8914890) | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.1165 | 350,340.955 | not met | yes | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 299,876.3317 | not met | yes | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 271,587.9911 | met | yes | not projected within 10y | — |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 312,992.3312 | not met | yes | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,572.4092 | 303,474.1689 | met | yes | not projected within 10y | — |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 394,101.0976 | met | yes | not projected within 10y | — |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,046.854 | 311,809.36 | not met | yes | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 298,059.6586 | not met | yes | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 336,023.9049 | not met | yes | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 241,972.1443 | not met | yes | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,413.1392 | 305,919.6258 | not met | yes | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 128,284.8125 | not met | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,310.2274 | 29,224.3056 | not met | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 487,150.1698 | 302,563.1238 | met | yes | not projected within 10y | — |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 322,151.2358 | met | yes | not projected within 10y | — |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 254,531.9532 | not met | yes | not projected within 10y | — |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 287,645.9727 | 315,156.6118 | not met | yes | 2.8 days (block 8849893) | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 344,633.2945 | not met | yes | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 342,467.9079 | met | yes | not projected within 10y | — |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 476,840.0966 | 404,088.8136 | met | yes | not projected within 10y | — |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 271,755.0709 | 364,168.1385 | not met | yes | 29.6 days (block 9043024) | `5ELAvsv…v5WvWX` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 411,655.1161 | not met | yes | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 2,553.3336 | 77,666.5347 | not met | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 321,707.0984 | not met | yes | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,349.6214 | 465,261.9629 | not met | yes | not projected within 10y | — |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 289,847.9593 | not met | yes | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 338,256.0049 | not met | yes | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 158,649.4688 | met | no | not projected within 10y | — |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 342,720.3833 | met | yes | not projected within 10y | — |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.5271 | 230,181.2992 | not met | yes | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,307.3057 | 251,772.6605 | not met | yes | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,183.1071 | 298,851.3928 | not met | yes | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 62,787.3239 | met | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 357,253.8216 | not met | yes | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 38,442.8703 | 147,307.586 | not met | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 186,547.9216 | 316,641.7553 | not met | yes | 19.2 days (block 8967560) | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 32,698.7734 | not met | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 297,515.5612 | not met | yes | not projected within 10y | — |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 259,502.5142 | not met | yes | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 305,276.9885 | not met | yes | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 401,235.5423 | not met | yes | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2915 | 301,173.4442 | not met | yes | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 173,963.3631 | 351,070.0598 | not met | yes | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,593.444 | 129,551.1895 | not met | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 310,751.705 | not met | yes | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 201,785.7804 | not met | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 323,689.705 | not met | yes | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.4617 | 369,482.3502 | met | yes | not projected within 10y | — |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 295,209.9071 | not met | yes | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 458,743.3667 | not met | yes | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 377,418.8692 | met | yes | not projected within 10y | — |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 279,931.9289 | not met | yes | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 264,638.8264 | met | yes | not projected within 10y | — |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 82,575.9111 | not met | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 29,728.5291 | met | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 387,345.8231 | 319,371.5959 | met | yes | not projected within 10y | — |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,073,423.5906 | 373,892.0574 | met | yes | not projected within 10y | — |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 436,863.1368 | met | yes | not projected within 10y | — |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 148,964.7505 | 263,936.1849 | not met | yes | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 381,724.3771 | not met | yes | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,047.7293 | 334,074.914 | met | yes | not projected within 10y | — |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 322,316.9027 | not met | yes | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 335,554.9768 | met | yes | not projected within 10y | — |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 81,821.7006 | not met | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 601,812.7647 | 360,649.4861 | met | yes | not projected within 10y | — |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 112,773.9984 | not met | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,831.5224 | not met | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 418,510.4678 | not met | yes | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 504,436.922 | 248,678.7252 | met | yes | not projected within 10y | — |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 940,167.7033 | 328,036.492 | met | yes | not projected within 10y | — |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 333,590.5259 | met | yes | not projected within 10y | — |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,610.2123 | 350,854.425 | met | yes | not projected within 10y | — |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 101,466.4381 | not met | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 321,182.3798 | met | yes | not projected within 10y | — |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 65,003.1487 | not met | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 352,216.5641 | met | yes | not projected within 10y | — |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 180,579.1602 | not met | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 198,522.4157 | 260,433.6613 | not met | yes | 7.9 days (block 8886293) | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 63,702.883 | not met | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 265,515.2095 | not met | yes | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 57,328.6242 | not met | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 250,782.9004 | not met | yes | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | met | no | not projected within 10y | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,809.9967 | 150,725.4582 | met | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 345,802.007 | met | yes | not projected within 10y | — |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 276,392.4852 | not met | yes | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 14,011.1393 | met | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 73,528.6221 | 99,344.5905 | not met | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 38,287.4229 | not met | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,285.3564 | 318,019.4544 | met | yes | not projected within 10y | — |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 158,282.6578 | not met | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 282,349.2049 | not met | yes | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 149,658.0487 | 67,292.2803 | met | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 94,168.7996 | not met | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 588,407.1168 | 279,026.2348 | met | yes | not projected within 10y | — |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 21,752.8329 | not met | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 328,267.8385 | 179,978.8096 | met | no | not projected within 10y | — |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 230,150.3793 | not met | yes | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 84,313.8315 | not met | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 9,666.4397 | not met | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 306,296.2343 | not met | yes | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 200,542.7347 | 192,217.216 | met | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 272,897.1286 | 237,698.0761 | met | yes | not projected within 10y | — |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 141,230.1196 | not met | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 319,531.4532 | 153,051.4515 | met | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,573.3461 | 140,891.9282 | met | no | not projected within 10y | — |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 249,296.242 | not met | yes | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 344,269.3712 | not met | yes | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 186,576.1737 | not met | yes | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 81,418.303 | 142,647.3254 | not met | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 139,458.491 | met | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 152,749.0977 | not met | yes | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 49,832.1033 | not met | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 161,680.2345 | 157,738.5159 | met | yes | not projected within 10y | — |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 118,221.187 | 202,404.792 | not met | yes | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 149,333.4518 | not met | yes | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,234.2661 | 254,672.9619 | not met | yes | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 276,664.5954 | not met | yes | not projected within 10y | — |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 100,469.9655 | 49,483.045 | met | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 185,035.3345 | met | yes | not projected within 10y | — |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 330,478.2232 | met | yes | not projected within 10y | — |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 232,582.043 | not met | yes | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 122,562.966 | 110,763.4577 | met | no | not projected within 10y | — |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 280,281.8648 | not met | yes | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5742 | 267,678.4344 | not met | yes | not projected within 10y | — |

## After upgrade: subnet kings and takeover projection

Snapshot clone block: `28`; projection mainnet block: `8829648` (`0x8c6b5ea8286c039c9acb42161a43074031cbc5e2fd3eb8d76964561845de749a`)

Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α | Gate | Mature | Projected takeover | Projected king |
|---:|---|---|---:|---:|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,833.4782 | 164,051.3279 | met | yes | not projected within 10y | — |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 269,255.188 | met | yes | not projected within 10y | — |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 246,389.8501 | 205,971.8071 | met | yes | 0 | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.1165 | 279,299.4767 | not met | yes | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 150,692.0671 | not met | yes | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 243,344.1459 | met | yes | not projected within 10y | — |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 307,078.1512 | not met | yes | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,572.4092 | 218,532.7127 | met | yes | not projected within 10y | — |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 264,397.0118 | met | yes | not projected within 10y | — |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,046.7689 | 239,523.9055 | not met | yes | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 170,547.3559 | not met | yes | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 183,812.6397 | not met | yes | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 181,011.0859 | not met | yes | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,412.783 | 174,903.1784 | not met | yes | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 70,976.7699 | not met | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,310.4215 | 17,664.6146 | not met | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 487,150.3161 | 257,313.5071 | met | yes | not projected within 10y | — |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 270,931.6989 | met | yes | not projected within 10y | — |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 153,946.721 | met | yes | not projected within 10y | — |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 287,674.7981 | 183,356.7027 | met | yes | 0 | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 262,226.3099 | not met | yes | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 223,505.6097 | met | yes | not projected within 10y | — |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 476,839.47 | 269,833.0056 | met | yes | not projected within 10y | — |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 271,776.2463 | 294,679.1884 | not met | yes | 29.7 days (block 9043153) | `5ELAvsv…v5WvWX` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 324,387.9702 | not met | yes | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 2,553.4859 | 66,938.8342 | not met | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 199,148.8014 | not met | yes | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,349.6215 | 312,610.565 | met | yes | not projected within 10y | — |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 228,767.024 | not met | yes | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 264,943.1257 | not met | yes | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 88,757.1692 | met | no | not projected within 10y | — |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 331,482.4094 | met | yes | not projected within 10y | — |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.5272 | 163,022.0729 | not met | yes | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,305.9228 | 202,475.4707 | not met | yes | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,183.0883 | 262,604.938 | not met | yes | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 45,906.7868 | met | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 236,327.677 | not met | yes | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 38,442.0557 | 88,288.1979 | not met | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 186,571.3314 | 167,698.0508 | met | yes | 0 | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 12,482.0005 | met | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 178,421.3751 | met | yes | not projected within 10y | — |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 216,440.2585 | not met | yes | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 219,449.1543 | not met | yes | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 337,919.4954 | not met | yes | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2917 | 198,986.8353 | not met | yes | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 173,962.7902 | 249,687.1057 | not met | yes | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,594.3275 | 68,395.4628 | met | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 231,037.9729 | not met | yes | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 115,932.4403 | not met | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 272,903.1618 | not met | yes | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.461 | 237,049.8522 | met | yes | not projected within 10y | — |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 187,486.6614 | not met | yes | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 398,378.0563 | not met | yes | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 316,752.2673 | met | yes | not projected within 10y | — |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 238,870.0572 | not met | yes | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 185,792.4426 | met | yes | not projected within 10y | — |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 43,756.711 | not met | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 13,533.8523 | met | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 387,345.4989 | 262,991.3676 | met | yes | not projected within 10y | — |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,073,422.1702 | 306,945.3083 | met | yes | not projected within 10y | — |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 347,893.3574 | met | yes | not projected within 10y | — |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 148,964.6694 | 241,210.5741 | not met | yes | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 294,470.3532 | not met | yes | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,047.7065 | 290,608.8082 | met | yes | not projected within 10y | — |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 228,376.6179 | not met | yes | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 239,591.7128 | met | yes | not projected within 10y | — |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 41,033.6326 | not met | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 601,808.4544 | 275,536.418 | met | yes | not projected within 10y | — |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 78,647.6982 | not met | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,818.7055 | not met | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 322,298.0954 | not met | yes | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 504,426.2586 | 210,353.3527 | met | yes | not projected within 10y | — |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 940,169.0419 | 181,143.0851 | met | yes | not projected within 10y | — |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 270,984.1493 | met | yes | not projected within 10y | — |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,610.2123 | 270,706.678 | met | yes | not projected within 10y | — |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 53,479.0487 | met | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 251,020.3567 | met | yes | not projected within 10y | — |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 49,204.2694 | not met | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 292,726.5722 | met | yes | not projected within 10y | — |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 157,088.7106 | not met | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 198,546.3345 | 164,080.7802 | met | yes | 0 | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 38,204.0769 | not met | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 210,166.6559 | not met | yes | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 50,480.1578 | not met | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 194,779.784 | not met | yes | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | met | no | not projected within 10y | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,806.5429 | 80,881.7635 | met | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 318,713.5957 | met | yes | not projected within 10y | — |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 197,576.9047 | not met | yes | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 2,373.9124 | met | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 73,527.1934 | 53,891.6961 | met | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 16,477.939 | not met | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,285.0887 | 208,375.4244 | met | yes | not projected within 10y | — |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 89,567.2698 | not met | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 175,510.9202 | not met | yes | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 149,657.612 | 38,151.8651 | met | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 61,957.9691 | not met | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 588,394.7234 | 153,479.1954 | met | yes | not projected within 10y | — |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 14,554.3728 | not met | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 328,261.0668 | 113,125.7907 | met | no | not projected within 10y | — |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 134,786.0538 | not met | yes | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 56,607.8601 | not met | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 0 | met | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 271,396.7946 | not met | yes | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 200,541.0339 | 127,443.8401 | met | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 272,896.7717 | 148,508.9379 | met | yes | not projected within 10y | — |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 76,344.0581 | not met | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 319,524.6235 | 104,888.7634 | met | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,573.3285 | 71,199.2627 | met | no | not projected within 10y | — |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 172,476.5365 | not met | yes | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 241,803.2643 | not met | yes | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 85,442.4213 | not met | yes | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 81,416.5687 | 71,956.3775 | met | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 81,438.7132 | met | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 67,001.6404 | not met | yes | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 32,210.5407 | not met | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 161,681.7308 | 117,793.7953 | met | yes | not projected within 10y | — |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 118,220.5728 | 160,563.2863 | not met | yes | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 71,681.6632 | not met | yes | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,232.7211 | 220,032.0243 | not met | yes | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 153,232.4778 | met | yes | not projected within 10y | — |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 100,468.1828 | 20,738.3493 | met | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 154,291.5223 | met | yes | not projected within 10y | — |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 221,109.1659 | met | yes | not projected within 10y | — |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 110,671.4881 | not met | yes | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 122,566.1028 | 50,235.2637 | met | no | not projected within 10y | — |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 165,028.192 | not met | yes | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5742 | 245,607.3709 | not met | yes | not projected within 10y | — |

## Before upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,484,421.267183304 | 165,012.699896644 | 17,184.489564018 | 95.974823572 | 1,659,729.728281817 | 2,302,128.10289907 | -642,398.374617253 | 27.9045% | **DISCREPANCY >1%** |
| 2 | 3,328,523.356043044 | 186,958.253739906 | 277.903743213 | 164.50085116 | 2,711,313.00299156 | 3,141,122.697708765 | -429,809.694717205 | 13.6833% | **DISCREPANCY >1%** |
| 3 | 2,802,685.964443647 | 0.468119708 | 164,512.558742603 | 164.126595352 | 2,078,448.8879906 | 2,638,008.810985984 | -559,559.922995384 | 21.2114% | **DISCREPANCY >1%** |
| 4 | 3,503,409.549977282 | 13,456.73137153 | 157,410.815278084 | 165.02975118 | 2,811,300.435005442 | 3,332,376.973576488 | -521,076.538571046 | 15.6367% | **DISCREPANCY >1%** |
| 5 | 2,998,763.316837088 | 209,823.537800336 | 3,605.417168263 | 166.281869931 | 1,525,624.786765432 | 2,785,168.079998558 | -1,259,543.293233126 | 45.2232% | **DISCREPANCY >1%** |
| 6 | 2,715,879.911458657 | 23,468.530961558 | 97,097.786802825 | 169.346869981 | 2,451,996.683773013 | 2,595,144.246824293 | -143,147.56305128 | 5.5159% | **DISCREPANCY >1%** |
| 7 | 3,129,923.311512733 | 0 | 23,076.821212896 | 169.075388499 | 3,089,552.962272271 | 3,106,677.414911338 | -17,124.452639067 | 0.5512% | OK |
| 8 | 3,034,741.689428414 | 170,998.084151705 | 68,566.408053784 | 169.086928516 | 2,204,088.317242778 | 2,795,008.110294409 | -590,919.793051631 | 21.1419% | **DISCREPANCY >1%** |
| 9 | 3,941,010.975568307 | 189,930.97794848 | 162,570.537505752 | 170.118320427 | 2,662,702.753243412 | 3,588,339.341793648 | -925,636.588550236 | 25.7956% | **DISCREPANCY >1%** |
| 10 | 3,118,093.600023772 | 223,846.079166223 | 3,919.775094447 | 171.688883127 | 2,413,820.773748008 | 2,890,156.056879975 | -476,335.283131967 | 16.4812% | **DISCREPANCY >1%** |
| 11 | 2,980,596.586451167 | 58,843.162874805 | 129,208.035013535 | 172.661334545 | 1,724,261.701431808 | 2,792,372.727228282 | -1,068,111.025796474 | 38.2510% | **DISCREPANCY >1%** |
| 12 | 3,360,239.048608388 | 222,508.114052081 | 0 | 174.292698016 | 1,856,786.281218517 | 3,137,556.641858291 | -1,280,770.360639774 | 40.8206% | **DISCREPANCY >1%** |
| 13 | 2,419,721.443340406 | 148,967.172896852 | 16,582.21426827 | 174.761479051 | 1,828,953.545731635 | 2,253,997.294696233 | -425,043.748964598 | 18.8573% | **DISCREPANCY >1%** |
| 14 | 3,059,196.25751119 | 220,189.208395156 | 129,813.067943654 | 175.278374957 | 1,767,865.10047261 | 2,709,018.702797423 | -941,153.602324813 | 34.7414% | **DISCREPANCY >1%** |
| 15 | 1,282,848.125034767 | 52,905.700586193 | 218,445.434493171 | 176.096217274 | 716,745.344324384 | 1,011,320.893738129 | -294,575.549413745 | 29.1278% | **DISCREPANCY >1%** |
| 16 | 292,243.056082386 | 106,491.578931276 | 9,125.331581653 | 178.086571524 | 219,971.692133916 | 176,448.058997933 | +43,523.633135983 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,631.238457238 | 35,067.621313474 | 112,040.563322838 | 178.357596008 | 2,591,753.716854974 | 2,878,344.696224918 | -286,590.979369944 | 9.9567% | **DISCREPANCY >1%** |
| 18 | 3,221,512.3581729 | 82,212.573733221 | 184,937.037344576 | 415.502768784 | 2,728,012.390175507 | 2,953,947.244326319 | -225,934.854150812 | 7.6485% | **DISCREPANCY >1%** |
| 19 | 2,545,319.532106827 | 203,827.261478907 | 720.281381245 | 180.424919929 | 1,558,366.405120635 | 2,340,591.564326746 | -782,225.159206111 | 33.4199% | **DISCREPANCY >1%** |
| 20 | 3,151,566.118117668 | 223,846.079145155 | 0 | 182.646865504 | 1,852,324.660431886 | 2,927,537.392107009 | -1,075,212.731675123 | 36.7275% | **DISCREPANCY >1%** |
| 21 | 3,446,332.944539729 | 160,850.042236821 | 12,526.594993624 | 183.583376086 | 2,641,137.2895972 | 3,272,772.723933198 | -631,635.434335998 | 19.2997% | **DISCREPANCY >1%** |
| 22 | 3,424,679.078972077 | 161,827.727614681 | 8,538.815663423 | 184.742051128 | 2,253,922.90864158 | 3,254,127.793642845 | -1,000,204.885001265 | 30.7364% | **DISCREPANCY >1%** |
| 23 | 4,040,888.136284042 | 117,779.002762432 | 257,565.47245039 | 185.241550727 | 2,717,035.06015898 | 3,665,358.419520493 | -948,323.359361513 | 25.8725% | **DISCREPANCY >1%** |
| 24 | 3,641,681.385197894 | 75,925.654771513 | 113,298.120046902 | 186.496276131 | 2,964,647.656840732 | 3,452,271.114103348 | -487,623.457262616 | 14.1247% | **DISCREPANCY >1%** |
| 25 | 4,116,551.160734956 | 223,846.079136167 | 0 | 186.348350612 | 3,262,570.098652547 | 3,892,518.733248177 | -629,948.63459563 | 16.1835% | **DISCREPANCY >1%** |
| 26 | 776,665.346869401 | 73,459.26989387 | 16,231.463886896 | 187.885745832 | 673,306.86442606 | 686,786.727342803 | -13,479.862916743 | 1.9627% | **DISCREPANCY >1%** |
| 27 | 3,217,070.984189999 | 223,846.079203415 | 114.576078423 | 191.326060425 | 2,010,230.893396306 | 2,992,919.002847736 | -982,688.10945143 | 32.8337% | **DISCREPANCY >1%** |
| 28 | 4,652,619.628647653 | 176,806.130994487 | 146,397.032755417 | 189.210187199 | 3,144,789.333292944 | 4,329,227.25471055 | -1,184,437.921417606 | 27.3591% | **DISCREPANCY >1%** |
| 29 | 2,898,479.592659301 | 0 | 0 | 191.72666098 | 2,306,335.831049477 | 2,898,287.865998321 | -591,952.034948844 | 20.4241% | **DISCREPANCY >1%** |
| 30 | 3,382,560.048550954 | 223,846.079129087 | 22,914.692387486 | 192.461152424 | 2,667,110.572279116 | 3,135,606.815881957 | -468,496.243602841 | 14.9411% | **DISCREPANCY >1%** |
| 31 | 1,586,494.687500347 | 223,846.079187058 | 38,096.765184011 | 192.694922341 | 893,531.693731475 | 1,324,359.148206937 | -430,827.454475462 | 32.5310% | **DISCREPANCY >1%** |
| 32 | 3,427,203.832587246 | 0 | 94,980.465258985 | 194.895902602 | 3,333,422.893428039 | 3,332,028.471425659 | +1,394.42200238 | 0.0418% | OK |
| 33 | 2,301,812.992289183 | 89,682.65958267 | 87,385.680676325 | 195.090754838 | 1,649,218.144611554 | 2,124,549.56127535 | -475,331.416663796 | 22.3732% | **DISCREPANCY >1%** |
| 34 | 2,517,726.604855333 | 0 | 133,522.624524461 | 195.353990377 | 2,043,591.427143987 | 2,384,008.626340495 | -340,417.199196508 | 14.2791% | **DISCREPANCY >1%** |
| 35 | 2,988,513.927713479 | 0 | 95,598.20397956 | 198.133908839 | 2,644,675.94827133 | 2,892,717.58982508 | -248,041.64155375 | 8.5746% | **DISCREPANCY >1%** |
| 36 | 627,873.239072002 | 9,298.851890397 | 37,538.851627533 | 199.003480338 | 464,701.809419829 | 580,836.532073734 | -116,134.722653905 | 19.9943% | **DISCREPANCY >1%** |
| 37 | 3,572,538.215572503 | 223,846.079137807 | 0 | 199.373593994 | 2,381,932.136047951 | 3,348,492.762840702 | -966,560.626792751 | 28.8655% | **DISCREPANCY >1%** |
| 38 | 1,473,075.86010965 | 139,486.240803376 | 104,916.818709728 | 844.101524234 | 886,266.551300017 | 1,227,828.699072312 | -341,562.147772295 | 27.8183% | **DISCREPANCY >1%** |
| 39 | 3,166,417.553195886 | 172,663.511264212 | 29,373.416255258 | 200.780998144 | 1,695,429.468557074 | 2,964,179.844678272 | -1,268,750.376121198 | 42.8027% | **DISCREPANCY >1%** |
| 40 | 326,987.733918726 | 74,153.423804429 | 128,034.305600759 | 201.517385208 | 176,741.448835177 | 124,598.48712833 | +52,142.961706847 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,155.611654056 | 204,063.185350324 | 217,217.580368984 | 202.976763427 | 1,802,863.651482052 | 2,553,671.869171321 | -750,808.217689269 | 29.4011% | **DISCREPANCY >1%** |
| 42 | 2,595,025.142096049 | 223,846.079158774 | 0 | 204.919954636 | 2,183,122.943907032 | 2,370,974.142982639 | -187,851.199075607 | 7.9229% | **DISCREPANCY >1%** |
| 43 | 3,052,769.884567396 | 179,562.708609502 | 418.387877525 | 205.016150217 | 2,212,435.691834392 | 2,872,583.771930152 | -660,148.08009576 | 22.9809% | **DISCREPANCY >1%** |
| 44 | 4,012,355.422832561 | 82,938.546710406 | 126,786.344174509 | 205.029336262 | 3,398,459.104068 | 3,802,425.502611384 | -403,966.398543384 | 10.6239% | **DISCREPANCY >1%** |
| 45 | 3,011,734.442172559 | 186,957.988153914 | 0 | 208.877745755 | 2,008,703.116929344 | 2,824,567.57627289 | -815,864.459343546 | 28.8845% | **DISCREPANCY >1%** |
| 46 | 3,510,700.597918791 | 140,033.673137159 | 93,394.806384354 | 208.01769386 | 2,515,548.15997582 | 3,277,064.100703418 | -761,515.940727598 | 23.2377% | **DISCREPANCY >1%** |
| 47 | 1,295,511.895427735 | 221,936.771527767 | 22,924.082606544 | 209.661885485 | 687,673.465762526 | 1,050,441.379407939 | -362,767.913645413 | 34.5348% | **DISCREPANCY >1%** |
| 48 | 3,107,517.04985937 | 0 | 101,664.859193657 | 210.700853085 | 2,328,846.687272452 | 3,005,641.489812628 | -676,794.802540176 | 22.5174% | **DISCREPANCY >1%** |
| 49 | 2,017,857.804424445 | 120,325.749958529 | 164,458.629631379 | 210.470969169 | 1,164,300.147403006 | 1,732,862.953865368 | -568,562.806462362 | 32.8106% | **DISCREPANCY >1%** |
| 50 | 3,236,897.049890369 | 84,285.185243783 | 40,263.969667629 | 211.870419993 | 2,747,775.456897652 | 3,112,136.024558964 | -364,360.567661312 | 11.7077% | **DISCREPANCY >1%** |
| 51 | 3,694,823.502439731 | 105,922.936515629 | 153,198.034951622 | 212.014881547 | 2,389,201.875098131 | 3,435,490.516090933 | -1,046,288.640992802 | 30.4552% | **DISCREPANCY >1%** |
| 52 | 2,952,099.070821844 | 223,846.079128825 | 90.395967424 | 213.761205251 | 1,893,408.234763284 | 2,727,948.834520344 | -834,540.59975706 | 30.5922% | **DISCREPANCY >1%** |
| 53 | 4,587,433.666638048 | 165,100.951333266 | 83,430.77026475 | 214.141069528 | 4,002,412.306866003 | 4,338,687.803970504 | -336,275.497104501 | 7.7506% | **DISCREPANCY >1%** |
| 54 | 3,774,188.691772849 | 104,605.505486405 | 43,761.132345373 | 216.262086188 | 3,186,263.949667802 | 3,625,605.791854883 | -439,341.842187081 | 12.1177% | **DISCREPANCY >1%** |
| 55 | 2,799,319.289393601 | 9,506.992017657 | 94,545.881062638 | 218.134605118 | 2,407,570.599805009 | 2,695,048.281708188 | -287,477.681903179 | 10.6668% | **DISCREPANCY >1%** |
| 56 | 2,646,388.264136623 | 147,253.342830014 | 13,997.922202342 | 217.282503612 | 1,876,658.38095267 | 2,484,919.716600655 | -608,261.335647985 | 24.4781% | **DISCREPANCY >1%** |
| 57 | 825,759.111178675 | 223,846.079159495 | 70,615.680938887 | 218.648963702 | 442,264.988899287 | 531,078.702116591 | -88,813.713217304 | 16.7232% | **DISCREPANCY >1%** |
| 58 | 297,285.290570974 | 161,966.767161337 | 0 | 69.223144244 | 228,682.61780516 | 135,249.300265393 | +93,433.317539767 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,715.959417721 | 71,891.198873536 | 122,883.114116497 | 223.495433127 | 2,648,586.34800194 | 2,998,718.150994561 | -350,131.802992621 | 11.6760% | **DISCREPANCY >1%** |
| 60 | 3,738,920.573624944 | 121,459.892472139 | 40,528.882878666 | 222.011153481 | 3,088,309.198855045 | 3,576,709.787120658 | -488,400.588265613 | 13.6550% | **DISCREPANCY >1%** |
| 61 | 4,368,631.36753872 | 113,406.497793948 | 81,347.648779687 | 222.599154645 | 3,497,985.843054945 | 4,173,654.62181044 | -675,668.778755495 | 16.1889% | **DISCREPANCY >1%** |
| 62 | 2,639,361.848829962 | 1,029.291966503 | 43,101.834567161 | 223.315194559 | 2,431,187.062364878 | 2,595,007.407101739 | -163,820.344736861 | 6.3129% | **DISCREPANCY >1%** |
| 63 | 3,817,243.770735172 | 0 | 147,120.842466781 | 224.616747371 | 2,963,791.083203702 | 3,669,898.31152102 | -706,107.228317318 | 19.2405% | **DISCREPANCY >1%** |
| 64 | 3,340,749.139540234 | 44,721.605785854 | 166,747.780523699 | 225.063767975 | 2,925,100.024232174 | 3,129,054.689462706 | -203,954.665230532 | 6.5180% | **DISCREPANCY >1%** |
| 65 | 3,223,169.02667184 | 204,139.305947923 | 71.722624687 | 228.953625594 | 2,290,879.611105601 | 3,018,729.044473636 | -727,849.433368035 | 24.1111% | **DISCREPANCY >1%** |
| 66 | 3,355,549.767963545 | 58,498.893235066 | 83,262.913449555 | 228.876365695 | 2,399,574.013147158 | 3,213,559.084913229 | -813,985.071766071 | 25.3297% | **DISCREPANCY >1%** |
| 67 | 818,217.005618122 | 94,182.859728691 | 132,264.88633962 | 228.548133096 | 415,753.341684633 | 591,540.711416715 | -175,787.369732082 | 29.7168% | **DISCREPANCY >1%** |
| 68 | 3,606,494.861244011 | 51,820.059551198 | 169,944.176011334 | 229.156427292 | 2,757,678.262310717 | 3,384,501.469254187 | -626,823.20694347 | 18.5203% | **DISCREPANCY >1%** |
| 69 | 1,127,739.983729383 | 223,846.079187092 | 59,604.102841208 | 230.154576666 | 789,692.225967185 | 844,059.647124417 | -54,367.421157232 | 6.4411% | **DISCREPANCY >1%** |
| 70 | 38,315.22374926 | 148.169094182 | 0 | 166.182726704 | 38,149.040995632 | 38,000.871928374 | +148.169067258 | 0.3899% | OK |
| 71 | 4,185,104.677766843 | 96,876.088940082 | 85,705.37638208 | 233.45198347 | 3,225,073.636749908 | 4,002,289.760461211 | -777,216.123711303 | 19.4192% | **DISCREPANCY >1%** |
| 72 | 2,486,787.251902087 | 221,779.667597505 | 0 | 234.603932795 | 2,105,694.740466461 | 2,264,772.980371787 | -159,078.239905326 | 7.0240% | **DISCREPANCY >1%** |
| 73 | 3,280,364.920420528 | 223,846.079132607 | 0 | 235.105894 | 1,813,676.942884909 | 3,056,283.735393921 | -1,242,606.792509012 | 40.6574% | **DISCREPANCY >1%** |
| 74 | 3,335,905.259227667 | 0 | 94,292.343237338 | 236.356012719 | 2,712,295.874311409 | 3,241,376.55997761 | -529,080.685666201 | 16.3227% | **DISCREPANCY >1%** |
| 75 | 3,508,544.24955709 | 203,423.332505008 | 16,892.590403039 | 236.22818144 | 2,709,395.891317406 | 3,287,992.098467603 | -578,596.207150197 | 17.5972% | **DISCREPANCY >1%** |
| 76 | 1,014,664.381470641 | 179,713.432857498 | 4,053.056546057 | 238.707430148 | 539,215.189087256 | 830,659.184636938 | -291,443.995549682 | 35.0858% | **DISCREPANCY >1%** |
| 77 | 3,211,823.798076511 | 0 | 560,753.334406754 | 238.999075657 | 2,512,507.442349621 | 2,650,831.4645941 | -138,324.022244479 | 5.2181% | **DISCREPANCY >1%** |
| 78 | 650,031.486811965 | 6,499.356268383 | 93,439.420139376 | 240.779702582 | 497,791.007489218 | 549,851.930701624 | -52,060.923212406 | 9.4681% | **DISCREPANCY >1%** |
| 79 | 3,522,165.641399768 | 63,794.223490279 | 150,689.980124952 | 240.600830687 | 2,929,780.461334615 | 3,307,440.83695385 | -377,660.375619235 | 11.4185% | **DISCREPANCY >1%** |
| 80 | 1,805,791.602432742 | 144,923.552045991 | 42,374.70227022 | 241.090831565 | 1,575,661.087864241 | 1,618,252.257284966 | -42,591.169420725 | 2.6319% | **DISCREPANCY >1%** |
| 81 | 2,604,336.612870185 | 20,523.249052955 | 112,246.462064852 | 242.41401291 | 1,643,122.255968379 | 2,471,324.487739468 | -828,202.231771089 | 33.5124% | **DISCREPANCY >1%** |
| 82 | 637,028.829536987 | 1,033.20576559 | 203,656.438410755 | 243.745850254 | 387,646.14878236 | 432,095.439510388 | -44,449.290728028 | 10.2869% | **DISCREPANCY >1%** |
| 83 | 2,655,152.094539082 | 0 | 208,332.711813588 | 244.256934046 | 2,105,495.312152469 | 2,446,575.125791448 | -341,079.813638979 | 13.9411% | **DISCREPANCY >1%** |
| 84 | 573,286.241545722 | 4,045.485421068 | 25,365.155475257 | 244.999999474 | 499,568.25457856 | 543,630.600649923 | -44,062.346071363 | 8.1051% | **DISCREPANCY >1%** |
| 85 | 2,507,829.00374027 | 101,240.455860461 | 63,690.163970276 | 247.014358269 | 1,950,373.413274667 | 2,342,651.369551264 | -392,277.956276597 | 16.7450% | **DISCREPANCY >1%** |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,254.581541561 | 223,698.068303363 | 51,054.043826615 | 249.16625786 | 811,937.38714958 | 1,232,253.303153723 | -420,315.916004143 | 34.1095% | **DISCREPANCY >1%** |
| 88 | 3,458,020.069729538 | 42,432.314973574 | 95,634.800248138 | 249.870198751 | 3,189,628.068539638 | 3,319,703.084309075 | -130,075.015769437 | 3.9182% | **DISCREPANCY >1%** |
| 89 | 2,763,924.852090179 | 184,424.496583798 | 187,748.849811315 | 251.328223115 | 1,978,297.520002656 | 2,391,500.177471951 | -413,202.657469295 | 17.2779% | **DISCREPANCY >1%** |
| 90 | 140,111.393099798 | 116,392.269522858 | 0 | 88.032188469 | 140,001.653399788 | 23,631.091388471 | +116,370.562011317 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,445.904660553 | 160,524.915777216 | 55,172.168180322 | 252.197144679 | 543,685.801296443 | 777,496.623558336 | -233,810.822261893 | 30.0722% | **DISCREPANCY >1%** |
| 92 | 382,874.228663509 | 176,927.850467173 | 41,186.988026446 | 254.178151526 | 165,518.197370141 | 164,505.212018364 | +1,012.985351777 | 0.6157% | OK |
| 93 | 3,180,194.543610404 | 181,921.200099591 | 10,625.139965884 | 254.306172544 | 2,086,451.787267245 | 2,987,393.897372385 | -900,942.11010514 | 30.1581% | **DISCREPANCY >1%** |
| 94 | 1,582,826.5781042 | 216,580.400930509 | 6,977.120150346 | 256.371739568 | 901,263.328629545 | 1,359,012.685283777 | -457,749.356654232 | 33.6824% | **DISCREPANCY >1%** |
| 95 | 2,823,492.04876599 | 223,698.068303101 | 92,584.118277643 | 256.028885665 | 1,759,219.58729414 | 2,506,953.833299581 | -747,734.246005441 | 29.8264% | **DISCREPANCY >1%** |
| 96 | 672,922.803045531 | 130,829.78226522 | 67,499.464576751 | 257.313063547 | 387,490.176423779 | 474,336.243140013 | -86,846.066716234 | 18.3089% | **DISCREPANCY >1%** |
| 97 | 941,687.995601605 | 24,305.834427164 | 251,255.528421329 | 258.065141945 | 624,754.286624672 | 665,868.567611167 | -41,114.280986495 | 6.1745% | **DISCREPANCY >1%** |
| 98 | 2,790,262.348044368 | 176,154.008844017 | 0 | 260.43573069 | 1,537,507.711157861 | 2,613,847.903469661 | -1,076,340.1923118 | 41.1783% | **DISCREPANCY >1%** |
| 99 | 217,528.329419552 | 72,004.601807409 | 0 | 271.65069475 | 145,941.59538324 | 145,252.076917393 | +689.518465847 | 0.4747% | OK |
| 100 | 1,799,788.095590657 | 201,831.869356847 | 8,577.774654887 | 261.477567769 | 1,136,482.892106863 | 1,589,116.974011154 | -452,634.081904291 | 28.4833% | **DISCREPANCY >1%** |
| 101 | 2,301,503.793430326 | 96,709.729814995 | 147,162.212142243 | 262.978266761 | 1,352,453.090541984 | 2,057,368.873206327 | -704,915.782664343 | 34.2629% | **DISCREPANCY >1%** |
| 102 | 843,138.314854854 | 50,526.561897738 | 158,995.005398752 | 263.295649427 | 571,127.582889633 | 633,353.451908937 | -62,225.869019304 | 9.8248% | **DISCREPANCY >1%** |
| 103 | 96,664.397144062 | 99,945.222911754 | 0 | 62.122111782 | 75,398.326108155 | 0 | +75,398.326108155 | ∞% | **DISCREPANCY >1%** |
| 104 | 3,062,962.342942101 | 0 | 8,693.224149186 | 265.76379112 | 2,725,130.208756965 | 3,054,003.355001795 | -328,873.14624483 | 10.7685% | **DISCREPANCY >1%** |
| 105 | 1,922,172.160350343 | 24,337.695348448 | 196,109.319715758 | 266.242109171 | 1,278,846.154813373 | 1,701,458.903176966 | -422,612.748363593 | 24.8382% | **DISCREPANCY >1%** |
| 106 | 2,376,980.760564706 | 144,209.176940372 | 53,273.846844962 | 268.301424906 | 1,487,849.779485208 | 2,179,229.435354466 | -691,379.655869258 | 31.7258% | **DISCREPANCY >1%** |
| 107 | 1,412,301.195707836 | 75,002.822267192 | 259,164.830731583 | 268.014369496 | 768,379.69328733 | 1,077,865.528339565 | -309,485.835052235 | 28.7128% | **DISCREPANCY >1%** |
| 108 | 1,530,514.515126298 | 44,888.690492425 | 38,862.313667517 | 270.752965263 | 1,054,527.794798477 | 1,446,492.758001093 | -391,964.963202616 | 27.0976% | **DISCREPANCY >1%** |
| 109 | 1,408,919.281801709 | 223,698.068310612 | 70,026.821602108 | 271.413033401 | 715,168.920824128 | 1,114,922.978855588 | -399,754.05803146 | 35.8548% | **DISCREPANCY >1%** |
| 110 | 2,492,962.419651006 | 0 | 114,614.851278508 | 271.551432272 | 1,729,173.602489589 | 2,378,076.016940226 | -648,902.414450637 | 27.2868% | **DISCREPANCY >1%** |
| 111 | 3,442,693.711521751 | 192,321.702770461 | 337,717.260844435 | 272.903836718 | 2,421,207.348894766 | 2,912,381.844070137 | -491,174.495175371 | 16.8650% | **DISCREPANCY >1%** |
| 112 | 1,865,761.736981223 | 173,200.851403845 | 85,660.90276259 | 274.726524846 | 858,535.424827937 | 1,606,625.256289942 | -748,089.831462005 | 46.5628% | **DISCREPANCY >1%** |
| 113 | 1,426,473.253958655 | 223,287.331033099 | 24,443.416711791 | 275.823731005 | 723,051.673206953 | 1,178,466.68248276 | -455,415.009275807 | 38.6447% | **DISCREPANCY >1%** |
| 114 | 1,394,584.909593141 | 54,534.060998196 | 206,406.330486726 | 275.314211225 | 818,971.595299437 | 1,133,369.203896994 | -314,397.608597557 | 27.7400% | **DISCREPANCY >1%** |
| 115 | 1,527,490.977031515 | 196,982.31937977 | 0 | 277.241311564 | 674,736.540831756 | 1,330,231.416340181 | -655,494.875508425 | 49.2767% | **DISCREPANCY >1%** |
| 116 | 498,321.033277975 | 129,797.29432009 | 46,438.331747847 | 277.098963558 | 322,456.895400295 | 321,808.30824648 | +648.587153815 | 0.2015% | OK |
| 117 | 1,577,385.159372488 | 0 | 110,042.604483153 | 279.659242898 | 1,182,843.699577966 | 1,467,062.895646437 | -284,219.196068471 | 19.3733% | **DISCREPANCY >1%** |
| 118 | 2,024,047.920306349 | 153,349.352006901 | 100,459.246518578 | 279.259844738 | 1,610,600.660779731 | 1,769,960.061936132 | -159,359.401156401 | 9.0035% | **DISCREPANCY >1%** |
| 119 | 1,493,334.518002894 | 127,462.331317651 | 0 | 281.16125126 | 720,015.01421028 | 1,365,591.025433983 | -645,576.011223703 | 47.2744% | **DISCREPANCY >1%** |
| 120 | 2,546,729.61913963 | 3,986.862247885 | 172,129.987304737 | 281.028677015 | 2,203,582.648794662 | 2,370,331.740909993 | -166,749.092115331 | 7.0348% | **DISCREPANCY >1%** |
| 121 | 2,766,645.954076083 | 211,264.855121109 | 0 | 282.990935578 | 1,535,311.697079252 | 2,555,098.108019396 | -1,019,786.410940144 | 39.9118% | **DISCREPANCY >1%** |
| 122 | 494,830.449887162 | 223,698.06146747 | 41,001.922983965 | 284.071585448 | 212,399.087082206 | 229,846.393850279 | -17,447.306768073 | 7.5908% | **DISCREPANCY >1%** |
| 123 | 1,850,353.345164228 | 117,012.394161995 | 40,622.003819962 | 285.954694253 | 1,545,775.094847816 | 1,692,432.992488018 | -146,657.897640202 | 8.6655% | **DISCREPANCY >1%** |
| 124 | 3,304,782.231651734 | 92,313.326894099 | 196,705.94008711 | 285.202246443 | 2,213,958.401766367 | 3,015,477.762424082 | -801,519.360657715 | 26.5801% | **DISCREPANCY >1%** |
| 125 | 2,325,820.430010415 | 223,698.068375433 | 7,964.547109056 | 287.897169575 | 1,109,743.523235324 | 2,093,869.917356351 | -984,126.394121027 | 47.0003% | **DISCREPANCY >1%** |
| 126 | 1,107,634.577479887 | 101,570.16062343 | 215,477.375953641 | 287.623123334 | 506,364.309783089 | 790,299.417779482 | -283,935.107996393 | 35.9275% | **DISCREPANCY >1%** |
| 127 | 2,802,818.648141101 | 201,728.715858691 | 45.025794905 | 289.321344103 | 1,653,334.165428989 | 2,600,755.585143402 | -947,421.419714413 | 36.4286% | **DISCREPANCY >1%** |
| 128 | 2,676,784.343533691 | 0 | 34,715.84016103 | 290.261683831 | 2,459,320.890947386 | 2,641,778.24168883 | -182,457.350741444 | 6.9066% | **DISCREPANCY >1%** |

## After upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,484,441.267183304 | 826,743.498270167 | 17,184.489564018 | 19.364852001 | 1,659,802.584004906 | 1,640,493.914497118 | +19,308.669507788 | 1.1770% | **DISCREPANCY >1%** |
| 2 | 3,328,543.356043044 | 635,713.572381259 | 277.903743213 | 184.500851115 | 2,711,313.00299156 | 2,692,367.379067457 | +18,945.623924103 | 0.7036% | OK |
| 3 | 2,802,717.049517534 | 578,475.334942498 | 164,523.64381649 | 184.126595309 | 2,078,448.8879906 | 2,059,533.944163237 | +18,914.943827363 | 0.9184% | OK |
| 4 | 3,503,439.979101676 | 553,023.967435256 | 157,421.244402478 | 185.029751137 | 2,811,300.435005442 | 2,792,809.737512805 | +18,490.697492637 | 0.6620% | OK |
| 5 | 2,998,784.766104459 | 1,488,257.228963462 | 3,606.866435634 | 186.281869889 | 1,525,624.786765432 | 1,506,734.388835474 | +18,890.397929958 | 1.2537% | **DISCREPANCY >1%** |
| 6 | 2,715,899.911458657 | 185,360.665463109 | 97,097.786802825 | 189.346869938 | 2,451,996.683773013 | 2,433,252.112322785 | +18,744.571450228 | 0.7703% | OK |
| 7 | 3,129,943.311512733 | 36,084.978602376 | 23,076.821212896 | 189.075388456 | 3,089,552.962272271 | 3,070,592.436309005 | +18,960.525963266 | 0.6174% | OK |
| 8 | 3,034,772.836372308 | 780,868.154271859 | 68,577.554997678 | 189.086928473 | 2,204,088.317242778 | 2,185,138.040174298 | +18,950.27706848 | 0.8672% | OK |
| 9 | 3,941,034.681274759 | 1,134,490.320449541 | 162,574.243212204 | 190.118320387 | 2,662,702.753243412 | 2,643,779.999292627 | +18,922.753950785 | 0.7157% | OK |
| 10 | 3,118,113.600023772 | 718,954.77036203 | 3,919.775094447 | 191.688883087 | 2,413,820.773748008 | 2,395,047.365684208 | +18,773.4080638 | 0.7838% | OK |
| 11 | 2,980,620.483654968 | 1,145,934.992162841 | 129,211.932217336 | 192.661334501 | 1,724,261.701431808 | 1,705,280.89794029 | +18,980.803491518 | 1.1130% | **DISCREPANCY >1%** |
| 12 | 3,360,259.048608388 | 1,522,132.651258694 | 0 | 194.292697974 | 1,856,786.281218517 | 1,837,932.10465172 | +18,854.176566797 | 1.0258% | **DISCREPANCY >1%** |
| 13 | 2,419,741.443340406 | 593,048.370031793 | 16,582.21426827 | 194.761479009 | 1,828,953.545731635 | 1,809,916.097561334 | +19,037.448170301 | 1.0518% | **DISCREPANCY >1%** |
| 14 | 3,059,216.25751119 | 1,180,371.405325601 | 129,813.067943654 | 195.278374913 | 1,767,865.10047261 | 1,748,836.505867022 | +19,028.594605588 | 1.0880% | **DISCREPANCY >1%** |
| 15 | 1,282,875.282528394 | 354,654.991781899 | 218,452.591986798 | 196.096217231 | 716,745.344324384 | 709,571.602542466 | +7,173.741781918 | 1.0109% | **DISCREPANCY >1%** |
| 16 | 292,263.056082386 | 106,491.578931276 | 9,125.331581653 | 198.086571481 | 219,971.692133916 | 176,448.058997976 | +43,523.63313594 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,658.257768426 | 340,475.604612198 | 112,047.582634026 | 198.357595964 | 2,591,753.716854974 | 2,572,936.712926238 | +18,817.003928736 | 0.7313% | OK |
| 18 | 3,221,532.3581729 | 327,278.331731401 | 184,937.037344576 | 435.502768743 | 2,728,012.390175507 | 2,708,881.48632818 | +19,130.903847327 | 0.7062% | OK |
| 19 | 2,545,339.975975296 | 1,005,152.040322882 | 720.725249714 | 200.424919886 | 1,558,366.405120635 | 1,539,266.785482814 | +19,099.619637821 | 1.2408% | **DISCREPANCY >1%** |
| 20 | 3,151,586.118117668 | 1,318,019.090795353 | 0 | 202.646865463 | 1,852,324.660431886 | 1,833,364.380456852 | +18,960.279975034 | 1.0341% | **DISCREPANCY >1%** |
| 21 | 3,446,352.944539729 | 811,563.250445903 | 12,526.594993624 | 203.583376039 | 2,641,137.2895972 | 2,622,059.515724163 | +19,077.773873037 | 0.7275% | OK |
| 22 | 3,424,699.078972077 | 1,181,104.166041112 | 8,538.815663423 | 204.742051085 | 2,253,922.90864158 | 2,234,851.355216457 | +19,071.553425123 | 0.8533% | OK |
| 23 | 4,040,908.136284042 | 1,085,012.60808004 | 257,565.47245039 | 205.241550685 | 2,717,035.06015898 | 2,698,124.814202927 | +18,910.245956053 | 0.7008% | OK |
| 24 | 3,641,701.385197894 | 581,611.381123771 | 113,298.120046902 | 206.496276089 | 2,964,647.656840732 | 2,946,585.387751132 | +18,062.2690896 | 0.6129% | OK |
| 25 | 4,116,571.160734956 | 872,691.458855825 | 0 | 206.34835057 | 3,262,570.098652547 | 3,243,673.353528561 | +18,896.745123986 | 0.5825% | OK |
| 26 | 776,685.346869401 | 91,065.541425466 | 16,231.463886896 | 207.88574579 | 673,306.86442606 | 669,180.455811249 | +4,126.408614811 | 0.6166% | OK |
| 27 | 3,217,090.984189999 | 1,225,488.394288307 | 114.576078423 | 211.326060379 | 2,010,230.893396306 | 1,991,276.68776289 | +18,954.205633416 | 0.9518% | OK |
| 28 | 4,652,647.299089605 | 1,380,136.946029568 | 146,404.703197369 | 209.210187156 | 3,144,789.333292944 | 3,125,896.439675512 | +18,892.893617432 | 0.6043% | OK |
| 29 | 2,898,499.592659301 | 610,829.352749762 | 0 | 211.726660938 | 2,306,335.831049477 | 2,287,458.513248601 | +18,877.317800876 | 0.8252% | OK |
| 30 | 3,382,580.048550954 | 710,234.099517005 | 22,914.692387486 | 212.46115238 | 2,667,110.572279116 | 2,649,218.795494083 | +17,891.776785033 | 0.6753% | OK |
| 31 | 1,586,514.687500347 | 660,846.230518782 | 38,096.765184011 | 212.694922299 | 893,531.693731475 | 887,358.996875255 | +6,172.69685622 | 0.6956% | OK |
| 32 | 3,427,223.832587246 | 17,419.272873098 | 94,980.465258985 | 214.89590256 | 3,333,422.893428039 | 3,314,609.198552603 | +18,813.694875436 | 0.5675% | OK |
| 33 | 2,301,834.231915595 | 584,226.582883127 | 87,386.920302737 | 215.090754797 | 1,649,218.144611554 | 1,630,005.637974934 | +19,212.50663662 | 1.1786% | **DISCREPANCY >1%** |
| 34 | 2,517,755.171990584 | 359,469.273754254 | 133,531.191659712 | 215.353990333 | 2,043,591.427143987 | 2,024,539.352586285 | +19,052.074557702 | 0.9410% | OK |
| 35 | 2,988,533.927713479 | 266,886.343998939 | 95,598.20397956 | 218.133908795 | 2,644,675.94827133 | 2,625,831.245826185 | +18,844.702445145 | 0.7176% | OK |
| 36 | 627,893.239072002 | 131,286.518958231 | 37,538.851627533 | 219.003480298 | 464,701.809419829 | 458,848.86500594 | +5,852.944413889 | 1.2755% | **DISCREPANCY >1%** |
| 37 | 3,572,558.215572503 | 1,209,281.44508295 | 0 | 219.37359395 | 2,381,932.136047951 | 2,363,057.396895603 | +18,874.739152348 | 0.7987% | OK |
| 38 | 1,473,100.380683401 | 485,297.062238848 | 104,921.339283479 | 864.101524191 | 886,266.551300017 | 882,017.877636883 | +4,248.673663134 | 0.4816% | OK |
| 39 | 3,166,437.553195886 | 1,460,083.628868387 | 29,373.416255258 | 220.780998102 | 1,695,429.468557074 | 1,676,759.727074139 | +18,669.741482935 | 1.1134% | **DISCREPANCY >1%** |
| 40 | 327,007.733918726 | 74,153.423804429 | 128,034.305600759 | 221.517385166 | 176,741.448835177 | 124,598.487128372 | +52,142.961706805 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,175.611654056 | 973,744.279818439 | 217,217.580368984 | 222.976763385 | 1,802,863.651482052 | 1,783,990.774703248 | +18,872.876778804 | 1.0579% | **DISCREPANCY >1%** |
| 42 | 2,595,045.142096049 | 430,642.557214966 | 0 | 224.919954593 | 2,183,122.943907032 | 2,164,177.66492649 | +18,945.278980542 | 0.8754% | OK |
| 43 | 3,052,789.884567396 | 857,879.953518064 | 418.387877525 | 225.016150175 | 2,212,435.691834392 | 2,194,266.527021632 | +18,169.16481276 | 0.8280% | OK |
| 44 | 4,012,386.677234161 | 506,394.124946002 | 126,797.598576109 | 225.02933622 | 3,398,459.104068 | 3,378,969.92437583 | +19,489.17969217 | 0.5767% | OK |
| 45 | 3,011,754.442172559 | 1,021,886.089454556 | 0 | 228.877745713 | 2,008,703.116929344 | 1,989,639.47497229 | +19,063.641957054 | 0.9581% | OK |
| 46 | 3,510,720.597918791 | 920,454.734537479 | 93,394.806384354 | 228.01769382 | 2,515,548.15997582 | 2,496,643.039303138 | +18,905.120672682 | 0.7572% | OK |
| 47 | 1,295,531.895427735 | 588,653.185177574 | 22,924.082606544 | 229.661885444 | 687,673.465762526 | 683,724.965758173 | +3,948.500004353 | 0.5774% | OK |
| 48 | 3,107,537.04985937 | 695,492.461656953 | 101,664.859193657 | 230.700853043 | 2,328,846.687272452 | 2,310,149.028155717 | +18,697.659116735 | 0.8093% | OK |
| 49 | 2,017,878.726935414 | 694,094.772062343 | 164,459.552142348 | 230.470969128 | 1,164,300.147403006 | 1,159,093.931761595 | +5,206.215641411 | 0.4491% | OK |
| 50 | 3,236,917.049890369 | 467,621.462714429 | 40,263.969667629 | 231.87041995 | 2,747,775.456897652 | 2,728,799.747088361 | +18,975.709809291 | 0.6953% | OK |
| 51 | 3,694,854.757483302 | 1,171,146.945421614 | 153,209.289995193 | 232.014881506 | 2,389,201.875098131 | 2,370,266.507184989 | +18,935.367913142 | 0.7988% | OK |
| 52 | 2,952,119.070821844 | 1,077,162.060889068 | 90.395967424 | 233.761205211 | 1,893,408.234763284 | 1,874,632.852760141 | +18,775.382003143 | 1.0015% | **DISCREPANCY >1%** |
| 53 | 4,587,465.072582856 | 520,242.333818612 | 83,442.176209558 | 234.141069486 | 4,002,412.306866003 | 3,983,546.4214852 | +18,865.885380803 | 0.4735% | OK |
| 54 | 3,774,208.691772849 | 562,924.886719164 | 43,761.132345373 | 236.262086148 | 3,186,263.949667802 | 3,167,286.410622164 | +18,977.539045638 | 0.5991% | OK |
| 55 | 2,799,339.289393601 | 316,092.836118957 | 94,545.881062638 | 238.134605073 | 2,407,570.599805009 | 2,388,462.437606933 | +19,108.162198076 | 0.8000% | OK |
| 56 | 2,646,408.264136623 | 774,485.915914827 | 13,997.922202342 | 237.282503566 | 1,876,658.38095267 | 1,857,687.143515888 | +18,971.237436782 | 1.0212% | **DISCREPANCY >1%** |
| 57 | 825,779.111178675 | 317,596.320183395 | 70,615.680938887 | 238.648963661 | 442,264.988899287 | 437,328.461092732 | +4,936.527806555 | 1.1287% | **DISCREPANCY >1%** |
| 58 | 297,305.290570974 | 161,966.767161337 | 0 | 89.223144202 | 228,682.61780516 | 135,249.300265435 | +93,433.317539725 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,735.959417721 | 440,939.168981065 | 122,883.114116497 | 243.495433087 | 2,648,586.34800194 | 2,629,670.180887072 | +18,916.167114868 | 0.7193% | OK |
| 60 | 3,738,940.573624944 | 628,958.607866544 | 40,528.882878666 | 242.011153438 | 3,088,309.198855045 | 3,069,211.071726296 | +19,098.127128749 | 0.6222% | OK |
| 61 | 4,368,657.159735787 | 808,370.14496251 | 81,353.440976754 | 242.5991546 | 3,497,985.843054945 | 3,478,690.974641923 | +19,294.868413022 | 0.5546% | OK |
| 62 | 2,639,387.815374459 | 184,174.273336392 | 43,107.801111658 | 243.315194517 | 2,431,187.062364878 | 2,411,862.425731892 | +19,324.636632986 | 0.8012% | OK |
| 63 | 3,817,269.048704602 | 725,439.396179942 | 147,126.120436211 | 244.616747329 | 2,963,791.083203702 | 2,944,458.91534112 | +19,332.167862582 | 0.6565% | OK |
| 64 | 3,340,780.552487679 | 267,933.276542149 | 166,759.193471144 | 245.063767931 | 2,925,100.024232174 | 2,905,843.018706455 | +19,257.005525719 | 0.6626% | OK |
| 65 | 3,223,189.02667184 | 939,351.125453697 | 71.722624687 | 248.953625551 | 2,290,879.611105601 | 2,283,517.224967905 | +7,362.386137696 | 0.3224% | OK |
| 66 | 3,355,569.767963545 | 876,389.726869251 | 83,262.913449555 | 248.876365654 | 2,399,574.013147158 | 2,395,668.251279085 | +3,905.761868073 | 0.1630% | OK |
| 67 | 818,237.005618122 | 275,635.793013465 | 132,264.88633962 | 248.548133054 | 415,753.341684633 | 410,087.778131983 | +5,665.56355265 | 1.3815% | **DISCREPANCY >1%** |
| 68 | 3,606,525.758400815 | 681,206.505097183 | 169,955.073168138 | 249.15642725 | 2,757,678.262310717 | 2,755,115.023708244 | +2,563.238602473 | 0.0930% | OK |
| 69 | 1,127,759.983729383 | 281,678.898945926 | 59,604.102841208 | 250.154576623 | 789,692.225967185 | 786,226.827365626 | +3,465.398601559 | 0.4407% | OK |
| 70 | 38,335.22374926 | 148.169094182 | 0 | 186.182726662 | 38,149.040995632 | 38,000.871928416 | +148.169067216 | 0.3899% | OK |
| 71 | 4,185,124.677766843 | 876,438.347763752 | 85,705.37638208 | 253.451983429 | 3,225,073.636749908 | 3,222,727.501637582 | +2,346.135112326 | 0.0727% | OK |
| 72 | 2,486,807.251902087 | 383,273.725113362 | 0 | 254.603932754 | 2,105,694.740466461 | 2,103,278.922855971 | +2,415.81761049 | 0.1148% | OK |
| 73 | 3,280,384.920420528 | 1,468,954.069047113 | 0 | 255.105893957 | 1,813,676.942884909 | 1,811,175.745479458 | +2,501.197405451 | 0.1380% | OK |
| 74 | 3,335,925.259227667 | 531,791.422968235 | 94,292.343237338 | 256.356012676 | 2,712,295.874311409 | 2,709,585.137009418 | +2,710.737301991 | 0.1000% | OK |
| 75 | 3,508,574.539419358 | 784,604.879643725 | 16,902.880265307 | 256.228181397 | 2,709,395.891317406 | 2,706,810.551328929 | +2,585.339988477 | 0.0955% | OK |
| 76 | 1,014,684.381470641 | 475,840.83810665 | 4,053.056546057 | 258.707430104 | 539,215.189087256 | 534,531.77938783 | +4,683.409699426 | 0.8761% | OK |
| 77 | 3,211,843.798076511 | 140,886.89655137 | 560,753.334406754 | 258.999075614 | 2,512,507.442349621 | 2,509,944.568042773 | +2,562.874306848 | 0.1021% | OK |
| 78 | 650,051.486811965 | 64,569.373140067 | 93,439.420139376 | 260.779702539 | 497,791.007489218 | 491,781.913829983 | +6,009.093659235 | 1.2219% | **DISCREPANCY >1%** |
| 79 | 3,522,190.05886567 | 444,229.939659842 | 150,694.397590854 | 260.600830644 | 2,929,780.461334615 | 2,927,005.12078433 | +2,775.340550285 | 0.0948% | OK |
| 80 | 1,805,811.602432742 | 192,549.794495279 | 42,374.70227022 | 261.090831522 | 1,575,661.087864241 | 1,570,626.014835721 | +5,035.07302852 | 0.3205% | OK |
| 81 | 2,604,361.010640763 | 851,302.349232435 | 112,250.85983543 | 262.414012869 | 1,643,122.255968379 | 1,640,545.387560029 | +2,576.86840835 | 0.1570% | OK |
| 82 | 637,048.829536987 | 51,351.621683119 | 203,656.438410755 | 263.745850211 | 387,646.14878236 | 381,777.023592902 | +5,869.125189458 | 1.5373% | **DISCREPANCY >1%** |
| 83 | 2,655,172.094539082 | 345,172.824104195 | 208,332.711813588 | 264.256934004 | 2,105,495.312152469 | 2,101,402.301687295 | +4,093.010465174 | 0.1947% | OK |
| 84 | 573,306.241545722 | 43,139.508392941 | 25,365.155475257 | 264.999999431 | 499,568.25457856 | 504,536.577678093 | -4,968.323099533 | 0.9847% | OK |
| 85 | 2,507,849.31680527 | 496,360.999970373 | 63,690.477035276 | 267.014358227 | 1,950,373.413274667 | 1,947,530.825441394 | +2,842.587833273 | 0.1459% | OK |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,274.581541561 | 647,402.902423667 | 51,054.043826615 | 269.166257818 | 811,937.38714958 | 808,548.469033461 | +3,388.918116119 | 0.4191% | OK |
| 88 | 3,458,040.334076529 | 175,269.312981134 | 95,635.064595129 | 269.870198707 | 3,189,628.068539638 | 3,186,866.086301559 | +2,761.982238079 | 0.0866% | OK |
| 89 | 2,763,944.852090179 | 600,426.954984618 | 187,748.849811315 | 271.328223071 | 1,978,297.520002656 | 1,975,497.719071175 | +2,799.800931481 | 0.1417% | OK |
| 90 | 140,131.393099798 | 116,392.269522858 | 0 | 108.032188426 | 140,001.653399788 | 23,631.091388514 | +116,370.562011274 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,466.812931349 | 399,376.775480423 | 55,173.076451118 | 272.197144639 | 543,685.801296443 | 538,644.763855169 | +5,041.037441274 | 0.9358% | OK |
| 92 | 382,894.228663509 | 176,927.850467173 | 41,186.988026446 | 274.178151486 | 165,518.197370141 | 164,505.212018404 | +1,012.985351737 | 0.6157% | OK |
| 93 | 3,180,220.763265056 | 1,085,835.159306595 | 10,631.359620536 | 274.306172501 | 2,086,451.787267245 | 2,083,479.938165424 | +2,971.849101821 | 0.1426% | OK |
| 94 | 1,582,846.5781042 | 680,196.760099128 | 6,977.120150346 | 276.371739524 | 901,263.328629545 | 895,396.326115202 | +5,867.002514343 | 0.6552% | OK |
| 95 | 2,823,512.04876599 | 975,818.72867639 | 92,584.118277643 | 276.028885623 | 1,759,219.58729414 | 1,754,833.172926334 | +4,386.414367806 | 0.2499% | OK |
| 96 | 672,942.803045531 | 223,924.687813565 | 67,499.464576751 | 277.313063504 | 387,490.176423779 | 381,241.337591711 | +6,248.838832068 | 1.6390% | **DISCREPANCY >1%** |
| 97 | 941,713.657376344 | 70,872.776437572 | 251,261.190196068 | 278.065141902 | 624,754.286624672 | 619,301.625600802 | +5,452.66102387 | 0.8804% | OK |
| 98 | 2,790,282.348044368 | 1,255,490.393926426 | 0 | 280.435730648 | 1,537,507.711157861 | 1,534,511.518387294 | +2,996.192770567 | 0.1952% | OK |
| 99 | 217,548.329419552 | 72,004.601807409 | 0 | 291.650694708 | 145,941.59538324 | 145,252.076917435 | +689.518465805 | 0.4747% | OK |
| 100 | 1,799,808.095590657 | 659,972.413440104 | 8,577.774654887 | 281.477567724 | 1,136,482.892106863 | 1,130,976.429927942 | +5,506.462178921 | 0.4868% | OK |
| 101 | 2,301,523.793430326 | 806,501.042836516 | 147,162.212142243 | 282.978266719 | 1,352,453.090541984 | 1,347,577.560184848 | +4,875.530357136 | 0.3617% | OK |
| 102 | 843,158.314854854 | 118,084.708059441 | 158,995.005398752 | 283.295649384 | 571,127.582889633 | 565,795.305747277 | +5,332.277142356 | 0.9424% | OK |
| 103 | 96,684.397144062 | 99,945.222911754 | 0 | 51.507347497 | 75,428.940872399 | 0 | +75,428.940872399 | ∞% | **DISCREPANCY >1%** |
| 104 | 3,062,982.342942101 | 340,321.172598343 | 8,693.224149186 | 285.763791077 | 2,725,130.208756965 | 2,713,682.182403495 | +11,448.02635347 | 0.4218% | OK |
| 105 | 1,922,193.744018165 | 451,644.439901403 | 196,110.90338358 | 286.242109129 | 1,278,846.154813373 | 1,274,152.158624053 | +4,693.99618932 | 0.3684% | OK |
| 106 | 2,377,000.760564706 | 838,637.534343767 | 53,273.846844962 | 288.301424863 | 1,487,849.779485208 | 1,484,801.077951114 | +3,048.701534094 | 0.2053% | OK |
| 107 | 1,412,328.559080477 | 389,715.783508211 | 259,172.194104224 | 288.014369453 | 768,379.69328733 | 763,152.567098589 | +5,227.126188741 | 0.6849% | OK |
| 108 | 1,530,534.515126298 | 442,784.567664372 | 38,862.313667517 | 290.752965221 | 1,054,527.794798477 | 1,048,596.880829188 | +5,930.913969289 | 0.5656% | OK |
| 109 | 1,408,939.281801709 | 626,919.832814457 | 70,026.821602108 | 291.413033358 | 715,168.920824128 | 711,701.214351786 | +3,467.706472342 | 0.4872% | OK |
| 110 | 2,492,984.170635498 | 653,602.202903777 | 114,616.602263 | 291.551432231 | 1,729,173.602489589 | 1,724,473.81403649 | +4,699.788453099 | 0.2725% | OK |
| 111 | 3,442,713.711521751 | 686,963.807461569 | 337,717.260844435 | 292.903836676 | 2,421,207.348894766 | 2,417,739.739379071 | +3,467.609515695 | 0.1434% | OK |
| 112 | 1,865,781.736981223 | 925,696.620748774 | 85,660.90276259 | 294.726524804 | 858,535.424827937 | 854,129.486945055 | +4,405.937882882 | 0.5158% | OK |
| 113 | 1,426,493.253958655 | 682,486.06189204 | 24,443.416711791 | 295.823730962 | 723,051.673206953 | 719,267.951623862 | +3,783.721583091 | 0.5260% | OK |
| 114 | 1,394,609.275484981 | 373,811.447473431 | 206,410.696378566 | 295.314211181 | 818,971.595299437 | 814,091.817421803 | +4,879.777877634 | 0.5994% | OK |
| 115 | 1,527,510.977031515 | 857,494.572895518 | 0 | 297.241311521 | 674,736.540831756 | 669,719.162824476 | +5,017.37800728 | 0.7491% | OK |
| 116 | 498,341.033277975 | 129,797.29432009 | 46,438.331747847 | 297.098963514 | 322,456.895400295 | 321,808.308246524 | +648.587153771 | 0.2015% | OK |
| 117 | 1,577,405.159372488 | 289,424.602021989 | 110,042.604483153 | 299.659242854 | 1,182,843.699577966 | 1,177,638.293624492 | +5,205.405953474 | 0.4420% | OK |
| 118 | 2,024,067.920306349 | 317,975.810452995 | 100,459.246518578 | 299.259844696 | 1,610,600.660779731 | 1,605,333.60349008 | +5,267.057289651 | 0.3280% | OK |
| 119 | 1,493,354.518002894 | 776,537.885713869 | 0 | 301.161251219 | 720,015.01421028 | 716,515.471037806 | +3,499.543172474 | 0.4884% | OK |
| 120 | 2,546,759.970465138 | 174,299.388959302 | 172,140.338630245 | 301.028676971 | 2,203,582.648794662 | 2,200,019.21419862 | +3,563.434596042 | 0.1619% | OK |
| 121 | 2,766,665.954076083 | 1,234,341.176086707 | 0 | 302.990935536 | 1,535,311.697079252 | 1,532,021.78705384 | +3,289.910025412 | 0.2147% | OK |
| 122 | 494,850.449887162 | 246,465.034375573 | 41,001.922983965 | 304.071585406 | 212,399.087082206 | 207,079.420942218 | +5,319.666139988 | 2.5689% | **DISCREPANCY >1%** |
| 123 | 1,850,373.345164228 | 266,836.118126159 | 40,622.003819962 | 305.95469421 | 1,545,775.094847816 | 1,542,609.268523897 | +3,165.826323919 | 0.2052% | OK |
| 124 | 3,304,808.862395483 | 897,004.632666029 | 196,712.570830859 | 305.202246401 | 2,213,958.401766367 | 2,210,786.456652194 | +3,171.945114173 | 0.1434% | OK |
| 125 | 2,325,840.430010415 | 1,211,161.002135291 | 7,964.547109056 | 307.89716953 | 1,109,743.523235324 | 1,106,406.983596538 | +3,336.539638786 | 0.3015% | OK |
| 126 | 1,107,654.577479887 | 389,824.564372371 | 215,477.375953641 | 307.62312329 | 506,364.309783089 | 502,045.014030585 | +4,319.295752504 | 0.8603% | OK |
| 127 | 2,802,838.648141101 | 1,152,511.702574029 | 45.025794905 | 309.321344059 | 1,653,334.165428989 | 1,649,972.598428108 | +3,361.567000881 | 0.2037% | OK |
| 128 | 2,676,804.343533691 | 186,014.794503201 | 34,715.84016103 | 310.261683788 | 2,459,320.890947386 | 2,455,763.447185672 | +3,557.443761714 | 0.1448% | OK |

## Discrepancies greater than 1%

| Phase | Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| before | 1 | 2,484,421.267183304 | 165,012.699896644 | 17,184.489564018 | 95.974823572 | 1,659,729.728281817 | 2,302,128.10289907 | -642,398.374617253 | 27.9045% | **DISCREPANCY >1%** |
| before | 2 | 3,328,523.356043044 | 186,958.253739906 | 277.903743213 | 164.50085116 | 2,711,313.00299156 | 3,141,122.697708765 | -429,809.694717205 | 13.6833% | **DISCREPANCY >1%** |
| before | 3 | 2,802,685.964443647 | 0.468119708 | 164,512.558742603 | 164.126595352 | 2,078,448.8879906 | 2,638,008.810985984 | -559,559.922995384 | 21.2114% | **DISCREPANCY >1%** |
| before | 4 | 3,503,409.549977282 | 13,456.73137153 | 157,410.815278084 | 165.02975118 | 2,811,300.435005442 | 3,332,376.973576488 | -521,076.538571046 | 15.6367% | **DISCREPANCY >1%** |
| before | 5 | 2,998,763.316837088 | 209,823.537800336 | 3,605.417168263 | 166.281869931 | 1,525,624.786765432 | 2,785,168.079998558 | -1,259,543.293233126 | 45.2232% | **DISCREPANCY >1%** |
| before | 6 | 2,715,879.911458657 | 23,468.530961558 | 97,097.786802825 | 169.346869981 | 2,451,996.683773013 | 2,595,144.246824293 | -143,147.56305128 | 5.5159% | **DISCREPANCY >1%** |
| before | 8 | 3,034,741.689428414 | 170,998.084151705 | 68,566.408053784 | 169.086928516 | 2,204,088.317242778 | 2,795,008.110294409 | -590,919.793051631 | 21.1419% | **DISCREPANCY >1%** |
| before | 9 | 3,941,010.975568307 | 189,930.97794848 | 162,570.537505752 | 170.118320427 | 2,662,702.753243412 | 3,588,339.341793648 | -925,636.588550236 | 25.7956% | **DISCREPANCY >1%** |
| before | 10 | 3,118,093.600023772 | 223,846.079166223 | 3,919.775094447 | 171.688883127 | 2,413,820.773748008 | 2,890,156.056879975 | -476,335.283131967 | 16.4812% | **DISCREPANCY >1%** |
| before | 11 | 2,980,596.586451167 | 58,843.162874805 | 129,208.035013535 | 172.661334545 | 1,724,261.701431808 | 2,792,372.727228282 | -1,068,111.025796474 | 38.2510% | **DISCREPANCY >1%** |
| before | 12 | 3,360,239.048608388 | 222,508.114052081 | 0 | 174.292698016 | 1,856,786.281218517 | 3,137,556.641858291 | -1,280,770.360639774 | 40.8206% | **DISCREPANCY >1%** |
| before | 13 | 2,419,721.443340406 | 148,967.172896852 | 16,582.21426827 | 174.761479051 | 1,828,953.545731635 | 2,253,997.294696233 | -425,043.748964598 | 18.8573% | **DISCREPANCY >1%** |
| before | 14 | 3,059,196.25751119 | 220,189.208395156 | 129,813.067943654 | 175.278374957 | 1,767,865.10047261 | 2,709,018.702797423 | -941,153.602324813 | 34.7414% | **DISCREPANCY >1%** |
| before | 15 | 1,282,848.125034767 | 52,905.700586193 | 218,445.434493171 | 176.096217274 | 716,745.344324384 | 1,011,320.893738129 | -294,575.549413745 | 29.1278% | **DISCREPANCY >1%** |
| before | 16 | 292,243.056082386 | 106,491.578931276 | 9,125.331581653 | 178.086571524 | 219,971.692133916 | 176,448.058997933 | +43,523.633135983 | 24.6665% | **DISCREPANCY >1%** |
| before | 17 | 3,025,631.238457238 | 35,067.621313474 | 112,040.563322838 | 178.357596008 | 2,591,753.716854974 | 2,878,344.696224918 | -286,590.979369944 | 9.9567% | **DISCREPANCY >1%** |
| before | 18 | 3,221,512.3581729 | 82,212.573733221 | 184,937.037344576 | 415.502768784 | 2,728,012.390175507 | 2,953,947.244326319 | -225,934.854150812 | 7.6485% | **DISCREPANCY >1%** |
| before | 19 | 2,545,319.532106827 | 203,827.261478907 | 720.281381245 | 180.424919929 | 1,558,366.405120635 | 2,340,591.564326746 | -782,225.159206111 | 33.4199% | **DISCREPANCY >1%** |
| before | 20 | 3,151,566.118117668 | 223,846.079145155 | 0 | 182.646865504 | 1,852,324.660431886 | 2,927,537.392107009 | -1,075,212.731675123 | 36.7275% | **DISCREPANCY >1%** |
| before | 21 | 3,446,332.944539729 | 160,850.042236821 | 12,526.594993624 | 183.583376086 | 2,641,137.2895972 | 3,272,772.723933198 | -631,635.434335998 | 19.2997% | **DISCREPANCY >1%** |
| before | 22 | 3,424,679.078972077 | 161,827.727614681 | 8,538.815663423 | 184.742051128 | 2,253,922.90864158 | 3,254,127.793642845 | -1,000,204.885001265 | 30.7364% | **DISCREPANCY >1%** |
| before | 23 | 4,040,888.136284042 | 117,779.002762432 | 257,565.47245039 | 185.241550727 | 2,717,035.06015898 | 3,665,358.419520493 | -948,323.359361513 | 25.8725% | **DISCREPANCY >1%** |
| before | 24 | 3,641,681.385197894 | 75,925.654771513 | 113,298.120046902 | 186.496276131 | 2,964,647.656840732 | 3,452,271.114103348 | -487,623.457262616 | 14.1247% | **DISCREPANCY >1%** |
| before | 25 | 4,116,551.160734956 | 223,846.079136167 | 0 | 186.348350612 | 3,262,570.098652547 | 3,892,518.733248177 | -629,948.63459563 | 16.1835% | **DISCREPANCY >1%** |
| before | 26 | 776,665.346869401 | 73,459.26989387 | 16,231.463886896 | 187.885745832 | 673,306.86442606 | 686,786.727342803 | -13,479.862916743 | 1.9627% | **DISCREPANCY >1%** |
| before | 27 | 3,217,070.984189999 | 223,846.079203415 | 114.576078423 | 191.326060425 | 2,010,230.893396306 | 2,992,919.002847736 | -982,688.10945143 | 32.8337% | **DISCREPANCY >1%** |
| before | 28 | 4,652,619.628647653 | 176,806.130994487 | 146,397.032755417 | 189.210187199 | 3,144,789.333292944 | 4,329,227.25471055 | -1,184,437.921417606 | 27.3591% | **DISCREPANCY >1%** |
| before | 29 | 2,898,479.592659301 | 0 | 0 | 191.72666098 | 2,306,335.831049477 | 2,898,287.865998321 | -591,952.034948844 | 20.4241% | **DISCREPANCY >1%** |
| before | 30 | 3,382,560.048550954 | 223,846.079129087 | 22,914.692387486 | 192.461152424 | 2,667,110.572279116 | 3,135,606.815881957 | -468,496.243602841 | 14.9411% | **DISCREPANCY >1%** |
| before | 31 | 1,586,494.687500347 | 223,846.079187058 | 38,096.765184011 | 192.694922341 | 893,531.693731475 | 1,324,359.148206937 | -430,827.454475462 | 32.5310% | **DISCREPANCY >1%** |
| before | 33 | 2,301,812.992289183 | 89,682.65958267 | 87,385.680676325 | 195.090754838 | 1,649,218.144611554 | 2,124,549.56127535 | -475,331.416663796 | 22.3732% | **DISCREPANCY >1%** |
| before | 34 | 2,517,726.604855333 | 0 | 133,522.624524461 | 195.353990377 | 2,043,591.427143987 | 2,384,008.626340495 | -340,417.199196508 | 14.2791% | **DISCREPANCY >1%** |
| before | 35 | 2,988,513.927713479 | 0 | 95,598.20397956 | 198.133908839 | 2,644,675.94827133 | 2,892,717.58982508 | -248,041.64155375 | 8.5746% | **DISCREPANCY >1%** |
| before | 36 | 627,873.239072002 | 9,298.851890397 | 37,538.851627533 | 199.003480338 | 464,701.809419829 | 580,836.532073734 | -116,134.722653905 | 19.9943% | **DISCREPANCY >1%** |
| before | 37 | 3,572,538.215572503 | 223,846.079137807 | 0 | 199.373593994 | 2,381,932.136047951 | 3,348,492.762840702 | -966,560.626792751 | 28.8655% | **DISCREPANCY >1%** |
| before | 38 | 1,473,075.86010965 | 139,486.240803376 | 104,916.818709728 | 844.101524234 | 886,266.551300017 | 1,227,828.699072312 | -341,562.147772295 | 27.8183% | **DISCREPANCY >1%** |
| before | 39 | 3,166,417.553195886 | 172,663.511264212 | 29,373.416255258 | 200.780998144 | 1,695,429.468557074 | 2,964,179.844678272 | -1,268,750.376121198 | 42.8027% | **DISCREPANCY >1%** |
| before | 40 | 326,987.733918726 | 74,153.423804429 | 128,034.305600759 | 201.517385208 | 176,741.448835177 | 124,598.48712833 | +52,142.961706847 | 41.8487% | **DISCREPANCY >1%** |
| before | 41 | 2,975,155.611654056 | 204,063.185350324 | 217,217.580368984 | 202.976763427 | 1,802,863.651482052 | 2,553,671.869171321 | -750,808.217689269 | 29.4011% | **DISCREPANCY >1%** |
| before | 42 | 2,595,025.142096049 | 223,846.079158774 | 0 | 204.919954636 | 2,183,122.943907032 | 2,370,974.142982639 | -187,851.199075607 | 7.9229% | **DISCREPANCY >1%** |
| before | 43 | 3,052,769.884567396 | 179,562.708609502 | 418.387877525 | 205.016150217 | 2,212,435.691834392 | 2,872,583.771930152 | -660,148.08009576 | 22.9809% | **DISCREPANCY >1%** |
| before | 44 | 4,012,355.422832561 | 82,938.546710406 | 126,786.344174509 | 205.029336262 | 3,398,459.104068 | 3,802,425.502611384 | -403,966.398543384 | 10.6239% | **DISCREPANCY >1%** |
| before | 45 | 3,011,734.442172559 | 186,957.988153914 | 0 | 208.877745755 | 2,008,703.116929344 | 2,824,567.57627289 | -815,864.459343546 | 28.8845% | **DISCREPANCY >1%** |
| before | 46 | 3,510,700.597918791 | 140,033.673137159 | 93,394.806384354 | 208.01769386 | 2,515,548.15997582 | 3,277,064.100703418 | -761,515.940727598 | 23.2377% | **DISCREPANCY >1%** |
| before | 47 | 1,295,511.895427735 | 221,936.771527767 | 22,924.082606544 | 209.661885485 | 687,673.465762526 | 1,050,441.379407939 | -362,767.913645413 | 34.5348% | **DISCREPANCY >1%** |
| before | 48 | 3,107,517.04985937 | 0 | 101,664.859193657 | 210.700853085 | 2,328,846.687272452 | 3,005,641.489812628 | -676,794.802540176 | 22.5174% | **DISCREPANCY >1%** |
| before | 49 | 2,017,857.804424445 | 120,325.749958529 | 164,458.629631379 | 210.470969169 | 1,164,300.147403006 | 1,732,862.953865368 | -568,562.806462362 | 32.8106% | **DISCREPANCY >1%** |
| before | 50 | 3,236,897.049890369 | 84,285.185243783 | 40,263.969667629 | 211.870419993 | 2,747,775.456897652 | 3,112,136.024558964 | -364,360.567661312 | 11.7077% | **DISCREPANCY >1%** |
| before | 51 | 3,694,823.502439731 | 105,922.936515629 | 153,198.034951622 | 212.014881547 | 2,389,201.875098131 | 3,435,490.516090933 | -1,046,288.640992802 | 30.4552% | **DISCREPANCY >1%** |
| before | 52 | 2,952,099.070821844 | 223,846.079128825 | 90.395967424 | 213.761205251 | 1,893,408.234763284 | 2,727,948.834520344 | -834,540.59975706 | 30.5922% | **DISCREPANCY >1%** |
| before | 53 | 4,587,433.666638048 | 165,100.951333266 | 83,430.77026475 | 214.141069528 | 4,002,412.306866003 | 4,338,687.803970504 | -336,275.497104501 | 7.7506% | **DISCREPANCY >1%** |
| before | 54 | 3,774,188.691772849 | 104,605.505486405 | 43,761.132345373 | 216.262086188 | 3,186,263.949667802 | 3,625,605.791854883 | -439,341.842187081 | 12.1177% | **DISCREPANCY >1%** |
| before | 55 | 2,799,319.289393601 | 9,506.992017657 | 94,545.881062638 | 218.134605118 | 2,407,570.599805009 | 2,695,048.281708188 | -287,477.681903179 | 10.6668% | **DISCREPANCY >1%** |
| before | 56 | 2,646,388.264136623 | 147,253.342830014 | 13,997.922202342 | 217.282503612 | 1,876,658.38095267 | 2,484,919.716600655 | -608,261.335647985 | 24.4781% | **DISCREPANCY >1%** |
| before | 57 | 825,759.111178675 | 223,846.079159495 | 70,615.680938887 | 218.648963702 | 442,264.988899287 | 531,078.702116591 | -88,813.713217304 | 16.7232% | **DISCREPANCY >1%** |
| before | 58 | 297,285.290570974 | 161,966.767161337 | 0 | 69.223144244 | 228,682.61780516 | 135,249.300265393 | +93,433.317539767 | 69.0822% | **DISCREPANCY >1%** |
| before | 59 | 3,193,715.959417721 | 71,891.198873536 | 122,883.114116497 | 223.495433127 | 2,648,586.34800194 | 2,998,718.150994561 | -350,131.802992621 | 11.6760% | **DISCREPANCY >1%** |
| before | 60 | 3,738,920.573624944 | 121,459.892472139 | 40,528.882878666 | 222.011153481 | 3,088,309.198855045 | 3,576,709.787120658 | -488,400.588265613 | 13.6550% | **DISCREPANCY >1%** |
| before | 61 | 4,368,631.36753872 | 113,406.497793948 | 81,347.648779687 | 222.599154645 | 3,497,985.843054945 | 4,173,654.62181044 | -675,668.778755495 | 16.1889% | **DISCREPANCY >1%** |
| before | 62 | 2,639,361.848829962 | 1,029.291966503 | 43,101.834567161 | 223.315194559 | 2,431,187.062364878 | 2,595,007.407101739 | -163,820.344736861 | 6.3129% | **DISCREPANCY >1%** |
| before | 63 | 3,817,243.770735172 | 0 | 147,120.842466781 | 224.616747371 | 2,963,791.083203702 | 3,669,898.31152102 | -706,107.228317318 | 19.2405% | **DISCREPANCY >1%** |
| before | 64 | 3,340,749.139540234 | 44,721.605785854 | 166,747.780523699 | 225.063767975 | 2,925,100.024232174 | 3,129,054.689462706 | -203,954.665230532 | 6.5180% | **DISCREPANCY >1%** |
| before | 65 | 3,223,169.02667184 | 204,139.305947923 | 71.722624687 | 228.953625594 | 2,290,879.611105601 | 3,018,729.044473636 | -727,849.433368035 | 24.1111% | **DISCREPANCY >1%** |
| before | 66 | 3,355,549.767963545 | 58,498.893235066 | 83,262.913449555 | 228.876365695 | 2,399,574.013147158 | 3,213,559.084913229 | -813,985.071766071 | 25.3297% | **DISCREPANCY >1%** |
| before | 67 | 818,217.005618122 | 94,182.859728691 | 132,264.88633962 | 228.548133096 | 415,753.341684633 | 591,540.711416715 | -175,787.369732082 | 29.7168% | **DISCREPANCY >1%** |
| before | 68 | 3,606,494.861244011 | 51,820.059551198 | 169,944.176011334 | 229.156427292 | 2,757,678.262310717 | 3,384,501.469254187 | -626,823.20694347 | 18.5203% | **DISCREPANCY >1%** |
| before | 69 | 1,127,739.983729383 | 223,846.079187092 | 59,604.102841208 | 230.154576666 | 789,692.225967185 | 844,059.647124417 | -54,367.421157232 | 6.4411% | **DISCREPANCY >1%** |
| before | 71 | 4,185,104.677766843 | 96,876.088940082 | 85,705.37638208 | 233.45198347 | 3,225,073.636749908 | 4,002,289.760461211 | -777,216.123711303 | 19.4192% | **DISCREPANCY >1%** |
| before | 72 | 2,486,787.251902087 | 221,779.667597505 | 0 | 234.603932795 | 2,105,694.740466461 | 2,264,772.980371787 | -159,078.239905326 | 7.0240% | **DISCREPANCY >1%** |
| before | 73 | 3,280,364.920420528 | 223,846.079132607 | 0 | 235.105894 | 1,813,676.942884909 | 3,056,283.735393921 | -1,242,606.792509012 | 40.6574% | **DISCREPANCY >1%** |
| before | 74 | 3,335,905.259227667 | 0 | 94,292.343237338 | 236.356012719 | 2,712,295.874311409 | 3,241,376.55997761 | -529,080.685666201 | 16.3227% | **DISCREPANCY >1%** |
| before | 75 | 3,508,544.24955709 | 203,423.332505008 | 16,892.590403039 | 236.22818144 | 2,709,395.891317406 | 3,287,992.098467603 | -578,596.207150197 | 17.5972% | **DISCREPANCY >1%** |
| before | 76 | 1,014,664.381470641 | 179,713.432857498 | 4,053.056546057 | 238.707430148 | 539,215.189087256 | 830,659.184636938 | -291,443.995549682 | 35.0858% | **DISCREPANCY >1%** |
| before | 77 | 3,211,823.798076511 | 0 | 560,753.334406754 | 238.999075657 | 2,512,507.442349621 | 2,650,831.4645941 | -138,324.022244479 | 5.2181% | **DISCREPANCY >1%** |
| before | 78 | 650,031.486811965 | 6,499.356268383 | 93,439.420139376 | 240.779702582 | 497,791.007489218 | 549,851.930701624 | -52,060.923212406 | 9.4681% | **DISCREPANCY >1%** |
| before | 79 | 3,522,165.641399768 | 63,794.223490279 | 150,689.980124952 | 240.600830687 | 2,929,780.461334615 | 3,307,440.83695385 | -377,660.375619235 | 11.4185% | **DISCREPANCY >1%** |
| before | 80 | 1,805,791.602432742 | 144,923.552045991 | 42,374.70227022 | 241.090831565 | 1,575,661.087864241 | 1,618,252.257284966 | -42,591.169420725 | 2.6319% | **DISCREPANCY >1%** |
| before | 81 | 2,604,336.612870185 | 20,523.249052955 | 112,246.462064852 | 242.41401291 | 1,643,122.255968379 | 2,471,324.487739468 | -828,202.231771089 | 33.5124% | **DISCREPANCY >1%** |
| before | 82 | 637,028.829536987 | 1,033.20576559 | 203,656.438410755 | 243.745850254 | 387,646.14878236 | 432,095.439510388 | -44,449.290728028 | 10.2869% | **DISCREPANCY >1%** |
| before | 83 | 2,655,152.094539082 | 0 | 208,332.711813588 | 244.256934046 | 2,105,495.312152469 | 2,446,575.125791448 | -341,079.813638979 | 13.9411% | **DISCREPANCY >1%** |
| before | 84 | 573,286.241545722 | 4,045.485421068 | 25,365.155475257 | 244.999999474 | 499,568.25457856 | 543,630.600649923 | -44,062.346071363 | 8.1051% | **DISCREPANCY >1%** |
| before | 85 | 2,507,829.00374027 | 101,240.455860461 | 63,690.163970276 | 247.014358269 | 1,950,373.413274667 | 2,342,651.369551264 | -392,277.956276597 | 16.7450% | **DISCREPANCY >1%** |
| before | 87 | 1,507,254.581541561 | 223,698.068303363 | 51,054.043826615 | 249.16625786 | 811,937.38714958 | 1,232,253.303153723 | -420,315.916004143 | 34.1095% | **DISCREPANCY >1%** |
| before | 88 | 3,458,020.069729538 | 42,432.314973574 | 95,634.800248138 | 249.870198751 | 3,189,628.068539638 | 3,319,703.084309075 | -130,075.015769437 | 3.9182% | **DISCREPANCY >1%** |
| before | 89 | 2,763,924.852090179 | 184,424.496583798 | 187,748.849811315 | 251.328223115 | 1,978,297.520002656 | 2,391,500.177471951 | -413,202.657469295 | 17.2779% | **DISCREPANCY >1%** |
| before | 90 | 140,111.393099798 | 116,392.269522858 | 0 | 88.032188469 | 140,001.653399788 | 23,631.091388471 | +116,370.562011317 | 492.4468% | **DISCREPANCY >1%** |
| before | 91 | 993,445.904660553 | 160,524.915777216 | 55,172.168180322 | 252.197144679 | 543,685.801296443 | 777,496.623558336 | -233,810.822261893 | 30.0722% | **DISCREPANCY >1%** |
| before | 93 | 3,180,194.543610404 | 181,921.200099591 | 10,625.139965884 | 254.306172544 | 2,086,451.787267245 | 2,987,393.897372385 | -900,942.11010514 | 30.1581% | **DISCREPANCY >1%** |
| before | 94 | 1,582,826.5781042 | 216,580.400930509 | 6,977.120150346 | 256.371739568 | 901,263.328629545 | 1,359,012.685283777 | -457,749.356654232 | 33.6824% | **DISCREPANCY >1%** |
| before | 95 | 2,823,492.04876599 | 223,698.068303101 | 92,584.118277643 | 256.028885665 | 1,759,219.58729414 | 2,506,953.833299581 | -747,734.246005441 | 29.8264% | **DISCREPANCY >1%** |
| before | 96 | 672,922.803045531 | 130,829.78226522 | 67,499.464576751 | 257.313063547 | 387,490.176423779 | 474,336.243140013 | -86,846.066716234 | 18.3089% | **DISCREPANCY >1%** |
| before | 97 | 941,687.995601605 | 24,305.834427164 | 251,255.528421329 | 258.065141945 | 624,754.286624672 | 665,868.567611167 | -41,114.280986495 | 6.1745% | **DISCREPANCY >1%** |
| before | 98 | 2,790,262.348044368 | 176,154.008844017 | 0 | 260.43573069 | 1,537,507.711157861 | 2,613,847.903469661 | -1,076,340.1923118 | 41.1783% | **DISCREPANCY >1%** |
| before | 100 | 1,799,788.095590657 | 201,831.869356847 | 8,577.774654887 | 261.477567769 | 1,136,482.892106863 | 1,589,116.974011154 | -452,634.081904291 | 28.4833% | **DISCREPANCY >1%** |
| before | 101 | 2,301,503.793430326 | 96,709.729814995 | 147,162.212142243 | 262.978266761 | 1,352,453.090541984 | 2,057,368.873206327 | -704,915.782664343 | 34.2629% | **DISCREPANCY >1%** |
| before | 102 | 843,138.314854854 | 50,526.561897738 | 158,995.005398752 | 263.295649427 | 571,127.582889633 | 633,353.451908937 | -62,225.869019304 | 9.8248% | **DISCREPANCY >1%** |
| before | 103 | 96,664.397144062 | 99,945.222911754 | 0 | 62.122111782 | 75,398.326108155 | 0 | +75,398.326108155 | ∞% | **DISCREPANCY >1%** |
| before | 104 | 3,062,962.342942101 | 0 | 8,693.224149186 | 265.76379112 | 2,725,130.208756965 | 3,054,003.355001795 | -328,873.14624483 | 10.7685% | **DISCREPANCY >1%** |
| before | 105 | 1,922,172.160350343 | 24,337.695348448 | 196,109.319715758 | 266.242109171 | 1,278,846.154813373 | 1,701,458.903176966 | -422,612.748363593 | 24.8382% | **DISCREPANCY >1%** |
| before | 106 | 2,376,980.760564706 | 144,209.176940372 | 53,273.846844962 | 268.301424906 | 1,487,849.779485208 | 2,179,229.435354466 | -691,379.655869258 | 31.7258% | **DISCREPANCY >1%** |
| before | 107 | 1,412,301.195707836 | 75,002.822267192 | 259,164.830731583 | 268.014369496 | 768,379.69328733 | 1,077,865.528339565 | -309,485.835052235 | 28.7128% | **DISCREPANCY >1%** |
| before | 108 | 1,530,514.515126298 | 44,888.690492425 | 38,862.313667517 | 270.752965263 | 1,054,527.794798477 | 1,446,492.758001093 | -391,964.963202616 | 27.0976% | **DISCREPANCY >1%** |
| before | 109 | 1,408,919.281801709 | 223,698.068310612 | 70,026.821602108 | 271.413033401 | 715,168.920824128 | 1,114,922.978855588 | -399,754.05803146 | 35.8548% | **DISCREPANCY >1%** |
| before | 110 | 2,492,962.419651006 | 0 | 114,614.851278508 | 271.551432272 | 1,729,173.602489589 | 2,378,076.016940226 | -648,902.414450637 | 27.2868% | **DISCREPANCY >1%** |
| before | 111 | 3,442,693.711521751 | 192,321.702770461 | 337,717.260844435 | 272.903836718 | 2,421,207.348894766 | 2,912,381.844070137 | -491,174.495175371 | 16.8650% | **DISCREPANCY >1%** |
| before | 112 | 1,865,761.736981223 | 173,200.851403845 | 85,660.90276259 | 274.726524846 | 858,535.424827937 | 1,606,625.256289942 | -748,089.831462005 | 46.5628% | **DISCREPANCY >1%** |
| before | 113 | 1,426,473.253958655 | 223,287.331033099 | 24,443.416711791 | 275.823731005 | 723,051.673206953 | 1,178,466.68248276 | -455,415.009275807 | 38.6447% | **DISCREPANCY >1%** |
| before | 114 | 1,394,584.909593141 | 54,534.060998196 | 206,406.330486726 | 275.314211225 | 818,971.595299437 | 1,133,369.203896994 | -314,397.608597557 | 27.7400% | **DISCREPANCY >1%** |
| before | 115 | 1,527,490.977031515 | 196,982.31937977 | 0 | 277.241311564 | 674,736.540831756 | 1,330,231.416340181 | -655,494.875508425 | 49.2767% | **DISCREPANCY >1%** |
| before | 117 | 1,577,385.159372488 | 0 | 110,042.604483153 | 279.659242898 | 1,182,843.699577966 | 1,467,062.895646437 | -284,219.196068471 | 19.3733% | **DISCREPANCY >1%** |
| before | 118 | 2,024,047.920306349 | 153,349.352006901 | 100,459.246518578 | 279.259844738 | 1,610,600.660779731 | 1,769,960.061936132 | -159,359.401156401 | 9.0035% | **DISCREPANCY >1%** |
| before | 119 | 1,493,334.518002894 | 127,462.331317651 | 0 | 281.16125126 | 720,015.01421028 | 1,365,591.025433983 | -645,576.011223703 | 47.2744% | **DISCREPANCY >1%** |
| before | 120 | 2,546,729.61913963 | 3,986.862247885 | 172,129.987304737 | 281.028677015 | 2,203,582.648794662 | 2,370,331.740909993 | -166,749.092115331 | 7.0348% | **DISCREPANCY >1%** |
| before | 121 | 2,766,645.954076083 | 211,264.855121109 | 0 | 282.990935578 | 1,535,311.697079252 | 2,555,098.108019396 | -1,019,786.410940144 | 39.9118% | **DISCREPANCY >1%** |
| before | 122 | 494,830.449887162 | 223,698.06146747 | 41,001.922983965 | 284.071585448 | 212,399.087082206 | 229,846.393850279 | -17,447.306768073 | 7.5908% | **DISCREPANCY >1%** |
| before | 123 | 1,850,353.345164228 | 117,012.394161995 | 40,622.003819962 | 285.954694253 | 1,545,775.094847816 | 1,692,432.992488018 | -146,657.897640202 | 8.6655% | **DISCREPANCY >1%** |
| before | 124 | 3,304,782.231651734 | 92,313.326894099 | 196,705.94008711 | 285.202246443 | 2,213,958.401766367 | 3,015,477.762424082 | -801,519.360657715 | 26.5801% | **DISCREPANCY >1%** |
| before | 125 | 2,325,820.430010415 | 223,698.068375433 | 7,964.547109056 | 287.897169575 | 1,109,743.523235324 | 2,093,869.917356351 | -984,126.394121027 | 47.0003% | **DISCREPANCY >1%** |
| before | 126 | 1,107,634.577479887 | 101,570.16062343 | 215,477.375953641 | 287.623123334 | 506,364.309783089 | 790,299.417779482 | -283,935.107996393 | 35.9275% | **DISCREPANCY >1%** |
| before | 127 | 2,802,818.648141101 | 201,728.715858691 | 45.025794905 | 289.321344103 | 1,653,334.165428989 | 2,600,755.585143402 | -947,421.419714413 | 36.4286% | **DISCREPANCY >1%** |
| before | 128 | 2,676,784.343533691 | 0 | 34,715.84016103 | 290.261683831 | 2,459,320.890947386 | 2,641,778.24168883 | -182,457.350741444 | 6.9066% | **DISCREPANCY >1%** |
| after | 1 | 2,484,441.267183304 | 826,743.498270167 | 17,184.489564018 | 19.364852001 | 1,659,802.584004906 | 1,640,493.914497118 | +19,308.669507788 | 1.1770% | **DISCREPANCY >1%** |
| after | 5 | 2,998,784.766104459 | 1,488,257.228963462 | 3,606.866435634 | 186.281869889 | 1,525,624.786765432 | 1,506,734.388835474 | +18,890.397929958 | 1.2537% | **DISCREPANCY >1%** |
| after | 11 | 2,980,620.483654968 | 1,145,934.992162841 | 129,211.932217336 | 192.661334501 | 1,724,261.701431808 | 1,705,280.89794029 | +18,980.803491518 | 1.1130% | **DISCREPANCY >1%** |
| after | 12 | 3,360,259.048608388 | 1,522,132.651258694 | 0 | 194.292697974 | 1,856,786.281218517 | 1,837,932.10465172 | +18,854.176566797 | 1.0258% | **DISCREPANCY >1%** |
| after | 13 | 2,419,741.443340406 | 593,048.370031793 | 16,582.21426827 | 194.761479009 | 1,828,953.545731635 | 1,809,916.097561334 | +19,037.448170301 | 1.0518% | **DISCREPANCY >1%** |
| after | 14 | 3,059,216.25751119 | 1,180,371.405325601 | 129,813.067943654 | 195.278374913 | 1,767,865.10047261 | 1,748,836.505867022 | +19,028.594605588 | 1.0880% | **DISCREPANCY >1%** |
| after | 15 | 1,282,875.282528394 | 354,654.991781899 | 218,452.591986798 | 196.096217231 | 716,745.344324384 | 709,571.602542466 | +7,173.741781918 | 1.0109% | **DISCREPANCY >1%** |
| after | 16 | 292,263.056082386 | 106,491.578931276 | 9,125.331581653 | 198.086571481 | 219,971.692133916 | 176,448.058997976 | +43,523.63313594 | 24.6665% | **DISCREPANCY >1%** |
| after | 19 | 2,545,339.975975296 | 1,005,152.040322882 | 720.725249714 | 200.424919886 | 1,558,366.405120635 | 1,539,266.785482814 | +19,099.619637821 | 1.2408% | **DISCREPANCY >1%** |
| after | 20 | 3,151,586.118117668 | 1,318,019.090795353 | 0 | 202.646865463 | 1,852,324.660431886 | 1,833,364.380456852 | +18,960.279975034 | 1.0341% | **DISCREPANCY >1%** |
| after | 33 | 2,301,834.231915595 | 584,226.582883127 | 87,386.920302737 | 215.090754797 | 1,649,218.144611554 | 1,630,005.637974934 | +19,212.50663662 | 1.1786% | **DISCREPANCY >1%** |
| after | 36 | 627,893.239072002 | 131,286.518958231 | 37,538.851627533 | 219.003480298 | 464,701.809419829 | 458,848.86500594 | +5,852.944413889 | 1.2755% | **DISCREPANCY >1%** |
| after | 39 | 3,166,437.553195886 | 1,460,083.628868387 | 29,373.416255258 | 220.780998102 | 1,695,429.468557074 | 1,676,759.727074139 | +18,669.741482935 | 1.1134% | **DISCREPANCY >1%** |
| after | 40 | 327,007.733918726 | 74,153.423804429 | 128,034.305600759 | 221.517385166 | 176,741.448835177 | 124,598.487128372 | +52,142.961706805 | 41.8487% | **DISCREPANCY >1%** |
| after | 41 | 2,975,175.611654056 | 973,744.279818439 | 217,217.580368984 | 222.976763385 | 1,802,863.651482052 | 1,783,990.774703248 | +18,872.876778804 | 1.0579% | **DISCREPANCY >1%** |
| after | 52 | 2,952,119.070821844 | 1,077,162.060889068 | 90.395967424 | 233.761205211 | 1,893,408.234763284 | 1,874,632.852760141 | +18,775.382003143 | 1.0015% | **DISCREPANCY >1%** |
| after | 56 | 2,646,408.264136623 | 774,485.915914827 | 13,997.922202342 | 237.282503566 | 1,876,658.38095267 | 1,857,687.143515888 | +18,971.237436782 | 1.0212% | **DISCREPANCY >1%** |
| after | 57 | 825,779.111178675 | 317,596.320183395 | 70,615.680938887 | 238.648963661 | 442,264.988899287 | 437,328.461092732 | +4,936.527806555 | 1.1287% | **DISCREPANCY >1%** |
| after | 58 | 297,305.290570974 | 161,966.767161337 | 0 | 89.223144202 | 228,682.61780516 | 135,249.300265435 | +93,433.317539725 | 69.0822% | **DISCREPANCY >1%** |
| after | 67 | 818,237.005618122 | 275,635.793013465 | 132,264.88633962 | 248.548133054 | 415,753.341684633 | 410,087.778131983 | +5,665.56355265 | 1.3815% | **DISCREPANCY >1%** |
| after | 78 | 650,051.486811965 | 64,569.373140067 | 93,439.420139376 | 260.779702539 | 497,791.007489218 | 491,781.913829983 | +6,009.093659235 | 1.2219% | **DISCREPANCY >1%** |
| after | 82 | 637,048.829536987 | 51,351.621683119 | 203,656.438410755 | 263.745850211 | 387,646.14878236 | 381,777.023592902 | +5,869.125189458 | 1.5373% | **DISCREPANCY >1%** |
| after | 90 | 140,131.393099798 | 116,392.269522858 | 0 | 108.032188426 | 140,001.653399788 | 23,631.091388514 | +116,370.562011274 | 492.4468% | **DISCREPANCY >1%** |
| after | 96 | 672,942.803045531 | 223,924.687813565 | 67,499.464576751 | 277.313063504 | 387,490.176423779 | 381,241.337591711 | +6,248.838832068 | 1.6390% | **DISCREPANCY >1%** |
| after | 103 | 96,684.397144062 | 99,945.222911754 | 0 | 51.507347497 | 75,428.940872399 | 0 | +75,428.940872399 | ∞% | **DISCREPANCY >1%** |
| after | 122 | 494,850.449887162 | 246,465.034375573 | 41,001.922983965 | 304.071585406 | 212,399.087082206 | 207,079.420942218 | +5,319.666139988 | 2.5689% | **DISCREPANCY >1%** |

## Accounting definitions

- Actual staked alpha: sum of every `TotalHotkeyAlpha(hotkey, netuid)` value.
- Pending alpha: `PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + PendingOwnerCut + PendingBasketDeposits`.
- Calculated staked alpha: saturating `SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha - pending alpha`.
- Discrepancy percentage: `abs(actual - calculated) / calculated × 100`.
