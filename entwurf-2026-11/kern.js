// Eröffnung jan-erik-andersen.de, Fassung 2026-11: gemeinsames Gerüst für die drei Varianten.
// Papier mit Haarkante, Netz dann Fläche, mechanisches Einrasten, Druck direkt auf dem Bauteil,
// berechnete Lesestellungen, gedämpfte Bahn ohne Lock (an Lesestellen langsamer, nie still),
// rote Messlinie mit Punkt am Boden wie in der Mischung.
// Ein Fortschritt p (0 … 1) folgt dem Scrollen gedämpft. Aus p entsteht über eine Zeitverzerrung
// der Bahnparameter u und daraus der Baufortschritt b, an dem alle Bewegungen hängen.
// Anker: #v=a|b|c wählt die Variante, #p=0…1 steuert einen Zustand an (Ankerwechsel lädt nicht neu).
import * as THREE from "three";
import { SCHRIFTEN } from "./fonts/schriften.js";

export const PI = Math.PI;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
export const win = (b, t0, d) => clamp((b - t0) / d, 0, 1);
// Mechanischer Lauf: anfahren, abbremsen, kurz über den Anschlag, einrasten
export function mech(x, over = .035) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const w = .74;
  if (x < w) { const u = x / w; return (1 + over) * u * u * u * (u * (u * 6 - 15) + 10); }
  const t = (x - w) / (1 - w);
  return 1 + over * Math.cos(t * PI * 2.5) * (1 - t) * (1 - t);
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function bytes(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
async function loadFonts() {
  await Promise.all([["Newsreader", "200 800"], ["Schibsted Grotesk", "400 900"]].map(async ([name, w]) => {
    const ff = new FontFace(name, bytes(SCHRIFTEN[name]), { weight: w });
    await ff.load(); document.fonts.add(ff);
  }));
}

// Monotone kubische Interpolation (Fritsch–Carlson): weich, ohne Überschwingen
function pchip(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-9, xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]), w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]); m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return x => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

export function run(VARIANTS) {
  const canvas = document.getElementById("stage");
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    if (!renderer.getContext()) renderer = null;
  } catch (e) { renderer = null; }
  loadFonts().catch(() => {}).then(() => renderer ? start(renderer, VARIANTS) : document.documentElement.classList.add("nogl"));
}

