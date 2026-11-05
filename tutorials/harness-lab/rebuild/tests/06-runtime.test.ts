import test from 'node:test';
import assert from 'node:assert/strict';
import { current } from '../src/model.ts';
import { Policy } from '../src/policy.ts';
import { LocalChannel, LocalExecutor, Runtime } from '../src/runtime.ts';
import { config, fixture, trigger } from './helpers.ts';
test('a ready report requests review; it does not end the ticket', async t => {
  const f = fixture(t); f.accept(); const channel = new LocalChannel();
  const runtime = new Runtime(f.engine, new LocalExecutor(), channel);
  await Promise.all([runtime.drain(), runtime.drain()]);
  const ticket = f.engine.ticket('ticket:t1');
  assert.equal(ticket.status, 'open'); assert.equal(current(ticket).status, 'waiting'); assert.equal(channel.messages.size, 1);
});
test('executor-ended work resumes on owned human input; old reports are rejected', t => {
  const f = fixture(t); const old = current(f.accept()).id;
  f.engine.end('ticket:t1', 'executor'); f.engine.receive(trigger({ id: 'bot', human: false }));
  assert.equal(f.engine.ticket('ticket:t1').status, 'ended');
  f.engine.receive(trigger({ id: 'followup' }));
  assert.notEqual(current(f.engine.ticket('ticket:t1')).id, old);
  assert.equal(f.engine.report('ticket:t1', old, 'late'), false);
});
test('human stop prevents queued work and automatic resume', async t => {
  const f = fixture(t); f.accept(); f.engine.end('ticket:t1', 'human');
  f.engine.receive(trigger({ id: 'followup' }));
  const channel = new LocalChannel(); await new Runtime(f.engine, new LocalExecutor(), channel).drain();
  assert.equal(channel.messages.size, 0); assert.equal(f.engine.ticket('ticket:t1').inputs.length, 0);
});
test('resume revalidates the original mandate under current policy', t => {
  const f = fixture(t); f.accept(); f.engine.end('ticket:t1', 'executor');
  f.engine.policy = new Policy({ ...config, allowed: [] }); f.engine.receive(trigger({ id: 'followup' }));
  assert.equal(f.engine.ticket('ticket:t1').status, 'ended');
});
test('recovery replaces interrupted attempts and replays only unread inputs', async t => {
  const f = fixture(t); const old = current(f.accept()).id;
  f.engine.started('ticket:t1', old); f.engine.receive(trigger({ id: 't2' }));
  const input = f.engine.ticket('ticket:t1').inputs[0];
  assert.equal(f.engine.markInput('ticket:t1', old, input.id, 'read'), false);
  f.engine.markInput('ticket:t1', old, input.id, 'delivered');
  f.engine.recover(); f.engine.recover();
  assert.equal(f.engine.ticket('ticket:t1').assignments.length, 2);
  assert.equal(f.engine.report('ticket:t1', old, 'late'), false);
  const worker = new LocalExecutor(); let started = false;
  worker.start = async () => { started = true; return 'ready'; };
  worker.deliver = async () => { assert.ok(started, 'launch must precede replay'); return { read: true }; };
  await new Runtime(f.engine, worker, new LocalChannel()).drain();
  assert.equal(f.engine.ticket('ticket:t1').inputs[0].read, true);
});
test('a stop during an in-flight worker prevents its late report', async t => {
  const f = fixture(t); f.accept();
  let finish: (text: string) => void = () => {};
  const worker = new LocalExecutor(); worker.start = () => new Promise(resolve => { finish = resolve; });
  const runtime = new Runtime(f.engine, worker, new LocalChannel()); const pending = runtime.drain();
  try { f.engine.end('ticket:t1', 'human'); }
  finally { finish('late completion'); await pending; }
  assert.deepEqual(f.engine.ticket('ticket:t1').reports, []);
});
