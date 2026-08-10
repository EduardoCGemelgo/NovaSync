(function () {
  var toggle = document.querySelector('[data-sidebar-toggle]');
  var path = window.location.pathname;
  var isHomePage = path === '/' || path === '/index.html' || path === '' || path.endsWith('/index.html');
  var fileName = path.split('/').pop();
  var footerPages = ['', 'index.html', 'field-service-bancos.html', 'field-service-varejo.html', 'field-service-saude.html', 'field-service-telecom.html', 'field-service-industria.html', 'field-service-transporte.html', 'field-service-eventos.html', 'politica-de-privacidade.html'];

  if (footerPages.indexOf(fileName) !== -1) {
    var footer = document.querySelector('footer');
    var homeHref = isHomePage ? '#inicio' : 'index.html#inicio';
    var sectionPrefix = isHomePage ? '#' : 'index.html#';
    if (!footer) {
      footer = document.createElement('footer');
      document.body.appendChild(footer);
    }
    if (footer) {
      footer.innerHTML = '<div class="site-footer-trust"><div class="shell site-footer-trust-inner">' +
        '<p class="site-footer-trust-text">Field Service de TI com técnicos, cobertura nacional e acompanhamento de chamados em uma operação coordenada. <strong>Em conformidade com a LGPD.</strong></p>' +
        '<div class="site-footer-trust-badges"><span class="site-footer-badge">LGPD</span><span class="site-footer-badge">Servidores no Brasil</span></div>' +
        '</div></div>' +
        '<div class="site-footer"><div class="shell site-footer-grid">' +
        '<div class="site-footer-brand"><a class="brand" href="' + homeHref + '" aria-label="NovaSync, início"><img src="logo-star.png" alt="NovaSync" width="36" height="36"></a><p class="site-footer-desc">Field Service de TI com técnicos, cobertura nacional e acompanhamento de chamados em uma operação coordenada.</p><p class="site-footer-cnpj">CNPJ: 62.718.285/0001-58</p></div>' +
        '<nav class="site-footer-col" aria-label="Links institucionais"><h4>NovaSync</h4><ul><li><a href="' + homeHref + '">Home</a></li><li><a href="' + sectionPrefix + 'setores">Setores</a></li><li><a href="' + sectionPrefix + 'recursos">Recursos</a></li><li><a href="' + sectionPrefix + 'cobertura">Cobertura</a></li><li><a href="' + sectionPrefix + 'cost-calculator">Calculadora</a></li><li><a href="' + sectionPrefix + 'faq">FAQ</a></li><li><a href="politica-de-privacidade.html">Política de Privacidade</a></li><li><a href="https://linkedin.com/company/novasync" target="_blank" rel="noopener">LinkedIn</a></li><li><a href="' + sectionPrefix + 'cadastro-tecnico">Seja um Parceiro</a></li></ul></nav>' +
        '<nav class="site-footer-col" aria-label="Soluções Field Service"><h4>Setores</h4><ul><li><a href="field-service-saude.html">Saúde</a></li><li><a href="field-service-bancos.html">Bancos e Fintechs</a></li><li><a href="field-service-varejo.html">Varejo</a></li><li><a href="field-service-transporte.html">Transporte e Mobilidade</a></li><li><a href="field-service-telecom.html">Telecom</a></li><li><a href="field-service-industria.html">Indústria</a></li><li><a href="field-service-eventos.html">Eventos e Operações Temporárias</a></li></ul></nav>' +
        '</div><div class="shell site-footer-copyright"><span>© 2026 NovaSync</span><div class="site-footer-copyright-links"><a href="politica-de-privacidade.html">Política de Privacidade</a><a href="#">Servidores no Brasil</a></div></div></div>';
    }
  }

  if (!toggle) return;

  var baseHref = isHomePage ? '' : 'https://nova-sync.net/';

  var navigation = [
    ['Cobertura', 'cobertura'],
    ['Recursos', 'recursos'],
    ['Benefícios', 'trust-section'],
    ['Calculadora', 'cost-calculator'],
    ['Setores', 'setores'],
    ['Prova social', 'prova-social'],
    ['Como funciona', 'como-funciona'],
    ['FAQ', 'faq'],
    ['Cadastro técnico', 'cadastro-tecnico'],
    ['Contato', 'final-cta']
  ];

  var sidebar = document.querySelector('[data-section-sidebar]');
  if (!sidebar) {
    sidebar = document.createElement('nav');
    sidebar.className = 'section-sidebar';
    sidebar.id = 'section-sidebar';
    sidebar.setAttribute('aria-label', 'Navegação pelas seções');
    sidebar.setAttribute('data-section-sidebar', '');
    document.body.appendChild(sidebar);
  }

  navigation.forEach(function (item) {
    var link = document.createElement('a');
    link.href = baseHref + '#' + item[1];
    var label = document.createElement('span');
    label.textContent = item[0];
    link.appendChild(label);
    sidebar.appendChild(link);
  });

  function setOpen(open) {
    sidebar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar navegação da página' : 'Abrir navegação da página');
  }

  toggle.addEventListener('click', function () {
    setOpen(!sidebar.classList.contains('is-open'));
  });
  sidebar.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setOpen(false);
  });

  var scrollTimer = null;
  window.addEventListener('scroll', function () {
    if (sidebar.classList.contains('is-open')) {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () { setOpen(false); }, 80);
    }
  }, { passive: true });

  if (isHomePage) {
    var hero = document.querySelector('.hero');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var heroVisible = entries[0].isIntersecting;
        sidebar.classList.toggle('is-visible', !heroVisible);
        if (heroVisible) setOpen(false);
      }).observe(hero);
    }
  }
}());
