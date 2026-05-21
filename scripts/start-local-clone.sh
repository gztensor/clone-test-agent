#!/usr/bin/env bash
set -euo pipefail

CLONE_DIR="../clones/mainnet-clone"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SUBTENSOR_DIR="$(cd -- "${SCRIPT_DIR}/../../../subtensor" && pwd)"

cd "${SUBTENSOR_DIR}"

rm -rf "${CLONE_DIR}"

exec target/release/node-subtensor \
  --base-path ../clones/mainnet-clone \
  --chain ../clones/mainnet-clone-chainspec.json \
  --database paritydb \
  --force-authoring \
  --alice \
  --validator \
  --unsafe-force-node-key-generation
