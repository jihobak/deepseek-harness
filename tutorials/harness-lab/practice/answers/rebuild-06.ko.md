# 06. 실행 시도와 재개

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: rebuild-06-1

```text
if (t.status !== 'open' || current(t).id !== assignmentId) return false;
      if (t.reports.some(r => r.assignmentId === assignmentId && r.text === text)) return true;
```

현재 작업의 늦은 결과인지 판단하려면 업무 ID와 실행 시도 ID를 구분해야 합니다.

## 전체 정답 실행

```sh
python scripts/practice.py create rebuild 06 --dest /tmp/rebuild-06-answer --answers
cd /tmp/rebuild-06-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 06
```

[문제로 돌아가기](../exercises/rebuild-06.ko.md) · [참조 구현](../../rebuild/src/engine.ts)
