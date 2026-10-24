const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:340,height:1200}});
  const css=fs.readFileSync(path.join(root,'css/cash-print.css'),'utf8');
  await page.setContent(`<html lang="es-MX"><head><meta charset="utf-8"><title>mesaOS - Ticket de prueba</title><style>${css}</style></head><body><div id="zona-impresion"></div></body></html>`);
  await page.evaluate(()=>{
   window.MesaInstallation={restaurant:{name:'AMOR & AMOR',currency:'MXN',locale:'es-MX',timezone:'America/Merida'},ticket:{header:'TICKET DE PRUEBA - SIN VALOR FISCAL',footer:'Gracias por compartir tu día con nosotros.'},menu:{}};
   window.menuDB={};
   window.print=()=>{window.printReady=true;};
  });
  for(const file of ['orderCore','orders','cash','printing'])await page.addScriptTag({content:fs.readFileSync(path.join(root,`js/${file}.js`),'utf8')});
  await page.evaluate(()=>{
   const sample=(nombre,monto,nota,macroCategoria,area)=>({...AmorPOS.crearExtra(nombre,monto,nota),tipo:'producto',macroCategoria,area});
   let order=AmorOrders.nuevoPedido([
    sample('Hot cakes clásicos','95','Sin miel. Servir mantequilla aparte.','Alimentos','cocina'),
    sample('Pasta al pesto','115','Sin queso.','Alimentos','cocina'),
    sample('Café americano','65','Muy caliente, sin azúcar.','Bebidas','barra')
   ],'Mesa 6',1001,'2026-10-21T16:30:00Z');
   order=AmorOrders.aplicarDescuento(order,'porcentaje','10');
   const cash=AmorCash.abrirCaja(AmorCash.cajaVacia(),'0','2026-10-21T16:00:00Z');
   const paid=AmorCash.cobrarPartidas(order,'todos',cash,{efectivoRecibido:'247.50',montoTarjeta:'0'},'2026-10-21T16:35:00Z');
   window.job=AmorPrinting.imprimirCuenta(paid.pedido);
  });
  await page.waitForFunction(()=>window.printReady);
  await page.emulateMedia({media:'print'});
  const height=await page.locator('#zona-impresion').evaluate(n=>Math.ceil(n.getBoundingClientRect().height)+4);
  await page.pdf({path:path.join(root,'output/pdf/ticket-prueba-mesaOS.pdf'),width:'80mm',height:`${height}px`,printBackground:true,displayHeaderFooter:false,margin:{top:0,bottom:0,left:0,right:0}});
  console.log(JSON.stringify({height,pdf:'output/pdf/ticket-prueba-mesaOS.pdf'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
