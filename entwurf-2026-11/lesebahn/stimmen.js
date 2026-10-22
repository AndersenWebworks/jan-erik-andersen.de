// Szene „Stimmen“ (Fassung 2026-11, Bogen + Bastellinien). Zwei Kundenstimmen, wörtlich zitiert (Quelle: entwurf-2026-10-b-raumtext-2/index.html, #stimmen).
// Beide Konstrukte erzählen den Text, nicht ein Bild dazu (Drehbuch: DREHBUCH-LESEBAHN.md, Abschnitt Stimmen).
//
// 1. SiS, Wirkungsbericht: ein geschlossener Bericht (Leporello, fünf Seiten) steht aus dem Bogen auf und schlägt Seite für Seite auf;
//    jeder Satz steht auf seiner Seite, die Quelle auf der letzten Seite. Im Bogen bleibt der Abdruck.
// 2. ai-coustics, Klang: ein zweites Leporello mit zwei breiten Seiten, jede Seite trägt einen ganzen Zitatsatz (nichts wird zerteilt).
//    Über der ersten Seite steht eine Zackenreihe (Schallwelle, jede Zacke eine eigene Länge); die Zacken klappen eine nach der anderen
//    hinter die Seite, die Kante wird glatt (verlässlich). Danach steht aus der glatten Kante der zweiten Seite eine einzige Fahne auf
//    (der letzte Schliff überrascht); sie trägt keinen Text.
// Roter Faden (Lesebahn): Er beginnt links neben der Überschrift und läuft am Fuß (Falz) der Seiten entlang; der Punkt hält an jeder Seite
// (halt.js, wie B.thread der Bahn-Schicht). Kamera: Gier 0, Neigung 26 wie in der ganzen Lesebahn.
// Der Name der Szene („Stimmen“) steht wie der Name der Eröffnung aus dem Bogen auf (Uhr „t“, steht beim Laden sofort).
import { halt } from "./halt.js";
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
  // ai-coustics: zwei ganze Sätze, je einer auf einer Seite
  ai: [
    "Berufsbedingt habe ich schon mit verschiedenen Mediendesignern zusammengearbeitet und freue mich mit Andersen Webworks seit nun mehreren Jahren einen zuverlässigen Partner gefunden zu haben.",
    "Professionelles Webdesign das mich immer wieder überrascht, meine Vorstellungen werden ernst genommen und bekommen von Herrn Andersen den letzten Schliff, so setzt man sich von der Konkurrenz ab!"
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
  // gleichmäßig lange Zeilen: kleinste Zeilenbreite, die dieselbe Zeilenzahl ergibt (Zitate nicht mit einer kurzen Restzeile enden lassen)
  function wrapEven(txt, maxEm) {
    const n0 = wrap(txt, maxEm).length; let m = maxEm;
    while (wrap(txt, m - .4).length === n0 && m > 6) m -= .4;
    return wrap(txt, m);
  }
  // Druckfeld auf einer Fläche: linke Kante tx und Oberkante der ersten Zeile tyTop in Textkoordinaten (rechts, oben).
  // Auf der Unterseite (side −1) läuft die Leserichtung gegen u, daher wird gespiegelt.
  function block(nd, Wn, lines, e, on, tx, tyTop, side, o = {}, q = null) {
    const pr = K.print(lines, e, on, { lh: 1.28, ...o });
    const cx = tx - pr.t.padX * e + pr.w / 2, cy = tyTop + .34 * e - pr.h / 2;
    K.onPanel(nd, pr, side > 0 ? cx : Wn - cx, cy, side, q);
    return pr;
  }

  K.sheet(-13, 28, -8, 8);

  // ---------- Überschrift: steht wie der Name der Eröffnung aus dem Bogen auf ----------
  const EH = 1.05, HX = -7.6, HZ = 5.2;
  const hw = K.measure(["Stimmen"], { font: "marke" }).tw * EH;
  const headFold = { x0: -.06 * EH, len: hw + .12 * EH, lw: .014 * EH, dash: .045 * EH, gap: .035 * EH, col: "#8f8a80" };
  const head = K.word(["Stimmen"], EH, HX, HZ, .15, .85, { font: "marke", foot: 1, imprint: IMPRINT, par: R, fold: headFold, ang: Q - 26 * DEG });

  // ---------- Leporello: Seiten liegen im Bogen deckungsgleich als geschlossener Bericht (Rechteck, um −h gedreht, damit das aufgeschlagene
  // Zickzack quer zum Bild läuft). Die erste Seite steht an ihrer Fußkante auf, jede weitere schlägt an der abwechselnd rechten und linken Kante
  // um gam auf (geschlossen = 0, aufgeschlagen = gam = 180° − 2h). Seiten mit ungerader Nummer zeigen dem Betrachter ihre Unterseite.
  const hh = 26 * DEG, gam = PI - 2 * hh;
  const PG = ["#fbfaf6", "#f1eee6", "#fbfaf6", "#f1eee6", "#fbfaf6"].map(c3);
  function lepo(tag, A0, LW, LH, n, rise, TP, DP) {
    const d0 = [Math.cos(hh), -Math.sin(hh)], eb = [-Math.sin(hh), -Math.cos(hh)];
    const lp = (u, v) => [A0[0] + d0[0] * u + eb[0] * v, A0[1] + d0[1] * u + eb[1] * v];
    F.part(tag, rise[0] - .08, .08, { lift: .014 });
    const p0 = K.panel(R, lp(0, 0), lp(LW, 0), eb, rise[0], rise[1], Q, { over: .05, lv: 1 });
    K.rect(p0, 0, 0, LW, LH, PG[0], .5);
    const pg = [p0], rect = [[0, 0], [LW, 0], [LW, LH], [0, LH]].map(q => p0.uv(q[0], q[1]));
    for (let k = 1; k < n; k++) {
      const u = k % 2 ? LW : 0;
      const nd = F.hinge(pg[k - 1], p0.uv(u, 0), p0.uv(u, LH), p0.uv(LW / 2, LH / 2), gam, TP[k - 1], DP, { lv: 1 + 2 * k, over: .05, nofold: k > 2 });
      nd.uv = p0.uv; nd.n = p0.n;
      F.poly(nd, rect, PG[k % PG.length], .5, 0, COL.INK, { nocut: true });
      pg.push(nd);
    }
    // Fußpunkte des aufgeschlagenen Zickzacks (Falz auf dem Bogen): hier läuft der Faden
    const Az = [[A0[0], A0[1]]];
    for (let k = 0; k < n; k++) { const p = Az[k]; Az.push([p[0] + LW * Math.cos(hh), p[1] + (k % 2 ? 1 : -1) * LW * Math.sin(hh)]); }
    return { p0, pg, lp, d0, eb, Az, LW, LH };
  }

  // ---------- 1. SiS: Leporello (Wirkungsbericht), fünf Seiten ----------
  const LW = N ? 2.6 : 2.8, LH = 2.7, MX = .25, A0 = [-7.5, 2.4];
  // Zeiten (b): Seite 1 steht .10 … .18; Seiten 2 … 5 schlagen bei TP auf; der Text einer Seite erscheint, wenn sie halb offen ist
  const ON = [.20, .26, .34, .40, .49], TP = [ON[1] - .05, ON[2] - .05, ON[3] - .05, ON[4] - .05], DP = .09;
  const L1 = lepo("bericht", A0, LW, LH, 5, [.10, .08], TP, DP);
  const { pg, p0, eb } = L1;
  const E0 = .2, tw = (LW - 2 * MX) / E0 - .3;                 // Textbreite in em
  const topY = LH - .3;
  const sT = [];
  sT[0] = block(pg[0], LW, wrap(TEXT.sis[0], tw), E0, ON[0], MX, topY, 1, { off: .46 }, eb);
  sT[1] = block(pg[1], LW, wrap(TEXT.sis[1], tw), E0, ON[1], MX, topY, -1, { off: .46 }, eb);
  sT[2] = block(pg[2], LW, wrap(TEXT.sis[2], tw), E0, ON[2], MX, topY, 1, {}, eb);
  const E3 = .26, E4 = .32;
  sT[3] = block(pg[3], LW, wrap(TEXT.sis[3], (LW - 2 * MX) / E3 - .3), E3, ON[3], MX, topY, -1, {}, eb);
  sT[4] = block(pg[4], LW, wrap(TEXT.sis[4], (LW - 2 * MX) / E4 - .3), E4, ON[4], MX, topY, 1, {}, eb);
  // Wirkungsgrafik auf Seite 2: fünf Balken, der letzte kräftig (Schmuck, keine Zahlen)
  {
    const gw = 1.8, gh = .7, PXU = 300;
    const chart = K.decal(Math.round(gw * PXU), Math.round(gh * PXU), (x, W, H) => {
      const n = 5, bw = W / (n * 1.6), gap = (W - n * bw) / (n - 1), hs = [.28, .4, .52, .68, .92];
      x.strokeStyle = "rgba(48,48,51,.5)"; x.lineWidth = 3; x.beginPath(); x.moveTo(0, H - 2); x.lineTo(W, H - 2); x.stroke();
      hs.forEach((v, i) => { x.fillStyle = i === n - 1 ? "rgba(48,48,51,.62)" : "rgba(48,48,51,.2)"; x.fillRect(i * (bw + gap), H - 2 - v * (H - 8), bw, v * (H - 8)); });
    }, gw, gh, ON[1] + .02, .03);
    K.onPanel(pg[1], chart, LW - (MX + gw / 2), .45, -1, eb);
  }
  // Quelle auf der letzten Seite, mit rotem Punkt
  const qE = .18, qTop = 1.0;
  const sQ = block(pg[4], LW, TEXT.sisQuelle, qE, ON[4] + .02, MX, qTop, 1, { col: MUTED, fade: .03 }, eb);
  const dot1 = K.decal(64, 64, (x, W, H) => { x.fillStyle = RED; x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 2, 0, 2 * PI); x.fill(); }, .15, .15, ON[4] + .02, .03);
  K.onPanel(pg[4], dot1, MX + .09, qTop + .22, 1, eb);

  // ---------- 2. ai-coustics: zweites Leporello, jede Seite ein ganzer Zitatsatz; Zackenreihe wird glatt, Fahne steht auf ----------
  // Seiten breit genug für den ganzen Satz in vier bis fünf Zeilen; Handy schmaler (390 px Breite bei 16 px Schrift)
  const AW = N ? 4.4 : 5.6, AH = N ? 3.1 : 2.9, AX = L1.Az[5][0] + 3.0;
  const A1 = [AX, L1.Az[5][1] + .6];
  const RA = [.56, .09], TPA = [.74], ONA = [.63, .79], QA = .81;
  const L2 = lepo("bericht2", A1, AW, AH, 2, RA, TPA, .09);
  const pa = L2.pg, eb2 = L2.eb, p0a = L2.p0;
  const ET = .2, atw = (AW - 2 * MX) / ET - .3, topA = AH - .3;
  const aT = TEXT.ai.map((s, j) => block(pa[j], AW, wrapEven(s, atw), ET, ONA[j], MX, topA, j % 2 ? -1 : 1, {}, eb2));
  // Quelle unter dem zweiten Zitat
  const aQ = block(pa[1], AW, TEXT.aiQuelle, qE, QA, MX, 1.0, -1, { col: MUTED, fade: .03 }, eb2);
  // Zackenreihe über der ersten Seite (Schallwelle: abwechselnd kurz und lang); die Zacken klappen hinter die Seite
  const BWT = .5, NT = Math.floor(AW / BWT), TOOTH = c3("#dcd5c6"), TF0 = .65, TF1 = .72, TFD = .05, teeth = [];
  const tx0 = (AW - NT * BWT) / 2;
  for (let i = 0; i < NT; i++) {
    const u0 = tx0 + i * BWT, ht = i % 2 ? .3 + .4 * rnd(i, 1) : .7 + .5 * rnd(i, 1);
    const t = K.panel(pa[0], p0a.uv(u0, AH), p0a.uv(u0 + BWT, AH), eb2, TF0 + (TF1 - TF0) * i / (NT - 1), TFD, -(PI - .3), { over: .035 });
    K.P(t, [[0, 0], [BWT, 0], [BWT / 2, ht]], TOOTH, [.5, .5, .5]);
    teeth.push({ nd: t, ht });
  }
  // eine einzige Fahne steht aus der glatten Kante der zweiten Seite auf: der letzte Schliff (Bild, kein Text)
  const FWD = 1.6, FHT = 1.0, FR = [.87, .08];
  const flag = K.panel(pa[1], p0a.uv((AW - FWD) / 2, AH), p0a.uv((AW + FWD) / 2, AH), eb2, FR[0], FR[1], 0, { ang0: -(PI - .25), over: .06 });
  K.P(flag, [[0, 0], [FWD, 0], [FWD / 2, FHT]], c3("#fbfaf7"), [.5, .5, .5]);

  // ---------- Konstruktionsphase: Gerüst der aufgeschlagenen Leporellos (ohne Zacken und Fahne), Bleistiftspur ----------
  F.geruest({ tags: ["bericht"], t0: .05, t1: .10, du: .03, a: .5 });
  F.geruest({ tags: ["bericht2"], t0: .51, t1: .56, du: .03, a: .5, filter: nd => !teeth.some(t => t.nd === nd) && nd !== flag });
  F.spur({ tags: ["bericht", "bericht2"], quiet: [...pg, ...pa, flag], filter: nd => !teeth.some(t => t.nd === nd), a: .3 });

  // ---------- Roter Faden: von der Überschrift am Fuß (Falz) der Seiten entlang, Punkt hält an jeder Seite ----------
  const Y = .004, az = L1.Az, az2 = L2.Az;
  const mid = (A, k) => V((A[k][0] + A[k + 1][0]) / 2, Y, (A[k][1] + A[k + 1][1]) / 2);
  const tx = HX - .45;
  const pts = [V(tx, Y, HZ), V(tx, Y, HZ - 1.4), V(az[0][0] - .35, Y, az[0][1] + .45), ...az.map(p => V(p[0], Y, p[1])), V(az[5][0] + 1.0, Y, az[5][1] - .3),
    V(az2[0][0] - .9, Y, az2[0][1] + .3), V(az2[0][0], Y, az2[0][1]), V(az2[1][0], Y, az2[1][1]), mid(az2, 1)];
  // Halte (b) je Seite; Desktop: drei Seiten je Lesestelle, Handy: zwei Seiten je Lesestelle
  const bp = N ? [.26, .32, .38, .44, .57] : [.34, .36, .38, .52, .57];
  const holds = [{ at: pts[0], b: 0 }, ...bp.map((b, k) => ({ at: mid(az, k), b, hold: N ? .02 : .012 })), { at: mid(az2, 0), b: .68, hold: .03 }, { at: mid(az2, 1), b: .90, hold: .03 }];
  const thread = halt(THREE, pts, holds, { hold: .04, depart: .04, bEnd: .98 });

  // ---------- Kamera ----------
  const pxBase = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const pxD = (W, H, s) => pxBase(W, H) * s.e / .2;
  // breitere Handys (ab 390 px) bekommen größere Schrift, damit der sichtbare Ausschnitt in Textbreiten gleich bleibt (Nachbarn bleiben draußen)
  const pxN = (v) => (W, H, s) => v * Math.max(1, W / 390) * s.e / .2;
  const FACE = V(0, 0, -1), PITCH = 26;
  const pxL = (W, H, s) => Math.min(21, pxBase(W, H) + 1.2) * s.e / .2, LSY = -.1;
  const orbit = (C, azd, el, D) => ({ tgt: V(C[0], C[1], C[2]), cam: V(C[0] + D * Math.sin(azd * DEG) * Math.cos(el * DEG), C[1] + D * Math.sin(el * DEG), C[2] + D * Math.cos(azd * DEG) * Math.cos(el * DEG)) });
  const ov = (b, C, azd, el, D, DN, elN = el, CN = C) => { const a = orbit(C, azd, el, D), n = orbit(CN, azd, elN, DN); return { b, cam: a.cam, tgt: a.tgt, camN: n.cam, tgtN: n.tgt }; };
  const dots = ks => ks.map(k => mid(az, k));

  const S = {
    head: { prints: [head], e0: EH, px: (W, H) => W * .2, pxN: 400, fit: .42, fitN: .74, pitch: PITCH, npitch: PITCH, yaw: 0, nyaw: 0, sx: -.22, nsx: 0, sy: .16, nsy: .34, b: 0, keep: [pts[0]] }
  };
  const stopD = (arr, o = {}) => ({ face: FACE, pitch: PITCH, npitch: PITCH, px: pxD, pxN: pxN(17), yaw: 0, nyaw: 0, sx: 0, sy: -.1, nsx: 0, nsy: -.1, ...o, prints: arr });
  const keys = [{ w: 0, stop: S.head }];
  if (!N) {
    S.l1 = stopD([sT[0], sT[1], sT[2]], { b: .36, px: pxL, sy: LSY, keep: dots([0, 1, 2]) });
    S.l2 = stopD([sT[2], sT[3], sT[4], sQ], { b: .57, px: pxL, sy: LSY, sx: .14, keep: dots([3, 4]) });
    S.a1 = stopD([aT[0]], { b: .68, sy: -.12, keep: [mid(az2, 0)] });
    S.a2 = stopD([aT[1], aQ], { b: .90, sy: -.12, sx: -.1, keep: [mid(az2, 1)] });
    keys.push(
      { w: 1.1, stop: S.l1 }, { w: 2.1, stop: S.l2 },
      { w: .6, ...ov(.60, [az2[0][0] - 2, .5, -.5], 0, 26, 24, 22, 26, [az2[0][0] - 2, .9, -1.2]) },
      { w: 1.3, stop: S.a1 }, { w: 1.5, stop: S.a2 }
    );
  } else {
    // Handy: eine Seite je Lesestelle (Punkt und Text der Seite im Bild; der Text der Nachbarseite ist angeschnitten und blendet der Kern aus)
    const hb = [.26, .32, .38, .44, .57];
    [0, 1, 2, 3, 4].forEach(k => { S["l" + k] = stopD([sT[k]].concat(k === 4 ? [sQ] : []), { b: hb[k], pxN: pxN(k >= 3 ? 14 : 18), keep: dots([k]) }); });
    S.a1 = stopD([aT[0]], { b: .68, pxN: pxN(16), nsy: -.12, keep: [mid(az2, 0)] });
    S.a2 = stopD([aT[1], aQ], { b: .90, pxN: pxN(16), nsy: -.12, nsx: -.2, keep: [mid(az2, 1)] });
    keys.push(
      ...[0, 1, 2, 3, 4].map(k => ({ w: k === 4 ? .95 : .6, stop: S["l" + k] })),
      { w: .7, ...ov(.60, [az2[0][0] - 2, .5, -.5], 0, 26, 24, 22, 26, [az2[0][0] - 2, .9, -1.2]) },
      { w: 1.0, stop: S.a1 }, { w: 1.2, stop: S.a2 }
    );
  }
  Object.entries(S).forEach(([k, v]) => { v.name = k; });
  const xo = az2[2][0] + 1.0;
  return {
    fov: 32, fovN: 44,
    track: 600,
    // Raster (seite/): mit den Bastellinien des Berichts, weg bevor er aufschlägt
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .1 },
    thread,
    // Ein- und Ausgang des Fadens für folge.js: von vorn links neben die Überschrift, nach dem letzten Fahnenfuß zur Hinterkante des Bogens
    fadenIO: { in: [tx, 7.8], viaPost: [[az2[2][0], az2[2][1]], [xo - .4, az2[2][1] - 1.5]], out: [xo, -7.8] },
    stops: Object.values(S),
    keys,
    parts: { pg, p0, pa, teeth, head, aT, aQ, sT, sQ, hh, gam, LW, LH, AW, AH, flag }
  };
}
