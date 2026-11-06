# Super-agent notebook lab

English | [中文](README.zh.md)

## Summary

Explore Super-agent design through twelve Korean notebooks using LangChain and LangGraph. The [Korean guide](GUIDE.ko.md) provides the learning path, exercises, and setup details; [sources](SOURCES.md) distinguish architecture proposals from product behavior. Python 3.12 or newer and uv are required. Core exercises use deterministic model substitutes and need no API key.

## Run the course

From this directory, install the locked dependencies and start JupyterLab:

```sh
./setup.sh
./start.sh
```

Select the `Python (Harness Lab)` kernel. Each notebook runs independently. Validate all notebooks with `UV_CACHE_DIR="$PWD/.uv-cache" uv run --frozen python scripts/validate_notebooks.py`; this leaves notebooks unchanged and explicitly skips live model requests. Add `--write` to save executed notebooks and `validation.json`. The [optional model notebook](notebooks/08_optional_live_model.ipynb) documents separate credential and network requirements.

The [fill-in exercises](practice/INDEX.ko.md) provide separate answers for sixteen TypeScript stages. After installing both TypeScript projects, run `pnpm run check:harness-lab` from the repository root to check the entire course.

## Limitations

These are educational implementations, not the official SDK or a Cordis port. Downloaded source pages, virtual environments, and caches are local files excluded from Git. See the Korean guide for each exercise's assumptions and omitted production mechanisms.
