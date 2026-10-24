// Beats der Szene „gerwing“ (WooCommerce-Shop, Pflaster nach Fläche): eine Lesestelle, die Wand mit dem Gerwing-Text. Der Punkt bleibt auf der Wunschlage aus stationen.js (links unten an der Wand).
// Maße: Szenenkoordinaten aus `node werkzeug/zeige.mjs gerwing d` (Textfläche x −9,5 bis −5,5, y 0,4 bis 3,7 auf der Wand bei z −5,2).
const M = { wand: { box: [[-9.7, .2, -5.3], [-5.3, 3.95, -5.1]] } };
export default {
  szene: "gerwing",
  motive: { d: M, n: M },
  blick: { az: 0, el: 10 },
  beats: [
    { zeigt: "wand", stop: 1 }
  ]
};
