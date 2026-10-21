// Testvorspann Gerwing: Terrasse mit Treppe baut sich wie ein Uhrwerk auf.
// Ein Fortschritt p (0 flach, 1 fertig) steuert alles: Scrollen setzt das Ziel, p folgt gedämpft.
// Der Knopf „Abspielen“ fährt denselben Weg in rund 12 Sekunden ab, indem er die Seite scrollt.
import * as THREE from "three";
import { SCHRIFTEN } from "./fonts/schriften.js";

const PI = Math.PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

// Mechanischer Lauf: anfahren, abbremsen, kurz über den Anschlag, einrasten
function mech(x, over = .035) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const w = .74;
  if (x < w) { const u = x / w; return (1 + over) * u * u * u * (u * (u * 6 - 15) + 10); }
  const t = (x - w) / (1 - w);
  return 1 + over * Math.cos(t * PI * 2.5) * (1 - t) * (1 - t);
}
const seg = (p, t0, d) => (p - t0) / d;

// ---------- Schriften (eingebettet) ----------
function bytes(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
async function loadFonts() {
  const list = [["Newsreader", "300"], ["Schibsted Grotesk", "500"]];
  await Promise.all(list.map(async ([name, w]) => {
    const ff = new FontFace(name, bytes(SCHRIFTEN[name]), { weight: w });
    await ff.load(); document.fonts.add(ff);
  }));
}

// ---------- Start ----------
const canvas = document.getElementById("stage");
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  if (!renderer.getContext()) renderer = null;
} catch (e) { renderer = null; }
loadFonts().catch(() => {}).then(() => renderer ? start(renderer) : document.documentElement.classList.add("nogl"));

