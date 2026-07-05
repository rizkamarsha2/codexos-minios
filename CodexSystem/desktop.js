/* ═══════════════════════════════════════════════════════════════
   CodexOS — Desktop Environment
   Full window manager, app launcher, native apps
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─── CONSTANTS ─── */
const OS_KEY = 'codexos_prefs';
const NOTES_KEY = 'codexos_notes';
const VERSION = '1.0.0';
const BOOT_MSGS = [
  'Initializing CodexOS kernel...',
  'Loading CodexMind AI subsystem...',
  'Mounting file system...',
  'Starting window compositor...',
  'Loading desktop environment...',
  'Applying user preferences...',
  'Welcome to CodexOS!',
];

/* ─── APP REGISTRY ─── */
const APPS = [
  { id: 'codexmind',    label: 'CodexMind AI',   emoji: '🧠', type: 'iframe',  url: '/codexmind.html',       w: 900,  h: 600, pinned: true,  desc: 'AI Chat interface' },
  { id: 'browser',      label: 'Browser',         emoji: '🌐', type: 'browser', url: 'https://google.com',    w: 1000, h: 640, pinned: true,  desc: 'Web browser' },
  { id: 'speedial',     label: 'Speed Dial',      emoji: '🏠', type: 'iframe',  url: '/CodexMind_System/index.html',   w: 900,  h: 600, pinned: true,  desc: 'Homepage & bookmarks' },
  { id: 'controlpanel', label: 'Control Panel',   emoji: '⚙️', type: 'iframe',  url: '/control-panel.html',   w: 960,  h: 650, pinned: true,  desc: 'API keys, RAG, settings' },
  { id: 'notes',        label: 'Notes',           emoji: '📝', type: 'notes',   url: null,                    w: 700,  h: 480, pinned: true,  desc: 'Personal notes' },
  { id: 'calculator',   label: 'Calculator',      emoji: '🔢', type: 'calc',    url: null,                    w: 320,  h: 480, pinned: false, desc: 'Calculator' },
  { id: 'settings',     label: 'Settings',        emoji: '🛠️', type: 'settings',url: null,                    w: 760,  h: 520, pinned: false, desc: 'Desktop preferences' },
  { id: 'youtube',      label: 'YouTube',         emoji: '▶️', type: 'browser', url: 'https://youtube.com',   w: 1000, h: 640, pinned: false, desc: 'Video streaming' },
  { id: 'whatsapp',     label: 'WhatsApp',        emoji: '💬', type: 'browser', url: 'https://web.whatsapp.com', w: 900, h: 600, pinned: false, desc: 'Messaging' },
  { id: 'telegram',     label: 'Telegram',        emoji: '✈️', type: 'browser', url: 'https://web.telegram.org', w: 900, h: 600, pinned: false, desc: 'Messaging' },
  { id: 'gmail',        label: 'Gmail',           emoji: '📧', type: 'browser', url: 'https://mail.google.com',  w: 1000, h: 640, pinned: false, desc: 'Email' },
  { id: 'github',       label: 'GitHub',          emoji: '🐙', type: 'browser', url: 'https://github.com',    w: 1000, h: 640, pinned: false, desc: 'Code hosting' },
  { id: 'spotify',      label: 'Spotify',         emoji: '🎧', type: 'browser', url: 'https://open.spotify.com', w: 900, h: 600, pinned: false, desc: 'Music' },
  { id: 'discord',      label: 'Discord',         emoji: '🎮', type: 'browser', url: 'https://discord.com/app', w: 1000, h: 640, pinned: false, desc: 'Chat & gaming' },
];

/* ─── STATE ─── */
let prefs = loadPrefs();
let openWindows = {};    // id → { el, app, minimized, z }
let zCounter   = 300;
let nextWinId  = 1;
let pinnedApps = ['codexmind','browser','speedial','controlpanel','notes'];
let desktopInited = false;

/* ─── SHARED GLOBAL POINTER STATE (prevents per-window listener accumulation) ─── */
let _drag   = { active: false, id: null, ox: 0, oy: 0 };
let _resize = { active: false, id: null, sx: 0, sy: 0, sw: 0, sh: 0 };

document.addEventListener('mousemove', e => {
  if (_drag.active && _drag.id) {
    const el = document.getElementById(`win-${_drag.id}`);
    if (!el || el.classList.contains('maximized')) return;
    const nx = e.clientX - _drag.ox;
    const ny = e.clientY - _drag.oy;
    const maxX = window.innerWidth  - el.offsetWidth;
    const maxY = window.innerHeight - el.offsetHeight - 52;
    el.style.left = Math.max(0, Math.min(nx, maxX)) + 'px';
    el.style.top  = Math.max(0, Math.min(ny, maxY)) + 'px';
  }
  if (_resize.active && _resize.id) {
    const el = document.getElementById(`win-${_resize.id}`);
    if (!el) return;
    el.style.width  = Math.max(320, _resize.sw + e.clientX - _resize.sx) + 'px';
    el.style.height = Math.max(240, _resize.sh + e.clientY - _resize.sy) + 'px';
  }
});
document.addEventListener('mouseup', () => {
  if (_drag.active) {
    _drag.active = false;
    const el = _drag.id ? document.getElementById(`win-${_drag.id}`) : null;
    if (el) el.style.transition = '';
    _drag.id = null;
  }
  _resize.active = false; _resize.id = null;
});

