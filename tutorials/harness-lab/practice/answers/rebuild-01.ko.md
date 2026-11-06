# 01. 사건의 정체성

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: rebuild-01-1

```text
JSON.stringify(['github', event.repository, event.id])
```

본문이나 단순 댓글 번호만으로 ID를 만들면 다른 저장소 또는 재수집 사건을 혼동합니다.

## 정답 2: rebuild-01-2

```text
throw new Error('Invalid actor flags');
```

외부 입력은 TypeScript 타입만으로 안전해지지 않습니다. 정규화 시점에 실제 값의 타입을 확인합니다.

## 전체 정답 실행

```sh
python scripts/practice.py create rebuild 01 --dest /tmp/rebuild-01-answer --answers
cd /tmp/rebuild-01-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 01
```

[문제로 돌아가기](../exercises/rebuild-01.ko.md) · [참조 구현](../../rebuild/src/source.ts)
