// Beats → Route + Kamera-Stützstellen + Probebilder.   Aufruf (im Seitenordner):
//   node werkzeug/kamera-bauen.mjs [szene,szene|alle] [--tag nachher] [--ohne-fotos] [--nur-fotos]
// Eine Korrektur = eine Zeile in werkzeug/beats/<szene>.mjs, danach dieser Befehl. Bilder: _pruefung/motiv/<tag>-<szene>-<nr>-<motiv>-<d|n>.png
// Aufteilung: kamera-kern.mjs (nur Zahlen, wiederverwendbar), seite-anbindung.mjs (Server, Browser, Messen), diese Datei (Seitenregeln: Beats lesen, kamera/*.js und kamera/routen.js schreiben).
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { stuetzstellen } from "./kamera-kern.mjs";
import { oeffnen, messen, foto, FORMATE, SEITE } from "./seite-anbindung.mjs";

const args = process.argv.slice(2), flag = n => args.includes(n), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--tag" && args[i - 1] !== "--modus");
const MODI = opt("--modus", "dn").split("");
const BEATDIR = path.join(SEITE, "werkzeug/beats"), tag = opt("--tag", "nachher");
const namen = (pos[0] && pos[0] !== "alle") ? pos[0].split(",") : fs.readdirSync(BEATDIR).filter(f => f.endsWith(".mjs")).map(f => f.replace(/\.mjs$/, ""));
const beatsVon = {};
for (const n of namen) beatsVon[n] = (await import(pathToFileURL(path.join(BEATDIR, n + ".mjs")).href + "?t=" + Date.now())).default;

// ---- Rahmen: Szenenkoordinaten → Welt → (rechts, hoch, voraus) der Szene
const rahmenVon = m => {
  const e = m.M, c = Math.cos(m.yaw), s = Math.sin(m.yaw);
  const welt = P => [e[0] * P[0] + e[4] * P[1] + e[8] * P[2] + e[12], e[1] * P[0] + e[5] * P[1] + e[9] * P[2] + e[13], e[2] * P[0] + e[6] * P[1] + e[10] * P[2] + e[14]];
  const rahW = W => [W[0] * c + W[2] * s, W[1], W[0] * s - W[2] * c];
  return { welt, lok: P => rahW(welt(P)), rahW };
};
const ecken = b => { const o = []; for (const x of [b[0][0], b[1][0]]) for (const y of [b[0][1], b[1][1]]) for (const z of [b[0][2], b[1][2]]) o.push([x, y, z]); return o; };

// ---- 1. Route schreiben (kamera/routen.js, von stationen.js über die Grundwerte gemischt)
function routenSchreiben() {
  const datei = path.join(SEITE, "kamera/routen.js");
  const alt = fs.existsSync(datei) ? fs.readFileSync(datei, "utf8") : "";
  const bisher = alt.includes("ROUTEN") ? JSON.parse(alt.slice(alt.indexOf("= ") + 2, alt.lastIndexOf(";"))) : {};
  for (const n of namen) {
    const B = beatsVon[n], stops = {}, way = { d: [...((B.weg && B.weg.d) || B.weg || [])], n: [...((B.weg && B.weg.n) || B.weg || [])] };
    for (const b of B.beats) if (b.stop !== undefined && b.punkt) { const ort = m => ({ near: punktIn(b, m), ...(b.fest ? { at: punktIn(b, m) } : {}), ...(b.nearR ? { nearR: b.nearR } : {}) }); stops[b.stop] = { d: ort("d"), n: ort("n") }; }   // near gewinnt in kern.js vor at, überschreibt so auch Grundwerte aus stationen.js; fest: true setzt zusätzlich at
    // Beats ohne Lesestelle: Wegpunkt nach der zuletzt davor liegenden Lesestelle
    let zuletzt = 0;
    for (const b of B.beats) if (b.stop !== undefined) zuletzt = b.stop; else if (b.punkt) for (const m of ["d", "n"]) way[m].push([...punktIn(b, m), zuletzt, b.gewicht || 8]);
    const r = {};
    if (Object.keys(stops).length) r.stops = stops;
    if (way.d.length || B.faden) r.faden = { ...(B.faden || {}), ...(way.d.length ? { way } : {}) };
    bisher[n] = r;
  }
  const zeilen = Object.keys(bisher).map(k => ` ${JSON.stringify(k)}: ${JSON.stringify(bisher[k])}`).join(",\n");
  fs.writeFileSync(datei, "// ERZEUGT von werkzeug/kamera-bauen.mjs aus werkzeug/beats/*.mjs, nicht von Hand ändern.\n// Route des Punktes je Szene (Lesestelle Nr. -> Wunschlage near [x, z]; Wegpunkte faden.way [x, z, nach-k-Lesestellen, Gewicht]); stationen.js mischt sie über die Grundwerte.\nexport const ROUTEN = {\n" + zeilen + "\n};\n");
}

