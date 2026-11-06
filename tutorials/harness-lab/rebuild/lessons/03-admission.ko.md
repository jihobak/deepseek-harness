# 03. 승인을 영속적인 작업으로 만들기

이 단계의 완료 상태는 “모델이 실행됐다”가 아니라 “승인된 Ticket과 실행 예약이 함께 저장됐다”입니다. 아직 실제 모델이나 shell을 연결하지 않습니다.

## 데이터와 연산

실습 Store의 `records(kind,id,data)`는 Trigger, Eval, Ticket, Subscription 등을 JSON으로 저장합니다. 원본의 전용 테이블·Repository를 대체한 교육용 축소입니다. `effects`는 실행 예약을 저장합니다. `Store.atomic`은 동기 작업만 받아 BEGIN IMMEDIATE → 작업 → COMMIT, 실패 시 ROLLBACK을 수행합니다. 트랜잭션 안에서 await하면 잠금 기간과 실패 처리가 불명확해지므로 금지합니다.

## 작성 순서

1. Store에 `get`, `all`, `put`, `atomic`, `close`를 구현합니다. Node의 `DatabaseSync`를 사용하며 schema version을 검사합니다. 새 버전 DB를 임의로 낮은 버전으로 읽지 않습니다.
2. `Engine.receive`에서 Trigger를 한 번 저장하고, Policy가 허용한 후보를 Eval로 보존합니다. Eval에는 판단 당시 policyVersion을 넣습니다.
3. `Engine.decide`에서 Eval의 pending 여부와 현재 policyVersion을 검사합니다. 이미 결정된 Eval은 같은 결과를 반환하고 Ticket을 다시 만들지 않습니다.
4. accept라면 Mandate와 첫 Assignment를 가진 Ticket, 시작 Thread의 Subscription, launch effect를 같은 트랜잭션 안에서 만듭니다.
5. `newAttempt`는 실행을 호출하지 않고 `enqueue('launch', assignmentId, payload)`만 수행합니다. Effects의 경쟁·재시도는 05에서 완성합니다.

```sh
npm run stage -- 03
```

검증의 핵심은 `enqueue`에 실패를 주입했을 때 Ticket도 없어지고 Eval도 pending으로 돌아가는 것입니다. Decision만 accept로 남거나 Ticket만 남으면 시스템은 복구 시 무엇을 해야 할지 알 수 없습니다.

이 실습은 Trigger당 Eval 하나입니다. 원본의 Thread별 단일 Eval, batching, 전달 시점부터 시작하는 deadline, pause에 따른 시간 보정은 10에서 추가합니다. 나중에 구현할 요구사항을 단순 구현의 보장으로 적지 않습니다.

원본 대응: [core/engine.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/core/engine.ts), `core/evals.ts`, `core/tickets.ts`, `app/store.ts`, `tests/core-engine.spec.ts`. 다음은 [04 후속 입력](04-routing.ko.md)입니다.
