// Konstruktionen für Entwurf B Geräte: echte 3D-Arbeitsgeräte und Design-Objekte im Raum, je Textabschnitt eine Konstruktion,
// die den Absatz erzählt. Jede Konstruktion ist ein LineSegments-Objekt (dazu optional ein rotes Element);
// Wachsen und Abbauen läuft komplett im Vertex-Shader (uProg). Keine Maße, keine Achsmarken, keine Beschriftung im Raum.
// Bildschirme tragen Inhalt: echte Shopbilder (Gerwing) als Textur, sonst nur angedeutete Seitenstruktur aus Linien.
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
  const segs = [], movers = [], shots = [], spinners = [];
  const zo = o.zo || 0;
  const X = x => o.ox + x * o.lat, Y = y => o.oy + y * o.hs, Z = z => o.oz + z + zo;
  const g = {
    movers, shots, spinners, tf: null, er: null, ns: false, red: false, lat: o.lat, hs: o.hs,
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
      segs.push([a, b, t0, d, w, g.er, g.ns, g.red]);
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
    pave(x0, x1, z0, z1, cw, ch, y, t0, d, w, wr) {
      const rows = Math.round((z0 - z1) / ch);
      for (let r = 0; r <= rows; r++) {
        const z = z0 - r * ch, t = t0 + d * .7 * r / rows;
        g.L([x0, y, z], [x1, y, z], t, d * .3, wr || w * 1.25);
        if (r === rows) break;
        for (let x = x0 + (r % 2) * cw * .5; x < x1 - .01; x += cw) { if (x < x0 + .01) continue; g.L([x, y, z], [x, y, z - ch], t + d * .1, d * .2, w); }
      }
    },
    // Treppe: Wangen + Stufenkanten. Steigt in Richtung dz (+1/-1) an.
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
    // Kreisbogen: xy (stehend), xz (liegend, rund in Welt), yz (stehend, seitlich) – Radius in lokalen Einheiten
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
    // Bogen/Kreis mit Radius in Weltmetern: bleibt auch am Handy rund (x/y/z unterschiedlich skaliert)
    arcW(plane, c, rm, a0, a1, steps, t0, d, w = .6) {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const a = a0 + (a1 - a0) * i / steps, cs = Math.cos(a) * rm, sn = Math.sin(a) * rm;
        pts.push(plane === "xy" ? [c[0] + cs / o.lat, c[1] + sn / o.hs, c[2]]
          : plane === "yz" ? [c[0], c[1] + sn / o.hs, c[2] + cs]
          : [c[0] + cs / o.lat, c[1], c[2] + sn]);
      }
      g.poly(pts, t0, d, w);
    },
    ring(plane, c, rm, steps, t0, d, w) { g.arcW(plane, c, rm, 0, 2 * Math.PI, steps, t0, d, w); },
    // Halbkugel mit Meridianen und Breitenkreisen (Radius in Weltmetern)
    dome(c, rm, nm, nl, t0, d, w = .6) {
      for (let k = 0; k < nm; k++) {
        const ph = 2 * Math.PI * k / nm, pts = [];
        for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 * i / 8; pts.push([c[0] + rm * Math.cos(a) * Math.cos(ph) / o.lat, c[1] + rm * Math.sin(a) / o.hs, c[2] + rm * Math.cos(a) * Math.sin(ph)]); }
        g.poly(pts, t0 + d * .35 * k / nm, d * .6, w);
      }
      for (let j = 1; j <= nl; j++) {
        const a = Math.PI / 2 * j / (nl + 1);
        g.arcW("xz", [c[0], c[1] + rm * Math.sin(a) / o.hs, c[2]], rm * Math.cos(a), 0, 2 * Math.PI, 20, t0 + d * (.3 + .6 * j / nl), d * .25, w * .8);
      }
    },
    // Prisma über Umriss in der xy-Ebene, von z0 nach z1
    prism(pts, z0, z1, t0, d, w = .8) {
      const cl = [...pts, pts[0]];
      g.poly(cl.map(p => [p[0], p[1], z0]), t0, d * .5, w);
      g.poly(cl.map(p => [p[0], p[1], z1]), t0 + d * .25, d * .5, w);
      for (const p of pts) g.L([p[0], p[1], z0], [p[0], p[1], z1], t0 + d * .5, d * .4, w * .8);
    },
    // Rohr: zwei Mantellinien, Radius in Weltmetern
    pipe(a, b, rm, t0, d, w = .7) {
      const dx = Math.abs(b[0] - a[0]) * o.lat, dz = Math.abs(b[2] - a[2]);
      const off = dz >= dx ? [rm / o.lat, 0] : [0, rm / o.hs];
      for (const s of [-1, 1]) g.L([a[0] + off[0] * s, a[1] + off[1] * s, a[2]], [b[0] + off[0] * s, b[1] + off[1] * s, b[2]], t0, d, w);
    },
    // Flansch: zwei dicht stehende Ringe um die Achse (axis: "z" oder "x")
    flange(axis, c, rm, t0, d, w = .8) {
      const sh = .09;
      if (axis === "z") { g.ring("xy", c, rm, 14, t0, d, w); g.ring("xy", [c[0], c[1], c[2] - sh], rm, 14, t0 + d * .2, d, w); }
      else { g.ring("yz", c, rm, 14, t0, d, w); g.ring("yz", [c[0] + sh / o.lat, c[1], c[2]], rm, 14, t0 + d * .2, d, w); }
    },
    // Steg von a nach b (3D): zwei Holme, Sprossen, Stützen
    steg(a, b, wd, t0, d, w = .7) {
      const dx = (b[0] - a[0]) * o.lat, dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1;
      const px = -dz / l * wd / 2 / o.lat, pz = dx / l * wd / 2;
      const P = (f, s) => [a[0] + (b[0] - a[0]) * f + px * s, a[1] + (b[1] - a[1]) * f, a[2] + dz * f + pz * s];
      for (const s of [-1, 1]) g.L(P(0, s), P(1, s), t0, d * .6, w);
      const n = Math.max(2, Math.round(l / 1.2));
      for (let i = 0; i <= n; i++) { const f = i / n; g.L(P(f, -1), P(f, 1), t0 + d * (.1 + .8 * f), d * .1, w * .6); }
      for (const f of [.33, .66]) { const q = P(f, 0); g.L(q, [q[0], 0, q[2]], t0 + d * (.2 + .6 * f), d * .12, w * .6); }
    },
    // Linie in Weltkoordinaten
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
    // wandernder Bauteil-Körper (wird in der Seite als eigenes Objekt bewegt)
    mover(m) { movers.push(m); },
    // Bildschirmfläche mit Foto-Textur: Ecken links oben, rechts oben, rechts unten, links unten (lokale Koordinaten)
    shot(key, c, uv, t0, d) { shots.push({ key, c, uv, t0, d }); },
    // drehendes Objekt (eigenes Mesh, wächst mit dem Fortschritt der Einheit)
    spin(fn, pos) { spinners.push({ fn, pos }); },
    finish() {
      const pack = list => {
        const n = list.length, P = new Float32Array(n * 6), B = new Float32Array(n * 6), I = new Float32Array(n * 8), E = new Float32Array(n * 4);
        list.forEach(([a, b, t0, d, w, er, ns], i) => {
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
      };
      const main = segs.filter(s => !s[7]), reds = segs.filter(s => s[7]);
      const geo = pack(main);
      geo.userData.red = reds.length ? pack(reds) : null;
      return geo;
    }
  };
  return g;
}

// Körper eines wandernden Bauteils, um den Ursprung zentriert (Shape-Funktion oder Drahtwürfel)
function moverGeo(o, m) {
  const g = Gen({ ox: 0, oy: 0, oz: 0, lat: o.lat, hs: o.hs, Lb: 1, dens: 1 });
  g.ns = true;
  if (m.shape) m.shape(g);
  else { const [sx, sy, sz] = m.size; g.box(-sx / 2, sx / 2, -sy / 2, sy / 2, -sz / 2, sz / 2, 0, .01, .9); }
  return g.finish();
}
// Position eines Bauteils auf dem Bogen (Entwurfskoordinaten); u = 0..1
export function moverPos(m, u) {
  const e = u * u * (3 - 2 * u);
  return [m.from[0] + (m.to[0] - m.from[0]) * e, m.from[1] + (m.to[1] - m.from[1]) * e + m.lift * Math.sin(Math.PI * u), m.from[2] + (m.to[2] - m.from[2]) * e];
}


// ---------- Geräte-Werkzeug ----------
// Alles in „Designmetern“ (gleichmäßig skaliert mit s), x rechts, y oben, z zur Kamera. yaw dreht die ganze Gruppe um die Hochachse.
const M = .9, B = .62, F = .42; // Strichstärken: Hauptkante, Nebenkante, Detail
const cr = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
// Rahmen: Ursprung O, Rechtsachse U, Obenachse V, Normale N (zeigt zum Betrachter)
function frame(O, U, V) {
  const N = cr(U, V), f = { O, U, V, N };
  f.vec = (a, b, n = 0) => [U[0] * a + V[0] * b + N[0] * n, U[1] * a + V[1] * b + N[1] * n, U[2] * a + V[2] * b + N[2] * n];
  f.pt = (a, b, n = 0) => { const v = f.vec(a, b, n); return [O[0] + v[0], O[1] + v[1], O[2] + v[2]]; };
  f.turn = (ph, a = 0, b = 0, n = 0) => frame(f.pt(a, b, n), f.vec(Math.cos(ph), 0, -Math.sin(ph)), V); // ph > 0: Vorderseite nach rechts
  f.tilt = (th, a = 0, b = 0, n = 0) => frame(f.pt(a, b, n), U, f.vec(0, Math.cos(th), -Math.sin(th))); // Oberkante nach hinten
  f.lay = (a = 0, b = 0, n = 0) => frame(f.pt(a, b, n), U, f.vec(0, 0, -1)); // liegend: b läuft nach hinten, n nach oben
  f.at = (a = 0, b = 0, n = 0) => frame(f.pt(a, b, n), U, V);
  return f;
}
const FW = (x = 0, y = 0, z = 0) => frame([x, y, z], [1, 0, 0], [0, 1, 0]);

