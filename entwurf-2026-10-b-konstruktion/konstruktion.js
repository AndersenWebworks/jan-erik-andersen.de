// Konstruktionen für Entwurf B Konstruktion: Linien, die sich mit dem Scrollfortschritt zeichnen.
// Jede Konstruktion ist EIN LineSegments-Objekt; das Wachsen läuft komplett im Vertex-Shader (uProg).
import * as THREE from "three";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const LINE_VERT = `
  attribute vec3 aB; attribute vec4 aInfo;
  uniform float uProg;
  varying float vDepth; varying float vA; varying float vP;
  void main() {
    float p = clamp((uProg - aInfo.x) / max(aInfo.y, 1e-4), 0.0, 1.0);
    float e = p * (2.0 - p);
    vec3 pos = mix(position, aB, aInfo.w * e);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mv.z; vA = aInfo.z; vP = p;
    gl_Position = projectionMatrix * mv;
  }`;
export const LINE_FRAG = `
  uniform vec3 uColor; uniform vec2 uFar; uniform float uGain;
  varying float vDepth; varying float vA; varying float vP;
  void main() {
    if (vP <= 0.001) discard;
    float a = vA * smoothstep(0.4, 2.4, vDepth) * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
    a *= uGain; a *= 1.0 + 0.45 * (1.0 - step(0.999, vP)); // die Linie, die gerade gezeichnet wird, ist etwas kräftiger
    if (a < 0.005) discard;
    gl_FragColor = vec4(uColor, min(a, 1.0));
    #include <colorspace_fragment>
  }`;

export function lineMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uProg: { value: 0 }, uColor: { value: color }, uFar: { value: new THREE.Vector2(9, 34) }, uGain: { value: 1 } },
    vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, transparent: true, depthWrite: false
  });
}

