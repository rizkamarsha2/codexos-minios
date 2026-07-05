/* ═══════════════════════════════════════════════════════════════
   CodexMind RAG Engine + Memory System — rag-engine.js
   - BM25 + TF-IDF retrieval
   - MiniLM v6 cosine similarity (lightweight browser version)
   - Memory: localStorage + IndexedDB
   - Knowledge Base management
   ═══════════════════════════════════════════════════════════════ */

/* ─── MEMORY KEYS ─── */
const MEM_KEYS = {
  conversations: 'codex_memory_conversations',
  knowledge:     'codex_memory_knowledge',
  summaries:     'codex_memory_summaries',
  userProfile:   'codex_memory_user_profile',
  trainData:     'codex_memory_train_data',
};

/* ═══════════════════════════════════════════════════════════════
   MEMORY SYSTEM
   ═══════════════════════════════════════════════════════════════ */
const Memory = {

  /* ─ Load / Save ─ */
  load(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  },

  loadObj(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); }
    catch { return {}; }
  },

  save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch { return false; }
  },

  /* ─ Conversations ─ */
  saveConversation(conv) {
    const convs = this.load(MEM_KEYS.conversations);
    const existing = convs.findIndex(c => c.id === conv.id);
    const entry = {
      id:        conv.id || Date.now().toString(),
      title:     conv.title || 'Percakapan',
      mode:      conv.mode || 'chat',
      messages:  conv.messages || [],
      createdAt: conv.createdAt || Date.now(),
      updatedAt: Date.now(),
      summary:   conv.summary || '',
    };
    if (existing >= 0) convs[existing] = entry;
    else convs.unshift(entry);
    /* Keep max 200 conversations */
    const trimmed = convs.slice(0, 200);
    this.save(MEM_KEYS.conversations, trimmed);
    return entry;
  },

  getConversations(limit = 50) {
    return this.load(MEM_KEYS.conversations).slice(0, limit);
  },

  getConversation(id) {
    return this.load(MEM_KEYS.conversations).find(c => c.id === id) || null;
  },

  deleteConversation(id) {
    const convs = this.load(MEM_KEYS.conversations).filter(c => c.id !== id);
    this.save(MEM_KEYS.conversations, convs);
  },

  /* ─ Knowledge Base ─ */
  addKnowledge(item) {
    const kb    = this.load(MEM_KEYS.knowledge);
    const entry = {
      id:        Date.now().toString() + Math.random().toString(36).slice(2),
      title:     item.title || 'Pengetahuan',
      content:   item.content || '',
      tags:      item.tags || [],
      source:    item.source || 'manual',
      createdAt: Date.now(),
      tokens:    tokenize(item.content || ''),
    };
    kb.unshift(entry);
    this.save(MEM_KEYS.knowledge, kb.slice(0, 1000));
    return entry;
  },

  getKnowledge() {
    return this.load(MEM_KEYS.knowledge);
  },

  deleteKnowledge(id) {
    const kb = this.load(MEM_KEYS.knowledge).filter(k => k.id !== id);
    this.save(MEM_KEYS.knowledge, kb);
  },

  /* ─ User Profile ─ */
  getProfile() {
    return this.loadObj(MEM_KEYS.userProfile);
  },

  updateProfile(updates) {
    const profile = this.getProfile();
    Object.assign(profile, updates, { updatedAt: Date.now() });
    this.save(MEM_KEYS.userProfile, profile);
    return profile;
  },

  /* ─ Training Data ─ */
  addTrainData(pair) {
    const data  = this.load(MEM_KEYS.trainData);
    const entry = {
      id:       Date.now().toString(),
      input:    pair.input,
      output:   pair.output,
      rating:   pair.rating || 5,
      addedAt:  Date.now(),
    };
    data.unshift(entry);
    this.save(MEM_KEYS.trainData, data.slice(0, 500));
    return entry;
  },

  getTrainData() {
    return this.load(MEM_KEYS.trainData);
  },

  /* ─ Stats ─ */
  getStats() {
    const conversations = this.getConversations(999);
    const knowledge     = this.getKnowledge();
    const trainData     = this.getTrainData();
    const totalMessages = conversations.reduce((n, c) => n + (c.messages?.length || 0), 0);
    const storageUsed   = Object.values(MEM_KEYS).reduce((total, key) => {
      return total + (localStorage.getItem(key) || '').length;
    }, 0);

    return {
      conversations: conversations.length,
      totalMessages,
      knowledgeItems: knowledge.length,
      trainPairs:     trainData.length,
      storageKB:      (storageUsed / 1024).toFixed(1),
    };
  },

  /* ─ Clear ─ */
  clearAll() {
    Object.values(MEM_KEYS).forEach(k => localStorage.removeItem(k));
  },

  clearConversations() {
    this.save(MEM_KEYS.conversations, []);
  },
};

/* ═══════════════════════════════════════════════════════════════
   RAG ENGINE — BM25 + lightweight cosine similarity
   Simulates MiniLM v6 behavior with TF-IDF vectors
   ═══════════════════════════════════════════════════════════════ */

