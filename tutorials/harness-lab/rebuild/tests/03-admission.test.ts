import test from 'node:test';
import assert from 'node:assert/strict';
import { Policy } from '../src/policy.ts';
import { config, fixture, proposal, trigger } from './helpers.ts';
test('accept creates one ticket, subscription and launch reservation without running I/O', t => {
  const f = fixture(t); const ticket = f.accept();
  assert.equal(ticket.assignments[0].status, 'pending');
  assert.equal(f.store.all('subscription').length, 1);
  assert.equal(f.store.next(0)?.kind, 'launch');
  assert.equal(f.engine.receive(trigger()), 'duplicate');
  assert.equal(f.engine.decide('t1', proposal), 'accept');
  assert.equal(f.store.all('ticket').length, 1);
});
test('stale assessments cannot authorize a ticket', t => {
  const f = fixture(t); f.engine.receive(trigger());
  f.engine.policy = new Policy({ ...config, mode: 'observe' });
  assert.equal(f.engine.decide('t1', proposal), 'unavailable');
  assert.equal(f.store.all('ticket').length, 0);
});
test('failure while reserving launch rolls back both decision and ticket', t => {
  const f = fixture(t); f.engine.receive(trigger());
  f.store.enqueue = () => { throw new Error('disk failure'); };
  assert.throws(() => f.engine.decide('t1', proposal), /disk failure/);
  assert.equal(f.store.get<{ outcome: string }>('eval', 't1')?.outcome, 'pending');
  assert.equal(f.store.all('ticket').length, 0);
});
