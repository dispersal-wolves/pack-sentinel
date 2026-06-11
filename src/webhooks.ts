import type { Incident } from './domain.ts';
import { severityRank } from './domain.ts';

export async function deliverWebhook(url: string, incident: Incident, minimum: Incident['severity'] = 'medium'): Promise<{ok:boolean;status:number}> {
  if (severityRank(incident.severity) < severityRank(minimum)) return { ok: true, status: 0 };
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') throw new Error('webhooks require HTTPS outside loopback');
  const response = await fetch(parsed, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'pack-sentinel/0.1' }, body: JSON.stringify({ schema: 'dispersal-wolves/pack-sentinel/webhook/v1', incident }), signal: AbortSignal.timeout(10000), redirect: 'error' });
  return { ok: response.ok, status: response.status };
}
