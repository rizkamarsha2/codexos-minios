#!/usr/bin/env bash
# Wrapper for Unix: run agentdev with agent_server.py under debugpy
python -m debugpy --listen 5678 --wait-for-client -m agentdev run -- python agent_server.py
