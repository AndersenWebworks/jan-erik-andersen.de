// Test Fließtext Gerwing: Terrasse mit Treppe baut sich wie ein Uhrwerk auf, der Absatz steht dabei
//   Variante A (#v=a): Satz für Satz als Druck auf dem Bauteil, von dem er handelt; die Kamera liest Stelle für Stelle.
//   Variante B (#v=b): Absatz als ruhige HTML-Spalte, das Modell ist so gerahmt, dass es die Spalte nie kreuzt.
// Ein Fortschritt p (0 flach, 1 fertig) steuert alles: Scrollen setzt das Ziel, p folgt gedämpft.
// Aus p entstehen über eine Zeitverzerrung der Bahnparameter u (an Lesestellen langsam, nie null)
// und daraus der Baufortschritt b, an dem alle Bewegungen hängen. #p=0…1 steuert einen Zustand direkt an.
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
  const anim = [];                            // alle Bewegungen hängen am Baufortschritt b

  // ---------- Druck auf Bauteilen (Variante A) ----------
  // Text wird als Canvas-Textur gesetzt und als hauchdünne Ebene direkt auf die Fläche gelegt:
  // kein Hintergrund, kein Rahmen, kein Schatten, nur die Druckfarbe auf dem Papier des Bauteils.
  const PXEM = 110;                           // Texturpixel je Geviert: deutlich mehr als Bildschirmpixel in der Lesestellung
  const prints = [];                          // { mesh, mat, on, stop }
  function printTex(lines, opt = {}) {
    const em = PXEM, lh = (opt.lh || 1.36) * em, gap = (opt.gap || 0) * em;
    const cv = document.createElement("canvas"), x = cv.getContext("2d");
    const font = `500 ${em}px "Schibsted Grotesk"`;
    x.font = font;
    const padX = .12 * em, padY = .1 * em;
    const wMax = Math.max(...lines.map(l => l ? x.measureText(l).width : 0));
    const nGaps = lines.filter(l => !l).length;
    const nLines = lines.length - nGaps;
    cv.width = Math.ceil(wMax + padX * 2);
    cv.height = Math.ceil(padY * 2 + (nLines - 1) * lh + em * 1.12 + nGaps * gap);
    x.font = font;
    x.fillStyle = "#303033";
    x.textBaseline = "alphabetic";
    let y = padY + em * .9;
    for (const l of lines) {
      if (!l) { y += gap; continue; }
      x.fillText(l, padX, y); y += lh;
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return { tex, w: cv.width / em, h: cv.height / em };   // Maße in Geviert
  }
  // e: Geviert in Welteinheiten; anchor: "l" linksbündig an x, sonst mittig
  function print(parent, lines, e, x, y, z, on, opt = {}) {
    const t = printTex(lines, opt);
    const mat = new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, clippingPlanes: CLIP0.planes, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const w = t.w * e, h = t.h * e;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(opt.anchor === "l" ? x + w / 2 - .12 * e : x, y, z);
    mesh.renderOrder = 2;
    parent.add(mesh);
    const pr = { mesh, mat, on, e, w, h };
    prints.push(pr);
    return pr;
  }

  // Grundfläche: ein Bogen Papier mit dem Grundriss als Haarlinie
  const ground = new THREE.Mesh(new THREE.BoxGeometry(19, .05, 15.5), paper(C.base, null, .35));
  ground.position.set(.6, -.025, 1.2);
  const groundEdge = new THREE.LineSegments(new THREE.EdgesGeometry(ground.geometry), edgeMat(null, .3));
  ground.add(groundEdge);
  model.add(ground);
  // Variante B: der Bogen geht im weißen Grund auf, damit unter der Lesespalte nur Weiß liegt; der Grundriss bleibt als Haarlinie
  const groundMat = { a: ground.material, b: paper("#ffffff", null, 1) };
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
  // Satz 1 auf der Stirnseite des Kastens (vordere Wand links), steigt mit der Wand auf
  const T1 = print(walls[0], [
    "Für Gerwing habe ich 2023 einen",
    "WooCommerce-Shop gebaut, der",
    "Pflastersteine, Terrassenplatten",
    "und Stufen so verkauft, wie man",
    "sie bestellt: nach Fläche."
  ], .13, -4.3 - walls[0].position.x, .02, .05 + .002, .215, { anchor: "l" });

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
  const rowPrints = [];
  for (let i = 0; i < NR; i++) {
    const zb = ZR + i * RD;
    const pivot = new THREE.Group(); pivot.position.set(0, H - TH / 2, zb); rowsG.add(pivot);
    let k = 0;
    const plates = [];
    for (let x = PL - (i % 2) * PW / 2; x < PR - .05; x += PW, k++) {
      const xa = Math.max(x, PL) + .014, xb = Math.min(x + PW, PR) - .014;
      if (xb - xa < .2) continue;
      const col = (i * 3 + k) % 4 === 1 ? C.old : C.paper;
      pivot.add(block(xa, xb, -TH / 2, TH / 2, .014, RD - .014, col, CLIP0, .55));
      plates.push([xa, xb]);
    }
    // Vorderste Reihe (rastet zuletzt ein): Sätze 2 und 3 stehen auf den Stirnkanten zweier Platten
    if (i === NR - 1) {
      const zf = RD - .014 + .002, on = .27 + i * .055 + .13 + .002;
      const [a2, b2] = plates[3], [a3, b3] = plates[4];
      rowPrints.push(print(pivot, ["Kunden geben ihre Quadratmeter ein,"], .062, (a2 + b2) / 2, .005, zf, on, { lh: 1 }));
      rowPrints.push(print(pivot, ["der Shop rechnet sie in ganze Steine um,"], .062, (a3 + b3) / 2, .005, zf, on + .004, { lh: 1 }));
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
  const stairPrints = [];
  for (let k = 1; k <= NS; k++) {
    const top = H - k * RH;
    const b = block(1.56, 4.44, 0, top, Z1 - TR, Z1, C.paper, CLIP0, .62);
    // Kante der Trittstufe als feine Linie, damit die Stufen auch frontal lesbar bleiben
    stairs.add(b);
    // Satz 6 läuft über die Setzstufen 2 bis 4 (sichtbares Band je 0,2 hoch), jede Zeile fährt mit ihrer Stufe aus
    const L6 = { 2: "Seitdem betreue ich den Shop", 3: "und entwickle ihn", 4: "laufend weiter." };
    if (L6[k]) stairPrints.push(print(b, [L6[k]], .118, 1.86 - b.position.x, top - RH / 2 - b.position.y + .01, TR / 2 + .002, .797 + (k - 2) * .002, { lh: 1, anchor: "l" }));
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
  // Sätze 4 und 5: aufgeklebter Lieferschein vorn am Plattenstapel, ein dünnes Blatt mit Haarkante,
  // Teil der Palette; er hängt am obersten Paket und steigt mit ihm auf
  const label = new THREE.Group(); pallet.add(label);
  const LBL = print(label, [
    "ermittelt Gewicht und Fracht",
    "nach Postleitzahl",
    "",
    "und leitet die Bestellung an",
    "den zuständigen Händler weiter."
  ], .052, 0, 0, .0045, .79, { gap: .45 });
  const lw = LBL.w + .07, lh = LBL.h + .05;
  label.add(block(-lw / 2, lw / 2, -lh / 2, lh / 2, 0, .004, "#ffffff", CLIP0, .45));
  label.position.set(0, .44, .516);
  { const y = label.position.y; anim.push(p => { label.position.y = y - (1 - mech(seg(p, .6 + 4 * .014, .07), .06)) * (.75 + 4 * .07); label.visible = variant === "a"; }); }
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
  anim.push(p => { wall.position.y = -(WH + .3) * (1 - mech(seg(p, .835, .15), .025)); });

  function wallTexture() {
    const cv = document.createElement("canvas"), x = cv.getContext("2d");
    cv.width = 2400; cv.height = Math.round(2400 * (WH - .55) / (WW - .5));
    const pad = 70;
    x.fillStyle = "#303033";
    x.font = '500 46px "Schibsted Grotesk"';
    x.letterSpacing = "6px";
    x.textBaseline = "alphabetic";
    x.fillText("GERWING · WOOCOMMERCE · SEIT 2023", pad, pad + 40);
    x.letterSpacing = "0px";
    const lines = ["Pflaster nach Fläche", "bestellen"];
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

  // ---------- Kamera ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let aspect = 1, variant = "a";

  // Monotone kubische Interpolation (Fritsch–Carlson): weich, ohne Überschwingen
  function pchip(xs, ys) {
    const n = xs.length, d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else { const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]), w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]); m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
    }
    return x => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }

  // Endstellung aller Teile einmal durchrechnen, um die Lesestellen in Weltkoordinaten zu kennen
  for (const a of anim) a(1);
  scene.updateMatrixWorld(true);
  function worldBox(list) {
    const box = new THREE.Box3(), v = new THREE.Vector3();
    for (const pr of list) {
      const hw = pr.w / 2, hh = pr.h / 2;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box.expandByPoint(v.set(sx * hw, sy * hh, 0).applyMatrix4(pr.mesh.matrixWorld));
    }
    return box;
  }
  // Lesestellen von Variante A in Lesereihenfolge (= Satzreihenfolge, passt zum Bauablauf):
  // Wand steht → Satz 1; Reihen rasten ein → Sätze 2 und 3; Palette kommt → Lieferschein; Treppe fährt aus → Satz 6.
  // yaw: Gierwinkel in Grad (+ Kamera links vom Text), pitch: Blick leicht von oben
  const STOPS = [
    { name: "1 Stirnseite", prints: [T1], b: .245, yaw: 13, pitch: 13 },
    { name: "2 Plattenkante", prints: [rowPrints[0]], b: .69, yaw: 10, pitch: 12 },
    { name: "3 Plattenkante", prints: [rowPrints[1]], b: .705, yaw: 9, pitch: 12 },
    { name: "4+5 Lieferschein", prints: [LBL], b: .802, yaw: 12, pitch: 12 },
    { name: "6 Setzstufen", prints: stairPrints, b: .822, yaw: -12, pitch: 14 }
  ];
  for (const s of STOPS) {
    const bx = worldBox(s.prints);
    s.c = bx.getCenter(new THREE.Vector3()); s.w = bx.max.x - bx.min.x; s.h = bx.max.y - bx.min.y;
    s.e = Math.min(...s.prints.map(pr => pr.e));
  }
  for (const a of anim) a(0);

  // Bahn: Schlüsselstellungen mit Gewicht (Scrollweg ab der vorigen Stellung) und Baufortschritt b
  // Überblicksstellungen werden auf schmalen Schirmen zurückgezogen, Lesestellen bekommen ihren Abstand aus der Schriftgröße
  const KEYS = [
    { w: 0, b: 0, cam: V(7, 23, -15), tgt: V(0, 0, .8) },
    { w: 1.2, b: .08, cam: V(-4, 19, -6), tgt: V(-.5, .2, .6) },
    { w: 1.2, b: .16, cam: V(-13, 12.5, 4), tgt: V(-.5, .7, .4) },
    { w: 1.2, stop: STOPS[0] },
    { w: 1.3, b: .5, cam: V(-3.5, 8.6, 11), tgt: V(.2, .9, -.2) },
    { w: 1.1, stop: STOPS[1] },
    { w: .7, stop: STOPS[2] },
    { w: 1.15, stop: STOPS[3] },
    { w: .8, stop: STOPS[4] },
    { w: 2.4, b: 1, cam: V(-9.4, 2.1, 14.6), tgt: V(1.5, 1.4, -.3), fin: true }
  ];
  { let acc = 0; const tot = KEYS.reduce((a, k) => a + k.w, 0); for (const k of KEYS) { acc += k.w; k.u = acc / tot; if (k.stop) k.b = k.stop.b; } }
  const keyU = KEYS.map(k => k.u);
  const bOfU = pchip(keyU, KEYS.map(k => k.b));
  const idxOfU = pchip(keyU, KEYS.map((k, i) => i));

  // Zeitverzerrung: Bahngeschwindigkeit du/dp sinkt an jeder Lesestelle auf rund 4 % des Mittels, nie auf null
  const STOPU = KEYS.filter(k => k.stop).map(k => k.u);
  const WARP_MIN = .04, WARP_W = .008, NW = 4000;
  const warpP = new Float64Array(NW + 1);
  {
    const bump = u => Math.max(...STOPU.map(s => Math.exp(-(((u - s) / WARP_W) ** 2))));
    let smin = WARP_MIN, T = 1;
    const sp = u => 1 - (1 - smin) * bump(u);
    for (let it = 0; it < 30; it++) {
      T = 0; for (let i = 0; i < NW; i++) T += 1 / sp((i + .5) / NW) / NW;
      smin = WARP_MIN / T;
    }
    let acc = 0; warpP[0] = 0;
    for (let i = 0; i < NW; i++) { acc += 1 / sp((i + .5) / NW) / NW; warpP[i + 1] = acc / T; }
  }
  const pOfU = u => { const f = clamp(u, 0, 1) * NW, i = Math.min(NW - 1, Math.floor(f)); return warpP[i] + (warpP[i + 1] - warpP[i]) * (f - i); };
  function uOfP(p) {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let lo = 0, hi = NW;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (warpP[mid] < p) lo = mid; else hi = mid; }
    return (lo + (p - warpP[lo]) / (warpP[hi] - warpP[lo])) / NW;
  }

  let camA = null, tgtA = null;
  const minPx = () => aspect < 1 ? 16.5 : 21;   // angestrebte Geviertgröße der Schrift in CSS-Pixeln
  function stopPose(s) {
    const t = Math.tan(camera.fov * PI / 360), H = innerHeight;
    const dSize = s.e * H / (2 * t * minPx());
    const dFitW = s.w * 1.2 / (2 * t * aspect), dFitH = s.h * 1.5 / (2 * t);
    const d = Math.max(dSize, dFitW, dFitH);
    const yw = s.yaw * PI / 180, pt = s.pitch * PI / 180;
    const dir = V(-Math.sin(yw) * Math.cos(pt), Math.sin(pt), Math.cos(yw) * Math.cos(pt));
    return { cam: s.c.clone().addScaledVector(dir, d), tgt: s.c.clone(), d };
  }
  function buildPathA() {
    const k = aspect < 1.25 ? Math.pow(1.25 / aspect, .78) : 1;
    const cams = [], tgts = [];
    for (const key of KEYS) {
      if (key.stop) { const ps = stopPose(key.stop); key.stop.d = ps.d; cams.push(ps.cam); tgts.push(ps.tgt); continue; }
      const tgt = key.tgt.clone(), off = key.cam.clone().sub(key.tgt);
      let kk = k;
      if (key.fin) { kk = aspect < 1.25 ? Math.pow(1.25 / aspect, .78 * .7) : 1; if (aspect < 1) tgt.x -= 1.6; }
      cams.push(tgt.clone().addScaledVector(off, kk)); tgts.push(tgt);
    }
    camA = new THREE.CatmullRomCurve3(cams, false, "centripetal");
    tgtA = new THREE.CatmullRomCurve3(tgts, false, "centripetal");
  }

  // Variante B: Bahn wie im Vorbild, das Modell wird in den Bereich neben bzw. über der Spalte eingepasst
  const camPath = new THREE.CatmullRomCurve3([V(7, 23, -15), V(-4, 19, -6), V(-13, 12.5, 4), V(-12, 6.5, 12), V(-9, 3.6, 15), V(-9.4, 2.1, 14.6)], false, "centripetal");
  const tgtPath = new THREE.CatmullRomCurve3([V(0, 0, .8), V(-.5, .2, .6), V(-.5, .7, .4), V(0, 1.2, -.4), V(.6, 1.5, -.6), V(1.5, 1.4, -.3)], false, "centripetal");
  // Einpassung über die Hülle des fertigen Modells samt Weg vor der Treppe und Palettenplatz
  const BOX = []; for (const x of [-5.85, 7.5]) for (const y of [0, 3.95]) for (const z of [-3.05, 4.95]) BOX.push(V(x, y, z));
  BOX.push(V(1.4, 0, Z1 + 5.5), V(4.6, 0, Z1 + 5.5));
  const lese = document.getElementById("lese"), paras = [...lese.querySelectorAll("p")];
  const PARA_AT = [.03, .33, .64];
  let region = null;
  function measureRegion() {
    const W = innerWidth, Hh = innerHeight, r = lese.getBoundingClientRect();
    const pad = Math.min(56, Math.max(18, W * .04));
    if (aspect < 1 || W <= 560) region = { x0: pad * .6, x1: W - pad * .6, y0: 54, y1: r.top - 18 };
    else region = { x0: r.right + Math.max(40, W * .035), x1: Math.min(W - pad, (W + 1320) / 2 - pad), y0: 76, y1: Hh - 84 };
  }
  const pv = new THREE.Vector3();
  let fitInfo = null;
  function fitB(tgt, off) {
    const W = innerWidth, Hh = innerHeight, rw = region.x1 - region.x0, rh = region.y1 - region.y0;
    camera.clearViewOffset();
    const ext = k => {
      camera.position.copy(tgt).addScaledVector(off, k); camera.lookAt(tgt); camera.updateMatrixWorld();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const c of BOX) { pv.copy(c).project(camera); const sx = (pv.x + 1) / 2 * W, sy = (1 - pv.y) / 2 * Hh; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); }
      return { x0, x1, y0, y1 };
    };
    let lo = .2, hi = 8;
    for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2, e = ext(m); if (e.x1 - e.x0 <= rw && e.y1 - e.y0 <= rh) hi = m; else lo = m; }
    const e = ext(hi);
    const ox = (e.x0 + e.x1) / 2 - (region.x0 + region.x1) / 2, oy = (e.y0 + e.y1) / 2 - (region.y0 + region.y1) / 2;
    fitInfo = { k: hi, x0: e.x0 - ox, x1: e.x1 - ox, y0: e.y0 - oy, y1: e.y1 - oy, region };
    return { k: hi, ox, oy };
  }

  const camP = new THREE.Vector3(), tgtP = new THREE.Vector3(), off = new THREE.Vector3();
  let state = { u: 0, b: 0 };
  function placeCamera(p, time) {
    let sway = 1, view = null;
    if (variant === "a") {
      const u = uOfP(p), t = idxOfU(u) / (KEYS.length - 1);
      state = { u, b: clamp(bOfU(u), 0, 1) };
      camA.getPoint(t, camP); tgtA.getPoint(t, tgtP);
      off.subVectors(camP, tgtP);
      sway = clamp(off.length() / 14, .25, 1);
      camera.clearViewOffset();
    } else {
      const u = sm(p) * .2 + p * .8;
      state = { u, b: p };
      camPath.getPoint(u, camP); tgtPath.getPoint(u, tgtP);
      off.subVectors(camP, tgtP);
      view = fitB(tgtP, off);
      off.multiplyScalar(view.k);
      sway = clamp(off.length() / 22, .3, 1);
    }
    camera.position.copy(tgtP).add(off);
    // die Kamera steht nie ganz still
    camera.position.x += (Math.sin(time * .23) * .14 + Math.sin(time * .07) * .1) * sway;
    camera.position.y += Math.sin(time * .19 + 1) * .06 * sway;
    camera.position.z += Math.cos(time * .17) * .12 * sway;
    camera.lookAt(tgtP);
    if (view) camera.setViewOffset(innerWidth, innerHeight, view.ox, view.oy, innerWidth, innerHeight);
  }

  // ---------- Fortschritt, Scrollen, Abspielen, Varianten ----------
  const hint = document.getElementById("hint"), bar = document.getElementById("bar");
  const btn = document.getElementById("play"), lbl = btn.querySelector(".lbl");
  const links = [...document.querySelectorAll(".variants a")];
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let target = clamp(scrollY / maxScroll(), 0, 1), p = target;
  let hold = false;
  let play = null;
  // Anker: #v=a|b wählt die Variante, #p=0…1 steuert einen Zustand an und hält ihn, bis jemand selbst scrollt.
  // Ankerwechsel lädt nicht neu.
  function applyHash(initial) {
    const q = new URLSearchParams((location.hash || "").replace(/^#/, ""));
    const v = q.get("v") === "b" ? "b" : "a";
    const changed = initial || v !== variant;
    variant = v;
    document.body.classList.toggle("va", v === "a");
    document.body.classList.toggle("vb", v === "b");
    ground.material = groundMat[v]; groundEdge.visible = v === "a";
    links.forEach(a => a.setAttribute("aria-current", a.dataset.v === v ? "true" : "false"));
    if (changed) resize();
    const hp = q.get("p");
    if (hp !== null && hp !== "" && isFinite(+hp)) { target = p = clamp(+hp, 0, 1); hold = true; }
    else if (!changed) return;
    else hold = false;
    if (play) stopPlay();
    scrollTo(0, target * maxScroll());
  }
  addEventListener("hashchange", () => applyHash(false));
  addEventListener("scroll", () => { if (!hold) target = clamp(scrollY / maxScroll(), 0, 1); }, { passive: true });
  for (const ev of ["wheel", "touchstart", "keydown"]) addEventListener(ev, () => { hold = false; }, { passive: true });

  const DUR = { a: 64000, b: 16000 };          // A ist die längere Strecke mit fünf Lesestellen
  function stopPlay() { play = null; btn.classList.remove("on"); lbl.textContent = target > .995 ? "Nochmal" : "Abspielen"; }
  btn.addEventListener("click", () => {
    if (play) { stopPlay(); return; }
    let from = target;
    hold = false;
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
    buildPathA();
    measureRegion();
  }
  addEventListener("resize", () => { resize(); if (hold) scrollTo(0, target * maxScroll()); });
  applyHash(true);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (play) {
      const dur = DUR[variant] * (1 - play.from) || 1;
      const f = clamp(play.from + (now - play.t0) / dur * (1 - play.from), 0, 1);
      scrollTo(0, f * maxScroll()); target = f;
      if (f >= 1) stopPlay();
    }
    p += (target - p) * (1 - Math.exp(-dt * 3.4));
    if (Math.abs(target - p) < 1e-5) p = target;
    placeCamera(p, now / 1000);
    const b = state.b;
    for (const a of anim) a(b);
    // Druck erscheint erst, wenn sein Bauteil eingerastet ist; rückwärts verschwindet er wieder
    for (const pr of prints) {
      const o = variant === "a" ? sm((b - pr.on) / .012) : 0;
      pr.mat.opacity = o; pr.mesh.visible = o > .001;
    }
    if (variant === "b") paras.forEach((el, i) => {
      const o = sm((p - PARA_AT[i]) / .08);
      el.style.opacity = o.toFixed(3); el.style.transform = `translateY(${((1 - o) * 10).toFixed(1)}px)`;
    });
    // Getriebe: Winkel aus dem Baufortschritt, Kette greift korrekt ineinander
    const A = b * 30;
    gears.forEach((g, i) => {
      if (!i) { g.ang = A; } else {
        const r = g.prev.n / g.n;
        g.ang = -r * g.prev.ang + g.th * (1 + r) + PI / g.n;
      }
      g.m.rotation.z = g.ang;
    });
    crank.rotation.x = -A;
    hint.classList.toggle("off", p > .03);
    bar.style.width = (p * 100).toFixed(2) + "%";
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Prüfhilfe: Lesestellen und Bildschirmlage der Drucke
  const pj = new THREE.Vector3();
  window.__vorspann = { set: v => { target = p = v; }, get: () => p };
  window.__info = () => {
    const W = innerWidth, Hh = innerHeight, t = Math.tan(camera.fov * PI / 360);
    const out = { v: variant, p: +p.toFixed(4), u: +state.u.toFixed(4), b: +state.b.toFixed(4), aspect: +aspect.toFixed(3) };
    out.stops = STOPS.map(s => ({ name: s.name, p: +pOfU(KEYS.find(k => k.stop === s).u).toFixed(4), d: +(s.d || 0).toFixed(2) }));
    out.prints = prints.filter(pr => pr.mesh.visible).map(pr => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        pj.set(sx * pr.w / 2, sy * pr.h / 2, 0).applyMatrix4(pr.mesh.matrixWorld).project(camera);
        const X = (pj.x + 1) / 2 * W, Y = (1 - pj.y) / 2 * Hh; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
      }
      pj.setFromMatrixPosition(pr.mesh.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
      return { em: +(pr.e * Hh / (2 * -pj.z * t)).toFixed(1), box: [x0, y0, x1, y1].map(Math.round), op: +pr.mat.opacity.toFixed(2) };
    });
    if (variant === "b") out.fit = fitInfo && Object.fromEntries(Object.entries(fitInfo).map(([k, v]) => [k, typeof v === "number" ? Math.round(v * 100) / 100 : v]));
    return out;
  };
}
