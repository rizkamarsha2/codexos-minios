"""
CodexSystem AI — HTTP Server v2.4
Melayani: index.html, codexmind.html, control-panel.html
Proxy: /api/chat → AI providers | /api/search → Tavily/Serper/DuckDuckGo
"""
import http.server
import socketserver
import os
import json
import urllib.request
import urllib.error
import urllib.parse
import mimetypes

mimetypes.add_type('image/png',       '.png')
mimetypes.add_type('image/jpeg',      '.jpeg')
mimetypes.add_type('image/jpeg',      '.jpg')
mimetypes.add_type('image/gif',       '.gif')
mimetypes.add_type('image/svg+xml',   '.svg')
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css',        '.css')
mimetypes.add_type('application/json','.json')

PORT = 5000

# ─── AI Provider proxy config ───
PROVIDER_ENDPOINTS = {
    'openai':     'https://api.openai.com/v1/chat/completions',
    'groq':       'https://api.groq.com/openai/v1/chat/completions',
    'deepseek':   'https://api.deepseek.com/v1/chat/completions',
    'mistral':    'https://api.mistral.ai/v1/chat/completions',
    'together':   'https://api.together.xyz/v1/chat/completions',
    'openrouter': 'https://openrouter.ai/api/v1/chat/completions',
    'qwen':       'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    'claude':     'https://api.anthropic.com/v1/messages',
    'cohere':     'https://api.cohere.ai/v1/chat',
    'gemini':     None,  # handled client-side (CORS OK)
    'ollama':     'http://localhost:11434/api/chat',
}


def build_openai_body(payload):
    return {
        'model':       payload.get('model'),
        'messages':    payload.get('messages', []),
        'stream':      True,
        'max_tokens':  payload.get('maxTokens', 4096),
        'temperature': payload.get('temperature', 0.7),
    }


def build_claude_body(payload):
    msgs     = payload.get('messages', [])
    sys_msg  = next((m['content'] for m in msgs if m['role'] == 'system'), None)
    chat_msgs = [m for m in msgs if m['role'] != 'system']
    body = {
        'model':      payload.get('model', 'claude-3-5-sonnet-20241022'),
        'messages':   chat_msgs,
        'max_tokens': payload.get('maxTokens', 4096),
        'stream':     True,
    }
    if sys_msg:
        body['system'] = sys_msg
    return body


def build_cohere_body(payload):
    msgs     = payload.get('messages', [])
    sys_msg  = next((m['content'] for m in msgs if m['role'] == 'system'), '')
    chat_msgs = [m for m in msgs if m['role'] != 'system']
    history  = [{'role': m['role'], 'message': m['content']} for m in chat_msgs[:-1]]
    query    = chat_msgs[-1]['content'] if chat_msgs else ''
    return {
        'model':        payload.get('model', 'command-r-plus'),
        'message':      query,
        'chat_history': history,
        'preamble':     sys_msg,
        'stream':       True,
    }


