/* Home: a página anda de parada em parada (trava.js); cada parada define a cena do trailer e a etapa do
   "como funciona". html.still = movimento reduzido ou "Pausar animações": sem trava. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduce.matches || root.dataset.motion === 'paused';
  let queued = false;

  // Celular do Horus: desenhado em largura fixa (data-w) e escalado para o espaço disponível.
  const fit = new ResizeObserver(entries => entries.forEach(e =>
    e.target.style.setProperty('--s', e.contentRect.width / e.target.dataset.w)));
  document.querySelectorAll('.hx-fit').forEach(el => fit.observe(el));

  // 1. Hero, o trailer: uma tela de rolagem por cena; entre cenas, um corte de cinema.
  const story = document.querySelector('.hm-story');
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

  // 2. Cobertura: uma tela só, uma parada; o mapa acende e aproxima ao chegar (mapa-3d.js).

  // 3. Como funciona: uma parada da trava por etapa, com a etapa no meio da tela; a etapa da vez comanda o painel.
  const steps = [...document.querySelectorAll('.hm-step')];
  const panels = [...document.querySelectorAll('.hm-panel')];
  const line = [...document.querySelectorAll('.hm-line li')];
  const status = document.querySelector('[data-flow-status]');
  const device = document.querySelector('.hm-flow-device');
  const stacked = matchMedia('(max-width: 900px)'); // mesmo corte do home.css
  const STATUS = ['Escopo recebido', 'Técnico designado', 'Em execução', 'Relatório disponível'];
  function setStage(n) {
    steps.forEach((s, i) => s.classList.toggle('is-on', i === n));
    panels.forEach((p, i) => p.classList.toggle('is-on', i === n));
    line.forEach((li, i) => li.classList.toggle('done', i <= n));
    status.textContent = STATUS[n];
  }

  // Trava de rolagem da página toda (trava.js). Paradas: o topo, cada cena do trailer, o início de cada seção, cada
  // etapa do "como funciona" e o fim; um trecho mais alto que a tela ganha paradas intermediárias, para nada ficar
  // sem ser visto. O corte do trailer começa no mesmo instante do deslize.
  const blocks = [...document.querySelectorAll('main > section')];
  const strip = document.querySelector('.service-strip');
  function stops() {
    const h = innerHeight, end = root.scrollHeight - h;
    const fit = y => Math.round(Math.min(end, Math.max(0, y)));
    const top = el => el.getBoundingClientRect().top + scrollY;
    const unit = story.offsetHeight / shots.length;
    const beats = shots.map((_, i) => fit(top(story) + i * unit));
    // No celular o painel fica preso em cima: a etapa se alinha ao meio da área livre abaixo dele.
    const mid = stacked.matches ? (parseFloat(getComputedStyle(device).top) + device.offsetHeight + h) / 2 : h / 2;
    const marks = steps.map(s => fit(top(s) + s.offsetHeight / 2 - mid));
    // Início de cada seção, onde o link do menu leva (scroll-margin-top incluso), e o fim: essas nunca saem,
    // senão o link cai fora da parada e a trava leva para outro lugar.
    const pins = new Set([0, end, ...blocks.map(s => fit(top(s) - parseFloat(getComputedStyle(s).scrollMarginTop)))]);
    const held = [beats[0], fit(top(strip.nextElementSibling))]; // o trailer vai direto à cobertura, a faixa só passa
    // [data-stop]: bloco com parada própria quando não cabe inteiro na tela a partir da parada de cima (celular)
    const solo = new Map([...document.querySelectorAll('[data-stop]')].map(el =>
      [fit(top(el) - parseFloat(getComputedStyle(el).scrollMarginTop)), top(el) + el.offsetHeight]));
    const a = [];
    for (const y of [...pins, ...beats, ...marks, ...solo.keys()].sort((p, q) => p - q)) {
      if (solo.get(y) <= a.at(-1) + h * 1.1) continue;
      if (y - a.at(-1) < h * .3) { // quase iguais: fica a de cima, salvo início de seção e fim
        if (!pins.has(y) || y - a.at(-1) < 3) continue;
        if (y === end && !pins.has(a.at(-1))) a.pop();
      }
      const prev = a.at(-1), gap = y - prev;
      // intermediárias só quando sobra mais de 20% da tela sem ser vista entre uma parada e outra
      if (gap > h * 1.2 && !(prev >= held[0] && y <= held[1]))
        for (let n = Math.ceil(gap / (h * .92)), i = 1; i < n; i++) a.push(Math.round(prev + gap * i / n));
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

  // 4. Setores: botões para quem não tem rolagem horizontal (mouse); toque e trackpad usam a rolagem nativa.
  const rail = document.querySelector('.hm-rail');
  const [prev, next] = document.querySelectorAll('[data-rail]');
  const edges = () => {
    prev.disabled = rail.scrollLeft < 8;
    next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
  };
  [prev, next].forEach(b => b.addEventListener('click', () =>
    rail.scrollBy({ left: Number(b.dataset.rail) * rail.clientWidth * .8, behavior: still() ? 'auto' : 'smooth' })));
  rail.addEventListener('scroll', edges, { passive: true });
  edges();

  function frame() {
    queued = false;
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
  addEventListener('resize', () => { edges(); schedule(); });
  reduce.addEventListener('change', mode);
  new MutationObserver(mode).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  mode();
})();
