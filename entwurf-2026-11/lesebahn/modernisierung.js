// Szene Modernisierung (Lesebahn, Prinzip „Die Szene ist der Träger“): TAPETE ABZIEHEN.
// Das Ding ist eine Stellwand (Wand auf Füßen mit Rollen), die aus dem Bogen aufklappt und zurückgelehnt der Kamera zugewandt steht. Auf ihr hängt die alte
// Website als vergilbte Tapete (Tabellenlayout, Rahmen, verwaschene Farben, Flecken, gewellte Ränder). Beim Scrollen wird sie von links nach rechts abgezogen: die
// Abrisskante wandert (ungefähr) mit der Kamera, die abgezogene Bahn rollt sich vor der Wand zu einer Rolle (Muster innen), darunter steht die neue Seite
// (klar, ruhig, heutiges Layout). Dieselben Blöcke und dieselbe Adresse stehen auf beiden Schichten an derselben Stelle.
//   M0 Kopf auf dem Wandfries (bleibt, die Tapete ist um den Fries herumgeklebt)
//   M1 auf der alten Tapete, in der Zelle „Text“ (wird gelesen, bevor die Kante kommt)
//   M2 auf der neuen Schicht, in derselben Zelle weiter rechts (die Kante ist vorbeigezogen)
//   M3 auf dem Adressschild der Wand; die Tapete ist um das Schild herum ausgeschnitten, es sitzt auf alter und neuer Schicht an derselben Stelle (die Wand bleibt)
// Handy: Die Stellwand steht auf Rollen. Wo ein Satz am schmalen Bild sonst zu kurz stünde, schiebt der Tapezierer die ganze Wand (Füße mit Rollen) ein Stück
// mit der Kamera mit (K.trage): einmal für Kopf und M1, einmal für M2, einmal für das Schild mit M3. Die Abrisskante läuft in Wandkoordinaten und ist davon nicht berührt.
// Technik: Wand = Faltmodell (Segmente mit Füßen klappen nacheinander auf, Bastellinien vorher); Schichten = Texturen auf den Segmenten; die alte Schicht wird
// mit einer Schnittebene (x ≥ Abrisskante) abgezogen, die Rolle ist ein eigenes Netz (Spirale), das mit der Kante mitwächst.
import { dunst } from "./falt.js";

const INK = "#303033";
const ink = a => `rgba(48,48,51,${a})`;
const rr = (x, X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };
const prng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const grad = (x, radial, a, stops) => {
  const g = radial ? x.createRadialGradient(...a) : x.createLinearGradient(...a);
  if (g && g.addColorStop) for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};
