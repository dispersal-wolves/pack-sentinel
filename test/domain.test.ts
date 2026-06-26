import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSignal, maxSeverity, redact, stableFingerprint } from '../src/domain.ts';

test('makeSignal applies stable defaults', () => {
  const input = { source: 'host-check', kind: 'host.firewall', title: 'Firewall', summary: 'Review', severity: 'medium' as const };
  const signal = makeSignal(input, new Date('2026-01-01T00:00:00Z'));
  assert.equal(signal.host, 'localhost'); assert.equal(signal.observedAt, '2026-01-01T00:00:00.000Z');
  assert.equal(signal.fingerprint, stableFingerprint(input));
});

test('fingerprints ignore observation time', () => {
  const base = { source: 'a', kind: 'b', title: 'c', summary: 'd', severity: 'low' as const };
  assert.equal(stableFingerprint({ ...base, observedAt: '2025-01-01' }), stableFingerprint({ ...base, observedAt: '2026-01-01' }));
});

test('redaction handles nested secret fields', () => {
  assert.deepEqual(redact({ token: 'value', nested: { apiKey: 'value', safe: 3 } }), { token: '[redacted]', nested: { apiKey: '[redacted]', safe: 3 } });
});

test('maxSeverity returns highest member', () => assert.equal(maxSeverity(['info', 'critical', 'medium']), 'critical'));
