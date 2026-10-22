// Gerwing – Pflaster nach Fläche bestellen. Lesebahn, Fassung „Die Szene ist der Träger“ (PRINZIP-SZENE-IST-TRAEGER.md, DREHBUCH-LESEBAHN.md Abschnitt 5).
//
// Das Ding: ein Pflasterweg mit Maurerschnur. Pflasterer richten Platten an einer gespannten Schnur aus; der rote Faden IST diese Schnur
// (auf zwei Schnurnägeln am Anfang und am Ende, leicht erhöht). Entlang der Schnur entsteht der Weg:
//   G0  Bauschild als Aufsteller (A-Rahmen) am Anfang: Kicker, Kopf und die echte Produktseite. So ist der Shop selbst das Schild der Baustelle.
//   G1 bis G5  stehen auf großen Platten. Jede Platte wird aus dem Bogen geschnitten, steht an ihrer Vorderkante zur Kamera zurückgelehnt auf, trägt ihren
//       Satz und wird danach verlegt: sie klappt flach in den Weg (Farbe bleibt Stein), der Satz liegt dann ruhig als Teil des Wegs.
//   Zwischen den Platten (Handy: in den Betten der Platten) verlegen sich Felder aus kleinen Steinen im Läuferverband, Reihe für Reihe.
//   G2  Fläche in ganze Steine: gestrichelte Kontur der bestellten Fläche, die letzte Reihe ragt mit ganzen Steinen über die Kontur.
//   G3  Palette mit Steinen auf einer Plattformwaage (Zeiger, Skala ohne Zahl), daneben der Frachtzettel mit leerem Feld „PLZ“.
//   G4  Händlerlager (Halle mit Rolltor, das sich öffnet), die Palette steht davor.
//   G5  letzte Platte; dahinter läuft der Weg als gestrichelte Kontur weiter (laufend weiterentwickeln).
// Desktop: Bilder zwischen den Platten. Handy: das Bild steht HINTER seiner Platte (gleiches x), weil das Bild nur einen schmalen Streifen zeigt;
// die Platten gleiten dort aufrecht an der Schnur entlang (K.trage) und werden dann verlegt (Ausrichten an der Schnur).
// Hintergrund (obere Bildhälfte): Baustofflager (Pflastersteine, Terrassenplatten, Stufen), Bauzaun.

// Shopbilder (ImageBitmap), vor dem Aufbau in main.js aus bilder/bilder.js dekodiert
let BMP = {};
export function setBilder(b) { BMP = b || {}; }

const ink = a => `rgba(48,48,51,${a})`;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

const KICK = "Gerwing · WooCommerce · seit 2023";
const HEAD = "Pflaster nach Fläche bestellen";
const TXT = [
  "Für Gerwing habe ich 2023 einen *WooCommerce-Shop* gebaut, der Pflastersteine, Terrassenplatten und Stufen nach Fläche verkauft.",
  "Kunden geben ihre *Quadratmeter* ein, der Shop rechnet sie in *ganze Steine* um.",
  "Er ermittelt *Gewicht und Fracht* nach Postleitzahl.",
  "Dann leitet er die Bestellung an den zuständigen *Händler* weiter.",
  "Seitdem *betreue ich den Shop* und entwickle ihn laufend weiter."
];

// Ersatzbild, wenn die Produktseite nicht vorliegt: gezeichnete Produktkarte
function produktkarte(x, W, H) {
  const s = W / 1185;
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#efefef"; x.fillRect(0, 0, W, 44 * s);
  x.fillStyle = ink(.3); rr(x, 360 * s, 12 * s, 460 * s, 20 * s, 10 * s); x.fill();
  x.fillStyle = ink(.08); x.fillRect(40 * s, 80 * s, 420 * s, 380 * s);
  x.fillStyle = "#d9cfbf"; x.fillRect(70 * s, 110 * s, 360 * s, 320 * s);
  x.strokeStyle = ink(.3); x.lineWidth = 2 * s;
  for (let r = 0; r < 8; r++) { x.beginPath(); x.moveTo(70 * s, (110 + r * 40) * s); x.lineTo(430 * s, (110 + r * 40) * s); x.stroke(); }
  x.fillStyle = ink(.75); rr(x, 520 * s, 100 * s, 520 * s, 34 * s, 4 * s); x.fill();
  x.fillStyle = ink(.3); for (let i = 0; i < 4; i++) { rr(x, 520 * s, (170 + i * 36) * s, (460 - i * 50) * s, 14 * s, 7 * s); x.fill(); }
  x.strokeStyle = ink(.5); x.lineWidth = 2.5 * s; rr(x, 520 * s, 350 * s, 190 * s, 56 * s, 4 * s); x.stroke();
}

