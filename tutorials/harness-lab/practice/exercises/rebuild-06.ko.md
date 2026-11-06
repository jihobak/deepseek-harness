# 06. 실행 시도와 재개

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create rebuild 06 --dest /tmp/rebuild-06
cd /tmp/rebuild-06
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 06
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: rebuild-06-1

파일: `src/engine.ts`. 종료되었거나 교체된 실행 시도의 보고를 거절하세요.

힌트: Ticket 상태와 현재 Assignment ID를 동시에 확인합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/rebuild-06.ko.md) · [실습 사용법](../INDEX.ko.md)
