import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import type { Ticket } from './model.ts';
import { runProcess } from './process.ts';
export interface Turn { ticket:Ticket; message:string; instructions:string; env:NodeJS.ProcessEnv; signal:AbortSignal }
export interface Result { ok:boolean;sessionId?:string;text:string;error?:string;transient?:boolean;costUsd?:number }
export interface Worker { run(turn:Turn):Promise<Result> }
export function transient(value:string):boolean{return /\b(408|429|5\d\d)\b|overloaded|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(value);}
export function plan(adapter:'claude-code'|'opencode',turn:Turn,first=adapter==='opencode'?!turn.ticket.sessionEstablished:turn.ticket.turn===1):{command:string;args:string[];input:string}{
  const t=turn.ticket;
  if(adapter==='claude-code')return {command:'claude',args:['-p','--output-format','json','--append-system-prompt',turn.instructions,
    first?'--session-id':'--resume',t.sessionId,'--dangerously-skip-permissions'],input:turn.message};
  const message=first?`<instructions>${turn.instructions}</instructions>\n${turn.message}`:`Follow your original worker instructions.\n${turn.message}`;
  return {command:'opencode',args:['run','--format','json','--auto',...first?[]:['--session',t.sessionId],message],input:''};
}
export function parseClaude(stdout:string,code:number|null):Result{
  const schema=z.object({result:z.string().optional(),session_id:z.string().optional(),is_error:z.boolean().optional(),
    api_error_status:z.union([z.number(),z.string()]).optional(),total_cost_usd:z.number().optional()});
  const r=schema.parse(JSON.parse(stdout));const ok=code===0&&!r.is_error;
  const error=ok?undefined:`${r.api_error_status??''} ${r.result??'Claude failed'}`.trim();
  return {ok,sessionId:r.session_id,text:r.result??'',error,transient:error?transient(error):false,costUsd:r.total_cost_usd};
}
export function parseOpenCode(stdout:string,code:number|null):Result{
  const schema=z.object({type:z.string(),sessionID:z.string().optional(),part:z.object({text:z.string().optional()}).optional(),error:z.unknown().optional()});
  let sessionId:string|undefined,text='',error:string|undefined;
  for(const line of stdout.split('\n').filter(s=>s.trim())){const e=schema.parse(JSON.parse(line));sessionId=e.sessionID??sessionId;
    if(e.type==='text')text=e.part?.text??text;if(e.type==='error')error=JSON.stringify(e.error??e);}
  if(code!==0&&!error)error=`OpenCode exit ${code}`;
  if(!sessionId)throw new Error('OpenCode returned no sessionID');
  return {ok:code===0&&!error,sessionId,text,error,transient:error?transient(error):false};
}
/** Live adapters are opt-in library components; the demo application always selects MockWorker. */
export class CliWorker implements Worker {
  readonly adapter:'claude-code'|'opencode';
  constructor(adapter:'claude-code'|'opencode'){this.adapter=adapter;}
  async run(turn:Turn):Promise<Result>{
    let p=plan(this.adapter,turn);
    let r=await runProcess(p.command,p.args,{cwd:turn.ticket.directory,input:p.input,env:turn.env,signal:turn.signal});
    if(this.adapter==='claude-code'&&r.code!==0&&/No conversation found|already in use/i.test(r.stderr+r.stdout)){
      p=plan(this.adapter,turn,/No conversation found/i.test(r.stderr+r.stdout));
      r=await runProcess(p.command,p.args,{cwd:turn.ticket.directory,input:p.input,env:turn.env,signal:turn.signal});
    }
    if(!r.stdout.trim())return {ok:false,text:'',error:r.stderr,transient:transient(r.stderr)};
    return this.adapter==='claude-code'?parseClaude(r.stdout,r.code):parseOpenCode(r.stdout,r.code);
  }
}
export class MockWorker implements Worker {
  async run(turn:Turn):Promise<Result>{
    const result=await runProcess(process.execPath,[fileURLToPath(new URL('./mock-worker.ts',import.meta.url))],{
      cwd:turn.ticket.directory,env:turn.env,signal:turn.signal,input:JSON.stringify({sessionId:turn.ticket.sessionId,message:turn.message}),
    });
    return parseClaude(result.stdout,result.code);
  }
}
