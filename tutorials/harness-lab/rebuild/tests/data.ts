import type { Settings, Trigger } from '../src/model.ts';
export const config: Settings = { repository: 'example/project', mode: 'auto', allowed: ['alice'], rules: ['copy'] };
export const proposal = { accept: true, scope: 'Fix README typo', evidence: 'Please fix the typo', directionSettled: true, rules: [{ id: 'copy', matched: true }] };
export function trigger(extra: Partial<Trigger> = {}): Trigger {
  return { id: 't1', source: 'github', repository: config.repository, actor: 'alice', human: true, addressed: false, threads: ['issue:1'], text: 'Please fix typo', ...extra };
}
