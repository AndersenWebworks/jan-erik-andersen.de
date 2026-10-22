// Gerwing – Pflaster nach Fläche bestellen. Szene im Stil Bogen + Bastellinien (Faltkern falt.js, Gerüst kern.js).
// Umbau 22.10.2026 (zweite Fassung, Erik: „ist nicht die ganze abfolge falsch? … am anfang die bestellung shop, am ende haus mit terasse“):
//   Reihenfolge entlang der Kamerafahrt, von links nach rechts: 1 Wand mit dem ganzen Gerwing-Text (eine Lesestelle) → 2 Zoom auf den
//   Laptop mit dem echten Shop (die Bestellung; Handy daneben, beide stehen auf dem Bogen vor der Wand) → 3 Fläche, ganze Steine im
//   Läuferverband → Palette mit Steinstapel (Gewicht, Fracht) → Weiche zu drei Händlerhallen, Rolltor der zuständigen fährt hoch →
//   4 Ergebnis beim Kunden: Haus mit Glastüren und fertig gepflasterter Terrasse mit Treppe, hinten rechts hinter den Hallen.
//   Nichts neu gebaut: dieselben Bauteile, nur umgestellt (Laptop und Handy vom Terrassenboden auf den Bogen, Haus und Terrasse ans Ende,
//   Fläche und Palette nach rechts, Palette und Hallen auf eine gemeinsame Flucht) und zeitlich neu gelegt.
// Der rote Faden läuft vom Laptop gerade an Fläche, Palette und Weiche vorbei bis vor das Rolltor der zuständigen Halle, dann durch die Lücke zwischen
// zweiter und dritter Halle nach hinten (nie durch ein Gebäude) und vor der Treppe des Hauses entlang hinaus (Wenden mit gleitender Krümmung).
// Das Haus: Hauswand mit Glastüren, Seitenwände und Dach klappen an ihr nach hinten; die Terrasse liegt niedrig und bündig davor.
// Aus Raumtext 2: Hauswand mit Glastüren, Text ganz auf einer Wand, Laptop und Handy mit echtem Shopbild, Steinstapel auf Palette.
// Aus Blatt: Palette mit Lattung und Klötzen, drei Händlerhallen mit Rolltoren, Weiche mit Haarlinien zu den beiden anderen und rot zum
// zuständigen Händler. Mechanik, Kamera, Bastellinien, Konstruktionsphase: seite/ (Bogen, Faltkern).
// Keine Zahlen auf Bauteilen außer den Beispielwerten des Lieferscheins, keine Texte außer dem Gerwing-Text auf der Wand und dem Lieferschein.
// Drucke und Abdrücke liegen mit 4 bis 6 mm Abstand über ihrer Fläche (vorher 2 mm, bei Abstand 15 bis 27 nahe der Tiefenauflösung).
// Feinschliff 22.10.2026 abends (Erik: „anordnung, linienform doof, punkte, kamera unspannend, haus ohne deko und abschluss … erzählen, was der
// frachtrechner auf dem weg macht, mit ner coolen papierlösung“; gewählt: „Lieferschein reist mit“):
//   Der Lieferschein (einziges neues Bauteil) ist ein Papierblatt auf Stützstreifen, das am Laptop nach der Bestellung aufsteht und mit dem roten
//   Punkt reist. An jeder Station bekommt er einen Stempel mit dem Ergebnis des Rechenschritts (Beispielwerte, kein Gerwing-Preis):
//   Fläche 24 m² → ganze Steine (24 m² : 0,0375 m² je Stein 25 × 15 cm = 640, plus 5 % Verschnitt = 672 Stück) → Gewicht (672 × 5,2 kg = 3.494 kg)
//   → Fracht nach PLZ 19395 (3 Paletten) → an Händler (roter Haken) → geliefert (roter Haken am Haus).
//   Stationen stehen in Laufrichtung im Abstand von rund 3 Einheiten auf einer Flucht (Vorderkanten bei ZFR), der Faden läuft 0,75 davor auf einer
//   Lauflinie (ZL) durch alle Stationen; die Markierungspunkte sitzen genau auf dem Faden an den Stationen. Der Faden besteht aus Stücken zwischen den
//   Stationen, die an den Übergängen gerade und tangential aneinander anschließen; Wenden laufen mit gleitender Krümmung (turn()). Die Kamera hält an
//   jeder Station still, solange gestempelt wird; ein Yaw (rund −9°) für die ganze Fahrt, am Ende hebt sie sich über den Lieferschein und zieht zurück.
//   Haus: Pflanzkübel (dtPflanze aus schreibtisch.js), Tisch und zwei Stühle, Wandlampe neben der Tür; der letzte Stein legt sich in die Lücke der Terrasse (Ruhelage verborgen unter der Platte, wie in schreibtisch.js).
import { keyboard } from "./zeichnungen.js";
import { dtPflanze } from "./schreibtisch.js";

// Shopbilder (ImageBitmap), vor dem Aufbau in main.js aus bilder/bilder.js dekodiert
let BMP = {};
export function setBilder(b) { BMP = b || {}; }

const ink = a => `rgba(48,48,51,${a})`;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Text (wörtlich aus dem Seitentext, seite/index.html Zeilen 140–144) ----------
const META = "WooCommerce · seit 2023";
const TITEL = "Pflaster nach Fläche bestellen";
const P1 = ["Für Gerwing habe ich 2023 einen WooCommerce-Shop", "gebaut, der Pflastersteine, Terrassenplatten und", "Stufen so verkauft, wie man sie bestellt: nach Fläche."];
const P2 = ["Kunden geben ihre Quadratmeter ein, der Shop rechnet", "sie in ganze Steine um, ermittelt Gewicht und Fracht", "nach Postleitzahl und leitet die Bestellung an den", "zuständigen Händler weiter. Seitdem betreue ich den", "Shop und entwickle ihn laufend weiter."];
const P1N = ["Für Gerwing habe ich 2023 einen", "WooCommerce-Shop gebaut, der", "Pflastersteine, Terrassenplatten", "und Stufen so verkauft, wie man", "sie bestellt: nach Fläche."];
const P2N = ["Kunden geben ihre Quadratmeter", "ein, der Shop rechnet sie in", "ganze Steine um, ermittelt", "Gewicht und Fracht nach", "Postleitzahl und leitet die", "Bestellung an den zuständigen", "Händler weiter. Seitdem betreue", "ich den Shop und entwickle ihn", "laufend weiter."];

