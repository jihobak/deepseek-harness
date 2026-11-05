"""Generate independent Python labs for the public prototype's domain invariants."""
from pathlib import Path
from textwrap import dedent
import nbformat as n
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'notebooks'
URL='https://github.com/deepseek-ai/dsh-superagent-prototype'
def md(s): return n.v4.new_markdown_cell(dedent(s).strip())
def code(s): return n.v4.new_code_cell(dedent(s).strip())
def save(name,title,source,cells):
    nb=n.v4.new_notebook(cells=[md(f'# {title}\n\n원본: {URL}\n\n근거 파일: {source}\n\n**범위:** 원본은 TypeScript/Cordis입니다. 아래는 원본의 일부 불변조건을 Python/LangGraph로 실험하며 공식 API 호환 구현이 아닙니다. 새 커널에서 순서대로 실행합니다. 외부 API 호출이 없습니다.')]+cells,metadata={'kernelspec':{'name':'harness-lab','display_name':'Python (Harness Lab)','language':'python'},'language_info':{'name':'python','version':'3.12'}})
    n.write(nb,OUT/(name+'.ipynb'))
def annotate_basics(out=OUT):
    notes={
      '00_reading_map.ipynb':'공개 dsh-superagent-prototype을 추가 분석했습니다. 연구 글과 동일한 구현은 아닙니다. [추가 분석](../PROTOTYPE_ANALYSIS.ko.md)과 09–11 실습을 이어서 보세요.',
      '02_router_triggers.ipynb':'이 노트북의 semantic → routing 순서는 교육용 단순화입니다. 공개 프로토타입 Intake는 SourceScope 필터 뒤 **구독 fan-out을 먼저** 하고, Ticket Worker가 소유한 사람 후속 메시지는 Eval을 생략합니다. bot/CI 및 context-only follow는 다르게 처리합니다. 또한 실제 Main Session에는 bash/read 도구가 있고 실행 역할 제한은 프롬프트 규칙입니다. 09–10에서 차이를 실습합니다.',
      '06_persistence_watchdog.ipynb':'프로토타입은 SQLite·Effects·재시작 복구·HealthBoard를 구현하지만, 연구 글의 독립 LLM Watchdog와 다중 장치 BYOM 전체를 구현했다고 확인할 근거는 찾지 못했습니다. 이 노트북의 Watchdog 규칙은 설계 개념 실습입니다. 11은 실제 prototype Effects의 generation 보호를 다룹니다.',
      '07_capstone.ipynb':'이 통합 예제의 LangGraph interrupt는 교육용 선택이며, 프로토타입의 Mandate/Policy 검증과 동일한 구현이 아닙니다. 원본에서는 Ticket과 Assignment를 구분하고, Engine 트랜잭션과 영속 Effects로 부작용을 관리합니다. 후속 과정 09–11을 참고하세요.',
    }
    for name,text in notes.items():
        p=out/name
        if not p.exists(): continue
        nb=n.read(p,as_version=4)
        marker='## 공개 프로토타입과의 차이'
        nb.cells=[c for c in nb.cells if not(c.cell_type=='markdown' and c.source.startswith(marker))]
        nb.cells.append(md(marker+'\n\n'+text)); n.write(nb,p)
