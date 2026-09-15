import test from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../src/domain.ts';

test('redaction covers authorization and private key names', () => {
  assert.deepEqual(redact({ Authorization:'Bearer value', private_key:'value', description:'safe' }), { Authorization:'[redacted]', private_key:'[redacted]', description:'safe' });
});
