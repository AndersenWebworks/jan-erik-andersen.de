// Bewegungsprüfung für scrollgesteuerte Webseiten-Animationen (Node + playwright-core, nichts wird installiert).
//   node neubau/werkzeug/bewegung.mjs --url <adresse> [--dauer 8] [--breite 1440 --hoehe 900] [--hochkant] [--naehte 0.3,0.62] [--ausgabe <ordner>]
//   node neubau/werkzeug/bewegung.mjs --verzeichnis <ordner> [--seite index.html] [--query "nur=x"] ...   (startet kurz einen lokalen Server und beendet ihn danach)
// Weitere Optionen:
//   --bereich 0,1        Teil der Scrollstrecke (0..1), der durchlaufen wird
//   --stoerung 150/500   Kontrolle: alle 500 ms ein Busy-Wait von 150 ms in der Seite (muss als FEHLER erkannt werden)
//   --naehte p,p,...     Scrollpositionen (0..1) für Kontaktbögen; ohne Angabe: Abschnittsgrenzen, größte Kamerasprünge, schlimmste Lücken
//   --max-naehte 6       Obergrenze der automatisch gewählten Nähte
//   --bilder 16          Bilder je Kontaktbogen (12..16 sinnvoll), --schritt 0.2 = Scrollschritt in Prozent der Strecke
//   --spalten 4          Spalten im Kontaktbogen,  --kachel 360 = Kachelbreite in Pixeln
//   --kamera-schritt 1   Abtastung des Kamerapfads in Bildnummern
//   --ohne-bogen / --ohne-kamera   Teile auslassen,   --sichtbar-egal  (kein Abbruch bei Softwarerenderer)
//   --kanal msedge|chrome|chromium
// Rückgabewert: 0 = OK, 1 = WARNUNG, 2 = FEHLER. Es werden nur Seiteninhalt-Screenshots über Playwright gemacht, nie der Bildschirm.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const NEUBAU = path.dirname(HIER);
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 && process.argv[i + 1] !== undefined && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d; };
const flag = n => process.argv.includes("--" + n);

// ---------- Schwellen ----------
const SCHWELLE = { medianOk: 17.5, p99Ok: 33, luecke1: 25, luecke2: 50, medianFehler: 33 };

function playwrightLaden() {
  const kandidaten = [process.env.PLAYWRIGHT_PFAD, path.join(NEUBAU, "node_modules"), path.join(NEUBAU, "..", "node_modules"), "C:/Andersen/Privat/Pa/node_modules",
    path.join(process.env.APPDATA || "", "npm", "node_modules", "@playwright", "test", "node_modules"), path.join(process.env.APPDATA || "", "npm", "node_modules")].filter(Boolean);
  for (const k of kandidaten) { try { return createRequire(path.join(k, "x.js"))("playwright-core"); } catch { /* weiter */ } }
  throw new Error("playwright-core nicht gefunden (PLAYWRIGHT_PFAD auf einen node_modules-Ordner setzen)");
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".glb": "model/gltf-binary", ".ttf": "font/ttf", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".css": "text/css", ".wasm": "application/wasm", ".mp4": "video/mp4" };
function server(wurzel) {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
    const f = path.resolve(path.join(wurzel, p));
    if (!f.startsWith(path.resolve(wurzel)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("nicht gefunden"); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => s.listen(0, "127.0.0.1", () => ok({ s, port: s.address().port })));
}

// Headed, mit GPU: kein --enable-unsafe-swiftshader, kein headless. Eigenes kleines Fenster.
async function starten(pw, breite, hoehe) {
  const args = ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--disable-features=CalculateNativeWinOcclusion",
    "--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows",
    "--window-position=30,30", `--window-size=${Math.min(breite, 1000) + 16},${Math.min(hoehe, 700) + 90}`];
  const wunsch = arg("kanal");
  for (const channel of wunsch ? [wunsch] : ["msedge", "chrome", undefined]) {
    try { return await pw.chromium.launch({ headless: false, args, ...(channel && channel !== "chromium" ? { channel } : {}) }); } catch { /* nächster */ }
  }
  throw new Error("kein sichtbarer Chromium-Browser startbar");
}

