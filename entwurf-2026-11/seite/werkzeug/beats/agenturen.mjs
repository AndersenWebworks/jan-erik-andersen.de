// Beats der Szene „agenturen“ (Zusammenarbeit): (1) Titel am Boden, (2) bis (4) die drei Spalten der Tafel (Erledigt, In Arbeit, Als Nächstes), die Karten tragen die Sätze. Der Punkt läuft auf der Route aus stationen.js vor dem Teamtisch, bleibt dort aber weit vor der Tafel: bei den Spalten darf er aus dem Bild laufen (ohnePunkt), damit die Spalte groß im Bild steht.
// Maße: Szenenkoordinaten aus `node werkzeug/zeige.mjs agenturen d` (Tisch x 12,6 bis 21,4, z −1,3 bis 1,3, Platte y 1,25; Tafel bei z −2,7, Spaltenmitten x 14,45 / 17 / 19,55).
const spalte = cx => ({ box: [[cx - 1.4, 2.5, -2.8], [cx + 1.4, 6.4, -2.6]] });
const M = { titel: { box: [[14, -.2, 4.8], [20, 1.0, 5.0]] }, erledigt: spalte(14.45), inarbeit: spalte(17), naechstes: spalte(19.55) };
export default {
  szene: "agenturen",
  motive: { d: M, n: M },
  blick: { az: 0, el: 12 },
  beats: [
    { zeigt: "titel", stop: 1 },
    { zeigt: "erledigt", stop: 2, ohnePunkt: true },
    { zeigt: "inarbeit", stop: 3, ohnePunkt: true },
    { zeigt: "naechstes", stop: 4, ohnePunkt: true }
  ]
};
