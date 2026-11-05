# 04. Claude Code와 OpenCode의 차이 감추기

원문 §5의 공통 인터페이스는 `run(turn) → { ok, sessionId, text, error, transient, costUsd }`입니다. 호스트는 CLI별 출력 형식을 알지 않고 이 결과만 받습니다. 실제 업무 완료는 text에서 추측하지 않고 sa report로 판정합니다.

## Claude Code

첫 turn의 UUID를 host에서 고르고 저장합니다. 메시지는 stdin으로 보내고, 매 turn마다 append-system-prompt를 전달합니다. 첫 실행에는 session-id, 이후에는 resume을 사용하며 cwd는 같은 Ticket 디렉터리입니다. `No conversation found`와 `already in use`에 대한 fallback은 해당 오류에만 한 번 적용합니다.

`parseClaude`는 result/session_id/is_error/api_error_status/total_cost_usd를 검사합니다. 프로세스 exit 0만으로 성공을 판단하지 않습니다. 잘못된 JSON은 파싱 실패이며 성공 텍스트로 포장하지 않습니다.

## OpenCode

첫 turn은 session flag 없이 시작하고 JSONL의 sessionID를 저장합니다. 실제 sessionID를 받은 뒤에만 이후 turn에 session을 지정합니다. 첫 실행이 sessionID를 돌려주기 전에 실패했다면 turn 번호가 증가해도 임의 UUID로 resume하지 않습니다. text 이벤트의 마지막 part.text와 error 이벤트를 처리합니다. system-instructions flag가 없다는 원문 전제에 따라 첫 메시지에 instructions를 넣고 후속 turn에 reminder를 넣습니다.

원문 명령의 메시지는 argv에 들어갑니다. 큰 입력의 ARG_MAX 문제는 그대로 남으므로 실제 v2 CLI가 지원하는 stdin/file 입력을 현재 help에서 확인하고, 지원하지 않으면 입력 크기를 제한하는 설계를 추가해야 합니다.

## 프로세스 소유권

`runProcess`는 shell 문자열을 조립하지 않고 executable+argv로 실행합니다. timeout/cancel 시 소유 프로세스 그룹을 종료하고 close까지 기다립니다. 출력 크기도 제한합니다. 현재 구현의 process-group 정리는 POSIX 중심이며 Windows의 자식 트리 정리는 별도 어댑터가 필요합니다.

```sh
npm run stage -- 04
```

실패 실험: 프로세스가 성공 코드로 끝나도 is_error=true면 실패여야 합니다. JSONL의 첫 text만 읽으면 최종 결과를 놓칩니다. sessionID가 없는 출력을 성공으로 저장하면 다음 turn을 이어갈 수 없습니다.

두 CLI는 이번 환경에 설치되지 않았습니다. flag와 출력 형식은 원문이 검증했다고 적은 Claude Code 2.1.316/OpenCode 2.0.30 기준의 명세 구현입니다. 현재 설치 버전의 실제 headless 동작·인증·비용은 검증하지 않았습니다.

다음: [05 Source와 Outbox](05-sources.ko.md).
