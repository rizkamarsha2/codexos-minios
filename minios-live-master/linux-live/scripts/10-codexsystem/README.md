# 10-codexsystem — CodexSystem AI MiniOS Module

This module integrates **CodexSystem AI** (a web-based AI desktop environment) into
a bootable MiniOS Linux ISO.

## What gets installed

| What | Where in ISO |
|---|---|
| CodexSystem AI server + UI | `/opt/codexsystem/` |
| systemd service (auto-start at boot) | `/usr/lib/systemd/system/codexsystem.service` |
| XFCE/XDG autostart (launches the desktop shell on login) | `/etc/skel/.config/autostart/codexsystem.desktop` and `/etc/xdg/autostart/codexsystem.desktop` |
| App launcher entry | `/usr/share/applications/codexsystem.desktop` |
| Launch wrapper | `/usr/local/bin/codexsystem-launch` |
| Desktop icon | `/etc/skel/Desktop/CodexSystem AI.desktop` |
| App icon | `/usr/share/icons/hicolor/scalable/apps/codexsystem.svg` |

## Boot flow in the live ISO

1. MiniOS boots → systemd starts `codexsystem.service`
2. `server.py` starts on `http://localhost:5000`
3. XFCE session loads → autostart fires Chromium in app mode
4. **CodexOS Desktop** appears full-screen in Chromium
5. User sets AI provider API key in Control Panel → starts chatting

## Developer: Agent Inspector / Local Debugging

To run the CodexSystem agent locally and connect with Foundry Toolkit Agent Inspector:

- Create a virtual environment and install dev requirements:
    - Windows: `python -m venv .venv && .venv\\Scripts\\pip install -r requirements.txt`
    - Unix: `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Run with `agentdev` and `debugpy` for Agent Inspector attach:
    - `python -m debugpy --listen 5678 --wait-for-client -m agentdev run -- python agent_server.py`

VS Code tasks and launch configurations are included under `.vscode/` to assist with starting and attaching the debugger.

## Building

**Option A — local Debian/Ubuntu machine:**
```bash
# From workspace root (requires root + ~15 GB free disk):
sudo bash build-iso.sh
```

**Option B — Docker (no root on host needed, --privileged required):**
```bash
docker build -f Dockerfile.build-iso -t codexos-builder .
mkdir -p iso-output
docker run --privileged -v "$(pwd)/iso-output:/output" codexos-builder
```

**Option C — GitHub Actions CI:**
Push to `main`/`master` and the `.github/workflows/build-iso.yml` workflow
triggers automatically. Download the ISO from the Actions → Artifacts tab.

## Files in this module

```
10-codexsystem/
├── packages.list          — python3, chromium (installed via apt in chroot)
├── install                — chroot install script (runs inside the ISO rootfs)
├── prepare-files.sh       — copies CodexSystem/ into rootcopy-install/ pre-build
├── skip_conditions.conf   — skips on DESKTOP_ENVIRONMENT=core (headless)
├── README.md              — this file
└── rootcopy-install/      — files overlaid onto the ISO rootfs before install
    ├── opt/codexsystem/   — populated by prepare-files.sh
    ├── etc/skel/.config/autostart/codexsystem.desktop
    ├── etc/skel/Desktop/CodexSystem AI.desktop
    └── usr/share/
        ├── applications/codexsystem.desktop
        └── icons/hicolor/scalable/apps/codexsystem.svg
```
