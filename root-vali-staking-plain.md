# Self-funded root dividends through subnet 50

This procedure is for a validator that is already registered on root and owns **98 TAO of root stake**, with no additional delegation available. The tested route is to register the same hotkey on subnet 50 (Synth), move a small part of its existing root stake into SN50 alpha, and set a dense plaintext weight vector.

This is not a promise of profit or continued registration. Subnet conditions, pool price, registration cost, validator permits, and consensus can change. Recheck every value immediately before using real funds.

## What the clone experiment proved

The saved test reproduced the proposed route against a mainnet clone on runtime 447. Its final end-to-end run produced:

| Stage | Observed result |
|---|---:|
| Starting root stake | 98 TAO |
| Effective alpha while all 98 TAO remained on root | 17.64 alpha |
| Plaintext weight submission at that point | Rejected: `NotEnoughStakeToSetWeights` |
| Root stake moved to SN50 | 6 TAO |
| Root stake remaining | 92 TAO |
| SN50 alpha received | 1,176.376139329 alpha |
| Effective alpha after the move | 1,192.936139328 alpha |
| SN50 validator permit after an epoch | Yes |
| Targets in the uniform vector | All 255 registered non-self UIDs |
| Validator trust after the earning epoch | 46,133 raw u16 |
| Validator dividends after the earning epoch | 16 raw u16 |
| Root alpha generated | 659 alpha rao |
| Pending root-basket deposit | 1,977 alpha rao |

The effective-alpha calculation at the tested state was:

```text
SN50 alpha + (root TAO × TAO weight)
= 1,176.376139329 + (92 × 0.18)
= 1,192.936139328 effective alpha
```

The threshold was **1,000 alpha**, not 1,000 TAO. `TaoWeight` converts the root TAO contribution into alpha-equivalent stake before it is added to the validator's local SN50 alpha. Keeping all 98 TAO on root therefore yielded only `98 × 0.18 = 17.64 alpha`, so registration alone was not sufficient.

