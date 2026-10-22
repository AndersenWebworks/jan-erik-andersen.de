// Szenenfolge der durchgehenden Seite (entwurf-2026-11/seite/): Reihenfolge, Ausschnitte, Längen, Faden je Szene.
// Reihenfolge laut Seitentext (entwurf-2026-10-b-raumtext-2/index.html): Eröffnung, Gerwing, Leistungen (Betreuung, Modernisierung,
// Shops, Schnittstellen, Gestaltung), Weitere Arbeit (WBG Pooling, Außerdem), Wie ich arbeite, Werdegang,
// Stimmen, Für Agenturen, Kontakt. Eigenes Modul, damit die Prüfskripte dieselbe Folge rechnen wie die Seite.
import eroeffnung from "./eroeffnung.js";
import gerwing from "./gerwing.js";
import betreuung from "./betreuung.js";
import modernisierung from "./modernisierung.js";
import shop from "./shop.js";
import schnittstellen from "./schnittstellen.js";
import werdegang from "./werdegang.js";
import stimmen from "./stimmen.js";
import abschluss from "./abschluss.js";

// Längen je Abschnitt in vh (d: Breitbild, n: hochkant), fest, damit #p schon vor dem Bau aller Szenen gilt.
// Szene: eigener Scrollweg der Einzelszene (Spur − 100 vh) mal Anteil der Schlüssel im Ausschnitt mal Tempo P. Das Tempo bleibt 1 (wie in der
// Einzelszene abgestimmt), wo das kleinste Lesefenster schon knapp ist (unter rund 30 vh: Text ganz im Rahmen, voll deckend, fast
// ruhig); wo es reichlich ist, wird die Szene gekürzt (auf 0,6 bis 0,9). lead/tail: +30 vh je zusätzlicher Anfahrt bzw. Rückzug
// an einer Lesestelle am Szenenanfang bzw. -ende (kern.js). Übergang tr: Fahrt in die Szene, 40 vh + 1,2 vh je Einheit
// Flugweite, 60 … 100 vh. Gerechnet mit tmp/seite-pruefung/rechnen.mjs und fenster.mjs (nicht im Repo).
const L = (d, n = d) => ({ d: Math.round(d), n: Math.round(n) });
const TR = (fd, fn) => L(Math.min(100, Math.max(60, 40 + 1.2 * fd)), Math.min(100, Math.max(60, 40 + 1.2 * fn)));

// Faden je Szene (Szenenkoordinaten x, z bzw. x, y, z): Eingang an der Vorderkante, Ausgang an der Hinterkante, Umwege um Bauteile
const lane = (I, dx = .35) => {
  const s = I.sheetBox[0], c = I.clip || [-1e5, 1e5, -1e5, 1e5];
  const x0 = Math.max(s[0], c[0]), z0 = Math.max(s[2], c[2]), z1 = Math.min(s[3], c[3]);
  return { in: [x0 + dx, z1 - .2], out: [x0 + dx, z0 + .2] };
};

