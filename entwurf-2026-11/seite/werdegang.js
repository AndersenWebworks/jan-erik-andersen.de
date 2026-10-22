// Szene Werdegang (Katalog 11/12): Treppe aus dem Bogen, acht Stufen, neueste oben (Drehbuch: DREHBUCH.md).
// Pop-up-Logik: Die Stufen sind ein Teleskop: Stufe k ist eine Platte,
// die sich um eine Stufenhöhe über die Stufe darunter hebt; danach klappen ihre Setzstufe und ihre zwei Seitenwände
// (innere Lagen unter der Platte) hoch
// und rastet ein. Auf der Setzstufe stehen Jahr, Station und Zusatz wörtlich, auf der Trittstufe darüber steht das
// Faltzeichen der Station. Der rote Faden klettert mit und erreicht die Oberkante jeder Setzstufe an ihrer Lesestelle.
// Überschrift: Lettern „Werdegang“ stehen vor der Treppe aus dem Bogen auf (nach der Zeit seit dem Laden, wie der Name).
// Kopie von entwurf-2026-11/werdegang/werdegang.js für die durchgehende Seite (entwurf-2026-11/seite/). Geändert: Haarkanten und
// Bastellinien relativ zur eigenen Fläche über F.edgeOwn(true) (in der Szenenkopie war das eine Änderung im Faltkern),
// Konstruktionsphase ergänzt (Raster, Gerüst je Stufe kurz vor ihrem Heben, Bleistiftspur).

const ink = a => `rgba(48,48,51,${a})`;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// Text wörtlich aus entwurf-2026-10-b-raumtext-2/index.html, Section #werdegang, von unten (älteste) nach oben (neueste).
// d: Zeilen am Desktop, n: Zeilen am Handy (nur Umbruch, kein anderer Wortlaut)
const ROWS = [
  { yr: "2000 bis 2006", st: "Pixel Arrays", d: ["erste Selbstständigkeit"] },
  { yr: "2007 bis 2010", st: "HTK Hamburg", d: ["Zertifikat Multimedia Design"] },
  { yr: "2010 bis 2017", st: "Games", d: ["Spielprototypen in Flash und Haxe, danach Qualitätssicherung", "bei Goodgame Studios und Deep Silver FISHLABS"],
    n: ["Spielprototypen in Flash", "und Haxe, danach Qualitäts-", "sicherung bei Goodgame Studios", "und Deep Silver FISHLABS"] },
  { yr: "seit 2010", st: "Freiberufliche Webprojekte", d: ["seit 2018 als Andersen Webworks"] },
  { yr: "2017", st: "YOOtheme", d: ["Support Management"] },
  { yr: "2017 bis 2023", st: "Tangram Werbeagentur", d: ["Frontend-Entwicklung, unter anderem für Nissen", "und EMPORE, für BIG Arbeitsschutz das Shop-Frontend"],
    n: ["Frontend-Entwicklung, unter", "anderem für Nissen und EMPORE,", "für BIG Arbeitsschutz das", "Shop-Frontend"] },
  { yr: "2023 bis 2025", st: "Runden Group", d: ["WBG Pooling und viele weitere Websites und", "Anwendungen der Firmengruppe"],
    n: ["WBG Pooling und viele weitere", "Websites und Anwendungen", "der Firmengruppe"] },
  { yr: "seit 2023", st: "Gerwing", d: ["Umsetzung und laufende Betreuung des Onlineshops"],
    n: ["Umsetzung und laufende", "Betreuung des Onlineshops"] }
];

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
// Stufe 3, Games: Steuerkreuz, vier Knöpfe, zwei Pillen (Fläche 1,25 × 0,62)
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
// Stufe 2, HTK: Urkunde mit Rahmen, Titelzeilen, Text, Unterschrift, Siegel
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

const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2, close: .25, closeDur: .7 };

