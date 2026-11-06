from pathlib import Path
import nbformat as n
from textwrap import dedent
import os
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('HARNESS_NOTEBOOK_OUTPUT',ROOT/'notebooks'))
OUT.mkdir(parents=True,exist_ok=True)
ANN='https://x.com/DeepSeekHarness/status/2116857257245987236?s=20'
SITE='https://www.deepseek.com/en/harness/'
def md(s): return n.v4.new_markdown_cell(dedent(s).strip())
def code(s): return n.v4.new_code_cell(dedent(s).strip())
def save(name,title,source,cells,exercise,solution):
    nb=n.v4.new_notebook(cells=[md(f'# {title}\n\n{source}\n\n**실행:** Python (Harness Lab) 커널에서 위에서 아래로 실행하세요. 각 노트북은 새 커널에서 독립 실행됩니다. 기본 셀은 외부 API를 호출하지 않습니다.')]+cells+[md('## 직접 바꿔 보기\n\n'+exercise),md('## 해설과 참고 답안\n\n'+solution)],metadata={'kernelspec':{'display_name':'Python (Harness Lab)','language':'python','name':'harness-lab'},'language_info':{'name':'python','version':'3.12'}})
    n.write(nb,OUT/(name+'.ipynb'))

save('00_reading_map','0. 무엇이 달라졌는가: 제품, 설계, 실습 구분',f'원문: [Super-agent 설계 글]({ANN}), [제품 페이지]({SITE}).',[
md('''## 학습 목표와 범위
Python 함수·타입 힌트·기본 async 문법을 아는 독자를 위한 약 4~6시간 과정입니다. 처음에는 실행 결과를 예측하고, 셀을 실행한 뒤 assert가 확인하는 성질을 설명하세요.

X 원문 제목은 *Exploring Super-agent Design: Towards a More Autonomous Agent System*입니다. 표시된 영문은 중국어 원문의 기계 번역이며, 첫머리에서 **아키텍처 아이디어이지 기존 DeepSeek Harness 기능 소개가 아니다**라고 밝힙니다. 공식 제품 페이지는 공개 프리뷰·오픈소스·Cordis 기반 플러그인 확장을 소개합니다. 제품 페이지의 애니메이션은 시연용이며 실제 실행 증거가 아닙니다.

따라서 아래 예제는 Super-agent 설계를 배우는 Python 교육용 구현입니다. 공식 Python SDK나 DeepSeek Harness의 Python 포팅, 내부 Super-agent 전체 구현의 공개 여부를 입증하는 자료가 아닙니다.

## 네 가지 목표와 다섯 모듈
|목표|뜻|실습|
|---|---|---|
|Continuous|채널을 바꿔도 작업·맥락이 이어짐|Router/Worker, Thread 구독, 참조 회수|
|Productive|여러 작업과 새 입력을 함께 처리|격리된 Worker, 비동기 start/stop|
|Proactive|환경 사건을 선별해 먼저 처리|코드 필터 → 의미 판단, 조건부 결과 전달|
|Persistent|장시간 유지·복구|상태 저장, 실행환경 분리, 외부 Watchdog|

원문의 다섯 모듈은 ① 2계층 구조 ② 이벤트 트리거 ③ 전이중 다채널 상호작용 ④ compute/state/environment 분리 ⑤ Watchdog입니다. 플러그인 설계는 이들을 조합할 기반으로 별도 학습합니다.

## 기존 구조와 비교할 때 주의할 점
모든 기존 harness가 단일 동기 루프인 것은 아닙니다. LangGraph도 병렬 처리, 상태, interrupt를 지원합니다. 차이는 라이브러리 우열보다 **어떤 책임과 불변조건을 구조로 강제하는가**에 있습니다.

|항목|단일 세션 중심 예|이번 설계|
|---|---|---|
|사용자 역할|여러 세션의 맥락을 직접 관리|채널/작업을 통해 하나의 시스템과 대화|
|주 세션|판단·실행·응답을 모두 수행|Router는 인간 소통·배정만 수행|
|작업 맥락|여러 작업의 중간 결과가 섞임|Worker마다 격리|
|후속 사건|매번 중앙 모델이 재배정|구독된 Thread는 코드로 pass-through|
|오래 걸리는 도구|완료까지 대기|즉시 receipt, 결과는 별도 사건|

Router는 단일 복잡한 과제를 세세히 분해하는 Team Lead와 역할이 다릅니다. Worker 자체가 팀일 수는 있습니다. LangGraph graph를 작성했다는 사실만으로 이 구조가 보장되지는 않습니다.

## 학습 순서
01 루프 → 02 Router와 이벤트 → 03 문맥 → 04 비동기 → 05 플러그인 → 06 복구 → 07 통합 → 08 선택적 실제 모델.
'''),
code('''import sys
from importlib.metadata import version
print(sys.version)
for name in ('langchain','langgraph','ipykernel'):
    print(name, version(name))
assert sys.version_info >= (3,12)
'''),
md('''## 실험 수치를 읽는 법
원문 §7은 합성 메시지와 시간을 소비하는 가짜 코딩 도구를 사용한 예비 실험이며, 코딩 능력 실험이 아닙니다. 5회 실행에서 Super-agent p50/p95는 12.4/15.7분, 중립 프롬프트 단일 세션은 20.4/29.5분입니다. Pass-through 제거 시 지연은 비슷하지만 cache-read token은 23.2M → 31.8M입니다. 이 수치가 모든 업무의 우월성이나 비용 절감을 보장하지 않습니다. 우리 실습은 논문 실험 재현이 아니라 구조적 성질의 검증입니다.'''),
code('''baseline_tokens=23.2
without_passthrough=31.8
print(f'Pass-through 제거 시 cache-read 증가: {(without_passthrough/baseline_tokens-1):.1%}')
assert without_passthrough > baseline_tokens
''')], '당신의 업무에서 사용자 채널, Thread, 작업, Worker를 각각 하나씩 정의하세요. 같은 채팅방의 모든 메시지를 하나의 작업으로 묶으면 어떤 문제가 생길까요?', '예: GitHub 댓글(채널), PR #42(Thread), 회귀 버그 수정(작업), 수정 담당 세션(Worker). Thread와 Worker는 다대다이며 동일하지 않습니다. 한 Thread에서 서로 다른 작업이 시작될 수 있으므로 재배정 경로도 필요합니다.')

