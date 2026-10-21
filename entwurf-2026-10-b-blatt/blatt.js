// Entwurf B Blatt: jedes Thema ist ein Blatt im Raum, das Modell faltet sich aus demselben Blatt hoch.
// Text bleibt DOM (CSS3DRenderer), WebGL liegt dahinter (Modelle, Blattschatten, roter Faden); beide teilen sich eine Kamera.
import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "./vendor/CSS3DRenderer.js";
import { MODELS, buildModel } from "./modelle.js";
import { fillMaterial, edgeMaterial } from "./faltwerk.js";

const root = document.documentElement;
const canvas = document.getElementById("gl");
const cssHost = document.getElementById("css");
const spacer = document.getElementById("scroll");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const smoother = t => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };

// ---------- WebGL ----------
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  if (!renderer.getContext()) renderer = null;
} catch (e) { renderer = null; }
if (!renderer) { root.classList.add("nogl"); }
else boot();

function boot() {
  root.classList.add("webgl");
  renderer.setClearColor(0xffffff, 1);
  const css = new CSS3DRenderer({ element: cssHost });
  const scene = new THREE.Scene(), cssScene = new THREE.Scene();
  const FOV = 30, camera = new THREE.PerspectiveCamera(FOV, 1, 4, 40000);
  const TANH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  let cur = 0, dirty = true;
  // ---------- Blätter ----------
  const DEF = [
    { id: "start", key: "start", side: "l", name: "Einstieg", frame: { p: [0, 0, 0], yaw: 0 } },
    { id: "arbeit", key: "arbeit", side: "r", name: "Gerwing", frame: { p: [2.5, .14, -1.7], yaw: -.3 } },
    { id: "shops", key: "shops", side: "l", name: "Shops und Shop-Wechsel", frame: { p: [.4, -.05, -3.6], yaw: .3 } }
  ];
  const N = DEF.length;
  const sheets = DEF.map((d, i) => {
    const el = document.getElementById(d.id);
    const g = new THREE.Group(), cf = new THREE.Object3D();
    scene.add(g); cssScene.add(cf);
    const txt = new CSS3DObject(el);
    el.style.userSelect = "text"; el.style.webkitUserSelect = "text";
    cf.add(txt);
    return { ...d, i, el, g, cf, txt, model: null, s: 0, op: 1 };
  });

  // Papier, Haarlinie als Kante, weicher Schatten darunter
  const paperMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const edgeGeo = new THREE.BufferGeometry().setFromPoints([[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]].map(p => new THREE.Vector3(p[0], p[1], 0)));
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .2 });
  const shadowMat = () => new THREE.ShaderMaterial({
    uniforms: { uSize: { value: new THREE.Vector2(1, 1) }, uHalf: { value: new THREE.Vector2(1, 1) }, uOff: { value: new THREE.Vector2(6, -14) }, uM: { value: 60 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec2 uSize; uniform vec2 uHalf; uniform vec2 uOff; uniform float uM; varying vec2 vUv;
      void main(){
        vec2 p = (vUv - 0.5) * uSize - uOff;
        float d = length(max(abs(p) - uHalf + vec2(10.0), 0.0)) - 10.0;
        float a = pow(1.0 - smoothstep(-6.0, uM, d), 1.9) * 0.2;
        if (a < 0.002) discard;
        gl_FragColor = vec4(0.19, 0.19, 0.2, a);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false
  });
  for (const sh of sheets) {
    sh.paper = new THREE.Mesh(planeGeo, paperMat);
    sh.edge = new THREE.LineLoop(edgeGeo, edgeMat);
    sh.shadow = new THREE.Mesh(planeGeo, shadowMat());
    sh.edge.position.z = .3; sh.shadow.position.z = -3; sh.shadow.renderOrder = -2; sh.paper.renderOrder = -1;
    sh.g.add(sh.shadow, sh.paper, sh.edge);
  }

  // Bilder für die Bildschirme
  const loader = new THREE.TextureLoader(), TEX = {};
  for (const [k, url] of [["prod", "bilder/gerwing-produkt-ausschnitt.jpg"], ["order", "bilder/gerwing-bestellung.jpg"]]) {
    TEX[k] = loader.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.needsUpdate = true; dirty = true; });
    TEX[k].colorSpace = THREE.SRGBColorSpace;
  }

  // Modelle
  for (const sh of sheets) {
    const m = buildModel(sh.key);
    const holder = new THREE.Group(); holder.matrixAutoUpdate = false;
    const mats = [];
    const fill = new THREE.Mesh(m.geoT, fillMaterial()); fill.frustumCulled = false; mats.push(fill.material);
    const lines = new THREE.LineSegments(m.geoL, edgeMaterial()); lines.frustumCulled = false; lines.renderOrder = 3; mats.push(lines.material);
    holder.add(fill, lines);
    for (const k in m.geoX) {
      const t = new THREE.Mesh(m.geoX[k], fillMaterial(TEX[k])); t.frustumCulled = false; t.renderOrder = 1; holder.add(t); mats.push(t.material);
    }
    holder.visible = false;
    sh.g.add(holder);
    sh.model = { holder, mats, update: m.update, fill };
  }

  // ---------- Layout ----------
  let vw = 0, vh = 0, mobile = false, Wp = 0, Hp = 0, fdist = 0, scrollTotal = 1;
  const geom = sheets.map(() => ({}));
  const textBase = () => mobile ? 16 : 19;
  function layout() {
    vw = innerWidth; vh = innerHeight;
    mobile = vw < 760 || vw / vh < .85;
    root.classList.toggle("mobile", mobile);
    const ev = x => Math.max(2, Math.round(x / 2) * 2);
    if (mobile) { Wp = ev(vw - 24); Hp = ev(vh - 120); }
    else { Wp = ev(Math.min(1400, vw * .92, (vh - 170) * 1.75)); Hp = ev(Wp / 1.75); }
    fdist = (vh / 2) / TANH;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 2 : 2));
    renderer.setSize(vw, vh, false);
    css.setSize(vw, vh);
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
    // Sheetrahmen: Positionen in Blattbreiten
    for (const sh of sheets) {
      const f = sh.frame;
      for (const o of [sh.g, sh.cf]) { o.position.set(f.p[0] * Wp, f.p[1] * Wp, f.p[2] * Wp); o.rotation.set(0, f.yaw, 0); o.updateMatrixWorld(true); }
      sh.paper.scale.set(Wp, Hp, 1); sh.edge.scale.set(Wp, Hp, 1);
      const M = 70, off = [6, -16];
      sh.shadow.scale.set(Wp + 2 * M + 40, Hp + 2 * M + 60, 1);
      const u = sh.shadow.material.uniforms; u.uSize.value.set(Wp + 2 * M + 40, Hp + 2 * M + 60); u.uHalf.value.set(Wp / 2, Hp / 2); u.uM.value = M; u.uOff.value.set(off[0], off[1]);
    }
    // Textboxen und Modellzonen
    const fs0 = textBase();
    for (const sh of sheets) {
      const g = geom[sh.i], el = sh.el;
      let bw, bh, cx, cy;
      if (!mobile) {
        const padX = Math.round(Wp * .05), padY = Math.round(Hp * .06);
        bw = ev(Math.min(540, Wp * .41)); bh = ev(Hp - 2 * padY);
        cx = sh.side === "l" ? -Wp / 2 + padX + bw / 2 : Wp / 2 - padX - bw / 2; cy = 0;
        el.style.width = bw + "px"; el.style.height = bh + "px";
        g.text = { bw, bh, cx, cy };
        // Modellzone: andere Hälfte
        const gap = 34, zx0 = sh.side === "l" ? -Wp / 2 + padX + bw + gap : -Wp / 2 + padX * .7;
        const zx1 = sh.side === "l" ? Wp / 2 - padX * .7 : Wp / 2 - padX - bw - gap;
        g.zone = { x: (zx0 + zx1) / 2, y: 0, w: zx1 - zx0, h: Hp - 2 * padY + 20 };
        g.gutter = sh.side === "l" ? (-Wp / 2 + padX + bw + gap / 2 - 0) : (Wp / 2 - padX - bw - gap / 2);
      } else {
        const pad = 20;
        bw = ev(Wp - 2 * pad);
        el.style.width = bw + "px"; el.style.height = "auto";
        g.text = { bw, bh: 0, cx: 0, cy: 0 };
      }
      g.fs = fs0;
    }
    fitText();
    setScrollRange();
    dirty = true;
  }

  // Schrift an die Textbox anpassen (Bildschirmgröße, kleine Fenster)
  function fitText() {
    for (const sh of sheets) {
      const g = geom[sh.i], el = sh.el;
      let fs = textBase();
      el.style.setProperty("--fs", fs + "px");
      if (!mobile) {
        const room = g.text.bh;
        el.style.height = "auto"; el.style.justifyContent = "flex-start";
        let hh = el.scrollHeight;
        while (hh > room && fs > 15) { fs -= .5; el.style.setProperty("--fs", fs + "px"); hh = el.scrollHeight; }
        el.style.height = g.text.bh + "px"; el.style.justifyContent = "center";
        g.fs = fs; g.textH = hh;
        g.text.cy = 0;
      } else {
        el.style.height = "auto";
        let hh = Math.ceil(el.scrollHeight / 2) * 2;
        el.style.height = hh + "px";
        const pad = 20, zoneH = (Hp - 2 * pad - hh) - 6;
        g.text = { bw: g.text.bw, bh: hh, cx: 0, cy: -(Hp / 2 - pad - hh / 2) };
        g.zone = { x: 0, y: (Hp / 2 - 10 - zoneH / 2), w: Wp - 28, h: zoneH };
        g.gutter = 0; g.fs = fs; g.textH = hh;
      }
      sh.txt.position.set(g.text.cx, g.text.cy, 1);
    }
    for (const sh of sheets) placeModel(sh);
    buildThread();
  }

  const KS = () => mobile ? .66 : .72;
  const tmpM = new THREE.Matrix4();
  function placeModel(sh) {
    const g = geom[sh.i], md = MODELS[sh.key], z = g.zone;
    const S = Math.min(z.w / md.w, z.h / md.h);
    g.S = S; g.cx = z.x; g.cy = z.y - (md.dy || 0) * S;
    // Modell sitzt in der Zone, mobile ganz oben ausgerichtet
    updateShear(sh, 1);
  }
  function updateShear(sh, rest) {
    const g = geom[sh.i], S = g.S, k = KS() * rest;
    tmpM.set(S, 0, 0, g.cx, 0, S * k, -S, g.cy, 0, S, 0, 1.2, 0, 0, 0, 1);
    sh.model.holder.matrix.copy(tmpM); sh.model.holder.matrixWorldNeedsUpdate = true;
  }

  // ---------- Faden: rote Linie von Blatt zu Blatt ----------
  const threadMat = new THREE.ShaderMaterial({
    uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uW: { value: 2.5 } },
    vertexShader: `attribute vec3 aOther; attribute float aSide; attribute float aDir; uniform vec2 uRes; uniform float uW;
      void main() {
        vec4 a = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec4 b = projectionMatrix * modelViewMatrix * vec4(aOther, 1.0);
        vec2 pa = a.xy / max(a.w, 1e-3) * uRes * .5, pb = b.xy / max(b.w, 1e-3) * uRes * .5;
        vec2 d = pb - pa; float l = length(d); d = l > 1e-4 ? d / l * aDir : vec2(1.0, 0.0);
        vec2 nr = vec2(-d.y, d.x);
        gl_Position = a + vec4(nr * aSide * uW * .5 * 2.0 / uRes * a.w, 0.0, 0.0);
      }`,
    fragmentShader: `void main(){ gl_FragColor = vec4(0.831, 0.008, 0.208, 1.0);
#include <colorspace_fragment>
}`,
    transparent: false, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const dotMat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: 11 } },
    vertexShader: "uniform float uSize; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize; }",
    fragmentShader: `void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); if (d > .5) discard; gl_FragColor = vec4(0.831, 0.008, 0.208, 1.0 - smoothstep(.42, .5, d));
#include <colorspace_fragment>
}`,
    transparent: true, depthWrite: false
  });
  let thread = null, dot = null, threadPts = [], threadBounds = [];
  function buildThread() {
    if (thread) { scene.remove(thread); thread.geometry.dispose(); }
    if (dot) { scene.remove(dot); dot.geometry.dispose(); }
    const pts = [], bounds = []; // je Blatt: [Anfang, Ende] als Punktindex; je Fahrt: [Ende Blatt, Anfang nächstes Blatt]
    const W = Wp, v3 = (sh, x, y, z) => sh.g.localToWorld(new THREE.Vector3(x, y, z));
    const line = i => {
      const sh = sheets[i], gx = mobile ? -Wp / 2 + 9 : geom[i].gutter, y0 = Hp / 2 * .86, y1 = -Hp / 2 * .86;
      return [v3(sh, gx, y0, 2.2), v3(sh, gx, y1, 2.2)];
    };
    for (let i = 0; i < N; i++) {
      const [a, b] = line(i), n = 60, start = pts.length;
      for (let k = 0; k <= n; k++) pts.push(a.clone().lerp(b, k / n));
      bounds.push({ a: start, b: pts.length - 1 });
      if (i < N - 1) {
        const [a2] = line(i + 1);
        const na = new THREE.Vector3(0, 0, 1).applyQuaternion(sheets[i].g.quaternion), nb = new THREE.Vector3(0, 0, 1).applyQuaternion(sheets[i + 1].g.quaternion);
        const c1 = b.clone().addScaledVector(na, .05 * W).add(new THREE.Vector3(0, -Math.max(.35 * W, vh * 1.1), 0));
        const c2 = a2.clone().addScaledVector(nb, .05 * W).add(new THREE.Vector3(0, Math.max(.35 * W, vh * 1.1), 0));
        const mid = b.clone().lerp(a2, .5).add(new THREE.Vector3(0, 0, .25 * W));
        const cur = new THREE.CatmullRomCurve3([b, c1, mid, c2, a2], false, "centripetal");
        const m = 180, s0 = pts.length;
        for (let k = 1; k < m; k++) pts.push(cur.getPoint(k / m));
        bounds.push({ a: s0, b: pts.length });
      }
    }
    threadPts = pts; threadBounds = bounds;
    const n = pts.length, pos = new Float32Array(n * 2 * 3), oth = new Float32Array(n * 2 * 3), side = new Float32Array(n * 2), dir = new Float32Array(n * 2), idx = [];
    for (let j = 0; j < n; j++) {
      const p = pts[j], o = j < n - 1 ? pts[j + 1] : pts[j - 1], dsg = j < n - 1 ? 1 : -1;
      for (let s = 0; s < 2; s++) { const q = (j * 2 + s); pos.set([p.x, p.y, p.z], q * 3); oth.set([o.x, o.y, o.z], q * 3); side[q] = s ? 1 : -1; dir[q] = dsg; }
      if (j < n - 1) idx.push(j * 2, j * 2 + 1, j * 2 + 2, j * 2 + 1, j * 2 + 3, j * 2 + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("aOther", new THREE.BufferAttribute(oth, 3));
    geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1)); geo.setAttribute("aDir", new THREE.BufferAttribute(dir, 1));
    geo.setIndex(idx); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    thread = new THREE.Mesh(geo, threadMat); thread.frustumCulled = false; thread.renderOrder = 5; scene.add(thread);
    const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3)); dg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    dot = new THREE.Points(dg, dotMat); dot.frustumCulled = false; dot.renderOrder = 6; scene.add(dot);
    threadMat.uniforms.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
    threadMat.uniforms.uW.value = 2.4 * renderer.getPixelRatio();
    dotMat.uniforms.uSize.value = 11 * renderer.getPixelRatio();
  }
  function setThread(h, tl) { // h: Punktindex (Bruch), tl: Beginn der sichtbaren Linie
    if (!thread) return;
    const n = threadPts.length, hi = clamp(h, 0, n - 1), i0 = Math.floor(hi), f = hi - i0;
    const t0i = Math.floor(clamp(tl, 0, n - 1)); thread.geometry.setDrawRange(t0i * 6, Math.max(0, i0 - t0i) * 6);
    const p = threadPts[i0].clone().lerp(threadPts[Math.min(n - 1, i0 + 1)], f);
    dot.geometry.attributes.position.setXYZ(0, p.x, p.y, p.z); dot.geometry.attributes.position.needsUpdate = true;
    // Thread bis zum Punkt: letzte Strecke bis zum exakten Kopf wird nicht ergänzt (< 1 Punkt)
  }

  // ---------- Fahrten ----------
  const nrm = i => new THREE.Vector3(0, 0, 1).applyQuaternion(sheets[i].g.quaternion);
  const restPos = i => sheets[i].g.position.clone().addScaledVector(nrm(i), fdist);
  let flights = [];
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // Punkt im Modellraum eines Blatts (x rechts, z nach unten auf dem Blatt, N Höhe über dem Blatt) in Weltkoordinaten
  const mp = (i, x, z, N) => { const g = geom[i], S = g.S; return sheets[i].g.localToWorld(V3(g.cx + x * S, g.cy - z * S, N * S)); };
  const lp = (i, x, y, z) => sheets[i].g.localToWorld(V3(x, y, z));
  function buildFlights() {
    const W = Wp, c = i => sheets[i].g.position.clone();
    const g0 = geom[0], mx = g0.cx, my = g0.cy;
    const g1 = geom[1];
    const px = -3.75;                                    // erste Öffnung der Palette
    const F0 = {
      P: [restPos(0), lp(0, mx - .1 * W, my + .3 * W, .78 * W), lp(0, mx + .04 * W, my + .5 * W, .36 * W), lp(0, mx + .22 * W, my + .62 * W, -.12 * W), lp(1, -.8 * W, .14 * W, .9 * W), restPos(1)],
      T: [c(0), mp(0, 0, .05, .8), mp(0, 0, .05, .6), lp(1, -.6 * W, 0, -.3 * W), c(1), c(1)]
    };
    const F1 = {
      P: [restPos(1), mp(1, px, 6.4, 3.6), mp(1, px, 3.4, 1.1), mp(1, px, 1.7, .17), mp(1, px, .25, .17), mp(1, px, -1.6, .34), mp(1, px, -4.2, 1.2), lp(1, -.62 * W, .62 * W, .12 * W), lp(2, .9 * W, .3 * W, .9 * W), restPos(2)],
      T: [c(1), mp(1, px, 1.5, .2), mp(1, px, -.2, .15), mp(1, px, -1.6, .2), mp(1, px, -3.2, .4), mp(1, px, -6.5, .8), mp(1, px, -9, 1.5), lp(2, -.3 * W, 0, 0), c(2), c(2)]
    };
    flights = [F0, F1].map(f => ({ P: new THREE.CatmullRomCurve3(f.P, false, "centripetal"), T: new THREE.CatmullRomCurve3(f.T, false, "centripetal") }));
  }

  // ---------- Scroll: Abschnitte (in vh) ----------
  const SEG = { R: [250, 350, 280], F: [170, 170] };
  const BUILD = .7;           // Anteil der Ruhelage, in dem sich das Modell aufbaut
  const PRE = .3;             // Anteil der Fahrt, vor deren Ende der Aufbau beginnt
  let ST = null;
  function setScrollRange() {
    const u = vh / 100, a = [0]; // Beginn jedes Abschnitts: R0, F0, R1, F1, R2
    const order = [SEG.R[0], SEG.F[0], SEG.R[1], SEG.F[1], SEG.R[2]];
    for (const l of order) a.push(a[a.length - 1] + l * u);
    ST = { u, a, rest: [0, 2, 4].map(i => [a[i], a[i + 1]]), fl: [1, 3].map(i => [a[i], a[i + 1]]), total: a[a.length - 1] };
    spacer.style.height = Math.round(ST.total + vh) + "px";
    scrollTotal = ST.total;
  }
  function slideTarget(i) { const [a, b] = ST.rest[i]; return Math.round(a + (b - a) * (BUILD + .02)); }

  // ---------- Zustand je Bild ----------
  const camTarget = new THREE.Vector3(), tmpV = new THREE.Vector3(), tmpP = new THREE.Vector3();
  let introStart = -1, introS = 0;
  const dbgS = {};
  const state = { u: 0, s: [0, 0, 0], head: 0 };
  function evalScroll(y) {
    const { a, rest, fl } = ST;
    let u, restIdx = -1, fIdx = -1, t = 0;
    if (y < a[1]) { u = 0; restIdx = 0; }
    else if (y < a[2]) { t = (y - a[1]) / (a[2] - a[1]); u = t; fIdx = 0; }
    else if (y < a[3]) { u = 1; restIdx = 1; }
    else if (y < a[4]) { t = (y - a[3]) / (a[4] - a[3]); u = 1 + t; fIdx = 1; }
    else { u = 2; restIdx = 2; }
    // Fortschritt der Modelle
    const s = [];
    for (let i = 0; i < N; i++) {
      const [r0, r1] = rest[i], fLen = i === 0 ? 0 : fl[i - 1][1] - fl[i - 1][0];
      const begin = i === 0 ? 0 : r0 - PRE * fLen, end = r0 + (r1 - r0) * BUILD;
      s.push(clamp((y - begin) / (end - begin), 0, 1));
    }
    // Faden
    let head = 0, tail = 0;
    if (restIdx >= 0) { const [r0, r1] = rest[restIdx], q = clamp((y - r0) / (r1 - r0), 0, 1), b = threadBounds[restIdx * 2]; head = b.a + (b.b - b.a) * q; tail = b.a; }
    else {
      const b = threadBounds[fIdx * 2 + 1], e = smoother(t); head = b.a + (b.b - b.a) * e;
      tail = Math.max(threadBounds[fIdx * 2].a, head - 210 * (1 - sstep(.72, .98, t)));
    }
    return { u, s, head, tail, t, fIdx };
  }
  function pose(u) {
    const i = Math.min(N - 2, Math.floor(u)), t = u - i;
    if (u <= 0) { camera.position.copy(restPos(0)); camTarget.copy(sheets[0].g.position); }
    else if (u >= N - 1) { camera.position.copy(restPos(N - 1)); camTarget.copy(sheets[N - 1].g.position); }
    else {
      const e = smoother(t);
      flights[i].P.getPoint(e, camera.position); flights[i].T.getPoint(e, camTarget);
    }
    camera.up.set(0, 1, 0);
    camera.lookAt(camTarget);
    camera.updateMatrixWorld(true);
  }

  const lightV = new THREE.Vector3(), normV = new THREE.Vector3(), LS = new THREE.Vector3(-.45, .5, .75).normalize();
  function applyState(st, now) {
    const u = st.u;
    pose(u);
    // Text und Modelle
    for (const sh of sheets) {
      const i = sh.i, d = Math.abs(u - i);
      const op = 1 - sstep(.03, .2, d);
      if (Math.abs(op - sh.op) > .001 || sh.opInit !== true) {
        sh.op = op; sh.opInit = true;
        sh.el.style.opacity = op.toFixed(3);
        const on = op > .02;
        sh.el.style.visibility = on ? "visible" : "hidden";
        sh.el.style.pointerEvents = op > .6 ? "auto" : "none";
      }
      sh.txt.visible = d < 1.05;
      let s = st.s[i];
      if (i === 0) s = Math.max(s, introS);
      if (dbgS[i] !== undefined) s = dbgS[i];
      if (Math.abs(s - sh.s) > 1e-5 || sh.sInit !== true) {
        sh.s = s; sh.sInit = true;
        sh.model.update(s);
        for (const m of sh.model.mats) m.uniforms.uS.value = s;
      }
      sh.model.holder.visible = s > .004 && d < 1.6;
      // Blattnormale und Licht in Weltkoordinaten
      sh.g.updateMatrixWorld();
      lightV.copy(LS).applyQuaternion(sh.g.quaternion); normV.set(0, 0, 1).applyQuaternion(sh.g.quaternion);
      for (const m of sh.model.mats) if (m.uniforms.uL) { m.uniforms.uL.value.copy(lightV); m.uniforms.uN.value.copy(normV); }
      updateShear(sh, 1 - sstep(.02, .24, d));
    }
    setThread(st.head, st.tail);
  }

  // ---------- Hauptschleife ----------
  let last = performance.now(), lastCur = -1;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    const target = clamp(scrollY, 0, scrollTotal);
    if (tween) stepTween(now);
    const k = 1 - Math.exp(-dt * 7);
    cur += (target - cur) * k;
    if (Math.abs(target - cur) < .05) cur = target;
    // Einstieg: das Haus baut sich beim Laden einmal selbst auf
    let intro = introS;
    if (introStart >= 0) { const t = clamp((now - introStart) / 3600, 0, 1); intro = smoother(t); if (t >= 1) introStart = -2; }
    const introChanged = intro !== introS; introS = intro;
    if (cur !== lastCur || dirty || introChanged || introStart >= 0) {
      lastCur = cur;
      const st = evalScroll(cur); Object.assign(state, st);
      applyState(st, now);
      renderer.render(scene, camera); css.render(cssScene, camera);
      dirty = false;
      updateSlides(st);
    }
  }

  // ---------- Slides ----------
  const bPrev = document.getElementById("sl-prev"), bNext = document.getElementById("sl-next"), lbl = document.getElementById("sl-lbl");
  let curIdx = -1;
  function updateSlides(st) {
    const idx = clamp(Math.round(st.u), 0, N - 1);
    if (idx === curIdx) return; curIdx = idx;
    lbl.innerHTML = `${idx + 1} / ${N} · <b>${sheets[idx].name}</b>`;
    bPrev.disabled = idx === 0; bNext.disabled = idx === N - 1;
  }
  let tween = null;
  function stepTween(now) {
    const t = clamp((now - tween.t0) / tween.dur, 0, 1), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo({ top: tween.from + (tween.to - tween.from) * e, behavior: "instant" });
    if (t >= 1) tween = null;
  }
  function goSheet(i) {
    i = clamp(i, 0, N - 1);
    tween = { from: scrollY, to: slideTarget(i), t0: performance.now(), dur: 2000 };
  }
  const stopTween = () => { tween = null; };
  addEventListener("wheel", stopTween, { passive: true });
  addEventListener("touchstart", stopTween, { passive: true });
  bPrev.addEventListener("click", () => goSheet(clamp(Math.round(state.u), 0, N - 1) - 1));
  bNext.addEventListener("click", () => goSheet(clamp(Math.round(state.u), 0, N - 1) + 1));
  addEventListener("keydown", e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight") { e.preventDefault(); goSheet(clamp(Math.round(state.u), 0, N - 1) + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goSheet(clamp(Math.round(state.u), 0, N - 1) - 1); }
    else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", " ", "Home", "End"].includes(e.key)) stopTween();
  });
  document.getElementById("home").addEventListener("click", e => { e.preventDefault(); goSheet(0); });
  document.querySelector('#start a[href="#arbeit"]').addEventListener("click", e => { e.preventDefault(); goSheet(1); });

  // ---------- Start ----------
  addEventListener("resize", () => { layout(); buildFlights(); });
  Promise.all([document.fonts.ready, document.fonts.load('300 40px "Newsreader"'), document.fonts.load('italic 300 40px "Newsreader"'), document.fonts.load('400 18px "Schibsted Grotesk"'), document.fonts.load('600 18px "Schibsted Grotesk"')]).catch(() => { }).then(() => {
    layout(); buildFlights();
    cur = clamp(scrollY, 0, scrollTotal);
    if (scrollY < 4) introStart = performance.now() + 500;
    requestAnimationFrame(frame);
  });

  // Prüfhilfe
  window.__blatt = {
    go: y => { window.scrollTo({ top: y, behavior: "instant" }); cur = y; dirty = true; },
    snap() { cur = clamp(scrollY, 0, scrollTotal); dirty = true; },
    goSheet, stopTween,
    info: () => ({ vw, vh, mobile, Wp, Hp, fdist, ST, state, geom, cur, scrollY, introS }),
    setS: (i, v) => { if (v === null) delete dbgS[i]; else dbgS[i] = v; dirty = true; },
    setIntro: v => { introStart = -2; introS = v; dirty = true; },
    slideTarget, sheets, flightsRef: () => flights, poseAt: (u) => { pose(u); return { p: camera.position.toArray(), t: camTarget.toArray() }; }
  };
}
