// Menu lateral: trilho de pontos com as seções da página + gaveta com o mapa do site. Tudo montado aqui, igual em todas as páginas.
(() => {
  const main = document.getElementById('conteudo') || document.querySelector('main');
  if (!main) return;
  const PAGES = [['index.html', 'Início'], ['horus.html', 'Horus'], ['konso.html', 'Konso'], ['empresas-de-field-service.html', 'Guia de field service'], ['sobre.html', 'Quem somos']];
  const SETORES = [['varejo', 'Varejo'], ['bancos', 'Bancos'], ['saude', 'Saúde'], ['industria', 'Indústria'], ['telecom', 'Telecom'], ['transporte', 'Transporte'], ['eventos', 'Eventos']];
  const NAMES = {
    'cobertura': 'Cobertura', 'servicos': 'O que fazemos', 'como-funciona': 'Como funciona', 'horus': 'Horus', 'setores': 'Setores', 'parceiros': 'Parceiros', 'cadastro-tecnico': 'Cadastro técnico', 'sobre': 'Sobre', 'contato': 'Contato', 'faq': 'FAQ',
    'como-e-hoje': 'Como é hoje', 'o-tecnico-ja-foi': 'O técnico já foi?', 'quando-ninguem-sabe': 'Quando ninguém sabe', 'um-so-lugar': 'Um só lugar', 'dois-lados': 'Etapas do chamado', 'telas-reais': 'Telas reais', 'prazo-a-vista': 'Prazo à vista', 'onde': 'Onde atende',
    'situacao': 'A situação', 'noite': 'A noite', 'falha': 'A falha', 'hora': 'A hora', 'circuito': 'O circuito', 'ao-vivo': 'Ao vivo', 'sinais': 'Os sinais',
  };
  const cut = t => (t.length > 30 ? t.slice(0, 28).trim() + '…' : t);
  const secs = [...main.querySelectorAll('section')];
  const items = [];
  secs.forEach((s, i) => {
    let label = NAMES[s.id] || (i === 0 && !s.id ? 'Início' : '');
    if (s.id === 'inicio') label = 'Início';
    if (!label) { const h = s.querySelector('h1,h2'); label = h ? cut(h.textContent.replace(/\s+/g, ' ').trim().split(/(?<=[.?!])/)[0].replace(/[.]$/, '')) : ''; }
    if (!label || items.some(x => x.label === label)) return;
    if (!s.id) s.id = 'sec-' + i;
    items.push({ s, label });
  });

  const file = location.pathname.split('/').pop() || 'index.html';
  const isSetor = /^field-service-/.test(file);
  const li = (href, text, cur) => `<li><a href="${href}"${cur ? ' aria-current="page"' : ''}>${text}</a></li>`;

  const panel = document.createElement('aside');
  panel.className = 'sn-panel'; panel.id = 'sn-panel'; panel.setAttribute('aria-label', 'Mapa do site');
  panel.innerHTML = '<button class="sn-close" type="button" aria-label="Fechar mapa">×</button><h2>Neste site</h2><ul>'
    + PAGES.map(([f, t]) => li(f, t, f === file)).join('')
    + `<li><a href="index.html#setores"${isSetor ? ' aria-current="page"' : ''}>Setores</a><ul>${SETORES.map(([k, t]) => li(`field-service-${k}.html`, t, file === `field-service-${k}.html`)).join('')}</ul></li>`
    + li('diagnostico.html', 'Diagnóstico', file === 'diagnostico.html') + '</ul>'
    + (items.length > 1 ? `<h2>Nesta página</h2><ul>${items.map(x => li('#' + x.s.id, x.label)).join('')}</ul>` : '');
  const veil = document.createElement('div'); veil.className = 'sn-veil';
  document.body.append(veil, panel);

  const rail = document.createElement('nav');
  rail.className = 'sn' + (items.length > 1 ? ' has-rail' : '');
  rail.setAttribute('aria-label', 'Seções desta página');
  rail.innerHTML = '<button class="sn-map" type="button" aria-label="Abrir mapa do site" aria-expanded="false" aria-controls="sn-panel"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 4h12M2 8h12M2 12h12"/></svg></button>'
    + items.map(x => `<a class="sn-dot" href="#${x.s.id}" aria-label="${x.label}"><span>${x.label}</span></a>`).join('');
  document.body.append(rail);

  const btn = rail.querySelector('.sn-map');
  const set = open => {
    panel.classList.toggle('open', open); veil.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    if (open) panel.querySelector('.sn-close').focus(); else btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => set(true));
  veil.addEventListener('click', () => set(false));
  panel.querySelector('.sn-close').addEventListener('click', () => set(false));
  panel.addEventListener('click', e => { if (e.target.closest('a')) { panel.classList.remove('open'); veil.classList.remove('open'); } });
  addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) set(false); });

  // onde estou: a última seção cujo topo já passou de 40% da tela
  const dots = [...rail.querySelectorAll('.sn-dot')];
  let q = false, cur = -1;
  const spy = () => {
    q = false;
    let k = 0;
    items.forEach((x, i) => { if (x.s.getBoundingClientRect().top <= innerHeight * .4) k = i; });
    if (k !== cur) { cur = k; dots.forEach((d, i) => d.classList.toggle('is-on', i === k)); }
  };
  addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(spy); } }, { passive: true });
  addEventListener('resize', spy);
  spy();
})();
