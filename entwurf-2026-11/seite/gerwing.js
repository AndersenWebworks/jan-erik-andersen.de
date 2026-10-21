// Gerwing – Pflaster nach Fläche bestellen. Szene im Stil Bogen + Bastellinien (Faltkern falt.js, Gerüst kern.js).
// Eine Kette auf einem Bogen, von links nach rechts gelesen (Drehbuch: DREHBUCH.md):
//   Wand mit Überschrift → umrissene Fläche (Quadratmeter) → ganze Steine im Läuferverband, Reihe für Reihe,
//   die letzte Reihe ragt über die Kontur → Terrasse mit Platten und Treppe → Steinstapel auf Palette mit Lattung (Gewicht)
//   → rote Linie über eine Weiche zum zuständigen von drei Händlern (Fracht nach PLZ) → Laptop mit dem echten Shop.
// Jeder Satz steht am Bauteil, zu dem er gehört. Alles liegt in Ruhe flach im Bogen, zeichnet erst seine Schnitt- und
// Falzlinien und klappt dann mit der Vorspann-Mechanik hoch (anfahren, abbremsen, überschwingen, einrasten).
// Vorbilder: Raumtext 2 (Text auf Faltflächen, Gerät mit echtem Shopbild), Vorspann-Test (Mechanik, Überschrift auf
// einrastender Wand), Konstruktion 7 und Blatt (Fläche → Steine Reihe für Reihe, Treppe, Palette, Weiche zu drei Händlern).
// Kopie von entwurf-2026-11/gerwing/gerwing.js für die durchgehende Seite (entwurf-2026-11/seite/). Ergänzt: Konstruktionsphase
// (Raster auf dem Bogen bis zur ersten liegenden Lesestelle, Gerüst je Bauabschnitt kurz vor dem Hochklappen, Bleistiftspur).
import { keyboard } from "./zeichnungen.js";

// Shopbilder (ImageBitmap), vor dem Aufbau in main.js aus bilder/bilder.js dekodiert
let BMP = {};
export function setBilder(b) { BMP = b || {}; }

const ink = a => `rgba(48,48,51,${a})`;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Text (wörtlich aus dem Seitentext, entwurf-2026-11-test-fliesstext/index.html) ----------
const META = "Gerwing · WooCommerce · seit 2023";
const TITEL = "Pflaster nach Fläche bestellen";