// Angedeutete Seitenstrukturen (normiert 0..1, y nach oben). r: Rechteck x0 y0 x1 y1, l: Linie x0 y x1, v: senkrecht x y0 y1, c: Kreis x y r
const PAGES = {
  site: [["r", .05, .84, .95, .95], ["r", .05, .45, .55, .76], ["l", .62, .7, .95], ["l", .62, .62, .88], ["l", .62, .54, .92], ["r", .62, .45, .8, .5], ["r", .05, .1, .31, .36], ["r", .37, .1, .63, .36], ["r", .69, .1, .95, .36]],
  shop: [["r", .05, .86, .95, .95], ["r", .05, .1, .31, .74], ["r", .08, .42, .28, .7], ["l", .08, .32, .28], ["l", .08, .22, .22], ["r", .37, .1, .63, .74], ["r", .4, .42, .6, .7], ["l", .4, .32, .6], ["l", .4, .22, .54], ["r", .69, .1, .95, .74], ["r", .72, .42, .92, .7], ["l", .72, .32, .92], ["l", .72, .22, .86]],
  dash: [["r", .05, .86, .95, .95], ["r", .05, .6, .31, .78], ["r", .37, .6, .63, .78], ["r", .69, .6, .95, .78], ["r", .05, .1, .58, .5], ["v", .14, .14, .3], ["v", .24, .14, .42], ["v", .34, .14, .24], ["v", .44, .14, .36], ["c", .7, .4, .025], ["l", .76, .4, .95], ["c", .7, .3, .025], ["l", .76, .3, .92], ["c", .7, .2, .025], ["l", .76, .2, .94]],
  phone: [["r", .1, .9, .9, .97], ["r", .1, .52, .9, .84], ["l", .1, .44, .9], ["l", .1, .36, .7], ["r", .1, .08, .9, .26]],
  login: [["c", .5, .78, .08], ["r", .2, .5, .8, .6], ["r", .2, .36, .8, .46], ["r", .2, .16, .8, .28]],
  list: [["r", .05, .86, .95, .95], ["c", .12, .7, .035], ["l", .2, .7, .9], ["c", .12, .55, .035], ["l", .2, .55, .82], ["c", .12, .4, .035], ["l", .2, .4, .88], ["c", .12, .25, .035], ["l", .2, .25, .78], ["r", .05, .06, .4, .16]],
  order: [["r", .05, .86, .95, .95], ["l", .05, .7, .95], ["l", .05, .56, .95], ["l", .05, .42, .95], ["l", .05, .28, .95], ["v", .35, .28, .78], ["v", .65, .28, .78], ["r", .65, .08, .95, .2]],
  product: [["r", .05, .86, .95, .95], ["r", .05, .1, .19, .26], ["r", .05, .32, .19, .48], ["r", .05, .54, .19, .7], ["r", .26, .1, .95, .78], ["l", .26, .84, .6]],
  clinic: [["r", .1, .9, .9, .97], ["r", .1, .5, .9, .82], ["r", .1, .1, .46, .4], ["r", .54, .1, .9, .4]],
  sound: [["c", .5, .6, .1], ["c", .5, .6, .2], ["c", .5, .6, .3], ["l", .2, .2, .8], ["l", .32, .12, .68]],
  report: [["v", .5, .1, .9], ["r", .08, .66, .44, .86], ["l", .08, .56, .44], ["l", .08, .48, .44], ["l", .08, .4, .38], ["l", .08, .32, .44], ["l", .08, .24, .3], ["c", .74, .64, .14], ["l", .56, .36, .92], ["l", .56, .28, .9], ["l", .56, .2, .78]],
  bakery: [["r", .08, .9, .92, .97], ["c", .5, .62, .2], ["l", .18, .3, .82], ["l", .28, .22, .72], ["r", .3, .08, .7, .15]],
  call: [["c", .5, .68, .14], ["l", .25, .42, .75], ["l", .35, .34, .65], ["r", .25, .12, .75, .24]],
  doc: [["r", .1, .86, .9, .95], ["l", .1, .74, .9], ["l", .1, .66, .82], ["l", .1, .58, .9], ["r", .1, .2, .5, .48], ["l", .58, .42, .9], ["l", .58, .34, .85], ["l", .58, .26, .9]],
  board: [["r", .08, .4, .92, .62]] // Platzhalter
};

function rig(g, o, op = {}) {
  const s = op.s || (o.lat > .3 ? o.lat / .62 : .55) * (op.k || .92), dx = op.dx || 0, dy = op.dy || 0;
  const yaw = op.yaw || 0, cy = Math.cos(yaw), sy = Math.sin(yaw);
  const zc = op.zc === undefined ? -5.4 : op.zc, xo = op.xo || 0, yo = op.yo || 0;
  const P = (x, y, z = 0) => [(x * cy + z * sy + dx) * s / o.lat + xo, (y + dy) * s / o.hs + yo, zc + (-x * sy + z * cy) * s];
  const R = { g, o, s, yaw, P };
  R.ln = (a, b, t, d, w = B) => g.L(P(...a), P(...b), t, d, w);
  R.pl = (pts, t, d, w = B) => g.poly(pts.map(p => P(...p)), t, d, w);
  R.rc = (f, a0, a1, b0, b1, n, t, d, w = B) => R.pl([f.pt(a0, b0, n), f.pt(a1, b0, n), f.pt(a1, b1, n), f.pt(a0, b1, n), f.pt(a0, b0, n)], t, d, w);
  // Rechteck mit abgerundeten Ecken
  R.rr = (f, a0, a1, b0, b1, n, r, t, d, w = B) => {
    const pts = [];
    for (const [ca, cb, q0] of [[a1 - r, b1 - r, 0], [a0 + r, b1 - r, Math.PI / 2], [a0 + r, b0 + r, Math.PI], [a1 - r, b0 + r, Math.PI * 1.5]])
      for (let i = 0; i <= 3; i++) { const q = q0 + Math.PI / 2 * i / 3; pts.push(f.pt(ca + Math.cos(q) * r, cb + Math.sin(q) * r, n)); }
    pts.push(pts[0]); R.pl(pts, t, d, w);
  };
  // Quader im Rahmen: Vorderseite bei n1, Rückseite bei n0
  R.sl = (f, a0, a1, b0, b1, n0, n1, t, d, w = M) => {
    R.rc(f, a0, a1, b0, b1, n1, t, d * .4, w);
    R.rc(f, a0, a1, b0, b1, n0, t + d * .3, d * .4, w * .8);
    for (const [a, b] of [[a0, b0], [a1, b0], [a1, b1], [a0, b1]]) R.ln(f.pt(a, b, n0), f.pt(a, b, n1), t + d * .2, d * .35, w * .8);
  };
  R.bx = (x0, x1, y0, y1, z0, z1, t, d, w = M) => R.sl(FW(), x0, x1, y0, y1, z0, z1, t, d, w);
  R.ci = (f, a, b, r, n, t, d, w = B, st = 16) => {
    const pts = [];
    for (let i = 0; i <= st; i++) { const q = Math.PI * 2 * i / st; pts.push(f.pt(a + Math.cos(q) * r, b + Math.sin(q) * r, n)); }
    R.pl(pts, t, d, w);
  };
  R.arc = (f, a, b, r, q0, q1, n, t, d, w = B, st = 12) => {
    const pts = [];
    for (let i = 0; i <= st; i++) { const q = q0 + (q1 - q0) * i / st; pts.push(f.pt(a + Math.cos(q) * r, b + Math.sin(q) * r, n)); }
    R.pl(pts, t, d, w);
  };
  // Kabel: durchhängende Linie von A nach B (ax: 1 = nach unten, 2 = seitlich nach vorn)
  R.cable = (A, Z, sag, t, d, w = B, ax = 1) => {
    const pts = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14, p = [A[0] + (Z[0] - A[0]) * u, A[1] + (Z[1] - A[1]) * u, A[2] + (Z[2] - A[2]) * u]; p[ax] -= sag * 4 * u * (1 - u) * (ax === 2 ? -1 : 1); pts.push(p); }
    R.pl(pts, t, d, w);
  };
  R.floor = (x0, x1, z0, z1, st, t, d, w = .26) => {
    const nx = Math.round((x1 - x0) / st), nz = Math.round((z1 - z0) / st), n = nx + nz + 2; let k = 0;
    for (let i = 0; i <= nx; i++, k++) R.ln([x0 + i * st, 0, z0], [x0 + i * st, 0, z1], t + d * .7 * k / n, d * .3, w);
    for (let j = 0; j <= nz; j++, k++) R.ln([x0, 0, z0 + j * st], [x1, 0, z0 + j * st], t + d * .7 * k / n, d * .3, w);
  };
  // Bildschirm: S = { f, a0, a1, b0, b1, n }; angedeutete Seitenstruktur
  R.pg = (S, name, t, d, w = .5, only) => {
    const L = typeof name === "string" ? PAGES[name] : name, n = L.length, wa = S.a1 - S.a0, hb = S.b1 - S.b0;
    const A = x => S.a0 + wa * x, Bb = y => S.b0 + hb * y, m = Math.min(wa, hb);
    L.forEach((e, i) => {
      const tt = t + d * .7 * i / n, dd = d * .3;
      if (e[0] === "r") R.rc(S.f, A(e[1]), A(e[3]), Bb(e[2]), Bb(e[4]), S.n, tt, dd, w);
      else if (e[0] === "l") R.ln(S.f.pt(A(e[1]), Bb(e[2]), S.n), S.f.pt(A(e[3]), Bb(e[2]), S.n), tt, dd, w * .8);
      else if (e[0] === "v") R.ln(S.f.pt(A(e[1]), Bb(e[2]), S.n), S.f.pt(A(e[1]), Bb(e[3]), S.n), tt, dd, w * .8);
      else R.ci(S.f, A(e[1]), Bb(e[2]), e[3] * m, S.n, tt, dd, w * .9, 14);
    });
  };
  // Foto-Textur auf einer Bildschirmfläche
  R.shot = (S, key, uv, t, d) => {
    const q = (a, b) => P(...S.f.pt(a, b, S.n));
    g.shot(key, [q(S.a0, S.b1), q(S.a1, S.b1), q(S.a1, S.b0), q(S.a0, S.b0)], uv, t, d);
  };
  R.sub = gg => rig(gg, o, { s, yaw, zc: 0 });
  // wanderndes Teil: shape(R2) zeichnet es um den Ursprung
  R.fly = sp => g.mover({ shape: gg => sp.shape(R.sub(gg)), from: P(...sp.from), to: P(...sp.to), lift: (sp.lift || 0) * s / o.hs, rot: sp.rot || 0, t0: sp.t0, d: sp.d });
  R.spin = (fn, c) => g.spin(gg => fn(R.sub(gg)), P(...c));
  R.desk = (x0, x1, zf, zb, y, th, t, d, w = M) => {
    R.bx(x0, x1, y - th, y, zb, zf, t, d * .5, w);
    for (const x of [x0 + .12, x1 - .12]) for (const z of [zf - .12, zb + .12]) R.ln([x, y - th, z], [x, 0, z], t + d * .4, d * .5, w * .8);
  };
  return R;
}