/* ─── PREFS ─── */
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(OS_KEY) || '{}'); } catch { return {}; }
}
function savePrefs() { localStorage.setItem(OS_KEY, JSON.stringify(prefs)); }

/* ═══════════════════════════════════════════════════════════════
   BOOT SEQUENCE
═══════════════════════════════════════════════════════════════ */
function runBoot() {
  const fill  = document.getElementById('boot-fill');
  const label = document.getElementById('boot-label');
  let step = 0;
  const total = BOOT_MSGS.length;

  function next() {
    if (step >= total) {
      // Transition to lock screen
      const splash = document.getElementById('boot-splash');
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
        showLockScreen();
      }, 800);
      return;
    }
    label.textContent = BOOT_MSGS[step];
    fill.style.width = ((step + 1) / total * 100) + '%';
    step++;
    setTimeout(next, step === total ? 600 : 380);
  }
  setTimeout(next, 400);
}

/* ═══════════════════════════════════════════════════════════════
   LOCK SCREEN
═══════════════════════════════════════════════════════════════ */
let _lockClockStarted = false;

function showLockScreen() {
  const lock = document.getElementById('lock-screen');
  lock.classList.remove('hidden');
  updateLockClock();
  if (!_lockClockStarted) {
    _lockClockStarted = true;
    setInterval(updateLockClock, 1000);
  }
  attachLockHandlers();
}

function attachLockHandlers() {
  const input = document.getElementById('lock-input');
  const btn   = document.getElementById('lock-enter');

  // Remove any previous handlers before attaching new ones
  if (input._unlockKey) input.removeEventListener('keydown', input._unlockKey);
  if (btn._unlockClick) btn.removeEventListener('click', btn._unlockClick);

  function unlock() {
    const lock = document.getElementById('lock-screen');
    lock.classList.add('fade-out');
    setTimeout(() => {
      lock.style.display = 'none';
      // initDesktop() runs exactly once; after that, just show the desktop
      if (!desktopInited) {
        initDesktop();
      } else {
        document.getElementById('desktop').classList.remove('hidden');
      }
    }, 600);
  }

  input._unlockKey   = e => { if (e.key === 'Enter') unlock(); };
  btn._unlockClick   = unlock;
  input.addEventListener('keydown', input._unlockKey);
  btn.addEventListener('click', btn._unlockClick);
  input.value = '';
  setTimeout(() => input.focus(), 100);
}

function updateLockClock() {
  const now  = new Date();
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const lt = document.getElementById('lock-time');
  const ld = document.getElementById('lock-date');
  if (lt) lt.textContent = time;
  if (ld) ld.textContent = date;
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP INIT
═══════════════════════════════════════════════════════════════ */
function initDesktop() {
  if (desktopInited) return;           // guard: run exactly once per session
  desktopInited = true;

  const desktop = document.getElementById('desktop');
  desktop.classList.remove('hidden');

  applyWallpaper();
  renderDesktopIcons();
  renderTaskbarApps();
  startClock();
  bindTaskbar();
  bindStartMenu();
  bindContextMenu();
  bindWallpaperModal();
  bindGlobalClicks();

  showNotification('CodexOS', `Desktop environment loaded · v${VERSION}`, '🖥️');

  // Auto-open CodexMind AI if preferred
  if (prefs.autoOpenAI !== false) {
    setTimeout(() => openApp('codexmind'), 600);
  }
}

/* ═══════════════════════════════════════════════════════════════
   WALLPAPER
═══════════════════════════════════════════════════════════════ */
function applyWallpaper() {
  const wp = document.getElementById('desktop-wallpaper');
  const img = document.getElementById('wp-img');
  const overlay = document.getElementById('wp-overlay');

  if (prefs.wallpaperGradient) {
    img.style.display = 'none';
    wp.style.background = prefs.wallpaperGradient;
  } else if (prefs.wallpaperSrc) {
    img.src = prefs.wallpaperSrc;
    img.style.display = 'block';
  }

  const opacity = prefs.wallpaperOverlay ?? 30;
  overlay.style.background = `rgba(0,0,0,${opacity/100})`;
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP ICONS
═══════════════════════════════════════════════════════════════ */
function renderDesktopIcons() {
  const grid = document.getElementById('desktop-icons');
  grid.innerHTML = '';

  const desktopApps = APPS.filter(a => a.pinned);
  desktopApps.forEach(app => {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.dataset.appId = app.id;
    icon.innerHTML = `
      <div class="di-emoji">${app.emoji}</div>
      <div class="di-label">${app.label}</div>`;
    icon.addEventListener('dblclick', () => openApp(app.id));
    icon.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
    });
    grid.appendChild(icon);
  });
}

