import { randomBytes,createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { delimiter } from 'node:path';
import { Engine } from './engine.ts';
import type { Ticket } from './model.ts';
import { prepare } from './workspace.ts';
import type { Worker } from './worker.ts';
export class Tokens {
  readonly values=new Map<string,{id:string;turn:number}>();
  issue(id:string,turn:number):string{const token=randomBytes(32).toString('hex');this.values.set(this.hash(token),{id,turn});return token;}
  resolve(token:string){return this.values.get(this.hash(token));}
  revoke(token:string):void{this.values.delete(this.hash(token));}
  private hash(token:string):string{return createHash('sha256').update(token).digest('hex');}
}
/** N ordinary slots plus a reserved slot for a human follow-up to an existing ticket. */
export class Executor {
  readonly engine:Engine;readonly worker:Worker;readonly tokens:Tokens;
  readonly repo:string;readonly base:string;readonly max:number;readonly prepareWorkspace:typeof prepare;
  url='';closing=false;
  readonly active=new Map<string,{controller:AbortController;promise:Promise<void>}>();
  constructor(engine:Engine,worker:Worker,tokens:Tokens,repo:string,base='HEAD',max=2,prepareWorkspace:typeof prepare=prepare){
    if(!Number.isInteger(max)||max<1)throw new Error('invalid worker limit');
    this.engine=engine;this.worker=worker;this.tokens=tokens;this.repo=repo;this.base=base;this.max=max;this.prepareWorkspace=prepareWorkspace;
  }
  pump(now=Date.now()):void{
    for(const [id,job] of this.active)if(this.engine.ticket(id).ended==='human')job.controller.abort();
    if(this.closing)return;
    const queued=this.engine.store.all<Ticket>('ticket').filter(t=>!t.ended&&!t.running&&t.wake&&t.due<=now)
      .sort((a,b)=>Number(b.humanWake&&b.turn>0)-Number(a.humanWake&&a.turn>0));
    for(const t of queued){
      if(this.active.has(t.id))continue;
      if(this.active.size>=this.max && !(this.active.size===this.max && t.humanWake&&t.turn>0))continue;
      const started=this.engine.begin(t.id),controller=new AbortController();
      const token=this.tokens.issue(t.id,started.turn);
      const promise=this.execute(started,token,controller.signal).finally(()=>{this.tokens.revoke(token);this.active.delete(t.id);});
      this.active.set(t.id,{controller,promise});
    }
  }
  private async execute(t:Ticket,token:string,signal:AbortSignal):Promise<void>{
    try{
      await this.prepareWorkspace(this.repo,this.base,t);
      const inputs=this.engine.store.get<Ticket['inputs']>('batch',`${t.id}/${t.turn}`)??[];
      const message=[t.recovery,...inputs.map(i=>`Trigger id: ${i.trigger.id}\n${i.trigger.bot?'Context':'Person'} @${i.trigger.actor}: ${i.trigger.text}`)].filter(Boolean).join('\n\n');
      const instructions=await readFile(new URL('../prompts/worker.md',import.meta.url),'utf8');
      const env={...process.env,PATH:fileURLToPath(new URL('../bin/',import.meta.url))+delimiter+(process.env.PATH??''),SUPERAGENT_TICKET:t.id,SUPERAGENT_NAME:this.engine.config.agent,SUPERAGENT_DIR:t.directory,
        SUPERAGENT_BRANCH:t.branch,SUPERAGENT_ORIGIN_TRIGGER:t.origin,SUPERAGENT_GITHUB_REPO:this.engine.config.repo,
        SUPERAGENT_GITHUB_ACCOUNT:this.engine.config.agent,SUPERAGENT_URL:this.url,SUPERAGENT_TOKEN:token};
      const result=await this.worker.run({ticket:t,message,instructions,env,signal});this.engine.finish(t.id,t.turn,result,Date.now());
    }catch(error){this.engine.finish(t.id,t.turn,{ok:false,error:error instanceof Error?error.message:String(error)},Date.now());}
  }
  async close():Promise<void>{this.closing=true;for(const job of this.active.values())job.controller.abort();await Promise.all([...this.active.values()].map(j=>j.promise));}
}
