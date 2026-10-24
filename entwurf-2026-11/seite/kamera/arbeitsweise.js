// Kamera-Stützstellen Szene „arbeitsweise“ (Szenenzeit u: 0 = Szenenanfang, 1 = Szenenende, negativ = Anlauf im Flug davor).
// Die Kamera fährt eine vorab festgelegte, stetige Bahn: Ort (c) und Blickziel (t) laufen als glatte Kurve durch diese Stützstellen,
// beide RELATIV ZUM PUNKT (rote Spitze des Fadens) in der Blickrichtung der Szene: [rechts, hoch, zurück] bzw. [rechts, hoch, voraus] in Welteinheiten.
// Der Punkt führt immer: bleibt eine Stellung stehen (mehrere gleiche Werte), schwimmt die Kamera mit dem Punkt mit, sie hält nie an.
// l = 1 markiert eine Lesestelle (Text steht ganz im Bild). Eine Zahl ändern = Kamera an dieser Stelle anders stellen, kein Codeumbau.
// d = Breitbild (1440 x 900), n = hochkant (390 x 844).
// ERZEUGT von werkzeug/kamera-bauen.mjs aus werkzeug/beats/arbeitsweise.mjs: die Lesestellen-Stützstellen (l = 1) entstehen aus den Beats, Handänderungen dort gehen beim nächsten Lauf verloren.
export default {
  d: [
    { u: -0.4127, c: [0, 0.85, 4.6], t: [0, 0.25, 9] },
    { u: 0.1148, c: [6.4, 8.43, 13.34], t: [6.4, 0.1, 1.08], l: 1 },
    { u: 0.1416, c: [6.4, 8.43, 13.34], t: [6.4, 0.1, 1.08], l: 1 },
    { u: 0.2646, c: [-0.35, 2.79, 7.7], t: [-0.35, 1.36, 2.48], l: 1 },
    { u: 0.3009, c: [-0.35, 2.79, 7.7], t: [-0.35, 1.36, 2.48], l: 1 },
    { u: 0.343, c: [0.46, 2.81, 7.66], t: [0.46, 1.39, 2.41], l: 1 },
    { u: 0.3937, c: [0.46, 2.81, 7.66], t: [0.46, 1.39, 2.41], l: 1 },
    { u: 0.4843, c: [-0.13, 2.81, 7.67], t: [-0.13, 1.39, 2.4], l: 1 },
    { u: 0.5181, c: [-0.13, 2.81, 7.67], t: [-0.13, 1.39, 2.4], l: 1 },
    { u: 0.6131, c: [0.02, 1.77, 5.04], t: [0.02, 0.82, 1.72], l: 1 },
    { u: 0.6566, c: [0.02, 1.77, 5.04], t: [0.02, 0.82, 1.72], l: 1 },
    { u: 0.8021, c: [-1.09, 2.06, 3.31], t: [-1.09, 0.21, 1.78], l: 1 },
    { u: 0.8564, c: [-1.09, 2.06, 3.31], t: [-1.09, 0.21, 1.78], l: 1 },
    { u: 1, c: [0, 0.85, 4.6], t: [0, 0.25, 9] }
  ],
  n: [
    { u: -0.3855, c: [0, 1, 5.6], t: [0, 0.25, 11] },
    { u: 0.1155, c: [11.2, 9.13, 15.14], t: [11.2, -0.21, 1.04], l: 1, o: 1 },
    { u: 0.1419, c: [11.2, 9.13, 15.14], t: [11.2, -0.21, 1.04], l: 1, o: 1 },
    { u: 0.2617, c: [-0.13, 2.46, 6.02], t: [-0.13, 1.27, 2.4], l: 1 },
    { u: 0.2976, c: [-0.13, 2.46, 6.02], t: [-0.13, 1.27, 2.4], l: 1 },
    { u: 0.3706, c: [-0.13, 2.47, 6.04], t: [-0.13, 1.29, 2.39], l: 1 },
    { u: 0.4206, c: [-0.13, 2.47, 6.04], t: [-0.13, 1.29, 2.39], l: 1 },
    { u: 0.4941, c: [-0.13, 2.47, 6.04], t: [-0.13, 1.29, 2.39], l: 1 },
    { u: 0.5275, c: [-0.13, 2.47, 6.04], t: [-0.13, 1.29, 2.39], l: 1 },
    { u: 0.6291, c: [-0.42, 2.3, 10.46], t: [-0.42, 0.67, 1.12], l: 1 },
    { u: 0.672, c: [-0.42, 2.3, 10.46], t: [-0.42, 0.67, 1.12], l: 1 },
    { u: 0.8078, c: [-0.95, 4.63, 10.57], t: [-0.95, 0.18, 1.67], l: 1 },
    { u: 0.8614, c: [-0.95, 4.63, 10.57], t: [-0.95, 0.18, 1.67], l: 1 },
    { u: 1, c: [0, 1, 5.6], t: [0, 0.25, 11] }
  ]
};