/* ═══════════════════════════════════════════════════════════════
   TASKBAR APPS
═══════════════════════════════════════════════════════════════ */
function renderTaskbarApps() {
  const bar = document.getElementById('tb-apps');
  bar.innerHTML = '';

  pinnedApps.forEach(id => {
    const app = APPS.find(a => a.id === id);
    if (!app) return;
    const btn = document.createElement('button');
    btn.className = 'tb-app-btn';
    btn.id = `tb-btn-${id}`;
    btn.dataset.appId = id;
    btn.innerHTML = `<span class="tb-app-emoji">${app.emoji}</span><span class="tb-app-label">${app.label}</span>`;
    btn.title = app.label;
    btn.addEventListener('click', () => {
      if (openWindows[id]) {
        if (openWindows[id].minimized) {
          restoreWindow(id);
        } else if (document.getElementById(`win-${id}`)?.classList.contains('focused')) {
          minimizeWindow(id);
        } else {
          focusWindow(id);
        }
      } else {
        openApp(id);
      }
    });
    bar.appendChild(btn);
  });
}

function updateTaskbarBtn(id) {
  const btn = document.getElementById(`tb-btn-${id}`);
  if (!btn) return;
  const win = openWindows[id];
  if (win) {
    btn.classList.add('active');
    if (win.minimized) btn.classList.remove('active');
  } else {
    btn.classList.remove('active');
  }
}

/* ═══════════════════════════════════════════════════════════════
   CLOCK
═══════════════════════════════════════════════════════════════ */
function startClock() {
  function tick() {
    const now  = new Date();
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    document.getElementById('tb-time').textContent = time;
    document.getElementById('tb-date').textContent = date;
  }
  tick();
  setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════════════════
   WINDOW MANAGER
═══════════════════════════════════════════════════════════════ */
function openApp(id, opts = {}) {
  // If already open, focus it
  if (openWindows[id]) {
    if (openWindows[id].minimized) restoreWindow(id);
    else focusWindow(id);
    return;
  }

  const app = APPS.find(a => a.id === id);
  if (!app) return;

  const winId = `win-${id}`;
  const z = ++zCounter;

  // Calculate centered position
  const vw = window.innerWidth, vh = window.innerHeight - 52;
  const w  = Math.min(app.w, vw - 40);
  const h  = Math.min(app.h, vh - 40);
  const x  = opts.x ?? Math.max(0, (vw - w) / 2 + (Object.keys(openWindows).length * 20));
  const y  = opts.y ?? Math.max(0, (vh - h) / 2 + (Object.keys(openWindows).length * 20));

  const el = document.createElement('div');
  el.className = 'os-window focused';
  el.id = winId;
  el.style.cssText = `width:${w}px;height:${h}px;left:${x}px;top:${y}px;z-index:${z}`;

  el.innerHTML = buildWindowHTML(id, app);
  document.getElementById('windows-layer').appendChild(el);

  // Inject content
  injectWindowContent(id, app, el);

  // Bind window controls
  bindWindowControls(id, el);
  bindWindowDrag(id, el);
  bindWindowResize(id, el);

  openWindows[id] = { el, app, minimized: false, z };
  updateTaskbarBtn(id);
  unfocusAll();
  el.classList.add('focused');
}

function buildWindowHTML(id, app) {
  return `
    <div class="win-titlebar" id="tb-${id}">
      <div class="win-controls">
        <button class="win-btn close"    data-action="close"    title="Close">✕</button>
        <button class="win-btn minimize" data-action="minimize" title="Minimize">─</button>
        <button class="win-btn maximize" data-action="maximize" title="Maximize">⬜</button>
      </div>
      <span class="win-title-icon">${app.emoji}</span>
      <span class="win-title-text">${app.label}</span>
      ${app.type === 'browser' ? `<div class="win-title-actions">
        <button class="win-action-btn" data-action="newtab" title="Open in new tab">↗ New Tab</button>
      </div>` : ''}
    </div>
    <div class="win-body" id="body-${id}"></div>
    <div class="win-resize" id="resize-${id}"></div>`;
}

function injectWindowContent(id, app, el) {
  const body = document.getElementById(`body-${id}`);
  if (!body) return;

  switch (app.type) {
    case 'iframe':
      // Trusted same-origin pages: allow-same-origin is needed for localStorage/API access
      // but we drop allow-modals/allow-top-navigation to limit escape surface
      body.innerHTML = `<iframe src="${app.url}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" allow="microphone; camera"></iframe>`;
      break;
    case 'browser':
      buildBrowserApp(body, app.url, id);
      break;
    case 'calc':
      buildCalculatorApp(body);
      break;
    case 'notes':
      buildNotesApp(body);
      break;
    case 'settings':
      buildSettingsApp(body);
      break;
  }
}

function closeWindow(id) {
  const win = openWindows[id];
  if (!win) return;
  win.el.classList.add('closing');
  setTimeout(() => {
    win.el.remove();
    delete openWindows[id];
    updateTaskbarBtn(id);
  }, 150);
}

function minimizeWindow(id) {
  const win = openWindows[id];
  if (!win) return;
  win.el.classList.add('minimized');
  win.minimized = true;
  updateTaskbarBtn(id);
}

function restoreWindow(id) {
  const win = openWindows[id];
  if (!win) return;
  win.el.classList.remove('minimized');
  win.minimized = false;
  focusWindow(id);
}

function maximizeWindow(id) {
  const win = openWindows[id];
  if (!win) return;
  if (win.el.classList.contains('maximized')) {
    win.el.classList.remove('maximized');
  } else {
    win.el.classList.add('maximized');
  }
}

function focusWindow(id) {
  const win = openWindows[id];
  if (!win) return;
  unfocusAll();
  win.z = ++zCounter;
  win.el.style.zIndex = win.z;
  win.el.classList.add('focused');
  updateTaskbarBtn(id);
}

function unfocusAll() {
  document.querySelectorAll('.os-window').forEach(el => el.classList.remove('focused'));
  Object.keys(openWindows).forEach(id => {
    const btn = document.getElementById(`tb-btn-${id}`);
    if (btn) btn.classList.remove('active');
  });
  // Re-add active class to open (non-minimized) windows
  Object.entries(openWindows).forEach(([id, win]) => {
    if (!win.minimized) {
      const btn = document.getElementById(`tb-btn-${id}`);
      if (btn) btn.classList.add('active');
    }
  });
}

/* ─── WINDOW CONTROLS ─── */
function bindWindowControls(id, el) {
  el.addEventListener('mousedown', () => focusWindow(id));

  el.querySelectorAll('.win-btn, .win-action-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === 'close')    closeWindow(id);
      if (action === 'minimize') minimizeWindow(id);
      if (action === 'maximize') maximizeWindow(id);
      if (action === 'newtab')   window.open(openWindows[id]?.app?.url, '_blank');
    });
  });

  // Double-click titlebar to maximize
  const tb = document.getElementById(`tb-${id}`);
  if (tb) {
    tb.addEventListener('dblclick', () => maximizeWindow(id));
  }
}

