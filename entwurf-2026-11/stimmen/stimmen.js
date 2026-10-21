// Szene „Stimmen“ (Fassung 2026-11, Bogen + Bastellinien). Zwei Kundenstimmen, wörtlich zitiert (Quelle: entwurf-2026-10-b-raumtext-2/index.html, #stimmen).
// Beide Konstrukte erzählen den Text, nicht ein Bild dazu (Drehbuch: DREHBUCH.md).
//
// 1. SiS, Wirkungsbericht: ein geschlossener Bericht (Leporello, fünf Seiten) steht aus dem Bogen auf und schlägt Seite für Seite auf;
//    jeder Satz steht auf seiner Seite, die Quelle auf der letzten Seite. Im Bogen bleibt der Abdruck.
// 2. ai-coustics, Klang: ein Papierband trägt den Text, über ihm steht eine Zackenreihe (Schallwelle, jede Zacke eine eigene Länge);
//    die Zacken klappen eine nach der anderen hinter das Band, die Kante wird glatt (verlässlich, ernst genommen). Danach steht aus
//    dem glatten Rand eine einzige Fahne auf (der letzte Schliff überrascht), sie trägt den Zitatschluss und den roten Punkt.
// Der Name der Szene („Stimmen“) steht wie der Name der Eröffnung aus dem Bogen auf (Uhr „t“, steht beim Laden sofort).
const INKS = "#303033", MUTED = "#66666a", RED = "#d40235";
const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2, close: .25, closeDur: .7 };

// ---------- Text, wörtlich (Raumtext 2, #stimmen) ----------
export const TEXT = {
  sis: [
    "Seniorpartner in School (SiS) ist eine bundesweit agierende Sozialorganisation.",
    "Ein gut aufgestellter digitaler Wirkungsbericht ist für unsere Arbeit wichtig.",
    "Jan-Erik und die kompetente Texterin Annemarie haben das für uns neue Format professionell und barrierefreundlich aufgesetzt.",
    "Super Teamarbeit, verlässlich und engagiert.",
    "SiS sagt DANKE!"
  ],
  sisQuelle: ["Karin,", "Seniorpartner in School", "Google-Bewertung"],
  ai: [
    "Berufsbedingt habe ich schon mit verschiedenen Mediendesignern zusammengearbeitet",
    "und freue mich mit Andersen Webworks seit nun mehreren Jahren einen zuverlässigen Partner gefunden zu haben.",
    "Professionelles Webdesign das mich immer wieder überrascht, meine Vorstellungen werden ernst genommen",
    "und bekommen von Herrn Andersen den letzten Schliff,",
    "so setzt man sich von der Konkurrenz ab!"
  ],
  aiQuelle: ["Corvin Jädicke,", "ai-coustics", "Google-Bewertung"]
};

