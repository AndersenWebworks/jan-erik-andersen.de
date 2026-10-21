// Szene „Gestaltung“ (Fassung 2026-11, Bogen + Bastellinien): eine Staffelei klappt aus dem Bogen, darauf landen nacheinander
// drei Blätter in den Formaten der Arbeiten (noch leer, nur Titel klein am Blattrand). Text wörtlich aus Raumtext 2 (#leistungen, Gestaltung):
//   „Für mich gehört Gestaltung zur Entwicklung. Ich entwerfe Erscheinungsbilder und Oberflächen selbst oder setze vorhandene Entwürfe
//   sorgfältig um.“ steht an der Ablage (Querleiste unten, senkrechte Front). Die Belege („Beispiele: …“) stehen als Blatttitel.
//
// Aufbau (alles aus dem Bogen geklappt, Faltplan flach in x/z):
// - Ablage: Frontwand (Text), Deckel (Brett, an die Frontwand gehängt) und zwei Wangen; klappt zuerst hoch.
// - Brett: Staffeleibrett, lehnt 76° (14° nach hinten); Stütze: schmaler Streifen am Brettkopf, klappt nach hinten zum Boden (68°, ohne Überschwingen).
// - Blätter: liegen zuerst hinten auf der Stütze (flach auf dem Bogen, Haarkante erst beim Bewegen) und klappen nacheinander über den Kamm
//   nach vorn auf das Brett, jedes mit Rückprall: Anschlag, kurz zurück, einrasten (drei Knoten am selben Scharnier A/B/C).
//   Reihenfolge Plakat → NOVUM-Cover → „100 Jahre Audi“; gleiche Höhe, Breite nach Format, damit jedes spätere Blatt das frühere ganz bedeckt.
// Formate (angenommen, in keiner Quelle genannt): Plakat A1 hochkant 594 × 841, NOVUM-Heft 230 × 297 hochkant, Audi-Ausstellungsmotiv quer 3 : 2.
//
// Genutzte Kern-API (kern.js/falt.js der Szene „Schnittstellen“, nichts darüber hinaus):
//   K.sheet, K.word (opt clock "b", foot, imprint; das Ergebnis bekommt .off), K.print, K.decal, K.onPanel, K.panel, K.rect, K.measure,
//   F.part, F.sketch, F.geruest, F.spur; falt.js-Knotenoptionen over, lv, nocut, nofold. Die Textregel (angeschnittener Text blendet aus)
//   steckt nur in der kern.js der Schnittstellen-Kopie (clipFactor); K.word mit clock "b" gibt es auch in betreuung/, modernisierung/, abschluss/.
//   Nicht benötigt: opt.bounce und F.poly opt.ghost (nur betreuung/falt.js); der Rückprall ist mit drei Knoten am selben Scharnier nachgebaut.
// Rückgabe: { fov, fovN, track, grid, stops, keys, names, dbg, info } wie betreuung.js; zusätzlich info (Bogenausdehnung, Zeitfenster).
// Einhängen in eine gemeinsame Bahn: default (K, o): o.x, o.z verschieben die Szene im Bogen, o.b0/o.b1 bilden den Szenenfortschritt
// 0 … 1 auf einen Abschnitt des Baufortschritts ab (alle Zeitfenster, Lesestellen-b und Schlüssel-b), o.sheet = false lässt den eigenen Bogen weg,
// o.heading = false lässt die Lettern „Gestaltung“ weg.

const ink = a => `rgba(48,48,51,${a})`;
const MUTED = "#66666a";
const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2 };

// Blätter: Titel und Vermerk wörtlich aus dem Seitentext; Seitenverhältnis Breite : Höhe
const SHEETS = [
  { id: "plakat", title: "Take the Gloves Off", note: "[nach Zustimmung]", ar: 594 / 841 },
  { id: "novum", title: "NOVUM-Cover", note: null, ar: 230 / 297 },
  { id: "audi", title: "„100 Jahre Audi“", note: "Ausstellungsmotiv", ar: 3 / 2 }
];

// Platzhalter für das Bild: Passermarken in den Ecken und zarte Diagonalen (Bleistift), Titelband unten bleibt frei
function drawFrame(x, W, H, band) {
  const m = .05 * H, b = band * H / 1, x0 = m, y0 = m, x1 = W - m, y1 = H - b;
  x.strokeStyle = ink(.34); x.lineWidth = Math.max(1.2, H * .004); x.lineCap = "round";
  const tick = Math.min(W, H) * .1;
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    x.beginPath(); x.moveTo(cx + sx * tick, cy); x.lineTo(cx, cy); x.lineTo(cx, cy + sy * tick); x.stroke();
  }
  x.strokeStyle = ink(.1); x.lineWidth = Math.max(1, H * .0028);
  x.beginPath(); x.moveTo(x0 + tick * 1.3, y0 + tick * 1.3); x.lineTo(x1 - tick * 1.3, y1 - tick * 1.3); x.moveTo(x1 - tick * 1.3, y0 + tick * 1.3); x.lineTo(x0 + tick * 1.3, y1 - tick * 1.3); x.stroke();
}

