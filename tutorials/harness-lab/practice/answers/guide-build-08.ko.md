# 08. 앱의 실행 자원 조립

실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.

## 정답 1: guide-build-08-1

```text
new Executor(engine,new MockWorker(),tokens,repo)
```

이 실습은 로컬 프로세스와 Git 커밋을 검증합니다. 실제 모델을 연결하지 않아도 호스트의 자원 소유권과 재시작을 확인할 수 있습니다.

## 전체 정답 실행

```sh
python scripts/practice.py create guide-build 08 --dest /tmp/guide-build-08-answer --answers
cd /tmp/guide-build-08-answer
npm ci --ignore-scripts
npm run typecheck
npm test
npm run stage -- 08
```

[문제로 돌아가기](../exercises/guide-build-08.ko.md) · [참조 구현](../../guide-build/src/app.ts)
