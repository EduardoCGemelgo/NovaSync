/* Trava de rolagem (home e Horus). A página diz onde parar: stops() devolve { a: [posições] , ...o que show usar }.
   Roda, dedo e teclado não arrastam a página: cada gesto leva direto à parada seguinte, num deslize com tempo
   próprio; show(y, c) avisa a página no instante em que o deslize começa. Rolagens que não passam por aqui (barra
   de rolagem, links do menu) encaixam na parada mais próxima quando terminam. html.still = movimento reduzido ou
   "Pausar animações": sem trava. Devolve pick(), que atualiza show pela posição atual. */
window.trava = (stops, show = () => {}) => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduce.matches || root.dataset.motion === 'paused';
  const nearest = ({ a }) => a.reduce((b, v) => Math.abs(v - scrollY) < Math.abs(b - scrollY) ? v : b);
  { const c = stops(); show(nearest(c), c, true); }

  let gliding = false;
  function glide(y, c) {
    show(y, c);
    const from = scrollY, t0 = performance.now();
    gliding = true;
    requestAnimationFrame(function tick(now) {
      const t = Math.min(1, Math.max(0, (now - t0) / 750)), e = t < .5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2;
      scrollTo({ top: from + (y - from) * e, behavior: 'instant' });
      if (t < 1) requestAnimationFrame(tick); else gliding = false;
    });
  }
  function step(dir) {
    const c = stops(), y = scrollY;
    const to = dir > 0 ? c.a.find(v => v > y + 2) : c.a.findLast(v => v < y - 2);
    if (to !== undefined) glide(to, c);
  }
  // barra de rolagem, links do menu, foco: show segue a posição e, parada a rolagem, encaixa na parada mais próxima
  function pick() {
    if (gliding) return;
    const c = stops();
    show(nearest(c), c);
  }
  function settle() {
    if (gliding || still() || document.activeElement?.matches(':focus-visible')) return; // teclado e formulários rolam soltos
    const c = stops(), y = nearest(c);
    if (Math.abs(y - scrollY) > 2) glide(y, c);
  }
  let idle;
  if ('onscrollend' in window) addEventListener('scrollend', settle);
  else addEventListener('scroll', () => { clearTimeout(idle); idle = setTimeout(settle, 160); }, { passive: true });

  // O que tem rolagem própria fica de fora: janela do cadastro, menu do celular, campos de formulário.
  const own = t => t.closest?.('dialog, .mobile-menu');
  // Roda: um gesto, uma parada. O trackpad segue mandando eventos depois do gesto (inércia): só vale um novo
  // depois de 200 ms sem nenhum.
  let lastWheel = 0;
  addEventListener('wheel', e => {
    if (still() || e.ctrlKey || e.shiftKey || !e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY) || own(e.target)) return;
    e.preventDefault();
    const fresh = e.timeStamp - lastWheel > 200;
    lastWheel = e.timeStamp;
    if (fresh && !gliding) step(Math.sign(e.deltaY));
  }, { passive: false });
  // Dedo: arrasto vertical troca de parada assim que passa de 24 px; arrasto de lado (galeria) e pinça seguem nativos.
  let touch = null;
  addEventListener('touchstart', e => {
    touch = still() || e.touches.length > 1 || own(e.target) ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  addEventListener('touchmove', e => {
    if (!touch || !e.cancelable) return;
    const dx = e.touches[0].clientX - touch.x, dy = e.touches[0].clientY - touch.y;
    touch.axis ||= Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (touch.axis === 'x') return;
    e.preventDefault();
    if (!touch.done && !gliding && Math.abs(dy) > 24) { touch.done = true; step(-Math.sign(dy)); }
  }, { passive: false });
  // Teclado: setas, espaço e Page Up/Down; segurar a tecla avança parada a parada. Home e End seguem nativos.
  const KEYS = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };
  addEventListener('keydown', e => {
    if (!KEYS[e.key] || still() || e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented
      || e.target.closest?.('input, textarea, select, button, summary, [contenteditable]') || own(e.target)) return;
    e.preventDefault();
    if (!gliding) step(e.key === ' ' && e.shiftKey ? -1 : KEYS[e.key]);
  });
  return pick;
};
