// Kamera-Stützstellen Szene „betreuung“ (Szenenzeit u: 0 = Szenenanfang, 1 = Szenenende, negativ = Anlauf im Flug davor).
// Die Kamera fährt eine vorab festgelegte, stetige Bahn: Ort (c) und Blickziel (t) laufen als glatte Kurve durch diese Stützstellen,
// beide RELATIV ZUM PUNKT (rote Spitze des Fadens) in der Blickrichtung der Szene: [rechts, hoch, zurück] bzw. [rechts, hoch, voraus] in Welteinheiten.
// Der Punkt führt immer: bleibt eine Stellung stehen (mehrere gleiche Werte), schwimmt die Kamera mit dem Punkt mit, sie hält nie an.
// l = 1 markiert eine Lesestelle (Text steht ganz im Bild). Eine Zahl ändern = Kamera an dieser Stelle anders stellen, kein Codeumbau.
// d = Breitbild (1440 x 900), n = hochkant (390 x 844).
// ERZEUGT von werkzeug/kamera-bauen.mjs aus werkzeug/beats/betreuung.mjs: die Lesestellen-Stützstellen (l = 1) entstehen aus den Beats, Handänderungen dort gehen beim nächsten Lauf verloren.
export default {
  d: [
    { u: -0.1282, c: [0.99, 0.83, 4.48], t: [-1.85, 0.23, 8.82] },
    { u: -0.066, c: [0.74, 0.83, 4.52], t: [-1.31, 0.23, 8.85] },
    { u: -0.0214, c: [0.52, 0.84, 4.46], t: [-1.1, 0.2, 8.43] },
    { u: 0.0524, c: [0.49, 0.9, 3.92], t: [-0.87, 0.09, 6.72] },
    { u: 0.1223, c: [1.02, 0.96, 2.43], t: [-0.07, -0.2, 5.67] },
    { u: 0.167, c: [0.73, 0.98, 2.83], t: [-0.3, -0.08, 4.67] },
    { u: 0.3204, c: [0.08, 2.26, 5.21], t: [0.08, 0.78, 1.74], l: 1 },
    { u: 0.4079, c: [0.08, 2.26, 5.21], t: [0.08, 0.78, 1.74], l: 1 },
    { u: 0.5997, c: [0.01, 2.07, 4.71], t: [0.01, 0.71, 1.71], l: 1 },
    { u: 0.6685, c: [0.01, 2.07, 4.71], t: [0.01, 0.71, 1.71], l: 1 },
    { u: 0.7592, c: [-0.79, 3.75, 5.87], t: [-1.14, -0.16, 1.1] },
    { u: 0.7864, c: [-0.46, 3.89, 5.69], t: [-0.85, -0.13, 1.29] },
    { u: 0.8408, c: [0.63, 3.87, 4.61], t: [0.05, -0.18, 2.94] },
    { u: 0.9184, c: [0.93, 3.26, 3.96], t: [0.04, -1.08, 4.82] },
    { u: 1, c: [1.23, 4.57, 2.99], t: [0.59, -1.46, 3.48] }
  ],
  n: [
    { u: -0.154, c: [1.25, 0.98, 5.45], t: [-2.39, 0.23, 10.75] },
    { u: -0.0739, c: [0.9, 0.98, 5.43], t: [-1.62, 0.22, 10.69] },
    { u: -0.0082, c: [0.51, 0.96, 4.79], t: [-1.07, 0.14, 9.37] },
    { u: 0.0616, c: [0.72, 0.93, 2.84], t: [-0.51, -0.05, 7.06] },
    { u: 0.0945, c: [1.06, 0.92, 1.54], t: [-2.19, -0.99, 5.41] },
    { u: 0.1273, c: [1.17, 0.91, 0.87], t: [-2.94, -2.07, 3.64] },
    { u: 0.1581, c: [0.85, 0.91, 1.28], t: [-1.88, -1.1, 3.9] },
    { u: 0.191, c: [0.56, 0.91, 1.57], t: [-0.37, -0.35, 4.38] },
    { u: 0.2197, c: [0.4, 0.91, 1.72], t: [0.2, -0.18, 4.35] },
    { u: 0.3134, c: [-0.09, 2.02, 4.5], t: [-0.09, 0.69, 1.76], l: 1 },
    { u: 0.406, c: [-0.09, 2.02, 4.5], t: [-0.09, 0.69, 1.76], l: 1 },
    { u: 0.5925, c: [-0.03, 2.04, 4.92], t: [-0.03, 0.56, 2], l: 1 },
    { u: 0.6652, c: [-0.03, 2.04, 4.92], t: [-0.03, 0.56, 2], l: 1 },
    { u: 0.7413, c: [-0.4, 2.87, 4.78], t: [-0.4, -0.27, 1.05] },
    { u: 0.7762, c: [-1.01, 3.02, 5.16], t: [-0.99, -0.25, 0.64] },
    { u: 0.809, c: [-0.7, 3.16, 5.24], t: [-0.79, -0.23, 0.74] },
    { u: 0.8912, c: [0.66, 3.19, 4.08], t: [0.14, -0.11, 3.74] },
    { u: 0.9446, c: [0.75, 2.94, 4.13], t: [-0.13, -0.11, 5.51] },
    { u: 0.9733, c: [0.76, 2.76, 4.24], t: [-0.31, -0.13, 6.42] },
    { u: 1, c: [0.73, 2.8, 4.2], t: [-0.41, -0.29, 6.67] }
  ]
};
