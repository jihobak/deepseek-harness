# 02. 모델 판단과 권한

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create rebuild 02 --dest /tmp/rebuild-02
cd /tmp/rebuild-02
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 02
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: rebuild-02-1

파일: `src/policy.ts`. inferred 후보가 실행 가능한 방향과 규칙을 갖췄는지 검사하세요.

힌트: 명확한 방향, 일치 규칙, 허용 모드를 모두 확인합니다.

## 빈칸 2: rebuild-02-2

파일: `src/policy.ts`. observe 모드에서는 실행 승인 대신 관찰 결과를 남기세요.

힌트: 결과 union의 would_accept를 사용합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/rebuild-02.ko.md) · [실습 사용법](../INDEX.ko.md)