// Motive eines Beats für ein Bildformat: Name, Liste oder { d: ..., n: ... }
const zeigtIn = (b, m) => { const z = b.zeigt && !Array.isArray(b.zeigt) && typeof b.zeigt === "object" ? b.zeigt[m] : b.zeigt; return Array.isArray(z) ? z : [z]; };
// Punkt eines Beats für ein Bildformat: [x, z] oder { d: [x, z], n: [x, z] }
const punktIn = (b, m) => Array.isArray(b.punkt) ? b.punkt : b.punkt[m];

// Wert je Bildformat: Zahl bzw. Liste oder { d: ..., n: ... }
const proM = (v, m) => v && !Array.isArray(v) && typeof v === "object" ? v[m] : v;
// Zeitfenster eines Beats: u von Hand | Lesestelle (stop; ohne Haltefenster ±halb, nach = Verlängerung) | Bauzustand (bei: b, nur Szenen mit Aufbau wie die Eröffnung) | nächste Annäherung des Punktes an punkt
function fensterVon(b, stops, dots, R, n, m, bAuf = []) {
  const u = proM(b.u, m), hw0 = proM(b.halb, m);
  if (u) return u;
  if (b.stop !== undefined) {
    const s = stops[b.stop - 1]; if (!s) throw new Error(`${n}: Lesestelle ${b.stop} gibt es nicht (${stops.length})`);
    let a = s.u0, e = s.u1;
    if (e - a < .004) { const hw = hw0 || .015; a -= hw; e += hw; }   // Lesestelle ohne Haltefenster (Eröffnung: Schlüsselfahrt)
    return [a, e + (proM(b.nach, m) || 0)];
  }
  const bei = proM(b.bei, m);
  if (bei !== undefined) {
    const i = bAuf.findIndex(q => q.b >= bei); if (i < 1) throw new Error(`${n}: Bauzustand ${bei} wird nicht erreicht`);
    const p = bAuf[i - 1], q = bAuf[i], uc = p.u + (q.u - p.u) * (bei - p.b) / Math.max(1e-9, q.b - p.b), hw = hw0 || .013;
    return [uc - hw, uc + hw];
  }
  const pp = punktIn(b, m), P = R.lok([pp[0], 0, pp[1]]); let best = 1e9, bu = .5;
  for (const d of dots) { if (d.u < 0 || d.u > 1) continue; const dd = Math.hypot(d.p[0] - P[0], d.p[2] - P[2]); if (dd < best) { best = dd; bu = d.u; } }
  const hw = hw0 || .035; return [bu - hw, bu + hw];
}

