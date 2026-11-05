# 원본을 어떻게 해석했는가

분석 대상은 Switch Dimension의 README 기반 구현·설정 가이드입니다. 클라우드에서 Git으로 복제한 후 tree를 확인했으며 파일은 README.md와 LICENSE 두 개였습니다. package.json, 앱 진입점, src, tests, Dockerfile은 포함되어 있지 않았습니다. 약 2,800줄이라는 수치는 README §2에 적힌 자체 구현 설명이며 이 저장소에서 셀 수 있는 앱 코드의 크기가 아닙니다.

## 이전 DSH 분석과 다른 점

|주제|DeepSeek 공개 프로토타입|이번 Switch Dimension 가이드|
|---|---|---|
|자료 형태|TypeScript 코드·테스트·문서|설계·CLI 계약·설정 절차를 담은 README|
|실행 기반|DSH bundle과 Cordis 세션|Node 24 호스트와 외부 코딩 CLI|
|작업 시작|explicit/inferred, assessment, policyVersion|allowlist·멘션·구독으로 결정하는 gate|
|Worker|DSH Session|Claude Code 또는 OpenCode|
|통신|DSH의 앱 도구·Outbox|shell에서 호출하는 sa → 인증된 호스트 HTTP|
|범위|정교한 정책·Source·운영 구현|한 저장소를 대상으로 작고 조용한 팀 작업 도구|

따라서 이전 교재의 Mandate·observe·Eval batching을 이번 구현의 필수 요소로 그대로 넣으면 목표가 달라집니다. 이번에는 원문 §10이 제외한 proactive rules, LLM coordinator, policyVersion, chat Source, worktree 자동 정리를 제외한 상태에서 시작합니다.

## 사용성이 생기는 설계 선택

1. 사용자에게 새 대화 앱을 강요하지 않고 Issue/PR 댓글에서 일을 받습니다.
2. 후속 댓글의 도착지와 세션을 Ticket에 고정해 문맥을 매번 설명하는 비용을 줄입니다.
3. ack는 한 번, progress는 내부 기록, 질문·결과·실패만 사람이 받게 합니다.
4. Worker 종류를 한 메서드로 감싸 교체 가능하게 하고 호스트는 업무 상태에 집중합니다.
5. 사람이 개입할 상태를 구조화해 패널 상단으로 올립니다. PR 생성과 검토 준비를 구분합니다.

여기서 Main LLM이 Worker를 세밀하게 지휘하는 것이 중심은 아닙니다. 결정적 호스트가 권한·라우팅·통신·수명을 관리하고 Worker에게 실제 문제 해결을 맡기는 구조입니다.

## 이 교재에서 구체화한 선택

|원문에서 충분히 정해지지 않은 부분|참조 구현의 선택|이유·영향|
|---|---|---|
|SQLite 상세 스키마|version 1의 JSON records 테이블|업무 연산을 먼저 학습; 대규모 조회·migration은 별도 확장|
|worker token의 수명|Ticket/turn에 묶어 발급, 완료·재시작 시 무효화|이전 turn의 늦은 호출을 거절; 원문보다 세분화|
|호스트 HTTP 경로|POST /api/worker 한 곳에 discriminated command|원문의 /api/worker/command별 경로를 축소; 권한 검증은 유지|
|ready 직전에 들어온 사람 입력|미소비 후속 입력이 있으면 종료를 미룸|정상 ready 보고가 새 요청을 잃지 않게 함|
|dropped와 공개 message의 관계|dropped는 항상 조용히 종료|§3의 silent 종료를 우선; §4의 result-purpose 설명과 해석 여지 명시|
|여러 PR의 종료 원인|모두 merged면 merged, 하나라도 closed면 closed|원문에 동률·순서 기준이 없어 결정적으로 정의|
|handback 권한|한 번만 반환, 신규 요청 gate를 다시 적용|범위 밖 메시지가 allowlist를 우회하지 않음|
|stop 문장 해석|stop/cancel/abort 단어와 멘션·작성자 조건|인용·부정문 의미 분석은 하지 않음; 실제 운영 전 문법을 더 엄격히 정할 수 있음|
|부팅 소유권|exclusive lock 파일; 정상 종료 시 제거|두 호스트 방지; 강제 종료 뒤 stale lock은 수동 확인 필요|

## 과장하면 안 되는 주장

원문 §3의 “store first라서 crash가 유실·중복을 만들지 않는다”는 목표를 분산 exactly-once 보장으로 받아들이지 않습니다. 전송 성공 후 DB 기록 전 장애가 나면 재전송할 수 있습니다. 참조 Outbox는 안정적인 ID와 마커를 만들지만 실제 GitHub Sender와 마커 조회는 확장 대상입니다.

“Authorization is code”는 누가 일을 시작·중단하고 어떤 host 요청을 할 수 있는지에 적용됩니다. Worker가 이미 가진 shell·토큰으로 직접 행동하는 범위까지 프롬프트나 sa API가 강제하는 것은 아닙니다. 같은 컨테이너의 worktree 분리도 다른 Worker의 파일 접근을 막지 않습니다.

README의 계정·토큰 종류·도구 버전 관련 설명은 작성 당시의 안내입니다. 이번에는 실제 GitHub 계정 정책과 최신 CLI flag를 별도 검증하지 않았습니다. live 배포 시 현재 문서·계정 권한·CLI help로 확인해야 합니다. 원문의 대화 절차는 운영자와 실제 설정할 때의 안내이며, 이 분석 작업을 중단하고 질문부터 하라는 지시로 적용하지 않았습니다.
