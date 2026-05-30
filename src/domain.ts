import { createHash, randomUUID } from 'node:crypto';

export const severities = ['info', 'low', 'medium', 'high', 'critical'] as const;
export type Severity = typeof severities[number];
export type EventStatus = 'open' | 'acknowledged' | 'resolved' | 'suppressed';

export interface SignalInput {
  source: string;
  kind: string;
  title: string;
  summary: string;
  severity: Severity;
  observedAt?: string;
  host?: string;
  evidence?: Record<string, unknown>;
  tags?: string[];
  fingerprint?: string;
}

export interface Signal extends Required<Omit<SignalInput, 'fingerprint'>> {
  id: string;
  fingerprint: string;
  receivedAt: string;
}

export interface Incident {
  id: string;
  key: string;
  title: string;
  summary: string;
  severity: Severity;
  status: EventStatus;
  host: string;
  ruleId: string;
  signalIds: string[];
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface CollectorResult {
  collector: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  signals: SignalInput[];
  error?: string;
}

export function isSeverity(value: unknown): value is Severity {
  return typeof value === 'string' && severities.includes(value as Severity);
}

export function severityRank(value: Severity): number {
  return severities.indexOf(value);
}

export function maxSeverity(values: Severity[]): Severity {
  return values.reduce((highest, current) =>
    severityRank(current) > severityRank(highest) ? current : highest, 'info');
}

export function stableFingerprint(input: SignalInput): string {
  if (input.fingerprint?.trim()) return input.fingerprint.trim();
  const stable = JSON.stringify({
    source: input.source,
    kind: input.kind,
    title: input.title,
    host: input.host ?? 'localhost',
    evidence: input.evidence ?? {},
  });
  return createHash('sha256').update(stable).digest('hex').slice(0, 32);
}

export function makeSignal(input: SignalInput, now = new Date()): Signal {
  const iso = now.toISOString();
  return {
    id: randomUUID(),
    source: input.source.trim(),
    kind: input.kind.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    severity: input.severity,
    observedAt: input.observedAt ?? iso,
    receivedAt: iso,
    host: input.host?.trim() || 'localhost',
    evidence: input.evidence ?? {},
    tags: [...new Set(input.tags ?? [])].sort(),
    fingerprint: stableFingerprint(input),
  };
}

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = /(secret|token|password|authorization|api.?key|private.?key)/i.test(key)
      ? '[redacted]'
      : redact(item);
  }
  return result;
}
