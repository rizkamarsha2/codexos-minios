---
name: MiniOS Integration
description: How CodexSystem AI is integrated into MiniOS as a bootable ISO module
---

# MiniOS Integration

## Structure

CodexSystem is integrated as MiniOS module `10-codexsystem` at:
`minios-live-master/linux-live/scripts/10-codexsystem/`

## Critical path fix

`prepare-files.sh` resolves workspace root with **4 levels** up from the module dir:
```bash
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
```
`../../../..` from `minios-live-master/linux-live/scripts/10-codexsystem` = workspace root.
Using 6 levels (`../../../../../..`) resolves to `/home` — silently wrong.

**Why:** The module sits 4 directories deep inside minios-live-master, not 6.

**How to apply:** Any new path computation in module scripts must count the actual depth.

## Boot flow in the ISO

1. `codexsystem.service` (systemd) starts `python3 /opt/codexsystem/server.py` as user `live`
2. XFCE loads → autostart fires `chromium --app=http://localhost:5000` after 4s delay
3. CodexOS Desktop appears full-screen

## Build options

- Local: `sudo bash build-iso.sh` (needs root, ~15 GB free, Debian/Ubuntu)
- Docker: `docker build -f Dockerfile.build-iso . && docker run --privileged -v $(pwd)/iso-output:/output codexos-builder`
- CI: push to main triggers `.github/workflows/build-iso.yml`; ISO uploaded as Actions artifact
