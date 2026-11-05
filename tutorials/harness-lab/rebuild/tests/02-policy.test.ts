import test from 'node:test';
import assert from 'node:assert/strict';
import { Policy } from '../src/policy.ts';
import { config, proposal, trigger } from './data.ts';
test('observe audits inferred acceptance while explicit requests remain actionable', () => {
  const p = new Policy({ ...config, mode: 'observe' });
  assert.equal(p.assess('inferred', proposal), 'would_accept');
  assert.equal(p.assess('explicit', { ...proposal, rules: [] }), 'accept');
});
test('an allowlisted author is not enough when inferred mode is off', () => {
  const p = new Policy({ ...config, mode: 'off' });
  assert.equal(p.gate(trigger()), undefined);
  assert.equal(p.gate(trigger({ addressed: true })), 'explicit');
  assert.equal(p.gate(trigger({ actor: 'outsider', addressed: true })), undefined);
});
test('missing, duplicate or unknown rule assessments fail closed', () => {
  const p = new Policy(config);
  for (const rules of [[], [{ id: 'other', matched: true }], [...proposal.rules, ...proposal.rules]]) {
    assert.throws(() => p.assess('inferred', { ...proposal, rules }), /every enabled rule/);
  }
  assert.equal(p.assess('inferred', { ...proposal, directionSettled: false }), 'ignore');
  assert.throws(() => p.assess('inferred', { ...proposal, evidence: '' }), /evidence/);
});
