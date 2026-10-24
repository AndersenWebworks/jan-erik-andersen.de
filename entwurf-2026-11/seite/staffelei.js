// Szene „Gestaltung“ (Fassung 2026-11, Bogen + Bastellinien): eine Atelier-Staffelei steht vor einer Wand mit Fenster, draußen steht
// ein Baum aus Papier. Auf der Staffelei steht zuerst ein Deckblatt mit den zwei Sätzen und einer Bleistiftskizze des Baums, darüber
// klappen nacheinander drei Tafeln mit den echten Arbeiten (Bild, Bildunterschrift). Text wörtlich aus Raumtext 2 (#leistungen, Gestaltung):
//   „Für mich gehört Gestaltung zur Entwicklung. Ich entwerfe Erscheinungsbilder und Oberflächen selbst oder setze vorhandene Entwürfe
//   sorgfältig um.“ steht auf dem Deckblatt (erster Satz in der Marke, zweiter in Grotesk). Die Belege stehen als Bildunterschriften.
//
// Aufbau (alles aus dem Bogen geklappt, Faltplan flach in x/z; die stehenden Teile hinterlassen keinen Abdruck, nur ihre Falzlinie):
// - Staffelei (Atelier-Staffelei, lehnt 76°): zwei gespreizte Vorderbeine, Mittelmast, Fußquerholm, Ablage mit Träger und Vorderkante in
//   Arbeitshöhe, Kopfklemme (Vierkant um die Klappachse der Tafeln), Stützbein hinten (klappt aus der Klemme zum Boden, 68°).
//   Holz liegt 4 cm hinter der Ebene der Tafeln, die Tafeln stehen frei davor auf der Ablage; nichts vom Gestell liegt vor einer Tafel.
// - Tafeln: alle gleich groß (Deckblatt und drei Arbeiten; Breitbild quer, Handy hochkant), liegen zuerst hinten auf dem Stützbein
//   (von vorn ganz hinter dem Deckblatt) und klappen nacheinander über die Klemme nach vorn auf die Ablage, jede mit Rückprall
//   (Anschlag, kurz zurück, einrasten: drei Knoten am selben Scharnier). Jede spätere Tafel bedeckt die frühere ganz.
// - Wand: schließt die Szene nach hinten ab, mit Stärke (Kopf, Stirnseiten), Fensteröffnung mit Laibung, innerer Fensterbank und
//   Fensterrahmen (zwei Flügel, Kämpfer, Oberlicht, Sprossen) in der Laibung. Steht auf, nachdem die Staffelei ihren Platz geräumt hat.
// - Baum: draußen hinter der Wand, im Fenster gerahmt; drei gestaffelte Lagen (hintere Krone, Stamm mit Ästen, vordere Krone),
//   jede steht an ihrer Fußlinie auf (Pop-up). Dieselben Umrisse zeichnet der Bleistift auf das Deckblatt.
//
// Genutzte Kern-API: K.sheet, K.word, K.print, K.decal, K.onPanel, K.panel, K.rect, K.P, K.measure, F.part, F.sketch, F.geruest, F.spur;
// Knotenoptionen over, lv, nocut, nofold.
// Rückgabe: { fov, fovN, track, grid, stops, keys, names, dbg, info }. Einhängen: default (K, o): o.x, o.z verschieben die Szene im Bogen,
// o.b0/o.b1 bilden den Szenenfortschritt 0 … 1 auf einen Abschnitt des Baufortschritts ab, o.sheet = false lässt den eigenen Bogen weg,
// o.heading = false lässt die Lettern „Gestaltung“ weg.

const ink = a => `rgba(48,48,51,${a})`;
const IMPRINT = { fill: "#edeff5", col: "#c9cbd1", line: 2.2 };

// Arbeiten: Bildverhältnis Breite : Höhe der eingebetteten Bilder (NOVUM und Plakat 1109 : 1600, Audi 1600 : 1130).
// Bildunterschrift zweistufig: Titel (Grotesk, dunkel) und Angabe (Grotesk, grau), Wortlaut wie bisher.
const WORKS = [
  { id: "plakat", iar: 1109 / 1600, title: "Take the Gloves Off", sub: "Logo und Styleguide, ehrenamtlich" },
  { id: "novum", iar: 1109 / 1600, title: "NOVUM", sub: "Cover" },
  { id: "audi", iar: 1600 / 1130, title: "100 Jahre Audi", sub: "Ausstellungsmotiv" }
];

// Bilder (ImageBitmap) aus bilder/staffelei-bilder.js (eingebettet, die Vorschau-Sandbox sperrt Nachladungen); fehlen sie, bleibt der Bleistift-Platzhalter
const BMP = {};
try {
  const { BILDER } = await import("./bilder/staffelei-bilder.js");
  await Promise.all(Object.entries(BILDER).map(async ([k, b64]) => {
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    BMP[k] = await createImageBitmap(new Blob([buf], { type: "image/jpeg" }));
  }));
} catch (e) { /* Platzhalter */ }

