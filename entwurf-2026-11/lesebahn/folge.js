// Szenenfolge der Startseite (Lesebahn, gleichmäßige Fahrt): Reihenfolge laut DREHBUCH-LESEBAHN.md. Die Länge jeder Szene folgt aus ihrer Strecke
// (kern.js: Welt-Weg durch das Fahrttempo), hier steht nur die Folge. Eigenes Modul, damit die Prüfskripte dieselbe Folge rechnen wie die Seite.
// Szenen außer der Eröffnung werden einzeln geladen: fehlt ein Modul oder baut es nicht, entfällt sein Abschnitt (Hinweis in der Konsole).
import eroeffnung from "./eroeffnung.js";

const opt = (name, label, file) => ({ name, label, optional: file });
export const SEQ = [
  { name: "eroeffnung", label: "Eröffnung", mod: eroeffnung },
  opt("gerwing", "Gerwing", "./gerwing.js"),
  opt("betreuung", "Betreuung und Absicherung", "./betreuung.js"),
  opt("modernisierung", "Modernisierung", "./modernisierung.js"),
  opt("shop", "Shops und Shop-Wechsel", "./shop.js"),
  opt("schnittstellen", "Schnittstellen und eigene Werkzeuge", "./schnittstellen.js"),
  opt("wbg", "WBG Pooling", "./wbg.js"),
  opt("gestaltung", "Gestaltung", "./gestaltung.js"),
  opt("ausserdem", "Außerdem", "./ausserdem.js"),
  opt("arbeitsweise", "Wie ich arbeite", "./arbeitsweise.js"),
  opt("werdegang", "Werdegang", "./werdegang.js"),
  opt("stimmen", "Stimmen", "./stimmen.js"),
  opt("agenturen", "Für Agenturen", "./agenturen.js"),
  opt("kontakt", "Kontakt", "./kontakt.js")
];

export async function optional(cfg) {
  if (!cfg.optional) return cfg;
  try { const m = await import(cfg.optional), fn = cfg.pick ? cfg.pick(m) : m.default; if (typeof fn !== "function") throw new Error("kein Szenenmodul"); return { ...cfg, mod: fn }; }
  catch (e) { console.warn("Szene fehlt, Abschnitt entfällt:", cfg.name, e && e.message); return null; }
}
