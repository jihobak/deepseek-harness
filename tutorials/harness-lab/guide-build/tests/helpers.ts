import type {TestContext} from 'node:test';
import {Store} from '../src/store.ts';
import {Engine} from '../src/engine.ts';
import type {Trigger} from '../src/model.ts';
export function trigger(extra:Partial<Trigger>={}):Trigger{return {id:'t1',thread:'github:owner/repo#1',source:'github',actor:'alice',bot:false,addressed:true,text:'Please fix typo',...extra};}
export function fixture(t:TestContext){const store=new Store();t.after(()=>store.close());const engine=new Engine(store,{allow:['alice'],agent:'robot',repo:'owner/repo',maxWords:10},'/tmp/work');
  return {store,engine,create(){return engine.receive(trigger()).tickets[0];}};}