save('01_agent_loop','1. LangChain 도구와 LangGraph 루프',f'근거: [설계 글 §1·§4.1]({ANN}).',[
md('''## 모델의 판단과 harness의 책임
모델은 다음 행동을 제안하고, harness는 도구 실행·상태 기록·중단·결과 전달을 관리합니다. 아래는 실제 LangChain 도구와 LangGraph ToolNode를 사용하는 최소 루프입니다. 모델 부분만 결정적인 Runnable로 대체해 API 키 없이 흐름을 관찰합니다. 자연어 이해 성능을 평가하는 예제가 아닙니다.

흐름: START → model → (도구 요청이면 tools → model, 아니면 END). add_messages reducer는 노드가 반환한 새 메시지를 기존 대화에 합칩니다.'''),
code('''from typing import Annotated, TypedDict
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage, AnyMessage
from langchain_core.runnables import RunnableLambda
from langchain.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

@tool
def lookup(topic: str) -> str:
    """로컬 학습 문서에서 개념의 요약을 찾습니다."""
    return {'harness':'모델을 둘러싼 실행·상태·정책 시스템'}.get(topic, '자료 없음')

class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def decide(messages):
    if isinstance(messages[-1], ToolMessage):
        return AIMessage(content='조회 결과: '+messages[-1].content)
    return AIMessage(content='',tool_calls=[{'name':'lookup','args':{'topic':'harness'},'id':'lookup-1','type':'tool_call'}])

model=RunnableLambda(decide)
def model_node(s): return {'messages':[model.invoke(s['messages'])]}
def route(s): return 'tools' if s['messages'][-1].tool_calls else 'done'
b=StateGraph(State)
b.add_node('model',model_node)
b.add_node('tools',ToolNode([lookup]))
b.add_edge(START,'model')
b.add_conditional_edges('model',route,{'tools':'tools','done':END})
b.add_edge('tools','model')
app=b.compile()
result=app.invoke({'messages':[HumanMessage(content='harness 설명해줘')]}, {'recursion_limit':8})
for m in result['messages']: print(m.type, m.content or m.tool_calls)
assert len(result['messages'])==4
assert isinstance(result['messages'][2],ToolMessage)
assert '실행·상태·정책' in result['messages'][-1].content
'''),
md('''## 관찰
모델 호출은 두 번이지만 실제 도구 실행은 한 번입니다. ToolMessage의 tool_call_id가 AIMessage의 요청과 결과를 연결합니다. 이 루프 안에서 오래 걸리는 도구를 동기 실행하면 다음 입력 처리가 늦어집니다. 단순히 노드를 async def로 바꾸는 것만으로 별도 입력 처리가 자동 구현되지는 않습니다.'''),
code('''assert result['messages'][2].tool_call_id == result['messages'][1].tool_calls[0]['id']
print(app.get_graph().draw_mermaid())
''')], 'lookup의 topic을 존재하지 않는 값으로 바꾸어 실행하세요. 결과 없음은 모델 실패인가요, 도구의 정상 결과인가요? 무한 도구 호출을 막는 예산은 어디에 둘까요?', '자료 없음은 정상적인 도구 결과입니다. 모델이 계속 도구를 요구하면 graph recursion_limit 또는 별도 step budget으로 중단합니다. 예외를 성공 메시지로 숨기지 말고 결과 없음·실행 오류·예산 초과를 구분해야 합니다.')

