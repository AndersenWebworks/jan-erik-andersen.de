// Dünne Anbindung des Messkerns (messkern.js) an den Abspieler des Neubaus (seite/abspieler.js, window.__neubau.messung).
// Hier und nur hier stehen die Begriffe dieser Seite: Druckflächen, Einstellungen, Anordnung breit/hochkant. Wird vom Baubefehl in die Seite geladen
// (werkzeug/browser.mjs, Adresse /werkzeug/bildpruefung/anbindung-neubau.js), nicht von der Seite selbst.
import * as THREE from "three";
import { messen } from "./messkern.js";

const kette = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };

export async function neubauMessung(nb, auftrag, opt = {}) {
  const szene = auftrag.szene, B = auftrag.bild || {}, art = nb.art;
  const k0 = nb.messung(szene, 0), A = k0.A, pal = A.meta.pal || {};
  const farbe = c => (pal && pal[c]) || c;
  const einst = A.meta.einstellungen || [];

  // Zeitpunkte: Zahl | "einstellungen" | Name (Anfang) einer Einstellung | { breit: [...], hochkant: [...] } | fehlt -> Standard
  const bilder = (bei, standard) => {
    let l = bei ?? standard;
    if (l && !Array.isArray(l) && typeof l === "object") l = ("breit" in l || "hochkant" in l) ? l[art] : standard;
    const aus = [];
    for (const x of [].concat(l ?? [])) {
      if (typeof x === "number") aus.push({ zeit: x, name: `Bild ${x}` });
      else if (x === "einstellungen") einst.forEach(s => aus.push({ zeit: s.bild, name: `${s.name} (Bild ${s.bild})` }));
      else if (typeof x === "string") { const s = einst.find(s => s.name === x || s.name.startsWith(x)); if (s) aus.push({ zeit: s.bild, name: `${s.name} (Bild ${s.bild})` }); else throw new Error("Einstellung nicht gefunden: " + x); }
    }
    return aus;
  };
  const lesebilder = e => { const s = new Set(); for (const n of e.flaechen) (((A.sz.druckflaechen || {})[n] || {}).pruefen || {}).bilder?.forEach(b => s.add(b)); return [...s].sort((a, b) => a - b); };
  const fuerArt = l => (l || []).filter(e => !e.nur || e.nur === art);
  const d = {
    teile: B.teile || {},
    anschnitt: fuerArt(B.wichtig).map(e => ({ ...e, bei: bilder(e.bei, "einstellungen") })),
    verdeckung: fuerArt(B.sichtbar).map(e => ({ ...e, bei: bilder(e.bei, [0]) })),
    bildschirme: fuerArt(B.bildschirme).map(e => ({ ...e, bei: bilder(e.bei, lesebilder(e)) })),
    regeln: fuerArt(B.regeln).map(e => ({ ...e, bei: bilder(e.bei, [A.frames]) })),
  };

  const z = {
    THREE, wurzel: A.root, welt: k0.welt, kamera: A.camKnoten,
    stelle: f => { nb.messung(szene, f); },
    name: o => (o.userData && o.userData.name) || o.name,
    hilfsgeometrie: o => !!(o.userData && (o.userData.bau || o.userData.neubau_rolle === "bau" || o.userData.neubau_rolle === "schiene")) || o.name === "Boden" || (o.material && o.material.side === THREE.BackSide),
    flaeche: name => {
      const dr = A.druck[name]; if (!dr) return null;
      const M = dr.mesh.matrixWorld, P = dr.P;
      const p00 = P["00"].clone().applyMatrix4(M), p10 = P["10"].clone().applyMatrix4(M), p01 = P["01"].clone().applyMatrix4(M), p11 = p10.clone().add(p01).sub(p00);
      // Vorderseite laut Dreiecksorientierung (gegen den Uhrzeigersinn) der Fläche
      const pos = dr.mesh.geometry.attributes.position, idx = dr.mesh.geometry.index;
      const [a, b, c] = [0, 1, 2].map(i => new THREE.Vector3().fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(M));
      const nTri = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
      const n = new THREE.Vector3().crossVectors(p10.clone().sub(p00), p01.clone().sub(p00)).normalize();
      if (n.dot(nTri) < 0) n.negate();
      return {
        ecken: [p00, p10, p11, p01], normale: n,
        eigene: [dr.mesh, dr.mesh.parent].filter(o => o && o.isMesh),
        sichtbar: () => kette(dr.mesh),
        punkte: () => {
          const w = (x, y) => P["00"].clone().add(P["10"].clone().sub(P["00"]).multiplyScalar(x / dr.w)).add(P["01"].clone().sub(P["00"]).multiplyScalar(y / dr.h)).applyMatrix4(M);
          const l = []; for (const zl of dr.zeilen) for (const fx of [0, .25, .5, .75, 1]) for (const fy of [0, 1]) l.push(w(zl.x + zl.w * fx, zl.y + zl.h * fy));
          return l;
        },
        ebenen: zeit => ({ quellen: (!dr.def.einblenden || zeit >= dr.def.einblenden[1]) ? [{ quelle: dr.tex.image, hintergrund: farbe(dr.def.grund) }] : [], erwartet: 1 }),
      };
    },
  };
  const r = await messen(z, d, opt);
  r.format = art; r.ansicht = [nb.breite, nb.hoehe];
  return r;
}
