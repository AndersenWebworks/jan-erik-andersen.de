// Gerwing – Pflaster nach Fläche bestellen. Szene im Stil Bogen + Bastellinien (Faltkern falt.js, Gerüst kern.js).
// Umbau 22.10.2026 (zweite Fassung, Erik: „ist nicht die ganze abfolge falsch? … am anfang die bestellung shop, am ende haus mit terasse“):
//   Reihenfolge entlang der Kamerafahrt, von links nach rechts: 1 Wand mit dem ganzen Gerwing-Text (eine Lesestelle) → 2 Zoom auf den
//   Laptop mit dem echten Shop (die Bestellung; Handy daneben, beide stehen auf dem Bogen vor der Wand) → 3 Fläche, ganze Steine im
//   Läuferverband → Palette mit Steinstapel (Gewicht, Fracht) → Weiche zu drei Händlerhallen, Rolltor der zuständigen fährt hoch →
//   4 Ergebnis beim Kunden: Haus mit Glastüren und fertig gepflasterter Terrasse mit Treppe, hinten rechts hinter den Hallen.
//   Nichts neu gebaut: dieselben Bauteile, nur umgestellt (Laptop und Handy vom Terrassenboden auf den Bogen, Haus und Terrasse ans Ende,
//   Fläche und Palette nach rechts, Palette und Hallen auf eine Lieferlinie z = −2,1) und zeitlich neu gelegt.
// Der rote Faden läuft vom Laptop vor der Fläche und der Palette vorbei über die Weiche bis vor das Rolltor, dann vor den Hallen und
// rechts an ihnen vorbei (nie durch ein Gebäude) nach hinten und rechts am Haus vorbei hinaus.
// Das Haus: Hauswand mit Glastüren, Seitenwände und Dach klappen an ihr nach hinten; die Terrasse liegt niedrig und bündig davor.
// Aus Raumtext 2: Hauswand mit Glastüren, Text ganz auf einer Wand, Laptop und Handy mit echtem Shopbild, Steinstapel auf Palette.
// Aus Blatt: Palette mit Lattung und Klötzen, drei Händlerhallen mit Rolltoren, Weiche mit Haarlinien zu den beiden anderen und rot zum
// zuständigen Händler, Knoten an der Weiche. Mechanik, Kamera, Bastellinien, Konstruktionsphase: seite/ (Bogen, Faltkern).
// Keine Zahlen auf Bauteilen, keine erfundenen Inhalte, keine Texte außer dem Gerwing-Text auf der Wand.
// Drucke und Abdrücke liegen mit 4 bis 6 mm Abstand über ihrer Fläche (vorher 2 mm, bei Abstand 15 bis 27 nahe der Tiefenauflösung).
import { keyboard } from "./zeichnungen.js";

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
  const WALLC = c3("#f3efe6"), HOUSEC = c3("#f1ede4"), STONE = COL.STONE, STONE2 = COL.STONE2, OLD = COL.OLD;
  const TERR = c3("#e6dfd1"), TERRTOP = c3("#efeae0"), PALC = c3("#e9e2d3"), HALLC = c3("#eeece7"), ROOFC = c3("#dcd8cf");
  const LAPC = c3("#e4e1db"), SCRC = c3("#3a3a3e"), RED = COL.RED;
  const MUTED = "#66666a";

  // Kamerahilfe: Ziel, Blickhöhe (Grad), Gier (Grad, + = Kamera rechts), Abstand
  const sph = (t, el, az, d) => { const e = el * PI / 180, a = az * PI / 180; return V(t.x + d * Math.cos(e) * Math.sin(a), t.y + d * Math.sin(e), t.z + d * Math.cos(e) * Math.cos(a)); };
  const key = (w, b, tD, elD, azD, dD, tN, elN, azN, dN) => ({ w, b, tgt: tD, cam: sph(tD, elD, azD, dD), tgtN: tN, camN: sph(tN, elN, azN, dN) });
  const sans = (lines, e, on, o = {}) => K.print(lines, e, on, o);
  // Druck links bündig an u0 (Fläche K.panel): Mitte des Drucks
  const uL = (pr, u0) => u0 + pr.w / 2 - pr.t.padX * pr.e;

  // ---------- Text der Wand: ein Träger, ganze Sätze ----------
  // Desktop 20 px Fließtext bei e .14; Handy 16 … 18 px bei e .2, Umbrüche enger und Wand höher
  const eB = N ? .2 : .14, M0 = N ? .4 : .5;
  const gw = K.print(["Gerwing"], N ? .64 : .78, -1, { font: "serif", lh: 1 });
  const mt = K.print([META], N ? .15 : .12, -1, { track: .03, col: MUTED });
  const hd = K.print(N ? ["Pflaster nach Fläche", "bestellen"] : [TITEL], N ? .36 : .3, -1, { font: "serif", lh: 1.08 });
  const t1 = sans(N ? P1N : P1, eB, .085, { lh: 1.36, fade: .05 });
  const t2 = sans(N ? P2N : P2, eB, .098, { lh: 1.36, fade: .05 });
  // von oben nach unten gestapelt (Abstand vor dem Druck), daraus die Höhe der Wand
  const stack = [[gw, 0], [mt, N ? -.1 : -.13], [hd, .02], [t1, .1], [t2, .14]];
  const MT = .36, MB = .44;
  let ys = 0; const yc = stack.map(([pr, g]) => { ys += g; const c = ys + pr.h / 2; ys += pr.h; return c; });

  // ---------- Lage (Bogen x nach rechts, z zum Betrachter) ----------
  // Giebelwand mit dem Text links; davor rechts daneben Laptop und Handy; dann Fläche, Palette, Weiche, Hallen; hinten rechts das Haus
  const WX0 = N ? -9.4 : -9.8, WW = N ? 4.2 : 5.2, ZW = -5.2, HW = Math.round((MT + ys + MB) * 20) / 20;
  // Pflasterfläche: Steine 0,6 × 0,3 (Verhältnis 25 × 15 cm wie im Shop), Kontur eine halbe Reihe kürzer als die ganzen Steine:
  // die letzte Reihe ragt halb über die Kontur. Desktop 9 Steine × 10 Reihen, Handy schmaler und tiefer (6 × 14)
  const CW = .6, RH = .3, NC = N ? 6 : 9, NR = N ? 14 : 10, PX0 = -.2, PX1 = PX0 + NC * CW, PZB = N ? -4.8 : -4.4, PZF = PZB + (NR - .5) * RH, SH = .12, G = .012;
  const LAN = PZF + .85;                                  // Bahn des Fadens vor der Fläche
  // Haus mit Terrasse hinten rechts (Ergebnis); die Hauswand steht auf der Linie ZH und ist die Rückwand der Terrasse
  const ZH = -10.4, TX0 = 14.3, TX1 = 19.5, TZB = ZH, TZF = ZH + 3.2, TH = .24, SX0 = TX0 + 2.5, SX1 = TX0 + 4.1, NS = 2, RS = TH / NS, TS = .36;
  const HX0 = TX0 - 2.2, HX1 = TX1 + .5, HHS = 3.35, HD = 1.8;     // HD: Tiefe der Seitenwände und des Dachs hinter der Hauswand
  // Laptop und Handy stehen auf dem Bogen rechts neben der Wand (vor der Wand ausgerichtet, Blick nach vorn)
  const LW = N ? 1.5 : 1.7, LD = 1.0, LH = .07, SHT = N ? .93 : 1.05, LX0 = -3.55, LZF = -3.2;
  const PWD = .5, PHG = .94, PHX0 = -1.65, PHZ = -3.2;
  // Palette mit Steinstapel; ihre Vorderkante steht auf der Lieferlinie z = −2,1 wie die Fronten der Hallen
  const AX0 = 6.7, AX1 = 9.1, AZ0 = -2.1, AZ1 = -3.5, AH = 1.42, AP = .3, NL = 8;
  // Lager: Hallen [x0, z0 (Front), Breite, Tiefe, Höhe]; zuständig ist HL[1]; zwischen zweiter und dritter Halle bleibt 1,0 für den Faden
  const HL = [[11.9, -2.1, 2.2, 1.2, .8], [14.7, -2.1, 2.4, 1.2, .95], [18.1, -2.1, 2.2, 1.2, .8]];
  const gate = i => HL[i][0] + HL[i][2] / 2, GZ = HL[0][1];
  const WJ = [AX1 + 1.8, -1.0], LA = -1.38, LC = -.62;
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
  F.sketch(R, cm, .22, .045, { a: .62 });
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
  for (let r = 0; r < NR; r++) {
    F.part("reihe" + r, .27 + r * .07 / (NR - 1), .028);
    const za = PZB + r * RH, zf = za + RH, odd = r % 2 === 1;
    const xs = [PX0]; let x = PX0 + (odd ? CW / 2 : CW);
    while (x < PX1 - 1e-6) { xs.push(x); x += CW; }
    xs.push(PX1);
    for (let k = 0; k < xs.length - 1; k++) {
      const xa = xs[k], xb = xs[k + 1];
      const walls = (r === 0 ? "b" : "") + (r === NR - 1 ? "f" : "") + (k === 0 ? "l" : "") + (k === xs.length - 2 ? "r" : "");
      const col = (r * 3 + k) % 5 === 0 ? OLD : (r * 7 + k) % 4 === 0 ? STONE2 : STONE;
      slab(R, xa + G / 2, xb - G / 2, zf - G / 2, za + G / 2, SH, .335 + r * .1 / (NR - 1) + (xa - PX0) * .0013, .05, { walls, col, over: .06 });
    }
  }

  // ---------- 4 Hauswand mit Glastüren (Rückwand der Terrasse), am Ende hinten rechts ----------
  F.part("haus", .795, .05);
  const HWL = HX1 - HX0, house = K.panel(R, [HX0, ZH], [HX1, ZH], [0, -1], .825, .07, Q, { over: .04 });
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
  };
  // Seitenwände und Dach hängen an der Hauswand und klappen nach hinten (Unterseite): das Haus bekommt Tiefe und Dachkante
  {
    const sd = { own: R, over: .03 };
    K.rect(K.panel(house, [HX0, ZH], [HX0, ZH - HHS], [-1, 0], .88, .05, -Q, sd), 0, 0, HHS, HD, HOUSEC);
    K.rect(K.panel(house, [HX1, ZH], [HX1, ZH - HHS], [1, 0], .88, .05, -Q, sd), 0, 0, HHS, HD, HOUSEC);
    K.rect(K.panel(house, [HX0, ZH - HHS], [HX1, ZH - HHS], [0, -1], .9, .05, -Q, sd), 0, 0, HWL, HD, ROOFC);
  }
  K.onPanel(house, K.decal(Math.round(HWL * 280), Math.round(HHS * 280), houseFace, HWL, HHS, .835), HWL / 2, HHS / 2, 1, null, .005);

  // ---------- 5 Terrasse mit Platten und Treppe (vor der Hauswand) ----------
  const T0 = .8;
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
  F.part("palette", .51, .05);
  const pal = slab(R, AX0, AX1, AZ0, AZ1, AH, .535, .075, { walls: "flrb", col: PALC, over: .04 });
  const PXU = 420, LHT = (AH - AP) / NL;
  // unten die Palette mit Lattung und Klotzöffnungen (sofort), darüber Lage für Lage ganze Steine im Läuferverband
  const palFace = Wm => (x, W, H) => {
    const s = W / Wm;
    x.fillStyle = "#ddd2bd"; x.fillRect(0, 0, W, H);
    x.fillStyle = ink(.1); x.fillRect(0, 0, W, H * .22); x.fillRect(0, H * .8, W, H * .2);
    x.fillStyle = "#6f6a62";
    const bw = W * .2, gaps = [[bw, W / 2 - bw / 2], [W / 2 + bw / 2, W - bw]];
    for (const [a, b] of gaps) x.fillRect(a, H * .24, b - a, H * .54);
    x.strokeStyle = ink(.45); x.lineWidth = Math.max(1.5, .01 * s); x.strokeRect(1, 1, W - 2, H - 2);
  };
  const rowFace = (Wm, cwm, k) => (x, W, H) => {
    const s = W / Wm, cw = cwm * s;
    x.fillStyle = k % 3 === 1 ? "#ebe3d4" : "#efe9dc"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.36); x.lineWidth = Math.max(1.5, .012 * s);
    x.beginPath(); x.moveTo(0, 1); x.lineTo(W, 1); x.moveTo(0, H - 1); x.lineTo(W, H - 1); x.stroke();
    for (let X = (k % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, H); x.stroke(); }
  };
  const faceW = AX1 - AX0, faceD = AZ0 - AZ1;
  for (const [nd, Wm, cwm, mine] of [[pal.fr, faceW, .6], [pal.lf, faceD, .3], [pal.rt, faceD, .3]]) {
    K.onPanel(nd, K.decal(Math.round(Wm * PXU), Math.round(AP * PXU), palFace(Wm), Wm, AP, .575), Wm / 2, AP / 2, -1, null, .004);
    for (let k = 0; k < NL; k++) K.onPanel(nd, K.decal(Math.round(Wm * PXU), Math.round(LHT * PXU), rowFace(Wm, cwm, k), Wm, LHT, .585 + k * .0085, .012), Wm / 2, AP + (k + .5) * LHT, -1, null, .004);
  }
  // oberste Lage: Steinfugen
  K.onFlat(pal.top, K.decal(Math.round(faceW * PXU), Math.round(faceD * PXU), (x, W, H) => {
    const s = W / faceW, cw = .6 * s, rh = .3 * s;
    x.fillStyle = "#efe9dc"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.2); x.lineWidth = Math.max(1.5, .01 * s);
    for (let y = rh; y < H - 2; y += rh) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    for (let r = 0; r * rh < H; r++) for (let X = (r % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, r * rh); x.lineTo(X, Math.min(H, (r + 1) * rh)); x.stroke(); }
  }, faceW, faceD, .66), (AX0 + AX1) / 2, (AZ0 + AZ1) / 2, .004);

  // ---------- 8 Lager: drei Händlerhallen hinter der Zufahrt, Weiche, rote Linie zum zuständigen Händler ----------
  F.part("haendler", .665, .06);
  // Rolltor (zu): Lamellen; offen: dunkle Öffnung mit hochgefahrenem Tor an der Oberkante
  const gateDraw = open => (Wm, Hm) => (x, W, H) => {
    const s = W / Wm, gw0 = 1.15 * s, gh = Math.min(.58 * s, H * .72), X = (W - gw0) / 2, Y = H - gh;
    if (open) {
      x.fillStyle = "#55514a"; x.fillRect(X, Y, gw0, gh);
      x.fillStyle = "#d9d5cc"; x.fillRect(X, Y, gw0, gh * .2);
      x.strokeStyle = ink(.26); x.lineWidth = Math.max(1, .008 * s); for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(X, Y + k * gh * .2 / 3); x.lineTo(X + gw0, Y + k * gh * .2 / 3); x.stroke(); }
    } else {
      x.fillStyle = "#d9d5cc"; x.fillRect(X, Y, gw0, gh);
      x.strokeStyle = ink(.26); x.lineWidth = Math.max(1, .008 * s); for (let k = 1; k < 8; k++) { x.beginPath(); x.moveTo(X, Y + k * gh / 8); x.lineTo(X + gw0, Y + k * gh / 8); x.stroke(); }
    }
    x.strokeStyle = ink(.42); x.lineWidth = Math.max(1.5, .012 * s); x.strokeRect(X, Y, gw0, gh);
    // Fensterband unter der Dachkante
    x.fillStyle = ink(.12); x.fillRect(.18 * s, .08 * s, W - .36 * s, .1 * s);
  };
  const halls = HL.map(([x0, z0, w, d, h], i) => {
    const hl = slab(R, x0, x0 + w, z0, z0 - d, h, [.69, .68, .71][i], .065, { walls: "flrb", col: HALLC, top: ROOFC, over: .03 });
    const on = [.725, .715, .745][i], dc = K.decal(Math.round(w * 360), Math.round(h * 360), gateDraw(false)(w, h), w, h, on);
    K.onPanel(hl.fr, dc, w / 2, h / 2, -1, null, .004);
    if (i === 1) { dc.off = .8; K.onPanel(hl.fr, K.decal(Math.round(w * 360), Math.round(h * 360), gateDraw(true)(w, h), w, h, .8, .03), w / 2, h / 2, -1, null, .0075); }
    return hl;
  });
  // Zufahrt: Haarlinien zu den beiden anderen Händlern (hinterm Rolltor), rot (Faden) zum zuständigen
  const g0 = gate(0), g1 = gate(1), g2 = gate(2);
  F.sketch(R, [
    [WJ, [WJ[0] + .5, LA]], [[WJ[0] + .5, LA], [g0 - .35, LA]], [[g0 - .35, LA], [g0, LA + .1]], [[g0, LA + .1], [g0, GZ]],
    [WJ, [WJ[0] + .5, LC]], [[WJ[0] + .5, LC], [g2 - .35, LC]], [[g2 - .35, LC], [g2, LC - .1]], [[g2, LC - .1], [g2, GZ + .2]], [[g2, GZ + .2], [g2, GZ]]
  ], .70, .045, { a: .55 });
  const knot = F.lift(R, 0, .68, .01);
  F.poly(knot, Array.from({ length: 16 }, (_, i) => [WJ[0] + Math.cos(i / 16 * 2 * PI) * .09, WJ[1] + Math.sin(i / 16 * 2 * PI) * .09]), RED, 0, .006);

  // ---------- Konstruktionsphase (seite/): Gerüst je Bauabschnitt kurz vor dem Hochklappen, Bleistiftspur auf den Flächen ----------
  // Steine und Wand ohne Gerüst: die Wand steht schon am Anfang auf (ihr Gerüst läge über der liegenden Überschrift), die 90 Steine
  // hätten ein Linienfeld über der Fläche ergeben; dort zeichnet die Kontur mit Eckmarken schon vor.
  F.geruest({ tags: ["laptop"], t0: .105, t1: .15, du: .03, a: .5 });
  F.geruest({ tags: ["palette"], t0: .505, t1: .55, du: .03, a: .5 });
  F.geruest({ tags: ["haendler"], t0: .655, t1: .705, du: .03, a: .5 });
  F.geruest({ tags: ["haus", "terrasse"], t0: .79, t1: .845, du: .03, a: .5 });
  F.spur({ tags: ["haus", "terrasse", "laptop", "palette", "haendler"], quiet: [house, scr, ph, pal.fr, pal.lf, pal.rt, base.top, ...halls.map(h => h.fr)], a: .3 });

  // ---------- Lesestelle: genau eine, die Wand ----------
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const S = {
    // Fließtext (e0) bestimmt die Schriftgröße; Gerwing, Kennzeile und Überschrift sind größer und passen mit in den Rahmen
    wand: { name: "wand", prints: [gw, mt, hd, t1, t2], e0: eB, px: pxD, pitch: 8, yaw: -6, sy: .04, sx: -.05, pxN: 18.5, fitN: .9, npitch: 10, nyaw: -4, nsy: .18, nsx: -.056 }
  };

  // Rote Linie (Zeiten in b): Laptop → vor der Fläche und der Palette vorbei (own, .22 … .60) → über die Weiche vor das Rolltor der zuständigen Halle
  // (arms, .62 … .80) → vor den Hallenfronten weiter nach rechts an der dritten Halle vorbei und hinten am Haus vorbei hinaus (post, .81 … .93).
  // Der Faden läuft nirgends durch ein Gebäude: vor den Fronten, rechts neben den Hallen und neben dem Haus; die Hauswand verdeckt ihn dahinter.
  const XR = 21.2, Y = .004;
  const thread = {
    pts: [V(-2.7, Y, -2.75), V(-2.0, Y, -1.95), V(-1.2, Y, LAN - .1), V(PX0 + .1, Y, LAN), V(PX1 + .2, Y, LAN), V(AX0 + .6, Y, -1.35), V(AX0 + 1.2, Y, -1.45)], t0: .22, t1: .60,
    arms: [{ pts: [V(AX0 + 1.2, Y, -1.45), V(AX1 + .3, Y, -1.25), V(WJ[0], Y, WJ[1]), V(12.4, Y, WJ[1]), V(g1 - .55, Y, WJ[1]), V(g1 - .12, Y, -1.3), V(g1, Y, -1.7), V(g1, Y, GZ + .2)], t0: .62, t1: .80 }],
    post: { pts: [V(g1, Y, GZ + .2), V(g1 + .45, Y, -1.45), V(g1 + 2.2, Y, -1.45), V(g1 + 4.2, Y, -1.45), V(XR - .4, Y, -1.5), V(XR, Y, -2.2), V(XR, Y, -4.5), V(XR, Y, TZB + 1.5), V(XR, Y, ZBACK + 2.0), V(XR, Y, ZBACK + .2)], t0: .81, t1: .93 }
  };

  // ---------- Kamera (Drehbuch: DREHBUCH.md). Eine stetige Bahn, links nach rechts: Wand → Laptop-Zoom → Fläche → Palette → Weiche → Halle → Haus ----------
  // Zwischen zwei Schlüsseln ändern sich Blickhöhe höchstens um rund 12° und Gier um rund 6°; die Zielpunkte wandern (Fahrt), die Kamera dreht nicht
  return {
    fov: 32, fovN: 44,
    track: 680,
    // Raster (seite/): zieht mit den ersten Bastellinien ein und ist weg, bevor der Text gelesen wird
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .055 },
    thread,
    // Eingang des Fadens (Szenenkoordinaten): von vorn zum Laptop; Ausgang ist das Ende von thread.post (hinten rechts)
    faden: { in: [-3.2, 3.2], viaPre: [[-3.2, -1.5]] },
    stops: [S.wand],
    keys: [
      // Start: Wand liegt flach im Bogen, Name, Kennzeile und Überschrift lesbar
      key(0, 0, V(-7.2, -.22, ZW - HW / 2 + .1), 52, 0, 11.3, V(-7.3, -.4, ZW - HW / 2 + .1), 54, 0, 15.8),
      // Wand steht auf und rastet ein, Kamera sinkt
      key(.8, .07, V(-7.2, 1.7, ZW), 24, -6, 11.0, V(-7.3, 2.6, ZW), 24, -4, 15.0),
      { w: .9, stop: S.wand },
      // Kamera gleitet vor der Wand nach rechts, näher heran (Laptop und Handy klappen dabei auf)
      key(1.0, .165, V(-5.0, 1.3, -3.8), 20, -8, 8.5, V(-5.0, 1.4, -3.6), 20, -6, 11.0),
      // Zoom auf den Laptop mit dem Shop und dem Handy daneben: die Bestellung, Quadratmeter rein. Höhere Blickhöhe: Bogen füllt das Bild
      key(1.3, .22, V(-2.35, .3, -3.95), 28, -10, 4.3, V(-2.35, .4, -3.9), 26, -8, 8.0),
      // weiter am Laptop und Handy vorbei, zieht sich auf
      key(1.0, .27, V(-1.3, .5, -3.8), 26, -8, 6.0, V(-1.3, .6, -3.6), 26, -8, 8.5),
      // Fläche: Überblick, Steine heben sich Reihe für Reihe
      key(1.5, .34, V(.6, .3, -3.0), 32, -10, 10.5, V(.2, .3, -2.8), 36, -8, 12.5),
      key(1.4, .44, V(4.2, .3, -2.9), 32, -10, 10.5, V(3.0, .3, -2.6), 34, -8, 12.5),
      // Palette mit Steinstapel (fertig bei b .66)
      key(1.5, .665, V(7.9, .8, -2.8), 26, -14, 9.0, V(7.9, .8, -2.8), 28, -12, 8.6),
      // Weiche und Hallen: die rote Linie läuft nach rechts zu den Händlern
      key(1.0, .715, V(10.0, .6, -2.5), 25, -12, 8.8, V(9.8, .6, -2.5), 26, -10, 9.6),
      key(1.2, .76, V(12.6, .4, -1.9), 26, -12, 9.5, V(12.0, .4, -1.9), 26, -10, 10.5),
      // Rolltor der zuständigen Halle fährt hoch, der Faden endet davor
      key(1.1, .81, V(15.0, .5, -2.2), 26, -10, 8.5, V(15.2, .5, -2.1), 26, -8, 10.0),
      // Kamera hebt sich über die Hallen, das Haus steht auf, Seitenwände und Dach klappen nach hinten
      key(1.3, .87, V(15.5, 1.2, -8.6), 30, -6, 14.0, V(15.8, 1.3, -7.6), 30, -4, 20.0),
      // Endbild: Haus mit Glastüren, Dach und fertiger Terrasse mittig und frei, die Hallen unten im Bild
      key(1.6, 1, V(17.0, 1.2, -10.3), 33, -3, 17.5, V(17.0, 1.5, -9.2), 32, -2, 27.0)
    ]
  };
}
