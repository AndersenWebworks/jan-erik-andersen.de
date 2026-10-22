// Für Agenturen (Szene 13, Drehbuch Abschnitt 16): Einsteckschiene eines laufenden Projekts. Das Ding ist die Schiene selbst, und meine Teile
// sind die eingesteckten Teile, die die Sätze tragen (Prinzip „Die Szene ist der Träger“):
//  Y0 Kopfstück der Schiene: Kopf „Für Agenturen“ auf dem Endstück, an dem die Schiene beginnt.
//  Y1 Die Schiene ist mit den Karten der Agentur besetzt (Entwürfe des laufenden Projekts), an einer Stelle klafft die Lücke. Meine Karte trägt
//     Y1, läuft in der Zuführung vor der Schiene zur Lücke (Mitfahrt, auch am Desktop) und schiebt sich passgenau hinein.
//  Y2 Vier vorhandene Bausteine stehen in der Schiene, beschriftet „Theme“, „Plugins“, „Abläufe“, „Werkzeuge“. Mein Aufsatz trägt Y2, gleitet
//     hinter ihnen entlang (er arbeitet sich ein) und rastet genau im Raster der Bausteine ein; seine Fugen setzen ihre Fugen fort.
//  Y3 Am Ende der Schiene ein Wendeschild im Rahmen: vorn die Felder „Konditionen“ und „Freie Kapazität“, leer; es dreht sich um, auf der
//     Rückseite steht Y3 (auf Anfrage, keine Zahl).
// Hinter der Leselinie stehen weitere Schienen der Agentur voller Karten (das laufende Projekt, oberes Drittel des Bildes).
// Der rote Faden liegt in der Nut der Schiene. Handy: Karte, Aufsatz und Wendeschild fahren in der Schiene mit (K.trage), Aufbau aus der Startlage.

