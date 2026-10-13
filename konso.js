/* Konso: a rolagem conduz cada cena via --p (0 a 1); a trava (trava.js) anda de parada em parada. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.min(1, Math.max(0, n));
  const $ = s => document.querySelector(s);
  const scenes = [...document.querySelectorAll('[data-scene]')];

  const hm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  // Frase palavra por palavra: cada palavra ganha seu índice --i.
  const words = $('.kx-words');
  const list = words.textContent.trim().split(/\s+/);
  words.replaceChildren(...list.flatMap((w, i) => {
    const s = document.createElement('span');
    s.textContent = w;
    s.style.setProperty('--i', i);
    return [s, ' '];
  }));
  words.style.setProperty('--n', list.length);

  // Vídeo avança com a rolagem (quadro-chave em todo quadro: a busca é instantânea).
  const video = $('.kx-statement video');
  const vScene = video.closest('[data-scene]');
  video.play().then(() => video.pause()).catch(() => {}); // iOS só entrega quadros depois de um play
  function scrub() {
    if (reduce.matches || !video.duration) return;
    const t = Number(vScene.style.getPropertyValue('--p')) * (video.duration - .05);
    if (Math.abs(video.currentTime - t) > 1 / 48) video.currentTime = t;
  }
  video.addEventListener('loadedmetadata', scrub);

  // Circuito: etapa pela posição da cena (cinco faixas iguais).
  const circuit = $('.kx-circuit');
  const nodes = [...document.querySelectorAll('.kx-nodes li')];
  const details = [...document.querySelectorAll('.kx-detail article')];
  let stage = 0;
  function setStage(n) {
    if (n === stage) return;
    stage = n;
    nodes.forEach((li, i) => { li.classList.toggle('is-on', i === n - 1); li.classList.toggle('is-done', i < n - 1); });
    details.forEach((d, i) => d.classList.toggle('is-on', i === n - 1));
  }

  // A noite inteira: o relógio anda entre os horários dos eventos; cada evento tem seu trecho de vídeo (carrega ao chegar perto).
  const night = $('.kx-night');
  const layers = [...night.querySelectorAll('.kx-layers>*')];
  const evs = [...night.querySelectorAll('[data-ev]')];
  const T = [18 * 60, 20 * 60, 22 * 60, 24 * 60, 26 * 60 + 14, 28 * 60, 30 * 60 + 48, 32 * 60];
  const RUIDO = [0, 2, 13, 13, 13, 13, 13, 13], CHAM = [0, 0, 0, 0, 1, 1, 1, 1];
  const fmt = n => n.toLocaleString('pt-BR');
  let nStage = -1;
  function setNight(p) {
    const f = Math.min(7, Math.max(0, p * 8 - .5)), i = Math.min(6, Math.floor(f));
    $('#noite-clock').textContent = hm(Math.round(T[i] + (T[i + 1] - T[i]) * (f - i)));
    $('#m-sinais').textContent = fmt(Math.round(p * 41280));
    const n = Math.min(7, Math.max(0, Math.floor(p * 8)));
    if (n === nStage) return;
    nStage = n;
    $('#m-ruido').textContent = RUIDO[n]; $('#m-chamados').textContent = CHAM[n];
    evs.forEach((e, k) => e.classList.toggle('is-on', k === n));
    layers.forEach((el, k) => {
      el.classList.toggle('is-on', k === n);
      if (el.tagName !== 'VIDEO') return;
      if (Math.abs(k - n) <= 1 && !el.src && el.dataset.src) el.src = el.dataset.src; // só o atual e o vizinho
      if (k === n) el.play().catch(() => {}); else el.pause();
    });
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
    const cp = Number(circuit.style.getPropertyValue('--p'));
    setStage(reduce.matches ? 5 : Math.min(5, Math.max(1, Math.floor(cp * 5) + 1)));
    setNight(reduce.matches ? 0 : Number(night.style.getPropertyValue('--p')));
    scrub();
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

  // Trava de rolagem (trava.js). Paradas: o topo, os pontos de cada cena presa (data-stops, fração do trecho preso),
  // o início das outras seções e o fim. Trecho livre maior que a tela ganha paradas intermediárias.
  const root = document.documentElement;
  const blocks = [...document.querySelectorAll('main > section:not([data-scene])')];
  trava(() => {
    const h = innerHeight, end = root.scrollHeight - h;
    const fit = y => Math.round(Math.min(end, Math.max(0, y)));
    const top = el => el.getBoundingClientRect().top + scrollY;
    const holds = scenes.map(el => [top(el), top(el) + el.offsetHeight - h]);
    const beats = scenes.flatMap((el, i) => el.dataset.stops.split(' ').map(p => fit(holds[i][0] + p * (holds[i][1] - holds[i][0]))));
    // início de cada bloco e, nos blocos mais altos que a tela, também o fim dele (senão o rodapé do bloco nunca aparece);
    // no celular o menu fixo cobre o topo, então a área útil começa abaixo dele
    const navH = innerWidth <= 900 ? $('.nav').offsetHeight + 16 : 0;
    const pins = new Set([0, end, ...blocks.flatMap(s => {
      const t = top(s) - navH, extra = s.offsetHeight - (h - navH);
      return extra > h * .3 ? [fit(t), fit(t + extra)] : [fit(navH ? t + extra / 2 : t + Math.max(0, extra) / 2)]; // cabe (ou quase): uma parada só
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
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduce.addEventListener('change', schedule);
  frame();

  // S.03: quanto tempo o equipamento fica parado sem ninguém ver, comparado ao Konso (tolerância 5 min + varredura 2 min).
  const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  const KONSO_MIN = 7, ABRE = 8, FECHA = 18;
  const dur = m => m >= 60 ? `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}min` : `${Math.round(m)} min`;
  const slider = $('#hora-slider');
  function hora() {
    const w = Number(slider.value) * 60;                 // minutos desde segunda 00:00
    const d = Math.floor(w / 1440), t = w % 1440;
    $('#hora-quando').textContent = `${DIAS[d]}, ${hm(t)}`;
    const util = d < 5 && t >= ABRE * 60 && t < FECHA * 60;
    let gap = 0, quando = '';
    if (!util) {
      let dia = d + (d < 5 && t >= FECHA * 60 ? 1 : 0);  // depois das 18h: dia seguinte
      if (dia > 4) dia = 7;                              // sexta à noite e fim de semana: segunda
      gap = dia * 1440 + ABRE * 60 - w;
      quando = `${DIAS[dia % 7]} às ${hm(ABRE * 60)}`;
    }
    $('#hora-sem').textContent = util ? 'Dentro do expediente: alguém pode ver' : `${dur(gap)} parado até alguém ver`;
    $('#hora-sem-txt').textContent = util
      ? 'Com sorte alguém percebe logo. Sem registro automático, a hora real da falha e do prazo fica na memória de quem viu.'
      : `A operação só volta ${quando} e o chamado abre depois disso.`;
    $('#hora-com-txt').textContent = util
      ? 'Chamado aberto com a hora exata da falha, o prazo de 2 dias úteis contando e o histórico do sinal registrado.'
      : 'O prazo de 2 dias úteis já está contando, o histórico do sinal fica registrado e o técnico da região é designado na abertura do dia útil.';
    const max = 62 * 60;
    $('#hora-bar-sem').style.width = `${Math.max(2, Math.min(100, gap / max * 100))}%`;
    $('#hora-bar-com').style.width = `${Math.max(2, KONSO_MIN / max * 100)}%`;
  }
  slider.addEventListener('input', hora);
  hora();

  // S.03: painéis. Um aberto por vez; a lanterna segue o ponteiro; troca sozinho enquanto ninguém mexe.
  const panels = [...document.querySelectorAll('.kx-panel')];
  let auto = true, cur = 0;
  function openPanel(i) {
    cur = i;
    panels.forEach((el, k) => { el.classList.toggle('is-on', k === i); el.querySelector('.kx-panel-tab').setAttribute('aria-expanded', String(k === i)); });
  }
  panels.forEach((el, k) => {
    el.addEventListener('click', () => { auto = false; openPanel(k); });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
  let panelsSeen = false;
  new IntersectionObserver(([e]) => { panelsSeen = e.isIntersecting; }, { threshold: .5 }).observe($('#panels'));
  if (!reduce.matches) setInterval(() => { if (auto && panelsSeen && !document.hidden) openPanel((cur + 1) % panels.length); }, 5500);

  // Números do vigia contam ao entrar na tela.
  const countIO = new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return;
    o.unobserve(e.target);
    const to = Number(e.target.dataset.count);
    if (reduce.matches) return;
    const t0 = performance.now();
    requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - t0) / 1400);
      e.target.textContent = Math.round(to * (1 - (1 - t) ** 3));
      if (t < 1) requestAnimationFrame(step);
    });
  }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(c => { if (!reduce.matches) c.textContent = '0'; countIO.observe(c); });

  // Vídeos de fundo (painel, amanhecer): carregam e tocam só perto da tela.
  document.querySelectorAll('video[data-src]').forEach(v => {
    if (v.closest('.kx-layers')) return;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; if (!reduce.matches) v.play().catch(() => {}); } else v.pause();
    }, { rootMargin: '200px' }).observe(v);
  });

  // S.05: painel simulado. Estados: ok, tol (tolerância), bad (chamado aberto), tec (técnico designado), val (validando).
  const EQ = [
    ['PDV 03', 'Loja 214 · Pinheiros'], ['Switch core', 'CD Barueri'], ['Totem de senha', 'Agência Centro'], ['Impressora de etiquetas', 'Clínica Vila Mariana'],
    ['Coletor 07', 'CD Barueri'], ['Rack 02', 'Datacenter SP'], ['Câmera do dock', 'CD Cajamar'], ['Nobreak', 'Loja 108 · Moema'],
  ];
  const LABEL = { ok: 'Online', tol: 'Tolerância 5 min', bad: 'Chamado aberto', tec: 'Técnico designado', val: 'Validando' };
  const tiles = $('#live-tiles'), log = $('#live-log'), clock = $('#live-clock'), btn = $('#live-run');
  const els = EQ.map(([n, l]) => {
    const li = document.createElement('li');
    li.className = 'kx-tile';
    li.innerHTML = `<strong>${n}</strong><small>${l}</small><em></em>`;
    tiles.append(li);
    return li;
  });
  let now = 2 * 60, chamado = 2480, running = false;
  const setS = (i, s) => { els[i].dataset.s = s; els[i].querySelector('em').textContent = LABEL[s]; };
  els.forEach((_, i) => setS(i, 'ok'));
  const say = (txt, cls = '') => {
    const li = document.createElement('li');
    li.className = cls;
    li.innerHTML = `<b>${hm(now)}</b>${txt}`;
    log.append(li);
    while (log.children.length > 6) log.firstChild.remove();
  };
  const tick = () => { clock.textContent = hm(now); };
  const wait = ms => new Promise(r => setTimeout(r, reduce.matches ? 0 : ms));
  async function queda() {
    if (running) return;
    running = true; btn.disabled = true;
    const livres = els.map((_, i) => i).filter(i => els[i].dataset.s === 'ok' && els[i].offsetParent); // só os que aparecem (no celular são 4)
    const i = livres[Math.floor(Math.random() * livres.length)];
    const nome = `${EQ[i][0]} · ${EQ[i][1]}`;
    now += 7; tick(); setS(i, 'tol'); say(`${nome} sem sinal. Aguardando a tolerância.`, 'bad');
    await wait(1600);
    now += 5; tick(); setS(i, 'bad'); const c = ++chamado; say(`Chamado CH-${c} aberto no Horus. Prazo: 2 dias úteis.`, 'bad');
    await wait(1700);
    now += 2; tick(); setS(i, 'tec'); say(`Técnico da região designado para CH-${c}.`);
    await wait(1700);
    now += 330; tick(); setS(i, 'val'); say(`Sinal de ${EQ[i][0]} voltou. Aguardando o responsável no local.`);
    await wait(1700);
    now += 6; tick(); setS(i, 'ok'); say(`CH-${c} finalizado: sinal normal e confirmação do responsável.`, 'ok');
    running = false; btn.disabled = false;
  }
  btn.addEventListener('click', queda);
  say(`Konso vigiando ${els.filter(e => e.offsetParent).length} equipamentos. Nenhum alerta.`, 'ok');
  // sozinho, a cada ~11 s, enquanto o painel estiver na tela (parado se a pessoa prefere menos movimento)
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .4 }).observe($('.kx-board'));
  if (!reduce.matches) setInterval(() => { if (visible && !running && !document.hidden) queda(); }, 11000);
  tick();
})();
