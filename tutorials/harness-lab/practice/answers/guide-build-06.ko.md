# 06. 반환 입력과 종료 복구

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: guide-build-06-1

```text
t.inputs.filter(i=>!i.consumed&&!i.handedBack)
```

handback된 입력이 원래 Worker에도 다시 전달되면 중복 실행이 생깁니다. retry/recovery도 같은 규칙을 유지합니다.

## 정답 2: guide-build-06-2

```text
this.engine.interrupt(id,job.turn);
```

일반 실패와 운영자의 호스트 종료는 다릅니다. 입력 복원과 늦은 결과 차단이 먼저 기록되어야 합니다.

## 전체 정답 실행

```sh
python scripts/practice.py create guide-build 06 --dest /tmp/guide-build-06-answer --answers
cd /tmp/guide-build-06-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 06
```

[문제로 돌아가기](../exercises/guide-build-06.ko.md) · [참조 구현](../../guide-build/src/engine.ts)
