# 08. 업무별 읽기 범위

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create rebuild 08 --dest /tmp/rebuild-08
cd /tmp/rebuild-08
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 08
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: rebuild-08-1

파일: `src/views.ts`. Worker가 다른 Ticket의 문맥을 읽지 못하게 하세요.

힌트: viewerTicketId는 인증된 어댑터가 제공한다는 전제입니다.

## 빈칸 2: rebuild-08-2

파일: `src/views.ts`. UTF-16 본문을 빠짐없이 이어 읽도록 다음 offset을 반환하세요.

힌트: 남은 본문이 없으면 null을 반환합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/rebuild-08.ko.md) · [실습 사용법](../INDEX.ko.md)
