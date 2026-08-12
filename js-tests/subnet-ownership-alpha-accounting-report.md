# Subnet ownership conviction and alpha accounting

Generated: 2026-08-12T16:41:04.655Z

## Run summary

| Phase | Block | Runtime | Migration complete | Subnets | King calculation mismatches | Alpha discrepancies >1% |
|---|---:|---|---|---:|---:|---:|
| before | 24 | node-subtensor/443 | false | 128 | 0 | 120 |
| after | 47 | node-subtensor/445 | true | 128 | 0 | 120 |

> **Critical migration finding:** the clone genesis is `0x57a26328383c75e8d0089bced04da375d90811ad2b0072633efdccfb1bf13c80`, not the hard-coded mainnet genesis `0x2f0555cc76fc2840a25a6ea3b9637146806f1f44b090c175ffde2a7e5ab36c03`. The historical-alpha migration marked itself complete but skipped its corrections. For example, subnet 1 `AlphaBurned` remained `165,036.45414469 α → 165,036.45414469 α`, and `120` subnets still exceed 1% discrepancy after the upgrade.

The pre-upgrade ownership threshold is `10% × SubnetAlphaOut`. The post-upgrade threshold is `10% × (SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha)`. Conviction forecasts roll the four aggregate lock buckets forward with the runtime exponential equations and evaluate only scheduled epoch checks. They assume no future lock transactions and hold alpha supply/counters constant. “Not projected” means no qualifying different-owner king was found in the 10-year forecast window.

## Before upgrade: subnet kings and takeover projection

Snapshot block: `24` (`0x69fea5d1d0ffbf3bb6089b1990ca7ed7cb92f4268b3db4926d2cfc4cb2a49e56`)  
Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α | Gate | Mature | Projected takeover | Projected king |
|---:|---|---|---:|---:|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,830.1779 | 248,443.7267 | not met | no | not projected within 10y | — |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 332,853.9356 | met | no | not projected within 10y | — |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 242,214.3357 | 280,271.0833 | not met | no | 3.39 years (block 8914890) | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.0576 | 350,343.3893 | not met | no | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 299,878.0476 | not met | no | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 271,589.5911 | met | no | not projected within 10y | — |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 312,993.9312 | not met | no | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,571.1599 | 303,476.6607 | met | no | not projected within 10y | — |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 394,102.994 | met | no | not projected within 10y | — |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,150.4094 | 311,810.96 | not met | no | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 298,061.5704 | not met | no | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 336,025.5049 | not met | no | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 241,973.7443 | not met | no | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,506.4582 | 305,921.2258 | not met | no | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 128,286.9851 | not met | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,219.4739 | 29,225.9056 | not met | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 486,846.067 | 302,565.2854 | met | no | not projected within 10y | — |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 322,152.8358 | met | no | not projected within 10y | — |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 254,533.5887 | not met | no | not projected within 10y | — |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 183,162.8656 | 315,158.2118 | not met | no | 3.37 years (block 8849893) | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 344,634.8945 | not met | no | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 342,469.5079 | met | no | not projected within 10y | — |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 477,984.8893 | 404,090.4136 | met | no | not projected within 10y | — |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 238,954.681 | 364,169.7385 | not met | no | 3.44 years (block 9043024) | `5ELAvsv…v5WvWX` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 411,656.7161 | not met | no | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 1,756.4934 | 77,668.1347 | not met | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 321,708.6984 | not met | no | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,345.8192 | 465,264.1765 | not met | no | not projected within 10y | — |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 289,849.5593 | not met | no | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 338,257.6049 | not met | no | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 158,651.0688 | met | no | not projected within 10y | — |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 342,721.9833 | met | no | not projected within 10y | — |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.0458 | 230,182.9984 | not met | no | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,320.7904 | 251,774.9459 | not met | no | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,195.1277 | 298,852.9928 | not met | no | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 62,788.9239 | met | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 357,255.4216 | not met | no | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 46,874.6987 | 147,309.5477 | not met | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 121,504.928 | 316,643.3553 | not met | no | 3.41 years (block 8967560) | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 32,700.3734 | not met | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 297,517.1612 | not met | no | not projected within 10y | — |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 259,504.1142 | not met | no | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 305,278.5885 | not met | no | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 401,238.0426 | not met | no | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2002 | 301,175.0442 | not met | no | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 175,034.1233 | 351,071.6598 | not met | no | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,178.7593 | 129,552.7895 | not met | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 310,753.305 | not met | no | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 201,787.4542 | not met | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 323,691.305 | not met | no | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.7847 | 369,484.8506 | met | no | not projected within 10y | — |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 295,211.5071 | not met | no | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 458,745.8791 | not met | no | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 377,420.4692 | met | no | not projected within 10y | — |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 279,933.5289 | not met | no | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 264,640.4264 | met | no | not projected within 10y | — |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 82,577.5111 | not met | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 29,730.1291 | met | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 388,812.5668 | 319,373.1959 | met | no | not projected within 10y | — |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,102,857.7393 | 373,893.6574 | met | no | not projected within 10y | — |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 436,865.2001 | met | no | not projected within 10y | — |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 149,335.6433 | 263,938.2622 | not met | no | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 381,726.3993 | not met | no | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,063.6346 | 334,077.427 | met | no | not projected within 10y | — |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 322,318.5027 | not met | no | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 335,556.5768 | met | no | not projected within 10y | — |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 81,823.3006 | not met | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 603,246.7243 | 360,651.9579 | met | no | not projected within 10y | — |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 112,775.5984 | not met | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,833.1224 | not met | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 418,512.0678 | not met | no | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 524,911.776 | 248,680.3252 | met | no | not projected within 10y | — |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 898,316.9563 | 328,038.092 | met | no | not projected within 10y | — |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 333,592.1259 | met | no | not projected within 10y | — |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,609.8116 | 350,856.8481 | met | no | not projected within 10y | — |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 101,468.0381 | not met | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 321,183.9798 | met | no | not projected within 10y | — |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 65,004.7487 | not met | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 352,218.5175 | met | no | not projected within 10y | — |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 180,580.7602 | not met | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 132,339.054 | 260,435.6131 | not met | no | 3.38 years (block 8886293) | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 63,704.483 | not met | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 265,516.8095 | not met | no | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 57,330.2242 | not met | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 250,784.5254 | not met | no | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | met | no | not projected within 10y | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,852.8302 | 150,727.0582 | met | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 345,803.6281 | met | no | not projected within 10y | — |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 276,394.0852 | not met | no | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 14,012.7393 | met | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 86,746.1718 | 99,346.2631 | not met | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 38,289.0229 | not met | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,615.7004 | 318,021.5519 | met | no | not projected within 10y | — |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 158,284.2578 | not met | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 282,350.8049 | not met | no | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 150,018.8743 | 67,293.8803 | met | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 94,170.8525 | not met | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 619,118.4835 | 279,027.8348 | met | no | not projected within 10y | — |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 21,754.4329 | not met | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 331,818.3965 | 179,980.4096 | met | no | not projected within 10y | — |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 230,151.9793 | not met | no | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 84,315.4315 | not met | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 9,668.0397 | not met | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 306,297.8343 | not met | no | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 221,041.9207 | 192,218.9427 | met | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 273,159.7244 | 237,699.6761 | met | no | not projected within 10y | — |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 141,232.3086 | not met | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 337,271.6614 | 153,053.0515 | met | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,937.4226 | 140,893.5282 | met | no | not projected within 10y | — |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 249,297.982 | not met | no | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 344,270.9712 | not met | no | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 186,577.7737 | not met | no | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 100,559.231 | 142,648.9254 | not met | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 139,460.4402 | met | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 152,750.6977 | not met | no | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 49,833.7033 | not met | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 157,580.0812 | 157,740.1159 | not met | no | not projected within 10y | — |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 120,120.3554 | 202,406.392 | not met | no | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 149,335.0518 | not met | no | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,383.7416 | 254,675.39 | not met | no | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 276,666.1954 | not met | no | not projected within 10y | — |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 104,780.9031 | 49,484.645 | met | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 185,036.9345 | met | no | not projected within 10y | — |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 330,480.3536 | met | no | not projected within 10y | — |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 232,583.643 | not met | no | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 106,867.5428 | 110,765.0577 | not met | no | not projected within 10y | — |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 280,283.4648 | not met | no | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5739 | 267,680.0344 | not met | no | not projected within 10y | — |

## After upgrade: subnet kings and takeover projection

Snapshot block: `47` (`0xcc6c1b8ee7a554c2b3e1a57087f09c435022e025c4a1fcb4cd19136b927bce32`)  
Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α | Gate | Mature | Projected takeover | Projected king |
|---:|---|---|---:|---:|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,830.1779 | 230,223.9323 | not met | no | not projected within 10y | — |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 314,132.6199 | met | no | not projected within 10y | — |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 242,214.3357 | 263,821.1938 | not met | no | 3.38 years (block 8870760) | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.0576 | 333,258.1003 | not met | no | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 278,537.3362 | not met | no | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 259,535.2594 | met | no | not projected within 10y | — |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 310,688.549 | not met | no | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,571.1599 | 279,521.6197 | met | no | not projected within 10y | — |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 358,854.846 | met | no | not projected within 10y | — |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,150.4094 | 289,036.6746 | not met | no | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 279,258.4389 | not met | no | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 313,776.9935 | not met | no | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 225,421.1056 | not met | no | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,506.4582 | 270,923.2981 | not met | no | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 101,153.599 | not met | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,219.4739 | 17,666.5146 | not met | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 486,846.067 | 287,856.2054 | met | no | not projected within 10y | — |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 295,440.1747 | met | no | not projected within 10y | — |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 234,081.0989 | not met | no | not projected within 10y | — |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 183,162.8656 | 292,775.9039 | not met | no | 3.36 years (block 8833320) | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 327,299.5307 | not met | no | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 325,435.1536 | met | no | not projected within 10y | — |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 477,984.8893 | 366,558.2661 | met | no | not projected within 10y | — |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 238,954.681 | 345,249.661 | not met | no | 3.44 years (block 9043200) | `5ELAvsv…v5WvWX` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 389,274.4082 | not met | no | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 1,756.4934 | 68,701.3613 | not met | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 299,314.9329 | not met | no | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,345.8192 | 432,945.5465 | met | no | not projected within 10y | — |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 289,851.8593 | not met | no | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 313,583.8277 | not met | no | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 132,459.0843 | met | no | not projected within 10y | — |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 333,226.2367 | met | no | not projected within 10y | — |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.0458 | 212,478.3652 | not met | no | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,320.7904 | 238,424.298 | not met | no | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,195.1277 | 289,295.4724 | not met | no | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 58,107.4536 | met | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 334,873.1136 | not met | no | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 46,874.6987 | 122,871.1801 | not met | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 121,504.928 | 296,441.9626 | not met | no | 3.40 years (block 8941680) | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 12,483.9005 | met | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 255,391.3846 | met | no | not projected within 10y | — |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 237,121.8063 | not met | no | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 287,282.7788 | not met | no | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 380,266.9532 | not met | no | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2002 | 282,481.5454 | not met | no | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 175,034.1233 | 327,731.1118 | not met | no | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,178.7593 | 105,069.0041 | not met | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 300,589.1191 | not met | no | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 173,311.2425 | not met | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 311,238.6895 | not met | no | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.7847 | 343,574.1531 | met | no | not projected within 10y | — |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 272,820.1596 | not met | no | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 433,894.0945 | not met | no | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 362,586.1054 | met | no | not projected within 10y | — |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 269,530.5416 | not met | no | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 248,517.5999 | met | no | not projected within 10y | — |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 53,133.6351 | not met | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 13,535.7523 | met | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 388,812.5668 | 299,898.0646 | met | no | not projected within 10y | — |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,102,857.7393 | 357,697.0798 | met | no | not projected within 10y | — |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 417,391.6221 | met | no | not projected within 10y | — |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 149,335.6433 | 259,526.9722 | not met | no | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 367,016.1928 | not met | no | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,063.6346 | 312,931.8753 | met | no | not projected within 10y | — |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 301,899.6998 | not met | no | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 321,382.6961 | met | no | not projected within 10y | — |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 59,180.826 | not met | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 603,246.7243 | 338,476.9626 | met | no | not projected within 10y | — |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 84,432.8802 | not met | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,820.6055 | not met | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 400,256.2212 | not met | no | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 524,911.776 | 226,504.6584 | met | no | not projected within 10y | — |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 898,316.9563 | 305,655.7841 | met | no | not projected within 10y | — |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 324,165.1916 | met | no | not projected within 10y | — |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,609.8116 | 328,826.7327 | met | no | not projected within 10y | — |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 83,093.6892 | not met | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 265,110.9464 | met | no | not projected within 10y | — |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 55,013.171 | not met | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 330,772.0438 | met | no | not projected within 10y | — |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 161,853.2348 | not met | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 132,339.054 | 247,160.5902 | not met | no | 3.38 years (block 8873280) | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 43,237.8185 | not met | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 244,685.8383 | not met | no | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 54,391.4601 | not met | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 234,293.7384 | not met | no | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | met | no | not projected within 10y | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,852.8302 | 123,254.1469 | met | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 331,999.1955 | met | no | not projected within 10y | — |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 239,179.0506 | not met | no | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 2,375.8124 | met | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 86,746.1718 | 77,778.7821 | met | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 16,479.839 | not met | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,615.7004 | 298,768.7204 | met | no | not projected within 10y | — |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 135,930.8057 | not met | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 250,724.8862 | not met | no | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 150,018.8743 | 47,463.2556 | met | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 66,616.5633 | not met | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 619,118.4835 | 261,414.7339 | met | no | not projected within 10y | — |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 14,556.2728 | not met | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 331,818.3965 | 158,941.7452 | met | no | not projected within 10y | — |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 205,767.0851 | not met | no | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 63,365.5748 | not met | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 0 | met | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 305,430.8119 | not met | no | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 221,041.9207 | 170,176.4145 | met | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 273,159.7244 | 217,953.6737 | met | no | not projected within 10y | — |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 107,817.2543 | not met | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 337,271.6614 | 144,680.2511 | met | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,937.4226 | 111,523.3392 | met | no | not projected within 10y | — |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 237,838.6568 | not met | no | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 291,269.3748 | not met | no | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 160,693.8983 | not met | no | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 100,559.231 | 117,878.1506 | not met | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 113,368.3518 | met | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 133,054.7658 | not met | no | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 32,212.4407 | not met | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 157,580.0812 | 146,738.1555 | met | no | not projected within 10y | — |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 120,120.3554 | 177,027.8322 | not met | no | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 136,591.1187 | not met | no | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,383.7416 | 237,065.177 | not met | no | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 255,542.0099 | not met | no | not projected within 10y | — |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 104,780.9031 | 23,016.9465 | met | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 169,275.7947 | met | no | not projected within 10y | — |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 301,580.1965 | met | no | not projected within 10y | — |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 209,419.6815 | not met | no | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 106,867.5428 | 79,062.6041 | met | no | not projected within 10y | — |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 260,108.3906 | not met | no | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5739 | 264,210.7503 | not met | no | not projected within 10y | — |

