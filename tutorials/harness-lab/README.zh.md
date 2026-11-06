# Super-agent Notebook 实验

[English](README.md) | 中文

## 概述

通过十二个使用 LangChain 和 LangGraph 的韩文 Notebook 学习 Super-agent 设计。[韩文指南](GUIDE.ko.md)提供学习路线、练习和环境配置说明；[资料来源](SOURCES.md)区分架构提案与产品行为。需要 Python 3.12 或更高版本以及 uv。核心练习使用确定性的模型替代实现，无需 API 密钥。

## 运行课程

在本目录安装锁定的依赖并启动 JupyterLab：

```sh
./setup.sh
./start.sh
```

选择 `Python (Harness Lab)` 内核。每个 Notebook 均可独立运行。使用 `UV_CACHE_DIR="$PWD/.uv-cache" uv run --frozen python scripts/validate_notebooks.py` 验证所有 Notebook；该命令不修改 Notebook，并明确跳过真实模型请求。添加 `--write` 可保存执行后的 Notebook 和 `validation.json`。[可选模型 Notebook](notebooks/08_optional_live_model.ipynb)说明独立的凭据和网络要求。

[填空练习](practice/INDEX.ko.md)为十六个 TypeScript 阶段提供独立答案。安装两个 TypeScript 项目的依赖后，在仓库根目录运行 `pnpm run check:harness-lab` 验证整个课程。

## 限制

这些是教学实现，并非官方 SDK 或 Cordis 的移植。下载的原始页面、虚拟环境和缓存都是不纳入 Git 的本地文件。各练习的假设及省略的生产机制请参阅韩文指南。
