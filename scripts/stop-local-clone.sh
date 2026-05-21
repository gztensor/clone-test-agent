#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SUBTENSOR_DIR="$(cd -- "${SCRIPT_DIR}/../../../subtensor" && pwd)"
CLONE_BASE_PATH="${SUBTENSOR_DIR}/../clones/mainnet-clone"

pkill -f "node-subtensor.*--base-path ${CLONE_BASE_PATH}" \
  || pkill -f "node-subtensor.*--base-path ../clones/mainnet-clone" \
  || true