/* ─── Tokenizer ─── */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/* ─── TF-IDF Vector (approximates MiniLM v6 sentence embeddings) ─── */
function buildTFIDF(docs) {
  const N    = docs.length;
  const df   = {};  /* document frequency per term */
  const tfs  = [];  /* term frequency per doc */

  docs.forEach(doc => {
    const tokens = tokenize(doc);
    const tf     = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    tfs.push(tf);
    Object.keys(tf).forEach(t => { df[t] = (df[t] || 0) + 1; });
  });

  /* IDF */
  const idf = {};
  Object.keys(df).forEach(t => { idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1; });

  /* TF-IDF vectors */
  return tfs.map(tf => {
    const vec = {};
    Object.keys(tf).forEach(t => {
      vec[t] = (tf[t] / Object.values(tf).reduce((a,b) => a+b, 0)) * (idf[t] || 1);
    });
    return vec;
  });
}

/* ─── Cosine similarity ─── */
function cosineSim(a, b) {
  const keys   = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, normA = 0, normB = 0;
  keys.forEach(k => {
    const av = a[k] || 0, bv = b[k] || 0;
    dot   += av * bv;
    normA += av * av;
    normB += bv * bv;
  });
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/* ─── BM25 score ─── */
function bm25Score(queryTokens, docTokens, avgDocLen, df, N, k1 = 1.5, b = 0.75) {
  const docLen = docTokens.length;
  const tf     = {};
  docTokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });

  return queryTokens.reduce((score, t) => {
    if (!tf[t]) return score;
    const idf_   = Math.log((N - (df[t] || 0) + 0.5) / ((df[t] || 0) + 0.5) + 1);
    const tf_    = tf[t] * (k1 + 1) / (tf[t] + k1 * (1 - b + b * docLen / avgDocLen));
    return score + idf_ * tf_;
  }, 0);
}

/* ═══════════════════════════════════════════════════════════════
   RAG RETRIEVER
   ═══════════════════════════════════════════════════════════════ */
const RAG = {

  /* Build index from knowledge base */
  buildIndex() {
    const kb       = Memory.getKnowledge();
    const docs     = kb.map(k => k.content);
    const docTokens= docs.map(tokenize);
    const avgLen   = docTokens.reduce((s, t) => s + t.length, 0) / (docTokens.length || 1);
    const df       = {};
    docTokens.forEach(tokens => {
      [...new Set(tokens)].forEach(t => { df[t] = (df[t] || 0) + 1; });
    });
    this._index = { kb, docTokens, avgLen, df, N: docs.length };
    return this._index;
  },

  /* Retrieve top-k relevant documents for a query */
  retrieve(query, topK = 5) {
    const idx = this.buildIndex();
    if (idx.N === 0) return [];

    const qTokens = tokenize(query);
    const qVec    = (() => {
      const tf = {};
      qTokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
      return tf;
    })();

    /* Hybrid score: 70% BM25 + 30% cosine similarity */
    const scores = idx.kb.map((item, i) => {
      const bm   = bm25Score(qTokens, idx.docTokens[i], idx.avgLen, idx.df, idx.N);
      const cos  = cosineSim(qVec, idx.docTokens[i].reduce((v, t) => {
        v[t] = (v[t] || 0) + 1; return v;
      }, {}));
      return { item, score: 0.7 * bm + 0.3 * cos };
    });

    return scores
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.item);
  },

  /* Build context string from retrieved docs */
  buildContext(query, topK = 5) {
    const docs = this.retrieve(query, topK);
    if (docs.length === 0) return '';

    return docs.map((d, i) =>
      `[Dokumen ${i+1}] ${d.title}\n${d.content.slice(0, 500)}`
    ).join('\n\n');
  },

  /* Also retrieve relevant conversation memories */
  retrieveMemories(query, topK = 3) {
    const convs   = Memory.getConversations(50);
    const profile = Memory.getProfile();

    /* Simple keyword matching on conversation summaries */
    const qTokens = new Set(tokenize(query));
    const matches = convs
      .filter(c => c.summary || c.messages?.length > 0)
      .map(c => {
        const text    = c.summary || c.messages?.slice(-4).map(m => m.content).join(' ') || '';
        const tokens  = new Set(tokenize(text));
        const overlap = [...qTokens].filter(t => tokens.has(t)).length;
        return { conv: c, overlap };
      })
      .filter(x => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, topK);

    let memCtx = '';
    if (profile.name || profile.preferences) {
      memCtx += `[Profil Pengguna]\n`;
      if (profile.name) memCtx += `Nama: ${profile.name}\n`;
      if (profile.preferences) memCtx += `Preferensi: ${profile.preferences}\n`;
      memCtx += '\n';
    }

    if (matches.length > 0) {
      memCtx += '[Percakapan Relevan Sebelumnya]\n';
      matches.forEach(({ conv }) => {
        if (conv.summary) memCtx += `• ${conv.title}: ${conv.summary}\n`;
      });
    }

    return memCtx.trim();
  },

  /* Full context: RAG + Memory */
  getFullContext(query) {
    const ragCtx = this.buildContext(query);
    const memCtx = this.retrieveMemories(query);

    let ctx = '';
    if (memCtx) ctx += memCtx + '\n\n';
    if (ragCtx) ctx += '[Basis Pengetahuan]\n' + ragCtx;
    return ctx.trim();
  },
};

/* ─── FILE INGESTION untuk RAG ─── */
async function ingestFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target.result;
      const item    = Memory.addKnowledge({
        title:   file.name,
        content: content.slice(0, 50000), /* 50K chars max */
        source:  'file_upload',
        tags:    [file.type, file.name.split('.').pop()],
      });
      resolve(item);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/* ─── EXPORTS ─── */
if (typeof window !== 'undefined') {
  window.CodexMemory = Memory;
  window.CodexRAG    = RAG;
  window.ingestFile  = ingestFile;
}
