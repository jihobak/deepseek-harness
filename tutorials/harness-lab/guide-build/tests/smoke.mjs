import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const root=await mkdtemp(join(tmpdir(),'guide-smoke-'));
const script=fileURLToPath(new URL('../src/app.ts',import.meta.url));
async function boot(){
  const child=spawn(process.execPath,[script],{env:{...process.env,LAB_STATE:root,LAB_PORT:'0'},stdio:['ignore','pipe','pipe']});
  let stderr='';child.stderr.on('data',b=>{stderr+=b;});
  const closed=new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal})));
  async function stop(){const timer=setTimeout(()=>child.kill('SIGKILL'),7000);child.kill('SIGTERM');try{return await closed;}finally{clearTimeout(timer);}}
  try{
    const url=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(new Error('startup timeout '+stderr)),20_000);
      child.stdout.on('data',b=>{out+=b;const m=/http:\/\/127\.0\.0\.1:\d+/.exec(out);if(m){clearTimeout(timer);resolve(m[0]);}});
      child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',code=>{clearTimeout(timer);reject(new Error(`exit ${code}: ${stderr}`));});});
    const request=(path,options={})=>fetch(url+path,{...options,signal:AbortSignal.timeout(5000)});
    const state=async()=>await(await request('/api/state')).json();
    const post=async(text,thread)=>{const response=await request('/api/local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,thread})});assert.equal(response.status,200);return response.json();};
    return {url,stop,request,state,post};
  }catch(error){await stop();throw error;}
}
async function until(server,predicate){const end=Date.now()+15_000;while(Date.now()<end){const state=await server.state();const result=predicate(state);if(result)return result;await delay(50);}throw new Error('state did not converge: '+JSON.stringify(await server.state()));}
let server;
try{
  server=await boot();assert.match(await(await server.request('/')).text(),/팀 작업함/);
  const denied=await server.request('/api/worker',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+'a'.repeat(64)},body:JSON.stringify({command:'show'})});assert.equal(denied.status,403);
  const foreign=await server.request('/api/local',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.invalid'},body:JSON.stringify({text:'untrusted'})});assert.equal(foreign.status,403);
  const first=await server.post('First local task');const id=first.tickets[0];
  const done=await until(server,s=>s.tickets.find(t=>t.id===id&&t.ended==='completed'&&!t.running));
  const directory=join(root,'worktrees',id);
  const head1=execFileSync('git',['-C',directory,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  await server.post('Second local turn',done.thread);
  const follow=await until(server,s=>s.tickets.find(t=>t.id===id&&t.turn===2&&t.ended==='completed'&&!t.running));
  assert.equal(follow.sessionId,done.sessionId);assert.equal(follow.branch,done.branch);
  const head2=execFileSync('git',['-C',directory,'rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.notEqual(head1,head2);
  const records=(await readFile(join(directory,'agent-result.txt'),'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(records.length,2);assert.equal(records[0].session,records[1].session);
  const blocked=await server.post('fixture:block');const blockedId=blocked.tickets[0];
  const question=await until(server,s=>s.tickets.find(t=>t.id===blockedId&&t.stage==='awaiting-answer'&&!t.running));
  await server.post('@lab-bot stop',question.thread);assert.equal((await server.post('please continue',question.thread)).kind,'ignored');
  const stopped=(await server.state()).tickets.find(t=>t.id===blockedId);assert.equal(stopped.ended,'human');assert.equal(stopped.turn,1);
  const interrupted=await server.post('fixture:hold');const interruptedId=interrupted.tickets[0];
  const marker=join(root,'worktrees',interruptedId,'.fixture-running');
  await until(server,s=>s.tickets.some(t=>t.id===interruptedId&&t.running)&&existsSync(marker));
  const workerPid=Number(await readFile(marker,'utf8'));
  assert.deepEqual(await server.stop(),{code:0,signal:null});server=undefined;
  assert.throws(()=>process.kill(workerPid,0),{code:'ESRCH'});
  server=await boot();const restored=await server.state();assert.equal(restored.tickets.length,3);assert.equal(restored.tickets.find(t=>t.id===id).sessionId,done.sessionId);
  await until(server,s=>s.tickets.some(t=>t.id===interruptedId&&t.turn===2&&t.ended==='completed'&&!t.running));
  const recovered=JSON.parse((await readFile(join(root,'worktrees',interruptedId,'agent-result.txt'),'utf8')).trim());
  assert.match(recovered.message,/Restart recovery:/);assert.match(recovered.message,/fixture:hold/);
  assert.deepEqual(await server.stop(),{code:0,signal:null});server=undefined;
  console.log('PASS: real worktree and commits, same session/branch, sa authentication, blocked/stop, SIGTERM worker reaping and interrupted-input recovery');
}finally{if(server)await server.stop();await rm(root,{recursive:true,force:true});}
