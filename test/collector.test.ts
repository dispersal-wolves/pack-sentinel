import test from 'node:test';
import assert from 'node:assert/strict';
import { runCollector } from '../src/collector.ts';

test('collector executes without a shell and adapts JSON', async () => {
  const result = await runCollector({ id:'demo', command:process.execPath, args:['fixtures/demo-collector.mjs'], adapter:'generic', enabled:true, intervalSeconds:60, timeoutSeconds:5 });
  assert.equal(result.error, undefined); assert.equal(result.signals.length, 2);
});

test('collector reports invalid JSON safely', async () => {
  const result = await runCollector({ id:'bad', command:process.execPath, args:['-e','console.log("no")'], adapter:'generic', enabled:true, intervalSeconds:60, timeoutSeconds:5 });
  assert.match(result.error ?? '', /invalid JSON/);
});
