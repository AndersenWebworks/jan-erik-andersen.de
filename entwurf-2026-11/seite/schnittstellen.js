// Schnittstellen und eigene Werkzeuge mit WBG Pooling als Beleg: eine durchgehende Szene (b 0 … 1) auf einer Kamerabahn, Bogen + Bastellinien.
// Ein Bildschirm mit Website steht auf (das Kinn bleibt leer), daneben hebt sich ein flaches Gerätebrett (Platte mit Zarge, Vorbild: die Tischplatte
//   der Eröffnung); auf dem Brett stehen drei Geräte (CRM, ERP, Bewerbermanagement) mit leeren Buchsen. Kabel mit Stecker laufen vom Bildschirm über die
//   linke Brettkante, auf dem Brett als Bündel entlang der Zarge und dann gerade auf die Buchsen. Beim ERP passt der Stecker nicht (runde Buchse):
//   der Stecker stößt an, zieht sich zurück, ein rotes Adapterstück faltet sich aus dem Bogen dazwischen und rastet ein, dann steckt der Stecker.
//   Danach WBG Pooling: ein Bildschirm mit Portal, ein Drehteller mit Produkt (dreht sich beim Scrollen), eine Login-Tafel mit Schloss (der Bügel
//   rastet ein) und zwei Kabel, die vorn über die Zarge laufen und in die zweiten Buchsen von CRM (Salesforce) und Bewerbermanagement (Concludis) stecken.
// Alle Texte stehen wörtlich (entwurf-2026-10-b-raumtext-2/index.html) auf einem Leporello (Faltflyer, Vorbild: der Bericht in stimmen.js), der vor dem
//   Brett aus dem Bogen aufsteht und sich nach rechts auffaltet, je Falzseite ein ganzer Satz, von links nach rechts gelesen: (1) Schnittstellen-Satz,
//   (2) „Wo ein gekauftes Werkzeug …“ (die Seite klappt auf, sobald der Adapter eingerastet ist), (3) Kopf „WBG Pooling“ (klein, grau, gesperrt) mit dem
//   WBG-Satz vor dem Portal. Kein Text auf Bildschirmkinn, Gerätedeckeln, Tafeln oder der Zarge. Die Kamera liest die Seiten frontal.
// Kabel: drei Spuren auf dem Brett (CRM hinten, ERP, Bewerbermanagement vorn), die Reihenfolge bleibt vom Bildschirm bis zu den Buchsen gleich, daher
//   kreuzt sich das Bündel nicht. Die beiden WBG-Kabel laufen als vordere Spuren darüber (Salesforce ganz vorn).
// Kopie von entwurf-2026-11/schnittstellen/szene.js für die durchgehende Seite (entwurf-2026-11/seite/). Vorher zeigte die Seite das Modul zweimal
// (Szene „Schnittstellen“ b 0 … .55, nach „Gestaltung“ Szene „WBG Pooling“ b .556 … 1); jetzt eine Szene, Sprungziel #s=wbg zeigt auf die Lesestelle c.
// Ergänzt: Konstruktionsphase (Raster, Gerüst je Bauabschnitt, Bleistiftspur).

