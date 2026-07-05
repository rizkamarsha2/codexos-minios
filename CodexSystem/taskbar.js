/* ═══════════════════════════════════════════════════════════════
   CodexSystem — Bottom Taskbar
   taskbar.js — App management, auto-hide, settings
   ═══════════════════════════════════════════════════════════════ */

/* ─── DEFAULT APP CATALOG ─── */
const TASKBAR_APP_CATALOG = [
  { id: 'codexmind',    label: 'CodexMind AI', emoji: '🧠', url: '/codexmind.html', default: true },
  { id: 'whatsapp',     label: 'WhatsApp',     emoji: '💬', url: 'https://web.whatsapp.com', default: true },
  { id: 'telegram',     label: 'Telegram',     emoji: '✈️', url: 'https://web.telegram.org', default: true },
  { id: 'youtube',      label: 'YouTube',      emoji: '▶️', url: 'https://youtube.com', default: true },
  { id: 'facebook',     label: 'Facebook',     emoji: '👤', url: 'https://facebook.com', default: true },
  { id: 'instagram',    label: 'Instagram',    emoji: '📷', url: 'https://instagram.com', default: true },
  { id: 'twitter',      label: 'X / Twitter',  emoji: '🐦', url: 'https://x.com', default: false },
  { id: 'tiktok',       label: 'TikTok',       emoji: '🎵', url: 'https://tiktok.com', default: false },
  { id: 'gmail',        label: 'Gmail',        emoji: '📧', url: 'https://mail.google.com', default: true },
  { id: 'gdrive',       label: 'Google Drive', emoji: '📁', url: 'https://drive.google.com', default: false },
  { id: 'gsheets',      label: 'Sheets',       emoji: '📊', url: 'https://sheets.google.com', default: false },
  { id: 'gdocs',        label: 'Docs',         emoji: '📝', url: 'https://docs.google.com', default: false },
  { id: 'meet',         label: 'Google Meet',  emoji: '📹', url: 'https://meet.google.com', default: false },
  { id: 'zoom',         label: 'Zoom',         emoji: '🎥', url: 'https://zoom.us', default: false },
  { id: 'discord',      label: 'Discord',      emoji: '🎮', url: 'https://discord.com/app', default: false },
  { id: 'spotify',      label: 'Spotify',      emoji: '🎧', url: 'https://open.spotify.com', default: false },
  { id: 'netflix',      label: 'Netflix',      emoji: '🍿', url: 'https://netflix.com', default: false },
  { id: 'github',       label: 'GitHub',       emoji: '🐙', url: 'https://github.com', default: false },
  { id: 'notion',       label: 'Notion',       emoji: '📓', url: 'https://notion.so', default: false },
  { id: 'chatgpt',      label: 'ChatGPT',      emoji: '🤖', url: 'https://chat.openai.com', default: false },
  { id: 'controlpanel', label: 'Control Panel',emoji: '⚙️', url: '/control-panel.html', default: true },
];

const TASKBAR_KEY = 'codex_taskbar_config';

/* ─── LOAD CONFIG ─── */
function loadTaskbarConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(TASKBAR_KEY) || '{}');
    return {
      enabled:    saved.enabled   !== false,
      autohide:   saved.autohide  || false,
      position:   saved.position  || 'bottom',
      size:       saved.size      || 'normal',
      activeApps: saved.activeApps || TASKBAR_APP_CATALOG.filter(a => a.default).map(a => a.id),
      customApps: saved.customApps || [],
    };
  } catch { return { enabled: true, autohide: false, activeApps: TASKBAR_APP_CATALOG.filter(a => a.default).map(a => a.id), customApps: [] }; }
}

function saveTaskbarConfig(cfg) {
  localStorage.setItem(TASKBAR_KEY, JSON.stringify(cfg));
}

let taskbarConfig = loadTaskbarConfig();
let taskbarEl     = null;
let clockInterval = null;

/* ─── INIT ─── */
function initTaskbar() {
  if (!taskbarConfig.enabled) return;
  renderTaskbar();
  if (taskbarConfig.autohide) setupAutohide();
  startClock();
  document.body.classList.add('has-taskbar');
  if (taskbarConfig.autohide) document.body.classList.add('taskbar-autohide');
}

