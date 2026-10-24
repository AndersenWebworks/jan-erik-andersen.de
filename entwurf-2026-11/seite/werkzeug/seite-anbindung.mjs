// Dünne Anbindung an die 3D-Seite: Server + ein Headless-Chromium (Playwright), Messen (Szenenlage, Lesestellen, Punktbahn, Bauteilboxen), Schreiben von kamera/<szene>.js und kamera/routen.js.
// Alles Seitenspezifische steht hier; kern-kamera.mjs kennt nur Zahlen.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import cp from "node:child_process";
import { fileURLToPath } from "node:url";
const HIER = path.dirname(fileURLToPath(import.meta.url));
export const SEITE = path.resolve(HIER, "..");
export const ROOT = path.resolve(SEITE, "../..");
export const OUT = path.join(SEITE, "_pruefung/motiv");
const { chromium } = createRequire(import.meta.url)(path.join(ROOT, "node_modules/playwright"));
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".css": "text/css", ".jpg": "image/jpeg", ".webp": "image/webp" };
export const FORMATE = { d: { width: 1440, height: 900, fov: 32, rand: { o: 84, u: 96, l: 48, r: 48 } }, n: { width: 390, height: 844, fov: 44, rand: { o: 76, u: 116, l: 14, r: 14 } } };

// Rechner schonen: höchstens 12 von 16 Kernen, niedrigere Priorität (vererbt sich an Chromium)
export function schonen() { cp.spawnSync("powershell", ["-NoProfile", "-Command", `$p=Get-Process -Id ${process.pid}; $p.ProcessorAffinity=0x0FFF; $p.PriorityClass='BelowNormal'`]); }

// Server und Browser öffnen; liefert { seite(modus), zu() }. Immer mit zu() beenden.
export async function oeffnen(port = 8953) {
  schonen();
  const srv = http.createServer((q, r) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0].split("#")[0]));
    if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
    fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" }); r.end(b); });
  });
  await new Promise(r => srv.listen(port, "127.0.0.1", r));
  const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  return {
    async seite(modus) {
      const f = FORMATE[modus], pg = await b.newPage({ viewport: { width: f.width, height: f.height } });
      pg.on("pageerror", e => console.log("pageerror", e.message));
      await pg.goto(`http://127.0.0.1:${port}/entwurf-2026-11/seite/index.html`);
      await pg.waitForFunction(() => window.__seite && window.__seite.inst().every(I => I.built), null, { timeout: 240000 });
      await pg.waitForTimeout(800);
      return pg;
    },
    async zu() { await b.close(); srv.close(); }
  };
}

// Messen einer Szene: Lage (Matrix, Gier), Szenenlänge, Lesestellen (als u), Punktbahn und Bauteilboxen, alles in Szenenkoordinaten (lokal) bzw. Welt
export async function messen(pg, szene, schritte = 120) {
  return pg.evaluate(([sc, n]) => {
    const A = window.__seite, I = A.inst().find(q => q.name === sc), v0 = I.body.v0, v1 = I.body.v1, len = v1 - v0, T = A.total();
    const M = I.M4.elements.slice(), yaw = A.lay ? null : null;
    const isl = A.lay().isl[I.idx];
    const stops = A.stops().filter(s => s.scene === sc).map(s => { const mid = (s.p * T - v0) / len, w = s.hold / len; return { ki: s.ki, u0: mid - w / 2, u1: mid + w / 2, mid }; });
    const dot = []; for (let i = 0; i <= n; i++) { const u = -.1 + 1.2 * i / n, d = A.dot(v0 + u * len); dot.push({ u, p: d ? d.p : null, vis: d ? d.vis : null }); }
    const boxes = I.boxes.map(b => ({ min: b.min.toArray(), max: b.max.toArray() }));
    const rt = A.route(I.idx), st = rt ? rt.st.map(o => ({ p: o.p, d: +o.d.toFixed(2), how: o.how })) : [];
    const alle = A.inst().map(q => ({ name: q.name, v0: q.body.v0, v1: q.body.v1 }));
    return { alle, st, M, yaw: isl.yaw, v0, v1, T, stops, dot, boxes, rot: I.rot };
  }, [szene, schritte]);
}

// Punktposition (Welt) zu u einer Szene
export async function punktBei(pg, szene, u) {
  return pg.evaluate(([sc, u]) => { const A = window.__seite, I = A.inst().find(q => q.name === sc); const d = A.dot(I.body.v0 + u * (I.body.v1 - I.body.v0)); return d ? d.p : null; }, [szene, u]);
}

export async function foto(pg, szene, u, datei, warte = 1500) {
  await pg.evaluate(([sc, u]) => { const A = window.__seite, I = A.inst().find(q => q.name === sc); A.setP((I.body.v0 + u * (I.body.v1 - I.body.v0)) / A.total()); }, [szene, u]);
  // warten, bis die Kamera (gedämpft, in der Software-Darstellung langsam) steht
  await pg.waitForTimeout(warte);
  let alt = null;
  for (let i = 0; i < 40; i++) {
    const c = await pg.evaluate(() => window.__seite.camera.position.toArray());
    if (alt && Math.hypot(c[0] - alt[0], c[1] - alt[1], c[2] - alt[2]) < .004) break;
    alt = c; await pg.waitForTimeout(500);
  }
  await pg.screenshot({ path: path.join(OUT, datei) });
}