// ---------- Statistik ----------
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const perz = (a, q) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const r = (x, n = 2) => (x == null || !isFinite(x)) ? x : Math.round(x * 10 ** n) / 10 ** n;

function auswerten(lauf) {
  // lauf: { ts:[], p:[], bild:[], longtasks:[{start,dauer}] }  ts in ms. Die ersten 5 Bilder zählen nicht (Anlauf).
  const ab = 5, d = [], dp = [];
  for (let i = ab + 1; i < lauf.ts.length; i++) { d.push(lauf.ts[i] - lauf.ts[i - 1]); dp.push(lauf.p[i]); }
  const luecken = [];
  d.forEach((x, i) => { if (x > SCHWELLE.luecke1) luecken.push({ ms: r(x, 1), p: r(dp[i], 4), bild: lauf.bild[ab + 1 + i] != null ? r(lauf.bild[ab + 1 + i], 1) : null, schwer: x > SCHWELLE.luecke2 }); });
  const lt = lauf.longtasks.map(t => {
    let k = 0; for (let i = 0; i < lauf.ts.length; i++) if (lauf.ts[i] >= t.start) { k = i; break; }
    return { start_ms: r(t.start - lauf.ts[0], 1), dauer_ms: r(t.dauer, 1), p: r(lauf.p[k] ?? 0, 4) };
  });
  return {
    frames: d.length, dauer_s: r((lauf.ts.at(-1) - lauf.ts[ab]) / 1000, 2), fps_mittel: r(1000 / (d.reduce((a, b) => a + b, 0) / Math.max(1, d.length)), 1),
    median_ms: r(median(d), 2), p95_ms: r(perz(d, .95), 2), p99_ms: r(perz(d, .99), 2), max_ms: r(Math.max(0, ...d), 1),
    luecken_ueber_25ms: luecken.length, luecken_ueber_50ms: luecken.filter(l => l.schwer).length,
    schlimmste_luecken: [...luecken].sort((a, b) => b.ms - a.ms).slice(0, 12), long_tasks: lt.length, long_tasks_liste: lt.sort((a, b) => b.dauer_ms - a.dauer_ms).slice(0, 12),
  };
}
function urteilLauf(m) {
  const g = [];
  let stufe = 0;
  if (m.luecken_ueber_50ms > 0) { stufe = 2; g.push(`${m.luecken_ueber_50ms} Lücken > ${SCHWELLE.luecke2} ms (längste ${m.max_ms} ms)`); }
  if (m.median_ms > SCHWELLE.medianFehler) { stufe = 2; g.push(`Median ${m.median_ms} ms (> ${SCHWELLE.medianFehler})`); }
  else if (m.median_ms > SCHWELLE.medianOk) { stufe = Math.max(stufe, 1); g.push(`Median ${m.median_ms} ms (> ${SCHWELLE.medianOk})`); }
  if (m.p99_ms > SCHWELLE.p99Ok) { stufe = Math.max(stufe, 1); g.push(`p99 ${m.p99_ms} ms (> ${SCHWELLE.p99Ok})`); }
  return { stufe, gruende: g };
}
const STUFE = ["OK", "WARNUNG", "FEHLER"];

