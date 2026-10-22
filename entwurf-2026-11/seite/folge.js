// Szenenfolge der durchgehenden Seite (entwurf-2026-11/seite/): Reihenfolge, Ausschnitte, Längen, Faden je Szene.
// Reihenfolge laut Seitentext (entwurf-2026-10-b-raumtext-2/index.html): Eröffnung, Gerwing, Leistungen (Betreuung, Modernisierung,
// Shops, Schnittstellen mit WBG Pooling als Beleg, Gestaltung), Weitere Arbeit (Außerdem), Wie ich arbeite, Werdegang,
// Zusammenarbeit (danach die Karte; Kontakt steht im Menü und in der Fußzeile). Eigenes Modul, damit die Prüfskripte dieselbe Folge rechnen wie die Seite.
import eroeffnung from "./eroeffnung.js";
import gerwing from "./gerwing.js";
import betreuung from "./betreuung.js";
import modernisierung from "./modernisierung.js";
import shop from "./shop.js";
import schnittstellen from "./schnittstellen.js";
import werdegang from "./werdegang.js";
import abschluss from "./abschluss.js";

// Längen je Abschnitt in vh (d: Breitbild, n: hochkant), fest, damit #p schon vor dem Bau aller Szenen gilt.
// Szene: eigener Scrollweg der Einzelszene (Spur − 100 vh) mal Anteil der Schlüssel im Ausschnitt mal Tempo P. Das Tempo bleibt 1 (wie in der
// Einzelszene abgestimmt), wo das kleinste Lesefenster schon knapp ist (unter rund 30 vh: Text ganz im Rahmen, voll deckend, fast
// ruhig); wo es reichlich ist, wird die Szene gekürzt (auf 0,6 bis 0,9). lead/tail: +30 vh je zusätzlicher Anfahrt bzw. Rückzug
// an einer Lesestelle am Szenenanfang bzw. -ende (kern.js). Übergang tr: Fahrt in die Szene (siehe TR).
// Gerechnet mit tmp/seite-pruefung/rechnen.mjs, fenster.mjs und tmp/grundstueck/fahrt.mjs (nicht im Repo).
// Tempo (Erik, 22.10.): „man kommt gar nicht zum Ansehen und Genießen“. Alle Szenenlängen und Übergänge sind länger gestreckt: LEN für den Scrollweg
// jeder Szene (Aufklapp- und Bauanimationen laufen in Fenstern von b, sie dehnen sich mit),.
// Lesestellen und Bahnen bleiben, nur ihr Scrollweg wächst (kein Bremsen, kein Scroll-Lock).
const LEN = 1.4;
const L = (d, n = d) => ({ d: Math.round(d * LEN), n: Math.round(n * LEN) });
// Übergang tr (Fahrt in die Szene): Die Kamera folgt dem roten Punkt (kern.js chaseTrack, Erik 22.10.: Kamera folgt dem roten Punkt); die Fahrt dauert so
// lange, dass der Punkt höchstens mit 0,45 Einheiten je vh läuft (Weg des Punktes in Einheiten, d: Breitbild, n: hochkant, gemessen mit
// tmp/verfolgung/len.mjs auf dem Raster), mindestens 85 und höchstens 220 vh. Eine Wende zwischen zwei Bahnen ist der längste Weg, ein Schritt in der Bahn der kürzeste.
const SPEED = .45;
const tr1 = w => Math.round(Math.min(220, Math.max(85, w / SPEED)));
const TR = (pd, pn = pd) => ({ d: tr1(pd), n: tr1(pn) });

// Faden je Szene (Szenenkoordinaten x, z bzw. x, y, z): Eingang an der Vorderkante, Ausgang an der Hinterkante, Umwege um Bauteile
const lane = (I, dx = .35) => {
  const s = I.sheetBox[0], c = I.clip || [-1e5, 1e5, -1e5, 1e5];
  const x0 = Math.max(s[0], c[0]), z0 = Math.max(s[2], c[2]), z1 = Math.min(s[3], c[3]);
  return { in: [x0 + dx, z1 - .2], out: [x0 + dx, z0 + .2] };
};

