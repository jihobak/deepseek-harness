import { spawn } from 'node:child_process';
export interface ProcessResult { code:number|null; stdout:string; stderr:string }
/** Uses argv, never a shell. A deadline and cancellation terminate the owned POSIX process group. */
export function runProcess(command:string,args:string[],options:{cwd:string;input?:string;env?:NodeJS.ProcessEnv;signal?:AbortSignal;timeoutMs?:number}):Promise<ProcessResult>{
  return new Promise((resolve,reject)=>{
    if(options.signal?.aborted){reject(new Error('aborted'));return;}
    const child=spawn(command,args,{cwd:options.cwd,env:options.env,stdio:['pipe','pipe','pipe'],detached:process.platform!=='win32'});
    let stdout='',stderr='',failure:Error|undefined,force:ReturnType<typeof setTimeout>|undefined;
    const kill=(signal:NodeJS.Signals)=>{
      try {if(child.pid && process.platform!=='win32')process.kill(-child.pid,signal);else child.kill(signal);}
      catch(error){if((error as NodeJS.ErrnoException).code!=='ESRCH')failure=error instanceof Error?error:new Error(String(error));}
    };
    const stop=(reason:string)=>{failure=new Error(reason);kill('SIGTERM');force??=setTimeout(()=>kill('SIGKILL'),1000);};
    const abort=()=>stop('aborted');const timer=setTimeout(()=>stop('process timeout'),options.timeoutMs??600_000);
    options.signal?.addEventListener('abort',abort,{once:true});
    child.stdout.on('data',(value:Buffer)=>{stdout+=value.toString();if(stdout.length>4_000_000)stop('stdout budget exceeded');});
    child.stderr.on('data',(value:Buffer)=>{stderr=(stderr+value.toString()).slice(-16_000);});
    child.once('error',error=>{failure=error;});
    child.stdin.on('error',error=>{if((error as NodeJS.ErrnoException).code!=='EPIPE')failure=error;});
    child.once('close',code=>{clearTimeout(timer);if(force)clearTimeout(force);options.signal?.removeEventListener('abort',abort);
      if(failure)reject(failure);else resolve({code,stdout,stderr});});
    child.stdin.end(options.input??'');
  });
}
