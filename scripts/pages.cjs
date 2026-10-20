/* Empaqueta la versión actual, incluida su demo, sin publicar archivos internos. */
const fs = require('node:fs');
const path = require('node:path');
const { parse, validate, script } = require('./config.cjs');
const { copyRuntime, finalizeSite } = require('./site.cjs');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist/pages');
const marker = '.mesaos-build';
const signature = 'MesaOS Pages build v1\n';

function buildPages() {
  const config = validate(parse(fs.readFileSync(path.join(root, 'config/restaurant.json'), 'utf8')), { allowEmpty: true });
  if (fs.existsSync(out) && (!fs.existsSync(path.join(out, marker)) || fs.readFileSync(path.join(out, marker), 'utf8') !== signature)) {
    throw Error('dist/pages ya contiene archivos ajenos al generador. Muévelos antes de construir.');
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const staging = fs.mkdtempSync(path.join(root, 'dist/.pages-'));
  try {
    copyRuntime(root, staging);
    fs.mkdirSync(path.join(staging, 'config'));
    fs.writeFileSync(path.join(staging, 'config/installation.js'), script(config));
    // Una configuración lista debe pasar por el generador de entregas, que copia logo y PDF.
    if (config.ready) throw Error('Usa npm run build -- --config config/restaurant.json --out dist/mi-restaurante para una instalación configurada.');
    finalizeSite(staging);
    fs.writeFileSync(path.join(staging, marker), signature);
    fs.rmSync(out, { recursive: true, force: true });
    fs.renameSync(staging, out);
    console.log(`Sitio listo para GitHub Pages: ${out}`);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

try { buildPages(); } catch (error) {
  console.error(`No se generó el sitio: ${error.message}`);
  process.exitCode = 1;
}
