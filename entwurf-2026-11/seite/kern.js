// Durchgehende Startseite jan-erik-andersen.de, Fassung 2026-11 (entwurf-2026-11/seite/). Gemeinsamer Kern für alle Szenen.
// Grundlage: entwurf-2026-11/bogen/kern.js. Jede Szene ist ein Modul im bisherigen Format (default (K) => { keys, stops, track, … }),
// sie wird als Parzelle auf einen gemeinsamen Tisch gestellt: gedreht um y (Blickrichtung N, E, S, W) und verschoben, Bahnen mit Eckparzellen
// als Reihen (siehe layout(), Richtungen in folge.js). In einer Bahn liegt jede Szene hinter der vorigen (die Kamerastellungen der späteren
// vor dem hintersten Punkt der früheren). Eine gemeinsame Kamerabahn läuft durch alle Szenen: in der Szene ihre eigene Bahn (Zeitverzerrung,
// Lesestellungen aus readingPose()), zwischen zwei Szenen eine stetige Fahrt (kubische Hermite-Kurve mit den Geschwindigkeiten an beiden Enden,
// bei Kurven ein Viertelbogen mit mitdrehendem Blick). Am Ende zoomt die Kamera aus dem Kontakt zur halb isometrischen Karte des Tisches
// (Segment "z"), dort sind die Parzellen anklickbar; der Knopf „Übersicht“ öffnet dieselbe Karte an jeder Stelle (M, blendMap()).
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
// Zustände: #p=0…1 (ganze Seite), #s=<szene> (Szenenanfang), Handy-Ausschnitt #…&w=390&h=844 (Prüfhilfe).
import * as THREE from "three";
import { SCHRIFTEN } from "./fonts/schriften.js";
import { Model, kit, paperMaterial, edgeMaterial, rissMaterial, geruestMaterial, gridOn, frameOn, FAR, COL, PI, Q, EPS, clamp, sm, mech } from "./falt.js";

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
  const dbg = m => { if (typeof window !== "undefined" && window.__dbg) window.__dbg(m); };       // Diagnose (Hash "dbg"), siehe index.html
  dbg("Kern gestartet");
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
  // Auflösung der Drucke: buildScale 1 = volle Pixeldichte, kleiner = Canvas von Anfang an klein gezeichnet (Zeichnen unter ctx.scale, die Maße
  // der Drucke bleiben gleich), nie größer als 1024 px. Entfernte Szenen und die Karte zeigen kleine Drucke, nahe Szenen volle (setScale()).
  const SMALL = .25, SMALL_MAX = 1024;
  let buildScale = 1;
  const PXEM = 120, MAXTEX = Math.min(4096, renderer.capabilities.maxTextureSize || 4096);
  const texOf = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  function printTex(lines, o = {}) {
    // Marke zweifach aufgelöst (bei Pixeldichte 2 bleiben Überschriften bis rund 120 px Schrift scharf); o.hi (nur die große Wortmarke
    // im Startbild) vierfach: dort bis rund 140 px Schrift. Vierfach überall ergab rund 300 MB Grafikspeicher und Kontextverlust (schwarzer Hintergrund, keine Drucke).
    let em = o.hi ? PXEM * 4 : o.font === "marke" ? PXEM * 2 : PXEM, lh = (o.lh || 1.3) * em;
    // o.font "marke": Wortmarke N4 (Newsreader variabel, aufrecht 380, kursiv 340, Laufweite -0,018 em)
    const mk = o.font === "marke";
    const fam = mk ? '"Newsreader N4", "Newsreader", serif' : o.font === "serif" ? '"Newsreader"' : '"Schibsted Grotesk"';
    const font = () => `${o.italic ? "italic " : ""}${mk ? (o.italic ? 340 : 380) : o.font === "serif" ? 300 : 500} ${em}px ${fam}`;
    if (mk && o.track === undefined) o = { ...o, track: -.018 };
    const sReq = o.scale !== undefined ? o.scale : buildScale;
    const cv = document.createElement("canvas"), x = cv.getContext("2d");
    const setF = () => { x.font = font(); if (o.track) x.letterSpacing = (o.track * em) + "px"; };
    setF();
    let padX = .16 * em, padY = .1 * em;
    // o.disc: Radius in em; statt Text eine Scheibe, deren Unterkante auf der Grundlinie sitzt (Schlusspunkt der Marke)
    const meas = () => o.disc ? [2 * o.disc * em] : lines.map(l => x.measureText(l).width);
    let ws = meas(), wMax = Math.max(...ws);
    // Kante der Leinwand begrenzen (Texturgrenze der Grafikkarte, höchstens 4096): Schrift entsprechend kleiner setzen
    if (wMax + padX * 2 > MAXTEX) { em *= MAXTEX / (wMax + padX * 2); lh = (o.lh || 1.3) * em; setF(); padX = .16 * em; padY = .1 * em; ws = meas(); wMax = Math.max(...ws); }
    const cvW = Math.min(MAXTEX, Math.ceil(wMax + padX * 2)), cvH = Math.ceil(padY * 2 + (lines.length - 1) * lh + em * 1.18);
    const sc = sReq < 1 ? Math.min(sReq, SMALL_MAX / Math.max(cvW, cvH)) : 1;
    cv.width = Math.max(1, Math.ceil(cvW * sc)); cv.height = Math.max(1, Math.ceil(cvH * sc));
    setF(); if (sc < 1) x.scale(cv.width / cvW, cv.height / cvH);
    x.fillStyle = o.col || INK; x.textBaseline = "alphabetic";
    // o.outline: nur die Kontur (Abdruck der Lettern als feine Schnittlinie im Bogen); mit o.fillCol zuerst eine zarte Füllung
    if (o.outline) { x.strokeStyle = o.col || INK; x.lineWidth = o.outline * em / PXEM; x.lineJoin = "round"; }
    const at = i => [padX + (o.align === "center" ? (wMax - ws[i]) / 2 : 0), padY + em * .94 + i * lh];
    if (o.disc) {
      const [ax, ay] = at(0), r = o.disc * em; x.beginPath(); x.arc(ax + r, ay - r, r, 0, 2 * PI);
      if (o.outline) { if (o.fillCol) { x.fillStyle = o.fillCol; x.fill(); } x.stroke(); } else x.fill();
    } else {
      if (o.outline && o.fillCol) { x.fillStyle = o.fillCol; lines.forEach((l, i) => x.fillText(l, ...at(i))); }
      lines.forEach((l, i) => x[o.outline ? "strokeText" : "fillText"](l, ...at(i)));
    }
    const h = cvH / em;
    return { tex: texOf(cv), w: cvW / em, h, padX: padX / em, tw: wMax / em, bfb: h - (padY / em + .94 + (lines.length - 1) * lh / em), rows: ws.map(v => v / em), lines };
  }

  // ---------- Ansicht ----------
  const hashQ = () => new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const fq = hashQ();
  const START_FULL = !fq.get("p") && !fq.get("s");                 // Szene 1 in voller Auflösung bauen, nur wenn die Seite vorn beginnt
  const FORCE = fq.get("w") && fq.get("h") ? { w: +fq.get("w"), h: +fq.get("h") } : null;
  const VW = () => FORCE ? FORCE.w : innerWidth, VH = () => FORCE ? Math.min(FORCE.h, innerHeight) : innerHeight;
  let aspect = VW() / VH(), narrow = aspect < 1;
  const fovOf = I => narrow ? (I.def.fovN || 44) : (I.def.fov || 36);

  // ---------- Szenen ----------
  const links3 = [];
  let INST = [], SEGS = [], ANCH = [], TOTAL = 1, thread = null, ZSEG = null;
  // Länge des Schluss-Zooms in vh (Breitbild, hochkant)
  const ZOOM = { d: 110, n: 120 };

  function newInstance(cfg, idx) {
    return { cfg, idx, name: cfg.name, built: false, O: V(), rot: 0, M4: new THREE.Matrix4(), R4: new THREE.Matrix4(), fp: null, tStart: undefined, parked: false, lastKey: "" };
  }

  // Eine Szene bauen: Modul ausführen, Faltmodell abschließen, Drucke und Netze in die Gruppe der Szene hängen
  function build(I) {
    const cfg = I.cfg;
    const group = new THREE.Group(); scene.add(group);
    const prints = [], anims = [], sheets = [], sheetBox = [], bMats = [], mats = [];
    const rissMat = rissMaterial();
    const add = o => { group.add(o); return o; };
    function mkPrint(lines, e, on, o = {}) {
      const sc = o.scale !== undefined ? o.scale : buildScale, t = printTex(lines, o);
      const mat = new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const w = t.w * e, h = t.h * e;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.renderOrder = 3; mesh.frustumCulled = false; group.add(mesh);
      const pr = { mesh, mat, on, e, w, h, t, map: t.tex, sc, mk: sx => printTex(lines, { ...o, scale: sx }).tex.image, fade: o.fade || .02, off: o.off, I };
      prints.push(pr); return pr;
    }
    function mkDecal(wpx, hpx, draw, w, h, on, fade = .025) {
      const decalCv = sx => {
        const cv = document.createElement("canvas"), sc2 = sx < 1 ? Math.min(sx, SMALL_MAX / Math.max(wpx, hpx)) : 1;
        cv.width = Math.max(1, Math.ceil(wpx * sc2)); cv.height = Math.max(1, Math.ceil(hpx * sc2));
        const x = cv.getContext("2d"); if (sc2 < 1) x.scale(cv.width / wpx, cv.height / hpx);
        draw(x, wpx, hpx); return cv;
      }, sc = buildScale;
      const mat = new THREE.MeshBasicMaterial({ map: texOf(decalCv(sc)), transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.renderOrder = 2; mesh.frustumCulled = false; group.add(mesh);
      const pr = { mesh, mat, on, e: 1, w, h, map: mat.map, sc, mk: decalCv, fade, I };
      prints.push(pr); return pr;
    }
    const F = Model(), K = kit(F), R = F.root;
    Object.assign(K, {
      F, R, THREE, V, COL, PI, Q, EPS, sm, mech, win, clamp, narrow,
      anim: fn => anims.push(fn), add, paperMaterial, edgeMaterial, camera,
      print: mkPrint, decal: mkDecal,
      // Klickbarer Druck (Raycast auf die Fläche des Drucks): Kontaktwege bleiben echte Links, zusätzlich als HTML-Links im Dokument
      link(pr, href) { links3.push({ pr, href, I }); return pr; },
      measure(lines, o = {}) { const t = printTex(lines, { ...o, scale: .02 }); t.tex.dispose(); return t; },
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
        }
        const L = K.panel(o.par || R, [x, zb], [x + W, zb], [0, -1], t0, d, o.ang || Q, { clock: ck, nocut: 1, nofold: 1, over: o.over !== undefined ? o.over : .07 });
        const u = (pr.w / 2 - pr.t.padX * e), v = base + (pr.h / 2 - pr.t.bfb * e);
        F.attach(L, pr.mesh, L.uv(u, v), [0, -1], 1, .0015);
        if (im) F.attach(o.par || R, im.mesh, L.uv(u, v), [0, -1], 1, .0006);
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
        g.add(e); add(g); sheets.push(g); sheetBox.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]);
        if (from >= 0) anims.push(b => { g.visible = b >= from; });
        return g;
      }
    });
    buildScale = I.idx === 0 && START_FULL ? 1 : SMALL; I.lodSmall = buildScale < 1;
    const def = cfg.mod(K, cfg.modOpt);
    buildScale = 1;
    const M = F.finish();
    const mesh = add(new THREE.Mesh(M.geoT, paperMaterial()));
    const lines = add(new THREE.LineSegments(M.geoL, edgeMaterial()));
    const riss = add(new THREE.LineSegments(M.geoR, rissMat));
    for (const o of [mesh, lines, riss]) o.frustumCulled = false;
    mesh.renderOrder = 0; lines.renderOrder = 1; riss.renderOrder = 1;
    // Konstruktionsphase: Raster auf dem Bogen und den liegenden Teilen (def.grid bzw. cfg.grid), Gerüst im Raum (F.geruest)
    const grid = cfg.grid !== undefined ? cfg.grid : def.grid;
    if (grid) { gridOn(mesh.material, true, grid); bMats.push(mesh.material); for (const g of sheets) { gridOn(g.material, false, grid); bMats.push(g.material); } }
    if (M.geoG) { const gm = geruestMaterial(), gl = add(new THREE.LineSegments(M.geoG, gm)); gl.frustumCulled = false; gl.renderOrder = 1; bMats.push(gm); I.gerLine = gl; }
    bMats.push(rissMat);
    I.buildLines = [riss]; if (I.gerLine) I.buildLines.push(I.gerLine);        // Bastel- und Gerüstlinien: nur in der eigenen Szene sichtbar
    // Schlüssel: Ausschnitt aus der Bahn der Szene (cfg.keys), erster Schlüssel ohne Vorlauf (sonst stünde die Kamera am Szenenanfang still)
    def.allKeys = def.keys;
    let keys = (cfg.keys ? cfg.keys(def) : def.keys).map((k, i) => i === 0 ? { ...k, w: 0 } : k);
    // cfg.lead / cfg.tail: beginnt bzw. endet die Szene mit einer Lesestelle, kommt die Kamera aus etwas weiterem Abstand an bzw.
    // zieht sich danach langsam zurück; so liegt die Lesestelle ganz in der Szene und nicht direkt an der Fahrt zur Nachbarszene
    if (cfg.lead && keys[0].stop) keys = [{ w: 0, b: keys[0].stop.b, fromStop: keys[0].stop, back: 1.25, up: .4 }, { ...keys[0], w: .35 }, ...keys.slice(1)];
    const lk = keys[keys.length - 1];
    if (cfg.tail && lk.stop) keys = [...keys, { w: .35, b: lk.stop.b, fromStop: lk.stop, back: 1.2, up: .3 }];
    def.keys = keys;
    Object.assign(I, { group, lines, prints, anims, sheets, sheetBox, bMats, rissMat, F, K, M, def, built: true });
    prep(I);
    I.b0 = clamp(def.bOfU(0), 0, 1);
    I.bLast = clamp(def.bOfU(1), 0, 1);
    I.bMax = cfg.bMax !== undefined ? cfg.bMax : 1;
    // Ausschnitt: Szenen, die nur einen Teil eines Bogens zeigen (abschluss), oder deren Bogen weit nach hinten reicht (stimmen)
    I.clip = cfg.clip || null;
    layout(I);
    group.position.copy(I.O); group.rotation.y = I.rot; group.updateMatrixWorld(true);
    // Ausschnitt für Materialien ohne eigenen Shader: Ebenen in Szenenkoordinaten, mit der Gruppe in die Welt gedreht
    const planes = I.clip ? [
      new THREE.Plane(V(1, 0, 0), -I.clip[0]), new THREE.Plane(V(-1, 0, 0), I.clip[1]),
      new THREE.Plane(V(0, 0, 1), -I.clip[2]), new THREE.Plane(V(0, 0, -1), I.clip[3])].map(pl => pl.applyMatrix4(group.matrixWorld)) : null;
    group.traverse(o => {
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) { if (!frameOn(m, I.O, I.clip, I.rot) && planes) m.clippingPlanes = planes; }
    });
    // Dunst je Szene: eigene Grenzen (I.far), damit Nachbarszenen aus dem Dunst auftauchen und nicht im Hintergrund stehen (applyState)
    I.far = new THREE.Vector2(FAR.x, FAR.y); I.farS = new THREE.Vector2(FAR.x, FAR.y);       // farS: die Bögen (Karten) bleiben länger sichtbar als stehende Teile
    group.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.uniforms && m.uniforms.uFar) m.uniforms.uFar = { value: I.far }; });
    for (const sh of sheets) if (sh.material.uniforms && sh.material.uniforms.uFar) sh.material.uniforms.uFar = { value: I.farS };
    buildThreadFor(I);
    I.boxes = partBoxes(I);
    if (I.idx) I.apex = clearance(I);
    I.M.update(I.b0, 0); I.curB = I.b0; I.curT = 0;
    dbg("Szene " + (I.idx + 1) + " " + I.name + " gebaut");
    try { updateTable(); } catch (e) { mapFail(e); }
    group.visible = false;
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
    // Zeit: keine Bremsen. Die Schlüssel liegen in buildPath() (retime) so in der Zeit, dass die Kamera mit annähernd gleichem Tempo
    // durch alle Stellungen fährt; an Lesestellen nimmt das Tempo nur weich bis TEMPO_F ab (applyWarp), an Szenenrändern gar nicht.
    applyWarp(def);
    // Anteil Fahrt (0 an einer Lesestelle, 1 auf freier Strecke): dämpft nur den Atem der Kamera an Lesestellen, nicht die Fahrt
    const BW = def.warpW || .028;
    def.travel = u => {
      const ks = def.keys; let m = 0;
      for (let i = 0; i < ks.length; i++) { const k = ks[i]; if (((k.stop || k.slow) && !k.noWarp) || i === 0 || i === ks.length - 1) m = Math.max(m, Math.exp(-(((u - k.u) / BW) ** 2))); }
      return clamp(1 - m, 0, 1);
    };
  }
  // Weicher Tempoabfall an Lesestellen (und Schlüsseln mit slow): das Tempo sinkt dort nie unter TEMPO_F des Tempos auf freier Strecke
  // (Glocke, ohne Einrasten und Stillstand), übers Bild gerechnet daher noch höher als TEMPO_F der mittleren Szenengeschwindigkeit.
  const TEMPO_F = .6;
  function applyWarp(def) {
    const ks = def.keys, NW = 3000, BW = def.warpW || .028, F = TEMPO_F;
    const su = ks.filter(k => (k.stop || k.slow) && !k.noWarp).map(k => k.u);
    const sp = u => { let m = 0; for (const c of su) m = Math.max(m, Math.exp(-(((u - c) / BW) ** 2))); return 1 - (1 - F) * m; };
    const warpP = new Float64Array(NW + 1); let T = 0;
    for (let i = 0; i < NW; i++) T += 1 / sp((i + .5) / NW) / NW;
    let a2 = 0; for (let i = 0; i < NW; i++) { a2 += 1 / sp((i + .5) / NW) / NW; warpP[i + 1] = a2 / T; }
    def.pOfU = u => { const f = clamp(u, 0, 1) * NW, i = Math.min(NW - 1, Math.floor(f)); return warpP[i] + (warpP[i + 1] - warpP[i]) * (f - i); };
    def.uOfP = p => {
      if (p <= 0) return 0; if (p >= 1) return 1;
      let lo = 0, hi = NW;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (warpP[mid] < p) lo = mid; else hi = mid; }
      return (lo + (p - warpP[lo]) / (warpP[hi] - warpP[lo])) / NW;
    };
  }
  // Schlüssel in der Zeit (Abschnitt 0 … 1): die Dauer zwischen zwei Schlüsseln folgt dem Weg (Ort plus Blickdrehung) der Bahn dazwischen,
  // damit das Tempo durch die Lesestellungen gleich bleibt. Gemischt mit der Vorgabe w (RETIME_B Weganteil), mit Untergrenze (RETIME_MIN
  // Anteil von w), damit Teile, die sich bei stehender Kamera aufbauen, nicht in einem Zug springen.
  const RETIME_B = .85, RETIME_MIN = .2, RETIME_R = 10;
  function retime(I) {
    const def = I.def, ks = def.keys, n = ks.length; if (n < 2) return;
    const SUB = 24, tot = (n - 1) * SUB, cum = new Float64Array(tot + 1);
    const c0 = V(), c1 = V(), g0 = V(), g1 = V(), d0 = V(), d1 = V();
    I.camC.getPoint(0, c0); I.tgtC.getPoint(0, g0); d0.subVectors(g0, c0).normalize();
    for (let j = 1; j <= tot; j++) {
      const t = j / tot; I.camC.getPoint(t, c1); I.tgtC.getPoint(t, g1); d1.subVectors(g1, c1).normalize();
      cum[j] = cum[j - 1] + c1.distanceTo(c0) + RETIME_R * Math.acos(clamp(d1.dot(d0), -1, 1));
      c0.copy(c1); d0.copy(d1);
    }
    const sw = ks.reduce((a, k, i) => a + (i ? k.w : 0), 0) || 1, sm = cum[tot] || 1, dur = [0];
    for (let i = 1; i < n; i++) { const a = ks[i].w / sw, m = (cum[i * SUB] - cum[(i - 1) * SUB]) / sm; dur.push(Math.max(RETIME_MIN * a, (1 - RETIME_B) * a + RETIME_B * m)); }
    const sd = dur.reduce((a, b) => a + b, 0); let acc = 0;
    ks.forEach((k, i) => { acc += dur[i]; k.u = acc / sd; });
    const keyU = ks.map(k => k.u), keyS = ks.map((k, i) => cum[i * SUB]);
    def.bOfU = pchip(keyU, ks.map(k => k.b));
    const sOfU = pchip(keyU, keyS);
    const tOfS = s => {
      if (s <= 0) return 0; if (s >= cum[tot]) return 1;
      let lo = 0, hi = tot; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
      return (lo + (s - cum[lo]) / Math.max(1e-12, cum[hi] - cum[lo])) / tot;
    };
    def.idxOfU = u => tOfS(sOfU(u)) * (n - 1);
    applyWarp(def);
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
    const D = Fw.clone().addScaledVector(Rt, sx * TAN * aspect).addScaledVector(U, sy * TAN).normalize();
    const P = s.C.clone().addScaledVector(D, -depth / D.dot(Fw));
    return { cam: P, tgt: P.clone().addScaledVector(Fw, depth), px };
  }
  function buildPath(I) {
    const def = I.def, k = aspect < 1.25 ? Math.pow(1.25 / aspect, .55) : 1, nar = aspect < 1;
    const cams = [], tgts = [];
    for (const key of def.keys) {
      if (key.stop) { const ps = readingPose(I, key.stop); key.stop.pose = ps; cams.push(ps.cam); tgts.push(ps.tgt); continue; }
      // Anfahrt auf eine Lesestelle der Szene (Ausschnitte): Lesestellung, um back weiter weg und um up höher
      if (key.fromStop) { const ps = readingPose(I, key.fromStop), off = ps.cam.clone().sub(ps.tgt); cams.push(ps.tgt.clone().addScaledVector(off, key.back || 1.5).add(V(0, key.up || 0, 0))); tgts.push(ps.tgt.clone()); continue; }
      if (nar && key.camN) { cams.push(key.camN.clone()); tgts.push(key.tgtN.clone()); continue; }
      const off = key.cam.clone().sub(key.tgt);
      cams.push(key.tgt.clone().addScaledVector(off, k)); tgts.push(key.tgt.clone());
    }
    if (cams.length === 1) { cams.push(cams[0].clone()); tgts.push(tgts[0].clone()); }
    I.camC = new THREE.CatmullRomCurve3(cams, false, "centripetal");
    I.tgtC = new THREE.CatmullRomCurve3(tgts, false, "centripetal");
    I.nK = def.keys.length;
    retime(I);
  }
  // Kamera in der Szene, q = Anteil des Szenenabschnitts (0 … 1), Szenenkoordinaten
  function localPose(I, q, cam, tgt) {
    const def = I.def, u = def.uOfP(clamp(q, 0, 1)), t = I.nK > 1 ? clamp(def.idxOfU(u) / (I.nK - 1), 0, 1) : 0;
    I.camC.getPoint(t, cam); I.tgtC.getPoint(t, tgt);
    return { u, b: clamp(def.bOfU(u), 0, 1) };
  }

  // ---------- Lage der Szenen in der Welt ----------
  // Parzellen auf einem gemeinsamen Tisch. Jede Szene ist eine Gruppe, gedreht um y (Blickrichtung der Szene N, E, S, W, cfg.dir; fehlt sie,
  // gilt die der vorigen Szene) und verschoben um O; Welt = R · Szene + O. Die Kamera fährt in jeder Szene von vorn (+z) nach hinten (−z), also
  // in Blickrichtung. Geradeaus: Szene B liegt ganz hinter A (jede Kamerastellung von B liegt vor dem hintersten Punkt von A minus GAP) und
  // steht mit der Kante der Gasse bündig an A. Kurve (Blickrichtung ändert sich um ±90°): B wird gesucht, so dass die Fahrt als Viertelbogen
  // aus A hinaus- und in B hineinläuft und B (samt Anfahrtsstück) keine andere Parzelle berührt.
  const HEAD = { N: 0, E: -PI / 2, S: PI, W: PI / 2 };
  const PITCH_LEAD = 12;           // so weit darf die Kamera vor einer Parzelle über dem Rücken der vorigen stehen (hoch über dem Tisch), Rest wird nicht freigehalten
  const GASSE = 2.8;              // freier Streifen zwischen zwei Parzellen (Weg des Fadens)
  const LEAD_MAX = 9;             // Anfahrtsstück vor dem Körper, das die Parzelle für die Anordnung freihält (die Kamera fährt dort hoch über dem Tisch)
  const headOf = I => V(-Math.sin(I.rot), 0, -Math.cos(I.rot));
  const setXf = I => { I.R4.makeRotationY(I.rot); I.M4.copy(I.R4).setPosition(I.O); };
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
  // Fläche, die die Parzelle für sich braucht (Szenenkoordinaten x0, x1, z0, z1): Körper samt Bauteilen und Anfahrtsstück der Kamera
  function localFoot(I) {
    const e = I.ext, c = I.cext;
    return [Math.min(e.min.x, Math.max(c.xmin, e.min.x - 6)), Math.max(e.max.x, Math.min(c.xmax, e.max.x + 6)), e.min.z, Math.max(e.max.z, Math.min(c.zmax, e.max.z + LEAD_MAX))];
  }
  // lokales Rechteck → Rechteck der Welt (x0, x1, z0, z1) für Ursprung O und Drehung rot
  function worldRect(lr, O, rot) {
    const m = new THREE.Matrix4().makeRotationY(rot).setPosition(O), out = [1e9, -1e9, 1e9, -1e9];
    for (const [x, z] of [[lr[0], lr[2]], [lr[1], lr[2]], [lr[1], lr[3]], [lr[0], lr[3]]]) {
      const w = V(x, 0, z).applyMatrix4(m); out[0] = Math.min(out[0], w.x); out[1] = Math.max(out[1], w.x); out[2] = Math.min(out[2], w.z); out[3] = Math.max(out[3], w.z);
    }
    return out;
  }
  const hit = (a, b, m) => a[0] < b[1] + m && a[1] > b[0] - m && a[2] < b[3] + m && a[3] > b[2] - m;
  const freeRect = (r, I, m = GASSE) => !INST.some(X => X.idx < I.idx && X.fp && hit(r, X.fp, m));
  function dirOf(I) {
    for (let k = I.idx; k >= 0; k--) { const d = INST[k].cfg.dir; if (d && d[narrow ? "n" : "d"]) return d[narrow ? "n" : "d"]; }
    return "N";
  }
  const modeV = v => v ? v[narrow ? "n" : "d"] : undefined;
  const rightOf = I => V(Math.cos(I.rot), 0, -Math.sin(I.rot));
  const latOf = I => V((I.lf[0] + I.lf[1]) / 2, 0, 0).applyMatrix4(I.M4);          // Mitte der Parzelle quer zur Bahn (Weltpunkt)
  // Anordnung. Eine Bahn läuft geradeaus: Parzellen mittig auf der Bahnachse, Abstand wie bisher. Zwischen zwei Bahnen entgegengesetzter
  // Richtung steht eine Eckparzelle quer zu beiden: Bahn → Ecke → Bahn (zwei Kurven gleichen Drehsinns, jede als Viertelbogen). Die Achse der
  // nächsten Bahn liegt um die halben Breiten beider Bahnen (cfg.lane an der ersten Parzelle der Bahn) plus Gasse neben der der letzten.
  function layout(I) {
    buildPath(I);
    I.ext = extentOf(I); I.cext = camExtent(I);
    const c = V(), t = V();
    localPose(I, 0, c, t); I.camStart = c.clone(); I.tgtStart = t.clone();
    localPose(I, 1, c, t); I.camEnd = c.clone(); I.tgtEnd = t.clone();
    I.rot = HEAD[dirOf(I)];
    I.lf = localFoot(I);
    I.arc = null; I.corner = false; I.axisPt = null;
    const rotM = new THREE.Matrix4().makeRotationY(I.rot);
    if (I.idx === 0) { I.O.set(0, 0, 0); I.laneW = modeV(I.cfg.lane) || 0; setXf(I); I.axisPt = latOf(I); }
    else {
      const A = INST[I.idx - 1];
      if (Math.abs(I.rot - A.rot) < 1e-6) {
        // geradeaus: hinter A, Mitte auf der Achse
        I.laneW = A.laneW;
        const dz = A.ext.min.z - GAP - Math.min(Math.max(I.cext.zmax, I.ext.max.z), I.ext.max.z + PITCH_LEAD) - (I.cfg.gapExtra ? modeV(I.cfg.gapExtra) : 0);
        I.O.copy(A.O).add(V((A.lf[0] + A.lf[1]) / 2 - (I.lf[0] + I.lf[1]) / 2, 0, dz).applyMatrix4(A.R4));
        setXf(I); I.axisPt = latOf(I);
      } else {
        const hA = headOf(A), hB = headOf(I), turn = hA.x * hB.z - hA.z * hB.x > 0 ? 1 : -1;
        const cE = A.camEnd.clone().applyMatrix4(A.M4), cs = I.camStart.clone().applyMatrix4(rotM);
        const fMin = Math.max(10, .5 * (A.camEnd.z - A.ext.min.z) + 4);      // der Bogen beginnt erst nach dem größten Teil der Parzelle (die Kamera ist dort hoch)
        const place = (f, s) => V(cE.x + f * hA.x + s * hB.x - cs.x, 0, cE.z + f * hA.z + s * hB.z - cs.z);
        if (!A.corner) {
          // erste Kurve: I ist die Eckparzelle (Blickrichtung hB quer zur Bahn). Länge s1 so, dass der zweite Bogen etwa gleich lang wird
          I.corner = true; I.turn = turn;
          const C = INST[I.idx + 1], thA = A.laneW, thC = (C && modeV(C.cfg.lane)) || thA;
          const sep = thA / 2 + thC / 2 + GASSE;
          const adv = I.camStart.z - I.camEnd.z;                              // Fahrt in der Ecke längs hB (negativ: Kamera endet vorn)
          const fE = Math.max(10, .5 * (I.camEnd.z - I.ext.min.z) + 4);        // zweiter Bogen beginnt erst nach dem größten Teil der Ecke
          let Q = A.axisPt.dot(hB) + sep - cE.dot(hB);                         // Querlage der nächsten Achse längs hB, gemessen ab cE
          // zweiter Bogen nominal fE + 8 lang (Spielraum für die Lage der Kamera in der nächsten Parzelle), der Rest ist s1
          let R = Q - adv; if (R < 14 + fE + 10) { Q += 14 + fE + 10 - R; R = 14 + fE + 10; }
          const s1 = Math.max(14, Math.min(R - fE - 10, R / 2));
          let best = null;
          for (let f = fMin; f < fMin + 160 && !best; f += .5) { const O = place(f, s1); if (freeRect(worldRect(I.lf, O, I.rot), I)) best = { f, s: s1, O }; }
          if (!best) { best = { f: fMin, s: s1, O: place(fMin, s1) }; console.warn("Anordnung: keine freie Lage für", I.name); }
          I.O.copy(best.O); I.arc = { f: best.f, s: best.s }; I.Q = Q; I.adv = adv; I.fE = fE; I.laneW = 0;
          setXf(I);
        } else {
          // zweite Kurve: I ist die erste Parzelle der nächsten Bahn, ihre Mitte liegt genau auf deren Achse
          I.turn = turn;
          const uC = rightOf(I), cx = (I.lf[0] + I.lf[1]) / 2;
          const f = A.Q - A.arc.s - A.adv + turn * (cx - I.camStart.x);        // Herleitung: Querlage der Mitte = Achse, siehe oben
          if (f < A.fE - .01) console.warn("Anordnung: Bogen zu kurz vor", I.name, f.toFixed(1), "<", A.fE.toFixed(1));
          let best = null;
          for (let s = 14; s < 200 && !best; s += .5) { const O = place(f, s); if (freeRect(worldRect(I.lf, O, I.rot), I)) best = { f, s, O }; }
          if (!best) { best = { f, s: 14, O: place(f, 14) }; console.warn("Anordnung: keine freie Lage für", I.name); }
          I.O.copy(best.O); I.arc = { f: best.f, s: best.s }; I.laneW = modeV(I.cfg.lane) || INST[I.idx - 2].laneW;
          setXf(I); I.axisPt = latOf(I);
        }
      }
    }
    I.fp = worldRect(I.lf, I.O, I.rot);
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
        let bx = per.get(nd); if (!bx) { bx = new THREE.Box3(); per.set(nd, bx); } bx.expandByPoint(v.clone().applyMatrix4(I.M4));
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
    const all = []; for (const X of INST) if (X.boxes && X.idx <= B.idx) all.push(...X.boxes);
    for (let k = 1; k < 60; k++) {
      st.q = k / 60; poseOf(st, c, t);
      const bump = 16 * st.q * st.q * (1 - st.q) * (1 - st.q); if (bump < .25) continue;
      for (const bx of all) {
        if (c.x < bx.min.x - 1 || c.x > bx.max.x + 1 || c.z < bx.min.z - 1 || c.z > bx.max.z + 1) continue;
        need = Math.max(need, (bx.max.y + 2 - c.y) / bump + ((B.trVel && B.trVel.lift) || 0));
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
    // Schluss: Zoom-out aus der letzten Stellung zur Karte (letztes Fünftel steht), danach ist die Seite zu Ende
    const ZL = ZOOM[narrow ? "n" : "d"];
    SEGS.push({ kind: "z", i: INST.length - 1, v0: acc, v1: acc + ZL }); acc += ZL;
    TOTAL = acc;
    for (const s of SEGS) { s.p0 = s.v0 / TOTAL; s.p1 = s.v1 / TOTAL; }
    INST.forEach(I => { I.body = SEGS.find(s => s.kind === "b" && s.i === I.idx); I.trIn = SEGS.find(s => s.kind === "t" && s.i === I.idx) || null; });
    ZSEG = SEGS[SEGS.length - 1];
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
    out.push({ name: "uebersicht", label: "Übersicht", p: 1, main: false });                 // die stehende Karte am Seitenende
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
    if (st.kind === "z") return I.idx < st.i ? I.bMax : I.bLast + (I.bMax - I.bLast) * sm(st.q * 3);
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
  const _c = V(), _t = V(), _c2 = V(), _t2 = V();
  const wrapPi = a => { a = (a + PI) % (2 * PI); if (a < 0) a += 2 * PI; return a - PI; };
  const yawOf = v => Math.atan2(v.x, -v.z), pitchOf = v => Math.atan2(-v.y, Math.hypot(v.x, v.z));
  const dirAng = (yaw, pitch, out) => out.set(Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  // Ableitung der Hermite-Kurve nach s (Fahrtrichtung)
  function hermiteD(p0, m0, p1, m1, s, out) {
    const s2 = s * s;
    return out.set(0, 0, 0).addScaledVector(p0, 6 * s2 - 6 * s).addScaledVector(m0, 3 * s2 - 4 * s + 1).addScaledVector(p1, 6 * s - 6 * s2).addScaledVector(m1, 3 * s2 - 2 * s);
  }
  const smoother = x => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  const _d = V(), _c0 = V();
  // Überblickspose eines Übergangs: Kamera, die die Inhalte (ext: Bogen und Bauteile) der verlassenen und der kommenden Parzelle gemeinsam mittig fasst;
  // Neigung 42°, Blick quer zur Achse der beiden (A unten/B oben im Bild wäre schmal), Abstand per Projektion so, dass beide etwa 70 % des Rahmens füllen
  const _fp = { cam: V(), yaw: 0, pitch: 0, dist: 1, fov: 36, set(f, dr) { this.cam.copy(f.cam).addScaledVector(f.shift, dr); this.yaw = f.yaw; this.pitch = f.pitch; this.dist = f.dist; this.fov = f.fov; return this; } };
  const FIT = { pitch: 44, fov: 50, fovN: 62, w: .65, wN: .84, h: .85 };       // Überblick im Flug: Neigung, Sichtfeld, Anteil der Rahmenbreite (hochkant breiter)
  function fitPair(A, B, chord, yaw0, yaw1) {
    const pts = [];
    for (const S of [A, B]) for (const x of [S.ext.min.x, S.ext.max.x]) for (const y of [S.ext.min.y, S.ext.max.y]) for (const z of [S.ext.min.z, S.ext.max.z]) pts.push(V(x, y, z).applyMatrix4(S.M4));
    const bb = new THREE.Box3().setFromPoints(pts), ctr = bb.getCenter(V());
    const cA = A.ext.getCenter(V()).applyMatrix4(A.M4), cB = B.ext.getCenter(V()).applyMatrix4(B.M4), ax = cB.clone().sub(cA).setY(0);
    const yaw = yaw0 + wrapPi(yaw1 - yaw0) * .5;                  // Blickrichtung in der Mitte zwischen Anfang und Ende der Fahrt: die Drehung bleibt gleichmäßig
    const pitch = FIT.pitch * PI / 180, fov = Math.max(narrow ? FIT.fovN : FIT.fov, (fovOf(A) + fovOf(B)) / 2), W = VW(), H = VH(), fwd = dirAng(yaw, pitch, V());
    const tc = new THREE.PerspectiveCamera(fov, W / H, .1, 3000), c0 = ctr.clone();
    const place = (c, d) => { tc.position.copy(c).addScaledVector(fwd, -d); tc.lookAt(c); tc.updateMatrixWorld(); tc.updateProjectionMatrix(); };
    const box = () => { let a = 1e9, b = -1e9, c = 1e9, e = -1e9; for (const p of pts) { const v = p.clone().project(tc); a = Math.min(a, v.x); b = Math.max(b, v.x); c = Math.min(c, v.y); e = Math.max(e, v.y); } return [a, b, c, e]; };
    // Rahmen wie die Lesestellen (oben 64 px, unten 70 px); Breite und Höhe der Inhalte höchstens 70 % des Rahmens
    const fh = (H - 134) / H, fits = d => { place(c0, d); const [a, b, c, e] = box(); return (b - a) <= 2 * (narrow ? FIT.wN : FIT.w) && (e - c) <= 2 * fh * FIT.h; };
    let d = 40;
    for (let it = 0; it < 3; it++) {
      let lo = 8, hi = 800; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (fits(m)) hi = m; else lo = m; }
      d = hi; place(c0, d); const [a, b, c, e] = box();
      const ty = (64 - 70) / H, ox = (a + b) / 2, oy = (c + e) / 2 - ty, hh = d * Math.tan(fov * PI / 360), ww = hh * (W / H);
      c0.addScaledVector(V().setFromMatrixColumn(tc.matrixWorld, 0), ox * ww).addScaledVector(V().setFromMatrixColumn(tc.matrixWorld, 1), oy * hh);
    }
    return { tgt: c0.clone(), cam: c0.clone().addScaledVector(fwd, -d), fov, yaw, pitch, dist: d, shift: cB.clone().sub(cA).setY(0) };
  }
  function poseOf(st, cam, tgt) {
    const I = INST[st.i];
    if (st.kind === "b") { localPose(I, st.q, cam, tgt); cam.applyMatrix4(I.M4); tgt.applyMatrix4(I.M4); return fovOf(I); }
    // nach der letzten Szene (Schluss-Zoom, Karte): die Kamera startet an der letzten Stellung der letzten Szene, die Karte blendet kern (blendMap)
    if (st.kind === "z") { localPose(I, 1, cam, tgt); cam.applyMatrix4(I.M4); tgt.applyMatrix4(I.M4); return fovOf(I); }
    const A = INST[st.i - 1], B = I, tr = B.trIn, Lt = tr.p1 - tr.p0;
    const d = 1e-3;
    const turn = Math.abs(B.rot - A.rot) > 1e-6 && !!B.arc;
    const toW = (S, v) => v.clone().applyMatrix4(S.M4);
    // Enden und Geschwindigkeiten (je Einheit p der ganzen Seite) aus den Bahnen der beiden Szenen, in Weltrichtung
    const vel = (S, q0, q1) => { const a = V(), at = V(), b = V(), bt = V(); localPose(S, q0, a, at); localPose(S, q1, b, bt); a.applyMatrix4(S.M4); at.applyMatrix4(S.M4); b.applyMatrix4(S.M4); bt.applyMatrix4(S.M4); const k = Lt / ((S.body.p1 - S.body.p0) * (q1 - q0)); return [b.sub(a).multiplyScalar(k), bt.sub(at).multiplyScalar(k)]; };
    const P0 = toW(A, A.camEnd), T0 = toW(A, A.tgtEnd), P1 = toW(B, B.camStart), T1 = toW(B, B.tgtStart);
    if (!B.trVel || B.trVelKey !== aspect) {
      const [m0, n0] = vel(A, 1 - d, 1), [m1, n1] = vel(B, 0, d), ch = P1.clone().sub(P0);
      if (!turn) {
        // Tangenten zähmen: nichts gegen die Fahrtrichtung (sonst schlägt die Kurve eine Schleife oder taucht unter den Bogen),
        // höchstens 0,6 der Sehne. Wo gezähmt wird, ändert sich die Richtung an der Szenengrenze ein wenig (Geschwindigkeit dort klein:
        // Anfang und Ende jeder Szene sind langsam)
        const tame = (m, c) => { const L = c.length(), u = c.clone().normalize(), a = m.dot(u); if (a < 0) m.addScaledVector(u, -a); if (m.length() > .6 * L) m.setLength(.6 * L); return m; };
        tame(m0, ch); tame(m1, ch); tame(n0, T1.clone().sub(T0)); tame(n1, T1.clone().sub(T0));
        B.trVel = { m0, n0, m1, n1, lift: 0 };
      } else {
        // Kurve: Viertelbogen aus A hinaus (Länge f in Blickrichtung von A) und in B hinein (Länge s in Blickrichtung von B); Blick folgt der Fahrtrichtung
        const hA = headOf(A), hB = headOf(B), f = Math.max(2, ch.dot(hA)), s = Math.max(2, ch.dot(hB));
        m0.x = hA.x * 1.657 * f; m0.z = hA.z * 1.657 * f; m1.x = hB.x * 1.657 * s; m1.z = hB.z * 1.657 * s;
        const my = 1.2 * Math.abs(ch.y); m0.y = clamp(m0.y, -my, my); m1.y = clamp(m1.y, -my, my);
        const D0 = T0.clone().sub(P0), D1 = T1.clone().sub(P1), psi0 = yawOf(hA), psi1 = psi0 + wrapPi(yawOf(hB) - psi0);
        const y0 = yawOf(D0), y1 = yawOf(D1);
        B.trVel = { m0, n0, m1, n1, lift: 0, psi0, psi1,
          off0: wrapPi(y0 - psi0), off1: wrapPi(y1 - psi1), p0: pitchOf(D0), p1: pitchOf(D1), d0: D0.length(), d1: D1.length() };
        // Bogenlänge: die Fahrt läuft gleichmäßig auf dem Bogen (Hermite-Parameter allein bündelt die Drehung am engen Ende)
        const cum = new Float32Array(65), a0 = V(), a1 = V(); hermite(P0, m0, P1, m1, 0, a0);
        for (let k = 1; k <= 64; k++) { hermite(P0, m0, P1, m1, k / 64, a1); cum[k] = cum[k - 1] + a1.distanceTo(a0); a0.copy(a1); }
        B.trVel.cum = cum;
      }
      // Überblick in jedem Übergang: in der Mitte steht die Kamera so (Neigung 42°, Blick quer zur Achse der beiden Parzellen), dass die Inhalte der
      // verlassenen und der kommenden Parzelle (ext: Bogen und Bauteile) zusammen mittig etwa 70 % der Bildbreite einnehmen (fitPair); dorthin blendet der Flug
      const tvn = B.trVel; tvn.cA = A.ext.getCenter(V()).applyMatrix4(A.M4); tvn.cB = B.ext.getCenter(V()).applyMatrix4(B.M4);
      tvn.lift = 0; tvn.back = 0; tvn.fit = fitPair(A, B, P1.clone().sub(P0), yawOf(T0.clone().sub(P0)), yawOf(T1.clone().sub(P1)));
      B.trVelKey = aspect;
    }
    // Kurven: sanfter Anlauf und Auslauf (Tempo am Rand 60 %, in der Mitte 140 % des mittleren), sonst springt das Tempo an der Szenengrenze
    const tv = B.trVel;
    let q = turn ? st.q - .4 * Math.sin(2 * PI * st.q) / (2 * PI) : st.q;
    if (turn && tv.cum) {                                                // Anteil der Bogenlänge → Hermite-Parameter
      const cum = tv.cum, target = q * cum[64]; let lo = 0, hi = 64; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= target) lo = mid; else hi = mid; }
      q = (lo + (target - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo])) / 64;
    }
    const q16 = 16 * q * q * (1 - q) * (1 - q);
    hermite(P0, tv.m0, P1, tv.m1, q, cam);
    if (!turn) hermite(T0, tv.n0, T1, tv.n1, q, tgt);
    else {
      // Blick: Fahrtrichtung der Bahn plus der Versatz der beiden Enden; Neigung und Abstand vergrößern sich über der Mitte (Blick auf den Tisch)
      hermiteD(P0, tv.m0, P1, tv.m1, q, _d);
      const psi = tv.psi0 + wrapPi(yawOf(_d) - tv.psi0), e = smoother(q), bump = 4 * q * (1 - q);
      const yaw = psi + tv.off0 + (tv.off1 - tv.off0) * e, pitch = tv.p0 + (tv.p1 - tv.p0) * e + .2 * bump, dist = (tv.d0 + (tv.d1 - tv.d0) * e) * (1 + .5 * bump);
      dirAng(yaw, pitch, _c0); tgt.copy(cam).addScaledVector(_c0, dist);
    }
    // Überblick: Plateau in der Mitte (Anteil wFit), sonst die Bahn der Szenen; Kamera, Ziel und Sichtfeld blenden zur Überblickspose
    // Die Überblickspose wandert dabei langsam von der verlassenen zur kommenden Parzelle (±12 % ihres Abstands), die Fahrt steht nie
    const fit = tv.fit, wFit = smoother(Math.pow(Math.sin(PI * st.q), .75)), dr = .12 * (2 * st.q - 1);
    const fovP = fovOf(A) + (fovOf(B) - fovOf(A)) * sm(st.q);
    const ap = Math.max(B.cfg.apex || 0, B.apex || 0); if (ap) cam.y += ap * q16;   // Mindesthöhe über Bauteilen (clearance), ohne Knick an den Enden
    return wFit > 0 ? blendPose(cam, tgt, fovP, _fp.set(fit, dr), wFit) : fovP;
  }

  // ---------- Roter Faden ----------
  // Ein Faden durch alle Szenen: je Szene Eingang (Vorderkante des Bogens), der eigene Faden der Szene (def.thread) und Ausgang
  // (Hinterkante), dazwischen Brücken über die Lücke. Stücke laufen nach b ihrer Szene oder nach dem Anteil eines Übergangs.
  const pieces = [];
  let dot = null;
  const tmat = new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const THREAD_HW = .022;
  let threadHW = THREAD_HW;
  function ribbon(pts) {
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5);
    const len = curve.getLength(), N = Math.round(clamp(len * 18, 24, 1400)), sp = curve.getSpacedPoints(N);
    const pos = new Float32Array((N + 1) * 6), idx = [];
    // fill(hw): Halbbreite des Bandes neu schreiben (in der Karte wächst sie mit dem Abstand, damit der Faden ~2,5 px breit bleibt)
    const fill = hw => {
      for (let i = 0; i <= N; i++) {
        const p = sp[i], q = sp[Math.min(N, i + 1)], r = sp[Math.max(0, i - 1)];
        const d = V().subVectors(q, r); const vert = Math.abs(d.y) > .5 * d.length();
        let sd;
        if (vert) sd = V(hw, 0, 0); else { d.y = 0; d.normalize(); sd = V().crossVectors(d, UP).multiplyScalar(hw); }
        pos.set([p.x - sd.x, p.y, p.z - sd.z, p.x + sd.x, p.y, p.z + sd.z], i * 6);
      }
    };
    fill(THREAD_HW);
    for (let i = 0; i < N; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const mesh = new THREE.Mesh(g, tmat); mesh.renderOrder = 2; mesh.frustumCulled = false; scene.add(mesh);
    return { curve, N, g, mesh, fill };
  }
  // Punkt (x, z) oder (x, y, z) in Szenenkoordinaten → Welt
  const wpt = (I, a) => (a.isVector3 ? a.clone() : a.length === 3 ? V(a[0], a[1], a[2]) : V(a[0], .004, a[1])).applyMatrix4(I.M4);
  function addPiece(I, pts, time) {
    if (pts.length < 2) return;
    const r = ribbon(pts); r.time = time; r.I = I; r.end = pts[pts.length - 1].clone(); pieces.push(r);
  }
  // Weg des Fadens über den Tisch von der Hinterkante von A zur Vorderkante von I: in Blickrichtung von A hinaus, bei einer Kurve rechtwinklig
  // mit gerundeter Ecke in Blickrichtung von I hinein (der Faden läuft in der Gasse zwischen den Parzellen)
  function bridge(A, I) {
    const e0 = A.exit.clone(), e1 = I.entry.clone(), hA = headOf(A), hB = headOf(I), dv = e1.clone().sub(e0);
    const a = dv.dot(hA), b = dv.dot(hB);
    if (Math.abs(I.rot - A.rot) > 1e-6 && b > 6) {
      // Kurve: Weg in der Gasse mit gerundeten Ecken. Koordinaten (u längs hA, v längs hB) ab dem Austritt: erst in Blickrichtung von A hinaus,
      // dann quer, dann (liegt der Eintritt hinter dem Austritt, a < 6) ein Stück zurück und in Blickrichtung von I hinein zum Eintritt
      const v1 = clamp(b * .5, 3, b - 3);
      // kaum Versatz längs hA (a < 4): fast gerade Verbindung, ein Knick wäre schärfer als der Versatz
      if (a > -2 && a < 4) return [e0, e0.clone().lerp(e1, .33), e0.clone().lerp(e1, .66), e1];
      const wp = a >= 4 ? [[0, 0], [a, 0], [a, b]] : [[0, 0], [8, 0], [8, v1], [a, v1], [a, b]];
      const W = wp.map(([u, v]) => e0.clone().addScaledVector(hA, u).addScaledVector(hB, v));
      W[W.length - 1].copy(e1); for (const w of W) w.y = .004; W[0].copy(e0);
      return roundPath(W, 4.5);
    }
    // geradeaus (auch mit seitlichem Versatz): S-Kurve, die in Blickrichtung ausläuft und einläuft
    if (a < 6) return [e0, e0.clone().lerp(e1, .5), e1];
    const k = Math.min(8, Math.max(2, a / 3)), p1 = e0.clone().addScaledVector(hA, k), p2 = e1.clone().addScaledVector(hA, -k);
    return [e0, p1, e0.clone().lerp(e1, .5), p2, e1];
  }
  // Polygonzug mit gerundeten Ecken: je Ecke zwei Punkte im Abstand r (höchstens 40 % der Schenkel) und eine abgeschnittene Mitte
  function roundPath(W, r) {
    const out = [W[0]];
    for (let i = 1; i < W.length - 1; i++) {
      const c = W[i], din = c.clone().sub(W[i - 1]), dout = W[i + 1].clone().sub(c), li = din.length(), lo = dout.length();
      din.normalize(); dout.normalize();
      const rr = Math.min(r, .48 * li, .48 * lo), p0 = c.clone().addScaledVector(din, -rr), p1 = c.clone().addScaledVector(dout, rr);
      const bez = t => p0.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(c, 2 * t * (1 - t)).addScaledVector(p1, t * t);   // Viertelbogen als quadratische Kurve
      out.push(out[out.length - 1].clone().lerp(p0, .5), p0, bez(.25), bez(.5), bez(.75), p1);
    }
    out.push(out[out.length - 1].clone().lerp(W[W.length - 1], .5), W[W.length - 1]);
    return out;
  }
  function buildThreadFor(I) {
    if (!dot) {
      dot = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, depthTest: false })); dot.renderOrder = 6; dot.visible = false; scene.add(dot);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.95, 48), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, depthTest: false, transparent: true, opacity: .75 })); ring.renderOrder = 6; ring.visible = false; dot.add(ring); dot.userData.ring = ring;
    }
    const f = I.cfg.faden ? I.cfg.faden(I.def, I) : null; if (!f) return;
    const own = I.cfg.ownThread === false ? null : I.def.thread;
    const ownPts = own ? own.pts.slice(f.ownFrom || 0).map(p => p.clone().applyMatrix4(I.M4)) : null;
    I.entry = f.in ? wpt(I, f.in) : (ownPts ? ownPts[0] : null);
    // own.arms / own.post (Eröffnung): der Faden verzweigt sich; Arme laufen von der Teilung (Ende von pts) zur Vereinigung (Anfang von post)
    const postPts = own && own.post ? own.post.pts.map(p => p.clone().applyMatrix4(I.M4)) : null;
    I.exit = f.out ? wpt(I, f.out) : (postPts ? postPts[postPts.length - 1] : ownPts ? ownPts[ownPts.length - 1] : null);
    // Brücke aus der vorigen Szene: läuft im zweiten Teil der Fahrt hinüber
    const A = INST[I.idx - 1];
    if (A && A.exit && I.entry) addPiece(I, bridge(A, I), { tr: I.idx, s0: .3, s1: 1 });
    const outTime = (b1) => b1 + .06 <= I.bMax ? { I, b0: b1, b1: b1 + .06 } : { tr: I.idx + 1, s0: 0, s1: .3 };
    if (ownPts) {
      const t0 = Math.max(own.t0, I.b0), t1 = Math.max(own.t1, t0 + .01);
      if (f.in) addPiece(I, [I.entry, ...(f.viaPre || []).map(a => wpt(I, a)), ownPts[0]], { I, b0: Math.max(I.b0, t0 - .05), b1: t0 });
      addPiece(I, ownPts, { I, b0: t0, b1: Math.min(t1, I.bMax), lin: !!own.lin });
      if (own.arms) for (const a of own.arms) addPiece(I, a.pts.map(p => p.clone().applyMatrix4(I.M4)), { I, b0: a.t0, b1: a.t1, lin: !!a.lin });
      if (postPts) addPiece(I, postPts, { I, b0: own.post.t0, b1: own.post.t1, lin: !!own.post.lin });
      if (f.out) addPiece(I, [ownPts[ownPts.length - 1], ...(f.viaPost || []).map(a => wpt(I, a)), I.exit], outTime(Math.min(t1, I.bMax)));
    } else if (I.entry && I.exit) {
      addPiece(I, [I.entry, ...(f.via || []).map(a => wpt(I, a)), I.exit], { tr: I.idx + 1, s0: 0, s1: .3 });
    }
  }
  function updateThread(st) {
    let last = null;
    // Karte: Faden und Punkt behalten eine feste Größe in Pixeln (Faden ~2,5 px breit, Punkt ~7 px Radius mit dünnem Ring)
    const kk = smoother(win(Mcur, .25, .85)), mp0 = kk > 0 ? mapPose() : null;
    const wpp = mp0 ? 2 * Math.tan(camera.fov * PI / 360) * camera.position.distanceTo(mp0.tgt) / VH() : 0;
    const hwT = THREAD_HW + (Math.max(THREAD_HW, 1.3 * wpp) - THREAD_HW) * kk;
    if (Math.abs(hwT - threadHW) > .004 * Math.max(1, threadHW / THREAD_HW) || (kk === 0 && threadHW !== THREAD_HW)) {
      threadHW = hwT; for (const pc of pieces) { pc.fill(hwT); pc.g.attributes.position.needsUpdate = true; }
    }
    for (const pc of pieces) {
      const tm = pc.time; let k;
      if (tm.tr !== undefined) k = tm.tr >= INST.length ? 0 : sm(win(sInto(tm.tr, st), tm.s0, tm.s1 - tm.s0));
      else { const b = bOf(tm.I, st), w0 = win(b, tm.b0, Math.max(1e-4, tm.b1 - tm.b0)); k = tm.lin ? w0 : sm(w0); }
      pc.mesh.visible = k > 0;
      pc.g.setDrawRange(0, Math.floor(k * pc.N) * 6);
      if (k > 0) last = { pc, k };
    }
    dot.visible = !!last;
    if (last) {
      last.pc.curve.getPointAt(last.k, dot.position);
      dot.quaternion.copy(camera.quaternion);
      const dd = camera.position.distanceTo(dot.position), rN = Math.max(.05, dd * .0065), rM = 7 * 2 * Math.tan(camera.fov * PI / 360) * dd / VH();
      dot.scale.setScalar(rN + (rM - rN) * kk); if (dot.userData.ring) dot.userData.ring.visible = kk > .3;
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

  // ---------- Tisch und Karte ----------
  // Der Tisch ist der gemeinsame Bogen unter allen Parzellen (etwas dunkler als die Bögen der Szenen, mit Haarkante und weichem Schatten).
  // Die Karte ist die halb isometrische Draufsicht auf den ganzen Tisch: Zustand M (0 = Fahrt der Seite, 1 = Karte). M kommt aus dem Schluss-
  // Zoom (Segment "z", an p gebunden) oder aus dem Knopf „Übersicht“ (Mextra, zeitlich geglättet); die Kamera blendet von ihrer Stellung zur
  // Kartenstellung (zuerst hoch, dann seitlich, die Blickrichtung dreht ruhig über die Mitte).
  let Muser = 0, Mextra = 0, MAP = null, table = null;
  const mSeg = st => st.kind === "z" ? smoother(win(st.q, 0, .8)) : 0;
  let mapOK = true, revealN = 0, lowRatio = false;                       // lowRatio: in der Karte geringere Pixeldichte (weniger Füllrate)                                        // mapOK: bricht ein Teil der Karte, bleibt die Seite ohne Karte nutzbar
  const mNow = st => mapOK ? Math.max(mSeg(st), Mextra) : 0;
  function mapFail(e) {
    console.error("Karte abgeschaltet:", e); dbg("Karte abgeschaltet: " + (e && e.message));
    if (!mapOK) return;
    mapOK = false; Muser = 0; Mextra = 0;
    try { const b = document.getElementById("uebersicht"); if (b && b.style) b.style.display = "none"; const k = document.getElementById("karte"); if (k && k.style) k.style.display = "none"; } catch (e2) { /* nichts */ }
  }
  const TM = 5.5;                                                       // Rand des Tisches um die Parzellen (der Faden läuft nirgends näher an der Kante)
  const KARTE = { d: { pitch: 40, yaw: 16, fov: 25 }, n: { pitch: 60, yaw: 0, fov: 30 } };
  function tableRect() {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, h = 0;
    for (const I of INST) if (I.built && I.fp) { x0 = Math.min(x0, I.fp[0]); x1 = Math.max(x1, I.fp[1]); z0 = Math.min(z0, I.fp[2]); z1 = Math.max(z1, I.fp[3]); h = Math.max(h, I.ext.max.y); }
    x0 -= TM; x1 += TM; z0 -= TM; z1 += TM;
    // der Faden hält mindestens 5 Einheiten Abstand zur Tischkante
    for (const pc of pieces) for (const pt of pc.curve.getPoints(12)) { x0 = Math.min(x0, pt.x - 5); x1 = Math.max(x1, pt.x + 5); z0 = Math.min(z0, pt.z - 5); z1 = Math.max(z1, pt.z + 5); }
    return { x0, x1, z0, z1, h };
  }
  function updateTable() {
    const R = tableRect(); if (R.x0 > R.x1) return;
    if (!table) {
      const g = new THREE.Group(), geo = new THREE.BoxGeometry(1, 1, 1);
      const body = new THREE.Mesh(geo, paperMaterial("#efebe3"));
      body.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .3, depthWrite: false })));
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), new THREE.ShaderMaterial({
        uniforms: { uSize: { value: new THREE.Vector2(1, 1) }, uHalf: { value: new THREE.Vector2(1, 1) }, uOff: { value: new THREE.Vector2(3.5, 4.5) }, uM: { value: 26 } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: "uniform vec2 uSize; uniform vec2 uHalf; uniform vec2 uOff; uniform float uM; varying vec2 vUv;\n" +
          "void main(){\n" +
          "  vec2 p = (vUv - 0.5) * uSize - uOff;\n" +
          "  float d = length(max(abs(p) - uHalf + vec2(8.0), 0.0)) - 8.0;\n" +
          "  float a = pow(1.0 - smoothstep(-4.0, uM, d), 1.8) * 0.22;\n" +
          "  if (a < 0.002) discard;\n" +
          "  gl_FragColor = vec4(0.19, 0.19, 0.2, a);\n" +
          "  #include <colorspace_fragment>\n" +
          "}", transparent: true, depthWrite: false }));
      sh.renderOrder = -2; sh.frustumCulled = false; body.frustumCulled = false;
      g.add(body, sh); scene.add(g); table = { g, body, sh };
    }
    const w = R.x1 - R.x0, d = R.z1 - R.z0, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
    table.body.scale.set(w, .05, d); table.body.position.set(cx, -.065, cz);
    table.sh.scale.set(w + 80, 1, d + 80); table.sh.position.set(cx, -.2, cz);
    table.sh.material.uniforms.uSize.value.set(w + 80, d + 80); table.sh.material.uniforms.uHalf.value.set(w / 2, d / 2);
    MAP = null;
  }
  // Kartenstellung: Blickrichtung fest (Neigung, Drehung um y), Abstand so, dass der ganze Tisch samt Bauteilen im Rahmen steht
  // (oben 74 px Kopfzeile, unten 82 px Knöpfe und Fortschritt), danach die Mitte in den Rahmen geschoben
  function mapPose() {
    const key = [aspect.toFixed(3), narrow, INST.filter(I => I.built).length, VW(), VH()].join();
    if (MAP && MAP.key === key) return MAP;
    const R = tableRect(), P = KARTE[narrow ? "n" : "d"], W = VW(), H = VH();
    const yaw = P.yaw * PI / 180, pitch = P.pitch * PI / 180, fwd = dirAng(yaw, pitch, V());
    const ctr = V((R.x0 + R.x1) / 2, 0, (R.z0 + R.z1) / 2), pts = [];
    for (const x of [R.x0, R.x1]) for (const z of [R.z0, R.z1]) for (const y of [-.2, R.h + 1]) pts.push(V(x, y, z));
    const tc = new THREE.PerspectiveCamera(P.fov, W / H, 1, 6000);
    const mx = 2 * 14 / W, mt = 2 * 62 / H, mb = 2 * 74 / H;
    const place = (c, d) => { tc.position.copy(c).addScaledVector(fwd, -d); tc.lookAt(c); tc.updateMatrixWorld(); tc.updateProjectionMatrix(); };
    const box = () => { let a = 1e9, b = -1e9, c = 1e9, e = -1e9; for (const p of pts) { const v = p.clone().project(tc); a = Math.min(a, v.x); b = Math.max(b, v.x); c = Math.min(c, v.y); e = Math.max(e, v.y); } return [a, b, c, e]; };
    let c0 = ctr.clone(), d = 100;
    const fits = dd => { place(c0, dd); const [a, b, c, e] = box(); return a >= -1 + mx && b <= 1 - mx && c >= -1 + mb && e <= 1 - mt; };
    for (let it = 0; it < 3; it++) {
      let lo = 5, hi = 3000; for (let k = 0; k < 34; k++) { const m = (lo + hi) / 2; if (fits(m)) hi = m; else lo = m; }
      d = hi; place(c0, d); const [a, b, c, e] = box();
      // Mitte des Kastens soll auf der Mitte des freien Rahmens liegen: Ziel entlang rechts/oben verschieben
      const ty = (mb - mt) / 2, ox = (a + b) / 2, oy = (c + e) / 2 - ty;
      const hh = d * Math.tan(P.fov * PI / 360), ww = hh * (W / H), right = V().setFromMatrixColumn(tc.matrixWorld, 0), up = V().setFromMatrixColumn(tc.matrixWorld, 1);
      c0.addScaledVector(right, ox * ww).addScaledVector(up, oy * hh);
    }
    place(c0, d); d *= 1.015; dbg("Kartenstellung fertig, Abstand " + d.toFixed(0));
    MAP = { key, tgt: c0.clone(), cam: c0.clone().addScaledVector(fwd, -d), fov: P.fov, yaw, pitch, dist: d, R };
    return MAP;
  }
  // Kamera von der Fahrtstellung zur Kartenstellung blenden (M 0 … 1); verändert cam und tgt, liefert das Sichtfeld
  function blendMap(cam, tgt, fov, M) { return M <= 0 ? fov : blendPose(cam, tgt, fov, mapPose(), M); }
  // allgemein: von der Stellung (cam, tgt, fov) zur Stellung mp = { cam, yaw, pitch, dist, fov } blenden (M 0 … 1): zuerst hoch, dann seitlich,
  // Blickrichtung (Drehung, Neigung) und Abstand in Winkeln und Logarithmen, nicht als Punkte (sonst schwenkt der Blick am Rand schneller)
  function blendPose(cam, tgt, fov, mp, M) {
    const D = tgt.clone().sub(cam), yB = yawOf(D), pB = pitchOf(D), dB = Math.max(.5, D.length());
    const eY = smoother(win(M, 0, .72)), eXZ = smoother(win(M, .16, .84)), eO = smoother(win(M, .04, .96));
    cam.x += (mp.cam.x - cam.x) * eXZ; cam.z += (mp.cam.z - cam.z) * eXZ; cam.y += (mp.cam.y - cam.y) * eY;
    const yaw = yB + wrapPi(mp.yaw - yB) * eO, pitch = pB + (mp.pitch - pB) * eO, dist = Math.exp(Math.log(dB) + (Math.log(mp.dist) - Math.log(dB)) * eO);
    dirAng(yaw, pitch, _c0); tgt.copy(cam).addScaledVector(_c0, dist);
    return fov + (mp.fov - fov) * eO;
  }

  // Texturen: entfernte Szenen (und alle in der Karte) zeigen ihre Drucke in kleiner Auflösung (höchstens 512 px Kantenlänge), nahe Szenen
  // voll. Der Tausch kostet ein neues Hochladen, daher höchstens LOD_BUDGET Drucke je Bild; kleine Texturen werden gleich hochgeladen.
  const LOD_BUDGET = 3;
  // Druck auf Auflösung sx (1 oder SMALL) bringen: neu zeichnen (unter ctx.scale), altes Canvas freigeben, Textur neu hochladen
  function setScale(pr, sx, warm) {
    const tex = pr.map; if (!tex || !pr.mk || pr.sc === sx) return;
    const old = tex.image, cv = pr.mk(sx);
    tex.image = cv; tex.dispose(); tex.needsUpdate = true; pr.sc = sx;
    if (old && old !== cv) { old.width = 0; old.height = 0; }
    if (sx < 1 && warm && renderer.initTexture && !pr.mesh.visible) { try { renderer.initTexture(tex); } catch (e) { /* kein Vorwärmen */ } }
  }
  function lodStep(full, cur) {
    let budget = LOD_BUDGET;
    for (const I of INST) {
      if (!I.built) continue;
      const small = !full.has(I.idx);
      if (I.lodSmall === small && I.lodPos === undefined) continue;
      if (I.lodPos === undefined || I.lodTarget !== small) { I.lodPos = 0; I.lodTarget = small; }
      const free = I.idx === cur;                                   // die Szene, in der die Kamera ist, wird sofort voll (sonst Unschärfe)
      while (I.lodPos < I.prints.length && (budget > 0 || free)) { const pr = I.prints[I.lodPos++]; if (pr.mk) { setScale(pr, small ? SMALL : 1, true); if (!free) budget--; } }
      if (I.lodPos >= I.prints.length) { I.lodSmall = small; I.lodPos = undefined; }
      if (budget <= 0 && !(I.idx === cur)) return;
    }
  }

  // ---------- Übersicht: anklickbare Parzellen (SVG über der Karte) ----------
  const SVGNS = "http://www.w3.org/2000/svg";
  let cards = [], cardHost = null, hereI = null;
  function buildCards() {
    cards = []; cardHost = document.getElementById("karte");
    if (!cardHost || !cardHost.appendChild || !document.createElementNS) { cardHost = null; return; }
    while (cardHost.firstChild) cardHost.removeChild(cardHost.firstChild);
    INST.forEach(I => {
      const a = document.createElementNS(SVGNS, "a"), poly = document.createElementNS(SVGNS, "polygon"), txt = document.createElementNS(SVGNS, "text"), rect = document.createElementNS(SVGNS, "rect");
      a.setAttribute("href", "#s=" + I.name); a.setAttribute("data-scene", I.name); a.setAttribute("tabindex", "-1");
      a.setAttribute("aria-label", (I.idx + 1) + ". " + I.cfg.label);
      txt.textContent = (I.idx + 1 < 10 ? "0" : "") + (I.idx + 1) + "  " + (I.cfg.short || I.cfg.label);
      rect.setAttribute("rx", 2); rect.setAttribute("ry", 2);
      a.appendChild(poly); a.appendChild(rect); a.appendChild(txt); cardHost.appendChild(a);
      cards.push({ I, a, poly, txt, rect, tw: 0, twW: 0 });
    });
  }
  // Fläche der Parzelle (Bogen, beschnitten) als Viereck der Welt
  function cardCorners(I) {
    if (I.card) return I.card;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    const cl = I.clip || [-1e5, 1e5, -1e5, 1e5];
    for (const s of I.sheetBox) { const a = Math.max(s[0], cl[0]), b = Math.min(s[1], cl[1]), c = Math.max(s[2], cl[2]), d = Math.min(s[3], cl[3]); if (b > a && d > c) { x0 = Math.min(x0, a); x1 = Math.max(x1, b); z0 = Math.min(z0, c); z1 = Math.max(z1, d); } }
    if (x0 > x1) { x0 = I.ext.min.x; x1 = I.ext.max.x; z0 = I.ext.min.z; z1 = I.ext.max.z; }
    return I.card = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => V(x, 0, z).applyMatrix4(I.M4));
  }
  function updateCards(M, active) {
    if (!cardHost) return;
    const W = VW(), H = VH();
    cardHost.setAttribute("viewBox", "0 0 " + W + " " + H);
    cardHost.style.opacity = String(clamp((M - .55) / .4, 0, 1));
    for (const c of cards) {
      if (!c.I.built) continue;
      const pts = cardCorners(c.I).map(p => { const v = p.clone().project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; });
      c.poly.setAttribute("points", pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "));
      // Beschriftung als kleine Papier-Pille vor der Vorderkante (unter der Parzelle), nie auf der Miniatur
      const cx = pts.reduce((a, p) => a + p[0], 0) / 4, yb = Math.max(...pts.map(p => p[1])), ph = W < 560 ? 17 : 21;
      if (!c.tw || c.twW !== W) { c.twW = W; c.tw = c.txt.getComputedTextLength ? c.txt.getComputedTextLength() : c.txt.textContent.length * 6.5; if (!c.tw) c.tw = c.txt.textContent.length * 6.5; }
      const ly = Math.min(yb + 4 + ph / 2, H - 80), lx = clamp(cx, c.tw / 2 + 12, W - c.tw / 2 - 12), bw = c.tw + 14;
      c.txt.setAttribute("x", lx.toFixed(1)); c.txt.setAttribute("y", (ly + .5).toFixed(1));
      c.rect.setAttribute("x", (lx - bw / 2).toFixed(1)); c.rect.setAttribute("y", (ly - ph / 2).toFixed(1)); c.rect.setAttribute("width", bw.toFixed(1)); c.rect.setAttribute("height", ph);
      c.a.setAttribute("tabindex", active ? "0" : "-1");
      if (c.a.classList) c.a.classList.toggle("hier", c.I === hereI);
    }
  }

  // ---------- Bild zu einem Zustand ----------
  const visible = new Set(), _pp = V(), _nn = V(), _vv = V();
  const FOREIGN_S = [70, 140], FOREIGN = [70, 140];                    // Dunst der Nachbarszenen (wie FAR: Nachbarparzellen bleiben klar sichtbar, nur Schrift von hinten fällt weg)
  let state = null, Mcur = 0, lastApply = 0;
  // Text (nicht Bilder) nur ganz im Bild oder gar nicht; in der Karte zusätzlich erst ab ein paar Pixeln Höhe (sonst flimmert die Schrift)
  const textFactor = (pr, cw, ch, M) => {
    const fr = frameFrac(pr, cw, ch); let o = sm((fr.f - .985) / .014);
    if (M > .02 && fr.r) o *= sm((fr.r[3] - fr.r[1] - 3) / 5);
    return o;
  };
  function applyState(st, now, opts = {}) {
    // Karte: M > 0 zeigt alle Parzellen; sonst sichtbar: aktuelle Szene und ihre Nachbarn (im Übergang beide Szenen und die davor)
    const M = opts.M !== undefined ? opts.M : mNow(st), mapOn = M > .001;
    Mcur = M;
    if (!mapOn) revealN = 0; else if (opts.still) revealN = 99; else { revealN++; if (revealN <= INST.length + 1 || revealN % 30 === 0) dbg("Karte: aufgedeckt " + revealN + " M=" + M.toFixed(2)); }       // Karte: Parzellen erscheinen eine je Bild (Hochladen verteilen)
    const want = new Set(st.kind === "b" ? [st.i - 1, st.i, st.i + 1] : st.kind === "z" ? [st.i - 1, st.i] : [st.i - 2, st.i - 1, st.i, st.i + 1]);
    // nötig ist nur die aktuelle Szene (im Übergang: beide); Nachbarn erscheinen, sobald der Hintergrundbau sie fertig hat
    ensure(mapOn ? INST.length - 1 : st.i);
    visible.clear();
    for (const I of INST) {
      if (!I.built) continue;
      const on = mapOn ? (I.idx === st.i || I.idx < revealN) : want.has(I.idx);
      I.group.visible = on; if (on) visible.add(I);
    }
    if (!opts.still) {
      // volle Auflösung nur für die Szene der Kamera (im Übergang beide Enden, kurz vor dem Übergang schon die nächste)
      const full = new Set();
      if (!mapOn) { if (st.kind === "t") { full.add(st.i - 1); full.add(st.i); } else { full.add(st.i); if (st.kind === "b" && st.q > .6) full.add(st.i + 1); } }
      try { lodStep(full, st.i); } catch (e) { mapFail(e); }
    }
    hereI = INST[st.i];
    // Dunst: die Szene, in der die Kamera ist, sieht weit (FAR); Nachbarszenen werden ab FOREIGN ausgeblendet und tauchen beim Näherkommen auf
    const wOf = I => mapOn ? 1 : st.kind === "t" ? (I.idx === st.i ? sm(st.q) : I.idx === st.i - 1 ? 1 - sm(st.q) : 0) : I.idx === st.i ? 1 : 0;
    // Zeit der Lettern: läuft ab dem Eintreffen der Szene (Fahrt in die Szene beginnt)
    const time = now / 1000, dtS = Math.min(.05, Math.max(0, (now - lastApply) / 1000)); lastApply = now;
    for (const I of INST) if (I.built && I.tStart === undefined && (I.idx < st.i || (I.idx === st.i))) I.tStart = now;
    let fov = poseOf(st, camera.position, _t);
    if (mapOn) { try { fov = blendMap(camera.position, _t, fov, M); } catch (e) { mapFail(e); } }
    // Dunst der Ferne und Nahebene folgen der Karte (aus der Karte heraus: Vorgabe)
    const hz = smoother(win(M, 0, .5)); FAR.set(70 + 830 * hz, 140 + 1660 * hz);
    const nearV = .1 + 2.9 * smoother(win(M, .1, .6));
    if (camera.fov !== fov || camera.near !== nearV || camera.far !== 1500) { camera.fov = fov; camera.near = nearV; camera.far = 1500; camera.updateProjectionMatrix(); }
    if (!opts.still && M < 1) {
      // zwischen den Szenen atmet die Kamera ruhig; an Lesestellen steht sie ganz still (die Schrift soll das Auge fixieren können,
      // auf großen Monitoren wandert sie sonst um Subpixel). Travel ist dort nur im Scheitelpunkt 0, daher eine weiche Schwelle:
      // unter .15 (rund ±0,4 Glockenbreiten um die Stelle) kein Atem, ab .65 voll, dazwischen weich, ohne Ruck beim Losfahren
      const tv = st.kind === "b" ? sm((INST[st.i].def.travel(INST[st.i].def.uOfP(st.q)) - .15) / .5) : 1;
      const sway = clamp(camera.position.distanceTo(_t) / 20, .1, .8) * tv * (1 - M);
      camera.position.x += (Math.sin(time * .23) * .08 + Math.sin(time * .07) * .05) * sway;
      camera.position.y += Math.sin(time * .19 + 1) * .03 * sway;
    }
    camera.lookAt(_t);
    camera.updateMatrixWorld();
    const cw = VW(), ch = VH();
    for (const I of visible) {
      const wI = wOf(I);
      for (const bl of I.buildLines) bl.visible = wI >= .5;
      I.far.set(FOREIGN[0] + (FAR.x - FOREIGN[0]) * wI, FOREIGN[1] + (FAR.y - FOREIGN[1]) * wI);
      I.farS.set(FOREIGN_S[0] + (FAR.x - FOREIGN_S[0]) * wI, FOREIGN_S[1] + (FAR.y - FOREIGN_S[1]) * wI);
      // Uhr der Lettern: nach 6 s ist alles aufgestanden und jeder Abdruck geschlossen (danach rechnet das Modell nur, wenn sich b ändert)
      // Anzeige-b: bricht b beim Sprung aus der Karte um (Parzellen vorn bauen sich zurück), läuft es mit begrenztem Tempo nach
      let b = bOf(I, st);
      if (I.bShown === undefined || opts.still || (!mapOn && !I.easing)) { I.bShown = b; I.easing = false; }
      else {
        const stp = 1.3 * dtS, dlt = b - I.bShown;
        if (Math.abs(dlt) <= Math.max(1e-4, stp)) { I.bShown = b; I.easing = false; } else { I.bShown += Math.sign(dlt) * stp; I.easing = true; }
      }
      b = I.bShown;
      const tl = I.tStart === undefined ? 0 : Math.min(6, (now - I.tStart) / 1000);
      I.curB = b; I.curT = tl;
      I.M.update(b, tl);
      for (const m of I.bMats) { if (m.uniforms.uGB) m.uniforms.uGB.value = b; else m.uniforms.uB.value = b; }
      // def.linesFrom: Haarkanten der Teile erst ab diesem b (Startbild flach über Papierhöhe: sonst liegen alle Kanten als Linie auf dem Horizont)
      if (I.def.linesFrom !== undefined) I.lines.visible = b >= I.def.linesFrom;
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
        // Text (nicht Bilder) nur ganz im Bild oder gar nicht; Decals mit Text (Kontaktkarten) tragen pr.textual
        if (o > .001 && ((pr.t && pr.t.rows) || pr.textual)) o *= textFactor(pr, cw, ch, M);
        // Dunst auch auf den Drucken; fremde Schrift nur von vorn (nie von hinten gelesen)
        if (o > .001) {
          _pp.setFromMatrixPosition(pr.mesh.matrixWorld);
          const dd = camera.position.distanceTo(_pp); o *= 1 - sm((dd - I.far.x) / Math.max(1, I.far.y - I.far.x));
          if (wI < 1 && o > .001 && ((pr.t && pr.t.rows) || pr.textual)) { _nn.set(0, 0, 1).transformDirection(pr.mesh.matrixWorld); _vv.copy(camera.position).sub(_pp).normalize(); o *= sm(_nn.dot(_vv) / .25); }
        }
        if (pr.mat.opacity !== o) pr.mat.opacity = o;
        pr.mesh.visible = o > .001;
      }
    }
    // Haarkanten der Bögen (LineBasicMaterial, ohne eigenen Shader) folgen dem Dunst ihrer Szene
    for (const I of visible) for (const sh of I.sheets) { const e = sh.children[0]; if (e && e.material) { _pp.setFromMatrixPosition(sh.matrixWorld); e.material.opacity = .32 * (1 - sm((camera.position.distanceTo(_pp) - I.farS.x) / Math.max(1, I.farS.y - I.farS.x))); } }
    updateThread(st);
    try { updateCards(M, M > .92); } catch (e) { mapFail(e); }
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
  // Sprung beim Laden weit nach hinten: erst vorn malen, dann Szene für Szene bauen (zwischen den Schritten wird gemalt), dann springen; liegt das Ziel in der
  // Karte (ab Zoom-Beginn), erst bei Kontakt landen und die Kamera von dort zur Karte fahren lassen, nicht im ersten Bild alles auf einmal zeigen
  let initPhase = true, pendingJump = null;
  function jumpAny(pp) {
    const st = stateAt(clamp(pp, 0, 1));
    if (!initPhase || st.i <= 1 || INST[st.i].built) { jumpTo(pp); return; }
    pendingJump = pp; target = p = 0; dbg("Sprung zu p=" + pp.toFixed(4) + " gestaffelt (Szene " + (st.i + 1) + ")");
    const step = () => {
      if (pendingJump === null) return;
      if (!INST[st.i].built) { build(INST.find(I => !I.built)); setTimeout(step, 30); return; }
      const pj = pendingJump; pendingJump = null; dbg("Szenen gebaut, springe");
      if (pj >= ZSEG.p0) { jumpTo(ZSEG.p0); setTimeout(() => { if (!pendingJump) scrollToP(pj); }, 600); } else jumpTo(pj);
    };
    setTimeout(step, 400);
  }
  function applyHash() {
    const q = hashQ();
    const hp = q.get("p"), hs = q.get("s");
    if (hp !== null && hp !== "" && isFinite(+hp)) { jumpAny(+hp); return true; }
    if (hs) { const a = ANCH.find(a => a.name === hs); if (a) { if (Mcur > .05) Mextra = Math.max(Mextra, Mcur); Muser = 0; jumpAny(anchorP(a) + 1e-6); syncMapUi(); return true; } }
    return false;
  }
  addEventListener("hashchange", applyHash);
  // Übersicht (Karte): Knopf, Esc, Klick auf eine Parzelle. Die Karte schließt, sobald jemand scrollt oder eine Taste drückt.
  const mapBtn = document.getElementById("uebersicht"), mapNote = document.getElementById("kartenhinweis");
  let mapUiKey = "";
  function syncMapUi() {
    const st = stateAt(p), open = Muser > 0 || mSeg(st) > .5;
    if (mapUiKey === String(open)) return; mapUiKey = String(open);
    if (mapBtn) { mapBtn.setAttribute("aria-pressed", open ? "true" : "false"); mapBtn.setAttribute("aria-label", open ? "Übersicht schließen" : "Übersicht"); if (mapBtn.classList) mapBtn.classList.toggle("an", open); }
    if (cardHost) cardHost.setAttribute("aria-hidden", open ? "false" : "true");
  }
  // Karte öffnen: fehlen noch Szenen, werden sie erst Bild für Bild gebaut (zwischendurch wird gemalt), danach fährt M hoch
  function openMap() {
    if (INST.every(I => I.built)) { Muser = 1; syncMapUi(); return; }
    const step = () => { const n = INST.find(I => !I.built); if (!n) { Muser = 1; syncMapUi(); return; } build(n); setTimeout(step, 20); };
    setTimeout(step, 0);
  }
  function closeMap() {
    const st = stateAt(p);
    // am Seitenende steht die Karte an p: zurück an die letzte Stellung der letzten Szene, die Kamera sinkt dorthin
    if (mSeg(st) > .02) { Mextra = Math.max(Mextra, mNow(st)); Muser = 0; jumpTo(ZSEG.p0); } else Muser = 0;
    syncMapUi();
  }
  function flyTo(name) {
    const a = ANCH.find(a => a.name === name); if (!a) return;
    Mextra = Math.max(Mextra, mNow(stateAt(p))); Muser = 0;
    jumpTo(anchorP(a) + 1e-6); syncMapUi();
  }
  addEventListener("scroll", () => { if (!hold) { target = clamp(scrollY / maxScroll(), 0, 1); if (Muser) { Muser = 0; syncMapUi(); } } }, { passive: true });
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(ev, () => { hold = false; pendingJump = null; }, { passive: true });
  addEventListener("wheel", () => { if (Muser) { Muser = 0; syncMapUi(); } }, { passive: true });
  addEventListener("keydown", ev => {
    if (ev.key === "Escape") { if (Muser > 0 || mSeg(stateAt(p)) > .5) closeMap(); return; }
    if (Muser && ev.key !== "Tab" && ev.key !== "Enter" && ev.key !== " ") { Muser = 0; syncMapUi(); }
  });
  if (mapBtn) mapBtn.addEventListener("click", () => { const open = Muser > 0 || mSeg(stateAt(p)) > .5; if (open) closeMap(); else openMap(); });
  const karteEl = document.getElementById("karte");
  if (karteEl && karteEl.addEventListener) karteEl.addEventListener("click", ev => {
    const l = ev.target.closest && ev.target.closest("a"); if (!l) return;
    ev.preventDefault(); ev.stopPropagation();
    if (Mcur > .8) flyTo(l.getAttribute("data-scene"));
  });
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
  if (nx) nx.addEventListener("click", () => { if (Muser) closeMap(); else go(1); });
  if (pv) pv.addEventListener("click", () => { if (Muser) closeMap(); else go(-1); });
  addEventListener("click", ev => {
    const l = ev.target.closest && ev.target.closest("[data-scene]"); if (!l) return;
    const a = ANCH.find(a => a.name === l.dataset.scene); if (!a) return;
    ev.preventDefault();
    if (Mcur > .3) flyTo(l.dataset.scene); else scrollToP(anchorP(a) + 1e-6);
  });

  // ---------- Klickbare Drucke (Kontaktwege) ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function linkAt(ev) {
    if (Mcur > .3) return null;                          // in der Karte gehören Klicks den Parzellen
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
    renderer.setPixelRatio(lowRatio ? 1.25 : Math.min(devicePixelRatio || 1, 2));
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
    if (table) { scene.remove(table.g); table = null; }
    MAP = null; Muser = 0; Mextra = 0;
    aspect = VW() / VH(); narrow = aspect < 1;
    INST = SEQ.map((cfg, i) => newInstance(cfg, i));
    resize();
    makeSegments();
    ANCH = anchorsOf();
    try { buildCards(); } catch (e) { mapFail(e); }
    build(INST[0]); INST[0].tStart = performance.now();
  }
  init();
  addEventListener("resize", () => {
    const n = VW() / VH() < 1;
    if (n !== narrow) { const keep = target; init(); jumpTo(keep); } else resize();
    if (hold) scrollTo(0, target * maxScroll());
  });
  if (!applyHash()) { target = p = clamp(scrollY / maxScroll(), 0, 1); }
  initPhase = false;
  // übrige Szenen im Hintergrund nacheinander bauen, erst nach dem ersten Bild (das Startbild steht vorher)
  function more() { const n = INST.find(I => !I.built); if (!n) return; build(n); setTimeout(more, 40); }

  let last = performance.now(), first = true, drawKey = "";
  function frameStep(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    p += (target - p) * (1 - Math.exp(-dt * 3.0));
    if (Math.abs(target - p) < 1e-5) p = target;
    // Übersicht per Knopf: M läuft zeitlich (ruhig an und aus), unabhängig vom Scrollen
    Mextra += (Muser - Mextra) * (1 - Math.exp(-dt * 3.2)); if (Math.abs(Muser - Mextra) < .002) Mextra = Muser;
    const st = stateAt(p);
    hint && hint.classList.toggle("off", p > .004);
    document.body.classList.toggle("scrolled", scrollY > innerHeight * .6 || p > INST[0].body.p1 * .1);
    document.body.classList.toggle("kartenmodus", mNow(st) > .5);
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
    syncMapUi();
    const lr = mNow(st) > .6 && (devicePixelRatio || 1) > 1.25;
    if (lr !== lowRatio) { lowRatio = lr; renderer.setPixelRatio(lr ? 1.25 : Math.min(devicePixelRatio || 1, 2)); renderer.setSize(VW(), VH(), false); drawKey = ""; }
    // steht die Karte still (alle Szenen fertig, keine Textur im Tausch), wird nichts neu gezeichnet
    const key = p.toFixed(6) + "|" + mNow(st).toFixed(5) + "|" + aspect.toFixed(4) + "|" + INST.filter(I => I.built).length;
    if (mNow(st) >= .9999 && key === drawKey && INST.every(I => I.built && I.lodSmall === true && !I.easing) && revealN >= INST.length) return;
    drawKey = key;
    applyState(st, now);
    renderer.render(scene, camera);
    if (first) dbg("erster Frame gezeichnet");
    if (first) { first = false; opt.onFirstFrame && opt.onFirstFrame(); setTimeout(more, 250); }
  }
  // Ein Fehler im Bild darf die Seite nie weiß lassen: der nächste Frame wird immer geplant; liegt es an der Karte, wird sie abgeschaltet
  let frameErrors = 0;
  function frame(now) {
    try { frameStep(now); }
    catch (e) {
      console.error(e); frameErrors++;
      if (mapOK && (Mextra > 0 || Muser > 0 || mSeg(stateAt(p)) > 0)) { mapFail(e); if (mSeg(stateAt(p)) > 0) { try { jumpTo(ZSEG.p0); } catch (e2) { /* nichts */ } } }
      if (first) { first = false; try { opt.onFirstFrame && opt.onFirstFrame(); } catch (e3) { /* nichts */ } setTimeout(more, 250); }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Prüfhilfe (nur Entwurf): Zustände ohne Atem setzen, Lesestellen und Abschnitte als p
  const api = {
    THREE, scene, camera, frameFrac, readingPose, stateAt, poseOf, bOf, ensure,
    labelAt: pp => { const st = stateAt(pp), I = INST[st.i]; if (st.kind === "z") return "Übersicht"; if (st.kind === "b" && I.cfg.labels) { ensure(I.idx); let lb = I.cfg.label; for (const L of I.cfg.labels) { const ki = typeof L.ki === "function" ? L.ki(I.def) : L.ki, kk = I.def.keys[ki]; if (kk && pp >= I.body.p0 + I.def.pOfU(kk.u) * (I.body.p1 - I.body.p0)) lb = L.label; } return lb; } return I.cfg.label; },
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
    // Anordnung und Karte (Prüfung): Bahn, Parzellen, Tisch, Kartenstellung, Segment der Karte
    layout: () => INST.map(I => ({ name: I.name, rot: Math.round(I.rot * 180 / PI), O: I.O.toArray(), fp: I.fp, lf: I.lf, arc: I.arc, corner: I.corner })),
    cards: () => INST.map(I => { const c = cardCorners(I); return [Math.min(...c.map(v => v.x)), Math.max(...c.map(v => v.x)), Math.min(...c.map(v => v.z)), Math.max(...c.map(v => v.z))]; }),
    table: () => tableRect(), mapPose: () => { ensure(INST.length - 1); return mapPose(); }, zseg: () => ZSEG, mAt: pp => mNow(stateAt(pp)),
    openMap(v) { Muser = v ? 1 : 0; Mextra = Muser; }
  };
  window.__seite = api;
  return api;
}
