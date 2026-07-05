#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# build-iso.sh — Build the CodexOS MiniOS ISO on a local Linux PC
#
# Distro: Debian 12 (bookworm) or Ubuntu 22.04 / 24.04
# Arch  : x86_64 (amd64)
# Run AS: root  (sudo bash build-iso.sh)
# Disk  : ~15 GB free required
# Time  : 20 – 60 minutes depending on internet speed
# ─────────────────────────────────────────────────────────────────────────────

set -e
set -o pipefail

WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MINIOS_DIR="${WORKSPACE}/minios-live-master"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[build-iso]${NC} $*"; }
info() { echo -e "${CYAN}[build-iso]${NC} $*"; }
warn() { echo -e "${YELLOW}[build-iso] WARNING:${NC} $*"; }
err()  { echo -e "${RED}[build-iso] ERROR:${NC} $*" >&2; exit 1; }
sep()  { echo -e "${BOLD}────────────────────────────────────────────────────────${NC}"; }

# ── 0. Preflight ──────────────────────────────────────────────────────────────
sep
info "CodexOS MiniOS ISO Builder"
sep

[ "$(id -u)" -eq 0 ] || err "Run as root:  sudo bash build-iso.sh"

for cmd in debootstrap mksquashfs xorriso rsync; do
    which "$cmd" >/dev/null 2>&1 || err \
        "'$cmd' not found. Run:  sudo apt install debootstrap squashfs-tools xorriso rsync"
done

AVAIL_KB=$(df "${WORKSPACE}" | awk 'NR==2{print $4}')
[ "$AVAIL_KB" -gt 10000000 ] || warn "Less than 10 GB free — build may fail."

info "Workspace : ${WORKSPACE}"
info "MiniOS dir: ${MINIOS_DIR}"
df -h "${WORKSPACE}" | awk 'NR==2 {printf "[build-iso] Disk: %s used / %s total (%s free)\n", $3,$2,$4}'

# ── 1. Sync CodexSystem files into module overlay ─────────────────────────────
sep
log "Step 1 — Syncing CodexSystem files into MiniOS module..."
bash "${MINIOS_DIR}/linux-live/scripts/10-codexsystem/prepare-files.sh"

# ── 2. Permissions ────────────────────────────────────────────────────────────
log "Step 2 — Setting permissions..."
chmod +x "${MINIOS_DIR}/minios-live"
find "${MINIOS_DIR}/linux-live/scripts" -name "install"     -exec chmod +x {} \;
find "${MINIOS_DIR}/linux-live/scripts" -name "postinstall" -exec chmod +x {} \;
find "${MINIOS_DIR}/linux-live/scripts" -name "build"       -exec chmod +x {} \;

# ── 3. Build ──────────────────────────────────────────────────────────────────
sep
log "Step 3 — Running full MiniOS build  (this takes 20 – 60 min)..."
log "         Output will appear in: ${MINIOS_DIR}/build/"
echo ""

cd "${MINIOS_DIR}"
./minios-live -

# ── 4. Result ─────────────────────────────────────────────────────────────────
sep
ISO_FILE=$(find "${MINIOS_DIR}/build" -name "*.iso" 2>/dev/null | head -1)

if [ -n "${ISO_FILE}" ]; then
    log "✓ Build complete!"
    log "  ISO  : ${ISO_FILE}"
    log "  Size : $(du -sh "${ISO_FILE}" | cut -f1)"
    echo ""
    echo -e "${BOLD}  Flash to USB:${NC}"
    echo "    sudo dd if=\"${ISO_FILE}\" of=/dev/sdX bs=4M status=progress oflag=sync"
    echo "    (replace /dev/sdX with your USB drive — find it with: lsblk)"
    echo ""
    echo -e "${BOLD}  Test in QEMU:${NC}"
    echo "    qemu-system-x86_64 -m 2G -cdrom \"${ISO_FILE}\" -boot d"
    echo ""
    echo -e "${BOLD}  Test in VirtualBox:${NC}"
    echo "    New VM → Type: Linux → Version: Debian 12 → mount ISO as optical disk"
else
    warn "No ISO found in ${MINIOS_DIR}/build/ — check the build output above."
    exit 1
fi
