# TODO — CodexSystem as MiniOS desktop (auto-start)

- [x] Update MiniOS module `10-codexsystem` so CodexSystem launches desktop shell (desktop.html) by default.
- [x] Ensure Chromium is started on login (autostart). Added autostart desktop entry.
- [x] Verify `server.py` serves `desktop.html` at `/desktop.html` (module launches with `WorkingDirectory=/opt/codexsystem`).
- [ ] Fix iframe/sandbox behavior if desktop panels are not fully functional under the desktop shell.
- [ ] Rebuild ISO and test in QEMU.

## Notes
- Build/test could not be run yet in this environment because WSL distributions are not installed.

