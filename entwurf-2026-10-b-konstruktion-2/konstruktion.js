// Konstruktionen für Entwurf B Konstruktion 2.
// Jede Konstruktion ist EIN Linien-Objekt (Quads mit fester Pixelbreite), das Wachsen und Abbauen läuft im Vertex-Shader.
// Gezeichnet wird in Bildschirmkoordinaten der Ruhestellung (px) plus Tiefe z: So lassen sich Grundlinien, Versalhöhen
// und Kanten der Typografie exakt aufnehmen und von dort in den Raum weiterführen.
import * as THREE from "three";

export const LINE_VERT = `
  attribute vec3 aA; attribute vec3 aB; attribute vec4 aInfo; attribute vec2 aV;
  uniform float uProg; uniform float uOut; uniform vec2 uRes; uniform float uPR;
  varying float vAlpha; varying float vSide; varying float vHW; varying float vCore; varying float vDepth;
  void main() {
    float p = clamp((uProg - aInfo.x) / max(aInfo.y, 1e-4), 0.0, 1.0);
    float q = clamp((uOut - (1.0 - aInfo.x - aInfo.y)) / max(aInfo.y, 1e-4), 0.0, 1.0);
    float f = (p * (2.0 - p)) * (1.0 - q);
    if (f < 0.002) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vAlpha = 0.0; vSide = 0.0; vHW = 1.0; vCore = 0.0; vDepth = 1.0; return; }
    vec3 head = mix(aA, aB, f);
    vec4 m0 = modelViewMatrix * vec4(aA, 1.0);
    vec4 m1 = modelViewMatrix * vec4(head, 1.0);
    vec4 c0 = projectionMatrix * m0;
    vec4 c1 = projectionMatrix * m1;
    if (c0.w < 0.2 || c1.w < 0.2) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vAlpha = 0.0; vSide = 0.0; vHW = 1.0; vCore = 0.0; vDepth = 1.0; return; }
    vec2 s0 = c0.xy / c0.w * uRes * 0.5;
    vec2 s1 = c1.xy / c1.w * uRes * 0.5;
    vec2 dir = s1 - s0; float len = length(dir);
    dir = len > 1e-4 ? dir / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float core = aInfo.w * uPR * 0.5;
    float hw = core + 0.75;
    bool atHead = aV.x > 0.5;
    vec2 sp = (atHead ? s1 : s0) + dir * (atHead ? 1.0 : -1.0) * (core * 0.6) + nrm * aV.y * hw;
    float cw = atHead ? c1.w : c0.w;
    float cz = atHead ? c1.z : c0.z;
    gl_Position = vec4(sp / (uRes * 0.5) * cw, cz, cw);
    vDepth = -(atHead ? m1.z : m0.z);
    vAlpha = aInfo.z * (1.0 + 0.4 * (1.0 - step(0.999, p * (1.0 - q))) * (1.0 - step(0.001, q)));
    vSide = aV.y; vHW = hw; vCore = core;
  }`;
export const LINE_FRAG = `
  uniform vec3 uColor; uniform float uGain;
  varying float vAlpha; varying float vSide; varying float vHW; varying float vCore; varying float vDepth;
  void main() {
    float dist = abs(vSide) * vHW;
    float cov = clamp(vCore + 0.5 - dist, 0.0, 1.0);
    float a = vAlpha * cov * uGain * smoothstep(0.5, 2.5, vDepth);
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, min(a, 1.0));
    #include <colorspace_fragment>
  }`;

export function lineMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uProg: { value: 0 }, uOut: { value: 0 }, uColor: { value: color }, uGain: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) }, uPR: { value: 1 } },
    vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide
  });
}

// Linienstile: [Deckkraft, Strichstärke in px]
export const ST = [.96, 2.1], NM = [.82, 1.4], TH = [.5, 1.05], GH = [.2, 1.0];

// ---------- Generator ----------
function Gen(P) {
  const segs = [];
  const v3 = a => [a[0], a[1], a[2] || 0];
  const g = {
    segs,
    // Linie a -> b, wächst von a aus. t0/d: Zeitfenster (0..1) im Fortschritt der Konstruktion
    L(a, b, t0, d, st = NM) { segs.push({ a: v3(a), b: v3(b), t0, d: Math.max(d, .01), al: st[0], w: st[1] }); },
    poly(pts, t0, d, st = NM) {
      let tot = 0; const ls = [];
      for (let i = 1; i < pts.length; i++) { const a = v3(pts[i - 1]), b = v3(pts[i]); const l = Math.hypot(b[0] - a[0], b[1] - a[1], (b[2] - a[2]) * .6); ls.push(l); tot += l; }
      let cum = 0;
      for (let i = 1; i < pts.length; i++) { g.L(pts[i - 1], pts[i], t0 + d * cum / (tot || 1), Math.max(.012, d * ls[i - 1] / (tot || 1)), st); cum += ls[i - 1]; }
    },
    // gestrichelt (für Blasses)
    dash(a, b, t0, d, st = GH, len = 9, gap = 7) {
      a = v3(a); b = v3(b);
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l / (len + gap)));
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = f0 + (len / (len + gap)) / n;
        g.L([a[0] + (b[0] - a[0]) * f0, a[1] + (b[1] - a[1]) * f0, a[2] + (b[2] - a[2]) * f0], [a[0] + (b[0] - a[0]) * f1, a[1] + (b[1] - a[1]) * f1, a[2] + (b[2] - a[2]) * f1], t0 + d * f0 * .8, d * .25, st);
      }
    },
    rect(x0, x1, yT, yB, z, t0, d, st = NM) { g.poly([[x0, yB, z], [x1, yB, z], [x1, yT, z], [x0, yT, z], [x0, yB, z]], t0, d, st); },
    flat(x0, x1, y, z0, z1, t0, d, st = NM) { g.poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]], t0, d, st); },
    // Quader: Vorderfläche bei z0, Rückfläche bei z1
    box(x0, x1, yT, yB, z0, z1, t0, d, st = NM, o = {}) {
      g.flat(x0, x1, yB, z0, z1, t0, d * .3, o.stB || st);
      for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) g.L([x, yB, z], [x, yT, z], t0 + d * .25, d * .4, st);
      g.flat(x0, x1, yT, z0, z1, t0 + d * .6, d * .4, o.stT || st);
    },
    // Satteldach über Rechteckgrundriss (Giebel zur Vorderfläche)
    gable(x0, x1, yE, yR, z0, z1, t0, d, st = NM) {
      const xm = (x0 + x1) / 2;
      g.poly([[x0, yE, z0], [xm, yR, z0], [x1, yE, z0]], t0, d * .4, st);
      g.poly([[x0, yE, z1], [xm, yR, z1], [x1, yE, z1]], t0 + d * .2, d * .4, st);
      g.L([xm, yR, z0], [xm, yR, z1], t0 + d * .55, d * .45, st);
    },
    arc(cx, cy, r, a0, a1, z, steps, t0, d, st = NM) {
      const pts = [];
      for (let i = 0; i <= steps; i++) { const a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180; pts.push([cx + Math.cos(a) * r, cy - Math.sin(a) * r, z]); }
      g.poly(pts, t0, d, st);
    },
    win(x, y, w, h, z, t0, d, st = TH, mull = true) {
      g.rect(x, x + w, y, y + h, z, t0, d, st);
      if (mull) g.L([x + w / 2, y, z], [x + w / 2, y + h, z], t0 + d * .5, d * .5, st);
    },
    finish() {
      const n = segs.length, A = new Float32Array(n * 12), B = new Float32Array(n * 12), I = new Float32Array(n * 16), V = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
      segs.forEach((s, i) => {
        if (s.t0 + s.d > 1) s.t0 = Math.max(0, 1 - s.d);
        const a = P(s.a[0], s.a[1], s.a[2]), b = P(s.b[0], s.b[1], s.b[2]);
        const corners = [[0, -1], [0, 1], [1, -1], [1, 1]];
        for (let k = 0; k < 4; k++) {
          A.set(a, i * 12 + k * 3); B.set(b, i * 12 + k * 3);
          I.set([s.t0, s.d, s.al, s.w], i * 16 + k * 4);
          V.set(corners[k], i * 8 + k * 2);
        }
        const o = i * 4; idx.set([o, o + 1, o + 2, o + 2, o + 1, o + 3], i * 6);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(A, 3));
      geo.setAttribute("aA", new THREE.BufferAttribute(A, 3));
      geo.setAttribute("aB", new THREE.BufferAttribute(B, 3));
      geo.setAttribute("aInfo", new THREE.BufferAttribute(I, 4));
      geo.setAttribute("aV", new THREE.BufferAttribute(V, 2));
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      return geo;
    }
  };
  return g;
}

