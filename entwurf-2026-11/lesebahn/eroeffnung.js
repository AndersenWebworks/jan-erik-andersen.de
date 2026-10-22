// Eröffnung (Szene 1): Podest mit Namen (Startbild, frontal), dann hebt sich die Kamera einmal auf Fahrthöhe (kern.js, def.intro) und fährt
// gleichmäßig nach rechts. Der Arbeitsplatz ist das Ding, das die drei Sätze trägt:
//  E1 Laptop: das Blatt mit der Website-Skizze liegt auf dem Tisch, steht als Bildschirm auf, die Skizze wird Seite; der Satz ist ihre Überschrift.
//  E2 Rechnerschrank (übrige Systeme): Kabel vom Laptop, der Satz steht auf der Blindplatte, der rote Statuspunkt tickt (betreuen, solange sie laufen).
//     Am Handy rollt der Schrank auf seinen Rollen ein Stück mit (K.trage) und bleibt neben dem Tisch stehen.
//  E3 Projektmappe: der Faden holt die Mappe ins Bild (ins Projekt geholt), daneben das Telefon (direkt mit mir).
// Der Name kommt aus wortmarke.js (eine Stelle, später tauschbar).
import { wortmarke, faltkante } from "./wortmarke.js";

const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Website: Vorlage für Skizze (Haarlinien) und Bildschirm, Koordinaten 1000 × 640; links oben bleibt Platz für die Überschrift (E1) ----------
const WEB = (() => {
  const L = [{ t: "box", x: 50, y: 40, w: 110, h: 20, a: .85 }];
  for (let i = 0; i < 4; i++) L.push({ t: "txt", x: 600 + i * 92, y: 46, w: 60, h: 9, a: .4 });
  L.push({ t: "cart", x: 960, y: 40 });
  L.push({ t: "rule", y: 92 });
  L.push({ t: "hero", x: 50, y: 130, w: 470, h: 210 });
  L.push({ t: "btn", x: 50, y: 420, w: 190, h: 46 });
  L.push({ t: "img", x: 570, y: 130, w: 380, h: 346 });
  for (let c = 0; c < 4; c++) { const X = 50 + c * 230; L.push({ t: "card", x: X, y: 520, w: 200, h: 90 }); }
  return L;
})();
function webDraw(x, W, H) {
  const s = W / 1000, S = H / 640;
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  for (const o of WEB) {
    if (o.t === "rule") { x.fillStyle = ink(.12); x.fillRect(0, o.y * S, W, 2 * S); continue; }
    const X = o.x * s, Y = o.y * S, w = o.w * s, h = o.h * S;
    if (o.t === "box" || o.t === "txt") { x.fillStyle = ink(o.a); rr(x, X, Y, w, h, o.t === "txt" ? h / 2 : 2 * s); x.fill(); }
    else if (o.t === "btn") { x.fillStyle = RED; rr(x, X, Y, w, h, 4 * s); x.fill(); x.fillStyle = "rgba(255,255,255,.92)"; rr(x, X + 34 * s, Y + h / 2 - 5 * S, w - 68 * s, 10 * S, 5 * S); x.fill(); }
    else if (o.t === "cart") { x.strokeStyle = ink(.6); x.lineWidth = 3 * s; x.beginPath(); x.moveTo(X - 26 * s, Y); x.lineTo(X - 20 * s, Y); x.lineTo(X - 12 * s, Y + 18 * S); x.lineTo(X + 8 * s, Y + 18 * S); x.lineTo(X + 12 * s, Y + 6 * S); x.lineTo(X - 17 * s, Y + 6 * S); x.stroke(); for (const cx of [-10, 6]) { x.beginPath(); x.arc(X + cx * s, Y + 24 * S, 3 * s, 0, 7); x.fill(); } x.fillStyle = RED; x.beginPath(); x.arc(X + 12 * s, Y - 4 * S, 6 * s, 0, 7); x.fill(); }
    else if (o.t === "img") {
      x.fillStyle = ink(.07); x.fillRect(X, Y, w, h);
      x.strokeStyle = ink(.3); x.lineWidth = 2.5 * s; x.lineJoin = "round";
      x.beginPath(); x.moveTo(X, Y + h); x.lineTo(X + w * .32, Y + h * .45); x.lineTo(X + w * .55, Y + h * .72); x.lineTo(X + w * .7, Y + h * .58); x.lineTo(X + w, Y + h); x.stroke();
      x.beginPath(); x.arc(X + w * .74, Y + h * .28, 24 * s, 0, Math.PI * 2); x.stroke();
    } else if (o.t === "card") {
      x.strokeStyle = ink(.18); x.lineWidth = 2 * s; x.strokeRect(X, Y, w, h);
      x.fillStyle = ink(.08); x.fillRect(X + 10 * s, Y + 10 * S, 60 * s, h - 20 * S);
      x.fillStyle = ink(.3); rr(x, X + 84 * s, Y + 20 * S, 90 * s, 9 * S, 4 * S); x.fill();
      x.fillStyle = ink(.18); rr(x, X + 84 * s, Y + 42 * S, 70 * s, 7 * S, 3 * S); x.fill();
    }
  }
}
// dieselbe Seite als Skizze: Blöcke als Rahmen, Textzeilen als Strich, Bild als Rahmen mit Kreuz
function sketchSegs(P) {
  const segs = [], line = (x0, y0, x1, y1) => segs.push([P(x0, y0), P(x1, y1)]);
  const rect = (x, y, w, h) => { line(x, y, x + w, y); line(x + w, y, x + w, y + h); line(x + w, y + h, x, y + h); line(x, y + h, x, y); };
  rect(0, 0, 1000, 640);
  for (const o of WEB) {
    if (o.t === "rule") line(0, o.y, 1000, o.y);
    else if (o.t === "txt") line(o.x, o.y + o.h / 2, o.x + o.w, o.y + o.h / 2);
    else if (o.t === "box" || o.t === "card") rect(o.x, o.y, o.w, o.h);
    else if (o.t === "hero") { line(o.x, o.y + 40, o.x + o.w * .9, o.y + 40); line(o.x, o.y + 110, o.x + o.w * .7, o.y + 110); }
    else if (o.t === "btn") { rect(o.x, o.y, o.w, o.h); line(o.x + 34, o.y + o.h / 2, o.x + o.w - 34, o.y + o.h / 2); }
    else if (o.t === "img") { rect(o.x, o.y, o.w, o.h); line(o.x, o.y, o.x + o.w, o.y + o.h); line(o.x + o.w, o.y, o.x, o.y + o.h); }
  }
  return segs;
}
// Front des Rechnerschranks (Druck, Koordinaten in Welt je Einheit s): Rahmen, oben die Blindplatte (frei für den Satz), darunter drei Einschübe
// mit Laufwerksschlitzen und Lüftung, Sockel mit Rollen. led: Lage des Statuspunkts (u, v von unten)
function rackFront(x, W, H, RW, RH, plateV) {
  const s = W / RW, Y = v => (RH - v) * s;
  x.fillStyle = "#efece5"; x.fillRect(0, 0, W, H);
  x.strokeStyle = ink(.42); x.lineWidth = 4; rr(x, .04 * s, .04 * s, W - .08 * s, H - .08 * s, .02 * s); x.stroke();
  // Blindplatte: feiner Rahmen mit Schrauben in den Ecken
  const p0 = plateV[0], p1 = plateV[1];
  x.strokeStyle = ink(.22); x.lineWidth = 2.5; x.strokeRect(.12 * s, Y(p1), W - .24 * s, (p1 - p0) * s);
  for (const [u, v] of [[.2, p1 - .08], [RW - .2, p1 - .08], [.2, p0 + .08], [RW - .2, p0 + .08]]) { x.fillStyle = ink(.3); x.beginPath(); x.arc(u * s, Y(v), .025 * s, 0, 7); x.fill(); }
  // Einschübe
  const units = [[.95, p0 - .08], [.55, .9], [.18, .5]];
  units.forEach(([a, b], i) => {
    x.strokeStyle = ink(.3); x.lineWidth = 2.5; x.strokeRect(.12 * s, Y(b), W - .24 * s, (b - a) * s);
    if (i === 0) { x.fillStyle = ink(.5); x.fillRect(.3 * s, Y((a + b) / 2) - .01 * s, RW * .35 * s, .02 * s); x.fillRect(RW * .5 * s, Y((a + b) / 2) - .01 * s, RW * .2 * s, .02 * s); }
    else { x.strokeStyle = ink(.25); x.lineWidth = .02 * s; x.lineCap = "round"; for (let k = 0; k < 9; k++) { const xx = (.3 + k * .14) * s; if (xx > W - .9 * s) break; x.beginPath(); x.moveTo(xx, Y(b - .07)); x.lineTo(xx, Y(a + .07)); x.stroke(); } }
  });
  // Fassung des Statuspunkts
  x.strokeStyle = ink(.3); x.lineWidth = 2.5; x.beginPath(); x.arc((RW - .35) * s, Y(.72), .06 * s, 0, 7); x.stroke();
  x.fillStyle = ink(.12); x.fillRect(.04 * s, Y(.12), W - .08 * s, .08 * s);
}