// ---------- Kamerapfad ----------
function kameraAuswerten(proben) {
  // proben: [{g, ort:[3], q:[4], rollen_grad}] je Bildnummer g. Alles pro Bildnummer, unabhängig von der Bildrate des Browsers.
  const n = proben.length, v = [], w = [], rollTempo = [];
  const angle = (a, b) => { const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); return 2 * Math.acos(Math.min(1, d)) * 180 / Math.PI; };
  for (let i = 1; i < n; i++) {
    const a = proben[i - 1], b = proben[i];
    v.push(Math.hypot(b.ort[0] - a.ort[0], b.ort[1] - a.ort[1], b.ort[2] - a.ort[2]) / (b.g - a.g));
    w.push(angle(a.q, b.q) / (b.g - a.g));
    rollTempo.push((b.rollen_grad - a.rollen_grad) / (b.g - a.g));
  }
  const abl = x => x.slice(1).map((e, i) => e - x[i]);
  const mv = median(v), mw = median(w);
  const ausreisser = [];
  const pos = i => proben[i + 1].g;
  const melden = (art, i, wert, schwelle, einheit) => ausreisser.push({ art, bild: r(pos(i), 1), wert: r(wert, 4), schwelle: r(schwelle, 4), einheit });
  // Tempo-Sprung: Tempoänderung von Bild zu Bild im Verhältnis zum größten Tempo in der Umgebung (±12 Bilder). Bewegungen bestehen meist aus
  // Fahrt und Ruhe, daher kein globaler Median. Weich beschleunigte Fahrten ändern das Tempo je Bild nur um wenige Prozent der Spitze.
  const sprung = (x, med, name, einheit) => {
    const gmax = Math.max(...x, 1e-9), FENSTER = 12, ANTEIL = 0.35;
    for (let i = 1; i < x.length; i++) {
      const dx = Math.abs(x[i] - x[i - 1]);
      let lokal = 0; for (let k = Math.max(0, i - FENSTER); k <= Math.min(x.length - 1, i + FENSTER); k++) lokal = Math.max(lokal, x[k]);
      const lim = Math.max(lokal * ANTEIL, gmax * 0.02);
      if (dx > lim) melden(`${name}-sprung`, i, dx, lim, einheit);
    }
  };
  sprung(v, mv, "tempo", "Einheiten/Bild"); sprung(w, mw, "dreh", "Grad/Bild");
  const rollGrenze = Math.max(0.15, 6 * median(rollTempo.map(Math.abs)));
  rollTempo.forEach((x, i) => { if (Math.abs(x) > rollGrenze) melden("roll-schritt", i, x, rollGrenze, "Grad/Bild"); });
  const maxRoll = Math.max(0, ...proben.map(p => Math.abs(p.rollen_grad)));
  const beschl = abl(v), ruck = abl(beschl), wbeschl = abl(w), wruck = abl(wbeschl);
  const mx = a => Math.max(0, ...a.map(Math.abs));
  const gruppiert = [];   // benachbarte Meldungen (<= 3 Bilder) zusammenfassen
  for (const o of ausreisser.sort((a, b) => a.bild - b.bild)) {
    const l = gruppiert.at(-1);
    if (l && l.art === o.art && o.bild - l.bild_ende <= 3) { l.bild_ende = o.bild; if (o.wert > l.wert) l.wert = o.wert; l.anzahl++; } else gruppiert.push({ ...o, bild_ende: o.bild, anzahl: 1 });
  }
  const spitzen = (x, mal) => x.map((e, i) => [Math.abs(e), i]).sort((a, b) => b[0] - a[0]).slice(0, mal).map(([e, i]) => ({ bild: r(pos(i), 1), wert: r(e, 4) }));
  return {
    proben: n, bilder_von: proben[0].g, bilder_bis: proben.at(-1).g,
    tempo: { median: r(mv, 5), max: r(mx(v), 5), einheit: "Weltenheiten/Bild" }, drehtempo: { median: r(mw, 4), max: r(mx(w), 4), einheit: "Grad/Bild" },
    beschleunigung_max: r(mx(beschl), 5), ruck_max: r(mx(ruck), 5), dreh_beschleunigung_max: r(mx(wbeschl), 4), dreh_ruck_max: r(mx(wruck), 4),
    rollwinkel: { max_abs_grad: r(maxRoll, 2), bereich_grad: [r(Math.min(...proben.map(p => p.rollen_grad)), 2), r(Math.max(...proben.map(p => p.rollen_grad)), 2)] },
    groesste_tempospruenge: spitzen(beschl, 5), groesste_dreh_spruenge: spitzen(wbeschl, 5),
    ausreisser: gruppiert.slice(0, 40), ausreisser_gesamt: gruppiert.length,
    // Schrittweite je Bildnummer für die Nahtwahl
    schritt: v.map((x, i) => ({ bild: pos(i), s: (mv > 0 ? x / mv : 0) + (mw > 0 ? w[i] / mw : 0) })),
  };
}