/* ─── RENDER TASKBAR ─── */
function renderTaskbar() {
  /* Remove existing */
  document.getElementById('codex-taskbar')?.remove();
  document.getElementById('codex-taskbar-trigger')?.remove();

  const allApps = [...TASKBAR_APP_CATALOG, ...taskbarConfig.customApps];
  const activeApps = taskbarConfig.activeApps
    .map(id => allApps.find(a => a.id === id))
    .filter(Boolean);

  const tb = document.createElement('div');
  tb.id    = 'codex-taskbar';
  if (taskbarConfig.autohide) tb.classList.add('autohide');

  /* Left section */
  const left = document.createElement('div');
  left.className = 'taskbar-left';

  /* Start / Home button */
  const startBtn = document.createElement('button');
  startBtn.className = 'taskbar-start-btn';
  startBtn.title     = 'CodexSystem Home';
  startBtn.innerHTML = '⚡';
  startBtn.addEventListener('click', () => { window.location.href = '/'; });
  left.appendChild(startBtn);

  /* Separator */
  const sep = document.createElement('div');
  sep.className = 'taskbar-sep';
  left.appendChild(sep);

  /* App icons */
  activeApps.forEach(app => {
    const btn = document.createElement('a');
    btn.className      = 'taskbar-app';
    btn.href           = app.url;
    btn.dataset.label  = app.label;
    btn.dataset.appId  = app.id;
    btn.target         = app.url.startsWith('http') ? '_blank' : '_self';
    btn.rel            = 'noopener noreferrer';
    btn.title          = app.label;

    if (app.emoji) {
      btn.innerHTML = `<span style="font-size:20px">${app.emoji}</span>`;
    } else if (app.iconUrl) {
      btn.innerHTML = `<img src="${app.iconUrl}" alt="${app.label}">`;
    }

    /* Mark as running if current page matches */
    if (window.location.pathname === app.url || window.location.href.includes(app.url)) {
      btn.classList.add('running');
    }

    left.appendChild(btn);
  });

  tb.appendChild(left);

  /* Right section */
  const right = document.createElement('div');
  right.className = 'taskbar-right';

  /* Control Panel shortcut */
  const cpBtn = document.createElement('button');
  cpBtn.className = 'taskbar-icon-btn';
  cpBtn.title     = 'Control Panel';
  cpBtn.innerHTML = '⚙️';
  cpBtn.addEventListener('click', () => { window.open('/control-panel.html', '_blank'); });
  right.appendChild(cpBtn);

  /* Settings button */
  const setBtn = document.createElement('button');
  setBtn.className = 'taskbar-icon-btn';
  setBtn.title     = 'Taskbar Settings';
  setBtn.innerHTML = '🔧';
  setBtn.addEventListener('click', toggleTaskbarSettings);
  right.appendChild(setBtn);

  /* Clock */
  const clock = document.createElement('div');
  clock.className = 'taskbar-clock';
  clock.id        = 'taskbar-clock';
  clock.innerHTML = `<div class="taskbar-clock-time" id="tb-time">00:00</div>
                     <div class="taskbar-clock-date" id="tb-date">---</div>`;
  right.appendChild(clock);

  tb.appendChild(right);
  document.body.appendChild(tb);
  taskbarEl = tb;

  /* Trigger zone for auto-hide */
  const trigger = document.createElement('div');
  trigger.id = 'codex-taskbar-trigger';
  trigger.addEventListener('mouseenter', () => {
    tb.classList.add('visible');
  });
  document.body.appendChild(trigger);

  /* Settings panel */
  renderTaskbarSettings();
}

/* ─── AUTO-HIDE ─── */
function setupAutohide() {
  if (!taskbarEl) return;
  taskbarEl.addEventListener('mouseleave', () => {
    setTimeout(() => {
      if (!taskbarEl.matches(':hover')) taskbarEl.classList.remove('visible');
    }, 400);
  });
}

/* ─── CLOCK ─── */
function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  const update = () => {
    const now  = new Date();
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    const tEl  = document.getElementById('tb-time');
    const dEl  = document.getElementById('tb-date');
    if (tEl) tEl.textContent = time;
    if (dEl) dEl.textContent = date;
  };
  update();
  clockInterval = setInterval(update, 10000);
}

