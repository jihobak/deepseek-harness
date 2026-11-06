# DeepSeek Super-agent 설계를 Python으로 배우기

한국어 설명, 실행 코드, 검증문, 수정 과제와 해설을 담은 **12개 독립 실행 노트북**입니다. API 키 없이 LangChain 도구와 LangGraph의 상태 그래프·체크포인트·interrupt를 직접 실행합니다. 약 6~8시간을 예상하며 Python 함수·타입 힌트·기초 async 이해를 권장합니다.

Python 노트북과 두 TypeScript 과정을 어떤 순서로 진행할지는 [전체 추천 학습 순서](LEARNING_PATH.ko.md)를 먼저 보세요. 단계별 이유와 다음 단계로 넘어갈 기준을 함께 설명합니다.

## 먼저 구분할 것

- X의 *Exploring Super-agent Design: Towards a More Autonomous Agent System*은 **설계 아이디어**를 설명하며, 기존 제품 기능 소개가 아니라고 명시합니다. 영문은 원문에 표시된 기계 번역입니다.
- 공식 Harness 제품 페이지는 공개 프리뷰와 Cordis의 “everything is a plugin” 구조를 소개합니다.
- 이 자료는 설계를 Python으로 실험하는 교육용 구현입니다. 공식 SDK 튜토리얼, Cordis 재구현, 내부 Super-agent 전체의 공개 여부를 입증하는 자료가 아닙니다. 제품 구현 근거는 수집 시점의 체크아웃 문서로 한정합니다.
- LangGraph도 병행 실행·상태·중단/재개를 지원합니다. 비교 대상은 단순한 단일 세션 중심 설계이며 모든 기존 agent framework를 일반화하지 않습니다.

공개 프로토타입의 구현은 [한국어 분석 보고서](PROTOTYPE_ANALYSIS.ko.md)에 정리했습니다. 연구 글의 설계와 실제 코드의 차이를 먼저 확인하고, 09–11에서 권한·수명주기·장애 복구를 실습하세요.

## 시작하기

현재 프로젝트: `/workspace/deepseek-harness/tutorials/harness-lab`. 교재는 독립 Python 프로젝트이며 Harness 애플리케이션 코드를 변경하지 않습니다.

```bash
cd /workspace/deepseek-harness/tutorials/harness-lab
./setup.sh
./start.sh
```