// ---------- Messlauf in der Seite ----------
const LAUF_IM_BROWSER = async ({ von, bis, dauer, rueckwaerts, stoerung }) => {
  const doc = document.scrollingElement, weg = () => doc.scrollHeight - innerHeight;
  const W = weg(), a = von * W, b = bis * W, start = rueckwaerts ? b : a, ende = rueckwaerts ? a : b;
  const ist = () => (window.__neubau && typeof window.__neubau.bild === "number") ? window.__neubau.bild : null;
  // Ausgangspunkt anfahren und beruhigen lassen
  scrollTo(0, start);
  await new Promise(ok => setTimeout(ok, 300));
  for (let i = 0; i < 120; i++) { if (!window.__neubau || Math.abs(window.__neubau.bild - window.__neubau.ziel) < .01) break; await new Promise(ok => setTimeout(ok, 50)); }
  const lt = [];
  const po = new PerformanceObserver(l => { for (const e of l.getEntries()) lt.push({ start: e.startTime, dauer: e.duration }); });
  try { po.observe({ type: "longtask", buffered: false }); } catch { /* nicht unterstützt */ }
  let timer = null;
  if (stoerung) timer = setInterval(() => { const e = performance.now(); while (performance.now() - e < stoerung.laenge); }, stoerung.abstand);
  const ts = [], p = [], bild = [];
  await new Promise(ok => {
    let t0 = null;
    const schritt = now => {
      if (t0 === null) t0 = now;
      const k = Math.min(1, (now - t0) / dauer), y = start + (ende - start) * k;
      scrollTo(0, y);
      ts.push(now); p.push(W > 0 ? y / W : 0); bild.push(ist());
      if (k < 1) requestAnimationFrame(schritt); else ok();
    };
    requestAnimationFrame(schritt);
  });
  if (timer) clearInterval(timer);
  await new Promise(ok => setTimeout(ok, 100));
  po.disconnect();
  return { ts, p, bild, longtasks: lt };
};

// ---------- Kontaktbogen ----------
async function bogenSetzen(ctx, kacheln, opt, datei) {
  const seite = await ctx.newPage();
  await seite.setContent("<body style='margin:0;background:#111'><canvas id=c></canvas></body>");
  const b64 = await seite.evaluate(async ({ kacheln, opt }) => {
    const bilder = await Promise.all(kacheln.map(k => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = "data:image/png;base64," + k.png; })));
    const kw = opt.kachel, kh = Math.round(kw * bilder[0].height / bilder[0].width), rand = 6, kopf = 22, titel = 30;
    const sp = Math.min(opt.spalten, bilder.length), zeilen = Math.ceil(bilder.length / sp);
    const c = document.getElementById("c"); c.width = sp * (kw + rand) + rand; c.height = titel + zeilen * (kh + kopf + rand) + rand;
    const x = c.getContext("2d"); x.fillStyle = "#111"; x.fillRect(0, 0, c.width, c.height);
    x.font = "600 16px system-ui, Segoe UI, sans-serif"; x.fillStyle = "#fff"; x.textBaseline = "middle"; x.fillText(opt.titel, rand + 2, titel / 2 + 2);
    bilder.forEach((im, i) => {
      const cx = rand + (i % sp) * (kw + rand), cy = titel + Math.floor(i / sp) * (kh + kopf + rand);
      x.imageSmoothingQuality = "high"; x.drawImage(im, cx, cy + kopf, kw, kh);
      x.fillStyle = kacheln[i].mitte ? "#d40235" : "#2a2a2a"; x.fillRect(cx, cy, kw, kopf);
      x.fillStyle = "#fff"; x.font = "12px ui-monospace, Consolas, monospace"; x.fillText(`${String(i + 1).padStart(2, "0")}  ${kacheln[i].text}`, cx + 5, cy + kopf / 2 + 1);
    });
    return c.toDataURL("image/png").split(",")[1];
  }, { kacheln, opt });
  await seite.close();
  fs.writeFileSync(datei, Buffer.from(b64, "base64"));
}

