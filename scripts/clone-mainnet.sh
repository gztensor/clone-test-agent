#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SUBTENSOR_DIR="$(cd -- "${SCRIPT_DIR}/../../../subtensor" && pwd)"

cd "${SUBTENSOR_DIR}"

CLONE_DIR="../clones/mainnet-clone"
CHAINSPEC_FILE="../clones/mainnet-clone-chainspec.json"

NEEDS_RESYNC=false

# Resync only if the chainspec file is missing. A missing clone directory is OK:
# it means the local chain should restart from the existing spec.
if [ ! -f "${CHAINSPEC_FILE}" ]; then
  echo "Chainspec file is missing."
  NEEDS_RESYNC=true
else
  echo "Chainspec file exists, keeping existing data."
fi

if [ "${NEEDS_RESYNC}" = true ]; then
  echo "Deleting and rebuilding clone data..."

  rm -rf "${CLONE_DIR}"
  rm -f "${CHAINSPEC_FILE}"

  target/release/node-subtensor build-patched-spec \
    --base-path "${CLONE_DIR}" \
    --chain chainspecs/raw_spec_finney.json \
    --sync warp \
    --bootnodes /dns/bootnode.finney.chain.opentensor.ai/tcp/30333/ws/p2p/12D3KooWRwbMb85RWnT8DSXSYMWQtuDwh4LJzndoRrTDotTR5gDC \
    --reserved-nodes /ip4/77.42.7.244/tcp/30333/ws/p2p/12D3KooWT2cAb8rVoWDBBEtEiqu2aiimrgdoJRa6fS4XFHLrp6wy \
    --reserved-nodes /ip4/77.42.7.243/tcp/30333/ws/p2p/12D3KooWARWRF9UtJqMUtK3tB5Gv63QcNhBSzq6LWQ7YrXXd9DTA \
    --reserved-nodes /ip4/77.42.7.165/tcp/30333/ws/p2p/12D3KooWHMR9iRzUDqo8Lrr9T1ojc85VY9DTqw2HBGUkoRWWQQKK \
    --reserved-nodes /ip4/77.42.7.164/tcp/30333/ws/p2p/12D3KooWMGEb94VtNQPCKmdcjEhJDSyYAZqd3gY7cJoSDbUwDdHD \
    --reserved-nodes /ip4/77.42.7.242/tcp/30333/ws/p2p/12D3KooWPVwJpoFahd2HQk1fjv1UR6TZe9Siuyx3TdPPg2bJK1a4 \
    --output "${CHAINSPEC_FILE}"
fi

cd ../agents/codex-tester
