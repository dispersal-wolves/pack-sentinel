import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src','test','scripts']; const files:string[]=[];
function walk(path:string){for(const name of readdirSync(path)){const full=join(path,name);if(statSync(full).isDirectory())walk(full);else if(/\.(ts|mjs)$/.test(name))files.push(full)}}
for(const root of roots) walk(root);
for(const file of files){const source=readFileSync(file,'utf8');if(source.includes('\r'))throw new Error(`${file}: CRLF is not allowed`);if(/\b(eval|new Function)\s*\(/.test(source))throw new Error(`${file}: dynamic code execution is not allowed`)}
await import('../src/domain.ts'); await import('../src/config.ts'); await import('../src/store.ts'); await import('../src/adapters.ts'); await import('../src/collector.ts'); await import('../src/correlation.ts'); await import('../src/engine.ts'); await import('../src/server.ts');
console.log(`Checked ${files.length} source files.`);