save('02_router_triggers','2. Router/Worker, 두 단계 필터와 구독',f'근거: [설계 글 §2·§3.1–3.2]({ANN}).',[
md('''## 구조로 역할을 제한하기
Router에는 작업 실행 도구를 주지 않고 배정과 외부 응답만 맡깁니다. Worker는 자기 작업 문맥만 받습니다. 모든 후보 사건을 항상 중앙 모델에 보내면 Router가 부담을 떠안습니다. 이미 구독된 Thread의 후속 사건은 코드로 전달합니다.

아래 semantic 함수는 LLM 판단을 흉내 내는 결정적 대역입니다. 운영에서는 structured output 모델로 교체할 수 있습니다. 코드 필터는 허용된 발신원·중복 여부 같은 확실한 조건을 처리하고, 의미 판단은 후보에만 수행합니다. Router의 가시성(observed)과 모델의 재배정 호출(decisions)은 다른 지표입니다.'''),
code('''from dataclasses import dataclass
from collections import defaultdict
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

@dataclass(frozen=True)
class Trigger:
    id: str
    thread: str
    channel: str
    text: str
    trusted: bool=True

class WorkerState(TypedDict):
    task: str
    conclusion: str
wb=StateGraph(WorkerState)
wb.add_node('work',lambda s:{'conclusion':'로컬 검토: '+s['task']})
wb.add_edge(START,'work'); wb.add_edge('work',END)
worker=wb.compile()

class Router:
    def __init__(self):
        self.seen=set(); self.subscribers=defaultdict(set)
        self.inboxes=defaultdict(list); self.observed=[]
        self.decisions=0; self.semantic_calls=0
    def semantic(self,event):
        self.semantic_calls+=1
        return any(word in event.text for word in ['버그','수정','취소'])
    def admit(self,event):
        if not event.trusted or event.id in self.seen: return []
        self.seen.add(event.id)
        if not self.semantic(event): return []
        self.observed.append(event.id)
        targets=sorted(self.subscribers[event.thread])
        if not targets:
            self.decisions+=1
            targets=[f'worker-{self.decisions}']
            self.subscribers[event.thread].update(targets)
        for target in targets: self.inboxes[target].append(event)
        return targets

r=Router()
a=Trigger('e1','im:topic-42','im','버그 재현')
b=Trigger('e2','im:topic-42','im','수정 방향 변경')
assert r.admit(a)==['worker-1']
assert r.admit(b)==['worker-1']
assert r.decisions==1 and r.observed==['e1','e2']
assert r.admit(a)==[]  # 중복 전달 방지
assert r.admit(Trigger('noise','spam','im','버그',False))==[]
assert r.semantic_calls==2
# 같은 Worker가 GitHub PR에도 구독: 채널을 바꿔도 작업 지속
r.subscribers['github:pr-42'].add('worker-1')
r.admit(Trigger('e3','github:pr-42','github','수정 검토'))
# Thread에 두 Worker가 구독: peer에게 개별 연락하지 않고 같은 사건 전달
r.subscribers['github:pr-42'].add('reviewer')
assert r.admit(Trigger('e4','github:pr-42','github','버그 검토'))==['reviewer','worker-1']
assert r.decisions==1
result=worker.invoke({'task':r.inboxes['worker-1'][0].text,'conclusion':''})
print('Router 재배정:',r.decisions, '관찰:',r.observed)
print('Worker 결과:',result['conclusion'])
'''),
md('''## 이 예제가 생략한 것
Worker 실행은 여기서는 invoke로 분리해 보여줍니다. 실제 병행 실행은 04·07에서 합니다. 발신자 신뢰 여부는 데모 필드이며 인증 구현이 아닙니다. 구독은 쓰기 잠금이 아니므로 두 Worker가 같은 파일을 수정하는 충돌을 방지하지 않습니다. 잡담 필터가 후속 작업 취소를 놓치지 않도록 정책 테스트가 필요합니다.

원문 Router batching은 추론 중 쌓인 사건을 다음 추론에 묶어 넣습니다. 무제한 대기가 아니라 최대 개수·대기시간·문맥 예산을 정해야 합니다.'''),
code('''def batches(events, limit):
    if limit<1: raise ValueError('양수 limit 필요')
    return [events[i:i+limit] for i in range(0,len(events),limit)]
queue=[f'e{i}' for i in range(7)]
groups=batches(queue,3)
assert list(map(len,groups))==[3,3,1]
assert sum(groups,[])==queue
print('7개 사건, 최대 3개씩 처리:', groups)
''')], '이미 구독된 Thread에서 완전히 다른 작업이 시작되면 어떻게 재배정할까요? 위 Router에서 worker-1을 해제하고 새 사건을 넣어 decisions 증가를 확인하세요.', 'r.subscribers["im:topic-42"].discard("worker-1") 후 새 ID의 사건을 admit하면 새 Worker가 배정됩니다. 운영에서는 Worker의 hand-back 사건과 해제 작업을 원자적으로 처리해 유실·재전달 루프를 막아야 합니다.')

