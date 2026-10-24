// Kamera-Stützstellen Szene „ausserdem“ (Szenenzeit u: 0 = Szenenanfang, 1 = Szenenende, negativ = Anlauf im Flug davor).
// Die Kamera fährt eine vorab festgelegte, stetige Bahn: Ort (c) und Blickziel (t) laufen als glatte Kurve durch diese Stützstellen,
// beide RELATIV ZUM PUNKT (rote Spitze des Fadens) in der Blickrichtung der Szene: [rechts, hoch, zurück] bzw. [rechts, hoch, voraus] in Welteinheiten.
// Der Punkt führt immer: bleibt eine Stellung stehen (mehrere gleiche Werte), schwimmt die Kamera mit dem Punkt mit, sie hält nie an.
// l = 1 markiert eine Lesestelle (Text steht ganz im Bild). Eine Zahl ändern = Kamera an dieser Stelle anders stellen, kein Codeumbau.
// d = Breitbild (1440 x 900), n = hochkant (390 x 844).
// ERZEUGT von werkzeug/kamera-bauen.mjs aus werkzeug/beats/ausserdem.mjs: die Lesestellen-Stützstellen (l = 1) entstehen aus den Beats, Handänderungen dort gehen beim nächsten Lauf verloren.
export default {
  d: [
    { u: -0.1135, c: [1.05, 0.83, 4.48], t: [-2.06, 0.23, 8.76] },
    { u: -0.08, c: [1.03, 0.83, 4.47], t: [-1.91, 0.23, 8.74] },
    { u: -0.0454, c: [0.93, 0.85, 4.48], t: [-1.01, 0.24, 8.01] },
    { u: -0.013, c: [1.08, 0.88, 4.27], t: [0.18, 0.26, 6.42] },
    { u: 0.0043, c: [1.63, 0.9, 3.82], t: [0.88, 0.28, 5.61] },
    { u: 0.0238, c: [2.36, 0.92, 3.48], t: [0.66, 0.29, 4.65] },
    { u: 0.0432, c: [2.34, 0.93, 3.8], t: [0.81, 0.3, 3.75] },
    { u: 0.1526, c: [0.92, 3.34, 10.02], t: [0.92, 0.37, -0.3], l: 1 },
    { u: 0.2112, c: [0.92, 3.34, 10.02], t: [0.92, 0.37, -0.3], l: 1 },
    { u: 0.3451, c: [0.01, 2.37, 7.79], t: [0.01, -0.02, 0.03], l: 1 },
    { u: 0.4093, c: [0.01, 2.37, 7.79], t: [0.01, -0.02, 0.03], l: 1 },
    { u: 0.5329, c: [0.1, 3.7, 9.6], t: [0.1, 0.61, 0.52], l: 1 },
    { u: 0.6294, c: [0.1, 3.7, 9.6], t: [0.1, 0.61, 0.52], l: 1 },
    { u: 0.7557, c: [0.04, 2.83, 8.2], t: [0.04, 0.21, 0.36], l: 1 },
    { u: 0.8118, c: [0.04, 2.83, 8.2], t: [0.04, 0.21, 0.36], l: 1 },
    { u: 0.893, c: [1.02, 1.12, 4.9], t: [0.27, 0.5, 5.42] },
    { u: 0.9276, c: [0.83, 0.93, 4.63], t: [-0.53, 0.32, 7.8] },
    { u: 0.9589, c: [0.6, 0.84, 4.57], t: [-1.02, 0.24, 8.8] },
    { u: 1, c: [0.56, 0.83, 4.52], t: [-1.1, 0.23, 8.98] }
  ],
  n: [
    { u: -0.1, c: [1.28, 0.98, 5.45], t: [-2.5, 0.23, 10.72] },
    { u: -0.0614, c: [1.11, 0.99, 5.48], t: [-2.02, 0.24, 10.7] },
    { u: -0.0352, c: [0.88, 1.04, 5.54], t: [-1.31, 0.3, 9.97] },
    { u: 0.0023, c: [0.85, 1.24, 5.53], t: [-0.32, 0.5, 7.34] },
    { u: 0.0295, c: [1.73, 1.42, 5.19], t: [0.2, 0.7, 4.96] },
    { u: 0.0557, c: [2.42, 1.55, 5.48], t: [0.28, 0.83, 2.79] },
    { u: 0.1673, c: [-0.1, 3.28, 11.71], t: [-0.1, -0.2, -0.35], l: 1 },
    { u: 0.229, c: [-0.1, 3.28, 11.71], t: [-0.1, -0.2, -0.35], l: 1 },
    { u: 0.345, c: [0.06, 2.89, 11.22], t: [0.06, -0.51, -0.09], l: 1 },
    { u: 0.4125, c: [0.06, 2.89, 11.22], t: [0.06, -0.51, -0.09], l: 1 },
    { u: 0.5319, c: [0.05, 3.42, 10.79], t: [0.05, 0, 0.39], l: 1 },
    { u: 0.6333, c: [0.05, 3.42, 10.79], t: [0.05, 0, 0.39], l: 1 },
    { u: 0.7533, c: [0.05, 3.07, 10.88], t: [0.05, -0.33, 0.23], l: 1 },
    { u: 0.8124, c: [0.05, 3.07, 10.88], t: [0.05, -0.33, 0.23], l: 1 },
    { u: 0.8943, c: [-0.02, 1.53, 6.53], t: [-0.47, 0.8, 3.33] },
    { u: 0.9341, c: [0.75, 1.22, 5.71], t: [-0.58, 0.48, 7.84] },
    { u: 0.9705, c: [0.71, 1.03, 5.58], t: [-1.17, 0.28, 10.27] },
    { u: 1, c: [0.68, 0.98, 5.53], t: [-1.33, 0.23, 10.92] }
  ]
};
