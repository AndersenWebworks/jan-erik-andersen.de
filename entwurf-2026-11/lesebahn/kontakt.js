// Kontakt (letzte Szene der Lesebahn, Fassung „gleichmäßige Fahrt“; Drehbuch: DREHBUCH-LESEBAHN.md, Abschnitt 17; Prinzip: PRINZIP-SZENE-IST-TRAEGER.md).
// Das Ding ist der Briefumschlag mit Siegel, wie bisher: „Schreiben Sie mir“ heißt Brief. Der Faden war die ganze Seite lang unterwegs, jetzt kommt er an.
//  K1 Überschrift groß auf der Umschlag-Vorderseite, die Klappe öffnet sich nach hinten.
//  K2 bis K4 Karten Mail, Telefon, LinkedIn: stehen vor dem Umschlag auf (Desktop nebeneinander, Handy gestaffelt untereinander), jede ist ein Link.
//  K5 Standort klein an der Unterkante des Umschlags.
// Der Faden zieht den Umschlag samt Karten in sein Ziel: der Umschlag steht zuerst still, fährt dann mit dem Faden (Punkt in Bildmitte) mit und kommt mit dem
// Ende der Strecke zur Ruhe (Mitfahrt, siehe K.trage; sie läuft hier bis zum Seitenende, die Kamera hält gemeinsam mit ihm an). Letztes Bild (x = xe):
// Umschlag, Überschrift, drei Karten und Standort ganz im Bild, das Siegel liegt in Bildmitte auf dem Bogen, der Faden endet in ihm, sein roter Punkt wird der Siegelpunkt.
// Die Tiefenstaffel (Umschlag hinten, Karten davor, Siegel ganz vorn) bildet das Bild von oben nach unten; Schriftgrößen werden je Ebene auf die Zielgröße in Bildpunkten gerechnet.
const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235", INKC = "#303033", MUTED = "#66666a";
const rr = (x, X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };
const S5 = t => t * t * t - t * t * t * t / 2;

// Siegel: Wachsscheibe mit gezacktem Rand (der rote Punkt des Fadens liegt in der Mitte)
function sealDraw(x, W, H) {
  x.translate(W / 2, H / 2); const r = W * .46;
  x.fillStyle = "#b50029"; x.beginPath();
  for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2, q = r * (i % 2 ? .94 : 1); x.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  x.closePath(); x.fill();
  x.fillStyle = RED; x.beginPath(); x.arc(0, 0, r * .82, 0, Math.PI * 2); x.fill();
  x.strokeStyle = "rgba(255,255,255,.3)"; x.lineWidth = r * .05; x.beginPath(); x.arc(0, 0, r * .58, 0, Math.PI * 2); x.stroke();
}

const CT = [
  ["Mail", "mail@andersen-webworks.de", "mailto:mail@andersen-webworks.de"],
  ["Telefon", "+49 38733 270015", "tel:+4938733270015"],
  ["LinkedIn", "andersen-erik", "https://www.linkedin.com/in/andersen-erik/"]
];

