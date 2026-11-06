import test from 'node:test';
import assert from 'node:assert/strict';
import { stage } from '../src/engine.ts';
import { fixture, trigger } from './helpers.ts';

test('merged work resumes through progress and blocked reports before opening a new PR', t => {
  const f = fixture(t), id = f.create();
  f.engine.begin(id);
  f.engine.command(id, 1, { command: 'report', status: 'ready', pr: 1 });
  f.engine.finish(id, 1, { ok: true }, 0);
  f.engine.closePR(1, 'merged');
  f.engine.receive(trigger({ id: 'follow', addressed: false }));
  f.engine.begin(id);
  for (const status of ['progress', 'waiting', 'blocked'] as const) {
    f.engine.command(id, 2, { command: 'report', status });
    f.engine.closePR(1, 'merged');
    assert.equal(f.engine.ticket(id).ended, undefined);
  }
  f.engine.command(id, 2, { command: 'report', status: 'ready', pr: 2 });
  f.engine.finish(id, 2, { ok: true }, 0);
  assert.equal(stage(f.engine.ticket(id)), 'awaiting-review');
  f.engine.closePR(2, 'merged');
  assert.equal(f.engine.ticket(id).ended, 'merged');
});

test('PR closure during a running turn waits for readiness and preserves human input', t => {
  const f = fixture(t), id = f.create();
  f.engine.begin(id);
  f.engine.command(id, 1, { command: 'report', status: 'progress', pr: 1 });
  f.engine.closePR(1, 'merged');
  assert.equal(f.engine.ticket(id).ended, undefined);
  f.engine.receive(trigger({ id: 'follow', addressed: false }));
  f.engine.command(id, 1, { command: 'report', status: 'ready' });
  f.engine.finish(id, 1, { ok: true }, 0);
  assert.equal(stage(f.engine.ticket(id)), 'queued');
  f.engine.begin(id);
  f.engine.command(id, 2, { command: 'report', status: 'ready' });
  f.engine.finish(id, 2, { ok: true }, 0);
  assert.equal(f.engine.ticket(id).ended, 'merged');
});
