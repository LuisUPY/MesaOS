const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const {legacyFixture}=require('./vendor-fixture.cjs');
const root=path.resolve(__dirname,'..');
async function main(){
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   const file=path.resolve(root,`.${url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)}`);
   if(!file.startsWith(root+path.sep))throw Error();
   res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
   res.end(await fs.readFile(file));
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise((resolve,reject)=>{server.on('error',reject);server.listen(0,'127.0.0.1',resolve);});
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(config=>{
   window.MesaInstallation=config;
   window.printed=[];
   window.print=()=>{const zone=document.getElementById('zona-impresion');window.printed.push({area:zone.firstElementChild.dataset.area,text:zone.innerText});setTimeout(()=>window.dispatchEvent(new Event('afterprint')),0);};
  },legacyFixture);
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('#cash-open-dialog [data-close]').click();
  async function add(id,search){
   await page.locator('#product-search').fill(search);
   await page.locator(`[data-producto="${id}"] .add-button`).click();
   if(await page.locator('#modifier-dialog').isVisible())await page.locator('#modifier-form button[type="submit"]').click();
  }
  async function note(row,text){
   await row.locator('.line-note-button').click();
   await page.locator('#line-note-input').fill(text);
   await page.locator('#line-note-form button[type="submit"]').click();
  }
  await add('hot-cakes-clasicos','hot cakes clasicos');
  await note(page.locator('#order-items .order-item').first(),'Sin miel');
  await add('hot-cakes-clasicos','hot cakes clasicos');
  assert.equal(await page.locator('#order-items .order-item').count(),2);
  assert.equal(await page.locator('#order-items .line-note').count(),1);
  await page.locator('#order-items .order-item').first().locator('.line-note-button').click();
  await page.locator('#line-note-input').fill('No guardar');
  await page.locator('#line-note-dialog [data-close]').click();
  assert.match(await page.locator('#order-items .line-note').innerText(),/Sin miel/);
  await add('cafe-americano','cafe americano');
  await note(page.locator('#order-items .order-item').last(),'Muy caliente');
  await page.locator('#add-extra').click();
  await page.locator('#extra-concept').fill('Extra personalizado');
  await page.locator('#extra-amount').fill('10');
  await page.locator('#extra-form button[type="submit"]').click();
  await note(page.locator('#order-items .order-item').last(),'Servir aparte');
  const total=await page.locator('#order-total').innerText();
  await page.reload();await page.locator('#cash-open-dialog [data-close]').click();
  assert.equal(await page.locator('#order-items .order-item').count(),4);
  assert.deepEqual(await page.locator('#order-items .line-note').allTextContents(),['Nota: Sin miel','Nota: Muy caliente','Nota: Servir aparte']);
  assert.equal(await page.locator('#order-total').innerText(),total);
  await page.locator('#order-items .order-item').last().locator('.line-note-button').click();
  await page.locator('#line-note-remove').click();
  assert.equal(await page.locator('#order-items .line-note').count(),2);
  await note(page.locator('#order-items .order-item').last(),'Servir aparte');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#order-items').evaluate(n=>n.scrollWidth>n.clientWidth),false);
  await page.locator('#order-items .order-item').first().locator('.line-note-button').click();
  assert.equal(await page.locator('#line-note-dialog').evaluate(n=>n.scrollWidth>n.clientWidth),false);
  await fs.mkdir(path.join(root,'test-results/notes'),{recursive:true});
  await page.locator('#line-note-dialog').screenshot({path:path.join(root,'test-results/notes/editor.png')});
  await page.locator('#line-note-dialog [data-close]').click();
  await page.setViewportSize({width:1280,height:900});
  await page.locator('#order-panel').screenshot({path:path.join(root,'test-results/notes/order.png')});
  await page.locator('#review-order').click();
  assert.equal(await page.locator('#review-items .line-note').count(),3);
  await page.locator('#confirm-order').click();
  await page.waitForFunction(()=>window.printed.length===2&&!document.body.classList.contains('imprimiendo-comandas'));
  const printed=await page.evaluate(()=>window.printed);
  const kitchen=printed.find(x=>x.area==='COCINA').text;
  const bar=printed.find(x=>x.area==='BARRA').text;
  assert.match(kitchen,/Hot cakes clásicos.*Nota: Sin miel/s);
  assert.match(kitchen,/Extra personalizado.*Nota: Servir aparte/s);
  assert.doesNotMatch(kitchen,/Muy caliente/);
  assert.match(bar,/Café americano.*Nota: Muy caliente/s);
  assert.doesNotMatch(bar,/Sin miel|Servir aparte/);
  assert.deepEqual(errors,[]);
  console.log('Observaciones: crear, editar, cancelar, quitar, variantes separadas, extras, recarga, móvil y comandas por área: OK.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