export default function (K) {
  const { F, R, V, COL, Q, PI, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const WALLC = c3("#eceff4"), HOUSEC = c3("#eaedf2"), STONE = COL.STONE, STONE2 = COL.STONE2, OLD = COL.OLD;
  const TERR = c3("#dcdfe4"), TERRTOP = c3("#e7eaef"), PALC = c3("#dfe2e7"), HALLC = c3("#e9ecf1"), ROOFC = c3("#d5d8dd");
  const LAPC = c3("#dee1e6"), SCRC = c3("#3a3a3e"), RED = COL.RED;
  const MUTED = "#66666a";
  // Zeitplan (b) der Stationen des Lieferscheins: Halt (Ankunft, Abfahrt) an Laptop, Fläche (m²), ganze Steine, Palette, Weiche (Fracht), Tor, Haus
  const HOLD = [[.245, .290], [.345, .380], [.435, .470], [.525, .560], [.615, .650], [.705, .740], [.850, .892]];
  const B_TOR = .705, B_STEIN = .905;

  // Kamerahilfe: Ziel, Blickhöhe (Grad), Gier (Grad, + = Kamera rechts), Abstand
  const sph = (t, el, az, d) => { const e = el * PI / 180, a = az * PI / 180; return V(t.x + d * Math.cos(e) * Math.sin(a), t.y + d * Math.sin(e), t.z + d * Math.cos(e) * Math.cos(a)); };
  const key = (w, b, tD, elD, azD, dD, tN, elN, azN, dN) => ({ w, b, tgt: tD, cam: sph(tD, elD, azD, dD), tgtN: tN, camN: sph(tN, elN, azN, dN) });
  const sans = (lines, e, on, o = {}) => K.print(lines, e, on, o);
  // Druck links bündig an u0 (Fläche K.panel): Mitte des Drucks
  const uL = (pr, u0) => u0 + pr.w / 2 - pr.t.padX * pr.e;

  // ---------- Text der Wand: ein Träger, ganze Sätze ----------
  // Desktop 20 px Fließtext bei e .14; Handy 16 … 18 px bei e .2, Umbrüche enger und Wand höher
  const eB = N ? .2 : .14, M0 = N ? .4 : .5;
  const gw = K.print(["Gerwing"], N ? .64 : .78, -1, { font: "serif", lh: 1, grp: "wand" });
  const mt = K.print([META], N ? .15 : .12, -1, { track: .03, col: MUTED, grp: "wand" });
  const hd = K.print(N ? ["Pflaster nach Fläche", "bestellen"] : [TITEL], N ? .36 : .3, -1, { font: "serif", lh: 1.08, grp: "wand" });
  const t1 = sans(N ? P1N : P1, eB, .085, { lh: 1.36, fade: .05, grp: "wand" });
  const t2 = sans(N ? P2N : P2, eB, .098, { lh: 1.36, fade: .05, grp: "wand" });
  // von oben nach unten gestapelt (Abstand vor dem Druck), daraus die Höhe der Wand
  const stack = [[gw, 0], [mt, N ? -.1 : -.13], [hd, .02], [t1, .1], [t2, .14]];
  const MT = .36, MB = .44;
  let ys = 0; const yc = stack.map(([pr, g]) => { ys += g; const c = ys + pr.h / 2; ys += pr.h; return c; });

  // ---------- Faden-Geometrie: Kurve mit gleitender Krümmung ----------
  // Eine Wende um d Grad über die Länge L: die Richtung folgt einer Glättungsfunktion (3t² − 2t³), die Krümmung steigt also von 0 weich an und fällt
  // wieder auf 0 (kein Krümmungssprung am Übergang von Gerade zu Kurve). Richtung als Winkel th (Grad) in der x/z-Ebene: 0 = nach rechts (+x), −90 = nach hinten (−z).
  const turn = (x, z, th0, d, L) => {
    const n = Math.max(2, Math.round(L / .1)), ds = L / n, pts = [], a0 = th0 * PI / 180, da = d * PI / 180; let X = x, Z = z;
    for (let i = 0; i < n; i++) { pts.push([X, Z]); const t = (i + .5) / n, th = a0 + da * t * t * (3 - 2 * t); X += Math.cos(th) * ds; Z += Math.sin(th) * ds; }
    return { pts, end: [X, Z] };
  };
  const disp = (th0, d, L) => turn(0, 0, th0, d, L).end;

  // ---------- Lage (Bogen x nach rechts, z zum Betrachter) ----------
  // Giebelwand mit dem Text links; davor rechts daneben Laptop und Handy; dann Fläche, Palette, Weiche, Hallen; hinten rechts das Haus.
  // Stationen des Lieferscheins im Abstand von rund 3 Einheiten: Laptop −0,7, Fläche 2,1 (m²) und 5,1 (ganze Steine), Palette 8,1, Weiche 11,1, Tor der
  // zuständigen Halle 14,1, Haus 17,6 (vor der Treppe). Alle Vorderkanten (Laptop, Fläche, Palette, Hallen) stehen auf der Flucht ZFR.
  const WX0 = N ? -9.4 : -9.8, WW = N ? 4.2 : 5.2, ZW = -5.2, HW = Math.round((MT + ys + MB) * 20) / 20;
  // Pflasterfläche: Steine 0,6 × 0,3 (Verhältnis 25 × 15 cm wie im Shop), Kontur eine halbe Reihe kürzer als die ganzen Steine:
  // die letzte Reihe ragt halb über die Kontur. Desktop 9 Steine × 10 Reihen, Handy schmaler und tiefer (6 × 14)
  const CW = .6, RH = .3, NC = N ? 6 : 9, NR = N ? 14 : 10, PX0 = N ? 1.925 : 1.025, PX1 = PX0 + NC * CW, PZB = N ? -4.8 : -4.4, PZF = PZB + (NR - .5) * RH, SH = .12, G = .012;
  const ZFR = PZB + NR * RH;                              // Flucht der Vorderkanten (vorderste Steinreihe)
  const ZL = ZFR + .75;                                   // Lauflinie des Fadens vor den Stationen
  const SXS = [-.7, 2.25, 5.2, 8.15, 11.1, 14.05];           // x der Stationen am Faden (Laptop, Fläche, Steine, Palette, Weiche, Tor)
  // Haus mit Terrasse hinten rechts (Ergebnis); die Hauswand steht auf der Linie ZH und ist die Rückwand der Terrasse
  const ZH = -10.4, TX0 = 14.3, TX1 = 19.5, TZB = ZH, TZF = ZH + 3.2, TH = .24, SX0 = TX0 + 2.9, SX1 = TX0 + 4.5, NS = 2, RS = TH / NS, TS = .36;
  const HX0 = TX0 - 2.2, HX1 = TX1 + .5, HHS = 3.35, HD = 1.8;     // HD: Tiefe der Seitenwände und des Dachs hinter der Hauswand
    // Laptop und Handy stehen auf dem Bogen rechts neben der Wand (Blick nach vorn)
  const LW = N ? 1.5 : 1.7, LD = 1.0, LH = .07, SHT = N ? .93 : 1.05, LX0 = N ? -3.65 : -3.85, LZF = ZFR;
  const PWD = .5, PHG = .94, PHX0 = -1.95, PHZ = ZFR;
  // Palette mit Steinstapel; ihre Vorderkante steht auf der Flucht wie die Fronten der Hallen
  const AX0 = 7.65, AX1 = 10.05, AZ0 = ZFR, AZ1 = ZFR - 1.4, AH = 1.42, AP = .3, NL = 8;
  // Lager: Hallen [x0, z0 (Front), Breite, Tiefe, Höhe]; zuständig ist HL[1]; zwischen zweiter und dritter Halle bleibt 1,0 für den Faden
  const HL = [[10.95, ZFR, 2.2, 1.2, .8], [13.85, ZFR, 2.4, 1.2, .95], [17.25, ZFR, 2.2, 1.2, .8]];
  const gate = i => HL[i][0] + HL[i][2] / 2, GZ = HL[0][1];
  const WJ = [SXS[4], ZL];
  // Station Haus: nach dem Bogen durch die Lücke zwischen zweiter und dritter Halle (GX) und dem großen Bogen R2 noch ein gerades Stück, vor der Treppe
  const GX = (HL[1][0] + HL[1][2] + HL[2][0]) / 2, GZ2 = -3.5, L0 = 2.0, L1 = 2.0, L2 = 2.2, L3 = 2.2, TU2 = disp(-90, 90, L2), SH6 = [GX + TU2[0] + .55, GZ2 + TU2[1]];
  const ZBACK = Math.min(ZW - HW, ZH - HHS - HD) - .4;

  // ---------- Bogen ----------
  K.sheet(-11.6, 24, ZBACK, 3.4);

  // ---------- 1 Wand mit Gerwing-Text: liegt flach (Name, Kennzeile, Überschrift lesbar), steht auf, rastet ein ----------
  F.part("wand", 0, .03);
  const wall = K.panel(R, [WX0, ZW], [WX0 + WW, ZW], [0, -1], .03, .065, Q, { over: .04 });
  K.rect(wall, 0, 0, WW, HW, WALLC);
  stack.forEach(([pr], i) => {
    const off = pr === gw ? -.05 : pr === hd ? -.03 : 0;
    K.onPanel(wall, pr, uL(pr, M0 + off), HW - MT - yc[i], 1, null, .006);
  });

  // ---------- 2 Fläche: Kontur mit Eckmarken (Quadratmeter) ----------
  const tick = .32, cm = [];
  const ln = (a, b) => cm.push([a, b]);
  ln([PX0, PZB], [PX1, PZB]); ln([PX1, PZB], [PX1, PZF]); ln([PX1, PZF], [PX0, PZF]); ln([PX0, PZF], [PX0, PZB]);
  // Eckmarken außen, vorn deutlich vor den Steinwänden, damit die überstehende Reihe sichtbar über die Kontur ragt
  for (const [x, z, dx, dz] of [[PX0, PZB, -1, -1], [PX1, PZB, 1, -1], [PX0, PZF, -1, 1], [PX1, PZF, 1, 1]]) {
    ln([x + dx * .18, z], [x + dx * (.18 + tick), z]); ln([x, z + dz * .18], [x, z + dz * (.18 + tick)]);
  }
  F.sketch(R, cm, .285, .05, { a: .62 });
  // ---------- 3 Ganze Steine im Läuferverband, Reihe für Reihe ----------
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
  // Block wie in schreibtisch.js (Deko, Ruhelage knapp UNTER der tragenden Platte, verborgen; beim Aufbau kommt er durch die Platte nach oben): Randstreifen
  // klappen an den Kanten der Grundfläche hoch, die Platte hebt sich parallel. Nur für die Deko auf der Terrasse (Tisch, Stühle, letzter Stein).
  const BUR = .06;
  function blk(par, x0, x1, z0, z1, hs, t0, d, side, topc, lv0 = -40) {
    const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, dt = d / hs.length;
    let cur = par, Lh = null;
    hs.forEach((h0, i) => {
      const h = h0 + (i ? 0 : BUR), t = t0 + i * dt, lv = lv0 + 2 * i;
      for (let k = 0; k < 4; k++) {
        const a = pts[k], b2 = pts[(k + 1) % 4]; let nx = a[1] - b2[1], nz = b2[0] - a[0]; const l = Math.hypot(nx, nz); nx /= l; nz /= l;
        if ((cx - a[0]) * nx + (cz - a[1]) * nz > 0) { nx = -nx; nz = -nz; }
        K.rect(K.panel(cur, a, b2, [nx, nz], t, dt, Q, { lv, nocut: true, nofold: true, over: .05 }), 0, 0, l, h, side);
      }
      Lh = F.lift(cur, h, t, dt, { lv: lv + 1, over: .04 });
      F.poly(Lh, pts, i === hs.length - 1 ? topc : side, .5, 0, undefined, i ? { nocut: true } : undefined);
      cur = Lh;
    });
    Lh.lvTop = lv0 + 2 * (hs.length - 1) + 1;
    return Lh;
  }
  for (let r = 0; r < NR; r++) {
    F.part("reihe" + r, .345 + r * .0055, .028);
    const za = PZB + r * RH, zf = za + RH, odd = r % 2 === 1;
    const xs = [PX0]; let x = PX0 + (odd ? CW / 2 : CW);
    while (x < PX1 - 1e-6) { xs.push(x); x += CW; }
    xs.push(PX1);
    for (let k = 0; k < xs.length - 1; k++) {
      const xa = xs[k], xb = xs[k + 1];
      const walls = (r === 0 ? "b" : "") + (r === NR - 1 ? "f" : "") + (k === 0 ? "l" : "") + (k === xs.length - 2 ? "r" : "");
      const col = (r * 3 + k) % 5 === 0 ? OLD : (r * 7 + k) % 4 === 0 ? STONE2 : STONE;
      slab(R, xa + G / 2, xb - G / 2, zf - G / 2, za + G / 2, SH, .35 + r * .0055 + (xa - PX0) * .0008, .028, { walls, col, over: .06 });
    }
  }

  // ---------- 4 Hauswand mit Glastüren (Rückwand der Terrasse), am Ende hinten rechts ----------
  F.part("haus", .745, .05);
  const HWL = HX1 - HX0, house = K.panel(R, [HX0, ZH], [HX1, ZH], [0, -1], .755, .07, Q, { over: .04 });
  K.rect(house, 0, 0, HWL, HHS, HOUSEC);
  const houseFace = (x, W, H) => {
    const s = W / HWL, Y = v => H - v * s, line = Math.max(1.5, .012 * s);
    x.fillStyle = ink(.1); x.fillRect(0, 0, W, .1 * s);
    x.fillStyle = ink(.06); x.fillRect(0, Y(TH), W, TH * s);
    const glass = (u0, u1, v0, v1) => {
      const X = u0 * s, w = (u1 - u0) * s, Yt = Y(v1), h = (v1 - v0) * s;
      x.fillStyle = "#dde5e8"; x.fillRect(X, Yt, w, h);
      x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = .05 * s;
      x.beginPath(); x.moveTo(X + w * .18, Yt + h); x.lineTo(X + w * .55, Yt); x.moveTo(X + w * .5, Yt + h); x.lineTo(X + w * .82, Yt + h * .22); x.stroke();
      x.strokeStyle = ink(.5); x.lineWidth = line; x.strokeRect(X, Yt, w, h);
      x.beginPath(); x.moveTo(X + w / 2, Yt); x.lineTo(X + w / 2, Yt + h); x.stroke();
    };
    // drei Terrassentüren über der Terrasse, links zwei Fenster
    const du0 = TX0 - HX0 + .15, dw = (TX1 - TX0 - .3 - .4) / 3;
    for (let i = 0; i < 3; i++) {
      const a = du0 + i * (dw + .2); glass(a, a + dw, TH, TH + 2.1);
      x.strokeStyle = ink(.34); x.lineWidth = line; x.beginPath(); x.moveTo(a * s, Y(TH + 1.7)); x.lineTo((a + dw) * s, Y(TH + 1.7)); x.stroke();
      x.fillStyle = ink(.5); x.fillRect((a + dw / 2 - .08) * s, Y(TH + 1.05), .03 * s, .24 * s); x.fillRect((a + dw / 2 + .05) * s, Y(TH + 1.05), .03 * s, .24 * s);
    }
    const wd = Math.min(.9, (TX0 - HX0 - .5) / 2 - .1);
    for (let i = 0; i < 2; i++) { const a = .3 + i * (wd + .2); if (a + wd < TX0 - HX0 - .1) glass(a, a + wd, 1.5, 2.65); }
    // Wandlampe rechts neben der letzten Tür: Lichtschein (flache Ringe), Wandplatte, Laterne mit Kappe
    const lx = (HWL - .3) * s, ly = Y(1.7);
    for (let k = 5; k >= 1; k--) { x.fillStyle = `rgba(255,226,150,${.07 * (6 - k) / 2})`; x.beginPath(); x.arc(lx, ly + .12 * s, k * .11 * s, 0, 2 * PI); x.fill(); }
    x.fillStyle = ink(.5); x.fillRect(lx - .035 * s, ly - .2 * s, .07 * s, .4 * s);
    x.fillStyle = "#f6e4ae"; x.fillRect(lx - .08 * s, ly - .08 * s, .16 * s, .26 * s);
    x.strokeStyle = ink(.6); x.lineWidth = line; x.strokeRect(lx - .08 * s, ly - .08 * s, .16 * s, .26 * s);
    x.fillStyle = ink(.62); x.fillRect(lx - .11 * s, ly - .13 * s, .22 * s, .05 * s); x.fillRect(lx - .1 * s, ly + .18 * s, .2 * s, .03 * s);
  };
  // Seitenwände und Dach hängen an der Hauswand und klappen nach hinten (Unterseite): das Haus bekommt Tiefe und Dachkante
  {
    const sd = { own: R, over: .03 };
    K.rect(K.panel(house, [HX0, ZH], [HX0, ZH - HHS], [-1, 0], .81, .05, -Q, sd), 0, 0, HHS, HD, HOUSEC);
    K.rect(K.panel(house, [HX1, ZH], [HX1, ZH - HHS], [1, 0], .81, .05, -Q, sd), 0, 0, HHS, HD, HOUSEC);
    K.rect(K.panel(house, [HX0, ZH - HHS], [HX1, ZH - HHS], [0, -1], .83, .05, -Q, sd), 0, 0, HWL, HD, ROOFC);
  }
  K.onPanel(house, K.decal(Math.round(HWL * 280), Math.round(HHS * 280), houseFace, HWL, HHS, .765), HWL / 2, HHS / 2, 1, null, .005);

  // ---------- 5 Terrasse mit Platten und Treppe (vor der Hauswand) ----------
  const T0 = .73;
  F.part("terrasse", T0 - .005, .06);
  const top = F.lift(R, TH, T0, .07, { over: .02 });
  F.poly(top, [[TX0, TZF], [SX0, TZF], [SX1, TZF], [TX1, TZF], [TX1, TZB], [TX0, TZB]], TERRTOP, .5);
  // verlegte Steine 0,6 × 0,3 im Läuferverband (wie die Fläche): Reihenfugen und versetzte Stoßfugen
  for (let z = TZF - .3; z > TZB + .05; z -= .3) F.line(top, [TX0, z], [TX1, z], .22);
  for (let r = 0, z = TZF; z > TZB + .05; r++, z -= .3) for (let x = TX0 + (r % 2 ? .3 : .6); x < TX1 - .05; x += .6) F.line(top, [x, z], [x, Math.max(TZB, z - .3)], .22);
  // Seitenwände klappen nach unten, hinten steht die Hauswand
  const down = { own: R, over: .03 };
  K.rect(K.panel(top, [TX0, TZF], [TX0, TZB], [-1, 0], T0 + .045, .06, -Q, down), 0, 0, TZF - TZB, TH, TERR);
  K.rect(K.panel(top, [TX1, TZF], [TX1, TZB], [1, 0], T0 + .045, .06, -Q, down), 0, 0, TZF - TZB, TH, TERR);
  K.rect(K.panel(top, [TX0, TZF], [SX0, TZF], [0, 1], T0 + .05, .06, -Q, down), 0, 0, SX0 - TX0, TH, TERR);
  K.rect(K.panel(top, [SX1, TZF], [TX1, TZF], [0, 1], T0 + .05, .06, -Q, down), 0, 0, TX1 - SX1, TH, TERR);
  // Treppe: Zickzackstreifen aus der Vorderkante, faltet sich Stufe für Stufe. Setz- und Trittstufe einer Stufe teilen sich
  // ein Zeitfenster (−θ und +θ): die Trittstufen bleiben dadurch immer waagerecht, nichts taucht unter den Bogen,
  // und die Stufen rasten nacheinander ein (je 0,014 versetzt)
  {
    let p = top, z = TZF;
    const n = 2 * NS - 1;
    for (let i = 0; i < n; i++) {
      const riser = i % 2 === 0, len = riser ? RS : TS;
      const ang = riser ? -Q : Q;
      const nd = K.panel(p, [SX0, z], [SX1, z], [0, 1], T0 + .09 + Math.floor(i / 2) * .014, .05, ang, { own: R, over: .05 });
      K.rect(nd, 0, 0, SX1 - SX0, len, riser ? TERR : STONE);
      p = nd; z += len;
    }
  }
  // Lücke für den letzten Stein (eine Zelle im Läuferverband, vorn links neben der Treppe, vom Lieferschein aus gut zu sehen): dunkler gezeichnet, bis der Stein sich legt
  const LK = [16.4, 17.0, TZF - .3, TZF - .6];
  F.poly(top, [[LK[0], LK[2]], [LK[1], LK[2]], [LK[1], LK[3]], [LK[0], LK[3]]], c3("#cbcdd3"), .5, .0012, undefined, { nocut: true });

  // ---------- Deko auf der Terrasse: Pflanzkübel (dtPflanze aus schreibtisch.js), Tisch und zwei Stühle ----------
  // Kübel links und rechts an der Hauswand, Tisch mit Stühlen links vor den Türen, Treppe und Weg zur Tür bleiben frei
  const DT = .858;
  for (const [i, cx] of [[0, 14.75], [1, 19.1]]) dtPflanze(K, { top, cx, cz: TZB + .75, t: [DT + i * .004, .018], tl: [DT + .014 + i * .004, .04], tag: "kuebel" + i, tagL: "kuebelgruen" + i });
  F.part("moebel", DT, .05);
  const WOOD = c3("#d3d6db"), WOOD2 = c3("#e0e2e8"), CHR = c3("#cacdd2");
  {
    const tz = TZB + 1.8;
    const ped = blk(top, 15.25, 15.55, tz + .15, tz - .15, [.56], DT + .006, .014, WOOD, WOOD2);
    blk(ped, 14.95, 15.85, tz + .32, tz - .32, [.05], DT + .02, .014, WOOD2, WOOD2, ped.lvTop + 1);
    for (const [xa, xb, back] of [[14.45, 14.87, "l"], [16.0, 16.42, "r"]]) {
      const seat = blk(top, xa, xb, tz + .21, tz - .21, [.34], DT + .01, .014, CHR, WOOD2);
      const bx = back === "l" ? [xa, xa + .07] : [xb - .07, xb];
      blk(seat, bx[0], bx[1], tz + .21, tz - .21, [.3], DT + .024, .014, CHR, CHR, seat.lvTop + 1);
    }
  }
  // Der letzte Stein legt sich in die Lücke (Zeit B_STEIN)
  F.part("letzterstein", B_STEIN, .02);
  blk(top, LK[0] + .012, LK[1] - .012, LK[2] - .012, LK[3] + .012, [.025], B_STEIN, .02, STONE, STONE);

  // ---------- 2 Laptop und Handy auf dem Bogen vor der Wand: nur der echte Shop, ohne Text ----------
  F.part("laptop", .115, .05);
  const LX1 = LX0 + LW, LZB = LZF - LD;
  const base = slab(R, LX0, LX1, LZF, LZB, LH, .125, .035, { walls: "flr", col: LAPC, over: .03 });
  const KBD = .55;
  K.onFlat(base.top, K.decal(1000, Math.round(1000 * KBD / (LW - .2)), keyboard, LW - .2, KBD, .14), LX0 + LW / 2, LZB + .08 + KBD / 2, .004);
  const scr = K.panel(base.top, [LX0, LZB], [LX1, LZB], [0, -1], .14, .05, Q - .2, { over: .05 });
  K.rect(scr, 0, 0, LW, SHT, SCRC);
  // Bildschirm: Rahmen, Browserleiste, echte Produktseite (gerwing-produkt-ausschnitt.jpg)
  const SPX = 560;
  K.onPanel(scr, K.decal(Math.round(LW * SPX), Math.round(SHT * SPX), (x, W, H) => {
    const bz = .06 * SPX, ix = bz, iy = bz, iw = W - 2 * bz, ih = H - 2 * bz;
    x.fillStyle = "#2f2f33"; rr(x, 0, 0, W, H, .04 * SPX); x.fill();
    x.fillStyle = "#ffffff"; x.fillRect(ix, iy, iw, ih);
    const bar = .08 * SPX;
    x.fillStyle = "#efefef"; x.fillRect(ix, iy, iw, bar);
    x.fillStyle = "#d8d8d8"; rr(x, ix + iw * .25, iy + bar * .22, iw * .5, bar * .56, bar * .28); x.fill();
    const im = BMP.prod;
    if (im) {
      const dw = iw, dh = dw * im.height / im.width;
      x.drawImage(im, ix, iy + bar + .03 * SPX, dw, Math.min(dh, ih - bar - .03 * SPX));
    }
  }, LW, SHT, .155), LW / 2, SHT / 2, 1, null, .004);
  // Handy: steht daneben, steht senkrecht, mit der Bestellung (gerwing-bestellung.jpg, ganzes Bild in Displaybreite)
  const ph = K.panel(R, [PHX0, PHZ - .3], [PHX0 + PWD, PHZ - .3], [0, -1], .15, .045, Q, { over: .05 });
  K.rect(ph, 0, 0, PWD, PHG, SCRC);
  const PPX = 560;
  K.onPanel(ph, K.decal(Math.round(PWD * PPX), Math.round(PHG * PPX), (x, W, H) => {
    x.fillStyle = "#2f2f33"; rr(x, 0, 0, W, H, .06 * PPX); x.fill();
    const bz = .03 * PPX, ix = bz, iy = bz * 2.2, iw = W - 2 * bz, ih = H - iy - bz * 1.5;
    x.fillStyle = "#ffffff"; x.fillRect(ix, iy, iw, ih);
    // ganzes Bild (Abmessungen, Warenkorb, Muster) in voller Breite, mittig im Display: alle Knöpfe ganz
    const im = BMP.order;
    if (im) { const dh = iw * im.height / im.width; x.drawImage(im, ix, iy + Math.max(0, (ih - dh) / 2), iw, Math.min(dh, ih)); }
  }, PWD, PHG, .17), PWD / 2, PHG / 2, 1, null, .004);

  // ---------- 7 Steinstapel auf Palette mit Lattung (Gewicht): Lagen setzen sich nacheinander ----------
  F.part("palette", .40, .05);
  const pal = slab(R, AX0, AX1, AZ0, AZ1, AH, .41, .06, { walls: "flrb", col: PALC, over: .04 });
  const PXU = 420, LHT = (AH - AP) / NL;
  // unten die Palette mit Lattung und Klotzöffnungen (sofort), darüber Lage für Lage ganze Steine im Läuferverband
  const palFace = Wm => (x, W, H) => {
    const s = W / Wm;
    x.fillStyle = "#d0d2d8"; x.fillRect(0, 0, W, H);
    x.fillStyle = ink(.1); x.fillRect(0, 0, W, H * .22); x.fillRect(0, H * .8, W, H * .2);
    x.fillStyle = "#696a6d";
    const bw = W * .2, gaps = [[bw, W / 2 - bw / 2], [W / 2 + bw / 2, W - bw]];
    for (const [a, b] of gaps) x.fillRect(a, H * .24, b - a, H * .54);
    x.strokeStyle = ink(.45); x.lineWidth = Math.max(1.5, .01 * s); x.strokeRect(1, 1, W - 2, H - 2);
  };
  const rowFace = (Wm, cwm, k) => (x, W, H) => {
    const s = W / Wm, cw = cwm * s;
    x.fillStyle = k % 3 === 1 ? "#e1e3e9" : "#e6e9ee"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.36); x.lineWidth = Math.max(1.5, .012 * s);
    x.beginPath(); x.moveTo(0, 1); x.lineTo(W, 1); x.moveTo(0, H - 1); x.lineTo(W, H - 1); x.stroke();
    for (let X = (k % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, H); x.stroke(); }
  };
  const faceW = AX1 - AX0, faceD = AZ0 - AZ1;
  for (const [nd, Wm, cwm, mine] of [[pal.fr, faceW, .6], [pal.lf, faceD, .3], [pal.rt, faceD, .3]]) {
    K.onPanel(nd, K.decal(Math.round(Wm * PXU), Math.round(AP * PXU), palFace(Wm), Wm, AP, .45), Wm / 2, AP / 2, -1, null, .004);
    for (let k = 0; k < NL; k++) K.onPanel(nd, K.decal(Math.round(Wm * PXU), Math.round(LHT * PXU), rowFace(Wm, cwm, k), Wm, LHT, .46 + k * .0075, .012), Wm / 2, AP + (k + .5) * LHT, -1, null, .004);
  }
  // oberste Lage: Steinfugen
  K.onFlat(pal.top, K.decal(Math.round(faceW * PXU), Math.round(faceD * PXU), (x, W, H) => {
    const s = W / faceW, cw = .6 * s, rh = .3 * s;
    x.fillStyle = "#e6e9ee"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.2); x.lineWidth = Math.max(1.5, .01 * s);
    for (let y = rh; y < H - 2; y += rh) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    for (let r = 0; r * rh < H; r++) for (let X = (r % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, r * rh); x.lineTo(X, Math.min(H, (r + 1) * rh)); x.stroke(); }
  }, faceW, faceD, .52), (AX0 + AX1) / 2, (AZ0 + AZ1) / 2, .004);

  // ---------- 8 Lager: drei Händlerhallen hinter der Zufahrt, Weiche, rote Linie zum zuständigen Händler ----------
  F.part("haendler", .525, .06);
  // Rolltor (zu): Lamellen; offen: dunkle Öffnung mit hochgefahrenem Tor an der Oberkante
  const gateDraw = open => (Wm, Hm) => (x, W, H) => {
    const s = W / Wm, gw0 = 1.15 * s, gh = Math.min(.58 * s, H * .72), X = (W - gw0) / 2, Y = H - gh;
    if (open) {
      x.fillStyle = "#505153"; x.fillRect(X, Y, gw0, gh);
      x.fillStyle = "#d2d5da"; x.fillRect(X, Y, gw0, gh * .2);
      x.strokeStyle = ink(.26); x.lineWidth = Math.max(1, .008 * s); for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(X, Y + k * gh * .2 / 3); x.lineTo(X + gw0, Y + k * gh * .2 / 3); x.stroke(); }
    } else {
      x.fillStyle = "#d2d5da"; x.fillRect(X, Y, gw0, gh);
      x.strokeStyle = ink(.26); x.lineWidth = Math.max(1, .008 * s); for (let k = 1; k < 8; k++) { x.beginPath(); x.moveTo(X, Y + k * gh / 8); x.lineTo(X + gw0, Y + k * gh / 8); x.stroke(); }
    }
    x.strokeStyle = ink(.42); x.lineWidth = Math.max(1.5, .012 * s); x.strokeRect(X, Y, gw0, gh);
    // Fensterband unter der Dachkante
    x.fillStyle = ink(.12); x.fillRect(.18 * s, .08 * s, W - .36 * s, .1 * s);
  };
  const halls = HL.map(([x0, z0, w, d, h], i) => {
    const hl = slab(R, x0, x0 + w, z0, z0 - d, h, [.545, .535, .565][i], .05, { walls: "flrb", col: HALLC, top: ROOFC, over: .03 });
    const on = [.58, .57, .60][i], dc = K.decal(Math.round(w * 360), Math.round(h * 360), gateDraw(false)(w, h), w, h, on);
    K.onPanel(hl.fr, dc, w / 2, h / 2, -1, null, .004);
    if (i === 1) { dc.off = B_TOR; K.onPanel(hl.fr, K.decal(Math.round(w * 360), Math.round(h * 360), gateDraw(true)(w, h), w, h, B_TOR, .03), w / 2, h / 2, -1, null, .0075); }
    return hl;
  });
  // Weiche an der Lauflinie (Station Fracht): gerade Haarlinie hinauf zum Tor der ersten Halle (ihr Tor liegt genau über der Weiche), Haarlinie vor der
  // roten Linie entlang zum Tor der dritten Halle; rot (Faden) zum Tor der zuständigen zweiten. Keine Kreuzung mit dem Faden: er biegt erst hinter dem Tor ab.
  const g0 = gate(0), g1 = gate(1), g2 = gate(2), LV2 = ZL + .38;
  F.sketch(R, [
    [[WJ[0] + .1, ZL - .1], [g0, ZL - .48]], [[g0, ZL - .48], [g0, GZ]],
    [[WJ[0] + .12, ZL + .06], [WJ[0] + .5, LV2]], [[WJ[0] + .5, LV2], [g2 - .5, LV2]], [[g2 - .5, LV2], [g2, LV2 - .38]], [[g2, LV2 - .38], [g2, GZ]]
  ], .585, .045, { a: .55 });

  // ---------- Konstruktionsphase (seite/): Gerüst je Bauabschnitt kurz vor dem Hochklappen, Bleistiftspur auf den Flächen ----------
  // Steine und Wand ohne Gerüst: die Wand steht schon am Anfang auf (ihr Gerüst läge über der liegenden Überschrift), die 90 Steine
  // hätten ein Linienfeld über der Fläche ergeben; dort zeichnet die Kontur mit Eckmarken schon vor.
  F.geruest({ tags: ["laptop"], t0: .105, t1: .15, du: .03, a: .5 });
  F.geruest({ tags: ["palette"], t0: .395, t1: .44, du: .03, a: .5 });
  F.geruest({ tags: ["haendler"], t0: .52, t1: .57, du: .03, a: .5 });
  F.geruest({ tags: ["haus", "terrasse"], t0: .715, t1: .76, du: .03, a: .5 });
  F.spur({ tags: ["haus", "terrasse", "laptop", "palette", "haendler"], quiet: [house, scr, ph, pal.fr, pal.lf, pal.rt, base.top, ...halls.map(h => h.fr)], a: .3 });

  // ---------- Lesestelle: genau eine, die Wand ----------
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const S = {
    // Fließtext (e0) bestimmt die Schriftgröße; Gerwing, Kennzeile und Überschrift sind größer und passen mit in den Rahmen
    wand: { name: "wand", prints: [gw, mt, hd, t1, t2], e0: eB, px: pxD, pitch: 8, yaw: -6, sy: .04, sx: -.05, pxN: 18.5, fitN: .9, npitch: 10, nyaw: -4, nsy: .18, nsx: -.056 }
  };

  // ---------- Faden: Stücke zwischen den Stationen (Zeiten in b, linear), Übergänge gerade und tangential ----------
  // Eingang (Szenenkante, unverändert): von vorn bei x = −3,2; ein Viertelbogen führt auf die Lauflinie ZL. Dann gerade durch die Stationen Laptop, Fläche,
  // Steine, Palette, Weiche, Tor; hinter dem Tor ein Bogen nach hinten durch die Lücke zwischen zweiter und dritter Halle, ein großer Bogen zur Treppe
  // (Station Haus), dann gerade nach rechts am Haus vorbei und hinten hinaus (Ausgang unverändert bei x = 21,2 an der Hinterkante).
  const XR = 21.2, Y = .004;
  const P = (x, z) => V(x, Y, z);
  // Der Faden wird dicht (alle 0,1 Einheiten) auf dem Sollweg aus Geraden und Kurven mit gleitender Krümmung abgetastet; die Catmull-Rom-Kurve des Kerns
  // folgt ihm dann ohne Überschwingen (Krümmung stetig, keine Knicke an den Stützpunkten)
  const DS = .1;
  const lin = (x0, z0, x1, z1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / DS)); return Array.from({ length: n }, (_, i) => [x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n]); };
  const V3 = a => a.map(q => P(q[0], q[1]));
  const ST = [...SXS.map(x => [x, ZL]), SH6];
  // Eingang: gerade von der Szenenkante (x = −3,2, z = 3,2; der Anfang gehört dem Kern) nach hinten, dann eine Wende nach rechts auf die Lauflinie
  const TU0 = disp(-90, 90, L0), PRE = [...lin(-3.2, 3.2, -3.2, ZL - TU0[1]).slice(1), ...turn(-3.2, ZL - TU0[1], -90, 90, L0).pts, ...lin(-3.2 + TU0[0], ZL, -1.8, ZL)];
  // Tor → Haus: gerade zur Lücke, Wende nach hinten (zwischen zweiter und dritter Halle), gerade, Wende nach rechts, gerade zur Treppe
  const TU1 = disp(0, -90, L1), XA = GX - TU1[0];
  const A6 = [...V3(lin(ST[5][0], ZL, XA, ZL)), ...V3(turn(XA, ZL, 0, -90, L1).pts), ...V3(lin(GX, ZL + TU1[1], GX, GZ2)), ...V3(turn(GX, GZ2, -90, 90, L2).pts), ...V3(lin(GX + TU2[0], GZ2 + TU2[1], SH6[0], SH6[1])), P(SH6[0], SH6[1])];
  // Haus → Ausgang: gerade nach rechts, Wende nach hinten genau auf x = 21,2, gerade bis zur Hinterkante
  const TU3 = disp(0, -90, L3), XB = XR - TU3[0];
  const POST = [...V3(lin(SH6[0], SH6[1], XB, SH6[1])), ...V3(turn(XB, SH6[1], 0, -90, L3).pts), ...V3(lin(XR, SH6[1] + TU3[1], XR, ZBACK + .2)), P(XR, ZBACK + .2)];
  const legs = [];                                         // gerade Stücke zwischen den Stationen 0 … 5
  for (let i = 0; i < 5; i++) legs.push({ pts: [P(ST[i][0], ZL), P(ST[i + 1][0], ZL)], t0: HOLD[i][1], t1: HOLD[i + 1][0], lin: true });
  legs.push({ pts: A6, t0: HOLD[5][1], t1: HOLD[6][0], lin: true });
  const thread = {
    pts: [P(-1.8, ZL), P(ST[0][0], ZL)], t0: .215, t1: HOLD[0][0], lin: true,
    arms: legs,
    post: { pts: POST, t0: .91, t1: .985, lin: true }
  };

  // ---------- Markierungspunkte an den Stationen: genau auf dem Faden, erscheinen, wenn der Punkt ankommt ----------
  const dotDraw = (x, W, H) => {
    x.fillStyle = "rgba(255,255,255,.92)"; x.beginPath(); x.arc(W / 2, H / 2, W * .5, 0, 2 * PI); x.fill();
    x.fillStyle = "#d40235"; x.beginPath(); x.arc(W / 2, H / 2, W * .36, 0, 2 * PI); x.fill();
  };
  ST.forEach(([x, z], i) => K.onFlat(R, K.decal(96, 96, dotDraw, .3, .3, HOLD[i][0] - .006, .01), x, z, .005));

  // ---------- Der Lieferschein: Papierblatt auf Stützstreifen, steht am Laptop auf und reist mit dem Punkt ----------
  const SW = .84, SCW = 512, SCH = 720, SHT2 = SW * SCH / SCW;
  const ROWS = [
    { l: "Fläche", v: "24 m²" },
    { l: "ganze Steine", v: "672 Stück", n: "inkl. 5 % Verschnitt" },
    { l: "Gewicht", v: "3.494 kg", n: "672 × 5,2 kg" },
    { l: "Fracht nach PLZ 19395", v: "3 Paletten" },
    { l: "an Händler", chk: true },
    { l: "geliefert", chk: true }
  ];
  const SANS = '"Schibsted Grotesk"', SERIF = '"Newsreader"', REDC = "#d40235";
  const ease = q => 1 - Math.pow(1 - Math.min(1, Math.max(0, q)), 3);
  function slipDraw(x, W, H, ps) {
    x.clearRect(0, 0, W, H);
    x.textBaseline = "alphabetic"; x.textAlign = "left";
    x.fillStyle = ink(.92); x.font = `300 52px ${SERIF}`; x.fillText("Lieferschein", 34, 66);
    x.textAlign = "right"; x.fillStyle = MUTED; x.font = `500 19px ${SANS}`; x.fillText("Beispiel", W - 34, 62); x.textAlign = "left";
    x.strokeStyle = ink(.4); x.lineWidth = 2; x.setLineDash([]); x.beginPath(); x.moveTo(34, 90); x.lineTo(W - 34, 90); x.stroke();
    ROWS.forEach((r, i) => {
      const y0 = 118 + i * 100, p = ps[i];
      x.font = `500 24px ${SANS}`; x.fillStyle = ink(p > 0 ? .7 : .5); x.textAlign = "left"; x.fillText(r.l, 36, y0 + 23);
      // leere Zeile: gepunktete Linie, bis der Stempel kommt
      x.strokeStyle = ink(.3 * (1 - Math.min(1, p * 2.5))); x.lineWidth = 2; x.setLineDash([2, 7]);
      x.beginPath(); x.moveTo(36, y0 + 72); x.lineTo(W - 36, y0 + 72); x.stroke(); x.setLineDash([]);
      if (p <= 0) return;
      const q = ease(p / .5), sc = 1 + .5 * (1 - q), al = Math.min(1, p * 3.2), rot = (i % 2 ? 1 : -1) * (.02 + (1 - q) * .05);
      x.font = `500 38px ${SANS}`;
      const tw = r.chk ? 50 : x.measureText(r.v).width, bw = tw + 34, bh = 56, bx = 40, by = y0 + 28, cx = bx + bw / 2, cy = by + bh / 2;
      x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sc, sc); x.globalAlpha = al;
      const col = r.chk ? REDC : "rgb(48,48,51)";
      x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 3.2;
      x.beginPath(); x.roundRect(-bw / 2, -bh / 2, bw, bh, 9); x.stroke();
      if (r.chk) { x.lineWidth = 7; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath(); x.moveTo(-15, 1); x.lineTo(-4, 13); x.lineTo(17, -14); x.stroke(); }
      else { x.textAlign = "center"; x.fillText(r.v, 0, 13); }
      // Druckrand: nach dem Aufsetzen läuft ein feiner Ring aus (Farbe zieht ins Papier)
      if (p > .5) { const k = (p - .5) / .5; x.globalAlpha = .3 * (1 - k); x.lineWidth = 2; x.beginPath(); x.roundRect(-bw / 2 - 3 - k * 12, -bh / 2 - 3 - k * 12, bw + 6 + k * 24, bh + 6 + k * 24, 12 + k * 6); x.stroke(); }
      x.restore(); x.globalAlpha = 1;
      if (r.n) { x.font = `500 21px ${SANS}`; x.textAlign = "left"; x.fillStyle = ink(.56 * Math.min(1, Math.max(0, (p - .5) * 3))); x.fillText(r.n, bx + bw + 16, by + 36); }
    });
  }
  const slipCv = document.createElement("canvas"); slipCv.width = SCW; slipCv.height = SCH;
  const slipTex = new THREE.CanvasTexture(slipCv); slipTex.colorSpace = THREE.SRGBColorSpace; slipTex.anisotropy = 8; slipTex.minFilter = THREE.LinearMipmapLinearFilter;
  const slipMat = new THREE.MeshBasicMaterial({ map: slipTex, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const edgeOf = geo => new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .4, depthWrite: false }));
  const slip = new THREE.Group(), blatt = new THREE.Group();
  {
    const bg = new THREE.BoxGeometry(SW, SHT2, .018), bm = new THREE.Mesh(bg, K.paperMaterial("#f6f8fe")); bm.position.y = SHT2 / 2; bm.add(edgeOf(bg));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(SW, SHT2), slipMat); face.position.set(0, SHT2 / 2, .0105); face.renderOrder = 4; face.frustumCulled = false;
    blatt.add(bm, face); blatt.position.set(0, 0, -.16); blatt.rotation.x = -.1; slip.add(blatt);
    // Stütze: Streifen von der Oberkante schräg nach hinten zum Boden (wie die Tischkarte in abschluss.js)
    const top = new THREE.Vector3(0, (SHT2 - .12) * Math.cos(.1), -.16 - (SHT2 - .12) * Math.sin(.1) - .03), foot = new THREE.Vector3(0, 0, -.62);
    const len = top.distanceTo(foot), sg = new THREE.BoxGeometry(SW * .8, len, .014), st = new THREE.Mesh(sg, K.paperMaterial("#e2e5ea"));
    st.position.copy(top).add(foot).multiplyScalar(.5); st.rotation.x = Math.atan2(top.z - foot.z, top.y - foot.y); st.add(edgeOf(sg)); slip.add(st);
    // beim Bau weit unter dem Bogen geparkt (kern.js partBoxes nimmt sonst eine feste Box am Ursprung der Szene als Hindernis); die Animation setzt y = 0
    slip.position.y = -50; slip.visible = false; K.add(slip);
  }
  // Lage: Kopf des Fadens (Stücke mit denselben Punkten und Zeiten wie der Faden), danach bleibt der Lieferschein stehen
  const curveOf = pts => new THREE.CatmullRomCurve3(pts.map(p => p.clone()), false, "centripetal", .5);
  const track = [thread, ...legs].map(t => ({ c: curveOf(t.pts), b0: t.t0, b1: t.t1 }));
  const tmpP = new THREE.Vector3();
  const slipAt = b => {
    tmpP.copy(track[0].c.getPoint(0));
    for (const t of track) { if (b < t.b0) break; tmpP.copy(t.c.getPointAt(Math.min(1, Math.max(0, (b - t.b0) / Math.max(1e-4, t.b1 - t.b0))))); }
    return tmpP;
  };
  const B_BORN = HOLD[0][0] + .004, STAMP_B = [.352, .442, .532, .622, .712, .865], STAMP_D = .022;
  let slipKey = "";
  K.anim(b => {
    const born = K.sm((b - B_BORN) / .03);
    slip.visible = born > .001; if (!slip.visible) return;
    const p = slipAt(b); slip.position.set(p.x, 0, p.z); slip.scale.setScalar(Math.max(.001, born));
    const ps = STAMP_B.map(t0 => K.win(b, t0, STAMP_D));
    // Stempel drückt kurz auf: der Bogen weicht beim Aufsetzen ein wenig nach hinten
    const bump = Math.max(...ps.map(q => Math.sin(PI * K.win(q, .38, .3))));
    blatt.rotation.x = -.1 - .035 * bump;
    const key2 = ps.map(q => Math.round(q * 40)).join();
    if (key2 === slipKey) return; slipKey = key2;
    slipDraw(slipCv.getContext("2d"), SCW, SCH, ps); slipTex.needsUpdate = true;
  });

  // ---------- Kamera: eine ruhige Fahrt in Laufrichtung, dem Lieferschein folgend (leicht vorausschauend, nah und flach) ----------
  // An jeder Station zwei gleiche Stellungen (Ankunft, Abfahrt): die Kamera steht still, solange gestempelt wird. Der Gierwinkel bleibt auf
  // etwa −9° (Handy −6°): kein Pendeln, nur Fahrt nach rechts, gegen Ende nach hinten zum Haus, zuletzt ein ruhiger Rückzug.
  const stD = (i, dx = .55, y = .6) => V(ST[i][0] + dx, y, ST[i][1] - .15), stN = (i, dx = .1, y = .6) => V(ST[i][0] + dx, y, ST[i][1] - .15);
  const hold = (i, wIn, wHold, el, d, dN, o = {}) => [
    key(wIn, HOLD[i][0], stD(i, o.dx, o.y), el, -9, d, stN(i, o.dxN, o.y), el + 3, -6, dN),
    key(wHold, HOLD[i][1], stD(i, o.dx, o.y), el, -9, d, stN(i, o.dxN, o.y), el + 3, -6, dN)
  ];
  const KEYS = [
    // Start: Wand liegt flach im Bogen, Name, Kennzeile und Überschrift lesbar
    key(0, 0, V(-5.4, -.22, -1.5), 50, 0, 15.5, V(-6.3, -.4, -1.3), 52, 0, 21.0),
    // Wand steht auf und rastet ein, Kamera sinkt
    key(.8, .07, V(-7.2, 1.7, ZW), 24, -6, 11.0, V(-7.3, 2.6, ZW), 24, -4, 15.0),
    { w: .9, stop: S.wand },
    // Kamera gleitet vor der Wand nach rechts zum Laptop (Laptop und Handy klappen dabei auf)
    key(1.0, .165, V(-4.4, 1.0, ZFR - 1.2), 17, -8, 7.5, V(-4.0, 1.2, ZFR - 1.2), 20, -6, 8.5),
    // Zoom auf den Laptop mit dem Shop: die Bestellung, Quadratmeter rein
    key(1.2, .205, V(LX0 + LW / 2 + .15, .55, ZFR - .5), 17, -9, 4.2, V(LX0 + LW / 2, .6, ZFR - .5), 19, -6, 4.7),
    // Station 0: der Lieferschein steht am Laptop auf
    ...hold(0, 1.0, 20, 16, 5.4, 4.1, { dx: -1.4, dxN: .15 }),
    // Station Fläche (m²): Fläche mit Kontur, etwas höherer Blick
    ...hold(1, 1.3, 20, 17, 4.8, 3.9, { dx: .75, dxN: .12 }),
    // Station ganze Steine: die Reihen stehen
    ...hold(2, 1.3, 20, 17, 4.7, 3.9, { dx: .8, dxN: .12 }),
    // Station Palette: Gewicht
    ...hold(3, 1.3, 20, 17, 4.7, 3.9, { dx: .8, dxN: .12 }),
    // Station Weiche: Fracht nach PLZ
    ...hold(4, 1.3, 20, 17, 4.7, 3.9, { dx: .8, dxN: .12 }),
    // Station Tor der zuständigen Halle: an Händler (roter Haken)
    ...hold(5, 1.3, 20, 17, 4.7, 3.9, { dx: .8, dxN: .12 }),
    // Weg hinter dem Tor nach hinten durch die Lücke und zum Haus
    key(.9, .78, V(GX + .5, .55, GZ2 + .8), 17, -9, 4.8, V(GX + .1, .6, GZ2 + .8), 20, -6, 3.9),
    key(.8, .815, V(SH6[0] - .5, .6, SH6[1] + 1.0), 17, -9, 4.6, V(SH6[0] - .9, .6, SH6[1] + 1.0), 19, -6, 3.8),
    // Station Haus: Ankunft, Haken, der letzte Stein legt sich
    ...hold(6, .9, 20, 16, 5.2, 4.0, { dx: .8, dxN: .12, y: .75 }),
    // Rückzug beginnt, während der letzte Stein sich legt (die Kamera hebt sich über den Lieferschein), zuletzt Haus mit Terrasse, Deko und fertigem Pflaster als Schlussbild
    key(1.2, .935, V(SH6[0] - .6, .7, SH6[1] - 1.2), 22, -9, 8.0, V(SH6[0] - .8, .8, SH6[1] - 1.6), 24, -6, 10.5),
    key(1.7, 1, V(16.8, 1.35, -9.0), 26, -9, 17.0, V(16.8, 1.5, -8.8), 28, -6, 26.0)
  ];

  return {
    fov: 32, fovN: 44,
    track: 680,
    // Raster (seite/): zieht mit den ersten Bastellinien ein und ist weg, bevor der Text gelesen wird
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .055 },
    thread,
    // Eingang des Fadens (Szenenkoordinaten): von vorn, ein Viertelbogen führt auf die Lauflinie; Ausgang ist das Ende von thread.post (hinten rechts)
    faden: { in: [-3.2, 3.2], viaPre: PRE },
    stops: [S.wand],
    keys: KEYS
  };
}
