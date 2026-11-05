# DeepSeek Super-agent 연구 설명의 출처

DeepSeek의 Super-agent 연구 설명은 처음 공유한 DeepSeek Harness의 X 포스트에 올라와 있습니다.

- 제목: **Exploring Super-agent Design: Towards a More Autonomous Agent System**
- 작성 계정: **DeepSeek Harness (@DeepSeekHarness)**
- 원문: https://x.com/DeepSeekHarness/status/2116857257245987236?s=20

이 글은 Router/Worker, 사건 처리, 문맥 관리, 지속성, Watchdog 등의 설계 아이디어를 설명합니다. 기존 Harness 제품의 기능 목록과 동일하게 해석하지 않도록 주의해야 합니다.

## 공개 프로토타입과의 관계

|자료|역할|
|---|---|
|X 포스트|Super-agent의 목표와 연구 설계 설명|
|[dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype)|공개용으로 조정된 연구 참고 구현|
|[Harness 공식 페이지](https://www.deepseek.com/en/harness/)|Harness 제품과 기반 구조 소개|

공개 프로토타입은 연구 글이나 비공개 내부 버전과 동일하지 않으며, 글에서 제안한 설계 일부는 구현되지 않았습니다. 따라서 연구의 지향점과 공개 코드에서 확인한 동작을 구분해 읽어야 합니다.

## 함께 읽을 교육자료

- [프로토타입 분석 보고서](PROTOTYPE_ANALYSIS.ko.md): 설계 개념, 코드 근거, 연구 글과 구현의 차이.
- [한국어 실습 안내](GUIDE.ko.md): Python·LangChain·LangGraph 기반 노트북 학습 순서.
- [출처와 주장 범위](SOURCES.md): 원문 수집 방식과 개념별 근거.

이 파일은 대화에서 설명한 출처와 자료 간 관계를 정리한 것으로, X 글의 전문이나 전체 번역은 아닙니다.
