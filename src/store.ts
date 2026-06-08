import { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { Incident, Signal } from './domain.ts';

const migrations = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS signals (
     id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, source TEXT NOT NULL, kind TEXT NOT NULL,
     title TEXT NOT NULL, summary TEXT NOT NULL, severity TEXT NOT NULL, host TEXT NOT NULL,
     evidence_json TEXT NOT NULL, tags_json TEXT NOT NULL, observed_at TEXT NOT NULL, received_at TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_signals_received ON signals(received_at DESC);
   CREATE INDEX IF NOT EXISTS idx_signals_fingerprint ON signals(fingerprint, received_at DESC);
   CREATE TABLE IF NOT EXISTS incidents (
     id TEXT PRIMARY KEY, incident_key TEXT NOT NULL UNIQUE, title TEXT NOT NULL, summary TEXT NOT NULL,
     severity TEXT NOT NULL, status TEXT NOT NULL, host TEXT NOT NULL, rule_id TEXT NOT NULL,
     signal_ids_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
     acknowledged_at TEXT, resolved_at TEXT
   );
   CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status, updated_at DESC);`,
  `CREATE TABLE IF NOT EXISTS collector_runs (
     id INTEGER PRIMARY KEY AUTOINCREMENT, collector TEXT NOT NULL, started_at TEXT NOT NULL,
     finished_at TEXT NOT NULL, duration_ms INTEGER NOT NULL, signal_count INTEGER NOT NULL,
     error TEXT
   );`,
  `CREATE TABLE IF NOT EXISTS audit_log (
     id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL,
     subject TEXT NOT NULL, detail_json TEXT NOT NULL, created_at TEXT NOT NULL
   );`,
];

export class Store {
  readonly db: DatabaseSync;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    this.migrate();
  }

  migrate(): void {
    this.db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
    const applied = new Set((this.db.prepare('SELECT version FROM schema_migrations').all() as Array<{version: number}>).map(row => row.version));
    migrations.forEach((sql, index) => {
      const version = index + 1;
      if (applied.has(version)) return;
      this.db.exec('BEGIN IMMEDIATE');
      try {
        this.db.exec(sql);
        this.db.prepare('INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)').run(version, new Date().toISOString());
        this.db.exec('COMMIT');
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    });
  }

  insertSignal(signal: Signal): boolean {
    const result = this.db.prepare(`INSERT OR IGNORE INTO signals
      (id,fingerprint,source,kind,title,summary,severity,host,evidence_json,tags_json,observed_at,received_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(signal.id, signal.fingerprint, signal.source, signal.kind,
      signal.title, signal.summary, signal.severity, signal.host, JSON.stringify(signal.evidence),
      JSON.stringify(signal.tags), signal.observedAt, signal.receivedAt);
    return result.changes > 0;
  }

  hasRecentFingerprint(fingerprint: string, sinceIso: string): boolean {
    return Boolean(this.db.prepare('SELECT 1 FROM signals WHERE fingerprint=? AND received_at>=? LIMIT 1').get(fingerprint, sinceIso));
  }

  listSignals(limit = 100): Signal[] {
    const rows = this.db.prepare('SELECT * FROM signals ORDER BY received_at DESC LIMIT ?').all(limit) as Record<string, unknown>[];
    return rows.map(row => ({
      id: String(row.id), fingerprint: String(row.fingerprint), source: String(row.source), kind: String(row.kind),
      title: String(row.title), summary: String(row.summary), severity: String(row.severity) as Signal['severity'],
      host: String(row.host), evidence: JSON.parse(String(row.evidence_json)), tags: JSON.parse(String(row.tags_json)),
      observedAt: String(row.observed_at), receivedAt: String(row.received_at),
    }));
  }

  upsertIncident(incident: Incident): void {
    this.db.prepare(`INSERT INTO incidents
      (id,incident_key,title,summary,severity,status,host,rule_id,signal_ids_json,created_at,updated_at,acknowledged_at,resolved_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(incident_key) DO UPDATE SET
      title=excluded.title,summary=excluded.summary,severity=excluded.severity,
      signal_ids_json=excluded.signal_ids_json,updated_at=excluded.updated_at`).run(
        incident.id, incident.key, incident.title, incident.summary, incident.severity, incident.status,
        incident.host, incident.ruleId, JSON.stringify(incident.signalIds), incident.createdAt, incident.updatedAt,
        incident.acknowledgedAt ?? null, incident.resolvedAt ?? null);
  }

  listIncidents(limit = 100, status?: string): Incident[] {
    const rows = status
      ? this.db.prepare('SELECT * FROM incidents WHERE status=? ORDER BY updated_at DESC LIMIT ?').all(status, limit)
      : this.db.prepare('SELECT * FROM incidents ORDER BY updated_at DESC LIMIT ?').all(limit);
    return (rows as Record<string, unknown>[]).map(row => ({
      id: String(row.id), key: String(row.incident_key), title: String(row.title), summary: String(row.summary),
      severity: String(row.severity) as Incident['severity'], status: String(row.status) as Incident['status'],
      host: String(row.host), ruleId: String(row.rule_id), signalIds: JSON.parse(String(row.signal_ids_json)),
      createdAt: String(row.created_at), updatedAt: String(row.updated_at),
      ...(row.acknowledged_at ? { acknowledgedAt: String(row.acknowledged_at) } : {}),
      ...(row.resolved_at ? { resolvedAt: String(row.resolved_at) } : {}),
    }));
  }

  transitionIncident(id: string, status: Incident['status'], actor = 'local'): boolean {
    const now = new Date().toISOString();
    const column = status === 'acknowledged' ? 'acknowledged_at' : status === 'resolved' ? 'resolved_at' : undefined;
    const sql = column
      ? `UPDATE incidents SET status=?, updated_at=?, ${column}=? WHERE id=?`
      : 'UPDATE incidents SET status=?, updated_at=? WHERE id=?';
    const result = column ? this.db.prepare(sql).run(status, now, now, id) : this.db.prepare(sql).run(status, now, id);
    if (result.changes) this.audit(actor, `incident.${status}`, id, {});
    return result.changes > 0;
  }

  recordRun(run: {collector:string;startedAt:string;finishedAt:string;durationMs:number;signals:unknown[];error?:string}): void {
    this.db.prepare(`INSERT INTO collector_runs(collector,started_at,finished_at,duration_ms,signal_count,error)
      VALUES(?,?,?,?,?,?)`).run(run.collector, run.startedAt, run.finishedAt, run.durationMs, run.signals.length, run.error ?? null);
  }

  audit(actor: string, action: string, subject: string, detail: unknown): void {
    this.db.prepare('INSERT INTO audit_log(actor,action,subject,detail_json,created_at) VALUES(?,?,?,?,?)')
      .run(actor, action, subject, JSON.stringify(detail), new Date().toISOString());
  }

  prune(retentionDays: number): number {
    const cutoff = new Date(Date.now() - retentionDays * 86400000).toISOString();
    const result = this.db.prepare(`DELETE FROM signals WHERE received_at < ? AND id NOT IN
      (SELECT value FROM incidents, json_each(incidents.signal_ids_json) WHERE status IN ('open','acknowledged'))`).run(cutoff);
    this.audit('system', 'retention.prune', 'signals', { cutoff, deleted: result.changes });
    return Number(result.changes);
  }

  health(): {ok:boolean;signals:number;incidents:number} {
    const signals = this.db.prepare('SELECT COUNT(*) AS count FROM signals').get() as {count:number};
    const incidents = this.db.prepare('SELECT COUNT(*) AS count FROM incidents').get() as {count:number};
    return { ok: true, signals: signals.count, incidents: incidents.count };
  }

  close(): void { this.db.close(); }
}