save('03_context_recall','3. Inline & Spill, Chain of Recall와 세션 로그',f'근거: [설계 글 §3.3]({ANN}), 저장소 docs/architecture.md의 Session log.',[
md('''## 문맥 창을 제한된 작업 공간으로 보기
자주 곧 쓸 요약·연관 ID는 inline, 긴 본문은 외부 저장소로 spill합니다. 단순 절단과 달리 원문으로 돌아갈 참조가 남아야 합니다. Chain of Recall은 현재 사건 → Thread → Worker → 다른 Thread처럼 **명시적 참조**를 따라가는 회수입니다. 벡터 검색과 동일하지 않으며 둘은 함께 쓸 수 있습니다.

아래 길이 예산은 Python 문자 수입니다. 모델 token 예산과 같지 않습니다. 실서비스는 해당 tokenizer와 권한 검사를 사용해야 합니다.'''),
code('''from langchain.tools import tool
objects={
 'im:42':{'text':'IM에서 정한 목표: Plan A로 버그 수정. '*20,'links':['worker:7']},
 'worker:7':{'text':'인증 버그 수정 담당','links':['pr:9']},
 'pr:9':{'text':'PR 검토에서 Plan B로 변경. 회귀 테스트 추가.','links':[]},
}
@tool
def recall(object_id: str, offset: int=0, limit: int=48) -> dict:
    """로컬 객체 본문의 한 페이지와 다음 참조를 반환합니다."""
    if offset<0 or not 1<=limit<=100: raise ValueError('잘못된 페이지 범위')
    obj=objects[object_id]
    end=offset+limit
    return {'id':object_id,'text':obj['text'][offset:end], 'links':obj['links'],
            'next_offset':end if end<len(obj['text']) else None}
first=recall.invoke({'object_id':'im:42'})
second=recall.invoke({'object_id':first['links'][0]})
third=recall.invoke({'object_id':second['links'][0]})
assert 'Plan B' in third['text']
parts=[]; offset=0
while True:
    page=recall.invoke({'object_id':'im:42','offset':offset})
    parts.append(page['text'])
    if page['next_offset'] is None: break
    offset=page['next_offset']
assert ''.join(parts)==objects['im:42']['text']
print(first); print(third)
'''),
md('''## 로그에서 모델 입력을 재구성하기
DeepSeek Harness 저장소는 “Model-visible means logged” 원칙을 둡니다. 회수한 본문도 모델에 넣었다면 기록해야 과거 입력을 설명할 수 있습니다. 객체가 나중에 바뀌었을 때 ID만으로 재조회하면 과거 입력과 달라집니다. 아래에서는 실제로 넣은 payload를 복사해 기록합니다.

LangGraph checkpoint는 실행 상태를 복원하는 수단입니다. 애플리케이션의 append-only 감사 로그와 자동으로 같아지지는 않습니다. 이 예제의 이벤트 vocabulary는 교육용이며 공식 SessionEvent 형식을 구현하지 않습니다.'''),
code('''import json
from copy import deepcopy
from langchain_core.messages import SystemMessage, HumanMessage
log=[]
def append(kind,payload):
    log.append({'seq':len(log)+1,'kind':kind,'payload':deepcopy(payload)})
def project(events):
    messages=[]
    for e in events:
        if e['kind']=='user': messages.append(HumanMessage(content=e['payload']))
        elif e['kind']=='context': messages.append(SystemMessage(content=json.dumps(e['payload'],ensure_ascii=False)))
    return messages
append('user','이전 PR에서 바뀐 계획은?')
append('context',third)
request=project(log)
objects['pr:9']['text']='나중에 변경된 Plan C'
assert 'Plan B' in request[-1].content
assert [m.content for m in project(log)]==[m.content for m in request]
append('ui-only','spinner shown')
assert len(project(log))==2
print([m.content for m in project(log)])
''')], '객체 참조가 순환하거나 삭제되었을 때 recall을 어떻게 끝낼까요? 요약을 10자로 줄이면 어떤 정보를 잃는지도 관찰하세요.', '방문 ID 집합, 최대 hop 수, 읽기 예산을 함께 둡니다. 삭제는 tombstone 또는 명시적 not-found로 표현합니다. 요약은 다음 객체를 찾을 ID와 작업 변경 사실을 보존해야 합니다. 전체 원문은 별도로 남겨야 합니다.')

save('04_full_duplex','4. start/stop과 완료 사건: 대화를 막지 않기',f'근거: [설계 글 §4 및 §3.4]({ANN}).',[
md('''## async 함수와 전이중 상호작용의 차이
await slow_tool()만 하면 호출자는 여전히 결과를 기다립니다. start는 task ID를 즉시 반환하고, 완료는 큐의 새 사건으로 전달합니다. Foreground는 그 사이 다른 입력을 받습니다. 원문도 새 입력은 **현재 추론 step이 끝난 뒤** 처리한다고 설명하며, 토큰 생성 자체를 임의로 중단한다는 뜻은 아닙니다.

아래는 실제 asyncio Task를 사용합니다. 임의 sleep 시간으로 빠름을 주장하지 않고 Event 장벽을 사용해 작업이 끝나기 전에 다른 입력을 처리할 수 있음을 검증합니다.'''),
code('''import asyncio

class Jobs:
    def __init__(self): self.tasks={}; self.events=asyncio.Queue()
    def start(self,job_id,fn):
        if job_id in self.tasks: raise ValueError('중복 작업 ID')
        async def run():
            try:
                value=await fn()
                event={'id':job_id,'status':'completed','result':value}
            except Exception as exc:
                event={'id':job_id,'status':'failed','error':type(exc).__name__}
            return event
        def finished(task):
            # 실행 전 취소도 이 완료 경로에서 정확히 한 번 기록합니다.
            event={'id':job_id,'status':'cancelled'} if task.cancelled() else task.result()
            self.events.put_nowait(event)
        task=asyncio.create_task(run())
        self.tasks[job_id]=task
        task.add_done_callback(finished)
        return {'id':job_id,'status':'started'}
    async def stop(self,job_id):
        self.tasks[job_id].cancel()
        await asyncio.gather(self.tasks[job_id],return_exceptions=True)
    async def close(self):
        for task in self.tasks.values():
            if not task.done(): task.cancel()
        await asyncio.gather(*self.tasks.values(),return_exceptions=True)

jobs=Jobs(); entered=asyncio.Event(); release=asyncio.Event()
async def slow():
    entered.set(); await release.wait(); return '분석 완료'
try:
    receipt=jobs.start('analysis',slow)
    await asyncio.wait_for(entered.wait(),2)
    foreground_reply='새 지시를 접수했습니다'
    assert receipt['status']=='started' and not jobs.tasks['analysis'].done()
    print(foreground_reply)
    release.set()
    done=await asyncio.wait_for(jobs.events.get(),2)
    assert done['result']=='분석 완료'
    print(receipt,done)
finally:
    await jobs.close()
'''),
code('''jobs=Jobs(); entered=asyncio.Event(); release=asyncio.Event()
try:
    jobs.start('cancel-me',slow)
    await asyncio.wait_for(entered.wait(),2)
    await jobs.stop('cancel-me')
    event=await jobs.events.get()
    assert event['status']=='cancelled'
    assert jobs.tasks['cancel-me'].done()
    print(event)
finally:
    await jobs.close()
'''),
code('''# 이벤트 루프에 실행 기회를 주기 전에 취소하는 경계 조건
jobs=Jobs()
async def never_started():
    raise AssertionError('이 함수는 실행되면 안 됩니다')
jobs.start('instant',never_started)
await jobs.stop('instant')
await jobs.close()
assert jobs.events.get_nowait()=={'id':'instant','status':'cancelled'}
assert jobs.events.empty()
assert all(task.done() for task in jobs.tasks.values())

jobs=Jobs()
async def fail(): raise ValueError('실습 오류')
jobs.start('failure',fail)
await asyncio.gather(*jobs.tasks.values())
await jobs.close()
assert jobs.events.get_nowait()=={'id':'failure','status':'failed','error':'ValueError'}
assert jobs.events.empty()
print('즉시 취소·실패도 종료 사건을 한 번 기록하고 정리합니다.')
'''),
md('''## Speculative execution과 채널별 전달
먼저 재현·분석·초안 작성 같은 작업을 수행하고, 유용성이 확인될 때만 결과를 전달합니다. 아래는 외부 전송 없이 메시지 문자열만 생성합니다. Worker의 상세 로그는 내부에 두고 Router가 채널에 맞게 응답합니다. 100단어 제한은 원문이 IM에서 실험한 규칙이며 한국어 문자 수 규칙과 같지 않습니다.'''),
code('''def deliver(report,channel):
    if not report['verified']: return None
    if channel=='im': return report['summary']
    return f"문제: {report['summary']}\\n검증: {report['evidence']}"
assert deliver({'verified':False},'im') is None
report={'verified':True,'summary':'회귀 원인을 재현했습니다.','evidence':'로컬 재현 테스트 통과'}
assert '검증:' in deliver(report,'github')
print(deliver(report,'im')); print(deliver(report,'github'))
''')], '작업 실패도 성공과 같은 큐로 전달해 보세요. stop이 실제 외부 명령까지 중단했다고 말하려면 무엇을 더 검증해야 할까요?', 'fn에서 ValueError를 발생시키면 failed 사건이 나옵니다. asyncio Task 취소는 외부 프로세스 종료 보장이 아닙니다. 프로세스 그룹·원격 취소 요청·종료 확인·부분 결과 정리를 별도로 설계해야 합니다. 완료 작업 보존 기간과 큐 backpressure도 운영에 필요합니다.')

