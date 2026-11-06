# 05. Outbox 순서와 재전송

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create guide-build 05 --dest /tmp/guide-build-05
cd /tmp/guide-build-05
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 05
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: guide-build-05-1

파일: `src/outbox.ts`. 재시도 시각 전에는 같은 대화의 선두 메시지를 보내지 않도록 채우세요.

힌트: 그룹은 이미 seen에 들어갔습니다. 뒤 메시지가 추월하면 안 됩니다.

## 빈칸 2: guide-build-05-2

파일: `src/outbox.ts`. 복구 불가능한 전송 거절을 종료 상태로 기록하세요.

힌트: DeliveryError의 permanent 필드를 확인합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/guide-build-05.ko.md) · [실습 사용법](../INDEX.ko.md)
