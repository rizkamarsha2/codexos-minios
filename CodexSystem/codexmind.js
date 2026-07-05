/* ═══════════════════════════════════════════════════════════════
   CodexMind AI — codexmind.js
   Platform: CodexSystem | AI: CodexMind AI
   Modes (from 395.js): 14 modes | Language: id-ID
   ═══════════════════════════════════════════════════════════════ */

/* ── MODE CONFIG ── */
const AI_MODES = {
  chat:            { label: 'Chat',             icon: '💬', desc: 'Percakapan umum dengan CodexMind AI' },
  research:        { label: 'Research',          icon: '🔍', desc: 'Riset topik secara mendalam' },
  deep_research:   { label: 'Deep Research',     icon: '🔬', desc: 'Analisis komprehensif & multi-sumber' },
  local_research:  { label: 'Local Research',    icon: '🌏', desc: 'Riset berbasis konteks lokal (ID)' },
  minute_research: { label: '1 Minute Research', icon: '⏱',  desc: 'Ringkasan cepat dalam 1 menit' },
  make:            { label: 'Make',              icon: '🔧', desc: 'Buat konten, dokumen, kode' },
  do:              { label: 'Do',               icon: '⚡', desc: 'Jalankan tugas otomatis' },
  neon_chat:       { label: 'Neon Chat',         icon: '🌟', desc: 'Percakapan kreatif bergaya Neon' },
  neon_do:         { label: 'Neon Do',           icon: '💡', desc: 'Eksekusi tugas bergaya Neon' },
  neon_make:       { label: 'Neon Make',         icon: '✨', desc: 'Kreasi konten bergaya Neon' },
  code_review:     { label: 'Code Review',       icon: '📄', desc: 'Tinjau dan perbaiki kode' },
  creative_kick:   { label: 'Creative Kick',     icon: '🎨', desc: 'Percikan ide kreatif' },
  priority_matrix: { label: 'Priority Matrix',   icon: '📊', desc: 'Susun prioritas tugas' },
  wallet_wise:     { label: 'Wallet Wise',       icon: '💰', desc: 'Saran keuangan & penghematan' },
};

/* ── CURRENT CONVERSATION STATE FOR AI ── */
let currentConvId = null;
let isAIProcessing = false;

/* ── STATE ── */
let currentMode      = 'chat';
let chatHistories    = { chat: [] };
let activeHistIdx    = 'chat';
let histCount        = 1;
let sidebarCollapsed = false;
let isListening      = false;
let recognition      = null;
let ttsUtterance     = null;
let attachedFiles    = [];

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
function initCodexMind() {
  /* Generate a conversation ID for memory saving */
  currentConvId = 'conv_' + Date.now();

  bindModeButtons();
  bindSidebarToggle();
  bindInputEvents();
  bindAttachFile();
  bindMicButton();
  bindPills();
  bindUserBtn();
  loadHistory();
  updateModelLabel();

  /* Apply saved appearance */
  try {
    const appearance = JSON.parse(localStorage.getItem('codex_appearance') || '{}');
    if (appearance.theme) document.documentElement.setAttribute('data-theme', appearance.theme);
    if (appearance.fontSize) document.documentElement.style.fontSize = appearance.fontSize + 'px';
  } catch {}
}

