/* ═══════════════════════════════════════════════════════════════
   CodexSystem — Control Panel JS
   Manages: API Keys, Models, RAG, Memory, Taskbar, Appearance
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initApiKeys();
  initModelManager();
  initRAG();
  initMemorySection();
  initTaskbarSection();
  initAppearanceSection();
  initTrainingSection();
  initStatsSection();
  loadProfileForm();
});

/* ─── NAVIGATION ─── */
function initNav() {
  document.querySelectorAll('.cp-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cp-nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.cp-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      const section = document.getElementById('section-' + btn.dataset.section);
      if (section) section.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   API KEYS
   ═══════════════════════════════════════════════════════════════ */
function initApiKeys() {
  const container = document.getElementById('api-keys-container');
  if (!container) return;

  const cfg = window.CodexAI.getConfig();
  const activeProvider = cfg.activeProvider || 'groq';

  container.innerHTML = '';
  Object.entries(window.CodexAI.providers).forEach(([id, prov]) => {
    const savedKey = cfg.apiKeys?.[id] || '';
    const isActive = id === activeProvider;
    const hasKey   = !!savedKey;

    const card = document.createElement('div');
    card.className = `cp-provider-card ${hasKey ? 'has-key' : ''} ${isActive ? 'active-provider' : ''}`;
    card.id = `provider-card-${id}`;

    card.innerHTML = `
      <div class="cp-provider-header">
        <span class="cp-provider-icon">${prov.icon}</span>
        <span class="cp-provider-name">${prov.name}</span>
        ${isActive ? '<span class="cp-provider-status active">✓ Aktif</span>' : ''}
        ${hasKey && !isActive ? '<span class="cp-provider-status ok">✓ Key OK</span>' : ''}
        ${!hasKey ? '<span class="cp-provider-status empty">Belum diatur</span>' : ''}
      </div>
      <div class="cp-provider-input-row">
        <input
          type="password"
          class="cp-key-input"
          id="key-${id}"
          placeholder="${id === 'ollama' ? 'Tidak perlu API key (local)' : `Masukkan ${prov.name} API Key...`}"
          value="${savedKey}"
          ${id === 'ollama' ? 'disabled' : ''}>
        <button class="cp-key-action-btn" onclick="toggleKeyVisibility('${id}')">👁</button>
        <button class="cp-key-action-btn save" onclick="saveApiKey('${id}')">💾 Simpan</button>
        ${savedKey ? `<button class="cp-key-action-btn clear" onclick="clearApiKey('${id}')">✕</button>` : ''}
        ${!isActive ? `<button class="cp-key-action-btn set-active" onclick="setActiveProvider('${id}')">⚡ Aktifkan</button>` : ''}
      </div>
      <div class="cp-provider-models-row" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        ${prov.models.slice(0,4).map(m => `
          <span style="font-size:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
            border-radius:6px;padding:2px 8px;color:rgba(255,255,255,0.4)">${m.label}</span>`).join('')}
        ${prov.models.length > 4 ? `<span style="font-size:11px;color:rgba(255,255,255,0.3)">+${prov.models.length-4} lainnya</span>` : ''}
      </div>`;

    container.appendChild(card);
  });
}

function toggleKeyVisibility(id) {
  const input = document.getElementById(`key-${id}`);
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

function saveApiKey(id) {
  const input = document.getElementById(`key-${id}`);
  if (!input) return;
  const key = input.value.trim();
  const cfg = window.CodexAI.getConfig();
  if (!cfg.apiKeys) cfg.apiKeys = {};
  cfg.apiKeys[id] = key;
  window.CodexAI.saveConfig(cfg);
  showToastCP(key ? `API Key ${window.CodexAI.providers[id].name} disimpan ✓` : 'Key dihapus', key ? 'success' : 'info');
  initApiKeys();
  renderProviderStatus();
}

function clearApiKey(id) {
  const cfg = window.CodexAI.getConfig();
  if (cfg.apiKeys) delete cfg.apiKeys[id];
  window.CodexAI.saveConfig(cfg);
  const input = document.getElementById(`key-${id}`);
  if (input) input.value = '';
  initApiKeys();
  showToastCP('API Key dihapus', 'info');
}

function setActiveProvider(id) {
  const cfg = window.CodexAI.getConfig();
  cfg.activeProvider = id;
  /* Auto-select first model */
  if (!cfg.models) cfg.models = {};
  cfg.models[id] = window.CodexAI.providers[id].models[0]?.id || '';
  window.CodexAI.saveConfig(cfg);
  showToastCP(`${window.CodexAI.providers[id].name} diaktifkan sebagai provider utama`, 'success');
  initApiKeys();
  initModelManager();
}

/* ═══════════════════════════════════════════════════════════════
   MODEL MANAGER
   ═══════════════════════════════════════════════════════════════ */
function initModelManager() {
  const provSelect  = document.getElementById('active-provider-select');
  const modelSelect = document.getElementById('active-model-select');
  if (!provSelect) return;

  const cfg = window.CodexAI.getConfig();

  /* Fill provider list */
  provSelect.innerHTML = Object.entries(window.CodexAI.providers).map(([id, p]) =>
    `<option value="${id}" ${(cfg.activeProvider || 'groq') === id ? 'selected' : ''}>${p.icon} ${p.name}</option>`
  ).join('');

  /* Fill models for selected provider */
  const fillModels = (provId) => {
    const prov  = window.CodexAI.providers[provId];
    const saved = cfg.models?.[provId] || prov?.models[0]?.id || '';
    if (modelSelect) {
      modelSelect.innerHTML = (prov?.models || []).map(m =>
        `<option value="${m.id}" ${m.id === saved ? 'selected' : ''}>${m.label}</option>`
      ).join('');
    }
  };
  fillModels(cfg.activeProvider || 'groq');

  provSelect.addEventListener('change', () => fillModels(provSelect.value));

  /* Temperature */
  const tempRange = document.getElementById('temperature-range');
  const tempVal   = document.getElementById('temperature-val');
  if (tempRange) {
    tempRange.value = cfg.temperature || 0.7;
    if (tempVal) tempVal.textContent = tempRange.value;
    tempRange.addEventListener('input', () => { if (tempVal) tempVal.textContent = tempRange.value; });
  }

  /* Max tokens */
  const maxTok = document.getElementById('max-tokens-input');
  if (maxTok) maxTok.value = cfg.maxTokens || 4096;

  /* Save button */
  document.getElementById('save-model-btn')?.addEventListener('click', () => {
    const c = window.CodexAI.getConfig();
    c.activeProvider = provSelect.value;
    if (!c.models) c.models = {};
    c.models[provSelect.value] = modelSelect?.value || '';
    c.temperature = parseFloat(tempRange?.value || 0.7);
    c.maxTokens   = parseInt(maxTok?.value || 4096);
    window.CodexAI.saveConfig(c);
    showToastCP('Pengaturan model disimpan ✓', 'success');
    initApiKeys();
  });

  renderProviderStatus();
}

function renderProviderStatus() {
  const list = document.getElementById('provider-status-list');
  if (!list) return;
  const cfg = window.CodexAI.getConfig();
  list.innerHTML = Object.entries(window.CodexAI.providers).map(([id, p]) => {
    const hasKey   = !!(cfg.apiKeys?.[id]) || id === 'ollama';
    const isActive = (cfg.activeProvider || 'groq') === id;
    return `<div class="cp-provider-status-row">
      <span class="cp-provider-status-icon">${p.icon}</span>
      <span class="cp-provider-status-name">${p.name}</span>
      <div class="cp-status-dot ${isActive ? 'active' : hasKey ? 'green' : 'gray'}"></div>
      <span style="font-size:11px;color:rgba(255,255,255,0.35)">${isActive ? 'Aktif' : hasKey ? 'Tersedia' : 'Tanpa Key'}</span>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════
   RAG ENGINE
   ═══════════════════════════════════════════════════════════════ */
function initRAG() {
  renderKnowledgeBase();

  /* Dropzone */
  const dropzone  = document.getElementById('rag-dropzone');
  const fileInput = document.getElementById('rag-file-input');

  if (dropzone) {
    dropzone.addEventListener('click', () => fileInput?.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      handleRAGFiles(e.dataTransfer.files);
    });
  }

  fileInput?.addEventListener('change', () => handleRAGFiles(fileInput.files));

  /* Manual add */
  document.getElementById('rag-add-btn')?.addEventListener('click', () => {
    const title   = document.getElementById('rag-title-input')?.value.trim();
    const content = document.getElementById('rag-content-input')?.value.trim();
    const tagsRaw = document.getElementById('rag-tags-input')?.value.trim();
    if (!title || !content) { showToastCP('Judul dan konten wajib diisi', 'error'); return; }
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : [];
    window.CodexMemory.addKnowledge({ title, content, tags, source: 'manual' });
    document.getElementById('rag-title-input').value   = '';
    document.getElementById('rag-content-input').value = '';
    document.getElementById('rag-tags-input').value    = '';
    showToastCP('Pengetahuan ditambahkan ke Knowledge Base ✓', 'success');
    renderKnowledgeBase();
  });

  /* Search */
  document.getElementById('kb-search')?.addEventListener('input', e => {
    renderKnowledgeBase(e.target.value);
  });

  /* RAG settings */
  const ragCfg = JSON.parse(localStorage.getItem('codex_rag_config') || '{}');
  if (document.getElementById('rag-topk')) document.getElementById('rag-topk').value = ragCfg.topK || 5;
  if (document.getElementById('rag-enabled')) document.getElementById('rag-enabled').checked = ragCfg.enabled !== false;
  if (document.getElementById('rag-show-sources')) document.getElementById('rag-show-sources').checked = !!ragCfg.showSources;

  document.getElementById('rag-save-settings')?.addEventListener('click', () => {
    const cfg = {
      topK:        parseInt(document.getElementById('rag-topk')?.value || 5),
      enabled:     document.getElementById('rag-enabled')?.checked !== false,
      showSources: document.getElementById('rag-show-sources')?.checked || false,
    };
    localStorage.setItem('codex_rag_config', JSON.stringify(cfg));
    showToastCP('RAG settings disimpan ✓', 'success');
  });
}

async function handleRAGFiles(files) {
  const status = document.getElementById('rag-upload-status');
  const arr    = Array.from(files);
  if (status) status.textContent = `⏳ Memproses ${arr.length} file...`;

  for (const file of arr) {
    try {
      const item = await window.ingestFile(file);
      if (status) status.textContent += `\n✅ ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
    } catch (e) {
      if (status) status.textContent += `\n❌ ${file.name}: ${e.message}`;
    }
  }

  showToastCP(`${arr.length} file berhasil diproses`, 'success');
  renderKnowledgeBase();
}

function renderKnowledgeBase(search = '') {
  const list = document.getElementById('kb-list');
  const cntEl = document.getElementById('kb-count');
  if (!list) return;

  let kb = window.CodexMemory.getKnowledge();
  if (search) {
    const q = search.toLowerCase();
    kb = kb.filter(k => k.title.toLowerCase().includes(q) || k.content.toLowerCase().includes(q));
  }

  if (cntEl) cntEl.textContent = window.CodexMemory.getKnowledge().length;

  if (kb.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.3)">
      <div style="font-size:36px;margin-bottom:12px">📭</div>
      <div>Knowledge Base kosong. Tambahkan dokumen atau teks di atas.</div></div>`;
    return;
  }

  list.innerHTML = kb.map(item => `
    <div class="kb-item">
      <div class="kb-item-content">
        <div class="kb-item-title">📄 ${escapeHtml(item.title)}</div>
        <div class="kb-item-preview">${escapeHtml(item.content.slice(0, 120))}...</div>
        <div class="kb-item-tags">
          ${(item.tags || []).map(t => `<span class="kb-tag">${escapeHtml(t)}</span>`).join('')}
          <span class="kb-tag" style="background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.25)">${new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
        </div>
      </div>
      <button class="kb-del-btn" onclick="deleteKnowledge('${item.id}')" title="Hapus">🗑</button>
    </div>`).join('');
}

function deleteKnowledge(id) {
  if (!confirm('Hapus item dari knowledge base?')) return;
  window.CodexMemory.deleteKnowledge(id);
  renderKnowledgeBase();
  showToastCP('Item dihapus dari Knowledge Base', 'info');
}

/* ═══════════════════════════════════════════════════════════════
   MEMORY SECTION
   ═══════════════════════════════════════════════════════════════ */
function initMemorySection() {
  renderConversationList();
  renderTrainList();
  loadProfileForm();

  document.getElementById('save-profile-btn')?.addEventListener('click', () => {
    const profile = {
      name:        document.getElementById('profile-name')?.value.trim(),
      lang:        document.getElementById('profile-lang')?.value,
      preferences: document.getElementById('profile-pref')?.value.trim(),
    };
    window.CodexMemory.updateProfile(profile);
    showToastCP('Profil disimpan ✓', 'success');
  });

  document.getElementById('clear-conv-btn')?.addEventListener('click', () => {
    if (!confirm('Hapus semua riwayat percakapan? Tindakan ini tidak dapat dibatalkan.')) return;
    window.CodexMemory.clearConversations();
    renderConversationList();
    showToastCP('Riwayat percakapan dihapus', 'info');
  });

  document.getElementById('add-train-btn')?.addEventListener('click', () => {
    const input  = document.getElementById('train-input')?.value.trim();
    const output = document.getElementById('train-output')?.value.trim();
    const rating = parseInt(document.getElementById('train-rating')?.value || 8);
    if (!input || !output) { showToastCP('Input dan output wajib diisi', 'error'); return; }
    window.CodexMemory.addTrainData({ input, output, rating });
    document.getElementById('train-input').value  = '';
    document.getElementById('train-output').value = '';
    showToastCP('Data pelatihan ditambahkan ✓', 'success');
    renderTrainList();
    const cntEl = document.getElementById('train-count');
    if (cntEl) cntEl.textContent = window.CodexMemory.getTrainData().length;
  });

  document.getElementById('export-train-btn')?.addEventListener('click', exportTrainJSONL);
  document.getElementById('clear-all-memory-btn')?.addEventListener('click', () => {
    if (!confirm('Hapus SEMUA memori termasuk percakapan, knowledge base, dan profil? Tidak dapat dibatalkan!')) return;
    window.CodexMemory.clearAll();
    renderConversationList();
    renderTrainList();
    renderKnowledgeBase();
    showToastCP('Semua memori dihapus', 'info');
  });
}

function loadProfileForm() {
  if (!window.CodexMemory) return;
  const profile = window.CodexMemory.getProfile();
  const nameEl  = document.getElementById('profile-name');
  const langEl  = document.getElementById('profile-lang');
  const prefEl  = document.getElementById('profile-pref');
  if (nameEl) nameEl.value = profile.name || '';
  if (langEl) langEl.value = profile.lang || 'id-ID';
  if (prefEl) prefEl.value = profile.preferences || '';
}

function renderConversationList() {
  const list  = document.getElementById('conv-list');
  const cntEl = document.getElementById('conv-count');
  if (!list) return;

  const convs = window.CodexMemory.getConversations(30);
  if (cntEl) cntEl.textContent = window.CodexMemory.getConversations(999).length;

  if (convs.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.3);font-size:13px">Belum ada riwayat percakapan</div>`;
    return;
  }

  list.innerHTML = convs.map(c => `
    <div class="cp-list-item">
      <div class="cp-list-content">
        <div class="cp-list-title">💬 ${escapeHtml(c.title || 'Percakapan')}</div>
        <div class="cp-list-meta">${c.mode || 'chat'} · ${c.messages?.length || 0} pesan · ${new Date(c.updatedAt || c.createdAt).toLocaleDateString('id-ID')}</div>
      </div>
      <button onclick="deleteConv('${c.id}')" style="background:none;border:none;color:rgba(246,81,100,0.5);cursor:pointer;font-size:16px">🗑</button>
    </div>`).join('');
}

function deleteConv(id) {
  window.CodexMemory.deleteConversation(id);
  renderConversationList();
  showToastCP('Percakapan dihapus', 'info');
}

function renderTrainList() {
  const list  = document.getElementById('train-list');
  const cntEl = document.getElementById('train-count');
  if (!list) return;

  const data = window.CodexMemory.getTrainData();
  if (cntEl) cntEl.textContent = data.length;

  if (data.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.3);font-size:13px">Belum ada data pelatihan</div>`;
    return;
  }

  list.innerHTML = data.slice(0, 20).map(d => `
    <div class="cp-list-item">
      <div class="cp-list-content">
        <div class="cp-list-title">Q: ${escapeHtml(d.input.slice(0, 80))}${d.input.length > 80 ? '…' : ''}</div>
        <div class="cp-list-meta">Rating: ${'⭐'.repeat(Math.min(d.rating, 5))} · ${new Date(d.addedAt).toLocaleDateString('id-ID')}</div>
      </div>
    </div>`).join('');
}

function exportTrainJSONL() {
  const data  = window.CodexMemory.getTrainData();
  const lines = data.map(d => JSON.stringify({
    messages: [
      { role: 'user',      content: d.input  },
      { role: 'assistant', content: d.output },
    ],
    rating: d.rating,
  }));
  const blob  = new Blob([lines.join('\n')], { type: 'application/jsonl' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `codexmind-training-${Date.now()}.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
  showToastCP(`${data.length} pasang data diekspor sebagai JSONL ✓`, 'success');
}

/* ═══════════════════════════════════════════════════════════════
   TASKBAR SECTION
   ═══════════════════════════════════════════════════════════════ */
function initTaskbarSection() {
  const TB_KEY = 'codex_taskbar_config';
  const tbCfg  = JSON.parse(localStorage.getItem(TB_KEY) || '{}');
  const CATALOG = window.CodexTaskbar?.catalog || [];

  const enabledEl   = document.getElementById('tb-main-enabled');
  const autohideEl  = document.getElementById('tb-main-autohide');
  if (enabledEl)  enabledEl.checked  = tbCfg.enabled  !== false;
  if (autohideEl) autohideEl.checked = !!tbCfg.autohide;

  /* App grid */
  const grid = document.getElementById('cp-app-grid');
  if (grid) {
    const active = tbCfg.activeApps || CATALOG.filter(a => a.default).map(a => a.id);
    grid.innerHTML = CATALOG.map(app => `
      <div class="cp-app-manager-item ${active.includes(app.id) ? 'active' : ''}" data-app-id="${app.id}">
        <div class="cp-app-manager-icon">${app.emoji || '📱'}</div>
        <div class="cp-app-manager-name">${app.label}</div>
      </div>`).join('');

    grid.querySelectorAll('.cp-app-manager-item').forEach(item => {
      item.addEventListener('click', () => {
        item.classList.toggle('active');
      });
    });
  }

  document.getElementById('save-taskbar-btn')?.addEventListener('click', () => {
    const activeApps = [...document.querySelectorAll('.cp-app-manager-item.active')].map(el => el.dataset.appId);
    const newCfg = {
      ...tbCfg,
      enabled:    enabledEl?.checked !== false,
      autohide:   autohideEl?.checked || false,
      activeApps,
    };
    localStorage.setItem(TB_KEY, JSON.stringify(newCfg));
    showToastCP('Pengaturan Taskbar disimpan ✓ (refresh halaman untuk melihat perubahan)', 'success');
  });

  /* Add custom app */
  document.getElementById('cp-add-app-btn')?.addEventListener('click', () => {
    const name = document.getElementById('cp-app-name')?.value.trim();
    const url  = document.getElementById('cp-app-url')?.value.trim();
    const icon = document.getElementById('cp-app-icon')?.value.trim() || '🔗';
    if (!name || !url) { showToastCP('Nama dan URL wajib diisi', 'error'); return; }
    const id    = 'custom_' + Date.now();
    const saved = JSON.parse(localStorage.getItem(TB_KEY) || '{}');
    if (!saved.customApps) saved.customApps = [];
    if (!saved.activeApps) saved.activeApps = [];
    saved.customApps.push({ id, label: name, emoji: icon, url });
    saved.activeApps.push(id);
    localStorage.setItem(TB_KEY, JSON.stringify(saved));
    showToastCP(`Aplikasi "${name}" ditambahkan ke Taskbar ✓`, 'success');
    initTaskbarSection();
  });
}

/* ═══════════════════════════════════════════════════════════════
   APPEARANCE
   ═══════════════════════════════════════════════════════════════ */
function initAppearanceSection() {
  const saved = JSON.parse(localStorage.getItem('codex_appearance') || '{}');

  document.querySelectorAll('.cp-theme-item').forEach(item => {
    item.classList.toggle('active', item.dataset.theme === (saved.theme || 'codexsystem-dark'));
    item.addEventListener('click', () => {
      document.querySelectorAll('.cp-theme-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  const fontEl = document.getElementById('font-size-select');
  if (fontEl) fontEl.value = saved.fontSize || '14';

  document.getElementById('save-appearance-btn')?.addEventListener('click', () => {
    const theme    = document.querySelector('.cp-theme-item.active')?.dataset.theme || 'codexsystem-dark';
    const fontSize = fontEl?.value || '14';
    localStorage.setItem('codex_appearance', JSON.stringify({ theme, fontSize }));
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.fontSize = fontSize + 'px';
    showToastCP('Tampilan disimpan ✓', 'success');
  });

  /* Apply saved appearance */
  if (saved.theme) document.documentElement.setAttribute('data-theme', saved.theme);
  if (saved.fontSize) document.documentElement.style.fontSize = saved.fontSize + 'px';
}

/* ═══════════════════════════════════════════════════════════════
   TRAINING SECTION
   ═══════════════════════════════════════════════════════════════ */
function initTrainingSection() {
  renderFullTrainList();
  renderTrainSummary();

  document.getElementById('export-jsonl-btn')?.addEventListener('click', exportTrainJSONL);
  document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    const data = window.CodexMemory.getTrainData();
    const csv  = ['input,output,rating', ...data.map(d =>
      `"${d.input.replace(/"/g,'""')}","${d.output.replace(/"/g,'""')}",${d.rating}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `codexmind-training-${Date.now()}.csv` });
    a.click(); URL.revokeObjectURL(url);
    showToastCP(`${data.length} item diekspor sebagai CSV ✓`, 'success');
  });
  document.getElementById('clear-train-btn')?.addEventListener('click', () => {
    if (!confirm('Hapus semua data pelatihan?')) return;
    localStorage.removeItem('codex_memory_train_data');
    renderFullTrainList(); renderTrainSummary();
    showToastCP('Data pelatihan dihapus', 'info');
  });
}

function renderFullTrainList() {
  const list = document.getElementById('full-train-list');
  if (!list) return;
  const data = window.CodexMemory.getTrainData();
  if (data.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.3)">Belum ada data pelatihan. Tambahkan di bagian Memory System.</div>`;
    return;
  }
  list.innerHTML = data.map((d, i) => `
    <div class="cp-list-item" style="flex-direction:column;align-items:flex-start">
      <div style="display:flex;width:100%;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;color:rgba(255,255,255,0.35)">#${i+1} · Rating: ${'⭐'.repeat(Math.min(d.rating,5))} · ${new Date(d.addedAt).toLocaleDateString('id-ID')}</span>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px">INPUT: ${escapeHtml(d.input.slice(0,150))}${d.input.length>150?'…':''}</div>
      <div style="font-size:12px;color:#a99fff">OUTPUT: ${escapeHtml(d.output.slice(0,150))}${d.output.length>150?'…':''}</div>
    </div>`).join('');
}

