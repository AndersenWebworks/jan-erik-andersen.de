// Textträger im Raum: Karten, Bögen und Schilder als Gegenstände der Szene.
// Der Text ist echter 3D-Text (troika-three-text, SDF), liegt als Kind auf dem Träger und wird von dessen Tiefentest verdeckt bzw. verdeckt selbst.
// Alle Maße hier in "Kartenpixeln" (1 Einheit = 1 CSS-px bei Ruhelage); die Gruppe wird später mit k Weltmetern je px skaliert.
import * as THREE from "three";
import { Text, configureTextBuilder } from "troika-three-text";
import { SCHRIFTEN } from "./fonts/schriften.js";

export const COL = { ink: "#303033", muted: "#66666a", red: "#d40235", paper: "#fdfdfb" };
const furl = f => new URL("fonts/" + f, document.baseURI).href;
const FONT = {
  sg: furl("SG-400.ttf"), sgm: furl("SG-500.ttf"), sgb: furl("SG-600.ttf"),
  nr: furl("NR-Text-400.ttf"), title: furl("NR-Title-400.ttf"), disp: furl("NR-Display-300.ttf"), dispi: furl("NR-Display-Italic-300.ttf"), nri: furl("NR-Text-Italic-380.ttf")
};
// troika lädt Schriften per XMLHttpRequest. In der Vorschau-Sandbox (connect-src 'none') schlägt das fehl,
// deshalb beantworten wir Anfragen auf die eigenen Schriftdateien aus den eingebetteten Daten.
const EINGEBETTET = new Map(Object.entries(SCHRIFTEN).map(([name, b64]) => [furl(name), b64]));
const NativeXHR = window.XMLHttpRequest;
window.XMLHttpRequest = class extends NativeXHR {
  open(method, url, ...rest) { this._schrift = EINGEBETTET.get(new URL(url, document.baseURI).href); if (!this._schrift) super.open(method, url, ...rest); }
  send(body) {
    if (!this._schrift) return super.send(body);
    const bin = atob(this._schrift), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    Object.defineProperty(this, "status", { value: 200 });
    Object.defineProperty(this, "response", { value: buf.buffer });
    setTimeout(() => this.onload && this.onload(), 0);
  }
};
// Kein Web Worker: Die Vorschau läuft in einer Sandbox mit "worker-src 'none'", dort scheitert der Blob-Worker still.
configureTextBuilder({ useWorker: false, unicodeFontsURL: new URL("vendor/troika/unicode-fonts", document.baseURI).href });

const textMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
const sync = t => new Promise(r => t.sync(r));
const bw = t => { const b = t.textRenderInfo.blockBounds; return [b[2] - b[0], b[3] - b[1]]; };

