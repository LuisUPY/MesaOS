/* Configuración del vendedor, validada antes de generar una instalación. */
const fs=require('node:fs');
const MAX_BYTES=4*1024*1024;
function requireValue(ok,message){if(!ok)throw Error(message);}
function inspect(x,depth=0,budget={nodes:0}){requireValue(depth<=32&&++budget.nodes<=200000,'Configuración demasiado compleja.');if(x&&typeof x==='object')for(const k of Object.keys(x)){requireValue(!['__proto__','prototype','constructor'].includes(k),'Clave JSON insegura.');inspect(x[k],depth+1,budget);}}
function parse(text){requireValue(Buffer.byteLength(text)<=MAX_BYTES,'El archivo supera 4 MiB.');const x=JSON.parse(text);inspect(x);return x;}
function text(x,label,max=200,empty=false){requireValue(typeof x==='string'&&x.length<=max&&(empty||x.trim()),`${label}: texto inválido.`);return x.trim();}
function price(x){requireValue(Number.isFinite(x)&&x>=0&&x<=999999.99&&Math.round(x*100)/100===x,'Precio inválido: usa hasta dos decimales.');return x;}
function asset(x,label){x=text(x||'',label,250,true);requireValue(!x||!x.startsWith('/')&&!x.includes('..')&&!/[\\\s<>"':?#]/.test(x),`${label}: usa una ruta relativa segura sin espacios.`);return x;}
function validate(raw,{allowEmpty=false}={}){
  inspect(raw);requireValue(raw&&raw.schemaVersion===1,'Versión de configuración incompatible.');
  const r=raw.restaurant,t=raw.theme,ticket={header:'',footer:'Gracias por tu visita.',menuPdf:'',...raw.ticket};
  requireValue(r&&t&&raw.menu&&typeof raw.menu==='object'&&!Array.isArray(raw.menu),'Faltan restaurante, tema o menú.');
  requireValue(typeof r.id==='string'&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(r.id),'Identificador de restaurante inválido.');
  const name=text(r.name,'Nombre',100,allowEmpty);
  const currency=r.currency||'MXN',locale=r.locale||'es-MX',timezone=r.timezone||'America/Merida';
  requireValue(['MXN','USD','EUR'].includes(currency),'Moneda compatible: MXN, USD o EUR.');
  requireValue(Intl.NumberFormat.supportedLocalesOf([locale]).length>0,'Idioma regional no compatible.');new Intl.DateTimeFormat(locale,{timeZone:timezone});
  requireValue(/^#[0-9a-f]{6}$/i.test(t.primary)&&/^#[0-9a-f]{6}$/i.test(t.accent),'Paleta: colores #RRGGBB.');
  const logo=asset(r.logo,'Logo');requireValue(!logo||/\.(png|jpe?g|webp|svg)$/i.test(logo),'Logo: PNG, JPEG, WebP o SVG local.');requireValue(allowEmpty||logo,'Cada entrega requiere el logo del restaurante.');
  const menuPdf=asset(ticket.menuPdf,'Menú PDF');requireValue(!menuPdf||/\.pdf$/i.test(menuPdf),'El menú adjunto debe ser PDF.');
  const ids=new Set(),menu=Object.create(null);let count=0,placeholderCount=0;
  requireValue(Object.keys(raw.menu).length<=50,'Máximo 50 categorías.');
  for(const [macro,subs]of Object.entries(raw.menu)){
    text(macro,'Categoría',80);requireValue(subs&&typeof subs==='object'&&!Array.isArray(subs),'Subcategorías inválidas.');menu[macro]=Object.create(null);
    for(const [sub,ps]of Object.entries(subs)){
      text(sub,'Subcategoría',80);requireValue(Array.isArray(ps),'Lista de productos inválida.');
      menu[macro][sub]=ps.map(p=>{
        requireValue(p&&/^[a-z0-9][a-z0-9-]{0,99}$/.test(p.id)&&!ids.has(p.id),'Producto con id inválido o repetido.');ids.add(p.id);count++;
        const placeholder=p.placeholder===true;
        requireValue(!placeholder||allowEmpty,'Sustituye los productos de ejemplo antes de generar una entrega.');
        if(placeholder){requireValue(p.precio===null&&/^Producto [1-9]\d*$/.test(p.nombre)&&!p.descripcion&&Array.isArray(p.opciones)&&p.opciones.length===0,'Una ficha de plantilla debe estar vacía y sin precio.');placeholderCount++;}
        const options=p.opciones||[];requireValue(Array.isArray(options)&&options.length<=20,'Máximo 20 grupos de opciones.');const groupIds=new Set();
        const grupos=options.map(g=>{requireValue(g&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(g.id)&&!groupIds.has(g.id)&&!['constructor','prototype'].includes(g.id),'Grupo inválido o repetido.');groupIds.add(g.id);requireValue(['unica','multiple','texto'].includes(g.tipo)&&typeof g.requerido==='boolean','Tipo de opción inválido.');const out={id:g.id,nombre:text(g.nombre,'Opción',100),tipo:g.tipo,requerido:g.requerido};if(g.ayuda)out.ayuda=text(g.ayuda,'Ayuda',200);if(g.tipo==='texto'){requireValue(g.longitudMaxima==null||Number.isInteger(g.longitudMaxima)&&g.longitudMaxima>0&&g.longitudMaxima<=200,'Longitud de opción inválida.');out.longitudMaxima=g.longitudMaxima||100;}else{requireValue(Array.isArray(g.valores)&&g.valores.length>0&&g.valores.length<=50,'Valores de opción inválidos.');const keys=new Set();out.valores=g.valores.map(v=>{requireValue(v&&typeof v.id==='string'&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(v.id)&&!keys.has(v.id),'Valor duplicado o inválido.');keys.add(v.id);return{id:v.id,nombre:text(v.nombre,'Valor',100),precioExtra:price(v.precioExtra)};});}return out;});
        return{id:p.id,nombre:text(p.nombre,'Producto',200),precio:placeholder?null:price(p.precio),...(placeholder?{placeholder:true}:{}),descripcion:text(p.descripcion||'','Descripción',500,true),opciones:grupos};
      });
    }
  }
  const preparationAreas=Object.create(null);
  for(const category of Object.keys(menu)){const area=raw.preparationAreas?.[category];requireValue(['cocina','barra','coordinacion'].includes(area),`Asigna el área de preparación de ${category}.`);preparationAreas[category]=area;}
  requireValue(count<=2000,'Máximo 2000 productos.');requireValue(allowEmpty||count>0,'La entrega debe incluir productos. La plantilla maestra permanece vacía.');
  return{schemaVersion:1,ready:!!name&&count>0&&placeholderCount===0,restaurant:{id:r.id,name,logo,currency,locale,timezone,address:text(r.address||'','Dirección',250,true),phone:text(r.phone||'','Teléfono',60,true),welcome:text(r.welcome||'','Bienvenida',100,true),tagline:text(r.tagline||'','Lema',150,true)},theme:{primary:t.primary,accent:t.accent},ticket:{header:text(ticket.header,'Cabecera',300,true),footer:text(ticket.footer,'Pie',300,true),menuPdf},preparationAreas,menu};
}
function script(config){const value=JSON.stringify(config).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');return `/* Generado por scripts/build.cjs; la configuración pertenece al vendedor. */\nglobalThis.MesaInstallation = globalThis.MesaInstallation || ${value};\nglobalThis.menuDB = MesaInstallation.menu;\n`;}
module.exports={parse,validate,script,requireValue};
