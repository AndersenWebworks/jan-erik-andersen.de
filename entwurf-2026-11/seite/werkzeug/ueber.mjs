// Freie Ansicht zur Orientierung: node ueber.mjs <d|n> <szene> <u> cx cy cz tx ty tz [name]
import { oeffnen, foto } from "./seite-anbindung.mjs";
const [m, s, u, ...r] = process.argv.slice(2); const v = r.slice(0, 6).map(Number), name = r[6] || `ueber-${s}`;
const o = await oeffnen();
try { const pg = await o.seite(m); await pg.evaluate(([s, v]) => window.__seite.free(s, v.slice(0, 3), v.slice(3)), [s, v]); await foto(pg, s, +u, `${name}-${m}.png`, 2500); } finally { await o.zu(); }
