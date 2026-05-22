import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface CollectorConfig {
  id: string;
  command: string;
  args: string[];
  adapter: string;
  enabled: boolean;
  intervalSeconds: number;
  timeoutSeconds: number;
  cwd?: string;
  environment?: Record<string, string>;
}

export interface AppConfig {
  database: string;
  bind: string;
  port: number;
  apiToken?: string;
  retentionDays: number;
  dedupeWindowSeconds: number;
  maxConcurrentCollectors: number;
  collectors: CollectorConfig[];
  webhooks: Array<{ id: string; url: string; minimumSeverity: string }>;
}

export const defaultConfig: AppConfig = {
  database: '.pack-sentinel/pack-sentinel.db',
  bind: '127.0.0.1',
  port: 7331,
  retentionDays: 30,
  dedupeWindowSeconds: 300,
  maxConcurrentCollectors: 2,
  collectors: [],
  webhooks: [],
};

export function loadConfig(path?: string): AppConfig {
  if (!path) return structuredClone(defaultConfig);
  const raw = JSON.parse(readFileSync(resolve(path), 'utf8')) as Partial<AppConfig>;
  const config = { ...defaultConfig, ...raw };
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('port must be between 1 and 65535');
  if (!Number.isInteger(config.retentionDays) || config.retentionDays < 1) throw new Error('retentionDays must be a positive integer');
  if (!Number.isInteger(config.maxConcurrentCollectors) || config.maxConcurrentCollectors < 1 || config.maxConcurrentCollectors > 32) throw new Error('maxConcurrentCollectors must be between 1 and 32');
  if (!Array.isArray(config.collectors)) throw new Error('collectors must be an array');
  const ids = new Set<string>();
  for (const collector of config.collectors) {
    if (!collector.id || ids.has(collector.id)) throw new Error(`collector id is missing or duplicated: ${collector.id}`);
    if (!collector.command) throw new Error(`collector ${collector.id} has no command`);
    if (collector.intervalSeconds < 5) throw new Error(`collector ${collector.id} interval must be at least 5 seconds`);
    if (collector.timeoutSeconds < 1) throw new Error(`collector ${collector.id} timeout must be positive`);
    ids.add(collector.id);
  }
  if (config.bind !== '127.0.0.1' && config.bind !== '::1' && !config.apiToken) {
    throw new Error('an API token is required when binding beyond loopback');
  }
  return config;
}