// ---------- Gemeinsame Bauteile ----------
// Haus mit Dach: kind = gable | barn | tower | shed | hip | flat
function house(g, x, w, hWall, hRoof, d, kind, base, t0, du, st = NM) {
  const yE = base - hWall, z0 = 0, z1 = d;
  g.box(x, x + w, yE, base, z0, z1, t0, du * .5, st);
  const t1 = t0 + du * .45, dd = du * .55;
  if (kind === "gable") {
    g.gable(x, x + w, yE, yE - hRoof, z0, z1, t1, dd, st);
    g.rect(x + w * .66, x + w * .78, yE - hRoof * .95, yE - hRoof * .45, d * .3, t1 + dd * .6, dd * .3, st); // Schornstein
  } else if (kind === "barn") {
    const xm = x + w / 2, k = hRoof;
    const prof = z => [[x, yE, z], [x + w * .12, yE - k * .62, z], [xm, yE - k, z], [x + w * .88, yE - k * .62, z], [x + w, yE, z]];
    g.poly(prof(z0), t1, dd * .4, st); g.poly(prof(z1), t1 + dd * .2, dd * .4, st);
    g.L([xm, yE - k, z0], [xm, yE - k, z1], t1 + dd * .55, dd * .4, st);
    g.L([x + w * .12, yE - k * .62, z0], [x + w * .12, yE - k * .62, z1], t1 + dd * .6, dd * .4, TH);
    g.L([x + w * .88, yE - k * .62, z0], [x + w * .88, yE - k * .62, z1], t1 + dd * .6, dd * .4, TH);
    g.rect(x + w * .34, x + w * .66, base - hWall * .72, base, z0, t1 + dd * .5, dd * .4, TH); // Tor
  } else if (kind === "tower") {
    const xm = x + w / 2;
    g.L([xm, yE, d / 2], [xm, yE - hRoof * 1.6, d / 2], t1, dd * .6, NM);
    g.flat(x - w * .08, x + w * 1.08, yE, -4, d + 4, t1 + dd * .3, dd * .5, TH);
    for (const f of [.3, .55, .8]) g.L([x, base - hWall * f, z0], [x + w, base - hWall * f, z0], t1, dd * .6, TH);
  } else if (kind === "shed") {
    const n = 3, tw = w / n, pts = z => { const p = [[x, yE, z]]; for (let i = 0; i < n; i++) { p.push([x + tw * i, yE - hRoof, z]); p.push([x + tw * (i + 1), yE, z]); } return p; };
    g.poly(pts(z0), t1, dd * .5, st); g.poly(pts(z1), t1 + dd * .2, dd * .5, st);
    for (let i = 0; i < n; i++) g.L([x + tw * i, yE - hRoof, z0], [x + tw * i, yE - hRoof, z1], t1 + dd * (.5 + .1 * i), dd * .3, TH);
  } else if (kind === "hip") {
    const yR = yE - hRoof, rl = [x + w * .28, yR, d / 2], rr = [x + w * .72, yR, d / 2];
    g.L(rl, rr, t1, dd * .4, st);
    for (const [cx, cz, e] of [[x, z0, rl], [x, z1, rl], [x + w, z0, rr], [x + w, z1, rr]]) g.L([cx, yE, cz], e, t1 + dd * .3, dd * .5, st);
    g.L([x, yE, z0], [x + w, yE, z0], t1, dd * .3, TH);
  } else if (kind === "ell") {
    g.box(x + w * .55, x + w * 1.05, yE + hWall * .3, base, d * .5, d * 1.7, t1, dd * .8, st);
    g.L([x - 5, yE, z0], [x + w * .6 + 5, yE, z0], t1 + dd * .3, dd * .4, TH);
  } else {
    g.L([x - 5, yE, z0], [x + w + 5, yE, z0], t1, dd * .5, TH);
  }
  // wenige Fenster
  const nw = Math.max(1, Math.round(w / 70));
  for (let i = 0; i < nw; i++) {
    const ww = Math.min(24, w / (nw * 2)), xx = x + (i + .5) * w / nw - ww / 2;
    if (kind === "barn" && i === Math.floor(nw / 2)) continue;
    g.win(xx, base - hWall * .62, ww, hWall * .3, z0, t0 + du * .8, du * .2, TH, false);
  }
}

// Gerüst um einen Baukörper
function scaffold(g, x0, x1, levels, zB, t0, d, nb, st = NM) {
  const top = levels[levels.length - 1], base = levels[0];
  const xs = []; for (let i = 0; i <= nb; i++) xs.push(x0 + (x1 - x0) * i / nb);
  xs.forEach((x, i) => {
    g.L([x, base, 0], [x, top - 14, 0], t0 + d * .05 * i, d * .3, i === 0 || i === nb ? ST : st);
    g.L([x, base, zB], [x, top - 14, zB], t0 + d * (.18 + .05 * i), d * .3, TH);
  });
  levels.forEach((y, k) => {
    const tk = t0 + d * (.35 + .12 * k);
    g.L([x0, y, 0], [x1, y, 0], tk, d * .22, k === 0 ? ST : NM);
    g.L([x0, y, zB], [x1, y, zB], tk + d * .04, d * .22, TH);
    for (const x of xs) g.L([x, y, 0], [x, y, zB], tk + d * .08, d * .15, TH);
  });
  for (let i = 0; i < nb; i++) { const ya = levels[0], yb = levels[levels.length - 1]; if (i % 2 === 0) g.L([xs[i], ya, 0], [xs[i + 1], yb, 0], t0 + d * (.8 + .03 * i), d * .2, TH); else g.L([xs[i + 1], ya, 0], [xs[i], yb, 0], t0 + d * (.8 + .03 * i), d * .2, TH); }
}