const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235", MUTED = "#66666a";
const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2 };
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Bildschirminhalte (Koordinaten 1000 × 625) ----------
function pageSite(x, W, H) {
  const s = W / 1000, S = H / 625, L = [];
  L.push({ t: "box", x: 60, y: 46, w: 118, h: 22, a: .85 });
  for (let i = 0; i < 4; i++) L.push({ t: "txt", x: 600 + i * 88, y: 52, w: 62, h: 10, a: .4 });
  L.push({ t: "rule", y: 100 }, { t: "box", x: 60, y: 150, w: 430, h: 42, a: .82 }, { t: "box", x: 60, y: 204, w: 300, h: 42, a: .82 });
  [400, 380, 260].forEach((w, i) => L.push({ t: "txt", x: 60, y: 276 + i * 24, w, h: 10, a: .3 }));
  L.push({ t: "btn", x: 60, y: 362, w: 150, h: 44 }, { t: "img", x: 560, y: 140, w: 380, h: 280 });
  for (let c = 0; c < 3; c++) { const X = 60 + c * 300; L.push({ t: "box", x: X, y: 470, w: 150, h: 14, a: .7 }); [240, 220, 170].forEach((w, i) => L.push({ t: "txt", x: X, y: 500 + i * 20, w, h: 8, a: .26 })); }
  L.push({ t: "rule", y: 590 });
  draw(x, s, S, W, H, L);
}
// Portal: geschütztes Vertriebsbereich-Backend (Sales Center) als Pseudobild: Kopfleiste mit Anmeldestatus, Seitenleiste, Produktkarten mit 360-Grad-Ansicht,
// Anbindungsstatus Salesforce und Concludis, Tabellenzeilen. Nur allgemeine Beschriftungen, keine Zahlen oder Kundennamen. Zeichnung in 1000 × 625.
function pagePortal(x, W, H) {
  const s = W / 1000, S = H / 625;
  x.save(); x.scale(s, S);
  const bar = (X, Y, w, h, a, c) => { x.fillStyle = c || ink(a); rr(x, X, Y, w, h, h / 2); x.fill(); };
  const txt = (t, X, Y, sz, col, wt, al) => { x.font = `${wt || 600} ${sz}px "Segoe UI", system-ui, Arial, sans-serif`; x.fillStyle = col; x.textAlign = al || "left"; x.textBaseline = "alphabetic"; x.fillText(t, X, Y); };
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, 1000, 625);
  // Kopfleiste: Wortmarke, Bereichsname, Anmeldestatus mit Schloss
  x.fillStyle = ink(.92); x.fillRect(0, 0, 1000, 58);
  x.fillStyle = RED; rr(x, 22, 15, 28, 28, 5); x.fill();
  txt("Sales Center", 62, 36, 21, "rgba(255,255,255,.95)", 700);
  x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 2.6; x.lineJoin = "round";
  rr(x, 842, 26, 16, 13, 2); x.stroke(); x.beginPath(); x.arc(850, 26, 5.5, PI, 0); x.stroke();
  txt("Angemeldet", 868, 38, 17, "rgba(255,255,255,.88)", 600);
  x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = 2.4; x.beginPath(); x.arc(790, 29, 13, 0, PI * 2); x.stroke();
  x.fillStyle = "rgba(255,255,255,.55)"; x.beginPath(); x.arc(790, 25, 4.4, 0, PI * 2); x.fill(); x.beginPath(); x.arc(790, 40, 9, PI * 1.1, PI * 1.9); x.fill();
  // Seitenleiste
  x.fillStyle = ink(.8); x.fillRect(0, 58, 190, 567);
  ["Übersicht", "Produkte", "Dokumente", "Anfragen", "Einstellungen"].forEach((t, i) => {
    const Y = 100 + i * 46, on = i === 1;
    if (on) { x.fillStyle = "rgba(255,255,255,.16)"; x.fillRect(0, Y - 26, 190, 40); x.fillStyle = RED; x.fillRect(0, Y - 26, 5, 40); }
    x.fillStyle = on ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.4)"; rr(x, 24, Y - 12, 16, 16, 3); x.fill();
    txt(t, 52, Y + 2, 18, on ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.5)", on ? 700 : 500);
  });
  // Inhalt: Titel, Suchfeld
  txt("Produkte", 222, 112, 32, ink(.88), 700);
  x.strokeStyle = ink(.4); x.lineWidth = 2.4; rr(x, 640, 84, 330, 38, 6); x.stroke();
  x.beginPath(); x.arc(660, 102, 7, 0, PI * 2); x.moveTo(665, 107); x.lineTo(672, 114); x.stroke(); bar(684, 98, 110, 8, .3);
  // Produktkarten mit 360-Grad-Ansicht
  for (let c = 0; c < 3; c++) {
    const X = 222 + c * 262, Y = 146, w = 242, h = 214;
    x.fillStyle = ink(.045); rr(x, X, Y, w, h, 8); x.fill(); x.strokeStyle = ink(.3); x.lineWidth = 2.2; rr(x, X, Y, w, h, 8); x.stroke();
    const cx = X + w / 2, cy = Y + 84, a = 36 + (c === 1 ? 6 : 0);
    x.strokeStyle = ink(.55); x.lineWidth = 3; x.beginPath();
    x.moveTo(cx - a, cy - a * .25); x.lineTo(cx, cy - a * .75); x.lineTo(cx + a, cy - a * .25); x.lineTo(cx + a, cy + a * .65); x.lineTo(cx, cy + a * 1.15); x.lineTo(cx - a, cy + a * .65); x.closePath(); x.stroke();
    x.beginPath(); x.moveTo(cx - a, cy - a * .25); x.lineTo(cx, cy + a * .25); x.lineTo(cx + a, cy - a * .25); x.moveTo(cx, cy + a * .25); x.lineTo(cx, cy + a * 1.15); x.stroke();
    x.strokeStyle = ink(.32); x.lineWidth = 2.4; x.beginPath(); x.ellipse(cx, cy + a * .55, a * 1.75, a * .5, 0, .15 * PI, 1.55 * PI); x.stroke();
    x.fillStyle = RED; rr(x, X + w - 66, Y + 12, 54, 24, 12); x.fill(); txt("360°", X + w - 39, Y + 30, 16, "rgba(255,255,255,.96)", 700, "center");
    bar(X + 16, Y + 164, [130, 110, 150][c], 14, .8); bar(X + 16, Y + 188, 74, 8, .28); bar(X + 100, Y + 188, 54, 8, .28);
  }
  // Anbindungen: zwei Statuskarten
  txt("Anbindungen", 222, 400, 21, ink(.8), 700);
  ["Salesforce", "Concludis"].forEach((t, i) => {
    const X = 222 + i * 262, Y = 414, w = 242, h = 58;
    x.strokeStyle = ink(.4); x.lineWidth = 2.4; rr(x, X, Y, w, h, 8); x.stroke();
    x.fillStyle = ink(.82); x.beginPath(); x.arc(X + 30, Y + 29, 14, 0, PI * 2); x.fill();
    x.strokeStyle = "#ffffff"; x.lineWidth = 3.4; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath(); x.moveTo(X + 23, Y + 29); x.lineTo(X + 28, Y + 34); x.lineTo(X + 38, Y + 23); x.stroke();
    txt(t, X + 56, Y + 28, 19, ink(.85), 700); txt("verbunden", X + 56, Y + 48, 15, ink(.55), 500);
  });
  // Tabellenzeilen darunter
  for (let r = 0; r < 3; r++) {
    const Y = 500 + r * 38;
    x.fillStyle = ink(.1); x.fillRect(222, Y + 30, 748, 2);
    x.strokeStyle = ink(.45); x.lineWidth = 2; x.strokeRect(222, Y + 6, 14, 14);
    bar(250, Y + 7, [180, 150, 200][r], 12, .6); bar(520, Y + 9, 110, 8, .28); bar(660, Y + 9, 90, 8, .28);
    x.strokeStyle = ink(.35); x.lineWidth = 2.2; rr(x, 880, Y + 3, 80, 22, 11); x.stroke();
  }
  x.restore();
}
function draw(x, s, S, W, H, L) {
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  for (const o of L) {
    if (o.t === "rule") { x.fillStyle = ink(.12); x.fillRect(0, o.y * S, W, 2 * S); continue; }
    const X = o.x * s, Y = o.y * S, w = o.w * s, h = o.h * S;
    if (o.tab) { x.strokeStyle = ink(.5); x.lineWidth = 2.5 * s; rr(x, X, Y, w, h, 4 * s); x.stroke(); x.strokeStyle = ink(.6); rr(x, X + 14 * s, Y + 13 * S, 12 * s, 10 * S, 2 * s); x.stroke(); x.beginPath(); x.arc(X + 20 * s, Y + 13 * S, 5 * s, PI, 0); x.stroke(); x.fillStyle = ink(.4); rr(x, X + 38 * s, Y + 10 * S, 54 * s, 10 * S, 5 * s); x.fill(); continue; }
    if (o.t === "box" || o.t === "txt") { x.fillStyle = ink(o.a); rr(x, X, Y, w, h, o.t === "txt" ? h / 2 : 2 * s); x.fill(); }
    else if (o.t === "btn") { x.fillStyle = RED; rr(x, X, Y, w, h, 4 * s); x.fill(); x.fillStyle = "rgba(255,255,255,.92)"; rr(x, X + 30 * s, Y + h / 2 - 5 * S, w - 60 * s, 10 * S, 5 * S); x.fill(); }
    else if (o.t === "img") {
      x.fillStyle = ink(.07); x.fillRect(X, Y, w, h); x.strokeStyle = ink(.3); x.lineWidth = 2.5 * s; x.lineJoin = "round";
      x.beginPath(); x.moveTo(X, Y + h); x.lineTo(X + w * .32, Y + h * .45); x.lineTo(X + w * .55, Y + h * .72); x.lineTo(X + w * .7, Y + h * .58); x.lineTo(X + w, Y + h); x.stroke();
      x.beginPath(); x.arc(X + w * .74, Y + h * .28, 24 * s, 0, PI * 2); x.stroke();
    } else if (o.t === "prod") {
      // Produktbild: Würfel auf Standfläche, Rundumpfeil darum (360°)
      x.fillStyle = ink(.05); x.fillRect(X, Y, w, h); x.strokeStyle = ink(.55); x.lineWidth = 3 * s; x.lineJoin = "round";
      const cx = X + w / 2, cy = Y + h * .48, a = 62 * s;
      x.beginPath(); x.moveTo(cx - a, cy - a * .25); x.lineTo(cx, cy - a * .75); x.lineTo(cx + a, cy - a * .25); x.lineTo(cx + a, cy + a * .65); x.lineTo(cx, cy + a * 1.15); x.lineTo(cx - a, cy + a * .65); x.closePath(); x.stroke();
      x.beginPath(); x.moveTo(cx - a, cy - a * .25); x.lineTo(cx, cy + a * .25); x.lineTo(cx + a, cy - a * .25); x.moveTo(cx, cy + a * .25); x.lineTo(cx, cy + a * 1.15); x.stroke();
      x.strokeStyle = ink(.35); x.lineWidth = 2.5 * s; x.beginPath(); x.ellipse(cx, cy + a * .55, a * 1.9, a * .55, 0, .15 * PI, 1.55 * PI); x.stroke();
      x.fillStyle = ink(.35); x.beginPath(); x.moveTo(cx + a * 1.9 * Math.cos(.15 * PI) - 12 * s, cy + a * .55 + a * .55 * Math.sin(.15 * PI) - 4 * s); x.lineTo(cx + a * 1.9 * Math.cos(.15 * PI) + 6 * s, cy + a * .55 + a * .55 * Math.sin(.15 * PI) + 8 * s); x.lineTo(cx + a * 1.9 * Math.cos(.15 * PI) + 10 * s, cy + a * .55 + a * .55 * Math.sin(.15 * PI) - 14 * s); x.fill();
    }
  }
}
const PI = Math.PI;

