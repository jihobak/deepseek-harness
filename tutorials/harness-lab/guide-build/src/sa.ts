import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { WorkerCommand } from './model.ts';
export function parseCommand(args:string[]):unknown{
  const [command,...rest]=args;
  const {values,positionals}=parseArgs({args:rest,allowPositionals:true,options:{to:{type:'string'},pr:{type:'string'},summary:{type:'string'},message:{type:'string'},question:{type:'string'}}});
  if(command==='show')return WorkerCommand.parse({command});
  if(command==='ack'||command==='reply')return WorkerCommand.parse({command,to:values.to,text:positionals.join(' ')});
  if(command==='handback')return WorkerCommand.parse({command,trigger:positionals[0],reason:positionals.slice(1).join(' ')});
  return WorkerCommand.parse({command,status:positionals[0],pr:values.pr===undefined?undefined:Number(values.pr),summary:values.summary,
    message:values.message,question:values.question,to:values.to});
}
export async function main():Promise<void>{
  try{
    const token=process.env.SUPERAGENT_TOKEN,url=process.env.SUPERAGENT_URL;
    if(!token||!url)throw new Error('worker host environment missing');
    const response=await fetch(`${url}/api/worker`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify(parseCommand(process.argv.slice(2))),signal:AbortSignal.timeout(10_000)});
    const body=await response.text();if(!response.ok)throw new Error(body);
    console.log(body);
  }catch(error){console.error(`refused: ${error instanceof Error?error.message:'invalid command'}`);process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
