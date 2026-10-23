// Browserwerkzeug des Neubaus (Node + playwright-core, nichts wird installiert; ein kurzer lokaler Server läuft nur während des Aufrufs).
//   node neubau/werkzeug/browser.mjs bilder   --ordner <ordner> --praefix <name> [--nur <szene>] [--p 0.15,0.4,0.7,0.95 | --g 0,40,66] [--ansicht breit|hochkant]
//   node neubau/werkzeug/browser.mjs pruefen  --szene neubau/szenen/modernisierung.json --nur modernisierung [--ordner <ordner>] [--praefix <name>]
//   node neubau/werkzeug/browser.mjs naht     [--ordner <ordner>]      Nahtmessung und Nahtbilder der ganzen Folge
//   node neubau/werkzeug/browser.mjs fps      [--nur <szene>]           Bildrate beim gleichmäßigen Scrollen
// bilder:  Bildschirmfotos der Seite an Fortschrittswerten p (0..1) oder globalen Bildern g, breit 1440x900 und hochkant 390x844.
//          --nur <szene>: nur diese Szene (index.html?nur=<szene>), sonst die ganze Folge.
// pruefen: Textprüfung im Browser an den Lesestellen (Text >= 16 px, unverdeckt, im Bild, auf der Fläche), Ergebnis als JSON (letzte Zeile).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const NEUBAU = path.dirname(HIER);

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const flag = n => process.argv.includes("--" + n);

function playwrightLaden() {
  const kandidaten = [
    process.env.PLAYWRIGHT_PFAD,
    path.join(NEUBAU, "node_modules"),
    path.join(NEUBAU, "..", "node_modules"),
    "C:/Andersen/Privat/Pa/node_modules",
    path.join(process.env.APPDATA || "", "npm", "node_modules", "@playwright", "test", "node_modules"),
    path.join(process.env.APPDATA || "", "npm", "node_modules"),
  ].filter(Boolean);
  for (const k of kandidaten) {
    try { return createRequire(path.join(k, "x.js"))("playwright-core"); } catch { /* weiter */ }
    try { return createRequire(path.join(k, "x.js"))("@playwright/test").chromium ? createRequire(path.join(k, "x.js"))("@playwright/test") : null; } catch { /* weiter */ }
  }
  throw new Error("playwright-core nicht gefunden (PLAYWRIGHT_PFAD auf einen node_modules-Ordner setzen)");
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".glb": "model/gltf-binary", ".ttf": "font/ttf", ".png": "image/png", ".css": "text/css" };
function server(wurzel) {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
    const f = path.join(wurzel, p);
    if (!f.startsWith(wurzel) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("nicht gefunden"); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => s.listen(0, "127.0.0.1", () => ok({ s, port: s.address().port })));
}

const ANSICHTEN = [
  ["breit", { width: 1440, height: 900 }, 1, false],
  ["hochkant", { width: 390, height: 844 }, 2, true],
];
const LAUNCH = { headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] };

async function starten(pw) {
  for (const channel of ["msedge", "chrome", undefined]) {
    try { return await pw.chromium.launch(channel ? { ...LAUNCH, channel } : LAUNCH); } catch { /* nächster Browser */ }
  }
  throw new Error("kein Chromium-Browser startbar");
}

const seitenUrl = (port, seite) => `http://127.0.0.1:${port}/${seite}${arg("nur") ? "?nur=" + arg("nur") : ""}`;

async function seiteOeffnen(browser, url, vp, dpr, mobil, logs) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobil, hasTouch: mobil });
  const page = await ctx.newPage();
  page.on("console", m => { if (["error", "warning"].includes(m.type())) logs.push(m.type() + ": " + m.text()); });
  page.on("pageerror", e => logs.push("pageerror: " + e.message));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.__neubau && window.__neubau.ladezeit, null, { timeout: 40000 });
  await page.evaluate(() => window.__neubau.fertig ? window.__neubau.fertig : true);   // Druck (Schriften, Texturen) abwarten
  return { ctx, page };
}

