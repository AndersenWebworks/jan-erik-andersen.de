// Entwurf B Konstruktion 2: Kamerafahrt durch einen weißen Raum.
// Die Konstruktionen sind in Bildschirmkoordinaten der Ruhestellung gezeichnet (Typografie als Vorlage) und im Raum fest.
import * as THREE from "three";
import { buildCon, zdOf, lineMaterial } from "./konstruktion.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("room");
let renderer = null;
const probe = document.createElement("canvas");
const hasGL = !!(probe.getContext("webgl2") || probe.getContext("webgl"));
if (!reduce && hasGL) {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    if (!renderer.getContext()) renderer = null;
  } catch (e) { renderer = null; }
}
if (renderer) start(renderer);

async function start(renderer) {
  const root = document.documentElement;
  root.classList.add("webgl");
  canvas.addEventListener("webglcontextlost", () => root.classList.remove("webgl"));
  await Promise.all([
    document.fonts.load('300 100px "Newsreader"'),
    document.fonts.load('italic 300 100px "Newsreader"'),
    document.fonts.load('400 18px "Schibsted Grotesk"'),
    document.fonts.load('400 30px "Newsreader"')
  ]);

  const OFF = "#303033", RED = "#d40235";
  const FOV = 42, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 200);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // Weg der Kamera: sanft geschwungen, konstante Geschwindigkeit pro Scrollpixel
  const pathX = z => .5 * Math.sin(z * .15);
  const pathY = z => .16 * Math.sin(z * .11 + 1);
  const GY = -2.5, DROP = 1.0, KZ = .0055, DREF = 12;
  const zAt = y => -KZ * y;
  const UPV = new THREE.Vector3(0, 1, 0);

  // ---------- Der rote Faden ----------
  const LINE_DY = GY + .02, LINE_DX = -.32;
  const red = new THREE.Color(RED);
  const lineUniforms = { uLightZ: { value: 0 }, uColor: { value: red } };
  const lineMat = new THREE.ShaderMaterial({
    uniforms: lineUniforms,
    vertexShader: `varying float vDepth; varying float vZ;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; vZ = position.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uLightZ; varying float vDepth; varying float vZ;
      void main() {
        float a = smoothstep(1.0, 3.5, vDepth) * (1.0 - smoothstep(14.0, 46.0, vDepth));
        float lit = mix(0.07, 1.0, smoothstep(uLightZ - 0.6, uLightZ + 0.9, vZ));
        gl_FragColor = vec4(uColor, a * lit * 0.9);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false
  });
  let line = null;
  function buildLine(zEnd) {
    if (line) { scene.remove(line); line.geometry.dispose(); }
    const pts = [];
    for (let z = 6; z >= zEnd; z -= .5) pts.push(new THREE.Vector3(pathX(z) + LINE_DX, pathY(z) + LINE_DY, z));
    pts.push(new THREE.Vector3(pathX(zEnd) + LINE_DX, pathY(zEnd) + LINE_DY, zEnd));
    line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
    line.frustumCulled = false; line.renderOrder = 1; scene.add(line);
  }
  const proj = { value: 1 };
  const glowVert = `
    uniform float uProj; uniform float uSize;
    attribute float aScale; varying float vDepth;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
      gl_PointSize = clamp(uSize * aScale * uProj / max(vDepth, 0.2), 1.0, 700.0);
    }`;
  const glowFrag = `
    uniform vec3 uColor; uniform float uAlpha; varying float vDepth;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      if (d > 1.0) discard;
      float core = smoothstep(0.2, 0.0, d);
      float halo = pow(1.0 - d, 2.8);
      vec3 col = mix(uColor, vec3(1.0, 0.42, 0.52), core * 0.6);
      float a = clamp(halo * 0.85 + core, 0.0, 1.0) * uAlpha * smoothstep(0.6, 2.0, vDepth);
      gl_FragColor = vec4(col, a);
      #include <colorspace_fragment>
    }`;
  const lightGeo = new THREE.BufferGeometry();
  lightGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  lightGeo.setAttribute("aScale", new THREE.BufferAttribute(new Float32Array([1]), 1));
  const light = new THREE.Points(lightGeo, new THREE.ShaderMaterial({
    uniforms: { uProj: proj, uSize: { value: .55 }, uColor: { value: red }, uAlpha: { value: 1 } },
    vertexShader: glowVert, fragmentShader: glowFrag, transparent: true, depthWrite: false
  }));
  light.frustumCulled = false; light.renderOrder = 5; scene.add(light);

  // ---------- Bilder (hängende Pläne) ----------
  const loader = new THREE.TextureLoader();
  const imgTex = {};
  for (const [id, url] of [["a", "bilder/gerwing-produkt-ausschnitt.jpg"], ["b", "bilder/gerwing-bestellung.jpg"]]) {
    loader.load(url, tex => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; imgTex[id] = tex; for (const c of cons) for (const im of c.imgs) if (im.id === id) { im.mesh.material.map = tex; im.mesh.material.needsUpdate = true; im.mesh.visible = true; } });
  }
  const planeGeo = new THREE.PlaneGeometry(1, 1);

  // ---------- Messen: Rest-Kamera, Typografie ----------
  const sections = [...document.querySelectorAll("main > section.ch")];
  const items = [...document.querySelectorAll("[data-con]")];
  let W = innerWidth, H = innerHeight, maxS = 1, narrow = false;
  const cons = [];
  const dbg = { cons: [], warns: [] };
  window.__k = dbg;

  function restCam(S) {
    const z = zAt(S);
    const pos = new THREE.Vector3(pathX(z), pathY(z), z);
    const look = new THREE.Vector3(pathX(z - 8), pathY(z - 8) - DROP, z - 8);
    const cam = new THREE.PerspectiveCamera(FOV, W / H, .1, 200);
    cam.position.copy(pos); cam.lookAt(look); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    const e = cam.matrixWorld.elements;
    const R = new THREE.Vector3(e[0], e[1], e[2]), U = new THREE.Vector3(e[4], e[5], e[6]), F = new THREE.Vector3(-e[8], -e[9], -e[10]);
    const Fh = new THREE.Vector3(F.x, 0, F.z).normalize();
    return { cam, pos, R, U, F, Fh };
  }
  // Bildschirmpunkt (px, Ruhestellung) plus Tiefe z -> Weltpunkt
  function makeP(rc, D, zd) {
    const f = H / (2 * TAN), asp = W / H;
    const Zd = new THREE.Vector3().copy(rc.Fh).addScaledVector(rc.R, zd[0]).addScaledVector(UPV, zd[1]).normalize();
    const dir = new THREE.Vector3(), hit = new THREE.Vector3();
    return (x, y, z = 0) => {
      const nx = x / W * 2 - 1, ny = 1 - y / H * 2;
      dir.set(0, 0, 0).addScaledVector(rc.R, nx * TAN * asp).addScaledVector(rc.U, ny * TAN).add(rc.F);
      const t = D / dir.dot(rc.Fh);
      hit.copy(rc.pos).addScaledVector(dir, t).addScaledVector(Zd, z * D / f);
      return [hit.x, hit.y, hit.z];
    };
  }
  const fontCache = new Map();
  const ctx2d = document.createElement("canvas").getContext("2d");
  function metrics(st) {
    const key = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
    if (!fontCache.has(key)) {
      ctx2d.font = key;
      const a = ctx2d.measureText("Hg"), cap = ctx2d.measureText("H");
      fontCache.set(key, { asc: a.fontBoundingBoxAscent, cap: cap.actualBoundingBoxAscent });
    }
    return fontCache.get(key);
  }
  // Zeilen eines Elements: Grundlinie, Versalhöhe, Ausdehnung (Dokumentkoordinaten)
  function linesOf(el) {
    const out = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      const pe = n.parentElement, st = getComputedStyle(pe), m = metrics(st);
      const r = document.createRange(); r.selectNodeContents(n);
      for (const q of r.getClientRects()) {
        if (q.width < 2) continue;
        const base = q.top + scrollY + m.asc;
        const ex = out.find(l => Math.abs(l.base - base) < 3 && l.el === pe);
        if (ex) { ex.x0 = Math.min(ex.x0, q.left); ex.x1 = Math.max(ex.x1, q.right); }
        else out.push({ x0: q.left, x1: q.right, base, cap: base - m.cap, el: pe });
      }
    }
    return out.sort((a, b) => a.base - b.base);
  }

  function layout() {
    W = innerWidth; H = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    proj.value = renderer.domElement.height / (2 * TAN);
    narrow = W < 800;
    maxS = Math.max(1, document.documentElement.scrollHeight - H);
    const zEnd = zAt(maxS) - 7;
    buildLine(zEnd); zEndG = zEnd;
    // Textblöcke ohne Einblend-Versatz messen
    const fading = [...document.querySelectorAll(".panel, .kicker, .ch > h1, .ch > h2")];
    for (const el of fading) el.style.transform = "none";
    buildCons();
    for (const el of fading) { el._o = null; }
    fadePanels();
  }
  let zEndG = -100;

  function clearCons() {
    for (const c of cons) { scene.remove(c.group); c.mesh.geometry.dispose(); c.mat.dispose(); for (const im of c.imgs) im.mesh.material.dispose(); }
    cons.length = 0; dbg.cons.length = 0; dbg.warns.length = 0;
  }
  const inkColor = new THREE.Color(OFF);
  const sr = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height, r: r.right, b: r.bottom + scrollY }; };

  function buildCons() {
    clearCons();
    const vh = H;
    for (const el of items) {
      const name = el.dataset.con;
      const hero = name === "start";
      const slotEl = hero ? el : el.querySelector(".slot");
      const panel = hero ? el.parentElement.querySelector(".stage .panel") : el.querySelector(".panel");
      const slot = sr(slotEl), rowR = sr(hero ? el.parentElement : el);
      // Ruhestellung
      let S;
      if (hero) S = 0;
      else if (name === "kontakt") S = maxS;
      else {
        const rh = rowR.h;
        S = rh <= vh - 192 ? rowR.y + rh / 2 - vh / 2 : rowR.y - 96;
      }
      S = clamp(S, 0, maxS);
      const side = el.classList.contains("r") ? "r" : "l";
      const c = { name, S, W, H, narrow, T: {}, side };
      // Typografie (Ruhestellung: Dokument minus S)
      const pr = sr(panel);
      let lines = linesOf(panel).filter(l => !l.el.closest(".meta") || true);
      const body = lines.filter(l => !l.el.closest(".meta"));
      const first = body[0] || lines[0], last = lines[lines.length - 1];
      const h3 = panel.querySelector("h3");
      const hl = h3 ? lines.find(l => l.el === h3 || h3.contains(l.el)) : first;
      c.hb = (hl || first).base - S; c.cap = (hl || first).cap - S; c.lb = last.base - S;
      c.T.px0 = pr.x; c.T.px1 = pr.r;
      c.leadFrom = y => {
        if (narrow) return clamp(side === "l" ? pr.x : pr.r, 0, W);
        const isLast = Math.abs(y - c.lb) < 8, ln = isLast ? last : (hl || first);
        return side === "l" ? ln.x1 + 14 : ln.x0 - 14;
      };
      // Region
      if (hero) {
        const hl2 = linesOf(el.parentElement.querySelector("h1"));
        c.T.l1 = { ...hl2[0], x1: hl2[0].x1 - 0, base: hl2[0].base - S, cap: hl2[0].cap - S };
        c.T.l2 = { ...hl2[hl2.length - 1], base: hl2[hl2.length - 1].base - S, cap: hl2[hl2.length - 1].cap - S };
        // x-Ende der Zeile "Jan-Erik" ohne Leerraum
        c.T.l1.x1 = hl2[0].x1; c.T.l2.x1 = hl2[hl2.length - 1].x1;
      }
      const sTop = slot.y - S, sBot = slot.b - S;
      if (narrow) {
        c.x0 = slot.x + 6; c.x1 = slot.r - 6; c.base = sBot - 10; c.top = sTop + (sBot - sTop) * .26;
        if (hero) { c.top = sTop + 4; }
      } else {
        const h = c.lb - c.cap; let cw = Math.min(slot.w, Math.max(h * 1.5, 400));
        let cx0 = slot.x + (slot.w - cw) / 2;
        if (name === "kontakt") { cx0 = slot.x; cw = Math.max(200, c.T.px0 - 24 - slot.x); }
        c.x0 = cx0; c.x1 = cx0 + cw; c.base = c.lb; c.top = c.cap;
        if (name === "werdegang" || name === "gerwing") { cw = Math.min(slot.w, 540); c.x0 = slot.x + (slot.w - cw) / 2; c.x1 = c.x0 + cw; }
        // Der Bau darf nicht unter der Kopfzeile verschwinden
        if (c.base - c.top < 220) c.top = c.base - 220;
        if (hero) { c.x0 = pr.x; c.x1 = pr.r; }
      }
      c.w = c.x1 - c.x0; c.h = c.base - c.top;
      // Rest-Kamera und Tiefe
      const rc = restCam(S);
      let D = DREF;
      if (name === "kontakt") {
        const E = new THREE.Vector3(pathX(zEndG) + LINE_DX, pathY(zEndG) + LINE_DY, zEndG);
        D = E.clone().sub(rc.pos).dot(rc.Fh);
        const v = E.clone().project(rc.cam);
        c.E = { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H };
      }
      const P = makeP(rc, D, zdOf(name, c));
      const built = buildCon(name, c, P);
      const mat = lineMaterial(inkColor);
      mat.uniforms.uGain.value = 1;
      const tri = new THREE.Mesh(built.geometry, mat); tri.frustumCulled = false; tri.renderOrder = 2;
      const group = new THREE.Group(); group.add(tri); group.visible = false; scene.add(group);
      // Bilder
      const imgs = [];
      for (const im of (built.g.images || [])) {
        const a = P(im.x, im.y + im.h / 2, 0), b = P(im.x + im.w, im.y + im.h / 2, 0), t = P(im.x + im.w / 2, im.y, 0), bt = P(im.x + im.w / 2, im.y + im.h, 0);
        const wW = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), hW = Math.hypot(t[0] - bt[0], t[1] - bt[1], t[2] - bt[2]);
        const ctr = P(im.x + im.w / 2, im.y + im.h / 2, 0);
        const mesh2 = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: imgTex[im.id] || null, transparent: true, opacity: 0, depthWrite: false }));
        mesh2.scale.set(wW, hW, 1); mesh2.position.set(ctr[0], ctr[1], ctr[2]);
        const m4 = new THREE.Matrix4().makeBasis(rc.R, UPV, rc.Fh.clone().negate());
        mesh2.quaternion.setFromRotationMatrix(m4);
        mesh2.renderOrder = 1; mesh2.visible = !!imgTex[im.id];
        group.add(mesh2); imgs.push({ id: im.id, mesh: mesh2, t: im.t });
      }
      // Wandernde Teile: kleine Würfel auf einer Bogenbahn vom alten in den neuen Shop
      const mv = (c.movers || []).map(m => {
        const o = { m, p0: P(m.from[0], m.from[1], 0), p1: P(m.to[0], m.to[1], 0), pm: P(m.ctrl[0], m.ctrl[1], 0) };
        const s = m.s, a = [m.from[0] - s / 2, m.from[1] - s / 2], b = [m.from[0] + s / 2, m.from[1] - s / 2], d = [m.from[0] - s / 2, m.from[1] + s / 2], e = [m.from[0] + s / 2, m.from[1] + s / 2];
        const Q = (p, z) => { const q = P(p[0], p[1], z); return new THREE.Vector3(q[0], q[1], q[2]); };
        const zz = s * .7, pts2 = [];
        const seg = (p, q) => pts2.push(p, q);
        seg(Q(a, 0), Q(b, 0)); seg(Q(b, 0), Q(e, 0)); seg(Q(e, 0), Q(d, 0)); seg(Q(d, 0), Q(a, 0));
        seg(Q(a, zz), Q(b, zz)); seg(Q(b, zz), Q(e, zz)); seg(Q(e, zz), Q(d, zz)); seg(Q(d, zz), Q(a, zz));
        for (const p of [a, b, d, e]) seg(Q(p, 0), Q(p, zz));
        const g2 = new THREE.BufferGeometry().setFromPoints(pts2);
        const mm = new THREE.LineBasicMaterial({ color: inkColor, transparent: true, opacity: .9, depthWrite: false });
        const ls = new THREE.LineSegments(g2, mm); ls.frustumCulled = false; ls.renderOrder = 3; ls.visible = false; group.add(ls);
        o.obj = ls; o.mat = mm; return o;
      });
      // Referenzpunkt für die Bindung an die Typografie (Mitte unten der Region)
      const refS = { x: (c.x0 + c.x1) / 2, y: c.base };
      const refW = new THREE.Vector3(...P(refS.x, refS.y, 0));
      // Ausdehnung in der Ruhestellung (zur Kontrolle)
      const bb = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 }, vv = new THREE.Vector3(), pa = built.geometry.attributes.aA, pb = built.geometry.attributes.aB;
      for (let i = 0; i < pa.count; i += 4) for (const at of [pa, pb]) { vv.set(at.getX(i), at.getY(i), at.getZ(i)).project(rc.cam); const sx = (vv.x + 1) / 2 * W, sy = (1 - vv.y) / 2 * H; bb.x0 = Math.min(bb.x0, sx); bb.x1 = Math.max(bb.x1, sx); bb.y0 = Math.min(bb.y0, sy); bb.y1 = Math.max(bb.y1, sy); }
      const con = { name, S, mesh: tri, mat, group, imgs, mv, ref: refW, refS, bb, c };
      cons.push(con);
      dbg.cons.push({ name, S, bb, rest: { cap: c.cap, hb: c.hb, lb: c.lb, x0: c.x0, x1: c.x1, top: c.top, base: c.base } });
      if (bb.x0 < 2 || bb.x1 > W - 2 || bb.y1 > H - 2) dbg.warns.push(`${name}: Ausdehnung ${bb.x0 | 0},${bb.y0 | 0} bis ${bb.x1 | 0},${bb.y1 | 0}`);
    }
    // Auflösung für die Linien-Shader
    const rs = new THREE.Vector2(); renderer.getDrawingBufferSize(rs);
    for (const c of cons) { c.mat.uniforms.uRes.value.copy(rs); c.mat.uniforms.uPR.value = renderer.getPixelRatio(); }
  }

  // ---------- Fortschritt, Bindung, Lauf ----------
  const tmpV = new THREE.Vector3();
  let intro = 0;
  function updateCons(y, t) {
    const vh = H;
    for (const c of cons) {
      const lead = .62 * vh, hold = .1 * vh, outLen = .42 * vh;
      let pIn = clamp((y - (c.S - lead)) / (lead - .03 * vh), 0, 1);
      if (c.name === "start") pIn = Math.min(pIn, smooth(0, 1, clamp(t / 3.6, 0, 1)));
      const pOut = clamp((y - (c.S + hold)) / outLen, 0, 1);
      const vis = pIn > .001 && pOut < .998;
      c.group.visible = vis;
      c.mat.uniforms.uProg.value = pIn; c.mat.uniforms.uOut.value = pOut;
      if (!vis) continue;
      // Bindung: der Referenzpunkt bleibt an seiner Stelle im Text
      tmpV.copy(c.ref).project(camera);
      const sx = (tmpV.x + 1) / 2 * W, sy = (1 - tmpV.y) / 2 * H;
      const dx = c.refS.x - sx, dy = (c.refS.y - (y - c.S)) - sy;
      const depth = tmpV.set(c.ref.x - camera.position.x, c.ref.y - camera.position.y, c.ref.z - camera.position.z).dot(fw.setFromMatrixColumn(camera.matrixWorld, 2).negate());
      const k = 2 * TAN * depth / H;
      c.group.position.set(0, 0, 0);
      c.group.position.addScaledVector(rgt.setFromMatrixColumn(camera.matrixWorld, 0), dx * k).addScaledVector(upc.setFromMatrixColumn(camera.matrixWorld, 1), -dy * k);
      for (const im of c.imgs) im.mesh.material.opacity = smooth(im.t - .02, im.t + .12, pIn) * (1 - smooth(0, .22, pOut));
      for (const o of c.mv) {
        const m = o.m, f = clamp((pIn - m.ts) / (m.te - m.ts), 0, 1), e = f * f * (3 - 2 * f);
        o.obj.visible = f > 0 && f < 1 && pOut < .3;
        // Bogenbahn: quadratische Bézierkurve über den Mittelpunkt
        const u = 1 - e;
        const px = u * u * o.p0[0] + 2 * u * e * o.pm[0] + e * e * o.p1[0], py = u * u * o.p0[1] + 2 * u * e * o.pm[1] + e * e * o.p1[1], pz = u * u * o.p0[2] + 2 * u * e * o.pm[2] + e * e * o.p1[2];
        o.obj.position.set(px - o.p0[0], py - o.p0[1], pz - o.p0[2]);
        o.mat.opacity = .9 * Math.min(1, f * 6) * Math.min(1, (1 - f) * 6);
      }
    }
  }
  const fw = new THREE.Vector3(), rgt = new THREE.Vector3(), upc = new THREE.Vector3();

  // ---------- Text blendet am Rand ein und aus ----------
  const panels = [...document.querySelectorAll(".panel, .kicker, .ch > h1, .ch > h2")];
  function fadePanels() {
    const vh = H, bottom = vh - 12;
    for (const el of panels) {
      const r = el.getBoundingClientRect();
      const inn = clamp((bottom - r.top) / (vh * .12), 0, 1);
      const out = clamp((r.bottom - vh * .1) / (vh * .12), 0, 1);
      const o = Math.min(inn, out), v = o * o * (3 - 2 * o), s = v.toFixed(3);
      if (el._o !== s) { el._o = s; el.style.opacity = s; el.style.transform = `translate3d(0, ${((1 - v) * 18).toFixed(1)}px, 0)`; }
    }
  }

  layout();
  addEventListener("resize", layout);
  addEventListener("load", layout);
  document.fonts.ready.then(layout);
  new ResizeObserver(() => { if (Math.abs(document.documentElement.scrollHeight - (maxS + H)) > 2) layout(); }).observe(document.body);
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", e => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; });

  let camZ = zAt(scrollY), lightZ = camZ - 7;
  let last = performance.now(), elapsed = 0;
  const look = new THREE.Vector3();
  function frame() {
    const now = performance.now(), dt = Math.min((now - last) / 1000, .1); last = now; elapsed += dt; const t = elapsed;
    camZ += (zAt(scrollY) - camZ) * (1 - Math.exp(-dt * 4));
    mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 3));
    mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 3));
    camera.position.set(pathX(camZ) + mouse.x * .3, pathY(camZ) - mouse.y * .15, camZ);
    look.set(pathX(camZ - 8), pathY(camZ - 8) - DROP, camZ - 8);
    camera.lookAt(look); camera.updateMatrixWorld(true);
    const target = Math.max(camZ - 7, zEndG);
    lightZ += (target - lightZ) * (1 - Math.exp(-dt * 2.2));
    const lp = lightGeo.attributes.position;
    lp.setXYZ(0, pathX(lightZ) + LINE_DX, pathY(lightZ) + LINE_DY, lightZ);
    lp.needsUpdate = true;
    light.material.uniforms.uAlpha.value = .85 + Math.sin(t * 1.4) * .12;
    lineUniforms.uLightZ.value = lightZ;
    updateCons(scrollY, t);
    fadePanels();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}