// ---------- Generator ----------
function Gen(o) {
  const segs = [], marks = [];
  const X = x => o.ox + x * o.lat, Y = y => o.oy + y * o.hs, Z = z => o.oz + z;
  const g = {
    marks,
    // Linie a -> b, wächst von a aus. t0/d: Zeitfenster (0..1) im Kapitelfortschritt, w: Strichstärke (Deckkraft)
    L(a, b, t0, d, w = .6, ov = 0) {
      if (ov) {
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], f = ov / (Math.hypot(dx, dy, dz) || 1);
        a = [a[0] - dx * f, a[1] - dy * f, a[2] - dz * f];
        b = [b[0] + dx * f, b[1] + dy * f, b[2] + dz * f];
      }
      segs.push([a, b, t0, d, w]);
    },
    // Linienzug: die Teilstücke wachsen nacheinander
    poly(pts, t0, d, w = .6) {
      let tot = 0; const ls = [];
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); ls.push(l); tot += l; }
      let c = 0;
      for (let i = 1; i < pts.length; i++) { g.L(pts[i - 1], pts[i], t0 + d * c / tot, Math.max(.01, d * ls[i - 1] / tot), w); c += ls[i - 1]; }
    },
    rect(y, x0, x1, z0, z1, t0, d, w) { g.poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]], t0, d, w); },
    box(x0, x1, y0, y1, z0, z1, t0, d, w = .7) {
      g.rect(y0, x0, x1, z0, z1, t0, d * .35, w);
      for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) g.L([x, y0, z], [x, y1, z], t0 + d * .25, d * .4, w, .05);
      g.rect(y1, x0, x1, z0, z1, t0 + d * .6, d * .4, w);
    },
    // Raster: Linien in z-Richtung (je x) und in x-Richtung (je z); jede `every`-te kräftiger
    grid(x0, x1, z0, z1, sx, sz, y, t0, d, w, wm, every = 4) {
      const nx = Math.round((x1 - x0) / sx), nz = Math.round((z0 - z1) / sz), n = nx + nz + 2; let k = 0;
      for (let i = 0; i <= nx; i++, k++) { const x = x0 + i * sx, m = i % every === 0; g.L([x, y, z0], [x, y, z1], t0 + d * .65 * k / n, d * .35, m ? wm : w, m ? .25 : 0); }
      for (let j = 0; j <= nz; j++, k++) { const z = z0 - j * sz, m = j % every === 0; g.L([x0, y, z], [x1, y, z], t0 + d * .65 * k / n, d * .35, m ? wm : w, m ? .25 : 0); }
    },
    // Pflasterverband (Läuferverband): Reihen in x, versetzte Stoßfugen
    pave(x0, x1, z0, z1, cw, ch, y, t0, d, w) {
      const rows = Math.round((z0 - z1) / ch);
      for (let r = 0; r <= rows; r++) {
        const z = z0 - r * ch, t = t0 + d * .7 * r / rows;
        g.L([x0, y, z], [x1, y, z], t, d * .3, w * 1.25);
        if (r === rows) break;
        for (let x = x0 + (r % 2) * cw * .5; x < x1 - .01; x += cw) { if (x < x0 + .01) continue; g.L([x, y, z], [x, y, z - ch], t + d * .1, d * .2, w); }
      }
    },
    // Maßkette: a -> b, n = Richtung der Maßhilfslinien, Endstriche schräg, div Teilungen
    dim(a, b, n, div, t0, d, w = .55) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1, u = [dx / l, dy / l, dz / l];
      g.L(a, b, t0, d * .6, w, .25);
      const ext = .55, sl = .13;
      for (const p of [a, b]) {
        g.L([p[0] - n[0] * .15, p[1] - n[1] * .15, p[2] - n[2] * .15], [p[0] + n[0] * ext, p[1] + n[1] * ext, p[2] + n[2] * ext], t0 + d * .5, d * .25, w * .8);
        g.L([p[0] - (u[0] + n[0]) * sl, p[1] - (u[1] + n[1]) * sl, p[2] - (u[2] + n[2]) * sl], [p[0] + (u[0] + n[0]) * sl, p[1] + (u[1] + n[1]) * sl, p[2] + (u[2] + n[2]) * sl], t0 + d * .6, d * .2, w + .15);
      }
      for (let i = 1; i < div; i++) { const f = i / div, p = [a[0] + dx * f, a[1] + dy * f, a[2] + dz * f]; g.L([p[0] - (n[0] + u[0]) * .09, p[1] - (n[1] + u[1]) * .09, p[2] - (n[2] + u[2]) * .09], [p[0] + (n[0] + u[0]) * .09, p[1] + (n[1] + u[1]) * .09, p[2] + (n[2] + u[2]) * .09], t0 + d * .7, d * .25, w); }
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
    // Kreisbogen in der xy- oder xz-Ebene
    arc(c, r, a0, a1, plane, steps, t0, d, w = .6) {
      const pts = [];
      for (let i = 0; i <= steps; i++) { const a = a0 + (a1 - a0) * i / steps, cs = Math.cos(a) * r, sn = Math.sin(a) * r; pts.push(plane === "xy" ? [c[0] + cs, c[1] + sn, c[2]] : [c[0] + cs, c[1], c[2] + sn]); }
      g.poly(pts, t0, d, w);
    },
    // Marke (Achskreis oder Maß), wird in der Seite als Textur-Fläche gesetzt
    mark(x, y, z, text, t, kind) { marks.push({ p: [X(x), Y(y), Z(z)], text, t, kind }); },
    // Linie in Weltkoordinaten (z. B. Aufhängung der Bilder)
    Lw(a, b, t0, d, w) {
      const f = p => [(p[0] - o.ox) / o.lat, (p[1] - o.oy) / o.hs, p[2] - o.oz];
      g.L(f(a), f(b), t0, d, w);
    },
    finish() {
      const n = segs.length, P = new Float32Array(n * 6), B = new Float32Array(n * 6), I = new Float32Array(n * 8);
      segs.forEach(([a, b, t0, d, w], i) => {
        const zm = (a[2] + b[2]) / 2, stag = clamp(-zm / o.Lb, 0, 1);
        const tt = clamp(t0 * .8 + stag * .18, 0, .97), dd = Math.min(d * .8, 1 - tt);
        const A = [X(a[0]), Y(a[1]), Z(a[2])], E = [X(b[0]), Y(b[1]), Z(b[2])];
        for (let v = 0; v < 2; v++) {
          P.set(A, i * 6 + v * 3); B.set(E, i * 6 + v * 3);
          I.set([tt, dd, w, v], i * 8 + v * 4);
        }
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
      geo.setAttribute("aB", new THREE.BufferAttribute(B, 3));
      geo.setAttribute("aInfo", new THREE.BufferAttribute(I, 4));
      geo.userData.count = n;
      return geo;
    }
  };
  return g;
}

