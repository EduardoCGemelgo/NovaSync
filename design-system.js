(function () {
  var toggle = document.querySelector('[data-sidebar-toggle]');
  var sidebar = document.querySelector('[data-section-sidebar]');
  if (!toggle || !sidebar) return;

  var isSubPage = !document.querySelector('.hero');
  var baseHref = isSubPage ? 'https://nova-sync.net/' : '';

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

  navigation.forEach(function (item) {
    var link = document.createElement('a');
    link.href = baseHref + '#' + item[1];
    link.textContent = item[0];
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

  var footer = document.querySelector('footer .foot');
  var footerLinks = footer ? footer.querySelectorAll('a') : [];
  if (footer && footerLinks.length > 1) {
    var registration = document.createElement('span');
    registration.textContent = 'CNPJ: 62.718.285/0001-58';
    footer.insertBefore(registration, footerLinks[0]);
    footer.removeChild(footerLinks[footerLinks.length - 1]);
  }

  var hero = document.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      sidebar.classList.toggle('is-visible', !entries[0].isIntersecting);
    }).observe(hero);
  } else if (isSubPage) {
    sidebar.classList.add('is-visible');
  }
}());
