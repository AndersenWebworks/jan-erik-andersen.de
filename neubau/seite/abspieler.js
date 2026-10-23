// Abspieler des Neubaus: lädt eine in Blender gebaute Szene (glb) und spult ihre Animation passend zum Scrollen vor und zurück.
// Alles Gestalterische (Teile, Bewegung, Kamera, Druck) steckt in der glb; hier nur: Licht wie in Blender, Materialien für
// Bau-Linien und eingeblendeten Druck, Bildverschiebung der Kamera, Scroll -> Bildnummer mit weichem Nachziehen.
// Gemeinsam für alle Szenen: spieleSzene(container, { breit, hochkant }).
import * as THREE from "three";
import { GLTFLoader } from "./vendor/addons/loaders/GLTFLoader.js";

const lies = s => { try { return typeof s === "string" ? JSON.parse(s) : s || null; } catch { return null; } };

export async function spieleSzene(buehne, dateien, opt = {}) {
  const canvas = buehne.querySelector("canvas");
  const handy = Math.min(innerWidth, innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;          // Blender: Ansichtstransformation „Khronos PBR Neutral“
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;   // PCFSoft gibt es in r186 nicht mehr
  const aniso = renderer.capabilities.getMaxAnisotropy();

  let zustand = null;            // { scene, cam, mixer, meta, bauMat }
  let anordnung = null;

  async function laden(art) {
    anordnung = art;
    const t0 = performance.now();
    const gltf = await new GLTFLoader().loadAsync(dateien[art]);
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
    scene.traverse(o => {
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
        o.material = bm; o.castShadow = false; o.receiveShadow = false; o.renderOrder = 2;
        return;
      }
      if (info.unbeleuchtet) {
        o.material = new THREE.MeshBasicMaterial({ map: m.emissiveMap || m.map, color: m.emissiveMap || m.map ? 0xffffff : m.emissive });
        o.receiveShadow = false; o.castShadow = false;
        return;
      }
      o.castShadow = true; o.receiveShadow = true;
      if (info.einblenden) {
        // Druck erscheint weich zwischen zwei Bildnummern (vorher nur die Grundfarbe), wie der Einblend-Knoten in Blender
        const [f0, f1] = info.einblenden, grund = new THREE.Color(info.farbe);
        m.onBeforeCompile = sh => {
          sh.uniforms.uFrame = uFrame; sh.uniforms.uGrund = { value: grund };
          sh.fragmentShader = "uniform float uFrame; uniform vec3 uGrund;\n" + sh.fragmentShader.replace("#include <map_fragment>",
            `#include <map_fragment>
             float kk = smoothstep(${f0.toFixed(1)}, ${f1.toFixed(1)}, uFrame);
             diffuseColor.rgb = mix(uGrund, diffuseColor.rgb, kk);`);
        };
        m.needsUpdate = true;
      }
    });

    const camKnoten = gltf.cameras.find(c => c.name === (meta.kamera && meta.kamera.name)) || gltf.cameras[0];
    const mixer = new THREE.AnimationMixer(scene);
    for (const clip of gltf.animations) mixer.clipAction(clip).play();
    zustand = { scene, cam: camKnoten, mixer, meta, uFrame, ladezeit, dauer: (meta.frames || 380) / (meta.fps || 24) };
    groesse();
    return zustand;
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
  function zielAusScroll() {
    const r = strecke.getBoundingClientRect(), weg = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, weg)));
    ziel = p * (zustand ? zustand.meta.frames || 380 : 380);
  }
  addEventListener("scroll", zielAusScroll, { passive: true });
  addEventListener("resize", () => {
    const art = innerWidth >= innerHeight ? "breit" : "hochkant";
    if (art !== anordnung) laden(art); else groesse();
  });

  function bild(now) {
    requestAnimationFrame(bild);
    const dt = Math.min(.1, (now - letzt) / 1000); letzt = now;
    if (!zustand) return;
    const vorher = ist;
    ist += (ziel - ist) * (1 - Math.exp(-dt * (opt.nachziehen || 6)));
    if (Math.abs(ziel - ist) < .002) ist = ziel;
    if (ist === vorher && !neu) return;
    neu = false;
    const { mixer, cam, meta, uFrame } = zustand;
    mixer.setTime(ist / (meta.fps || 24));
    uFrame.value = ist;
    // Bildverschiebung (Objektivverschiebung) je Bild, linear zwischen den Bildnummern
    const v = meta.verschiebung || [];
    if (v.length) {
      const i = Math.min(v.length - 2, Math.floor(ist)), k = ist - i;
      const o = (v[i] + (v[i + 1] - v[i]) * k) * (zustand.verschFaktor || 1);
      cam.projectionMatrix.copy(zustand.basisProjektion);
      cam.projectionMatrix.elements[8] = o;
      cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    }
    renderer.render(zustand.scene, cam);
    fps.n++;
    if (now - fps.t > 1000) { fps.wert = fps.n * 1000 / (now - fps.t); fps.n = 0; fps.t = now; }
  }

  await laden(innerWidth >= innerHeight ? "breit" : "hochkant");
  zielAusScroll(); ist = ziel;
  requestAnimationFrame(bild);
  window.__neubau = { get bild() { return ist; }, get ziel() { return ziel; }, get fps() { return fps.wert; }, get ladezeit() { return zustand && zustand.ladezeit; }, renderer };
  buehne.classList.add("bereit");
}
