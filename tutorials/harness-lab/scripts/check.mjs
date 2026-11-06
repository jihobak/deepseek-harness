/** Keyless course checks; dependencies are installed by setup.sh and each npm project. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const python = fileURLToPath(new URL('../.venv/bin/python', import.meta.url));
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: { ...process.env, RUN_LIVE: '0' } });
  if (result.error) throw result.error;
  if (result.signal || result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed (${result.signal ?? result.status})`);
};
run(python, ['scripts/verify_materials.py']);
run(python, ['scripts/test_material_guards.py']);
run(python, ['scripts/validate_notebooks.py']);
for (const course of ['guide-build', 'rebuild']) {
  run('npm', ['run', 'check'], root + course);
  run('npm', ['run', 'smoke'], root + course);
}
run(python, ['scripts/validate_practice.py']);
console.log('PASS: all harness-lab checks (live providers skipped)');