// ---------- Konstruktionen ----------
// Jeder Eintrag: { zd: [kx, ky] Tiefenrichtung, fn(g, c) }
// c: x0, x1, top, base, w, h (Region), cap/hb/lb (Typografie: Versalhöhe, Grundlinie der Überschrift, Grundlinie der letzten Zeile),
//    lead(y, xTo, t0, d, st): Linie von der Schrift weg in den Raum, narrow, W, H, T (Rohdaten)
export const BUILDERS = {
  // Einstieg: Grundlinie und Versalhöhe des Namens werden zu Sockel und Balken des ersten Rahmens
  start: {
    zd: [0, 0],
    fn(g, c) {
      const { T, narrow } = c;
      const l1 = T.l1, l2 = T.l2;
      let xa, xb, yT, yB;
      if (!narrow) { xa = T.px0; xb = T.px1 - 10; yT = l1.cap; yB = l2.base; }
      else { xa = c.x0; xb = c.x1; yT = l2.base; yB = Math.min(c.base, yT + 170); }
      const zA = (xb - xa) * .24;
      // 1. Die Linien der Schrift laufen hinaus
      if (!narrow) {
        g.L([l1.x1 + 16, l1.cap, 0], [xb + 40, l1.cap, 0], 0, .22, ST);
        g.L([l2.x1 + 16, l2.base, 0], [xb + 40, l2.base, 0], 0.02, .22, ST);
        g.L([l1.x1 + 16, l1.base, 0], [xb, l1.base, 0], .06, .2, TH);
        g.L([l2.x1 + 16, l2.cap, 0], [xb, l2.cap, 0], .08, .2, TH);
      } else {
        g.L([l2.x1 + 12, l2.base, 0], [xb + 4, l2.base, 0], 0, .2, ST);
        g.L([l1.x1 + 12, l1.cap, 0], [xb + 4, l1.cap, 0], .04, .2, TH);
      }
      // 2. Daraus wächst der erste Rahmen
      g.L([xa, yB, 0], [xa, yT, 0], .22, .2, ST); g.L([xb, yB, 0], [xb, yT, 0], .26, .2, ST);
      if (narrow) { g.L([xa - 6, yB, 0], [xb + 6, yB, 0], .3, .16, ST); }
      // 3. Folgerahmen in der Tiefe
      for (let k = 1; k <= (narrow ? 2 : 3); k++) {
        const z = zA * k, t = .42 + .14 * (k - 1), al = [.82 - .16 * k, 1.3 - .1 * k];
        g.L([xa, yB, z], [xa, yT, z], t, .14, al); g.L([xb, yB, z], [xb, yT, z], t + .02, .14, al);
        g.L([xa, yT, z], [xb, yT, z], t + .05, .12, al);
        g.L([xa, yB, z], [xb, yB, z], t + .06, .12, [al[0] * .7, al[1]]);
      }
      for (const [x, y] of [[xa, yT], [xb, yT], [xa, yB], [xb, yB]]) g.L([x, y, 0], [x, y, zA * (narrow ? 2 : 3)], .7, .26, TH);
      // Aussteifung im ersten Feld
      if (!narrow) g.L([xa, yB, 0], [xb, yT, 0], .86, .14, TH);
    }
  },

  // Gerwing: Fläche wird in Steine geteilt, Stufen daneben, Bilder hängen wie Pläne
  gerwing: {
    zd: [0, 1.5],
    fn(g, c) {
      const { x0, x1, base, w, h, narrow } = c;
      const pw = w * (narrow ? .6 : .62), px0 = x0, px1 = x0 + pw;
      const rows = 5, Zp = narrow ? Math.min(h * .4, 120) : 128, rz = Zp / rows, cw = pw / 4;
      c.lead(base, px0, 0, .12, ST);
      // Fläche, dann Reihe für Reihe im Verband
      g.flat(px0, px1, base, 0, Zp, .02, .22, ST);
      for (let r = 0; r <= rows; r++) {
        const t = .22 + .55 * r / rows;
        if (r > 0) g.L([px0, base, rz * r], [px1, base, rz * r], t, .08, NM);
        if (r < rows) for (let k = 0; k <= 4; k++) {
          const x = px0 + (r % 2 ? cw * .5 : 0) + k * cw; if (x <= px0 + 2 || x >= px1 - 2) continue;
          g.L([x, base, rz * r], [x, base, rz * (r + 1)], t + .02, .08, TH);
        }
      }
      // Stufen als Seitenansicht
      const sx0 = px1 + (narrow ? 12 : 40), sw = x1 - sx0, ns = 4, rise = narrow ? Math.min(h * .1, 26) : 34, run = sw / ns, zS = narrow ? 26 : 44;
      const prof = [[sx0, base, 0]];
      for (let k = 0; k < ns; k++) { prof.push([sx0 + run * k, base - rise * (k + 1), 0]); prof.push([sx0 + run * (k + 1), base - rise * (k + 1), 0]); }
      prof.push([x1, base, 0], [sx0, base, 0]);
      g.poly(prof, .5, .3, ST);
      for (let k = 0; k <= ns; k++) { const yy = base - rise * Math.min(k + 1, ns); const xx = k === ns ? x1 : sx0 + run * k; g.L([xx, yy, 0], [xx, yy, zS], .62 + .05 * k, .08, TH); }
      g.L([x1, base, 0], [x1, base, zS], .76, .1, TH); g.L([x1, base - rise * ns, zS], [x1, base, zS], .8, .1, TH);
      // Aufhängung der Pläne: Schiene in Höhe der Überschrift-Grundlinie, daran hängen die Shopbilder
      const railY = narrow ? c.top : c.hb;
      c.lead(railY, x1 - 6, .3, .22, NM);
      const aw = narrow ? w * .54 : Math.min(300, w * .56), ah = aw / (1905 / 880), bw2 = aw * .5, bh2 = bw2 / (805 / 575);
      const ay = railY + (narrow ? 34 : 46), by = narrow ? ay + 4 : ay + 30;
      g.images = [
        { id: "a", x: x0 + (narrow ? 0 : 6), y: ay, w: aw, h: ah, t: .6 },
        { id: "b", x: x1 - bw2 - (narrow ? 0 : 6), y: by, w: bw2, h: bh2, t: .7 }
      ];
      for (const im of g.images) {
        const ax = im.x + im.w / 2;
        g.L([im.x, im.y, 0], [ax, railY, 0], im.t - .1, .12, TH); g.L([im.x + im.w, im.y, 0], [ax, railY, 0], im.t - .08, .12, TH);
        g.rect(im.x - 3, im.x + im.w + 3, im.y - 3, im.y + im.h + 3, 0, im.t, .14, NM);
      }
    }
  },

  // Betreuung und Absicherung: Gerüst und Einhausung um einen bestehenden Baukörper
  betreuung: {
    zd: [0, 0],
    fn(g, c) {
      const { x0, x1, top, base, w, h } = c, X = a => x0 + a * w, zB = w * .2;
      const mid = c.narrow ? base - h * .5 : c.hb;
      // Grundlinie der Schrift führt zum Gerüstboden, Grundlinie der Überschrift zum Belag
      c.lead(base, X(.04), 0, .12, ST); if (!c.narrow) c.lead(c.hb, X(.04), .05, .12, NM);
      // bestehender Baukörper
      const bt = base - h * .7;
      g.box(X(.24), X(.72), bt, base, zB * .35, zB * .95, .02, .28, NM);
      g.gable(X(.24), X(.72), bt, bt - h * .17, zB * .35, zB * .95, .2, .12, NM);
      g.win(X(.32), base - h * .5, w * .08, h * .17, zB * .35, .24, .08, TH, false); g.win(X(.54), base - h * .5, w * .08, h * .17, zB * .35, .26, .08, TH, false);
      g.rect(X(.44), X(.5), base - h * .3, base, zB * .35, .28, .06, TH);
      // Gerüst
      scaffold(g, X(.06), X(.9), [base, mid, top], zB, .3, .5, 5);
      if (!c.narrow && c.cap > top + 14 && c.cap < mid - 10) { g.L([X(.06), c.cap, 0], [X(.9), c.cap, 0], .5, .2, TH); g.L([X(.06), c.cap, zB], [X(.9), c.cap, zB], .52, .2, GH); }
      // Einhausung
      const yR = top - h * .26, tt = .78;
      g.poly([[X(.04), top, 0], [X(.48), yR, 0], [X(.92), top, 0]], tt, .1, ST);
      g.poly([[X(.04), top, zB], [X(.48), yR, zB], [X(.92), top, zB]], tt + .04, .1, NM);
      g.L([X(.48), yR, 0], [X(.48), yR, zB], tt + .08, .08, ST);
      g.L([X(.04), top, 0], [X(.04), top, zB], tt + .1, .06, NM); g.L([X(.92), top, 0], [X(.92), top, zB], tt + .1, .06, NM);
    }
  },

  // Modernisierung: alter Baukörper steht blass dahinter, eine neue, saubere Struktur zeichnet sich darüber
  modern: {
    zd: [0, 0],
    fn(g, c) {
      const { x0, x1, top, base, w, h } = c, X = a => x0 + a * w, zO = w * .22;
      c.lead(base, X(.04), 0, .12, ST); if (!c.narrow) c.lead(c.hb, X(.4), .04, .12, NM);
      // alt: schief, blass
      const ob = base - h * .62, ox0 = X(.0), ox1 = X(.5);
      g.poly([[ox0, base, zO], [ox0 + 2, ob + 3, zO], [ox1 - 3, ob - 5, zO], [ox1, base, zO]], 0, .26, GH);
      g.poly([[ox0 - 8, ob + 6, zO], [X(.3), ob - h * .24, zO], [ox1 + 8, ob - 6, zO]], .14, .14, GH);
      g.rect(X(.46), X(.5), ob - h * .3, ob - h * .1, zO, .22, .06, GH);
      g.L([ox0, base, zO], [ox0 + 30, base, zO + 90], .1, .12, GH); g.L([ox1, base, zO], [ox1 + 16, base, zO + 90], .1, .12, GH);
      for (const [wx, wy, ww, wh] of [[.1, .3, .08, .12], [.24, .34, .1, .09], [.38, .29, .07, .14]]) g.win(X(wx), base - h * wy - h * wh, w * ww, h * wh, zO, .26, .1, GH, false);
      // neu: klare Struktur, Geschosshöhen an der Schrift
      const nx0 = X(.42), nx1 = X(1), nt = top, ys = c.narrow ? [base, base - h * .45, nt] : [base, c.hb, nt];
      g.box(nx0, nx1, nt, base, 0, w * .2, .3, .32, ST);
      for (let i = 1; i < ys.length - 1; i++) g.L([nx0, ys[i], 0], [nx1, ys[i], 0], .5, .12, NM);
      g.L([nx0, nt - 10, 0], [nx1 + 8, nt - 10, 0], .66, .12, TH);
      const nwx = 4;
      for (let i = 0; i < nwx; i++) {
        const ww = (nx1 - nx0) / nwx * .56, xx = nx0 + (nx1 - nx0) / nwx * (i + .22);
        g.win(xx, ys[1] + (ys[0] - ys[1]) * .22, ww, (ys[0] - ys[1]) * .5, 0, .62 + .05 * i, .1, NM, true);
      }
      g.L([X(.26), base, 0], [nx0, base, 0], .3, .06, ST);
      g.poly([[nx0, nt, w * .2], [nx0 + 20, nt - 26, w * .2], [nx1 - 20, nt - 26, w * .2], [nx1, nt, w * .2]], .8, .12, TH);
    }
  },

  // Shops und Shop-Wechsel: zwei Baukörper, Bauteile wandern vom einen in den anderen
  shops: {
    zd: [0, 0],
    fn(g, c) {
      const { x0, x1, base, w, h } = c;
      const bw = Math.min(w * .3, 170), bh = Math.min(h, bw * 1.5), zD = bw * .4;
      const ax0 = x0, ax1 = x0 + bw, bx0 = x1 - bw, bx1 = x1, bt = base - bh;
      c.lead(base, ax0 - 8, 0, .12, ST);
      g.L([ax0 - 8, base, 0], [bx1 + 8, base, 0], .02, .2, NM);
      g.box(ax0, ax1, bt, base, 0, zD, .04, .26, NM);
      g.box(bx0, bx1, bt, base, 0, zD, .2, .26, ST);
      const n = 3, cwd = bw / n, chh = bh / n;
      for (let i = 1; i < n; i++) {
        g.L([ax0 + cwd * i, bt, 0], [ax0 + cwd * i, base, 0], .3, .1, TH); g.L([bx0 + cwd * i, bt, 0], [bx0 + cwd * i, base, 0], .4, .1, TH);
        g.L([ax0, bt + chh * i, 0], [ax1, bt + chh * i, 0], .32, .1, TH); g.L([bx0, bt + chh * i, 0], [bx1, bt + chh * i, 0], .42, .1, TH);
      }
      const cen = (x, col, row) => [x + cwd * (col + .5), bt + chh * (row + .5)];
      const pairs = [[[0, 0], [2, 0]], [[2, 1], [0, 1]], [[1, 2], [1, 1]]], s = Math.min(cwd, chh) * .6;
      c.movers = pairs.map(([a, b], k) => {
        const f = cen(ax0, a[0], a[1]), t = cen(bx0, b[0], b[1]), ts = .5 + .12 * k, te = ts + .22;
        const ctrl = [(f[0] + t[0]) / 2, Math.min(f[1], t[1]) - h * .5 - k * 14, 0];
        // Bahn
        const pts = []; for (let i = 0; i <= 18; i++) { const u = i / 18, v = 1 - u; pts.push([v * v * f[0] + 2 * v * u * ctrl[0] + u * u * t[0], v * v * f[1] + 2 * v * u * ctrl[1] + u * u * t[1], 0]); }
        g.poly(pts, ts - .06, .2, [.34, 1]);
        // leerer Platz im alten Shop, gefüllter im neuen
        for (const [p, q] of [[[f[0] - s / 2, f[1] - s / 2], [f[0] + s / 2, f[1] - s / 2]], [[f[0] + s / 2, f[1] - s / 2], [f[0] + s / 2, f[1] + s / 2]], [[f[0] + s / 2, f[1] + s / 2], [f[0] - s / 2, f[1] + s / 2]], [[f[0] - s / 2, f[1] + s / 2], [f[0] - s / 2, f[1] - s / 2]]]) g.dash([p[0], p[1], 0], [q[0], q[1], 0], ts - .02, .1, [.45, 1], 5, 4);
        g.rect(t[0] - s / 2, t[0] + s / 2, t[1] - s / 2, t[1] + s / 2, 0, Math.min(.92, te), .08, ST);
        return { ts, te, from: f, to: t, ctrl, s };
      });
    }
  },

  // Schnittstellen und eigene Werkzeuge: getrennte Bauten, durch Stege verbunden
  schnitt: {
    zd: [0, 0],
    fn(g, c) {
      const { x0, x1, top, base, w, h } = c, X = a => x0 + a * w;
      c.lead(base, X(.02), 0, .12, ST); g.L([X(0), base, 0], [x1, base, 0], .02, .2, NM);
      const lvl = c.narrow ? base - h * .45 : c.hb;
      const bw = w * .17, gp = (w - 4 * bw) / 3;
      const B = [
        { x: X(0), w: bw, h: h * 1.0, d: w * .1 },
        { x: x0 + (bw + gp), w: bw, h: h * .58, d: w * .1 },
        { x: x0 + (bw + gp) * 2, w: bw, h: h * .82, d: w * .1 },
        { x: x0 + (bw + gp) * 3, w: bw, h: h * .5, d: w * .1 }
      ];
      B.forEach((b, i) => { g.box(b.x, b.x + b.w, base - b.h, base, 0, b.d, .04 + .1 * i, .26, NM); for (const f of [.34, .68]) g.L([b.x, base - b.h * f, 0], [b.x + b.w, base - b.h * f, 0], .22 + .1 * i, .06, TH); });
      // Stege: Doppelline mit Stützen, Verbindungsträger; jeder auf eigener Höhe
      const bridge = (xa, xb, y, t) => {
        g.L([xa, y, 0], [xb, y, 0], t, .14, ST); g.L([xa, y + 8, 0], [xb, y + 8, 0], t + .02, .14, NM);
        const n = Math.max(2, Math.round((xb - xa) / 24)), pts = [[xa, y + 8, 0]];
        for (let i = 0; i < n; i++) { pts.push([xa + (xb - xa) * (i + .5) / n, y + 8 + 22, 0]); pts.push([xa + (xb - xa) * (i + 1) / n, y + 8, 0]); }
        g.poly(pts, t + .06, .16, TH);
        g.L([xa, y, 0], [xa, y + 8, 0], t, .04, ST); g.L([xb, y, 0], [xb, y + 8, 0], t, .04, ST);
      };
      bridge(B[0].x + B[0].w, B[1].x, lvl, .44);
      bridge(B[1].x + B[1].w, B[2].x, base - h * .4, .56);
      bridge(B[2].x + B[2].w, B[3].x, lvl + 30, .68);
    }
  },

  // Gestaltung: Proportionsraster mit Teilung und Fensterachsen legt sich auf die Fassade
  gestalt: {
    zd: [0, 0],
    fn(g, c) {
      const { x0, x1, top, base, w, h } = c, fx0 = x0 + w * .06, fx1 = x1 - w * .06, fw = fx1 - fx0, ft = top, fb = base;
      const yBand = c.narrow ? ft + h * .12 : c.hb, fh = fb - ft;
      c.lead(base, fx0, 0, .1, ST); if (!c.narrow) c.lead(c.hb, fx0 - 2, .03, .1, NM);
      g.box(fx0, fx1, ft, fb, 0, w * .1, .02, .3, ST);
      g.L([fx0, yBand, 0], [fx1, yBand, 0], .24, .1, NM);
      // Fensterachsen
      const nA = 5, axX = i => fx0 + fw * (.1 + .8 * i / (nA - 1)), fh2 = (fb - yBand);
      const floors = [yBand + fh2 * .08, yBand + fh2 * .52];
      for (const fy of floors) {
        for (let i = 0; i < nA; i++) { const ww = fw * .085; g.win(axX(i) - ww / 2, fy, ww, fh2 * .32, 0, .3 + .04 * i, .1, NM, true); }
      }
      g.rect(axX(2) - fw * .06, axX(2) + fw * .06, fb - fh2 * .24, fb, 0, .5, .1, NM);
      // Raster: Fensterachsen als Hilfslinien, goldene Teilung, Diagonalen
      const over = 26, gl = [.382, .618];
      nA && [0, 1, 2, 3, 4].forEach(i => g.L([axX(i), ft - over, 0], [axX(i), fb + over, 0], .58 + .02 * i, .12, TH));
      for (const gx of gl) g.L([fx0 + fw * gx, ft - over * 1.4, 0], [fx0 + fw * gx, fb + over * .6, 0], .7, .12, NM);
      g.L([fx0 - over, ft + fh * .382, 0], [fx1 + over, ft + fh * .382, 0], .76, .12, NM);
      g.L([fx0, fb, 0], [fx1, ft, 0], .84, .14, TH); g.L([fx0, ft, 0], [fx1, fb, 0], .86, .14, TH);
      g.L([fx0, fb, 0], [fx0 + fw * .5, ft, 0], .9, .1, GH); g.L([fx1, fb, 0], [fx0 + fw * .5, ft, 0], .9, .1, GH);
    }
  },

  // Weitere Arbeit: Reihe unterschiedlicher kleiner Häuser, je Zeile zwei
  weitere1: { zd: [0, 0], fn(g, c) { weitereRow(g, c, [["gable", .46, .5, .26, 0], ["barn", .46, .36, .22, 1]]); } },
  weitere2: { zd: [0, 0], fn(g, c) { weitereRow(g, c, [["tower", .24, .86, .12, 0], ["shed", .64, .4, .14, 1]]); } },
  weitere3: { zd: [0, 0], fn(g, c) { weitereRow(g, c, [["hip", .44, .5, .2, 0], ["ell", .34, .62, .0, 1]]); } },

  // Wie ich arbeite: Ein Grundriss am Boden wächst Schritt für Schritt zu Wänden und Raum (Plan -> Bau)
  arbeitsweise: {
    zd: c => [c.side === "r" ? -1.1 : 1.1, 1.8],
    fn(g, c) {
      const { x0, x1, base, w, h } = c;
      const Hz = Math.min(h * .36, 120), sh = Hz * .62, pH = Math.min(h * .55, 200);
      const fx0 = c.side === "r" ? x0 + sh : x0, fx1 = c.side === "r" ? x1 : x1 - sh;
      c.lead(base, fx0, 0, .1, ST);
      const p = (u, v, z = 0) => [fx0 + (fx1 - fx0) * u, base - pH * v, z];
      const R = [[[0, 0], [1, 0]], [[1, 0], [1, 1]], [[1, 1], [0, 1]], [[0, 1], [0, 0]]];
      const I = [[[.4, 0], [.4, 1]], [[.4, .5], [1, .5]], [[.72, .5], [.72, 1]]];
      // 1. Grundriss: Außenwände und Innenwände als Doppellinien (Wanddicke), Türschwünge
      const tk = 4;
      const dbl = (a, b, t, du, st) => {
        const A = p(...a), B = p(...b), vert = Math.abs(A[0] - B[0]) < 1;
        for (const o of [-tk, tk]) g.L(vert ? [A[0] + o, A[1], 0] : [A[0], A[1] + o, 0], vert ? [B[0] + o, B[1], 0] : [B[0], B[1] + o, 0], t, du, st);
      };
      R.forEach(([a, b], i) => dbl(a, b, .02 + .06 * i, .12, ST));
      I.forEach(([a, b], i) => dbl(a, b, .3 + .06 * i, .12, NM));
      const arcAt = (u, v, r, a0) => { const q = p(u, v); g.arc(q[0], q[1], r, a0, a0 + 90, 0, 8, .5, .1, TH); };
      arcAt(.4, .5, pH * .2, 0); arcAt(.72, .5, pH * .16, 180);
      // 2. Die Wände wachsen aus dem Plan
      const ends = [[0, 0], [1, 0], [1, 1], [0, 1], [.4, 0], [.4, 1], [.4, .5], [1, .5], [.72, .5], [.72, 1]];
      ends.forEach((e, i) => g.L(p(...e), p(e[0], e[1], Hz), .56 + .03 * i, .2, i < 4 ? ST : NM));
      // 3. Oberkanten und Decke
      R.forEach(([a, b], i) => g.L(p(a[0], a[1], Hz), p(b[0], b[1], Hz), .84 + .03 * i, .1, ST));
      I.slice(0, 2).forEach(([a, b]) => g.L(p(a[0], a[1], Hz), p(b[0], b[1], Hz), .92, .07, NM));
    }
  },

  // Werdegang: ein langer Weg, entlang dem Konstruktionen von einfach zu komplex werden
  werdegang: {
    zd: [0, 0],
    fn(g, c) {
      const { x0, x1, base, w, h } = c, top = Math.min(c.top, 116), cx = (x0 + x1) / 2, span = base - top;
      const pathX = y => cx + Math.sin((base - y) / span * Math.PI * 2.1 + .4) * w * .09;
      const wd = y => 22 + 62 * (y - top) / span; // Wegbreite (perspektivisch schmaler nach oben)
      // Weg: zwei Ränder, Mittellinie gestrichelt
      for (const s of [-1, 1]) {
        const pts = []; for (let i = 0; i <= 40; i++) { const y = base - span * i / 40; pts.push([pathX(y) + s * wd(y) / 2, y, 0]); }
        g.poly(pts, 0, .6, NM);
      }
      const mid = []; for (let i = 0; i <= 40; i++) { const y = base - span * i / 40; mid.push([pathX(y), y, 0]); }
      for (let i = 0; i < 40; i += 2) g.poly([mid[i], mid[i + 1]], i / 40 * .6, .05, GH);
      // Stationen, von links unten nach rechts oben, von einfach zu komplex
      const st = [
        { f: .05, s: -1, k: 0 }, { f: .2, s: 1, k: 1 }, { f: .35, s: -1, k: 2 },
        { f: .5, s: 1, k: 3 }, { f: .64, s: -1, k: 4 }, { f: .79, s: 1, k: 5 }
      ];
      st.forEach((s, i) => {
        const y = base - span * s.f, size0 = 40 + 11 * i, gap = wd(y) / 2 + 34, t = .14 + .13 * i, d = .16, size = Math.min(size0, (y - (top + 8)) / (s.k === 5 ? 1.6 : 1.1));
        let xa = s.s < 0 ? pathX(y) - gap - size : pathX(y) + gap;
        // Das gerade Feld vor dem Bau begrenzen: Konstruktion bleibt im Bereich
        xa = Math.max(x0 + 4, Math.min(x1 - size - 4, xa)); const xb = xa + size, yb = y;
        g.L([xa - 10, yb, 0], [xb + 10, yb, 0], t, d * .5, TH);
        if (s.k === 0) { g.L([xa + size / 2, yb, 0], [xa + size / 2, yb - size * .8, 0], t, d, ST); g.rect(xa + size / 2 - 9, xa + size / 2 + 9, yb - 3, yb + 3, 12, t, d * .5, TH); }
        if (s.k === 1) { g.L([xa + 6, yb, 0], [xa + 6, yb - size, 0], t, d, ST); g.L([xb - 6, yb, 0], [xb - 6, yb - size, 0], t + .02, d, ST); g.L([xa, yb - size, 0], [xb, yb - size, 0], t + .06, d * .6, ST); }
        if (s.k === 2) { g.box(xa, xb, yb - size * .7, yb, 0, size * .5, t, d * 1.4, NM); g.gable(xa, xb, yb - size * .7, yb - size * 1.05, 0, size * .5, t + d, d * .8, NM); }
        if (s.k === 3) { for (let f = 0; f < 2; f++) { const y0 = yb - f * size * .5, y1 = y0 - size * .5; for (const x of [xa, (xa + xb) / 2, xb]) g.L([x, y0, 0], [x, y1, 0], t + f * .05, d, NM); g.L([xa, y1, 0], [xb, y1, 0], t + .06 + f * .05, d * .6, NM); } g.flat(xa, xb, yb - size, 0, size * .4, t + .12, d, TH); g.L([xa, yb, 0], [xb, yb - size * .5, 0], t + .14, d * .6, TH); }
        if (s.k === 4) { const n = 3; for (let i2 = 0; i2 <= n; i2++) { g.L([xa + size * i2 / n, yb, 0], [xa + size * i2 / n, yb - size * .55, 0], t, d, NM); g.L([xa + size * i2 / n, yb, size * .5], [xa + size * i2 / n, yb - size * .55, size * .5], t + .04, d, TH); } g.poly([[xa, yb - size * .55, 0], [xa + size / 2, yb - size * .95, 0], [xb, yb - size * .55, 0]], t + .1, d, NM); for (let i2 = 0; i2 < n; i2++) g.L([xa + size * i2 / n, yb - size * .55, 0], [xa + size * (i2 + .5) / n, yb - size * .95 + (i2 === 1 ? 0 : 0), 0], t + .16, d * .5, TH); g.L([xa + size / 2, yb - size * .95, 0], [xa + size / 2, yb - size * .95, size * .5], t + .2, d * .5, NM); }
        if (s.k === 5) { for (let f = 0; f < 4; f++) { const y0 = yb - f * size * .34, y1 = y0 - size * .34; for (const x of [xa, xb]) g.L([x, y0, 0], [x, y1, 0], t + f * .03, d, NM); g.L([xa, y1, 0], [xb, y1, 0], t + .05 + f * .03, d * .5, NM); g.L(f % 2 ? [xa, y0, 0] : [xb, y0, 0], f % 2 ? [xb, y1, 0] : [xa, y1, 0], t + .08 + f * .03, d * .5, TH); } g.box(xa, xb, yb - size * 1.36, yb, 0, size * .4, t + .02, d * 1.5, TH); g.L([(xa + xb) / 2, yb - size * 1.36, 0], [(xa + xb) / 2, yb - size * 1.6, 0], t + .2, d * .5, ST); }
      });
    }
  },

  // Stimmen: je Stimme ein Bogen
  stimme1: { zd: [0, 0], fn(g, c) { bogen(g, c, "rund"); } },
  stimme2: { zd: [0, 0], fn(g, c) { bogen(g, c, "spitz"); } },

  // Für Agenturen: eine Brücke verbindet zwei Ufer
  agentur: {
    zd: [0, 0],
    fn(g, c) {
      const { x0, x1, top, base, w, h } = c, deck = c.narrow ? base - h * .45 : Math.min(base - h * .5, base - 60), th = Math.min(h * .45, 90);
      const bk = w * .2, lx = x0 + bk, rx = x1 - bk, zD = w * .12;
      c.lead(c.narrow ? base : deck, x0, 0, .12, ST);
      // Ufer: Böschung und Sockel
      for (const [xa, xb, s] of [[x0, lx, 1], [rx, x1, -1]]) {
        g.poly(s > 0 ? [[xa, deck, 0], [xb, deck, 0], [xb, base, 0], [xa, base, 0]] : [[xb, deck, 0], [xa, deck, 0], [xa, base, 0], [xb, base, 0]], .02, .22, ST);
        g.L([xa, deck, 0], [xa, deck, zD], .22, .06, TH); g.L([xb, deck, 0], [xb, deck, zD], .22, .06, TH);
        for (let i = 1; i < 4; i++) g.L([s > 0 ? xa : xb, deck + (base - deck) * i / 4, 0], [s > 0 ? xb - (xb - xa) * .3 * i / 4 : xa + (xb - xa) * .3 * i / 4, deck + (base - deck) * i / 4, 0], .2 + .03 * i, .06, GH);
      }
      g.L([x0, base, 0], [x1, base, 0], .04, .14, NM);
      for (let i = 0; i < 4; i++) { const yy = deck + (base - deck) * (.28 + .2 * i), a = lx + (i % 2 ? 24 : 6), b = rx - (i % 2 ? 6 : 24); g.L([a, yy, 0], [b, yy, 0], .12 + .03 * i, .2, GH); }
      // Brücke wächst von beiden Ufern zur Mitte
      const mid = (lx + rx) / 2, nb = 6, bw = (rx - lx) / nb;
      for (const front of [0, 1]) {
        const z = front ? zD : 0, al = front ? TH : NM;
        g.L([lx, deck, z], [mid, deck, z], .3, .26, front ? NM : ST); g.L([rx, deck, z], [mid, deck, z], .3, .26, front ? NM : ST);
        g.L([lx, deck - th, z], [mid, deck - th, z], .4, .24, al); g.L([rx, deck - th, z], [mid, deck - th, z], .4, .24, al);
        for (let i = 0; i <= nb; i++) {
          const x = lx + bw * i, tt = .36 + .1 * Math.min(i, nb - i) / (nb / 2);
          g.L([x, deck, z], [x, deck - th, z], tt, .1, al);
          if (i < nb) { const x2 = x + bw; if (i % 2 === 0) g.L([x, deck, z], [x2, deck - th, z], tt + .04, .1, al); else g.L([x, deck - th, z], [x2, deck, z], tt + .04, .1, al); }
        }
      }
      for (let i = 0; i <= nb; i++) { const x = lx + bw * i; g.L([x, deck, 0], [x, deck, zD], .62 + .02 * Math.min(i, nb - i), .08, TH); g.L([x, deck - th, 0], [x, deck - th, zD], .7, .08, TH); }
      g.L([lx, deck, 0], [lx, deck - th, 0], .3, .1, ST); g.L([rx, deck, 0], [rx, deck - th, 0], .3, .1, ST);
    }
  },

  // Kontakt: schlichtes Haus mit offener Tür; die rote Linie läuft auf das Portal zu und endet darin
  kontakt: {
    zd: [0, 0],
    fn(g, c) {
      const { narrow } = c, E = c.E; // E: Fußpunkt des Portals (dort endet die rote Linie)
      const dw = narrow ? 56 : 84, dh = narrow ? 104 : 168;
      const px0 = E.x - dw / 2, px1 = E.x + dw / 2;
      const hw = narrow ? Math.min(c.w * .8, 300) : Math.min(c.w * .9, 520), hh = narrow ? Math.min(c.h * .5, 120) : Math.min(c.h * .55, 250);
      let hx0 = E.x + dw * .9 - hw * .62, hx1 = hx0 + hw; // Tür sitzt rechts der Mitte, die Linie kommt von rechts unten
      if (hx0 < c.x0) { hx1 += c.x0 - hx0; hx0 = c.x0; } if (hx1 > c.x1) { hx0 -= hx1 - c.x1; hx1 = c.x1; }
      const gy = E.y, ht = gy - hh, zD = hw * .3, yR = ht - Math.min(hw * .22, 90);
      g.L([hx0 - 30, gy, 0], [hx1 + 30, gy, 0], 0, .16, NM);
      g.box(hx0, hx1, ht, gy, 0, zD, .04, .3, ST);
      g.gable(hx0, hx1, ht, yR, 0, zD, .34, .2, ST);
      g.rect(hx1 - (hx1 - hx0) * .26, hx1 - (hx1 - hx0) * .16, yR + (ht - yR) * .2, yR + (ht - yR) * .6, zD * .5, .52, .06, TH);
      // Fenster links
      g.win(hx0 + (px0 - hx0) * .3, gy - hh * .72, (px0 - hx0) * .4, hh * .34, 0, .5, .1, NM, true);
      if (hx1 - px1 > 60) g.win(px1 + (hx1 - px1) * .3, gy - hh * .72, (hx1 - px1) * .4, hh * .34, 0, .52, .1, NM, true);
      // Portal und offene Tür
      const pt = gy - dh;
      g.L([px0, gy, 0], [px0, pt, 0], .6, .12, ST); g.L([px1, gy, 0], [px1, pt, 0], .62, .12, ST); g.L([px0 - 6, pt, 0], [px1 + 6, pt, 0], .66, .08, ST);
      g.L([px0 - 14, gy, 0], [px0 - 14, pt - 10, 0], .66, .1, NM); g.L([px1 + 14, gy, 0], [px1 + 14, pt - 10, 0], .67, .1, NM); g.L([px0 - 14, pt - 10, 0], [px1 + 14, pt - 10, 0], .7, .08, NM);
      // Türblatt: schwingt zur Kamera auf (Hängung links)
      const o = dw * .55;
      g.poly([[px0, gy, 0], [px0 - o * .25, gy + 4, -o * .9], [px0 - o * .25, pt + 6, -o * .9], [px0, pt, 0]], .78, .16, ST);
      g.L([px0, gy, 0], [px0, pt, 0], .8, .02, ST);
      // Schwelle und Stufe, auf die die rote Linie zuläuft
      g.L([px0 - 24, gy + 14, 0], [px1 + 24, gy + 14, 0], .74, .1, TH);
      // Raum hinter der Tür: Bodenlinien
      g.L([px0, gy, 0], [px0, gy, zD * .9], .84, .1, TH); g.L([px1, gy, 0], [px1, gy, zD * .9], .84, .1, TH); g.L([px0, gy, zD * .9], [px1, gy, zD * .9], .88, .08, TH);
    }
  }
};