// ---------- Inhalt aus dem DOM (Quelle der Wahrheit, wörtlich) ----------
function inline(el) {
  let s = ""; const ph = [];
  (function walk(n) {
    for (const c of n.childNodes) {
      if (c.nodeType === 3) s += c.nodeValue.replace(/\s+/g, " ");
      else if (c.nodeType === 1) {
        if (c.classList.contains("proof")) continue;
        if (c.tagName === "BR") { s = s.replace(/ $/, "") + "\n"; continue; }
        const a = s.length; walk(c);
        if (c.classList.contains("placeholder")) ph.push([a, s.length]);
      }
    }
  })(el);
  const lead = s.length - s.replace(/^\s+/, "").length;
  s = s.replace(/^\s+/, "").replace(/\s+$/, "");
  return { s, ph: ph.map(([a, b]) => [Math.max(0, a - lead), Math.min(s.length, b - lead)]).filter(([a, b]) => b > a) };
}
function headLines(h) { // h1/h2: Textknoten = Zeile in Tinte, em = Zeile kursiv rot
  const out = [];
  for (const c of h.childNodes) {
    const t = c.textContent.replace(/\s+/g, " ").trim();
    if (!t) continue;
    out.push({ t, em: c.nodeType === 1 && c.tagName === "EM" });
  }
  return out;
}
function parseBlocks(el, out) {
  for (const c of el.children) {
    const cl = c.classList;
    if (cl.contains("meta")) out.push({ k: "meta", ...inline(c) });
    else if (c.tagName === "H3") out.push({ k: "h3", ...inline(c) });
    else if (c.tagName === "P") {
      const i = inline(c);
      out.push({ k: cl.contains("big") ? "big" : cl.contains("agency") ? "agency" : "p", ...i });
      const pr = c.querySelector(".proof"); if (pr) out.push({ k: "proof", ...inline(pr) });
    } else if (c.tagName === "A" && cl.contains("arrow")) out.push({ k: "link", s: c.textContent.trim(), href: c.getAttribute("href") });
    else if (cl.contains("links")) out.push({ k: "links", items: [...c.querySelectorAll("a")].map(a => ({ s: a.textContent.trim(), href: a.getAttribute("href") })) });
    else if (c.tagName === "FIGURE") { const f = c.querySelector("figcaption"); if (f) out.push({ k: "cap", ...inline(f) }); }
    else if (c.tagName === "OL") out.push({ k: "rows", rows: [...c.children].map(li => ({ y: inline(li.querySelector(".y")), s: li.querySelector(".s").firstChild.textContent.trim(), small: (li.querySelector(".s small") || { textContent: "" }).textContent.trim() })) });
    else if (c.tagName === "BLOCKQUOTE") { out.push({ k: "quote", ...inline(c.querySelector("p")) }); out.push({ k: "cite", ...inline(c.querySelector("cite")) }); }
    else if (cl.contains("lines")) out.push({ k: "contact", items: [...c.children].map(d => ({ label: d.querySelector("span").textContent.trim(), s: d.querySelector("a").textContent.trim(), href: d.querySelector("a").getAttribute("href") })) });
    else if (cl.contains("kicker")) out.push({ k: "kicker", ...inline(c) });
    else parseBlocks(c, out);
  }
}
// Inhalt je Karte: sec = Abschnitt, sel = Textelement, head = Abschnittswort zeigen, rows = Ausschnitt der Zeitleiste
export function readSpec(def) {
  const sec = document.querySelector(def.sec), blocks = [];
  let head = null;
  if (def.head) { const h = sec.querySelector("h1, h2"); head = headLines(h); }
  const els = sec.querySelectorAll(def.sel);
  const el = els[def.i || 0];
  if (def.k0) { const k = sec.querySelector(".kicker"); blocks.push({ k: "kicker", ...inline(k) }); }
  if (el.matches("blockquote")) parseBlocks({ children: [el] }, blocks); else if (el.tagName === "P") blocks.push({ k: "p", ...inline(el) }); else parseBlocks(el, blocks);
  if (def.rows) { const r = blocks.find(b => b.k === "rows"); r.rows = r.rows.slice(def.rows[0], def.rows[1]); }
  if (def.foot) blocks.push({ k: "foot", a: sec.querySelector("footer span:first-child").textContent.trim(), b: sec.querySelector("footer span:last-child").textContent.trim() });
  return { head, blocks, carrier: def.carrier };
}

