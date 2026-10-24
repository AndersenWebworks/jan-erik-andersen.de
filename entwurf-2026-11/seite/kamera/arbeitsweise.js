// Kamera-Stützstellen Szene „arbeitsweise“ (Szenenzeit u: 0 = Szenenanfang, 1 = Szenenende, negativ = Anlauf im Flug davor).
// Die Kamera fährt eine vorab festgelegte, stetige Bahn: Ort (c) und Blickziel (t) laufen als glatte Kurve durch diese Stützstellen,
// beide RELATIV ZUM PUNKT (rote Spitze des Fadens) in der Blickrichtung der Szene: [rechts, hoch, zurück] bzw. [rechts, hoch, voraus] in Welteinheiten.
// Der Punkt führt immer: bleibt eine Stellung stehen (mehrere gleiche Werte), schwimmt die Kamera mit dem Punkt mit, sie hält nie an.
// l = 1 markiert eine Lesestelle (Text steht ganz im Bild). Eine Zahl ändern = Kamera an dieser Stelle anders stellen, kein Codeumbau.
// d = Breitbild (1440 x 900), n = hochkant (390 x 844).
// ERZEUGT von werkzeug/kamera-bauen.mjs aus werkzeug/beats/arbeitsweise.mjs: die Lesestellen-Stützstellen (l = 1) entstehen aus den Beats, Handänderungen dort gehen beim nächsten Lauf verloren.
export default {
  d: [
    { u: -0.3783, c: [0, 0.85, 4.6], t: [0, 0.25, 9] },
    { u: 0.1146, c: [6.4, 8.42, 13.34], t: [6.4, 0.1, 1.08], l: 1 },
    { u: 0.1413, c: [6.4, 8.42, 13.34], t: [6.4, 0.1, 1.08], l: 1 },
    { u: 0.264, c: [-0.02, 2.81, 7.78], t: [-0.02, 1.4, 2.27], l: 1 },
    { u: 0.3003, c: [-0.02, 2.81, 7.78], t: [-0.02, 1.4, 2.27], l: 1 },
    { u: 0.3761, c: [0.02, 2.82, 7.78], t: [0.02, 1.42, 2.17], l: 1 },
    { u: 0.4268, c: [0.02, 2.82, 7.78], t: [0.02, 1.42, 2.17], l: 1 },
    { u: 0.503, c: [0.04, 2.82, 7.72], t: [0.04, 1.42, 2.24], l: 1 },
    { u: 0.5368, c: [0.04, 2.82, 7.72], t: [0.04, 1.42, 2.24], l: 1 },
    { u: 0.6281, c: [0.27, 1.77, 4.99], t: [0.27, 0.81, 1.81], l: 1 },
    { u: 0.6716, c: [0.27, 1.77, 4.99], t: [0.27, 0.81, 1.81], l: 1 },
    { u: 0.818, c: [-0.99, 2.56, 5.37], t: [-0.99, 0.51, 0.26], l: 1 },
    { u: 0.8723, c: [-0.99, 2.56, 5.37], t: [-0.99, 0.51, 0.26], l: 1 },
    { u: 1, c: [0, 0.85, 4.6], t: [0, 0.25, 9] }
  ],
  n: [
    { u: -0.3645, c: [0, 1, 5.6], t: [0, 0.25, 11] },
    { u: 0.1178, c: [11.2, 9.13, 15.18], t: [11.2, -0.21, 1.01], l: 1, o: 1 },
    { u: 0.1442, c: [11.2, 9.13, 15.18], t: [11.2, -0.21, 1.01], l: 1, o: 1 },
    { u: 0.2677, c: [-0.06, 2.52, 6.37], t: [-0.06, 1.33, 2.15], l: 1 },
    { u: 0.3035, c: [-0.06, 2.52, 6.37], t: [-0.06, 1.33, 2.15], l: 1 },
    { u: 0.3783, c: [-0.03, 2.52, 6.35], t: [-0.03, 1.32, 2.16], l: 1 },
    { u: 0.4283, c: [-0.03, 2.52, 6.35], t: [-0.03, 1.32, 2.16], l: 1 },
    { u: 0.5036, c: [-0.01, 2.52, 6.28], t: [-0.01, 1.32, 2.21], l: 1 },
    { u: 0.5369, c: [-0.01, 2.52, 6.28], t: [-0.01, 1.32, 2.21], l: 1 },
    { u: 0.6271, c: [0.24, 2.27, 9.64], t: [0.24, 0.67, 1.72], l: 1 },
    { u: 0.67, c: [0.24, 2.27, 9.64], t: [0.24, 0.67, 1.72], l: 1 },
    { u: 0.8121, c: [-0.84, 4.84, 11.55], t: [-0.84, 0.3, 0.94], l: 1 },
    { u: 0.8656, c: [-0.84, 4.84, 11.55], t: [-0.84, 0.3, 0.94], l: 1 },
    { u: 1, c: [0, 1, 5.6], t: [0, 0.25, 11] }
  ]
};