export default function (K, o = {}) {
  const { F, R, V, COL, Q, PI, sm, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const BOARD = c3("#e9e3d6"), CASE = c3("#ece9e2"), FRONTC = c3("#e7e3da"), LEG = c3("#dcd7cd"), PAGE = c3("#fbfaf7");

  // ---------- Verschiebung im Bogen und Zeitabbildung (Szene 0 … 1 -> Baufortschritt b0 … b1) ----------
  const ox = o.x || 0, oz = o.z || 0, B0 = o.b0 || 0, B1 = o.b1 === undefined ? 1 : o.b1, SP = B1 - B0;
  const T = t => B0 + t * SP, D = d => d * SP;
  const rp = a => [a[0] + ox, a[1] + oz];
  const P3 = (x, y, z) => V(x + ox, y, z + oz);
  // Aufruf mit Szenenzeit (t0, d) und Faltplan-Koordinaten (ohne Verschiebung) für Teile auf dem Bogen
  const hinge = (par, a, b, n, t0, d, ang, opt) => K.panel(par, par === R ? rp(a) : a, par === R ? rp(b) : b, n, T(t0), D(d), ang, opt);
  const part = (name, t0, d) => F.part(name, T(t0), D(d));

  // ---------- Maße ----------
  const ZB = 2.0;                                       // Fußlinie des Bretts im Bogen
  const BW = 4.9, FBd = 76, FRd = 68, FB = FBd * PI / 180, FRr = FRd * PI / 180;
  const HF = N ? 1.7 : .95;                              // Höhe der Ablage-Front (am Handy höher: mehr Zeilen)
  const SH = 2.9;                                        // gemeinsame Blatthöhe (Plakat, Cover, Motiv)
  const LB = (HF / Math.sin(FB)) + .09 + SH;             // Brettlänge: Ablage-Oberkante + Luft + Blatt
  const RY = LB * Math.sin(FB), LEGL = RY / Math.sin(FRr), LEGW = .9;
  const ZR = ZB - LB;                                    // Kamm im Faltplan (Brett liegt flach nach hinten), dort hängen die Blätter
  const Z0 = ZB + (N ? .55 : .5), DL = HF / Math.tan(FB) + (Z0 - ZB) + .06;
  const XA = BW / 2 + .1;                                // halbe Breite der Ablage

  const BZ0 = ZB - LB - LEGL - 1.0, BZ1 = N ? 7.4 : 6.6;                         // Ausdehnung des eigenen Bogens (z)
  if (o.sheet !== false) K.sheet(-6.4 + ox, 6.4 + ox, BZ0 + oz, BZ1 + oz, "#faf8f3", o.sheetFrom !== undefined ? o.sheetFrom : -1);

  // ---------- Überschrift (Lettern stehen beim Scrollen aus dem Bogen auf) ----------
  part("gest-titel", 0, .01);
  let head = null;
  if (o.heading !== false) {
    const he = N ? .5 : .42, w = K.measure(["Gestaltung"], { font: "marke" }).tw * he;
    head = K.word(["Gestaltung"], he, -w / 2 + ox, (N ? 6.0 : 5.4) + oz, T(.004), D(.045), { font: "marke", clock: "b", foot: 1, imprint: IMPRINT });
    head.off = T(.31);                                   // die Lettern blenden aus, bevor die Kamera auf Leseblick geht (sie stünden sonst am unteren Bildrand angeschnitten)
  }

  // ---------- Ablage: Frontwand, Deckel, zwei Wangen ----------
  part("gest-ablage", .02, .11);
  const wall = hinge(R, [-XA, Z0], [XA, Z0], [0, 1], .21, .075, Q, { over: .04 });
  K.rect(wall, 0, 0, 2 * XA, HF, FRONTC, .5);
  const lid = K.panel(wall, wall.uv(0, HF), wall.uv(2 * XA, HF), [0, 1], T(.255), D(.075), Q, { over: .03 });
  K.rect(lid, 0, 0, 2 * XA, DL, CASE, .5);
  for (const s of [-1, 1]) {
    const ch = hinge(R, [s * XA, Z0], [s * XA, Z0 - DL], [s, 0], .235 + (s > 0 ? .012 : 0), .07, Q, { over: .03 });
    K.P(ch, [[0, 0], [DL, 0], [DL, HF], [0, HF]], CASE);
  }

  // ---------- Brett und Stütze ----------
  part("gest-brett", .05, .13);
  const board = hinge(R, [-BW / 2, ZB], [BW / 2, ZB], [0, -1], .27, .115, FB, { over: .025 });
  K.rect(board, 0, 0, BW, LB, BOARD, .5);
  // Stütze: schmaler Streifen am Kamm, klappt nach hinten zum Boden; kein Überschwingen (der Fuß würde in den Bogen stechen)
  const leg = K.panel(board, board.uv((BW - LEGW) / 2, LB), board.uv((BW + LEGW) / 2, LB), [0, -1], T(.34), D(.09), -(FB + FRr), { over: 0, lv: 1 });
  K.rect(leg, 0, 0, LEGW, LEGL, LEG, .5);

  // Kopfleiste: dunkler Streifen am Kamm des Bretts; die Blätter hängen dahinter (ihre obersten Zentimeter liegen rechnerisch bis 4 mm hinter der Brettfläche)
  const RAIL = .1;
  K.onPanel(board, K.decal(300, Math.round(300 * RAIL / BW), (x, W, H) => { x.fillStyle = ink(.5); x.fillRect(0, 0, W, H); }, BW, RAIL, -1), BW / 2, LB - RAIL / 2, 1, null, .0003);

  // ---------- Blätter: liegen hinten auf der Stütze, klappen über den Kamm nach vorn (Rückprall) ----------
  part("gest-blaetter", .1, .05);
  const NP = SHEETS.length, GAP = .035, PA = PI + FB + FRr - GAP, RB = .09;     // Winkel relativ zur Stütze; Rückprall 5°
  const FL = [{ a: .455, d: .065 }, { a: .64, d: .065 }, { a: .795, d: .065 }]; // Fenster des Anschlags je Blatt (Szenenzeit)
  const tE = N ? .13 : .1, nE = N ? .105 : .08;
  const pages = [], titles = [], notes = [];
  SHEETS.forEach((sh, k) => {
    const w = sh.ar * SH, x0 = -w / 2, lv = 2 + (NP - 1 - k);                  // Plakat oben auf dem Stapel (liegt zuerst oben, landet zuletzt hinten am Brett)
    const a = [x0, ZR], b = [x0 + w, ZR];
    const mkN = (par, ang, t0, d) => K.panel(par, rp(a), rp(b), [0, -1], T(t0), D(d), ang, { nocut: 1, nofold: 1, over: 0, lv });
    const f = FL[k];
    const A = mkN(leg, PA, f.a, f.d), Bn = mkN(A, -RB, f.a + f.d + .004, .014), C = mkN(Bn, RB, f.a + f.d + .02, .018);
    K.rect(C, 0, 0, w, SH, PAGE, .5);
    // Bildfläche: Passermarken und Diagonalen, Titelband unten; Druck auf der Unterseite (nach dem Klappen die sichtbare Seite)
    const band = .17, PXU = 220, fr = K.decal(Math.round(w * PXU), Math.round(SH * PXU), (x, W, H) => drawFrame(x, W, H, band), w, SH, -1);
    K.onPanel(C, fr, w / 2, SH / 2, -1, [0, 1], .0003);
    const t = K.print([sh.title], tE, -1, { font: "serif" });
    K.onPanel(C, t, w / 2, SH - (sh.note ? .27 : .18), -1, [0, 1], .0006);
    let nt = null;
    if (sh.note) {
      nt = K.print([sh.note], nE, -1, { col: MUTED });
      K.onPanel(C, nt, w / 2, SH - .12, -1, [0, 1], .0006);
    }
    // Umriss des Blatts als Bleistiftlinie auf dem Bogen (Blätter liegen noch hinten bereit), zeichnet sich nach den Linien der Staffelei
    const q = [rp([x0, ZR]), rp([x0 + w, ZR]), rp([x0 + w, ZR - SH]), rp([x0, ZR - SH])];
    F.sketch(C, q.map((p, i) => [p, q[(i + 1) % 4]]), T(.13 + .02 * k), D(.05), { a: .42 });
    pages.push(C); titles.push(t); notes.push(nt);
  });
  // Titel und Vermerk eines Blatts gehen, während das nächste Blatt darüberklappt (sonst scheinen sie durch das neue Blatt)
  for (let k = 0; k < NP - 1; k++) {
    const off = T(FL[k + 1].a + FL[k + 1].d * .5);
    titles[k].off = off; if (notes[k]) notes[k].off = off;
  }

  // ---------- Text an der Ablage: zwei ganze Sätze, linksbündig als Block ----------
  const eA = N ? .17 : .14, LHs = 1.3;
  const S1 = N ? ["Für mich gehört Gestaltung", "zur Entwicklung."] : ["Für mich gehört Gestaltung zur Entwicklung."];
  const S2 = N ? ["Ich entwerfe Erscheinungsbilder", "und Oberflächen selbst oder", "setze vorhandene Entwürfe", "sorgfältig um."]
    : ["Ich entwerfe Erscheinungsbilder und Oberflächen selbst", "oder setze vorhandene Entwürfe sorgfältig um."];
  const ON = T(.30);
  const t1 = K.print(S1, eA, ON, { lh: LHs }), t2 = K.print(S2, eA, ON + .004, { lh: LHs });
  const wMax = Math.max(t1.t.tw, t2.t.tw) * eA, uL = XA - wMax / 2, gap = .06 * eA / .14;
  const yTop = HF - .06, v1 = yTop - t1.h / 2, v2 = yTop - t1.h - gap - t2.h / 2;
  K.onPanel(wall, t1, uL - t1.t.padX * eA + t1.w / 2, v1, -1);
  K.onPanel(wall, t2, uL - t2.t.padX * eA + t2.w / 2, v2, -1);

  // ---------- Konstruktionsphase wie in der Eröffnung: Raster auf dem Bogen, Gerüst der festen Teile, Bleistiftspur ----------
  F.geruest({ tags: ["gest-ablage", "gest-brett"], t0: T(.075), t1: T(.25), du: D(.03), a: .5 });
  F.spur({ tags: ["gest-ablage", "gest-brett"], quiet: [wall], a: .3 });

  // ---------- Lesestellen ----------
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const stopOf = (prints, b, v) => ({ prints, px: pxD, b: T(b), ...v });
  const S = {
    // Plakat: Ablage-Text und Titel des ersten Blatts; Kamera blickt rechtwinklig auf das Brett (14° geneigt)
    g1: stopOf([t1, t2, titles[0], notes[0]], .585, { pitch: 14, yaw: -8, sy: -.34, sx: 0, npitch: 14, nyaw: 0, nsy: -.2, nsx: 0 }),
    g2: stopOf([t1, t2, titles[1]], .765, { pitch: 14, yaw: 0, sy: -.34, sx: 0, npitch: 14, nyaw: 0, nsy: -.2, nsx: 0 }),
    g3: stopOf([t1, t2, titles[2], notes[2]], .92, { pitch: 14, yaw: 8, sy: -.34, sx: 0, npitch: 14, nyaw: 0, nsy: -.2, nsx: 0 })
  };
  const look = (tx, ty, tz, el, az, dist) => { const e = el * PI / 180, a = az * PI / 180; return P3(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a)); };
  const tg = (x, y, z) => P3(x, y, z);
  return {
    fov: 32, fovN: 44, track: 640,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: T(.004), wave: .0025 * SP, d: .04 * SP, out: T(.4) },
    names: S, stops: Object.values(S),
    info: { x0: -6.4 + ox, x1: 6.4 + ox, z0: BZ0 + oz, z1: BZ1 + oz, b0: B0, b1: B1, heights: { ridge: RY, ablage: HF }, bounds: { pages: SHEETS.map(s => s.ar * SH), SH } },
    dbg: { head, wall, lid, board, leg, pages, titles, notes, t1, t2, LB, LEGL, ZR, ZB, PA, RY, HF },
    keys: [
      // Start: Überblick von schräg oben, alle Bastellinien entstehen (Handy näher: die Staffelei füllt die Breite)
      { w: 0, b: T(0), cam: look(0, .3, .6, 40, 0, 21), tgt: tg(0, .3, .6), camN: look(0, .3, .4, 40, 0, 23), tgtN: tg(0, .3, .4) },
      // Linien, Gerüst und Raster stehen: etwas näher an der Staffelei
      { w: .9, b: T(.23), cam: look(0, 1.0, 1.4, 34, 0, 18), tgt: tg(0, 1.0, 1.4), camN: look(0, 1.0, 1.0, 34, 0, 22), tgtN: tg(0, 1.0, 1.0) },
      // Staffelei steht, die Blätter liegen hinten bereit: Blickhöhe sinkt auf 22°
      { w: 1, b: T(.43), cam: look(0, 1.8, .8, 22, -6, 17), tgt: tg(0, 1.8, .8), camN: look(0, 2.0, .6, 22, -4, 21), tgtN: tg(0, 2.0, .6) },
      { w: 1, stop: S.g1 },
      { w: 1, stop: S.g2 },
      { w: 1, stop: S.g3 },
      // Ende: Überblick über die Staffelei mit dem letzten Blatt
      { w: .9, b: T(1), cam: look(0, 1.9, .6, 20, 4, 16), tgt: tg(0, 1.9, .6), camN: look(0, 2.2, .5, 20, 3, 21), tgtN: tg(0, 2.2, .5) }
    ]
  };
}
