# 원문 요구사항과 구현 증거

원문 위치는 대상 저장소 README의 절 번호입니다. “구현”은 이 교재에서 작성한 코드를 뜻하며, 저자의 비공개 또는 별도 앱과 동일하다는 뜻이 아닙니다.

|요구사항|원문|이 교재의 구현·검증|실제 운영까지 남은 항목|
|---|---|---|---|
|결정적 gate 순서|§3|Engine.receive/route, stage 01|stop 인용·부정문 문법 선택|
|하나의 Ticket/worktree/session|§3–5|workspace.prepare, Executor, 실제 Git smoke|실제 CLI의 세션 파일과 HOME 영속성|
|구독 후속 입력·재개|§3|stage 01/02, 같은 branch/session 두 커밋 smoke|GitHub PR·review 원본 맥락 연결|
|CI wake·blocked/failed 보류|§3|stage 02|실제 check-runs 수집·head SHA 매핑|
|상태 우선순위·PR 종료|§3|stage 함수, closePR, stage 02|PR polling에서 closePR 호출|
|N 슬롯+사람 후속 예약 슬롯|§3|Executor.pump, barrier 기반 stage 06|부하·비용·provider 동시성 운영 검증|
|한 번의 ack, 조용한 progress, 길이 제한|§3–4|Engine.command, stage 03|언어별 word-count 정책 고도화|
|sa API 인증과 대상 검증|§4|bin/sa, Tokens, HTTP, stage 03/smoke|배포 환경에서 worker별 token 전달·로그 redaction|
|Claude 첫 turn/resume, JSON 파싱|§5|plan, CliWorker, parseClaude, stage 04|실제 CLI 버전·headless 인증·fallback 실행 확인|
|OpenCode v2 JSONL/session|§5|plan, parseOpenCode, stage 04|실제 v2 설치와 flag·긴 argv 한계 확인|
|독립 endpoint cursor, overlap|§6|poll, normalizePages, stage 05|gh Reader transport, 장애 백오프, 주기 스케줄|
|issues/comments/review comments|§6|세 endpoint 정규화|review reply target metadata 보존·실제 조회|
|PR reviews, merge/close, CI|§6|Engine의 수용 연산과 wake 규칙|세 추가 수집 경로를 구현해야 함|
|Outbox 순서·retry·permanent drop|§3/6|flush, DeliveryError, stage 05|실제 GitHub Sender·410/locked 오류 분류·마커 조회|
|재시작 recovery note|§3|recover와 interrupted batch 복구, stage 02|실제 provider side-effect 점검·강제 종료 실험|
|로컬 패널·입력|§3/8|http.ts/app.ts, smoke|GitHub link·비용·개별 retry 등 UI 확장|
|실제 코드 수정·커밋|§8|모의 프로세스가 실제 worktree에 커밋|실제 모델의 수정 품질, remote push/PR/CI|
|전용 bot identity·doctor|§7–8|배포 장의 구현 명세|실제 계정·권한 probe와 거절 테스트|
|컨테이너·영속 HOME·설정|§7|배포 장의 조립 순서|Dockerfile/Compose 작성·실행 검증|
|실제 ready PR→merge→후속→stop|§8|로컬 대응 시나리오만 검증|격리된 GitHub sandbox에서 live 수용 검증|

원문 §10이 제외한 proactive rules, LLM coordinator, policyVersion, Feishu/Slack, worktree 자동 정리는 이번 과정의 필수 완료 범위에도 포함하지 않습니다. 이를 추가하려면 요구사항을 별도 변경하고 이전 DSH 교재를 확장 참고자료로 사용하세요.
