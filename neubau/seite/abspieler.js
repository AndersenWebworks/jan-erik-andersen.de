// Abspieler des Neubaus: lädt eine in Blender gebaute Szene (glb) und spult ihre Animation passend zum Scrollen vor und zurück.
// Blender liefert Form, Animation, Kamera und leere, benannte Druckflächen ("druck:<name>", Maße in den Extras). Hier entsteht der Rest:
//   - Licht wie in Blender, Materialien für Bau-Linien, Bildverschiebung der Kamera, Scroll -> Bildnummer mit weichem Nachziehen
//   - Druck: der Text aus der Szenendatei (neubau/szenen/<name>.json, als assets/<name>.szene.json) wird beim Laden mit Canvas
//     gezeichnet (Schriften aus ./schriften) und als Textur auf die Druckflächen gelegt, mit Einblenden zum genannten Zeitpunkt
//   - Lage: Versatz und Drehung der Gegenstände aus der Szenendatei werden ohne Blender übernommen (Gruppenknoten); die Blöcke, die
//     zwischen Gegenständen wandern, werden mitgeführt (Start folgt dem einen, Ende dem anderen Gegenstand)
//   - Textprüfung im Browser: window.__neubau.pruefeText(fläche, bild)
// Gemeinsam für alle Szenen: spieleSzene(container, { breit, hochkant, szene }). Anker #p=0.4 setzt den Fortschritt.
import * as THREE from "three";
import { GLTFLoader } from "./vendor/addons/loaders/GLTFLoader.js";

