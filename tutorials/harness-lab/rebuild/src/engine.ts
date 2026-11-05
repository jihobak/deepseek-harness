import { current } from './model.ts';
import type { Assessment, Evaluation, Input, Receipt, Subscription, Ticket, Trigger } from './model.ts';
import { Policy } from './policy.ts';
import { Store } from './store.ts';

/** Commands own transactions. They enqueue I/O; they never await a model or channel. */
export class Engine {
  readonly store: Store;
  policy: Policy;
  constructor(store: Store, policy: Policy) { this.store = store; this.policy = policy; }
  receive(t: Trigger, cursor?: string): 'stored' | 'duplicate' | 'filtered' {
    return this.store.atomic(() => {
      const result = this.intake(t);
      if (cursor !== undefined) this.store.put('cursor', t.source, cursor);
      return result;
    });
  }
  private intake(t: Trigger): 'stored' | 'duplicate' | 'filtered' {
    if (!t.threads.length) throw new Error('Thread required');
    if (this.store.get('trigger', t.id)) return 'duplicate';
    this.store.put('trigger', t.id, t);
    if (t.repository !== this.policy.settings.repository) return 'filtered';
    const reached = new Map<string, boolean>();
    for (const s of this.store.all<Subscription>('subscription')) {
      if (t.threads.includes(s.thread)) reached.set(s.ticketId, s.context && (reached.get(s.ticketId) ?? true));
    }
    let owned = false;
    for (const [id, context] of reached) {
      const ticket = this.ticket(id);
      if (ticket.status === 'ended') {
        if (ticket.endedBy === 'human' || !t.human || context || !this.policy.revalidate(ticket.mandate)) continue;
        ticket.status = 'open'; delete ticket.endedBy;
        this.newAttempt(ticket);
      }
      const input: Input = { id: `${id}/${t.id}`, triggerId: t.id, context, delivered: false, read: false };
      ticket.inputs.push(input);
      this.store.put('ticket', id, ticket);
      this.store.enqueue('deliver', input.id, { ticketId: id, inputId: input.id, assignmentId: current(ticket).id });
      if (t.human && !context) owned = true;
    }
    const strength = this.policy.gate(t);
    if (!owned && strength) {
      const evaluation: Evaluation = { id: t.id, triggerId: t.id, version: this.policy.version, strength, outcome: 'pending' };
      this.store.put('eval', evaluation.id, evaluation);
    }
    return 'stored';
  }
  decide(evalId: string, assessment: Assessment): Evaluation['outcome'] {
    return this.store.atomic(() => {
      const evaluation = this.store.get<Evaluation>('eval', evalId);
      if (!evaluation) throw new Error('Unknown Eval');
      if (evaluation.outcome !== 'pending') return evaluation.outcome;
      const outcome = evaluation.version === this.policy.version
        ? this.policy.assess(evaluation.strength, assessment) : 'unavailable';
      evaluation.outcome = outcome;
      this.store.put('eval', evalId, evaluation);
      if (outcome !== 'accept') return outcome;
      const t = this.store.get<Trigger>('trigger', evaluation.triggerId);
      if (!t) throw new Error('Eval has no Trigger');
      const ticket: Ticket = {
        id: `ticket:${evalId}`, status: 'open', withdrawn: false, assignments: [], inputs: [], reports: [],
        mandate: { actor: t.actor, repository: t.repository, scope: assessment.scope, strength: evaluation.strength,
          policyVersion: evaluation.version, rules: assessment.rules.filter(r => r.matched).map(r => r.id) },
      };
      this.newAttempt(ticket);
      this.store.put('ticket', ticket.id, ticket);
      for (const thread of t.threads) this.subscribeInside(ticket.id, thread, false);
      return outcome;
    });
  }
  private newAttempt(ticket: Ticket): void {
    const assignment = { id: `${ticket.id}/attempt:${ticket.assignments.length + 1}`, status: 'pending' as const };
    ticket.assignments.push(assignment);
    this.store.enqueue('launch', assignment.id, { ticketId: ticket.id, assignmentId: assignment.id });
  }
  ticket(id: string): Ticket {
    const ticket = this.store.get<Ticket>('ticket', id);
    if (!ticket) throw new Error('Unknown Ticket');
    return ticket;
  }
  private subscribeInside(ticketId: string, thread: string, context: boolean): void {
    const key = JSON.stringify([ticketId, thread]);
    const existing = this.store.get<Subscription>('subscription', key);
    this.store.put('subscription', key, { ticketId, thread, context: context && (existing?.context ?? true) });
  }
  follow(ticketId: string, thread: string, context = true): void {
    this.store.atomic(() => {
      if (this.ticket(ticketId).status !== 'open') throw new Error('Ticket ended');
      this.subscribeInside(ticketId, thread, context);
    });
  }
  started(ticketId: string, assignmentId: string): boolean {
    return this.store.atomic(() => {
      const t = this.ticket(ticketId);
      if (t.status !== 'open' || current(t).id !== assignmentId || current(t).status !== 'pending') return false;
      current(t).status = 'running'; this.store.put('ticket', t.id, t); return true;
    });
  }
  report(ticketId: string, assignmentId: string, text: string): boolean {
    return this.store.atomic(() => {
      const t = this.ticket(ticketId);
      if (t.status !== 'open' || current(t).id !== assignmentId) return false;
      if (t.reports.some(r => r.assignmentId === assignmentId && r.text === text)) return true;
      current(t).status = 'waiting'; t.reports.push({ assignmentId, text });
      this.store.put('ticket', t.id, t);
      const id = `${assignmentId}/result`;
      if (!this.store.get('receipt', id)) {
        this.store.put('receipt', id, { id, ticketId, text, status: 'pending' } satisfies Receipt);
        this.store.enqueue('reply', id, { receiptId: id });
      }
      return true;
    });
  }
  markInput(ticketId: string, assignmentId: string, inputId: string, phase: 'delivered' | 'read'): boolean {
    return this.store.atomic(() => {
      const t = this.ticket(ticketId);
      if (t.status !== 'open' || current(t).id !== assignmentId) return false;
      const input = t.inputs.find(i => i.id === inputId);
      if (!input || (phase === 'read' && !input.delivered)) return false;
      input[phase] = true; this.store.put('ticket', t.id, t); return true;
    });
  }
  end(ticketId: string, by: 'human' | 'executor'): void {
    this.store.atomic(() => {
      const t = this.ticket(ticketId);
      if (t.endedBy === 'human') return;
      t.status = 'ended'; t.endedBy = by; t.withdrawn = by === 'human';
      this.store.put('ticket', t.id, t);
      this.store.enqueue('stop', current(t).id, { ticketId, assignmentId: current(t).id });
    });
  }
  recover(): void {
    this.store.atomic(() => {
      for (const t of this.store.all<Ticket>('ticket')) {
        if (t.status !== 'open' || current(t).status !== 'running') continue;
        current(t).status = 'interrupted'; this.newAttempt(t);
        this.store.put('ticket', t.id, t);
        for (const input of t.inputs.filter(i => !i.read)) {
          // Reinsert after launch; old in-flight completions carry the deleted row's seq.
          this.store.cancel('deliver', input.id);
          this.store.enqueue('deliver', input.id, { ticketId: t.id, assignmentId: current(t).id, inputId: input.id });
        }
      }
    });
  }
}
