# 10. 원문의 결과물에 도달했는지 판정하기

“앱이 시작됨”, “모델이 답함”, “PR이 열림”은 서로 다른 중간 결과입니다. README가 제안한 사용자 경험을 달성하려면 다음 증거를 각각 확보해야 합니다.

## 단계 A: 로컬 기반

`npm run check`와 각 stage command가 개별 사례를 실행하는지 확인합니다. 테스트 파일 이름만 통과한 것으로 만족하지 말고 gate·상태·권한·parser·cursor·Outbox·슬롯 검증의 이름과 수를 확인합니다. `npm run smoke`로 실제 worktree·Git 커밋·sa HTTP·재시작을 검증합니다. 이 단계는 제공된 참조 구현에서 완료했습니다.

## 단계 B: 실제 어댑터

- Claude/OpenCode 중 선택한 CLI의 version/help를 기록합니다.
- 같은 cwd에서 첫 turn과 resume을 수행하고 sessionId가 이어지는지 확인합니다.
- host의 token을 바꾸거나 잘못된 Ticket의 Trigger를 지정해 sa 거절과 exit 1을 확인합니다.
- timeout·stop 때 child process와 하위 작업이 종료되고 슬롯이 회수되는지 확인합니다.
- GitHub polling은 읽기 전용으로 먼저 검증합니다. endpoint 하나의 실패가 다른 cursor를 멈추지 않는지 확인합니다.

이 단계는 CLI와 실제 계정 접근이 필요하며 이번 작업에서는 실행하지 않았습니다.

## 단계 C: 격리된 GitHub sandbox

|순서|입력|기대하는 관찰|
|---|---|---|
|1|허용된 사람의 @bot 작은 수정 요청|한 Ticket·worktree·session, ack 한 번|
|2|Worker의 실제 구현·검증|bot branch와 PR, relevant checks 통과|
|3|ready report|자동화 헤더가 있는 결과 댓글과 awaiting-review|
|4|사람이 PR merge|다음 poll에서 merged 종료|
|5|PR의 멘션 없는 사람 후속 댓글|같은 Ticket/session/worktree 재개|
|6|live Ticket에 @bot stop|human 종료, child 정리, 늦은 report 거절|
|7|이후 일반 후속 댓글|기존 Ticket이 자동 재개되지 않음|
|8|bot/CI feedback|blocked/failed를 깨우지 않음; pass는 context만|
|9|전송 성공 직후 응답 유실|같은 message ID로 retry; 실제 중복 여부 기록|
|10|실행 중 container 재시작|old Worker 정리, interrupted inputs 포함 recovery note|

검토·merge는 사람이 수행하는 기본 정책을 유지합니다. 이 시나리오를 수행할 때만 실제 외부 메시지와 PR이 생성되므로, 교재의 로컬 테스트 결과를 그 증거로 대신하지 않습니다.

## 결과 보고 양식

사용한 원문 revision, CLI·Node 버전, 구현한 요구사항, 실행한 명령, 실제 관찰, 실패·미검증 항목을 기록합니다. 원문 저자의 약 30초·10센트 사례를 자신의 성능 수치로 인용하지 않습니다. 조건이 다른 모델·repo·CI에서는 별도로 측정해야 합니다.

[REQUIREMENTS.ko.md](../REQUIREMENTS.ko.md)의 남은 열을 비워도 되는 시점은 해당 live 증거가 있을 때입니다. proactive rule 평가나 chat Source를 추가하려면 현재 목표를 완료한 뒤 별도의 확장 과제로 다루세요.