## Before upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,484,437.267183304 | 165,036.45414469 | 17,184.489564018 | 15.812127616 | 1,659,802.136729299 | 2,302,200.51134698 | -642,398.374617681 | 27.9036% | **DISCREPANCY >1%** |
| 2 | 3,328,539.356043044 | 186,958.253739906 | 277.903743213 | 180.500851125 | 2,711,313.00299156 | 3,141,122.6977088 | -429,809.69471724 | 13.6833% | **DISCREPANCY >1%** |
| 3 | 2,802,710.832509362 | 0.468119708 | 164,521.426808318 | 180.126595318 | 2,078,448.8879906 | 2,638,008.810986018 | -559,559.922995418 | 21.2114% | **DISCREPANCY >1%** |
| 4 | 3,503,433.893284509 | 13,456.73137153 | 157,419.158585311 | 181.029751146 | 2,811,300.435005442 | 3,332,376.973576522 | -521,076.53857108 | 15.6367% | **DISCREPANCY >1%** |
| 5 | 2,998,780.476248441 | 209,823.537800336 | 3,606.576579616 | 182.281869897 | 1,525,624.786765432 | 2,785,168.079998592 | -1,259,543.29323316 | 45.2232% | **DISCREPANCY >1%** |
| 6 | 2,715,895.911458657 | 23,468.530961558 | 97,097.786802825 | 185.346869946 | 2,451,996.683773013 | 2,595,144.246824328 | -143,147.563051315 | 5.5159% | **DISCREPANCY >1%** |
| 7 | 3,129,939.311512733 | 0 | 23,076.821212896 | 185.075388464 | 3,089,552.962272271 | 3,106,677.414911373 | -17,124.452639102 | 0.5512% | OK |
| 8 | 3,034,766.606991034 | 170,998.084151705 | 68,575.325616404 | 185.086928483 | 2,204,088.317242778 | 2,795,008.110294442 | -590,919.793051664 | 21.1419% | **DISCREPANCY >1%** |
| 9 | 3,941,029.940133947 | 189,930.97794848 | 162,573.502071392 | 186.118320395 | 2,662,702.753243412 | 3,588,339.34179368 | -925,636.588550268 | 25.7956% | **DISCREPANCY >1%** |
| 10 | 3,118,109.600023772 | 223,846.079166223 | 3,919.775094447 | 187.688883095 | 2,413,820.773748008 | 2,890,156.056880007 | -476,335.283131999 | 16.4812% | **DISCREPANCY >1%** |
| 11 | 2,980,615.704211473 | 58,843.162874805 | 129,211.152773841 | 188.66133451 | 1,724,261.701431808 | 2,792,372.727228317 | -1,068,111.025796509 | 38.2510% | **DISCREPANCY >1%** |
| 12 | 3,360,255.048608388 | 222,508.114052081 | 0 | 190.292697983 | 1,856,786.281218517 | 3,137,556.641858324 | -1,280,770.360639807 | 40.8206% | **DISCREPANCY >1%** |
| 13 | 2,419,737.443340406 | 148,967.172896852 | 16,582.21426827 | 190.761479018 | 1,828,953.545731635 | 2,253,997.294696266 | -425,043.748964631 | 18.8573% | **DISCREPANCY >1%** |
| 14 | 3,059,212.25751119 | 220,189.208395156 | 129,813.067943654 | 191.278374922 | 1,767,865.10047261 | 2,709,018.702797458 | -941,153.602324848 | 34.7414% | **DISCREPANCY >1%** |
| 15 | 1,282,869.851056783 | 52,905.700586193 | 218,451.160515187 | 192.09621724 | 716,745.344324384 | 1,011,320.893738163 | -294,575.549413779 | 29.1278% | **DISCREPANCY >1%** |
| 16 | 292,259.056082386 | 106,491.578931276 | 9,125.331581653 | 194.08657149 | 219,971.692133916 | 176,448.058997967 | +43,523.633135949 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,652.853906482 | 35,067.621313474 | 112,046.178772082 | 194.357595972 | 2,591,753.716854974 | 2,878,344.696224954 | -286,590.97936998 | 9.9567% | **DISCREPANCY >1%** |
| 18 | 3,221,528.3581729 | 82,212.573733221 | 184,937.037344576 | 431.502768751 | 2,728,012.390175507 | 2,953,947.244326352 | -225,934.854150845 | 7.6485% | **DISCREPANCY >1%** |
| 19 | 2,545,335.887198835 | 203,827.261478907 | 720.636473253 | 196.424919895 | 1,558,366.405120635 | 2,340,591.56432678 | -782,225.159206145 | 33.4199% | **DISCREPANCY >1%** |
| 20 | 3,151,582.118117668 | 223,846.079145155 | 0 | 198.646865471 | 1,852,324.660431886 | 2,927,537.392107042 | -1,075,212.731675156 | 36.7275% | **DISCREPANCY >1%** |
| 21 | 3,446,348.944539729 | 160,850.042236821 | 12,526.594993624 | 199.58337605 | 2,641,137.2895972 | 3,272,772.723933234 | -631,635.434336034 | 19.2997% | **DISCREPANCY >1%** |
| 22 | 3,424,695.078972077 | 161,827.727614681 | 8,538.815663423 | 200.742051093 | 2,253,922.90864158 | 3,254,127.79364288 | -1,000,204.8850013 | 30.7364% | **DISCREPANCY >1%** |
| 23 | 4,040,904.136284042 | 117,779.002762432 | 257,565.47245039 | 201.241550693 | 2,717,035.06015898 | 3,665,358.419520527 | -948,323.359361547 | 25.8725% | **DISCREPANCY >1%** |
| 24 | 3,641,697.385197894 | 75,925.654771513 | 113,298.120046902 | 202.496276097 | 2,964,647.656840732 | 3,452,271.114103382 | -487,623.45726265 | 14.1247% | **DISCREPANCY >1%** |
| 25 | 4,116,567.160734956 | 223,846.079136167 | 0 | 202.348350579 | 3,262,570.098652547 | 3,892,518.73324821 | -629,948.634595663 | 16.1835% | **DISCREPANCY >1%** |
| 26 | 776,681.346869401 | 73,459.26989387 | 16,231.463886896 | 203.885745799 | 673,306.86442606 | 686,786.727342836 | -13,479.862916776 | 1.9627% | **DISCREPANCY >1%** |
| 27 | 3,217,086.984189999 | 223,846.079203415 | 114.576078423 | 207.326060388 | 2,010,230.893396306 | 2,992,919.002847773 | -982,688.109451467 | 32.8337% | **DISCREPANCY >1%** |
| 28 | 4,652,641.765010104 | 176,806.130994487 | 146,403.169117868 | 205.210187164 | 3,144,789.333292944 | 4,329,227.254710585 | -1,184,437.921417641 | 27.3591% | **DISCREPANCY >1%** |
| 29 | 2,898,495.592659301 | 0 | 0 | 207.726660946 | 2,306,335.831049477 | 2,898,287.865998355 | -591,952.034948878 | 20.4241% | **DISCREPANCY >1%** |
| 30 | 3,382,576.048550954 | 223,846.079129087 | 22,914.692387486 | 208.461152388 | 2,667,110.572279116 | 3,135,606.815881993 | -468,496.243602877 | 14.9411% | **DISCREPANCY >1%** |
| 31 | 1,586,510.687500347 | 223,846.079187058 | 38,096.765184011 | 208.694922308 | 893,531.693731475 | 1,324,359.14820697 | -430,827.454475495 | 32.5310% | **DISCREPANCY >1%** |
| 32 | 3,427,219.832587246 | 0 | 94,980.465258985 | 210.895902568 | 3,333,422.893428039 | 3,332,028.471425693 | +1,394.422002346 | 0.0418% | OK |
| 33 | 2,301,829.983986493 | 89,682.65958267 | 87,386.672373635 | 211.090754805 | 1,649,218.144611554 | 2,124,549.561275383 | -475,331.416663829 | 22.3732% | **DISCREPANCY >1%** |
| 34 | 2,517,749.45856573 | 0 | 133,529.478234858 | 211.353990342 | 2,043,591.427143987 | 2,384,008.62634053 | -340,417.199196543 | 14.2791% | **DISCREPANCY >1%** |
| 35 | 2,988,529.927713479 | 0 | 95,598.20397956 | 214.133908803 | 2,644,675.94827133 | 2,892,717.589825116 | -248,041.641553786 | 8.5746% | **DISCREPANCY >1%** |
| 36 | 627,889.239072002 | 9,298.851890397 | 37,538.851627533 | 215.003480306 | 464,701.809419829 | 580,836.532073766 | -116,134.722653937 | 19.9943% | **DISCREPANCY >1%** |
| 37 | 3,572,554.215572503 | 223,846.079137807 | 0 | 215.373593959 | 2,381,932.136047951 | 3,348,492.762840737 | -966,560.626792786 | 28.8655% | **DISCREPANCY >1%** |
| 38 | 1,473,095.476578779 | 139,486.240803376 | 104,920.435178857 | 860.1015242 | 886,266.551300017 | 1,227,828.699072346 | -341,562.147772329 | 27.8183% | **DISCREPANCY >1%** |
| 39 | 3,166,433.553195886 | 172,663.511264212 | 29,373.416255258 | 216.78099811 | 1,695,429.468557074 | 2,964,179.844678306 | -1,268,750.376121232 | 42.8027% | **DISCREPANCY >1%** |
| 40 | 327,003.733918726 | 74,153.423804429 | 128,034.305600759 | 217.517385175 | 176,741.448835177 | 124,598.487128363 | +52,142.961706814 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,171.611654056 | 204,063.185350324 | 217,217.580368984 | 218.976763393 | 1,802,863.651482052 | 2,553,671.869171355 | -750,808.217689303 | 29.4011% | **DISCREPANCY >1%** |
| 42 | 2,595,041.142096049 | 223,846.079158774 | 0 | 220.919954602 | 2,183,122.943907032 | 2,370,974.142982673 | -187,851.199075641 | 7.9229% | **DISCREPANCY >1%** |
| 43 | 3,052,785.884567396 | 179,562.708609502 | 418.387877525 | 221.016150183 | 2,212,435.691834392 | 2,872,583.771930186 | -660,148.080095794 | 22.9809% | **DISCREPANCY >1%** |
| 44 | 4,012,380.426367737 | 82,938.546710406 | 126,795.347709685 | 221.029336228 | 3,398,459.104068 | 3,802,425.502611418 | -403,966.398543418 | 10.6239% | **DISCREPANCY >1%** |
| 45 | 3,011,750.442172559 | 186,957.988153914 | 0 | 224.877745721 | 2,008,703.116929344 | 2,824,567.576272924 | -815,864.45934358 | 28.8845% | **DISCREPANCY >1%** |
| 46 | 3,510,716.597918791 | 140,033.673137159 | 93,394.806384354 | 224.017693828 | 2,515,548.15997582 | 3,277,064.10070345 | -761,515.94072763 | 23.2377% | **DISCREPANCY >1%** |
| 47 | 1,295,527.895427735 | 221,936.771527767 | 22,924.082606544 | 225.661885453 | 687,673.465762526 | 1,050,441.379407971 | -362,767.913645445 | 34.5348% | **DISCREPANCY >1%** |
| 48 | 3,107,533.04985937 | 0 | 101,664.859193657 | 226.700853051 | 2,328,846.687272452 | 3,005,641.489812662 | -676,794.80254021 | 22.5174% | **DISCREPANCY >1%** |
| 49 | 2,017,874.54242826 | 120,325.749958529 | 164,459.367635194 | 226.470969136 | 1,164,300.147403006 | 1,732,862.953865401 | -568,562.806462395 | 32.8106% | **DISCREPANCY >1%** |
| 50 | 3,236,913.049890369 | 84,285.185243783 | 40,263.969667629 | 227.870419958 | 2,747,775.456897652 | 3,112,136.024558999 | -364,360.567661347 | 11.7077% | **DISCREPANCY >1%** |
| 51 | 3,694,848.506486485 | 105,922.936515629 | 153,207.038998376 | 228.014881514 | 2,389,201.875098131 | 3,435,490.516090966 | -1,046,288.640992835 | 30.4552% | **DISCREPANCY >1%** |
| 52 | 2,952,115.070821844 | 223,846.079128825 | 90.395967424 | 229.761205219 | 1,893,408.234763284 | 2,727,948.834520376 | -834,540.599757092 | 30.5922% | **DISCREPANCY >1%** |
| 53 | 4,587,458.791415818 | 165,100.951333266 | 83,439.89504252 | 230.141069494 | 4,002,412.306866003 | 4,338,687.803970538 | -336,275.497104535 | 7.7506% | **DISCREPANCY >1%** |
| 54 | 3,774,204.691772849 | 104,605.505486405 | 43,761.132345373 | 232.262086156 | 3,186,263.949667802 | 3,625,605.791854915 | -439,341.842187113 | 12.1177% | **DISCREPANCY >1%** |
| 55 | 2,799,335.289393601 | 9,506.992017657 | 94,545.881062638 | 234.134605081 | 2,407,570.599805009 | 2,695,048.281708225 | -287,477.681903216 | 10.6668% | **DISCREPANCY >1%** |
| 56 | 2,646,404.264136623 | 147,253.342830014 | 13,997.922202342 | 233.282503575 | 1,876,658.38095267 | 2,484,919.716600692 | -608,261.335648022 | 24.4781% | **DISCREPANCY >1%** |
| 57 | 825,775.111178675 | 223,846.079159495 | 70,615.680938887 | 234.648963669 | 442,264.988899287 | 531,078.702116624 | -88,813.713217337 | 16.7232% | **DISCREPANCY >1%** |
| 58 | 297,301.290570974 | 161,966.767161337 | 0 | 85.22314421 | 228,682.61780516 | 135,249.300265427 | +93,433.317539733 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,731.959417721 | 71,891.198873536 | 122,883.114116497 | 239.495433095 | 2,648,586.34800194 | 2,998,718.150994593 | -350,131.802992653 | 11.6760% | **DISCREPANCY >1%** |
| 60 | 3,738,936.573624944 | 121,459.892472139 | 40,528.882878666 | 238.011153447 | 3,088,309.198855045 | 3,576,709.787120692 | -488,400.588265647 | 13.6550% | **DISCREPANCY >1%** |
| 61 | 4,368,652.001297523 | 113,406.497793948 | 81,352.28253849 | 238.599154608 | 3,497,985.843054945 | 4,173,654.621810477 | -675,668.778755532 | 16.1889% | **DISCREPANCY >1%** |
| 62 | 2,639,382.622065521 | 1,029.291966503 | 43,106.60780272 | 239.315194526 | 2,431,187.062364878 | 2,595,007.407101772 | -163,820.344736894 | 6.3129% | **DISCREPANCY >1%** |
| 63 | 3,817,263.993110186 | 0 | 147,125.064841795 | 240.616747337 | 2,963,791.083203702 | 3,669,898.311521054 | -706,107.228317352 | 19.2405% | **DISCREPANCY >1%** |
| 64 | 3,340,774.269906866 | 44,721.605785854 | 166,756.910890331 | 241.06376794 | 2,925,100.024232174 | 3,129,054.689462741 | -203,954.665230567 | 6.5180% | **DISCREPANCY >1%** |
| 65 | 3,223,185.02667184 | 204,139.305947923 | 71.722624687 | 244.953625561 | 2,290,879.611105601 | 3,018,729.044473669 | -727,849.433368068 | 24.1111% | **DISCREPANCY >1%** |
| 66 | 3,355,565.767963545 | 58,498.893235066 | 83,262.913449555 | 244.876365662 | 2,399,574.013147158 | 3,213,559.084913262 | -813,985.071766104 | 25.3297% | **DISCREPANCY >1%** |
| 67 | 818,233.005618122 | 94,182.859728691 | 132,264.88633962 | 244.548133063 | 415,753.341684633 | 591,540.711416748 | -175,787.369732115 | 29.7168% | **DISCREPANCY >1%** |
| 68 | 3,606,519.578980255 | 51,820.059551198 | 169,952.893747578 | 245.156427258 | 2,757,678.262310717 | 3,384,501.469254221 | -626,823.206943504 | 18.5203% | **DISCREPANCY >1%** |
| 69 | 1,127,755.983729383 | 223,846.079187092 | 59,604.102841208 | 246.154576631 | 789,692.225967185 | 844,059.647124452 | -54,367.421157267 | 6.4411% | **DISCREPANCY >1%** |
| 70 | 38,331.22374926 | 148.169094182 | 0 | 182.18272667 | 38,149.040995632 | 38,000.871928408 | +148.169067224 | 0.3899% | OK |
| 71 | 4,185,120.677766843 | 96,876.088940082 | 85,705.37638208 | 249.451983437 | 3,225,073.636749908 | 4,002,289.760461244 | -777,216.123711336 | 19.4192% | **DISCREPANCY >1%** |
| 72 | 2,486,803.251902087 | 221,779.667597505 | 0 | 250.603932762 | 2,105,694.740466461 | 2,264,772.98037182 | -159,078.239905359 | 7.0240% | **DISCREPANCY >1%** |
| 73 | 3,280,380.920420528 | 223,846.079132607 | 0 | 251.105893965 | 1,813,676.942884909 | 3,056,283.735393956 | -1,242,606.792509047 | 40.6574% | **DISCREPANCY >1%** |
| 74 | 3,335,921.259227667 | 0 | 94,292.343237338 | 252.356012684 | 2,712,295.874311409 | 3,241,376.559977645 | -529,080.685666236 | 16.3227% | **DISCREPANCY >1%** |
| 75 | 3,508,568.481457029 | 203,423.332505008 | 16,900.822302978 | 252.228181405 | 2,709,395.891317406 | 3,287,992.098467638 | -578,596.207150232 | 17.5972% | **DISCREPANCY >1%** |
| 76 | 1,014,680.381470641 | 179,713.432857498 | 4,053.056546057 | 254.707430113 | 539,215.189087256 | 830,659.184636973 | -291,443.995549717 | 35.0858% | **DISCREPANCY >1%** |
| 77 | 3,211,839.798076511 | 0 | 560,753.334406754 | 254.999075623 | 2,512,507.442349621 | 2,650,831.464594134 | -138,324.022244513 | 5.2181% | **DISCREPANCY >1%** |
| 78 | 650,047.486811965 | 6,499.356268383 | 93,439.420139376 | 256.779702547 | 497,791.007489218 | 549,851.930701659 | -52,060.923212441 | 9.4681% | **DISCREPANCY >1%** |
| 79 | 3,522,185.175371893 | 63,794.223490279 | 150,693.514097077 | 256.600830652 | 2,929,780.461334615 | 3,307,440.836953885 | -377,660.37561927 | 11.4185% | **DISCREPANCY >1%** |
| 80 | 1,805,807.602432742 | 144,923.552045991 | 42,374.70227022 | 257.09083153 | 1,575,661.087864241 | 1,618,252.257285001 | -42,591.16942076 | 2.6319% | **DISCREPANCY >1%** |
| 81 | 2,604,356.131084093 | 20,523.249052955 | 112,249.98027876 | 258.414012877 | 1,643,122.255968379 | 2,471,324.487739501 | -828,202.231771122 | 33.5124% | **DISCREPANCY >1%** |
| 82 | 637,044.829536987 | 1,033.20576559 | 203,656.438410755 | 259.745850219 | 387,646.14878236 | 432,095.439510423 | -44,449.290728063 | 10.2869% | **DISCREPANCY >1%** |
| 83 | 2,655,168.094539082 | 0 | 208,332.711813588 | 260.256934012 | 2,105,495.312152469 | 2,446,575.125791482 | -341,079.813639013 | 13.9411% | **DISCREPANCY >1%** |
| 84 | 573,302.241545722 | 4,045.485421068 | 25,365.155475257 | 260.999999439 | 499,568.25457856 | 543,630.600649958 | -44,062.346071398 | 8.1051% | **DISCREPANCY >1%** |
| 85 | 2,507,845.254188665 | 101,240.455860461 | 63,690.414418671 | 263.014358235 | 1,950,373.413274667 | 2,342,651.369551298 | -392,277.956276631 | 16.7450% | **DISCREPANCY >1%** |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,270.581541561 | 223,698.068303363 | 51,054.043826615 | 265.166257826 | 811,937.38714958 | 1,232,253.303153757 | -420,315.916004177 | 34.1095% | **DISCREPANCY >1%** |
| 88 | 3,458,036.281203651 | 42,432.314973574 | 95,635.011722251 | 265.870198715 | 3,189,628.068539638 | 3,319,703.084309111 | -130,075.015769473 | 3.9182% | **DISCREPANCY >1%** |
| 89 | 2,763,940.852090179 | 184,424.496583798 | 187,748.849811315 | 267.32822308 | 1,978,297.520002656 | 2,391,500.177471986 | -413,202.65746933 | 17.2779% | **DISCREPANCY >1%** |
| 90 | 140,127.393099798 | 116,392.269522858 | 0 | 104.032188435 | 140,001.653399788 | 23,631.091388505 | +116,370.562011283 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,462.631269244 | 160,524.915777216 | 55,172.894789013 | 268.197144647 | 543,685.801296443 | 777,496.623558368 | -233,810.822261925 | 30.0722% | **DISCREPANCY >1%** |
| 92 | 382,890.228663509 | 176,927.850467173 | 41,186.988026446 | 270.178151494 | 165,518.197370141 | 164,505.212018396 | +1,012.985351745 | 0.6157% | OK |
| 93 | 3,180,215.51933591 | 181,921.200099591 | 10,630.11569139 | 270.306172509 | 2,086,451.787267245 | 2,987,393.89737242 | -900,942.110105175 | 30.1581% | **DISCREPANCY >1%** |
| 94 | 1,582,842.5781042 | 216,580.400930509 | 6,977.120150346 | 272.371739533 | 901,263.328629545 | 1,359,012.685283812 | -457,749.356654267 | 33.6824% | **DISCREPANCY >1%** |
| 95 | 2,823,508.04876599 | 223,698.068303101 | 92,584.118277643 | 272.028885632 | 1,759,219.58729414 | 2,506,953.833299614 | -747,734.246005474 | 29.8264% | **DISCREPANCY >1%** |
| 96 | 672,938.803045531 | 130,829.78226522 | 67,499.464576751 | 273.313063513 | 387,490.176423779 | 474,336.243140047 | -86,846.066716268 | 18.3089% | **DISCREPANCY >1%** |
| 97 | 941,708.525040323 | 24,305.834427164 | 251,260.057860047 | 274.06514191 | 624,754.286624672 | 665,868.567611202 | -41,114.28098653 | 6.1745% | **DISCREPANCY >1%** |
| 98 | 2,790,278.348044368 | 176,154.008844017 | 0 | 276.435730657 | 1,537,507.711157861 | 2,613,847.903469694 | -1,076,340.192311833 | 41.1783% | **DISCREPANCY >1%** |
| 99 | 217,544.329419552 | 72,004.601807409 | 0 | 287.650694716 | 145,941.59538324 | 145,252.076917427 | +689.518465813 | 0.4747% | OK |
| 100 | 1,799,804.095590657 | 201,831.869356847 | 8,577.774654887 | 277.477567732 | 1,136,482.892106863 | 1,589,116.974011191 | -452,634.081904328 | 28.4833% | **DISCREPANCY >1%** |
| 101 | 2,301,519.793430326 | 96,709.729814995 | 147,162.212142243 | 278.978266727 | 1,352,453.090541984 | 2,057,368.873206361 | -704,915.782664377 | 34.2629% | **DISCREPANCY >1%** |
| 102 | 843,154.314854854 | 50,526.561897738 | 158,995.005398752 | 279.295649394 | 571,127.582889633 | 633,353.45190897 | -62,225.869019337 | 9.8248% | **DISCREPANCY >1%** |
| 103 | 96,680.397144062 | 99,945.222911754 | 0 | 54.433265495 | 75,422.014954409 | 0 | +75,422.014954409 | ∞% | OK |
| 104 | 3,062,978.342942101 | 0 | 8,693.224149186 | 281.763791087 | 2,725,130.208756965 | 3,054,003.355001828 | -328,873.146244863 | 10.7685% | **DISCREPANCY >1%** |
| 105 | 1,922,189.427280623 | 24,337.695348448 | 196,110.586646038 | 282.242109137 | 1,278,846.154813373 | 1,701,458.903177 | -422,612.748363627 | 24.8382% | **DISCREPANCY >1%** |
| 106 | 2,376,996.760564706 | 144,209.176940372 | 53,273.846844962 | 284.301424871 | 1,487,849.779485208 | 2,179,229.435354501 | -691,379.655869293 | 31.7258% | **DISCREPANCY >1%** |
| 107 | 1,412,323.086452273 | 75,002.822267192 | 259,170.72147602 | 284.014369462 | 768,379.69328733 | 1,077,865.528339599 | -309,485.835052269 | 28.7128% | **DISCREPANCY >1%** |
| 108 | 1,530,530.515126298 | 44,888.690492425 | 38,862.313667517 | 286.752965229 | 1,054,527.794798477 | 1,446,492.758001127 | -391,964.96320265 | 27.0976% | **DISCREPANCY >1%** |
| 109 | 1,408,935.281801709 | 223,698.068310612 | 70,026.821602108 | 287.413033366 | 715,168.920824128 | 1,114,922.978855623 | -399,754.058031495 | 35.8548% | **DISCREPANCY >1%** |
| 110 | 2,492,979.820435386 | 0 | 114,616.252062888 | 287.551432239 | 1,729,173.602489589 | 2,378,076.016940259 | -648,902.41445067 | 27.2868% | **DISCREPANCY >1%** |
| 111 | 3,442,709.711521751 | 192,321.702770461 | 337,717.260844435 | 288.903836685 | 2,421,207.348894766 | 2,912,381.84407017 | -491,174.495175404 | 16.8650% | **DISCREPANCY >1%** |
| 112 | 1,865,777.736981223 | 173,200.851403845 | 85,660.90276259 | 290.726524813 | 858,535.424827937 | 1,606,625.256289975 | -748,089.831462038 | 46.5628% | **DISCREPANCY >1%** |
| 113 | 1,426,489.253958655 | 223,287.331033099 | 24,443.416711791 | 291.823730971 | 723,051.673206953 | 1,178,466.682482794 | -455,415.009275841 | 38.6447% | **DISCREPANCY >1%** |
| 114 | 1,394,604.402315899 | 54,534.060998196 | 206,409.823209484 | 291.31421119 | 818,971.595299437 | 1,133,369.203897029 | -314,397.608597592 | 27.7400% | **DISCREPANCY >1%** |
| 115 | 1,527,506.977031515 | 196,982.31937977 | 0 | 293.24131153 | 674,736.540831756 | 1,330,231.416340215 | -655,494.875508459 | 49.2767% | **DISCREPANCY >1%** |
| 116 | 498,337.033277975 | 129,797.29432009 | 46,438.331747847 | 293.098963523 | 322,456.895400295 | 321,808.308246515 | +648.58715378 | 0.2015% | OK |
| 117 | 1,577,401.159372488 | 0 | 110,042.604483153 | 295.659242863 | 1,182,843.699577966 | 1,467,062.895646472 | -284,219.196068506 | 19.3733% | **DISCREPANCY >1%** |
| 118 | 2,024,063.920306349 | 153,349.352006901 | 100,459.246518578 | 295.259844704 | 1,610,600.660779731 | 1,769,960.061936166 | -159,359.401156435 | 9.0035% | **DISCREPANCY >1%** |
| 119 | 1,493,350.518002894 | 127,462.331317651 | 0 | 297.161251227 | 720,015.01421028 | 1,365,591.025434016 | -645,576.011223736 | 47.2744% | **DISCREPANCY >1%** |
| 120 | 2,546,753.900214508 | 3,986.862247885 | 172,138.268379615 | 297.02867698 | 2,203,582.648794662 | 2,370,331.740910028 | -166,749.092115366 | 7.0348% | **DISCREPANCY >1%** |
| 121 | 2,766,661.954076083 | 211,264.855121109 | 0 | 298.990935544 | 1,535,311.697079252 | 2,555,098.10801943 | -1,019,786.410940178 | 39.9118% | **DISCREPANCY >1%** |
| 122 | 494,846.449887162 | 223,698.06146747 | 41,001.922983965 | 300.071585414 | 212,399.087082206 | 229,846.393850313 | -17,447.306768107 | 7.5908% | **DISCREPANCY >1%** |
| 123 | 1,850,369.345164228 | 117,012.394161995 | 40,622.003819962 | 301.954694218 | 1,545,775.094847816 | 1,692,432.992488053 | -146,657.897640237 | 8.6655% | **DISCREPANCY >1%** |
| 124 | 3,304,803.536251671 | 92,313.326894099 | 196,711.244687047 | 301.202246409 | 2,213,958.401766367 | 3,015,477.762424116 | -801,519.360657749 | 26.5801% | **DISCREPANCY >1%** |
| 125 | 2,325,836.430010415 | 223,698.068375433 | 7,964.547109056 | 303.897169539 | 1,109,743.523235324 | 2,093,869.917356387 | -984,126.394121063 | 47.0003% | **DISCREPANCY >1%** |
| 126 | 1,107,650.577479887 | 101,570.16062343 | 215,477.375953641 | 303.623123299 | 506,364.309783089 | 790,299.417779517 | -283,935.107996428 | 35.9275% | **DISCREPANCY >1%** |
| 127 | 2,802,834.648141101 | 201,728.715858691 | 45.025794905 | 305.321344069 | 1,653,334.165428989 | 2,600,755.585143436 | -947,421.419714447 | 36.4286% | **DISCREPANCY >1%** |
| 128 | 2,676,800.343533691 | 0 | 34,715.84016103 | 306.261683797 | 2,459,320.890947386 | 2,641,778.241688864 | -182,457.350741478 | 6.9066% | **DISCREPANCY >1%** |