/* ── MODE SWITCHING ── */
function bindModeButtons() {
  document.querySelectorAll('.cm-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (!mode) return;
      switchMode(mode);
      document.querySelectorAll('.cm-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function switchMode(mode) {
  currentMode = mode;
  const cfg = AI_MODES[mode] || AI_MODES.chat;

  const indicator = document.getElementById('cm-mode-indicator');
  if (indicator) {
    indicator.innerHTML = `<span class="cm-mode-icon-small">${cfg.icon}</span><span id="cm-mode-name">${cfg.label}</span>`;
  }
  const ta = document.getElementById('cm-textarea');
  if (ta) ta.placeholder = `${cfg.icon} ${cfg.desc} — kirim pesan ke CodexMind AI...`;
  const model = document.getElementById('cm-input-model');
  if (model) model.textContent = `CodexMind ${cfg.label}`;

  const welcome = document.getElementById('cm-welcome');
  if (!chatHistories[mode] || chatHistories[mode].length === 0) {
    if (welcome) welcome.style.display = '';
    const msgs = document.getElementById('cm-messages');
    if (msgs) msgs.querySelectorAll('.cm-msg, .cm-typing').forEach(m => m.remove());
  } else {
    if (welcome) welcome.style.display = 'none';
    renderMessages(mode);
  }
}

/* ── SIDEBAR ── */
function bindSidebarToggle() {
  const sidebar    = document.getElementById('cm-sidebar');
  const toggleBtn  = document.getElementById('cm-sidebar-toggle');
  const topbarMenu = document.getElementById('cm-topbar-menu');
  const newChatBtn = document.getElementById('cm-new-chat');

  const toggle = () => {
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
  };

  if (toggleBtn)  toggleBtn.addEventListener('click', toggle);
  if (topbarMenu) topbarMenu.addEventListener('click', toggle);
  if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);
}

function startNewChat() {
  histCount++;
  const histId = `${currentMode}_${histCount}`;
  chatHistories[histId] = [];

  const history = document.getElementById('cm-history');
  const item    = document.createElement('div');
  item.className    = 'cm-hist-item';
  item.dataset.histId = histId;
  item.innerHTML    = `
    <span class="cm-hist-icon">💬</span>
    <span class="cm-hist-text">Percakapan ${histCount}</span>
    <span class="cm-hist-time">Sekarang</span>`;
  item.addEventListener('click', () => {
    document.querySelectorAll('.cm-hist-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    activeHistIdx = histId;
    renderMessages(histId);
  });

  document.querySelectorAll('.cm-hist-item').forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  history.appendChild(item);
  activeHistIdx = histId;

  const msgs    = document.getElementById('cm-messages');
  const welcome = document.getElementById('cm-welcome');
  if (msgs) msgs.querySelectorAll('.cm-msg, .cm-typing').forEach(m => m.remove());
  if (welcome) welcome.style.display = '';
  clearAttachedFiles();
}

function loadHistory() {
  const history = document.getElementById('cm-history');
  if (!history) return;
  const item = document.createElement('div');
  item.className      = 'cm-hist-item active';
  item.dataset.histId = 'chat';
  item.innerHTML      = `
    <span class="cm-hist-icon">💬</span>
    <span class="cm-hist-text">Percakapan 1</span>
    <span class="cm-hist-time">Sekarang</span>`;
  item.addEventListener('click', () => {
    document.querySelectorAll('.cm-hist-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    activeHistIdx = 'chat';
    renderMessages('chat');
  });
  history.appendChild(item);
  activeHistIdx = 'chat';
}

/* ── RENDER MESSAGES ── */
function renderMessages(histId) {
  const msgs    = document.getElementById('cm-messages');
  const welcome = document.getElementById('cm-welcome');
  if (!msgs) return;

  msgs.querySelectorAll('.cm-msg, .cm-typing').forEach(m => m.remove());

  const hist = chatHistories[histId] || [];
  if (hist.length === 0) {
    if (welcome) welcome.style.display = '';
    return;
  }
  if (welcome) welcome.style.display = 'none';
  hist.forEach(m => appendMsgDOM(m.role, m.text));
}

/* ═══════════════════════════════════════════════════════════════
   INPUT EVENTS — SEND, ENTER
   ═══════════════════════════════════════════════════════════════ */
function bindInputEvents() {
  const textarea = document.getElementById('cm-textarea');
  const sendBtn  = document.getElementById('cm-send-btn');

  if (!textarea) return;

  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    /* Show send button active state when has text */
    if (sendBtn) sendBtn.classList.toggle('has-text', textarea.value.trim().length > 0);
  });

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
}

/* ═══════════════════════════════════════════════════════════════
   ATTACH FILE — TOMBOL LAMPIRKAN (benar-benar berfungsi)
   ═══════════════════════════════════════════════════════════════ */
function bindAttachFile() {
  const fileInput  = document.getElementById('cm-file-input');
  const attachBtnInput = document.querySelector('.cm-attach-btn'); /* tombol di input box */

  if (!fileInput) return;

  /* Buka file picker */
  const openFilePicker = () => fileInput.click();
  if (attachBtnInput) attachBtnInput.addEventListener('click', openFilePicker);

  /* Handle file yang dipilih */
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    if (files.length === 0) return;

    files.forEach(file => {
      attachedFiles.push(file);
      addFileChip(file);
    });

    const names = files.map(f => f.name).join(', ');
    showToast(`${files.length} file dilampirkan: ${names}`, 'success');
    fileInput.value = ''; /* reset supaya bisa pilih file sama lagi */
  });
}

