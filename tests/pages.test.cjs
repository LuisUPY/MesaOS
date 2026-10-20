/* Prueba el paquete publicado, sin inyectar configuración en el navegador. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { finalizeSite } = require('../scripts/site.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results/pages');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mesaos-pages-'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf' };
const build = args => execFileSync(process.execPath, ['scripts/build.cjs', ...args], { cwd: root, encoding: 'utf8', stdio: 'pipe' });

async function main() {
  build([]);
  // Repetir el build no acumula archivos y no toca el código fuente.
  const html = fs.readFileSync(path.join(root, 'dist/pages/index.html'), 'utf8');
  build([]);
  assert.equal(fs.readFileSync(path.join(root, 'dist/pages/index.html'), 'utf8'), html);
  for (const excluded of ['node_modules', 'tests', 'backups', 'docs', 'assets/menu.json', 'assets/img/logo.png', 'js/menuData.js', 'assets/platform/.DS_Store']) {
    assert.equal(fs.existsSync(path.join(root, 'dist/pages', excluded)), false, excluded);
  }
  // Entrega configurada real con logo/PDF, categorías vacías y opciones.
  const config = JSON.parse(fs.readFileSync(path.join(root, 'config/restaurant.json'), 'utf8'));
  Object.assign(config.restaurant, { id: 'pages-test', name: 'Restaurante Pages', logo: 'logo.png' });
  config.ticket.menuPdf = 'menu.pdf';
  config.menu = {
    Alimentos: { Especiales: [{ id: 'plato', nombre: 'Plato del día', precio: 95, descripcion: 'Con opciones', opciones: [{ id: 'salsa', nombre: 'Salsa', tipo: 'unica', requerido: true, valores: [{ id: 'verde', nombre: 'Verde', precioExtra: 10 }] }] }] },
    Bebidas: { Frías: [{ id: 'agua', nombre: 'Agua fría', precio: 25, opciones: [] }] },
    Postres: {}
  };
  config.preparationAreas = { Alimentos: 'cocina', Bebidas: 'barra', Postres: 'cocina' };
  const source = path.join(temporary, 'restaurant.json');
  fs.copyFileSync(path.join(root, 'assets/platform/mesaos-logo-mini.png'), path.join(temporary, 'logo.png'));
  fs.writeFileSync(path.join(temporary, 'menu.pdf'), '%PDF-1.4\n%%EOF\n');
  fs.writeFileSync(source, JSON.stringify(config));
  const configured = path.join(temporary, 'site');
  build(['--config', source, '--out', configured]);
  assert.throws(() => build(['--config', source, '--out', configured]), /Command failed/);
  // El validador detecta diferencias de mayúsculas incluso en macOS.
  const css = path.join(configured, 'css/installation.css');
  const originalCSS = fs.readFileSync(css, 'utf8');
  fs.writeFileSync(css, originalCSS + '\na{background:url(../assets/platform/AMBIENT-waves.svg)}');
  assert.throws(() => finalizeSite(configured), /mayúsculas/);
  fs.writeFileSync(css, originalCSS);

  const mounts = [['/mesaOS/', path.join(root, 'dist/pages')], ['/cliente/', configured], ['/', path.join(root, 'dist/pages')]];
  const server = http.createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname === '/mesaOS' || pathname === '/cliente') {
        response.writeHead(301, { Location: pathname + '/' }); response.end(); return;
      }
      const [prefix, directory] = mounts.find(([prefix]) => pathname.startsWith(prefix));
      const relative = pathname.slice(prefix.length) || 'index.html';
      const file = path.resolve(directory, relative);
      if (!file.startsWith(directory + path.sep)) throw Error('Ruta inválida');
      response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      response.end(fs.readFileSync(file));
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.on('error', reject); server.listen(0, '127.0.0.1', resolve); });
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL === 'chromium' ? undefined : 'chrome' });
    fs.mkdirSync(output, { recursive: true });
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const prefix of ['/', '/mesaOS/', '/cliente/']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      await context.addInitScript(() => { window.print = () => setTimeout(() => window.dispatchEvent(new Event('afterprint')), 0); });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('requestfailed', request => errors.push(request.url()));
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(origin + prefix, { waitUntil: 'networkidle' });
      await page.waitForSelector('.product-card');
      if (prefix === '/cliente/') {
        assert.equal(await page.title(), 'Restaurante Pages · MesaOS');
        assert.equal(await page.evaluate(() => !!MesaInstallation.demo), false);
        await page.locator('#cash-open-dialog [data-close]').click();
        const pdf = await page.locator('#restaurant-menu').getAttribute('href');
        assert.equal((await context.request.get(origin + prefix + pdf)).status(), 200);
      } else {
        assert.equal(await page.evaluate(() => MesaInstallation.demo), true);
        assert.equal(await page.evaluate(() => AmorPOS.catalogo.length), 46);
      }
      const menu = await page.evaluate(() => Object.entries(menuDB).map(([name, subs]) => ({ name, subs: Object.entries(subs).map(([name, products]) => ({ name, ids: products.map(p => p.id) })) })));
      for (const width of [1440, 820, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const macro of menu) {
          await page.getByRole('tab', { name: macro.name, exact: true }).click();
          assert.equal(await page.locator('.product-card').count(), macro.subs.flatMap(s => s.ids).length);
          for (const sub of macro.subs) {
            await page.locator('#subcategory-chips').getByRole('button', { name: sub.name, exact: true }).click();
            assert.deepEqual(await page.locator('.product-card').evaluateAll(cards => cards.map(c => c.dataset.producto)), sub.ids);
            assert.equal(await page.locator('.product-card .add-button:disabled').count(), 0);
          }
        }
        await page.getByRole('tab', { name: 'Alimentos', exact: true }).click();
        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          brokenImages: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src),
          grid: getComputedStyle(document.getElementById('product-grid')).display,
          cardsClipped: [...document.querySelectorAll('.product-card')].some(c => c.scrollWidth > c.clientWidth + 1)
        }));
        assert.deepEqual(layout, { overflow: false, brokenImages: [], grid: 'grid', cardsClipped: false }, `${prefix} a ${width}px`);
        await page.screenshot({ path: path.join(output, `${prefix === '/' ? 'root' : prefix.slice(1, -1)}-${width}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      const query = prefix === '/cliente/' ? 'plato del dia' : 'chilaquiles';
      await page.locator('#product-search').fill(query);
      assert.ok(await page.locator('.product-card').count() > 0);
      await page.locator('.product-card .add-button').first().click();
      await page.locator('#modifier-form button[type=submit]').click();
      assert.equal(await page.locator('#modifier-error').isVisible(), true);
      await page.locator('input[name=salsa][value=verde]').check();
      await page.locator('#modifier-form button[type=submit]').click();
      const total = await page.locator('#order-total').textContent();
      assert.notEqual(total, '$0.00');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('#order-total').textContent(), total);
      if (prefix === '/cliente/') await page.locator('#cash-open-dialog [data-close]').click();
      const before = await page.evaluate(() => AmorStorage.cargarExpediente().pedidos.length);
      await page.locator('#review-order').click();
      await page.locator('#confirm-order').click();
      await page.waitForFunction(n => AmorStorage.cargarExpediente().pedidos.length === n + 1, before);
      await page.waitForFunction(() => !document.querySelector('#zona-impresion').children.length);
      const key = await page.evaluate(() => AmorStorage.KEY);
      assert.ok(key.includes(encodeURIComponent(prefix)), key);
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => AmorStorage.cargarExpediente().pedidos.length), before + 1);
      assert.deepEqual(errors, [], prefix);
      // Todas las solicitudes de recursos permanecen dentro de la subruta publicada.
      const urls = await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name));
      assert.ok(urls.every(url => url.startsWith(origin + prefix)), urls.join('\n'));
      await context.close();
      console.log(`✓ ${prefix}: catálogo completo, búsqueda, opciones, pedido, persistencia y renderizado a 1440/820/390/320 px.`);
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => fs.rmSync(temporary, { recursive: true, force: true }));
