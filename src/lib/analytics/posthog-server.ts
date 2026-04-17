import 'server-only';
import { PostHog } from 'posthog-node';
import type { PesonaEventName, EventProperties } from './events';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  });

  return client;
}

/**
 * Server-side type-safe event tracking.
 */
export function trackServerEvent<E extends PesonaEventName>(
  userId: string,
  event: E,
  properties: EventProperties<E>,
) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId: userId, event, properties });
}

export async function shutdownPostHog() {
  if (client) await client.shutdown();
}
