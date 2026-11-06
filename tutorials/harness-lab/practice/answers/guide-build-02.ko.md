# 02. 재개와 PR 종료를 구분하기

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: guide-build-02-1

```text
if(!t.running) this.endForPRs(t);
```

종료 사건과 실행 중인 turn은 다릅니다. 실행 중에는 ready 보고가 완료 조건을 다시 판단합니다.

## 정답 2: guide-build-02-2

```text
if(c.status==='ready') this.endForPRs(t);
```

과거 PR이 닫혀 있어도 후속 작업은 진행할 수 있습니다. 반복된 PR 조회 역시 새로운 종료 사건이 아닙니다.

## 전체 정답 실행

```sh
python scripts/practice.py create guide-build 02 --dest /tmp/guide-build-02-answer --answers
cd /tmp/guide-build-02-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 02
```

[문제로 돌아가기](../exercises/guide-build-02.ko.md) · [참조 구현](../../guide-build/src/engine.ts)
