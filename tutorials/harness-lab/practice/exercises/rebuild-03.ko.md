# 03. 원자적인 승인

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create rebuild 03 --dest /tmp/rebuild-03
cd /tmp/rebuild-03
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 03
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: rebuild-03-1

파일: `src/engine.ts`. 새 실행 시도의 외부 실행 의도를 저장하세요.

힌트: 직접 모델을 호출하지 말고 launch effect를 예약합니다.

## 빈칸 2: rebuild-03-2

파일: `src/engine.ts`. 평가 중 정책이 바뀐 결과를 승인에 사용하지 않도록 비교하세요.

힌트: 평가 당시 version과 현재 policy version을 비교합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/rebuild-03.ko.md) · [실습 사용법](../INDEX.ko.md)
