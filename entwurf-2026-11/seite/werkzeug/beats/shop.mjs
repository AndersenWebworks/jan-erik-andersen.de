// Beats der Szene „shop“ (Shops und Shop-Wechsel): (1) Überschrift über dem Ganzen, (2) Regal nach Maß mit Satz 1 auf der Blende, (3) Karton mit Sätzen 2 und 3 auf dem Schild. Der Punkt läuft auf der Route aus stationen.js (Stationen dort: Wunschlagen vor dem Regal bzw. Karton).
// Maße: Szenenkoordinaten aus `node werkzeug/zeige.mjs shop d` (Regal x −4 bis −0,6, Karton x 0,6 bis 4; Überschrift hoch hinten).
const M = {
  ueberschrift: { box: [[-4.2, 0, -3.7], [4.3, 5.4, 2.4]] },
  regal: { box: [[-4.1, 0, -1.4], [-.5, 2.8, .1]] },
  karton: { box: [[.5, 0, -1.4], [4.1, 2.7, .1]] }
};
export default {
  szene: "shop",
  motive: { d: M, n: M },
  blick: { az: 0, el: 12 },
  beats: [
    { zeigt: "ueberschrift", stop: 1 },
    { zeigt: "regal", stop: 2 },
    { zeigt: "karton", stop: 3 }
  ]
};
