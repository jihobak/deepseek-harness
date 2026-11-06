# 02. 재개와 PR 종료를 구분하기

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create guide-build 02 --dest /tmp/guide-build-02
cd /tmp/guide-build-02
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 02
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: guide-build-02-1

파일: `src/engine.ts`. PR이 닫혀도 현재 실행 중인 후속 작업을 종료하지 않도록 조건을 채우세요.

힌트: 현재 turn의 running 상태를 확인합니다.

## 빈칸 2: guide-build-02-2

파일: `src/engine.ts`. 어떤 보고가 닫힌 PR들의 최종 완료를 판단할 수 있는지 채우세요.

힌트: progress·waiting·blocked는 완료 보고가 아닙니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/guide-build-02.ko.md) · [실습 사용법](../INDEX.ko.md)