export default function (K) {
  const { F, R, V, COL, Q, PI, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const WALLC = c3("#f3efe6"), STONE = COL.STONE, STONE2 = COL.STONE2, OLD = COL.OLD;
  const TERR = c3("#e6dfd1"), TERRTOP = c3("#efeae0"), PALC = c3("#e9e2d3"), HALLC = c3("#eeece7"), ROOFC = c3("#dcd8cf");
  const LAPC = c3("#e4e1db"), SCRC = c3("#3a3a3e"), RED = COL.RED;
  const MUTED = "#66666a";

  // Kamerahilfe: Ziel, Blickhöhe (Grad), Gier (Grad, + = Kamera rechts), Abstand
  const sph = (t, el, az, d) => { const e = el * PI / 180, a = az * PI / 180; return V(t.x + d * Math.cos(e) * Math.sin(a), t.y + d * Math.sin(e), t.z + d * Math.cos(e) * Math.cos(a)); };
  const key = (w, b, tD, elD, azD, dD, tN, elN, azN, dN) => ({ w, b, tgt: tD, cam: sph(tD, elD, azD, dD), tgtN: tN, camN: sph(tN, elN, azN, dN) });

  // ---------- Lage (Bogen x nach rechts, z zum Betrachter) ----------
  // Wand mit Überschrift
  const WX0 = N ? -9.4 : -10.2, WW = N ? 4.2 : 6.4, ZW = -5.2, HW = N ? 3.0 : 1.9;
  // Pflasterfläche: Steine 0,6 × 0,3 (Verhältnis 25 × 15 cm wie im Shop), Kontur eine halbe Reihe kürzer als die ganzen Steine:
  // die letzte Reihe ragt halb über die Kontur. Desktop 9 Steine × 10 Reihen, Handy schmaler und tiefer (6 × 14)
  const CW = .6, RH = .3, NC = N ? 6 : 9, NR = N ? 14 : 10, PX0 = -9.4, PX1 = PX0 + NC * CW, PZB = -4.4, PZF = PZB + (NR - .5) * RH, SH = .12, G = .012;
  // Terrasse mit Treppe
  const TX0 = -2.4, TX1 = 2.8, TZB = -4.9, TZF = -2.0, TH = .9, SX0 = .1, SX1 = 1.7, NS = 4, RS = TH / NS, TS = .36;
  // Palette mit Steinstapel
  const AX0 = 5.4, AX1 = 7.8, AZ0 = -2.2, AZ1 = -3.6, AH = 1.5, AP = .3;
  // Lagerhallen [x0, z0 (Front), Breite, Tiefe, Höhe]; zuständig ist HL[1] (vorn, trägt Satz 2d)
  const HL = [[10.6, -4.8, 2.0, 1.1, .72], [10.3, -1.6, 2.6, 1.4, .95], [14.6, -2.2, 2.0, 1.1, .72]];
  // Laptop
  const LX0 = 13.6, LW = N ? 2.85 : 3.2, LZF = 3.7, LD = 2.05, LH = .1, SHT = 2.0;

  // ---------- Bogen ----------
  K.sheet(-11.6, 17.6, -9.6, 4.9);

  // ---------- Drucke ----------
  const sans = (lines, e, on, o = {}) => K.print(lines, e, on, o);
  // Druck links bündig an u0 (Fläche K.panel): Mitte des Drucks
  const uL = (pr, u0) => u0 + pr.w / 2 - pr.t.padX * pr.e;

  // ---------- 1 Wand mit Überschrift: liegt flach (lesbar), steht auf, rastet ein ----------
  F.part("wand", 0, .03);
  const wall = K.panel(R, [WX0, ZW], [WX0 + WW, ZW], [0, -1], .03, .065, Q, { over: .04 });
  K.rect(wall, 0, 0, WW, HW, WALLC);
  const M0 = .42;
  const S1L = N
    ? ["Für Gerwing habe ich 2023 einen", "WooCommerce-Shop gebaut, der", "Pflastersteine, Terrassenplatten", "und Stufen so verkauft, wie man", "sie bestellt: nach Fläche."]
    : ["Für Gerwing habe ich 2023 einen WooCommerce-Shop", "gebaut, der Pflastersteine, Terrassenplatten und", "Stufen so verkauft, wie man sie bestellt: nach Fläche."];
  // am Handy größer: bei 16 px steht die Kamera dann so weit weg, dass die ganze Wand ins Hochkantbild passt
  const T1 = sans(S1L, N ? .2 : .14, .085, { lh: 1.32 });
  const hd = K.print(N ? ["Pflaster nach Fläche", "bestellen"] : [TITEL], N ? .4 : .44, -1, { font: "serif", lh: 1.08 });
  const mt = K.print([META], .12, -1, { track: .03, col: MUTED });
  const v1 = .28 + T1.h / 2, v2 = v1 + T1.h / 2 + hd.h / 2 - .02, v3 = v2 + hd.h / 2 + mt.h / 2 - .02;
  K.onPanel(wall, T1, uL(T1, M0), v1, 1);
  K.onPanel(wall, hd, uL(hd, M0 - .03), v2, 1);
  K.onPanel(wall, mt, uL(mt, M0), v3, 1);

  // ---------- 2 Fläche: Kontur mit Eckmarken (Quadratmeter) ----------
  const tick = .32, cm = [];
  const ln = (a, b) => cm.push([a, b]);
  ln([PX0, PZB], [PX1, PZB]); ln([PX1, PZB], [PX1, PZF]); ln([PX1, PZF], [PX0, PZF]); ln([PX0, PZF], [PX0, PZB]);
  // Eckmarken außen, vorn deutlich vor den Steinwänden, damit die überstehende Reihe sichtbar über die Kontur ragt
  for (const [x, z, dx, dz] of [[PX0, PZB, -1, -1], [PX1, PZB, 1, -1], [PX0, PZF, -1, 1], [PX1, PZF, 1, 1]]) {
    ln([x + dx * .18, z], [x + dx * (.18 + tick), z]); ln([x, z + dz * .18], [x, z + dz * (.18 + tick)]);
  }
  F.sketch(R, cm, .105, .045, { a: .62 });
  const T2 = sans(N ? ["Kunden geben ihre", "Quadratmeter ein,"] : ["Kunden geben ihre Quadratmeter ein,"], N ? .12 : .15, .135, { lh: 1.25 });
  // am Handy mittig unter der Stirnkantenschrift (x wie T3), damit beide zusammen ins Hochkantbild passen
  K.onFlat(R, T2, N ? PX0 + 1.8 : uL(T2, PX0), PZF + .62 + (N ? .18 : 0));

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
  const front = [];
  for (let r = 0; r < NR; r++) {
    F.part("reihe" + r, .125 + r * .0675 / (NR - 1), .028);
    const za = PZB + r * RH, zf = za + RH, odd = r % 2 === 1;
    const xs = [PX0]; let x = PX0 + (odd ? CW / 2 : CW);
    while (x < PX1 - 1e-6) { xs.push(x); x += CW; }
    xs.push(PX1);
    for (let k = 0; k < xs.length - 1; k++) {
      const xa = xs[k], xb = xs[k + 1];
      const walls = (r === 0 ? "b" : "") + (r === NR - 1 ? "f" : "") + (k === 0 ? "l" : "") + (k === xs.length - 2 ? "r" : "");
      const col = (r * 3 + k) % 5 === 0 ? OLD : (r * 7 + k) % 4 === 0 ? STONE2 : STONE;
      const s = slab(R, xa + G / 2, xb - G / 2, zf - G / 2, za + G / 2, SH, .20 + r * .14 / (NR - 1) + (xa - PX0) * .0016, .055, { walls, col, over: .06 });
      if (r === NR - 1) front.push({ s, xa: xa + G / 2, xb: xb - G / 2 });
    }
  }
  // Satz 2b auf den Stirnkanten der vordersten Reihe (eine Zeile über mehrere Steine)
  const T3 = sans(["der Shop rechnet sie in ganze Steine um,"], .074, .405, { lh: 1 });
  {
    const cx = PX0 + (N ? 1.8 : 2.55), st = front.find(f => cx >= f.xa && cx <= f.xb) || front[4];
    K.onPanel(st.s.fr, T3, cx - st.xa, SH / 2, -1);
  }

  // ---------- 4 Terrasse mit Platten und Treppe ----------
  F.part("terrasse", .37, .06);
  const top = F.lift(R, TH, .44, .07, { over: .02 });
  F.poly(top, [[TX0, TZF], [SX0, TZF], [SX1, TZF], [TX1, TZF], [TX1, TZB], [TX0, TZB]], TERRTOP, .5);
  // Terrassenplatten 0,6 × 0,6 als Fugen
  for (let x = TX0 + .58; x < TX1 - .1; x += .58) F.line(top, [x, TZF], [x, TZB], .22);
  for (let z = TZF - .58; z > TZB + .1; z -= .58) F.line(top, [TX0, z], [TX1, z], .22);
  const down = { own: R, over: .03 };
  K.rect(K.panel(top, [TX0, TZB], [TX1, TZB], [0, -1], .48, .06, -Q, down), 0, 0, TX1 - TX0, TH, TERR);
  K.rect(K.panel(top, [TX0, TZF], [TX0, TZB], [-1, 0], .485, .06, -Q, down), 0, 0, TZF - TZB, TH, TERR);
  K.rect(K.panel(top, [TX1, TZF], [TX1, TZB], [1, 0], .485, .06, -Q, down), 0, 0, TZF - TZB, TH, TERR);
  K.rect(K.panel(top, [TX0, TZF], [SX0, TZF], [0, 1], .49, .06, -Q, down), 0, 0, SX0 - TX0, TH, TERR);
  K.rect(K.panel(top, [SX1, TZF], [TX1, TZF], [0, 1], .49, .06, -Q, down), 0, 0, TX1 - SX1, TH, TERR);
  // Treppe: Zickzackstreifen aus der Vorderkante, faltet sich Stufe für Stufe. Setz- und Trittstufe einer Stufe teilen sich
  // ein Zeitfenster (−θ und +θ): die Trittstufen bleiben dadurch immer waagerecht, nichts taucht unter den Bogen,
  // und die Stufen rasten nacheinander ein (je 0,016 versetzt)
  {
    let p = top, z = TZF;
    const n = 2 * NS - 1;
    for (let i = 0; i < n; i++) {
      const riser = i % 2 === 0, len = riser ? RS : TS;
      const ang = riser ? -Q : Q;
      const nd = K.panel(p, [SX0, z], [SX1, z], [0, 1], .52 + Math.floor(i / 2) * .016, .05, ang, { own: R, over: .05 });
      K.rect(nd, 0, 0, SX1 - SX0, len, riser ? TERR : STONE);
      p = nd; z += len;
    }
  }

  // ---------- 5 Steinstapel auf Palette mit Lattung ----------
  F.part("palette", .54, .05);
  const pal = K.box(R, AX0, AX1, AZ0, AZ1, AH, .59, .1, { col: PALC });
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
  K.onPanel(pal.fr, K.decal(Math.round((AX1 - AX0) * PXU), Math.round(AH * PXU), stackFace(AX1 - AX0, AH, .6), AX1 - AX0, AH, .62), (AX1 - AX0) / 2, AH / 2, -1);
  K.onPanel(pal.rt, K.decal(Math.round((AZ0 - AZ1) * PXU), Math.round(AH * PXU), stackFace(AZ0 - AZ1, AH, .3), AZ0 - AZ1, AH, .62), (AZ0 - AZ1) / 2, AH / 2, -1);
  K.onPanel(pal.lf, K.decal(Math.round((AZ0 - AZ1) * PXU), Math.round(AH * PXU), stackFace(AZ0 - AZ1, AH, .3), AZ0 - AZ1, AH, .62), (AZ0 - AZ1) / 2, AH / 2, -1);
  // oberste Lage: Steinfugen, darauf ohne Rand Satz 2c
  const LD0 = AZ0 - AZ1;
  K.onPanel(pal.top, K.decal(Math.round((AX1 - AX0) * PXU), Math.round(LD0 * PXU), (x, W, H) => {
    const s = W / (AX1 - AX0), cw = .6 * s, rh = .3 * s;
    x.fillStyle = "#efe9dc"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.2); x.lineWidth = Math.max(1.5, .01 * s);
    for (let y = rh, r = 0; y < H - 2; y += rh, r++) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    for (let r = 0; r * rh < H; r++) for (let X = (r % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, r * rh); x.lineTo(X, Math.min(H, (r + 1) * rh)); x.stroke(); }
  }, AX1 - AX0, LD0, .66), (AX1 - AX0) / 2, LD0 / 2, -1, [0, 1], .0015);
  const T4 = sans(["ermittelt Gewicht und Fracht", "nach Postleitzahl"], .13, .685, { lh: 1.25 });
  K.onPanel(pal.top, T4, (AX1 - AX0) / 2, LD0 / 2, -1, [0, 1], .003);

  // ---------- 6 Fracht nach PLZ: drei Händler, Weiche, rote Linie zum zuständigen ----------
  F.part("haendler", .66, .06);
  const doors = (Wm, Hm, band) => (x, W, H) => {
    const s = W / Wm, dh = (band ? .5 : .44) * s, dw = (band ? .78 : .62) * s, gap = (band ? .3 : .22) * s, x0 = (W - 2 * dw - gap) / 2;
    for (let i = 0; i < 2; i++) {
      const X = x0 + i * (dw + gap), Y = H - dh;
      x.fillStyle = "#d9d5cc"; x.fillRect(X, Y, dw, dh);
      x.strokeStyle = ink(.42); x.lineWidth = Math.max(1.5, .012 * s); x.strokeRect(X, Y, dw, dh);
      x.strokeStyle = ink(.26); for (let k = 1; k < 7; k++) { x.beginPath(); x.moveTo(X, Y + k * dh / 7); x.lineTo(X + dw, Y + k * dh / 7); x.stroke(); }
    }
    // Fensterband unter der Dachkante (ohne Druck) bzw. Schildfeld für Satz 2d
    if (!band) { x.fillStyle = ink(.12); x.fillRect(.18 * s, .1 * s, W - .36 * s, .12 * s); }
  };
  const halls = HL.map(([x0, z0, w, d, h], i) => {
    const hl = slab(R, x0, x0 + w, z0, z0 - d, h, [.735, .72, .75][i], .065, { walls: "flrb", col: HALLC, top: ROOFC, over: .03 });
    K.onPanel(hl.fr, K.decal(Math.round(w * 360), Math.round(h * 360), doors(w, h, i === 1), w, h, [.76, .745, .775][i]), w / 2, h / 2, -1);
    return hl;
  });
  const [, , HWD, , HH] = HL[1];
  const T5 = sans(["und leitet die Bestellung an", "den zuständigen Händler weiter."], .112, .855, { lh: 1.22 });
  K.onPanel(halls[1].fr, T5, HWD / 2, HH - .05 - T5.h / 2, -1);
  // Weiche vor der zuständigen Halle; Haarlinien zu den beiden anderen Händlern (hinten, rechts)
  const WJ = [9.25, -1.0], fr = i => [HL[i][0] + HL[i][2] / 2, HL[i][1] + .06];
  const h0 = fr(0), h2 = fr(2);
  F.sketch(R, [[WJ, [9.75, -1.5]], [[9.75, -1.5], [9.75, -4.35]], [[9.75, -4.35], [h0[0], -4.35]], [[h0[0], -4.35], h0],
    [WJ, [9.9, -.95]], [[9.9, -.95], [h2[0], -.95]], [[h2[0], -.95], h2]], .805, .04, { a: .55 });
  const knot = F.lift(R, 0, .805, .01);
  F.poly(knot, Array.from({ length: 16 }, (_, i) => [WJ[0] + Math.cos(i / 16 * 2 * PI) * .08, WJ[1] + Math.sin(i / 16 * 2 * PI) * .08]), RED, 0, .006);

  // ---------- 7 Laptop mit der Produktseite ----------
  F.part("laptop", .82, .05);
  const LX1 = LX0 + LW, LZB = LZF - LD;
  const base = slab(R, LX0, LX1, LZF, LZB, LH, .875, .035, { walls: "flr", col: LAPC, over: .03 });
  // Tastatur hinten, Handballenauflage vorn mit Satz 3
  const KBD = 1.0;
  K.onFlat(base.top, K.decal(1400, Math.round(1400 * KBD / (LW - .3)), keyboard, LW - .3, KBD, .885), LX0 + LW / 2, LZB + .1 + KBD / 2, .002);
  // am Handy dreizeilig und größer: die Kamera steht bei 16 px dann weiter weg und zeigt mehr vom Bildschirm
  const T6 = sans(N ? ["Seitdem betreue ich", "den Shop und entwickle", "ihn laufend weiter."] : ["Seitdem betreue ich den Shop", "und entwickle ihn laufend weiter."], N ? .165 : .108, .955, { lh: 1.24, align: "center" });
  K.onFlat(base.top, T6, LX0 + LW / 2, LZF - .47, .003);
  const scr = K.panel(base.top, [LX0, LZB], [LX1, LZB], [0, -1], .895, .06, Q - .2, { own: R, over: .05 });
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
  }, LW, SHT, .915), LW / 2, SHT / 2, 1);

  // ---------- Konstruktionsphase (seite/): Gerüst je Bauabschnitt kurz vor dem Hochklappen, Bleistiftspur auf den Flächen ----------
  // Steine und Wand ohne Gerüst: die Wand steht schon am Anfang auf (ihr Gerüst läge über der liegenden Überschrift), die 90 Steine
  // hätten ein Linienfeld über der Fläche ergeben; dort zeichnet die Kontur mit Eckmarken schon vor.
  F.geruest({ tags: ["terrasse"], t0: .375, t1: .44, du: .03, a: .5 });
  F.geruest({ tags: ["palette"], t0: .545, t1: .59, du: .03, a: .5 });
  F.geruest({ tags: ["haendler"], t0: .67, t1: .72, du: .03, a: .5 });
  F.geruest({ tags: ["laptop"], t0: .83, t1: .875, du: .03, a: .5 });
  F.spur({ tags: ["terrasse", "palette", "haendler", "laptop"], quiet: [pal.top, pal.fr, pal.lf, pal.rt, ...halls.map(h => h.fr), base.top, scr], a: .3 });

  // ---------- Lesestellen ----------
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  // liegende Drucke: steiler (56–60°) und um 15 % größer gesetzt, damit die Schrift auch senkrecht (verkürzt) rund 19–20 px hat
  const pxF = (W, H) => pxD(W, H) * 1.15;
  const S = {
    t1: { prints: [T1], px: pxD, pitch: 9, yaw: -10, sy: -.18, npitch: 10, nyaw: -6, nsy: -.12 },
    t2: { prints: [T2], px: pxF, pitch: 62, yaw: -6, sy: .19, sx: -.05, pxN: 17.4, npitch: 64, nyaw: -4, nsy: -.07 },
    t3: { prints: [T3], px: (W, H) => pxD(W, H) * 1.03, pitch: 9, yaw: -12, sy: -.37, sx: .3, pxN: 17.9, npitch: 38, nyaw: 0, nsy: .26 },
    t4: { prints: [T4], px: pxF, pitch: 58, yaw: -8, sy: -.05, pxN: 18.2, npitch: 60, nyaw: -6, nsy: -.05 },
    t5: { prints: [T5], px: pxD, pitch: 11, yaw: -10, sy: .1, sx: -.3, npitch: 12, nyaw: -6, nsy: .05 },
    // Laptop: Text unten im Bild, darüber der ganze Bildschirm mit dem Shop
    t6: { prints: [T6], px: (W, H) => pxD(W, H) * (H < 820 ? 1.06 : 1.15), pitch: 58, yaw: -2, sy: (W, H) => H < 820 ? -.54 : -.47, pxN: 17.6, npitch: 58, nyaw: -4, nsy: -.3 }
  };

  // Rote Linie: von der Palette über die Weiche zur zuständigen Halle
  const h1 = fr(1);
  const thread = { pts: [V(AX1 + .05, .004, AZ0 + .05), V(8.5, .004, -1.6), V(WJ[0], .004, WJ[1]), V(WJ[0] + .9, .004, -.85), V(h1[0] - .5, .004, -1.05), V(h1[0], .004, h1[1])], t0: .81, t1: .875 };

  // ---------- Kamera (Drehbuch: DREHBUCH.md). Ziele und Abstände eingepasst bei 1280 × 900 bzw. 390 × 844 ----------
  const kWall = V(WX0 + WW / 2, 0, ZW - HW / 2);
  return {
    fov: 32, fovN: 44,
    track: 680,
    // Raster (seite/): zieht mit den ersten Bastellinien ein und ist weg, bevor der erste liegende Text gelesen wird (b .165)
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .055 },
    thread,
    stops: Object.values(S),
    keys: [
      // Start: Wand liegt flach im Bogen, Kennzeile und Überschrift lesbar (Anschluss an den Anriss der Eröffnung)
      key(0, 0, V(-7.0, -.22, -5.87), 52, 0, 11.3, V(-7.1, -.41, -6.01), 54, 0, 14.9),
      // Wand steht auf und rastet ein, Kamera sinkt auf 22°
      key(.8, .07, V(-7.1, .86, -5.17), 22, -6, 11.0, V(-7.13, 1.09, -5.08), 22, -4, 14.2),
      { w: .9, stop: S.t1 },
      { w: 1.25, stop: S.t2 },
      // Steine heben sich Reihe für Reihe: Überblick über die Fläche
      key(1.5, .30, V(-6.61, .87, -2.66), 40, -8, 10.1, V(-7.49, -.2, -1.95), 46, -4, 14.0),
      { w: 1.15, stop: S.t3 },
      // Terrasse hebt sich, Wände schwenken herab, Treppe faltet aus
      key(1.45, .57, V(.51, .04, -2.11), 30, -22, 8.6, V(.42, .1, -2.2), 32, -12, 18.0),
      // Treppe fertig, Palette baut sich
      key(1.1, .66, V(2.77, 1.1, -2.68), 32, -22, 13.0, V(6.2, 1.2, -2.82), 34, -10, 13.0),
      { w: 1.1, stop: S.t4 },
      // Fracht: Hallen stehen, rote Linie läuft über die Weiche
      key(1.25, .83, V(11.1, .4, -3.1), 40, -10, 17.3, V(13.06, .11, -3.04), 44, -6, 23.7),
      { w: 1.1, stop: S.t5 },
      // Laptop klappt auf
      key(1.2, .945, V(15.35, .8, 2.6), 26, -12, 10.8, V(15.32, .78, 2.6), 28, -8, 11.0),
      { w: .9, stop: S.t6 },
      // Endbild: Palette, Händler und Laptop mit dem Shop, Terrasse links im Hintergrund
      key(1.3, 1, V(11.71, .05, -.32), 28, -20, 19.4, V(13.39, .35, -.52), 34, -14, 29.0)
    ]
  };
}
