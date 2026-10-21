/* Personalización opcional del pie de cuenta, aislada por restaurante y sitio. */
globalThis.MesaTicketSettings = (() => {
  'use strict';
  const scope = new URL('.', location.href).pathname;
  const key = `mesaos:${encodeURIComponent(scope)}:${globalThis.MesaInstallation?.restaurant.id || 'template'}:ticket:v1`;
  const empty = () => ({ image: '', caption: '' });
  function valid(value) {
    return value && typeof value.image === 'string' && value.image.length <= 1500000 &&
      (!value.image || /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value.image)) &&
      typeof value.caption === 'string' && value.caption.length <= 120;
  }
  function read() {
    const raw = localStorage.getItem(key);
    if (!raw) return empty();
    const value = JSON.parse(raw);
    if (!valid(value)) throw new Error('El QR guardado no es válido. Vuelve a configurarlo o quítalo.');
    return value;
  }
  const $ = id => document.getElementById(id);
  let draft = empty(), busy = false, generation = 0;
  function error(message) {
    $('ticket-settings-error').textContent = message;
    $('ticket-settings-error').hidden = !message;
  }
  function preview() {
    const container = $('ticket-qr-preview');
    container.hidden = !draft.image;
    container.replaceChildren();
    if (draft.image) {
      const img = document.createElement('img');
      img.src = draft.image;
      img.alt = 'Vista previa del QR del ticket';
      container.append(img);
    }
    $('ticket-qr-caption').value = draft.caption;
  }
  function loading(value) { busy = value; $('ticket-qr-save').disabled = value; }
  $('ticket-settings-button').addEventListener('click', () => {
    $('settings-dialog').close();
    generation++;
    loading(false);
    error('');
    try { draft = read(); } catch (e) { draft = empty(); error(e.message); }
    $('ticket-qr-file').value = '';
    preview();
    $('ticket-settings-dialog').showModal();
  });
  $('ticket-qr-file').addEventListener('change', async () => {
    const file = $('ticket-qr-file').files[0];
    const current = ++generation;
    if (!file) { loading(false); return; }
    loading(true); error('');
    try {
      if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 1024*1024) throw new Error('Usa una imagen PNG, JPEG o WebP de hasta 1 MiB.');
      const image = await new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.readAsDataURL(file);
      });
      const img = new Image(); img.src = image;
      await img.decode();
      if (img.naturalWidth < 100 || img.naturalHeight < 100 || img.naturalWidth > 4096 || img.naturalHeight > 4096) throw new Error('La imagen debe medir entre 100 y 4096 píxeles por lado.');
      if (current !== generation) return;
      draft = { image, caption: $('ticket-qr-caption').value.trim() };
      preview();
    } catch (e) { if (current === generation) { $('ticket-qr-file').value = ''; error(e.message || 'No se pudo abrir la imagen.'); } }
    finally { if (current === generation) loading(false); }
  });
  $('ticket-qr-remove').addEventListener('click', () => {
    generation++; loading(false); draft = empty();
    $('ticket-qr-file').value = ''; preview(); error('');
  });
  $('ticket-qr-save').addEventListener('click', () => {
    if (busy) return;
    try {
      const value = { image: draft.image, caption: $('ticket-qr-caption').value.trim() };
      if (!valid(value)) throw new Error('Revisa la imagen y el texto del ticket.');
      localStorage.setItem(key, JSON.stringify(value));
      $('ticket-settings-dialog').close();
    } catch (e) { error(`No se guardó la configuración: ${e.message}`); }
  });
  $('ticket-settings-dialog').addEventListener('close', () => { generation++; loading(false); });
  return Object.freeze({ read });
})();
