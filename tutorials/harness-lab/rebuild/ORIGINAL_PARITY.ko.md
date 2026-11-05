# 원본 결과물로 확장하는 기능 대응표

이 표는 작은 TypeScript 참조 구현과 공개 프로토타입 사이의 차이를 추적합니다. “재현”은 동일한 API나 저장 형식이라는 뜻이 아니라 명시된 불변조건을 실행 테스트로 검증했다는 뜻입니다. 원본 revision은 [수집 근거](../sources/prototype-evidence.json)에 고정되어 있습니다.

|책임|01–08에서의 범위|원본 수준으로 추가할 작업|원본 소스·주요 테스트|단계|
|---|---|---|---|---|
|사건 ID·입력 검증|축소 fixture envelope|실제 GitHub/Feishu payload, bot/account 확인|sources/*-trigger.ts; sources.spec.ts|01, 10C/G|
|SourceScope|단일 repository 일치|Source 활성화, 관찰 범위, admission row|sources/registry.ts; registry.spec.ts|10C|
|권한|단일 allowlist, explicit/inferred, observe/auto|Source별 admission 표, bot 목록, 정책 변경 알림|policy.ts; policy.spec.ts|02, 10A|
|의미 평가|고정 assessment 입력|Main Session의 구조화된 도구 호출과 문맥 조립|app/assessment.ts; assessment.spec.ts|09|
|Eval|Trigger당 하나, stale version 거부|Thread batching, delivered deadline, pause, requeue|core/evals.ts; core-engine.spec.ts|10A|
|Ticket/Mandate|승인 범위 보존, 철회 별도|origin/basis 감사, PR 관계·종료 규칙|core/tickets.ts; followups.spec.ts|03, 10B|
|Subscription|소유/context, 중복 fan-out 방지|Correlation 탐색, bind/attach/unsubscribe/handback|core/intake.ts; followups.spec.ts|04, 10B|
|Assignment|시도 구분, stale report 거부|retry/restart 조건, 실제 worker lifecycle|core/assignments.ts; background.spec.ts|06, 09|
|입력 전달|delivered/read 분리, unread 재예약|DSH inbox/event 반영, recovery note|app/delivery.ts; delivery.spec.ts|06, 09|
|저장|JSON records, SQLite version 1|원본 전용 테이블·조회·migration|app/store.ts, migration.ts; store.spec.ts|03, 10D|
|Effects|generation, due, backoff, 세 번 실패 기록|종류별 순서·quiet/later·health·drain|app/effects.ts; effects.spec.ts|05, 10E|
|Outbox|pending/sent, message ID|dropped, source 비활성, 채널·Ticket별 순서|app/outbox.ts; outbox.spec.ts|07, 10C/E|
|중복 전송|메모리 Map 대역|GitHub 마커 조회, Feishu provider idempotency|sources/*-channel.ts; sources.spec.ts|07, 10C/G|
|실행|고정 문자열을 반환하는 LocalExecutor|실제 코드 도구, worktree, 모델, PR, 슬롯|executor/dsh.ts; deployment.spec.ts|09|
|동시성|직렬 pump, 중복 drain 합침|Worker 슬롯과 비동기 완료, full-duplex|executor/background.ts; runtime-concurrency.spec.ts|09|
|프로세스 복구|running 시도 교체, DB 재열기|stateDir lock, setup 실패 정리, graceful shutdown|app/runtime.ts; runtime.spec.ts|10D|
|자원 읽기|자기 Ticket scope와 UTF-16 페이지|원본 resource 그래프, 접근 가능한 ID만 노출|app/resources.ts; tools.spec.ts|08, 09|
|UI|loopback 읽기 전용 목록·JSON|상세 카드·stop/retry·설정·prompt·배포 화면|app/views/, client/; panel-*.spec.tsx|08, 10F|
|지속 수집|수동 fixture 입력|주기적 polling, overlap, passes, 연결 상태|sources/github.ts, app/passes.ts; passes.spec.ts|10C/E|
|패키징|독립 npm 실습|DSH bundle, Cordis plugin/preset, profile|package.json, cordis.patch.yml; bundle-patch.spec.ts|09|

## 왜 한 번에 모두 만들지 않는가

처음부터 provider 계정, 모델, UI, 세션, 복구를 함께 붙이면 실패 원인을 구분하기 어렵습니다. 이 과정은 먼저 결정적 업무 전이와 실패 실험을 고정하고, 나중에 외부 어댑터를 교체하도록 구성했습니다. 최소 구현에서 생략한 기능도 원본 결과물의 일부이므로 표에서 지우지 말고 구현·검증 증거를 채우세요.

## 원본과의 동등성을 주장하기 전

해당 revision의 원본 테스트가 통과하는지와 직접 만든 구현이 같은 수용 시나리오를 만족하는지를 각각 확인해야 합니다. 데이터 형식·callback 이름이 다르면 원본 테스트를 그대로 복사할 수 없으므로, 테스트가 보장하는 관찰 가능한 결과를 먼저 옮깁니다. 실시간 모델의 성공률, 무인 운영 시간, 사람의 개입량은 별도의 평가셋·운영 기록이 필요합니다.
