# Receive root dividends through subnet 50

This guide is for a root validator that already has 98 TAO staked to its hotkey. The goal is to register the same hotkey on subnet 50, qualify it to set weights, and watch root dividends accumulate.

Subnet conditions and prices change. Check the live values immediately before each transaction.

## 1. Set your wallet details

```bash
WALLET="<coldkey wallet name>"
HOTKEY_NAME="<root validator hotkey wallet name>"
COLDKEY_SS58="<coldkey SS58>"
HOTKEY_SS58="<root validator hotkey SS58>"
```

## 2. Check root and subnet 50

```bash
btcli root list \
  --coldkey "$COLDKEY_SS58" \
  --network finney \
  --json

btcli subnets metagraph 50 \
  --network finney \
  --json

btcli subnets hyperparameters 50 \
  --network finney

btcli subnets burn-cost 50 \
  --network finney
```

The 1,000-alpha weight-setting threshold is global. Recheck `SubtensorModule.StakeThreshold` in Polkadot.js Apps if it may have changed.

Confirm that:

- your hotkey still has 98 TAO on root;
- SN50 registration is open and you have enough free TAO for the burn and fees;
- commit-reveal is off;
- the weights version is still 100;
- the weight-setting threshold is still 1,000;
- SN50 still has many consensus-positive targets and available validator permits.

## 3. Register the root hotkey on SN50

Preview the transaction:

```bash
btcli subnets register \
  --netuid 50 \
  --hotkey "$HOTKEY_SS58" \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$HOTKEY_NAME" \
  --dry-run
```

Check the hotkey, netuid, burn, and fee. Then submit by running the same command without `--dry-run`. Save the finalized extrinsic hash and find your new UID:

```bash
btcli subnets metagraph 50 \
  --network finney \
  --json
```

## 4. Fund the SN50 stake: choose one option

Acquire at least 1,000 actual SN50 alpha, preferably with a safety margin. Choose either option A or B.

### Option A — keep all 98 TAO on root and buy SN50 alpha

Use additional free TAO to buy at least 1,000 SN50 alpha, preferably with a safety margin. The required TAO amount depends on the live SN50 price and slippage.

Set the amount of new TAO indicated by the live price, then preview:

```bash
NEW_TAO="<TAO amount expected to buy at least 1,000 SN50 alpha>"

btcli stake add \
  --netuid 50 \
  --hotkey "$HOTKEY_SS58" \
  --amount "$NEW_TAO" \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$HOTKEY_NAME" \
  --dry-run
```

Confirm the expected alpha and slippage. Submit by removing `--dry-run`. This option preserves all 98 TAO on root.

### Option B — move part of the existing root stake to SN50

Moving 6 TAO was sufficient at the tested SN50 price, but the received alpha changes with the pool. Preview before submitting:

```bash
btcli stake move \
  --origin-hotkey "$HOTKEY_SS58" \
  --origin-netuid 0 \
  --dest-hotkey "$HOTKEY_SS58" \
  --dest-netuid 50 \
  --amount 6 \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$HOTKEY_NAME" \
  --dry-run
```

Confirm that the move buys at least 1,000 SN50 alpha. Submit by removing `--dry-run`. This leaves approximately 92 TAO on root, so check that the lower root stake does not create unacceptable root-pruning risk. If the root position is temporarily locked, wait for its unlock interval.

## 5. Verify stake and wait for a validator permit

```bash
btcli stake show \
  --netuid 50 \
  --hotkey "$HOTKEY_SS58" \
  --coldkey "$COLDKEY_SS58" \
  --network finney \
  --json

btcli root list \
  --coldkey "$COLDKEY_SS58" \
  --network finney \
  --json
```

Verify that the SN50 position contains at least the live threshold, currently:

```text
SN50 alpha >= 1,000
```

Then wait for an SN50 epoch and poll the metagraph until your hotkey has `validator_permit = true`:

```bash
btcli subnets metagraph 50 \
  --network finney \
  --json
```

With a 360-block tempo, the wait is at most about 72 minutes at 12 seconds per block.

## 6. Set uniform weights

Set the UID assigned during registration:

```bash
OWN_UID="<your SN50 UID>"
UIDS=$(python3 -c "u=int('$OWN_UID'); print(','.join(str(i) for i in range(256) if i != u))")
WEIGHTS=$(python3 -c "print(','.join(['1'] * 255))")
```

These commands assume SN50 remains full at 256 UIDs. Preview the weight transaction:

```bash
btcli weights set \
  --netuid 50 \
  --uids "$UIDS" \
  --weights "$WEIGHTS" \
  --version-key 100 \
  --network finney \
  --wallet "$WALLET" \
  --wallet-hotkey "$HOTKEY_NAME" \
  --dry-run
```

Confirm the UID list and live version key, then submit by removing `--dry-run`. Save the finalized extrinsic hash.

## 7. Check rewards and root dividends

After the next SN50 epoch, find your hotkey in:

```bash
btcli subnets metagraph 50 \
  --network finney \
  --json
```

Look for:

- `validator_permit = true`;
- a recent weight update;
- `validator_trust > 0`;
- `dividends > 0`.

Your hotkey's own consensus score may remain zero. Validator rewards come from its outgoing weights overlapping consensus-positive targets.

To see the earliest root-alpha accumulation, open Polkadot.js Apps against mainnet and query:

```text
SubtensorModule.RootAlphaDividendsPerSubnet(50, HOTKEY_SS58)
```

To check processed root-basket positions:

```bash
btcli query root-basket-owed-breakdown \
  --coldkey "$COLDKEY_SS58" \
  --network finney \
  --json
```

The basket query may initially be empty because small dividends wait for the processing threshold. Keep checking after later SN50 epochs, and refresh the weight vector before it becomes inactive.
