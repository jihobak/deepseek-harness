# 전체 자료의 추천 학습 순서

추천 경로는 **설계 의도 파악 → Python으로 개념 실험 → 간소화한 시스템 구현 → 공식 프로토타입의 복잡성 이해 → 실제 서비스 연결**입니다. 먼저 작은 시스템을 완성한 뒤, 어떤 요구사항이 추가될 때 더 정교한 구조가 필요한지 비교합니다.

[설계별 책임 비교](DESIGN_COMPARISON.ko.md)에서 Router·Main/Eval·결정적 gate를 먼저 구분할 수 있습니다. 구현 단계에서는 [빈칸 실습과 별도 정답](practice/INDEX.ko.md)을 함께 사용하세요.

## 1. 연구 글과 자료의 관계 파악

[DeepSeek X 연구 글](https://x.com/DeepSeekHarness/status/2116857257245987236?s=20)과 [00 읽기 지도](notebooks/00_reading_map.ipynb)를 읽고, [Switch Dimension 자료 분석](guide-build/SOURCE_ANALYSIS.ko.md)을 이어서 봅니다.

|자료|제공하는 것|
|---|---|
|DeepSeek 연구 글|지속적·능동적 에이전트의 목표와 설계 아이디어|
|DeepSeek 공식 프로토타입|그 목표 일부를 구체화한 코드·테스트·문서|
|Switch Dimension 가이드|DSH 없이 코딩 CLI로 구현하는 간소화 명세|
|이 교재의 Python·TypeScript 실습|개념을 검증하고 구현을 연습하는 별도의 교육용 코드|

**이 순서의 이유:** 연구 제안, 실제 구현, 교육용 구현을 섞어서 이해하는 것을 막습니다. 처음에는 클래스 이름보다 어떤 사용자 문제를 해결하려는지에 집중하세요. Switch Dimension 저장소에서 확인한 파일은 README와 LICENSE이며, README가 언급한 약 2,800줄의 앱 소스는 그 체크아웃에 포함되어 있지 않습니다.

**다음 단계로 넘어갈 기준:** 각 자료가 무엇의 근거이고 무엇까지는 입증하지 않는지 설명할 수 있습니다.

## 2. Python 노트북 01–07로 개념 실험

[한국어 실습 안내](GUIDE.ko.md)의 설치 절차를 따른 뒤 다음 순서로 실행합니다.

1. [01 Agent loop](notebooks/01_agent_loop.ipynb): 모델과 도구 호출의 기본 루프.
2. [02 Router와 Triggers](notebooks/02_router_triggers.ipynb): 사건, 필터, 구독과 라우팅.
3. [03 Context와 Recall](notebooks/03_context_recall.ipynb): 문맥 예산과 참조를 통한 읽기.
4. [04 Full-duplex](notebooks/04_full_duplex.ipynb): 실행 중 입력과 완료 사건 처리.
5. [05 Plugin lifecycle](notebooks/05_plugin_lifecycle.ipynb): 구성요소 교체와 자원 정리.
6. [06 Persistence와 Watchdog](notebooks/06_persistence_watchdog.ipynb): 상태 복원과 관찰 규칙.
7. [07 통합 실습](notebooks/07_capstone.ipynb): 여러 개념을 하나의 실행 흐름에 조합.

**이 순서의 이유:** TypeScript 앱 전체를 읽기 전에 상태·라우팅·실행·복구를 작은 단위로 경험할 수 있습니다. LangChain/LangGraph 학습도 이 단계에서 진행합니다.

각 예제를 실행한 뒤 조건 하나를 바꾸고 어떤 검증문이 실패하는지 확인하세요. 중복 사건을 허용하거나 오래된 실행 결과를 받아들이도록 바꿔 보는 것이 좋습니다. 바꾼 실습은 별도 사본에 보관하세요.

08의 실제 모델 연결은 마지막으로 미룹니다. 지금은 모델 품질보다 시스템의 동작 규칙을 이해하는 것이 먼저입니다. 06의 Watchdog은 개념 실습이며 공식 프로토타입의 독립 LLM Watchdog 구현을 재현한 것이 아닙니다.

**다음 단계로 넘어갈 기준:** 사건 수집, 모델 판단, 실행, 상태 저장의 책임을 구분하고 실패하는 조건을 하나 이상 재현할 수 있습니다.

## 3. 간소화한 TypeScript 시스템 완성

[Switch Dimension 가이드 구현 과정](guide-build/INDEX.ko.md)의 01–08을 진행합니다. 먼저 완성된 앱의 smoke와 로컬 패널을 실행한 뒤, 별도 프로젝트에서 단계별로 작성하세요. 구체적인 실행 명령과 환경은 해당 과정의 시작 안내를 따릅니다.

다음 네 흐름을 직접 관찰합니다.

- 요청 하나가 Ticket과 worktree로 바뀝니다.
- 후속 요청이 같은 세션·브랜치로 돌아갑니다.
- Worker의 sa 요청을 호스트가 검사합니다.
- 사람이 중단한 Ticket이 자동 재개되지 않습니다.

**이 순서의 이유:** 앞에서 배운 개념이 사용 흐름으로 연결됩니다. Master/Worker라는 조직도보다, 모델 호출 밖에서 호스트가 어떤 책임을 관리하는지 확인하는 단계입니다.

**다음 단계로 넘어갈 기준:** 모의 Worker로 실제 로컬 커밋과 후속 커밋을 만들고, 세션 유지·권한 거절·중단·재시작을 설명할 수 있습니다. 실제 Claude/OpenCode 또는 GitHub 서비스까지 검증한 것으로 해석하지 않습니다.

## 4. 공식 프로토타입의 권한·수명·복구 분석

[공식 프로토타입 분석 보고서](PROTOTYPE_ANALYSIS.ko.md)를 읽고 Python 09–11을 진행합니다.

|실습|중심 질문|
|---|---|
|[09 권한 판단](notebooks/09_prototype_admission.ipynb)|모델이 accept라고 해도 왜 실행하면 안 되는가?|
|[10 Ticket/Assignment](notebooks/10_prototype_ticket_lifecycle.ipynb)|업무와 실행 시도를 왜 분리하는가?|
|[11 영속 Effects](notebooks/11_prototype_durable_effects.ipynb)|저장과 외부 실행 사이 장애가 나면 무엇이 남는가?|

**이 순서의 이유:** 작은 시스템을 만들어 본 뒤에는 Mandate, 정책 버전, 실행 시도, generation이 어떤 문제를 해결하는지 이해하기 쉽습니다. 자신의 간소화 구현에 이 조건이 추가되면 어느 모듈을 바꿔야 할지 함께 생각하세요.

**다음 단계로 넘어갈 기준:** 문맥 수신과 실행 권한, Ticket과 Assignment, 로컬 트랜잭션과 외부 효과를 각각 구분할 수 있습니다.

## 5. 공식 프로토타입 재구현 과정으로 확장 비교

[DSH 프로토타입 재구현 과정](rebuild/INDEX.ko.md)과 [원본 대응표](rebuild/ORIGINAL_PARITY.ko.md)를 봅니다. 이미 이해한 부분까지 모두 다시 작성할 필요는 없습니다. 간소화 구현과 비교하며 권한, Eval, 구독 소유권, 전달과 실제 읽기의 구분, 복구에 집중합니다.

**이 순서의 이유:** 어떤 요구사항이 추가될 때 어떤 복잡성이 필요해지는지 판단하는 능력을 기르는 단계입니다. 작은 구현에 원본의 모든 장치를 무조건 넣는 것이 목표는 아닙니다.

**다음 단계로 넘어갈 기준:** 자신의 목표에 필요한 기능과 생략할 기능을 이유와 함께 선택하고, 각 선택이 어떤 실패 조건을 남기는지 적을 수 있습니다.

## 6. 실제 실행 경로 하나를 선택

|원하는 결과|진행할 자료|
|---|---|
|Claude Code/OpenCode를 팀 작업 도구로 사용|[간소화 과정 09](guide-build/lessons/09-deployment.ko.md)와 [10](guide-build/lessons/10-acceptance.ko.md)|
|DSH 세션·플러그인 구조까지 구현|[공식 프로토타입 과정 09](rebuild/lessons/09-dsh.ko.md)와 [10](rebuild/lessons/10-production.ko.md)|
|Python에서 실제 모델 연결 실험|[08 선택적 실제 모델](notebooks/08_optional_live_model.ipynb)|

**이 순서의 이유:** 두 실행 기반과 실제 계정을 처음부터 모두 연결하면 업무 설계, 모델, 인증 중 무엇 때문에 실패했는지 구분하기 어렵습니다. 로컬 동작을 이해한 뒤 하나씩 연결하세요. 각 과정이 명시한 실제 서비스 수용 기준은 로컬 mock 테스트와 별도로 확인합니다.

## 전체 과정에서 유지할 공통 예제

**오탈자 수정 요청 → 후속 요청 → CI 실패 → 사람의 중단 → 재시작**을 같은 예제로 유지하세요. 각 자료에서 이 흐름을 어떻게 처리하는지 비교하면 서로 다른 구현의 차이를 이해하기 쉽습니다.

각 단계에서 다음 네 가지를 기록하면 학습 결과가 남습니다: 관찰한 상태 전이, 그 전이를 결정한 주체, 실패시킨 검증문, 아직 검증하지 않은 외부 동작. 이 흐름을 스스로 설명하고 테스트로 검증할 수 있으면 핵심 설계를 이해한 것입니다.
