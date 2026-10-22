// Trägerform „Lieferschein-Bon“ für die Lesebahn (Baukasten: bahn.js, LESEBAHN-BAUKASTEN.md, Abschnitt 3). Gerwing: eine Bestellung wandert vom Kunden zum Händler.
// Aufbau je Satz (Bogen, flach): Fußlasche vor der Grundlinie z (Abrisslinie aus Lochungen an der Unterkante, zwei Lochungen für den roten Faden),
//   dahinter die tragende Fläche nd (ohne eigene Farbe, angeschlagen an der Hinterkante der Lasche) mit dem Papiermaul (kleine Tasche, vorn) und zwei Stützen.
//   Der Bon selbst ist ein schmaler Papierstreifen: Oberkante als Abrisskante (Zacken, jede anders hoch), Seiten leicht gewellt, eine Perforation über dem Maul.
//   Er liegt im Faltplan zurückgezogen hinter dem Maul (sein unteres Ende reicht unter die Grundlinie, also im Stehen unter den Bogen) und läuft,
//   sobald der Träger steht, ein Stück aus dem Maul heraus (F.slide, keine Überschwinger). Erst danach erscheint der Satz.
// Nach der Formen-Schnittstelle: { name, maxEm(narrow), build(c) } → { pr, w, h, nd, anchor, anchors, quiet, side, tags }.
// Zeiten (b): t.line Schnittlinien, t.rise Träger steht (bis +.045), Bon läuft aus dem Maul (+.05 … +.10), t.text ≥ t.rise + .105.
const PI = Math.PI;
const ink = a => `rgba(48,48,51,${a})`;
const rnd = (i, k) => { const s = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };

