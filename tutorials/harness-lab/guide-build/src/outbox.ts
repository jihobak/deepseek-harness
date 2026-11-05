import type { Message } from './model.ts';
import { Store } from './store.ts';
export const AGENT_HEADER='This is by an automated agent, not a human.';
export class DeliveryError extends Error {
  readonly permanent:boolean;
  constructor(message:string,permanent=false){super(message);this.permanent=permanent;}
}
export interface Sender { send(message:Message,body:string):Promise<void> }
/** Per-ticket/thread head-of-line order; other conversations can advance during backoff. */
export async function flush(store:Store,sender:Sender,now=Date.now()):Promise<void> {
  const rows=store.all<Message>('message').filter(m=>m.state==='pending').sort((a,b)=>a.order-b.order);
  const seen=new Set<string>();
  for(const m of rows){
    const group=JSON.stringify([m.ticketId,m.thread]);if(seen.has(group))continue;seen.add(group);
    if(m.due>now)continue;
    try {await sender.send(m,`${AGENT_HEADER}\n\n${m.text}\n\n<!-- sa:${m.id} -->`);m.state='sent';}
    catch(error){
      m.error=error instanceof Error?error.message:String(error);m.attempts++;
      if(error instanceof DeliveryError && error.permanent)m.state='dropped';
      else m.due=now+Math.min(300_000,5000*2**Math.min(m.attempts-1,6));
    }
    store.atomic(()=>store.put('message',m.id,m));
  }
}
