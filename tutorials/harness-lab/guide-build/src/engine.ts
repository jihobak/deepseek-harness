import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { TriggerSchema, WorkerCommand } from './model.ts';
import type { Command, Config, Message, Ticket, Trigger } from './model.ts';
import { Store } from './store.ts';
export interface Route { kind: 'new' | 'followup' | 'context' | 'stop' | 'ignored' | 'duplicate'; tickets: string[]; reason?: string }

/** The source guide supplies gate order; this engine makes its persistence explicit. */
export class Engine {
  readonly store: Store;
  readonly config: Config;
  readonly workRoot: string;
  constructor(store: Store, config: Config, workRoot: string) { this.store=store; this.config=config; this.workRoot=workRoot; }
  ticket(id: string): Ticket {
    const t=this.store.get<Ticket>('ticket',id); if (!t) throw new Error('unknown ticket'); return t;
  }
  receive(raw: unknown): Route {
    const trigger=TriggerSchema.parse(raw);
    return this.store.atomic(() => {
      if (this.store.get('trigger',trigger.id)) return {kind:'duplicate',tickets:[]};
      this.store.put('trigger',trigger.id,trigger);
      const result=this.route(trigger);
      this.store.put('disposition',trigger.id,result); return result;
    });
  }
  private route(trigger: Trigger, exclude?: string): Route {
    const same=(a: string,b: string) => a.toLowerCase()===b.toLowerCase();
    const allowed=this.config.allow.some(a => same(a,trigger.actor));
    const subscribed=this.store.all<Ticket>('ticket').filter(t => t.id!==exclude && t.threads.includes(trigger.thread));
    const live=subscribed.filter(t => !t.ended);
    if (same(trigger.actor,this.config.agent)) return {kind:'ignored',tickets:[],reason:'own_account'};
    if (!trigger.bot && allowed && trigger.addressed && /\b(stop|cancel|abort)\b/i.test(trigger.text) && live.length) {
      for (const t of live) { t.ended='human'; t.wake=false; this.store.put('ticket',t.id,t); }
      return {kind:'stop',tickets:live.map(t=>t.id)};
    }
    const targets=trigger.bot ? live : subscribed.filter(t => t.ended!=='human' &&
      (!t.ended || this.config.allow.some(a=>same(a,t.requester))));
    if (targets.length) {
      for (const t of targets) {
        if (t.inputs.some(i => i.trigger.id === trigger.id)) continue;
        if (!trigger.bot) delete t.ended;
        t.inputs.push({trigger,consumed:false});
        const wake=!trigger.bot || (!['blocked','failed'].includes(t.report) && trigger.ci!=='pass');
        t.wake ||= wake; t.humanWake ||= !trigger.bot;
        if (!trigger.bot) { t.retries=0; t.due=0; }
        this.store.put('ticket',t.id,t);
      }
      return {kind:trigger.bot?'context':'followup',tickets:targets.map(t=>t.id)};
    }
    if (trigger.bot || !allowed || !trigger.addressed) return {
      kind:'ignored',tickets:[],reason:trigger.bot?'bot_not_admitted':!allowed?'not_on_allow_list':'not_addressed',
    };
    const id=randomUUID();
    const t:Ticket={id,requester:trigger.actor,origin:trigger.id,threads:[trigger.thread],inputs:[{trigger,consumed:false}],
      sessionId:randomUUID(),sessionEstablished:false,branch:`agent/${id}`,directory:join(this.workRoot,id),turn:0,running:false,
      report:'waiting',reportedTurn:0,question:'',summary:'',prs:[],wake:true,humanWake:false,retries:0,due:0,recovery:''};
    this.store.put('ticket',id,t); return {kind:'new',tickets:[id]};
  }
  begin(id: string): Ticket {
    return this.store.atomic(()=>{
      const t=this.ticket(id); if(t.ended || t.running || !t.wake) throw new Error('ticket cannot start');
      t.turn++; t.running=true; t.wake=false; t.humanWake=false;
      this.store.put('batch',`${id}/${t.turn}`,t.inputs.filter(i=>!i.consumed&&!i.handedBack));
      t.inputs.forEach(i=>{i.consumed=true;}); this.store.put('ticket',id,t); return t;
    });
  }
  private message(t: Ticket,to: string,text: string,purpose: Message['purpose'],key: string): void {
    const target=t.inputs.find(i=>i.trigger.id===to && !i.handedBack);
    if (!target) throw new Error('trigger did not reach this ticket');
    if(text.trim().split(/\s+/u).length>this.config.maxWords) throw new Error('word limit exceeded');
    if(this.store.get('message',key)) return;
    const order=(this.store.get<number>('counter','message')??0)+1;
    this.store.put('counter','message',order);
    this.store.put('message',key,{id:key,order,ticketId:t.id,thread:target.trigger.thread,text,purpose,state:'pending',attempts:0,due:0} satisfies Message);
  }
  /** Distinct content is a new message; an exact retry keeps its delivery state. */
  private contentKey(prefix: string, to: string, text: string): string {
    return `${prefix}/${createHash('sha256').update(JSON.stringify([to,text])).digest('hex')}`;
  }
  command(id: string,turn: number,raw: unknown): unknown {
    const c=WorkerCommand.parse(raw);
    return this.store.atomic(()=>{
      const t=this.ticket(id);
      if(t.ended || !t.running || t.turn!==turn) throw new Error('inactive or stale worker');
      if(c.command==='show') return t;
      if(c.command==='ack' || c.command==='reply') {
        const to=c.to??t.origin;
        this.message(t,to,c.text,c.command==='ack'?'ack':'answer',c.command==='ack'?`${id}/ack/${to}`:this.contentKey(`${id}/answer/${turn}`,to,c.text));
        return {ok:true};
      }
      if(c.command==='handback') {
        const input=t.inputs.find(i=>i.trigger.id===c.trigger);
        if(!input || input.handedBack || input.trigger.id===t.origin) throw new Error('cannot hand back this trigger');
        input.handedBack=true; input.consumed=true;
        if (!t.inputs.some(i=>!i.consumed&&!i.handedBack)) { t.wake=false; t.humanWake=false; }
        this.store.put('ticket',id,t);
        const result=this.route(input.trigger,id);
        this.store.put('handback',`${id}/${c.trigger}`,{reason:c.reason,result}); return result;
      }
      this.applyReport(t,c);
      this.store.put('ticket',id,t); return {ok:true};
    });
  }
  private applyReport(t: Ticket,c: Extract<Command,{command:'report'}>): void {
    if(c.status==='progress' && (c.message || c.question)) throw new Error('progress cannot notify people');
    if(c.pr && !t.prs.some(p=>p.number===c.pr)) {
      t.prs.push({number:c.pr,state:'open'}); t.threads.push(`github:${this.config.repo}#${c.pr}`);
    }
    t.report=c.status; t.reportedTurn=t.turn; t.summary=c.summary??''; t.question=c.question??'';
    const message=c.message||(c.status==='blocked'?c.question:undefined);
    if(message && c.status!=='dropped') this.message(t,c.to??t.origin,message,
      c.status==='blocked'||c.status==='failed'?'attention':'result',this.contentKey(`${t.id}/report/${t.turn}/${c.status}`,c.to??t.origin,message));
    if(c.status==='dropped') t.ended='dropped';
    if(c.status==='ready' && !t.prs.length && !t.wake) t.ended='completed';
    if(c.status==='ready') this.endForPRs(t);
  }
  closePR(number: number,state:'merged'|'closed'): void {
    this.store.atomic(()=>{for(const t of this.store.all<Ticket>('ticket')) {
      const pr=t.prs.find(p=>p.number===number); if(!pr || t.ended==='human' || pr.state===state) continue;
      pr.state=state;
      if(!t.running) this.endForPRs(t);
      this.store.put('ticket',t.id,t);
    }});
  }
  private endForPRs(t: Ticket): void {
    if(t.inputs.some(i=>!i.consumed&&!i.handedBack&&!i.trigger.bot))return;
    if(t.prs.length && t.prs.every(p=>p.state!=='open')) t.ended=t.prs.every(p=>p.state==='merged')?'merged':'closed';
  }
  finish(id:string,turn:number,result:{ok:boolean;sessionId?:string;error?:string;transient?:boolean},now:number):void {
    this.store.atomic(()=>{
      const t=this.ticket(id); if(t.turn!==turn || !t.running) return;
      if(result.sessionId) {t.sessionId=result.sessionId;t.sessionEstablished=true;}
      t.running=false;
      if(!t.ended && !result.ok && result.transient && t.retries<3) {
        t.retries++;t.due=now+1000*2**(t.retries-1);t.wake=true;
        this.restoreBatch(t);t.recovery='Retry: inspect existing changes and remote state before repeating actions.';
      } else if(!t.ended && (!result.ok || t.reportedTurn!==turn)) {
        t.report='failed';t.question='';t.summary=result.error??'Worker exited without sa report';
        this.message(t,t.origin,'Worker failed; inspect the local panel before retrying.','attention',`${id}/failure/${turn}`);
      }
      this.store.put('ticket',id,t);
    });
  }
  private restoreBatch(t:Ticket):void {
    const batch=this.store.get<Ticket['inputs']>('batch',`${t.id}/${t.turn}`)??[];
    for(const item of t.inputs) if(!item.handedBack && batch.some(b=>b.trigger.id===item.trigger.id)) item.consumed=false;
  }
  /** Host shutdown preserves pending work; a person's stop remains terminal. */
  interrupt(id:string,turn:number):void {
    this.store.atomic(()=>{
      const t=this.ticket(id); if(!t.running || t.turn!==turn) return;
      this.interruptInside(t); this.store.put('ticket',id,t);
    });
  }
  private interruptInside(t:Ticket):void {
    t.running=false;
    if(!t.ended) {
      this.restoreBatch(t); t.wake=true;
      t.recovery='Restart recovery: check git history, directory and GitHub before repeating actions. Interrupted inputs are included below.';
    }
  }
  recover():void {
    this.store.atomic(()=>{for(const t of this.store.all<Ticket>('ticket')) {
      if(!t.running) continue; this.interruptInside(t);
      this.store.put('ticket',t.id,t);
    }});
  }
}
export function stage(t:Ticket):string {
  if(t.ended) return 'ended'; if(t.running) return 'working'; if(t.wake) return 'queued';
  if(t.report==='blocked') return t.question?'awaiting-answer':'blocked';
  if(t.report==='failed') return 'failed'; if(t.report==='ready') return 'awaiting-review'; return 'idle';
}
