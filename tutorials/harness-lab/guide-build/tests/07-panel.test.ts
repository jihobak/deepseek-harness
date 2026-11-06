import test from 'node:test';
import assert from 'node:assert/strict';
import { view } from '../src/http.ts';
import { fixture, trigger } from './helpers.ts';

test('panel prioritizes a question over earlier idle work without exposing tokens', t => {
  const f = fixture(t), first = f.create();
  f.engine.begin(first); f.engine.command(first, 1, { command: 'report', status: 'waiting' });
  f.engine.finish(first, 1, { ok: true }, 0);
  const second = f.engine.receive(trigger({ id: 'second', thread: 'another' })).tickets[0];
  f.engine.begin(second); f.engine.command(second, 1, { command: 'report', status: 'blocked', question: 'Which file?' });
  f.engine.finish(second, 1, { ok: true }, 0);
  const data = view(f.engine);
  assert.equal(data.tickets[0].id, second);
  assert.equal(data.tickets[0].stage, 'awaiting-answer');
  assert.equal(JSON.stringify(data).includes('SUPERAGENT_TOKEN'), false);
});
