// Kamera-Stützstellen Szene „agenturen“ (Szenenzeit u: 0 = Szenenanfang, 1 = Szenenende, negativ = Anlauf im Flug davor).
// Die Kamera fährt eine vorab festgelegte, stetige Bahn: Ort (c) und Blickziel (t) laufen als glatte Kurve durch diese Stützstellen,
// beide RELATIV ZUM PUNKT (rote Spitze des Fadens) in der Blickrichtung der Szene: [rechts, hoch, zurück] bzw. [rechts, hoch, voraus] in Welteinheiten.
// Der Punkt führt immer: bleibt eine Stellung stehen (mehrere gleiche Werte), schwimmt die Kamera mit dem Punkt mit, sie hält nie an.
// l = 1 markiert eine Lesestelle (Text steht ganz im Bild). Eine Zahl ändern = Kamera an dieser Stelle anders stellen, kein Codeumbau.
// d = Breitbild (1440 x 900), n = hochkant (390 x 844).
export default {
  d: [
    { u: -0.4, c: [0, 0.85, 4.6], t: [0, 0.25, 9] },
    { u: 0.1296, c: [4.24, 1.45, 14.4], t: [4.24, -1.02, 2.08], l: 1 },
    { u: 0.1509, c: [4.24, 1.38, 14.14], t: [4.24, -1.02, 1.86], l: 1 },
    { u: 0.2851, c: [-0.68, 5.11, 9.6], t: [1.22, 2.88, 7.25], l: 1 },
    { u: 0.3243, c: [-0.91, 4.98, 8.86], t: [0.89, 2.88, 7.04], l: 1 },
    { u: 0.4506, c: [0.51, 5.11, 10.44], t: [0.51, 2.88, 6.41], l: 1 },
    { u: 0.5546, c: [-0.52, 4.98, 9.69], t: [-0.52, 2.88, 6.21], l: 1 },
    { u: 0.6913, c: [0.36, 5.11, 10.6], t: [-1.55, 2.88, 6.25], l: 1 },
    { u: 0.7377, c: [-0.21, 4.98, 9.56], t: [-2.01, 2.88, 6.34], l: 1 },
    { u: 1, c: [0, 0.85, 4.6], t: [0, 0.25, 9] }
  ],
  n: [
    { u: -0.4, c: [0, 1, 5.6], t: [0, 0.25, 11] },
    { u: 0.1571, c: [2.52, 1.62, 16.02], t: [2.52, 0.18, 1.59], l: 1, o: 1 },
    { u: 0.1753, c: [2.44, 1.58, 15.65], t: [2.44, 0.18, 1.45], l: 1, o: 1 },
    { u: 0.2096, c: [2.29, 12.48, 15.91], t: [2.29, 2.38, 6.09] },
    { u: 0.2438, c: [-0.48, 5.02, 2.17], t: [-0.48, 3.98, 8.54], l: 1, o: 1 },
    { u: 0.2774, c: [-0.66, 4.98, 2], t: [-0.66, 3.98, 8.3], l: 1, o: 1 },
    { u: 0.3496, c: [1.15, 12.48, 17.21], t: [1.15, 2.38, 4.79] },
    { u: 0.4218, c: [0.19, 5.23, 4.46], t: [0.19, 3.88, 6.88], l: 1, o: 1 },
    { u: 0.511, c: [-0.54, 5.18, 4.32], t: [-0.54, 3.88, 6.58], l: 1, o: 1 },
    { u: 0.589, c: [-1.92, 12.48, 18.38], t: [-1.92, 2.38, 3.62] },
    { u: 0.6671, c: [-0.74, 5.02, 4.45], t: [-0.74, 3.98, 6.26], l: 1, o: 1 },
    { u: 0.7069, c: [-1.09, 4.98, 4.08], t: [-1.09, 3.98, 6.22], l: 1, o: 1 },
    { u: 1, c: [0, 1, 5.6], t: [0, 0.25, 11] }
  ]
};
