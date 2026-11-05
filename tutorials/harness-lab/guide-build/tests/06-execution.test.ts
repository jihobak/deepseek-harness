import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {runProcess} from '../src/process.ts';import {git,prepare} from '../src/workspace.ts';import {fixture,trigger} from './helpers.ts';import {Executor,Tokens} from '../src/executor.ts';
test('worktree preparation reuses the branch and refuses a mismatched existing directory',async t=>{const root=await mkdtemp(join(tmpdir(),'guide-git-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await git(root,['init','-b','main']);await git(root,['-c','user.name=Test','-c','user.email=test@example.invalid','commit','--allow-empty','-m','seed']);
  const f=fixture(t);const id=f.create();const ticket={...f.engine.ticket(id),directory:join(root,'work')};await prepare(root,'HEAD',ticket);await prepare(root,'HEAD',ticket);
  assert.equal(await git(ticket.directory,['branch','--show-current']),ticket.branch);await assert.rejects(prepare(root,'HEAD',{...ticket,branch:'other'}),/mismatch/);});
test('cancelled child is reaped before process promise rejects',async()=>{const controller=new AbortController();const promise=runProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{cwd:tmpdir(),signal:controller.signal});controller.abort();await assert.rejects(promise,/aborted/);});
test('scheduler reserves one extra slot for a human follow-up, not another new task',async t=>{
  const f=fixture(t);const first=f.create();let release=()=>{};
  const barrier=new Promise<void>(resolve=>{release=resolve;});
  const executor=new Executor(f.engine,{async run(){return {ok:true,text:''};}},new Tokens(),'/unused','HEAD',1,async()=>barrier);
  try{
    executor.pump();assert.equal(executor.active.size,1);
    const ordinary=f.engine.receive(trigger({id:'new',thread:'other'})).tickets[0];
    const follow=f.engine.receive(trigger({id:'follow',thread:'third'})).tickets[0];
    f.store.put('ticket',follow,{...f.engine.ticket(follow),turn:1,humanWake:true});
    executor.pump();assert.equal(executor.active.size,2);
    assert.equal(f.engine.ticket(ordinary).running,false);assert.equal(f.engine.ticket(follow).running,true);
    assert.equal(f.engine.ticket(first).running,true);
  }finally{release();await executor.close();}
});
