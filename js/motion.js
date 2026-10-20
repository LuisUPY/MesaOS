/* Preferencia visual por instalación; no altera pedidos ni datos de caja. */
globalThis.MesaMotion = (() => {
  'use strict';
  const key = `mesaos:${encodeURIComponent(new URL('.', location.href).pathname)}:animations`;
  const system = matchMedia('(prefers-reduced-motion: reduce)');
  let preference = null;
  try { preference = localStorage.getItem(key); } catch { /* Disponible también sin almacenamiento. */ }
  const disabled = () => preference === 'off' || preference !== 'on' && system.matches;
  function update() {
    document.documentElement.dataset.motion = disabled() ? 'off' : 'on';
    const button = document.getElementById('animations-toggle');
    if (button) {
      button.textContent = disabled() ? 'Activar animaciones' : 'Desactivar animaciones';
      button.title = disabled() ? 'Las animaciones están desactivadas para reducir el consumo.' : 'Detener efectos y movimientos para reducir el consumo.';
    }
    if (disabled()) for (const animation of document.getAnimations?.() || []) animation.cancel();
    document.dispatchEvent(new Event('mesa-motion-change'));
  }
  update();
  document.addEventListener('DOMContentLoaded', () => {
    update();
    document.getElementById('animations-toggle')?.addEventListener('click', () => {
      preference = disabled() ? 'on' : 'off';
      try { localStorage.setItem(key, preference); } catch { /* Mantener el cambio durante la sesión. */ }
      update();
    });
  });
  system.addEventListener('change', update);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { preference = event.newValue; update(); }
  });
  return Object.freeze({ disabled });
})();