function addFileChip(file) {
  const chipsRow = getOrCreateChipsRow();
  const chip     = document.createElement('div');
  chip.className = 'cm-file-chip';
  const ext      = file.name.split('.').pop().toUpperCase();
  const size     = formatFileSize(file.size);
  chip.innerHTML = `
    <span class="cm-file-chip-icon">📎</span>
    <span class="cm-file-chip-name">${escHtml(file.name)}</span>
    <span class="cm-file-chip-size">${size}</span>
    <button class="cm-file-chip-remove" title="Hapus">✕</button>`;
  chip.querySelector('.cm-file-chip-remove').addEventListener('click', () => {
    attachedFiles = attachedFiles.filter(f => f !== file);
    chip.remove();
    checkChipsRow();
  });
  chipsRow.appendChild(chip);
}

function getOrCreateChipsRow() {
  let row = document.getElementById('cm-chips-row');
  if (!row) {
    row = document.createElement('div');
    row.id = 'cm-chips-row';
    row.className = 'cm-chips-row';
    const inputArea = document.getElementById('cm-input-area');
    const pillsRow  = document.getElementById('cm-pills-row');
    inputArea.insertBefore(row, pillsRow);
  }
  return row;
}

function checkChipsRow() {
  const row = document.getElementById('cm-chips-row');
  if (row && row.children.length === 0) row.remove();
}

function clearAttachedFiles() {
  attachedFiles = [];
  const row = document.getElementById('cm-chips-row');
  if (row) row.remove();
}

function formatFileSize(bytes) {
  if (bytes < 1024)     return bytes + ' B';
  if (bytes < 1048576)  return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/* ═══════════════════════════════════════════════════════════════
   MIC — SPEECH-TO-TEXT (benar-benar berfungsi)
   ═══════════════════════════════════════════════════════════════ */
function bindMicButton() {
  const micBtn = document.querySelector('.cm-mic-btn');
  if (!micBtn) return;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    micBtn.title = 'Browser tidak mendukung pengenalan suara';
    micBtn.style.opacity = '0.5';
    micBtn.addEventListener('click', () => showToast('Browser Anda tidak mendukung fitur pengenalan suara. Coba Chrome/Edge.', 'error'));
    return;
  }

  recognition = new SR();
  recognition.lang = 'id-ID';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let interim = '';

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    micBtn.title = 'Klik untuk berhenti';
    showToast('🎙️ Mendengarkan... Bicara sekarang dalam Bahasa Indonesia', 'info');
  };

  recognition.onresult = e => {
    interim = '';
    let final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        final += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    const ta = document.getElementById('cm-textarea');
    if (ta) {
      const existing = ta.dataset.preVoice || '';
      ta.value = existing + final + interim;
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.title = 'Pesan suara';
    const ta = document.getElementById('cm-textarea');
    if (ta) {
      delete ta.dataset.preVoice;
      if (ta.value.trim()) showToast('✅ Suara dikonversi ke teks', 'success');
    }
  };

  recognition.onerror = e => {
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.title = 'Pesan suara';
    const msgs = {
      'no-speech':     'Tidak ada suara terdeteksi',
      'not-allowed':   'Izin mikrofon ditolak. Aktifkan di pengaturan browser.',
      'network':       'Kesalahan jaringan saat mengenali suara',
      'audio-capture': 'Mikrofon tidak ditemukan',
    };
    showToast(msgs[e.error] || 'Gagal merekam suara: ' + e.error, 'error');
  };

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
    } else {
      const ta = document.getElementById('cm-textarea');
      if (ta) ta.dataset.preVoice = ta.value;
      try { recognition.start(); } catch (err) {
        showToast('Gagal memulai mikrofon: ' + err.message, 'error');
      }
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   PILLS — LAMPIRKAN, CATATAN, SUARA (benar-benar berfungsi)
   ═══════════════════════════════════════════════════════════════ */
function bindPills() {
  document.querySelectorAll('.hand-card-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const action = pill.dataset.action;

      if (action === 'attach') {
        /* Trigger file picker yang sama */
        const fi = document.getElementById('cm-file-input');
        if (fi) fi.click();
      } else if (action === 'mic') {
        /* Trigger mic button */
        const micBtn = document.querySelector('.cm-mic-btn');
        if (micBtn) micBtn.click();
      } else if (action === 'note') {
        openNoteModal();
      }

      pill.classList.add('animate-x-press');
      setTimeout(() => pill.classList.remove('animate-x-press'), 300);
    });
  });
}