function weitereRow(g, c, spec) {
  const { x0, x1, base, w, h } = c;
  c.lead(base, x0, 0, .12, ST); g.L([x0, base, 0], [x1, base, 0], .02, .16, NM);
  const hs = Math.max(h, 250);
  let x = x0 + w * .02; const gaps = w * .08;
  spec.forEach(([kind, ww, hhf, rhf, order], i) => {
    const bw = w * ww * .84, bh = hs * hhf * (kind === "tower" ? 1.15 : 1), rh = hs * rhf * .6, d = bw * .5;
    house(g, x, bw, bh, rh, d, kind, base, .08 + i * .34, .34);
    x += bw + gaps;
  });
}

function bogen(g, c, kind) {
  const { x0, x1, top, base, w, h } = c, cx = (x0 + x1) / 2;
  const t = 24, pointed = kind === "spitz";
  const span = Math.min(w * .6, h * (pointed ? .62 : .78)), rIn = span / 2, zD = span * .34;
  const r1 = span, r2 = span + t, aO = Math.acos(-(span / 2) / r2) * 180 / Math.PI;
  const rise = pointed ? r2 * Math.sin(aO * Math.PI / 180) : rIn + t;
  const spring = Math.min(base - 46, Math.max(top + rise + 2, base - h * .45));
  c.lead(base, cx - span / 2 - t - 30, 0, .12, ST);
  const L = cx - rIn, R = cx + rIn, Lo = L - t, Ro = R + t;
  g.L([Lo - 18, base, 0], [Ro + 18, base, 0], .02, .2, NM);
  for (const x of [Lo, L, R, Ro]) g.L([x, base, 0], [x, spring, 0], .05, .2, x === L || x === R ? NM : ST);
  const N = 9;
  if (!pointed) {
    g.arc(cx, spring, rIn, 180, 0, 0, 40, .24, .34, ST); g.arc(cx, spring, rIn + t, 180, 0, 0, 40, .28, .34, ST);
    for (let i = 0; i <= N; i++) { const a = (180 - 180 * i / N) * Math.PI / 180, e = i === N / 2 ? 12 : 0; g.L([cx + Math.cos(a) * rIn, spring - Math.sin(a) * rIn, 0], [cx + Math.cos(a) * (rIn + t + e), spring - Math.sin(a) * (rIn + t + e), 0], .3 + .03 * i, .08, i === N / 2 ? NM : TH); }
    g.arc(cx, spring, rIn, 180, 0, zD, 40, .68, .2, TH);
  } else {
    g.arc(R, spring, r1, 180, 120, 0, 22, .24, .17, ST); g.arc(L, spring, r1, 0, 60, 0, 22, .38, .17, ST);
    g.arc(R, spring, r2, 180, aO, 0, 22, .28, .17, NM); g.arc(L, spring, r2, 0, 180 - aO, 0, 22, .42, .17, NM);
    for (let i = 1; i < 7; i++) {
      const a = (180 - 60 * i / 7) * Math.PI / 180, b = (60 * i / 7) * Math.PI / 180;
      g.L([R + Math.cos(a) * r1, spring - Math.sin(a) * r1, 0], [R + Math.cos(a) * r2, spring - Math.sin(a) * r2, 0], .34 + .03 * i, .08, TH);
      g.L([L + Math.cos(b) * r1, spring - Math.sin(b) * r1, 0], [L + Math.cos(b) * r2, spring - Math.sin(b) * r2, 0], .44 + .03 * i, .08, TH);
    }
    g.arc(R, spring, r1, 180, 120, zD, 16, .7, .1, TH); g.arc(L, spring, r1, 0, 60, zD, 16, .7, .1, TH);
  }
  // Tiefe: Tonnengewölbe, Kanten laufen nach hinten
  for (const x of [Lo, L, R, Ro]) g.L([x, spring, 0], [x, spring, zD], .7, .16, TH);
  for (const x of [Lo, Ro]) g.L([x, base, 0], [x, base, zD], .72, .12, TH);
  g.L([Lo, base, zD], [Ro, base, zD], .8, .12, TH); g.L([Lo, base, zD], [Lo, spring, zD], .8, .12, TH); g.L([Ro, base, zD], [Ro, spring, zD], .82, .12, TH);
}

export function buildCon(name, c, P) {
  const b = BUILDERS[name];
  const g = Gen(P);
  c.lead = (y, xTo, t0, d, st = NM) => { const xs = c.leadFrom(y); if (Math.abs(xTo - xs) > 8) g.L([xs, y, 0], [xTo, y, 0], t0, d, st); };
  b.fn(g, c);
  return { geometry: g.finish(), g, zd: b.zd };
}
export const zdOf = (name, c) => { const z = BUILDERS[name].zd; return typeof z === 'function' ? z(c) : z; };
