// Für Agenturen (Szene 13, Drehbuch Abschnitt 16): Einsteckschiene eines laufenden Projekts. Das Ding ist die Schiene selbst, und meine Teile
// sind die eingesteckten Teile, die die Sätze tragen (Prinzip „Die Szene ist der Träger“).
// Die Schiene hat zwei Nuten: hinten die Standnut (dort stecken die Karten mit zwei Zinken), vorn die Laufnut (dort liegt der rote Faden und
// läuft die Karte, die eingesteckt wird). Alle Karten stehen auf ihren Zinken etwas über der Schiene, so läuft der Faden sichtbar unter ihnen.
//  Y0 Kopfstück der Schiene (Reiter) mit dem Kopf „Für Agenturen“; am Handy wird es auf der Schiene bis an die Karten geschoben.
//  Y1 Die Standnut ist mit Karten der Agentur besetzt (Entwürfe des laufenden Projekts), an einer Stelle klafft die Lücke, die mittlere Leiste
//     ist dort offen. Meine Karte trägt Y1, läuft mit den Zinken in der Laufnut zur Lücke (Mitfahrt, auch am Desktop) und steckt sich hinein.
//  Y2 Vier vorhandene Bausteine stehen hinter der Schiene, beschriftet „Theme“, „Plugins“, „Abläufe“, „Werkzeuge“; auf ihren Deckeln läuft eine
//     Nut. Mein Aufsatz trägt Y2, steht mit dem Fuß in dieser Nut, gleitet über die Bausteine (er arbeitet sich ein) und rastet im Raster ein;
//     die Fugen seines Fußes setzen die Fugen der Bausteine fort.
//  Y3 Am Ende der Schiene ein Wendeschild im Rahmen (Pfosten in der Standnut): vorn die Felder „Konditionen“ und „Freie Kapazität“, leer; es
//     dreht sich um, auf der Rückseite steht Y3 (auf Anfrage, keine Zahl). Am Handy gleitet der Rahmen in der Standnut mit.
// Dahinter eine ruhige zweite Schiene der Agentur mit wenigen großen Karten (das laufende Projekt; am Handy hinter jedem Satz).