export const SEQ = [
  { name: "eroeffnung", label: "Eröffnung", mod: eroeffnung, len: L(590), tr: L(0),
    faden: () => ({}) },
  { name: "gerwing", label: "Gerwing", mod: gerwing, len: L(640), tr: TR(22.8, 31.4),
    // Eingang rechts neben dem Abdruck der Palette vorbei zum Anfang des eigenen Fadens (Palette → Weiche → Halle), danach zwischen
    // der mittleren Halle (durch die Halle) nach hinten
    faden: () => ({ in: [6.6, 3.2], viaPre: [[8.15, -.4]], viaPost: [[14.5, -6.0]], out: [14.5, -9.4] }) },
  { name: "betreuung", label: "Betreuung und Absicherung", mod: betreuung, len: L(440 * .8), tr: TR(31.6, 37.9),
    faden: (d, I) => ({ in: [-5.3, I.K.narrow ? 4.4 : 3.8], out: [-5.3, -3.4] }) },
  { name: "modernisierung", label: "Modernisierung", mod: modernisierung, len: L(440 * .9), tr: TR(25.1, 21.4),
    faden: (d, I) => I.K.narrow ? { in: [-6.6, 9.6], out: [-6.6, -13.2] } : { in: [-9.2, 7.0], out: [-9.2, -6.2] } },
  { name: "shop", label: "Shops und Shop-Wechsel", mod: shop, len: L(520), tr: TR(44.9, 62.7),
    faden: (d, I) => ({ in: [-7.75, I.K.narrow ? 9.4 : 5.05], out: [-7.75, I.K.narrow ? -10.3 : -9.3] }) },
  // Schnittstellen und WBG Pooling sind ein Modul: hier der erste Teil (b 0 … .55), WBG folgt nach „Gestaltung“
  { name: "schnittstellen", label: "Schnittstellen und eigene Werkzeuge", mod: schnittstellen, len: L(900 * 6.5 / 13.9 + 60, 900 * 6.5 / 14.2 + 60), tr: TR(32.6, 53.8), lead: 1, tail: 1,
    keys: d => d.keys.slice(0, 6), bMax: .55,
    faden: () => ({ in: [-9.1, 18.8], out: [-9.1, -6.8] }) },
  { name: "gestaltung", label: "Gestaltung", optional: "./staffelei.js", pick: m => m.default, len: L(540 * .6), tr: TR(17.7, 19.8),
    faden: (d, I) => lane(I) },
  { name: "wbg", label: "WBG Pooling", mod: schnittstellen, len: L(900 * 7.4 / 13.9 + 30, 900 * 7.7 / 14.2 + 30), tr: TR(26, 43.1), tail: 1,
    keys: d => [{ w: 0, b: .556, fromStop: d.names.h2, back: 1.6, up: 1.5 }, ...d.keys.slice(6)],
    // kein Raster: zwischen Szenenanfang (b .556) und erster Lesestelle (b .61) ist für eine Bauphase kein Platz; Gerüst und Spur bleiben
    grid: false,
    faden: () => ({ in: [-9.1, 18.8], out: [-9.1, -6.8] }) },
  { name: "ausserdem", label: "Außerdem", optional: "./platzhalter.js", pick: m => m.ausserdem, len: L(320 * .6), tr: TR(24, 32.3),
    faden: (d, I) => lane(I) },
  // Abschluss ist ein Modul mit drei Szenen auf einem langen Bogen: „Wie ich arbeite“ hier, „Für Agenturen“ und „Kontakt“ am Schluss
  { name: "arbeitsweise", label: "Wie ich arbeite", mod: abschluss, len: L(1150 * 4.6 / 17.45 + 30, 1150 * 4.6 / 18.45 + 30), tr: TR(23.4, 30.4), tail: 1,
    keys: d => d.keys.slice(0, 7), bMax: .36, clip: [-1e5, 8.5, -1e5, 1e5], ownThread: false,
    faden: () => ({ in: [-9.1, 6.3], out: [-9.1, -12.7] }) },
  { name: "werdegang", label: "Werdegang", mod: werdegang, len: L(460 + 30), tr: TR(32.1, 34.4), lead: 1,
    faden: d => {
      const P = d.thread.pts, a = P[0], z = P[P.length - 1], ZB = z.z - .45;
      return { in: [a.x, a.z + 1.05], out: [z.x, ZB - .6], viaPost: [[z.x, z.y, ZB + .03], [z.x, z.y - .04, ZB - .03], [z.x, .06, ZB - .03]] };
    } },
  { name: "stimmen", label: "Stimmen", mod: stimmen, len: L(500 + 60), tr: TR(44.7, 50.3), lead: 1, tail: 1, clip: [-1e5, 1e5, -14, 1e5],
    faden: () => ({ in: [5.5, 7.8], viaPost: [[12.0, -3.2]], out: [12.0, -13.6] }) },
  { name: "agenturen", label: "Zusammenarbeit", mod: abschluss, len: L(1150 * 12.15 / 17.45, 1150 * 13.15 / 18.45), tr: TR(32.6, 29.9),
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

