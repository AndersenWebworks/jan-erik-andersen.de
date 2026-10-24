// Beats der Szene „arbeitsweise“ (Wie ich arbeite): Titel, drei Arbeitsplätze mit Roboterarm (je ein Satz auf dem Schild davor), Prüfrahmen, Ende des Fließbands mit dem letzten Schild.
// Lesestellen der Szene: 1 Titel, 2 bis 4 Arbeitsplätze, 5 Prüfrahmen, 6 Bandende.
// Der Faden kommt von vorn rechts, biegt weit links (Station des Titels) in einem Halbkreis ein und läuft dann in gleichmäßigem Abstand vor Arbeitsplätzen, Prüfrahmen und Band entlang (Biegeradius mindestens 2,85, deshalb steht die Titelstation weit links).
const platz = x => ({ box: [[x - 1.1, 0, -4.1], [x + 1.1, 3.5, .8]] });
const M = {
  titel: { box: [[-2.9, 0, 3.8], [2.9, .3, 6.2]] },
  platz1: platz(-8.2), platz2: platz(-6.2), platz3: platz(-4.2),
  rahmen: { box: [[-3.1, 0, -3.9], [.1, 2.2, .6]] },
  bandende: { box: [[4.2, 0, -1.8], [8.4, 1.2, -.4]] }
};
export default {
  szene: "arbeitsweise",
  motive: M,
  blick: { az: 0, el: 8 },
  faden: { lane: false, stW: 60, rMin: 2.85, a2: .05 },
  // Titel hochkant ohne Punkt im Bild: der Punkt steht für die Titelkurve weit links, der Titel soll groß bleiben
  beats: [
    { zeigt: "titel", stop: 1, punkt: [-11.2, 6.2], blick: { el: 30 }, ohnePunkt: { n: true } },
    { zeigt: "platz1", stop: 2, fest: true, punkt: [-8.2, 1.3] },
    { zeigt: "platz2", stop: 3, fest: true, punkt: [-6.2, 1.3] },
    { zeigt: "platz3", stop: 4, fest: true, punkt: [-4.2, 1.3] },
    { zeigt: "rahmen", stop: 5, fest: true, punkt: [-1.5, 1.05] },
    { zeigt: "bandende", stop: 6, fest: true, punkt: [7.2, .55], blick: { el: 20 } }
  ]
};
