// Konstruktionen für Entwurf B Konstruktion 6: Arbeits- und Designobjekte als Linienmodelle im Raum, je Textabschnitt ein Objekt.
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
    float a = vA * smoothstep(1.6, 6.0, vDepth) * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
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
    movers, tf: null, er: null, ns: false, ts: 1, // ts: Zeitmaßstab, damit jedes Objekt fertig ist, wenn sein Text in der Mitte steht
    // Linie a -> b, wächst von a aus. t0/d: Zeitfenster (0..1) im Fortschritt, w: Deckkraft
    L(a, b, t0, d, w = .6, ov = 0) {
      if (g.tf) { a = g.tf(a); b = g.tf(b); }
      const fl = a[1] === 0 && b[1] === 0; // Boden: dezenter; Details (sehr zarte Linien) entfallen
      if (w < .3 && !fl) return;
      if (fl) w *= .72;
      if (ov) {
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], f = ov / (Math.hypot(dx, dy, dz) || 1);
        a = [a[0] - dx * f, a[1] - dy * f, a[2] - dz * f];
        b = [b[0] + dx * f, b[1] + dy * f, b[2] + dz * f];
      }
      segs.push([a, b, t0 * g.ts, d * g.ts, w, g.er && [g.er[0] * g.ts, g.er[1] * g.ts], g.ns]);
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

