/* Home: o que é só da home. O resto (cenas presas, trava, painéis, números) vem do kx.js.
   html.still = movimento reduzido ou "Pausar animações": o mapa (mapa-3d.js) lê esta classe. */
(() => {
  const { reduce, $ } = kx;
  const root = document.documentElement;
  const still = () => reduce.matches || root.dataset.motion === 'paused';
  const mode = () => { root.classList.toggle('still', still()); kx.schedule(); };
  reduce.addEventListener('change', mode);
  new MutationObserver(mode).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  root.classList.toggle('still', still());

  // O dia em campo: o relógio anda entre os horários dos acontecimentos; cada um tem a sua imagem.
  const dia = $('#dia');
  const layers = [...dia.querySelectorAll('.kx-layers>*')], evs = [...dia.querySelectorAll('[data-ev]')];
  const T = [3 * 60 + 47, 22 * 60 + 14, 31 * 60 + 58, 32 * 60 + 30]; // minutos desde 00:00 do 1º dia (31:58 = 07:58 do dia seguinte)
  const PARADAS = [1, 2, 3, 0], TECNICOS = [0, 0, 0, 3];
  const hm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  let cur = -1;
  kx.onFrame(() => {
    const p = reduce.matches ? 0 : Number(dia.style.getPropertyValue('--p'));
    const f = Math.min(3, Math.max(0, p * 4 - .5)), i = Math.min(2, Math.floor(f));
    $('#dia-clock').textContent = hm(Math.round(T[i] + (T[i + 1] - T[i]) * (f - i)));
    const n = Math.min(3, Math.max(0, Math.floor(p * 4)));
    if (n === cur) return;
    cur = n;
    $('#m-paradas').textContent = PARADAS[n];
    $('#m-tecnicos').textContent = TECNICOS[n];
    evs.forEach((e, k) => e.classList.toggle('is-on', k === n));
    layers.forEach((el, k) => el.classList.toggle('is-on', k === n));
  });
  kx.schedule();
})();
