import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../src/config.ts';

function withConfig(value: unknown, callback: (path:string)=>void) { const dir = mkdtempSync(join(tmpdir(), 'pack-config-')); const path = join(dir, 'config.json'); writeFileSync(path, JSON.stringify(value)); try { callback(path); } finally { rmSync(dir, { recursive: true, force: true }); } }

test('defaults bind to loopback', () => { const config = loadConfig(); assert.equal(config.bind, '127.0.0.1'); assert.equal(config.port, 7331); });
test('public binding requires token', () => withConfig({ bind: '0.0.0.0' }, path => assert.throws(() => loadConfig(path), /token/)));
test('duplicate collector ids fail validation', () => withConfig({ collectors: [
  {id:'a',command:'x',args:[],adapter:'generic',enabled:true,intervalSeconds:5,timeoutSeconds:1},
  {id:'a',command:'x',args:[],adapter:'generic',enabled:true,intervalSeconds:5,timeoutSeconds:1}
] }, path => assert.throws(() => loadConfig(path), /duplicated/)));
test('plain HTTP webhooks outside loopback fail validation', () => withConfig({ webhooks: [{ id:'remote', url:'http://example.com/hook', minimumSeverity:'high' }] }, path => assert.throws(() => loadConfig(path), /HTTPS/)));
test('webhook severity must be known', () => withConfig({ webhooks: [{ id:'local', url:'https://example.com/hook', minimumSeverity:'urgent' }] }, path => assert.throws(() => loadConfig(path), /minimumSeverity/)));
