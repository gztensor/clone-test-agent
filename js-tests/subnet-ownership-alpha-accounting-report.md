# Subnet ownership conviction and alpha accounting

Generated: 2026-08-12T18:31:06.228Z

## Run summary

| Phase | Block | Runtime | Migration complete | Subnets | King calculation mismatches | Alpha discrepancies >1% |
|---|---:|---|---|---:|---:|---:|
| before | 14 | node-subtensor/443 | false | 128 | 0 | 121 |
| after | 26 | node-subtensor/445 | true | 128 | 0 | 26 |

> **Migration verification:** the historical-alpha correction applied on the clone despite its non-mainnet genesis `0x57a26328383c75e8d0089bced04da375d90811ad2b0072633efdccfb1bf13c80`. Subnet 1 expected approximately `+661,707.044125477 α` and observed `+661,707.044125477 α`; this exactly matched. After all migrations, `26` subnets exceed 1% discrepancy.

The pre-upgrade ownership threshold is `10% × SubnetAlphaOut`. The post-upgrade threshold is `10% × (SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha)`. Conviction forecasts roll the four aggregate lock buckets forward with the runtime exponential equations and evaluate only scheduled epoch checks. Clone-local block numbers are rebased onto the preserved mainnet BlockHash window before evaluating registration age or lock evolution. Forecasts assume no future lock transactions. They increase `SubnetAlphaOut` by the snapshot's constant `SubnetAlphaOutEmission` rate while holding future burned and protocol-owned alpha constant. “Not projected” means no qualifying different-owner king was found in the 10-year forecast window.

## TaoSwap gate-estimate comparison

TaoSwap's API field `gate_eta_days` forecasts when total conviction reaches the moving 10% threshold. It is not always the actual owner-change time: the runtime also requires a different-owner hotkey to be king. The TaoSwap observations below came from its public subnet API near the clone snapshot.

| Netuid | Clone moving-threshold gate ETA | TaoSwap gate ETA | Clone actual takeover ETA | Predicted takeover king |
|---:|---|---|---|---|
| 3 | 17.1 days | 18 days (block 8,830,031) | 17.1 days | `5E6yHkm…MUpnqG` |
| 20 | 3.0 days | 3 days (block 8,830,181) | 3.0 days | `5ED4s3B…qpwW2Q` |
| 24 | 16.8 days | 17 days (block 8,830,006) | 29.6 days | `5ELAvsv…v5WvWX` |
| 39 | 22.2 days | 23 days (block 8,830,031) | 22.2 days | `5GP7c3f…SWVCMi` |
| 81 | 8.8 days | 9 days (block 8,830,031) | 8.8 days | `5H47sFL…n4wdDa` |

## Changed subnet ownership takeover predictions

| Subnet netuid | Predicted takeover time interval before | Predicted takeover king before | Predicted takeover time interval after | Predicted takeover king after |
|---:|---|---|---|---|
| 3 | 17.1 days | `5E6yHkm…MUpnqG` | 0 | `5E6yHkm…MUpnqG` |
| 20 | 3.0 days | `5ED4s3B…qpwW2Q` | 0 | `5ED4s3B…qpwW2Q` |
| 24 | 29.6 days | `5ELAvsv…v5WvWX` | 29.7 days | `5ELAvsv…v5WvWX` |
| 39 | 22.2 days | `5GP7c3f…SWVCMi` | 0 | `5GP7c3f…SWVCMi` |
| 81 | 8.8 days | `5H47sFL…n4wdDa` | 0 | `5H47sFL…n4wdDa` |

## Before upgrade: subnet kings and takeover projection

Snapshot clone block: `14`; projection mainnet block: `8829634` (`0x95e5d7f5d037a096774057ba58f5f3c699c4b4bf0a4016e413d0e08f74d20e9a`)

Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α now | Threshold growth α/day | Gate | Gate ETA | Mature | Projected takeover | Projected king |
|---:|---|---|---:|---:|---:|---|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,833.4781 | 248,442.7267 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 332,852.9356 | 720 | met | 0 | yes | not projected within 10y | — |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 246,383.48 | 280,269.529 | 720 | not met | 17.1 days | yes | 17.1 days (block 8952795) | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.1165 | 350,341.8679 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 299,876.9752 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 271,588.5911 | 720 | met | 0 | yes | not projected within 10y | — |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 312,992.9312 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,572.4092 | 303,475.1034 | 720 | met | 0 | yes | not projected within 10y | — |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 394,101.8087 | 720 | met | 0 | yes | not projected within 10y | — |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,046.8285 | 311,809.96 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 298,060.3756 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 336,024.5049 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 241,972.7443 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,413.0324 | 305,920.2258 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 128,285.6272 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,310.2857 | 29,224.9056 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 487,150.2137 | 302,563.9344 | 720 | met | 0 | yes | not projected within 10y | — |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 322,151.8358 | 720 | met | 0 | yes | not projected within 10y | — |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 254,532.5665 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 287,654.6206 | 315,157.2118 | 720 | not met | 3.0 days | yes | 3.0 days (block 8851337) | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 344,633.8945 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 342,468.5079 | 720 | met | 0 | yes | not projected within 10y | — |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 476,839.9086 | 404,089.4136 | 720 | met | 0 | yes | not projected within 10y | — |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 271,761.4236 | 364,168.7385 | 720 | not met | 16.8 days | yes | 29.6 days (block 9043024) | `5ELAvsv…v5WvWX` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 411,655.7161 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 2,553.3793 | 77,667.1347 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 321,707.6984 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,349.6214 | 465,262.793 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 289,848.5593 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 338,256.6049 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 158,650.0688 | 720 | met | 0 | no | not projected within 10y | — |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 342,720.9833 | 720 | met | 0 | yes | not projected within 10y | — |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.5272 | 230,181.9364 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,306.8908 | 251,773.5175 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,183.1015 | 298,851.9928 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 62,787.9239 | 720 | met | 0 | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 357,254.4216 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 38,442.6259 | 147,308.3216 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 186,554.9447 | 316,642.3553 | 720 | not met | 22.2 days | yes | 22.2 days (block 8989581) | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 32,699.3734 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 297,516.1612 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 259,503.1142 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 305,277.5885 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 401,236.4799 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2915 | 301,174.0442 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 173,963.1913 | 351,070.6598 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,593.7091 | 129,551.7895 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 310,752.305 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 201,786.4081 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 323,690.305 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.4615 | 369,483.2879 | 720 | met | 0 | yes | not projected within 10y | — |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 295,210.5071 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 458,744.3088 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 377,419.4692 | 720 | met | 0 | yes | not projected within 10y | — |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 279,932.5289 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 264,639.4264 | 720 | met | 0 | yes | not projected within 10y | — |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 82,576.5111 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 29,729.1291 | 720 | met | 0 | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 387,345.7258 | 319,372.1959 | 720 | met | 0 | yes | not projected within 10y | — |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,073,423.1645 | 373,892.6574 | 720 | met | 0 | yes | not projected within 10y | — |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 436,863.9105 | 720 | met | 0 | yes | not projected within 10y | — |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 148,964.7262 | 263,936.9639 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 381,725.1354 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,047.7225 | 334,075.8563 | 720 | met | 0 | yes | not projected within 10y | — |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 322,317.5027 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 335,555.5768 | 720 | met | 0 | yes | not projected within 10y | — |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 81,822.3006 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 601,811.4716 | 360,650.413 | 720 | met | 0 | yes | not projected within 10y | — |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 112,774.5984 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,832.1224 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 418,511.0678 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 504,433.7229 | 248,679.3252 | 720 | met | 0 | yes | not projected within 10y | — |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 940,168.1049 | 328,037.092 | 720 | met | 0 | yes | not projected within 10y | — |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 333,591.1259 | 720 | met | 0 | yes | not projected within 10y | — |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,610.2123 | 350,855.3337 | 720 | met | 0 | yes | not projected within 10y | — |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 101,467.0381 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 321,182.9798 | 720 | met | 0 | yes | not projected within 10y | — |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 65,003.7487 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 352,217.2967 | 720 | met | 0 | yes | not projected within 10y | — |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 180,579.7602 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 198,529.5915 | 260,434.3932 | 720 | not met | 8.8 days | yes | 8.8 days (block 8892791) | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 63,703.483 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 265,515.8095 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 57,329.2242 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 250,783.5098 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | 0 | met | 0 | no | not projected within 10y | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,808.9605 | 150,726.0582 | 720 | met | 0 | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 345,802.6149 | 720 | met | 0 | yes | not projected within 10y | — |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 276,393.0852 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 14,011.7393 | 720 | met | 0 | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 73,528.1935 | 99,345.2177 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 38,288.0229 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,285.2761 | 318,020.241 | 720 | met | 0 | yes | not projected within 10y | — |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 158,283.2578 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 282,349.8049 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 149,657.9177 | 67,292.8803 | 720 | met | 0 | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 94,169.5694 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 588,403.3988 | 279,026.8348 | 720 | met | 0 | yes | not projected within 10y | — |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 21,753.4329 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 328,265.807 | 179,979.4096 | 720 | met | 0 | no | not projected within 10y | — |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 230,150.9793 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 84,314.4315 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 9,667.0397 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 306,296.8343 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 200,542.2244 | 192,217.8635 | 720 | met | 0 | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 272,897.0215 | 237,698.6761 | 720 | met | 0 | yes | not projected within 10y | — |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 141,230.9405 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 319,529.4043 | 153,052.0515 | 720 | met | 0 | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,573.3408 | 140,892.5282 | 720 | met | 0 | no | not projected within 10y | — |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 249,296.8945 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 344,269.9712 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 186,576.7737 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 81,417.7827 | 142,647.9254 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 139,459.2219 | 720 | met | 0 | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 152,749.6977 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 49,832.7033 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 161,680.6834 | 157,739.1159 | 720 | met | 0 | yes | not projected within 10y | — |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 118,221.0028 | 202,405.392 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 149,334.0518 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,233.8026 | 254,673.8725 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 276,665.1954 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 100,469.4307 | 49,483.645 | 720 | met | 0 | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 185,035.9345 | 720 | met | 0 | yes | not projected within 10y | — |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 330,479.0221 | 720 | met | 0 | yes | not projected within 10y | — |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 232,582.643 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 122,563.9071 | 110,764.0577 | 720 | met | 0 | no | not projected within 10y | — |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 280,282.4648 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5742 | 267,679.0344 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |

## After upgrade: subnet kings and takeover projection

Snapshot clone block: `26`; projection mainnet block: `8829646` (`0x8ec1c3b5b991058ac34a6ebc61befcd97f0b59d752b54223411a3a9c13450750`)

Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α now | Threshold growth α/day | Gate | Gate ETA | Mature | Projected takeover | Projected king |
|---:|---|---|---:|---:|---:|---|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,833.4782 | 164,051.1279 | 720 | met | 0 | yes | not projected within 10y | — |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 269,254.988 | 720 | met | 0 | yes | not projected within 10y | — |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 246,388.9401 | 205,971.6071 | 720 | met | 0 | yes | 0 | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.1165 | 279,299.2767 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 150,691.8671 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 243,343.9459 | 720 | met | 0 | yes | not projected within 10y | — |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 307,077.9512 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,572.4092 | 218,532.5127 | 720 | met | 0 | yes | not projected within 10y | — |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 264,396.8118 | 720 | met | 0 | yes | not projected within 10y | — |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,046.7774 | 239,523.7055 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 170,547.1559 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 183,812.4397 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 181,010.8859 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,412.8187 | 174,902.9784 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 70,976.5699 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,310.4021 | 17,664.4146 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 487,150.3015 | 257,313.3071 | 720 | met | 0 | yes | not projected within 10y | — |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 270,931.4989 | 720 | met | 0 | yes | not projected within 10y | — |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 153,946.521 | 720 | met | 0 | yes | not projected within 10y | — |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 287,671.9157 | 183,356.5027 | 720 | met | 0 | yes | 0 | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 262,226.1099 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 223,505.4097 | 720 | met | 0 | yes | not projected within 10y | — |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 476,839.5326 | 269,832.8056 | 720 | met | 0 | yes | not projected within 10y | — |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 271,774.1288 | 294,678.9884 | 720 | not met | 3.5 days | yes | 29.7 days (block 9043153) | `5ELAvsv…v5WvWX` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 324,387.7702 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 2,553.4707 | 66,938.6342 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 199,148.6014 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,349.6215 | 312,610.365 | 720 | met | 0 | yes | not projected within 10y | — |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 228,766.824 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 264,942.9257 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 88,756.9692 | 720 | met | 0 | no | not projected within 10y | — |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 331,482.2094 | 720 | met | 0 | yes | not projected within 10y | — |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.5272 | 163,021.8729 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,306.0611 | 202,475.2707 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,183.0902 | 262,604.738 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 45,906.5868 | 720 | met | 0 | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 236,327.477 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 38,442.1372 | 88,287.9979 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 186,568.9905 | 167,697.8508 | 720 | met | 0 | yes | 0 | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 12,481.8005 | 720 | met | 0 | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 178,421.1751 | 720 | met | 0 | yes | not projected within 10y | — |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 216,440.0585 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 219,448.9543 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 337,919.2954 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2916 | 198,986.6353 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 173,962.8475 | 249,686.9057 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,594.2392 | 68,395.2628 | 720 | met | 0 | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 231,037.7729 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 115,932.2403 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 272,902.9618 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.4611 | 237,049.6522 | 720 | met | 0 | yes | not projected within 10y | — |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 187,486.4614 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 398,377.8563 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 316,752.0673 | 720 | met | 0 | yes | not projected within 10y | — |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 238,869.8572 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 185,792.2426 | 720 | met | 0 | yes | not projected within 10y | — |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 43,756.511 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 13,533.6523 | 720 | met | 0 | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 387,345.5314 | 262,991.1676 | 720 | met | 0 | yes | not projected within 10y | — |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,073,422.3122 | 306,945.1083 | 720 | met | 0 | yes | not projected within 10y | — |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 347,893.1574 | 720 | met | 0 | yes | not projected within 10y | — |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 148,964.6775 | 241,210.3741 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 294,470.1532 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,047.7088 | 290,608.6082 | 720 | met | 0 | yes | not projected within 10y | — |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 228,376.4179 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 239,591.5128 | 720 | met | 0 | yes | not projected within 10y | — |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 41,033.4326 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 601,808.8854 | 275,536.218 | 720 | met | 0 | yes | not projected within 10y | — |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 78,647.4982 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,818.5055 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 322,297.8954 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 504,427.3249 | 210,353.1527 | 720 | met | 0 | yes | not projected within 10y | — |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 940,168.908 | 181,142.8851 | 720 | met | 0 | yes | not projected within 10y | — |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 270,983.9493 | 720 | met | 0 | yes | not projected within 10y | — |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,610.2123 | 270,706.478 | 720 | met | 0 | yes | not projected within 10y | — |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 53,478.8487 | 720 | met | 0 | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 251,020.1567 | 720 | met | 0 | yes | not projected within 10y | — |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 49,204.0694 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 292,726.3722 | 720 | met | 0 | yes | not projected within 10y | — |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 157,088.5106 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 198,543.9427 | 164,080.5802 | 720 | met | 0 | yes | 0 | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 38,203.8769 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 210,166.4559 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 50,479.9578 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 194,779.584 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | 0 | met | 0 | no | not projected within 10y | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,806.8882 | 80,881.5635 | 720 | met | 0 | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 318,713.3957 | 720 | met | 0 | yes | not projected within 10y | — |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 197,576.7047 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 2,373.7124 | 720 | met | 0 | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 73,527.3363 | 53,891.4961 | 720 | met | 0 | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 16,477.739 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,285.1155 | 208,375.2244 | 720 | met | 0 | yes | not projected within 10y | — |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 89,567.0698 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 175,510.7202 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 149,657.6557 | 38,151.6651 | 720 | met | 0 | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 61,957.7691 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 588,395.9627 | 153,478.9954 | 720 | met | 0 | yes | not projected within 10y | — |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 14,554.1728 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 328,261.744 | 113,125.5907 | 720 | met | 0 | no | not projected within 10y | — |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 134,785.8538 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 56,607.6601 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 0 | 720 | met | 0 | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 271,396.5946 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 200,541.204 | 127,443.6401 | 720 | met | 0 | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 272,896.8074 | 148,508.7379 | 720 | met | 0 | yes | not projected within 10y | — |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 76,343.8581 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 319,525.3065 | 104,888.5634 | 720 | met | 0 | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,573.3302 | 71,199.0627 | 720 | met | 0 | no | not projected within 10y | — |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 172,476.3365 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 241,803.0643 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 85,442.2213 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 81,416.7421 | 71,956.1775 | 720 | met | 0 | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 81,438.5132 | 720 | met | 0 | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 67,001.4404 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 32,210.3407 | 720 | not met | not projected within 10y | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 161,681.5812 | 117,793.5953 | 720 | met | 0 | yes | not projected within 10y | — |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 118,220.6342 | 160,563.0863 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 71,681.4632 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,232.8756 | 220,031.8243 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 153,232.2778 | 720 | met | 0 | yes | not projected within 10y | — |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 100,468.3611 | 20,738.1493 | 720 | met | 0 | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 154,291.3223 | 720 | met | 0 | yes | not projected within 10y | — |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 221,108.9659 | 720 | met | 0 | yes | not projected within 10y | — |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 110,671.2881 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 122,565.7891 | 50,235.0637 | 720 | met | 0 | no | not projected within 10y | — |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 165,027.992 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5742 | 245,607.1709 | 720 | not met | not projected within 10y | yes | not projected within 10y | — |

