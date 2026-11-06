# 03. sa를 작은 Worker 프로토콜로 만들기

원문 §4에서 Worker가 호스트에 할 수 있는 요청은 show, ack, reply, report, handback입니다. 별도의 특정 모델 SDK 도구 대신 shell 명령을 쓰므로 다양한 코딩 CLI가 같은 호스트에 연결할 수 있습니다.

## 작성 순서

1. `WorkerCommand`를 discriminated union으로 정의하고 unknown command/field/status를 거절합니다. CLI와 서버가 같은 스키마를 사용합니다.
2. `sa.ts`에서 argv를 JSON으로 바꿉니다. stdout에는 응답만, 실패 시 stderr에 `refused: reason`을 쓰고 exit 1로 끝냅니다. 거절은 일시적인 provider 오류로 재시도하지 않습니다.
3. `bin/sa` launcher를 만들고 Executor가 worker PATH에 넣습니다. URL/token 등은 환경변수로 전달하고 출력하지 않습니다.
4. token은 충분한 난수로 만들고 host에서는 hash로 조회합니다. 이 교재에서는 Ticket/turn에 묶고 실행 종료 시 폐기합니다.
5. host는 token으로 Ticket을 결정합니다. worker JSON의 임의 ticketId를 믿지 않습니다. ended 상태와 stale turn도 거절합니다.
6. ack 중복 키는 Ticket+Trigger입니다. reply 대상은 해당 Ticket에 실제 도달한 Trigger여야 합니다. 120-word 상한은 host에서 검사합니다.
7. progress는 message/question을 금지합니다. blocked에 question만 있으면 attention 메시지를 예약합니다. handback은 한 번만 허용하고 신규 gate를 다시 거칩니다.

```sh
npm run stage -- 03
```

Outbox 예약과 report 상태 변경은 같은 트랜잭션에 둡니다. 잘못된 reply target 때문에 메시지 예약이 실패하면 PR 구독이나 ready 상태도 함께 롤백되어야 합니다.

이 검증은 sa를 거친 요청을 통제합니다. Worker가 가진 GitHub 토큰으로 직접 API를 부르는 것까지 막는 sandbox는 아닙니다. 실제 배포에서는 계정 권한·파일·네트워크 접근 범위를 별도로 제한합니다.

인증 저장소는 src/tokens.ts에 독립되어 Executor 없이 학습할 수 있습니다. ack는 Trigger별 한 번이며, reply/report는 같은 turn·대상·종류·본문의 재전송을 합치고 다른 본문은 별도 메시지로 기록합니다. handback된 입력은 원래 Worker의 다음 batch와 복구에서 제외하며 다른 구독자에게 중복 전달하지 않습니다.

다음: [04 Worker 어댑터](04-workers.ko.md).
