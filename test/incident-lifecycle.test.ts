import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/store.ts';

test('correlation refresh does not reopen acknowledged incident', () => {
  const store = new Store(':memory:');
  const incident = { id:'first', key:'stable', title:'Finding', summary:'Evidence', severity:'high' as const, status:'open' as const, host:'local', ruleId:'rule', signalIds:['one'], createdAt:'2026-01-01', updatedAt:'2026-01-01' };
  store.upsertIncident(incident);
  store.transitionIncident('first', 'acknowledged');
  store.upsertIncident({ ...incident, id:'second', signalIds:['one','two'], updatedAt:'2026-01-02' });
  const saved = store.listIncidents()[0];
  assert.equal(saved.status, 'acknowledged');
  assert.deepEqual(saved.signalIds, ['one','two']);
  store.close();
});
