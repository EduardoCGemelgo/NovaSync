/* Home: a página anda de parada em parada (trava.js). A abertura (trailer) escolhe a cena e toca o corte; a mesa de despacho
   (despacho.js) conta a rede pelo progresso da rolagem; depois vêm o custo em uma frase, os serviços, o "como funciona",
   o seletor de ramo e o pedido em uma frase. html.still = movimento reduzido ou "Pausar animações": sem trava. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduce.matches || root.dataset.motion === 'paused';
  const $ = s => document.querySelector(s);
  const clamp = n => Math.min(1, Math.max(0, n));
  let queued = false;

  // Celular do Horus e painel do "como funciona": desenhados em largura fixa (data-w) e escalados.
  const fit = new ResizeObserver(entries => entries.forEach(e =>
    e.target.style.setProperty('--s', e.contentRect.width / e.target.dataset.w)));
  document.querySelectorAll('.hx-fit').forEach(el => fit.observe(el));

  // 1. Hero, o trailer: uma tela de rolagem por cena; entre cenas, um corte de cinema.
  const story = $('.hm-story');
  const shots = [...story.querySelectorAll('.hm-beat')];
  const wall = story.querySelector('.hm-wall');
  const cta = story.querySelector('.button');
  const CUTS = [ // corte entre a cena i e a i+1: animação (home.css), duração em ms, curva
    ['wall', 1200, 'cubic-bezier(.65,0,.35,1)'],
    ['whip', 800, 'cubic-bezier(.8,0,.2,1)'],
    ['zoom', 1100, 'cubic-bezier(.7,0,.3,1)'],
    ['volta', 1500, 'cubic-bezier(.2,.7,.1,1)'],
  ];
  const last = shots.length - 1;
  let scene = 0;
  function cut(to, from) {
    scene = to;
    shots.forEach(s => { s.classList.remove('is-on', 'is-out'); s.style.animation = ''; });
    wall.style.animation = '';
    shots[to].classList.add('is-on');
    cta.tabIndex = to === last || still() ? 0 : -1;
    if (from === null || still()) return;
    // Voltando, o mesmo corte toca de trás para frente. Salto de várias cenas usa o corte que chega ao destino.
    const fwd = to > from;
    const [name, ms, ease] = CUTS[fwd ? to - 1 : to];
    const run = `${ms}ms ${ease} both ${fwd ? 'normal' : 'reverse'}`;
    shots[from].classList.add('is-out');
    void story.offsetWidth; // reinicia a animação mesmo quando o corte repete
    (fwd ? shots[from] : shots[to]).style.animation = `hm-${name}-out ${run}`;
    (fwd ? shots[to] : shots[from]).style.animation = `hm-${name}-in ${run}`;
    if (name === 'wall') wall.style.animation = `hm-wall ${run}`;
  }

  // 2. Mesa de despacho: --p da cena vai para o desenho (despacho.js) e escolhe o texto da vez.
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const dpTexts = [...document.querySelectorAll('.dp-copy > div')];
  let dpStage = -1;
  function scenesFrame() {
    const h = innerHeight;
    for (const el of scenes) {
      const r = el.getBoundingClientRect();
      const p = still() ? 1 : clamp(-r.top / Math.max(1, r.height - h));
      el.style.setProperty('--p', p.toFixed(4));
      if (el.id === 'cobertura') {
        window.despacho?.set(p, still());
        const n = p < .2 ? 0 : p < .42 ? 1 : p < .64 ? 2 : p < .88 ? 3 : 4;
        if (n !== dpStage) { dpStage = n; el.dataset.stage = n; dpTexts.forEach((d, i) => d.classList.toggle('is-on', i === n)); }
      }
    }
  }

  // 3. Como funciona: uma parada da trava por etapa, com a etapa no meio da tela; a etapa da vez comanda o painel.
  const steps = [...document.querySelectorAll('.hm-step')];
  const panels = [...document.querySelectorAll('.hm-panel')];
  const line = [...document.querySelectorAll('.hm-line li')];
  const status = $('[data-flow-status]');
  const device = $('.hm-flow-device');
  const stacked = matchMedia('(max-width: 900px)'); // mesmo corte do home.css
  const STATUS = ['Escopo recebido', 'Técnico designado', 'Em execução', 'Relatório disponível'];
  function setStage(n) {
    steps.forEach((s, i) => s.classList.toggle('is-on', i === n));
    panels.forEach((p, i) => p.classList.toggle('is-on', i === n));
    line.forEach((li, i) => li.classList.toggle('done', i <= n));
    status.textContent = STATUS[n];
  }

  // Trava de rolagem da página toda (trava.js). Paradas: o topo, cada cena do trailer, os pontos de cada cena presa,
  // o início de cada seção, cada etapa do "como funciona" e o fim; um trecho mais alto que a tela ganha paradas
  // intermediárias, para nada ficar sem ser visto. O corte do trailer começa no mesmo instante do deslize.
  const blocks = [...document.querySelectorAll('main > section:not([data-scene])')];
  const strip = $('.service-strip');
  function stops() {
    const h = innerHeight, end = root.scrollHeight - h;
    const fitY = y => Math.round(Math.min(end, Math.max(0, y)));
    const top = el => el.getBoundingClientRect().top + scrollY;
    const unit = story.offsetHeight / shots.length;
    const beats = shots.map((_, i) => fitY(top(story) + i * unit));
    const holds = scenes.map(el => [top(el), top(el) + el.offsetHeight - h]);
    const sbeats = scenes.flatMap((el, i) => el.dataset.stops.split(' ').map(p => fitY(holds[i][0] + p * (holds[i][1] - holds[i][0]))));
    // No celular o painel fica preso em cima: a etapa se alinha ao meio da área livre abaixo dele.
    const mid = stacked.matches ? (parseFloat(getComputedStyle(device).top) + device.offsetHeight + h) / 2 : h / 2;
    const marks = steps.map(s => fitY(top(s) + s.offsetHeight / 2 - mid));
    // Início de cada seção, onde o link do menu leva (scroll-margin-top incluso), e o fim: essas nunca saem,
    // senão o link cai fora da parada e a trava leva para outro lugar. O topo de uma cena presa não conta:
    // a 1ª parada dela já mostra a cena (o link do menu para a cena cai na parada mais próxima).
    const pins = new Set([0, end, ...blocks.map(s => fitY(top(s) - parseFloat(getComputedStyle(s).scrollMarginTop)))]);
    const held = [beats[0], fitY(top(strip.nextElementSibling))]; // o trailer vai direto à próxima cena, a faixa só passa
    const a = [0];
    for (const y of [...pins, ...beats, ...sbeats, ...marks].sort((p, q) => p - q)) {
      if (y - a.at(-1) < h * .3) { // quase iguais: fica a de cima, salvo início de seção e fim
        if (!pins.has(y) || y - a.at(-1) < 3) continue;
        if (y === end && !pins.has(a.at(-1))) a.pop();
      }
      const prev = a.at(-1);
      if (!(prev >= held[0] && y <= held[1])) {
        let s = prev;
        for (const [hs, he] of [...holds, [y, y]]) { // trechos livres entre s e y (dentro de uma cena presa a tela não troca)
          if (he <= s) continue;
          const e = Math.min(hs, y);
          if (e - s > h * 1.2) for (let n = Math.ceil((e - s) / (h * .92)), i = 1; i < n; i++) a.push(Math.round(s + (e - s) * i / n));
          if (hs >= y) break;
          s = he;
        }
      }
      a.push(y);
    }
    return { a, beats, marks };
  }
  // a parada define a cena do trailer e a etapa do "como funciona": a última já passada
  const tag = (list, y) => Math.max(0, list.filter(v => v <= y).length - 1);
  let stage = 0;
  function show(y, { beats, marks }, first) {
    const to = tag(beats, y), st = tag(marks, y);
    if (first || to !== scene) cut(to, first ? null : scene);
    if (first || st !== stage) setStage(stage = st);
  }
  const pick = trava(stops, show);

  // 5. Serviços: um aberto por vez.
  const svs = [...document.querySelectorAll('.sv')];
  svs.forEach(li => li.querySelector('.sv-row').addEventListener('click', () => {
    svs.forEach(o => { const on = o === li && !o.classList.contains('is-on'); o.classList.toggle('is-on', on); o.querySelector('.sv-row').setAttribute('aria-expanded', String(on)); });
    setTimeout(schedule, 750);
  }));

  // 6. Qual é o seu ramo?
  const tabs = [...document.querySelectorAll('.rm-tabs button')];
  const rmPanels = [...document.querySelectorAll('.rm-panel')];
  function rm(i) {
    tabs.forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    rmPanels.forEach((p, k) => { p.hidden = k !== i; });
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => rm(i));
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { const k = (i + d + tabs.length) % tabs.length; rm(k); tabs[k].focus(); e.preventDefault(); }
    });
  });

  // Parceiros: um depoimento por vez, escolhido pelo logo.
  const pqTabs = [...document.querySelectorAll('.pq-tabs button')], pqQuotes = [...document.querySelectorAll('.pq-quote')];
  const pq = i => { pqTabs.forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; }); pqQuotes.forEach((p, k) => { p.hidden = k !== i; }); };
  pqTabs.forEach((b, i) => {
    b.addEventListener('click', () => pq(i));
    b.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0; if (d) { const k = (i + d + pqTabs.length) % pqTabs.length; pq(k); pqTabs[k].focus(); e.preventDefault(); } });
  });

  // 7. O pedido em uma frase: a frase vira a primeira mensagem.
  const cm = ['#cm-ramo', '#cm-uf', '#cm-fazer'].map($), wa = $('#cm-wa');
  const compose = () => {
    const [r, u, f] = cm.map(s => s.value);
    wa.href = 'https://wa.me/5511993287070?text=' + encodeURIComponent(`Olá! Eu sou do ramo ${r} e preciso de técnicos em ${u} para ${f}.`);
  };
  // Cada seleção ganha a largura do texto escolhido (field-sizing ainda não existe em todo navegador).
  const meter = document.createElement('span');
  meter.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:inherit;letter-spacing:inherit';
  const fitSel = s => {
    if (innerWidth <= 700) { s.style.width = ''; return; }
    const cs = getComputedStyle(s); meter.style.font = cs.font; meter.style.letterSpacing = cs.letterSpacing;
    meter.textContent = s.selectedOptions[0].text; s.parentNode.append(meter);
    s.style.width = Math.ceil(meter.getBoundingClientRect().width + parseFloat(cs.paddingLeft) * 2 + 8) + 'px'; meter.remove();
  };
  cm.forEach(s => { s.addEventListener('change', () => fitSel(s)); fitSel(s); });
  addEventListener('resize', () => cm.forEach(fitSel));
  document.fonts?.ready.then(() => cm.forEach(fitSel));
  cm.forEach(s => s.addEventListener('change', compose));
  compose();

  function frame() {
    queued = false;
    scenesFrame();
    pick();
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  }
  function mode() {
    root.classList.toggle('still', still());
    cta.tabIndex = still() || scene === last ? 0 : -1; // sem movimento, todas as cenas ficam à vista
    schedule();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduce.addEventListener('change', mode);
  new MutationObserver(mode).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  mode();
})();
