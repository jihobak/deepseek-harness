# 07. 사람이 볼 작업 정렬

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: guide-build-07-1

```text
Number(attention.includes(b.stage))-Number(attention.includes(a.stage))
```

사람의 확인 필요성을 보고문 문자열에서 추측하지 않고 구조적 stage에서 계산합니다.

## 전체 정답 실행

```sh
python scripts/practice.py create guide-build 07 --dest /tmp/guide-build-07-answer --answers
cd /tmp/guide-build-07-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 07
```

[문제로 돌아가기](../exercises/guide-build-07.ko.md) · [참조 구현](../../guide-build/src/engine.ts)
