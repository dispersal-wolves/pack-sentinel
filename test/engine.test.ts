import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine } from '../src/engine.ts';
import { Store } from '../src/store.ts';
import { defaultConfig } from '../src/config.ts';

test('engine stores collector signals and deduplicates reruns', async () => {
  const collector={id:'demo',command:process.execPath,args:['fixtures/demo-collector.mjs'],adapter:'generic',enabled:true,intervalSeconds:60,timeoutSeconds:5};
  const config={...structuredClone(defaultConfig),collectors:[collector],dedupeWindowSeconds:300}; const store=new Store(':memory:'); const engine=new Engine(config,store);
  assert.equal((await engine.runOne(collector)).accepted,2); assert.equal((await engine.runOne(collector)).accepted,0); store.close();
});
