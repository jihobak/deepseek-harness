# 08. 사람이 판단하기 쉬운 화면 만들기

사용성을 높이는 설계는 내부 객체를 모두 노출하는 데서 나오지 않습니다. 사람이 지금 알아야 할 것은 승인 범위, 현재 실행 상태, 검토가 필요한지, 실패가 있는지입니다. 상세 기록은 그 다음에 조회할 수 있게 둡니다.

## 작성 순서

1. `overview`가 Ticket과 Assignment를 읽어 화면용 상태를 반환하도록 합니다. “검토가 필요하다”는 신호를 보고문 자연어에서 추측하지 않고 구조적 상태에서 계산합니다.
2. `readScope`는 worker가 자기 Ticket만 읽게 합니다. viewerTicketId는 인증된 어댑터가 공급해야 하며, 모델이 임의로 제출한 viewer ID를 신뢰하면 안 됩니다.
3. 본문은 offset/limit으로 읽습니다. JavaScript 문자열은 UTF-16 code unit 기준이므로 surrogate pair를 가르는 페이지라도 이어 붙였을 때 원문이 복원되는지 검사합니다.
4. `page`는 모델·외부 입력에서 유래한 문자열을 HTML escaping합니다. 내부 JSON API와 HTML 렌더링을 분리합니다.
5. `server.ts`는 loopback 읽기 전용 GET만 허용합니다. 상태 변경은 이 예제의 HTTP API로 제공하지 않습니다. 실제 stop/retry/settings UI는 인증·권한 검증과 Engine command를 붙인 후 추가합니다.

```sh
npm run stage -- 08
npm run demo
npm run smoke
npm start
```

브라우저에서 작업 하나가 open/waiting/결과 검토로 보이는지 확인합니다. `/api/tickets`에는 같은 구조적 상태가 나옵니다. 이 패널은 단순한 실습 UI이며 원본의 카드·설정·배포·prompt 편집·감사 화면 전체를 재현하지 않습니다.

추가 과제: failed effect의 종류와 key를 눌러 해당 Ticket 상세로 이동하게 만드세요. 무조건 재시도 버튼부터 추가하지 말고, 현재 Assignment의 retry 가능 여부를 Engine에서 계산하는 연산을 먼저 구현하세요. 버튼은 그 연산의 결과를 표시해야 합니다.

원본 대응: [docs/005-panel.md](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/005-panel.md), `src/app/cards.ts`, `src/app/resources.ts`, `src/app/views/`, `src/client/`, `tests/panel-overview.spec.tsx`. 다음은 [09 DSH 연결](09-dsh.ko.md)입니다.
