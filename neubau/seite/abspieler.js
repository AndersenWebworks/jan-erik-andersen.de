// Abspieler des Neubaus: spielt eine Folge von Szenen und Übergängen (je ein glb aus Blender) beim Scrollen vor und zurück.
// Blender liefert Form, Animation, Kamera und leere, benannte Druckflächen ("druck:<name>", Maße in den Extras). Hier entsteht der Rest:
//   - Welt: alle Teile der Folge stehen zugleich in einer gemeinsamen Welt. Szene B ist gegenüber Szene A starr verschoben und gedreht
//     (Placement aus dem Übergangsstück), so dass Eingang und Ausgang an den Nahtstellen exakt aufeinanderfallen. Die Kamera gehört
//     dem jeweils aktiven Abschnitt; an den Nähten haben beide dieselbe Pose, also kein Sprung.
//   - Licht wie in Blender, ein Boden und ein Himmelsverlauf, die der Kamera folgen (weicher Horizont), Schatten der Sonne folgt dem Blickpunkt
//   - Schiene: die ganze Bahn des Fadens ist vorher hellgrau sichtbar, hinter dem Punkt rot gefüllt (Füllstand = Scrollfortschritt, exakt am Punkt)
//   - Druck: der Text aus den Szenendateien (assets/<name>.szene.js) wird beim Laden mit Canvas gezeichnet (Schriften aus ./schriften)
//     und als Textur auf die Druckflächen gelegt, mit Einblenden zum genannten Zeitpunkt
//   - Lage: Versatz und Drehung der Gegenstände aus der Szenendatei werden ohne Blender übernommen (Gruppenknoten)
//   - Textprüfung im Browser: window.__neubau.pruefeText("<szene>:<fläche>", bild), Nahtmessung: window.__neubau.messeNaht()
// Anker #p=0.4 setzt den Fortschritt (0..1 über die ganze Folge), #g=123 das globale Bild.
import * as THREE from "three";
import { GLTFLoader } from "./vendor/addons/loaders/GLTFLoader.js";

