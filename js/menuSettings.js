/* PDFs locales en IndexedDB: no compiten con el espacio del expediente de ventas. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const scope = new URL('.', location.href).pathname;
  const key = `${scope}:${globalThis.MesaInstallation?.restaurant.id || 'template'}`;
  const original = globalThis.MesaInstallation?.ticket.menuPdf || '';
  let database, activeUrl = '', busy = false;
  function error(message = '') {
    $('menu-pdf-error').textContent = message;
    $('menu-pdf-error').hidden = !message;
  }
  function loading(value) {
    busy = value;
    $('menu-pdf-fields').disabled = value;
  }
  function show(record) {
    const previous = activeUrl;
    activeUrl = record ? URL.createObjectURL(record.file) : '';
    const url = activeUrl || original;
    $('restaurant-menu').hidden = !url;
    $('restaurant-menu').href = url || '#';
    $('menu-pdf-current').textContent = record ? `Menú actual: ${record.name}` : original ? 'Menú actual: PDF original del restaurante' : 'Todavía no hay un menú PDF. Sube uno para habilitar Menú en Opciones.';
    $('menu-pdf-remove').disabled = !record;
    if (previous) URL.revokeObjectURL(previous);
  }
  function open() {
    if (database) return Promise.resolve(database);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('mesaos-files-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('menus');
      request.onsuccess = () => {
        database = request.result;
        database.onversionchange = () => { database.close(); database = null; };
        resolve(database);
      };
      request.onerror = () => reject(new Error('No se pudo abrir el almacenamiento del menú.'));
      request.onblocked = () => reject(new Error('Cierra otras pestañas de mesaOS y vuelve a intentarlo.'));
    });
  }
  async function store(mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('menus', mode);
      const request = operation(tx.objectStore('menus'));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = tx.onerror = () => reject(new Error('No se pudo guardar o leer el PDF. Revisa el espacio disponible del navegador.'));
    });
  }
  async function refresh() {
    if (busy) return;
    loading(true);
    try { show(await store('readonly', files => files.get(key))); error(); }
    catch (e) { error(e.message); $('menu-pdf-current').textContent = 'No se pudo consultar el PDF guardado. Puedes volver a intentarlo abriendo Configuración.'; }
    finally { loading(false); }
  }
  $('settings-button').addEventListener('click', () => {
    $('app-options').open = false;
    $('settings-dialog').showModal();
    refresh();
  });
  $('menu-pdf-save').addEventListener('click', async () => {
    if (busy) return;
    loading(true); error();
    try {
      const file = $('menu-pdf-file').files[0];
      if (!file) throw new Error('Selecciona el PDF que quieres guardar.');
      if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) throw new Error('Selecciona un archivo PDF.');
      if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('El PDF debe pesar como máximo 10 MiB y no estar vacío.');
      if (await file.slice(0, 5).text() !== '%PDF-') throw new Error('El archivo no tiene un formato PDF válido.');
      const record = { file, name: file.name, updatedAt: new Date().toISOString() };
      await store('readwrite', files => files.put(record, key));
      show(record);
      $('menu-pdf-file').value = '';
    } catch (e) { error(e.message || 'No se pudo guardar el menú.'); }
    finally { loading(false); }
  });
  $('menu-pdf-remove').addEventListener('click', async () => {
    if (busy) return;
    loading(true); error();
    try {
      await store('readwrite', files => files.delete(key));
      show(null); $('menu-pdf-file').value = '';
    } catch (e) { error(e.message || 'No se pudo restablecer el menú.'); }
    finally { loading(false); }
  });
  window.addEventListener('focus', refresh);
  refresh();
})();
