// Runs every suite in order and reports. Usage: npm test  (or: node tests/run.mjs sync screens)
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ALL = ['smoke', 'sync', 'presenter', 'phone'];
const pick = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const results = [];
for (const s of pick) {
  console.log(`\n━━ ${s} ━━`);
  const r = spawnSync(process.execPath, [path.join(HERE, s + '.mjs')], { stdio: 'inherit', timeout: 15 * 60 * 1000 });
  results.push([s, r.status === 0]);
}
console.log('\n' + results.map(([s, ok]) => `${ok ? 'PASS' : 'FAIL'}  ${s}`).join('\n'));
console.log('Screenshots: tests/out/');
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