const sichtbarKette = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };   // sichtbar heißt: der Knoten und alle Eltern (Startbild blendet Gruppen aus)
const lies = s => { try { return typeof s === "string" ? JSON.parse(s) : s || null; } catch { return null; } };
const smm = x => { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
const farbe = (pal, c) => (pal && pal[c]) || c;
// Werte der Szenendatei können je Anordnung getrennt stehen: { "breit": a, "hochkant": b }
const je = (v, art) => (v && typeof v === "object" && !Array.isArray(v) && ("breit" in v || "hochkant" in v)) ? v[art] : v;
const aufloesen = (el, art) => Object.fromEntries(Object.entries(el).map(([k, v]) => [k, je(v, art)]));

// ---------------------------------------------------------------- Schriften und Text
const SCHRIFTEN = {
  "grotesk": { familie: "Schibsted Grotesk", datei: "SchibstedGrotesk.ttf", stil: "normal" },
  "serif": { familie: "Newsreader", datei: "Newsreader.ttf", stil: "normal" },
  "serif-kursiv": { familie: "Newsreader", datei: "NewsreaderItalic.ttf", stil: "italic" },
  "serif-titel": { familie: "Newsreader Titel", datei: "NewsreaderTitel.ttf", stil: "normal" },
  // Schriften der heutigen Seite (Mockup auf Monitor und Smartphone): Inter (variabel, 400 bis 700), JetBrains Mono
  "inter": { familie: "Inter", datei: "Inter.woff2", stil: "normal", gewicht: "400 700" },
  "mono": { familie: "JetBrains Mono", datei: "JetBrainsMono.ttf", stil: "normal", gewicht: "500" },
};
const schriftString = (name, px, gewicht) => { const s = SCHRIFTEN[name || "grotesk"]; return `${s.stil} ${gewicht || (s.gewicht || "400").split(" ")[0]} ${px}px "${s.familie}"`; };
const geladen = new Set();
async function schriftenLaden(namen, ordner) {
  await Promise.all([...namen].filter(n => !geladen.has(n)).map(async n => {
    const s = SCHRIFTEN[n];
    const f = new FontFace(s.familie, `url(${new URL(s.datei, ordner).href})`, { style: s.stil, weight: s.gewicht || "400" });
    document.fonts.add(await f.load());
    geladen.add(n);
  }));
}

// Zeilenumbruch und Lage der Zeilen in Einheiten der Druckfläche (unabhängig von der Pixeldichte, gemessen bei REF px).
// Versalhöhe (0,72 em) mittig in der Zeilenhöhe; Kästen der Zeilen für die Textprüfung.
const REF = 200;
// Text eines Elements: direkt (text/absaetze) oder als Verweis auf den Block "texte" der Szenendatei (ref): der Wortlaut steht nur einmal
function textVon(el, texte) {
  if (el.ref != null) { const t = (texte || {})[el.ref]; return Array.isArray(t) ? t : [t]; }
  return el.absaetze || [el.text];
}
function textSetzen(el, w, h, ctx, texte) {
  const size = el.groesse, lh = (el.zeilenhoehe ?? 1.3) * size, gap = (el.abstand ?? .6) * size;
  const x0 = el.x ?? el.rand ?? 0, maxw = el.breite ?? (w - 2 * x0);
  ctx.font = schriftString(el.schrift, REF, el.gewicht);
  ctx.letterSpacing = (el.laufweite || 0) * REF + "px";     // Laufweite in em (Kicker der Seite)
  const breite = s => ctx.measureText(s).width / REF * size;
  const absaetze = textVon(el, texte).map(a => el.versal ? a.toLocaleUpperCase("de-DE") : a);
  const zl = [];
  absaetze.forEach((a, i) => {
    let cur = "", j = 0;
    const ab = () => { zl.push({ text: cur, gap: i > 0 && j === 0 ? gap : 0 }); j++; };
    for (const wort of a.split(/\s+/).filter(Boolean)) {
      const probe = cur ? cur + " " + wort : wort;
      if (cur && breite(probe) > maxw) { ab(); cur = wort; } else cur = probe;
    }
    if (cur) ab();
  });
  let y = el.y ?? 0;
  const boxen = zl.map(z => {
    y += z.gap;
    const bw = breite(z.text), a = el.ausrichtung || "links";
    const x = a === "mitte" ? x0 + (maxw - bw) / 2 : a === "rechts" ? x0 + maxw - bw : x0;
    const base = y + (lh + size * .7) / 2;
    y += lh;
    return { text: z.text, x, base, y: base - size * .72, w: bw, h: size * .72, em: size };
  });
  if (el.senkrecht === "mitte" && boxen.length) {
    const hoehe = (boxen.at(-1).y + boxen.at(-1).h + size * .25) - (boxen[0].y - size * .25);
    const dy = (h - hoehe) / 2 - (boxen[0].y - size * .25);
    for (const b of boxen) { b.y += dy; b.base += dy; }
  }
  return boxen;
}

// Bilder der Szenendatei (Element "bild", z. B. das Portrait im Mockup), vor dem Zeichnen geladen
const BILDER = new Map();
async function bilderLaden(sz, art, ordner) {
  const urls = new Set();
  for (const fl of Object.values(sz.druckflaechen || {})) for (const roh of fl.elemente || []) { const el = aufloesen(roh, art); if (el.typ === "bild" && !(el.anordnung && el.anordnung !== art)) urls.add(el.quelle); }
  await Promise.all([...urls].filter(u => !BILDER.has(u)).map(u => new Promise(ok => {
    // crossOrigin: in der abgeschotteten Webchat-Vorschau ist die Seite fremder Herkunft; ohne CORS-Bild wäre die Druckfläche „verschmutzt“ und WebGL verweigert die Textur
    const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { BILDER.set(u, im); ok(); }; im.onerror = () => ok(); im.src = new URL(u, ordner).href;
  })));
}

// Zeichnet eine Druckfläche (Grund, Linien, Text) auf ein Canvas; ppu = Pixel je Einheit.
function druckZeichnen(def, w, h, ppu, pal, mess, art, texte) {
  const cv = document.createElement("canvas");
  cv.width = Math.max(4, Math.round(w * ppu)); cv.height = Math.max(4, Math.round(h * ppu));
  const ctx = cv.getContext("2d");
  if (!def.transparent) { ctx.fillStyle = farbe(pal, def.grund); ctx.fillRect(0, 0, cv.width, cv.height); }   // Überlagerungen bleiben durchsichtig, wo nichts steht
  const zeilen = [];
  for (const roh of def.elemente || []) {
    const el = aufloesen(roh, art);
    if (el.anordnung && el.anordnung !== art) continue;     // Element nur für eine Anordnung (breit oder hochkant)
    if (el.typ === "rechteck") {
      const x = el.x * ppu, y = el.y * ppu, bw = el.breite * ppu, bh = el.hoehe * ppu, r = Math.min((el.radius || 0) * ppu, bw / 2, bh / 2);
      ctx.beginPath(); ctx.roundRect(x, y, bw, bh, r);
      if (el.fuellung) { ctx.fillStyle = farbe(pal, el.fuellung); ctx.fill(); }
      if (el.strich) { ctx.strokeStyle = farbe(pal, el.strich); ctx.lineWidth = Math.max(1, (el.strichbreite || .006) * ppu); ctx.stroke(); }
    } else if (el.typ === "bild") {
      const im = BILDER.get(el.quelle);
      if (im) {
        const x = el.x * ppu, y = el.y * ppu, bw = el.breite * ppu, bh = el.hoehe * ppu, r = Math.min((el.radius || 0) * ppu, bw / 2, bh / 2);
        ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, bw, bh, r); ctx.clip();
        const k = Math.max(bw / im.width, bh / im.height), dw = im.width * k, dh = im.height * k;     // füllend, mittig beschnitten (object-fit: cover)
        ctx.drawImage(im, x + (bw - dw) / 2, y + (bh - dh) / 2, dw, dh); ctx.restore();
        if (el.strich) { ctx.beginPath(); ctx.roundRect(x, y, bw, bh, r); ctx.strokeStyle = farbe(pal, el.strich); ctx.lineWidth = Math.max(1, (el.strichbreite || .006) * ppu); ctx.stroke(); }
      }
    } else if (el.typ === "kreis") {
      ctx.beginPath(); ctx.arc(el.x * ppu, el.y * ppu, el.radius * ppu, 0, Math.PI * 2);
      if (el.fuellung) { ctx.fillStyle = farbe(pal, el.fuellung); ctx.fill(); }
      if (el.strich) { ctx.strokeStyle = farbe(pal, el.strich); ctx.lineWidth = Math.max(1, (el.strichbreite || .006) * ppu); ctx.stroke(); }
    } else if (el.typ === "linie") {
      ctx.strokeStyle = farbe(pal, el.farbe); ctx.lineWidth = Math.max(1, el.breite * ppu); ctx.lineCap = "butt";
      ctx.beginPath(); ctx.moveTo(el.von[0] * ppu, el.von[1] * ppu); ctx.lineTo(el.bis[0] * ppu, el.bis[1] * ppu); ctx.stroke();
    } else if (el.typ === "text" || el.typ === "absaetze") {
      const boxen = textSetzen(el, w, h, mess, texte);
      ctx.fillStyle = farbe(pal, el.farbe); ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.fontKerning = "normal";
      ctx.font = schriftString(el.schrift, el.groesse * ppu, el.gewicht);
      ctx.letterSpacing = (el.laufweite || 0) * el.groesse * ppu + "px";
      for (const b of boxen) ctx.fillText(b.text, b.x * ppu, b.base * ppu);
      ctx.letterSpacing = "0px";
      zeilen.push(...boxen);
    }
  }
  return { cv, zeilen };
}

