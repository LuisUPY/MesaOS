/* Local, decorative animation: no network assets or dependencies. */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const notice = document.getElementById('template-notice');
    if (!globalThis.MesaInstallation?.demo || !notice) return;
    notice.classList.add('demo-refraction');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    notice.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = { get matches() { return globalThis.MesaMotion?.disabled() ?? matchMedia('(prefers-reduced-motion: reduce)').matches; } };
    let width = 0, height = 0, frame = 0, previous = 0, visible = true;
    const pointer = {x: 0, y: 0, targetX: 0, targetY: 0, localX: 0, localY: 0, influence: 0, targetInfluence: 0};
    // Global parallax follows the cursor; nearby particles gently move away from it.
    window.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || reduced.matches) return;
      pointer.targetX = (event.clientX / innerWidth - .5) * 2;
      pointer.targetY = (event.clientY / innerHeight - .5) * 2;
      const rect = notice.getBoundingClientRect();
      pointer.localX = event.clientX - rect.left;
      pointer.localY = event.clientY - rect.top;
      pointer.targetInfluence = pointer.localX >= 0 && pointer.localX <= rect.width && pointer.localY >= 0 && pointer.localY <= rect.height ? 1 : 0;
    }, {passive: true});
    function releasePointer() {
      pointer.targetX = pointer.targetY = pointer.targetInfluence = 0;
    }
    document.documentElement.addEventListener('pointerleave', releasePointer);
    window.addEventListener('blur', releasePointer);
    window.addEventListener('scroll', () => { pointer.targetInfluence = 0; }, {passive: true});
    const particles = Array.from({length: 140}, () => ({
      angle: Math.random() * Math.PI * 2,
      depth: Math.random(), speed: .025 + Math.random() * .035,
      size: .7 + Math.random() * 1.1
    }));
    function draw(time) {
      const delta = previous ? Math.min((time - previous) / 1000, .05) : 0;
      previous = time;
      const ease = 1 - Math.exp(-delta * 7);
      if (reduced.matches) {
        pointer.x = pointer.y = pointer.influence = 0;
      } else {
        pointer.x += (pointer.targetX - pointer.x) * ease;
        pointer.y += (pointer.targetY - pointer.y) * ease;
        pointer.influence += (pointer.targetInfluence - pointer.influence) * ease;
      }
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!reduced.matches) p.depth = (p.depth + delta * p.speed) % 1;
        const radius = .08 + p.depth * 1.1;
        const angle = p.angle + (reduced.matches ? 0 : Math.sin(time * .0001 + p.angle) * .06);
        let x = width * .5 + Math.cos(angle) * radius * width * .62 + pointer.x * (8 + p.depth * 22);
        let y = height * .5 + Math.sin(angle) * radius * height * .95 + pointer.y * (3 + p.depth * 8);
        const dx = x - pointer.localX, dy = y - pointer.localY;
        const distance = Math.hypot(dx, dy);
        const reach = 115;
        const push = Math.pow(Math.max(0, 1 - distance / reach), 2) * 38 * pointer.influence;
        x += dx / (distance || 1) * push;
        y += dy / (distance || 1) * push;
        const length = (1.5 + p.depth * 4) * p.size;
        const alpha = Math.sin(p.depth * Math.PI) * .66;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(angle);
        const spectrum = ctx.createLinearGradient(-length, -2, length, 2);
        spectrum.addColorStop(0, `rgba(200,200,200,0)`);
        spectrum.addColorStop(.25, `rgba(185,185,185,${alpha})`);
        spectrum.addColorStop(.55, `rgba(255,255,255,${alpha})`);
        spectrum.addColorStop(.8, `rgba(195,195,195,${alpha})`);
        spectrum.addColorStop(1, `rgba(195,195,195,0)`);
        ctx.fillStyle = spectrum;
        ctx.beginPath(); ctx.ellipse(0, 0, length, .8 + p.depth * .8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      frame = 0;
      if (!reduced.matches && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function restart() {
      cancelAnimationFrame(frame); frame = 0; previous = 0;
      canvas.hidden = reduced.matches;
      if (reduced.matches) { releasePointer(); return; }
      if (visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    new ResizeObserver(() => {
      const rect = notice.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const scale = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0); restart();
    }).observe(notice);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; restart(); }).observe(notice);
    document.addEventListener('mesa-motion-change', () => { releasePointer(); restart(); });
    document.addEventListener('visibilitychange', restart);
  });
})();
