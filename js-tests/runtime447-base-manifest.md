# Runtime-447 pristine base manifest

Created: 2026-08-18

## Mainnet anchor

- Finalized mainnet block: 8,873,778
- Block hash: `0x2970d258fc8894702e0a778a2b33719d0251be9fe1bf1349c9bb2481c2aa0339`
- State root: `0xe2bc4aae768478ab93800e1fd4a64bdb509f49299c1ed72d17107dc0805abea7`
- Runtime: `node-subtensor/447`
- Header was independently returned byte-for-byte by `wss://bittensor-finney.api.onfinality.io/public` and `wss://archive.chain.opentensor.ai`.
- Source checkout: tag `v447`, commit `1f090af85d1771c5d8ece1f0910576fbd129906e`.

The ordinary GRANDPA warp provider could not verify current peers because their finished proof contained only one current header and no historical authority transitions. The clone was therefore synced with Substrate's trusted-target mode using the cross-checked finalized header above. The downloaded state trie was verified against that header's state root before export.

## Local certification

- Saved test: `js-tests/tests/certify-runtime447-base.js`
- Saved log: `js-tests/temp/runtime447-base-certification.log`
- Full accounting report: `js-tests/runtime447-base-certification.md`
- Final saved test result: passed end-to-end
- Certified local finalized block: 8 (`0x6794b88397defbd63e9992ee025171e36886c70e988e1831e7cbc055cf21c56f`)
- Certified local state root: `0x53c4be664ca1b7f23c37f7d172b32c6c545be01e9b16ced85cccf9f66f6c4384`
- Local genesis hash: `0x4eee26393335f1aafcaa6aa724efdadb683b97daae987ecef7df948e88c0726f`
- Active networks: 129 total, including 128 alpha subnets
- All three runtime-446 accounting migration markers: set
- Largest absolute discrepancy: subnet 104, `+11,448.026117726 α`
- Accounting-state verdict: accepted

## Preserved files

- Pristine database: `../../clones/mainnet-clone-runtime447-pristine-8873778`
- Pristine chainspec: `../../clones/mainnet-clone-runtime447-pristine-8873778-chainspec.json`
- Database files: 283
- Database logical bytes: 1,650,666,261
- Canonical database-tree SHA-256: `fd05e66b2833ab452e0a6e645cc364519a8aeb99a8fcfb0b3d0ecc5495a713f4`
- Chainspec bytes: 1,040,200,580
- Chainspec SHA-256: `ebdeed4b86f968c2111cf0457ee194b7bc97db07292131d1824a91ea382f7f45`

The working and pristine database trees had identical file counts, logical byte counts, and canonical tree hashes immediately after the copy. The working and pristine chainspecs also had identical sizes and SHA-256 hashes.

## Sync tooling

- Final clone-sync node SHA-256: `6486a40b801d10964aab811e1e93c8d8dcbbe8bad492ae3c537edd58bfd36e98`
- The sync-only node patch is isolated under `.runtime-search/subtensor-sync-v447` and does not alter runtime WASM or candidate execution logic.
