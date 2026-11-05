import { createServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Engine,stage } from './engine.ts';
import { mention } from './github.ts';
import type { Executor,Tokens } from './executor.ts';
import type { Message,Ticket } from './model.ts';
async function body(request:IncomingMessage):Promise<unknown>{
  if(!request.headers['content-type']?.startsWith('application/json'))throw new Error('application/json required');
  let text='';for await(const chunk of request){text+=String(chunk);if(Buffer.byteLength(text)>32_000)throw new Error('request too large');}
  return JSON.parse(text);
}
export function view(engine:Engine){
  const attention=['awaiting-answer','blocked','failed','awaiting-review'];
  return {tickets:engine.store.all<Ticket>('ticket').map(t=>({id:t.id,origin:t.origin,thread:t.threads[0],stage:stage(t),
    sessionId:t.sessionId,branch:t.branch,turn:t.turn,running:t.running,summary:t.summary,question:t.question,ended:t.ended}))
    .sort((a,b)=>Number(attention.includes(b.stage))-Number(attention.includes(a.stage))),messages:engine.store.all<Message>('message')};
}
export function createHost(engine:Engine,executor:Executor,tokens:Tokens){
  return createServer(async(request,response)=>{
    response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');
    try{
      if(request.method==='GET'&&request.url==='/'){
        response.setHeader('Content-Type','text/html; charset=utf-8');response.end(html);return;
      }
      if(request.method==='GET'&&request.url==='/api/state'){
        response.setHeader('Content-Type','application/json; charset=utf-8');response.end(JSON.stringify(view(engine)));return;
      }
      if(request.method!=='POST'){response.writeHead(404);response.end('not found');return;}
      if(request.url==='/api/worker'){
        const bearer=request.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
        const identity=bearer?tokens.resolve(bearer):undefined;if(!identity)throw new Error('invalid worker token');
        const result=engine.command(identity.id,identity.turn,await body(request));
        response.setHeader('Content-Type','application/json');response.end(JSON.stringify(result));return;
      }
      if(request.url==='/api/local'){
        if(request.headers.origin && request.headers.origin!==executor.url)throw new Error('foreign origin');
        const input=z.object({text:z.string().trim().min(1).max(8000),thread:z.string().startsWith('local:').optional()}).strict().parse(await body(request));
        const result=engine.receive({id:randomUUID(),source:'local',thread:input.thread??`local:${randomUUID()}`,
          actor:engine.config.allow[0],bot:false,addressed:!input.thread||mention(input.text,engine.config.agent),text:input.text});
        executor.pump();response.setHeader('Content-Type','application/json');response.end(JSON.stringify(result));return;
      }
      response.writeHead(404);response.end('not found');
    }catch(error){response.writeHead(403,{'Content-Type':'application/json'});response.end(JSON.stringify({refused:error instanceof Error?error.message:'invalid request'}));}
  });
}
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><title>Guide build lab</title>
<style>body{font:16px system-ui;margin:40px auto;max-width:1050px;padding:0 20px;color:#243449}textarea{width:100%;height:85px}button,select{padding:10px;margin:8px 0}article{padding:18px;border:1px solid #ddd;border-radius:10px;margin:12px 0}small{color:#64748b}pre{white-space:pre-wrap}</style>
<h1>팀 작업함 실습</h1><p>요청을 보내고 같은 작업에 후속 메시지를 이어 보내세요. 모의 Worker가 실제 로컬 worktree에 파일을 커밋합니다.</p>
<select id="thread"><option value="">새 작업</option></select><textarea id="request" placeholder="실습 요청을 적으세요"></textarea><button id="send">요청 보내기</button><p id="notice"></p><main id="tickets"></main><h2>호스트 메시지</h2><section id="messages"></section>
<script>
const q=id=>document.getElementById(id);let known='';
async function refresh(){const data=await(await fetch('/api/state')).json();q('tickets').replaceChildren();q('messages').replaceChildren();
for(const t of data.tickets){const card=document.createElement('article');const title=document.createElement('strong');title.textContent=t.stage;card.append(title);const info=document.createElement('pre');info.textContent=t.question||t.summary||'요청을 처리하고 있습니다.';card.append(info);q('tickets').append(card);}
for(const m of data.messages){const p=document.createElement('p');p.textContent=m.purpose+' · '+m.text;q('messages').append(p);}
const signature=data.tickets.map(t=>t.id).join(',');if(signature!==known){known=signature;const selected=q('thread').value;q('thread').replaceChildren(new Option('새 작업',''));for(const t of data.tickets)q('thread').add(new Option(t.stage+' · '+t.id.slice(0,8),t.thread));q('thread').value=selected;}}
q('send').onclick=async()=>{const value={text:q('request').value};if(q('thread').value)value.thread=q('thread').value;const r=await fetch('/api/local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});q('notice').textContent=r.ok?'접수했습니다':await r.text();if(r.ok)q('request').value='';await refresh();};refresh();setInterval(refresh,1000);
</script></html>`;
