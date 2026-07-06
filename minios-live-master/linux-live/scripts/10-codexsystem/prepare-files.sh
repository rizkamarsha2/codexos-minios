#!/bin/bash
# prepare-files.sh — Run BEFORE the MiniOS build to copy CodexSystem files
# into the module's rootcopy-install overlay.
#
# Usage (from workspace root):
#   bash minios-live-master/linux-live/scripts/10-codexsystem/prepare-files.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
SRC="${WORKSPACE_ROOT}/CodexSystem"
DEST="${SCRIPT_DIR}/rootcopy-install/opt/codexsystem"

if [ ! -d "${SRC}" ]; then
    echo "ERROR: CodexSystem directory not found at ${SRC}" >&2
    exit 1
fi

echo "[prepare-files] Syncing CodexSystem → ${DEST}"
mkdir -p "${DEST}"

if command -v rsync >/dev/null 2>&1; then
    rsync -av --delete \
        --exclude='.git' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='.replit' \
        --exclude='replit.nix' \
        --exclude='.agents' \
        --exclude='attached_assets' \
        "${SRC}/" "${DEST}/"
else
    rm -rf "${DEST}"/* "${DEST}"/.[!.]* "${DEST}"/..?* 2>/dev/null || true
    cp -a "${SRC}/." "${DEST}/"
fi

echo "[prepare-files] Done. Files ready at ${DEST}"
echo "[prepare-files] Size: $(du -sh "${DEST}" | cut -f1)"
