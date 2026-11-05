import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { Engine } from './engine.ts';
import { Policy } from './policy.ts';
import { LocalChannel, LocalExecutor, Runtime } from './runtime.ts';
import { Store } from './store.ts';
import { overview, page } from './views.ts';
import { seed, settings } from './demo.ts';

mkdirSync('.state', { recursive: true });
const store = new Store('.state/lab.sqlite');
const engine = new Engine(store, new Policy(settings));
const runtime = new Runtime(engine, new LocalExecutor(), new LocalChannel());
engine.recover();
await seed(engine, runtime);
const server = createServer((request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') { response.writeHead(405); response.end('Read-only panel'); return; }
  if (request.url === '/api/tickets') {
    response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(JSON.stringify(overview(store))); return;
  }
  if (request.url !== '/') { response.writeHead(404); response.end('Not found'); return; }
  response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(page(store));
});
const port = Number(process.env.LAB_PORT ?? 8765);
if (!Number.isInteger(port) || port < 0 || port > 65535) { store.close(); throw new Error('Invalid LAB_PORT'); }
server.listen(port, '127.0.0.1', () => {
  const address = server.address();
  if (address && typeof address === 'object') console.log(`http://127.0.0.1:${address.port} — Ctrl+C to stop`);
});
function shutdown(): void { server.close(() => { store.close(); process.exitCode = 0; }); }
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
server.once('error', error => { store.close(); throw error; });
