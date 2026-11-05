# 05. 실행 의도를 장애 이후에도 보존하기

SQLite에 Ticket을 저장했다고 Worker가 반드시 시작되는 것은 아닙니다. 저장 직후 프로세스가 죽을 수 있습니다. 반대로 외부 전송은 성공했지만 성공 기록 전에 죽을 수도 있습니다. 서로 다른 두 실패 구간을 따로 설계합니다.

## 큐의 최소 스키마

`effects(seq,kind,key,payload,generation,attempts,due)`를 둡니다. `(kind,key)`는 동일 작업의 예약을 합치는 키이고 seq는 순서, generation은 payload 갱신 세대입니다. 재등록 시 generation을 올리고 재시도 횟수와 due를 초기화합니다.

## 작성 순서

1. `enqueue`를 UPSERT로 구현합니다. 도메인 변경과 같은 트랜잭션에서 호출할 수 있어야 합니다.
2. `next(now)`는 due를 지난 가장 오래된 effect를 읽습니다. 실습은 한 프로세스만 소비한다는 가정이며 claim/lease가 없습니다.
3. `complete`는 seq와 generation이 모두 일치할 때만 삭제합니다. 오래된 실행 결과가 새 payload를 지우면 안 됩니다.
4. `retry`도 같은 조건으로만 attempts와 due를 갱신합니다. 오래된 실패가 새 예약을 지연시키면 안 됩니다.
5. SQLite를 닫고 다시 열어 잔여 effect가 보이는지 검증합니다. schema version 99를 만든 뒤 현재 reader가 거부하는지도 확인합니다.

```sh
npm run stage -- 05
```

경쟁 순서를 적어 보세요: A가 generation 1을 읽음 → 새 요청이 generation 2로 갱신 → A 완료. 정답은 generation 2가 남는 것입니다. 이 테스트는 payload가 같은 경우도 필요하지만, 먼저 서로 다른 payload로 차이를 눈에 보이게 만듭니다.

원본은 effect 종류별 순서와 조용한 재시도, backoff, drain 등을 더 정교하게 다룹니다. 외부 전송의 exactly-once는 이 테이블만으로 보장되지 않으며 07에서 다룹니다.

원본 대응: [app/effects.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/app/effects.ts), `app/store.ts`, `tests/effects.spec.ts`. 다음은 [06 Runtime](06-runtime.ko.md)입니다.
