// Außerdem (Szene 9): Setzkasten mit Winkelhaken und Setzschiff (Prinzip „Die Szene ist der Träger“).
// Das Ding: ein aufrechter Setzkasten (Fächer für Onkologie Laatzen, Mindblossom · Soundhealing, Seniorpartner in School, Bäckerei Behrens, jedes mit
// einem zarten Papierzeichen) und darunter auf einer Schiene das Setzschiff mit dem Winkelhaken. Der Satz A1 wird gesetzt, während die Kamera am Kasten
// entlangfährt: Das Setzschiff fährt auf seiner Schiene mit der Kamera mit (K.trage, auch am Desktop), trägt den Satzanfang und die Bindewörter schon
// gesetzt und lässt Lücken; die Namen liegen als Papierklötzchen in den Fächern und springen, wenn das Fach über dem Schiff steht, in ihre Lücke.
// Am Ende rastet das Schiff am Anschlag der Ablage ein: der fertige Satz steht in fünf gesetzten Zeilen, der Kamera zugewandt.
// Fach, Zeichen und Klötzchen sind Papierteile; der Satz ist an die Klötzchen und das Schiff gedruckt, nichts steht daneben.
//
// Aufbau (Brettebene, alles in der Lesetiefe): Platte A (Fach 1 und 2, trägt das Schiff), Platte F3, Platte F4, Platte Ablage; sie klappen nacheinander
// aus dem Bogen auf, wenn sie ins Bild kommen. Klötzchen und Schiff liegen als Papierflächen mit Abstand über den Platten (dy), sie verschieben sich
// in der Brettebene (F.slide); die Flugbahn rechnet die Mitfahrt des Schiffs mit, damit die Klötzchen auch nach der Landung auf ihrem Platz bleiben.

const ink = a => `rgba(48,48,51,${a})`;
const rr = (x, X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };

// Zeichen für die Fächer (zart, Tinte): 0 Praxis, 1 Klangschale, 2 Bericht (Buch), 3 Brot
function icon(x, kind, cx, cy, s, lw) {
  const a = s / 2;
  x.save(); x.strokeStyle = ink(.62); x.lineWidth = lw; x.lineCap = "round"; x.lineJoin = "round";
  x.beginPath();
  if (kind === 0) {
    x.moveTo(cx - a, cy + a * .9); x.lineTo(cx - a, cy - a * .1); x.lineTo(cx, cy - a * .95); x.lineTo(cx + a, cy - a * .1); x.lineTo(cx + a, cy + a * .9); x.closePath(); x.stroke();
    x.beginPath(); x.moveTo(cx, cy + a * .05); x.lineTo(cx, cy + a * .65); x.moveTo(cx - a * .3, cy + a * .35); x.lineTo(cx + a * .3, cy + a * .35); x.stroke();
  } else if (kind === 1) {
    x.moveTo(cx - a * .9, cy + a * .05); x.lineTo(cx + a * .9, cy + a * .05); x.arc(cx, cy + a * .05, a * .9, 0, Math.PI); x.closePath(); x.stroke();
    for (const k of [.42, .78]) { x.beginPath(); x.arc(cx, cy - a * .15, a * k, Math.PI * 1.22, Math.PI * 1.78); x.stroke(); }
    x.beginPath(); x.moveTo(cx - a * .35, cy + a * .98); x.lineTo(cx + a * .35, cy + a * .98); x.stroke();
  } else if (kind === 2) {
    x.moveTo(cx, cy - a * .55); x.lineTo(cx - a, cy - a * .8); x.lineTo(cx - a, cy + a * .75); x.lineTo(cx, cy + a * .95); x.lineTo(cx + a, cy + a * .75); x.lineTo(cx + a, cy - a * .8); x.closePath(); x.stroke();
    x.beginPath(); x.moveTo(cx, cy - a * .55); x.lineTo(cx, cy + a * .95); x.stroke();
    x.lineWidth = lw * .7;
    for (const k of [-.25, .1, .45]) { x.beginPath(); x.moveTo(cx - a * .8, cy + a * k); x.lineTo(cx - a * .22, cy + a * (k + .08)); x.moveTo(cx + a * .22, cy + a * (k + .08)); x.lineTo(cx + a * .8, cy + a * k); x.stroke(); }
  } else {
    x.ellipse(cx, cy + a * .1, a, a * .62, 0, 0, Math.PI * 2); x.stroke();
    x.lineWidth = lw * .8;
    for (const k of [-.45, 0, .45]) { x.beginPath(); x.moveTo(cx + a * (k - .12), cy - a * .3); x.lineTo(cx + a * (k + .12), cy + a * .05); x.stroke(); }
  }
  x.restore();
}

