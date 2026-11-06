import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, trigger } from './helpers.ts';
import type { Message, Ticket } from '../src/model.ts';

test('different replies survive while exact retries preserve the same outbox record', t => {
  const f = fixture(t), id = f.create(); f.engine.begin(id);
  f.engine.command(id, 1, { command: 'reply', to: 't1', text: 'First answer' });
  const first = f.store.all<Message>('message')[0];
  f.store.put('message', first.id, { ...first, state: 'sent', attempts: 2 });
  f.engine.command(id, 1, { command: 'reply', to: 't1', text: 'First answer' });
  f.engine.command(id, 1, { command: 'reply', to: 't1', text: 'Additional answer' });
  assert.deepEqual(f.store.all<Message>('message').map(m => m.text), ['First answer', 'Additional answer']);
  assert.equal(f.store.get<Message>('message', first.id)?.state, 'sent');
  assert.equal(f.store.get<Message>('message', first.id)?.attempts, 2);
  for (const question of ['Which file?', 'Which branch?', 'Which branch?']) {
    f.engine.command(id, 1, { command: 'report', status: 'blocked', question });
  }
  assert.equal(f.store.all('message').length, 4);
});

for (const recovery of ['next-turn', 'retry', 'restart'] as const) {
  test(`handback excludes returned input from ${recovery}`, t => {
    const f = fixture(t), id = f.create(); f.engine.begin(id);
    f.engine.receive(trigger({ id: 'different', addressed: true }));
    const routed = f.engine.command(id, 1, { command: 'handback', trigger: 'different', reason: 'out of scope' }) as { tickets: string[] };
    assert.notEqual(routed.tickets[0], id);
    if (recovery === 'restart') f.engine.recover();
    else {
      f.engine.command(id, 1, { command: 'report', status: 'waiting' });
      f.engine.finish(id, 1, { ok: recovery !== 'retry', transient: recovery === 'retry' }, 0);
    }
    f.engine.receive(trigger({ id: 'legitimate', addressed: false }));
    const turn = f.engine.begin(id);
    const batch = f.store.get<Ticket['inputs']>('batch', `${id}/${turn.turn}`)!;
    assert.equal(batch.some(i => i.trigger.id === 'different'), false);
    assert.equal(batch.some(i => i.trigger.id === 'legitimate'), true);
  });
}

test('handback does not duplicate input already delivered to another subscriber', t => {
  const f = fixture(t), first = f.create();
  const second = f.engine.receive(trigger({ id: 'other', thread: 'other-thread' })).tickets[0];
  const other = f.engine.ticket(second); other.threads.push(trigger().thread); f.store.put('ticket', second, other);
  f.engine.begin(first);
  f.engine.receive(trigger({ id: 'shared', addressed: false }));
  f.engine.command(first, 1, { command: 'handback', trigger: 'shared', reason: 'other owner' });
  assert.equal(f.engine.ticket(second).inputs.filter(i => i.trigger.id === 'shared').length, 1);
});
