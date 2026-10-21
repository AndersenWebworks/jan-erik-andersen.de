// Raumtext 2: Kamerafahrt durch einen weißen Raum mit Faltmodellen; der Text steht auf den Flächen der Modelle.
// Scroll → gedämpfter Fortschritt S (Stop-Index, stetig) → Zeitverzerrung (langsam an den Lesestellungen, nie null) → Bahnparameter.
// Kein Ruheplateau, kein Einrasten, kein Einfrieren.
import * as THREE from "three";
import { Model, kit, paperMaterial, edgeMaterial, sm5 } from "./falt.js";
import { readSpec, buildBlock, buildWord, FONT, TCOL } from "./text.js";
import { STATIONS, TOPICS, SECTION_STOP } from "./szene.js";
import { BILDER } from "./bilder/bilder.js";

const canvas = document.getElementById("room");
let renderer = null;
const probe = document.createElement("canvas");
if (probe.getContext("webgl2") || probe.getContext("webgl")) {
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); if (!renderer.getContext()) renderer = null; } catch (e) { renderer = null; }
}
if (renderer) start(renderer).catch(e => { console.error("Raumtext 2: Start fehlgeschlagen, statische Fassung", e); document.documentElement.classList.remove("webgl"); });

async function start(renderer) {
  const root = document.documentElement;
  root.classList.add("webgl");
  canvas.addEventListener("webglcontextlost", () => root.classList.remove("webgl"));
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  renderer.setClearColor(0xffffff, 1);

  const FOV = 40, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2)), FS = .08; // FS: Fließtextgröße in Metern
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, .08, 220);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const V = () => new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const NS = STATIONS.length;

  // ---------- Bilder (eingebettet, ohne Nachladen) ----------
  const IMG = {};
  const imgReady = Promise.all(Object.entries(BILDER).map(async ([k, b64]) => {
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const bmp = await createImageBitmap(new Blob([buf], { type: "image/jpeg" }));
    const tex = new THREE.Texture(bmp); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
    IMG[k] = { tex, A: bmp.width / bmp.height };
  }));
  await imgReady;
  function makeImg(key, w, h, crop) {
    const im = IMG[key];
    if (!crop) { const a = w / h; crop = a < im.A ? [0, 0, a / im.A, 1] : [0, 0, 1, im.A / a]; }
    const [u0, v0, u1, v1] = crop;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(w / 2, -h / 2, 0);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + (1 - uv.getY(i)) * (v1 - v0));
    const mat = new THREE.MeshBasicMaterial({ map: im.tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.FrontSide });
    const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 2; mesh.frustumCulled = false;
    let op = -1;
    mesh.userData.item = { group: mesh, setOpacity: v => { if (v === op) return; op = v; mesh.visible = v > .01; mat.opacity = v; }, dispose: () => { geo.dispose(); mat.dispose(); }, links: [] };
    return mesh;
  }

  // ---------- Abschnitte bauen ----------
  let narrow = false, built = null;
  async function buildTexts(st) {
    const T = {};
    for (const [k, d] of Object.entries(st.texts)) {
      if (d.word) {
        const s = narrow ? d.ns : d.s, f = FONT[d.font];
        T[k] = await buildWord(d.word, { f, s, c: d.red ? TCOL.red : TCOL.ink }); T[k].s = s;
        T[k + "i"] = await buildWord(d.word, { f, s, c: "#ddd6ca" }); T[k + "i"].s = s; T[k + "i"].imprint = true;
      } else {
        T[k] = await buildBlock(readSpec(d.def), { fs: FS, W: (narrow ? d.nw : d.w) * FS, headScale: d.headScale, h3Scale: d.h3Scale, narrow });
      }
    }
    return T;
  }
  function disposeAll() {
    if (!built) return;
    for (const st of STATIONS) {
      if (!st.m) continue;
      scene.remove(st.mesh, st.lines); st.m.geoT.dispose(); st.m.geoL.dispose(); st.mesh.material.dispose(); st.lines.material.dispose();
      for (const it of st.items) { scene.remove(it.group); it.dispose(); }
      st.m = null;
    }
  }
  async function buildAll() {
    disposeAll();
    for (const st of STATIONS) {
      const T = await buildTexts(st);
      const imgs = [];
      T.img = (key, w, h, crop) => { const m = makeImg(key, w, h, crop); imgs.push(m.userData.item); return m; };
      const F = Model(), K = kit(F);
      // Hochformat: Der Lesetext steht auf einem zurückgelehnten Pult vorn im Bogen (Teil des Modells, klappt mit hoch);
      // das Modell selbst bleibt in seiner ganzen Form dahinter sichtbar.
      if (narrow) {
        const B = T[st.focus], put0 = K.put, mob = st.mob || {};
        K.put = (nd, obj, ul, vt, side, lift) => {
          if (obj !== B.group) return put0(nd, obj, ul, vt, side, lift);
          const Wp = B.W + .36, Hp = B.H + .36, x0 = (mob.x || 0) - Wp / 2, z = mob.z !== undefined ? mob.z : .9;
          const pd = K.panel(F.root, [x0, z], [x0 + Wp, z], [0, -1], .2, .34, Math.PI / 2 - .36, { lv: 30 });
          K.rect(pd, 0, 0, Wp, Hp, [.984, .98, .965], .5);
          for (const u of [.18, Wp - .18]) { const ft = K.panel(F.root, [x0 + u - .04, z - .02], [x0 + u + .04, z - .02], [0, 1], .2, .3, -(Math.PI / 2 - .5), { lv: 29 }); K.rect(ft, 0, 0, .08, .35, [.84, .81, .76], .4); }
          return put0(pd, obj, .18, Hp - .18, 1, lift);
        };
      }
      st.build(F, K, { narrow: false, mobile: narrow }, T);
      const m = F.finish(st.place);
      st.m = m; st.T = T;
      st.mesh = new THREE.Mesh(m.geoT, paperMaterial(0)); st.lines = new THREE.LineSegments(m.geoL, edgeMaterial());
      st.mesh.frustumCulled = st.lines.frustumCulled = false; st.mesh.renderOrder = 0; st.lines.renderOrder = 1;
      scene.add(st.mesh, st.lines);
      st.items = [];
      for (const [k, v] of Object.entries(T)) if (v && v.group) st.items.push(v);
      st.items.push(...imgs);
      for (const it of st.items) scene.add(it.group);
      st.s = -1;
    }
    built = narrow ? "n" : "d";
  }

  // ---------- Lesestellungen aus den Textflächen ----------
  let W = 1, H = 1;
  const poses = [];
  function readingPose(st) {
    const B = st.T[st.focus], M = st.m.frameAt(B.group, 1);
    const o = V().setFromMatrixPosition(M), X = V().setFromMatrixColumn(M, 0).normalize(), Y = V().setFromMatrixColumn(M, 1).normalize(), N = V().setFromMatrixColumn(M, 2).normalize();
    const C = o.clone().addScaledVector(X, B.W / 2).addScaledVector(Y, -B.H / 2);
    const px = narrow ? 16 : clamp(18 + (H - 900) / 540 * 3, 17, 21.5);
    let pe = px;
    const avail = narrow ? H * .6 : H - 74 - 104;
    if (B.H / FS * pe > avail) pe = avail / (B.H / FS);
    const depth = FS * H / (2 * TAN * pe);
    const bPx = B.H / FS * pe;
    let cx, cy;
    if (narrow) { cx = W / 2; cy = H - 98 - bPx / 2; }
    else { const Wc = Math.min(W, 1600); cx = W / 2 + st.side * Wc * .245; cy = (74 + H - 104) / 2; }
    const sx = cx / W * 2 - 1, sy = 1 - cy / H * 2;
    const yaw = THREE.MathUtils.degToRad(narrow ? 0 : st.yaw);
    const pitch = THREE.MathUtils.degToRad(narrow ? 21 : st.pitch);
    const h = V().set(-N.x, 0, -N.z).normalize(), c = Math.cos(yaw), s = Math.sin(yaw);
    const hx = h.x * c + h.z * s, hz = -h.x * s + h.z * c; h.set(hx, 0, hz);
    const Fw = h.clone().multiplyScalar(Math.cos(pitch)).add(V().set(0, -Math.sin(pitch), 0)).normalize();
    const R = V().crossVectors(Fw, UP).normalize(), U = V().crossVectors(R, Fw);
    const D = Fw.clone().addScaledVector(R, sx * TAN * (W / H)).addScaledVector(U, sy * TAN).normalize();
    const P = C.clone().addScaledVector(D, -depth / D.dot(Fw));
    return { P, T: P.clone().addScaledVector(Fw, 10), C, px: pe };
  }

  // ---------- Kamerabahn ----------
  let keys = [];
  function buildPath() {
    poses.length = 0;
    for (const st of STATIONS) poses.push(readingPose(st));
    keys = [];
    for (let k = 0; k < NS; k++) {
      keys.push({ c: k, P: poses[k].P.clone(), T: poses[k].T.clone() });
      if (k < NS - 1) {
        const vs = viasFor(k);
        for (const v of vs) keys.push({ c: k + v.u, P: v.p, T: v.t });
      }
    }
    // Tangenten (nicht gleichmäßige Catmull-Rom-Tangenten, C1)
    for (let i = 0; i < keys.length; i++) {
      const a = keys[Math.max(0, i - 1)], b = keys[Math.min(keys.length - 1, i + 1)], dc = b.c - a.c || 1;
      keys[i].mP = b.P.clone().sub(a.P).divideScalar(dc);
      keys[i].mT = b.T.clone().sub(a.T).divideScalar(dc);
    }
  }
  // Zwischenpunkte einer Fahrt (Welt): Standard = weicher Bogen mit leichtem Anstieg
  function viasFor(k) {
    const st = STATIONS[k], A = poses[k], B = poses[k + 1];
    if (st.out) return st.out({ A, B, W: (x, y, z) => st.m.toWorld(x, y, z), W2: (x, y, z) => STATIONS[k + 1].m.toWorld(x, y, z), narrow });
    // Standard: seitlich am Modell vorbei (Gegenseite des Textes), dann von vorn oben auf den nächsten Abschnitt zu
    const sd = st.side || 1;
    return [
      { u: .28, p: st.m.toWorld(-sd * 3.9, st.passY || 1.9, -1.0), t: st.m.toWorld(-sd * 3.2, st.passY ? st.passY - 1.6 : 1.0, -8) },
      { u: .72, p: B.P.clone().add(V().set(0, 1.4, 4.5)), t: B.T.clone().add(V().set(0, .3, 0)) }
    ];
  }
  const hP = V(), hT = V();
  function herm(c, outP, outT) {
    c = clamp(c, 0, NS - 1);
    let j = 0; while (j < keys.length - 2 && c > keys[j + 1].c) j++;
    const a = keys[j], b = keys[j + 1], h = b.c - a.c, t = clamp((c - a.c) / h, 0, 1), t2 = t * t, t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    outP.set(0, 0, 0).addScaledVector(a.P, h00).addScaledVector(a.mP, h10 * h).addScaledVector(b.P, h01).addScaledVector(b.mP, h11 * h);
    outT.set(0, 0, 0).addScaledVector(a.T, h00).addScaledVector(a.mT, h10 * h).addScaledVector(b.T, h01).addScaledVector(b.mT, h11 * h);
  }
  // Zeitverzerrung je Fahrt: an den Lesestellungen 4 % der mittleren Geschwindigkeit, nie null
  const VMIN = .04;
  const G4 = f => 3 * f / 8 - Math.sin(2 * Math.PI * f) / (4 * Math.PI) + Math.sin(4 * Math.PI * f) / (32 * Math.PI);
  const G2 = f => f / 2 - Math.sin(2 * Math.PI * f) / (4 * Math.PI);
  // Mischung aus sin² und sin⁴: breite, ruhige Lesezone, Spitze nur gut doppelt so schnell wie das Mittel
  const warp = S => { S = clamp(S, 0, NS - 1); const k = Math.min(Math.floor(S), NS - 2), f = S - k; return k + VMIN * f + (1 - VMIN) * (.45 * 2 * G2(f) + .55 * G4(f) / .375); };
  function poseAt(S, outP, outT) { herm(warp(S), outP, outT); }

  // ---------- Der rote Faden ----------
  const red = new THREE.Color(TCOL.red);
  const threadU = { uT: { value: 0 }, uColor: { value: red } };
  const threadMat = new THREE.ShaderMaterial({
    uniforms: threadU,
    vertexShader: `attribute float aT; varying float vT; varying float vDepth;
      void main() { vT = aT; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uT; varying float vT; varying float vDepth;
      void main() {
        float a = smoothstep(1.6, 4.5, vDepth) * (1.0 - smoothstep(22.0, 60.0, vDepth));
        float lit = mix(.22, 1.0, 1.0 - smoothstep(uT - .0005, uT + .0025, vT));
        gl_FragColor = vec4(mix(vec3(1.0), uColor, a * lit), 1.0);
        #include <colorspace_fragment>
      }`,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2
  });
  let thread = null, curve = null, tStop = [];
  function buildThread() {
    if (thread) { scene.remove(thread); thread.geometry.dispose(); }
    const pts = [], anchors = [];
    for (const st of STATIONS) {
      st.thread.forEach((q, i) => { const p = st.m.toWorld(q[0], .014, q[1]); if (i === st.dot) anchors.push(pts.length); pts.push(p); });
    }
    curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    const N = 3000, sp = curve.getSpacedPoints(N), hw = .018;
    const pos = new Float32Array((N + 1) * 6), at = new Float32Array((N + 1) * 2), idx = [];
    for (let i = 0; i <= N; i++) {
      const p = sp[i], q = sp[Math.min(N, i + 1)], r = sp[Math.max(0, i - 1)];
      const d = V().subVectors(q, r); d.y = 0; d.normalize(); const sd = V().crossVectors(d, UP).multiplyScalar(hw);
      pos.set([p.x - sd.x, p.y, p.z - sd.z, p.x + sd.x, p.y, p.z + sd.z], i * 6); at.set([i / N, i / N], i * 2);
      if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aT", new THREE.BufferAttribute(at, 1)); g.setIndex(idx);
    thread = new THREE.Mesh(g, threadMat); thread.frustumCulled = false; thread.renderOrder = 1; scene.add(thread);
    // Ankerparameter je Lesestellung
    tStop = anchors.map(ai => { const p = pts[ai]; let best = 0, bd = 1e9; for (let i = 0; i <= N; i++) { const d = sp[i].distanceToSquared(p); if (d < bd) { bd = d; best = i; } } return best / N; });
    // Haltestellen
    if (stations) { scene.remove(stations); stations.geometry.dispose(); }
    const sp3 = new Float32Array(tStop.length * 3);
    tStop.forEach((t, i) => { const p = curve.getPointAt(t); sp3.set([p.x, p.y + .006, p.z], i * 3); });
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp3, 3));
    stations = new THREE.Points(sg, dotMat(.07)); stations.frustumCulled = false; stations.renderOrder = 4; scene.add(stations);
  }
  const proj = { value: 1 };
  const dotMat = size => new THREE.ShaderMaterial({
    uniforms: { uProj: proj, uSize: { value: size }, uColor: { value: red } },
    vertexShader: `uniform float uProj; uniform float uSize; varying float vDepth;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uSize * uProj / max(vDepth, .2), 2.0, 64.0); }`,
    fragmentShader: `uniform vec3 uColor; varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - .5) * 2.0, aa = max(fwidth(d), .02);
        float a = (1.0 - smoothstep(1.0 - aa, 1.0, d)) * smoothstep(.6, 1.6, vDepth) * (1.0 - smoothstep(26.0, 60.0, vDepth));
        if (a < .01) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false
  });
  let stations = null;
  const dotGeo = new THREE.BufferGeometry(); dotGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  const dot = new THREE.Points(dotGeo, dotMat(.12)); dot.frustumCulled = false; dot.renderOrder = 5; scene.add(dot);

  // ---------- Faltzustand und Sichtbarkeit ----------
  function foldOf(k, S, t) {
    let a = sm5(clamp((S - (k - .86)) / .72, 0, 1));
    if (k === 0) a = sm5(clamp((t - .25) / 5.2, 0, 1));
    const b = k === NS - 1 ? 1 : 1 - sm5(clamp((S - (k + .58)) / .36, 0, 1));
    return Math.min(a, b);
  }
  const tmpV = V();
  function updateStations(S, t) {
    camera.updateMatrixWorld();
    for (let k = 0; k < NS; k++) {
      const st = STATIONS[k], s = foldOf(k, S, t);
      if (s !== st.s) { st.s = s; st.m.update(s); }
      for (const it of st.items) {
        tmpV.setFromMatrixPosition(it.group.matrix).applyMatrix4(camera.matrixWorldInverse);
        const d = -tmpV.z;
        let op = smooth(.8, 2.2, d) * (1 - smooth(20, 34, d));
        op *= it.imprint ? smooth(.05, .3, s) : smooth(.3, .78, s);
        it.setOpacity(Math.round(op * 200) / 200);
      }
    }
  }

  // ---------- Layout ----------
  let seg = 1, S = 0, S1 = 0, ready = false, layoutBusy = false, layoutAgain = false;
  const scroller = document.getElementById("scroller");
  async function layout() {
    if (layoutBusy) { layoutAgain = true; return; }
    layoutBusy = true;
    try {
      const keepS = ready ? S : clamp(scrollY / Math.max(1, seg), 0, NS - 1);
      W = innerWidth; H = innerHeight;
      const nar = W < 800;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, nar ? 2 : 1.75));
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
      proj.value = renderer.domElement.height / (2 * TAN);
      if (built !== (nar ? "n" : "d")) { narrow = nar; await buildAll(); }
      buildPath(); buildThread();
      seg = narrow ? H * 2.8 : H * 3.3;
      scroller.style.height = Math.round((NS - 1) * seg + H) + "px";
      for (const st of STATIONS) st.s = -1;
      scrollTo({ top: Math.round(keepS * seg), behavior: "instant" });
      S = S1 = keepS;
      ready = true; wake(1500);
    } finally { layoutBusy = false; }
    if (layoutAgain) { layoutAgain = false; layout(); }
  }

  // ---------- Eingaben ----------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", e => { if (e.pointerType === "touch") return; mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; hover(e); });
  let kick = 0;
  function wake(ms = 800) { kick = performance.now() + ms; }
  addEventListener("scroll", () => wake(), { passive: true });
  let rz = null;
  addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(layout, 180); wake(1500); });

  const bPrev = document.getElementById("sl-prev"), bNext = document.getElementById("sl-next"), lbl = document.getElementById("sl-lbl");
  let shown = -1;
  const curStop = () => clamp(Math.round(S), 0, NS - 1);
  function updateSlides() {
    const c = curStop(); if (c === shown) return; shown = c;
    const t = STATIONS[c].topic;
    lbl.innerHTML = (t + 1) + " / " + TOPICS.length + " · <b>" + TOPICS[t] + "</b>";
    bPrev.disabled = c === 0; bNext.disabled = c === NS - 1;
  }
  let tw = null, goal = null;
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function tweenTo(stop, dur0) {
    stop = clamp(stop, 0, NS - 1); goal = stop;
    const y = Math.round(stop * seg), y0 = scrollY, dur = dur0 || 2600, t0 = performance.now();
    const my = tw = {};
    const step = now => {
      if (tw !== my) return;
      const x = clamp((now - t0) / dur, 0, 1);
      scrollTo({ top: y0 + (y - y0) * eio(x), behavior: "instant" }); wake(400);
      if (x < 1) requestAnimationFrame(step); else { tw = null; goal = null; }
    };
    requestAnimationFrame(step);
  }
  const stopTween = () => { tw = null; goal = null; };
  addEventListener("wheel", stopTween, { passive: true });
  addEventListener("touchstart", stopTween, { passive: true });
  addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && !(e.target.closest && e.target.closest(".slides"))) stopTween(); }, { passive: true });
  addEventListener("keydown", e => { if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") stopTween(); });
  function go(dir) {
    const cur = goal !== null ? goal : (dir > 0 ? Math.floor(S + .08) : Math.ceil(S - .08));
    tweenTo(cur + dir);
  }
  bPrev.addEventListener("click", () => go(-1));
  bNext.addEventListener("click", () => go(1));
  addEventListener("keydown", e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
    const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });
  const stopOfHash = h => SECTION_STOP[h.slice(1)];
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && a.getAttribute("href").length > 1) { const s = stopOfHash(a.getAttribute("href")); if (s !== undefined) { e.preventDefault(); tweenTo(s, 3000); } return; }
    if (e.target.closest && e.target.closest(".top, .slides, a, button")) return;
    const l = linkAt(e.clientX, e.clientY);
    if (!l) return;
    const h = l.href || "";
    if (h.startsWith("#")) { if (h.length > 1) { const s = stopOfHash(h); if (s !== undefined) tweenTo(s, 3000); } return; }
    if (/^(mailto|tel):/.test(h)) location.href = h; else if (h) window.open(h, "_blank", "noopener");
  });
  addEventListener("focusin", e => {
    const sec = e.target.closest && e.target.closest("main section"); if (!sec || tw) return;
    const s = SECTION_STOP[sec.id]; if (s !== undefined && Math.abs(S - s) > .5) tweenTo(s, 2000);
  });
  // Links auf den Flächen: Rechtecke des Blocks in Bildschirmkoordinaten
  const lp = V();
  function linkAt(x, y) {
    if (!ready) return null;
    for (const st of STATIONS) for (const it of st.items) {
      if (!it.links || !it.links.length || !it.group.visible || it.group.children.length === 0) continue;
      const fo = it.texts ? it.texts[0].fillOpacity : 0; if (fo < .5) continue;
      for (const l of it.links) {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const [a, b] of [[l.x0, l.y0], [l.x1, l.y0], [l.x1, l.y1], [l.x0, l.y1]]) {
          lp.set(a, -b, 0).applyMatrix4(it.group.matrixWorld).project(camera);
          const px = (lp.x + 1) / 2 * W, py = (1 - lp.y) / 2 * H;
          x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
        }
        if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return l;
      }
    }
    return null;
  }
  function hover(e) { document.body.style.cursor = linkAt(e.clientX, e.clientY) ? "pointer" : ""; }

  // ---------- Hauptschleife ----------
  const TAU = .34;
  let last = performance.now(), elapsed = 0;
  const cP = V(), cT = V(), introOff = new THREE.Vector3(0, 1.4, 2.6);
  function frame() {
    const now = performance.now(), dt = Math.min((now - last) / 1000, .1); last = now;
    requestAnimationFrame(frame);
    if (!ready) return;
    const tgt = clamp(scrollY / seg, 0, NS - 1);
    if (Math.abs(tgt - S) < .00005 && Math.abs(tgt - S1) < .00005) { S = S1 = tgt; } else {
      const kk = 1 - Math.exp(-dt / TAU); S1 += (tgt - S1) * kk; S += (S1 - S) * kk;
    }
    updateSlides();
    const intro = elapsed < 7;
    const busy = S !== tgt || now < kick || intro || Math.abs(mouse.tx - mouse.x) > .001 || Math.abs(mouse.ty - mouse.y) > .001;
    if (!busy) return;
    elapsed += dt;
    mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 1.5)); mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 1.5));
    poseAt(S, cP, cT);
    const ie = 1 - sm5(clamp(elapsed / 6.5, 0, 1));
    if (ie > 0) { cP.addScaledVector(introOff, ie); cT.addScaledVector(introOff, ie * .55); }
    camera.position.copy(cP);
    camera.lookAt(cT);
    camera.translateX(mouse.x * .06); camera.translateY(-mouse.y * .03);
    camera.updateMatrixWorld();
    // roter Punkt
    const k = Math.min(Math.floor(S), NS - 2), f = S - k, tD = tStop[k] + (tStop[k + 1] - tStop[k]) * f;
    const p = curve.getPointAt(clamp(tD, 0, 1));
    dotGeo.attributes.position.setXYZ(0, p.x, p.y + .062, p.z); dotGeo.attributes.position.needsUpdate = true;
    threadU.uT.value = tD;
    updateStations(S, elapsed);
    renderer.render(scene, camera);
  }
  // Prüfhilfe (nur Entwurf)
  window.__raum = {
    ready: () => ready, S: () => S, NS, seg: () => seg, topics: () => STATIONS.map(s => TOPICS[s.topic]),
    jump(s) { stopTween(); scrollTo({ top: Math.round(s * seg), behavior: "instant" }); S = S1 = s; wake(1500); },
    pose(s) { const p = V(), t = V(); poseAt(s, p, t); return { p: p.toArray(), t: t.toArray() }; },
    cam: () => camera.position.toArray(), go, tweenTo, label: () => lbl.textContent,
    px: k => poses[k] && poses[k].px, elapsed: () => elapsed, skipIntro() { elapsed = 7; }
  };
  await layout();
  frame();
}
