// Kamera-Stützstellen Szene „arbeitsweise“ (Szenenzeit u: 0 = Szenenanfang, 1 = Szenenende, negativ = Anlauf im Flug davor).
// Die Kamera fährt eine vorab festgelegte, stetige Bahn: Ort (c) und Blickziel (t) laufen als glatte Kurve durch diese Stützstellen,
// beide RELATIV ZUM PUNKT (rote Spitze des Fadens) in der Blickrichtung der Szene: [rechts, hoch, zurück] bzw. [rechts, hoch, voraus] in Welteinheiten.
// Der Punkt führt immer: bleibt eine Stellung stehen (mehrere gleiche Werte), schwimmt die Kamera mit dem Punkt mit, sie hält nie an.
// l = 1 markiert eine Lesestelle (Text steht ganz im Bild). Eine Zahl ändern = Kamera an dieser Stelle anders stellen, kein Codeumbau.
// d = Breitbild (1440 x 900), n = hochkant (390 x 844).
export default {
  d: [
    { u: -0.45, c: [0, 0.85, 4.6], t: [0, 0.25, 9] },
    { u: 0.1292, c: [2.81, 1.6, 9.3], t: [2.81, 0.18, 1.32], l: 1 },
    { u: 0.156, c: [-8.9, 6.64, 3.86], t: [-2.09, -2.64, 3.33], l: 1 },
    { u: 0.2702, c: [-8.64, 6.28, 3.84], t: [-2.09, -2.64, 3.33], l: 1 },
    { u: 0.3066, c: [-4.97, 2.78, 2.08], t: [-5.37, 0.68, 5.52], l: 1 },
    { u: 0.4068, c: [-4.03, 3.72, 4.15], t: [-0.99, -1.53, 3.51], l: 1 },
    { u: 0.4575, c: [-1.49, 2.91, 3.5], t: [-1.58, -0.95, 3.7], l: 1 },
    { u: 0.4942, c: [-1.49, 2.76, 3.51], t: [-1.58, -0.95, 3.7], l: 1 },
    { u: 0.5311, c: [-1.74, 2.78, 3.4], t: [-2.14, 0.68, 4.2], l: 1 },
    { u: 0.5942, c: [-0.4, 4.67, 5.66], t: [-0.4, -0.28, 3.48], l: 1 },
    { u: 0.6377, c: [-0.4, 4.48, 5.58], t: [-0.4, -0.28, 3.48], l: 1 },
    { u: 0.7889, c: [-0.41, 4.42, 6.18], t: [-0.21, 0.7, 1.94], l: 1 },
    { u: 0.8432, c: [-0.4, 4.28, 6.02], t: [-0.21, 0.7, 1.94], l: 1 },
    { u: 1, c: [0, 0.85, 4.6], t: [0, 0.25, 9] }
  ],
  n: [
    { u: -0.45, c: [0, 1, 5.6], t: [0, 0.25, 11] },
    { u: 0.1231, c: [2.32, 1.88, 10.67], t: [1.55, 0.18, 2.2], l: 1 },
    { u: 0.1495, c: [2.29, 1.81, 10.34], t: [1.55, 0.18, 2.2], l: 1 },
    { u: 0.2846, c: [-4.94, 3.75, 4.76], t: [-5.26, 0.68, 5.21], l: 1, o: 1 },
    { u: 0.3204, c: [-4.98, 3.58, 4.41], t: [-5.28, 0.68, 4.99], l: 1, o: 1 },
    { u: 0.4192, c: [-3.09, 3.75, 5.54], t: [-3.41, 0.68, 4.42], l: 1, o: 1 },
    { u: 0.4692, c: [-1.8, 4.17, 7.26], t: [-1.18, 0.68, 3.74], l: 1, o: 1 },
    { u: 0.5053, c: [-1.78, 4.04, 7.12], t: [-1.18, 0.68, 3.74], l: 1 },
    { u: 0.5417, c: [-1.53, 3.58, 5.83], t: [-1.83, 0.68, 3.57], l: 1 },
    { u: 0.6125, c: [-0.67, 4.78, 6.88], t: [-0.67, 1.58, 3.25], l: 1 },
    { u: 0.6554, c: [-0.67, 4.66, 6.74], t: [-0.67, 1.58, 3.25], l: 1 },
    { u: 0.804, c: [-0.36, 5.2, 9.1], t: [-0.14, 2.38, 0.94], l: 1 },
    { u: 0.8575, c: [-0.35, 5.09, 8.79], t: [-0.14, 2.38, 0.94], l: 1 },
    { u: 1, c: [0, 1, 5.6], t: [0, 0.25, 11] }
  ]
};