async function bogenAufnehmen(page, ctx, p, nr, ausgabe, vp, hatBild) {
  const anzahl = Math.max(4, parseInt(arg("bilder", "16"), 10)), schrittAnteil = parseFloat(arg("schritt", "0.2")) / 100;
  const info = await page.evaluate(() => ({ W: document.scrollingElement.scrollHeight - innerHeight, n: window.__neubau && window.__neubau.bilder }));
  const kacheln = [];
  const mitteIdx = Math.floor(anzahl / 2);
  for (let i = 0; i < anzahl; i++) {
    const pp = Math.min(1, Math.max(0, p + (i - mitteIdx) * schrittAnteil));
    await page.evaluate(y => scrollTo(0, y), pp * info.W);
    if (hatBild) { try { await page.waitForFunction(() => Math.abs(window.__neubau.bild - window.__neubau.ziel) < .01, null, { timeout: i === 0 ? 8000 : 2500 }); } catch { /* weiter */ } }
    await page.evaluate(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok))));
    await page.waitForTimeout(60);
    const bildnr = await page.evaluate(() => window.__neubau && typeof window.__neubau.bild === "number" ? window.__neubau.bild : null);
    const png = (await page.screenshot({ type: "png", scale: "css" })).toString("base64");
    kacheln.push({ png, mitte: i === mitteIdx, text: `p=${pp.toFixed(4)}${bildnr != null ? "  b=" + bildnr.toFixed(1) : ""}` });
  }
  const datei = path.join(ausgabe, `kontaktbogen_${String(nr).padStart(2, "0")}_p${p.toFixed(3)}.png`);
  await bogenSetzen(ctx, kacheln, { kachel: parseInt(arg("kachel", vp.width < vp.height ? "190" : "360"), 10), spalten: parseInt(arg("spalten", vp.width < vp.height ? "8" : "4"), 10), titel: `Naht ${nr}: Scrollposition p=${p.toFixed(3)} (rot = Mitte), Schritt ${(schrittAnteil * 100).toFixed(2)} % der Strecke, ${vp.width}x${vp.height}` }, datei);
  return datei;
}

