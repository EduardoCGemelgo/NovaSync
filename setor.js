/* Páginas de setor: o simulador "abra um chamado" e o leve deslize da foto. Tudo no navegador; nada é enviado
   até a pessoa clicar no botão do WhatsApp. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = s => document.querySelector(s);

  // A foto desliza mais devagar que o texto.
  const imgs = [...document.querySelectorAll('.st-photo img')];
  if (imgs.length && !reduce.matches) {
    let q = false;
    addEventListener('scroll', () => {
      if (q) return; q = true;
      requestAnimationFrame(() => { q = false; imgs.forEach(img => { img.style.transform = `translateY(${Math.min(scrollY, 1600) * -.04}px)`; }); });
    }, { passive: true });
  }

  const form = $('#sim');
  if (!form) return;
  const ch = $('#sim-ch');
  const WA = 'https://wa.me/5511993287070?text=';
  // Feriados nacionais (o prazo do Horus pula fim de semana e feriado nacional).
  const FERIADOS = new Set(['2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25', '2027-01-01', '2027-03-26', '2027-04-21', '2027-05-01', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25']);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function somaUteis(de, n) {
    const d = new Date(de);
    while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 && !FERIADOS.has(iso(d))) n--; }
    return d;
  }
  const dia = d => d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  const val = n => form.querySelector(`input[name="${n}"]:checked`)?.value || '';
  const ph = t => `<span class="ph">${t}</span>`;
  let animou = false, timers = [];

  function render() {
    const o = val('o'), q = val('q'), n = val('n'), uf = $('#sim-uf').value;
    const pronto = o && q && n && uf;
    const prazo = dia(somaUteis(new Date(), 2));
    const numero = 2481 + Math.floor(Date.now() / 864e5) % 400;
    ch.querySelector('[data-t]').innerHTML = o ? `${o}<br />parou ${q ? q.toLowerCase() : ph("quando?")}.` : ph('Escolha o que parou.');
    ch.querySelector('[data-local]').innerHTML = uf || n ? `${uf || ph('estado')} · ${n ? n + (n === '1' ? ' unidade' : ' unidades') : ph('unidades')}` : ph('estado e unidades');
    ch.querySelector('[data-prazo]').innerHTML = pronto ? `até ${prazo}` : ph('2 dias úteis a partir da abertura');
    ch.querySelector('[data-tec]').innerHTML = uf ? `da região de ${uf}, designado na abertura` : ph('da sua região');
    ch.querySelector('[data-num]').textContent = pronto ? `CH-${numero}` : 'CH-····';
    const pill = ch.querySelector('.st-pill');
    pill.classList.toggle('is-on', !!pronto);
    pill.textContent = pronto ? 'Aberto' : 'Rascunho';
    const msg = `Olá! Montei um chamado de teste no site da NovaSync (${form.dataset.setor}): ${o || "equipamento"} parou ${q ? q.toLowerCase() : ""}, ${n || '?'} unidade(s) em ${uf || 'meu estado'}. Quero que a equipe me ajude a atender.`;
    const wa = ch.querySelector('[data-wa]');
    wa.href = WA + encodeURIComponent(msg);
    wa.setAttribute('aria-disabled', String(!pronto));
    wa.tabIndex = pronto ? 0 : -1;
    const steps = [...ch.querySelectorAll('.ch-line li')];
    timers.forEach(clearTimeout); timers = [];
    steps.forEach(s => s.classList.remove('done', 'now'));
    if (!pronto) { animou = false; return; }
    // o ciclo anda sozinho uma vez: aberto, designado, em atendimento, relatório
    steps.forEach((s, i) => timers.push(setTimeout(() => {
      steps.forEach((x, k) => { x.classList.toggle('done', k <= i); x.classList.toggle('now', k === i && i < steps.length - 1); });
    }, reduce.matches ? 0 : 450 + i * 750)));
  }
  form.addEventListener('change', render);
  render();
})();
