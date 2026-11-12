// Nature animations for the home hero — round 4 options (leaves, water, the commons).
// Every change is gradual: nothing blinks or flashes.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  // ---- 3D Perlin noise (-1..1) ----
  const perm = new Uint8Array(512);
  (() => { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
  const fd = (t) => t * t * t * (t * (t * 6 - 15) + 10), lp = (a, b, t) => a + t * (b - a);
  const gr = (h, x, y, z) => { h &= 15; const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
  const noise = (x, y, z) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fd(x), v = fd(y), w = fd(z), A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lp(lp(lp(gr(perm[AA], x, y, z), gr(perm[BA], x - 1, y, z), u), lp(gr(perm[AB], x, y - 1, z), gr(perm[BB], x - 1, y - 1, z), u), v),
      lp(lp(gr(perm[AA + 1], x, y, z - 1), gr(perm[BA + 1], x - 1, y, z - 1), u), lp(gr(perm[AB + 1], x, y - 1, z - 1), gr(perm[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  };

  // ---- colours & helpers ----
  const hex = (s) => { s = s.trim(); if (s[0] === "#") { if (s.length === 4) s = "#" + [...s.slice(1)].map((c) => c + c).join(""); return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); } const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0]; };
  const colors = () => {
    const cs = getComputedStyle(document.documentElement), g = (v, d) => hex(cs.getPropertyValue(v) || d);
    return { green: g("--q1", "#3f7d5a"), water: g("--q2", "#3a6f98"), gold: g("--q3", "#b9832f"), ink: g("--ink-3", "#7b7d75") };
  };
  const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const near = (S, x, y, r) => { const d = Math.hypot(x - S.p.x, y - S.p.y); return d < r ? 1 - d / r : 0; };

  const leaf = (ctx, x, y, rot, s, col, alpha = 0.8, vein = true) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = rgba(col, alpha);
    ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(-s * 0.1, -s * 0.62, s, 0); ctx.quadraticCurveTo(-s * 0.1, s * 0.62, -s, 0); ctx.fill();
    if (vein && s > 4) { ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.55})`; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-s * 0.85, 0); ctx.lineTo(s * 0.8, 0); ctx.stroke(); }
    ctx.strokeStyle = rgba(col, alpha); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * 1.35, s * 0.12); ctx.stroke();
    ctx.restore();
  };


  // ---- vague backgrounds for the water (choose with data-bg="...") ----
  const BG = {
    // a faint blue wash with a few soft, slow currents
    wash(ctx, t, C, S) {
      const g = ctx.createLinearGradient(0, 0, 0, S.F + 20);
      g.addColorStop(0, rgba(C.water, 0)); g.addColorStop(0.5, rgba(C.water, 0.05)); g.addColorStop(1, rgba(C.water, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, S.W, S.F + 20);
      ctx.lineWidth = 1;
      for (let q = 0; q < 5; q++) {
        const base = 14 + (S.F - 20) * (q + 0.5) / 5;
        ctx.strokeStyle = rgba(C.water, 0.09); ctx.beginPath();
        for (let x = -10; x <= S.W + 10; x += 12) { const y = base + Math.sin(x / (300 + q * 40) * TAU + t * 0.0003 + q) * 4; x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
    },
    // a very faint square grid, like the commons, with a slow swell passing under it
    grid(ctx, t, C, S) {
      const cell = 11, sq = 7.5, cols = Math.floor(S.W / cell), rows = Math.floor(S.F / cell), ox = (S.W - cols * cell) / 2;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = ox + (i + 0.5) * cell, y = (j + 0.5) * cell, sw = 0.5 + 0.5 * Math.sin(t * 0.0004 - i * 0.12 + j * 0.05);
        ctx.fillStyle = rgba(C.water, 0.03 + 0.05 * sw); ctx.fillRect(x - sq / 2, y - sq / 2, sq, sq);
      }
    },
    // faint depth contours of the pond floor, slowly shifting
    contours(ctx, t, C, S) {
      const cell = 9, cols = Math.ceil(S.W / cell) + 1, rows = Math.ceil(S.F / cell) + 1, z = t * 0.00003;
      if (!S._cv || S._cv.length !== cols * rows) S._cv = new Float32Array(cols * rows);
      const v = S._cv;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = noise(i * cell * 0.004, j * cell * 0.006, z);
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(C.water, 0.13);
      for (const lv of [-0.3, -0.15, 0, 0.15, 0.3]) {
        ctx.beginPath();
        for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
          const a = v[j * cols + i], b = v[j * cols + i + 1], c = v[(j + 1) * cols + i + 1], d = v[(j + 1) * cols + i];
          const x = i * cell, y = j * cell, e = [], it = (p, q) => (lv - p) / (q - p);
          if ((a > lv) !== (b > lv)) e.push(x + cell * it(a, b), y);
          if ((b > lv) !== (c > lv)) e.push(x + cell, y + cell * it(b, c));
          if ((d > lv) !== (c > lv)) e.push(x + cell * it(d, c), y + cell);
          if ((a > lv) !== (d > lv)) e.push(x, y + cell * it(a, d));
          if (e.length >= 4) { ctx.moveTo(e[0], e[1]); ctx.lineTo(e[2], e[3]); }
          if (e.length === 8) { ctx.moveTo(e[4], e[5]); ctx.lineTo(e[6], e[7]); }
        }
        ctx.stroke();
      }
    },
    // a stippled surface: tiny dots whose density drifts slowly, like light on water
    stipple(ctx, t, C, S) {
      if (!S._dots || S._dotsW !== S.W) { S._dotsW = S.W; S._dots = []; for (let y = 4; y < S.F + 10; y += 6) for (let x = (y % 12 ? 3 : 0); x < S.W; x += 6) S._dots.push([x + rand(-1.5, 1.5), y + rand(-1.5, 1.5)]); }
      const z = t * 0.00005;
      for (const [x, y] of S._dots) {
        const n = noise(x * 0.008, y * 0.012, z);
        if (n < -0.12) continue;
        ctx.fillStyle = rgba(C.water, Math.min(0.36, (n + 0.12) * 0.7)); ctx.fillRect(x, y, 1.7, 1.7);
      }
    },
    // soft horizontal glints of light drifting slowly across the water
    shimmer(ctx, t, C, S) {
      if (!S._gl || S._glW !== S.W) { S._glW = S.W; S._gl = Array.from({ length: Math.round(S.W / 22) }, () => ({ x: rand(0, S.W), y: rand(8, S.F), w: rand(18, 60), ph: rand(0, TAU), v: rand(0.003, 0.007) })); }
      ctx.lineCap = "round"; ctx.lineWidth = 1.4;
      for (const g of S._gl) {
        g.x += g.v * 16; if (g.x - g.w > S.W) g.x = -g.w;
        const a = 0.05 + 0.09 * (0.5 + 0.5 * Math.sin(t * 0.0007 + g.ph));    // ~9 s, very gentle
        ctx.strokeStyle = rgba(C.water, a); ctx.beginPath(); ctx.moveTo(g.x - g.w / 2, g.y); ctx.lineTo(g.x + g.w / 2, g.y); ctx.stroke();
      }
    },
    none() {},

    // ---- round 2 backgrounds ----
    // soft patches of mist drifting slowly over the water
    mist(ctx, t, C, S) {
      if (!S._mist || S._mistW !== S.W) { S._mistW = S.W; S._mist = Array.from({ length: Math.max(4, Math.round(S.W / 120)) }, (_, k) => ({ x: rand(0, S.W), y: rand(0, S.F), r: rand(70, 150), v: rand(0.004, 0.008), c: k % 3 === 2 ? "green" : "water", ph: rand(0, TAU) })); }
      for (const m of S._mist) {
        m.x += m.v * 16; if (m.x - m.r > S.W) m.x = -m.r;
        const y = m.y + Math.sin(t * 0.0002 + m.ph) * 10;
        const g = ctx.createRadialGradient(m.x, y, 0, m.x, y, m.r);
        g.addColorStop(0, rgba(C[m.c], 0.09)); g.addColorStop(1, rgba(C[m.c], 0));
        ctx.fillStyle = g; ctx.fillRect(m.x - m.r, y - m.r, m.r * 2, m.r * 2);
      }
    },
    // a blotchy watercolour wash, very soft and slowly changing
    watercolor(ctx, t, C, S) { lowres(ctx, t, C, S, "_wc", 14, 120, (x, y, z) => { const n = noise(x * 0.006, y * 0.009, z * 0.00004) + 0.5 * noise(x * 0.015, y * 0.02, z * 0.00006 + 5); return n > 0 ? [C.water, Math.min(0.14, n * 0.16)] : [C.green, Math.min(0.08, -n * 0.08)]; }); },
    // the faint net of light seen on the bottom of shallow water
    caustics(ctx, t, C, S) { lowres(ctx, t, C, S, "_ca", 5, 80, (x, y, z) => { const a = 1 - Math.abs(noise(x * 0.012, y * 0.018, z * 0.00008)), b = 1 - Math.abs(noise(x * 0.012 + 40, y * 0.018, z * 0.00006 + 9)); const v = Math.pow(a, 10) + Math.pow(b, 10); return [C.water, Math.min(0.16, v * 0.11)]; }); },
    // pebbles on the pond floor, wavering a little through the water
    pebbles(ctx, t, C, S) {
      if (!S._pb || S._pbW !== S.W) { S._pbW = S.W; S._pb = Array.from({ length: Math.round(S.W / 30) }, () => ({ x: rand(0, S.W), y: rand(6, S.F), rx: rand(6, 16), ry: rand(4, 10), a: rand(0, Math.PI), c: Math.random() < 0.3 ? "gold" : Math.random() < 0.5 ? "green" : "ink", ph: rand(0, TAU) })); }
      ctx.lineWidth = 1;
      for (const p of S._pb) {
        const wx = Math.sin(t * 0.0006 + p.ph + p.y * 0.05) * 1.5;
        ctx.fillStyle = rgba(C[p.c], 0.05); ctx.strokeStyle = rgba(C[p.c], 0.12);
        ctx.beginPath(); ctx.ellipse(p.x + wx, p.y, p.rx, p.ry, p.a, 0, TAU); ctx.fill(); ctx.stroke();
      }
    },
    // a few wide rings spreading very slowly and fading in and out
    rings(ctx, t, C, S) {
      if (!S._rg) S._rg = [];
      while (S._rg.length < 3) S._rg.push({ x: rand(0, S.W), y: rand(10, S.F - 10), born: t - rand(0, 18000) * (S._rg.length ? 1 : 0), life: rand(16000, 22000), max: rand(140, 230) });
      ctx.lineWidth = 1;
      S._rg = S._rg.filter((r) => {
        const p = (t - r.born) / r.life; if (p >= 1) return false; if (p < 0) return true;
        const R = r.max * p, a = 0.13 * Math.sin(Math.PI * p);
        ctx.strokeStyle = rgba(C.water, a);
        for (const f of [1, 0.72, 0.48]) { ctx.beginPath(); ctx.ellipse(r.x, r.y, R * f, R * f * 0.36, 0, 0, TAU); ctx.stroke(); }
        return true;
      });
    },
    // the sky reflected: a pale blue-to-gold gradient with slow lighter bands
    sky(ctx, t, C, S) {
      const g = ctx.createLinearGradient(0, 0, 0, S.F + 20);
      g.addColorStop(0, rgba(C.water, 0.09)); g.addColorStop(0.6, rgba(C.gold, 0.05)); g.addColorStop(1, rgba(C.gold, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, S.W, S.F + 20);
      for (let q = 0; q < 3; q++) {
        const y = S.F * (0.2 + 0.25 * q) + Math.sin(t * 0.00025 + q * 2) * 8, h = 10 + q * 4;
        const b = ctx.createLinearGradient(0, y - h, 0, y + h); b.addColorStop(0, "rgba(255,255,255,0)"); b.addColorStop(0.5, "rgba(255,255,255,0.35)"); b.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = b; ctx.fillRect(0, y - h, S.W, h * 2);
      }
    },
  };

  // draws a function at low resolution on an offscreen canvas, then scales it up softly
  function lowres(ctx, t, C, S, key, px, every, fn) {
    const w = Math.max(2, Math.ceil(S.W / px)), h = Math.max(2, Math.ceil((S.F + 20) / px));
    let o = S[key];
    if (!o || o.w !== w || o.h !== h) { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; o = S[key] = { cv, c: cv.getContext("2d"), w, h, last: -1e9 }; }
    if (t - o.last > every) {
      o.last = t; const img = o.c.createImageData(w, h), d = img.data;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const [col, a] = fn(i * px, j * px, t), k = (j * w + i) * 4; d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = Math.round(clamp(a) * 255); }
      o.c.putImageData(img, 0, 0);
    }
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(o.cv, 0, 0, w * px, h * px); ctx.restore();
  }

  const SIMS = {};

  // ---------------- A. Still water (calmer leaves on water) ----------------
  // Fewer, fainter currents; leaves drift more slowly; only an occasional soft ring.
  SIMS.stillwater = (S) => {
    const waveY = (L, x, t) => L.base + L.amp * Math.sin((x / L.len) * TAU + t * L.w);
    let lines = [], leaves = [], rings = [];
    const mk = (x) => ({ line: Math.floor(Math.random() * lines.length), x, off: rand(-6, 6), vx: 0, voff: 0, speed: rand(0.005, 0.009),
      size: rand(7, 10.5), tilt: rand(-0.7, 0.7), sway: rand(0, TAU), c: Math.random() < 0.3 ? "gold" : "green" });
    return {
      init() {
        const n = S.W < 600 ? 3 : 4;
        lines = Array.from({ length: n }, (_, i) => ({ base: 30 + (S.F - 50) * (i + 0.5) / n, amp: rand(3, 5), len: rand(380, 560), w: rand(0.0003, 0.0005) }));
        leaves = Array.from({ length: Math.round(Math.min(20, Math.max(8, S.W / 45))) }, () => mk(rand(0, S.W)));
      },
      update(t, dt) {
        for (const f of leaves) {
          f.x += f.speed * dt + f.vx; f.off += f.voff; f.vx *= 0.95; f.voff *= 0.95; f.off -= f.off * 0.003 * dt / 16;
          const y = waveY(lines[f.line], f.x, t) + f.off, n = near(S, f.x, y, 70);
          if (n) { const dx = f.x - S.p.x, dy = y - S.p.y, d = Math.hypot(dx, dy) || 1; f.vx += dx / d * n * 0.1; f.voff += dy / d * n * 0.06; }
          if (f.x > S.W + 20) Object.assign(f, mk(-20));
        }
        for (const r of rings) { r.r += dt * 0.018; r.a -= dt * 0.00035; }
        rings = rings.filter((r) => r.a > 0);
        if (Math.random() < dt * 0.00008) { const f = leaves[Math.floor(Math.random() * leaves.length)]; rings.push({ x: f.x, y: waveY(lines[f.line], f.x, t) + f.off, r: 3, a: 0.4 }); }
      },
      draw(ctx, t, C) {
        ctx.lineWidth = 1;
        for (const L of lines) {
          ctx.strokeStyle = rgba(C.water, 0.16); ctx.beginPath();
          for (let x = -10; x <= S.W + 10; x += 10) { const y = waveY(L, x, t); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
          ctx.stroke();
        }
        for (const r of rings) { ctx.strokeStyle = rgba(C.water, r.a); ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.36, 0, 0, TAU); ctx.stroke(); }
        for (const f of leaves) {
          const L = lines[f.line], y = waveY(L, f.x, t) + f.off, sl = (waveY(L, f.x + 4, t) - waveY(L, f.x - 4, t)) / 8;
          leaf(ctx, f.x, y - 1.5, Math.atan(sl) + f.tilt + Math.sin(t * 0.0004 + f.sway) * 0.15, f.size, C[f.c], 0.82);
        }
      },
    };
  };

  // ---------------- B. The commons (shared model, two drawings) ----------------
  // Grass regrows from its neighbours. Grazers glide slowly, steering toward richer grass
  // just ahead of them and eating as they go; eaten patches slowly recover.
  // The cursor brings rain.
  const commonsModel = (S, CELL) => {
    const M = { cols: 0, rows: 0, ox: 0, g: null, gd: null, herd: [], acc: 0 };
    const idx = (i, j) => j * M.cols + i;
    const at = (x, y) => { const i = Math.floor((x - M.ox) / CELL), j = Math.floor(y / CELL); return i < 0 || j < 0 || i >= M.cols || j >= M.rows ? -1 : M.g[idx(i, j)]; };
    M.init = () => {
      M.cols = Math.floor(S.W / CELL); M.rows = Math.max(2, Math.floor(S.F / CELL)); M.ox = (S.W - M.cols * CELL) / 2;
      const N = M.cols * M.rows; M.g = new Float32Array(N); M.gd = new Float32Array(N);
      for (let j = 0; j < M.rows; j++) for (let i = 0; i < M.cols; i++) { const v = clamp(0.55 + noise(i * 0.12, j * 0.12, 9) * 0.8); M.g[idx(i, j)] = M.gd[idx(i, j)] = v; }
      M.herd = Array.from({ length: Math.max(4, Math.round(N / 70)) }, () => ({ x: rand(20, S.W - 20), y: rand(CELL, S.F - CELL), a: rand(0, TAU), turn: 0 }));
    };
    M.update = (t, dt) => {
      const k = dt / 16;
      M.acc += dt;
      while (M.acc > 450) {                                   // grass regrowth
        M.acc -= 450;
        const g = M.g, ng = g.slice();
        for (let j = 0; j < M.rows; j++) for (let i = 0; i < M.cols; i++) {
          let s = 0, n = 0;
          for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if ((di || dj) && ii >= 0 && jj >= 0 && ii < M.cols && jj < M.rows) { s += g[idx(ii, jj)]; n++; } }
          const v = g[idx(i, j)]; ng[idx(i, j)] = clamp(v + 0.05 * v * (1 - v) + 0.012 * (s / n) + 0.0015);
        }
        M.g = ng;
      }
      for (const h of M.herd) {                               // smooth grazing
        const look = CELL * 1.6, opts = [-0.55, 0, 0.55].map((d) => { const v = at(h.x + Math.cos(h.a + d) * look, h.y + Math.sin(h.a + d) * look); return v < 0 ? -1 : v; });
        let want = opts[1] >= Math.max(opts[0], opts[2]) ? 0 : opts[0] > opts[2] ? -1 : 1;
        if (opts[1] < 0) want = opts[0] > opts[2] ? -1.6 : 1.6;     // edge ahead: turn away
        h.turn += (want * 0.022 + noise(h.x * 0.01, h.y * 0.01, t * 0.0002) * 0.01 - h.turn) * 0.08 * k;
        h.a += h.turn * k;
        h.x += Math.cos(h.a) * 0.22 * k; h.y += Math.sin(h.a) * 0.22 * k;
        h.x = clamp(h.x, M.ox + 2, M.ox + M.cols * CELL - 2); h.y = clamp(h.y, 2, M.rows * CELL - 2);
        const i = Math.floor((h.x - M.ox) / CELL), j = Math.floor(h.y / CELL);
        if (i >= 0 && j >= 0 && i < M.cols && j < M.rows) M.g[idx(i, j)] = Math.max(0, M.g[idx(i, j)] - 0.02 * k);
      }
      for (let q = 0; q < M.g.length; q++) M.gd[q] += (M.g[q] - M.gd[q]) * 0.05;
      if (S.p.x > -1e3) for (let j = 0; j < M.rows; j++) for (let i = 0; i < M.cols; i++) { const n = near(S, M.ox + (i + 0.5) * CELL, (j + 0.5) * CELL, 55); if (n) M.g[idx(i, j)] = clamp(M.g[idx(i, j)] + n * 0.02); }
    };
    return M;
  };

  // B1 — squares (like the grid round)
  SIMS.commons = (S) => {
    const CELL = 11, SQ = 7.5, M = commonsModel(S, CELL);
    const sq = (ctx, x, y, size, fill, stroke) => { const h = size / 2; if (fill) { ctx.fillStyle = fill; ctx.fillRect(x - h, y - h, size, size); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x - h + 0.5, y - h + 0.5, size - 1, size - 1); } };
    return {
      init: M.init, update: M.update,
      draw(ctx, t, C) {
        for (let j = 0; j < M.rows; j++) for (let i = 0; i < M.cols; i++) {
          const v = M.gd[j * M.cols + i], x = M.ox + (i + 0.5) * CELL, y = (j + 0.5) * CELL;
          v < 0.12 ? sq(ctx, x, y, SQ * 0.55, null, rgba(C.ink, 0.1)) : sq(ctx, x, y, SQ * (0.4 + 0.6 * v), rgba(C.green, 0.05 + 0.2 * v));
        }
        for (const h of M.herd) leaf(ctx, h.x, h.y, h.a, 7.5, C.gold, 0.9);
      },
    };
  };

  // B2 — the same commons drawn as leaves
  SIMS.leafcommons = (S) => {
    const CELL = 15, M = commonsModel(S, CELL);
    let rot = null;
    return {
      init() { M.init(); rot = new Float32Array(M.cols * M.rows); for (let j = 0; j < M.rows; j++) for (let i = 0; i < M.cols; i++) rot[j * M.cols + i] = noise(i * 0.2, j * 0.2, 2) * 2.4 - 0.6; },
      update: M.update,
      draw(ctx, t, C) {
        for (let j = 0; j < M.rows; j++) for (let i = 0; i < M.cols; i++) {
          const k = j * M.cols + i, v = M.gd[k], x = M.ox + (i + 0.5) * CELL, y = (j + 0.5) * CELL;
          if (v < 0.12) { ctx.fillStyle = rgba(C.ink, 0.3); ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6); continue; }
          leaf(ctx, x, y, rot[k] + Math.sin(t * 0.0006 + i * 0.3) * 0.08, 2 + v * 4.6, C.green, 0.25 + 0.55 * v, false);
        }
        for (const h of M.herd) leaf(ctx, h.x, h.y, h.a, 7, C.gold, 0.9);
      },
    };
  };

  // ---------------- C. Floating rafts ----------------
  // Leaves drift on the water and slowly gather. Leaves that touch may stay together,
  // forming small rafts that travel as one; now and then a raft comes apart.
  SIMS.rafts = (S) => {
    let L = [], ties = [];
    const key = (a, b) => (a < b ? a * 1000 + b : b * 1000 + a);
    let tieSet = new Set();
    return {
      init() {
        const n = Math.round(Math.min(40, Math.max(14, S.W / 24)));
        L = Array.from({ length: n }, () => { const r = Math.random(); return { x: rand(0, S.W), y: rand(14, S.F - 8), vx: 0, vy: 0, a: rand(0, TAU), s: rand(6, 8.5), c: r < 0.55 ? "green" : r < 0.8 ? "gold" : "water", deg: 0 }; });
        ties = []; tieSet = new Set();
      },
      update(t, dt) {
        const k = dt / 16, z = t * 0.00004;
        for (const f of L) {
          const ang = noise(f.x * 0.004, f.y * 0.006, z) * 1.6;
          f.vx += (Math.cos(ang) * 0.16 + 0.12 - f.vx) * 0.01 * k;
          f.vy += (Math.sin(ang) * 0.10 - f.vy) * 0.01 * k;
          const n = near(S, f.x, f.y, 70); if (n) { const dx = f.x - S.p.x, dy = f.y - S.p.y, d = Math.hypot(dx, dy) || 1; f.vx += dx / d * n * 0.05; f.vy += dy / d * n * 0.05; }
        }
        // new ties when leaves touch
        for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
          const a = L[i], b = L[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 32 && d > 16) { const f = 0.00025 * k * (1 - d / 32), ux = (b.x - a.x) / d, uy = (b.y - a.y) / d; a.vx += ux * f; a.vy += uy * f; b.vx -= ux * f; b.vy -= uy * f; }   // floating things drift together
          if (d < 15 && a.deg < 2 && b.deg < 2 && !tieSet.has(key(i, j)) && Math.random() < 0.008 * k) { ties.push([i, j, 0]); tieSet.add(key(i, j)); a.deg++; b.deg++; }
          else if (d < 22) { const push = (22 - d) / 22 * 0.03 * k, ux = (a.x - b.x) / (d || 1), uy = (a.y - b.y) / (d || 1); a.vx += ux * push; a.vy += uy * push; b.vx -= ux * push; b.vy -= uy * push; }
        }
        // ties pull gently toward rest length, share velocity and slowly align
        ties = ties.filter((tie) => {
          const [i, j] = tie, a = L[i], b = L[j]; tie[2] = Math.min(1, tie[2] + dt * 0.0008);
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
          if (d > 60 || Math.random() < dt * 0.00006) { tieSet.delete(key(i, j)); a.deg--; b.deg--; return false; }
          const f = (d - 17) * 0.002 * k; a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
          const mvx = (a.vx + b.vx) / 2, mvy = (a.vy + b.vy) / 2; a.vx += (mvx - a.vx) * 0.05; b.vx += (mvx - b.vx) * 0.05; a.vy += (mvy - a.vy) * 0.05; b.vy += (mvy - b.vy) * 0.05;
          const da = Math.atan2(Math.sin(b.a - a.a), Math.cos(b.a - a.a)) * 0.004 * k; a.a += da; b.a -= da;
          return true;
        });
        for (const f of L) {
          f.x += f.vx * k; f.y += f.vy * k; f.a += Math.sin(t * 0.0003 + f.s) * 0.0015 * k;
          if (f.y < 10) f.vy += 0.01 * k; if (f.y > S.F - 6) f.vy -= 0.01 * k;
          if (f.x > S.W + 25) { f.x -= S.W + 50; for (const tie of ties) if (L[tie[0]] === f || L[tie[1]] === f) tie[2] = -1; }
          if (f.x < -25) f.x += S.W + 50;
        }
        ties = ties.filter((tie) => { if (tie[2] >= 0) return true; tieSet.delete(key(tie[0], tie[1])); L[tie[0]].deg--; L[tie[1]].deg--; return false; });
      },
      draw(ctx, t, C) {
        (BG[S.bg] || BG.wash)(ctx, t, C, S);
        for (const f of L) leaf(ctx, f.x, f.y, f.a, f.s, C[f.c], 0.8);
      },
    };
  };

  // ---------------- D. Canopy ----------------
  // Looking up into a tree: a loose lattice of leaves sways as breezes pass through,
  // and patches slowly turn gold and back. The cursor rustles the leaves.
  SIMS.canopy = (S) => {
    let Ls = [];
    return {
      init() {
        Ls = []; const gap = 17;
        for (let y = 10; y < S.F - 4; y += gap * 0.86) for (let x = (Math.round(y / gap) % 2) * gap / 2; x < S.W + gap; x += gap)
          if (noise(x * 0.008, y * 0.012, 4) > -0.28) Ls.push({ x: x + rand(-3, 3), y: y + rand(-3, 3), a: rand(-0.9, 0.9) - Math.PI / 2, s: rand(5, 7.5), rus: 0, hue: noise(x * 0.01, y * 0.01, 12) });
      },
      update(t, dt) { for (const l of Ls) { const n = near(S, l.x, l.y, 70); l.rus += (n - l.rus) * 0.05; } },
      draw(ctx, t, C) {
        for (const l of Ls) {
          const gust = Math.sin(t * 0.0005 - l.x * 0.008) * 0.5 + 0.5;
          const sway = Math.sin(t * 0.0021 + l.x * 0.05 + l.y * 0.03) * (0.06 + 0.22 * gust) + Math.sin(t * 0.009 + l.x) * 0.25 * l.rus;
          const season = clamp((Math.sin(t * 0.00006 + l.hue * 3) - 0.35) * 1.6);   // slow gold patches
          leaf(ctx, l.x, l.y, l.a + sway, l.s, mix(C.green, C.gold, season), 0.55 + 0.2 * gust);
        }
      },
    };
  };

  // ---------------- E. Dandelion seeds ----------------
  // Seeds carried across on a light breeze, rising and dipping. The cursor blows them on.
  SIMS.seeds = (S) => {
    let P = [];
    const mk = (x) => ({ x, y: rand(16, S.F - 10), vx: rand(0.008, 0.016), ph: rand(0, TAU), s: rand(5, 8), a: rand(-0.3, 0.3), px: 0, py: 0, c: Math.random() < 0.25 ? "gold" : "ink" });
    return {
      init() { P = Array.from({ length: Math.round(Math.min(26, Math.max(10, S.W / 35))) }, () => mk(rand(0, S.W))); },
      update(t, dt) {
        for (const p of P) {
          const n = near(S, p.x, p.y, 80);
          if (n) { const dx = p.x - S.p.x, dy = p.y - S.p.y, d = Math.hypot(dx, dy) || 1; p.px += dx / d * n * 0.06; p.py += dy / d * n * 0.06; }
          p.px *= 0.96; p.py *= 0.96;
          p.x += p.vx * dt + p.px; p.y += Math.sin(t * 0.0007 + p.ph) * 0.12 + noise(p.x * 0.004, t * 0.00005, p.ph) * 0.1 + p.py;
          if (p.y < 12) p.y += 0.3; if (p.y > S.F - 6) p.y -= 0.3;
          if (p.x > S.W + 20) Object.assign(p, mk(-20));
        }
      },
      draw(ctx, t, C) {
        ctx.lineCap = "round";
        for (const p of P) {
          const col = C[p.c === "gold" ? "gold" : "ink"], tilt = p.a + Math.sin(t * 0.0009 + p.ph) * 0.25;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(tilt);
          ctx.strokeStyle = rgba(col, 0.55); ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, p.s * 1.3); ctx.stroke();                     // stalk
          ctx.fillStyle = rgba(C.green, 0.8); ctx.beginPath(); ctx.ellipse(0, p.s * 1.4, 1.1, 2, 0, 0, TAU); ctx.fill(); // seed
          ctx.strokeStyle = rgba(col, 0.45); ctx.lineWidth = 0.7;
          for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.33; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * p.s, Math.sin(a) * p.s * 0.8); ctx.stroke(); }
          ctx.restore();
        }
      },
    };
  };

  // ---------------- runner ----------------
  const run = (canvas) => {
    const make = SIMS[canvas.dataset.sim];
    if (!make) return;
    const ctx = canvas.getContext("2d");
    const S = { W: 0, H: 0, F: 0, p: { x: -1e4, y: -1e4 }, bg: canvas.dataset.bg || "wash" };
    const sim = make(S); let C = colors();
    const resize = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      S.W = r.width; S.H = r.height; canvas.width = Math.round(S.W * dpr); canvas.height = Math.round(S.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const txt = canvas.parentElement.querySelector(".hero-text");
      S.F = Math.min(S.H * 0.62, txt ? txt.getBoundingClientRect().top - r.top - 14 : S.H * 0.62);
      sim.init();
    };
    const frame = (t) => { ctx.clearRect(0, 0, S.W, S.H); sim.draw(ctx, t, C); };
    let running = false, visible = true, prev = 0;
    const loop = (t) => { if (!running) return; const dt = Math.min(50, t - (prev || t)); prev = t; sim.update(t, dt); frame(t); requestAnimationFrame(loop); };
    const start = () => { if (!running && visible && !document.hidden && !reduce) { running = true; prev = 0; requestAnimationFrame(loop); } };
    const stop = () => { running = false; };
    resize(); sim.update(performance.now(), 16); frame(performance.now());
    addEventListener("resize", () => { resize(); frame(performance.now()); });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { C = colors(); });
    const host = canvas.parentElement;
    const move = (e) => { const r = canvas.getBoundingClientRect(), q = e.touches ? e.touches[0] : e; S.p.x = q.clientX - r.left; S.p.y = q.clientY - r.top; };
    host.addEventListener("pointermove", move);
    host.addEventListener("touchmove", move, { passive: true });
    host.addEventListener("pointerleave", () => { S.p.x = S.p.y = -1e4; });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
    start();
  };

  document.querySelectorAll("canvas[data-sim]").forEach(run);
})();
