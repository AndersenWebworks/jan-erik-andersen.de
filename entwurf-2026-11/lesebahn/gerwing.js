// Gerwing – Pflaster nach Fläche bestellen. Lesebahn (Drehbuch: DREHBUCH-LESEBAHN.md, Abschnitt 5), Stil Bogen + Bastellinien (Faltkern falt.js, Gerüst kern.js).
// Die Sätze stehen ganz auf Lieferschein-Bons am roten Faden (Trägerform bon.js, Baukasten bahn.js): ein Bon je Satz, dem Leser zugewandt, alle gleich ausgerichtet;
// jeder Bon läuft aus einem kleinen Papiermaul im Bogen heraus. Die Kamera fährt stetig nach rechts (Gier 0, gleiche Neigung und gleicher Abstand, kein Zoom) und fasst
// an jedem Bon den Satz. Die Konstrukte stehen als Szenerie dahinter und zeigen beim jeweiligen Satz genau das Gesagte, von links nach rechts:
//   Kopf          Wand mit Typenschild (Kennzeile); die Überschrift steht als Lettern auf der Bahn
//   G1 Shop       Terrasse mit Platten und Treppe (Terrassenplatten und Stufen)
//   G2 Fläche     umrissene Fläche → ganze Steine im Läuferverband, Reihe für Reihe; die letzte Reihe ragt über die Kontur
//   G3 Gewicht    Steinstapel auf Palette mit Lattung
//   G4 Händler    Weiche mit Haarlinien zu drei Händlern, die Fracht-Linie führt zum zuständigen
//   G5 Betreuung  Laptop mit dem echten Shop, Statuspunkt
// Alles liegt in Ruhe flach im Bogen, zeichnet erst seine Schnitt- und Falzlinien und klappt dann mit der Vorspann-Mechanik hoch; jedes Konstrukt ist fertig,
// bevor der zugehörige Bon seinen Satz zeigt (Zeitfenster siehe seg(...) unten).
import { keyboard } from "./zeichnungen.js";
import { bon } from "./bon.js";

// Shopbilder (ImageBitmap), vor dem Aufbau in main.js aus bilder/bilder.js dekodiert
let BMP = {};
export function setBilder(b) { BMP = b || {}; }

const ink = a => `rgba(48,48,51,${a})`;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Text (Drehbuch Abschnitt 5; Titel und Kennzeile wörtlich aus dem Seitentext) ----------
const META = "Gerwing · WooCommerce · seit 2023";
const SATZ = [
  "Für Gerwing habe ich 2023 einen WooCommerce-Shop gebaut, der Pflastersteine, Terrassenplatten und Stufen nach Fläche verkauft.",
  "Kunden geben ihre Quadratmeter ein, der Shop rechnet sie in ganze Steine um.",
  "Er ermittelt Gewicht und Fracht nach Postleitzahl.",
  "Dann leitet er die Bestellung an den zuständigen Händler weiter.",
  "Seitdem betreue ich den Shop und entwickle ihn laufend weiter."
];
const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2 };

