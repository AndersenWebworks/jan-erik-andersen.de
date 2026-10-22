// Durchgehende Startseite, Fassung 2026-11: alle Szenen in Seitenreihenfolge auf einer Kamerabahn (Kern: kern.js, Faltkern: falt.js).
// Reihenfolge laut Seitentext (entwurf-2026-10-b-raumtext-2/index.html): Eröffnung, Gerwing, Leistungen (Betreuung, Modernisierung,
// Shops, Schnittstellen, Gestaltung), Weitere Arbeit (WBG Pooling, Take the Gloves Off, Außerdem), Wie ich arbeite, Werdegang,
// Stimmen, Für Agenturen, Kontakt.
// Zustände: #p=0…1 (ganze Seite), #s=<szene> (Szenenanfang), Handy-Ausschnitt #…&w=390&h=844.
import * as THREE from "three";
import { seite, loadFonts } from "./kern.js";
import { SEQ, optional } from "./folge.js";
import { setBilder } from "./gerwing.js";

async function bilder() {
  const { BILDER } = await import("./bilder/bilder.js");
  const out = {};
  await Promise.all(Object.entries(BILDER).map(async ([k, b64]) => {
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    out[k] = await createImageBitmap(new Blob([buf], { type: "image/jpeg" }));
  }));
  return out;
}
const canvas = document.getElementById("stage");
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); if (!renderer.getContext()) renderer = null; } catch (e) { renderer = null; }
if (!renderer) document.documentElement.classList.add("nogl");
else {
  const vorbild = document.querySelector(".vorbild");
  Promise.all([loadFonts().catch(() => {}), bilder().then(setBilder).catch(() => {}), Promise.all(SEQ.map(optional))]).then(([, , seq]) => {
    const api = seite(renderer, seq.filter(Boolean), {
      // das HTML-Vorbild (Name und Unterzeile) bleibt, bis die Lettern der Szene stehen; dann tauschen beide in 0,12 s (kern.js, release)
      onRelease() { if (vorbild) vorbild.classList.add("weg"); }
    });
    // Lage des Vorbilds aus der 3D-Szene (deckungsgleich), bei jeder Größenänderung neu
    const lage = () => {
      if (!vorbild) return;
      const b = api.vorbildBox(); if (!b || b.length < 2) return;
      const nm = b.filter(x => !/Webentwicklung/.test(x.text)), ki = b.find(x => /Webentwicklung/.test(x.text)), s = vorbild.style, px = v => v.toFixed(2) + "px";
      s.setProperty("--tx", "0px");
      s.setProperty("--F1", px(nm[0].em)); s.setProperty("--x1", px(nm[0].x0)); s.setProperty("--b1", px(nm[0].base));
      if (nm.length > 1 && Math.abs(nm[1].base - nm[0].base) > 5) { s.setProperty("--F2", px(nm[1].em)); s.setProperty("--x2", px(nm[1].x0)); s.setProperty("--b2", px(nm[1].base)); }
      if (ki) { s.setProperty("--kF", px(ki.em)); s.setProperty("--kx", px(ki.xm)); s.setProperty("--kb", px(ki.base)); s.setProperty("--klh", (ki.lh / ki.em).toFixed(3)); }
    };
    lage(); addEventListener("resize", lage);
    const lbl = document.getElementById("szene");
    if (lbl) setInterval(() => { const st = api.state(); if (st) { lbl.textContent = (st.kind === "t" ? "→ " : "") + api.labelAt(api.p()); } }, 250);
  }).catch(e => { console.error(e); document.documentElement.classList.add("nogl"); });
}
