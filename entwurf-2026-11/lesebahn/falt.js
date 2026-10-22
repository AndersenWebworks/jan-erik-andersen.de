// Gemeinsamer Faltkern der durchgehenden Seite (entwurf-2026-11/seite/). Grundlage: entwurf-2026-11/bogen/falt.js (Pop-up-Buch,
// Bastellinien, Abdruck, Konstruktionsphase mit Raster, Gerüst und Bleistiftspur). Alle Teile liegen in Ruhe flach auf dem Bogen
// (Faltplan in x/z). Jede Fläche hängt an einem Scharnier ihrer Elternfläche und klappt mit dem Baufortschritt b hoch, mit der
// Mechanik aus dem Vorspann-Test (anfahren, abbremsen, überschwingen, einrasten).
//
// Zusammengeführt aus den Kopien der Szenen (Herkunft in Klammern):
// - bounce() und Knotenoption bounce: Rückprall statt Überschwingen (betreuung)
// - F.poly opt.ghost: nur Schnittlinien und Abdruck, keine Fläche (betreuung)
// - Bastellinien mindestens eine Ebene über ihrem Besitzer (betreuung) und um F.part(…, { lift }) angehoben (stimmen)
// - Knotenoptionen dn { t0, d } (klappt zurück) und re { t0, d } (steht wieder auf) (modernisierung)
// - F.geruest(o).bAt: Endzustand des Gerüsts bei b = bAt (modernisierung); neu: F.geruest und F.spur dürfen mehrfach aufgerufen werden
//   (je Aufruf eigene Teile und eigenes Zeitfenster), o.filter(nd) wählt einzelne Knoten
// - F.spin(par, c, ang, t0, d, opt): Drehknoten (schnittstellen + shop, vereinheitlicht: Achse opt.axis, Ebene opt.lv, Vorgabe kein Überschwingen)
// - F.slide(par, [dx, dy, dz], t0, d, opt): Schiebeknoten (shop)
// - Knotenoptionen lin (gleichmäßiger Lauf, schnittstellen), ease(x) (eigener Lauf, shop), fresh / mvOwn (Teil erbt den
//   Bewegungszustand der Elternfläche nicht; shop „fresh“ = schnittstellen „mvOwn“), ang0 (Startwinkel, stimmen)
// - mvo: Bewegung relativ zur eigenen Fläche für Haarkanten und Bastellinien, eingeschaltet mit F.edgeOwn(true) (werdegang)
// Neu für die Seite: Ursprung uOrg und Ausschnitt uClip je Szene in allen Shadern (Szenen liegen als Gruppen hintereinander,
// Raster und Ausschnitt rechnen in Szenenkoordinaten); Kanten-, Bastel- und Gerüstlinien rechnen mit modelMatrix.
// Knoten mit clock "t" laufen nach der Zeit seit dem Eintreffen der Szene (Lettern), alle anderen nach b.
import * as THREE from "three";

export const PI = Math.PI, Q = PI / 2;
export const EPS = .0015;
const lin = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
export const COL = {
  PAPER: lin("#faf8f3"), HOLE: lin("#e7e2d7"), OLD: lin("#e6dfd1"), SHADE: lin("#d6cfc2"), DARK: lin("#9d978d"),
  RED: lin("#d40235"), INK: lin("#303033"), STONE: lin("#ece7dd"), STONE2: lin("#ddd6c8"), WHITE: lin("#ffffff")
};
const { PAPER, INK, HOLE } = COL;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
export const sm5 = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10);
// Mechanischer Lauf (Vorspann-Test): anfahren, abbremsen, kurz über den Anschlag, einrasten
export function mech(x, over = .05) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const w = .74;
  if (x < w) { const u = x / w; return (1 + over) * sm5(u); }
  const t = (x - w) / (1 - w);
  return 1 + over * Math.cos(t * PI * 2.5) * (1 - t) * (1 - t);
}
// Rückprall (betreuung): anfahren, abbremsen, anschlagen, kurz zurückfedern, liegen bleiben; nie über 1
export function bounce(x, k = .03) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const w = .7;
  if (x < w) { const u = x / w; return u * u * (2.2 - 1.2 * u); }
  const t = (x - w) / (1 - w);
  return 1 - k * Math.abs(Math.sin(t * PI * 2)) * (1 - t) * (1 - t);
}
// gleichmäßiger Lauf mit sanftem Anlauf und Auslauf (schnittstellen, opt.lin)
export const linRun = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x) * .35 + x * .65;

