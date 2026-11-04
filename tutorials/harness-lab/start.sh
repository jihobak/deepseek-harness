#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export UV_CACHE_DIR="$PWD/.uv-cache"
export IPYTHONDIR="$PWD/.ipython"
export JUPYTER_RUNTIME_DIR="$PWD/.jupyter-runtime"
mkdir -p "$IPYTHONDIR" "$JUPYTER_RUNTIME_DIR"
exec uv run --frozen jupyter lab --no-browser --ip=127.0.0.1 "$@"