// ---------- Objekte in Weltmaßen ----------
// place(): legt fest, wo ein Objekt steht (Mitte x/z am Boden, Drehung um die Hochachse, Maßstab breit/schmal).
// Danach zeichnen alle Aufrufe in echten Weltmetern relativ zur Objektmitte; g.tf rechnet in die Entwurfskoordinaten
// des Generators um (x/lat, y/hs), so bleiben Proportionen auch bei schmalen Ansichten erhalten.
const PI = Math.PI, TS = .8;
function place(g, o, { x = 0, z = -7, yaw = 0, S = 1, Sn = .5, xn = 0, zn, yawn } = {}) {
  const nar = o.hs < .6, s = nar ? Sn : S, X0 = nar ? xn : x, Z0 = nar && zn !== undefined ? zn : z, a = nar && yawn !== undefined ? yawn : yaw;
  const c = Math.cos(a), sn = Math.sin(a);
  g.tf = p => { const px = p[0] * c + p[2] * sn, pz = -p[0] * sn + p[2] * c; return [(X0 + px * s) / o.lat, p[1] * s / o.hs, Z0 + pz * s]; };
  return nar;
}
// Ebene im Objektraum: Ursprung O, Breite u, Höhe v, Normale n (nach vorne). yaw dreht um die Hochachse, tilt neigt nach hinten.
function Pl(g, O, yaw = 0, tilt = 0) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
  const U = [cy, 0, -sy], V = [-sy * st, ct, -cy * st], N = [sy * ct, st, cy * ct];
  const P = (u, v, n = 0) => [O[0] + U[0] * u + V[0] * v + N[0] * n, O[1] + U[1] * u + V[1] * v + N[1] * n, O[2] + U[2] * u + V[2] * v + N[2] * n];
  const rr = (u0, u1, v0, v1, r) => {
    if (!r) return [[u0, v0], [u1, v0], [u1, v1], [u0, v1], [u0, v0]];
    const pts = [], c = [[u1 - r, v0 + r, -PI / 2], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, PI / 2], [u0 + r, v0 + r, PI]];
    pts.push([u0 + r, v0]);
    for (const [cu, cv, a] of c) for (let k = 0; k <= 4; k++) { const t = a + PI / 2 * k / 4; pts.push([cu + Math.cos(t) * r, cv + Math.sin(t) * r]); }
    pts.push([u0 + r, v0]);
    return pts;
  };
  const p = {
    P, O, U, V, N,
    L(a, b, t0, d, w = .6) { g.L(P(...a), P(...b), t0, d, w); },
    poly(pts, n, t0, d, w = .6) { g.poly(pts.map(q => P(q[0], q[1], n)), t0, d, w); },
    rect(u0, u1, v0, v1, n, t0, d, w = .6, r = 0) { p.poly(rr(u0, u1, v0, v1, r), n, t0, d, w); },
    circle(cu, cv, r, n, t0, d, w = .6, steps = 16, a0 = 0, a1 = 2 * PI) {
      const pts = []; for (let i = 0; i <= steps; i++) { const a = a0 + (a1 - a0) * i / steps; pts.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); }
      p.poly(pts, n, t0, d, w);
    },
    // Platte mit Tiefe: Vorderseite, Eckkanten, Rückseite
    slab(u0, u1, v0, v1, r, n0, n1, t0, d, w = .8) {
      p.rect(u0, u1, v0, v1, n0, t0, d * .5, w, r);
      const k = r * (1 - Math.SQRT1_2);
      for (const [u, v] of [[u0 + k, v0 + k], [u1 - k, v0 + k], [u1 - k, v1 - k], [u0 + k, v1 - k]]) g.L(P(u, v, n0), P(u, v, n1), t0 + d * .35, d * .3, w * .75);
      p.rect(u0, u1, v0, v1, n1, t0 + d * .5, d * .5, w * .7, r);
    }
  };
  return p;
}
// Seitenlayout auf einer Bildschirmfläche: Kopfzeile, Bildfläche, Textzeilen als Linien
function page(pl, u0, u1, v0, v1, n, t0, d, kind = "site", w = .5) {
  const W = u1 - u0, H = v1 - v0, m = Math.min(W, H) * .07, a = u0 + m, b = u1 - m, top = v1 - m, bot = v0 + m, IW = b - a, IH = top - bot;
  const T = f => t0 + d * f, D = d * .22;
  const img = (x0, x1, y0, y1, t) => { // Bildfläche mit Bergen und Sonne
    pl.rect(x0, x1, y0, y1, n, t, D, w);
    const iw = x1 - x0, ih = y1 - y0;
    pl.poly([[x0, y0 + ih * .12], [x0 + iw * .3, y0 + ih * .55], [x0 + iw * .48, y0 + ih * .32], [x0 + iw * .66, y0 + ih * .66], [x1, y0 + ih * .2]], n, t + D * .5, D, w * .8);
    pl.circle(x0 + iw * .78, y0 + ih * .78, Math.min(iw, ih) * .09, n, t + D * .7, D * .6, w * .8, 10);
  };
  const lines = (x0, x1, y, gap, ls, t) => ls.forEach((f, i) => pl.L([x0, y - i * gap, n], [x0 + (x1 - x0) * f, y - i * gap, n], t + i * D * .2, D * .6, w * .85));
  const header = () => {
    const hy = top - IH * .1;
    pl.L([a, hy, n], [b, hy, n], T(0), D, w);
    pl.rect(a, a + IW * .12, hy + IH * .025, top - IH * .015, n, T(.04), D * .6, w);
    for (let i = 0; i < 3; i++) pl.L([b - IW * (.34 - i * .11), (hy + top) / 2, n], [b - IW * (.26 - i * .11), (hy + top) / 2, n], T(.06 + i * .02), D * .5, w * .8);
    return hy;
  };
  if (kind === "site") {
    const hy = header();
    img(a, b, hy - IH * .5, hy - IH * .06, T(.14));
    lines(a, b, hy - IH * .62, IH * .08, [.7, .9, .55], T(.42));
    pl.rect(a, a + IW * .22, bot, bot + IH * .08, n, T(.66), D, w);
  } else if (kind === "shop") {
    const hy = header(), cols = 3, rows = 2, gw = IW / cols, gh = (hy - bot - IH * .04) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = a + c * gw + gw * .06, x1 = a + (c + 1) * gw - gw * .06, y1 = hy - IH * .04 - r * gh - gh * .04, y0 = y1 - gh * .92, t = T(.14 + (r * cols + c) * .07);
      pl.rect(x0, x1, y0 + gh * .26, y1, n, t, D * .7, w);
      pl.L([x0, y0 + gh * .14, n], [x0 + (x1 - x0) * .75, y0 + gh * .14, n], t + D * .3, D * .5, w * .8);
      pl.L([x0, y0 + gh * .03, n], [x0 + (x1 - x0) * .4, y0 + gh * .03, n], t + D * .4, D * .5, w * .8);
    }
  } else if (kind === "product") {
    const hy = header(), mid = a + IW * .52;
    img(a, mid, bot + IH * .14, hy - IH * .06, T(.12));
    for (let i = 0; i < 4; i++) pl.rect(a + i * IW * .13, a + i * IW * .13 + IW * .1, bot, bot + IH * .1, n, T(.36 + i * .03), D * .5, w * .8);
    const x0 = mid + IW * .06;
    lines(x0, b, hy - IH * .1, IH * .07, [.9, .6], T(.4));
    for (let i = 0; i < 4; i++) pl.circle(x0 + IW * .045 + i * IW * .1, hy - IH * .36, IW * .035, n, T(.52 + i * .03), D * .5, w * .85, 10);
    lines(x0, b, hy - IH * .52, IH * .07, [.8, .5], T(.6));
    pl.rect(x0, b, bot + IH * .02, bot + IH * .14, n, T(.72), D, w);
  } else if (kind === "dash") {
    const hy = header(), sx = a + IW * .24;
    pl.L([sx, hy, n], [sx, bot, n], T(.12), D, w);
    lines(a, sx - IW * .04, hy - IH * .1, IH * .1, [.8, .6, .9, .5], T(.16));
    for (let i = 0; i < 5; i++) {
      const y = hy - IH * (.12 + i * .16), x0 = sx + IW * .06, s = IH * .07, t = T(.3 + i * .09);
      pl.rect(x0, x0 + s, y - s, y, n, t, D * .5, w);
      pl.poly([[x0 + s * .2, y - s * .55], [x0 + s * .45, y - s * .82], [x0 + s * .85, y - s * .2]], n, t + D * .4, D * .5, w);
      pl.L([x0 + s * 1.7, y - s * .5, n], [x0 + s * 1.7 + (b - x0 - s * 1.7) * (.85 - (i % 3) * .2), y - s * .5, n], t + D * .2, D * .6, w * .85);
    }
  } else if (kind === "report") {
    const hy = header();
    lines(a, b, hy - IH * .1, IH * .07, [.75, .5], T(.12));
    const base = hy - IH * .62, bw = IW / 11, hs = [.2, .3, .26, .38, .44];
    pl.L([a, base, n], [b, base, n], T(.3), D, w);
    hs.forEach((f, i) => pl.rect(a + bw * (1 + i * 2), a + bw * (2 + i * 2), base, base + IH * f * .85, n, T(.36 + i * .05), D * .6, w));
    lines(a, b, base - IH * .1, IH * .08, [.9, .8, .6], T(.66));
  } else if (kind === "mail") {
    const hy = header();
    lines(a, b, hy - IH * .1, IH * .07, [.55], T(.1));
    for (let i = 0; i < 2; i++) pl.rect(a, b, hy - IH * (.3 + i * .14), hy - IH * (.2 + i * .14), n, T(.2 + i * .08), D, w);
    pl.rect(a, b, bot + IH * .2, hy - IH * .5, n, T(.4), D, w);
    lines(a + IW * .05, b - IW * .05, hy - IH * .58, IH * .07, [.9, .7, .8], T(.5));
    pl.rect(b - IW * .4, b, bot, bot + IH * .12, n, T(.72), D, w * 1.2);
  } else if (kind === "mobile") {
    const hy = top - IH * .08;
    pl.L([a, hy, n], [b, hy, n], T(0), D, w);
    pl.rect(a, a + IW * .3, hy + IH * .02, top - IH * .01, n, T(.04), D * .5, w);
    for (let i = 0; i < 3; i++) pl.L([b - IW * .22, hy + IH * (.018 + i * .018), n], [b, hy + IH * (.018 + i * .018), n], T(.06), D * .5, w * .8);
    img(a, b, hy - IH * .36, hy - IH * .04, T(.14));
    lines(a, b, hy - IH * .44, IH * .055, [.85, .95, .7, .5], T(.4));
    pl.rect(a, a + IW * .5, bot + IH * .06, bot + IH * .14, n, T(.66), D, w);
  } else if (kind === "old") { // alte, überladene Seite: Tabellen, Kästen, kleine Schrift
    const cols = 4;
    pl.rect(a, b, top - IH * .16, top, n, T(0), D, w);
    for (let i = 0; i <= cols; i++) pl.L([a + IW * i / cols, top - IH * .16, n], [a + IW * i / cols, bot, n], T(.08 + i * .02), D, w * .8);
    for (let r = 0; r < 6; r++) pl.L([a, top - IH * (.16 + r * .14), n], [b, top - IH * (.16 + r * .14), n], T(.14 + r * .02), D, w * .7);
    pl.L([a, bot, n], [b, bot, n], T(.3), D, w * .7);
    for (let r = 0; r < 5; r++) for (let c = 1; c < 3; c++) pl.L([a + IW * c / cols + IW * .03, top - IH * (.22 + r * .14), n], [a + IW * (c + 1) / cols - IW * .03, top - IH * (.22 + r * .14), n], T(.3 + r * .03), D, w * .7);
  } else if (kind === "portal") { // Industrieportal: Seitenleiste, Produktfläche mit Würfel
    const hy = header(), sx = a + IW * .22;
    pl.L([sx, hy, n], [sx, bot, n], T(.12), D, w);
    lines(a, sx - IW * .04, hy - IH * .1, IH * .09, [.8, .6, .9, .7, .5], T(.16));
    pl.rect(sx + IW * .05, b, bot + IH * .3, hy - IH * .06, n, T(.3), D, w);
    const cx = (sx + IW * .05 + b) / 2, cy = (bot + IH * .3 + hy - IH * .06) / 2, s = IH * .14;
    pl.poly([[cx - s, cy - s * .5], [cx, cy - s], [cx + s, cy - s * .5], [cx + s, cy + s * .5], [cx, cy + s], [cx - s, cy + s * .5], [cx - s, cy - s * .5]], n, T(.42), D, w);
    pl.poly([[cx - s, cy + s * .5], [cx, cy], [cx + s, cy + s * .5]], n, T(.5), D * .7, w * .8); pl.L([cx, cy, n], [cx, cy - s, n], T(.52), D * .6, w * .8);
    pl.circle(cx, cy, s * 1.7, n, T(.56), D * 1.2, w * .7, 24, -PI * .1, PI * 1.6);
    lines(sx + IW * .05, b, bot + IH * .18, IH * .08, [.9, .6], T(.66));
  }
}
// Kabel: hängender Bogen zwischen zwei Punkten
function cable(g, a, b, sag, t0, d, w = .55, steps = 16) {
  const pts = [];
  for (let i = 0; i <= steps; i++) { const u = i / steps; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u]); }
  g.poly(pts, t0, d, w);
}