function renderTrainSummary() {
  const grid = document.getElementById('train-summary-cards');
  if (!grid) return;
  const data  = window.CodexMemory.getTrainData();
  const avgRating = data.length ? (data.reduce((s,d) => s+d.rating, 0) / data.length).toFixed(1) : '-';
  grid.innerHTML = `
    <div class="cp-stat-card"><div class="cp-stat-value">${data.length}</div><div class="cp-stat-label">Total Pasang</div></div>
    <div class="cp-stat-card"><div class="cp-stat-value">${avgRating}</div><div class="cp-stat-label">Rating Rata-rata</div></div>
    <div class="cp-stat-card"><div class="cp-stat-value">${data.filter(d=>d.rating>=8).length}</div><div class="cp-stat-label">Rating Tinggi (≥8)</div></div>`;
}

/* ═══════════════════════════════════════════════════════════════
   STATISTICS
   ═══════════════════════════════════════════════════════════════ */
function initStatsSection() {
  const grid = document.getElementById('stats-grid');
  if (!grid || !window.CodexMemory) return;

  const stats = window.CodexMemory.getStats();
  grid.innerHTML = `
    <div class="cp-stat-card"><div class="cp-stat-value">${stats.conversations}</div><div class="cp-stat-label">Percakapan</div></div>
    <div class="cp-stat-card"><div class="cp-stat-value">${stats.totalMessages}</div><div class="cp-stat-label">Total Pesan</div></div>
    <div class="cp-stat-card"><div class="cp-stat-value">${stats.knowledgeItems}</div><div class="cp-stat-label">Knowledge Items</div></div>
    <div class="cp-stat-card"><div class="cp-stat-value">${stats.trainPairs}</div><div class="cp-stat-label">Training Pairs</div></div>
    <div class="cp-stat-card"><div class="cp-stat-value">${stats.storageKB} KB</div><div class="cp-stat-label">Storage Used</div></div>`;

  const storage = document.getElementById('storage-info');
  if (storage) {
    const providers = Object.entries(window.CodexAI.providers).filter(([id]) => window.CodexAI.hasApiKey(id));
    storage.innerHTML = `
      <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px">
        💾 Total penyimpanan lokal: <strong style="color:#a99fff">${stats.storageKB} KB</strong>
      </div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5)">
        🔑 Provider dengan API key: <strong style="color:#00aba0">${providers.length > 0 ? providers.map(([,p]) => p.name).join(', ') : 'Belum ada'}</strong>
      </div>`;
  }
}

/* ─── UTILS ─── */
function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToastCP(msg, type = 'info') {
  const colors = {
    success: { bg: 'rgba(0,171,160,.15)', border: 'rgba(0,171,160,.4)',  color: '#00aba0' },
    error:   { bg: 'rgba(246,81,100,.15)',border: 'rgba(246,81,100,.4)', color: '#f65164' },
    info:    { bg: 'rgba(80,33,255,.12)', border: 'rgba(80,33,255,.3)',  color: '#a99fff' },
  };
  const c     = colors[type] || colors.info;
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;bottom:80px;right:24px;z-index:99999;
    background:${c.bg};border:1px solid ${c.border};color:${c.color};
    padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,.4);backdrop-filter:blur(10px);
    animation:fadeSlide .3s ease;max-width:380px;word-break:break-word`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity    = '0';
    toast.style.transition = 'opacity .35s';
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

/* Global refs for onclick in HTML */
window.deleteKnowledge = deleteKnowledge;
window.deleteConv      = deleteConv;
window.saveApiKey      = saveApiKey;
window.clearApiKey     = clearApiKey;
window.setActiveProvider = setActiveProvider;
window.toggleKeyVisibility = toggleKeyVisibility;
