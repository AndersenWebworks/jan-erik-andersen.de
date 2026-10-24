// Beats der Szene „ausserdem“ (Wand aus vier Geräten, darunter je ein Schild mit Name, Satz, Adresse).
// Motive: Boxen in Szenenkoordinaten [[x0, y0, z0], [x1, y1, z1]] (Vorderseite der Szene = +z), je Bildformat (d = Breitbild, n = hochkant), weil die Szene hochkant anders gebaut ist.
// text = Höhe der kleinsten Schrift in Welteinheiten (für die Lesbarkeitsmeldung in Pixeln).
// Beat: zeigt (Motiv oder Liste), stop (Nummer der Lesestelle, die der Beat übernimmt), punkt [x, z] (wo der Punkt dabei stehen soll), blick { az, el } (Grad, optional je d/n).
const pitch = { d: 4.2, n: 3.7 }, tops = { d: [4.18, 3.35, 4.49, 3.74], n: [4.09, 3.41, 4.34, 3.72] }, zFront = { d: -.7, n: -.8 };
const NAMEN = ["onkologie", "mindblossom", "wirkungsbericht", "baeckerei"];
export default {
  szene: "ausserdem",
  blick: { az: 0, el: 17 },
  get motive() {
    const o = {};
    for (const m of ["d", "n"]) NAMEN.forEach((k, i) => { const cx = (i - 1.5) * pitch[m], w = pitch[m] / 2 - .1; (o[m] ||= {})[k] = { box: [[cx - w, 0, -2], [cx + w, tops[m][i], zFront[m]]], text: m === "d" ? .13 : .15 }; });
    return o;
  },
  // Der Punkt steigt am linken Ende auf die Ablage (hub: [x0, x1, z0, z1, Höhe, Auslauf x, Auslauf z]) und steht an jeder Lesestelle auf der Ablage vor dem Gerät (fest = feste Station)
  faden: {
    stW: 150, rMin: 2.85, a2: .05,
    free: [[-8.9, 8.9, -2.05, -.65]],
    hub: { d: [[-8.85, 8.85, -2.05, -.55, 1.62, 2.4, .5]], n: [[-7.85, 7.85, -2.05, -.65, 1.98, 2.4, .5]] }
  },
  weg: { d: [[-10.9, -1.0, 0, 6]], n: [[-9.9, -1.0, 0, 6]] },
  beats: [
    { zeigt: "onkologie", stop: 1, fest: true, punkt: { d: [-6.3, -.95], n: [-5.55, -1] } },
    { zeigt: "mindblossom", stop: 2, fest: true, punkt: { d: [-2.1, -.95], n: [-1.85, -1] } },
    { zeigt: "wirkungsbericht", stop: 3, fest: true, punkt: { d: [2.1, -.95], n: [1.85, -1] } },
    { zeigt: "baeckerei", stop: 4, fest: true, punkt: { d: [6.3, -.95], n: [5.55, -1] } }
  ]
};
