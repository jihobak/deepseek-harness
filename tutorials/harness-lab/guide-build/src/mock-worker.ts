import { appendFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { runProcess } from './process.ts';
import { git } from './workspace.ts';
let input='';for await(const chunk of process.stdin)input+=String(chunk);
const turn=JSON.parse(input) as {sessionId:string;message:string};
const cwd=process.cwd(),sa=fileURLToPath(new URL('./sa.ts',import.meta.url));
async function call(args:string[]):Promise<void>{
  const r=await runProcess(process.execPath,[sa,...args],{cwd,env:process.env});if(r.code!==0)throw new Error(r.stderr);
}
await call(['ack','Local fixture: recording and committing this turn.']);
if(turn.message.includes('fixture:hold') && !turn.message.includes('Restart recovery:')) {
  await writeFile('.fixture-running',String(process.pid));
  await new Promise<void>(()=>{setInterval(()=>{},1000);});
}
if(turn.message.includes('fixture:block')) {
  await call(['report','blocked','--question','Which fixture target should be used?']);
} else {
await appendFile('agent-result.txt',JSON.stringify({session:turn.sessionId,message:turn.message})+'\n');
await git(cwd,['add','agent-result.txt']);
await git(cwd,['-c','user.name=Guide Lab Bot','-c','user.email=guide-lab@example.invalid','commit','-m','Record scripted worker turn']);
await call(['report','ready','--summary','Scripted fixture committed a local file; no real model or remote PR.','--message','Local scripted result is committed.']);
}
console.log(JSON.stringify({result:'Local fixture completed',session_id:turn.sessionId,is_error:false,total_cost_usd:0}));