save('05_plugin_lifecycle','5. Everything is a plugin: 교체와 해제',f'근거: [제품 페이지]({SITE}), 저장소 docs/cordis-primer.md 및 docs/cordis-tutorial/02-lifecycle-and-effects.md.',[
md('''## “함수 목록”보다 중요한 것
Cordis는 서비스·이벤트·효과를 context에 등록하고, 플러그인이 내려갈 때 해당 등록을 해제합니다. 실제 Cordis는 의존성 상실과 비동기 정리까지 관리합니다. 아래 Python 구현은 동기 등록, 중복 거부, 역순 정리만 가르치는 작은 모델입니다. LangGraph 노드는 실행 단위이며 Cordis의 동적 plugin lifecycle과 일대일 대응하지 않습니다.

서비스 정의(Protocol), 제공자, 소비자를 분리하면 소비자 로직을 바꾸지 않고 구현을 교체할 수 있습니다. 원본은 agent loop 자체도 플러그인으로 교체 가능합니다.'''),
code('''from typing import Protocol
from contextlib import contextmanager, ExitStack
from langchain_core.runnables import RunnableLambda

class Search(Protocol):
    def find(self,query: str) -> str: ...
class LocalSearch:
    def find(self,query): return 'local:'+query
class CachedSearch:
    def find(self,query): return 'cache:'+query
class Context:
    def __init__(self): self.services={}
    def register(self,name,service):
        if name in self.services: raise ValueError('이미 등록됨: '+name)
        self.services[name]=service
        def dispose():
            if self.services.get(name) is service: del self.services[name]
        return dispose
    def require(self,name):
        if name not in self.services: raise LookupError('의존 서비스 없음: '+name)
        return self.services[name]

@contextmanager
def profile(ctx,provider):
    with ExitStack() as effects:
        effects.callback(ctx.register('search',provider))
        yield ctx
ctx=Context()
consumer=RunnableLambda(lambda q:ctx.require('search').find(q))
with profile(ctx,LocalSearch()):
    assert consumer.invoke('harness')=='local:harness'
    try: ctx.register('search',CachedSearch())
    except ValueError: print('중복 등록 거부')
    else: raise AssertionError('중복을 허용하면 안 됨')
assert ctx.services=={}
with profile(ctx,CachedSearch()): assert consumer.invoke('harness')=='cache:harness'
assert ctx.services=={}
try:
    with profile(ctx,LocalSearch()): raise RuntimeError('플러그인 초기화 실패')
except RuntimeError: pass
assert ctx.services=={}
print('교체·정상 종료·예외 종료 후 정리 확인')
'''),
md('''## 정책은 실행 구현과 분리
around middleware는 next()로 다음 처리를 위임합니다. 관찰용 플러그인이 위임을 빼먹으면 도구가 사라진 것처럼 보입니다. 거부 정책의 short-circuit은 의도적입니다. 실제 원본은 waterfall과 최종 guard를 구분하므로 이 작은 chain을 보안 sandbox로 취급하면 안 됩니다.'''),
code('''audit=[]
def execute(request):
    audit.append('executed'); return {'result':request['text'].upper()}
def guard(request,next):
    if request['operation']!='read': return {'denied':True}
    return next(request)
def observe(request,next):
    audit.append('before')
    result=next(request)
    audit.append('after')
    return result
def pipeline(request): return observe(request,lambda req:guard(req,execute))
assert pipeline({'operation':'write','text':'x'})=={'denied':True}
assert 'executed' not in audit
audit.clear()
assert pipeline({'operation':'read','text':'hello'})['result']=='HELLO'
assert audit==['before','executed','after']
print(audit)
''')], 'profile 종료 후 consumer를 호출하면 어떤 오류가 나야 할까요? dispose를 두 번 호출해도 안전하게 만들어야 하는 이유는 무엇인가요?', '서비스가 없으므로 LookupError가 나야 합니다. 조용한 fallback은 잘못된 구성을 숨깁니다. 중복 정리나 부분 초기화 실패에 대비해 disposer를 멱등하게 만듭니다. 위 구현은 현재 등록 객체의 identity까지 비교해 다른 제공자의 등록을 지우지 않습니다.')

