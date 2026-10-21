// Konstruktionen für Entwurf B Konstruktion 3: echte 3D-Bauten im Raum, je Textabschnitt eine Konstruktion.
// Jede Konstruktion ist EIN LineSegments-Objekt; Wachsen und Abbauen läuft komplett im Vertex-Shader (uProg).
// Keine Maße, keine Achsmarken, keine Beschriftung im Raum.
import * as THREE from "three";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const K = .62; // Tiefe eines „Würfels“ in Weltmetern bei Seitenlänge 1 (x/y-Einheiten sind .62 m)

export const LINE_VERT = `
  attribute vec3 aB; attribute vec4 aInfo; attribute vec2 aE;
  uniform float uProg;
  varying float vDepth; varying float vA; varying float vP; varying float vQ;
  void main() {
    float p = clamp((uProg - aInfo.x) / max(aInfo.y, 1e-4), 0.0, 1.0);
    float e = p * (2.0 - p);
    vec3 pos = mix(position, aB, aInfo.w * e);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mv.z; vA = aInfo.z; vP = p;
    vQ = aE.y > 0.0 ? clamp((uProg - aE.x) / aE.y, 0.0, 1.0) : 0.0;
    gl_Position = projectionMatrix * mv;
  }`;
export const LINE_FRAG = `
  uniform vec3 uColor; uniform vec2 uFar; uniform float uGain;
  varying float vDepth; varying float vA; varying float vP; varying float vQ;
  void main() {
    if (vP <= 0.001) discard;
    float a = vA * smoothstep(0.4, 2.6, vDepth) * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
    a *= uGain * (1.0 - vQ); a *= 1.0 + 0.45 * (1.0 - step(0.999, vP));
    if (a < 0.005) discard;
    gl_FragColor = vec4(uColor, min(a, 1.0));
    #include <colorspace_fragment>
  }`;

export function lineMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uProg: { value: 0 }, uColor: { value: color }, uFar: { value: new THREE.Vector2(11, 38) }, uGain: { value: 1 } },
    vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, transparent: true, depthWrite: false
  });
}

