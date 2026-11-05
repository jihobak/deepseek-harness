import { createHash } from 'node:crypto';
import type { Assessment, Mandate, Settings, Strength, Trigger } from './model.ts';

/** This lab supports one repository and one source-specific allowlist. */
export class Policy {
  readonly settings: Settings;
  readonly version: string;
  constructor(settings: Settings) {
    if (new Set(settings.rules).size !== settings.rules.length) throw new Error('Duplicate rule');
    this.settings = structuredClone(settings);
    this.version = createHash('sha256').update(JSON.stringify(settings)).digest('hex');
  }
  gate(t: Trigger): Strength | undefined {
    if (t.repository !== this.settings.repository || !t.human || !this.settings.allowed.includes(t.actor)) return;
    if (t.addressed) return 'explicit';
    if (this.settings.mode !== 'off') return 'inferred';
  }
  assess(strength: Strength, a: Assessment): 'accept' | 'ignore' | 'would_accept' {
    if (!a.accept) return 'ignore';
    if (!a.scope.trim() || !a.evidence.trim()) throw new Error('Scope and evidence required');
    if (strength === 'explicit') return 'accept';
    const ids = a.rules.map(r => r.id);
    if (ids.length !== this.settings.rules.length || new Set(ids).size !== ids.length ||
        this.settings.rules.some(id => !ids.includes(id))) throw new Error('Assess every enabled rule exactly once');
    if (!a.directionSettled || !a.rules.some(r => r.matched) || this.settings.mode === 'off') return 'ignore';
    return this.settings.mode === 'observe' ? 'would_accept' : 'accept';
  }
  revalidate(m: Mandate): boolean {
    return m.repository === this.settings.repository && this.settings.allowed.includes(m.actor) &&
      (m.strength === 'explicit' || (this.settings.mode === 'auto' && m.rules.every(id => this.settings.rules.includes(id))));
  }
}