// ---------- Karte bauen ----------
export const BACK_VERT = `varying vec2 vUv; varying float vDepth;
  void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
const BACK_FRAG = `uniform vec2 uSize; uniform float uOp; uniform vec3 uPaper; varying vec2 vUv; varying float vDepth;
  void main() {
    vec2 q = vUv * uSize;
    float e = min(min(q.x, uSize.x - q.x), min(q.y, uSize.y - q.y));
    float aa = max(fwidth(e), 1e-4);
    float edge = 1.0 - smoothstep(aa * .5, aa * 1.6, e);
    float v = .975 + .025 * vUv.y; // minimale Papiertönung von unten nach oben
    vec3 c = mix(uPaper * v, vec3(.0296, .0296, .0331), edge * .5);
    float a = uOp;
    if (a < 0.05) discard;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;
const SHADOW_FRAG = `uniform vec2 uSize; uniform float uOp; uniform float uM; varying vec2 vUv; varying float vDepth;
  void main() {
    vec2 p = (vUv - .5) * uSize; vec2 hb = uSize * .5 - vec2(uM);
    vec2 d = abs(p) - hb; float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    float a = (1.0 - smoothstep(-uM * .25, uM * .95, sd)) * .13 * uOp;
    if (a < .002) discard;
    gl_FragColor = vec4(.0296, .0296, .0331, a);
    #include <colorspace_fragment>
  }`;

export async function buildCard(spec, cfg) {
  const n = cfg.narrow, W = cfg.W, pad = n ? 22 : 44, iw = W - pad * 2;
  const S = n
    ? { body: 16.5, bl: 1.52, meta: 11.5, h3: 27, h3l: 1.14, disp: 40, hero: 58, big: 21, bigl: 1.4, quote: 18.5, quotel: 1.45, cite: 13, ry: 12.5, rs: 17.5, rm: 13.5, link: 16.5, cap: 13, proof: 14.5, contact: 19, kick: 11.5, foot: 12.5, yc: 78 }
    : { body: 19.5, bl: 1.56, meta: 12.5, h3: 34, h3l: 1.12, disp: 64, hero: 112, big: 27, bigl: 1.4, quote: 22.5, quotel: 1.48, cite: 14.5, ry: 15, rs: 21, rm: 15.5, link: 18, cap: 14, proof: 16, contact: 21, kick: 13, foot: 14, yc: 150 };
  const texts = [], fades = [], links = [], planes = [];
  const group = new THREE.Group();
  const mkT = (str, o) => {
    const t = new Text();
    t.text = str; t.font = o.f; t.fontSize = o.s; t.color = o.c || COL.ink; t.maxWidth = o.w === undefined ? iw : o.w;
    t.lineHeight = o.l || 1.4; t.letterSpacing = o.ls || 0; t.anchorX = o.ax || "left"; t.anchorY = "top"; t.textAlign = o.al || "left";
    t.whiteSpace = o.nw ? "nowrap" : "normal"; t.sdfGlyphSize = o.sdf || 64; t.material = textMat; t.renderOrder = -3; t.frustumCulled = false;
    if (o.ph && o.ph.length) { const r = {}; for (const [a, b] of o.ph) { r[a] = COL.muted; r[b] = o.c || COL.ink; } t.colorRanges = r; }
    if (o.rr) t.colorRanges = o.rr;
    texts.push(t); group.add(t);
    return t;
  };
  const items = []; // { t | [..], x, h, top }
  let y = 0; // von oben nach unten (px)
  const place = (t, x, dy = 0) => { items.push({ t, x, y: y + dy }); };
  const plane = (x, yy, w, h, color, op) => { // dünne Fläche (Unterstreichung, Trennlinie); y von oben
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, toneMapped: false }));
    m.renderOrder = -3; m.frustumCulled = false; group.add(m); fades.push({ m: m.material, base: op });
    planes.push({ m, x, y: yy, w, h });
  };
  const gap = (prev, k) => {
    if (!prev) return 0;
    if (prev === "head") return n ? 18 : 30;
    if (prev === "kicker") return n ? 14 : 22;
    if (prev === "meta") return n ? 10 : 14;
    if (prev === "h3") return n ? 12 : 16;
    if (k === "link" || k === "links") return n ? 18 : 24;
    if (prev === "p" && k === "p") return n ? 12 : 16;
    if (prev === "p" && k === "proof") return n ? 10 : 12;
    if (k === "cap") return n ? 14 : 18;
    if (k === "cite") return n ? 14 : 18;
    if (k === "foot") return n ? 28 : 44;
    return n ? 14 : 18;
  };

  // Kopf: Abschnittswort in Newsreader 300, zweite Zeile kursiv rot und eingerückt
  let prev = null;
  if (spec.head) {
    const hero = cfg.hero, size0 = hero ? S.hero : S.disp;
    const lines = spec.head;
    let size = size0, objs = [];
    for (let pass = 0; pass < 2; pass++) {
      objs.forEach(o => { group.remove(o); texts.splice(texts.indexOf(o), 1); });
      objs = lines.map((L, i) => mkT(L.t, { f: L.em ? FONT.dispi : FONT.disp, s: size, c: L.em ? COL.red : COL.ink, w: Infinity, l: 1.0, nw: true, sdf: 128 }));
      await Promise.all(objs.map(sync));
      const ind = lines.length > 1 ? size * .2 : 0;
      const wmax = Math.max(...objs.map((o, i) => bw(o)[0] + (i % 2) * ind));
      if (wmax <= iw || pass) break;
      size = size * iw / wmax * .995;
    }
    const ind = lines.length > 1 ? size * .2 : 0;
    objs.forEach((o, i) => { place(o, (i % 2) * ind, 0); y += size * 1.0 + (i < objs.length - 1 ? size * .02 : 0); });
    y += size * .06;
    prev = "head";
  }
  for (const b of spec.blocks) {
    y += gap(prev, b.k);
    if (b.k === "kicker") {
      const t = mkT(b.s.toUpperCase(), { f: FONT.sgm, s: S.kick, c: COL.muted, l: 1.5, ls: .14 }); await sync(t); place(t, 0); y += bw(t)[1];
    } else if (b.k === "meta") {
      const t = mkT(b.s.toUpperCase(), { f: FONT.sgm, s: S.meta, c: COL.muted, l: 1.5, ls: .14 }); await sync(t); place(t, 0); y += bw(t)[1];
    } else if (b.k === "h3") {
      const t = mkT(b.s, { f: FONT.title, s: S.h3, l: S.h3l, sdf: 64 }); await sync(t); place(t, 0); y += bw(t)[1];
    } else if (b.k === "p" || b.k === "agency") {
      const sz = cfg.hero ? (n ? 17.5 : 21.5) : b.k === "agency" ? (n ? 17.5 : 21) : S.body;
      const t = mkT(b.s, { f: FONT.sg, s: sz, l: S.bl, ph: b.ph }); await sync(t); place(t, 0); y += bw(t)[1];
    } else if (b.k === "big") {
      const t = mkT(b.s, { f: FONT.nr, s: S.big, l: S.bigl }); await sync(t); place(t, 0); y += bw(t)[1];
    } else if (b.k === "proof") {
      const t = mkT(b.s, { f: FONT.sg, s: S.proof, c: COL.muted, l: 1.5, ph: b.ph }); await sync(t); place(t, 0); y += bw(t)[1];
    } else if (b.k === "cap") {
      const t = mkT(b.s, { f: FONT.sg, s: S.cap, c: COL.muted, l: 1.5 }); await sync(t); place(t, 0); y += bw(t)[1];
    } else if (b.k === "quote") {
      const s = "„" + b.s + "“", rr = { 0: COL.red, 1: COL.ink }; rr[s.length - 1] = COL.red;
      const t = mkT(s, { f: FONT.nri, s: S.quote, l: S.quotel, rr }); await sync(t); place(t, 0); y += bw(t)[1];
    } else if (b.k === "cite") {
      const t = mkT(b.s, { f: FONT.sgm, s: S.cite, c: COL.muted, l: 1.4 }); await sync(t); place(t, 0); y += bw(t)[1];
    } else if (b.k === "link" || b.k === "links") {
      const its = b.k === "link" ? [b] : b.items; let x = 0, hmax = 0;
      const ts = its.map(it => mkT(it.s, { f: FONT.sgb, s: S.link, l: 1.2, w: Infinity, nw: true }));
      await Promise.all(ts.map(sync));
      ts.forEach((t, i) => {
        const [w, h] = bw(t); place(t, x); hmax = Math.max(hmax, h);
        const ya = y + h + 3; plane(x, ya, w, 2, COL.red, 1);
        links.push({ x0: x - 8, x1: x + w + 8, y0: y - 6, y1: ya + 10, href: its[i].href, top: true });
        x += w + (n ? 22 : 28);
      });
      y += hmax + 5;
    } else if (b.k === "rows") {
      const yc = S.yc, tx = n ? 0 : yc, tw = iw - tx;
      for (let i = 0; i < b.rows.length; i++) {
        const r = b.rows[i];
        if (i) { plane(0, y, iw, 1, COL.ink, .14); }
        y += n ? 10 : 13;
        const ty = mkT(r.y.s, { f: FONT.sgm, s: S.ry, c: COL.muted, l: 1.5, w: n ? iw : yc - 8, ph: r.y.ph });
        const ts = mkT(r.s, { f: FONT.nr, s: S.rs, l: 1.3, w: tw });
        const tm = r.small ? mkT(r.small, { f: FONT.sg, s: S.rm, c: COL.muted, l: 1.45, w: tw }) : null;
        await Promise.all([sync(ty), sync(ts), tm && sync(tm)]);
        const hy = bw(ty)[1], hs = bw(ts)[1], hm = tm ? bw(tm)[1] : 0;
        if (n) { place(ty, 0); y += hy; place(ts, 0); y += hs; if (tm) { place(tm, 0, 2); y += hm + 2; } }
        else { place(ty, 0, 3); place(ts, tx); if (tm) place(tm, tx, hs + 1); y += Math.max(hy + 3, hs + (tm ? hm + 1 : 0)); }
        y += n ? 10 : 13;
      }
    } else if (b.k === "contact") {
      for (let i = 0; i < b.items.length; i++) {
        const it = b.items[i];
        if (i) y += n ? 14 : 20;
        const tl = mkT(it.label.toUpperCase(), { f: FONT.sgm, s: S.meta - .5, c: COL.muted, l: 1.2, ls: .14 }); await sync(tl); place(tl, 0); y += bw(tl)[1] + 5;
        const ta = mkT(it.s, { f: FONT.sg, s: S.contact, l: 1.2, w: Infinity, nw: true }); await sync(ta); place(ta, 0);
        const [w, h] = bw(ta), ya = y + h + 2; plane(0, ya, w, 1.5, COL.red, 1);
        links.push({ x0: -8, x1: w + 8, y0: y - 6, y1: ya + 12, href: it.href, top: false });
        y += h + 2;
      }
    } else if (b.k === "foot") {
      const ta = mkT(b.a, { f: FONT.sg, s: S.foot, c: COL.muted, l: 1.4, w: Infinity, nw: true }), tb = mkT(b.b, { f: FONT.sg, s: S.foot, c: COL.muted, l: 1.4, w: Infinity, nw: true, ax: n ? "left" : "right" });
      await Promise.all([sync(ta), sync(tb)]);
      if (n) { place(ta, 0); y += bw(ta)[1]; place(tb, 0, 2); y += bw(tb)[1] + 2; }
      else { place(ta, 0); place(tb, iw); y += Math.max(bw(ta)[1], bw(tb)[1]); }
    }
    prev = b.k === "links" ? "link" : b.k;
  }
  const top = n ? 24 : 40, H = Math.ceil(y + top + (n ? 24 : 40));
  for (const it of items) it.t.position.set(it.x - W / 2 + pad, H / 2 - top - it.y, .6);
  for (const p of planes) { p.m.scale.set(p.w, p.h, 1); p.m.position.set(p.x - W / 2 + pad + p.w / 2, H / 2 - top - p.y - p.h / 2, .5); }
  for (const l of links) {
    const ox = -W / 2 + pad, oy = H / 2 - top;
    l.rx0 = ox + l.x0; l.rx1 = ox + l.x1; l.ry1 = oy - l.y0; l.ry0 = oy - l.y1;
  }

  // Träger: Fläche mit Haarlinienkante, darunter ein weicher Schatten
  const U = { uSize: { value: new THREE.Vector2(W, H) }, uOp: { value: 1 }, uPaper: { value: new THREE.Color(COL.paper) } };
  const backMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: BACK_VERT, fragmentShader: BACK_FRAG, transparent: true, depthWrite: true, depthTest: true });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), backMat);
  back.renderOrder = -4; back.frustumCulled = false; group.add(back);
  const M = 26, shU = { uSize: { value: new THREE.Vector2(W + M * 2 + 20, H + M * 2 + 20) }, uOp: { value: 1 }, uM: { value: M } };
  const shMat = new THREE.ShaderMaterial({ uniforms: shU, vertexShader: BACK_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false, depthTest: true });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W + M * 2 + 20, H + M * 2 + 20), shMat);
  shadow.position.set(6, -16, -2); shadow.renderOrder = -4.5; shadow.frustumCulled = false; group.add(shadow);

  return { group, back, W, H, texts, fades, links, U, shU, carrier: spec.carrier, spec };
}