// ---- 2. Kamera rechnen (je Bildformat eine Messung der Seite)
const kameras = {}, berichte = [];
async function rechnen(o, m) {
  const pg = await o.seite(m), fmt = FORMATE[m];
  for (const n of namen) {
    const B = beatsVon[n], me = await messen(pg, n, 240), R = rahmenVon(me);
    console.log(`${n} ${m} Stationen (Abstand des Laufs zur Station, Weise): ` + me.st.map((o, i) => `${i + 1}: ${o.d} ${o.how}`).join(" | "));
    const dots = me.dot.filter(d => d.p).map(d => ({ u: d.u, p: R.rahW(d.p) }));
    const punktBei = u => { let i = 0; while (i < dots.length - 2 && dots[i + 1].u < u) i++; const a = dots[i], b = dots[i + 1], t = Math.max(0, Math.min(1, (u - a.u) / (b.u - a.u))); return a.p.map((v, k) => v + (b.p[k] - v) * t); };
    const stops = me.stops.slice().sort((a, b) => a.u0 - b.u0);
    const beats = B.beats.map(b => {
      const z = zeigtIn(b, m), pts = [];
      let text = 0;
      for (const k of z) { const MO = B.motive.d ? B.motive[m] : B.motive, mo = MO[k]; if (!mo) throw new Error(`${n}: Motiv "${k}" fehlt`); pts.push(...ecken(mo.box).map(R.lok)); text = Math.max(text, mo.text || 0); }
      const bl = b.blick || {}, ba = bl[m] || bl, bb = B.blick || {}, bm = bb[m] || bb;
      return { name: z.join("+"), punkte: pts, u: fensterVon(b, stops, dots, R, n, m, me.bAuf), az: ba.az ?? bm.az ?? 0, el: ba.el ?? bm.el ?? 12, text, behalten: proM(b.behalten, m), ohnePunkt: b.ohnePunkt && (b.ohnePunkt === true || b.ohnePunkt[m]) };
    });
    // überlappende Haltefenster (nahe Lesestellen gehen ineinander über) in der Mitte der Überlappung trennen
    const ord = beats.filter(b => !b.behalten).sort((a, b) => a.u[0] - b.u[0]);
    for (let i = 1; i < ord.length; i++) { const p = ord[i - 1], q = ord[i]; if (q.u[0] < p.u[1] + .012) { const mid = (Math.max(q.u[0], p.u[0] + .02) + Math.min(p.u[1], q.u[1])) / 2; p.u = [p.u[0], Math.max(p.u[0] + .01, mid - .006)]; q.u = [Math.max(mid + .006, p.u[1] + .012), Math.max(q.u[1], mid + .02)]; } }
    (kameras[n] ||= { fenster: {} }).ende = { ...(kameras[n].ende || {}), [m]: { v: me.v0 + Math.max(...ord.map(b => b.u[1])) * (me.v1 - me.v0), alle: me.alle } };
    const altDat = (await import(pathToFileURL(path.join(SEITE, "kamera", n + ".js")).href + "?t=" + Date.now())).default[m];
    const erg = stuetzstellen(beats, fmt, punktBei, altDat);
    (kameras[n] ||= { fenster: {} })[m] = erg.keys;
    kameras[n].fenster[m] = beats.map(b => b.u);
    berichte.push({ szene: n, modus: m, info: erg.info.map(x => ({ ...x, u: beats.find(b => b.name === x.name).u.map(v => +v.toFixed(3)) })) });
    (kameras[n] ||= { fenster: {} }).soll = { ...(kameras[n].soll || {}), [m]: Object.fromEntries(erg.info.map(x => [x.name, x])) };
  }
  await pg.close();
}