async function zuBild(page, f) {
  // Fortschritt per Scroll setzen (wie ein Nutzer), warten bis die Anzeige nachgezogen hat
  await page.evaluate(f => {
    const s = document.querySelector(".szene"), top = s.offsetTop, weg = s.offsetHeight - innerHeight, n = window.__neubau.bilder || 380;
    window.scrollTo(0, top + weg * f / n);
  }, f);
  await page.waitForFunction(f => Math.abs(window.__neubau.ziel - f) < .6, f, { timeout: 8000 });
  await page.waitForFunction(() => Math.abs(window.__neubau.bild - window.__neubau.ziel) < .01, null, { timeout: 30000 });
  await page.waitForTimeout(250);
}

async function bilder() {
  const ordner = path.resolve(arg("ordner", path.join(NEUBAU, "tmp", "browser"))); fs.mkdirSync(ordner, { recursive: true });
  const praefix = arg("praefix", "probe");
  const ps = arg("p", "0.15,0.4,0.7,0.95").split(",").map(Number);
  const wurzel = path.resolve(arg("wurzel", path.join(NEUBAU, "seite")));
  const seite = arg("seite", "index.html");
  const { s, port } = await server(wurzel);
  const pw = playwrightLaden(), browser = await starten(pw);
  const ergebnis = { dateien: [], logs: [] };
  try {
    for (const [name, vp, dpr, mobil] of ANSICHTEN) {
      if (arg("ansicht") && arg("ansicht") !== name) continue;
      const { ctx, page } = await seiteOeffnen(browser, seitenUrl(port, seite), vp, dpr, mobil, ergebnis.logs);
      const n = await page.evaluate(() => window.__neubau.bilder || 380);
      const gs = arg("g") ? arg("g").split(",").map(Number) : null;
      for (const p of (gs || ps)) {
        await zuBild(page, gs ? p : p * n);
        const datei = path.join(ordner, gs ? `${praefix}_${name}_g${String(p).padStart(4, "0")}.png` : `${praefix}_${name}_p${String(Math.round(p * 100)).padStart(3, "0")}.png`);
        await page.screenshot({ path: datei });
        ergebnis.dateien.push(datei);
      }
      await ctx.close();
    }
  } finally { await browser.close(); s.close(); }
  console.log(JSON.stringify(ergebnis));
}

async function pruefen() {
  const szeneDatei = path.resolve(arg("szene"));
  const szene = JSON.parse(fs.readFileSync(szeneDatei, "utf8"));
  const ordner = arg("ordner") ? path.resolve(arg("ordner")) : null; if (ordner) fs.mkdirSync(ordner, { recursive: true });
  const praefix = arg("praefix", "text");
  const wurzel = path.resolve(arg("wurzel", path.join(NEUBAU, "seite")));
  const { s, port } = await server(wurzel);
  const pw = playwrightLaden(), browser = await starten(pw);
  const min = szene.pruefung && szene.pruefung.min_em_px || 16;
  const bericht = { min_em_px_soll: min, ansichten: {}, fehler: [], logs: [] };
  try {
    for (const [name, vp, dpr, mobil] of ANSICHTEN) {
      const { ctx, page } = await seiteOeffnen(browser, seitenUrl(port, arg("seite", "index.html")), vp, dpr, mobil, bericht.logs);
      const a = bericht.ansichten[name] = { viewport: `${vp.width}x${vp.height}`, flaechen: {} };
      a.geladen = await page.evaluate(() => ({ schriften: [...document.fonts].filter(f => f.status === "loaded").map(f => f.family), glb_ms: Math.round(window.__neubau.ladezeit), druck_ms: Math.round(window.__neubau.druckzeit || 0) }));
      for (const [fname, fl] of Object.entries(szene.druckflaechen)) {
        if (fl.nur && fl.nur !== name) continue;           // Fläche gibt es nur in der anderen Anordnung
        const frames = (fl.pruefen && fl.pruefen.bilder) || [];
        const r = a.flaechen[fname] = { bilder: {} };
        for (const f of frames) {
          await zuBild(page, f);
          const e = await page.evaluate(([fn, f]) => window.__neubau.pruefeText(fn, f), [fname, f]);
          r.bilder[f] = e;
          const gut = e.zeilen > 0 && e.min_em_px >= min && e.verdeckt === 0 && e.ausserhalb === 0 && e.auf_flaeche && e.gezeichnet;
          if (!gut) bericht.fehler.push(`${name} ${fname} Bild ${f}: min ${e.min_em_px} px, verdeckt ${e.verdeckt}, ausserhalb ${e.ausserhalb}, auf Fläche ${e.auf_flaeche}, gezeichnet ${e.gezeichnet}`);
          if (ordner && f === frames[frames.length - 1]) await page.screenshot({ path: path.join(ordner, `${praefix}_${name}_${fname}_b${f}.png`) });
        }
      }
      await ctx.close();
    }
  } finally { await browser.close(); s.close(); }
  bericht.ok = bericht.fehler.length === 0 && !bericht.logs.some(l => l.startsWith("pageerror"));
  console.log(JSON.stringify(bericht));
  process.exitCode = bericht.ok ? 0 : 2;
}

