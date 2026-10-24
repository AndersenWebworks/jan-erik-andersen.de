// Szenenfolge der durchgehenden Seite (entwurf-2026-11/seite/): Reihenfolge, Ausschnitte, Längen, Inseln und Faden je Szene.
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
import { STATIONEN } from "./stationen.js";
import { KAMERA } from "./kamera/index.js";

// Kamera-Umbau 23.10.2026 (kern.js: Lage der Inseln, Szenenlauf, Zeitplan, Kameraspur). Je Szene:
// - len: Scrollweg der Szene in vh (d: Breitbild, n: hochkant), fest, damit #p schon vor dem Bau aller Szenen gilt. So gewählt, dass der Punkt in der Szene fast genau
//   mit DOT_V läuft (kern.js meldet in der Konsole, wenn das Tempo mehr als 12 % abweicht, mit der passenden Länge). Flüge (Fluss) rechnet kern.js aus ihrer Länge.
// - R: Radius der Insel (alle gleich, Gerwing als Leitreferenz größer). door: seitliche Lage von Eingang (vorn) und Ausgang (hinten) im Inselmaß, fest (nicht vom Inhalt
//   abhängig), damit die Lage aller Inseln beim Laden feststeht. ctr: Mitte der Insel gegen die Mitte des Inhalts verschoben.
// - faden: Wegpunkte (way: [x, z, k] nach k Lesestellen), Teile ohne Hindernis (free), Bahn der Stationen (lane); view: Grundstellung der Kamera in der Insel.
// - keyed (nur Eröffnung): Startbild, Podest, Aufbau und Tablett fahren die eigenen Schlüssel der Szene, danach läuft der Punkt vom Statuspunkt zum Ausgang.
const RAW = [
  { name: "eroeffnung", label: "Eröffnung", short: "Eröffnung", mod: eroeffnung, keyed: true,
    // Schlüssel bis zum Tablett (Lesestelle „faden“); danach Verfolgung
    keys: d => d.keys.slice(0, d.keys.findIndex(k => k.stop && k.stop === d.stops[2]) + 1) },
  { name: "gerwing", label: "Gerwing", short: "Gerwing", mod: gerwing },
  { name: "betreuung", label: "Betreuung und Absicherung", short: "Betreuung", mod: betreuung },
  { name: "modernisierung", label: "Modernisierung", short: "Modernisierung", mod: modernisierung },
  { name: "shop", label: "Shops und Shop-Wechsel", short: "Shops", mod: shop },
  // Schnittstellen und WBG Pooling: eine durchgehende Szene (b 0 … 1), WBG Pooling als Beleg; #s=wbg zeigt auf die Lesestelle c (WBG-Satz). Scheitelinsel.
  { name: "schnittstellen", label: "Schnittstellen und eigene Werkzeuge", short: "Schnittstellen", mod: schnittstellen,
    anchors: { wbg: d => d.keys.findIndex(k => k.stop && k.stop === d.names.c) } },
  { name: "gestaltung", label: "Gestaltung", short: "Gestaltung", optional: "./staffelei.js", pick: m => m.default },
  { name: "ausserdem", label: "Außerdem", short: "Außerdem", optional: "./platzhalter.js", pick: m => m.ausserdem },
  // Abschluss ist ein Modul mit zwei Szenen auf einem langen Bogen: „Wie ich arbeite“ hier, „Zusammenarbeit“ am Schluss
  { name: "arbeitsweise", label: "Wie ich arbeite", short: "Wie ich arbeite", mod: abschluss,
    keys: d => d.keys.slice(0, 7), bMax: .36, clip: [-1e5, 8.5, -1e5, 1e5] },
  { name: "werdegang", label: "Werdegang", short: "Werdegang", mod: werdegang },
  { name: "agenturen", label: "Zusammenarbeit", short: "Zusammenarbeit", mod: abschluss,
    keys: d => [{ w: 0, b: .37 }, ...d.keys.slice(8)],
    clip: [8.5, 26, -1e5, 1e5],
    // kein Raster: die Lesestellen beginnen bei b .43, kurz nach dem Szenenanfang (b .37); Gerüst und Spur bleiben
    grid: false }
];

// Zahlen (Länge, Insel, Türen, Rig-Werte, Lesestellen) aus der Stationstabelle (stationen.js)
export const SEQ = RAW.map(c => ({ ...c, ...(STATIONEN[c.name] || {}), kamera: KAMERA[c.name] }));

// Szenen eines anderen Helfers (Gestaltung, Außerdem): fehlen sie, entfällt ihr Abschnitt (Hinweis in der Konsole)
export async function optional(cfg) {
  if (!cfg.optional) return cfg;
  try { const m = await import(cfg.optional), fn = cfg.pick(m); if (typeof fn !== "function") throw new Error("kein Szenenmodul"); return { ...cfg, mod: fn }; }
  catch (e) { console.warn("Szene fehlt, Abschnitt entfällt:", cfg.name, e && e.message); return null; }
}
