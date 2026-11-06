# 03. Worker의 신원과 전달 대상

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: guide-build-03-1

```text
this.values.set(this.hash(token), { id, turn });
```

호스트가 인증 결과로 Ticket을 결정합니다. 모델이 제공한 ticketId로 권한을 얻는 경로를 만들지 않습니다.

## 정답 2: guide-build-03-2

```text
throw new Error('trigger did not reach this ticket');
```

대상 검증과 메시지 예약이 하나의 트랜잭션이므로 잘못된 보고는 상태 변경도 함께 롤백합니다.

## 전체 정답 실행

```sh
python scripts/practice.py create guide-build 03 --dest /tmp/guide-build-03-answer --answers
cd /tmp/guide-build-03-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 03
```

[문제로 돌아가기](../exercises/guide-build-03.ko.md) · [참조 구현](../../guide-build/src/engine.ts)
