// Szene „Gestaltung“ (Fassung 2026-11, Bogen + Bastellinien): eine hohe Atelier-Staffelei klappt aus dem Bogen, darauf liegt zuerst ein
// schlichtes Deckblatt mit den zwei Sätzen, darüber landen nacheinander drei Blätter in den Formaten der Arbeiten (mit dem echten Bild,
// Unterschrift im Titelband). Text wörtlich aus Raumtext 2 (#leistungen, Gestaltung):
//   „Für mich gehört Gestaltung zur Entwicklung. Ich entwerfe Erscheinungsbilder und Oberflächen selbst oder setze vorhandene Entwürfe
//   sorgfältig um.“ steht auf dem Deckblatt (Lesetext, Grotesk wie der Kernsatz der Eröffnung). Die Belege stehen als Unterschriften.
//
// Aufbau (alles aus dem Bogen geklappt, Faltplan flach in x/z):
// - Brett: Rahmen der Staffelei in einem Teil: zwei hohe Holme (reichen über die Klemmleiste hinaus), Fußquerholm, Mittelstück am Fuß,
//   Querleiste unter dem Blatt und Klemmleiste am Blattkopf; lehnt 76° (14° nach hinten). Die Malerleiste (schmale Ablage, auf der die
//   Blätter stehen) klappt aus der Querleiste nach vorn, waagerecht.
// - Stütze: schmaler Streifen an der Klemmleiste, klappt nach hinten zum Boden (68°, ohne Überschwingen). Die Holme sind die vorderen Beine.
// - Blätter: liegen zuerst hinten auf der Stütze (flach auf dem Bogen, Haarkante erst beim Bewegen) und klappen nacheinander über die
//   Klemmleiste nach vorn auf die Staffelei, jedes mit Rückprall: Anschlag, kurz zurück, einrasten (drei Knoten am selben Scharnier A/B/C).
//   Reihenfolge Deckblatt → Plakat → NOVUM-Cover → „100 Jahre Audi“; gleiche Höhe, Breite nach Format, damit jedes spätere Blatt das
//   frühere ganz bedeckt (Deckblatt etwas schmaler als das Plakat).
// Formate: nach den Bilddateien (siehe SHEETS).
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
const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2 };

// Blätter: Seitenverhältnis Breite : Höhe des ganzen Blatts (ohne Klemmstreifen).
// Das Bild füllt Breite und Kopf des Blatts randlos, unten bleibt das Titelband (BAND der Blatthöhe); ar = Bildverhältnis × (1 − BAND),
// das Bild wird also nicht gestaucht. Bildverhältnisse: NOVUM (zugeschnitten, ohne weißen Rand rechts) 1240 : 1789, Plakat = Titelblatt des
// Styleguides (960 : 1358), seitlich je 1 % auf das NOVUM-Verhältnis beschnitten (schwarzer Grund), damit das Plakat nicht breiter als das
// NOVUM-Cover wird; Audi 4967 : 3508. Deckblatt: 98,5 % der Plakatbreite (liegt ganz unter dem Plakat).
// Unterschriften wörtlich; „·“ am Zeilenende, wo die Unterschrift auf dem schmalen Blatt umbrechen muss.
const BAND = .17, IAR_NOVUM = 1240 / 1789;
const SHEETS = [
  { id: "deck", iar: IAR_NOVUM * .985 },
  { id: "plakat", cap: ["Take the Gloves Off", "Logo und Styleguide, ehrenamtlich"], iar: IAR_NOVUM },
  { id: "novum", cap: ["NOVUM · Cover"], iar: IAR_NOVUM },
  { id: "audi", cap: ["100 Jahre Audi · Ausstellungsmotiv"], iar: 4967 / 3508 }
].map(s => ({ ...s, ar: s.iar * (1 - BAND) }));

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

