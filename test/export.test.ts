import test from 'node:test';
import assert from 'node:assert/strict';
import { exportCsv, exportJson, exportSarif } from '../src/export.ts';
import { makeSignal } from '../src/domain.ts';

const signal = makeSignal({source:'test',kind:'test.kind',title:'A, title',summary:'Summary',severity:'medium'});
test('csv quotes commas',()=>assert.match(exportCsv([signal]), /"A, title"/));
test('json uses versioned schema',()=>assert.equal(JSON.parse(exportJson([signal],[])).schema,'dispersal-wolves/pack-sentinel/export/v1'));
test('sarif contains findings',()=>assert.equal(JSON.parse(exportSarif([signal])).runs[0].results.length,1));
