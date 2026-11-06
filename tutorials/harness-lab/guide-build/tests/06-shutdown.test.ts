import test from 'node:test';
import assert from 'node:assert/strict';
import { Executor } from '../src/executor.ts';
import { Tokens } from '../src/tokens.ts';
import { stage } from '../src/engine.ts';
import { fixture, trigger } from './helpers.ts';
import type { Turn } from '../src/worker.ts';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

for (const humanStop of [false, true]) {
  test(`shutdown reaps a worker and ${humanStop ? 'preserves human stop' : 'resumes interrupted work'}`, async t => {
    const f = fixture(t), id = f.create(), tokens = new Tokens();
    const entered = deferred<Turn>();
    const released = deferred<void>();
    let exited = false;
    const executor = new Executor(f.engine, { async run(turn) {
      entered.resolve(turn);
      await new Promise<void>(resolve => turn.signal.addEventListener('abort', () => resolve(), { once: true }));
      await released.promise; exited = true;
      return { ok: true, text: 'late result' };
    } }, tokens, '/unused', 'HEAD', 1, async () => {});
    try {
    executor.pump(); const turn = await entered.promise;
    if (humanStop) f.engine.receive(trigger({ id: 'stop', text: '@robot stop' }));
    const closing = executor.close();
    assert.equal(tokens.resolve(turn.env.SUPERAGENT_TOKEN!), undefined);
    assert.throws(() => f.engine.command(id, 1, { command: 'report', status: 'ready' }), /inactive/);
    released.resolve(); await closing;
    assert.equal(exited, true); assert.equal(executor.active.size, 0);
    f.engine.recover();
    const ticket = f.engine.ticket(id);
    assert.equal(stage(ticket), humanStop ? 'ended' : 'queued');
    assert.equal(ticket.wake, !humanStop);
    if (!humanStop) {
      assert.equal(ticket.inputs[0].consumed, false);
      assert.match(ticket.recovery, /recovery/i);
      assert.equal(f.store.all('message').length, 0);
      assert.equal(f.engine.begin(id).turn, 2);
    }
    } finally { released.resolve(); await executor.close(); }
  });
}