export default function (K) {
  const { F, R, V, Q, sm, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const DESK = c3("#e8e1d2"), LEG = c3("#e1d9c9"), FACE = c3("#f8f6f1"), METAL = c3("#dcd7cd"), CASE = c3("#ece9e2"), FOLDER = c3("#e9dfcb"), FRONTC = c3("#efece5");
  const lean = K.lean, UP = Q - lean;      // Flächen mit Text stehen um die Neigung der Kamera zurückgelehnt (der Kamera zugewandt)

  // ---------- Strecke ----------
  // Der Anfang (kern.js, intro) endet mit der Bildmitte bei XS; danach fährt die Kamera bis XE (Telefon). b läuft im Anfang 0 … BI.
  const BI = .4, XS = N ? .7 : 1.1;
  const DXC = N ? 1.1 : 2.6, DW = N ? 1.85 : 2.7;                      // Tisch: Mitte, halbe Breite
  const RW = N ? 3.0 : 3.6, RD = .9, RH = N ? 2.2 : 2.35, RZ = .45;     // Rechnerschrank: Breite, Tiefe, Höhe, Vorderkante
  const RX0f = DXC + DW + (N ? .7 : 1.2);                               // linke Kante des Schranks in Ruhe (Endlage)
  const LZ = -.2, FZ = .8;                                              // Lesetiefe (Textflächen) und Linie des Fadens davor
  // Sätze
  const e1 = K.EC * 1.35;
  const T1 = K.satz("Ich entwickle *Websites und Onlineshops*.", { e: e1, maxEm: N ? 7.6 : 9.4, on: .3 });
  const T2 = K.satz("Ich binde sie an Ihre *übrigen Systeme* an und betreue sie, solange sie laufen.", { e: K.EV, maxEm: N ? 12 : 14.5, on: 0 });
  const T3 = K.satz("*Agenturen* holen mich als Entwickler ins Projekt, *Unternehmen* arbeiten direkt mit mir.", { maxEm: N ? 14 : 16.5, on: 0 });
  const MW = T3.tw + 1.0, MX0f = RX0f + RW + (N ? 1.2 : 1.6);          // Mappe: Breite, linke Kante in Endlage
  const PHX = MX0f + MW + (N ? .9 : 1.2);                               // Telefon
  const XE = PHX + (N ? .4 : 1.0);
  K.strecke(XS, XE, BI);
  const sicht = K.sicht;

  // ---------- Bogen ----------
  const PZ = N ? 10.4 : 6.25, PW = N ? 3.4 : 5.4, H1 = N ? .85 : .5, D1 = 1.05, H2 = 2.0, D2 = 1.12, K1 = 1.083;
  K.sheet(-PW - 2.5, XE + 3, -9, PZ + .05);
  // ---------- Podest (Startbild): Vorderseite schwenkt am Scharnier PZ hoch, Deck waagerecht, Rückseite klappt hinten herab ----------
  F.part("podest", -.02, .01);
  const STEP = c3("#f6f3ec"), PL = 2 * PW, pt = { clock: "t", over: .04 }, PT0 = 0, PD = .75;
  const face1 = K.panel(R, [-PW, PZ], [PW, PZ], [0, -1], PT0, PD, Q, pt);
  K.P(face1, [[0, 0], [PL, 0], [PL, H1], [0, H1]], STEP, [.35, .5, 0, .5]);
  const deck1 = K.panel(face1, face1.uv(0, H1), face1.uv(PL, H1), [0, -1], PT0, PD, -Q, pt);
  K.P(deck1, [[0, 0], [PL, 0], [PL, D1], [0, D1]], STEP, [0, .5, .5, .5]);
  let deck2 = null, riser = null, back;
  if (N) {
    riser = K.panel(deck1, deck1.uv(0, D1), deck1.uv(PL, D1), [0, -1], PT0, PD, Q, pt);
    K.P(riser, [[0, 0], [PL, 0], [PL, H2 - H1], [0, H2 - H1]], STEP, [.35, .5, 0, .5]);
    deck2 = K.panel(riser, riser.uv(0, H2 - H1), riser.uv(PL, H2 - H1), [0, -1], PT0, PD, -Q, pt);
    K.P(deck2, [[0, 0], [PL, 0], [PL, D2], [0, D2]], STEP, [0, .5, .5, .5]);
    back = K.panel(deck2, deck2.uv(0, D2), deck2.uv(PL, D2), [0, -1], PT0, PD, -Q, pt);
    K.P(back, [[0, 0], [PL, 0], [PL, H2], [0, H2]], STEP, [.35, .5, .5, .5]);
  } else {
    back = K.panel(deck1, deck1.uv(0, D1), deck1.uv(PL, D1), [0, -1], PT0, PD, -Q, pt);
    K.P(back, [[0, 0], [PL, 0], [PL, H1], [0, H1]], STEP, [.35, .5, .5, .5]);
  }
  F.part("name", 0, .01);
  const mark = N ? wortmarke(K, { cx: 0, narrow: true, par: deck2, zb: PZ - D1 - H2, par2: deck1, zb2: PZ - H1, k1: K1 })
    : wortmarke(K, { cx: 0, zb: PZ - H1, narrow: false, par: deck1 });
  const [fA, fB] = mark.folds;
  if (N) { faltkante(K, riser, fA, fA.x + PW, H2 - H1 - fA.f.lw / 2); faltkante(K, face1, fB, fB.x + PW, H1 - fB.f.lw / 2); }
  else faltkante(K, face1, fA, fA.x + PW, H1 - fA.f.lw / 2);
  const KT = N ? ["Webentwicklung", "Raum Plau am See · remote"] : ["Webentwicklung · Raum Plau am See · remote"];
  const ko = { track: .05, col: "#66666a", align: "center", lh: 1.45 };
  const ke = N ? .19 : .15, kick = K.onPanel(face1, K.print(KT, ke, -1, ko), PW, H1 / 2, 1);
  kick.hold = true;

  // ---------- Schreibtisch: Platte hebt sich, L-Beine und Zarge schwenken nach unten (b .1 … .2 im Anfang) ----------
  F.part("tisch", .04, .06);
  const X0 = DXC - DW, X1 = DXC + DW, ZF = 1.25, ZB = N ? -2.9 : -3.15, HT = 1.35, LW = .18, AP = .36;
  const top = F.lift(R, HT, .1, .09, { over: .02 });
  F.poly(top, [[X0, ZF], [X0 + LW, ZF], [X1 - LW, ZF], [X1, ZF], [X1, ZF - LW], [X1, ZB + LW], [X1, ZB], [X1 - LW, ZB], [X0 + LW, ZB], [X0, ZB], [X0, ZB + LW], [X0, ZF - LW]], DESK, .5);
  const down = { own: R, over: .035 };
  for (const [xa, xb] of [[X0, X0 + LW], [X1 - LW, X1]]) {
    K.rect(K.panel(top, [xa, ZF], [xb, ZF], [0, 1], .17, .06, -Q, down), 0, 0, LW, HT, LEG);
    K.rect(K.panel(top, [xa, ZB], [xb, ZB], [0, -1], .175, .06, -Q, down), 0, 0, LW, HT, LEG);
  }
  for (const [xs, sd] of [[X0, -1], [X1, 1]]) {
    K.rect(K.panel(top, [xs, ZF], [xs, ZF - LW], [sd, 0], .172, .06, -Q, down), 0, 0, LW, HT, LEG);
    K.rect(K.panel(top, [xs, ZB + LW], [xs, ZB], [sd, 0], .178, .06, -Q, down), 0, 0, LW, HT, LEG);
  }
  K.rect(K.panel(top, [X0 + LW, ZF], [X1 - LW, ZF], [0, 1], .185, .05, -Q, down), 0, 0, X1 - X0 - 2 * LW, AP, LEG);
  K.rect(K.panel(top, [X0 + LW, ZB], [X1 - LW, ZB], [0, -1], .185, .05, -Q, down), 0, 0, X1 - X0 - 2 * LW, AP, LEG);
  K.rect(K.panel(top, [X0, ZF - LW], [X0, ZB + LW], [-1, 0], .19, .05, -Q, down), 0, 0, ZF - ZB - 2 * LW, AP, LEG);
  K.rect(K.panel(top, [X1, ZF - LW], [X1, ZB + LW], [1, 0], .19, .05, -Q, down), 0, 0, ZF - ZB - 2 * LW, AP, LEG);

  // ---------- Laptop: Unterteil hebt sich flach, das Skizzenblatt dahinter steht als Bildschirm auf (b .2 … .3), die Skizze wird Seite ----------
  F.part("laptop", .12, .07);
  const LWd = N ? 3.1 : 3.9, BD = N ? 1.25 : 1.45, SH = LWd * .62, lx0 = DXC - LWd / 2, lzF = ZF - .35, lzH = lzF - BD;
  const base = K.slab(top, lx0, lx0 + LWd, lzF, lzH, .07, .2, .04, { col: METAL, top: METAL, walls: "flr" });
  K.onFlat(base, K.decal(1024, Math.round(1024 * BD / LWd), (x, W, H) => {
    // Tastatur und Tastfeld, flach
    x.fillStyle = "#d8d3c9"; x.fillRect(0, 0, W, H);
    const kw = W / 15, kh = H * .1;
    x.fillStyle = "#cbc5b9";
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { rr(x, kw * .5 + c * kw, H * .08 + r * kh * 1.15, kw * .82, kh * .82, 4); x.fill(); }
    x.strokeStyle = ink(.25); x.lineWidth = 3; rr(x, W * .36, H * .7, W * .28, H * .24, 8); x.stroke();
  }, LWd - .2, BD - .15, .22), DXC, (lzF + lzH) / 2, .072);
  const scr = K.panel(top, [lx0, lzH], [lx0 + LWd, lzH], [0, -1], .21, .09, UP, { over: .03 });
  K.rect(scr, 0, 0, LWd, SH, FACE, .5);
  // Skizze auf dem liegenden Blatt (lesbar von vorn), zeichnet sich im Anfang und verblasst beim Aufstehen
  const MX = .11, MY = .1, SWd = LWd - 2 * MX, SHd = SH - 2 * MY - .06;
  const P = (x, y) => scr.uv(MX + SWd * x / 1000, MY + SHd * (1 - y / 640));
  F.sketch(scr, sketchSegs(P), .1, .1, { a: .55, dy: .004, fade: b => 1 - sm((b - .215) / .03) });
  // Bildschirm: Rahmen und Website (Skizze wird Seite), darauf die Überschrift E1
  const PXU = 420;
  K.onPanel(scr, K.decal(Math.round(LWd * PXU), Math.round(SH * PXU), (x, W, H) => {
    const bz = .06 * PXU;
    x.fillStyle = ink(.86); rr(x, 0, 0, W, H, bz * .6); x.fill();
    x.save(); x.translate(MX * PXU, (MY + .06) * PXU); x.beginPath(); x.rect(0, 0, SWd * PXU, SHd * PXU); x.clip(); webDraw(x, SWd * PXU, SHd * PXU); x.restore();
  }, LWd, SH, .25, .04), LWd / 2, SH / 2, 1, [0, -1]);
  // Überschrift im Feld „hero“ der Website (x 50 … 520, y 130 … 340 von 1000 × 640)
  K.onPanel(scr, T1, MX + SWd * .05 + T1.w / 2 - T1.t.padX * e1, MY + SHd * (1 - 235 / 640), 1, [0, -1]);

  // ---------- Rechnerschrank (übrige Systeme): Kasten mit Front, Satz auf der Blindplatte, Statuspunkt ----------
  const rackIn = sicht(RX0f).in;
  const RT = K.trage(RX0f + RW / 2, T2.tw, {});
  const RX0 = RT.c0 - RW / 2;
  F.part("rechner", Math.max(.06, rackIn - .02), .05);
  const rpar = RT.node(R);
  const tR = Math.max(.2, rackIn + .015);
  const rack = K.box(rpar, RX0, RX0 + RW, RZ, RZ - RD, RH, tR, .06, { col: CASE, fcol: FRONTC });
  const plate = [RH - .14 - (T2.th + .5), RH - .14];
  K.onPanel(rack.fr, K.decal(Math.round(RW * 300), Math.round(RH * 300), (x, W, H) => rackFront(x, W, H, RW, RH, plate), RW, RH, tR + .03), RW / 2, RH / 2, -1);
  T2.on = tR + .05;
  K.onPanel(rack.fr, T2, .3 + T2.w / 2 - T2.t.padX * K.EV, (plate[0] + plate[1]) / 2 + .02, -1);
  K.ticker(rack.fr, .045, rack.fr.uv(RW - .35, .72), [0, 1], -1, tR + .06);
  // Rollen unter dem Schrank (Handy: er rollt ein Stück mit)
  for (const u of [.35, RW - .35]) K.rect(K.panel(rpar, [RX0 + u - .12, RZ + .02], [RX0 + u + .12, RZ + .02], [0, 1], tR, .04, Q, { over: .02 }), 0, 0, .24, .12, METAL, .4);
  // Kabel vom Laptop über die Tischkante zum Schrank (bleibt am Endort; am Handy erst, wenn der Schrank steht)
  const ty = HT + .03, xe = X1 + .05, zc = lzH - .2, RXf = RX0f;
  K.cable([V(DXC + LWd * .3, HT + .1, lzH - .05), V(DXC + LWd * .42, ty, zc), V(X1 - .2, ty, zc), V(xe, HT - .1, zc + .02), V(xe + .03, .5, zc + .03), V(xe + .2, .025, zc), V((xe + RXf) / 2, .025, zc - .1), V(RXf - .1, .1, RZ - RD / 2), V(RXf, .35, RZ - RD / 2)], .022, "#8e8981", Math.max(RT.bB, tR + .04), .06);

  // ---------- Projektmappe: der Faden holt sie ins Bild, sie richtet sich auf (Deckel zurückgelehnt), Reiter „Projekt“ ----------
  const MT = K.trage(MX0f + MW / 2, T3.tw, { minD: N ? 0 : 2.6, R: 38 });
  const MX0 = MT.c0 - MW / 2, mIn = sicht(MX0).in;
  F.part("mappe", Math.max(.06, mIn - .03), .05);
  const mpar = MT.node(R);
  const MH = T3.th + .95, MZ = .15, tM = Math.max(BI + .01, Math.min(mIn + .02, MT.bA - .02));
  // Rückseite liegt flach, Deckel steht am vorderen Falz auf (zurückgelehnt), seitliche Stützen
  K.rect(K.panel(mpar, [MX0, MZ], [MX0 + MW, MZ], [0, -1], tM - .01, .02, 0, { nofold: true, over: 0 }), 0, 0, MW, MH * .55, FOLDER, .45);
  const cover = K.panel(mpar, [MX0, MZ], [MX0 + MW, MZ], [0, -1], tM, .05, UP, { over: .04 });
  K.P(cover, [[0, 0], [MW, 0], [MW, MH], [MW * .62, MH], [MW * .6, MH + .22], [MW * .38, MH + .22], [MW * .36, MH], [0, MH]], FOLDER, .45);
  const tab = K.print(["Projekt"], K.EC * .55, tM + .04, { font: "kicker", col: "#6a645a", align: "center" });
  K.onPanel(cover, tab, MW / 2, MH + .1, 1, [0, -1]);
  T3.on = tM + .05;
  K.onPanel(cover, T3, .5 + T3.w / 2 - T3.t.padX * K.EC, MH - .32 - T3.h / 2 + T3.t.padX * .5 * K.EC, 1, [0, -1]);
  for (const [u, sd] of [[0, -1], [MW, 1]]) { const wl = K.panel(cover, cover.uv(u, 0), cover.uv(u, .9), [sd, 0], tM + .02, .03, -Q, { over: .05 }); K.P(wl, [[0, 0], [.9, 0], [.3 * Math.sin(lean), .3 * Math.cos(lean)]], FOLDER, .35); }

  // ---------- Telefon (direkt): Gehäuse mit Tastenfeld, Hörer liegt auf ----------
  const pIn = sicht(PHX).in;
  F.part("telefon", Math.max(.06, pIn - .02), .04);
  const tP = Math.max(BI + .01, pIn + .015), PWd = .95, PDp = .8, PHt = .3, PZ0 = -.1;
  const ph = K.box(R, PHX, PHX + PWd, PZ0, PZ0 - PDp, PHt, tP, .05, { col: CASE, hf: .22, hb: .38 });
  K.onPanel(ph.top, K.decal(256, 230, (x, W, H) => { x.fillStyle = "#e4e0d7"; x.fillRect(0, 0, W, H); x.fillStyle = ink(.35); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { rr(x, 40 + c * 62, 20 + r * 50, 46, 34, 6); x.fill(); } }, PWd * .55, PDp * .6, tP + .04), PWd * .72, ph.topL * .5, -1, [0, 1]);
  const hs = K.slab(R, PHX - .05, PHX + .32, PZ0 + .02, PZ0 - PDp - .02, .5, tP + .02, .04, { col: CASE, top: CASE, walls: "flr" });
  K.cable([V(PHX + .13, .5, PZ0 + .02), V(PHX + .05, .2, PZ0 + .25), V(PHX + .4, .02, PZ0 + .3), V(PHX + PWd * .6, .15, PZ0)], .016, "#8e8981", tP + .04, .04);

  // ---------- Konstruktionsphase ----------
  F.geruest({ tags: ["tisch", "laptop"], t0: .05, t1: .12, du: .02, a: .5 });
  F.spur({ tags: ["tisch", "laptop", "rechner", "mappe", "telefon"], quiet: [scr, rack.fr, cover], a: .3 });

  // ---------- Faden: vom Statuspunkt des Schranks auf den Bogen, an der Mappe vorbei zum Telefon und weiter ----------
  const LED = [RX0f + RW - .35, .72, RZ + .012];
  const faden = [LED, [LED[0] + .06, .45, RZ + .1], [LED[0] + .3, .004, FZ - .2], [LED[0] + 1.0, .004, FZ], [XE + 4, .004, FZ]];

  // ---------- Startbild (frontal) ----------
  const tanS = () => Math.tan((N ? 44 : 32) * Math.PI / 360);
  const startD = (W, H) => {
    const T = tanS(), f = H / (2 * T);
    const cap = (PW - .3) / (T * W / H) - (N ? D1 : 0);
    if (N) { const l = Math.min(-.2 - mark.w1 / 2, .2 - mark.l2 / 2), r = Math.max(-.2 + mark.w1 / 2, .2 + mark.l2 / 2); return Math.min(cap, (r - l) * f / (.7 * W)); }
    return Math.min(Math.max(3 * mark.e / T, mark.w * f / (.7 * W)), cap);
  };
  const dep = (W, H) => PZ + startD(W, H) - S.name.C.z;
  const startPx = (W, H, s) => s.e0 * H / (2 * tanS() * dep(W, H));
  const startSx = (W, H) => S.name.C.x / (tanS() * (W / H) * dep(W, H));
  const startSy = (W, H) => (S.name.C.y - H1) / (tanS() * dep(W, H));
  const S = { name: { prints: [...mark.prints, kick], e0: mark.e, b: 0, fb: 0, px: startPx, pxN: startPx, sx: startSx, nsx: startSx, sy: startSy, nsy: startSy, C: V(0, H1, PZ) } };
  return {
    strecke: [XS, XE], lineZ: LZ,
    intro: { stop: S.name, bI: BI, len: { d: 150, n: 170 } },
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .5 },
    faden,
    anchor: 0,
    stops: [{ name: "e1", prints: [T1] }, { name: "e2", prints: [T2] }, { name: "e3", prints: [T3] }]
  };
}
