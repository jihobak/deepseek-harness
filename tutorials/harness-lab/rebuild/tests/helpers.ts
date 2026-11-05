import type { TestContext } from 'node:test';
import { Engine } from '../src/engine.ts';
import { Policy } from '../src/policy.ts';
import { Store } from '../src/store.ts';
export { config, proposal, trigger } from './data.ts';
import { config, proposal, trigger } from './data.ts';
export function fixture(t: TestContext) {
  const store = new Store(); t.after(() => store.close());
  const engine = new Engine(store, new Policy(config));
  return { store, engine, accept() { engine.receive(trigger()); engine.decide('t1', proposal); return engine.ticket('ticket:t1'); } };
}
