# 04. 후속 입력의 소유자를 정하기

새로운 댓글이 왔다고 매번 Main이 새 업무를 만들게 하면 같은 작업이 반복되고 불필요한 모델 호출이 늘어납니다. 이미 진행 중인 Ticket이 판단해야 하는 사람의 후속 입력을 먼저 찾아냅니다.

## 두 종류의 연결

소유 Subscription은 해당 업무의 후속 입력을 받는 연결이고, context-only Subscription은 참고 문맥을 받는 연결입니다. Correlation은 관련 Thread를 탐색하는 연결일 뿐 라우팅 권한이 아닙니다. 이 축소 구현은 Correlation 저장을 생략하며, 이를 암묵적 Subscription으로 대체하지 않습니다.

## 작성 순서

1. `Subscription`을 `(ticketId, thread)`로 저장하고 `context`를 둡니다. 같은 연결이 소유 관계로 승격되면 context-only로 다시 약화시키지 않습니다.
2. Intake에서 중복과 repository scope를 확인한 뒤, Trigger의 모든 Thread를 순회해 Ticket별 reached Map을 만듭니다.
3. 같은 Ticket에 여러 경로로 도착하면 입력을 한 번만 추가합니다. 하나라도 소유 경로라면 context=false가 되어야 합니다.
4. 살아 있는 Ticket에는 구독 문맥을 전달합니다. 수신자가 allowlist 밖이라는 이유만으로 문맥을 모두 버리지 않습니다. 문맥 수신이 새 업무 승인인 것은 아닙니다.
5. 사람의 소유 후속 입력을 기존 Worker가 판단하면 새 Eval을 만들지 않습니다. 나머지는 Policy.gate를 거칩니다. 실습에서는 bot gate가 거절하므로 bot의 새 Eval을 만들지 않습니다. 원본은 설정된 bot 후보를 별도로 평가할 수 있습니다.

```sh
npm run stage -- 04
```

실패 실험: reached Map 대신 Thread마다 직접 전달하면 다중 Thread 테스트에서 입력이 두 개가 됩니다. 또 context-only 사람 입력에 소유권을 주면 별도 Eval이 사라집니다. 두 오류를 각각 확인한 뒤 원복하세요.

원본 대응: [core/intake.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/core/intake.ts), `core/part.ts`의 소유자 판정, `tests/followups.spec.ts`, `tests/core-engine.spec.ts`. 다음은 [05 Effects](05-effects.ko.md)입니다.