// Front eines Geräts (Druck, oben = Oberkante): Rahmen, Lüftungsschlitze, zwei Buchsen. kind: "rect" passt zum Stecker, "round" nicht
function deviceFront(socks) {
  return (x, W, H, dw, dh) => {
    const s = W / dw, Y = v => (dh - v) * s;
    x.strokeStyle = ink(.34); x.lineWidth = 3; rr(x, .05 * s, .05 * s, W - .1 * s, H - .1 * s, .03 * s); x.stroke();
    x.strokeStyle = ink(.28); x.lineWidth = .026 * s; x.lineCap = "round";
    for (let r = 0; r < 3; r++) { const yy = Y(dh - .2 - r * .075); for (let c = 0; c < 9; c++) { const x0 = (.24 + c * (dw - .6) / 9) * s; x.beginPath(); x.moveTo(x0, yy); x.lineTo(x0 + .09 * s, yy); x.stroke(); } }
    for (const k of socks) {
      const cx = k.u * dw * s, cy = Y(.36);
      x.strokeStyle = ink(.6); x.lineWidth = 4;
      if (k.kind === "round") { x.beginPath(); x.arc(cx, cy, .15 * s, 0, PI * 2); x.stroke(); x.beginPath(); x.arc(cx, cy, .055 * s, 0, PI * 2); x.stroke(); }
      else { rr(x, cx - .2 * s, cy - .12 * s, .4 * s, .24 * s, .02 * s); x.stroke(); x.fillStyle = ink(.5); x.fillRect(cx - .13 * s, cy - .02 * s, .26 * s, .04 * s); }
      x.strokeStyle = ink(.3); x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy + .3 * s, .028 * s, 0, PI * 2); x.stroke();
    }
  };
}
// Front des Adapters (rot): Buchse für den rechteckigen Stecker in Weiß
function adapterFront(x, W, H, dw, dh) {
  const s = W / dw, cx = W / 2, cy = (dh - .36) * s;
  x.strokeStyle = "rgba(255,255,255,.95)"; x.lineWidth = 4.5; rr(x, cx - .2 * s, cy - .12 * s, .4 * s, .24 * s, .02 * s); x.stroke();
  x.fillStyle = "rgba(255,255,255,.9)"; x.fillRect(cx - .13 * s, cy - .02 * s, .26 * s, .04 * s);
  x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = 2.5; x.strokeRect(.1 * s, .1 * s, W - .2 * s, H - .2 * s);
}
// Login-Tafel: Titelzeile, zwei Felder, Schaltfläche, Schloss ohne Bügel (der Bügel ist ein eigenes Teil und rastet ein)
function loginFace(x, W, H, bw, bh) {
  const s = W / bw;
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  x.strokeStyle = ink(.34); x.lineWidth = 3; rr(x, .05 * s, .05 * s, W - .1 * s, H - .1 * s, .03 * s); x.stroke();
  x.fillStyle = ink(.82); rr(x, .24 * s, .24 * s, 1.0 * s, .09 * s, .04 * s); x.fill();
  x.fillStyle = ink(.12); x.fillRect(.24 * s, .46 * s, W - .48 * s, 2);
  for (let i = 0; i < 2; i++) { x.strokeStyle = ink(.45); x.lineWidth = 3; rr(x, .24 * s, (.62 + i * .36) * s, W - .48 * s, .26 * s, .02 * s); x.stroke(); x.fillStyle = ink(i ? .55 : .28); if (i) { for (let d = 0; d < 6; d++) { x.beginPath(); x.arc((.4 + d * .17) * s, (.75 + .36) * s, .028 * s, 0, PI * 2); x.fill(); } } else rr(x, .36 * s, .72 * s, .9 * s, .06 * s, .03 * s), x.fill(); }
  x.fillStyle = RED; rr(x, .24 * s, 1.42 * s, .86 * s, .26 * s, .03 * s); x.fill(); x.fillStyle = "rgba(255,255,255,.92)"; rr(x, .4 * s, 1.52 * s, .54 * s, .06 * s, .03 * s); x.fill();
  // Schloss: Körper
  const lx = W - .74 * s, ly = 1.56 * s;
  x.fillStyle = ink(.82); rr(x, lx - .27 * s, ly, .54 * s, .4 * s, .05 * s); x.fill();
  x.fillStyle = "#ffffff"; x.beginPath(); x.arc(lx, ly + .15 * s, .045 * s, 0, PI * 2); x.fill(); x.fillRect(lx - .016 * s, ly + .16 * s, .032 * s, .12 * s);
}
function shackleArt(x, W, H) {
  x.strokeStyle = ink(.82); x.lineWidth = W * .16; x.lineCap = "butt";
  const w = W * .5, r = w / 2;
  x.beginPath(); x.moveTo(W / 2 - r, H); x.lineTo(W / 2 - r, r + H * .1); x.arc(W / 2, r + H * .1, r, PI, 0); x.lineTo(W / 2 + r, H); x.stroke();
}

