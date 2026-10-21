// Stimmen-Kopie von bogen/kern.js (einzige Änderung: readingPose kennt s.face). Original:
// Eröffnung jan-erik-andersen.de, Fassung 2026-11, Bogen + Bastellinien.
// Bühne wie in Raumtext 2: ein Papierbogen als Grundstück, jedes Teil hängt im Faltbaum und klappt aus dem Bogen hoch,
// die Lettern des Namens stehen aus dem Bogen auf und lassen ihren Abdruck zurück, Text ist auf die Flächen gedruckt.
// Ein Fortschritt p (0 … 1) folgt dem Scrollen gedämpft. Über eine Zeitverzerrung entsteht der Bahnparameter u und daraus
// der Baufortschritt b: Phase 1 (b 0 … .2) Bastellinien zeichnen sich, Phase 2 (b .2 … .45) Teile klappen hoch und rasten ein,
// danach die Satzteile an ihren Teilen, zuletzt läuft der rote Punkt vom Statuspunkt zum Anriss „Gerwing“.
// Anker: #v=a|c wählt die Variante, #p=0…1 steuert einen Zustand an, #…&w=390&h=844 zeigt den Handy-Ausschnitt (Prüfhilfe).
import * as THREE from "three";
import { SCHRIFTEN } from "./fonts/schriften.js";
import { Model, kit, paperMaterial, edgeMaterial, rissMaterial, geruestMaterial, gridOn, COL, PI, Q, EPS, clamp, sm, mech } from "./falt.js";

const win = (b, t0, d) => clamp((b - t0) / d, 0, 1);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