// Anordnung der Parzellen (kern.js layout(), slotOf()): Raster wie ein Setzkasten, gleich große Parzellen in der Reihenfolge dieser Liste, Schlangenlinie
// durch das Raster (Breitbild: vier Spalten zu drei Feldern, hochkant: vier Reihen zu drei Feldern, das letzte Feld bleibt frei). Richtung und Lage ergeben
// sich aus dem Platz, nicht aus der Szene. short = Name auf der Karte. faden: Eingang (Vorderkante) und Ausgang (Hinterkante) des Fadens in Szenenkoordinaten,
// kern.js legt sie in die Parzelle (Zuschnitt auf den Rand) und verbindet sie mit geraden Strecken und runden Ecken.
export const SEQ = [
  { name: "eroeffnung", label: "Eröffnung", short: "Eröffnung", mod: eroeffnung, len: L(590), tr: L(0),
    faden: () => ({}) },
  { name: "gerwing", label: "Gerwing", short: "Gerwing", mod: gerwing, len: L(1000), tr: TR(44.6, 44.5),
    // Eingang und Ausgang kommen aus der Szene selbst (gerwing.js: Eingang von vorn zum Laptop, Ausgang hinten rechts neben dem Haus als Ende von thread.post)
    faden: d => d.faden },
  { name: "betreuung", label: "Betreuung und Absicherung", short: "Betreuung", mod: betreuung, len: L(440 * .8), tr: TR(42.6, 52.4),
    faden: (d, I) => ({ in: [-5.3, I.K.narrow ? 4.4 : 3.8], out: [-5.3, -3.4] }) },
  { name: "modernisierung", label: "Modernisierung", short: "Modernisierung", mod: modernisierung, len: L(440 * .9 * 1.8), tr: TR(93.0, 53.2),
    faden: (d, I) => I.K.narrow ? { in: [-6.6, 9.6], out: [-6.6, -13.2] } : { in: [-9.2, 7.0], out: [-9.2, -6.2] } },
  { name: "shop", label: "Shops und Shop-Wechsel", short: "Shops", mod: shop, len: L(520), tr: TR(52.9, 106.6),
    faden: (d, I) => ({ in: [-7.75, I.K.narrow ? 9.4 : 5.05], out: [-7.75, I.K.narrow ? -10.3 : -9.3] }) },
  // Schnittstellen und WBG Pooling: eine durchgehende Szene (b 0 … 1), WBG Pooling als Beleg; #s=wbg zeigt auf die Lesestelle c (WBG-Satz)
  { name: "schnittstellen", label: "Schnittstellen und eigene Werkzeuge", short: "Schnittstellen", mod: schnittstellen, len: L(650, 760), tr: TR(42.5, 58.7), lead: 1,
    anchors: { wbg: d => d.keys.findIndex(k => k.stop && k.stop === d.names.c) },
    faden: () => ({ in: [-9.1, 18.8], out: [-9.1, -6.8] }) },
  { name: "gestaltung", label: "Gestaltung", short: "Gestaltung", optional: "./staffelei.js", pick: m => m.default, len: L(480), tr: TR(115.5, 56.2),
    faden: (d, I) => lane(I) },
  { name: "ausserdem", label: "Außerdem", short: "Außerdem", optional: "./platzhalter.js", pick: m => m.ausserdem, len: L(760, 860), tr: TR(48.6, 46.1),
    faden: (d, I) => lane(I) },
  // Abschluss ist ein Modul mit zwei Szenen auf einem langen Bogen: „Wie ich arbeite“ hier, „Zusammenarbeit“ am Schluss
  { name: "arbeitsweise", label: "Wie ich arbeite", short: "Wie ich arbeite", mod: abschluss, len: L(1150 * 4.75 / 17.45 + 30, 1150 * 4.75 / 18.45 + 30), tr: TR(50.3, 99.7), tail: 1,
    keys: d => d.keys.slice(0, 7), bMax: .36, clip: [-1e5, 8.5, -1e5, 1e5], ownThread: false,
    faden: () => ({ in: [-9.1, 6.3], out: [-9.1, -12.7] }) },
  { name: "werdegang", label: "Werdegang", short: "Werdegang", mod: werdegang, len: L(460 + 30), tr: TR(79.7, 48.2), lead: 1,
    faden: d => {
      const P = d.thread.pts, a = P[0], z = P[P.length - 1], ZB = z.z - .45;
      return { in: [a.x, a.z + 1.05], out: [z.x, ZB - .6], viaPost: [[z.x, z.y, ZB + .03], [z.x, z.y - .04, ZB - .03], [z.x, .06, ZB - .03]] };
    } },
  { name: "agenturen", label: "Zusammenarbeit", short: "Zusammenarbeit", mod: abschluss, len: L(1150 * 5.0 / 17.45, 1150 * 5.2 / 18.45), tr: TR(37.5, 41.9), tail: 1,
    keys: d => [{ w: 0, b: .37, fromStop: d.stops.find(s => s.name === "h2"), back: 1.6, up: 1.5 }, ...d.keys.slice(8)],
    clip: [8.5, 26, -1e5, 1e5],
    // kein Raster: die Lesestellen beginnen bei b .43, kurz nach dem Szenenanfang (b .37); Gerüst und Spur bleiben
    grid: false,
    // Faden: kommt von links, läuft vor dem Tisch entlang und endet vor dem rechten Platz (eigener Faden der Szene ganz)
    faden: () => ({ in: [9.0, 6.3], viaPre: [[9.0, 3.0]], ownFrom: 0 }) }
];

// Szenen eines anderen Helfers (Gestaltung, Außerdem): fehlen sie, entfällt ihr Abschnitt (Hinweis in der Konsole)
export async function optional(cfg) {
  if (!cfg.optional) return cfg;
  try { const m = await import(cfg.optional), fn = cfg.pick(m); if (typeof fn !== "function") throw new Error("kein Szenenmodul"); return { ...cfg, mod: fn }; }
  catch (e) { console.warn("Szene fehlt, Abschnitt entfällt:", cfg.name, e && e.message); return null; }
}