/* ─── DRAG — uses shared _drag global, no per-window document listeners ─── */
function bindWindowDrag(id, el) {
  const tb = document.getElementById(`tb-${id}`);
  if (!tb) return;
  tb.addEventListener('mousedown', e => {
    if (e.target.classList.contains('win-btn') || e.target.classList.contains('win-action-btn')) return;
    if (el.classList.contains('maximized')) return;
    _drag.active = true;
    _drag.id     = id;
    _drag.ox     = e.clientX - el.offsetLeft;
    _drag.oy     = e.clientY - el.offsetTop;
    el.style.transition = 'none';
    e.preventDefault();
  });
}

/* ─── RESIZE — uses shared _resize global, no per-window document listeners ─── */
function bindWindowResize(id, el) {
  const handle = document.getElementById(`resize-${id}`);
  if (!handle) return;
  handle.addEventListener('mousedown', e => {
    _resize.active = true;
    _resize.id     = id;
    _resize.sx     = e.clientX; _resize.sy = e.clientY;
    _resize.sw     = el.offsetWidth; _resize.sh = el.offsetHeight;
    e.preventDefault(); e.stopPropagation();
  });
}

/* ═══════════════════════════════════════════════════════════════
   NATIVE APP: BROWSER
═══════════════════════════════════════════════════════════════ */
function buildBrowserApp(container, startUrl, winId) {
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  const toolbar = document.createElement('div');
  toolbar.className = 'browser-toolbar';
  toolbar.innerHTML = `
    <button class="browser-nav-btn" id="br-back-${winId}">←</button>
    <button class="browser-nav-btn" id="br-fwd-${winId}">→</button>
    <button class="browser-nav-btn" id="br-reload-${winId}">↻</button>
    <input class="browser-url" id="br-url-${winId}" value="${startUrl}" type="text" spellcheck="false">
    <button class="browser-go-btn" id="br-go-${winId}">Go</button>
    <button class="browser-nav-btn" id="br-ext-${winId}" title="Open in new tab">↗</button>`;

  const frameWrap = document.createElement('div');
  frameWrap.className = 'browser-frame-wrap';
  const iframe = document.createElement('iframe');
  iframe.id = `br-frame-${winId}`;
  iframe.src = startUrl;
  iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
  iframe.allow = 'microphone; camera';
  frameWrap.appendChild(iframe);

  container.appendChild(toolbar);
  container.appendChild(frameWrap);

  function navigate(url) {
    let dest = url.trim();
    if (!dest.startsWith('http://') && !dest.startsWith('https://') && !dest.startsWith('/')) {
      if (dest.includes('.') && !dest.includes(' ')) dest = 'https://' + dest;
      else dest = `https://www.google.com/search?q=${encodeURIComponent(dest)}`;
    }
    iframe.src = dest;
    document.getElementById(`br-url-${winId}`).value = dest;
  }

  document.getElementById(`br-go-${winId}`).addEventListener('click', () => {
    navigate(document.getElementById(`br-url-${winId}`).value);
  });
  document.getElementById(`br-url-${winId}`).addEventListener('keydown', e => {
    if (e.key === 'Enter') navigate(e.target.value);
  });
  document.getElementById(`br-back-${winId}`).addEventListener('click', () => {
    try { iframe.contentWindow.history.back(); } catch {}
  });
  document.getElementById(`br-fwd-${winId}`).addEventListener('click', () => {
    try { iframe.contentWindow.history.forward(); } catch {}
  });
  document.getElementById(`br-reload-${winId}`).addEventListener('click', () => {
    iframe.src = iframe.src;
  });
  document.getElementById(`br-ext-${winId}`).addEventListener('click', () => {
    window.open(document.getElementById(`br-url-${winId}`).value, '_blank');
  });
}