// Bildfläche: das Bild füllt die Fläche (gleiches Verhältnis, nichts gestaucht), feine Haarlinie als Kante; ohne Bild Passermarken und Diagonalen
function drawWork(x, W, H, im) {
  if (im) {
    x.drawImage(im, 0, 0, W, H);
    x.strokeStyle = "rgba(48,48,51,.22)"; x.lineWidth = Math.max(1, H * .0016); x.strokeRect(.5, .5, W - 1, H - 1);
    return;
  }
  const m = .05 * Math.min(W, H), x0 = m, y0 = m, x1 = W - m, y1 = H - m, tick = Math.min(W, H) * .1;
  x.strokeStyle = ink(.34); x.lineWidth = Math.max(1.2, H * .004); x.lineCap = "round";
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    x.beginPath(); x.moveTo(cx + sx * tick, cy); x.lineTo(cx, cy); x.lineTo(cx, cy + sy * tick); x.stroke();
  }
  x.strokeStyle = ink(.1); x.lineWidth = Math.max(1, H * .0028);
  x.beginPath(); x.moveTo(x0 + tick * 1.3, y0 + tick * 1.3); x.lineTo(x1 - tick * 1.3, y1 - tick * 1.3); x.moveTo(x1 - tick * 1.3, y0 + tick * 1.3); x.lineTo(x0 + tick * 1.3, y1 - tick * 1.3); x.stroke();
}