// ---------- Shader ----------
const LIGHT = new THREE.Vector3(-.45, .8, .5).normalize();
export const FAR = new THREE.Vector2(70, 140), NEAR = new THREE.Vector2(.35, 1.2);
const NOCLIP = () => new THREE.Vector4(-1e5, 1e5, -1e5, 1e5);
// Ausschnitt in Szenenkoordinaten (x0, x1, z0, z1); alles außerhalb wird verworfen
const CLIP_GLSL = `if (vL.x < uClip.x || vL.x > uClip.y || vL.z < uClip.z || vL.z > uClip.w) discard;`;
const PAPER_VERT = `
  uniform vec3 uOrg;
  #ifdef UCOL
  uniform vec3 uCol;
  #else
  attribute vec3 aCol;
  #endif
  varying vec3 vCol; varying vec3 vW; varying vec3 vL; varying float vDepth;
  #ifdef GRID
  varying vec3 vR; varying float vG;
  #ifdef GRIDA
  attribute vec3 aRest; attribute float aG;
  #endif
  #endif
  void main() {
    #ifdef UCOL
    vCol = uCol;
    #else
    vCol = aCol;
    #endif
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz; vL = wp.xyz - uOrg;
    #ifdef GRID
    #ifdef GRIDA
    vR = aRest; vG = aG;
    #else
    vR = vL; vG = 1.0;
    #endif
    #endif
    vec4 mv = viewMatrix * wp;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
// Papier: flache Normale aus den Bildschirmableitungen, weiches Licht, leichte Bodenverschattung an stehenden Flächen
const PAPER_FRAG = `
  uniform vec3 uL; uniform vec2 uFar; uniform vec2 uNear; uniform vec4 uClip;
  varying vec3 vCol; varying vec3 vW; varying vec3 vL; varying float vDepth;
  #ifdef GRID
  // Schneidematten-Raster, auf den Bogen gedruckt (Lage in der Ruhelage, wandert also mit dem Teil), nach b ein- und ausgeblendet.
  // uGP: Teilung, jede n-te kräftiger, Deckkraft fein, Deckkraft kräftig. uGT: Beginn, Welle je Einheit x, Einblenddauer, Beginn Ausblenden
  uniform float uGB; uniform vec4 uGP; uniform vec4 uGT; uniform vec3 uInk;
  varying vec3 vR; varying float vG;
  float gridLine(vec2 q) {
    vec2 fw = max(fwidth(q), vec2(1e-4));
    vec2 d = abs(fract(q - 0.5) - 0.5) / fw;
    // dichter als rund 4 px: ausblenden statt Moiré
    return (1.0 - min(min(d.x, d.y), 1.0)) * (1.0 - smoothstep(.22, .5, max(fw.x, fw.y)));
  }
  #endif
  void main() {
    ${CLIP_GLSL}
    float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    if (smoothstep(uNear.x, uNear.y, vDepth) < ign) discard;
    vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
    if (dot(n, cameraPosition - vW) < 0.0) n = -n;
    float dif = dot(n, uL);
    float sh = 0.86 + 0.14 * max(dif, 0.0) - 0.11 * max(-dif, 0.0);
    float ao = mix(1.0, mix(0.9, 1.0, smoothstep(0.0, 0.8, vW.y)), 1.0 - abs(n.y));
    vec3 c = vCol * sh * ao;
    #ifdef GRID
    float gin = clamp((uGB - uGT.x - (vR.x + 12.0) * uGT.y) / uGT.z, 0.0, 1.0);
    float gk = gin * gin * (3.0 - 2.0 * gin) * (1.0 - smoothstep(uGT.w, uGT.w + .06, uGB)) * vG;
    if (gk > 0.001) {
      vec2 q = vR.xz / uGP.x;
      float ga = max(gridLine(q) * uGP.z, gridLine(q / uGP.y) * uGP.w) * gk;
      c = mix(c, uInk * sh, ga);
    }
    #endif
    float k = 1.0 - smoothstep(uFar.x, uFar.y, vDepth);
    gl_FragColor = vec4(mix(vec3(1.0), c, k), 1.0);
    #include <colorspace_fragment>
  }`;
const EDGE_VERT = `
  uniform vec3 uOrg;
  attribute vec4 aCol;
  varying vec4 vC; varying float vDepth; varying vec3 vL;
  void main() {
    vC = aCol;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vL = wp.xyz - uOrg;
    vec4 mv = viewMatrix * wp;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const EDGE_FRAG = `
  uniform vec2 uFar; uniform vec2 uNear; uniform vec4 uClip;
  varying vec4 vC; varying float vDepth; varying vec3 vL;
  void main() {
    ${CLIP_GLSL}
    float a = vC.a * smoothstep(uNear.x, uNear.y + .3, vDepth) * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
    if (a < 0.005) discard;
    gl_FragColor = vec4(vC.rgb, min(a, 1.0));
    #include <colorspace_fragment>
  }`;
// Bastellinien: aP = (Start in b, Dauer in b, Lauf 0…1 entlang der Linie, Länge in m; negativ = gestrichelt)
const RISS_VERT = `
  uniform vec3 uOrg;
  attribute vec4 aCol; attribute vec4 aP;
  varying vec4 vC; varying vec4 vP; varying vec3 vL;
  void main() { vC = aCol; vP = aP; vec4 wp = modelMatrix * vec4(position, 1.0); vL = wp.xyz - uOrg; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const RISS_FRAG = `
  uniform float uB; uniform vec4 uClip;
  varying vec4 vC; varying vec4 vP; varying vec3 vL;
  void main() {
    ${CLIP_GLSL}
    float g = clamp((uB - vP.x) / vP.y, 0.0, 1.0);
    g = g * (2.0 - g);
    if (g <= 0.0 || vP.z > g + 0.0001) discard;
    if (vP.w < 0.0 && fract(vP.z * -vP.w / 0.085) > 0.56) discard;
    float a = vC.a * (1.0 + 0.6 * (1.0 - step(0.999, g)));
    if (a < 0.004) discard;
    gl_FragColor = vec4(vC.rgb, min(a, 1.0));
    #include <colorspace_fragment>
  }`;
const frameUniforms = () => ({ uOrg: { value: new THREE.Vector3() }, uClip: { value: NOCLIP() } });
export function paperMaterial(col) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uL: { value: LIGHT }, uFar: { value: FAR }, uNear: { value: NEAR }, uCol: { value: col ? new THREE.Color(col) : new THREE.Color() },
      uGB: { value: 0 }, uGP: { value: new THREE.Vector4() }, uGT: { value: new THREE.Vector4() }, uInk: { value: new THREE.Vector3(...INK) }, ...frameUniforms() },
    vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2
  });
  if (col) m.defines = { UCOL: 1 };
  return m;
}
// Ursprung und Ausschnitt einer Szene in ein Material des Kerns schreiben (andere Materialien: clippingPlanes, siehe kern.js)
export function frameOn(mat, org, clip) {
  if (!mat || !mat.uniforms || !mat.uniforms.uOrg) return false;
  mat.uniforms.uOrg.value.copy(org);
  if (clip) mat.uniforms.uClip.value.set(clip[0], clip[1], clip[2], clip[3]);
  return true;
}
// Raster auf dem Bogen einschalten (nur Szenen, die es wünschen; ohne Aufruf bleibt der Shader wie bisher).
// attr: Fläche hat aRest/aG (Faltmodell), sonst Lage in Szenenkoordinaten (fester Bogen). g: { step, every, a, aM, t0, wave, d, out }
export function gridOn(mat, attr, g) {
  mat.defines = { ...(mat.defines || {}), GRID: 1, ...(attr ? { GRIDA: 1 } : {}) };
  mat.uniforms.uGP.value.set(g.step, g.every, g.a, g.aM);
  mat.uniforms.uGT.value.set(g.t0, g.wave, g.d, g.out);
  mat.needsUpdate = true;
  return mat;
}
// Gerüst: Haarlinien des Endzustands im Raum. aP = (Start in b, Dauer, Lauf 0…1, Ausblenden ab b), aO: Überstand (Richtung × Länge)
const GER_VERT = `
  uniform float uB; uniform vec3 uOrg;
  attribute vec4 aCol; attribute vec4 aP; attribute vec3 aO;
  varying vec4 vC; varying vec4 vP; varying float vF; varying vec3 vL;
  void main() {
    vC = aCol; vP = aP;
    // der Überstand zieht sich zurück, während das Teil einrastet; danach blendet die Linie aus
    float r = 1.0 - smoothstep(aP.w - .04, aP.w - .005, uB);
    vF = 1.0 - smoothstep(aP.w - .01, aP.w + .02, uB);
    vec4 wp = modelMatrix * vec4(position + aO * r, 1.0);
    vL = wp.xyz - uOrg;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const GER_FRAG = `
  uniform float uB; uniform vec4 uClip;
  varying vec4 vC; varying vec4 vP; varying float vF; varying vec3 vL;
  void main() {
    ${CLIP_GLSL}
    float g = clamp((uB - vP.x) / vP.y, 0.0, 1.0);
    g = g * (2.0 - g);
    if (g <= 0.0 || vP.z > g + 0.0001) discard;
    float a = vC.a * vF * (1.0 + 0.6 * (1.0 - step(0.999, g)));
    if (a < 0.004) discard;
    gl_FragColor = vec4(vC.rgb, min(a, 1.0));
    #include <colorspace_fragment>
  }`;
export function geruestMaterial() {
  return new THREE.ShaderMaterial({ uniforms: { uB: { value: 0 }, ...frameUniforms() }, vertexShader: GER_VERT, fragmentShader: GER_FRAG, transparent: true, depthWrite: false });
}
export function edgeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uFar: { value: FAR }, uNear: { value: NEAR }, ...frameUniforms() },
    vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG, transparent: true, depthWrite: false
  });
}
export function rissMaterial() {
  return new THREE.ShaderMaterial({ uniforms: { uB: { value: 0 }, ...frameUniforms() }, vertexShader: RISS_VERT, fragmentShader: RISS_FRAG, transparent: true, depthWrite: false });
}

