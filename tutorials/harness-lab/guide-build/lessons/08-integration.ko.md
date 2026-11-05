# 08. 부팅·복구·종료를 하나의 실행 경로로 연결하기

Core와 개별 어댑터 테스트가 통과해도 실제 실행이 된다는 보장은 없습니다. 이번 단계에서는 로컬 Git, child process, sa HTTP, SQLite, 패널을 한 흐름으로 연결합니다.

## 부팅 순서

1. private state directory를 만들고 exclusive host.lock을 획득합니다. 같은 stateDir에 두 호스트가 실행되면 거절합니다.
2. 로컬 fixture 저장소를 최초 한 번 초기화합니다. 실제 배포에서는 확인된 repository clone으로 대체합니다.
3. Store → Engine → Tokens → Executor → HTTP 서버를 조립합니다. 서버가 실제 포트를 받은 뒤 Worker URL을 설정합니다.
4. interrupted turn을 recovery note와 함께 재예약합니다. 이전 turn의 inputs를 포함하고, worker에게 디렉터리·Git 기록·원격 상태를 확인하도록 요구합니다.
5. timer가 Executor pump와 Outbox flush를 수행합니다. 같은 flush가 끝나기 전에 새 flush를 시작하지 않습니다.
6. 종료 시 timer를 멈추고 Worker 취소·종료, 남은 flush, HTTP close, DB close, lock 해제 순서로 정리합니다.

```sh
npm run smoke
```

smoke는 별도 임시 stateDir와 OS 할당 포트를 사용하며 다음을 실제 관찰합니다.

- 새 요청 → worktree 생성 → 모의 Worker 실행 → sa ack/report → 로컬 Git 커밋.
- 후속 요청 → 같은 session/branch → 두 번째 커밋과 파일 내용 두 줄.
- 잘못된 token과 외부 Origin 거절.
- blocked 질문 → 사람 stop → 멘션 없는 후속 댓글로 기존 Ticket이 재개되지 않음.
- 정상 종료 후 재부팅 → Ticket 수와 sessionId 유지.

강제 SIGKILL 중인 호스트의 자식 프로세스까지 이 smoke가 검증하지는 않습니다. 강제 종료 후에는 이전 Worker가 실제로 멈췄는지 확인한 뒤 stale lock을 제거하고 복구해야 합니다. 실제 컨테이너·supervisor에서는 자식 트리 정리와 crash recovery를 별도로 시험하세요.

중요한 실패 실험은 전송 성공 뒤 receipt 기록 전 crash입니다. 로컬 Sender는 같은 ID의 기록을 덮어쓰지만, 실제 GitHub 댓글은 같은 방식으로 취급할 수 없습니다. 이를 live Sender의 별도 검증으로 남깁니다.

다음: [09 실제 연결](09-deployment.ko.md).
