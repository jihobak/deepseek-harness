import { mkdirSync,openSync,closeSync,unlinkSync,chmodSync,existsSync,writeFileSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { Store } from './store.ts';
import { Engine } from './engine.ts';
import { Executor } from './executor.ts';
import { Tokens } from './tokens.ts';
import { MockWorker } from './worker.ts';
import { createHost } from './http.ts';
import { flush } from './outbox.ts';
import { git } from './workspace.ts';
const root=resolve(process.env.LAB_STATE??'.state');mkdirSync(root,{recursive:true,mode:0o700});
const lock=join(root,'host.lock');const lockFd=openSync(lock,'wx',0o600);writeFileSync(lockFd,String(process.pid));
let store:Store|undefined;
try{
  const repo=join(root,'repo');
  if(!existsSync(repo)){mkdirSync(repo);await git(repo,['init','-b','main']);writeFileSync(join(repo,'README.md'),'# Local sandbox\n');
    await git(repo,['add','README.md']);await git(repo,['-c','user.name=Guide Lab','-c','user.email=lab@example.invalid','commit','-m','Initialize local sandbox']);}
  store=new Store(join(root,'state.sqlite'));chmodSync(join(root,'state.sqlite'),0o600);
  const engine=new Engine(store,{allow:['operator'],agent:'lab-bot',repo:'local/sandbox',maxWords:120},join(root,'worktrees'));
  engine.recover();const tokens=new Tokens();const executor=new Executor(engine,new MockWorker(),tokens,repo);
  const server=createHost(engine,executor,tokens);const port=Number(process.env.LAB_PORT??3090);
  if(!Number.isInteger(port)||port<0||port>65535)throw new Error('invalid LAB_PORT');
  await new Promise<void>((ready,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',ready);});
  const address=server.address();if(!address||typeof address==='string')throw new Error('no server address');
  executor.url=`http://127.0.0.1:${address.port}`;
  console.log(executor.url);
  let active:Promise<void>|undefined,closing=false;
  const tick=()=>{if(closing||active)return;executor.pump();active=flush(engine.store,{async send(m,body){engine.store.put('local-delivery',m.id,{body});}}).finally(()=>{active=undefined;});};
  const timer=setInterval(tick,100);tick();
  const stop=async()=>{if(closing)return;closing=true;clearInterval(timer);await executor.close();await active;
    await new Promise<void>((done,reject)=>server.close(error=>error?reject(error):done()));store?.close();closeSync(lockFd);unlinkSync(lock);};
  process.once('SIGINT',()=>{void stop().catch(error=>{console.error(error);process.exitCode=1;});});
  process.once('SIGTERM',()=>{void stop().catch(error=>{console.error(error);process.exitCode=1;});});
}catch(error){store?.close();closeSync(lockFd);unlinkSync(lock);throw error;}
