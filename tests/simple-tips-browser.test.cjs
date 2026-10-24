const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { legacyFixture } = require('./vendor-fixture.cjs');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/config/installation.js') {
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(`globalThis.MesaInstallation=${JSON.stringify(legacyFixture)};globalThis.menuDB=MesaInstallation.menu;`);
    }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) throw Error('Path');
    const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});
async function main() {
  await new Promise((resolve, reject) => { server.on('error', reject); server.listen(0, '127.0.0.1', resolve); });
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1005, height: 840 } });
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { window.print = () => setTimeout(() => window.dispatchEvent(new Event('afterprint')), 0); });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    assert.deepEqual(errors, []);
    await page.locator('#cash-opening-fund').fill('100');
    await page.locator('#cash-open-form button[type="submit"]').click();
    const openTips = async () => {
      if (await page.locator('#header-menu-toggle').isVisible()) await page.locator('#header-menu-toggle').click();
      await page.locator('#cash-options > summary').click();
      if (!await page.locator('#cash-tips').evaluate(e => e.open)) await page.locator('#cash-tips > summary').click();
    };
    await openTips();
    assert.equal(await page.locator('#tips-total').innerText(), '$0.00');
    for (const amount of ['12.30', '0.07']) {
      await page.locator('#cash-tip-amount').fill(amount);
      await page.locator('#cash-tip-add').click();
    }
    assert.equal(await page.locator('#tips-total').innerText(), '$12.37');
    assert.equal(await page.locator('#cash-expected').innerText(), 'Efectivo esperado: $100.00');
    await page.locator('#cash-tip-amount').fill('-1');
    await page.locator('#cash-tip-add').click();
    assert.equal(await page.locator('#cash-tip-error').isVisible(), true);
    assert.equal(await page.locator('#tips-total').innerText(), '$12.37');
    await page.reload();
    await page.setViewportSize({ width: 471, height: 840 });
    await openTips();
    assert.equal(await page.locator('#tips-total').innerText(), '$12.37');
    assert.ok(await page.locator('#cash-tips').evaluate(e => e.getBoundingClientRect().right <= innerWidth));
    assert.equal(await page.locator('#tips-split-form,#cash-daily-tip,#cash-tips-dialog').count(), 0);
    fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'test-results/simple-tips-mobile.png') });
    await page.locator('#cash-close-button').click();
    const summary = await page.locator('#cash-summary').innerText();
    assert.match(summary, /Total de Propinas\s*\$12\.37/);
    assert.doesNotMatch(summary, /Propinas en Efectivo|Propinas en Tarjeta|Reparto/);
    await page.locator('#close-shift').click();
    await page.waitForFunction(() => !document.querySelector('#cash-close-dialog').open);
    await page.locator('#header-menu-toggle').click();
    await page.locator('#cash-options > summary').click();
    await page.locator('#cash-history-button').click();
    await page.locator('.cash-saved-cut > details > summary').click();
    const saved = await page.locator('#cash-history-list').innerText();
    assert.match(saved, /Total de Propinas\s*\$12\.37/);
    assert.doesNotMatch(saved, /Reparto|Propinas en Efectivo|Propinas en Tarjeta/);
    await page.locator('#cash-history-dialog [data-close]').click();
    await openTips();
    assert.equal(await page.locator('#tips-total').innerText(), '$0.00');
    assert.equal(await page.locator('#cash-tip-add').isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log('Propinas: acumulación, persistencia, validación, móvil, corte, historial y reinicio por turno: OK.');
  } finally { if (browser) await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