// ---------- Kapitel ----------
function skeleton(g, x0, x1, z0, z1, nx, nz, floors, fh, tb, ts, braceFace) {
  const xs = [], zs = [];
  for (let i = 0; i <= nx; i++) xs.push(x0 + (x1 - x0) * i / nx);
  for (let j = 0; j <= nz; j++) zs.push(z0 + (z1 - z0) * j / nz);
  for (const x of xs) for (const z of zs) g.rect(0, x - .12, x + .12, z + .12, z - .12, tb, ts * .1, .45); // Fundamentfüße
  for (let k = 0; k < floors; k++) {
    const tl = tb + ts * (.1 + .8 * k / floors), td = ts * .8 / floors, y0 = k * fh, y1 = (k + 1) * fh;
    for (const x of xs) for (const z of zs) g.L([x, y0, z], [x, y1, z], tl, td * .5, .9, .06);
    for (const z of zs) g.L([xs[0], y1, z], [xs[nx], y1, z], tl + td * .45, td * .3, .8, .12);
    for (const x of xs) g.L([x, y1, zs[0]], [x, y1, zs[nz]], tl + td * .5, td * .3, .8, .12);
    for (let j = 0; j < nz; j++) g.L([xs[0], y1, (zs[j] + zs[j + 1]) / 2], [xs[nx], y1, (zs[j] + zs[j + 1]) / 2], tl + td * .7, td * .25, .28); // Deckenbalken
    if (braceFace) { g.L([xs[0], y0, zs[0]], [xs[1], y1, zs[0]], tl + td * .8, td * .3, .4); g.L([xs[1], y0, zs[0]], [xs[0], y1, zs[0]], tl + td * .82, td * .3, .4); }
  }
  g.rect(floors * fh + .35, xs[0], xs[nx], zs[0], zs[nz], tb + ts * .92, ts * .08, .5); // Attika
}