export default function (K, opt) {
  const { F, R, V, Q, sm, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const halfW = K.halfW, UP = Q - K.lean, EC = K.EC;
  F.auto(false);      // Steinfelder bekommen keine Spur und kein Gerüst; die übrigen Teile bekommen sie unten ausdrücklich

  // ---------- Farben ----------
  const ST = [c3("#d9cfbf"), c3("#cfc3b0"), c3("#e3dacb")];
  const PLC = c3("#e9e0d1"), BOARD = c3("#f3eee3"), WOOD = c3("#d8c8ac"), STEEL = c3("#d9d5cb"), HALLC = c3("#e6e1d5"), ROOFC = c3("#d3cdc0");
  const PALC = c3("#e1d6c1"), ZAUN = c3("#eee8da"), LEGC = c3("#d9cfbf"), DARK = c3("#bdb6a8");

  // ---------- Maße (Welt) ----------
  const LZ = -.2;                       // Leselinie: dort ist die Schrift 21 px bzw. 17 px
  const Z0 = LZ + .68;                  // vordere Kante des Wegs
  const ZP = Z0 + .05;                  // Scharnier der Platten (knapp vor den Steinen)
  const FZ = LZ + 1.0;                  // Schnur
  const RH = .3, CW = .6, GJ = .012, NRW = 6, HP = NRW * RH, SHT = .09;      // Steinreihe, Stein, Fuge, Reihen im Weg, Plattentiefe, Steindicke
  const ZB = Z0 - HP;                   // hintere Kante des Wegs

  // ---------- Köpfe und Sätze ----------
  const eH = EC * (N ? 1.6 : 1.55);
  const kp = K.kopf({ kicker: KICK, head: HEAD, headLines: N ? ["Pflaster", "nach Fläche", "bestellen"] : [HEAD], e: eH, on: 0 });
  const ME = N ? [15.5, 15, 15.5, 15.5, 15.5] : [17.5, 17.5, 17.5, 17.5, 17.5];
  const S = TXT.map((t, i) => K.satz(t, { maxEm: ME[i], on: 0 }));
  const PW = S.map(s => Math.max(s.tw + (N ? .7 : 1.0), 2 * HP));

  // Bauschild
  const SW = Math.max(N ? 4.0 : 5.2, kp.w + .9);
  const IW = SW - .8, IH = IW / (BMP.prod ? BMP.prod.width / BMP.prod.height : 2.389);
  const yImg = .36 + IH / 2, yHead = .36 + IH + .3 + kp.h.h / 2, yKick = .36 + IH + .3 + kp.h.h + .1 + kp.k.h / 2, SHh = yKick + kp.k.h / 2 + .32;

  // ---------- Mitfahrt am Handy: Wege rechnen (die Strecke steht erst nach dem Layout) ----------
  K.strecke(0, 1);
  const dD = w => K.trage(0, w, {}).D;
  const Ds = dD(SW), Dp = S.map(s => dD(s.tw));

  // ---------- Layout entlang der Schnur ----------
  const JG = .12;
  const zoneW = N ? [0, 0, 0, 0, 0] : [0, 3.4, 4.9, 5.2, 5.8];
  const xl0 = 0;                                                      // linke Kante des Schilds in der Startlage
  const sgnC0 = xl0 + SW / 2, sgnCF = sgnC0 + Ds;
  let cur = xl0 + Ds + SW + .3;
  const PL = [];                                                      // Platten: Zone davor, endgültige Lage, Startlage
  for (let i = 0; i < 5; i++) {
    const zw = Math.max(zoneW[i], Dp[i]);
    const z0 = cur, z1 = cur + zw, pl = z1 + (zw > 0 ? JG : 0), cF = pl + PW[i] / 2;
    PL.push({ i, W: PW[i], D: Dp[i], zx0: z0, zx1: z1, zw, pl, cF, c0: cF - Dp[i], x0: cF - Dp[i] - PW[i] / 2 });
    cur = pl + PW[i] + JG;
  }
  const xs = xl0 - halfW;
  const xe = PL[4].cF + (N ? 2.0 : 2.5);
  const dashEnd = xe + Math.min(halfW - .4, 3.4);
  const peg1 = Math.max(xl0 - .6, xs + 4.5), peg2 = dashEnd + .1;
  K.strecke(xs, xe);
  const SPAN = xe - xs, db = e => e / SPAN, bX = x => K.bAt(x);
  const tbx = (xl, off) => Math.max(0, bX(xl - halfW + off));      // b, wenn die linke Kante xl um off Welteinheiten im Bild steht

  // ---------- Bogen ----------
  K.sheet(xl0 - 1.9, xe + halfW, LZ - 12, LZ + 3);

  // ---------- Hilfen ----------
  const sched = (pr, tOn, fade, tDim, dimB, dimTo) => {
    pr.on = tOn;
    pr.sched = b => sm((b - tOn) / fade) * (1 - (1 - dimTo) * sm((b - tDim) / dimB));
  };
  const leftU = (pr, m) => m + pr.w / 2 - pr.t.padX * pr.e;           // Mitte des Drucks für linksbündigen Textbeginn bei m
  // Wand/Block mit Klappflächen nach außen (wie K.box, aber mit eigener Ebene lv)
  function block(par, x0, x1, zf, zb, h, t0, d, o = {}) {
    const lv = o.lv || 3, col = o.col, W = x1 - x0, D = zf - zb, tw = d * .55, ts = d * .12;
    const op = { own: o.own, over: o.over, lv, fresh: !!o.fresh }, r = { W, D, h };
    r.fr = K.panel(par, [x0, zf], [x1, zf], [0, 1], t0, tw, Q, op); K.rect(r.fr, 0, 0, W, h, o.fcol || col);
    r.bk = K.panel(par, [x0, zb], [x1, zb], [0, -1], t0, tw, Q, op); K.rect(r.bk, 0, 0, W, h, col);
    r.lf = K.panel(par, [x0, zf], [x0, zb], [-1, 0], t0 + ts, tw, Q, op); K.rect(r.lf, 0, 0, D, h, col);
    r.rt = K.panel(par, [x1, zf], [x1, zb], [1, 0], t0 + ts, tw, Q, op); K.rect(r.rt, 0, 0, D, h, col);
    r.top = K.panel(r.bk, r.bk.uv(0, h), r.bk.uv(W, h), [0, -1], t0 + d * .5, d * .5, Q, { own: o.own, over: o.over, fresh: !!o.fresh });
    K.rect(r.top, 0, 0, W, D, o.roof || col);
    r.t1 = t0 + d;
    return r;
  }
  // flache Platte, die sich parallel hebt, mit Randstreifen (walls aus "flr"); lv: Ebene
  function slabv(x0, x1, zf, zb, h, t0, d, o = {}) {
    const lv = o.lv || 1, W = x1 - x0, D = zf - zb, w = o.walls || "", par = o.par || R, col = o.col;
    const op = { over: o.over, lv, nocut: true, nofold: true };
    if (w.includes("f")) K.rect(K.panel(par, [x0, zf], [x1, zf], [0, 1], t0, d, Q, op), 0, 0, W, h, o.fcol || col);
    if (w.includes("l")) K.rect(K.panel(par, [x0, zf], [x0, zb], [-1, 0], t0, d, Q, op), 0, 0, D, h, col);
    if (w.includes("r")) K.rect(K.panel(par, [x1, zf], [x1, zb], [1, 0], t0, d, Q, op), 0, 0, D, h, col);
    const L = F.lift(par, h, t0, d, { lv, over: o.over !== undefined ? o.over : .04 });
    F.poly(L, [[x0, zf], [x1, zf], [x1, zb], [x0, zb]], o.top || col, .5);
    return L;
  }
  const line = (nd, a, b, w) => F.line(nd, a, b, w || .22);
  // Gerüst und Bleistiftspur eines Teils (Gerüst vom Endzustand bei bAt, kurz vor dem Hochklappen)
  const bau = (tag, tUp, quiet, bAt) => {
    F.geruest({ tags: [tag], t0: Math.max(0, tUp - db(1.1)), t1: tUp, du: .03, a: .5, bAt });
    F.spur({ tags: [tag], quiet: quiet || [], a: .3 });
  };

  // ---------- Pflasterfelder: ganze Steine im Läuferverband, Reihe für Reihe ----------
  const stoneCol = (r, k) => { const h = (r * 5 + k * 7 + ((r * k) % 3)) % 10; return h < 6 ? ST[0] : h < 9 ? ST[1] : ST[2]; };
  // xa … xb: Feld (Hälften an den Rändern), zf: vordere Kante, nrows Reihen; bed: Handy, die Platte verlässt ihr Bett (c0, W, r)
  function field(tag, xa, xb, zf, nrows, o = {}) {
    if (xb - xa < .3) return;
    F.part(tag, tbx(xa, .2), db(2.2));
    const tl = (x, r) => {
      let t = bX(x - 3.0 + r * .28);
      if (o.bed && x < o.bed.c0 + o.bed.W / 2 + .3) t = Math.max(t, bX(x + o.bed.W / 2 - o.bed.r / 2 + .2 + r * .1));
      return Math.max(.002, t);
    };
    for (let r = 0; r < nrows; r++) {
      const odd = r % 2 === 1, za = zf - r * RH, zb = za - RH;
      const xsr = [xa]; let x = xa + (odd ? CW / 2 : CW);
      while (x < xb - .09) { xsr.push(x); x += CW; }
      xsr.push(xb);
      for (let k = 0; k < xsr.length - 1; k++) {
        const p = xsr[k], q = xsr[k + 1];
        const walls = (r === 0 ? "f" : "") + (k === 0 ? "l" : "") + (k === xsr.length - 2 ? "r" : "");
        slabv(p + GJ / 2, q - GJ / 2, za - GJ / 2, zb + GJ / 2, SHT, tl((p + q) / 2, r), db(.5), { walls, col: stoneCol(r, k), over: .06, lv: 1 });
      }
    }
  }

  // ---------- Druckbilder ----------
  const stackFace = (Wm, Hm, cwm, ap) => (x, W, H) => {
    const s = W / Wm, ph = ap * s;
    x.fillStyle = "#e6dccb"; x.fillRect(0, 0, W, H - ph);
    const rows = Math.max(3, Math.round((Hm - ap) / .11)), rh = (H - ph) / rows, cw = cwm * s;
    x.strokeStyle = ink(.34); x.lineWidth = Math.max(1.2, .01 * s);
    for (let r = 0; r <= rows; r++) { x.beginPath(); x.moveTo(0, r * rh); x.lineTo(W, r * rh); x.stroke(); }
    for (let r = 0; r < rows; r++) for (let X = (r % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, r * rh); x.lineTo(X, (r + 1) * rh); x.stroke(); }
    const y0 = H - ph;
    x.fillStyle = "#d9cdb5"; x.fillRect(0, y0, W, ph);
    x.fillStyle = ink(.1); x.fillRect(0, y0, W, ph * .22); x.fillRect(0, H - ph * .2, W, ph * .2);
    x.fillStyle = "#6f6a62";
    const bw = W * .2;
    x.fillRect(bw, y0 + ph * .24, W / 2 - bw / 2 - bw, ph * .54); x.fillRect(W / 2 + bw / 2, y0 + ph * .24, W / 2 - bw / 2 - bw, ph * .54);
    x.strokeStyle = ink(.45); x.lineWidth = Math.max(1.2, .008 * s); x.strokeRect(1, y0, W - 2, ph - 1);
  };
  const topFace = (Wm, cwm) => (x, W, H) => {
    const s = W / Wm, cw = cwm * s, rh = .3 * s;
    x.fillStyle = "#e6dccb"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.22); x.lineWidth = Math.max(1.2, .008 * s);
    for (let y = rh, r = 0; y < H - 2; y += rh, r++) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    for (let r = 0; r * rh < H; r++) for (let X = (r % 2 ? cw / 2 : cw); X < W - 2; X += cw) { x.beginPath(); x.moveTo(X, r * rh); x.lineTo(X, Math.min(H, (r + 1) * rh)); x.stroke(); }
  };
  const PX = 300;
  const decalOn = (nd, wm, hm, draw, u, v, on, side = -1, q = null, px = PX) =>
    K.onPanel(nd, K.decal(Math.max(8, Math.round(wm * px)), Math.max(8, Math.round(hm * px)), draw, wm, hm, on), u, v, side, q);

  // ============================================================================================================
  // Bauschild (G0): A-Rahmen, der Kamera zugewandt zurückgelehnt; Kicker, Kopf und die Produktseite
  // ============================================================================================================
  const TS = K.trage(sgnCF, SW, {});
  const sx0 = TS.c0 - SW / 2;
  const sCut = tbx(sx0, .0), sR0 = tbx(sx0, N ? .5 : .7), sR1 = sR0 + db(N ? 1.6 : 2.2);
  F.part("schild", sCut, db(2.0));
  const spar = TS.node(R);
  const board = K.panel(spar, [sx0, ZP], [sx0 + SW, ZP], [0, -1], sR0, sR1 - sR0, UP, { over: .04, lv: 2 });
  K.rect(board, 0, 0, SW, SHh, BOARD, .5);
  // Rahmenlinien, Kopfleiste
  line(board, board.uv(.14, .14), board.uv(SW - .14, .14)); line(board, board.uv(SW - .14, .14), board.uv(SW - .14, SHh - .14));
  line(board, board.uv(SW - .14, SHh - .14), board.uv(.14, SHh - .14)); line(board, board.uv(.14, SHh - .14), board.uv(.14, .14));
  // Stützen (A-Rahmen): hinten angeklappt, bis zum Boden
  {
    const vh = .5 * SHh, e1 = 1.1, yh = vh * Math.sin(UP), Ll = yh / Math.sin(e1), lw = .26;
    for (const u0 of [.5, SW - .5 - lw]) {
      const leg = K.panel(board, board.uv(u0, vh), board.uv(u0 + lw, vh), [0, -1], sR0 + db(.25), sR1 - sR0, -(UP + e1), { over: .02 });
      K.rect(leg, 0, 0, lw, Ll, LEGC, .5);
    }
  }
  // Inhalt
  const tT = sR1 + db(.15);
  kp.k.on = tT; kp.h.on = tT;
  K.onPanel(board, kp.k, leftU(kp.k, .42), yKick, 1, [0, -1]);
  K.onPanel(board, kp.h, leftU(kp.h, .42), yHead, 1, [0, -1]);
  {
    const pr = K.decal(Math.round(IW * PX), Math.round(IH * PX), (x, W, H) => {
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
      const im = BMP.prod;
      if (im) x.drawImage(im, 0, 0, W, H); else produktkarte(x, W, H);
      x.strokeStyle = ink(.55); x.lineWidth = 3; x.strokeRect(1.5, 1.5, W - 3, H - 3);
    }, IW, IH, tT + db(.2));
    K.onPanel(board, pr, SW / 2, yImg, 1, [0, -1]);
  }
  bau("schild", sR0, [board], sR1);

  // ============================================================================================================
  // Schnur: zwei Schnurnägel, der Faden läuft dazwischen leicht erhöht
  // ============================================================================================================
  for (const [k, px] of [[1, peg1], [2, peg2]]) {
    F.part("pflock" + k, tbx(px, .3), db(.8));
    block(R, px - .06, px + .06, FZ + .06, FZ - .06, .22, tbx(px, .9), db(.6), { lv: 3, col: WOOD });
  }

  // ============================================================================================================
  // Platten mit den Sätzen G1 bis G5: schneiden, aufstellen, lesen, verlegen
  // ============================================================================================================
  const PINFO = [];
  PL.forEach(p => {
    const i = p.i, W = p.W, D = p.D, s = S[i], x0 = p.x0;
    const T = K.trage(p.cF, s.tw, {});
    const xin = x0 - halfW;
    const tCut = Math.max(0, bX(xin)), tR0 = bX(xin + (N ? .6 : 1.1)), tR1 = tR0 + db(N ? 1.5 : 1.9);
    const tF0 = D > 0 ? Math.max(T.bB + db(.05), tR1 + db(.8)) : bX(p.cF + .3);
    const tF1 = tF0 + db(N ? 1.3 : 1.7);
    const total = tF1 - tR0, rr_ = (tR1 - tR0) / total, ff = (tF0 - tR0) / total;
    // Aufstehen mit kurzem Nachschwingen, Halten, dann flach in den Weg legen (eine Scharnier-Bewegung)
    const ease = x => {
      const up = x <= 0 ? 0 : x >= rr_ ? 1 : K.mech(x / rr_, .05);
      const u = (x - ff) / (1 - ff), dn = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
      return up * (1 - dn);
    };
    const tag = "platte" + (i + 1);
    F.part(tag, tCut, db(1.8));
    const par = T.node(R);
    const nd = K.panel(par, [x0, ZP], [x0 + W, ZP], [0, -1], tR0, total, UP, { ease, lv: 2, over: .04 });
    K.rect(nd, 0, 0, W, HP, PLC, .5);
    const ins = .1;
    line(nd, nd.uv(ins, ins), nd.uv(W - ins, ins)); line(nd, nd.uv(W - ins, ins), nd.uv(W - ins, HP - ins));
    line(nd, nd.uv(W - ins, HP - ins), nd.uv(ins, HP - ins)); line(nd, nd.uv(ins, HP - ins), nd.uv(ins, ins));
    // Satz: erst wenn die Platte steht, nach dem Verlegen ruhig mit geringerer Deckkraft
    sched(s, tR1 + db(.1), db(.35), tF0, db(1.0), .5);
    K.onPanel(nd, s, leftU(s, (W - s.tw) / 2), HP / 2, 1, [0, -1]);
    bau(tag, tR0, [nd], tR1 + db(.3));
    PINFO.push({ i, T, x0, tR0, tR1, tF0, tF1, nd, ease, total });
    // Felder im Bett: Zone vor der Platte (Desktop: zwischen den Platten, Handy: das Bett der Platte, nach ihrem Wegfahren)
    if (p.zw > 0 && (N || i !== 2)) field("feld" + (i + 1), p.zx0, p.zx1, Z0, NRW, N && D > 0 ? { bed: { c0: T.c0, W, r: Math.min(D, halfW * .5) } } : {});
  });

  // ============================================================================================================
  // Bilder zu den Sätzen
  // ============================================================================================================
  // Lage: Desktop zwischen den Platten (Zone vor Platte k), Handy hinter der Platte (gleiches x, weiter hinten)
  const picX = k => N ? PL[k].cF : (PL[k + 1].zx0 + PL[k + 1].zx1) / 2;          // k: 1 = G2, 2 = G3, 3 = G4
  const picZ = N ? ZB - .45 : Z0;                                                // vordere Kante des Bilds

  // ---------- G1 Baustofflager: Pflastersteine, Terrassenplatten, Stufen (hinter dem Weg) ----------
  {
    const cx = N ? PL[0].cF : (PL[1].zx0 + PL[1].zx1) / 2, zf = ZB - (N ? .9 : 3.0), tag = "lager";
    const t = tbx(cx - 2.2, .9);
    F.part(tag, tbx(cx - 2.2, .1), db(1.8));
    const w1 = N ? 1.15 : 1.4, w2 = N ? 1.2 : 1.5, w3 = N ? 1.1 : 1.4, gx = N ? .12 : .3;
    const xa = cx - (w1 + w2 + w3 + 2 * gx) / 2;
    // Pflastersteine (Palette im Läuferverband)
    const a = block(R, xa, xa + w1, zf, zf - .8, .95, t, db(1.4), { lv: 2, col: PALC });
    decalOn(a.fr, w1, .95, stackFace(w1, .95, .6, .17), w1 / 2, .475, a.t1);
    decalOn(a.rt, .8, .95, stackFace(.8, .95, .3, .17), .4, .475, a.t1);
    decalOn(a.top, w1, .8, topFace(w1, .6), w1 / 2, .4, a.t1, -1, [0, 1]);
    // Terrassenplatten (dünne Großformate, hochkant gestapelt wie Lagen)
    const xb = xa + w1 + gx;
    const b = block(R, xb, xb + w2, zf, zf - .9, .62, t + db(.3), db(1.4), { lv: 2, col: c3("#dcd2c1") });
    decalOn(b.fr, w2, .62, (x, W, H) => {
      x.fillStyle = "#e3dacb"; x.fillRect(0, 0, W, H); x.strokeStyle = ink(.4); x.lineWidth = Math.max(1.2, .01 * W / w2);
      const n = 7; for (let r = 0; r <= n; r++) { x.beginPath(); x.moveTo(0, r * H / n); x.lineTo(W, r * H / n); x.stroke(); }
    }, w2 / 2, .31, b.t1);
    decalOn(b.top, w2, .9, (x, W, H) => { x.fillStyle = "#e9e0d1"; x.fillRect(0, 0, W, H); x.strokeStyle = ink(.22); x.lineWidth = 2; x.strokeRect(W * .06, H * .06, W * .88, H * .88); }, w2 / 2, .45, b.t1, -1, [0, 1]);
    // Stufen: drei Blöcke, jeder höher und weiter hinten
    const xc = xb + w2 + gx;
    for (let k = 0; k < 3; k++) {
      slabv(xc, xc + w3, zf - k * .3, zf - 1.05, .18 * (k + 1), t + db(.6 + k * .25), db(1.0), { walls: "fl" + (k === 2 ? "r" : ""), col: ST[k % 2 ? 1 : 0], top: ST[2], lv: 2 + k, over: .05 });
    }
    bau(tag, t, [], 1);
  }

  // ---------- G2 Fläche in ganze Steine ----------
  {
    const cx = picX(1), zf = picZ, tag = "flaeche", nr = N ? 9 : NRW;
    const nc = N ? 5 : 7, cw0 = nc * CW, xc0 = cx - cw0 / 2;          // Kontur: nc Steine breit, nr − ½ Reihen tief
    const cd = (nr - .5) * RH;
    F.part(tag, tbx(xc0 - CW, .3), db(2.4));
    // Steine: gerade Reihen ab Konturkante (nc Stück), ungerade Reihen um einen halben Stein versetzt (nc + 1 Stück): die Ränder ragen über die Kontur
    const tl = (x, r) => Math.max(.002, bX(x - 3.0 + r * .24));
    for (let r = 0; r < nr; r++) {
      const odd = r % 2 === 1, za = zf - r * RH, n = odd ? nc + 1 : nc, xa = odd ? xc0 - CW / 2 : xc0;
      for (let k = 0; k < n; k++) {
        const p = xa + k * CW;
        slabv(p + GJ / 2, p + CW - GJ / 2, za - GJ / 2, za - RH + GJ / 2, SHT, tl(p + CW / 2, r), db(.5), { walls: (r === 0 ? "f" : "") + (k === 0 ? "l" : "") + (k === n - 1 ? "r" : ""), col: stoneCol(r, k), over: .06, lv: 1 });
      }
    }
    // gestrichelte Kontur der bestellten Fläche mit Eckmarken, auf der Höhe der Steine
    const tc = tl(xc0 + cw0 / 2, nr * .5);
    const car = F.lift(R, SHT + .004, tc, db(.5), { lv: 5, over: .06 });
    const x1 = xc0 + cw0, z1 = zf - cd, segs = [[[xc0, zf], [x1, zf]], [[x1, zf], [x1, z1]], [[x1, z1], [xc0, z1]], [[xc0, z1], [xc0, zf]]];
    F.sketch(car, segs, tbx(xc0, .6), db(2.0), { a: .8, dash: true, dy: .002 });
    const tick = .3, cm = [];
    for (const [x, z, dx, dz] of [[xc0, zf, -1, 1], [x1, zf, 1, 1], [xc0, z1, -1, -1], [x1, z1, 1, -1]]) {
      cm.push([[x + dx * .12, z], [x + dx * (.12 + tick), z]], [[x, z + dz * .12], [x, z + dz * (.12 + tick)]]);
    }
    F.sketch(R, cm, tbx(xc0, .6), db(2.0), { a: .6, dy: .0011 });
    F.sketch(R, cm, tbx(xc0, .6), db(2.0), { a: .45, dy: .0012 });
  }

  // ---------- G3 Palette auf der Plattformwaage, Frachtzettel mit leerem Feld PLZ ----------
  {
    const cx = picX(2), zf = picZ - .2, tag = "waage";
    const wP = N ? 1.9 : 2.2, wH = N ? .6 : .8, wZ = N ? 1.0 : 1.1, gx = N ? .2 : .25;
    const tot = wP + gx + wH + gx + wZ, xa = cx - tot / 2;
    const t = tbx(xa, .9);
    F.part(tag, tbx(xa, .1), db(1.8));
    // Plattform (hebt sich), darauf die Palette mit Steinen
    const pf = slabv(xa, xa + wP, zf, zf - 1.3, .14, t, db(1.2), { walls: "flr", col: STEEL, top: STEEL, lv: 3 });
    for (const dx of [.12, wP - .12]) line(pf, [xa + dx, zf - .1], [xa + dx, zf - 1.2], .22);
    line(pf, [xa + .12, zf - .1], [xa + wP - .12, zf - .1], .22); line(pf, [xa + .12, zf - 1.2], [xa + wP - .12, zf - 1.2], .22);
    const pw = wP - (N ? .4 : .5), px0 = xa + (wP - pw) / 2, ph = N ? .85 : .95, tp = t + db(1.1);
    const pal = block(pf, px0, px0 + pw, zf - .3, zf - 1.1, ph, tp, db(1.5), { lv: 4, col: PALC, fresh: true });
    decalOn(pal.fr, pw, ph, stackFace(pw, ph, .6, .17), pw / 2, ph / 2, pal.t1);
    decalOn(pal.rt, .8, ph, stackFace(.8, ph, .3, .17), .4, ph / 2, pal.t1);
    decalOn(pal.lf, .8, ph, stackFace(.8, ph, .3, .17), .4, ph / 2, pal.t1);
    decalOn(pal.top, pw, .8, topFace(pw, .6), pw / 2, .4, pal.t1, -1, [0, 1]);
    // Anzeigegehäuse mit Skala (ohne Zahl) und Zeiger
    const hx = xa + wP + gx, hh = N ? 1.15 : 1.3, th = t + db(.5);
    const hs = block(R, hx, hx + wH, zf - .5, zf - 1.1, hh, th, db(1.3), { lv: 3, col: HALLC });
    const dr = wH * .38, dcu = wH / 2, dcv = hh - dr - .16;
    decalOn(hs.fr, wH, hh, (x, W, H) => {
      const s = W / wH, cx_ = dcu * s, cy = (hh - dcv) * s, rd = dr * s;
      x.fillStyle = "#f6f3ec"; x.fillRect(0, 0, W, H);
      x.strokeStyle = ink(.5); x.lineWidth = Math.max(1.5, .012 * s); x.strokeRect(.04 * s, .04 * s, W - .08 * s, H - .08 * s);
      x.fillStyle = "#fffdf8"; x.beginPath(); x.arc(cx_, cy, rd, 0, 7); x.fill(); x.stroke();
      for (let k = 0; k <= 10; k++) {
        const a = Math.PI * (1.15 - 1.3 * k / 10), big = k % 5 === 0, r1 = rd * (big ? .66 : .78), r2 = rd * .9;
        x.strokeStyle = ink(big ? .7 : .4); x.lineWidth = Math.max(1.2, (big ? .016 : .009) * s);
        x.beginPath(); x.moveTo(cx_ + Math.cos(a) * r1, cy - Math.sin(a) * r1); x.lineTo(cx_ + Math.cos(a) * r2, cy - Math.sin(a) * r2); x.stroke();
      }
      x.fillStyle = ink(.5); x.fillRect(.14 * s, H - .24 * s, W - .28 * s, .05 * s);
    }, hh > 0 ? wH / 2 : 0, hh / 2, hs.t1, -1, null, 260);
    // Zeiger: dreht an der Front um die Achse der Skala (Zeigerlänge ~ Skalenradius), schlägt nach dem Auflegen der Palette aus
    const ndl = F.spin(hs.fr, hs.fr.uv(dcu, dcv), 1.0, tp + db(1.2), db(1.8), { lv: 6, ang0: -.95, ease: x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-5 * x) * Math.cos(11 * x) });
    {
      const L = dr * .82, c = hs.fr.uv(dcu, dcv), n = hs.fr.uv(dcu + L, dcv), n2 = hs.fr.uv(dcu - .09 * dr, dcv);
      const wd = .022, a = hs.fr.uv(dcu + L, dcv + wd), b = hs.fr.uv(dcu + L, dcv - wd), cc = hs.fr.uv(dcu - .09 * dr, dcv - wd), d_ = hs.fr.uv(dcu - .09 * dr, dcv + wd);
      F.poly(ndl, [d_, cc, b, a], c3("#303033"), 0);
      void c; void n; void n2;
    }
    // Frachtzettel: Karte steht an der Schnur, zurückgelehnt; Feld PLZ bleibt leer
    const zx = hx + wH + gx, tz = t + db(1.0), zh = N ? 1.2 : 1.35;
    const zt = K.panel(R, [zx, zf - .1], [zx + wZ, zf - .1], [0, -1], tz, db(1.3), UP, { lv: 3, over: .05 });
    K.rect(zt, 0, 0, wZ, zh, c3("#fbf9f4"), .5);
    decalOn(zt, wZ, zh, (x, W, H) => {
      const s = W / wZ;
      x.fillStyle = ink(.5); x.font = `500 ${.095 * s}px "Schibsted Grotesk", sans-serif`; x.textBaseline = "middle"; x.letterSpacing = (.012 * s) + "px";
      x.fillText("FRACHT", .12 * s, .16 * s);
      x.strokeStyle = ink(.3); x.lineWidth = Math.max(1.2, .008 * s);
      x.beginPath(); x.moveTo(.12 * s, .27 * s); x.lineTo(W - .12 * s, .27 * s); x.stroke();
      x.fillStyle = ink(.5); x.font = `500 ${.085 * s}px "Schibsted Grotesk", sans-serif`;
      x.fillText("PLZ", .12 * s, .42 * s);
      const bw = (W - .24 * s - 4 * .05 * s) / 5;
      for (let k = 0; k < 5; k++) { x.strokeStyle = ink(.6); x.lineWidth = Math.max(1.4, .012 * s); x.strokeRect(.12 * s + k * (bw + .05 * s), .52 * s, bw, bw * 1.15); }
      x.strokeStyle = ink(.25); x.lineWidth = Math.max(1.2, .008 * s);
      for (let k = 0; k < 2; k++) { x.beginPath(); x.moveTo(.12 * s, (H / s - .3 - k * .2) * s); x.lineTo(W - .12 * s, (H / s - .3 - k * .2) * s); x.stroke(); }
    }, wZ / 2, zh / 2, tz + db(1.0), 1, [0, -1]);
    bau(tag, t, [zt], 1);
  }

  // ---------- G4 Händlerlager: Halle mit Rolltor, davor die Palette ----------
  {
    const cx = picX(3), HW_ = N ? 2.8 : 3.4, HD = 1.5, HH = 1.55, tag = "lager2";
    const zfH = ZB - HH - (N ? .45 : .2), zbH = zfH - HD, x0 = cx - HW_ / 2, x1 = x0 + HW_;
    const t = tbx(x0 - 1.0, .9), d = db(1.7), tw_ = d * .55, op = { lv: 2, over: .04 };
    F.part(tag, tbx(x0 - 1.0, .1), db(2.0));
    const dw = N ? 1.2 : 1.5, dh = 1.15, du0 = (HW_ - dw) / 2, du1 = du0 + dw;
    // Front: links, rechts, Sturz; die Tür ist eigenes Teil im Ausschnitt und klappt nach innen hoch
    const fr = K.panel(R, [x0, zfH], [x1, zfH], [0, 1], t, tw_, Q, op);
    K.rect(fr, 0, 0, du0, HH, HALLC); K.rect(fr, du1, 0, HW_, HH, HALLC); K.rect(fr, du0, dh, du1, HH, HALLC);
    const bk = K.panel(R, [x0, zbH], [x1, zbH], [0, -1], t, tw_, Q, op); K.rect(bk, 0, 0, HW_, HH, HALLC);
    const lf = K.panel(R, [x0, zfH], [x0, zbH], [-1, 0], t + d * .12, tw_, Q, op); K.rect(lf, 0, 0, HD, HH, HALLC);
    const rt = K.panel(R, [x1, zfH], [x1, zbH], [1, 0], t + d * .12, tw_, Q, op); K.rect(rt, 0, 0, HD, HH, HALLC);
    const top = K.panel(bk, bk.uv(0, HH), bk.uv(HW_, HH), [0, -1], t + d * .5, d * .5, Q, { over: .04 });
    K.rect(top, 0, 0, HW_, HD, ROOFC);
    const tD = t + d * 1.3, dD_ = db(1.5);
    const door = K.panel(fr, fr.uv(du0, dh), fr.uv(du1, dh), [0, -1], tD, dD_, Q * .98, { lv: 4, over: 0 });
    K.rect(door, 0, 0, dw, dh, c3("#d9d5cc"));
    // Tor: Lamellen; Halle: Schriftfeld „Händler“ über dem Tor; innen dunkel (sichtbar, wenn das Tor offen ist)
    decalOn(door, dw, dh, (x, W, H) => {
      const s = W / dw; x.fillStyle = "#d9d5cc"; x.fillRect(0, 0, W, H);
      x.strokeStyle = ink(.42); x.lineWidth = Math.max(1.5, .012 * s); x.strokeRect(1, 1, W - 2, H - 2);
      x.strokeStyle = ink(.26); for (let k = 1; k < 8; k++) { x.beginPath(); x.moveTo(0, k * H / 8); x.lineTo(W, k * H / 8); x.stroke(); }
    }, dw / 2, dh / 2, tD - db(.2), -1, [0, 1]);
    decalOn(bk, HW_, HH, (x, W, H) => {
      const g = x.createLinearGradient ? x.createLinearGradient(0, 0, 0, H) : null;
      if (g) { g.addColorStop(0, "#8f897d"); g.addColorStop(1, "#6e695f"); x.fillStyle = g; } else x.fillStyle = "#7d786d";
      x.fillRect(0, 0, W, H);
    }, HW_ / 2, HH / 2, t, 1, null, 120);
    const lbl = K.print(["Händler"], EC * .8, tD - db(.3), { font: "kicker", col: "#5f5f63", align: "center" });
    K.onPanel(fr, lbl, HW_ / 2, (dh + HH) / 2, -1);
    decalOn(fr, HW_, .06, (x, W, H) => { x.fillStyle = ink(.12); x.fillRect(0, 0, W, H); }, HW_ / 2, HH - .03, t + tw_, -1, null, 80);
    bau(tag, t, [fr], 1);
    // Palette davor (auf dem Hof, links vom Tor, ragt halb davor)
    const pw = N ? .95 : 1.1, ph = .75, pxl = x0 + du0 - pw * .55, tpl = t + d + db(.2);
    F.part("palette2", tpl - db(.2), db(1.4));
    const pal = block(R, pxl, pxl + pw, zfH + 1.0, zfH + .3, ph, tpl, db(1.4), { lv: 5, col: PALC });
    decalOn(pal.fr, pw, ph, stackFace(pw, ph, .6, .15), pw / 2, ph / 2, pal.t1);
    decalOn(pal.rt, .7, ph, stackFace(.7, ph, .3, .15), .35, ph / 2, pal.t1);
    decalOn(pal.top, pw, .7, topFace(pw, .6), pw / 2, .35, pal.t1, -1, [0, 1]);
    bau("palette2", tpl, [], 1);
  }

  // ---------- G5: der Weg läuft als gestrichelte Kontur weiter ----------
  {
    const p5 = PL[4], xa = p5.pl + p5.W + JG, xb = dashEnd, tag = "weiter";
    const t = tbx(xa, .5), d = db(2.4);
    // Ränder (vorn, hinten) und Plattenfugen als Strich-Kontur, zeichnet sich nach rechts
    const segs = [[[xa, Z0], [xb, Z0]], [[xa, ZB], [xb, ZB]], [[xb, Z0], [xb, ZB]]];
    let xx = xa + p5.W; while (xx < xb - .5) { segs.push([[xx, Z0], [xx, ZB]]); xx += p5.W + JG; }
    F.sketch(R, segs, t, d, { a: .7, dash: true, dy: .0014 });
    // gestrichelte Steinfugen im ersten Stück
    const g = [];
    for (let r = 1; r < NRW; r++) g.push([[xa, Z0 - r * RH], [Math.min(xb, xa + 2.4), Z0 - r * RH]]);
    F.sketch(R, g, t + db(.4), d, { a: .35, dash: true, dy: .0012 });
    void tag;
  }

  // ---------- Bauzaun im Hintergrund (füllt das obere Drittel) ----------
  {
    const zf = Z0 - 8.2, zw = 2.6, h = 1.15;
    const xa = xl0 + (N ? 1.5 : 7.0), xb = dashEnd - 1.0;
    let k = 0;
    for (let x = xa; x + zw <= xb; x += zw + .06, k++) {
      const tg = "zaun" + k;
      F.part(tg, tbx(x, .1), db(1.2));
      const fz = K.panel(R, [x, zf], [x + zw, zf], [0, -1], tbx(x, 1.1), db(1.2), Q, { lv: 2, over: .04 });
      K.rect(fz, 0, 0, zw, h, ZAUN, .4);
      decalOn(fz, zw, h, (c, W, H) => {
        const s = W / zw; c.strokeStyle = ink(.28); c.lineWidth = Math.max(1.2, .007 * s);
        const st = .16 * s; c.beginPath();
        for (let q = -H; q < W + H; q += st) { c.moveTo(q, 0); c.lineTo(q + H, H); c.moveTo(q + H, 0); c.lineTo(q, H); }
        c.stroke();
        c.strokeStyle = ink(.5); c.lineWidth = Math.max(1.5, .014 * s); c.strokeRect(.03 * s, .03 * s, W - .06 * s, H - .06 * s);
      }, zw / 2, h / 2, tbx(x, 1.1) + db(.9), 1, [0, -1], 110);
    }
  }

  // ---------- Faden: die Schnur zwischen den Nägeln, leicht erhöht ----------
  const faden = [[peg1 - .35, .004, FZ], [peg1, .08, FZ], [peg2, .08, FZ], [peg2 + .3, .004, FZ], [xe + 4, .004, FZ]];

  return {
    strecke: [xs, xe], lineZ: LZ,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: 2 },
    faden,
    stops: [{ name: "g0", prints: [kp.k, kp.h] }, ...S.map((s, i) => ({ name: "g" + (i + 1), prints: [s] }))]
  };
}