// ---- 2b. Nachbarszene: ihre Kurve übernimmt die Kamera ab ihrer ersten Stützstelle (dort beginnt der Anlauf im Flug). Beginnt sie schon vor dem letzten Halt dieser Szene,
// wird sie weggenommen: die erste Stützstelle rückt (mit gleicher Stellung, die ist die Verfolgungsstellung) hinter den Halt. Gilt für beide Formate.
const nachbarn = {};
async function nachbarnAnpassen() {
  for (const n of namen) for (const m of MODI) {
    const e = kameras[n].ende[m], i = e.alle.findIndex(q => q.name === n), nx = e.alle[i + 1];
    if (!nx) continue;
    let dat = kameras[nx.name] && kameras[nx.name][m];
    if (!dat) { dat = (await import(pathToFileURL(path.join(SEITE, "kamera", nx.name + ".js")).href + "?t=" + Date.now())).default[m].map(k => ({ ...k, c: k.c.slice(), t: k.t.slice() })); }
    const len = nx.v1 - nx.v0, x0 = nx.v0 + dat[0].u * len, frei = e.v + 30;
    if (x0 < frei) {
      const u1 = +((frei - nx.v0) / len).toFixed(4), erste = dat[0];
      const rest = dat.filter((k, j) => j > 0 && k.u > u1 + .005);
      dat.splice(0, dat.length, { ...erste, u: u1 }, ...rest);
      console.log(`Nachbar ${nx.name} (${m}): Anlauf beginnt jetzt bei u ${u1} statt vor dem letzten Halt von ${n}`);
      if (!kameras[nx.name]) (nachbarn[nx.name] ||= {})[m] = dat;
    }
  }
}

// ---- 3. Kamera schreiben (Kopfkommentar der Datei bleibt)
const fmtKey = k => `{ u: ${k.u}, c: [${k.c.join(", ")}], t: [${k.t.join(", ")}]${k.l ? ", l: 1" : ""}${k.o ? ", o: 1" : ""} }`;
function kameraSchreiben(n) {
  const f = path.join(SEITE, "kamera", n + ".js"), alt = fs.readFileSync(f, "utf8"), kopf = alt.slice(0, alt.indexOf("export default"));
  const neuerKopf = kopf.includes("ERZEUGT") ? kopf : kopf + `// ERZEUGT von werkzeug/kamera-bauen.mjs aus werkzeug/beats/${n}.mjs: die Lesestellen-Stützstellen (l = 1) entstehen aus den Beats, Handänderungen dort gehen beim nächsten Lauf verloren.\n`;
  const blk = k => "[\n" + k.map(x => "    " + fmtKey(x)).join(",\n") + "\n  ]";
  fs.writeFileSync(f, neuerKopf + "export default {\n  d: " + blk(kameras[n].d) + ",\n  n: " + blk(kameras[n].n) + "\n};\n");
}

async function nachbarnSchreiben() {
  for (const nx of Object.keys(nachbarn)) {
    const f = path.join(SEITE, "kamera", nx + ".js"), alt = fs.readFileSync(f, "utf8"), kopf = alt.slice(0, alt.indexOf("export default"));
    const dat = (await import(pathToFileURL(f).href + "?t=" + Date.now())).default, blk = k => "[\n" + k.map(x => "    " + fmtKey(x)).join(",\n") + "\n  ]";
    fs.writeFileSync(f, kopf + "export default {\n  d: " + blk(nachbarn[nx].d || dat.d) + ",\n  n: " + blk(nachbarn[nx].n || dat.n) + "\n};\n");
  }
}