// monotone kubische Interpolation (Fritsch–Carlson), Steigung 0 an den Enden
function pchip(P) {
  const n = P.length, h = [], d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) { h[i] = P[i + 1][0] - P[i][0]; d[i] = (P[i + 1][1] - P[i][1]) / h[i]; }
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return b => {
    if (b <= P[0][0]) return P[0][1];
    if (b >= P[n - 1][0]) return P[n - 1][1];
    let i = 0; while (i < n - 2 && b > P[i + 1][0]) i++;
    const t = (b - P[i][0]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * P[i][1] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * P[i + 1][1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

export default function (K, opt) {
  const { F, R, Q, THREE, narrow: N, clamp } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const hw = K.halfW, rim = 24 / K.ppw, hwR = hw - rim;
  const UP = Q - K.lean, ZW = Math.tan(K.lean) * K.YL;      // Wand steht um die Neigung der Kamera zurückgelehnt, ihre Ebene geht durch den Lesepunkt
  const WALLC = c3("#f3f0e8"), FOOTC = c3("#dcd7cd"), CASTC = c3("#b9b3a6");

  // ---------- Maße der Wand (v: Höhe an der Wand, u: Länge) ----------
  const HW = 5.0, SK = .34, FR0 = 3.45, FR1 = 4.45, VC = 1.65, CV0 = .8, CV1 = 2.5;
  const S1 = "Viele WordPress-Seiten laufen seit Jahren auf *veralteten Themes, Plugins und PHP-Versionen*.";
  const S2 = "Ich bringe sie *technisch und gestalterisch* auf den heutigen Stand.";
  const S3 = "Dabei achte ich darauf, dass *Inhalte und Adressen erhalten bleiben*.";
  const kp = K.kopf({ head: "Modernisierung", on: 0, e: N ? K.EC * 1.4 : undefined });
  const T1 = K.satz(S1, { maxEm: N ? 9.5 : 16.5, on: 0 });
  const T2 = K.satz(S2, { e: K.EC * 1.2, maxEm: N ? 8.2 : 13.5, on: 0 });
  const T3 = K.satz(S3, { maxEm: N ? 9 : 16.5, on: 0 });
  const w0 = kp.w, w1 = T1.tw, w2 = T2.tw, w3 = T3.tw;
  const cx = (pr, left) => left + pr.w / 2 - pr.t.padX * pr.e;        // Mitte des Drucks, wenn der Text bei „left“ beginnt
  // Blöcke der Seite von links nach rechts (gleiche Stellen auf alter und neuer Schicht)
  const G0 = 3.3, A = { u0: G0, u1: G0 + w1 + .8 };
  const Sd = { u0: A.u1 + .7, u1: A.u1 + .7 + (N ? 3.4 : 4.4) };
  const B = { u0: Sd.u1 + .7, u1: Sd.u1 + .7 + w2 + .8 };
  const I2 = { u0: B.u1 + .7, u1: B.u1 + .7 + 2.2 };
  const pageR = I2.u1 + .3;
  const sgH = Math.max(2.7, T3.th + 1.7), sgW = Math.max(w3 + .9, 2.9);
  const sg = { u0: pageR + 1.3, u1: pageR + 1.3 + sgW, v1: 3.25, v0: Math.max(SK + .15, 3.25 - sgH) };
  const Lw = sg.u1 + .9;
  const a1 = G0 + .4, a2 = B.u0 + .4;
  const sgC = (sg.u0 + sg.u1) / 2, sgTv = (sg.v0 + .15 + sg.v1 - 1.2) / 2;
  const gr = Math.max(G0 + w0, a1 + w1), wG = gr - G0, ucG = (G0 + gr) / 2, uc2 = a2 + w2 / 2;

  // ---------- Fahrt: Mitfahrt der Stellwand am Handy (K.trage), Strecke ----------
  const RD = 46, RT = 40;                                               // Lesedauer der Mitfahrt, davon mindestens frei bzw. unversehrt (vh)
  const D = [wG, w2, sgW - .8].map(w => K.trage(0, w, { R: RD }).D);
  const uc = [ucG, uc2, sgC], cF = []; let acc = 0;
  D.forEach((d, i) => { acc += d; cF[i] = uc[i] + acc; });
  const WXS = 0, xs = WXS - hw, xe = cF[2] + .7, Slen = xe - xs;
  K.strecke(xs, xe);
  const T = [wG, w2, sgW - .8].map((w, i) => K.trage(cF[i], w, { R: RD }));
  const vb = K.vWorld / Slen;                                           // b je vh
  let par = R; for (const t of T) par = t.node(par);
  const rides = T.filter(t => t.D > 0);
  const shiftW = b => rides.reduce((s, t) => s + t.D * t.ease(clamp((b - t.bA) / Math.max(1e-3, t.bB - t.bA), 0, 1)), 0);
  const bWhere = fn => { for (let i = 0; i <= 3000; i++) if (fn(i / 3000)) return i / 3000; return 1; };
  const riseB = (u, off) => bWhere(b => WXS + u + shiftW(b) - off <= K.xAt(b));
  const FZ = 1.3;

  // ---------- Segmente der Wand, Füße ----------
  // Schnitte zwischen den Segmenten: gleichmäßig, aber nie durch einen Text (jeder Satz liegt ganz auf einem Segment)
  const PXU = 120, NS0 = 12;
  const spans = [[G0, G0 + w0], [a1, a1 + w1], [a2, a2 + w2], [sgC - w3 / 2, sgC + w3 / 2]].map(([a, b]) => [a - .15, b + .15]);
  let cuts = [];
  for (let k = 1; k < NS0; k++) { let c = k * Lw / NS0; for (const [a, b] of spans) if (c > a && c < b) c = c - a < b - c ? a : b; cuts.push(c); }
  cuts = cuts.sort((p, q) => p - q).filter((c, i, A) => (i ? c - A[i - 1] > .7 : c > .7) && Lw - c > .7);
  const E = [0, ...cuts, Lw], NS = E.length - 1;
  const rise = [], bast = [];
  for (let k = 0; k < NS; k++) {
    const rs = riseB(E[k], 1.5 * hw), p0 = riseB(E[k], 1.9 * hw);
    rise.push([rs, (.25 * hw) / Slen]);
    bast.push([Math.max(0, p0), Math.max(.012, rs - p0)]);
  }
  const sn = [];
  for (let k = 0; k < NS; k++) {
    const u0 = E[k], SW = E[k + 1] - u0, [rs, rd] = rise[k];
    F.part("wand" + k, Math.min(.97, bast[k][0]), bast[k][1]);
    const nd = K.panel(par, [WXS + u0, ZW], [WXS + u0 + SW, ZW], [0, -1], Math.min(.98, rs), rd, UP, { over: .04 });
    K.rect(nd, 0, 0, SW, HW, WALLC, .35);
    sn.push(nd);
    // Fuß mit zwei Rollen, liegt flach vor der Wand
    const fw = Math.min(N ? .8 : 1.0, SW - .3), fx = u0 + SW / 2 - fw / 2;
    const ft = K.panel(par, [WXS + fx, ZW], [WXS + fx + fw, ZW], [0, 1], Math.min(.98, rs), rd, 0, { over: 0 });
    K.rect(ft, 0, 0, fw, .6, FOOTC, .35);
    for (const cu of [.09, fw - .27]) K.rect(ft, cu, .32, cu + .18, .5, CASTC, .35, .0006);
  }
  // Rahmen für die Rolle: Knoten in der Ebene der aufgestellten Wand über die ganze Länge, ohne Fläche
  F.part("rahmen", 0, .01);
  const fr = K.panel(par, [WXS, ZW], [WXS + 1, ZW], [0, -1], Math.min(.98, rise[0][0]), rise[0][1], UP, { over: 0, nofold: true, nocut: true });

  // ---------- Zeichnungen der beiden Schichten (Einheiten: Wand, v nach oben) ----------
  const Y = v => HW - v;
  const box = (u0, v0, u1, v1) => [u0, Y(v1), u1 - u0, v1 - v0];
  const BL = [
    { k: "logo", u0: .7, u1: 2.7, v0: 2.8, v1: 3.3 },
    { k: "nav", u0: G0, u1: I2.u1, v0: 2.85, v1: 3.3 },
    { k: "img", u0: .7, u1: 2.7, v0: CV0, v1: CV1 },
    { k: "text", id: "A", u0: A.u0, u1: A.u1, v0: CV0, v1: CV1 },
    { k: "side", u0: Sd.u0, u1: Sd.u1, v0: CV0, v1: CV1 },
    { k: "text", id: "B", u0: B.u0, u1: B.u1, v0: CV0, v1: CV1 },
    { k: "img", u0: I2.u0, u1: I2.u1, v0: CV0, v1: CV1 }
  ];
  const HOLES = [[0, 0, Lw, SK], [0, FR0, Lw, FR1], [sg.u0 - .12, sg.v0 - .12, sg.u1 + .12, sg.v1 + .12]];

  function friese(x) {
    x.fillStyle = "#e9e3d2"; x.fillRect(...box(0, FR0, Lw, FR1));
    x.fillStyle = ink(.38); x.fillRect(...box(0, FR0, Lw, FR0 + .016)); x.fillRect(...box(0, FR1 - .016, Lw, FR1));
    x.fillStyle = ink(.16); x.fillRect(...box(0, FR0 + .1, Lw, FR0 + .11)); x.fillRect(...box(0, FR1 - .11, Lw, FR1 - .1));
    for (let u = .1, i = 0; u < Lw; u += .3, i++) {
      x.fillStyle = ink(.11);
      x.fillRect(...box(u, FR0 + .16 + (i & 1 ? .04 : 0), u + .16, FR0 + .24 + (i & 1 ? .04 : 0)));
      x.fillRect(...box(u, FR1 - .24 - (i & 1 ? .04 : 0), u + .16, FR1 - .16 - (i & 1 ? .04 : 0)));
    }
  }
  function schild(x) {
    const { u0, u1, v0, v1 } = sg;
    rr(x, ...box(u0, v0, u1, v1), .16); x.fillStyle = "#fbfaf6"; x.fill(); x.lineWidth = .05; x.strokeStyle = INK; x.stroke();
    rr(x, ...box(u0 + .11, v0 + .11, u1 - .11, v1 - .11), .1); x.lineWidth = .014; x.strokeStyle = ink(.5); x.stroke();
    for (const [su, sv] of [[u0 + .26, v1 - .26], [u1 - .26, v1 - .26], [u0 + .26, v0 + .26], [u1 - .26, v0 + .26]]) {
      x.beginPath(); x.arc(su, Y(sv), .045, 0, 7); x.strokeStyle = ink(.5); x.lineWidth = .014; x.stroke();
    }
    // Adressfeld (bleibt), schlichtes Zeichen statt einer echten Adresse
    rr(x, ...box(u0 + .4, v1 - 1.05, u1 - .4, v1 - .45), .1); x.fillStyle = "#ffffff"; x.fill(); x.lineWidth = .02; x.strokeStyle = ink(.7); x.stroke();
    x.save(); x.translate(u0 + .62, Y(v1 - .75)); x.scale(.01, .01);
    x.font = '500 30px "Schibsted Grotesk", sans-serif'; x.textBaseline = "middle"; x.fillStyle = INK; x.fillText("/leistungen", 0, 0); x.restore();
    x.fillStyle = ink(.2); x.fillRect(...box(u0 + .4, v1 - 1.2, u1 - .4, v1 - 1.2 + .014));
  }
  // Neue Schicht: klar, viel Luft, feine Linien, keine Rahmen
  function newBlock(x, b) {
    const w = b.u1 - b.u0, h = b.v1 - b.v0;
    const card = () => { rr(x, ...box(b.u0, b.v0, b.u1, b.v1), .12); x.fillStyle = "#ffffff"; x.fill(); x.lineWidth = .014; x.strokeStyle = ink(.15); x.stroke(); };
    const bar = (u, v, ww, hh, a) => { x.fillStyle = ink(a); rr(x, ...box(u, v, u + ww, v + hh), hh / 2); x.fill(); };
    if (b.k === "logo") { rr(x, ...box(b.u0, b.v0 + .04, b.u0 + .4, b.v0 + .44), .08); x.fillStyle = ink(.86); x.fill(); bar(b.u0 + .6, b.v0 + .25, 1.0, .08, .5); bar(b.u0 + .6, b.v0 + .1, .65, .06, .22); }
    else if (b.k === "nav") {
      const n = 5, cw = w / n;
      for (let i = 0; i < n; i++) bar(b.u0 + i * cw + cw * .15, b.v0 + .2, cw * .5, .07, i === 0 ? .6 : .3);
      x.fillStyle = ink(.7); x.fillRect(...box(b.u0 + cw * .15, b.v0 + .1, b.u0 + cw * .65, b.v0 + .112));
      x.fillStyle = ink(.1); x.fillRect(...box(b.u0, b.v0, b.u1, b.v0 + .012));
    } else if (b.k === "img") {
      card(); x.strokeStyle = ink(.3); x.lineWidth = .02; x.lineJoin = "round";
      x.beginPath(); x.moveTo(b.u0 + .15, Y(b.v0 + .2)); x.lineTo(b.u0 + w * .35, Y(b.v0 + h * .55)); x.lineTo(b.u0 + w * .55, Y(b.v0 + h * .38)); x.lineTo(b.u0 + w * .7, Y(b.v0 + h * .5)); x.lineTo(b.u1 - .15, Y(b.v0 + .2)); x.stroke();
      x.beginPath(); x.arc(b.u0 + w * .72, Y(b.v0 + h * .78), .14, 0, 7); x.stroke();
    } else if (b.k === "text") {
      card();
      if (b.id === "A") { bar(b.u0 + .4, b.v1 - .45, w * .5, .1, .5); for (let i = 0; i < 4; i++) bar(b.u0 + .4, b.v1 - .75 - i * .22, (w - .8) * (i === 3 ? .55 : .96 - i * .06), .06, .2); }
    } else if (b.k === "side") {
      card();
      for (let i = 0; i < 3; i++) { const v = b.v1 - .55 - i * .5; x.fillStyle = ink(.08); rr(x, ...box(b.u0 + .3, v - .14, b.u0 + .62, v + .18), .06); x.fill(); bar(b.u0 + .85, v + .06, w * .55, .08, .4); bar(b.u0 + .85, v - .1, w * .38, .06, .18); }
    } else if (b.k === "banner") {
      rr(x, ...box(b.u0, b.v0, b.u1, b.v1), .14); x.fillStyle = "#ebe7dc"; x.fill();
      bar(b.u0 + .6, b.v1 - .55, 4.6, .16, .4); bar(b.u0 + .6, b.v1 - .9, 3.2, .08, .2);
      rr(x, ...box(b.u0 + .6, b.v0 + .22, b.u0 + 2.2, b.v0 + .62), .08); x.lineWidth = .02; x.strokeStyle = ink(.6); x.stroke();
    }
  }
  function drawNew(x) {
    x.fillStyle = "#f3f0e8"; x.fillRect(0, 0, Lw, HW);
    x.fillStyle = "#e7e2d5"; x.fillRect(...box(0, 0, Lw, SK)); x.fillStyle = ink(.28); x.fillRect(...box(0, SK, Lw, SK + .014));
    friese(x);
    for (const b of BL) newBlock(x, b);
    schild(x);
  }
  // Alte Schicht: vergilbtes Papier mit Rautenmuster, Tabellenlayout mit Rahmen (erhaben/vertieft), verwaschene Farben, Flecken
  function bevel(x, u0, v0, u1, v1, fill, t = .04) {
    x.fillStyle = fill; x.fillRect(...box(u0, v0, u1, v1));
    x.fillStyle = "#f2ebd2"; x.fillRect(...box(u0, v1 - t, u1, v1)); x.fillRect(...box(u0, v0, u0 + t, v1));
    x.fillStyle = "#9b9275"; x.fillRect(...box(u0, v0, u1, v0 + t)); x.fillRect(...box(u1 - t, v0, u1, v1));
  }
  function oldBlock(x, b, rnd) {
    const w = b.u1 - b.u0, bars = (u, v, ww, n, col) => { for (let i = 0; i < n; i++) { x.fillStyle = col; x.fillRect(...box(u, v - i * .2, u + ww * (i === n - 1 ? .6 : .88 + rnd() * .1), v - i * .2 + .075)); } };
    if (b.k === "logo") { bevel(x, b.u0, b.v0, b.u1, b.v1, "#c8bd9d"); x.fillStyle = "rgba(60,55,70,.55)"; x.fillRect(...box(b.u0 + .15, b.v0 + .1, b.u0 + .75, b.v1 - .1)); x.fillStyle = ink(.4); x.fillRect(...box(b.u0 + .9, b.v0 + .27, b.u1 - .2, b.v0 + .36)); x.fillRect(...box(b.u0 + .9, b.v0 + .14, b.u1 - .6, b.v0 + .21)); }
    else if (b.k === "nav") {
      const n = 5, cw = w / n;
      for (let i = 0; i < n; i++) { bevel(x, b.u0 + i * cw + .03, b.v0, b.u0 + (i + 1) * cw - .03, b.v1, "#bfc6c4", .035); x.fillStyle = ink(.4); x.fillRect(...box(b.u0 + i * cw + cw * .2, b.v0 + .19, b.u0 + i * cw + cw * .75, b.v0 + .26)); }
    } else if (b.k === "img") {
      bevel(x, b.u0, b.v0, b.u1, b.v1, "#b4b8b2", .05);
      const iu0 = b.u0 + .14, iu1 = b.u1 - .14, iv0 = b.v0 + .14, iv1 = b.v1 - .14;
      x.fillStyle = "#c4cdca"; x.fillRect(...box(iu0, (iv0 + iv1) / 2, iu1, iv1)); x.fillStyle = "#a8ab8c"; x.fillRect(...box(iu0, iv0, iu1, (iv0 + iv1) / 2));
      x.fillStyle = "#d7c98d"; x.beginPath(); x.arc(iu0 + (iu1 - iu0) * .7, Y(iv1 - .35), .17, 0, 7); x.fill();
      x.strokeStyle = ink(.5); x.lineWidth = .02; x.strokeRect(...box(iu0, iv0, iu1, iv1));
    } else if (b.k === "text") {
      bevel(x, b.u0, b.v0, b.u1, b.v1, "#e1d8bc");
      if (b.id === "B") { x.fillStyle = "rgba(109,125,146,.7)"; x.fillRect(...box(b.u0 + .4, b.v1 - .42, b.u0 + .4 + w * .5, b.v1 - .32)); bars(b.u0 + .4, b.v1 - .7, w - .8, 4, ink(.3)); }
    } else if (b.k === "side") {
      bevel(x, b.u0, b.v0, b.u1, b.v1, "#d6cdb1");
      for (let i = 0; i < 5; i++) bevel(x, b.u0 + .35 + i * .34, b.v1 - .5, b.u0 + .35 + i * .34 + .28, b.v1 - .2, "#bdb89e", .03);
      for (let i = 0; i < 3; i++) { x.fillStyle = "rgba(109,125,146,.7)"; x.fillRect(...box(b.u0 + .35, b.v1 - .85 - i * .26, b.u0 + .35 + w * (.5 - i * .06), b.v1 - .85 - i * .26 + .075)); }
    } else if (b.k === "banner") {
      bevel(x, b.u0, b.v0, b.u1, b.v1, "#c8bd9d", .05);
      for (let v = b.v0 + .12; v < b.v1 - .12; v += .24) { x.fillStyle = (Math.round((v - b.v0) / .24) & 1) ? "rgba(255,255,255,.1)" : "rgba(80,70,40,.06)"; x.fillRect(...box(b.u0 + .12, v, b.u1 - .12, v + .12)); }
      x.fillStyle = "rgba(100,112,135,.75)"; x.fillRect(...box(b.u0 + .4, b.v1 - .6, b.u0 + 6.2, b.v1 - .3)); x.fillStyle = "rgba(250,246,230,.7)"; x.fillRect(...box(b.u0 + .6, b.v1 - .5, b.u0 + 3.6, b.v1 - .42));
    }
  }
  function drawOld(x, withHoles) {
    const rnd = prng(11);
    x.fillStyle = "#e5dbbd"; x.fillRect(0, 0, Lw, HW);
    x.strokeStyle = "rgba(168,150,100,.28)"; x.lineWidth = .012;
    for (let u = -HW; u < Lw + HW; u += .5) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u + HW, HW); x.stroke(); x.beginPath(); x.moveTo(u, HW); x.lineTo(u + HW, 0); x.stroke(); }
    for (let i = 0; i < 18; i++) { const cu = rnd() * Lw, cv = rnd() * HW, r = .5 + rnd() * 1.5; x.fillStyle = grad(x, true, [cu, cv, 0, cu, cv, r], [[0, "rgba(140,105,50,.14)"], [1, "rgba(140,105,50,0)"]]); x.fillRect(cu - r, cv - r, 2 * r, 2 * r); }
    for (let i = 0; i < 11; i++) { const u = rnd() * Lw, len = 1.2 + rnd() * 2.4, ww = .08 + rnd() * .14; x.fillStyle = grad(x, false, [0, 0, 0, len], [[0, "rgba(120,95,50,.12)"], [1, "rgba(120,95,50,0)"]]); x.fillRect(u, 0, ww, len); }
    x.fillStyle = grad(x, false, [0, 0, 0, .5], [[0, "rgba(120,90,40,.24)"], [1, "rgba(120,90,40,0)"]]); x.fillRect(0, 0, Lw, .5);
    x.fillStyle = grad(x, false, [0, HW - .6, 0, HW], [[0, "rgba(120,90,40,0)"], [1, "rgba(120,90,40,.26)"]]); x.fillRect(0, HW - .6, Lw, .6);
    // Tabellen: Rumpf der Seite und Kopfbereich mit Rahmen
    bevel(x, .5, .58, pageR + .1, 3.5, "#d8cfb2", .06);
    for (const b of BL) oldBlock(x, b, rnd);
    if (withHoles) {
      // Papierkante an den Schnitten (Tapete ist um Sockel, Fries und Schild herum geklebt), danach ausschneiden
      x.fillStyle = "rgba(70,55,30,.32)";
      for (const [a, b, c, d] of HOLES) x.fillRect(...box(a - .035, b - .035, c + .035, d + .035));
      x.globalCompositeOperation = "destination-out"; x.fillStyle = "#000";
      for (const [a, b, c, d] of HOLES) x.fillRect(...box(a, b, c, d));
      x.globalCompositeOperation = "source-over";
    }
  }
  function drawAlpha(x) {
    x.fillStyle = "#fff"; x.fillRect(0, 0, Lw, HW);
    x.fillStyle = "#000"; for (const [a, b, c, d] of HOLES) x.fillRect(...box(a, b, c, d));
  }
  const mkCanvas = (u0, u1, k, fn) => {
    const cv = document.createElement("canvas"); cv.width = Math.ceil((u1 - u0) * k); cv.height = Math.ceil(HW * k);
    const x = cv.getContext("2d"), kx = cv.width / (u1 - u0), ky = cv.height / HW;
    x.setTransform(kx, 0, 0, ky, -u0 * kx, 0); fn(x); return cv;
  };
  const tex = (cv, srgb = true) => { const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

  // ---------- Schichten auf den Segmenten ----------
  const PL = new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e5);         // Abrisskante (Welt): x ≥ Kante bleibt
  const wave = (u, v) => {
    const dv = Math.min(v - SK, HW - v, Math.abs(v - FR0) , Math.abs(v - FR1)), du = Math.min(u, Lw - u);
    const d = Math.min(dv, du), a = d < .45 ? .04 * (1 - d / .45) ** 2 : 0;
    return a * (.5 + .5 * Math.sin(u * 2.3 + (v < 3 ? .7 : 2.1)));
  };
  for (let k = 0; k < NS; k++) {
    const u0 = E[k], u1 = E[k + 1], SW = u1 - u0;
    // neue Schicht
    const mN = dunst(new THREE.MeshBasicMaterial({ map: tex(mkCanvas(u0, u1, PXU, drawNew)), toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), 1);
    const gN = new THREE.PlaneGeometry(SW, HW), pN = { mesh: K.add(new THREE.Mesh(gN, mN)) }; pN.mesh.frustumCulled = false;
    K.onPanel(sn[k], pN, SW / 2, HW / 2, 1, null, .004);
    // alte Schicht: Raster mit gewellten Rändern, wird an der Abrisskante abgeschnitten
    const nx = Math.max(10, Math.round(SW * 8)), ny = 48, pos = [], uv = [], idx = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const px = i / nx * SW, py = j / ny * HW; pos.push(px - SW / 2, py - HW / 2, wave(u0 + px, py)); uv.push(i / nx, j / ny); }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const gO = new THREE.BufferGeometry(); gO.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gO.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); gO.setIndex(idx);
    const mO = dunst(new THREE.MeshBasicMaterial({ map: tex(mkCanvas(u0, u1, PXU, x => drawOld(x, true))), alphaTest: .5, toneMapped: false }), 1);
    mO.clippingPlanes = [PL];
    const pO = { mesh: K.add(new THREE.Mesh(gO, mO)) }; pO.mesh.frustumCulled = false;
    K.onPanel(sn[k], pO, SW / 2, HW / 2, 1, null, .012);
  }

  // ---------- Rolle: die abgezogene Bahn wickelt sich vor der Wand auf (Muster innen, Rückseite außen) ----------
  const NSP = 420, TT = .04, R0 = .1, NPL = .012;
  const lowOld = tex(mkCanvas(0, Lw, 50, x => drawOld(x, true))), alpha = tex(mkCanvas(0, Lw, 40, drawAlpha), false);
  const rPos = new Float32Array((NSP + 1) * 6), rCol = new Float32Array((NSP + 1) * 6), rUv = new Float32Array((NSP + 1) * 4), rIdx = [];
  for (let k = 0; k < NSP; k++) { const a = 2 * k, b = 2 * k + 1, c = 2 * k + 2, d = 2 * k + 3; rIdx.push(a, b, c, c, b, d); }
  const rGeo = new THREE.BufferGeometry();
  rGeo.setAttribute("position", new THREE.BufferAttribute(rPos, 3).setUsage(THREE.DynamicDrawUsage));
  rGeo.setAttribute("color", new THREE.BufferAttribute(rCol, 3).setUsage(THREE.DynamicDrawUsage));
  rGeo.setAttribute("uv", new THREE.BufferAttribute(rUv, 2).setUsage(THREE.DynamicDrawUsage));
  rGeo.setIndex(rIdx);
  const mIn = dunst(new THREE.MeshBasicMaterial({ map: lowOld, vertexColors: true, alphaTest: .5, side: THREE.FrontSide, toneMapped: false }), 1);
  const mOut = dunst(new THREE.MeshBasicMaterial({ color: new THREE.Color("#d9cfb0"), alphaMap: alpha, vertexColors: true, alphaTest: .5, side: THREE.BackSide, toneMapped: false }), 1);
  const rollG = K.add(new THREE.Group());
  for (const m of [mIn, mOut]) { const me = new THREE.Mesh(rGeo, m); me.frustumCulled = false; rollG.add(me); }
  F.attach(fr, rollG, fr.uv(0, 0), [0, -1], 1, 0);
  const LD = [-.38, .93];
  function rollUpdate(xt) {
    rollG.visible = xt > .02;
    if (!rollG.visible) return;
    const Ro = Math.sqrt(R0 * R0 + TT * xt / Math.PI), phiEnd = 2 * Math.PI * (Ro - R0) / TT, kap = TT / (4 * Math.PI);
    for (let k = 0; k <= NSP; k++) {
      const phi = phiEnd * k / NSP, r = Ro - TT * phi / (2 * Math.PI), sg_ = Ro * phi - kap * phi * phi;
      const s = Math.sin(phi), c = Math.cos(phi), px = xt - r * s, pz = NPL + Ro - r * c;
      const sh = .7 + .3 * clamp(-s * LD[0] + -c * LD[1], 0, 1);
      for (let e = 0; e < 2; e++) {
        const i = (2 * k + e) * 3;
        rPos[i] = px; rPos[i + 1] = e ? HW : 0; rPos[i + 2] = pz;
        rCol[i] = rCol[i + 1] = rCol[i + 2] = sh;
        const j = (2 * k + e) * 2; rUv[j] = clamp((xt - sg_) / Lw, 0, 1); rUv[j + 1] = e;
      }
    }
    rGeo.attributes.position.needsUpdate = true; rGeo.attributes.color.needsUpdate = true; rGeo.attributes.uv.needsUpdate = true;
  }

  // ---------- Texte ----------
  const segOf = u => { let k = 0; while (k < NS - 1 && u >= E[k + 1]) k++; return k; };
  const place = (pr, uC, v, lift) => { const k = segOf(uC); K.onPanel(sn[k], pr, uC - E[k], v, 1, null, lift); };
  const onFor = (ua, ub) => { let m = 0; for (let k = segOf(ua); k <= segOf(ub); k++) m = Math.max(m, rise[k][0] + rise[k][1]); return Math.min(.99, m + .012); };
  place(kp.h, cx(kp.h, G0), (FR0 + FR1) / 2, .007);
  place(T1, cx(T1, a1), VC, .0155);
  place(T2, cx(T2, a2), VC, .007);
  place(T3, sgC, sgTv, .007);
  kp.h.on = onFor(G0, G0 + w0); T1.on = onFor(a1, a1 + w1); T2.on = onFor(a2, a2 + w2); T3.on = onFor(sgC - w3 / 2, sgC + w3 / 2);

  // ---------- Abrisskante: Lauf in b, von den Lesefenstern abgeleitet ----------
  const bws = (c0, w) => K.bAt(c0 - (hwR - w / 2)), blv = (cf, w) => K.bAt(cf + (hwR - w / 2));
  const bS = K.bAt(-.3 * hw);
  let b1 = Math.min(blv(cF[0], wG) - 4 * vb, Math.max(bws(T[0].c0, wG), T1.on, kp.h.on) + 58 * vb);
  let b2 = Math.max(bws(T[1].c0, w2), T2.on, blv(cF[1], w2) - 55 * vb);
  b1 = Math.max(b1, bS + .02); b2 = Math.max(b2, b1 + .03);
  const bE = Math.max(b2 + .04, Math.min(1, K.bAt(xe - 1.2)));
  const tear = pchip([[bS, 0], [b1, A.u0 - .1], [b2, B.u1 + .35], [bE, Lw]]);
  K.anim(b => {
    const xt = tear(b), g = rollG.parent;
    PL.constant = -((g ? g.position.x : 0) + WXS + shiftW(b) + xt);
    rollUpdate(xt);
  });
  // M1 gehört zur Tapete und wird mit ihr abgezogen
  T1.mat.clippingPlanes = [PL];


  // ---------- Bogen ----------
  K.sheet(WXS - 2.5, WXS + Lw + D[0] + D[1] + D[2] + 2.5, -12, 3);

  // ---------- Faden: vor der Wand über den Boden, an den Füßen vorbei ----------
  const faden = [[WXS + 2, .004, FZ], [xe + 4, .004, FZ]];
  return {
    strecke: [xs, xe], lineZ: 0, faden,
    stops: [{ name: "m0", prints: [kp.h] }, { name: "m1", prints: [T1] }, { name: "m2", prints: [T2] }, { name: "m3", prints: [T3] }],
    dbg: { D, b1, b2, bS, bE, Lw, Slen, NS, rise, bast, E, tear, shiftW, a1, w1, a2, w2, sgC, w3, wG, G0, A, B, sg, TT, R0 }
  };
}