## Before upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,484,427.267183304 | 165,036.45414469 | 17,184.489564018 | 6.761008795 | 1,659,801.187848141 | 2,302,199.562465801 | -642,398.37461766 | 27.9036% | **DISCREPANCY >1%** |
| 2 | 3,328,529.356043044 | 186,958.253739906 | 277.903743213 | 170.500851146 | 2,711,313.00299156 | 3,141,122.697708779 | -429,809.694717219 | 13.6833% | **DISCREPANCY >1%** |
| 3 | 2,802,695.289972275 | 0.468119708 | 164,515.884271231 | 170.126595339 | 2,078,448.8879906 | 2,638,008.810985997 | -559,559.922995397 | 21.2114% | **DISCREPANCY >1%** |
| 4 | 3,503,418.678723213 | 13,456.73137153 | 157,413.944024015 | 171.029751167 | 2,811,300.435005442 | 3,332,376.973576501 | -521,076.538571059 | 15.6367% | **DISCREPANCY >1%** |
| 5 | 2,998,769.751609426 | 209,823.537800336 | 3,605.851940601 | 172.281869918 | 1,525,624.786765432 | 2,785,168.079998571 | -1,259,543.293233139 | 45.2232% | **DISCREPANCY >1%** |
| 6 | 2,715,885.911458657 | 23,468.530961558 | 97,097.786802825 | 175.346869967 | 2,451,996.683773013 | 2,595,144.246824307 | -143,147.563051294 | 5.5159% | **DISCREPANCY >1%** |
| 7 | 3,129,929.311512733 | 0 | 23,076.821212896 | 175.075388487 | 3,089,552.962272271 | 3,106,677.41491135 | -17,124.452639079 | 0.5512% | OK |
| 8 | 3,034,751.033519529 | 170,998.084151705 | 68,569.752144899 | 175.086928503 | 2,204,088.317242778 | 2,795,008.110294422 | -590,919.793051644 | 21.1419% | **DISCREPANCY >1%** |
| 9 | 3,941,018.0872791 | 189,930.97794848 | 162,571.649216545 | 176.118320415 | 2,662,702.753243412 | 3,588,339.34179366 | -925,636.588550248 | 25.7956% | **DISCREPANCY >1%** |
| 10 | 3,118,099.600023772 | 223,846.079166223 | 3,919.775094447 | 177.688883115 | 2,413,820.773748008 | 2,890,156.056879987 | -476,335.283131979 | 16.4812% | **DISCREPANCY >1%** |
| 11 | 2,980,603.755600748 | 58,843.162874805 | 129,209.204163116 | 178.661334532 | 1,724,261.701431808 | 2,792,372.727228295 | -1,068,111.025796487 | 38.2510% | **DISCREPANCY >1%** |
| 12 | 3,360,245.048608388 | 222,508.114052081 | 0 | 180.292698004 | 1,856,786.281218517 | 3,137,556.641858303 | -1,280,770.360639786 | 40.8206% | **DISCREPANCY >1%** |
| 13 | 2,419,727.443340406 | 148,967.172896852 | 16,582.21426827 | 180.761479039 | 1,828,953.545731635 | 2,253,997.294696245 | -425,043.74896461 | 18.8573% | **DISCREPANCY >1%** |
| 14 | 3,059,202.25751119 | 220,189.208395156 | 129,813.067943654 | 181.278374944 | 1,767,865.10047261 | 2,709,018.702797436 | -941,153.602324826 | 34.7414% | **DISCREPANCY >1%** |
| 15 | 1,282,856.272315984 | 52,905.700586193 | 218,447.581774388 | 182.096217262 | 716,745.344324384 | 1,011,320.893738141 | -294,575.549413757 | 29.1278% | **DISCREPANCY >1%** |
| 16 | 292,249.056082386 | 106,491.578931276 | 9,125.331581653 | 184.086571512 | 219,971.692133916 | 176,448.058997945 | +43,523.633135971 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,639.344244047 | 35,067.621313474 | 112,042.669109647 | 184.357595994 | 2,591,753.716854974 | 2,878,344.696224932 | -286,590.979369958 | 9.9567% | **DISCREPANCY >1%** |
| 18 | 3,221,518.3581729 | 82,212.573733221 | 184,937.037344576 | 421.502768772 | 2,728,012.390175507 | 2,953,947.244326331 | -225,934.854150824 | 7.6485% | **DISCREPANCY >1%** |
| 19 | 2,545,325.665259176 | 203,827.261478907 | 720.414533594 | 186.424919916 | 1,558,366.405120635 | 2,340,591.564326759 | -782,225.159206124 | 33.4199% | **DISCREPANCY >1%** |
| 20 | 3,151,572.118117668 | 223,846.079145155 | 0 | 188.646865492 | 1,852,324.660431886 | 2,927,537.392107021 | -1,075,212.731675135 | 36.7275% | **DISCREPANCY >1%** |
| 21 | 3,446,338.944539729 | 160,850.042236821 | 12,526.594993624 | 189.583376074 | 2,641,137.2895972 | 3,272,772.72393321 | -631,635.43433601 | 19.2997% | **DISCREPANCY >1%** |
| 22 | 3,424,685.078972077 | 161,827.727614681 | 8,538.815663423 | 190.742051115 | 2,253,922.90864158 | 3,254,127.793642858 | -1,000,204.885001278 | 30.7364% | **DISCREPANCY >1%** |
| 23 | 4,040,894.136284042 | 117,779.002762432 | 257,565.47245039 | 191.241550714 | 2,717,035.06015898 | 3,665,358.419520506 | -948,323.359361526 | 25.8725% | **DISCREPANCY >1%** |
| 24 | 3,641,687.385197894 | 75,925.654771513 | 113,298.120046902 | 192.496276118 | 2,964,647.656840732 | 3,452,271.114103361 | -487,623.457262629 | 14.1247% | **DISCREPANCY >1%** |
| 25 | 4,116,557.160734956 | 223,846.079136167 | 0 | 192.348350599 | 3,262,570.098652547 | 3,892,518.73324819 | -629,948.634595643 | 16.1835% | **DISCREPANCY >1%** |
| 26 | 776,671.346869401 | 73,459.26989387 | 16,231.463886896 | 193.88574582 | 673,306.86442606 | 686,786.727342815 | -13,479.862916755 | 1.9627% | **DISCREPANCY >1%** |
| 27 | 3,217,076.984189999 | 223,846.079203415 | 114.576078423 | 197.326060412 | 2,010,230.893396306 | 2,992,919.002847749 | -982,688.109451443 | 32.8337% | **DISCREPANCY >1%** |
| 28 | 4,652,627.929788247 | 176,806.130994487 | 146,399.333896011 | 195.210187185 | 3,144,789.333292944 | 4,329,227.254710564 | -1,184,437.92141762 | 27.3591% | **DISCREPANCY >1%** |
| 29 | 2,898,485.592659301 | 0 | 0 | 197.726660967 | 2,306,335.831049477 | 2,898,287.865998334 | -591,952.034948857 | 20.4241% | **DISCREPANCY >1%** |
| 30 | 3,382,566.048550954 | 223,846.079129087 | 22,914.692387486 | 198.461152408 | 2,667,110.572279116 | 3,135,606.815881973 | -468,496.243602857 | 14.9411% | **DISCREPANCY >1%** |
| 31 | 1,586,500.687500347 | 223,846.079187058 | 38,096.765184011 | 198.694922329 | 893,531.693731475 | 1,324,359.148206949 | -430,827.454475474 | 32.5310% | **DISCREPANCY >1%** |
| 32 | 3,427,209.832587246 | 0 | 94,980.465258985 | 200.895902589 | 3,333,422.893428039 | 3,332,028.471425672 | +1,394.422002367 | 0.0418% | OK |
| 33 | 2,301,819.364165814 | 89,682.65958267 | 87,386.052552956 | 201.090754826 | 1,649,218.144611554 | 2,124,549.561275362 | -475,331.416663808 | 22.3732% | **DISCREPANCY >1%** |
| 34 | 2,517,735.1749933 | 0 | 133,525.194662428 | 201.353990364 | 2,043,591.427143987 | 2,384,008.626340508 | -340,417.199196521 | 14.2791% | **DISCREPANCY >1%** |
| 35 | 2,988,519.927713479 | 0 | 95,598.20397956 | 204.133908825 | 2,644,675.94827133 | 2,892,717.589825094 | -248,041.641553764 | 8.5746% | **DISCREPANCY >1%** |
| 36 | 627,879.239072002 | 9,298.851890397 | 37,538.851627533 | 205.003480326 | 464,701.809419829 | 580,836.532073746 | -116,134.722653917 | 19.9943% | **DISCREPANCY >1%** |
| 37 | 3,572,544.215572503 | 223,846.079137807 | 0 | 205.37359398 | 2,381,932.136047951 | 3,348,492.762840716 | -966,560.626792765 | 28.8655% | **DISCREPANCY >1%** |
| 38 | 1,473,083.216289116 | 139,486.240803376 | 104,918.174889194 | 850.101524222 | 886,266.551300017 | 1,227,828.699072324 | -341,562.147772307 | 27.8183% | **DISCREPANCY >1%** |
| 39 | 3,166,423.553195886 | 172,663.511264212 | 29,373.416255258 | 206.780998132 | 1,695,429.468557074 | 2,964,179.844678284 | -1,268,750.37612121 | 42.8027% | **DISCREPANCY >1%** |
| 40 | 326,993.733918726 | 74,153.423804429 | 128,034.305600759 | 207.517385196 | 176,741.448835177 | 124,598.487128342 | +52,142.961706835 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,161.611654056 | 204,063.185350324 | 217,217.580368984 | 208.976763414 | 1,802,863.651482052 | 2,553,671.869171334 | -750,808.217689282 | 29.4011% | **DISCREPANCY >1%** |
| 42 | 2,595,031.142096049 | 223,846.079158774 | 0 | 210.919954623 | 2,183,122.943907032 | 2,370,974.142982652 | -187,851.19907562 | 7.9229% | **DISCREPANCY >1%** |
| 43 | 3,052,775.884567396 | 179,562.708609502 | 418.387877525 | 211.016150204 | 2,212,435.691834392 | 2,872,583.771930165 | -660,148.080095773 | 22.9809% | **DISCREPANCY >1%** |
| 44 | 4,012,364.799169571 | 82,938.546710406 | 126,789.720511519 | 211.02933625 | 3,398,459.104068 | 3,802,425.502611396 | -403,966.398543396 | 10.6239% | **DISCREPANCY >1%** |
| 45 | 3,011,740.442172559 | 186,957.988153914 | 0 | 214.877745742 | 2,008,703.116929344 | 2,824,567.576272903 | -815,864.459343559 | 28.8845% | **DISCREPANCY >1%** |
| 46 | 3,510,706.597918791 | 140,033.673137159 | 93,394.806384354 | 214.017693848 | 2,515,548.15997582 | 3,277,064.10070343 | -761,515.94072761 | 23.2377% | **DISCREPANCY >1%** |
| 47 | 1,295,517.895427735 | 221,936.771527767 | 22,924.082606544 | 215.661885473 | 687,673.465762526 | 1,050,441.379407951 | -362,767.913645425 | 34.5348% | **DISCREPANCY >1%** |
| 48 | 3,107,523.04985937 | 0 | 101,664.859193657 | 216.700853072 | 2,328,846.687272452 | 3,005,641.489812641 | -676,794.802540189 | 22.5174% | **DISCREPANCY >1%** |
| 49 | 2,017,864.081163608 | 120,325.749958529 | 164,458.906370542 | 216.470969157 | 1,164,300.147403006 | 1,732,862.95386538 | -568,562.806462374 | 32.8106% | **DISCREPANCY >1%** |
| 50 | 3,236,903.049890369 | 84,285.185243783 | 40,263.969667629 | 217.870419978 | 2,747,775.456897652 | 3,112,136.024558979 | -364,360.567661327 | 11.7077% | **DISCREPANCY >1%** |
| 51 | 3,694,832.878966849 | 105,922.936515629 | 153,201.41147874 | 218.014881534 | 2,389,201.875098131 | 3,435,490.516090946 | -1,046,288.640992815 | 30.4552% | **DISCREPANCY >1%** |
| 52 | 2,952,105.070821844 | 223,846.079128825 | 90.395967424 | 219.761205239 | 1,893,408.234763284 | 2,727,948.834520356 | -834,540.599757072 | 30.5922% | **DISCREPANCY >1%** |
| 53 | 4,587,443.088448493 | 165,100.951333266 | 83,434.192075195 | 220.141069516 | 4,002,412.306866003 | 4,338,687.803970516 | -336,275.497104513 | 7.7506% | **DISCREPANCY >1%** |
| 54 | 3,774,194.691772849 | 104,605.505486405 | 43,761.132345373 | 222.262086176 | 3,186,263.949667802 | 3,625,605.791854895 | -439,341.842187093 | 12.1177% | **DISCREPANCY >1%** |
| 55 | 2,799,325.289393601 | 9,506.992017657 | 94,545.881062638 | 224.134605104 | 2,407,570.599805009 | 2,695,048.281708202 | -287,477.681903193 | 10.6668% | **DISCREPANCY >1%** |
| 56 | 2,646,394.264136623 | 147,253.342830014 | 13,997.922202342 | 223.282503599 | 1,876,658.38095267 | 2,484,919.716600668 | -608,261.335647998 | 24.4781% | **DISCREPANCY >1%** |
| 57 | 825,765.111178675 | 223,846.079159495 | 70,615.680938887 | 224.64896369 | 442,264.988899287 | 531,078.702116603 | -88,813.713217316 | 16.7232% | **DISCREPANCY >1%** |
| 58 | 297,291.290570974 | 161,966.767161337 | 0 | 75.223144231 | 228,682.61780516 | 135,249.300265406 | +93,433.317539754 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,721.959417721 | 71,891.198873536 | 122,883.114116497 | 229.495433115 | 2,648,586.34800194 | 2,998,718.150994573 | -350,131.802992633 | 11.6760% | **DISCREPANCY >1%** |
| 60 | 3,738,926.573624944 | 121,459.892472139 | 40,528.882878666 | 228.011153468 | 3,088,309.198855045 | 3,576,709.787120671 | -488,400.588265626 | 13.6550% | **DISCREPANCY >1%** |
| 61 | 4,368,639.105191268 | 113,406.497793948 | 81,349.386432235 | 228.599154633 | 3,497,985.843054945 | 4,173,654.621810452 | -675,668.778755507 | 16.1889% | **DISCREPANCY >1%** |
| 62 | 2,639,369.638787585 | 1,029.291966503 | 43,103.624524784 | 229.315194547 | 2,431,187.062364878 | 2,595,007.407101751 | -163,820.344736873 | 6.3129% | **DISCREPANCY >1%** |
| 63 | 3,817,251.354117539 | 0 | 147,122.425849148 | 230.616747359 | 2,963,791.083203702 | 3,669,898.311521032 | -706,107.22831733 | 19.2405% | **DISCREPANCY >1%** |
| 64 | 3,340,758.563434309 | 44,721.605785854 | 166,751.204417774 | 231.063767961 | 2,925,100.024232174 | 3,129,054.68946272 | -203,954.665230546 | 6.5180% | **DISCREPANCY >1%** |
| 65 | 3,223,175.02667184 | 204,139.305947923 | 71.722624687 | 234.953625582 | 2,290,879.611105601 | 3,018,729.044473648 | -727,849.433368047 | 24.1111% | **DISCREPANCY >1%** |
| 66 | 3,355,555.767963545 | 58,498.893235066 | 83,262.913449555 | 234.876365683 | 2,399,574.013147158 | 3,213,559.084913241 | -813,985.071766083 | 25.3297% | **DISCREPANCY >1%** |
| 67 | 818,223.005618122 | 94,182.859728691 | 132,264.88633962 | 234.548133083 | 415,753.341684633 | 591,540.711416728 | -175,787.369732095 | 29.7168% | **DISCREPANCY >1%** |
| 68 | 3,606,504.130402946 | 51,820.059551198 | 169,947.445170269 | 235.156427279 | 2,757,678.262310717 | 3,384,501.4692542 | -626,823.206943483 | 18.5203% | **DISCREPANCY >1%** |
| 69 | 1,127,745.983729383 | 223,846.079187092 | 59,604.102841208 | 236.154576653 | 789,692.225967185 | 844,059.64712443 | -54,367.421157245 | 6.4411% | **DISCREPANCY >1%** |
| 70 | 38,321.22374926 | 148.169094182 | 0 | 172.182726691 | 38,149.040995632 | 38,000.871928387 | +148.169067245 | 0.3899% | OK |
| 71 | 4,185,110.677766843 | 96,876.088940082 | 85,705.37638208 | 239.451983458 | 3,225,073.636749908 | 4,002,289.760461223 | -777,216.123711315 | 19.4192% | **DISCREPANCY >1%** |
| 72 | 2,486,793.251902087 | 221,779.667597505 | 0 | 240.603932782 | 2,105,694.740466461 | 2,264,772.9803718 | -159,078.239905339 | 7.0240% | **DISCREPANCY >1%** |
| 73 | 3,280,370.920420528 | 223,846.079132607 | 0 | 241.105893987 | 1,813,676.942884909 | 3,056,283.735393934 | -1,242,606.792509025 | 40.6574% | **DISCREPANCY >1%** |
| 74 | 3,335,911.259227667 | 0 | 94,292.343237338 | 242.356012707 | 2,712,295.874311409 | 3,241,376.559977622 | -529,080.685666213 | 16.3227% | **DISCREPANCY >1%** |
| 75 | 3,508,553.336526073 | 203,423.332505008 | 16,895.677372022 | 242.228181427 | 2,709,395.891317406 | 3,287,992.098467616 | -578,596.20715021 | 17.5972% | **DISCREPANCY >1%** |
| 76 | 1,014,670.381470641 | 179,713.432857498 | 4,053.056546057 | 244.707430135 | 539,215.189087256 | 830,659.184636951 | -291,443.995549695 | 35.0858% | **DISCREPANCY >1%** |
| 77 | 3,211,829.798076511 | 0 | 560,753.334406754 | 244.999075644 | 2,512,507.442349621 | 2,650,831.464594113 | -138,324.022244492 | 5.2181% | **DISCREPANCY >1%** |
| 78 | 650,037.486811965 | 6,499.356268383 | 93,439.420139376 | 246.779702568 | 497,791.007489218 | 549,851.930701638 | -52,060.92321242 | 9.4681% | **DISCREPANCY >1%** |
| 79 | 3,522,172.966630965 | 63,794.223490279 | 150,691.305356149 | 246.600830674 | 2,929,780.461334615 | 3,307,440.836953863 | -377,660.375619248 | 11.4185% | **DISCREPANCY >1%** |
| 80 | 1,805,797.602432742 | 144,923.552045991 | 42,374.70227022 | 247.09083155 | 1,575,661.087864241 | 1,618,252.257284981 | -42,591.16942074 | 2.6319% | **DISCREPANCY >1%** |
| 81 | 2,604,343.932190403 | 20,523.249052955 | 112,247.78138507 | 248.414012898 | 1,643,122.255968379 | 2,471,324.48773948 | -828,202.231771101 | 33.5124% | **DISCREPANCY >1%** |
| 82 | 637,034.829536987 | 1,033.20576559 | 203,656.438410755 | 249.745850241 | 387,646.14878236 | 432,095.439510401 | -44,449.290728041 | 10.2869% | **DISCREPANCY >1%** |
| 83 | 2,655,158.094539082 | 0 | 208,332.711813588 | 250.256934032 | 2,105,495.312152469 | 2,446,575.125791462 | -341,079.813638993 | 13.9411% | **DISCREPANCY >1%** |
| 84 | 573,292.241545722 | 4,045.485421068 | 25,365.155475257 | 250.999999461 | 499,568.25457856 | 543,630.600649936 | -44,062.346071376 | 8.1051% | **DISCREPANCY >1%** |
| 85 | 2,507,835.097649252 | 101,240.455860461 | 63,690.257879258 | 253.014358256 | 1,950,373.413274667 | 2,342,651.369551277 | -392,277.95627661 | 16.7450% | **DISCREPANCY >1%** |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,260.581541561 | 223,698.068303363 | 51,054.043826615 | 255.166257847 | 811,937.38714958 | 1,232,253.303153736 | -420,315.916004156 | 34.1095% | **DISCREPANCY >1%** |
| 88 | 3,458,026.149023523 | 42,432.314973574 | 95,634.879542123 | 255.870198737 | 3,189,628.068539638 | 3,319,703.084309089 | -130,075.015769451 | 3.9182% | **DISCREPANCY >1%** |
| 89 | 2,763,930.852090179 | 184,424.496583798 | 187,748.849811315 | 257.328223102 | 1,978,297.520002656 | 2,391,500.177471964 | -413,202.657469308 | 17.2779% | **DISCREPANCY >1%** |
| 90 | 140,117.393099798 | 116,392.269522858 | 0 | 94.032188456 | 140,001.653399788 | 23,631.091388484 | +116,370.562011304 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,452.177123685 | 160,524.915777216 | 55,172.440643454 | 258.197144667 | 543,685.801296443 | 777,496.623558348 | -233,810.822261905 | 30.0722% | **DISCREPANCY >1%** |
| 92 | 382,880.228663509 | 176,927.850467173 | 41,186.988026446 | 260.178151514 | 165,518.197370141 | 164,505.212018376 | +1,012.985351765 | 0.6157% | OK |
| 93 | 3,180,202.40950257 | 181,921.200099591 | 10,627.00585805 | 260.306172529 | 2,086,451.787267245 | 2,987,393.8973724 | -900,942.110105155 | 30.1581% | **DISCREPANCY >1%** |
| 94 | 1,582,832.5781042 | 216,580.400930509 | 6,977.120150346 | 262.371739555 | 901,263.328629545 | 1,359,012.68528379 | -457,749.356654245 | 33.6824% | **DISCREPANCY >1%** |
| 95 | 2,823,498.04876599 | 223,698.068303101 | 92,584.118277643 | 262.028885653 | 1,759,219.58729414 | 2,506,953.833299593 | -747,734.246005453 | 29.8264% | **DISCREPANCY >1%** |
| 96 | 672,928.803045531 | 130,829.78226522 | 67,499.464576751 | 263.313063534 | 387,490.176423779 | 474,336.243140026 | -86,846.066716247 | 18.3089% | **DISCREPANCY >1%** |
| 97 | 941,695.694156637 | 24,305.834427164 | 251,257.226976361 | 264.065141932 | 624,754.286624672 | 665,868.56761118 | -41,114.280986508 | 6.1745% | **DISCREPANCY >1%** |
| 98 | 2,790,268.348044368 | 176,154.008844017 | 0 | 266.435730678 | 1,537,507.711157861 | 2,613,847.903469673 | -1,076,340.192311812 | 41.1783% | **DISCREPANCY >1%** |
| 99 | 217,534.329419552 | 72,004.601807409 | 0 | 277.650694736 | 145,941.59538324 | 145,252.076917407 | +689.518465833 | 0.4747% | OK |
| 100 | 1,799,794.095590657 | 201,831.869356847 | 8,577.774654887 | 267.477567755 | 1,136,482.892106863 | 1,589,116.974011168 | -452,634.081904305 | 28.4833% | **DISCREPANCY >1%** |
| 101 | 2,301,509.793430326 | 96,709.729814995 | 147,162.212142243 | 268.978266748 | 1,352,453.090541984 | 2,057,368.87320634 | -704,915.782664356 | 34.2629% | **DISCREPANCY >1%** |
| 102 | 843,144.314854854 | 50,526.561897738 | 158,995.005398752 | 269.295649414 | 571,127.582889633 | 633,353.45190895 | -62,225.869019317 | 9.8248% | **DISCREPANCY >1%** |
| 103 | 96,670.397144062 | 99,945.222911754 | 0 | 53.048513456 | 75,413.399706469 | 0 | +75,413.399706469 | ∞% | **DISCREPANCY >1%** |
| 104 | 3,062,968.342942101 | 0 | 8,693.224149186 | 271.763791108 | 2,725,130.208756965 | 3,054,003.355001807 | -328,873.146244842 | 10.7685% | **DISCREPANCY >1%** |
| 105 | 1,922,178.635437682 | 24,337.695348448 | 196,109.794803097 | 272.242109158 | 1,278,846.154813373 | 1,701,458.903176979 | -422,612.748363606 | 24.8382% | **DISCREPANCY >1%** |
| 106 | 2,376,986.760564706 | 144,209.176940372 | 53,273.846844962 | 274.301424892 | 1,487,849.779485208 | 2,179,229.43535448 | -691,379.655869272 | 31.7258% | **DISCREPANCY >1%** |
| 107 | 1,412,309.404778806 | 75,002.822267192 | 259,167.039802553 | 274.014369484 | 768,379.69328733 | 1,077,865.528339577 | -309,485.835052247 | 28.7128% | **DISCREPANCY >1%** |
| 108 | 1,530,520.515126298 | 44,888.690492425 | 38,862.313667517 | 276.75296525 | 1,054,527.794798477 | 1,446,492.758001106 | -391,964.963202629 | 27.0976% | **DISCREPANCY >1%** |
| 109 | 1,408,925.281801709 | 223,698.068310612 | 70,026.821602108 | 277.413033389 | 715,168.920824128 | 1,114,922.9788556 | -399,754.058031472 | 35.8548% | **DISCREPANCY >1%** |
| 110 | 2,492,968.944934116 | 0 | 114,615.376561618 | 277.551432259 | 1,729,173.602489589 | 2,378,076.016940239 | -648,902.41445065 | 27.2868% | **DISCREPANCY >1%** |
| 111 | 3,442,699.711521751 | 192,321.702770461 | 337,717.260844435 | 278.903836706 | 2,421,207.348894766 | 2,912,381.844070149 | -491,174.495175383 | 16.8650% | **DISCREPANCY >1%** |
| 112 | 1,865,767.736981223 | 173,200.851403845 | 85,660.90276259 | 280.726524834 | 858,535.424827937 | 1,606,625.256289954 | -748,089.831462017 | 46.5628% | **DISCREPANCY >1%** |
| 113 | 1,426,479.253958655 | 223,287.331033099 | 24,443.416711791 | 281.823730993 | 723,051.673206953 | 1,178,466.682482772 | -455,415.009275819 | 38.6447% | **DISCREPANCY >1%** |
| 114 | 1,394,592.219366676 | 54,534.060998196 | 206,407.640260261 | 281.314211212 | 818,971.595299437 | 1,133,369.203897007 | -314,397.60859757 | 27.7400% | **DISCREPANCY >1%** |
| 115 | 1,527,496.977031515 | 196,982.31937977 | 0 | 283.241311551 | 674,736.540831756 | 1,330,231.416340194 | -655,494.875508438 | 49.2767% | **DISCREPANCY >1%** |
| 116 | 498,327.033277975 | 129,797.29432009 | 46,438.331747847 | 283.098963545 | 322,456.895400295 | 321,808.308246493 | +648.587153802 | 0.2015% | OK |
| 117 | 1,577,391.159372488 | 0 | 110,042.604483153 | 285.659242885 | 1,182,843.699577966 | 1,467,062.89564645 | -284,219.196068484 | 19.3733% | **DISCREPANCY >1%** |
| 118 | 2,024,053.920306349 | 153,349.352006901 | 100,459.246518578 | 285.259844725 | 1,610,600.660779731 | 1,769,960.061936145 | -159,359.401156414 | 9.0035% | **DISCREPANCY >1%** |
| 119 | 1,493,340.518002894 | 127,462.331317651 | 0 | 287.161251248 | 720,015.01421028 | 1,365,591.025433995 | -645,576.011223715 | 47.2744% | **DISCREPANCY >1%** |
| 120 | 2,546,738.724554672 | 3,986.862247885 | 172,133.092719779 | 287.028677002 | 2,203,582.648794662 | 2,370,331.740910006 | -166,749.092115344 | 7.0348% | **DISCREPANCY >1%** |
| 121 | 2,766,651.954076083 | 211,264.855121109 | 0 | 288.990935566 | 1,535,311.697079252 | 2,555,098.108019408 | -1,019,786.410940156 | 39.9118% | **DISCREPANCY >1%** |
| 122 | 494,836.449887162 | 223,698.06146747 | 41,001.922983965 | 290.071585435 | 212,399.087082206 | 229,846.393850292 | -17,447.306768086 | 7.5908% | **DISCREPANCY >1%** |
| 123 | 1,850,359.345164228 | 117,012.394161995 | 40,622.003819962 | 291.95469424 | 1,545,775.094847816 | 1,692,432.992488031 | -146,657.897640215 | 8.6655% | **DISCREPANCY >1%** |
| 124 | 3,304,790.220874564 | 92,313.326894099 | 196,707.92930994 | 291.202246431 | 2,213,958.401766367 | 3,015,477.762424094 | -801,519.360657727 | 26.5801% | **DISCREPANCY >1%** |
| 125 | 2,325,826.430010415 | 223,698.068375433 | 7,964.547109056 | 293.897169562 | 1,109,743.523235324 | 2,093,869.917356364 | -984,126.39412104 | 47.0003% | **DISCREPANCY >1%** |
| 126 | 1,107,640.577479887 | 101,570.16062343 | 215,477.375953641 | 293.62312332 | 506,364.309783089 | 790,299.417779496 | -283,935.107996407 | 35.9275% | **DISCREPANCY >1%** |
| 127 | 2,802,824.648141101 | 201,728.715858691 | 45.025794905 | 295.32134409 | 1,653,334.165428989 | 2,600,755.585143415 | -947,421.419714426 | 36.4286% | **DISCREPANCY >1%** |
| 128 | 2,676,790.343533691 | 0 | 34,715.84016103 | 296.261683818 | 2,459,320.890947386 | 2,641,778.241688843 | -182,457.350741457 | 6.9066% | **DISCREPANCY >1%** |

