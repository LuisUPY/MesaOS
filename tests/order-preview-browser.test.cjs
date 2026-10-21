/* Regresión del panel de borrador sobre el paquete real de GitHub Pages. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium, webkit } = require('playwright');
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'dist/pages');
const output = path.join(root, 'test-results/order-preview');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
async function main() {
 execFileSync(process.execPath, ['scripts/build.cjs'], {cwd:root,stdio:'pipe'});
 const server = http.createServer((req,res) => {
  try {
   const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const relative = pathname.replace(/^\/mesaOS\//,'') || 'index.html';
   const file = path.resolve(site, relative);
   if (!file.startsWith(site+path.sep)) throw Error();
   res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
   res.end(fs.readFileSync(file));
  } catch {res.writeHead(404);res.end();}
 });
 await new Promise((resolve,reject)=>{server.on('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const engines = process.env.MESAOS_PREVIEW_ENGINE === 'webkit' ? [['webkit',webkit]] : [['chromium',chromium]];
 try {
  fs.mkdirSync(output,{recursive:true});
  for (const [name,engine] of engines) {
   const browser = await engine.launch({headless:true,...(name==='chromium'?{channel:'chrome'}:process.env.MESAOS_WEBKIT_EXECUTABLE?{executablePath:process.env.MESAOS_WEBKIT_EXECUTABLE}:{})});
   try {
    const context = await browser.newContext({viewport:{width:1440,height:800}});
    const page = await context.newPage(); const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/mesaOS/`);
    await page.locator('.product-card').first().waitFor();
    // Operaciones reales: dos conceptos para reproducir contador y total con lista vacía.
    for (const [concept,amount] of [['Vista previa A','100'],['Vista previa B','110']]) {
     await page.locator('#add-extra').click();
     await page.locator('#extra-concept').fill(concept);
     await page.locator('#extra-amount').fill(amount);
     await page.locator('#extra-form button[type="submit"]').click();
    }
    assert.equal(await page.locator('#order-count').innerText(),'2');
    for (const [width,height] of [[1440,800],[1280,761],[1024,820],[820,800],[1440,1000],[1440,1100],[1440,1400],[1280,720],[390,844]]) {
     await page.setViewportSize({width,height});
     for (const collapsed of [false,true]) {
      if (await page.evaluate(()=>document.body.dataset.queueCollapsed==='true') !== collapsed) await page.locator('#toggle-queue').click();
      const layout = await page.locator('#order-items').evaluate(list => {
       const box=list.getBoundingClientRect(), panel=list.closest('.order-panel').getBoundingClientRect();
       const first=list.firstElementChild.getBoundingClientRect();
       return {height:box.height,contents:list.children.length,scrollHeight:list.scrollHeight,panelHeight:panel.height,firstHeight:first.height,
        bottomInsidePanel:document.querySelector('.order-bottom').getBoundingClientRect().bottom <= panel.bottom+1};
      });
      assert.equal(layout.contents,2);
      assert.ok(layout.height >= 140, `${name} ${width}x${height}, cola ${collapsed?'oculta':'visible'}: ${JSON.stringify(layout)}`);
      assert.equal(layout.bottomInsidePanel,true,`${name}: acciones fuera del panel`);
     }
    }
    await page.setViewportSize({width:1440,height:800});
    await page.reload();
    assert.equal(await page.locator('#order-items .order-item').count(),2);
    assert.ok(await page.locator('#order-items').evaluate(n=>n.clientHeight)>=140);
    await page.locator('#order-panel').screenshot({path:path.join(output,`${name}-panel.png`)});
    // Una cuenta larga conserva su propio desplazamiento y permite quitar productos.
    for (let i=3;i<=8;i++) {
     await page.locator('#add-extra').click();
     await page.locator('#extra-concept').fill(`Vista previa ${i}`);
     await page.locator('#extra-amount').fill('10');
     await page.locator('#extra-form button[type="submit"]').click();
    }
    assert.equal(await page.locator('#order-items .order-item').count(),8);
    assert.equal(await page.locator('#order-items').evaluate(n=>n.scrollHeight>n.clientHeight),true);
    await page.locator('#order-items .remove-line').last().click();
    assert.equal(await page.locator('#order-items .order-item').count(),7);
    await page.locator('#review-order').click();
    assert.equal(await page.locator('#review-dialog').isVisible(),true);
    assert.equal(await page.locator('#review-items .order-item').count(),7);
    assert.deepEqual(errors,[]);
    console.log(`${name}: vista previa visible, cola abierta/cerrada, recarga, lista larga y revisión del pedido en distintas alturas: OK.`);
   } finally {await browser.close();}
  }
 } finally {await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