def build():
    save('09_prototype_admission','9. 요청의 강도와 Mandate: 모델이 승인해도 실행되지 않는 경우',
         '`src/policy.ts`: settingsPolicy, assessmentOutcome, policyVersion; `src/core/evals.ts`',[
    md('''## 목표: 판단 결과와 권한을 분리
원본의 gate는 explicit/inferred/ignore를 구분합니다. allowed sender가 직접 요청하면 explicit 경로이며 모든 규칙의 의미 평가가 필수인 경로는 아닙니다. inferred 후보는 활성 규칙 전체 평가, 명확한 구현 방향, intent evidence를 요구합니다. observe 모드는 would_accept만 기록합니다. 실행 중 정책 버전이 바뀌면 오래된 판단은 무효입니다.

아래 graph는 **inferred 후보 경로만** 모델링합니다. `assess`는 고정된 판단 대역이고 `validate`는 host의 결정적 검증입니다. LangGraph를 쓰는 위치는 우리 교육용 선택입니다.'''),
    code('''from typing import TypedDict
from langgraph.graph import StateGraph, START, END
class State(TypedDict):
    mode: str
    snapshot_version: int
    current_version: int
    matched: bool
    implementation_requested: bool
    target_settled: bool
    design_decision: bool
    evidence: str
    judgment: str
    outcome: str

def assess(s): return {'judgment':'accept'}
def validate(s):
    if s['snapshot_version']!=s['current_version']: return {'outcome':'unavailable:stale-policy'}
    if s['mode']=='off': return {'outcome':'ignore:disabled'}
    if not(s['implementation_requested'] and s['target_settled']) or s['design_decision']:
        return {'outcome':'ignore:direction-unsettled'}
    if not s['matched']: return {'outcome':'ignore:no-rule'}
    if not s['evidence']: raise ValueError('accept에는 intent evidence가 필요합니다')
    return {'outcome':'would_accept' if s['mode']=='observe' else 'accept'}
g=StateGraph(State)
g.add_node('assessment',assess); g.add_node('host_validation',validate)
g.add_edge(START,'assessment'); g.add_edge('assessment','host_validation'); g.add_edge('host_validation',END)
app=g.compile()
base={'mode':'observe','snapshot_version':1,'current_version':1,'matched':True,
      'implementation_requested':True,'target_settled':True,'design_decision':False,
      'evidence':'명시된 오탈자를 기존 표기에 맞춰 수정','judgment':'','outcome':''}
assert app.invoke(base)['outcome']=='would_accept'
assert app.invoke({**base,'mode':'auto'})['outcome']=='accept'
assert app.invoke({**base,'current_version':2})['outcome']=='unavailable:stale-policy'
assert app.invoke({**base,'design_decision':True})['outcome']=='ignore:direction-unsettled'
assert app.invoke({**base,'mode':'off'})['outcome']=='ignore:disabled'
print('모델 accept와 host 승인은 다릅니다:',app.invoke(base)['outcome'])
'''),
    md('''## 권한의 범위는 입력과 함께 커지지 않는다
Mandate는 승인 당시 scope, strength, actor, policy version, rules를 보존합니다. 새로운 메시지는 context가 될 수 있지만 scope를 자동 확장하지 않습니다. 원본의 scope 준수에는 모델 프롬프트도 참여하므로 아래 단순 집합 검사처럼 모든 의미적 scope가 코드로 판정되는 것은 아닙니다.'''),
    code('''from dataclasses import dataclass
@dataclass(frozen=True)
class Mandate:
    scope: frozenset[str]
    policy_version: int
    strength: str
m=Mandate(frozenset({'fix-typo'}),1,'inferred')
new_message='같이 결제 API도 바꿔 주세요'
assert 'redesign-payment' not in m.scope
try:
    app.invoke({**base,'evidence':''})
except ValueError:
    print('근거 없는 accept 거부')
else: raise AssertionError('누락된 evidence가 통과함')
assert m.scope==frozenset({'fix-typo'})
'''),
    md('''## 과제와 해설
과제: 규칙 id 목록이 `copy, visual`인데 모델이 `copy`만 평가하면 거부하도록 확장하세요. 해설: 원본 assessmentOutcome은 활성 rule 각각이 정확히 한 번 등장하는지 검사합니다. 단순히 하나라도 matched라고 승인하면 누락된 규칙과 알 수 없는 규칙을 검증하지 못합니다. policyVersion은 모델 설정·concurrency 변경 모두를 포함하는 전체 설정 revision과도 다릅니다.''')])
    save('10_prototype_ticket_lifecycle','10. Subscription은 문맥, Mandate는 권한, Assignment는 실행 시도',
         '`src/core/intake.ts`, `tickets.ts`, `assignments.ts`; `tests/core-engine.spec.ts`, `followups.spec.ts`',[
    md('''## 하나의 상태 변수로 표현할 수 없는 이유
Ticket은 승인된 일이며 Assignment는 그 일을 수행하는 실행 시도입니다. Ticket 하나에 Assignment가 여러 번 생길 수 있습니다. `blocked/failed` 보고는 작업 전체의 권한 철회와 다릅니다. 원본에서 사람 stop은 Mandate를 철회하므로 다시 전달하거나 자동 resume하지 않습니다.

아래는 사람 후속 메시지, bot, context-only 구독을 비교하는 축소 모델입니다. SourceScope 수신 필터·트랜잭션·원본의 모든 종료 규칙은 생략했습니다.'''),
    code('''from dataclasses import dataclass, field
@dataclass
class Ticket:
    status: str='open'
    ended_by: str|None=None
    mandate_valid: bool=True
    assignment: int=1
    inputs: list[str]=field(default_factory=list)
    reports: list[str]=field(default_factory=list)

def receive(t, text, *, human=True, context_only=False):
    if t.ended_by=='human': return {'delivered':False,'eval':True}
    if t.status=='ended':
        if not human or context_only or not t.mandate_valid:
            return {'delivered':False,'eval':True}
        t.status='open'; t.ended_by=None; t.assignment+=1
    t.inputs.append(text)
    return {'delivered':True,'eval':not human or context_only}
def report(t, assignment, text):
    if assignment!=t.assignment or t.status!='open': return False
    t.reports.append(text); return True

t=Ticket()
assert receive(t,'범위 내 후속 요청')=={'delivered':True,'eval':False}
assert receive(t,'CI 실패',human=False)=={'delivered':True,'eval':True}
assert receive(t,'관련 대화',context_only=True)=={'delivered':True,'eval':True}
t.status='ended'; t.ended_by='executor'
assert not receive(t,'CI 재시도',human=False)['delivered']
assert t.status=='ended'
assert receive(t,'다시 확인해 주세요')['delivered'] and t.assignment==2
assert not report(t,1,'이전 실행이 늦게 반환한 완료')
assert report(t,2,'현재 실행 보고')
print('작업은 유지, 실행 시도는 교체:',t)
'''),
    code('''stopped=Ticket(status='ended',ended_by='human',mandate_valid=False)
assert not receive(stopped,'새 댓글')['delivered']
assert stopped.status=='ended'
context=Ticket(status='ended',ended_by='executor')
assert not receive(context,'참고용 메시지',context_only=True)['delivered']
revoked=Ticket(status='ended',ended_by='executor',mandate_valid=False)
assert not receive(revoked,'resume 요청')['delivered']
print('사람 stop / context-only / 재검증 실패는 자동 resume하지 않음')
'''),
    md('''## 원본의 더 정교한 조건
원본은 delivered와 model history에 들어간 read도 구분합니다. 재시작 후 unread 입력을 재전달하되 이미 처리된 외부 작업은 점검하도록 recovery note를 보냅니다. 정책 변경은 진행 중 Ticket을 일괄 취소하는 대신 변경 내용을 전달하며, ended Ticket의 resume 시 현재 정책으로 다시 검증합니다. PR의 ready 보고와 PR merge/close도 같은 종료 조건이 아닙니다.

## 과제와 해설
과제: Thread 둘이 하나의 Ticket에 연결된 경우 동일 Trigger가 두 번 전달되지 않게 만드세요. 해설: 원본 Intake의 reached Map은 Ticket ID별로 합치며, 한 경로라도 소유 구독이면 context-only로 잘못 분류하지 않습니다. Correlation만 있는 Thread로는 라우팅하지 않아야 합니다.''')])
    save('11_prototype_durable_effects','11. SQLite Effects: 롤백, 재시도, 오래된 완료의 경쟁',
         '`src/app/effects.ts`, `outbox.ts`, `store.ts`, `src/sources/github-channel.ts`; `tests/effects.spec.ts`',[
    md('''## 왜 graph checkpoint만으로 부족한가
승인 상태 저장과 메시지 전송 사이에 장애가 나면 무엇이 남을까요? 원본은 도메인 변경과 effect enqueue를 같은 SQLite 트랜잭션에 넣습니다. 외부 I/O는 커밋 후 수행합니다. Effects는 `(kind,key)`로 합치고 payload 갱신 시 generation을 증가시킵니다. 예전 실행의 완료가 새 payload를 삭제하지 않도록 seq/generation을 비교합니다.

아래는 실패를 의도적으로 주입하는 실습입니다. SQLite 및 원본과 같은 조건부 DELETE를 실제 실행하지만 production queue 전체를 구현하지 않습니다.'''),
    code('''import sqlite3, tempfile
from pathlib import Path
from contextlib import closing
workspace=tempfile.TemporaryDirectory()
path=Path(workspace.name)/'effects.sqlite'
db=sqlite3.connect(path)
db.executescript('''+repr('CREATE TABLE tickets(id TEXT PRIMARY KEY); CREATE TABLE effect(kind TEXT,key TEXT,payload TEXT,generation INTEGER,PRIMARY KEY(kind,key));')+''')
def enqueue(c,key,payload):
    c.execute("INSERT INTO effect VALUES ('reply',?,?,1) ON CONFLICT(kind,key) DO UPDATE SET payload=excluded.payload,generation=effect.generation+1",(key,payload))
try:
    with db:
        db.execute('INSERT INTO tickets VALUES (?)',('rollback',))
        enqueue(db,'r1','발송하면 안 되는 메시지')
        raise RuntimeError('커밋 직전 장애')
except RuntimeError: pass
assert db.execute('SELECT count(*) FROM tickets').fetchone()[0]==0
assert db.execute('SELECT count(*) FROM effect').fetchone()[0]==0
with db:
    db.execute('INSERT INTO tickets VALUES (?)',('t1',))
    enqueue(db,'r1','version 1')
old=db.execute('SELECT generation FROM effect WHERE key=?',('r1',)).fetchone()[0]
with db: enqueue(db,'r1','version 2')
with db:
    deleted=db.execute('DELETE FROM effect WHERE key=? AND generation=?',('r1',old)).rowcount
assert deleted==0
assert db.execute('SELECT payload FROM effect').fetchone()[0]=='version 2'
db.close()
with closing(sqlite3.connect(path)) as fresh:
    assert fresh.execute('SELECT payload FROM effect').fetchone()[0]=='version 2'
print('롤백 원자성, 오래된 완료 거부, DB 재연결 후 잔여 effect 보존 확인')
workspace.cleanup()
'''),
    md('''## 전송 성공 후 receipt 기록 전에 장애가 나면?
로컬 outbox의 중복 key만으로 외부 전송의 exactly-once를 보장할 수 없습니다. 원본 GitHub adapter는 `<!-- dsh-superagent:메시지ID -->` 마커를 기존 댓글에서 찾고, 있으면 재전송하지 않습니다. Feishu도 provider idempotency를 이용합니다. GitHub 방식은 read-before-write이므로 외부 서버의 원자적 멱등키와 동일하지 않고, 동시 writer·조회 가시성 등의 가정을 검토해야 합니다.'''),
    code('''external=[]
def send_with_marker(message_id,text):
    marker=f'<!-- dsh-superagent:{message_id} -->'
    if any(marker in body for body in external): return 'already-sent'
    external.append(text+'\\n'+marker)
    return 'sent'
# 외부에는 전달됐지만 로컬 receipt 기록 전에 장애가 났다고 가정
assert send_with_marker('m1','결과')=='sent'
assert send_with_marker('m1','결과')=='already-sent'
assert len(external)==1
print('로컬 재시도 시 기존 외부 마커 확인:',len(external),'message')
'''),
    md('''## 과제와 해설
과제: 두 sender가 동시에 조회하면 어떻게 될지 순서도를 그리세요. 해설: A 조회(없음) → B 조회(없음) → A POST → B POST이면 중복 가능합니다. 원본 stateDir lock과 reply concurrency=1은 단일 프로세스 내 경쟁을 제한하지만 외부 서비스 전체의 exactly-once 증명이 아닙니다. 다음 실습으로 retry backoff, pause, dropped receipt, generation 재등록을 추가해 보세요.''')])
    annotate_basics()
if __name__=='__main__': build()
