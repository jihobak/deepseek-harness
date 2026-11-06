# 05. Outbox 순서와 재전송

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: guide-build-05-1

```text
if(m.due>now)continue;
```

같은 Ticket/Thread의 선두가 지연되면 뒤도 기다립니다. 다른 대화는 계속 진행할 수 있습니다.

## 정답 2: guide-build-05-2

```text
error instanceof DeliveryError && error.permanent
```

영구 거절을 무한 재시도하면 해당 대화의 모든 후속 메시지를 막습니다. 일시적 오류에는 backoff를 유지합니다.

## 전체 정답 실행

```sh
python scripts/practice.py create guide-build 05 --dest /tmp/guide-build-05-answer --answers
cd /tmp/guide-build-05-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 05
```

[문제로 돌아가기](../exercises/guide-build-05.ko.md) · [참조 구현](../../guide-build/src/engine.ts)