export default function (K, opt = {}) {
  const { F, R, Q, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const BODY = c3("#efe6d2"), FLAPC = c3("#d9cbab"), CARD = c3("#f8f6f1");
  const lean = K.lean, SIN = Math.sin(lean), COS = Math.cos(lean), YL = K.YL, LZ = 0;
  const RG = K.RIG, ppw = K.ppw, halfW = K.halfW, HH = RG.H;

  // ---------- Ebenen: Tiefe und Bildlage ----------
  // Eine zurückgelehnte Fläche mit Scharnier bei z steht senkrecht zur Blickrichtung. Ihr Maßstab gegen die Lesetiefe: sc(z); ein Punkt im Abstand v vom
  // Scharnier (entlang der Fläche) liegt im Bild bei yBild = yL − ppw·sc·(v − v0(z)). Mit zForY legt man die Fußlinie (v = 0) auf eine Bildhöhe.
  const yL = HH / 2 * (1 - RG.sy);
  const sc = z => RG.depth / (RG.depth + SIN * YL - COS * (z - LZ));
  const v0 = z => COS * YL + SIN * (z - LZ);
  const yFuss = z => yL + ppw * sc(z) * v0(z);
  const zForY = y => { let a = -8, b = 18; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (yFuss(m) < y) a = m; else b = m; } return (a + b) / 2; };

  // ---------- Maße ----------
  const Pt = N ? 21 : 23;                                   // Zielgröße der Kartenschrift in Bildpunkten (Desktop ≥ 22, Handy ≥ 18)
  const mw = Math.max(...CT.map(c => K.measure([c[1]]).tw));  // breitester Wert in em
  const CWem = 1.1 + mw + .7;                                  // Karte in em (Breite)
  // Desktop: drei Karten nebeneinander, wenn die Reihe samt Rand ins Bild passt; sonst (Handy, schmale Fenster) gestaffelt untereinander
  const ST = N || (3 * CWem + 2 * 1.2) * Pt > RG.W - 80;
  const CHem = ST ? 3.8 : 4.2;                                 // Karte in em (Höhe)
  const emOf = z => Pt / (ppw * sc(z));
  // senkrechter Plan (Bildpunkte von oben): Klappe, Umschlag, Karten, Siegel
  const usable = HH - 64 - 70;
  let flapPx, envPx, gap1, gap2 = 0, rowPx, sealPx, y0;
  const cardPx = CHem * Pt;
  if (!ST) {
    envPx = Math.max(230, Math.min(340, usable * .38)); flapPx = Math.round(envPx * .4); gap1 = 36; sealPx = 120;
    rowPx = cardPx;
  } else {
    flapPx = 68; gap1 = 22; gap2 = 14; sealPx = 76;
    rowPx = 3 * cardPx + 2 * gap2;
    envPx = Math.min(210, Math.max(160, usable - 8 - (flapPx + gap1 + rowPx + sealPx)));
  }
  const total = flapPx + envPx + gap1 + rowPx + sealPx;
  y0 = 64 + 8 + Math.max(0, (usable - 8 - total) * .5);
  const yEt = y0 + flapPx, yEb = yEt + envPx, yR0 = yEb + gap1;       // Oberkante, Fußlinie des Umschlags, Oberkante der Karten
  const zE = zForY(yEb), scE = sc(zE);
  const cardZ = [], cardEm = [];
  CT.forEach((c, k) => {
    const yb = ST ? yR0 + k * (cardPx + gap2) + cardPx : yR0 + cardPx;      // Fußlinie der Karte k
    const z = zForY(yb); cardZ.push(z); cardEm.push(emOf(z));
  });
  const ySeal = (ST ? yR0 + rowPx : yR0 + cardPx) + sealPx * .5;
  const zS = zForY(ySeal);                                     // Faden und Siegel (liegen auf dem Bogen, Mittelpunkt auf der Fußlinie-Höhe)

  // Karten (Welt): je Ebene eigene em
  const cards = CT.map((c, k) => { const em = cardEm[k]; return { c, k, em, W: CWem * em, H: CHem * em, z: cardZ[k] }; });
  const CW = cards[0].W, GAPC = cards[0].em * 1.2;
  const rowW = 3 * CW + 2 * GAPC;
  // Überschrift
  const hLines = ["Schreiben Sie mir,", "worum es geht."];
  const hw1 = K.measure(hLines, { font: "kopf" }).tw;                       // em
  const eK = Math.min((ST ? Math.min(56, (envPx - 52) / 2.35) : 78) / (ppw * scE), (ST ? (RG.W - 76) / (ppw * scE) : rowW) / hw1 * .96);
  const BW = ST ? Math.min((RG.W - 20) / (ppw * scE), Math.max(cards[0].W + 1.0, hw1 * eK + .9)) : Math.max(rowW + 1.4, hw1 * eK + 2);
  const BH = envPx / (ppw * scE), FH = .42 * BH;
  const eSt = 20.6 / (ppw * scE);                                          // Standortzeile (≥ 19,5 Bildpunkte)

  // ---------- Mitfahrt ----------
  // Breite des Bilds, das ruhig stehen soll (Bildpunkte → Welt an der Lesetiefe)
  const wScr = (ST ? BW * scE : rowW * sc(cardZ[0]) + 1.0);
  const D = K.trage(0, wScr, { R: 38, minD: ST ? 9 : 10.5 }).D;
  const xe = 0, c0 = xe - D, r = Math.min(D, halfW * .5), X1 = c0 - r / 2;
  const xs = c0 - BW / 2 - halfW / scE;
  K.strecke(xs, xe);
  const bAt = K.bAt, q = e => bAt(X1 + e);                                   // q(e): Fortschritt, wenn die Kamera e hinter dem Beginn der Mitfahrt ist
  const ride = F.slide(R, [D, 0, 0], bAt(X1), 1 - bAt(X1), {
    ease: x => { const u = x * (xe - X1); return (u <= 0 ? 0 : u < r ? r * S5(u / r) : r / 2 + (u - r)) / D; }, lv: R.lvl
  });

  // ---------- Aufsteller: zurückgelehnte Fläche mit zwei Stützen ----------
  function stand(par, a, b, W, H, rise, col, gs = 1) {
    const nd = K.panel(par, a, b, [0, -1], rise, .045, Q - lean, { over: .04 });
    K.rect(nd, 0, 0, W, H, col, .4);
    const ws = Math.min(.42 * gs, H * .45), ug = ws * SIN, vg = ws * COS, uT = Math.min(H * .85, .75 * gs);
    const wl = K.panel(nd, nd.uv(0, 0), nd.uv(0, uT), [-1, 0], rise + .03, .035, -Q, { over: .07 });
    K.P(wl, [[0, 0], [uT, 0], [ug, vg]], col, .3);
    const wr = K.panel(nd, nd.uv(W, 0), nd.uv(W, uT), [1, 0], rise + .034, .035, -Q, { over: .07 });
    K.P(wr, [[0, 0], [uT, 0], [ug, vg]], col, .3);
    return { nd, vg, quiet: [nd, wl, wr] };
  }
  // v der Mitte eines Drucks, dessen Grundlinie bei vb steht
  const vMid = (pr, vb) => vb + pr.h / 2 - pr.t.bfb * pr.e;

  // ---------- Umschlag ----------
  const tEnv = Math.max(.02, bAt(c0 - BW / 2 - halfW / scE) + .01);
  F.part("umschlag", tEnv, .05);
  const env = stand(ride, [c0 - BW / 2, zE], [c0 + BW / 2, zE], BW, BH, tEnv + .02, BODY, 2.2);
  const tFlap = q(.6), dFlap = q(1.6) - tFlap;
  const flapAng = -Math.acos(Math.min(.97, flapPx / (ppw * scE) / FH));      // aufgeklappt nach hinten oben; Bildhöhe ≈ flapPx
  const flap = K.panel(env.nd, env.nd.uv(0, BH), env.nd.uv(BW, BH), [0, -1], tFlap, dFlap, flapAng, { over: .04 });
  K.P(flap, [[0, 0], [BW, 0], [BW / 2, FH]], FLAPC, [.5, .5, .5]);      // Innenseite (Futterpapier) etwas dunkler
  K.F.line(env.nd, env.nd.uv(0, BH), env.nd.uv(BW, BH), .3);                // feine Falzlinie an der Oberkante
  // Überschrift groß auf der Vorderseite
  const hOn = bAt(c0 - Math.max(0, (halfW - (hw1 * eK) / 2 * scE - .6) / scE));
  const H3 = K.print(hLines, eK, hOn, { font: "kopf", align: "center", lh: 1.12, text: hLines.join(" ") });
  K.onPanel(env.nd, H3, BW / 2, BH - .2 * eK - H3.h / 2 - .08, 1);
  // Standort klein an der Unterkante
  const eOn = ST ? q(4.6) : q(7.2);
  const St = K.print(["Raum Plau am See · remote"], eSt, eOn, { align: "center", col: MUTED, text: "Raum Plau am See · remote" });
  K.onPanel(env.nd, St, BW / 2, vMid(St, .2 + eSt * .25), 1);

  // ---------- Karten ----------
  const tK = ST ? [1.3, 2.4, 3.5] : [2.0, 3.6, 5.2], dK = ST ? .6 : 1.0;
  const decs = cards.map(g => {
    const { c, k, em, W, H, z } = g;
    const t0 = q(tK[k]), d = q(tK[k] + dK) - t0, tOn = t0 + d + .006;
    F.part("karte" + (k + 1), t0, d);
    const x = c0 - rowW / 2 + k * (CW + GAPC), xc = ST ? c0 - W / 2 : x;
    const s = stand(ride, [xc, z], [xc + W, z], W, H, t0, CARD, 1);
    // Zeichnung: Rahmen, roter Punkt (anklickbar), Unterstrich unter dem Wert
    const x0 = em * 1.1, vb = em * (.78 + (CHem - 3.8) * .15), lb = em * (CHem - 1.18), vw = K.measure([c[1]]).tw * em;
    const pu = 280;
    const dec = K.decal(Math.max(64, Math.round(W * pu)), Math.max(64, Math.round(H * pu)), (cx, Wp, Hp) => {
      cx.strokeStyle = ink(.24); cx.lineWidth = Math.max(2, em * pu * .035); rr(cx, 3, 3, Wp - 6, Hp - 6, em * pu * .36); cx.stroke();
      cx.fillStyle = RED; cx.beginPath(); cx.arc(em * .52 * pu, Hp - (vb + em * .3) * pu, em * .13 * pu, 0, Math.PI * 2); cx.fill();
      cx.strokeStyle = ink(.7); cx.lineWidth = Math.max(2, em * pu * .05); cx.beginPath();
      cx.moveTo(x0 * pu, Hp - (vb - em * .17) * pu); cx.lineTo((x0 + vw) * pu, Hp - (vb - em * .17) * pu); cx.stroke();
    }, W, H, tOn, .02);
    K.link(dec, c[2]); dec.textual = true;
    K.onPanel(s.nd, dec, W / 2, H / 2, 1);
    const val = K.print([c[1]], em, tOn, { col: INKC, text: c[1] });
    K.onPanel(s.nd, val, x0 - val.t.padX * em + val.w / 2, vMid(val, vb), 1);
    const lab = K.print([c[0]], em * .88, tOn, { col: MUTED, text: c[0] });
    K.onPanel(s.nd, lab, x0 - lab.t.padX * lab.e + lab.w / 2, vMid(lab, lb), 1);
    return { dec, val, lab, tOn };
  });

  // ---------- Siegel am Ende des Fadens (liegt flach auf dem Bogen, Mitte bei x = xe) ----------
  const sd = .95 * sc(zS);
  const seal = K.decal(256, 256, sealDraw, sd, sd, -1);
  K.onFlat(R, seal, xe, zS, .003);

  K.sheet(xs - 3, xe + halfW / scE + 3, -9, zS + 4);

  // ---------- Faden: aus der Fadenebene der Bahn auf die Siegelhöhe, dann geradeaus ins Siegel ----------
  const xa = c0 - BW / 2 - .6, zIn = 1.0;
  const faden = [[xs + .3, .004, zIn], [(xs + .3 + xa) / 2, .004, (zIn + zS) / 2], [xa, .004, zS], [xe - 2.0, .004, zS], [xe, .004, zS]];

  const stops = [
    { name: "k1", prints: [H3] },
    ...decs.map((d, k) => ({ name: "k" + (k + 2), prints: [d.val, d.lab] })),
    { name: "k5", prints: [St] }
  ];
  return { strecke: [xs, xe], lineZ: LZ, faden, stops, anchor: xe };
}
