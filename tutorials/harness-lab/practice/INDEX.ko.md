# 빈칸 채우기로 구현하는 Super-agent

이 실습은 TypeScript의 함수·union·Promise와 기본 SQL을 아는 학습자를 대상으로 합니다. 주변 실행 코드와 테스트를 제공하고 핵심 로직만 직접 채웁니다. 두 과정 각각 01–08, 총 16단계와 28개 빈칸이 있습니다. 먼저 해당 과정의 개념 설명을 읽고, 예상 결과를 적은 뒤 테스트로 확인하세요.

## 프로젝트 만들기

학습 프로젝트 루트에서 실행합니다. Python 표준 라이브러리만으로 프로젝트를 생성하며, 생성된 실습은 Node 24.9 이상·npm·git을 사용합니다. HTTP와 프로세스 종료 실습은 Linux/macOS의 POSIX 환경을 기준으로 합니다.

```sh
cd tutorials/harness-lab
python scripts/practice.py create guide-build 03 --dest /tmp/my-guide-03
cd /tmp/my-guide-03
npm ci --ignore-scripts
npm run typecheck
npm run stage -- 03
```

처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE 과정-단계-번호`가 있는 표현식 또는 문장을 요구사항에 맞게 채우세요. 일부 테스트는 예외를 처리한 뒤 결과를 비교하므로 실패가 EXERCISE 문자열 대신 assertion으로 나타날 수 있습니다. 테스트를 바꿔 통과시키지 않습니다.

생성기는 현재 단계와 이전 단계 테스트, 이들이 참조하는 모듈 및 필요한 실행 자원을 복사합니다. 아직 배우지 않은 지원 동작은 완성된 골격으로 제공합니다. 빈 프로젝트에서 모든 코드를 작성하는 선택지는 각 과정 INDEX에 있으며, 이 실습에서는 핵심 판단에 집중합니다. 03의 token 구현은 뒤 단계의 Executor 없이 사용할 수 있습니다.

기존 경로가 있으면 생성은 거절됩니다. 다음 단계를 만들 때 새 경로를 선택하고, 이전 실습의 변경과 새 골격을 비교하세요. 정답 프로젝트도 별도 경로에 생성합니다. 자동 채점은 로컬 테스트이며 실제 모델의 코드 생성 품질이나 GitHub 운영 성공률을 측정하지 않습니다.

## 문제와 정답

|단계|간소화 호스트 문제|별도 정답·해설|공식 프로토타입 개념 문제|별도 정답·해설|
|---|---|---|---|---|
|01|[사건과 gate](exercises/guide-build-01.ko.md)|[정답](answers/guide-build-01.ko.md)|[사건 정체성](exercises/rebuild-01.ko.md)|[정답](answers/rebuild-01.ko.md)|
|02|[재개와 PR 종료](exercises/guide-build-02.ko.md)|[정답](answers/guide-build-02.ko.md)|[권한 판단](exercises/rebuild-02.ko.md)|[정답](answers/rebuild-02.ko.md)|
|03|[신원과 전달 대상](exercises/guide-build-03.ko.md)|[정답](answers/guide-build-03.ko.md)|[원자적 승인](exercises/rebuild-03.ko.md)|[정답](answers/rebuild-03.ko.md)|
|04|[Worker 출력](exercises/guide-build-04.ko.md)|[정답](answers/guide-build-04.ko.md)|[구독 소유권](exercises/rebuild-04.ko.md)|[정답](answers/rebuild-04.ko.md)|
|05|[Outbox 순서](exercises/guide-build-05.ko.md)|[정답](answers/guide-build-05.ko.md)|[Effects](exercises/rebuild-05.ko.md)|[정답](answers/rebuild-05.ko.md)|
|06|[반환 입력·복구](exercises/guide-build-06.ko.md)|[정답](answers/guide-build-06.ko.md)|[실행 시도](exercises/rebuild-06.ko.md)|[정답](answers/rebuild-06.ko.md)|
|07|[확인할 작업 정렬](exercises/guide-build-07.ko.md)|[정답](answers/guide-build-07.ko.md)|[외부 전송](exercises/rebuild-07.ko.md)|[정답](answers/rebuild-07.ko.md)|
|08|[앱 조립](exercises/guide-build-08.ko.md)|[정답](answers/guide-build-08.ko.md)|[읽기 범위](exercises/rebuild-08.ko.md)|[정답](answers/rebuild-08.ko.md)|

## 학습 완료와 유지보수

각 단계의 완료 기준은 현재 stage와 `npm test`의 이전 단계 테스트 통과, 빈칸의 조건이 필요한 이유 설명, 해당 조건을 제거했을 때의 실패 재현입니다. 간소화 과정 08은 실제 HTTP·Git·자식 프로세스·재시작까지 실행합니다. 정답을 본 뒤에도 예상 결과와 실제 관찰의 차이를 기록하세요.

문제·정답 문서는 `catalog.json`과 참조 코드에서 생성됩니다. 유지보수자는 `python scripts/practice.py pages --write`로 문서를 갱신하고 `python scripts/validate_practice.py`로 모든 정답·개별 빈칸 실패·기존 작업 덮어쓰기 거절을 검사합니다. 학습자는 이 생성 명령으로 자신의 실습을 덮어쓸 필요가 없습니다. 자동 검증은 임시 경로에서 수행합니다.
