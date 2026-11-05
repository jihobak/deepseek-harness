# 09. 실제 코딩 CLI와 GitHub를 연결하는 구현 순서

이 장은 로컬 참조 구현에 없는 배포 기능을 구현하는 명세입니다. 완료된 Docker 배포나 실제 계정 설정을 주장하지 않습니다. 원문 §5–8을 기준으로, 외부 I/O를 하나씩 추가합니다.

## 1. Config와 doctor

원문의 stateDir/sources.github/worker/workspace/messages/panel 구성을 zod schema로 정의합니다. repo, agentLogin, allow, adapter, maxConcurrent, base branch, poll interval을 읽고 경로·범위를 검증합니다. 현재 app.ts의 고정 fixture 설정을 이 값으로 교체하되, 기본값이 사용자의 실제 저장소로 자동 실행되지 않게 합니다.

doctor는 다음을 조회하고 하나라도 맞지 않으면 시작 전에 거절해야 합니다. 비밀값은 출력하지 않습니다.

|검사|관찰 값|실패 시 처리|
|---|---|---|
|agent CLI|버전과 run/help의 필요한 flags|설치·버전 불일치로 거절|
|headless 한 turn|파싱 가능한 결과와 sessionId|실제 Worker 시작 금지|
|gh identity|현재 로그인과 설정한 bot login의 일치|개인 계정 token이면 거절|
|repository 권한|대상 repo와 push 권한|다른 repo 또는 읽기 전용이면 거절|
|Git clone|origin URL, default branch, 작업 디렉터리|명시적 clone/fetch 또는 설정 수정|
|worker 실행 사용자|non-root, 영속 HOME|Claude 무인 실행 조건 확인|

원문의 PAT 종류·scope 설명은 당시 안내입니다. 현재 GitHub 문서와 실제 repository 권한으로 필요한 최소 권한을 판단하세요. 앱이 접근할 수 있는 저장소 전체를 확인하는 것은 token 문자열을 확인하는 것과 다릅니다.

## 2. Worker 교체

Executor의 `new MockWorker()`를 Config가 선택한 `new CliWorker('claude-code')` 또는 `new CliWorker('opencode')`로 바꿉니다. 현재 구현은 실행 계획과 parser만 mock 데이터로 확인한 상태입니다. 실제 CLI를 설치해 첫 turn → resume → known session 오류 fallback → 취소를 순서대로 검증합니다.

기존 `process.env` 전체 전달은 교육용 호스트의 편의입니다. 실제 배포에서는 provider key, GitHub bot 자격 증명, proxy/CA, HOME, PATH 등 필요한 환경만 Worker에 전달하는 명시적 정책을 구현하세요. host bearer token은 turn마다 전달하지만 prompt 본문이나 로그에는 넣지 않습니다.

## 3. GitHub Reader

`Reader.read(endpoint,since)`에 `gh api --paginate --slurp` 호출을 넣습니다. argv 배열로 전달하고 shell 문자열을 조립하지 않습니다. 응답은 기존 normalizePages에 넣습니다. 먼저 공개 저장소에서 읽기 전용으로 검증하고 malformed JSON, 404, pagination을 재현합니다.

기본 세 endpoint 뒤에 PR reviews, PR 상태, head SHA별 check-runs를 추가합니다. 닫힌 PR은 `Engine.closePR`에 전달하고, check result는 bot+ci pass/fail Trigger로 변환합니다. CI Trigger ID에는 head SHA와 outcome을 포함해야 새 commit의 같은 결과가 이전 사건과 충돌하지 않습니다. review comment에는 실제 reply endpoint에 필요한 parent comment ID를 보존합니다.

## 4. GitHub Sender

Sender.send는 일반 Issue/PR conversation과 review-thread reply를 구분합니다. 모든 메시지에 자동화 계정 헤더를 붙이고, 실제 410 및 locked 403만 permanent drop으로 분류합니다. retry 전에 안정적인 message marker를 조회하는 방식을 구현하고 응답 유실을 시험합니다. 마커 조회·POST 사이 경쟁은 별도로 남으므로 exactly-once를 약속하지 않습니다.

## 5. 컨테이너와 supervision

원문은 host와 workers를 한 컨테이너에 넣는 구성을 제안합니다. 다음 순서로 Dockerfile/Compose를 작성하고 각 단계의 실제 동작을 확인하세요.

1. Node 24 이미지에 git, gh, 고정 버전 agent CLI와 앱을 설치합니다.
2. non-root node 사용자와 persistent state/repo/HOME 디렉터리를 준비합니다.
3. config와 prompts를 read-only mount하고, 필요한 secret만 별도 gitignored env 파일로 공급합니다.
4. init 프로세스, no-new-privileges, capability 제거, 메모리·PID 제한, restart 정책을 설정합니다.
5. 컨테이너 내부 HTTP listen은 외부 포트 연결에 맞게 구성하되, 호스트 publish는 127.0.0.1로 제한합니다. Worker URL은 컨테이너 내부 loopback입니다.
6. 현재 데모의 host.lock을 production lock 또는 명시적인 stale-lock 복구 정책으로 교체하고, container kill/restart 중 old Worker가 사라지는지 검증합니다.

현재 앱은 listen을 loopback으로 고정합니다. 컨테이너 외부로 포트를 연결하려면 bind host를 검증된 Config로 분리해야 합니다. 이 변경과 실제 Docker build/run은 이번 교재의 검증 범위에 포함하지 않습니다.

다음: [10 완료 기준](10-acceptance.ko.md).
