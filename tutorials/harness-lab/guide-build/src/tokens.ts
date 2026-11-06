import { randomBytes, createHash } from 'node:crypto';

/** In-memory credentials identify one ticket turn and expire before shutdown. */
export class Tokens {
  readonly values = new Map<string, { id: string; turn: number }>();
  issue(id: string, turn: number): string {
    const token = randomBytes(32).toString('hex');
    this.values.set(this.hash(token), { id, turn });
    return token;
  }
  resolve(token: string) { return this.values.get(this.hash(token)); }
  revoke(token: string): void { this.values.delete(this.hash(token)); }
  private hash(token: string): string { return createHash('sha256').update(token).digest('hex'); }
}