save('06_persistence_watchdog','6. Compute·State·Environment 분리와 Watchdog',f'근거: [설계 글 §5–6]({ANN}).',[
md('''## 무엇이 재시작 후 남아야 하는가
compute는 교체될 수 있고 상태는 남아야 합니다. 실행환경은 별도 서비스로 접근합니다. 아래에서는 SQLite 파일(상태), Python 함수(compute), 임시 폴더 provider(환경)를 분리합니다. 원격 daemon이나 실제 클라우드를 띄우는 예제는 아닙니다.

저장한 사건 ID로 중복을 거부하고 버전 번호로 오래된 결과를 거부합니다. 데이터베이스 쓰기의 멱등성만으로 외부 부작용의 exactly-once가 보장되지는 않습니다.'''),
code('''import sqlite3, tempfile
from pathlib import Path
sandbox=tempfile.TemporaryDirectory()
root=Path(sandbox.name); db=root/'state.db'
def connect():
    c=sqlite3.connect(db)
    c.execute('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, text TEXT)')
    c.execute('CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, revision INTEGER, status TEXT, progress INTEGER, heartbeat INTEGER, retries INTEGER)')
    return c
with connect() as c:
    c.execute('INSERT OR IGNORE INTO events VALUES (?,?)',('e1','조사 요청'))
    c.execute('INSERT OR IGNORE INTO events VALUES (?,?)',('e1','중복'))
    c.execute('INSERT INTO jobs VALUES (?,?,?,?,?,?)',('j1',1,'running',0,100,0))
# compute를 다시 만들었다고 가정하고 새로운 연결로 복원
with connect() as fresh:
    assert fresh.execute('SELECT count(*) FROM events').fetchone()[0]==1
    assert fresh.execute('SELECT text FROM events').fetchone()[0]=='조사 요청'
    # 늦은 revision=0 작업 결과는 반영하지 않음
    changed=fresh.execute("UPDATE jobs SET status='completed' WHERE id=? AND revision=?",('j1',0)).rowcount
    assert changed==0
print('새 DB 연결에서 상태 복원, 중복·오래된 결과 거부')
'''),
code('''from typing import Protocol
class Environment(Protocol):
    def read_note(self) -> str: ...
class FolderEnvironment:
    def __init__(self,folder): self.folder=folder
    def read_note(self): return (self.folder/'note.txt').read_text()
def compute_summary(environment: Environment):
    return '관찰: '+environment.read_note()
local=root/'local'; remote_sim=root/'remote-simulation'
local.mkdir(); remote_sim.mkdir()
(local/'note.txt').write_text('로컬 미커밋 변경')
(remote_sim/'note.txt').write_text('다른 실행환경의 문서')
assert compute_summary(FolderEnvironment(local))=='관찰: 로컬 미커밋 변경'
assert compute_summary(FolderEnvironment(remote_sim))=='관찰: 다른 실행환경의 문서'
print('compute 변경 없이 환경 provider 교체; 두 번째 폴더도 실제로는 로컬입니다.')
'''),
md('''## 살아 있는 프로세스도 진전이 없을 수 있다
원문의 Watchdog은 주 시스템 밖에서 예약 메시지로 구동되는 독립 agent session이며 의미적 진전을 판단합니다. 여기서는 그 중 **외부 관찰, bounded recovery, 진전과 생존 구분**을 결정적 규칙으로 실습합니다. 이 규칙이 실제 목표 이탈을 이해하는 LLM Watchdog이라는 뜻은 아닙니다. 시계를 주입해 sleep 없이 테스트합니다.'''),
code('''def watchdog(db_path,now):
    with sqlite3.connect(db_path) as c:
        row=c.execute('SELECT id,progress,heartbeat,retries FROM jobs WHERE status="running"').fetchone()
        if not row: return 'idle'
        job,progress,heartbeat,retries=row
        if now-heartbeat>20: cause='liveness'
        elif now-progress>30: cause='no-progress'
        else: return 'healthy'
        if retries>=1:
            c.execute('UPDATE jobs SET status="needs-human" WHERE id=?',(job,))
            return 'escalated:'+cause
        c.execute('UPDATE jobs SET retries=retries+1, revision=revision+1, progress=?, heartbeat=? WHERE id=?',(now,now,job))
        return 'retry:'+cause
assert watchdog(db,100)=='retry:no-progress'
assert watchdog(db,105)=='healthy'
assert watchdog(db,140)=='escalated:liveness'
with connect() as c:
    assert c.execute('SELECT status FROM jobs').fetchone()[0]=='needs-human'
print('진전 없는 작업 감지 → 한 번 회복 시도 → 재실패 시 escalation')
sandbox.cleanup()
'''),
md('''## LangGraph와 매핑
MemorySaver는 프로세스 메모리이므로 프로세스 장애 후 내구성을 주장할 수 없습니다. 운영에서는 영속 checkpointer와 사건 inbox/outbox, job store가 필요합니다. BYOM 실행환경은 인증·접근 제어·기기 오프라인 처리·credential 격리가 추가로 필요합니다. 로컬 폴더 provider를 원격 실행이라고 부르지 않습니다.''')], 'heartbeat만 1초마다 갱신하는 무한 반복 작업을 상상해 보세요. progress는 무엇으로 측정해야 할까요?', '도구 호출 수만 늘어나는 것은 진전이 아닐 수 있습니다. 통과한 테스트 수, 검증된 산출물, 완료된 목표 등 업무에 맞는 증거를 기록해야 합니다. 의미 판단 실패를 고려해 복구 횟수·시간 예산과 사람에게 넘기는 경로를 둡니다.')

