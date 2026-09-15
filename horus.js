/* Horus: a rolagem conduz cada cena via --p (0 a 1); a trava (trava.js) anda de parada em parada. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.min(1, Math.max(0, n));
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const steps = [...document.querySelectorAll('.hx-step')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  const line = [...document.querySelectorAll('.case-line li')];
  const pill = document.querySelector('[data-status]');
  const STATUS = [['Aberto', 'ab'], ['Técnico designado', 'al'], ['Em atendimento', 'at'], ['Atendimento concluído', 'co'], ['Finalizado', 'fi']];

  // Frase palavra por palavra: cada palavra ganha seu índice --i.
  const words = document.querySelector('.hx-words');
  const list = words.textContent.trim().split(/\s+/);
  words.replaceChildren(...list.flatMap((w, i) => {
    const s = document.createElement('span');
    s.textContent = w;
    s.style.setProperty('--i', i);
    return [s, ' '];
  }));
  words.style.setProperty('--n', list.length);

  // Mockups desenhados em largura fixa (data-w) e escalados para o espaço disponível.
  const fit = new ResizeObserver(entries => entries.forEach(e =>
    e.target.style.setProperty('--s', e.contentRect.width / e.target.dataset.w)));
  document.querySelectorAll('.hx-fit').forEach(el => fit.observe(el));

  // Vídeo da loja avança com a rolagem (codificado com quadro-chave a cada 2 frames para a busca ser instantânea).
  const video = document.querySelector(".hx-statement video");
  const scene = video.closest("[data-scene]");
  video.play().then(() => video.pause()).catch(() => {}); // iOS só entrega quadros depois de um play
  function scrub() {
    if (reduce.matches || !video.duration) return;
    const t = Number(scene.style.getPropertyValue("--p")) * (video.duration - .05);
    if (Math.abs(video.currentTime - t) > 1 / 48) video.currentTime = t;
  }
  video.addEventListener("loadedmetadata", scrub);

  let stage = 0;
  function setStage(n) {
    if (n === stage) return;
    stage = n;
    steps.forEach((s, i) => s.classList.toggle('is-on', i === n - 1));
    panels.forEach(p => p.classList.toggle('is-on', Number(p.dataset.panel) === n));
    line.forEach((li, i) => li.classList.toggle('done', i < n));
    pill.textContent = STATUS[n - 1][0];
    pill.className = 'st ' + STATUS[n - 1][1];
  }

  let queued = false;
  function frame() {
    queued = false;
    const h = innerHeight;
    for (const el of scenes) {
      const r = el.getBoundingClientRect();
      const p = reduce.matches ? 1 : clamp(-r.top / Math.max(1, r.height - h));
      el.style.setProperty('--p', p.toFixed(4));
    }
    let n = 1;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < h * .6) n = i + 1; });
    setStage(n);
    scrub();
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

  // Trava de rolagem (trava.js). Paradas: o topo, os pontos de cada cena presa (data-stops, fração do trecho preso:
  // a cena toca inteira durante o deslize), o início das outras seções, cada etapa da vida do chamado e o fim.
  // Um trecho que rola mais que a tela ganha paradas intermediárias; dentro de uma cena presa não, a tela não troca.
  const root = document.documentElement;
  const blocks = [...document.querySelectorAll('main > section:not([data-scene])')];
  const device = document.querySelector('.hx-story-device');
  const stacked = matchMedia('(max-width: 900px)'); // mesmo corte do horus.css
  trava(() => {
    const h = innerHeight, end = root.scrollHeight - h;
    const fit = y => Math.round(Math.min(end, Math.max(0, y)));
    const top = el => el.getBoundingClientRect().top + scrollY;
    const holds = scenes.map(el => [top(el), top(el) + el.offsetHeight - h]);
    const beats = scenes.flatMap((el, i) => el.dataset.stops.split(' ').map(p => fit(holds[i][0] + p * (holds[i][1] - holds[i][0]))));
    // No celular o chamado fica preso em cima: a etapa se alinha ao meio da área livre abaixo dele.
    const mid = stacked.matches ? (parseFloat(getComputedStyle(device).top) + device.offsetHeight + h) / 2 : h / 2;
    const marks = steps.map(s => fit(top(s) + s.offsetHeight / 2 - mid));
    // início de seção (onde o link leva) e fim nunca saem, senão o link cai fora da parada
    const pins = new Set([0, end, ...blocks.map(s => fit(top(s) - parseFloat(getComputedStyle(s).scrollMarginTop)))]);
    const a = [0];
    for (const y of [...pins, ...beats, ...marks].sort((p, q) => p - q)) {
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
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduce.addEventListener('change', schedule);
  frame();
})();
