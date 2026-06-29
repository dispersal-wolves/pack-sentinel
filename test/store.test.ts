import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/store.ts';
import { makeSignal } from '../src/domain.ts';

test('store persists and reads signals', () => { const store = new Store(':memory:'); const signal = makeSignal({source:'test',kind:'change',title:'Change',summary:'Observed',severity:'low'}); assert.equal(store.insertSignal(signal), true); assert.equal(store.listSignals()[0].id, signal.id); store.close(); });
test('recent fingerprint lookup supports dedupe', () => { const store = new Store(':memory:'); const signal = makeSignal({source:'test',kind:'change',title:'Change',summary:'Observed',severity:'low'}); store.insertSignal(signal); assert.equal(store.hasRecentFingerprint(signal.fingerprint, '2020-01-01T00:00:00Z'), true); store.close(); });
test('incident transitions are audited', () => { const store = new Store(':memory:'); store.upsertIncident({id:'i',key:'k',title:'T',summary:'S',severity:'high',status:'open',host:'h',ruleId:'r',signalIds:[],createdAt:'2026-01-01',updatedAt:'2026-01-01'}); assert.equal(store.transitionIncident('i','acknowledged'), true); assert.equal(store.listIncidents()[0].status,'acknowledged'); store.close(); });