function bytes(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
async function loadFonts() {
  await Promise.all([["Newsreader", "Newsreader", "normal"], ["Newsreader Italic", "Newsreader", "italic"], ["Schibsted Grotesk", "Schibsted Grotesk", "normal"]].map(async ([key, fam, style]) => {
    const ff = new FontFace(fam, bytes(SCHRIFTEN[key]), { style });
    await ff.load(); document.fonts.add(ff);
  }));
  // Marke N4: variable Newsreader aus der Seite (@font-face "Newsreader N4"), Gewichte 380 / 340 im Canvas
  await Promise.all(['380 120px "Newsreader N4"', 'italic 340 120px "Newsreader N4"'].map(f => document.fonts.load(f, "Jan-Erik Andersen"))).catch(() => {});
}
// Monotone kubische Interpolation (Fritsch–Carlson)
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

export function start(renderer, VARIANTS) {
  const canvas = renderer.domElement;
  renderer.setClearColor(0xffffff, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 300);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const INK = "#303033", RED = "#d40235", MUTED = "#66666a", IMPRINT = "#e8e4db";

  // ---------- Druck (Canvas-Textur auf der Fläche) ----------
  const PXEM = 120;
  const texOf = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  function printTex(lines, opt = {}) {
    const em = PXEM, lh = (opt.lh || 1.3) * em;
    // opt.font "marke": Wortmarke N4 (Newsreader variabel, aufrecht 380, kursiv 340, Laufweite -0,018 em)
    const mk = opt.font === "marke";
    const fam = mk ? '"Newsreader N4", "Newsreader", serif' : opt.font === "serif" ? '"Newsreader"' : '"Schibsted Grotesk"';
    const font = `${opt.italic ? "italic " : ""}${mk ? (opt.italic ? 340 : 380) : opt.font === "serif" ? 300 : 500} ${em}px ${fam}`;
    if (mk && opt.track === undefined) opt = { ...opt, track: -.018 };
    const cv = document.createElement("canvas"), x = cv.getContext("2d");
    const setF = () => { x.font = font; if (opt.track) x.letterSpacing = (opt.track * em) + "px"; };
    setF();
    const padX = .16 * em, padY = .1 * em;
    // opt.disc: Radius in em; statt Text eine Scheibe, deren Unterkante auf der Grundlinie sitzt (Schlusspunkt der Marke)
    const ws = opt.disc ? [2 * opt.disc * em] : lines.map(l => x.measureText(l).width), wMax = Math.max(...ws);
    cv.width = Math.ceil(wMax + padX * 2);
    cv.height = Math.ceil(padY * 2 + (lines.length - 1) * lh + em * 1.18);
    setF(); x.fillStyle = opt.col || INK; x.textBaseline = "alphabetic";
    // opt.outline: nur die Kontur (Abdruck der Lettern als feine Schnittlinie im Bogen); mit opt.fillCol zuerst eine zarte Füllung
    if (opt.outline) { x.strokeStyle = opt.col || INK; x.lineWidth = opt.outline; x.lineJoin = "round"; }
    const at = i => [padX + (opt.align === "center" ? (wMax - ws[i]) / 2 : 0), padY + em * .94 + i * lh];
    if (opt.disc) {
      const [ax, ay] = at(0), r = opt.disc * em; x.beginPath(); x.arc(ax + r, ay - r, r, 0, 2 * PI);
      if (opt.outline) { if (opt.fillCol) { x.fillStyle = opt.fillCol; x.fill(); } x.stroke(); } else x.fill();
    } else {
      if (opt.outline && opt.fillCol) { x.fillStyle = opt.fillCol; lines.forEach((l, i) => x.fillText(l, ...at(i))); }
      lines.forEach((l, i) => x[opt.outline ? "strokeText" : "fillText"](l, ...at(i)));
    }
    const h = cv.height / em;
    return { tex: texOf(cv), w: cv.width / em, h, padX: padX / em, tw: wMax / em, bfb: h - (padY / em + .94 + (lines.length - 1) * lh / em), rows: ws.map(v => v / em) };
  }
  const prints = [];
  // Druck: Fläche w × h (Welteinheiten), Mitte im Ursprung; on: b, ab dem der Druck steht (-1 = immer)
  function mkPrint(lines, e, on, opt = {}) {
    const t = printTex(lines, opt);
    const mat = new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const w = t.w * e, h = t.h * e;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.renderOrder = 3; mesh.frustumCulled = false; scene.add(mesh);
    const pr = { mesh, mat, on, e, w, h, t, fade: opt.fade || .02, off: opt.off };
    prints.push(pr); return pr;
  }
  function mkDecal(wpx, hpx, draw, w, h, on, fade = .025) {
    const cv = document.createElement("canvas"); cv.width = wpx; cv.height = hpx;
    draw(cv.getContext("2d"), wpx, hpx);
    const mat = new THREE.MeshBasicMaterial({ map: texOf(cv), transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.renderOrder = 2; mesh.frustumCulled = false; scene.add(mesh);
    const pr = { mesh, mat, on, e: 1, w, h, fade };
    prints.push(pr); return pr;
  }

  // ---------- Variante laden ----------
  let F = null, K = null, M = null, meshes = [], anims = [], cur = null, thread = null, sheets = [], bMats = [];
  const rissMat = rissMaterial();
  function clear() {
    for (const o of meshes) { scene.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== rissMat) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } o.traverse && o.traverse(c => { if (c !== o && c.geometry) c.geometry.dispose(); }); }
    for (const p of prints) { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mat.map.dispose(); p.mat.dispose(); }
    meshes = []; prints.length = 0; anims = []; thread = null; sheets = []; bMats = [];
  }
  const add = o => { scene.add(o); meshes.push(o); return o; };

  function load(id) {
    clear();
    F = Model(); K = kit(F);
    const R = F.root;
    Object.assign(K, {
      F, R, THREE, V, COL, PI, Q, EPS, sm, mech, win, clamp, narrow: VW() / VH() < 1,
      anim: fn => anims.push(fn),
      print: mkPrint, decal: mkDecal,
      measure(lines, opt = {}) { const t = printTex(lines, opt); t.tex.dispose(); return t; },
      // Druck auf eine Fläche K.panel: Mitte bei (u entlang des Scharniers, v vom Scharnier weg); side wie bei F.attach
      onPanel(nd, pr, u, v, side = 1, q = null, lift = .002) { F.attach(nd, pr.mesh, nd.uv(u, v), q || nd.n, side, lift); return pr; },
      // Druck flach auf eine waagerechte Fläche (Bogen, Hubplatte), liest sich von vorn (+z)
      onFlat(nd, pr, x, z, lift = .002) { F.attach(nd, pr.mesh, [x, z], [0, -1], 1, lift); return pr; },
      // Lettern: Zeile steht aus dem Bogen auf (Scharnier an der Grundlinie), im Bogen bleibt ihr Abdruck.
      // x: linke Kante der Schrift, zb: Grundlinie im Bogen. Läuft nach der Zeit seit dem Laden (Name sofort lesbar).
      // opt.foot: Grundlinie genau auf dem Scharnier (Fuß der Lettern = Vorderkante des Abdrucks);
      // opt.imprint { fill, col, line }: Abdruck als zarte Schnittkante statt gefüllter Fläche (ohne beides: wie bisher, Variante A)
      word(lines, e, x, zb, t0, d, opt = {}) {
        const io = opt.imprint;
        const pr = mkPrint(lines, e, -1, opt), im = opt.noImprint ? null : mkPrint(lines, e, -1, io ? { ...opt, col: io.col, fillCol: io.fill, outline: io.line } : { ...opt, col: IMPRINT });
        // heller Abdruck: Textur vormultipliert, sonst mischen die transparenten (schwarzen) Randpixel beim Verkleinern dunkle Säume ein
        if (io && im) { im.t.tex.premultiplyAlpha = true; Object.assign(im.mat, { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }); }
        const W = pr.t.tw * e, base = opt.foot ? 0 : .2 * e;
        // io.close: der Abdruck schließt sich nach dem Aufstehen (Sekunden nach Ende der Bewegung), es bleibt der Schlitz an der Fußlinie
        if (io && im && io.close !== undefined) { im.tOff = t0 + d + io.close; im.tDur = io.closeDur || .7; }
        if (io && io.slit) F.line(opt.par || R, [x - .015, zb], [x + W + .015, zb], io.slit, COL.INK, .0009);
        if (opt.fold) { // Falzlinie N4: gestrichelt, über Anfang und Ende hinaus, im Bogen auf der Fußlinie. fold: { x0, len, lw, dash, gap, col } in Welteinheiten
          const f = opt.fold, wpx = 2400, hpx = 24, k = wpx / f.len;
          const fd = mkDecal(wpx, hpx, (c, cw, ch) => { c.strokeStyle = f.col; c.lineWidth = f.lw * k; c.setLineDash([f.dash * k, f.gap * k]); c.beginPath(); c.moveTo(0, ch / 2); c.lineTo(cw, ch / 2); c.stroke(); }, f.len, f.len * hpx / wpx, -1);
          F.attach(opt.par || R, fd.mesh, [x + f.x0 + f.len / 2, zb], [0, -1], 1, .0007);
        }
        const L = K.panel(opt.par || R, [x, zb], [x + W, zb], [0, -1], t0, d, opt.ang || Q, { clock: "t", nocut: 1, nofold: 1, over: .07 });
        const u = (pr.w / 2 - pr.t.padX * e), v = base + (pr.h / 2 - pr.t.bfb * e);
        F.attach(L, pr.mesh, L.uv(u, v), [0, -1], 1, .0015);
        if (im) F.attach(opt.par || R, im.mesh, L.uv(u, v), [0, -1], 1, .0006);
        pr.W = W; pr.node = L;
        return pr;
      },
      // Statuspunkt: rote Scheibe, tickt im festen Takt, kein Schein
      ticker(nd, r, p, q, side, on) {
        const g = new THREE.Group();
        const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
        const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.55, r * 1.75, 40), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
        ring.position.z = .0005; g.add(m, ring); add(g);
        F.attach(nd, g, p, q, side, .004);
        anims.push((b, t) => {
          const k = win(b, on, .02); g.visible = k > 0; m.scale.setScalar(sm(k));
          const ph = (t % 1.4) / 1.4, beat = ph < .12 ? Math.sin(ph / .12 * PI) : 0;
          if (k >= 1) m.scale.setScalar(1 + .18 * beat);
          ring.material.opacity = k >= 1 ? .55 * (1 - ph) * (ph < .7 ? 1 : 0) : 0;
          ring.scale.setScalar(1 + ph * .9);
        });
        return g;
      },
      // Kabel aus Papier, zieht sich von seinem Anfang aus
      cable(pts, r, col, t0, d) {
        const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5);
        const TS = 140, RS = 10, geo = new THREE.TubeGeometry(curve, TS, r, RS, false);
        const mesh = add(new THREE.Mesh(geo, paperMaterial(col)));
        anims.push(b => { const k = sm(win(b, t0, d)); geo.setDrawRange(0, Math.floor(k * TS) * RS * 6); mesh.visible = k > 0; });
        return mesh;
      },
      // Bogen: dünne Papierplatte, Oberseite y = 0, feine Haarkante
      sheet(x0, x1, z0, z1, col = "#faf8f3", from = -1) {
        const g = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .03, z1 - z0), paperMaterial(col));
        g.position.set((x0 + x1) / 2, -.0152, (z0 + z1) / 2);
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(g.geometry), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .32, depthWrite: false }));
        g.add(e); add(g); sheets.push(g);
        // später Bogen (Anriss des nächsten Abschnitts): erscheint erst, wenn die Bahn dorthin führt
        if (from >= 0) anims.push(b => { g.visible = b >= from; });
        return g;
      }
    });
    const def = VARIANTS[id](K);
    M = F.finish();
    const mesh = add(new THREE.Mesh(M.geoT, paperMaterial()));
    const lines = add(new THREE.LineSegments(M.geoL, edgeMaterial()));
    const riss = add(new THREE.LineSegments(M.geoR, rissMat));
    for (const o of [mesh, lines, riss]) o.frustumCulled = false;
    mesh.renderOrder = 0; lines.renderOrder = 1; riss.renderOrder = 1;
    // Konstruktionsphase (nur Varianten mit def.grid bzw. F.geruest): Raster auf dem Bogen und den liegenden Teilen, Gerüst im Raum
    if (def.grid) { gridOn(mesh.material, true, def.grid); bMats.push(mesh.material); for (const g of sheets) { gridOn(g.material, false, def.grid); bMats.push(g.material); } }
    if (M.geoG) { const gm = geruestMaterial(), gl = add(new THREE.LineSegments(M.geoG, gm)); gl.frustumCulled = false; gl.renderOrder = 1; bMats.push(gm); }
    if (def.thread) buildThread(def.thread);
    prep(def);
    cur = def;
    document.querySelector(".track").style.height = (def.track || 700) + "vh";
    resize();
    stopsP = def.keys.filter(k => k.stop || k.slide).map(k => def.pOfU(k.u));
  }
  let stopsP = [];

  // ---------- Roter Faden: Linie am Boden, der Punkt läuft voraus ----------
  function buildThread(def) {
    const curve = new THREE.CatmullRomCurve3(def.pts, false, "centripetal", .5);
    const N = 700, sp = curve.getSpacedPoints(N), hw = .022;
    const pos = new Float32Array((N + 1) * 6), idx = [];
    for (let i = 0; i <= N; i++) {
      const p = sp[i], q = sp[Math.min(N, i + 1)], r = sp[Math.max(0, i - 1)];
      const d = V().subVectors(q, r); const vert = Math.abs(d.y) > .5 * d.length();
      let sd;
      if (vert) sd = V(hw, 0, 0); else { d.y = 0; d.normalize(); sd = V().crossVectors(d, UP).multiplyScalar(hw); }
      pos.set([p.x - sd.x, p.y, p.z - sd.z, p.x + sd.x, p.y, p.z + sd.z], i * 6);
      if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const line = add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })));
    line.renderOrder = 2; line.frustumCulled = false;
    const dot = add(new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, depthTest: false })));
    dot.renderOrder = 6;
    thread = { def, curve, N, line, g, dot, pos: V() };
  }
  function updateThread(b) {
    if (!thread) return;
    const { def } = thread, k = sm(win(b, def.t0, def.t1 - def.t0)), vis = b >= def.t0;
    thread.line.visible = vis && k > 0; thread.dot.visible = vis;
    thread.g.setDrawRange(0, Math.floor(k * thread.N) * 6);
    thread.curve.getPointAt(k, thread.pos);
    thread.dot.position.copy(thread.pos);
    thread.dot.quaternion.copy(camera.quaternion);
    thread.dot.scale.setScalar(Math.max(.05, camera.position.distanceTo(thread.pos) * .0065));
  }

  // ---------- Kamera ----------
  const fq = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const FORCE = fq.get("w") && fq.get("h") ? { w: +fq.get("w"), h: +fq.get("h") } : null;
  const VW = () => FORCE ? FORCE.w : innerWidth, VH = () => FORCE ? Math.min(FORCE.h, innerHeight) : innerHeight;
  let aspect = 1;
  // Endstellung durchrechnen: Mitte, Normale, Leserichtung und Geviert der Drucke jeder Lesestelle
  function frameOf(s) {
    const v = V(), pts = [];
    for (const pr of s.prints) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pts.push(v.set(sx * pr.w / 2, sy * pr.h / 2, 0).applyMatrix4(pr.mesh.matrix).clone());
    const m = s.prints[0].mesh.matrix;
    s.C = pts.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / pts.length);
    s.N = V().setFromMatrixColumn(m, 2).normalize(); s.Y = V().setFromMatrixColumn(m, 1).normalize();
    s.e = s.e0 || Math.max(...s.prints.map(pr => pr.e));
    s.wm = Math.max(...pts.map(p => p.clone().sub(s.C).dot(V().setFromMatrixColumn(m, 0).normalize()))) * 2;
    if (s.b === undefined) s.b = Math.max(...s.prints.map(pr => pr.on)) + .03;
  }
  function prep(def) {
    M.update(1, 1e9);
    for (const s of def.stops) frameOf(s);
    M.update(0, 0);
    let acc = 0; const tot = def.keys.reduce((a, k) => a + k.w, 0);
    for (const k of def.keys) { acc += k.w; k.u = acc / tot; if (k.stop) k.b = k.stop.b; }
    const keyU = def.keys.map(k => k.u);
    def.bOfU = pchip(keyU, def.keys.map(k => k.b));
    def.idxOfU = pchip(keyU, def.keys.map((k, i) => i));
    // Zeitverzerrung: an Lesestellen sinkt die Bahngeschwindigkeit auf rund ein Drittel, nie auf null
    const STOPU = def.keys.filter(k => k.stop && !k.noWarp).map(k => k.u);
    const WARP_MIN = def.warpMin || .34, WARP_W = def.warpW || .028, NW = 3000;
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
  // Lesestellung aus der Textfläche (Vorlage readingPose() in Raumtext 2): Blickrichtung aus Normale bzw. Leserichtung,
  // Gier- und Neigungswinkel, Abstand aus der gewünschten Schriftgröße in Pixeln, Lage des Textes im Ausschnitt (sx, sy in −1 … 1)
  function readingPose(s) {
    const W = VW(), H = VH(), nar = aspect < 1, TAN = Math.tan(camera.fov * PI / 360);
    let px = nar ? s.pxN : s.px;
    if (typeof px === "function") px = px(W, H, s);
    if (px === undefined) px = nar ? 16 : clamp(20.5 + (H - 900) / 540 * 2.5, 19.5, 23);
    const fit = nar ? s.fitN : s.fit;
    if (fit) px = Math.min(px, fit * W / (s.wm / s.e));
    const depth = s.e * H / (2 * TAN * px);
    const yaw = (nar && s.nyaw !== undefined ? s.nyaw : s.yaw || 0) * PI / 180, pitch = (nar && s.npitch !== undefined ? s.npitch : s.pitch) * PI / 180;
    // sx/sy dürfen auch Funktionen (W, H) sein (Bildaufteilung je Seitenverhältnis)
    const fv = v => typeof v === "function" ? v(W, H) : v || 0;
    const sx = nar ? fv(s.nsx) : fv(s.sx), sy = nar ? fv(s.nsy) : fv(s.sy);
    // s.face: waagerechte Blickrichtung vorgeben (Zickzack aus Flächen mit wechselnder Normale: Kamera blickt entlang der Mittelachse)
    const h = s.face ? s.face.clone() : Math.abs(s.N.y) > .7 ? s.Y.clone() : s.N.clone().negate(); h.y = 0; h.normalize();
    const c = Math.cos(yaw), sn = Math.sin(yaw); h.set(h.x * c + h.z * sn, 0, -h.x * sn + h.z * c);
    const Fw = h.clone().multiplyScalar(Math.cos(pitch)).add(V(0, -Math.sin(pitch), 0)).normalize();
    const Rt = V().crossVectors(Fw, UP).normalize(), U = V().crossVectors(Rt, Fw);
    const D = Fw.clone().addScaledVector(Rt, sx * TAN * aspect).addScaledVector(U, sy * TAN).normalize();
    const P = s.C.clone().addScaledVector(D, -depth / D.dot(Fw));
    return { cam: P, tgt: P.clone().addScaledVector(Fw, depth), px };
  }
  function buildPath(def) {
    const k = aspect < 1.25 ? Math.pow(1.25 / aspect, .55) : 1, nar = aspect < 1;
    const cams = [], tgts = [];
    for (const key of def.keys) {
      if (key.stop) { const ps = readingPose(key.stop); key.stop.pose = ps; cams.push(ps.cam); tgts.push(ps.tgt); continue; }
      if (nar && key.camN) { cams.push(key.camN.clone()); tgts.push(key.tgtN.clone()); continue; }
      const off = key.cam.clone().sub(key.tgt);
      cams.push(key.tgt.clone().addScaledVector(off, k)); tgts.push(key.tgt.clone());
    }
    def.camC = new THREE.CatmullRomCurve3(cams, false, "centripetal");
    def.tgtC = new THREE.CatmullRomCurve3(tgts, false, "centripetal");
  }
  let state = { u: 0, b: 0 };
  function placeCamera(p, time) {
    const def = cur, u = def.uOfP(p), t = def.idxOfU(u) / (def.keys.length - 1);
    state = { u, b: clamp(def.bOfU(u), 0, 1) };
    def.camC.getPoint(clamp(t, 0, 1), camera.position); const tgt = def.tgtC.getPoint(clamp(t, 0, 1));
    // die Kamera steht nie ganz still: ein ruhiger Atem, an Lesestellen kaum merklich
    const sway = clamp(camera.position.distanceTo(tgt) / 20, .1, .8);
    camera.position.x += (Math.sin(time * .23) * .08 + Math.sin(time * .07) * .05) * sway;
    camera.position.y += Math.sin(time * .19 + 1) * .03 * sway;
    camera.lookAt(tgt);
  }

  // ---------- Fortschritt, Scrollen, Knöpfe ----------
  const bar = document.getElementById("bar"), hint = document.getElementById("hint");
  const links = [...document.querySelectorAll("[data-v]")];
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let target = 0, p = 0, hold = false, variant = null, t0 = performance.now();
  function applyHash() {
    const q = new URLSearchParams((location.hash || "").replace(/^#/, ""));
    const v = VARIANTS[q.get("v")] ? q.get("v") : "a";
    const changed = v !== variant;
    if (changed) { variant = v; load(v); t0 = performance.now(); links.forEach(a => a.setAttribute("aria-current", a.dataset.v === v ? "true" : "false")); }
    const hp = q.get("p");
    if (hp !== null && hp !== "" && isFinite(+hp)) { target = p = clamp(+hp, 0, 1); hold = true; if (+hp > 0) t0 = -1e9; }
    else if (changed) { hold = false; target = p = 0; }
    else return;
    scrollTo(0, target * maxScroll());
  }
  addEventListener("hashchange", applyHash);
  addEventListener("scroll", () => { if (!hold) target = clamp(scrollY / maxScroll(), 0, 1); }, { passive: true });
  for (const ev of ["wheel", "touchstart", "keydown"]) addEventListener(ev, () => { hold = false; }, { passive: true });
  // Vor/Zurück: weiches Scrollen zur nächsten Lesestelle, kein Einrasten
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
    // Sichtfeld je Variante (def.fov / def.fovN), sonst 36° Breitbild, 44° hochkant
    camera.fov = aspect < 1 ? (cur && cur.fovN || 44) : (cur && cur.fov || 36);
    camera.updateProjectionMatrix();
    if (cur) buildPath(cur);
  }
  let narrowNow = VW() / VH() < 1;
  addEventListener("resize", () => {
    const n = VW() / VH() < 1;
    if (n !== narrowNow) { narrowNow = n; load(variant); } else resize();
    if (hold) scrollTo(0, target * maxScroll());
  });
  applyHash();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    p += (target - p) * (1 - Math.exp(-dt * 3.0));
    if (Math.abs(target - p) < 1e-5) p = target;
    const time = now / 1000, tl = (now - t0) / 1000;
    placeCamera(p, time);
    const b = state.b;
    M.update(b, tl);
    rissMat.uniforms.uB.value = b;
    for (const m of bMats) { if (m.uniforms.uGB) m.uniforms.uGB.value = b; else m.uniforms.uB.value = b; }
    for (const a of anims) a(b, time);
    for (const pr of prints) {
      if (pr.on < 0 && pr.off === undefined && pr.tOff === undefined) continue;
      let o = (pr.on < 0 ? 1 : sm((b - pr.on) / pr.fade)) * (pr.off === undefined ? 1 : 1 - sm((b - pr.off) / .03));
      if (pr.tOff !== undefined) o *= 1 - sm((tl - pr.tOff) / pr.tDur);
      pr.mat.opacity = o; pr.mesh.visible = o > .001;
    }
    updateThread(b);
    hint.classList.toggle("off", p > .02);
    document.body.classList.toggle("scrolled", p > .12);
    bar.style.width = (p * 100).toFixed(2) + "%";
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Prüfhilfe (nur Entwurf)
  window.__bogen = { dbg: () => ({ M, cur, readingPose, aspect, camera }), setP: v => { target = p = v; hold = true; }, state: () => state, poses: () => cur.stops.map(s => s.pose && { px: s.pose.px, cam: s.pose.cam.toArray().map(v => +v.toFixed(2)) }), p: () => p };
}
