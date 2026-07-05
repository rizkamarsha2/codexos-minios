/* ═══════════════════════════════════════════════════════════════
   CodexSystem — app.js
   Speed Dial / Start Page (CodexMind_System module)
   Synchronized with CodexMind AI module
   ═══════════════════════════════════════════════════════════════ */

/* ── SPEED DIAL DATA (from strings.m.js site config) ── */
const SPEED_DIAL_SITES = [
  { name: 'Google',      url: 'https://google.com',      img: 'bookmarks/bm_.png'  },
  { name: 'YouTube',     url: 'https://youtube.com',     img: 'bookmarks/bm0.png'  },
  { name: 'Facebook',    url: 'https://facebook.com',    img: 'bookmarks/bm1.png'  },
  { name: 'X / Twitter', url: 'https://x.com',           img: 'bookmarks/bm2.png'  },
  { name: 'Instagram',   url: 'https://instagram.com',   img: 'bookmarks/bm3.png'  },
  { name: 'Tokopedia',   url: 'https://tokopedia.com',   img: 'bookmarks/bm4.png'  },
  { name: 'Shopee',      url: 'https://shopee.co.id',    img: 'bookmarks/bm5.png'  },
  { name: 'Wikipedia',   url: 'https://wikipedia.org',   img: 'bookmarks/bm6.png'  },
  { name: 'GitHub',      url: 'https://github.com',      img: 'bookmarks/bm7.png'  },
  { name: 'Reddit',      url: 'https://reddit.com',      img: 'bookmarks/bm8.png'  },
];

/* ── BOOT MESSAGES (from strings.m.js app strings) ── */
const BOOT_MESSAGES = [
  'Menginisialisasi CodexSystem...',
  'Memuat CodexMind AI Core...',
  'Menghubungkan modul sistem...',
  'Mengkalibrasi Rich Wallpaper...',
  'Memuat Speed Dial bookmarks...',
  'Sinkronisasi modul selesai!',
];

/* ── STATE ── */
let speedDialData  = loadSpeedDial();
let showLabels     = true;
let panelOpen      = false;
let settingsOpen   = false;
let panelChatCount = 0;

/* ──────────────────────────────────────
   BOOT SPLASH
   ────────────────────────────────────── */
function runBoot() {
  const fill  = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  const splash = document.getElementById('splash');
  const app    = document.getElementById('app');
  let step = 0;
  const total = BOOT_MESSAGES.length;

  const tick = setInterval(() => {
    if (step >= total) {
      clearInterval(tick);
      setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
          splash.style.display = 'none';
          app.classList.remove('hidden');
          initApp();
        }, 600);
      }, 280);
      return;
    }
    fill.style.width = ((step + 1) / total * 100) + '%';
    label.textContent = BOOT_MESSAGES[step];
    step++;
  }, 450);
}

/* ──────────────────────────────────────
   INIT
   ────────────────────────────────────── */
function initApp() {
  renderSpeedDial();
  startClock();
  bindEvents();
  restoreSettings();
}

/* ──────────────────────────────────────
   CLOCK (from strings.m.js: language:'id', locationCountry:'ID')
   ────────────────────────────────────── */
function startClock() {
  function update() {
    const now = new Date();
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }
  update();
  setInterval(update, 1000);
}

/* ──────────────────────────────────────
   SPEED DIAL (from bookmark-image/ module)
   ────────────────────────────────────── */
function loadSpeedDial() {
  try {
    const saved = localStorage.getItem('codexsystem_speeddial');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return [...SPEED_DIAL_SITES];
}

function saveSpeedDial() {
  try { localStorage.setItem('codexsystem_speeddial', JSON.stringify(speedDialData)); } catch(e) {}
}

function renderSpeedDial() {
  const grid = document.getElementById('speeddial-grid');
  if (!grid) return;
  grid.innerHTML = '';

  speedDialData.forEach((site, idx) => {
    const card = document.createElement('a');
    card.className = 'sd-card';
    card.href = site.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.title = site.name;
    card.style.animationDelay = (idx * 30) + 'ms';

    const img = document.createElement('img');
    img.className = 'sd-card-img';
    img.alt = site.name;
    img.loading = 'lazy';
    img.src = site.img;
    img.onerror = function() {
      this.style.display = 'none';
      card.style.background = `hsl(${(idx * 37) % 360}, 35%, 18%)`;
    };

    const overlay = document.createElement('div');
    overlay.className = 'sd-card-overlay';

    const name = document.createElement('div');
    name.className = 'sd-card-name';
    name.textContent = site.name;
    name.style.display = showLabels ? '' : 'none';

    const url = document.createElement('div');
    url.className = 'sd-card-url';
    url.textContent = new URL(site.url).hostname;
    url.style.display = showLabels ? '' : 'none';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'sd-card-remove';
    removeBtn.innerHTML = '&#10005;';
    removeBtn.title = 'Hapus';
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeSpeedDial(idx);
    });

    overlay.appendChild(name);
    overlay.appendChild(url);
    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(removeBtn);
    grid.appendChild(card);
  });
}

