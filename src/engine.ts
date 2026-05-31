import type { AppConfig, CollectorConfig } from './config.ts';
import { makeSignal } from './domain.ts';
import { correlate } from './correlation.ts';
import { runCollector } from './collector.ts';
import { Store } from './store.ts';

export class Engine {
  private running = new Set<string>();
  private timers: NodeJS.Timeout[] = [];
  private stopped = false;
  readonly config: AppConfig;
  readonly store: Store;

  constructor(config: AppConfig, store: Store) {
    this.config = config;
    this.store = store;
  }

  async runOne(collector: CollectorConfig): Promise<{accepted:number;error?:string}> {
    if (this.running.has(collector.id)) return { accepted: 0, error: 'collector is already running' };
    if (this.running.size >= this.config.maxConcurrentCollectors) return { accepted: 0, error: 'collector concurrency limit reached' };
    this.running.add(collector.id);
    try {
      const result = await runCollector(collector);
      this.store.recordRun(result);
      if (result.error) return { accepted: 0, error: result.error };
      let accepted = 0;
      for (const input of result.signals) {
        const signal = makeSignal(input);
        const since = new Date(Date.now() - this.config.dedupeWindowSeconds * 1000).toISOString();
        if (this.store.hasRecentFingerprint(signal.fingerprint, since)) continue;
        if (this.store.insertSignal(signal)) accepted += 1;
      }
      for (const incident of correlate(this.store.listSignals(500))) this.store.upsertIncident(incident);
      return { accepted };
    } finally { this.running.delete(collector.id); }
  }

  async runAll(): Promise<Array<{id:string;accepted:number;error?:string}>> {
    const enabled = this.config.collectors.filter(item => item.enabled);
    const results: Array<{id:string;accepted:number;error?:string}> = [];
    for (let offset = 0; offset < enabled.length; offset += this.config.maxConcurrentCollectors) {
      const batch = enabled.slice(offset, offset + this.config.maxConcurrentCollectors);
      results.push(...await Promise.all(batch.map(async item => ({ id: item.id, ...await this.runOne(item) }))));
    }
    return results;
  }

  start(): void {
    this.stopped = false;
    for (const collector of this.config.collectors.filter(item => item.enabled)) {
      void this.runOne(collector);
      const timer = setInterval(() => { if (!this.stopped) void this.runOne(collector); }, collector.intervalSeconds * 1000);
      timer.unref();
      this.timers.push(timer);
    }
    const prune = setInterval(() => this.store.prune(this.config.retentionDays), 86400000);
    prune.unref(); this.timers.push(prune);
  }

  stop(): void { this.stopped = true; this.timers.forEach(clearInterval); this.timers = []; }
  state(): {running:string[];scheduled:number} { return { running: [...this.running].sort(), scheduled: this.timers.length }; }
}