export default function (K) {
  const { F, R, V, COL, Q, PI, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const WALLC = c3("#f3efe6"), STONE = COL.STONE, STONE2 = COL.STONE2, OLD = COL.OLD;
  const TERR = c3("#e6dfd1"), TERRTOP = c3("#efeae0"), PALC = c3("#e9e2d3"), HALLC = c3("#eeece7"), ROOFC = c3("#dcd8cf");
  const LAPC = c3("#e4e1db"), SCRC = c3("#3a3a3e"), RED = COL.RED;
  const MUTED = "#66666a";

  // Zeitfenster: altes Fenster [a0, a1] (Zeiten der Bauteile unten) auf das neue [b0, b1] abbilden, Dauern mitskalieren.
  // Lesestellen (b): Kopf 0, dann S; jedes Konstrukt steht fertig, kurz bevor sein Bon den Satz zeigt (Text bei S − .03).
  const S = [.19, .38, .56, .74, .91];
  const seg = (a0, a1, b0, b1) => { const k = (b1 - b0) / (a1 - a0); return { t: x => b0 + (x - a0) * k, d: d => d * k }; };
  const sT = seg(.37, .62, .02, .15), sF = seg(.105, .41, .205, .35), sP = seg(.54, .69, .39, .52), sH = seg(.66, .85, .575, .70), sL = seg(.82, .96, .745, .875);

  // ---------- Bahn: Kopf (Lettern) + fünf Bons ----------
  const PITCH = K.PITCH, LEAN = PITCH * PI / 180, ZB = 3.0, eH = N ? .5 : .62;
  const headLines = N ? ["Pflaster", "nach Fläche", "bestellen"] : ["Pflaster nach Fläche", "bestellen"];
  const titleW = K.measure([N ? "nach Fläche" : "Pflaster nach Fläche"], { font: "serif" }).tw * eH, XL1 = 0, hx = XL1 - .7 - titleW;
  const H1 = K.word(headLines, eH, hx, ZB, .15, .85, { font: "serif", foot: 1, imprint: { ...IMPRINT, close: .25, closeDur: .7 }, ang: Q - LEAN });
  const B = K.bahn({
    prefix: "g", form: bon, x0: XL1, z: ZB, gap: 1.3, pitch: PITCH, sy: -.34, nsy: -.3,
    head: { prints: [H1], e0: eH, b: 0, fit: .72, fitN: .72, x: hx, w: titleW },
    // Zeiten: Schnittlinien, Bon steht (+ .045), Bon läuft aus dem Maul (+ .05 … + .10), Satz bei Lesestelle − .03
    sentences: SATZ.map((text, i) => ({ text, t: [S[i] - .165, S[i] - .135, S[i] - .03], b: S[i] }))
  });
  const mid = k => B.items[k].x0 + B.items[k].w / 2;                 // Mitte des Bons k (Szenerie steht über dem zugehörigen Bon)
  const cW = hx + titleW / 2, cT = mid(0), cF = mid(1), cP = mid(2), cH = mid(3), cL = mid(4);

  // ---------- Lage (Bogen x nach rechts, z zum Betrachter) ----------
  // Wand mit Typenschild
  const WW = N ? 3.9 : 4.4, WX0 = cW - WW / 2, ZW = -5.0, HW = N ? 1.7 : 1.4;
  // Pflasterfläche: Steine 0,6 × 0,3 (Verhältnis 25 × 15 cm wie im Shop), Kontur eine halbe Reihe kürzer als die ganzen Steine:
  // die letzte Reihe ragt halb über die Kontur. Desktop 9 Steine × 10 Reihen, Handy schmaler und tiefer (6 × 14)
  const CW = .6, RH = .3, NC = N ? 6 : 9, NR = N ? 14 : 10, PX0 = cF - NC * CW / 2, PX1 = PX0 + NC * CW, PZB = -4.4, PZF = PZB + (NR - .5) * RH, SH = .12, G = .012;
  // Terrasse mit Treppe
  const TX0 = cT - 2.6, TX1 = cT + 2.6, TZB = -4.9, TZF = -2.0, TH = .9, SX0 = TX0 + 2.5, SX1 = SX0 + 1.6, NS = 4, RS = TH / NS, TS = .36;
  // Palette mit Steinstapel
  const AX0 = cP - 1.2, AX1 = cP + 1.2, AZ0 = -2.2, AZ1 = -3.6, AH = 1.5, AP = .3;
  // Lagerhallen [x0, z0 (Front), Breite, Tiefe, Höhe]; zuständig ist HL[1] (vorn, Mitte über Bon 4)
  const HL = [[cH - 1.0, -4.8, 2.0, 1.1, .72], [cH - 1.3, -1.6, 2.6, 1.4, .95], [cH + 2.6, -2.2, 2.0, 1.1, .72]];
  // Laptop
  const LW = N ? 2.85 : 3.2, LX0 = cL - LW / 2, LZF = -.1, LD = 2.05, LTH = .1, SHT = 2.0;

  // ---------- Bogen ----------
  K.sheet(hx - 8, B.endX + 10, -11.5, ZB + 10.4);   // Bogen reicht weit nach hinten: Oberkante der Szenerie im oberen Fünftel

  // ---------- 0 Wand mit Typenschild (steht mit dem Kopf, nach der Zeit seit dem Eintreffen) ----------
  F.part("wand", 0, .03);
  const wall = K.panel(R, [WX0, ZW], [WX0 + WW, ZW], [0, -1], .35, .75, Q, { clock: "t", nocut: 1, nofold: 1, over: .04 });
  K.rect(wall, 0, 0, WW, HW, WALLC);
  const mt = K.print(N ? ["Gerwing · WooCommerce", "seit 2023"] : [META], .2, -1, { track: .03, col: MUTED, lh: 1.3 });
  K.onPanel(wall, mt, WW / 2, HW / 2, 1);

  // ---------- G1 Terrasse mit Platten und Treppe (Terrassenplatten und Stufen) ----------
  F.part("terrasse", sT.t(.37), sT.d(.06));
  const top = F.lift(R, TH, sT.t(.44), sT.d(.07), { over: .02 });
  F.poly(top, [[TX0, TZF], [SX0, TZF], [SX1, TZF], [TX1, TZF], [TX1, TZB], [TX0, TZB]], TERRTOP, .5);
  // Terrassenplatten 0,6 × 0,6 als Fugen
  for (let x = TX0 + .58; x < TX1 - .1; x += .58) F.line(top, [x, TZF], [x, TZB], .22);
  for (let z = TZF - .58; z > TZB + .1; z -= .58) F.line(top, [TX0, z], [TX1, z], .22);
  const down = { own: R, over: .03 };
  K.rect(K.panel(top, [TX0, TZB], [TX1, TZB], [0, -1], sT.t(.48), sT.d(.06), -Q, down), 0, 0, TX1 - TX0, TH, TERR);
  K.rect(K.panel(top, [TX0, TZF], [TX0, TZB], [-1, 0], sT.t(.485), sT.d(.06), -Q, down), 0, 0, TZF - TZB, TH, TERR);
  K.rect(K.panel(top, [TX1, TZF], [TX1, TZB], [1, 0], sT.t(.485), sT.d(.06), -Q, down), 0, 0, TZF - TZB, TH, TERR);
  K.rect(K.panel(top, [TX0, TZF], [SX0, TZF], [0, 1], sT.t(.49), sT.d(.06), -Q, down), 0, 0, SX0 - TX0, TH, TERR);
  K.rect(K.panel(top, [SX1, TZF], [TX1, TZF], [0, 1], sT.t(.49), sT.d(.06), -Q, down), 0, 0, TX1 - SX1, TH, TERR);
  // Treppe: Zickzackstreifen aus der Vorderkante, faltet sich Stufe für Stufe. Setz- und Trittstufe einer Stufe teilen sich
  // ein Zeitfenster (−θ und +θ): die Trittstufen bleiben dadurch immer waagerecht, nichts taucht unter den Bogen,
  // und die Stufen rasten nacheinander ein
  {
    let p = top, z = TZF;
    const n = 2 * NS - 1;
    for (let i = 0; i < n; i++) {
      const riser = i % 2 === 0, len = riser ? RS : TS;
      const ang = riser ? -Q : Q;
      const nd = K.panel(p, [SX0, z], [SX1, z], [0, 1], sT.t(.52 + Math.floor(i / 2) * .016), sT.d(.05), ang, { own: R, over: .05 });
      K.rect(nd, 0, 0, SX1 - SX0, len, riser ? TERR : STONE);
      p = nd; z += len;
    }
  }

  // ---------- G2 Fläche: Kontur mit Eckmarken (Quadratmeter), dann ganze Steine Reihe für Reihe ----------
  const tick = .32, cm = [];
  const ln = (a, b) => cm.push([a, b]);
  ln([PX0, PZB], [PX1, PZB]); ln([PX1, PZB], [PX1, PZF]); ln([PX1, PZF], [PX0, PZF]); ln([PX0, PZF], [PX0, PZB]);
  // Eckmarken außen, vorn deutlich vor den Steinwänden, damit die überstehende Reihe sichtbar über die Kontur ragt
  for (const [x, z, dx, dz] of [[PX0, PZB, -1, -1], [PX1, PZB, 1, -1], [PX0, PZF, -1, 1], [PX1, PZF, 1, 1]]) {
    ln([x + dx * .18, z], [x + dx * (.18 + tick), z]); ln([x, z + dz * .18], [x, z + dz * (.18 + tick)]);
  }
  F.sketch(R, cm, sF.t(.105), sF.d(.045), { a: .62 });
  // Stein: Platte hebt sich parallel, nur die Außenwände der Fläche schwenken hoch (innen liegen die Steine Fuge an Fuge,
  // ihre Wände hätten in Ruhe keinen Platz im Bogen)
  function slab(par, x0, x1, z0, z1, h, t0, d, o = {}) {
    const walls = o.walls || "", col = o.col, D = z0 - z1, W = x1 - x0, thin = h < .15;
    const op = { over: o.over, nocut: thin, nofold: thin, own: o.own }, r = {};
    if (walls.includes("f")) { r.fr = K.panel(par, [x0, z0], [x1, z0], [0, 1], t0, d, Q, op); K.rect(r.fr, 0, 0, W, h, o.fcol || col); }
    if (walls.includes("b")) { r.bk = K.panel(par, [x0, z1], [x1, z1], [0, -1], t0, d, Q, op); K.rect(r.bk, 0, 0, W, h, col); }
    if (walls.includes("l")) { r.lf = K.panel(par, [x0, z0], [x0, z1], [-1, 0], t0, d, Q, op); K.rect(r.lf, 0, 0, D, h, col); }
    if (walls.includes("r")) { r.rt = K.panel(par, [x1, z0], [x1, z1], [1, 0], t0, d, Q, op); K.rect(r.rt, 0, 0, D, h, col); }
    r.top = F.lift(par, h, t0, d, { over: o.over !== undefined ? o.over : .04, own: o.own });
    F.poly(r.top, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], o.top || col, .5);
    return r;
  }
  for (let r = 0; r < NR; r++) {
    F.part("reihe" + r, sF.t(.125 + r * .0675 / (NR - 1)), sF.d(.028));
    const za = PZB + r * RH, zf = za + RH, odd = r % 2 === 1;
    const xs = [PX0]; let x = PX0 + (odd ? CW / 2 : CW);
    while (x < PX1 - 1e-6) { xs.push(x); x += CW; }
    xs.push(PX1);
    for (let k = 0; k < xs.length - 1; k++) {
      const xa = xs[k], xb = xs[k + 1];
      const walls = (r === 0 ? "b" : "") + (r === NR - 1 ? "f" : "") + (k === 0 ? "l" : "") + (k === xs.length - 2 ? "r" : "");
      const col = (r * 3 + k) % 5 === 0 ? OLD : (r * 7 + k) % 4 === 0 ? STONE2 : STONE;
      slab(R, xa + G / 2, xb - G / 2, zf - G / 2, za + G / 2, SH, sF.t(.20 + r * .14 / (NR - 1) + (xa - PX0) * .0016), sF.d(.055), { walls, col, over: .06 });
    }
  }

  // ---------- G3 Steinstapel auf Palette mit Lattung (Gewicht und Fracht) ----------
  F.part("palette", sP.t(.54), sP.d(.05));
  const pal = K.box(R, AX0, AX1, AZ0, AZ1, AH, sP.t(.59), sP.d(.1), { col: PALC });
  // Stirnseiten: unten die Palette mit Lattung und Klotzöffnungen, darüber Lagen ganzer Steine im Läuferverband
  const stackFace = (Wm, Hm, cwm) => (x, W, H) => {
    const s = W / Wm, ph = AP * s;
    x.fillStyle = "#efe9dc"; x.fillRect(0, 0, W, H - ph);
    const rows = 8, rh = (H - ph) / rows, cw = cwm * s;
    x.strokeStyle = ink(.34); x.lineWidth = Math.max(1.5, .012 * s);
    for (let r = 0; r <= rows; r++) { x.beginPath(); x.moveTo(0, r * rh); x.lineTo(W, r * rh); x.stroke(); }
    for (let r = 0; r < rows; r++) for (let X = (r % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, r * rh); x.lineTo(X, (r + 1) * rh); x.stroke(); }
    // Palette: Deckbretter, Klötze mit Öffnungen dazwischen, Bodenbrett
    const y0 = H - ph;
    x.fillStyle = "#ddd2bd"; x.fillRect(0, y0, W, ph);
    x.fillStyle = ink(.1); x.fillRect(0, y0, W, ph * .22); x.fillRect(0, H - ph * .2, W, ph * .2);
    x.fillStyle = "#6f6a62";
    const bw = W * .2, gaps = [[bw, W / 2 - bw / 2], [W / 2 + bw / 2, W - bw]];
    for (const [a, b] of gaps) x.fillRect(a, y0 + ph * .24, b - a, ph * .54);
    x.strokeStyle = ink(.45); x.lineWidth = Math.max(1.5, .01 * s); x.strokeRect(1, y0, W - 2, ph - 1);
  };
  const PXU = 420;
  K.onPanel(pal.fr, K.decal(Math.round((AX1 - AX0) * PXU), Math.round(AH * PXU), stackFace(AX1 - AX0, AH, .6), AX1 - AX0, AH, sP.t(.62)), (AX1 - AX0) / 2, AH / 2, -1);
  K.onPanel(pal.rt, K.decal(Math.round((AZ0 - AZ1) * PXU), Math.round(AH * PXU), stackFace(AZ0 - AZ1, AH, .3), AZ0 - AZ1, AH, sP.t(.62)), (AZ0 - AZ1) / 2, AH / 2, -1);
  K.onPanel(pal.lf, K.decal(Math.round((AZ0 - AZ1) * PXU), Math.round(AH * PXU), stackFace(AZ0 - AZ1, AH, .3), AZ0 - AZ1, AH, sP.t(.62)), (AZ0 - AZ1) / 2, AH / 2, -1);
  // oberste Lage: Steinfugen; darauf das Frachtschild (Typenschild: Postleitzahl-Linie), kein Satz
  const LD0 = AZ0 - AZ1;
  K.onPanel(pal.top, K.decal(Math.round((AX1 - AX0) * PXU), Math.round(LD0 * PXU), (x, W, H) => {
    const s = W / (AX1 - AX0), cw = .6 * s, rh = .3 * s;
    x.fillStyle = "#efe9dc"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.2); x.lineWidth = Math.max(1.5, .01 * s);
    for (let y = rh, r = 0; y < H - 2; y += rh, r++) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    for (let r = 0; r * rh < H; r++) for (let X = (r % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, r * rh); x.lineTo(X, Math.min(H, (r + 1) * rh)); x.stroke(); }
  }, AX1 - AX0, LD0, sP.t(.66)), (AX1 - AX0) / 2, LD0 / 2, -1, [0, 1], .0015);
  // Frachtschild an der Stirnseite der Palette: Name und Postleitzahl-Strich
  const plz = K.print(["Fracht · PLZ"], .15, sP.t(.685), { col: MUTED, track: .04, align: "center" });
  K.onPanel(pal.fr, plz, (AX1 - AX0) / 2, AH - .3, -1);

  // ---------- G4 Fracht nach PLZ: drei Händler, Weiche, Linie zum zuständigen ----------
  F.part("haendler", sH.t(.66), sH.d(.06));
  const doors = (Wm, Hm, band) => (x, W, H) => {
    const s = W / Wm, dh = (band ? .5 : .44) * s, dw = (band ? .78 : .62) * s, gap = (band ? .3 : .22) * s, x0 = (W - 2 * dw - gap) / 2;
    for (let i = 0; i < 2; i++) {
      const X = x0 + i * (dw + gap), Y = H - dh;
      x.fillStyle = "#d9d5cc"; x.fillRect(X, Y, dw, dh);
      x.strokeStyle = ink(.42); x.lineWidth = Math.max(1.5, .012 * s); x.strokeRect(X, Y, dw, dh);
      x.strokeStyle = ink(.26); for (let k = 1; k < 7; k++) { x.beginPath(); x.moveTo(X, Y + k * dh / 7); x.lineTo(X + dw, Y + k * dh / 7); x.stroke(); }
    }
    // Fensterband unter der Dachkante (ohne Druck) bzw. Schildfeld für den zuständigen Händler
    if (!band) { x.fillStyle = ink(.12); x.fillRect(.18 * s, .1 * s, W - .36 * s, .12 * s); }
  };
  const halls = HL.map(([x0, z0, w, d, h], i) => {
    const hl = slab(R, x0, x0 + w, z0, z0 - d, h, sH.t([.735, .72, .75][i]), sH.d(.065), { walls: "flrb", col: HALLC, top: ROOFC, over: .03 });
    K.onPanel(hl.fr, K.decal(Math.round(w * 360), Math.round(h * 360), doors(w, h, i === 1), w, h, sH.t([.76, .745, .775][i])), w / 2, h / 2, -1);
    return hl;
  });
  // Weiche vor der zuständigen Halle; Haarlinien zu den beiden anderen Händlern (hinten, rechts), die Fracht-Linie dunkel zum zuständigen (rot bleibt dem Faden)
  const WJ = [AX1 + 1.45, -1.0], fr = i => [HL[i][0] + HL[i][2] / 2, HL[i][1] + .06];
  const h0 = fr(0), h1 = fr(1), h2 = fr(2), wx = WJ[0];
  F.sketch(R, [[WJ, [wx + .5, -1.5]], [[wx + .5, -1.5], [wx + .5, -4.35]], [[wx + .5, -4.35], [h0[0], -4.35]], [[h0[0], -4.35], h0],
    [WJ, [wx + .65, -.95]], [[wx + .65, -.95], [h2[0], -.95]], [[h2[0], -.95], h2]], sH.t(.805), sH.d(.04), { a: .55 });
  const route = [[AX1 + .05, AZ0 + .05], [AX1 + .6, -1.6], WJ, [wx + .9, -.85], [h1[0] - .5, -1.05], h1];
  const rsegs = [], rc = new THREE.CatmullRomCurve3(route.map(p => V(p[0], 0, p[1])), false, "centripetal", .5).getSpacedPoints(40);
  for (let k = 0; k < 40; k++) rsegs.push([[rc[k].x, rc[k].z], [rc[k + 1].x, rc[k + 1].z]]);
  F.sketch(R, rsegs, sH.t(.805), sH.d(.05), { a: .9, dy: .0012 });
  F.sketch(R, rsegs, sH.t(.81), sH.d(.05), { a: .6, dy: .0016 });
  F.sketch(R, Array.from({ length: 16 }, (_, k) => [[WJ[0] + Math.cos(k / 16 * 2 * PI) * .09, WJ[1] + Math.sin(k / 16 * 2 * PI) * .09], [WJ[0] + Math.cos((k + 1) / 16 * 2 * PI) * .09, WJ[1] + Math.sin((k + 1) / 16 * 2 * PI) * .09]]), sH.t(.81), sH.d(.03), { a: .9 });

  // ---------- G5 Laptop mit der Produktseite (betreut, läuft weiter) ----------
  F.part("laptop", sL.t(.82), sL.d(.05));
  const LX1 = LX0 + LW, LZB = LZF - LD;
  const base = slab(R, LX0, LX1, LZF, LZB, LTH, sL.t(.875), sL.d(.035), { walls: "flr", col: LAPC, over: .03 });
  // Tastatur hinten, Handballenauflage vorn
  const KBD = 1.0;
  K.onFlat(base.top, K.decal(1400, Math.round(1400 * KBD / (LW - .3)), keyboard, LW - .3, KBD, sL.t(.885)), LX0 + LW / 2, LZB + .1 + KBD / 2, .002);
  const scr = K.panel(base.top, [LX0, LZB], [LX1, LZB], [0, -1], sL.t(.895), sL.d(.06), Q - .2, { own: R, over: .05 });
  K.rect(scr, 0, 0, LW, SHT, SCRC);
  // Bildschirm: Rahmen, Browserleiste, echte Produktseite (gerwing-produkt-ausschnitt.jpg), darunter ein Stück Seite
  const SPX = 560;
  K.onPanel(scr, K.decal(Math.round(LW * SPX), Math.round(SHT * SPX), (x, W, H) => {
    const bz = .09 * SPX, ix = bz, iy = bz, iw = W - 2 * bz, ih = H - 2 * bz;
    x.fillStyle = "#2f2f33"; rr(x, 0, 0, W, H, .05 * SPX); x.fill();
    x.fillStyle = "#ffffff"; x.fillRect(ix, iy, iw, ih);
    const bar = .1 * SPX;
    x.fillStyle = "#efefef"; x.fillRect(ix, iy, iw, bar);
    x.fillStyle = "#d8d8d8"; rr(x, ix + iw * .25, iy + bar * .22, iw * .5, bar * .56, bar * .28); x.fill();
    x.fillStyle = ink(.55); x.font = `${Math.round(bar * .36)}px "Schibsted Grotesk", sans-serif`; x.textBaseline = "middle";
    x.fillText("gerwing.de", ix + iw * .27, iy + bar / 2);
    const im = BMP.prod;
    if (im) {
      const dw = iw, dh = dw * im.height / im.width;
      x.drawImage(im, ix, iy + bar + .05 * SPX, dw, Math.min(dh, ih - bar - .05 * SPX));
    }
    // Seitenfuß: Platzhalterzeilen der nächsten Abschnitte
    x.fillStyle = ink(.12); for (let k = 0; k < 3; k++) x.fillRect(ix + .12 * SPX, iy + ih - (.24 - k * .07) * SPX, iw * (.5 - k * .1), .025 * SPX);
  }, LW, SHT, sL.t(.915)), LW / 2, SHT / 2, 1);
  // Statuspunkt in der Browserleiste: betreut, läuft
  K.ticker(scr, .035, scr.uv(LW - .3, SHT - .14), [0, -1], 1, sL.t(.95));

  // ---------- Konstruktionsphase: Gerüst je Bauabschnitt kurz vor dem Hochklappen, Bleistiftspur auf den Flächen ----------
  // Steine und Wand ohne eigenes Gerüst (die Kontur mit Eckmarken zeichnet vor); die Bons bringen Gerüst und Spur selbst mit.
  F.geruest({ tags: ["terrasse"], t0: sT.t(.375), t1: sT.t(.44), du: .03, a: .5 });
  F.geruest({ tags: ["palette"], t0: sP.t(.545), t1: sP.t(.59), du: .03, a: .5 });
  F.geruest({ tags: ["haendler"], t0: sH.t(.67), t1: sH.t(.72), du: .03, a: .5 });
  F.geruest({ tags: ["laptop"], t0: sL.t(.83), t1: sL.t(.875), du: .03, a: .5 });
  F.spur({ tags: ["terrasse", "palette", "haendler", "laptop"], quiet: [pal.top, pal.fr, pal.lf, pal.rt, ...halls.map(h => h.fr), base.top, scr], a: .3 });

  // ---------- Kamera und Faden: alles aus der Bahn (Gier 0, gleiche Neigung und gleicher Abstand, nur nach rechts) ----------
  const bEnd = .97;
  return {
    fov: 32, fovN: 44, smooth: true,
    track: 1000,
    // Raster: zieht mit den ersten Bastellinien ein und ist weg, bevor der erste Bon liest (b .025)
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .13 },
    stops: B.stops, names: B.names,
    keys: B.keys({ b: bEnd, shift: 1.8, w: .6 }),
    thread: B.thread({ hold: .04, depart: .10, bEnd }),
    fadenIO: B.faden({ inn: [hx - 1.6, ZB + 10.2], out: [B.endX + 3.5, -8.1] })
  };
}
