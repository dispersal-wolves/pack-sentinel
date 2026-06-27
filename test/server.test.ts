import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/server.ts';
import { Store } from '../src/store.ts';
import { Engine } from '../src/engine.ts';
import { defaultConfig } from '../src/config.ts';

test('health and dashboard respond', async () => { const config={...structuredClone(defaultConfig),port:0}; const store=new Store(':memory:'); const engine=new Engine(config,store); const server=createApp(config,store,engine); server.listen(0,'127.0.0.1'); await once(server,'listening'); const address=server.address(); assert.ok(address&&typeof address==='object'); const base=`http://127.0.0.1:${address.port}`; const health=await fetch(base+'/api/v1/health'); assert.equal(health.status,200); assert.equal((await health.json()).ok,true); const page=await fetch(base+'/'); assert.match(await page.text(),/Pack Sentinel/); await new Promise<void>(resolve=>server.close(()=>resolve())); store.close(); });
test('token protects API', async () => { const config={...structuredClone(defaultConfig),port:0,apiToken:'correct'}; const store=new Store(':memory:'); const engine=new Engine(config,store); const server=createApp(config,store,engine); server.listen(0,'127.0.0.1'); await once(server,'listening'); const address=server.address(); assert.ok(address&&typeof address==='object'); const base=`http://127.0.0.1:${address.port}`; assert.equal((await fetch(base+'/api/v1/health')).status,401); assert.equal((await fetch(base+'/api/v1/health',{headers:{authorization:'Bearer correct'}})).status,200); await new Promise<void>(resolve=>server.close(()=>resolve())); store.close(); });