export default function (K) {
  const { F, R, V, COL, Q, sm, mech, win, clamp, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const METAL = c3("#dcd7cd"), FACE = c3("#f8f6f1"), DEV = c3("#e4e0d6"), DECK = c3("#f0ede6"), REDC = c3("#d40235"), PLATE = c3("#e9e4d8");
  const WALL = c3("#e1dccf"), PROD = c3("#efe9dc"), PRODT = c3("#f7f3ea"), BOARD = c3("#f8f6f1");

  // ---------- Sätze auf dem Leporello (wörtlich aus index.html) ----------
  // Zeilenumbruch nur an Wortgrenzen, möglichst gleichmäßig lange Zeilen
  function wrap(text, maxEm) {
    const words = text.split(" "), count = m => { let n = 1, cur = ""; for (const w of words) { const t = cur ? cur + " " + w : w; if (cur && K.measure([t]).tw > m) { n++; cur = w; } else cur = t; } return n; };
    const n0 = count(maxEm); let m = maxEm; while (count(m - .4) === n0 && m > 6) m -= .4;
    const lines = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (cur && K.measure([t]).tw > m) { lines.push(cur); cur = w; } else cur = t; }
    lines.push(cur); return lines;
  }
  const TXA = "Ich verbinde Websites und Shops mit CRM-, ERP- und Bewerbermanagementsystemen, bei WBG etwa mit Salesforce und Concludis.";
  const TXB = "Wo ein gekauftes Werkzeug nicht zu Ihren Abläufen passt, entwickle ich eines, das passt.";
  const HDC = "WBG Pooling · 2023 bis 2025 · für die Runden Group";
  const TXC = "Ein Industrie- und Vertriebsportal mit 360-Grad-Produktansichten, einem geschützten Bereich für den Vertrieb und Anbindungen an Salesforce und Concludis.";
  // Leporello (Faltweise aus stimmen.js, drei Seiten): LW Seitenbreite, hh Winkel des Zickzacks, A0 Fußpunkt der ersten Seite
  const DEG = PI / 180, LW = 4.4, MX = .3, hh = 16 * DEG, gam = PI - 2 * hh, A0 = [2.0, 7.1];
  const E0 = .22, EH = Math.min(.154, (LW - 2 * MX - .12) / K.measure([HDC], { track: .06 }).tw);   // Schriftgröße (em) der Sätze bzw. des kleinen Kopfs (passt in die Seitenbreite)
  const TWL = (LW - 2 * MX) / E0 - .3;                        // Textbreite in em
  const LA = wrap(TXA, TWL), LB = wrap(TXB, TWL), LC = wrap(TXC, TWL);
  const STEP = LW * Math.cos(hh);                             // Fußabstand zweier Seiten in x

  // ---------- Lage ----------
  const M1X = -4.0, DW = 2.4, DH = 1.5, DD = 1.5, DEVX = [-.8, 2.6, 6.0];
  const SOCK = [.26, .74];                                   // erste Buchse (Kabel vom Bildschirm links), zweite Buchse (WBG) als Anteil der Breite
  // WBG-Teile stehen auf dem Brett rechts neben den Geräten: Portal-Bildschirm hinten links (z −2,2), Login-Tafel hinten rechts (z −2,0), der Drehteller davor (z 0,8)
  const SWM = N ? 2.8 : 3.6, TR = 2.3, LBW = 2.4;
  const BZF = 3.3, BZB = -3.0;
  // Beginn der WBG-Teile: rechts neben den Geräten (die Kabel von WBG laufen an ihnen vorbei), das Portal steht etwa hinter der dritten Leporello-Seite
  const XC0 = A0[0] + 2 * STEP + .1;
  const ZR = -2.2, ZL = -2.0, TZ = .8, M2X = XC0 + SWM / 2 + .1, TX = XC0 + (N ? 2.5 : 3.3), LGX = TX + 3.0;
  const BX0 = DEVX[0] - .5, BX1 = Math.max(DEVX[2] + DW + .5, LGX + LBW / 2 + .5), BW = BX1 - BX0;
  const sockX = (i, k) => DEVX[i] + DW * SOCK[k];
  K.sheet(-9.5, Math.max(17, BX1 + 1.8), -7, 19);

  // ---------- Zeitplan (b) ----------
  const TT = {
    m1: { line: [.01, .05], neck: [.085, .05], scr: [.125, .045], decal: .168 },
    bd: { line: [.06, .04], lift: [.10, .045] },
    lp: { line: [.085, .04], p0: [.14, .10], hinge: [.47, .80], dur: .09 },   // Leporello: Seite 1 steht auf, Seite 2 klappt nach dem Adapter, Seite 3 vor dem Portal auf
    dev: { line: [.03, .09], fr: [.150, .170, .190], dk: [.185, .205, .225], dur: .05, durD: .04 },
    cab1: { crm: [.275, .31], bew: [.295, .34], erp1: [.31, .35], erpBack: [.352, .372], erp2: [.49, .53] },
    ad: { line: [.375, .04], fr: [.405, .05], dk: [.445, .045], decal: .452 },
    m2: { line: [.575, .045], neck: [.615, .04], scr: [.65, .04], decal: .69 },
    tt: { line: [.60, .06], walls: .655, plate: [.69, .045], prodLine: [.725, .035], prod: [.76, .77, .78, .795], spin: [.85, .10] },
    lg: { line: [.78, .05], rise: [.86, .045], decal: .91, shackle: [.965, .03] },
    cab2: { sf: [.955, .99], co: [.965, 1.0] }
  };


  // ---------- Bildschirm (Fuß-Hals-Schirm wie in der Eröffnung, nach hinten gefaltet) ----------
  function monitor(cx, zh, T, name, page, par) {
    F.part(name, T.line[0], T.line[1]);
    // Kinn ohne Text: alle Sätze stehen auf der Zarge des Gerätebretts
    const SW = N ? 2.8 : 3.6;
    const FW = 1.5, NW = .34, NH = .75, DX = SW - .4, DY = DX / 1.6, CH = .58, SL = CH + DY + .1, PXU = 500;
    const neck = K.panel(par, [cx - FW / 2, zh], [cx + FW / 2, zh], [0, -1], T.neck[0], T.neck[1], Q, { over: .04 });
    K.P(neck, [[0, 0], [FW, 0], [FW / 2 + NW / 2, NH], [FW / 2 - NW / 2, NH]], METAL, [.5, .5, 0, .5]);
    const scr = K.panel(neck, neck.uv(FW / 2 - NW / 2, NH), neck.uv(FW / 2 + NW / 2, NH), [0, -1], T.scr[0], T.scr[1], -.1, { over: .25 });
    const uL = -(SW - NW) / 2, uR = NW + (SW - NW) / 2;
    K.P(scr, [[uL, 0], [0, 0], [NW, 0], [uR, 0], [uR, SL], [uL, SL]], FACE, [.5, 0, .5, .5, .5, .5]);
    const dec = K.decal(SW * PXU, SL * PXU, (x, W, H) => {
      const bz = .055 * PXU, dx = (SW - DX) / 2 * PXU, dy = (SL - CH - DY) * PXU;
      x.fillStyle = ink(.84); rr(x, dx - bz, dy - bz, DX * PXU + 2 * bz, DY * PXU + 2 * bz, bz * .5); x.fill();
      x.save(); x.translate(dx, dy); x.beginPath(); x.rect(0, 0, DX * PXU, DY * PXU); x.clip(); page(x, DX * PXU, DY * PXU); x.restore();
    }, SW, SL, T.decal, .03);
    K.onPanel(scr, dec, NW / 2, SL / 2, 1);
    return { neck, scr, dec, cx, zh, top: NH + SL, SW };
  }

  // ---------- Gerätebrett: flache Platte mit Zarge, hebt sich parallel aus dem Bogen (wie die Tischplatte der Eröffnung) ----------
  // Maße: Breite von DEVX[0] − .5 bis hinter die Login-Tafel, hinten bis zur Tiefe der Deckel (DD), vorn so tief, dass der Adapter (Auffaltung bis z 1,55)
  // und das Kabelbündel samt Rückzug des ERP-Steckers (Stecker zurück bis z 2,32, Kurve ab 2,5) noch auf dem Brett liegen. Die Zarge trägt keinen Text.
  const BH = .5;
  const BRDC = c3("#e6e0d2"), ZARC = c3("#e1d9c9");
  F.part("brett", TT.bd.line[0], TT.bd.line[1]);
  const bOp = { over: .04 }, bt0 = TT.bd.lift[0], bd0 = TT.bd.lift[1];
  const zarge = K.panel(R, [BX0, BZF], [BX1, BZF], [0, 1], bt0, bd0, Q, bOp);
  K.rect(zarge, 0, 0, BW, BH, ZARC);
  K.rect(K.panel(R, [BX0, BZB], [BX1, BZB], [0, -1], bt0, bd0, Q, bOp), 0, 0, BW, BH, ZARC);
  K.rect(K.panel(R, [BX0, BZF], [BX0, BZB], [-1, 0], bt0, bd0, Q, bOp), 0, 0, BZF - BZB, BH, ZARC);
  K.rect(K.panel(R, [BX1, BZF], [BX1, BZB], [1, 0], bt0, bd0, Q, bOp), 0, 0, BZF - BZB, BH, ZARC);
  const BOARD_T = F.lift(R, BH, bt0, bd0, { over: .04 });
  F.poly(BOARD_T, [[BX0, BZF], [BX1, BZF], [BX1, BZB], [BX0, BZB]], BRDC, .5);
  // ---------- Leporello vor dem Brett (Faltweise aus stimmen.js): drei Seiten, je Seite ein ganzer Satz ----------
  // Die drei Seiten liegen im Bogen deckungsgleich vor dem Brett (Rechteck, um −hh gedreht, damit das aufgeschlagene Zickzack quer zum Bild läuft). Die erste
  // Seite steht an ihrer Fußkante auf, jede weitere schlägt an der abwechselnd rechten und linken Kante um gam auf. Seiten mit ungerader Nummer zeigen dem
  // Betrachter ihre Unterseite.
  const ONP = [TT.lp.p0[0] + TT.lp.p0[1] + .01, TT.lp.hinge[0] + .05, TT.lp.hinge[1] + .05];
  const prA = K.print(LA, E0, ONP[0], { lh: 1.28 }), prB = K.print(LB, E0, ONP[1], { lh: 1.28 });
  const prH = K.print([HDC], EH, ONP[2], { track: .06, col: MUTED }), prC = K.print(LC, E0, ONP[2] + .01, { lh: 1.28 });
  const LH = Math.max(prA.h, prB.h, prH.h + prC.h - .05) + .8, topY = LH - .3;
  const d0 = [Math.cos(hh), -Math.sin(hh)], eb = [-Math.sin(hh), -Math.cos(hh)];
  const lp = (u, v) => [A0[0] + d0[0] * u + eb[0] * v, A0[1] + d0[1] * u + eb[1] * v];
  const PG = ["#fbfaf6", "#f1eee6", "#fbfaf6"].map(c3);
  F.part("leporello", TT.lp.line[0], TT.lp.line[1], { lift: .014 });
  const p0 = K.panel(R, lp(0, 0), lp(LW, 0), eb, TT.lp.p0[0], TT.lp.p0[1], Q, { over: .05, lv: 1 });
  K.rect(p0, 0, 0, LW, LH, PG[0], .5);
  const pg = [p0], rect = [[0, 0], [LW, 0], [LW, LH], [0, LH]].map(q => p0.uv(q[0], q[1]));
  for (let k = 1; k < 3; k++) {
    const u = k % 2 ? LW : 0;
    const nd = F.hinge(pg[k - 1], p0.uv(u, 0), p0.uv(u, LH), p0.uv(LW / 2, LH / 2), gam, TT.lp.hinge[k - 1], TT.lp.dur, { lv: 1 + 2 * k, over: .05 });
    nd.uv = p0.uv; nd.n = p0.n;
    F.poly(nd, rect, PG[k], .5, 0, COL.INK, { nocut: true });
    pg.push(nd);
  }
  // Druckfeld auf einer Seite: linke Kante tx, Oberkante der ersten Zeile tyTop (auf der Unterseite, side −1, wird gespiegelt)
  const put = (nd, pr, tx, tyTop, side) => { const cx = tx - pr.t.padX * pr.e + pr.w / 2, cy = tyTop + .34 * pr.e - pr.h / 2; K.onPanel(nd, pr, side > 0 ? cx : LW - cx, cy, side, eb); };
  put(pg[0], prA, MX, topY, 1);
  put(pg[1], prB, MX, topY, -1);
  put(pg[2], prH, MX, topY, 1);
  put(pg[2], prC, MX, topY - prH.h - .04, 1);

  // ---------- Gerät: Front steht auf, Deckel klappt nach hinten ----------
  function device(i, label, socks, tFr, tDk, tFront, textLines, e) {
    const x0 = DEVX[i];
    // geschlossene Box (Front, Rückwand, Seiten, Deckel an der Rückwand) wie der Rechner der Eröffnung
    const bx = K.box(BOARD_T, x0, x0 + DW, 0, -DD, DH, tFr, tDk + TT.dev.durD - tFr, { col: DEV, roof: DECK, over: .05 });
    const fr = bx.fr;
    const dec = K.decal(Math.round(DW * 300), Math.round(DH * 300), (x, W, H) => deviceFront(socks)(x, W, H, DW, DH), DW, DH, tFront);
    K.onPanel(fr, dec, DW / 2, DH / 2, -1);
    const front = K.print(textLines, e, tFront + .01, { align: "center", lh: 1.15 });
    K.onPanel(fr, front, DW / 2, DH * .56, -1);
    return { fr, dk: bx.top, front, dec, x0 };
  }

  // ---------- Kabel mit Stecker, der vorn mitläuft ----------
  const PLUGL = .62;
  function cable(pts, stages, opt = {}) {
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5), total = curve.getLength(), TS = 700, RS = 10;
    const geo = new THREE.TubeGeometry(curve, TS, opt.r || .042, RS, false);
    const tube = K.add(new THREE.Mesh(geo, K.paperMaterial("#8e8981")));
    const plug = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(.46, .3, .4), K.paperMaterial("#4b4a4e")); body.position.set(0, 0, -.42);
    const neckp = new THREE.Mesh(new THREE.BoxGeometry(.26, .2, .1), K.paperMaterial("#6a6862")); neckp.position.set(0, 0, -.67);
    plug.add(body, neckp);
    for (const sx of [-.1, .1]) { const pr = new THREE.Mesh(new THREE.BoxGeometry(.07, .04, .22), K.paperMaterial("#c9c4b8")); pr.position.set(sx, 0, -.11); plug.add(pr); }
    for (const o of [body]) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .45, depthWrite: false })); o.add(e); }
    K.add(plug);
    const tmp = new THREE.Vector3(), tg = new THREE.Vector3(), ZERO = new THREE.Vector3(), UPV = new THREE.Vector3(0, 1, 0), LM = new THREE.Matrix4();
    // k: Anteil der Kabellänge, bei dem der Anfang des Steckers (seine Rückseite) sitzt
    K.anim(b => {
      let k = 0;
      for (const s of stages) {
        if (b < s.b0) continue;
        const x = clamp((b - s.b0) / (s.b1 - s.b0), 0, 1);
        k = s.k0 + (s.k1 - s.k0) * (s.lin ? sm(x) : mech(x, s.over === undefined ? .02 : s.over));
      }
      k = clamp(k, 0, 1);
      tube.visible = k > .004; plug.visible = k > .004;
      geo.setDrawRange(0, Math.floor(k * TS) * RS * 6);
      curve.getPointAt(k, tmp); curve.getTangentAt(k, tg);
      plug.position.copy(tmp).addScaledVector(tg, PLUGL);
      // Ausrichtung im Raum der Szene (Object3D.lookAt rechnet in Weltkoordinaten und dreht den Stecker, sobald die Szene gedreht auf der Seite steht)
      plug.quaternion.setFromRotationMatrix(LM.lookAt(tg, ZERO, UPV));
    });
    return { curve, total, plug, tube };
  }

  // ===================================================================================================
  // SZENE 1
  // ===================================================================================================
  // Überschrift steht sofort (Zeitlauf wie der Name der Eröffnung)
  const eH = N ? .5 : .62, H1 = K.word(["Schnittstellen und", "eigene Werkzeuge"], eH, N ? -4.6 : -5.4, 6.6, .15, .85, { font: "serif", foot: 1, imprint: { ...IMPRINT, close: .25, closeDur: .7 } });

  // Bildschirm mit Website
  const m1 = monitor(M1X, 0, TT.m1, "m1", pageSite, R);

  // Drei Geräte: Texte der Fronten sind die Satzteile
  F.part("geraete", TT.dev.line[0], TT.dev.line[1]);
  const crm = device(0, "CRM", [{ u: SOCK[0], kind: "rect" }, { u: SOCK[1], kind: "rect" }], TT.dev.fr[0], TT.dev.dk[0], TT.dev.fr[0] + TT.dev.dur, ["CRM"], .2);
  const erp = device(1, "ERP", [{ u: SOCK[0], kind: "round" }, { u: SOCK[1], kind: "round" }], TT.dev.fr[1], TT.dev.dk[1], TT.dev.fr[1] + TT.dev.dur, ["ERP"], .2);
  const bew = device(2, "Bewerbermanagement", [{ u: SOCK[0], kind: "rect" }, { u: SOCK[1], kind: "rect" }], TT.dev.fr[2], TT.dev.dk[2], TT.dev.fr[2] + TT.dev.dur, ["Bewerbermanagement"], .17);
  // Rotes Adapterstück: Front steht vor der Buchse auf (Vorderseite Unterseite), Deckel klappt zurück gegen das Gerät
  F.part("adapter", TT.ad.line[0], TT.ad.line[1]);
  const AW = 1.5, AH = .72, AD = .7, ax = sockX(1, 0);
  const adF = K.panel(BOARD_T, [ax - AW / 2, AD], [ax + AW / 2, AD], [0, 1], TT.ad.fr[0], TT.ad.fr[1], Q, { over: .06 });
  K.rect(adF, 0, 0, AW, AH, REDC);
  const adD = K.panel(adF, adF.uv(0, AH), adF.uv(AW, AH), [0, 1], TT.ad.dk[0], TT.ad.dk[1], Q, { over: 0 });
  K.rect(adD, 0, 0, AW, AD, REDC);
  K.onPanel(adF, K.decal(Math.round(AW * 300), Math.round(AH * 300), (x, W, H) => adapterFront(x, W, H, AW, AH), AW, AH, TT.ad.decal), AW / 2, AH / 2, -1);

  // Kabel: Anfang am Hals des Bildschirms, über die linke Brettkante, auf dem Brett als Bündel in drei Spuren entlang der Zarge (hinten CRM, Mitte ERP, vorn
  // Bewerbermanagement: die Reihenfolge, in der die Kabel vom Bildschirm kommen, bleibt bis zu den Buchsen gleich, daher kreuzt sich nichts), vor dem Gerät im
  // Bogen gerade auf die Buchse. Die Kurve beginnt beim ERP bei z 2,4, damit der ERP-Stecker bis z 2,32 zurückfahren kann. Die Kabel von WBG laufen später als
  // vordere Spuren darüber (Salesforce ganz vorn, Concludis in der Spur des Bewerbermanagements rechts von dessen Buchse).
  const xvL = [-3.3, -3.45, -3.6];                          // Senkrechte Läufe am Bildschirmfuß: der Weiteste (Bewerbermanagement) liegt außen, so überschneiden sich die Kabel dort nicht
  const SY = .36, SYB = BH + SY, LZL = [2.4, 2.8, 3.2], hyL = [.2, .2, .2], gzL = [2.4, 2.8, 3.2];
  function path1(i, zEnd) {
    const xs = sockX(i, 0), ox = M1X, yL = BH + hyL[i], gz = gzL[i], LZ = LZL[i], bz = i === 1 ? .4 : .5, xv = xvL[i];
    return [V(ox + .2, .36, .05), V(ox + .3, .14, .35), V(xv, .04, .85), V(xv, .04, gz - .7), V(xv + .45, .05, gz), V(-2.4, .08, gz), V(-1.95, BH * .4 + .12, (gz + LZ) / 2), V(BX0 - .1, yL + .05, LZ),
      V(xs - .9, yL, LZ), V(xs - .4, yL, LZ), V(xs - .12, yL + (SYB - yL) * .45, LZ - .22), V(xs, SYB, LZ - bz), V(xs, SYB, zEnd + 1.0), V(xs, SYB, zEnd)];
  }
  const cC = cable(path1(0, PLUGL), [{ b0: TT.cab1.crm[0], b1: TT.cab1.crm[1], k0: 0, k1: 1, over: .03 }]);
  const cB = cable(path1(2, PLUGL), [{ b0: TT.cab1.bew[0], b1: TT.cab1.bew[1], k0: 0, k1: 1, over: .03 }]);
  // ERP: stößt an der runden Buchse an (k = 1), zieht sich zurück, steckt später in den Adapter (Rückseite des Steckers bei z = AD + PLUGL)
  const eP = path1(1, PLUGL);
  const cE = (() => {
    const c0 = new THREE.CatmullRomCurve3(eP, false, "centripetal", .5), L = c0.getLength(), zr = eP[eP.length - 1].z;
    const kBack = zb => 1 - (zb - zr) / L;
    return cable(eP, [
      { b0: TT.cab1.erp1[0], b1: TT.cab1.erp1[1], k0: 0, k1: 1, over: .0 },
      { b0: TT.cab1.erpBack[0], b1: TT.cab1.erpBack[1], k0: 1, k1: kBack(zr + 1.7), over: .0 },
      { b0: TT.cab1.erp2[0], b1: TT.cab1.erp2[1], k0: kBack(zr + 1.7), k1: kBack(AD + PLUGL), over: .03 }
    ]);
  })();

  // ===================================================================================================
  // WBG POOLING (ab b .56): Portal, Drehteller, Login-Tafel vor dem Satz c, Kabel zu Salesforce und Concludis
  // ===================================================================================================
  // Bildschirm mit Portal (Kinn ohne Text)
  const m2 = monitor(M2X, ZR, TT.m2, "m2", pagePortal, BOARD_T);

  // Drehteller: Achteck, Wände stehen am Rand, Platte hebt sich, darauf faltet sich das Produkt und dreht sich beim Scrollen
  F.part("tt", TT.tt.line[0], TT.tt.line[1]);
  const oct = []; for (let k = 0; k < 8; k++) { const a = (22.5 + 45 * k) * PI / 180; oct.push([TX + TR * Math.sin(a), TZ + TR * Math.cos(a)]); }
  const TH = .5;
  oct.forEach((p, k) => {
    const q = oct[(k + 1) % 8], mx = (p[0] + q[0]) / 2 - TX, mz = (p[1] + q[1]) / 2 - TZ, ml = Math.hypot(mx, mz);
    const wl = K.panel(BOARD_T, p, q, [mx / ml, mz / ml], TT.tt.walls + k * .003, .05, Q, { over: .03 });
    // Trapez: die Außenkante ist an beiden Enden um TH·tan 22,5° kürzer, benachbarte Streifen überlappen in Ruhe nicht
    const Lw = Math.hypot(q[0] - p[0], q[1] - p[1]), cut = TH * Math.tan(22.5 * PI / 180);
    K.P(wl, [[0, 0], [Lw, 0], [Lw - cut, TH], [cut, TH]], WALL);
  });
  const plate = F.lift(BOARD_T, TH, TT.tt.plate[0], TT.tt.plate[1], { over: .04 });
  F.poly(plate, oct, PLATE, .5);
  const spin = F.spin(plate, [TX, TZ], 2 * PI, TT.tt.spin[0], TT.tt.spin[1], { lin: true });
  F.part("produkt", TT.tt.prodLine[0], TT.tt.prodLine[1]);
  // Produkt: Keil mit schräger Oberseite, aus der Platte geschnitten
  const PWd = .9, PDp = .8, PHf = .45, PHb = .8;
  const prod = K.box(spin, TX - PWd / 2, TX + PWd / 2, TZ + PDp / 2, TZ - PDp / 2, PHf, TT.tt.prod[0], .05, { hf: PHf, hb: PHb, col: PROD, roof: PRODT, own: plate, mvOwn: true });
  // Markierung auf der Platte, dreht mit dem Produkt (Rundum-Skala mit Anschlagstrich)
  const scale = K.decal(900, 900, (x, W, H) => {
    x.translate(W / 2, H / 2); x.strokeStyle = ink(.45); x.lineWidth = 6;
    for (let k = 0; k < 36; k++) { const a = k * PI / 18, r0 = W * (k % 3 ? .445 : .43), r1 = W * .465; x.beginPath(); x.moveTo(r0 * Math.sin(a), r0 * Math.cos(a)); x.lineTo(r1 * Math.sin(a), r1 * Math.cos(a)); x.stroke(); }
    x.strokeStyle = RED; x.lineWidth = 12; x.beginPath(); x.moveTo(0, W * .405); x.lineTo(0, W * .47); x.stroke();
  }, 2 * (TR - .2), 2 * (TR - .2), TT.tt.plate[0] + TT.tt.plate[1], .02);
  K.onFlat(spin, scale, TX, TZ, .004);

  // Login-Tafel mit Schloss
  F.part("login", TT.lg.line[0], TT.lg.line[1]);
  const LBH = 2.5;
  const board = K.panel(BOARD_T, [LGX - LBW / 2, ZL], [LGX + LBW / 2, ZL], [0, -1], TT.lg.rise[0], TT.lg.rise[1], Q, { over: .05 });
  K.rect(board, 0, 0, LBW, LBH, BOARD);
  K.onPanel(board, K.decal(Math.round(LBW * 300), Math.round(LBH * 300), (x, W, H) => loginFace(x, W, H, LBW, LBH), LBW, LBH, TT.lg.decal), LBW / 2, LBH / 2, 1);
  // Bügel: eigenes Teil, rastet von oben in den Schlosskörper (Körper in der Tafel bei u = LBW - .74, v = LBH - .4 - 1.56 ... Mitte des Körpers)
  const SHW = .5, SHH = .5, shPr = K.decal(240, 240, shackleArt, SHW, SHH, TT.lg.decal), shG = new THREE.Group();
  shPr.mesh.renderOrder = 2.5;                              // nach der Tafel zeichnen, sonst übermalt deren weiße Fläche den eingerasteten Bügel
  shG.add(shPr.mesh); K.add(shG);
  const lockU = LBW - .74, lockTop = LBH - 1.56 + 0;       // Oberkante des Körpers in v (die Zeichnung zählt von oben)
  F.attach(board, shG, board.uv(lockU, lockTop + SHH / 2 - .03), board.n, 1, .004);
  const shOpen = .3;
  K.anim(b => { shPr.mesh.position.y = shOpen * (1 - mech(win(b, TT.lg.shackle[0], TT.lg.shackle[1]), .12)); });

  // Kabel von WBG: vom Hals des Portal-Bildschirms links um den Fuß, auf dem Brett nach links bis vor den Drehteller und vorn in die Spur zl hinter bzw. über der
  // Zarge, von rechts bis vor die zweite Buchse des CRM (Salesforce, Spur ganz vorn) bzw. des Bewerbermanagements (Concludis). Salesforce quert dabei
  // von oben das Bündel von ERP und Bewerbermanagement (eine Überkreuzung ist dort unvermeidbar, das Kabel liegt deutlich darüber); Kein Satz steht mehr auf der Zarge.
  const YSF = .5, YCO = .3;
  function pathW(sdx, off, yl, xs, zl) {
    const ox = M2X, oz = ZR, y0 = BH + .04, xc = Math.max(XC0 - .9 - off, xs + 2.1), xe = xc - .5;   // xc: Spalte vor dem Drehteller, an Concludis' Buchse nicht weiter links als dort Platz ist
    const mid = xe - xs > 3 ? [V((xe + xs) / 2, BH + yl, zl)] : [];
    return [V(ox + sdx, BH + .36, oz + .05), V(ox + sdx - .3, BH + .12, oz + .55), V(ox + sdx - .6, y0, oz + .9), V(XC0 - .2 - off, y0, oz + 1.3), V(xc, y0, .4), V(xc - .1, BH + .1, 1.8),
      V(xe, BH + yl, zl), ...mid, V(xs + .9, BH + yl, zl), V(xs + .4, BH + yl, zl), V(xs + .12, BH + yl + (SY - yl) * .45, zl - .22),
      V(xs, SYB, zl - .5), V(xs, SYB, PLUGL + 1.0), V(xs, SYB, PLUGL)];
  }
  cable(pathW(.1, -.5, YSF, sockX(0, 1), 3.55), [{ b0: TT.cab2.sf[0], b1: TT.cab2.sf[1], k0: 0, k1: 1, over: .03 }]);
  cable(pathW(-.15, 0, YCO, sockX(2, 1), LZL[2]), [{ b0: TT.cab2.co[0], b1: TT.cab2.co[1], k0: 0, k1: 1, over: .03 }]);

  // ---------- Konstruktionsphase (seite/): Gerüst je Bauabschnitt kurz vor dem Hochklappen, Bleistiftspur auf den Flächen ----------
  // Ohne Produkt (dreht sich) und Etikett (liegt flach).
  F.geruest({ tags: ["m1"], t0: .03, t1: .085, du: .03, a: .5 });
  F.geruest({ tags: ["brett"], t0: .065, t1: .10, du: .03, a: .5 });
  F.geruest({ tags: ["geraete"], t0: .08, t1: .15, du: .03, a: .5 });
  F.geruest({ tags: ["leporello"], t0: .10, t1: .14, du: .03, a: .5 });
  F.geruest({ tags: ["adapter"], t0: .375, t1: .405, du: .02, a: .5 });
  F.geruest({ tags: ["m2"], t0: .575, t1: .615, du: .03, a: .5 });
  F.geruest({ tags: ["tt"], t0: .6, t1: .655, du: .03, a: .5 });
  F.geruest({ tags: ["login"], t0: .81, t1: .86, du: .03, a: .5 });
  F.spur({ tags: ["m1", "brett", "geraete", "leporello", "adapter", "m2", "tt", "login"], quiet: [m1.scr, m2.scr, zarge, BOARD_T, ...pg, crm.fr, erp.fr, bew.fr, crm.dk, erp.dk, bew.dk, adF, board], a: .3 });

  // ===================================================================================================
  // Kamera
  // ===================================================================================================
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const look = (tx, ty, tz, el, az, dist) => { const e = el * PI / 180, a = az * PI / 180; return V(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a)); };
  const S = {};
  // Handy übernimmt Lage und Einpassung des Desktops, solange nichts Eigenes (n…) angegeben ist; Schriftgröße dort immer 16 px
  const frontStop = (prints, o) => { const s = { prints, px: pxD, pitch: 14, yaw: 0, sx: 0, sy: 0, ...o }; s.nsx = o.nsx !== undefined ? o.nsx : s.sx; s.nsy = o.nsy !== undefined ? o.nsy : s.sy; s.fitN = o.fitN !== undefined ? o.fitN : s.fit; return s; };
  S.h1 = { prints: [H1], b: 0, px: 999, pxN: 999, fit: .72, fitN: .84, pitch: 12, sy: -.1, nsy: -.05, nsx: 0, sx: 0 };
  // Die drei Lesestellen stehen frontal vor den Leporello-Seiten (Blickrichtung waagerecht nach hinten, wie in stimmen.js), ruhig, ohne Zoom auf Geräte
  // a: nach dem Einstecken von CRM und Bewerbermanagement; b: Adapter ist eingerastet, Seite 2 steht; c: Portal, Drehteller und Login-Tafel stehen, Seite 3 steht
  const LOOK = V(0, 0, -1);
  const pxP = (W, H, s) => pxD(W, H) * s.e / .2, pxPN = (W, H, s) => 16 * Math.max(1, W / 390) * s.e / .2;
  const pageStop = (pr, b, yaw) => frontStop(pr, { face: LOOK, b, px: pxP, pxN: pxPN, pitch: 22, yaw, nyaw: yaw, sx: 0, sy: -.34 });   // yaw 0 bei allen: kein Pendeln zwischen den Seiten (sie stehen ±16° im Zickzack)
  S.a = pageStop([prA], .345, 0);
  S.b = pageStop([prB], .575, 0);
  S.c = pageStop([prH, prC], .93, 0);
  const OVX = (BX0 + BX1) / 2 - 1.2, GX = XC0 + 3.8;                // Mitte des Gesamtüberblicks (Desktop) bzw. der WBG-Gruppe (Handy)
  const stops = Object.values(S);

  return {
    names: S, fov: 32, fovN: 44, track: 1000,
    // Raster (seite/) in den Bastellinien
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .13 },
    stops,
    keys: [
      // Eine ruhige Fahrt in eine Richtung: Titel, Satz a, Satz b, Satz c, dann der Überblick. Alle Lesestellen blicken gleich (yaw 0, pitch 22), keine Überblicke dazwischen.
      { w: 0, stop: S.h1 },
      { w: 1.6, stop: S.a },
      { w: 1.6, stop: S.b },
      { w: 1.8, stop: S.c },
      // Schluss: alles steht, beide Kabel stecken, der Bügel sitzt; die Kamera tritt von Lesestelle c geradeaus zurück (kein Schwenk zur Mitte)
      { w: 1.2, b: 1, fromStop: S.c, back: 1.8, up: 1.8 }
    ]
  };
}
