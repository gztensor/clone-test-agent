#!/usr/bin/env bash
set -euo pipefail

CLONE_DIR="../clones/mainnet-clone"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SUBTENSOR_DIR="$(cd -- "${SCRIPT_DIR}/../../../subtensor" && pwd)"

cd "${SUBTENSOR_DIR}"

if [[ "${PRESERVE_CLONE:-0}" != "1" ]]; then
  rm -rf "${CLONE_DIR}"
fi

SEALING_ARGS=()
if [[ -n "${SEALING_MS:-}" ]]; then
  SEALING_ARGS=(--sealing "${SEALING_MS}")
fi

exec target/release/node-subtensor \
  --base-path ../clones/mainnet-clone \
  --chain ../clones/mainnet-clone-chainspec.json \
  --database paritydb \
  --state-pruning archive \
  --force-authoring \
  --alice \
  --validator \
  "${SEALING_ARGS[@]}" \
  --unsafe-force-node-key-generation