export default function (K) {
  const { F, R, Q, THREE, narrow: N } = K;
  const PI = Math.PI;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const PAPER = c3("#faf8f3"), CARD = c3("#ece9e2"), CARD2 = c3("#e8e1d2"), RAIL = c3("#e1d9c9"), BLOCK = c3("#e8e1d2"), BLOCKF = c3("#efece5");
  const TINT = c3("#d9d3c7"), TINT2 = c3("#e2ddd2"), BAND = c3("#f1ede4"), PIN = c3("#b9b2a6"), INK = K.COL.INK;
  const lean = K.lean, UP = Q - lean, cl = Math.cos(lean), sl = Math.sin(lean);
  const MUTED = "#66666a";

  // ---------- Schiene (z der Szene) ----------
  // Karten stehen mit ihrer Unterkante bei ZH (Scharnier) und lehnen um die Neigung der Kamera zurück; davor zwei Leisten, dazwischen die Nut
  // mit dem Faden; vor der Schiene die Zuführung (Schlitz im Bogen) für die Karte, die eingesteckt wird.
  const ZH = 0, LIP1 = [.12, .24], LIP2 = [.46, .58], ZG = .35, ZL = .92, LIPH = .09;
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
  const HW = kp.w + 2 * MX, kH = kp.k ? kp.k.h : 0;
  const HHt = .4 + kp.h.h + (kp.k ? kp.gap * .35 + kH : 0) + .3;           // Kopfstück
  const W1 = T1.tw + 2 * MX + .2, Hc = Math.max(1.5, T1.th + 1.0);           // Karte Y1 (alle Karten der Schiene haben ihre Höhe)
  const AW = N ? 1.05 : 1.3, AG = .14, CLR = .05;                              // Karten der Agentur, Abstand, Spiel in der Lücke
  const hb = .42, BD = .4, k2 = N ? 2 : 3, bw = Math.max(1.5, (T2.tw + 2 * MX) / k2), P2W = k2 * bw;   // Bausteine, Aufsatz
  const vb = (hb + .15) / cl, H2 = vb + .32 + T2.th + .42, ZP = ZH - BD - .05;      // Aufsatz: Sockelband, Höhe, Scharnier hinter den Bausteinen
  const W3 = T3.tw + 2 * MX + .1, H3 = Math.max(1.25, T3.th + .9), V0 = .28, PW = .12, W3f = W3 + 2 * (PW + .05);   // Wendeschild, Rahmen

  // Mitfahrten (der Weg hängt nur von der Breite ab): zuerst messen, dann legen; wo eine nötig ist, mit etwas Reserve (Aufbau und Drehung
  // fallen in den Anfang der Mitfahrt)
  const need = w => K.trage(0, w, {}).D, plus = (w, x) => need(w) > 0 ? need(w) + x : 0;
  const D1 = Math.max(N ? 0 : 2.4, plus(T1.tw, .6));
  const D2n = K.trage(0, T2.tw, {}).D, nB = k2 + Math.max(1, Math.ceil(D2n / bw - 1e-6)), D2 = (nB - k2) * bw;
  const D3 = plus(T3.tw, 1.0);

  const D0 = plus(kp.w, .5);

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

  K.sheet(xHs - 1.6, RAILEND + .6, -14, ZL + Hc + .9);

  // ---------- Hilfen ----------
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  // Entwurf auf einer Karte der Agentur: Kopfleiste, Bildfeld, Textzeilen (getönte Flächen, ohne Kanten)
  function wire(nd, W, H) {
    const m = Math.min(.12, W * .1), dy = .0008, r = rnd();
    K.rect(nd, m, H - m - .09, m + (W - 2 * m) * (.35 + .25 * r), H - m, TINT, 0, dy);
    const iy0 = H * (.36 + .1 * rnd()), iy1 = H - m - .2;
    if (rnd() < .7) K.rect(nd, m, iy0, W - m, iy1, TINT2, 0, dy);
    else { const h = (W - 2 * m - .08) / 2; K.rect(nd, m, iy0, m + h, iy1, TINT2, 0, dy); K.rect(nd, m + h + .08, iy0, W - m, iy1, TINT2, 0, dy); }
    const nl = Math.max(1, Math.floor((iy0 - m - .06) / .14));
    for (let i = 0; i < nl; i++) { const y = iy0 - .12 - i * .14; if (y - .05 < m) break; K.rect(nd, m, y - .05, m + (W - 2 * m) * (.45 + .45 * rnd()), y, TINT, 0, dy); }
  }
  // Schienenstück (zwei Leisten, dazwischen die Nut) unter [xa, xb]
  function rail(xa, xb, t0) {
    for (const [z0, z1] of [LIP1, LIP2]) K.slab(R, xa, xb, z1, z0, LIPH, t0, .035, { col: RAIL, top: RAIL, walls: "f" });
  }
  // stehende Karte (Scharnier vorn, liegt nach hinten, lehnt zurück)
  function card(par, x0, w, h, z, t0, col) {
    const nd = K.panel(par, [x0, z], [x0 + w, z], [0, -1], t0, .045, UP, { over: .04 });
    K.rect(nd, 0, 0, w, h, col, .45);
    return nd;
  }
  const tin = x => Math.max(.004, sicht(x).in);

  // ---------- Kopfstück (Y0) ----------
  // Das Kopfstück ist ein Reiter auf der Schiene: am Handy wird er auf ihr bis an die Karten geschoben (Mitfahrt)
  F.part("kopf", .004, .03);
  const tK = .03;
  const T0t = K.trage(cH, kp.w, { minD: D0 });
  rail(xHs, xH1 + .3, .01);
  const head = card(T0t.node(R), T0t.c0 - HW / 2, HW, HHt, ZH, tK, CARD2);
  K.rect(head, .12, .12, HW - .12, HHt - .12, PAPER, 0, .0008);
  const onK = tK + .05;
  kp.h.on = onK; K.onPanel(head, kp.h, MX + kp.h.w / 2 - kp.h.t.padX * kp.eH, .4 + kp.h.h / 2, 1, [0, -1]);
  if (kp.k) { kp.k.on = onK; K.onPanel(head, kp.k, MX + kp.k.w / 2 - kp.k.t.padX * kp.eK, .4 + kp.h.h + kp.gap * .35 + kH / 2, 1, [0, -1]); }

  // ---------- Karten der Agentur vor und hinter der Lücke ----------
  for (const x of [xA[0], xA[1], xA3]) {
    const t = tin(x);
    F.part("ag" + x.toFixed(2), t + .005, .03);
    rail(x - AG / 2, x + AW + AG / 2, t + .02);
    wire(card(R, x, AW, Hc, ZH, t + .045, CARD), AW, Hc);
  }

  // ---------- Y1: Karte läuft in der Zuführung zur Lücke und schiebt sich hinein ----------
  const T1t = K.trage(cF1, T1.tw, { minD: D1 });
  const c01 = T1t.c0, t1in = tin(c01 - W1 / 2);
  F.part("y1", t1in + .005, .035);
  // Einlass: die Leisten sind an der Lücke offen; gestrichelte Führung von der Zuführung in die Lücke
  const tIns = Math.max(T1t.bB, t1in + .1) + .004, dIns = .03;
  F.sketch(R, [[[gL, ZL], [gL, ZH]], [[gR, ZL], [gR, ZH]], [[gL, ZH], [gR, ZH]]], tin(gL) + .01, .03, { dash: true, a: .45, fade: b => 1 - .7 * K.sm((b - tIns - dIns) / .03) });
  F.line(R, [c01 - W1 / 2 - .3, ZL + .02], [gL, ZL + .02], .4, INK, .0008);                  // Schlitz der Zuführung im Bogen
  const r1 = T1t.node(R);
  const ins = F.slide(r1, [0, 0, ZH - ZL], tIns, dIns, { over: .05 });
  const tU1 = t1in + .045;
  const y1 = K.panel(ins, [c01 - W1 / 2, ZL], [c01 + W1 / 2, ZL], [0, 1], tU1, .05, Q + lean, { over: .04 });
  K.rect(y1, 0, 0, W1, Hc, PAPER, .5);
  T1.on = tU1 + .055;
  K.onPanel(y1, T1, MX + .1 + T1.w / 2 - T1.t.padX * e1, Hc / 2 + .04, -1);
  F.geruest({ tags: ["y1"], t0: t1in - .01, t1: tU1, du: .03, a: .5, bAt: Math.min(tU1 + .06, T1t.bA) });
  // Schiene unter Lücke und Zuführung: Leisten links und rechts der Öffnung
  rail(gL - AG / 2, gL, tin(gL) + .02); rail(gR, gR + AG / 2, tin(gR) + .02);

  // ---------- Y2: Bausteine in der Schiene, Aufsatz gleitet hinter ihnen ins Raster ----------
  const NAMES = ["Theme", "Plugins", "Abläufe", "Werkzeuge"];
  const eL = N ? .13 : .135;
  for (let i = 0; i < nB; i++) {
    const x = xB0 + i * bw, t = tin(x);
    F.part("bau" + i, t + .005, .03);
    rail(x, x + bw, t + .02);
    const bx = K.box(R, x + .02, x + bw - .02, ZH - .02, ZH - .02 - BD, hb, t + .045, .05, { col: BLOCK, fcol: BLOCKF });
    if (NAMES[i]) K.onPanel(bx.fr, K.print([NAMES[i]], eL, t + .1, { font: "kicker", col: "#5f5f63", align: "center", text: NAMES[i] }), (bw - .04) / 2, hb / 2 + .01, -1);
  }
  const T2t = K.trage(cF2, T2.tw, { minD: D2 });
  const c02 = T2t.c0, t2in = tin(c02 - P2W / 2);
  F.part("aufsatz", t2in + .005, .035);
  const r2 = T2t.node(R);
  const tU2 = t2in + .045;
  const plate = K.panel(r2, [c02 - P2W / 2, ZP], [c02 + P2W / 2, ZP], [0, -1], tU2, .055, UP, { over: .04 });
  K.rect(plate, 0, 0, P2W, H2, PAPER, .5);
  K.rect(plate, 0, 0, P2W, vb, BAND, 0, .0008);
  F.line(plate, plate.uv(0, vb), plate.uv(P2W, vb), .4, INK, .0012);
  for (let j = 1; j < k2; j++) F.line(plate, plate.uv(j * bw, 0), plate.uv(j * bw, vb), .45, INK, .0012);
  T2.on = tU2 + .06;
  K.onPanel(plate, T2, MX + T2.w / 2 - T2.t.padX * e2, vb + .32 + T2.th / 2 + .02, 1, [0, -1]);
  F.geruest({ tags: ["aufsatz"], t0: t2in - .01, t1: tU2, du: .03, a: .5, bAt: Math.min(tU2 + .07, T2t.bA) });

  // ---------- Y3: Wendeschild am Ende der Schiene ----------
  const T3t = K.trage(cF3, T3.tw, { minD: D3 });
  const c03 = T3t.c0, t3in = tin(c03 - W3f / 2);
  rail(x30 - .2, RAILEND - ECW, tin(x30) + .02);
  // Endkappe: hier endet die Schiene, der Faden läuft hinaus zum Umschlag
  F.part("kappe", tin(RAILEND - ECW) + .005, .03);
  K.box(R, RAILEND - ECW, RAILEND, LIP2[1] + .04, LIP1[0] - .3, .2, tin(RAILEND - ECW) + .045, .05, { col: RAIL, fcol: RAIL });
  F.part("schild", t3in + .005, .035);
  const r3 = T3t.node(R);
  const tU3 = t3in + (N ? .03 : .045), tUe = tU3 + .05;
  // Rahmen: zwei Pfosten und ein Querholm in der Ebene des Schilds
  const fx0 = c03 - W3f / 2, vc = V0 + H3 / 2, fH = V0 + H3 + .14;
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
  K.rect(sign, 0, V0, W3, V0 + H3, PAPER, .5);
  // Vorderseite: zwei leere Felder
  const eF = N ? .13 : .14, rows = [["Konditionen", V0 + H3 * .66], ["Freie Kapazität", V0 + H3 * .3]];
  for (const [name, v] of rows) {
    const pr = K.print([name], eF, tUe, { font: "kicker", col: MUTED, text: name });
    K.onPanel(sign, pr, MX + pr.w / 2 - pr.t.padX * eF, v + .1, 1, [0, -1]);
    F.line(sign, sign.uv(MX, v - .06), sign.uv(W3 - MX, v - .06), .45, INK, .0012);
  }
  // Rückseite: der Satz (steht nach der Drehung aufrecht)
  T3.on = tFl + dFl * .8;
  K.onPanel(sign, T3, MX + T3.w / 2 - T3.t.padX * K.EC, V0 + H3 / 2 + .02, -1, [0, 1]);
  F.geruest({ tags: ["schild"], t0: t3in - .01, t1: tU3, du: .03, a: .5, bAt: Math.min(tUe + .002, T3t.bA) });

  // ---------- Hintere Schienen der Agentur: das laufende Projekt (oberes Drittel) ----------
  // Am Handy stehen sie hinter jedem Satz (gleiches x) und füllen die obere Bildhälfte über ihm.
  const ROWS = N ? [[-3.0, 2.0], [-5.45, 2.4], [-8.3, 2.8], [-11.5, 3.2]] : [[-3.0, 2.1], [-5.6, 2.5], [-8.55, 2.9], [-11.8, 3.3]];
  ROWS.forEach(([z, h], ri) => {
    let x = xH0 - .4 + ri * .35;
    while (x < RAILEND - 1.0) {
      const w = Math.min(RAILEND - x, (N ? .9 : 1.05) + rnd() * (N ? .8 : 1.0));
      if (w < .7) break;
      const t = tin(x);
      F.part("hinten" + ri + "_" + x.toFixed(2), t + .005, .03);
      K.slab(R, x - AG / 2, x + w + AG / 2, z + .34, z + .14, LIPH, t + .02, .035, { col: RAIL, top: RAIL, walls: "f" });
      wire(card(R, x, w, h * (.92 + .08 * rnd()), z, t + .045, ri % 2 ? CARD2 : CARD), w, h * .92);
      x += w + AG;
    }
  });

  // ---------- Faden: liegt in der Nut der Schiene ----------
  const faden = [[xH0 - 1.4, .004, ZG], [RAILEND + 3, .004, ZG]];

  return {
    strecke: [XS, XE], lineZ: LZ,
    faden,
    stops: [
      { name: "y0", prints: kp.k ? [kp.k, kp.h] : [kp.h] },
      { name: "y1", prints: [T1] },
      { name: "y2", prints: [T2] },
      { name: "y3", prints: [T3] }
    ]
  };
}
