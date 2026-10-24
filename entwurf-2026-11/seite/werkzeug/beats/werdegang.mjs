// Beats der Szene „werdegang“: Titel am Eingang, danach acht Setzstufen der Treppe, auf jeder Stufe ein Eintrag (Lesestellen 2 bis 9). Der Faden klettert links auf der Treppe (def.lift in werdegang.js, nicht hier).
// Maße: Szenenkoordinaten aus `node werkzeug/zeige.mjs werdegang d`: Treppe x ±3,6, Setzstufen bei z 4,0 / 2,1 / 0,2 / −1,7 / −3,6 / −5,5 / −7,4 / −9,3, Stufenhöhe 0,95, Tritt 1,9 tief; Text links bündig bei x −3,3.
const H = .95, ZS = [4.0, 2.1, .2, -1.7, -3.6, -5.5, -7.4, -9.3], X1 = [-1.95, -1.66, .25, -.9, -2.02, -.11, -.72, -.26];
const M = { titel: { box: [[4.0, -.1, 4.6], [8.5, 1.0, 5.0]] } };
ZS.forEach((z, i) => { M["stufe" + (i + 1)] = { box: [[-3.5, i * H, z - 1.9], [Math.max(X1[i] + .3, -1.2), (i + 1) * H, z]] }; });
export default {
  szene: "werdegang",
  motive: { d: M, n: M },
  blick: { az: -22, el: 14 },
  beats: [
    { zeigt: "titel", stop: 1, blick: { az: 0, el: 10 } },
    ...ZS.map((z, i) => ({ zeigt: "stufe" + (i + 1), stop: i + 2 }))
  ]
};
