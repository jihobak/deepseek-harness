# 01. 사건의 정체성

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create rebuild 01 --dest /tmp/rebuild-01
cd /tmp/rebuild-01
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 01
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: rebuild-01-1

파일: `src/source.ts`. 저장소가 달라도 충돌하지 않는 사건 ID를 만드세요.

힌트: source·repository·외부 ID를 배열로 인코딩합니다.

## 빈칸 2: rebuild-01-2

파일: `src/source.ts`. 잘못된 boolean 플래그를 검출한 경우 정규화를 중단하는 오류를 채우세요.

힌트: 문자열 true를 참 값으로 취급하지 않습니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/rebuild-01.ko.md) · [실습 사용법](../INDEX.ko.md)
