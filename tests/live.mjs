import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
process.env.TEST_URL = 'https://salvatury.github.io/el-jardin-de-jenny/';
await import('./browser.mjs');
const files = ['index.html', 'styles.css', 'config.js', 'app.js', 'core.js', 'art.js', 'assets/favicon.svg'];
const verified = [];
for (const file of files) {
  const response = await fetch(new URL(file, process.env.TEST_URL));
  assert.equal(response.status, 200);
  const live = Buffer.from(await response.arrayBuffer());
  const local = await readFile(new URL('../dist/' + file, import.meta.url));
  const hash = value => createHash('sha256').update(value).digest('hex');
  assert.equal(hash(live), hash(local), `El archivo publicado coincide: ${file}`);
  verified.push({ file, sha256: hash(live) });
}
await writeFile(new URL('../artifacts/live-report.json', import.meta.url), JSON.stringify({ url: process.env.TEST_URL, verified, passed: true }, null, 2));
console.log('Los 7 archivos públicos coinciden con la versión local probada.');
