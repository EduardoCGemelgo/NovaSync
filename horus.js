/* Horus: só o painel de chamados simulado. O resto (cenas, trava, painéis, circuito) vem do kx.js. */
(() => {
  const { reduce, $ } = kx;
  const hm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  // Chamados do painel: local, problema e estado inicial (ab aberto, al designado, at em atendimento, pe aguardando peça, fi finalizado)
  const EQ = [
    ['Loja 214 · Pinheiros', 'PDV 03 não liga', 'at', ['ok', 'No prazo']],
    ['Unidade Centro · Campinas', 'Troca de switch', 'al', ['am', 'Vence hoje']],
    ['Clínica Vila Mariana', 'Impressora de etiquetas', 'ab', ['ok', 'No prazo']],
    ['Loja 108 · Moema', 'Instalação de PDV', 'fi', ['ok', 'No prazo']],
    ['CD Barueri', 'Coletor sem rede', 'pe', ['ex', 'Excedido']],
    ['Agência Centro', 'Totem de senha', 'fi', ['ok', 'No prazo']],
    ['Datacenter SP', 'Troca de fonte do rack', 'fi', ['ok', 'No prazo']],
    ['CD Cajamar', 'Câmera do dock', 'at', ['ok', 'No prazo']],
  ];
  const LABEL = { ab: 'Aberto', al: 'Técnico designado', at: 'Em atendimento', co: 'Atendimento concluído', fi: 'Finalizado', pe: 'Aguardando peça' };
  const PROBLEMAS = ['Impressora sem papel e sem rede', 'Leitor de código sem resposta', 'Tela do terminal apagada', 'Rede sem conexão', 'PDV com erro de impressão'];
  const tiles = $('#live-tiles'), log = $('#live-log'), clock = $('#live-clock'), btn = $('#live-run');
  let now = 8 * 60, numero = 2481, running = false;
  const els = EQ.map(([local, prob, s, [k, txt]], i) => {
    const li = document.createElement('li');
    li.className = 'kx-tile';
    li.innerHTML = `<strong>${local}</strong><small>CH-${2481 - i} · ${prob}</small><em></em><span class="sla ${k}">${txt}</span>`;
    tiles.append(li);
    return li;
  });
  const setS = (i, s, sla) => {
    els[i].dataset.s = s;
    els[i].querySelector('em').textContent = LABEL[s];
    if (sla) { const b = els[i].querySelector('.sla'); b.className = `sla ${sla[0]}`; b.textContent = sla[1]; }
  };
  EQ.forEach(([, , s], i) => setS(i, s));
  const say = (txt, cls = '') => {
    const li = document.createElement('li');
    li.className = cls;
    li.innerHTML = `<b>${hm(now)}</b>${txt}`;
    log.append(li);
    while (log.children.length > 6) log.firstChild.remove();
  };
  const wait = ms => new Promise(r => setTimeout(r, reduce.matches ? 0 : ms));
  const tick = () => { clock.textContent = hm(now); };
  let uso = 0;
  async function abrir() {
    if (running) return;
    running = true; btn.disabled = true;
    const livres = els.map((_, i) => i).filter(i => els[i].dataset.s === 'fi' && els[i].offsetParent); // só os que aparecem (no celular são 4)
    const i = livres[Math.floor(Math.random() * livres.length)];
    const c = ++numero, [local] = EQ[i], prob = PROBLEMAS[uso++ % PROBLEMAS.length];
    els[i].querySelector('small').textContent = `CH-${c} · ${prob}`;
    now += 6; tick(); setS(i, 'ab', ['ok', 'No prazo']); say(`CH-${c} aberto em ${local}. Prazo: 2 dias úteis.`, 'bad');
    await wait(1500);
    now += 18; tick(); setS(i, 'al'); say(`Técnico da região designado para CH-${c}. Visita agendada.`);
    await wait(1600);
    now += 140; tick(); setS(i, 'at'); say(`Check-in no local. CH-${c} em atendimento.`);
    await wait(1600);
    now += 55; tick(); setS(i, 'co'); say(`Atendimento concluído. RAT-${c}.pdf anexado ao chamado.`);
    await wait(1600);
    now += 20; tick(); setS(i, 'fi'); say(`CH-${c} finalizado dentro do prazo.`, 'ok');
    running = false; btn.disabled = false;
  }
  btn.addEventListener('click', abrir);
  say(`Horus acompanhando ${els.filter(e => e.offsetParent).length} chamados. Prazos à vista.`, 'ok');
  tick();
  // sozinho, a cada ~11 s, enquanto o painel estiver na tela (parado se a pessoa prefere menos movimento)
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .4 }).observe($('.kx-board'));
  if (!reduce.matches) setInterval(() => { if (visible && !running && !document.hidden) abrir(); }, 11000);
})();
