import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine } from '../src/engine.ts';
import { Store } from '../src/store.ts';
import { defaultConfig } from '../src/config.ts';
import { createServer } from 'node:http';
import { once } from 'node:events';

test('engine stores collector signals and deduplicates reruns', async () => {
  const collector={id:'demo',command:process.execPath,args:['fixtures/demo-collector.mjs'],adapter:'generic',enabled:true,intervalSeconds:60,timeoutSeconds:5};
  const config={...structuredClone(defaultConfig),collectors:[collector],dedupeWindowSeconds:300}; const store=new Store(':memory:'); const engine=new Engine(config,store);
  assert.equal((await engine.runOne(collector)).accepted,2); assert.equal((await engine.runOne(collector)).accepted,0); store.close();
});

test('engine delivers a webhook once for each newly opened incident', async () => {
  const received: unknown[] = [];
  const receiver = createServer((req, res) => { let data = ''; req.on('data', chunk => { data += chunk; }); req.on('end', () => { received.push(JSON.parse(data)); res.end('ok'); }); });
  receiver.listen(0, '127.0.0.1'); await once(receiver, 'listening');
  const address = receiver.address(); assert.ok(address && typeof address === 'object');
  const collector={id:'critical',command:process.execPath,args:['-e','console.log(JSON.stringify({findings:[{kind:"host.canary",title:"Canary",severity:"critical"}]}))'],adapter:'generic',enabled:true,intervalSeconds:60,timeoutSeconds:5};
  const config={...structuredClone(defaultConfig),collectors:[collector],dedupeWindowSeconds:0,webhooks:[{id:'local',url:`http://127.0.0.1:${address.port}/hook`,minimumSeverity:'high' as const}]};
  const store=new Store(':memory:'); const engine=new Engine(config,store);
  await engine.runOne(collector); await engine.runOne(collector);
  assert.equal(received.length, 1);
  const payload = received[0] as { schema: string; incident: { ruleId: string; severity: string } };
  assert.equal(payload.schema, 'dispersal-wolves/pack-sentinel/webhook/v1'); assert.equal(payload.incident.ruleId, 'critical-single');
  const audited = store.db.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action='webhook.delivered'").get() as {count:number};
  assert.equal(audited.count, 1);
  await new Promise<void>(resolve => receiver.close(() => resolve())); store.close();
});
