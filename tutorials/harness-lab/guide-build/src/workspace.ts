import { existsSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Ticket } from './model.ts';
import { runProcess } from './process.ts';
export async function git(cwd:string,args:string[]):Promise<string>{
  const r=await runProcess('git',args,{cwd,timeoutMs:30_000});if(r.code!==0)throw new Error(r.stderr||'git failed');return r.stdout.trim();
}
export async function prepare(repo:string,base:string,ticket:Ticket):Promise<void>{
  if(existsSync(ticket.directory)){
    const top=await git(ticket.directory,['rev-parse','--show-toplevel']);
    const branch=await git(ticket.directory,['branch','--show-current']);
    if(realpathSync(top)!==realpathSync(ticket.directory)||branch!==ticket.branch)throw new Error('worktree identity mismatch');
    return;
  }
  mkdirSync(dirname(ticket.directory),{recursive:true});
  await git(resolve(repo),['worktree','add','-b',ticket.branch,ticket.directory,base]);
}
