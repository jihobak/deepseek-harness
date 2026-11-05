# 07. 외부 연결에서 유실과 중복 다루기

외부 서비스는 로컬 DB 트랜잭션에 참여하지 않습니다. 따라서 “전송 성공”과 “로컬 성공 기록” 사이의 실패를 설계의 일부로 다뤄야 합니다.

## 작성 순서

1. Source가 읽은 사건을 저장하는 트랜잭션 안에서 cursor도 저장합니다. cursor만 먼저 진행하면 재시작 후 읽지 않은 사건을 건너뜁니다. 중복 사건을 다시 읽는 것은 안정적인 ID로 처리합니다.
2. Channel에는 `send(messageId,text)`를 정의합니다. 원본 Outbox의 pending/sent/dropped와 순서 제어는 확장 항목입니다. 실습 receipt는 pending/sent만 있습니다.
3. 전송 후 응답을 잃은 상황을 만들고 같은 messageId로 재시도합니다. LocalChannel의 Map은 단일 메모리 공간에서 원자적으로 중복을 막습니다. GitHub API가 같은 수준의 멱등키를 제공한다고 가정하지 않습니다.
4. 일시적 실패에 backoff를 적용하고, 실습에서는 세 번 실패하면 failure 기록을 남깁니다. 이 숫자는 교육용 선택이며 원본의 모든 effect 종류에 동일하게 적용되는 규칙이 아닙니다.
5. pause는 외부 effect 실행을 보류합니다. 실습에서는 intake와 도메인 상태 전이는 계속됩니다. 원본의 Eval 시간 보정과 재개 보류는 10에서 추가합니다.

```sh
npm run stage -- 07
```

실패 실험은 cursor 저장 실패, 외부 전송 후 응답 유실, 반복되는 provider 실패입니다. `sent`로 표시하기 전에 전송해야 하지만, 그 순서만으로 exactly-once가 되지는 않습니다. 중복 완화 방법과 그 보장 범위를 적어야 합니다.

## 실제 GitHub로 바꿀 때

원본은 기존 bot 댓글에서 메시지 마커를 찾은 뒤 없으면 게시합니다. A와 B가 동시에 “없음”을 읽고 모두 게시하면 중복될 수 있습니다. 원본의 stateDir lock, reply concurrency, 순서 제어가 어떤 경쟁을 제한하는지 함께 검토하세요. 이 과정의 Map 테스트는 원본의 분산 중복 보장을 검증하는 테스트가 아닙니다.

실제 Source 구현에서는 pagination, polling overlap, bot 계정 식별, Issue/PR·review comment·CI 사건별 안정적 ID, 삭제되거나 접근 불가한 대화의 처리를 추가합니다. Source가 외부 payload를 검증한 뒤 Engine에 정규화된 Trigger를 전달하는 방향은 유지합니다.

원본 대응: [sources/github-channel.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/sources/github-channel.ts), `sources/github.ts`, `sources/github-trigger.ts`, `app/outbox.ts`, `tests/sources.spec.ts`, `tests/outbox.spec.ts`. 다음은 [08 화면](08-views.ko.md)입니다.
