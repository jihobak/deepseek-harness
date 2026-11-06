# 09. 대역을 실제 DSH 세션으로 교체하기

01–08에서 만든 것은 업무 제어의 작은 구현입니다. 실제 코드 수정 에이전트로 만들려면, 그 제어를 유지하면서 실행과 평가 어댑터를 DSH로 바꿔야 합니다. 단순히 `LocalExecutor.start` 안에서 LLM API를 한 번 호출하는 것으로는 원본 결과물에 도달하지 않습니다.

## 1. 원본 포트를 먼저 맞춘다

[core/ports.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/core/ports.ts)를 구현의 기준으로 삼으세요. 아래 인터페이스 표는 책임을 연결하기 위한 요약이며 DSH API를 새로 정의한 것이 아닙니다.

|참조 구현|원본 포트·구현|교체할 내용|
|---|---|---|
|Engine → 구체 Store|Repositories / `app/store.ts`|도메인별 Trigger/Thread/Ticket/Decision 저장소와 atomic|
|직접 `decide` 호출|Assessor / `app/assessment.ts`|candidate 예약, 제한된 문맥 구성, 세션 전달, 구조화된 assessment callback|
|`Executor.start`가 결과 문자열 반환|Executor / `executor/dsh.ts`|start는 예약만 하고 started/report는 별도 callback으로 보고|
|`Executor.deliver`의 read boolean|`app/delivery.ts`와 Session event|전달 성공과 실제 모델 history 반영을 별도 callback으로 확인|
|LocalChannel|Outbox → SourceRegistry → Channel|채널별 전송, receipt, 삭제된 대상, 재시도 순서|
|단일 Runtime|`app/runtime.ts`|Cordis 주입, setup, 세션 복원, passes, graceful shutdown|

먼저 Engine이 이 포트들의 좁은 메서드에만 의존하도록 바꾸고, 기존 Local 어댑터로 01–08의 불변조건을 유지합니다. 그 다음 한 포트씩 DSH 구현으로 교체합니다. 한 번에 전체를 바꾸면 정책 문제와 provider 문제를 구분하기 어렵습니다.

## 2. launch와 완료 callback을 분리한다

실습의 직렬 pump는 Worker가 끝날 때까지 기다립니다. 원본에서는 start가 세션 실행을 예약하고 즉시 돌아오며, 결과는 나중의 report로 들어옵니다. 다음 순서로 바꾸세요.

1. 원본 `ExecutorHost`의 engine/sessions/effects/lifetime/paused 의존성을 읽고 필요한 포트부터 정의합니다.
2. Ticket별 안정적인 worker Session ID와 작업 디렉터리를 만듭니다. Assignment ID를 Session ID로 대체하지 않습니다. 원본은 Ticket에 지속 세션을 연결하며 실행 시도는 별도 관리합니다.
3. 준비 명령 성공과 세션 준비를 확인한 뒤 assignmentStarted를 보고합니다. 준비 실패와 일시적 provider 오류는 같은 재시도 조건으로 묶지 않습니다.
4. maxWorkers와 pause를 고려해 슬롯을 배정합니다. 대기 상태와 실제 실행 상태를 구분합니다.
5. 세션 report와 input-read 이벤트를 현재 Assignment에 연결합니다. 종료된 시도의 event를 받아도 현재 상태를 변경하지 않게 합니다.
6. stop 시 turn, jobs, subagents 정리를 모두 기다립니다. shutdown은 정리 완료 후 Store를 닫아야 합니다.

완료 판정은 “모델이 대답함”이 아닙니다. Worker 두 개가 실행 중에도 Main이 사람의 후속 입력을 받고, stop한 시도의 늦은 완료를 거부하며, 슬롯이 회수되어야 합니다. 관련 원본 테스트는 `tests/background.spec.ts`, `tests/runtime-concurrency.spec.ts`, `tests/delivery.spec.ts`, `tests/deployment.spec.ts`입니다.

## 3. Main Session을 Assessor와 Router로 구성한다

[app/sessions.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/app/sessions.ts)와 [app/assessment.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/app/assessment.ts)를 읽습니다. Main에 candidate를 전달하고 실제 전달 시점에 Eval deadline을 시작합니다. 도구의 구조화된 결과를 host에서 검증한 뒤 Engine.decide로 넘깁니다.

모델 입력은 bounded context와 read pointer로 구성합니다. 본문 전체를 반복해서 붙이지 말고, 원본처럼 Trigger 주변 문맥·관련 Ticket·policyVersion을 보여 주고 필요한 내용을 ID로 더 읽게 합니다. read resource의 접근 범위도 같이 구현합니다. 도구 schema만 제공하고 권한 검사를 생략하면 Worker가 다른 업무의 문맥을 읽을 수 있습니다.

Main의 “코드 구현을 하지 않는다”는 지침은 실제 도구 등록과 구분하세요. 원본 Main에는 bash/read 등도 있으며, 실행 책임 제한에는 프롬프트가 참여합니다. `noWait`는 긴 대기를 제한하는 guard이지 일반적인 보안 sandbox 전체가 아닙니다. Worker 도구 제한은 세션이 끝난 뒤에도 적용되어야 합니다.

검증 대상: `tests/model-surface.spec.ts`, `tests/tools.spec.ts`, `tests/prompts.spec.ts`, `tests/assessment.spec.ts`. 입력 조립과 실제 provider 모델의 판단 품질 평가는 별개로 관리합니다.

## 4. Cordis bundle과 프로필로 조립한다

원본은 독립적인 임의 Node 실행 진입점으로 배포되는 앱이 아니라 DSH bundle입니다. [package.json](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/package.json)의 dsh.bundle 선언, [cordis.patch.yml](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/cordis.patch.yml)의 plugin/preset 구성, [src/index.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/index.ts)의 서비스 진입점을 함께 읽으세요.

구현 순서는 Runtime 서비스 등록 → GitHub Source 주입 → Main/Worker preset 연결 → client panel 등록 → setup 검증입니다. profile은 stateDir를 공급해야 합니다. 실제 설치·계정·모델·작업 디렉터리 설정은 [원본 006 Deployment](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/006-deployment.md)의 해당 revision 절차를 따르세요. 여기에는 검증하지 않은 SDK 실행 예제를 만들어 넣지 않았습니다.

이 단계의 실제 provider 실행에는 인증과 외부 전송 권한이 필요합니다. 이번 교재 제작에서는 키나 GitHub/Feishu 계정을 연결해 에이전트를 가동하지 않았습니다. 다음 [10 원본 범위 완성](10-production.ko.md)에서 남은 운영 기능을 닫습니다.