const CH = [
  // 0 Einstieg: Grundraster mit Achsen, daraus erhebt sich ein erster Rahmen
  (g, o) => {
    const s = .75 * o.dens, Lb = o.Lb;
    g.grid(-9.75, 9.75, 1.5, -Lb, s, s, 0, 0, .34, .2, .5, 4 / o.dens);
    for (const [x, t] of [[-3, "A"], [0, "B"], [3, "C"]]) { g.L([x, 0, 1.5], [x, 0, -Lb - 1], .02, .22, .85, .1); g.mark(x, .05, -Lb - 1.55, t, .3, "axis"); }
    for (const [z, t] of [[-3, "1"], [-9, "2"], [-15, "3"]]) { g.L([9.75, 0, z], [-9.75, 0, z], .02, .22, .85, .1); g.mark(-10.5, .05, z, t, .3, "axis"); }
    const frame = (z, h, t, beam) => {
      g.rect(0, 2.7, 3.3, z + .3, z - .3, t - .04, .08, .5); g.rect(0, 6.7, 7.3, z + .3, z - .3, t - .04, .08, .5);
      g.L([3, 0, z], [3, h, z], t, .2, .95, .08); g.L([7, 0, z], [7, h, z], t + .02, .2, .95, .08);
      if (beam) g.L([3, h, z], [7, h, z], t + .2, .14, .95, .12);
    };
    frame(-5, 4.4, .3, true); frame(-10, 4.4, .4, true); frame(-15, 1.8, .5, false);
    for (const x of [3, 7]) { g.L([x, 4.4, -5], [x, 4.4, -10], .58, .16, .8, .1); g.L([x, 2.2, -5], [x, 2.2, -10], .64, .16, .4); }
    g.L([3, 0, -5], [7, 4.4, -5], .76, .14, .38); g.L([7, 0, -5], [3, 4.4, -5], .8, .14, .38);
    g.dim([3, 0, -2.7], [7, 0, -2.7], [0, 0, 1], 4, .82, .16);
    g.mark(5, .55, -2.75, "4,00", .92, "dim");
  },
  // 1 Gerwing: Pflasterraster + gestufte Terrassen-/Treppenkörper
  (g, o) => {
    const d = o.dens, Lb = o.Lb;
    g.pave(-9.5, 9.5, 1.5, -Lb, .9 * d, .45 * d, 0, 0, .42, .3);
    g.stairs(-9, -3.4, 0, -4, -1, 6, .4, .95, .32, .5, .75, d > 1 ? 0 : 1.1);
    g.stairs(3.4, 9, 0, -9, -1, 5, .5, 1.15, .4, .5, .75, d > 1 ? 0 : 1.1);
    g.stairs(-2.2, -.3, 0, -12.5, -1, 3, .3, .8, .7, .22, .6);
    // Plattenstapel
    g.box(-3.2, -1.6, 0, .18, -11, -12.2, .66, .1, .6); g.box(-3.1, -1.5, .18, .36, -11.1, -12.3, .7, .1, .6); g.box(-3.25, -1.65, .36, .54, -10.95, -12.15, .74, .1, .6);
    g.dim([-9, 0, -3], [-3.4, 0, -3], [0, 0, 1], 4, .78, .16); g.mark(-6.2, .5, -2.75, "5,60", .9, "dim");
    g.mark(10.6, .05, -9, "A", .5, "axis");
    if (o.wires) for (const [a, b] of o.wires) g.Lw(a, b, .8, .14, .7);
  },
  // 2 Leistungen: Skelettbau mit mehreren Geschossen
  (g, o) => {
    g.grid(.8, 9.4, 0, -12, 1.075 * o.dens, 1.2 * o.dens, 0, 0, .3, .2, .4, 4 / o.dens);
    skeleton(g, 1.8, 8.4, -2.2, -10.2, 3, 3, 4, 1.25, .08, .85, true);
    skeleton(g, -7.6, -4, -8, -13, 2, 2, 2, 1.25, .3, .5, false);
    g.stairs(9.0, 9.9, 0, -3, -1, 6, .21, .5, .8, .16, .55);
    g.dim([10.7, 0, -2.2], [10.7, 5, -2.2], [1, 0, 0], 4, .88, .12);
    g.mark(10.95, 5.5, -2.2, "5,00", .96, "dim");
    g.mark(1.8, .05, -13.3, "A", .4, "axis"); g.mark(8.4, .05, -13.3, "B", .4, "axis");
    g.L([1.8, 0, -2.2], [1.8, 0, -13], .12, .2, .8, .1); g.L([8.4, 0, -2.2], [8.4, 0, -13], .14, .2, .8, .1);
  },
  // 3 Weitere Arbeit: Reihe von Volumen mit Fassadenteilung
  (g, o) => {
    const vol = (x0, x1, h, z0, z1, t, fx) => {
      g.box(x0, x1, 0, h, z0, z1, t, .45, .85);
      const nzz = Math.round((z0 - z1) / (.8 * o.dens));
      for (let j = 1; j < nzz; j++) g.L([fx, 0, z0 + (z1 - z0) * j / nzz], [fx, h, z0 + (z1 - z0) * j / nzz], t + .5, .2, .32);
      for (let y = 1; y < h; y += .9 * o.dens) g.L([fx, y, z0], [fx, y, z1], t + .6, .2, .32);
    };
    g.grid(-9.5, 9.5, 1, -o.Lb, 1.5 * o.dens, 1.5 * o.dens, 0, 0, .28, .18, .35, 4 / o.dens);
    vol(-8, -4.2, 2.7, -2, -5.6, .1, -4.2); vol(-8, -4.2, 4.1, -6.4, -9.2, .22, -4.2); vol(-9, -4.2, 1.8, -10, -14, .34, -4.2);
    vol(3.8, 7.6, 1.8, -3, -6.2, .2, 3.8); vol(3.8, 9, 3.2, -7.4, -11.4, .32, 3.8);
    g.dim([-8, 0, -1.2], [-4.2, 0, -1.2], [0, 0, 1], 2, .8, .14); g.mark(-6.1, .5, -.95, "3,80", .9, "dim");
  },
  // 4 Wie ich arbeite: Grundriss, aus dem Wände wachsen
  (g, o) => {
    const h = 1.4, th = .09;
    const wall = (x0, z0, x1, z1, t) => {
      const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), ox = alongX ? 0 : th, oz = alongX ? th : 0;
      for (const s of [-1, 1]) {
        g.L([x0 + ox * s, 0, z0 + oz * s], [x1 + ox * s, 0, z1 + oz * s], t, .22, .75);
        g.L([x0 + ox * s, h, z0 + oz * s], [x1 + ox * s, h, z1 + oz * s], t + .42, .22, .55);
      }
      g.L([x0, 0, z0], [x0, h, z0], t + .3, .15, .8, .04); g.L([x1, 0, z1], [x1, h, z1], t + .32, .15, .8, .04);
    };
    g.grid(.5, 9.5, 1, -12.5, 1.5 * o.dens, 1.5 * o.dens, 0, 0, .25, .16, .25, 4 / o.dens);
    wall(1.8, -2, 8.6, -2, .08); wall(8.6, -2, 8.6, -11, .14); wall(8.6, -11, 1.8, -11, .2); wall(1.8, -11, 1.8, -2, .26);
    wall(1.8, -6.2, 4.4, -6.2, .32); wall(5.6, -6.2, 8.6, -6.2, .34); wall(5.2, -6.2, 5.2, -11, .38); wall(5.2, -8.6, 8.6, -8.6, .42);
    g.arc([4.4, 0, -6.2], 1.2, 0, Math.PI / 2, "xz", 8, .72, .12, .5); g.L([4.4, 0, -6.2], [4.4, 0, -7.4], .72, .1, .6);
    g.arc([5.2, 0, -10.2], 1.0, Math.PI / 2, Math.PI, "xz", 8, .78, .12, .5);
    g.dim([1.8, 0, -.9], [8.6, 0, -.9], [0, 0, 1], 4, .84, .14); g.mark(5.2, .5, -.65, "6,80", .94, "dim");
    g.mark(1.8, .05, -12.2, "A", .45, "axis"); g.mark(5.2, .05, -12.2, "B", .45, "axis"); g.mark(8.6, .05, -12.2, "C", .45, "axis");
  },
  // 5 Werdegang: Steg mit Teilstrichen
  (g, o) => {
    const Lb = o.Lb + 2, d = o.dens;
    for (const x of [2.3, 3.9]) g.L([x, .7, 3], [x, .7, -Lb], 0, .45, .85, .1);
    for (let z = 2.5; z > -Lb; z -= .55 * d) g.L([2.3, .7, z], [3.9, .7, z], .1 + .5 * (2.5 - z) / (Lb + 2.5), .12, .4);
    for (let z = 2; z > -Lb; z -= 3.6 * d) {
      const t = .2 + .45 * (2 - z) / (Lb + 2);
      for (const x of [2.3, 3.9]) { g.L([x, 0, z], [x, .7, z], t, .1, .6); g.L([x, .7, z], [x, 1.7, z], t + .08, .1, .6); }
    }
    for (const x of [2.3, 3.9]) g.L([x, 1.7, 2], [x, 1.7, -Lb], .55, .35, .6, .1);
    // Zeitachse mit Teilstrichen
    g.L([-3.5, 0, 3], [-3.5, 0, -Lb - 1], .05, .4, .85, .15);
    for (let i = 0; i < (Lb + 2.5) / (.5 * d); i++) {
      const z = 2.5 - i * .5 * d, major = Math.abs(((2.5 - z) / 2.5) - Math.round((2.5 - z) / 2.5)) < .01, len = major ? .45 : .17;
      g.L([-3.5 - len, 0, z], [-3.5 + len, 0, z], .15 + .55 * (2.5 - z) / (Lb + 2.5), .1, major ? .8 : .45);
    }
    for (const [z, t] of [[-.5, "0"], [-5.5, "5"], [-10.5, "10"], [-15.5, "15"]]) g.mark(-4.6, .05, z, t, .3 + (-z) / 30, "axis");
    g.dim([-3.5, 0, -.5], [-3.5, 0, -15.5], [-1, 0, 0], 3, .78, .2);
  },
  // 6 Stimmen: Bogenfolge (Gewölbe-Rippen)
  (g, o) => {
    const cx = 3.6, hw = 1.9, sp = 2.0;
    g.rect(0, cx - hw - .6, cx + hw + .6, 1, -12.8, 0, .25, .3);
    const zs = o.dens > 1 ? [-2, -6, -10] : [-2, -4.8, -7.6, -10.4, -13];
    zs.forEach((z, k) => {
      const t = .1 + k * (.62 / zs.length);
      for (const x of [cx - hw, cx + hw]) g.L([x, 0, z], [x, sp, z], t, .12, .9, .05);
      g.arc([cx, sp, z], hw, Math.PI, 0, "xy", 14, t + .1, .16, .9);
    });
    for (const [x, y, w] of [[cx - hw, sp, .6], [cx + hw, sp, .6], [cx, sp + hw, .75], [cx - hw, 0, .6], [cx + hw, 0, .6]]) g.L([x, y, zs[0]], [x, y, zs[zs.length - 1]], .72, .2, w, .1);
    for (let k = 0; k < zs.length - 1; k++) g.L([cx - hw, sp, (zs[k] + zs[k + 1]) / 2], [cx + hw, sp, (zs[k] + zs[k + 1]) / 2], .86, .1, .3);
    g.dim([cx + hw, 0, 1.2], [cx + hw, sp + hw, 1.2], [1, 0, 0], 2, .88, .1);
    g.mark(cx + hw + .75, sp + hw + .45, 1.2, "3,90", .96, "dim");
  },
  // 7 Agenturen: Fachwerkbrücke
  (g, o) => {
    const xa = -3.1, xb = -6.3, y0 = 1.6, y1 = 3.3, pl = 2.0 * o.dens, zE = -o.Lb + 1, z0 = -1;
    const n = Math.round((z0 - zE) / pl);
    for (const z of [z0, (z0 + zE) / 2, zE]) for (const x of [xa, xb]) { g.L([x, 0, z], [x, y0, z], .08, .2, .9, .06); g.rect(0, x - .2, x + .2, z + .2, z - .2, .05, .08, .4); }
    for (const x of [xa, xb]) {
      g.L([x, y0, z0], [x, y0, z0 - pl * n], .3, .25, .9, .1);
      g.L([x, y1, z0], [x, y1, z0 - pl * n], .45, .25, .9, .1);
      for (let i = 0; i <= n; i++) {
        const z = z0 - i * pl, t = .55 + .35 * i / n;
        g.L([x, y0, z], [x, y1, z], t, .1, .7);
        if (i < n) { const up = i % 2 === 0; g.L([x, up ? y0 : y1, z], [x, up ? y1 : y0, z - pl], t + .03, .12, .55); }
      }
    }
    for (let i = 0; i <= n; i++) g.L([xa, y0, z0 - i * pl], [xb, y0, z0 - i * pl], .4 + .3 * i / n, .1, .5);
    for (let i = 0; i < n; i++) g.L([xa, y1, z0 - i * pl], [xb, y1, z0 - i * pl - pl], .78 + .1 * i / n, .1, .3);
    g.mark(-4.7, .05, z0 + 1.1, "A", .3, "axis"); g.mark(-4.7, .05, zE - 1.1, "B", .35, "axis");
    g.dim([xa - .2, y1 + .6, z0], [xa - .2, y1 + .6, zE], [0, 1, 0], n, .92, .06);
  },
  // 8 Kontakt: schlichtes fertiges Volumen mit offener Tür
  (g, o) => {
    const x0 = 1.2, x1 = 7.4, h = 4.2, zf = -3.2, zb = -9.4;
    g.grid(.8, 9.4, 1, -9.5, 1.45 * o.dens, 1.45 * o.dens, 0, 0, .3, .18, .35, 4 / o.dens);
    g.box(x0, x1, 0, h, zf, zb, .2, .5, .95);
    // Portal in der Vorderfront
    const px0 = 3.3, px1 = 5.3, ph = 2.9;
    g.L([px0, 0, zf], [px0, ph, zf], .66, .12, 1, .04); g.L([px1, 0, zf], [px1, ph, zf], .68, .12, 1, .04); g.L([px0, ph, zf], [px1, ph, zf], .78, .1, 1, .08);
    g.L([px0 - .22, 0, zf], [px0 - .22, ph + .22, zf], .72, .1, .8); g.L([px1 + .22, 0, zf], [px1 + .22, ph + .22, zf], .73, .1, .8); g.L([px0 - .22, ph + .22, zf], [px1 + .22, ph + .22, zf], .8, .1, .8);
    // offene Tür: Blatt klappt zur Kamera, Kanten wachsen vom Band aus
    const hx = px1, ox2 = px1 - .75, oz2 = zf + 1.2;
    g.L([hx, 0, zf], [ox2, 0, oz2], .84, .08, 1); g.L([hx, ph, zf], [ox2, ph - .06, oz2], .85, .08, 1);
    g.L([ox2, 0, oz2], [ox2, ph - .06, oz2], .88, .08, 1);
    g.arc([hx, 0, zf], 1.1, Math.PI * .72, Math.PI, "xz", 8, .88, .08, .4);
    g.stairs(px0 - .3, px1 + .3, 0, zf + .8, -1, 2, .17, .4, .86, .1, .7);
    g.rect(h + .12, x0 - .25, x1 + .25, zf + .25, zb - .25, .88, .1, .55); // Dachkante
    g.dim([x0, 0, zf + 1.3], [x1, 0, zf + 1.3], [0, 0, 1], 2, .9, .08); g.mark((x0 + x1) / 2, .5, zf + 1.55, "5,80", .97, "dim");
  }
];