// Einblenden: der Druck erscheint weich zwischen zwei Bildnummern (vorher nur die Grundfarbe), wie der Einblend-Knoten in Blender
function einblendenAlpha(m, uFrame, f0, f1, ebene) {
  // Überlagerung mit Alphakanal: die ganze Fläche (Karte, Text) erscheint weich zwischen f0 und f1
  m.transparent = true; m.opacity = 1; m.depthWrite = false; m.alphaTest = 0; m.polygonOffset = true; m.polygonOffsetFactor = -2 - ebene; m.polygonOffsetUnits = -2 - ebene;
  m.onBeforeCompile = sh => {
    sh.uniforms.uFrame = uFrame;
    sh.fragmentShader = "uniform float uFrame;\n" + sh.fragmentShader.replace("#include <map_fragment>",
      `#include <map_fragment>
       diffuseColor.a *= ${f0 === null ? "1.0" : `smoothstep(${f0.toFixed(1)}, ${f1.toFixed(1)}, uFrame)`};`);
  };
  m.customProgramCacheKey = () => `ea${f0}_${f1}`;
  m.needsUpdate = true;
}
function einblenden(m, uFrame, f0, f1, grund) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uFrame = uFrame; sh.uniforms.uGrund = { value: grund };
    sh.fragmentShader = "uniform float uFrame; uniform vec3 uGrund;\n" + sh.fragmentShader.replace("#include <map_fragment>",
      `#include <map_fragment>
       float kk = smoothstep(${f0.toFixed(1)}, ${f1.toFixed(1)}, uFrame);
       diffuseColor.rgb = mix(uGrund, diffuseColor.rgb, kk);`);
  };
  m.customProgramCacheKey = () => `ein${f0}_${f1}`;
  m.needsUpdate = true;
}

// Blender-Koordinaten (z oben) -> three (y oben)
const b2t = (x, y, z) => new THREE.Vector3(x, z, -y);
function gruppenMatrix(pivot, versatz, drehungZ) {
  const p = b2t(...pivot), v = b2t(...versatz);
  return new THREE.Matrix4().makeTranslation(v.x, v.y, v.z)
    .multiply(new THREE.Matrix4().makeTranslation(p.x, p.y, p.z))
    .multiply(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(drehungZ)))
    .multiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
}
const setzeMatrix = (node, M) => { node.matrix.copy(M); node.matrix.decompose(node.position, node.quaternion, node.scale); node.updateMatrix(); };
// starre Verschiebung der Ebene (Blender x, y) samt Drehung um die senkrechte Achse (Grad, links herum von oben) -> three-Matrix
const platzMatrix = (vx, vy, grad) => new THREE.Matrix4().makeTranslation(vx, 0, -vy).multiply(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(grad)));

