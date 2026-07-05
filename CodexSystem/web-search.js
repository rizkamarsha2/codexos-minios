/* ═══════════════════════════════════════════════════════════════
   CodexMind Web Search — web-search.js
   Tavily API + Serper API + DuckDuckGo fallback
   Digunakan oleh mode: Research, Deep Research, Local Research
   ═══════════════════════════════════════════════════════════════ */

const WS_PROXY = '/api/search';

/* ─── PROVIDER CONFIG ─── */
const SEARCH_PROVIDERS = {
  tavily: {
    name:    'Tavily',
    icon:    '🔍',
    baseUrl: 'https://api.tavily.com/search',
    models:  ['tavily-search'],
  },
  serper: {
    name:    'Serper (Google)',
    icon:    '🌐',
    baseUrl: 'https://google.serper.dev/search',
    models:  ['google-web'],
  },
  duckduckgo: {
    name:    'DuckDuckGo Instant',
    icon:    '🦆',
    baseUrl: null,
    models:  ['ddg-instant'],
    free:    true,
  },
};

function getSearchConfig() {
  try { return JSON.parse(localStorage.getItem('codex_search_config') || '{}'); }
  catch { return {}; }
}

function saveSearchConfig(cfg) {
  localStorage.setItem('codex_search_config', JSON.stringify(cfg));
}

function getSearchApiKey(provider) {
  return getSearchConfig().apiKeys?.[provider] || '';
}

function getActiveSearchProvider() {
  return getSearchConfig().activeProvider || 'tavily';
}

/* ─── MAIN SEARCH FUNCTION ─── */
async function webSearch(query, options = {}) {
  const {
    maxResults    = 8,
    searchDepth   = 'basic',
    includeImages = false,
    country       = 'id',
    lang          = 'id',
    onStatus,
  } = options;

  const provider  = getActiveSearchProvider();
  const apiKey    = getSearchApiKey(provider);

  onStatus?.(`🔍 Mencari: "${query}"...`);

  /* Try configured provider first, fallback to DuckDuckGo */
  if (provider === 'tavily' && apiKey) {
    return await searchTavily(query, { apiKey, maxResults, searchDepth });
  } else if (provider === 'serper' && apiKey) {
    return await searchSerper(query, { apiKey, maxResults, lang });
  } else {
    /* Proxy fallback — server handles DuckDuckGo-style search */
    return await searchViaProxy(query, { maxResults, lang });
  }
}

/* ─── TAVILY ─── */
async function searchTavily(query, { apiKey, maxResults, searchDepth }) {
  try {
    const resp = await fetch(WS_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchProvider: 'tavily',
        apiKey,
        query,
        max_results:   maxResults,
        search_depth:  searchDepth,
        include_answer: true,
      }),
    });
    if (!resp.ok) throw new Error(`Tavily error ${resp.status}`);
    const data = await resp.json();
    return formatTavilyResults(data, query);
  } catch (err) {
    return await searchViaProxy(query, { maxResults });
  }
}

function formatTavilyResults(data, query) {
  const results = (data.results || []).map(r => ({
    title:   r.title || '',
    url:     r.url   || '',
    snippet: r.content || r.snippet || '',
    score:   r.score || 0,
  }));
  return {
    query,
    answer:  data.answer || '',
    results,
    provider: 'Tavily',
  };
}

/* ─── SERPER ─── */
async function searchSerper(query, { apiKey, maxResults, lang }) {
  try {
    const resp = await fetch(WS_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchProvider: 'serper',
        apiKey,
        q: query,
        num: maxResults,
        gl: lang === 'id' ? 'id' : 'us',
        hl: lang,
      }),
    });
    if (!resp.ok) throw new Error(`Serper error ${resp.status}`);
    const data = await resp.json();
    return formatSerperResults(data, query);
  } catch (err) {
    return await searchViaProxy(query, { maxResults });
  }
}

function formatSerperResults(data, query) {
  const organic = data.organic || [];
  const results = organic.slice(0, 8).map(r => ({
    title:   r.title || '',
    url:     r.link  || '',
    snippet: r.snippet || '',
    score:   (r.position ? 1 / r.position : 0),
  }));
  const answer = data.answerBox?.answer || data.answerBox?.snippet || '';
  return { query, answer, results, provider: 'Serper (Google)' };
}

/* ─── PROXY FALLBACK ─── */
async function searchViaProxy(query, { maxResults = 6 } = {}) {
  try {
    const resp = await fetch(WS_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchProvider: 'duckduckgo', query, maxResults }),
    });
    if (!resp.ok) throw new Error('Search proxy error');
    const data = await resp.json();
    return data;
  } catch (err) {
    return {
      query,
      answer:   '',
      results:  [],
      provider: 'Unavailable',
      error:    err.message,
    };
  }
}

/* ─── BUILD SEARCH CONTEXT STRING (untuk AI) ─── */
function buildSearchContext(searchResult) {
  if (!searchResult || !searchResult.results?.length) return '';

  let ctx = `[HASIL PENCARIAN WEB — ${searchResult.provider}]\n`;
  ctx += `Kueri: "${searchResult.query}"\n`;
  ctx += `Waktu: ${new Date().toLocaleString('id-ID')}\n\n`;

  if (searchResult.answer) {
    ctx += `📌 Jawaban Langsung:\n${searchResult.answer}\n\n`;
  }

  searchResult.results.forEach((r, i) => {
    ctx += `[${i+1}] ${r.title}\n`;
    ctx += `    URL: ${r.url}\n`;
    ctx += `    ${r.snippet}\n\n`;
  });

  ctx += `[Gunakan hasil di atas sebagai sumber utama. Sebutkan URL sumber saat relevan.]`;
  return ctx;
}

/* ─── LOCAL RESEARCH (fokus Indonesia) ─── */
async function webSearchLocal(query) {
  return await webSearch(query + ' Indonesia site:id OR site:co.id OR filetype:pdf', {
    maxResults:  8,
    searchDepth: 'advanced',
    country:     'id',
    lang:        'id',
  });
}

/* ─── EXPORTS ─── */
if (typeof window !== 'undefined') {
  window.CodexSearch = {
    search:        webSearch,
    searchLocal:   webSearchLocal,
    buildContext:  buildSearchContext,
    getConfig:     getSearchConfig,
    saveConfig:    saveSearchConfig,
    providers:     SEARCH_PROVIDERS,
    getApiKey:     getSearchApiKey,
    getActiveProvider: getActiveSearchProvider,
  };
}
