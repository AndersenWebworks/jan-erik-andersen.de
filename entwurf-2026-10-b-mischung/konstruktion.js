// Konstruktionen für Entwurf B Mischung: echte 3D-Arbeitsgeräte und Design-Objekte im Raum, je Textabschnitt eine Konstruktion,
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

// ---------- Bauteile ----------
// Skelett aus Stützen und Decken (Geschosse wachsen nacheinander)
function skeleton(g, x0, x1, z0, z1, nx, nz, floors, fh, tb, ts, braceFace, w = 1) {
  const xs = [], zs = [];
  for (let i = 0; i <= nx; i++) xs.push(x0 + (x1 - x0) * i / nx);
  for (let j = 0; j <= nz; j++) zs.push(z0 + (z1 - z0) * j / nz);
  for (const x of xs) for (const z of zs) g.rect(0, x - .12, x + .12, z + .12, z - .12, tb, ts * .1, .45);
  for (let k = 0; k < floors; k++) {
    const tl = tb + ts * (.1 + .8 * k / floors), td = ts * .8 / floors, y0 = k * fh, y1 = (k + 1) * fh;
    for (const x of xs) for (const z of zs) g.L([x, y0, z], [x, y1, z], tl, td * .5, .9 * w, .06);
    for (const z of zs) g.L([xs[0], y1, z], [xs[nx], y1, z], tl + td * .45, td * .3, .8 * w, .12);
    for (const x of xs) g.L([x, y1, zs[0]], [x, y1, zs[nz]], tl + td * .5, td * .3, .8 * w, .12);
    if (braceFace) { g.L([xs[0], y0, zs[0]], [xs[1], y1, zs[0]], tl + td * .8, td * .3, .4 * w); g.L([xs[1], y0, zs[0]], [xs[0], y1, zs[0]], tl + td * .82, td * .3, .4 * w); }
  }
}
// Portalrahmen: zwei Stützen und Riegel
function portal(g, x0, x1, z, h, t0, d, w = .85) {
  g.L([x0, 0, z], [x0, h, z], t0, d * .45, w, .04); g.L([x1, 0, z], [x1, h, z], t0 + d * .05, d * .45, w, .04);
  g.L([x0, h, z], [x1, h, z], t0 + d * .5, d * .4, w, .05);
}
// Lastwagen mit Ladefläche, Palette und Steinstapel; Mittelpunkt (cx, cz), Fahrtrichtung -z
function truck(g, o, cx, cz, t0, d, w = .85, sc = .8, phi = 0) {
  // u: quer (nach rechts), v: Fahrtrichtung; Maße in lokalen Einheiten, Drehung phi um die Hochachse in Weltmetern
  const cp = Math.cos(phi), sp = Math.sin(phi);
  const P = (u, y, v) => { const wx = u * o.lat * sc * cp + v * sc * sp, wz = u * o.lat * sc * sp - v * sc * cp; return [cx + wx / o.lat, y * sc, cz + wz]; };
  const bx = (u0, u1, y0, y1, v0, v1, t, dd, ww) => {
    const ring = y => [[u0, y, v0], [u1, y, v0], [u1, y, v1], [u0, y, v1], [u0, y, v0]].map(q => P(...q));
    g.poly(ring(y0), t, dd * .35, ww);
    for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]) g.L(P(u, y0, v), P(u, y1, v), t + dd * .25, dd * .4, ww, .05);
    g.poly(ring(y1), t + dd * .6, dd * .4, ww);
  };
  bx(-1.4, 1.4, .42, .58, -1.2, 1.4, t0, d * .5, w);
  for (const sx of [-1, 1]) for (const vv of [-.55, .7]) {
    const c = P(sx * 1.4, .27, vv), pts = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI * 2 * i / 12, r = .27 * sc; const f = [sp, -cp]; pts.push([c[0] + Math.cos(a) * r * f[0] / o.lat, c[1] + Math.sin(a) * r / o.hs / sc * sc, c[2] + Math.cos(a) * r * f[1]]); }
    g.poly(pts, t0 + d * .2, d * .3, w * .8);
  }
  bx(-1.25, 1.25, .42, 1.5, 1.4, 2.3, t0 + d * .1, d * .4, w * .9); // Fahrerhaus
  bx(-.85, .85, .58, .72, -.75, .75, t0 + d * .5, d * .2, w); // Palette
  for (let k = 0; k < 3; k++) bx(-.8, .8, .72 + k * .3, 1.0 + k * .3, -.7, .7, t0 + d * (.6 + .12 * k), d * .15, w * .85); // Steine
}
// Dach mit zwei Flächen, leicht, für kleine Häuser
const GOLD = 1.618;

