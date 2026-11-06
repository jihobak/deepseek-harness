# 05. 오래된 Effect 완료 차단

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create rebuild 05 --dest /tmp/rebuild-05
cd /tmp/rebuild-05
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 05
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: rebuild-05-1

파일: `src/store.ts`. Effect 완료가 자신이 실행한 예약만 삭제하도록 SQL을 채우세요.

힌트: 행 정체성과 payload 세대를 함께 조건에 넣습니다.

## 빈칸 2: rebuild-05-2

파일: `src/store.ts`. 오래된 실패가 새 예약의 재시도 시각을 바꾸지 못하게 하세요.

힌트: 완료와 같은 소유 조건을 UPDATE에도 적용합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/rebuild-05.ko.md) · [실습 사용법](../INDEX.ko.md)
