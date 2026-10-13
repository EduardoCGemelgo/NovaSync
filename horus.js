/* Horus: a rolagem conduz cada cena via --p (0 a 1); a trava (trava.js) anda de parada em parada. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.min(1, Math.max(0, n));
  const scenes = [...document.querySelectorAll('[data-scene]')];

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
  const video = document.querySelector('.hx-statement video');
  const vScene = video.closest('[data-scene]');
  video.play().then(() => video.pause()).catch(() => {}); // iOS só entrega quadros depois de um play
  function scrub() {
    if (reduce.matches || !video.duration) return;
    const t = Number(vScene.style.getPropertyValue('--p')) * (video.duration - .05);
    if (Math.abs(video.currentTime - t) > 1 / 48) video.currentTime = t;
  }
  video.addEventListener('loadedmetadata', scrub);

  // "O técnico já foi?": a conversa cresce com a rolagem; no fim o Horus responde (--h = 0 a 1).
  const chat = document.querySelector('.hx-chat');
  const chatN = document.getElementById('chat-n');
  function setChat() {
    const p = Number(chat.style.getPropertyValue('--p'));
    chat.style.setProperty('--h', clamp((p - .82) / .16).toFixed(3));
    chatN.textContent = Math.min(7, Math.max(0, Math.floor(p * 8.6)));
  }

  // "Dois lados, um chamado": a etapa decide o que aparece na tela da empresa, no celular e na legenda.
  const duo = document.querySelector('.hx-duo');
  const shows = [...duo.querySelectorAll('[data-show]')].map(el => [el, el.dataset.show.split(' ')]);
  let stage = 0;
  function setDuo() {
    const p = Number(duo.style.getPropertyValue('--p'));
    const n = reduce.matches ? 5 : Math.min(5, Math.max(1, Math.floor(p * 5) + 1));
    if (n === stage) return;
    const prev = stage;
    stage = n;
    shows.forEach(([el, ns]) => el.classList.toggle('is-on', ns.includes(String(n))));
    duo.dataset.dir = '';
    void duo.offsetWidth; // reinicia a animação do fio entre as telas
    if (prev && !reduce.matches) duo.dataset.dir = n === 2 ? 'to' : n > 2 ? 'from' : '';
  }

  // "Telas reais": a parada (0 a 8) acende a tela, a legenda e os destaques; o modo move a câmera entre notebook, celular e relatório.
  // O mouse inclina o conjunto (--mx, --my) e a rolagem inclina junto (--p).
  const tour = document.querySelector('.hx-tour');
  const tourShows = [...tour.querySelectorAll('[data-show]')];
  const tourDots = [...tour.querySelectorAll('.tr-dots li')];
  let beat = -1;
  function setTour() {
    const n = reduce.matches ? 0 : Math.round(Number(tour.style.getPropertyValue('--p')) * 8);
    if (n === beat) return;
    beat = n;
    tourShows.forEach(el => el.classList.toggle('is-on', el.dataset.show.split(' ').includes(String(n))));
    tourDots.forEach((el, i) => el.classList.toggle('is-on', i === n));
    tour.dataset.mode = n >= 2 && n <= 6 ? 'phone' : n === 7 ? 'report' : 'desk';
  }
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    tour.addEventListener('pointermove', e => {
      if (reduce.matches) return;
      tour.style.setProperty('--mx', (e.clientX / innerWidth * 2 - 1).toFixed(3));
      tour.style.setProperty('--my', (e.clientY / innerHeight * 2 - 1).toFixed(3));
    });
    tour.addEventListener('pointerleave', () => { tour.style.setProperty('--mx', 0); tour.style.setProperty('--my', 0); });
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
    setChat();
    setDuo();
    setTour();
    scrub();
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

  // Trava de rolagem (trava.js). Paradas: o topo, os pontos de cada cena presa (data-stops, fração do trecho preso:
  // a cena toca inteira durante o deslize), o início das outras seções e o fim.
  // Um trecho que rola mais que a tela ganha paradas intermediárias; dentro de uma cena presa não, a tela não troca.
  const root = document.documentElement;
  const blocks = [...document.querySelectorAll('main > section:not([data-scene])')];
  trava(() => {
    const h = innerHeight, end = root.scrollHeight - h;
    const fitY = y => Math.round(Math.min(end, Math.max(0, y)));
    const top = el => el.getBoundingClientRect().top + scrollY;
    const holds = scenes.map(el => [top(el), top(el) + el.offsetHeight - h]);
    const beats = scenes.flatMap((el, i) => el.dataset.stops.split(' ').map(p => fitY(holds[i][0] + p * (holds[i][1] - holds[i][0]))));
    // início de seção (onde o link leva) e fim nunca saem, senão o link cai fora da parada
    const pins = new Set([0, end, ...blocks.map(s => fitY(top(s) - parseFloat(getComputedStyle(s).scrollMarginTop)))]);
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
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduce.addEventListener('change', schedule);
  frame();
})();
