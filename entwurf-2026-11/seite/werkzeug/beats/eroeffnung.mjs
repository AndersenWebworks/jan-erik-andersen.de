// Beats der Szene „eroeffnung“ (Variante C: Schreibtisch mit Monitor, Rechner und Grafiktablett aus dem Bogen). Die Eröffnung ist keyed: eigene Schlüsselfahrt
// (Startbild, Podest, Aufbau, Tablett), keine Stationen, keine Route des Punktes. Der Punkt steht bis zum Tablett unsichtbar am Statuspunkt des Rechners (Welt: Tower-Front),
// darum alle Beats mit ohnePunkt (die Kamera hält ihn dort nicht im Bild) und die Zeitfenster nicht über den Punkt, sondern:
//   stop  = Lesestelle der Schlüsselfahrt (Kernsatz u ≈ .055 ohne Haltefenster: halb; Tablett mit Haltefenster, nach verlängert bis zum Aufbruch des Punktes),
//   bei   = Bauzustand b (Monitor steht fertig: b ≈ .735), u folgt dem Zeitplan der Szene,
//   behalten = vorhandene Stützstellen bleiben (Startbild, Aufbau des Tisches: Überblicke ohne Lesestelle).
// Motive: Boxen in Szenenkoordinaten (vorn = +z), je Bildformat (d Breitbild, n hochkant; Handy: Podest zweistufig, schmalerer Tisch, Smartphone neben dem Monitor).
const PZ = { d: 7.9, n: 12.5 };
const kernBox = { d: [[-3.7, .1, 7.85], [3.7, 2.15, 7.95]], n: [[-1.98, .15, 11.4], [1.98, 3.9, 12.55]] };
export default {
  szene: "eroeffnung",
  blick: { az: 0, el: 4 },
  motive: {
    d: {
      name: { box: kernBox.d },
      kern: { box: kernBox.d, text: .15 },
      aufbau: { box: [[-3.7, 0, -2.05], [7.3, 5.95, 7.95]] },
      monitor: { box: [[-.75, 3.2, -2.05], [2.75, 5.95, -1.78]], text: .1 },
      tablett: { box: [[-3.5, 2.3, -1.85], [-.5, 2.9, 1.35]], text: .1 }
    },
    n: {
      name: { box: kernBox.n },
      kern: { box: kernBox.n, text: .15 },
      aufbau: { box: [[-2.7, 0, -2.05], [5.2, 5.6, 12.55]] },
      // hochkant trägt das Smartphone (Ständer x 1,9, z 1,0) den Text, der Monitor zeigt dort nur die Skizze der Website
      telefon: { box: [[1.45, 2.4, .85], [2.35, 3.72, 1.35]], text: .05 },
      tablett: { box: [[-2.45, 2.4, -.4], [-1.1, 2.6, 1.0]], text: .1 }
    }
  },
  beats: [
    { zeigt: "name", u: [0, .015], behalten: true, ohnePunkt: true, ohneFoto: true },
    { zeigt: "kern", u: { d: [.0406, .0739], n: [.057, .0982] }, blick: { el: 2 }, ohnePunkt: true },
    { zeigt: "aufbau", u: { d: [.095, .44], n: [.12, .43] }, behalten: true, ohnePunkt: true, ohneFoto: true },
    { zeigt: { d: "monitor", n: "telefon" }, bei: .735, blick: { el: 5 }, ohnePunkt: true },
    { zeigt: "tablett", stop: 3, nach: { d: .075, n: .08 }, blick: { el: 82 }, ohnePunkt: true }
  ]
};
