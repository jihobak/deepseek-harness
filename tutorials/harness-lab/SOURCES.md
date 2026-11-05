# 자료 출처와 주장 범위

확인일: 2026-11-05 (Asia/Seoul). 두 URL은 Codex 클라우드에서 curl HTTPS 요청으로 HTTP 200을 받아 열었습니다. HTML의 script/style/svg를 제외한 본문을 BeautifulSoup으로 추출했습니다. X 응답에는 제목뿐 아니라 §1–§9의 기사 본문이 포함되어 있음을 확인했습니다. 브라우저 렌더링이나 이미지에만 있는 도표는 검증하지 않았습니다.

1. [DeepSeek Harness의 Super-agent 글](https://x.com/DeepSeekHarness/status/2116857257245987236?s=20)
   - 제목: Exploring Super-agent Design: Towards a More Autonomous Agent System.
   - 본문은 영문 기계 번역이라고 명시합니다. 설계 아이디어이며 기존 Harness 기능 소개가 아니라는 원문의 한계를 유지했습니다.
   - `sources/announcement.html`, `sources/announcement.txt`.
2. [DeepSeek Harness 공식 제품 페이지](https://www.deepseek.com/en/harness/)
   - 공개 프리뷰, 오픈소스, Cordis 기반 플러그인, 개발 도구, 제품 시연 설명.
   - UI 시연을 실제 도구 실행 증거나 벤치마크로 취급하지 않았습니다.
   - `sources/deepseek-harness.html`, `sources/deepseek-harness.txt`.
3. 로컬 `jihobak/deepseek-harness` 체크아웃. 읽은 문서의 SHA-256은 `sources/sha256.json`에 기록합니다.
   - [Architecture](../../docs/architecture.md): plugin tree, capability seams, model-visible means logged.
   - [Cordis primer](../../docs/cordis-primer.md): service context, inject, waterfall, reversible effects.
   - [Lifecycle and effects](../../docs/cordis-tutorial/02-lifecycle-and-effects.md): unload, disposer, resource ownership.
   - 공식 제품 페이지가 가리키는 upstream은 `deepseek-ai/deepseek-harness`이며 위 상대 링크는 현재 체크아웃의 문서를 가리킵니다. 수집 당시의 내용은 파일 해시로 식별합니다.

원문 HTML·텍스트는 클라우드의 로컬 캐시이며 Git에서 제외합니다. `sources/sha256.json`은 수집 시점 원문의 해시입니다. 저장소를 새로 복제해도 출처 링크와 노트북만으로 실습할 수 있습니다.

## 개념과 근거 매핑

|교육자료의 주장|근거|구현 범위|
|---|---|---|
|Continuous/Productive/Proactive/Persistent|X §1|목표 설명, 시스템 전체 보장 아님|
|Router는 실행하지 않고 Worker가 수행|X §2|도구·책임 분리, 고정 모델 대역|
|코드/의미 필터, 구독 pass-through|X §3.1–3.2|코드 필터, 의미 판단은 결정적 대역|
|Inline/spill, Chain of Recall|X §3.3|로컬 객체 참조·문자 예산|
|Speculative execution|X §3.4|검증된 결과만 출력하는 로컬 조건|
|start/stop, 결과를 사건으로 수신|X §4.1|asyncio Task; 원격 프로세스 취소 아님|
|채널별 소통|X §4.2|문자열 formatting, 실제 외부 전송 없음|
|compute/state/environment 분리|X §5|SQLite와 compute 분리; BYOM 미구현|
|Watchdog|X §6|독립 DB 관찰 규칙; LLM 판단 미구현|
|예비 실험 지연·token tradeoff|X §7|원문 수치 해설; 재현 benchmark 아님|
|장기 기억·A2A·보안 등의 열린 문제|X §8|운영 차이와 확장 과제로 명시|
|모든 구성요소를 plugin으로|제품 페이지·Architecture|교육용 동기 registry, Cordis 포팅 아님|
|모델 입력을 로그에서 재구성|Architecture / Session log|단순 이벤트 모델, 공식 SessionEvent 호환 아님|
|LangGraph 승인 interrupt|교육용 구현 선택|원문이 LangGraph를 사용한다는 주장 아님|

LangChain/LangGraph API는 설치된 `uv.lock` 버전으로 실제 실행 검증합니다. API 동작 근거는 노트북의 실행 결과이며, DeepSeek가 해당 Python 라이브러리를 사용한다고 추론하지 않습니다.

## 공개 프로토타입

4. [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype): Codex 클라우드에서 Git으로 복제해 README, docs/000–008, 도메인·정책·런타임·어댑터 및 관련 테스트를 읽었습니다. 공개용으로 조정된 연구 참고 구현이며 연구 글 또는 비공개 내부 버전과 동일하지 않습니다.

[분석 보고서](PROTOTYPE_ANALYSIS.ko.md)에 주장별 코드·문서 근거와 09–11 실습 연결을 기록합니다. [prototype-evidence.json](sources/prototype-evidence.json)은 분석한 revision, 파일 SHA-256, 검사 명령과 결과를 보존합니다. Main 도구 구성, fan-out 순서, Watchdog/BYOM 구현 범위에 관한 차이는 00·02·06·07에도 표시했습니다. 위 표의 X 근거 항목은 연구 글의 설계를 설명하며 그대로 공개 코드의 구현 목록이 되지는 않습니다.

## 처음부터 구현하는 과정의 근거

[TypeScript 재구현 과정](rebuild/INDEX.ko.md)은 공개 프로토타입을 바탕으로 교육용 구현 순서를 도출한 자료입니다. 실제 개발 이력의 재현이 아닙니다. [원본 대응표](rebuild/ORIGINAL_PARITY.ko.md)에 축소 구현과 원본 기능의 차이, 구현을 확장할 파일과 테스트를 연결합니다. 검증된 로컬 동작과 실제 provider를 연결해야 확인할 동작을 구분합니다.
