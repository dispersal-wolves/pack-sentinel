import { spawn } from 'node:child_process';
import { adapt } from './adapters.ts';
import type { CollectorConfig } from './config.ts';
import type { CollectorResult } from './domain.ts';

const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

export async function runCollector(config: CollectorConfig, host = 'localhost', signal?: AbortSignal): Promise<CollectorResult> {
  const started = new Date();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(`collector timed out after ${config.timeoutSeconds}s`)), config.timeoutSeconds * 1000);
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const output = await execute(config, controller.signal);
    let parsed: unknown;
    try { parsed = JSON.parse(output); }
    catch { throw new Error('collector returned invalid JSON'); }
    const signals = adapt(config.adapter, parsed, { collector: config.id, host });
    const finished = new Date();
    return { collector: config.id, startedAt: started.toISOString(), finishedAt: finished.toISOString(), durationMs: finished.getTime() - started.getTime(), signals };
  } catch (error) {
    const finished = new Date();
    return { collector: config.id, startedAt: started.toISOString(), finishedAt: finished.toISOString(), durationMs: finished.getTime() - started.getTime(), signals: [], error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}

function execute(config: CollectorConfig, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(config.command, config.args, {
      cwd: config.cwd, env: { ...process.env, ...config.environment }, shell: false,
      windowsHide: true, signal, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let bytes = 0;
    child.stdout.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > MAX_OUTPUT_BYTES) child.kill();
      else stdout.push(chunk);
    });
    child.stderr.on('data', chunk => { if (stderr.reduce((n, item) => n + item.length, 0) < 65536) stderr.push(chunk); });
    child.on('error', reject);
    child.on('close', code => {
      if (bytes > MAX_OUTPUT_BYTES) return reject(new Error('collector output exceeded 8 MiB'));
      if (code !== 0) return reject(new Error(`collector exited ${code}: ${Buffer.concat(stderr).toString('utf8').trim()}`));
      resolve(Buffer.concat(stdout).toString('utf8'));
    });
  });
}
