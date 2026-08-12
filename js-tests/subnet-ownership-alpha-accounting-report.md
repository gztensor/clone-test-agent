# Subnet ownership conviction and alpha accounting

Generated: 2026-08-12T17:15:52.097Z

## Run summary

| Phase | Block | Runtime | Migration complete | Subnets | King calculation mismatches | Alpha discrepancies >1% |
|---|---:|---|---|---:|---:|---:|
| before | 24 | node-subtensor/443 | false | 128 | 0 | 120 |
| after | 20 | node-subtensor/445 | true | 128 | 0 | 26 |

> **Migration verification:** the historical-alpha correction applied on the clone despite its non-mainnet genesis `0x57a26328383c75e8d0089bced04da375d90811ad2b0072633efdccfb1bf13c80`. Subnet 1 expected approximately `+661,707.044125477 α` and observed `+661,707.044125477 α`; this exactly matched. After all migrations, `26` subnets exceed 1% discrepancy.

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

Snapshot block: `20` (`0x7c0926e4e67f0f509606507e790b5748c42d71291ce612c35c244e1d7711f838`)  
Unlock rate: `934866`; maturity rate: `311622`

| Netuid | Current owner hotkey | RPC king | Conviction α | Required α | Gate | Mature | Projected takeover | Projected king |
|---:|---|---|---:|---:|---|---|---|---|
| 1 | `5HCFWvR…1wgDHh` | `5HCFWvR…1wgDHh` | 192,830.1779 | 164,050.5279 | met | no | not projected within 10y | — |
| 2 | `5CFxLBv…juK17J` | `5CFxLBv…juK17J` | 1,144,508.2618 | 269,254.388 | met | no | not projected within 10y | — |
| 3 | `5HdTZQ6…ZXkxmv` | `5E6yHkm…MUpnqG` | 242,214.3357 | 205,971.0071 | met | no | 2.59 years (block 6795720) | `5E6yHkm…MUpnqG` |
| 4 | `5Hp18g9…yMR8FM` | `5Hp18g9…yMR8FM` | 183,019.0576 | 279,298.6767 | not met | no | not projected within 10y | — |
| 5 | `5GZ2KuT…t3y7iq` | `5GZ2KuT…t3y7iq` | 6,649.8213 | 150,691.2671 | not met | no | not projected within 10y | — |
| 6 | `5CfSg4e…GxJrMA` | `5CfSg4e…GxJrMA` | 662,466.4595 | 243,343.3459 | met | no | not projected within 10y | — |
| 7 | `5ChTwrq…AEt8EE` | `5ChTwrq…AEt8EE` | 3,211.2605 | 307,077.3512 | not met | no | not projected within 10y | — |
| 8 | `5F6tnxz…tQjw8y` | `5F6tnxz…tQjw8y` | 607,571.1599 | 218,531.9127 | met | no | not projected within 10y | — |
| 9 | `5Fsbube…4mJJZ9` | `5Fsbube…4mJJZ9` | 566,487.0033 | 264,396.2118 | met | no | not projected within 10y | — |
| 10 | `5EvNESR…UNCWAW` | `5EvNESR…UNCWAW` | 19,150.4094 | 239,523.1055 | not met | no | not projected within 10y | — |
| 11 | `5ECzcM7…jGyrMS` | `5ECzcM7…jGyrMS` | 46,180.4593 | 170,546.5559 | not met | no | not projected within 10y | — |
| 12 | `5ELzhHv…S96PCp` | `5ELzhHv…S96PCp` | 3,870.5371 | 183,811.8397 | not met | no | not projected within 10y | — |
| 13 | `5HBswBt…GSxtgZ` | `5HBswBt…GSxtgZ` | 93,697.0392 | 181,010.2859 | not met | no | not projected within 10y | — |
| 14 | `5FxbrVD…RmQhq7` | `5FxbrVD…RmQhq7` | 54,506.4582 | 174,902.3784 | not met | no | not projected within 10y | — |
| 15 | `5DnqbBi…QxT5FW` | `5DnqbBi…QxT5FW` | 1,010.6516 | 70,975.9699 | not met | no | not projected within 10y | — |
| 16 | `5ECWmM2…KyrbNW` | `5Eo5pyN…JdoSG5` | 4,219.4739 | 17,663.8146 | not met | no | not projected within 10y | — |
| 17 | `5E7eSeR…HCen2B` | `5E7eSeR…HCen2B` | 486,846.067 | 257,312.7071 | met | no | not projected within 10y | — |
| 18 | `5DCSySU…NwoWyG` | `5DCSySU…NwoWyG` | 472,285.7962 | 270,930.8989 | met | no | not projected within 10y | — |
| 19 | `5CK49hD…VAQRfC` | `5CK49hD…VAQRfC` | 169,090.9668 | 153,945.921 | met | no | not projected within 10y | — |
| 20 | `5EALa14…1qriNk` | `5ED4s3B…qpwW2Q` | 183,162.8656 | 183,355.9027 | not met | no | 3.34 years (block 8767440) | `5ED4s3B…qpwW2Q` |
| 21 | `5EqAzby…orQVHp` | `5EqAzby…orQVHp` | 5,839.6288 | 262,225.5099 | not met | no | not projected within 10y | — |
| 22 | `5CUu1Qh…oD4dyP` | `5CUu1Qh…oD4dyP` | 763,677.5863 | 223,504.8097 | met | no | not projected within 10y | — |
| 23 | `5HKsviv…5rM28H` | `5HKsviv…5rM28H` | 477,984.8893 | 269,832.2056 | met | no | not projected within 10y | — |
| 24 | `5ELpkVn…e6YVcL` | `5ELpkVn…e6YVcL` | 238,954.681 | 294,678.3884 | not met | no | 3.44 years (block 9043200) | `5ELAvsv…v5WvWX` |
| 25 | `5F6aRds…6GiZ4D` | `5F6aRds…6GiZ4D` | 323,519.3728 | 324,387.1702 | not met | no | not projected within 10y | — |
| 26 | `5EHfTi6…Ww3fvP` | `5CCutNm…5ovBbX` | 1,756.4934 | 66,938.0342 | not met | no | not projected within 10y | — |
| 27 | `5H6Bqkz…tX1mQw` | `5H6Bqkz…tX1mQw` | 29,259.9793 | 199,148.0014 | not met | no | not projected within 10y | — |
| 28 | `5Evgh9Q…5dco3P` | `5Evgh9Q…5dco3P` | 434,345.8192 | 312,609.765 | met | no | not projected within 10y | — |
| 29 | `5HHHHHz…4JfZWn` | `5HHHHHz…4JfZWn` | 3,165.9749 | 228,766.224 | not met | no | not projected within 10y | — |
| 30 | `5HW12Nv…erK1S1` | `5HW12Nv…erK1S1` | 4,962.5963 | 264,942.3257 | not met | no | not projected within 10y | — |
| 31 | `5CDZ527…pQfftn` | `5CDZ527…pQfftn` | 380,738.7268 | 88,756.3692 | met | no | not projected within 10y | — |
| 32 | `5DWgkCS…uS9Qad` | `5DWgkCS…uS9Qad` | 634,410.2189 | 331,481.6094 | met | no | not projected within 10y | — |
| 33 | `5HinUfk…PYZ8uB` | `5HinUfk…PYZ8uB` | 138,808.0458 | 163,021.2729 | not met | no | not projected within 10y | — |
| 34 | `5HjBSee…TF68LQ` | `5HjBSee…TF68LQ` | 136,320.7904 | 202,474.6707 | not met | no | not projected within 10y | — |
| 35 | `5EsmkLf…dP9vVx` | `5EsmkLf…dP9vVx` | 6,195.1277 | 262,604.138 | not met | no | not projected within 10y | — |
| 36 | `5Eh5G8B…YWrwmK` | `5Eh5G8B…YWrwmK` | 113,723.9894 | 45,905.9868 | met | no | not projected within 10y | — |
| 37 | `5DXqqdr…EEeW4j` | `5DXqqdr…EEeW4j` | 45,507.1511 | 236,326.877 | not met | no | not projected within 10y | — |
| 38 | `5HNjFeS…pgBp1n` | `5HNjFeS…pgBp1n` | 46,874.6987 | 88,287.3979 | not met | no | not projected within 10y | — |
| 39 | `5G3qVaX…6qMmbC` | `5GP7c3f…SWVCMi` | 121,504.928 | 167,697.2508 | not met | no | 3.35 years (block 8814240) | `5GP7c3f…SWVCMi` |
| 40 | `5HijSRH…4aiTUs` | `5HijSRH…4aiTUs` | 22,427.8984 | 12,481.2005 | met | no | not projected within 10y | — |
| 41 | `5FCSevL…2DYkXX` | `5FCSevL…2DYkXX` | 258,549.3693 | 178,420.5751 | met | no | not projected within 10y | — |
| 42 | `5Gbdb5s…vf6jUJ` | `5Gbdb5s…vf6jUJ` | 5,444.0166 | 216,439.4585 | not met | no | not projected within 10y | — |
| 43 | `5HjMs5J…XJS9HC` | `5HjMs5J…XJS9HC` | 3,451.0692 | 219,448.3543 | not met | no | not projected within 10y | — |
| 44 | `5FsREvy…1nQkwu` | `5FsREvy…1nQkwu` | 245,862.4495 | 337,918.6954 | not met | no | not projected within 10y | — |
| 45 | `5Hmiaz4…X674DD` | `5Hmiaz4…X674DD` | 111,019.2002 | 198,986.0353 | not met | no | not projected within 10y | — |
| 46 | `5CDnZ6o…9QdM6D` | `5CDnZ6o…9QdM6D` | 175,034.1233 | 249,686.3057 | not met | no | not projected within 10y | — |
| 47 | `5GjN9n3…MfdEWj` | `5Do5iLB…6TcFut` | 98,178.7593 | 68,394.6628 | met | no | not projected within 10y | — |
| 48 | `5D2Qc9u…i943ch` | `5D2Qc9u…i943ch` | 101,862.5593 | 231,037.1729 | not met | no | not projected within 10y | — |
| 49 | `5DLYBBC…BnrAgn` | `5DLYBBC…BnrAgn` | 80,451.6023 | 115,931.6403 | not met | no | not projected within 10y | — |
| 50 | `5DxyiWp…c2sJkD` | `5DxyiWp…c2sJkD` | 212,500.0052 | 272,902.3618 | not met | no | not projected within 10y | — |
| 51 | `5FTVrwE…ZouKg1` | `5FTVrwE…ZouKg1` | 455,619.7847 | 237,049.0522 | met | no | not projected within 10y | — |
| 52 | `5EgfUiH…gLrVuz` | `5EgfUiH…gLrVuz` | 167,638.3546 | 187,485.8614 | not met | no | not projected within 10y | — |
| 53 | `5DXSBCC…sc1uvJ` | `5DXSBCC…sc1uvJ` | 87,530.2664 | 398,377.2563 | not met | no | not projected within 10y | — |
| 54 | `5DUB7kN…L9Wgpr` | `5DUB7kN…L9Wgpr` | 644,081.4257 | 316,751.4673 | met | no | not projected within 10y | — |
| 55 | `5DJ5fT1…1KfYVd` | `5DJ5fT1…1KfYVd` | 14,841.8669 | 238,869.2572 | not met | no | not projected within 10y | — |
| 56 | `5GU4Xkd…1mVXFu` | `5GU4Xkd…1mVXFu` | 264,724.1855 | 185,791.6426 | met | no | not projected within 10y | — |
| 57 | `5Ejcqsb…U3g5MN` | `5Ejcqsb…U3g5MN` | 1,254.307 | 43,755.911 | not met | no | not projected within 10y | — |
| 58 | `5EPXZrL…jJ3GHz` | `5EPXZrL…jJ3GHz` | 32,808.0276 | 13,533.0523 | met | no | not projected within 10y | — |
| 59 | `5EF9dnw…FjNdve` | `5EF9dnw…FjNdve` | 388,812.5668 | 262,990.5676 | met | no | not projected within 10y | — |
| 60 | `5CXLwkK…hA9rhR` | `5CXLwkK…hA9rhR` | 1,102,857.7393 | 306,944.5083 | met | no | not projected within 10y | — |
| 61 | `5ECEsYL…c8jUbn` | `5ECEsYL…c8jUbn` | 1,021,287.8842 | 347,892.5574 | met | no | not projected within 10y | — |
| 62 | `5EsNzkZ…kTcicD` | `5EsNzkZ…kTcicD` | 149,335.6433 | 241,209.7741 | not met | no | not projected within 10y | — |
| 63 | `5GmpedV…RR4e1B` | `5GmpedV…RR4e1B` | 72,397.9924 | 294,469.5532 | not met | no | not projected within 10y | — |
| 64 | `5CS3g6n…Ks2xbV` | `5CS3g6n…Ks2xbV` | 725,063.6346 | 290,608.0082 | met | no | not projected within 10y | — |
| 65 | `5DAmVrU…q6mHHL` | `5DAmVrU…q6mHHL` | 171,794.1502 | 228,375.8179 | not met | no | not projected within 10y | — |
| 66 | `5DRPoRi…MzcpZV` | `5DRPoRi…MzcpZV` | 392,806.5918 | 239,590.9128 | met | no | not projected within 10y | — |
| 67 | `5Cm4fAT…koT7Rt` | `5Cm4fAT…koT7Rt` | 522.2833 | 41,032.8326 | not met | no | not projected within 10y | — |
| 68 | `5CSuegT…4rQbbb` | `5CSuegT…4rQbbb` | 603,246.7243 | 275,535.618 | met | no | not projected within 10y | — |
| 69 | `5FWB5CF…qWjkg5` | `5FWB5CF…qWjkg5` | 485.8134 | 78,646.8982 | not met | no | not projected within 10y | — |
| 70 | `5DFxKep…L6QD6o` | — | 0 | 3,817.9055 | not met | no | not projected within 10y | — |
| 71 | `5FNVgRn…xEBLo9` | `5FNVgRn…xEBLo9` | 63,565.0864 | 322,297.2954 | not met | no | not projected within 10y | — |
| 72 | `5DUuFhF…16k2GU` | `5DUuFhF…16k2GU` | 524,911.776 | 210,352.5527 | met | no | not projected within 10y | — |
| 73 | `5Dnkprj…K8pFhW` | `5Dnkprj…K8pFhW` | 898,316.9563 | 181,142.2851 | met | no | not projected within 10y | — |
| 74 | `5Dnffft…bXGH7L` | `5Dnffft…bXGH7L` | 378,229.6092 | 270,983.3493 | met | no | not projected within 10y | — |
| 75 | `5G1Qj93…sQzs6g` | `5G1Qj93…sQzs6g` | 552,609.8116 | 270,705.878 | met | no | not projected within 10y | — |
| 76 | `5Cw4E2t…6yu5cs` | `5Cw4E2t…6yu5cs` | 56,651.1485 | 53,478.2487 | met | no | not projected within 10y | — |
| 77 | `5DqALXR…DdohsE` | `5DqALXR…DdohsE` | 369,577.9139 | 251,019.5567 | met | no | not projected within 10y | — |
| 78 | `5Fk765B…yDWsuk` | `5Fk765B…yDWsuk` | 525.3312 | 49,203.4694 | not met | no | not projected within 10y | — |
| 79 | `5EWwdZB…6HSxoF` | `5EWwdZB…6HSxoF` | 1,355,085.8272 | 292,725.7722 | met | no | not projected within 10y | — |
| 80 | `5HTwtyt…2N1Zo6` | `5HTwtyt…2N1Zo6` | 3,993.8813 | 157,087.9106 | not met | no | not projected within 10y | — |
| 81 | `5F9uEDD…jcQfij` | `5H47sFL…n4wdDa` | 132,339.054 | 164,079.9802 | not met | no | 3.35 years (block 8802360) | `5H47sFL…n4wdDa` |
| 82 | `5GNyvcC…yhZHgW` | `5GNyvcC…yhZHgW` | 744.3143 | 38,203.2769 | not met | no | not projected within 10y | — |
| 83 | `5EHGayL…ZH9Q5L` | `5EHGayL…ZH9Q5L` | 8,057.3409 | 210,165.8559 | not met | no | not projected within 10y | — |
| 84 | `5EjbqZD…kLpVAF` | `5EjbqZD…kLpVAF` | 660.4364 | 50,479.3578 | not met | no | not projected within 10y | — |
| 85 | `5FR392L…Sgwxhb` | `5FR392L…Sgwxhb` | 143,874.4068 | 194,778.984 | not met | no | not projected within 10y | — |
| 86 | `5F1N5GE…N3D2cc` | — | 0 | 0 | met | no | not projected within 10y | — |
| 87 | `5Do9743…7cQsN5` | `5Do9743…7cQsN5` | 161,852.8302 | 80,880.9635 | met | no | not projected within 10y | — |
| 88 | `5HK4vbG…LPgXpY` | `5HK4vbG…LPgXpY` | 862,645.5846 | 318,712.7957 | met | no | not projected within 10y | — |
| 89 | `5FCN4P1…JBhBLd` | `5FCN4P1…JBhBLd` | 6,094.6321 | 197,576.1047 | not met | no | not projected within 10y | — |
| 90 | `5EKtGWq…piSTEE` | `5EKtGWq…piSTEE` | 23,835.7418 | 2,373.1124 | met | no | not projected within 10y | — |
| 91 | `5FcCsoB…UCyfsw` | `5FcCsoB…UCyfsw` | 86,746.1718 | 53,890.8961 | met | no | not projected within 10y | — |
| 92 | `5FeHbWK…s4UJGc` | — | 0 | 16,477.139 | not met | no | not projected within 10y | — |
| 93 | `5DAoDtM…DhfNNK` | `5DAoDtM…DhfNNK` | 398,615.7004 | 208,374.6244 | met | no | not projected within 10y | — |
| 94 | `5EeKtCK…Ng6Dvj` | `5EeKtCK…Ng6Dvj` | 273.723 | 89,566.4698 | not met | no | not projected within 10y | — |
| 95 | `5ExqqyE…k7n7HP` | `5ExqqyE…k7n7HP` | 9,024.9977 | 175,510.1202 | not met | no | not projected within 10y | — |
| 96 | `5GpKXtt…jWMz8c` | `5GpKXtt…jWMz8c` | 150,018.8743 | 38,151.0651 | met | no | not projected within 10y | — |
| 97 | `5EvHrbH…ZrBcxZ` | `5EvHrbH…ZrBcxZ` | 7,940.3318 | 61,957.1691 | not met | no | not projected within 10y | — |
| 98 | `5HWVxik…BtFxvK` | `5HWVxik…BtFxvK` | 619,118.4835 | 153,478.3954 | met | no | not projected within 10y | — |
| 99 | `5FWbrcG…MwSeGD` | — | 0 | 14,553.5728 | not met | no | not projected within 10y | — |
| 100 | `5HdSGJg…xTvKfe` | `5HdSGJg…xTvKfe` | 331,818.3965 | 113,124.9907 | met | no | not projected within 10y | — |
| 101 | `5H6Dezn…UAS2Zj` | `5H6Dezn…UAS2Zj` | 13,574.6134 | 134,785.2538 | not met | no | not projected within 10y | — |
| 102 | `5EEinUE…EqKkC9` | `5EEinUE…EqKkC9` | 2,002.3405 | 56,607.0601 | not met | no | not projected within 10y | — |
| 103 | `5E529AK…8SbwGV` | — | 0 | 0 | met | no | not projected within 10y | — |
| 104 | `5Coeuhi…kWYG6y` | `5Coeuhi…kWYG6y` | 3,017.9211 | 271,395.9946 | not met | no | not projected within 10y | — |
| 105 | `5HBSExJ…DHHTY4` | `5HBSExJ…DHHTY4` | 221,041.9207 | 127,443.0401 | met | no | not projected within 10y | — |
| 106 | `5D7FVSM…ezvyHy` | `5D7FVSM…ezvyHy` | 273,159.7244 | 148,508.1379 | met | no | not projected within 10y | — |
| 107 | `5E4WJ2t…mUT3Ju` | `5E4WJ2t…mUT3Ju` | 41,164.694 | 76,343.2581 | not met | no | not projected within 10y | — |
| 108 | `5CAxp9f…j7oTWh` | `5CAxp9f…j7oTWh` | 337,271.6614 | 104,887.9634 | met | no | not projected within 10y | — |
| 109 | `5DyQkk4…Vd3XUk` | `5DyQkk4…Vd3XUk` | 159,937.4226 | 71,198.4627 | met | no | not projected within 10y | — |
| 110 | `5CwckYm…2Q9rvp` | `5CwckYm…2Q9rvp` | 9,205.9219 | 172,475.7365 | not met | no | not projected within 10y | — |
| 111 | `5ExhNF8…NRmaN5` | `5ExhNF8…NRmaN5` | 1,221.605 | 241,802.4643 | not met | no | not projected within 10y | — |
| 112 | `5E1ohAs…2jFvCt` | `5E1ohAs…2jFvCt` | 9,192.0168 | 85,441.6213 | not met | no | not projected within 10y | — |
| 113 | `5FRumLA…C3M8uB` | `5FRumLA…C3M8uB` | 100,559.231 | 71,955.5775 | met | no | not projected within 10y | — |
| 114 | `5H1nRfb…KpUKju` | `5H1nRfb…KpUKju` | 146,039.7603 | 81,437.9132 | met | no | not projected within 10y | — |
| 115 | `5EhTo9A…GZKgTV` | `5EhTo9A…GZKgTV` | 2,942.0083 | 67,000.8404 | not met | no | not projected within 10y | — |
| 116 | `5CXN6pP…ENsub5` | `5CXN6pP…ENsub5` | 30.4505 | 32,209.7407 | not met | no | not projected within 10y | — |
| 117 | `5DwRMxJ…RozmGE` | `5DwRMxJ…RozmGE` | 157,580.0812 | 117,792.9953 | met | no | not projected within 10y | — |
| 118 | `5HmP973…7FsmZz` | `5HmP973…7FsmZz` | 120,120.3554 | 160,562.4863 | not met | no | not projected within 10y | — |
| 119 | `5HMwvi1…75JNd4` | `5HMwvi1…75JNd4` | 20,722.5426 | 71,680.8632 | not met | no | not projected within 10y | — |
| 120 | `5HmYnmU…1Qqzb8` | `5HmYnmU…1Qqzb8` | 72,383.7416 | 220,031.2243 | not met | no | not projected within 10y | — |
| 121 | `5EL9y2g…34ZdNf` | `5EL9y2g…34ZdNf` | 202,885.7096 | 153,231.6778 | met | no | not projected within 10y | — |
| 122 | `5CfPqfa…dnJyYB` | `5CfPqfa…dnJyYB` | 104,780.9031 | 20,737.5493 | met | no | not projected within 10y | — |
| 123 | `5GxsywP…Nba82o` | `5GxsywP…Nba82o` | 350,656.8799 | 154,290.7223 | met | no | not projected within 10y | — |
| 124 | `5GZPtUj…AEDjmt` | `5GZPtUj…AEDjmt` | 1,000,000.1108 | 221,108.3659 | met | no | not projected within 10y | — |
| 125 | `5CFFoku…Kuydnx` | `5CFFoku…Kuydnx` | 45,923.6629 | 110,670.6881 | not met | no | not projected within 10y | — |
| 126 | `5DqrUa2…GqvKZm` | `5FZD47W…AJ5ggD` | 106,867.5428 | 50,234.4637 | met | no | not projected within 10y | — |
| 127 | `5EKrpcq…58gtb5` | `5EKrpcq…58gtb5` | 5,535.6746 | 165,027.392 | not met | no | not projected within 10y | — |
| 128 | `5FpsgU3…Ewt9h8` | `5FpsgU3…Ewt9h8` | 3,774.5739 | 245,606.5709 | not met | no | not projected within 10y | — |

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
| 1 | 2,484,433.267183304 | 826,743.498270167 | 17,184.489564018 | 12.037807438 | 1,659,801.911049485 | 1,640,493.241541681 | +19,308.669507804 | 1.1770% | **DISCREPANCY >1%** |
| 2 | 3,328,535.356043044 | 635,713.572381259 | 277.903743213 | 176.500851134 | 2,711,313.00299156 | 2,692,367.379067438 | +18,945.623924122 | 0.7036% | OK |
| 3 | 2,802,704.615497373 | 578,475.334942498 | 164,519.209796329 | 176.126595327 | 2,078,448.8879906 | 2,059,533.944163219 | +18,914.943827381 | 0.9184% | OK |
| 4 | 3,503,427.807463125 | 553,023.967435256 | 157,417.072763927 | 177.029751154 | 2,811,300.435005442 | 2,792,809.737512788 | +18,490.697492654 | 0.6620% | OK |
| 5 | 2,998,776.18639265 | 1,488,257.228963462 | 3,606.286723825 | 178.281869905 | 1,525,624.786765432 | 1,506,734.388835458 | +18,890.397929974 | 1.2537% | **DISCREPANCY >1%** |
| 6 | 2,715,891.911458657 | 185,360.665463109 | 97,097.786802825 | 181.346869954 | 2,451,996.683773013 | 2,433,252.112322769 | +18,744.571450244 | 0.7703% | OK |
| 7 | 3,129,935.311512733 | 36,084.978602376 | 23,076.821212896 | 181.075388474 | 3,089,552.962272271 | 3,070,592.436308987 | +18,960.525963284 | 0.6174% | OK |
| 8 | 3,034,760.377605573 | 780,868.154271859 | 68,573.096230943 | 181.086928491 | 2,204,088.317242778 | 2,185,138.04017428 | +18,950.277068498 | 0.8672% | OK |
| 9 | 3,941,025.19899251 | 1,134,490.320449541 | 162,572.760929955 | 182.118320403 | 2,662,702.753243412 | 2,643,779.999292611 | +18,922.753950801 | 0.7157% | OK |
| 10 | 3,118,105.600023772 | 718,954.77036203 | 3,919.775094447 | 183.688883103 | 2,413,820.773748008 | 2,395,047.365684192 | +18,773.408063816 | 0.7838% | OK |
| 11 | 2,980,610.924767523 | 1,145,934.992162841 | 129,210.373329891 | 184.661334518 | 1,724,261.701431808 | 1,705,280.897940273 | +18,980.803491535 | 1.1130% | **DISCREPANCY >1%** |
| 12 | 3,360,251.048608388 | 1,522,132.651258694 | 0 | 186.292697991 | 1,856,786.281218517 | 1,837,932.104651703 | +18,854.176566814 | 1.0258% | **DISCREPANCY >1%** |
| 13 | 2,419,733.443340406 | 593,048.370031793 | 16,582.21426827 | 186.761479027 | 1,828,953.545731635 | 1,809,916.097561316 | +19,037.448170319 | 1.0518% | **DISCREPANCY >1%** |
| 14 | 3,059,208.25751119 | 1,180,371.405325601 | 129,813.067943654 | 187.278374931 | 1,767,865.10047261 | 1,748,836.505867004 | +19,028.594605606 | 1.0880% | **DISCREPANCY >1%** |
| 15 | 1,282,864.419571058 | 354,654.991781899 | 218,449.729029462 | 188.096217248 | 716,745.344324384 | 709,571.602542449 | +7,173.741781935 | 1.0109% | **DISCREPANCY >1%** |
| 16 | 292,255.056082386 | 106,491.578931276 | 9,125.331581653 | 190.086571499 | 219,971.692133916 | 176,448.058997958 | +43,523.633135958 | 24.6665% | **DISCREPANCY >1%** |
| 17 | 3,025,647.450042758 | 340,475.604612198 | 112,044.774908358 | 190.357595982 | 2,591,753.716854974 | 2,572,936.71292622 | +18,817.003928754 | 0.7313% | OK |
| 18 | 3,221,524.3581729 | 327,278.331731401 | 184,937.037344576 | 427.502768759 | 2,728,012.390175507 | 2,708,881.486328164 | +19,130.903847343 | 0.7062% | OK |
| 19 | 2,545,331.79842276 | 1,005,152.040322882 | 720.547697178 | 192.424919903 | 1,558,366.405120635 | 1,539,266.785482797 | +19,099.619637838 | 1.2408% | **DISCREPANCY >1%** |
| 20 | 3,151,578.118117668 | 1,318,019.090795353 | 0 | 194.646865479 | 1,852,324.660431886 | 1,833,364.380456836 | +18,960.27997505 | 1.0341% | **DISCREPANCY >1%** |
| 21 | 3,446,344.944539729 | 811,563.250445903 | 12,526.594993624 | 195.583376062 | 2,641,137.2895972 | 2,622,059.51572414 | +19,077.77387306 | 0.7275% | OK |
| 22 | 3,424,691.078972077 | 1,181,104.166041112 | 8,538.815663423 | 196.742051101 | 2,253,922.90864158 | 2,234,851.355216441 | +19,071.553425139 | 0.8533% | OK |
| 23 | 4,040,900.136284042 | 1,085,012.60808004 | 257,565.47245039 | 197.241550701 | 2,717,035.06015898 | 2,698,124.814202911 | +18,910.245956069 | 0.7008% | OK |
| 24 | 3,641,693.385197894 | 581,611.381123771 | 113,298.120046902 | 198.496276105 | 2,964,647.656840732 | 2,946,585.387751116 | +18,062.269089616 | 0.6129% | OK |
| 25 | 4,116,563.160734956 | 872,691.458855825 | 0 | 198.348350587 | 3,262,570.098652547 | 3,243,673.353528544 | +18,896.745124003 | 0.5825% | OK |
| 26 | 776,677.346869401 | 91,065.541425466 | 16,231.463886896 | 199.885745807 | 673,306.86442606 | 669,180.455811232 | +4,126.408614828 | 0.6166% | OK |
| 27 | 3,217,082.984189999 | 1,225,488.394288307 | 114.576078423 | 203.326060398 | 2,010,230.893396306 | 1,991,276.687762871 | +18,954.205633435 | 0.9518% | OK |
| 28 | 4,652,636.230925354 | 1,380,136.946029568 | 146,401.635033118 | 201.210187172 | 3,144,789.333292944 | 3,125,896.439675496 | +18,892.893617448 | 0.6043% | OK |
| 29 | 2,898,491.592659301 | 610,829.352749762 | 0 | 203.726660955 | 2,306,335.831049477 | 2,287,458.513248584 | +18,877.317800893 | 0.8252% | OK |
| 30 | 3,382,572.048550954 | 710,234.099517005 | 22,914.692387486 | 204.461152396 | 2,667,110.572279116 | 2,649,218.795494067 | +17,891.776785049 | 0.6753% | OK |
| 31 | 1,586,506.687500347 | 660,846.230518782 | 38,096.765184011 | 204.694922316 | 893,531.693731475 | 887,358.996875238 | +6,172.696856237 | 0.6956% | OK |
| 32 | 3,427,215.832587246 | 17,419.272873098 | 94,980.465258985 | 206.895902576 | 3,333,422.893428039 | 3,314,609.198552587 | +18,813.694875452 | 0.5675% | OK |
| 33 | 2,301,825.736058045 | 584,226.582883127 | 87,386.424445187 | 207.090754813 | 1,649,218.144611554 | 1,630,005.637974918 | +19,212.506636636 | 1.1786% | **DISCREPANCY >1%** |
| 34 | 2,517,743.745138495 | 359,469.273754254 | 133,527.764807623 | 207.353990351 | 2,043,591.427143987 | 2,024,539.352586267 | +19,052.07455772 | 0.9410% | OK |
| 35 | 2,988,525.927713479 | 266,886.343998939 | 95,598.20397956 | 210.133908812 | 2,644,675.94827133 | 2,625,831.245826168 | +18,844.702445162 | 0.7176% | OK |
| 36 | 627,885.239072002 | 131,286.518958231 | 37,538.851627533 | 211.003480314 | 464,701.809419829 | 458,848.865005924 | +5,852.944413905 | 1.2755% | **DISCREPANCY >1%** |
| 37 | 3,572,550.215572503 | 1,209,281.44508295 | 0 | 211.373593967 | 2,381,932.136047951 | 2,363,057.396895586 | +18,874.739152365 | 0.7987% | OK |
| 38 | 1,473,090.572467733 | 485,297.062238848 | 104,919.531067811 | 856.101524208 | 886,266.551300017 | 882,017.877636866 | +4,248.673663151 | 0.4816% | OK |
| 39 | 3,166,429.553195886 | 1,460,083.628868387 | 29,373.416255258 | 212.780998119 | 1,695,429.468557074 | 1,676,759.727074122 | +18,669.741482952 | 1.1134% | **DISCREPANCY >1%** |
| 40 | 326,999.733918726 | 74,153.423804429 | 128,034.305600759 | 213.517385183 | 176,741.448835177 | 124,598.487128355 | +52,142.961706822 | 41.8487% | **DISCREPANCY >1%** |
| 41 | 2,975,167.611654056 | 973,744.279818439 | 217,217.580368984 | 214.976763401 | 1,802,863.651482052 | 1,783,990.774703232 | +18,872.87677882 | 1.0579% | **DISCREPANCY >1%** |
| 42 | 2,595,037.142096049 | 430,642.557214966 | 0 | 216.919954611 | 2,183,122.943907032 | 2,164,177.664926472 | +18,945.27898056 | 0.8754% | OK |
| 43 | 3,052,781.884567396 | 857,879.953518064 | 418.387877525 | 217.016150192 | 2,212,435.691834392 | 2,194,266.527021615 | +18,169.164812777 | 0.8280% | OK |
| 44 | 4,012,374.17549395 | 506,394.124946002 | 126,793.096835898 | 217.029336237 | 3,398,459.104068 | 3,378,969.924375813 | +19,489.179692187 | 0.5767% | OK |
| 45 | 3,011,746.442172559 | 1,021,886.089454556 | 0 | 220.877745729 | 2,008,703.116929344 | 1,989,639.474972274 | +19,063.64195707 | 0.9581% | OK |
| 46 | 3,510,712.597918791 | 920,454.734537479 | 93,394.806384354 | 220.017693836 | 2,515,548.15997582 | 2,496,643.039303122 | +18,905.120672698 | 0.7572% | OK |
| 47 | 1,295,523.895427735 | 588,653.185177574 | 22,924.082606544 | 221.661885461 | 687,673.465762526 | 683,724.965758156 | +3,948.50000437 | 0.5774% | OK |
| 48 | 3,107,529.04985937 | 695,492.461656953 | 101,664.859193657 | 222.70085306 | 2,328,846.687272452 | 2,310,149.0281557 | +18,697.659116752 | 0.8093% | OK |
| 49 | 2,017,870.357921837 | 694,094.772062343 | 164,459.183128771 | 222.470969144 | 1,164,300.147403006 | 1,159,093.931761579 | +5,206.215641427 | 0.4491% | OK |
| 50 | 3,236,909.049890369 | 467,621.462714429 | 40,263.969667629 | 223.870419966 | 2,747,775.456897652 | 2,728,799.747088345 | +18,975.709809307 | 0.6953% | OK |
| 51 | 3,694,842.255483359 | 1,171,146.945421614 | 153,204.78799525 | 224.014881522 | 2,389,201.875098131 | 2,370,266.507184973 | +18,935.367913158 | 0.7988% | OK |
| 52 | 2,952,111.070821844 | 1,077,162.060889068 | 90.395967424 | 225.761205227 | 1,893,408.234763284 | 1,874,632.852760125 | +18,775.382003159 | 1.0015% | **DISCREPANCY >1%** |
| 53 | 4,587,452.510237468 | 520,242.333818612 | 83,437.61386417 | 226.141069503 | 4,002,412.306866003 | 3,983,546.421485183 | +18,865.88538082 | 0.4735% | OK |
| 54 | 3,774,200.691772849 | 562,924.886719164 | 43,761.132345373 | 228.262086164 | 3,186,263.949667802 | 3,167,286.410622148 | +18,977.539045654 | 0.5991% | OK |
| 55 | 2,799,331.289393601 | 316,092.836118957 | 94,545.881062638 | 230.13460509 | 2,407,570.599805009 | 2,388,462.437606916 | +19,108.162198093 | 0.8000% | OK |
| 56 | 2,646,400.264136623 | 774,485.915914827 | 13,997.922202342 | 229.282503585 | 1,876,658.38095267 | 1,857,687.143515869 | +18,971.237436801 | 1.0212% | **DISCREPANCY >1%** |
| 57 | 825,771.111178675 | 317,596.320183395 | 70,615.680938887 | 230.648963678 | 442,264.988899287 | 437,328.461092715 | +4,936.527806572 | 1.1287% | **DISCREPANCY >1%** |
| 58 | 297,297.290570974 | 161,966.767161337 | 0 | 81.223144219 | 228,682.61780516 | 135,249.300265418 | +93,433.317539742 | 69.0822% | **DISCREPANCY >1%** |
| 59 | 3,193,727.959417721 | 440,939.168981065 | 122,883.114116497 | 235.495433103 | 2,648,586.34800194 | 2,629,670.180887056 | +18,916.167114884 | 0.7193% | OK |
| 60 | 3,738,932.573624944 | 628,958.607866544 | 40,528.882878666 | 234.011153455 | 3,088,309.198855045 | 3,069,211.071726279 | +19,098.127128766 | 0.6222% | OK |
| 61 | 4,368,646.842856866 | 808,370.14496251 | 81,351.124097833 | 234.599154618 | 3,497,985.843054945 | 3,478,690.974641905 | +19,294.86841304 | 0.5546% | OK |
| 62 | 2,639,377.428755228 | 184,174.273336392 | 43,105.414492427 | 235.315194534 | 2,431,187.062364878 | 2,411,862.425731875 | +19,324.636633003 | 0.8012% | OK |
| 63 | 3,817,258.937514201 | 725,439.396179942 | 147,124.00924581 | 236.616747346 | 2,963,791.083203702 | 2,944,458.915341103 | +19,332.167862599 | 0.6565% | OK |
| 64 | 3,340,767.987321361 | 267,933.276542149 | 166,754.628304826 | 237.063767948 | 2,925,100.024232174 | 2,905,843.018706438 | +19,257.005525736 | 0.6626% | OK |
| 65 | 3,223,181.02667184 | 939,351.125453697 | 71.722624687 | 240.953625569 | 2,290,879.611105601 | 2,283,517.224967887 | +7,362.386137714 | 0.3224% | OK |
| 66 | 3,355,561.767963545 | 876,389.726869251 | 83,262.913449555 | 240.87636567 | 2,399,574.013147158 | 2,395,668.251279069 | +3,905.761868089 | 0.1630% | OK |
| 67 | 818,229.005618122 | 275,635.793013465 | 132,264.88633962 | 240.548133071 | 415,753.341684633 | 410,087.778131966 | +5,665.563552667 | 1.3815% | **DISCREPANCY >1%** |
| 68 | 3,606,513.399553757 | 681,206.505097183 | 169,950.71432108 | 241.156427267 | 2,757,678.262310717 | 2,755,115.023708227 | +2,563.23860249 | 0.0930% | OK |
| 69 | 1,127,751.983729383 | 281,678.898945926 | 59,604.102841208 | 242.15457664 | 789,692.225967185 | 786,226.827365609 | +3,465.398601576 | 0.4407% | OK |
| 70 | 38,327.22374926 | 148.169094182 | 0 | 178.182726679 | 38,149.040995632 | 38,000.871928399 | +148.169067233 | 0.3899% | OK |
| 71 | 4,185,116.677766843 | 876,438.347763752 | 85,705.37638208 | 245.451983445 | 3,225,073.636749908 | 3,222,727.501637566 | +2,346.135112342 | 0.0727% | OK |
| 72 | 2,486,799.251902087 | 383,273.725113362 | 0 | 246.60393277 | 2,105,694.740466461 | 2,103,278.922855955 | +2,415.817610506 | 0.1148% | OK |
| 73 | 3,280,376.920420528 | 1,468,954.069047113 | 0 | 247.105893974 | 1,813,676.942884909 | 1,811,175.745479441 | +2,501.197405468 | 0.1380% | OK |
| 74 | 3,335,917.259227667 | 531,791.422968235 | 94,292.343237338 | 248.356012694 | 2,712,295.874311409 | 2,709,585.1370094 | +2,710.737302009 | 0.1000% | OK |
| 75 | 3,508,562.423488913 | 784,604.879643725 | 16,898.764334862 | 248.228181414 | 2,709,395.891317406 | 2,706,810.551328912 | +2,585.339988494 | 0.0955% | OK |
| 76 | 1,014,676.381470641 | 475,840.83810665 | 4,053.056546057 | 250.707430122 | 539,215.189087256 | 534,531.779387812 | +4,683.409699444 | 0.8761% | OK |
| 77 | 3,211,835.798076511 | 140,886.89655137 | 560,753.334406754 | 250.999075632 | 2,512,507.442349621 | 2,509,944.568042755 | +2,562.874306866 | 0.1021% | OK |
| 78 | 650,043.486811965 | 64,569.373140067 | 93,439.420139376 | 252.779702556 | 497,791.007489218 | 491,781.913829966 | +6,009.093659252 | 1.2219% | **DISCREPANCY >1%** |
| 79 | 3,522,180.291876601 | 444,229.939659842 | 150,692.630601785 | 252.60083066 | 2,929,780.461334615 | 2,927,005.120784314 | +2,775.340550301 | 0.0948% | OK |
| 80 | 1,805,803.602432742 | 192,549.794495279 | 42,374.70227022 | 253.090831538 | 1,575,661.087864241 | 1,570,626.014835705 | +5,035.073028536 | 0.3205% | OK |
| 81 | 2,604,351.251527072 | 851,302.349232435 | 112,249.100721739 | 254.414012886 | 1,643,122.255968379 | 1,640,545.387560012 | +2,576.868408367 | 0.1570% | OK |
| 82 | 637,040.829536987 | 51,351.621683119 | 203,656.438410755 | 255.745850228 | 387,646.14878236 | 381,777.023592885 | +5,869.125189475 | 1.5373% | **DISCREPANCY >1%** |
| 83 | 2,655,164.094539082 | 345,172.824104195 | 208,332.711813588 | 256.25693402 | 2,105,495.312152469 | 2,101,402.301687279 | +4,093.01046519 | 0.1947% | OK |
| 84 | 573,298.241545722 | 43,139.508392941 | 25,365.155475257 | 256.999999448 | 499,568.25457856 | 504,536.577678076 | -4,968.323099516 | 0.9847% | OK |
| 85 | 2,507,841.191572441 | 496,360.999970373 | 63,690.351802447 | 259.014358244 | 1,950,373.413274667 | 1,947,530.825441377 | +2,842.58783329 | 0.1459% | OK |
| 86 | 0 | 167,757.35619872 | 0 | 0 | 0 | 0 | 0 | 0.0000% | OK |
| 87 | 1,507,266.581541561 | 647,402.902423667 | 51,054.043826615 | 261.166257834 | 811,937.38714958 | 808,548.469033445 | +3,388.918116135 | 0.4191% | OK |
| 88 | 3,458,032.228331148 | 175,269.312981134 | 95,634.958849748 | 261.870198725 | 3,189,628.068539638 | 3,186,866.086301541 | +2,761.982238097 | 0.0866% | OK |
| 89 | 2,763,936.852090179 | 600,426.954984618 | 187,748.849811315 | 263.328223089 | 1,978,297.520002656 | 1,975,497.719071157 | +2,799.800931499 | 0.1417% | OK |
| 90 | 140,123.393099798 | 116,392.269522858 | 0 | 100.032188443 | 140,001.653399788 | 23,631.091388497 | +116,370.562011291 | 492.4468% | **DISCREPANCY >1%** |
| 91 | 993,458.449609341 | 399,376.775480423 | 55,172.71312911 | 264.197144655 | 543,685.801296443 | 538,644.763855153 | +5,041.03744129 | 0.9358% | OK |
| 92 | 382,886.228663509 | 176,927.850467173 | 41,186.988026446 | 266.178151502 | 165,518.197370141 | 164,505.212018388 | +1,012.985351753 | 0.6157% | OK |
| 93 | 3,180,210.275404382 | 1,085,835.159306595 | 10,628.871759862 | 266.306172517 | 2,086,451.787267245 | 2,083,479.938165408 | +2,971.849101837 | 0.1426% | OK |
| 94 | 1,582,838.5781042 | 680,196.760099128 | 6,977.120150346 | 268.371739541 | 901,263.328629545 | 895,396.326115185 | +5,867.00251436 | 0.6552% | OK |
| 95 | 2,823,504.04876599 | 975,818.72867639 | 92,584.118277643 | 268.028885641 | 1,759,219.58729414 | 1,754,833.172926316 | +4,386.414367824 | 0.2499% | OK |
| 96 | 672,934.803045531 | 223,924.687813565 | 67,499.464576751 | 269.313063521 | 387,490.176423779 | 381,241.337591694 | +6,248.838832085 | 1.6390% | **DISCREPANCY >1%** |
| 97 | 941,703.392694326 | 70,872.776437572 | 251,258.92551405 | 270.065141919 | 624,754.286624672 | 619,301.625600785 | +5,452.661023887 | 0.8804% | OK |
| 98 | 2,790,274.348044368 | 1,255,490.393926426 | 0 | 272.435730666 | 1,537,507.711157861 | 1,534,511.518387276 | +2,996.192770585 | 0.1952% | OK |
| 99 | 217,540.329419552 | 72,004.601807409 | 0 | 283.650694724 | 145,941.59538324 | 145,252.076917419 | +689.518465821 | 0.4747% | OK |
| 100 | 1,799,800.095590657 | 659,972.413440104 | 8,577.774654887 | 273.477567741 | 1,136,482.892106863 | 1,130,976.429927925 | +5,506.462178938 | 0.4868% | OK |
| 101 | 2,301,515.793430326 | 806,501.042836516 | 147,162.212142243 | 274.978266736 | 1,352,453.090541984 | 1,347,577.560184831 | +4,875.530357153 | 0.3617% | OK |
| 102 | 843,150.314854854 | 118,084.708059441 | 158,995.005398752 | 275.295649402 | 571,127.582889633 | 565,795.305747259 | +5,332.277142374 | 0.9424% | OK |
| 103 | 96,676.397144062 | 99,945.222911754 | 0 | 55.941119043 | 75,416.50710087 | 0 | +75,416.50710087 | ∞% | **DISCREPANCY >1%** |
| 104 | 3,062,974.342942101 | 340,321.172598343 | 8,693.224149186 | 277.763791095 | 2,725,130.208756965 | 2,713,682.182403477 | +11,448.026353488 | 0.4218% | OK |
| 105 | 1,922,185.110543305 | 451,644.439901403 | 196,110.26990872 | 278.242109146 | 1,278,846.154813373 | 1,274,152.158624036 | +4,693.996189337 | 0.3684% | OK |
| 106 | 2,376,992.760564706 | 838,637.534343767 | 53,273.846844962 | 280.301424879 | 1,487,849.779485208 | 1,484,801.077951098 | +3,048.70153411 | 0.2053% | OK |
| 107 | 1,412,317.613800533 | 389,715.783508211 | 259,169.24882428 | 280.014369471 | 768,379.69328733 | 763,152.567098571 | +5,227.126188759 | 0.6849% | OK |
| 108 | 1,530,526.515126298 | 442,784.567664372 | 38,862.313667517 | 282.752965238 | 1,054,527.794798477 | 1,048,596.880829171 | +5,930.913969306 | 0.5656% | OK |
| 109 | 1,408,931.281801709 | 626,919.832814457 | 70,026.821602108 | 283.413033374 | 715,168.920824128 | 711,701.21435177 | +3,467.706472358 | 0.4872% | OK |
| 110 | 2,492,975.470234944 | 653,602.202903777 | 114,615.901862446 | 283.551432247 | 1,729,173.602489589 | 1,724,473.814036474 | +4,699.788453115 | 0.2725% | OK |
| 111 | 3,442,705.711521751 | 686,963.807461569 | 337,717.260844435 | 284.903836693 | 2,421,207.348894766 | 2,417,739.739379054 | +3,467.609515712 | 0.1434% | OK |
| 112 | 1,865,773.736981223 | 925,696.620748774 | 85,660.90276259 | 286.726524821 | 858,535.424827937 | 854,129.486945038 | +4,405.937882899 | 0.5158% | OK |
| 113 | 1,426,485.253958655 | 682,486.06189204 | 24,443.416711791 | 287.823730979 | 723,051.673206953 | 719,267.951623845 | +3,783.721583108 | 0.5260% | OK |
| 114 | 1,394,599.529140702 | 373,811.447473431 | 206,408.950034287 | 287.314211199 | 818,971.595299437 | 814,091.817421785 | +4,879.777877652 | 0.5994% | OK |
| 115 | 1,527,502.977031515 | 857,494.572895518 | 0 | 289.241311538 | 674,736.540831756 | 669,719.162824459 | +5,017.378007297 | 0.7491% | OK |
| 116 | 498,333.033277975 | 129,797.29432009 | 46,438.331747847 | 289.098963532 | 322,456.895400295 | 321,808.308246506 | +648.587153789 | 0.2015% | OK |
| 117 | 1,577,397.159372488 | 289,424.602021989 | 110,042.604483153 | 291.659242872 | 1,182,843.699577966 | 1,177,638.293624474 | +5,205.405953492 | 0.4420% | OK |
| 118 | 2,024,059.920306349 | 317,975.810452995 | 100,459.246518578 | 291.259844712 | 1,610,600.660779731 | 1,605,333.603490064 | +5,267.057289667 | 0.3280% | OK |
| 119 | 1,493,346.518002894 | 776,537.885713869 | 0 | 293.161251235 | 720,015.01421028 | 716,515.47103779 | +3,499.54317249 | 0.4884% | OK |
| 120 | 2,546,747.829956271 | 174,299.388959302 | 172,136.198121378 | 293.028676989 | 2,203,582.648794662 | 2,200,019.214198602 | +3,563.43459606 | 0.1619% | OK |
| 121 | 2,766,657.954076083 | 1,234,341.176086707 | 0 | 294.990935554 | 1,535,311.697079252 | 1,532,021.787053822 | +3,289.91002543 | 0.2147% | OK |
| 122 | 494,842.449887162 | 246,465.034375573 | 41,001.922983965 | 296.071585423 | 212,399.087082206 | 207,079.420942201 | +5,319.666140005 | 2.5689% | **DISCREPANCY >1%** |
| 123 | 1,850,365.345164228 | 266,836.118126159 | 40,622.003819962 | 297.954694227 | 1,545,775.094847816 | 1,542,609.26852388 | +3,165.826323936 | 0.2052% | OK |
| 124 | 3,304,798.210103772 | 897,004.632666029 | 196,709.918539148 | 297.202246418 | 2,213,958.401766367 | 2,210,786.456652177 | +3,171.94511419 | 0.1434% | OK |
| 125 | 2,325,832.430010415 | 1,211,161.002135291 | 7,964.547109056 | 299.897169548 | 1,109,743.523235324 | 1,106,406.98359652 | +3,336.539638804 | 0.3015% | OK |
| 126 | 1,107,646.577479887 | 389,824.564372371 | 215,477.375953641 | 299.623123307 | 506,364.309783089 | 502,045.014030568 | +4,319.295752521 | 0.8603% | OK |
| 127 | 2,802,830.648141101 | 1,152,511.702574029 | 45.025794905 | 301.321344078 | 1,653,334.165428989 | 1,649,972.598428089 | +3,361.5670009 | 0.2037% | OK |
| 128 | 2,676,796.343533691 | 186,014.794503201 | 34,715.84016103 | 302.261683805 | 2,459,320.890947386 | 2,455,763.447185655 | +3,557.443761731 | 0.1448% | OK |

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
| after | 1 | 2,484,433.267183304 | 826,743.498270167 | 17,184.489564018 | 12.037807438 | 1,659,801.911049485 | 1,640,493.241541681 | +19,308.669507804 | 1.1770% | **DISCREPANCY >1%** |
| after | 5 | 2,998,776.18639265 | 1,488,257.228963462 | 3,606.286723825 | 178.281869905 | 1,525,624.786765432 | 1,506,734.388835458 | +18,890.397929974 | 1.2537% | **DISCREPANCY >1%** |
| after | 11 | 2,980,610.924767523 | 1,145,934.992162841 | 129,210.373329891 | 184.661334518 | 1,724,261.701431808 | 1,705,280.897940273 | +18,980.803491535 | 1.1130% | **DISCREPANCY >1%** |
| after | 12 | 3,360,251.048608388 | 1,522,132.651258694 | 0 | 186.292697991 | 1,856,786.281218517 | 1,837,932.104651703 | +18,854.176566814 | 1.0258% | **DISCREPANCY >1%** |
| after | 13 | 2,419,733.443340406 | 593,048.370031793 | 16,582.21426827 | 186.761479027 | 1,828,953.545731635 | 1,809,916.097561316 | +19,037.448170319 | 1.0518% | **DISCREPANCY >1%** |
| after | 14 | 3,059,208.25751119 | 1,180,371.405325601 | 129,813.067943654 | 187.278374931 | 1,767,865.10047261 | 1,748,836.505867004 | +19,028.594605606 | 1.0880% | **DISCREPANCY >1%** |
| after | 15 | 1,282,864.419571058 | 354,654.991781899 | 218,449.729029462 | 188.096217248 | 716,745.344324384 | 709,571.602542449 | +7,173.741781935 | 1.0109% | **DISCREPANCY >1%** |
| after | 16 | 292,255.056082386 | 106,491.578931276 | 9,125.331581653 | 190.086571499 | 219,971.692133916 | 176,448.058997958 | +43,523.633135958 | 24.6665% | **DISCREPANCY >1%** |
| after | 19 | 2,545,331.79842276 | 1,005,152.040322882 | 720.547697178 | 192.424919903 | 1,558,366.405120635 | 1,539,266.785482797 | +19,099.619637838 | 1.2408% | **DISCREPANCY >1%** |
| after | 20 | 3,151,578.118117668 | 1,318,019.090795353 | 0 | 194.646865479 | 1,852,324.660431886 | 1,833,364.380456836 | +18,960.27997505 | 1.0341% | **DISCREPANCY >1%** |
| after | 33 | 2,301,825.736058045 | 584,226.582883127 | 87,386.424445187 | 207.090754813 | 1,649,218.144611554 | 1,630,005.637974918 | +19,212.506636636 | 1.1786% | **DISCREPANCY >1%** |
| after | 36 | 627,885.239072002 | 131,286.518958231 | 37,538.851627533 | 211.003480314 | 464,701.809419829 | 458,848.865005924 | +5,852.944413905 | 1.2755% | **DISCREPANCY >1%** |
| after | 39 | 3,166,429.553195886 | 1,460,083.628868387 | 29,373.416255258 | 212.780998119 | 1,695,429.468557074 | 1,676,759.727074122 | +18,669.741482952 | 1.1134% | **DISCREPANCY >1%** |
| after | 40 | 326,999.733918726 | 74,153.423804429 | 128,034.305600759 | 213.517385183 | 176,741.448835177 | 124,598.487128355 | +52,142.961706822 | 41.8487% | **DISCREPANCY >1%** |
| after | 41 | 2,975,167.611654056 | 973,744.279818439 | 217,217.580368984 | 214.976763401 | 1,802,863.651482052 | 1,783,990.774703232 | +18,872.87677882 | 1.0579% | **DISCREPANCY >1%** |
| after | 52 | 2,952,111.070821844 | 1,077,162.060889068 | 90.395967424 | 225.761205227 | 1,893,408.234763284 | 1,874,632.852760125 | +18,775.382003159 | 1.0015% | **DISCREPANCY >1%** |
| after | 56 | 2,646,400.264136623 | 774,485.915914827 | 13,997.922202342 | 229.282503585 | 1,876,658.38095267 | 1,857,687.143515869 | +18,971.237436801 | 1.0212% | **DISCREPANCY >1%** |
| after | 57 | 825,771.111178675 | 317,596.320183395 | 70,615.680938887 | 230.648963678 | 442,264.988899287 | 437,328.461092715 | +4,936.527806572 | 1.1287% | **DISCREPANCY >1%** |
| after | 58 | 297,297.290570974 | 161,966.767161337 | 0 | 81.223144219 | 228,682.61780516 | 135,249.300265418 | +93,433.317539742 | 69.0822% | **DISCREPANCY >1%** |
| after | 67 | 818,229.005618122 | 275,635.793013465 | 132,264.88633962 | 240.548133071 | 415,753.341684633 | 410,087.778131966 | +5,665.563552667 | 1.3815% | **DISCREPANCY >1%** |
| after | 78 | 650,043.486811965 | 64,569.373140067 | 93,439.420139376 | 252.779702556 | 497,791.007489218 | 491,781.913829966 | +6,009.093659252 | 1.2219% | **DISCREPANCY >1%** |
| after | 82 | 637,040.829536987 | 51,351.621683119 | 203,656.438410755 | 255.745850228 | 387,646.14878236 | 381,777.023592885 | +5,869.125189475 | 1.5373% | **DISCREPANCY >1%** |
| after | 90 | 140,123.393099798 | 116,392.269522858 | 0 | 100.032188443 | 140,001.653399788 | 23,631.091388497 | +116,370.562011291 | 492.4468% | **DISCREPANCY >1%** |
| after | 96 | 672,934.803045531 | 223,924.687813565 | 67,499.464576751 | 269.313063521 | 387,490.176423779 | 381,241.337591694 | +6,248.838832085 | 1.6390% | **DISCREPANCY >1%** |
| after | 103 | 96,676.397144062 | 99,945.222911754 | 0 | 55.941119043 | 75,416.50710087 | 0 | +75,416.50710087 | ∞% | **DISCREPANCY >1%** |
| after | 122 | 494,842.449887162 | 246,465.034375573 | 41,001.922983965 | 296.071585423 | 212,399.087082206 | 207,079.420942201 | +5,319.666140005 | 2.5689% | **DISCREPANCY >1%** |

## Accounting definitions

- Actual staked alpha: sum of every `TotalHotkeyAlpha(hotkey, netuid)` value.
- Pending alpha: `PendingServerEmission + PendingValidatorEmission + PendingRootAlphaDivs + PendingOwnerCut + PendingBasketDeposits`.
- Calculated staked alpha: saturating `SubnetAlphaOut - AlphaBurned - SubnetProtocolAlpha - pending alpha`.
- Discrepancy percentage: `abs(actual - calculated) / calculated × 100`.
