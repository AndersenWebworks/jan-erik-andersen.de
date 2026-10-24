// Beats der Szene „gestaltung“: eine Staffelei, vier Stationen (Sätze, Plakat, NOVUM-Cover, 100 Jahre Audi). Das Motiv ist immer die ganze Staffelei mit dem Blatt.
// Der Punkt läuft vor der Staffelei von links nach rechts (Lesestelle 1 bis 4) und danach rechts vorbei nach hinten.
const staffelei = { d: [[-1.9, 0, -1], [1.9, 4.75, 2]], n: [[-1.4, 0, -1.2], [1.4, 5.0, 2]] };
export default {
  szene: "gestaltung",
  blick: { az: 0, el: 8 },
  get motive() {
    const o = {};
    for (const m of ["d", "n"]) for (const k of ["saetze", "plakat", "novum", "audi"]) (o[m] ||= {})[k] = { box: staffelei[m], text: .16 };
    return o;
  },
  weg: [[-4.6, 3.4, 0, 2], [4.6, 3.2, 4, 2], [7.8, 2, 4, 2], [8.4, -4.6, 4, 2]],
  beats: [
    { zeigt: "saetze", stop: 1, punkt: [-1.2, 3.4] },
    { zeigt: "plakat", stop: 2, punkt: [-.4, 3.4] },
    { zeigt: "novum", stop: 3, punkt: [.4, 3.4] },
    { zeigt: "audi", stop: 4, punkt: [1.2, 3.4] }
  ]
};
