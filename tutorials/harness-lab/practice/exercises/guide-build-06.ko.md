# 06. 반환 입력과 종료 복구

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create guide-build 06 --dest /tmp/guide-build-06
cd /tmp/guide-build-06
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 06
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: guide-build-06-1

파일: `src/engine.ts`. 다음 Worker batch에서 이미 소비했거나 반환한 입력을 제외하세요.

힌트: 두 조건 모두 충족하는 입력만 선택합니다.

## 빈칸 2: guide-build-06-2

파일: `src/executor.ts`. 호스트 종료 전에 현재 turn을 복구 가능한 상태로 기록하세요.

힌트: 프로세스를 abort하기 전에 Engine의 전용 연산을 호출합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/guide-build-06.ko.md) · [실습 사용법](../INDEX.ko.md)
