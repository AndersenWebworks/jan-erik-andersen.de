// Szene Werdegang (Lesebahn, gleichmäßige Fahrt): die Treppe ist das Ding, ihre Setzstufen sind der Text („Text ist das Bauteil“).
// Aufbau: Eine Treppe steigt in Fahrtrichtung (+x) auf. Jede Stufe ist eine Platte, die sich um eine Stufenhöhe über die Stufe davor hebt
// (Teleskop); danach klappt ihre Setzstufe (die Vorderwand, senkrecht) hoch. Auf der Setzstufe stehen Jahr (Grotesk, klein), Station
// (Newsreader, groß) und Zusatz (Lesetext); auf dem Tritt dahinter steht das Faltzeichen der Station. Die Bahn steigt mit (def.rise),
// die Kamera mit; nach der Treppe läuft die oberste Platte als Ebene weiter (die folgenden Szenen liegen um rise.h höher).
// Der rote Faden klettert die Treppe hinauf: er läuft vor den Setzstufen an ihrer Oberkante und steigt am linken Rand jeder Setzstufe schräg zur nächsten.
// Handy: die Stufe schiebt sich teleskopartig aus der vorigen heraus und fährt dabei mit der Kamera mit (K.trage), bis sie einrastet.
// Die Zeichen auf den Tritten stammen aus der früheren Fassung (entwurf-2026-11/werdegang/werdegang.js), HTK steht jetzt vor Games.

const ink = a => `rgba(48,48,51,${a})`;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// Einträge wörtlich nach DREHBUCH-LESEBAHN.md, Abschnitt 14 (R1 bis R8), von unten (älteste) nach oben (neueste)
const ROWS = [
  { yr: "2000 bis 2006", st: "Pixel Arrays", ds: "erste Selbstständigkeit" },
  { yr: "2007 bis 2010", st: "HTK Hamburg", ds: "Zertifikat Multimedia Design" },
  { yr: "2010 bis 2017", st: "Games", ds: "Spielprototypen in Flash und Haxe, danach Qualitätssicherung bei Goodgame Studios und Deep Silver FISHLABS" },
  { yr: "seit 2010", st: "Freiberufliche Webprojekte", ds: "seit 2018 als Andersen Webworks" },
  { yr: "2017", st: "YOOtheme", ds: "Support Management" },
  { yr: "2017 bis 2023", st: "Tangram Werbeagentur", ds: "Frontend-Entwicklung, unter anderem für Nissen, BIG Arbeitsschutz und EMPORE" },
  { yr: "2023 bis 2025", st: "Runden Group", ds: "WBG Pooling und viele weitere Websites und Anwendungen der Firmengruppe" },
  { yr: "seit 2023", st: "Gerwing", ds: "Umsetzung und laufende Betreuung des Onlineshops" }
];
const KICKER = "Acht Stationen, die jüngste oben", KOPF = "Werdegang";

