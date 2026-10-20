/* Identidad preparada por el vendedor. No existe un editor de configuración en el POS. */
(() => {
  'use strict';
  const config = globalThis.MesaInstallation;
  if (!config) {
    globalThis.menuDB = {};
    // Un despliegue incompleto tampoco debe consultar las claves de la aplicación antigua.
    globalThis.MesaInstallation = { ready:false, restaurant:{id:'mesaos-invalid-config',currency:'MXN',locale:'es-MX',timezone:'America/Merida'}, menu:{} };
    document.body.inert = true;
    document.getElementById('template-notice').hidden = false;
    document.getElementById('template-notice').textContent = 'La instalación está incompleta. Contacta al proveedor de MesaOS.';
    return;
  }
  const r=config.restaurant;
  const $=id=>document.getElementById(id);
  function contrast(hex){const values=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return .2126*values[0]+.7152*values[1]+.0722*values[2]>.179?'#111111':'#ffffff';}
  const name=r.name||'MesaOS';
  document.title=config.ready?`${name} · MesaOS`:'MesaOS · Plantilla maestra';
  document.documentElement.lang=r.locale;
  document.documentElement.style.setProperty('--forest',config.theme.primary);
  document.documentElement.style.setProperty('--rose',config.theme.accent);
  document.documentElement.style.setProperty('--primary-contrast',contrast(config.theme.primary));
  document.querySelector('meta[name="theme-color"]').content=config.theme.primary;
  document.querySelector('meta[name="description"]').content=config.ready?`${name} · Punto de venta MesaOS`:'Plantilla maestra vacía MesaOS.';
  for(const e of document.querySelectorAll('[data-restaurant-name]'))e.textContent=name;
  $('restaurant-logo').src=r.logo||'assets/platform/mesaos-logo-transparent.png';$('restaurant-logo').alt=name;
  document.querySelector('.brand').setAttribute('aria-label',`${name}, inicio`);
  $('catalog-title').textContent='Menú';
  $('restaurant-tagline').textContent=r.tagline;
  $('currency-note').textContent=`Precios en ${r.currency}`;
  $('restaurant-menu').hidden=!config.ticket.menuPdf;$('restaurant-menu').href=config.ticket.menuPdf||'#';
  document.querySelector('.history-note').textContent=`Ventas por fecha de pago de cada producto, zona ${r.timezone}.`;
  $('template-notice').hidden=config.ready;
  if(!config.ready){
    for(const e of document.querySelectorAll('.header-cash,.order-panel,.app-options,#open-orders-bar'))e.inert=true;
    $('cash-status').textContent='Plantilla sin restaurante asignado';
    $('catalog-empty-title').textContent='Menú sin configurar';
    $('catalog-empty-note').textContent='Esta plantilla se adapta por el proveedor antes de entregarse al restaurante.';
  }
})();