/* ── NOTE MODAL ── */
function openNoteModal() {
  if (document.getElementById('cm-note-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'cm-note-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.7);
    display:flex;align-items:center;justify-content:center;
    backdrop-filter:blur(8px);animation:fadeIn .2s ease;`;
  modal.innerHTML = `
    <div style="background:#1a1d2e;border:1px solid #41455a;border-radius:16px;
      padding:24px;width:min(520px,95vw);max-height:80vh;display:flex;flex-direction:column;gap:16px;
      box-shadow:0 24px 64px rgba(0,0,0,.6);">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-weight:700;font-size:16px;color:#fff">📝 Tambah Catatan</span>
        <button id="cm-note-close" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;padding:4px">✕</button>
      </div>
      <textarea id="cm-note-text" placeholder="Tulis catatan Anda di sini..."
        style="background:#252835;border:1px solid #41455a;border-radius:10px;color:#fff;
          font-family:inherit;font-size:14px;line-height:1.6;padding:14px;resize:vertical;
          min-height:150px;outline:none;transition:border .15s;"
        onfocus="this.style.borderColor='#5021ff'" onblur="this.style.borderColor='#41455a'"></textarea>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="cm-note-cancel" style="background:#2e3241;border:1px solid #41455a;color:#ccc;
          padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Batal</button>
        <button id="cm-note-insert" style="background:#5021ff;border:none;color:#fff;
          padding:8px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700">Sisipkan ke Chat</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  setTimeout(() => modal.querySelector('#cm-note-text').focus(), 50);

  const close = () => modal.remove();
  modal.querySelector('#cm-note-close').addEventListener('click', close);
  modal.querySelector('#cm-note-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('#cm-note-insert').addEventListener('click', () => {
    const noteText = modal.querySelector('#cm-note-text').value.trim();
    if (noteText) {
      const ta = document.getElementById('cm-textarea');
      if (ta) {
        ta.value = (ta.value ? ta.value + '\n\n' : '') + `[Catatan: ${noteText}]`;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
        showToast('Catatan disisipkan ke pesan', 'success');
      }
    }
    close();
  });
}

/* ── USER PROFILE BUTTON ── */
function bindUserBtn() {
  const userBtn = document.getElementById('cm-user-btn');
  if (!userBtn) return;
  userBtn.addEventListener('click', () => {
    window.open('/control-panel.html', '_blank');
  });
}

/* ── UPDATE MODEL LABEL ── */
function updateModelLabel() {
  const modelEl = document.getElementById('cm-input-model');
  if (!modelEl || !window.CodexAI) return;
  try {
    const provider = window.CodexAI.getActiveProvider();
    const model    = window.CodexAI.getActiveModel();
    const prov     = window.CodexAI.providers[provider];
    const modelObj = prov?.models.find(m => m.id === model);
    modelEl.textContent = `${prov?.icon || ''} ${modelObj?.label || model || 'CodexMind AI'}`;
  } catch {}
}

/* ═══════════════════════════════════════════════════════════════
   SEND MESSAGE
   ═══════════════════════════════════════════════════════════════ */