// ---------- Drucke der Zeichen (Canvas, oben = Oberkante des Teils) ----------
// Stufe 1, Pixel Arrays: Kachel mit feinem Raster und einem Mauszeiger aus Pixeln
const CURSOR = ["1000000000", "1100000000", "1110000000", "1111000000", "1111100000", "1111110000", "1111111000", "1111100000", "1101100000", "1000110000", "0000110000"];
function drawPixel(x, W, H) {
  const n = 12, c = W / n;
  x.strokeStyle = ink(.12); x.lineWidth = Math.max(1, W / 400);
  for (let i = 1; i < n; i++) { x.beginPath(); x.moveTo(i * c, 0); x.lineTo(i * c, H); x.stroke(); x.beginPath(); x.moveTo(0, i * c); x.lineTo(W, i * c); x.stroke(); }
  x.fillStyle = ink(.82);
  CURSOR.forEach((row, r) => [...row].forEach((v, k) => { if (v === "1") x.fillRect((k + 3) * c + 1, (r + .5) * c + 1, c - 2, c - 2); }));
}
// Stufe 2, Games: Steuerkreuz, vier Knöpfe, zwei Pillen (Fläche 1,25 × 0,62)
function drawPad(x, W, H) {
  const s = W / 1.25, Y = v => (.62 - v) * s;
  x.fillStyle = ink(.72);
  const cx = .3 * s, cy = Y(.42), a = .055 * s, b = .16 * s;
  x.fillRect(cx - b / 2, cy - a / 2, b, a); x.fillRect(cx - a / 2, cy - b / 2, a, b);
  x.strokeStyle = ink(.7); x.lineWidth = .016 * s;
  for (const [dx, dy] of [[0, -.07], [.07, 0], [0, .07], [-.07, 0]]) { x.beginPath(); x.arc(.95 * s + dx * s, Y(.42) + dy * s, .032 * s, 0, Math.PI * 2); x.stroke(); }
  x.fillStyle = ink(.4);
  rr(x, .5 * s, Y(.47), .09 * s, .03 * s, .015 * s); x.fill(); rr(x, .66 * s, Y(.47), .09 * s, .03 * s, .015 * s); x.fill();
}
// Stufe 3, HTK: Urkunde mit Rahmen, Titelzeilen, Text, Unterschrift, Siegel
function drawCert(x, W, H) {
  const s = W / 1.0;
  x.strokeStyle = ink(.4); x.lineWidth = .012 * s; x.strokeRect(.05 * s, .05 * s, W - .1 * s, H - .1 * s);
  x.strokeStyle = ink(.2); x.lineWidth = .006 * s; x.strokeRect(.075 * s, .075 * s, W - .15 * s, H - .15 * s);
  x.fillStyle = ink(.7); rr(x, .3 * s, .14 * s, .4 * s, .045 * s, .01 * s); x.fill();
  x.fillStyle = ink(.4); rr(x, .38 * s, .22 * s, .24 * s, .025 * s, .01 * s); x.fill();
  x.fillStyle = ink(.22); for (const [x0, w, y] of [[.18, .64, .32], [.22, .56, .37], [.26, .48, .42]]) { rr(x, x0 * s, y * s, w * s, .016 * s, .008 * s); x.fill(); }
  x.strokeStyle = ink(.45); x.lineWidth = .008 * s; x.beginPath(); x.moveTo(.16 * s, .58 * s); x.lineTo(.46 * s, .58 * s); x.stroke();
  x.beginPath(); x.moveTo(.18 * s, .56 * s); x.bezierCurveTo(.24 * s, .48 * s, .28 * s, .6 * s, .33 * s, .53 * s); x.bezierCurveTo(.36 * s, .5 * s, .39 * s, .57 * s, .43 * s, .54 * s); x.stroke();
  x.fillStyle = ink(.18); x.beginPath(); x.moveTo(.71 * s, .58 * s); x.lineTo(.68 * s, .68 * s); x.lineTo(.72 * s, .65 * s); x.lineTo(.74 * s, .6 * s); x.fill();
  x.beginPath(); x.moveTo(.77 * s, .58 * s); x.lineTo(.8 * s, .68 * s); x.lineTo(.76 * s, .65 * s); x.lineTo(.74 * s, .6 * s); x.fill();
  x.fillStyle = ink(.3); x.beginPath(); x.arc(.74 * s, .53 * s, .07 * s, 0, Math.PI * 2); x.fill();
  x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = .006 * s; x.beginPath(); x.arc(.74 * s, .53 * s, .05 * s, 0, Math.PI * 2); x.stroke();
}
// Website im Kleinen (Laptop, Fenster, Shop): Koordinaten 0…1 der Fläche
function drawSite(x, X, Y, W, H, o = {}) {
  x.fillStyle = "#ffffff"; x.fillRect(X, Y, W, H);
  const P = (u, v, w, h, a, r = 0) => { x.fillStyle = ink(a); rr(x, X + u * W, Y + v * H, w * W, h * H, r * Math.min(W, H)); x.fill(); };
  P(.06, .07, .16, .06, .8, .01); for (let i = 0; i < 3; i++) P(.6 + i * .12, .085, .08, .03, .35, .015);
  x.fillStyle = ink(.1); x.fillRect(X, Y + .19 * H, W, Math.max(1, .006 * H));
  if (o.shop) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { P(.08 + c * .45, .26 + r * .36, .39, .22, .09); P(.08 + c * .45, .5 + r * .36, .26, .035, .45, .01); }
    return;
  }
  P(.06, .28, .42, .07, .8, .01); P(.06, .38, .3, .07, .8, .01);
  for (let i = 0; i < 3; i++) P(.06, .52 + i * .06, [.4, .37, .26][i], .025, .3, .012);
  P(.06, .74, .14, .07, .65, .02);
  P(.56, .26, .38, .5, .08);
  x.strokeStyle = ink(.28); x.lineWidth = Math.max(1, .008 * W); x.beginPath();
  x.moveTo(X + .56 * W, Y + .76 * H); x.lineTo(X + .68 * W, Y + .5 * H); x.lineTo(X + .78 * W, Y + .64 * H); x.lineTo(X + .85 * W, Y + .56 * H); x.lineTo(X + .94 * W, Y + .76 * H); x.stroke();
}
// Stufe 4: Bildschirm des Laptops (Rahmen dunkel, darin die Website), Tastatur auf der Grundplatte
function drawScreen(x, W, H) {
  const bz = .045 * W;
  x.fillStyle = ink(.86); rr(x, 0, 0, W, H, bz * .6); x.fill();
  drawSite(x, bz, bz, W - 2 * bz, H - 2.4 * bz);
}
function drawKeys(x, W, H) {
  x.fillStyle = ink(.16);
  const cols = 12, kw = W * .82 / cols, x0 = W * .09;
  for (let r = 0; r < 4; r++) for (let c = 0; c < cols; c++) { rr(x, x0 + c * kw + kw * .1, H * (.1 + r * .1), kw * .8, H * .075, kw * .12); x.fill(); }
  rr(x, x0 + kw * 3, H * .5, kw * 6, H * .075, kw * .12); x.fill();
  x.strokeStyle = ink(.22); x.lineWidth = Math.max(1, W * .004); rr(x, W * .36, H * .66, W * .28, H * .26, W * .015); x.stroke();
}
// Stufe 5: Sprechblasen (Frage mit Zeilen, Antwort mit drei Punkten)
function drawBubble1(x, W, H) {
  const s = W / 1.0, Y = v => (.62 - v) * s;
  x.fillStyle = ink(.5);
  [[.22, .5, .62], [.22, .4, .5], [.22, .3, .3]].forEach(([u, v, w]) => { rr(x, u * s, Y(v), w * s, .035 * s, .017 * s); x.fill(); });
}
function drawBubble2(x, W, H) {
  const s = W / .72, Y = v => (.5 - v) * s;
  x.fillStyle = ink(.6);
  for (let i = 0; i < 3; i++) { x.beginPath(); x.arc((.22 + i * .12) * s, Y(.3), .03 * s, 0, Math.PI * 2); x.fill(); }
}
// Stufe 6: Tangram, sieben Teile in einem Quadrat (Einheit 0…4), Fugen weiß
const TANGRAM = [
  [[[0, 0], [4, 0], [2, 2]], .34], [[[0, 0], [2, 2], [0, 4]], .22], [[[4, 0], [4, 2], [3, 1]], .5],
  [[[3, 1], [4, 2], [3, 3], [2, 2]], .14], [[[2, 2], [3, 3], [1, 3]], .42], [[[0, 4], [1, 3], [3, 3], [2, 4]], .28], [[[2, 4], [4, 2], [4, 4]], .1]
];
function drawTangram(x, W, H) {
  const s = W / 4;
  x.lineJoin = "round"; x.strokeStyle = "#ffffff"; x.lineWidth = s * .09;
  for (const [pts, a] of TANGRAM) {
    x.beginPath(); pts.forEach(([u, v], i) => x[i ? "lineTo" : "moveTo"](u * s, v * s)); x.closePath();
    x.fillStyle = ink(a + .08); x.fill(); x.stroke();
  }
}
// Stufe 7: Browserfenster (Leiste mit drei Punkten und Adressfeld, darunter Inhalt)
function drawWindow(x, W, H) {
  x.fillStyle = ink(.1); x.fillRect(0, 0, W, H * .16);
  x.fillStyle = ink(.45); for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(W * (.06 + i * .055), H * .08, H * .025, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = "#ffffff"; rr(x, W * .28, H * .04, W * .56, H * .08, H * .04); x.fill();
  drawSite(x, 0, H * .16, W, H * .84);
  x.strokeStyle = ink(.35); x.lineWidth = Math.max(1, W * .006); x.strokeRect(0, 0, W, H);
}
// Stufe 8: Pflastersteine im Verband (Front, Seite, Deckel des Stapels), Bretter der Palette, Shop
function drawPavers(rows, cols) {
  return (x, W, H) => {
    x.strokeStyle = ink(.3); x.lineWidth = Math.max(1.5, W * .012);
    for (let r = 1; r < rows; r++) { x.beginPath(); x.moveTo(0, r * H / rows); x.lineTo(W, r * H / rows); x.stroke(); }
    for (let r = 0; r < rows; r++) for (let c = 1; c <= cols; c++) {
      const u = (c - (r % 2 ? .5 : 0)) * W / cols; if (u <= 0 || u >= W) continue;
      x.beginPath(); x.moveTo(u, r * H / rows); x.lineTo(u, (r + 1) * H / rows); x.stroke();
    }
  };
}
function drawPallet(x, W, H) {
  x.fillStyle = ink(.32);
  for (const u of [.05, .45, .85]) x.fillRect(W * u, H * .35, W * .1, H * .65);
}
function drawShop(x, W, H) {
  const bz = .07 * W;
  x.fillStyle = ink(.86); rr(x, 0, 0, W, H, bz); x.fill();
  drawSite(x, bz, bz * 1.6, W - 2 * bz, H - 3.2 * bz, { shop: 1 });
}

// Stufe 7, Runden Group: viele Fenster (Raster aus kleinen Browserfenstern) auf einer Fläche
function drawWindowGrid(x, W, H) {
  x.fillStyle = ink(.06); rr(x, 0, 0, W, H, W * .02); x.fill();
  const cols = 3, rows = 2, gx = W * .04, gy = H * .06, cw = (W - gx * (cols + 1)) / cols, ch = (H - gy * (rows + 1)) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const X = gx + c * (cw + gx), Y = gy + r * (ch + gy);
    x.save(); x.translate(X, Y); x.beginPath(); x.rect(0, 0, cw, ch); x.clip();
    drawWindow(x, cw, ch); x.restore();
  }
}