export default function (K) {
  const { F, R, Q, THREE, narrow: N } = K;
  const PI = Math.PI;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const PAPER = c3("#faf8f3"), CARD = c3("#ece9e2"), CARD2 = c3("#e8e1d2"), RAIL = c3("#e1d9c9"), BLOCK = c3("#e8e1d2"), BLOCKF = c3("#efece5");
  const TINT = c3("#e2ddd3"), TINT2 = c3("#e8e4db"), BAND = c3("#f1ede4"), PIN = c3("#b9b2a6"), INK = K.COL.INK;
  const lean = K.lean, UP = Q - lean, cl = Math.cos(lean), sl = Math.sin(lean);
  const MUTED = "#66666a";

  // ---------- Schiene (z der Szene) ----------
  // Leisten A (hinten), B (Mitte), C (vorn); Standnut bei ZH zwischen A und B, Laufnut bei ZG zwischen B und C (Faden).
  const LA = [-.18, -.08], LB = [.08, .3], LC = [.54, .64], ZH = 0, ZG = .42, LIPH = .09;
  const V0 = .4;                                               // Zinken: Karten stehen so hoch über der Nut
  const LZ = -.6;
  const MX = .42;                                              // Rand der Sätze auf ihren Flächen

  // ---------- Kopf und Sätze ----------
  const kp = K.kopf({ head: "Für Agenturen", headLines: N ? ["Für", "Agenturen"] : null });
  const e1 = K.EC * 1.3;
  const T1 = K.satz("Ich *steige in laufende Projekte ein*.", { e: e1, maxEm: N ? 9 : 20 });
  const e2 = K.EC * 1.04;
  const T2 = K.satz("Ich arbeite mich in bestehende *Themes und Plugins* ein und halte mich an *Ihre Abläufe und Werkzeuge*.", { e: e2, maxEm: N ? 15.5 : 22 });
  const T3 = K.satz("*Konditionen und freie Kapazität* nenne ich Ihnen auf Anfrage.", { maxEm: N ? 14 : 17 });

  // ---------- Maße ----------
  const HW = kp.w + 2 * MX, HHt = kp.h.h + .75;                                // Kopfstück
  const W1 = T1.tw + 2 * MX + .2, Hc = Math.max(1.5, T1.th + 1.0);           // Karte Y1 (alle Karten der Schiene haben ihre Höhe)
  const AW = N ? 1.05 : 1.3, AG = .14, CLR = .05;                              // Karten der Agentur, Abstand, Spiel in der Lücke
  const hb = .42, BZ0 = -.22, BZ1 = -.62, ZP = -.42;                           // Bausteine (Höhe, Vorder- und Hinterkante), Nut auf den Deckeln
  const k2 = N ? 2 : 3, bw = Math.max(1.5, (T2.tw + 2 * MX) / k2), P2W = k2 * bw;
  const vb = .26, H2 = vb + .3 + T2.th + .42;                                  // Aufsatz: Fuß, Höhe
  const W3 = T3.tw + 2 * MX + .1, H3 = Math.max(1.25, T3.th + .9), PW = .12, W3f = W3 + 2 * (PW + .05);   // Wendeschild, Rahmen

  // Mitfahrten (der Weg hängt nur von der Breite ab): zuerst messen, dann legen; wo eine nötig ist, mit Reserve
  const need = w => K.trage(0, w, {}).D, plus = (w, x) => need(w) > 0 ? need(w) + x : 0;
  const D0 = plus(kp.w, .5);
  const D1 = Math.max(N ? 0 : 2.4, plus(T1.tw, .6));
  const D2n = need(T2.tw), nB = k2 + Math.max(1, Math.ceil(D2n / bw - 1e-6)), D2 = (nB - k2) * bw;
  const D3 = plus(T3.tw, 1.0);

  // Lage von links nach rechts (Kopfstück in Endlage bei 0 … HW; am Handy beginnt es um D0 weiter links)
  const xH0 = 0, xH1 = HW, cH = HW / 2, xHs = xH0 - D0;
  const xA = [xH1 + .3, xH1 + .3 + AW + AG];                                   // zwei Karten der Agentur vor der Lücke
  const gL = xA[1] + AW + AG, gR = gL + W1 + 2 * CLR, cF1 = (gL + gR) / 2;     // Lücke
  const xA3 = gR + AG;                                                          // eine Karte danach
  const xB0 = xA3 + AW + (N ? .9 : 1.1), xB1 = xB0 + nB * bw;                   // Bausteine
  const cF2 = xB0 + D2 + P2W / 2;
  const x30 = xB1 + (N ? 1.0 : 1.3), cF3 = x30 + D3 + W3f / 2;                  // Wendeschild: Startlage beginnt bei x30
  const RAILEND = cF3 + W3f / 2 + .75, ECW = .5, XE = RAILEND - ECW / 2;          // Endkappe der Schiene: dort endet die Strecke
  const XS = xHs - K.halfW;
  K.strecke(XS, XE);
  const sicht = K.sicht;

  K.sheet(xHs - 1.6, RAILEND + .6, -14, ZG + V0 + Hc + .9);

  // ---------- Hilfen ----------
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  // Entwurf auf einer Karte der Agentur (zart): Kopfleiste, Bildfeld, zwei, drei Textzeilen; v0 Unterkante der Fläche
  function wire(nd, W, H, v0) {
    const m = Math.max(.12, Math.min(.2, W * .1)), dy = .0008;
    K.rect(nd, m, v0 + H - m - .08, m + (W - 2 * m) * (.3 + .2 * rnd()), v0 + H - m, TINT, 0, dy);
    const iy0 = v0 + H * (.42 + .08 * rnd()), iy1 = v0 + H - m - .2;
    K.rect(nd, m, iy0, W - m, iy1, TINT2, 0, dy);
    for (let i = 0; i < 3; i++) { const y = iy0 - .14 - i * .15; if (y - .045 < v0 + m) break; K.rect(nd, m, y - .045, m + (W - 2 * m) * (.4 + .4 * rnd()), y, TINT, 0, dy); }
  }
  // Schienenstück unter [xa, xb]; open: ohne mittlere Leiste (Einlass an der Lücke)
  function rail(xa, xb, t0, open) {
    for (const L of open ? [LA, LC] : [LA, LB, LC]) K.slab(R, xa, xb, L[1], L[0], LIPH, t0, .035, { col: RAIL, top: RAIL, walls: "f" });
  }
  // Karte auf zwei Zinken: Fläche v0 … v0 + h, Zinken 0 … v0 (stecken in der Nut). n: Richtung, in der sie liegt; ang: Aufstellwinkel
  function card(par, x0, w, h, z, t0, col, o = {}) {
    const n = o.n || [0, -1], nd = K.panel(par, [x0, z], [x0 + w, z], n, t0, .045, o.ang || UP, { over: .04 });
    K.rect(nd, 0, V0, w, V0 + h, col, .45);
    const zi = Math.min(.3, w * .18);
    for (const u of [zi, w - zi - .12]) K.rect(nd, u, 0, u + .12, V0, col, .4);
    return nd;
  }
  const tin = x => Math.max(.004, sicht(x).in);

  // ---------- Kopfstück (Y0): Reiter auf der Schiene ----------
  F.part("kopf", .004, .03);
  const tK = .03;
  const T0t = K.trage(cH, kp.w, { minD: D0 });
  rail(xHs, xH1 + .3, .01);
  const head = card(T0t.node(R), T0t.c0 - HW / 2, HW, HHt, ZH, tK, CARD2);
  K.rect(head, .12, V0 + .12, HW - .12, V0 + HHt - .12, PAPER, 0, .0008);
  kp.h.on = tK + .05;
  K.onPanel(head, kp.h, MX + kp.h.w / 2 - kp.h.t.padX * kp.eH, V0 + HHt / 2, 1, [0, -1]);

  // ---------- Karten der Agentur vor und hinter der Lücke ----------
  for (const x of [xA[0], xA[1], xA3]) {
    const t = tin(x);
    F.part("ag" + x.toFixed(2), t + .005, .03);
    rail(x - AG / 2, x + AW + AG / 2, t + .02);
    wire(card(R, x, AW, Hc, ZH, t + .045, CARD), AW, Hc, V0);
  }

  // ---------- Y1: Karte läuft in der Laufnut zur Lücke und steckt sich hinein ----------
  const T1t = K.trage(cF1, T1.tw, { minD: D1 });
  const c01 = T1t.c0, t1in = tin(c01 - W1 / 2);
  F.part("y1", t1in + .005, .035);
  const tIns = Math.max(T1t.bB, t1in + .1) + .004, dIns = .03;
  // Einlass: gestrichelte Führung von der Laufnut in die Standnut
  F.sketch(R, [[[gL, ZG], [gL, ZH]], [[gR, ZG], [gR, ZH]]], tin(gL) + .01, .03, { dash: true, a: .45, fade: b => 1 - .7 * K.sm((b - tIns - dIns) / .03) });
  rail(gL - AG / 2, gR + AG / 2, tin(gL) + .02, true);
  const r1 = T1t.node(R);
  const ins = F.slide(r1, [0, 0, ZH - ZG], tIns, dIns, { over: .05 });
  // liegt nach vorn (die Laufnut ist hinten von den Karten der Agentur besetzt) und klappt über die Senkrechte auf
  const tU1 = t1in + .045;
  const y1 = card(ins, c01 - W1 / 2, W1, Hc, ZG, tU1, PAPER, { n: [0, 1], ang: Q + lean });
  T1.on = tU1 + .055;
  K.onPanel(y1, T1, MX + .1 + T1.w / 2 - T1.t.padX * e1, V0 + Hc / 2 + .04, -1);
  F.geruest({ tags: ["y1"], t0: t1in - .01, t1: tU1, du: .03, a: .5, bAt: Math.min(tU1 + .06, T1t.bA) });

  // ---------- Y2: Bausteine hinter der Schiene, Aufsatz gleitet in der Nut auf ihren Deckeln ins Raster ----------
  const NAMES = ["Theme", "Plugins", "Abläufe", "Werkzeuge"];
  const eL = N ? .13 : .135;
  for (let i = 0; i < nB; i++) {
    const x = xB0 + i * bw, t = tin(x);
    F.part("bau" + i, t + .005, .03);
    rail(x, x + bw, t + .02);
    const bx = K.box(R, x + .02, x + bw - .02, BZ0, BZ1, hb, t + .045, .05, { col: BLOCK, fcol: BLOCKF });
    if (NAMES[i]) K.onPanel(bx.fr, K.print([NAMES[i]], eL, t + .1, { font: "kicker", col: "#5f5f63", align: "center", text: NAMES[i] }), (bw - .04) / 2, hb / 2 + .01, -1);
    // Nut auf dem Deckel (zwei feine Linien knapp über dem Deckel)
    const gl = F.lift(R, hb + .002, t + .1, .005, { over: 0 });
    for (const z of [ZP + .07, ZP - .07]) F.line(gl, [x + .04, z], [x + bw - .04, z], .4, INK, .0006);
  }
  const T2t = K.trage(cF2, T2.tw, { minD: D2 });
  const c02 = T2t.c0, t2in = tin(c02 - P2W / 2);
  F.part("aufsatz", t2in + .005, .035);
  // der Aufsatz liegt in Deckelhöhe auf der Nut und stellt sich in ihr auf (Ebene von Anfang an auf Deckelhöhe)
  const r2 = T2t.node(R);
  const tL2 = t2in + .03, tU2 = t2in + .06;
  const lf = F.lift(r2, hb + .012, 0, .001, { over: 0 });
  const plate = K.panel(lf, [c02 - P2W / 2, ZP], [c02 + P2W / 2, ZP], [0, -1], tU2, .055, UP, { over: .04 });
  K.rect(plate, 0, 0, P2W, H2, PAPER, .5);
  K.rect(plate, 0, 0, P2W, vb, BAND, 0, .0008);
  F.line(plate, plate.uv(0, vb), plate.uv(P2W, vb), .4, INK, .0012);
  for (let j = 1; j < k2; j++) F.line(plate, plate.uv(j * bw, 0), plate.uv(j * bw, vb), .45, INK, .0012);
  T2.on = tU2 + .06;
  K.onPanel(plate, T2, MX + T2.w / 2 - T2.t.padX * e2, vb + .3 + T2.th / 2 + .02, 1, [0, -1]);
  F.geruest({ tags: ["aufsatz"], t0: t2in - .01, t1: tL2, du: .03, a: .5, bAt: Math.min(tU2 + .06, T2t.bA) });

  // ---------- Y3: Wendeschild am Ende der Schiene ----------
  const T3t = K.trage(cF3, T3.tw, { minD: D3 });
  const c03 = T3t.c0, t3in = tin(c03 - W3f / 2);
  rail(x30 - .2, RAILEND - ECW, tin(x30) + .02);
  // Endkappe: hier endet die Schiene, der Faden läuft hinaus zum Umschlag
  F.part("kappe", tin(RAILEND - ECW) + .005, .03);
  K.box(R, RAILEND - ECW, RAILEND, LC[1] + .04, LA[0] - .1, .2, tin(RAILEND - ECW) + .045, .05, { col: RAIL, fcol: RAIL });
  F.part("schild", t3in + .005, .035);
  const r3 = T3t.node(R);
  const tU3 = t3in + (N ? .03 : .045), tUe = tU3 + .05;
  // Rahmen: zwei Pfosten (stecken in der Standnut) und ein Querholm in der Ebene des Schilds
  const SV = V0, fx0 = c03 - W3f / 2, vc = SV + H3 / 2, fH = SV + H3 + .14;
  const frame = K.panel(r3, [fx0, ZH], [fx0 + W3f, ZH], [0, -1], tU3, .05, UP, { over: .04 });
  K.rect(frame, 0, 0, PW, fH, RAIL, .45);
  K.rect(frame, W3f - PW, 0, W3f, fH, RAIL, .45);
  K.rect(frame, PW, fH - .1, W3f - PW, fH, RAIL, .45);
  for (const u of [PW / 2, W3f - PW / 2]) K.rect(frame, u - .035, vc - .035, u + .035, vc + .035, PIN, 0, .0012);
  // Schild: dreht sich um die waagerechte Achse durch die Zapfen
  const tFull = sicht(c03 + W3f / 2).in, dFl = .045;
  const tFl = Math.max(tUe + .01, Math.min(tFull + .01, (T3t.D > 0 ? T3t.bA : 1) - dFl - .004));
  const flip = F.spin(r3, [c03, ZH - vc * sl], PI, tFl, dFl, { axis: [1, 0, 0], y: vc * cl, over: .03 });
  const sx0 = c03 - W3 / 2;
  const sign = K.panel(flip, [sx0, ZH], [sx0 + W3, ZH], [0, -1], tU3, .05, UP, { over: .04 });
  K.rect(sign, 0, SV, W3, SV + H3, PAPER, .5);
  // Vorderseite: zwei leere Felder
  const eF = N ? .13 : .14, rows = [["Konditionen", SV + H3 * .66], ["Freie Kapazität", SV + H3 * .3]];
  for (const [name, v] of rows) {
    const pr = K.print([name], eF, tUe, { font: "kicker", col: MUTED, text: name });
    K.onPanel(sign, pr, MX + pr.w / 2 - pr.t.padX * eF, v + .1, 1, [0, -1]);
    F.line(sign, sign.uv(MX, v - .06), sign.uv(W3 - MX, v - .06), .45, INK, .0012);
  }
  // Rückseite: der Satz (steht nach der Drehung aufrecht)
  T3.on = tFl + dFl * .8;
  K.onPanel(sign, T3, MX + T3.w / 2 - T3.t.padX * K.EC, SV + H3 / 2 + .02, -1, [0, 1]);
  F.geruest({ tags: ["schild"], t0: t3in - .01, t1: tU3, du: .03, a: .5, bAt: Math.min(tUe + .002, T3t.bA) });

  // ---------- Zweite Schiene der Agentur dahinter: wenige große Karten, ruhig (ohne Raumgerüst, nur Bleistiftspur) ----------
  const ZR = -3.0, HR = N ? 2.5 : 2.7, back = [];
  {
    let x = xHs - .2;
    while (x < RAILEND - 1.6) {
      const w = Math.min(RAILEND - x, (N ? 2.0 : 2.3) + rnd() * (N ? .8 : 1.0));
      if (w < 1.4) break;
      const t = tin(x), tag = "hinten" + x.toFixed(2);
      F.part(tag, t + .005, .03); back.push(tag);
      K.slab(R, x - AG / 2, x + w + AG / 2, ZR + .34, ZR + .14, LIPH, t + .02, .035, { col: RAIL, top: RAIL, walls: "f" });
      const nd = K.panel(R, [x, ZR], [x + w, ZR], [0, -1], t + .04, .045, UP, { over: .04 });
      K.rect(nd, 0, 0, w, HR, CARD, .4);
      wire(nd, w, HR, 0);
      x += w + AG * 1.5;
    }
  }
  F.geruest({ tags: back, t0: 0, t1: .01, filter: () => false });

  // ---------- Faden: liegt in der Laufnut der Schiene ----------
  const faden = [[xHs - 1.4, .004, ZG], [RAILEND + 3, .004, ZG]];

  return {
    strecke: [XS, XE], lineZ: LZ,
    faden,
    stops: [
      { name: "y0", prints: [kp.h] },
      { name: "y1", prints: [T1] },
      { name: "y2", prints: [T2] },
      { name: "y3", prints: [T3] }
    ]
  };
}
