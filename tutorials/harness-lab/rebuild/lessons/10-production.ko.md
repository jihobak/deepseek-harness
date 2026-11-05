# 10. 공개 프로토타입의 결과물까지 완성하기

원본 수준의 완료는 데모 한 번 성공으로 판정하지 않습니다. [원본 대응표](../ORIGINAL_PARITY.ko.md)의 항목을 기능 단위로 구현하고, 각 항목의 정상·거절·복구 경로를 검증합니다. 다음 순서는 기능 간 의존성을 고려한 권장 구현 순서입니다.

## A. Thread와 Eval의 업무 규칙

Thread별 하나의 활성 Eval과 후속 Trigger batching을 구현합니다. 후보가 큐에 머문 시간과 Main Session에 전달된 후 평가 시간은 다릅니다. delivered callback에서 deadline을 시작하고 pause 시간을 보정합니다. 정책 변경 시 진행 중 Eval을 갱신·재큐잉하고, 오래된 판단을 승인으로 쓰지 않습니다. bounded requeue를 넘으면 unavailable을 기록합니다.

원본: `core/evals.ts`, `core/part.ts`, `app/assessment.ts`. 테스트: `core-engine.spec.ts`, `assessment.spec.ts`, `admission-context.spec.ts`. 통과 조건: 오래 기다린 큐의 후보가 전달 직후 이미 timeout 처리되지 않고, 정책 변경 전 결과가 Ticket을 만들지 않습니다.

## B. 작업의 실제 종료와 후속 입력

Issue/PR Thread의 소유·연결·context-only를 구분하고 threadClosed/followsDone을 구현합니다. ready report와 PR close/merge를 분리합니다. handback은 해당 Worker가 소유하던 메시지만 반환할 수 있게 하며, 다른 Ticket이 여전히 소유하면 무조건 새 Eval을 만들지 않습니다. retry와 restart를 구분하고 실패 원인에 따라 허용 가능한 조작을 계산합니다.

원본: `core/tickets.ts`, `core/assignments.ts`, `core/replies.ts`. 테스트: `followups.spec.ts`, `core-engine.spec.ts`, `delivery.spec.ts`. 통과 조건: 여러 연결 Thread 중 하나만 닫혔을 때 업무가 너무 일찍 종료되지 않으며, 사람 stop 이후 같은 Ticket이 댓글로 다시 실행되지 않습니다.

## C. GitHub 수집과 실제 채널

`SourceRegistry`에 Source kind와 인스턴스를 등록하고, 설정된 repository·account·scope를 확인합니다. Issue/PR comment, review, CI 등 사건별 정규화·안정적 ID·중복 처리를 구현합니다. poll overlap, pagination, cursor 저장, 삭제되거나 접근 불가한 원본을 처리합니다. Source를 비활성화할 때 수집과 전송이 어떻게 달라지는지도 정합니다.

원본: `sources/registry.ts`, `sources/github.ts`, `sources/github-trigger.ts`, `sources/github-read.ts`, `sources/github-pull.ts`, `sources/github-channel.ts`. 테스트: `sources.spec.ts`, `registry.spec.ts`, `github-read.spec.ts`. 통과 조건: 페이지 중간 장애 후 사건 유실이 없고, 같은 댓글 재수집이 중복 업무가 되지 않습니다. 외부 메시지 응답 유실에 대해서는 마커 기반 중복 완화의 한계까지 기록합니다.

## D. 실행 환경과 복구

stateDir lock, 원자적 setup, 작업 디렉터리 준비, 실행 계정 probe, command shim, 변수 주입을 구현합니다. 프로세스 부팅 중 실패하면 이미 획득한 자원을 역순으로 정리합니다. 과거 DB를 지원한다면 명시적인 단방향 migration을 추가하며, 더 새로운 schema를 임의로 읽지 않습니다.

원본: `app/runtime.ts`, `app/setup.ts`, `app/execution-environment.ts`, `app/store.ts`, `app/migration.ts`, `infra/environment.ts`. 테스트: `runtime.spec.ts`, `deployment.spec.ts`, `environment.spec.ts`, `migration.spec.ts`. 통과 조건: 두 Runtime이 같은 stateDir를 동시에 소유할 수 없고, 중단 후 재시작이 미전달 입력과 실행 예약을 잃지 않습니다.

## E. 지속 루프와 운영 상태

