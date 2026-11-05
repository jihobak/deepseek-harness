# 05. 수집 cursor와 Outbox를 분리하기

원문 §6은 gh CLI를 통한 polling을 제안합니다. Source는 외부 JSON을 Trigger로 바꾸는 역할과, 호스트 메시지를 원래 대화에 쓰는 역할을 함께 가집니다. 읽기와 쓰기의 실패 처리는 다릅니다.

## 읽기 구현 순서

1. endpoint별 cursor를 둡니다. issues, issues/comments, pulls/comments 중 하나가 실패해도 다른 endpoint는 진행합니다.
2. 첫 실행은 now를 cursor로 저장하고 과거를 재생하지 않습니다.
3. gh의 paginate+slurp 결과를 페이지 배열로 파싱합니다. 작성자 type 또는 login의 `[bot]` 접미사로 bot을 구분합니다.
4. 각 사건을 Engine에 저장한 뒤 cursor를 poll-start minus 10 seconds로 전진시킵니다. 부분 실패가 나면 이미 저장된 사건을 다시 읽을 수 있지만 ID 중복 검사로 흡수합니다.
5. Issue 목록은 updated 기준으로 검색하되 생성 시점이 cursor 이후인 항목만 신규 사건으로 만듭니다.

참조 `Reader`는 주입 가능한 인터페이스입니다. 실제 gh 실행 transport는 다음 배포 단계에서 붙입니다. PR reviews, PR close/merge, head SHA별 check-runs 수집도 확장 대상입니다. review comment는 최종 sender가 올바른 review-thread reply endpoint를 선택할 수 있도록 parent comment ID를 추가 보존해야 합니다.

## 쓰기 구현 순서

1. Engine이 messageId, Ticket, Thread, purpose, text를 Outbox에 먼저 기록합니다.
2. 같은 Ticket/Thread에서는 가장 오래된 pending만 전송합니다. 실패한 head의 due가 미래라면 뒤 메시지가 먼저 나가면 안 됩니다.
3. Sender가 자동화 계정 헤더와 안정적인 마커를 붙입니다.
4. 일시적 실패는 5초부터 300초까지 backoff합니다. 410 또는 실제로 locked임이 확인된 403은 permanent drop으로 분류합니다. 모든 403을 같은 뜻으로 보지 않습니다.
5. 성공 뒤 sent를 기록합니다. 전송 성공 후 이 기록 전에 죽는 구간은 여전히 존재합니다.

```sh
npm run stage -- 05
```

이 Outbox는 전송 시도와 순서를 영속화합니다. 실제 GitHub Sender·마커 조회가 없으므로 외부 댓글 중복 방지까지 검증했다고 말할 수 없습니다. 실제 Sender를 만들 때 응답 유실 실험을 추가하세요. read-before-write 마커 조회도 동시 writer 전체의 exactly-once 보장은 아닙니다.

다음: [06 Executor](06-executor.ko.md).
