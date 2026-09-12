/* Scroll drives the story; native scrolling, keyboard and touch remain intact. */
(() => {
  if (!document.body.classList.contains('landing-art')) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const story = document.getElementById('demonstracao');
  const pin = story.querySelector('.demo-pin');
  const bar = story.querySelector('.story-progress');
  const count = document.getElementById('coverage-count');
  const services = [...document.querySelectorAll('.service')];
  const steps = [...document.querySelectorAll('.step[data-step]')];
  const contact = document.getElementById('contato');
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => 1 - (1 - n) ** 3;
  const paused = () => reduce.matches || document.documentElement.dataset.motion === 'paused';
  let scheduled = false, scene = -1, step = -1, countProgress = 0, countFrame = 0;
  let manualAt = null;
  const hint = document.createElement('div');
  hint.className = 'scroll-hint';
  hint.textContent = 'Role para acompanhar o atendimento';
  story.querySelector('.section-head').append(hint);

  function configure() {
    const fits = innerWidth >= 1000 && innerHeight >= 720 && pin.offsetHeight < innerHeight - 130;
    document.body.classList.toggle('scroll-story-enabled', fits && !reduce.matches);
    hint.hidden = reduce.matches;
    document.getElementById('motion-toggle').hidden = reduce.matches;
    schedule();
  }
  function progress(value) {
    bar.style.setProperty('--story-progress', value);
    bar.setAttribute('aria-valuenow', String(Math.round(value * 100)));
  }
  function render() {
    scheduled = false;
    const h = innerHeight;
    if (paused()) {
      cancelAnimationFrame(countFrame); countFrame = 0;
      count.textContent = count.dataset.target;
      services.forEach(el => el.style.setProperty('--service-progress', 1));
      hero.style.setProperty('--hero-shift', '0px');
      hero.style.setProperty('--hero-trace', 1);
      contact.style.setProperty('--contact-shift', '0px');
      return;
    }
    const heroRect = hero.getBoundingClientRect();
    const heroProgress = clamp(-heroRect.top / Math.max(1, heroRect.height * .8));
    hero.style.setProperty('--hero-trace', .12 + .88 * heroProgress);
    hero.style.setProperty('--hero-shift', `${heroProgress * 70}px`);
    const countRect = count.getBoundingClientRect();
    countProgress = Math.max(countProgress, clamp((h * .92 - countRect.top) / (h * .32)));
    if (!countFrame) count.textContent = String(Math.round(Number(count.dataset.target) * ease(countProgress)));
    services.forEach(el => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--service-progress', clamp((h * .85 - r.top) / (h * .5)));
    });
    const r = story.getBoundingClientRect();
    const consoleRect = story.querySelector('.demo-console').getBoundingClientRect();
    const pinned = document.body.classList.contains('scroll-story-enabled');
    const p = pinned
      ? clamp((120 - r.top) / Math.max(1, r.height - pin.offsetHeight - 160))
      : clamp((h * .75 - consoleRect.top) / Math.max(1, consoleRect.height + h * .25));
    if (manualAt !== null && Math.abs(scrollY - manualAt) > 32) manualAt = null;
    if (r.top < h && r.bottom > 0 && manualAt === null) {
      const next = Math.min(2, Math.floor(p * 3));
      if (next !== scene) { selectScene(next); scene = next; }
      progress(p);
    }
    const visible = steps.filter(el => { const b = el.getBoundingClientRect(); return b.top < h * .72 && b.bottom > 100; });
    if (visible.length) {
      const next = Number(visible[visible.length - 1].dataset.step);
      if (next !== step) { document.dispatchEvent(new CustomEvent('novasync:journey', {detail:next})); step = next; }
    }
    const c = contact.getBoundingClientRect();
    contact.style.setProperty('--contact-shift', `${(1 - clamp((h - c.top) / h)) * 90}px`);
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(render); }
  }
  document.addEventListener('novasync:scene-manual', e => {
    scene = e.detail; manualAt = scrollY; progress(scene / 2);
  });
  document.addEventListener('novasync:coverage', e => {
    cancelAnimationFrame(countFrame);
    if (paused()) { count.textContent = String(e.detail); countFrame = 0; return; }
    const target = e.detail, start = performance.now();
    countProgress = 1;
    count.textContent = '0';
    function tick(now) {
      const p = clamp((now - start) / 650);
      count.textContent = String(Math.round(target * ease(p)));
      countFrame = p < 1 ? requestAnimationFrame(tick) : 0;
    }
    countFrame = requestAnimationFrame(tick);
  });
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', configure, {passive:true});
  reduce.addEventListener('change', configure);
  new MutationObserver(schedule).observe(document.documentElement, {attributes:true, attributeFilter:['data-motion']});
  new ResizeObserver(configure).observe(pin);
  document.fonts.ready.then(configure);
  configure();
})();