// ---------- Faltmodell ----------
export function Model() {
  const nodes = [];
  const tv = [], tc = [], tn = [];          // Flächen: Ruhelage, Farbe, Knoten
  const lv = [], lc = [], ln = [];          // Haarkanten der Teile
  const hinges = [], cuts = [], holes = [], sketches = [], polys = [];
  const gerOpts = [], spurOpts = [];
  let edgeOwn = false;
  const att = [];
  const parts = new Map(); let tag = null;
  const mk = (par, P, A, ang, t0, d, lvl, opt = {}) => {
    const n = { i: nodes.length, par, P, A, ang, t0, d: Math.max(d, 1e-3), lvl, M: new Float64Array(12), mv: 0, mvo: 0,
      clock: opt.clock || "b", over: opt.over !== undefined ? opt.over : .06, own: opt.own || null, tag: opt.tag !== undefined ? opt.tag : tag,
      nocut: !!opt.nocut, nofold: !!opt.nofold,
      bounce: opt.bounce || 0, dn: opt.dn || null, lin: !!opt.lin, ease: opt.ease || null, fresh: !!(opt.fresh || opt.mvOwn), ang0: opt.ang0 };
    n.M.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]);
    nodes.push(n); return n;
  };
  const root = mk(null, null, null, 0, 0, 1, 0, { tag: null });
  // Bleistiftspur: auf jeder Fläche der Teile mit o.tags Eckmarken knapp innerhalb der Kanten (zwei Striche, leicht versetzt,
  // über die Ecke gekreuzt), an langen Kanten großer Flächen ein zarter durchgehender Strich. Beidseitig (dy ±), zeichnet sich,
  // während das Teil einrastet, und bleibt stehen. o.quiet: Knoten mit Text, dort nur Eckmarken. Nichts ragt über die Fläche hinaus.
  function spurOf(o) {
    const quiet = new Set(o.quiet || []), a1 = o.a || .3, dy = o.dy || .003;
    for (const pg of polys) {
      const nd = pg.nd;
      if (nd.clock === "t" || !o.tags.includes(nd.tag) || (o.filter && !o.filter(nd))) continue;
      // doppelte Punkte und Ecken auf einer Geraden entfernen (Tischplatte, Bildschirm)
      let P = pg.pts.filter((p, k, A) => { const q = A[(k + 1) % A.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-5; });
      P = P.filter((p, k, A) => {
        const a = A[(k + A.length - 1) % A.length], c = A[(k + 1) % A.length];
        const ux = p[0] - a[0], uz = p[1] - a[1], vx = c[0] - p[0], vz = c[1] - p[1];
        return Math.abs(ux * vz - uz * vx) / (Math.hypot(ux, uz) * Math.hypot(vx, vz)) > 1e-3;
      });
      if (P.length < 3) continue;
      const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cz = P.reduce((s, p) => s + p[1], 0) / P.length;
      const t0 = nd.t0 + nd.d * .35, segs1 = [], segs2 = [], segs3 = [];
      P.forEach((p, k) => {
        const q = P[(k + 1) % P.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (L < .25) return;
        const ux = (q[0] - p[0]) / L, uz = (q[1] - p[1]) / L;
        let nx = -uz, nz = ux; if ((cx - p[0]) * nx + (cz - p[1]) * nz < 0) { nx = -nx; nz = -nz; }
        const Wd = Math.max(...P.map(v => (v[0] - p[0]) * nx + (v[1] - p[1]) * nz));
        if (Wd < .12) return;
        const s = Math.min(.045, Wd * .22), arm = Math.min(.4, .3 * L);
        const at = (u, v) => [p[0] + ux * u + nx * v, p[1] + uz * u + nz * v];
        if (L < 2 * arm + .1) segs1.push([at(.4 * s, s), at(L - .4 * s, s)]);
        else { segs1.push([at(.4 * s, s), at(arm, s)]); segs1.push([at(L - arm, s), at(L - .4 * s, s)]); }
        // zweiter Strich: kleiner gleichmäßiger Versatz, leicht schräg, kürzer
        segs2.push([at(.6 * s, s + .012), at(arm * .78, s + .02)]);
        segs2.push([at(L - arm * .78, s + .02), at(L - .6 * s, s + .012)]);
        if (!quiet.has(nd) && Wd > .6 && L > 1) segs3.push([at(arm * .9, s + .006), at(L - arm * .9, s + .006)]);
      });
      for (const side of [1, -1]) {
        if (segs1.length) sketches.push({ nd, segs: segs1, t0, d: .035, a: a1, fade: null, dy: side * dy, dash: false, col: INK });
        if (segs2.length) sketches.push({ nd, segs: segs2, t0: t0 + .006, d: .035, a: a1 * .6, fade: null, dy: side * dy * 1.1, dash: false, col: INK });
        if (segs3.length) sketches.push({ nd, segs: segs3, t0: t0 + .012, d: .035, a: a1 * .4, fade: null, dy: side * dy * 1.2, dash: false, col: INK });
      }
    }
  }
  const F = {
    root, nodes,
    // Teil: alle folgenden Knoten gehören dazu; ihre Bastellinien zeichnen sich im Fenster [t0, t0 + d] von b.
    // o.lift: Bastellinien des Teils liegen um lift höher (stimmen: über einem gestapelten Leporello)
    part(name, t0, d, o = {}) { tag = name; if (!parts.has(name)) parts.set(name, { t0, d, lift: o.lift || 0 }); return name; },
    // Haarkanten und Bastellinien folgen der Bewegung relativ zur eigenen Fläche (werdegang): Teile auf einer gehobenen Platte
    // zeigen Haarkante und Falz erst, wenn sie selbst die Platte verlassen
    edgeOwn(on = true) { edgeOwn = !!on; },
    // Scharnier a-b (Bogen x/z); side: ein Punkt der Fläche. ang > 0 hebt die Fläche zur Oberseite der Elternfläche.
    hinge(par, a, b, side, ang, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl + 1;
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      const sx = side[0] - a[0], sz = side[1] - a[1], pr = sx * ux + sz * uz, vx = sx - ux * pr, vz = sz - uz * pr, al = Math.hypot(vx, vz);
      const n = mk(par, [a[0], lvl * EPS, a[1]], [-vz / al, 0, vx / al], ang, t0, d, lvl, opt);
      hinges.push({ a: [a[0], a[1]], b: [b[0], b[1]], nd: n });
      return n;
    },
    // Hubknoten: die Ebene hebt sich parallel um dy (Plattform, Tischplatte); Kinder bauen in denselben x/z-Koordinaten weiter
    lift(par, dy, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl + 1;
      const n = mk(par, [0, 0, 0], [1, 0, 0], 0, t0, d, lvl, opt); n.lift = dy; return n;
    },
    // Drehknoten: dreht alles darunter um eine Achse durch c (x/z der Ruhelage), Richtung opt.axis (Vorgabe: Normale der Elternfläche
    // in der Ruhelage, also senkrecht). Vereinheitlicht aus schnittstellen (Ebene par.lvl + 1, opt.y) und shop (Ebene par.lvl):
    // Ebene opt.lv, Vorgabe par.lvl + 1; Lauf über opt.lin / opt.ease / mech, Vorgabe ohne Überschwingen (over 0).
    spin(par, c, ang, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl + 1, ax = opt.axis || [0, 1, 0], al = Math.hypot(...ax);
      return mk(par, [c[0], opt.y !== undefined ? opt.y : lvl * EPS, c[1]], ax.map(v => v / al), ang, t0, d, lvl, { over: 0, ...opt });
    },
    // Schiebeknoten (shop): verschiebt seine Kinder um v (im Rahmen der Elternfläche), mechanisch wie alle Knoten
    slide(par, v, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl;
      const n = mk(par, [0, 0, 0], [1, 0, 0], 0, t0, d, lvl, opt); n.slide = v.slice(); return n;
    },
    // opt.ghost (betreuung): nur Schnittlinien und Abdruck, keine Fläche (Umriss eines Teils mit Loch, dessen Flächen einzeln liegen)
    poly(nd, pts, col = PAPER, e = .5, dy = 0, ecol = INK, opt = {}) {
      const y = nd.lvl * EPS + dy, n = pts.length;
      if (opt.ghost) {
        for (let k = 0; k < n; k++) { const w = Array.isArray(e) ? e[k] : e; if (w) cuts.push({ p: [pts[k][0], pts[k][1]], q: [pts[(k + 1) % n][0], pts[(k + 1) % n][1]], nd }); }
        holes.push({ nd, pts: pts.map(p => [p[0], p[1]]) });
        return;
      }
      for (let k = 1; k < n - 1; k++) for (const p of [pts[0], pts[k], pts[k + 1]]) { tv.push(p[0], y, p[1]); tc.push(...col); tn.push(nd.i); }
      for (let k = 0; k < n; k++) {
        const w = Array.isArray(e) ? e[k] : e; if (!w) continue;
        const p = pts[k], q = pts[(k + 1) % n];
        lv.push(p[0], y, p[1], q[0], y, q[1]); lc.push(...ecol, w, ...ecol, w); ln.push(nd.i, nd.i);
        if (nd !== root && !dy && !opt.nocut) cuts.push({ p: [p[0], p[1]], q: [q[0], q[1]], nd });
      }
      if (nd !== root && !dy && !opt.nocut) holes.push({ nd, pts: pts.map(p => [p[0], p[1]]) });
      if (nd !== root && !dy) polys.push({ nd, pts: pts.map(p => [p[0], p[1]]) });
    },
    line(nd, a, b, w = .35, col = INK, dy = .0008) {
      const y = nd.lvl * EPS + dy;
      lv.push(a[0], y, a[1], b[0], y, b[1]); lc.push(...col, w, ...col, w); ln.push(nd.i, nd.i);
    },
    // Konstruktionsphase: Gerüst des Endzustands im Raum aus den Haarkanten der Teile mit o.tags, gezeichnet im Fenster [o.t0, o.t1]
    // von b (geruestOf; o.bAt: Zustand, aus dem gerechnet wird; o.filter(nd): nur diese Knoten); Bleistiftspur auf den Flächen der Teile
    // (spurOf). Beide dürfen mehrfach aufgerufen werden.
    geruest(o) { gerOpts.push(o); },
    spur(o) { spurOpts.push(o); },
    // Gezeichnete Linien auf der Fläche eines Knotens (z. B. Skizze): segs [[a, b], …] in x/z der Ruhelage,
    // zeichnen sich im Fenster [t0, t0 + d]; fade(b) liefert die Deckkraft (1 = voll)
    sketch(nd, segs, t0, d, opt = {}) { sketches.push({ nd, segs, t0, d, a: opt.a || .55, fade: opt.fade || null, dy: opt.dy !== undefined ? opt.dy : .0009, dash: !!opt.dash, col: opt.col || INK }); },
    // Objekt an einen Knoten hängen. p: Punkt (x, z) in der Ruhelage, q: Richtung "oben" des Objekts in der Ruhelage,
    // side +1: Oberseite der Ruhelage, -1: Unterseite.
    attach(nd, obj, p, q, side = 1, lift = .002) {
      const ql = Math.hypot(q[0], q[1]), qx = q[0] / ql, qz = q[1] / ql;
      const X = new THREE.Vector3(-qz * side, 0, qx * side), Y = new THREE.Vector3(qx, 0, qz), N = new THREE.Vector3(0, side, 0);
      const R = new THREE.Matrix4().makeBasis(X, Y, N).setPosition(p[0], nd.lvl * EPS + side * lift, p[1]);
      obj.matrixAutoUpdate = false;
      att.push({ nd, obj, R });
      return { X, Y };
    },
    finish() {
      // Besitzer der Bastellinien und des Abdrucks: die Fläche, aus der das Teil geschnitten ist (Bogen oder Hubplatte)
      for (const n of nodes) {
        if (!n.par || n.own) continue;
        let o = n.par; while (o.par && !o.lift) o = o.par; n.own = o;
      }
      for (const o of spurOpts) spurOf(o);
      // ---- Bastellinien ----
      const near = (a, b) => Math.abs(a[0] - b[0]) < 1e-4 && Math.abs(a[1] - b[1]) < 1e-4;
      const onSeg = (p, h) => {
        const dx = h.b[0] - h.a[0], dz = h.b[1] - h.a[1], L2 = dx * dx + dz * dz;
        const t = ((p[0] - h.a[0]) * dx + (p[1] - h.a[1]) * dz) / L2;
        const ex = h.a[0] + dx * t - p[0], ez = h.a[1] + dz * t - p[1];
        return t > -1e-4 && t < 1 + 1e-4 && ex * ex + ez * ez < 1e-8;
      };
      const folds = hinges.filter(h => !h.nd.nofold);
      const cutList = [], live = cuts.filter(c => !c.nd.nocut && !folds.some(h => onSeg(c.p, h) && onSeg(c.q, h)));
      const asSeg = c => ({ a: c.p, b: c.q });
      for (const c of live) {
        if (cutList.some(o => (near(o.p, c.p) && near(o.q, c.q)) || (near(o.p, c.q) && near(o.q, c.p)))) continue;
        // Kante, die ganz in einer längeren Schnittkante liegt (Nachbarteile), nur einmal zeichnen
        if (live.some(o => o !== c && onSeg(c.p, asSeg(o)) && onSeg(c.q, asSeg(o)) && !(onSeg(o.p, asSeg(c)) && onSeg(o.q, asSeg(c))))) continue;
        cutList.push(c);
      }
      const segs = [];
      for (const [name, pt] of parts) {
        const cs = cutList.filter(c => c.nd.tag === name), fs = folds.filter(h => h.nd.tag === name).map(h => ({ p: h.a, q: h.b, nd: h.nd, fold: 1 }));
        const all = cs.concat(fs); if (!all.length) continue;
        let cx = 0, cz = 0; for (const s of all) { cx += s.p[0] + s.q[0]; cz += s.p[1] + s.q[1]; } cx /= 2 * all.length; cz /= 2 * all.length;
        const ang = s => Math.atan2(-((s.p[1] + s.q[1]) / 2 - cz), (s.p[0] + s.q[0]) / 2 - cx);
        // Umriss im Uhrzeigersinn von links hinten, danach die Falze
        const ord = cs.sort((a, b) => ang(b) - ang(a)).concat(fs.sort((a, b) => ang(b) - ang(a)));
        const n = ord.length, span = Math.min(.5, .1 + 1.5 / n);
        ord.forEach((s, i) => {
          const st = pt.t0 + pt.d * (n > 1 ? i / (n - 1) : 0) * (1 - span);
          // mindestens eine Ebene über dem Besitzer (betreuung: Knoten mit negativer Ebene), angehoben um lift (stimmen)
          segs.push({ p: s.p, q: s.q, own: s.nd.own, ch: s.nd, y: Math.max(s.nd.lvl, s.nd.own.lvl + 1) * EPS + .6 * EPS + (pt.lift || 0), kind: s.fold ? "f" : "c", st, du: pt.d * span, a: s.fold ? .5 : .6 });
        });
      }
      for (const sk of sketches) {
        const n = sk.segs.length, span = Math.min(.5, .1 + 1.5 / n);
        sk.segs.forEach(([p, q], i) => segs.push({ p, q, own: sk.nd, ch: null, y: sk.nd.lvl * EPS + sk.dy, kind: "s", sk, st: sk.t0 + sk.d * (n > 1 ? i / (n - 1) : 0) * (1 - span), du: sk.d * span, a: sk.a, dash: sk.dash, col: sk.col }));
      }
      const NR = segs.length;
      const restR = new Float32Array(NR * 6), posR = new Float32Array(NR * 6), colR = new Float32Array(NR * 8), aP = new Float32Array(NR * 8), nR = new Int32Array(NR * 2);
      segs.forEach((s, i) => {
        restR.set([s.p[0], s.y, s.p[1], s.q[0], s.y, s.q[1]], i * 6);
        const L = Math.hypot(s.q[0] - s.p[0], s.q[1] - s.p[1]) * (s.kind === "f" || s.dash ? -1 : 1);
        aP.set([s.st, s.du, 0, L, s.st, s.du, 1, L], i * 8);
        const c = s.col || INK; colR.set([...c, s.a, ...c, s.a], i * 8);
        nR[i * 2] = nR[i * 2 + 1] = s.own.i;
      });
      // ---- Abdruck: dunklere Fläche im Bogen unter jedem Teil (färbt sich erst, wenn das Teil den Bogen verlässt) ----
      const holeOf = new Map();
      for (const h of holes) {
        if (h.nd.nocut) continue;
        const y = h.nd.own.lvl * EPS + .35 * EPS, pts = h.pts, n = pts.length;
        for (let k = 1; k < n - 1; k++) for (const p of [pts[0], pts[k], pts[k + 1]]) { tv.push(p[0], y, p[1]); tc.push(...HOLE); tn.push(h.nd.own.i); holeOf.set(tn.length - 1, h.nd); }
      }
      const restT = new Float32Array(tv), restL = new Float32Array(lv), nT = Int32Array.from(tn), nL = Int32Array.from(ln);
      const posT = new Float32Array(restT.length), posL = new Float32Array(restL.length);
      const baseL = Float32Array.from(lc), colL = Float32Array.from(lc);
      // Farbe der Teile: in Ruhe gleiches Papier wie der Bogen, die eigene Farbe kommt, wenn das Teil hochklappt
      const NTP = tn.length, baseC = Float32Array.from(tc), colT = Float32Array.from(tc);
      const geoT = new THREE.BufferGeometry(), geoL = new THREE.BufferGeometry(), geoR = new THREE.BufferGeometry();
      geoT.setAttribute("position", new THREE.BufferAttribute(posT, 3).setUsage(THREE.DynamicDrawUsage));
      geoT.setAttribute("aCol", new THREE.BufferAttribute(colT, 3).setUsage(THREE.DynamicDrawUsage));
      // Raster: Lage in der Ruhelage und Stärke je Ecke (1 im Bogen, geht weg, wenn das Teil den Bogen verlässt)
      const gT = new Float32Array(NTP).fill(1);
      geoT.setAttribute("aRest", new THREE.BufferAttribute(restT, 3));
      geoT.setAttribute("aG", new THREE.BufferAttribute(gT, 1).setUsage(THREE.DynamicDrawUsage));
      geoL.setAttribute("position", new THREE.BufferAttribute(posL, 3).setUsage(THREE.DynamicDrawUsage));
      geoL.setAttribute("aCol", new THREE.BufferAttribute(colL, 4).setUsage(THREE.DynamicDrawUsage));
      geoR.setAttribute("position", new THREE.BufferAttribute(posR, 3).setUsage(THREE.DynamicDrawUsage));
      geoR.setAttribute("aCol", new THREE.BufferAttribute(colR, 4).setUsage(THREE.DynamicDrawUsage));
      geoR.setAttribute("aP", new THREE.BufferAttribute(aP, 4));
      const xf = (rest, nid, out) => {
        for (let i = 0, j = 0; j < nid.length; j++, i += 3) {
          const M = nodes[nid[j]].M, x = rest[i], y = rest[i + 1], z = rest[i + 2];
          out[i] = M[0] * x + M[1] * y + M[2] * z + M[3]; out[i + 1] = M[4] * x + M[5] * y + M[6] * z + M[7]; out[i + 2] = M[8] * x + M[9] * y + M[10] * z + M[11];
        }
      };
      const m4 = new THREE.Matrix4();
      const nodeMat = (nd, out) => { const M = nd.M; return out.set(M[0], M[1], M[2], M[3], M[4], M[5], M[6], M[7], M[8], M[9], M[10], M[11], 0, 0, 0, 1); };
      // Bewegung relativ zur Elternfläche (mv) bzw. zur eigenen Fläche (mvo, nur mit F.edgeOwn)
      const mvOf = nd => edgeOwn ? nd.mvo : nd.mv;
      function solve(b, t) {
        for (const nd of nodes) {
          const M = nd.M;
          if (!nd.par) continue;
          const cv = nd.clock === "t" ? t : b, x = (cv - nd.t0) / nd.d;
          // Lauf: eigener (ease, shop) vor gleichmäßig (lin, schnittstellen) vor Rückprall (bounce, betreuung) vor Mechanik
          let w = nd.ease ? nd.ease(clamp(x, 0, 1)) : nd.lin ? linRun(x) : nd.bounce ? bounce(x, nd.bounce) : mech(x, nd.over);
          let mvv = clamp(x * 7, 0, 1);
          if (nd.dn) {
            // Zurückklappen (modernisierung): sanft hinunter, ohne Überschwingen; kurz vor dem Bogen gehen Haarkanten und Farbe weg
            const y = clamp((cv - nd.dn.t0) / nd.dn.d, 0, 1);
            w *= 1 - y * y * (3 - 2 * y);
            mvv *= 1 - clamp((y - .8) / .2, 0, 1);
          }
          // erneutes Aufstehen nach dem Zurückklappen (nd.re { t0, d }): zweite Hebung mit derselben Mechanik
          if (nd.re) w += mech((cv - nd.re.t0) / nd.re.d, nd.over);
          nd.mv = Math.max(nd.fresh ? 0 : nd.par.mv, mvv);
          nd.mvo = Math.max(nd.par === nd.own || !nd.par.par ? 0 : nd.par.mvo, mvv);
          if (nd.lift) { const m = nd.par.M, ty = nd.lift * w; for (let a = 0; a < 3; a++) { M[a * 4] = m[a * 4]; M[a * 4 + 1] = m[a * 4 + 1]; M[a * 4 + 2] = m[a * 4 + 2]; M[a * 4 + 3] = m[a * 4 + 1] * ty + m[a * 4 + 3]; } continue; }
          if (nd.slide) { const m = nd.par.M, [vx, vy, vz] = nd.slide; for (let a = 0; a < 3; a++) { const m0 = m[a * 4], m1 = m[a * 4 + 1], m2 = m[a * 4 + 2]; M[a * 4] = m0; M[a * 4 + 1] = m1; M[a * 4 + 2] = m2; M[a * 4 + 3] = (m0 * vx + m1 * vy + m2 * vz) * w + m[a * 4 + 3]; } continue; }
          // ang0 (stimmen): Startwinkel statt 0
          const th = nd.ang0 !== undefined ? nd.ang0 + (nd.ang - nd.ang0) * w : nd.ang * w;
          const c = Math.cos(th), sn = Math.sin(th), tt = 1 - c, [ax, ay, az] = nd.A, [px, py, pz] = nd.P;
          const r = [tt * ax * ax + c, tt * ax * ay - sn * az, tt * ax * az + sn * ay, tt * ax * ay + sn * az, tt * ay * ay + c, tt * ay * az - sn * ax, tt * ax * az - sn * ay, tt * ay * az + sn * ax, tt * az * az + c];
          const lt = [px - (r[0] * px + r[1] * py + r[2] * pz), py - (r[3] * px + r[4] * py + r[5] * pz), pz - (r[6] * px + r[7] * py + r[8] * pz)];
          const m = nd.par.M;
          for (let a = 0; a < 3; a++) {
            const m0 = m[a * 4], m1 = m[a * 4 + 1], m2 = m[a * 4 + 2];
            M[a * 4] = m0 * r[0] + m1 * r[3] + m2 * r[6];
            M[a * 4 + 1] = m0 * r[1] + m1 * r[4] + m2 * r[7];
            M[a * 4 + 2] = m0 * r[2] + m1 * r[5] + m2 * r[8];
            M[a * 4 + 3] = m0 * lt[0] + m1 * lt[1] + m2 * lt[2] + m[a * 4 + 3];
          }
        }
      }
      const geoG = gerOpts.length ? geruestAll() : null;
      let lastB = NaN, lastT = NaN;
      function update(b, t) {
        if (b === lastB && t === lastT) return false; lastB = b; lastT = t;
        solve(b, t);
        xf(restT, nT, posT); xf(restL, nL, posL); xf(restR, nR, posR);
        for (let j = 0; j < NTP; j++) { const hn = holeOf.get(j), nd = nodes[nT[j]]; if (nd === root && !hn) continue; const k = hn ? hn.mv : nd.mv; for (let c = 0; c < 3; c++) colT[j * 3 + c] = PAPER[c] + (baseC[j * 3 + c] - PAPER[c]) * k; if (!hn) gT[j] = 1 - k; }
        geoT.attributes.aCol.needsUpdate = true; geoT.attributes.aG.needsUpdate = true;
        // Haarkanten erst, wenn das Teil den Bogen verlässt
        for (let j = 0; j < nL.length; j++) { const nd = nodes[nL[j]]; colL[j * 4 + 3] = baseL[j * 4 + 3] * (nd === root ? 1 : mvOf(nd)); }
        // Bastellinien: Schnitt bleibt als Umriss des Abdrucks (heller), Falz verschwindet, Skizze nach ihrer Blende
        segs.forEach((s, i) => {
          let a = s.a;
          if (s.kind === "c") a *= 1 - .45 * mvOf(s.ch);
          else if (s.kind === "f") a *= 1 - mvOf(s.ch);
          else if (s.sk.fade) a *= s.sk.fade(b);
          colR[i * 8 + 3] = colR[i * 8 + 7] = a;
        });
        geoT.attributes.position.needsUpdate = true; geoL.attributes.position.needsUpdate = true; geoL.attributes.aCol.needsUpdate = true;
        geoR.attributes.position.needsUpdate = true; geoR.attributes.aCol.needsUpdate = true;
        for (const a of att) { nodeMat(a.nd, m4); a.obj.matrix.multiplyMatrices(m4, a.R); a.obj.matrixWorld.copy(a.obj.matrix); a.obj.matrixWorldNeedsUpdate = true; }
        return true;
      }
      // Umgrenzung eines Teils im aktuellen Zustand (für die Kamera); ohne Namen: alle Flächen außer dem Bogen
      function boxOf(name) {
        const bx = new THREE.Box3(), v = new THREE.Vector3();
        for (let j = 0; j < nT.length; j++) { const nd = nodes[nT[j]]; if (name === undefined ? nd !== root : nd.tag === name) bx.expandByPoint(v.set(posT[j * 3], posT[j * 3 + 1], posT[j * 3 + 2])); }
        return bx;
      }
      return { geoT, geoL, geoR, geoG, update, boxOf, att, nodeMat, parts, dbg: { holes, segs, nodes, polys, posT, nT } };

      // ---- Gerüst: Haarkanten des Endzustands, auf einer Geraden zusammengefasst, je Kante zwei bis drei Striche mit Überstand ----
      function geruestAll() {
        const acc = { pos: [], col: [], aP: [], aO: [], edges: [] };
        for (const o of gerOpts) geruestOf(o, acc);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(acc.pos, 3));
        geo.setAttribute("aCol", new THREE.Float32BufferAttribute(acc.col, 4));
        geo.setAttribute("aP", new THREE.Float32BufferAttribute(acc.aP, 4));
        geo.setAttribute("aO", new THREE.Float32BufferAttribute(acc.aO, 3));
        geo.userData = { edges: acc.edges, strokes: acc.pos.length / 6 };
        return geo;
      }
      function geruestOf(o, acc) {
        solve(o.bAt !== undefined ? o.bAt : 1, 1e9);
        const fin = new Float32Array(restL.length); xf(restL, nL, fin);
        solve(0, 0);
        // b, bei dem ein Knoten mit allen Eltern steht
        const done = nd => nd.par ? Math.max(nd.clock === "t" ? 0 : nd.t0 + nd.d, done(nd.par)) : 0;
        const raw = [];
        for (let j = 0; j < nL.length; j += 2) {
          const nd = nodes[nL[j]];
          if (nd === root || nd.clock === "t" || !o.tags.includes(nd.tag) || !(baseL[j * 4 + 3] > 0) || (o.filter && !o.filter(nd))) continue;
          const A = new THREE.Vector3(fin[j * 3], fin[j * 3 + 1], fin[j * 3 + 2]), B = new THREE.Vector3(fin[j * 3 + 3], fin[j * 3 + 4], fin[j * 3 + 5]);
          if (A.distanceTo(B) < .03) continue;
          raw.push({ A, B, f: done(nd) });
        }
        // Kanten auf einer Geraden, die sich berühren (Scharnier = Kante der Elternfläche), werden eine Linie
        const groups = [];
        for (const s of raw) {
          const d = s.B.clone().sub(s.A).normalize();
          const ax = Math.abs(d.x), ay = Math.abs(d.y), az = Math.abs(d.z), m = ax >= ay && ax >= az ? d.x : ay >= az ? d.y : d.z;
          if (m < 0) d.negate();
          let g = groups.find(g => g.d.dot(d) > .9995 && s.A.clone().sub(g.o).cross(g.d).length() < .004);
          if (!g) { g = { d, o: s.A.clone(), iv: [] }; groups.push(g); }
          const t0 = s.A.clone().sub(g.o).dot(g.d), t1 = s.B.clone().sub(g.o).dot(g.d);
          g.iv.push([Math.min(t0, t1), Math.max(t0, t1), s.f]);
        }
        const E = [];
        for (const g of groups) {
          g.iv.sort((a, b) => a[0] - b[0]);
          let cur = null;
          const put = c => { if (c[1] - c[0] > .05) E.push({ A: g.o.clone().addScaledVector(g.d, c[0]), B: g.o.clone().addScaledVector(g.d, c[1]), d: g.d, L: c[1] - c[0], f: c[2] }); };
          for (const iv of g.iv) {
            if (cur && iv[0] <= cur[1] + .02) { cur[1] = Math.max(cur[1], iv[1]); cur[2] = Math.max(cur[2], iv[2]); }
            else { if (cur) put(cur); cur = iv.slice(); }
          }
          if (cur) put(cur);
        }
        // Welle von links nach rechts, unten etwas früher
        const key = e => (e.A.x + e.B.x) / 2 + .15 * (e.A.y + e.B.y) / 2;
        E.sort((a, b) => key(a) - key(b));
        const rnd = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
        const { pos, col, aP, aO } = acc, n = E.length, du = o.du || .03, ink = o.col || INK, a0 = o.a || .5;
        const UPV = new THREE.Vector3(0, 1, 0), XV = new THREE.Vector3(1, 0, 0);
        const stroke = (A, B, d, ovA, ovB, st, d2, a, f) => {
          pos.push(A.x, A.y, A.z, B.x, B.y, B.z);
          aO.push(-d.x * ovA, -d.y * ovA, -d.z * ovA, d.x * ovB, d.y * ovB, d.z * ovB);
          aP.push(st, d2, 0, f, st, d2, 1, f);
          col.push(...ink, a, ...ink, a);
        };
        E.forEach((e, i) => {
          const st = o.t0 + (o.t1 - o.t0 - du * 1.9) * (n > 1 ? i / (n - 1) : 0);
          const n1 = new THREE.Vector3().crossVectors(e.d, Math.abs(e.d.y) < .9 ? UPV : XV).normalize(), n2 = new THREE.Vector3().crossVectors(e.d, n1);
          const ov = Math.min(.26, .09 + .07 * e.L);
          // Strich 1: die Kante selbst, über beide Ecken hinaus (ungleich lang, wie von Hand)
          stroke(e.A, e.B, e.d, ov * (.7 + .6 * rnd(i, 1)), ov * (.7 + .6 * rnd(i, 2)), st, du, a0, e.f);
          // Strich 2: gleichmäßiger kleiner Versatz, am Ende eine Spur weiter weg (leicht schräg), kürzerer Überstand, blasser, etwas später
          const off = .036 + .01 * rnd(i, 3);
          stroke(e.A.clone().addScaledVector(n1, off * .8).addScaledVector(n2, off * .4), e.B.clone().addScaledVector(n1, off * 1.15).addScaledVector(n2, off * .55), e.d,
            ov * (.35 + .3 * rnd(i, 4)), ov * (.35 + .3 * rnd(i, 5)), st + du * .45, du * .9, a0 * .55, e.f);
          // Strich 3 nur an langen Kanten: auf der anderen Seite, nicht ganz durchgezogen
          if (e.L > 1.2) {
            const A3 = e.A.clone().addScaledVector(e.d, e.L * (.06 + .06 * rnd(i, 6))).addScaledVector(n1, -.028).addScaledVector(n2, -.018);
            const B3 = e.B.clone().addScaledVector(e.d, -e.L * (.08 + .1 * rnd(i, 7))).addScaledVector(n1, -.03).addScaledVector(n2, -.02);
            stroke(A3, B3, e.d, 0, 0, st + du * .9, du, a0 * .32, e.f);
          }
        });
        acc.edges.push(...E);
      }
    }
  };
  return F;
}

