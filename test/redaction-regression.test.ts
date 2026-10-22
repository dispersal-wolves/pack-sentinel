import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSignal, redact } from '../src/domain.ts';
import { Store } from '../src/store.ts';
import { exportJson } from '../src/export.ts';

test('redaction covers authorization and private key names', () => {
  assert.deepEqual(redact({ Authorization:'Bearer value', private_key:'value', description:'safe' }), { Authorization:'[redacted]', private_key:'[redacted]', description:'safe' });
});

test('signal evidence is redacted before it is stored or exported', () => {
  const signal = makeSignal({ source:'log-howl', kind:'auth', title:'Login', summary:'Observed', severity:'low', evidence:{ user:'operator', password:'hunter2', headers:{ Authorization:'Bearer abc' } } });
  assert.deepEqual(signal.evidence, { user:'operator', password:'[redacted]', headers:{ Authorization:'[redacted]' } });
  const store = new Store(':memory:'); store.insertSignal(signal);
  const exported = exportJson(store.listSignals(), []);
  assert.doesNotMatch(exported, /hunter2|Bearer abc/);
  store.close();
});
