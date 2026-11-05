import type { Trigger } from './model.ts';

/** A fixture envelope for this course, not the GitHub webhook/API wire format. */
export function normalize(value: unknown): Trigger {
  if (!value || typeof value !== 'object') throw new Error('Event must be an object');
  const event = value as Record<string, unknown>;
  for (const field of ['repository', 'id', 'actor', 'thread', 'text']) {
    if (typeof event[field] !== 'string' || !event[field]) throw new Error(`Invalid ${field}`);
  }
  if (typeof event.human !== 'boolean' || typeof event.addressed !== 'boolean') throw new Error('Invalid actor flags');
  return {
    id: JSON.stringify(['github', event.repository, event.id]), source: 'github',
    repository: String(event.repository), actor: String(event.actor), human: event.human,
    addressed: event.addressed, threads: [JSON.stringify([event.repository, event.thread])], text: String(event.text),
  };
}
