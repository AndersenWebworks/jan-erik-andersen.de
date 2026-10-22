// Startseite jan-erik-andersen.de, Fassung 2026-11, Lesebahn mit gleichmäßiger Fahrt (Prinzip „Die Szene ist der Träger“, PRINZIP-SZENE-IST-TRAEGER.md).
// Gemeinsamer Kern für alle Szenen. Jede Szene ist ein Modul (K, opt) => def; ihre Teile baut sie mit dem Faltkern (falt.js) und den Satzhilfen (bahn.js).
//
// Fahrt: Alle Szenen liegen nebeneinander auf einer Papierbahn (Richtung +x), ihre Leselinie (der rote Faden) liegt bei Welt-z = 0. Die Kamera fährt
// mit fester Neigung (bahn.js: PITCH), Gier 0 und gleichem Abstand nach rechts, in gleichem Tempo je Scrollweg (RIG.v Welteinheiten je vh); sie bremst
// nirgends, dreht nicht und zoomt nicht. Einzige Ausnahmen: der Anfang (def.intro der ersten Szene: vom frontalen Podest einmal auf die Fahrthöhe, mit
// stetigem Übergang ins Fahrttempo) und eine Szene mit def.rise (die Bahn steigt mit einer Treppe gleichmäßig an, die Kamera steigt mit).
// Jede Szene läuft nach der Lage der Kamera: b = (X − Anfang) / (Ende − Anfang) über ihrer Strecke def.strecke = [xs, xe] (Szenenkoordinaten, x der
// Bildmitte). Was ins Bild kommt, baut sich auf; Sätze werden lesbar, weil die Szene sie im Takt in Lesestellung bringt (bahn.js: K.trage, am Handy
// fährt ein Träger ein Stück mit und rastet dann ein).
// Der rote Faden ist eine Linie durch alle Szenen (def.faden, Szenenkoordinaten); der Punkt steht immer in der Bildmitte und zieht den Faden hinter sich her.
// Zustände: #p=0…1 (ganze Seite), #s=<szene> (Anker der Szene), Handy-Ausschnitt #…&w=390&h=844 (Prüfhilfe).
import * as THREE from "three";
import { SCHRIFTEN } from "./fonts/schriften.js";
import { PITCH, EC, YL, satzhilfen } from "./bahn.js";
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
  // Newsreader N4 (variabel, @font-face der Seite): Marke 380 / kursiv 340, Lesetext 440 / kursiv 470, Köpfe 400 / kursiv 380
  await Promise.all(['380 120px "Newsreader N4"', 'italic 340 120px "Newsreader N4"', '440 120px "Newsreader N4"', 'italic 470 120px "Newsreader N4"'].map(f => document.fonts.load(f, "Jan-Erik Andersen äöü"))).catch(() => {});
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
  // Abstand zwischen den Bauteilen zweier Szenen auf der Bahn (Welteinheiten)
  const GAP = opt.gap || 1.2;

  // ---------- Druck (Canvas-Textur auf der Fläche) ----------
  // Schriften: "lese" Newsreader N4 440 (Fließtext der Sätze; *…* = Schlüsselgruppe kursiv 470), "kopf" Newsreader N4 400 (Köpfe; *…* kursiv),
  // "kicker" Schibsted Grotesk 500 in Versalien, gesperrt; "marke" Wortmarke N4; "serif" Newsreader Display 300; Vorgabe Schibsted Grotesk 500.
  const PXEM = 120;
  const texOf = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  const N4 = '"Newsreader N4", "Newsreader", Georgia, serif';
  function fontSpec(o) {
    const f = o.font, mk = f === "marke", le = f === "lese", ko = f === "kopf";
    const fam = mk || le || ko ? N4 : f === "serif" ? '"Newsreader"' : '"Schibsted Grotesk"';
    const wN = mk ? (o.italic ? 340 : 380) : le ? (o.weight || 440) : ko ? (o.weight || 400) : f === "serif" ? 300 : (o.weight || 500);
    const wI = mk ? 340 : le ? (o.weightI || 470) : ko ? 380 : wN;
    return { fam, wN, wI, markup: (le || ko) && !o.plain, caps: f === "kicker", track: o.track !== undefined ? o.track : mk ? -.018 : ko ? -.012 : f === "kicker" ? .13 : 0 };
  }
  // Zeilen in Läufe zerlegen: * schaltet die Schlüsselgruppe (kursiv) um, der Zustand läuft über Zeilenenden weiter
  function runsOf(lines, o, fs) {
    let it = !!o.italic;
    return lines.map(l => {
      const s = fs.caps ? l.toUpperCase() : l;
      if (!fs.markup) return [{ t: s, it }];
      const out = []; s.split("*").forEach((t, k) => { if (k) it = !it; if (t) out.push({ t, it }); }); return out;
    });
  }
  function printTex(lines, o = {}) {
    const em = PXEM, lh = (o.lh || 1.3) * em, fs = fontSpec(o);
    const cv = document.createElement("canvas"), x = cv.getContext("2d");
    const setF = it => { x.font = `${it ? "italic " : ""}${it ? fs.wI : fs.wN} ${em}px ${fs.fam}`; x.letterSpacing = (fs.track * em) + "px"; };
    const padX = .16 * em, padY = .1 * em;
    const R = runsOf(lines, o, fs);
    // Breite je Lauf und Zeile (Laufweite am Zeilenende abgezogen)
    const rw = R.map(rs => rs.map(r => { setF(r.it); return x.measureText(r.t).width; }));
    const ws = o.disc ? [2 * o.disc * em] : rw.map(a => Math.max(0, a.reduce((s, v) => s + v, 0) - (fs.track > 0 ? fs.track * em : 0))), wMax = Math.max(...ws);
    cv.width = Math.ceil(wMax + padX * 2);
    cv.height = Math.ceil(padY * 2 + (lines.length - 1) * lh + em * 1.18);
    x.fillStyle = o.col || INK; x.textBaseline = "alphabetic";
    if (o.outline) { x.strokeStyle = o.col || INK; x.lineWidth = o.outline; x.lineJoin = "round"; }
    const at = i => [padX + (o.align === "center" ? (wMax - ws[i]) / 2 : o.align === "right" ? wMax - ws[i] : 0), padY + em * .94 + i * lh];
    if (o.disc) {
      const [ax, ay] = at(0), r = o.disc * em; x.beginPath(); x.arc(ax + r, ay - r, r, 0, 2 * PI);
      if (o.outline) { if (o.fillCol) { x.fillStyle = o.fillCol; x.fill(); } x.stroke(); } else x.fill();
    } else {
      R.forEach((rs, i) => {
        let [ax, ay] = at(i);
        rs.forEach((r, k) => {
          setF(r.it); x.fillStyle = o.col || INK;
          if (o.outline && o.fillCol) { x.fillStyle = o.fillCol; x.fillText(r.t, ax, ay); }
          x[o.outline ? "strokeText" : "fillText"](r.t, ax, ay);
          ax += rw[i][k];
        });
      });
    }
    const h = cv.height / em;
    const plain = lines.map(l => l.split("*").join(""));
    return { tex: texOf(cv), w: cv.width / em, h, lh: lh / em, padX: padX / em, tw: wMax / em, bfb: h - (padY / em + .94 + (lines.length - 1) * lh / em), rows: ws.map(v => v / em), lines: plain };
  }

  // ---------- Ansicht ----------
  const hashQ = () => new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const fq = hashQ();
  const FORCE = fq.get("w") && fq.get("h") ? { w: +fq.get("w"), h: +fq.get("h") } : null;
  const VW = () => FORCE ? FORCE.w : innerWidth, VH = () => FORCE ? Math.min(FORCE.h, innerHeight) : innerHeight;
  let aspect = VW() / VH(), narrow = aspect < 1;

  // ---------- Fahrt: gemeinsame Kamera aller Szenen ----------
  // Lesepunkt L = (X, YL + Höhe der Bahn, 0): dort steht die Mitte einer Satzzeile, wenn der Satz in Bildmitte ist. Die Kamera blickt mit PITCH nach
  // unten, Gier 0, in festem Abstand: 1 em (EC Welteinheiten) an der Leselinie hat px Bildpunkte (Desktop 21 bis 24, Handy 17). L liegt im Bild bei sy.
  // Tempo: der Satz wandert waagerecht DRIFT Bildpunkte je Bildpunkt Scrollweg (Desktop 1,25, Handy 1,0), daraus v (Welt je vh).
  let RIG = null;
  function rigOf() {
    const W = VW(), H = VH(), nar = W / H < 1;
    const fov = nar ? 44 : 32, TAN = Math.tan(fov * PI / 360);
    const px = nar ? 17 : clamp(21 + (H - 900) / 540 * 2.5, 20.5, 24);
    const depth = EC * H / (2 * TAN * px);
    const pt = PITCH * PI / 180, sy = nar ? -.26 : -.3;
    const Fw = V(0, -Math.sin(pt), -Math.cos(pt)), Rt = V(1, 0, 0), U = V().crossVectors(Rt, Fw);
    const D = Fw.clone().addScaledVector(U, sy * TAN).normalize();
    const off = D.clone().multiplyScalar(-depth / D.dot(Fw));
    const ppw = px / EC, drift = nar ? 1.0 : 1.25;
    RIG = { W, H, nar, fov, TAN, px, depth, Fw, U, off, sy, ppw, drift, v: drift * H / 100 / ppw, halfW: W / 2 / ppw, halfH: H / 2 / ppw, pitch: PITCH, lean: pt };
    return RIG;
  }

  // ---------- Szenen ----------
  const links3 = [];
  let INST = [], TOTAL = 1, LI = 0, XA = 0, XB = 1;

  function newInstance(cfg, idx) {
    return { cfg, idx, name: cfg.name, built: false, O: V(), tStart: undefined, parked: false };
  }

  // Eine Szene bauen: Modul ausführen, Faltmodell abschließen, Drucke und Netze in die Gruppe der Szene hängen
  function build(I) {
    const cfg = I.cfg;
    I.far = FAR.clone(); useFar(I.far);
    const group = new THREE.Group(); scene.add(group);
    const prints = [], anims = [], sheets = [], sheetBox = [], bMats = [];
    const rissMat = rissMaterial();
    const add = o => { group.add(o); return o; };
    function mkPrint(lines, e, on, o = {}) {
      const t = printTex(lines, o);
      const mat = dunst(new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      const w = t.w * e, h = t.h * e;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.renderOrder = 3; mesh.frustumCulled = false; group.add(mesh);
      const pr = { mesh, mat, on, e, w, h, t, fade: o.fade || .02, off: o.off, I, text: o.text };
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
      F, R, THREE, V, COL, PI, Q, EPS, sm, mech, win, clamp, narrow, vw: VW(), vh: VH(), RIG,
      anim: fn => anims.push(fn), add, paperMaterial, edgeMaterial, camera,
      print: mkPrint, decal: mkDecal,
      // Klickbarer Druck (Raycast auf die Fläche des Drucks): Kontaktwege bleiben echte Links, zusätzlich als HTML-Links im Dokument
      link(pr, href) { links3.push({ pr, href, I }); return pr; },
      measure(lines, o = {}) { const t = printTex(lines, o); t.tex.dispose(); return t; },
      // Druck auf eine Fläche K.panel: Mitte bei (u entlang des Scharniers, v vom Scharnier weg); side wie bei F.attach
      onPanel(nd, pr, u, v, side = 1, q = null, lift = .002) { F.attach(nd, pr.mesh, nd.uv(u, v), q || nd.n, side, lift); return pr; },
      // Druck flach auf eine waagerechte Fläche (Bogen, Hubplatte), liest sich von vorn (+z)
      onFlat(nd, pr, x, z, lift = .002) { F.attach(nd, pr.mesh, [x, z], [0, -1], 1, lift); return pr; },
      // Lettern: Zeile steht aus dem Bogen auf (Scharnier an der Grundlinie), im Bogen bleibt ihr Abdruck (siehe wortmarke.js)
      word(lines, e, x, zb, t0, d, o = {}) {
        const io = o.imprint, ck = o.clock || "t", on0 = o.on !== undefined ? o.on : -1;
        const pr = mkPrint(lines, e, on0, o), im = o.noImprint ? null : mkPrint(lines, e, on0, io ? { ...o, col: io.col, fillCol: io.fill, outline: io.line } : { ...o, col: IMPRINT });
        if (io && im) { im.t.tex.premultiplyAlpha = true; Object.assign(im.mat, { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }); }
        const W = pr.t.tw * e, base = o.foot ? 0 : .2 * e;
        if (io && im) {
          if (ck === "t") { if (io.close !== undefined) { im.tOff = t0 + d + io.close; im.tDur = io.closeDur || .7; } }
          else if (io.closeB !== undefined) im.off = t0 + d + io.closeB;
          else if (io.close !== undefined) im.off = t0 + d + .012;
        }
        if (io && io.slit) F.line(o.par || R, [x - .015, zb], [x + W + .015, zb], io.slit, COL.INK, .0009);
        if (o.fold) {
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
      // Der Bogen geht nach hinten (−z) ohne Kante in die Papierbahn über (kern.js, baseSheet): er reicht bis z −40, Haarkanten hat er keine
      sheet(x0, x1, z0, z1, col = "#faf8f3", from = -1) {
        const za = Math.max(z0, z1), zb = Math.min(-40, Math.min(z0, z1));
        const g = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .03, za - zb), paperMaterial(col));
        g.position.set((x0 + x1) / 2, -.0152, (za + zb) / 2);
        add(g); sheets.push(g); sheetBox.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]);
        if (from >= 0) anims.push(b => { g.visible = b >= from; });
        return g;
      }
    });
    // Satzhilfen (bahn.js): K.strecke, K.satz, K.kopf, K.trage, K.wrap …
    satzhilfen(K);
    const def = cfg.mod(K, cfg.modOpt);
    if (!def.strecke) throw new Error("Szene ohne Strecke: " + cfg.name);
    const M = F.finish();
    const mesh = add(new THREE.Mesh(M.geoT, paperMaterial()));
    const lines = add(new THREE.LineSegments(M.geoL, edgeMaterial()));
    const riss = add(new THREE.LineSegments(M.geoR, rissMat));
    for (const o of [mesh, lines, riss]) o.frustumCulled = false;
    mesh.renderOrder = 0; lines.renderOrder = 1; riss.renderOrder = 1;
    const grid = cfg.grid !== undefined ? cfg.grid : def.grid;
    if (grid) { gridOn(mesh.material, true, grid); bMats.push(mesh.material); for (const g of sheets) { gridOn(g.material, false, grid); bMats.push(g.material); } }
    if (M.geoG) { const gm = geruestMaterial(), gl = add(new THREE.LineSegments(M.geoG, gm)); gl.frustumCulled = false; gl.renderOrder = 1; bMats.push(gm); }
    bMats.push(rissMat);
    Object.assign(I, { group, prints, anims, sheets, sheetBox, bMats, rissMat, F, K, M, def, built: true });
    I.groups = (def.stops || []).map(s => (s.prints || []).filter(pr => pr && pr.mat)).filter(g => g.length > 1);
    I.clip = cfg.clip || def.clip || null;
    layout(I);
    group.position.copy(I.O); group.updateMatrixWorld(true);
    const planes = I.clip ? [
      new THREE.Plane(V(1, 0, 0), -(I.clip[0] + I.O.x)), new THREE.Plane(V(-1, 0, 0), I.clip[1] + I.O.x),
      new THREE.Plane(V(0, 0, 1), -(I.clip[2] + I.O.z)), new THREE.Plane(V(0, 0, -1), I.clip[3] + I.O.z)] : null;
    group.traverse(o => {
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) { if (!frameOn(m, I.O, I.clip) && planes) m.clippingPlanes = planes; }
    });
    I.M.update(0, 0); I.curB = 0; I.curT = 0;
    group.visible = false;
    useFar(null);
    return I;
  }

  // ---------- Lage der Szenen auf der Bahn ----------
  function extentOf(I) {
    const box = new THREE.Box3();
    const cl = (x0, x1, z0, z1) => I.clip ? [Math.max(x0, I.clip[0]), Math.min(x1, I.clip[1]), Math.max(z0, I.clip[2]), Math.min(z1, I.clip[3])] : [x0, x1, z0, z1];
    for (const s of I.sheetBox) { const [x0, x1, z0, z1] = cl(...s); if (x1 > x0 && z1 > z0) { box.expandByPoint(V(x0, 0, z0)); box.expandByPoint(V(x1, 0, z1)); } }
    for (const bb of [0, .25, .5, .75, 1]) {
      I.M.update(bb, 1e9);
      const v = V(), { posT, nT } = I.M.dbg;
      for (let j = 0; j < nT.length; j++) {
        v.set(posT[j * 3], posT[j * 3 + 1], posT[j * 3 + 2]);
        if (I.clip && (v.x < I.clip[0] || v.x > I.clip[1] || v.z < I.clip[2] || v.z > I.clip[3])) continue;
        box.expandByPoint(v);
      }
    }
    I.M.update(0, 0);
    if (box.isEmpty()) box.expandByPoint(V(I.def.strecke[0], 0, 0)).expandByPoint(V(I.def.strecke[1], 0, 0));
    return box;
  }
  // Szene B schließt rechts an A an: ihre Strecke beginnt frühestens am Ende der Strecke von A, ihre Bauteile liegen mindestens GAP rechts von
  // denen von A (dazwischen fährt die Kamera geradeaus weiter). Die Leselinie (def.lineZ) liegt bei Welt-z = 0, die Höhe folgt der Bahn (def.rise).
  function layout(I) {
    const d = I.def;
    I.ext = extentOf(I);
    const lz = d.lineZ || 0, [xs, xe] = d.strecke;
    if (I.idx === 0) I.O.set(0, 0, -lz);
    else {
      const A = INST[I.idx - 1], gapX = d.gapBefore !== undefined ? d.gapBefore : GAP;
      const ox = Math.max(A.X1 - xs, A.O.x + A.ext.max.x + gapX - I.ext.min.x);
      I.O.set(ox, A.O.y + (A.def.rise ? A.def.rise.h : 0), -lz);
    }
    I.X0 = I.O.x + xs; I.X1 = I.O.x + xe;
    I.wbox = I.ext.clone().translate(I.O);
  }
  // Höhe der Bahn bei X (Treppe: def.rise { x0, x1, h } in Szenenkoordinaten, weich ein- und auslaufend)
  function levelAt(X) {
    let lv = 0;
    for (const I of INST) {
      if (!I.built) break;
      lv = I.O.y;
      const r = I.def.rise; if (!r) continue;
      const a = I.O.x + r.x0, b = I.O.x + r.x1;
      if (X < b) { if (X > a) lv += r.h * sm((X - a) / (b - a)); return lv; }
      lv += r.h;
    }
    return lv;
  }

  // ---------- Strecke der Seite: Anfang (intro, vh) und Fahrt (X) ----------
  function makeTrack() {
    const I0 = INST[0], intro = I0.def.intro;
    LI = intro ? intro.len[narrow ? "n" : "d"] : 0;
    XA = I0.X0; XB = INST[INST.length - 1].X1;
    TOTAL = LI + (XB - XA) / RIG.v;
    const tr = document.querySelector(".track"); if (tr) tr.style.height = (TOTAL + 100) + "vh";
    if (intro) { const ps = readingPose(I0, intro.stop); I0.startCam = ps.cam.add(I0.O); I0.startTgt = ps.tgt.add(I0.O); I0.startFov = narrow ? 44 : 32; }
  }
  const xOfVh = vh => XA + Math.max(0, vh - LI) * RIG.v;
  const vhOfX = X => LI + (X - XA) / RIG.v;
  function stateAt(p) {
    const vh = clamp(p, 0, 1) * TOTAL, intro = vh < LI, X = xOfVh(vh);
    let i = 0; for (let k = 0; k < INST.length; k++) if (INST[k].built && X >= INST[k].X0 - 1e-9) i = k;
    return { p, vh, intro, s: intro ? vh / LI : 1, X, i };
  }
  function bOf(I, st) {
    if (!I.built) return 0;
    const bI = I.def.intro ? I.def.intro.bI : 0;
    if (st.intro) return I.idx === 0 ? bI * st.s : 0;
    return clamp(bI + (1 - bI) * (st.X - I.X0) / (I.X1 - I.X0), 0, 1);
  }
  // Startstellung (Eröffnung): Blickrichtung aus der Textfläche, Abstand aus der Schriftgröße (wie bisher; nur für das Startbild)
  function readingPose(I, s) {
    const W = VW(), H = VH(), TAN = Math.tan((narrow ? 44 : 32) * PI / 360);
    I.M.update(s.fb !== undefined ? s.fb : 0, 1e9);
    const v = V(), pts = [];
    for (const pr of s.prints) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pts.push(v.set(sx * pr.w / 2, sy * pr.h / 2, 0).applyMatrix4(pr.mesh.matrix).clone());
    const m = s.prints[0].mesh.matrix, C = pts.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / pts.length), N = V().setFromMatrixColumn(m, 2).normalize();
    const e = s.e0 || Math.max(...s.prints.map(pr => pr.e));
    I.M.update(0, 0);
    s.C = C;
    let px = narrow ? s.pxN : s.px; if (typeof px === "function") px = px(W, H, s);
    const depth = e * H / (2 * TAN * px);
    const fv = q => typeof q === "function" ? q(W, H) : q || 0, sx = narrow ? fv(s.nsx) : fv(s.sx), sy = narrow ? fv(s.nsy) : fv(s.sy);
    const h = N.clone().negate(); h.y = 0; h.normalize();
    const Fw = h.clone(), Rt = V().crossVectors(Fw, UP).normalize(), U = V().crossVectors(Rt, Fw);
    const D = Fw.clone().addScaledVector(Rt, sx * TAN * aspect).addScaledVector(U, sy * TAN).normalize();
    const cam = C.clone().addScaledVector(D, -depth / D.dot(Fw));
    return { cam, tgt: cam.clone().addScaledVector(Fw, depth), px };
  }
  // Kamera bei X (Fahrt)
  function rigPose(X, cam, tgt) {
    cam.set(X, YL + levelAt(X), 0).add(RIG.off);
    tgt.copy(cam).addScaledVector(RIG.Fw, RIG.depth);
  }
  const _a = V(), _b = V(), _ax = V(), _P1 = V(), _T1 = V(), _m0 = V(), _m1 = V();
  function poseOf(st, cam, tgt) {
    if (!st.intro) { rigPose(st.X, cam, tgt); return RIG.fov; }
    // Anfang: vom Startbild (frontal, Podest) auf die Fahrthöhe. Ort: Hermite-Kurve mit Ruhe am Anfang und dem Fahrttempo am Ende;
    // Blick: weich (smoothstep) von der Startrichtung in die Fahrtrichtung, Drehrate an beiden Enden 0.
    // Waagerecht ruht die Kamera bis s0 und beschleunigt dann gleichmäßig auf das Fahrttempo (stetig, ohne Rücklauf); Höhe und Abstand weich (smoothstep).
    const I0 = INST[0], s = st.s, P0 = I0.startCam;
    rigPose(XA, _P1, _T1);
    const vL = RIG.v * LI, dx = XA - P0.x;
    let x;
    if (dx > 0 && dx < vL / 2) { const s0 = 1 - 2 * dx / vL; x = s <= s0 ? P0.x : P0.x + vL * (s - s0) ** 2 / (2 * (1 - s0)); }
    else { _m1.set(vL, 0, 0); _m0.set(0, 0, 0); x = hermite(_a.set(P0.x, 0, 0), _m0, _b.set(XA, 0, 0), _m1, s, _ax).x; }
    const gs = sm(s);
    cam.set(x, P0.y + (_P1.y - P0.y) * gs, P0.z + (_P1.z - P0.z) * gs);
    const dA = _a.copy(I0.startTgt).sub(I0.startCam), dist0 = dA.length(); dA.normalize();
    const dB = _b.copy(RIG.Fw), ang = Math.acos(clamp(dA.dot(dB), -1, 1)), g = sm(s);
    const dir = dA.clone();
    if (ang > 1e-4) { _ax.crossVectors(dA, dB).normalize(); dir.applyAxisAngle(_ax, ang * g); }
    tgt.copy(cam).addScaledVector(dir, dist0 + (RIG.depth - dist0) * g);
    return I0.startFov + (RIG.fov - I0.startFov) * sm(s);
  }

  // ---------- Roter Faden ----------
  // Eine Linie durch alle Szenen (def.faden: Punkte [x, y, z] oder [x, z] in Szenenkoordinaten, x steigt). Je Szene ein Band vom letzten Punkt der
  // vorigen Szene durch die eigenen Punkte. Der Punkt steht bei x = X (Bildmitte); gezeichnet ist der Faden bis zum Punkt.
  const pieces = [];
  let dot = null;
  const tmat = new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  function ribbon(pts0) {
    // Stützpunkte höchstens 1 E auseinander (gerade Stücke bleiben gerade; die Kurve schwingt sonst zwischen weit entfernten Punkten unter den Boden)
    const pts = [pts0[0]];
    for (let i = 1; i < pts0.length; i++) { const a = pts0[i - 1], b = pts0[i], n = Math.ceil(a.distanceTo(b) / 1); for (let k = 1; k <= n; k++) pts.push(a.clone().lerp(b, k / n)); }
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5);
    const len = curve.getLength(), N = Math.round(clamp(len * 14, 16, 2400)), sp = curve.getSpacedPoints(N), hw = .022;
    const pos = new Float32Array((N + 1) * 6), idx = [], xs = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) {
      const p = sp[i], q = sp[Math.min(N, i + 1)], r = sp[Math.max(0, i - 1)];
      const d = V().subVectors(q, r); const vert = Math.abs(d.y) > .5 * d.length();
      let sd;
      if (vert) sd = V(hw, 0, 0); else { d.y = 0; d.normalize(); sd = V().crossVectors(d, UP).multiplyScalar(hw); }
      pos.set([p.x - sd.x, p.y, p.z - sd.z, p.x + sd.x, p.y, p.z + sd.z], i * 6);
      xs[i] = i ? Math.max(xs[i - 1], p.x) : p.x;
      if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const mesh = new THREE.Mesh(g, dunst(tmat.clone(), 1)); mesh.renderOrder = 2; mesh.frustumCulled = false; scene.add(mesh);
    return { curve, N, g, mesh, sp, xs, x0: xs[0], x1: xs[N] };
  }
  const wpt = (I, a) => a.isVector3 ? a.clone().add(I.O) : a.length === 3 ? V(a[0] + I.O.x, a[1] + I.O.y, a[2] + I.O.z) : V(a[0] + I.O.x, .004 + I.O.y, a[1] + I.O.z);
  function buildThread() {
    for (const pc of pieces) { scene.remove(pc.mesh); pc.g.dispose(); }
    pieces.length = 0;
    if (!dot) { dot = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, depthTest: false })); dot.renderOrder = 6; dot.visible = false; scene.add(dot); }
    let last = null;
    for (const I of INST) {
      const lz = I.def.lineZ || 0;
      const f = I.def.faden || (I.def.noFaden ? null : [[I.ext.min.x, .004, lz], [I.ext.max.x, .004, lz]]); if (!f || f.length < 1) continue;
      const pts = f.map(a => wpt(I, a));
      const all = last ? [last, ...pts] : pts;
      if (all.length >= 2) { const r = ribbon(all); r.I = I; pieces.push(r); }
      last = pts[pts.length - 1];
    }
  }
  function updateThread(st) {
    let at = null;
    const X = st.intro ? -1e9 : st.X;
    for (const pc of pieces) {
      let k;
      if (X <= pc.x0) k = 0; else if (X >= pc.x1) k = pc.N;
      else { let lo = 0, hi = pc.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pc.xs[m] <= X) lo = m; else hi = m; } k = lo + (X - pc.xs[lo]) / Math.max(1e-9, pc.xs[hi] - pc.xs[lo]); }
      pc.mesh.visible = k > 0;
      pc.g.setDrawRange(0, Math.floor(k) * 6);
      if (k > 0) at = { pc, k };
    }
    dot.visible = !!at;
    if (at) {
      const i = Math.min(at.pc.N - 1, Math.floor(at.k)), f = at.k - i;
      dot.position.copy(at.pc.sp[i]).lerp(at.pc.sp[i + 1], f);
      dot.quaternion.copy(camera.quaternion);
      dot.scale.setScalar(Math.max(.05, camera.position.distanceTo(dot.position) * .0065));
    }
    return at;
  }

  // ---------- Text ganz im Bild oder ganz draußen ----------
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
  const vb0 = typeof document !== "undefined" && document.querySelector ? document.querySelector(".vorbild") : null;
  const HOLD_T = opt.holdT || 2.0;
  let released = !(vb0 && vb0.classList && vb0.classList.contains && !vb0.classList.contains("weg")), releasedAt = -1e9;
  function release(now) {
    if (released) return; released = true; releasedAt = now;
    opt.onRelease && opt.onRelease();
  }
  function vorbildBox() {
    const I = INST[0]; if (!I || !I.built) return null;
    const st = stateAt(0), cw = VW(), ch = VH();
    I.M.update(0, 1e9); I.group.updateMatrixWorld(true);
    const fov = poseOf(st, camera.position, _t); camera.fov = fov; camera.aspect = cw / ch; camera.updateProjectionMatrix();
    camera.lookAt(_t); camera.updateMatrixWorld();
    const out = [];
    for (const pr of I.prints) {
      if (!pr.hold || !pr.t || !pr.t.lines || !pr.t.lines.join("") || pr.mat.blending === THREE.CustomBlending) continue;
      const { r } = frameFrac(pr, cw, ch); if (!r) continue;
      const em = (r[3] - r[1]) / pr.t.h, text = pr.t.lines.join(" ");
      out.push({ text, em, lh: pr.t.lh * em, x0: r[0] + pr.t.padX * em, xm: (r[0] + r[2]) / 2, base: r[1] + (.1 + .94) * em, lines: pr.t.lines.length, rect: r });
    }
    I.M.update(0, 0);
    return out;
  }

  // ---------- Bild zu einem Zustand ----------
  const visible = new Set(), frus = new THREE.Frustum(), pmat = new THREE.Matrix4(), _t = V();
  function park(I, on) {
    if (on === I.parked) return; I.parked = on;
    if (!on) return;
    I.group.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.map) m.map.dispose(); });
  }
  let state = null;
  function applyState(st, now, opts = {}) {
    const fov = poseOf(st, camera.position, _t);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.lookAt(_t);
    camera.updateMatrixWorld();
    pmat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frus.setFromProjectionMatrix(pmat);
    visible.clear();
    for (const I of INST) {
      if (!I.built) continue;
      const on = frus.intersectsBox(I.wbox) || I.idx === st.i;
      I.group.visible = on; if (on) visible.add(I);
      park(I, !on && Math.abs(I.idx - st.i) > 2);
    }
    const time = now / 1000;
    for (const I of INST) if (I.built && I.tStart === undefined && I.idx <= st.i) I.tStart = now;
    const cw = VW(), ch = VH();
    for (const I of visible) {
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
        if (pr.hold && !opts.still) o *= released ? sm((now - releasedAt) / 120) : 0;
        pr._o = o; pr._c = o > .001 && ((pr.t && pr.t.rows) || pr.textual) ? clipFactor(pr, cw, ch) : 1;
      }
      // Drucke eines Lesepunkts (def.stops: Kicker und Kopf, Jahr, Station und Zusatz …) stehen ganz im Bild oder gar nicht: gemeinsamer Ausschnittfaktor
      for (const g of I.groups) { let c = 1; for (const pr of g) if (pr._o > .001) c = Math.min(c, pr._c); for (const pr of g) pr._c = c; }
      for (const pr of I.prints) {
        const o = pr._o * pr._c;
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
  // Anker: Szenenanfänge (def.anchor: x in Szenenkoordinaten, Vorgabe Anfang der Strecke), benannte Stellen (def.anchors { name: x }), Kontakt = Ende
  function anchorsOf() {
    const out = [];
    for (const I of INST) {
      const d = I.def, ax = d.anchor !== undefined ? I.O.x + d.anchor : I.X0;
      out.push({ name: I.name, label: I.cfg.label, p: I.idx === 0 ? 0 : clamp(vhOfX(ax) / TOTAL, 0, 1), main: true });
      if (d.anchors) for (const [nm, x] of Object.entries(d.anchors)) out.push({ name: nm, label: nm, p: x === "ende" ? 1 : clamp(vhOfX(I.O.x + x) / TOTAL, 0, 1), main: true });
    }
    return out;
  }
  let ANCH = [];
  function jumpTo(pp) {
    pp = clamp(pp, 0, 1);
    const st = stateAt(pp);
    for (const I of INST) if (I.built && (I.idx < st.i || (I.idx === st.i && pp > 0))) I.tStart = -1e9;
    target = p = pp; hold = true;
    scrollTo(0, pp * maxScroll());
  }
  function applyHash() {
    const q = hashQ();
    const hp = q.get("p"), hs = q.get("s");
    if (hp !== null && hp !== "" && isFinite(+hp)) { jumpTo(+hp); return true; }
    if (hs) { const a = ANCH.find(a => a.name === hs); if (a) { jumpTo(a.p + 1e-6); return true; } }
    return false;
  }
  addEventListener("hashchange", applyHash);
  addEventListener("scroll", () => { if (!hold) target = clamp(scrollY / maxScroll(), 0, 1); }, { passive: true });
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(ev, () => { hold = false; }, { passive: true });
  function scrollToP(pp) { hold = false; scrollTo({ top: clamp(pp, 0, 1) * maxScroll(), behavior: "smooth" }); }
  function go(dir) {
    const list = ANCH.filter(a => a.main).map(a => a.p).filter(v => v !== null).sort((a, b) => a - b);
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
    ev.preventDefault(); scrollToP(a.p + 1e-6);
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

  function sizeCanvas() {
    const w = VW(), h = VH();
    if (FORCE) Object.assign(canvas.style, { width: w + "px", height: h + "px", left: "50%", top: "0", transform: "translateX(-50%)", outline: "1px solid #999" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect; camera.updateProjectionMatrix();
  }

  // ---------- Papierbahn unter allen Szenen ----------
  // Ein durchgehender Bogen unter der ganzen Strecke (bis weit nach hinten), damit oben im Bild kein leeres Weiß steht; in der Ferne verliert er sich im Dunst.
  let base = null;
  function baseSheet() {
    if (base) { scene.remove(base); base.geometry.dispose(); }
    const x0 = (INST[0] ? INST[0].wbox.min.x : 0) - 60, x1 = (INST.length ? INST[INST.length - 1].wbox.max.x : 0) + 60;
    let ymax = 0; for (const I of INST) ymax = Math.max(ymax, I.O.y + (I.def.rise ? I.def.rise.h : 0));
    base = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 260), paperMaterial("#faf8f3"));   // derselbe Papier-Shader wie die Bögen: kein Farbsprung an deren Rändern
    base.rotation.x = -Math.PI / 2; base.position.set((x0 + x1) / 2, -.035, -110); base.renderOrder = -1;
    scene.add(base);
  }

  // ---------- Aufbau ----------
  // Alle Szenen werden beim Start gebaut (die Länge der Seite folgt aus der Bahn); das HTML-Vorbild steht, bis das erste Bild da ist.
  function init() {
    for (const I of INST) if (I.built) { scene.remove(I.group); I.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    links3.length = 0;
    aspect = VW() / VH(); narrow = aspect < 1;
    rigOf();
    // #nur=<szene>[,<szene>] (Prüfhilfe): nur diese Szenen bauen
    const nur = (hashQ().get("nur") || "").split(",").filter(Boolean);
    const seq = nur.length ? SEQ.filter(c => nur.includes(c.name)) : SEQ;
    INST = [];
    sizeCanvas();
    // Szenen nacheinander bauen (die Lage hängt von der vorigen ab); eine Szene, die nicht baut, entfällt (Hinweis in der Konsole)
    for (const cfg of seq) {
      const I = newInstance(cfg, INST.length); INST.push(I);
      try { build(I); } catch (e) { console.warn("Szene entfällt:", cfg.name, e && e.message); if (I.group) scene.remove(I.group); INST.pop(); }
    }
    baseSheet();
    makeTrack();
    buildThread();
    ANCH = anchorsOf();
    INST[0].tStart = performance.now();
  }
  init();
  let rsT = 0;
  addEventListener("resize", () => {
    clearTimeout(rsT);
    rsT = setTimeout(() => {
      const keep = target; const n = VW() / VH() < 1, H0 = RIG.H;
      if (n !== narrow || Math.abs(VH() - H0) > 1 || Math.abs(VW() - RIG.W) > 1) { init(); jumpTo(keep); }
      else sizeCanvas();
    }, 150);
  });
  if (!applyHash()) { target = p = clamp(scrollY / maxScroll(), 0, 1); }
  const ensure = () => {};

  let last = performance.now(), first = true;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    p += (target - p) * (1 - Math.exp(-dt * 3.0));
    if (Math.abs(target - p) < 1e-6) p = target;
    if (!released && INST[0].built) { if (p > .002) { INST[0].tStart = -1e9; release(now); } else if ((now - INST[0].tStart) / 1000 >= HOLD_T) release(now); }
    const st = stateAt(p);
    applyState(st, now);
    hint && hint.classList.toggle("off", p > .002);
    document.body.classList.toggle("scrolled", scrollY > innerHeight * .6 || p * TOTAL > LI * .3);
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
    renderer.render(scene, camera);
    if (first) { first = false; opt.onFirstFrame && opt.onFirstFrame(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Prüfhilfe: Zustände ohne Zeituhr setzen, Lesestellen je Szene
  const api = {
    THREE, scene, camera, frameFrac, stateAt, poseOf, bOf, ensure, levelAt,
    rig: () => RIG, track: () => ({ LI, XA, XB, TOTAL }), vhOfX, xOfVh,
    labelAt: pp => { const st = stateAt(pp); const I = INST[st.i]; if (!I) return ""; let lb = I.cfg.label; if (I.def.labels) for (const L of I.def.labels) if (st.X >= I.O.x + L.x) lb = L.label; return lb; },
    inst: () => INST, total: () => TOTAL, anchors: () => ANCH.map(a => ({ name: a.name, p: a.p })),
    setP(v) { jumpTo(v); },
    at(v, now = 1e9, still = true) { const st = stateAt(v); applyState(st, now, { still }); return st; },
    state: () => state, p: () => p,
    // Lesestellen (Sätze) aller Szenen in Lesereihenfolge: def.stops [{ name, prints }]
    stops() { const out = []; for (const I of INST) for (const s of (I.def.stops || [])) out.push({ scene: I.name, name: s.name, prints: s.prints, I, text: s.text }); return out; },
    pieces: () => pieces,
    vorbildBox, release: () => release(performance.now()), released: () => released
  };
  window.__seite = api;
  return api;
}
