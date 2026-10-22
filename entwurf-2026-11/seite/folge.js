// Szenenfolge der durchgehenden Seite (entwurf-2026-11/seite/): Reihenfolge, Ausschnitte, Längen, Faden je Szene.
// Reihenfolge laut Seitentext (entwurf-2026-10-b-raumtext-2/index.html): Eröffnung, Gerwing, Leistungen (Betreuung, Modernisierung,
// Shops, Schnittstellen mit WBG Pooling als Beleg, Gestaltung), Weitere Arbeit (Außerdem), Wie ich arbeite, Werdegang,
// Für Agenturen, Kontakt. Eigenes Modul, damit die Prüfskripte dieselbe Folge rechnen wie die Seite.
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
// jeder Szene (Aufklapp- und Bauanimationen laufen in Fenstern von b, sie dehnen sich mit), TRF für die Flüge zwischen den Parzellen.
// Lesestellen und Bahnen bleiben, nur ihr Scrollweg wächst (kein Bremsen, kein Scroll-Lock).
const LEN = 1.4, TRF = 1.3;
const L = (d, n = d) => ({ d: Math.round(d * LEN), n: Math.round(n * LEN) });
const Lr = (d, n = d) => ({ d: Math.round(d * TRF), n: Math.round(n * TRF) });
// Übergang tr (Fahrt in die Szene): 38 vh + 0,5 vh je Einheit Weglänge der Fahrt (Aufstieg zur Überblickspose, Gleiten, Absinken), 50 … 96 vh.
// Weglängen aus tmp/grundstueck/fahrt.mjs (Anordnung in kern.js layout(), Überblickspose fitPair()).
const TR = (ld, ln = ld) => Lr(Math.min(96, Math.max(50, 38 + .5 * ld)), Math.min(96, Math.max(50, 38 + .5 * ln)));

// Faden je Szene (Szenenkoordinaten x, z bzw. x, y, z): Eingang an der Vorderkante, Ausgang an der Hinterkante, Umwege um Bauteile
const lane = (I, dx = .35) => {
  const s = I.sheetBox[0], c = I.clip || [-1e5, 1e5, -1e5, 1e5];
  const x0 = Math.max(s[0], c[0]), z0 = Math.max(s[2], c[2]), z1 = Math.min(s[3], c[3]);
  return { in: [x0 + dx, z1 - .2], out: [x0 + dx, z0 + .2] };
};

