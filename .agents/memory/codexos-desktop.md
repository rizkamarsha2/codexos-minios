---
name: CodexOS Desktop Environment
description: New web-based desktop OS built on top of CodexSystem; architecture decisions and known constraints
---

# CodexOS Desktop Environment

## Key decisions

**Single shared drag/resize listeners**: `_drag` and `_resize` globals handle all window pointer events. Registered once at module load on `document`. Per-window handlers in `bindWindowDrag`/`bindWindowResize` only set these globals — they do NOT add their own `mousemove`/`mouseup` to `document`.

**Why:** Early implementation added per-window document listeners that accumulated on every open/close cycle, degrading responsiveness after many window operations.

**How to apply:** Any new draggable/resizable element must slot into the shared `_drag`/`_resize` state pattern, not add new document listeners.

---

**`initDesktop()` runs exactly once**: guarded by `desktopInited` flag. `lockDesktop()` hides the desktop without re-running init; `attachLockHandlers()` is the unified unlock entry point for both initial boot unlock and subsequent lock/unlock cycles.

**Why:** Earlier version called `initDesktop()` on every unlock, duplicating clock intervals, menu bindings, and other DOM listeners.

**How to apply:** Never call `initDesktop()` from `lockDesktop()` or any re-lock path. Only `attachLockHandlers()` → unlock callback should reveal the desktop after first init.

---

**Iframe sandbox policy (split trust)**:
- Trusted same-origin apps (`/codexmind.html`, `/control-panel.html`, `/system`): `allow-scripts allow-same-origin allow-forms allow-popups`
- External browser windows: built as a native `browser` type with a real `<iframe>` inside a custom toolbar; same sandbox as above but opened via `buildBrowserApp()`.

**Why:** `allow-same-origin` + `allow-scripts` weakens sandbox for cross-origin, but is required for same-origin pages to access localStorage (AI keys, RAG data).

---

## Wallpaper path

Correct path for the bundled wallpaper:
`CodexMind_System/rich-wallpaper/rich--wallpaper/wallpaper/main_resource.jpeg`
(double dash in `rich--wallpaper` is intentional — it's the nested folder structure from the original zip)
