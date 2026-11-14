/* Pós-venda: cenas presas. A rolagem dá --p (0 a 1) a cada cena; a parada escolhe a imagem e a fala. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = s => document.querySelector(s);
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const parts = scenes.map(el => ['.kx-layers > *', '.pv-falas article', '.pv-passos li'].map(s => [...el.querySelectorAll(s)]));
  let queued = false;
  function frame() {
    queued = false;
    const h = innerHeight;
    scenes.forEach((el, k) => {
      const r = el.getBoundingClientRect();
      const p = reduce.matches ? 0 : Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - h)));
      el.style.setProperty('--p', p.toFixed(4));
      const n = parts[k][0].length, i = Math.min(n - 1, Math.floor(p * n));
      parts[k].forEach(list => list.forEach((x, j) => x.classList.toggle('is-on', j === i)));
    });
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

  // Paradas da trava: mesma conta do konso.js (pontos de cada cena, início dos blocos e fim).
  const root = document.documentElement;
  const blocks = [...document.querySelectorAll('main > section:not([data-scene])')];
  trava(() => {
    const h = innerHeight, end = root.scrollHeight - h;
    const fit = y => Math.round(Math.min(end, Math.max(0, y)));
    const top = el => el.getBoundingClientRect().top + scrollY;
    const holds = scenes.map(el => [top(el), top(el) + el.offsetHeight - h]);
    const beats = scenes.flatMap((el, i) => el.dataset.stops.split(' ').map(p => fit(holds[i][0] + p * (holds[i][1] - holds[i][0]))));
    const navH = innerWidth <= 900 ? $('.nav').offsetHeight + 16 : 0;
    const pins = new Set([0, end, ...blocks.flatMap(s => {
      const t = top(s) - navH, extra = s.offsetHeight - (h - navH);
      return extra > h * .3 ? [fit(t), fit(t + extra)] : [fit(navH ? t + extra / 2 : t + Math.max(0, extra) / 2)];
    })]);
    const a = [0];
    for (const y of [...pins, ...beats].sort((p, q) => p - q)) {
      if (y - a.at(-1) < h * .3) {
        if (!pins.has(y) || y - a.at(-1) < 3) continue;
        if (y === end && !pins.has(a.at(-1))) a.pop();
      }
      let s = a.at(-1);
      for (const [hs, he] of [...holds, [y, y]]) {
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
