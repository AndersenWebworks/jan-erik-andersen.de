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
      // das HTML-Vorbild (Name und Unterzeile) bleibt, bis die Lettern im Bild aufgestanden sind
      onFirstFrame() { if (vorbild) setTimeout(() => vorbild.classList.add("weg"), 900); }
    });
    const lbl = document.getElementById("szene");
    if (lbl) setInterval(() => { const st = api.state(); if (st) { lbl.textContent = (st.kind === "t" ? "→ " : "") + api.labelAt(api.p()); } }, 250);
  }).catch(e => { console.error(e); document.documentElement.classList.add("nogl"); });
}
