// Wortmarke der Eröffnung: die einzige Stelle mit der Namensgeometrie. Marke N4 (Erik, 21.10.2026):
// „Jan-Erik“ (Newsreader 380, Tinte) und „Andersen“ (Newsreader kursiv 340, ebenfalls Tinte), Laufweite -0,018 em, Größe .95.
// Einziges Rot ist der runde Schlusspunkt (0,17 em, Unterkante auf der Grundlinie, dicht am kursiven n). Er steht als eigener Letter mit auf.
// Die Lettern stehen auf der gestrichelten Falzlinie (#8f8a80); sie liegt im Bogen genau am Scharnier und läuft 0,06 em über Anfang und Ende hinaus.
// Der Schlusspunkt gehört nicht in prints: die Kamera mittelt die Ecken aller prints, ein dritter Druck am Ende zöge den Namen aus der Mitte.
// Schnittstelle (für einen späteren Tausch nur diese Funktion ersetzen):
//   prints  Drucke der Marke (für die Lesestellung des Namens)
//   front   z der vordersten Fußlinie (darunter setzt die Szene die Unterzeile)
//   back    z der hintersten Kante des Abdrucks (davor muss der Bogen frei sein)
// Lettern stehen aus dem Bogen auf; ihr Fuß sitzt genau auf dem Scharnier (opt.foot). Beim Aufstehen ist der Abdruck
// als zarte Schnittkante zu sehen, danach schließt er sich; geblieben ist die gestrichelte Falz an der Fußlinie.
// (Ein stehender Abdruck liegt bei 30–50° Blickhöhe fast deckungsgleich hinter den Lettern und las sich als Doppelbild.)
const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2, close: .25, closeDur: .7 };

// Podest (C): opt.par / opt.par2 sind die Deckflächen, auf deren Vorderkante die Zeilen stehen (zb / zb2 in deren Ruhelage).
// Zweizeilig steht „Jan-Erik“ auf der hinteren, höheren Stufe; k1 gleicht aus, dass sie im Startbild weiter weg steht
// (gleiche scheinbare Größe beider Zeilen). folds: Lage der Falzlinien, damit die Szene dieselbe Strichelung an der Stufenkante fortsetzt.
export function wortmarke(K, { cx = 0, zb, narrow, par, zb2, par2, k1 = 1 }) {
  const e = .95, RED = "#d40235", DOT = .085; // Punkt: Radius in em (Durchmesser 0,17 em)
  const up = { font: "marke" }, it = { font: "marke", italic: 1 };
  const w1 = K.measure(["Jan-Erik"], up).tw * e, w2 = K.measure(["Andersen"], it).tw * e;
  const sp = (K.measure(["x x"], up).tw - K.measure(["xx"], up).tw) * e;   // Wortzwischenraum wie im Satz (Leerzeichen + Laufweite)
  const dw = .01 * e, dd = 2 * DOT * e;                                     // Abstand und Breite des Schlusspunkts
  const o = { foot: 1, imprint: IMPRINT };
  const fold = (len, ee = e) => ({ x0: -.06 * ee, len: len + .12 * ee, lw: .014 * ee, dash: .045 * ee, gap: .035 * ee, col: "#8f8a80" });
  const dot = (x, z, t0, p) => K.word([""], e, x, z, t0, .7, { ...o, font: "marke", disc: DOT, col: RED, par: p });
  const folds = [];
  const fl = (x, z, p, f) => { folds.push({ x: x + f.x0, z, par: p, f }); return f; };
  let n1, n2, n3, front, tot;
  if (!narrow) {
    tot = w1 + sp + w2 + dw + dd;
    const x0 = cx - tot / 2;
    n1 = K.word(["Jan-Erik"], e, x0, zb, .15, .85, { ...up, ...o, par, fold: fl(x0, zb, par, fold(tot)) });
    n2 = K.word(["Andersen"], e, x0 + w1 + sp, zb, .38, .85, { ...it, ...o, par });
    n3 = dot(x0 + w1 + sp + w2 + dw, zb, .5, par);
    front = zb;
  } else {
    // zweizeilig: Jan-Erik oben, darunter Andersen mit dem Punkt dahinter
    const e1 = e * k1, v1 = w1 * k1, l2 = w2 + dw + dd, xa = cx + .2 - l2 / 2, x1 = cx - .2 - v1 / 2;
    const z2 = zb2 !== undefined ? zb2 : zb + 1.35, p2 = par2 || par;
    n1 = K.word(["Jan-Erik"], e1, x1, zb, .15, .85, { ...up, ...o, par, fold: fl(x1, zb, par, fold(v1, e1)) });
    n2 = K.word(["Andersen"], e, xa, z2, .38, .85, { ...it, ...o, par: p2, fold: fl(xa, z2, p2, fold(l2)) });
    n3 = dot(xa + w2 + dw, z2, .5, p2);
    front = z2; tot = Math.max(v1, l2) + .4;
  }
  // Höhe der Lettern über der Fußlinie (= Tiefe des Abdrucks hinter dem Scharnier)
  const asc = (n1.t.h - n1.t.bfb) * e;
  return { prints: [n1, n2], e, front, back: zb - asc, w: tot, folds, w1, l2: w2 + dw + dd, asc };
}
// Falzlinie der Marke auf einer beliebigen Fläche fortsetzen (Podest: Oberkante der senkrechten Vorderseite).
// nd: Fläche (K.panel), fold aus folds, u0: u der linken Linienkante auf der Fläche, v: Lage der Linienmitte; q wie bei K.onPanel
export function faltkante(K, nd, fold, u0, v, q = null) {
  const f = fold.f, wpx = 2400, hpx = 24, k = wpx / f.len;
  const fd = K.decal(wpx, hpx, (c, cw, ch) => { c.strokeStyle = f.col; c.lineWidth = f.lw * k; c.setLineDash([f.dash * k, f.gap * k]); c.beginPath(); c.moveTo(0, ch / 2); c.lineTo(cw, ch / 2); c.stroke(); }, f.len, f.len * hpx / wpx, -1);
  K.F.attach(nd, fd.mesh, nd.uv(u0 + f.len / 2, v), q || nd.n, 1, .0007);
  return fd;
}
