/* Padrão Konso para o resto do site: a rolagem conduz cada cena via --p (0 a 1) e a trava (trava.js) anda de parada em parada.
   Cada recurso só liga se o elemento existir na página: .kx-words, .kx-statement video, .kx-circuit, .kx-panels, [data-count],
   video[data-src], .hx-fit. Páginas com comportamento próprio (home, Horus) carregam o próprio script depois deste. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.min(1, Math.max(0, n));
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const scenes = $$('[data-scene]');
  window.kx = { reduce, clamp, $, $$ };

  // Frase palavra por palavra: cada palavra ganha seu índice --i.
  $$('.kx-words').forEach(words => {
    const list = words.textContent.trim().split(/\s+/);
    words.replaceChildren(...list.flatMap((w, i) => {
      const s = document.createElement('span');
      s.textContent = w;
      s.style.setProperty('--i', i);
      return [s, ' '];
    }));
    words.style.setProperty('--n', list.length);
  });

  // Mockups desenhados em largura fixa (data-w) e escalados para o espaço disponível.
  const fit = new ResizeObserver(es => es.forEach(e => e.target.style.setProperty('--s', e.contentRect.width / e.target.dataset.w)));
  $$('.hx-fit').forEach(el => fit.observe(el));

  // Vídeo preso à rolagem (quadro-chave em todo quadro: a busca é instantânea).
  const video = $('.kx-statement video');
  const vScene = video?.closest('[data-scene]');
  video?.play().then(() => video.pause()).catch(() => {}); // iOS só entrega quadros depois de um play
  function scrub() {
    if (!video || reduce.matches || !video.duration) return;
    const t = Number(vScene.style.getPropertyValue('--p')) * (video.duration - .05);
    if (Math.abs(video.currentTime - t) > 1 / 48) video.currentTime = t;
  }
  video?.addEventListener('loadedmetadata', scrub);

  // Circuito: etapa pela posição da cena (faixas iguais, uma por nó).
  const circuit = $('.kx-circuit');
  const nodes = $$('.kx-nodes li'), details = $$('.kx-detail article');
  let stage = 0;
  function setStage(n) {
    if (n === stage) return;
    stage = n;
    nodes.forEach((li, i) => { li.classList.toggle('is-on', i === n - 1); li.classList.toggle('is-done', i < n - 1); });
    details.forEach((d, i) => d.classList.toggle('is-on', i === n - 1));
  }

  const hooks = []; // páginas registram o que precisa rodar a cada quadro: kx.onFrame(fn)
  window.kx.onFrame = fn => hooks.push(fn);
  let queued = false;
  function frame() {
    queued = false;
    const h = innerHeight;
    for (const el of scenes) {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--p', (reduce.matches ? 1 : clamp(-r.top / Math.max(1, r.height - h))).toFixed(4));
    }
    if (circuit) setStage(reduce.matches ? nodes.length : Math.min(nodes.length, Math.max(1, Math.floor(Number(circuit.style.getPropertyValue('--p')) * nodes.length) + 1)));
    hooks.forEach(fn => fn());
    scrub();
  }
  const schedule = window.kx.schedule = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

  // Trava de rolagem (trava.js). Paradas: o topo, os pontos de cada cena presa (data-stops, fração do trecho preso),
  // o início das outras seções e o fim. Trecho livre maior que a tela ganha paradas intermediárias.
  const root = document.documentElement;
  const blocks = $$('main > section:not([data-scene])');
  const lock = () => {
    const h = innerHeight, end = root.scrollHeight - h;
    const fitY = y => Math.round(Math.min(end, Math.max(0, y)));
    const top = el => el.getBoundingClientRect().top + scrollY;
    const holds = scenes.map(el => [top(el), top(el) + el.offsetHeight - h]);
    const beats = scenes.flatMap((el, i) => el.dataset.stops.split(' ').map(p => fitY(holds[i][0] + p * (holds[i][1] - holds[i][0]))));
    // no celular o menu fixo cobre o topo, então a área útil começa abaixo dele
    const navH = innerWidth <= 900 ? $('.nav').offsetHeight + 16 : 0;
    const solo = $$('[data-stop]').map(el => fitY(top(el) - navH)); // blocos com parada própria
    const pins = new Set([0, end, ...solo, ...blocks.flatMap(s => {
      const t = top(s) - navH, extra = s.offsetHeight - (h - navH);
      return extra > h * .3 ? [fitY(t), fitY(t + extra)] : [fitY(navH ? t + extra / 2 : t + Math.max(0, extra) / 2)];
    })]);
    const a = [0];
    for (const y of [...pins, ...beats].sort((p, q) => p - q)) {
      if (y - a.at(-1) < h * .3) { // quase iguais: fica a de cima, salvo início de seção e fim
        if (!pins.has(y) || y - a.at(-1) < 3) continue;
        if (y === end && !pins.has(a.at(-1))) a.pop();
      }
      let s = a.at(-1);
      for (const [hs, he] of [...holds, [y, y]]) { // trechos livres entre s e y
        if (he <= s) continue;
        const e = Math.min(hs, y);
        if (e - s > h * 1.2) for (let n = Math.ceil((e - s) / (h * .92)), i = 1; i < n; i++) a.push(Math.round(s + (e - s) * i / n));
        if (hs >= y) break;
        s = he;
      }
      a.push(y);
    }
    return { a };
  };
  window.kx.pick = trava(lock);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduce.addEventListener('change', schedule);
  frame();

  // Painéis com lanterna: um aberto por vez; a lanterna segue o ponteiro; troca sozinho enquanto ninguém mexe.
  $$('.kx-panels').forEach(box => {
    const panels = [...box.querySelectorAll('.kx-panel')];
    let auto = true, cur = Math.max(0, panels.findIndex(p => p.classList.contains('is-on')));
    const open = i => {
      cur = i;
      panels.forEach((el, k) => { el.classList.toggle('is-on', k === i); el.querySelector('.kx-panel-tab').setAttribute('aria-expanded', String(k === i)); });
    };
    panels.forEach((el, k) => {
      el.addEventListener('click', e => { if (e.target.closest('a')) return; auto = false; open(k); });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    let seen = false;
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; }, { threshold: .5 }).observe(box);
    if (!reduce.matches && box.dataset.auto !== 'off') setInterval(() => { if (auto && seen && !document.hidden) open((cur + 1) % panels.length); }, 5500);
  });

  // Linhas de problema: a luz segue o ponteiro.
  $$('.kx-rows li').forEach(li => li.addEventListener('pointermove', e => {
    const r = li.getBoundingClientRect();
    li.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    li.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  // Números contam ao entrar na tela.
  const countIO = new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return;
    o.unobserve(e.target);
    if (reduce.matches) return;
    const to = Number(e.target.dataset.count), t0 = performance.now();
    requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - t0) / 1400);
      e.target.textContent = Math.round(to * (1 - (1 - t) ** 3));
      if (t < 1) requestAnimationFrame(step);
    });
  }), { threshold: .6 });
  $$('[data-count]').forEach(c => { if (!reduce.matches) c.textContent = '0'; countIO.observe(c); });

  // Vídeos de fundo: carregam e tocam só perto da tela.
  $$('video[data-src]').forEach(v => {
    if (v.closest('.kx-layers')) return;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; if (!reduce.matches) v.play().catch(() => {}); } else v.pause();
    }, { rootMargin: '200px' }).observe(v);
  });
})();
