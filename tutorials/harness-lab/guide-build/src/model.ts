import { z } from 'zod';
export const TriggerSchema = z.object({
  id: z.string().min(1), thread: z.string().min(1), source: z.enum(['local', 'github']),
  actor: z.string().min(1), bot: z.boolean(), addressed: z.boolean(), text: z.string(),
  ci: z.enum(['pass', 'fail']).optional(),
}).strict();
export type Trigger = z.infer<typeof TriggerSchema>;
export type Report = 'progress' | 'waiting' | 'ready' | 'blocked' | 'failed' | 'dropped';
export interface Input { trigger: Trigger; consumed: boolean; handedBack?: boolean }
export interface Ticket {
  id: string; requester: string; origin: string; threads: string[]; inputs: Input[];
  sessionId: string; sessionEstablished: boolean; branch: string; directory: string; turn: number; running: boolean;
  report: Report; reportedTurn: number; question: string; summary: string;
  ended?: 'human' | 'completed' | 'dropped' | 'merged' | 'closed';
  prs: { number: number; state: 'open' | 'merged' | 'closed' }[];
  wake: boolean; humanWake: boolean; retries: number; due: number; recovery: string;
}
export interface Message {
  id: string; order: number; ticketId: string; thread: string; text: string;
  purpose: 'ack' | 'answer' | 'result' | 'attention';
  state: 'pending' | 'sent' | 'dropped'; attempts: number; due: number; error?: string;
}
export interface Config { allow: string[]; agent: string; repo: string; maxWords: number }
export const WorkerCommand = z.discriminatedUnion('command', [
  z.object({ command: z.literal('show') }).strict(),
  z.object({ command: z.literal('ack'), to: z.string().optional(), text: z.string().min(1) }).strict(),
  z.object({ command: z.literal('reply'), to: z.string(), text: z.string().min(1) }).strict(),
  z.object({ command: z.literal('report'), status: z.enum(['progress','waiting','ready','blocked','failed','dropped']),
    pr: z.number().int().positive().optional(), summary: z.string().optional(), message: z.string().optional(),
    question: z.string().optional(), to: z.string().optional() }).strict(),
  z.object({ command: z.literal('handback'), trigger: z.string(), reason: z.string().min(1) }).strict(),
]);
export type Command = z.infer<typeof WorkerCommand>;