/* ═══════════════════════════════════════════════════════════════
   NATIVE APP: CALCULATOR
═══════════════════════════════════════════════════════════════ */
function buildCalculatorApp(container) {
  let expr = '', result = '0';
  const app = document.createElement('div');
  app.className = 'calc-app';
  app.innerHTML = `
    <div class="calc-display">
      <div class="calc-expr" id="calc-expr"></div>
      <div class="calc-result" id="calc-result">0</div>
    </div>
    <div class="calc-grid">
      <button class="calc-btn fn" data-v="C">C</button>
      <button class="calc-btn fn" data-v="±">±</button>
      <button class="calc-btn fn" data-v="%">%</button>
      <button class="calc-btn op" data-v="÷">÷</button>
      <button class="calc-btn"   data-v="7">7</button>
      <button class="calc-btn"   data-v="8">8</button>
      <button class="calc-btn"   data-v="9">9</button>
      <button class="calc-btn op" data-v="×">×</button>
      <button class="calc-btn"   data-v="4">4</button>
      <button class="calc-btn"   data-v="5">5</button>
      <button class="calc-btn"   data-v="6">6</button>
      <button class="calc-btn op" data-v="-">−</button>
      <button class="calc-btn"   data-v="1">1</button>
      <button class="calc-btn"   data-v="2">2</button>
      <button class="calc-btn"   data-v="3">3</button>
      <button class="calc-btn op" data-v="+">+</button>
      <button class="calc-btn sp" data-v="0">0</button>
      <button class="calc-btn"   data-v=".">.</button>
      <button class="calc-btn eq" data-v="=">=</button>
    </div>`;

  container.appendChild(app);

  function updateDisplay() {
    document.getElementById('calc-expr').textContent = expr;
    document.getElementById('calc-result').textContent = result;
  }

  app.querySelector('.calc-grid').addEventListener('click', e => {
    const v = e.target.dataset.v;
    if (!v) return;
    if (v === 'C') { expr = ''; result = '0'; }
    else if (v === '=') {
      try {
        const sanitized = expr.replace(/÷/g,'/').replace(/×/g,'*').replace(/−/g,'-');
        result = String(eval(sanitized));
        expr = result;
      } catch { result = 'Error'; }
    }
    else if (v === '±') {
      if (result !== '0') result = result.startsWith('-') ? result.slice(1) : '-' + result;
      expr = result;
    }
    else if (v === '%') {
      try { result = String(parseFloat(result) / 100); expr = result; } catch {}
    }
    else {
      expr += v;
      try {
        const sanitized = expr.replace(/÷/g,'/').replace(/×/g,'*').replace(/−/g,'-');
        result = String(eval(sanitized));
      } catch { result = expr; }
    }
    updateDisplay();
  });
}

/* ═══════════════════════════════════════════════════════════════
   NATIVE APP: NOTES
═══════════════════════════════════════════════════════════════ */
function buildNotesApp(container) {
  let notes = loadNotes();
  let activeNote = notes.length ? notes[0].id : null;

  const app = document.createElement('div');
  app.className = 'notes-app';
  app.innerHTML = `
    <div class="notes-sidebar">
      <div class="notes-sidebar-header">
        <button class="notes-new-btn" id="notes-new">+ New Note</button>
      </div>
      <div class="notes-list" id="notes-list"></div>
    </div>
    <div class="notes-editor-area">
      <input class="notes-title-input" id="notes-title" placeholder="Note title...">
      <textarea class="notes-body-input" id="notes-body" placeholder="Start typing..."></textarea>
    </div>`;
  container.appendChild(app);

  function renderList() {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    notes.forEach(n => {
      const item = document.createElement('div');
      item.className = 'notes-list-item' + (n.id === activeNote ? ' active' : '');
      item.innerHTML = `
        <div class="notes-item-title">${n.title || 'Untitled'}</div>
        <div class="notes-item-preview">${n.body.substring(0,40) || ''}</div>`;
      item.addEventListener('click', () => { activeNote = n.id; renderList(); loadEditor(); });
      list.appendChild(item);
    });
  }

  function loadEditor() {
    const note = notes.find(n => n.id === activeNote);
    if (!note) return;
    document.getElementById('notes-title').value = note.title || '';
    document.getElementById('notes-body').value  = note.body  || '';
  }

  function saveActive() {
    const note = notes.find(n => n.id === activeNote);
    if (!note) return;
    note.title = document.getElementById('notes-title').value;
    note.body  = document.getElementById('notes-body').value;
    note.updated = Date.now();
    saveNotes(notes);
    renderList();
  }

  document.getElementById('notes-new').addEventListener('click', () => {
    const id = Date.now();
    notes.unshift({ id, title: '', body: '', created: id, updated: id });
    activeNote = id;
    saveNotes(notes);
    renderList();
    loadEditor();
    document.getElementById('notes-title').focus();
  });

  document.getElementById('notes-title').addEventListener('input', saveActive);
  document.getElementById('notes-body').addEventListener('input', saveActive);

  renderList();
  if (activeNote) loadEditor();
}

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); } catch { return []; }
}
function saveNotes(n) { localStorage.setItem(NOTES_KEY, JSON.stringify(n)); }