async function naht() {
  const ordner = path.resolve(arg("ordner", path.join(NEUBAU, "tmp", "naht"))); fs.mkdirSync(ordner, { recursive: true });
  const wurzel = path.resolve(arg("wurzel", path.join(NEUBAU, "seite")));
  const { s, port } = await server(wurzel);
  const pw = playwrightLaden(), browser = await starten(pw);
  const bericht = { ok: true, fehler: [], logs: [], ansichten: {} };
  try {
    for (const [name, vp, dpr, mobil] of ANSICHTEN) {
      const { ctx, page } = await seiteOeffnen(browser, `http://127.0.0.1:${port}/index.html`, vp, dpr, mobil, bericht.logs);
      const nahte = await page.evaluate(() => window.__neubau.messeNaht());
      const abs = await page.evaluate(() => window.__neubau.abschnitte);
      bericht.ansichten[name] = { nahte, abschnitte: abs };
      // Bilder um jede Naht (zum Ansehen): 8 und 1 Bild davor, an der Naht, 1 und 8 danach
      for (const a of abs.slice(1)) {
        for (const d of [-8, -1, 0, 1, 8]) {
          const g = a.start + d;
          await zuBild(page, g);
          await page.screenshot({ path: path.join(ordner, `naht_${name}_${a.name}_g${String(g).padStart(4, "0")}.png`) });
        }
      }
      await ctx.close();
    }
  } finally { await browser.close(); s.close(); }
  bericht.fehler.push(...bericht.logs.filter(l => l.startsWith("pageerror")));
  console.log(JSON.stringify(bericht));
}

async function fpsMessen() {
  const wurzel = path.resolve(arg("wurzel", path.join(NEUBAU, "seite")));
  const { s, port } = await server(wurzel);
  const pw = playwrightLaden(), browser = await starten(pw);
  const out = { ansichten: {}, logs: [] };
  try {
    for (const [name, vp, dpr, mobil] of ANSICHTEN) {
      const { ctx, page } = await seiteOeffnen(browser, seitenUrl(port, "index.html"), vp, dpr, mobil, out.logs);
      const r = await page.evaluate(async () => {
        const sz = document.querySelector(".szene"), weg = sz.offsetHeight - innerHeight, n = window.__neubau.bilder;
        const zeiten = [];
        const t0 = performance.now();
        let last = t0;
        const dauer = 12000;
        await new Promise(ok => {
          const schritt = now => {
            const k = Math.min(1, (now - t0) / dauer);
            scrollTo(0, sz.offsetTop + weg * k);
            zeiten.push(now - last); last = now;
            if (k < 1) requestAnimationFrame(schritt); else ok();
          };
          requestAnimationFrame(schritt);
        });
        zeiten.shift();
        const sortiert = [...zeiten].sort((a, b) => a - b);
        const mittel = zeiten.reduce((a, b) => a + b, 0) / zeiten.length;
        return { rahmen: zeiten.length, fps_mittel: 1000 / mittel, fps_schlechteste_5_prozent: 1000 / sortiert[Math.floor(sortiert.length * .95)], laengster_rahmen_ms: sortiert.at(-1), bilder: n };
      });
      out.ansichten[name] = r;
      await ctx.close();
    }
  } finally { await browser.close(); s.close(); }
  console.log(JSON.stringify(out));
}

const befehl = process.argv[2];
(befehl === "bilder" ? bilder() : befehl === "pruefen" ? pruefen() : befehl === "naht" ? naht() : befehl === "fps" ? fpsMessen() : Promise.reject(new Error("Befehl: bilder | pruefen | naht | fps"))).catch(e => { console.error(e); process.exit(1); });
