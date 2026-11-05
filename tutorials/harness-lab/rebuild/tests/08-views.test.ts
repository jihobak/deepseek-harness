import test from 'node:test';
import assert from 'node:assert/strict';
import { page, overview, readScope } from '../src/views.ts';
import { fixture } from './helpers.ts';
test('workers cannot read other tickets through the resource reader', t => {
  const f = fixture(t); f.accept();
  assert.throws(() => readScope(f.store, 'other', 'ticket:t1'), /Forbidden/);
  assert.throws(() => readScope(f.store, 'ticket:t1', 'ticket:t1', -1), /page/);
});
test('UTF-16 pages reconstruct the exact original text', t => {
  const f = fixture(t); const ticket = f.accept();
  f.store.put('ticket', ticket.id, { ...ticket, mandate: { ...ticket.mandate, scope: 'A😀B' } });
  let text = ''; let offset: number | null = 0;
  while (offset !== null) { const part = readScope(f.store, ticket.id, ticket.id, offset, 1); text += part.text; offset = part.next; }
  assert.equal(text, 'A😀B');
});
test('panel escapes model-visible text and projects structured attention', t => {
  const f = fixture(t); const ticket = f.accept();
  f.store.put('ticket', ticket.id, { ...ticket, mandate: { ...ticket.mandate, scope: '<script>alert(1)</script>' } });
  f.engine.report(ticket.id, ticket.assignments[0].id, 'ready');
  assert.equal(overview(f.store).tickets[0].attention, 'review');
  assert.ok(page(f.store).includes('&lt;script&gt;')); assert.ok(!page(f.store).includes('<script>'));
});
