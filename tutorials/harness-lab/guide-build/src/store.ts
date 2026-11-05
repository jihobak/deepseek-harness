import { DatabaseSync } from 'node:sqlite';
export class Store {
  readonly db: DatabaseSync;
  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    try {
      const version = this.db.prepare('PRAGMA user_version').get()?.user_version;
      if (version !== 0 && version !== 1) throw new Error('Unsupported schema');
      this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=1000; CREATE TABLE IF NOT EXISTS records(kind TEXT,id TEXT,data TEXT,PRIMARY KEY(kind,id)); PRAGMA user_version=1;');
    } catch (error) { this.db.close(); throw error; }
  }
  atomic<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const value = fn();
      if (value instanceof Promise) throw new Error('Synchronous transactions only');
      this.db.exec('COMMIT'); return value;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  get<T>(kind: string, id: string): T | undefined {
    const r = this.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind,id);
    return r ? JSON.parse(String(r.data)) as T : undefined;
  }
  all<T>(kind: string): T[] {
    return this.db.prepare('SELECT data FROM records WHERE kind=? ORDER BY rowid').all(kind).map(r => JSON.parse(String(r.data)) as T);
  }
  put(kind: string, id: string, data: unknown): void {
    this.db.prepare('INSERT INTO records VALUES (?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data').run(kind,id,JSON.stringify(data));
  }
  close(): void { this.db.close(); }
}
