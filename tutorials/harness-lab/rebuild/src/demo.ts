import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Engine } from './engine.ts';
import { Policy } from './policy.ts';
import { LocalChannel, LocalExecutor, Runtime } from './runtime.ts';
import { Store } from './store.ts';
import { normalize } from './source.ts';
import { overview } from './views.ts';

export const settings = { repository: 'example/project', mode: 'auto' as const, allowed: ['alice'], rules: ['copy'] };
export const assessment = { accept: true, scope: 'README의 오탈자 수정', evidence: '작성자가 수정 요청', directionSettled: true, rules: [{ id: 'copy', matched: true }] };
export async function seed(engine: Engine, runtime: Runtime): Promise<void> {
  const trigger = normalize({ repository: settings.repository, id: 'comment:1', actor: 'alice', human: true, addressed: false, thread: 'issue:1', text: 'README 오탈자를 고쳐 주세요' });
  if (engine.receive(trigger, 'page:1') === 'stored') engine.decide(trigger.id, assessment);
  await runtime.drain();
}
export async function demo(): Promise<void> {
  const folder = mkdtempSync(join(tmpdir(), 'superagent-lab-'));
  const store = new Store(join(folder, 'state.sqlite'));
  try {
    const engine = new Engine(store, new Policy(settings));
    const channel = new LocalChannel();
    const runtime = new Runtime(engine, new LocalExecutor(), channel);
    await seed(engine, runtime);
    console.log(JSON.stringify({ ...overview(store), messages: [...channel.messages.values()] }, null, 2));
  } finally { store.close(); rmSync(folder, { recursive: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await demo();
