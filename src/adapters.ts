import type { SignalInput } from './domain.ts';

export interface AdapterContext { collector: string; host: string }
export type Adapter = (value: unknown, context: AdapterContext) => SignalInput[];

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('collector output must be a JSON object');
  return value as Record<string, unknown>;
}

function array(value: unknown, key?: string): unknown[] {
  if (Array.isArray(value)) return value;
  const record = object(value);
  const candidate = key ? record[key] : undefined;
  if (!Array.isArray(candidate)) throw new Error(key ? `collector output has no ${key} array` : 'collector output must be an array');
  return candidate;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function level(value: unknown): SignalInput['severity'] {
  const normalized = text(value, 'medium').toLowerCase();
  if (normalized === 'critical' || normalized === 'high' || normalized === 'medium' || normalized === 'low' || normalized === 'info') return normalized;
  if (normalized === 'warn' || normalized === 'warning') return 'medium';
  if (normalized === 'fail' || normalized === 'error') return 'high';
  return 'info';
}

const generic: Adapter = (value, context) => array(value, 'findings').map((entry, index) => {
  const finding = object(entry);
  return {
    source: context.collector,
    kind: text(finding.kind, text(finding.check, 'finding')),
    title: text(finding.title, text(finding.message, `Finding ${index + 1}`)),
    summary: text(finding.summary, text(finding.detail, text(finding.message, 'Collector reported a finding'))),
    severity: level(finding.severity ?? finding.status), host: context.host,
    evidence: finding, tags: [context.collector],
  };
});

const openPorts: Adapter = (value, context) => {
  const record = object(value);
  const listeners = Array.isArray(record.listeners) ? record.listeners : Array.isArray(value) ? value : [];
  const added = Array.isArray(record.added) ? record.added : listeners;
  return added.map(entry => {
    const listener = object(entry);
    const address = text(listener.address, 'unknown');
    const port = String(listener.port ?? '?');
    const protocol = text(listener.protocol, 'tcp');
    return {
      source: context.collector, kind: 'network.listener.added', title: `New ${protocol.toUpperCase()} listener on ${port}`,
      summary: `${address}:${port} is accepting connections`, severity: address.startsWith('127.') || address === '::1' ? 'low' : 'medium',
      host: context.host, evidence: listener, tags: ['network', 'listener'], fingerprint: `${context.host}:${protocol}:${address}:${port}`,
    };
  });
};

const fileWatch: Adapter = (value, context) => array(value, 'changes').map(entry => {
  const change = object(entry);
  const path = text(change.path, 'unknown path');
  const type = text(change.kind, text(change.change, 'changed'));
  return {
    source: context.collector, kind: `file.${type}`, title: `File ${type}: ${path}`,
    summary: `Integrity baseline reports ${type}`, severity: type === 'removed' ? 'high' : 'medium', host: context.host,
    evidence: change, tags: ['filesystem', 'integrity'], fingerprint: `${context.host}:${type}:${path}`,
  };
});

const hostCheck: Adapter = (value, context) => {
  const record = object(value);
  return array(record, 'findings').filter(entry => text(object(entry).status) !== 'pass').map(entry => {
    const finding = object(entry);
    return {
      source: context.collector, kind: `host.${text(finding.check, 'posture')}`,
      title: text(finding.title, text(finding.check, 'Host posture finding')),
      summary: text(finding.detail, text(finding.message, 'Host posture requires attention')),
      severity: level(finding.status), host: context.host, evidence: finding, tags: ['host', 'posture'],
    };
  });
};

const secretSweep: Adapter = (value, context) => array(value, 'findings').map(entry => {
  const finding = object(entry);
  return {
    source: context.collector, kind: 'secret.detected', title: `Potential secret in ${text(finding.file, 'repository')}`,
    summary: text(finding.rule, text(finding.type, 'Secret pattern detected')), severity: level(finding.severity ?? 'high'),
    host: context.host, evidence: { ...finding, match: undefined }, tags: ['secret', 'repository'],
  };
});

const honeyfile: Adapter = (value, context) => array(value, 'events').map(entry => {
  const event = object(entry);
  return { source: context.collector, kind: 'canary.touched', title: `Canary accessed: ${text(event.path, 'unknown')}`,
    summary: text(event.action, 'A monitored canary changed'), severity: 'critical', host: context.host,
    evidence: event, tags: ['canary', 'filesystem'] };
});

const adapters: Record<string, Adapter> = {
  generic, 'open-ports': openPorts, 'file-watch': fileWatch, 'host-check': hostCheck,
  'secret-sweep': secretSweep, honeyfile,
  'container-check': generic, 'log-howl': generic, 'ssh-guard': generic, 'firewall-kit': generic,
};

export function adapt(name: string, value: unknown, context: AdapterContext): SignalInput[] {
  const adapter = adapters[name];
  if (!adapter) throw new Error(`unknown adapter: ${name}`);
  return adapter(value, context);
}

export function adapterNames(): string[] { return Object.keys(adapters).sort(); }