/* ═══════════════════════════════════════════════════════════════
   NATIVE APP: SETTINGS
═══════════════════════════════════════════════════════════════ */
function buildSettingsApp(container) {
  const app = document.createElement('div');
  app.className = 'settings-app';
  app.innerHTML = `
    <nav class="settings-nav" id="set-nav">
      <div class="settings-nav-item active" data-page="desktop">🖥️ Desktop</div>
      <div class="settings-nav-item" data-page="taskbar">📌 Taskbar</div>
      <div class="settings-nav-item" data-page="system">⚙️ System</div>
      <div class="settings-nav-item" data-page="apps">📱 Apps</div>
      <div class="settings-nav-item" data-page="about">ℹ️ About</div>
    </nav>
    <div class="settings-content" id="set-content"></div>`;
  container.appendChild(app);

  const pages = {
    desktop: `<div class="settings-section-title">Desktop Settings</div>
      <div class="settings-row">
        <div><div class="settings-row-label">Wallpaper</div><div class="settings-row-desc">Change desktop background</div></div>
        <button class="settings-select" onclick="document.getElementById('wp-modal-overlay').classList.remove('hidden')">Change</button>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Auto-open CodexMind AI</div><div class="settings-row-desc">Launch AI on startup</div></div>
        <button class="settings-toggle ${prefs.autoOpenAI !== false ? 'on' : ''}" id="toggle-autoopen"></button>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Desktop Icons</div><div class="settings-row-desc">Show app icons on desktop</div></div>
        <button class="settings-toggle on" id="toggle-icons"></button>
      </div>`,
    taskbar: `<div class="settings-section-title">Taskbar Settings</div>
      <div class="settings-row">
        <div><div class="settings-row-label">Taskbar Position</div></div>
        <select class="settings-select"><option value="bottom" selected>Bottom</option></select>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Show App Labels</div></div>
        <button class="settings-toggle on"></button>
      </div>`,
    system: `<div class="settings-section-title">System</div>
      <div class="settings-row">
        <div><div class="settings-row-label">Language</div></div>
        <select class="settings-select"><option>Bahasa Indonesia</option><option>English</option></select>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label">Time Format</div></div>
        <select class="settings-select"><option>24-hour</option><option>12-hour</option></select>
      </div>`,
    apps: `<div class="settings-section-title">Installed Apps</div>
      ${APPS.map(a => `<div class="settings-row">
        <div><div class="settings-row-label">${a.emoji} ${a.label}</div><div class="settings-row-desc">${a.desc}</div></div>
        <button class="settings-select" onclick="openApp('${a.id}')">Open</button>
      </div>`).join('')}`,
    about: `<div class="settings-section-title">About CodexOS</div>
      <div class="settings-row"><div class="settings-row-label">Version</div><div class="settings-row-desc" style="color:#fff">CodexOS ${VERSION}</div></div>
      <div class="settings-row"><div class="settings-row-label">Engine</div><div class="settings-row-desc" style="color:#fff">CodexMind AI · CodexSystem</div></div>
      <div class="settings-row"><div class="settings-row-label">Build</div><div class="settings-row-desc" style="color:#fff">Desktop Environment · Web-based</div></div>
      <div class="settings-row"><div class="settings-row-label">AI Providers</div><div class="settings-row-desc" style="color:#fff">OpenAI, Groq, Gemini, Claude, DeepSeek, Qwen, Mistral, Cohere, Together, OpenRouter, Ollama</div></div>`,
  };

  function showPage(name) {
    document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.toggle('active', i.dataset.page === name));
    const content = document.getElementById('set-content');
    content.innerHTML = pages[name] || '';

    // Bind toggles
    const autoOpen = content.querySelector('#toggle-autoopen');
    if (autoOpen) {
      autoOpen.addEventListener('click', () => {
        prefs.autoOpenAI = !autoOpen.classList.contains('on');
        autoOpen.classList.toggle('on');
        savePrefs();
      });
    }
  }

  app.querySelector('#set-nav').addEventListener('click', e => {
    const item = e.target.closest('.settings-nav-item');
    if (item) showPage(item.dataset.page);
  });

  showPage('desktop');
}

