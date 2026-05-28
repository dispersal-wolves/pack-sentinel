import { createHash, randomUUID } from 'node:crypto';
import type { Incident, Signal } from './domain.ts';
import { maxSeverity, severityRank } from './domain.ts';

export interface CorrelationRule {
  id: string;
  title: string;
  windowSeconds: number;
  minimumSeverity?: Signal['severity'];
  allKinds?: string[];
  anyKinds?: string[];
  sourceCount?: number;
  incidentSeverity?: Signal['severity'];
  summary: string;
}

export const builtInRules: CorrelationRule[] = [
  { id: 'critical-single', title: 'Critical local signal', windowSeconds: 60, minimumSeverity: 'critical', summary: 'A collector reported a critical local security signal.' },
  { id: 'canary-access', title: 'Canary file activity', windowSeconds: 300, anyKinds: ['canary.touched'], incidentSeverity: 'critical', summary: 'A monitored canary was accessed or changed.' },
  { id: 'service-integrity', title: 'Service exposure changed with file activity', windowSeconds: 900, allKinds: ['network.listener.added'], anyKinds: ['file.changed', 'file.added', 'file.removed'], sourceCount: 2, incidentSeverity: 'high', summary: 'Network exposure and file integrity changed on the same host.' },
  { id: 'multi-source-high', title: 'Multiple security controls reported changes', windowSeconds: 600, minimumSeverity: 'medium', sourceCount: 3, incidentSeverity: 'high', summary: 'Independent collectors reported related changes on the same host.' },
];

function matches(rule: CorrelationRule, signals: Signal[]): boolean {
  if (!signals.length) return false;
  if (rule.minimumSeverity && !signals.some(signal => severityRank(signal.severity) >= severityRank(rule.minimumSeverity!))) return false;
  if (rule.allKinds && !rule.allKinds.every(kind => signals.some(signal => signal.kind === kind))) return false;
  if (rule.anyKinds && !rule.anyKinds.some(kind => signals.some(signal => signal.kind === kind))) return false;
  if (rule.sourceCount && new Set(signals.map(signal => signal.source)).size < rule.sourceCount) return false;
  return true;
}

export function correlate(signals: Signal[], rules = builtInRules, now = new Date()): Incident[] {
  const byHost = Map.groupBy(signals, signal => signal.host);
  const incidents: Incident[] = [];
  for (const [host, hostSignals] of byHost) {
    for (const rule of rules) {
      const cutoff = now.getTime() - rule.windowSeconds * 1000;
      const candidates = hostSignals.filter(signal => new Date(signal.observedAt).getTime() >= cutoff);
      if (!matches(rule, candidates)) continue;
      const selected = candidates.filter(signal => {
        if (rule.allKinds?.includes(signal.kind) || rule.anyKinds?.includes(signal.kind)) return true;
        return rule.minimumSeverity ? severityRank(signal.severity) >= severityRank(rule.minimumSeverity) : true;
      });
      const key = createHash('sha256').update(`${rule.id}:${host}`).digest('hex').slice(0, 24);
      const iso = now.toISOString();
      incidents.push({ id: randomUUID(), key, title: rule.title, summary: rule.summary,
        severity: rule.incidentSeverity ?? maxSeverity(selected.map(signal => signal.severity)), status: 'open', host,
        ruleId: rule.id, signalIds: selected.map(signal => signal.id).sort(), createdAt: iso, updatedAt: iso });
    }
  }
  return incidents;
}
