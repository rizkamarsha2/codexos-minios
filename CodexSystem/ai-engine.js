/* ═══════════════════════════════════════════════════════════════
   CodexMind AI Engine — ai-engine.js
   Semua provider AI: OpenAI, Groq, Gemini, Claude, Qwen,
   DeepSeek, Mistral, Cohere, Together, Ollama, + lainnya
   API keys disimpan di localStorage via Control Panel
   ═══════════════════════════════════════════════════════════════ */

const CODEX_PROXY = '/api/chat';   /* Python proxy untuk CORS */

/* ─── PROVIDER CATALOG ─── */
const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    icon: '🤖',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    models: [
      { id: 'gpt-4o',                label: 'GPT-4o' },
      { id: 'gpt-4o-mini',           label: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo',           label: 'GPT-4 Turbo' },
      { id: 'gpt-4',                 label: 'GPT-4' },
      { id: 'gpt-3.5-turbo',         label: 'GPT-3.5 Turbo' },
      { id: 'gpt-3.5-turbo-16k',     label: 'GPT-3.5 Turbo 16K' },
      { id: 'o1-preview',            label: 'o1 Preview' },
      { id: 'o1-mini',               label: 'o1 Mini' },
      { id: 'o3-mini',               label: 'o3 Mini' },
    ],
    format: 'openai',
  },
  groq: {
    name: 'Groq',
    icon: '⚡',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    models: [
      { id: 'llama-3.3-70b-versatile',     label: 'Llama 3.3 70B' },
      { id: 'llama-3.1-70b-versatile',     label: 'Llama 3.1 70B' },
      { id: 'llama-3.1-8b-instant',        label: 'Llama 3.1 8B Instant' },
      { id: 'llama3-70b-8192',             label: 'Llama 3 70B' },
      { id: 'llama3-8b-8192',              label: 'Llama 3 8B' },
      { id: 'mixtral-8x7b-32768',          label: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it',                label: 'Gemma 2 9B' },
      { id: 'gemma-7b-it',                 label: 'Gemma 7B' },
      { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill 70B' },
      { id: 'qwen-qwq-32b',               label: 'Qwen QwQ 32B' },
    ],
    format: 'openai',
  },
  gemini: {
    name: 'Google Gemini',
    icon: '✦',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    authHeader: key => ({ 'x-goog-api-key': key }),
    models: [
      { id: 'gemini-2.0-flash',           label: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite',      label: 'Gemini 2.0 Flash Lite' },
      { id: 'gemini-2.5-pro-preview',     label: 'Gemini 2.5 Pro Preview' },
      { id: 'gemini-1.5-pro',             label: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash',           label: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-flash-8b',        label: 'Gemini 1.5 Flash 8B' },
      { id: 'gemini-1.0-pro',             label: 'Gemini 1.0 Pro' },
    ],
    format: 'gemini',
  },
  claude: {
    name: 'Anthropic Claude',
    icon: '🔮',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    authHeader: key => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
    models: [
      { id: 'claude-opus-4-5',            label: 'Claude Opus 4.5' },
      { id: 'claude-sonnet-4-5',          label: 'Claude Sonnet 4.5' },
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229',     label: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229',   label: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307',    label: 'Claude 3 Haiku' },
    ],
    format: 'claude',
    needsProxy: true, /* CORS blocked by browser */
  },
  deepseek: {
    name: 'DeepSeek',
    icon: '🌊',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    models: [
      { id: 'deepseek-chat',              label: 'DeepSeek Chat (V3)' },
      { id: 'deepseek-reasoner',          label: 'DeepSeek R1 Reasoner' },
      { id: 'deepseek-coder',             label: 'DeepSeek Coder' },
    ],
    format: 'openai',
  },
  qwen: {
    name: 'Alibaba Qwen',
    icon: '🌐',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    models: [
      { id: 'qwen-max',                   label: 'Qwen Max' },
      { id: 'qwen-max-latest',            label: 'Qwen Max (Latest)' },
      { id: 'qwen-plus',                  label: 'Qwen Plus' },
      { id: 'qwen-plus-latest',           label: 'Qwen Plus (Latest)' },
      { id: 'qwen-turbo',                 label: 'Qwen Turbo' },
      { id: 'qwen-turbo-latest',          label: 'Qwen Turbo (Latest)' },
      { id: 'qwen2.5-72b-instruct',       label: 'Qwen 2.5 72B' },
      { id: 'qwen2.5-32b-instruct',       label: 'Qwen 2.5 32B' },
      { id: 'qwen2.5-14b-instruct',       label: 'Qwen 2.5 14B' },
      { id: 'qwen2.5-7b-instruct',        label: 'Qwen 2.5 7B' },
      { id: 'qwq-32b',                    label: 'QwQ 32B (Reasoning)' },
    ],
    format: 'openai',
    needsProxy: true,
  },
  mistral: {
    name: 'Mistral AI',
    icon: '🌪️',
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    models: [
      { id: 'mistral-large-latest',       label: 'Mistral Large' },
      { id: 'mistral-medium-latest',      label: 'Mistral Medium' },
      { id: 'mistral-small-latest',       label: 'Mistral Small' },
      { id: 'mistral-nemo',               label: 'Mistral Nemo' },
      { id: 'codestral-latest',           label: 'Codestral' },
      { id: 'pixtral-large-latest',       label: 'Pixtral Large' },
      { id: 'pixtral-12b-2409',           label: 'Pixtral 12B' },
    ],
    format: 'openai',
  },
  cohere: {
    name: 'Cohere',
    icon: '🔵',
    baseUrl: 'https://api.cohere.ai/v1/chat',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    models: [
      { id: 'command-r-plus',             label: 'Command R+' },
      { id: 'command-r',                  label: 'Command R' },
      { id: 'command',                    label: 'Command' },
      { id: 'command-light',              label: 'Command Light' },
    ],
    format: 'cohere',
    needsProxy: true,
  },
  together: {
    name: 'Together AI',
    icon: '🤝',
    baseUrl: 'https://api.together.xyz/v1/chat/completions',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',   label: 'Llama 3.3 70B Turbo' },
      { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B' },
      { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',     label: 'Mixtral 8x22B' },
      { id: 'Qwen/QwQ-32B-Preview',                       label: 'QwQ 32B' },
      { id: 'deepseek-ai/DeepSeek-R1',                    label: 'DeepSeek R1' },
    ],
    format: 'openai',
  },
  openrouter: {
    name: 'OpenRouter',
    icon: '🚦',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    authHeader: key => ({ 'Authorization': `Bearer ${key}`, 'HTTP-Referer': 'https://codexsystem.ai', 'X-Title': 'CodexMind AI' }),
    models: [
      { id: 'openai/gpt-4o',                             label: 'GPT-4o (via OR)' },
      { id: 'anthropic/claude-3.5-sonnet',               label: 'Claude 3.5 Sonnet (via OR)' },
      { id: 'google/gemini-2.0-flash-exp:free',          label: 'Gemini 2.0 Flash Free' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free',   label: 'Llama 3.3 70B Free' },
      { id: 'deepseek/deepseek-r1:free',                 label: 'DeepSeek R1 Free' },
      { id: 'qwen/qwq-32b:free',                         label: 'QwQ 32B Free' },
      { id: 'mistralai/mistral-7b-instruct:free',        label: 'Mistral 7B Free' },
    ],
    format: 'openai',
  },
  ollama: {
    name: 'Ollama (Local)',
    icon: '🦙',
    baseUrl: 'http://localhost:11434/api/chat',
    authHeader: () => ({}),
    models: [
      { id: 'llama3.2',     label: 'Llama 3.2' },
      { id: 'llama3.1',     label: 'Llama 3.1' },
      { id: 'mistral',      label: 'Mistral 7B' },
      { id: 'phi3',         label: 'Phi-3' },
      { id: 'gemma2',       label: 'Gemma 2' },
      { id: 'qwen2.5',      label: 'Qwen 2.5' },
      { id: 'deepseek-r1',  label: 'DeepSeek R1' },
      { id: 'codellama',    label: 'Code Llama' },
    ],
    format: 'ollama',
  },
  huggingface: {
    name: 'HuggingFace',
    icon: '🤗',
    baseUrl: 'https://api-inference.huggingface.co/models',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    models: [
      { id: 'mistralai/Mistral-7B-Instruct-v0.3',         label: 'Mistral 7B Instruct v0.3' },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',       label: 'Mixtral 8x7B Instruct' },
      { id: 'meta-llama/Llama-3.2-11B-Vision-Instruct',   label: 'Llama 3.2 11B Vision' },
      { id: 'meta-llama/Meta-Llama-3-8B-Instruct',        label: 'Llama 3 8B Instruct' },
      { id: 'HuggingFaceH4/zephyr-7b-beta',               label: 'Zephyr 7B Beta' },
      { id: 'Qwen/Qwen2.5-72B-Instruct',                  label: 'Qwen 2.5 72B Instruct' },
      { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',   label: 'DeepSeek R1 Distill 32B' },
      { id: 'google/gemma-2-9b-it',                        label: 'Gemma 2 9B Instruct' },
      { id: 'microsoft/phi-4',                             label: 'Microsoft Phi-4' },
      { id: 'tiiuae/falcon-7b-instruct',                   label: 'Falcon 7B Instruct' },
      { id: 'bigcode/starcoder2-15b',                      label: 'StarCoder 2 15B (Code)' },
      { id: 'codellama/CodeLlama-34b-Instruct-hf',         label: 'CodeLlama 34B Instruct' },
    ],
    format: 'huggingface',
  },
};

/* ─── LOAD CONFIG ─── */
function getConfig() {
  try {
    return JSON.parse(localStorage.getItem('codexmind_config') || '{}');
  } catch { return {}; }
}

function saveConfig(cfg) {
  localStorage.setItem('codexmind_config', JSON.stringify(cfg));
}

function getActiveProvider() {
  const cfg = getConfig();
  return cfg.activeProvider || 'groq';
}

function getActiveModel() {
  const cfg     = getConfig();
  const provider = getActiveProvider();
  return cfg.models?.[provider] || AI_PROVIDERS[provider]?.models[0]?.id || '';
}

function getApiKey(provider) {
  const cfg = getConfig();
  return cfg.apiKeys?.[provider] || '';
}

function hasApiKey(provider) {
  return !!getApiKey(provider);
}

/* ─── SYSTEM PROMPT ─── */
function buildSystemPrompt(mode, memoryContext) {
  const modePrompts = {
    chat:            'Kamu adalah CodexMind AI, asisten AI cerdas dalam platform CodexSystem. Jawab dalam Bahasa Indonesia secara natural dan membantu.',
    research:        'Kamu adalah CodexMind AI dalam mode Research. Lakukan riset mendalam, berikan fakta akurat dengan referensi yang jelas. Bahasa Indonesia.',
    deep_research:   'Kamu adalah CodexMind AI dalam mode Deep Research. Analisis komprehensif dengan metodologi ilmiah. Sertakan perspektif berbeda dan bukti empiris. Bahasa Indonesia.',
    local_research:  'Kamu adalah CodexMind AI dalam mode Local Research. Fokus pada konteks Indonesia: regulasi, budaya, pasar, dan sumber lokal. Bahasa Indonesia.',
    minute_research: 'Kamu adalah CodexMind AI dalam mode 1-Minute Research. Berikan ringkasan singkat, padat, dan akurat dalam format poin-poin. Bahasa Indonesia.',
    make:            'Kamu adalah CodexMind AI dalam mode Make. Buat konten, dokumen, kode, atau materi yang diminta dengan kualitas tinggi. Bahasa Indonesia.',
    do:              'Kamu adalah CodexMind AI dalam mode Do. Eksekusi tugas dengan langkah-langkah konkret dan hasil yang dapat langsung digunakan. Bahasa Indonesia.',
    neon_chat:       'Kamu adalah CodexMind AI dalam mode Neon Chat. Jawab dengan gaya kreatif, energetik, dan penuh warna. Gunakan emoji dan bahasa yang menarik. Bahasa Indonesia.',
    neon_do:         'Kamu adalah CodexMind AI dalam mode Neon Do. Eksekusi tugas dengan semangat tinggi dan kreativitas penuh. Bahasa Indonesia.',
    neon_make:       'Kamu adalah CodexMind AI dalam mode Neon Make. Ciptakan karya yang luar biasa dengan sentuhan kreatif unik. Bahasa Indonesia.',
    code_review:     'Kamu adalah CodexMind AI dalam mode Code Review. Analisis kode dengan teliti: performa, keamanan, keterbacaan, dan best practices. Berikan saran konkret dengan contoh kode perbaikan. Bahasa Indonesia.',
    creative_kick:   'Kamu adalah CodexMind AI dalam mode Creative Kick. Berikan ide-ide segar, inovatif, dan out-of-the-box. Gali berbagai perspektif unik. Bahasa Indonesia.',
    priority_matrix: 'Kamu adalah CodexMind AI dalam mode Priority Matrix. Gunakan Eisenhower Matrix dan framework manajemen untuk mengorganisir dan memprioritaskan tugas. Bahasa Indonesia.',
    wallet_wise:     'Kamu adalah CodexMind AI dalam mode Wallet Wise. Berikan saran keuangan praktis dan bijak. Selalu sertakan disclaimer bahwa ini bukan saran keuangan profesional. Bahasa Indonesia.',
  };

  let systemPrompt = modePrompts[mode] || modePrompts.chat;

  if (memoryContext && memoryContext.length > 0) {
    systemPrompt += `\n\n[MEMORY CONTEXT]\n${memoryContext}`;
  }

  return systemPrompt;
}

/* ─── MAIN API CALL ─── */
async function callAI({ messages, mode = 'chat', onChunk, onDone, onError, memoryContext = '' }) {
  const provider = getActiveProvider();
  const model    = getActiveModel();
  const apiKey   = getApiKey(provider);
  const provCfg  = AI_PROVIDERS[provider];

  if (!provCfg) {
    onError?.('Provider tidak dikenali: ' + provider);
    return;
  }

  if (!apiKey && provider !== 'ollama') {
    onError?.(`API Key ${provCfg.name} belum diatur. Buka Control Panel untuk mengisi API Key.`);
    return;
  }

  const systemPrompt = buildSystemPrompt(mode, memoryContext);
  const allMessages  = [{ role: 'system', content: systemPrompt }, ...messages];

  try {
    let response;

    if (provCfg.needsProxy || provider === 'claude' || provider === 'cohere') {
      /* Route melalui proxy Python untuk menghindari CORS */
      response = await fetch(CODEX_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey, messages: allMessages }),
      });
    } else if (provCfg.format === 'gemini') {
      return await callGemini({ model, apiKey, messages: allMessages, onChunk, onDone, onError });
    } else if (provCfg.format === 'ollama') {
      return await callOllama({ model, messages: allMessages, onChunk, onDone, onError });
    } else if (provCfg.format === 'huggingface') {
      return await callHuggingFace({ model, apiKey, messages: allMessages, onChunk, onDone, onError });
    } else {
      /* OpenAI-compatible: direct fetch dengan streaming */
      response = await fetch(provCfg.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...provCfg.authHeader(apiKey),
        },
        body: JSON.stringify({
          model,
          messages: allMessages,
          stream: true,
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Error ${response.status}`;
      try { errMsg = JSON.parse(errText)?.error?.message || errMsg; } catch {}
      onError?.(errMsg);
      return;
    }

    /* Stream reading */
    await readStream(response, onChunk, onDone);

  } catch (err) {
    onError?.(err.message || 'Koneksi gagal. Periksa API key dan koneksi internet.');
  }
}

/* ─── STREAM READER (SSE format) ─── */
async function readStream(response, onChunk, onDone) {
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';
  let   fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const data  = JSON.parse(trimmed.slice(6));
        const delta = data.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          onChunk?.(delta, fullText);
        }
      } catch {}
    }
  }

  onDone?.(fullText);
}

/* ─── GEMINI FORMAT ─── */
async function callGemini({ model, apiKey, messages, onChunk, onDone, onError }) {
  /* Convert messages to Gemini format */
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs  = messages.filter(m => m.role !== 'system');

  const contents = chatMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
  };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const url = `${AI_PROVIDERS.gemini.baseUrl}/${model}:streamGenerateContent?alt=sse`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      let msg = `Gemini Error ${response.status}`;
      try { msg = JSON.parse(err)?.error?.message || msg; } catch {}
      onError?.(msg); return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';
    let   fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data  = JSON.parse(line.slice(6));
          const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (chunk) {
            fullText += chunk;
            onChunk?.(chunk, fullText);
          }
        } catch {}
      }
    }
    onDone?.(fullText);
  } catch (err) {
    onError?.(err.message);
  }
}

/* ─── HUGGINGFACE Inference API ─── */
async function callHuggingFace({ model, apiKey, messages, onChunk, onDone, onError }) {
  try {
    /* Convert messages to a single prompt string */
    const prompt = messages.map(m => {
      if (m.role === 'system')    return `<s>[INST] <<SYS>>\n${m.content}\n<</SYS>>\n\n`;
      if (m.role === 'user')      return `${m.content} [/INST]`;
      if (m.role === 'assistant') return `${m.content} </s><s>[INST] `;
      return m.content;
    }).join('');

    const url      = `https://api-inference.huggingface.co/models/${model}`;
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        inputs:     prompt,
        parameters: { max_new_tokens: 1024, temperature: 0.7, return_full_text: false },
        stream:     true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      let msg = `HuggingFace Error ${response.status}`;
      try { msg = JSON.parse(err)?.error || msg; } catch {}
      if (response.status === 503) msg = 'Model sedang loading di HuggingFace, coba lagi dalam 20 detik.';
      onError?.(msg); return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';
    let   fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const data  = JSON.parse(line.slice(5));
          const chunk = data.token?.text || '';
          if (chunk && chunk !== '</s>') { fullText += chunk; onChunk?.(chunk, fullText); }
        } catch {}
      }
    }

    /* Fallback: non-streaming HuggingFace response */
    if (!fullText) {
      try {
        const resp2 = await fetch(url, {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 1024, return_full_text: false } }),
        });
        const data2 = await resp2.json();
        fullText = Array.isArray(data2) ? data2[0]?.generated_text || '' : data2?.generated_text || '';
        onChunk?.(fullText, fullText);
      } catch {}
    }

    onDone?.(fullText);
  } catch (err) {
    onError?.('HuggingFace error: ' + err.message);
  }
}

/* ─── OLLAMA (Local) ─── */
async function callOllama({ model, messages, onChunk, onDone, onError }) {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!response.ok) { onError?.('Ollama tidak dapat diakses. Pastikan Ollama berjalan di localhost:11434'); return; }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data  = JSON.parse(line);
          const chunk = data.message?.content || '';
          if (chunk) { fullText += chunk; onChunk?.(chunk, fullText); }
        } catch {}
      }
    }
    onDone?.(fullText);
  } catch (err) {
    onError?.('Ollama error: ' + err.message);
  }
}

/* ─── EXPORTS ─── */
if (typeof window !== 'undefined') {
  window.CodexAI = {
    providers: AI_PROVIDERS,
    callAI,
    getConfig, saveConfig,
    getActiveProvider, getActiveModel, getApiKey, hasApiKey,
  };
}
