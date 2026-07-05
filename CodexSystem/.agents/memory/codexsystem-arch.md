---
name: CodexSystem Architecture
description: Two-page web app (Speed Dial + CodexMind AI Chat) serving uploaded Opera browser modules as vanilla HTML/CSS/JS
---

## Stack
- Vanilla HTML/CSS/JS served by Python `http.server` on port 5000
- `socketserver.TCPServer.allow_reuse_address = True` required to avoid EADDRINUSE on restart
- Python 3.11 `guess_type()` returns a string (not tuple) — handle with `isinstance(mime, tuple)` check

## Pages
- `index.html` + `style.css` + `app.js` → Speed Dial (CodexMind_System module)
- `codexmind.html` + `codexmind.css` + `codexmind.js` → CodexMind AI Chat

## Module Sync
- CSS design tokens from: `CodexMind AI/Write/@/src/root/themes/opera-dark.css` + `default.css` + `typography.css`
- Animations from: `Animations.css`, `HandCardPill.css`, `ItemsRenderer.css`, `Pill.css`
- GhostCard pattern from: `GhostCard.css` (will-change, contain, backface-visibility)
- AI modes (from `395.js`): chat, research, deep_research, local_research, minute_research, make, do, neon_chat, neon_do, neon_make, code_review, creative_kick, priority_matrix, wallet_wise
- Wallpaper: `CodexMind_System/top/rich-wallpaper/main_resource.jpeg` (1920×1080 JPEG)
- Bookmark thumbnails: `bookmarks/bm0-bm9.png` (copied from bookmark-image/ PNG 264×168)
- Icons: `icons/send.svg`, `mic.svg`, `attach.svg`, `menu.svg`, `add.svg`, `user.svg`, `note.svg` (copied from Di-Deploy assets)
- Language: Indonesian (id-ID) per strings.m.js locationCountry:"ID"

**Why:** rspack bundles in Di-Deploy require chrome:// APIs and Chrome extension context — cannot be used directly in web context, so we build a new standalone web app using the source CSS design system and mode data extracted from the bundles.