Passes를 한 번에 하나만 실행되도록 만들고 주기적 tick과 즉시 wake를 합칩니다. Effects는 종류별 순서, retry, pause, graceful drain을 지원해야 합니다. HealthBoard와 retry budget 상태를 UI로 투영합니다. 구조적 연결 상태를 의미적 작업 진전과 혼동하지 않습니다. 연구 글의 독립 LLM Watchdog는 이 공개 구현과 같은 것으로 취급하지 않습니다.

원본: `app/passes.ts`, `app/effects.ts`, `app/outbox.ts`, `app/retry-health.ts`, `infra/health.ts`. 테스트: `passes.spec.ts`, `effects.spec.ts`, `outbox.spec.ts`, `retry-health.spec.ts`. 통과 조건: 이전 drain이 끝나기 전에 새 drain이 중첩되지 않고, 재시도 실패가 무한히 숨겨지지 않습니다.

## F. 사람이 쓰는 UI와 정책 변경

Ticket 목록·상세, Trigger/Decision 이력, 현재 attention을 먼저 완성합니다. 다음으로 stop/retry, 정책 모드와 rule, Source 설정, prompt preview와 저장, 배포 상태를 연결합니다. 서버 command를 구현하기 전에 버튼을 만들지 마세요. UI가 실행할 수 없는 조작을 표시하거나 권한 검사 없이 상태를 직접 쓰지 않도록 합니다.

원본: `app/http.ts`, `app/api.ts`, `app/cards.ts`, `app/views/`, `src/client/`. 테스트: `panel-overview.spec.tsx`, `panel-execution.spec.tsx`, `panel-settings.spec.tsx`, `panel-prompts.spec.tsx`, `panel-deployment.spec.tsx`. 통과 조건: 사람이 읽는 단계와 서버의 실제 허용 조작이 일치하고, 설정 변경의 적용·재시작 필요 여부를 확인할 수 있습니다.

## G. 선택적인 Feishu 연결

GitHub 경로를 먼저 완성한 뒤 Feishu를 추가합니다. group/direct 구분, bot event stream, message/thread 정규화, 이미지·원본 읽기, provider idempotency, health 갱신을 구현합니다. 입력 스트림이 분리되어 있으면 ready와 error의 도착 순서를 테스트하세요.

원본: `sources/feishu.ts`, `feishu-loops.ts`, `feishu-trigger.ts`, `feishu-read.ts`, `feishu-channel.ts`. 테스트: `sources.spec.ts`, `feishu-read.spec.ts`, `feishu-image.spec.ts`. 기존 분석에서는 malformed JSON 뒤 health가 error여야 하는 테스트가 ready로 관찰되어 실패했습니다. 그 실패를 “원본이므로 정상”이라고 통과 기준에서 제외하지 않습니다.

## 최종 수용 시나리오

1. 같은 Issue 요청을 두 번 수집해도 하나의 Ticket만 생깁니다.
2. observe에서는 would_accept 기록만 남고 실행·승인 응답을 보내지 않습니다.
3. auto에서 범위가 확정된 요청을 승인하고 Worker가 자기 작업 디렉터리에서 수정·검증합니다.
4. 실행 중 사람의 소유 후속 입력이 도착해도 중복 Ticket이 생기지 않습니다.
5. context-only 문맥과 bot/CI 입력이 권한을 자동 확대하지 않습니다.
6. 사람이 stop하면 jobs/subagents까지 정리되고 늦은 report는 거부됩니다.
7. 프로세스를 종료·재시작해 미처리 입력과 남은 Effects를 복구합니다.
8. 결과 전송 후 응답 유실에도 동일 메시지 ID로 재시도하고 관찰한 중복 여부를 기록합니다.
9. UI에 검토할 작업이 표시되고, PR merge/close가 실제 업무 종료 조건에 반영됩니다.
10. 설정 변경·Source 비활성·삭제된 대화·모델 장애를 각각 재현하고 복구 방법을 확인합니다.

원본의 `pnpm check`는 typecheck → test → build 순서입니다. 중간 테스트가 실패하면 build는 실행되지 않으므로 별도 build 결과와 섞지 마세요. 외부 서비스의 실제 수용 시나리오는 mock 테스트와 별도 기록으로 남깁니다. 이 과정 제작 시에는 로컬 실습만 실행했고, 위 실제 운영 시나리오는 학습자가 기능을 확장한 뒤 수행할 완료 기준입니다.
