import test from 'node:test';
import assert from 'node:assert/strict';
import { adapt, adapterNames } from '../src/adapters.ts';

test('open ports adapter maps exposed listener', () => {
  const [signal] = adapt('open-ports', { listeners: [{ protocol:'tcp',address:'0.0.0.0',port:8080,state:'LISTEN' }] }, {collector:'open-ports',host:'local'});
  assert.equal(signal.kind, 'network.listener.added'); assert.equal(signal.severity, 'medium');
});
test('file watch adapter gives removals high severity', () => {
  const [signal] = adapt('file-watch', { changes:[{path:'/etc/service',kind:'removed'}] }, {collector:'file-watch',host:'local'});
  assert.equal(signal.severity, 'high');
});
test('secret sweep omits raw match', () => {
  const [signal] = adapt('secret-sweep', {findings:[{file:'a.env',match:'SECRET',rule:'token'}]}, {collector:'secret-sweep',host:'local'});
  assert.equal(signal.evidence?.match, undefined); assert.equal(signal.severity, 'high');
});
test('all first-party adapter names are registered', () => {
  for (const name of ['container-check','file-watch','firewall-kit','honeyfile','host-check','log-howl','open-ports','secret-sweep','ssh-guard']) assert.ok(adapterNames().includes(name));
});
