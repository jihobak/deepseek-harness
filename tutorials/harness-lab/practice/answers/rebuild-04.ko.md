# 04. 구독 소유권과 문맥

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: rebuild-04-1

```text
s.context && (reached.get(s.ticketId) ?? true)
```

단순 마지막 값 덮어쓰기는 소유권을 잃을 수 있습니다. Ticket별 한 번 전달하면서 소유 관계가 우선하도록 AND로 합칩니다.

## 정답 2: rebuild-04-2

```text
if (t.human && !context) owned = true;
```

구독 문맥을 받는 것과 새 업무 평가를 생략할 권리는 다릅니다.

## 전체 정답 실행

```sh
python scripts/practice.py create rebuild 04 --dest /tmp/rebuild-04-answer --answers
cd /tmp/rebuild-04-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 04
```

[문제로 돌아가기](../exercises/rebuild-04.ko.md) · [참조 구현](../../rebuild/src/engine.ts)