## After upgrade: staked alpha consistency

| Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 2,484,460.267183304 | 165,036.45414469 | 17,184.489564018 | 36.422151081 | 1,659,804.526705788 | 2,302,202.901323515 | -642,398.374617727 | 27.9036% | **DISCREPANCY >1%** |
| 2 | 3,328,562.356043044 | 186,958.253739906 | 277.903743213 | 203.500851075 | 2,711,313.00299156 | 3,141,122.69770885 | -429,809.69471729 | 13.6833% | **DISCREPANCY >1%** |
| 3 | 2,802,746.580254244 | 0.468119708 | 164,534.1745532 | 203.126595269 | 2,078,448.8879906 | 2,638,008.810986067 | -559,559.922995467 | 21.2114% | **DISCREPANCY >1%** |
| 4 | 3,503,468.886675974 | 13,456.73137153 | 157,431.151976776 | 204.029751097 | 2,811,300.435005442 | 3,332,376.973576571 | -521,076.538571129 | 15.6367% | **DISCREPANCY >1%** |
| 5 | 2,998,805.142923303 | 209,823.537800336 | 3,608.243254478 | 205.281869849 | 1,525,624.786765432 | 2,785,168.07999864 | -1,259,543.293233208 | 45.2232% | **DISCREPANCY >1%** |
| 6 | 2,715,918.911458657 | 23,468.530961558 | 97,097.786802825 | 208.346869898 | 2,451,996.683773013 | 2,595,144.246824376 | -143,147.563051363 | 5.5159% | **DISCREPANCY >1%** |
| 7 | 3,129,962.311512733 | 0 | 23,076.821212896 | 208.075388416 | 3,089,552.962272271 | 3,106,677.414911421 | -17,124.45263915 | 0.5512% | OK |
| 8 | 3,034,802.425875871 | 170,998.084151705 | 68,588.144501241 | 208.086928434 | 2,204,088.317242778 | 2,795,008.110294491 | -590,919.793051713 | 21.1419% | **DISCREPANCY >1%** |
| 9 | 3,941,057.201684353 | 189,930.97794848 | 162,577.763621798 | 209.118320342 | 2,662,702.753243412 | 3,588,339.341793733 | -925,636.588550321 | 25.7956% | **DISCREPANCY >1%** |
| 10 | 3,118,132.600023772 | 223,846.079166223 | 3,919.775094447 | 210.688883049 | 2,413,820.773748008 | 2,890,156.056880053 | -476,335.283132045 | 16.4812% | **DISCREPANCY >1%** |
| 11 | 2,980,643.186006633 | 58,843.162874805 | 129,215.634569001 | 211.661334459 | 1,724,261.701431808 | 2,792,372.727228368 | -1,068,111.02579656 | 38.2510% | **DISCREPANCY >1%** |
| 12 | 3,360,278.048608388 | 222,508.114052081 | 0 | 213.292697933 | 1,856,786.281218517 | 3,137,556.641858374 | -1,280,770.360639857 | 40.8206% | **DISCREPANCY >1%** |
| 13 | 2,419,760.443340406 | 148,967.172896852 | 16,582.21426827 | 213.761478968 | 1,828,953.545731635 | 2,253,997.294696316 | -425,043.748964681 | 18.8573% | **DISCREPANCY >1%** |
| 14 | 3,059,235.25751119 | 220,189.208395156 | 129,813.067943654 | 214.278374873 | 1,767,865.10047261 | 2,709,018.702797507 | -941,153.602324897 | 34.7414% | **DISCREPANCY >1%** |
| 15 | 1,282,901.081825716 | 52,905.700586193 | 218,459.39128412 | 215.096217191 | 716,745.344324384 | 1,011,320.893738212 | -294,575.549413828 | 29.1278% | **DISCREPANCY >1%** |
| 16 | 292,282.056082386 | 106,491.578931276 | 9,125.331581653 | 217.086571442 | 219,971.692133916 | 176,448.058998015 | +43,523.633135901 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,683.926089646 | 35,067.621313474 | 112,054.250955246 | 217.357595922 | 2,591,753.716854974 | 2,878,344.696225004 | -286,590.97937003 | 9.9567% | **DISCREPANCY >1%** |
| 18 | 3,221,551.3581729 | 82,212.573733221 | 184,937.037344576 | 454.502768702 | 2,728,012.390175507 | 2,953,947.244326401 | -225,934.854150894 | 7.6485% | **DISCREPANCY >1%** |
| 19 | 2,545,359.397668625 | 203,827.261478907 | 721.146943043 | 219.424919845 | 1,558,366.405120635 | 2,340,591.56432683 | -782,225.159206195 | 33.4199% | **DISCREPANCY >1%** |
| 20 | 3,151,605.118117668 | 223,846.079145155 | 0 | 221.646865422 | 1,852,324.660431886 | 2,927,537.392107091 | -1,075,212.731675205 | 36.7275% | **DISCREPANCY >1%** |
| 21 | 3,446,371.944539729 | 160,850.042236821 | 12,526.594993624 | 222.583376001 | 2,641,137.2895972 | 3,272,772.723933283 | -631,635.434336083 | 19.2997% | **DISCREPANCY >1%** |
| 22 | 3,424,718.078972077 | 161,827.727614681 | 8,538.815663423 | 223.742051045 | 2,253,922.90864158 | 3,254,127.793642928 | -1,000,204.885001348 | 30.7364% | **DISCREPANCY >1%** |
| 23 | 4,040,927.136284042 | 117,779.002762432 | 257,565.47245039 | 224.241550645 | 2,717,035.06015898 | 3,665,358.419520575 | -948,323.359361595 | 25.8725% | **DISCREPANCY >1%** |
| 24 | 3,641,720.385197894 | 75,925.654771513 | 113,298.120046902 | 225.496276048 | 2,964,647.656840732 | 3,452,271.114103431 | -487,623.457262699 | 14.1247% | **DISCREPANCY >1%** |
| 25 | 4,116,590.160734956 | 223,846.079136167 | 0 | 225.348350531 | 3,262,570.098652547 | 3,892,518.733248258 | -629,948.634595711 | 16.1835% | **DISCREPANCY >1%** |
| 26 | 776,704.346869401 | 73,459.26989387 | 16,231.463886896 | 226.885745751 | 673,306.86442606 | 686,786.727342884 | -13,479.862916824 | 1.9627% | **DISCREPANCY >1%** |
| 27 | 3,217,109.984189999 | 223,846.079203415 | 114.576078423 | 230.326060336 | 2,010,230.893396306 | 2,992,919.002847825 | -982,688.109451519 | 32.8337% | **DISCREPANCY >1%** |
| 28 | 4,652,673.585894858 | 176,806.130994487 | 146,411.990002622 | 228.210187113 | 3,144,789.333292944 | 4,329,227.254710636 | -1,184,437.921417692 | 27.3591% | **DISCREPANCY >1%** |
| 29 | 2,898,518.592659301 | 0 | 0 | 230.726660897 | 2,306,335.831049477 | 2,898,287.865998404 | -591,952.034948927 | 20.4241% | **DISCREPANCY >1%** |
| 30 | 3,382,599.048550954 | 223,846.079129087 | 22,914.692387486 | 231.461152337 | 2,667,110.572279116 | 3,135,606.815882044 | -468,496.243602928 | 14.9411% | **DISCREPANCY >1%** |
| 31 | 1,586,533.687500347 | 223,846.079187058 | 38,096.765184011 | 231.694922258 | 893,531.693731475 | 1,324,359.14820702 | -430,827.454475545 | 32.5310% | **DISCREPANCY >1%** |
| 32 | 3,427,242.832587246 | 0 | 94,980.465258985 | 233.895902519 | 3,333,422.893428039 | 3,332,028.471425742 | +1,394.422002297 | 0.0418% | OK |
| 33 | 2,301,854.409582412 | 89,682.65958267 | 87,388.097969554 | 234.090754756 | 1,649,218.144611554 | 2,124,549.561275432 | -475,331.416663878 | 22.3732% | **DISCREPANCY >1%** |
| 34 | 2,517,782.310726575 | 0 | 133,539.330395703 | 234.353990294 | 2,043,591.427143987 | 2,384,008.626340578 | -340,417.199196591 | 14.2791% | **DISCREPANCY >1%** |
| 35 | 2,988,552.927713479 | 0 | 95,598.20397956 | 237.133908755 | 2,644,675.94827133 | 2,892,717.589825164 | -248,041.641553834 | 8.5746% | **DISCREPANCY >1%** |
| 36 | 627,912.239072002 | 9,298.851890397 | 37,538.851627533 | 238.00348026 | 464,701.809419829 | 580,836.532073812 | -116,134.722653983 | 19.9943% | **DISCREPANCY >1%** |
| 37 | 3,572,577.215572503 | 223,846.079137807 | 0 | 238.37359391 | 2,381,932.136047951 | 3,348,492.762840786 | -966,560.626792835 | 28.8655% | **DISCREPANCY >1%** |
| 38 | 1,473,123.675090702 | 139,486.240803376 | 104,925.63369078 | 883.101524151 | 886,266.551300017 | 1,227,828.699072395 | -341,562.147772378 | 27.8183% | **DISCREPANCY >1%** |
| 39 | 3,166,456.553195886 | 172,663.511264212 | 29,373.416255258 | 239.780998064 | 1,695,429.468557074 | 2,964,179.844678352 | -1,268,750.376121278 | 42.8027% | **DISCREPANCY >1%** |
| 40 | 327,026.733918726 | 74,153.423804429 | 128,034.305600759 | 240.517385125 | 176,741.448835177 | 124,598.487128413 | +52,142.961706764 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,194.611654056 | 204,063.185350324 | 217,217.580368984 | 241.976763343 | 1,802,863.651482052 | 2,553,671.869171405 | -750,808.217689353 | 29.4011% | **DISCREPANCY >1%** |
| 42 | 2,595,064.142096049 | 223,846.079158774 | 0 | 243.919954553 | 2,183,122.943907032 | 2,370,974.142982722 | -187,851.19907569 | 7.9229% | **DISCREPANCY >1%** |
| 43 | 3,052,808.884567396 | 179,562.708609502 | 418.387877525 | 244.016150134 | 2,212,435.691834392 | 2,872,583.771930235 | -660,148.080095843 | 22.9809% | **DISCREPANCY >1%** |
| 44 | 4,012,416.368749828 | 82,938.546710406 | 126,808.290091776 | 244.02933618 | 3,398,459.104068 | 3,802,425.502611466 | -403,966.398543466 | 10.6239% | **DISCREPANCY >1%** |
| 45 | 3,011,773.442172559 | 186,957.988153914 | 0 | 247.877745673 | 2,008,703.116929344 | 2,824,567.576272972 | -815,864.459343628 | 28.8845% | **DISCREPANCY >1%** |
| 46 | 3,510,739.597918791 | 140,033.673137159 | 93,394.806384354 | 247.017693776 | 2,515,548.15997582 | 3,277,064.100703502 | -761,515.940727682 | 23.2377% | **DISCREPANCY >1%** |
| 47 | 1,295,550.895427735 | 221,936.771527767 | 22,924.082606544 | 248.661885404 | 687,673.465762526 | 1,050,441.37940802 | -362,767.913645494 | 34.5348% | **DISCREPANCY >1%** |
| 48 | 3,107,556.04985937 | 0 | 101,664.859193657 | 249.700853002 | 2,328,846.687272452 | 3,005,641.489812711 | -676,794.802540259 | 22.5174% | **DISCREPANCY >1%** |
| 49 | 2,017,898.603353698 | 120,325.749958529 | 164,460.428560632 | 249.470969087 | 1,164,300.147403006 | 1,732,862.95386545 | -568,562.806462444 | 32.8106% | **DISCREPANCY >1%** |
| 50 | 3,236,936.049890369 | 84,285.185243783 | 40,263.969667629 | 250.870419909 | 2,747,775.456897652 | 3,112,136.024559048 | -364,360.567661396 | 11.7077% | **DISCREPANCY >1%** |
| 51 | 3,694,884.449632193 | 105,922.936515629 | 153,219.982144084 | 251.014881466 | 2,389,201.875098131 | 3,435,490.516091014 | -1,046,288.640992883 | 30.4552% | **DISCREPANCY >1%** |
| 52 | 2,952,138.070821844 | 223,846.079128825 | 90.395967424 | 252.761205172 | 1,893,408.234763284 | 2,727,948.834520423 | -834,540.599757139 | 30.5922% | **DISCREPANCY >1%** |
| 53 | 4,587,494.90797009 | 165,100.951333266 | 83,453.011596792 | 253.141069445 | 4,002,412.306866003 | 4,338,687.803970587 | -336,275.497104584 | 7.7506% | **DISCREPANCY >1%** |
| 54 | 3,774,227.691772849 | 104,605.505486405 | 43,761.132345373 | 255.262086104 | 3,186,263.949667802 | 3,625,605.791854967 | -439,341.842187165 | 12.1177% | **DISCREPANCY >1%** |
| 55 | 2,799,358.289393601 | 9,506.992017657 | 94,545.881062638 | 257.134605034 | 2,407,570.599805009 | 2,695,048.281708272 | -287,477.681903263 | 10.6668% | **DISCREPANCY >1%** |
| 56 | 2,646,427.264136623 | 147,253.342830014 | 13,997.922202342 | 256.282503523 | 1,876,658.38095267 | 2,484,919.716600744 | -608,261.335648074 | 24.4781% | **DISCREPANCY >1%** |
| 57 | 825,798.111178675 | 223,846.079159495 | 70,615.680938887 | 257.648963622 | 442,264.988899287 | 531,078.702116671 | -88,813.713217384 | 16.7232% | **DISCREPANCY >1%** |
| 58 | 297,324.290570974 | 161,966.767161337 | 0 | 108.223144162 | 228,682.61780516 | 135,249.300265475 | +93,433.317539685 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,754.959417721 | 71,891.198873536 | 122,883.114116497 | 262.495433049 | 2,648,586.34800194 | 2,998,718.150994639 | -350,131.802992699 | 11.6760% | **DISCREPANCY >1%** |
| 60 | 3,738,959.573624944 | 121,459.892472139 | 40,528.882878666 | 261.011153397 | 3,088,309.198855045 | 3,576,709.787120742 | -488,400.588265697 | 13.6550% | **DISCREPANCY >1%** |
| 61 | 4,368,681.662284035 | 113,406.497793948 | 81,358.943525002 | 261.599154562 | 3,497,985.843054945 | 4,173,654.621810523 | -675,668.778755578 | 16.1889% | **DISCREPANCY >1%** |
| 62 | 2,639,412.48357569 | 1,029.291966503 | 43,113.469312889 | 262.315194477 | 2,431,187.062364878 | 2,595,007.407101821 | -163,820.344736943 | 6.3129% | **DISCREPANCY >1%** |
| 63 | 3,817,293.062758347 | 0 | 147,131.134489956 | 263.616747289 | 2,963,791.083203702 | 3,669,898.311521102 | -706,107.2283174 | 19.2405% | **DISCREPANCY >1%** |
| 64 | 3,340,810.394682426 | 44,721.605785854 | 166,770.035665891 | 264.063767891 | 2,925,100.024232174 | 3,129,054.68946279 | -203,954.665230616 | 6.5180% | **DISCREPANCY >1%** |
| 65 | 3,223,208.02667184 | 204,139.305947923 | 71.722624687 | 267.95362551 | 2,290,879.611105601 | 3,018,729.04447372 | -727,849.433368119 | 24.1111% | **DISCREPANCY >1%** |
| 66 | 3,355,588.767963545 | 58,498.893235066 | 83,262.913449555 | 267.876365614 | 2,399,574.013147158 | 3,213,559.08491331 | -813,985.071766152 | 25.3297% | **DISCREPANCY >1%** |
| 67 | 818,256.005618122 | 94,182.859728691 | 132,264.88633962 | 267.548133013 | 415,753.341684633 | 591,540.711416798 | -175,787.369732165 | 29.7168% | **DISCREPANCY >1%** |
| 68 | 3,606,555.110567528 | 51,820.059551198 | 169,965.425334851 | 268.156427209 | 2,757,678.262310717 | 3,384,501.46925427 | -626,823.206943553 | 18.5203% | **DISCREPANCY >1%** |
| 69 | 1,127,778.983729383 | 223,846.079187092 | 59,604.102841208 | 269.154576584 | 789,692.225967185 | 844,059.647124499 | -54,367.421157314 | 6.4411% | **DISCREPANCY >1%** |
| 70 | 38,354.22374926 | 148.169094182 | 0 | 205.182726621 | 38,149.040995632 | 38,000.871928457 | +148.169067175 | 0.3899% | OK |
| 71 | 4,185,143.677766843 | 96,876.088940082 | 85,705.37638208 | 272.451983388 | 3,225,073.636749908 | 4,002,289.760461293 | -777,216.123711385 | 19.4192% | **DISCREPANCY >1%** |
| 72 | 2,486,826.251902087 | 221,779.667597505 | 0 | 273.603932713 | 2,105,694.740466461 | 2,264,772.980371869 | -159,078.239905408 | 7.0240% | **DISCREPANCY >1%** |
| 73 | 3,280,403.920420528 | 223,846.079132607 | 0 | 274.105893915 | 1,813,676.942884909 | 3,056,283.735394006 | -1,242,606.792509097 | 40.6574% | **DISCREPANCY >1%** |
| 74 | 3,335,944.259227667 | 0 | 94,292.343237338 | 275.356012635 | 2,712,295.874311409 | 3,241,376.559977694 | -529,080.685666285 | 16.3227% | **DISCREPANCY >1%** |
| 75 | 3,508,603.31466253 | 203,423.332505008 | 16,912.655508479 | 275.228181356 | 2,709,395.891317406 | 3,287,992.098467687 | -578,596.207150281 | 17.5972% | **DISCREPANCY >1%** |
| 76 | 1,014,703.381470641 | 179,713.432857498 | 4,053.056546057 | 277.707430063 | 539,215.189087256 | 830,659.184637023 | -291,443.995549767 | 35.0858% | **DISCREPANCY >1%** |
| 77 | 3,211,862.798076511 | 0 | 560,753.334406754 | 277.999075575 | 2,512,507.442349621 | 2,650,831.464594182 | -138,324.022244561 | 5.2181% | **DISCREPANCY >1%** |
| 78 | 650,070.486811965 | 6,499.356268383 | 93,439.420139376 | 279.779702499 | 497,791.007489218 | 549,851.930701707 | -52,060.923212489 | 9.4681% | **DISCREPANCY >1%** |
| 79 | 3,522,213.255441056 | 63,794.223490279 | 150,698.59416624 | 279.600830604 | 2,929,780.461334615 | 3,307,440.836953933 | -377,660.375619318 | 11.4185% | **DISCREPANCY >1%** |
| 80 | 1,805,830.602432742 | 144,923.552045991 | 42,374.70227022 | 280.090831482 | 1,575,661.087864241 | 1,618,252.257285049 | -42,591.169420808 | 2.6319% | **DISCREPANCY >1%** |
| 81 | 2,604,384.188527874 | 20,523.249052955 | 112,255.037722541 | 281.414012828 | 1,643,122.255968379 | 2,471,324.48773955 | -828,202.231771171 | 33.5124% | **DISCREPANCY >1%** |
| 82 | 637,067.829536987 | 1,033.20576559 | 203,656.438410755 | 282.745850169 | 387,646.14878236 | 432,095.439510473 | -44,449.290728113 | 10.2869% | **DISCREPANCY >1%** |
| 83 | 2,655,191.094539082 | 0 | 208,332.711813588 | 283.256933963 | 2,105,495.312152469 | 2,446,575.125791531 | -341,079.813639062 | 13.9411% | **DISCREPANCY >1%** |
| 84 | 573,325.241545722 | 4,045.485421068 | 25,365.155475257 | 283.99999939 | 499,568.25457856 | 543,630.600650007 | -44,062.346071447 | 8.1051% | **DISCREPANCY >1%** |
| 85 | 2,507,868.614240345 | 101,240.455860461 | 63,690.774470351 | 286.014358187 | 1,950,373.413274667 | 2,342,651.369551346 | -392,277.956276679 | 16.7450% | **DISCREPANCY >1%** |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,293.581541561 | 223,698.068303363 | 51,054.043826615 | 288.166257778 | 811,937.38714958 | 1,232,253.303153805 | -420,315.916004225 | 34.1095% | **DISCREPANCY >1%** |
| 88 | 3,458,059.585228812 | 42,432.314973574 | 95,635.315747412 | 288.870198666 | 3,189,628.068539638 | 3,319,703.08430916 | -130,075.015769522 | 3.9182% | **DISCREPANCY >1%** |
| 89 | 2,763,963.852090179 | 184,424.496583798 | 187,748.849811315 | 290.328223029 | 1,978,297.520002656 | 2,391,500.177472037 | -413,202.657469381 | 17.2779% | **DISCREPANCY >1%** |
| 90 | 140,150.393099798 | 116,392.269522858 | 0 | 127.032188386 | 140,001.653399788 | 23,631.091388554 | +116,370.562011234 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,486.675857598 | 160,524.915777216 | 55,173.939377367 | 291.197144601 | 543,685.801296443 | 777,496.623558414 | -233,810.822261971 | 30.0722% | **DISCREPANCY >1%** |
| 92 | 382,913.228663509 | 176,927.850467173 | 41,186.988026446 | 293.178151448 | 165,518.197370141 | 164,505.212018442 | +1,012.985351699 | 0.6157% | OK |
| 93 | 3,180,245.671895963 | 181,921.200099591 | 10,637.268251443 | 293.30617246 | 2,086,451.787267245 | 2,987,393.897372469 | -900,942.110105224 | 30.1581% | **DISCREPANCY >1%** |
| 94 | 1,582,865.5781042 | 216,580.400930509 | 6,977.120150346 | 295.371739483 | 901,263.328629545 | 1,359,012.685283862 | -457,749.356654317 | 33.6824% | **DISCREPANCY >1%** |
| 95 | 2,823,531.04876599 | 223,698.068303101 | 92,584.118277643 | 295.028885581 | 1,759,219.58729414 | 2,506,953.833299665 | -747,734.246005525 | 29.8264% | **DISCREPANCY >1%** |
| 96 | 672,961.803045531 | 130,829.78226522 | 67,499.464576751 | 296.313063466 | 387,490.176423779 | 474,336.243140094 | -86,846.066716315 | 18.3089% | **DISCREPANCY >1%** |
| 97 | 941,738.035836296 | 24,305.834427164 | 251,266.56865602 | 297.065141862 | 624,754.286624672 | 665,868.56761125 | -41,114.280986578 | 6.1745% | **DISCREPANCY >1%** |
| 98 | 2,790,301.348044368 | 176,154.008844017 | 0 | 299.435730607 | 1,537,507.711157861 | 2,613,847.903469744 | -1,076,340.192311883 | 41.1783% | **DISCREPANCY >1%** |
| 99 | 217,567.329419552 | 72,004.601807409 | 0 | 310.650694665 | 145,941.59538324 | 145,252.076917478 | +689.518465762 | 0.4747% | OK |
| 100 | 1,799,827.095590657 | 201,831.869356847 | 8,577.774654887 | 300.477567686 | 1,136,482.892106863 | 1,589,116.974011237 | -452,634.081904374 | 28.4833% | **DISCREPANCY >1%** |
| 101 | 2,301,542.793430326 | 96,709.729814995 | 147,162.212142243 | 301.978266678 | 1,352,453.090541984 | 2,057,368.87320641 | -704,915.782664426 | 34.2629% | **DISCREPANCY >1%** |
| 102 | 843,177.314854854 | 50,526.561897738 | 158,995.005398752 | 302.295649346 | 571,127.582889633 | 633,353.451909018 | -62,225.869019385 | 9.8248% | **DISCREPANCY >1%** |
| 103 | 96,703.397144062 | 99,945.222911754 | 0 | 70.113199983 | 75,429.335019874 | 0 | +75,429.335019874 | ∞% | OK |
| 104 | 3,063,001.342942101 | 0 | 8,693.224149186 | 304.763791038 | 2,725,130.208756965 | 3,054,003.355001877 | -328,873.146244912 | 10.7685% | **DISCREPANCY >1%** |
| 105 | 1,922,214.248524539 | 24,337.695348448 | 196,112.407889954 | 305.242109088 | 1,278,846.154813373 | 1,701,458.903177049 | -422,612.748363676 | 24.8382% | **DISCREPANCY >1%** |
| 106 | 2,377,019.760564706 | 144,209.176940372 | 53,273.846844962 | 307.301424823 | 1,487,849.779485208 | 2,179,229.435354549 | -691,379.655869341 | 31.7258% | **DISCREPANCY >1%** |
| 107 | 1,412,354.553743215 | 75,002.822267192 | 259,179.188766962 | 307.014369412 | 768,379.69328733 | 1,077,865.528339649 | -309,485.835052319 | 28.7128% | **DISCREPANCY >1%** |
| 108 | 1,530,553.515126298 | 44,888.690492425 | 38,862.313667517 | 309.752965181 | 1,054,527.794798477 | 1,446,492.758001175 | -391,964.963202698 | 27.0976% | **DISCREPANCY >1%** |
| 109 | 1,408,958.281801709 | 223,698.068310612 | 70,026.821602108 | 310.413033317 | 715,168.920824128 | 1,114,922.978855672 | -399,754.058031544 | 35.8548% | **DISCREPANCY >1%** |
| 110 | 2,493,004.834085292 | 0 | 114,618.265712794 | 310.551432191 | 1,729,173.602489589 | 2,378,076.016940307 | -648,902.414450718 | 27.2868% | **DISCREPANCY >1%** |
| 111 | 3,442,732.711521751 | 192,321.702770461 | 337,717.260844435 | 311.903836636 | 2,421,207.348894766 | 2,912,381.844070219 | -491,174.495175453 | 16.8650% | **DISCREPANCY >1%** |
| 112 | 1,865,800.736981223 | 173,200.851403845 | 85,660.90276259 | 313.726524764 | 858,535.424827937 | 1,606,625.256290024 | -748,089.831462087 | 46.5628% | **DISCREPANCY >1%** |
| 113 | 1,426,512.253958655 | 223,287.331033099 | 24,443.416711791 | 314.823730923 | 723,051.673206953 | 1,178,466.682482842 | -455,415.009275889 | 38.6447% | **DISCREPANCY >1%** |
| 114 | 1,394,632.422956434 | 54,534.060998196 | 206,414.843850019 | 314.31421114 | 818,971.595299437 | 1,133,369.203897079 | -314,397.608597642 | 27.7400% | **DISCREPANCY >1%** |
| 115 | 1,527,529.977031515 | 196,982.31937977 | 0 | 316.241311481 | 674,736.540831756 | 1,330,231.416340264 | -655,494.875508508 | 49.2767% | **DISCREPANCY >1%** |
| 116 | 498,360.033277975 | 129,797.29432009 | 46,438.331747847 | 316.098963475 | 322,456.895400295 | 321,808.308246563 | +648.587153732 | 0.2015% | OK |
| 117 | 1,577,424.159372488 | 0 | 110,042.604483153 | 318.659242813 | 1,182,843.699577966 | 1,467,062.895646522 | -284,219.196068556 | 19.3733% | **DISCREPANCY >1%** |
| 118 | 2,024,086.920306349 | 153,349.352006901 | 100,459.246518578 | 318.259844656 | 1,610,600.660779731 | 1,769,960.061936214 | -159,359.401156483 | 9.0035% | **DISCREPANCY >1%** |
| 119 | 1,493,373.518002894 | 127,462.331317651 | 0 | 320.161251178 | 720,015.01421028 | 1,365,591.025434065 | -645,576.011223785 | 47.2744% | **DISCREPANCY >1%** |
| 120 | 2,546,788.804051826 | 3,986.862247885 | 172,150.172216933 | 320.02867693 | 2,203,582.648794662 | 2,370,331.740910078 | -166,749.092115416 | 7.0348% | **DISCREPANCY >1%** |
| 121 | 2,766,684.954076083 | 211,264.855121109 | 0 | 321.990935497 | 1,535,311.697079252 | 2,555,098.108019477 | -1,019,786.410940225 | 39.9118% | **DISCREPANCY >1%** |
| 122 | 494,869.449887162 | 223,698.06146747 | 41,001.922983965 | 323.071585366 | 212,399.087082206 | 229,846.393850361 | -17,447.306768155 | 7.5908% | **DISCREPANCY >1%** |
| 123 | 1,850,392.345164228 | 117,012.394161995 | 40,622.003819962 | 324.767673671 | 1,545,775.281868314 | 1,692,433.1795086 | -146,657.897640286 | 8.6655% | **DISCREPANCY >1%** |
| 124 | 3,304,834.161523961 | 92,313.326894099 | 196,718.869959337 | 324.202246361 | 2,213,958.401766367 | 3,015,477.762424164 | -801,519.360657797 | 26.5801% | **DISCREPANCY >1%** |
| 125 | 2,325,859.430010415 | 223,698.068375433 | 7,964.547109056 | 326.897169487 | 1,109,743.523235324 | 2,093,869.917356439 | -984,126.394121115 | 47.0003% | **DISCREPANCY >1%** |
| 126 | 1,107,673.577479887 | 101,570.16062343 | 215,477.375953641 | 326.62312325 | 506,364.309783089 | 790,299.417779566 | -283,935.107996477 | 35.9275% | **DISCREPANCY >1%** |
| 127 | 2,802,857.648141101 | 201,728.715858691 | 45.025794905 | 328.321344019 | 1,653,334.165428989 | 2,600,755.585143486 | -947,421.419714497 | 36.4286% | **DISCREPANCY >1%** |
| 128 | 2,676,823.343533691 | 0 | 34,715.84016103 | 329.261683749 | 2,459,320.890947386 | 2,641,778.241688912 | -182,457.350741526 | 6.9066% | **DISCREPANCY >1%** |

