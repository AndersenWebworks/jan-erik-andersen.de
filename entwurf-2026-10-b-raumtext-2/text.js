// Text auf den Flächen der Modelle: echter 3D-Text (troika-three-text, SDF), ohne Rückfläche und ohne Schatten.
// Ein Block ist eine Gruppe aus Textzeilen und dünnen Unterstreichungen; Ursprung = linke obere Ecke, x nach rechts, y nach oben.
// Der Block wird mit K.put() auf eine Papierfläche gelegt und faltet mit ihr.
import * as THREE from "three";
import { Text, configureTextBuilder } from "troika-three-text";
import { SCHRIFTEN } from "./fonts/schriften.js";

export const TCOL = { ink: "#303033", muted: "#66666a", red: "#d40235" };
const furl = f => new URL("fonts/" + f, document.baseURI).href;
export const FONT = {
  sg: furl("SG-400.ttf"), sgm: furl("SG-500.ttf"), sgb: furl("SG-600.ttf"),
  nr: furl("NR-Text-400.ttf"), title: furl("NR-Title-400.ttf"), disp: furl("NR-Display-300.ttf"), dispi: furl("NR-Display-Italic-300.ttf"), nri: furl("NR-Text-Italic-380.ttf")
};
// troika lädt Schriften per XMLHttpRequest. In der Vorschau-Sandbox sind Netzabrufe gesperrt,
// deshalb beantworten wir Anfragen auf die eigenen Schriftdateien aus den eingebetteten Daten (kein Netz).
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
// Kein Web Worker (Sandbox: worker-src 'none').
configureTextBuilder({ useWorker: false, sdfGlyphSize: 64, unicodeFontsURL: new URL("vendor/troika/unicode-fonts", document.baseURI).href });

const textMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, side: THREE.FrontSide });
const sync = t => new Promise(r => t.sync(r));
const bb = t => { const b = t.textRenderInfo.blockBounds; return [b[2] - b[0], b[3] - b[1]]; };