save('07_capstone','7. 통합: 이벤트에서 승인된 결과까지',f'근거: [설계 글 §2–6]({ANN}). 교육용 축소 구현이며 외부 메시지를 보내지 않습니다.',[
md('''## 시나리오
IM의 요청과 GitHub의 별도 요청을 받아 Worker 두 개가 병행 조사합니다. 작업이 끝나기 전 IM 작업의 후속 입력을 받습니다. Worker는 로컬 문서만 읽고 Router가 보고서 초안을 만듭니다. LangGraph interrupt에서 사용자가 승인하거나 거부하면 결과를 **로컬 상태에만** 기록합니다.

이번 통합은 2계층, 구독 pass-through, 실행 격리, 이벤트 수신, LangChain 도구, LangGraph 승인 흐름을 연결합니다. 03의 문맥 회수와 06의 영속 복구는 확장 과제로 남깁니다. 이 데모가 production Super-agent의 모든 성질을 충족한다고 주장하지 않습니다.'''),
code('''import asyncio
from typing import TypedDict
from langchain.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import interrupt, Command

@tool
def read_local(topic: str) -> str:
    """주제별 로컬 교육 문서를 읽습니다."""
    return {'routing':'Router는 배정, Worker는 실행을 담당한다.',
            'state':'상태는 compute와 분리해 보존한다.'}[topic]

class Work(TypedDict):
    topic: str
    evidence: str
wb=StateGraph(Work)
wb.add_node('research',lambda s:{'evidence':read_local.invoke({'topic':s['topic']})})
wb.add_edge(START,'research'); wb.add_edge('research',END)
worker=wb.compile()

async def experiment():
    subscriptions={}; inboxes={}; jobs={}; observed=[]
    release=asyncio.Event(); entered=asyncio.Queue(); completions=asyncio.Queue()
    async def run(wid,topic):
        await entered.put(wid)
        await release.wait()
        result=await worker.ainvoke({'topic':topic,'evidence':''})
        await completions.put({'worker':wid,'evidence':result['evidence'],'updates':list(inboxes[wid])})
    def admit(thread,topic,text):
        observed.append((thread,text))
        if thread in subscriptions:
            wid=subscriptions[thread]; inboxes[wid].append(text)
            return wid
        wid=f'w{len(jobs)+1}'; subscriptions[thread]=wid; inboxes[wid]=[text]
        jobs[wid]=asyncio.create_task(run(wid,topic))
        return wid
    try:
        admit('im:42','routing','라우팅 조사')
        admit('github:9','state','상태 조사')
        started={await asyncio.wait_for(entered.get(),2),await asyncio.wait_for(entered.get(),2)}
        assert started=={'w1','w2'}
        assert not any(t.done() for t in jobs.values())
        assert admit('im:42','routing','짧게 보고해 주세요')=='w1'
        assert len(jobs)==2  # 후속 입력은 새 Worker를 만들지 않음
        release.set()
        await asyncio.wait_for(asyncio.gather(*jobs.values()),5)
        results=[await completions.get() for _ in jobs]
        results.sort(key=lambda x:x['worker'])
        assert len(results[0]['updates'])==2 and len(results[1]['updates'])==1
        return results,observed
    finally:
        for t in jobs.values():
            if not t.done(): t.cancel()
        await asyncio.gather(*jobs.values(),return_exceptions=True)
results,observed=await experiment()
print(results)
'''),
code('''class Publication(TypedDict):
    evidence: list[str]
    draft: str
    delivery: str

def compose(s): return {'draft':'검토 결과\\n'+'\\n'.join('- '+x for x in s['evidence'])}
def approve(s):
    answer=interrupt({'action':'로컬 보고서 확정','draft':s['draft']})
    return {'delivery':s['draft'] if answer is True else '전달 거부'}
b=StateGraph(Publication)
b.add_node('router_compose',compose); b.add_node('approval',approve)
b.add_edge(START,'router_compose'); b.add_edge('router_compose','approval'); b.add_edge('approval',END)
app=b.compile(checkpointer=InMemorySaver())
initial={'evidence':[r['evidence'] for r in results],'draft':'','delivery':''}
config={'configurable':{'thread_id':'approval-1'}}
paused=app.invoke(initial,config)
assert paused['__interrupt__'] and paused['delivery']==''
accepted=app.invoke(Command(resume=True),config)
assert 'Router' in accepted['delivery']
config2={'configurable':{'thread_id':'approval-2'}}
app.invoke(initial,config2)
rejected=app.invoke(Command(resume=False),config2)
assert rejected['delivery']=='전달 거부'
print(accepted['delivery']); print(rejected['delivery'])
'''),
md('''## 결과 해석과 운영 차이
두 Worker가 동시에 장벽에 도달했으므로 한 Worker의 완료를 기다린 뒤 다음을 시작하지 않았음을 확인했습니다. 이는 LLM 성능 benchmark가 아닙니다. 각 Worker가 받은 updates 목록이 달라 문맥 격리를 확인했습니다. 여기서 후속 지시는 기록만 하며 진행 중 모델 prompt 변경까지 구현하지 않았습니다.

interrupt 노드는 재개 시 처음부터 다시 실행될 수 있습니다. 외부 전송 같은 부작용을 interrupt 앞에 두지 마세요. thread_id는 이 예제에서는 승인 실행의 checkpoint 키입니다. 설계 글의 외부 Thread와 자동으로 동일하지 않습니다. 실제 전송은 승인 후 outbox와 멱등키를 통해 처리해야 합니다.''')], '합격 기준: (1) read_local에 새 자료 provider를 연결 (2) Worker가 실패해도 Router가 오류를 사건으로 받기 (3) DB를 재연결해 중복 입력을 막기 (4) 승인 거부 시 outbox가 비어 있기. 먼저 한 항목을 골라 assert로 검사하세요.', '05의 Protocol/provider 교체를 read_local 내부에 적용할 수 있습니다. Worker 예외는 04의 failed 사건으로 변환하고, 06의 events 기본키로 중복을 거부합니다. DB transaction 안에서 완료 상태와 outbox를 함께 기록하면 저장 후 전송 전 장애를 복구할 수 있습니다. 원격 전송은 수신 측 멱등성도 필요합니다.')

