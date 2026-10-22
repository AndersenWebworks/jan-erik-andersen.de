// Schnittstellen und eigene Werkzeuge (Drehbuch Abschnitt 9). Lesebahn, Prinzip „Die Szene ist der Träger“.
// Das Ding: Kabelfahnen. Elektriker beschriften Kabel mit Fahnen-Markierern genau dort, wo die Verbindung ist; so stehen hier die Sätze.
//  T0 Rollwagen mit Bildschirm: die Website zeigt den Kopf als ihre Überschrift. Am Handy rollt der Wagen ein Stück mit (K.trage).
//  Aus dem Wagen laufen drei Kabel (CRM, ERP, Bewerbermanagement), Stecker voraus, jedes in seiner Bahn; der Faden ist das Signal und läuft auf dem Bündel mit.
//  T1 Große Kabelfahne am Bündel (Klebeband hinter den Kabeln, Fläche der Kamera zugewandt) vor den drei Geräten. Am Handy rutscht sie am Bündel mit.
//  T2 Kabelfahne am ERP-Kabel, kurz vor dem Gerät. Während sie gelesen wird, stößt der Stecker an die runde Buchse des ERP, zieht sich zurück,
//     ein Adapterstück faltet sich aus dem Bogen vor das Gerät und rastet ein, dann steckt das Kabel. Am Handy rutscht auch diese Fahne am Kabel mit.
// Die Geräte sind hohe, tiefe Gehäuse mit Typenschild (nur Namen); sie füllen das obere Bilddrittel.
// Kamera: gleichmäßige Fahrt (kern.js). Die Aufbauzeiten laufen aus der Startlage der Teile (K.sicht(c0 − w/2).in), nicht aus der Endlage.

const ink = a => `rgba(48,48,51,${a})`;
const PI = Math.PI;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Website auf dem Bildschirm (1000 × 625). Der Kopf steht als Überschrift darauf (Druck), links bleibt die Fläche dafür frei ----------
function pageDraw(x, W, H) {
  const s = W / 1000, S = H / 625;
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  const box = (X, Y, w, h, a) => { x.fillStyle = ink(a); rr(x, X * s, Y * S, w * s, h * S, 2 * s); x.fill(); };
  const txt = (X, Y, w, h, a) => { x.fillStyle = ink(a); rr(x, X * s, Y * S, w * s, h * S, h * S / 2); x.fill(); };
  box(60, 46, 118, 22, .85);
  for (let i = 0; i < 4; i++) txt(600 + i * 88, 52, 62, 10, .4);
  x.fillStyle = ink(.12); x.fillRect(0, 100 * S, W, 2 * S);
  // Schaltfläche
  x.fillStyle = "#d40235"; rr(x, 60 * s, 400 * S, 150 * s, 44 * S, 4 * s); x.fill();
  x.fillStyle = "rgba(255,255,255,.92)"; rr(x, 90 * s, 417 * S, 90 * s, 10 * S, 5 * S); x.fill();
  txt(240, 416, 220, 10, .26);
  // drei Karten
  for (let c = 0; c < 3; c++) {
    const X = 60 + c * 300;
    box(X, 480, 150, 14, .7);
    [240, 220, 170].forEach((w, i) => txt(X, 510 + i * 20, w, 8, .26));
  }
  x.fillStyle = ink(.12); x.fillRect(0, 596 * S, W, 2 * S);
}

