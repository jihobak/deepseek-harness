# 02. 모델의 제안과 실행 권한 분리하기

목표는 모델이 accept라고 말하더라도 host가 실행하지 않을 수 있는 구조입니다. 원본의 admission 표를 모두 구현하기 전에, 하나의 저장소와 하나의 Source allowlist로 시작합니다.

## 결정해야 할 규칙

허용된 사람이 직접 요청하면 explicit, 허용된 사람의 비직접 요청은 mode가 off가 아닐 때 inferred 후보로 둡니다. 이 실습은 bot과 미등록 작성자의 새 업무를 거절합니다. 원본은 Source별 admission 표와 bot 목록으로 더 세밀하게 설정할 수 있습니다.

inferred 판단은 활성 rule 각각을 정확히 한 번 포함해야 합니다. 하나 이상 matched여야 하며, 목표가 확정되어야 하고 scope와 요청 의도 근거가 있어야 합니다. observe에서는 would_accept를 기록하고 Worker를 시작하지 않습니다. explicit 경로와 inferred의 의미 규칙 평가를 무조건 동일하게 만들지 않습니다.

## 작성 순서

1. `Policy.gate(trigger)`에서 repository·actor·human·addressed·mode를 읽어 strength 또는 거절을 반환합니다. 본문으로 권한을 판정하지 않습니다.
2. `Policy.assess(strength, assessment)`에서 평가 배열의 길이와 ID 집합을 함께 검사합니다. 집합만 검사하면 중복 항목이 숨어들 수 있습니다.
3. `Policy.version`을 결정적으로 만듭니다. 실습 Settings는 권한 필드만 있으므로 전체 JSON hash를 사용합니다. 원본에서는 모델·동시 실행 수 등 권한과 무관한 설정을 version에 넣지 않습니다.
4. `revalidate(mandate)`에서 원래 요청자와 저장소, inferred의 auto 모드와 matched rule 유지 여부를 확인합니다. 재개 시 단순히 “과거에 승인됐음”만 확인하지 않습니다.

```sh
npm run stage -- 02
```

실패 실험: 중복 rule ID 두 개가 하나의 matched rule인 것처럼 통과하도록 검증을 약화시키면 테스트가 실패해야 합니다. 추가 과제로 모델 설정을 Settings에 넣되 policyVersion은 변하지 않게 분리하세요.

원본 대응: [policy.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/policy.ts), [002 Authorization](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/002-authorization.md), `tests/policy.spec.ts`, `tests/assessment.spec.ts`. 다음은 [03 승인과 작업](03-admission.ko.md)입니다.