export default function (K) {
  const { F, R, V, Q, PI, EPS, THREE, narrow: N } = K;
  F.edgeOwn(true);
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const TREAD = c3("#ece6d9"), RISER = c3("#fbfaf6"), WANGE = c3("#e3dccd"), CARD = c3("#f8f6f1"), GREY = c3("#dcd7cd"),
    WOOD = c3("#e3d6bd"), STONE = c3("#dad4c9"), DARK = c3("#cfc9bf");

  // ---------- Maße ----------
  // W Breite, H Stufenhöhe, D Auftritt. Am Handy schmaler (Text mittig, Zeichen dahinter), höher (bis vier Zeilen Zusatz)
  // und tiefer (das Zeichen steht weit genug vor der nächsten Setzstufe, um sie bei 30° Neigung nicht zu verdecken).
  // EXT: die oberste Stufe (und mit ihr der Bogen hinten) ist um EXT tiefer, damit die Übersicht „Womit ich arbeite“ auf ihrer Trittfläche Platz hat
  const EXT = N ? 3.2 : 2.2;
  const W = N ? 3.0 : 7.2, H = N ? 1.2 : .95, D = N ? 2.2 : 1.9, Z1 = 4, X0 = -W / 2, X1 = W / 2, ZB = Z1 - 8 * D - EXT;
  const Zf = k => Z1 - (k - 1) * D;
  // Zeitplan: Bastellinien b 0–.11, Stufe k ab B0 + (k − 1)·S (Platte, dann Setzstufe und Seitenwände, dann Zeichen)
  // (Korrektur nach Sichtprüfung: keine hohen Wangen mehr, die Seiten wachsen Stufe für Stufe mit)
  const B0 = .12, S = .095, sK = k => B0 + (k - 1) * S;
  // Überschrift rechts vorn neben der Treppe: an den Lesestellen liegt sie ganz außerhalb des Bildes und nie vor Text
  const HZ = Z1 + (N ? .9 : .8);

  // ---------- Bogen ----------
  const HE = N ? .62 : .8;
  const hm = K.measure(["Werdegang"], { font: "marke" }), HX = X1 + (N ? .5 : .7), HW = hm.tw * HE;
  K.sheet(X0 - 2.6, HX + HW + 1.4, ZB - .7, HZ + (N ? 1.8 : 1.6));

  // ---------- Überschrift: Lettern stehen aus dem Bogen auf ----------
  F.part("titel", -.02, .01);
  const head = K.word(["Werdegang"], HE, HX, HZ, .15, .9, { font: "marke", foot: 1, imprint: IMPRINT });
  // die Lettern blenden aus, während die Kamera in den Überblick steigt (b .06–.09), bevor sie aus dem Bildrand laufen
  head.off = .06;

  // ---------- Text auf den Setzstufen ----------
  const EY = .085, ES = N ? .16 : .2, ED = .12;
  const lines = r => (N && r.n) || r.d;
  // Handy: gemeinsame linke Kante für alle Stufen, Block der breitesten Zeile mittig
  const wMax = Math.max(...ROWS.map(r => Math.max(K.measure([r.st], { font: "marke" }).tw * ES, K.measure(lines(r), {}).tw * ED, K.measure([r.yr], { track: .06 }).tw * EY)));
  const XL = N ? -wMax / 2 : X0 + .34;

  // ---------- Stufen ----------
  let par = R;
  const steps = [];
  for (let k = 1; k <= 8; k++) {
    const s = sK(k), z = Zf(k), r = ROWS[k - 1];
    F.part("stufe" + k, .012 + k * .007, .035);
    // Setzstufe: innere Lage unter der Platte (ohne eigene Bastellinien), klappt hoch, sobald die Platte oben ist
    const riser = K.panel(par, [X0, z], [X1, z], [0, -1], s + .38 * S, .32 * S, Q, { nocut: 1, nofold: 1, over: .035, lv: par.lvl + 1 });
    K.rect(riser, 0, 0, W, H, RISER);
    // Seitenwände: liegen innen unter der Platte (ohne Bastellinien), schließen die Seite zwischen den Platten
    const sw = { nocut: 1, nofold: 1, over: .035, lv: par.lvl + 1 };
    K.rect(K.panel(par, [X0, ZB], [X0, z], [1, 0], s + .4 * S, .3 * S, Q, sw), 0, 0, z - ZB, H, WANGE);
    K.rect(K.panel(par, [X1, z], [X1, ZB], [-1, 0], s + .4 * S, .3 * S, Q, sw), 0, 0, z - ZB, H, WANGE);
    // Platte hebt sich um eine Stufenhöhe (Ausgleich der Lagen: Oberkante genau k·H)
    const L = F.lift(par, H - 2 * EPS, s, .45 * S, { over: .03, lv: par.lvl + 2 });
    F.poly(L, [[X0, z], [X1, z], [X1, ZB], [X0, ZB]], TREAD, .5);
    // Jahr (Grotesk, gesperrt, grau), Station (Marke), Zusatz (Grotesk), als Block senkrecht mittig auf der Setzstufe
    const on = s + .66 * S;
    const yr = K.print([r.yr], EY, on, { track: .06, col: "#66666a" });
    const st = K.print([r.st], ES, on, { font: "marke" });
    const ds = K.print(lines(r), ED, on + .01, { lh: 1.25 });
    const hb = yr.h + st.h + ds.h - .05;
    let v = (H + hb) / 2;
    const put = (pr, dv = 0) => { K.onPanel(riser, pr, XL - X0 + pr.w / 2 - pr.t.padX * pr.e, v - pr.h / 2 + dv, 1); v -= pr.h; };
    put(yr); put(st, .015); put(ds, .035);
    steps.push({ k, s, z, riser, L, prints: [ds, st, yr] });
    par = L;
  }

  // ---------- Zeichen auf den Trittstufen ----------
  const PX = 600; // Pixel je Einheit der Drucke
  const decal = (nd, draw, w, h, u, v, on, side = 1) => K.onPanel(nd, K.decal(Math.round(w * PX), Math.round(h * PX), draw, w, h, on, .02), u, v, side);
  // stehendes Teil: liegt in Ruhe hinter seinem Scharnier (zh) auf der Trittstufe und klappt hoch; shape: Polygone in (u, v), sonst Rechteck
  function card(par, x0, x1, zh, h, t0, d, o = {}) {
    const nd = K.panel(par, [x0, zh], [x1, zh], [0, -1], t0, d, o.ang || Q, { over: o.over !== undefined ? o.over : .05 });
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
  const EX = N ? 0 : X1 - 1.05; // Mitte der Zeichen
  const zeichen = [
    // 1 Pixel Arrays: Kachel mit Pixel-Mauszeiger
    (L, zf, t0, d) => card(L, EX - .4, EX + .4, zf, .8, t0, d, { draw: drawPixel }),
    // 2 HTK: Urkunde, leicht zurückgelehnt
    (L, zf, t0, d) => card(L, EX - .5, EX + .5, zf, .72, t0, d, { ang: Q - .2, draw: drawCert }),
    // 3 Games: Gamepad als Silhouette (Körper, zwei Griffe; innere Kanten ohne Linie)
    (L, zf, t0, d) => {
      const body = [[.15, .62], [1.1, .62], [1.23, .45], [1.15, .22], [.89, .22], [.36, .22], [.1, .22], [.02, .45]];
      const gl = [[.1, .22], [.36, .22], [.24, 0], [.06, 0]], gr = [[.89, .22], [1.15, .22], [1.19, 0], [1.01, 0]];
      return card(L, EX - .625, EX + .625, zf, .62, t0, d, { col: GREY, shape: [[body, [.5, .5, .5, 0, .5, 0, .5, .5]], [gl, [0, .5, .5, .5]], [gr, [0, .5, .5, .5]]], draw: drawPad });
    },
    // 4 Freiberuflich: Laptop, Grundplatte hebt sich, Bildschirm klappt auf
    (L, zf, t0, d) => {
      const z1 = zf - .78, b = block(L, EX - .6, EX + .6, zf, z1, .06, t0, d * .5, { col: GREY });
      K.onFlat(b.L, K.decal(Math.round(1.2 * PX), Math.round(.78 * PX), drawKeys, 1.2, .78, t0 + d * .3, .02), EX, zf - .39);
      return card(b.L, EX - .6, EX + .6, z1, .76, t0 + d * .4, d * .6, { ang: Q - .3, col: GREY, draw: drawScreen });
    },
    // 5 YOOtheme Support: zwei Sprechblasen, die Frage vorn links, die Antwort dahinter rechts
    (L, zf, t0, d) => {
      const b1 = [[.16, .16], [.2, .16], [.38, .16], [.94, .16], [1.0, .22], [1.0, .56], [.94, .62], [.16, .62], [.1, .56], [.1, .22]];
      card(L, EX - .62, EX + .38, zf, .62, t0, d * .8, { shape: [[b1, [.5, 0, .5, .5, .5, .5, .5, .5, .5, .5]], [[[.2, .16], [.38, .16], [.1, 0]], [0, .5, .5]]], draw: drawBubble1 });
      const b2 = [[.06, .16], [.34, .16], [.52, .16], [.66, .16], [.72, .22], [.72, .44], [.66, .5], [.06, .5], [0, .44], [0, .22]];
      return card(L, EX - .1, EX + .62, zf - .74, .5, t0 + d * .2, d * .8, { col: GREY, shape: [[b2, [.5, 0, .5, .5, .5, .5, .5, .5, .5, .5]], [[[.34, .16], [.52, .16], [.62, 0]], [0, .5, .5]]], draw: drawBubble2 });
    },
    // 6 Tangram: Quadrat aus sieben Teilen
    (L, zf, t0, d) => card(L, EX - .41, EX + .41, zf, .82, t0, d, { draw: drawTangram }),
    // 7 Runden Group: zwei gestaffelte Browserfenster
    (L, zf, t0, d) => {
      card(L, EX - .7, EX + .2, zf, .6, t0, d * .8, { draw: drawWindow });
      return card(L, EX - .2, EX + .7, zf - .7, .72, t0 + d * .2, d * .8, { draw: drawWindow });
    },
    // 8 Gerwing: Palette mit einem Stapel Pflastersteine, daneben der Shop
    (L, zf, t0, d) => {
      const pal = block(L, EX - .74, EX + .1, zf, zf - .7, .1, t0, d * .5, { col: WOOD });
      decal(pal.f, drawPallet, .84, .1, .42, .05, t0 + d * .3);
      const st = block(pal.L, EX - .68, EX + .04, zf - .05, zf - .64, .38, t0 + d * .25, d * .55, { col: STONE });
      decal(st.f, drawPavers(4, 4), .72, .38, .36, .19, t0 + d * .6);
      decal(st.r, drawPavers(4, 3), .59, .38, .295, .19, t0 + d * .6);
      K.onFlat(st.L, K.decal(Math.round(.72 * PX), Math.round(.59 * PX), drawPavers(3, 4), .72, .59, t0 + d * .5, .02), EX - .32, zf - .345);
      return card(L, EX + .28, EX + .72, zf - .05, .66, t0 + d * .45, d * .55, { col: DARK, draw: drawShop });
    }
  ];
  steps.forEach((st, i) => {
    F.part("zeichen" + st.k, .02 + st.k * .008, .04);
    zeichen[i](st.L, st.z - .12, st.s + .6 * S, .32 * S);
  });

  // ---------- Übersicht „Womit ich arbeite“: Druck auf der Trittfläche der obersten Stufe (Gerwing), von hinten nach vorn zu lesen ----------
  // Dieselben Stimmen wie die Setzstufen: Überschrift in der Marke, je Gruppe der Name wie die Jahreszahlen (Grotesk, klein, gesperrt, grau)
  // direkt über seinen Einträgen in Zusatzgröße (Grotesk). Drei Gruppen, am Desktop je eine Zeile, am Handy nur im Umbruch verschieden.
  // Die Überschrift steht mit größerem Abstand vom Block als die Gruppen untereinander; eine gemeinsame linke Kante.
  // (Arbeitsweise und Sprachen stehen nur im Text ohne 3D.)
  // Platz: links rechts vom roten Faden (Faden bei XL − 0,16, Druck ab XL + 0,45), rechts mindestens 0,25 vor dem linken Rand des Stufenzeichens
  // (Desktop x 1,81; längste Zeile rund 3,8 breit bei 4,37 Platz), nach hinten so tief (EXT), dass der Stapel ganz vor der Fläche endet,
  // die das Zeichen von vorn her verdeckt (Handy).
  const KENN = [
    ["Plattformen", ["WordPress, WooCommerce, YOOtheme Pro"], ["WordPress, WooCommerce,", "YOOtheme Pro"]],
    ["Anbindungen", ["Salesforce, Concludis, CRM- und ERP-Systeme, Umzug von Shopify"], ["Salesforce, Concludis,", "CRM- und ERP-Systeme,", "Umzug von Shopify"]],
    ["Frontend", ["HTML, CSS, JavaScript"]]
  ];
  {
    const top8 = steps[7], on = top8.s + .8 * S;
    const EH = N ? .2 : .24, HG = N ? .4 : .5, GG = N ? .18 : .22;
    const ph = K.print(["Womit ich arbeite"], EH, on, { font: "marke" });
    const at = (pr, x, z) => K.onFlat(top8.L, pr, x + pr.w / 2 - pr.t.padX * pr.e, z + pr.h / 2);
    const x0 = XL + (N ? .2 : .45), T0 = ZB + .14;
    at(ph, x0, T0);
    let cur = T0 + ph.h + HG;
    KENN.forEach(g => {
      const vs = (N && g[2]) || g[1];
      const nm = K.print([g[0].toUpperCase()], N ? .09 : .1, on, { track: .12, col: "#2b2b2e" }), en = K.print(vs, N ? ED : .13, on, { lh: 1.25 });
      at(nm, x0, cur);
      at(en, x0, cur + nm.h - .01);
      cur += nm.h + en.h - .01 + GG;
    });
  }

  // ---------- Konstruktionsphase (seite/): Gerüst je Stufe kurz bevor sie sich hebt, Bleistiftspur (auf den Setzstufen nur Eckmarken) ----------
  steps.forEach(st => F.geruest({ tags: ["stufe" + st.k], t0: st.s - .05, t1: st.s, du: .02, a: .5 }));
  F.spur({ tags: steps.map(st => "stufe" + st.k), quiet: steps.map(st => st.riser), a: .3 });

  // ---------- Roter Faden: klettert an der linken Textkante die Stufen hinauf ----------
  // Abstand zur Fläche 0,012 (Setzstufe) bzw. 0,01 (Trittstufe): die Kurve weicht an den Knicken um wenige Tausendstel ab
  const xt = XL - .16, OZ = .012, OY = .01, pts = [V(xt, .004, Z1 + 1.1), V(xt, .004, Z1 + .25), V(xt, .004, Z1 + .05), V(xt, .05, Z1 + OZ), V(xt, .2, Z1 + OZ)];
  const tops = [];
  for (let k = 1; k <= 8; k++) {
    const z = Zf(k) + OZ;
    // je Knick ein naher und ein ferner Stützpunkt, damit die Kurve nicht über die Kante hinausschwingt
    if (k > 1) pts.push(V(xt, (k - 1) * H + OY + .04, z), V(xt, (k - 1) * H + OY + .2, z));
    pts.push(V(xt, k * H - .2, z), V(xt, k * H - .04, z)); tops.push(pts.length - 1);
    pts.push(V(xt, k * H + OY, z - .05), V(xt, k * H + OY, z - .25));
    if (k < 8) pts.push(V(xt, k * H + OY, Zf(k + 1) + OZ + .25), V(xt, k * H + OY, Zf(k + 1) + OZ + .05));
    else pts.push(V(xt, k * H + OY, ZB + .45));
  }
  // Länge entlang des Polygonzugs: der Punkt erreicht die Oberkante der Setzstufe k bei b = sK(k) + S (ihre Lesestelle)
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const LT = cum[cum.length - 1], f1 = cum[tops[0]] / LT, f8 = cum[tops[7]] / LT;
  const span = (sK(8) - sK(1)) / (f8 - f1), tt0 = sK(1) + S - f1 * span, tt1 = tt0 + span;

  // ---------- Lesestellen ----------
  const pxD = (Wp, Hp) => Math.min(21, Math.max(19, 19 + (Hp - 700) / 500 * 2));
  const SH = { prints: [head], e0: HE, b: 0, px: 130, fit: .5, pxN: 90, fitN: .72, pitch: 14, npitch: 16, sy: -.12, nsy: -.1 };
  // Waagerechte Bildlage: nicht der Text, sondern die Stufe steht mittig (Desktop: Text links, Zeichen rechts, beide ganz im Bild;
  // Handy: gemeinsame Textkante, der Block der breitesten Zeile mittig). sx aus der Tiefe der Lesestellung zurückgerechnet.
  const XC = N ? 0 : (XL + EX + .72) / 2;
  const sxOf = (s, nar) => (Wp, Hp) => {
    const T = Math.tan((nar ? 44 : 32) * PI / 360), px = nar ? 16 : pxD(Wp, Hp), dep = s.e * Hp / (2 * T * px);
    // schmale Desktop-Fenster (4:3): die Textkante bleibt drin, das Zeichen darf rechts angeschnitten sein
    const xc = nar ? XC : Math.min(XC, XL - .55 + Wp / 2 / (px / s.e));
    return (s.C.x - xc) / (T * (Wp / Hp) * dep);
  };
  // Bildlage senkrecht (Desktop): Text dieser Stufe im oberen Teil, der Text der Stufe darunter ganz im Bild über der
  // Entwurfsleiste, die Stufe darunter ganz draußen. Gerechnet je Fensterhöhe (Mitte des gültigen Bereichs, _pruefung/such.mjs)
  const SYT = [[720, .47], [768, .43], [864, .31], [900, .27], [1024, .12], [1080, .08], [1200, 0], [1440, -.16]];
  const SYN = [[667, .55], [740, .5], [844, .35], [915, .25]]; // Handy, gleiche Regel
  const interp = (T, Hp) => {
    if (Hp <= T[0][0]) return T[0][1];
    for (let i = 1; i < T.length; i++) if (Hp <= T[i][0]) { const [h0, s0] = T[i - 1], [h1, s1] = T[i]; return s0 + (s1 - s0) * (Hp - h0) / (h1 - h0); }
    return T[T.length - 1][1];
  };
  const syN = (Wp, Hp) => interp(SYN, Hp);
  const syD = (Wp, Hp) => {
    if (Hp <= SYT[0][0]) return SYT[0][1];
    for (let i = 1; i < SYT.length; i++) if (Hp <= SYT[i][0]) { const [h0, s0] = SYT[i - 1], [h1, s1] = SYT[i]; return s0 + (s1 - s0) * (Hp - h0) / (h1 - h0); }
    return SYT[SYT.length - 1][1];
  };
  // Stufe 8 (Gerwing): steiler (45°) und tiefer im Bild, damit die Übersicht auf der Trittfläche über der Setzstufe mit im Bild ist
  // (Rechnung wie readingPose, Mitte von Übersichtsoberkante und Setzstufenunterkante; tmp/textmass/cam.mjs)
  const SY8D = [[720, -.47], [768, -.45], [864, -.41], [900, -.4], [1024, -.36], [1080, -.34], [1440, -.26]];
  const SY8N = [[667, -.52], [740, -.49], [844, -.43], [915, -.41]];
  const ST = steps.map(st => {
    const top = st.k === 8;
    const s = { prints: st.prints, e0: ED, b: st.s + S, px: pxD, pitch: top ? 45 : globalThis.WP ?? 32, yaw: -6 + (st.k - 1) * .8, sy: top ? (Wp, Hp) => interp(SY8D, Hp) : globalThis.WSY ?? syD, pxN: 16, npitch: top ? 45 : globalThis.WNP ?? 32, nyaw: 0, nsy: top ? (Wp, Hp) => interp(SY8N, Hp) : globalThis.WNSY ?? syN };
    s.sx = sxOf(s, false); s.nsx = sxOf(s, true);
    return s;
  });

  // ---------- Kamera zwischen den Lesestellen ----------
  const orbit = (t, el, az, d) => { const e = el * PI / 180, a = az * PI / 180; return t.clone().add(V(Math.cos(e) * Math.sin(a) * d, Math.sin(e) * d, Math.cos(e) * Math.cos(a) * d)); };
  const T1 = V(0, 0, (Z1 + ZB) / 2 + 1.5), T2 = V(-.4, 1.4, Z1 - 1.2), TF = V(0, 3.2 * H, (Z1 + ZB) / 2 + .5);
  const key = (w, b, t, el, az, d, tN, elN, azN, dN) => ({ w, b, tgt: t, cam: orbit(t, el, az, d), tgtN: tN, camN: orbit(tN, elN, azN, dN) });

  return {
    fov: 32, fovN: 44,
    track: 560,
    // Raster (seite/): mit den Bastellinien, weg bevor die erste Stufe steht
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .1 },
    thread: { pts, t0: tt0, t1: tt1, lin: true },
    stops: [SH, ...ST],
    keys: [
      { w: 0, stop: SH, noWarp: true },
      // Bastellinien: Überblick über den Bogen (acht Stufen, acht Zeichen)
      key(.7, .1, T1, 50, -6, 31, V(0, 0, (Z1 + ZB) / 2 + 2), 56, -4, 34),
      // Kamera senkt sich vor die Treppe, Stufe 1 beginnt sich zu heben
      key(.5, .12, T2, 28, -14, 17, V(0, 1.6, Z1 - 1.5), 34, -8, 19),
      ...ST.map((s, i) => ({ w: i ? .5 : .6, stop: s })),
      // Überblick: ganze Treppe mit allen Zeichen, der Faden liegt bis Gerwing
      key(.8, 1, TF, 24, -30, 31, V(0, 4 * H, (Z1 + ZB) / 2 + 1), 26, -24, 40)
    ]
  };
}
