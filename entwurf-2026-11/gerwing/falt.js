// Faltkern der Bogen-Fassung (Grundlage: entwurf-2026-10-b-raumtext-2/falt.js, Pop-up-Buch).
// Alle Teile liegen in Ruhe flach auf dem Bogen (Faltplan in x/z). Jede Fläche hängt an einem Scharnier ihrer Elternfläche
// und klappt mit dem Baufortschritt b hoch, mit der Mechanik aus dem Vorspann-Test (anfahren, abbremsen, überschwingen, einrasten).
// Neu gegenüber Raumtext 2:
// - Bastellinien: Aus dem Faltplan entstehen die Schnittlinien (durchgezogen) und Falzlinien (gestrichelt) jedes Teils.
//   Sie liegen auf dem Bogen, zeichnen sich Linie für Linie ein und bleiben nach dem Hochklappen als Umriss des Abdrucks.
//   Falzlinien verschwinden, sobald ihr Teil steht (im Abdruck gibt es keinen Falz mehr).
// - Abdruck: Unter jedem Teil liegt im Bogen eine etwas dunklere Fläche, die frei wird, wenn das Teil hochklappt.
// - Haarkanten der Teile erscheinen erst, wenn das Teil den Bogen verlässt (vorher gäbe es Doppelstriche mit den Bastellinien).
// - Knoten mit clock "t" laufen nach der Zeit seit dem Laden (Lettern des Namens), alle anderen nach b.
import * as THREE from "three";

export const PI = Math.PI, Q = PI / 2;
export const EPS = .0015;
const lin = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
export const COL = {
  PAPER: lin("#faf8f3"), HOLE: lin("#e7e2d7"), OLD: lin("#e6dfd1"), SHADE: lin("#d6cfc2"), DARK: lin("#9d978d"),
  RED: lin("#d40235"), INK: lin("#303033"), STONE: lin("#ece7dd"), STONE2: lin("#ddd6c8"), WHITE: lin("#ffffff")
};
const { PAPER, INK, HOLE } = COL;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
export const sm5 = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10);
// Mechanischer Lauf (Vorspann-Test): anfahren, abbremsen, kurz über den Anschlag, einrasten
export function mech(x, over = .05) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const w = .74;
  if (x < w) { const u = x / w; return (1 + over) * sm5(u); }
  const t = (x - w) / (1 - w);
  return 1 + over * Math.cos(t * PI * 2.5) * (1 - t) * (1 - t);
}