## After upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,484,439.267183304 | 826,743.498270167 | 17,184.489564018 | 17.560874689 | 1,659,802.387982222 | 1,640,493.71847443 | +19,308.669507792 | 1.1770% | **DISCREPANCY >1%** |
| 2 | 3,328,541.356043044 | 635,713.572381259 | 277.903743213 | 182.50085112 | 2,711,313.00299156 | 2,692,367.379067452 | +18,945.623924108 | 0.7036% | OK |
| 3 | 2,802,713.941013925 | 578,475.334942498 | 164,522.535312881 | 182.126595313 | 2,078,448.8879906 | 2,059,533.944163233 | +18,914.943827367 | 0.9184% | OK |
| 4 | 3,503,436.936193613 | 553,023.967435256 | 157,420.201494415 | 183.029751142 | 2,811,300.435005442 | 2,792,809.7375128 | +18,490.697492642 | 0.6620% | OK |
| 5 | 2,998,782.621176459 | 1,488,257.228963462 | 3,606.721507634 | 184.281869893 | 1,525,624.786765432 | 1,506,734.38883547 | +18,890.397929962 | 1.2537% | **DISCREPANCY >1%** |
| 6 | 2,715,897.911458657 | 185,360.665463109 | 97,097.786802825 | 187.346869942 | 2,451,996.683773013 | 2,433,252.112322781 | +18,744.571450232 | 0.7703% | OK |
| 7 | 3,129,941.311512733 | 36,084.978602376 | 23,076.821212896 | 187.07538846 | 3,089,552.962272271 | 3,070,592.436309001 | +18,960.52596327 | 0.6174% | OK |
| 8 | 3,034,769.721682194 | 780,868.154271859 | 68,576.440307564 | 187.086928478 | 2,204,088.317242778 | 2,185,138.040174293 | +18,950.277068485 | 0.8672% | OK |
| 9 | 3,941,032.310704428 | 1,134,490.320449541 | 162,573.872641873 | 188.118320391 | 2,662,702.753243412 | 2,643,779.999292623 | +18,922.753950789 | 0.7157% | OK |
| 10 | 3,118,111.600023772 | 718,954.77036203 | 3,919.775094447 | 189.688883091 | 2,413,820.773748008 | 2,395,047.365684204 | +18,773.408063804 | 0.7838% | OK |
| 11 | 2,980,618.093933277 | 1,145,934.992162841 | 129,211.542495645 | 190.661334505 | 1,724,261.701431808 | 1,705,280.897940286 | +18,980.803491522 | 1.1130% | **DISCREPANCY >1%** |
| 12 | 3,360,257.048608388 | 1,522,132.651258694 | 0 | 192.292697978 | 1,856,786.281218517 | 1,837,932.104651716 | +18,854.176566801 | 1.0258% | **DISCREPANCY >1%** |
| 13 | 2,419,739.443340406 | 593,048.370031793 | 16,582.21426827 | 192.761479014 | 1,828,953.545731635 | 1,809,916.097561329 | +19,037.448170306 | 1.0518% | **DISCREPANCY >1%** |
| 14 | 3,059,214.25751119 | 1,180,371.405325601 | 129,813.067943654 | 193.278374918 | 1,767,865.10047261 | 1,748,836.505867017 | +19,028.594605593 | 1.0880% | **DISCREPANCY >1%** |
| 15 | 1,282,872.56679433 | 354,654.991781899 | 218,451.876252734 | 194.096217236 | 716,745.344324384 | 709,571.602542461 | +7,173.741781923 | 1.0109% | **DISCREPANCY >1%** |
| 16 | 292,261.056082386 | 106,491.578931276 | 9,125.331581653 | 196.086571486 | 219,971.692133916 | 176,448.058997971 | +43,523.633135945 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,655.555837639 | 340,475.604612198 | 112,046.880703239 | 196.357595968 | 2,591,753.716854974 | 2,572,936.712926234 | +18,817.00392874 | 0.7313% | OK |
| 18 | 3,221,530.3581729 | 327,278.331731401 | 184,937.037344576 | 433.502768747 | 2,728,012.390175507 | 2,708,881.486328176 | +19,130.903847331 | 0.7062% | OK |
| 19 | 2,545,337.931587017 | 1,005,152.040322882 | 720.680861435 | 198.424919891 | 1,558,366.405120635 | 1,539,266.785482809 | +19,099.619637826 | 1.2408% | **DISCREPANCY >1%** |
| 20 | 3,151,584.118117668 | 1,318,019.090795353 | 0 | 200.646865467 | 1,852,324.660431886 | 1,833,364.380456848 | +18,960.279975038 | 1.0341% | **DISCREPANCY >1%** |
| 21 | 3,446,350.944539729 | 811,563.250445903 | 12,526.594993624 | 201.583376045 | 2,641,137.2895972 | 2,622,059.515724157 | +19,077.773873043 | 0.7275% | OK |
| 22 | 3,424,697.078972077 | 1,181,104.166041112 | 8,538.815663423 | 202.742051089 | 2,253,922.90864158 | 2,234,851.355216453 | +19,071.553425127 | 0.8533% | OK |
| 23 | 4,040,906.136284042 | 1,085,012.60808004 | 257,565.47245039 | 203.241550689 | 2,717,035.06015898 | 2,698,124.814202923 | +18,910.245956057 | 0.7008% | OK |
| 24 | 3,641,699.385197894 | 581,611.381123771 | 113,298.120046902 | 204.496276093 | 2,964,647.656840732 | 2,946,585.387751128 | +18,062.269089604 | 0.6129% | OK |
| 25 | 4,116,569.160734956 | 872,691.458855825 | 0 | 204.348350575 | 3,262,570.098652547 | 3,243,673.353528556 | +18,896.745123991 | 0.5825% | OK |
| 26 | 776,683.346869401 | 91,065.541425466 | 16,231.463886896 | 205.885745795 | 673,306.86442606 | 669,180.455811244 | +4,126.408614816 | 0.6166% | OK |
| 27 | 3,217,088.984189999 | 1,225,488.394288307 | 114.576078423 | 209.326060384 | 2,010,230.893396306 | 1,991,276.687762885 | +18,954.205633421 | 0.9518% | OK |
| 28 | 4,652,644.532050518 | 1,380,136.946029568 | 146,403.936158282 | 207.21018716 | 3,144,789.333292944 | 3,125,896.439675508 | +18,892.893617436 | 0.6043% | OK |
| 29 | 2,898,497.592659301 | 610,829.352749762 | 0 | 209.726660942 | 2,306,335.831049477 | 2,287,458.513248597 | +18,877.31780088 | 0.8252% | OK |
| 30 | 3,382,578.048550954 | 710,234.099517005 | 22,914.692387486 | 210.461152384 | 2,667,110.572279116 | 2,649,218.795494079 | +17,891.776785037 | 0.6753% | OK |
| 31 | 1,586,512.687500347 | 660,846.230518782 | 38,096.765184011 | 210.694922304 | 893,531.693731475 | 887,358.99687525 | +6,172.696856225 | 0.6956% | OK |
| 32 | 3,427,221.832587246 | 17,419.272873098 | 94,980.465258985 | 212.895902564 | 3,333,422.893428039 | 3,314,609.198552599 | +18,813.69487544 | 0.5675% | OK |
| 33 | 2,301,832.10795105 | 584,226.582883127 | 87,386.796338192 | 213.090754801 | 1,649,218.144611554 | 1,630,005.63797493 | +19,212.506636624 | 1.1786% | **DISCREPANCY >1%** |
| 34 | 2,517,752.315278414 | 359,469.273754254 | 133,530.334947542 | 213.353990338 | 2,043,591.427143987 | 2,024,539.35258628 | +19,052.074557707 | 0.9410% | OK |
| 35 | 2,988,531.927713479 | 266,886.343998939 | 95,598.20397956 | 216.133908799 | 2,644,675.94827133 | 2,625,831.245826181 | +18,844.702445149 | 0.7176% | OK |
| 36 | 627,891.239072002 | 131,286.518958231 | 37,538.851627533 | 217.003480302 | 464,701.809419829 | 458,848.865005936 | +5,852.944413893 | 1.2755% | **DISCREPANCY >1%** |
| 37 | 3,572,556.215572503 | 1,209,281.44508295 | 0 | 217.373593954 | 2,381,932.136047951 | 2,363,057.396895599 | +18,874.739152352 | 0.7987% | OK |
| 38 | 1,473,097.928631893 | 485,297.062238848 | 104,920.887231971 | 862.101524195 | 886,266.551300017 | 882,017.877636879 | +4,248.673663138 | 0.4816% | OK |
| 39 | 3,166,435.553195886 | 1,460,083.628868387 | 29,373.416255258 | 218.780998106 | 1,695,429.468557074 | 1,676,759.727074135 | +18,669.741482939 | 1.1134% | **DISCREPANCY >1%** |
| 40 | 327,005.733918726 | 74,153.423804429 | 128,034.305600759 | 219.517385171 | 176,741.448835177 | 124,598.487128367 | +52,142.96170681 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,173.611654056 | 973,744.279818439 | 217,217.580368984 | 220.976763389 | 1,802,863.651482052 | 1,783,990.774703244 | +18,872.876778808 | 1.0579% | **DISCREPANCY >1%** |
| 42 | 2,595,043.142096049 | 430,642.557214966 | 0 | 222.919954598 | 2,183,122.943907032 | 2,164,177.664926485 | +18,945.278980547 | 0.8754% | OK |
| 43 | 3,052,787.884567396 | 857,879.953518064 | 418.387877525 | 223.016150179 | 2,212,435.691834392 | 2,194,266.527021628 | +18,169.164812764 | 0.8280% | OK |
| 44 | 4,012,383.551801857 | 506,394.124946002 | 126,796.473143805 | 223.029336224 | 3,398,459.104068 | 3,378,969.924375826 | +19,489.179692174 | 0.5767% | OK |
| 45 | 3,011,752.442172559 | 1,021,886.089454556 | 0 | 226.877745717 | 2,008,703.116929344 | 1,989,639.474972286 | +19,063.641957058 | 0.9581% | OK |
| 46 | 3,510,718.597918791 | 920,454.734537479 | 93,394.806384354 | 226.017693824 | 2,515,548.15997582 | 2,496,643.039303134 | +18,905.120672686 | 0.7572% | OK |
| 47 | 1,295,529.895427735 | 588,653.185177574 | 22,924.082606544 | 227.661885449 | 687,673.465762526 | 683,724.965758168 | +3,948.500004358 | 0.5774% | OK |
| 48 | 3,107,535.04985937 | 695,492.461656953 | 101,664.859193657 | 228.700853047 | 2,328,846.687272452 | 2,310,149.028155713 | +18,697.659116739 | 0.8093% | OK |
| 49 | 2,017,876.634681782 | 694,094.772062343 | 164,459.459888716 | 228.470969132 | 1,164,300.147403006 | 1,159,093.931761591 | +5,206.215641415 | 0.4491% | OK |
| 50 | 3,236,915.049890369 | 467,621.462714429 | 40,263.969667629 | 229.870419954 | 2,747,775.456897652 | 2,728,799.747088357 | +18,975.709809295 | 0.6953% | OK |
| 51 | 3,694,851.631985679 | 1,171,146.945421614 | 153,208.16449757 | 230.01488151 | 2,389,201.875098131 | 2,370,266.507184985 | +18,935.367913146 | 0.7988% | OK |
| 52 | 2,952,117.070821844 | 1,077,162.060889068 | 90.395967424 | 231.761205215 | 1,893,408.234763284 | 1,874,632.852760137 | +18,775.382003147 | 1.0015% | **DISCREPANCY >1%** |
| 53 | 4,587,461.932000767 | 520,242.333818612 | 83,441.035627469 | 232.14106949 | 4,002,412.306866003 | 3,983,546.421485196 | +18,865.885380807 | 0.4735% | OK |
| 54 | 3,774,206.691772849 | 562,924.886719164 | 43,761.132345373 | 234.262086152 | 3,186,263.949667802 | 3,167,286.41062216 | +18,977.539045642 | 0.5991% | OK |
| 55 | 2,799,337.289393601 | 316,092.836118957 | 94,545.881062638 | 236.134605077 | 2,407,570.599805009 | 2,388,462.437606929 | +19,108.16219808 | 0.8000% | OK |
| 56 | 2,646,406.264136623 | 774,485.915914827 | 13,997.922202342 | 235.282503571 | 1,876,658.38095267 | 1,857,687.143515883 | +18,971.237436787 | 1.0212% | **DISCREPANCY >1%** |
| 57 | 825,777.111178675 | 317,596.320183395 | 70,615.680938887 | 236.648963665 | 442,264.988899287 | 437,328.461092728 | +4,936.527806559 | 1.1287% | **DISCREPANCY >1%** |
| 58 | 297,303.290570974 | 161,966.767161337 | 0 | 87.223144206 | 228,682.61780516 | 135,249.300265431 | +93,433.317539729 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,733.959417721 | 440,939.168981065 | 122,883.114116497 | 241.495433091 | 2,648,586.34800194 | 2,629,670.180887068 | +18,916.167114872 | 0.7193% | OK |
| 60 | 3,738,938.573624944 | 628,958.607866544 | 40,528.882878666 | 240.011153443 | 3,088,309.198855045 | 3,069,211.071726291 | +19,098.127128754 | 0.6222% | OK |
| 61 | 4,368,654.580516954 | 808,370.14496251 | 81,352.861757921 | 240.599154604 | 3,497,985.843054945 | 3,478,690.974641919 | +19,294.868413026 | 0.5546% | OK |
| 62 | 2,639,385.218720129 | 184,174.273336392 | 43,107.204457328 | 241.315194522 | 2,431,187.062364878 | 2,411,862.425731887 | +19,324.636632991 | 0.8012% | OK |
| 63 | 3,817,266.520907545 | 725,439.396179942 | 147,125.592639154 | 242.616747333 | 2,963,791.083203702 | 2,944,458.915341116 | +19,332.167862586 | 0.6565% | OK |
| 64 | 3,340,777.411197862 | 267,933.276542149 | 166,758.052181327 | 243.063767935 | 2,925,100.024232174 | 2,905,843.018706451 | +19,257.005525723 | 0.6626% | OK |
| 65 | 3,223,187.02667184 | 939,351.125453697 | 71.722624687 | 246.953625556 | 2,290,879.611105601 | 2,283,517.2249679 | +7,362.386137701 | 0.3224% | OK |
| 66 | 3,355,567.767963545 | 876,389.726869251 | 83,262.913449555 | 246.876365658 | 2,399,574.013147158 | 2,395,668.251279081 | +3,905.761868077 | 0.1630% | OK |
| 67 | 818,235.005618122 | 275,635.793013465 | 132,264.88633962 | 246.548133058 | 415,753.341684633 | 410,087.778131979 | +5,665.563552654 | 1.3815% | **DISCREPANCY >1%** |
| 68 | 3,606,522.668691282 | 681,206.505097183 | 169,953.983458605 | 247.156427254 | 2,757,678.262310717 | 2,755,115.02370824 | +2,563.238602477 | 0.0930% | OK |
| 69 | 1,127,757.983729383 | 281,678.898945926 | 59,604.102841208 | 248.154576627 | 789,692.225967185 | 786,226.827365622 | +3,465.398601563 | 0.4407% | OK |
| 70 | 38,333.22374926 | 148.169094182 | 0 | 184.182726666 | 38,149.040995632 | 38,000.871928412 | +148.16906722 | 0.3899% | OK |
| 71 | 4,185,122.677766843 | 876,438.347763752 | 85,705.37638208 | 251.451983433 | 3,225,073.636749908 | 3,222,727.501637578 | +2,346.13511233 | 0.0727% | OK |
| 72 | 2,486,805.251902087 | 383,273.725113362 | 0 | 252.603932758 | 2,105,694.740466461 | 2,103,278.922855967 | +2,415.817610494 | 0.1148% | OK |
| 73 | 3,280,382.920420528 | 1,468,954.069047113 | 0 | 253.105893961 | 1,813,676.942884909 | 1,811,175.745479454 | +2,501.197405455 | 0.1380% | OK |
| 74 | 3,335,923.259227667 | 531,791.422968235 | 94,292.343237338 | 254.35601268 | 2,712,295.874311409 | 2,709,585.137009414 | +2,710.737301995 | 0.1000% | OK |
| 75 | 3,508,571.510438891 | 784,604.879643725 | 16,901.85128484 | 254.228181401 | 2,709,395.891317406 | 2,706,810.551328925 | +2,585.339988481 | 0.0955% | OK |
| 76 | 1,014,682.381470641 | 475,840.83810665 | 4,053.056546057 | 256.707430109 | 539,215.189087256 | 534,531.779387825 | +4,683.409699431 | 0.8761% | OK |
| 77 | 3,211,841.798076511 | 140,886.89655137 | 560,753.334406754 | 256.999075618 | 2,512,507.442349621 | 2,509,944.568042769 | +2,562.874306852 | 0.1021% | OK |
| 78 | 650,049.486811965 | 64,569.373140067 | 93,439.420139376 | 258.779702543 | 497,791.007489218 | 491,781.913829979 | +6,009.093659239 | 1.2219% | **DISCREPANCY >1%** |
| 79 | 3,522,187.617118924 | 444,229.939659842 | 150,693.955844108 | 258.600830648 | 2,929,780.461334615 | 2,927,005.120784326 | +2,775.340550289 | 0.0948% | OK |
| 80 | 1,805,809.602432742 | 192,549.794495279 | 42,374.70227022 | 259.090831526 | 1,575,661.087864241 | 1,570,626.014835717 | +5,035.073028524 | 0.3205% | OK |
| 81 | 2,604,358.570862377 | 851,302.349232435 | 112,250.420057044 | 260.414012873 | 1,643,122.255968379 | 1,640,545.387560025 | +2,576.868408354 | 0.1570% | OK |
| 82 | 637,046.829536987 | 51,351.621683119 | 203,656.438410755 | 261.745850215 | 387,646.14878236 | 381,777.023592898 | +5,869.125189462 | 1.5373% | **DISCREPANCY >1%** |
| 83 | 2,655,170.094539082 | 345,172.824104195 | 208,332.711813588 | 262.256934008 | 2,105,495.312152469 | 2,101,402.301687291 | +4,093.010465178 | 0.1947% | OK |
| 84 | 573,304.241545722 | 43,139.508392941 | 25,365.155475257 | 262.999999435 | 499,568.25457856 | 504,536.577678089 | -4,968.323099529 | 0.9847% | OK |
| 85 | 2,507,847.285496776 | 496,360.999970373 | 63,690.445726782 | 265.014358231 | 1,950,373.413274667 | 1,947,530.82544139 | +2,842.587833277 | 0.1459% | OK |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,272.581541561 | 647,402.902423667 | 51,054.043826615 | 267.166257822 | 811,937.38714958 | 808,548.469033457 | +3,388.918116123 | 0.4191% | OK |
| 88 | 3,458,038.307639901 | 175,269.312981134 | 95,635.038158501 | 267.870198711 | 3,189,628.068539638 | 3,186,866.086301555 | +2,761.982238083 | 0.0866% | OK |
| 89 | 2,763,942.852090179 | 600,426.954984618 | 187,748.849811315 | 269.328223075 | 1,978,297.520002656 | 1,975,497.719071171 | +2,799.800931485 | 0.1417% | OK |
| 90 | 140,129.393099798 | 116,392.269522858 | 0 | 106.03218843 | 140,001.653399788 | 23,631.09138851 | +116,370.562011278 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,464.722100035 | 399,376.775480423 | 55,172.985619804 | 270.197144643 | 543,685.801296443 | 538,644.763855165 | +5,041.037441278 | 0.9358% | OK |
| 92 | 382,892.228663509 | 176,927.850467173 | 41,186.988026446 | 272.17815149 | 165,518.197370141 | 164,505.2120184 | +1,012.985351741 | 0.6157% | OK |
| 93 | 3,180,218.141300769 | 1,085,835.159306595 | 10,630.737656249 | 272.306172505 | 2,086,451.787267245 | 2,083,479.93816542 | +2,971.849101825 | 0.1426% | OK |
| 94 | 1,582,844.5781042 | 680,196.760099128 | 6,977.120150346 | 274.371739528 | 901,263.328629545 | 895,396.326115198 | +5,867.002514347 | 0.6552% | OK |
| 95 | 2,823,510.04876599 | 975,818.72867639 | 92,584.118277643 | 274.028885628 | 1,759,219.58729414 | 1,754,833.172926329 | +4,386.414367811 | 0.2499% | OK |
| 96 | 672,940.803045531 | 223,924.687813565 | 67,499.464576751 | 275.313063509 | 387,490.176423779 | 381,241.337591706 | +6,248.838832073 | 1.6390% | **DISCREPANCY >1%** |
| 97 | 941,711.091209591 | 70,872.776437572 | 251,260.624029315 | 276.065141906 | 624,754.286624672 | 619,301.625600798 | +5,452.661023874 | 0.8804% | OK |
| 98 | 2,790,280.348044368 | 1,255,490.393926426 | 0 | 278.435730652 | 1,537,507.711157861 | 1,534,511.51838729 | +2,996.192770571 | 0.1952% | OK |
| 99 | 217,546.329419552 | 72,004.601807409 | 0 | 289.650694712 | 145,941.59538324 | 145,252.076917431 | +689.518465809 | 0.4747% | OK |
| 100 | 1,799,806.095590657 | 659,972.413440104 | 8,577.774654887 | 279.477567728 | 1,136,482.892106863 | 1,130,976.429927938 | +5,506.462178925 | 0.4868% | OK |
| 101 | 2,301,521.793430326 | 806,501.042836516 | 147,162.212142243 | 280.978266723 | 1,352,453.090541984 | 1,347,577.560184844 | +4,875.53035714 | 0.3617% | OK |
| 102 | 843,156.314854854 | 118,084.708059441 | 158,995.005398752 | 281.295649389 | 571,127.582889633 | 565,795.305747272 | +5,332.277142361 | 0.9424% | OK |
| 103 | 96,682.397144062 | 99,945.222911754 | 0 | 52.418540249 | 75,426.029679651 | 0 | +75,426.029679651 | ∞% | **DISCREPANCY >1%** |
| 104 | 3,062,980.342942101 | 340,321.172598343 | 8,693.224149186 | 283.763791082 | 2,725,130.208756965 | 2,713,682.18240349 | +11,448.026353475 | 0.4218% | OK |
| 105 | 1,922,191.5856493 | 451,644.439901403 | 196,110.745014715 | 284.242109133 | 1,278,846.154813373 | 1,274,152.158624049 | +4,693.996189324 | 0.3684% | OK |
| 106 | 2,376,998.760564706 | 838,637.534343767 | 53,273.846844962 | 286.301424867 | 1,487,849.779485208 | 1,484,801.07795111 | +3,048.701534098 | 0.2053% | OK |
| 107 | 1,412,325.822769323 | 389,715.783508211 | 259,171.45779307 | 286.014369458 | 768,379.69328733 | 763,152.567098584 | +5,227.126188746 | 0.6849% | OK |
| 108 | 1,530,532.515126298 | 442,784.567664372 | 38,862.313667517 | 288.752965225 | 1,054,527.794798477 | 1,048,596.880829184 | +5,930.913969293 | 0.5656% | OK |
| 109 | 1,408,937.281801709 | 626,919.832814457 | 70,026.821602108 | 289.413033362 | 715,168.920824128 | 711,701.214351782 | +3,467.706472346 | 0.4872% | OK |
| 110 | 2,492,981.995535483 | 653,602.202903777 | 114,616.427162985 | 289.551432235 | 1,729,173.602489589 | 1,724,473.814036486 | +4,699.788453103 | 0.2725% | OK |
| 111 | 3,442,711.711521751 | 686,963.807461569 | 337,717.260844435 | 290.90383668 | 2,421,207.348894766 | 2,417,739.739379067 | +3,467.609515699 | 0.1434% | OK |
| 112 | 1,865,779.736981223 | 925,696.620748774 | 85,660.90276259 | 292.726524809 | 858,535.424827937 | 854,129.48694505 | +4,405.937882887 | 0.5158% | OK |
| 113 | 1,426,491.253958655 | 682,486.06189204 | 24,443.416711791 | 293.823730967 | 723,051.673206953 | 719,267.951623857 | +3,783.721583096 | 0.5260% | OK |
| 114 | 1,394,606.838901215 | 373,811.447473431 | 206,410.2597948 | 293.314211185 | 818,971.595299437 | 814,091.817421799 | +4,879.777877638 | 0.5994% | OK |
| 115 | 1,527,508.977031515 | 857,494.572895518 | 0 | 295.241311526 | 674,736.540831756 | 669,719.162824471 | +5,017.378007285 | 0.7491% | OK |
| 116 | 498,339.033277975 | 129,797.29432009 | 46,438.331747847 | 295.098963519 | 322,456.895400295 | 321,808.308246519 | +648.587153776 | 0.2015% | OK |
| 117 | 1,577,403.159372488 | 289,424.602021989 | 110,042.604483153 | 297.659242859 | 1,182,843.699577966 | 1,177,638.293624487 | +5,205.405953479 | 0.4420% | OK |
| 118 | 2,024,065.920306349 | 317,975.810452995 | 100,459.246518578 | 297.2598447 | 1,610,600.660779731 | 1,605,333.603490076 | +5,267.057289655 | 0.3280% | OK |
| 119 | 1,493,352.518002894 | 776,537.885713869 | 0 | 299.161251223 | 720,015.01421028 | 716,515.471037802 | +3,499.543172478 | 0.4884% | OK |
| 120 | 2,546,756.935340767 | 174,299.388959302 | 172,139.303505874 | 299.028676976 | 2,203,582.648794662 | 2,200,019.214198615 | +3,563.434596047 | 0.1619% | OK |
| 121 | 2,766,663.954076083 | 1,234,341.176086707 | 0 | 300.99093554 | 1,535,311.697079252 | 1,532,021.787053836 | +3,289.910025416 | 0.2147% | OK |
| 122 | 494,848.449887162 | 246,465.034375573 | 41,001.922983965 | 302.07158541 | 212,399.087082206 | 207,079.420942214 | +5,319.666139992 | 2.5689% | **DISCREPANCY >1%** |
| 123 | 1,850,371.345164228 | 266,836.118126159 | 40,622.003819962 | 303.954694214 | 1,545,775.094847816 | 1,542,609.268523893 | +3,165.826323923 | 0.2052% | OK |
| 124 | 3,304,806.199324051 | 897,004.632666029 | 196,711.907759427 | 303.202246405 | 2,213,958.401766367 | 2,210,786.45665219 | +3,171.945114177 | 0.1434% | OK |
| 125 | 2,325,838.430010415 | 1,211,161.002135291 | 7,964.547109056 | 305.897169535 | 1,109,743.523235324 | 1,106,406.983596533 | +3,336.539638791 | 0.3015% | OK |
| 126 | 1,107,652.577479887 | 389,824.564372371 | 215,477.375953641 | 305.623123294 | 506,364.309783089 | 502,045.014030581 | +4,319.295752508 | 0.8603% | OK |
| 127 | 2,802,836.648141101 | 1,152,511.702574029 | 45.025794905 | 307.321344064 | 1,653,334.165428989 | 1,649,972.598428103 | +3,361.567000886 | 0.2037% | OK |
| 128 | 2,676,802.343533691 | 186,014.794503201 | 34,715.84016103 | 308.261683792 | 2,459,320.890947386 | 2,455,763.447185668 | +3,557.443761718 | 0.1448% | OK |