// ---------- Einheiten ----------
// sel: Textelement, an dem Zeit und Kamera hängen; side: 0 mittig/feste Lage; depth: Tiefe der Szene
// Zusätzliche Eingaben in o: word (Grundlinie der Überschrift), rl(z) (x der roten Linie), mod (Seitenverhältnis der Überschrift), rows (Eintrittszeit der Zeitleistenzeilen)
export const UNITS = [
  // 0 Einstieg: entwickeln (Haus auf dem Sockel der Überschrift), anbinden (Stege zu zwei Nachbarbauten), betreuen (rotes Element)
  { sel: ["#start .panel", 0], side: 0, nlat: .2, depth: 16, fn(g, o) {
    const d = o.dens, s = .75 * d, nar = o.lat < .3;
    const w = o.word || { xl: -6.5, xr: 3.4, y: 1.6, z: -2.2 };
    const yb = w.y, zf = w.z;
    const hw = nar ? 3.2 : 2.1, hx = nar ? (w.xl + w.xr) / 2 : w.xr + hw + 1.3;
    const hz0 = zf - 2.6, hz1 = hz0 - (nar ? 2.2 : 3.4);
    g.grid(-9.75, 9.75, 1.5, -o.Lb, s, s, 0, 0, .34, .2, .5, 4 / d);
    // Sockel: die Grundlinie der Schrift wird zur Vorderkante einer Plattform
    const px0 = w.xl - .3, px1 = hx + hw + 1.2, pz1 = hz1 - (nar ? .4 : .8);
    g.L([px0, yb, zf], [px1, yb, zf], 0, .16, .95);
    for (const x of [px0, px1]) { g.L([x, yb, zf], [x, 0, zf], .08, .1, .8); g.L([x, yb, zf], [x, yb, pz1], .1, .12, .7); g.L([x, 0, zf], [x, 0, pz1], .12, .1, .6); }
    g.L([px0, 0, zf], [px1, 0, zf], .1, .12, .6); g.L([px0, yb, pz1], [px1, yb, pz1], .16, .12, .6);
    for (let x = px0 + (px1 - px0) / 4; x < px1 - .1; x += (px1 - px0) / 4) g.L([x, yb, zf], [x, 0, zf], .14, .08, .35);
    // Haus auf dem Sockel
    g.tf = p => [p[0], p[1] + yb, p[2]];
    g.house(hx - hw, hx + hw, hz0, hz1, 2.8, 1.5, .12, .36, .9, { win: true });
    g.tf = null;
    // zwei Nachbarbauten auf dem Boden, durch Stege angebunden
    const n1x = hx + hw + (nar ? 2.8 : 3.4), n1z0 = hz0 - 3.2, n1z1 = n1z0 - 2.6;
    const n2x = nar ? w.xl - 2 : hx - 1.8, n2z0 = hz1 - 4.4, n2z1 = n2z0 - 2.4;
    g.steg([hx + hw, yb + 1.1, (hz0 + hz1) / 2], [n1x - 1.2, 1.1, (n1z0 + n1z1) / 2], .9, .5, .14, .8);
    g.house(n1x - 1.2, n1x + 1.2, n1z0, n1z1, 1.6, .9, .58, .2, .8, { door: true });
    g.steg([hx - hw * .4, yb + 1.1, hz1], [n2x, 1.1, n2z0], .9, .64, .14, .8);
    g.house(n2x - 1.2, n2x + 1.2, n2z0, n2z1, 1.4, .8, .74, .2, .8, { win: true });
    // zuletzt: ein einziges rotes Element, die Tür des betreuten Hauses
    g.tf = p => [p[0], p[1] + yb, p[2]];
    g.red = true; g.poly([[hx - .55, 0, hz0], [hx - .55, 1.8, hz0], [hx + .55, 1.8, hz0], [hx + .55, 0, hz0]], .9, .1, 1); g.red = false;
    g.tf = null;
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
  // 2 Betreuung und Absicherung: Haus hinter einem Zaun aus Pfosten, ein Pfosten fehlt und wird eingesetzt, ein Kontrollgang
  { sel: ["#leistungen article", 0], fn(g, o) {
    const d = o.dens;
    g.grid(-5, 5, -1.2, -11.6, 1.3 * d, 1.3 * d, 0, 0, .3, .13, .3, 4 / d);
    g.house(-1.8, 1.8, -5.4, -9, 3.0, 1.6, 0, .34, .8, { door: true, win: true });
    const X0 = -3.2, X1 = 3.2, Z0 = -3.8, Z1 = -10.4, nx = 6, nz = 6, H = 1.3, gap = 2;
    const P = [];
    for (let i = 0; i < nx; i++) P.push([X0 + (X1 - X0) * i / nx, Z0]);
    for (let j = 0; j < nz; j++) P.push([X1, Z0 + (Z1 - Z0) * j / nz]);
    for (let i = 0; i < nx; i++) P.push([X1 - (X1 - X0) * i / nx, Z1]);
    for (let j = 0; j < nz; j++) P.push([X0, Z1 - (Z1 - Z0) * j / nz]);
    P.forEach(([x, z], k) => {
      if (k === gap) return;
      const t = .06 + .34 * k / P.length;
      g.L([x, 0, z], [x, H, z], t, .08, .85, .04);
    });
    const loop = [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1], [X0, Z0]];
    const stepx = (X1 - X0) / nx;
    for (const y of [H, H * .55]) for (let e = 0; e < 4; e++) {
      const [a, b] = [loop[e], loop[e + 1]];
      const t = .12 + .3 * e / 4;
      if (e === 0) { // Vorderseite: Lücke bei Pfosten 2
        const xg0 = X0 + stepx * (gap - 1), xg1 = X0 + stepx * (gap + 1);
        g.L([X0, y, Z0], [xg0, y, Z0], t, .08, .55); g.L([xg1, y, Z0], [X1, y, Z0], t + .04, .12, .55);
      } else g.L([a[0], y, a[1]], [b[0], y, b[1]], t, .14, .55);
    }
    // Lücke wird geschlossen: roter Pfosten, dazu die Riegel
    const gx = X0 + stepx * gap;
    for (const y of [H, H * .55]) { g.L([gx - stepx, y, Z0], [gx + stepx, y, Z0], .5, .08, .6); }
    g.red = true; g.L([gx, 0, Z0], [gx, H, Z0], .54, .1, 1, .05); g.red = false;
    // Kontrollgang: eine einzelne Linie streicht einmal um das Haus
    const R = [[-2.7, -4.6], [2.7, -4.6], [2.7, -9.8], [-2.7, -9.8], [-2.7, -4.6]];
    const per = []; let tot = 0;
    for (let e = 0; e < 4; e++) { const l = Math.hypot(R[e + 1][0] - R[e][0], R[e + 1][1] - R[e][1]); per.push(l); tot += l; }
    for (let e = 0; e < 4; e++) g.L([R[e][0], 1.6, R[e][1]], [R[e + 1][0], 1.6, R[e + 1][1]], .66 + .06 * e, .1, .4);
    const N = 28;
    const at = u => { let c = u * tot, e = 0; while (e < 3 && c > per[e]) { c -= per[e]; e++; } const f = c / per[e]; return [R[e][0] + (R[e + 1][0] - R[e][0]) * f, 1.6, R[e][1] + (R[e + 1][1] - R[e][1]) * f]; };
    for (let i = 0; i < N; i++) {
      const t = .66 + .3 * i / N, a = at(i / N), b = at((i + 1) / N);
      g.ns = true; g.er = [t + .05, .05]; g.L(a, b, t, .035, 1.2); g.er = null; g.ns = false;
    }
  } },
  // 3 Modernisierung: die Fassade bleibt, dahinter wird das schiefe alte Tragwerk durch ein klares neues ersetzt
  { sel: ["#leistungen article", 1], fn(g, o) {
    const d = o.dens;
    g.grid(-5, 5, -1.2, -13.6, 1.3 * d, 1.3 * d, 0, 0, .28, .12, .28, 4 / d);
    // Fassade (bleibt unverändert, gleiche Position)
    const FX0 = -3.4, FX1 = 3.4, FZ = -4.4, FH = 3.9;
    g.box(FX0, FX1, 0, FH, FZ, FZ - .3, 0, .3, .9);
    g.L([FX0 - .25, 3.6, FZ + .12], [FX1 + .25, 3.6, FZ + .12], .12, .12, .85);
    for (const cx of [-2.3, 0, 2.3]) {
      g.rectXY(FZ + .02, cx - .6, cx + .6, 2.3, 3.3, .18, .1, .8);
      if (cx === 0) g.poly([[-.55, 0, FZ + .02], [-.55, 1.9, FZ + .02], [.55, 1.9, FZ + .02], [.55, 0, FZ + .02]], .2, .1, .8);
      else g.rectXY(FZ + .02, cx - .6, cx + .6, .7, 1.7, .2, .1, .8);
    }
    // altes Tragwerk: schief, blass, baut sich ab
    const xs = [-3, -1, 1, 3], zs = [-7.2, -9.4], lean = [.35, .6, .5, .85], hts = [3.3, 2.9, 3.4, 2.7];
    const top = (i, j) => [xs[i] + lean[i] + j * .15, hts[i] - j * .2, zs[j] + j * .1];
    g.er = [.46, .22];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const t = top(i, j); g.L([xs[i], 0, zs[j]], t, .3 + i * .02, .1, .5);
      if (i < 3) g.L(t, top(i + 1, j), .36 + i * .02, .1, .45);
    }
    for (let i = 0; i < 4; i++) g.L(top(i, 0), top(i, 1), .42, .08, .4);
    g.L([xs[0], 1.1, zs[0]], top(1, 0), .4, .1, .4); g.L([xs[2], 0, zs[0]], [xs[3] + .45, 2.1, zs[0]], .42, .1, .35);
    g.er = null;
    // neues, klares Tragwerk wächst nach
    g.ns = true; skeleton(g, -3, 3, -7.2, -9.4, 3, 1, 2, 1.8, .5, .42, false, .75); g.ns = false;
  } },
  // 4 Shops und Shop-Wechsel: Standardregal links, Bau nach Maß rechts; Teile wandern auf Bögen, das sperrige zuletzt
  { sel: ["#leistungen article", 2], fn(g, o) {
    const d = o.dens, zF = -5.4, kz = zF - K;
    g.grid(-5, 5, -.5, -11.5, 1.5 * d, 1.5 * d, 0, 0, .28, .12, .28, 4 / d);
    // Standardregal: gleiche Fächer
    g.box(-4, -1, 0, 2.3, zF, kz, 0, .26, .85);
    for (const x of [-3, -2]) g.L([x, 0, zF], [x, 2.3, zF], .12, .1, .6);
    g.L([-4, 1.15, zF], [-1, 1.15, zF], .14, .1, .6);
    // Bau nach Maß: Fächer in Passform, rechts ein hohes Sonderfach
    g.box(.4, 3.4, 0, 2.3, zF, kz, .1, .26, .85);
    for (const x of [1.4, 2.4]) g.L([x, 0, zF], [x, 2.3, zF], .24, .1, .6);
    g.L([.4, 1.15, zF], [3.4, 1.15, zF], .26, .1, .6);
    const slot = [[3.6, 0], [4.9, 0], [4.9, .8], [4.3, .8], [4.3, 2.6], [3.6, 2.6]];
    g.prism(slot, zF, kz, .2, .26, .9);
    // 6 Standardteile
    let i = 0;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++, i++) {
      const tl = .3 + i * .07, dd = .2;
      const fx = -3.5 + c, fy = .575 + r * 1.15, fz = zF - K / 2;
      const tx = .9 + c, tz = fz;
      g.er = [tl, .05]; g.box(fx - .45, fx + .45, fy - .45, fy + .45, fz + K / 2 - .02, fz - K / 2 + .02, .18 + i * .015, .1, .7); g.er = null;
      const pts = []; for (let k = 0; k <= 14; k++) { const u = k / 14, e = u * u * (3 - 2 * u); pts.push([fx + (tx - fx) * e, fy + (fy - fy) * e + 2.4 * Math.sin(Math.PI * u), fz]); }
      g.ns = true; g.poly(pts, tl, dd, .3);
      g.box(tx - .45, tx + .45, fy - .45, fy + .45, tz + K / 2 - .02, tz - K / 2 + .02, tl + dd, .07, .8); g.ns = false;
      g.mover({ size: [.9, .9, K - .04], from: [fx, fy, fz], to: [tx, fy, tz], lift: 2.4, t0: tl, d: dd });
    }
    // das sperrige Teil: hoch, mit Fuß, passt in kein Standardfach; steht neben dem Regal, passt rechts genau
    const odd = [[-.6, -1.25], [.6, -1.25], [.6, -.55], [0, -.55], [0, 1.25], [-.6, 1.25]];
    const oz = zF - K / 2, tl = .68, dd = .24, fxo = -.3, txo = 4.25;
    g.er = [tl, .05]; g.prism(odd.map(p => [fxo + p[0], 1.25 + p[1]]), oz + K / 2 - .02, oz - K / 2 + .02, .2, .12, .85); g.er = null;
    const pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16, e = u * u * (3 - 2 * u); pts.push([fxo + (txo - fxo) * e, 1.25 + 3.0 * Math.sin(Math.PI * u), oz]); }
    g.ns = true; g.poly(pts, tl, dd, .3);
    g.prism(odd.map(p => [txo + p[0], 1.25 + p[1]]), oz + K / 2 - .02, oz - K / 2 + .02, tl + dd, .08, .95); g.ns = false;
    g.mover({ shape: gg => gg.prism(odd, K / 2 - .02, -K / 2 + .02, 0, .01, .9), from: [fxo, 1.25, oz], to: [txo, 1.25, oz], lift: 3.0, rot: .25, t0: tl, d: dd });
  } },
  // 5 Schnittstellen: drei Bauten, Leitungen mit Flanschen, Segmente laufen; zwischen zwei Bauten ein eigenes Formstück
  { sel: ["#leistungen article", 3], fn(g, o) {
    const d = o.dens, rm = .24;
    g.grid(-5.6, 5.6, -.5, -14, 1.5 * d, 1.5 * d, 0, 0, .28, .12, .28, 4 / d);
    g.box(-4.2, -1.8, 0, 2.6, -4.2, -6.8, 0, .24, .85);
    g.box(1.8, 4.4, 0, 3.4, -5.4, -8.2, .08, .26, .85);
    g.box(1.8, 4.4, 0, 2.4, -11.2, -13.8, .24, .24, .85);
    // A -> B: Standardstutzen treffen mit Versatz aufeinander, dazwischen ein Spalt
    g.pipe([-1.8, 1.2, -5.4], [-1.0, 1.2, -5.4], rm, .3, .1, .8); g.flange("x", [-1.0, 1.2, -5.4], rm * 1.5, .36, .08, .85);
    g.pipe([1.8, 1.9, -6.3], [1.0, 1.9, -6.3], rm, .34, .1, .8); g.flange("x", [1.0, 1.9, -6.3], rm * 1.5, .4, .08, .85);
    g.flange("x", [-1.8, 1.2, -5.4], rm * 1.5, .28, .08, .85); g.flange("x", [1.8, 1.9, -6.3], rm * 1.5, .32, .08, .85);
    // eigenes Formstück überbrückt den Versatz (rot)
    g.red = true;
    const fp = [[-1.0, 1.2, -5.4], [-.5, 1.2, -5.4], [.5, 1.9, -6.3], [1.0, 1.9, -6.3]];
    for (const s of [-1, 1]) g.poly(fp.map(p => [p[0], p[1] + s * rm / o.hs, p[2]]), .7, .16, 1.1);
    g.flange("x", fp[0], rm * 1.5, .66, .06, 1.1); g.flange("x", fp[3], rm * 1.5, .78, .06, 1.1);
    g.red = false;
    // B -> C: Standardleitung, passt
    g.pipe([3.1, 1.7, -8.2], [3.1, 1.7, -11.2], rm, .5, .14, .8);
    g.flange("z", [3.1, 1.7, -8.2], rm * 1.5, .46, .08, .85); g.flange("z", [3.1, 1.7, -9.7], rm * 1.5, .54, .08, .85); g.flange("z", [3.1, 1.7, -11.2], rm * 1.5, .6, .08, .85);
    // laufende Segmente
    const run = (a, b, t, n) => { for (let i = 0; i < n; i++) { const tt = t + i * .08; g.ns = true; g.er = [tt + .07, .05]; g.L(a, b, tt, .06, 1.2); g.er = null; g.ns = false; } };
    run([-1.7, 1.2, -5.4], [-1.2, 1.2, -5.4], .82, 2); run([-.2, 1.5, -5.85], [.2, 1.6, -6.1], .86, 1); run([3.1, 1.7, -8.4], [3.1, 1.7, -9.3], .84, 3);
  } },
  // 6 Gestaltung: flacher Plan am Boden, der Bau wächst exakt über den Planlinien; Proportionsteilung aus der Überschrift
  { sel: ["#leistungen article", 4], fn(g, o) {
    const mod = clamp(o.mod || 3.3, 2.4, 4.6), cols = 2, rows = 3, W = 6.4, X0 = -3.2;
    const cwid = W / cols, ch = cwid / mod, H = ch * rows, zA = -3.3, zP = zA - H, zE = zP - 3.2;
    // Planblatt
    g.rect(0, -3.9, 3.9, zA + .5, zE - .4, 0, .12, .45);
    // Ansicht, flach gelegt: Fußlinie liegt an der Grundrisskante, die Oberkante zeigt zur Kamera
    const ez = y => zP + y;
    g.rect(0, X0, X0 + W, ez(0), ez(H), .06, .14, .9);
    for (let c = 1; c < cols; c++) g.L([X0 + cwid * c, 0, ez(0)], [X0 + cwid * c, 0, ez(H)], .14, .1, .6);
    for (let r = 1; r < rows; r++) g.L([X0, 0, ez(ch * r)], [X0 + W, 0, ez(ch * r)], .16 + r * .02, .1, .6);
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) g.rect(0, X0 + cwid * c + .45, X0 + cwid * (c + 1) - .45, ez(ch * r + ch * .22), ez(ch * (r + 1) - ch * .22), .22 + r * .03, .1, .6);
    // Grundriss
    g.rect(0, X0, X0 + W, zP, zE, .28, .16, 1.2);
    g.L([0, 0, zP], [0, 0, zP - 1.9], .36, .08, .6); g.L([X0, 0, zP - 1.9], [X0 + 2.4, 0, zP - 1.9], .38, .08, .6); g.L([X0 + 4, 0, zP - 1.9], [X0 + W, 0, zP - 1.9], .4, .08, .6);
    // der Bau steht exakt über dem Grundriss; die Fassade trägt die Teilung des Plans
    g.box(X0, X0 + W, 0, H, zP, zE, .46, .34, .95);
    for (let c = 1; c < cols; c++) g.L([X0 + cwid * c, 0, zP], [X0 + cwid * c, H, zP], .7, .1, .7);
    for (let r = 1; r < rows; r++) g.L([X0, ch * r, zP], [X0 + W, ch * r, zP], .72 + r * .03, .1, .7);
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) g.rectXY(zP, X0 + cwid * c + .45, X0 + cwid * (c + 1) - .45, ch * r + ch * .22, ch * (r + 1) - ch * .22, .78 + r * .03, .1, .75);
  } },
  // 7 WBG Pooling: Monitor mit Produktportal, davor ein Produkt auf rotierendem Drehteller, daneben ein Login-Fenster mit Schloss, zwei Kabel zu zwei kleinen Geräten am Rand
  { sel: ["#weitere .panel", 0], fn(g, o) {
    const R = rig(g, o, { yaw: .16, dx: .15, k: .82 });
    R.floor(-4.8, 5.0, -2.6, 3.4, 1.3, 0, .25);
    R.desk(-4.2, 4.3, 1.2, -1.0, .95, .09, .02, .2);
    const yd = .95;
    const sm = monitor(R, FW(-1.3, yd, -.35).turn(.0), 2.5, 1.5, .2, .26);
    R.pg(sm, "product", .44, .14);
    // Drehteller
    const fl = FW(.75, yd, .75).lay(), cx = 0;
    R.ci(fl, 0, 0, 1.0, 0, .48, .1, M, 28); R.ci(fl, 0, 0, 1.0, .14, .52, .1, B, 28); R.ci(fl, 0, 0, .18, .14, .58, .06, F, 10);
    R.ln([.75 - 1.0, yd, .75], [.75 - 1.0, yd + .14, .75], .54, .05, B); R.ln([.75 + 1.0, yd, .75], [.75 + 1.0, yd + .14, .75], .54, .05, B);
    R.spin(R2 => {
      R2.bx(-.45, .45, 0, .42, -.3, .3, .6, .12, M);
      R2.bx(-.45, .05, .42, .92, -.3, .3, .68, .12, M);
      R2.ci(FW(), .2, .21, .11, .3, .76, .06, B, 10); R2.ci(FW(), -.2, .67, .1, .3, .8, .06, B, 10);
    }, [.75, yd + .14, .75]);
    // Login-Fenster mit Schloss
    const fw = FW(3.4, yd, .0).turn(-.25);
    const sw = phone(R, fw, 1.55, 1.95, .5, .22, { tilt: .12 });
    const wa = sw.a1 - sw.a0, hb = sw.b1 - sw.b0, A = x => sw.a0 + wa * x, Bb = y => sw.b0 + hb * y;
    R.rc(sw.f, A(.38), A(.62), Bb(.74), Bb(.86), sw.n, .66, .06, B); R.arc(sw.f, A(.5), Bb(.86), wa * .09, 0, Math.PI, sw.n, .68, .05, B, 8);
    R.rc(sw.f, A(.2), A(.8), Bb(.52), Bb(.62), sw.n, .7, .05, F); R.rc(sw.f, A(.2), A(.8), Bb(.38), Bb(.48), sw.n, .72, .05, F);
    g.red = true; R.rc(sw.f, A(.2), A(.8), Bb(.18), Bb(.3), sw.n, .84, .08, 1); g.red = false;
    // zwei Kabel zu zwei kleinen Geräten am Rand
    R.bx(-3.9, -3.1, yd, yd + .5, -.8, -.2, .56, .1, B); R.bx(-3.9, -3.1, yd, yd + .5, .2, .8, .62, .1, B);
    for (const [zz, t] of [[-.5, .74], [.5, .8]]) R.rc(FW(), -3.75, -3.25, yd + .1, yd + .38, zz + .3, t - .1, .06, F);
    R.cable([-2.5, yd + .04, -.5], [-3.1, yd + .25, -.5], .2, .74, .14, .55);
    R.cable([-2.5, yd + .04, -.3], [-3.1, yd + .25, .5], .3, .8, .14, .55, 2);
  } },
  // 8 Take the Gloves Off: Boxring, Podest, vier Eckpfosten, drei Seilreihen
  { sel: ["#weitere .panel", 1], fn(g, o) {
    const d = o.dens, rx = 3, rz0 = -4.6, rz1 = -9.4, yp = .4, hp = 2.2;
    g.grid(-5, 5, -.5, -12.6, 1.5 * d, 1.5 * d, 0, 0, .26, .11, .26, 4 / d);
    g.box(-rx - .4, rx + .4, 0, yp, rz0 + .4, rz1 - .4, 0, .24, .85);
    g.rect(yp, -rx, rx, rz0, rz1, .2, .12, .55);
    g.stairs(-.8, .8, 0, rz0 + .4 + .9, -1, 2, yp / 2, .45, .1, .14, .7);
    const corners = [[-rx, rz0], [rx, rz0], [rx, rz1], [-rx, rz1]];
    corners.forEach(([x, z], i) => { g.L([x, yp, z], [x, yp + hp, z], .3 + i * .02, .16, .95, .03); g.L([x, yp + hp, z], [x, yp + hp + .0, z], .5, .02, .5); });
    const ys = [.75, 1.3, 1.85];
    ys.forEach((y, k) => corners.forEach(([x, z], i) => { const [x2, z2] = corners[(i + 1) % 4]; g.L([x, yp + y, z], [x2, yp + y, z2], .5 + k * .08 + i * .015, .14, .8, 0); }));
    // Abstandshalter in den Seilreihen
    for (const [x, z, x2, z2] of [[-rx, rz0, rx, rz0], [rx, rz0, rx, rz1], [rx, rz1, -rx, rz1], [-rx, rz1, -rx, rz0]]) { const mx = (x + x2) / 2, mz = (z + z2) / 2; g.L([mx, yp + ys[0], mz], [mx, yp + ys[2], mz], .84, .08, .5); }
    // Eckpolster
    corners.forEach(([x, z], i) => g.L([x, yp + ys[0] - .05, z], [x, yp + ys[2] + .05, z], .72 + i * .02, .08, 1.0, 0));
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
  // 10 Wie ich arbeite: ein Turmdrehkran setzt Bauteile; jedes Teil passiert zuerst einen Prüfrahmen; daneben wächst der Bau Geschoss für Geschoss
  { sel: ["#arbeitsweise .panel", 0], fn(g, o) {
    const d = o.dens, zP = -6.5, mw = 2.0, mh = 1.0, md = 1.6;
    g.grid(-5, 5, -.5, -12.6, 1.5 * d, 1.5 * d, 0, 0, .26, .11, .26, 4 / d);
    // Kran: Mast, Kabine, Ausleger mit Gegengewicht
    const mx = .8, mz = -9.4, mH = 6.2, jy = 6.9;
    for (const [dx, dz] of [[-.25, -.25], [.25, -.25], [.25, .25], [-.25, .25]]) g.L([mx + dx, 0, mz + dz], [mx + dx, mH, mz + dz], .02, .26, .85, .02);
    for (let y = 1.1, k = 0; y <= mH + .01; y += 1.1, k++) { g.rect(y, mx - .25, mx + .25, mz + .25, mz - .25, .08 + y * .02, .06, .4); const up = k % 2 === 0; g.L([mx - .25, up ? y - 1.1 : y, mz + .25], [mx + .25, up ? y : y - 1.1, mz + .25], .1 + y * .02, .05, .5); }
    g.box(mx - .6, mx + .5, mH, mH + .7, mz + .6, mz - .3, .3, .1, .85); // Kabine
    g.L([-4.3, jy, mz], [3.4, jy, mz], .34, .14, .9); g.L([-4.3, jy + .55, mz], [mx, jy + 1.3, mz], .36, .14, .8); g.L([3.4, jy + .55, mz], [mx, jy + 1.3, mz], .38, .1, .8);
    g.L([mx, jy + 1.3, mz], [mx, jy + 1.9, mz], .42, .05, .8);
    for (let x = -4.3; x < 3.4; x += 1.1) g.L([x, jy, mz], [x + .55, jy + .55, mz], .4 + (x + 4.3) * .01, .05, .5);
    g.L([-4.3, jy, mz], [-4.3, jy + .55, mz], .36, .04, .7);
    g.box(2.7, 3.4, jy - .4, jy + .4, mz + .25, mz - .25, .4, .06, .8); // Gegengewicht
    // Prüfrahmen
    portal(g, -1.4, 1.2, zP, 4.4, .3, .14, .9);
    g.rectXY(zP, -1.1, .9, 1.6, 4.1, .38, .1, .5);
    // Stapel links: drei Bauteile; rechts wächst der Turm Geschoss für Geschoss
    const px = -3.0, tx = 3.0;
    for (let k = 0; k < 3; k++) {
      const tl = .48 + (2 - k) * .12 - 0 + 0, dd = .14, y0 = k * mh, ty = (2 - k) * mh;
      // Teil k des Stapels (k = 2 oben) wird als erstes gesetzt
      const order = 2 - k;
      const t0 = .48 + order * .12;
      g.er = [t0, .05]; g.box(px - mw / 2, px + mw / 2, y0, y0 + mh, zP + md / 2, zP - md / 2, .08 + k * .03, .12, .8); g.er = null;
      // wandert: vom Stapelplatz k zum Turmplatz = order
      const fy = y0 + mh / 2, ty2 = order * mh + mh / 2;
      const pts = []; for (let q = 0; q <= 14; q++) { const u = q / 14, e = u * u * (3 - 2 * u); pts.push([px + (tx - px) * e, fy + (ty2 - fy) * e + 1.1 * Math.sin(Math.PI * u), zP]); }
      g.ns = true;
      g.box(tx - mw / 2, tx + mw / 2, order * mh, order * mh + mh, zP + md / 2, zP - md / 2, t0 + dd, .08, .9);
      g.rectXY(zP + md / 2, tx - .5, tx + .5, order * mh + .3, order * mh + .75, t0 + dd + .04, .06, .6);
      g.ns = false;
      g.mover({ shape: gg => { gg.box(-mw / 2, mw / 2, -mh / 2, mh / 2, -md / 2, md / 2, 0, .01, .9); const ay = mh / 2 + 1.0; for (const sx of [-1, 1]) for (const sz of [-1, 1]) gg.L([sx * mw / 2 * .9, mh / 2, sz * md / 2 * .9], [0, ay, 0], 0, .01, .6); gg.ring("xy", [0, ay + .22, 0], .13, 8, 0, .01, .8); }, from: [px, fy, zP], to: [tx, ty2, zP], lift: 1.1, rot: 0, t0, d: dd });
    }
  } },
  // 11 Werdegang: Steg mit Stationen von einfach zu komplex; jede Station erscheint, wenn ihre Zeile ins Bild scrollt (Liste: neueste oben)
  { sel: ["#werdegang .panel", 0], depth: 16, sync: true, fn(g, o) {
    const d = o.dens, xs = z => .6 + (-z) * .2, wd = .8;
    const rt = o.rowsT || [0, .1, .2, .3, .4, .5, .6, .7];
    g.ns = true;
    // Steg entlang der Grundlinie, wächst von vorn nach hinten
    g.L([xs(-2.6) - wd, 0, -2.6], [xs(-16) - wd, 0, -16], 0, .16, .8, .1); g.L([xs(-2.6) + wd, 0, -2.6], [xs(-16) + wd, 0, -16], .02, .16, .8, .1);
    for (let z = -2.8; z > -16; z -= .9 * d) g.L([xs(z) - wd, 0, z], [xs(z) + wd, 0, z], .02 + .1 * (-z) / 16, .05, .35);
    const T = i => rt[i];
    // Station 1 (Zeile 1, neueste, vorn): Hochhausgerüst
    skeleton(g, -1.4, .4, -3.4, -5.4, 1, 1, 5, 1.1, T(0), .2, true);
    // Station 2 (Zeile 3): Werkhalle mit Sheds
    { const x0 = 3.2, x1 = 6.2, z0 = -7, z1 = -9.8, h = 1.5, t = T(2);
      g.box(x0, x1, 0, h, z0, z1, t, .12, .85);
      for (let i = 0; i < 3; i++) { const xa = x0 + i * (x1 - x0) / 3, sw = (x1 - x0) / 3; for (const z of [z0, z1]) { g.L([xa, h, z], [xa, h + .6, z], t + .08, .05, .8); g.L([xa, h + .6, z], [xa + sw, h, z], t + .1, .05, .8); } g.L([xa, h + .6, z0], [xa, h + .6, z1], t + .1, .05, .7); } }
    // Station 3 (Zeile 5): Haus
    g.house(-.2, 2.0, -10.4, -12.8, 1.6, .9, T(4), .12, .85, { door: true });
    // Station 4 (Zeile 7): Hütte mit Pultdach
    { const x0 = 4.2, x1 = 5.8, z0 = -13, z1 = -14.6, t = T(6);
      g.box(x0, x1, 0, 1.0, z0, z1, t, .1, .85); g.L([x0, 1.0, z0], [x0, 1.5, z0], t + .08, .04, .8); g.L([x1, 1.0, z0], [x1, 1.5, z0], t + .08, .04, .8); g.L([x0, 1.5, z0], [x1, 1.5, z0], t + .1, .04, .8);
      g.L([x0, 1.5, z0], [x0, 1.0, z1], t + .1, .04, .8); g.L([x1, 1.5, z0], [x1, 1.0, z1], t + .1, .04, .8); }
    // Station 5 (Zeile 8, älteste, hinten): ein einzelner Pfosten
    g.L([2.6, 0, -15.8], [2.6, 1.6, -15.8], T(7), .08, .95, .04); g.rect(0, 2.4, 2.8, -15.6, -16, T(7) - .02, .04, .5);
    g.ns = false;
  } },
  // 12 Stimme 1: zwei Bogenhälften wachsen von beiden Seiten und treffen sich im Schlussstein (rot)
  { sel: ["#stimmen blockquote", 0], fn(g, o) {
    const d = o.dens, R = 2.6, th = .55, ys = 1.2, cx = .4, rmI = R * o.lat, rmO = (R + th) * o.lat, zA = -4.8, zB = -7.4;
    g.grid(-4.4, 5.2, -1, -12, 1.5 * d, 1.5 * d, 0, 0, .24, .1, .24, 4 / d);
    for (const z of [zA, zB]) {
      for (const s of [-1, 1]) {
        const half = (rm, a0, a1, t0, dr) => g.arcW("xy", [cx, ys, z], rm, a0, a1, 14, t0, dr, .9);
        // Pfeiler
        g.L([cx + s * R, 0, z], [cx + s * R, ys, z], .05, .12, .9, .03); g.L([cx + s * (R + th), 0, z], [cx + s * (R + th), ys, z], .06, .12, .9, .03);
        const a0 = s < 0 ? Math.PI : 0, a1 = Math.PI / 2 + s * .12;
        half(rmI, a0, a1, .22, .38); half(rmO, a0, a1, .22, .38);
        // Fugen
        for (let k = 0; k <= 5; k++) { const a = a0 + (a1 - a0) * k / 5, ca = Math.cos(a), sa = Math.sin(a); g.L([cx + ca * R, ys + sa * rmI / o.hs, z], [cx + ca * (R + th), ys + sa * rmO / o.hs, z], .24 + .34 * k / 5, .05, .6); }
      }
    }
    // Längsrippen als Tonnengewölbe
    for (const [x, y] of [[cx - R, ys], [cx + R, ys], [cx - R - th, ys], [cx + R + th, ys]]) g.L([x, y, zA], [x, y, zB], .5, .14, .6);
    g.L([cx - R - th, 0, zA], [cx - R - th, 0, zB], .5, .12, .6); g.L([cx + R + th, 0, zA], [cx + R + th, 0, zB], .5, .12, .6);
    g.L([cx, ys + R * o.lat / o.hs, zA], [cx, ys + R * o.lat / o.hs, zB], .56, .14, .7); g.L([cx, ys + (R + th) * o.lat / o.hs, zA], [cx, ys + (R + th) * o.lat / o.hs, zB], .58, .14, .7);
    // Schlussstein
    const ya = ys + R * o.lat / o.hs, yb = ys + (R + th) * o.lat / o.hs + .08, kw = .32;
    g.red = true;
    g.poly([[cx - kw * .7, ya, zA], [cx + kw * .7, ya, zA], [cx + kw, yb, zA], [cx - kw, yb, zA], [cx - kw * .7, ya, zA]], .84, .1, 1);
    g.poly([[cx - kw * .7, ya, zB], [cx + kw * .7, ya, zB], [cx + kw, yb, zB], [cx - kw, yb, zB], [cx - kw * .7, ya, zB]], .86, .1, 1);
    for (const [x, y] of [[cx - kw * .7, ya], [cx + kw * .7, ya], [cx + kw, yb], [cx - kw, yb]]) g.L([x, y, zA], [x, y, zB], .9, .08, 1);
    g.red = false;
  } },
  // 13 Stimme 2: Arkade setzt sich Bogen für Bogen in die Tiefe fort, gleichmäßig
  { sel: ["#stimmen blockquote", 1], fn(g, o) {
    const d = o.dens, n = d > 1 ? 5 : 6, R = 1.7, ys = 1.1, x = .2, rm = R * o.lat, step = 2.2, z0 = -3.6;
    g.grid(-4, 4, -1, -14, 1.5 * d, 1.5 * d, 0, 0, .24, .1, .24, 4 / d);
    for (let k = 0; k < n; k++) {
      const z = z0 - k * step, t = .06 + .8 * k / n;
      for (const s of [-1, 1]) g.L([x + s * R, 0, z], [x + s * R, ys, z], t, .1, .9, .03);
      g.arcW("xy", [x, ys, z], rm, Math.PI, 0, 16, t + .03, .12, .9);
      if (k) { for (const [a, b] of [[-R, ys], [R, ys]]) g.L([x + a, b, z + step], [x + a, b, z], t, .12, .6); g.L([x, ys + R * o.lat / o.hs, z + step], [x, ys + R * o.lat / o.hs, z], t, .12, .6); g.L([x - R, 0, z + step], [x - R, 0, z], t, .1, .5); g.L([x + R, 0, z + step], [x + R, 0, z], t, .1, .5); }
    }
  } },
  // 14 Für Agenturen: bestehendes Gebäude mit klarem Raster steht schon; Aufstockung und Anbau wachsen exakt im vorhandenen Raster weiter
  { sel: ["#agenturen .panel", 0], depth: 16, fn(g, o) {
    const d = o.dens, bw = 1.9, fh = 1.25, bx0 = -4.0, z0 = -5.2, z1 = -7.9, nb = 3, nf = 3;
    g.grid(-5, 5.2, -1.2, -13, 1.5 * d, 1.5 * d, 0, 0, .24, .1, .24, 4 / d);
    // Bestand
    g.box(bx0, bx0 + nb * bw, 0, nf * fh, z0, z1, 0, .2, .55);
    for (let i = 1; i < nb; i++) g.L([bx0 + i * bw, 0, z0], [bx0 + i * bw, nf * fh, z0], .1, .08, .55);
    for (let f = 1; f < nf; f++) g.L([bx0, f * fh, z0], [bx0 + nb * bw, f * fh, z0], .12 + f * .02, .08, .55);
    for (let i = 0; i < nb; i++) for (let f = 0; f < nf; f++) g.rectXY(z0, bx0 + i * bw + .5, bx0 + (i + 1) * bw - .5, f * fh + .35, f * fh + .95, .16 + f * .02, .06, .5);
    // Gerüst vor Anbau und Aufstockung
    const sx0 = bx0 + nb * bw - .1, sx1 = sx0 + bw + .3, sz = z0 + 1.0, sH = (nf + 1) * fh;
    for (const x of [sx0, sx1]) g.L([x, 0, sz], [x, sH + .4, sz], .3, .12, .65, .03);
    for (let l = 1; l <= nf + 1; l++) { g.L([sx0, l * fh, sz], [sx1, l * fh, sz], .34 + l * .02, .08, .55); g.L([sx0, l * fh, sz], [sx0, l * fh, z0], .36 + l * .02, .06, .4); g.L([sx1, l * fh, sz], [sx1, l * fh, z0], .36 + l * .02, .06, .4); }
    for (let l = 0; l <= nf; l += 2) g.L([sx0, l * fh, sz], [sx1, Math.min(l + 2, nf + 1) * fh, sz], .4, .08, .4);
    // Anbau (4. Feld) und Aufstockung im gleichen Raster
    const ax0 = bx0 + nb * bw, ax1 = ax0 + bw;
    g.box(ax0, ax1, 0, (nf + 1) * fh, z0, z1, .48, .24, .95);
    g.box(bx0, ax0, nf * fh, (nf + 1) * fh, z0, z1, .6, .24, .95);
    for (let i = 1; i <= nb; i++) g.L([bx0 + i * bw, nf * fh, z0], [bx0 + i * bw, (nf + 1) * fh, z0], .72, .08, .9);
    for (let f = 1; f <= nf; f++) g.L([ax0, f * fh, z0], [ax1, f * fh, z0], .62 + f * .03, .08, .9);
    for (let f = 0; f <= nf; f++) g.rectXY(z0, ax0 + .5, ax1 - .5, f * fh + .35, f * fh + .95, .66 + f * .03, .06, .75);
    for (let i = 0; i < nb; i++) g.rectXY(z0, bx0 + i * bw + .5, bx0 + (i + 1) * bw - .5, nf * fh + .35, nf * fh + .95, .8 + i * .03, .06, .75);
    // Fortsetzung der Geschossebenen über die Gerüstfelder hinaus
    for (let f = 1; f <= nf + 1; f++) g.L([ax1, f * fh, z0], [ax1 + .9, f * fh, z0], .86, .06, .4);
  } },
  // 15 Kontakt: Haus mit offener Tür, die rote Linie endet auf der Schwelle
  { sel: ["#kontakt .panel", 0], side: 0, doorX: -3.1, lineEnd: -3.6, fn(g, o) {
    const d = o.dens, x0 = -2.5, x1 = 2.5, h = 3.0, zf = -3.6, zb = -9.4, px0 = -.75, px1 = .75, ph = 2.6;
    g.grid(-6, 6, -.5, -12, 1.5 * d, 1.5 * d, 0, 0, .3, .13, .3, 4 / d);
    g.house(x0, x1, zf, zb, h, 1.7, .1, .5, .9);
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
  const red = geometry.userData.red;
  const movers = g.movers.map(m => ({ ...m, geo: moverGeo(o, m) }));
  const spinners = g.spinners.map(sp => {
    const gg = Gen({ ox: 0, oy: 0, oz: 0, lat: o.lat, hs: o.hs, Lb: 1, dens: 1 });
    gg.ns = true; sp.fn(gg);
    return { geo: gg.finish(), pos: sp.pos };
  });
  return { geometry, red, movers, shots: g.shots, spinners };
}
