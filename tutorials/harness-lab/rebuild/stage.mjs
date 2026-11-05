import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const stage = process.argv[2];
if (!/^(0[1-8])$/.test(stage ?? '')) {
  console.error('Usage: npm run stage -- 01  (01 through 08)');
  process.exit(2);
}
const files = readdirSync(new URL('./tests/', import.meta.url)).filter(p => p.startsWith(stage + '-'));
if (!files.length) throw new Error('Missing stage tests');
const result = spawnSync(process.execPath, ['--test', '--test-isolation=none', ...files.map(p => `tests/${p}`)], {
  cwd: new URL('.', import.meta.url), stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
