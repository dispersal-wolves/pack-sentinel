import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adapt } from '../src/adapters.ts';

for (const [file,adapter] of [['open-ports','open-ports'],['file-watch','file-watch'],['host-check','host-check'],['secret-sweep','secret-sweep'],['honeyfile','honeyfile'],['container-check','container-check'],['log-howl','log-howl'],['ssh-guard','ssh-guard'],['firewall-kit','firewall-kit']] as const) {
  test(`${file} fixture remains compatible`, () => { const value=JSON.parse(readFileSync(`fixtures/${file}.json`,'utf8')); assert.ok(adapt(adapter,value,{collector:file,host:'fixture'}).length>0); });
}
