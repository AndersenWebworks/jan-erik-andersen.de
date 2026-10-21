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

export function wortmarke(K, { cx = 0, zb, narrow }) {
  const e = .95, RED = "#d40235", DOT = .085; // Punkt: Radius in em (Durchmesser 0,17 em)
  const up = { font: "marke" }, it = { font: "marke", italic: 1 };
  const w1 = K.measure(["Jan-Erik"], up).tw * e, w2 = K.measure(["Andersen"], it).tw * e;
  const sp = (K.measure(["x x"], up).tw - K.measure(["xx"], up).tw) * e;   // Wortzwischenraum wie im Satz (Leerzeichen + Laufweite)
  const dw = .01 * e, dd = 2 * DOT * e;                                     // Abstand und Breite des Schlusspunkts
  const o = { foot: 1, imprint: IMPRINT };
  const fold = (len) => ({ x0: -.06 * e, len: len + .12 * e, lw: .014 * e, dash: .045 * e, gap: .035 * e, col: "#8f8a80" });
  const dot = (x, z, t0) => K.word([""], e, x, z, t0, .7, { ...o, font: "marke", disc: DOT, col: RED });
  let n1, n2, n3, front, tot;
  if (!narrow) {
    tot = w1 + sp + w2 + dw + dd;
    const x0 = cx - tot / 2;
    n1 = K.word(["Jan-Erik"], e, x0, zb, .15, .85, { ...up, ...o, fold: fold(tot) });
    n2 = K.word(["Andersen"], e, x0 + w1 + sp, zb, .38, .85, { ...it, ...o });
    n3 = dot(x0 + w1 + sp + w2 + dw, zb, .5);
    front = zb;
  } else {
    // zweizeilig: Jan-Erik oben, darunter Andersen mit dem Punkt dahinter
    const l2 = w2 + dw + dd, xa = cx + .2 - l2 / 2;
    n1 = K.word(["Jan-Erik"], e, cx - .2 - w1 / 2, zb, .15, .85, { ...up, ...o, fold: fold(w1) });
    n2 = K.word(["Andersen"], e, xa, zb + 1.35, .38, .85, { ...it, ...o, fold: fold(l2) });
    n3 = dot(xa + w2 + dw, zb + 1.35, .5);
    front = zb + 1.35; tot = Math.max(w1, l2) + .4;
  }
  // Höhe der Lettern über der Fußlinie (= Tiefe des Abdrucks hinter dem Scharnier)
  const asc = (n1.t.h - n1.t.bfb) * e;
  return { prints: [n1, n2], e, front, back: zb - asc, w: tot };
}
