import { DatabaseSync } from 'node:sqlite';

export interface Effect {
  seq: number; kind: string; key: string; payload: string;
  generation: number; attempts: number; due: number;
}
/** JSON records keep this teaching schema small; production uses domain-specific repositories. */
export class Store {
  readonly db: DatabaseSync;
  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    try {
      this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=1000;');
      const version = this.db.prepare('PRAGMA user_version').get()?.user_version;
      if (version !== 0 && version !== 1) throw new Error('Unsupported schema version');
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS records(kind TEXT,id TEXT,data TEXT,PRIMARY KEY(kind,id));
        CREATE TABLE IF NOT EXISTS effects(
          seq INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT,key TEXT,payload TEXT,
          generation INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,due INTEGER NOT NULL DEFAULT 0,
          UNIQUE(kind,key));
        PRAGMA user_version=1;
      `);
    } catch (error) { this.db.close(); throw error; }
  }
  atomic<T>(work: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      if (result instanceof Promise) throw new Error('Transactions must be synchronous');
      this.db.exec('COMMIT');
      return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  get<T>(kind: string, id: string): T | undefined {
    const row = this.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind, id);
    // Rows are internal, versioned records; adapters validate external inputs before saving.
    return row ? JSON.parse(String(row.data)) as T : undefined;
  }
  all<T>(kind: string): T[] {
    return this.db.prepare('SELECT data FROM records WHERE kind=? ORDER BY id').all(kind)
      .map(row => JSON.parse(String(row.data)) as T);
  }
  put(kind: string, id: string, value: unknown): void {
    this.db.prepare('INSERT INTO records VALUES (?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data')
      .run(kind, id, JSON.stringify(value));
  }
  enqueue(kind: string, key: string, payload: unknown): void {
    this.db.prepare(`INSERT INTO effects(kind,key,payload,generation) VALUES (?,?,?,1)
      ON CONFLICT(kind,key) DO UPDATE SET payload=excluded.payload,generation=effects.generation+1,attempts=0,due=0`)
      .run(kind, key, JSON.stringify(payload));
  }
  cancel(kind: string, key: string): void {
    this.db.prepare('DELETE FROM effects WHERE kind=? AND key=?').run(kind, key);
  }
  next(now: number): Effect | undefined {
    // SQLite rows have the columns declared in this schema.
    return this.db.prepare('SELECT * FROM effects WHERE due<=? ORDER BY seq LIMIT 1').get(now) as Effect | undefined;
  }
  complete(e: Effect): boolean {
    return this.db.prepare('DELETE FROM effects WHERE seq=? AND generation=?').run(e.seq, e.generation).changes === 1;
  }
  retry(e: Effect, now: number): void {
    this.db.prepare('UPDATE effects SET attempts=attempts+1,due=? WHERE seq=? AND generation=?')
      .run(now + Math.min(60_000, 1000 * 2 ** Math.min(e.attempts, 6)), e.seq, e.generation);
  }
  close(): void { this.db.close(); }
}