save('08_optional_live_model','8. 선택 실습: 실제 모델로 교체하기',f'근거: 설계 아이디어를 LangChain 모델 adapter로 연결하는 교육용 확장. [원문]({ANN}).',[
md('''## 결정적 실습과 실제 모델 평가를 분리
앞선 과정은 구조를 검증했습니다. 의미 판단 능력, tool 선택 정확도, 지연·비용은 실제 모델로 별도 평가해야 합니다. 아래 셀은 기본적으로 네트워크 요청을 하지 않습니다.

환경에 DEEPSEEK_API_KEY, DEEPSEEK_MODEL을 안전하게 등록하고 api.deepseek.com 접근을 허용한 뒤 RUN_LIVE=1을 명시해야 실행합니다. 키를 노트북이나 출력에 붙여 넣지 마세요. 모델 이름은 계정에서 현재 지원하는 것을 사용합니다. 이 자료 제작 시 실제 모델 호출은 실행하지 않았습니다.

OpenAI 호환 chat API를 LangChain ChatOpenAI로 호출합니다. API 호환 세부사항과 모델 기능은 서비스 버전에 따라 확인해야 합니다. 키의 존재만으로 인증 성공을 판정하지 않습니다.'''),
code('''import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
if os.getenv('RUN_LIVE')=='1':
    if not os.getenv('DEEPSEEK_API_KEY') or not os.getenv('DEEPSEEK_MODEL'):
        raise RuntimeError('환경 설정에 DEEPSEEK_API_KEY와 DEEPSEEK_MODEL이 필요합니다')
    model=ChatOpenAI(model=os.environ['DEEPSEEK_MODEL'],
        api_key=os.environ['DEEPSEEK_API_KEY'],base_url='https://api.deepseek.com',
        timeout=30,max_retries=0)
    prompt=ChatPromptTemplate.from_messages([
        ('system','Router의 책임만 한국어 두 문장으로 설명하세요. 작업을 실행하지 마세요.'),
        ('human','{question}')])
    chain=prompt | model | StrOutputParser()
    answer=chain.invoke({'question':'Router와 Worker를 분리하는 이유는?'})
    assert answer.strip()
    print(answer)
else:
    print('SKIPPED: 실제 모델 호출은 RUN_LIVE=1에서만 실행합니다.')
'''),
md('''## 평가 설계
01의 RunnableLambda를 바꾸려면 chat model에 bind_tools([lookup])를 적용하고 AIMessage.tool_calls를 기존 graph가 처리하도록 연결합니다. 02의 semantic 정책은 단순 자유 텍스트보다 검증 가능한 분류 schema가 적합합니다. 분류 결과에 권한을 부여하지 말고 코드 정책을 별도로 유지하세요.

평가셋에 잡담, 명시 요청, 후속 취소, 같은 Thread의 새 과제, 중복 사건을 포함하세요. 처리율뿐 아니라 잘못 시작한 작업·놓친 취소·Router 호출 수·p95 응답 시간·token 사용량을 기록합니다. 원문 예비 실험 수치를 자신의 환경 성능으로 인용하지 마세요.''')], '의미 필터가 틀린 경우 두 종류(false positive/negative)를 정의하고 각각 세 사례씩 작성하세요.', '잡담을 작업으로 시작하면 false positive, 실제 오류 보고나 취소를 무시하면 false negative입니다. 단순 정확도 대신 사건 유형별 precision/recall과 사용자 개입량을 함께 비교하세요.')
print('Generated',len(list(OUT.glob('*.ipynb'))),'notebooks')

from build_prototype_materials import annotate_basics
annotate_basics(OUT)
