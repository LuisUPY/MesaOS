const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');const{parse,validate,script}=require('./config.cjs');
const config=validate(parse(fs.readFileSync('config/restaurant.json','utf8')),{allowEmpty:true});
if(config.ready||config.restaurant.name||Object.values(config.menu).flatMap(subs=>Object.values(subs).flat()).some(p=>!p.placeholder||p.precio!==null))throw Error('La maestra sólo admite fichas de ejemplo sin precios.');
if(fs.readFileSync('config/installation.js','utf8')!==script(config))throw Error('Regenera config/installation.js: node scripts/build.cjs --sync-template');
for(const dir of ['js','scripts'])for(const f of fs.readdirSync(dir))if(/\.(js|cjs)$/.test(f))cp.execFileSync(process.execPath,['--check',path.join(dir,f)]);
const html=fs.readFileSync('index.html','utf8');for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!fs.existsSync(m[1]))throw Error('Falta recurso: '+m[1]);
if(html.includes('js/menuData.js')||/admin-|import-config|input type="file"/.test(html))throw Error('La entrega no debe cargar el menú original ni un editor para el cliente.');
for(const entry of JSON.parse(fs.readFileSync('tests/original-provenance.json'))){const sum=crypto.createHash('sha256').update(fs.readFileSync(path.join('tests',entry.file))).digest('hex');if(sum!==entry.sha256)throw Error('Suite original alterada: '+entry.file);}
for(const name of ['ARCHITECTURE_AUDIT','CONFIGURATION','DEPLOYMENT','MIGRATION','ROADMAP','TESTING'])if(!fs.existsSync(`docs/${name}.md`))throw Error('Falta documentación '+name);
console.log('Plantilla con fichas vacías, sin editor de cliente; configuración, recursos, sintaxis y suites originales intactas: OK.');