// ---------- Hauptablauf ----------
async function main() {
  const dauer = parseFloat(arg("dauer", "8")) * 1000;
  const hoch = flag("hochkant");
  const breite = parseInt(arg("breite", hoch ? "390" : "1440"), 10), hoehe = parseInt(arg("hoehe", hoch ? "844" : "900"), 10);
  const dpr = parseFloat(arg("dpr", hoch ? "2" : "1"));
  const [von, bis] = arg("bereich", "0,1").split(",").map(Number);
  const stz = arg("stoerung") ? arg("stoerung").split("/").map(Number) : null;
  const stoerung = stz ? { laenge: stz[0], abstand: stz[1] || 500 } : null;
  const ausgabe = path.resolve(arg("ausgabe", path.join(NEUBAU, "tmp", "bewegung", "lauf-" + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19))));
  fs.mkdirSync(ausgabe, { recursive: true });

  let srv = null, url = arg("url");
  if (!url) {
    const wurzel = arg("verzeichnis"); if (!wurzel) throw new Error("--url <adresse> oder --verzeichnis <ordner> angeben");
    srv = await server(path.resolve(wurzel));
    url = `http://127.0.0.1:${srv.port}/${arg("seite", "index.html")}${arg("query") ? "?" + arg("query") : ""}`;
  }
  const pw = playwrightLaden(), browser = await starten(pw, breite, hoehe);
  const bericht = { url, zeit: new Date().toISOString(), ansicht: { breite, hoehe, dpr, hochkant: hoch }, dauer_s: dauer / 1000, bereich: [von, bis], stoerung, schwellen: SCHWELLE, logs: [], warnungen: [] };
  try {
    const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: dpr, isMobile: hoch, hasTouch: hoch });
    const page = await ctx.newPage();
    page.on("console", m => { if (["error", "warning"].includes(m.type())) bericht.logs.push(m.type() + ": " + m.text()); });
    page.on("pageerror", e => bericht.logs.push("pageerror: " + e.message));
    await page.goto(url, { waitUntil: "load" });
    if (await page.evaluate(() => !!window.__neubau || !!document.querySelector(".szene")).catch(() => false)) {
      try { await page.waitForFunction(() => document.documentElement.classList.contains("bereit") || document.documentElement.classList.contains("ohne-3d") || (window.__neubau && window.__neubau.ladezeit), null, { timeout: 60000 }); } catch { bericht.warnungen.push("Seite meldet nicht 'bereit' (60 s)"); }
    }
    await page.waitForTimeout(800);

    // GPU-Befund
    bericht.gpu = await page.evaluate(() => {
      const c = document.createElement("canvas"), gl = c.getContext("webgl2") || c.getContext("webgl");
      if (!gl) return { webgl: false };
      const e = gl.getExtension("WEBGL_debug_renderer_info");
      const o = { webgl: true, version: gl.getParameter(gl.VERSION), renderer: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), anbieter: e ? gl.getParameter(e.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR) };
      o.software = /swiftshader|llvmpipe|software|basic render|softpipe/i.test(o.renderer + " " + o.anbieter);
      return o;
    });
    if (!bericht.gpu.webgl) bericht.warnungen.push("WebGL nicht verfügbar");
    else if (bericht.gpu.software) bericht.warnungen.push(`SOFTWARERENDERER (${bericht.gpu.renderer}): Bildraten sind nicht aussagekräftig. Sichtbares Fenster mit echter GPU nötig.`);
    bericht.seite = await page.evaluate(() => ({ titel: document.title, scrollhoehe: document.scrollingElement.scrollHeight, fensterhoehe: innerHeight, neubau: !!window.__neubau, bilder: window.__neubau ? window.__neubau.bilder : null, abschnitte: window.__neubau ? window.__neubau.abschnitte : null, sichtbar: document.visibilityState }));
    if (bericht.seite.sichtbar !== "visible") bericht.warnungen.push("Seite nicht sichtbar (visibilityState=" + bericht.seite.sichtbar + "): rAF wird gedrosselt");
    if (bericht.seite.scrollhoehe - bericht.seite.fensterhoehe < 100) { bericht.warnungen.push("Seite ist kaum scrollbar, Messung wertlos (Folge/Szene geladen? --query nur=<szene>)"); bericht.unbrauchbar = true; }

    // Messläufe
    bericht.laeufe = {}; const reihen = {};
    for (const [name, rueck] of [["vorwaerts", false], ["rueckwaerts", true]]) {
      const lauf = await page.evaluate(LAUF_IM_BROWSER, { von, bis, dauer, rueckwaerts: rueck, stoerung });
      reihen[name] = lauf;
      const m = auswerten(lauf), u = urteilLauf(m);
      bericht.laeufe[name] = { urteil: STUFE[u.stufe], gruende: u.gruende, ...m };
    }
    fs.writeFileSync(path.join(ausgabe, "zeitreihen.json"), JSON.stringify(Object.fromEntries(Object.entries(reihen).map(([k, v]) => [k, { ts_ms: v.ts.map(x => r(x, 2)), p: v.p.map(x => r(x, 5)), bild: v.bild.map(x => x == null ? null : r(x, 3)), longtasks: v.longtasks }]))));

    // Kamerapfad (nur wenn die Seite die Schnittstelle window.__neubau.posen/abschnitte anbietet)
    bericht.kamera = null; let kameraAnalyse = null;
    if (!flag("ohne-kamera") && bericht.seite.neubau && bericht.seite.bilder) {
      const schritt = parseFloat(arg("kamera-schritt", "1"));
      const proben = await page.evaluate(({ schritt }) => {
        const nb = window.__neubau, ab = nb.abschnitte, out = [];
        if (typeof nb.posen !== "function") return null;
        for (let g = 0; g <= nb.bilder; g += schritt) {
          let i = 0; for (let k = ab.length - 1; k >= 0; k--) if (g >= ab[k].start && (g < ab[k].start + ab[k].frames || k === ab.length - 1)) { i = k; break; }
          const A = ab[i], f = Math.min(A.frames, Math.max(0, g - A.start)), p = nb.posen(A.name, f);
          out.push({ g, ort: p.ort, q: p.q, rollen_grad: p.rollen_grad });
        }
        return out;
      }, { schritt });
      if (proben && proben.length > 5) { kameraAnalyse = kameraAuswerten(proben); const { schritt: _s, ...rest } = kameraAnalyse; bericht.kamera = rest; fs.writeFileSync(path.join(ausgabe, "kamerapfad.json"), JSON.stringify(proben.map(p => ({ g: p.g, ort: p.ort.map(x => r(x, 4)), q: p.q.map(x => r(x, 5)), rollen_grad: r(p.rollen_grad, 3) })))); }
      else bericht.warnungen.push("Kamera: window.__neubau.posen nicht verfügbar, siehe README (Schnittstelle)");
    } else if (!flag("ohne-kamera")) bericht.kamera = { hinweis: "Seite bietet keine Kameraschnittstelle (window.__neubau.posen/abschnitte/bilder); siehe README" };

    // Nähte wählen
    const gesamt = bericht.seite.bilder;
    let naehte = arg("naehte") ? arg("naehte").split(",").map(Number).map(p => ({ p, grund: "angegeben" })) : [];
    if (!arg("naehte") && !flag("ohne-bogen")) {
      const max = parseInt(arg("max-naehte", "6"), 10), roh = [];
      if (gesamt && bericht.seite.abschnitte) for (const a of bericht.seite.abschnitte.slice(1)) roh.push({ p: a.start / gesamt, grund: `Abschnittsgrenze ${a.name}`, prio: 0 });
      if (kameraAnalyse && gesamt) {
        const s = [...kameraAnalyse.schritt].sort((a, b) => b.s - a.s);
        let k = 0; for (const e of s) { if (k >= 3) break; if (!roh.some(x => Math.abs(x.p - e.bild / gesamt) < 30 / gesamt)) { roh.push({ p: e.bild / gesamt, grund: `größte Kameradifferenz (Bild ${r(e.bild, 0)})`, prio: 1 }); k++; } }
        for (const o of kameraAnalyse.ausreisser.slice(0, 2)) if (!roh.some(x => Math.abs(x.p - o.bild / gesamt) < 30 / gesamt)) roh.push({ p: o.bild / gesamt, grund: `Kamera-Ausreißer ${o.art} (Bild ${o.bild})`, prio: 1 });
      }
      for (const l of [...bericht.laeufe.vorwaerts.schlimmste_luecken.slice(0, 2), ...bericht.laeufe.rueckwaerts.schlimmste_luecken.slice(0, 1)]) if (!roh.some(x => Math.abs(x.p - l.p) < 0.02)) roh.push({ p: l.p, grund: `längste Lücke ${l.ms} ms`, prio: 2 });
      if (!roh.length) for (const p of [0.25, 0.5, 0.75]) roh.push({ p, grund: "gleichmäßig verteilt", prio: 3 });
      naehte = roh.sort((a, b) => a.prio - b.prio).slice(0, max).sort((a, b) => a.p - b.p);
    }
    bericht.kontaktbogen = [];
    if (!flag("ohne-bogen")) {
      let nr = 1;
      for (const n of naehte) {
        const datei = await bogenAufnehmen(page, ctx, Math.min(1, Math.max(0, n.p)), nr++, ausgabe, { width: breite, height: hoehe }, !!bericht.seite.neubau);
        bericht.kontaktbogen.push({ p: r(n.p, 4), grund: n.grund, datei });
      }
    }
    await ctx.close();
  } finally { await browser.close(); if (srv) srv.s.close(); }

  // Gesamturteil
  let stufe = Math.max(...Object.values(bericht.laeufe).map(l => STUFE.indexOf(l.urteil)));
  if (bericht.gpu && (bericht.gpu.software || !bericht.gpu.webgl) && bericht.seite.neubau) stufe = Math.max(stufe, 1);
  if (bericht.kamera && bericht.kamera.ausreisser_gesamt > 0) stufe = Math.max(stufe, 1);
  if (bericht.unbrauchbar || bericht.logs.some(l => l.startsWith("pageerror"))) stufe = Math.max(stufe, 1);
  bericht.urteil = STUFE[stufe];
  fs.writeFileSync(path.join(ausgabe, "bericht.json"), JSON.stringify(bericht, null, 1));

  // Konsole
  const L = [];
  L.push(`Bewegungsprüfung  ${url}`);
  L.push(`Ansicht ${breite}x${hoehe} @${dpr}x, ${dauer / 1000} s je Lauf${stoerung ? `, STÖRUNG ${stoerung.laenge} ms alle ${stoerung.abstand} ms` : ""}`);
  L.push(`GPU: ${bericht.gpu.webgl ? `${bericht.gpu.renderer} (${bericht.gpu.software ? "SOFTWARE" : "Hardware"})` : "kein WebGL"}`);
  for (const w of bericht.warnungen) L.push(`WARNUNG  ${w}`);
  for (const [n, m] of Object.entries(bericht.laeufe)) {
    L.push(`${m.urteil.padEnd(8)} ${n.padEnd(11)} ${m.fps_mittel} fps | Median ${m.median_ms} ms | p95 ${m.p95_ms} | p99 ${m.p99_ms} | max ${m.max_ms} ms | Lücken >25: ${m.luecken_ueber_25ms}, >50: ${m.luecken_ueber_50ms} | Long Tasks ${m.long_tasks}${m.gruende.length ? "  <- " + m.gruende.join("; ") : ""}`);
    for (const l of m.schlimmste_luecken.slice(0, 3)) L.push(`           Lücke ${l.ms} ms bei p=${l.p}${l.bild != null ? " (Bild " + l.bild + ")" : ""}`);
  }
  if (bericht.kamera && bericht.kamera.proben) {
    const k = bericht.kamera;
    L.push(`Kamera: Tempo Median ${k.tempo.median}/Bild, max ${k.tempo.max} | Dreh max ${k.drehtempo.max} °/Bild | Rollwinkel max ${k.rollwinkel.max_abs_grad}° | Ausreißer: ${k.ausreisser_gesamt}`);
    for (const o of k.ausreisser.slice(0, 5)) L.push(`           ${o.art} bei Bild ${o.bild}${o.bild_ende !== o.bild ? "-" + o.bild_ende : ""}: ${o.wert} ${o.einheit} (Grenze ${o.schwelle})`);
  } else if (bericht.kamera) L.push("Kamera: " + bericht.kamera.hinweis);
  for (const k of bericht.kontaktbogen) L.push(`Kontaktbogen p=${k.p} (${k.grund}): ${k.datei}`);
  const e = bericht.logs.filter(l => l.startsWith("pageerror")); for (const x of e) L.push("Seitenfehler: " + x);
  L.push(`GESAMT: ${bericht.urteil}   Bericht: ${path.join(ausgabe, "bericht.json")}`);
  console.log(L.join("\n"));
  process.exitCode = stufe;
}

main().catch(e => { console.error(e); process.exit(3); });