// ---------- Generator ----------
function Gen(o) {
  const segs = [], movers = [];
  const X = x => o.ox + x * o.lat, Y = y => o.oy + y * o.hs, Z = z => o.oz + z;
  const g = {
    movers, tf: null, er: null, ns: false,
    // Linie a -> b, wächst von a aus. t0/d: Zeitfenster (0..1) im Fortschritt, w: Deckkraft
    L(a, b, t0, d, w = .6, ov = 0) {
      if (g.tf) { a = g.tf(a); b = g.tf(b); }
      if (ov) {
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], f = ov / (Math.hypot(dx, dy, dz) || 1);
        a = [a[0] - dx * f, a[1] - dy * f, a[2] - dz * f];
        b = [b[0] + dx * f, b[1] + dy * f, b[2] + dz * f];
      }
      segs.push([a, b, t0, d, w, g.er, g.ns]);
    },
    poly(pts, t0, d, w = .6) {
      let tot = 0; const ls = [];
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); ls.push(l); tot += l; }
      let c = 0;
      for (let i = 1; i < pts.length; i++) { g.L(pts[i - 1], pts[i], t0 + d * c / tot, Math.max(.01, d * ls[i - 1] / tot), w); c += ls[i - 1]; }
    },
    rect(y, x0, x1, z0, z1, t0, d, w) { g.poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]], t0, d, w); },
    rectXY(z, x0, x1, y0, y1, t0, d, w) { g.poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [x0, y0, z]], t0, d, w); },
    rectYZ(x, y0, y1, z0, z1, t0, d, w) { g.poly([[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], [x, y0, z0]], t0, d, w); },
    box(x0, x1, y0, y1, z0, z1, t0, d, w = .7) {
      g.rect(y0, x0, x1, z0, z1, t0, d * .35, w);
      for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) g.L([x, y0, z], [x, y1, z], t0 + d * .25, d * .4, w, .05);
      g.rect(y1, x0, x1, z0, z1, t0 + d * .6, d * .4, w);
    },
    grid(x0, x1, z0, z1, sx, sz, y, t0, d, w, wm, every = 4) {
      const nx = Math.round((x1 - x0) / sx), nz = Math.round((z0 - z1) / sz), n = nx + nz + 2; let k = 0;
      for (let i = 0; i <= nx; i++, k++) { const x = x0 + i * sx, m = i % every === 0; g.L([x, y, z0], [x, y, z1], t0 + d * .65 * k / n, d * .35, m ? wm : w, m ? .25 : 0); }
      for (let j = 0; j <= nz; j++, k++) { const z = z0 - j * sz, m = j % every === 0; g.L([x0, y, z], [x1, y, z], t0 + d * .65 * k / n, d * .35, m ? wm : w, m ? .25 : 0); }
    },
    // Pflasterverband (Läuferverband): Reihen in x, versetzte Stoßfugen; wächst Reihe für Reihe
    pave(x0, x1, z0, z1, cw, ch, y, t0, d, w) {
      const rows = Math.round((z0 - z1) / ch);
      for (let r = 0; r <= rows; r++) {
        const z = z0 - r * ch, t = t0 + d * .7 * r / rows;
        g.L([x0, y, z], [x1, y, z], t, d * .3, w * 1.25);
        if (r === rows) break;
        for (let x = x0 + (r % 2) * cw * .5; x < x1 - .01; x += cw) { if (x < x0 + .01) continue; g.L([x, y, z], [x, y, z - ch], t + d * .1, d * .2, w); }
      }
    },
    // Treppe/Terrasse: Wangen + Stufenkanten. Steigt in Richtung dz (+1/-1) an.
    stairs(xa, xb, y0, z0, dz, n, rise, run, t0, d, w = .6, joints = 0) {
      for (const x of [xa, xb]) {
        const pts = [[x, y0, z0]];
        for (let k = 0; k < n; k++) { pts.push([x, y0 + (k + 1) * rise, z0 + dz * k * run]); pts.push([x, y0 + (k + 1) * rise, z0 + dz * (k + 1) * run]); }
        pts.push([x, y0, z0 + dz * n * run]);
        g.poly(pts, t0, d * .55, w);
      }
      for (let k = 0; k < n; k++) {
        const tk = t0 + d * (.25 + .7 * k / n), zf = z0 + dz * k * run, zb = zf + dz * run;
        g.L([xa, y0 + k * rise, zf], [xb, y0 + k * rise, zf], tk, d * .15, w);
        g.L([xa, y0 + (k + 1) * rise, zf], [xb, y0 + (k + 1) * rise, zf], tk + d * .04, d * .15, w);
        if (k === n - 1) g.L([xa, y0 + (k + 1) * rise, zb], [xb, y0 + (k + 1) * rise, zb], tk + d * .08, d * .15, w);
        if (joints) for (let x = xa + joints; x < xb - .01; x += joints) g.L([x, y0 + (k + 1) * rise, zf], [x, y0 + (k + 1) * rise, zb], tk + d * .1, d * .15, w * .45);
      }
    },
    // Kreisbogen: xy (stehend), xz (liegend, rund in Welt), yz (stehend, seitlich)
    arc(c, r, a0, a1, plane, steps, t0, d, w = .6) {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const a = a0 + (a1 - a0) * i / steps, cs = Math.cos(a) * r, sn = Math.sin(a) * r;
        pts.push(plane === "xy" ? [c[0] + cs, c[1] + sn, c[2]]
          : plane === "xz" ? [c[0] + cs, c[1], c[2] + sn * o.lat]
          : [c[0], c[1] + sn, c[2] + cs * o.hs]);
      }
      g.poly(pts, t0, d, w);
    },
    // Linie in Weltkoordinaten (z. B. Aufhängung der Bilder)
    Lw(a, b, t0, d, w) {
      const f = p => [(p[0] - o.ox) / o.lat, (p[1] - o.oy) / o.hs, p[2] - o.oz];
      g.L(f(a), f(b), t0, d, w);
    },
    // Haus mit Satteldach, Giebel zur Kamera
    house(x0, x1, z0, z1, h, rh, t0, d, w = .7, op = {}) {
      const xm = (x0 + x1) / 2, rt = t0 + d * .55, rd = d * .45;
      g.box(x0, x1, 0, h, z0, z1, t0, d * .6, w);
      for (const z of [z0, z1]) { g.L([x0, h, z], [xm, h + rh, z], rt, rd * .5, w, .04); g.L([x1, h, z], [xm, h + rh, z], rt, rd * .5, w, .04); }
      g.L([xm, h + rh, z0], [xm, h + rh, z1], rt + rd * .3, rd * .5, w, .03);
      const n = Math.max(1, Math.round((z0 - z1) / (1.7 * o.dens)));
      for (let i = 1; i < n; i++) { const z = z0 + (z1 - z0) * i / n; g.L([x0, h, z], [xm, h + rh, z], rt + rd * .5, rd * .4, w * .38); g.L([x1, h, z], [xm, h + rh, z], rt + rd * .5, rd * .4, w * .38); }
      if (op.door) g.poly([[xm - .5, 0, z0], [xm - .5, 1.7, z0], [xm + .5, 1.7, z0], [xm + .5, 0, z0]], t0 + d * .7, d * .25, w * .9);
      if (op.win) for (const fx of [xm - 1.5, xm + 1.5]) if (Math.abs(fx - xm) + .45 < (x1 - x0) / 2) g.rectXY(z0, fx - .4, fx + .4, h * .38, h * .38 + .9, t0 + d * .75, d * .2, w * .75);
    },
    // Gerüst um einen Baukörper (Ständer, Gerüstlagen, Querriegel zur Wand, Diagonalen, Beläge, Leiter)
    scaffold(x0, x1, z0, z1, H, lifts, bx, bz, hx0, hx1, hz0, hz1, t0, d, w = .75) {
      const lh = H / lifts, pts = [];
      for (let i = 0; i <= bx; i++) for (let j = 0; j <= bz; j++) if (i === 0 || i === bx || j === 0 || j === bz) pts.push([x0 + (x1 - x0) * i / bx, z0 + (z1 - z0) * j / bz, i, j]);
      pts.forEach(([x, z, i, j], k) => {
        const tk = t0 + d * .35 * k / pts.length;
        g.rect(0, x - .13, x + .13, z + .1, z - .1, tk, d * .05, .45);
        g.L([x, 0, z], [x, H + .8, z], tk + d * .02, d * .3, .85, .04);
      });
      for (let l = 1; l <= lifts; l++) {
        const y = l * lh, tl = t0 + d * (.25 + .6 * l / lifts), td = d * .16;
        g.poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]], tl, td * 2, .75);
        // Querriegel zur Hauswand
        for (const [x, z, i, j] of pts) {
          if (j === 0 && z0 > hz0) g.L([x, y, z], [clamp(x, hx0, hx1), y, hz0], tl + td * .5, td, .4);
          if (i === 0 && x0 < hx0) g.L([x, y, z], [hx0, y, clamp(z, hz1, hz0)], tl + td * .5, td, .4);
          if (i === bx && x1 > hx1) g.L([x, y, z], [hx1, y, clamp(z, hz1, hz0)], tl + td * .5, td, .4);
        }
        if (l % 2 === 0) { // Gerüstbelag: Bohlen quer zur Front
          for (let x = x0; x <= x1 + .01; x += 1.05 * o.dens) g.L([x, y, z0], [x, y, hz0], tl + td * .7, td * .8, .3);
        }
        if (l > 1) g.L([x0, y - lh + .5, z0], [x1, y - lh + .5, z0], tl + td, td * .6, .25); // Bordbrett
      }
      // Diagonalen: Vorderseite und rechte Seite
      for (let i = 0; i < bx; i++) { const xa = x0 + (x1 - x0) * i / bx, xb = x0 + (x1 - x0) * (i + 1) / bx; for (let l = 0; l < lifts; l += 2) g.L([xa, l * lh, z0], [xb, (l + 2) * lh > H ? H : (l + 2) * lh, z0], t0 + d * (.6 + .3 * i / bx), d * .15, .42); }
      for (let j = 0; j < bz; j++) { const za = z0 + (z1 - z0) * j / bz, zb = z0 + (z1 - z0) * (j + 1) / bz; for (let l = 0; l < lifts; l += 2) g.L([x1, l * lh, za], [x1, (l + 2) * lh > H ? H : (l + 2) * lh, zb], t0 + d * (.66 + .3 * j / bz), d * .15, .38); }
      // Leiter
      const lx = x0 + .5; for (const dx of [0, .5]) g.L([lx + dx, 0, z0 + .45], [lx + dx, H + .6, z0 + .45], t0 + d * .8, d * .15, .7);
      for (let y = .35; y < H + .5; y += .45 * o.dens) g.L([lx, y, z0 + .45], [lx + .5, y, z0 + .45], t0 + d * (.82 + .15 * y / H), d * .05, .45);
    },
    // Fachwerkträger zwischen zwei Querschnitten (xa/xb: die zwei Gurtebenen), von z-Start bis z-Ende
    truss(x, y0, y1, za, zb, n, t0, d, w = .75) {
      const pl = (zb - za) / n;
      g.L([x, y0, za], [x, y0, zb], t0, d * .5, w, .05); g.L([x, y1, za], [x, y1, zb], t0 + d * .1, d * .5, w, .05);
      for (let i = 0; i <= n; i++) {
        const z = za + pl * i, t = t0 + d * (.2 + .7 * i / n);
        g.L([x, y0, z], [x, y1, z], t, d * .12, w * .8);
        if (i < n) { const up = i % 2 === 0; g.L([x, up ? y0 : y1, z], [x, up ? y1 : y0, z + pl], t + d * .03, d * .14, w * .65); }
      }
    },
    // wandernder Bauteil-Würfel (wird in der Seite als eigenes Objekt bewegt)
    mover(m) { movers.push(m); },
    finish() {
      const n = segs.length, P = new Float32Array(n * 6), B = new Float32Array(n * 6), I = new Float32Array(n * 8), E = new Float32Array(n * 4);
      segs.forEach(([a, b, t0, d, w, er, ns], i) => {
        const zm = (a[2] + b[2]) / 2, stag = ns ? .5 : clamp(-zm / o.Lb, 0, 1);
        const tt = clamp(t0 * .8 + stag * .18, 0, .97), dd = Math.min(d * .8, 1 - tt);
        const A = [X(a[0]), Y(a[1]), Z(a[2])], En = [X(b[0]), Y(b[1]), Z(b[2])];
        for (let v = 0; v < 2; v++) {
          P.set(A, i * 6 + v * 3); B.set(En, i * 6 + v * 3);
          I.set([tt, dd, w, v], i * 8 + v * 4);
          if (er) E.set([er[0] * .8 + .09, er[1] * .8], i * 4 + v * 2);
        }
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
      geo.setAttribute("aB", new THREE.BufferAttribute(B, 3));
      geo.setAttribute("aInfo", new THREE.BufferAttribute(I, 4));
      geo.setAttribute("aE", new THREE.BufferAttribute(E, 2));
      geo.userData.count = n;
      return geo;
    }
  };
  return g;
}

