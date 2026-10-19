const fs=require('node:fs'),path=require('node:path');const {parse,validate,script,requireValue}=require('./config.cjs');
const root=path.resolve(__dirname,'..');const args=process.argv.slice(2);function arg(name){const n=args.indexOf(name);return n<0?null:args[n+1];}
try{
  if(args.includes('--sync-template')){const c=validate(parse(fs.readFileSync(path.join(root,'config/restaurant.json'),'utf8')),{allowEmpty:true});requireValue(!c.ready&&!c.restaurant.name&&Object.values(c.menu).flatMap(subs=>Object.values(subs).flat()).every(p=>p.placeholder===true),'La plantilla maestra debe permanecer vacía.');fs.writeFileSync(path.join(root,'config/installation.js'),script(c));console.log('Plantilla maestra actualizada.');process.exit(0);}
  requireValue(arg('--config'),'Uso: npm run build -- --config clientes/restaurante/restaurant.json');
  const source=path.resolve(arg('--config'));const config=validate(parse(fs.readFileSync(source,'utf8')));
  const out=path.resolve(arg('--out')||path.join(root,'dist',`${config.restaurant.id}-${Date.now()}`));
  requireValue(!fs.existsSync(out),'El destino ya existe. Usa una carpeta nueva para evitar sobrescribir una entrega.');
  requireValue(out!==root&&!root.startsWith(out+path.sep),'No se puede usar el código fuente como destino.');
  const assetRoot=fs.realpathSync(path.dirname(source));
  function resolveAsset(relative){const candidate=fs.realpathSync(path.resolve(assetRoot,relative));requireValue(candidate.startsWith(assetRoot+path.sep)&&fs.statSync(candidate).isFile(),'El recurso debe estar dentro de la carpeta del restaurante.');return candidate;}
  // Verificar todo antes de empezar a escribir la entrega.
  const resources=[['logo',config.restaurant.logo],['menuPdf',config.ticket.menuPdf]].filter(([,file])=>file).map(([field,file])=>({field,source:resolveAsset(file),target:`assets/restaurant/${field}${path.extname(file).toLowerCase()}`}));
  fs.mkdirSync(out,{recursive:true});for(const name of ['index.html','css','manifest.json'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
  fs.mkdirSync(path.join(out,'js'));for(const name of fs.readdirSync(path.join(root,'js')))if(name.endsWith('.js')&&name!=='menuData.js')fs.copyFileSync(path.join(root,'js',name),path.join(out,'js',name));
  fs.mkdirSync(path.join(out,'assets/img'),{recursive:true});fs.cpSync(path.join(root,'assets/img/categorias'),path.join(out,'assets/img/categorias'),{recursive:true});fs.cpSync(path.join(root,'assets/platform'),path.join(out,'assets/platform'),{recursive:true});
  fs.mkdirSync(path.join(out,'assets/restaurant'));for(const res of resources){fs.copyFileSync(res.source,path.join(out,res.target));if(res.field==='logo')config.restaurant.logo=res.target;else config.ticket.menuPdf=res.target;}
  fs.mkdirSync(path.join(out,'config'));fs.writeFileSync(path.join(out,'config/installation.js'),script(config));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.lang=config.restaurant.locale;manifest.name=config.restaurant.name;manifest.short_name=config.restaurant.name.slice(0,30);manifest.description=`${config.restaurant.name} · Punto de venta MesaOS`;manifest.theme_color=config.theme.primary;manifest.icons=[{src:config.restaurant.logo,...(path.extname(config.restaurant.logo)==='.svg'?{sizes:'any'}:{}),type:({'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'})[path.extname(config.restaurant.logo)],purpose:'any'}];fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  let html=fs.readFileSync(path.join(out,'index.html'),'utf8');const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));html=html.replace('<title>MesaOS · Plantilla maestra</title>',`<title>${escape(config.restaurant.name)} · MesaOS</title>`);fs.writeFileSync(path.join(out,'index.html'),html);
  fs.writeFileSync(path.join(out,'.nojekyll'),'');fs.writeFileSync(path.join(out,'DELIVERY.md'),`# ${config.restaurant.name}\n\nEntrega generada por MesaOS. Publica el contenido de esta carpeta en la raíz del repositorio de GitHub Pages. El cliente usa la aplicación terminada; la identidad y el menú se actualizan a través del vendedor.\n\nLos datos se guardan sólo en este navegador y origen; no hay sincronización ni autenticación. No cambies el identificador ${config.restaurant.id} de una instalación que ya tenga ventas.\n`);
  console.log(out);
}catch(e){console.error(`No se generó la instalación: ${e.message}`);process.exitCode=1;}
