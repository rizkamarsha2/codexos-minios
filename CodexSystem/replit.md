# CodexSystem AI — CodexOS Desktop Environment

Platform AI Terintegrasi — Powered by **CodexMind AI**

## Run

```bash
cd CodexSystem && python server.py
```

Server runs on port 5000.

## Architecture

```
CodexSystem/
├── desktop.html        — CodexOS Desktop Environment (main entry)
├── desktop.css         — OS-like styling, window manager, taskbar
├── desktop.js          — Window manager, app launcher, boot sequence, native apps
├── index.html          — Classic Speed Dial (accessible at /classic)
├── codexmind.html      — CodexMind AI Chat (accessible at /ai)
├── control-panel.html  — Control Panel: API keys, RAG, memory (/control-panel)
├── server.py           — Python HTTP server v2.4 (port 5000)
├── ai-engine.js        — 11 AI provider integrations (OpenAI, Groq, Gemini, Claude…)
├── rag-engine.js       — BM25+cosine hybrid RAG engine (MiniLM v6 mode)
├── web-search.js       — Web search proxy (Tavily/Serper/DuckDuckGo)
├── taskbar.js          — Bottom taskbar (used within codexmind.html)
├── assets_logo/        — Logo, boot GIF, branding
├── bookmarks/          — Speed dial bookmark thumbnails
├── CodexMind AI/       — AI module (React bundle, Di-Deploy)
└── CodexMind_System/   — Speed Dial system (Opera-based)
```

## Routes

| Route | Destination |
|---|---|
| `/` | CodexOS Desktop Environment |
| `/ai` or `/chat` | CodexMind AI Chat |
| `/control-panel` | Control Panel |
| `/system` | CodexMind_System Speed Dial |
| `/classic` | Classic Boot Splash + Speed Dial |
| `POST /api/chat` | AI proxy (avoids CORS) |
| `POST /api/search` | Search proxy (Tavily/Serper/DDG) |

## Desktop Features

- **Boot splash** — animated boot sequence with logo and progress bar
- **Lock screen** — clock, date, password entry
- **Window manager** — draggable, resizable, minimize/maximize/close
- **App launcher (Start menu)** — searchable, pinned grid + all apps list
- **Taskbar** — running app indicators, clock, search, notifications
- **Desktop icons** — double-click to open apps
- **Context menu** — right-click on desktop
- **Wallpaper picker** — presets, gradients, file upload, overlay opacity
- **Keyboard shortcuts** — Ctrl+Alt+T (CodexMind), Ctrl+Alt+B (Browser), Ctrl+Alt+L (Lock)

## Built-in Apps

| App | Type | Description |
|---|---|---|
| CodexMind AI | iframe | Full AI chat with 11 providers |
| Browser | native | Web browser with URL bar |
| Speed Dial | iframe | Homepage & bookmarks |
| Control Panel | iframe | API keys, RAG, memory settings |
| Notes | native | Persistent personal notes |
| Calculator | native | Scientific calculator |
| Settings | native | Desktop preferences |
| YouTube, WhatsApp… | browser | Web apps in windows |

## AI Providers (via Control Panel)

OpenAI · Groq · Gemini · Claude · DeepSeek · Qwen · Mistral · Cohere · Together AI · OpenRouter · Ollama

## User Preferences

- Bahasa antarmuka: Bahasa Indonesia
- Nama AI: CodexMind AI
- Nama Sistem: CodexSystem / CodexOS
- Tema default: Dark (cobalt/midnight)