// Drahtwürfel für wandernde Bauteile, um den Ursprung zentriert
function wireBox(o, sx, sy, sz) {
  const g = Gen({ ox: 0, oy: 0, oz: 0, lat: o.lat, hs: o.hs, Lb: 1, dens: 1 });
  g.ns = true;
  g.box(-sx / 2, sx / 2, -sy / 2, sy / 2, -sz / 2, sz / 2, 0, .01, .9);
  return g.finish();
}
// Position eines Bauteils auf dem Bogen (Entwurfskoordinaten); u = 0..1
export function moverPos(m, u) {
  const e = u * u * (3 - 2 * u);
  return [m.from[0] + (m.to[0] - m.from[0]) * e, m.from[1] + (m.to[1] - m.from[1]) * e + m.lift * Math.sin(Math.PI * u), m.from[2] + (m.to[2] - m.from[2]) * e];
}

// ---------- Bauteile ----------
function skeleton(g, x0, x1, z0, z1, nx, nz, floors, fh, tb, ts, braceFace) {
  const xs = [], zs = [];
  for (let i = 0; i <= nx; i++) xs.push(x0 + (x1 - x0) * i / nx);
  for (let j = 0; j <= nz; j++) zs.push(z0 + (z1 - z0) * j / nz);
  for (const x of xs) for (const z of zs) g.rect(0, x - .12, x + .12, z + .12, z - .12, tb, ts * .1, .45);
  for (let k = 0; k < floors; k++) {
    const tl = tb + ts * (.1 + .8 * k / floors), td = ts * .8 / floors, y0 = k * fh, y1 = (k + 1) * fh;
    for (const x of xs) for (const z of zs) g.L([x, y0, z], [x, y1, z], tl, td * .5, .9, .06);
    for (const z of zs) g.L([xs[0], y1, z], [xs[nx], y1, z], tl + td * .45, td * .3, .8, .12);
    for (const x of xs) g.L([x, y1, zs[0]], [x, y1, zs[nz]], tl + td * .5, td * .3, .8, .12);
    for (let j = 0; j < nz; j++) g.L([xs[0], y1, (zs[j] + zs[j + 1]) / 2], [xs[nx], y1, (zs[j] + zs[j + 1]) / 2], tl + td * .7, td * .25, .28);
    if (braceFace) { g.L([xs[0], y0, zs[0]], [xs[1], y1, zs[0]], tl + td * .8, td * .3, .4); g.L([xs[1], y0, zs[0]], [xs[0], y1, zs[0]], tl + td * .82, td * .3, .4); }
  }
  g.rect(floors * fh + .35, xs[0], xs[nx], zs[0], zs[nz], tb + ts * .92, ts * .08, .5);
}
// Portalrahmen: zwei Stützen und Riegel
function portal(g, x0, x1, z, h, t0, d, w = .85) {
  g.L([x0, 0, z], [x0, h, z], t0, d * .45, w, .04); g.L([x1, 0, z], [x1, h, z], t0 + d * .05, d * .45, w, .04);
  g.L([x0, h, z], [x1, h, z], t0 + d * .5, d * .4, w, .05);
}
// Goldener Schnitt: Quadrate und Viertelkreise (Spirale) auf einer stehenden Fläche (xy) bei z
function golden(g, x0, y0, W, H, z, n, t0, d, w) {
  let xl = x0, yb = y0, xr = x0 + W, yt = y0 + H;
  g.rectXY(z, xl, xr, yb, yt, t0, d * .2, w * 1.1);
  for (let k = 0; k < n; k++) {
    const t = t0 + d * (.15 + .8 * k / n), td = d * .8 / n, w2 = xr - xl, h2 = yt - yb, ph = k % 4;
    if (ph === 0) { const s = h2; g.L([xl + s, yb, z], [xl + s, yt, z], t, td, w); g.arc([xl + s, yt, z], s, Math.PI, 1.5 * Math.PI, "xy", 14, t + td * .2, td * 1.4, w * 1.1); xl += s; }
    else if (ph === 1) { const s = w2; g.L([xl, yb + s, z], [xr, yb + s, z], t, td, w); g.arc([xl, yb + s, z], s, 1.5 * Math.PI, 2 * Math.PI, "xy", 14, t + td * .2, td * 1.4, w * 1.1); yb += s; }
    else if (ph === 2) { const s = h2; g.L([xr - s, yb, z], [xr - s, yt, z], t, td, w); g.arc([xr - s, yb, z], s, 0, .5 * Math.PI, "xy", 14, t + td * .2, td * 1.4, w * 1.1); xr -= s; }
    else { const s = w2; g.L([xl, yt - s, z], [xr, yt - s, z], t, td, w); g.arc([xr, yt - s, z], s, .5 * Math.PI, Math.PI, "xy", 14, t + td * .2, td * 1.4, w * 1.1); yt -= s; }
  }
}
// Steg von a nach b (Plan x/z), Höhe y, mit Geländer, Pfosten und Stützen
function walk(g, a, b, y, wd, t0, d, w = .7) {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l, nx = -uz * wd / 2, nz = ux * wd / 2;
  const n = Math.max(2, Math.round(l / 1.3));
  const P = (f, s, yy) => [a[0] + dx * f + nx * s, yy, a[1] + dz * f + nz * s];
  for (const s of [-1, 1]) { g.L(P(0, s, y), P(1, s, y), t0, d * .5, w); g.L(P(0, s, y + .75), P(1, s, y + .75), t0 + d * .12, d * .5, w * .7); }
  for (let i = 0; i <= n; i++) {
    const f = i / n, t = t0 + d * (.1 + .75 * f);
    g.L(P(f, -1, y), P(f, 1, y), t, d * .08, .4);
    for (const s of [-1, 1]) g.L(P(f, s, y), P(f, s, y + .75), t, d * .08, .5);
    if (i % 2 === 0) { g.L(P(f, 0, 0), P(f, 0, y), t + d * .02, d * .1, .55); }
  }
}

