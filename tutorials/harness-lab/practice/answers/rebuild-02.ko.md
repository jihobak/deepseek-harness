# 02. 모델 판단과 권한

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: rebuild-02-1

```text
if (!a.directionSettled || !a.rules.some(r => r.matched) || this.settings.mode === 'off') return 'ignore';
```

allowlist와 모델 accept만으로 자율 실행이 승인되지 않습니다. host가 결정적 전제 조건을 검증합니다.

## 정답 2: rebuild-02-2

```text
this.settings.mode === 'observe' ? 'would_accept' : 'accept'
```

관찰 모드가 실제 Worker를 시작하면 정책 시험이 외부 부작용을 만들게 됩니다.

## 전체 정답 실행

```sh
python scripts/practice.py create rebuild 02 --dest /tmp/rebuild-02-answer --answers
cd /tmp/rebuild-02-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 02
```

[문제로 돌아가기](../exercises/rebuild-02.ko.md) · [참조 구현](../../rebuild/src/policy.ts)