// ---------- Objekte ----------
// Tisch: Platte mit Stärke, vier Beine, Zarge
function desk(g, x0, x1, z0, z1, h, t0, d, w = .85) {
  const th = .1, i = .18;
  g.box(x0, x1, h - th, h, z0, z1, t0, d * .5, w);
  for (const [x, z] of [[x0 + i, z0 - i], [x1 - i, z0 - i], [x1 - i, z1 + i], [x0 + i, z1 + i]]) {
    g.L([x, h - th, z], [x, 0, z], t0 + d * .35, d * .35, w * .9);
    g.L([x - .08, h - th, z], [x - .08, 0, z], t0 + d * .38, d * .35, .35);
  }
  g.L([x0 + i, h - th - .35, z0 - i], [x1 - i, h - th - .35, z0 - i], t0 + d * .7, d * .3, .45);
  g.L([x0 + i, .35, z0 - i], [x0 + i, .35, z1 + i], t0 + d * .75, d * .25, .35); g.L([x1 - i, .35, z0 - i], [x1 - i, .35, z1 + i], t0 + d * .78, d * .25, .35);
}
// Bildschirm auf Fuß; gibt die Bildschirmebene zurück
function monitor(g, cx, y, cz, w, h, yaw, kind, t0, d, op = {}) {
  const lift = op.lift ?? h * .28, th = op.th ?? .09, foot = Pl(g, [cx, y, cz], yaw, PI / 2);
  foot.rect(-w * .17, w * .17, -.32, .22, 0, t0, d * .12, .75, .08);
  const neck = Pl(g, [cx, y, cz - .05], yaw, 0);
  neck.slab(-.09, .09, 0, lift + Math.min(.3, h * .15), 0, 0, -.09, t0 + d * .08, d * .16, .7);
  const s = Pl(g, [cx, y + lift, cz + .06], yaw, op.tilt || 0);
  s.slab(-w / 2, w / 2, 0, h, .05, th, 0, t0 + d * .14, d * .3, .9);
  const bz = op.bezel ?? .07;
  s.rect(-w / 2 + bz, w / 2 - bz, bz + (op.chin || 0), h - bz, th + .005, t0 + d * .34, d * .14, .55);
  if (kind) page(s, -w / 2 + bz, w / 2 - bz, bz + (op.chin || 0), h - bz, th + .01, t0 + d * .45, d * .55, kind);
  return s;
}
// Laptop: Unterteil mit Tastatur und Touchpad, aufgeklappter Bildschirm
function laptop(g, cx, y, cz, w, dp, yaw, kind, t0, d, open = .28) {
  const th = .07, base = Pl(g, [cx, y, cz], yaw, PI / 2);
  base.slab(-w / 2, w / 2, 0, dp, .05, 0, th, t0, d * .24, .85);
  const kb = Pl(g, base.P(0, 0, th + .002), yaw, PI / 2);
  kb.rect(-w * .42, w * .42, dp * .42, dp * .92, 0, t0 + d * .32, d * .12, .5);
  for (let r = 1; r < 4; r++) kb.L([-w * .42, dp * (.42 + r * .125)], [w * .42, dp * (.42 + r * .125)], t0 + d * (.36 + r * .02), d * .1, .35);
  for (let c = 1; c < 10; c++) kb.L([-w * .42 + w * .084 * c, dp * .42], [-w * .42 + w * .084 * c, dp * .92], t0 + d * (.42 + c * .008), d * .08, .3);
  kb.rect(-w * .14, w * .14, dp * .07, dp * .34, 0, t0 + d * .44, d * .1, .5, .03);
  const hz = base.P(0, dp, th);
  const s = Pl(g, hz, yaw, open);
  s.slab(-w / 2, w / 2, 0, dp * 1.02, .05, 0, -.045, t0 + d * .2, d * .28, .9);
  s.rect(-w / 2 + .07, w / 2 - .07, .08, dp * 1.02 - .07, .01, t0 + d * .42, d * .12, .55);
  if (kind) page(s, -w / 2 + .07, w / 2 - .07, .08, dp * 1.02 - .07, .015, t0 + d * .5, d * .5, kind);
  return s;
}
// Handgerät (Smartphone oder Tablet), stehend mit Stütze; gibt Ebene zurück
function handheld(g, cx, y, cz, w, h, yaw, tilt, kind, t0, d, op = {}) {
  const th = op.th ?? .07, r = op.r ?? Math.min(w, h) * .1, s = Pl(g, [cx, y, cz], yaw, tilt);
  s.slab(-w / 2, w / 2, 0, h, r, th, 0, t0, d * .32, .9);
  const bz = op.bz ?? Math.min(w, h) * .06;
  s.rect(-w / 2 + bz, w / 2 - bz, bz * 1.3, h - bz * 1.3, th + .005, t0 + d * .3, d * .12, .55, r * .6);
  if (op.notch) s.L([-w * .1, h - bz * .65, th + .005], [w * .1, h - bz * .65, th + .005], t0 + d * .36, d * .06, .6);
  if (kind) page(s, -w / 2 + bz, w / 2 - bz, bz * 1.3, h - bz * 1.3, th + .01, t0 + d * .4, d * .55, kind);
  if (op.stand !== false && tilt > 0) { // Stütze hinten
    const k = Math.min(h * .22, .5), back = s.P(0, k, 0), foot = [back[0] - Math.sin(yaw) * k * 1.2, y, back[2] - Math.cos(yaw) * k * 1.2];
    for (const du of [-w * .3, w * .3]) { const b = s.P(du, k, 0); g.L(b, [foot[0] + Math.cos(yaw) * du, y, foot[2] - Math.sin(yaw) * du], t0 + d * .26, d * .14, .55); }
    g.L([foot[0] - Math.cos(yaw) * w * .3, y, foot[2] + Math.sin(yaw) * w * .3], [foot[0] + Math.cos(yaw) * w * .3, y, foot[2] - Math.sin(yaw) * w * .3], t0 + d * .3, d * .1, .5);
  }
  return s;
}
// Schreibtischlampe: Fuß, zwei Arme, Schirm
function lamp(g, x, y, z, yaw, s, t0, d) {
  const b = Pl(g, [x, y, z], yaw, PI / 2);
  b.circle(0, 0, .32 * s, 0, t0, d * .15, .7, 18); b.circle(0, 0, .32 * s, .06 * s, t0 + d * .05, d * .15, .5, 18);
  const j1 = [x, y + .06 * s, z], j2 = [x - Math.sin(yaw) * .5 * s, y + 1.45 * s, z - Math.cos(yaw) * .5 * s], hd = [x + Math.sin(yaw) * .55 * s, y + 1.9 * s, z + Math.cos(yaw) * .55 * s];
  for (const o of [-.04, .04]) { g.L([j1[0] + o, j1[1], j1[2]], [j2[0] + o, j2[1], j2[2]], t0 + d * .2, d * .25, .8); g.L([j2[0] + o, j2[1], j2[2]], [hd[0] + o, hd[1], hd[2]], t0 + d * .4, d * .22, .8); }
  Pl(g, j2, yaw + PI / 2, 0).circle(0, 0, .08 * s, 0, t0 + d * .42, d * .1, .6, 10);
  // Schirm: Kegel, Öffnung schräg nach unten vorne
  const ap = [hd[0], hd[1] + .08 * s, hd[2]], mouth = Pl(g, [hd[0] + Math.sin(yaw) * .3 * s, hd[1] - .45 * s, hd[2] + Math.cos(yaw) * .3 * s], yaw, PI / 2 + .55);
  mouth.circle(0, 0, .34 * s, 0, t0 + d * .6, d * .25, .85, 20);
  for (let k = 0; k < 6; k++) { const a = k / 6 * 2 * PI; g.L(ap, mouth.P(Math.cos(a) * .34 * s, Math.sin(a) * .34 * s, 0), t0 + d * .66 + k * d * .01, d * .2, k % 3 === 0 ? .7 : .4); }
}
// Tastatur flach auf dem Tisch
function keyboard(g, cx, y, cz, w, dp, yaw, t0, d) {
  const k = Pl(g, [cx, y, cz], yaw, PI / 2 - .08);
  k.slab(-w / 2, w / 2, 0, dp, .03, 0, .06, t0, d * .4, .7);
  for (let r = 1; r < 4; r++) k.L([-w / 2 + .08, dp * r / 4, .065], [w / 2 - .08, dp * r / 4, .065], t0 + d * (.45 + r * .05), d * .25, .32);
}
// Kanban-Tafel auf Rollständer: Spalten mit Karten, die von links nach rechts wandern
function kanban(g, cx, cz, W, H, yaw, t0, d) {
  const y0 = 1.0, s = Pl(g, [cx, y0, cz], yaw, 0), th = .08;
  s.slab(-W / 2, W / 2, 0, H, .04, th, 0, t0, d * .26, .9);
  for (const u of [-W / 2 + .25, W / 2 - .25]) { // Ständer
    s.L([u, -y0, -.04], [u, H + .1, -.04], t0 + d * .04, d * .2, .8);
    const f = Pl(g, s.P(u, -y0, -.04), yaw, PI / 2);
    f.L([0, -.7, 0], [0, .7, 0], t0 + d * .02, d * .14, .7);
  }
  const cols = 4, cw = (W - .3) / cols, hy = H - .42, n = th + .01;
  s.L([-W / 2 + .15, hy, n], [W / 2 - .15, hy, n], t0 + d * .26, d * .14, .6);
  for (let c = 0; c < cols; c++) {
    const u0 = -W / 2 + .15 + c * cw;
    if (c) s.L([u0, .12, n], [u0, H - .12, n], t0 + d * (.28 + c * .02), d * .14, .55);
    s.L([u0 + cw * .2, (hy + H) / 2, n], [u0 + cw * .65, (hy + H) / 2, n], t0 + d * .34, d * .08, .6);
    const nc = [3, 2, 2, 3][c];
    for (let k = 0; k < nc; k++) {
      const v1 = hy - .14 - k * .72, v0 = v1 - .56, a = u0 + cw * .12, b = u0 + cw * .88, t = t0 + d * (.42 + c * .1 + k * .025), nn = n + .03;
      s.rect(a, b, v0, v1, nn, t, d * .1, .7);
      s.L([a + .1, v1 - .18, nn], [b - .2, v1 - .18, nn], t + d * .04, d * .06, .42);
      s.L([a + .1, v1 - .32, nn], [a + (b - a) * .55, v1 - .32, nn], t + d * .05, d * .06, .38);
      if (c === cols - 1) s.poly([[b - .32, v0 + .2], [b - .22, v0 + .1], [b - .08, v0 + .32]], nn, t + d * .06, d * .06, .75); // geprüft
    }
  }
}
// Reißbrett: Gestell, geneigte Platte, Parallellineal, Zeichendreieck, Blatt mit Entwurf
function draftingBoard(g, cx, cz, W, H, yaw, t0, d) {
  const tilt = .62, hy = 1.65, base = Pl(g, [cx, 0, cz], yaw, 0);
  // Gestell: zwei Seitenböcke in Tiefe, Querstrebe
  for (const u of [-W * .38, W * .38]) {
    const f = base.P(u, 0, .9), b = base.P(u, 0, -1.1), top = base.P(u, hy, -.15);
    g.L(f, top, t0, d * .2, .85); g.L(b, top, t0 + d * .02, d * .2, .85);
    g.L(f, b, t0, d * .12, .6);
    g.L(base.P(u, .55, .55), base.P(u, .55, -.75), t0 + d * .16, d * .1, .5);
  }
  g.L(base.P(-W * .38, .55, -.6), base.P(W * .38, .55, -.6), t0 + d * .18, d * .12, .55);
  const s = Pl(g, base.P(0, hy - H * .45 * Math.cos(tilt), -.15 + H * .45 * Math.sin(tilt)), yaw, tilt);
  s.slab(-W / 2, W / 2, 0, H, .03, .1, 0, t0 + d * .2, d * .28, .95);
  // Blatt
  const n = .11, a = -W * .34, b = W * .3, v0 = H * .14, v1 = H * .9;
  s.rect(a, b, v0, v1, n, t0 + d * .42, d * .1, .55);
  // Entwurf auf dem Blatt: Raster und Seitenaufteilung
  const IW = b - a, IH = v1 - v0;
  for (let i = 1; i < 6; i++) s.L([a + IW * i / 6, v0 + .12, n], [a + IW * i / 6, v1 - .12, n], t0 + d * (.5 + i * .015), d * .1, .3);
  s.rect(a + .25, b - .25, v1 - IH * .3, v1 - .2, n, t0 + d * .58, d * .1, .6);
  s.circle(a + IW * .7, v1 - IH * .18, IH * .07, n, t0 + d * .62, d * .08, .55, 14);
  for (let i = 0; i < 3; i++) s.L([a + .25, v1 - IH * (.42 + i * .1), n], [a + .25 + (IW - .5) * [.8, .6, .7][i], v1 - IH * (.42 + i * .1), n], t0 + d * (.64 + i * .02), d * .08, .5);
  // Parallellineal mit Führungsseilen
  const ry = H * .3, rl = .16;
  s.slab(-W / 2 + .05, W / 2 - .05, ry, ry + rl, 0, n + .06, n, t0 + d * .6, d * .14, .9);
  s.L([-W / 2 + .1, .05, n], [-W / 2 + .1, H - .05, n], t0 + d * .58, d * .12, .4); s.L([W / 2 - .1, .05, n], [W / 2 - .1, H - .05, n], t0 + d * .58, d * .12, .4);
  // Zeichendreieck auf dem Lineal
  const tx = W * .02, tb = ry + rl, tw = 1.25, tv = 1.25;
  s.poly([[tx, tb], [tx + tw, tb], [tx, tb + tv], [tx, tb]], n + .07, t0 + d * .72, d * .12, .9);
  s.poly([[tx + .18, tb + .14], [tx + tw - .45, tb + .14], [tx + .18, tb + tv - .45], [tx + .18, tb + .14]], n + .07, t0 + d * .8, d * .1, .5);
  // Bleistift
  s.poly([[W * .3, ry + rl + .22], [W * .43, ry + rl + .5]], n + .05, t0 + d * .86, d * .08, .7);
}
// Server-Schrank: Gehäuse, Einschübe, Lüftungsschlitze, Statuslichter
function rack(g, cx, cz, W, H, D, yaw, t0, d) {
  const s = Pl(g, [cx, 0, cz], yaw, 0);
  s.slab(-W / 2, W / 2, 0, H, 0, 0, -D, t0, d * .34, .9);
  s.rect(-W / 2 + .12, W / 2 - .12, .25, H - .12, .005, t0 + d * .3, d * .12, .6);
  const n = 8, uh = (H - .5) / n;
  for (let k = 0; k < n; k++) {
    const v0 = .3 + k * uh, t = t0 + d * (.38 + k * .055);
    s.rect(-W / 2 + .2, W / 2 - .2, v0 + .04, v0 + uh - .04, .01, t, d * .08, .6);
    s.rect(W / 2 - .48, W / 2 - .38, v0 + uh * .38, v0 + uh * .62, .015, t + d * .05, d * .04, .75);
    if (k % 2 === 0) for (let i = 0; i < 4; i++) s.L([-W / 2 + .35 + i * .14, v0 + uh * .25, .015], [-W / 2 + .35 + i * .14, v0 + uh * .75, .015], t + d * .06, d * .04, .38);
    else s.L([-W / 2 + .35, v0 + uh * .5, .015], [W / 2 - .7, v0 + uh * .5, .015], t + d * .06, d * .05, .4);
  }
  for (const u of [-W / 2 + .2, W / 2 - .2]) s.rect(u - .08, u + .08, -.0, .06, -D * .15, t0 + d * .9, d * .05, .5); // Füße
}
// Röhrenmonitor: tiefes, nach hinten verjüngtes Gehäuse
function crt(g, cx, y, cz, w, h, yaw, kind, t0, d) {
  const s = Pl(g, [cx, y + .12, cz], yaw, 0), D = w * .85;
  Pl(g, [cx, y, cz - D * .35], yaw, PI / 2).rect(-w * .3, w * .3, -D * .25, D * .25, 0, t0, d * .1, .6, .05);
  s.slab(-w / 2, w / 2, 0, h, .06, 0, -.18, t0 + d * .05, d * .3, .9);
  const bk = [[-w * .3, h * .18], [w * .3, h * .18], [w * .3, h * .84], [-w * .3, h * .84]];
  s.poly([...bk, bk[0]], -D, t0 + d * .3, d * .2, .7);
  for (const [u, v] of [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]].map((q, i) => [q, bk[i]])) s.L([u[0], u[1], -.18], [v[0], v[1], -D], t0 + d * .25, d * .2, .7);
  s.rect(-w / 2 + .14, w / 2 - .14, .26, h - .14, .005, t0 + d * .36, d * .12, .6, .14);
  if (kind) page(s, -w / 2 + .14, w / 2 - .14, .26, h - .14, .01, t0 + d * .45, d * .5, kind, .45);
  s.circle(w / 2 - .22, .13, .04, .005, t0 + d * .5, d * .05, .6, 8);
}
// Browserfenster als Platte mit Tiefe: Titelleiste, Punkte, Adresszeile, Inhalt
function browser(g, O, w, h, yaw, kind, t0, d, tilt = 0) {
  const s = Pl(g, O, yaw, tilt);
  s.slab(-w / 2, w / 2, 0, h, .06, .06, 0, t0, d * .3, .9);
  const n = .065, ty = h - .32;
  s.L([-w / 2, ty, n], [w / 2, ty, n], t0 + d * .3, d * .12, .65);
  for (let i = 0; i < 3; i++) s.circle(-w / 2 + .2 + i * .17, (ty + h) / 2, .05, n, t0 + d * (.34 + i * .02), d * .06, .6, 8);
  s.rect(-w / 2 + .8, w / 2 - .3, ty + .08, h - .08, n, t0 + d * .38, d * .1, .45, .05);
  if (kind) page(s, -w / 2 + .05, w / 2 - .05, .05, ty, n, t0 + d * .42, d * .55, kind);
  return s;
}
// Staffelei mit Plakat (Erscheinungsbild)
function easel(g, cx, cz, W, H, yaw, t0, d) {
  const base = Pl(g, [cx, 0, cz], yaw, 0), lean = .2, top = .9 + H + .6;
  const apex = base.P(0, top, -.15);
  const ledgeY = .9, ln = .5 - (ledgeY / top) * .65, pt = ledgeY + H + .02;
  const leg = (a, b, w) => { // nur die Stücke unter der Ablage und über dem Plakat
    const at = y => [a[0] + (b[0] - a[0]) * y / top, y, a[2] + (b[2] - a[2]) * y / top];
    g.L(a, at(ledgeY), t0, d * .14, w); g.L(at(pt), b, t0 + d * .12, d * .1, w);
  };
  for (const u of [-W * .48, W * .48]) leg(base.P(u, 0, .5), apex, .85);
  leg(base.P(0, 0, -1.6), apex, .7);
  g.L(base.P(-W * .44, ledgeY, ln + .15), base.P(W * .44, ledgeY, ln + .15), t0 + d * .2, d * .12, .8);
  g.L(base.P(-W * .44, ledgeY, ln + .02), base.P(W * .44, ledgeY, ln + .02), t0 + d * .2, d * .12, .5);
  g.L(base.P(0, ledgeY, ln), base.P(0, ledgeY - .2, -1.6 * (ledgeY / top) - .1), t0 + d * .24, d * .1, .4);
  const s = Pl(g, base.P(0, ledgeY + .02, ln + .12), yaw, lean * .3);
  s.slab(-W / 2, W / 2, 0, H, 0, .07, 0, t0 + d * .26, d * .26, .9);
  // Plakat: großes Zeichen, kräftige Titelzeilen, Fußzeile
  const n = .075;
  s.rect(-W / 2 + .12, W / 2 - .12, .12, H - .12, n, t0 + d * .44, d * .1, .45);
  s.circle(-W * .12, H * .66, W * .2, n, t0 + d * .5, d * .16, .9, 28);
  s.circle(-W * .12, H * .66, W * .12, n, t0 + d * .56, d * .14, .65, 22);
  s.L([-W * .12 - W * .2, H * .66, n], [-W * .12 + W * .2, H * .66, n], t0 + d * .6, d * .1, .6);
  for (let i = 0; i < 2; i++) s.rect(-W * .36, W * (.36 - i * .22), H * (.3 - i * .1), H * (.38 - i * .1), n, t0 + d * (.64 + i * .04), d * .1, .8);
  s.L([-W * .36, H * .08 + .12, n], [W * .36, H * .08 + .12, n], t0 + d * .76, d * .08, .5);
  s.L([W * .16, H * .62, n], [W * .36, H * .62, n], t0 + d * .78, d * .06, .5); s.L([W * .16, H * .55, n], [W * .32, H * .55, n], t0 + d * .79, d * .06, .5);
}
// Drehteller (360-Grad-Ansicht) mit Produkt und Umlaufbogen
function turntable(g, cx, cz, r, yaw, t0, d) {
  const lo = Pl(g, [cx, 0, cz], yaw, PI / 2), hi = Pl(g, [cx, .35, cz], yaw, PI / 2);
  lo.circle(0, 0, r, 0, t0, d * .2, .6, 32); hi.circle(0, 0, r, 0, t0 + d * .1, d * .2, .85, 32);
  for (const a of [PI * .9, PI * 1.1, 0, PI * 1.5]) g.L(lo.P(Math.cos(a) * r, Math.sin(a) * r, 0), hi.P(Math.cos(a) * r, Math.sin(a) * r, 0), t0 + d * .15, d * .1, .55);
  hi.circle(0, 0, r * .55, 0, t0 + d * .2, d * .15, .4, 24);
  // Produkt: Gehäuse mit Flansch (Pumpe/Ventil)
  const p = Pl(g, [cx, .35, cz + .5], yaw, 0);
  p.slab(-.75, .75, 0, 1.1, .08, 0, -1, t0 + d * .32, d * .2, .9);
  p.circle(0, .55, .32, .005, t0 + d * .46, d * .1, .7, 18);
  p.circle(0, .55, .14, .005, t0 + d * .5, d * .08, .5, 12);
  const pi = Pl(g, [cx, 1.45, cz], yaw, PI / 2);
  pi.circle(0, 0, .22, 0, t0 + d * .5, d * .08, .6, 12); pi.circle(0, 0, .22, .35, t0 + d * .52, d * .08, .6, 12);
  for (const a of [0, PI]) g.L(pi.P(Math.cos(a) * .22, Math.sin(a) * .22, 0), pi.P(Math.cos(a) * .22, Math.sin(a) * .22, .35), t0 + d * .53, d * .06, .5);
  // Umlaufbogen mit Pfeil
  const orb = Pl(g, [cx, 1.0, cz], yaw, PI / 2), R = r * 1.25;
  orb.circle(0, 0, R, 0, t0 + d * .62, d * .28, .7, 40, PI * .15, PI * 1.85);
  const ae = PI * 1.85, ex = Math.cos(ae) * R, ey = Math.sin(ae) * R;
  orb.L([ex, ey, 0], [ex - .3, ey - .05, 0], t0 + d * .88, d * .06, .7); orb.L([ex, ey, 0], [ex - .05, ey - .3, 0], t0 + d * .88, d * .06, .7);
}
// Briefumschlag mit Tiefe
function envelope(g, O, w, h, yaw, tilt, t0, d) {
  const s = Pl(g, O, yaw, tilt);
  s.slab(-w / 2, w / 2, 0, h, 0, .05, 0, t0, d * .4, .85);
  s.poly([[-w / 2, h], [0, h * .42], [w / 2, h]], .055, t0 + d * .45, d * .3, .75);
  s.L([-w / 2, 0, .055], [-w * .12, h * .5, .055], t0 + d * .6, d * .2, .4); s.L([w / 2, 0, .055], [w * .12, h * .5, .055], t0 + d * .62, d * .2, .4);
}
// Grafiktablett mit Stift
function penTablet(g, cx, y, cz, w, dp, yaw, t0, d, tilt = .75) {
  const s = Pl(g, [cx, y, cz], yaw, tilt);
  for (const u of [-w * .32, w * .32]) { const q = s.P(u, dp * .55, 0); g.L(q, [q[0], y, q[2]], t0 + d * .3, d * .15, .5); }
  s.slab(-w / 2, w / 2, 0, dp, .06, 0, .06, t0, d * .4, .8);
  s.rect(-w / 2 + .35, w / 2 - .12, .12, dp - .12, .065, t0 + d * .4, d * .2, .5, .03);
  for (let i = 0; i < 3; i++) s.rect(-w / 2 + .1, -w / 2 + .24, dp * (.2 + i * .25), dp * (.2 + i * .25) + .14, .065, t0 + d * .5, d * .08, .4);
  // Stift: liegt schräg über dem Tablett
  const a = s.P(-w * .05, dp * .25, .2), b = s.P(w * .35, dp * .85, .45);
  for (const o of [-.03, .03]) g.L([a[0] + o, a[1], a[2]], [b[0] + o, b[1], b[2]], t0 + d * .62, d * .2, .75);
  g.L(s.P(-w * .05 - .08, dp * .25 - .1, .17), [a[0] - .03, a[1], a[2]], t0 + d * .8, d * .08, .7); g.L(s.P(-w * .05 - .08, dp * .25 - .1, .17), [a[0] + .03, a[1], a[2]], t0 + d * .8, d * .08, .7);
}
// Bodenraster wie in Konstruktion 4, nur zarter
function floor(g, o, x0, x1, z0, z1) {
  const d = o.dens, tf = g.tf; g.tf = null;
  g.grid(x0, x1, z0, z1, 1.5 * d, 1.5 * d, 0, 0, .26, .1, .24, 4 / d);
  g.tf = tf;
}