async function sendMessage() {
  if (isAIProcessing) return;
  const textarea = document.getElementById('cm-textarea');
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text && attachedFiles.length === 0) return;

  const welcome = document.getElementById('cm-welcome');
  if (welcome) welcome.style.display = 'none';

  if (!chatHistories[activeHistIdx]) chatHistories[activeHistIdx] = [];

  /* Build display text including attached files */
  let displayText = text;
  let fileContext = '';
  if (attachedFiles.length > 0) {
    const fileList = attachedFiles.map(f => `📎 ${f.name} (${formatFileSize(f.size)})`).join('\n');
    displayText = (text ? text + '\n\n' : '') + fileList;
    /* Read text files as context */
    for (const file of attachedFiles) {
      if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|js|py|html|css|json|csv|xml|yaml)$/i)) {
        try {
          const content = await file.text();
          fileContext += `\n\n[File: ${file.name}]\n${content.slice(0, 8000)}`;
        } catch {}
      }
    }
  }

  chatHistories[activeHistIdx].push({ role: 'user', text: displayText });
  appendMsgDOM('user', displayText);

  textarea.value = '';
  textarea.style.height = 'auto';
  clearAttachedFiles();

  const sendBtn = document.getElementById('cm-send-btn');
  if (sendBtn) sendBtn.classList.remove('has-text');

  /* Check if AI engine is available */
  if (!window.CodexAI) {
    appendTyping();
    setTimeout(() => {
      removeTyping();
      const noApiMsg = '⚠️ **AI Engine belum dimuat.** Coba refresh halaman. Pastikan `ai-engine.js` telah di-load dengan benar.';
      chatHistories[activeHistIdx].push({ role: 'assistant', text: noApiMsg });
      appendMsgDOM('assistant', noApiMsg);
    }, 500);
    return;
  }

  /* Build message history for API */
  const history = chatHistories[activeHistIdx];
  const apiMessages = history.slice(-20).map(m => ({
    role:    m.role === 'user' ? 'user' : 'assistant',
    content: m.text + (m === history[history.length - 1] && fileContext ? fileContext : ''),
  }));

  /* RAG context */
  let memoryContext = '';
  if (window.CodexRAG && text) {
    try { memoryContext = window.CodexRAG.getFullContext(text); } catch {}
  }

  /* Show typing indicator */
  appendTyping();
  isAIProcessing = true;

  /* Create streaming message bubble */
  let streamBubble    = null;
  let streamWrapper   = null;
  let streamText      = '';
  let typingRemoved   = false;

  const ensureStreamBubble = () => {
    if (streamBubble) return;
    removeTyping();
    typingRemoved = true;
    streamWrapper = appendStreamingMsg();
    streamBubble  = streamWrapper?.querySelector('.cm-msg-bubble');
  };

  try {
    await window.CodexAI.callAI({
      messages: apiMessages,
      mode:     currentMode,
      memoryContext,

      onChunk: (chunk, full) => {
        ensureStreamBubble();
        streamText = full;
        if (streamBubble) {
          streamBubble.innerHTML = formatMarkdown(full) + '<span class="cm-cursor">▋</span>';
          const msgs = document.getElementById('cm-messages');
          if (msgs) msgs.scrollTop = msgs.scrollHeight;
        }
      },

      onDone: (fullText) => {
        isAIProcessing = false;
        if (!typingRemoved) removeTyping();
        if (streamBubble) {
          streamBubble.innerHTML = formatMarkdown(fullText || streamText);
          /* Add action buttons */
          const actions = document.createElement('div');
          actions.className = 'cm-msg-actions';
          actions.innerHTML = `
            <button class="cm-msg-action-btn" onclick="copyMsg(this)" title="Salin teks">
              <img src="icons/note.svg" alt="Copy" class="icon-svg light-icon"> Salin
            </button>
            <button class="cm-msg-action-btn" onclick="ttsMsg(this)" title="Dengarkan (TTS)">
              🔊 Dengar
            </button>`;
          streamWrapper?.querySelector('.cm-msg-content')?.insertBefore(
            actions,
            streamWrapper.querySelector('.cm-msg-time')
          );
        } else {
          /* onChunk never called (non-streaming response?) */
          removeTyping();
          appendMsgDOM('assistant', fullText || streamText);
        }
        const finalText = fullText || streamText;
        chatHistories[activeHistIdx].push({ role: 'assistant', text: finalText });
        updateHistLabel(displayText);

        /* Save to memory */
        if (window.CodexMemory && currentConvId) {
          window.CodexMemory.saveConversation({
            id:       currentConvId,
            title:    displayText.slice(0, 40) || 'Percakapan',
            mode:     currentMode,
            messages: chatHistories[activeHistIdx].map(m => ({ role: m.role, content: m.text })),
          });
        }
      },

      onError: (errMsg) => {
        isAIProcessing = false;
        if (!typingRemoved) removeTyping();
        if (streamBubble) streamBubble.innerHTML = '';
        if (streamWrapper) streamWrapper.remove();

        const errorText = `❌ **Error:** ${errMsg}\n\n💡 **Solusi:** Buka [Control Panel](/control-panel.html) untuk mengisi API Key provider yang aktif.`;
        chatHistories[activeHistIdx].push({ role: 'assistant', text: errorText });
        appendMsgDOM('assistant', errorText);
        showToast('Error: ' + errMsg.slice(0, 80), 'error');
      },
    });
  } catch (err) {
    isAIProcessing = false;
    if (!typingRemoved) removeTyping();
    const errorText = `❌ **Error tidak terduga:** ${err.message}`;
    chatHistories[activeHistIdx].push({ role: 'assistant', text: errorText });
    appendMsgDOM('assistant', errorText);
  }
}