// Bildfläche: das Bild randlos über Breite und Kopf (unter dem Klemmstreifen top), Titelband unten bleibt frei; ohne Bild Platzhalter
// (Passermarken und zarte Diagonalen)
function drawFrame(x, W, H, top, band, im) {
  const ty = top * H, bh = band * H;
  if (im) { x.drawImage(im, 0, ty, W, H - ty - bh); return; }
  const m = .05 * (H - ty), x0 = m, y0 = ty + m, x1 = W - m, y1 = H - bh;
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
  const BOARD = c3("#e9e3d6"), LEG = c3("#dcd7cd"), PAGE = c3("#fbfaf7"), CLAMP = c3("#bfb8a8"), LIP = c3("#d9d2c3"), WINC = c3("#e4e0d5"), TREEC = c3("#e2e5d8"), TRUNK = c3("#d8d1c2");

  // ---------- Verschiebung im Bogen und Zeitabbildung (Szene 0 … 1 -> Baufortschritt b0 … b1) ----------
  const ox = o.x || 0, oz = o.z || 0, B0 = o.b0 || 0, B1 = o.b1 === undefined ? 1 : o.b1, SP = B1 - B0;
  const T = t => B0 + t * SP, D = d => d * SP;
  const rp = a => [a[0] + ox, a[1] + oz];
  const P3 = (x, y, z) => V(x + ox, y, z + oz);
  // Aufruf mit Szenenzeit (t0, d) und Faltplan-Koordinaten (ohne Verschiebung) für Teile auf dem Bogen
  const hinge = (par, a, b, n, t0, d, ang, opt) => K.panel(par, par === R ? rp(a) : a, par === R ? rp(b) : b, n, T(t0), D(d), ang, opt);
  const part = (name, t0, d) => F.part(name, T(t0), D(d));

  // ---------- Maße der Staffelei (Mittelmast-Staffelei: schlanker Mast, zwei kurze Vorderfüße, Hinterbein = Stütze, Malerleiste, Klemme) ----------
  const ZB = 2.0;                                       // Fußlinie der Staffelei im Bogen
  const MW = .11, BW = 2.4;                              // Mastbreite (Holz dünn), Breite des Faltteils
  const FBd = 76, FRd = 68, FB = FBd * PI / 180, FRr = FRd * PI / 180;
  const SH = 2.9;                                        // sichtbare Blatthöhe (Deckblatt, Plakat, Cover, Motiv)
  const RAIL = .12, PH = SH + RAIL;                      // Klemmstreifen am Blattkopf (unter der Klemme), Papierhöhe
  const L0 = 2.05 + .033;                                // Oberkante der Querleiste und Scharnier der Malerleiste (entlang des Mastes gemessen); Blattunterkante steht darauf
  const VB = L0 - .033;                                  // Blattunterkante im Faltplan
  const VH = VB + PH, LB = VH;                           // Scharnierlinie der Blätter/Stütze = Mastspitze (Mast rund 1,7 Blatthöhen hoch)
  const RY = VH * Math.sin(FB), LEGL = RY / Math.sin(FRr), LEGW = .4;
  const ZR = ZB - VH;                                    // Klemme im Faltplan (Mast liegt flach nach hinten), dort hängen die Blätter
  const LIPD = .3, LIPW = 1.0;                           // Tiefe und halbe Breite der Malerleiste (die Blätter ragen seitlich darüber hinaus)
  const uu = x => BW / 2 + x;

  // ---------- Maße Wandstück mit Fenster und Baum (rechts hinter der Staffelei, frei vom Faltplan der Staffelei) ----------
  const XW = N ? 3.5 : 4.4, ZW = -1.5, WWd = 4.8, WHt = 5.8, PIER = .4, SILL = 1.0, LINT = 5.0, WCR = 3.1;   // Wand: Mitte x, Bodenlinie z, Breite, Höhe, Pfeiler, Brüstung, Sturz, Höhe Quersprosse
  const TS = .58, XT = XW - .65, ZT = ZW - 2.6, TW = TS, TRH = 2.1 * TS, CRH = 4.5 * TS, CWH = 1.5 * TS, WG = 1.0;   // Baum (verkleinert, steht draußen): Mitte, Fußlinie, Breite, Stamm, Kronenspitze, Kronenflanke, Flügelwinkel (rad)

  const BZ0 = Math.min(ZR - LEGL, ZW - WHt, ZT - CRH) - 1.0, BZ1 = N ? 7.4 : 6.6;     // Ausdehnung des eigenen Bogens (z)
  if (o.sheet !== false) K.sheet(-6.4 + ox, 7.4 + ox, BZ0 + oz, BZ1 + oz, "#faf8f3", o.sheetFrom !== undefined ? o.sheetFrom : -1);

  // ---------- Überschrift (Lettern stehen beim Scrollen aus dem Bogen auf) ----------
  part("gest-titel", 0, .01);
  let head = null;
  if (o.heading !== false) {
    const he = N ? .5 : .42, w = K.measure(["Gestaltung"], { font: "marke" }).tw * he;
    head = K.word(["Gestaltung"], he, -w / 2 + ox, (N ? 6.0 : 5.4) + oz, T(.004), D(.045), { font: "marke", clock: "b", foot: 1, imprint: IMPRINT });
    head.off = T(.31);                                   // die Lettern blenden aus, bevor die Kamera auf Leseblick geht (sie stünden sonst am unteren Bildrand angeschnitten)
  }

  // ---------- Wandstück aus Papier: Brüstung, Pfeiler, Sturz und Fensterkreuz; steht auf dem Boden, Fußlaschen liegen hinten flach ----------
  part("gest-fenster", .03, .1);
  const wt0 = .06, wd = .08, FLAT = { nocut: 1, nofold: 1 };
  const win = hinge(R, [XW - WWd / 2, ZW], [XW + WWd / 2, ZW], [0, -1], wt0, wd, Q, { over: .02, lv: 4 });
  K.rect(win, 0, 0, WWd, SILL, WINC, .5);                                              // Brüstung
  K.rect(win, 0, LINT, WWd, WHt, WINC, .5);                                            // Sturz
  K.rect(win, 0, SILL, PIER, LINT, WINC, .5); K.rect(win, WWd - PIER, SILL, WWd, LINT, WINC, .5);   // Pfeiler
  K.rect(win, WWd / 2 - .06, SILL, WWd / 2 + .06, LINT, WINC, .5);                     // senkrechte Sprosse
  K.rect(win, PIER, WCR - .06, WWd / 2 - .06, WCR + .06, WINC, .5); K.rect(win, WWd / 2 + .06, WCR - .06, WWd - PIER, WCR + .06, WINC, .5);   // Quersprosse
  // Fußlaschen: hängen an der Bodenlinie der Wand, falten sich gleichzeitig und gleich weit zurück: sie bleiben beim Aufstehen flach auf dem Bogen liegen
  for (const [u0, u1] of [[.15, 1.05], [WWd - 1.05, WWd - .15]]) {
    const ft = K.panel(win, win.uv(u0, 0), win.uv(u1, 0), [0, -1], T(wt0), D(wd), -Q, { over: .02, lv: 4, ...FLAT });
    K.rect(ft, 0, 0, u1 - u0, .8, WINC, .5);
  }

  // ---------- Baum aus gefaltetem Papier draußen hinter der Wand: Stammblatt mit Krone, zwei Flügel an den senkrechten Kanten der Krone ----------
  part("gest-baum", .1, .1);
  const tt0 = .12, td = .07;
  const tree = hinge(R, [XT - TW / 2, ZT], [XT + TW / 2, ZT], [0, -1], tt0, td, Q, { over: .02, lv: 2 });
  K.rect(tree, TW / 2 - .14 * TS, 0, TW / 2 + .14 * TS, TRH, TRUNK, .5);
  K.P(tree, [[0, TRH], [TW, TRH], [TW, TRH + CWH], [TW / 2, CRH], [0, TRH + CWH]], TREEC, .5);
  for (const sd of [-1, 1]) {
    const uh = sd < 0 ? 0 : TW;
    const wg = K.panel(tree, tree.uv(uh, TRH), tree.uv(uh, TRH + CWH), [sd, 0], T(.19), D(.06), WG, { over: 0, lv: 2, ...FLAT });
    K.P(wg, [[0, 0], [CWH, 0], [CWH * .8, .55 * TS], [CWH * .5, .85 * TS], [CWH * .15, .55 * TS]], TREEC, .5);
  }
  for (const sd of [-1, 1]) {                                                          // Fußlasche hinten, bleibt flach (wie bei der Wand)
    const ft = K.panel(tree, tree.uv(TW / 2 + sd * .22 * TS, 0), tree.uv(TW / 2 + sd * .22 * TS + sd * .5 * TS, 0), [0, -1], T(tt0), D(td), -Q, { over: .02, lv: 2, ...FLAT });
    K.rect(ft, 0, 0, .5 * TS, .6 * TS, TRUNK, .5);
  }

  // ---------- Staffelei: Mast, Vorderfüße, Malerleiste, Klemme; lehnt 76° (14° nach hinten) ----------
  part("gest-brett", .13, .13);
  const board = hinge(R, [-BW / 2, ZB], [BW / 2, ZB], [0, -1], .17, .1, FB, { over: .025 });
  K.P(board, [[uu(-MW / 2), .55], [uu(MW / 2), .55], [uu(MW / 2), VH], [uu(-MW / 2), VH]], BOARD, .5, -.008);   // Mast (hinter den Blättern)
  for (const sd of [-1, 1]) {                                                            // zwei kurze, schmal gespreizte Vorderfüße
    K.P(board, [[uu(sd * .02 - MW / 2), .62], [uu(sd * .02 + MW / 2), .62], [uu(sd * .78 + MW / 2), 0], [uu(sd * .78 - MW / 2), 0]], BOARD, .5, -.008);
  }
  // Querleiste und Klemme sind eigene feste Teile am Mast (ohne Abdruck im Bogen, sonst läge ihr Abdruck als lose Leiste am Boden)
  const fix = (x0, x1, v0, v1, col, dy) => { const f = K.panel(board, board.uv(uu(x0), v0), board.uv(uu(x1), v0), [0, -1], T(.17), D(.1), 0, { over: 0, nocut: 1, nofold: 1 }); K.rect(f, 0, 0, uu(x1) - uu(x0), v1 - v0, col, .5, dy); };
  fix(-LIPW, LIPW, L0 - .1, L0, BOARD, 0);                                                // Querleiste unter dem Blatt (schmal)
  fix(-.26, .26, VH - RAIL - .04, VH, CLAMP, .003);                                       // Klemme oben auf dem Mast (deckt den Klemmstreifen)
  // Malerleiste: schmale Ablage, klappt aus der Querleiste waagerecht nach vorn
  const lip = K.panel(board, board.uv(uu(-LIPW), L0), board.uv(uu(LIPW), L0), [0, 1], T(.245), D(.05), FB, { over: 0, ...FLAT });
  K.rect(lip, 0, 0, 2 * LIPW, LIPD, LIP, .5);
  // Stütze (Hinterbein): schmaler Streifen an der Mastspitze, klappt nach hinten zum Boden; kein Überschwingen (der Fuß würde in den Bogen stechen)
  const leg = K.panel(board, board.uv((BW - LEGW) / 2, VH), board.uv((BW + LEGW) / 2, VH), [0, -1], T(.22), D(.08), -(FB + FRr), { over: 0, lv: 1 });
  K.rect(leg, 0, 0, LEGW, LEGL, LEG, .5);

  // ---------- Blätter: liegen hinten auf der Stütze, klappen über die Klemmleiste nach vorn (Rückprall) ----------
  part("gest-blaetter", .1, .05);
  const NP = SHEETS.length, GAP = .035, PA = PI + FB + FRr - GAP, RB = .09;     // Winkel relativ zur Stütze; Rückprall 5°
  const FL = [{ a: .34, d: .06 }, { a: .54, d: .06 }, { a: .68, d: .06 }, { a: .82, d: .06 }];   // Fenster des Anschlags je Blatt (Szenenzeit)
  const STOPB = [.50, .66, .80, .94];                    // Lesestellen (Szenenfortschritt)
  const bandH = BAND * SH;
  // Unterschrift: Grotesk dunkel, zweizeilig wo nötig, einheitliche Größe (nach der schmalsten Zeile des Plakats)
  const capOpt = { lh: 1.25, align: "center", track: .012 };
  const eCap = Math.min(.092, ...SHEETS.filter(s => s.cap).map(s => (s.ar * SH - .2) / K.measure(s.cap, capOpt).tw));
  // Deckblatt: zwei Sätze wörtlich, Lesetext in Grotesk wie der Kernsatz der Eröffnung (zentriert, Zeilenhöhe 1,22)
  const S1 = ["Für mich gehört Gestaltung", "zur Entwicklung."];
  const S2 = ["Ich entwerfe", "Erscheinungsbilder und", "Oberflächen selbst oder", "setze vorhandene Entwürfe", "sorgfältig um."];
  const dOpt = { lh: 1.22, align: "center", track: .005 };
  const wDeck = SHEETS[0].ar * SH;
  const eD = Math.min(.1, (wDeck - .3) / Math.max(K.measure(S1, dOpt).tw, K.measure(S2, dOpt).tw));
  const pages = [], sheetPrints = [], deckTxt = [], deck = {};
  SHEETS.forEach((sh, k) => {
    const w = sh.ar * SH, x0 = -w / 2, lv = 2 + (NP - 1 - k);                  // Deckblatt oben auf dem Stapel (liegt zuerst oben, landet zuerst hinten an der Staffelei)
    const a = [x0, ZR], b = [x0 + w, ZR];
    const mkN = (par, ang, t0, d) => K.panel(par, rp(a), rp(b), [0, -1], T(t0), D(d), ang, { nocut: 1, nofold: 1, over: 0, lv });
    const f = FL[k];
    const A = mkN(leg, PA, f.a, f.d), Bn = mkN(A, -RB, f.a + f.d + .004, .014), C = mkN(Bn, RB, f.a + f.d + .02, .018);
    K.rect(C, 0, 0, w, PH, PAGE, .5);
    const prs = [];
    if (sh.id === "deck") {
      // Lesetext: zwei Absätze, in der oberen Blatthälfte
      const t1 = K.print(S1, eD, -1, dOpt), t2 = K.print(S2, eD, -1, dOpt);
      const gap = .5 * 1.22 * eD, tTop = RAIL + .13;
      K.onPanel(C, t1, w / 2, tTop + t1.h / 2, -1, [0, 1], .0006);
      K.onPanel(C, t2, w / 2, tTop + t1.h + gap + t2.h / 2, -1, [0, 1], .0006);
      deckTxt.push(t1, t2); prs.push(t1, t2);
      // Bleistiftskizze des Baums darunter (Vorderansicht, Strich für Strich): Maßstab nach dem freien Platz
      const vS0 = tTop + t1.h + gap + t2.h + .14, vG = PH - .17, sc = Math.min(.5, (vG - vS0) / CRH);
      const X = tx => w / 2 + tx * sc, Y = ty => vG - ty * sc, wcos = Math.cos(WG), hw = TW / 2;
      const poly = [];
      const L = (tx0, ty0, tx1, ty1) => poly.push([tx0, ty0, tx1, ty1]);
      L(-.42 * TS, 0, .42 * TS, 0);                                                                    // Boden
      L(-.14 * TS, 0, -.14 * TS, TRH); L(.14 * TS, 0, .14 * TS, TRH);                                            // Stamm
      L(-hw, TRH, hw, TRH);                                                                  // Krone: Unterkante
      L(hw, TRH, hw, TRH + CWH); L(hw, TRH + CWH, 0, CRH); L(0, CRH, -hw, TRH + CWH); L(-hw, TRH + CWH, -hw, TRH);
      for (const sd of [-1, 1]) {                                                            // Flügel (nach hinten gefaltet: Breite mal cos)
        const px = (u, v) => sd * (hw + v * wcos), py = (u, v) => TRH + u;
        const pts = [[CWH, 0], [CWH * .8, .55 * TS], [CWH * .5, .85 * TS], [CWH * .15, .55 * TS], [0, 0]];
        for (let i = 0; i < pts.length - 1; i++) L(px(...pts[i]), py(...pts[i]), px(...pts[i + 1]), py(...pts[i + 1]));
      }
      const segs = poly.map(([a0, b0, a1, b1]) => [rp([x0 + X(a0), ZR - Y(b0)]), rp([x0 + X(a1), ZR - Y(b1)])]);
      deck.sketch = { C, segs };
    } else {
      // Bildfläche: Passermarken und Diagonalen, Titelband unten; Druck auf der Unterseite (nach dem Klappen die sichtbare Seite)
      const top = RAIL / PH, band = bandH / PH, PXU = 400;
      const onB = T(f.a - .004), fr = K.decal(Math.round(w * PXU), Math.round(PH * PXU), (x, W, H) => drawFrame(x, W, H, top, band, BMP[sh.id]), w, PH, onB);
      K.onPanel(C, fr, w / 2, PH / 2, -1, [0, 1], .0003);
      const t = K.print(sh.cap, eCap, onB, capOpt);
      K.onPanel(C, t, w / 2, PH - bandH / 2, -1, [0, 1], .0006);
      prs.push(t);
    }
    // Umriss des Blatts als Bleistiftlinie auf dem Bogen (Blätter liegen noch hinten bereit), zeichnet sich nach den Linien der Staffelei
    const q = [rp([x0, ZR]), rp([x0 + w, ZR]), rp([x0 + w, ZR - PH]), rp([x0, ZR - PH])];
    F.sketch(C, q.map((p, i) => [p, q[(i + 1) % 4]]), T(.2 + .02 * k), D(.05), { a: .42 });
    pages.push(C); sheetPrints.push(prs);
  });
  // Drucke eines Blatts gehen, während das nächste Blatt darüberklappt (sonst scheinen sie durch das neue Blatt)
  const OFF = k => T(FL[k + 1].a + FL[k + 1].d * .5);
  for (let k = 0; k < NP - 1; k++) for (const pr of sheetPrints[k]) pr.off = OFF(k);
  // Skizze des Baums auf dem Deckblatt: unter der Papierebene (sichtbare Seite nach dem Klappen), zeichnet sich nach dem Aufsetzen
  F.sketch(deck.sketch.C, deck.sketch.segs, T(.445), D(.065), { a: .6, dy: -.0009, fade: b => 1 - sm((b - OFF(0)) / .03) });

  // ---------- Konstruktionsphase wie in der Eröffnung: Raster auf dem Bogen, Gerüst der festen Teile, Bleistiftspur ----------
  F.geruest({ tags: ["gest-fenster", "gest-baum", "gest-brett"], t0: T(.04), t1: T(.2), du: D(.03), a: .5 });
  F.spur({ tags: ["gest-fenster", "gest-baum", "gest-brett"], quiet: [], a: .3 });

  // ---------- Lesestellen ----------
  const pxD = (W, H) => Math.min(19, Math.max(16, 16 + (H - 700) / 500 * 3));
  const stopOf = (prints, b, v) => ({ prints, px: pxD, b: T(b), ...v });
  const S = {
    g0: stopOf(deckTxt, STOPB[0], { px: 13.6, pxN: 13, pitch: 14, yaw: -6, sy: .45, sx: -.3, npitch: 14, nyaw: -4, nsy: .42, nsx: -.4 }),
    g1: stopOf(sheetPrints[1], STOPB[1], { px: 14.8, pxN: 13.5, pitch: 14, yaw: 8, sy: -.08, sx: -.1, npitch: 14, nyaw: 6, nsy: -.25, nsx: 0 }),
    g2: stopOf(sheetPrints[2], STOPB[2], { px: 14.8, pxN: 13.5, pitch: 14, yaw: -8, sy: -.08, sx: -.1, npitch: 14, nyaw: -6, nsy: -.25, nsx: 0 }),
    g3: stopOf(sheetPrints[3], STOPB[3], { px: 14.8, pxN: 13.5, pitch: 14, yaw: 8, sy: -.08, sx: -.1, npitch: 14, nyaw: 6, nsy: -.25, nsx: 0 })
  };
  const look = (tx, ty, tz, el, az, dist) => { const e = el * PI / 180, a = az * PI / 180; return P3(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a)); };
  const tg = (x, y, z) => P3(x, y, z);
  return {
    fov: 32, fovN: 44, track: 640,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: T(.004), wave: .0025 * SP, d: .04 * SP, out: T(.4) },
    names: S, stops: Object.values(S),
    info: { x0: -6.4 + ox, x1: 6.4 + ox, z0: BZ0 + oz, z1: BZ1 + oz, b0: B0, b1: B1, heights: { ridge: RY, easel: LB * Math.sin(FB) }, bounds: { pages: SHEETS.map(s => s.ar * SH), SH } },
    dbg: { head, board, leg, lip, win, tree, XW, XT, ZW, ZT, pages, sheetPrints, deckTxt, LB, LEGL, ZR, ZB, PA, RY, VH },
    keys: [
      { w: 0, b: T(0), cam: look(1.5, .3, -1, 40, 0, 24), tgt: tg(1.5, .3, -1), camN: look(1.2, .3, -1, 40, 0, 26), tgtN: tg(1.2, .3, -1) },
      { w: .9, b: T(.2), cam: look(1.6, 1.5, -.5, 30, 0, 20), tgt: tg(1.6, 1.5, -.5), camN: look(1.4, 1.8, -.5, 30, 0, 24), tgtN: tg(1.4, 1.8, -.5) },
      { w: 1, b: T(.34), cam: look(1.4, 2.6, -.5, 22, -6, 18), tgt: tg(1.4, 2.6, -.5), camN: look(1.2, 2.8, -.5, 22, -4, 22), tgtN: tg(1.2, 2.8, -.5) },
      { w: 1, stop: S.g0 },
      { w: 1, stop: S.g1 },
      { w: 1, stop: S.g2 },
      { w: 1, stop: S.g3 },
      { w: .9, b: T(1), cam: look(0, 2.6, .6, 20, 4, 17), tgt: tg(0, 2.6, .6), camN: look(0, 2.8, .5, 20, 3, 22), tgtN: tg(0, 2.8, .5) }
    ]
  };
}