// ---------- Geräte ----------
function monitor(R, f, w, h, t, d, op = {}) {
  const lift = op.lift === undefined ? .42 : op.lift, we = op.w || M;
  R.sl(f, -.5, .5, 0, .04, -.34, .3, t, d * .35, we * .75);
  R.sl(f, -.07, .07, .04, lift + .02, -.14, -.08, t + d * .1, d * .3, we * .65);
  R.sl(f, -w / 2, w / 2, lift, lift + h, -.09, 0, t + d * .1, d * .5, we);
  const S = { f, a0: -w / 2 + .08, a1: w / 2 - .08, b0: lift + .08, b1: lift + h - .08, n: .004 };
  R.rc(f, S.a0, S.a1, S.b0, S.b1, S.n, t + d * .55, d * .3, we * .5);
  return S;
}
function laptop(R, f, w, t, d, op = {}) {
  const dp = w * .6, th = .06, h = w * .6, ang = op.ang === undefined ? .26 : op.ang;
  R.sl(f, -w / 2, w / 2, 0, th, -dp / 2, dp / 2, t, d * .35, M * .9);
  const fs = f.tilt(ang, 0, th, -dp / 2);
  R.sl(fs, -w / 2, w / 2, 0, h, -.05, 0, t + d * .15, d * .5, M);
  const S = { f: fs, a0: -w / 2 + .07, a1: w / 2 - .07, b0: .07, b1: h - .07, n: .004 };
  R.rc(fs, S.a0, S.a1, S.b0, S.b1, S.n, t + d * .6, d * .25, B * .8);
  const fk = f.lay(0, th, 0);
  R.rc(fk, -w * .44, w * .44, -dp * .06, dp * .4, .003, t + d * .5, d * .2, F);
  for (let i = 1; i < 4; i++) R.ln(fk.pt(-w * .44, -dp * .06 + dp * .46 * i / 4, .003), fk.pt(w * .44, -dp * .06 + dp * .46 * i / 4, .003), t + d * .55, d * .15, F);
  R.rc(fk, -w * .14, w * .14, -dp * .38, -dp * .18, .003, t + d * .6, d * .15, F);
  return S;
}
function phone(R, f, w, h, t, d, op = {}) {
  const ft = f.tilt(op.tilt === undefined ? .2 : op.tilt), r = Math.min(.13, Math.min(w, h) * .09);
  R.rr(ft, -w / 2, w / 2, 0, h, 0, r, t, d * .4, M * .9);
  R.rr(ft, -w / 2, w / 2, 0, h, -.06, r, t + d * .25, d * .4, M * .7);
  for (const [a, b] of [[-w / 2 + r * .3, r * .3], [w / 2 - r * .3, r * .3], [w / 2 - r * .3, h - r * .3], [-w / 2 + r * .3, h - r * .3]]) R.ln(ft.pt(a, b, -.06), ft.pt(a, b, 0), t + d * .3, d * .3, B * .7);
  const S = { f: ft, a0: -w / 2 + .06, a1: w / 2 - .06, b0: .13, b1: h - .13, n: .004 };
  R.rc(ft, S.a0, S.a1, S.b0, S.b1, S.n, t + d * .5, d * .3, B * .8);
  R.ci(ft, 0, h - .065, .016, .004, t + d * .7, d * .1, B * .8, 6);
  R.ln(ft.pt(0, h * .55, -.06), f.pt(0, 0, -h * .3), t + d * .3, d * .3, B * .8);
  return S;
}
function crt(R, f, w, h, t, d) {
  const lift = .4, dep = w * .9, bw = w * .55, bh = h * .55, y0 = lift + (h - bh) / 2 + .06;
  R.sl(f, -.5, .5, 0, .06, -dep * .55, .25, t, d * .3, M * .75);
  R.sl(f, -.12, .12, .06, lift + .1, -dep * .5, -.3, t + d * .05, d * .25, M * .6);
  R.sl(f, -w / 2, w / 2, lift, lift + h, -.2, 0, t + d * .1, d * .35, M);
  R.rc(f, -bw / 2, bw / 2, y0, y0 + bh, -dep, t + d * .35, d * .3, M * .8);
  for (const [a, b, c, e] of [[-w / 2, lift, -bw / 2, y0], [w / 2, lift, bw / 2, y0], [w / 2, lift + h, bw / 2, y0 + bh], [-w / 2, lift + h, -bw / 2, y0 + bh]]) R.ln(f.pt(a, b, -.2), f.pt(c, e, -dep), t + d * .4, d * .4, M * .75);
  const S = { f, a0: -w / 2 + .17, a1: w / 2 - .17, b0: lift + .17, b1: lift + h - .17, n: .004 };
  R.rc(f, S.a0, S.a1, S.b0, S.b1, S.n, t + d * .6, d * .3, B);
  return S;
}
function gamepad(R, f, t, d) {
  const O = [[-1.15, .3], [-1.0, .62], [-.6, .74], [-.34, .64], [.34, .64], [.6, .74], [1.0, .62], [1.15, .3], [1.22, -.2], [1.08, -.78], [.78, -.84], [.52, -.5], [.34, -.3], [-.34, -.3], [-.52, -.5], [-.78, -.84], [-1.08, -.78], [-1.22, -.2]];
  const cl = [...O, O[0]];
  R.pl(cl.map(p => f.pt(p[0], p[1], .12)), t, d * .5, M);
  R.pl(cl.map(p => f.pt(p[0], p[1], -.12)), t + d * .2, d * .5, M * .8);
  for (const i of [0, 2, 5, 7, 9, 11, 14, 16]) R.ln(f.pt(O[i][0], O[i][1], -.12), f.pt(O[i][0], O[i][1], .12), t + d * .4, d * .3, B);
  R.ci(f, -.62, .22, .22, .13, t + d * .6, d * .15, B, 14); R.ci(f, -.62, .22, .11, .13, t + d * .64, d * .12, F, 10);
  R.ci(f, .4, -.2, .2, .13, t + d * .66, d * .15, B, 14); R.ci(f, .4, -.2, .1, .13, t + d * .7, d * .12, F, 10);
  const c = [-.4, -.22], a = .09, e = .27; // Steuerkreuz
  R.pl([[a, e], [-a, e], [-a, a], [-e, a], [-e, -a], [-a, -a], [-a, -e], [a, -e], [a, -a], [e, -a], [e, a], [a, a], [a, e]].map(p => f.pt(c[0] + p[0], c[1] + p[1], .13)), t + d * .72, d * .2, B);
  for (const [da, db] of [[0, .18], [0, -.18], [.18, 0], [-.18, 0]]) R.ci(f, .72 + da, .26 + db, .07, .13, t + d * .8, d * .12, B, 8);
}

