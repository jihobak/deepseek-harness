# 04. 구독 소유권과 문맥

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create rebuild 04 --dest /tmp/rebuild-04
cd /tmp/rebuild-04
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 04
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: rebuild-04-1

파일: `src/engine.ts`. 여러 Thread를 통해 도달한 Ticket의 context-only 여부를 합치세요.

힌트: 한 경로라도 소유 구독이면 context=false입니다.

## 빈칸 2: rebuild-04-2

파일: `src/engine.ts`. 사람의 소유 후속 입력을 기존 Worker가 판단하게 하세요.

힌트: bot과 context-only는 소유 입력으로 표시하지 않습니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/rebuild-04.ko.md) · [실습 사용법](../INDEX.ko.md)
