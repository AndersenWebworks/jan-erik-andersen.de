// Wortmarke der Eröffnung: die einzige Stelle mit der Namensgeometrie.
// Heute: Lettern „Jan-Erik“ (Newsreader 300, Tinte) und „Andersen“ (Newsreader 300 kursiv, Rot), Größe .95.
// Gestalt der Lettern bitte NICHT hier verfeinern: Wortmarke/Logo wird separat mit Erik entschieden.
// Für einen späteren Tausch nur diese Funktion ersetzen. Sie liefert, was die Szene braucht:
//   prints  Drucke der Marke (für die Lesestellung des Namens)
//   front   z der vordersten Fußlinie (darunter setzt die Szene die Unterzeile)
//   back    z der hintersten Kante des Abdrucks (davor muss der Bogen frei sein)
// Lettern stehen aus dem Bogen auf; ihr Fuß sitzt genau auf dem Scharnier (opt.foot). Beim Aufstehen ist der Abdruck
// als zarte Schnittkante zu sehen, danach schließt er sich und es bleibt ein feiner Schlitz genau an der Fußlinie.
// (Ein stehender Abdruck liegt bei 30–50° Blickhöhe fast deckungsgleich hinter den Lettern und las sich als Doppelbild.)
const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2, close: .25, closeDur: .7, slit: .42 };

export function wortmarke(K, { cx = 0, zb, narrow }) {
  const e = .95, serif = { font: "serif" }, italic = { font: "serif", italic: 1 };
  const w1 = K.measure(["Jan-Erik"], serif).tw * e, w2 = K.measure(["Andersen"], italic).tw * e;
  const o = { foot: 1, imprint: IMPRINT };
  let n1, n2, front;
  if (!narrow) {
    const gap = .36, x0 = cx - (w1 + gap + w2) / 2;
    n1 = K.word(["Jan-Erik"], e, x0, zb, .15, .85, { ...serif, ...o });
    n2 = K.word(["Andersen"], e, x0 + w1 + gap, zb, .38, .85, { ...italic, ...o, col: "#d40235" });
    front = zb;
  } else {
    n1 = K.word(["Jan-Erik"], e, cx - .2 - w1 / 2, zb, .15, .85, { ...serif, ...o });
    n2 = K.word(["Andersen"], e, cx + .2 - w2 / 2, zb + 1.35, .38, .85, { ...italic, ...o, col: "#d40235" });
    front = zb + 1.35;
  }
  // Höhe der Lettern über der Fußlinie (= Tiefe des Abdrucks hinter dem Scharnier)
  const asc = (n1.t.h - n1.t.bfb) * e;
  return { prints: [n1, n2], e, front, back: zb - asc, w: narrow ? Math.max(w1, w2) + .4 : w1 + .36 + w2 };
}
