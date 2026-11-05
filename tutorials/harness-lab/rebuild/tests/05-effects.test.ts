import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { Store } from '../src/store.ts';
import { fixture } from './helpers.ts';
test('old completion cannot delete a replacement payload', t => {
  const { store } = fixture(t);
  store.enqueue('reply', 'a', 'v1'); const old = store.next(0)!;
  store.enqueue('reply', 'a', 'v2');
  assert.equal(store.complete(old), false);
  assert.equal(JSON.parse(store.next(0)!.payload), 'v2');
});
test('rollback discards both domain records and effects', t => {
  const { store } = fixture(t);
  assert.throws(() => store.atomic(() => { store.put('x', '1', 1); store.enqueue('x', '1', 1); throw new Error('abort'); }));
  assert.equal(store.get('x', '1'), undefined); assert.equal(store.next(0), undefined);
});
test('retry waits until its due time and a stale retry cannot delay a new generation', t => {
  const { store } = fixture(t); store.enqueue('x', '1', 1); const old = store.next(0)!;
  store.retry(old, 10); assert.equal(store.next(1009), undefined); assert.ok(store.next(1010));
  store.enqueue('x', '1', 2); store.retry(old, 9000); assert.ok(store.next(0));
});
test('pending effects survive reopen and newer schemas refuse to start', t => {
  const folder = mkdtempSync(join(tmpdir(), 'rebuild-test-')); t.after(() => rmSync(folder, { recursive: true }));
  const path = join(folder, 'db'); const first = new Store(path);
  try { first.enqueue('x', '1', 1); } finally { first.close(); }
  const second = new Store(path);
  try { assert.equal(second.next(0)?.kind, 'x'); } finally { second.close(); }
  const raw = new DatabaseSync(path);
  try { raw.exec('PRAGMA user_version=99'); } finally { raw.close(); }
  assert.throws(() => new Store(path), /schema version/);
});