// ---------- Bauteile ----------
export function kit(F) {
  const K = {};
  K.panel = (par, a, b, n, t0, d, ang = Q, opt) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    const nd = F.hinge(par, a, b, [a[0] + n[0], a[1] + n[1]], ang, t0, d, opt);
    nd.L = L; nd.dir = [ux, uz]; nd.n = n;
    nd.uv = (u, v) => [a[0] + ux * u + n[0] * v, a[1] + uz * u + n[1] * v];
    return nd;
  };
  K.P = (nd, uvs, col = PAPER, e = .5, dy = 0) => F.poly(nd, uvs.map(q => nd.uv(q[0], q[1])), col, e, dy);
  K.rect = (nd, u0, v0, u1, v1, col, e, dy) => K.P(nd, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], col, e, dy);
  // Faltschachtel: Wände klappen nach innen hoch, der Deckel hängt an der Oberkante der Rückwand.
  // Außenseite aller Wände und des Deckels: side -1. o.hf/o.hb: Höhe vorn/hinten (Keil), o.walls: Auswahl "fblr", o.open: ohne Deckel.
  // o.fresh bzw. o.mvOwn: Wände erben den Bewegungszustand der Elternfläche nicht (Teil auf einer Hubplatte)
  K.box = (par, x0, x1, z0, z1, h, t0, d, o = {}) => {
    const col = o.col || PAPER, D = z0 - z1, W = x1 - x0, tw = d * .55, ts = d * .12;
    const hf = o.hf || h, hb = o.hb || h, walls = o.walls || "fblr";
    const op = { own: o.own, over: o.over, fresh: !!(o.fresh || o.mvOwn) };
    const r = { W, D, hf, hb };
    if (walls.includes("f")) { r.fr = K.panel(par, [x0, z0], [x1, z0], [0, 1], t0, tw, Q, op); K.rect(r.fr, 0, 0, W, hf, o.fcol || col); }
    if (walls.includes("b")) { r.bk = K.panel(par, [x0, z1], [x1, z1], [0, -1], t0, tw, Q, op); K.rect(r.bk, 0, 0, W, hb, col); }
    if (walls.includes("l")) { r.lf = K.panel(par, [x0, z0], [x0, z1], [-1, 0], t0 + ts, tw, Q, op); K.P(r.lf, [[0, 0], [D, 0], [D, hb], [0, hf]], col); }
    if (walls.includes("r")) { r.rt = K.panel(par, [x1, z0], [x1, z1], [1, 0], t0 + ts, tw, Q, op); K.P(r.rt, [[0, 0], [D, 0], [D, hb], [0, hf]], col); }
    if (!o.open && r.bk) {
      const L = Math.hypot(D, hb - hf), ang = Q + Math.atan2(hb - hf, D);
      r.top = K.panel(r.bk, r.bk.uv(0, hb), r.bk.uv(W, hb), [0, -1], t0 + d * .5, d * .5, ang, op);
      K.rect(r.top, 0, 0, W, L, o.roof || col);
      r.topL = L;
    }
    return r;
  };
  // Platte, die sich parallel hebt, mit Randstreifen (o.walls aus "fblr"); liefert den Hubknoten
  K.slab = (par, x0, x1, z0, z1, h, t0, d, o = {}) => {
    // flache Platten (Rand unter .15): Randstreifen ohne eigene Bastellinien, sonst läge eine zweite Kontur dicht neben der ersten
    const walls = o.walls || "flr", col = o.col || PAPER, D = z0 - z1, W = x1 - x0, thin = h < .15, op = { own: o.own, over: o.over, nocut: thin, nofold: thin };
    if (walls.includes("f")) K.rect(K.panel(par, [x0, z0], [x1, z0], [0, 1], t0, d, Q, op), 0, 0, W, h, col);
    if (walls.includes("b")) K.rect(K.panel(par, [x0, z1], [x1, z1], [0, -1], t0, d, Q, op), 0, 0, W, h, col);
    if (walls.includes("l")) K.rect(K.panel(par, [x0, z0], [x0, z1], [-1, 0], t0, d, Q, op), 0, 0, D, h, col);
    if (walls.includes("r")) K.rect(K.panel(par, [x1, z0], [x1, z1], [1, 0], t0, d, Q, op), 0, 0, D, h, col);
    const L = F.lift(par, h, t0, d, { own: o.own, over: o.over !== undefined ? o.over : .04 });
    F.poly(L, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], o.top || col, .5);
    return L;
  };
  return K;
}