export default function (K) {
  const { F, R, V, COL, PI, Q, THREE, narrow: N } = K;
  const DEG = PI / 180;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const rnd = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };

  // ---------- Text umbrechen (gemessen, nicht geschätzt) ----------
  function wrap(txt, maxEm, opt = {}) {
    const words = txt.split(" "), sp = K.measure(["a a"], opt).tw - K.measure(["aa"], opt).tw;
    const wd = words.map(w => K.measure([w], opt).tw), lines = [];
    let cur = "", cw = 0;
    words.forEach((w, i) => {
      if (!cur) { cur = w; cw = wd[i]; return; }
      if (cw + sp + wd[i] <= maxEm) { cur += " " + w; cw += sp + wd[i]; } else { lines.push(cur); cur = w; cw = wd[i]; }
    });
    lines.push(cur);
    return lines;
  }
  // Druckfeld auf einer Fläche: linke Kante tx und Oberkante der ersten Zeile tyTop in Textkoordinaten (rechts, oben).
  // Auf der Unterseite (side −1) läuft die Leserichtung gegen u, daher wird gespiegelt.
  function block(nd, Wn, lines, e, on, tx, tyTop, side, o = {}, q = null) {
    const pr = K.print(lines, e, on, { lh: 1.28, ...o });
    const cx = tx - pr.t.padX * e + pr.w / 2, cy = tyTop + .34 * e - pr.h / 2;
    K.onPanel(nd, pr, side > 0 ? cx : Wn - cx, cy, side, q);
    return pr;
  }

  K.sheet(-13, 34, -8.2, 8);

  // ---------- Überschrift: steht wie der Name der Eröffnung aus dem Bogen auf ----------
  const EH = 1.05, HX = -7.6, HZ = 5.2;
  const hw = K.measure(["Stimmen"], { font: "marke" }).tw * EH;
  const headFold = { x0: -.06 * EH, len: hw + .12 * EH, lw: .014 * EH, dash: .045 * EH, gap: .035 * EH, col: "#8f8a80" };
  const head = K.word(["Stimmen"], EH, HX, HZ, .15, .85, { font: "marke", foot: 1, imprint: IMPRINT, par: R, fold: headFold });

  // ---------- 1. SiS: Leporello (Wirkungsbericht) ----------
  // Fünf Seiten liegen im Bogen deckungsgleich als geschlossener Bericht (Rechteck, um −h gedreht, damit das aufgeschlagene Zickzack
  // quer zum Bild läuft). Die erste Seite steht an ihrer Fußkante auf, jede weitere schlägt an der abwechselnd rechten und linken
  // Kante um gam auf (geschlossen = 0, aufgeschlagen = gam = 180° − 2h). Seiten mit ungerader Nummer zeigen dem Betrachter ihre Unterseite.
  const LW = 3.6, LH = 1.95, MX = .25, hh = 26 * DEG, gam = PI - 2 * hh, A0 = [-7.5, 2.4];
  const d0 = [Math.cos(hh), -Math.sin(hh)], eb = [-Math.sin(hh), -Math.cos(hh)];
  const lp = (u, v) => [A0[0] + d0[0] * u + eb[0] * v, A0[1] + d0[1] * u + eb[1] * v];
  const PG = ["#fbfaf6", "#f1eee6", "#fbfaf6", "#f1eee6", "#fbfaf6"].map(c3);
  const TP = [.25, .31, .37, .43], DP = .09;                 // Beginn des Aufschlagens der Seiten 1 … 4
  F.part("bericht", .04, .10, { lift: .014 });
  const p0 = K.panel(R, lp(0, 0), lp(LW, 0), eb, .14, .10, Q, { over: .05, lv: 1 });
  K.rect(p0, 0, 0, LW, LH, PG[0], .5);
  const pg = [p0];
  const rect = [[0, 0], [LW, 0], [LW, LH], [0, LH]].map(q => p0.uv(q[0], q[1]));
  for (let k = 1; k < 5; k++) {
    const u = k % 2 ? LW : 0;
    const nd = F.hinge(pg[k - 1], p0.uv(u, 0), p0.uv(u, LH), p0.uv(LW / 2, LH / 2), gam, TP[k - 1], DP, { lv: 1 + 2 * k, over: .05, nofold: k > 2 });
    nd.uv = p0.uv; nd.n = p0.n;
    F.poly(nd, rect, PG[k], .5, 0, COL.INK, { nocut: true });
    pg.push(nd);
  }
  const sideOf = k => k % 2 ? -1 : 1;
  const E0 = .2, tw = (LW - 2 * MX) / E0 - .3;                 // Textbreite in em
  const ON = [TP[0] + .03, TP[0] + .05, TP[1] + .05, TP[2] + .05, TP[3] + .05];
  const topY = LH - .3;
  // Sätze 1 und 2 (Satz 2 trägt zusätzlich eine Wirkungsgrafik ohne Zahlen)
  const sT = [];
  sT[0] = block(pg[0], LW, wrap(TEXT.sis[0], tw), E0, ON[0], MX, topY, 1, {}, eb);
  sT[1] = block(pg[1], LW, wrap(TEXT.sis[1], tw), E0, ON[1], MX, topY, -1, {}, eb);
  sT[2] = block(pg[2], LW, wrap(TEXT.sis[2], tw), E0, ON[2], MX, topY, 1, {}, eb);
  const E3 = .26, E4 = .32;
  sT[3] = block(pg[3], LW, wrap(TEXT.sis[3], (LW - 2 * MX) / E3 - .3), E3, ON[3], MX, topY, -1, {}, eb);
  sT[4] = block(pg[4], LW, wrap(TEXT.sis[4], (LW - 2 * MX) / E4 - .3), E4, ON[4], MX, topY, 1, {}, eb);
  // Wirkungsgrafik auf Seite 2: fünf Balken, der letzte kräftig (Schmuck, keine Zahlen)
  {
    const gw = 2.3, gh = .62, PXU = 300;
    const chart = K.decal(Math.round(gw * PXU), Math.round(gh * PXU), (x, W, H) => {
      const n = 5, bw = W / (n * 1.6), gap = (W - n * bw) / (n - 1), hs = [.28, .4, .52, .68, .92];
      x.strokeStyle = "rgba(48,48,51,.5)"; x.lineWidth = 3; x.beginPath(); x.moveTo(0, H - 2); x.lineTo(W, H - 2); x.stroke();
      hs.forEach((v, i) => { x.fillStyle = i === n - 1 ? "rgba(48,48,51,.62)" : "rgba(48,48,51,.2)"; x.fillRect(i * (bw + gap), H - 2 - v * (H - 8), bw, v * (H - 8)); });
    }, gw, gh, ON[1] + .02, .03);
    K.onPanel(pg[1], chart, LW - (MX + gw / 2), .5, -1, eb);
  }
  // Quelle auf der letzten Seite, mit rotem Punkt
  const qE = .2, qTop = .88;
  const sQ = block(pg[4], LW, TEXT.sisQuelle, qE, ON[4] + .02, MX + .34, qTop, 1, { col: MUTED, fade: .03 }, eb);
  const dot1 = K.decal(64, 64, (x, W, H) => { x.fillStyle = RED; x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 2, 0, 2 * PI); x.fill(); }, .15, .15, ON[4] + .02, .03);
  K.onPanel(pg[4], dot1, MX + .08, qTop - .7 * qE + .06, 1, eb);

  // ---------- 2. ai-coustics: Zackenreihe wird glatt, Fahne steht auf ----------
  const X0 = 12.6, ZW = -2.5, CB = 1.7, BL = 3.5, BWT = .5, NT = 28, FWD = 3.6, FH = 1.55, NB = 4;
  const WTOT = NB * BL + FWD, XF = NB * BL;                    // Band: vier Textblöcke, rechts darunter Platz für die Quelle
  F.part("welle", .56, .10);
  const TB = [.64, .10];
  const B = K.panel(R, [X0, ZW], [X0 + WTOT, ZW], [0, -1], TB[0], TB[1], Q, { over: .04, lv: 1 });
  K.P(B, [[0, 0], [WTOT, 0], [WTOT, CB], [0, CB]], c3("#f7f4ec"), [.5, .5, 0, .5]);
  const TOOTH = c3("#dcd5c6"), TF0 = .74, TF1 = .83, TFD = .05;
  const teeth = [];
  for (let i = 0; i < NT; i++) {
    const u0 = i * BWT, ht = i % 2 ? .35 + .45 * rnd(i, 1) : .85 + .6 * rnd(i, 1);   // abwechselnd kurz und lang: gezackt
    const t = K.panel(B, B.uv(u0, CB), B.uv(u0 + BWT, CB), [0, -1], TF0 + (TF1 - TF0) * i / (NT - 1), TFD, -(PI - .3), { over: .035 });
    K.P(t, [[0, 0], [BWT, 0], [BWT / 2, ht]], TOOTH, [.5, .5, .5]);
    teeth.push({ nd: t, ht });
  }
  const FR = [.91, .08];
  const flag = K.panel(B, B.uv(XF, CB), B.uv(XF + FWD, CB), [0, -1], FR[0], FR[1], 0, { ang0: -(PI - .25), over: .06 });
  K.P(flag, [[0, 0], [FWD, 0], [FWD, FH], [0, FH]], c3("#fbfaf7"), [.5, .5, .5, .5]);
  // Text auf dem Band: vier Blöcke, jeder ein Satzteil im Wortlaut; erscheint der Reihe nach
  const BON = [.70, .74, .78, .82], ET = .2, btw = (BL - .4) / ET - .3;
  const bT = TEXT.ai.slice(0, 4).map((s, j) => {
    // Block 3 trägt zwei Satzteile (Komma bleibt stehen), Block 4 den Rest vor dem Schluss
    return block(B, WTOT, wrap(s, btw), ET, BON[j], j * BL + .2, CB - .3, 1, { fade: .03 });
  });
  const EF = .3;
  const fT = block(flag, FWD, wrap(TEXT.ai[4], (FWD - .5) / EF - .3), EF, FR[0] + .04, .25, FH - .38, 1, { fade: .03 });
  // Quelle unter der Fahne auf dem Band
  const aQ = block(B, WTOT, TEXT.aiQuelle, .2, FR[0] + .05, XF + .5, CB - .3, 1, { col: MUTED, fade: .03 });
  const dot2 = K.decal(64, 64, (x, W, H) => { x.fillStyle = RED; x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 2, 0, 2 * PI); x.fill(); }, .22, .22, FR[0] + .04, .03);
  K.onPanel(flag, dot2, FWD - .38, FH - .2, 1);
  const dot3 = K.decal(64, 64, (x, W, H) => { x.fillStyle = RED; x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 2, 0, 2 * PI); x.fill(); }, .15, .15, FR[0] + .05, .03);
  K.onPanel(B, dot3, XF + .3, CB - .3 - .7 * .2 + .06, 1);

  // ---------- Faden: vom Fuß der letzten Berichtsseite zum Band ----------
  const Az = [[A0[0], A0[1]]];                                // Fußpunkte des aufgeschlagenen Zickzacks
  for (let k = 0; k < 5; k++) { const p = Az[k]; Az.push([p[0] + LW * Math.cos(hh), p[1] + (k % 2 ? 1 : -1) * LW * Math.sin(hh)]); }
  const endA = Az[5];

  // ---------- Kamera ----------
  const pxBase = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const pxD = (W, H, s) => pxBase(W, H) * s.e / .2;
  const pxN = (v) => (W, H, s) => v * s.e / .2;
  const FACE = V(0, 0, -1);
  const orbit = (C, az, el, D) => ({ tgt: V(C[0], C[1], C[2]), cam: V(C[0] + D * Math.sin(az * DEG) * Math.cos(el * DEG), C[1] + D * Math.sin(el * DEG), C[2] + D * Math.cos(az * DEG) * Math.cos(el * DEG)) });
  const ov = (b, C, az, el, D, DN, elN = el, CN = C) => { const a = orbit(C, az, el, D), n = orbit(CN, az, elN, DN); return { b, cam: a.cam, tgt: a.tgt, camN: n.cam, tgtN: n.tgt }; };

  const S = {
    head: { prints: [head], e0: EH, px: (W, H) => W * .2, pxN: 400, fit: .42, fitN: .74, pitch: 14, npitch: 12, yaw: -6, nyaw: -4, sx: -.22, nsx: 0, sy: .16, nsy: .34, b: 0 }
  };
  const stopD = (arr, o = {}) => ({ face: FACE, pitch: 10, npitch: 9, px: pxD, pxN: pxN(17), yaw: -4, nyaw: -3, sx: 0, sy: -.06, nsx: 0, nsy: -.05, ...o, prints: arr });
  const keys = [{ w: 0, stop: S.head }];
  if (!N) {
    S.l1 = stopD([sT[0], sT[1], sT[2]], { b: ON[2] + .03 });
    S.l2 = stopD([sT[2], sT[3], sT[4], sQ], { b: ON[4] + .05 });
    S.w1 = stopD([bT[0], bT[1], bT[2]], { b: .81, sy: -.12 });
    S.w2 = stopD([bT[2], bT[3], fT, aQ], { b: 1, sy: -.2 });
    keys.push(
      { w: .5, ...ov(.12, [-5.2, .5, 2.0], -3, 34, 15.5, 21) },
      { w: .8, ...ov(.27, [-3.2, .9, 1.4], 0, 26, 19.5, 19.5) },
      { w: .9, stop: S.l1 }, { w: .9, stop: S.l2 },
      { w: .8, ...ov(.62, [19, .5, -1.2], 4, 30, 33, 23, 30, [14.5, .9, -1.8]) },
      { w: 1.3, stop: S.w1 }, { w: 1.2, stop: S.w2 }
    );
  } else {
    sT.forEach((p, k) => { S["l" + k] = stopD([p].concat(k === 4 ? [sQ] : []), { b: ON[k] + .04 }); });
    bT.forEach((p, k) => { S["w" + k] = stopD([p], { b: BON[k] + .04, pxN: pxN(16.5) }); });
    S.wf = stopD([fT, aQ], { b: 1, sy: -.3, nsy: -.12, pxN: pxN(16.5) });
    keys.push(
      { w: .5, ...ov(.12, [-5.2, .5, 2.0], -3, 34, 15.5, 21) },
      { w: .55, ...ov(.22, [-4, .9, 1.4], 0, 26, 19.5, 19.5) },
      ...[0, 1, 2, 3, 4].map(k => ({ w: .55, stop: S["l" + k] })),
      { w: .7, ...ov(.62, [19, .5, -1.2], 4, 30, 33, 23, 30, [14.5, .9, -1.8]) },
      ...[0, 1, 2, 3].map(k => ({ w: .55, stop: S["w" + k] })),
      { w: 1.0, stop: S.wf }
    );
  }
  return {
    fov: 32, fovN: 44,
    track: N ? 720 : 600,
    thread: { pts: [V(endA[0], .004, endA[1] + .05), V(endA[0] + .9, .004, endA[1] - .5), V(X0 - 1.1, .004, ZW + .9), V(X0 - .35, .004, ZW + .3)], t0: .55, t1: .61 },
    stops: Object.values(S),
    keys,
    parts: { pg, p0, B, flag, teeth, head, bT, fT, aQ, sT, sQ, hh, gam, lp, LW, LH, X0, ZW, CB, WTOT, XF, FWD, FH, d0, eb }
  };
}