/* ─── SETTINGS PANEL ─── */
function renderTaskbarSettings() {
  document.getElementById('taskbar-settings-panel')?.remove();

  const allApps = [...TASKBAR_APP_CATALOG, ...taskbarConfig.customApps];
  const panel   = document.createElement('div');
  panel.id       = 'taskbar-settings-panel';

  panel.innerHTML = `
    <div class="tbs-title">⚙️ Pengaturan Taskbar</div>

    <div class="tbs-section">
      <div class="tbs-label">Perilaku</div>
      <div class="tbs-row">
        <span class="tbs-row-label">Auto-Hide</span>
        <label class="tbs-toggle">
          <input type="checkbox" id="tb-autohide" ${taskbarConfig.autohide ? 'checked' : ''}>
          <span class="tbs-toggle-slider"></span>
        </label>
      </div>
      <div class="tbs-row">
        <span class="tbs-row-label">Tampilkan Taskbar</span>
        <label class="tbs-toggle">
          <input type="checkbox" id="tb-enabled" ${taskbarConfig.enabled ? 'checked' : ''}>
          <span class="tbs-toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="tbs-section">
      <div class="tbs-label">Aplikasi (klik untuk aktif/nonaktif)</div>
      <div class="tbs-app-grid" id="tbs-app-grid">
        ${allApps.map(app => `
          <div class="tbs-app-item ${taskbarConfig.activeApps.includes(app.id) ? 'active' : ''}"
               data-app-id="${app.id}" title="${app.label}">
            <div class="tbs-app-icon">${app.emoji || '📱'}</div>
            <div class="tbs-app-name">${app.label.slice(0,8)}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="tbs-section">
      <div class="tbs-label">Tambah Aplikasi Kustom</div>
      <div style="display:flex;gap:6px;margin-top:4px">
        <input id="tbs-custom-name" placeholder="Nama" style="flex:1;background:#252835;border:1px solid #41455a;border-radius:6px;padding:6px 10px;color:#fff;font-size:12px;outline:none">
        <input id="tbs-custom-url"  placeholder="URL" style="flex:2;background:#252835;border:1px solid #41455a;border-radius:6px;padding:6px 10px;color:#fff;font-size:12px;outline:none">
        <input id="tbs-custom-icon" placeholder="🔗" style="width:36px;background:#252835;border:1px solid #41455a;border-radius:6px;padding:6px;color:#fff;font-size:16px;text-align:center;outline:none">
        <button id="tbs-add-custom" style="background:#5021ff;border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">+</button>
      </div>
    </div>

    <button id="tbs-apply" style="width:100%;background:#5021ff;border:none;color:#fff;padding:10px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;margin-top:4px">
      ✓ Terapkan Perubahan
    </button>`;

  document.body.appendChild(panel);

  /* Bind events */
  panel.querySelectorAll('.tbs-app-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.appId;
      if (taskbarConfig.activeApps.includes(id)) {
        taskbarConfig.activeApps = taskbarConfig.activeApps.filter(a => a !== id);
        item.classList.remove('active');
      } else {
        taskbarConfig.activeApps.push(id);
        item.classList.add('active');
      }
    });
  });

  panel.querySelector('#tbs-add-custom')?.addEventListener('click', () => {
    const name  = panel.querySelector('#tbs-custom-name').value.trim();
    const url   = panel.querySelector('#tbs-custom-url').value.trim();
    const icon  = panel.querySelector('#tbs-custom-icon').value.trim() || '🔗';
    if (!name || !url) return;
    const id = 'custom_' + Date.now();
    taskbarConfig.customApps.push({ id, label: name, emoji: icon, url });
    taskbarConfig.activeApps.push(id);
    saveTaskbarConfig(taskbarConfig);
    renderTaskbar();
    panel.remove();
    renderTaskbarSettings();
  });

  panel.querySelector('#tbs-apply')?.addEventListener('click', () => {
    taskbarConfig.autohide = panel.querySelector('#tb-autohide').checked;
    taskbarConfig.enabled  = panel.querySelector('#tb-enabled').checked;
    saveTaskbarConfig(taskbarConfig);
    document.getElementById('taskbar-settings-panel').classList.remove('visible');
    applyTaskbarConfig();
  });
}

function toggleTaskbarSettings() {
  const panel = document.getElementById('taskbar-settings-panel');
  if (panel) panel.classList.toggle('visible');
}

function applyTaskbarConfig() {
  document.getElementById('codex-taskbar')?.remove();
  document.getElementById('codex-taskbar-trigger')?.remove();
  document.getElementById('taskbar-settings-panel')?.remove();
  if (clockInterval) clearInterval(clockInterval);
  document.body.classList.remove('has-taskbar', 'taskbar-autohide');
  taskbarConfig = loadTaskbarConfig();
  initTaskbar();
}

/* ─── AUTO-INIT ─── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTaskbar);
} else {
  initTaskbar();
}

window.CodexTaskbar = { init: initTaskbar, reload: applyTaskbarConfig, config: taskbarConfig, catalog: TASKBAR_APP_CATALOG };
