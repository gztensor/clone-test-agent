# Next mainnet iteration: delegated stake and childkey setup

The root validator is already registered, and its owner has 98 TAO staked. The wallet team—not the validator owner—will delegate the additional TAO directly to the existing root hotkey.

The validator owner must **not** receive or stake the wallet team's funds. The two actions have different signers:

1. The **wallet team** signs the 902 TAO root-stake delegation.
2. The **validator owner** signs the childkey transaction because only the coldkey that owns the parent hotkey can set its children.

The chain checks the total stake attached to the parent hotkey across all coldkeys. Therefore:

```text
Owner stake:          98 TAO
Wallet-team stake:   902 TAO
Total hotkey stake: 1000 TAO
```

The wallet team retains ownership and withdrawal control over its 902 TAO position. The validator owner's position remains 98 TAO.

The validator owner still controls the parent hotkey's child configuration. Setting a 100% child therefore directs the stake weight of the full 1,000 TAO—including the wallet team's delegated 902 TAO—to the selected child on subnet 107. The wallet team should approve that arrangement before staking.

## Childkey target

Use the same child validator as the successful clone experiment:

```text
Subnet:       107
UID:          0
Child hotkey: 5E4WJ2tAZVDTRVvSFtR1jJqAX4CokgCt9JYmPzJMWDmUT3Ju
Proportion:   100%
```

This target was rechecked on mainnet at finalized block **8,866,506**. It had `validator_permit = true`, dividends of 48,660, recent weight activity, and childkey take 0. Recheck it immediately before signing because permits and registrations can change.

## 1. Set the public identifiers

These variables contain wallet names and public SS58 addresses only. Never put a mnemonic in them.

```bash
# Wallet-team signer and stake owner
WALLET_TEAM_WALLET="<wallet team's coldkey wallet name>"
WALLET_TEAM_COLDKEY_SS58="<wallet team's coldkey SS58>"

# Validator owner and existing root hotkey
OWNER_WALLET="<validator owner's coldkey wallet name>"
OWNER_ROOT_HOTKEY_NAME="<registered root hotkey wallet name>"
OWNER_COLDKEY_SS58="<validator owner's coldkey SS58>"
ROOT_HOTKEY_SS58="<registered root hotkey SS58>"
```

## 2. Confirm the starting positions

Confirm that the owner's coldkey has 98 TAO staked to `ROOT_HOTKEY_SS58`:

```bash
btcli root list \
  --coldkey "$OWNER_COLDKEY_SS58" \
  --network finney \
  --json
```

Check whether the wallet team already has any stake on the same root hotkey:

```bash
btcli root list \
  --coldkey "$WALLET_TEAM_COLDKEY_SS58" \
  --network finney \
  --json
```

Also confirm that the validator is still registered and inspect its total stake:

```bash
btcli subnets metagraph 0 --network finney --json
```

If the total root stake attached to the hotkey is exactly 98 TAO, the wallet team should add 902 TAO. If there is already other delegated stake, add only:

```text
1000 TAO - current total hotkey stake
```

Do not add anything if the total is already at least 1,000 TAO.

## 3. Wallet team delegates 902 TAO

The wallet team needs at least 902 TAO plus transaction fees in its free balance. It stakes directly to the existing root hotkey; it does not transfer TAO to the validator owner.

The wallet team previews the transaction using its own wallet:

```bash
btcli root subscribe \
  --amount 902 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --network finney \
  --wallet "$WALLET_TEAM_WALLET" \
  --dry-run
```

Verify all of the following in the preview:

- the signer is the wallet team's coldkey;
- the destination is `ROOT_HOTKEY_SS58`;
- the netuid is 0/root;
- the amount is 902 TAO;
- this is a stake operation, not a balance transfer.

If correct, the wallet team submits the same transaction without `--dry-run`:

```bash
btcli root subscribe \
  --amount 902 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --network finney \
  --wallet "$WALLET_TEAM_WALLET"
```

Save the finalized extrinsic hash.

