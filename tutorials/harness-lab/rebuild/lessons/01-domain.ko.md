# 01. 사용자의 일에서 사건과 업무 모델을 도출하기

목표는 GitHub 댓글을 받아도 곧바로 Worker를 시작하지 않는 기반을 만드는 것입니다. 먼저 “어떤 일이 완료되었다고 말할 것인가?”를 정하세요. PR 준비, 사람의 승인, PR merge는 서로 다른 사건입니다.

## 구현 전에 답할 질문

- 같은 댓글을 두 번 받았을 때 무엇으로 중복을 판별할 것인가?
- 한 댓글이 Issue와 PR 양쪽 문맥에 속하면 작업도 두 개가 되어야 하는가?
- 세션이 재시작해도 같은 업무를 식별할 수 있어야 하는가?

답을 `model.ts`의 타입에 반영합니다. Trigger는 불변 외부 사건, Thread는 대화 주소, Mandate는 승인 범위, Ticket은 지속 업무, Assignment는 실행 시도입니다. Mandate는 Ticket 안에 보존하며, 철회 여부는 별도 상태로 둡니다. 코멘트 본문에 “관리자 승인”이라고 쓰였다는 이유로 actor를 변경하지 않습니다.

## 작성 순서

1. `Trigger`의 id/source/repository/actor/human/addressed/threads/text를 정의합니다. 나중에 source가 늘어도 provider별 identity를 섞지 않도록 합니다.
2. `source.ts`의 `normalize(value: unknown): Trigger`를 작성합니다. 문자열 필드와 boolean을 검사한 뒤 타입을 좁힙니다.
3. 사건 ID에 source·repository·외부 ID를 모두 포함합니다. 단순 `repository + ':' + id`는 구분자가 포함된 값에서 충돌할 수 있으므로 배열의 JSON 표현처럼 모호하지 않은 인코딩을 사용합니다.
4. Thread 주소에도 repository를 포함합니다. 같은 번호의 Issue가 다른 저장소에서 충돌하면 안 됩니다.
5. 나머지 도메인 타입은 참조 `src/model.ts`와 대조해 정의하되, 동작은 다음 단계에서 구현합니다.

이 실습의 normalize 입력은 축소한 fixture envelope입니다. 실제 GitHub webhook의 JSON 구조라고 오해하지 마세요. 실제 어댑터에서는 provider가 확인한 작성자·bot 여부·대상을 사용해야 합니다.

```sh
npm run stage -- 01
```

동일 입력의 ID 안정성, 저장소별 구분, 누락된 Thread와 잘못된 boolean 거부, 본문으로 actor를 바꿀 수 없음을 확인합니다. 실패 실험으로 repository를 ID에서 빼고 다른 저장소 사건이 충돌하는지 보세요. 원복 후 다시 통과해야 합니다.

원본 대응: [core/model.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/core/model.ts), [001 Domain](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/001-domain.md), `src/sources/github.ts`. 완료되면 [02 권한 판단](02-policy.ko.md)으로 진행합니다.
