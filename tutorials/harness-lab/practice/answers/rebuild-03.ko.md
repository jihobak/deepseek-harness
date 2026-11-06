# 03. 원자적인 승인

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: rebuild-03-1

```text
this.store.enqueue('launch', assignment.id, { ticketId: ticket.id, assignmentId: assignment.id });
```

Ticket과 launch 예약이 같은 트랜잭션에 있으므로 enqueue 실패 시 승인 전체가 롤백됩니다.

## 정답 2: rebuild-03-2

```text
evaluation.version === this.policy.version
```

오래된 판단을 현재 권한으로 사용하지 않습니다. stale 결과는 unavailable로 남습니다.

## 전체 정답 실행

```sh
python scripts/practice.py create rebuild 03 --dest /tmp/rebuild-03-answer --answers
cd /tmp/rebuild-03-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 03
```

[문제로 돌아가기](../exercises/rebuild-03.ko.md) · [참조 구현](../../rebuild/src/engine.ts)