// ---------- Einheiten ----------
// sel: Textelement, an dem Zeit und Kamera hängen; side: 0 mittig/feste Lage; depth: Tiefe der Szene
export const UNITS = [
  // 0 Einstieg: der Arbeitsplatz. Schreibtisch mit Bildschirm, Tastatur, Laptop und Lampe
  { sel: ["#start .panel", 0], side: 0, nlat: .2, depth: 16, fn(g, o) {
    const s = .75 * o.dens, Lb = o.Lb;
    g.grid(-9.75, 9.75, 1.5, -Lb, s, s, 0, 0, .34, .2, .5, 4 / o.dens);
    place(g, o, { x: 2.5, z: -9.5, yaw: -.42, S: 1.18, Sn: .8, xn: 0, zn: -9, yawn: -.35 });
    desk(g, -2.6, 2.6, 1.1, -1.1, 1.55, .12, .3);
    monitor(g, -.3, 1.55, -.35, 2.5, 1.5, 0, "site", .36, .44);
    keyboard(g, -.3, 1.55, .55, 1.5, .4, 0, .56, .14);
    laptop(g, 1.75, 1.55, .25, 1.1, .75, .55, null, .6, .22);
    lamp(g, -2.1, 1.55, -.5, .5, 1.25, .72, .24);
    g.tf = null;
  } },
  // 1 Gerwing: Laptop mit Produktseite, daneben ein Stapel Pflastersteine
  { sel: ["#arbeit .panel", 0], side: 0, nlat: .2, depth: 16, fn(g, o) {
    floor(g, o, -9.5, 9.5, 1.5, -15);
    const nar = place(g, o, { x: 1.2, z: -15, yaw: -.3, S: 1.5, Sn: .7, xn: 0, zn: -9, yawn: -.3 });
    laptop(g, 0, 0, 0, 3.0, 2.0, 0, "product", .08, .6, .3);
    // Stapel Pflastersteine im Verband
    for (let l = 0; l < 3; l++) for (let i = 0; i < 3; i++) {
      const x = 2.4 + (i - 1) * .52 + (l % 2) * .26, y = l * .26;
      g.box(x - .25, x + .25, y, y + .24, .6, .1, .5 + l * .08 + i * .02, .12, .7);
    }
    g.tf = null;
  } },
  // 2 Betreuung und Absicherung: Server-Schrank, daneben Bildschirm mit Prüfliste
  { sel: ["#leistungen article", 0], fn(g, o) {
    floor(g, o, -5, 5, -1.2, -11.6);
    place(g, o, { z: -7.5, yaw: .45, S: 1, Sn: .6, zn: -7 });
    rack(g, -1.2, -.4, 1.7, 4.2, 1.6, 0, .05, .6);
    desk(g, .4, 2.9, .9, -.5, 1.3, .2, .25, .7);
    monitor(g, 1.65, 1.3, -.1, 2.0, 1.25, -.1, "dash", .4, .5);
    cable(g, [-.35, 3.6, -.9], [1.65, 2.2, -.35], .4, .78, .14, .45);
    g.tf = null;
  } },
  // 3 Modernisierung: Bildschirm, auf dem die alte Seite verschwindet und die neue entsteht
  { sel: ["#leistungen article", 1], fn(g, o) {
    floor(g, o, -5, 5, -1.2, -13.6);
    place(g, o, { z: -8, yaw: -.4, S: 1, Sn: .55, zn: -7.5 });
    crt(g, -3.3, 0, -1.6, 1.8, 1.5, .5, "old", .0, .3);
    const s = monitor(g, .4, 0, .6, 3.9, 2.4, 0, null, .12, .3, { lift: .7, th: .12, bezel: .12 });
    const a = -1.95 + .12, b = 1.95 - .12, v0 = .12, v1 = 2.4 - .12, n = .135;
    g.er = [.42, .12]; page(s, a, b, v0, v1, n, .22, .26, "old", .5); g.er = null;
    page(s, a, b, v0, v1, n, .52, .44, "site", .55);
    g.tf = null;
  } },
  // 4 Shops und Shop-Wechsel: Produkte wandern von einem Tablet auf ein neues
  { sel: ["#leistungen article", 2], fn(g, o) {
    floor(g, o, -5, 5, -.5, -11.5);
    const nar = place(g, o, { x: -.6, z: -7, yaw: 0, S: .95, Sn: .55, zn: -7 });
    const tw = 2.5, th = 1.8, tilt = .32;
    const A = handheld(g, -1.9, 0, .4, tw, th, .5, tilt, null, .0, .3, { r: .14 });
    const B = handheld(g, 1.9, 0, -.6, tw, th, -.5, tilt, "shop", .12, .5, { r: .14 });
    { const n = .08, hy = th - .32; A.L([-tw / 2 + .2, hy, n], [tw / 2 - .2, hy, n], .1, .1, .55); A.rect(-tw / 2 + .2, -tw / 2 + .5, hy + .05, hy + .17, n, .14, .06, .55); }
    // Kacheln im alten Shop: verschwinden beim Abheben
    let i = 0;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++, i++) {
      const u = -tw / 2 + .32 + c * .66, v = th - .62 - r * .62, tl = .42 + i * .07, dd = .22;
      g.er = [tl, .05]; A.rect(u, u + .52, v - .42, v + .02, .08, .18 + i * .02, .1, .7); g.er = null;
      // Bogen vom alten zum neuen Gerät (Spur); Kacheln als wandernde Bauteile
      const from = A.P(u + .26, v - .2, .2), to = B.P(-tw / 2 + .32 + c * .66 + .26, v - .2, .2);
      const pts = []; for (let k = 0; k <= 14; k++) { const q = k / 14, e = q * q * (3 - 2 * q); pts.push([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e + 1.6 * Math.sin(PI * q), from[2] + (to[2] - from[2]) * e]); }
      if (r === 0) { g.ns = true; g.poly(pts, tl, dd, .34); g.ns = false; }
      const L = p => g.tf(p);
      const f = L(from), t = L(to), top = L([0, 1.6, 0]);
      g.mover({ size: [.52 * (nar ? .55 : 1) / o.lat, .44 * (nar ? .55 : 1) / o.hs, .05], from: f, to: t, lift: top[1], t0: tl * TS, d: dd * TS });
    }
    g.tf = null;
  } },
  // 5 Schnittstellen und eigene Werkzeuge: drei Fenster (Website, CRM, Werkzeug), mit Kabeln verbunden
  { sel: ["#leistungen article", 3], fn(g, o) {
    floor(g, o, -5.6, 5.6, -.5, -14);
    place(g, o, { x: -.3, z: -5.8, yaw: .25, S: 1.1, Sn: .55, zn: -7 });
    browser(g, [-1.7, 1.0, 1.0], 2.6, 1.8, .25, "site", .0, .4);
    browser(g, [1.5, 1.5, -.8], 2.6, 1.8, -.15, "dash", .16, .4);
    browser(g, [-.4, -.3, -2.6], 2.4, 1.6, .1, "shop", .3, .4);
    for (const [a, b, t] of [[[-.4, 1.7, .95], [.2, 2.0, -.75], .55], [[-1.5, 1.0, .9], [-.9, 1.3, -2.5], .6], [[1.6, 1.5, -.85], [.8, .8, -2.5], .66]]) {
      cable(g, a, b, .5, t, .22, .6);
      for (const p of [a, b]) { g.box(p[0] - .09, p[0] + .09, p[1] - .07, p[1] + .07, p[2] + .07, p[2] - .07, t + .02, .06, .7); }
    }
    g.tf = null;
  } },
  // 6 Gestaltung: Reißbrett mit Parallellineal, Zeichendreieck und Entwurf
  { sel: ["#leistungen article", 4], fn(g, o) {
    floor(g, o, -5.2, 5.2, 0, -12);
    place(g, o, { z: -7, yaw: .38, S: 1, Sn: .55, zn: -6.5 });
    draftingBoard(g, 0, 0, 5.2, 3.3, 0, .0, .95);
    g.tf = null;
  } },
  // 7 WBG Pooling: Bildschirm mit Portal und Drehteller für die 360-Grad-Ansicht
  { sel: ["#weitere .panel", 0], fn(g, o) {
    floor(g, o, -5.6, 5.6, -.5, -12.6);
    place(g, o, { z: -7.5, yaw: -.35, S: 1, Sn: .55, zn: -7 });
    desk(g, -2.9, .6, 1.0, -.8, 1.3, .0, .26, .7);
    monitor(g, -1.15, 1.3, -.2, 2.8, 1.7, 0, "portal", .16, .5);
    turntable(g, 2.0, .6, 1.3, 0, .36, .6);
    g.tf = null;
  } },
  // 8 Take the Gloves Off: Staffelei mit Plakat für das Erscheinungsbild
  { sel: ["#weitere .panel", 1], fn(g, o) {
    floor(g, o, -5, 5, -.5, -12.6);
    place(g, o, { z: -6.5, yaw: .3, S: 1, Sn: .6, zn: -6.5 });
    easel(g, 0, 0, 2.5, 2.6, 0, .0, .9);
    g.tf = null;
  } },
  // 9 Außerdem: mehrere Referenzen auf Smartphone, Tablet und Laptop
  { sel: ["#weitere .panel", 2], fn(g, o) {
    floor(g, o, -5, 5, -.5, -14.4);
    place(g, o, { z: -7.5, yaw: -.25, S: 1, Sn: .55, zn: -7 });
    laptop(g, -1.7, 0, .2, 2.5, 1.7, .15, "site", .0, .5);
    handheld(g, 1.15, 0, -.2, 1.9, 2.5, -.05, .28, "report", .2, .45, { r: .14 });
    handheld(g, 2.7, 0, .7, .85, 1.75, -.25, .26, "mobile", .36, .44, { r: .13, notch: true, bz: .07 });
    g.tf = null;
  } },
  // 10 Wie ich arbeite: Kanban-Tafel, Karten laufen von Spalte zu Spalte bis „geprüft“
  { sel: ["#arbeitsweise .panel", 0], fn(g, o) {
    floor(g, o, -5.6, 5.6, -.8, -13.4);
    place(g, o, { z: -7.5, yaw: .32, S: 1, Sn: .5, zn: -7 });
    kanban(g, 0, 0, 5.4, 3.3, 0, .0, .95);
    g.tf = null;
  } },
  // 11 Werdegang: Geräte von früher bis heute auf einem langen Tisch
  { sel: ["#werdegang .panel", 0], depth: 16, fn(g, o) {
    floor(g, o, -5.6, 5.6, 1, -15);
    place(g, o, { x: .7, z: -7.5, yaw: -.38, S: 1.05, Sn: .62, zn: -7.5, yawn: -.3 });
    // Regal: Seitenwangen, Rückwand, vier Böden; unten das Älteste, oben das Neueste
    const W = 3.4, D = 1.2, ys = [.15, 1.65, 3.0, 4.3], z0 = D / 2, z1 = -D / 2;
    for (const x of [-W / 2, W / 2]) g.rectYZ(x, 0, ys[3] + .1, z0, z1, .0, .14, .85);
    g.rectXY(z1, -W / 2, W / 2, 0, ys[3] + .1, .06, .12, .5);
    ys.forEach((y, i) => { g.box(-W / 2, W / 2, y - .06, y, z0, z1, .08 + i * .04, .12, .8); });
    crt(g, -.2, ys[0], .05, 1.55, 1.15, 0, "old", .22, .2);
    monitor(g, -.65, ys[1], -.2, 1.5, .95, 0, "site", .38, .2, { lift: .2 });
    laptop(g, .95, ys[1], -.05, 1.05, .7, -.1, "site", .44, .18);
    handheld(g, -.45, ys[2], .1, 1.3, .95, 0, .28, "report", .56, .18, { r: .08, th: .05 });
    handheld(g, .85, ys[2], .2, .44, .9, -.1, .25, "mobile", .64, .16, { r: .06, th: .04, notch: true, bz: .04 });
    g.tf = null;
  } },
  // 12 Stimme 1: Tablet mit dem digitalen Wirkungsbericht, daneben dasselbe auf dem Smartphone
  { sel: ["#stimmen blockquote", 0], fn(g, o) {
    floor(g, o, -5, 5, -.5, -12.8);
    place(g, o, { z: -7.5, yaw: .3, S: 1, Sn: .55, zn: -7 });
    handheld(g, -.5, 0, 0, 3.4, 2.5, 0, .3, "report", .0, .7, { r: .18 });
    handheld(g, 2.2, 0, .9, .9, 1.8, -.2, .26, "report", .3, .6, { r: .13, notch: true, bz: .07 });
    g.tf = null;
  } },
  // 13 Stimme 2: Bildschirm mit fertigem Webdesign, davor Grafiktablett mit Stift für den letzten Schliff
  { sel: ["#stimmen blockquote", 1], fn(g, o) {
    floor(g, o, -5, 5, -1, -13);
    place(g, o, { z: -7.5, yaw: -.35, S: 1, Sn: .55, zn: -7 });
    desk(g, -2.8, 2.8, 1.0, -1.0, 1.3, .0, .26, .7);
    monitor(g, 0, 1.3, -.4, 3.3, 1.9, 0, "site", .14, .5, { chin: .2 });
    penTablet(g, 1.5, 1.3, .55, 1.5, 1.0, -.2, .5, .3);
    g.tf = null;
  } },
  // 14 Für Agenturen: zwei Bildschirme mit mehreren Fenstern laufender Projekte
  { sel: ["#agenturen .panel", 0], depth: 16, fn(g, o) {
    floor(g, o, -5.6, 5.6, -.5, -13.8);
    place(g, o, { z: -8, yaw: .3, S: 1, Sn: .5, zn: -7.5 });
    desk(g, -3.4, 3.4, .9, -.9, 1.3, .0, .24, .7);
    const A = monitor(g, -1.6, 1.3, -.2, 3.0, 1.8, .18, null, .14, .3);
    const B = monitor(g, 1.6, 1.3, -.2, 3.0, 1.8, -.18, null, .2, .3);
    const win = (s, u0, u1, v0, v1, n, t, kind) => {
      s.rect(u0, u1, v0, v1, n, t, .08, .75);
      s.L([u0, v1 - .2, n], [u1, v1 - .2, n], t + .04, .06, .5);
      for (let i = 0; i < 3; i++) s.circle(u0 + .1 + i * .1, v1 - .1, .03, n, t + .05, .04, .5, 6);
      if (kind) page(s, u0, u1, v0, v1 - .2, n, t + .08, .2, kind, .45);
    };
    win(A, -1.35, .3, .45, 1.65, .12, .44, "site");
    win(A, -.6, 1.35, .15, 1.25, .16, .54, "dash");
    win(B, -1.35, .55, .2, 1.65, .12, .5, "shop");
    win(B, .2, 1.35, .7, 1.55, .16, .62, null);
    for (let i = 0; i < 4; i++) B.L([.3, 1.2 - i * .12, .165], [1.25 - (i % 2) * .3, 1.2 - i * .12, .165], .7 + i * .02, .06, .4);
    keyboard(g, 0, 1.3, .5, 1.6, .4, 0, .74, .14);
    g.tf = null;
  } },
  // 15 Kontakt: die rote Linie läuft auf ein Smartphone mit geöffneter Nachricht, daneben ein Briefumschlag
  { sel: ["#kontakt .panel", 0], side: 0, doorX: -4.8, lineEnd: -4.5, fn(g, o) {
    floor(g, o, -6, 6, -.5, -12);
    place(g, o, { x: 0, z: -5.4, yaw: .2, S: .95, Sn: .6, xn: 0, zn: -5.6 });
    handheld(g, 0, 0, 0, 1.75, 3.5, 0, .2, "mail", .1, .65, { r: .22, notch: true, bz: .1 });
    envelope(g, [2.1, 0, -.9], 1.7, 1.1, -.35, .35, .55, .35);
    g.tf = null;
  } }
];

export function buildUnit(i, o) {
  const g = Gen(o);
  g.ts = TS;
  UNITS[i].fn(g, o);
  g.tf = null;
  const geometry = g.finish();
  const movers = g.movers.map(m => ({ ...m, geo: wireBox(o, ...m.size) }));
  return { geometry, movers };
}
