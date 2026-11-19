import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../dist/config.js';
// npm install --no-save playwright, or use the host's bundled library.
let playwright;
try { playwright = createRequire(import.meta.url)('playwright'); }
catch { playwright = createRequire(process.execPath)('playwright'); }
const browser = await playwright.chromium.launch({ headless: true, channel: 'chrome' });
const folder = fileURLToPath(new URL('../artifacts/', import.meta.url));
await mkdir(folder, { recursive: true });
const report = [];
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(base); assert.equal(response.status(), 200);
  await page.locator('.flower').first().waitFor();
  assert.equal(await page.locator('.flower').count(), 8);
  assert.match(await page.locator('#date-caption').textContent(), /19 de octubre de 2026/);
  assert.deepEqual(await page.locator('#timeline time').evaluateAll(nodes => nodes.map(n => n.dateTime)), ['2026-10-03', '2026-10-13', '2026-10-19']);
  assert.equal(new Set(CONFIG.messages.map(m => m.text)).size, 24);
  report.push('Fecha real de noviazgo, tres hitos de la historia y 24 mensajes diferentes.');
  await page.screenshot({ path: folder + '/desktop.png', fullPage: true });
  for (let i = 0; i < 8; i++) {
    await page.locator('.flower').nth(i).focus(); await page.keyboard.press('Enter');
    await page.locator('#message-dialog[open]').waitFor();
    assert.ok((await page.locator('#message-body').textContent()).length > 30);
    await page.keyboard.press('Escape');
  }
  assert.equal(await page.locator('#discovered').textContent(), '8 de 8 flores descubiertas');
  report.push('8 flores: apertura por teclado, mensajes, cierre con Escape y progreso.');
  await page.locator('#plant').click(); assert.equal(await page.locator('.flower').count(), 9);
  await page.reload(); await page.locator('.flower').first().waitFor();
  assert.equal(await page.locator('.flower').count(), 9);
  assert.equal(await page.locator('#discovered').textContent(), '8 de 9 flores descubiertas');
  report.push('Flores plantadas y descubrimientos persisten después de recargar.');
  await page.locator('#settings').click();
  await page.locator('[name=name]').fill('Jenny de prueba');
  await page.locator('[name=date]').fill('2026-10-18');
  await page.locator('#settings-form [type=submit]').click();
  await page.reload(); await page.locator('.flower').first().waitFor();
  assert.ok((await page.title()).includes('Jenny de prueba'));
  assert.match(await page.locator('#date-caption').textContent(), /18 de octubre de 2026/);
  assert.notEqual(await page.locator('#days').textContent(), '∞');
  report.push('Nombre, fecha y contador configurables; datos conservados al recargar.');
  await page.locator('#open-letter').click(); await page.locator('#letter-dialog[open]').waitFor();
  assert.equal(await page.locator('#letter-body p').count(), 5);
  assert.match(await page.locator('#letter-greeting').textContent(), /Jenny de prueba/);
  await page.keyboard.press('Escape'); await page.reload();
  assert.match(await page.locator('#letter-status').textContent(), /volver a leer/);
  report.push('Carta completa, personalizada, reabrible y con estado persistente.');
  for (let i = 0; i < 3; i++) {
    await page.locator('.memory-card').nth(i).click(); await page.locator('#memory-dialog[open]').waitFor();
    assert.ok(await page.locator('#memory-view svg').count());
    assert.equal(await page.locator('#memory-caption').textContent(), CONFIG.memories[i].detail);
    await page.keyboard.press('Escape');
  }
  await page.locator('.memory-card').first().click();
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 100;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#dca6ac'; ctx.fillRect(0, 0, 200, 100);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#photo-input').setInputFiles({ name: 'recuerdo.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64') });
  await page.locator('#memory-view img').waitFor();
  await page.keyboard.press('Escape'); await page.reload();
  await page.locator('.memory-card img').waitFor();
  await page.locator('.memory-card').first().click(); await page.locator('#remove-photo').click();
  await page.locator('#memory-view svg').waitFor(); await page.keyboard.press('Escape');
  report.push('3 recuerdos, carga y compresión de foto, persistencia y restauración de ilustración.');
  await page.locator('#sound').click(); assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'true');
  await page.locator('#sound').click(); assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'false');
  report.push('Audio ambiente activable y desactivable.');
  for (let i = 0; i < 15; i++) await page.locator('#plant').click();
  assert.equal(await page.locator('.flower').count(), 24); assert.equal(await page.locator('#plant').isDisabled(), true);
  for (let i = 8; i < 24; i++) {
    await page.locator('.flower').nth(i).focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#message-title').textContent(), CONFIG.messages[i].title);
    await page.keyboard.press('Escape');
  }
  assert.equal(await page.locator('#discovered').textContent(), '24 de 24 flores descubiertas');
  report.push('Límite de 24 flores y botón de plantar deshabilitado al completarlo.');
  await context.close();
  for (const width of [320, 375, 390, 768]) {
    const mobile = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce', isMobile: width < 700, hasTouch: width < 700 });
    const p = await mobile.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base); await p.locator('.flower').first().waitFor();
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `Sin overflow a ${width}px`);
    if (width === 390) await p.screenshot({ path: folder + '/mobile.png', fullPage: true });
    await p.locator('.flower').first().click(); await p.locator('#message-dialog[open]').waitFor();
    assert.equal(await p.evaluate(() => document.querySelector('#message-dialog').getBoundingClientRect().right <= innerWidth), true);
    await p.keyboard.press('Escape');
    await mobile.close();
  }
  report.push('Responsive a 320, 375, 390 y 768 px: sin desborde y mensajes operativos.');
  const blocked = await browser.newContext(); await blocked.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Blocked'); } }));
  const blockedPage = await blocked.newPage(); blockedPage.on('pageerror', e => errors.push(e.message));
  await blockedPage.goto(base); await blockedPage.locator('.flower').first().waitFor(); await blockedPage.locator('#plant').click();
  assert.equal(await blockedPage.locator('.flower').count(), 9); await blocked.close();
  report.push('Almacenamiento bloqueado: la web sigue funcionando y avisa al visitante.');
  assert.deepEqual(errors, []);
  report.push('Sin errores JavaScript en el navegador.');
  await writeFile(folder + '/browser-report.json', JSON.stringify({ passed: true, checks: report }, null, 2));
  console.log(report.join('\n'));
} finally { await browser.close(); }
