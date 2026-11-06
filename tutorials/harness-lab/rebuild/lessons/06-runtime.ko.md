# 06. 실행·중단·재개와 늦은 결과 다루기

Ticket은 업무이고 Assignment는 한 번의 실행 시도입니다. 이 구분을 코드로 유지해야 재시작과 사람의 중단을 일관되게 처리할 수 있습니다.

## 상태 전이

|사건|Ticket|현재 Assignment|의미|
|---|---|---|---|
|accept|open|pending|승인 및 실행 예약|
|Executor 시작 확인|open|running|실제로 시작한 시도|
|검토 준비 보고|open|waiting|사람의 검토 필요; PR merge를 의미하지 않음|
|Executor가 업무 종료|ended, executor|기존 기록 보존|소유 사람 후속 입력에서 재검증 후 재개 가능|
|사람 stop|ended, human; withdrawn|기존 기록 보존|그 Ticket에는 자동 재개하지 않음|
|실행 중 프로세스 재시작|open|기존 interrupted, 새 pending|이전 실행의 늦은 보고는 거부|

## 작성 순서

1. `Runtime.drain`이 effect를 읽고 외부 포트를 호출하게 합니다. 동시에 drain을 호출하면 같은 Promise를 반환해 한 프로세스 안에서 pump가 겹치지 않게 합니다.
2. launch가 현재 Assignment인지 확인한 뒤 started를 기록합니다. Worker 결과는 `report(ticketId, assignmentId, text)`로 돌려줍니다.
3. `Engine.report`는 ended Ticket과 오래된 Assignment를 거부합니다. 승인 범위를 바꾸지 않으며 결과 receipt와 reply effect를 함께 예약합니다.
4. 사람 stop은 종료와 철회를 저장한 뒤 stop effect를 예약합니다. 이미 실행 중인 I/O의 결과도 report 검사에서 걸러져야 합니다.
5. Executor-ended Ticket의 소유 사람 입력만 재개 후보로 삼고 현재 정책으로 Mandate를 재검증합니다. context-only와 bot은 자동 재개하지 않습니다.
6. 전달 완료와 모델의 실제 read를 따로 기록합니다. read는 delivered보다 먼저 올 수 없습니다. recover는 running 시도를 교체하고 unread 입력만 새 시도에 예약합니다.

```sh
npm run stage -- 06
```

특히 in-flight stop 테스트는 Worker Promise를 의도적으로 멈추고, 사람이 stop한 다음 결과를 반환합니다. 늦은 결과가 보고 목록에 남으면 실패입니다. 현재 LocalExecutor의 stop은 원격 프로세스를 취소하지 않으므로 실제 cancellation은 09에서 구현합니다.

참조 Runtime은 직렬 소비기입니다. long-running Worker를 await하는 동안 다른 effect도 기다립니다. 따라서 원본의 full-duplex나 여러 Worker 동시 실행을 재현한다고 볼 수 없습니다. 09에서는 시작 예약과 세션 완료 callback을 분리해 이 제약을 제거합니다.

원본 대응: [core/assignments.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/core/assignments.ts), `core/tickets.ts`, `app/delivery.ts`, `executor/dsh.ts`, `tests/delivery.spec.ts`, `tests/background.spec.ts`. 다음은 [07 외부 연결](07-adapters.ko.md)입니다.
