# 08. 업무별 읽기 범위

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: rebuild-08-1

```text
if (viewerTicketId !== targetTicketId) throw new Error('Forbidden Ticket');
```

페이지 예산을 지키더라도 권한 검사가 없으면 업무 간 데이터가 노출됩니다.

## 정답 2: rebuild-08-2

```text
offset + limit < body.length ? offset + limit : null
```

offset 단위는 JavaScript UTF-16 code unit입니다. token이나 Python 문자 수와 혼동하면 안 됩니다.

## 전체 정답 실행

```sh
python scripts/practice.py create rebuild 08 --dest /tmp/rebuild-08-answer --answers
cd /tmp/rebuild-08-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 08
```

[문제로 돌아가기](../exercises/rebuild-08.ko.md) · [참조 구현](../../rebuild/src/engine.ts)