`uv`가 필요합니다. 이 클라우드에는 uv 0.13.4가 이미 설치되어 있어 재사용했습니다. 다른 컴퓨터에서는 [uv 공식 설치 안내](https://docs.astral.sh/uv/getting-started/installation/)를 따르세요. Python 3.12 이상이 필요하며 `.python-version`은 3.12, `uv.lock`은 실제 검증한 의존성 버전을 고정합니다.

`setup.sh`는 `uv sync --locked`로 `.venv`를 구성하고 그 환경 안에 `Python (Harness Lab)` 커널을 등록합니다. 전역 커널이나 다른 프로젝트를 변경하지 않습니다. 가상환경을 다른 경로로 옮겼다면 반드시 다시 실행하세요.

노트북 UI에서 **Python (Harness Lab)** 커널을 선택한 뒤 Restart Kernel and Run All을 실행하세요. VS Code에서는 `/workspace/deepseek-harness/tutorials/harness-lab/.venv/bin/python`을 선택해도 됩니다. JupyterLab은 기본 인증을 유지한 채 loopback에서 실행합니다. 원격 접근은 사용 중인 플랫폼의 포트 연결 기능을 사용하세요. 이 자료에서 외부 웹 공개는 수행하지 않습니다.

## 과정

|순서|노트북|배우고 검증하는 내용|시간|
|---|---|---|---|
|0|[읽기 지도](notebooks/00_reading_map.ipynb)|네 목표·다섯 모듈, 제품과 연구 구분, 예비 실험 해석|20분|
|1|[Agent loop](notebooks/01_agent_loop.ipynb)|LangChain tool, ToolNode, 상태 reducer, 도구 호출/결과 연결|25분|
|2|[Router와 Triggers](notebooks/02_router_triggers.ipynb)|필터, Thread 구독, pass-through, 다대다, batching|40분|
|3|[Context와 Recall](notebooks/03_context_recall.ipynb)|inline/spill, 참조 그래프, 실제 입력의 로그 재구성|35분|
|4|[Full-duplex](notebooks/04_full_duplex.ipynb)|즉시 receipt, 완료 사건, 취소·정리, 조건부 채널 응답|35분|
|5|[Plugin lifecycle](notebooks/05_plugin_lifecycle.ipynb)|서비스 교체, 중복 방지, 예외 시 정리, 정책 middleware|35분|
|6|[Persistence와 Watchdog](notebooks/06_persistence_watchdog.ipynb)|SQLite 복원, 중복·오래된 결과 거부, 진전 감시|35분|
|7|[통합 실습](notebooks/07_capstone.ipynb)|두 Worker 병행, 후속 사건 수신, LangGraph 승인/거절|45분|
|8|[선택: 실제 모델](notebooks/08_optional_live_model.ipynb)|ChatOpenAI adapter와 별도의 모델 품질 평가|20분+|
|9|[프로토타입 권한 판단](notebooks/09_prototype_admission.ipynb)|inferred 판단, observe/auto, 정책 버전, Mandate|35분|
|10|[Ticket 수명주기](notebooks/10_prototype_ticket_lifecycle.ipynb)|구독과 권한, 사람/bot, 재개, 오래된 보고 거부|35분|
|11|[영속 Effects](notebooks/11_prototype_durable_effects.ipynb)|SQLite 원자성, generation, 재시도와 외부 중복|40분|

각 노트북은 이전 노트북의 변수에 의존하지 않습니다. 실습은 작은 고정 데이터와 모델 대역을 사용하므로 모델의 자연어 판단 품질을 입증하지 않습니다. 07의 후속 입력은 기록까지만 하며 실행 중 모델 지시 변경은 확장 과제입니다. 06의 Watchdog은 시간·진전 규칙으로, 원문의 LLM Watchdog의 의미 판단을 재현하지 않습니다.

## 처음부터 TypeScript로 구현하기

[Super-agent 재구현 과정](rebuild/INDEX.ko.md)은 요구사항에서 출발해 업무 모델, 권한, 구독, SQLite Effects, 실행 복구, 어댑터, 운영 화면을 단계별로 만듭니다. 01–08은 실행 가능한 참조 구현과 단계별 테스트를 제공하고, 09–10은 원본 DSH·GitHub·Feishu·운영 기능까지 확장하는 구현 지침과 완료 기준을 제공합니다. Python 노트북과 별도의 Node 환경을 사용합니다.

## Claude Code/OpenCode로 간소화한 호스트 만들기

[Switch Dimension 가이드 구현 과정](guide-build/INDEX.ko.md)은 `switch-dimension/deepseek-superagent-guide`의 README 명세를 기준으로 합니다. 대상 저장소에는 앱 소스가 없으므로, 결정적 gate·Ticket별 worktree/session·sa CLI·외부 코딩 Worker·조용한 Outbox·운영 패널을 새 TypeScript 참조 구현과 10단계 교재로 제공합니다. 위 DSH 프로토타입 과정과 별개의 경로입니다.

## 전체 실행 검증

```bash
cd /workspace/deepseek-harness/tutorials/harness-lab
UV_CACHE_DIR="$PWD/.uv-cache" uv run --frozen python scripts/validate_notebooks.py
```

노트북마다 **새 커널**을 열어 모든 코드 셀을 실행하고, 오류나 assert 실패 시 즉시 실패합니다. 기본 검증은 노트북과 기존 report를 변경하지 않습니다. `--write`를 지정하면 실행 결과와 `validation.json`을 저장하고, `--report /tmp/report.json`으로 별도 보고서를 만들 수 있습니다. 선택적 실제 모델 셀은 검증기가 `RUN_LIVE=0`으로 실행하므로 **명시적으로 건너뜁니다**. 보고서를 저장하는 모드에서는 지정한 이전 report를 제거하고 시작하므로 중간 실패를 과거 성공 기록과 혼동하지 않습니다.

학습자는 개념 설명 → 예상 결과 적기 → 실행 → assert 설명 → 수정 과제 순서로 진행하세요. 과제 해설은 마지막에 있습니다. 자동 검증은 제공된 예제를 검증하며 독자가 작성한 모든 확장 과제를 채점하지는 않습니다.

`scripts/build_notebooks.py`는 00–08 생성기이며, `scripts/build_prototype_materials.py`는 09–11 생성기입니다. 두 생성기는 기존 실습에 프로토타입 차이 안내를 유지합니다. 실행하면 학습자가 수정한 노트북과 실행 결과를 덮어쓰므로 재생성은 필요할 때만 하세요. 수정한 실습은 별도 사본에 보관하세요.

## 교재 전체 검사

[빈칸 실습과 별도 정답](practice/INDEX.ko.md), [설계별 책임 비교](DESIGN_COMPARISON.ko.md)를 함께 제공합니다. 두 TS 과정에서 `npm ci --ignore-scripts`를 실행하고 Python `setup.sh`를 마친 뒤 저장소 루트에서 `pnpm run check:harness-lab`을 실행하세요. 노트북, 타입 검사, 회귀 테스트, HTTP smoke, 16단계 정답과 28개 개별 빈칸 실패, 생성물·링크를 검사합니다. 파일을 덮어쓰지 않으며 실제 provider는 호출하지 않습니다. 같은 검사를 교재 전용 GitHub Actions에서도 실행합니다.

## 실제 모델을 쓰려면

08에서만 명시적 opt-in을 사용합니다. `DEEPSEEK_API_KEY`, 현재 지원하는 `DEEPSEEK_MODEL`, `RUN_LIVE=1`을 설정하고 `api.deepseek.com` 접근이 가능한지 확인하세요. 이 작업에서는 비밀값이나 해당 API 네트워크 설정을 추가하지 않았고, 실제 모델 호출을 실행하지 않았습니다. 키를 노트북 셀·출력·Git에 저장하지 마세요.

## 근거와 한계

[SOURCES.md](SOURCES.md)에 원문, 절별 매핑, 저장소 문서 파일 해시, 수집 방식과 해시를 기록했습니다. 지정한 두 페이지는 **Codex 클라우드에서 직접 HTTP 요청으로 읽었으며** 브라우저 화면 조작을 수행한 것은 아닙니다. 클라우드의 `sources/`에는 X 본문과 공식 페이지 텍스트가 보존되어 있습니다. Git에는 출처 URL과 해시만 포함하며 다운로드한 원문 캐시는 제외합니다. 원문 전체를 교재 설명처럼 재배포하기보다는 노트북의 출처 링크와 한국어 설명을 중심으로 읽으세요.

설치된 의존성과 커널은 `setup.sh`로 재구성합니다. 환경 설정 저장과 게시, 새 작업에서의 복원은 각각 별도 절차입니다.
