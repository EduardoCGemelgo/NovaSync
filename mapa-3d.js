/* Mapa da cobertura: estados em 3D (three.js) com relevo baixo e variado; o estado só
   sobe e acende ao passar o cursor ou ao ser escolhido (alturas pela rede escondiam DF atrás de SP).
   Ao chegar na tela, os estados sobem a partir de SP, o mapa inclina e (com mouse) aproxima; aí o mapa desliza
   para o lado em que está o cursor, para todo estado ficar grande e ao alcance.
   Passar o mouse mostra a UF; clicar escolhe no <select id="state">, que continua sendo o controle
   acessível (o novasync.js atualiza o cartão). Sem WebGL, fica o mesmo desenho em SVG 2D.
   Contornos em mapa-ufs.js (gerados de mapa-novasync.svg); não depende de <object>, então funciona
   também aberto direto do disco (file://). */
(() => {
  const box = document.getElementById('coverage-map');
  if (!box || !window.MAPA_UFS) return;
  const cov = document.getElementById('cobertura');
  const select = document.getElementById('state');
  const count = document.getElementById('coverage-count');
  const name = document.getElementById('coverage-state-name');
  const readable = document.getElementById('coverage-count-readable');
  const cap = referenceCapacity; // novasync.js
  const names = new Map([...select.options].map(o => [o.value, o.text]));
  const ufs = Object.keys(MAPA_UFS);
  const total = ufs.reduce((s, uf) => s + cap[uf], 0);
  // Relevo "aleatório" estável: derivado da sigla, igual a cada visita.
  const relief = uf => 0.3 + ((uf.charCodeAt(0) * 31 + uf.charCodeAt(1) * 17) % 11) / 10 * 0.45;
  const clamp = n => Math.min(1, Math.max(0, n));
  const ease = n => 1 - (1 - n) ** 3;
  const still = () => document.documentElement.classList.contains('still');
  let born = 0; // quando o mapa chegou à tela: a entrada toca uma vez, em 2 s
  const progress = () => (still() ? 1 : born ? clamp((performance.now() - born) / 2000) : 0);
  const mouse = matchMedia('(hover: hover) and (pointer: fine)'); // só com mouse o mapa aproxima e segue o cursor
  const ZOOM = 1.25;
  const COLOR = { off: '#262d44', on: '#6f89c2', dim: '#3a486e', hover: '#e3ebff', pick: '#c0d1f5' };
  let gl = null; // preenchido quando o 3D estiver no ar

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const uf of ufs) for (const poly of MAPA_UFS[uf]) for (const r of poly) for (let i = 0; i < r.length; i += 2) {
    x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]);
  }

  const tip = document.createElement('div');
  tip.className = 'map-tip';
  tip.hidden = true;
  box.append(tip);
  function showTip(uf, x, y) {
    tip.hidden = !uf;
    if (!uf) return;
    tip.textContent = `${names.get(uf)} · ${cap[uf]} técnicos`;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  function pick(uf) {
    if (select.value === uf) return;
    select.value = uf;
    select.dispatchEvent(new Event('change'));
  }

  // Cartão: "Todo o Brasil" mostra o total (ou a soma dos estados já levantados, no 3D);
  // um estado escolhido conta de 0 até o número dele (o novasync.js dispara novasync:coverage).
  let countFrame = 0;
  select.addEventListener('change', () => {
    if (select.value) return; // a contagem do estado já começou no novasync:coverage
    cancelAnimationFrame(countFrame);
    countFrame = 0;
    name.textContent = 'Brasil';
    readable.textContent = total;
    count.textContent = gl ? gl.sum : total;
  });
  document.addEventListener('novasync:coverage', e => {
    cancelAnimationFrame(countFrame);
    countFrame = 0;
    if (still()) { count.textContent = e.detail; return; }
    const start = performance.now();
    const tick = now => {
      const k = clamp((now - start) / 650);
      count.textContent = Math.round(e.detail * ease(k));
      countFrame = k < 1 ? requestAnimationFrame(tick) : 0;
    };
    countFrame = requestAnimationFrame(tick);
  });

  // 2D: aparece de imediato e fica como alternativa sem WebGL.
  const ringD = r => { let d = 'M' + r[0] + ' ' + r[1]; for (let i = 2; i < r.length; i += 2) d += 'L' + r[i] + ' ' + r[i + 1]; return d + 'Z'; };
  const NS = 'http://www.w3.org/2000/svg';
  const pad = 300;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `${x0 - pad} ${y0 - pad} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Mapa dos estados brasileiros; selecione também pelo campo ao lado');
  const paths = ufs.map(uf => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', MAPA_UFS[uf].flat().map(ringD).join(''));
    const t = document.createElementNS(NS, 'title');
    t.textContent = `${names.get(uf)} · ${cap[uf]} técnicos`;
    p.append(t);
    p.addEventListener('click', () => pick(uf));
    svg.append(p);
    return p;
  });
  const paint2D = () => paths.forEach((p, i) => {
    p.style.fill = !select.value ? COLOR.on : ufs[i] === select.value ? COLOR.pick : COLOR.dim;
  });
  select.addEventListener('change', paint2D);
  paint2D();
  box.prepend(svg);

  // 3D: three.js só é baixado quando a seção se aproxima.
  if (!window.WebGLRenderingContext) return;
  const io = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    io.disconnect();
    const s = document.createElement('script');
    s.src = 'vendor/three.min.js';
    s.onload = init3D;
    document.head.append(s);
  }, { rootMargin: '150% 0px' });
  io.observe(cov);
  const arrive = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    arrive.disconnect();
    born = performance.now();
    gl?.wake();
  }, { threshold: 0.5 });
  arrive.observe(box);

  function init3D() {
    const T = THREE;
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; } // fica o 2D
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Mapa 3D dos estados brasileiros; passe o cursor ou toque para ver a rede de cada estado. Selecione também pelo campo ao lado.');
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(30, 1, 0.1, 500);
    scene.add(new T.AmbientLight(0xffffff, 0.8));
    const sun = new T.DirectionalLight(0xffffff, 0.55);
    sun.position.set(-6, -10, 14);
    scene.add(sun);
    const map = new T.Group();
    scene.add(map);

    // SVG (y para baixo) -> plano XY do three (y para cima), 20 unidades de largura.
    const S = 20 / (x1 - x0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const mapW = 20, mapH = (y1 - y0) * S;
    const pts = r => { const a = []; for (let i = 0; i < r.length; i += 2) a.push(new T.Vector2((r[i] - cx) * S, -(r[i + 1] - cy) * S)); return a; };
    const edge = new T.LineBasicMaterial({ color: '#0b0d16', transparent: true, opacity: 0.85 });
    const states = ufs.map(uf => {
      const shapes = MAPA_UFS[uf].map(([outer, ...holes]) => {
        const s = new T.Shape(pts(outer));
        s.holes = holes.map(h => new T.Path(pts(h)));
        return s;
      });
      const geo = new T.ExtrudeGeometry(shapes, { depth: 1, bevelEnabled: false });
      const top = new T.MeshStandardMaterial({ color: COLOR.off, roughness: 0.55, metalness: 0.15 });
      const side = new T.MeshBasicMaterial({ color: COLOR.off }); // lateral sem luz: cor chapada, sem listras
      const mesh = new T.Mesh(geo, [top, side]); // grupos do ExtrudeGeometry: 0 = tampas, 1 = laterais
      mesh.userData.uf = uf;
      for (const poly of MAPA_UFS[uf]) for (const r of poly) // contorno sobre a tampa, sobe junto com a escala
        mesh.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(pts(r).map(v => new T.Vector3(v.x, v.y, 1.002))), edge));
      map.add(mesh);
      geo.computeBoundingBox();
      return { uf, mesh, top, side, c: geo.boundingBox.getCenter(new T.Vector3()), h: relief(uf), rise: 0, lift: 0 };
    });
    // Enquadramento: a distância em que o contorno (1 ponto a cada 8, na altura das tampas) cabe na moldura,
    // achada por busca binária; recalculada só quando a inclinação ou o formato da moldura mudam.
    const outline = [];
    for (const uf of ufs) for (const [r] of MAPA_UFS[uf]) for (let i = 0; i < r.length; i += 16)
      outline.push(new T.Vector3((r[i] - cx) * S, -(r[i + 1] - cy) * S, 0.6));
    const v = new T.Vector3();
    let framed = { tilt: -1, aspect: 0, d: 0 };
    function frameDist(tilt, camY, lookY) {
      if (framed.tilt === tilt && framed.aspect === camera.aspect) return framed.d;
      let lo = 12, hi = 300; // abaixo de 12 o sul inclinado fica atrás da câmera
      for (let i = 0; i < 18; i++) {
        const d = (lo + hi) / 2;
        camera.position.set(0, camY, d);
        camera.lookAt(0, lookY, 0);
        camera.updateMatrixWorld();
        let m = 0;
        for (const p of outline) { v.copy(p).applyMatrix4(map.matrix).project(camera); m = Math.max(m, Math.abs(v.x), Math.abs(v.y)); }
        if (m > 0.9) lo = d; else hi = d;
      }
      framed = { tilt, aspect: camera.aspect, d: hi };
      return hi;
    }
    const sp = states.find(s => s.uf === 'SP').c, df = states.find(s => s.uf === 'DF');
    [...states].sort((a, b) => a.c.distanceTo(sp) - b.c.distanceTo(sp)).forEach((s, i) => { s.order = i; });

    let hovered = null, running = false, last = 0, cursor = null;
    const want = new T.Color(), on = new T.Color(COLOR.on);
    const aim = new T.Vector2(), pan = new T.Vector2(); // cursor no mapa (-1 a 1) e o deslize que o segue
    gl = { sum: 0, wake };
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      const k = still() ? 1 : 1 - Math.exp(-dt * 10);
      const p = progress();
      const grow = clamp(p / 0.8), tilt = ease(clamp(p / 0.6));
      const zoom = still() || !mouse.matches ? 1 : 1 + (ZOOM - 1) * ease(clamp((p - 0.3) / 0.7));
      let moving = born > 0 && p < 1, sum = 0;
      for (const s of states) {
        const rise = clamp((grow * (states.length + 5) - s.order) / 5);
        const lift = s.uf === select.value ? 0.9 : s.uf === hovered ? 0.6 : 0;
        if (select.value) want.set(s.uf === select.value ? COLOR.pick : s.uf === hovered ? COLOR.hover : COLOR.dim);
        else if (s.uf === hovered && s.rise > 0.5) want.set(COLOR.hover);
        else want.set(COLOR.off).lerp(on, s.rise);
        s.rise += (rise - s.rise) * k;
        s.lift += (lift - s.lift) * k;
        const before = s.top.color.getHex();
        s.top.color.lerp(want, k);
        s.side.color.copy(s.top.color).multiplyScalar(0.42);
        s.top.emissive.copy(s.top.color).multiplyScalar(s.uf === select.value || s.uf === hovered ? 0.5 : 0.1); // destaque brilha
        s.mesh.scale.z = 0.04 + s.rise * s.h + s.lift;
        if (Math.abs(rise - s.rise) > 1e-3 || Math.abs(lift - s.lift) > 1e-3 || before !== s.top.color.getHex()) moving = true;
        if (s.rise > 0.5) sum += cap[s.uf];
      }
      map.rotation.x = -tilt * 0.9; // ~52°: o norte recua, as alturas aparecem
      map.rotation.z = (1 - tilt) * 0.2;
      map.updateMatrix();
      const camY = -tilt * 1.2, lookY = -tilt * 1.6; // inclinado, o mapa desce na tela: o alvo desce junto para recentrar
      const dist = frameDist(tilt, camY, lookY) / zoom;
      // Aproximado, o mapa passa da moldura: o cursor na borda mostra aquela borda do mapa (e um respiro além dela).
      pan.lerp(aim, still() ? 1 : 1 - Math.exp(-dt * 5));
      if (pan.distanceTo(aim) > 1e-3) moving = true;
      const half = Math.tan((camera.fov * Math.PI) / 360);
      const rx = Math.max(0, mapW / 2 - dist * half * camera.aspect) + 0.6;
      const ry = Math.max(0, (mapH / 2) * Math.cos(tilt * 0.9) - dist * half) + 0.6;
      const ox = pan.x * rx, oy = pan.y * ry;
      camera.position.set(ox, camY + oy, dist);
      camera.lookAt(ox, lookY + oy, 0);
      renderer.render(scene, camera);
      if (cursor && moving) point(cursor); // o mapa andou sob o cursor parado: o estado apontado muda
      gl.sum = sum;
      if (!select.value && !countFrame) { name.textContent = 'Brasil'; count.textContent = sum; }
      running = moving;
      if (moving) requestAnimationFrame(tick);
    }
    function wake() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
    function resize() {
      const w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      wake();
    }

    const ray = new T.Raycaster(), ptr = new T.Vector2();
    function point(e) {
      const r = canvas.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      let uf = ray.intersectObjects(states.map(s => s.mesh), false)[0]?.object.userData.uf || null;
      // DF tem poucos pixels: perto do centro dele (18 px), o cursor prefere o DF ao estado vizinho.
      const c = df.c.clone().applyMatrix4(df.mesh.matrixWorld).project(camera);
      if (Math.hypot((c.x + 1) / 2 * r.width - (e.clientX - r.left), (1 - c.y) / 2 * r.height - (e.clientY - r.top)) < 18) uf = 'DF';
      if (uf !== hovered) { hovered = uf; canvas.style.cursor = uf ? 'pointer' : ''; wake(); }
      const b = box.getBoundingClientRect();
      showTip(uf, e.clientX - b.left, e.clientY - b.top);
    }
    canvas.addEventListener('pointermove', e => {
      point(e);
      if (e.pointerType !== 'mouse' || still()) return;
      const r = canvas.getBoundingClientRect(), edge = v => Math.max(-1, Math.min(1, v * 1.2)); // borda alcançada antes da beirada
      cursor = { clientX: e.clientX, clientY: e.clientY };
      aim.set(edge(((e.clientX - r.left) / r.width) * 2 - 1), edge(1 - ((e.clientY - r.top) / r.height) * 2));
      wake();
    });
    canvas.addEventListener('pointerdown', point); // toque não tem hover antes do clique
    canvas.addEventListener('pointerleave', () => { hovered = null; cursor = null; aim.set(0, 0); canvas.style.cursor = ''; showTip(null); wake(); });
    canvas.addEventListener('click', e => { point(e); if (hovered) pick(hovered); }); // o mapa pode ter andado desde o último movimento

    svg.replaceWith(canvas);
    resize();
    new ResizeObserver(resize).observe(box);
    select.addEventListener('change', wake);
    new MutationObserver(wake).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
})();
