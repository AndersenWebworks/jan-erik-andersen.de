// Durchgehende Startseite, Fassung 2026-11: alle Szenen in Seitenreihenfolge auf einer Kamerabahn (Kern: kern.js, Faltkern: falt.js).
// Reihenfolge laut Seitentext (entwurf-2026-10-b-raumtext-2/index.html): Eröffnung, Gerwing, Leistungen (Betreuung, Modernisierung,
// Shops, Schnittstellen mit WBG Pooling als Beleg, Gestaltung), Weitere Arbeit (Außerdem), Wie ich arbeite, Werdegang,
// Für Agenturen, Kontakt.
// Zustände: #p=0…1 (ganze Seite), #s=<szene> (Szenenanfang), #s=uebersicht (stehende Karte am Seitenende), Handy-Ausschnitt #…&w=390&h=844.
// Die Szenen stehen als Parzellen auf einem gemeinsamen Tisch (Anordnung in kern.js layout(), Richtungen in folge.js), am Ende zoomt die Kamera zur Karte.
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
// Kontaktblatt: Menüpunkt „Kontakt“ öffnet ein kleines Blatt (Dialog) mit Mail, Telefon und LinkedIn. Beim Öffnen springt der Fokus auf den ersten Link,
// Tab bleibt im Blatt, Esc schließt und gibt den Fokus an den Menüpunkt zurück; Klick daneben oder erneut auf den Menüpunkt schließt ebenfalls.
{
  const knopf = document.getElementById("kontaktknopf"), blatt = document.getElementById("kontaktblatt");
  if (knopf && blatt) {
    const setze = auf => { blatt.hidden = !auf; knopf.setAttribute("aria-expanded", String(auf)); };
    const links = () => [...blatt.querySelectorAll("a[href]")];
    knopf.addEventListener("click", ev => { ev.stopPropagation(); const auf = blatt.hidden; setze(auf); if (auf) { const l = links()[0]; if (l) l.focus(); } });
    document.addEventListener("click", ev => { if (!blatt.hidden && !blatt.contains(ev.target)) setze(false); });
    document.addEventListener("keydown", ev => {
      if (blatt.hidden) return;
      if (ev.key === "Escape") { setze(false); knopf.focus(); return; }
      if (ev.key !== "Tab") return;
      const l = links(); if (!l.length) return;
      const erster = l[0], letzter = l[l.length - 1];
      if (ev.shiftKey && document.activeElement === erster) { ev.preventDefault(); letzter.focus(); }
      else if (!ev.shiftKey && document.activeElement === letzter) { ev.preventDefault(); erster.focus(); }
      else if (!blatt.contains(document.activeElement)) { ev.preventDefault(); (ev.shiftKey ? letzter : erster).focus(); }
    });
  }
}
// Sprunglink: setzt den Fokus in den Seitentext (ohne die Adresse zu ändern, damit die Kamera nicht reagiert)
{
  const skip = document.querySelector(".skip"), inhalt = document.getElementById("inhalt");
  if (skip && inhalt) skip.addEventListener("click", ev => { ev.preventDefault(); inhalt.focus(); });
}
const canvas = document.getElementById("stage");
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); if (!renderer.getContext()) renderer = null; } catch (e) { renderer = null; }
if (!renderer) document.documentElement.classList.add("nogl");
else {
  // 3D-Ansicht: der Seitentext ist nur für Screenreader da (visuell verborgen); seine Links stehen nicht in der Tab-Reihenfolge, sonst läge der Fokus auf Unsichtbarem
  // (Screenreader erreichen sie weiter über Links-Liste und Lesemodus, Kontaktwege stehen sichtbar unten)
  const textlinks = document.querySelectorAll("main.sr a[href]");
  textlinks.forEach(a => a.setAttribute("tabindex", "-1"));
  const vorbild = document.querySelector(".vorbild");
  Promise.all([loadFonts().catch(() => {}), bilder().then(setBilder).catch(() => {}), Promise.all(SEQ.map(optional))]).then(([, , seq]) => {
    const api = seite(renderer, seq.filter(Boolean), {
      // das HTML-Vorbild (Name, am Handy auch die Unterzeile) deckt sich mit dem Startbild und bleibt, bis die Lettern ganz aufgestanden sind
      // (letzter Letter .5 + .7 s, Schlusspunkt bis 1,2 s, Überschwingen); erst dann blendet es aus, es steht nie versetzt neben dem Bild
      onFirstFrame() { if (vorbild) setTimeout(() => vorbild.classList.add("weg"), 1500); }
    });
    const lbl = document.getElementById("szene");
    if (lbl) setInterval(() => { const st = api.state(); if (st) { lbl.textContent = (st.kind === "t" ? "→ " : "") + api.labelAt(api.p()); } }, 250);
  }).catch(e => { console.error(e); document.documentElement.classList.add("nogl"); textlinks.forEach(a => a.removeAttribute("tabindex")); });
}
