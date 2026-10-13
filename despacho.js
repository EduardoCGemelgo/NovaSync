/* Mesa de despacho (home): o mapa do Brasil com os 350 técnicos de referência como pontos.
   A rolagem conta a história: três chamados abrem, o técnico mais perto assume, cada visita fecha com relatório,
   e no fim o visitante escolhe o estado dele. Desenhado em canvas 2D com os contornos de mapa-ufs.js.
   home.js entrega o progresso da cena (0 a 1) em window.despacho.set(p). */
(() => {
  const box = document.querySelector('.dp');
  if (!box || !window.MAPA_UFS) return;
  const cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
  const sel = document.getElementById('state');
  const cap = referenceCapacity; // novasync.js
  const ufs = Object.keys(MAPA_UFS);
  const clamp = n => Math.min(1, Math.max(0, n));
  const ease = n => 1 - (1 - n) ** 3;

  // Contornos: Path2D por UF, em coordenadas do mapa.
  const bbox = {}, paths = {};
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
  for (const uf of ufs) {
    const b = bbox[uf] = [Infinity, Infinity, -Infinity, -Infinity], p = paths[uf] = new Path2D();
    for (const poly of MAPA_UFS[uf]) for (const r of poly) {
      for (let i = 0; i < r.length; i += 2) {
        const x = r[i], y = r[i + 1];
        i ? p.lineTo(x, y) : p.moveTo(x, y);
        b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
      }
      p.closePath();
    }
    X0 = Math.min(X0, b[0]); Y0 = Math.min(Y0, b[1]); X1 = Math.max(X1, b[2]); Y1 = Math.max(Y1, b[3]);
  }
  const inside = (uf, x, y) => MAPA_UFS[uf].some(poly => {
    let c = 0; // par-ímpar entre todos os anéis do polígono (anel externo e furos)
    for (const r of poly) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)
      if ((r[i + 1] > y) !== (r[j + 1] > y) && x < (r[j] - r[i]) * (y - r[i + 1]) / (r[j + 1] - r[i + 1]) + r[i]) c++;
    return c % 2 === 1;
  });
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Um ponto por técnico de referência, espalhado dentro do próprio estado (sempre o mesmo desenho).
  const dots = [];
  for (const uf of ufs) {
    const rand = rng(uf.charCodeAt(0) * 131 + uf.charCodeAt(1)), [a, b, c, d] = bbox[uf];
    const minD = Math.sqrt((c - a) * (d - b) / (cap[uf] + 1)) * .42, mine = [];
    for (let n = 0, tries = 0; n < cap[uf] && tries < 6000; tries++) {
      const x = a + rand() * (c - a), y = b + rand() * (d - b);
      if (!inside(uf, x, y)) continue;
      if (tries < 2500 && mine.some(q => Math.hypot(q.x - x, q.y - y) < minD)) continue;
      const q = { uf, x, y, ph: rand() * 6.28 };
      mine.push(q); dots.push(q); n++;
    }
  }

  // Os três chamados do começo da home: Manaus, Recife e Curitiba (posição pela fração do retângulo do estado).
  const CASOS = [
    { uf: 'AM', fx: .78, fy: .44, nome: 'Manaus', hora: '03:47', o: 'caixa eletrônico' },
    { uf: 'PE', fx: .9, fy: .36, nome: 'Recife', hora: '22:14', o: 'rede do hospital' },
    { uf: 'PR', fx: .8, fy: .7, nome: 'Curitiba', hora: '07:58', o: 'maquininha' },
  ];
  for (const k of CASOS) {
    const [a, b, c, d] = bbox[k.uf];
    let x = a + k.fx * (c - a), y = b + k.fy * (d - b);
    for (let r = 0; !inside(k.uf, x, y) && r < 400; r += 4) { // se caiu fora do contorno, procura o ponto de dentro mais perto
      const t = r * 6.28 / 24;
      for (let s = 0; s < 24; s++) { const px = x + Math.cos(s * 6.28 / 24) * r * (c - a) / 400, py = y + Math.sin(s * 6.28 / 24) * r * (d - b) / 400; if (inside(k.uf, px, py)) { x = px; y = py; r = 1e9; break; } }
    }
    k.x = x; k.y = y;
    k.perto = dots.filter(q => q.uf === k.uf).sort((p, q) => Math.hypot(p.x - x, p.y - y) - Math.hypot(q.x - x, q.y - y)).slice(0, 3);
  }

  // Câmera e geometria
  let W = 0, H = 0, dpr = 1, area = { x: 0, y: 0, w: 1, h: 1 }, s0 = 1;
  const cam = { x: (X0 + X1) / 2, y: (Y0 + Y1) / 2, k: 1 };
  const goal = { x: cam.x, y: cam.y, k: 1 };
  function resize() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    area = W > 900 ? { x: W * .36, y: 90, w: W * .62, h: H - 130 } : { x: 8, y: 84, w: W - 16, h: H * .5 };
    s0 = Math.min(area.w / (X1 - X0), area.h / (Y1 - Y0));
    aim();
  }
  function aim() {
    if (!chosen) { Object.assign(goal, { x: (X0 + X1) / 2, y: (Y0 + Y1) / 2, k: 1 }); return; }
    const [a, b, c, d] = bbox[chosen];
    goal.x = (a + c) / 2; goal.y = (b + d) / 2;
    goal.k = Math.min(3.4, .78 * Math.min(area.w / ((c - a) * s0), area.h / ((d - b) * s0)));
  }

  // Estado
  let target = 0, pp = 0, chosen = '', hover = '', visible = false, reduced = false;
  const tec = sel ? () => document.getElementById('coverage-count') : null;
  window.despacho = { set(p, still) { target = p; reduced = !!still; if (!visible) { pp = target; draw(performance.now()); } } };

  function draw(now) {
    const k = cam.k * s0, cx = area.x + area.w / 2, cy = area.y + area.h / 2;
    const sx = x => (x - cam.x) * k + cx, sy = y => (y - cam.y) * k + cy;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const a1 = ease(clamp((pp - .12) / .16)), a2 = ease(clamp((pp - .34) / .16)), a3 = ease(clamp((pp - .56) / .16)), a4 = ease(clamp((pp - .78) / .18));
    // estados
    ctx.save();
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (cx - cam.x * k), dpr * (cy - cam.y * k));
    ctx.lineWidth = 1 / k;
    hover = '';
    for (const uf of ufs) {
      const on = uf === chosen;
      ctx.fillStyle = on ? '#1b2a4d' : uf === pointer.uf ? '#161e36' : '#0e1220';
      ctx.strokeStyle = on ? '#6f89c2' : '#262d44';
      ctx.fill(paths[uf]); ctx.stroke(paths[uf]);
    }
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // técnicos
    const focus = a2 > .02 && a4 < .5;
    for (const q of dots) {
      const x = sx(q.x), y = sy(q.y);
      const mine = chosen && q.uf === chosen, lit = CASOS.some(c => c.perto.includes(q)) && a2 > .05 && a4 < .5;
      const pulse = reduced ? 0 : Math.sin(now / 900 + q.ph) * .5 + .5;
      let al = .45 + pulse * .25, r = 1.9, col = '111,137,194';
      if (focus && !lit) al *= .35;
      if (chosen && !mine) al *= .3;
      if (mine) { al = .95; r = 2.8; col = '227,235,255'; }
      if (lit) { al = 1; r = 3.6 + pulse * .8; col = '227,235,255'; ctx.fillStyle = 'rgba(192,209,245,.16)'; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = `rgba(${col},${al})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
    }
    // linhas do técnico mais perto até o chamado
    if (a2 > 0) for (const c of CASOS) {
      const px = sx(c.x), py = sy(c.y);
      c.perto.forEach((q, i) => {
        const x = sx(q.x), y = sy(q.y), mx = (x + px) / 2 + (y - py) * .18, my = (y + py) / 2 - (x - px) * .18;
        ctx.strokeStyle = `rgba(192,209,245,${(.75 - a3 * .45) * (1 - a4)})`;
        ctx.lineWidth = 1.4; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now / 60;
        ctx.beginPath(); ctx.moveTo(x, y);
        const e = a2 * (1 - i * .08);
        ctx.quadraticCurveTo(x + (mx - x) * e, y + (my - y) * e, x + (px - x) * e, y + (py - y) * e);
        ctx.stroke(); ctx.setLineDash([]);
      });
    }
    // os três chamados
    if (a1 > 0 && a4 < 1) for (const c of CASOS) {
      const x = sx(c.x), y = sy(c.y), fade = 1 - a4, ok = a3, ring = reduced ? .5 : (now % 1500) / 1500;
      const col = ok > .5 ? '74,222,128' : '255,107,107';
      ctx.globalAlpha = fade * a1;
      ctx.strokeStyle = `rgba(${col},${1 - ring})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 7 + ring * 22, 0, 6.28); ctx.stroke();
      ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.arc(x, y, 7 * a1, 0, 6.28); ctx.fill();
      if (ok > .5) { ctx.strokeStyle = '#06210f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x - 1, y + 2.6); ctx.lineTo(x + 3.4, y - 2.4); ctx.stroke(); }
      if (a1 > .6) {
        const t1 = `${c.nome} · ${c.hora}`, t2 = ok > .5 ? 'Finalizado · RAT anexado' : c.o;
        ctx.font = '600 12px Manrope, system-ui, sans-serif';
        const w = Math.max(ctx.measureText(t1).width, ctx.measureText(t2).width) + 24, bx = Math.min(W - w - 8, Math.max(8, x + 16)), by = y - 46;
        ctx.fillStyle = 'rgba(8,10,18,.9)'; ctx.strokeStyle = `rgba(${col},.6)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx, by, w, 40, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#eef1ff'; ctx.fillText(t1, bx + 12, by + 17);
        ctx.font = '12px Manrope, system-ui, sans-serif'; ctx.fillStyle = ok > .5 ? '#9af0bd' : '#ffb1b1'; ctx.fillText(t2, bx + 12, by + 32);
      }
      ctx.globalAlpha = 1;
    }
    // etiqueta do estado sob o ponteiro
    if (a4 > .5 && pointer.uf) {
      ctx.font = '600 13px Manrope, system-ui, sans-serif';
      const t = `${pointer.uf} · ${cap[pointer.uf]} técnicos`, w = ctx.measureText(t).width + 20;
      const bx = Math.min(W - w - 8, pointer.x + 14), by = Math.max(8, pointer.y - 38);
      ctx.fillStyle = 'rgba(16,19,31,.95)'; ctx.strokeStyle = '#3d4058';
      ctx.beginPath(); ctx.roundRect(bx, by, w, 28, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#eef1ff'; ctx.fillText(t, bx + 10, by + 18);
    }
  }

  function frame(now) {
    if (!visible) return;
    const f = reduced ? 1 : .14;
    pp += (target - pp) * f; if (Math.abs(target - pp) < .0005) pp = target;
    cam.x += (goal.x - cam.x) * f; cam.y += (goal.y - cam.y) * f; cam.k += (goal.k - cam.k) * f;
    draw(now);
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(frame); }, { rootMargin: '100px' }).observe(box);

  // Ponteiro: só escolhe estado quando a última tela está acesa; o <select> segue sendo o controle acessível.
  const pointer = { x: 0, y: 0, uf: '' };
  function pick(e) {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const k = cam.k * s0, cx = area.x + area.w / 2, cy = area.y + area.h / 2;
    const mx = (x - cx) / k + cam.x, my = (y - cy) / k + cam.y;
    return { x, y, uf: ufs.find(u => mx >= bbox[u][0] && mx <= bbox[u][2] && my >= bbox[u][1] && my <= bbox[u][3] && inside(u, mx, my)) || '' };
  }
  cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && target > .85) Object.assign(pointer, pick(e)); else pointer.uf = ''; });
  cv.addEventListener('pointerleave', () => { pointer.uf = ''; });
  cv.addEventListener('click', e => {
    if (target < .85 || !sel) return;
    const { uf } = pick(e);
    if (uf) { sel.value = uf === sel.value ? '' : uf; sel.dispatchEvent(new Event('change')); }
  });
  sel?.addEventListener('change', () => {
    chosen = sel.value;
    aim();
    if (!chosen) { const n = document.getElementById('coverage-count'); const nm = document.getElementById('coverage-state-name'); if (n) n.textContent = '350'; if (nm) nm.textContent = 'Brasil'; const rd = document.getElementById('coverage-count-readable'); if (rd) rd.textContent = '350'; }
  });
  new ResizeObserver(resize).observe(cv);
  resize();
})();