/* ═══════════════════════════════════════════════════════════════
   TASKBAR BINDINGS
═══════════════════════════════════════════════════════════════ */
function bindTaskbar() {
  document.getElementById('tb-search-btn').addEventListener('click', () => {
    const sm = document.getElementById('start-menu');
    sm.classList.toggle('hidden');
    if (!sm.classList.contains('hidden')) {
      document.getElementById('sm-search').focus();
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   START MENU
═══════════════════════════════════════════════════════════════ */
function bindStartMenu() {
  const startBtn  = document.getElementById('tb-start-btn');
  const startMenu = document.getElementById('start-menu');
  const search    = document.getElementById('sm-search');
  const powerBtn  = document.getElementById('sm-power-btn');
  const powerMenu = document.getElementById('power-menu');

  startBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = !startMenu.classList.contains('hidden');
    closeAllMenus();
    if (!open) {
      startMenu.classList.remove('hidden');
      startBtn.classList.add('active');
      renderStartMenu();
      search.focus();
    }
  });

  search.addEventListener('input', () => filterStartMenu(search.value));

  powerBtn.addEventListener('click', e => {
    e.stopPropagation();
    powerMenu.classList.toggle('hidden');
  });

  powerMenu.addEventListener('click', e => {
    const action = e.target.dataset.action;
    if (action === 'lock') lockDesktop();
    else if (action === 'restart') location.reload();
    else if (action === 'shutdown') shutdownDesktop();
    closeAllMenus();
  });
}

function renderStartMenu(filter = '') {
  const pinned = APPS.filter(a => a.pinned && (!filter || a.label.toLowerCase().includes(filter.toLowerCase())));
  const all    = APPS.filter(a => !filter || a.label.toLowerCase().includes(filter.toLowerCase()));

  const pinnedGrid = document.getElementById('sm-pinned-grid');
  const allList    = document.getElementById('sm-all-list');

  if (pinnedGrid) {
    pinnedGrid.innerHTML = pinned.map(a => `
      <div class="sm-app-icon" data-id="${a.id}">
        <span class="sm-app-emoji">${a.emoji}</span>
        <span class="sm-app-label">${a.label}</span>
      </div>`).join('');
    pinnedGrid.querySelectorAll('.sm-app-icon').forEach(el => {
      el.addEventListener('click', () => { openApp(el.dataset.id); closeAllMenus(); });
    });
  }

  if (allList) {
    allList.innerHTML = all.map(a => `
      <div class="sm-list-item" data-id="${a.id}">
        <span class="sm-list-emoji">${a.emoji}</span>
        <span class="sm-list-name">${a.label}</span>
        <span class="sm-list-desc">${a.desc}</span>
      </div>`).join('');
    allList.querySelectorAll('.sm-list-item').forEach(el => {
      el.addEventListener('click', () => { openApp(el.dataset.id); closeAllMenus(); });
    });
  }
}

function filterStartMenu(q) {
  renderStartMenu(q);
}

/* ═══════════════════════════════════════════════════════════════
   CONTEXT MENU
═══════════════════════════════════════════════════════════════ */
function bindContextMenu() {
  const ctx = document.getElementById('ctx-menu');
  const desktop = document.getElementById('desktop');

  desktop.addEventListener('contextmenu', e => {
    if (e.target.closest('.os-window') || e.target.closest('.taskbar') || e.target.closest('.start-menu')) return;
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth  - 210);
    const y = Math.min(e.clientY, window.innerHeight - 160);
    ctx.style.left = x + 'px';
    ctx.style.top  = y + 'px';
    ctx.classList.remove('hidden');
    closeAllMenus(ctx);
    ctx.classList.remove('hidden');
  });

  ctx.addEventListener('click', e => {
    const action = e.target.dataset.action;
    if (action === 'change-wallpaper') document.getElementById('wp-modal-overlay').classList.remove('hidden');
    else if (action === 'refresh') { renderDesktopIcons(); showNotification('Desktop', 'Refreshed', '🔄'); }
    else if (action === 'open-terminal') openApp('codexmind');
    else if (action === 'display-settings') openApp('settings');
    ctx.classList.add('hidden');
  });
}

/* ═══════════════════════════════════════════════════════════════
   WALLPAPER MODAL
═══════════════════════════════════════════════════════════════ */
function bindWallpaperModal() {
  document.getElementById('wp-modal-close').addEventListener('click', () => {
    document.getElementById('wp-modal-overlay').classList.add('hidden');
  });
  document.getElementById('wp-modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('wp-modal-overlay'))
      document.getElementById('wp-modal-overlay').classList.add('hidden');
  });

  document.querySelectorAll('.wp-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.wp-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const img = document.getElementById('wp-img');
      const overlay = document.getElementById('wp-overlay');
      const wp = document.getElementById('desktop-wallpaper');
      if (thumb.dataset.src) {
        prefs.wallpaperSrc = thumb.dataset.src;
        prefs.wallpaperGradient = null;
        img.src = thumb.dataset.src;
        img.style.display = 'block';
        wp.style.background = '';
      } else if (thumb.dataset.gradient) {
        prefs.wallpaperGradient = thumb.dataset.gradient;
        prefs.wallpaperSrc = null;
        img.style.display = 'none';
        wp.style.background = thumb.dataset.gradient;
      }
      savePrefs();
    });
  });

  const fileInput = document.getElementById('wp-file-input');
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target.result;
      prefs.wallpaperSrc = src;
      prefs.wallpaperGradient = null;
      document.getElementById('wp-img').src = src;
      document.getElementById('wp-img').style.display = 'block';
      document.getElementById('desktop-wallpaper').style.background = '';
      savePrefs();
    };
    reader.readAsDataURL(file);
  });

  const overlayRange = document.getElementById('wp-overlay-range');
  const overlayVal   = document.getElementById('wp-overlay-val');
  overlayRange.value = prefs.wallpaperOverlay ?? 30;
  overlayVal.textContent = overlayRange.value + '%';
  overlayRange.addEventListener('input', () => {
    const v = overlayRange.value;
    overlayVal.textContent = v + '%';
    document.getElementById('wp-overlay').style.background = `rgba(0,0,0,${v/100})`;
    prefs.wallpaperOverlay = parseInt(v);
    savePrefs();
  });
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CLICK — close menus / deselect icons
═══════════════════════════════════════════════════════════════ */
function bindGlobalClicks() {
  document.addEventListener('click', e => {
    if (!e.target.closest('#start-menu') && !e.target.closest('#tb-start-btn') && !e.target.closest('#tb-search-btn')) {
      document.getElementById('start-menu').classList.add('hidden');
      document.getElementById('tb-start-btn').classList.remove('active');
    }
    if (!e.target.closest('#power-menu') && !e.target.closest('#sm-power-btn')) {
      document.getElementById('power-menu').classList.add('hidden');
    }
    if (!e.target.closest('#ctx-menu')) {
      document.getElementById('ctx-menu').classList.add('hidden');
    }
    if (!e.target.closest('.desktop-icon')) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    }
  });

  // Click outside window to unfocus (but don't close)
  document.getElementById('desktop-wallpaper').addEventListener('click', () => {
    unfocusAll();
  });
}