// ---------------------------------------------------------------- Abspielen
export async function spieleFolge(buehne, folge, opt = {}) {
  const canvas = buehne.querySelector("canvas");
  const handy = Math.min(innerWidth, innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  const dpr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;          // Blender: Ansichtstransformation „Khronos PBR Neutral“
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const schriftOrdner = new URL(opt.schriften || "./schriften/", import.meta.url);
  const loader = new GLTFLoader();

  let art = null;               // "breit" | "hochkant"
  let welt = null;              // THREE.Scene mit allen Abschnitten
  let abschnitte = [];          // Abschnitt: { name, art, start, frames, root, meta, camKnoten, mixer, uFrame, druck, bloecke, punkte, schienen, ... }
  let sonne = null, boden = null, himmel = null, gesamt = 0;
  let ziel = 0, ist = 0, neu = true, letzt = performance.now();
  const fps = { n: 0, t: performance.now(), wert: 0 };
  const strecke = buehne.parentElement;

  async function abschnittLaden(seg, start) {
    const t0 = performance.now();
    const daten = seg.daten ? import(seg.daten).then(m => m.default) : Promise.resolve(null);
    const [gltf, sz] = await Promise.all([loader.loadAsync(seg.glb[art]), daten]);
    const scene = gltf.scene;
    const meta = lies(scene.userData.neubau) || {};
    const A = { name: seg.name, art: seg.art || "szene", start, frames: meta.frames || 380, root: scene, meta, sz, gltf, ladezeit: performance.now() - t0,
                uFrame: { value: 0 }, druck: {}, bloecke: [], punkte: [], schienen: [], lastF: null, bodenNode: null };
    scene.name = "abschnitt_" + seg.name;
    const druckNodes = {}, bloeckeNodes = [], gruppenNodes = {};
    scene.traverse(o => {
      const nodeInfo = lies(o.userData.neubau);
      if (nodeInfo) {
        if (nodeInfo.druck) druckNodes[nodeInfo.druck] = { mesh: o, info: nodeInfo };
        if (nodeInfo.block) bloeckeNodes.push({ node: o, info: nodeInfo });
        if (nodeInfo.gruppe) gruppenNodes[nodeInfo.gruppe] = o;
      }
      if (o.userData.neubau_rolle === "punkt") A.punkte.push(o);
      if (o.name === "Boden") A.bodenNode = o;
      if (!o.isMesh) return;
      const m = o.material, info = lies(m.userData && m.userData.neubau) || {};
      if (m.map) { m.map.anisotropy = aniso; m.map.needsUpdate = true; }
      if (info.bau) {
        // Bau-Linien: Sichtbarkeit je Ecke aus _ein/_aus/_deck gegen die Bildnummer (wie der Treiber in Blender)
        const bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(info.tinte), transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
        bm.onBeforeCompile = sh => {
          sh.uniforms.uFrame = A.uFrame;
          sh.vertexShader = "attribute float _ein; attribute float _aus; attribute float _deck; varying float vEin; varying float vAus; varying float vDeck;\n" +
            sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vEin = _ein; vAus = _aus; vDeck = _deck;");
          sh.fragmentShader = `uniform float uFrame; varying float vEin; varying float vAus; varying float vDeck;\n` +
            sh.fragmentShader.replace("#include <alphatest_fragment>",
              `float an = clamp((uFrame - vEin) / ${info.zeichnen.toFixed(3)}, 0.0, 1.0);
               float weg = clamp((uFrame - vAus) / ${info.aus_dauer.toFixed(3)}, 0.0, 1.0);
               diffuseColor.a *= clamp(an * (1.0 - weg) * vDeck, 0.0, 1.0);
               if (diffuseColor.a < .003) discard;
               #include <alphatest_fragment>`);
        };
        o.material = bm; o.castShadow = false; o.receiveShadow = false; o.renderOrder = 2; o.userData.bau = true;
        return;
      }
      if (info.schiene) {
        // Schiene: Bogenlänge _s je Ecke; hinter dem Punkt (uFill) rot, davor hellgrau; flach auf dem Papier, nicht erhaben
        const uFill = { value: -1 };
        const sm = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
        const grau = new THREE.Color(info.grau), rot = new THREE.Color(info.rot);
        sm.onBeforeCompile = sh => {
          sh.uniforms.uFill = uFill; sh.uniforms.uGrau = { value: grau }; sh.uniforms.uRot = { value: rot };
          sh.vertexShader = "attribute float _s; varying float vS;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vS = _s;");
          sh.fragmentShader = "uniform float uFill; uniform vec3 uGrau; uniform vec3 uRot; varying float vS;\n" +
            sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb = mix(uGrau, uRot, 1.0 - smoothstep(uFill - 0.004, uFill + 0.004, vS));");
        };
        sm.customProgramCacheKey = () => "schiene";
        o.material = sm; o.castShadow = false; o.receiveShadow = false; o.renderOrder = 1;
        A.schienen.push({ mesh: o, uFill, laenge: (lies(o.userData.neubau_schiene) || {}).laenge || 0 });
        return;
      }
      if (info.unbeleuchtet) {
        o.material = new THREE.MeshBasicMaterial({ map: m.emissiveMap || m.map, color: m.emissiveMap || m.map ? 0xffffff : m.emissive });
        o.receiveShadow = false; o.castShadow = false;
        return;
      }
      o.castShadow = true; o.receiveShadow = true;
      if (info.einblenden) einblenden(m, A.uFrame, info.einblenden[0], info.einblenden[1], new THREE.Color(info.farbe));
    });

    // ---------- Lage: Gruppenknoten aus der Szenendatei, Blöcke mitführen ----------
    const gruppen = {};
    for (const [n, node] of Object.entries(gruppenNodes)) {
      const gb = (meta.gruppen || {})[n]; if (!gb) continue;
      const baked = gruppenMatrix(gb.pivot, gb.versatz || [0, 0, 0], gb.drehung_z || 0);
      const sd = sz && sz.gegenstaende && sz.gegenstaende[n];
      const neuM = sd ? gruppenMatrix(gb.pivot, sd.versatz || [0, 0, 0], sd.drehung_z || 0) : baked.clone();
      if (!neuM.equals(baked)) setzeMatrix(node, neuM);
      gruppen[n] = { baked, neu: neuM, geaendert: !neuM.equals(baked) };
    }
    const delta = n => { const g = gruppen[n]; const M = g ? g.neu.clone().multiply(g.baked.clone().invert()) : new THREE.Matrix4(); const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); M.decompose(p, q, s); return { p, q, geaendert: !!(g && g.geaendert) }; };
    for (const { node, info } of bloeckeNodes) {
      const a = delta(info.start), b = delta(info.ende);
      if (!a.geaendert && !b.geaendert) continue;
      const g = new THREE.Group(); g.name = "lage_" + node.name;
      node.parent.add(g); g.add(node);
      A.bloecke.push({ g, f0: info.zeit[0], f1: info.zeit[1], a, b });
    }

    // ---------- Druck: Text der Szenendatei auf die Druckflächen ----------
    const t1 = performance.now();
    if (sz && Object.keys(druckNodes).length) {
      const namen = new Set();
      for (const fl of Object.values(sz.druckflaechen)) for (const roh of fl.elemente || []) { const el = aufloesen(roh, art); if (el.anordnung && el.anordnung !== art) continue; if (el.schrift) namen.add(el.schrift); else if (el.typ === "text" || el.typ === "absaetze") namen.add("grotesk"); }
      await bilderLaden(sz, art, new URL("./", import.meta.url));
      await schriftenLaden(namen, schriftOrdner);
      await Promise.all([...namen].map(n => document.fonts.load(schriftString(n, 20))));
      const mess = document.createElement("canvas").getContext("2d");
      const maxTex = Math.min(renderer.capabilities.maxTextureSize, 4096);
      const pal = meta.pal || {};
      for (const [name, { mesh, info }] of Object.entries(druckNodes)) {
        const def = sz.druckflaechen[name]; if (!def) continue;
        const ppu = Math.min((def.aufloesung || 400) * dpr, maxTex / Math.max(info.w, info.h));
        const { cv, zeilen } = druckZeichnen(def, info.w, info.h, ppu, pal, mess, art, sz.texte);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; tex.anisotropy = aniso;
        tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        const m = mesh.material;
        m.map = tex; m.color.set(0xffffff);
        // kein Polygon-Offset: die Fläche liegt 1 mm über dem Karton, die Bleistiftspur (2,5 mm) darüber bleibt sichtbar
        if (def.transparent) { einblendenAlpha(m, A.uFrame, def.einblenden ? def.einblenden[0] : null, def.einblenden ? def.einblenden[1] : null, def.ebene || 0); mesh.renderOrder = 3 + (def.ebene || 0); mesh.receiveShadow = false; }
        else if (def.einblenden) einblenden(m, A.uFrame, def.einblenden[0], def.einblenden[1], new THREE.Color(farbe(pal, def.grund)));
        else { m.onBeforeCompile = () => {}; m.customProgramCacheKey = () => "druck"; m.needsUpdate = true; }
        mesh.castShadow = false; if (!def.transparent) mesh.receiveShadow = true;
        // Abbildung Druckkoordinate -> Welt über die UV der Fläche (u = x / w, v = y / h, Bild oben links)
        const pos = mesh.geometry.attributes.position, uv = mesh.geometry.attributes.uv, P = {};
        for (let i = 0; i < pos.count; i++) P[Math.round(uv.getX(i)) + "" + Math.round(uv.getY(i))] = new THREE.Vector3().fromBufferAttribute(pos, i);
        A.druck[name] = { mesh, w: info.w, h: info.h, zeilen, tex, def, ppu, P, px: [cv.width, cv.height] };
      }
    }
    A.druckzeit = performance.now() - t1;
    A.camKnoten = gltf.cameras.find(c => c.name === (meta.kamera && meta.kamera.name)) || gltf.cameras[0];
    A.mixer = new THREE.AnimationMixer(scene);
    for (const clip of gltf.animations) A.mixer.clipAction(clip).play();
    A.clipDauer = Math.max(0, ...gltf.animations.map(c => c.duration));
    A.dauer = A.frames / (meta.fps || 24);
    A.fadenS = meta.faden_s || null;
    return A;
  }

  async function laden(neueArt) {
    art = neueArt;
    if (welt) { welt.traverse(o => { if (o.isMesh) { o.geometry && o.geometry.dispose(); } }); }
    welt = new THREE.Scene();
    // Abschnitte laden (parallel), Platzierung nacheinander
    const starts = [];
    let s = 0;
    const roh = await Promise.all(folge.segmente.map(async seg => ({ seg, A: await abschnittLaden(seg, 0) })));
    abschnitte = roh.map(r => r.A);
    for (const A of abschnitte) { A.start = s; s += A.frames; }
    gesamt = s;
    // Platzierung: Szene nach einem Übergang sitzt dort, wo der Übergang endet (meta.uebergang.ziel); Übergänge teilen das Bezugssystem ihrer Vorgängerszene
    let T = new THREE.Matrix4();
    abschnitte.forEach((A, i) => {
      const prev = abschnitte[i - 1];
      if (prev && prev.art === "uebergang" && A.art === "szene") {
        const z = (prev.meta.uebergang && prev.meta.uebergang.ziel) || { versatz: [0, 0], drehung_grad: 0 };
        T = T.clone().multiply(platzMatrix(z.versatz[0], z.versatz[1], z.drehung_grad));
      }
      A.platz = T.clone();
      A.root.matrixAutoUpdate = false; A.root.matrix.copy(A.platz); A.root.matrixWorldNeedsUpdate = true;
      welt.add(A.root);
    });
    // Boden: einer für die ganze Welt, folgt der Kamera (die Boden-Scheiben der Abschnitte werden ausgeblendet)
    const pal = abschnitte[0].meta.pal || {};
    boden = null;
    for (const A of abschnitte) if (A.bodenNode) { if (!boden) boden = A.bodenNode; else A.bodenNode.visible = false; }
    if (boden) { boden.parent.remove(boden); boden.matrixAutoUpdate = true; welt.add(boden); boden.userData.y0 = boden.position.y; boden.matrixAutoUpdate = true; boden.rotation.set(0, 0, 0); boden.scale.set(1, 1, 1); }
    // Himmel: Verlauf vom Horizont (Dunst) zum Zenit, folgt der Kamera
    const hg = new THREE.SphereGeometry(200, 32, 24);
    const c0 = new THREE.Color(pal.dunst || "#f7fbff"), c1 = new THREE.Color(pal.himmel || "#d4e5f6"), cc = new THREE.Color();
    const pos = hg.attributes.position, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 200, t = smm(Math.max(0, y) / ((abschnitte[0].meta.licht || {}).himmel_steil || 1.0)); cc.copy(c0).lerp(c1, t); col.set([cc.r, cc.g, cc.b], i * 3); }
    hg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    himmel = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false }));
    himmel.material.toneMapped = false;   // Dunst bleibt so hell wie angegeben und trifft den Bogen am Horizont ohne Kante
    himmel.renderOrder = -10; himmel.frustumCulled = false;
    welt.add(himmel);
    welt.background = new THREE.Color(pal.dunst || "#f7fbff");
    // Licht aus denselben Werten wie in Blender (basis.LICHT): Sonne + gleichmäßige Umgebung
    const L = abschnitte[0].meta.licht || { sonne: 4, hoehe: 40, richtung: 32, umgebung: .9, umgebung_farbe: "#e2ebf6" };
    const rx = THREE.MathUtils.degToRad(L.hoehe), rz = THREE.MathUtils.degToRad(L.richtung);
    const d = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(rx, 0, rz, "XYZ"));
    const dir = new THREE.Vector3(d.x, d.z, -d.y).normalize();
    sonne = new THREE.DirectionalLight(0xffffff, L.sonne * (opt.sonneFaktor || 1));
    sonne.userData.dir = dir;
    sonne.castShadow = true;
    const SM = handy ? 1024 : 2048;
    sonne.shadow.mapSize.set(SM, SM);
    const sc = sonne.shadow.camera; const R = opt.schattenRadius || 15; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 80;
    sonne.userData.texel = 2 * R / SM;
    sonne.shadow.bias = -.0004; sonne.shadow.normalBias = .02; sonne.shadow.radius = 3;
    welt.add(sonne, sonne.target);
    welt.add(new THREE.AmbientLight(new THREE.Color(L.umgebung_farbe || "#e2ebf6"), L.umgebung * Math.PI * (opt.umgebungFaktor || 1)));
    groesse();
    for (const A of abschnitte) htmlText(A);
    // Shader und Texturen vorab übersetzen/hochladen, damit beim ersten Hinsehen nichts hakt
    try { renderer.compile(welt, abschnitte[0].camKnoten); for (const A of abschnitte) for (const d of Object.values(A.druck)) renderer.initTexture(d.tex); } catch (e) { console.warn(e); }
    strecke.style.setProperty("--bilder", gesamt);
    neu = true;
  }

  // Texte im Dokument (Screenreader, Suchmaschinen) aus denselben Szenendateien: data-szene="<szene>/<fläche>:<nr. des Absatzes>"
  function htmlText(A) {
    if (!A.sz) return;
    const flach = n => n === "texte" ? Object.keys(A.sz.texte || {}) : ((A.sz.druckflaechen[n] || {}).elemente || []).flatMap(e => e.absaetze || (e.text ? [e.text] : []));
    document.querySelectorAll("[data-szene]").forEach(el => {
      const [p, i] = el.dataset.szene.split(":"), [sn, fn] = p.includes("/") ? p.split("/") : [A.name, p];
      if (sn !== A.name) return;
      const t = fn === "texte" ? [].concat((A.sz.texte || {})[i] ?? [])[0] : flach(fn)[+i || 0];
      if (t != null && el.textContent !== t) el.textContent = t;
    });
  }

  function groesse() {
    const w = buehne.clientWidth, h = buehne.clientHeight;
    renderer.setSize(w, h, false);
    if (!abschnitte.length) return;
    for (const A of abschnitte) {
      const cam = A.camKnoten, k = A.meta.kamera || { vfov: 30, aspekt: 16 / 9 };
      const asp = w / h, tV = Math.tan(THREE.MathUtils.degToRad(k.vfov) / 2);
      // Gestaltet für k.aspekt: ist das Fenster schmaler, bleibt die Bildbreite (nichts wird seitlich angeschnitten)
      const tVneu = asp < k.aspekt ? tV * k.aspekt / asp : tV;
      cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(tVneu)); cam.aspect = asp;
      A.verschFaktor = (tV * k.aspekt) / (tVneu * asp);   // NDC-Verschiebung bezogen auf die tatsächliche Bildbreite
      cam.updateProjectionMatrix();
      A.basisProjektion = cam.projectionMatrix.clone();
    }
    neu = true;
  }

  // ---------- Scroll -> globales Bild, weich nachgezogen; kein Scroll-Lock ----------
  function zielAusScroll() {
    const r = strecke.getBoundingClientRect(), weg = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, weg)));
    ziel = p * gesamt;
  }
  function ankerLesen() {
    const m = /[#&]p=([0-9.]+)/.exec(location.hash), g = /[#&]g=([0-9.]+)/.exec(location.hash);
    if (!m && !g) return;
    const p = m ? Math.min(1, Math.max(0, parseFloat(m[1]))) : Math.min(1, Math.max(0, parseFloat(g[1]) / gesamt)), weg = strecke.offsetHeight - innerHeight;
    scrollTo(0, strecke.offsetTop + weg * p);
    zielAusScroll(); ist = ziel; neu = true;
  }
  addEventListener("scroll", zielAusScroll, { passive: true });
  addEventListener("hashchange", ankerLesen);
  addEventListener("resize", () => {
    const a = innerWidth >= innerHeight ? "breit" : "hochkant";
    if (a !== art) laden(a); else groesse();
  });

  const aktivIndex = g => { for (let i = abschnitte.length - 1; i >= 0; i--) if (g >= abschnitte[i].start && (g < abschnitte[i].start + abschnitte[i].frames || i === abschnitte.length - 1)) return i; return 0; };

  // Zustand eines Abschnitts bei lokalem Bild f herstellen (Animation, Einblenden, mitgeführte Blöcke)
  function abschnittAnwenden(A, f) {
    // Startbild: bis zum Bild sz.startbild.bis bleibt alles außer den genannten Teilen (Name, Punkt, Papier) unsichtbar; flache Teile würden bei
    // Kamerahöhe nahe dem Papier als Streifen an der Horizontlinie stehen
    const sb = A.sz && A.sz.startbild;
    if (sb) {
      const zeigen = f >= sb.bis;
      for (const k of A.root.children) if (!k.isCamera && !sb.behalten.includes(k.name) && !(k.userData && k.userData.neubau_rolle === "punkt" && false)) k.visible = zeigen;
    }
    A.mixer.setTime(Math.min(f / (A.meta.fps || 24), A.clipDauer - 1e-4));
    A.uFrame.value = f;
    for (const b of A.bloecke) {
      const e = smm((f - b.f0) / (b.f1 - b.f0));
      b.g.position.lerpVectors(b.a.p, b.b.p, e);
      b.g.quaternion.copy(b.a.q).slerp(b.b.q, e);
    }
  }
  function sLokal(A, f) {
    const a = A.fadenS; if (!a) return -1;
    const i = Math.min(a.length - 2, Math.max(0, Math.floor(f))), k = f - i;
    return a[i] + (a[i + 1] - a[i]) * k;
  }
  // Welt auf globales Bild g stellen; gibt den aktiven Abschnitt zurück
  function anwenden(g) {
    const ai = aktivIndex(g);
    abschnitte.forEach((A, i) => {
      const f = Math.min(A.frames, Math.max(0, g - A.start));
      if (A.lastF !== f) { abschnittAnwenden(A, f); A.lastF = f; }
      for (const p of A.punkte) p.visible = i === ai;
      for (const sch of A.schienen) sch.uFill.value = i < ai ? 1e9 : i > ai ? -1 : sLokal(A, f);
    });
    const A = abschnitte[ai], f = Math.min(A.frames, Math.max(0, g - A.start)), cam = A.camKnoten;
    // Bildverschiebung (Objektivverschiebung) je Bild, linear zwischen den Bildnummern
    const v = A.meta.verschiebung || [];
    cam.projectionMatrix.copy(A.basisProjektion);
    if (v.length) {
      const i = Math.min(v.length - 2, Math.max(0, Math.floor(f))), k = f - i;
      cam.projectionMatrix.elements[8] = (v[i] + (v[i + 1] - v[i]) * k) * (A.verschFaktor || 1);
    }
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    return A;
  }

  const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();
  // Boden, Himmel und Sonnenschatten folgen dem Blickpunkt (Schatten auf das Texelraster gerastet, damit nichts schwimmt)
  function weltNachfuehren(cam) {
    cam.updateWorldMatrix(true, false);
    cam.matrixWorld.decompose(_v, _q, _s);
    himmel.position.copy(_v);
    if (boden) boden.position.set(_v.x, boden.userData.y0, _v.z);
    _f.set(0, 0, -1).applyQuaternion(_q);
    const t = _f.y < -.05 ? Math.min(60, -_v.y / _f.y) : 12;
    const fx = _v.x + _f.x * t * .5, fz = _v.z + _f.z * t * .5;         // Blickpunkt auf dem Papier (halber Weg zum Boden)
    const dir = sonne.userData.dir, tx = sonne.userData.texel;
    _r.set(0, 1, 0).cross(dir).normalize(); _u.copy(dir).cross(_r).normalize();
    const P = new THREE.Vector3(fx, 0, fz);
    const a = Math.round(P.dot(_r) / tx) * tx, b = Math.round(P.dot(_u) / tx) * tx, c = P.dot(dir);
    P.copy(_r).multiplyScalar(a).addScaledVector(_u, b).addScaledVector(dir, c);
    sonne.target.position.copy(P); sonne.position.copy(P).addScaledVector(dir, -30);
    sonne.target.updateMatrixWorld();
  }

  function bild(now) {
    requestAnimationFrame(bild);
    const dt = Math.min(.1, (now - letzt) / 1000); letzt = now;
    if (!abschnitte.length) return;
    const vorher = ist;
    ist += (ziel - ist) * (1 - Math.exp(-dt * (opt.nachziehen || 6)));
    if (Math.abs(ziel - ist) < .002) ist = ziel;
    if (ist === vorher && !neu) return;
    neu = false;
    const A = anwenden(ist);
    welt.updateMatrixWorld(true);
    weltNachfuehren(A.camKnoten);
    renderer.render(welt, A.camKnoten);
    fps.n++;
    if (now - fps.t > 1000) { fps.wert = fps.n * 1000 / (now - fps.t); fps.n = 0; fps.t = now; }
  }

  // ---------- Textprüfung im Browser ----------
  // "<szene>:<fläche>" (oder nur "<fläche>": die erste Szene mit dieser Fläche), Bild lokal zur Szene. Je Zeile: Höhe des Gevierts in CSS-Pixeln
  // (Versalhöhe / 0,72), im Bild, nicht verdeckt (Strahl von der Kamera trifft zuerst die Fläche bzw. ihren Träger), Zeile liegt auf der Fläche.
  function pruefeText(name, frame) {
    let sn = null, fn = name;
    if (name.includes(":")) [sn, fn] = name.split(":");
    const A = abschnitte.find(a => (!sn || a.name === sn) && a.druck[fn]);
    if (!A) return { zeilen: 0, min_em_px: 0, verdeckt: 0, ausserhalb: 0, auf_flaeche: false, gezeichnet: false, eingeblendet: false };
    const d = A.druck[fn];
    const f = frame ?? Math.max(0, ist - A.start);
    const aktiv = anwenden(A.start + f);
    welt.updateMatrixWorld(true);
    weltNachfuehren(aktiv.camKnoten);
    const cam = aktiv.camKnoten; cam.updateMatrixWorld(true);
    const inv = cam.matrixWorld.clone().invert(), camp = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
    const W = buehne.clientWidth, H = buehne.clientHeight, rand = .02;
    const welt_ = (x, y) => {
      const u = x / d.w, v = y / d.h, P = d.P;
      return P["00"].clone().add(P["10"].clone().sub(P["00"]).multiplyScalar(u)).add(P["01"].clone().sub(P["00"]).multiplyScalar(v)).applyMatrix4(d.mesh.matrixWorld);
    };
    const proj = p => { const v = p.clone().applyMatrix4(inv); const tiefe = -v.z; v.applyMatrix4(cam.projectionMatrix); return { x: (v.x + 1) / 2, y: (v.y + 1) / 2, tiefe }; };
    const verdecker = [];
    welt.traverse(o => { if (o.isMesh && !o.userData.bau && o !== d.mesh && o !== d.mesh.parent && sichtbarKette(o) && o.material && o.material.opacity !== 0 && o.userData.neubau_rolle !== "schiene" && o !== boden && o !== himmel) verdecker.push(o); });
    const rc = new THREE.Raycaster();
    const erg = { bild: f, zeilen: d.zeilen.length, min_em_px: 1e9, verdeckt: 0, ausserhalb: 0, auf_flaeche: true, details: [] };
    for (const zl of d.zeilen) {
      let aus = 0, verd = 0;
      for (const fx of [0, .25, .5, .75, 1]) for (const fy of [0, 1]) {
        const p = welt_(zl.x + zl.w * fx, zl.y + zl.h * fy), c = proj(p);
        if (!(c.x >= rand && c.x <= 1 - rand && c.y >= rand && c.y <= 1 - rand && c.tiefe > 0)) aus++;
        const dv = p.clone().sub(camp), L = dv.length();
        rc.set(camp, dv.normalize()); rc.far = L - .01;
        if (rc.intersectObjects(verdecker, false).length) verd++;
      }
      const t = proj(welt_(zl.x + zl.w / 2, zl.y)), b = proj(welt_(zl.x + zl.w / 2, zl.y + zl.h));
      const em = Math.abs(t.y - b.y) * H / .72;
      if (zl.x < -1e-6 || zl.y < -1e-6 || zl.x + zl.w > d.w + 1e-6 || zl.y + zl.h > d.h + 1e-6) erg.auf_flaeche = false;
      erg.details.push({ text: zl.text, w: +zl.w.toFixed(4), em_px: +em.toFixed(1), ausserhalb: aus, verdeckt: verd });
      erg.min_em_px = Math.min(erg.min_em_px, em); erg.verdeckt += verd; erg.ausserhalb += aus;
    }
    erg.min_em_px = +erg.min_em_px.toFixed(1);
    const schriftenOk = d.def.elemente.every(el => (el.anordnung && el.anordnung !== art) || !(el.typ === "text" || el.typ === "absaetze") || document.fonts.check(schriftString(el.schrift, 20)));
    erg.gezeichnet = !!(d.mesh.material.map === d.tex && schriftenOk && d.zeilen.length);
    erg.eingeblendet = !d.def.einblenden || f >= d.def.einblenden[1];
    erg.viewport = [W, H]; erg.textur = d.px;
    erg.saetze = d.zeilen.map(zl => zl.text).join(" ");
    return erg;
  }

  // ---------- Messhaken für die Bildprüfung (werkzeug/bildpruefung, nur vom Baubefehl benutzt) ----------
  // Stellt Szene `name` auf das lokale Bild f (Animation, Einblenden, Kamera samt Objektivverschiebung) und gibt Abschnitt, Welt und Kamera zurück.
  function messung(name, f) {
    const A = abschnitte.find(a => a.name === name) || abschnitte[0];
    abschnitte.forEach(a => { a.lastF = null; });         // erzwingt neues Anwenden (Prüfungen dürfen die Welt zwischendurch verändert haben)
    const aktiv = anwenden(A.start + f);
    welt.updateMatrixWorld(true);
    weltNachfuehren(aktiv.camKnoten);
    aktiv.camKnoten.updateMatrixWorld(true);
    return { A: aktiv, welt, cam: aktiv.camKnoten };
  }

  // ---------- Nahtmessung ----------
  // An jeder Nahtstelle zwischen zwei Abschnitten: Kamerapose (Ort, Blickrichtung, Bildverschiebung, Öffnungswinkel), Punkt und Schiene
  // (Richtung und Krümmung links und rechts der Naht), alles in Weltkoordinaten, gemessen an der gebauten Welt.
  function posen(A, f) {
    anwenden(A.start + f); welt.updateMatrixWorld(true);
    const cam = A.camKnoten; cam.updateWorldMatrix(true, false);
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    cam.matrixWorld.decompose(p, q, s);
    const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    const v = A.meta.verschiebung || [], vi = Math.min(v.length - 1, Math.max(0, Math.round(f)));
    const hor = new THREE.Vector3(1, 0, 0).applyQuaternion(q), rollen = Math.asin(Math.max(-1, Math.min(1, hor.y)));
    const punkt = A.punkte[0] ? new THREE.Vector3().setFromMatrixPosition(A.punkte[0].matrixWorld) : null;
    return { ort: p.toArray(), blick: fw.toArray(), q: q.toArray(), verschiebung: v[vi] ?? 0, vfov: A.meta.kamera && A.meta.kamera.vfov, rollen_grad: THREE.MathUtils.radToDeg(rollen), punkt: punkt && punkt.toArray() };
  }
  function schienenRand(A, ende) {
    const sch = A.schienen[0]; if (!sch) return null;
    const pos = sch.mesh.geometry.attributes.position, n = pos.count / 2;
    sch.mesh.updateWorldMatrix(true, false);
    // Mittellinie der Schiene in Weltkoordinaten der Ebene (Blender x, y)
    const mitte = i => { const p = new THREE.Vector3().fromBufferAttribute(pos, 2 * i).add(new THREE.Vector3().fromBufferAttribute(pos, 2 * i + 1)).multiplyScalar(.5).applyMatrix4(sch.mesh.matrixWorld); return [p.x, -p.z]; };
    const st = Math.max(1, Math.round(.12 * n / (sch.laenge || n)));
    const Q = ende ? [n - 1 - 2 * st, n - 1 - st, n - 1].map(mitte) : [0, st, 2 * st].map(mitte);   // in Laufrichtung
    const rich = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI;                     // Grad, 0 = nach +y, 90 = nach +x
    const [a, b, c] = Q, ab = [b[0] - a[0], b[1] - a[1]], bc = [c[0] - b[0], c[1] - b[1]], ca = [a[0] - c[0], a[1] - c[1]];
    const kreuz = ab[0] * bc[1] - ab[1] * bc[0], den = Math.hypot(...ab) * Math.hypot(...bc) * Math.hypot(...ca);
    return { punkt: ende ? c : a, richtung: ende ? rich(b, c) : rich(a, b), kruemmung: den ? 2 * kreuz / den : 0 };   // links herum positiv
  }
  function messeNaht() {
    const aus = [];
    for (let i = 0; i < abschnitte.length - 1; i++) {
      const A = abschnitte[i], B = abschnitte[i + 1];
      const pa = posen(A, A.frames), pb = posen(B, 0);
      const ra = schienenRand(A, true), rb = schienenRand(B, false);
      const sub = (a, b) => a.map((x, k) => x - b[k]);
      const len = v => Math.hypot(...v);
      const ang = (a, b) => THREE.MathUtils.radToDeg(new THREE.Quaternion().fromArray(a).angleTo(new THREE.Quaternion().fromArray(b)));
      aus.push({ naht: `${A.name} -> ${B.name}`, globales_bild: B.start,
        kamera_ort_diff: len(sub(pa.ort, pb.ort)), kamera_dreh_diff_grad: ang(pa.q, pb.q), verschiebung_diff: Math.abs(pa.verschiebung - pb.verschiebung), vfov_diff: Math.abs((pa.vfov || 0) - (pb.vfov || 0)),
        rollen_grad: [pa.rollen_grad, pb.rollen_grad], punkt_diff: pa.punkt && pb.punkt ? len(sub(pa.punkt, pb.punkt)) : null,
        schiene: ra && rb ? { links: ra, rechts: rb, punkt_diff: Math.hypot(ra.punkt[0] - rb.punkt[0], ra.punkt[1] - rb.punkt[1]), richtung_diff_grad: ((ra.richtung - rb.richtung + 540) % 360) - 180, kruemmung_links: ra.kruemmung, kruemmung_rechts: rb.kruemmung } : null });
    }
    return aus;
  }

  await laden(innerWidth >= innerHeight ? "breit" : "hochkant");
  zielAusScroll(); ist = ziel; ankerLesen();
  requestAnimationFrame(bild);
  const ladezeit = Math.max(...abschnitte.map(a => a.ladezeit)), druckzeit = abschnitte.reduce((s, a) => s + a.druckzeit, 0);
  window.__neubau = {
    get bild() { return ist; }, get ziel() { return ziel; }, get fps() { return fps.wert; }, get ladezeit() { return ladezeit; }, get druckzeit() { return druckzeit; },
    get bilder() { return gesamt; }, get abschnitte() { return abschnitte.map(a => ({ name: a.name, art: a.art, start: a.start, frames: a.frames })); }, get szene() { return abschnitte[0].sz; },
    get art() { return art; }, fertig: Promise.resolve(true), pruefeText, messeNaht, renderer,
    posen: (name, f) => { const A = abschnitte.find(a => a.name === name); return posen(A, f); },
    messung, get breite() { return buehne.clientWidth; }, get hoehe() { return buehne.clientHeight; },
  };
  buehne.classList.add("bereit");
  document.documentElement.classList.add("bereit");
}

// Kurzform für eine einzelne Szene (wie bisher)
export function spieleSzene(buehne, dateien, opt = {}) {
  return spieleFolge(buehne, { segmente: [{ name: dateien.name || "szene", glb: { breit: dateien.breit, hochkant: dateien.hochkant }, daten: dateien.szene }] }, opt);
}
