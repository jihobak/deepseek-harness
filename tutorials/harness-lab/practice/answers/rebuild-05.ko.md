# 05. 오래된 Effect 완료 차단

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: rebuild-05-1

```text
'DELETE FROM effects WHERE seq=? AND generation=?'
```

generation만 검사하면 같은 key를 삭제 후 재등록한 경우 새 예약을 지울 수 있습니다.

## 정답 2: rebuild-05-2

```text
'UPDATE effects SET attempts=attempts+1,due=? WHERE seq=? AND generation=?'
```

성공뿐 아니라 실패 callback도 지연될 수 있습니다. 새 generation의 due를 이전 실행이 덮어쓰면 안 됩니다.

## 전체 정답 실행

```sh
python scripts/practice.py create rebuild 05 --dest /tmp/rebuild-05-answer --answers
cd /tmp/rebuild-05-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 05
```

[문제로 돌아가기](../exercises/rebuild-05.ko.md) · [참조 구현](../../rebuild/src/engine.ts)