export default function (K) {
  const { F, R, V, Q, EPS, THREE, sm, narrow: N } = K;
  F.edgeOwn(true);
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const TREAD = c3("#ece6d9"), RISER = c3("#fbfaf6"), CARD = c3("#f8f6f1"), GREY = c3("#dcd7cd"),
    WOOD = c3("#e3d6bd"), STONE = c3("#dad4c9"), DARK = c3("#cfc9bf");
  const EV = K.EC, LEAN = K.lean, UP = Q - K.lean, halfW = K.halfW;

  // ---------- Schrift ----------
  // Setzstufen stehen senkrecht: alle Größen mit K.EV (gleicht die Verkürzung aus). Jahr klein in Grotesk (Kicker), Station in Newsreader groß, Zusatz als Lesetext.
  const eY = .62 * EV, eS = (N ? 1.15 : 1.3) * EV, eD = EV, eH = (N ? 2.7 : 3.2) * EV;
  const WT = N ? 3.5 : 4.2;                              // größte Breite eines Eintrags (Welt)
  const twOf = p => p.t.tw * p.e;
  const stLines = name => {                              // Handy: lange Stationsnamen auf zwei Zeilen
    if (!N || K.measure([name], { font: "kopf" }).tw * eS <= WT) return [name];
    const ws = name.split(" "); let best = null;
    for (let i = 1; i < ws.length; i++) {
      const l = [ws.slice(0, i).join(" "), ws.slice(i).join(" ")], m = Math.max(...l.map(s => K.measure([s], { font: "kopf" }).tw));
      if (!best || m < best.m) best = { m, l };
    }
    return best ? best.l : [name];
  };
  // Eintrag 0 ist der Kopf (auf dem Fuß der Treppe), Einträge 1 bis 8 die Stationen. pr: Drucke von oben nach unten, stop: in Lesereihenfolge
  const items = [];
  {
    const k = K.print([KICKER], eY, 0, { font: "kicker", col: "#5f5f63", text: KICKER });
    const h = K.print([KOPF], eH, 0, { font: "kopf", lh: 1.12, text: KOPF });
    items.push({ pr: [k, h], stop: [k, h] });
  }
  for (const r of ROWS) {
    const yr = K.print([r.yr], eY, 0, { font: "kicker", col: "#5f5f63", text: r.yr });
    const st = K.print(stLines(r.st), eS, 0, { font: "kopf", lh: 1.12, text: r.st });
    const ds = K.satz(r.ds, { e: eD, maxEm: WT / eD, on: 0 });
    items.push({ pr: [yr, st, ds], stop: [ds, st, yr] });
  }
  const n = items.length;
  items.forEach(it => { it.w = Math.max(...it.pr.map(twOf)); it.blk = it.pr.reduce((s, p) => s + p.h, 0); });
  const gapT = .3, gapB = .25;
  const Hb = Math.max(N ? 2.2 : 1.7, Math.max(...items.map(i => i.blk)) + gapT + gapB);     // Länge der Setzstufe (schräg, um K.lean zurückgelehnt)
  const H = Hb * Math.cos(LEAN);   // Stufenhöhe (senkrecht) und Rücksprung der Setzstufe
  const sB = H * Math.tan(LEAN);                         // Rücksprung: Fuß der Setzstufe liegt sB vor ihrer Oberkante
  const Y = k => (k + 1) * H;                            // Oberkante von Stufe k (Setzstufe von Y(k − 1) bis Y(k), Tritt auf Y(k))
  const HT = n * H;                                      // Höhe der Treppe = rise.h

  // ---------- Maße, Lage ----------
  const CL = N ? .8 : 1.0, M = CL + .2;                  // Steigung des Fadens am linken Rand der Setzstufe, Rand bis zum Text
  const DT = 6;                                // Tiefe der Tritte (hinter der Setzstufe liegt der Tritt, darauf das Zeichen)
  const SC = N ? 1.05 : 1.3, s = SC;                     // Größe der Zeichen
  const SW = [0, .8, 1, 1.25, 1.2, 1.24, .82, 1.7, 1.46];                 // nominale Breite des Zeichens je Stufe
  const SA = [0, -.4, -.5, -.625, -.6, -.62, -.41, -.85, -.74];          // linke Kante des Zeichens bei Mitte c: c + SA[k] * s
  const Dk = items.map(it => K.trage(0, it.w, {}).D);     // Mitfahrt je Stufe (Handy)
  // Teilung der Texte: Stufe k + 1 beginnt (in Startlage) rechts vom Zeichen der Stufe k
  let Pmin = 0;
  for (let k = 0; k < n - 1; k++) Pmin = Math.max(Pmin, Dk[k + 1] + items[k + 1].w / 2 + M - items[k].w / 2 + SW[k] * s + .3);
  const P = Math.max(Pmin, N ? 0 : 4.9);
  const cF = k => k * P;                                  // Mitte des Eintrags k in Ruhe (Endlage)
  const xl = k => cF(k) - Dk[k] - items[k].w / 2 - M;     // linke Kante der Stufe in Startlage
  const xe = cF(n - 1), xsS = xl(0) - halfW;
  const XE = xe + halfW + .8;                             // Ende der Platten in Ruhe (die Ebene oben läuft bis zum Ende der Szene)
  K.strecke(xsS, xe);
  const dE = 1 / (xe - xsS);                              // b je Welteinheit Weg

  // ---------- Anstieg der Bahn (def.rise): die Kamera steigt gleichmäßig mit, passend zur Treppe ----------
  const xm = k => cF(k) - Dk[k] / 2, yc = k => Y(k) - (gapT + items[k].blk / 2) * Math.cos(LEAN);
  // Suche: Beginn x0 und Ende x1 des Anstiegs so, dass der Eintrag in jeder Stufe etwa gleich zum Lesepunkt liegt (Abweichung e);
  // der Anstieg darf kurz vor der Szene beginnen (höchstens 0,3 E Höhe am Szenenanfang) und soll am Ende der Szene fast oben sein.
  let fit = null;
  for (let ia = 0; ia <= 60; ia++) for (let ib = 0; ib <= 60; ib++) {
    const x0 = xm(0) - ia / 60 * 3 * P, x1 = xm(n - 1) + (.5 + ib / 60 * 2) * P;
    let e = 0; for (let k = 0; k < n; k++) e = Math.max(e, Math.abs(K.YL + HT * sm((xm(k) - x0) / (x1 - x0)) - yc(k) - .45));
    const lead = HT * sm((xsS - x0) / (x1 - x0)), short = HT * (1 - sm((xe + 6 - x0) / (x1 - x0)));
    const sc = e + .5 * short + 4 * Math.max(0, lead - .3);
    if (!fit || sc < fit.sc) fit = { sc, e, x0, x1, lead, short };
  }

  // Tiefe der Textmitte (Szenen-z): dort liegt die Leselinie
  const LZ = items.reduce((a, it) => a + sB - (Hb - gapT - it.blk / 2) * Math.sin(LEAN) , 0) / n;

  // ---------- Bogen ----------
  K.sheet(xl(0) - 4, XE + 3, -DT - 2, 3.4);

  // ---------- Zeichen auf den Tritten (aus der früheren Fassung, größer; stehen der Kamera zugewandt) ----------
  const PX = 600;
  const decal = (nd, draw, w, h, u, v, on, side = 1) => K.onPanel(nd, K.decal(Math.round(w * PX), Math.round(h * PX), draw, w, h, on, .02), u, v, side);
  const sc2 = pts => pts.map(p => [p[0] * s, p[1] * s]);
  // stehendes Teil: liegt in Ruhe hinter seinem Scharnier (zh) auf dem Tritt und klappt hoch; shape: Polygone in (u, v), sonst Rechteck
  function card(par, x0, x1, zh, h, t0, d, o = {}) {
    const nd = K.panel(par, [x0, zh], [x1, zh], [0, -1], t0, d, o.ang || UP, { over: o.over !== undefined ? o.over : .05 });
    if (o.shape) for (const sh of o.shape) K.P(nd, sh[0], o.col || CARD, sh[1] || .5);
    else K.rect(nd, 0, 0, x1 - x0, h, o.col || CARD);
    if (o.draw) decal(nd, o.draw, o.dw || x1 - x0, o.dh || h, o.du !== undefined ? o.du : (x1 - x0) / 2, o.dv !== undefined ? o.dv : h / 2, t0 + d * .45);
    return nd;
  }
  // Klotz: Platte hebt sich, Wände liegen in Ruhe innen unter der Platte (ohne Bastellinien) und klappen danach hoch
  function block(par, x0, x1, z0, z1, h, t0, d, o = {}) {
    const col = o.col || CARD, L = F.lift(par, h - EPS, t0, d * .55, { over: .03, lv: par.lvl + 2 });
    F.poly(L, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], o.top || col, .5);
    const wo = { nocut: 1, nofold: 1, over: .03, lv: par.lvl + 1 }, tw = t0 + d * .45, dw = d * .55, r = { L }, ws = o.walls || "flr";
    if (ws.includes("f")) { r.f = K.panel(par, [x0, z0], [x1, z0], [0, -1], tw, dw, Q, wo); K.rect(r.f, 0, 0, x1 - x0, h, col); }
    if (ws.includes("l")) { r.l = K.panel(par, [x0, z1], [x0, z0], [1, 0], tw, dw, Q, wo); K.rect(r.l, 0, 0, z0 - z1, h, col); }
    if (ws.includes("r")) { r.r = K.panel(par, [x1, z0], [x1, z1], [-1, 0], tw, dw, Q, wo); K.rect(r.r, 0, 0, z0 - z1, h, col); }
    return r;
  }
  // Zeichen je Stufe 1 bis 8: (Tritt, Mitte x, Scharnier z, t0, d); Maße im nominalen Maßstab, mal SC
  const SIGN = [
    // 1 Pixel Arrays: Kachel mit Pixel-Mauszeiger
    (L, c, zf, t0, d) => card(L, c - .4 * s, c + .4 * s, zf, .8 * s, t0, d, { draw: drawPixel }),
    // 2 HTK: Urkunde (Rahmen, Titelzeilen, Unterschrift, Siegel)
    (L, c, zf, t0, d) => card(L, c - .5 * s, c + .5 * s, zf, .72 * s, t0, d, { draw: drawCert }),
    // 3 Games: Gamepad als Silhouette (Körper, zwei Griffe; innere Kanten ohne Linie)
    (L, c, zf, t0, d) => {
      const body = sc2([[.15, .62], [1.1, .62], [1.23, .45], [1.15, .22], [.89, .22], [.36, .22], [.1, .22], [.02, .45]]);
      const gl = sc2([[.1, .22], [.36, .22], [.24, 0], [.06, 0]]), gr = sc2([[.89, .22], [1.15, .22], [1.19, 0], [1.01, 0]]);
      return card(L, c - .625 * s, c + .625 * s, zf, .62 * s, t0, d, { col: GREY, shape: [[body, [.5, .5, .5, 0, .5, 0, .5, .5]], [gl, [0, .5, .5, .5]], [gr, [0, .5, .5, .5]]], draw: drawPad });
    },
    // 4 Freiberuflich: Laptop, Grundplatte hebt sich, Bildschirm klappt auf
    (L, c, zf, t0, d) => {
      const z1 = zf - .78 * s, b = block(L, c - .6 * s, c + .6 * s, zf, z1, .06 * s, t0, d * .5, { col: GREY });
      K.onFlat(b.L, K.decal(Math.round(1.2 * s * PX), Math.round(.78 * s * PX), drawKeys, 1.2 * s, .78 * s, t0 + d * .3, .02), c, zf - .39 * s);
      return card(b.L, c - .6 * s, c + .6 * s, z1, .76 * s, t0 + d * .4, d * .6, { ang: Q - .3, col: GREY, draw: drawScreen });
    },
    // 5 YOOtheme Support: zwei Sprechblasen, die Frage vorn links, die Antwort dahinter rechts
    (L, c, zf, t0, d) => {
      const b1 = sc2([[.16, .16], [.2, .16], [.38, .16], [.94, .16], [1.0, .22], [1.0, .56], [.94, .62], [.16, .62], [.1, .56], [.1, .22]]);
      card(L, c - .62 * s, c + .38 * s, zf, .62 * s, t0, d * .8, { shape: [[b1, [.5, 0, .5, .5, .5, .5, .5, .5, .5, .5]], [sc2([[.2, .16], [.38, .16], [.1, 0]]), [0, .5, .5]]], draw: drawBubble1 });
      const b2 = sc2([[.06, .16], [.34, .16], [.52, .16], [.66, .16], [.72, .22], [.72, .44], [.66, .5], [.06, .5], [0, .44], [0, .22]]);
      return card(L, c - .1 * s, c + .62 * s, zf - .74 * s, .5 * s, t0 + d * .2, d * .8, { col: GREY, shape: [[b2, [.5, 0, .5, .5, .5, .5, .5, .5, .5, .5]], [sc2([[.34, .16], [.52, .16], [.62, 0]]), [0, .5, .5]]], draw: drawBubble2 });
    },
    // 6 Tangram: Quadrat aus sieben Teilen
    (L, c, zf, t0, d) => card(L, c - .41 * s, c + .41 * s, zf, .82 * s, t0, d, { draw: drawTangram }),
    // 7 Runden Group: Raster aus kleinen Browserfenstern, das größte Zeichen (Mutterfirma, viele Websites und Anwendungen)
    (L, c, zf, t0, d) => card(L, c - .85 * s, c + .85 * s, zf, 1.05 * s, t0, d, { draw: drawWindowGrid }),
    // 8 Gerwing: Palette mit einem Stapel Pflastersteine, daneben der Shop
    (L, c, zf, t0, d) => {
      const pal = block(L, c - .74 * s, c + .1 * s, zf, zf - .7 * s, .1 * s, t0, d * .5, { col: WOOD });
      decal(pal.f, drawPallet, .84 * s, .1 * s, .42 * s, .05 * s, t0 + d * .3);
      const st = block(pal.L, c - .68 * s, c + .04 * s, zf - .05 * s, zf - .64 * s, .38 * s, t0 + d * .25, d * .55, { col: STONE });
      decal(st.f, drawPavers(4, 4), .72 * s, .38 * s, .36 * s, .19 * s, t0 + d * .6);
      decal(st.r, drawPavers(4, 3), .59 * s, .38 * s, .295 * s, .19 * s, t0 + d * .6);
      K.onFlat(st.L, K.decal(Math.round(.72 * s * PX), Math.round(.59 * s * PX), drawPavers(3, 4), .72 * s, .59 * s, t0 + d * .5, .02), c - .32 * s, zf - .345 * s);
      return card(L, c + .28 * s, c + .72 * s, zf - .05 * s, .66 * s, t0 + d * .45, d * .55, { col: DARK, draw: drawShop });
    }
  ];

  // ---------- Stufen ----------
  const tags = [], bands = [], bIns = [];
  let frame = R;
  items.forEach((it, k) => {
    const T = K.trage(cF(k), it.w, {}), x0 = xl(k), x1 = XE - T.D, tag = "stufe" + k;
    const bIn = K.sicht(x0).in, tF = bIn + 1.0 * dE, dF = 1.4 * dE, tB = bIn + 1.9 * dE, dB = 1.3 * dE, tZ = bIn + 2.0 * dE, dZ = 1.1 * dE, tOn = bIn + 3.3 * dE;
    tags.push(tag); bIns.push(bIn);
    F.part(tag, bIn - .1 * dE, 1.3 * dE);
    const S = T.node(frame);
    // Platte (Tritt): hebt sich um eine Stufenhöhe über die Stufe davor; ihr unsichtbarer Zwilling trägt die nächste Stufe an der Endlage
    const L = F.lift(S, H - 2 * EPS, tF, dF, { over: .03, lv: S.lvl + 2 });
    F.poly(L, [[x0, 0], [x1, 0], [x1, -DT], [x0, -DT]], TREAD, .5);
    L.rl = "plate";
    const next = S === frame ? L : F.lift(frame, H - 2 * EPS, tF, dF, { over: .03, lv: frame.lvl + 2 });
    // Setzstufe: innere Lage unter der Platte (ohne eigene Bastellinien), klappt hoch, sobald die Platte oben ist
    const band = K.panel(S, [x0, sB], [x1, sB], [0, -1], tB, dB, Q - LEAN, { nocut: 1, nofold: 1, over: .035, lv: S.lvl + 1 });
    K.rect(band, 0, 0, x1 - x0, Hb, RISER);
    band.rl = "band";
    bands.push(band);
    // Text von oben nach unten, links bündig
    let v = Hb - gapT;
    for (const p of it.pr) { K.onPanel(band, p, M + p.w / 2 - p.t.padX * p.e, v - p.h / 2, 1); p.on = tOn; p.fade = .012; v -= p.h; }
    if (k) SIGN[k - 1](L, x0 + M - SA[k] * s, -.9, tZ, dZ);
    const bEnd = T.D > 0 ? Math.min(bIn + 4.2 * dE, T.bA - 1e-4) : bIn + 4.2 * dE;
    F.geruest({ tags: [tag], t0: bIn - .05 * dE, t1: tF, du: .02, a: .5, bAt: bEnd });
    frame = next;
  });
  F.spur({ tags, quiet: bands, a: .3 });

  // ---------- Roter Faden ----------
  // Er läuft vor den Setzstufen an ihrer Oberkante und steigt am linken Rand jeder Setzstufe (in Startlage) schräg zur nächsten.
  // Am Handy gleitet die Stufe unter dem Faden hindurch an ihren Platz (die Schnur ist ihre Schiene).
  const FZ = .012, zc = (y0, y1, y) => sB * (1 - (y - y0) / (y1 - y0)) + FZ;     // z der Faden-Linie auf der schrägen Setzstufe in Höhe y
  const pts = [V(xl(0) - 3.4, .004, LZ + .9), V(xl(0) - 1.6, .004, LZ + .5), V(xl(0) - .5, .004, sB + FZ + .05)];
  for (let k = 0; k < n; k++) {
    const x = xl(k), y0 = k ? Y(k - 1) + .006 : .004, y1 = Y(k) + .006, dy = y1 - y0, c = f => zc(y0, y1, y0 + dy * f);
    if (k) pts.push(V(x - .3, y0, FZ + sB * .5), V(x - .05, y0, sB + FZ));
    pts.push(V(x, y0 + .02, c(.02)), V(x + CL * .25, y0 + dy * .1, c(.1)), V(x + CL * .5, y0 + dy * .5, c(.5)), V(x + CL * .75, y0 + dy * .9, c(.9)), V(x + CL, y1, FZ), V(x + CL + .3, y1, FZ));
    const nx = k < n - 1 ? xl(k + 1) - .8 : XE - .3;
    for (let q = x + CL + 1.6; q < nx - .8; q += 1.6) pts.push(V(q, y1, FZ));
    if (nx > x + CL + .4) pts.push(V(nx, y1, FZ));
  }

  return {
    strecke: [xsS, xe], lineZ: LZ,
    rise: { x0: fit.x0, x1: fit.x1, h: HT },
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: bIns[0] + 3.5 * dE },
    faden: pts,
    stops: items.map((it, k) => ({ name: "r" + k, prints: it.stop }))
  };
}