// ---------- Einheiten ----------
// sel: Textelement, an dem Zeit und Kamera hängen; side: 0 mittig/feste Lage; depth: Tiefe der Szene
// Zusätzliche Eingaben in o: word (Grundlinie der Überschrift), rl(z) (x der roten Linie), mod (Seitenverhältnis der Überschrift), rows (Eintrittszeit der Zeitleistenzeilen)
export const UNITS = [
  // 0 Einstieg: Schreibtisch, dessen Vorderkante an der Grundlinie des Namens ansetzt; Monitor, Laptop und Handy entstehen nacheinander, Kabel verbinden sie, am Schluss leuchtet ein roter Statuspunkt
  { sel: ["#start .panel", 0], side: 0, nlat: .2, depth: 16, fn(g, o) {
    const nar = o.lat < .3, s = nar ? .5 : o.lat / .62;
    const w = o.word || { xl: -6.5, xr: 3.4, y: 1.6, z: -2.2 };
    const DH = nar ? .85 : 1.0, Dd = nar ? 1.5 : 2.1, px0 = w.xl - .3;
    const R = rig(g, o, { s, xo: px0, yo: w.y - DH * s / o.hs, zc: w.z - Dd / 2 * s });
    const wr = Math.max(2, (w.xr - px0) * o.lat / s);
    const k = nar ? clamp((wr - .6) / 4.6, .35, .85) : .72;
    const x0 = nar ? .3 : wr + .22, Wd = nar ? wr + .35 : x0 + 3.55 * k + .5 * k + .3;
    const zf = Dd / 2, zb = -Dd / 2, th = .1, xs = nar ? 0 : wr + .1;
    // Tisch: die Vorderkante liegt auf der Grundlinie des Namens; die Platte setzt erst rechts vom Namen an
    R.ln([0, DH, zf], [Wd, DH, zf], 0, .16, .95);
    R.ln([0, DH - th, zf], [Wd, DH - th, zf], .04, .14, .6);
    R.ln([xs, DH, zb], [Wd, DH, zb], .1, .12, .7); R.ln([Wd, DH, zf], [Wd, DH, zb], .08, .1, .7);
    if (xs > 0) R.ln([xs, DH, zf], [xs, DH, zb], .1, .08, .55);
    R.ln([.15, DH - th, zf - .1], [.15, 0, zf - .1], .12, .12, .8); R.ln([Wd - .15, DH - th, zf - .1], [Wd - .15, 0, zf - .1], .12, .12, .8); R.ln([Wd - .15, DH - th, zb + .1], [Wd - .15, 0, zb + .1], .14, .12, .6);
    R.floor(-.6, Wd + .6, -2.8, 3.0, 1.2, 0, .3);
    // Geräte
    const mw = 1.7 * k, lw = 1.35 * k, pw = .5 * k, gp = .3 * k;
    const xm = x0 + mw / 2, xl = x0 + mw + gp + lw / 2, xp = x0 + mw + gp * 2 + lw + pw / 2;
    const sm = monitor(R, FW(xm, DH, -.3).turn(.1), mw, mw * .6, .2, .26);
    R.pg(sm, "site", .42, .12);
    const sl = laptop(R, FW(xl, DH, .1).turn(-.1), lw, .42, .22);
    R.pg(sl, "shop", .6, .1);
    const sp = phone(R, FW(xp, DH, .3).turn(-.2), pw, pw * 2, .6, .16);
    R.pg(sp, "phone", .72, .06);
    R.cable([xm + mw * .3, DH + .02, .0], [xl - lw * .35, DH + .02, .22], .1, .74, .16, .5, 2);
    R.cable([xl + lw * .42, DH + .02, .22], [xp - pw * .3, DH + .02, .34], .08, .8, .14, .5, 2);
    // roter Statuspunkt am Monitor
    g.red = true; R.ci(sm.f, sm.a1 - .06, sm.b0 - .045, .032, .006, .92, .06, 1, 10); R.ci(sm.f, sm.a1 - .06, sm.b0 - .045, .013, .006, .95, .05, 1, 8); g.red = false;
  } },
  // 1 Gerwing: Laptop und Handy zeigen die echten Shopbilder, davor ein Stapel Pflastersteine, eine feine rote Linie läuft vom Handy zu Palette und Paket
  { sel: ["#arbeit .panel", 0], side: 1, nlat: .2, depth: 16, fn(g, o) {
    const R = rig(g, o, { yaw: -.22, dy: -.4, dx: -.35, k: .9 });
    R.floor(-4.2, 4.2, -2.6, 4.0, 1.3, 0, .25);
    R.desk(-3.4, 1.4, 1.1, -1.1, 1.0, .09, .02, .2);
    const sl = laptop(R, FW(-1.5, 1.0, -.15).turn(.28), 2.6, .2, .3);
    R.shot(sl, "prod", [0, 0, .84, 1], .46, .1);
    const sp = phone(R, FW(.55, 1.0, .35).turn(-.15), .8, 1.55, .42, .18);
    R.shot(sp, "order", [.02, 0, .389, 1], .58, .08);
    // Stapel Pflastersteine im Verband
    const px = -1.7, pz = 2.6;
    for (let k = 0; k < 4; k++) {
      const y0 = k * .17, y1 = y0 + .17, t = .5 + k * .04;
      R.bx(px - .85, px + .85, y0, y1, pz - .5, pz + .5, t, .1, B);
      for (const x of (k % 2 ? [-.57, 0, .57] : [-.28, .28])) R.ln([px + x, y0, pz + .5], [px + x, y1, pz + .5], t + .06, .04, F);
    }
    for (const x of [-.28, .28]) R.ln([px + x, .68, pz - .5], [px + x, .68, pz + .5], .72, .06, F);
    // Palette mit Paket
    const qx = 2.0, qz = 1.7;
    R.bx(qx - .95, qx + .95, 0, .14, qz - .65, qz + .65, .66, .12, B);
    for (const x of [-.5, 0, .5]) R.ln([qx + x, .14, qz + .65], [qx + x, 0, qz + .65], .72, .05, F);
    R.bx(qx - .7, qx + .7, .14, 1.0, qz - .5, qz + .5, .72, .12, M);
    R.ln([qx, .14, qz + .5], [qx, 1.0, qz + .5], .82, .05, B); R.ln([qx - .7, 1.0, qz], [qx + .7, 1.0, qz], .83, .05, F);
    R.rc(FW(), qx + .15, qx + .55, .22, .5, qz + .5, .84, .05, F);
    // der Weg der Bestellung
    g.red = true; R.cable(sp.f.pt(0, sp.b0 - .02, .01), [qx - .1, 1.02, qz + .52], -.5, .86, .12, 1.2); g.red = false;
  } },
  // 2 Betreuung und Absicherung: Monitor mit Statusdashboard, daneben ein Server-Rack mit Einschub, ein Vorhängeschloss schließt sich (rot)
  { sel: ["#leistungen article", 0], fn(g, o) {
    const R = rig(g, o, { yaw: .2, dx: -.4 });
    R.floor(-4.2, 4.2, -2.6, 3.4, 1.3, 0, .25);
    R.desk(-3.4, 1.4, 1.0, -1.0, .95, .09, .02, .2);
    const sm = monitor(R, FW(-1.4, .95, -.2).turn(.05), 2.7, 1.6, .2, .26);
    R.pg(sm, "dash", .44, .16);
    // Rack mit vier Einschüben, der dritte wird eingeschoben
    const rx = 2.6, bands = [[.22, .6], [.7, 1.08], [1.18, 1.56], [1.66, 2.04]];
    R.bx(rx - .78, rx + .78, 0, 2.3, -.5, .6, .3, .26, M);
    bands.forEach(([y0, y1], i) => {
      if (i === 2) { R.rc(FW(), rx - .62, rx + .62, y0, y1, .6, .52, .06, F); return; }
      R.rc(FW(), rx - .62, rx + .62, y0, y1, .6, .48 + i * .03, .08, B);
      R.ci(FW(), rx + .46, (y0 + y1) / 2, .04, .6, .56 + i * .02, .05, B, 8);
    });
    const y3 = (bands[2][0] + bands[2][1]) / 2;
    g.er = [.64, .05]; R.bx(rx - .62, rx + .62, bands[2][0], bands[2][1], .3, 1.1, .5, .1, B); g.er = null;
    g.ns = true; R.rc(FW(), rx - .62, rx + .62, bands[2][0], bands[2][1], .6, .76, .06, B); R.ci(FW(), rx + .46, y3, .04, .6, .8, .05, B, 8); g.ns = false;
    R.fly({ shape: R2 => R2.bx(-.62, .62, -.19, .19, -.4, .4, 0, .01, B), from: [rx, y3, .7], to: [rx, y3, .2], lift: 0, rot: 0, t0: .64, d: .12 });
    // Vorhängeschloss (rot): zuerst offen, dann geschlossen
    const fl = FW(.5, .95, .5).turn(-.12);
    g.red = true;
    R.sl(fl, -.42, .42, 0, .68, -.15, .15, .62, .1, 1);
    R.ci(fl, 0, .36, .06, .15, .72, .05, 1, 8); R.ln(fl.pt(0, .3, .15), fl.pt(0, .18, .15), .74, .03, 1);
    g.er = [.84, .05];
    R.ln(fl.pt(-.3, .96, 0), fl.pt(-.3, 1.2, 0), .72, .04, 1); R.ln(fl.pt(.3, .96, 0), fl.pt(.3, 1.2, 0), .72, .04, 1); R.arc(fl, 0, 1.2, .3, 0, Math.PI, 0, .74, .06, 1);
    g.er = null;
    g.ns = true;
    R.ln(fl.pt(-.3, .68, 0), fl.pt(-.3, .9, 0), .9, .04, 1); R.ln(fl.pt(.3, .68, 0), fl.pt(.3, .9, 0), .9, .04, 1); R.arc(fl, 0, .9, .3, 0, Math.PI, 0, .92, .06, 1);
    g.ns = false; g.red = false;
  } },
  // 3 Modernisierung: alter Röhrenmonitor, dessen Blockstruktur in einen flachen Monitor hinüberwandert; der Röhrenmonitor baut sich ab
  { sel: ["#leistungen article", 1], fn(g, o) {
    const R = rig(g, o, { yaw: -.2 });
    R.floor(-4.2, 4.2, -2.6, 3.4, 1.3, 0, .25);
    R.desk(-3.3, 3.3, 1.0, -1.0, .95, .09, .02, .2);
    const tO = .18, tN = -.12;
    const fo = FW(-1.7, .95, -.1).turn(tO), fn = FW(1.5, .95, -.15).turn(tN);
    const blocks = [
      { k: "hdr", a: 0, b: .44, w: 1.3, h: .14 }, { k: "hero", a: -.38, b: .0, w: .62, h: .5 },
      { k: "txt", a: .34, b: .0, w: .46, h: .5 }, { k: "cards", a: 0, b: -.4, w: 1.34, h: .28 }];
    const draw = (R2, f, bl, a, b, t, d, w) => {
      if (bl.k === "hdr") R2.rc(f, a - bl.w / 2, a + bl.w / 2, b - bl.h / 2, b + bl.h / 2, .006, t, d, w);
      else if (bl.k === "hero") { R2.rc(f, a - bl.w / 2, a + bl.w / 2, b - bl.h / 2, b + bl.h / 2, .006, t, d * .6, w); R2.rc(f, a - bl.w / 2 + .1, a + bl.w / 2 - .1, b - bl.h / 2 + .1, b + bl.h / 2 - .1, .006, t + d * .4, d * .6, w * .7); }
      else if (bl.k === "txt") { R2.rc(f, a - bl.w / 2, a + bl.w / 2, b - bl.h / 2, b + bl.h / 2, .006, t, d * .6, w); for (const q of [.14, 0, -.14]) R2.ln(f.pt(a - bl.w / 2 + .07, b + q, .006), f.pt(a + bl.w / 2 - .07, b + q, .006), t + d * .4, d * .5, w * .7); }
      else for (let i = 0; i < 3; i++) { const cw = (bl.w - .14) / 3; R2.rc(f, a - bl.w / 2 + i * (cw + .07), a - bl.w / 2 + i * (cw + .07) + cw, b - bl.h / 2, b + bl.h / 2, .006, t + d * .2 * i, d * .7, w); }
    };
    // alt (baut sich ab)
    g.er = [.82, .15];
    const so = crt(R, fo, 1.9, 1.5, .2, .26);
    g.er = null;
    const bc = (so.b0 + so.b1) / 2;
    // neu, flach
    const sn = monitor(R, fn, 2.5, 1.45, .3, .24, { lift: .32 });
    const bn = (sn.b0 + sn.b1) / 2;
    const newPos = { hdr: [0, .48], hero: [-.7, .0], txt: [.55, .0], cards: [0, -.45] };
    blocks.forEach((bl, i) => {
      const t0 = .42 + i * .08, d = .2, fo0 = frame([0, 0, 0], fo.U, fo.V);
      g.er = [t0, .05]; draw(R, fo, bl, bl.a, bc + bl.b, .38 + i * .02, .06, B); g.er = null;
      R.fly({ shape: R2 => draw(R2, fo0, bl, 0, 0, 0, .01, B), from: fo.pt(bl.a, bc + bl.b, .02), to: fn.pt(newPos[bl.k][0], bn + newPos[bl.k][1], .02), lift: 1.0 + i * .12, rot: tN - tO, t0, d });
      g.ns = true; draw(R, fn, bl, newPos[bl.k][0], bn + newPos[bl.k][1], t0 + d, .02, B); g.ns = false;
    });
    g.red = true; R.ci(sn.f, sn.a1 - .06, sn.b0 - .045, .03, .006, .9, .06, 1, 10); R.ci(sn.f, sn.a1 - .06, sn.b0 - .045, .012, .006, .93, .05, 1, 8); g.red = false;
  } },
  // 4 Shops und Shop-Wechsel: zwei Tablets; Produkt-, Kunden- und Bestellkarten wandern auf Bögen vom linken ins rechte, danach ein Paket
  { sel: ["#leistungen article", 2], fn(g, o) {
    const R = rig(g, o, { yaw: .1, dx: .1, k: o.lat < .3 ? .88 : .94 });
    R.floor(-4.2, 4.2, -2.6, 3.4, 1.3, 0, .25);
    R.desk(-3.0, 3.0, 1.2, -1.0, .8, .09, .02, .2);
    const tL = .5, tR = -.5, W = 2.1, H = 1.45;
    const fL = FW(-1.7, .8, -.2).turn(tL), fR = FW(1.7, .8, -.2).turn(tR);
    const sL = phone(R, fL, W, H, .18, .26, { tilt: .22 }), sR = phone(R, fR, W, H, .26, .26, { tilt: .22 });
    const ca = [-.65, 0, .65], top = sL.b1 - .26, slotY = [top - .3, top - .83];
    const card = (R2, f, kind, a, b, t, d, w) => {
      R2.rc(f, a - .26, a + .26, b - .2, b + .2, .006, t, d * .5, w);
      if (kind === 0) { R2.rc(f, a - .2, a + .2, b - .02, b + .14, .006, t + d * .4, d * .4, w * .8); R2.ln(f.pt(a - .2, b - .11, .006), f.pt(a + .12, b - .11, .006), t + d * .6, d * .3, w * .7); }
      else if (kind === 1) { R2.ci(f, a - .14, b + .06, .07, .006, t + d * .4, d * .4, w * .8, 10); R2.ln(f.pt(a - .03, b + .09, .006), f.pt(a + .2, b + .09, .006), t + d * .5, d * .3, w * .7); R2.ln(f.pt(a - .03, b + .02, .006), f.pt(a + .14, b + .02, .006), t + d * .55, d * .3, w * .7); R2.ln(f.pt(a - .2, b - .11, .006), f.pt(a + .2, b - .11, .006), t + d * .6, d * .3, w * .7); }
      else { for (const q of [.1, .02, -.06]) R2.ln(f.pt(a - .2, b + q, .006), f.pt(a + .2, b + q, .006), t + d * .5, d * .3, w * .7); R2.rc(f, a + .06, a + .2, b - .17, b - .1, .006, t + d * .65, d * .25, w * .7); }
    };
    for (const [S, tt] of [[sL, .4], [sR, .46]]) {
      R.rc(S.f, S.a0 + .1, S.a1 - .1, S.b1 - .18, S.b1 - .07, S.n, tt, .06, F);
      for (const a of ca) R.rc(S.f, a - .29, a + .29, S.b0 + .1, S.b1 - .24, S.n, tt + .02, .08, B * .85);
    }
    // links: zweite Reihe bleibt stehen, die obere Karte jeder Spalte wandert
    for (let i = 0; i < 3; i++) card(R, sL.f, i, ca[i], slotY[1], .44 + i * .02, .08, B);
    const f0 = frame([0, 0, 0], sL.f.U, sL.f.V);
    for (let i = 0; i < 3; i++) {
      const t0 = .52 + i * .1, d = .2;
      g.er = [t0, .05]; card(R, sL.f, i, ca[i], slotY[0], .46 + i * .02, .08, B); g.er = null;
      R.fly({ shape: R2 => card(R2, f0, i, 0, 0, 0, .01, B), from: sL.f.pt(ca[i], slotY[0], .02), to: sR.f.pt(ca[i], slotY[0], .02), lift: 1.0 + i * .15, rot: tR - tL, t0, d });
      g.ns = true; card(R, sR.f, i, ca[i], slotY[0], t0 + d, .02, B); g.ns = false;
    }
    // Paket
    R.bx(-.5, .5, .8, 1.5, .4, 1.05, .84, .1, M);
    g.red = true; R.ln([0, .8, 1.05], [0, 1.5, 1.05], .94, .04, 1); R.ln([0, 1.5, 1.05], [0, 1.5, .4], .96, .04, 1); g.red = false;
  } },
  // 5 Schnittstellen und eigene Werkzeuge: drei Geräte, Stecker und Kabel; ein Stecker passt nicht, dort entsteht ein eigenes Adapterstück (rot)
  { sel: ["#leistungen article", 3], fn(g, o) {
    const R = rig(g, o, { yaw: -.12, dx: .05, k: .86 });
    R.floor(-4.2, 4.2, -2.6, 3.4, 1.3, 0, .25);
    R.desk(-3.5, 3.5, 1.3, -1.0, .8, .09, .02, .2);
    const yd = .8;
    const sm = monitor(R, FW(-2.45, yd, -.3).turn(.18), 1.5, .92, .16, .24, { lift: .32 });
    R.pg(sm, "dash", .38, .12);
    R.bx(-.6, .6, yd, yd + .26, -.5, .3, .22, .1, B);
    const st = phone(R, FW(0, yd + .26, -.1).turn(.0), 1.25, .95, .26, .24, { tilt: .18 });
    R.pg(st, "list", .44, .12);
    const sl = laptop(R, FW(2.55, yd, -.2).turn(-.2), 1.5, .34, .24);
    R.pg(sl, "order", .5, .12);
    // Stecker und Buchsen in der Frontansicht (z = 1.0): Buchsen sind Blöcke mit Schlitzen, Stecker tragen Zinken
    const z = 1.0, yp = yd + .17;
    const body = (x0, x1, t, d, w) => R.rc(FW(), x0, x1, yp - .15, yp + .15, z, t, d, w);
    const lines = (x, dir, len, ys, t, d, w) => { for (const y of ys) R.ln([x, yp + y, z], [x + dir * len, yp + y, z], t, d, w); };
    // Verbindung 1: Monitor -> Tablet; die Zinken des Steckers (zwei) passen nicht in die Buchse des Tablets (drei)
    body(-1.9, -1.6, .5, .08, B); lines(-1.6, -1, .15, [-.06, .06], .52, .05, F);
    body(-1.5, -1.2, .54, .08, B); lines(-1.5, -1, .25, [-.06, .06], .56, .05, B);
    R.cable([-1.2, yp, z], [-.98, yp, z], .1, .58, .08, B);
    body(-.98, -.68, .6, .08, B); lines(-.68, 1, .16, [-.06, .06], .62, .05, B);
    body(-.1, .2, .5, .08, B); lines(-.1, 1, .16, [-.09, 0, .09], .52, .05, F);
    // eigenes Adapterstück (rot) zwischen Stecker und Buchse
    g.red = true;
    body(-.58, -.3, .7, .1, 1.1);
    lines(-.58, 1, .13, [-.06, .06], .76, .05, 1);
    lines(-.3, 1, .26, [-.09, 0, .09], .8, .06, 1.1);
    g.red = false;
    // Verbindung 2: Tablet -> Laptop (passt)
    body(.5, .8, .56, .08, B); lines(.8, -1, .16, [-.09, 0, .09], .58, .05, F);
    body(.92, 1.22, .64, .08, B); lines(.92, -1, .18, [-.09, 0, .09], .66, .05, B);
    R.cable([1.22, yp, z], [1.5, yp, z], .1, .68, .08, B);
    body(1.5, 1.8, .72, .08, B); lines(1.8, 1, .18, [-.09, 0, .09], .74, .05, B);
    body(1.9, 2.2, .78, .08, B); lines(1.9, 1, .16, [-.09, 0, .09], .8, .05, F);
    // laufende Segmente auf den Kabeln
    const run = (a, b, t, n) => { for (let i = 0; i < n; i++) { const tt = t + i * .06; g.ns = true; g.er = [tt + .06, .05]; R.ln(a, b, tt, .05, 1.1); g.er = null; g.ns = false; } };
    run([-1.17, yp, z], [-1.0, yp, z], .84, 2); run([1.25, yp, z], [1.47, yp, z], .86, 2);
  } },
  // 6 Gestaltung: geneigtes Zeichenbrett mit Parallellineal und Winkel; auf dem Blatt entsteht ein Layout, das sich als Bildschirm abhebt und deckungsgleich darüber steht
  { sel: ["#leistungen article", 4], fn(g, o) {
    const R = rig(g, o, { yaw: .12, dx: -.1, dy: -.3, k: .84, zc: -4.6 });
    R.floor(-4.4, 4.4, -2.8, 3.4, 1.3, 0, .25);
    const fb = FW(0, 1.1, -.4).tilt(.74);
    const bw = 2.5, bh = 3.3;
    // Gestell: Beine und Querholm
    for (const sx of [-1, 1]) {
      R.ln(fb.pt(sx * 2.15, .15, -.05), [sx * 2.15, 0, .55], 0, .2, M);
      R.ln(fb.pt(sx * 2.15, 2.3, -.12), [sx * 2.5, 0, -2.5], .05, .2, B);
    }
    R.ln([-2.15, .45, .45], [2.15, .45, .45], .16, .12, B);
    R.sl(fb, -bw, bw, 0, bh, -.1, 0, 0, .3, M);
    R.sl(fb, -bw, bw, 0, .14, 0, .3, .2, .1, B);
    R.rc(fb, -2.05, 2.05, .45, 3.0, .012, .26, .1, B);
    // Parallellineal mit Seilzug
    R.sl(fb, -2.3, 2.3, 1.5, 1.64, 0, .05, .34, .14, B);
    for (const sx of [-1, 1]) { R.ln(fb.pt(sx * 2.3, 1.57, .03), fb.pt(sx * 2.3, 3.2, .03), .4, .1, F); R.ln(fb.pt(sx * 2.3, 1.57, .03), fb.pt(sx * 2.3, .1, .03), .4, .1, F); R.ci(fb, sx * 2.3, 3.28, .07, .03, .44, .05, F, 8); }
    // Zeichendreieck
    const tri = (d) => [[1.0 + d, .58 + d * .5], [2.0 - d * 1.6, .58 + d * .5], [1.0 + d, 1.34 - d * 1.9], [1.0 + d, .58 + d * .5]];
    R.pl(tri(0).map(p => fb.pt(p[0], p[1], .04)), .44, .1, B); R.pl(tri(.18).map(p => fb.pt(p[0], p[1], .04)), .48, .08, F);
    // Layout auf dem Blatt
    const lay = { f: fb, a0: -1.38, a1: 1.38, b0: 1.8, b1: 2.88, n: .02 };
    R.pg(lay, "site", .5, .22);
    // der Bildschirm hebt sich ab und steht deckungsgleich darüber
    const cb = (lay.b0 + lay.b1) / 2, hw = 1.5, hh = .66;
    const scr = (R2, f, t, d, red) => {
      R2.sl(f, -hw, hw, -hh, hh, -.07, 0, t, d * .5, M);
      const S = { f, a0: -hw + .08, a1: hw - .08, b0: -hh + .08, b1: hh - .08, n: .004 };
      R2.rc(f, S.a0, S.a1, S.b0, S.b1, S.n, t + d * .4, d * .3, F);
      R2.pg(S, "site", t + d * .5, d * .5, .5);
    };
    const f0 = frame([0, 0, 0], fb.U, fb.V), up = 1.5;
    R.fly({ shape: R2 => scr(R2, f0, 0, .01), from: fb.pt(0, cb, .1), to: fb.pt(0, cb, .1 + up), lift: 0, rot: 0, t0: .62, d: .22 });
    const fd = fb.at(0, cb, .1 + up);
    g.ns = true; scr(R, fd, .84, .1);
    for (const [a, b] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) R.ln(fb.pt(a, cb + b, .1), fd.pt(a, b, 0), .86, .06, F);
    g.ns = false;
    // roter Akzent: Schraffur im Bildblock des schwebenden Bildschirms
    g.red = true; g.ns = true;
    const sa0 = -hw + .08, sa1 = hw - .08, sb0 = -hh + .08, sb1 = hh - .08, hx0 = sa0 + (sa1 - sa0) * .05, hx1 = sa0 + (sa1 - sa0) * .55, hy0 = sb0 + (sb1 - sb0) * .45, hy1 = sb0 + (sb1 - sb0) * .76;
    for (let i = 0; i <= 5; i++) { const x = hx0 + (hx1 - hx0 - .12) * i / 5; R.ln(fd.pt(x, hy0, .008), fd.pt(x + .12, hy1, .008), .93 + i * .01, .04, 1); }
    g.red = false; g.ns = false;
  } },
  // 7 WBG Pooling: Monitor mit Produktportal, davor ein Produkt auf rotierendem Drehteller, daneben ein Login-Fenster mit Schloss, zwei Kabel zu zwei kleinen Geräten am Rand
  { sel: ["#weitere .panel", 0], fn(g, o) {
    const R = rig(g, o, { yaw: .16, dx: .1, k: .88 });
    R.floor(-4.4, 4.4, -2.6, 3.4, 1.3, 0, .25);
    R.desk(-3.8, 3.4, 1.2, -1.0, .95, .09, .02, .2);
    const yd = .95;
    const sm = monitor(R, FW(-.5, yd, -.35).turn(.0), 2.5, 1.5, .2, .26);
    R.pg(sm, "product", .44, .14);
    // Drehteller
    const fl = FW(-.5, yd, .75).lay(), cx = 0;
    R.ci(fl, 0, 0, 1.0, 0, .48, .1, M, 28); R.ci(fl, 0, 0, 1.0, .14, .52, .1, B, 28); R.ci(fl, 0, 0, .18, .14, .58, .06, F, 10);
    R.ln([-.5 - 1.0, yd, .75], [-.5 - 1.0, yd + .14, .75], .54, .05, B); R.ln([-.5 + 1.0, yd, .75], [-.5 + 1.0, yd + .14, .75], .54, .05, B);
    R.spin(R2 => {
      R2.bx(-.45, .45, 0, .42, -.3, .3, .6, .12, M);
      R2.bx(-.45, .05, .42, .92, -.3, .3, .68, .12, M);
      R2.ci(FW(), .2, .21, .11, .3, .76, .06, B, 10); R2.ci(FW(), -.2, .67, .1, .3, .8, .06, B, 10);
    }, [-.5, yd + .14, .75]);
    // Login-Fenster mit Schloss
    const fw = FW(2.0, yd, .0).turn(-.25);
    const sw = phone(R, fw, 1.55, 1.95, .5, .22, { tilt: .12 });
    const wa = sw.a1 - sw.a0, hb = sw.b1 - sw.b0, A = x => sw.a0 + wa * x, Bb = y => sw.b0 + hb * y;
    R.rc(sw.f, A(.38), A(.62), Bb(.74), Bb(.86), sw.n, .66, .06, B); R.arc(sw.f, A(.5), Bb(.86), wa * .09, 0, Math.PI, sw.n, .68, .05, B, 8);
    R.rc(sw.f, A(.2), A(.8), Bb(.52), Bb(.62), sw.n, .7, .05, F); R.rc(sw.f, A(.2), A(.8), Bb(.38), Bb(.48), sw.n, .72, .05, F);
    g.red = true; R.rc(sw.f, A(.2), A(.8), Bb(.18), Bb(.3), sw.n, .84, .08, 1); g.red = false;
    // zwei Kabel zu zwei kleinen Geräten am Rand
    R.bx(-3.5, -2.6, yd, yd + .5, -.8, -.2, .56, .1, B); R.bx(-3.5, -2.6, yd, yd + .5, .2, .8, .62, .1, B);
    for (const [zz, t] of [[-.5, .74], [.5, .8]]) R.rc(FW(), -3.35, -2.75, yd + .1, yd + .38, zz + .3, t - .1, .06, F);
    R.cable([-1.7, yd + .04, -.5], [-2.6, yd + .25, -.5], .2, .74, .14, .55);
    R.cable([-1.7, yd + .04, -.3], [-2.6, yd + .25, .5], .3, .8, .14, .55, 2);
  } },
  // 8 Take the Gloves Off: Staffelei mit Plakat (nur Blockstruktur), daneben ein Paar Boxhandschuhe, zurückhaltend
  { sel: ["#weitere .panel", 1], fn(g, o) {
    const R = rig(g, o, { yaw: .15, dx: o.lat < .3 ? .15 : -.1, k: o.lat < .3 ? .8 : .9 });
    R.floor(-4.2, 4.2, -2.6, 3.4, 1.3, 0, .25);
    const ex = -1.5;
    // Staffelei: zwei Holme, Querleisten, Stütze nach hinten
    for (const sx of [-1, 1]) { R.ln([ex + sx * 1.4, 0, .5], [ex + sx * 1.2, 3.7, .3], 0, .25, M); R.ln([ex + sx * 1.2, 3.7, .2], [ex + sx * 1.3, 0, -1.6], .05, .25, B * .8); }
    R.ln([ex - 1.2, 3.7, .3], [ex + 1.2, 3.7, .3], .2, .1, B);
    R.sl(FW(), ex - 1.3, ex + 1.3, .75, .87, .3, .78, .2, .12, B);
    const fp = FW(ex, .87, .62).tilt(.1);
    R.sl(fp, -.95, .95, 0, 2.6, -.04, 0, .3, .14, M);
    R.rc(fp, -.72, .72, .9, 1.85, .004, .5, .1, B);
    R.ln(fp.pt(-.72, .55, .004), fp.pt(.72, .55, .004), .56, .06, F); R.ln(fp.pt(-.72, .38, .004), fp.pt(.3, .38, .004), .58, .06, F);
    R.rc(fp, -.72, -.2, 2.05, 2.4, .004, .54, .06, F); R.ln(fp.pt(.0, 2.3, .004), fp.pt(.72, 2.3, .004), .6, .05, F);
    g.red = true; R.rc(fp, -.72, .72, 1.95, 2.0, .004, .7, .08, 1); R.ln(fp.pt(-.72, 1.975, .004), fp.pt(.72, 1.975, .004), .74, .06, 1); g.red = false;
    // Boxhandschuhe
    const glove = (f, t, d, m = 1) => {
      const X = a => a * m, O = [[-.5, .62], [-.66, .95]];
      for (let k = 0; k <= 12; k++) { const a = Math.PI * (1 - k / 12); O.push([.66 * Math.cos(a), 1.2 + .66 * Math.sin(a)]); }
      O.push([.66, .95], [.5, .62]);
      const th = [[-.66, .95], [-.94, 1.08], [-.98, 1.34], [-.78, 1.56], [-.5, 1.5]].map(p => [X(p[0]), p[1]]);
      O.forEach(p => { p[0] = X(p[0]); });
      R.pl([f.pt(X(-.5), 0, .2), ...O.map(p => f.pt(p[0], p[1], .2)), f.pt(X(.5), 0, .2), f.pt(X(-.5), 0, .2)], t, d * .5, M * .9);
      R.pl([f.pt(X(-.5), 0, -.2), ...O.map(p => f.pt(p[0], p[1], -.2)), f.pt(X(.5), 0, -.2), f.pt(X(-.5), 0, -.2)], t + d * .2, d * .5, M * .6);
      for (const i of [0, 3, 8, 12, 15]) R.ln(f.pt(O[i][0], O[i][1], -.2), f.pt(O[i][0], O[i][1], .2), t + d * .4, d * .3, B * .8);
      for (const x of [-.5, .5]) R.ln(f.pt(X(x), 0, -.2), f.pt(X(x), 0, .2), t + d * .4, d * .2, B * .8);
      R.pl(th.map(p => f.pt(p[0], p[1], .2)), t + d * .55, d * .25, M * .8);
      for (const y of [.14, .32, .5]) R.ln(f.pt(X(-.5), y, .2), f.pt(X(.5), y, .2), t + d * .6, d * .15, F);
      R.pl([f.pt(X(-.5), 1.5, .2), f.pt(X(-.4), 1.1, .2), f.pt(X(-.66), .95, .2)], t + d * .7, d * .2, F);
    };
    glove(FW(1.45, 0, .3).turn(.45).tilt(.08), .56, .16);
    glove(FW(2.75, 0, -.1).turn(-.45).tilt(.12), .66, .16, -1);
  } },
  // 9 Außerdem: vier Geräte nebeneinander mit je anderer Seitenstruktur, das dritte ein Tablet mit aufgeschlagenem Bericht
  { sel: ["#weitere .panel", 2], fn(g, o) {
    const R = rig(g, o, { yaw: .12, dx: .05, k: o.lat < .3 ? .84 : .92 });
    R.floor(-4.2, 4.2, -2.6, 3.4, 1.3, 0, .25);
    const yb = .4;
    R.bx(-3.5, 3.5, 0, yb, -.8, .8, 0, .2, M);
    const sp = [
      { x: -2.75, w: .9, h: 1.85, page: "clinic", turn: .3, t: .2 },
      { x: -1.4, w: .9, h: 1.85, page: "sound", turn: .15, t: .32 },
      { x: .55, w: 2.1, h: 1.45, page: "report", turn: -.05, t: .44 },
      { x: 2.75, w: .9, h: 1.85, page: "bakery", turn: -.25, t: .62 }];
    sp.forEach(q => {
      const S = phone(R, FW(q.x, yb, .0).turn(q.turn), q.w, q.h, q.t, .16, { tilt: .16 });
      R.pg(S, q.page, q.t + .12, .16);
      if (q.page === "report") { g.red = true; R.ln(S.f.pt(S.a0 + (S.a1 - S.a0) * .08, S.b0 + (S.b1 - S.b0) * .62, S.n), S.f.pt(S.a0 + (S.a1 - S.a0) * .3, S.b0 + (S.b1 - S.b0) * .62, S.n), .84, .08, 1.2); g.red = false; }
    });
  } },
  // 10 Wie ich arbeite: Kanban-Board mit vier Spalten, Karten wandern von links nach rechts, vor der letzten Spalte steht ein Prüfrahmen, die letzte Karte bekommt einen roten Haken
  { sel: ["#arbeitsweise .panel", 0], fn(g, o) {
    const R = rig(g, o, { yaw: -.16, dx: .05, k: .86, dy: -.1 });
    R.floor(-4.4, 4.4, -2.6, 3.4, 1.3, 0, .25);
    const fb = FW(0, 1.0, -.3).tilt(.05), bw = 3.0, bh = 3.3;
    for (const sx of [-1, 1]) { R.ln(fb.pt(sx * 2.4, .05, -.06), [sx * 2.4, 0, .6], 0, .2, M); R.ln(fb.pt(sx * 2.4, .5, -.12), [sx * 2.4, 0, -1.4], .04, .2, B); }
    R.ln([-2.4, .45, .5], [2.4, .45, .5], .14, .1, B);
    R.sl(fb, -bw, bw, 0, bh, -.12, 0, .04, .22, M);
    const ca = [-2.0, -.67, .67, 2.0], cw = .6, slot = [2.05, 1.3, .55];
    ca.forEach((a, i) => { R.rc(fb, a - cw, a + cw, .25, 2.95, .01, .24 + i * .02, .08, B * .85); R.rc(fb, a - .32, a + .32, 2.62, 2.8, .01, .3 + i * .02, .05, F); });
    const card = (R2, f, a, b, t, d, w) => {
      R2.rc(f, a - .46, a + .46, b - .29, b + .29, .014, t, d * .5, w);
      R2.rc(f, a - .36, a + .1, b + .04, b + .19, .014, t + d * .4, d * .3, w * .7);
      R2.ln(f.pt(a - .36, b - .1, .014), f.pt(a + .3, b - .1, .014), t + d * .6, d * .3, w * .7);
      R2.ln(f.pt(a - .36, b - .2, .014), f.pt(a + .12, b - .2, .014), t + d * .7, d * .3, w * .7);
    };
    // Bestand: die wandernden Karten bauen sich an ihrem Platz ab
    const flights = [[0, 2, 1, 1, .5], [1, 0, 2, 1, .6], [2, 0, 3, 1, .7]];
    [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0], [3, 0]].forEach(([c, s], k) => {
      const fl = flights.find(q => q[0] === c && q[1] === s);
      if (fl) g.er = [fl[4], .05];
      card(R, fb, ca[c], slot[s], .36 + k * .02, .08, B);
      g.er = null;
    });
    // Prüfrahmen vor der letzten Spalte
    const ga = ca[3], g0 = ga - .72, g1 = ga + .72;
    R.rc(fb, g0, g1, .12, 3.0, .75, .46, .1, M); R.rc(fb, g0 + .12, g1 - .12, .24, 2.88, .75, .5, .08, B); R.rc(fb, g0, g1, .12, 3.0, .5, .5, .08, B * .8);
    for (const [a, b] of [[g0, .12], [g1, .12], [g1, 3.0], [g0, 3.0]]) R.ln(fb.pt(a, b, .5), fb.pt(a, b, .75), .52, .06, B * .8);
    for (const a of [g0, g1]) { const p = fb.pt(a, .12, .75); R.ln(p, [p[0], 0, p[2]], .54, .08, B); }
    // Karten wandern
    const f0 = frame([0, 0, 0], fb.U, fb.V);
    flights.forEach(([c0, s0, c1, s1, t0], k) => {
      const d = .18;
      R.fly({ shape: R2 => card(R2, f0, 0, 0, 0, .01, B), from: fb.pt(ca[c0], slot[s0], .03), to: fb.pt(ca[c1], slot[s1], .03), lift: .9, rot: 0, t0, d });
      g.ns = true; card(R, fb, ca[c1], slot[s1], t0 + d, .03, B); g.ns = false;
    });
    g.red = true; g.ns = true;
    R.pl([fb.pt(ca[3] - .22, slot[1] - .02, .02), fb.pt(ca[3] - .07, slot[1] - .17, .02), fb.pt(ca[3] + .24, slot[1] + .15, .02)], .9, .08, 1.3);
    g.red = false; g.ns = false;
  } },
  // 11 Werdegang: Geräte entlang einer Zeitachse, jedes erscheint mit seiner Zeile der Zeitleiste (neueste vorn, älteste hinten)
  { sel: ["#werdegang .panel", 0], depth: 16, sync: true, fn(g, o) {
    const rt = o.rowsT || [0, .1, .2, .3, .4, .5, .6, .7], T = i => rt[i];
    const R = rig(g, o, { yaw: -.3, zc: 0, k: .95, dx: -1.0, dy: o.lat < .3 ? .9 : 0 });
    g.ns = true;
    // Zeitachse am Boden
    R.ln([0, 0, -1.8], [0, 0, -17.4], 0, .18, .7);
    for (const z of [-2.8, -4.2, -5.9, -8.1, -11.2, -15.8]) R.ln([-.3, 0, z], [.3, 0, z], .03 + .12 * (-z) / 16, .05, .5);
    const st = [
      { z: -2.8, x: -1.3, row: 0, m: 1 }, { z: -4.2, x: 1.3, row: 2, m: 1.1 }, { z: -5.9, x: -1.3, row: 4, m: 1.25 },
      { z: -8.1, x: 1.3, row: 5, m: 1.4 }, { z: -11.2, x: -1.3, row: 6, m: 1.6 }, { z: -15.8, x: 1.3, row: 7, m: 1.8 }];
    st.forEach((q, i) => {
      const m = q.m, t = T(q.row), x = q.x, z = q.z, y0 = i * .5, y = y0 + .1 * m;
      R.bx(x - 1.0 * m, x + 1.0 * m, y0, y, z - .65 * m, z + .65 * m, t, .05, B);
      for (const [lx, lz] of [[-.9, .55], [.9, .55], [-.9, -.55], [.9, -.55]]) R.ln([x + lx * m, y0, z + lz * m], [x + lx * m, 0, z + lz * m], t + .02, .05, B * .8);
      if (i === 0) {
        const S = laptop(R, FW(x - .4 * m, y, z).turn(.25), 1.5 * m, t + .02, .1); R.pg(S, "shop", t + .08, .05);
        const P = phone(R, FW(x + .75 * m, y, z + .15 * m).turn(-.1), .5 * m, 1.0 * m, t + .05, .08); R.pg(P, "phone", t + .09, .04);
      } else if (i === 1) {
        const c = monitor(R, FW(x, y, z - .1 * m), 1.1 * m, .65 * m, t + .02, .1, { lift: .3 * m }); R.pg(c, "site", t + .08, .05);
        const l = monitor(R, FW(x - 1.0 * m, y, z + .2 * m).turn(.55), .85 * m, .5 * m, t + .04, .08, { lift: .28 * m }); R.pg(l, "dash", t + .08, .05);
        const r = monitor(R, FW(x + 1.0 * m, y, z + .2 * m).turn(-.55), .85 * m, .5 * m, t + .05, .08, { lift: .28 * m }); R.pg(r, "list", t + .08, .05);
      } else if (i === 2) {
        const S = laptop(R, FW(x, y, z).turn(.15), 1.5 * m, t + .02, .1); R.pg(S, "site", t + .08, .05);
      } else if (i === 3) {
        const ft = FW(x, y, z).tilt(1.0);
        R.sl(ft, -.7 * m, .7 * m, 0, 1.0 * m, -.05, 0, t + .02, .08, M);
        for (let k = 0; k < 6; k++) R.ci(ft, (-.55 + k * .22) * m, 1.0 * m, .05 * m, .02, t + .06, .03, F, 8);
        R.ci(ft, -.15 * m, .5 * m, .22 * m, .006, t + .08, .04, B, 12); R.rc(ft, .1 * m, .5 * m, .28 * m, .62 * m, .006, t + .09, .03, F);
        R.bx(x + .55 * m, x + 1.2 * m, y, y + .06, z + .5 * m, z + .56 * m, t + .09, .03, B);
      } else if (i === 4) {
        gamepad(R, FW(x, y + .55 * m, z).tilt(1.05), t + .02, .1);
      } else {
        const S = crt(R, FW(x, y, z), 1.25 * m, .95 * m, t + .02, .1); R.pg(S, "site", t + .09, .04);
      }
    });
    g.ns = false;
  } },
  // 12 Stimme 1: zwei Laptops stehen sich an einem Tisch gegenüber, dazwischen ein gemeinsames Dokument
  { sel: ["#stimmen blockquote", 0], fn(g, o) {
    const R = rig(g, o, { yaw: .1, dx: .2, k: .9, dy: -.1 });
    R.floor(-4.2, 4.2, -2.6, 3.4, 1.3, 0, .25);
    R.desk(-2.9, 2.9, 1.2, -1.2, .9, .09, .02, .2);
    const yd = .9;
    const S1 = laptop(R, FW(-1.85, yd, 0).turn(1.2), 1.8, .2, .26), S2 = laptop(R, FW(1.85, yd, 0).turn(-1.2), 1.8, .26, .26);
    R.pg(S1, "doc", .44, .14); R.pg(S2, "doc", .5, .14);
    // das gemeinsame Dokument auf einem kleinen Fuß
    R.bx(-.5, .5, yd, yd + .06, -.3, .3, .5, .08, B);
    const fd = FW(0, yd + .06, .05).tilt(.06);
    R.sl(fd, -.85, .85, 0, 2.1, -.03, 0, .56, .16, M);
    const D = { f: fd, a0: -.7, a1: .7, b0: .15, b1: 1.95, n: .004 };
    R.pg(D, "doc", .7, .2);
    g.red = true; R.rc(fd, -.62, .62, .15 + 1.8 * .53, .15 + 1.8 * .64, .006, .9, .08, 1.2); g.red = false;
  } },
  // 13 Stimme 2: eine Reihe Ordnerrücken im Regal, die sich Jahr für Jahr füllt, ruhig
  { sel: ["#stimmen blockquote", 1], fn(g, o) {
    const R = rig(g, o, { yaw: .3, dx: -.1, dy: -.2, k: o.lat < .3 ? .8 : .9 });
    R.floor(-4.2, 4.2, -2.6, 3.4, 1.3, 0, .25);
    R.bx(-3.5, 3.5, 0, .14, -.8, .8, 0, .2, M);
    for (const [x, z] of [[-3.5, .8], [3.5, .8], [-3.5, -.8], [3.5, -.8]]) R.ln([x, .14, z], [x, 3.0, z], .06, .2, B);
    R.rc(FW(), -3.5, 3.5, 2.9, 3.0, .8, .24, .1, B); R.ln([-3.5, 3.0, -.8], [3.5, 3.0, -.8], .26, .1, B * .8);
    let x = -3.2;
    for (let k = 0; k < 9; k++) {
      const w = .44 + k * .025, h = 2.0 + (k % 3) * .1, t = .1 + k * .085, x1 = x + w;
      R.bx(x, x1, .14, .14 + h, -.7, .7, t, .08, B);
      if (k === 8) g.red = true;
      R.rc(FW(), x + .07, x1 - .07, .14 + h - .85, .14 + h - .25, .704, t + .05, .04, k === 8 ? 1 : F);
      g.red = false;
      R.ci(FW(), (x + x1) / 2, .14 + .5, .06, .704, t + .06, .03, F, 8);
      x = x1 + .09;
    }
  } },
  // 14 Für Agenturen: langer Teamtisch mit bestehenden Arbeitsplätzen, ein weiterer Platz wird im selben Raster angesetzt
  { sel: ["#agenturen .panel", 0], depth: 16, fn(g, o) {
    const R = rig(g, o, { yaw: .22, dx: o.lat < .3 ? .2 : .5, k: o.lat < .3 ? .82 : .88, dy: -.1 });
    const pt = 1.5, x0 = -3.0, yd = .95, zf = .8, zb = -.8;
    R.floor(x0, x0 + pt * 3, -2.325, 2.325, pt, 0, .26);
    const stat = (k, t, w, page) => {
      const xa = x0 + pt * k, xc = xa + pt / 2;
      const S = monitor(R, FW(xc, yd, -.25), 1.0, .62, t + .1, .16, { lift: .28, w });
      R.pg(S, page, t + .22, .1, w * .55);
      R.bx(xc - .33, xc + .33, yd, yd + .04, .15, .4, t + .2, .06, B);
    };
    R.bx(x0, x0 + pt * 3, yd - .08, yd, zb, zf, 0, .2, M);
    for (let k = 0; k <= 3; k++) { const xa = x0 + pt * k; R.ln([xa, yd - .08, zf - .1], [xa, 0, zf - .1], .06, .12, .75); R.ln([xa, yd - .08, zb + .1], [xa, 0, zb + .1], .08, .12, .6); if (k > 0 && k < 3) R.ln([xa, yd, zf], [xa, yd, zb], .1, .08, .4); }
    stat(0, .12, .6, "site"); stat(1, .2, .6, "dash"); stat(2, .28, .6, "list");
    // neuer Arbeitsplatz im selben Raster
    const xa = x0 + pt * 3, xb = xa + pt;
    R.floor(xa, xb, -2.325, 2.325, pt, 0, .52);
    R.bx(xa, xb, yd - .08, yd, zb, zf, .52, .2, M);
    R.ln([xa, yd, zf], [xa, yd, zb], .6, .08, .4);
    for (const z of [zf - .1, zb + .1]) R.ln([xb, yd - .08, z], [xb, 0, z], .62, .12, .7);
    stat(3, .62, .9, "site");
    const xc = xa + pt / 2, S = { f: FW(xc, yd, -.25), a0: -.42, a1: .42, b0: .36, b1: .84, n: .004 };
    g.red = true; R.ci(FW(xc, yd, -.25), .42, .22, .03, .006, .93, .05, 1, 10); R.ci(FW(xc, yd, -.25), .42, .22, .012, .006, .95, .04, 1, 8); g.red = false;
  } },
  // 15 Kontakt: ein Briefumschlag und ein Telefon; die rote Linie endet am Umschlag
  { sel: ["#kontakt .panel", 0], side: 0, doorX: -3.1, lineEnd: -3.6, fn(g, o) {
    const nar = o.lat < .3, R = rig(g, o, { yaw: 0, zc: -3.6, k: nar ? 1.35 : .9, dy: nar ? 1.6 : 0 });
    R.floor(-3.6, 3.6, -2.4, 3.0, 1.2, 0, .3);
    // Briefumschlag: steht auf der Kante, leicht nach hinten geneigt; seine Unterkante liegt dort, wo die rote Linie endet
    const fe = FW(0, 0, 0).tilt(.12), W = 2.5, H = 1.65;
    if (nar) { // am Handy auf einem kleinen Tisch, damit alles über dem Text steht
      R.bx(-1.5, 2.8, -.1, 0, -.7, .7, 0, .2, B);
      for (const x of [-1.4, 2.7]) for (const z of [-.6, .6]) R.ln([x, -.1, z], [x, -1.6, z], .1, .15, B * .8);
    }
    R.sl(fe, -W / 2, W / 2, 0, H, -.05, 0, .1, .3, M);
    R.pl([fe.pt(-W / 2, H, .004), fe.pt(0, H * .52, .004), fe.pt(W / 2, H, .004)], .4, .2, M);
    R.pl([fe.pt(-W / 2, 0, .004), fe.pt(-W * .17, H * .5, .004)], .55, .1, B * .8); R.pl([fe.pt(W / 2, 0, .004), fe.pt(W * .17, H * .5, .004)], .57, .1, B * .8);
    R.ln(fe.pt(0, H * .55, -.05), [0, 0, -.9], .3, .15, B * .8);
    // Telefon daneben
    const fp = FW(nar ? 1.95 : -2.7, 0, -.2).turn(nar ? -.3 : .3);
    const S = phone(R, fp, nar ? .85 : .95, nar ? 1.7 : 1.9, .5, .24, { tilt: .12 });
    R.pg(S, "call", .72, .12);
  } }
];

export function buildUnit(i, o) {
  const g = Gen(o);
  UNITS[i].fn(g, o);
  const geometry = g.finish();
  const red = geometry.userData.red;
  const movers = g.movers.map(m => ({ ...m, geo: moverGeo(o, m) }));
  const spinners = g.spinners.map(sp => {
    const gg = Gen({ ox: 0, oy: 0, oz: 0, lat: o.lat, hs: o.hs, Lb: 1, dens: 1 });
    gg.ns = true; sp.fn(gg);
    return { geo: gg.finish(), pos: sp.pos };
  });
  return { geometry, red, movers, shots: g.shots, spinners };
}
