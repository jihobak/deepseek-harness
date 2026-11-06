# 04. Worker 출력 해석하기

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: guide-build-04-1

```text
code===0&&!r.is_error
```

호스트는 프로세스 성공과 provider 성공을 구분합니다. JSON 파싱 실패도 정상 응답이 아닙니다.

## 정답 2: guide-build-04-2

```text
!sessionId
```

sessionID가 없는 성공은 다음 실행에서 다른 세션을 만들 수 있으므로 호환되지 않는 출력을 초기에 거절합니다.

## 전체 정답 실행

```sh
python scripts/practice.py create guide-build 04 --dest /tmp/guide-build-04-answer --answers
cd /tmp/guide-build-04-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 04
```

[문제로 돌아가기](../exercises/guide-build-04.ko.md) · [참조 구현](../../guide-build/src/engine.ts)
