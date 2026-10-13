/* Horus / cenas novas. Carrega depois de horus.js (que mantém --p em cada [data-scene] e a trava de rolagem).
   Aqui: palavras que sobem, paradas por cena (data-beats), galeria horizontal, contadores, vídeos que só rodam na tela, brilho nos cartões. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduce.matches || root.dataset.motion === 'paused';
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // 1. Palavras que sobem. Dentro de .hx-grad o degradê vai para cada palavra (texto recortado não pinta filhos inline-block).
  function split(el) {
    let n = 0;
    const walk = (node, grad) => [...node.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.append(' '); return; }
          const w = document.createElement('span'), i = document.createElement('i');
          w.className = 'hxw'; i.style.setProperty('--i', n++); i.textContent = t;
          if (grad) i.className = 'hx-grad';
          w.append(i); f.append(w);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') {
        const g = c.classList.contains('hx-grad');
        if (g) c.classList.remove('hx-grad');
        walk(c, grad || g);
      }
    });
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    walk(el, false);
    el.setAttribute('aria-label', label);
    el.querySelectorAll('.hxw').forEach(w => w.setAttribute('aria-hidden', 'true'));
  }
  const rises = $$('.hx-rise');
  rises.forEach(split);
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  rises.forEach(h => io.observe(h));
  $$('.hx-det').forEach(s => io.observe(s));

  // 2. Paradas por cena: a parada atual acende [data-at] (.is-on) e tudo de [data-from] até ela (.is-seen).
  const scenes = $$('[data-beats]').map(el => ({
    el, n: +el.dataset.beats, b: -1,
    at: $$('[data-at]', el), from: $$('[data-from]', el),
    pct: el.querySelector('.cc-pct'), idx: el.querySelector('.cc-idx b'), pv: -1,
  }));
  // palavras gigantes: cada letra sobe em sequência
  $$('.cc-word').forEach(w => { w.innerHTML = [...w.textContent].map((c, i) => `<i style="--i:${i}">${c}</i>`).join(''); });
  function beats() {
    for (const s of scenes) {
      const p = Number(s.el.style.getPropertyValue('--p'));
      if (s.pct) { const v = reduce.matches ? 100 : Math.round(p * 100); if (v !== s.pv) { s.pv = v; s.pct.textContent = v + '%'; s.idx.textContent = String(Math.round(p * (s.n - 1)) + 1).padStart(2, '0'); } }
      const b = reduce.matches ? s.n : Math.round(p * (s.n - 1));
      if (b === s.b) continue;
      s.b = b;
      s.el.dataset.b = b;
      s.at.forEach(e => e.classList.toggle('is-on', reduce.matches || +e.dataset.at === b));
      s.from.forEach(e => e.classList.toggle('is-seen', reduce.matches || +e.dataset.from <= b));
    }
  }

  // 3. Galeria horizontal: quanto a faixa passa da largura da tela.
  const where = $$('.hx-where');
  function measure() {
    for (const w of where) {
      const t = w.querySelector('.wh-track');
      w.style.setProperty('--max', Math.max(0, t.scrollWidth - innerWidth));
    }
  }

  // 4. Contadores e vídeos/faixas que só andam com a cena na tela.
  const count = el => {
    const to = +el.dataset.count, t0 = performance.now();
    if (still()) { el.textContent = to; return; }
    requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - t0) / 1600);
      el.textContent = Math.round(to * (1 - (1 - t) ** 3));
      if (t < 1) requestAnimationFrame(tick);
    });
  };
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); }
  }), { threshold: .6 });
  $$('[data-count]').forEach(e => cio.observe(e));
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting && !still()) v.play().catch(() => {}); else v.pause();
  }));
  $$('video[data-vid]').forEach(v => vio.observe(v));
  const mio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('off', !e.isIntersecting)));
  where.forEach(w => mio.observe(w));

  // 5. Brilho que segue o cursor e leve inclinação (só mouse).
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.dt, .lv-dash, .im-card').forEach(el => {
      el.addEventListener('pointermove', e => {
        if (still()) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  let queued = false;
  const run = () => { queued = false; beats(); };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { measure(); schedule(); });
  reduce.addEventListener('change', () => { scenes.forEach(s => { s.b = -1; }); schedule(); });
  document.fonts?.ready.then(measure);
  addEventListener('load', measure);
  measure();
  beats();
})();
