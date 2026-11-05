import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalChannel, LocalExecutor, Runtime } from '../src/runtime.ts';
import type { Receipt } from '../src/model.ts';
import { fixture, trigger } from './helpers.ts';
test('cursor and accepted input commit together', t => {
  const f = fixture(t); const put = f.store.put.bind(f.store);
  f.store.put = (kind, id, value) => { if (kind === 'cursor') throw new Error('cursor write failure'); put(kind, id, value); };
  assert.throws(() => f.engine.receive(trigger(), 'page:1'), /cursor write failure/);
  assert.equal(f.store.get('trigger', 't1'), undefined); assert.equal(f.store.get('cursor', 'github'), undefined);
});
test('a lost send receipt retries with the same message id', async t => {
  const f = fixture(t); f.accept(); const channel = new LocalChannel(); const send = channel.send.bind(channel);
  let first = true; let clock = 0;
  channel.send = async (id, text) => { await send(id, text); if (first) { first = false; throw new Error('lost response'); } };
  const runtime = new Runtime(f.engine, new LocalExecutor(), channel, () => clock);
  await runtime.drain(); assert.equal(channel.messages.size, 1); assert.equal(f.store.all<Receipt>('receipt')[0].status, 'pending');
  clock = 1000; await runtime.drain();
  assert.equal(channel.messages.size, 1); assert.equal(f.store.all<Receipt>('receipt')[0].status, 'sent');
});
test('repeated adapter failures surface after a bounded retry budget', async t => {
  const f = fixture(t); f.accept(); let clock = 0;
  const worker = new LocalExecutor(); worker.start = async () => { throw new Error('provider unavailable'); };
  const runtime = new Runtime(f.engine, worker, new LocalChannel(), () => clock);
  for (clock of [0, 1000, 3000]) await runtime.drain();
  assert.equal(f.store.all('failure').length, 1); assert.equal(f.store.next(99_000), undefined);
});
test('pause defers external work without losing it', async t => {
  const f = fixture(t); f.accept(); f.store.put('control', 'paused', true);
  const channel = new LocalChannel(); const runtime = new Runtime(f.engine, new LocalExecutor(), channel);
  await runtime.drain(); assert.equal(channel.messages.size, 0); assert.ok(f.store.next(0));
  f.store.put('control', 'paused', false); await runtime.drain(); assert.equal(channel.messages.size, 1);
});
