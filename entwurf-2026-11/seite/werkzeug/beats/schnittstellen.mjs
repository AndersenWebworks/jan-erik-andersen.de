// Beats der Szene „schnittstellen“ (Schnittstellen und eigene Werkzeuge, mit WBG Pooling): (1) Brett-Satz links, (2) bis (4) drei Hallen mit je einem Schild (ERP-Deckel, zweiter Satz, WBG-Seite).
// Maße: Szenenkoordinaten aus `node werkzeug/zeige.mjs schnittstellen d` (Hallen z 5,9 bis 7,1; Schilder auf den Vorderseiten, Brett-Schild davor bei z 6,6).
const M = {
  brett: { box: [[-5.7, -.3, 6.3], [-.3, 1.6, 6.9]] },
  halle1: { box: [[2, 0, 5.8], [6.3, 2.4, 7.2]] },
  halle2: { box: [[6.2, 0, 5.8], [10.5, 2.4, 7.2]] },
  halle3: { box: [[10.4, 0, 5.8], [14.8, 2.4, 7.2]] }
};
export default {
  szene: "schnittstellen",
  motive: { d: M, n: M },
  blick: { az: 0, el: 12 },
  beats: [
    { zeigt: "brett", stop: 1 },
    { zeigt: "halle1", stop: 2 },
    { zeigt: "halle2", stop: 3 },
    { zeigt: "halle3", stop: 4 }
  ]
};