const lies = s => { try { return typeof s === "string" ? JSON.parse(s) : s || null; } catch { return null; } };
const smm = x => { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
const farbe = (pal, c) => (pal && pal[c]) || c;

// ---------------------------------------------------------------- Schriften und Text
const SCHRIFTEN = {
  "grotesk": { familie: "Schibsted Grotesk", datei: "SchibstedGrotesk.ttf", stil: "normal" },
  "serif": { familie: "Newsreader", datei: "Newsreader.ttf", stil: "normal" },
  "serif-kursiv": { familie: "Newsreader", datei: "NewsreaderItalic.ttf", stil: "italic" },
};
const schriftString = (name, px) => { const s = SCHRIFTEN[name || "grotesk"]; return `${s.stil} 400 ${px}px "${s.familie}"`; };
const geladen = new Set();
async function schriftenLaden(namen, ordner) {
  await Promise.all([...namen].filter(n => !geladen.has(n)).map(async n => {
    const s = SCHRIFTEN[n];
    const f = new FontFace(s.familie, `url(${new URL(s.datei, ordner).href})`, { style: s.stil, weight: "400" });
    document.fonts.add(await f.load());
    geladen.add(n);
  }));
}

// Zeilenumbruch und Lage der Zeilen in Einheiten der Druckfläche (unabhängig von der Pixeldichte, gemessen bei REF px).
// Wie in der alten Rasterung: Versalhöhe (0,72 em) mittig in der Zeilenhöhe; Kästen der Zeilen für die Textprüfung.
const REF = 200;
function textSetzen(el, w, h, ctx) {
  const size = el.groesse, lh = (el.zeilenhoehe ?? 1.3) * size, gap = (el.abstand ?? .6) * size;
  const x0 = el.x ?? el.rand ?? 0, maxw = el.breite ?? (w - 2 * x0);
  ctx.font = schriftString(el.schrift, REF);
  const breite = s => ctx.measureText(s).width / REF * size;
  const absaetze = el.absaetze || [el.text];
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

// Zeichnet eine Druckfläche (Grund, Linien, Text) auf ein Canvas; ppu = Pixel je Einheit.
function druckZeichnen(def, w, h, ppu, pal, mess) {
  const cv = document.createElement("canvas");
  cv.width = Math.max(4, Math.round(w * ppu)); cv.height = Math.max(4, Math.round(h * ppu));
  const ctx = cv.getContext("2d");
  ctx.fillStyle = farbe(pal, def.grund); ctx.fillRect(0, 0, cv.width, cv.height);
  const zeilen = [];
  for (const el of def.elemente || []) {
    if (el.typ === "linie") {
      ctx.strokeStyle = farbe(pal, el.farbe); ctx.lineWidth = Math.max(1, el.breite * ppu); ctx.lineCap = "butt";
      ctx.beginPath(); ctx.moveTo(el.von[0] * ppu, el.von[1] * ppu); ctx.lineTo(el.bis[0] * ppu, el.bis[1] * ppu); ctx.stroke();
    } else if (el.typ === "text" || el.typ === "absaetze") {
      const boxen = textSetzen(el, w, h, mess);
      ctx.fillStyle = farbe(pal, el.farbe); ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.fontKerning = "normal";
      ctx.font = schriftString(el.schrift, el.groesse * ppu);
      for (const b of boxen) ctx.fillText(b.text, b.x * ppu, b.base * ppu);
      zeilen.push(...boxen);
    }
  }
  return { cv, zeilen };
}

// Einblenden: der Druck erscheint weich zwischen zwei Bildnummern (vorher nur die Grundfarbe), wie der Einblend-Knoten in Blender
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

export async function spieleSzene(buehne, dateien, opt = {}) {
  const canvas = buehne.querySelector("canvas");
  const handy = Math.min(innerWidth, innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  const dpr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;          // Blender: Ansichtstransformation „Khronos PBR Neutral“
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;   // PCFSoft gibt es in r186 nicht mehr
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const schriftOrdner = new URL(opt.schriften || "./schriften/", import.meta.url);

  let zustand = null;            // { scene, cam, mixer, meta, uFrame, druck, bloecke, ... }
  let anordnung = null;
  let sz = null;                 // Szenendatei (JSON)
  const szP = dateien.szene ? fetch(dateien.szene, { cache: "no-cache" }).then(r => r.json()) : Promise.resolve(null);

  async function laden(art) {
    anordnung = art;
    const t0 = performance.now();
    const [gltf, szDef] = await Promise.all([new GLTFLoader().loadAsync(dateien[art]), szP]);
    sz = szDef;
    const ladezeit = performance.now() - t0;
    const scene = gltf.scene;
    const meta = lies(scene.userData.neubau) || {};
    const pal = meta.pal || {};
    scene.background = new THREE.Color(pal.dunst || "#dfedf9");
    // Licht aus denselben Werten wie in Blender (basis.LICHT): Sonne + gleichmäßige Umgebung
    const L = meta.licht || { sonne: 4, hoehe: 40, richtung: 32, umgebung: .9, umgebung_farbe: "#e2ebf6" };
    const rx = THREE.MathUtils.degToRad(L.hoehe), rz = THREE.MathUtils.degToRad(L.richtung);
    // Blender: Sonne zeigt entlang -Z, gedreht um X dann Z; Richtung in Blender-Koordinaten, dann nach Y-oben
    const d = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(rx, 0, rz, "XYZ"));
    const dir = new THREE.Vector3(d.x, d.z, -d.y);
    const sonne = new THREE.DirectionalLight(0xffffff, L.sonne * (opt.sonneFaktor || 1));
    sonne.position.copy(dir).multiplyScalar(-30);
    sonne.target.position.set(0, 0, 0);
    sonne.castShadow = true;
    sonne.shadow.mapSize.set(handy ? 1024 : 2048, handy ? 1024 : 2048);
    const sc = sonne.shadow.camera; sc.left = -11; sc.right = 11; sc.top = 11; sc.bottom = -11; sc.near = 1; sc.far = 70;
    sonne.shadow.bias = -.0004; sonne.shadow.normalBias = .02; sonne.shadow.radius = 3;
    scene.add(sonne, sonne.target);
    scene.add(new THREE.AmbientLight(new THREE.Color(L.umgebung_farbe || "#e2ebf6"), L.umgebung * Math.PI * (opt.umgebungFaktor || 1)));

    const uFrame = { value: 0 };
    const druckNodes = {}, bloeckeNodes = [], gruppenNodes = {};
    scene.traverse(o => {
      const nodeInfo = lies(o.userData.neubau);
      if (nodeInfo) {
        if (nodeInfo.druck) druckNodes[nodeInfo.druck] = { mesh: o, info: nodeInfo };
        if (nodeInfo.block) bloeckeNodes.push({ node: o, info: nodeInfo });
        if (nodeInfo.gruppe) gruppenNodes[nodeInfo.gruppe] = o;
      }
      if (!o.isMesh) return;
      const m = o.material, info = lies(m.userData && m.userData.neubau) || {};
      if (m.map) { m.map.anisotropy = aniso; m.map.needsUpdate = true; }
      if (info.bau) {
        // Bau-Linien: Sichtbarkeit je Ecke aus _ein/_aus/_deck gegen die Bildnummer (wie der Treiber in Blender)
        const bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(info.tinte), transparent: true, depthWrite: false, side: THREE.DoubleSide });
        bm.onBeforeCompile = sh => {
          sh.uniforms.uFrame = uFrame;
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
      if (info.unbeleuchtet) {
        o.material = new THREE.MeshBasicMaterial({ map: m.emissiveMap || m.map, color: m.emissiveMap || m.map ? 0xffffff : m.emissive });
        o.receiveShadow = false; o.castShadow = false;
        return;
      }
      o.castShadow = true; o.receiveShadow = true;
      if (info.einblenden) einblenden(m, uFrame, info.einblenden[0], info.einblenden[1], new THREE.Color(info.farbe));
    });

    // ---------- Lage: Gruppenknoten aus der Szenendatei, Blöcke mitführen ----------
    const gruppen = {};
    for (const [n, node] of Object.entries(gruppenNodes)) {
      const gb = (meta.gruppen || {})[n]; if (!gb) continue;
      const baked = gruppenMatrix(gb.pivot, gb.versatz || [0, 0, 0], gb.drehung_z || 0);
      const sd = sz && sz.gegenstaende && sz.gegenstaende[n];
      const neu = sd ? gruppenMatrix(gb.pivot, sd.versatz || [0, 0, 0], sd.drehung_z || 0) : baked.clone();
      if (!neu.equals(baked)) setzeMatrix(node, neu);
      gruppen[n] = { baked, neu, geaendert: !neu.equals(baked) };
    }
    const delta = n => { const g = gruppen[n]; const M = g ? g.neu.clone().multiply(g.baked.clone().invert()) : new THREE.Matrix4(); const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); M.decompose(p, q, s); return { p, q, geaendert: !!(g && g.geaendert) }; };
    const bloecke = [];
    for (const { node, info } of bloeckeNodes) {
      const a = delta(info.start), b = delta(info.ende);
      if (!a.geaendert && !b.geaendert) continue;
      const g = new THREE.Group(); g.name = "lage_" + node.name;
      node.parent.add(g); g.add(node);
      bloecke.push({ g, f0: info.zeit[0], f1: info.zeit[1], a, b });
    }

    // ---------- Druck: Text der Szenendatei auf die Druckflächen ----------
    const t1 = performance.now();
    const druck = {};
    if (sz && Object.keys(druckNodes).length) {
      const namen = new Set();
      for (const fl of Object.values(sz.druckflaechen)) for (const el of fl.elemente || []) if (el.schrift) namen.add(el.schrift); else if (el.typ !== "linie") namen.add("grotesk");
      await schriftenLaden(namen, schriftOrdner);
      await Promise.all([...namen].map(n => document.fonts.load(schriftString(n, 20))));
      const mess = document.createElement("canvas").getContext("2d");
      const maxTex = Math.min(renderer.capabilities.maxTextureSize, 4096);
      for (const [name, { mesh, info }] of Object.entries(druckNodes)) {
        const def = sz.druckflaechen[name]; if (!def) continue;
        const ppu = Math.min((def.aufloesung || 400) * dpr, maxTex / Math.max(info.w, info.h));
        const { cv, zeilen } = druckZeichnen(def, info.w, info.h, ppu, pal, mess);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; tex.anisotropy = aniso;
        tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        const m = mesh.material;
        m.map = tex; m.color.set(0xffffff);
        // kein Polygon-Offset: die Fläche liegt 1 mm über dem Karton, die Bleistiftspur (2,5 mm) darüber bleibt sichtbar
        if (def.einblenden) einblenden(m, uFrame, def.einblenden[0], def.einblenden[1], new THREE.Color(farbe(pal, def.grund)));
        else { m.onBeforeCompile = () => {}; m.customProgramCacheKey = () => "druck"; m.needsUpdate = true; }
        mesh.castShadow = false; mesh.receiveShadow = true;
        // Abbildung Druckkoordinate -> Welt über die UV der Fläche (u = x / w, v = y / h, Bild oben links)
        const pos = mesh.geometry.attributes.position, uv = mesh.geometry.attributes.uv, P = {};
        for (let i = 0; i < pos.count; i++) P[Math.round(uv.getX(i)) + "" + Math.round(uv.getY(i))] = new THREE.Vector3().fromBufferAttribute(pos, i);
        druck[name] = { mesh, w: info.w, h: info.h, zeilen, tex, def, ppu, P, px: [cv.width, cv.height] };
      }
      htmlText(sz);
    }
    const druckzeit = performance.now() - t1;

    const camKnoten = gltf.cameras.find(c => c.name === (meta.kamera && meta.kamera.name)) || gltf.cameras[0];
    const mixer = new THREE.AnimationMixer(scene);
    for (const clip of gltf.animations) mixer.clipAction(clip).play();
    // Clip-Ende: bei genau der Dauer springt die Schleife auf Anfang, daher knapp davor bleiben (letztes Bild = Lesestelle am Ende)
    const clipDauer = Math.max(0, ...gltf.animations.map(c => c.duration));
    zustand = { scene, cam: camKnoten, mixer, meta, uFrame, ladezeit, druckzeit, druck, bloecke, clipDauer, dauer: (meta.frames || 380) / (meta.fps || 24) };
    groesse();
    return zustand;
  }

  // Texte im Dokument (Screenreader, Suchmaschinen) aus derselben Szenendatei: data-szene="<fläche>:<nr. des Absatzes>"
  function htmlText(szDef) {
    const flach = n => ((szDef.druckflaechen[n] || {}).elemente || []).flatMap(e => e.absaetze || (e.text ? [e.text] : []));
    document.querySelectorAll("[data-szene]").forEach(el => {
      const [n, i] = el.dataset.szene.split(":"), t = flach(n)[+i || 0];
      if (t != null && el.textContent !== t) el.textContent = t;
    });
  }

  function groesse() {
    const w = buehne.clientWidth, h = buehne.clientHeight;
    renderer.setSize(w, h, false);
    if (!zustand) return;
    const { cam, meta } = zustand, k = meta.kamera || { vfov: 30, aspekt: 16 / 9 };
    const asp = w / h, tV = Math.tan(THREE.MathUtils.degToRad(k.vfov) / 2);
    // Gestaltet für k.aspekt: ist das Fenster schmaler, bleibt die Bildbreite (nichts wird seitlich angeschnitten)
    const tVneu = asp < k.aspekt ? tV * k.aspekt / asp : tV;
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(tVneu)); cam.aspect = asp;
    zustand.verschFaktor = (tV * k.aspekt) / (tVneu * asp);   // NDC-Verschiebung bezogen auf die tatsächliche Bildbreite
    cam.updateProjectionMatrix();
    zustand.basisProjektion = cam.projectionMatrix.clone();
    neu = true;
  }

  // ---------- Scroll -> Bildnummer, weich nachgezogen; kein Scroll-Lock ----------
  const strecke = buehne.parentElement;   // hoher Abschnitt, Bühne klebt (position: sticky)
  let ziel = 0, ist = 0, neu = true, letzt = performance.now();
  const fps = { n: 0, t: performance.now(), wert: 0, min: 1e9, frames: [] };
  const anzahlBilder = () => (zustand ? zustand.meta.frames || 380 : 380);
  function zielAusScroll() {
    const r = strecke.getBoundingClientRect(), weg = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, weg)));
    ziel = p * anzahlBilder();
  }
  function ankerLesen() {
    const m = /[#&]p=([0-9.]+)/.exec(location.hash);
    if (!m) return;
    const p = Math.min(1, Math.max(0, parseFloat(m[1]))), weg = strecke.offsetHeight - innerHeight;
    scrollTo(0, strecke.offsetTop + weg * p);
    zielAusScroll(); ist = ziel; neu = true;
  }
  addEventListener("scroll", zielAusScroll, { passive: true });
  addEventListener("hashchange", ankerLesen);
  addEventListener("resize", () => {
    const art = innerWidth >= innerHeight ? "breit" : "hochkant";
    if (art !== anordnung) laden(art); else groesse();
  });

  // Zustand der Szene bei Bildnummer f herstellen (Animation, Einblenden, mitgeführte Blöcke, Bildverschiebung der Kamera)
  function anwenden(f) {
    const { mixer, cam, meta, uFrame, bloecke } = zustand;
    mixer.setTime(Math.min(f / (meta.fps || 24), zustand.clipDauer - 1e-4));
    uFrame.value = f;
    for (const b of bloecke) {
      const e = smm((f - b.f0) / (b.f1 - b.f0));
      b.g.position.lerpVectors(b.a.p, b.b.p, e);
      b.g.quaternion.copy(b.a.q).slerp(b.b.q, e);
    }
    // Bildverschiebung (Objektivverschiebung) je Bild, linear zwischen den Bildnummern
    const v = meta.verschiebung || [];
    cam.projectionMatrix.copy(zustand.basisProjektion);
    if (v.length) {
      const i = Math.min(v.length - 2, Math.max(0, Math.floor(f))), k = f - i;
      const o = (v[i] + (v[i + 1] - v[i]) * k) * (zustand.verschFaktor || 1);
      cam.projectionMatrix.elements[8] = o;
    }
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }

  function bild(now) {
    requestAnimationFrame(bild);
    const dt = Math.min(.1, (now - letzt) / 1000); letzt = now;
    if (!zustand) return;
    const vorher = ist;
    ist += (ziel - ist) * (1 - Math.exp(-dt * (opt.nachziehen || 6)));
    if (Math.abs(ziel - ist) < .002) ist = ziel;
    if (ist === vorher && !neu) return;
    neu = false;
    anwenden(ist);
    renderer.render(zustand.scene, zustand.cam);
    fps.n++;
    if (now - fps.t > 1000) { fps.wert = fps.n * 1000 / (now - fps.t); fps.n = 0; fps.t = now; }
  }

  // ---------- Textprüfung im Browser ----------
  // Je Zeile der Druckfläche: Höhe des Gevierts in CSS-Pixeln (Versalhöhe / 0,72), im Bild, nicht verdeckt (Strahl von der Kamera trifft
  // zuerst die Fläche bzw. ihren Träger), Zeile liegt auf der Fläche. Maßgeblich ist die tatsächliche Kamera samt Bildverschiebung.
  function pruefeText(name, frame) {
    const z = zustand, d = z.druck[name];
    if (!d) return { zeilen: 0, min_em_px: 0, verdeckt: 0, ausserhalb: 0, auf_flaeche: false, gezeichnet: false, eingeblendet: false };
    const f = frame ?? ist;
    anwenden(f); z.scene.updateMatrixWorld(true); z.cam.updateMatrixWorld(true);
    const cam = z.cam, inv = cam.matrixWorld.clone().invert(), camp = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
    const W = buehne.clientWidth, H = buehne.clientHeight, rand = .02;
    const welt = (x, y) => {
      const u = x / d.w, v = y / d.h, P = d.P;
      return P["00"].clone().add(P["10"].clone().sub(P["00"]).multiplyScalar(u)).add(P["01"].clone().sub(P["00"]).multiplyScalar(v)).applyMatrix4(d.mesh.matrixWorld);
    };
    const proj = p => { const v = p.clone().applyMatrix4(inv); const tiefe = -v.z; v.applyMatrix4(cam.projectionMatrix); return { x: (v.x + 1) / 2, y: (v.y + 1) / 2, tiefe }; };
    const verdecker = [];
    z.scene.traverse(o => { if (o.isMesh && !o.userData.bau && o !== d.mesh && o !== d.mesh.parent && o.visible) verdecker.push(o); });
    const rc = new THREE.Raycaster();
    const erg = { bild: f, zeilen: d.zeilen.length, min_em_px: 1e9, verdeckt: 0, ausserhalb: 0, auf_flaeche: true, details: [] };
    for (const zl of d.zeilen) {
      let aus = 0, verd = 0;
      for (const fx of [0, .25, .5, .75, 1]) for (const fy of [0, 1]) {
        const p = welt(zl.x + zl.w * fx, zl.y + zl.h * fy), c = proj(p);
        if (!(c.x >= rand && c.x <= 1 - rand && c.y >= rand && c.y <= 1 - rand && c.tiefe > 0)) aus++;
        const dv = p.clone().sub(camp), L = dv.length();
        rc.set(camp, dv.normalize()); rc.far = L - .01;
        if (rc.intersectObjects(verdecker, false).length) verd++;
      }
      const t = proj(welt(zl.x + zl.w / 2, zl.y)), b = proj(welt(zl.x + zl.w / 2, zl.y + zl.h));
      const em = Math.abs(t.y - b.y) * H / .72;
      if (zl.x < -1e-6 || zl.y < -1e-6 || zl.x + zl.w > d.w + 1e-6 || zl.y + zl.h > d.h + 1e-6) erg.auf_flaeche = false;
      erg.details.push({ text: zl.text, w: +zl.w.toFixed(4), em_px: +em.toFixed(1), ausserhalb: aus, verdeckt: verd });
      erg.min_em_px = Math.min(erg.min_em_px, em); erg.verdeckt += verd; erg.ausserhalb += aus;
    }
    erg.min_em_px = +erg.min_em_px.toFixed(1);
    const schriftenOk = d.def.elemente.every(el => !el.schrift && el.typ === "linie" || document.fonts.check(schriftString(el.schrift, 20)));
    erg.gezeichnet = !!(d.mesh.material.map === d.tex && schriftenOk && d.zeilen.length);
    erg.eingeblendet = !d.def.einblenden || f >= d.def.einblenden[1];
    erg.viewport = [W, H]; erg.textur = d.px;
    erg.saetze = d.zeilen.map(zl => zl.text).join(" ");
    return erg;
  }

  await laden(innerWidth >= innerHeight ? "breit" : "hochkant");
  zielAusScroll(); ist = ziel; ankerLesen();
  requestAnimationFrame(bild);
  window.__neubau = {
    get bild() { return ist; }, get ziel() { return ziel; }, get fps() { return fps.wert; }, get ladezeit() { return zustand && zustand.ladezeit; },
    get druckzeit() { return zustand && zustand.druckzeit; }, get bilder() { return anzahlBilder(); }, get szene() { return sz; },
    fertig: Promise.resolve(true), pruefeText, renderer,
  };
  buehne.classList.add("bereit");
}