SN50 was full at 256/256 neurons. Immediately before the final run, it had 236 consensus-positive and incentive-positive UIDs, 9 of 64 validator permits in use, a 65,535-block immunity period, commit-reveal disabled, `weights_version = 100`, a 360-block tempo, and a 100-block weight-setting rate limit. The original research measured 235 positive UIDs and 8 permits at [block 8,865,711](https://bittensor.ai/explorer/block/8865711); the small differences are consistent with state changing between observations.

One terminology correction matters: the new validator's own `consensus` and `incentive` scores remained zero in the successful clone run. A validator does not need its own UID to become a consensus-positive miner. Its **outgoing weights** must overlap targets supported by other validators. That overlap produced non-zero validator trust and dividends, which produced root alpha.

## Risks to check before proceeding

- The operator needs free TAO for SN50's floating registration burn and transaction fees. The 98 TAO already staked on root cannot pay the burn unless some is first unstaked. The clone's pristine snapshot showed a burn of about 0.8 TAO, but repeated clone registrations moved it higher; query the live cost.
- Moving 6 TAO out of root leaves only 92 TAO on root. Check the lowest root stake and the hotkey's pruning position first. Do not proceed if reducing root stake creates unacceptable root deregistration risk.
- Six TAO was enough at the tested pool price. It is not a permanent constant. The received alpha depends on the live SN50 pool price, fees, and slippage. Require a safety margin above the 1,000-alpha threshold.
- A recently modified root position may be temporarily locked. If `stake move` returns `RootStakeLocked`, wait for the root stake unlock interval; do not work around the protection.
- SN50 is full. Registration prunes a neuron and gives the replacement immunity for 65,535 blocks, approximately 9.1 days at 12 seconds per block. After immunity, positive emission improves survival but does not guarantee it.
- A uniform vector is a generic experiment, not subnet-specific validation. It can earn a small dividend while consensus is dense, but future consensus or subnet policy may make it ineffective.
- Root alpha may be positive while `betaBasketRuntimeApi::getRootBasketPositions` is still empty. Small accruals wait below the processing/claim threshold. An empty basket immediately after the first earning epoch is not proof of failure.

## 1. Set the operator's public identifiers

Never put a mnemonic in these variables.

```bash
WALLET="<validator coldkey wallet name>"
ROOT_HOTKEY_NAME="<existing root hotkey wallet name>"
COLDKEY_SS58="<validator coldkey SS58>"
ROOT_HOTKEY_SS58="<existing root hotkey SS58>"
```

## 2. Recheck root and SN50 before spending anything

Confirm the existing 98 TAO root position and the hotkey's root pruning margin:

```bash
btcli root list \
  --coldkey "$COLDKEY_SS58" \
  --network finney \
  --json

btcli subnets metagraph 0 \
  --network finney \
  --json
```

Then inspect SN50:

```bash
btcli subnets metagraph 50 \
  --network finney \
  --json

btcli subnets hyperparameters 50 \
  --network finney

btcli subnets burn-cost 50 \
  --network finney
```

Continue only if all of these remain true:

- registration is open and the burn is affordable from free balance;
- neuron immunity is still acceptable;
- substantially fewer than 64 validator permits are occupied;
- most registered target UIDs still have positive consensus/incentive;
- commit-reveal is off;
- the weights version is still 100, or the command below is updated to the new live version;
- the same hotkey still has enough root pruning margin after reducing root stake from 98 to about 92 TAO.

Record the live effective-alpha threshold and TAO weight as well. The following calculations assume the tested values of 1,000 alpha and 0.18 alpha per root TAO respectively.

## 3. Register the existing root hotkey on SN50

Preview the registration:

```bash
btcli subnets register \
  --netuid 50 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$ROOT_HOTKEY_NAME" \
  --dry-run
```

Verify the signer, hotkey, netuid, live burn, and fee. If correct, submit the same command without `--dry-run`:

```bash
btcli subnets register \
  --netuid 50 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$ROOT_HOTKEY_NAME"
```

Save the finalized extrinsic hash. Query the metagraph again and record the newly assigned UID:

```bash
btcli subnets metagraph 50 \
  --network finney \
  --json
```

## 4. Move 6 TAO of root stake into SN50 alpha

This is a cross-subnet stake move owned and signed by the same coldkey. It does not require another wallet. Preview it first:

```bash
btcli stake move \
  --origin-hotkey "$ROOT_HOTKEY_SS58" \
  --origin-netuid 0 \
  --dest-hotkey "$ROOT_HOTKEY_SS58" \
  --dest-netuid 50 \
  --amount 6 \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$ROOT_HOTKEY_NAME" \
  --dry-run
```

Cross-subnet moves swap through the pools and can incur fees and slippage. Verify that the preview moves 6 TAO from this exact hotkey on root to the same hotkey on SN50. If the expected received alpha has changed materially, stop and recalculate instead of blindly submitting 6 TAO.

If correct, submit without `--dry-run`:

```bash
btcli stake move \
  --origin-hotkey "$ROOT_HOTKEY_SS58" \
  --origin-netuid 0 \
  --dest-hotkey "$ROOT_HOTKEY_SS58" \
  --dest-netuid 50 \
  --amount 6 \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$ROOT_HOTKEY_NAME"
```

Save the finalized extrinsic hash.

## 5. Verify effective alpha before setting weights

Read both positions:

```bash
btcli stake show \
  --netuid 0 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --coldkey "$COLDKEY_SS58" \
  --network finney \
  --json

btcli stake show \
  --netuid 50 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --coldkey "$COLDKEY_SS58" \
  --network finney \
  --json
```

Calculate:

```text
effective alpha = SN50 alpha + (remaining root TAO × current TAO weight in alpha per TAO)
```

Do not set weights unless the result is above the live alpha-denominated threshold with a useful safety margin. In the clone, 6 TAO produced about 1,176.38 SN50 alpha and left 92 TAO on root, giving about 1,192.94 effective alpha—a 19.3% margin above the 1,000-alpha threshold.

If the result is below the threshold, do not keep retrying the weight transaction. Recheck the live pool calculation and decide whether the extra exposure and root-pruning risk of moving a little more stake is acceptable.

## 6. Wait for a validator permit

A newly registered, sufficiently staked hotkey normally needs an SN50 epoch before the validator permit appears. SN50's tested tempo was 360 blocks, at most about 72 minutes at 12 seconds per block.

Poll:

```bash
btcli subnets metagraph 50 \
  --network finney \
  --json
```

Locate `ROOT_HOTKEY_SS58` and continue only when `validator_permit` is true. Do not require its own `consensus` to be positive; that is not the condition proven by this experiment.

## 7. Build a dense uniform non-self weight vector

Set the UID assigned in step 3:

```bash
OWN_UID="<the hotkey's SN50 UID>"
```

At 256/256 occupancy, these commands create all UID numbers except the validator's own UID and assign every target the same relative weight:

```bash
UIDS=$(python3 -c "u=int('$OWN_UID'); print(','.join(str(i) for i in range(256) if i != u))")
WEIGHTS=$(python3 -c "print(','.join(['1'] * 255))")
```

Inspect the strings before signing:

```bash
echo "$UIDS"
echo "$WEIGHTS"
```

This relies on SN50 still being full at 256 UIDs. If occupancy or UID bounds differ, regenerate the vector from the live registered UIDs instead of using `range(256)`.

## 8. Submit plaintext weights

Preview the transaction:

```bash
btcli weights set \
  --netuid 50 \
  --uids "$UIDS" \
  --weights "$WEIGHTS" \
  --version-key 100 \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$ROOT_HOTKEY_NAME" \
  --dry-run
```

Verify that commit-reveal is still off, the version key matches the live SN50 hyperparameter, and all targets are registered non-self UIDs. Then submit without `--dry-run`:

```bash
btcli weights set \
  --netuid 50 \
  --uids "$UIDS" \
  --weights "$WEIGHTS" \
  --version-key 100 \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$ROOT_HOTKEY_NAME"
```

Save the finalized extrinsic hash. If the chain reports a weight-setting rate-limit error, wait until the 100-block interval has elapsed. If it reports insufficient stake, return to step 5 and use live values; do not assume the clone's conversion still applies.

## 9. Wait for an earning epoch and verify the right metrics

After the next SN50 epoch, inspect the hotkey:

```bash
btcli subnets metagraph 50 \
  --network finney \
  --json
```

The practical success signals are:

- `validator_permit = true`;
- recent weight activity/last update;
- `validator_trust > 0`;
- `dividends > 0`.

The validator's own `consensus` and `incentive` may remain zero. That happened in the successful clone run and does not contradict positive validator dividends.

For the earliest direct proof of root accrual, open Polkadot.js Apps against mainnet and query chain state:

```text
SubtensorModule.RootAlphaDividendsPerSubnet(50, ROOT_HOTKEY_SS58)
```

A value above zero proves that the SN50 validator dividend generated root alpha. The corresponding basket API may remain empty until enough alpha clears the processing threshold:

```bash
btcli query root-basket-owed-breakdown \
  --coldkey "$COLDKEY_SS58" \
  --network finney \
  --json
```

Do not report failure solely because this command initially returns no positions. Continue checking after later SN50 epochs. Keep the weight vector fresh according to the live rate limit and activity cutoff, and re-evaluate the strategy if consensus coverage, registration pressure, or the hotkey's pruning position changes.

## Bottom line

The SN50 research is experimentally supported for its narrow objective: a self-funded root validator starting with 98 TAO can obtain positive validator/root dividends without subnet-specific scoring by moving roughly 6 TAO from root into SN50 alpha and uniformly weighting the registered non-self neurons.

It is not correct to say that registration alone, or 98 TAO left entirely on root, meets the 1,000-alpha effective-stake threshold. Root TAO contributes only after conversion by `TaoWeight`; at the tested value, 98 TAO contributed 17.64 effective alpha. It is also not necessary for the new validator's own consensus score to become positive. The proven mechanism is consensus overlap in its outgoing weights, producing positive validator trust, validator dividends, and then root alpha.