## Discrepancies greater than 1%

| Phase | Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| before | 1 | 2,484,427.267183304 | 165,036.45414469 | 17,184.489564018 | 6.761008795 | 1,659,801.187848141 | 2,302,199.562465801 | -642,398.37461766 | 27.9036% | **DISCREPANCY >1%** |
| before | 2 | 3,328,529.356043044 | 186,958.253739906 | 277.903743213 | 170.500851146 | 2,711,313.00299156 | 3,141,122.697708779 | -429,809.694717219 | 13.6833% | **DISCREPANCY >1%** |
| before | 3 | 2,802,695.289972275 | 0.468119708 | 164,515.884271231 | 170.126595339 | 2,078,448.8879906 | 2,638,008.810985997 | -559,559.922995397 | 21.2114% | **DISCREPANCY >1%** |
| before | 4 | 3,503,418.678723213 | 13,456.73137153 | 157,413.944024015 | 171.029751167 | 2,811,300.435005442 | 3,332,376.973576501 | -521,076.538571059 | 15.6367% | **DISCREPANCY >1%** |
| before | 5 | 2,998,769.751609426 | 209,823.537800336 | 3,605.851940601 | 172.281869918 | 1,525,624.786765432 | 2,785,168.079998571 | -1,259,543.293233139 | 45.2232% | **DISCREPANCY >1%** |
| before | 6 | 2,715,885.911458657 | 23,468.530961558 | 97,097.786802825 | 175.346869967 | 2,451,996.683773013 | 2,595,144.246824307 | -143,147.563051294 | 5.5159% | **DISCREPANCY >1%** |
| before | 8 | 3,034,751.033519529 | 170,998.084151705 | 68,569.752144899 | 175.086928503 | 2,204,088.317242778 | 2,795,008.110294422 | -590,919.793051644 | 21.1419% | **DISCREPANCY >1%** |
| before | 9 | 3,941,018.0872791 | 189,930.97794848 | 162,571.649216545 | 176.118320415 | 2,662,702.753243412 | 3,588,339.34179366 | -925,636.588550248 | 25.7956% | **DISCREPANCY >1%** |
| before | 10 | 3,118,099.600023772 | 223,846.079166223 | 3,919.775094447 | 177.688883115 | 2,413,820.773748008 | 2,890,156.056879987 | -476,335.283131979 | 16.4812% | **DISCREPANCY >1%** |
| before | 11 | 2,980,603.755600748 | 58,843.162874805 | 129,209.204163116 | 178.661334532 | 1,724,261.701431808 | 2,792,372.727228295 | -1,068,111.025796487 | 38.2510% | **DISCREPANCY >1%** |
| before | 12 | 3,360,245.048608388 | 222,508.114052081 | 0 | 180.292698004 | 1,856,786.281218517 | 3,137,556.641858303 | -1,280,770.360639786 | 40.8206% | **DISCREPANCY >1%** |
| before | 13 | 2,419,727.443340406 | 148,967.172896852 | 16,582.21426827 | 180.761479039 | 1,828,953.545731635 | 2,253,997.294696245 | -425,043.74896461 | 18.8573% | **DISCREPANCY >1%** |
| before | 14 | 3,059,202.25751119 | 220,189.208395156 | 129,813.067943654 | 181.278374944 | 1,767,865.10047261 | 2,709,018.702797436 | -941,153.602324826 | 34.7414% | **DISCREPANCY >1%** |
| before | 15 | 1,282,856.272315984 | 52,905.700586193 | 218,447.581774388 | 182.096217262 | 716,745.344324384 | 1,011,320.893738141 | -294,575.549413757 | 29.1278% | **DISCREPANCY >1%** |
| before | 16 | 292,249.056082386 | 106,491.578931276 | 9,125.331581653 | 184.086571512 | 219,971.692133916 | 176,448.058997945 | +43,523.633135971 | 24.6665% | **DISCREPANCY >1%** |
| before | 17 | 3,025,639.344244047 | 35,067.621313474 | 112,042.669109647 | 184.357595994 | 2,591,753.716854974 | 2,878,344.696224932 | -286,590.979369958 | 9.9567% | **DISCREPANCY >1%** |
| before | 18 | 3,221,518.3581729 | 82,212.573733221 | 184,937.037344576 | 421.502768772 | 2,728,012.390175507 | 2,953,947.244326331 | -225,934.854150824 | 7.6485% | **DISCREPANCY >1%** |
| before | 19 | 2,545,325.665259176 | 203,827.261478907 | 720.414533594 | 186.424919916 | 1,558,366.405120635 | 2,340,591.564326759 | -782,225.159206124 | 33.4199% | **DISCREPANCY >1%** |
| before | 20 | 3,151,572.118117668 | 223,846.079145155 | 0 | 188.646865492 | 1,852,324.660431886 | 2,927,537.392107021 | -1,075,212.731675135 | 36.7275% | **DISCREPANCY >1%** |
| before | 21 | 3,446,338.944539729 | 160,850.042236821 | 12,526.594993624 | 189.583376074 | 2,641,137.2895972 | 3,272,772.72393321 | -631,635.43433601 | 19.2997% | **DISCREPANCY >1%** |
| before | 22 | 3,424,685.078972077 | 161,827.727614681 | 8,538.815663423 | 190.742051115 | 2,253,922.90864158 | 3,254,127.793642858 | -1,000,204.885001278 | 30.7364% | **DISCREPANCY >1%** |
| before | 23 | 4,040,894.136284042 | 117,779.002762432 | 257,565.47245039 | 191.241550714 | 2,717,035.06015898 | 3,665,358.419520506 | -948,323.359361526 | 25.8725% | **DISCREPANCY >1%** |
| before | 24 | 3,641,687.385197894 | 75,925.654771513 | 113,298.120046902 | 192.496276118 | 2,964,647.656840732 | 3,452,271.114103361 | -487,623.457262629 | 14.1247% | **DISCREPANCY >1%** |
| before | 25 | 4,116,557.160734956 | 223,846.079136167 | 0 | 192.348350599 | 3,262,570.098652547 | 3,892,518.73324819 | -629,948.634595643 | 16.1835% | **DISCREPANCY >1%** |
| before | 26 | 776,671.346869401 | 73,459.26989387 | 16,231.463886896 | 193.88574582 | 673,306.86442606 | 686,786.727342815 | -13,479.862916755 | 1.9627% | **DISCREPANCY >1%** |
| before | 27 | 3,217,076.984189999 | 223,846.079203415 | 114.576078423 | 197.326060412 | 2,010,230.893396306 | 2,992,919.002847749 | -982,688.109451443 | 32.8337% | **DISCREPANCY >1%** |
| before | 28 | 4,652,627.929788247 | 176,806.130994487 | 146,399.333896011 | 195.210187185 | 3,144,789.333292944 | 4,329,227.254710564 | -1,184,437.92141762 | 27.3591% | **DISCREPANCY >1%** |
| before | 29 | 2,898,485.592659301 | 0 | 0 | 197.726660967 | 2,306,335.831049477 | 2,898,287.865998334 | -591,952.034948857 | 20.4241% | **DISCREPANCY >1%** |
| before | 30 | 3,382,566.048550954 | 223,846.079129087 | 22,914.692387486 | 198.461152408 | 2,667,110.572279116 | 3,135,606.815881973 | -468,496.243602857 | 14.9411% | **DISCREPANCY >1%** |
| before | 31 | 1,586,500.687500347 | 223,846.079187058 | 38,096.765184011 | 198.694922329 | 893,531.693731475 | 1,324,359.148206949 | -430,827.454475474 | 32.5310% | **DISCREPANCY >1%** |
| before | 33 | 2,301,819.364165814 | 89,682.65958267 | 87,386.052552956 | 201.090754826 | 1,649,218.144611554 | 2,124,549.561275362 | -475,331.416663808 | 22.3732% | **DISCREPANCY >1%** |
| before | 34 | 2,517,735.1749933 | 0 | 133,525.194662428 | 201.353990364 | 2,043,591.427143987 | 2,384,008.626340508 | -340,417.199196521 | 14.2791% | **DISCREPANCY >1%** |
| before | 35 | 2,988,519.927713479 | 0 | 95,598.20397956 | 204.133908825 | 2,644,675.94827133 | 2,892,717.589825094 | -248,041.641553764 | 8.5746% | **DISCREPANCY >1%** |
| before | 36 | 627,879.239072002 | 9,298.851890397 | 37,538.851627533 | 205.003480326 | 464,701.809419829 | 580,836.532073746 | -116,134.722653917 | 19.9943% | **DISCREPANCY >1%** |
| before | 37 | 3,572,544.215572503 | 223,846.079137807 | 0 | 205.37359398 | 2,381,932.136047951 | 3,348,492.762840716 | -966,560.626792765 | 28.8655% | **DISCREPANCY >1%** |
| before | 38 | 1,473,083.216289116 | 139,486.240803376 | 104,918.174889194 | 850.101524222 | 886,266.551300017 | 1,227,828.699072324 | -341,562.147772307 | 27.8183% | **DISCREPANCY >1%** |
| before | 39 | 3,166,423.553195886 | 172,663.511264212 | 29,373.416255258 | 206.780998132 | 1,695,429.468557074 | 2,964,179.844678284 | -1,268,750.37612121 | 42.8027% | **DISCREPANCY >1%** |
| before | 40 | 326,993.733918726 | 74,153.423804429 | 128,034.305600759 | 207.517385196 | 176,741.448835177 | 124,598.487128342 | +52,142.961706835 | 41.8487% | **DISCREPANCY >1%** |
| before | 41 | 2,975,161.611654056 | 204,063.185350324 | 217,217.580368984 | 208.976763414 | 1,802,863.651482052 | 2,553,671.869171334 | -750,808.217689282 | 29.4011% | **DISCREPANCY >1%** |
| before | 42 | 2,595,031.142096049 | 223,846.079158774 | 0 | 210.919954623 | 2,183,122.943907032 | 2,370,974.142982652 | -187,851.19907562 | 7.9229% | **DISCREPANCY >1%** |
| before | 43 | 3,052,775.884567396 | 179,562.708609502 | 418.387877525 | 211.016150204 | 2,212,435.691834392 | 2,872,583.771930165 | -660,148.080095773 | 22.9809% | **DISCREPANCY >1%** |
| before | 44 | 4,012,364.799169571 | 82,938.546710406 | 126,789.720511519 | 211.02933625 | 3,398,459.104068 | 3,802,425.502611396 | -403,966.398543396 | 10.6239% | **DISCREPANCY >1%** |
| before | 45 | 3,011,740.442172559 | 186,957.988153914 | 0 | 214.877745742 | 2,008,703.116929344 | 2,824,567.576272903 | -815,864.459343559 | 28.8845% | **DISCREPANCY >1%** |
| before | 46 | 3,510,706.597918791 | 140,033.673137159 | 93,394.806384354 | 214.017693848 | 2,515,548.15997582 | 3,277,064.10070343 | -761,515.94072761 | 23.2377% | **DISCREPANCY >1%** |
| before | 47 | 1,295,517.895427735 | 221,936.771527767 | 22,924.082606544 | 215.661885473 | 687,673.465762526 | 1,050,441.379407951 | -362,767.913645425 | 34.5348% | **DISCREPANCY >1%** |
| before | 48 | 3,107,523.04985937 | 0 | 101,664.859193657 | 216.700853072 | 2,328,846.687272452 | 3,005,641.489812641 | -676,794.802540189 | 22.5174% | **DISCREPANCY >1%** |
| before | 49 | 2,017,864.081163608 | 120,325.749958529 | 164,458.906370542 | 216.470969157 | 1,164,300.147403006 | 1,732,862.95386538 | -568,562.806462374 | 32.8106% | **DISCREPANCY >1%** |
| before | 50 | 3,236,903.049890369 | 84,285.185243783 | 40,263.969667629 | 217.870419978 | 2,747,775.456897652 | 3,112,136.024558979 | -364,360.567661327 | 11.7077% | **DISCREPANCY >1%** |
| before | 51 | 3,694,832.878966849 | 105,922.936515629 | 153,201.41147874 | 218.014881534 | 2,389,201.875098131 | 3,435,490.516090946 | -1,046,288.640992815 | 30.4552% | **DISCREPANCY >1%** |
| before | 52 | 2,952,105.070821844 | 223,846.079128825 | 90.395967424 | 219.761205239 | 1,893,408.234763284 | 2,727,948.834520356 | -834,540.599757072 | 30.5922% | **DISCREPANCY >1%** |
| before | 53 | 4,587,443.088448493 | 165,100.951333266 | 83,434.192075195 | 220.141069516 | 4,002,412.306866003 | 4,338,687.803970516 | -336,275.497104513 | 7.7506% | **DISCREPANCY >1%** |
| before | 54 | 3,774,194.691772849 | 104,605.505486405 | 43,761.132345373 | 222.262086176 | 3,186,263.949667802 | 3,625,605.791854895 | -439,341.842187093 | 12.1177% | **DISCREPANCY >1%** |
| before | 55 | 2,799,325.289393601 | 9,506.992017657 | 94,545.881062638 | 224.134605104 | 2,407,570.599805009 | 2,695,048.281708202 | -287,477.681903193 | 10.6668% | **DISCREPANCY >1%** |
| before | 56 | 2,646,394.264136623 | 147,253.342830014 | 13,997.922202342 | 223.282503599 | 1,876,658.38095267 | 2,484,919.716600668 | -608,261.335647998 | 24.4781% | **DISCREPANCY >1%** |
| before | 57 | 825,765.111178675 | 223,846.079159495 | 70,615.680938887 | 224.64896369 | 442,264.988899287 | 531,078.702116603 | -88,813.713217316 | 16.7232% | **DISCREPANCY >1%** |
| before | 58 | 297,291.290570974 | 161,966.767161337 | 0 | 75.223144231 | 228,682.61780516 | 135,249.300265406 | +93,433.317539754 | 69.0822% | **DISCREPANCY >1%** |
| before | 59 | 3,193,721.959417721 | 71,891.198873536 | 122,883.114116497 | 229.495433115 | 2,648,586.34800194 | 2,998,718.150994573 | -350,131.802992633 | 11.6760% | **DISCREPANCY >1%** |
| before | 60 | 3,738,926.573624944 | 121,459.892472139 | 40,528.882878666 | 228.011153468 | 3,088,309.198855045 | 3,576,709.787120671 | -488,400.588265626 | 13.6550% | **DISCREPANCY >1%** |
| before | 61 | 4,368,639.105191268 | 113,406.497793948 | 81,349.386432235 | 228.599154633 | 3,497,985.843054945 | 4,173,654.621810452 | -675,668.778755507 | 16.1889% | **DISCREPANCY >1%** |
| before | 62 | 2,639,369.638787585 | 1,029.291966503 | 43,103.624524784 | 229.315194547 | 2,431,187.062364878 | 2,595,007.407101751 | -163,820.344736873 | 6.3129% | **DISCREPANCY >1%** |
| before | 63 | 3,817,251.354117539 | 0 | 147,122.425849148 | 230.616747359 | 2,963,791.083203702 | 3,669,898.311521032 | -706,107.22831733 | 19.2405% | **DISCREPANCY >1%** |
| before | 64 | 3,340,758.563434309 | 44,721.605785854 | 166,751.204417774 | 231.063767961 | 2,925,100.024232174 | 3,129,054.68946272 | -203,954.665230546 | 6.5180% | **DISCREPANCY >1%** |
| before | 65 | 3,223,175.02667184 | 204,139.305947923 | 71.722624687 | 234.953625582 | 2,290,879.611105601 | 3,018,729.044473648 | -727,849.433368047 | 24.1111% | **DISCREPANCY >1%** |
| before | 66 | 3,355,555.767963545 | 58,498.893235066 | 83,262.913449555 | 234.876365683 | 2,399,574.013147158 | 3,213,559.084913241 | -813,985.071766083 | 25.3297% | **DISCREPANCY >1%** |
| before | 67 | 818,223.005618122 | 94,182.859728691 | 132,264.88633962 | 234.548133083 | 415,753.341684633 | 591,540.711416728 | -175,787.369732095 | 29.7168% | **DISCREPANCY >1%** |
| before | 68 | 3,606,504.130402946 | 51,820.059551198 | 169,947.445170269 | 235.156427279 | 2,757,678.262310717 | 3,384,501.4692542 | -626,823.206943483 | 18.5203% | **DISCREPANCY >1%** |
| before | 69 | 1,127,745.983729383 | 223,846.079187092 | 59,604.102841208 | 236.154576653 | 789,692.225967185 | 844,059.64712443 | -54,367.421157245 | 6.4411% | **DISCREPANCY >1%** |
| before | 71 | 4,185,110.677766843 | 96,876.088940082 | 85,705.37638208 | 239.451983458 | 3,225,073.636749908 | 4,002,289.760461223 | -777,216.123711315 | 19.4192% | **DISCREPANCY >1%** |
| before | 72 | 2,486,793.251902087 | 221,779.667597505 | 0 | 240.603932782 | 2,105,694.740466461 | 2,264,772.9803718 | -159,078.239905339 | 7.0240% | **DISCREPANCY >1%** |
| before | 73 | 3,280,370.920420528 | 223,846.079132607 | 0 | 241.105893987 | 1,813,676.942884909 | 3,056,283.735393934 | -1,242,606.792509025 | 40.6574% | **DISCREPANCY >1%** |
| before | 74 | 3,335,911.259227667 | 0 | 94,292.343237338 | 242.356012707 | 2,712,295.874311409 | 3,241,376.559977622 | -529,080.685666213 | 16.3227% | **DISCREPANCY >1%** |
| before | 75 | 3,508,553.336526073 | 203,423.332505008 | 16,895.677372022 | 242.228181427 | 2,709,395.891317406 | 3,287,992.098467616 | -578,596.20715021 | 17.5972% | **DISCREPANCY >1%** |
| before | 76 | 1,014,670.381470641 | 179,713.432857498 | 4,053.056546057 | 244.707430135 | 539,215.189087256 | 830,659.184636951 | -291,443.995549695 | 35.0858% | **DISCREPANCY >1%** |
| before | 77 | 3,211,829.798076511 | 0 | 560,753.334406754 | 244.999075644 | 2,512,507.442349621 | 2,650,831.464594113 | -138,324.022244492 | 5.2181% | **DISCREPANCY >1%** |
| before | 78 | 650,037.486811965 | 6,499.356268383 | 93,439.420139376 | 246.779702568 | 497,791.007489218 | 549,851.930701638 | -52,060.92321242 | 9.4681% | **DISCREPANCY >1%** |
| before | 79 | 3,522,172.966630965 | 63,794.223490279 | 150,691.305356149 | 246.600830674 | 2,929,780.461334615 | 3,307,440.836953863 | -377,660.375619248 | 11.4185% | **DISCREPANCY >1%** |
| before | 80 | 1,805,797.602432742 | 144,923.552045991 | 42,374.70227022 | 247.09083155 | 1,575,661.087864241 | 1,618,252.257284981 | -42,591.16942074 | 2.6319% | **DISCREPANCY >1%** |
| before | 81 | 2,604,343.932190403 | 20,523.249052955 | 112,247.78138507 | 248.414012898 | 1,643,122.255968379 | 2,471,324.48773948 | -828,202.231771101 | 33.5124% | **DISCREPANCY >1%** |
| before | 82 | 637,034.829536987 | 1,033.20576559 | 203,656.438410755 | 249.745850241 | 387,646.14878236 | 432,095.439510401 | -44,449.290728041 | 10.2869% | **DISCREPANCY >1%** |
| before | 83 | 2,655,158.094539082 | 0 | 208,332.711813588 | 250.256934032 | 2,105,495.312152469 | 2,446,575.125791462 | -341,079.813638993 | 13.9411% | **DISCREPANCY >1%** |
| before | 84 | 573,292.241545722 | 4,045.485421068 | 25,365.155475257 | 250.999999461 | 499,568.25457856 | 543,630.600649936 | -44,062.346071376 | 8.1051% | **DISCREPANCY >1%** |
| before | 85 | 2,507,835.097649252 | 101,240.455860461 | 63,690.257879258 | 253.014358256 | 1,950,373.413274667 | 2,342,651.369551277 | -392,277.95627661 | 16.7450% | **DISCREPANCY >1%** |
| before | 87 | 1,507,260.581541561 | 223,698.068303363 | 51,054.043826615 | 255.166257847 | 811,937.38714958 | 1,232,253.303153736 | -420,315.916004156 | 34.1095% | **DISCREPANCY >1%** |
| before | 88 | 3,458,026.149023523 | 42,432.314973574 | 95,634.879542123 | 255.870198737 | 3,189,628.068539638 | 3,319,703.084309089 | -130,075.015769451 | 3.9182% | **DISCREPANCY >1%** |
| before | 89 | 2,763,930.852090179 | 184,424.496583798 | 187,748.849811315 | 257.328223102 | 1,978,297.520002656 | 2,391,500.177471964 | -413,202.657469308 | 17.2779% | **DISCREPANCY >1%** |
| before | 90 | 140,117.393099798 | 116,392.269522858 | 0 | 94.032188456 | 140,001.653399788 | 23,631.091388484 | +116,370.562011304 | 492.4468% | **DISCREPANCY >1%** |
| before | 91 | 993,452.177123685 | 160,524.915777216 | 55,172.440643454 | 258.197144667 | 543,685.801296443 | 777,496.623558348 | -233,810.822261905 | 30.0722% | **DISCREPANCY >1%** |
| before | 93 | 3,180,202.40950257 | 181,921.200099591 | 10,627.00585805 | 260.306172529 | 2,086,451.787267245 | 2,987,393.8973724 | -900,942.110105155 | 30.1581% | **DISCREPANCY >1%** |
| before | 94 | 1,582,832.5781042 | 216,580.400930509 | 6,977.120150346 | 262.371739555 | 901,263.328629545 | 1,359,012.68528379 | -457,749.356654245 | 33.6824% | **DISCREPANCY >1%** |
| before | 95 | 2,823,498.04876599 | 223,698.068303101 | 92,584.118277643 | 262.028885653 | 1,759,219.58729414 | 2,506,953.833299593 | -747,734.246005453 | 29.8264% | **DISCREPANCY >1%** |
| before | 96 | 672,928.803045531 | 130,829.78226522 | 67,499.464576751 | 263.313063534 | 387,490.176423779 | 474,336.243140026 | -86,846.066716247 | 18.3089% | **DISCREPANCY >1%** |
| before | 97 | 941,695.694156637 | 24,305.834427164 | 251,257.226976361 | 264.065141932 | 624,754.286624672 | 665,868.56761118 | -41,114.280986508 | 6.1745% | **DISCREPANCY >1%** |
| before | 98 | 2,790,268.348044368 | 176,154.008844017 | 0 | 266.435730678 | 1,537,507.711157861 | 2,613,847.903469673 | -1,076,340.192311812 | 41.1783% | **DISCREPANCY >1%** |
| before | 100 | 1,799,794.095590657 | 201,831.869356847 | 8,577.774654887 | 267.477567755 | 1,136,482.892106863 | 1,589,116.974011168 | -452,634.081904305 | 28.4833% | **DISCREPANCY >1%** |
| before | 101 | 2,301,509.793430326 | 96,709.729814995 | 147,162.212142243 | 268.978266748 | 1,352,453.090541984 | 2,057,368.87320634 | -704,915.782664356 | 34.2629% | **DISCREPANCY >1%** |
| before | 102 | 843,144.314854854 | 50,526.561897738 | 158,995.005398752 | 269.295649414 | 571,127.582889633 | 633,353.45190895 | -62,225.869019317 | 9.8248% | **DISCREPANCY >1%** |
| before | 103 | 96,670.397144062 | 99,945.222911754 | 0 | 53.048513456 | 75,413.399706469 | 0 | +75,413.399706469 | ∞% | **DISCREPANCY >1%** |
| before | 104 | 3,062,968.342942101 | 0 | 8,693.224149186 | 271.763791108 | 2,725,130.208756965 | 3,054,003.355001807 | -328,873.146244842 | 10.7685% | **DISCREPANCY >1%** |
| before | 105 | 1,922,178.635437682 | 24,337.695348448 | 196,109.794803097 | 272.242109158 | 1,278,846.154813373 | 1,701,458.903176979 | -422,612.748363606 | 24.8382% | **DISCREPANCY >1%** |
| before | 106 | 2,376,986.760564706 | 144,209.176940372 | 53,273.846844962 | 274.301424892 | 1,487,849.779485208 | 2,179,229.43535448 | -691,379.655869272 | 31.7258% | **DISCREPANCY >1%** |
| before | 107 | 1,412,309.404778806 | 75,002.822267192 | 259,167.039802553 | 274.014369484 | 768,379.69328733 | 1,077,865.528339577 | -309,485.835052247 | 28.7128% | **DISCREPANCY >1%** |
| before | 108 | 1,530,520.515126298 | 44,888.690492425 | 38,862.313667517 | 276.75296525 | 1,054,527.794798477 | 1,446,492.758001106 | -391,964.963202629 | 27.0976% | **DISCREPANCY >1%** |
| before | 109 | 1,408,925.281801709 | 223,698.068310612 | 70,026.821602108 | 277.413033389 | 715,168.920824128 | 1,114,922.9788556 | -399,754.058031472 | 35.8548% | **DISCREPANCY >1%** |
| before | 110 | 2,492,968.944934116 | 0 | 114,615.376561618 | 277.551432259 | 1,729,173.602489589 | 2,378,076.016940239 | -648,902.41445065 | 27.2868% | **DISCREPANCY >1%** |
| before | 111 | 3,442,699.711521751 | 192,321.702770461 | 337,717.260844435 | 278.903836706 | 2,421,207.348894766 | 2,912,381.844070149 | -491,174.495175383 | 16.8650% | **DISCREPANCY >1%** |
| before | 112 | 1,865,767.736981223 | 173,200.851403845 | 85,660.90276259 | 280.726524834 | 858,535.424827937 | 1,606,625.256289954 | -748,089.831462017 | 46.5628% | **DISCREPANCY >1%** |
| before | 113 | 1,426,479.253958655 | 223,287.331033099 | 24,443.416711791 | 281.823730993 | 723,051.673206953 | 1,178,466.682482772 | -455,415.009275819 | 38.6447% | **DISCREPANCY >1%** |
| before | 114 | 1,394,592.219366676 | 54,534.060998196 | 206,407.640260261 | 281.314211212 | 818,971.595299437 | 1,133,369.203897007 | -314,397.60859757 | 27.7400% | **DISCREPANCY >1%** |
| before | 115 | 1,527,496.977031515 | 196,982.31937977 | 0 | 283.241311551 | 674,736.540831756 | 1,330,231.416340194 | -655,494.875508438 | 49.2767% | **DISCREPANCY >1%** |
| before | 117 | 1,577,391.159372488 | 0 | 110,042.604483153 | 285.659242885 | 1,182,843.699577966 | 1,467,062.89564645 | -284,219.196068484 | 19.3733% | **DISCREPANCY >1%** |
| before | 118 | 2,024,053.920306349 | 153,349.352006901 | 100,459.246518578 | 285.259844725 | 1,610,600.660779731 | 1,769,960.061936145 | -159,359.401156414 | 9.0035% | **DISCREPANCY >1%** |
| before | 119 | 1,493,340.518002894 | 127,462.331317651 | 0 | 287.161251248 | 720,015.01421028 | 1,365,591.025433995 | -645,576.011223715 | 47.2744% | **DISCREPANCY >1%** |
| before | 120 | 2,546,738.724554672 | 3,986.862247885 | 172,133.092719779 | 287.028677002 | 2,203,582.648794662 | 2,370,331.740910006 | -166,749.092115344 | 7.0348% | **DISCREPANCY >1%** |
| before | 121 | 2,766,651.954076083 | 211,264.855121109 | 0 | 288.990935566 | 1,535,311.697079252 | 2,555,098.108019408 | -1,019,786.410940156 | 39.9118% | **DISCREPANCY >1%** |
| before | 122 | 494,836.449887162 | 223,698.06146747 | 41,001.922983965 | 290.071585435 | 212,399.087082206 | 229,846.393850292 | -17,447.306768086 | 7.5908% | **DISCREPANCY >1%** |
| before | 123 | 1,850,359.345164228 | 117,012.394161995 | 40,622.003819962 | 291.95469424 | 1,545,775.094847816 | 1,692,432.992488031 | -146,657.897640215 | 8.6655% | **DISCREPANCY >1%** |
| before | 124 | 3,304,790.220874564 | 92,313.326894099 | 196,707.92930994 | 291.202246431 | 2,213,958.401766367 | 3,015,477.762424094 | -801,519.360657727 | 26.5801% | **DISCREPANCY >1%** |
| before | 125 | 2,325,826.430010415 | 223,698.068375433 | 7,964.547109056 | 293.897169562 | 1,109,743.523235324 | 2,093,869.917356364 | -984,126.39412104 | 47.0003% | **DISCREPANCY >1%** |
| before | 126 | 1,107,640.577479887 | 101,570.16062343 | 215,477.375953641 | 293.62312332 | 506,364.309783089 | 790,299.417779496 | -283,935.107996407 | 35.9275% | **DISCREPANCY >1%** |
| before | 127 | 2,802,824.648141101 | 201,728.715858691 | 45.025794905 | 295.32134409 | 1,653,334.165428989 | 2,600,755.585143415 | -947,421.419714426 | 36.4286% | **DISCREPANCY >1%** |
| before | 128 | 2,676,790.343533691 | 0 | 34,715.84016103 | 296.261683818 | 2,459,320.890947386 | 2,641,778.241688843 | -182,457.350741457 | 6.9066% | **DISCREPANCY >1%** |
| after | 1 | 2,484,439.267183304 | 826,743.498270167 | 17,184.489564018 | 17.560874689 | 1,659,802.387982222 | 1,640,493.71847443 | +19,308.669507792 | 1.1770% | **DISCREPANCY >1%** |
| after | 5 | 2,998,782.621176459 | 1,488,257.228963462 | 3,606.721507634 | 184.281869893 | 1,525,624.786765432 | 1,506,734.38883547 | +18,890.397929962 | 1.2537% | **DISCREPANCY >1%** |
| after | 11 | 2,980,618.093933277 | 1,145,934.992162841 | 129,211.542495645 | 190.661334505 | 1,724,261.701431808 | 1,705,280.897940286 | +18,980.803491522 | 1.1130% | **DISCREPANCY >1%** |
| after | 12 | 3,360,257.048608388 | 1,522,132.651258694 | 0 | 192.292697978 | 1,856,786.281218517 | 1,837,932.104651716 | +18,854.176566801 | 1.0258% | **DISCREPANCY >1%** |
| after | 13 | 2,419,739.443340406 | 593,048.370031793 | 16,582.21426827 | 192.761479014 | 1,828,953.545731635 | 1,809,916.097561329 | +19,037.448170306 | 1.0518% | **DISCREPANCY >1%** |
| after | 14 | 3,059,214.25751119 | 1,180,371.405325601 | 129,813.067943654 | 193.278374918 | 1,767,865.10047261 | 1,748,836.505867017 | +19,028.594605593 | 1.0880% | **DISCREPANCY >1%** |
| after | 15 | 1,282,872.56679433 | 354,654.991781899 | 218,451.876252734 | 194.096217236 | 716,745.344324384 | 709,571.602542461 | +7,173.741781923 | 1.0109% | **DISCREPANCY >1%** |
| after | 16 | 292,261.056082386 | 106,491.578931276 | 9,125.331581653 | 196.086571486 | 219,971.692133916 | 176,448.058997971 | +43,523.633135945 | 24.6665% | **DISCREPANCY >1%** |
| after | 19 | 2,545,337.931587017 | 1,005,152.040322882 | 720.680861435 | 198.424919891 | 1,558,366.405120635 | 1,539,266.785482809 | +19,099.619637826 | 1.2408% | **DISCREPANCY >1%** |
| after | 20 | 3,151,584.118117668 | 1,318,019.090795353 | 0 | 200.646865467 | 1,852,324.660431886 | 1,833,364.380456848 | +18,960.279975038 | 1.0341% | **DISCREPANCY >1%** |
| after | 33 | 2,301,832.10795105 | 584,226.582883127 | 87,386.796338192 | 213.090754801 | 1,649,218.144611554 | 1,630,005.63797493 | +19,212.506636624 | 1.1786% | **DISCREPANCY >1%** |
| after | 36 | 627,891.239072002 | 131,286.518958231 | 37,538.851627533 | 217.003480302 | 464,701.809419829 | 458,848.865005936 | +5,852.944413893 | 1.2755% | **DISCREPANCY >1%** |
| after | 39 | 3,166,435.553195886 | 1,460,083.628868387 | 29,373.416255258 | 218.780998106 | 1,695,429.468557074 | 1,676,759.727074135 | +18,669.741482939 | 1.1134% | **DISCREPANCY >1%** |
| after | 40 | 327,005.733918726 | 74,153.423804429 | 128,034.305600759 | 219.517385171 | 176,741.448835177 | 124,598.487128367 | +52,142.96170681 | 41.8487% | **DISCREPANCY >1%** |
| after | 41 | 2,975,173.611654056 | 973,744.279818439 | 217,217.580368984 | 220.976763389 | 1,802,863.651482052 | 1,783,990.774703244 | +18,872.876778808 | 1.0579% | **DISCREPANCY >1%** |
| after | 52 | 2,952,117.070821844 | 1,077,162.060889068 | 90.395967424 | 231.761205215 | 1,893,408.234763284 | 1,874,632.852760137 | +18,775.382003147 | 1.0015% | **DISCREPANCY >1%** |
| after | 56 | 2,646,406.264136623 | 774,485.915914827 | 13,997.922202342 | 235.282503571 | 1,876,658.38095267 | 1,857,687.143515883 | +18,971.237436787 | 1.0212% | **DISCREPANCY >1%** |
| after | 57 | 825,777.111178675 | 317,596.320183395 | 70,615.680938887 | 236.648963665 | 442,264.988899287 | 437,328.461092728 | +4,936.527806559 | 1.1287% | **DISCREPANCY >1%** |
| after | 58 | 297,303.290570974 | 161,966.767161337 | 0 | 87.223144206 | 228,682.61780516 | 135,249.300265431 | +93,433.317539729 | 69.0822% | **DISCREPANCY >1%** |
| after | 67 | 818,235.005618122 | 275,635.793013465 | 132,264.88633962 | 246.548133058 | 415,753.341684633 | 410,087.778131979 | +5,665.563552654 | 1.3815% | **DISCREPANCY >1%** |
| after | 78 | 650,049.486811965 | 64,569.373140067 | 93,439.420139376 | 258.779702543 | 497,791.007489218 | 491,781.913829979 | +6,009.093659239 | 1.2219% | **DISCREPANCY >1%** |
| after | 82 | 637,046.829536987 | 51,351.621683119 | 203,656.438410755 | 261.745850215 | 387,646.14878236 | 381,777.023592898 | +5,869.125189462 | 1.5373% | **DISCREPANCY >1%** |
| after | 90 | 140,129.393099798 | 116,392.269522858 | 0 | 106.03218843 | 140,001.653399788 | 23,631.09138851 | +116,370.562011278 | 492.4468% | **DISCREPANCY >1%** |
| after | 96 | 672,940.803045531 | 223,924.687813565 | 67,499.464576751 | 275.313063509 | 387,490.176423779 | 381,241.337591706 | +6,248.838832073 | 1.6390% | **DISCREPANCY >1%** |
| after | 103 | 96,682.397144062 | 99,945.222911754 | 0 | 52.418540249 | 75,426.029679651 | 0 | +75,426.029679651 | ∞% | **DISCREPANCY >1%** |
| after | 122 | 494,848.449887162 | 246,465.034375573 | 41,001.922983965 | 302.07158541 | 212,399.087082206 | 207,079.420942214 | +5,319.666139992 | 2.5689% | **DISCREPANCY >1%** |

## Accounting definitions

- Actual staked alpha: sum of every `TotalHotkeyAlpha(hotkey, netuid)` value.
- Pending alpha: `PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + PendingOwnerCut + PendingBasketDeposits`.
- Calculated staked alpha: saturating `SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha - pending alpha`.
- Discrepancy percentage: `abs(actual - calculated) / calculated × 100`.