// ---- 4. Fotos mit Prüfung (Motivpunkte und Punkt durch die echte Kamera der Seite projiziert)
async function fotos(o, m) {
  const pg = await o.seite(m), fmt = FORMATE[m], W = fmt.rand;
  const win = { x0: -1 + 2 * W.l / fmt.width, x1: 1 - 2 * W.r / fmt.width, y0: -1 + 2 * W.u / fmt.height, y1: 1 - 2 * W.o / fmt.height };
  for (const n of namen) {
    const B = beatsVon[n], me = await messen(pg, n, 240), R = rahmenVon(me), stops = me.stops.slice().sort((a, b) => a.u0 - b.u0);
    const dots = me.dot.filter(d => d.p).map(d => ({ u: d.u, p: R.rahW(d.p) }));
    for (let i = 0; i < B.beats.length; i++) {
      const b = B.beats[i], z = zeigtIn(b, m);
      if (b.ohneFoto) continue;
      const u = (kameras[n] && kameras[n].fenster[m] && kameras[n].fenster[m][i]) || fensterVon(b, stops, dots, R, n, m, me.bAuf), um = (u[0] + u[1]) / 2;
      const welt = []; for (const k of z) welt.push(...ecken((B.motive.d ? B.motive[m] : B.motive)[k].box).map(P => R.welt(P)));
      const fn = `${tag}-${n}-${String(i + 1).padStart(2, "0")}-${z.join("+")}-${m}.png`;
      await foto(pg, n, um, fn, 1500);
      const chk = await pg.evaluate(([n, um, welt]) => {
        const A = window.__seite, I = A.inst().find(q => q.name === n), V = A.THREE.Vector3, cam = A.camera;
        cam.updateMatrixWorld(true);
        const pr = P => { const v = new V(...P).project(cam); return [v.x, v.y, v.z]; };
        const ps = welt.map(pr), d = A.dot(I.body.v0 + um * (I.body.v1 - I.body.v0));
        const cp = cam.position.toArray(), tp = A.camTgt().toArray();
        return { cp, tp, x0: Math.min(...ps.map(p => p[0])), x1: Math.max(...ps.map(p => p[0])), y0: Math.min(...ps.map(p => p[1])), y1: Math.max(...ps.map(p => p[1])), dot: d ? pr(d.p) : null };
      }, [n, um, welt]);
      const soll = kameras[n] && kameras[n].soll && kameras[n].soll[m] && kameras[n].soll[m][z.join("+")];
      let abw = "";
      if (soll) { const a = R.rahW(chk.cp), t = R.rahW(chk.tp); abw = `  Kamera ist-soll ${a.map((v, k) => (v - soll.C[k]).toFixed(2)).join(",")} Ziel ${t.map((v, k) => (v - soll.T[k]).toFixed(2)).join(",")}`; }
      const ausser = Math.max(0, win.x0 - chk.x0, chk.x1 - win.x1, win.y0 - chk.y0, chk.y1 - win.y1);
      const dotIn = chk.dot && chk.dot[0] > win.x0 && chk.dot[0] < win.x1 && chk.dot[1] > win.y0 && chk.dot[1] < win.y1;
      const frei = [(chk.x0 - win.x0) / (win.x1 - win.x0), (win.x1 - chk.x1) / (win.x1 - win.x0), (chk.y0 - win.y0) / (win.y1 - win.y0), (win.y1 - chk.y1) / (win.y1 - win.y0)].map(v => Math.round(v * 100));
      console.log(`${fn}  u ${um.toFixed(3)}  motiv ${ausser <= .01 ? "ganz im Bild" : "ABGESCHNITTEN um " + ausser.toFixed(2)}  Rand frei l/r/u/o % ${frei.join("/")}  punkt ${dotIn ? "im Bild" : "NICHT im Bild"}${chk.dot ? ` (${chk.dot[0].toFixed(2)}, ${chk.dot[1].toFixed(2)})` : ""}${abw}`);
    }
  }
  await pg.close();
}

const t0 = Date.now(), o = await oeffnen();
try {
  if (!flag("--nur-fotos")) {
    routenSchreiben();
    for (const m of MODI) await rechnen(o, m);
    await nachbarnAnpassen();
    for (const n of namen) for (const m of ["d", "n"]) if (!kameras[n][m]) kameras[n][m] = (await import(pathToFileURL(path.join(SEITE, "kamera", n + ".js")).href + "?t=" + Date.now())).default[m];
    for (const n of namen) kameraSchreiben(n);
    await nachbarnSchreiben();
    for (const b of berichte) console.log(b.szene, b.modus, JSON.stringify(b.info));
  }
  if (!flag("--ohne-fotos")) { for (const m of MODI) await fotos(o, m); }
} finally { await o.zu(); }
console.log(`fertig in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
