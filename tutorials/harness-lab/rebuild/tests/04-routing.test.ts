import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, trigger } from './helpers.ts';
test('owned human follow-ups bypass Eval even when author is outside new-work allowlist', t => {
  const f = fixture(t); f.accept();
  f.engine.receive(trigger({ id: 't2', actor: 'bob' }));
  assert.equal(f.engine.ticket('ticket:t1').inputs.length, 1);
  assert.equal(f.store.get('eval', 't2'), undefined);
});
test('context-only messages do not become owned follow-ups', t => {
  const f = fixture(t); f.accept(); f.engine.follow('ticket:t1', 'issue:2');
  f.engine.receive(trigger({ id: 't2', threads: ['issue:2'] }));
  assert.equal(f.engine.ticket('ticket:t1').inputs[0].context, true);
  assert.ok(f.store.get('eval', 't2'));
});
test('multi-thread fan-out delivers once and ownership wins over context', t => {
  const f = fixture(t); f.accept(); f.engine.follow('ticket:t1', 'issue:2');
  f.engine.receive(trigger({ id: 't2', threads: ['issue:1', 'issue:2'] }));
  assert.equal(f.engine.ticket('ticket:t1').inputs.length, 1);
  assert.equal(f.engine.ticket('ticket:t1').inputs[0].context, false);
});
test('bot context is delivered but this lab policy does not admit bot-originated work', t => {
  const f = fixture(t); f.accept(); f.engine.receive(trigger({ id: 'bot', human: false }));
  assert.equal(f.engine.ticket('ticket:t1').inputs.length, 1);
  assert.equal(f.store.get('eval', 'bot'), undefined);
});
