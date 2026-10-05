"""Generate a real native timelock and fetch its public quicknet reveal pulse.

The JS test controls epoch scheduling; this helper exercises ciphertext encoding and
cryptographic reveal, rather than claiming to verify the SDK's wall-clock scheduler.
"""
import json
import sys
import time
import urllib.request
import bittensor_core

state = json.load(sys.stdin)
commit, reveal_round = bittensor_core.get_encrypted_commit_v2(
    uids=state['uids'], weights=state['values'], version_key=state['version'],
    last_epoch_block=state['block'], pending_epoch_at=0, subnet_epoch_index=0,
    tempo=1, blocks_since_last_step=0, current_block=state['block'],
    subnet_reveal_period_epochs=1, block_time=0.25,
    hotkey=bytes.fromhex(state['hotkey']),
)
url = f'https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971/public/{reveal_round}'
deadline = time.monotonic() + 45
while True:
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            pulse = json.load(response)
        break
    except Exception:
        if time.monotonic() > deadline:
            raise
        time.sleep(1)
assert pulse['round'] == reveal_round
print(json.dumps({'commit': bytes(commit).hex(), 'round': reveal_round,
                  'randomness': pulse['randomness'], 'signature': pulse['signature']}))
