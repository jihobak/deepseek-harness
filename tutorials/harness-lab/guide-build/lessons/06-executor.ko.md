# 06. worktree·session·슬롯을 Ticket에 연결하기

원문 §3과 §7의 핵심 단위는 Ticket 하나당 worktree 하나, branch 하나, session 하나입니다. turn은 늘어나도 이 세 값은 유지합니다. 서로 다른 Ticket이 같은 작업 디렉터리를 사용하지 않게 합니다.

## 작성 순서

1. Ticket 생성 시 UUID, branch 이름, 디렉터리 경로, 초기 sessionId를 저장합니다. 사용자 본문을 경로로 직접 사용하지 않습니다.
2. 첫 실행에 `git worktree add -b`를 수행합니다. 이후에는 디렉터리의 실제 Git toplevel과 현재 branch가 기록과 일치하는지 검사합니다. 존재한다는 사실만으로 준비 완료로 보지 않습니다.
3. 일반 슬롯 N개에 더해 기존 Ticket의 사람 후속 입력에만 한 슬롯을 예약합니다. 신규 Ticket이 예약 슬롯을 소비하지 않아야 합니다.
4. Ticket당 한 turn만 실행합니다. 실행 중 새 입력은 다음 batch로 남깁니다.
5. start 전 batch·running 상태를 저장하고, 종료 후 결과·sessionId를 기록합니다. report가 없으면 성공 text가 있어도 failed로 처리합니다.
6. 일시적 오류는 최초 실행 뒤 최대 세 번 retry합니다. 이 교재는 1/2/4초 backoff를 사용하며 입력 batch를 복구하고 기존 외부 작업을 점검하라는 note를 추가합니다.
7. 사람 stop을 발견하면 AbortController로 실행을 취소하고 프로세스 종료까지 기다립니다. 오래된 worker token과 turn report는 거절합니다.

```sh
npm run stage -- 06
```

슬롯 테스트는 sleep 대신 barrier로 실행을 고정합니다. 첫 작업이 슬롯을 잡고 있는 동안 새로운 작업과 기존 작업의 사람 후속 입력을 함께 넣어, 예약 슬롯에 누가 들어가는지 검증합니다. worktree 테스트는 임시 Git 저장소에서 실제 branch를 만들고 재사용과 잘못된 branch 거부를 확인합니다.

참조 앱의 기준 branch는 로컬 sandbox의 HEAD입니다. 실제 GitHub 배포에서는 fetch한 origin/default branch를 확인해 사용해야 합니다. worktree 자동 정리는 원문에서도 제외되어 있으며 이 앱도 수행하지 않습니다.

다음: [07 패널](07-panel.ko.md).