function closeAllMenus(except) {
  const menus = ['start-menu','power-menu','ctx-menu'];
  menus.forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== except) el.classList.add('hidden');
  });
  document.getElementById('tb-start-btn').classList.remove('active');
}

/* ═══════════════════════════════════════════════════════════════
   LOCK / POWER
═══════════════════════════════════════════════════════════════ */
function lockDesktop() {
  // Minimize all open windows without destroying them
  Object.keys(openWindows).forEach(id => minimizeWindow(id));

  const desktop = document.getElementById('desktop');
  const lock    = document.getElementById('lock-screen');
  desktop.classList.add('hidden');

  lock.style.display = 'flex';
  lock.classList.remove('hidden', 'fade-out');

  // attachLockHandlers uses the unified safe pattern (removes old handlers first)
  attachLockHandlers();
}

function shutdownDesktop() {
  document.getElementById('desktop').style.opacity = '0';
  document.getElementById('desktop').style.transition = 'opacity 0.8s';
  setTimeout(() => {
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:system-ui">
        <img src="assets_logo/logo.png" style="width:60px;opacity:0.5">
        <p style="color:rgba(255,255,255,0.3);font-size:0.9rem;">CodexOS has been shut down.</p>
        <button onclick="location.reload()" style="padding:8px 20px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:0.82rem">Restart</button>
      </div>`;
  }, 800);
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════════════════════════════ */
function showNotification(title, msg, icon = '🔔') {
  const area  = document.getElementById('notif-area');
  const toast = document.createElement('div');
  toast.className = 'notif-toast';
  toast.innerHTML = `
    <span class="notif-icon">${icon}</span>
    <div class="notif-body">
      <div class="notif-title">${title}</div>
      <div class="notif-msg">${msg}</div>
    </div>`;
  area.appendChild(toast);
  toast.addEventListener('click', () => toast.remove());
  setTimeout(() => {
    toast.classList.add('notif-out');
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

/* ═══════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  // Super key (Win/Cmd) → toggle start menu
  if ((e.metaKey || e.key === 'Meta') && !e.shiftKey && !e.altKey && !e.ctrlKey) {
    e.preventDefault();
    const sm = document.getElementById('start-menu');
    if (!sm) return;
    const open = !sm.classList.contains('hidden');
    closeAllMenus();
    if (!open) { sm.classList.remove('hidden'); renderStartMenu(); document.getElementById('sm-search')?.focus(); }
    return;
  }
  if (!e.ctrlKey && !e.altKey) return;

  // Ctrl+Alt+T → CodexMind AI
  if (e.ctrlKey && e.altKey && e.key === 't') { e.preventDefault(); openApp('codexmind'); }
  // Ctrl+Alt+B → Browser
  if (e.ctrlKey && e.altKey && e.key === 'b') { e.preventDefault(); openApp('browser'); }
  // Ctrl+Alt+N → Notes
  if (e.ctrlKey && e.altKey && e.key === 'n') { e.preventDefault(); openApp('notes'); }
  // Ctrl+Alt+S → Settings
  if (e.ctrlKey && e.altKey && e.key === 's') { e.preventDefault(); openApp('settings'); }
  // Ctrl+Alt+L → Lock
  if (e.ctrlKey && e.altKey && e.key === 'l') { e.preventDefault(); lockDesktop(); }
});

/* ═══════════════════════════════════════════════════════════════
   EXPOSE GLOBAL for inline onclick
═══════════════════════════════════════════════════════════════ */
window.openApp = openApp;
window.lockDesktop = lockDesktop;

/* ═══════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderStartMenu(); // Pre-render start menu content
  runBoot();
});
