@echo off
REM Wrapper for Windows: run agentdev with agent_server.py
python -m debugpy --listen 5678 --wait-for-client -m agentdev run -- python agent_server.py
