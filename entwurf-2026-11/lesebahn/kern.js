// Durchgehende Startseite jan-erik-andersen.de, Fassung 2026-11 (entwurf-2026-11/seite/). Gemeinsamer Kern für alle Szenen.
// Grundlage: entwurf-2026-11/bogen/kern.js. Jede Szene ist ein Modul im bisherigen Format (default (K) => { keys, stops, track, … }),
// sie wird als Gruppe in eine gemeinsame Welt gestellt: Szenen liegen hintereinander in −z, jede frühere Szene liegt hinter allen
// Kamerastellungen der späteren (rechnerisch eingepasst, siehe layout()). Eine gemeinsame Kamerabahn läuft durch alle Szenen:
// in der Szene ihre eigene Bahn (Zeitverzerrung, Lesestellungen aus readingPose()), zwischen zwei Szenen eine stetige Fahrt
// (kubische Hermite-Kurve mit den Geschwindigkeiten an beiden Enden, also ohne Sprung und ohne Knick im Tempo).
// Ein roter Faden mit Punkt läuft von der Eröffnung durch alle Szenen bis zum Kontakt-Umschlag.
//
// Zusammengeführt aus den Kern-Kopien der Szenen (Herkunft in Klammern):
// - K.add, K.paperMaterial, K.edgeMaterial, K.camera (abschluss, betreuung, modernisierung, schnittstellen)
// - K.link: klickbare Drucke per Raycast (abschluss)
// - K.word: opt.clock "b" (Lettern stehen beim Scrollen auf), opt.on, opt.over, Abdruck schließt nach b (abschluss io.closeB,
//   schnittstellen io.close), ohne close bleibt er (betreuung, modernisierung)
// - pr.sched(b): freie Deckkraft nach b (modernisierung)
// - Lesestellen am Zustand s.fb (modernisierung), s.face: vorgegebene Blickrichtung (stimmen)
// - Schlüssel mit slow: 1 bremsen wie Lesestellen (abschluss)
// - Faden mit lin: gleichmäßiger Lauf (werdegang)
// - Text blendet aus, solange sein Träger angeschnitten ist: ganz im Bild (oben ab 64 px, unten bis H − 70 px) oder ganz draußen (schnittstellen)
// - Vorgabeszene „erste Variante“ (betreuung, gerwing, shop, werdegang) entfällt: die Seite hat keine Varianten mehr.
// Lesebahn (entwurf-2026-11/lesebahn/): drei Ergänzungen gegenüber seite/ – Schlüssel mit fromStop und shift (Anfahrt/Auslauf mit Versatz),
// def.smooth (Kamerabahn aus monotonen kubischen Kurven über der Sehnenlänge statt Catmull-Rom über dem Schlüsselindex: Tempo stetig, keine
// Sprünge an den Schlüsseln) und def.thread.map (Fortschritt des eigenen Fadens als Funktion von b: der Punkt hält an Lesestellen).
// Zustände: #p=0…1 (ganze Seite), #s=<szene> (Szenenanfang), Handy-Ausschnitt #…&w=390&h=844 (Prüfhilfe).
import * as THREE from "three";
import { SCHRIFTEN } from "./fonts/schriften.js";
import { bahn as makeBahn, FORMEN, wrap as wrapText, PITCH as BPITCH } from "./bahn.js";
import { Model, kit, useFar, dunst, FAR, paperMaterial, edgeMaterial, rissMaterial, geruestMaterial, gridOn, frameOn, COL, PI, Q, EPS, clamp, sm, mech } from "./falt.js";

const win = (b, t0, d) => clamp((b - t0) / d, 0, 1);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

