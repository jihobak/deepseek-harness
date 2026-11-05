# 07. 사람의 주의를 덜 쓰는 패널

원문 §3의 패널은 내부 로그를 모두 보여 주는 콘솔보다 “누가 무엇을 결정해야 하는가”를 드러내는 화면입니다. awaiting-answer, blocked, failed, awaiting-review를 먼저 배치합니다.

## 작성 순서

1. 도메인 상태에서 stage를 계산하는 순수 함수를 만듭니다. 문자열 report 본문에서 ready나 failure를 추측하지 않습니다.
2. HTTP GET /api/state에 worker token을 포함하지 않는 읽기 모델을 제공합니다. 이 실습의 token은 애초에 Ticket DB에 원문으로 저장되지 않습니다.
3. 로컬 요청 입력은 호스트가 정한 operator identity를 사용합니다. 사용자가 actor=관리자 값을 넣어 권한을 얻는 API를 만들지 않습니다.
4. 신규 로컬 요청은 explicit로 취급합니다. 기존 작업의 후속 입력은 멘션 없이 전달하고 stop에는 agent 멘션이 필요합니다.
5. POST는 JSON만 받고 외부 Origin을 거절합니다. Worker API는 별도의 bearer token 검증을 거칩니다. loopback 패널의 무로그인 특성은 유지합니다.
6. 화면 문자열은 textContent로 넣습니다. 외부 입력을 innerHTML로 조립하지 않습니다.

```sh
npm start
```

새 요청을 넣고 완료 결과를 확인한 뒤 같은 작업을 선택해 후속 요청을 보내 보세요. 모의 Worker는 수정 파일의 diff 내용까지 이해하는 모델이 아니라 입력을 기록·커밋하는 스크립트입니다. 따라서 성공은 호스트의 전체 흐름을 검증한 것이며 코드 생성 능력 검증은 아닙니다.

`fixture:block` 요청은 질문을 보여 주고, `@lab-bot stop`은 기존 Ticket을 영구 중단합니다. 실제 사람의 입력 흐름에서 이 상태들이 잘 구분되는지 확인하세요. 원문이 요구한 PR 링크, 비용 표시, 상세 turn 이력, retry 제어는 현재 간단한 화면을 확장할 항목입니다.

다음: [08 통합과 복구](08-integration.ko.md).
