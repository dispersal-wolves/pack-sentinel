import test from 'node:test';
import assert from 'node:assert/strict';
import { correlate } from '../src/correlation.ts';
import { makeSignal } from '../src/domain.ts';

test('critical signal opens incident', () => { const now = new Date('2026-01-01T00:00:00Z'); const signal = makeSignal({source:'honeyfile',kind:'canary.touched',title:'Canary',summary:'Touched',severity:'critical',observedAt:now.toISOString()},now); const incidents=correlate([signal],undefined,now); assert.ok(incidents.some(item=>item.ruleId==='critical-single')); assert.ok(incidents.some(item=>item.ruleId==='canary-access')); });
test('separate hosts do not correlate', () => { const now = new Date('2026-01-01T00:00:00Z'); const signals = ['a','b','c'].map((source,index)=>makeSignal({source,kind:'finding',title:'T',summary:'S',severity:'high',host:`h${index}`,observedAt:now.toISOString()},now)); assert.equal(correlate(signals,undefined,now).some(item=>item.ruleId==='multi-source-high'),false); });
