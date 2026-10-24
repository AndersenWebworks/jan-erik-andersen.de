// Beats der Szene „modernisierung“: (1) alter Röhrenmonitor steht, daneben der Flachbildschirm, die Blöcke wandern hinüber; (2) der Röhrenmonitor liegt wieder flach und trägt den Text.
// Breitbild: Röhrenmonitor links, Flachbildschirm rechts (z vorn = +z). Hochkant: hintereinander, Röhrenmonitor hinten (z negativ), Flachbildschirm vorn.
const M = {
  d: {
    roehre: { box: [[-5.2, 0, -1.3], [-1.6, 3.0, 1.3]] },
    flach: { box: [[.55, 0, .65], [4.55, 3.95, 1.85]] },
    text: { box: [[-8.1, 0, -1.3], [1.3, .3, 4.2]], text: .2 }
  },
  n: {
    roehre: { box: [[-1.7, 0, -8.5], [1.7, 3.7, -5.9]] },
    flach: { box: [[-2.0, 0, 2.2], [2.0, 4.1, 3.5]] },
    text: { box: [[-1.7, 0, -6.1], [1.7, .3, -2.9]], text: .2 }
  }
};
export default {
  szene: "modernisierung",
  motive: M,
  beats: [
    { zeigt: ["roehre", "flach"], u: [.12, .23], ohnePunkt: { n: true }, blick: { d: { az: 0, el: 24 }, n: { az: 0, el: 34 } } },
    { zeigt: { d: ["text", "flach"], n: "text" }, stop: 1, blick: { d: { az: 0, el: 50 }, n: { az: 0, el: 55 } } }
  ]
};
