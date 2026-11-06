# Router, Main/Eval, 결정적 gate를 구분하기

세 자료는 모두 여러 작업을 관리하지만, 누가 새 업무를 판단하고 어떤 상태를 오래 유지하는지가 다릅니다. 단순한 Master/Worker 조직도만 보면 이 차이가 드러나지 않습니다. 이 문서는 [연구 글](https://x.com/DeepSeekHarness/status/2116857257245987236?s=20), [공식 프로토타입 분석](PROTOTYPE_ANALYSIS.ko.md), [간소화 명세 분석](guide-build/SOURCE_ANALYSIS.ko.md)의 책임을 비교하는 참조 자료입니다.

|질문|연구의 Router/Worker|공식 프로토타입의 Main/Eval|간소화 가이드의 결정적 gate|
|---|---|---|---|
|누가 작업을 시작하는가?|필터를 통과한 새 사건을 Router가 판단·배정|SourceScope·Policy와 Eval 판단을 host가 검증해 Ticket/Mandate 생성|allowlist·멘션·구독 등 코드 규칙으로 Ticket 생성|
|중앙 LLM이 필수인가?|Router Session이 설계의 구성요소|Main Session이 평가와 조정을 수행|없음. 코딩 LLM은 Worker에 연결|
|후속 입력은 어디로 가는가?|구독된 Thread의 Worker로 코드가 pass-through|구독 fan-out 후 소유 사람 입력은 Worker가 판단; 나머지는 정책에 따라 Eval|구독된 Ticket으로 전달; bot/CI wake 규칙은 코드로 결정|
|어떤 권한을 보존하는가?|설계 정책과 역할 제한을 설명|Mandate에 범위·행위자·정책 근거를 보존하고 재개 시 재검증|시작·중단 gate와 원래 requester allowlist 재검증; Mandate 모델은 없음|
|작업과 실행 수명은?|Worker Session과 지속적 사건 흐름|Ticket과 Assignment를 분리|Ticket의 session/worktree를 유지하고 교재에서는 turn으로 늦은 호출을 구분|
|장애 후 무엇을 복원하는가?|compute/state/environment 분리와 외부 Watchdog를 제안|SQLite, Effects, 세션, 입력 전달·읽기 상태|Ticket, pending input, Outbox, session/worktree; interrupted turn 재예약|
|Main이 실행 도구를 가지는가?|Router의 실행 책임을 구조적으로 제한하는 설계|실제 Main에는 bash/read 도구도 있으며 프롬프트와 guard가 참여|호스트의 gate에는 모델 도구가 없음|

## 같은 요청을 따라 비교하기

“README 오탈자를 고쳐 주세요”가 들어오면 연구 설계는 사건 선별과 Router 배정, 공식 구현은 권한 판단과 Mandate 생성, 간소화 구현은 허용된 사람의 멘션 여부에 초점을 둡니다. Worker를 시작한다는 결과가 같아도 시작 근거와 이후 검증할 상태가 다릅니다.

작업 중 “이 표기도 같이 확인해 주세요”가 도착하면 기존 Thread 구독이 연결 역할을 합니다. 모든 후속 입력을 중앙 모델이 다시 분해·배정할 필요는 없습니다. 관련 문맥을 받았다는 사실이 새로운 범위의 실행 승인으로 자동 확대되지는 않습니다. 간소화 구현은 이런 의미적 범위 판단을 Worker 지침에 더 많이 맡깁니다.

범위 밖 입력을 handback하면 원래 Worker는 다음 batch와 복구에서도 그 입력을 제외해야 합니다. PR이 merge된 뒤 후속 요청으로 재개했다면 과거 PR 상태만으로 현재 작업을 다시 종료해서도 안 됩니다. 이런 책임은 Master가 Worker를 호출하는 한 번의 함수 호출보다 긴 시간 범위를 가집니다.

사람이 stop한 Ticket과 호스트 재시작 때문에 중단된 turn도 다릅니다. 전자는 자동 재개하지 않고, 후자는 미완료 입력과 복구 안내를 보존합니다. 저장·전달·실행 시도의 정체성을 분리해야 이 차이를 구현할 수 있습니다.

## 실습을 읽을 때의 기준

Python 02의 semantic → routing은 연구 개념의 축소 예제입니다. 공식 프로토타입의 fan-out → 소유권 판단 → 필요 시 Eval과 순서가 다릅니다. Python 07은 후속 메시지를 기록하지만 실행 중 모델 지시를 변경하지 않습니다. Python 06의 규칙 기반 감시도 연구의 독립 LLM Watchdog 전체가 아닙니다.

따라서 비교할 단위는 에이전트 수보다 사건의 소유자, 승인 근거, 문맥 전달, 실행 시도, 외부 효과의 복구입니다. 같은 요구사항을 LangGraph나 다른 프레임워크로 구현할 수 있습니다. [학습 순서](LEARNING_PATH.ko.md)와 [빈칸 실습](practice/INDEX.ko.md)에서 이 책임을 각각 실행해 보세요.