// ---------- Baum (Pop-up): ein Stammblatt (Stamm, Äste, Leittrieb) steht an seiner Fußlinie auf; am Leittrieb hängen zwei Kronen aus je zwei
// Hälften, die vordere klappt nach vorn auf, die hintere nach hinten (über Kreuz gefaltete Kronenlagen). Maße in Vorderansicht: x mittig, y vom Boden.
// Kronenhälfte: halbe Ellipse (Falzkante auf x = 0), auf jeder Außenkante ein Bogen als Wölbung; innere Fugen ohne Kante, damit die Hälfte als
// eine Fläche mit gewelltem Umriss erscheint. Alle Stücke konvex (Fächer-Dreiecke im Faltkern).
function halfCrown(cy, rx, ry, n, bul) {
  const V = [];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + Math.PI * i / (n - 1); V.push([rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  V[0][0] = 0; V[n - 1][0] = 0;
  const parts = [{ pts: V, e: V.map((_, i) => i === n - 1 ? .12 : 0) }];   // Falzkante nur sehr zart
  for (let i = 0; i < n - 1; i++) {
    const p = V[i], q = V[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
    let nx = dy / L, ny = -dx / L;
    if (((p[0] + q[0]) / 2) * nx + ((p[1] + q[1]) / 2 - cy) * ny < 0) { nx = -nx; ny = -ny; }
    const h = L * bul[i % bul.length], arc = [p];
    for (let j = 1; j < 6; j++) { const t = j / 6, s = Math.sin(Math.PI * t) * h; arc.push([p[0] + dx * t + nx * s, p[1] + dy * t + ny * s]); }
    arc.push(q);
    parts.push({ pts: arc, e: arc.map((_, k) => k === arc.length - 1 ? 0 : .5) });
  }
  return { parts, y0: cy - ry, y1: cy + ry };
}
const mirror = c => ({ ...c, parts: c.parts.map(p => ({ pts: p.pts.map(([x, y]) => [-x, y]), e: p.e })) });
function treeModel() {
  const H1 = 1.42;
  const trunk = [
    { pts: [[-.16, 0], [.16, 0], [.08, H1], [-.08, H1]], e: [.5, .5, 0, .5] },
    { pts: [[-.08, H1], [-.03, H1], [-.43, 2.36], [-.455, 2.35]], e: [0, .4, .4, .4] },           // Ast links (schlank, läuft spitz aus)
    { pts: [[.03, H1], [.08, H1], [.47, 2.5], [.445, 2.51]], e: [0, .4, .4, .4] },                // Ast rechts
    { pts: [[-.03, H1], [.03, H1], [.026, 1.6], [-.026, 1.6]], e: [0, .5, 0, .5] },                // Leittrieb unten (Rinde)
    { pts: [[-.026, 1.6], [.026, 1.6], [.02, 3.42], [-.02, 3.42]], e: [0, 0, 0, 0], leaf: 1 }      // Leittrieb in der Krone (Falzkante der Kronen, kronenfarben, ohne Kante)
  ];
  // hintere Krone groß und hoch (klappt nach hinten), vordere kleiner und tiefer (klappt nach vorn); Wölbungen je Hälfte leicht verschieden
  const backR = halfCrown(2.6, 1.2, .86, 5, [.2, .3, .24, .32]), backL = mirror(halfCrown(2.6, 1.12, .86, 5, [.18, .32, .26, .3]));
  const frontR = halfCrown(1.86, .72, .44, 4, [.24, .34, .3]), frontL = mirror(halfCrown(1.86, .66, .44, 4, [.22, .32, .3]));
  return { trunk, back: [backR, backL], front: [frontR, frontL], H1, top: 3.75, AB: 40 * Math.PI / 180, AF: 52 * Math.PI / 180 };
}
const insideConvex = (P, x, y) => {
  let s = 0;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (Math.abs(c) < 1e-12) continue;
    if (s === 0) s = Math.sign(c); else if (Math.sign(c) !== s) return false;
  }
  return true;
};

export default function (K, o = {}) {
  const { F, R, V, Q, PI, EPS, sm, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  // Töne: Holz in drei Lagen (Beine, Mast/Stütze, Ablage), Klemme dunkler; Wand warmgrau, Laibung eine Spur dunkler, Rahmen hell lackiert
  const WOOD = c3("#d2d4da"), WOOD2 = c3("#c6c9ce"), WOOD3 = c3("#dcdee4"), CLAMP = c3("#b4b6bb"), KNOB = c3("#97999d");
  const PAGE = c3("#f6f8fe"), WALL = c3("#e1e4e9"), REVEAL = c3("#d5d7dd"), SILL = c3("#eaedf2"), FRAME = c3("#f3f5fb"), PLINTH = c3("#cfd2d7");
  const CROWN_B = c3("#cdd6c1"), CROWN_F = c3("#dfe5d3"), BARK = c3("#bbbec3");

  // ---------- Verschiebung im Bogen und Zeitabbildung (Szene 0 … 1 -> Baufortschritt b0 … b1) ----------
  const ox = o.x || 0, oz = o.z || 0, B0 = o.b0 || 0, B1 = o.b1 === undefined ? 1 : o.b1, SP = B1 - B0;
  const T = t => B0 + t * SP, D = d => d * SP;
  const rp = a => [a[0] + ox, a[1] + oz];
  const P3 = (x, y, z) => V(x + ox, y, z + oz);
  const hinge = (par, a, b, n, t0, d, ang, opt) => K.panel(par, par === R ? rp(a) : a, par === R ? rp(b) : b, n, T(t0), D(d), ang, opt);
  const part = (name, t0, d) => F.part(name, T(t0), D(d));
  const FLAT = { nocut: 1, nofold: 1 };

  // ---------- Maße der Staffelei ----------
  const ZB = 2.0;                                        // Fußlinie der Vorderbeine im Bogen
  const FBd = 76, FRd = 68, FB = FBd * PI / 180, FRr = FRd * PI / 180;
  const SW = N ? 2.3 : 3.44, SH = N ? 3.3 : 2.78;        // Tafel: Breite, Höhe (Breitbild quer, Handy hochkant)
  const VB = N ? 1.72 : 1.92;                            // Unterkante der Tafeln entlang der Beine gemessen (Arbeitshöhe der Ablage)
  const VH = VB + SH;                                    // Klappachse der Tafeln (in der Kopfklemme)
  const GAP = .035;                                      // die Tafeln lehnen um GAP vor der Ebene der Beine (unten rund 10 cm davor)
  const RY = VH * Math.sin(FB), LEGL = RY / Math.sin(FRr), LEGW = .16;
  const ZR = ZB - VH;                                    // Klappachse im Faltplan (Staffelei liegt flach nach hinten)
  const BWH = 2.2, uu = x => BWH + x;                    // Bezug der Brettkoordinaten (x mittig)
  const FS = N ? .92 : 1.08, TSX = .3, LW = .15, MW = .13;  // Spreizung der Vorderbeine am Fuß, am Kopf, Breite Bein, Breite Mast
  const CL = N ? .38 : .44, CH = .065;                   // Kopfklemme: halbe Länge, halbe Stärke
  const VT = VH - CH;                                    // Oberkante von Beinen und Mast (unter der Klemme)
  const DL = -.046, DM = -.041, DQ = -.036;               // Lage des Holzes hinter der Tafelebene: Beine, Mast, Querholm
  const LIPW = N ? .98 : 1.3, LIPD = .3, LIPF = .05;     // Ablage: halbe Breite, Tiefe, Vorderkante
  // Ablage: Oberkante so hoch, dass die vorderste Tafel unten genau aufsitzt (sie steht GAP vor der Ebene: Höhe VB·sin + SH·sin(GAP)·cos)
  const L0 = VB + SH * Math.sin(GAP) * Math.cos(FB) / Math.sin(FB);
  const legX = v => FS + (TSX - FS) * v / VT;            // Mitte des rechten Vorderbeins bei v

  // ---------- Maße Wand, Fenster, Baum ----------
  const ZW = N ? -2.9 : -2.4, WT = .3;                   // Vorderseite der Wand im Bogen, Wandstärke
  const WX0 = N ? -4.6 : -5.7, WX1 = N ? 5.8 : 6.9, WH = N ? 6.6 : 6.4;
  const O0 = N ? 1.7 : 2.15, O1 = N ? 4.5 : 5.15, S0 = N ? 1.2 : 1.15, S1 = N ? 4.95 : 4.65;   // Fensteröffnung (x) und Brüstung, Sturz
  const OW = O1 - O0, OH = S1 - S0, FD = .15, FWB = .09, SD = .26;   // Rahmen in der Laibung (Tiefe), Rahmenbreite, Tiefe der Fensterbank
  const XT = (O0 + O1) / 2 + (N ? .3 : .45), ZT = ZW - WT - (N ? 4.4 : 4.6);          // Baum: etwas rechts der Fenstermitte (die Kamera steht links davor), weit hinter der Wand
  const TREE = treeModel(), TOPY = TREE.top;           // Baum: Stammblatt, Kronen (Vorderansicht), Höhe der hinteren Krone

  const BZ0 = Math.min(ZR - LEGL, ZW - WH - WT, ZT - TOPY) - .8, BZ1 = N ? 7.4 : 6.6;     // Ausdehnung des eigenen Bogens (z)
  const BX0 = -6.4, BX1 = 7.4;
  if (o.sheet !== false) K.sheet(BX0 + ox, BX1 + ox, BZ0 + oz, BZ1 + oz, "#f5f8fd", o.sheetFrom !== undefined ? o.sheetFrom : -1);

  // ---------- Überschrift (Lettern stehen beim Scrollen aus dem Bogen auf) ----------
  part("gest-titel", 0, .01);
  let head = null;
  if (o.heading !== false) {
    const he = N ? .5 : .42, w = K.measure(["Gestaltung"], { font: "marke" }).tw * he;
    head = K.word(["Gestaltung"], he, -w / 2 + ox, (N ? 6.0 : 5.4) + oz, T(.004), D(.045), { font: "marke", clock: "b", foot: 1, imprint: { ...IMPRINT, closeB: .01 } });
    head.off = T(.31);                                   // die Lettern blenden aus, bevor die Kamera auf Leseblick geht
  }

  // ---------- Staffelei: Vorderbeine, Mast, Querholm, Ablage, Kopfklemme, Stützbein ----------
  part("gest-staffelei", .01, .04);
  const tB = .06, dB = .09;
  const board = hinge(R, [-BWH, ZB], [BWH, ZB], [0, -1], tB, dB, FB, { over: .025, nocut: 1 });
  for (const sd of [-1, 1]) {                                                            // Vorderbeine: unten gespreizt, oben unter der Klemme
    K.P(board, [[uu(sd * FS - LW / 2), .012], [uu(sd * FS + LW / 2), .012], [uu(sd * TSX + LW / 2), VT], [uu(sd * TSX - LW / 2), VT]], WOOD, .5, DL);
  }
  const vQ0 = .46, vQ1 = .6, xQ = legX((vQ0 + vQ1) / 2) + .02;
  K.P(board, [[uu(-xQ), vQ0], [uu(xQ), vQ0], [uu(xQ), vQ1], [uu(-xQ), vQ1]], WOOD3, .5, DQ);                  // Fußquerholm
  K.P(board, [[uu(-MW / 2), vQ0], [uu(MW / 2), vQ0], [uu(MW / 2), VT], [uu(-MW / 2), VT]], WOOD2, .5, DM);    // Mittelmast
  K.P(board, [[uu(-LIPW), L0 - .13], [uu(LIPW), L0 - .13], [uu(LIPW), L0], [uu(-LIPW), L0]], WOOD, .5, -.003);   // Träger der Ablage (vorn bündig mit der Tafelebene)
  // Ablage: klappt aus dem Träger waagerecht nach vorn, reicht hinten bis an die Beine; Vorderkante klappt hoch
  const lip = hinge(board, board.uv(uu(-LIPW), L0), board.uv(uu(LIPW), L0), [0, 1], tB + .12, .05, FB, { over: 0, ...FLAT });
  K.rect(lip, 0, DL * .97, 2 * LIPW, LIPD, WOOD3, .5);
  const lipF = hinge(lip, lip.uv(0, LIPD), lip.uv(2 * LIPW, LIPD), [0, 1], tB + .15, .04, Q, { over: 0, ...FLAT });
  K.rect(lipF, 0, 0, 2 * LIPW, LIPF, WOOD3, .5);
  // Kopfklemme: Vierkant um die Klappachse (die Tafeln drehen in ihr), Vorder- und Rückseite fest, Ober-, Unter- und Stirnseiten klappen auf
  K.P(board, [[uu(-CL), VH - CH], [uu(CL), VH - CH], [uu(CL), VH + CH], [uu(-CL), VH + CH]], CLAMP, .5, CH);
  K.P(board, [[uu(-CL), VH - CH], [uu(CL), VH - CH], [uu(CL), VH + CH], [uu(-CL), VH + CH]], CLAMP, .5, -CH);
  K.P(board, [[uu(-.05), VH - .04], [uu(.05), VH - .04], [uu(.05), VH + .04], [uu(-.05), VH + .04]], KNOB, .5, CH + .004);   // Klemmschraube
  for (const v of [VH - CH, VH + CH]) {
    const f = hinge(board, board.uv(uu(-CL), v), board.uv(uu(CL), v), [0, -1], tB + .06, .05, Q, { over: 0, ...FLAT });
    K.rect(f, 0, -CH, 2 * CL, CH, CLAMP, .5);
  }
  for (const sd of [-1, 1]) {
    const f = hinge(board, board.uv(uu(sd * CL), VH - CH), board.uv(uu(sd * CL), VH + CH), [sd, 0], tB + .06, .05, Q, { over: 0, ...FLAT });
    K.rect(f, 0, -CH, 2 * CH, CH, CLAMP, .5);
  }
  // Stützbein: hängt in der Klemme, klappt nach hinten zum Boden (kein Überschwingen, der Fuß würde in den Bogen stechen)
  const leg = hinge(board, board.uv(uu(-LEGW / 2), VH), board.uv(uu(LEGW / 2), VH), [0, -1], tB + .06, .09, -(FB + FRr), { over: 0, lv: 1, nocut: 1 });
  K.rect(leg, 0, 0, LEGW, LEGL, WOOD2, .5);

  // ---------- Wand mit Fenster: steht auf, wenn die Staffelei ihren Faltplan geräumt hat ----------
  part("gest-wand", .15, .04);
  const tW = .2, dW = .075;
  const WW = WX1 - WX0, o0 = O0 - WX0, o1 = O1 - WX0;
  const wall = hinge(R, [WX0, ZW], [WX1, ZW], [0, -1], tW, dW, Q, { over: .02, nocut: 1 });
  // Wandfläche um die Öffnung in vier Stücken, Fugen ohne Kante
  K.P(wall, [[0, 0], [o0, 0], [o0, S0], [o0, S1], [o0, WH], [0, WH]], WALL, [.5, 0, .5, 0, .5, .5]);
  K.P(wall, [[o1, 0], [WW, 0], [WW, WH], [o1, WH], [o1, S1], [o1, S0]], WALL, [.5, .5, .5, 0, .5, 0]);
  K.P(wall, [[o0, 0], [o1, 0], [o1, S0], [o0, S0]], WALL, [.5, 0, .5, 0]);
  K.P(wall, [[o0, S1], [o1, S1], [o1, WH], [o0, WH]], WALL, [.5, 0, .5, 0]);
  K.P(wall, [[0, 0], [WW, 0], [WW, .16], [0, .16]], PLINTH, .5, .012);                 // Sockelleiste
  const tWc = tW + .06, dWc = .045;
  // Wandstärke: Kopf und Stirnseiten klappen nach hinten
  K.rect(hinge(wall, wall.uv(0, WH), wall.uv(WW, WH), [0, -1], tWc, dWc, -Q, { over: 0, ...FLAT }), 0, 0, WW, WT, WALL, .5);
  K.rect(hinge(wall, wall.uv(0, 0), wall.uv(0, WH), [-1, 0], tWc, dWc, -Q, { over: 0, ...FLAT }), 0, 0, WH, WT, WALL, .5);
  K.rect(hinge(wall, wall.uv(WW, 0), wall.uv(WW, WH), [1, 0], tWc, dWc, -Q, { over: 0, ...FLAT }), 0, 0, WH, WT, WALL, .5);
  // Laibung: vier Streifen klappen aus der Öffnung nach hinten
  const rL = hinge(wall, wall.uv(o0, S0), wall.uv(o0, S1), [1, 0], tWc + .01, dWc, -Q, { over: 0, ...FLAT });
  K.rect(rL, 0, 0, OH, WT, REVEAL, .5);
  const rR = hinge(wall, wall.uv(o1, S0), wall.uv(o1, S1), [-1, 0], tWc + .01, dWc, -Q, { over: 0, ...FLAT });
  K.rect(rR, 0, 0, OH, WT, REVEAL, .5);
  const rT = hinge(wall, wall.uv(o0, S1), wall.uv(o1, S1), [0, 1], tWc + .01, dWc, -Q, { over: 0, ...FLAT });
  K.rect(rT, 0, 0, OW, WT, REVEAL, .5);
  const rB = hinge(wall, wall.uv(o0, S0), wall.uv(o1, S0), [0, -1], tWc + .01, dWc, -Q, { over: 0, ...FLAT });
  K.rect(rB, 0, 0, OW, WT, REVEAL, .5);
  // Fensterbank innen: klappt nach vorn, etwas breiter als die Öffnung, mit kurzer Stirn
  const sill = hinge(wall, wall.uv(o0, S0), wall.uv(o1, S0), [0, -1], tWc + .03, dWc, Q, { over: 0, ...FLAT });
  K.rect(sill, -.12, 0, OW + .12, SD, SILL, .5);
  K.rect(hinge(sill, sill.uv(-.12, SD), sill.uv(OW + .12, SD), [0, -1], tWc + .05, .04, Q, { over: 0, ...FLAT }), 0, 0, OW + .24, .055, SILL, .5);
  // Fensterrahmen: steht in der Laibung (FD hinter der Wandfläche), zwei Flügel mit je einer Sprosse, Kämpfer und zwei Oberlichter
  const fr = hinge(rB, rB.uv(0, FD), rB.uv(OW, FD), [0, -1], tWc + .05, dWc, Q, { over: 0, ...FLAT });
  const bar = (u0, v0, u1, v1) => K.P(fr, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], FRAME, .4);
  const KV = OH * .72, MID = OW / 2;
  bar(0, 0, FWB, OH); bar(OW - FWB, 0, OW, OH); bar(FWB, 0, OW - FWB, FWB); bar(FWB, OH - FWB, OW - FWB, OH);   // Blendrahmen
  bar(FWB, KV - .05, OW - FWB, KV + .05);                                                // Kämpfer
  bar(MID - .045, FWB, MID + .045, KV - .05); bar(MID - .035, KV + .05, MID + .035, OH - FWB);   // Mittelpfosten unten, Teilung oben
  const SV = FWB + (KV - .05 - FWB) / 2;
  bar(FWB, SV - .025, MID - .045, SV + .025); bar(MID + .045, SV - .025, OW - FWB, SV + .025);   // Sprossen der Flügel

  // ---------- Baum draußen: Stammblatt steht auf, danach klappen die Kronenhälften aus dem Leittrieb (hintere nach hinten, vordere nach vorn) ----------
  part("gest-baum", .22, .04);
  const tTree = .26, XO = 1.6;
  const tree = hinge(R, [XT - XO, ZT], [XT + XO, ZT], [0, -1], tTree, .055, Q, { over: .03, nocut: 1, lv: 2 });
  for (const pc of TREE.trunk) K.P(tree, pc.pts.map(([x, y]) => [x + XO, y]), pc.leaf ? CROWN_B : BARK, pc.e);
  const crowns = [];
  const half = (c, sd, ang, t0, col) => {
    // Falz am Leittrieb (x = 0) von y0 bis y1; die Hälfte liegt in Ruhe flach am Stammblatt (Seite sd), die vorderen auf seiner Vorderseite,
    // die hinteren auf seiner Rückseite (Lage unter dem Stammblatt), so klappt keine durch das Stammblatt
    const nd = hinge(tree, tree.uv(XO, c.y0), tree.uv(XO, c.y1), [sd, 0], t0, .045, ang, { over: .04, ...FLAT, lv: ang < 0 ? 1 : 3 });
    for (const pc of c.parts) K.P(nd, pc.pts.map(([x, y]) => [y - c.y0, Math.abs(x)]), col, pc.e);
    crowns.push(nd); return nd;
  };
  half(TREE.back[0], 1, -TREE.AB, tTree + .045, CROWN_B); half(TREE.back[1], -1, -TREE.AB, tTree + .045, CROWN_B);
  half(TREE.front[0], 1, TREE.AF, tTree + .06, CROWN_F); half(TREE.front[1], -1, TREE.AF, tTree + .06, CROWN_F);

  // ---------- Tafeln: liegen hinten auf dem Stützbein, klappen über die Klemme nach vorn (Rückprall) ----------
  part("gest-tafeln", .1, .05);
  const NP = 4, STEP = 4, PA = PI + FB + FRr - GAP, RB = .09;
  const FL = [{ a: .35, d: .06 }, { a: .54, d: .06 }, { a: .68, d: .06 }, { a: .82, d: .06 }];   // Fenster des Anschlags je Tafel (Szenenzeit)
  const STOPB = [.50, .66, .80, .94];                                                       // Lesestellen
  const LIFT = .0012;
  // Deckblatt: zwei Sätze wörtlich; erster Satz in der Marke (Leitsatz), zweiter in Grotesk, linksbündig
  const TX1 = ["Für mich gehört Gestaltung", "zur Entwicklung."];
  const TX2 = ["Ich entwerfe Erscheinungsbilder", "und Oberflächen selbst oder", "setze vorhandene Entwürfe", "sorgfältig um."];
  const o1p = { font: "marke", lh: 1.12 }, o2p = { lh: 1.36, track: .004 };
  const ML = N ? .24 : .32;                                   // linker Rand des Deckblatts
  const colW = N ? SW - 2 * ML : SW * .55 - ML;               // Satzbreite
  const e1 = Math.min(N ? .15 : .175, colW / K.measure(TX1, o1p).tw), e2 = Math.min(N ? .1 : .106, colW / K.measure(TX2, o2p).tw);
  // Bildunterschriften
  const eT = N ? .105 : .1, eS = eT * (N ? .9 : .88), capGap = .13, MS = N ? .17 : .2, MT = N ? .2 : .2, MB = N ? .2 : .14;
  const capOpt = { lh: 1.2, track: .004 }, subOpt = { lh: 1.2, track: .01, col: "#5f5f63" };

  const pages = [], sheetPrints = [], deckTxt = [], centers = [], deck = {};
  const sheetOf = k => {
    const lv = 2 + (NP - 1 - k) * STEP, x0 = -SW / 2, a = [x0, ZR], b = [x0 + SW, ZR];
    const mkN = (par, ang, t0, d) => K.panel(par, rp(a), rp(b), [0, -1], T(t0), D(d), ang, { nocut: 1, nofold: 1, over: 0, lv });
    const f = FL[k];
    const A = mkN(leg, PA, f.a, f.d), Bn = mkN(A, -RB, f.a + f.d + .004, .014), C = mkN(Bn, RB, f.a + f.d + .02, .018);
    K.rect(C, 0, 0, SW, SH, PAGE, .5);
    return { C, x0 };
  };
  const at = (C, pr, u, v) => K.onPanel(C, pr, u, v, -1, [0, 1], LIFT);
  // Deckblatt
  {
    const { C, x0 } = sheetOf(0), on = T(FL[0].a + FL[0].d * .45);   // Satz erscheint, während das Deckblatt nach vorn umschlägt
    const t1 = K.print(TX1, e1, on, { ...o1p, grp: "gest-deck" }), t2 = K.print(TX2, e2, on, { ...o2p, grp: "gest-deck" });
    const gap = .62 * e1, hTxt = t1.h + gap + t2.h;
    const top = N ? .34 : (SH - hTxt) / 2 - .06;
    const L = pr => ML + pr.w / 2 - pr.t.padX * pr.e;
    const c1 = [L(t1), top + t1.h / 2], c2 = [L(t2), top + t1.h + gap + t2.h / 2];
    at(C, t1, ...c1); at(C, t2, ...c2);
    deckTxt.push(t1, t2); centers.push([(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2]);
    // Bleistiftskizze des Baums: Breitbild rechts neben dem Satz, Handy darunter; Umrisse der drei Lagen (verdeckte Teile weggelassen),
    // Bodenlinie, Schraffur auf der Schattenseite
    const area = N ? [ML, top + hTxt + .3, SW - ML, SH - .26] : [SW * .6, .3, SW - .26, SH - .3];
    const sc = Math.min((area[2] - area[0]) / 3.2, (area[3] - area[1]) / (TOPY + .1));
    const cxS = (area[0] + area[2]) / 2, gyS = area[1] + (area[3] - area[1] + (TOPY + .1) * sc) / 2 - .05 * sc;
    const X = tx => cxS + tx * sc, Y = ty => gyS - ty * sc;
    // Vorderansicht der gefalteten Kronen: Breite mal cos des Faltwinkels; vordere Krone verdeckt Stamm und hintere Krone, Stamm verdeckt hintere Krone
    const proj = (c, ang) => c.parts.map(p => ({ pts: p.pts.map(([x, y]) => [x * Math.cos(ang), y]), e: p.e }));
    const FR = [...proj(TREE.front[0], TREE.AF), ...proj(TREE.front[1], TREE.AF)], BK = [...proj(TREE.back[0], TREE.AB), ...proj(TREE.back[1], TREE.AB)];
    const inF = (x, y) => FR.some(p => insideConvex(p.pts, x, y));
    const inT = (x, y) => TREE.trunk.some(p => insideConvex(p.pts, x, y));
    const inB = (x, y) => BK.some(p => insideConvex(p.pts, x, y));
    const raw = [];
    const outline = (pcs, hide) => {
      for (const pc of pcs) pc.pts.forEach((p, i) => {
        if (pc.e[i] < .3) return;                                          // Falzkanten nicht in der Skizze
        const q = pc.pts[(i + 1) % pc.pts.length], n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / .06));
        for (let j = 0; j < n; j++) {
          const a0 = [p[0] + (q[0] - p[0]) * j / n, p[1] + (q[1] - p[1]) * j / n], a1 = [p[0] + (q[0] - p[0]) * (j + 1) / n, p[1] + (q[1] - p[1]) * (j + 1) / n];
          if (hide((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2)) continue;
          raw.push([a0[0], a0[1], a1[0], a1[1]]);
        }
      });
    };
    outline(FR, () => false);
    outline(TREE.trunk, inF);
    outline(BK, (x, y) => inF(x, y) || inT(x, y));
    raw.push([-1.5, 0, 1.5, 0]);                                                        // Boden
    // Schraffur: kurze Diagonalen auf der rechten unteren Seite der hinteren Krone und rechts am Stamm
    const hatch = [];
    for (let k = 0; k < 14; k++) {
      const c = .1 + k * .13;
      let run = null;
      for (let s = 0; s <= 60; s++) {
        const x = c + s * .025 - .9, y = 2.0 + s * .025 - .45 - k * .02;
        const ok = x > .15 && y < 2.75 && inB(x, y) && !inF(x, y) && !inT(x, y) && x + y > 2.55;
        if (ok && !run) run = [x, y];
        if ((!ok || s === 60) && run) { if (Math.hypot(x - run[0], y - run[1]) > .12) hatch.push([run[0], run[1], x - .025, y - .025]); run = null; }
      }
    }
    for (let k = 0; k < 6; k++) { const y = .18 + k * .19; hatch.push([.03, y, .12, y + .1]); }
    const seg = s => [rp([x0 + X(s[0]), ZR - Y(s[1])]), rp([x0 + X(s[2]), ZR - Y(s[3])])];
    deck.sketch = { C, segs: raw.map(seg), hatch: hatch.map(seg) };
    pages.push(C); sheetPrints.push([t1, t2]);
  }
  // Arbeiten
  WORKS.forEach((wk, i) => {
    const k = i + 1, { C } = sheetOf(k), f = FL[k], on = T(f.a - .004);
    const t = K.print([wk.title], eT, on, { ...capOpt, grp: "gest-cap" + k }), s = K.print([wk.sub], eS, on, { ...subOpt, grp: "gest-cap" + k });
    const capH = t.h + s.h - .02;
    // Bildfläche: ganz in die freie Fläche (ohne Bildunterschrift) eingepasst, Gruppe aus Bild und Unterschrift senkrecht mittig
    const aw = SW - 2 * MS, ah = SH - MT - MB - capGap - capH;
    let iw = aw, ih = aw / wk.iar; if (ih > ah) { ih = ah; iw = ah * wk.iar; }
    const g = ih + capGap + capH, top = MT + (SH - MT - MB - g) / 2, il = (SW - iw) / 2;
    const PXU = 520, fr = K.decal(Math.round(iw * PXU), Math.round(ih * PXU), (x, W, H) => drawWork(x, W, H, BMP[wk.id]), iw, ih, on);
    K.onPanel(C, fr, SW / 2, top + ih / 2, -1, [0, 1], LIFT * .5);
    const L = pr => il + pr.w / 2 - pr.t.padX * pr.e;
    const ct = [L(t), top + ih + capGap + t.h / 2 - .02], cs = [L(s), top + ih + capGap + t.h - .02 + s.h / 2 - .01];
    at(C, t, ...ct); at(C, s, ...cs);
    centers.push([(ct[0] + cs[0]) / 2, (ct[1] + cs[1]) / 2]);
    pages.push(C); sheetPrints.push([t, s, fr]);
  });
  // Drucke einer Tafel gehen, wenn die nächste Tafel sie fast ganz bedeckt (wenige Grad vor dem Anschlag); vorher bleiben sie stehen
  const OFF = k => T(FL[k + 1].a + FL[k + 1].d * .8);
  for (let k = 0; k < NP - 1; k++) for (const pr of sheetPrints[k]) pr.off = OFF(k);
  // Skizze auf dem Deckblatt: zeichnet sich nach dem Aufsetzen, geht mit dem Satz
  const skFade = b => 1 - sm((b - OFF(0)) / .03);
  F.sketch(deck.sketch.C, deck.sketch.segs, T(.415), D(.028), { a: .62, dy: -.0009, fade: skFade });
  F.sketch(deck.sketch.C, deck.sketch.hatch, T(.438), D(.01), { a: .32, dy: -.0009, fade: skFade });

  // ---------- Konstruktionsphase: Bleistift-Grundriss auf dem Bogen (geht, wenn das Teil aufsteht), Gerüst im Raum, Bleistiftspur ----------
  const plan = (pts, closed = true) => { const s = []; for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) s.push([rp(pts[i]), rp(pts[(i + 1) % pts.length])]); return s; };
  const easelPlan = [
    ...plan([[-FS - LW / 2, ZB], [FS + LW / 2, ZB], [TSX + LW / 2, ZR], [-TSX - LW / 2, ZR]]),
    ...plan([[-LEGW / 2, ZR], [LEGW / 2, ZR], [LEGW / 2, ZR - LEGL], [-LEGW / 2, ZR - LEGL]]),
    ...plan([[-SW / 2, ZR], [SW / 2, ZR], [SW / 2, ZR - SH], [-SW / 2, ZR - SH]])
  ];
  F.sketch(R, easelPlan, T(.0), D(.04), { a: .34, fade: b => 1 - sm((b - T(tB + .01)) / D(.04)) });
  const wallPlan = [
    ...plan([[WX0, ZW], [WX1, ZW], [WX1, ZW - WH], [WX0, ZW - WH]]),
    ...plan([[O0, ZW - S0], [O1, ZW - S0], [O1, ZW - S1], [O0, ZW - S1]])
  ];
  F.sketch(R, wallPlan, T(.14), D(.04), { a: .3, fade: b => 1 - sm((b - T(tW + .005)) / D(.04)) });
  F.geruest({ tags: ["gest-staffelei"], t0: T(.01), t1: T(.06), du: D(.03), a: .5 });
  F.geruest({ tags: ["gest-wand"], t0: T(.12), t1: T(.2), du: D(.03), a: .45 });
  F.geruest({ tags: ["gest-baum"], t0: T(.19), t1: T(.26), du: D(.03), a: .4 });
  F.spur({ tags: ["gest-wand"], quiet: [wall], a: .22 });

  // ---------- Lesestellen ----------
  // Bildaufteilung: Tafel fh der Bildhöhe hoch (höchstens fw der Breite), Tafelmitte bei (bx, by) im Ausschnitt.
  // px, sx, sy werden aus Lage der Drucke auf der Tafel gerechnet (Mittel der Druckmitten, wie frameOf im Kern).
  const lay = (k, e, o2) => {
    const [cu, cv] = centers[k], du = cu - SW / 2, dv = -(cv - SH / 2);
    const hp = (W, H) => Math.min(o2.fh * H, o2.fw * W * SH / SW);
    const px = (W, H) => hp(W, H) * e / SH;
    const sx = (W, H) => o2.bx + du * hp(W, H) / SH / (W / 2), sy = (W, H) => o2.by + dv * hp(W, H) / SH / (H / 2);
    return { px, pxN: px, sx, sy, nsx: sx, nsy: sy };
  };
  // Schrift: Großbuchstaben der Bildunterschriften mindestens 16 px (Handy 13 px): die Tafel füllt dafür mehr vom Bild
  const view = N ? { fh: .66, fw: .96, bx: 0, by: .04 } : { fh: .8, fw: .78, bx: 0, by: .04 };
  const viewDeck = N ? view : { ...view, bx: -.16 };
  const stopOf = (prints, b, v) => ({ prints, b: T(b), ...v });
  const S = {
    g0: stopOf(deckTxt, STOPB[0], { ...lay(0, e1, viewDeck), frontal: true, tilt: 14, ntilt: 14 }),
    g1: stopOf(sheetPrints[1].slice(0, 2), STOPB[1], { ...lay(1, eT, view), frontal: true, tilt: 14, ntilt: 14 }),
    g2: stopOf(sheetPrints[2].slice(0, 2), STOPB[2], { ...lay(2, eT, view), frontal: true, tilt: 14, ntilt: 14 }),
    g3: stopOf(sheetPrints[3].slice(0, 2), STOPB[3], { ...lay(3, eT, view), frontal: true, tilt: 14, ntilt: 14 })
  };
  const look = (tx, ty, tz, el, az, dist) => { const e = el * PI / 180, a = az * PI / 180; return P3(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a)); };
  const tg = (x, y, z) => P3(x, y, z);
  const key = (w, b, t, el, az, d, tN, dN) => ({ w, b: T(b), cam: look(...t, el, az, d), tgt: tg(...t), camN: look(...tN, el, az * .7, dN), tgtN: tg(...tN) });
  return {
    fov: 32, fovN: 44, track: 640,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: T(.004), wave: .0025 * SP, d: .04 * SP, out: T(.4) },
    names: S, stops: Object.values(S),
    info: { x0: BX0 + ox, x1: BX1 + ox, z0: BZ0 + oz, z1: BZ1 + oz, b0: B0, b1: B1, heights: { ridge: RY, easel: RY + CH, wall: WH }, bounds: { pages: [SW, SW, SW, SW], SH } },
    dbg: { head, board, leg, lip, lipF, wall, fr, sill, tree, crowns, pages, sheetPrints, deckTxt, ZR, ZB, ZW, ZT, XT, VH, VB, L0, RY, LEGL, SW, SH, GAP, CH },
    keys: [
      key(0, 0, [.8, .3, -1.6], 40, 0, 26, [.5, .3, -1.6], 30),
      key(.9, .2, [.8, 1.7, -.9], 30, 0, 22, [.5, 1.9, -.9], 27),
      key(1, .45, [1.0, 2.5, -.7], 22, 0, 19.5, [.6, 2.7, -.7], 25),
      { w: 1, stop: S.g0 },
      // Kamera ruhig: von Stellung zu Stellung frontal, ohne Schwenk (Yaw 0) und ohne Zurücktreten zwischen den Tafeln (die Zwischenstellung steht nur 6 % vor der Lesestellung und gibt der Klappe Zeit); die nächste Tafel klappt im Lesebild über die Klemme
      { w: 3, b: T(FL[1].a + FL[1].d * .5), fromStop: S.g1, back: 1.06, up: .1 },
      { w: 2, stop: S.g1 },
      { w: 3, b: T(FL[2].a + FL[2].d * .5), fromStop: S.g2, back: 1.06, up: .1 },
      { w: 2, stop: S.g2 },
      { w: 3, b: T(FL[3].a + FL[3].d * .5), fromStop: S.g3, back: 1.06, up: .1 },
      { w: 2, stop: S.g3 },
      key(.9, 1, [.7, 2.6, -.3], 20, 0, 18.5, [.3, 2.8, -.3], 24)
    ]
  };
}
