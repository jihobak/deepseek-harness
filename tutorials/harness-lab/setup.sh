#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export UV_CACHE_DIR="$PWD/.uv-cache"
export IPYTHONDIR="$PWD/.ipython"
export JUPYTER_RUNTIME_DIR="$PWD/.jupyter-runtime"
mkdir -p "$IPYTHONDIR" "$JUPYTER_RUNTIME_DIR"
uv sync --locked
uv run --frozen python -m ipykernel install --prefix "$PWD/.venv" --name harness-lab --display-name 'Python (Harness Lab)'
