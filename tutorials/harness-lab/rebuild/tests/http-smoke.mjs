import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const folder = await mkdtemp(join(tmpdir(), 'superagent-http-'));
const script = fileURLToPath(new URL('../src/server.ts', import.meta.url));
async function boot() {
  const child = spawn(process.execPath, [script], {
    cwd: folder, env: { ...process.env, LAB_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', value => { stderr += value; });
  const exited = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  async function stop() {
    const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
    child.kill('SIGTERM');
    try { return await exited; } finally { clearTimeout(timer); }
  }
  try {
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server startup timed out: ' + stderr)), 10_000);
      let output = '';
      child.stdout.on('data', value => {
        output += value;
        const match = /http:\/\/127\.0\.0\.1:\d+/.exec(output);
        if (match) { clearTimeout(timer); resolve(match[0]); }
      });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${stderr}`)); });
    });
    return { stop, url };
  } catch (error) { await stop(); throw error; }
}
try {
  // The second boot reuses the database and must not duplicate the seeded task.
  for (let attempt = 0; attempt < 2; attempt++) {
    const server = await boot();
    try {
      const request = (path = '', options = {}) => fetch(server.url + path, { ...options, signal: AbortSignal.timeout(5000) });
      const response = await request('/api/tickets');
      assert.equal(response.status, 200);
      const state = await response.json();
      assert.equal(state.tickets.length, 1);
      assert.equal(state.tickets[0].attention, 'review');
      assert.match(await (await request()).text(), /결과 검토/);
      assert.equal((await request('', { method: 'POST' })).status, 405);
      assert.equal((await request('/missing')).status, 404);
    } finally {
      const result = await server.stop();
      assert.equal(result.signal, null, 'shutdown must complete before forced termination');
      assert.equal(result.code, 0);
    }
  }
  console.log('HTTP smoke passed: HTML, JSON, method restriction, 404, restart without duplication');
} finally { await rm(folder, { recursive: true, force: true }); }