// ---------- Träger-Zubehör: Pfosten, Zaun, Seile, Rahmen (nur Linien, im Raum verankert) ----------
const DECO_VERT = `varying float vDepth; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
const DECO_FRAG = `uniform vec3 uColor; uniform float uOp; varying float vDepth;
  void main() { float a = .85 * uOp * smoothstep(.5, 2.2, vDepth) * (1.0 - smoothstep(11.0, 38.0, vDepth)); if (a < .004) discard; gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }`;
export function decoMaterial(color) {
  return new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color(color) }, uOp: { value: 1 } }, vertexShader: DECO_VERT, fragmentShader: DECO_FRAG, transparent: true, depthWrite: false });
}
// Zubehör in lokalen Kartenkoordinaten; fp(p) = Fußpunkt am Boden unter dem lokalen Punkt p, bk(p, d) = Bodenpunkt d Kartenpixel hinter p (Strebe)
export function buildDeco(card, fp, bk) {
  const W = card.W, H = card.H, hw = W / 2, hh = H / 2, P = [];
  const L = (a, b) => P.push(...a, ...b);
  const sh = (p, dx) => { const q = fp(p); return [q[0] + dx, q[1], q[2]]; };
  const post = (x, yTop, w = 7, z = -3, brace = true) => { // Pfosten als Doppellinie bis zum Boden, dazu eine Strebe nach hinten
    const a = [x - w, yTop, z], b = [x + w, yTop, z], fa = fp(a), fb = fp(b);
    L(a, fa); L(b, fb); L(fa, fb);
    if (brace) L([x, yTop - 110, z - 2], bk([x, yTop - 110, z - 2], 300));
  };
  const ring = (c, r, n = 14) => { for (let i = 0; i < n; i++) { const a = Math.PI * 2 * i / n, b = Math.PI * 2 * (i + 1) / n; L([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2]], [c[0] + Math.cos(b) * r, c[1] + Math.sin(b) * r, c[2]]); } };
  const rect = (x0, y0, x1, y1, z = -3) => { L([x0, y0, z], [x1, y0, z]); L([x1, y0, z], [x1, y1, z]); L([x1, y1, z], [x0, y1, z]); L([x0, y1, z], [x0, y0, z]); };
  const c = card.carrier || "board";
  if (c === "sheet") { // Papierbogen auf der Staffelei: zwei Beine, ein Stützbein, Querleiste, umgeknickte Ecke
    const xa = -hw * .62, xb = hw * .62, yb = -hh + 40;
    L([xa, yb, -3], sh([xa, yb, -3], -30)); L([xb, yb, -3], sh([xb, yb, -3], 30));
    L([0, hh - 10, -3], bk([0, hh - 10, -3], 520));
    L([xa, yb + 40, -3], [xb, yb + 40, -3]);
    L([hw - 56, -hh + 1, 1.2], [hw - 56, -hh + 56, 1.2]); L([hw - 56, -hh + 56, 1.2], [hw - 1, -hh + 56, 1.2]); L([hw - 56, -hh + 1, 1.2], [hw - 1, -hh + 56, 1.2]);
  } else if (c === "board") { // Bauschild auf zwei Pfosten mit Kappe
    post(-hw * .74, -hh + 90); post(hw * .74, -hh + 90);
    rect(-hw - 10, hh + 6, hw + 10, hh + 14, -3);
  } else if (c === "fence") { // Schild am Zaun: Pfostenreihe mit zwei Riegeln, Karte davor
    const xs = []; for (let i = -2; i <= 2; i++) xs.push(i * 330 + 40);
    for (const x of xs) { const a = [x - 6, 20, -14], b = [x + 6, 20, -14]; L(a, fp(a)); L(b, fp(b)); L(a, b); }
    for (const yy of [hh * .55, -hh * .25]) { L([xs[0], yy, -14], [xs[xs.length - 1], yy, -14]); L([xs[0], yy - 10, -14], [xs[xs.length - 1], yy - 10, -14]); }
  } else if (c === "banner") { // Plane: Ösen an den Ecken, Seile zu Pfosten hinter der Karte
    for (const [x, y] of [[-hw + 18, hh - 18], [hw - 18, hh - 18], [-hw + 18, -hh + 18], [hw - 18, -hh + 18]]) ring([x, y, 1.5], 7, 10);
    L([-hw + 18, hh - 18, 1], [-hw - 150, hh + 420, -40]); L([hw - 18, hh - 18, 1], [hw + 150, hh + 420, -40]);
    L([-hw + 18, -hh + 18, 1], fp([-hw - 120, -hh * .6, -60])); L([hw - 18, -hh + 18, 1], fp([hw + 120, -hh * .6, -60]));
    post(-hw - 120, -hh * .6, 6, -60); post(hw + 120, -hh * .6, 6, -60);
  } else if (c === "shelf") { // Karte am Regal: Fachbrett mit Stützen hinter der Karte, Karte steckt vorn
    const yb = -hh * .35;
    L([-hw - 200, yb, -10], [hw + 200, yb, -10]); L([-hw - 200, yb - 14, -10], [hw + 200, yb - 14, -10]); L([-hw - 200, yb, -120], [hw + 200, yb, -120]);
    L([-hw - 200, yb, -10], [-hw - 200, yb, -120]); L([hw + 200, yb, -10], [hw + 200, yb, -120]);
    for (const x of [-hw - 200, hw + 200]) { const a = [x, yb - 14, -10]; L(a, fp(a)); }
  } else if (c === "pipe") { // Tafel an der Leitung: Rohr quer hinter der Karte, Schellen
    const yp = hh * .45, r = 22;
    for (const s of [-1, 1]) L([-hw - 560, yp + s * r, -34], [hw + 560, yp + s * r, -34]);
    for (const x of [-hw - 80, hw + 80, -hw - 420]) rect(x - 10, yp - r - 8, x + 10, yp + r + 8, -32);
    for (const x of [-hw * .5, hw * .5]) { L([x - 6, yp + r, -33], [x - 6, hh - 2, -3]); L([x + 6, yp + r, -33], [x + 6, hh - 2, -3]); }
    post(hw + 330, yp - r, 7, -34);
  } else if (c === "clip") { // Blatt auf dem Zeichentisch: Reißschiene mit Teilung, Nadeln, zwei Tischbeine
    const yr = -hh - 28;
    L([-hw - 360, yr, 6], [hw + 360, yr, 6]); L([-hw - 360, yr - 22, 6], [hw + 360, yr - 22, 6]);
    for (let x = -hw - 340; x <= hw + 340; x += 20) L([x, yr, 6], [x, yr - (Math.round(x / 20) % 5 === 0 ? 12 : 6), 6]);
    ring([-hw + 22, hh - 22, 2], 5, 8); ring([hw - 22, hh - 22, 2], 5, 8);
    for (const x of [-hw * .8, hw * .8]) { const a = [x - 5, yr - 22, 5], b = [x + 5, yr - 22, 5]; L(a, fp(a)); L(b, fp(b)); }
  } else if (c === "crane") { // Karte am Kran: zwei Seile zum Haken, ein Strang nach oben
    L([-hw + 40, hh, 1], [0, hh + 150, -4]); L([hw - 40, hh, 1], [0, hh + 150, -4]);
    ring([0, hh + 160, -4], 10, 12); L([0, hh + 170, -4], [0, hh + 900, -10]);
    rect(-hw + 40, hh - 4, hw - 40, hh + 8, 1);
  } else if (c === "stations") { // Karten an Stationen: Wegmarke mit zwei Pfosten und Querholm
    post(-hw - 54, hh * .4, 7, -3); post(hw + 54, hh * .4, 7, -3);
    L([-hw - 54, hh * .4, -3], [hw + 54, hh * .4, -3]); L([-hw - 54, hh * .4 - 14, -3], [hw + 54, hh * .4 - 14, -3]);
  } else if (c === "arc") { // Karte im Bogen: Halbkreis über der Karte, Seile zur Karte
    const r = hw + 70, cy = hh - 10;
    for (let i = 0; i < 24; i++) { const a = Math.PI * i / 24, b = Math.PI * (i + 1) / 24; L([Math.cos(a) * r, cy + Math.sin(a) * r * .55, -6], [Math.cos(b) * r, cy + Math.sin(b) * r * .55, -6]); }
    for (const x of [-r, r]) { const a = [x, cy, -6]; L(a, fp(a)); }
    for (const f of [-.52, .52]) { const x = f * hw, yy = cy + Math.sqrt(1 - (x / r) ** 2) * r * .55; L([f > 0 ? hw - 36 : -hw + 36, hh, 1], [x, yy, -6]); }
  } else if (c === "scaffold") { // Bauschild am Gerüst: zwei hohe Stiele mit Querriegeln und Diagonalen
    const xa = -hw - 40, xb = hw + 40, yt = hh + 140;
    for (const x of [xa, xb]) { const a = [x - 5, yt, -8], b = [x + 5, yt, -8]; L(a, fp(a)); L(b, fp(b)); }
    for (const yy of [yt, hh * .2, -hh * .6]) L([xa, yy, -8], [xb, yy, -8]);
    L([xa, yt, -8], [xb, hh * .2, -8]); L([xb, yt, -8], [xa, hh * .2, -8]);
    for (const x of [xa, xb]) L([x, hh * .2, -8], bk([x, hh * .2, -8], 300));
  } else if (c === "door") { // Karte an der Tür: Türzarge hinter der Karte, nur Ränder außerhalb der Karte
    const x0 = -hw - 46, x1 = hw + 130, yt = hh + 120;
    for (const x of [x0, x1]) { const a = [x, yt, -30]; L(a, fp(a)); }
    L([x0, yt, -30], [x1, yt, -30]);
    L([x0 - 14, yt + 14, -30], [x1 + 14, yt + 14, -30]);
    for (const x of [x0 - 14, x1 + 14]) { const a = [x, yt + 14, -30]; L(a, fp(a)); }
  }
  return new Float32Array(P);
}
