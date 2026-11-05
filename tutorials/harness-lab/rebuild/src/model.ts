/** External adapters establish identities; message bodies never establish authority. */
export interface Trigger {
  id: string;
  source: 'github';
  repository: string;
  actor: string;
  human: boolean;
  addressed: boolean;
  threads: string[];
  text: string;
}
export interface Settings {
  repository: string;
  mode: 'off' | 'observe' | 'auto';
  allowed: string[];
  rules: string[];
}
export interface Assessment {
  accept: boolean;
  scope: string;
  evidence: string;
  directionSettled: boolean;
  rules: { id: string; matched: boolean }[];
}
export type Strength = 'explicit' | 'inferred';
/** The original grant remains immutable; revocation belongs to Ticket state. */
export interface Mandate {
  readonly actor: string;
  readonly repository: string;
  readonly scope: string;
  readonly strength: Strength;
  readonly policyVersion: string;
  readonly rules: readonly string[];
}
export interface Assignment {
  id: string;
  status: 'pending' | 'running' | 'waiting' | 'interrupted';
}
export interface Input {
  id: string;
  triggerId: string;
  context: boolean;
  delivered: boolean;
  read: boolean;
}
export interface Ticket {
  id: string;
  mandate: Mandate;
  status: 'open' | 'ended';
  endedBy?: 'human' | 'executor';
  withdrawn: boolean;
  assignments: Assignment[];
  inputs: Input[];
  reports: { assignmentId: string; text: string }[];
}
export interface Subscription { thread: string; ticketId: string; context: boolean }
export interface Evaluation {
  id: string;
  triggerId: string;
  version: string;
  strength: Strength;
  outcome: 'pending' | 'accept' | 'ignore' | 'would_accept' | 'unavailable';
}
export interface Receipt { id: string; ticketId: string; text: string; status: 'pending' | 'sent' }
export function current(ticket: Ticket): Assignment {
  const result = ticket.assignments.at(-1);
  if (!result) throw new Error('Ticket must have an Assignment');
  return result;
}