function start(renderer) {
  renderer.setClearColor(0xffffff, 1);
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 200);

  // ---------- Material ----------
  const INK = new THREE.Color("#303033");
  const C = { paper: "#fbfaf7", base: "#fcfbf9", old: "#ece8e0", shade: "#dcd7cd", red: "#d40235" };
  const LIGHT = new THREE.Vector3(-.45, .8, .4).normalize();
  const VERT = `
    #include <clipping_planes_pars_vertex>
    varying vec3 vW;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vW = wp.xyz;
      vec4 mvPosition = viewMatrix * wp;
      #include <clipping_planes_vertex>
      gl_Position = projectionMatrix * mvPosition;
    }`;
  // Papier: flache Normale aus den Bildschirmableitungen, weiches Licht, leichte Bodenverschattung
  const FRAG = `
    #include <clipping_planes_pars_fragment>
    uniform vec3 uCol; uniform vec3 uL; uniform float uFlat;
    varying vec3 vW;
    void main() {
      #include <clipping_planes_fragment>
      vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
      if (dot(n, cameraPosition - vW) < 0.0) n = -n;
      float dif = dot(n, uL);
      float sh = 0.875 + 0.125 * max(dif, 0.0) - 0.1 * max(-dif, 0.0);
      float ao = mix(1.0, mix(0.86, 1.0, smoothstep(0.0, 1.1, vW.y)), 1.0 - abs(n.y));
      vec3 c = uCol * mix(sh * ao, 1.0, uFlat);
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`;
  const mats = new Map();
  function paper(col, clip, flat = 0) {
    const key = col + (clip ? clip.id : "-") + flat;
    if (!mats.has(key)) mats.set(key, new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(col) }, uL: { value: LIGHT }, uFlat: { value: flat } },
      vertexShader: VERT, fragmentShader: FRAG, clipping: true, clippingPlanes: clip ? clip.planes : null,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    }));
    return mats.get(key);
  }
  const emats = new Map();
  function edgeMat(clip, op = .62, col = INK) {
    const key = (clip ? clip.id : "-") + op + col.getHexString();
    if (!emats.has(key)) emats.set(key, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, clippingPlanes: clip ? clip.planes : null }));
    return emats.get(key);
  }
  const CLIP0 = { id: "g", planes: [new THREE.Plane(new THREE.Vector3(0, 1, 0), .0005)] };
  function solid(geo, col, clip, op = .62) {
    const m = new THREE.Mesh(geo, paper(col, clip));
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24), edgeMat(clip, op, col === C.red ? new THREE.Color(C.red) : INK)));
    return m;
  }
  // Quader über Grenzen [x0,x1]×[y0,y1]×[z0,z1]
  function block(x0, x1, y0, y1, z0, z1, col = C.paper, clip = CLIP0, op) {
    const m = solid(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), col, clip, op);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
  }
  function lines(pts, op = .35, y = .003) {
    const g = new THREE.BufferGeometry();
    const a = []; for (const [x0, z0, x1, z1] of pts) a.push(x0, y, z0, x1, y, z1);
    g.setAttribute("position", new THREE.Float32BufferAttribute(a, 3));
    return new THREE.LineSegments(g, edgeMat(null, op));
  }

  // ---------- Zahnräder ----------
  const MOD = .07;
  function gearGeo(n, m = MOD, depth = .09, holes = true) {
    const rp = m * n / 2, ra = rp + m, rd = rp - 1.2 * m, pa = 2 * PI / n;
    const s = new THREE.Shape();
    for (let i = 0; i < n; i++) {
      const a = i * pa;
      const pts = [[rd, a - .5 * pa], [rd, a - .27 * pa], [ra, a - .13 * pa], [ra, a + .13 * pa], [rd, a + .27 * pa]];
      pts.forEach(([r, b], k) => { const x = Math.cos(b) * r, y = Math.sin(b) * r; if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y); });
    }
    s.closePath();
    const hole = (cx, cy, r) => { const h = new THREE.Path(); h.absarc(cx, cy, r, 0, 2 * PI, true); s.holes.push(h); };
    hole(0, 0, Math.max(.035, rp * .12));
    if (holes && rp > .3) for (let k = 0; k < 5; k++) { const b = k * 2 * PI / 5 + .3; hole(Math.cos(b) * rp * .55, Math.sin(b) * rp * .55, rp * .19); }
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 18 });
    g.translate(0, 0, -depth / 2);
    return { g, n, rp };
  }

  // ---------- Modell ----------
  const H = 1.2, TH = .08, HT = H - TH;      // Terrassenhöhe, Plattendicke, Oberkante der Wände
  const X0 = -5, X1 = 5, Z0 = -3, Z1 = 3;
  const model = new THREE.Group(); scene.add(model);
  const anim = [];                            // alle Bewegungen hängen an p

  // Grundfläche: ein Bogen Papier mit dem Grundriss als Haarlinie
  const ground = new THREE.Mesh(new THREE.BoxGeometry(19, .05, 15.5), paper(C.base, null, .35));
  ground.position.set(.6, -.025, 1.2);
  ground.add(new THREE.LineSegments(new THREE.EdgesGeometry(ground.geometry), edgeMat(null, .3)));
  model.add(ground);
  const plan = [[X0, Z0, X1, Z0], [X1, Z0, X1, Z1], [X1, Z1, X0, Z1], [X0, Z1, X0, Z0]];
  // Weg vor der Treppe im Läuferverband
  for (let r = 0; r <= 9; r++) plan.push([1.4, Z1 + 1.9 + r * .4, 4.6, Z1 + 1.9 + r * .4].map((v, i) => i % 2 ? Math.min(v, Z1 + 5.5) : v));
  for (let r = 0; r < 9; r++) for (let x = 1.4 + (r % 2) * .4; x <= 4.61; x += .8) plan.push([x, Z1 + 1.9 + r * .4, x, Z1 + 2.3 + r * .4]);
  plan.push([1.4, Z1 + 1.9, 1.4, Z1 + 5.5], [4.6, Z1 + 1.9, 4.6, Z1 + 5.5]);
  // Palettenplatz
  plan.push([5.95, .95, 7.45, .95], [7.45, .95, 7.45, 2.25], [7.45, 2.25, 5.95, 2.25], [5.95, 2.25, 5.95, .95]);
  model.add(lines(plan, .3));

  // Aufsteigen aus der Grundfläche: Teile kommen von unten durch den Bogen
  function rise(obj, t0, d, depth, over = .03) {
    const y = obj.position.y;
    anim.push(p => { obj.position.y = y - depth * (1 - mech(seg(p, t0, d), over)); });
    return obj;
  }

  // Rahmen: Pfosten zuerst, dann Wände
  const frameG = new THREE.Group(); model.add(frameG);
  const posts = [[X0, Z0], [X1 - .22, Z0], [X0, Z1 - .22], [X1 - .22, Z1 - .22], [X0, -.11]];
  posts.forEach(([x, z], k) => frameG.add(rise(block(x, x + .22, 0, HT, z, z + .22), .02 + k * .018, .1, 1.4)));
  const walls = [
    block(X0 + .22, 1.5, 0, HT, Z1 - .1, Z1),            // vorn links
    block(4.5, X1 - .22, 0, HT, Z1 - .1, Z1),            // vorn rechts
    block(1.5, 4.5, 1.0, HT, Z1 - .1, Z1),               // Sturz über der Treppe
    block(X1 - .1, X1, 0, HT, Z0 + .22, Z1 - .22),        // rechts
    block(X0 + .22, X1 - .22, 0, HT, Z0, Z0 + .1),        // hinten
    block(X0, X0 + .22, HT - .2, HT, Z0 + .22, Z1 - .22)  // linker Holm über dem offenen Getriebe
  ];
  walls.forEach((w, k) => frameG.add(rise(w, .09 + k * .02, .12, 1.5)));

  // Getriebe in der offenen linken Seite: Zahnradkette entlang der Tiefe, die rote Welle treibt
  const drive = new THREE.Group(); model.add(drive);
  const train = new THREE.Group(); train.position.x = -4.62; train.rotation.y = -PI / 2; drive.add(train);
  const chain = [[14, null], [8, 165], [14, 190], [10, 180], [14, 180], [8, 165]];
  const gears = [];
  let prev = null;
  for (const [n, dir] of chain) {
    const gg = gearGeo(n);
    const m = solid(gg.g, C.paper, CLIP0, .7);
    let cx = 2.3, cy = .56, th = 0;
    if (prev) { th = dir * PI / 180; const d = prev.rp + gg.rp; cx = prev.cx + Math.cos(th) * d; cy = prev.cy + Math.sin(th) * d; }
    m.position.set(cx, cy, 0);
    // Achse durch das Rad
    const ax = solid(new THREE.CylinderGeometry(.035, .035, .34, 12).rotateX(PI / 2), C.shade, CLIP0, .4);
    ax.position.set(cx, cy, -.08); train.add(ax);
    train.add(m);
    const g = { m, n, rp: gg.rp, cx, cy, th, prev };
    gears.push(g); prev = g;
  }
  // Rote Antriebswelle quer unter der Fläche bis zur Treppe, außen eine Kurbelscheibe
  const shaft = solid(new THREE.CylinderGeometry(.045, .045, 10.1, 16).rotateZ(PI / 2), C.red, CLIP0, .9);
  shaft.position.set(-.7, .56, 2.3); drive.add(shaft);
  const crank = new THREE.Group(); crank.position.set(-5.72, .56, 2.3); drive.add(crank);
  const disk = solid(new THREE.CylinderGeometry(.24, .24, .07, 28).rotateZ(PI / 2), C.red, CLIP0, .9); crank.add(disk);
  const arm = block(-.03, .03, -.03, .3, -.035, .035, C.red); arm.position.x -= .06; crank.add(arm);
  const knob = solid(new THREE.CylinderGeometry(.035, .035, .16, 12).rotateZ(PI / 2), C.red, CLIP0, .9); knob.position.set(-.14, .3, 0); crank.add(knob);
  // Lager der Welle an der Treppe
  const brg = block(4.35, 4.5, .4, .72, 2.22, 2.38, C.shade); drive.add(brg);
  rise(drive, .1, .16, 1.9, .02);

  // Plattenreihen: hängen im Kasten und klappen nacheinander nach vorn hoch, Reihe für Reihe
  const NR = 6, ZR = Z0 + .28, RD = (Z1 - ZR) / NR, PL = -4.3, PR = X1 - .1, PW = 1.84;
  const rowsG = new THREE.Group(); model.add(rowsG);
  const pinion = gearGeo(8, .04, .07, false);
  for (let i = 0; i < NR; i++) {
    const zb = ZR + i * RD;
    const pivot = new THREE.Group(); pivot.position.set(0, H - TH / 2, zb); rowsG.add(pivot);
    let k = 0;
    for (let x = PL - (i % 2) * PW / 2; x < PR - .05; x += PW, k++) {
      const xa = Math.max(x, PL) + .014, xb = Math.min(x + PW, PR) - .014;
      if (xb - xa < .2) continue;
      const col = (i * 3 + k) % 4 === 1 ? C.old : C.paper;
      pivot.add(block(xa, xb, -TH / 2, TH / 2, .014, RD - .014, col, CLIP0, .55));
    }
    // Ritzel am Scharnier dreht mit der Reihe
    const pn = solid(pinion.g.clone().rotateY(PI / 2), C.paper, CLIP0, .7); pn.position.x = -4.48; pivot.add(pn);
    const axle = solid(new THREE.CylinderGeometry(.025, .025, PR + 4.55, 10).rotateZ(PI / 2), C.shade, CLIP0, .35);
    axle.position.set((PR - 4.55) / 2, 0, 0); pivot.add(axle);
    const t0 = .27 + i * .055;
    anim.push(p => { pivot.rotation.x = PI / 2 * (1 - mech(seg(p, t0, .13), .045)); });
  }
  rise(rowsG, .12, .14, 1.6, .02);

  // Treppe: fünf Blöcke stecken ineinander und fahren wie ein Teleskop nacheinander heraus
  const stairs = new THREE.Group(); model.add(stairs);
  const NS = 5, RH = H / (NS + 1), TR = .38;
  for (let k = 1; k <= NS; k++) {
    const top = H - k * RH;
    const b = block(1.56, 4.44, 0, top, Z1 - TR, Z1, C.paper, CLIP0, .62);
    // Kante der Trittstufe als feine Linie, damit die Stufen auch frontal lesbar bleiben
    stairs.add(b);
    const z = b.position.z;
    anim.push(p => { b.position.z = z + k * TR * mech(seg(p, .55, .07 + .035 * k), .05); });
  }
  rise(stairs, .11, .13, 1.4, .02);

  // Palette mit Platten neben der Treppe
  const pallet = new THREE.Group(); pallet.position.set(6.7, 0, 1.6); model.add(pallet);
  pallet.add(block(-.65, .65, 0, .04, -.55, .55, C.shade, CLIP0, .5));
  for (const z of [-.45, 0, .45]) pallet.add(block(-.65, .65, .04, .12, z - .06, z + .06, C.shade, CLIP0, .5));
  pallet.add(block(-.65, .65, .12, .15, -.55, .55, C.shade, CLIP0, .5));
  for (let k = 0; k < 9; k++) {
    const pl = block(-.6, .6, .15 + k * .065, .15 + k * .065 + .06, -.5, .5, k % 3 === 1 ? C.old : C.paper, CLIP0, .5);
    pl.rotation.y = (k % 2 ? 1 : -1) * .012 * (k % 3); pallet.add(pl);
    const y = pl.position.y;
    anim.push(p => { pl.position.y = y - (1 - mech(seg(p, .6 + k * .014, .07), .06)) * (.75 + k * .07); });
  }
  rise(pallet, .55, .06, .4, .02);

  // Rückwand mit der Überschrift: steigt zuletzt aus dem Schlitz hinter der letzten Reihe und rastet ein
  const CLIPW = { id: "w", planes: [new THREE.Plane(new THREE.Vector3(0, 1, 0), -(H - .09))] };
  const WW = 9.4, WH = 2.75, WZ0 = Z0 + .1, WZ1 = ZR - .02;
  const wall = new THREE.Group(); model.add(wall);
  const slab = block(-WW / 2, WW / 2, H - .12, H - .12 + WH, WZ0, WZ1, C.paper, CLIPW, .62);
  wall.add(slab);
  // Abdeckleiste oben, an den Enden Stützen, die mit aufsteigen
  wall.add(block(-WW / 2 - .06, WW / 2 + .06, H - .12 + WH, H - .12 + WH + .07, WZ0 - .05, WZ1 + .05, C.paper, CLIPW, .62));
  const wTex = wallTexture();
  const tMat = new THREE.MeshBasicMaterial({ map: wTex, transparent: true, depthWrite: false, clippingPlanes: CLIPW.planes, toneMapped: false });
  const tPlane = new THREE.Mesh(new THREE.PlaneGeometry(WW - .5, (WW - .5) * wTex.image.height / wTex.image.width), tMat);
  tPlane.position.set(0, H - .12 + WH / 2 + .14, WZ1 + .004); wall.add(tPlane);
  anim.push(p => { wall.position.y = -(WH + .3) * (1 - mech(seg(p, .72, .15), .025)); });

  function wallTexture() {
    const cv = document.createElement("canvas"), x = cv.getContext("2d");
    cv.width = 2400; cv.height = Math.round(2400 * (WH - .55) / (WW - .5));
    const pad = 70;
    x.fillStyle = "#303033";
    x.font = '500 46px "Schibsted Grotesk"';
    x.letterSpacing = "6px";
    x.textBaseline = "alphabetic";
    x.fillText("GERWING · BAUSTOFFSHOP", pad, pad + 40);
    x.letterSpacing = "0px";
    const lines = ["Ein Baustoffshop, der rechnet", "wie ein Fachberater."];
    let size = 200;
    x.font = `300 ${size}px "Newsreader"`;
    const w = Math.max(...lines.map(l => x.measureText(l).width));
    size = Math.min(size, size * (cv.width - pad * 2) / w);
    x.font = `300 ${size}px "Newsreader"`;
    lines.forEach((l, i) => x.fillText(l, pad - 6, pad + 40 + size * 1.12 + i * size * 1.06));
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  // ---------- Kamera: lange Kranfahrt von schräg oben über das Modell, dann hinein in Augenhöhe ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const camPath = new THREE.CatmullRomCurve3([V(7, 23, -15), V(-4, 19, -6), V(-13, 12.5, 4), V(-12, 6.5, 12), V(-9, 3.6, 15), V(-9.4, 2.1, 14.6)], false, "centripetal");
  const tgtPath = new THREE.CatmullRomCurve3([V(0, 0, .8), V(-.5, .2, .6), V(-.5, .7, .4), V(0, 1.2, -.4), V(.6, 1.5, -.6), V(1.5, 1.4, -.3)], false, "centripetal");
  const camP = new THREE.Vector3(), tgtP = new THREE.Vector3(), off = new THREE.Vector3();
  let aspect = 1;
  function placeCamera(p, time) {
    const u = sm(p) * .2 + p * .8;           // weich an den Enden
    camPath.getPoint(u, camP); tgtPath.getPoint(u, tgtP);
    off.subVectors(camP, tgtP);
    // schmale Bildschirme: weiter zurück, am Ende näher an die Wand, damit die Überschrift lesbar bleibt
    const e = sm((p - .78) / .22);
    const k = aspect < 1.25 ? Math.pow(1.25 / aspect, .78 * (1 - .3 * e)) : 1;
    if (aspect < 1) tgtP.x -= 1.6 * e;   // hochkant: Blick auf den Textblock der Wand
    off.multiplyScalar(k);
    camera.position.copy(tgtP).add(off);
    // die Kamera steht nie ganz still
    camera.position.x += Math.sin(time * .23) * .14 + Math.sin(time * .07) * .1;
    camera.position.y += Math.sin(time * .19 + 1) * .06;
    camera.position.z += Math.cos(time * .17) * .12;
    camera.lookAt(tgtP);
  }

  // ---------- Fortschritt, Scrollen, Abspielen ----------
  const hint = document.getElementById("hint"), bar = document.getElementById("bar");
  const btn = document.getElementById("play"), lbl = btn.querySelector(".lbl");
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let target = clamp(scrollY / maxScroll(), 0, 1), p = target;
  // Direkter Einstieg in einen Zustand, etwa #p=0.4 (für Standbilder)
  // und hält ihn, bis jemand selbst scrollt
  const hp = /p=([\d.]+)/.exec(location.hash || "");
  let hold = false;
  if (hp) { target = p = clamp(+hp[1], 0, 1); hold = true; scrollTo(0, target * maxScroll()); }
  addEventListener("scroll", () => { if (!hold) target = clamp(scrollY / maxScroll(), 0, 1); }, { passive: true });
  for (const ev of ["wheel", "touchstart", "keydown"]) addEventListener(ev, () => { hold = false; }, { passive: true });

  let play = null;
  const DUR = 12000;
  function stopPlay() { play = null; btn.classList.remove("on"); lbl.textContent = target > .995 ? "Nochmal" : "Abspielen"; }
  btn.addEventListener("click", () => {
    if (play) { stopPlay(); return; }
    let from = target;
    if (from > .98) { from = 0; scrollTo(0, 0); target = 0; p = 0; }
    play = { t0: performance.now(), from };
    btn.classList.add("on"); lbl.textContent = "Anhalten";
  });
  for (const ev of ["wheel", "touchstart"]) addEventListener(ev, () => { if (play) stopPlay(); }, { passive: true });
  addEventListener("keydown", e => { if (play && e.target !== btn) stopPlay(); });

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    camera.fov = aspect < 1 ? 46 : 38;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize); resize();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (play) {
      const f = clamp(play.from + (now - play.t0) / (DUR * (1 - play.from) || 1) * (1 - play.from), 0, 1);
      scrollTo(0, f * maxScroll()); target = f;
      if (f >= 1) stopPlay();
    }
    p += (target - p) * (1 - Math.exp(-dt * 3.4));
    if (Math.abs(target - p) < 1e-5) p = target;
    for (const a of anim) a(p);
    // Getriebe: Winkel aus dem Fortschritt, Kette greift korrekt ineinander
    const A = p * 30;
    gears.forEach((g, i) => {
      if (!i) { g.ang = A; } else {
        const r = g.prev.n / g.n;
        g.ang = -r * g.prev.ang + g.th * (1 + r) + PI / g.n;
      }
      g.m.rotation.z = g.ang;
    });
    crank.rotation.x = -A;
    placeCamera(p, now / 1000);
    hint.classList.toggle("off", p > .03);
    bar.style.width = (p * 100).toFixed(2) + "%";
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__vorspann = { set: v => { target = p = v; }, get: () => p };
}
