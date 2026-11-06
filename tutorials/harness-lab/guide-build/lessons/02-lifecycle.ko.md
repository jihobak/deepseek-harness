# 02. Ticket, turn, report의 수명

원문은 Ticket마다 지속 세션과 worktree를 유지합니다. 세션과 별개로 turn 번호를 두면 이전 실행의 늦은 report를 거절할 수 있습니다. 이 번호는 교재가 구체화한 선택이며 원문에서 Assignment 객체를 별도로 요구하지는 않습니다.

## 구현할 상태

|조건|표시 상태|
|---|---|
|ended 사유 존재|ended|
|turn 실행 중|working|
|실행 예약 존재|queued|
|blocked + question|awaiting-answer|
|blocked / failed|blocked / failed|
|ready, 아직 open PR 존재|awaiting-review|
|그 외|idle|

순서가 중요합니다. Worker가 실행 중인데 이전 ready report만 보고 검토 대기로 표시하면 잘못된 조작을 유도합니다.

## 작성 순서

1. `begin`은 현재 pending inputs를 batch로 저장하고 consumed로 표시하며 turn을 증가시킵니다. 외부 실행은 트랜잭션 밖에서 합니다.
2. `report`는 현재 turn만 받습니다. `progress --pr N`은 구독을 추가할 뿐 ready를 의미하지 않습니다.
3. dropped는 조용히 종료하고, ready에 PR이 없으면 완료 처리합니다. 여러 PR이 있으면 모두 닫혔을 때 종료합니다.
4. 사람 후속 입력은 ended Ticket을 재개할 수 있지만, human stop은 제외하고 원래 requester가 현재 allowlist에 있는지 재검증합니다.
5. CI pass는 context만 추가하고 wake하지 않습니다. CI fail도 blocked/failed를 깨우면 안 됩니다. 사람의 입력은 깨울 수 있습니다.
6. ready 보고 직전에 도착한 미소비 사람 입력은 잃지 않도록 종료를 미룹니다. 이 경쟁 조건은 교재에서 명시적으로 추가했습니다.

```sh
npm run stage -- 02
```

검증 질문: PR을 만들었다는 사실과 검토할 준비가 됐다는 사실을 어떤 필드로 구분합니까? 새 댓글로 재개했을 때 Session ID와 branch가 바뀌지 않습니까? stop 뒤 새로 명시적으로 요청한 별도 Ticket과 기존 Ticket의 자동 재개를 구분합니까?

PR의 같은 종료 상태를 반복 수집하는 것은 새 종료 사건이 아닙니다. 재개한 turn의 progress/waiting/blocked는 과거 PR 때문에 종료되지 않으며 ready 보고에서 완료 조건을 다시 판단합니다. 실행 중 도착한 PR 종료도 현재 turn을 즉시 끝내지 않습니다.

다음: [03 sa와 호스트](03-host-contract.ko.md).
