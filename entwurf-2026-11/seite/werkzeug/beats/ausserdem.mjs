// Beats der Szene „ausserdem“ (Wand aus vier Geräten, darunter je ein Schild mit Name, Satz, Adresse).
// Motive: Boxen in Szenenkoordinaten [[x0, y0, z0], [x1, y1, z1]] (Vorderseite der Szene = +z), je Bildformat (d = Breitbild, n = hochkant), weil die Szene hochkant anders gebaut ist.
// text = Höhe der kleinsten Schrift in Welteinheiten (für die Lesbarkeitsmeldung in Pixeln).
// Beat: zeigt (Motiv oder Liste), stop (Nummer der Lesestelle, die der Beat übernimmt), punkt [x, z] (wo der Punkt dabei stehen soll), blick { az, el } (Grad, optional je d/n).
const pitch = { d: 4.2, n: 3.7 }, tops = { d: [4.18, 3.35, 4.49, 3.74], n: [4.09, 3.41, 4.34, 3.72] }, zFront = { d: -.7, n: -.8 };
const NAMEN = ["onkologie", "mindblossom", "wirkungsbericht", "baeckerei"];
export default {
  szene: "ausserdem",
  blick: { az: 0, el: 9 },
  get motive() {
    const o = {};
    for (const m of ["d", "n"]) NAMEN.forEach((k, i) => { const cx = (i - 1.5) * pitch[m], w = pitch[m] / 2 - .1; (o[m] ||= {})[k] = { box: [[cx - w, 0, -2], [cx + w, tops[m][i], zFront[m]]], text: m === "d" ? .13 : .15 }; });
    return o;
  },
  beats: [
    { zeigt: "onkologie", stop: 1, punkt: { d: [-6.3, .9], n: [-5.55, 1] } },
    { zeigt: "mindblossom", stop: 2, punkt: { d: [-2.1, .9], n: [-1.85, 1] } },
    { zeigt: "wirkungsbericht", stop: 3, punkt: { d: [2.1, .9], n: [1.85, 1] } },
    { zeigt: "baeckerei", stop: 4, punkt: { d: [6.3, .9], n: [5.55, 1] } }
  ]
};
