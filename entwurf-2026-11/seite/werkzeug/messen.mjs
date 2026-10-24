import { oeffnen, messen, OUT } from "./seite-anbindung.mjs";
import fs from "node:fs"; import path from "node:path";
const [modus, ...szenen] = process.argv.slice(2);
const o = await oeffnen();
try {
  const pg = await o.seite(modus);
  for (const s of szenen) { const m = await messen(pg, s); fs.writeFileSync(path.join(OUT, `messung-${s}-${modus}.json`), JSON.stringify(m)); console.log(s, modus, "stops", m.stops.length, "boxes", m.boxes.length); }
} finally { await o.zu(); }