class CodexSystemHandler(http.server.SimpleHTTPRequestHandler):

    def end_headers(self):
        if os.environ.get('NODE_ENV') != 'production':
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        if path in ('/', ''):
            self.path = '/desktop.html'
        elif path in ('/classic', '/classic/'):
            self.path = '/index.html'
        elif path in ('/system', '/system/'):
            self.path = '/CodexMind_System/index.html'
        elif path in ('/ai', '/ai/', '/chat', '/chat/'):
            self.path = '/codexmind.html'
        elif path in ('/cp', '/panel', '/control-panel', '/control-panel/'):
            self.path = '/control-panel.html'
        return super().do_GET()

    def do_POST(self):
        path = self.path.split('?')[0]
        if path == '/api/chat':
            self._handle_ai_proxy()
        elif path == '/api/search':
            self._handle_search_proxy()
        else:
            self.send_response(404)
            self.end_headers()

    def _handle_ai_proxy(self):
        """Proxy AI API calls to avoid CORS restrictions."""
        try:
            length  = int(self.headers.get('Content-Length', 0))
            raw     = self.rfile.read(length)
            payload = json.loads(raw)

            provider = payload.get('provider', 'groq')
            api_key  = payload.get('apiKey', '')
            model    = payload.get('model', '')
            messages = payload.get('messages', [])

            url = PROVIDER_ENDPOINTS.get(provider)
            if not url:
                self._json_error(400, f'Provider {provider} tidak didukung melalui proxy')
                return

            # Build request body per provider format
            if provider == 'claude':
                body    = build_claude_body(payload)
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key':    api_key,
                    'anthropic-version': '2023-06-01',
                }
            elif provider == 'cohere':
                body    = build_cohere_body(payload)
                headers = {
                    'Content-Type':  'application/json',
                    'Authorization': f'Bearer {api_key}',
                }
            elif provider == 'openrouter':
                body    = build_openai_body(payload)
                headers = {
                    'Content-Type':  'application/json',
                    'Authorization': f'Bearer {api_key}',
                    'HTTP-Referer':  'https://codexsystem.ai',
                    'X-Title':       'CodexMind AI',
                }
            else:
                body    = build_openai_body(payload)
                headers = {
                    'Content-Type':  'application/json',
                    'Authorization': f'Bearer {api_key}',
                }

            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode('utf-8'),
                headers=headers,
                method='POST',
            )

            with urllib.request.urlopen(req, timeout=90) as resp:
                self.send_response(200)
                self.send_header('Content-Type', 'text/event-stream')
                self.send_header('Transfer-Encoding', 'chunked')
                self.end_headers()
                # Stream response back
                while True:
                    chunk = resp.read(1024)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    self.wfile.flush()

        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='replace')
            self._json_error(e.code, err_body)
        except Exception as e:
            self._json_error(500, str(e))

    def _handle_search_proxy(self):
        """Proxy web search calls: Tavily, Serper, DuckDuckGo fallback."""
        try:
            length  = int(self.headers.get('Content-Length', 0))
            raw     = self.rfile.read(length)
            payload = json.loads(raw)
            provider = payload.get('searchProvider', 'duckduckgo')
            api_key  = payload.get('apiKey', '')
            query    = payload.get('query') or payload.get('q', '')

            if provider == 'tavily' and api_key:
                body = {
                    'query':        query,
                    'api_key':      api_key,
                    'max_results':  payload.get('max_results', 8),
                    'search_depth': payload.get('search_depth', 'basic'),
                    'include_answer': True,
                }
                req = urllib.request.Request(
                    'https://api.tavily.com/search',
                    data=json.dumps(body).encode(),
                    headers={'Content-Type': 'application/json'},
                    method='POST',
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = resp.read()
                self._json_ok(data)

            elif provider == 'serper' and api_key:
                body = {'q': query, 'num': payload.get('num', 8),
                        'gl': payload.get('gl', 'id'), 'hl': payload.get('hl', 'id')}
                req = urllib.request.Request(
                    'https://google.serper.dev/search',
                    data=json.dumps(body).encode(),
                    headers={'Content-Type': 'application/json',
                             'X-API-KEY': api_key},
                    method='POST',
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = resp.read()
                self._json_ok(data)

            else:
                # DuckDuckGo Instant Answer API (free, no key needed)
                encoded = urllib.parse.quote(query)
                ddg_url = f'https://api.duckduckgo.com/?q={encoded}&format=json&no_redirect=1&no_html=1&skip_disambig=1'
                req = urllib.request.Request(ddg_url,
                    headers={'User-Agent': 'CodexSystem/2.4'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    raw_ddg = resp.read()
                ddg_data = json.loads(raw_ddg)
                # Convert to our standard format
                results = []
                for r in (ddg_data.get('RelatedTopics') or [])[:8]:
                    if isinstance(r, dict) and r.get('Text'):
                        results.append({
                            'title':   r.get('Text', '').split(' - ')[0][:80],
                            'url':     r.get('FirstURL', ''),
                            'snippet': r.get('Text', '')[:300],
                        })
                out = {
                    'query':    query,
                    'answer':   ddg_data.get('AbstractText', ''),
                    'results':  results,
                    'provider': 'DuckDuckGo',
                }
                self._json_ok(json.dumps(out).encode())

        except urllib.error.HTTPError as e:
            self._json_error(e.code, e.read().decode('utf-8', errors='replace'))
        except Exception as e:
            self._json_error(500, str(e))

    def _json_ok(self, body_bytes):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body_bytes)))
        self.end_headers()
        self.wfile.write(body_bytes)

    def _json_error(self, code, msg):
        body = json.dumps({'error': {'message': msg}}).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def guess_type(self, path):
        mime = super().guess_type(path)
        if isinstance(mime, tuple):
            mime = mime[0]
        if not mime:
            try:
                with open(path, 'rb') as f:
                    sig = f.read(6)
                if sig[:4] == b'\x89PNG': return 'image/png'
                if sig[:2] == b'\xff\xd8': return 'image/jpeg'
                if sig[:6] in (b'GIF87a', b'GIF89a'): return 'image/gif'
            except Exception:
                pass
            return 'application/octet-stream'
        return mime

    def log_message(self, fmt, *args):
        if '404' in str(args) and 'favicon' in str(args):
            return
        print(f'[CodexSystem] {self.address_string()} — {fmt % args}')


os.chdir(os.path.dirname(os.path.abspath(__file__)))

print('╔════════════════════════════════════════════╗')
print('║   CodexSystem AI — HTTP Server  v2.3      ║')
print('║   Powered by CodexMind AI                 ║')
print('╚════════════════════════════════════════════╝')
print(f'[Server] Port: {PORT}')
print(f'[Server] Root: {os.getcwd()}')
print('[Route] /               → desktop.html (CodexOS Desktop Environment)')
print('[Route] /codexmind.html → CodexMind AI Chat (14 modes + Real AI)')
print('[Route] /control-panel  → Control Panel (API Keys, RAG, Memory)')
print('[Route] /system         → CodexMind_System module')
print('[API]   POST /api/chat  → AI Proxy (OpenAI/Groq/Claude/Gemini/...)')

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('0.0.0.0', PORT), CodexSystemHandler) as httpd:
    print(f'[Server] Berjalan di http://0.0.0.0:{PORT}')
    httpd.serve_forever()
