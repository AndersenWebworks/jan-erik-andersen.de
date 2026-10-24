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
  // Der Punkt steigt links auf die Ablage der Staffelei (hub: [x0, x1, z0, z1, Höhe, Auslauf x, Auslauf z]), läuft dort unter den Blättern entlang und steigt rechts wieder ab
  faden: { stW: 400, a2: .02, free: [[-1.8, 1.8, .7, 2.0]], hub: [[-1.6, 1.6, 1.4, 2.2, 1.94, 2.4, .5]] },
  weg: [[-4.6, 2.6, 0, 2], [4.6, 2.6, 4, 2], [7.8, 2, 4, 2], [8.4, -4.6, 4, 2]],
  beats: [
    { zeigt: "saetze", stop: 1, fest: true, punkt: [0, 1.75] },
    { zeigt: "plakat", stop: 2, fest: true, punkt: [0, 1.75] },
    { zeigt: "novum", stop: 3, fest: true, punkt: [0, 1.75] },
    { zeigt: "audi", stop: 4, fest: true, punkt: [0, 1.75] }
  ]
};
