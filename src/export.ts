import type { Incident, Signal } from './domain.ts';

function csvCell(value: unknown): string { const text = String(value ?? ''); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }

export function exportJson(signals: Signal[], incidents: Incident[]): string {
  return JSON.stringify({ schema: 'dispersal-wolves/pack-sentinel/export/v1', generatedAt: new Date().toISOString(), signals, incidents }, null, 2) + '\n';
}

export function exportJsonl(signals: Signal[]): string { return signals.map(signal => JSON.stringify(signal)).join('\n') + (signals.length ? '\n' : ''); }

export function exportCsv(signals: Signal[]): string {
  const fields = ['id','source','kind','title','severity','host','observedAt','receivedAt'] as const;
  return [fields.join(','), ...signals.map(signal => fields.map(field => csvCell(signal[field])).join(','))].join('\n') + '\n';
}

export function exportSarif(signals: Signal[]): string {
  const level = (severity: Signal['severity']) => severity === 'critical' || severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'note';
  return JSON.stringify({ version: '2.1.0', $schema: 'https://json.schemastore.org/sarif-2.1.0.json', runs: [{
    tool: { driver: { name: 'Pack Sentinel', informationUri: 'https://dispersalwolves.com' } },
    results: signals.map(signal => ({ ruleId: `${signal.source}/${signal.kind}`, level: level(signal.severity), message: { text: `${signal.title}: ${signal.summary}` }, properties: { host: signal.host, observedAt: signal.observedAt, fingerprint: signal.fingerprint } })),
  }] }, null, 2) + '\n';
}
