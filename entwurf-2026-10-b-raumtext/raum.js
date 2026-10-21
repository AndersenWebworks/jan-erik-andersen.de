// Raumtext: Kamerafahrt durch einen weißen Raum; die Texte stehen als Karten, Schilder und Bögen an festen Orten neben ihren Konstruktionen.
// Scroll = Position auf einer Strecke von Haltepunkten (Stops). Je Stop gibt es ein langes Ruheplateau (60 %), dazwischen eine kurze, weiche Fahrt.
import * as THREE from "three";
import { UNITS, buildUnit, lineMaterial, fillMaterial, moverPos } from "./konstruktion.js";
import { readSpec, buildCard, buildDeco, decoMaterial } from "./karten.js";

const canvas = document.getElementById("room");
let renderer = null;
const probe = document.createElement("canvas");
if (probe.getContext("webgl2") || probe.getContext("webgl")) {
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); if (!renderer.getContext()) renderer = null; } catch (e) { renderer = null; }
}
if (renderer) start(renderer).catch(e => { console.error("Raumtext: Start fehlgeschlagen, statische Fassung", e); document.documentElement.classList.remove("webgl"); });

async function start(renderer) {
  const root = document.documentElement;
  root.classList.add("webgl");
  canvas.addEventListener("webglcontextlost", () => root.classList.remove("webgl"));
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const OFF = "#303033", RED = "#d40235";
  const FOV = 42, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const CAP = 1440, K0 = .004; // K0: Weltmeter je Kartenpixel
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 200);
  const cc = new THREE.PerspectiveCamera(FOV, 1, .1, 200); // Hilfskamera für Ruhelagen
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease3 = x => x * x * (3 - 2 * x);

  const pathX = z => .5 * Math.sin(z * .15);
  const pathY = z => .16 * Math.sin(z * .11 + 1);
  const GY = -2.5, DROP = 1.0;
  const gyAt = z => pathY(z) + GY;

  // ---------- Haltepunkte ----------
  const TOPICS = ["Einstieg", "Gerwing", "Betreuung", "Modernisierung", "Shops", "Schnittstellen", "Gestaltung", "Weitere Arbeit", "Wie ich arbeite", "Werdegang", "Stimmen", "Agenturen", "Kontakt"];
  const STOPS = [
    { u: 0, sec: "#start", sel: ".panel", head: 1, k0: 1, hero: 1, carrier: "sheet", W: 700, side: -1, topic: 0 },
    { u: 1, sec: "#arbeit", sel: ".panel", head: 1, carrier: "board", topic: 1 },
    { u: 2, sec: "#leistungen", sel: "article", i: 0, head: 1, carrier: "fence", topic: 2 },
    { u: 3, sec: "#leistungen", sel: "article", i: 1, carrier: "banner", topic: 3 },
    { u: 4, sec: "#leistungen", sel: "article", i: 2, carrier: "shelf", topic: 4 },
    { u: 5, sec: "#leistungen", sel: "article", i: 3, carrier: "pipe", topic: 5 },
    { u: 6, sec: "#leistungen", sel: "article", i: 4, carrier: "clip", topic: 6 },
    { u: 7, sec: "#weitere", sel: ".panel", i: 0, head: 1, carrier: "board", topic: 7 },
    { u: 8, sec: "#weitere", sel: ".panel", i: 1, carrier: "banner", topic: 7 },
    { u: 9, sec: "#weitere", sel: ".panel", i: 2, carrier: "shelf", topic: 7 },
    { u: 10, sec: "#arbeitsweise", sel: ".panel", head: 1, carrier: "crane", topic: 8 },
    { u: 11, sec: "#werdegang", sel: ".panel", head: 1, rows: [0, 4], carrier: "stations", W: 640, topic: 9 },
    { u: 11, sec: "#werdegang", sel: ".panel", rows: [4, 8], carrier: "stations", W: 640, topic: 9, b: 1 },
    { u: 12, sec: "#stimmen", sel: "blockquote", i: 0, head: 1, carrier: "arc", W: 580, topic: 10 },
    { u: 13, sec: "#stimmen", sel: "blockquote", i: 1, carrier: "arc", W: 580, topic: 10 },
    { u: 14, sec: "#agenturen", sel: ".panel", head: 1, carrier: "scaffold", topic: 11 },
    { u: 15, sec: "#kontakt", sel: ".panel", head: 1, foot: 1, carrier: "door", W: 580, side: 1, topic: 12 }
  ];
  const NS = STOPS.length;
  const SECTION_STOP = { start: 0, arbeit: 1, leistungen: 2, weitere: 7, arbeitsweise: 10, werdegang: 11, stimmen: 13, agenturen: 15, kontakt: 16 };
  const SIDEV = [0, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 0];
  const firstStop = u => STOPS.findIndex(s => s.u === u), lastStop = u => STOPS.map(s => s.u).lastIndexOf(u);

  // ---------- Gemeinsame Shader: Bildschirmfotos (Gerwing) ----------
  const loader = new THREE.TextureLoader();
  const SHOT_TEX = {};
  for (const [k, url] of [["prod", "bilder/gerwing-produkt-ausschnitt.jpg"], ["order", "bilder/gerwing-bestellung.jpg"]]) {
    SHOT_TEX[k] = loader.load(url, tex => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; wake(600); });
  }
  const SHOT_VERT = `varying vec2 vUv; varying float vDepth;
    void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
  const SHOT_FRAG = `uniform sampler2D uMap; uniform float uOp; varying vec2 vUv; varying float vDepth;
    void main() {
      vec4 c = texture2D(uMap, vUv);
      float a = uOp * smoothstep(.6, 2.6, vDepth) * (1.0 - smoothstep(14.0, 40.0, vDepth));
      if (a < 0.004) discard;
      gl_FragColor = vec4(c.rgb, a * 0.97);
      #include <colorspace_fragment>
    }`;
  function shotMesh(u, sh) {
    const o = u.o, pos = [], W = p => [o.ox + p[0] * o.lat, o.oy + p[1] * o.hs, o.oz + o.zo + p[2]];
    for (const c of sh.c) pos.push(...W(c));
    const [u0, v0, u1, v1] = sh.uv;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([u0, v1, u1, v1, u1, v0, u0, v0]), 2));
    geo.setIndex([0, 3, 1, 1, 3, 2]);
    const mat = new THREE.ShaderMaterial({ uniforms: { uMap: { value: SHOT_TEX[sh.key] }, uOp: { value: 0 } }, vertexShader: SHOT_VERT, fragmentShader: SHOT_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false; mesh.renderOrder = -1; mesh.visible = false; scene.add(mesh);
    return { mesh, t0: sh.t0, d: sh.d };
  }

  // ---------- Der rote Faden ----------
  const LINE_DY = GY + .02, LINE_DX = -.32;
  let bend = null;
  const sm = x => x * x * (3 - 2 * x);
  const lineX = z => pathX(z) + LINE_DX + (bend ? (bend.xd - bend.base) * sm(clamp((bend.z0 - z) / (bend.z0 - bend.zd), 0, 1)) : 0);
  const red = new THREE.Color(RED);
  const lineUniforms = { uLightZ: { value: 0 }, uColor: { value: red }, uNear: { value: new THREE.Vector2(.5, 2) } };
  const lineMat = new THREE.ShaderMaterial({
    uniforms: lineUniforms,
    vertexShader: `varying float vDepth; varying float vZ;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; vZ = position.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uLightZ; uniform vec2 uNear; varying float vDepth; varying float vZ;
      void main() {
        float a = smoothstep(uNear.x, uNear.y, vDepth) * (1.0 - smoothstep(14.0, 46.0, vDepth));
        float lit = mix(0.07, 1.0, smoothstep(uLightZ - 0.6, uLightZ + 0.9, vZ));
        gl_FragColor = vec4(uColor, a * lit * 0.9);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false
  });
  let line = null, ticks = null;
  function buildLine(zEnd) {
    for (const o of [line, ticks]) if (o) { scene.remove(o); o.geometry.dispose(); }
    const pts = [], tp = [];
    for (let z = 6; z >= zEnd; z -= .5) pts.push(new THREE.Vector3(lineX(z), pathY(z) + LINE_DY, z));
    for (let z = 6; z >= zEnd; z -= 1) {
      const major = Math.round(z) % 5 === 0, h = major ? .34 : .14, x = lineX(z), y = pathY(z) + LINE_DY;
      tp.push(new THREE.Vector3(x - h, y, z), new THREE.Vector3(x + h, y, z));
    }
    line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
    ticks = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tp), lineMat);
    for (const o of [line, ticks]) { o.frustumCulled = false; o.renderOrder = 1; scene.add(o); }
  }
  // Der rote Punkt: einfarbige Scheibe, kein Schein
  const proj = { value: 1 };
  const dotVert = `uniform float uProj; uniform float uSize; attribute float aScale; varying float vDepth;
    void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uSize * aScale * uProj / max(vDepth, 0.2), 3.0, 60.0); }`;
  const dotFrag = `uniform vec3 uColor; uniform float uAlpha; varying float vDepth;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float aa = max(fwidth(d), 0.02);
      float a = (1.0 - smoothstep(1.0 - aa, 1.0, d)) * uAlpha * smoothstep(0.6, 2.0, vDepth);
      if (a < 0.01) discard;
      gl_FragColor = vec4(uColor, a);
      #include <colorspace_fragment>
    }`;
  const dotMat = (size, alpha) => new THREE.ShaderMaterial({ uniforms: { uProj: proj, uSize: { value: size }, uColor: { value: red }, uAlpha: { value: alpha } }, vertexShader: dotVert, fragmentShader: dotFrag, transparent: true, depthWrite: false });
  const lightGeo = new THREE.BufferGeometry();
  lightGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  lightGeo.setAttribute("aScale", new THREE.BufferAttribute(new Float32Array([1]), 1));
  const light = new THREE.Points(lightGeo, dotMat(.16, 1));
  light.frustumCulled = false; light.renderOrder = 5; scene.add(light);
  let stations = null;

  // ---------- Konstruktionen ----------
  const inkColor = new THREE.Color(OFF);
  const units = UNITS.map((def, i) => ({ def, i, z: -26 * i - (i > 11 ? 6 : 0), sideV: SIDEV[i], mesh: null, meshR: null, mat: null, matR: null, matM: null, movers: [], shots: [], spinners: [], fill: null, fillMat: null, o: null }));
  units[11].rowsT = [0, .12, .24, .36, .48, .6, .72, .84];
  function clearCons() {
    for (const u of units) {
      if (u.mesh) { scene.remove(u.mesh); u.mesh.geometry.dispose(); u.mat.dispose(); }
      if (u.meshR) { scene.remove(u.meshR); u.meshR.geometry.dispose(); u.matR.dispose(); }
      for (const m of u.movers) { scene.remove(m.mesh); m.mesh.geometry.dispose(); }
      for (const sh of u.shots) { scene.remove(sh.mesh); sh.mesh.geometry.dispose(); sh.mesh.material.dispose(); }
      for (const sp of u.spinners) { scene.remove(sp.mesh); sp.mesh.geometry.dispose(); }
      if (u.fill) { scene.remove(u.fill); u.fill.geometry.dispose(); u.fillMat.dispose(); }
      if (u.matM) u.matM.dispose();
      u.mesh = null; u.meshR = null; u.fill = null; u.movers = []; u.shots = []; u.spinners = [];
    }
  }
  let narrow = false, W = 1, Hh = 1, viewOff = 0;
  const latOf = u => narrow ? (u.def.nlat || .27) : .62 * clamp(Math.min(camera.aspect, CAP / Hh) / 1.6, .62, 1);
  function computeO() {
    units.forEach((u, i) => {
      const lat = latOf(u), hs = narrow ? .5 : .62, dens = narrow ? 2 : 1.35;
      const oz = u.z - 6, Lb = u.def.depth || 14, zoN = narrow ? -1.5 : 0;
      const ox = pathX(oz) + u.sideV * 5.8 * lat + (narrow ? 0 : (u.def.doorX || 0) * lat);
      u.o = { ox, oy: pathY(oz) + GY, oz, Lb, lat, hs, dens, zo: i === 0 ? 0 : zoN, wires: null };
      u.o.rl = z => (lineX(oz + z + u.o.zo) - ox) / lat;
      u.o.mod = 3.4;
      if (u.def.sync) u.o.rowsT = u.rowsT;
    });
  }
  const LW = (i, x, y, z) => { const o = units[i].o; return new THREE.Vector3(o.ox + x * o.lat, o.oy + y * o.hs, o.oz + o.zo + z); };
  function buildCons() {
    clearCons();
    units.forEach((u, i) => {
      const o = u.o, r = buildUnit(i, o);
      u.mat = lineMaterial(inkColor); u.matM = lineMaterial(inkColor); u.matM.uniforms.uProg.value = 1;
      u.gain = narrow ? .8 : .85;
      u.mesh = new THREE.LineSegments(r.geometry, u.mat);
      u.mesh.frustumCulled = false; u.mesh.renderOrder = 0; u.mesh.visible = false; scene.add(u.mesh);
      if (r.fill) { u.fillMat = fillMaterial(); u.fill = new THREE.Mesh(r.fill, u.fillMat); u.fill.frustumCulled = false; u.fill.renderOrder = -5; u.fill.visible = false; scene.add(u.fill); }
      if (r.red) { u.matR = lineMaterial(red); u.meshR = new THREE.LineSegments(r.red, u.matR); u.meshR.frustumCulled = false; u.meshR.renderOrder = 1; u.meshR.visible = false; scene.add(u.meshR); }
      u.movers = r.movers.map(m => { const mesh = new THREE.LineSegments(m.geo, u.matM); mesh.frustumCulled = false; mesh.renderOrder = 0; mesh.visible = false; scene.add(mesh); return { ...m, mesh }; });
      u.shots = (r.shots || []).map(sh => shotMesh(u, sh));
      u.spinners = (r.spinners || []).map(sp => {
        const mesh = new THREE.LineSegments(sp.geo, u.mat);
        mesh.frustumCulled = false; mesh.renderOrder = 0; mesh.visible = false;
        mesh.position.set(o.ox + sp.pos[0] * o.lat, o.oy + sp.pos[1] * o.hs, o.oz + o.zo + sp.pos[2]);
        scene.add(mesh); return { mesh };
      });
    });
  }
  function updateCons(S, t) {
    for (let i = 0; i < units.length; i++) {
      const u = units[i], s0 = firstStop(i), s1 = lastStop(i);
      const a = s0 - .8, b = s1 - .12;
      let p = ease3(clamp((S - a) / (b - a), 0, 1));
      if (i === 0) p = Math.min(p, ease3(clamp(t / 5.5, 0, 1)));
      let f = i === units.length - 1 ? 1 : 1 - ease3(clamp((S - (s1 + .7)) / .6, 0, 1)); f *= f;
      const vis = p > 0 && f > .004;
      u.mesh.visible = vis;
      u.mat.uniforms.uProg.value = p;
      u.mat.uniforms.uGain.value = u.matM.uniforms.uGain.value = u.gain * f;
      if (u.fill) { u.fill.visible = vis; u.fillMat.uniforms.uProg.value = p; u.fillMat.uniforms.uFade.value = f; }
      if (u.meshR) { u.meshR.visible = vis; u.matR.uniforms.uProg.value = p; u.matR.uniforms.uGain.value = Math.min(1, u.gain * 1.15) * f; }
      for (const m of u.movers) {
        const k = (p - (m.t0 * .8 + .09)) / (m.d * .8);
        m.mesh.visible = vis && k > 0 && k < 1;
        if (m.mesh.visible) {
          const q = moverPos(m, k), o = u.o;
          m.mesh.position.set(o.ox + q[0] * o.lat, o.oy + q[1] * o.hs, o.oz + o.zo + q[2]);
          m.mesh.rotation.y = ease3(k) * (m.rot === undefined ? .6 : m.rot);
        }
      }
      for (const sh of u.shots) {
        const a0 = sh.t0 * .8 + .09, op = clamp((p - a0) / Math.max(.02, sh.d * .8), 0, 1) * f;
        sh.mesh.visible = vis && op > .004; sh.mesh.material.uniforms.uOp.value = op;
      }
      for (const sp of u.spinners) { sp.mesh.visible = vis; sp.mesh.rotation.y = t * .7 + S * .5; }
    }
  }

  // ---------- Kamera: Ruhelagen und Fahrten ----------
  const REST = [
    {}, { orb: .09, tz: .2, ty: .08, lock: .85 }, { tx: .4, orb: -.07, lock: .8 }, { tz: -.5, ty: .18, lock: .8 }, { ty: .3, orb: .06, lock: .85 },
    { orb: -.1, tz: .15, lock: .85 }, { ty: .55, tz: .2, lock: .9 }, { orb: .1, ty: .08, lock: .85 }, { tz: .5, ty: .2, orb: -.06, lock: .8 }, { tx: -.3, lock: .5 },
    { ty: .35, tz: -.2, lock: .9 }, { tz: .4, lock: .4 }, { tz: .35, ty: .1, lock: .6 }, { tz: .4, lock: .3 }, { tx: .3, orb: .05, lock: .8 }, { orb: -.06, tz: .25, lock: .8 }
  ];
  const v = () => new THREE.Vector3();
  const cmP = v(), cmP0 = v(), cmA = v(), cmD0 = v(), cmD1 = v(), cmR = v(), cmU = v(), cmF = v(), cmT = v();
  const cmQ = new THREE.Quaternion(), cmQa = new THREE.Quaternion(), cmI = new THREE.Quaternion(), tmpCam = new THREE.PerspectiveCamera();
  let rests = [], segs = [];
  function restOf(k) {
    const u = units[k], z = u.z, m = REST[k], o = u.o;
    cmP.set(pathX(z), pathY(z), z); cmT.set(pathX(z - 8), pathY(z - 8) - DROP, z - 8);
    tmpCam.position.copy(cmP); tmpCam.lookAt(cmT); cmQ.copy(tmpCam.quaternion);
    const f = narrow ? .45 : 1;
    if (k > 0 && (m.tx || m.ty || m.tz || m.orb)) {
      cmR.set(1, 0, 0).applyQuaternion(cmQ); cmU.set(0, 1, 0).applyQuaternion(cmQ); cmF.set(0, 0, -1).applyQuaternion(cmQ);
      cmA.set(o.ox, o.oy + 1.4 * o.hs, o.oz + o.zo - 6.5);
      cmP0.copy(cmP);
      cmP.addScaledVector(cmR, (m.tx || 0) * f).addScaledVector(cmU, (m.ty || 0) * f).addScaledVector(cmF, (m.tz || 0) * f);
      if (m.orb) { const a = m.orb * f, c = Math.cos(a), sn = Math.sin(a), dx = cmP.x - cmA.x, dz = cmP.z - cmA.z; cmP.x = cmA.x + dx * c + dz * sn; cmP.z = cmA.z - dx * sn + dz * c; }
      cmD0.copy(cmA).sub(cmP0).normalize(); cmD1.copy(cmA).sub(cmP).normalize();
      cmQa.setFromUnitVectors(cmD0, cmD1); cmI.identity().slerp(cmQa, m.lock === undefined ? .8 : m.lock);
      cmQ.premultiply(cmI);
      cmT.set(0, 0, -8).applyQuaternion(cmQ).add(cmP);
    }
    return { P: cmP.clone(), T: cmT.clone() };
  }
  // Gerwing-Gerät in Weltkoordinaten (gleiche Abbildung wie rig() in konstruktion.js)
  function rigW(i, x, y, z, op) {
    const o = units[i].o, s = (o.lat > .3 ? o.lat / .62 : .55) * op.k, cy = Math.cos(op.yaw), sy = Math.sin(op.yaw);
    return LW(i, (x * cy + z * sy + op.dx) * s / o.lat, (y + op.dy) * s / o.hs, -5.4 + (-x * sy + z * cy) * s);
  }
  const via = (u, p) => ({ u, p, t: p.clone().add(new THREE.Vector3(0, -.55, -8)) });
  function viasFor(s) {
    const G = { yaw: -.22, dy: -.4, dx: -.35, k: .9 };
    if (s === 1) return [via(.26, rigW(1, 2.0, 1.7, 4.4, G)), via(.42, rigW(1, 2.0, 1.45, 1.7, G)), via(.58, rigW(1, 2.0, 1.5, -1.8, G))]; // dicht über Palette und Paket hinweg
    if (s === 4) return [via(.28, LW(4, -2.5, .85, -1.5)), via(.38, LW(4, -2.5, .62, -5.7)), via(.48, LW(4, -2.5, .75, -9.2))]; // durch das leere Regal
    if (s === 10) return [via(.26, LW(10, -.1, 1.7, -1.0)), via(.42, LW(10, -.1, 1.6, -6.5)), via(.58, LW(10, -.1, 1.7, -12.5))]; // unter dem Kran durch den Prüfrahmen
    if (s === 13) return [via(.28, LW(12, .4, 1.0, -2.2)), via(.42, LW(12, .4, 1.0, -6.1)), via(.58, LW(12, .4, 1.0, -9.6))]; // durch den Bogen
    return [];
  }
  function buildRig() {
    rests = STOPS.map((st, s) => {
      const r = restOf(st.u);
      if (st.b) { const F = r.T.clone().sub(r.P).normalize(), Rr = new THREE.Vector3().crossVectors(F, new THREE.Vector3(0, 1, 0)).normalize(); F.multiplyScalar(7); Rr.multiplyScalar(1.6); r.P.add(F).add(Rr); r.T.add(F).add(Rr); }
      return r;
    });
    segs = [];
    for (let s = 0; s < NS - 1; s++) {
      const vs = viasFor(s), pts = [rests[s].P], tg = [rests[s].T], ks = [0];
      for (const x of vs) { pts.push(x.p); tg.push(x.t); ks.push(x.u); }
      pts.push(rests[s + 1].P); tg.push(rests[s + 1].T); ks.push(1);
      segs.push({ pts, tg, ks });
    }
  }
  function herm(pts, ks, u, out) {
    const n = ks.length - 1; let j = 0;
    while (j < n - 1 && u > ks[j + 1]) j++;
    const h = ks[j + 1] - ks[j], t = clamp((u - ks[j]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
    const tan = (i, tmp) => i === 0 ? tmp.copy(pts[1]).sub(pts[0]).divideScalar(ks[1] - ks[0]) : i === n ? tmp.copy(pts[n]).sub(pts[n - 1]).divideScalar(ks[n] - ks[n - 1]) : tmp.copy(pts[i + 1]).sub(pts[i - 1]).divideScalar(ks[i + 1] - ks[i - 1]);
    const m0 = tan(j, hA).multiplyScalar(h), m1 = tan(j + 1, hB).multiplyScalar(h);
    return out.set(0, 0, 0).addScaledVector(pts[j], 2 * t3 - 3 * t2 + 1).addScaledVector(m0, t3 - 2 * t2 + t).addScaledVector(pts[j + 1], -2 * t3 + 3 * t2).addScaledVector(m1, t3 - t2);
  }
  const hA = v(), hB = v(), camPos = v(), camLook = v();
  // Position auf der Strecke: S = Stop-Index; Ruhe bei S in [k-0,3 .. k+0,3], Fahrt dazwischen
  function segParam(S) {
    if (S <= 0) return [0, 0];
    if (S >= NS - 1) return [NS - 2, 1];
    const k = Math.floor(S), f = S - k;
    return [k, ease3(clamp((f - .3) / .4, 0, 1))];
  }
  function poseAt(S) {
    const [k, u] = segParam(S), sg = segs[k];
    herm(sg.pts, sg.ks, u, camPos); herm(sg.tg, sg.ks, u, camLook);
    return [k, u];
  }

  // ---------- Karten ----------
  let cardsKey = "", cards = [];
  const backs = [];
  function disposeCards() {
    for (const st of STOPS) {
      if (!st.card) continue;
      scene.remove(st.card.group);
      for (const t of st.card.texts) t.dispose();
      st.card.group.traverse(o => { if (o.geometry && !o.isText) o.geometry.dispose(); });
      st.card = null;
    }
    backs.length = 0;
  }
  async function ensureCards(key, cfgFor) {
    if (key === cardsKey) return;
    disposeCards();
    const built = await Promise.all(STOPS.map(st => buildCard(readSpec({ ...st, carrier: st.carrier }), cfgFor(st))));
    STOPS.forEach((st, s) => { st.card = built[s]; st.card.stop = s; scene.add(built[s].group); backs.push(built[s].back); built[s].back.userData.card = built[s]; });
    cardsKey = key;
  }
  const worldBack = new THREE.Vector3();
  function placeCards() {
    const f_px = Hh / (2 * TAN);
    const P = narrow ? clamp(W / 390, .9, 1.5) : clamp(Math.min(Hh / 900, W / 1280), .55, 1.25);
    STOPS.forEach((st, s) => {
      const card = st.card, r = rests[s];
      cc.aspect = camera.aspect; cc.fov = FOV;
      if (viewOff) cc.setViewOffset(W, Hh, 0, viewOff, W, Hh); else cc.clearViewOffset();
      cc.updateProjectionMatrix();
      cc.position.copy(r.P); cc.up.set(0, 1, 0); cc.lookAt(r.T); cc.updateMatrixWorld(true);
      let Pe, sx, sy, yaw = 0;
      if (narrow) {
        const yb = Hh - 92; Pe = Math.min(P, (yb - 84) / card.H);
        sx = W / 2; sy = yb - card.H * Pe / 2;
      } else {
        Pe = Math.min(P, (Hh - 184) / card.H);
        const sd = st.side !== undefined ? st.side : -SIDEV[st.u];
        const half = Math.min(W / 2 - 72, 648), off = Math.max(0, half - card.W * Pe / 2);
        sx = W / 2 + sd * off; sy = (74 + Hh - 96) / 2;
        yaw = -sd * .085;
      }
      card.Pe = Pe;
      const d = f_px * K0 / Pe;
      const dir = new THREE.Vector3(sx / W * 2 - 1, 1 - sy / Hh * 2, .5).unproject(cc).sub(r.P).normalize();
      const F = new THREE.Vector3(0, 0, -1).applyQuaternion(cc.quaternion);
      const pt = r.P.clone().addScaledVector(dir, d / dir.dot(F));
      const g = card.group;
      g.position.copy(pt); g.quaternion.copy(cc.quaternion); g.rotateY(yaw); g.scale.setScalar(K0);
      g.updateMatrixWorld(true);
      // Zubehör: Pfosten, Seile, Rahmen bis zum Boden
      if (card.deco) { g.remove(card.deco); card.deco.geometry.dispose(); card.deco = null; }
      worldBack.set(0, 0, -1).applyQuaternion(g.quaternion); worldBack.y = 0; worldBack.normalize();
      const tmp = v();
      const toLocalGround = (wp) => { wp.y = gyAt(wp.z); return g.worldToLocal(wp).toArray(); };
      const fp = p => toLocalGround(g.localToWorld(tmp.set(p[0], p[1], p[2])).clone());
      const bk = (p, dd) => toLocalGround(g.localToWorld(tmp.set(p[0], p[1], p[2])).clone().addScaledVector(worldBack, dd * K0));
      const pos = buildDeco(card, fp, bk);
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      card.decoMat = card.decoMat || decoMaterial(OFF);
      card.deco = new THREE.LineSegments(geo, card.decoMat); card.deco.frustumCulled = false; card.deco.renderOrder = 0;
      g.add(card.deco);
    });
    // Einstieg: der Bau entsteht neben dem Bogen (Sockel an dessen Kante); am Handy steht er über der Karte
    const c0 = STOPS[0].card, o = units[0].o, g = c0.group;
    if (narrow) {
      const tp = g.localToWorld(new THREE.Vector3(0, c0.H / 2, 0));
      o.word = { xl: (tp.x - o.ox) / o.lat - 1.6, xr: (tp.x - o.ox) / o.lat + 1.6, y: (tp.y - o.oy) / o.hs + 3.5, z: tp.z - o.oz - 1.5 };
    } else {
      const br = g.localToWorld(new THREE.Vector3(c0.W / 2, -c0.H / 2, 0));
      o.word = { xl: (br.x - o.ox) / o.lat + .3, xr: (br.x - o.ox) / o.lat + .3, y: (br.y - o.oy) / o.hs + .2, z: br.z - o.oz - 1.2 };
    }
  }
  // Sichtbarkeit und Deckkraft der Träger: weit entfernt und unmittelbar an der Kamera blenden sie aus
  const smooth01 = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const tmpV = v();
  function updateCards() {
    camera.updateMatrixWorld(); const inv = camera.matrixWorldInverse;
    for (const st of STOPS) {
      const c = st.card; if (!c) continue;
      tmpV.copy(c.group.position).applyMatrix4(inv);
      const d = -tmpV.z;
      let op = smooth01(.4, 1.8, d) * (1 - smooth01(15, 34, d));
      if (st.b) op *= smooth01(11.25, 11.85, S); // zweite Werdegang-Karte erst auf der Fahrt dorthin sichtbar
      if (c._op === op) continue; c._op = op;
      c.group.visible = op > .01;
      c.U.uOp.value = op; c.shU.uOp.value = op; c.decoMat.uniforms.uOp.value = op;
      for (const t of c.texts) t.fillOpacity = op;
      for (const f of c.fades) f.m.opacity = f.base * op;
    }
  }

  // ---------- Layout ----------
  let seg = 1, S = 0, sT = 0, sY = 0, layoutBusy = false, layoutAgain = false, zEnd = -100, ready = false;
  const scroller = document.getElementById("scroller");
  async function layout() {
    if (layoutBusy) { layoutAgain = true; return; }
    layoutBusy = true;
    try {
      const keepS = ready ? S : clamp(scrollY / seg, 0, NS - 1);
      W = innerWidth; Hh = innerHeight; narrow = W < 800;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow ? 1.5 : 1.75));
      renderer.setSize(W, Hh, false);
      camera.aspect = W / Hh;
      viewOff = narrow ? Math.round(Hh * .27) : 0;
      if (viewOff) camera.setViewOffset(W, Hh, 0, viewOff, W, Hh); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      proj.value = renderer.domElement.height / (2 * TAN);
      lineUniforms.uNear.value.set(narrow ? 6.5 : 4.5, narrow ? 10 : 9);
      seg = narrow ? Hh * 1.6 : Hh * 2;
      scroller.style.height = ((NS - 1) * seg + Hh) + "px";
      const Pn = clamp(W / 390, .9, 1.5), Wn = Math.round(clamp(Math.round(W / Pn) - 32, 320, 520));
      await ensureCards(narrow ? "n" + Wn : "d", st => ({ narrow, W: narrow ? Wn : (st.W || 600), hero: !!st.hero }));
      computeO(); buildRig(); placeCards(); buildCons(); buildRig();
      // Faden
      const lu = units[units.length - 1], zoN = narrow ? -1.5 : 0;
      zEnd = lu.z - 6 + lu.def.lineEnd + zoN;
      { const oz = lu.z - 6, zd = oz - 3.6 + zoN; bend = { zd, z0: zd + 12, base: pathX(zd) + LINE_DX, xd: pathX(oz) + (narrow ? 0 : (lu.def.doorX || 0) * latOf(lu)) }; }
      buildLine(zEnd);
      if (stations) { scene.remove(stations); stations.geometry.dispose(); }
      const secUnits = [0, 1, 2, 7, 10, 11, 12, 14, 15];
      const sp = new Float32Array(secUnits.length * 3), ss = new Float32Array(secUnits.length).fill(.5); ss[secUnits.length - 1] = 0;
      secUnits.forEach((ui, i) => { const z = units[ui].z; sp[i * 3] = lineX(z); sp[i * 3 + 1] = pathY(z) + LINE_DY; sp[i * 3 + 2] = z; });
      const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); sg.setAttribute("aScale", new THREE.BufferAttribute(ss, 1));
      stations = new THREE.Points(sg, dotMat(.1, 1)); stations.frustumCulled = false; stations.renderOrder = 4; scene.add(stations);
      for (const st of STOPS) st.card._op = -1;
      scrollTo({ top: Math.round(keepS * seg), behavior: "instant" });
      S = sT = sY = keepS; sT = keepS;
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
  addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(layout, 160); wake(1500); });
  addEventListener("load", () => wake(1200));
  THREE.DefaultLoadingManager.onLoad = () => wake(600);

  const bPrev = document.getElementById("sl-prev"), bNext = document.getElementById("sl-next"), lbl = document.getElementById("sl-lbl");
  let shown = -1;
  const curStop = () => clamp(Math.round(S), 0, NS - 1);
  function updateSlides() {
    const c = curStop(); if (c === shown) return; shown = c;
    const t = STOPS[c].topic;
    lbl.innerHTML = (t + 1) + " / " + TOPICS.length + " · <b>" + TOPICS[t] + "</b>";
    bPrev.disabled = c === 0; bNext.disabled = c === NS - 1;
  }
  let tw = null, goal = null;
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function tweenTo(stop, dur0) {
    stop = clamp(stop, 0, NS - 1); goal = stop;
    const y = Math.round(stop * seg), y0 = scrollY, dur = dur0 || 2000, t0 = performance.now();
    const my = tw = {};
    const step = now => {
      if (tw !== my) return;
      const x = clamp((now - t0) / dur, 0, 1);
      scrollTo({ top: y0 + (y - y0) * eio(x), behavior: "instant" }); wake(300);
      if (x < 1) requestAnimationFrame(step); else { tw = null; goal = null; }
    };
    requestAnimationFrame(step);
  }
  const stopTween = () => { tw = null; goal = null; };
  addEventListener("wheel", stopTween, { passive: true });
  addEventListener("touchstart", stopTween, { passive: true });
  addEventListener("pointerdown", e => { if (e.pointerType === "mouse") stopTween(); }, { passive: true });
  addEventListener("keydown", e => { if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") stopTween(); });
  function go(dir) {
    const cur = goal !== null ? goal : curStop();
    tweenTo(cur + dir);
  }
  bPrev.addEventListener("click", () => go(-1));
  bNext.addEventListener("click", () => go(1));
  addEventListener("keydown", e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
    const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });
  function stopOfHash(h) { const id = h.slice(1); return SECTION_STOP[id]; }
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && a.getAttribute("href").length > 1) { const s = stopOfHash(a.getAttribute("href")); if (s !== undefined) { e.preventDefault(); tweenTo(s, 2200); } return; }
    if (e.target.closest && e.target.closest(".top, .slides, a, button")) return;
    const l = linkAt(e.clientX, e.clientY);
    if (!l) return;
    const h = l.href || "";
    if (h.startsWith("#")) { if (h.length > 1) { const s = stopOfHash(h); if (s !== undefined) tweenTo(s, 2200); } return; }
    if (/^(mailto|tel):/.test(h)) location.href = h; else if (h) window.open(h, "_blank", "noopener");
  });
  addEventListener("focusin", e => {
    const sec = e.target.closest && e.target.closest("main section"); if (!sec || tw) return;
    const s = SECTION_STOP[sec.id]; if (s !== undefined && Math.abs(S - s) > .5) tweenTo(s, 1600);
  });
  // Links auf den Trägern: Strahl auf die Karte, Treffer gegen die Linkrechtecke
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function linkAt(x, y) {
    if (!ready) return null;
    ndc.set(x / W * 2 - 1, 1 - y / Hh * 2); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(backs.filter(b => b.parent.visible), false);
    if (!hits.length) return null;
    const h = hits[0], card = h.object.userData.card;
    if (card._op < .5) return null;
    const lx = (h.uv.x - .5) * card.W, ly = (h.uv.y - .5) * card.H;
    return card.links.find(l => lx >= l.rx0 && lx <= l.rx1 && ly >= l.ry0 && ly <= l.ry1) || null;
  }
  function hover(e) { document.body.style.cursor = linkAt(e.clientX, e.clientY) ? "pointer" : ""; }

  // ---------- Hauptschleife ----------
  const TAUS = .3;
  let last = performance.now(), elapsed = 0, lightZ = 0;
  function zBase(S) { const [k, u] = segParam(S); const a = units[STOPS[k].u].z + (STOPS[k].b ? -8 : 0), b = units[STOPS[k + 1].u].z + (STOPS[k + 1].b ? -8 : 0); return a + (b - a) * u; }
  function frame() {
    const now = performance.now(), dt = Math.min((now - last) / 1000, .1); last = now;
    if (!ready) { requestAnimationFrame(frame); return; }
    const tgt = clamp(scrollY / seg, 0, NS - 1);
    if (Math.abs(tgt - S) < .0004 && Math.abs(tgt - sT) < .0004) { S = sT = tgt; } else {
      const kk = 1 - Math.exp(-dt / TAUS); sT += (tgt - sT) * kk; S += (sT - S) * kk;
    }
    updateSlides();
    const busy = S !== tgt || now < kick || elapsed < 8 || Math.abs(mouse.tx - mouse.x) > .002 || Math.abs(mouse.ty - mouse.y) > .002;
    if (!busy) { requestAnimationFrame(frame); return; }
    elapsed += dt;
    mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 1.2)); mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 1.2));
    poseAt(S);
    camera.position.copy(camPos); camera.position.x += mouse.x * .02; camera.position.y -= mouse.y * .01;
    camera.lookAt(camLook); camera.updateMatrixWorld();
    const endK = smooth01(NS - 1 - .45, NS - 1 - .05, S);
    const target = Math.max(zBase(S) - 7, zEnd) * (1 - endK) + zEnd * endK;
    lightZ += (target - lightZ) * (1 - Math.exp(-dt * 2.2));
    if (elapsed < .05) lightZ = target;
    const lp = lightGeo.attributes.position;
    lp.setXYZ(0, lineX(lightZ), pathY(lightZ) + LINE_DY, lightZ); lp.needsUpdate = true;
    light.material.uniforms.uAlpha.value = clamp((lightZ - zEnd) / 1.6, 0, 1);
    lineUniforms.uLightZ.value = lightZ;
    updateCons(S, elapsed);
    updateCards();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  // Prüfhilfe (nur Entwurf)
  window.__raum = {
    stops: () => STOPS.map(s => ({ topic: s.topic, u: s.u })), S: () => S, ready: () => ready, seg: () => seg, NS,
    jump(s) { scrollTo({ top: Math.round(s * seg), behavior: "instant" }); S = sT = s; wake(1500); },
    go(dir) { go(dir); }, tweenTo, label: () => lbl.textContent,
    card: i => { const c = STOPS[i].card; return { W: c.W, H: c.H, Pe: c.Pe, op: c._op }; }
  };
  await layout();
  frame();
}