/* ─── STREAMING MESSAGE BUBBLE ─── */
function appendStreamingMsg() {
  const msgs = document.getElementById('cm-messages');
  if (!msgs) return null;

  const wrap = document.createElement('div');
  wrap.className = 'cm-msg assistant';

  const avatar = document.createElement('div');
  avatar.className = 'cm-msg-avatar';
  const img = document.createElement('img');
  img.src   = 'assets_logo/logo.png';
  img.alt   = 'CodexMind AI';
  img.onerror = () => { avatar.textContent = '🧠'; img.remove(); };
  avatar.appendChild(img);

  const content = document.createElement('div');
  content.className = 'cm-msg-content';

  const bubble = document.createElement('div');
  bubble.className = 'cm-msg-bubble';
  bubble.innerHTML = '<span class="cm-cursor">▋</span>';

  const time = document.createElement('div');
  time.className = 'cm-msg-time';
  time.textContent = 'CodexMind AI · ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  content.appendChild(bubble);
  content.appendChild(time);
  wrap.appendChild(avatar);
  wrap.appendChild(content);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;

  return wrap;
}

function sendSuggestion(btn) {
  const text = btn.querySelector('span:last-child')?.textContent?.trim();
  if (!text) return;
  const ta = document.getElementById('cm-textarea');
  if (ta) {
    ta.value = text;
    sendMessage();
  }
}

/* ═══════════════════════════════════════════════════════════════
   DOM HELPERS
   ═══════════════════════════════════════════════════════════════ */
