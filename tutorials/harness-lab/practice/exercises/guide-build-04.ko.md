# 04. Worker 출력 해석하기

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create guide-build 04 --dest /tmp/guide-build-04
cd /tmp/guide-build-04
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 04
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: guide-build-04-1

파일: `src/worker.ts`. Claude의 프로세스 종료와 구조화된 오류를 함께 검사하세요.

힌트: exit 0이어도 is_error=true이면 실패입니다.

## 빈칸 2: guide-build-04-2

파일: `src/worker.ts`. OpenCode가 세션 식별자를 돌려주지 않은 출력을 거절하세요.

힌트: 다음 turn의 resume에 필요한 값을 확인합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/guide-build-04.ko.md) · [실습 사용법](../INDEX.ko.md)