// Front eines Geräts (Druck, v von unten): Rahmen, Typenschild-Feld (Name kommt als Druck), Lüftungsschlitze, Buchse bei v = .42
function deviceFront(x, W, H, dw, dh, kind, plateV) {
  const s = W / dw, Y = v => (dh - v) * s;
  x.strokeStyle = ink(.34); x.lineWidth = 3; rr(x, .06 * s, .06 * s, W - .12 * s, H - .12 * s, .04 * s); x.stroke();
  // Typenschild: Rahmen mit vier Nieten
  const p0 = plateV[0], p1 = plateV[1];
  x.fillStyle = "#f6f3ec"; x.fillRect(.2 * s, Y(p1), W - .4 * s, (p1 - p0) * s);
  x.strokeStyle = ink(.42); x.lineWidth = 2.5; x.strokeRect(.2 * s, Y(p1), W - .4 * s, (p1 - p0) * s);
  x.fillStyle = ink(.32);
  for (const [u, v] of [[.3, p1 - .1], [dw - .3, p1 - .1], [.3, p0 + .1], [dw - .3, p0 + .1]]) { x.beginPath(); x.arc(u * s, Y(v), .025 * s, 0, 7); x.fill(); }
  // Lüftungsschlitze
  x.strokeStyle = ink(.26); x.lineWidth = .024 * s; x.lineCap = "round";
  for (let v = p0 - .28; v > 1.0; v -= .17) for (let c = 0; c < 8; c++) { const x0 = (.36 + c * (dw - .9) / 8) * s; x.beginPath(); x.moveTo(x0, Y(v)); x.lineTo(x0 + .1 * s, Y(v)); x.stroke(); }
  // Buchse
  const cx = dw / 2 * s, cy = Y(.42);
  x.strokeStyle = ink(.6); x.lineWidth = 4;
  if (kind === "round") { x.beginPath(); x.arc(cx, cy, .15 * s, 0, PI * 2); x.stroke(); x.beginPath(); x.arc(cx, cy, .055 * s, 0, PI * 2); x.stroke(); }
  else { rr(x, cx - .2 * s, cy - .12 * s, .4 * s, .24 * s, .02 * s); x.stroke(); x.fillStyle = ink(.5); x.fillRect(cx - .13 * s, cy - .02 * s, .26 * s, .04 * s); }
  x.strokeStyle = ink(.3); x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy - .3 * s, .028 * s, 0, PI * 2); x.stroke();
  x.beginPath(); x.arc(cx, cy + .3 * s, .028 * s, 0, PI * 2); x.stroke();
}
// Front des Adapters: rechteckige Buchse (der Stecker passt hier hinein)
function adapterFront(x, W, H, dw, dh) {
  const s = W / dw, cx = W / 2, cy = (dh - .42) * s;
  x.strokeStyle = ink(.7); x.lineWidth = 4.5; rr(x, cx - .2 * s, cy - .12 * s, .4 * s, .24 * s, .02 * s); x.stroke();
  x.fillStyle = ink(.5); x.fillRect(cx - .13 * s, cy - .02 * s, .26 * s, .04 * s);
  x.strokeStyle = ink(.4); x.lineWidth = 2.5; x.strokeRect(.1 * s, .1 * s, W - .2 * s, H - .2 * s);
  x.strokeStyle = ink(.3); x.lineWidth = 2; x.setLineDash([10, 7]); x.beginPath(); x.moveTo(.1 * s, .24 * s); x.lineTo(W - .1 * s, .24 * s); x.stroke(); x.setLineDash([]);
}
// Klebeband der Fahne: Streifen um das Kabel, schräg schraffiert, oben gestrichelte Falzlinie
function bandDraw(x, W, H) {
  x.fillStyle = "#e3dccb"; x.fillRect(0, 0, W, H);
  x.strokeStyle = ink(.12); x.lineWidth = 2;
  for (let u = -H; u < W; u += 14) { x.beginPath(); x.moveTo(u, H); x.lineTo(u + H, 0); x.stroke(); }
  x.strokeStyle = ink(.4); x.lineWidth = 2.5; x.setLineDash([12, 8]); x.beginPath(); x.moveTo(0, 1.5); x.lineTo(W, 1.5); x.stroke(); x.setLineDash([]);
}