// ---------- Einheiten ----------
// sel: Textelement, an dem Zeit und Kamera hängen; side: 0 mittig/feste Lage; depth: Tiefe der Szene
export const UNITS = [
  // 0 Einstieg: Baugrund, daraus erhebt sich ein erster Rahmen
  { sel: ["#start .panel", 0], side: 0, nlat: .2, depth: 16, fn(g, o) {
    const s = .75 * o.dens, Lb = o.Lb;
    g.grid(-9.75, 9.75, 1.5, -Lb, s, s, 0, 0, .34, .2, .5, 4 / o.dens);
    const frame = (z, h, t, beam) => {
      g.rect(0, 2.7, 3.3, z + .3, z - .3, t - .04, .08, .5); g.rect(0, 6.7, 7.3, z + .3, z - .3, t - .04, .08, .5);
      g.L([3, 0, z], [3, h, z], t, .2, .95, .08); g.L([7, 0, z], [7, h, z], t + .02, .2, .95, .08);
      if (beam) g.L([3, h, z], [7, h, z], t + .2, .14, .95, .12);
    };
    frame(-5, 4.4, .3, true); frame(-10, 4.4, .4, true); frame(-15, 1.8, .5, false);
    for (const x of [3, 7]) { g.L([x, 4.4, -5], [x, 4.4, -10], .58, .16, .8, .1); g.L([x, 2.2, -5], [x, 2.2, -10], .64, .16, .4); }
    g.L([3, 0, -5], [7, 4.4, -5], .76, .14, .38); g.L([7, 0, -5], [3, 4.4, -5], .8, .14, .38);
  } },
  // 1 Gerwing: Fläche teilt sich Reihe für Reihe in Steine im Verband, daneben Stufen
  { sel: ["#arbeit .panel", 0], side: 0, nlat: .2, depth: 16, fn(g, o) {
    const d = o.dens;
    g.rect(0, -9.5, 9.5, 1.5, -15, 0, .1, .9);
    g.pave(-9.5, 9.5, 1.5, -15, .9 * d, .45 * d, 0, .06, .56, .3);
    g.stairs(1.6, 6.4, 0, -4.2, -1, 6, .4, .95, .34, .5, .8, d > 1 ? 0 : 1.2);
    g.stairs(7, 10.6, 0, -9, -1, 5, .5, 1.15, .44, .5, .8, d > 1 ? 0 : 1.2);
    g.stairs(-6, -3.2, 0, -12, -1, 4, .36, .9, .62, .3, .6);
    g.box(-2.6, -.9, 0, .2, -10, -11.4, .66, .1, .6); g.box(-2.5, -.8, .2, .4, -10.1, -11.5, .7, .1, .6); g.box(-2.65, -.95, .4, .6, -9.95, -11.35, .74, .1, .6);
    if (o.wires) for (const [a, b] of o.wires) g.Lw(a, b, .8, .14, .7);
  } },
  // 2 Betreuung und Absicherung: Gerüst um ein Haus
  { sel: ["#leistungen article", 0], fn(g, o) {
    const d = o.dens;
    g.grid(-5, 5, -1.2, -11.6, 1.3 * d, 1.3 * d, 0, 0, .3, .13, .3, 4 / d);
    g.house(-2, 2, -4, -9, 3.4, 1.8, 0, .3, .6, { door: true, win: true });
    g.scaffold(-3.5, 3.5, -2.6, -10.4, 4.4, 4, 3, 3, -2, 2, -4, -9, .28, .72, .78);
  } },
  // 3 Modernisierung: neuer, klarer Bau vor einem schiefen alten
  { sel: ["#leistungen article", 1], fn(g, o) {
    const d = o.dens;
    g.grid(-5, 5, -1.2, -13.6, 1.3 * d, 1.3 * d, 0, 0, .28, .12, .28, 4 / d);
    // alter Bau, schief, blass
    g.tf = p => [p[0] + p[1] * .24 + Math.sin(p[2] * .8) * .08, p[1] * (1 - .0), p[2]];
    g.house(-4.2, .6, -8.2, -13, 3.7, 1.9, 0, .34, .3, { win: true });
    g.L([-4.2, 3.7, -8.2], [-1.6, 3.0, -8.2], .3, .1, .3); // Dach hängt durch
    g.rectXY(-8.2, -2.7, -1.9, 1.4, 2.2, .32, .1, .26);
    g.tf = null;
    // neuer Bau davor
    g.box(-1.2, 4, 0, 3.3, -3, -7.2, .3, .38, .92);
    g.rect(3.42, -1.55, 4.35, -2.65, -7.55, .62, .14, .7); // Dachplatte mit Überstand
    for (let x = -.6; x < 3.5; x += .75 * d) g.L([x, 0, -3], [x, 3.3, -3], .56 + (x + 1.2) * .03, .1, .5);
    g.L([-1.2, 1.1, -3], [4, 1.1, -3], .66, .12, .55); g.L([-1.2, 2.3, -3], [4, 2.3, -3], .68, .12, .55);
    g.stairs(1.1, 2.9, 0, -2.6, 1, 2, .2, .5, .78, .12, .7);
    g.box(4.4, 5.8, 0, 2.2, -4, -6.2, .74, .14, .8); // Anbau
  } },
  // 4 Shops und Shop-Wechsel: Bauteile wandern auf Bögen von einem Baukörper in den anderen
  { sel: ["#leistungen article", 2], fn(g, o) {
    const d = o.dens;
    g.grid(-6.2, 6.2, -.5, -11.5, 1.5 * d, 1.5 * d, 0, 0, .28, .12, .28, 4 / d);
    g.box(-4.9, -1.5, 0, 4, -3, -7.2, .0, .3, .85); // alter Baukörper
    g.box(1.5, 4.9, 0, 4, -4.4, -9.6, .14, .34, .85); // neuer Baukörper
    g.rect(4.1, -5.1, -1.3, -2.8, -7.4, .26, .1, .5); g.rect(4.1, 1.3, 5.1, -4.2, -9.8, .4, .1, .5);
    let i = 0;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++, i++) {
      const tl = .42 + i * .075, dd = .24;
      const fx = -4.5 + c * 1.1 + .5, fy = r * 1.1 + .55, fz = -3.35;
      const tx = 2.0 + c * 1.1 + .5, ty = r * 1.1 + .55, tz = -4.75;
      // Zelle im alten Bau, verschwindet beim Abheben
      g.er = [tl, .05]; g.box(fx - .5, fx + .5, fy - .5, fy + .5, fz + K / 2, fz - K / 2, .18 + i * .02, .1, .7); g.er = null;
      // Spur des Bogens
      const pts = []; for (let k = 0; k <= 14; k++) { const u = k / 14, e = u * u * (3 - 2 * u); pts.push([fx + (tx - fx) * e, fy + (ty - fy) * e + 3.4 * Math.sin(Math.PI * u), fz + (tz - fz) * e]); }
      g.ns = true; g.poly(pts, tl, dd, .22);
      // Zelle im neuen Bau, entsteht bei der Ankunft
      g.box(tx - .5, tx + .5, ty - .5, ty + .5, tz + K / 2, tz - K / 2, tl + dd, .07, .8); g.ns = false;
      g.mover({ size: [1, 1, K], from: [fx, fy, fz], to: [tx, ty, tz], lift: 3.4, t0: tl, d: dd });
    }
  } },
  // 5 Schnittstellen und eigene Werkzeuge: getrennte Bauten, durch Stege verbunden
  { sel: ["#leistungen article", 3], fn(g, o) {
    const d = o.dens;
    g.grid(-5.6, 5.6, -.5, -14, 1.5 * d, 1.5 * d, 0, 0, .28, .12, .28, 4 / d);
    g.box(-4.4, -1.2, 0, 3, -2.6, -5.8, .0, .26, .85);
    g.box(1.2, 4.4, 0, 4.8, -6.4, -9.8, .2, .3, .85);
    g.box(-3.6, -.8, 0, 2.2, -10.6, -13.4, .42, .26, .85);
    for (let y = 1; y < 4.8; y += 1.2 * d) g.L([1.2, y, -6.4], [4.4, y, -6.4], .5, .1, .3);
    walk(g, [-1.2, -4.2], [1.2, -7.8], 2.1, .8, .5, .24);
    walk(g, [1.2, -9], [-.8, -11.6], 1.5, .8, .74, .22);
  } },
  // 6 Gestaltung: Proportionsraster mit Teilung legt sich auf eine Fassade
  { sel: ["#leistungen article", 4], fn(g, o) {
    const W = 8, H = 4.944, x0 = -4, z = -5.6;
    g.grid(-5.2, 5.2, 0, -12, 1.4 * o.dens, 1.4 * o.dens, 0, 0, .26, .11, .26, 4 / o.dens);
    g.box(x0, x0 + W, 0, H, z, z - .5, .0, .3, .85); // Fassadenscheibe
    golden(g, x0, 0, W, H, z + .02, 8, .22, .62, .62);
    g.arc([0, 0, -2], 3.2, 0, 2 * Math.PI, "xz", 40, .5, .3, .5); // Zirkelschlag am Boden
    g.L([0, 0, -2], [3.2, 0, -2], .56, .12, .5);
    g.arc([x0 + W, H, z + .02], 4.944, Math.PI, 1.5 * Math.PI, "xy", 24, .8, .14, .45);
  } },
  // 7 WBG Pooling: Halle mit Sheddach und Drehteller für die 360-Grad-Ansicht
  { sel: ["#weitere .panel", 0], fn(g, o) {
    const d = o.dens, x0 = -4.4, x1 = 4.4, z0 = -4, z1 = -10, h = 2.8;
    g.grid(-5.6, 5.6, -.5, -12.6, 1.5 * d, 1.5 * d, 0, 0, .26, .11, .26, 4 / d);
    g.box(x0, x1, 0, h, z0, z1, .0, .36, .85);
    const saws = 4, sw = (x1 - x0) / saws;
    for (let i = 0; i < saws; i++) {
      const xa = x0 + i * sw, t = .34 + i * .08;
      for (const z of [z0, z1]) { g.L([xa, h, z], [xa, h + 1, z], t, .1, .8, .03); g.L([xa, h + 1, z], [xa + sw, h, z], t + .06, .1, .8, .03); }
      g.L([xa, h + 1, z0], [xa, h + 1, z1], t + .1, .12, .7);
    }
    g.poly([[-.9, 0, z0], [-.9, 1.9, z0], [.9, 1.9, z0], [.9, 0, z0]], .7, .14, .9);
    g.arc([0, 0, -1.8], 2.4, 0, 2 * Math.PI, "xz", 36, .66, .22, .75); g.arc([0, 0, -1.8], 1.4, 0, 2 * Math.PI, "xz", 28, .7, .2, .5);
    for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; g.L([Math.cos(t) * 1.4, 0, -1.8 + Math.sin(t) * 1.4 * o.lat], [Math.cos(t) * 2.4, 0, -1.8 + Math.sin(t) * 2.4 * o.lat], .74 + a * .01, .08, .4); }
    g.box(-.45, .45, 0, .8, -1.8 + .2, -1.8 - .2, .8, .14, .9); // Produkt auf dem Teller
  } },
  // 8 Take the Gloves Off: offener Pavillon auf Podest
  { sel: ["#weitere .panel", 1], fn(g, o) {
    const d = o.dens;
    g.grid(-5, 5, -.5, -12.6, 1.5 * d, 1.5 * d, 0, 0, .26, .11, .26, 4 / d);
    g.box(-3.6, 3.6, 0, .35, -3.4, -9.6, .0, .2, .85);
    const px = [-3, 3], pz = [-4.2, -8.8], hh = 3.8;
    for (const x of px) for (const z of pz) g.L([x, .35, z], [x, hh, z], .22, .22, .9, .05);
    for (const z of pz) g.L([px[0], hh, z], [px[1], hh, z], .46, .14, .85, .08);
    for (const x of px) g.L([x, hh, pz[0]], [x, hh, pz[1]], .5, .14, .85, .08);
    g.L([px[0], hh, pz[0]], [0, hh + 1.2, -6.5], .6, .12, .7); g.L([px[1], hh, pz[0]], [0, hh + 1.2, -6.5], .62, .12, .7);
    g.L([px[0], hh, pz[1]], [0, hh + 1.2, -6.5], .64, .12, .7); g.L([px[1], hh, pz[1]], [0, hh + 1.2, -6.5], .66, .12, .7);
    g.stairs(-1.4, 1.4, 0, -3.4 + .9, 1, 2, .17, .45, .7, .14, .7);
    for (const x of px) g.L([x, 1.2, pz[0]], [x, 1.2, pz[1]], .56, .14, .35);
  } },
  // 9 Außerdem: Reihe kleiner, unterschiedlicher Häuser
  { sel: ["#weitere .panel", 2], fn(g, o) {
    const d = o.dens;
    g.grid(-5, 5, -.5, -14.4, 1.5 * d, 1.5 * d, 0, 0, .26, .11, .26, 4 / d);
    g.L([-5, 0, -2.6], [5, 0, -2.6], .0, .2, .5);
    g.house(-2.2, .4, -3.2, -5.4, 2.2, 1.2, .0, .22, .75, { door: true });
    g.box(1.4, 3.6, 0, 3.4, -4, -6.2, .12, .22, .75);
    g.house(-2.6, .6, -6.8, -9.6, 1.8, 1.4, .26, .22, .75, { win: true });
    g.box(1, 3.2, 0, 2.2, -7.6, -10.2, .36, .22, .75); g.L([1, 2.2, -7.6], [3.2, 2.9, -7.6], .56, .08, .7); g.L([1, 2.2, -10.2], [3.2, 2.9, -10.2], .58, .08, .7); g.L([1, 2.9 - .0, -7.6], [3.2, 2.9, -7.6], .6, .05, .4);
    g.house(-2, 1, -11.2, -14, 2.6, 1.6, .5, .24, .75, { door: true });
    g.box(1.8, 3.2, 0, 4.4, -11.6, -13.4, .62, .22, .75);
  } },
  // 10 Wie ich arbeite: ein Plan am Boden wird zum Bau
  { sel: ["#arbeitsweise .panel", 0], fn(g, o) {
    const d = o.dens, h = 3.1, th = .09;
    // Planblatt am Boden mit Rahmen und feiner Schraffur
    g.rect(0, -4.9, 4.9, -.8, -13.4, 0, .16, .45);
    g.rect(0, -4.6, 4.6, -1.1, -13.1, .03, .16, .25);
    for (let x = -4.6; x < 4.6; x += 1.5 * d) g.L([x, 0, -1.1], [x + 1.1, 0, -13.1], .08 + (x + 4.6) * .008, .14, .1);
    const plan = (x0, z0, x1, z1, t) => { // Wand im Plan: Doppellinie am Boden
      const ax = Math.abs(x1 - x0) > Math.abs(z1 - z0), ox = ax ? 0 : th, oz = ax ? th : 0;
      for (const s of [-1, 1]) g.L([x0 + ox * s, 0, z0 + oz * s], [x1 + ox * s, 0, z1 + oz * s], t, .12, .8);
    };
    const rise = (x0, z0, x1, z1, t, hh) => { // Wand wächst aus dem Plan: Eckkanten, dann Oberkante
      const ax = Math.abs(x1 - x0) > Math.abs(z1 - z0), ox = ax ? 0 : th, oz = ax ? th : 0;
      g.L([x0, 0, z0], [x0, hh, z0], t, .12, .85, .04); g.L([x1, 0, z1], [x1, hh, z1], t + .02, .12, .85, .04);
      for (const s of [-1, 1]) g.L([x0 + ox * s, hh, z0 + oz * s], [x1 + ox * s, hh, z1 + oz * s], t + .1, .16, .75);
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, (z1 - z0) / o.lat) / (2.4 * d)));
      for (let k = 1; k < n; k++) { const f = k / n; g.L([x0 + (x1 - x0) * f, 0, z0 + (z1 - z0) * f], [x0 + (x1 - x0) * f, hh, z0 + (z1 - z0) * f], t + .08 + .04 * k, .1, .35); }
    };
    const W = [
      [-3.6, -2.6, 3.6, -2.6, h], [3.6, -2.6, 3.6, -11, h], [3.6, -11, -3.6, -11, h], [-3.6, -11, -3.6, -2.6, h],
      [-3.6, -6.4, -1, -6.4, h * .8], [.9, -6.4, 3.6, -6.4, h * .8], [.2, -6.4, .2, -11, h * .8], [.2, -8.8, 3.6, -8.8, h * .8]
    ];
    W.forEach(([a, b, c, e, hh], i) => plan(a, b, c, e, .12 + i * .045));
    W.forEach(([a, b, c, e, hh], i) => rise(a, b, c, e, .42 + i * .045, hh));
    g.arc([-1, 0, -6.4], 1.3, 0, Math.PI / 2, "xz", 8, .5, .1, .55); // Türschwung im Plan
    g.arc([.2, 0, -10.2], 1.0, Math.PI / 2, Math.PI, "xz", 8, .54, .1, .55);
    // Dachgerüst über dem Flügel hinten
    for (const z of [-8.8, -11]) { g.L([-3.6, h, z], [0, h + 1.5, z], .8, .12, .7); g.L([3.6, h, z], [0, h + 1.5, z], .82, .12, .7); }
    g.L([0, h + 1.5, -8.8], [0, h + 1.5, -11], .88, .1, .7);
  } },
  // 11 Werdegang: ein Steg entlang einer Grundlinie, Konstruktionen von einfach zu komplex
  { sel: ["#werdegang .panel", 0], depth: 16, fn(g, o) {
    const d = o.dens, x = 0, w0 = 1.6;
    g.L([-w0, 0, 1], [-w0, 0, -15], 0, .5, .8, .1); g.L([w0, 0, 1], [w0, 0, -15], .02, .5, .8, .1);
    for (let z = .5; z > -15; z -= .8 * d) g.L([-w0, 0, z], [w0, 0, z], .05 + .45 * (.5 - z) / 15.5, .08, .3);
    const st = [-1.6, -4, -6.6, -9, -11.4, -14]; // sechs Stationen, von einfach zu komplex
    g.L([x, 0, st[0]], [x, 1.7, st[0]], .12, .1, .9, .04);
    portal(g, -1, 1, st[1], 2.4, .2, .12);
    g.box(-1.1, 1.1, 0, 1.6, st[2] + .8, st[2] - .8, .3, .12, .8); g.L([-1.1, 1.6, st[2] + .8], [0, 2.4, st[2] + .8], .38, .08, .7); g.L([1.1, 1.6, st[2] + .8], [0, 2.4, st[2] + .8], .4, .08, .7); g.L([0, 2.4, st[2] + .8], [0, 2.4, st[2] - .8], .42, .08, .7);
    skeleton(g, -1.4, 1.4, st[3] + 1, st[3] - 1, 1, 1, 2, 1.25, .42, .2, true);
    skeleton(g, -1.4, 1.4, st[4] + 1, st[4] - 1, 1, 1, 4, 1.25, .56, .22, true);
    skeleton(g, -1.6, 1.6, st[5] + 1, st[5] - 1, 1, 1, 6, 1.25, .72, .24, true);
  } },
  // 12 Stimme 1: Gewölbe aus Rippen
  { sel: ["#stimmen blockquote", 0], fn(g, o) {
    const cx = 0, hw = 2.4, sp = 2.0, d = o.dens;
    g.rect(0, cx - hw - .6, cx + hw + .6, 1, -12.8, 0, .25, .3);
    const zs = d > 1 ? [-2, -6, -10] : [-2, -4.8, -7.6, -10.4, -13];
    zs.forEach((z, k) => {
      const t = .1 + k * (.62 / zs.length);
      for (const x of [cx - hw, cx + hw]) g.L([x, 0, z], [x, sp, z], t, .12, .9, .05);
      g.arc([cx, sp, z], hw, Math.PI, 0, "xy", 14, t + .1, .16, .9);
    });
    for (const [x, y, w] of [[cx - hw, sp, .6], [cx + hw, sp, .6], [cx, sp + hw, .75], [cx - hw, 0, .6], [cx + hw, 0, .6]]) g.L([x, y, zs[0]], [x, y, zs[zs.length - 1]], .72, .2, w, .1);
    for (let k = 0; k < zs.length - 1; k++) g.L([cx - hw, sp, (zs[k] + zs[k + 1]) / 2], [cx + hw, sp, (zs[k] + zs[k + 1]) / 2], .86, .1, .3);
  } },
  // 13 Stimme 2: Arkade, Bogenfolge von der Seite
  { sel: ["#stimmen blockquote", 1], fn(g, o) {
    const d = o.dens, n = d > 1 ? 4 : 5, x = 0, sp = 2.4, r = 1.8;
    g.grid(-4, 4, -1, -13, 1.5 * d, 1.5 * d, 0, 0, .24, .1, .24, 4 / d);
    const zs = []; for (let i = 0; i <= n; i++) zs.push(-2.4 - i * 2.2);
    for (const xx of [x - 1.6, x + 1.6]) {
      zs.forEach((z, k) => {
        const t = .06 + .6 * k / zs.length;
        g.L([xx, 0, z], [xx, sp, z], t, .1, .9, .04);
        if (k < zs.length - 1) g.arc([xx, sp, (z + zs[k + 1]) / 2], r, 0, Math.PI, "yz", 14, t + .08, .14, .85);
      });
      g.L([xx, sp, zs[0]], [xx, sp, zs[zs.length - 1]], .66, .2, .6); g.L([xx, sp + r * .9, zs[0]], [xx, sp + r * .9, zs[zs.length - 1]], .74, .22, .55);
    }
    for (const z of zs) g.L([x - 1.6, sp, z], [x + 1.6, sp, z], .7, .12, .35);
  } },
  // 14 Für Agenturen: Brücke wächst von beiden Ufern
  { sel: ["#agenturen .panel", 0], depth: 16, fn(g, o) {
    const d = o.dens, xa = -1.5, xb = 1.5, y0 = 1, y1 = 2.9, zN = -2.4, zF = -13.8, n = 6, pl = (zN - zF) / n;
    g.box(-4.2, 4.2, -1.1, 0, zN + 1.2, zN, 0, .22, .8); g.box(-4.2, 4.2, -1.1, 0, zF, zF - 1.4, .02, .22, .8);
    for (let z = zN - 1.4; z > zF + .8; z -= 1.3 * d) { const pts = []; for (let x = -4.2; x <= 4.2; x += .9) pts.push([x, -1.1, z + Math.sin(x * 1.3 + z) * .18]); g.poly(pts, .1, .3, .22); }
    for (let k = 0; k <= 1; k++) { const zz = k ? zF : zN; for (const x of [xa, xb]) { g.L([x, 0, zz], [x, y0, zz], .1, .12, .9, .04); g.rect(0, x - .2, x + .2, zz + .15, zz - .15, .08, .06, .4); } }
    for (const x of [xa, xb]) {
      // von beiden Ufern gleichzeitig: Feld i hat die Zeit je nach Abstand zum nächsten Ufer
      for (let i = 0; i < n; i++) {
        const za = zN - i * pl, zb = zN - (i + 1) * pl, near = Math.min(i, n - 1 - i), t = .22 + .5 * near / (n / 2 - 1 + .0001) * .75;
        g.L([x, y0, za], [x, y0, zb], t, .14, .9, .02); g.L([x, y1, za], [x, y1, zb], t + .04, .14, .8, .02);
        g.L([x, y0, za], [x, y1, za], t, .08, .7);
        if (i === n - 1) g.L([x, y0, zb], [x, y1, zb], t, .08, .7);
        const up = i % 2 === 0; g.L([x, up ? y0 : y1, za], [x, up ? y1 : y0, zb], t + .05, .12, .55);
      }
    }
    for (let i = 0; i <= n; i++) { const z = zN - i * pl, near = Math.min(i, n - i), t = .24 + .5 * near / (n / 2) * .75; g.L([xa, y0, z], [xb, y0, z], t, .08, .5); if (i < n) g.L([xa, y1, z], [xb, y1, z - pl], t + .06, .08, .3); }
  } },
  // 15 Kontakt: die rote Linie läuft auf die Schwelle eines Hauses mit offener Tür
  { sel: ["#kontakt .panel", 0], side: 0, alignLine: -3.6, lineEnd: -4.5, fn(g, o) {
    const d = o.dens, x0 = d > 1 ? -4.5 : -7, x1 = d > 1 ? 2.7 : 1.3, h = 3.2, zf = -3.6, zb = -9.6, px0 = -.9, px1 = .5, ph = 2.6;
    g.grid(-9, 4, -.5, -12, 1.5 * d, 1.5 * d, 0, 0, .3, .13, .3, 4 / d);
    g.house(x0, x1, zf, zb, h, 1.8, .1, .5, .9);
    g.L([px0, 0, zf], [px0, ph, zf], .64, .12, 1, .04); g.L([px1, 0, zf], [px1, ph, zf], .66, .12, 1, .04); g.L([px0, ph, zf], [px1, ph, zf], .76, .1, 1, .08);
    g.L([px0 - .2, 0, zf], [px0 - .2, ph + .2, zf], .7, .1, .8); g.L([px1 + .2, 0, zf], [px1 + .2, ph + .2, zf], .71, .1, .8); g.L([px0 - .2, ph + .2, zf], [px1 + .2, ph + .2, zf], .78, .1, .8);
    const ox2 = px1 - .75, oz2 = zf + 1.3;
    g.L([px1, 0, zf], [ox2, 0, oz2], .82, .08, 1); g.L([px1, ph, zf], [ox2, ph - .06, oz2], .83, .08, 1); g.L([ox2, 0, oz2], [ox2, ph - .06, oz2], .86, .08, 1);
    g.arc([px1, 0, zf], 1.1, Math.PI * .72, Math.PI, "xz", 8, .86, .08, .4);
    g.stairs(px0 - .3, px1 + .3, 0, zf + .9, -1, 2, .17, .45, .84, .1, .7);
    // Blick durch die Tür: Boden und Rückwand der Diele
    g.rect(0, px0 + .1, px1 - .1, zf - .2, zb + 1, .88, .1, .45);
    g.rectXY(zb + 1, px0 + .1, px1 - .1, 0, ph - .2, .9, .08, .35);
  } }
];

export function buildUnit(i, o) {
  const g = Gen(o);
  UNITS[i].fn(g, o);
  const geometry = g.finish();
  const movers = g.movers.map(m => ({ ...m, geo: wireBox(o, ...m.size) }));
  return { geometry, movers };
}
