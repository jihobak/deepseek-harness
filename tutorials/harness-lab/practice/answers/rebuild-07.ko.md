# 07. 외부 전송과 성공 기록

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: rebuild-07-1

```text
await this.channel.send(r.id, r.text);
```

전송 후 기록 전 장애에서는 같은 ID로 다시 시도합니다. 이 순서와 로컬 DB만으로 외부 exactly-once가 보장되지는 않습니다.

## 전체 정답 실행

```sh
python scripts/practice.py create rebuild 07 --dest /tmp/rebuild-07-answer --answers
cd /tmp/rebuild-07-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 07
```

[문제로 돌아가기](../exercises/rebuild-07.ko.md) · [참조 구현](../../rebuild/src/engine.ts)
