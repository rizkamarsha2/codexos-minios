"""Agent server wrapper for CodexSystem — exposes HTTP entrypoint to run agentdev.

This script starts the existing CodexSystem server (server.py) and keeps a
lightweight Flask HTTP endpoint that forwards requests to the agent runtime.
It is intentionally minimal: the agent itself runs inside the CodexSystem server
or via `agentdev` when debugging.
"""
from flask import Flask, jsonify
import subprocess
import os
import signal
import sys
import time

APP = Flask(__name__)

SERVER_PY = os.path.join(os.path.dirname(__file__), 'CodexSystem', 'server.py')
SERVER_PROC = None

@APP.route('/health')
def health():
    return jsonify({'status': 'ok'})

def start_server():
    global SERVER_PROC
    if SERVER_PROC:
        return
    # Start CodexSystem server as a background process
    SERVER_PROC = subprocess.Popen([sys.executable, SERVER_PY], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # Wait briefly for server to bind
    time.sleep(1)

def stop_server(signum, frame):
    global SERVER_PROC
    if SERVER_PROC:
        try:
            SERVER_PROC.terminate()
            SERVER_PROC.wait(timeout=5)
        except Exception:
            SERVER_PROC.kill()
    sys.exit(0)

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, stop_server)
    signal.signal(signal.SIGINT, stop_server)
    start_server()
    # Run Flask app for the Agent Inspector to call
    APP.run(host='0.0.0.0', port=int(os.environ.get('AGENT_SERVER_PORT', '5050')))
