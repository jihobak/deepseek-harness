# 01. 누가 작업을 시작하는가

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: guide-build-01-1

```text
if (same(trigger.actor,this.config.agent)) return {kind:'ignored',tickets:[],reason:'own_account'};
```

자기 댓글을 구독 후속 입력보다 먼저 제거해야 출력→입력 루프가 생기지 않습니다.

## 정답 2: guide-build-01-2

```text
if (this.store.get('trigger',trigger.id)) return {kind:'duplicate',tickets:[]};
```

불변 사건 ID를 먼저 검사하므로 재수집·poll overlap이 중복 업무를 만들지 않습니다.

## 전체 정답 실행

```sh
python scripts/practice.py create guide-build 01 --dest /tmp/guide-build-01-answer --answers
cd /tmp/guide-build-01-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 01
```

[문제로 돌아가기](../exercises/guide-build-01.ko.md) · [참조 구현](../../guide-build/src/engine.ts)