export function buildChapter(i, o) {
  const g = Gen(o);
  CH[i](g, o);
  return { geometry: g.finish(), marks: g.marks };
}

// Beschriftungstexturen: Achskreis mit Buchstabe oder Maßzahl, nur Linien/Schrift in Tinte
const cache = new Map();
export function markTexture(text, kind) {
  const key = kind + text;
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement("canvas");
  const dim = kind === "dim";
  cv.width = dim ? 256 : 128; cv.height = 128;
  const x = cv.getContext("2d");
  x.strokeStyle = "#303033"; x.fillStyle = "#303033"; x.textAlign = "center"; x.textBaseline = "middle";
  if (dim) {
    x.font = '500 54px "Schibsted Grotesk"';
    x.fillText(text, 128, 66);
  } else {
    x.lineWidth = 4; x.beginPath(); x.arc(64, 64, 52, 0, Math.PI * 2); x.stroke();
    x.font = '500 58px "Schibsted Grotesk"';
    x.fillText(text, 64, 68);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const r = { tex, aspect: cv.width / cv.height };
  cache.set(key, r);
  return r;
}
export const MARK_FRAG = `
  uniform sampler2D uMap; uniform float uOpacity; uniform vec2 uFar;
  varying vec2 vUv; varying float vDepth;
  void main() {
    vec4 c = texture2D(uMap, vUv);
    float a = c.a * uOpacity * smoothstep(4.0, 8.0, vDepth) * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
    if (a < 0.01) discard;
    gl_FragColor = vec4(c.rgb, a * 0.9);
    #include <colorspace_fragment>
  }`;
export const MARK_VERT = `
  varying vec2 vUv; varying float vDepth;
  void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
