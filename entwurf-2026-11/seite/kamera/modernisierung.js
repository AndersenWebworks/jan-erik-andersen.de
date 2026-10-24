// Kamera-Stützstellen Szene „modernisierung“ (Szenenzeit u: 0 = Szenenanfang, 1 = Szenenende, negativ = Anlauf im Flug davor).
// Die Kamera fährt eine vorab festgelegte, stetige Bahn: Ort (c) und Blickziel (t) laufen als glatte Kurve durch diese Stützstellen,
// beide RELATIV ZUM PUNKT (rote Spitze des Fadens) in der Blickrichtung der Szene: [rechts, hoch, zurück] bzw. [rechts, hoch, voraus] in Welteinheiten.
// Der Punkt führt immer: bleibt eine Stellung stehen (mehrere gleiche Werte), schwimmt die Kamera mit dem Punkt mit, sie hält nie an.
// l = 1 markiert eine Lesestelle (Text steht ganz im Bild). Eine Zahl ändern = Kamera an dieser Stelle anders stellen, kein Codeumbau.
// d = Breitbild (1440 x 900), n = hochkant (390 x 844).
// ERZEUGT von werkzeug/kamera-bauen.mjs aus werkzeug/beats/modernisierung.mjs: die Lesestellen-Stützstellen (l = 1) entstehen aus den Beats, Handänderungen dort gehen beim nächsten Lauf verloren.
export default {
  d: [
    { u: -0.5026, c: [1.23, 4.57, 2.99], t: [0.59, -1.46, 3.48] },
    { u: -0.4184, c: [-0.95, 3.48, 2.13], t: [-4.25, 1.78, 41.87] },
    { u: -0.2679, c: [1.34, 5.48, 0.69], t: [0.74, 1.58, 33.31] },
    { u: -0.125, c: [5.22, 6.98, -1.69], t: [6.42, 1.48, 25.69] },
    { u: 0.0051, c: [7.48, 7.78, 0.36], t: [7.48, 1.38, 17.14] },
    { u: 0.12, c: [3.6, 7.95, 14.27], t: [3.6, -0.13, 3.87], l: 1 },
    { u: 0.23, c: [3.6, 7.95, 14.27], t: [3.6, -0.13, 3.87], l: 1 },
    { u: 0.3255, c: [3.15, 14.19, 8.93], t: [3.15, 0.96, 2.17], l: 1 },
    { u: 0.5484, c: [3.15, 14.19, 8.93], t: [3.15, 0.96, 2.17], l: 1 },
    { u: 0.6505, c: [3.06, 8.18, 3.9], t: [3.06, -0.02, 3.1] },
    { u: 0.7372, c: [2.26, 7.98, 4.75], t: [1.66, -0.02, 1.65] },
    { u: 0.852, c: [1.95, 8.32, 0.92], t: [1.91, 0.03, 1.44] },
    { u: 1, c: [1.94, 7.84, 1.06], t: [1.8, 0.01, 1.93] }
  ],
  n: [
    { u: -0.4529, c: [0.73, 2.8, 4.2], t: [-0.41, -0.29, 6.67] },
    { u: -0.3218, c: [-0.83, 4.98, 2.4], t: [-4.33, 0.78, 37.6] },
    { u: -0.1471, c: [3.22, 7.98, 1.51], t: [3.72, 0.48, 27.89] },
    { u: -0.0345, c: [5.99, 9.98, 4.41], t: [5.99, 0.48, 19.99] },
    { u: 0.12, c: [3.55, 16.65, 21.03], t: [3.55, -0.1, 3.8], l: 1 },
    { u: 0.23, c: [3.55, 16.65, 21.03], t: [3.55, -0.1, 3.8], l: 1 },
    { u: 0.4118, c: [0.97, 9.2, 5.33], t: [0.97, 0.08, 1.06], l: 1 },
    { u: 0.6127, c: [0.97, 9.2, 5.33], t: [0.97, 0.08, 1.06], l: 1 },
    { u: 0.7126, c: [0.16, 7.28, 1.06], t: [0.16, -0.09, 0.78] },
    { u: 0.7977, c: [-0.06, 7.26, 1.44], t: [-0.07, -0.09, 0.45] },
    { u: 0.8805, c: [0.85, 7.16, 0.75], t: [0.81, -0.08, 1.38] },
    { u: 1, c: [0.95, 6.83, 0.85], t: [0.81, -0.07, 2.04] }
  ]
};