function bytes(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
export async function loadFonts() {
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
  if (n === 1) return () => ys[0];
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
// kubische Hermite-Kurve: Punkte p0, p1, Tangenten m0, m1 (je Einheit s), s 0 … 1
function hermite(p0, m0, p1, m1, s, out) {
  const s2 = s * s, s3 = s2 * s, h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  return out.set(0, 0, 0).addScaledVector(p0, h00).addScaledVector(m0, h10).addScaledVector(p1, h01).addScaledVector(m1, h11);
}

export function seite(renderer, SEQ, opt = {}) {
  const canvas = renderer.domElement;
  renderer.setClearColor(0xffffff, 1);
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 300);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const INK = "#303033", RED = "#d40235", IMPRINT = "#e8e4db";
  // Abstand zwischen zwei Szenen (Welteinheiten) zusätzlich zur Kameraeinpassung
  const GAP = opt.gap || 3;

  // ---------- Druck (Canvas-Textur auf der Fläche) ----------
  const PXEM = 120;
  const texOf = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  function printTex(lines, o = {}) {
    const em = PXEM, lh = (o.lh || 1.3) * em;
    // o.font "marke": Wortmarke N4 (Newsreader variabel, aufrecht 380, kursiv 340, Laufweite -0,018 em)
    const mk = o.font === "marke";
    const fam = mk ? '"Newsreader N4", "Newsreader", serif' : o.font === "serif" ? '"Newsreader"' : '"Schibsted Grotesk"';
    const font = `${o.italic ? "italic " : ""}${mk ? (o.italic ? 340 : 380) : o.font === "serif" ? 300 : 500} ${em}px ${fam}`;
    if (mk && o.track === undefined) o = { ...o, track: -.018 };
    const cv = document.createElement("canvas"), x = cv.getContext("2d");
    const setF = () => { x.font = font; if (o.track) x.letterSpacing = (o.track * em) + "px"; };
    setF();
    const padX = .16 * em, padY = .1 * em;
    // o.disc: Radius in em; statt Text eine Scheibe, deren Unterkante auf der Grundlinie sitzt (Schlusspunkt der Marke)
    const ws = o.disc ? [2 * o.disc * em] : lines.map(l => x.measureText(l).width), wMax = Math.max(...ws);
    cv.width = Math.ceil(wMax + padX * 2);
    cv.height = Math.ceil(padY * 2 + (lines.length - 1) * lh + em * 1.18);
    setF(); x.fillStyle = o.col || INK; x.textBaseline = "alphabetic";
    // o.outline: nur die Kontur (Abdruck der Lettern als feine Schnittlinie im Bogen); mit o.fillCol zuerst eine zarte Füllung
    if (o.outline) { x.strokeStyle = o.col || INK; x.lineWidth = o.outline; x.lineJoin = "round"; }
    const at = i => [padX + (o.align === "center" ? (wMax - ws[i]) / 2 : 0), padY + em * .94 + i * lh];
    if (o.disc) {
      const [ax, ay] = at(0), r = o.disc * em; x.beginPath(); x.arc(ax + r, ay - r, r, 0, 2 * PI);
      if (o.outline) { if (o.fillCol) { x.fillStyle = o.fillCol; x.fill(); } x.stroke(); } else x.fill();
    } else {
      if (o.outline && o.fillCol) { x.fillStyle = o.fillCol; lines.forEach((l, i) => x.fillText(l, ...at(i))); }
      lines.forEach((l, i) => x[o.outline ? "strokeText" : "fillText"](l, ...at(i)));
    }
    const h = cv.height / em;
    return { tex: texOf(cv), w: cv.width / em, h, lh: lh / em, padX: padX / em, tw: wMax / em, bfb: h - (padY / em + .94 + (lines.length - 1) * lh / em), rows: ws.map(v => v / em), lines };
  }

  // ---------- Ansicht ----------
  const hashQ = () => new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const fq = hashQ();
  const FORCE = fq.get("w") && fq.get("h") ? { w: +fq.get("w"), h: +fq.get("h") } : null;
  const VW = () => FORCE ? FORCE.w : innerWidth, VH = () => FORCE ? Math.min(FORCE.h, innerHeight) : innerHeight;
  let aspect = VW() / VH(), narrow = aspect < 1;
  const fovOf = I => narrow ? (I.def.fovN || 44) : (I.def.fov || 36);

  // ---------- Szenen ----------
  const links3 = [];
  let INST = [], SEGS = [], ANCH = [], TOTAL = 1, thread = null;

  function newInstance(cfg, idx) {
    return { cfg, idx, name: cfg.name, built: false, O: V(), tStart: undefined, parked: false, lastKey: "" };
  }

  // Eine Szene bauen: Modul ausführen, Faltmodell abschließen, Drucke und Netze in die Gruppe der Szene hängen
  function build(I) {
    const cfg = I.cfg;
    I.far = FAR.clone(); useFar(I.far);
    const group = new THREE.Group(); scene.add(group);
    const prints = [], anims = [], sheets = [], sheetBox = [], bMats = [], mats = [];
    const rissMat = rissMaterial();
    const add = o => { group.add(o); return o; };
    function mkPrint(lines, e, on, o = {}) {
      const t = printTex(lines, o);
      const mat = dunst(new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      const w = t.w * e, h = t.h * e;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.renderOrder = 3; mesh.frustumCulled = false; group.add(mesh);
      const pr = { mesh, mat, on, e, w, h, t, fade: o.fade || .02, off: o.off, I };
      prints.push(pr); return pr;
    }
    function mkDecal(wpx, hpx, draw, w, h, on, fade = .025) {
      const cv = document.createElement("canvas"); cv.width = wpx; cv.height = hpx;
      draw(cv.getContext("2d"), wpx, hpx);
      const mat = dunst(new THREE.MeshBasicMaterial({ map: texOf(cv), transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.renderOrder = 2; mesh.frustumCulled = false; group.add(mesh);
      const pr = { mesh, mat, on, e: 1, w, h, fade, I };
      prints.push(pr); return pr;
    }
    const F = Model(), K = kit(F), R = F.root;
    Object.assign(K, {
      F, R, THREE, V, COL, PI, Q, EPS, sm, mech, win, clamp, narrow, vw: VW(), vh: VH(),
      bahn: o => makeBahn(K, o), PITCH: BPITCH, formen: FORMEN, wrap: (text, maxEm) => wrapText(K, text, maxEm),
      anim: fn => anims.push(fn), add, paperMaterial, edgeMaterial, camera,
      print: mkPrint, decal: mkDecal,
      // Klickbarer Druck (Raycast auf die Fläche des Drucks): Kontaktwege bleiben echte Links, zusätzlich als HTML-Links im Dokument
      link(pr, href) { links3.push({ pr, href, I }); return pr; },
      measure(lines, o = {}) { const t = printTex(lines, o); t.tex.dispose(); return t; },
      // Druck auf eine Fläche K.panel: Mitte bei (u entlang des Scharniers, v vom Scharnier weg); side wie bei F.attach
      onPanel(nd, pr, u, v, side = 1, q = null, lift = .002) { F.attach(nd, pr.mesh, nd.uv(u, v), q || nd.n, side, lift); return pr; },
      // Druck flach auf eine waagerechte Fläche (Bogen, Hubplatte), liest sich von vorn (+z)
      onFlat(nd, pr, x, z, lift = .002) { F.attach(nd, pr.mesh, [x, z], [0, -1], 1, lift); return pr; },
      // Lettern: Zeile steht aus dem Bogen auf (Scharnier an der Grundlinie), im Bogen bleibt ihr Abdruck.
      // x: linke Kante der Schrift, zb: Grundlinie im Bogen. opt.clock "t" (Vorgabe): nach der Zeit seit dem Eintreffen der Szene,
      // "b": beim Scrollen (t0, d in b). opt.on blendet die Lettern erst ab b ein. opt.foot: Grundlinie genau auf dem Scharnier;
      // opt.imprint { fill, col, line, close, closeDur, closeB, slit }: Abdruck als zarte Schnittkante; er schließt sich
      // bei clock "t" nach io.close Sekunden, bei clock "b" um io.closeB (abschluss) bzw. .012 (schnittstellen, io.close gesetzt) nach dem Aufstehen,
      // ohne close bleibt er stehen (betreuung, modernisierung)
      word(lines, e, x, zb, t0, d, o = {}) {
        const io = o.imprint, ck = o.clock || "t", on0 = o.on !== undefined ? o.on : -1;
        const pr = mkPrint(lines, e, on0, o), im = o.noImprint ? null : mkPrint(lines, e, on0, io ? { ...o, col: io.col, fillCol: io.fill, outline: io.line } : { ...o, col: IMPRINT });
        // heller Abdruck: Textur vormultipliert, sonst mischen die transparenten (schwarzen) Randpixel beim Verkleinern dunkle Säume ein
        if (io && im) { im.t.tex.premultiplyAlpha = true; Object.assign(im.mat, { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }); }
        const W = pr.t.tw * e, base = o.foot ? 0 : .2 * e;
        if (io && im) {
          if (ck === "t") { if (io.close !== undefined) { im.tOff = t0 + d + io.close; im.tDur = io.closeDur || .7; } }
          else if (io.closeB !== undefined) im.off = t0 + d + io.closeB;
          else if (io.close !== undefined) im.off = t0 + d + .012;
        }
        if (io && io.slit) F.line(o.par || R, [x - .015, zb], [x + W + .015, zb], io.slit, COL.INK, .0009);
        if (o.fold) { // Falzlinie N4: gestrichelt, über Anfang und Ende hinaus, im Bogen auf der Fußlinie. fold: { x0, len, lw, dash, gap, col } in Welteinheiten
          const f = o.fold, wpx = 2400, hpx = 24, k = wpx / f.len;
          const fd = mkDecal(wpx, hpx, (c, cw, ch) => { c.strokeStyle = f.col; c.lineWidth = f.lw * k; c.setLineDash([f.dash * k, f.gap * k]); c.beginPath(); c.moveTo(0, ch / 2); c.lineTo(cw, ch / 2); c.stroke(); }, f.len, f.len * hpx / wpx, -1);
          F.attach(o.par || R, fd.mesh, [x + f.x0 + f.len / 2, zb], [0, -1], 1, .0007);
          if (o.hold) fd.hold = true;
        }
        const L = K.panel(o.par || R, [x, zb], [x + W, zb], [0, -1], t0, d, o.ang || Q, { clock: ck, nocut: 1, nofold: 1, over: o.over !== undefined ? o.over : .07 });
        const u = (pr.w / 2 - pr.t.padX * e), v = base + (pr.h / 2 - pr.t.bfb * e);
        F.attach(L, pr.mesh, L.uv(u, v), [0, -1], 1, .0015);
        if (im) F.attach(o.par || R, im.mesh, L.uv(u, v), [0, -1], 1, .0006);
        pr.W = W; pr.node = L;
        // o.hold: Teil des Startbilds, das erst erscheint, wenn das HTML-Vorbild abgelöst wird (siehe release() unten)
        if (o.hold) { pr.hold = true; if (im) im.hold = true; }
        return pr;
      },
      // Statuspunkt: rote Scheibe, tickt im festen Takt, kein Schein
      ticker(nd, r, p, q, side, on) {
        const g = new THREE.Group();
        const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), dunst(new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), 1));
        const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.55, r * 1.75, 40), dunst(new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0, toneMapped: false, depthWrite: false })));
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
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(g.geometry), dunst(new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .32, depthWrite: false })));
        g.add(e); add(g); sheets.push(g); sheetBox.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]);
        if (from >= 0) anims.push(b => { g.visible = b >= from; });
        return g;
      }
    });
    const def = cfg.mod(K, cfg.modOpt);
    const M = F.finish();
    const mesh = add(new THREE.Mesh(M.geoT, paperMaterial()));
    const lines = add(new THREE.LineSegments(M.geoL, edgeMaterial()));
    const riss = add(new THREE.LineSegments(M.geoR, rissMat));
    for (const o of [mesh, lines, riss]) o.frustumCulled = false;
    mesh.renderOrder = 0; lines.renderOrder = 1; riss.renderOrder = 1;
    // Konstruktionsphase: Raster auf dem Bogen und den liegenden Teilen (def.grid bzw. cfg.grid), Gerüst im Raum (F.geruest)
    const grid = cfg.grid !== undefined ? cfg.grid : def.grid;
    if (grid) { gridOn(mesh.material, true, grid); bMats.push(mesh.material); for (const g of sheets) { gridOn(g.material, false, grid); bMats.push(g.material); } }
    if (M.geoG) { const gm = geruestMaterial(), gl = add(new THREE.LineSegments(M.geoG, gm)); gl.frustumCulled = false; gl.renderOrder = 1; bMats.push(gm); }
    bMats.push(rissMat);
    // Schlüssel: Ausschnitt aus der Bahn der Szene (cfg.keys), erster Schlüssel ohne Vorlauf (sonst stünde die Kamera am Szenenanfang still)
    def.allKeys = def.keys;
    let keys = (cfg.keys ? cfg.keys(def) : def.keys).map((k, i) => i === 0 ? { ...k, w: 0 } : k);
    // cfg.lead / cfg.tail: beginnt bzw. endet die Szene mit einer Lesestelle, kommt die Kamera aus etwas weiterem Abstand an bzw.
    // zieht sich danach langsam zurück; so liegt die Lesestelle ganz in der Szene und nicht direkt an der Fahrt zur Nachbarszene
    if (cfg.lead && keys[0].stop) keys = [{ w: 0, b: keys[0].stop.b, fromStop: keys[0].stop, back: 1.25, up: .4, shift: cfg.leadShift ? V(...cfg.leadShift) : undefined }, { ...keys[0], w: cfg.leadW || .35 }, ...keys.slice(1)];
    const lk = keys[keys.length - 1];
    if (cfg.tail && lk.stop) keys = [...keys, { w: .35, b: lk.stop.b, fromStop: lk.stop, back: 1.2, up: .3 }];
    def.keys = keys;
    Object.assign(I, { group, prints, anims, sheets, sheetBox, bMats, rissMat, F, K, M, def, built: true });
    prep(I);
    I.b0 = clamp(def.bOfU(0), 0, 1);
    I.bLast = clamp(def.bOfU(1), 0, 1);
    I.bMax = cfg.bMax !== undefined ? cfg.bMax : 1;
    // Ausschnitt: Szenen, die nur einen Teil eines Bogens zeigen (abschluss), oder deren Bogen weit nach hinten reicht (stimmen)
    I.clip = cfg.clip || null;
    layout(I);
    group.position.copy(I.O); group.updateMatrixWorld(true);
    const planes = I.clip ? [
      new THREE.Plane(V(1, 0, 0), -(I.clip[0] + I.O.x)), new THREE.Plane(V(-1, 0, 0), I.clip[1] + I.O.x),
      new THREE.Plane(V(0, 0, 1), -(I.clip[2] + I.O.z)), new THREE.Plane(V(0, 0, -1), I.clip[3] + I.O.z)] : null;
    group.traverse(o => {
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) { if (!frameOn(m, I.O, I.clip) && planes) m.clippingPlanes = planes; }
    });
    buildThreadFor(I);
    I.boxes = partBoxes(I);
    if (I.idx) I.apex = clearance(I);
    I.M.update(I.b0, 0); I.curB = I.b0; I.curT = 0;
    group.visible = false;
    useFar(null);
    return I;
  }

  // ---------- Bahn je Szene ----------
  // Endstellung durchrechnen: Mitte, Normale, Leserichtung und Geviert der Drucke jeder Lesestelle (Szenenkoordinaten)
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
  function prep(I) {
    const def = I.def;
    // Lesestelle am Zustand s.fb (Vorgabe: fertiges Modell, b = 1); Teile, die später wieder zuklappen, brauchen ein früheres fb
    for (const s of def.stops) { I.M.update(s.fb !== undefined ? s.fb : 1, 1e9); frameOf(s); }
    for (const k of def.keys) if (k.fromStop && !def.stops.includes(k.fromStop)) { I.M.update(1, 1e9); frameOf(k.fromStop); }
    I.M.update(0, 0);
    let acc = 0; const tot = def.keys.reduce((a, k) => a + k.w, 0) || 1;
    for (const k of def.keys) { acc += k.w; k.u = acc / tot; if (k.stop) k.b = k.stop.b; }
    const keyU = def.keys.map(k => k.u);
    def.bOfU = pchip(keyU, def.keys.map(k => k.b));
    def.idxOfU = pchip(keyU, def.keys.map((k, i) => i));
    // Zeitverzerrung: an Lesestellen (und Schlüsseln mit slow) sinkt die Bahngeschwindigkeit auf rund ein Drittel, nie auf null.
    // Seite: auch Anfang und Ende jeder Szene sind langsam (dort schließt die Fahrt zur Nachbarszene an, sie beginnt und endet ruhig)
    const STOPU = def.keys.filter((k, i) => ((k.stop || k.slow) && !k.noWarp) || i === 0 || i === def.keys.length - 1).map(k => k.u);
    const WARP_MIN = def.warpMin || .34, WARP_W = def.warpW || .028, NW = 3000;
    const warpP = new Float64Array(NW + 1);
    const bump = u => STOPU.length ? Math.max(...STOPU.map(s => Math.exp(-(((u - s) / WARP_W) ** 2)))) : 0;
    const sp = u => 1 - (1 - WARP_MIN) * bump(u);
    // Anteil Fahrt (0 an einer Lesestelle, 1 auf freier Strecke): dämpft den Atem der Kamera an Lesestellen
    def.travel = u => clamp((sp(clamp(u, 0, 1)) - WARP_MIN) / (1 - WARP_MIN), 0, 1);
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
  // Lesestellung aus der Textfläche (Vorlage readingPose() in Raumtext 2): Blickrichtung aus Normale bzw. Leserichtung (oder s.face),
  // Gier- und Neigungswinkel, Abstand aus der gewünschten Schriftgröße in Pixeln, Lage des Textes im Ausschnitt (sx, sy in −1 … 1)
  function readingPose(I, s) {
    const W = VW(), H = VH(), nar = aspect < 1, TAN = Math.tan(fovOf(I) * PI / 360);
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
    // s.face (stimmen): waagerechte Blickrichtung vorgeben (Zickzack aus Flächen mit wechselnder Normale)
    const h = s.face ? s.face.clone() : Math.abs(s.N.y) > .7 ? s.Y.clone() : s.N.clone().negate(); h.y = 0; h.normalize();
    const c = Math.cos(yaw), sn = Math.sin(yaw); h.set(h.x * c + h.z * sn, 0, -h.x * sn + h.z * c);
    const Fw = h.clone().multiplyScalar(Math.cos(pitch)).add(V(0, -Math.sin(pitch), 0)).normalize();
    const Rt = V().crossVectors(Fw, UP).normalize(), U = V().crossVectors(Rt, Fw);
    // s.keep (Lesebahn): Punkte (Szenenkoordinaten, z. B. der Haltepunkt des Fadens), die mit der Schrift ins Bild müssen; der Ausschnitt
    // wird um das Nötige verschoben (nur Bildlage sx/sy, Abstand und Neigung bleiben). Rand wie beim Text: oben 64 px, unten 70 px, seitlich 24 px.
    const pose = (px2, py2) => {
      const D = Fw.clone().addScaledVector(Rt, px2 * TAN * aspect).addScaledVector(U, py2 * TAN).normalize();
      return s.C.clone().addScaledVector(D, -depth / D.dot(Fw));
    };
    let ax = sx, ay = sy, P = pose(ax, ay);
    if (s.keep) {
      for (let it = 0; it < 4; it++) {
        let dx = 0, dy = 0;
        for (const k of s.keep) {
          const q = k.clone().sub(P), zz = q.dot(Fw); if (zz < .1) continue;
          const nx = q.dot(Rt) / (zz * TAN * aspect), ny = q.dot(U) / (zz * TAN);
          const lo = -1 + 2 * (70 + 12) / H, hi = 1 - 2 * (64 + 12) / H, le = -1 + 2 * 24 / W, ri = 1 - 2 * 24 / W;
          if (ny < lo) dy = Math.max(dy, lo - ny); else if (ny > hi) dy = Math.min(dy, hi - ny);
          if (nx < le) dx = Math.max(dx, le - nx); else if (nx > ri) dx = Math.min(dx, ri - nx);
        }
        if (!dx && !dy) break;
        ax += dx; ay += dy; P = pose(ax, ay);
      }
    }
    return { cam: P, tgt: P.clone().addScaledVector(Fw, depth), px };
  }
  function buildPath(I) {
    const def = I.def, k = aspect < 1.25 ? Math.pow(1.25 / aspect, .55) : 1, nar = aspect < 1;
    const cams = [], tgts = [];
    for (const key of def.keys) {
      if (key.stop) { const ps = readingPose(I, key.stop); key.stop.pose = ps; cams.push(ps.cam); tgts.push(ps.tgt); continue; }
      // Anfahrt auf eine Lesestelle der Szene (Ausschnitte): Lesestellung, um back weiter weg und um up höher
      if (key.fromStop) { const ps = readingPose(I, key.fromStop), off = ps.cam.clone().sub(ps.tgt); const sh = key.shift || V(); cams.push(ps.tgt.clone().addScaledVector(off, key.back || 1.5).add(V(0, key.up || 0, 0)).add(sh)); tgts.push(ps.tgt.clone().add(sh)); continue; }
      if (nar && key.camN) { cams.push(key.camN.clone()); tgts.push(key.tgtN.clone()); continue; }
      const off = key.cam.clone().sub(key.tgt);
      cams.push(key.tgt.clone().addScaledVector(off, k)); tgts.push(key.tgt.clone());
    }
    if (cams.length === 1) { cams.push(cams[0].clone()); tgts.push(tgts[0].clone()); }
    I.camC = new THREE.CatmullRomCurve3(cams, false, "centripetal");
    I.tgtC = new THREE.CatmullRomCurve3(tgts, false, "centripetal");
    I.nK = def.keys.length;
    // def.smooth: je Koordinate eine monotone kubische Kurve über der Sehnenlänge (Kamera + Ziel); der Schlüsselindex wird über dieselbe
    // Länge abgebildet. Tempo und Richtung sind stetig (C1), die Geschwindigkeit hängt nur an der Entfernung zwischen den Schlüsseln.
    I.sm = null;
    if (def.smooth) {
      const xi = [0]; for (let i = 1; i < cams.length; i++) xi.push(xi[i - 1] + Math.max(1e-3, cams[i].distanceTo(cams[i - 1]) + tgts[i].distanceTo(tgts[i - 1])));
      const ax = k => pchip(xi, cams.map(c => c[k])), at = k => pchip(xi, tgts.map(c => c[k]));
      I.sm = { idx: pchip(cams.map((c, i) => i), xi), cx: ax("x"), cy: ax("y"), cz: ax("z"), tx: at("x"), ty: at("y"), tz: at("z") };
    }
  }
  // Kamera in der Szene, q = Anteil des Szenenabschnitts (0 … 1), Szenenkoordinaten
  function localPose(I, q, cam, tgt) {
    const def = I.def, u = def.uOfP(clamp(q, 0, 1)), t = I.nK > 1 ? clamp(def.idxOfU(u) / (I.nK - 1), 0, 1) : 0;
    if (I.sm) { const x = I.sm.idx(def.idxOfU(u)); cam.set(I.sm.cx(x), I.sm.cy(x), I.sm.cz(x)); tgt.set(I.sm.tx(x), I.sm.ty(x), I.sm.tz(x)); }
    else { I.camC.getPoint(t, cam); I.tgtC.getPoint(t, tgt); }
    return { u, b: clamp(def.bOfU(u), 0, 1) };
  }

  // ---------- Lage der Szenen in der Welt ----------
  // Szene B steht ganz hinter (in −z) der Szene A davor: jede Kamerastellung von B liegt vor dem hintersten Punkt von A (minus GAP),
  // dazu liegt B selbst ganz hinter A. Waagerecht: B wird so gelegt, dass ihre erste Kamerastellung auf der Höhe der letzten von A liegt
  // (die Fahrt zwischen den Szenen geht geradeaus nach hinten).
  function extentOf(I) {
    const box = new THREE.Box3();
    const cl = (x0, x1, z0, z1) => I.clip ? [Math.max(x0, I.clip[0]), Math.min(x1, I.clip[1]), Math.max(z0, I.clip[2]), Math.min(z1, I.clip[3])] : [x0, x1, z0, z1];
    for (const s of I.sheetBox) { const [x0, x1, z0, z1] = cl(...s); if (x1 > x0 && z1 > z0) { box.expandByPoint(V(x0, 0, z0)); box.expandByPoint(V(x1, 0, z1)); } }
    for (const bb of [I.b0, I.bMax, 1]) {
      I.M.update(bb, 1e9);
      const v = V(), { posT, nT } = I.M.dbg;
      for (let j = 0; j < nT.length; j++) {
        v.set(posT[j * 3], posT[j * 3 + 1], posT[j * 3 + 2]);
        if (I.clip && (v.x < I.clip[0] || v.x > I.clip[1] || v.z < I.clip[2] || v.z > I.clip[3])) continue;
        box.expandByPoint(v);
      }
    }
    I.M.update(I.b0, 0);
    return box;
  }
  function camExtent(I) {
    const c = V(), t = V(); let zmax = -1e9, xmin = 1e9, xmax = -1e9;
    for (let i = 0; i <= 400; i++) { localPose(I, i / 400, c, t); zmax = Math.max(zmax, c.z); xmin = Math.min(xmin, c.x); xmax = Math.max(xmax, c.x); }
    return { zmax, xmin, xmax };
  }
  function layout(I) {
    buildPath(I);
    I.ext = extentOf(I); I.cext = camExtent(I);
    const c = V(), t = V();
    localPose(I, 0, c, t); I.camStart = c.clone(); I.tgtStart = t.clone();
    localPose(I, 1, c, t); I.camEnd = c.clone(); I.tgtEnd = t.clone();
    if (I.idx === 0) { I.O.set(0, 0, 0); return; }
    const A = INST[I.idx - 1];
    const z = A.O.z + A.ext.min.z - GAP - Math.max(I.cext.zmax, I.ext.max.z) - (I.cfg.gapExtra || 0);
    const x = A.O.x + A.camEnd.x - I.camStart.x + (I.cfg.dx || 0);
    I.O.set(x, 0, z);
  }

  // Umgrenzungen der Teile (je Knoten) im Anfangs- und im Endzustand und der eigenen Objekte (Kabel usw.), Welt
  function partBoxes(I) {
    const out = [];
    for (const bb of [I.b0, I.bMax]) {
      I.M.update(bb, 1e9);
      const { posT, nT, nodes } = I.M.dbg, per = new Map(), v = V();
      for (let j = 0; j < nT.length; j++) {
        const nd = nodes[nT[j]]; if (nd === nodes[0]) continue;
        v.set(posT[j * 3], posT[j * 3 + 1], posT[j * 3 + 2]);
        if (I.clip && (v.x < I.clip[0] || v.x > I.clip[1] || v.z < I.clip[2] || v.z > I.clip[3])) continue;
        let bx = per.get(nd); if (!bx) { bx = new THREE.Box3(); per.set(nd, bx); } bx.expandByPoint(v.clone().add(I.O));
      }
      out.push(...per.values());
    }
    const skip = new Set([I.M.geoT, I.M.geoL, I.M.geoR, I.M.geoG]);
    I.group.updateMatrixWorld(true);
    for (const ch of I.group.children) {
      if ((ch.geometry && skip.has(ch.geometry)) || I.sheets.includes(ch) || I.prints.some(pr => pr.mesh === ch)) continue;
      const bx = new THREE.Box3().setFromObject(ch); if (!bx.isEmpty() && bx.max.y > .05) out.push(bx);
    }
    I.M.update(I.b0, 0);
    return out;
  }
  // Fahrt in Szene B: so weit anheben, dass die Kamera über Bauteile von A und B mindestens 2 Einheiten hinweggeht
  // (nur im mittleren Teil der Fahrt; an den Enden stehen die Stellungen der Szenen selbst)
  function clearance(B) {
    const A = INST[B.idx - 1]; if (!A || !A.boxes || !B.trIn) return 0;
    const keep = B.apex; B.apex = 0;
    const st = { kind: "t", i: B.idx, k: SEGS.indexOf(B.trIn), sg: B.trIn, q: 0 };
    let need = 0; const c = V(), t = V();
    for (let k = 1; k < 60; k++) {
      st.q = k / 60; poseOf(st, c, t);
      const bump = 16 * st.q * st.q * (1 - st.q) * (1 - st.q); if (bump < .25) continue;
      for (const bx of A.boxes.concat(B.boxes)) {
        if (c.x < bx.min.x - 1 || c.x > bx.max.x + 1 || c.z < bx.min.z - 1 || c.z > bx.max.z + 1) continue;
        need = Math.max(need, (bx.max.y + 2 - c.y) / bump);
      }
    }
    B.apex = keep;
    return Math.max(0, need);
  }

  // ---------- Abschnitte der Seite: Szene, Übergang, Szene, … ----------
  // Längen in vh aus der Szenenfolge (cfg.len, cfg.tr), fest, damit #p-Werte schon vor dem Bau aller Szenen gelten
  function makeSegments() {
    SEGS = []; let acc = 0;
    INST.forEach((I, i) => {
      const L = I.cfg.len[narrow ? "n" : "d"], T = i ? I.cfg.tr[narrow ? "n" : "d"] : 0;
      if (i) { SEGS.push({ kind: "t", i, v0: acc, v1: acc + T }); acc += T; }
      SEGS.push({ kind: "b", i, v0: acc, v1: acc + L }); acc += L;
    });
    TOTAL = acc;
    for (const s of SEGS) { s.p0 = s.v0 / TOTAL; s.p1 = s.v1 / TOTAL; }
    INST.forEach(I => { I.body = SEGS.find(s => s.kind === "b" && s.i === I.idx); I.trIn = SEGS.find(s => s.kind === "t" && s.i === I.idx) || null; });
    document.querySelector(".track").style.height = (TOTAL + 100) + "vh";
  }
  const segAt = p => { for (let k = 0; k < SEGS.length; k++) if (p <= SEGS[k].p1 + 1e-12) return k; return SEGS.length - 1; };
  // Szenenanfänge und benannte Stellen (cfg.anchors: Schlüsselnummer im Ausschnitt) als p
  function anchorsOf() {
    const out = [];
    for (const I of INST) {
      out.push({ name: I.name, label: I.cfg.label, p: I.body.p0, main: true });
      if (I.cfg.anchors) for (const [nm, ki] of Object.entries(I.cfg.anchors)) out.push({ name: nm, label: nm, p: null, inst: I, ki, main: true });
    }
    return out;
  }
  const anchorP = a => {
    if (a.p === null && a.inst) {
      ensure(a.inst.idx);
      const ki = typeof a.ki === "function" ? a.ki(a.inst.def) : a.ki, k = a.inst.def.keys[ki];
      a.p = k ? a.inst.body.p0 + a.inst.def.pOfU(k.u) * (a.inst.body.p1 - a.inst.body.p0) : a.inst.body.p0;
    }
    return a.p;
  };

  // Szene bis einschließlich Nummer i bauen (Reihenfolge nötig: die Lage hängt von der vorigen Szene ab)
  function ensure(i) {
    for (let k = 0; k <= Math.min(i, INST.length - 1); k++) if (!INST[k].built) build(INST[k]);
  }
  // Zustand der Seite bei p: Abschnitt, Szene, Übergangsanteil, b je Szene
  function stateAt(p) {
    const k = segAt(clamp(p, 0, 1)), sg = SEGS[k], q = clamp((p - sg.p0) / Math.max(1e-9, sg.p1 - sg.p0), 0, 1);
    return { k, sg, q, kind: sg.kind, i: sg.i };
  }
  function bOf(I, st) {
    if (!I.built) return 0;
    if (st.kind === "b") {
      if (I.idx < st.i) return I.bMax;
      if (I.idx > st.i) return I.b0;
      return clamp(I.def.bOfU(I.def.uOfP(st.q)), 0, 1);
    }
    if (I.idx < st.i - 1) return I.bMax;
    if (I.idx === st.i - 1) return I.bLast + (I.bMax - I.bLast) * sm(st.q);
    return I.b0;
  }
  // Übergangsanteil der Fahrt in Szene i (0 davor, 1 danach)
  function sInto(i, st) {
    const tr = INST[i] && INST[i].trIn; if (!tr) return 1;
    const k = SEGS.indexOf(tr);
    return st.k < k ? 0 : st.k > k ? 1 : st.q;
  }

  // Kamera, Ziel und Sichtfeld zu einem Zustand (Welt), ohne Atem
  const _c = V(), _t = V(), _c2 = V(), _t2 = V(), _ax = V(), DREH = .4;
  function poseOf(st, cam, tgt) {
    const I = INST[st.i];
    if (st.kind === "b") { localPose(I, st.q, cam, tgt); cam.add(I.O); tgt.add(I.O); return fovOf(I); }
    const A = INST[st.i - 1], B = I, tr = B.trIn, Lt = tr.p1 - tr.p0;
    const d = 1e-3;
    // Enden und Geschwindigkeiten (je Einheit p der ganzen Seite) aus den Bahnen der beiden Szenen
    const vel = (S, q0, q1, sgn) => { const a = V(), at = V(), b = V(), bt = V(); localPose(S, q0, a, at); localPose(S, q1, b, bt); const dp = (S.body.p1 - S.body.p0) * (q1 - q0); return [b.sub(a).multiplyScalar(Lt / dp), bt.sub(at).multiplyScalar(Lt / dp)]; };
    const P0 = A.camEnd.clone().add(A.O), T0 = A.tgtEnd.clone().add(A.O), P1 = B.camStart.clone().add(B.O), T1 = B.tgtStart.clone().add(B.O);
    if (!B.trVel || B.trVelKey !== aspect) {
      const [m0, n0] = vel(A, 1 - d, 1), [m1, n1] = vel(B, 0, d);
      // Tangenten zähmen: nichts gegen die Fahrtrichtung (sonst schlägt die Kurve eine Schleife oder taucht unter den Bogen),
      // höchstens 0,6 der Sehne. Wo gezähmt wird, ändert sich die Richtung an der Szenengrenze ein wenig (Geschwindigkeit dort klein:
      // Anfang und Ende jeder Szene sind langsam)
      const tame = (m, ch) => { const L = ch.length(), u = ch.clone().normalize(), a = m.dot(u); if (a < 0) m.addScaledVector(u, -a); if (m.length() > .6 * L) m.setLength(.6 * L); return m; };
      tame(m0, P1.clone().sub(P0)); tame(m1, P1.clone().sub(P0)); tame(n0, T1.clone().sub(T0)); tame(n1, T1.clone().sub(T0));
      B.trVel = { m0, n0, m1, n1 }; B.trVelKey = aspect;
    }
    hermite(P0, B.trVel.m0, P1, B.trVel.m1, st.q, cam);
    hermite(T0, B.trVel.n0, T1, B.trVel.n1, st.q, tgt);
    // Blickrichtung: gleichmäßig (Mischung aus linearem und weichem Lauf) von der Richtung am Ende der alten zur Richtung am Anfang der neuen Szene drehen;
    // die Hermite-Kurve des Ziels allein dreht in der Mitte der Fahrt mit dem Doppelten der mittleren Rate (Drehsprung). Abstand zum Ziel bleibt wie berechnet.
    {
      const dist = tgt.distanceTo(cam), uA = T0.clone().sub(P0).normalize(), uB = T1.clone().sub(P1).normalize(), ang = Math.acos(clamp(uA.dot(uB), -1, 1));
      if (ang > .01 && ang < 3) {
        const ax = _ax.crossVectors(uA, uB).normalize(), x = st.q, g = DREH * x + (1 - DREH) * x * x * (3 - 2 * x);
        tgt.copy(uA).applyAxisAngle(ax, ang * g).multiplyScalar(dist).add(cam);
      }
    }
    // Scheitel: die Fahrt hebt sich über Bauteile der verlassenen und der neuen Szene (gerechnet in clearance(), ohne Knick an den Enden)
    const ap = Math.max(B.cfg.apex || 0, B.apex || 0); if (ap) cam.y += ap * 16 * st.q * st.q * (1 - st.q) * (1 - st.q);
    return fovOf(A) + (fovOf(B) - fovOf(A)) * sm(st.q);
  }

  // ---------- Roter Faden ----------
  // Ein Faden durch alle Szenen: je Szene Eingang (Vorderkante des Bogens), der eigene Faden der Szene (def.thread) und Ausgang
  // (Hinterkante), dazwischen Brücken über die Lücke. Stücke laufen nach b ihrer Szene oder nach dem Anteil eines Übergangs.
  const pieces = [];
  let dot = null;
  const tmat = new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  function ribbon(pts, far) {
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5);
    const len = curve.getLength(), N = Math.round(clamp(len * 18, 24, 1400)), sp = curve.getSpacedPoints(N), hw = .022;
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
    useFar(far || null); const mesh = new THREE.Mesh(g, dunst(tmat.clone(), 1)); useFar(null); mesh.renderOrder = 2; mesh.frustumCulled = false; scene.add(mesh);
    return { curve, N, g, mesh, far: far || null };
  }
  // Punkt (x, z) oder (x, y, z) in Szenenkoordinaten → Welt
  const wpt = (I, a) => a.isVector3 ? a.clone().add(I.O) : a.length === 3 ? V(a[0] + I.O.x, a[1], a[2] + I.O.z) : V(a[0] + I.O.x, .004, a[1] + I.O.z);
  function addPiece(I, pts, time, far) {
    if (pts.length < 2) return;
    const r = ribbon(pts, far === undefined ? I.far : far); r.time = time; r.I = I; r.end = pts[pts.length - 1].clone(); pieces.push(r);
  }
  function buildThreadFor(I) {
    if (!dot) { dot = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, depthTest: false })); dot.renderOrder = 6; dot.visible = false; scene.add(dot); }
    const f = I.cfg.faden ? I.cfg.faden(I.def, I) : null; if (!f) return;
    const own = I.cfg.ownThread === false ? null : I.def.thread;
    const ownPts = own ? own.pts.slice(f.ownFrom || 0).map(p => p.clone().add(I.O)) : null;
    I.entry = f.in ? wpt(I, f.in) : (ownPts ? ownPts[0] : null);
    I.exit = f.out ? wpt(I, f.out) : (ownPts ? ownPts[ownPts.length - 1] : null);
    // Brücke aus der vorigen Szene: läuft im zweiten Teil der Fahrt hinüber
    const A = INST[I.idx - 1];
    // f.bridge [s0, s1]: Fenster der Brücke in der Fahrt; f.preTr [s0, s1]: das Stück vom Eingang zum Anfang des eigenen Fadens läuft ebenfalls noch in der
    // Fahrt (der Punkt steht beim Eintreffen der Szene schon am Anfang des Fadens, Lesebahn)
    const br = f.bridge || [.3, 1];
    if (A && A.exit && I.entry) addPiece(I, [A.exit, A.exit.clone().lerp(I.entry, .5), I.entry], { tr: I.idx, s0: br[0], s1: br[1] }, null);
    const outTime = (b1) => b1 + .06 <= I.bMax ? { I, b0: b1, b1: b1 + .06 } : { tr: I.idx + 1, s0: 0, s1: .3 };
    if (ownPts) {
      const t0 = Math.max(own.t0, I.b0), t1 = Math.max(own.t1, t0 + .01);
      if (f.in) addPiece(I, [I.entry, ...(f.viaPre || []).map(a => wpt(I, a)), ownPts[0]], f.preTr ? { tr: I.idx, s0: f.preTr[0], s1: f.preTr[1] } : { I, b0: Math.max(I.b0, t0 - .05), b1: t0 });
      addPiece(I, ownPts, { I, b0: t0, b1: Math.min(t1, I.bMax), lin: !!own.lin, map: own.map, draw: own.draw });
      if (f.out) addPiece(I, [ownPts[ownPts.length - 1], ...(f.viaPost || []).map(a => wpt(I, a)), I.exit], outTime(Math.min(t1, I.bMax)));
      // own.post (Lesebahn): das Ausgangsstück wird beim letzten Träger schon vor dem Abgang gezeichnet (durch die weiteren Ösen), der Punkt bleibt an der ersten
      if (f.out && own.post) pieces[pieces.length - 1].time.pre = { I, ...own.post };
    } else if (I.entry && I.exit) {
      addPiece(I, [I.entry, ...(f.via || []).map(a => wpt(I, a)), I.exit], { tr: I.idx + 1, s0: 0, s1: .3 });
    }
  }
  function updateThread(st) {
    let last = null;
    for (const pc of pieces) {
      const tm = pc.time; let k;
      if (tm.tr !== undefined) k = tm.tr >= INST.length ? 0 : sm(win(sInto(tm.tr, st), tm.s0, tm.s1 - tm.s0));
      else if (tm.map) k = clamp(tm.map(bOf(tm.I, st)), 0, 1);
      else { const b = bOf(tm.I, st), w0 = win(b, tm.b0, Math.max(1e-4, tm.b1 - tm.b0)); k = tm.lin ? w0 : sm(w0); }
      // gezeichnete Länge kd: der Faden darf dem Punkt vorauseilen (tm.draw: durch die weiteren Ösen eines Trägers; tm.pre: Vorzeichnen des Ausgangsstücks)
      let kd = k;
      if (tm.draw) kd = Math.max(kd, clamp(tm.draw(bOf(tm.I, st)), 0, 1));
      if (tm.pre) kd = Math.max(kd, clamp(tm.pre.len / pc.curve.getLength(), 0, 1) * sm(win(bOf(tm.pre.I, st), tm.pre.b0, Math.max(1e-4, tm.pre.b1 - tm.pre.b0))));
      pc.mesh.visible = kd > 0;
      pc.g.setDrawRange(0, Math.floor(kd * pc.N) * 6);
      if (k > 0) last = { pc, k };
    }
    dot.visible = !!last;
    if (last) {
      last.pc.curve.getPointAt(last.k, dot.position);
      dot.quaternion.copy(camera.quaternion);
      dot.scale.setScalar(Math.max(.05, camera.position.distanceTo(dot.position) * .0065));
    }
    return last;
  }

  // ---------- Text ganz im Bild oder ganz draußen ----------
  // Anteil des Textträgers (Umgrenzung der vier Ecken), der im Rahmen [0, cw] × [64, ch - 70] liegt; hinter der Kamera 0
  const _q = [V(), V(), V(), V()];
  function frameFrac(pr, cw, ch) {
    const m = pr.mesh.matrixWorld, hw = pr.w / 2, hh = pr.h / 2;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 4; i++) {
      const v = _q[i].set(i === 0 || i === 3 ? -hw : hw, i < 2 ? -hh : hh, 0).applyMatrix4(m);
      const q = v.clone().applyMatrix4(camera.matrixWorldInverse);
      if (q.z > -.1) return { f: 0, r: null };
      v.project(camera);
      const X = (v.x + 1) / 2 * cw, Y = (1 - v.y) / 2 * ch;
      x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
    }
    const A = (x1 - x0) * (y1 - y0); if (A <= 0) return { f: 0, r: [x0, y0, x1, y1] };
    const ox = Math.max(0, Math.min(x1, cw) - Math.max(x0, 0)), oy = Math.max(0, Math.min(y1, ch - 70) - Math.max(y0, 64));
    return { f: ox * oy / A, r: [x0, y0, x1, y1] };
  }
  const clipFactor = (pr, cw, ch) => sm((frameFrac(pr, cw, ch).f - .985) / .014);

  // ---------- Übergabe vom HTML-Vorbild an die 3D-Szene ----------
  // Das Vorbild (Name und Unterzeile als HTML) steht, bis das erste Bild der Szene da ist. Die Lettern der Szene (pr.hold) bleiben unsichtbar, solange es steht;
  // damit liegen nie zwei Namen versetzt übereinander. Abgelöst wird, sobald die Lettern ausgewachsen stehen (Uhr der Szene ≥ HOLD_T) oder der Leser zu
  // scrollen beginnt (dann stehen die Lettern sofort fertig). Das Vorbild blendet in 0,12 s aus, die Lettern gleichzeitig ein (opt.onRelease).
  const vb0 = typeof document !== "undefined" && document.querySelector ? document.querySelector(".vorbild") : null;
  const HOLD_T = opt.holdT || 2.0;
  let released = !(vb0 && vb0.classList && vb0.classList.contains && !vb0.classList.contains("weg")), releasedAt = -1e9;
  function release(now) {
    if (released) return; released = true; releasedAt = now;
    opt.onRelease && opt.onRelease();
  }
  // Lage des Namens und der Unterzeile im Startbild in Pixeln (für das HTML-Vorbild): je Druck Grundlinie, linke Schreibkante bzw. Mitte, Schriftgröße
  function vorbildBox() {
    const I = INST[0]; if (!I || !I.built) return null;
    const st = stateAt(0), cw = VW(), ch = VH();
    I.M.update(I.b0, 1e9); I.group.updateMatrixWorld(true);
    const fov = poseOf(st, camera.position, _t); camera.fov = fov; camera.aspect = cw / ch; camera.updateProjectionMatrix();
    camera.lookAt(_t); camera.updateMatrixWorld();
    const out = [];
    for (const pr of I.prints) {
      if (!pr.hold || !pr.t || !pr.t.lines || !pr.t.lines.join("") || pr.mat.blending === THREE.CustomBlending) continue;      // ohne Abdrücke (flach im Bogen)
      const { r } = frameFrac(pr, cw, ch); if (!r) continue;
      const em = (r[3] - r[1]) / pr.t.h, text = pr.t.lines.join(" ");
      out.push({ text, em, lh: pr.t.lh * em, x0: r[0] + pr.t.padX * em, xm: (r[0] + r[2]) / 2, base: r[1] + (.1 + .94) * em, lines: pr.t.lines.length, rect: r });
    }
    I.M.update(I.b0, 0);
    return out;
  }

  // ---------- Bild zu einem Zustand ----------
  const visible = new Set();
  function park(I, on) {
    // weit entfernte Szenen geben ihren Grafikspeicher frei (Texturen und Netze werden beim nächsten Zeigen neu geladen)
    if (on === I.parked) return; I.parked = on;
    if (!on) return;
    I.group.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.map) m.map.dispose(); });
  }
  let state = null;
  function applyState(st, now, opts = {}) {
    // sichtbar: aktuelle Szene und ihre Nachbarn (im Übergang beide Szenen)
    const want = new Set(st.kind === "b" ? [st.i - 1, st.i, st.i + 1] : [st.i - 2, st.i - 1, st.i, st.i + 1]);
    // nötig ist nur die aktuelle Szene (im Übergang: beide); Nachbarn erscheinen, sobald der Hintergrundbau sie fertig hat
    ensure(st.i);
    visible.clear();
    for (const I of INST) {
      if (!I.built) continue;
      const on = want.has(I.idx);
      I.group.visible = on; if (on) visible.add(I);
      park(I, Math.abs(I.idx - st.i) > 3);
    }
    // Nebelweite der Nachbarszenen: Bögen und Teile der nächsten Szene stehen im Lesebild sonst schwebend am oberen Bildrand (Abstand 40 bis 55 Einheiten).
    // Sie bleiben bis zur Fahrt in weißem Dunst (ab 30 bis 36 Einheiten) und kommen in der Fahrt mit q heran; die eigene und die vorigen Szenen unverändert.
    const NX = 22, NY = 28;
    for (const I of INST) {
      if (!I.built || !I.far) continue;
      const ahead = I.idx - st.i - (st.kind === "t" ? 0 : 1);          // 0: die Szene, die als Nächste ankommt (im Übergang: die ankommende)
      if (ahead < 0) { I.far.copy(FAR); continue; }
      const s = ahead === 0 && st.kind === "t" ? sm(clamp(st.q / .8, 0, 1)) : 0;
      I.far.set(ahead > 0 ? NX : NX + (FAR.x - NX) * s, ahead > 0 ? NY : NY + (FAR.y - NY) * s);
    }
    // Zeit der Lettern: läuft ab dem Eintreffen der Szene (Fahrt in die Szene beginnt)
    const time = now / 1000;
    for (const I of INST) if (I.built && I.tStart === undefined && (I.idx < st.i || (I.idx === st.i))) I.tStart = now;
    const fov = poseOf(st, camera.position, _t);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    if (!opts.still) {
      // die Kamera steht nie ganz still: ein ruhiger Atem, an Lesestellen kaum merklich (dort auf 15 %, damit Text am Rand nicht
      // durch den Atem aus dem Rahmen läuft und ausblendet; am Handy sind die Ränder an einigen Lesestellen nur 5–10 px)
      const tv = st.kind === "b" ? INST[st.i].def.travel(INST[st.i].def.uOfP(st.q)) : 1;
      const sway = clamp(camera.position.distanceTo(_t) / 20, .1, .8) * (.15 + .85 * tv);
      camera.position.x += (Math.sin(time * .23) * .08 + Math.sin(time * .07) * .05) * sway;
      camera.position.y += Math.sin(time * .19 + 1) * .03 * sway;
    }
    camera.lookAt(_t);
    camera.updateMatrixWorld();
    const cw = VW(), ch = VH();
    for (const I of visible) {
      // Uhr der Lettern: nach 6 s ist alles aufgestanden und jeder Abdruck geschlossen (danach rechnet das Modell nur, wenn sich b ändert)
      const b = bOf(I, st), tl = I.tStart === undefined ? 0 : Math.min(6, (now - I.tStart) / 1000);
      I.curB = b; I.curT = tl;
      I.M.update(b, tl);
      for (const m of I.bMats) { if (m.uniforms.uGB) m.uniforms.uGB.value = b; else m.uniforms.uB.value = b; }
      for (const a of I.anims) a(b, time);
      I.group.updateMatrixWorld(true);
      for (const pr of I.prints) {
        let o;
        if (pr.sched) o = pr.sched(b);
        else {
          o = pr.on < 0 ? 1 : sm((b - pr.on) / pr.fade);
          if (pr.off !== undefined) o *= 1 - sm((b - pr.off) / .03);
          if (pr.tOff !== undefined) o *= 1 - sm((tl - pr.tOff) / pr.tDur);
        }
        // Startbild: Teile mit pr.hold bleiben unsichtbar, solange das HTML-Vorbild steht; mit der Ablösung blenden sie in 0,12 s ein
        if (pr.hold && !opts.still) o *= released ? sm((now - releasedAt) / 120) : 0;
        // Text (nicht Bilder) nur ganz im Bild oder gar nicht; Decals mit Text (Kontaktkarten) tragen pr.textual
        if (o > .001 && ((pr.t && pr.t.rows) || pr.textual)) o *= clipFactor(pr, cw, ch);
        if (pr.mat.opacity !== o) pr.mat.opacity = o;
        pr.mesh.visible = o > .001;
      }
    }
    updateThread(st);
    state = st;
  }

  // ---------- Fortschritt, Scrollen, Knöpfe ----------
  const bar = document.getElementById("bar"), hint = document.getElementById("hint");
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let target = 0, p = 0, hold = false;
  function jumpTo(pp, instant) {
    pp = clamp(pp, 0, 1);
    const st = stateAt(pp); ensure(st.i);
    // Sprung: frühere Szenen stehen schon fertig da (Lettern nach der Zeit eingeschlossen), die aktuelle auch, wenn p > 0
    for (const I of INST) if (I.built && (I.idx < st.i || (I.idx === st.i && pp > 0))) I.tStart = -1e9;
    target = p = pp; hold = true;
    scrollTo(0, pp * maxScroll());
  }
  function applyHash() {
    const q = hashQ();
    const hp = q.get("p"), hs = q.get("s");
    if (hp !== null && hp !== "" && isFinite(+hp)) { jumpTo(+hp); return true; }
    if (hs) { const a = ANCH.find(a => a.name === hs); if (a) { jumpTo(anchorP(a) + 1e-6); return true; } }
    return false;
  }
  addEventListener("hashchange", applyHash);
  addEventListener("scroll", () => { if (!hold) target = clamp(scrollY / maxScroll(), 0, 1); }, { passive: true });
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(ev, () => { hold = false; }, { passive: true });
  // Vor/Zurück und Navigation: normales (weiches) Scrollen an den Anfang einer Szene, kein Einrasten
  function scrollToP(pp) { hold = false; scrollTo({ top: clamp(pp, 0, 1) * maxScroll(), behavior: "smooth" }); }
  function go(dir) {
    const list = ANCH.filter(a => a.main).map(anchorP).filter(v => v !== null).sort((a, b) => a - b);
    const now = target;
    let to = dir > 0 ? list.find(s => s > now + .0015) : [...list].reverse().find(s => s < now - .0015);
    if (to === undefined) to = dir > 0 ? 1 : 0;
    scrollToP(to);
  }
  const nx = document.getElementById("next"), pv = document.getElementById("prev");
  if (nx) nx.addEventListener("click", () => go(1));
  if (pv) pv.addEventListener("click", () => go(-1));
  addEventListener("click", ev => {
    const l = ev.target.closest && ev.target.closest("[data-scene]"); if (!l) return;
    const a = ANCH.find(a => a.name === l.dataset.scene); if (!a) return;
    ev.preventDefault(); scrollToP(anchorP(a) + 1e-6);
  });

  // ---------- Klickbare Drucke (Kontaktwege) ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function linkAt(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = null, bd = 1e9;
    for (const l of links3) {
      if (!l.I.group.visible || !l.pr.mesh.visible || l.pr.mat.opacity < .6) continue;
      const h = ray.intersectObject(l.pr.mesh, false)[0];
      if (h && h.distance < bd) { bd = h.distance; best = l; }
    }
    return best;
  }
  canvas.addEventListener("pointermove", ev => { canvas.style.cursor = ev.pointerType === "mouse" && linkAt(ev) ? "pointer" : ""; });
  canvas.addEventListener("click", ev => {
    const l = linkAt(ev); if (!l || !l.href || l.href === "#") return;
    if (/^(https?:)/.test(l.href)) window.open(l.href, "_blank", "noopener"); else location.href = l.href;
  });

  function resize() {
    const w = VW(), h = VH();
    if (FORCE) Object.assign(canvas.style, { width: w + "px", height: h + "px", left: "50%", top: "0", transform: "translateX(-50%)", outline: "1px solid #999" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect; camera.updateProjectionMatrix();
    // Lesestellungen hängen von der Fenstergröße ab: Bahnen neu (Lage der Szenen bleibt)
    for (const I of INST) if (I.built) { buildPath(I); const c = V(), t = V(); localPose(I, 0, c, t); I.camStart = c.clone(); I.tgtStart = t.clone(); localPose(I, 1, c, t); I.camEnd = c.clone(); I.tgtEnd = t.clone(); I.trVel = null; }
    for (const I of INST) if (I.built && I.idx) I.apex = clearance(I);
  }

  // ---------- Aufbau ----------
  function init() {
    for (const I of INST) if (I.built) { scene.remove(I.group); I.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    for (const pc of pieces) { scene.remove(pc.mesh); pc.g.dispose(); }
    pieces.length = 0; links3.length = 0;
    aspect = VW() / VH(); narrow = aspect < 1;
    INST = SEQ.map((cfg, i) => newInstance(cfg, i));
    resize();
    makeSegments();
    ANCH = anchorsOf();
    build(INST[0]); INST[0].tStart = performance.now();
  }
  init();
  addEventListener("resize", () => {
    const n = VW() / VH() < 1;
    if (n !== narrow) { const keep = target; init(); jumpTo(keep); } else resize();
    if (hold) scrollTo(0, target * maxScroll());
  });
  if (!applyHash()) { target = p = clamp(scrollY / maxScroll(), 0, 1); }
  // übrige Szenen im Hintergrund nacheinander bauen, erst nach dem ersten Bild (das Startbild steht vorher)
  function more() { const n = INST.find(I => !I.built); if (!n) return; build(n); setTimeout(more, 40); }

  let last = performance.now(), first = true;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    p += (target - p) * (1 - Math.exp(-dt * 3.0));
    if (Math.abs(target - p) < 1e-5) p = target;
    // Ablösung des Vorbilds: bei Scrollbeginn sofort (Lettern stehen dann fertig), sonst wenn die Lettern ausgewachsen stehen
    if (!released && INST[0].built) { if (p > .004) { INST[0].tStart = -1e9; release(now); } else if ((now - INST[0].tStart) / 1000 >= HOLD_T) release(now); }
    const st = stateAt(p);
    applyState(st, now);
    hint && hint.classList.toggle("off", p > .004);
    document.body.classList.toggle("scrolled", scrollY > innerHeight * .6 || p > INST[0].body.p1 * .1);
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
    renderer.render(scene, camera);
    if (first) { first = false; opt.onFirstFrame && opt.onFirstFrame(); setTimeout(more, 250); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Prüfhilfe (nur Entwurf): Zustände ohne Atem setzen, Lesestellen und Abschnitte als p
  const api = {
    THREE, scene, camera, frameFrac, readingPose, stateAt, poseOf, bOf, ensure,
    labelAt: pp => { const st = stateAt(pp), I = INST[st.i]; if (st.kind === "b" && I.cfg.labels) { ensure(I.idx); let lb = I.cfg.label; for (const L of I.cfg.labels) { const ki = typeof L.ki === "function" ? L.ki(I.def) : L.ki, kk = I.def.keys[ki]; if (kk && pp >= I.body.p0 + I.def.pOfU(kk.u) * (I.body.p1 - I.body.p0)) lb = L.label; } return lb; } return I.cfg.label; },
    inst: () => INST, segs: () => SEGS, total: () => TOTAL, anchors: () => ANCH.map(a => ({ name: a.name, p: anchorP(a) })),
    setP(v) { jumpTo(v); },
    // Zustand bei p ohne Atem anwenden (für Rechnungen), liefert den Zustand
    at(v, now = 1e9, still = true) { const st = stateAt(v); applyState(st, now, { still }); return st; },
    state: () => state, p: () => p,
    // Lesestellen aller Szenen als p der ganzen Seite
    stops() {
      ensure(INST.length - 1);
      const out = [];
      for (const I of INST) I.def.keys.forEach((k, ki) => { if (k.stop || k.slow) out.push({ scene: I.name, ki, stop: k.stop || null, slow: !!k.slow, p: I.body.p0 + I.def.pOfU(k.u) * (I.body.p1 - I.body.p0), b: k.b }); });
      return out;
    },
    pieces: () => pieces,
    vorbildBox, release: () => release(performance.now()), released: () => released
  };
  window.__seite = api;
  return api;
}
