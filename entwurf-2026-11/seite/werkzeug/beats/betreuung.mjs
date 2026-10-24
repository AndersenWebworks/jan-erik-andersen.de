// Beats der Szene „betreuung“ (Betreuung und Absicherung): (1) Tischuhr mit Satz 1 auf der Vorderseite, (2) Kalender mit Satz 2 auf dem Fuß. Der Punkt steht vor dem jeweiligen Gerät auf dessen Stellfläche.
// Maße: Szenenkoordinaten aus `node werkzeug/zeige.mjs betreuung d` (Uhr x 2,6 bis 4,7, Kalender x 6,4 bis 8,6; Stellflächen davor).
const M = {
  uhr: { box: [[2.6, 0, -.45], [4.7, 2.35, .35]] },
  kalender: { box: [[6.4, 0, -.05], [8.6, 2.15, 1.75]] }
};
export default {
  szene: "betreuung",
  motive: { d: M, n: M },
  blick: { az: 0, el: 12 },
  faden: { stW: 100, a2: .05 },
  // Stationen auf einer Linie von links nach rechts (die Kurve kann keine scharfe Kehre an einer Station fahren); Wegpunkte hinter den Stationen wie in stationen.js
  weg: [[-1.5, 2.4, 0, 4], [12.2, 2.6, 2, 2], [11.6, -5, 2, 2]],
  beats: [
    { zeigt: "uhr", stop: 1, fest: true, punkt: [3.65, 2.4] },
    { zeigt: "kalender", stop: 2, fest: true, punkt: [7.5, 2.4] }
  ]
};
