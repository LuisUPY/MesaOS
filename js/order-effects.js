/* Presentation only: order data, prices and storage stay in their existing modules. */
globalThis.MesaOrderEffects = (() => {
  'use strict';
  const reduced = () => globalThis.MesaMotion?.disabled() ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  function gradient(pedido) {
    const hue = ((Number(pedido.numero) || 0) * 137.50776405003785) % 360;
    const angle = 105 + ((Number(pedido.numero) || 0) * 47 % 150);
    return `linear-gradient(${angle}deg,hsl(${hue.toFixed(5)},65%,72%),hsl(${((hue + 52) % 360).toFixed(5)},70%,85%),hsl(${((hue + 122) % 360).toFixed(5)},65%,70%))`;
  }
  function decorate(card, pedido) {
    card.style.setProperty('--order-gradient', gradient(pedido));
  }
  function capture() {
    if (reduced()) return [];
    return [...document.querySelectorAll('#review-items .order-item')].slice(0, 5).map(item => {
      const rect = item.getBoundingClientRect();
      const clone = item.cloneNode(true);
      clone.className = 'order-transfer-item';
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      return {clone, rect};
    }).filter(({rect}) => rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight);
  }
  function transfer(pedido, sources) {
    if (reduced() || !sources.length) return Promise.resolve();
    const card = [...document.querySelectorAll('#open-orders-list .queue-ticket')].find(el => el.dataset.pedido === pedido.id);
    const bar = document.getElementById('open-orders-bar');
    if (!bar || !card || typeof card.animate !== 'function') return Promise.resolve();
    const list = document.getElementById('open-orders-list');
    const shown = !list.hidden;
    // Scroll only the horizontal queue, never move the page or change its collapsed state.
    if (shown) list.scrollLeft = Math.max(0, card.offsetLeft - list.offsetLeft - 12);
    const target = (shown ? card : document.getElementById('open-orders-title')).getBoundingClientRect();
    const tx = Math.max(12, Math.min(innerWidth - 12, target.left + target.width / 2));
    const ty = Math.max(12, Math.min(innerHeight - 12, target.top + target.height / 2));
    const flights = sources.map(({clone, rect}, i) => {
      clone.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;--order-gradient:${gradient(pedido)}`;
      document.body.append(clone);
      const dx = tx - rect.left - rect.width / 2;
      const dy = ty - rect.top - rect.height / 2;
      const animation = clone.animate([
        {transform:'translate(0,0) scale(1)',opacity:.94},
        {transform:`translate(${dx * .45}px,${dy * .35 - 28}px) scale(.68)`,opacity:.8,offset:.45},
        {transform:`translate(${dx}px,${dy}px) scale(.12)`,opacity:0}
      ], {duration:640,delay:i * 45,easing:'cubic-bezier(.3,.02,.24,1)',fill:'forwards'});
      const cleanup = () => clone.remove();
      // A background tab or a browser suspension must not hold up printing.
      return Promise.race([animation.finished.catch(() => {}),new Promise(resolve => setTimeout(resolve, 1000))]).finally(cleanup);
    });
    return Promise.all(flights).then(() => {
      if (reduced()) return;
      const destination = shown ? card : document.getElementById('open-orders-count');
      destination.animate([{transform:'scale(1)'},{transform:'scale(1.04)',offset:.4},{transform:'scale(1)'}],{duration:280,easing:'ease-out'});
    });
  }
  function pulse(button) {
    if (reduced()) return;
    button.classList.remove('prism-pressed');
    void button.offsetWidth;
    button.classList.add('prism-pressed');
    setTimeout(() => button.classList.remove('prism-pressed'), 650);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('#review-order,#confirm-order');
    if (button && !button.disabled) pulse(button);
  }, true);
  return Object.freeze({decorate,capture,transfer});
})();