## Discrepancies greater than 1%

| Phase | Netuid | AlphaOut α | Burned α | Protocol α | Pending α | Actual staked α | Calculated staked α | Δ α | Δ % | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| before | 1 | 2,484,437.267183304 | 165,036.45414469 | 17,184.489564018 | 15.812127616 | 1,659,802.136729299 | 2,302,200.51134698 | -642,398.374617681 | 27.9036% | **DISCREPANCY >1%** |
| before | 2 | 3,328,539.356043044 | 186,958.253739906 | 277.903743213 | 180.500851125 | 2,711,313.00299156 | 3,141,122.6977088 | -429,809.69471724 | 13.6833% | **DISCREPANCY >1%** |
| before | 3 | 2,802,710.832509362 | 0.468119708 | 164,521.426808318 | 180.126595318 | 2,078,448.8879906 | 2,638,008.810986018 | -559,559.922995418 | 21.2114% | **DISCREPANCY >1%** |
| before | 4 | 3,503,433.893284509 | 13,456.73137153 | 157,419.158585311 | 181.029751146 | 2,811,300.435005442 | 3,332,376.973576522 | -521,076.53857108 | 15.6367% | **DISCREPANCY >1%** |
| before | 5 | 2,998,780.476248441 | 209,823.537800336 | 3,606.576579616 | 182.281869897 | 1,525,624.786765432 | 2,785,168.079998592 | -1,259,543.29323316 | 45.2232% | **DISCREPANCY >1%** |
| before | 6 | 2,715,895.911458657 | 23,468.530961558 | 97,097.786802825 | 185.346869946 | 2,451,996.683773013 | 2,595,144.246824328 | -143,147.563051315 | 5.5159% | **DISCREPANCY >1%** |
| before | 8 | 3,034,766.606991034 | 170,998.084151705 | 68,575.325616404 | 185.086928483 | 2,204,088.317242778 | 2,795,008.110294442 | -590,919.793051664 | 21.1419% | **DISCREPANCY >1%** |
| before | 9 | 3,941,029.940133947 | 189,930.97794848 | 162,573.502071392 | 186.118320395 | 2,662,702.753243412 | 3,588,339.34179368 | -925,636.588550268 | 25.7956% | **DISCREPANCY >1%** |
| before | 10 | 3,118,109.600023772 | 223,846.079166223 | 3,919.775094447 | 187.688883095 | 2,413,820.773748008 | 2,890,156.056880007 | -476,335.283131999 | 16.4812% | **DISCREPANCY >1%** |
| before | 11 | 2,980,615.704211473 | 58,843.162874805 | 129,211.152773841 | 188.66133451 | 1,724,261.701431808 | 2,792,372.727228317 | -1,068,111.025796509 | 38.2510% | **DISCREPANCY >1%** |
| before | 12 | 3,360,255.048608388 | 222,508.114052081 | 0 | 190.292697983 | 1,856,786.281218517 | 3,137,556.641858324 | -1,280,770.360639807 | 40.8206% | **DISCREPANCY >1%** |
| before | 13 | 2,419,737.443340406 | 148,967.172896852 | 16,582.21426827 | 190.761479018 | 1,828,953.545731635 | 2,253,997.294696266 | -425,043.748964631 | 18.8573% | **DISCREPANCY >1%** |
| before | 14 | 3,059,212.25751119 | 220,189.208395156 | 129,813.067943654 | 191.278374922 | 1,767,865.10047261 | 2,709,018.702797458 | -941,153.602324848 | 34.7414% | **DISCREPANCY >1%** |
| before | 15 | 1,282,869.851056783 | 52,905.700586193 | 218,451.160515187 | 192.09621724 | 716,745.344324384 | 1,011,320.893738163 | -294,575.549413779 | 29.1278% | **DISCREPANCY >1%** |
| before | 16 | 292,259.056082386 | 106,491.578931276 | 9,125.331581653 | 194.08657149 | 219,971.692133916 | 176,448.058997967 | +43,523.633135949 | 24.6665% | **DISCREPANCY >1%** |
| before | 17 | 3,025,652.853906482 | 35,067.621313474 | 112,046.178772082 | 194.357595972 | 2,591,753.716854974 | 2,878,344.696224954 | -286,590.97936998 | 9.9567% | **DISCREPANCY >1%** |
| before | 18 | 3,221,528.3581729 | 82,212.573733221 | 184,937.037344576 | 431.502768751 | 2,728,012.390175507 | 2,953,947.244326352 | -225,934.854150845 | 7.6485% | **DISCREPANCY >1%** |
| before | 19 | 2,545,335.887198835 | 203,827.261478907 | 720.636473253 | 196.424919895 | 1,558,366.405120635 | 2,340,591.56432678 | -782,225.159206145 | 33.4199% | **DISCREPANCY >1%** |
| before | 20 | 3,151,582.118117668 | 223,846.079145155 | 0 | 198.646865471 | 1,852,324.660431886 | 2,927,537.392107042 | -1,075,212.731675156 | 36.7275% | **DISCREPANCY >1%** |
| before | 21 | 3,446,348.944539729 | 160,850.042236821 | 12,526.594993624 | 199.58337605 | 2,641,137.2895972 | 3,272,772.723933234 | -631,635.434336034 | 19.2997% | **DISCREPANCY >1%** |
| before | 22 | 3,424,695.078972077 | 161,827.727614681 | 8,538.815663423 | 200.742051093 | 2,253,922.90864158 | 3,254,127.79364288 | -1,000,204.8850013 | 30.7364% | **DISCREPANCY >1%** |
| before | 23 | 4,040,904.136284042 | 117,779.002762432 | 257,565.47245039 | 201.241550693 | 2,717,035.06015898 | 3,665,358.419520527 | -948,323.359361547 | 25.8725% | **DISCREPANCY >1%** |
| before | 24 | 3,641,697.385197894 | 75,925.654771513 | 113,298.120046902 | 202.496276097 | 2,964,647.656840732 | 3,452,271.114103382 | -487,623.45726265 | 14.1247% | **DISCREPANCY >1%** |
| before | 25 | 4,116,567.160734956 | 223,846.079136167 | 0 | 202.348350579 | 3,262,570.098652547 | 3,892,518.73324821 | -629,948.634595663 | 16.1835% | **DISCREPANCY >1%** |
| before | 26 | 776,681.346869401 | 73,459.26989387 | 16,231.463886896 | 203.885745799 | 673,306.86442606 | 686,786.727342836 | -13,479.862916776 | 1.9627% | **DISCREPANCY >1%** |
| before | 27 | 3,217,086.984189999 | 223,846.079203415 | 114.576078423 | 207.326060388 | 2,010,230.893396306 | 2,992,919.002847773 | -982,688.109451467 | 32.8337% | **DISCREPANCY >1%** |
| before | 28 | 4,652,641.765010104 | 176,806.130994487 | 146,403.169117868 | 205.210187164 | 3,144,789.333292944 | 4,329,227.254710585 | -1,184,437.921417641 | 27.3591% | **DISCREPANCY >1%** |
| before | 29 | 2,898,495.592659301 | 0 | 0 | 207.726660946 | 2,306,335.831049477 | 2,898,287.865998355 | -591,952.034948878 | 20.4241% | **DISCREPANCY >1%** |
| before | 30 | 3,382,576.048550954 | 223,846.079129087 | 22,914.692387486 | 208.461152388 | 2,667,110.572279116 | 3,135,606.815881993 | -468,496.243602877 | 14.9411% | **DISCREPANCY >1%** |
| before | 31 | 1,586,510.687500347 | 223,846.079187058 | 38,096.765184011 | 208.694922308 | 893,531.693731475 | 1,324,359.14820697 | -430,827.454475495 | 32.5310% | **DISCREPANCY >1%** |
| before | 33 | 2,301,829.983986493 | 89,682.65958267 | 87,386.672373635 | 211.090754805 | 1,649,218.144611554 | 2,124,549.561275383 | -475,331.416663829 | 22.3732% | **DISCREPANCY >1%** |
| before | 34 | 2,517,749.45856573 | 0 | 133,529.478234858 | 211.353990342 | 2,043,591.427143987 | 2,384,008.62634053 | -340,417.199196543 | 14.2791% | **DISCREPANCY >1%** |
| before | 35 | 2,988,529.927713479 | 0 | 95,598.20397956 | 214.133908803 | 2,644,675.94827133 | 2,892,717.589825116 | -248,041.641553786 | 8.5746% | **DISCREPANCY >1%** |
| before | 36 | 627,889.239072002 | 9,298.851890397 | 37,538.851627533 | 215.003480306 | 464,701.809419829 | 580,836.532073766 | -116,134.722653937 | 19.9943% | **DISCREPANCY >1%** |
| before | 37 | 3,572,554.215572503 | 223,846.079137807 | 0 | 215.373593959 | 2,381,932.136047951 | 3,348,492.762840737 | -966,560.626792786 | 28.8655% | **DISCREPANCY >1%** |
| before | 38 | 1,473,095.476578779 | 139,486.240803376 | 104,920.435178857 | 860.1015242 | 886,266.551300017 | 1,227,828.699072346 | -341,562.147772329 | 27.8183% | **DISCREPANCY >1%** |
| before | 39 | 3,166,433.553195886 | 172,663.511264212 | 29,373.416255258 | 216.78099811 | 1,695,429.468557074 | 2,964,179.844678306 | -1,268,750.376121232 | 42.8027% | **DISCREPANCY >1%** |
| before | 40 | 327,003.733918726 | 74,153.423804429 | 128,034.305600759 | 217.517385175 | 176,741.448835177 | 124,598.487128363 | +52,142.961706814 | 41.8487% | **DISCREPANCY >1%** |
| before | 41 | 2,975,171.611654056 | 204,063.185350324 | 217,217.580368984 | 218.976763393 | 1,802,863.651482052 | 2,553,671.869171355 | -750,808.217689303 | 29.4011% | **DISCREPANCY >1%** |
| before | 42 | 2,595,041.142096049 | 223,846.079158774 | 0 | 220.919954602 | 2,183,122.943907032 | 2,370,974.142982673 | -187,851.199075641 | 7.9229% | **DISCREPANCY >1%** |
| before | 43 | 3,052,785.884567396 | 179,562.708609502 | 418.387877525 | 221.016150183 | 2,212,435.691834392 | 2,872,583.771930186 | -660,148.080095794 | 22.9809% | **DISCREPANCY >1%** |
| before | 44 | 4,012,380.426367737 | 82,938.546710406 | 126,795.347709685 | 221.029336228 | 3,398,459.104068 | 3,802,425.502611418 | -403,966.398543418 | 10.6239% | **DISCREPANCY >1%** |
| before | 45 | 3,011,750.442172559 | 186,957.988153914 | 0 | 224.877745721 | 2,008,703.116929344 | 2,824,567.576272924 | -815,864.45934358 | 28.8845% | **DISCREPANCY >1%** |
| before | 46 | 3,510,716.597918791 | 140,033.673137159 | 93,394.806384354 | 224.017693828 | 2,515,548.15997582 | 3,277,064.10070345 | -761,515.94072763 | 23.2377% | **DISCREPANCY >1%** |
| before | 47 | 1,295,527.895427735 | 221,936.771527767 | 22,924.082606544 | 225.661885453 | 687,673.465762526 | 1,050,441.379407971 | -362,767.913645445 | 34.5348% | **DISCREPANCY >1%** |
| before | 48 | 3,107,533.04985937 | 0 | 101,664.859193657 | 226.700853051 | 2,328,846.687272452 | 3,005,641.489812662 | -676,794.80254021 | 22.5174% | **DISCREPANCY >1%** |
| before | 49 | 2,017,874.54242826 | 120,325.749958529 | 164,459.367635194 | 226.470969136 | 1,164,300.147403006 | 1,732,862.953865401 | -568,562.806462395 | 32.8106% | **DISCREPANCY >1%** |
| before | 50 | 3,236,913.049890369 | 84,285.185243783 | 40,263.969667629 | 227.870419958 | 2,747,775.456897652 | 3,112,136.024558999 | -364,360.567661347 | 11.7077% | **DISCREPANCY >1%** |
| before | 51 | 3,694,848.506486485 | 105,922.936515629 | 153,207.038998376 | 228.014881514 | 2,389,201.875098131 | 3,435,490.516090966 | -1,046,288.640992835 | 30.4552% | **DISCREPANCY >1%** |
| before | 52 | 2,952,115.070821844 | 223,846.079128825 | 90.395967424 | 229.761205219 | 1,893,408.234763284 | 2,727,948.834520376 | -834,540.599757092 | 30.5922% | **DISCREPANCY >1%** |
| before | 53 | 4,587,458.791415818 | 165,100.951333266 | 83,439.89504252 | 230.141069494 | 4,002,412.306866003 | 4,338,687.803970538 | -336,275.497104535 | 7.7506% | **DISCREPANCY >1%** |
| before | 54 | 3,774,204.691772849 | 104,605.505486405 | 43,761.132345373 | 232.262086156 | 3,186,263.949667802 | 3,625,605.791854915 | -439,341.842187113 | 12.1177% | **DISCREPANCY >1%** |
| before | 55 | 2,799,335.289393601 | 9,506.992017657 | 94,545.881062638 | 234.134605081 | 2,407,570.599805009 | 2,695,048.281708225 | -287,477.681903216 | 10.6668% | **DISCREPANCY >1%** |
| before | 56 | 2,646,404.264136623 | 147,253.342830014 | 13,997.922202342 | 233.282503575 | 1,876,658.38095267 | 2,484,919.716600692 | -608,261.335648022 | 24.4781% | **DISCREPANCY >1%** |
| before | 57 | 825,775.111178675 | 223,846.079159495 | 70,615.680938887 | 234.648963669 | 442,264.988899287 | 531,078.702116624 | -88,813.713217337 | 16.7232% | **DISCREPANCY >1%** |
| before | 58 | 297,301.290570974 | 161,966.767161337 | 0 | 85.22314421 | 228,682.61780516 | 135,249.300265427 | +93,433.317539733 | 69.0822% | **DISCREPANCY >1%** |
| before | 59 | 3,193,731.959417721 | 71,891.198873536 | 122,883.114116497 | 239.495433095 | 2,648,586.34800194 | 2,998,718.150994593 | -350,131.802992653 | 11.6760% | **DISCREPANCY >1%** |
| before | 60 | 3,738,936.573624944 | 121,459.892472139 | 40,528.882878666 | 238.011153447 | 3,088,309.198855045 | 3,576,709.787120692 | -488,400.588265647 | 13.6550% | **DISCREPANCY >1%** |
| before | 61 | 4,368,652.001297523 | 113,406.497793948 | 81,352.28253849 | 238.599154608 | 3,497,985.843054945 | 4,173,654.621810477 | -675,668.778755532 | 16.1889% | **DISCREPANCY >1%** |
| before | 62 | 2,639,382.622065521 | 1,029.291966503 | 43,106.60780272 | 239.315194526 | 2,431,187.062364878 | 2,595,007.407101772 | -163,820.344736894 | 6.3129% | **DISCREPANCY >1%** |
| before | 63 | 3,817,263.993110186 | 0 | 147,125.064841795 | 240.616747337 | 2,963,791.083203702 | 3,669,898.311521054 | -706,107.228317352 | 19.2405% | **DISCREPANCY >1%** |
| before | 64 | 3,340,774.269906866 | 44,721.605785854 | 166,756.910890331 | 241.06376794 | 2,925,100.024232174 | 3,129,054.689462741 | -203,954.665230567 | 6.5180% | **DISCREPANCY >1%** |
| before | 65 | 3,223,185.02667184 | 204,139.305947923 | 71.722624687 | 244.953625561 | 2,290,879.611105601 | 3,018,729.044473669 | -727,849.433368068 | 24.1111% | **DISCREPANCY >1%** |
| before | 66 | 3,355,565.767963545 | 58,498.893235066 | 83,262.913449555 | 244.876365662 | 2,399,574.013147158 | 3,213,559.084913262 | -813,985.071766104 | 25.3297% | **DISCREPANCY >1%** |
| before | 67 | 818,233.005618122 | 94,182.859728691 | 132,264.88633962 | 244.548133063 | 415,753.341684633 | 591,540.711416748 | -175,787.369732115 | 29.7168% | **DISCREPANCY >1%** |
| before | 68 | 3,606,519.578980255 | 51,820.059551198 | 169,952.893747578 | 245.156427258 | 2,757,678.262310717 | 3,384,501.469254221 | -626,823.206943504 | 18.5203% | **DISCREPANCY >1%** |
| before | 69 | 1,127,755.983729383 | 223,846.079187092 | 59,604.102841208 | 246.154576631 | 789,692.225967185 | 844,059.647124452 | -54,367.421157267 | 6.4411% | **DISCREPANCY >1%** |
| before | 71 | 4,185,120.677766843 | 96,876.088940082 | 85,705.37638208 | 249.451983437 | 3,225,073.636749908 | 4,002,289.760461244 | -777,216.123711336 | 19.4192% | **DISCREPANCY >1%** |
| before | 72 | 2,486,803.251902087 | 221,779.667597505 | 0 | 250.603932762 | 2,105,694.740466461 | 2,264,772.98037182 | -159,078.239905359 | 7.0240% | **DISCREPANCY >1%** |
| before | 73 | 3,280,380.920420528 | 223,846.079132607 | 0 | 251.105893965 | 1,813,676.942884909 | 3,056,283.735393956 | -1,242,606.792509047 | 40.6574% | **DISCREPANCY >1%** |
| before | 74 | 3,335,921.259227667 | 0 | 94,292.343237338 | 252.356012684 | 2,712,295.874311409 | 3,241,376.559977645 | -529,080.685666236 | 16.3227% | **DISCREPANCY >1%** |
| before | 75 | 3,508,568.481457029 | 203,423.332505008 | 16,900.822302978 | 252.228181405 | 2,709,395.891317406 | 3,287,992.098467638 | -578,596.207150232 | 17.5972% | **DISCREPANCY >1%** |
| before | 76 | 1,014,680.381470641 | 179,713.432857498 | 4,053.056546057 | 254.707430113 | 539,215.189087256 | 830,659.184636973 | -291,443.995549717 | 35.0858% | **DISCREPANCY >1%** |
| before | 77 | 3,211,839.798076511 | 0 | 560,753.334406754 | 254.999075623 | 2,512,507.442349621 | 2,650,831.464594134 | -138,324.022244513 | 5.2181% | **DISCREPANCY >1%** |
| before | 78 | 650,047.486811965 | 6,499.356268383 | 93,439.420139376 | 256.779702547 | 497,791.007489218 | 549,851.930701659 | -52,060.923212441 | 9.4681% | **DISCREPANCY >1%** |
| before | 79 | 3,522,185.175371893 | 63,794.223490279 | 150,693.514097077 | 256.600830652 | 2,929,780.461334615 | 3,307,440.836953885 | -377,660.37561927 | 11.4185% | **DISCREPANCY >1%** |
| before | 80 | 1,805,807.602432742 | 144,923.552045991 | 42,374.70227022 | 257.09083153 | 1,575,661.087864241 | 1,618,252.257285001 | -42,591.16942076 | 2.6319% | **DISCREPANCY >1%** |
| before | 81 | 2,604,356.131084093 | 20,523.249052955 | 112,249.98027876 | 258.414012877 | 1,643,122.255968379 | 2,471,324.487739501 | -828,202.231771122 | 33.5124% | **DISCREPANCY >1%** |
| before | 82 | 637,044.829536987 | 1,033.20576559 | 203,656.438410755 | 259.745850219 | 387,646.14878236 | 432,095.439510423 | -44,449.290728063 | 10.2869% | **DISCREPANCY >1%** |
| before | 83 | 2,655,168.094539082 | 0 | 208,332.711813588 | 260.256934012 | 2,105,495.312152469 | 2,446,575.125791482 | -341,079.813639013 | 13.9411% | **DISCREPANCY >1%** |
| before | 84 | 573,302.241545722 | 4,045.485421068 | 25,365.155475257 | 260.999999439 | 499,568.25457856 | 543,630.600649958 | -44,062.346071398 | 8.1051% | **DISCREPANCY >1%** |
| before | 85 | 2,507,845.254188665 | 101,240.455860461 | 63,690.414418671 | 263.014358235 | 1,950,373.413274667 | 2,342,651.369551298 | -392,277.956276631 | 16.7450% | **DISCREPANCY >1%** |
| before | 87 | 1,507,270.581541561 | 223,698.068303363 | 51,054.043826615 | 265.166257826 | 811,937.38714958 | 1,232,253.303153757 | -420,315.916004177 | 34.1095% | **DISCREPANCY >1%** |
| before | 88 | 3,458,036.281203651 | 42,432.314973574 | 95,635.011722251 | 265.870198715 | 3,189,628.068539638 | 3,319,703.084309111 | -130,075.015769473 | 3.9182% | **DISCREPANCY >1%** |
| before | 89 | 2,763,940.852090179 | 184,424.496583798 | 187,748.849811315 | 267.32822308 | 1,978,297.520002656 | 2,391,500.177471986 | -413,202.65746933 | 17.2779% | **DISCREPANCY >1%** |
| before | 90 | 140,127.393099798 | 116,392.269522858 | 0 | 104.032188435 | 140,001.653399788 | 23,631.091388505 | +116,370.562011283 | 492.4468% | **DISCREPANCY >1%** |
| before | 91 | 993,462.631269244 | 160,524.915777216 | 55,172.894789013 | 268.197144647 | 543,685.801296443 | 777,496.623558368 | -233,810.822261925 | 30.0722% | **DISCREPANCY >1%** |
| before | 93 | 3,180,215.51933591 | 181,921.200099591 | 10,630.11569139 | 270.306172509 | 2,086,451.787267245 | 2,987,393.89737242 | -900,942.110105175 | 30.1581% | **DISCREPANCY >1%** |
| before | 94 | 1,582,842.5781042 | 216,580.400930509 | 6,977.120150346 | 272.371739533 | 901,263.328629545 | 1,359,012.685283812 | -457,749.356654267 | 33.6824% | **DISCREPANCY >1%** |
| before | 95 | 2,823,508.04876599 | 223,698.068303101 | 92,584.118277643 | 272.028885632 | 1,759,219.58729414 | 2,506,953.833299614 | -747,734.246005474 | 29.8264% | **DISCREPANCY >1%** |
| before | 96 | 672,938.803045531 | 130,829.78226522 | 67,499.464576751 | 273.313063513 | 387,490.176423779 | 474,336.243140047 | -86,846.066716268 | 18.3089% | **DISCREPANCY >1%** |
| before | 97 | 941,708.525040323 | 24,305.834427164 | 251,260.057860047 | 274.06514191 | 624,754.286624672 | 665,868.567611202 | -41,114.28098653 | 6.1745% | **DISCREPANCY >1%** |
| before | 98 | 2,790,278.348044368 | 176,154.008844017 | 0 | 276.435730657 | 1,537,507.711157861 | 2,613,847.903469694 | -1,076,340.192311833 | 41.1783% | **DISCREPANCY >1%** |
| before | 100 | 1,799,804.095590657 | 201,831.869356847 | 8,577.774654887 | 277.477567732 | 1,136,482.892106863 | 1,589,116.974011191 | -452,634.081904328 | 28.4833% | **DISCREPANCY >1%** |
| before | 101 | 2,301,519.793430326 | 96,709.729814995 | 147,162.212142243 | 278.978266727 | 1,352,453.090541984 | 2,057,368.873206361 | -704,915.782664377 | 34.2629% | **DISCREPANCY >1%** |
| before | 102 | 843,154.314854854 | 50,526.561897738 | 158,995.005398752 | 279.295649394 | 571,127.582889633 | 633,353.45190897 | -62,225.869019337 | 9.8248% | **DISCREPANCY >1%** |
| before | 104 | 3,062,978.342942101 | 0 | 8,693.224149186 | 281.763791087 | 2,725,130.208756965 | 3,054,003.355001828 | -328,873.146244863 | 10.7685% | **DISCREPANCY >1%** |
| before | 105 | 1,922,189.427280623 | 24,337.695348448 | 196,110.586646038 | 282.242109137 | 1,278,846.154813373 | 1,701,458.903177 | -422,612.748363627 | 24.8382% | **DISCREPANCY >1%** |
| before | 106 | 2,376,996.760564706 | 144,209.176940372 | 53,273.846844962 | 284.301424871 | 1,487,849.779485208 | 2,179,229.435354501 | -691,379.655869293 | 31.7258% | **DISCREPANCY >1%** |
| before | 107 | 1,412,323.086452273 | 75,002.822267192 | 259,170.72147602 | 284.014369462 | 768,379.69328733 | 1,077,865.528339599 | -309,485.835052269 | 28.7128% | **DISCREPANCY >1%** |
| before | 108 | 1,530,530.515126298 | 44,888.690492425 | 38,862.313667517 | 286.752965229 | 1,054,527.794798477 | 1,446,492.758001127 | -391,964.96320265 | 27.0976% | **DISCREPANCY >1%** |
| before | 109 | 1,408,935.281801709 | 223,698.068310612 | 70,026.821602108 | 287.413033366 | 715,168.920824128 | 1,114,922.978855623 | -399,754.058031495 | 35.8548% | **DISCREPANCY >1%** |
| before | 110 | 2,492,979.820435386 | 0 | 114,616.252062888 | 287.551432239 | 1,729,173.602489589 | 2,378,076.016940259 | -648,902.41445067 | 27.2868% | **DISCREPANCY >1%** |
| before | 111 | 3,442,709.711521751 | 192,321.702770461 | 337,717.260844435 | 288.903836685 | 2,421,207.348894766 | 2,912,381.84407017 | -491,174.495175404 | 16.8650% | **DISCREPANCY >1%** |
| before | 112 | 1,865,777.736981223 | 173,200.851403845 | 85,660.90276259 | 290.726524813 | 858,535.424827937 | 1,606,625.256289975 | -748,089.831462038 | 46.5628% | **DISCREPANCY >1%** |
| before | 113 | 1,426,489.253958655 | 223,287.331033099 | 24,443.416711791 | 291.823730971 | 723,051.673206953 | 1,178,466.682482794 | -455,415.009275841 | 38.6447% | **DISCREPANCY >1%** |
| before | 114 | 1,394,604.402315899 | 54,534.060998196 | 206,409.823209484 | 291.31421119 | 818,971.595299437 | 1,133,369.203897029 | -314,397.608597592 | 27.7400% | **DISCREPANCY >1%** |
| before | 115 | 1,527,506.977031515 | 196,982.31937977 | 0 | 293.24131153 | 674,736.540831756 | 1,330,231.416340215 | -655,494.875508459 | 49.2767% | **DISCREPANCY >1%** |
| before | 117 | 1,577,401.159372488 | 0 | 110,042.604483153 | 295.659242863 | 1,182,843.699577966 | 1,467,062.895646472 | -284,219.196068506 | 19.3733% | **DISCREPANCY >1%** |
| before | 118 | 2,024,063.920306349 | 153,349.352006901 | 100,459.246518578 | 295.259844704 | 1,610,600.660779731 | 1,769,960.061936166 | -159,359.401156435 | 9.0035% | **DISCREPANCY >1%** |
| before | 119 | 1,493,350.518002894 | 127,462.331317651 | 0 | 297.161251227 | 720,015.01421028 | 1,365,591.025434016 | -645,576.011223736 | 47.2744% | **DISCREPANCY >1%** |
| before | 120 | 2,546,753.900214508 | 3,986.862247885 | 172,138.268379615 | 297.02867698 | 2,203,582.648794662 | 2,370,331.740910028 | -166,749.092115366 | 7.0348% | **DISCREPANCY >1%** |
| before | 121 | 2,766,661.954076083 | 211,264.855121109 | 0 | 298.990935544 | 1,535,311.697079252 | 2,555,098.10801943 | -1,019,786.410940178 | 39.9118% | **DISCREPANCY >1%** |
| before | 122 | 494,846.449887162 | 223,698.06146747 | 41,001.922983965 | 300.071585414 | 212,399.087082206 | 229,846.393850313 | -17,447.306768107 | 7.5908% | **DISCREPANCY >1%** |
| before | 123 | 1,850,369.345164228 | 117,012.394161995 | 40,622.003819962 | 301.954694218 | 1,545,775.094847816 | 1,692,432.992488053 | -146,657.897640237 | 8.6655% | **DISCREPANCY >1%** |
| before | 124 | 3,304,803.536251671 | 92,313.326894099 | 196,711.244687047 | 301.202246409 | 2,213,958.401766367 | 3,015,477.762424116 | -801,519.360657749 | 26.5801% | **DISCREPANCY >1%** |
| before | 125 | 2,325,836.430010415 | 223,698.068375433 | 7,964.547109056 | 303.897169539 | 1,109,743.523235324 | 2,093,869.917356387 | -984,126.394121063 | 47.0003% | **DISCREPANCY >1%** |
| before | 126 | 1,107,650.577479887 | 101,570.16062343 | 215,477.375953641 | 303.623123299 | 506,364.309783089 | 790,299.417779517 | -283,935.107996428 | 35.9275% | **DISCREPANCY >1%** |
| before | 127 | 2,802,834.648141101 | 201,728.715858691 | 45.025794905 | 305.321344069 | 1,653,334.165428989 | 2,600,755.585143436 | -947,421.419714447 | 36.4286% | **DISCREPANCY >1%** |
| before | 128 | 2,676,800.343533691 | 0 | 34,715.84016103 | 306.261683797 | 2,459,320.890947386 | 2,641,778.241688864 | -182,457.350741478 | 6.9066% | **DISCREPANCY >1%** |
| after | 1 | 2,484,460.267183304 | 165,036.45414469 | 17,184.489564018 | 36.422151081 | 1,659,804.526705788 | 2,302,202.901323515 | -642,398.374617727 | 27.9036% | **DISCREPANCY >1%** |
| after | 2 | 3,328,562.356043044 | 186,958.253739906 | 277.903743213 | 203.500851075 | 2,711,313.00299156 | 3,141,122.69770885 | -429,809.69471729 | 13.6833% | **DISCREPANCY >1%** |
| after | 3 | 2,802,746.580254244 | 0.468119708 | 164,534.1745532 | 203.126595269 | 2,078,448.8879906 | 2,638,008.810986067 | -559,559.922995467 | 21.2114% | **DISCREPANCY >1%** |
| after | 4 | 3,503,468.886675974 | 13,456.73137153 | 157,431.151976776 | 204.029751097 | 2,811,300.435005442 | 3,332,376.973576571 | -521,076.538571129 | 15.6367% | **DISCREPANCY >1%** |
| after | 5 | 2,998,805.142923303 | 209,823.537800336 | 3,608.243254478 | 205.281869849 | 1,525,624.786765432 | 2,785,168.07999864 | -1,259,543.293233208 | 45.2232% | **DISCREPANCY >1%** |
| after | 6 | 2,715,918.911458657 | 23,468.530961558 | 97,097.786802825 | 208.346869898 | 2,451,996.683773013 | 2,595,144.246824376 | -143,147.563051363 | 5.5159% | **DISCREPANCY >1%** |
| after | 8 | 3,034,802.425875871 | 170,998.084151705 | 68,588.144501241 | 208.086928434 | 2,204,088.317242778 | 2,795,008.110294491 | -590,919.793051713 | 21.1419% | **DISCREPANCY >1%** |
| after | 9 | 3,941,057.201684353 | 189,930.97794848 | 162,577.763621798 | 209.118320342 | 2,662,702.753243412 | 3,588,339.341793733 | -925,636.588550321 | 25.7956% | **DISCREPANCY >1%** |
| after | 10 | 3,118,132.600023772 | 223,846.079166223 | 3,919.775094447 | 210.688883049 | 2,413,820.773748008 | 2,890,156.056880053 | -476,335.283132045 | 16.4812% | **DISCREPANCY >1%** |
| after | 11 | 2,980,643.186006633 | 58,843.162874805 | 129,215.634569001 | 211.661334459 | 1,724,261.701431808 | 2,792,372.727228368 | -1,068,111.02579656 | 38.2510% | **DISCREPANCY >1%** |
| after | 12 | 3,360,278.048608388 | 222,508.114052081 | 0 | 213.292697933 | 1,856,786.281218517 | 3,137,556.641858374 | -1,280,770.360639857 | 40.8206% | **DISCREPANCY >1%** |
| after | 13 | 2,419,760.443340406 | 148,967.172896852 | 16,582.21426827 | 213.761478968 | 1,828,953.545731635 | 2,253,997.294696316 | -425,043.748964681 | 18.8573% | **DISCREPANCY >1%** |
| after | 14 | 3,059,235.25751119 | 220,189.208395156 | 129,813.067943654 | 214.278374873 | 1,767,865.10047261 | 2,709,018.702797507 | -941,153.602324897 | 34.7414% | **DISCREPANCY >1%** |
| after | 15 | 1,282,901.081825716 | 52,905.700586193 | 218,459.39128412 | 215.096217191 | 716,745.344324384 | 1,011,320.893738212 | -294,575.549413828 | 29.1278% | **DISCREPANCY >1%** |
| after | 16 | 292,282.056082386 | 106,491.578931276 | 9,125.331581653 | 217.086571442 | 219,971.692133916 | 176,448.058998015 | +43,523.633135901 | 24.6665% | **DISCREPANCY >1%** |
| after | 17 | 3,025,683.926089646 | 35,067.621313474 | 112,054.250955246 | 217.357595922 | 2,591,753.716854974 | 2,878,344.696225004 | -286,590.97937003 | 9.9567% | **DISCREPANCY >1%** |
| after | 18 | 3,221,551.3581729 | 82,212.573733221 | 184,937.037344576 | 454.502768702 | 2,728,012.390175507 | 2,953,947.244326401 | -225,934.854150894 | 7.6485% | **DISCREPANCY >1%** |
| after | 19 | 2,545,359.397668625 | 203,827.261478907 | 721.146943043 | 219.424919845 | 1,558,366.405120635 | 2,340,591.56432683 | -782,225.159206195 | 33.4199% | **DISCREPANCY >1%** |
| after | 20 | 3,151,605.118117668 | 223,846.079145155 | 0 | 221.646865422 | 1,852,324.660431886 | 2,927,537.392107091 | -1,075,212.731675205 | 36.7275% | **DISCREPANCY >1%** |
| after | 21 | 3,446,371.944539729 | 160,850.042236821 | 12,526.594993624 | 222.583376001 | 2,641,137.2895972 | 3,272,772.723933283 | -631,635.434336083 | 19.2997% | **DISCREPANCY >1%** |
| after | 22 | 3,424,718.078972077 | 161,827.727614681 | 8,538.815663423 | 223.742051045 | 2,253,922.90864158 | 3,254,127.793642928 | -1,000,204.885001348 | 30.7364% | **DISCREPANCY >1%** |
| after | 23 | 4,040,927.136284042 | 117,779.002762432 | 257,565.47245039 | 224.241550645 | 2,717,035.06015898 | 3,665,358.419520575 | -948,323.359361595 | 25.8725% | **DISCREPANCY >1%** |
| after | 24 | 3,641,720.385197894 | 75,925.654771513 | 113,298.120046902 | 225.496276048 | 2,964,647.656840732 | 3,452,271.114103431 | -487,623.457262699 | 14.1247% | **DISCREPANCY >1%** |
| after | 25 | 4,116,590.160734956 | 223,846.079136167 | 0 | 225.348350531 | 3,262,570.098652547 | 3,892,518.733248258 | -629,948.634595711 | 16.1835% | **DISCREPANCY >1%** |
| after | 26 | 776,704.346869401 | 73,459.26989387 | 16,231.463886896 | 226.885745751 | 673,306.86442606 | 686,786.727342884 | -13,479.862916824 | 1.9627% | **DISCREPANCY >1%** |
| after | 27 | 3,217,109.984189999 | 223,846.079203415 | 114.576078423 | 230.326060336 | 2,010,230.893396306 | 2,992,919.002847825 | -982,688.109451519 | 32.8337% | **DISCREPANCY >1%** |
| after | 28 | 4,652,673.585894858 | 176,806.130994487 | 146,411.990002622 | 228.210187113 | 3,144,789.333292944 | 4,329,227.254710636 | -1,184,437.921417692 | 27.3591% | **DISCREPANCY >1%** |
| after | 29 | 2,898,518.592659301 | 0 | 0 | 230.726660897 | 2,306,335.831049477 | 2,898,287.865998404 | -591,952.034948927 | 20.4241% | **DISCREPANCY >1%** |
| after | 30 | 3,382,599.048550954 | 223,846.079129087 | 22,914.692387486 | 231.461152337 | 2,667,110.572279116 | 3,135,606.815882044 | -468,496.243602928 | 14.9411% | **DISCREPANCY >1%** |
| after | 31 | 1,586,533.687500347 | 223,846.079187058 | 38,096.765184011 | 231.694922258 | 893,531.693731475 | 1,324,359.14820702 | -430,827.454475545 | 32.5310% | **DISCREPANCY >1%** |
| after | 33 | 2,301,854.409582412 | 89,682.65958267 | 87,388.097969554 | 234.090754756 | 1,649,218.144611554 | 2,124,549.561275432 | -475,331.416663878 | 22.3732% | **DISCREPANCY >1%** |
| after | 34 | 2,517,782.310726575 | 0 | 133,539.330395703 | 234.353990294 | 2,043,591.427143987 | 2,384,008.626340578 | -340,417.199196591 | 14.2791% | **DISCREPANCY >1%** |
| after | 35 | 2,988,552.927713479 | 0 | 95,598.20397956 | 237.133908755 | 2,644,675.94827133 | 2,892,717.589825164 | -248,041.641553834 | 8.5746% | **DISCREPANCY >1%** |
| after | 36 | 627,912.239072002 | 9,298.851890397 | 37,538.851627533 | 238.00348026 | 464,701.809419829 | 580,836.532073812 | -116,134.722653983 | 19.9943% | **DISCREPANCY >1%** |
| after | 37 | 3,572,577.215572503 | 223,846.079137807 | 0 | 238.37359391 | 2,381,932.136047951 | 3,348,492.762840786 | -966,560.626792835 | 28.8655% | **DISCREPANCY >1%** |
| after | 38 | 1,473,123.675090702 | 139,486.240803376 | 104,925.63369078 | 883.101524151 | 886,266.551300017 | 1,227,828.699072395 | -341,562.147772378 | 27.8183% | **DISCREPANCY >1%** |
| after | 39 | 3,166,456.553195886 | 172,663.511264212 | 29,373.416255258 | 239.780998064 | 1,695,429.468557074 | 2,964,179.844678352 | -1,268,750.376121278 | 42.8027% | **DISCREPANCY >1%** |
| after | 40 | 327,026.733918726 | 74,153.423804429 | 128,034.305600759 | 240.517385125 | 176,741.448835177 | 124,598.487128413 | +52,142.961706764 | 41.8487% | **DISCREPANCY >1%** |
| after | 41 | 2,975,194.611654056 | 204,063.185350324 | 217,217.580368984 | 241.976763343 | 1,802,863.651482052 | 2,553,671.869171405 | -750,808.217689353 | 29.4011% | **DISCREPANCY >1%** |
| after | 42 | 2,595,064.142096049 | 223,846.079158774 | 0 | 243.919954553 | 2,183,122.943907032 | 2,370,974.142982722 | -187,851.19907569 | 7.9229% | **DISCREPANCY >1%** |
| after | 43 | 3,052,808.884567396 | 179,562.708609502 | 418.387877525 | 244.016150134 | 2,212,435.691834392 | 2,872,583.771930235 | -660,148.080095843 | 22.9809% | **DISCREPANCY >1%** |
| after | 44 | 4,012,416.368749828 | 82,938.546710406 | 126,808.290091776 | 244.02933618 | 3,398,459.104068 | 3,802,425.502611466 | -403,966.398543466 | 10.6239% | **DISCREPANCY >1%** |
| after | 45 | 3,011,773.442172559 | 186,957.988153914 | 0 | 247.877745673 | 2,008,703.116929344 | 2,824,567.576272972 | -815,864.459343628 | 28.8845% | **DISCREPANCY >1%** |
| after | 46 | 3,510,739.597918791 | 140,033.673137159 | 93,394.806384354 | 247.017693776 | 2,515,548.15997582 | 3,277,064.100703502 | -761,515.940727682 | 23.2377% | **DISCREPANCY >1%** |
| after | 47 | 1,295,550.895427735 | 221,936.771527767 | 22,924.082606544 | 248.661885404 | 687,673.465762526 | 1,050,441.37940802 | -362,767.913645494 | 34.5348% | **DISCREPANCY >1%** |
| after | 48 | 3,107,556.04985937 | 0 | 101,664.859193657 | 249.700853002 | 2,328,846.687272452 | 3,005,641.489812711 | -676,794.802540259 | 22.5174% | **DISCREPANCY >1%** |
| after | 49 | 2,017,898.603353698 | 120,325.749958529 | 164,460.428560632 | 249.470969087 | 1,164,300.147403006 | 1,732,862.95386545 | -568,562.806462444 | 32.8106% | **DISCREPANCY >1%** |
| after | 50 | 3,236,936.049890369 | 84,285.185243783 | 40,263.969667629 | 250.870419909 | 2,747,775.456897652 | 3,112,136.024559048 | -364,360.567661396 | 11.7077% | **DISCREPANCY >1%** |
| after | 51 | 3,694,884.449632193 | 105,922.936515629 | 153,219.982144084 | 251.014881466 | 2,389,201.875098131 | 3,435,490.516091014 | -1,046,288.640992883 | 30.4552% | **DISCREPANCY >1%** |
| after | 52 | 2,952,138.070821844 | 223,846.079128825 | 90.395967424 | 252.761205172 | 1,893,408.234763284 | 2,727,948.834520423 | -834,540.599757139 | 30.5922% | **DISCREPANCY >1%** |
| after | 53 | 4,587,494.90797009 | 165,100.951333266 | 83,453.011596792 | 253.141069445 | 4,002,412.306866003 | 4,338,687.803970587 | -336,275.497104584 | 7.7506% | **DISCREPANCY >1%** |
| after | 54 | 3,774,227.691772849 | 104,605.505486405 | 43,761.132345373 | 255.262086104 | 3,186,263.949667802 | 3,625,605.791854967 | -439,341.842187165 | 12.1177% | **DISCREPANCY >1%** |
| after | 55 | 2,799,358.289393601 | 9,506.992017657 | 94,545.881062638 | 257.134605034 | 2,407,570.599805009 | 2,695,048.281708272 | -287,477.681903263 | 10.6668% | **DISCREPANCY >1%** |
| after | 56 | 2,646,427.264136623 | 147,253.342830014 | 13,997.922202342 | 256.282503523 | 1,876,658.38095267 | 2,484,919.716600744 | -608,261.335648074 | 24.4781% | **DISCREPANCY >1%** |
| after | 57 | 825,798.111178675 | 223,846.079159495 | 70,615.680938887 | 257.648963622 | 442,264.988899287 | 531,078.702116671 | -88,813.713217384 | 16.7232% | **DISCREPANCY >1%** |
| after | 58 | 297,324.290570974 | 161,966.767161337 | 0 | 108.223144162 | 228,682.61780516 | 135,249.300265475 | +93,433.317539685 | 69.0822% | **DISCREPANCY >1%** |
| after | 59 | 3,193,754.959417721 | 71,891.198873536 | 122,883.114116497 | 262.495433049 | 2,648,586.34800194 | 2,998,718.150994639 | -350,131.802992699 | 11.6760% | **DISCREPANCY >1%** |
| after | 60 | 3,738,959.573624944 | 121,459.892472139 | 40,528.882878666 | 261.011153397 | 3,088,309.198855045 | 3,576,709.787120742 | -488,400.588265697 | 13.6550% | **DISCREPANCY >1%** |
| after | 61 | 4,368,681.662284035 | 113,406.497793948 | 81,358.943525002 | 261.599154562 | 3,497,985.843054945 | 4,173,654.621810523 | -675,668.778755578 | 16.1889% | **DISCREPANCY >1%** |
| after | 62 | 2,639,412.48357569 | 1,029.291966503 | 43,113.469312889 | 262.315194477 | 2,431,187.062364878 | 2,595,007.407101821 | -163,820.344736943 | 6.3129% | **DISCREPANCY >1%** |
| after | 63 | 3,817,293.062758347 | 0 | 147,131.134489956 | 263.616747289 | 2,963,791.083203702 | 3,669,898.311521102 | -706,107.2283174 | 19.2405% | **DISCREPANCY >1%** |
| after | 64 | 3,340,810.394682426 | 44,721.605785854 | 166,770.035665891 | 264.063767891 | 2,925,100.024232174 | 3,129,054.68946279 | -203,954.665230616 | 6.5180% | **DISCREPANCY >1%** |
| after | 65 | 3,223,208.02667184 | 204,139.305947923 | 71.722624687 | 267.95362551 | 2,290,879.611105601 | 3,018,729.04447372 | -727,849.433368119 | 24.1111% | **DISCREPANCY >1%** |
| after | 66 | 3,355,588.767963545 | 58,498.893235066 | 83,262.913449555 | 267.876365614 | 2,399,574.013147158 | 3,213,559.08491331 | -813,985.071766152 | 25.3297% | **DISCREPANCY >1%** |
| after | 67 | 818,256.005618122 | 94,182.859728691 | 132,264.88633962 | 267.548133013 | 415,753.341684633 | 591,540.711416798 | -175,787.369732165 | 29.7168% | **DISCREPANCY >1%** |
| after | 68 | 3,606,555.110567528 | 51,820.059551198 | 169,965.425334851 | 268.156427209 | 2,757,678.262310717 | 3,384,501.46925427 | -626,823.206943553 | 18.5203% | **DISCREPANCY >1%** |
| after | 69 | 1,127,778.983729383 | 223,846.079187092 | 59,604.102841208 | 269.154576584 | 789,692.225967185 | 844,059.647124499 | -54,367.421157314 | 6.4411% | **DISCREPANCY >1%** |
| after | 71 | 4,185,143.677766843 | 96,876.088940082 | 85,705.37638208 | 272.451983388 | 3,225,073.636749908 | 4,002,289.760461293 | -777,216.123711385 | 19.4192% | **DISCREPANCY >1%** |
| after | 72 | 2,486,826.251902087 | 221,779.667597505 | 0 | 273.603932713 | 2,105,694.740466461 | 2,264,772.980371869 | -159,078.239905408 | 7.0240% | **DISCREPANCY >1%** |
| after | 73 | 3,280,403.920420528 | 223,846.079132607 | 0 | 274.105893915 | 1,813,676.942884909 | 3,056,283.735394006 | -1,242,606.792509097 | 40.6574% | **DISCREPANCY >1%** |
| after | 74 | 3,335,944.259227667 | 0 | 94,292.343237338 | 275.356012635 | 2,712,295.874311409 | 3,241,376.559977694 | -529,080.685666285 | 16.3227% | **DISCREPANCY >1%** |
| after | 75 | 3,508,603.31466253 | 203,423.332505008 | 16,912.655508479 | 275.228181356 | 2,709,395.891317406 | 3,287,992.098467687 | -578,596.207150281 | 17.5972% | **DISCREPANCY >1%** |
| after | 76 | 1,014,703.381470641 | 179,713.432857498 | 4,053.056546057 | 277.707430063 | 539,215.189087256 | 830,659.184637023 | -291,443.995549767 | 35.0858% | **DISCREPANCY >1%** |
| after | 77 | 3,211,862.798076511 | 0 | 560,753.334406754 | 277.999075575 | 2,512,507.442349621 | 2,650,831.464594182 | -138,324.022244561 | 5.2181% | **DISCREPANCY >1%** |
| after | 78 | 650,070.486811965 | 6,499.356268383 | 93,439.420139376 | 279.779702499 | 497,791.007489218 | 549,851.930701707 | -52,060.923212489 | 9.4681% | **DISCREPANCY >1%** |
| after | 79 | 3,522,213.255441056 | 63,794.223490279 | 150,698.59416624 | 279.600830604 | 2,929,780.461334615 | 3,307,440.836953933 | -377,660.375619318 | 11.4185% | **DISCREPANCY >1%** |
| after | 80 | 1,805,830.602432742 | 144,923.552045991 | 42,374.70227022 | 280.090831482 | 1,575,661.087864241 | 1,618,252.257285049 | -42,591.169420808 | 2.6319% | **DISCREPANCY >1%** |
| after | 81 | 2,604,384.188527874 | 20,523.249052955 | 112,255.037722541 | 281.414012828 | 1,643,122.255968379 | 2,471,324.48773955 | -828,202.231771171 | 33.5124% | **DISCREPANCY >1%** |
| after | 82 | 637,067.829536987 | 1,033.20576559 | 203,656.438410755 | 282.745850169 | 387,646.14878236 | 432,095.439510473 | -44,449.290728113 | 10.2869% | **DISCREPANCY >1%** |
| after | 83 | 2,655,191.094539082 | 0 | 208,332.711813588 | 283.256933963 | 2,105,495.312152469 | 2,446,575.125791531 | -341,079.813639062 | 13.9411% | **DISCREPANCY >1%** |
| after | 84 | 573,325.241545722 | 4,045.485421068 | 25,365.155475257 | 283.99999939 | 499,568.25457856 | 543,630.600650007 | -44,062.346071447 | 8.1051% | **DISCREPANCY >1%** |
| after | 85 | 2,507,868.614240345 | 101,240.455860461 | 63,690.774470351 | 286.014358187 | 1,950,373.413274667 | 2,342,651.369551346 | -392,277.956276679 | 16.7450% | **DISCREPANCY >1%** |
| after | 87 | 1,507,293.581541561 | 223,698.068303363 | 51,054.043826615 | 288.166257778 | 811,937.38714958 | 1,232,253.303153805 | -420,315.916004225 | 34.1095% | **DISCREPANCY >1%** |
| after | 88 | 3,458,059.585228812 | 42,432.314973574 | 95,635.315747412 | 288.870198666 | 3,189,628.068539638 | 3,319,703.08430916 | -130,075.015769522 | 3.9182% | **DISCREPANCY >1%** |
| after | 89 | 2,763,963.852090179 | 184,424.496583798 | 187,748.849811315 | 290.328223029 | 1,978,297.520002656 | 2,391,500.177472037 | -413,202.657469381 | 17.2779% | **DISCREPANCY >1%** |
| after | 90 | 140,150.393099798 | 116,392.269522858 | 0 | 127.032188386 | 140,001.653399788 | 23,631.091388554 | +116,370.562011234 | 492.4468% | **DISCREPANCY >1%** |
| after | 91 | 993,486.675857598 | 160,524.915777216 | 55,173.939377367 | 291.197144601 | 543,685.801296443 | 777,496.623558414 | -233,810.822261971 | 30.0722% | **DISCREPANCY >1%** |
| after | 93 | 3,180,245.671895963 | 181,921.200099591 | 10,637.268251443 | 293.30617246 | 2,086,451.787267245 | 2,987,393.897372469 | -900,942.110105224 | 30.1581% | **DISCREPANCY >1%** |
| after | 94 | 1,582,865.5781042 | 216,580.400930509 | 6,977.120150346 | 295.371739483 | 901,263.328629545 | 1,359,012.685283862 | -457,749.356654317 | 33.6824% | **DISCREPANCY >1%** |
| after | 95 | 2,823,531.04876599 | 223,698.068303101 | 92,584.118277643 | 295.028885581 | 1,759,219.58729414 | 2,506,953.833299665 | -747,734.246005525 | 29.8264% | **DISCREPANCY >1%** |
| after | 96 | 672,961.803045531 | 130,829.78226522 | 67,499.464576751 | 296.313063466 | 387,490.176423779 | 474,336.243140094 | -86,846.066716315 | 18.3089% | **DISCREPANCY >1%** |
| after | 97 | 941,738.035836296 | 24,305.834427164 | 251,266.56865602 | 297.065141862 | 624,754.286624672 | 665,868.56761125 | -41,114.280986578 | 6.1745% | **DISCREPANCY >1%** |
| after | 98 | 2,790,301.348044368 | 176,154.008844017 | 0 | 299.435730607 | 1,537,507.711157861 | 2,613,847.903469744 | -1,076,340.192311883 | 41.1783% | **DISCREPANCY >1%** |
| after | 100 | 1,799,827.095590657 | 201,831.869356847 | 8,577.774654887 | 300.477567686 | 1,136,482.892106863 | 1,589,116.974011237 | -452,634.081904374 | 28.4833% | **DISCREPANCY >1%** |
| after | 101 | 2,301,542.793430326 | 96,709.729814995 | 147,162.212142243 | 301.978266678 | 1,352,453.090541984 | 2,057,368.87320641 | -704,915.782664426 | 34.2629% | **DISCREPANCY >1%** |
| after | 102 | 843,177.314854854 | 50,526.561897738 | 158,995.005398752 | 302.295649346 | 571,127.582889633 | 633,353.451909018 | -62,225.869019385 | 9.8248% | **DISCREPANCY >1%** |
| after | 104 | 3,063,001.342942101 | 0 | 8,693.224149186 | 304.763791038 | 2,725,130.208756965 | 3,054,003.355001877 | -328,873.146244912 | 10.7685% | **DISCREPANCY >1%** |
| after | 105 | 1,922,214.248524539 | 24,337.695348448 | 196,112.407889954 | 305.242109088 | 1,278,846.154813373 | 1,701,458.903177049 | -422,612.748363676 | 24.8382% | **DISCREPANCY >1%** |
| after | 106 | 2,377,019.760564706 | 144,209.176940372 | 53,273.846844962 | 307.301424823 | 1,487,849.779485208 | 2,179,229.435354549 | -691,379.655869341 | 31.7258% | **DISCREPANCY >1%** |
| after | 107 | 1,412,354.553743215 | 75,002.822267192 | 259,179.188766962 | 307.014369412 | 768,379.69328733 | 1,077,865.528339649 | -309,485.835052319 | 28.7128% | **DISCREPANCY >1%** |
| after | 108 | 1,530,553.515126298 | 44,888.690492425 | 38,862.313667517 | 309.752965181 | 1,054,527.794798477 | 1,446,492.758001175 | -391,964.963202698 | 27.0976% | **DISCREPANCY >1%** |
| after | 109 | 1,408,958.281801709 | 223,698.068310612 | 70,026.821602108 | 310.413033317 | 715,168.920824128 | 1,114,922.978855672 | -399,754.058031544 | 35.8548% | **DISCREPANCY >1%** |
| after | 110 | 2,493,004.834085292 | 0 | 114,618.265712794 | 310.551432191 | 1,729,173.602489589 | 2,378,076.016940307 | -648,902.414450718 | 27.2868% | **DISCREPANCY >1%** |
| after | 111 | 3,442,732.711521751 | 192,321.702770461 | 337,717.260844435 | 311.903836636 | 2,421,207.348894766 | 2,912,381.844070219 | -491,174.495175453 | 16.8650% | **DISCREPANCY >1%** |
| after | 112 | 1,865,800.736981223 | 173,200.851403845 | 85,660.90276259 | 313.726524764 | 858,535.424827937 | 1,606,625.256290024 | -748,089.831462087 | 46.5628% | **DISCREPANCY >1%** |
| after | 113 | 1,426,512.253958655 | 223,287.331033099 | 24,443.416711791 | 314.823730923 | 723,051.673206953 | 1,178,466.682482842 | -455,415.009275889 | 38.6447% | **DISCREPANCY >1%** |
| after | 114 | 1,394,632.422956434 | 54,534.060998196 | 206,414.843850019 | 314.31421114 | 818,971.595299437 | 1,133,369.203897079 | -314,397.608597642 | 27.7400% | **DISCREPANCY >1%** |
| after | 115 | 1,527,529.977031515 | 196,982.31937977 | 0 | 316.241311481 | 674,736.540831756 | 1,330,231.416340264 | -655,494.875508508 | 49.2767% | **DISCREPANCY >1%** |
| after | 117 | 1,577,424.159372488 | 0 | 110,042.604483153 | 318.659242813 | 1,182,843.699577966 | 1,467,062.895646522 | -284,219.196068556 | 19.3733% | **DISCREPANCY >1%** |
| after | 118 | 2,024,086.920306349 | 153,349.352006901 | 100,459.246518578 | 318.259844656 | 1,610,600.660779731 | 1,769,960.061936214 | -159,359.401156483 | 9.0035% | **DISCREPANCY >1%** |
| after | 119 | 1,493,373.518002894 | 127,462.331317651 | 0 | 320.161251178 | 720,015.01421028 | 1,365,591.025434065 | -645,576.011223785 | 47.2744% | **DISCREPANCY >1%** |
| after | 120 | 2,546,788.804051826 | 3,986.862247885 | 172,150.172216933 | 320.02867693 | 2,203,582.648794662 | 2,370,331.740910078 | -166,749.092115416 | 7.0348% | **DISCREPANCY >1%** |
| after | 121 | 2,766,684.954076083 | 211,264.855121109 | 0 | 321.990935497 | 1,535,311.697079252 | 2,555,098.108019477 | -1,019,786.410940225 | 39.9118% | **DISCREPANCY >1%** |
| after | 122 | 494,869.449887162 | 223,698.06146747 | 41,001.922983965 | 323.071585366 | 212,399.087082206 | 229,846.393850361 | -17,447.306768155 | 7.5908% | **DISCREPANCY >1%** |
| after | 123 | 1,850,392.345164228 | 117,012.394161995 | 40,622.003819962 | 324.767673671 | 1,545,775.281868314 | 1,692,433.1795086 | -146,657.897640286 | 8.6655% | **DISCREPANCY >1%** |
| after | 124 | 3,304,834.161523961 | 92,313.326894099 | 196,718.869959337 | 324.202246361 | 2,213,958.401766367 | 3,015,477.762424164 | -801,519.360657797 | 26.5801% | **DISCREPANCY >1%** |
| after | 125 | 2,325,859.430010415 | 223,698.068375433 | 7,964.547109056 | 326.897169487 | 1,109,743.523235324 | 2,093,869.917356439 | -984,126.394121115 | 47.0003% | **DISCREPANCY >1%** |
| after | 126 | 1,107,673.577479887 | 101,570.16062343 | 215,477.375953641 | 326.62312325 | 506,364.309783089 | 790,299.417779566 | -283,935.107996477 | 35.9275% | **DISCREPANCY >1%** |
| after | 127 | 2,802,857.648141101 | 201,728.715858691 | 45.025794905 | 328.321344019 | 1,653,334.165428989 | 2,600,755.585143486 | -947,421.419714497 | 36.4286% | **DISCREPANCY >1%** |
| after | 128 | 2,676,823.343533691 | 0 | 34,715.84016103 | 329.261683749 | 2,459,320.890947386 | 2,641,778.241688912 | -182,457.350741526 | 6.9066% | **DISCREPANCY >1%** |

## Accounting definitions

- Actual staked alpha: sum of every `TotalHotkeyAlpha(hotkey, netuid)` value.
- Pending alpha: `PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + PendingOwnerCut + PendingBasketDeposits`.
- Calculated staked alpha: saturating `SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha - pending alpha`.
- Discrepancy percentage: `abs(actual - calculated) / calculated × 100`.
