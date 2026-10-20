/* Recursos de publicación: mismas rutas en la raíz y bajo /nombre-del-repo/. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function localFile(root, from, url) {
  if (!url || url.startsWith('#')) return null;
  if (/^(?:[a-z]+:|\/)/i.test(url)) throw Error(`Recurso no relativo en ${from}: ${url}`);
  const relative = path.relative(root, path.resolve(path.dirname(path.join(root, from)), decodeURIComponent(url.split(/[?#]/)[0])));
  if (relative === '') return null;
  if (relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw Error(`Recurso fuera del sitio: ${url}`);
  // Linux y Pages distinguen mayúsculas aunque el disco local no lo haga.
  let directory = root;
  for (const part of relative.split(path.sep)) {
    if (!fs.readdirSync(directory).includes(part)) throw Error(`Falta recurso (revisa mayúsculas) en ${from}: ${url}`);
    directory = path.join(directory, part);
  }
  if (!fs.statSync(directory).isFile()) throw Error(`El recurso no es un archivo: ${url}`);
  return directory;
}

function revision(root, from, url) {
  const file = localFile(root, from, url);
  if (!file) return url;
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
  const [beforeHash, fragment] = url.split('#');
  const [pathname, query] = beforeHash.split('?');
  const params = new URLSearchParams(query);
  params.set('v', hash);
  return `${pathname}?${params}${fragment ? '#' + fragment : ''}`;
}

function finalizeSite(root) {
  // Primero versionar las imágenes de CSS, después las hojas y scripts del HTML.
  for (const name of fs.readdirSync(path.join(root, 'css'))) {
    if (!name.endsWith('.css')) continue;
    const from = `css/${name}`;
    const file = path.join(root, from);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g,
      (_, quote, url) => `url(${quote}${revision(root, from, url)}${quote})`));
  }
  // Imágenes y PDF que la interfaz crea dinámicamente también renuevan su caché.
  const scripts = fs.readdirSync(path.join(root, 'js')).filter(name => name.endsWith('.js')).map(name => `js/${name}`);
  scripts.push('config/installation.js');
  for (const from of scripts) {
    const file = path.join(root, from);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/(['"])(assets\/[^'"\s]+)\1/g,
      (_, quote, url) => `${quote}${revision(root, 'index.html', url)}${quote}`));
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  for (const icon of manifest.icons || []) icon.src = revision(root, 'manifest.json', icon.src);
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  // El HTML se versiona al final para incluir los cambios de sus dependencias.
  const html = path.join(root, 'index.html');
  fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace(/\b(src|href)="([^"]+)"/g,
    (_, attribute, url) => `${attribute}="${url === './' ? url : revision(root, 'index.html', url)}"`));
  fs.writeFileSync(path.join(root, '.nojekyll'), '');
}

function copyRuntime(root, out) {
  const filter = file => !path.basename(file).startsWith('.');
  for (const name of ['index.html', 'manifest.json', 'css']) {
    fs.cpSync(path.join(root, name), path.join(out, name), { recursive: true, filter });
  }
  fs.mkdirSync(path.join(out, 'js'), { recursive: true });
  for (const name of fs.readdirSync(path.join(root, 'js'))) {
    if (name.endsWith('.js') && name !== 'menuData.js') fs.copyFileSync(path.join(root, 'js', name), path.join(out, 'js', name));
  }
  for (const name of ['assets/img/categorias', 'assets/platform']) {
    fs.cpSync(path.join(root, name), path.join(out, name), { recursive: true, filter });
  }
}

module.exports = { copyRuntime, finalizeSite };
