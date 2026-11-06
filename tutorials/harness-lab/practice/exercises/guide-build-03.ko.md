# 03. Worker의 신원과 전달 대상

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create guide-build 03 --dest /tmp/guide-build-03
cd /tmp/guide-build-03
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 03
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: guide-build-03-1

파일: `src/tokens.ts`. 발급한 token을 Ticket과 turn에 연결해 저장하세요.

힌트: Map의 키에는 token 원문 대신 hash를 사용합니다.

## 빈칸 2: guide-build-03-2

파일: `src/engine.ts`. 대상 검사가 실패했을 때 요청과 상태 변경을 함께 거부하는 오류를 채우세요.

힌트: 대상 조회 결과가 없으면 같은 트랜잭션에서 실패합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/guide-build-03.ko.md) · [실습 사용법](../INDEX.ko.md)