// ---------- Shader ----------
const LIGHT = new THREE.Vector3(-.45, .8, .5).normalize();
export const FAR = new THREE.Vector2(70, 140), NEAR = new THREE.Vector2(.35, 1.2);
const PAPER_VERT = `
  #ifdef UCOL
  uniform vec3 uCol;
  #else
  attribute vec3 aCol;
  #endif
  varying vec3 vCol; varying vec3 vW; varying float vDepth;
  void main() {
    #ifdef UCOL
    vCol = uCol;
    #else
    vCol = aCol;
    #endif
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz;
    vec4 mv = viewMatrix * wp;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
// Papier: flache Normale aus den Bildschirmableitungen, weiches Licht, leichte Bodenverschattung an stehenden Flächen
const PAPER_FRAG = `
  uniform vec3 uL; uniform vec2 uFar; uniform vec2 uNear;
  varying vec3 vCol; varying vec3 vW; varying float vDepth;
  void main() {
    float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    if (smoothstep(uNear.x, uNear.y, vDepth) < ign) discard;
    vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
    if (dot(n, cameraPosition - vW) < 0.0) n = -n;
    float dif = dot(n, uL);
    float sh = 0.86 + 0.14 * max(dif, 0.0) - 0.11 * max(-dif, 0.0);
    float ao = mix(1.0, mix(0.9, 1.0, smoothstep(0.0, 0.8, vW.y)), 1.0 - abs(n.y));
    vec3 c = vCol * sh * ao;
    float k = 1.0 - smoothstep(uFar.x, uFar.y, vDepth);
    gl_FragColor = vec4(mix(vec3(1.0), c, k), 1.0);
    #include <colorspace_fragment>
  }`;
const EDGE_VERT = `
  attribute vec4 aCol;
  varying vec4 vC; varying float vDepth;
  void main() {
    vC = aCol;
    vec4 mv = viewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const EDGE_FRAG = `
  uniform vec2 uFar; uniform vec2 uNear;
  varying vec4 vC; varying float vDepth;
  void main() {
    float a = vC.a * smoothstep(uNear.x, uNear.y + .3, vDepth) * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
    if (a < 0.005) discard;
    gl_FragColor = vec4(vC.rgb, min(a, 1.0));
    #include <colorspace_fragment>
  }`;
// Bastellinien: aP = (Start in b, Dauer in b, Lauf 0…1 entlang der Linie, Länge in m; negativ = gestrichelt)
const RISS_VERT = `
  attribute vec4 aCol; attribute vec4 aP;
  varying vec4 vC; varying vec4 vP;
  void main() { vC = aCol; vP = aP; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const RISS_FRAG = `
  uniform float uB;
  varying vec4 vC; varying vec4 vP;
  void main() {
    float g = clamp((uB - vP.x) / vP.y, 0.0, 1.0);
    g = g * (2.0 - g);
    if (g <= 0.0 || vP.z > g + 0.0001) discard;
    if (vP.w < 0.0 && fract(vP.z * -vP.w / 0.085) > 0.56) discard;
    float a = vC.a * (1.0 + 0.6 * (1.0 - step(0.999, g)));
    if (a < 0.004) discard;
    gl_FragColor = vec4(vC.rgb, min(a, 1.0));
    #include <colorspace_fragment>
  }`;
export function paperMaterial(col) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uL: { value: LIGHT }, uFar: { value: FAR }, uNear: { value: NEAR }, uCol: { value: col ? new THREE.Color(col) : new THREE.Color() } },
    vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2
  });
  if (col) m.defines = { UCOL: 1 };
  return m;
}
export function edgeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uFar: { value: FAR }, uNear: { value: NEAR } },
    vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG, transparent: true, depthWrite: false
  });
}
export function rissMaterial() {
  return new THREE.ShaderMaterial({ uniforms: { uB: { value: 0 } }, vertexShader: RISS_VERT, fragmentShader: RISS_FRAG, transparent: true, depthWrite: false });
}

// ---------- Faltmodell ----------
export function Model() {
  const nodes = [];
  const tv = [], tc = [], tn = [];          // Flächen: Ruhelage, Farbe, Knoten
  const lv = [], lc = [], ln = [];          // Haarkanten der Teile
  const hinges = [], cuts = [], holes = [], sketches = [];
  const att = [];
  const parts = new Map(); let tag = null;
  const mk = (par, P, A, ang, t0, d, lvl, opt = {}) => {
    const n = { i: nodes.length, par, P, A, ang, t0, d: Math.max(d, 1e-3), lvl, M: new Float64Array(12), mv: 0,
      clock: opt.clock || "b", over: opt.over !== undefined ? opt.over : .06, own: opt.own || null, tag: opt.tag !== undefined ? opt.tag : tag,
      nocut: !!opt.nocut, nofold: !!opt.nofold };
    n.M.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]);
    nodes.push(n); return n;
  };
  const root = mk(null, null, null, 0, 0, 1, 0, { tag: null });
  const F = {
    root, nodes,
    // Teil: alle folgenden Knoten gehören dazu; ihre Bastellinien zeichnen sich im Fenster [t0, t0 + d] von b
    part(name, t0, d) { tag = name; if (!parts.has(name)) parts.set(name, { t0, d }); return name; },
    // Scharnier a-b (Bogen x/z); side: ein Punkt der Fläche. ang > 0 hebt die Fläche zur Oberseite der Elternfläche.
    hinge(par, a, b, side, ang, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl + 1;
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      const sx = side[0] - a[0], sz = side[1] - a[1], pr = sx * ux + sz * uz, vx = sx - ux * pr, vz = sz - uz * pr, al = Math.hypot(vx, vz);
      const n = mk(par, [a[0], lvl * EPS, a[1]], [-vz / al, 0, vx / al], ang, t0, d, lvl, opt);
      hinges.push({ a: [a[0], a[1]], b: [b[0], b[1]], nd: n });
      return n;
    },
    // Hubknoten: die Ebene hebt sich parallel um dy (Plattform, Tischplatte); Kinder bauen in denselben x/z-Koordinaten weiter
    lift(par, dy, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl + 1;
      const n = mk(par, [0, 0, 0], [1, 0, 0], 0, t0, d, lvl, opt); n.lift = dy; return n;
    },
    poly(nd, pts, col = PAPER, e = .5, dy = 0, ecol = INK, opt = {}) {
      const y = nd.lvl * EPS + dy, n = pts.length;
      for (let k = 1; k < n - 1; k++) for (const p of [pts[0], pts[k], pts[k + 1]]) { tv.push(p[0], y, p[1]); tc.push(...col); tn.push(nd.i); }
      for (let k = 0; k < n; k++) {
        const w = Array.isArray(e) ? e[k] : e; if (!w) continue;
        const p = pts[k], q = pts[(k + 1) % n];
        lv.push(p[0], y, p[1], q[0], y, q[1]); lc.push(...ecol, w, ...ecol, w); ln.push(nd.i, nd.i);
        if (nd !== root && !dy && !opt.nocut) cuts.push({ p: [p[0], p[1]], q: [q[0], q[1]], nd });
      }
      if (nd !== root && !dy && !opt.nocut) holes.push({ nd, pts: pts.map(p => [p[0], p[1]]) });
    },
    line(nd, a, b, w = .35, col = INK, dy = .0008) {
      const y = nd.lvl * EPS + dy;
      lv.push(a[0], y, a[1], b[0], y, b[1]); lc.push(...col, w, ...col, w); ln.push(nd.i, nd.i);
    },
    // Gezeichnete Linien auf der Fläche eines Knotens (z. B. Skizze): segs [[a, b], …] in x/z der Ruhelage,
    // zeichnen sich im Fenster [t0, t0 + d]; fade(b) liefert die Deckkraft (1 = voll)
    sketch(nd, segs, t0, d, opt = {}) { sketches.push({ nd, segs, t0, d, a: opt.a || .55, fade: opt.fade || null, dy: opt.dy !== undefined ? opt.dy : .0009, dash: !!opt.dash, col: opt.col || INK }); },
    // Objekt an einen Knoten hängen. p: Punkt (x, z) in der Ruhelage, q: Richtung "oben" des Objekts in der Ruhelage,
    // side +1: Oberseite der Ruhelage, -1: Unterseite.
    attach(nd, obj, p, q, side = 1, lift = .002) {
      const ql = Math.hypot(q[0], q[1]), qx = q[0] / ql, qz = q[1] / ql;
      const X = new THREE.Vector3(-qz * side, 0, qx * side), Y = new THREE.Vector3(qx, 0, qz), N = new THREE.Vector3(0, side, 0);
      const R = new THREE.Matrix4().makeBasis(X, Y, N).setPosition(p[0], nd.lvl * EPS + side * lift, p[1]);
      obj.matrixAutoUpdate = false;
      att.push({ nd, obj, R });
      return { X, Y };
    },
    finish() {
      // Besitzer der Bastellinien und des Abdrucks: die Fläche, aus der das Teil geschnitten ist (Bogen oder Hubplatte)
      for (const n of nodes) {
        if (!n.par || n.own) continue;
        let o = n.par; while (o.par && !o.lift) o = o.par; n.own = o;
      }
      // ---- Bastellinien ----
      const near = (a, b) => Math.abs(a[0] - b[0]) < 1e-4 && Math.abs(a[1] - b[1]) < 1e-4;
      const onSeg = (p, h) => {
        const dx = h.b[0] - h.a[0], dz = h.b[1] - h.a[1], L2 = dx * dx + dz * dz;
        const t = ((p[0] - h.a[0]) * dx + (p[1] - h.a[1]) * dz) / L2;
        const ex = h.a[0] + dx * t - p[0], ez = h.a[1] + dz * t - p[1];
        return t > -1e-4 && t < 1 + 1e-4 && ex * ex + ez * ez < 1e-8;
      };
      const folds = hinges.filter(h => !h.nd.nofold);
      const cutList = [], live = cuts.filter(c => !c.nd.nocut && !folds.some(h => onSeg(c.p, h) && onSeg(c.q, h)));
      const asSeg = c => ({ a: c.p, b: c.q });
      for (const c of live) {
        if (cutList.some(o => (near(o.p, c.p) && near(o.q, c.q)) || (near(o.p, c.q) && near(o.q, c.p)))) continue;
        // Kante, die ganz in einer längeren Schnittkante liegt (Nachbarteile), nur einmal zeichnen
        if (live.some(o => o !== c && onSeg(c.p, asSeg(o)) && onSeg(c.q, asSeg(o)) && !(onSeg(o.p, asSeg(c)) && onSeg(o.q, asSeg(c))))) continue;
        cutList.push(c);
      }
      const segs = [];
      for (const [name, pt] of parts) {
        const cs = cutList.filter(c => c.nd.tag === name), fs = folds.filter(h => h.nd.tag === name).map(h => ({ p: h.a, q: h.b, nd: h.nd, fold: 1 }));
        const all = cs.concat(fs); if (!all.length) continue;
        let cx = 0, cz = 0; for (const s of all) { cx += s.p[0] + s.q[0]; cz += s.p[1] + s.q[1]; } cx /= 2 * all.length; cz /= 2 * all.length;
        const ang = s => Math.atan2(-((s.p[1] + s.q[1]) / 2 - cz), (s.p[0] + s.q[0]) / 2 - cx);
        // Umriss im Uhrzeigersinn von links hinten, danach die Falze
        const ord = cs.sort((a, b) => ang(b) - ang(a)).concat(fs.sort((a, b) => ang(b) - ang(a)));
        const n = ord.length, span = Math.min(.5, .1 + 1.5 / n);
        ord.forEach((s, i) => {
          const st = pt.t0 + pt.d * (n > 1 ? i / (n - 1) : 0) * (1 - span);
          segs.push({ p: s.p, q: s.q, own: s.nd.own, ch: s.nd, y: s.nd.lvl * EPS + .6 * EPS, kind: s.fold ? "f" : "c", st, du: pt.d * span, a: s.fold ? .5 : .6 });
        });
      }
      for (const sk of sketches) {
        const n = sk.segs.length, span = Math.min(.5, .1 + 1.5 / n);
        sk.segs.forEach(([p, q], i) => segs.push({ p, q, own: sk.nd, ch: null, y: sk.nd.lvl * EPS + sk.dy, kind: "s", sk, st: sk.t0 + sk.d * (n > 1 ? i / (n - 1) : 0) * (1 - span), du: sk.d * span, a: sk.a, dash: sk.dash, col: sk.col }));
      }
      const NR = segs.length;
      const restR = new Float32Array(NR * 6), posR = new Float32Array(NR * 6), colR = new Float32Array(NR * 8), aP = new Float32Array(NR * 8), nR = new Int32Array(NR * 2);
      segs.forEach((s, i) => {
        restR.set([s.p[0], s.y, s.p[1], s.q[0], s.y, s.q[1]], i * 6);
        const L = Math.hypot(s.q[0] - s.p[0], s.q[1] - s.p[1]) * (s.kind === "f" || s.dash ? -1 : 1);
        aP.set([s.st, s.du, 0, L, s.st, s.du, 1, L], i * 8);
        const c = s.col || INK; colR.set([...c, s.a, ...c, s.a], i * 8);
        nR[i * 2] = nR[i * 2 + 1] = s.own.i;
      });
      // ---- Abdruck: dunklere Fläche im Bogen unter jedem Teil (färbt sich erst, wenn das Teil den Bogen verlässt) ----
      const holeOf = new Map();
      for (const h of holes) {
        if (h.nd.nocut) continue;
        const y = h.nd.own.lvl * EPS + .35 * EPS, pts = h.pts, n = pts.length;
        for (let k = 1; k < n - 1; k++) for (const p of [pts[0], pts[k], pts[k + 1]]) { tv.push(p[0], y, p[1]); tc.push(...HOLE); tn.push(h.nd.own.i); holeOf.set(tn.length - 1, h.nd); }
      }
      const restT = new Float32Array(tv), restL = new Float32Array(lv), nT = Int32Array.from(tn), nL = Int32Array.from(ln);
      const posT = new Float32Array(restT.length), posL = new Float32Array(restL.length);
      const baseL = Float32Array.from(lc), colL = Float32Array.from(lc);
      // Farbe der Teile: in Ruhe gleiches Papier wie der Bogen, die eigene Farbe kommt, wenn das Teil hochklappt
      const NTP = tn.length, baseC = Float32Array.from(tc), colT = Float32Array.from(tc);
      const geoT = new THREE.BufferGeometry(), geoL = new THREE.BufferGeometry(), geoR = new THREE.BufferGeometry();
      geoT.setAttribute("position", new THREE.BufferAttribute(posT, 3).setUsage(THREE.DynamicDrawUsage));
      geoT.setAttribute("aCol", new THREE.BufferAttribute(colT, 3).setUsage(THREE.DynamicDrawUsage));
      geoL.setAttribute("position", new THREE.BufferAttribute(posL, 3).setUsage(THREE.DynamicDrawUsage));
      geoL.setAttribute("aCol", new THREE.BufferAttribute(colL, 4).setUsage(THREE.DynamicDrawUsage));
      geoR.setAttribute("position", new THREE.BufferAttribute(posR, 3).setUsage(THREE.DynamicDrawUsage));
      geoR.setAttribute("aCol", new THREE.BufferAttribute(colR, 4).setUsage(THREE.DynamicDrawUsage));
      geoR.setAttribute("aP", new THREE.BufferAttribute(aP, 4));
      const xf = (rest, nid, out) => {
        for (let i = 0, j = 0; j < nid.length; j++, i += 3) {
          const M = nodes[nid[j]].M, x = rest[i], y = rest[i + 1], z = rest[i + 2];
          out[i] = M[0] * x + M[1] * y + M[2] * z + M[3]; out[i + 1] = M[4] * x + M[5] * y + M[6] * z + M[7]; out[i + 2] = M[8] * x + M[9] * y + M[10] * z + M[11];
        }
      };
      const m4 = new THREE.Matrix4();
      const nodeMat = (nd, out) => { const M = nd.M; return out.set(M[0], M[1], M[2], M[3], M[4], M[5], M[6], M[7], M[8], M[9], M[10], M[11], 0, 0, 0, 1); };
      function solve(b, t) {
        for (const nd of nodes) {
          const M = nd.M;
          if (!nd.par) continue;
          const x = ((nd.clock === "t" ? t : b) - nd.t0) / nd.d;
          const w = mech(x, nd.over);
          nd.mv = Math.max(nd.par.mv, clamp(x * 7, 0, 1));
          if (nd.lift) { const m = nd.par.M, ty = nd.lift * w; for (let a = 0; a < 3; a++) { M[a * 4] = m[a * 4]; M[a * 4 + 1] = m[a * 4 + 1]; M[a * 4 + 2] = m[a * 4 + 2]; M[a * 4 + 3] = m[a * 4 + 1] * ty + m[a * 4 + 3]; } continue; }
          const th = nd.ang * w, c = Math.cos(th), sn = Math.sin(th), tt = 1 - c, [ax, ay, az] = nd.A, [px, py, pz] = nd.P;
          const r = [tt * ax * ax + c, tt * ax * ay - sn * az, tt * ax * az + sn * ay, tt * ax * ay + sn * az, tt * ay * ay + c, tt * ay * az - sn * ax, tt * ax * az - sn * ay, tt * ay * az + sn * ax, tt * az * az + c];
          const lt = [px - (r[0] * px + r[1] * py + r[2] * pz), py - (r[3] * px + r[4] * py + r[5] * pz), pz - (r[6] * px + r[7] * py + r[8] * pz)];
          const m = nd.par.M;
          for (let a = 0; a < 3; a++) {
            const m0 = m[a * 4], m1 = m[a * 4 + 1], m2 = m[a * 4 + 2];
            M[a * 4] = m0 * r[0] + m1 * r[3] + m2 * r[6];
            M[a * 4 + 1] = m0 * r[1] + m1 * r[4] + m2 * r[7];
            M[a * 4 + 2] = m0 * r[2] + m1 * r[5] + m2 * r[8];
            M[a * 4 + 3] = m0 * lt[0] + m1 * lt[1] + m2 * lt[2] + m[a * 4 + 3];
          }
        }
      }
      let lastB = NaN, lastT = NaN;
      function update(b, t) {
        if (b === lastB && t === lastT) return false; lastB = b; lastT = t;
        solve(b, t);
        xf(restT, nT, posT); xf(restL, nL, posL); xf(restR, nR, posR);
        for (let j = 0; j < NTP; j++) { const hn = holeOf.get(j), nd = nodes[nT[j]]; if (nd === root && !hn) continue; const k = hn ? hn.mv : nd.mv; for (let c = 0; c < 3; c++) colT[j * 3 + c] = PAPER[c] + (baseC[j * 3 + c] - PAPER[c]) * k; }
        geoT.attributes.aCol.needsUpdate = true;
        // Haarkanten erst, wenn das Teil den Bogen verlässt
        for (let j = 0; j < nL.length; j++) { const nd = nodes[nL[j]]; colL[j * 4 + 3] = baseL[j * 4 + 3] * (nd === root ? 1 : nd.mv); }
        // Bastellinien: Schnitt bleibt als Umriss des Abdrucks (heller), Falz verschwindet, Skizze nach ihrer Blende
        segs.forEach((s, i) => {
          let a = s.a;
          if (s.kind === "c") a *= 1 - .45 * s.ch.mv;
          else if (s.kind === "f") a *= 1 - s.ch.mv;
          else if (s.sk.fade) a *= s.sk.fade(b);
          colR[i * 8 + 3] = colR[i * 8 + 7] = a;
        });
        geoT.attributes.position.needsUpdate = true; geoL.attributes.position.needsUpdate = true; geoL.attributes.aCol.needsUpdate = true;
        geoR.attributes.position.needsUpdate = true; geoR.attributes.aCol.needsUpdate = true;
        for (const a of att) { nodeMat(a.nd, m4); a.obj.matrix.multiplyMatrices(m4, a.R); a.obj.matrixWorld.copy(a.obj.matrix); a.obj.matrixWorldNeedsUpdate = true; }
        return true;
      }
      // Umgrenzung eines Teils im aktuellen Zustand (für die Kamera)
      function boxOf(name) {
        const bx = new THREE.Box3(), v = new THREE.Vector3();
        for (let j = 0; j < nT.length; j++) if (nodes[nT[j]].tag === name) bx.expandByPoint(v.set(posT[j * 3], posT[j * 3 + 1], posT[j * 3 + 2]));
        return bx;
      }
      return { geoT, geoL, geoR, update, boxOf, att, nodeMat, dbg: { holes, segs, nodes } };
    }
  };
  return F;
}

// ---------- Bauteile ----------
export function kit(F) {
  const K = {};
  K.panel = (par, a, b, n, t0, d, ang = Q, opt) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    const nd = F.hinge(par, a, b, [a[0] + n[0], a[1] + n[1]], ang, t0, d, opt);
    nd.L = L; nd.dir = [ux, uz]; nd.n = n;
    nd.uv = (u, v) => [a[0] + ux * u + n[0] * v, a[1] + uz * u + n[1] * v];
    return nd;
  };
  K.P = (nd, uvs, col = PAPER, e = .5, dy = 0) => F.poly(nd, uvs.map(q => nd.uv(q[0], q[1])), col, e, dy);
  K.rect = (nd, u0, v0, u1, v1, col, e, dy) => K.P(nd, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], col, e, dy);
  // Faltschachtel: Wände klappen nach innen hoch, der Deckel hängt an der Oberkante der Rückwand.
  // Außenseite aller Wände und des Deckels: side -1. o.hf/o.hb: Höhe vorn/hinten (Keil), o.walls: Auswahl "fblr", o.open: ohne Deckel.
  K.box = (par, x0, x1, z0, z1, h, t0, d, o = {}) => {
    const col = o.col || PAPER, D = z0 - z1, W = x1 - x0, tw = d * .55, ts = d * .12;
    const hf = o.hf || h, hb = o.hb || h, walls = o.walls || "fblr";
    const op = { own: o.own, over: o.over };
    const r = { W, D, hf, hb };
    if (walls.includes("f")) { r.fr = K.panel(par, [x0, z0], [x1, z0], [0, 1], t0, tw, Q, op); K.rect(r.fr, 0, 0, W, hf, o.fcol || col); }
    if (walls.includes("b")) { r.bk = K.panel(par, [x0, z1], [x1, z1], [0, -1], t0, tw, Q, op); K.rect(r.bk, 0, 0, W, hb, col); }
    if (walls.includes("l")) { r.lf = K.panel(par, [x0, z0], [x0, z1], [-1, 0], t0 + ts, tw, Q, op); K.P(r.lf, [[0, 0], [D, 0], [D, hb], [0, hf]], col); }
    if (walls.includes("r")) { r.rt = K.panel(par, [x1, z0], [x1, z1], [1, 0], t0 + ts, tw, Q, op); K.P(r.rt, [[0, 0], [D, 0], [D, hb], [0, hf]], col); }
    if (!o.open && r.bk) {
      const L = Math.hypot(D, hb - hf), ang = Q + Math.atan2(hb - hf, D);
      r.top = K.panel(r.bk, r.bk.uv(0, hb), r.bk.uv(W, hb), [0, -1], t0 + d * .5, d * .5, ang, op);
      K.rect(r.top, 0, 0, W, L, o.roof || col);
      r.topL = L;
    }
    return r;
  };
  // Platte, die sich parallel hebt, mit Randstreifen (o.walls aus "fblr"); liefert den Hubknoten
  K.slab = (par, x0, x1, z0, z1, h, t0, d, o = {}) => {
    // flache Platten (Rand unter .15): Randstreifen ohne eigene Bastellinien, sonst läge eine zweite Kontur dicht neben der ersten
    const walls = o.walls || "flr", col = o.col || PAPER, D = z0 - z1, W = x1 - x0, thin = h < .15, op = { own: o.own, over: o.over, nocut: thin, nofold: thin };
    if (walls.includes("f")) K.rect(K.panel(par, [x0, z0], [x1, z0], [0, 1], t0, d, Q, op), 0, 0, W, h, col);
    if (walls.includes("b")) K.rect(K.panel(par, [x0, z1], [x1, z1], [0, -1], t0, d, Q, op), 0, 0, W, h, col);
    if (walls.includes("l")) K.rect(K.panel(par, [x0, z0], [x0, z1], [-1, 0], t0, d, Q, op), 0, 0, D, h, col);
    if (walls.includes("r")) K.rect(K.panel(par, [x1, z0], [x1, z1], [1, 0], t0, d, Q, op), 0, 0, D, h, col);
    const L = F.lift(par, h, t0, d, { own: o.own, over: o.over !== undefined ? o.over : .04 });
    F.poly(L, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], o.top || col, .5);
    return L;
  };
  return K;
}