function start(renderer, VARIANTS) {
  const canvas = renderer.domElement;
  renderer.setClearColor(0xffffff, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 300);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // ---------- Material ----------
  const INK = new THREE.Color("#303033");
  const C = { paper: "#fbfaf7", base: "#fcfbf9", old: "#ece8e0", shade: "#dcd7cd", deep: "#c9c3b8", red: "#d40235", white: "#ffffff", ink: "#303033" };
  const LIGHT = new THREE.Vector3(-.45, .8, .4).normalize();
  const VERT = `
    varying vec3 vW;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vW = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  // Papier: flache Normale aus den Bildschirmableitungen, weiches Licht, leichte Bodenverschattung
  const FRAG = `
    uniform vec3 uCol; uniform vec3 uL; uniform float uFlat;
    varying vec3 vW;
    void main() {
      vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
      if (dot(n, cameraPosition - vW) < 0.0) n = -n;
      float dif = dot(n, uL);
      float sh = 0.875 + 0.125 * max(dif, 0.0) - 0.1 * max(-dif, 0.0);
      float ao = mix(1.0, mix(0.88, 1.0, smoothstep(0.0, 0.9, vW.y)), 1.0 - abs(n.y));
      gl_FragColor = vec4(uCol * mix(sh * ao, 1.0, uFlat), 1.0);
      #include <colorspace_fragment>
    }`;
  const mats = new Map();
  function paper(col, flat = 0) {
    const key = col + flat;
    if (!mats.has(key)) mats.set(key, new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(col) }, uL: { value: LIGHT }, uFlat: { value: flat } },
      vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    }));
    return mats.get(key);
  }
  // Haarlinien, die sich zeichnen: jede Kante wächst von ihrem Anfang aus, Kante für Kante
  const NET_V = `
    attribute float aS; attribute float aT; varying float vS; varying float vT;
    void main() { vS = aS; vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const NET_F = `
    uniform vec3 uCol; uniform float uOp; uniform float uK; uniform float uSpan; varying float vS; varying float vT;
    void main() {
      float g = clamp((uK - vS) / uSpan, 0.0, 1.0);
      if (vT > g + 0.0001 || g <= 0.0) discard;
      gl_FragColor = vec4(uCol, uOp);
      #include <colorspace_fragment>
    }`;
  function netLines(segs, col = INK, op = .58) {
    const pos = [], aS = [], aT = [], n = segs.length;
    const span = Math.min(.5, .1 + 1.5 / n);
    segs.forEach(([a, b], i) => { pos.push(a.x, a.y, a.z, b.x, b.y, b.z); const s = (n > 1 ? i / (n - 1) : 0) * (1 - span); aS.push(s, s); aT.push(0, 1); });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aS", new THREE.Float32BufferAttribute(aS, 1));
    g.setAttribute("aT", new THREE.Float32BufferAttribute(aT, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(col) }, uOp: { value: op }, uK: { value: 0 }, uSpan: { value: span } },
      vertexShader: NET_V, fragmentShader: NET_F, transparent: true, depthWrite: false
    });
    const l = new THREE.LineSegments(g, mat); l.renderOrder = 1;
    return l;
  }

  // ---------- Textur und Druck ----------
  const PXEM = 110;
  function texOf(cv) {
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso; tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }
  // lines: Zeilen; opt.font "sans"|"serif", opt.weight, opt.col, opt.lh, opt.track (Sperrung in em), opt.caps
  function printTex(lines, opt = {}) {
    const em = PXEM, lh = (opt.lh || 1.36) * em;
    const fam = opt.font === "serif" ? '"Newsreader"' : '"Schibsted Grotesk"';
    const font = `${opt.weight || (opt.font === "serif" ? 300 : 500)} ${em}px ${fam}`;
    const cv = document.createElement("canvas"), x = cv.getContext("2d");
    x.font = font; if (opt.track) x.letterSpacing = (opt.track * em) + "px";
    const padX = .14 * em, padY = .12 * em;
    const wMax = Math.max(...lines.map(l => x.measureText(l).width));
    cv.width = Math.ceil(wMax + padX * 2);
    cv.height = Math.ceil(padY * 2 + (lines.length - 1) * lh + em * 1.16);
    x.font = font; if (opt.track) x.letterSpacing = (opt.track * em) + "px";
    x.fillStyle = opt.col || "#303033"; x.textBaseline = "alphabetic";
    lines.forEach((l, i) => x.fillText(l, padX, padY + em * .92 + i * lh));
    return { tex: texOf(cv), w: cv.width / em, h: cv.height / em, padX: padX / em };
  }
  const prints = [];
  // Druck in der lokalen xy-Ebene von parent (Normale +z). e: Geviert in Welteinheiten.
  // anchor "l": x ist die linke Kante der Schrift, "c": Mitte. on: Baufortschritt, ab dem der Druck steht (-1 = immer).
  function print(parent, lines, e, x, y, z, on, opt = {}) {
    const t = printTex(lines, opt);
    const mat = new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const w = t.w * e, h = t.h * e;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const ax = opt.anchor === "c" ? x : x + w / 2 - t.padX * e;
    mesh.position.set(ax, y, z);
    mesh.renderOrder = 3;
    parent.add(mesh);
    const pr = { mesh, mat, on, e, w, h, fade: opt.fade || .018 };
    prints.push(pr);
    return pr;
  }
  // Bild (Canvas-Zeichnung) als Druck: draw(ctx, w, h) zeichnet in Pixeln
  function decal(parent, wpx, hpx, draw, w, h, x, y, z, on, fade = .02) {
    const cv = document.createElement("canvas"); cv.width = wpx; cv.height = hpx;
    draw(cv.getContext("2d"), wpx, hpx);
    const mat = new THREE.MeshBasicMaterial({ map: texOf(cv), transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z); mesh.renderOrder = 2;
    parent.add(mesh);
    const pr = { mesh, mat, on, e: 1, w, h, fade, decal: true };
    prints.push(pr);
    return pr;
  }

  // ---------- Bau ----------
  let model = null, anims = [], nets = [];
  // Faltquader: erst zeichnet sich das Kantennetz (net: [t0, d]), dann klappen die Flächen nacheinander
  // aus der Kante herein und rasten ein (face: [t0, d]). Jede Fläche hängt an einem Scharnier an einer Kante.
  // opt.skip: Flächen auslassen ("ny" Boden ist Standard), opt.v: andere Scharnierrichtung je Fläche.
  function box(x0, x1, y0, y1, z0, z1, opt = {}) {
    const g = new THREE.Group();
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hy = (y1 - y0) / 2, hz = (z1 - z0) / 2;
    g.position.set(cx, cy, cz);
    const col = opt.col || C.paper;
    const net = opt.net || [0, .1], face = opt.face || [.2, .1];
    const P = (sx, sy, sz) => V(sx * hx, sy * hy, sz * hz);
    // Kanten in Bauordnung: unten, Senkrechte, oben
    const segs = [];
    const ring = sy => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => P(a, sy, c));
    const lo = ring(-1), hi = ring(1);
    for (let i = 0; i < 4; i++) segs.push([lo[i], lo[(i + 1) % 4]]);
    for (let i = 0; i < 4; i++) segs.push([lo[i], hi[i]]);
    for (let i = 0; i < 4; i++) segs.push([hi[i], hi[(i + 1) % 4]]);
    const isRed = col === C.red;
    const lines = netLines(segs, isRed ? new THREE.Color(C.red) : INK, opt.edge ?? (isRed ? .9 : .66));
    g.add(lines);
    nets.push({ l: lines, t0: net[0], d: net[1] });
    // Flächen: Normale n, Scharnierrichtung v (von der Scharnierkante zur Gegenkante)
    const defs = {
      px: [V(1, 0, 0), V(0, 1, 0)], nx: [V(-1, 0, 0), V(0, 1, 0)],
      pz: [V(0, 0, 1), V(0, 1, 0)], nz: [V(0, 0, -1), V(0, 1, 0)],
      py: [V(0, 1, 0), V(0, 0, -1)], ny: [V(0, -1, 0), V(0, 0, -1)]
    };
    // opt.v: { pz: K.V(…) } andere Scharnierrichtung je Fläche (Einheitsvektor in der Fläche)
    const ext = a => Math.abs(a.x) * 2 * hx + Math.abs(a.y) * 2 * hy + Math.abs(a.z) * 2 * hz;
    const skip = opt.skip || ["ny"];
    const order = opt.order || ["pz", "px", "nx", "nz", "py", "ny"];
    const faces = {};
    const live = order.filter(k => !skip.includes(k));
    live.forEach((k, i) => {
      const n0 = defs[k][0], v0 = (opt.v && opt.v[k]) || defs[k][1];
      const d = { n: n0, v: v0, c: V(n0.x * hx, n0.y * hy, n0.z * hz) };
      const u = new THREE.Vector3().crossVectors(d.v, d.n);
      d.lu = ext(u); d.lv = ext(d.v);
      const pivot = new THREE.Group();
      pivot.position.copy(d.c).addScaledVector(d.v, -d.lv / 2);
      const basis = new THREE.Matrix4().makeBasis(u, d.v, d.n);
      const q0 = new THREE.Quaternion().setFromRotationMatrix(basis);
      const geo = new THREE.PlaneGeometry(d.lu, d.lv); geo.translate(0, d.lv / 2, 0);
      const mesh = new THREE.Mesh(geo, paper(k === "py" && opt.top ? opt.top : col));
      pivot.add(mesh);
      const holder = new THREE.Group(); holder.position.set(0, d.lv / 2, .0015); pivot.add(holder);
      g.add(pivot);
      const f = { k, pivot, mesh, holder, lu: d.lu, lv: d.lv };
      faces[k] = f;
      const n = live.length, fd = face[1] * .5, ft = face[0] + (n > 1 ? i / (n - 1) : 0) * (face[1] - fd);
      const qx = new THREE.Quaternion(), X = V(1, 0, 0), open = (opt.open || 78) * PI / 180;
      anims.push(b => {
        const kf = win(b, ft, fd), m = mech(kf, .07);
        mesh.visible = kf > 0; holder.visible = kf >= 1;
        mesh.scale.y = Math.max(.001, Math.min(1, kf * 1.6));
        qx.setFromAxisAngle(X, open * (1 - m));
        pivot.quaternion.copy(q0).multiply(qx);
      });
    });
    g.userData.faces = faces;
    g.userData.size = V(2 * hx, 2 * hy, 2 * hz);
    // Druck auf eine Fläche: dx, dy relativ zur Flächenmitte
    g.userData.put = (k, obj, dx = 0, dy = 0) => { const f = faces[k]; obj.position.x += dx; obj.position.y += dy; f.holder.add(obj); return obj; };
    return g;
  }
  // Druck direkt auf eine Fläche eines Faltquaders (der Druck erscheint, wenn die Fläche eingerastet ist)
  function printOn(bx, k, lines, e, dx, dy, on, opt = {}) {
    const f = bx.userData.faces[k];
    return print(f.holder, lines, e, dx, dy, .001, on, opt);
  }
  function decalOn(bx, k, wpx, hpx, draw, w, h, dx, dy, on, fade) {
    const f = bx.userData.faces[k];
    return decal(f.holder, wpx, hpx, draw, w, h, dx, dy, .0008, on, fade);
  }
  // Rohr (Kabel), das sich von seinem Anfang aus zieht
  function cable(pts, r, col, t0, d) {
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5);
    const TS = 140, RS = 10;
    const geo = new THREE.TubeGeometry(curve, TS, r, RS, false);
    const mesh = new THREE.Mesh(geo, paper(col));
    const total = geo.index.count;
    anims.push(b => { const k = sm(win(b, t0, d)); geo.setDrawRange(0, Math.floor(k * TS) * RS * 6); mesh.visible = k > 0; });
    model.add(mesh);
    return { mesh, curve };
  }
  // Statuspunkt: rote Scheibe, tickt im festen Takt (kurzes Anheben), kein Schein
  function ticker(parent, r, x, y, z, on) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color: C.red, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    m.position.set(x, y, z); parent.add(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.55, r * 1.75, 40), new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
    ring.position.set(x, y, z + .0005); parent.add(ring);
    anims.push((b, t) => {
      const k = win(b, on, .02); m.visible = k > 0; m.scale.setScalar(sm(k));
      const ph = (t % 1.4) / 1.4, beat = ph < .12 ? Math.sin(ph / .12 * PI) : 0;
      if (k >= 1) m.scale.setScalar(1 + .18 * beat);
      ring.material.opacity = k >= 1 ? .55 * (1 - ph) * (ph < .7 ? 1 : 0) : 0;
      ring.scale.setScalar(1 + ph * .9);
    });
    return m;
  }

  // ---------- Roter Faden: Messlinie am Boden, der Punkt läuft voraus ----------
  const RED = new THREE.Color(C.red);
  let thread = null;
  function buildThread(def) {
    // def.pts: Weg (erster Punkt am Statuspunkt), def.t0/def.t1: Baufortschritt von Abfahrt bis Ankunft
    const curve = new THREE.CatmullRomCurve3(def.pts, false, "centripetal", .5);
    const N = 600, pts = curve.getSpacedPoints(N);
    const lg = new THREE.BufferGeometry().setFromPoints(pts);
    const lmat = new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: .9 });
    const line = new THREE.Line(lg, lmat); line.renderOrder = 2; model.add(line);
    // Teilstriche nur auf dem Bodenteil
    const tp = [], len = curve.getLength(), tick = .5;
    for (let s = tick; s < len; s += tick) {
      const u = s / len, p = curve.getPointAt(u); if (p.y > .03) continue;
      const tg = curve.getTangentAt(u), nrm = V(-tg.z, 0, tg.x).normalize();
      const major = Math.round(s / tick) % 5 === 0, h = major ? .16 : .07;
      tp.push(p.clone().addScaledVector(nrm, -h), p.clone().addScaledVector(nrm, h), u);
    }
    const tpos = [], tus = [];
    for (let i = 0; i < tp.length; i += 3) { tpos.push(tp[i].x, tp[i].y, tp[i].z, tp[i + 1].x, tp[i + 1].y, tp[i + 1].z); tus.push(tp[i + 2]); }
    const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(tpos, 3));
    const ticks = new THREE.LineSegments(tg, lmat); ticks.renderOrder = 2; model.add(ticks);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, depthTest: false }));
    dot.renderOrder = 6; model.add(dot);
    thread = { def, curve, N, line, lg, ticks, tg, tus, dot, pos: V() };
  }
  function updateThread(b) {
    if (!thread) return;
    const { def } = thread;
    const k = sm(win(b, def.t0, def.t1 - def.t0));
    const vis = b >= def.t0;
    thread.line.visible = thread.ticks.visible = vis && k > 0;
    thread.dot.visible = vis;
    thread.lg.setDrawRange(0, Math.max(2, Math.ceil(k * thread.N) + 1));
    let n = 0; for (const u of thread.tus) { if (u <= k) n++; else break; }
    thread.tg.setDrawRange(0, n * 2);
    thread.curve.getPointAt(k, thread.pos);
    thread.dot.position.copy(thread.pos);
    thread.dot.quaternion.copy(camera.quaternion);
    const dist = camera.position.distanceTo(thread.pos);
    thread.dot.scale.setScalar(Math.max(.045, dist * .0062));
  }

  // ---------- Kamera ----------
  // Prüfhilfe: #…&w=390&h=844 rendert den Ausschnitt eines Handys mittig im Fenster
  const fq = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const FORCE = fq.get("w") && fq.get("h") ? { w: +fq.get("w"), h: +fq.get("h") } : null;
  const VW = () => FORCE ? FORCE.w : innerWidth, VH = () => FORCE ? Math.min(FORCE.h, innerHeight) : innerHeight;
  let aspect = 1, cur = null;
  const minPx = () => aspect < 1 ? 16.5 : 20;
  function prep(def) {
    // Endstellung durchrechnen, um die Lesestellen in Weltkoordinaten zu kennen
    for (const a of anims) a(1, 0);
    scene.updateMatrixWorld(true);
    const v = V();
    for (const s of def.stops) {
      s.pts = [];
      for (const pr of s.prints) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) s.pts.push(v.set(sx * pr.w / 2, sy * pr.h / 2, 0).applyMatrix4(pr.mesh.matrixWorld).clone());
      s.n = V(0, 0, 1).transformDirection(s.prints[0].mesh.matrixWorld);
      s.e = Math.min(...s.prints.map(pr => pr.e));
      s.c = s.pts.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / s.pts.length);
      s.withPts = [];
      for (const o of (s.with || [])) { const bb = new THREE.Box3().setFromObject(o); for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) s.withPts.push(V(x, y, z)); }
      if (s.b === undefined) s.b = Math.max(...s.prints.map(pr => pr.on)) + .03;
    }
    for (const a of anims) a(0, 0);
    // Bahn: Schlüssel mit Gewicht (Scrollweg ab dem vorigen) und Baufortschritt b
    let acc = 0; const tot = def.keys.reduce((a, k) => a + k.w, 0);
    for (const k of def.keys) { acc += k.w; k.u = acc / tot; if (k.stop) k.b = k.stop.b; }
    const keyU = def.keys.map(k => k.u);
    def.bOfU = pchip(keyU, def.keys.map(k => k.b));
    def.idxOfU = pchip(keyU, def.keys.map((k, i) => i));
    // Zeitverzerrung: an Lesestellen sinkt die Bahngeschwindigkeit auf rund ein Drittel, nie auf null
    const STOPU = def.keys.filter(k => k.stop && !k.noWarp).map(k => k.u);
    const WARP_MIN = def.warpMin || .34, WARP_W = def.warpW || .03, NW = 3000;
    const warpP = new Float64Array(NW + 1);
    const bump = u => STOPU.length ? Math.max(...STOPU.map(s => Math.exp(-(((u - s) / WARP_W) ** 2)))) : 0;
    const sp = u => 1 - (1 - WARP_MIN) * bump(u);
    let T = 0; for (let i = 0; i < NW; i++) T += 1 / sp((i + .5) / NW) / NW;
    let a2 = 0; for (let i = 0; i < NW; i++) { a2 += 1 / sp((i + .5) / NW) / NW; warpP[i + 1] = a2 / T; }
    def.pOfU = u => { const f = clamp(u, 0, 1) * NW, i = Math.min(NW - 1, Math.floor(f)); return warpP[i] + (warpP[i + 1] - warpP[i]) * (f - i); };
    def.uOfP = p => {
      if (p <= 0) return 0; if (p >= 1) return 1;
      let lo = 0, hi = NW;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (warpP[mid] < p) lo = mid; else hi = mid; }
      return (lo + (p - warpP[lo]) / (warpP[hi] - warpP[lo])) / NW;
    };
  }
  // Lesestellung aus der Textfläche: Richtung aus Azimut/Elevation in Weltwinkeln,
  // Abstand aus der gewünschten Schriftgröße (verkürzt durch den Blickwinkel) und der Einpassung in den Ausschnitt
  function stopPose(s) {
    const t = Math.tan(camera.fov * PI / 360), H = VH();
    const az = (s.az || 0) * PI / 180, el = (s.el ?? 14) * PI / 180;
    const dir = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const fore = Math.max(.5, Math.abs(dir.dot(s.n)));
    const right = V().crossVectors(dir, V(0, 1, 0)).normalize().negate(), up = V().crossVectors(right, dir).negate();
    const ext = pts => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { const d = p.clone().sub(s.c); const x = d.dot(right), y = d.dot(up); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, x1, y0, y1 }; };
    const te = ext(s.pts);
    const padW = aspect < 1 ? 1.12 : 1.25;
    const dSize = s.e * fore * H / (2 * t * (s.px ? s.px * (aspect < 1 ? .85 : 1) : minPx()));
    const dFitW = (te.x1 - te.x0) * padW / (2 * t * aspect), dFitH = (te.y1 - te.y0) * 1.4 / (2 * t);
    let d = Math.max(dSize, dFitW, dFitH);
    const c = s.c.clone();
    // Bauteil mit ins Bild nehmen, soweit es die Schriftgröße erlaubt: Ziel wandert Richtung Bauteil
    if (s.withPts.length) {
      const we = ext(s.withPts.concat(s.pts));
      const fitAll = Math.max((we.y1 - we.y0) * 1.3 / (2 * t), (we.x1 - we.x0) * 1.15 / (2 * t * aspect));
      d = Math.max(d, Math.min(fitAll, d * (s.grow ?? 1.25)));
      const room = d * 2 * t * (s.room ?? .8), roomW = d * 2 * t * aspect * .97;
      const lim = (v, half, ext0, ext1) => clamp(v, ext1 - half, ext0 + half);
      // Mitte der Gesamtansicht, aber so, dass der Text vollständig im Ausschnitt bleibt
      const cy = lim((we.y1 + we.y0) / 2 * (s.bias ?? .8), room / 2, te.y0, te.y1);
      const cx = lim((we.x1 + we.x0) / 2 * (s.bias ?? .8), roomW / 2, te.x0, te.x1);
      c.addScaledVector(up, cy).addScaledVector(right, cx);
    }
    return { cam: c.clone().addScaledVector(dir, d), tgt: c, d };
  }
  function buildPath(def) {
    const k = aspect < 1.25 ? Math.pow(1.25 / aspect, .7) : 1;
    const cams = [], tgts = [];
    for (const key of def.keys) {
      if (key.stop) { const ps = stopPose(key.stop); cams.push(ps.cam); tgts.push(ps.tgt); continue; }
      const off = key.cam.clone().sub(key.tgt);
      cams.push(key.tgt.clone().addScaledVector(off, key.fixed ? 1 : k)); tgts.push(key.tgt.clone());
    }
    def.camC = new THREE.CatmullRomCurve3(cams, false, "centripetal");
    def.tgtC = new THREE.CatmullRomCurve3(tgts, false, "centripetal");
  }

  // ---------- Variante laden ----------
  const groundMat = paper(C.base, .35);
  let state = { u: 0, b: 0 };
  function load(id) {
    if (model) { scene.remove(model); model.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); }); }
    model = new THREE.Group(); scene.add(model);
    anims = []; nets = []; prints.length = 0; thread = null;
    const K = {
      THREE, V, C, PI, model, mech, sm, win, clamp, paper, box, print, printOn, decal, decalOn, cable, ticker, netLines,
      anim: fn => anims.push(fn),
      net: (l, t0, d) => nets.push({ l, t0, d }),
      ground(x0, x1, z0, z1) {
        const g = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .04, z1 - z0), groundMat);
        g.position.set((x0 + x1) / 2, -.02, (z0 + z1) / 2);
        g.add(new THREE.LineSegments(new THREE.EdgesGeometry(g.geometry), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .25 })));
        model.add(g); return g;
      },
      // flach auf dem Boden liegender Druck, liest sich von vorn (+z)
      flat(lines, e, x, z, on, opt = {}) {
        const holder = new THREE.Group(); holder.position.set(0, .003, 0); holder.rotation.x = -PI / 2; model.add(holder);
        return print(holder, lines, e, x, -z, 0, on, opt);
      }
    };
    const def = VARIANTS[id](K);
    if (def.thread) buildThread(def.thread);
    prep(def);
    cur = def;
    document.querySelector(".track").style.height = (def.track || 520) + "vh";
    resize();
    stopsP = def.keys.filter(k => k.stop || k.slide).map(k => def.pOfU(k.u));
  }
  let stopsP = [];

  function placeCamera(p, time) {
    const def = cur, u = def.uOfP(p), t = def.idxOfU(u) / (def.keys.length - 1);
    state = { u, b: clamp(def.bOfU(u), 0, 1) };
    def.camC.getPoint(clamp(t, 0, 1), camera.position); const tgt = def.tgtC.getPoint(clamp(t, 0, 1));
    // die Kamera steht nie ganz still: ein ruhiger Atem, an Lesestellen kaum merklich
    const sway = clamp(camera.position.distanceTo(tgt) / 18, .15, 1);
    camera.position.x += (Math.sin(time * .23) * .1 + Math.sin(time * .07) * .07) * sway;
    camera.position.y += Math.sin(time * .19 + 1) * .04 * sway;
    camera.lookAt(tgt);
  }

  // ---------- Fortschritt, Scrollen, Knöpfe ----------
  const bar = document.getElementById("bar"), hint = document.getElementById("hint");
  const links = [...document.querySelectorAll("[data-v]")];
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let target = 0, p = 0, hold = false, variant = null, t0 = performance.now();
  function applyHash(initial) {
    const q = new URLSearchParams((location.hash || "").replace(/^#/, ""));
    const v = VARIANTS[q.get("v")] ? q.get("v") : "a";
    const changed = v !== variant;
    if (changed) { variant = v; load(v); t0 = performance.now(); links.forEach(a => a.setAttribute("aria-current", a.dataset.v === v ? "true" : "false")); }
    const hp = q.get("p");
    if (hp !== null && hp !== "" && isFinite(+hp)) { target = p = clamp(+hp, 0, 1); hold = true; t0 = -1e9; }
    else if (changed) { hold = false; target = p = 0; }
    else return;
    scrollTo(0, target * maxScroll());
  }
  addEventListener("hashchange", () => applyHash(false));
  addEventListener("scroll", () => { if (!hold) target = clamp(scrollY / maxScroll(), 0, 1); }, { passive: true });
  for (const ev of ["wheel", "touchstart", "keydown"]) addEventListener(ev, () => { hold = false; }, { passive: true });
  // Vor/Zurück: normales, weiches Scrollen zur nächsten Lesestelle, kein Einrasten
  function go(dir) {
    hold = false;
    const now = target;
    let to = dir > 0 ? stopsP.find(s => s > now + .004) : [...stopsP].reverse().find(s => s < now - .004);
    if (to === undefined) to = dir > 0 ? 1 : 0;
    scrollTo({ top: to * maxScroll(), behavior: "smooth" });
  }
  document.getElementById("next").addEventListener("click", () => go(1));
  document.getElementById("prev").addEventListener("click", () => go(-1));

  function resize() {
    const w = VW(), h = VH();
    if (FORCE) Object.assign(canvas.style, { width: w + "px", height: h + "px", left: "50%", top: "0", transform: "translateX(-50%)", outline: "1px solid #999" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    camera.fov = aspect < 1 ? 44 : 36;
    camera.updateProjectionMatrix();
    if (cur) buildPath(cur);
  }
  addEventListener("resize", () => { resize(); if (hold) scrollTo(0, target * maxScroll()); });
  applyHash(true);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    p += (target - p) * (1 - Math.exp(-dt * 3.0));
    if (Math.abs(target - p) < 1e-5) p = target;
    const time = now / 1000;
    placeCamera(p, time);
    // Auftakt: beim Laden zeichnet sich das Netz von selbst, unabhängig vom Scrollen
    const intro = (cur.introB || 0) * sm((now - t0) / 1000 / (cur.introT || 2.8));
    const b = Math.max(state.b, intro);
    for (const a of anims) a(b, time);
    for (const n of nets) n.l.material.uniforms.uK.value = win(b, n.t0, n.d);
    for (const pr of prints) {
      if (pr.on < 0) continue;
      const o = sm((b - pr.on) / pr.fade);
      pr.mat.opacity = o; pr.mesh.visible = o > .001;
    }
    updateThread(b);
    if (cur.frame) cur.frame(b, time, camera);
    hint.classList.toggle("off", p > .02);
    document.body.classList.toggle("scrolled", p > .12);
    bar.style.width = (p * 100).toFixed(2) + "%";
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