function removeSpeedDial(idx) {
  speedDialData.splice(idx, 1);
  saveSpeedDial();
  renderSpeedDial();
}

function addSpeedDial() {
  const nameEl = document.getElementById('new-site-name');
  const urlEl  = document.getElementById('new-site-url');
  const name   = nameEl ? nameEl.value.trim() : '';
  let   url    = urlEl  ? urlEl.value.trim()  : '';

  if (!name || !url) return;
  if (!url.startsWith('http')) url = 'https://' + url;

  const imgIdx = speedDialData.length % 10;
  speedDialData.push({
    name,
    url,
    img: `bookmarks/bm${imgIdx}.png`,
  });
  saveSpeedDial();
  renderSpeedDial();
  closeAddModal();
  if (nameEl) nameEl.value = '';
  if (urlEl)  urlEl.value  = '';
}

function toggleLabels(show) {
  showLabels = show;
  document.querySelectorAll('.sd-card-name, .sd-card-url').forEach(el => {
    el.style.display = show ? '' : 'none';
  });
}

/* ──────────────────────────────────────
   MODAL
   ────────────────────────────────────── */
function openAddModal() {
  const modal = document.getElementById('add-modal');
  if (modal) modal.classList.remove('hidden');
}
function closeAddModal() {
  const modal = document.getElementById('add-modal');
  if (modal) modal.classList.add('hidden');
}

/* ──────────────────────────────────────
   PANELS
   ────────────────────────────────────── */
function toggleCodexMindPanel() {
  const panel    = document.getElementById('codexmind-panel');
  const settings = document.getElementById('settings-panel');
  panelOpen = !panelOpen;
  if (panelOpen) {
    panel.classList.remove('hidden');
    settingsOpen = false;
    settings.classList.add('hidden');
  } else {
    panel.classList.add('hidden');
  }
}

function toggleSettingsPanel() {
  const panel    = document.getElementById('settings-panel');
  const codexPan = document.getElementById('codexmind-panel');
  settingsOpen = !settingsOpen;
  if (settingsOpen) {
    panel.classList.remove('hidden');
    panelOpen = false;
    codexPan.classList.add('hidden');
  } else {
    panel.classList.add('hidden');
  }
}

/* ──────────────────────────────────────
   THEME (from themes/opera-dark.css, midnight, light)
   ────────────────────────────────────── */
function setTheme(theme, btn) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'opera-dark' : theme);
  document.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  try { localStorage.setItem('codexsystem_theme', theme); } catch(e) {}
}

/* ──────────────────────────────────────
   WALLPAPER (from rich-wallpaper module)
   ────────────────────────────────────── */
function setWallpaper(type, btn) {
  const layer = document.getElementById('wallpaper-layer');
  const img   = document.getElementById('wallpaper-img');
  document.querySelectorAll('.wp-opt').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (type === 'none') {
    if (img) img.style.display = 'none';
    layer.style.background = 'linear-gradient(135deg, #0b0426 0%, #121212 100%)';
  } else {
    if (img) img.style.display = 'block';
    layer.style.background = '';
  }
  try { localStorage.setItem('codexsystem_wallpaper', type); } catch(e) {}
}

function restoreSettings() {
  try {
    const theme = localStorage.getItem('codexsystem_theme');
    if (theme) {
      const btn = document.querySelector(`.theme-opt[data-theme="${theme}"]`);
      setTheme(theme, btn);
    }
    const wp = localStorage.getItem('codexsystem_wallpaper');
    if (wp) {
      const btn = document.querySelector(`.wp-opt[data-wp="${wp}"]`);
      setWallpaper(wp, btn);
    }
  } catch(e) {}
}

/* ──────────────────────────────────────
   CODEXMIND AI PANEL CHAT
   (Mini version — full version in codexmind.html)
   ────────────────────────────────────── */
const PANEL_AI_REPLIES = [
  q => `Halo! Saya **CodexMind AI** dari CodexSystem.\n\nMengenai "${q}" — saya memproses permintaan ini dan siap membantu. Untuk pengalaman penuh dengan semua mode AI (Research, Deep Research, Make, Do, Neon, dan alat khusus), buka **CodexMind AI lengkap**.`,
  q => `Pertanyaan bagus tentang **"${q}"**!\n\nCodexMind AI menganalisis permintaan Anda menggunakan model terintegrasi CodexSystem. Jawaban lengkap tersedia di antarmuka penuh. Klik "Buka CodexMind AI lengkap" di bawah untuk akses semua fitur.`,
  q => `Saya memproses **"${q}"** menggunakan CodexMind Pro.\n\nCodexSystem mengintegrasikan AI Chat, Research, Deep Research, Make, Do, Neon, dan berbagai alat khusus. Silakan buka antarmuka penuh untuk respons terbaik.`,
];
let panelReplyIdx = 0;

