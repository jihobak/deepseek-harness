import { z } from 'zod';
import type { Trigger } from './model.ts';
import { Engine } from './engine.ts';
export const endpoints=['issues','issues/comments','pulls/comments'] as const;
export type Endpoint=typeof endpoints[number];
const row=z.object({id:z.number(),number:z.number().optional(),body:z.string().nullable().optional(),
  created_at:z.string().optional(),issue_url:z.string().optional(),pull_request_url:z.string().optional(),
  user:z.object({login:z.string(),type:z.string().optional()})}).passthrough();
export function mention(text:string,login:string):boolean{
  const escaped=login.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`@${escaped}(?![\\w-])`,'i').test(text);
}
/** Input is a gh --paginate --slurp response: one array per API page. */
export function normalizePages(raw:unknown,endpoint:Endpoint,repo:string,agent:string,since:string):Trigger[]{
  const pages=z.array(z.array(row)).parse(raw);const result:Trigger[]=[];
  for(const item of pages.flat()){
    if(endpoint==='issues'&&(!item.created_at||Date.parse(item.created_at)<Date.parse(since)))continue;
    const number=endpoint==='issues'?item.number:Number((item.issue_url??item.pull_request_url??'').split('/').at(-1));
    if(!Number.isSafeInteger(number)||!number||number<1)throw new Error('Missing thread number');
    const text=item.body??'';
    result.push({id:`github:${repo}:${endpoint}:${item.id}`,source:'github',thread:`github:${repo}#${number}`,
      actor:item.user.login,bot:item.user.type==='Bot'||item.user.login.endsWith('[bot]'),addressed:mention(text,agent),text});
  }
  return result;
}
export interface Reader{read(endpoint:Endpoint,since:string):Promise<unknown>}
/** Independent cursors: one failing endpoint never advances itself or holds back another. */
export async function poll(engine:Engine,reader:Reader,start:number):Promise<Record<string,string>>{
  const errors:Record<string,string>={};
  for(const endpoint of endpoints){
    let since=engine.store.get<string>('cursor',endpoint);
    if(!since){since=new Date(start).toISOString();engine.store.put('cursor',endpoint,since);continue;}
    try{
      const raw=await reader.read(endpoint,since);
      for(const trigger of normalizePages(raw,endpoint,engine.config.repo,engine.config.agent,since))engine.receive(trigger);
      engine.store.put('cursor',endpoint,new Date(Math.max(Date.parse(since),start-10_000)).toISOString());
    }catch(error){errors[endpoint]=error instanceof Error?error.message:String(error);}
  }
  return errors;
}
