import { current } from './model.ts';
import type { Receipt } from './model.ts';
import { Engine } from './engine.ts';
import type { Effect } from './store.ts';

/** Adapters must make retries with the same assignment/input id safe. */
export interface Executor {
  start(assignmentId: string, scope: string): Promise<string>;
  deliver(assignmentId: string, inputId: string, text: string): Promise<{ read: boolean }>;
  stop(assignmentId: string): Promise<void>;
}
export interface Channel { send(id: string, text: string): Promise<void> }
export class LocalExecutor implements Executor {
  readonly inputs = new Set<string>();
  async start(_id: string, scope: string): Promise<string> { return `검토 준비: ${scope}`; }
  async deliver(_id: string, inputId: string, _text: string): Promise<{ read: boolean }> {
    this.inputs.add(inputId); return { read: true };
  }
  async stop(_id: string): Promise<void> { /* No remote process in the local adapter. */ }
}
/** This mock has an atomic map; real GitHub read-before-write is weaker. */
export class LocalChannel implements Channel {
  readonly messages = new Map<string, string>();
  async send(id: string, text: string): Promise<void> {
    if (!this.messages.has(id)) this.messages.set(id, text);
  }
}
export class Runtime {
  readonly engine: Engine;
  readonly executor: Executor;
  readonly channel: Channel;
  readonly now: () => number;
  private active?: Promise<void>;
  constructor(engine: Engine, executor: Executor, channel: Channel, now = Date.now) {
    this.engine = engine; this.executor = executor; this.channel = channel; this.now = now;
  }
  /** Coalesces callers in this process; it is not a distributed lease. */
  drain(): Promise<void> {
    if (this.active) return this.active;
    this.active = this.pump().finally(() => { this.active = undefined; });
    return this.active;
  }
  private async pump(): Promise<void> {
    const store = this.engine.store;
    for (let n = 0; n < 1000; n++) {
      if (store.get<boolean>('control', 'paused')) return;
      const effect = store.next(this.now());
      if (!effect) return;
      try { await this.handle(effect); store.complete(effect); }
      catch (error) {
        store.atomic(() => {
          if (effect.attempts >= 2) {
            if (store.complete(effect)) store.put('failure', String(effect.seq), {
              kind: effect.kind, key: effect.key, error: error instanceof Error ? error.message : String(error),
            });
          } else store.retry(effect, this.now());
        });
      }
    }
    throw new Error('Drain budget exhausted');
  }
  private async handle(effect: Effect): Promise<void> {
    const payload: Record<string, string> = JSON.parse(effect.payload);
    const store = this.engine.store;
    if (effect.kind === 'reply') {
      const r = store.get<Receipt>('receipt', payload.receiptId);
      if (!r || r.status === 'sent') return;
      await this.channel.send(r.id, r.text);
      store.atomic(() => { r.status = 'sent'; store.put('receipt', r.id, r); });
      return;
    }
    if (!['launch', 'deliver', 'stop'].includes(effect.kind)) throw new Error('Unknown effect kind');
    if (effect.kind === 'stop') { await this.executor.stop(payload.assignmentId); return; }
    const t = this.engine.ticket(payload.ticketId);
    if (t.status !== 'open' || current(t).id !== payload.assignmentId) return;
    if (effect.kind === 'launch') {
      if (current(t).status === 'waiting') return;
      if (current(t).status === 'pending' && !this.engine.started(t.id, payload.assignmentId)) return;
      const result = await this.executor.start(payload.assignmentId, t.mandate.scope);
      this.engine.report(t.id, payload.assignmentId, result);
    } else {
      const input = t.inputs.find(i => i.id === payload.inputId);
      if (!input || input.read) return;
      const trigger = store.get<{ text: string }>('trigger', input.triggerId);
      if (!trigger) throw new Error('Missing input Trigger');
      const receipt = await this.executor.deliver(payload.assignmentId, input.id, trigger.text);
      this.engine.markInput(t.id, payload.assignmentId, input.id, 'delivered');
      if (receipt.read) this.engine.markInput(t.id, payload.assignmentId, input.id, 'read');
    }
  }
}