function appendPanelMsg(role, text) {
  const msgs = document.getElementById('panel-messages');
  if (!msgs) return;

  const wrap = document.createElement('div');
  wrap.className = `panel-msg ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'panel-msg-avatar';
  avatar.textContent = role === 'user' ? 'U' : '🧠';

  const bubble = document.createElement('div');
  bubble.className = 'panel-msg-bubble';
  bubble.innerHTML = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendPanelTyping() {
  const msgs = document.getElementById('panel-messages');
  if (!msgs) return;
  const el = document.createElement('div');
  el.className = 'panel-msg ai';
  el.id = 'panel-typing';
  el.innerHTML = `
    <div class="panel-msg-avatar">🧠</div>
    <div class="panel-msg-bubble">
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function sendPanelMessage(text) {
  if (!text || !text.trim()) return;
  const chips = document.getElementById('panel-chips');
  if (chips) chips.style.display = 'none';

  appendPanelMsg('user', text);
  appendPanelTyping();

  setTimeout(() => {
    const typing = document.getElementById('panel-typing');
    if (typing) typing.remove();
    const fn = PANEL_AI_REPLIES[panelReplyIdx % PANEL_AI_REPLIES.length];
    panelReplyIdx++;
    appendPanelMsg('ai', fn(text));
  }, 900 + Math.random() * 600);
}

function panelSendChip(btn) {
  const text = btn.textContent.replace(/^[^\w\s]+\s*/, '').trim();
  sendPanelMessage(text);
}

/* ──────────────────────────────────────
   SEARCH (from strings.m.js: searchButton, searchTheWeb)
   ────────────────────────────────────── */
function handleSearch(e) {
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (!val) return;
    let url;
    if (/^https?:\/\//.test(val) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(val)) {
      url = val.startsWith('http') ? val : 'https://' + val;
    } else {
      url = 'https://www.google.com/search?q=' + encodeURIComponent(val);
    }
    window.open(url, '_blank', 'noopener');
    e.target.value = '';
  }
}

/* ──────────────────────────────────────
   BIND ALL EVENTS
   ────────────────────────────────────── */
function bindEvents() {
  /* Search */
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.addEventListener('keydown', handleSearch);

  /* CodexMind AI panel button */
  const codexBtn = document.getElementById('codexmind-btn');
  if (codexBtn) codexBtn.addEventListener('click', toggleCodexMindPanel);

  /* Settings button */
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) settingsBtn.addEventListener('click', toggleSettingsPanel);

  /* Panel close */
  const panelClose = document.getElementById('panel-close');
  if (panelClose) panelClose.addEventListener('click', () => {
    document.getElementById('codexmind-panel').classList.add('hidden');
    panelOpen = false;
  });

  /* Settings close */
  const settingsClose = document.getElementById('settings-close');
  if (settingsClose) settingsClose.addEventListener('click', () => {
    document.getElementById('settings-panel').classList.add('hidden');
    settingsOpen = false;
  });

  /* Panel send */
  const panelSendBtn = document.getElementById('panel-send');
  const panelInput   = document.getElementById('panel-input');
  if (panelSendBtn && panelInput) {
    panelSendBtn.addEventListener('click', () => {
      sendPanelMessage(panelInput.value);
      panelInput.value = '';
    });
    panelInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        sendPanelMessage(panelInput.value);
        panelInput.value = '';
      }
    });
  }

  /* Add speed dial button */
  const addBtn = document.getElementById('speeddial-add');
  if (addBtn) addBtn.addEventListener('click', openAddModal);

  /* Modal overlay click to close */
  const modal = document.getElementById('add-modal');
  if (modal) modal.addEventListener('click', e => {
    if (e.target === modal) closeAddModal();
  });

  /* Close panels on outside click */
  document.addEventListener('click', e => {
    const codexPan = document.getElementById('codexmind-panel');
    const settPan  = document.getElementById('settings-panel');
    const codexBtn2 = document.getElementById('codexmind-btn');
    const settBtn2  = document.getElementById('settings-btn');

    if (panelOpen && codexPan &&
        !codexPan.contains(e.target) && e.target !== codexBtn2 && !codexBtn2.contains(e.target)) {
      codexPan.classList.add('hidden');
      panelOpen = false;
    }
    if (settingsOpen && settPan &&
        !settPan.contains(e.target) && e.target !== settBtn2 && !settBtn2.contains(e.target)) {
      settPan.classList.add('hidden');
      settingsOpen = false;
    }
  });

  /* Keyboard shortcuts */
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const si = document.getElementById('search-input');
      if (si) si.focus();
    }
    if (e.key === 'Escape') {
      closeAddModal();
      document.getElementById('codexmind-panel')?.classList.add('hidden');
      document.getElementById('settings-panel')?.classList.add('hidden');
      panelOpen = settingsOpen = false;
    }
  });
}

/* ── START ── */
window.addEventListener('DOMContentLoaded', runBoot);
