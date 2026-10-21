// Abschluss Fassung 2026-11: Wie ich arbeite, Für Agenturen, Kontakt (eine Kamerabahn über drei Szenen)
import { run } from "./kern.js";
import a from "./abschluss.js";
run({ a });
// Navigation: weiches Scrollen zur Lesestelle der jeweiligen Überschrift (data-stop = Name der Lesestelle)
addEventListener("click", ev => {
  const l = ev.target.closest && ev.target.closest("[data-stop]"); if (!l || !window.__bogen) return;
  const d = window.__bogen.dbg(), k = d.cur.keys.find(k => k.stop && k.stop.name === l.dataset.stop); if (!k) return;
  ev.preventDefault();
  scrollTo({ top: d.cur.pOfU(k.u) * Math.max(1, document.documentElement.scrollHeight - innerHeight), behavior: "smooth" });
});
