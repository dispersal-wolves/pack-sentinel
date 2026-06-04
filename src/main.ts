#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { loadConfig } from './config.ts';
import { Store } from './store.ts';
import { Engine } from './engine.ts';
import { createApp } from './server.ts';
import { exportCsv, exportJson, exportJsonl, exportSarif } from './export.ts';
import { adapterNames } from './adapters.ts';

const args = process.argv.slice(2);
const command = args[0] ?? 'help';
const option = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };

function help(): void { console.log(`Pack Sentinel

Usage:
  pack-sentinel serve [--config FILE]
  pack-sentinel collect [--config FILE]
  pack-sentinel incidents [--config FILE] [--status STATUS]
  pack-sentinel export [--config FILE] [--format json|jsonl|csv|sarif] [--output FILE]
  pack-sentinel adapters
  pack-sentinel prune [--config FILE]
  pack-sentinel doctor [--config FILE]
`); }

async function main(): Promise<void> {
  if (command === 'help' || command === '--help' || command === '-h') return help();
  if (command === 'adapters') { console.log(adapterNames().join('\n')); return; }
  const config = loadConfig(option('--config'));
  const store = new Store(config.database);
  const engine = new Engine(config, store);
  const shutdown = () => { engine.stop(); store.close(); };
  try {
    if (command === 'collect') { console.log(JSON.stringify({ runs: await engine.runAll() }, null, 2)); return; }
    if (command === 'incidents') { console.log(JSON.stringify({ items: store.listIncidents(100, option('--status')) }, null, 2)); return; }
    if (command === 'prune') { console.log(JSON.stringify({ deleted: store.prune(config.retentionDays) })); return; }
    if (command === 'doctor') { console.log(JSON.stringify({ ...store.health(), collectors: config.collectors.map(item => ({ id: item.id, enabled: item.enabled, adapter: item.adapter })) }, null, 2)); return; }
    if (command === 'export') {
      const format = option('--format') ?? 'json'; const signals = store.listSignals(500); const incidents = store.listIncidents(500);
      const content = format === 'json' ? exportJson(signals, incidents) : format === 'jsonl' ? exportJsonl(signals) : format === 'csv' ? exportCsv(signals) : format === 'sarif' ? exportSarif(signals) : (() => { throw new Error('format must be json, jsonl, csv, or sarif'); })();
      const output = option('--output'); if (output) writeFileSync(output, content, { encoding: 'utf8', mode: 0o600 }); else process.stdout.write(content); return;
    }
    if (command === 'serve') {
      engine.start(); const server = createApp(config, store, engine);
      server.listen(config.port, config.bind, () => console.log(`Pack Sentinel listening on http://${config.bind}:${config.port}`));
      const stop = () => server.close(() => { shutdown(); process.exit(0); }); process.once('SIGINT', stop); process.once('SIGTERM', stop); return;
    }
    throw new Error(`unknown command: ${command}`);
  } finally { if (command !== 'serve') shutdown(); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
