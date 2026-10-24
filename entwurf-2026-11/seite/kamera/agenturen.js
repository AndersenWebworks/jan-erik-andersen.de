// Kamera-Stützstellen Szene „agenturen“ (Szenenzeit u: 0 = Szenenanfang, 1 = Szenenende, negativ = Anlauf im Flug davor).
// Die Kamera fährt eine vorab festgelegte, stetige Bahn: Ort (c) und Blickziel (t) laufen als glatte Kurve durch diese Stützstellen,
// beide RELATIV ZUM PUNKT (rote Spitze des Fadens) in der Blickrichtung der Szene: [rechts, hoch, zurück] bzw. [rechts, hoch, voraus] in Welteinheiten.
// Der Punkt führt immer: bleibt eine Stellung stehen (mehrere gleiche Werte), schwimmt die Kamera mit dem Punkt mit, sie hält nie an.
// l = 1 markiert eine Lesestelle (Text steht ganz im Bild). Eine Zahl ändern = Kamera an dieser Stelle anders stellen, kein Codeumbau.
// d = Breitbild (1440 x 900), n = hochkant (390 x 844).
// ERZEUGT von werkzeug/kamera-bauen.mjs aus werkzeug/beats/agenturen.mjs: die Lesestellen-Stützstellen (l = 1) entstehen aus den Beats, Handänderungen dort gehen beim nächsten Lauf verloren.
export default {
  d: [
    { u: -0.2747, c: [0, 0.85, 4.6], t: [0, 0.25, 9] },
    { u: 0.1296, c: [3.25, 2.24, 7.77], t: [3.25, 0.27, 1.51], l: 1 },
    { u: 0.1509, c: [3.25, 2.24, 7.77], t: [3.25, 0.27, 1.51], l: 1 },
    { u: 0.2851, c: [0.31, 6.3, 1.49], t: [0.31, 4.46, 7.15], l: 1, o: 1 },
    { u: 0.3243, c: [0.31, 6.3, 1.49], t: [0.31, 4.46, 7.15], l: 1, o: 1 },
    { u: 0.4506, c: [0, 6.3, 2.34], t: [0, 4.46, 6.31], l: 1, o: 1 },
    { u: 0.5546, c: [0, 6.3, 2.34], t: [0, 4.46, 6.31], l: 1, o: 1 },
    { u: 0.6913, c: [-1.03, 6.3, 2.34], t: [-1.03, 4.46, 6.3], l: 1, o: 1 },
    { u: 0.7377, c: [-1.03, 6.3, 2.34], t: [-1.03, 4.46, 6.3], l: 1, o: 1 },
    { u: 1, c: [0, 0.85, 4.6], t: [0, 0.25, 9] }
  ],
  n: [
    { u: -0.2344, c: [0, 1, 5.6], t: [0, 0.25, 11] },
    { u: 0.1571, c: [2.48, 3.8, 16.56], t: [2.48, 0.06, 1.06], l: 1 },
    { u: 0.1753, c: [2.48, 3.8, 16.56], t: [2.48, 0.06, 1.06], l: 1 },
    { u: 0.2438, c: [-0.52, 6.2, 0.39], t: [-0.52, 4.33, 8.4], l: 1, o: 1 },
    { u: 0.2774, c: [-0.52, 6.2, 0.39], t: [-0.52, 4.33, 8.4], l: 1, o: 1 },
    { u: 0.4218, c: [-0.17, 6.2, 2.09], t: [-0.17, 4.33, 6.69], l: 1, o: 1 },
    { u: 0.511, c: [-0.17, 6.2, 2.09], t: [-0.17, 4.33, 6.69], l: 1, o: 1 },
    { u: 0.6671, c: [-0.96, 6.2, 2.57], t: [-0.96, 4.33, 6.22], l: 1, o: 1 },
    { u: 0.7069, c: [-0.96, 6.2, 2.57], t: [-0.96, 4.33, 6.22], l: 1, o: 1 },
    { u: 1, c: [0, 1, 5.6], t: [0, 0.25, 11] }
  ]
};
