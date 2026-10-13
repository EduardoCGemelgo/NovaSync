/* Camada de movimento (home depois da mesa de despacho e páginas de setor). Não mexe na trava de rolagem: só lê a posição.
   Palavras que sobem, parallax, cortinas, faixa que abre, texto que acende, contadores, cartões 3D e cursor.
   Sem movimento (prefers-reduced-motion ou "Pausar animações"), tudo aparece pronto. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduce.matches || root.dataset.motion === 'paused';
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = n => Math.min(1, Math.max(0, n));
  const ease = t => 1 - (1 - t) ** 3;

  // 1. Palavras: cada palavra dos títulos vira uma máscara; o título entra na tela e as palavras sobem em sequência.
  function split(el) {
    let n = 0;
    const walk = node => [...node.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.append(' '); return; }
          const w = document.createElement('span'), i = document.createElement('i');
          w.className = 'w'; i.style.setProperty('--i', n++); i.textContent = t; w.append(i); f.append(w);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
    });
    walk(el);
    el.classList.add('is-split');
  }
  const heads = $$('#servicos h2, #servicos .sv-t, #como-funciona h2, #horus h2, #setores h2, #setores .rm-panel h3, #parceiros h2, #faq h2, #sobre h2, #cadastro-tecnico h2, .wow-band h2, .st-flow h1, .st-flow h2');
  heads.forEach(split);

  // 2. Texto que acende conforme a rolagem (#sobre).
  const scrub = document.querySelector('#sobre .section-head > p');
  let swords = [];
  if (scrub) {
    scrub.classList.add('wow-scrub');
    const t = scrub.textContent.trim().split(/\s+/);
    scrub.textContent = '';
    swords = t.map((w, i) => { const s = document.createElement('span'); s.className = 'sw'; s.textContent = w; scrub.append(s, i < t.length - 1 ? ' ' : ''); return s; });
  }

  // 3. O que entra na tela ganha .in (uma vez): títulos, linhas, itens.
  const lines = $$('#servicos, #horus, #setores, #parceiros, #faq, #sobre').filter(e => e.classList.add('wow-line') || true);
  const watch = [...heads.filter(h => !h.closest('.wow-band')), ...lines, ...$$('.st-cost li, .st-seq li')];
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  watch.forEach(e => io.observe(e));

  // 4. Cortinas e parallax: só o que está perto da tela é calculado a cada quadro.
  const curtains = $$('#horus, #faq').map(e => (e.classList.add('wow-curtain'), e));
  const pars = [];
  $$('.rm-panel img, .sv-body img, .wow-bg, .st-win-fig img').forEach(img => pars.push({ el: img, k: img.classList.contains('wow-bg') ? .12 : .07 }));
  const bands = $$('.wow-band');
  const mqs = $$('.wow-mq');
  const mio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('off', !e.isIntersecting)));
  mqs.forEach(m => mio.observe(m));
  // st-photo: a foto troca para a cena resolvida quando a seção "chamado resolvido" passa do meio da tela
  const photo = document.querySelector('.st-photo'), win = document.querySelector('.st-win'), cap = photo?.querySelector('.st-photo-cap small');
  const counted = new WeakSet();
  const count = el => {
    if (counted.has(el)) return; counted.add(el);
    const to = +el.dataset.count;
    if (still()) { el.textContent = to; return; }
    const t0 = performance.now();
    requestAnimationFrame(function tick(now) {
      const t = clamp((now - t0) / 1500);
      el.textContent = Math.round(to * ease(t));
      if (t < 1) requestAnimationFrame(tick);
    });
  };
  let queued = false;
  function frame() {
    queued = false;
    const vh = innerHeight, calm = still();
    for (const el of curtains) {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--wp', (calm || r.bottom < 0 ? 1 : clamp((vh - r.top) / (vh * .7))).toFixed(3));
    }
    for (const p of pars) {
      const r = p.el.parentElement.getBoundingClientRect();
      if (!r.height || r.bottom < -200 || r.top > vh + 200) continue;
      p.el.style.setProperty('--py', calm ? '0px' : `${(((r.top + r.height / 2) - vh / 2) * -p.k).toFixed(1)}px`);
    }
    for (const b of bands) {
      const r = b.getBoundingClientRect();
      const pr = calm ? 1 : clamp(-r.top / Math.max(1, r.height - vh) + (r.top < vh ? clamp(1 - r.top / vh) * .12 : 0));
      const k = calm ? 1 : ease(clamp(pr / .55));
      b.style.setProperty('--k', k.toFixed(3));
      const on = calm || pr > .4;
      b.querySelectorAll('.is-split').forEach(h => h.classList.toggle('in', on));
      if (on) b.querySelectorAll('[data-count]').forEach(count);
    }
    if (swords.length) {
      const r = scrub.getBoundingClientRect();
      const p = calm ? 1 : clamp((vh * .9 - r.top) / (vh * .55 + r.height));
      const n = Math.round(p * swords.length);
      swords.forEach((s, i) => s.classList.toggle('on', i < n));
    }
    if (win && photo) {
      const r = win.getBoundingClientRect();
      const on = r.top < vh * .55;
      if (on !== photo.classList.contains('is-win')) {
        photo.classList.toggle('is-win', on);
        if (cap) cap.textContent = on ? cap.dataset.b : cap.dataset.a;
      }
    }
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduce.addEventListener('change', schedule);
  new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  frame();

  // 5. Cartões com inclinação 3D e brilho que segue o cursor (só mouse).
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const tilts = $$('.partner-card, .rm-when, .rm-panel figure, .sv-body figure, .hm-horus-fig, .ch');
  tilts.forEach(el => {
    el.dataset.tilt = el.matches('.partner-card, .hm-horus-fig') ? 'flat' : '';
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || still()) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add('tilting');
      el.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', () => { el.classList.remove('tilting'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });

  // 6. Cursor: um anel que segue o mouse com atraso e cresce sobre o que se clica. Só em tela com mouse.
  if (fine.matches) {
    const cur = document.createElement('div');
    cur.className = 'wow-cur'; cur.setAttribute('aria-hidden', 'true');
    document.body.append(cur);
    let tx = -100, ty = -100, x = -100, y = -100, run = false;
    const loop = () => {
      x += (tx - x) * .2; y += (ty - y) * .2;
      cur.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > .4) requestAnimationFrame(loop); else run = false;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || still()) return;
      tx = e.clientX; ty = e.clientY; cur.classList.add('on');
      if (!run) { run = true; requestAnimationFrame(loop); }
      const t = e.target.closest?.('a, button, summary, select, label, input, [data-tilt]');
      cur.classList.toggle('big', !!t && !t.matches('input, select'));
      cur.classList.toggle('dot', !!t && t.matches('input, select'));
    }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  }
})();