## 4. Verify the delegated stake

The wallet team's root position should now show 902 TAO staked to the validator hotkey:

```bash
btcli root list \
  --coldkey "$WALLET_TEAM_COLDKEY_SS58" \
  --network finney \
  --json
```

The validator owner's position should still show 98 TAO:

```bash
btcli root list \
  --coldkey "$OWNER_COLDKEY_SS58" \
  --network finney \
  --json
```

Finally, check the root metagraph again:

```bash
btcli subnets metagraph 0 --network finney --json
```

The total stake for `ROOT_HOTKEY_SS58` must now be at least 1,000 TAO before the owner attempts to set a childkey.

## 5. Recheck the child validator

```bash
btcli subnets metagraph 107 --network finney --json
```

Locate this exact hotkey:

```text
5E4WJ2tAZVDTRVvSFtR1jJqAX4CokgCt9JYmPzJMWDmUT3Ju
```

Continue only if it is still registered on subnet 107, still has `validator_permit = true`, and has current non-zero dividends/weight activity. Stop and choose a new child if any of those checks fail.

## 6. Validator owner saves the existing child configuration

The childkey command replaces the complete child list for this parent on subnet 107. The validator owner records the current list first:

```bash
btcli stake child get \
  --netuid 107 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --network finney \
  --json
```

## 7. Validator owner childkeys 100% to the target

The validator owner—not the wallet team—previews this transaction:

```bash
btcli stake child set \
  --netuid 107 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --children '[[1.0,"5E4WJ2tAZVDTRVvSFtR1jJqAX4CokgCt9JYmPzJMWDmUT3Ju"]]' \
  --network finney \
  --wallet "$OWNER_WALLET" \
  --wallet-hotkey "$OWNER_ROOT_HOTKEY_NAME" \
  --dry-run
```

Verify that the signer is the coldkey that owns `ROOT_HOTKEY_SS58`, and that the preview shows netuid 107, the target child hotkey, and a 100% proportion. Then the validator owner submits:

```bash
btcli stake child set \
  --netuid 107 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --children '[[1.0,"5E4WJ2tAZVDTRVvSFtR1jJqAX4CokgCt9JYmPzJMWDmUT3Ju"]]' \
  --network finney \
  --wallet "$OWNER_WALLET" \
  --wallet-hotkey "$OWNER_ROOT_HOTKEY_NAME"
```

Save the finalized extrinsic hash.

## 8. Wait for activation and check the wallet team's earnings

The current childkey cooldown is 7,200 blocks, roughly 24 hours at 12 seconds per block. After the cooldown, allow a subnet-107 epoch to run; its tempo is 360 blocks, at most roughly another 72 minutes.

Poll until the child is active:

```bash
btcli stake child get \
  --netuid 107 \
  --hotkey "$ROOT_HOTKEY_SS58" \
  --network finney \
  --json
```

After a subsequent subnet-107 earning epoch, query the wallet team's coldkey:

```bash
btcli query root-basket-owed-breakdown \
  --coldkey "$WALLET_TEAM_COLDKEY_SS58" \
  --network finney \
  --json

btcli root list \
  --coldkey "$WALLET_TEAM_COLDKEY_SS58" \
  --network finney \
  --json
```

Success is a positive accrued/owed position for `ROOT_HOTKEY_SS58` under the wallet team's coldkey. Because the wallet team owns 902 of the 1,000 TAO stake, it should receive approximately 90.2% of the staker entitlement generated by this position, subject to rounding and timing.

The validator owner can separately query `OWNER_COLDKEY_SS58`; its 98 TAO stake should receive approximately 9.8%. The smaller owner position may take longer to appear if its entitlement remains below the basket processing threshold.

An empty basket result immediately after the first epoch is not a failure: pending dividends may need additional epochs to clear the value threshold and processing queue.

The 1,000 TAO threshold and childkey-related errors are described in the official [Bittensor chain error reference](https://www.bittensor.com/docs/errors/chain).
