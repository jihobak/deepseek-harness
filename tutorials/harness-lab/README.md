# Super-agent notebook lab

English | [中文](README.zh.md)

## Summary

Explore Super-agent design through nine Korean notebooks using LangChain and LangGraph. The [Korean guide](GUIDE.ko.md) provides the learning path, exercises, and setup details; [sources](SOURCES.md) distinguish architecture proposals from product behavior. Python 3.12 or newer and uv are required. Core exercises use deterministic model substitutes and need no API key.

## Run the course

From this directory, install the locked dependencies and start JupyterLab:

```sh
./setup.sh
./start.sh
```

Select the `Python (Harness Lab)` kernel. Each notebook runs independently. Validate all notebooks with `UV_CACHE_DIR="$PWD/.uv-cache" uv run --frozen python scripts/validate_notebooks.py`; this writes executed notebooks and `validation.json`, and explicitly skips live model requests. The [optional model notebook](notebooks/08_optional_live_model.ipynb) documents separate credential and network requirements.

## Limitations

These are educational implementations, not the official SDK or a Cordis port. Downloaded source pages, virtual environments, and caches are local files excluded from Git. See the Korean guide for each exercise's assumptions and omitted production mechanisms.