export default function (K, opt = {}) {
  const { F, R, V, Q, sm, mech, clamp, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const METAL = c3("#dcd7cd"), FACE = c3("#f8f6f1"), CASE = c3("#ece9e2"), FRONTC = c3("#efece5"), FLAGC = c3("#f8f6f1"), ADAPT = c3("#cdc4b0"), STRAP = c3("#e3dccb");
  const lean = K.lean, UP = Q - lean, tn = Math.tan(lean), hw = K.halfW;

  // ---------- Maße ----------
  const LZ = 0;                                            // Lesetiefe der Textflächen
  const hingeZ = h0 => LZ + (K.YL - h0) * tn;              // Scharnier einer zurückgelehnten Fläche, deren Ebene durch den Lesepunkt (LZ, YL) geht
  const ZF = hingeZ(0), LANE = [ZF + .16, ZF + .27, ZF + .38];     // Fahnenscharnier, Kabelbahnen (CRM hinten, Bewerbermanagement vorn)
  const FZ = LANE[2] + .24;                                // Linie des Fadens außerhalb des Bündels
  const DDW = N ? 2.0 : 2.4, DDH = N ? 3.8 : 3.0, DDP = N ? 1.8 : 2.2;        // Gerät: Breite, Höhe, Tiefe
  const DZ = N ? -5.2 : -1.0;                              // Vorderkante der Geräte (Handy: weit hinten, im Hochformat stehen sie über der Fahne)
  const BEND = N ? .8 : 1.0, AW = N ? 1.3 : 1.3, AH = .85, AD = .5, PLUGL = .45;
  const SLH = .16;                                         // Höhe des Wagensockels

  // ---------- Texte ----------
  const kp = K.kopf({ head: "Schnittstellen und eigene Werkzeuge", headLines: ["Schnittstellen und", "eigene Werkzeuge"], on: 0 });
  const T1 = K.satz("Ich verbinde *Websites und Shops* mit *CRM-, ERP- und Bewerbermanagementsystemen*.", { maxEm: N ? 14 : 15, on: 0 });
  const T2 = K.satz("Wo ein gekauftes Werkzeug nicht zu Ihren Abläufen passt, *entwickle ich eines, das passt*.", { maxEm: N ? 14 : 15, on: 0 });

  // ---------- Layout (Endlage, Zahlen) ----------
  const SW = Math.max(N ? 3.6 : 4.6, kp.h.w / .86 + .4);             // Bildschirmbreite
  const SWm = SW + .4;                                     // Sockel des Wagens
  const dOf = w => K.trage(0, w, {}).D;
  const Dm = dOf(kp.h.w), D1 = dOf(T1.tw), D2 = dOf(T2.tw);
  const Wf1 = T1.tw + .9, Wf2 = T2.tw + .9;
  const G = N ? [.8, .9, .8, 1.1, .9] : [.9, 1.1, .9, 1.5, 1.3];       // Lücken: Wagen–Fahne1, Fahne1–CRM, CRM–Fahne2, Fahne2–ERP, ERP–BEW
  const mX0 = 0, mX1 = SWm, cmEnd = SWm / 2;
  const f1L = mX1 + G[0], f1c0 = f1L + Wf1 / 2, f1cF = f1c0 + D1, f1R = f1cF + Wf1 / 2;
  const cX0 = f1R + G[1], cSx = cX0 + DDW / 2;
  const f2L = N ? f1R + .9 : cX0 + DDW + G[2], f2c0 = f2L + Wf2 / 2, f2cF = f2c0 + D2, f2R = f2cF + Wf2 / 2;
  const eX0 = f2R + G[3], eSx = eX0 + DDW / 2;
  const bX0 = eX0 + DDW + G[4], bSx = bX0 + DDW / 2;
  // Reihenfolge der Geräte in x; Kabelbahn = Platz in dieser Reihenfolge (das nächste Gerät biegt zuerst ab)
  // Handy: CRM und Bewerbermanagement stehen hinter Fahne 1, das ERP hinter Fahne 2 (das Bild zum Satz steht über dem Satz)
  const ORDER = N ? [["CRM", "rect"], ["Bewerbermanagement", "rect"], ["ERP", "round"]] : [["CRM", "rect"], ["ERP", "round"], ["Bewerbermanagement", "rect"]];
  const SX = N ? [f1cF - 1.1, f1cF + 1.1, f2cF] : [cSx, eSx, bSx];
  const ei = N ? 2 : 1;
  const offs = N ? [.85 * hw, .6 * hw, .35 * hw] : [.85 * hw, .6 * hw, .35 * hw];
  const sc = N ? .75 : 1;                                   // Zeitmaß der Steckvorgänge in Welteinheiten der Kamera
  const LA = N ? 2.6 : 1.0, dl = LA - 1.0;                  // Dauer des Anlaufs zur Buchse (Handy: weiter Weg nach hinten)
  const xsN = mX0 - Dm - hw;
  const xeEnd = SX[ei] - BEND - offs[ei] + (3.8 + dl) * sc + .3;
  const xs = xsN, xe = N ? Math.max(f2cF, xeEnd) : bSx;
  K.strecke(xs, xe);
  const bAt = K.bAt, xAt = K.xAt, bE = e => e / (xe - xs);
  const inAt = xL => Math.max(.004, K.sicht(xL).in);
  K.sheet(mX0 - Dm - 2.5, xe + 3, LZ - 12, LZ + 3);

  // ---------- Fahrten (Mitfahrt am Handy) ----------
  const MT = K.trage(cmEnd, kp.h.w, {}), FT1 = K.trage(f1cF, T1.tw, {}), FT2 = K.trage(f2cF, T2.tw, {});

  // ---------- Rollwagen mit Bildschirm (T0) ----------
  const mc0 = MT.c0, mxL = mc0 - SWm / 2;
  const tM = inAt(mxL) + .002;
  F.part("wagen", Math.max(.002, tM - .002), bE(1.6));
  const mpar = MT.node(R);
  const hzM = hingeZ(SLH), zfM = hzM + .62, zbM = hzM - .5;
  const slab = K.slab(mpar, mxL, mxL + SWm, zfM, zbM, SLH, tM, bE(.9), { col: METAL, top: METAL });
  for (const u of [.4, SWm - .4]) K.rect(K.panel(mpar, [mxL + u - .13, zfM + .03], [mxL + u + .13, zfM + .03], [0, 1], tM + bE(.1), bE(.6), Q, { over: .02 }), 0, 0, .26, .13, METAL, .4);
  const DX = SW - .4, DY = DX / 1.6, CH = .22, SL = CH + DY + .12;
  const scr = K.panel(slab, [mxL + .2, hzM], [mxL + .2 + SW, hzM], [0, -1], tM + bE(.7), bE(1.1), UP, { over: .03 });
  K.rect(scr, 0, 0, SW, SL, FACE, .5);
  const PXU = N ? 400 : 380;
  K.onPanel(scr, K.decal(Math.round(SW * PXU), Math.round(SL * PXU), (x, W, H) => {
    const bz = .055 * PXU, dx = (SW - DX) / 2 * PXU, dy = (SL - CH - DY) * PXU;
    x.fillStyle = ink(.84); rr(x, dx - bz, dy - bz, DX * PXU + 2 * bz, DY * PXU + 2 * bz + (CH - .07) * PXU, bz * .5); x.fill();
    x.save(); x.translate(dx, dy); x.beginPath(); x.rect(0, 0, DX * PXU, DY * PXU); x.clip(); pageDraw(x, DX * PXU, DY * PXU); x.restore();
  }, SW, SL, tM + bE(1.6), .04), SW / 2, SL / 2, 1, [0, -1]);
  for (const [u, sd] of [[0, -1], [SW, 1]]) { const wl = K.panel(scr, scr.uv(u, 0), scr.uv(u, .8), [sd, 0], tM + bE(1.7), bE(.4), -Q, { over: .05 }); K.P(wl, [[0, 0], [.8, 0], [.3 * Math.sin(lean), .3 * Math.cos(lean)]], METAL, .35); }
  // Kopf als Überschrift der Website
  kp.h.on = tM + bE(1.9);
  K.onPanel(scr, kp.h, (SW - DX) / 2 + DX * .07 + kp.h.w / 2 - kp.h.t.padX * kp.h.e, CH + DY - DY * .33, 1, [0, -1]);

  // ---------- Kabel mit Stecker (Kabel wird gezogen, der Stecker läuft vorn) ----------
  const tmp = new THREE.Vector3(), tg = new THREE.Vector3();
  function makeCable(pts, col, r, shake) {
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5), total = curve.getLength(), TS = 520, RS = 8;
    const geo = new THREE.TubeGeometry(curve, TS, r, RS, false);
    const tube = K.add(new THREE.Mesh(geo, K.paperMaterial(col))); tube.frustumCulled = false;
    const px = new Float32Array(TS + 1);
    for (let i = 0; i <= TS; i++) px[i] = curve.getPointAt(i / TS).x;
    const kOf = x => {
      if (x <= px[0]) return 0; if (x >= px[TS]) return 1;
      let lo = 0, hi = TS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (px[m] <= x) lo = m; else hi = m; }
      return (lo + (x - px[lo]) / Math.max(1e-9, px[hi] - px[lo])) / TS;
    };
    const kZ = (z, from) => { for (let i = Math.floor(from * TS); i <= TS; i++) if (curve.getPointAt(i / TS).z <= z) return i / TS; return 1; };
    // Stecker: Körper mit Hals und zwei Kontakten, Spitze im Ursprung, nach hinten ausgedehnt
    const plug = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(.46, .3, .4), K.paperMaterial("#5a5953")); body.position.set(0, 0, -.42);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(.26, .2, .1), K.paperMaterial("#6a6862")); neck.position.set(0, 0, -.67);
    plug.add(body, neck);
    for (const sx of [-.1, .1]) { const pr = new THREE.Mesh(new THREE.BoxGeometry(.07, .04, .22), K.paperMaterial("#c9c4b8")); pr.position.set(sx, 0, -.11); plug.add(pr); }
    body.add(new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .45, depthWrite: false })));
    plug.scale.setScalar(.7); K.add(plug);
    const c = { curve, total, kOf, kZ, drive: () => 0 };
    K.anim(b => {
      const k = clamp(c.drive(b), 0, 1), vis = k > .004;
      tube.visible = vis; plug.visible = vis; if (!vis) return;
      geo.setDrawRange(0, Math.floor(k * TS) * RS * 6);
      curve.getPointAt(k, tmp); curve.getTangentAt(k, tg);
      plug.position.copy(tmp).addScaledVector(tg, PLUGL);
      plug.lookAt(plug.position.x + tg.x, plug.position.y + tg.y, plug.position.z + tg.z);
      if (c.shake) { const a = c.shake(b); if (a) plug.rotateY(a); }
    });
    return c;
  }
  const S0 = mX1 - .7, ENDZ = DZ + .05 + PLUGL;
  const COL = ["#8e8981", "#8a857c", "#928d84"];
  const gateB = Math.max(MT.bB || 0, tM + .1), Xg = xAt(gateB);
  const cabs = SX.map((sx, i) => {
    const l = LANE[i], pts = [V(S0, SLH + .05, l), V(S0 + .5, SLH + .05, l), V(mX1 + .02, SLH + .04, l), V(mX1 + .35, .05, l)];
    for (let x = mX1 + 2.4; x < sx - BEND - 1.2; x += 2.4) pts.push(V(x, .05, l));
    pts.push(V(sx - BEND, .05, l), V(sx - BEND * .55, .07, l - .03), V(sx - BEND * .15, .17, l - .22), V(sx, .30, l - .45), V(sx, .36, ENDZ));
    const c = makeCable(pts, COL[i], .04);
    c.xA = sx - BEND; c.kA = c.kOf(c.xA); c.XA = c.xA - offs[i];
    // Verfolgung: die Spitze läuft vor der Kamera her (Abstand offs), aus dem Wagen heraus doppelt so schnell
    c.track = b => { const X = xAt(b); if (b < gateB) return 0; return c.kOf(Math.min(X + offs[i], S0 + 2.2 * (X - Xg))); };
    return c;
  });
  // CRM und Bewerbermanagement: Stecker läuft in die Buchse
  for (const i of [0, 1, 2].filter(i => i !== ei)) {
    const c = cabs[i];
    c.drive = b => { const X = xAt(b); if (X < c.XA) return c.track(b); const u = clamp((X - c.XA) / ((LA + .2) * sc), 0, 1); return c.kA + (1 - c.kA) * mech(u, .03); };
    c.tIn = bAt(c.XA + (LA + .2) * sc);
  }
  // ERP: runde Buchse, der rechteckige Stecker passt nicht. Stoß, Rückzug, Adapter, Einrasten.
  const ce = cabs[ei];
  const kB = 1 - .06 / ce.total, kR = N ? ce.kZ(DZ + AD + AH + .15 + PLUGL, ce.kA) : ce.kA + .2 / ce.total, kA2 = ce.kZ(-.03, ce.kA);
  const EV = [[0, LA, ce.kA, kB, 0], [1.15 + dl, 1.3 + dl, kB, 1, "lin"], [1.35 + dl, 2.0 + dl, 1, kR, .06], [3.1 + dl, 3.8 + dl, kR, kA2, .05]];
  ce.drive = b => {
    const X = xAt(b); if (X < ce.XA) return ce.track(b);
    const d = (X - ce.XA) / sc; let k = ce.kA;
    for (const [a, e, k0, k1, o] of EV) { if (d < a) break; const x = clamp((d - a) / (e - a), 0, 1); k = k0 + (k1 - k0) * (o === "lin" ? x : o === 0 ? sm(x) : mech(x, o)); }
    return k;
  };
  ce.shake = b => { const d = (xAt(b) - ce.XA) / sc - 1.15 - dl; return d > 0 && d < 1.0 ? .11 * Math.sin(d * 16) * Math.exp(-d * 4) : 0; };
  ce.tIn = bAt(ce.XA + (3.8 + dl) * sc);

  // ---------- Geräte ----------
  function device(i, label, x0, kind) {
    const tD = inAt(x0) + .004;
    F.part(label.toLowerCase(), Math.max(.004, tD - .006), .05);
    const box = K.box(R, x0, x0 + DDW, DZ, DZ - DDP, DDH, tD, .06, { col: CASE, fcol: FRONTC });
    const plateV = [DDH - 1.0, DDH - .35];
    K.onPanel(box.fr, K.decal(Math.round(DDW * 300), Math.round(DDH * 300), (x, W, H) => deviceFront(x, W, H, DDW, DDH, kind, plateV), DDW, DDH, tD + .04), DDW / 2, DDH / 2, -1);
    const m = K.measure([label.toUpperCase()], { font: "kicker" });
    const e = Math.min(K.EV * .8, (DDW - .6) / m.tw);
    K.onPanel(box.fr, K.print([label.toUpperCase()], e, tD + .05, { font: "kicker", col: "#303033", align: "center" }), DDW / 2, (plateV[0] + plateV[1]) / 2, -1);
    // Statuspunkt: leuchtet, sobald das Kabel steckt
    K.ticker(box.fr, .05, box.fr.uv(DDW - .35, plateV[0] - .22), [0, 1], -1, cabs[i].tIn);
    return box;
  }
  ORDER.forEach(([label, kind], i) => device(i, label, SX[i] - DDW / 2, kind));

  // ---------- Adapterstück: faltet sich aus dem Bogen vor die runde Buchse und rastet ein ----------
  const eSxA = SX[ei], tAd = inAt(eSxA - AW / 2);
  F.part("adapter", tAd, bE(1.6));
  const zp = DZ + AD, tPl = bAt(ce.XA + (2.05 + dl) * sc), tLd = bAt(ce.XA + (2.6 + dl) * sc);
  const adF = K.panel(R, [eSxA - AW / 2, zp], [eSxA + AW / 2, zp], [0, 1], tPl, bE(.6 * sc), Q, { over: .06 });
  K.rect(adF, 0, 0, AW, AH, ADAPT, .5);
  const adD = K.panel(adF, adF.uv(0, AH), adF.uv(AW, AH), [0, 1], tLd, bE(.45 * sc), Q, { over: .06 });
  K.rect(adD, 0, 0, AW, AD, ADAPT, .5);
  K.onPanel(adF, K.decal(Math.round(AW * 300), Math.round(AH * 300), (x, W, H) => adapterFront(x, W, H, AW, AH), AW, AH, tPl + bE(.5 * sc)), AW / 2, AH / 2, -1);

  // ---------- Kabelfahne: Fahne steht hinter den Kabeln, Klebeband am Fuß, der Satz auf der Fläche ----------
  function flag(par, x0, W, T, tF, name) {
    F.part(name, Math.max(.004, tF - .006), .05);
    const bandH = .26, vb = bandH + .1, H = vb + T.h + .22, cut = .2;
    const fl = K.panel(par, [x0, ZF], [x0 + W, ZF], [0, -1], tF, .05, UP, { over: .04 });
    K.P(fl, [[0, 0], [W, 0], [W, H - cut], [W - cut, H], [cut, H], [0, H - cut]], FLAGC, .5);
    K.onPanel(fl, K.decal(Math.round(W * 200), Math.round(bandH * 200), bandDraw, W, bandH, tF + .05, .03), W / 2, bandH / 2, 1, [0, -1]);
    // Klebeschlaufen: zwei Streifen laufen über das ganze Bündel (über den Kabeln, vorn heruntergezogen) und gehen in den Fuß der Fahne über
    for (const u of [W * .26, W * .74]) K.slab(par, x0 + u - .27, x0 + u + .27, LANE[2] + .12, ZF - .02, .135, tF + .01, .04, { col: STRAP, top: STRAP, walls: "flr" });
    T.on = tF + .07;
    K.onPanel(fl, T, W / 2, vb + T.h / 2, 1, [0, -1]);
    return fl;
  }
  const tF1 = inAt(f1c0 - Wf1 / 2) + .004, tF2 = inAt(f2c0 - Wf2 / 2) + .004;
  flag(FT1.node(R), f1c0 - Wf1 / 2, Wf1, T1, tF1, "fahne1");
  flag(FT2.node(R), f2c0 - Wf2 / 2, Wf2, T2, tF2, "fahne2");

  // ---------- Faden: das Signal läuft auf dem Kabelbündel (Bahn des Bewerbermanagements) bis vor dessen Gerät, dann weiter ----------
  const YC = .095;
  const faden = [
    [mX0 + .6, .004, FZ], [mX1 + .15, .004, FZ], [mX1 + .9, YC, LANE[2]],
    [SX[2] - BEND - 1.1, YC, LANE[2]], [SX[2] - BEND - .2, .004, FZ], [xe + 4, .004, FZ]
  ];

  return {
    strecke: [xs, xe], lineZ: LZ,
    faden,
    anchor: cmEnd,
    stops: [{ name: "t0", prints: [kp.h] }, { name: "t1", prints: [T1] }, { name: "t2", prints: [T2] }]
  };
}