export default function (K, opt) {
  const { F, R, V, Q, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const BOARD = c3("#ebe7dc"), TRAYC = c3("#f4f0e7"), TILEC = c3("#fbf9f4");
  const UP = Q - K.lean;                                   // Flächen mit Text stehen der Kamera zugewandt
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const LZ = 0, FZ = .9;                                   // Lesetiefe (Brettebene) und Linie des Fadens davor
  const ZH = LZ + K.YL / Math.tan(UP);                     // Scharnierlinie: die aufgeklappte Brettebene liegt genau in der Lesetiefe
  const zOf = v => ZH - v;
  const polyR = (nd, u0, v0, u1, v1, col, ew, dy) => F.poly(nd, [[u0, zOf(v0)], [u1, zOf(v0)], [u1, zOf(v1)], [u0, zOf(v1)]], col, ew, dy);
  const put = (nd, pr, u, v, lift) => F.attach(nd, pr.mesh, [u, zOf(v)], [0, -1], 1, lift);

  // ---------- Satz und Klötzchen ----------
  const e = N ? K.EC : K.EC * 1.12, tp = .075, gapT = .09;
  const tH = 1.36 * e, step = tH + .075;
  const wOf = t => K.measure([t], { font: "lese" }).tw * e + 2 * tp;
  // Zeilen des Setzschiffs: s = schon gesetzt, n = Name aus dem Fach f (Klötzchen k von unten im Fach)
  const ROWS = [
    [{ s: 1, t: "Außerdem habe ich für" }],
    [{ t: "*Onkologie Laatzen*,", f: 0, k: 0 }],
    [{ t: "*Mindblossom und Soundhealing Hamburg*", f: 1, k: 0 }],
    [{ s: 1, t: "sowie für" }, { t: "*Seniorpartner in School*", f: 2, k: 0 }],
    [{ s: 1, t: "und die" }, { t: "*Bäckerei Behrens*", f: 3, k: 0 }, { s: 1, t: "gearbeitet." }]
  ];
  const TEXT = "Außerdem habe ich für *Onkologie Laatzen*, *Mindblossom und Soundhealing Hamburg* sowie für *Seniorpartner in School* und die *Bäckerei Behrens* gearbeitet.";
  for (const row of ROWS) for (const it of row) it.w = wOf(it.t);
  // Handy: reicht die letzte Zeile nicht, steht „gearbeitet.“ allein in einer sechsten Zeile
  if (N) { const l = ROWS[4]; if (l.reduce((s, it, k) => s + it.w + (k ? gapT : 0), 0) > 3.9) ROWS.push([ROWS[4].pop()]); }
  const rowW = ROWS.map(r => r.reduce((s, it, k) => s + it.w + (k ? gapT : 0), 0));
  const mL = .32, mR = .24, wText = Math.max(...rowW), wT = wText + mL + mR;
  const NAMES = ROWS.flat().filter(it => !it.s);

  // ---------- Maße der Brettebene (u entlang x ab Brettanfang, v nach oben) ----------
  const fw = N ? 2.2 : 2.5;                                  // Grundbreite eines Fachs; ein Fach mit langem Namen ist breiter
  const fws = [0, 1, 2, 3].map(f => Math.max(fw, NAMES.find(n => n.f === f).w + .24));
  const fx = [0]; fws.forEach((w, i) => fx.push(fx[i] + w));
  const railH = .18, hdr = .34, Ht = hdr + ROWS.length * step + .14, trayV0 = railH, trayTop = trayV0 + Ht;
  const ledge0 = trayTop + .04, ledge1 = trayTop + .2, fy0 = trayTop + .32, fieldH = N ? 2.4 : 2.0, fy1 = fy0 + fieldH, Hb = fy1 + .12;

  // ---------- Fahrplan: Starts der Klötzchen (x der Bildmitte), Landungen, Mitfahrt des Schiffs ----------
  const tcX = i => fx[i] + fws[i] / 2;                          // Mitte von Fach i
  const AH = N ? [.7, .4, .5, .7] : [.5, 1.2, 1.45, 1.95];   // wie weit rechts von der Bildmitte das Fach beim Absprung steht
  const DH = N ? [1.05, 1.15, 1.25, 1.35] : [1.1, 1.3, 1.5, 1.6];
  const LX = NAMES.map((n, i) => tcX(n.f) - AH[i]);
  const XL = Math.max(...LX.map((x, i) => x + DH[i]));
  const rA = K.halfW * .5, endCarry = XL + (N ? 4.4 : 2.7);
  const cF = endCarry - rA / 2, c0w = wT / 2 + .12, Dw = cF - c0w;
  const xs = -K.halfW, xe = endCarry;
  K.strecke(xs, xe);
  const sicht = K.sicht;
  const T = K.trage(cF, wText, { minD: Dw, force: true });
  const trayL = T.c0 - wT / 2;                               // linke Kante des Schiffs in der Startlage
  const Wtot = cF + wT / 2 + .15;                            // Brettbreite bis hinter den Anschlag
  const bS = x => K.bAt(x), per = 1 / (xe - xs);             // b je Welteinheit
  const dT = b => T.D > 0 ? T.D * T.ease(clamp((b - T.bA) / (T.bB - T.bA), 0, 1)) : 0;   // Weg des Schiffs seit der Startlage

  // ---------- Bogen ----------
  K.sheet(-3, xe + K.halfW + 1, LZ - 12, LZ + 3);

  // ---------- Platten ----------
  const SL = [
    { tag: "fach12", x0: 0, x1: fx[2], fields: [0, 1] },
    { tag: "fach3", x0: fx[2], x1: fx[3], fields: [2] },
    { tag: "fach4", x0: fx[3], x1: fx[4], fields: [3] },
    { tag: "ablage", x0: fx[4], x1: Wtot, fields: [] }
  ];
  const LAB = [["Onkologie", "Laatzen"], ["Mindblossom ·", "Soundhealing"], ["Seniorpartner", "in School"], ["Bäckerei", "Behrens"]];
  const sc = N ? 190 : 150, pad = .07;
  const iconS = N ? .42 : .46, lw = .012 * sc;
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  function drawSlice(x, W, H, sl) {
    const w = sl.x1 - sl.x0, Y = v => (Hb - v) * sc, X = u => u * sc;
    x.lineCap = "round"; x.lineJoin = "round";
    // Schiene unten
    x.fillStyle = ink(.08); x.fillRect(0, Y(railH), W, railH * sc);
    x.strokeStyle = ink(.34); x.lineWidth = lw; x.beginPath(); x.moveTo(0, Y(railH)); x.lineTo(W, Y(railH)); x.stroke();
    x.strokeStyle = ink(.14); x.lineWidth = lw * .7; x.beginPath(); x.moveTo(0, Y(railH * .45)); x.lineTo(W, Y(railH * .45)); x.stroke();
    // Schubladen unter dem Schiff
    const nc = Math.max(1, Math.round(w / fw)), cw = w / nc, dh = (Ht - .24) / 2;
    for (let c = 0; c < nc; c++) for (let j = 0; j < 2; j++) {
      const u0 = c * cw + .08, v0 = trayV0 + .08 + j * (dh + .08);
      rr(x, X(u0), Y(v0 + dh), X(cw - .16), dh * sc, .04 * sc); x.fillStyle = ink(.03); x.fill(); x.strokeStyle = ink(.2); x.lineWidth = lw * .8; x.stroke();
      x.strokeStyle = ink(.3); x.lineWidth = lw * 1.5; x.beginPath(); x.moveTo(X(u0 + cw / 2 - .22), Y(v0 + dh * .38)); x.lineTo(X(u0 + cw / 2 + .22), Y(v0 + dh * .38)); x.stroke();
      rr(x, X(u0 + cw / 2 - .26), Y(v0 + dh * .86), X(.52), .13 * sc, .02 * sc); x.strokeStyle = ink(.22); x.lineWidth = lw * .7; x.stroke();
    }
    // Ablagebord
    x.fillStyle = ink(.08); x.fillRect(0, Y(ledge1), W, (ledge1 - ledge0) * sc);
    x.strokeStyle = ink(.34); x.lineWidth = lw; x.beginPath(); x.moveTo(0, Y(ledge1)); x.lineTo(W, Y(ledge1)); x.moveTo(0, Y(ledge0)); x.lineTo(W, Y(ledge0)); x.stroke();
    // Fächer
    for (const fi of sl.fields) {
      const u0 = fx[fi] - sl.x0 + .07, u1 = fx[fi + 1] - sl.x0 - .07;
      rr(x, X(u0), Y(fy1), X(u1 - u0), fieldH * sc, .03 * sc); x.fillStyle = ink(.055); x.fill(); x.strokeStyle = ink(.36); x.lineWidth = lw; x.stroke();
      x.strokeStyle = ink(.1); x.lineWidth = lw * .8; x.beginPath(); x.moveTo(X(u0 + .05), Y(fy1 - .05)); x.lineTo(X(u1 - .05), Y(fy1 - .05)); x.stroke();
      x.strokeStyle = ink(.16); x.beginPath(); x.moveTo(X(u0 + .1), Y(fy1 - .68)); x.lineTo(X(u1 - .1), Y(fy1 - .68)); x.stroke();
      icon(x, fi, X(u0 + .1 + iconS / 2), Y(fy1 - .36), iconS * sc, lw * 1.1);
      // Vorrat an Blindlettern zwischen Kopfzeile und Klötzchen
      const nT = 1, vb0 = fy0 + .14 + nT * step + .08, vb1 = fy1 - .8;
      const bw = .1, bh = .15;
      for (let r = 0; vb0 + r * (bh + .05) + bh < vb1; r++) for (let q = 0; u0 + .14 + q * (bw + .035) + bw < u1 - .12; q++) {
        const jit = rnd() > .12; if (!jit) continue;
        x.fillStyle = ink(.07 + rnd() * .05); x.fillRect(X(u0 + .14 + q * (bw + .035)), Y(vb0 + r * (bh + .05) + bh), bw * sc, bh * sc);
        x.strokeStyle = ink(.16); x.lineWidth = lw * .5; x.strokeRect(X(u0 + .14 + q * (bw + .035)), Y(vb0 + r * (bh + .05) + bh), bw * sc, bh * sc);
      }
    }
    if (!sl.fields.length) {
      // Ablage: Schubladenfronten statt Fächern, Anschlag für das Schiff
      const nc2 = Math.max(1, Math.round(w / fw)), cw2 = w / nc2, dh2 = (fieldH - .08) / 2;
      for (let c = 0; c < nc2; c++) for (let j = 0; j < 2; j++) {
        const u0 = c * cw2 + .07, v0 = fy0 + j * (dh2 + .08);
        rr(x, X(u0), Y(v0 + dh2), X(cw2 - .14), dh2 * sc, .04 * sc); x.fillStyle = ink(.03); x.fill(); x.strokeStyle = ink(.2); x.lineWidth = lw * .8; x.stroke();
        x.strokeStyle = ink(.3); x.lineWidth = lw * 1.5; x.beginPath(); x.moveTo(X(u0 + cw2 / 2 - .22), Y(v0 + dh2 * .4)); x.lineTo(X(u0 + cw2 / 2 + .22), Y(v0 + dh2 * .4)); x.stroke();
      }
      x.fillStyle = ink(.28); x.fillRect(X(w - .13), Y(trayTop), .1 * sc, Ht * sc);
      x.strokeStyle = ink(.4); x.lineWidth = lw; x.strokeRect(X(w - .13), Y(trayTop), .1 * sc, Ht * sc);
    }
  }

  // Etiketten: Namen der Fächer, klein auf dem Fach
  const eLab = N ? .13 : .14;
  let stand = {};
  for (const sl of SL) {
    const tin = sicht(sl.x0).in, w = sl.x1 - sl.x0;
    const t0 = Math.max(.03, tin + .012), d = .07;
    F.part(sl.tag, Math.max(.005, tin), .035);
    const pn = K.panel(R, [sl.x0, ZH], [sl.x1, ZH], [0, -1], t0, d, UP, { over: .04 });
    K.rect(pn, 0, 0, w, Hb, BOARD, .5);
    sl.nd = pn; sl.on = t0 + d * .8;
    K.onPanel(pn, K.decal(Math.round(w * sc), Math.round(Hb * sc), (x, W, H) => drawSlice(x, W, H, sl), w, Hb, sl.on), w / 2, Hb / 2, 1, null, .003);
    for (const fi of sl.fields) {
      const u0 = fx[fi] - sl.x0 + .07, avail = fws[fi] - .14 - .1 - iconS - .12;
      let ee = eLab; const m = K.measure(LAB[fi], { font: "kicker", lh: 1.3, track: .08 }); if (m.tw * ee > avail) ee = avail / m.tw;
      const lp = K.print(LAB[fi], ee, sl.on, { font: "kicker", col: "#5f5f63", lh: 1.3, track: .08, align: "left", text: LAB[fi].join(" ") });
      K.onPanel(pn, lp, u0 + .1 + iconS + .12 + lp.w / 2 - lp.t.padX * ee, fy1 - .36, 1, null, .006);
    }
  }
  const A = SL[0], onA = A.on;

  // ---------- Setzschiff auf der Schiene: Winkelhaken, Rand, Lücken; fährt mit der Kamera mit ----------
  F.part("setzschiff", 0, .001);
  const CAR = T.node(A.nd, A.nd.lvl + 1);
  const lineV = i => trayTop - hdr - (i + .5) * step;
  // Plätze der Zeilen in der Startlage (u global, v)
  let at = 0;
  for (let i = 0; i < ROWS.length; i++) {
    let u = trayL + mL;
    for (const it of ROWS[i]) { it.u = u + it.w / 2; it.v = lineV(i); u += it.w + gapT; at++; }
  }
  polyR(CAR, trayL, trayV0, trayL + wT, trayTop, TRAYC, .5, .01);
  const trD = K.decal(Math.round(wT * sc), Math.round(Ht * sc), (x, W, H) => {
    const Y = v => (Ht - v) * sc, X = u => u * sc;
    x.lineCap = "round"; x.lineJoin = "round";
    // Rand: Winkel links und unten (Winkelhaken), dünn oben und rechts
    x.fillStyle = "rgba(120,105,80,.2)";
    x.fillRect(0, 0, .15 * sc, H); x.fillRect(0, H - .1 * sc, W, .1 * sc); x.fillRect(W - .06 * sc, 0, .06 * sc, H); x.fillRect(0, 0, W, .06 * sc);
    x.strokeStyle = ink(.34); x.lineWidth = lw * .9; x.strokeRect(.15 * sc, .06 * sc, W - .21 * sc, H - .16 * sc);
    // Lücken für die Namen
    x.setLineDash([.07 * sc, .05 * sc]); x.strokeStyle = ink(.42); x.lineWidth = lw * .9;
    for (const it of NAMES) rr(x, X(it.u - it.w / 2 - trayL), Y(it.v + tH / 2), it.w * sc, tH * sc, .03 * sc), x.stroke();
    x.setLineDash([]);
    // Maßstrich oben (Zeilenmaß)
    x.strokeStyle = ink(.2); x.lineWidth = lw * .7;
    for (let k = 0; k * .25 < wT - .5; k++) { x.beginPath(); x.moveTo(X(.5 + k * .25), Y(Ht - .06)); x.lineTo(X(.5 + k * .25), Y(Ht - (k % 4 ? .11 : .15))); x.stroke(); }
  }, wT, Ht, onA);
  put(CAR, trD, trayL + wT / 2, trayV0 + Ht / 2, .014);
  const sLab = K.print(["Setzschiff"], N ? .13 : .14, onA, { font: "kicker", col: "#5f5f63", track: .08, align: "left", text: "Setzschiff" });
  put(CAR, sLab, trayL + .3 + sLab.w / 2 - sLab.t.padX * (N ? .13 : .14), trayTop - .17, .02);

  // Bleisatz der Bindewörter (schon gesetzt)
  const prints = [];
  const tileOn = (par, it, on) => {
    const pr = K.satz(it.t, { lines: [it.t], e, on });
    polyR(par, it.u - it.w / 2, it.v - tH / 2, it.u + it.w / 2, it.v + tH / 2, TILEC, .45, .03);
    put(par, pr, it.u, it.v + .11 * e, .036);
    return pr;
  };
  for (const it of ROWS.flat()) if (it.s) it.pr = tileOn(CAR, it, onA + .01);

  // ---------- Klötzchen in den Fächern, Sprung ins Schiff ----------
  const slOf = f => f < 2 ? SL[0] : f === 2 ? SL[1] : SL[2];
  NAMES.forEach((n, i) => {
    const sl = slOf(n.f), tb = bS(LX[i]), dhb = DH[i] * per, dTot = Math.max(.02, 1 - tb);
    const su = tcX(n.f), sv = fy0 + .14 + tH / 2 + n.k * step;
    const slotU0 = n.u, slotV = n.v, bump = N ? .38 : .5;
    const hOf = b => clamp((b - tb) / dhb, 0, 1);
    const duAt = b => K.mech(hOf(b), .012) * (slotU0 - su + dT(b));
    const dzAt = b => { const h = hOf(b); return -(K.mech(h, .012) * (slotV - sv) + bump * Math.sin(Math.PI * h)); };
    const nx = F.slide(sl.nd, [1, 0, 0], tb, dTot, { ease: x => duAt(tb + x * dTot), lv: sl.nd.lvl + 1 });
    const nz = F.slide(nx, [0, 0, 1], tb, dTot, { ease: x => dzAt(tb + x * dTot), lv: nx.lvl });
    const t = { u: su, v: sv, w: n.w, t: n.t };
    n.pr = tileOn(nz, t, tb);
  });

  // ---------- Faden: gerade vor dem Brett entlang ----------
  const faden = [[xs, .004, FZ], [(xs + xe) / 2, .004, FZ], [xe + 4, .004, FZ]];

  // Lesereihenfolge: Zeilen von oben, links nach rechts
  const order = ROWS.flat().map(it => it.pr);
  return {
    strecke: [xs, xe], lineZ: LZ,
    faden,
    stops: [{ name: "a1", prints: order, text: TEXT }],
    anchor: xs
  };
}