export const bon = {
  name: "bon",
  maxEm: narrow => narrow ? 17 : 20,
  FD: .46,        // Tiefe der Fußlasche (fest, damit der Faden bei allen Trägern auf einer Geraden läuft)
  HP: .56,        // Höhe des Papiermauls
  build(c) {
    const { K, x, z, lines, e, tw, th, i, t, lean, tag } = c, { Q, R } = K;
    const FD = bon.FD, Hp = bon.HP;
    const mxs = 1.25 * e, sideP = .3;                                 // Rand des Streifens seitlich, Überstand des Mauls
    const Ws = tw + 2 * mxs, Wp = Ws + 2 * sideP;                     // Breite Streifen / Maul
    const vPerf = Hp + .5 * e, vText0 = vPerf + .9 * e;                // Perforation und Unterkante des Textes (vom Boden der Stehfläche gemessen)
    const Hb = vText0 + th + .95 * e;                                  // Höhe der geraden Streifenfläche, darüber die Zacken
    const col = [.957, .937, .886], colP = [.925, .905, .856], colF = [.949, .93, .88];
    // ---- Fußlasche (flach) ----
    const foot = K.panel(R, [x, z + FD], [x + Wp, z + FD], [0, -1], t.line + .02, .02, 0, { nofold: true, over: 0 });
    K.rect(foot, 0, 0, Wp, FD, colF, .42);
    // Abrisslinie an der Unterkante: Lochungen in einer Reihe und eine zarte Vollinie darunter
    const fw = Math.max(256, Math.round(Wp * 220)), fh = 14;
    K.onPanel(foot, K.decal(fw, fh, (x2, w, h) => {
      x2.strokeStyle = ink(.4); x2.lineWidth = 2.4; x2.lineCap = "round"; x2.beginPath(); x2.moveTo(2, h - 3); x2.lineTo(w - 2, h - 3); x2.stroke();
      x2.fillStyle = "#faf8f3"; x2.strokeStyle = ink(.5); x2.lineWidth = 1.6;
      for (let X = 14; X < w - 8; X += 16) { x2.beginPath(); x2.ellipse(X, 5, 3.2, 3.2, 0, 0, 2 * PI); x2.fill(); x2.stroke(); }
    }, Wp, Wp * fh / fw, t.line + .03), Wp / 2, .03, 1);
    // zwei Lochungen für den Faden (Verstärkungsring)
    const od = .3, u1 = sideP + mxs + 1.5 * e, u2 = Wp - sideP - mxs - 1.5 * e;
    const hole = (x2, w, h) => {
      const r = w / 2; x2.translate(r, r);
      x2.fillStyle = "#ebe4d4"; x2.strokeStyle = ink(.5); x2.lineWidth = r * .09; x2.beginPath(); x2.arc(0, 0, r * .94, 0, 2 * PI); x2.fill(); x2.stroke();
      x2.fillStyle = ink(.3); x2.beginPath(); x2.arc(0, 0, r * .5, 0, 2 * PI); x2.fill();
      x2.strokeStyle = ink(.55); x2.lineWidth = r * .08; x2.stroke();
      x2.strokeStyle = ink(.28); x2.lineWidth = r * .06; x2.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * PI + .3; x2.moveTo(Math.cos(a) * r * .62, Math.sin(a) * r * .62); x2.lineTo(Math.cos(a) * r * .86, Math.sin(a) * r * .86); } x2.stroke();
    };
    for (const u of [u1, u2]) K.onPanel(foot, K.decal(256, 256, hole, od, od, t.rise), u, FD / 2, 1);
    // ---- tragende Fläche (steht um die Neigung der Kamera zurückgelehnt; ohne eigene Farbe, trägt Maul, Stützen und den Streifen) ----
    const nd = K.panel(foot, foot.uv(0, FD), foot.uv(Wp, FD), [0, -1], t.rise, .045, Q - lean, { over: .04 });
    // Maul: kleine Tasche vorn (liegt über dem Streifen), oben ein Schatten als Schlitz
    const pk = K.panel(nd, nd.uv(0, 0), nd.uv(Wp, 0), [0, -1], t.rise, .045, 0, { nofold: true, nocut: true, over: 0, lv: nd.lvl + 2 });
    K.P(pk, [[0, 0], [Wp, 0], [Wp, Hp], [Wp * .5, Hp - .03], [0, Hp]], colP, .4);
    K.onPanel(pk, K.decal(Math.max(256, Math.round(Wp * 200)), 20, (x2, w, h) => {
      for (let Y = 0; Y < h; Y++) { x2.fillStyle = ink(.55 * Math.pow(1 - Y / h, 2.2)); x2.fillRect(0, Y, w, 1); }       // Schatten im Schlitz, nach unten ausklingend
    }, Wp - .08, (Wp - .08) * 20 / Math.max(256, Math.round(Wp * 200)), t.rise + .03), Wp / 2, Hp - .06, 1);
    const nr = K.print(["Nr. " + (i + 1)], .15, t.rise + .03, { col: "#66666a", track: .05 });
    K.onPanel(pk, nr, .16 + nr.w / 2 - nr.t.padX * nr.e, Hp * .42, 1);
    // Stützen: Dreiecke an den Seiten des Mauls, klappen senkrecht nach hinten
    const ws = .4, ug = ws * Math.sin(lean), vg = ws * Math.cos(lean), uT = Hp, tw0 = t.rise + .03;
    const wl = K.panel(nd, nd.uv(0, 0), nd.uv(0, uT), [-1, 0], tw0, .035, -Q, { over: .07 });
    K.P(wl, [[0, 0], [uT, 0], [ug, vg]], colP, .3);
    const wr = K.panel(nd, nd.uv(Wp, 0), nd.uv(Wp, uT), [1, 0], tw0 + .004, .035, -Q, { over: .07 });
    K.P(wr, [[0, 0], [uT, 0], [ug, vg]], colP, .3);
    // ---- Streifen: läuft aus dem Maul ----
    const top = .17, D = Hb + top - Hp + .06;                         // Weg des Auslaufs (Streifen liegt zu Beginn ganz hinter dem Maul)
    const sl = F_slide(K, nd, D, t.rise + .045, .05);
    const st = K.panel(sl, nd.uv(sideP, -D), nd.uv(sideP + Ws, -D), [0, -1], t.rise, .045, 0, { nofold: true, nocut: true, over: 0 });
    // Seiten leicht gewellt (von Hand gerissen): Bänder von unten nach oben
    const A = .028, lam = .75 + .3 * rnd(i, 1), pL = rnd(i, 2) * 6.28, pR = rnd(i, 3) * 6.28;
    const xL = v => A * Math.sin(v / lam * 2 * PI + pL), xR = v => Ws + A * Math.sin(v / lam * 2 * PI + pR);
    const nb = Math.max(4, Math.ceil(Hb / .3)), eW = .38, vs = Array.from({ length: nb + 1 }, (_, k) => Hb * k / nb);
    // ein Umriss, Fächer von der Mitte der Unterkante aus (die Wellen sind klein, der Fächer bleibt gültig); die Unterkante liegt hinter dem Maul, keine Kante dort
    const pts = [[Ws / 2, 0], ...vs.map(v => [xR(v), v]), ...vs.slice().reverse().map(v => [xL(v), v])], ew = pts.map((_, k) => k === 0 || k === nb + 1 || k === pts.length - 1 ? 0 : eW);
    K.P(st, pts, col, ew);
    // Abrisskante oben: Zacken, jede anders hoch
    const xa = xL(Hb), xb = xR(Hb), nt = Math.max(8, Math.round((xb - xa) / .17)), dx = (xb - xa) / nt;
    for (let k = 0; k < nt; k++) {
      const h = top * (.55 + .45 * rnd(i * 31 + k, 4)), p0 = xa + k * dx, p1 = p0 + dx;
      K.P(st, [[p0, Hb], [p1, Hb], [(p0 + p1) / 2 + (rnd(i * 31 + k, 5) - .5) * dx * .3, Hb + h]], col, [0, .4, .4]);
    }
    // Perforation über dem Maul: Lochreihe mit Kerben an den Rändern
    const pw = Math.max(256, Math.round(Ws * 220)), ph = 16;
    K.onPanel(st, K.decal(pw, ph, (x2, w, h) => {
      x2.fillStyle = "#faf8f3"; x2.strokeStyle = ink(.45); x2.lineWidth = 1.6;
      for (let X = 20; X < w - 14; X += 14) { x2.beginPath(); x2.ellipse(X, h / 2, 2.6, 2.6, 0, 0, 2 * PI); x2.fill(); x2.stroke(); }
      for (const X of [0, w]) { x2.beginPath(); x2.arc(X, h / 2, 6, 0, 2 * PI); x2.fill(); x2.stroke(); }
    }, Ws, Ws * ph / pw, t.text - .03), Ws / 2, vPerf, 1);
    // Bleistiftspur nur an Fußlasche und Stützen (Streifen und Maul tragen Zacken, Wellen und Text); Gerüst ebenso (it.gerFilter, bahn.js)
    const own = nd => nd !== st && nd !== pk;
    K.F.spur({ tags: [tag], filter: own, a: .3 });
    // Satz
    const pr = K.print(lines, e, t.text, { lh: c.lh });
    K.onPanel(st, pr, mxs - pr.t.padX * e + pr.w / 2, vText0 + th + .34 * e - pr.h / 2, 1);
    const zA = z + FD / 2;
    return { w: Wp, h: Hb + top, pr, nd, foot, anchor: [x + u1, .004, zA], anchors: [[x + u1, .004, zA], [x + u2, .004, zA]], quiet: [st, pk], gerFilter: own, side: vg, tags: [tag] };
  }
};

// Schiebeknoten im Rahmen der tragenden Fläche (nd): verschiebt den Streifen um D in Richtung der Fläche (v wächst nach −z)
function F_slide(K, nd, D, t0, d) {
  return K.F.slide(nd, [0, 0, -D], t0, d, { over: 0 });
}