function appendMsgDOM(role, text) {
  const msgs = document.getElementById('cm-messages');
  if (!msgs) return;

  const wrap    = document.createElement('div');
  wrap.className = `cm-msg ${role}`;

  const avatar  = document.createElement('div');
  avatar.className = 'cm-msg-avatar';
  if (role === 'assistant') {
    const img = document.createElement('img');
    img.src   = 'assets_logo/logo.png';
    img.alt   = 'CodexMind AI';
    img.onerror = () => { avatar.textContent = '🧠'; img.remove(); };
    avatar.appendChild(img);
  } else {
    avatar.textContent = 'U';
  }

  const content = document.createElement('div');
  content.className = 'cm-msg-content';

  const bubble  = document.createElement('div');
  bubble.className = 'cm-msg-bubble';
  bubble.innerHTML = formatMarkdown(text);

  const time    = document.createElement('div');
  time.className = 'cm-msg-time';
  const now     = new Date();
  time.textContent = (role === 'assistant' ? 'CodexMind AI · ' : '') +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  if (role === 'assistant') {
    const actions = document.createElement('div');
    actions.className = 'cm-msg-actions';
    actions.innerHTML = `
      <button class="cm-msg-action-btn" onclick="copyMsg(this)" title="Salin teks">
        <img src="icons/note.svg" alt="Copy" class="icon-svg light-icon"> Salin
      </button>
      <button class="cm-msg-action-btn" onclick="ttsMsg(this)" title="Dengarkan (TTS)">
        🔊 Dengar
      </button>`;
    content.appendChild(bubble);
    content.appendChild(actions);
    content.appendChild(time);
  } else {
    content.appendChild(bubble);
    content.appendChild(time);
  }

  wrap.appendChild(avatar);
  wrap.appendChild(content);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendTyping() {
  const msgs = document.getElementById('cm-messages');
  if (!msgs) return;
  const el   = document.createElement('div');
  el.className = 'cm-typing';
  el.id        = 'cm-typing';
  el.innerHTML = `
    <div class="cm-msg-avatar">
      <img src="assets_logo/logo.png" alt="CodexMind AI" onerror="this.parentElement.textContent='🧠'">
    </div>
    <div class="cm-typing-dots">
      <div class="cm-typing-dot"></div>
      <div class="cm-typing-dot"></div>
      <div class="cm-typing-dot"></div>
    </div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('cm-typing');
  if (el) el.remove();
}

/* ── MARKDOWN ── */
function formatMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm,  '<h3 class="response-header-3">$1</h3>')
    .replace(/^## (.+)$/gm,   '<h2 class="response-header-2">$1</h2>')
    .replace(/^# (.+)$/gm,    '<h1 class="response-header-1">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,         '<em>$1</em>')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_,lang,code) =>
      `<pre class="code-box"><code class="hljs language-${lang || 'text'}">${escHtml(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\|(.+)\|/g, m => parseTableLine(m))
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:8px"><span>$1.</span><span>$2</span></div>')
    .replace(/^[-•] (.+)$/gm, '<div style="display:flex;gap:8px"><span>•</span><span>$1</span></div>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function parseTableLine(line) {
  if (/^\|[-| ]+\|$/.test(line)) return '';
  const cells = line.split('|').filter(c => c.trim() !== '');
  return '<tr>' + cells.map(c =>
    `<td style="padding:8px 12px;border-top:1px solid var(--color-neutral-90)">${c.trim()}</td>`
  ).join('') + '</tr>';
}

function updateHistLabel(text) {
  const active = document.querySelector('.cm-hist-item.active .cm-hist-text');
  if (active) {
    const short = text.length > 22 ? text.substring(0, 22) + '…' : text;
    active.textContent = short;
  }
}

/* ── COPY MSG ── */
function copyMsg(btn) {
  const bubble = btn.closest('.cm-msg-content')?.querySelector('.cm-msg-bubble');
  if (!bubble) return;
  navigator.clipboard.writeText(bubble.innerText).then(() => {
    showToast('Teks disalin ke clipboard', 'success');
  }).catch(() => {
    /* Fallback */
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(bubble);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
    showToast('Teks disalin', 'success');
  });
}

/* ═══════════════════════════════════════════════════════════════
   TTS — TEXT-TO-SPEECH (benar-benar berfungsi)
   ═══════════════════════════════════════════════════════════════ */
function ttsMsg(btn) {
  const bubble = btn.closest('.cm-msg-content')?.querySelector('.cm-msg-bubble');
  if (!bubble) return;

  if (!window.speechSynthesis) {
    showToast('Browser Anda tidak mendukung Text-to-Speech', 'error');
    return;
  }

  /* Jika sedang berbicara, hentikan */
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    hideTtsIndicator();
    btn.textContent = '🔊 Dengar';
    showToast('Pembacaan dihentikan', 'info');
    return;
  }

  const text       = bubble.innerText.replace(/\n+/g, ' ').trim();
  const utterance  = new SpeechSynthesisUtterance(text);
  utterance.lang   = 'id-ID';
  utterance.rate   = 0.95;
  utterance.pitch  = 1;
  utterance.volume = 1;

  /* Cari suara bahasa Indonesia jika tersedia */
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(v => v.lang.startsWith('id'));
  if (idVoice) utterance.voice = idVoice;

  utterance.onstart = () => {
    btn.textContent = '⏹ Berhenti';
    showTtsIndicator();
  };

  utterance.onend = () => {
    btn.textContent = '🔊 Dengar';
    hideTtsIndicator();
  };

  utterance.onerror = () => {
    btn.textContent = '🔊 Dengar';
    hideTtsIndicator();
    showToast('Gagal memutar TTS', 'error');
  };

  window.speechSynthesis.speak(utterance);
  ttsUtterance = utterance;
}

function showTtsIndicator() {
  const el = document.getElementById('cm-tts-indicator');
  if (el) el.style.display = 'block';
}

function hideTtsIndicator() {
  const el = document.getElementById('cm-tts-indicator');
  if (el) el.style.display = 'none';
}

/* ── TOAST ── */
function showToast(msg, type = 'info') {
  const colors = {
    success: { bg: 'rgba(0,171,160,.15)', border: 'rgba(0,171,160,.4)',  color: '#00aba0' },
    error:   { bg: 'rgba(246,81,100,.15)',border: 'rgba(246,81,100,.4)', color: '#f65164' },
    info:    { bg: 'rgba(86,162,239,.12)',border: 'rgba(86,162,239,.3)', color: '#56a2ef' },
  };
  const c     = colors[type] || colors.info;
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${c.bg};border:1px solid ${c.border};color:${c.color};
    padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,.4);
    animation:fadeSlide .3s ease;
    font-family:var(--default-font-family);
    backdrop-filter:blur(10px);`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity    = '0';
    toast.style.transition = 'opacity .35s';
    setTimeout(() => toast.remove(), 350);
  }, 2600);
}

/* ── START ── */
window.addEventListener('DOMContentLoaded', initCodexMind);
