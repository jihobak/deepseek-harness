# 08. 앱의 실행 자원 조립

학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.

```sh
python scripts/practice.py create guide-build 08 --dest /tmp/guide-build-08
cd /tmp/guide-build-08
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 08
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.

## 빈칸 1: guide-build-08-1

파일: `src/app.ts`. 로컬 앱의 실행기, Worker, 인증 저장소, Git 저장소를 연결하세요.

힌트: 실제 provider 대신 MockWorker를 사용합니다.

완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.

[별도 정답과 해설](../answers/guide-build-08.ko.md) · [실습 사용법](../INDEX.ko.md)
