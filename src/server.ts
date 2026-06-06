import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import type { AppConfig } from './config.ts';
import type { Engine } from './engine.ts';
import type { Store } from './store.ts';
import { dashboardHtml } from './web.ts';

function json(res: ServerResponse, status: number, body: unknown): void {
  const content = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(content), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer' });
  res.end(content);
}

function authorized(req: IncomingMessage, token?: string): boolean {
  if (!token) return true;
  const value = req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '';
  const left = Buffer.from(value); const right = Buffer.from(token);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function body(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 65536) throw new Error('request body too large'); chunks.push(chunk); }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createApp(config: AppConfig, store: Store, engine: Engine) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname.startsWith('/api/') && !authorized(req, config.apiToken)) return json(res, 401, { error: 'unauthorized' });
    try {
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'", 'cache-control': 'no-store' });
        return res.end(dashboardHtml);
      }
      if (req.method === 'GET' && url.pathname === '/api/v1/health') return json(res, 200, store.health());
      if (req.method === 'GET' && url.pathname === '/api/v1/state') return json(res, 200, engine.state());
      if (req.method === 'GET' && url.pathname === '/api/v1/signals') return json(res, 200, { items: store.listSignals(clamp(url.searchParams.get('limit'))) });
      if (req.method === 'GET' && url.pathname === '/api/v1/incidents') return json(res, 200, { items: store.listIncidents(clamp(url.searchParams.get('limit')), url.searchParams.get('status') ?? undefined) });
      if (req.method === 'POST' && url.pathname === '/api/v1/collect') return json(res, 202, { runs: await engine.runAll() });
      const transition = url.pathname.match(/^\/api\/v1\/incidents\/([^/]+)\/(acknowledge|resolve|suppress)$/);
      if (req.method === 'POST' && transition) {
        await body(req);
        const status = transition[2] === 'acknowledge' ? 'acknowledged' : transition[2] === 'resolve' ? 'resolved' : 'suppressed';
        return store.transitionIncident(decodeURIComponent(transition[1]), status) ? json(res, 200, { ok: true }) : json(res, 404, { error: 'incident not found' });
      }
      return json(res, 404, { error: 'not found' });
    } catch (error) { return json(res, 400, { error: error instanceof Error ? error.message : String(error) }); }
  });
}

function clamp(value: string | null): number { const parsed = Number(value ?? 100); return Number.isFinite(parsed) ? Math.max(1, Math.min(500, Math.floor(parsed))) : 100; }