// Anordnung der Parzellen auf dem Tisch (kern.js layout()): dir = Blickrichtung der Bahn ab dieser Szene (N, E, S, W; je Breitbild d und hochkant n,
// fehlt sie, gilt die der vorigen Szene), lane = Breite der Bahn an deren erster Szene (größte Parzellenbreite, Ausrichtung mittig auf der Achse).
// Zwischen zwei Bahnen steht eine Eckparzelle quer (Breitbild: Shops, Wie ich arbeite; hochkant: Gestaltung). short = Name auf der Karte.
// Breitbild: drei Reihen (Eröffnung … Modernisierung | Schnittstellen … Außerdem | Werdegang … Kontakt), hochkant: zwei Bahnen.
export const SEQ = [
  { name: "eroeffnung", label: "Eröffnung", short: "Eröffnung", dir: { d: "E", n: "S" }, lane: { d: 32, n: 40 }, mod: eroeffnung, len: L(590), tr: L(0),
    faden: () => ({}) },
  { name: "gerwing", label: "Gerwing", short: "Gerwing", mod: gerwing, len: L(640), tr: TR(103.8, 156.3),
    // Eingang und Ausgang kommen aus der Szene selbst (gerwing.js: Eingang von vorn zum Laptop, Ausgang hinten rechts neben dem Haus als Ende von thread.post)
    faden: d => d.faden },
  { name: "betreuung", label: "Betreuung und Absicherung", short: "Betreuung", mod: betreuung, len: L(440 * .8), tr: TR(85.7, 140.5),
    faden: (d, I) => ({ in: [-5.3, I.K.narrow ? 4.4 : 3.8], out: [-5.3, -3.4] }) },
  { name: "modernisierung", label: "Modernisierung", short: "Modernisierung", mod: modernisierung, len: L(440 * .9 * 1.35), tr: TR(51.0, 62.2),
    faden: (d, I) => I.K.narrow ? { in: [-6.6, 9.6], out: [-6.6, -13.2] } : { in: [-9.2, 7.0], out: [-9.2, -6.2] } },
  { name: "shop", label: "Shops und Shop-Wechsel", short: "Shops", dir: { d: "N" }, mod: shop, len: L(520), tr: TR(92.6, 98.2),
    faden: (d, I) => ({ in: [-7.75, I.K.narrow ? 9.4 : 5.05], out: [-7.75, I.K.narrow ? -10.3 : -9.3] }) },
  // Schnittstellen und WBG Pooling: eine durchgehende Szene (b 0 … 1), WBG Pooling als Beleg; #s=wbg zeigt auf die Lesestelle c (WBG-Satz)
  { name: "schnittstellen", label: "Schnittstellen und eigene Werkzeuge", short: "Schnittstellen", dir: { d: "W" }, lane: { d: 33 }, mod: schnittstellen, len: L(650, 760), tr: TR(117.0, 132.9), lead: 1,
    anchors: { wbg: d => d.keys.findIndex(k => k.stop && k.stop === d.names.c) },
    faden: () => ({ in: [-9.1, 18.8], out: [-9.1, -6.8] }) },
  { name: "gestaltung", label: "Gestaltung", short: "Gestaltung", dir: { n: "E" }, optional: "./staffelei.js", pick: m => m.default, len: L(480), tr: TR(99.7, 196.8),
    faden: (d, I) => lane(I) },
  { name: "ausserdem", label: "Außerdem", short: "Außerdem", dir: { n: "N" }, lane: { n: 48 }, optional: "./platzhalter.js", pick: m => m.ausserdem, len: L(760, 860), tr: TR(74.9, 136.6),
    faden: (d, I) => lane(I) },
  // Abschluss ist ein Modul mit drei Szenen auf einem langen Bogen: „Wie ich arbeite“ hier, „Für Agenturen“ und „Kontakt“ am Schluss
  { name: "arbeitsweise", label: "Wie ich arbeite", short: "Wie ich arbeite", dir: { d: "N" }, mod: abschluss, len: L(1150 * 4.6 / 17.45 + 30, 1150 * 4.6 / 18.45 + 30), tr: TR(105.6, 66.8), tail: 1,
    keys: d => d.keys.slice(0, 7), bMax: .36, clip: [-1e5, 8.5, -1e5, 1e5], ownThread: false,
    faden: () => ({ in: [-9.1, 6.3], out: [-9.1, -12.7] }) },
  { name: "werdegang", label: "Werdegang", short: "Werdegang", dir: { d: "E" }, lane: { d: 48 }, mod: werdegang, len: L(460 + 30), tr: TR(128.7, 96.6), lead: 1,
    faden: d => {
      const P = d.thread.pts, a = P[0], z = P[P.length - 1], ZB = z.z - .45;
      return { in: [a.x, a.z + 1.05], out: [z.x, ZB - .6], viaPost: [[z.x, z.y, ZB + .03], [z.x, z.y - .04, ZB - .03], [z.x, .06, ZB - .03]] };
    } },
  { name: "agenturen", label: "Zusammenarbeit", short: "Zusammenarbeit und Kontakt", mod: abschluss, len: L(1150 * 12.15 / 17.45, 1150 * 13.15 / 18.45), tr: TR(119.4, 221.8),
    keys: d => [{ w: 0, b: .37, fromStop: d.stops.find(s => s.name === "h2"), back: 1.6, up: 1.5 }, ...d.keys.slice(8)],
    clip: [8.5, 1e5, -1e5, 1e5],
    // kein Raster: die Lesestellen beginnen bei b .43, kurz nach dem Szenenanfang (b .37); Gerüst und Spur bleiben
    grid: false,
    // „Kontakt“: Sprungziel ist die letzte Lesestelle (Überschrift und alle drei Karten ganz im Bild)
    anchors: { kontakt: d => d.keys.findIndex(k => k.stop && k.stop.name === "all") },
    // Abschnittsname im Label: ab der Überschrift „Schreiben Sie mir“ steht dort „Kontakt“
    labels: [{ label: "Kontakt", ki: d => d.keys.findIndex(k => k.stop && k.stop.name === "h3") - 1 }],
    faden: () => ({ in: [9.0, 6.3], viaPre: [[9.0, 3.0], [20.6, 3.0]], ownFrom: 4 }) }
];

// Szenen eines anderen Helfers (Gestaltung, Außerdem): fehlen sie, entfällt ihr Abschnitt (Hinweis in der Konsole)
export async function optional(cfg) {
  if (!cfg.optional) return cfg;
  try { const m = await import(cfg.optional), fn = cfg.pick(m); if (typeof fn !== "function") throw new Error("kein Szenenmodul"); return { ...cfg, mod: fn }; }
  catch (e) { console.warn("Szene fehlt, Abschnitt entfällt:", cfg.name, e && e.message); return null; }
}

