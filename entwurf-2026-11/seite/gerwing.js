// Gerwing – Pflaster nach Fläche bestellen. Szene im Stil Bogen + Bastellinien (Faltkern falt.js, Gerüst kern.js).
// Umbau 22.10.2026 nach Eriks Entscheidung („Seite plus Haus aus Raumtext 2, Ablaufweg eher wie Blatt, Kamera wie seite“):
//   EINE Lesestelle: der ganze Gerwing-Text steht auf einer großen Wand (Giebelwand des Hauses links) – „Gerwing“ in großen
//   Serif-Lettern, Kennzeile „WooCommerce · seit 2023“, Überschrift „Pflaster nach Fläche bestellen“, beide Absätze wörtlich.
//   Danach keine Lesehalte mehr; die Kamera (Augenhöhe bis 20–45°, keine Draufsicht) fährt gleichmäßig durch den Weg der Bestellung:
//   Fläche → ganze Steine im Läuferverband (Reihe für Reihe, letzte Reihe ragt über die Kontur) → Gartenterrasse am Haus
//   (Hauswand mit Glastüren als Rückwand, Treppe, Laptop und Handy mit dem echten Shop, ohne Text) → Palette mit Steinstapel
//   (Gewicht; Lagen setzen sich nacheinander) → durch das Lager: Zufahrt mit Weiche, drei Händlerhallen, die rote Linie läuft
//   über die Weiche in die zuständige Halle (Rolltor fährt hoch) und hinten wieder hinaus.
// Aus Raumtext 2: Hauswand mit Glastüren hinter der Terrasse (Hauswinkel aus Giebelwand mit Text und Hauswand), Text ganz auf einer
// Wand, Laptop und Handy mit echtem Shopbild auf der Terrasse, Steinstapel auf Palette. Aus Blatt: Palette mit Lattung und Klötzen,
// Steinstapel auf der Palette, drei Händlerhallen mit Rolltoren, Weiche mit Haarlinien zu den beiden anderen und rot zum
// zuständigen Händler, Knoten an der Weiche. Mechanik, Kamera, Bastellinien, Konstruktionsphase: seite/ (Bogen, Faltkern).
// Keine Zahlen auf Bauteilen, keine erfundenen Inhalte, keine Texte außer dem Gerwing-Text auf der Wand.
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
  const t1 = sans(N ? P1N : P1, eB, .085, { lh: 1.36 });
  const t2 = sans(N ? P2N : P2, eB, .098, { lh: 1.36 });
  // von oben nach unten gestapelt (Abstand vor dem Druck), daraus die Höhe der Wand
  const stack = [[gw, 0], [mt, N ? -.1 : -.13], [hd, .02], [t1, .1], [t2, .14]];
  const MT = .36, MB = .44;
  let ys = 0; const yc = stack.map(([pr, g]) => { ys += g; const c = ys + pr.h / 2; ys += pr.h; return c; });

  // ---------- Lage (Bogen x nach rechts, z zum Betrachter) ----------
  // Giebelwand mit dem Text; rechts davon schließt die Hauswand mit den Glastüren an (Hauswinkel aus Raumtext 2)
  const WX0 = N ? -9.4 : -9.8, WW = N ? 4.2 : 5.2, ZW = -5.2, HW = Math.round((MT + ys + MB) * 20) / 20;
  const HX0 = WX0 + WW;
  // Pflasterfläche: Steine 0,6 × 0,3 (Verhältnis 25 × 15 cm wie im Shop), Kontur eine halbe Reihe kürzer als die ganzen Steine:
  // die letzte Reihe ragt halb über die Kontur. Desktop 9 Steine × 10 Reihen, Handy schmaler und tiefer (6 × 14)
  const CW = .6, RH = .3, NC = N ? 6 : 9, NR = N ? 14 : 10, PX0 = -9.4, PX1 = PX0 + NC * CW, PZB = -4.4, PZF = PZB + (NR - .5) * RH, SH = .12, G = .012;
  // Terrasse am Haus mit Treppe; die Hauswand steht auf der Linie ZW und ist die Rückwand der Terrasse
  const TX0 = -2.4, TX1 = 2.8, TZB = ZW, TZF = -2.0, TH = .9, SX0 = .1, SX1 = 1.7, NS = 4, RS = TH / NS, TS = .36;
  const HX1 = TX1 + .5, HHS = 3.35;
  // Laptop und Handy auf der Terrasse (links der Treppe)
  const LW = N ? 1.5 : 1.7, LD = 1.0, LH = .07, SHT = N ? .93 : 1.05, LX0 = -1.95, LZF = -2.85;
  const PWD = .5, PHG = .94, PHX0 = .95, PHZ = -3.2;
  // Palette mit Steinstapel
  const AX0 = 5.4, AX1 = 7.8, AZ0 = -2.2, AZ1 = -3.6, AH = 1.42, AP = .3, NL = 8;
  // Lager: Zufahrt hinter den Gleisen der Fracht (z = −1), Händlerhallen dahinter [x0, z0 (Front), Breite, Tiefe, Höhe]; zuständig ist HL[1]
  const HL = [[10.5, -2.1, 2.2, 1.2, .8], [13.3, -2.1, 2.4, 1.2, .95], [16.3, -2.1, 2.2, 1.2, .8]];
  const gate = i => HL[i][0] + HL[i][2] / 2, GZ = HL[0][1];
  const WJ = [9.5, -1.0], LA = -1.38, LC = -.62;

  // ---------- Bogen ----------
  K.sheet(-11.6, 19.6, ZW - HW - .4, 3.4);

  // ---------- 1 Wand mit Gerwing-Text: liegt flach (Name, Kennzeile, Überschrift lesbar), steht auf, rastet ein ----------
  F.part("wand", 0, .03);
  const wall = K.panel(R, [WX0, ZW], [WX0 + WW, ZW], [0, -1], .03, .065, Q, { over: .04 });
  K.rect(wall, 0, 0, WW, HW, WALLC);
  stack.forEach(([pr], i) => {
    const off = pr === gw ? -.05 : pr === hd ? -.03 : 0;
    K.onPanel(wall, pr, uL(pr, M0 + off), HW - MT - yc[i], 1);
  });

  // ---------- 2 Fläche: Kontur mit Eckmarken (Quadratmeter) ----------
  const tick = .32, cm = [];
  const ln = (a, b) => cm.push([a, b]);
  ln([PX0, PZB], [PX1, PZB]); ln([PX1, PZB], [PX1, PZF]); ln([PX1, PZF], [PX0, PZF]); ln([PX0, PZF], [PX0, PZB]);
  // Eckmarken außen, vorn deutlich vor den Steinwänden, damit die überstehende Reihe sichtbar über die Kontur ragt
  for (const [x, z, dx, dz] of [[PX0, PZB, -1, -1], [PX1, PZB, 1, -1], [PX0, PZF, -1, 1], [PX1, PZF, 1, 1]]) {
    ln([x + dx * .18, z], [x + dx * (.18 + tick), z]); ln([x, z + dz * .18], [x, z + dz * (.18 + tick)]);
  }
  F.sketch(R, cm, .135, .045, { a: .62 });
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
    F.part("reihe" + r, .15 + r * .06 / (NR - 1), .028);
    const za = PZB + r * RH, zf = za + RH, odd = r % 2 === 1;
    const xs = [PX0]; let x = PX0 + (odd ? CW / 2 : CW);
    while (x < PX1 - 1e-6) { xs.push(x); x += CW; }
    xs.push(PX1);
    for (let k = 0; k < xs.length - 1; k++) {
      const xa = xs[k], xb = xs[k + 1];
      const walls = (r === 0 ? "b" : "") + (r === NR - 1 ? "f" : "") + (k === 0 ? "l" : "") + (k === xs.length - 2 ? "r" : "");
      const col = (r * 3 + k) % 5 === 0 ? OLD : (r * 7 + k) % 4 === 0 ? STONE2 : STONE;
      slab(R, xa + G / 2, xb - G / 2, zf - G / 2, za + G / 2, SH, .2 + r * .1 / (NR - 1) + (xa - PX0) * .0013, .05, { walls, col, over: .06 });
    }
  }

  // ---------- 4 Hauswand mit Glastüren (Rückwand der Terrasse) ----------
  F.part("haus", .335, .05);
  const HWL = HX1 - HX0, house = K.panel(R, [HX0, ZW], [HX1, ZW], [0, -1], .365, .07, Q, { over: .04 });
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
  K.onPanel(house, K.decal(Math.round(HWL * 280), Math.round(HHS * 280), houseFace, HWL, HHS, .375), HWL / 2, HHS / 2, 1);

  // ---------- 5 Terrasse mit Platten und Treppe (vor der Hauswand) ----------
  const T0 = .34;
  F.part("terrasse", T0 - .005, .06);
  const top = F.lift(R, TH, T0, .07, { over: .02 });
  F.poly(top, [[TX0, TZF], [SX0, TZF], [SX1, TZF], [TX1, TZF], [TX1, TZB], [TX0, TZB]], TERRTOP, .5);
  // Terrassenplatten 0,6 × 0,6 als Fugen
  for (let x = TX0 + .58; x < TX1 - .1; x += .58) F.line(top, [x, TZF], [x, TZB], .22);
  for (let z = TZF - .58; z > TZB + .1; z -= .58) F.line(top, [TX0, z], [TX1, z], .22);
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

  // ---------- 6 Laptop und Handy auf der Terrasse: nur der echte Shop, ohne Text ----------
  F.part("laptop", .44, .05);
  const LX1 = LX0 + LW, LZB = LZF - LD;
  const base = slab(top, LX0, LX1, LZF, LZB, LH, .45, .035, { walls: "flr", col: LAPC, over: .03 });
  const KBD = .55;
  K.onFlat(base.top, K.decal(1000, Math.round(1000 * KBD / (LW - .2)), keyboard, LW - .2, KBD, .465), LX0 + LW / 2, LZB + .08 + KBD / 2, .002);
  const scr = K.panel(base.top, [LX0, LZB], [LX1, LZB], [0, -1], .465, .05, Q - .2, { over: .05 });
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
  }, LW, SHT, .48), LW / 2, SHT / 2, 1);
  // Handy: steht daneben, lehnt deutlich zurück (rund 29° aus der Senkrechten), mit der Bestellung (gerwing-bestellung.jpg, ganzes Bild in Displaybreite)
  const ph = K.panel(top, [PHX0, PHZ - .3], [PHX0 + PWD, PHZ - .3], [0, -1], .475, .045, Q - .5, { over: .05 });
  K.rect(ph, 0, 0, PWD, PHG, SCRC);
  const PPX = 560;
  K.onPanel(ph, K.decal(Math.round(PWD * PPX), Math.round(PHG * PPX), (x, W, H) => {
    x.fillStyle = "#2f2f33"; rr(x, 0, 0, W, H, .06 * PPX); x.fill();
    const bz = .03 * PPX, ix = bz, iy = bz * 2.2, iw = W - 2 * bz, ih = H - iy - bz * 1.5;
    x.fillStyle = "#ffffff"; x.fillRect(ix, iy, iw, ih);
    // ganzes Bild (Abmessungen, Warenkorb, Muster) in voller Breite, mittig im Display: alle Knöpfe ganz
    const im = BMP.order;
    if (im) { const dh = iw * im.height / im.width; x.drawImage(im, ix, iy + Math.max(0, (ih - dh) / 2), iw, Math.min(dh, ih)); }
  }, PWD, PHG, .495), PWD / 2, PHG / 2, 1);

  // ---------- 7 Steinstapel auf Palette mit Lattung (Gewicht): Lagen setzen sich nacheinander ----------
  F.part("palette", .56, .05);
  const pal = slab(R, AX0, AX1, AZ0, AZ1, AH, .585, .075, { walls: "flrb", col: PALC, over: .04 });
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
    K.onPanel(nd, K.decal(Math.round(Wm * PXU), Math.round(AP * PXU), palFace(Wm), Wm, AP, .625), Wm / 2, AP / 2, -1);
    for (let k = 0; k < NL; k++) K.onPanel(nd, K.decal(Math.round(Wm * PXU), Math.round(LHT * PXU), rowFace(Wm, cwm, k), Wm, LHT, .635 + k * .0085, .012), Wm / 2, AP + (k + .5) * LHT, -1);
  }
  // oberste Lage: Steinfugen
  K.onFlat(pal.top, K.decal(Math.round(faceW * PXU), Math.round(faceD * PXU), (x, W, H) => {
    const s = W / faceW, cw = .6 * s, rh = .3 * s;
    x.fillStyle = "#efe9dc"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.2); x.lineWidth = Math.max(1.5, .01 * s);
    for (let y = rh; y < H - 2; y += rh) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    for (let r = 0; r * rh < H; r++) for (let X = (r % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, r * rh); x.lineTo(X, Math.min(H, (r + 1) * rh)); x.stroke(); }
  }, faceW, faceD, .71), (AX0 + AX1) / 2, (AZ0 + AZ1) / 2, .0015);

  // ---------- 8 Lager: drei Händlerhallen hinter der Zufahrt, Weiche, rote Linie zum zuständigen Händler ----------
  F.part("haendler", .70, .06);
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
    const hl = slab(R, x0, x0 + w, z0, z0 - d, h, [.725, .715, .745][i], .065, { walls: "flrb", col: HALLC, top: ROOFC, over: .03 });
    const on = [.76, .75, .78][i], dc = K.decal(Math.round(w * 360), Math.round(h * 360), gateDraw(false)(w, h), w, h, on);
    K.onPanel(hl.fr, dc, w / 2, h / 2, -1);
    if (i === 1) { dc.off = .9; K.onPanel(hl.fr, K.decal(Math.round(w * 360), Math.round(h * 360), gateDraw(true)(w, h), w, h, .9, .025), w / 2, h / 2, -1, null, .0025); }
    return hl;
  });
  // Zufahrt: Haarlinien zu den beiden anderen Händlern (hinterm Rolltor), rot (Faden) zum zuständigen
  const g0 = gate(0), g1 = gate(1), g2 = gate(2);
  F.sketch(R, [
    [WJ, [WJ[0] + .5, LA]], [[WJ[0] + .5, LA], [g0 - .35, LA]], [[g0 - .35, LA], [g0, LA + .1]], [[g0, LA + .1], [g0, GZ]],
    [WJ, [WJ[0] + .5, LC]], [[WJ[0] + .5, LC], [g2 - .35, LC]], [[g2 - .35, LC], [g2, LC - .1]], [[g2, LC - .1], [g2, GZ + .2]], [[g2, GZ + .2], [g2, GZ]]
  ], .79, .045, { a: .55 });
  const knot = F.lift(R, 0, .82, .01);
  F.poly(knot, Array.from({ length: 16 }, (_, i) => [WJ[0] + Math.cos(i / 16 * 2 * PI) * .09, WJ[1] + Math.sin(i / 16 * 2 * PI) * .09]), RED, 0, .006);

  // ---------- Konstruktionsphase (seite/): Gerüst je Bauabschnitt kurz vor dem Hochklappen, Bleistiftspur auf den Flächen ----------
  // Steine und Wand ohne Gerüst: die Wand steht schon am Anfang auf (ihr Gerüst läge über der liegenden Überschrift), die 90 Steine
  // hätten ein Linienfeld über der Fläche ergeben; dort zeichnet die Kontur mit Eckmarken schon vor.
  F.geruest({ tags: ["haus", "terrasse"], t0: .33, t1: .385, du: .03, a: .5 });
  F.geruest({ tags: ["laptop"], t0: .43, t1: .475, du: .03, a: .5 });
  F.geruest({ tags: ["palette"], t0: .555, t1: .6, du: .03, a: .5 });
  F.geruest({ tags: ["haendler"], t0: .69, t1: .74, du: .03, a: .5 });
  F.spur({ tags: ["haus", "terrasse", "laptop", "palette", "haendler"], quiet: [house, scr, ph, pal.fr, pal.lf, pal.rt, base.top, ...halls.map(h => h.fr)], a: .3 });

  // ---------- Lesestelle: genau eine, die Wand ----------
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const S = {
    // Fließtext (e0) bestimmt die Schriftgröße; Gerwing, Kennzeile und Überschrift sind größer und passen mit in den Rahmen
    wand: { name: "wand", prints: [gw, mt, hd, t1, t2], e0: eB, px: pxD, pitch: 8, yaw: -6, sy: .04, sx: -.05, pxN: 18.5, fitN: .9, npitch: 10, nyaw: -4, nsy: .18, nsx: -.056 }
  };

  // Rote Linie: von der Palette über die Weiche und die Zufahrt in die zuständige Halle und hinten wieder hinaus (unter der Halle verdeckt)
  const thread = { pts: [V(AX1 + .05, .004, AZ0 + .05), V(8.25, .004, -1.45), V(8.85, .004, -1.08), V(WJ[0], .004, WJ[1]), V(12.0, .004, WJ[1]), V(g1 - .35, .004, WJ[1]),
    V(g1 - .07, .004, -1.14), V(g1, .004, -1.5), V(g1, .004, GZ - .05), V(g1, .004, GZ - 1.5)], t0: .83, t1: .925 };

  // ---------- Kamera (Drehbuch: DREHBUCH.md). Gleichmäßige Fahrt: Wand → Fläche → Terrasse → Palette → Zufahrt → Halle ----------
  return {
    fov: 32, fovN: 44,
    track: 680,
    // Raster (seite/): zieht mit den ersten Bastellinien ein und ist weg, bevor der Text gelesen wird
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .055 },
    thread,
    stops: [S.wand],
    keys: [
      // Start: Wand liegt flach im Bogen, Name, Kennzeile und Überschrift lesbar
      key(0, 0, V(-7.2, -.22, ZW - HW / 2 + .1), 52, 0, 11.3, V(-7.3, -.4, ZW - HW / 2 + .1), 54, 0, 15.8),
      // Wand steht auf und rastet ein, Kamera sinkt
      key(.8, .07, V(-7.2, 1.7, ZW), 24, -6, 11.0, V(-7.3, 2.6, ZW), 24, -4, 15.0),
      { w: .9, stop: S.wand },
      // Steine heben sich Reihe für Reihe: Überblick über die Fläche
      key(2.4, .27, V(-6.7, .4, -2.9), 40, -8, 10.4, V(-7.5, -.2, -1.95), 46, -4, 14.0),
      // Hauswand steht auf, Terrasse hebt sich, Treppe faltet aus
      key(1.6, .40, V(-.5, 1.3, -3.7), 28, -16, 11.8, V(-.3, 1.3, -3.7), 28, -8, 20.0),
      // Laptop und Handy klappen auf
      key(1.2, .535, V(-.4, 1.4, -3.4), 24, -12, 7.4, V(-.4, 1.4, -3.4), 24, -6, 12.0),
      // Palette baut sich
      key(1.1, .63, V(5.0, .9, -3.0), 30, -20, 10.6, V(5.4, .9, -3.0), 30, -10, 15.0),
      // Stapel Lage für Lage
      key(1.0, .72, V(6.6, .9, -2.9), 24, -18, 8.4, V(6.6, .9, -2.9), 26, -10, 13.0),
      // Zufahrt: Hallen stehen, Haarlinien und Weiche
      key(1.2, .80, V(9.4, .4, -1.7), 24, -16, 9.5, V(9.8, .4, -1.9), 26, -8, 14.5),
      // rote Linie läuft über die Weiche an der ersten Halle vorbei
      key(1.1, .87, V(11.6, .45, -1.7), 24, -12, 9.0, V(12.0, .5, -1.9), 26, -8, 14.0),
      // Rolltor der zuständigen Halle fährt hoch, die Linie läuft hinein
      key(1.0, .925, V(14.5, .5, -2.0), 26, -10, 8.0, V(14.5, .5, -2.0), 28, -6, 12.5),
      // Endbild: Palette, Zufahrt und Hallen, Terrasse links im Hintergrund
      key(1.2, 1, V(11.6, .3, -2.2), 30, -16, 17.0, V(11.8, .4, -2.4), 34, -12, 27.0)
    ]
  };
}