// ---------- Inhalt aus dem DOM (Quelle der Wahrheit, wörtlich) ----------
export function inline(el) {
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
export function headLines(h) {
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
      out.push({ k: "p", ...inline(c) });
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
// def: { sec, sel, i, head, kicker, rows:[a,b], foot, only:["h3"] | skip:["h3"] }
export function readSpec(def) {
  const sec = document.querySelector(def.sec), blocks = [];
  let head = null;
  if (def.head) head = headLines(sec.querySelector("h1, h2"));
  if (def.kicker) blocks.push({ k: "kicker", ...inline(sec.querySelector(".kicker")) });
  if (def.sel) {
    const el = sec.querySelectorAll(def.sel)[def.i || 0];
    if (el.matches("blockquote")) parseBlocks({ children: [el] }, blocks); else if (el.tagName === "P") blocks.push({ k: "p", ...inline(el) }); else parseBlocks(el, blocks);
  }
  if (def.rows) { const r = blocks.find(b => b.k === "rows"); r.rows = r.rows.slice(def.rows[0], def.rows[1]); }
  if (def.foot) blocks.push({ k: "foot", a: sec.querySelector("footer span:first-child").textContent.trim(), b: sec.querySelector("footer span:last-child").textContent.trim() });
  let bl = blocks;
  if (def.only) bl = bl.filter(b => def.only.includes(b.k));
  if (def.skip) bl = bl.filter(b => !def.skip.includes(b.k));
  if (def.big) bl = bl.map(b => b.k === "p" ? { ...b, k: "big" } : b);
  return { head, blocks: bl };
}

// ---------- Block setzen ----------
// cfg: { fs: Fließtextgröße (m), W: Blockbreite (m), headScale, h3Scale, color }
export async function buildBlock(spec, cfg) {
  const fs = cfg.fs, W = cfg.W;
  const texts = [], planes = [], links = [];
  const group = new THREE.Group();
  const mkT = (str, o) => {
    const t = new Text();
    t.text = str; t.font = o.f; t.fontSize = o.s; t.color = o.c || TCOL.ink; t.maxWidth = o.w === undefined ? W : o.w;
    t.lineHeight = o.l || 1.4; t.letterSpacing = o.ls || 0; t.anchorX = o.ax || "left"; t.anchorY = "top"; t.textAlign = o.al || "left";
    t.whiteSpace = o.nw ? "nowrap" : "normal"; t.material = textMat; t.renderOrder = 3; t.frustumCulled = false;
    if (o.ph && o.ph.length) { const r = {}; for (const [a, b] of o.ph) { r[a] = TCOL.muted; r[b] = o.c || TCOL.ink; } t.colorRanges = r; }
    if (o.rr) t.colorRanges = o.rr;
    texts.push(t); group.add(t);
    return t;
  };
  const items = [];
  let y = 0; // nach unten wachsend (m)
  const place = (t, x, dy = 0) => items.push({ t, x, y: y + dy });
  const plane = (x, yy, w, h, color) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, side: THREE.FrontSide }));
    m.renderOrder = 3; m.frustumCulled = false; group.add(m);
    m.scale.set(w, h, 1); m.position.set(x + w / 2, -yy - h / 2, -.0005);
    planes.push(m);
  };
  const em = k => k * fs;
  const gap = (prev, k) => {
    if (!prev) return 0;
    if (prev === "head") return em(.9);
    if (prev === "kicker") return em(1.0);
    if (prev === "meta") return em(.7);
    if (prev === "h3") return em(.75);
    if (k === "link" || k === "links") return em(1.25);
    if (prev === "p" && k === "p") return em(.8);
    if (prev === "p" && k === "proof") return em(.6);
    if (k === "cap") return em(1.0);
    if (k === "cite") return em(.9);
    if (k === "foot") return em(2.2);
    return em(.8);
  };
  let prev = null;
  if (spec.head) {
    const lines = spec.head, size0 = em(cfg.headScale || 4);
    let size = size0, objs = [];
    for (let pass = 0; pass < 2; pass++) {
      objs.forEach(o => { group.remove(o); texts.splice(texts.indexOf(o), 1); o.dispose(); });
      objs = lines.map(L => mkT(L.t, { f: L.em ? FONT.dispi : FONT.disp, s: size, c: L.em ? TCOL.red : TCOL.ink, w: Infinity, l: 1.0, nw: true }));
      await Promise.all(objs.map(sync));
      const ind = lines.length > 1 ? size * .2 : 0;
      const wmax = Math.max(...objs.map((o, i) => bb(o)[0] + (i % 2) * ind));
      if (wmax <= W || pass) break;
      size = size * W / wmax * .99;
    }
    const ind = lines.length > 1 ? size * .2 : 0;
    objs.forEach((o, i) => { place(o, (i % 2) * ind, 0); y += size * 1.0 + (i < objs.length - 1 ? size * .02 : 0); });
    y += size * .05; prev = "head";
  }
  for (const b of spec.blocks) {
    y += gap(prev, b.k);
    let t;
    if (b.k === "kicker" || b.k === "meta") {
      t = mkT(b.s.toUpperCase(), { f: FONT.sgm, s: em(.64), c: TCOL.muted, l: 1.5, ls: .14 }); await sync(t); place(t, 0); y += bb(t)[1];
    } else if (b.k === "h3") {
      t = mkT(b.s, { f: FONT.title, s: em(cfg.h3Scale || 1.75), l: 1.12 }); await sync(t); place(t, 0); y += bb(t)[1];
    } else if (b.k === "p") {
      t = mkT(b.s, { f: FONT.sg, s: em(cfg.pScale || 1), l: 1.56, ph: b.ph }); await sync(t); place(t, 0); y += bb(t)[1];
    } else if (b.k === "big") {
      t = mkT(b.s, { f: FONT.nr, s: em(1.32), l: 1.42 }); await sync(t); place(t, 0); y += bb(t)[1];
    } else if (b.k === "proof" || b.k === "cap") {
      t = mkT(b.s, { f: FONT.sg, s: em(.76), c: TCOL.muted, l: 1.5, ph: b.ph }); await sync(t); place(t, 0); y += bb(t)[1];
    } else if (b.k === "quote") {
      const s = "„" + b.s + "“", rr = { 0: TCOL.red, 1: TCOL.ink }; rr[s.length - 1] = TCOL.red;
      t = mkT(s, { f: FONT.nri, s: em(1.14), l: 1.48, rr }); await sync(t); place(t, 0); y += bb(t)[1];
    } else if (b.k === "cite") {
      t = mkT(b.s, { f: FONT.sgm, s: em(.74), c: TCOL.muted, l: 1.4 }); await sync(t); place(t, 0); y += bb(t)[1];
    } else if (b.k === "link" || b.k === "links") {
      const its = b.k === "link" ? [b] : b.items; let x = 0, hmax = 0;
      const ts = its.map(it => mkT(it.s, { f: FONT.sgb, s: em(.94), l: 1.2, w: Infinity, nw: true }));
      await Promise.all(ts.map(sync));
      ts.forEach((tt, i) => {
        const [w, h] = bb(tt); place(tt, x); hmax = Math.max(hmax, h);
        plane(x, y + h + em(.16), w, em(.1), TCOL.red);
        links.push({ x0: x - em(.4), x1: x + w + em(.4), y0: y - em(.3), y1: y + h + em(.6), href: its[i].href });
        x += w + em(1.5);
      });
      y += hmax + em(.3);
    } else if (b.k === "rows") {
      const yc = cfg.narrow ? 0 : em(7.4), tw = W - yc;
      for (let i = 0; i < b.rows.length; i++) {
        const r = b.rows[i];
        if (i) plane(0, y, W, em(.05), "#c9c9cc");
        y += em(.62);
        const ty = mkT(r.y.s, { f: FONT.sgm, s: em(.8), c: TCOL.muted, l: 1.5, w: cfg.narrow ? W : yc - em(.5), ph: r.y.ph });
        const tsx = mkT(r.s, { f: FONT.nr, s: em(1.14), l: 1.3, w: tw });
        const tm = r.small ? mkT(r.small, { f: FONT.sg, s: em(.82), c: TCOL.muted, l: 1.45, w: tw }) : null;
        await Promise.all([sync(ty), sync(tsx), tm && sync(tm)]);
        const hy = bb(ty)[1], hs = bb(tsx)[1], hm = tm ? bb(tm)[1] : 0;
        if (cfg.narrow) { place(ty, 0); y += hy; place(tsx, 0); y += hs; if (tm) { place(tm, 0, em(.1)); y += hm + em(.1); } }
        else { place(ty, 0, em(.2)); place(tsx, yc); if (tm) place(tm, yc, hs + em(.05)); y += Math.max(hy + em(.2), hs + (tm ? hm + em(.05) : 0)); }
        y += em(.62);
      }
    } else if (b.k === "contact") {
      for (let i = 0; i < b.items.length; i++) {
        const it = b.items[i];
        if (i) y += em(1.0);
        const tl = mkT(it.label.toUpperCase(), { f: FONT.sgm, s: em(.6), c: TCOL.muted, l: 1.2, ls: .14 }); await sync(tl); place(tl, 0); y += bb(tl)[1] + em(.3);
        const ta = mkT(it.s, { f: FONT.sg, s: em(1.1), l: 1.2, w: Infinity, nw: true }); await sync(ta); place(ta, 0);
        const [w, h] = bb(ta); plane(0, y + h + em(.12), w, em(.07), TCOL.red);
        links.push({ x0: -em(.4), x1: w + em(.4), y0: y - em(.3), y1: y + h + em(.6), href: it.href });
        y += h + em(.2);
      }
    } else if (b.k === "foot") {
      const ta = mkT(b.a, { f: FONT.sg, s: em(.7), c: TCOL.muted, l: 1.4, w: Infinity, nw: true }), tb = mkT(b.b, { f: FONT.sg, s: em(.7), c: TCOL.muted, l: 1.4, w: Infinity, nw: true, ax: cfg.narrow ? "left" : "right" });
      await Promise.all([sync(ta), sync(tb)]);
      if (cfg.narrow) { place(ta, 0); y += bb(ta)[1]; place(tb, 0, em(.1)); y += bb(tb)[1] + em(.1); }
      else { place(ta, 0); place(tb, W); y += Math.max(bb(ta)[1], bb(tb)[1]); }
    }
    prev = b.k === "links" ? "link" : b.k;
  }
  for (const it of items) it.t.position.set(it.x, -it.y, 0);
  const H = y;
  let op = -1;
  const setOpacity = v => {
    if (v === op) return; op = v;
    group.visible = v > .01;
    for (const t of texts) t.fillOpacity = v;
    for (const p of planes) p.material.opacity = v;
  };
  const dispose = () => { for (const t of texts) t.dispose(); for (const p of planes) { p.geometry.dispose(); p.material.dispose(); } };
  return { group, W, H, texts, links, setOpacity, dispose };
}

// Einzelnes Wort/Zeile als Lettern (für ausgeschnittene Schriftzüge): Ursprung linke Grundlinie unten
export async function buildWord(str, o) {
  const group = new THREE.Group();
  const t = new Text();
  t.text = str; t.font = o.f; t.fontSize = o.s; t.color = o.c || TCOL.ink; t.anchorX = "left"; t.anchorY = "bottom-baseline";
  t.whiteSpace = "nowrap"; t.material = textMat; t.renderOrder = 3; t.frustumCulled = false;
  group.add(t);
  await sync(t);
  const [w, h] = bb(t);
  let op = -1;
  return { group, t, W: w, H: h, setOpacity: v => { if (v === op) return; op = v; group.visible = v > .01; t.fillOpacity = v; }, dispose: () => t.dispose() };
}
