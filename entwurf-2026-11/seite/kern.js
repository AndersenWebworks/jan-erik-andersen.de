// Durchgehende Startseite jan-erik-andersen.de, Fassung 2026-11 (entwurf-2026-11/seite/). Gemeinsamer Kern für alle Szenen.
// Grundlage: entwurf-2026-11/bogen/kern.js. Jede Szene ist ein Modul im bisherigen Format (default (K) => { keys, stops, track, … }),
// sie wird als Insel auf den gemeinsamen Boden gestellt (siehe layoutOf() und slotOf()). Die Kamera fährt eine vorab festgelegte, stetige Bahn, die dem roten Punkt am Faden
// folgt: zwischen den Szenen in Mausperspektive hinter dem Punkt, in den Szenen durch die Stützstellen aus kamera/<szene>.js (Ort und Blickziel relativ zum Punkt).
// Es gibt keine Karte und keine Draufsicht. Der Boden ist ein sehr großer Bogen, der zum Horizont in den Dunst ausläuft; weiche Schatten der Modelle (Tiefenkarte,
// shadowPass()); Farben von Dunst, Schatten und Licht an einer Stelle (PAL).
// Ein roter Faden mit Punkt läuft von der Eröffnung durch alle Szenen bis zum Kontakt-Umschlag.
//
// Zusammengeführt aus den Kern-Kopien der Szenen (Herkunft in Klammern):
// - K.add, K.paperMaterial, K.edgeMaterial, K.camera (abschluss, betreuung, modernisierung, schnittstellen)
// - K.link: klickbare Drucke per Raycast (abschluss)
// - K.word: opt.clock "b" (Lettern stehen beim Scrollen auf), opt.on, opt.over, Abdruck schließt nach b (abschluss io.closeB,
//   schnittstellen io.close), ohne close bleibt er (betreuung, modernisierung)
// - pr.sched(b): freie Deckkraft nach b (modernisierung)
// - Lesestellen am Zustand s.fb (modernisierung), s.face: vorgegebene Blickrichtung (stimmen)
// - Schlüssel mit slow: 1 bremsen wie Lesestellen (abschluss)
// - Faden mit lin: gleichmäßiger Lauf (werdegang)
// - Text läuft am Bildrand hinaus und blendet erst unter einem Viertel sichtbarer Fläche weich aus (schnittstellen); Gruppen (pr.grp) gemeinsam
// - Vorgabeszene „erste Variante“ (betreuung, gerwing, shop, werdegang) entfällt: die Seite hat keine Varianten mehr.
// Zustände: #p=0…1 (ganze Seite), #s=<szene> (Szenenanfang), Handy-Ausschnitt #…&w=390&h=844 (Prüfhilfe).
import * as THREE from "three";
import { SCHRIFTEN } from "./fonts/schriften.js";
import { BAHN, RIG } from "./stationen.js";
import { ladeMock } from "./mockup.js";
import { Model, kit, paperMaterial, edgeMaterial, rissMaterial, geruestMaterial, gridOn, frameOn, FAR, COL, PI, Q, EPS, clamp, sm, mech } from "./falt.js";
import { EffectComposer } from "./vendor/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "./vendor/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "./vendor/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "./vendor/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "./vendor/addons/postprocessing/SMAAPass.js";
import { Pass, FullScreenQuad } from "./vendor/addons/postprocessing/Pass.js";

// ---------- Nachbearbeitung (Palette „Mirror's Edge mit Papier“, Erik 22.10.) ----------
// Alle Stellschrauben an einer Stelle. Voll (Desktop): Umgebungsverdeckung (SSAO aus der Tiefe, halbe Auflösung) → Belichtung, kühle Abstimmung, Vignette →
// Tonemapping → SMAA. Leicht (Handy, schwache Grafik): nur Tonemapping und SMAA. Keine Tiefenunschärfe, keine Bewegungsunschärfe,
// keine chromatische Aberration, keine Linsenreflexe. Hash fx=aus|leicht|voll erzwingt eine Stufe (Prüfung).
const FX = {
  exposure: 1.2,                     // Belichtung nur in der leichten Stufe (Handy)
  lift: .45,                         // Überstrahlung (voll): helle Flächen werden um bis zu diesen Anteil angehoben (ab Helligkeit .5 weich zugeschaltet), Dunkles und Schrift bleiben
  tone: THREE.NeutralToneMapping,    // Khronos PBR Neutral: Farben (das Rot) bleiben, nur die Lichter werden weich zusammengeschoben
  aoStrength: .28, aoRadius: .3, aoBias: .02, aoFade: [45, 110], aoTint: [.50, .62, .84],     // Stärke, Radius (Welteinheiten), Bias, Ausblendung nach Ferne, Farbe der Verdeckung (bläulich)
  tint: [.99, 1.0, 1.025],           // kühle Abstimmung (Multiplikation im linearen Licht)
  vignette: .05                      // Abdunklung in den Ecken (Anteil), kaum sichtbar
};
const FSQ_VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
// Umgebungsverdeckung nur aus der Tiefe des Hauptbildes (kein zweiter Szenendurchlauf): Position im Blickraum aus der Tiefe, Normale aus den Nachbarn,
// 12 Proben in der Halbkugel, je Pixel gedreht; danach tiefenbewusstes Weichzeichnen und Mischung ins Bild.
class AOPass extends Pass {
  constructor(camera) {
    super();
    this.camera = camera; this.needsSwap = true;
    const mk = (frag, uniforms) => new THREE.ShaderMaterial({ uniforms, vertexShader: FSQ_VERT, fragmentShader: frag, depthTest: false, depthWrite: false });
    const kern = []; for (let i = 0; i < 12; i++) {
      const a = i * 2.399963, z = (i + .5) / 12, r = Math.sqrt(1 - z * z), s = .25 + .75 * Math.pow((i + 1) / 12, 2);
      kern.push(new THREE.Vector3(Math.cos(a) * r * s, Math.sin(a) * r * s, z * s));
    }
    this.aoMat = mk(`
      uniform sampler2D tDepth; uniform mat4 uProj; uniform mat4 uProjInv; uniform vec2 uTexel; uniform float uRadius; uniform float uBias; uniform vec3 uK[12];
      varying vec2 vUv;
      vec3 vp(vec2 uv) { float d = texture2D(tDepth, uv).r; vec4 c = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return c.xyz / c.w; }
      void main() {
        float d0 = texture2D(tDepth, vUv).r;
        if (d0 >= 0.99999) { gl_FragColor = vec4(1.0, 1e4, 0.0, 1.0); return; }
        vec3 P = vp(vUv);
        vec3 pr = vp(vUv + vec2(uTexel.x, 0.0)), pl = vp(vUv - vec2(uTexel.x, 0.0)), pu = vp(vUv + vec2(0.0, uTexel.y)), pd = vp(vUv - vec2(0.0, uTexel.y));
        vec3 dx = abs(pr.z - P.z) < abs(P.z - pl.z) ? pr - P : P - pl;
        vec3 dy = abs(pu.z - P.z) < abs(P.z - pd.z) ? pu - P : P - pd;
        vec3 N = normalize(cross(dx, dy)); if (dot(N, -P) < 0.0) N = -N;
        float ang = 6.2831853 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
        vec3 T0 = normalize(abs(N.y) < 0.9 ? cross(N, vec3(0.0, 1.0, 0.0)) : cross(N, vec3(1.0, 0.0, 0.0))), B0 = cross(N, T0);
        vec3 T = T0 * cos(ang) + B0 * sin(ang), B = cross(N, T);
        float occ = 0.0;
        for (int i = 0; i < 12; i++) {
          vec3 s = uK[i]; vec3 sp = P + (T * s.x + B * s.y + N * s.z) * uRadius;
          vec4 pc = uProj * vec4(sp, 1.0); vec2 suv = pc.xy / pc.w * 0.5 + 0.5;
          if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) continue;
          float sz = vp(suv).z;
          float range = smoothstep(0.0, 1.0, uRadius / max(abs(P.z - sz), 1e-4));
          occ += (sz >= sp.z + uBias * (1.0 + abs(P.z) * 0.02) ? 1.0 : 0.0) * range;
        }
        gl_FragColor = vec4(1.0 - occ / 12.0, -P.z, 0.0, 1.0);
      }`, { tDepth: { value: null }, uProj: { value: new THREE.Matrix4() }, uProjInv: { value: new THREE.Matrix4() }, uTexel: { value: new THREE.Vector2() }, uRadius: { value: FX.aoRadius }, uBias: { value: FX.aoBias }, uK: { value: kern } });
    this.blurMat = mk(`
      uniform sampler2D tAO; uniform vec2 uDir;
      varying vec2 vUv;
      void main() {
        vec2 c = texture2D(tAO, vUv).rg; float sum = 0.0, wsum = 0.0;
        for (int i = -3; i <= 3; i++) {
          vec2 s = texture2D(tAO, vUv + uDir * float(i)).rg;
          float w = exp(-float(i * i) / 5.0) * exp(-abs(s.g - c.g) / max(0.04 * c.g, 0.02));
          sum += s.r * w; wsum += w;
        }
        gl_FragColor = vec4(sum / wsum, c.g, 0.0, 1.0);
      }`, { tAO: { value: null }, uDir: { value: new THREE.Vector2() } });
    this.mixMat = mk(`
      uniform sampler2D tDiffuse; uniform sampler2D tAO; uniform float uStrength; uniform vec3 uTint; uniform vec2 uFade;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tDiffuse, vUv); vec2 a = texture2D(tAO, vUv).rg;
        float k = (1.0 - a.r) * uStrength * (1.0 - smoothstep(uFade.x, uFade.y, a.g));
        gl_FragColor = vec4(c.rgb * mix(vec3(1.0), uTint, clamp(k, 0.0, 1.0)), c.a);
      }`, { tDiffuse: { value: null }, tAO: { value: null }, uStrength: { value: FX.aoStrength }, uTint: { value: new THREE.Vector3(...FX.aoTint) }, uFade: { value: new THREE.Vector2(...FX.aoFade) } });
    this.fsq = new FullScreenQuad(this.aoMat);
    const o = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.rtA = new THREE.WebGLRenderTarget(1, 1, o); this.rtB = new THREE.WebGLRenderTarget(1, 1, o);
  }
  setSize(w, h) { this.rtA.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1)); this.rtB.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1)); }
  render(renderer, writeBuffer, readBuffer) {
    const cam = this.camera, f = this.fsq;
    this.aoMat.uniforms.tDepth.value = readBuffer.depthTexture;
    this.aoMat.uniforms.uProj.value.copy(cam.projectionMatrix); this.aoMat.uniforms.uProjInv.value.copy(cam.projectionMatrixInverse);
    this.aoMat.uniforms.uTexel.value.set(2 / readBuffer.width, 2 / readBuffer.height);
    f.material = this.aoMat; renderer.setRenderTarget(this.rtA); f.render(renderer);
    const tx = 1 / this.rtA.width, ty = 1 / this.rtA.height;
    this.blurMat.uniforms.tAO.value = this.rtA.texture; this.blurMat.uniforms.uDir.value.set(tx, 0);
    f.material = this.blurMat; renderer.setRenderTarget(this.rtB); f.render(renderer);
    this.blurMat.uniforms.tAO.value = this.rtB.texture; this.blurMat.uniforms.uDir.value.set(0, ty);
    renderer.setRenderTarget(this.rtA); f.render(renderer);
    this.mixMat.uniforms.tDiffuse.value = readBuffer.texture; this.mixMat.uniforms.tAO.value = this.rtA.texture;
    f.material = this.mixMat; renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); f.render(renderer);
  }
  dispose() { this.rtA.dispose(); this.rtB.dispose(); this.aoMat.dispose(); this.blurMat.dispose(); this.mixMat.dispose(); this.fsq.dispose(); }
}
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uLift: { value: FX.lift }, uTint: { value: new THREE.Vector3(...FX.tint) }, uVig: { value: FX.vignette } },
  vertexShader: FSQ_VERT,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uLift; uniform vec3 uTint; uniform float uVig; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float v = 1.0 - uVig * smoothstep(0.25, 0.75, length(vUv - 0.5));
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      gl_FragColor = vec4(c.rgb * (1.0 + uLift * smoothstep(0.5, 1.0, l)) * uTint * v, c.a);
    }`
};
function makePost(renderer, scene, camera, W, H, pr) {
  renderer.toneMapping = FX.tone;
  const dt = new THREE.DepthTexture(W * pr, H * pr); dt.type = THREE.UnsignedIntType;
  const rt = new THREE.WebGLRenderTarget(W * pr, H * pr, { type: THREE.HalfFloatType, depthTexture: dt, depthBuffer: true });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(pr); composer.setSize(W, H);
  const ao = new AOPass(camera), grade = new ShaderPass(GradeShader);
  const out = new OutputPass(), smaa = new SMAAPass(W * pr, H * pr);
  for (const p of [new RenderPass(scene, camera), ao, grade, out, smaa]) composer.addPass(p);
  const full = [ao, grade];
  let lastMode = "";
  return {
    composer,
    resize(w, h, ratio) { composer.setPixelRatio(ratio); composer.setSize(w, h); },
    // mode: "voll" | "leicht"
    draw(mode) {
      if (mode !== lastMode) { lastMode = mode; for (const p of full) p.enabled = mode === "voll"; renderer.toneMappingExposure = mode === "voll" ? 1 : FX.exposure; }
      composer.render();
    }
  };
}

const win = (b, t0, d) => clamp((b - t0) / d, 0, 1);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

function bytes(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
export async function loadFonts() {
  await Promise.all([["Newsreader", "Newsreader", "normal"], ["Newsreader Italic", "Newsreader", "italic"], ["Schibsted Grotesk", "Schibsted Grotesk", "normal"]].map(async ([key, fam, style]) => {
    const ff = new FontFace(fam, bytes(SCHRIFTEN[key]), { style });
    await ff.load(); document.fonts.add(ff);
  }));
  await ladeMock(import.meta.url).catch(e => console.warn("Mockup-Schriften:", e));
  // Marke N4: variable Newsreader aus der Seite (@font-face "Newsreader N4"), Gewichte 380 / 340 im Canvas
  await Promise.all(['380 120px "Newsreader N4"', 'italic 340 120px "Newsreader N4"'].map(f => document.fonts.load(f, "Jan-Erik Andersen"))).catch(() => {});
}
// Monotone kubische Interpolation (Fritsch–Carlson)
function pchip(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  if (n === 1) return () => ys[0];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-9, xs[i + 1] - xs[i]));
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
export function seite(renderer, SEQ, opt = {}) {
  // Renderschleife nur bei Bedarf (siehe frame()): pulse meldet den Puls des roten Punktes (einzige Daueranimation), wake() weckt die Schleife
  const pulse = { on: false }, PULSE_T = 1.4, _pulseP = new THREE.Vector3();
  let wake = () => {};
  const dbg = m => { if (typeof window !== "undefined" && window.__dbg) window.__dbg(m); };       // Diagnose (Hash "dbg"), siehe index.html
  dbg("Kern gestartet");
  const canvas = renderer.domElement;
  renderer.setClearColor(0xffffff, 1);
  renderer.localClippingEnabled = true;
  // ---------- Farben von Dunst, Schatten und Licht: alle an dieser einen Stelle (Palette „Mirror's Edge mit Papier“, Erik 22.10.) ----------
  // Die Papier- und Bauteilfarben selbst setzt nicht dieser Kern (falt.js, die Szenen); hier nur, was im Kern entsteht: Boden, Parzellenbogen, Raster, Dunst,
  // Hintergrund, Schatten und die Richtung des Lichts für die Schatten.
  const PAL = {
    hazeStart: "#ffffff",         // Dunst und Hintergrund am Startbild (wie das HTML-Vorbild)
    hazeNear: "#f3f8fd",          // Dunst der mittleren Ferne (ab den ersten Scrollschritten)
    hazeFar: "#dfedf9",           // Dunst am Horizont, zugleich Hintergrundfarbe: sehr helles Himmelblau, kein Himmel, keine Wolken
    shadow: "#d6e1ee",            // Schattenfarbe (bläulich): das Papier wird im Schatten mit ihr multipliziert
    shadowStrength: .5,          // Mischung zur Schattenfarbe im vollen Schatten (0 … 1)
    ground: "#e7edf4",            // Boden (Tisch) unter den Parzellen
    plate: "#f8fafd",             // Bogen jeder Parzelle
    gridInk: "#6a7584",           // Linienfarbe des Rasters am Boden
    gridMinor: .035, gridMajor: .07,     // Deckkraft der feinen Linien (alle 2 Einheiten) und der kräftigen (alle 10): nur noch ganz zart unter den Höhenlinien
    penumbra: 1.8,                // Weichzeichner der Schattenkante in Texeln der Schattenkarte (klein = klarer umrissen)
    light: [-.45, .8, .5]         // Richtung zum Licht (Welt), bestimmt die Richtung der Schatten
  };
  // Gemeinsame Uniforms aller Papier-Shader. uHaze/uHazeF: Dunstfarbe nah und fern, uSM/uSMM/uSMP: Schattenkarte (Tiefe aus Richtung des Lichts), ihre Matrix
  // Welt → Licht und (an, Texelgröße, Stärke, Bias), uShC: Schattenfarbe.
  const GROUND_C = new THREE.Color(PAL.ground), WHITE = new THREE.Color(PAL.hazeStart), hazeN = new THREE.Color(PAL.hazeNear), hazeF = new THREE.Color(PAL.hazeFar), hazeC = new THREE.Color(), hazeCF = new THREE.Color();
  const U = { haze: { value: new THREE.Vector3(1, 1, 1) }, hazeF: { value: new THREE.Vector3(1, 1, 1) }, sm: { value: null }, smm: { value: new THREE.Matrix4() },
    smp: { value: new THREE.Vector4(0, 1 / 1024, PAL.shadowStrength, .03) }, shc: { value: new THREE.Vector3() } };
  { const c = new THREE.Color(PAL.shadow); U.shc.value.set(c.r, c.g, c.b); }
  const SHADOW_GLSL = `
    uniform vec3 uHaze; uniform vec3 uHazeF; uniform vec3 uShC; uniform sampler2D uSM; uniform mat4 uSMM; uniform vec4 uSMP;
    // Dunstfarbe je Anteil f der Ferne (0 nah … 1 ganz im Dunst): von uHaze zu uHazeF
    vec3 hazeAt(float f) { return mix(uHaze, uHazeF, smoothstep(.45, 1.0, f)); }
    // weicher Schatten (Anteil 0 … 1) auf waagerechten Flächen: 12 gedrehte Proben der Tiefenkarte, Radius rund 5 Texel
    float shadowAmt(vec3 wp, vec3 n) {
      if (uSMP.x < .5 || n.y < .6) return 0.0;
      vec4 sp = uSMM * vec4(wp, 1.0); vec3 sc = sp.xyz / sp.w * .5 + .5;
      float e = min(min(sc.x, 1.0 - sc.x), min(sc.y, 1.0 - sc.y));
      if (e <= 0.0 || sc.z >= 1.0) return 0.0;
      float rot = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853, s = 0.0;
      for (int i = 0; i < 12; i++) {
        float r = sqrt((float(i) + .5) / 12.0), a = float(i) * 2.399963 + rot;
        float d = texture2D(uSM, sc.xy + vec2(cos(a), sin(a)) * r * ${PAL.penumbra.toFixed(2)} * uSMP.y).r;
        s += step(d, sc.z - uSMP.w);
      }
      return s / 12.0 * smoothstep(0.0, .06, e) * smoothstep(.2, .6, n.y);
    }
    // Farbe im Schatten: das Papier mal Schattenfarbe, gemischt nach Schattenanteil und Stärke
    vec3 shaded(vec3 c, float s) { return mix(c, c * uShC, s * uSMP.z); }`;
  // Papier-Shader der Szenen (falt.js) auf Dunstfarbe und Schatten umstellen: statt Weiß mischt die Ferne zu uHaze, Schatten dunkeln waagerechte Flächen ab
  function patchPaper(m) {
    if (!m || !m.isShaderMaterial || !m.fragmentShader || m.userData.hazed || m.fragmentShader.indexOf("mix(vec3(1.0), c, k)") < 0 || !m.uniforms || !m.uniforms.uFar) return;
    m.fragmentShader = SHADOW_GLSL + m.fragmentShader.replace("vec3 c = vCol * sh * ao;", "vec3 c = vCol * sh * ao;\n    c = shaded(c, shadowAmt(vW, n));").replace("mix(vec3(1.0), c, k)", "mix(hazeAt(1.0 - k), c, k)");
    m.uniforms.uHaze = U.haze; m.uniforms.uHazeF = U.hazeF; m.uniforms.uShC = U.shc; m.uniforms.uSM = U.sm; m.uniforms.uSMM = U.smm; m.uniforms.uSMP = U.smp;
    m.userData.hazed = true; m.needsUpdate = true;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 300);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const INK = "#303033", RED = "#d40235", IMPRINT = "#e1e4e9";

  // ---------- Druck (Canvas-Textur auf der Fläche) ----------
  // Auflösung der Drucke: buildScale 1 = volle Pixeldichte, kleiner = Canvas von Anfang an klein gezeichnet (Zeichnen unter ctx.scale, die Maße
  // der Drucke bleiben gleich), nie größer als 1024 px. Entfernte Szenen und die Karte zeigen kleine Drucke, nahe Szenen volle (setScale()).
  const SMALL = .25, SMALL_MAX = 1024;
  // Abstand der Drucke zur Fläche, auf der sie stehen: größer als die Staffelung der Papierebenen (EPS je Ebene, übereinander gestapelte Seiten eines Leporello),
  // sonst liegt der Druck hinter einer Nachbarebene und verschwindet im Raster der Tiefenprüfung (Z-Fighting: ausgefranste, halb verschwundene Schrift)
  const PRINT_LIFT = .014;
  let buildScale = 1;
  const PXEM = 120, MAXTEX = Math.min(4096, renderer.capabilities.maxTextureSize || 4096);
  const texOf = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  function printTex(lines, o = {}) {
    // Marke zweifach aufgelöst (bei Pixeldichte 2 bleiben Überschriften bis rund 120 px Schrift scharf); o.hi (nur die große Wortmarke
    // im Startbild) vierfach: dort bis rund 140 px Schrift. Vierfach überall ergab rund 300 MB Grafikspeicher und Kontextverlust (schwarzer Hintergrund, keine Drucke).
    let em = o.hi ? PXEM * 4 : o.font === "marke" ? PXEM * 2 : PXEM, lh = (o.lh || 1.3) * em;
    // o.font "marke": Wortmarke N4 (Newsreader variabel, aufrecht 380, kursiv 340, Laufweite -0,018 em)
    const mk = o.font === "marke";
    const fam = mk ? '"Newsreader N4", "Newsreader", serif' : o.font === "serif" ? '"Newsreader"' : '"Schibsted Grotesk"';
    const font = () => `${o.italic ? "italic " : ""}${mk ? (o.italic ? 340 : 380) : o.font === "serif" ? 300 : 500} ${em}px ${fam}`;
    if (mk && o.track === undefined) o = { ...o, track: -.018 };
    const sReq = o.scale !== undefined ? o.scale : buildScale;
    const cv = document.createElement("canvas"), x = cv.getContext("2d");
    const setF = () => { x.font = font(); if (o.track) x.letterSpacing = (o.track * em) + "px"; };
    setF();
    let padX = .16 * em, padY = .1 * em;
    // o.disc: Radius in em; statt Text eine Scheibe, deren Unterkante auf der Grundlinie sitzt (Schlusspunkt der Marke)
    const meas = () => o.disc ? [2 * o.disc * em] : lines.map(l => x.measureText(l).width);
    let ws = meas(), wMax = Math.max(...ws);
    // Kante der Leinwand begrenzen (Texturgrenze der Grafikkarte, höchstens 4096): Schrift entsprechend kleiner setzen
    if (wMax + padX * 2 > MAXTEX) { em *= MAXTEX / (wMax + padX * 2); lh = (o.lh || 1.3) * em; setF(); padX = .16 * em; padY = .1 * em; ws = meas(); wMax = Math.max(...ws); }
    const cvW = Math.min(MAXTEX, Math.ceil(wMax + padX * 2)), cvH = Math.ceil(padY * 2 + (lines.length - 1) * lh + em * 1.18);
    const sc = sReq < 1 ? Math.min(sReq, SMALL_MAX / Math.max(cvW, cvH)) : 1;
    cv.width = Math.max(1, Math.ceil(cvW * sc)); cv.height = Math.max(1, Math.ceil(cvH * sc));
    setF(); if (sc < 1) x.scale(cv.width / cvW, cv.height / cvH);
    x.fillStyle = o.col || INK; x.textBaseline = "alphabetic";
    // o.outline: nur die Kontur (Abdruck der Lettern als feine Schnittlinie im Bogen); mit o.fillCol zuerst eine zarte Füllung
    if (o.outline) { x.strokeStyle = o.col || INK; x.lineWidth = o.outline * em / PXEM; x.lineJoin = "round"; }
    const at = i => [padX + (o.align === "center" ? (wMax - ws[i]) / 2 : 0), padY + em * .94 + i * lh];
    if (o.disc) {
      const [ax, ay] = at(0), r = o.disc * em; x.beginPath(); x.arc(ax + r, ay - r, r, 0, 2 * PI);
      if (o.outline) { if (o.fillCol) { x.fillStyle = o.fillCol; x.fill(); } x.stroke(); } else x.fill();
    } else {
      if (o.outline && o.fillCol) { x.fillStyle = o.fillCol; lines.forEach((l, i) => x.fillText(l, ...at(i))); }
      lines.forEach((l, i) => x[o.outline ? "strokeText" : "fillText"](l, ...at(i)));
    }
    const h = cvH / em;
    return { tex: texOf(cv), w: cvW / em, h, padX: padX / em, padY: padY / em, tw: wMax / em, bfb: h - (padY / em + .94 + (lines.length - 1) * lh / em), rows: ws.map(v => v / em), lines };
  }

  // ---------- Ansicht ----------
  const hashQ = () => new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const fq = hashQ();
  let post = null, fxFailed = false;                              // Nachbearbeitung (makePost), siehe drawScene()
  const START_FULL = !fq.get("p") && !fq.get("s");                 // Szene 1 in voller Auflösung bauen, nur wenn die Seite vorn beginnt
  const FORCE = fq.get("w") && fq.get("h") ? { w: +fq.get("w"), h: +fq.get("h") } : null;
  const VW = () => FORCE ? FORCE.w : innerWidth, VH = () => FORCE ? Math.min(FORCE.h, innerHeight) : innerHeight;
  let aspect = VW() / VH(), narrow = aspect < 1;
  const fovOf = () => narrow ? 44 : 32;                              // Sichtfeld überall gleich (kein Zoom über die Brennweite)

  // ---------- Szenen ----------
  const links3 = [];
  let INST = [], SEGS = [], ANCH = [], TOTAL = 1, thread = null;

  function newInstance(cfg, idx) {
    return { cfg, idx, name: cfg.name, built: false, O: V(), rot: 0, M4: new THREE.Matrix4(), R4: new THREE.Matrix4(), fp: null, tStart: undefined, parked: false, lastKey: "" };
  }

  // Planung je Szene (hängt von der Fenstergröße ab, weil die Lesestellungen es tun): Stationen, Szenenlauf, Zeitplan, Haltestellungen, Faden, Kameraspur
  function plan(I) {
    if (I.cfg.keyed) buildPath(I);
    if (!I.cfg.keyed) { const ob = obstaclesOf(I); const fz = pickN(I.cfg.lane); I.laneZ = fz !== undefined ? fz : ob.length ? Math.min(I.disc.cz + I.disc.R - 4, Math.max(...ob.map(b => b.max.z)) + 1.1) : undefined; }
    I.stations = I.cfg.keyed ? [] : stationsOf(I);
    I.route = routeFor(I);
    // zweiter Durchgang: Stationen auf den nächsten Punkt des geglätteten Laufs setzen, Lesestellung dafür neu anpassen, Lauf erneut rechnen
    if (!I.cfg.keyed && I.stations.some(o => o.d > .4)) {
      const obsU = obstaclesOf(I);
      for (const o of I.stations) {
        if (o.d <= .4 || o.same) continue;
        const q = I.route.at(o.s), s0 = o.stop, keepNear = s0.near; s0.near = [q.x, q.z];
        const fit = readingFit(I, s0, obsU, obsU);
        s0.near = keepNear;
        if (fit && Math.hypot(fit.p[0] - q.x, fit.p[1] - q.z) < 1.2) { o.p = fit.p; o.how = fit.how + " (2)"; s0.fitPose = { cam: fit.cam, tgt: fit.tgt, px: fit.px }; }
        else { o.p = [q.x, q.z]; o.how = "auf dem Lauf"; }
      }
      for (let k = 1; k < I.stations.length; k++) if (I.stations[k].same) I.stations[k].p = I.stations[k - 1].p;
      I.route = routeFor(I);
    }
    I.tl = timeline(I); I.lenNeed = I.tl.lenNeed;
    // jede Lesestellung an die tatsächliche Lage des Punktes in der Mitte ihres Haltefensters anpassen (feste Station)
    if (!I.cfg.keyed) {
      const obsU = obstaclesOf(I);
      for (const a of I.tl.an) {
        if (a.kind !== "text" || a.h0 === undefined) continue;
        const q = I.route.at(I.tl.sAt((a.h0 + a.h1) / 2)), st0 = a.stop; st0.fixP = [q.x, q.z];
        let obsB = obsU; if (I.sb) { let bs = I.sb.steps[0]; for (const t of I.sb.steps) if (Math.abs(t.b - st0.b) < Math.abs(bs.b - st0.b)) bs = t; obsB = [...bs.list, ...I.sb.extra].filter(b => !b.isEmpty() && b.max.y > .12 && (b.max.x - b.min.x) * (b.max.z - b.min.z) < 400); }
        const fit = readingFit(I, st0, [], obsB); st0.fixP = null;
        if (fit) st0.fitPose = { cam: fit.cam, tgt: fit.tgt, px: fit.px };
      }
    }
    buildThreadFor(I);
    for (const j of [I.idx - 1, I.idx, I.idx + 1]) if (INST[j] && INST[j].built && INST[j].tl) computeChunk(j);
  }
  // alle Szenen gebaut: Füllung am Fluss, Wortmarke, Höhenlinien
  function allBuilt() {
    try { buildFiller(); } catch (e) { console.error("Füllung:", e); }
  }
  // Eine Szene bauen: Modul ausführen, Faltmodell abschließen, Drucke und Netze in die Gruppe der Szene hängen
  function build(I) {
    const cfg = I.cfg;
    const group = new THREE.Group(); scene.add(group);
    const prints = [], anims = [], sheets = [], sheetBox = [], bMats = [], mats = [];
    const rissMat = rissMaterial();
    const add = o => { group.add(o); return o; };
    function mkPrint(lines, e, on, o = {}) {
      const sc = o.scale !== undefined ? o.scale : buildScale, t = printTex(lines, o);
      const mat = new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const w = t.w * e, h = t.h * e;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.renderOrder = 3; mesh.frustumCulled = false; group.add(mesh);
      const pr = { mesh, mat, on, e, w, h, t, map: t.tex, sc, mk: sx => printTex(lines, { ...o, scale: sx }).tex.image, fade: o.fade || .02, off: o.off, grp: o.grp, fnt: o.font || "grotesk", I };
      prints.push(pr); return pr;
    }
    function mkDecal(wpx, hpx, draw, w, h, on, fade = .025) {
      const decalCv = sx => {
        const cv = document.createElement("canvas"), sc2 = sx < 1 ? Math.min(sx, SMALL_MAX / Math.max(wpx, hpx)) : 1;
        cv.width = Math.max(1, Math.ceil(wpx * sc2)); cv.height = Math.max(1, Math.ceil(hpx * sc2));
        const x = cv.getContext("2d"); if (sc2 < 1) x.scale(cv.width / wpx, cv.height / hpx);
        draw(x, wpx, hpx); return cv;
      }, sc = buildScale;
      const mat = new THREE.MeshBasicMaterial({ map: texOf(decalCv(sc)), transparent: true, opacity: on < 0 ? 1 : 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.renderOrder = 2; mesh.frustumCulled = false; group.add(mesh);
      const pr = { mesh, mat, on, e: 1, w, h, map: mat.map, sc, mk: decalCv, fade, I };
      prints.push(pr); return pr;
    }
    const F = Model(), K = kit(F), R = F.root;
    Object.assign(K, {
      F, R, THREE, V, COL, PI, Q, EPS, sm, mech, win, clamp, narrow,
      anim: fn => anims.push(fn), add, paperMaterial, edgeMaterial, camera,
      print: mkPrint, decal: mkDecal,
      // Klickbarer Druck (Raycast auf die Fläche des Drucks): Kontaktwege bleiben echte Links, zusätzlich als HTML-Links im Dokument
      link(pr, href) { links3.push({ pr, href, I }); return pr; },
      measure(lines, o = {}) { const t = printTex(lines, { ...o, scale: .02 }); t.tex.dispose(); return t; },
      // Druck auf eine Fläche K.panel: Mitte bei (u entlang des Scharniers, v vom Scharnier weg); side wie bei F.attach
      onPanel(nd, pr, u, v, side = 1, q = null, lift = PRINT_LIFT) { F.attach(nd, pr.mesh, nd.uv(u, v), q || nd.n, side, lift); return pr; },
      // Druck flach auf eine waagerechte Fläche (Bogen, Hubplatte), liest sich von vorn (+z)
      onFlat(nd, pr, x, z, lift = .002) { F.attach(nd, pr.mesh, [x, z], [0, -1], 1, lift); return pr; },
      // Lettern: Zeile steht aus dem Bogen auf (Scharnier an der Grundlinie), im Bogen bleibt ihr Abdruck.
      // x: linke Kante der Schrift, zb: Grundlinie im Bogen. opt.clock "t" (Vorgabe): nach der Zeit seit dem Eintreffen der Szene,
      // "b": beim Scrollen (t0, d in b). opt.on blendet die Lettern erst ab b ein. opt.foot: Grundlinie genau auf dem Scharnier;
      // opt.imprint { fill, col, line, close, closeDur, closeB, slit }: Abdruck als zarte Schnittkante; er schließt sich
      // bei clock "t" nach io.close Sekunden, bei clock "b" um io.closeB (abschluss) bzw. .012 (schnittstellen, io.close gesetzt) nach dem Aufstehen,
      // ohne close bleibt er stehen (betreuung, modernisierung)
      word(lines, e, x, zb, t0, d, o = {}) {
        const io = o.imprint, ck = o.clock || "t", on0 = o.on !== undefined ? o.on : -1;
        const pr = mkPrint(lines, e, on0, o), im = o.noImprint ? null : mkPrint(lines, e, on0, io ? { ...o, col: io.col, fillCol: io.fill, outline: io.line } : { ...o, col: IMPRINT });
        // heller Abdruck: Textur vormultipliert, sonst mischen die transparenten (schwarzen) Randpixel beim Verkleinern dunkle Säume ein
        if (io && im) { im.t.tex.premultiplyAlpha = true; Object.assign(im.mat, { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }); }
        const W = pr.t.tw * e, base = o.base !== undefined ? o.base : o.foot ? 0 : .2 * e;     // o.base: Abstand der Grundlinie über dem Scharnier (Unterlängen bleiben über dem Papier)
        if (io && im) {
          if (ck === "t") { if (io.close !== undefined) { im.tOff = t0 + d + io.close; im.tDur = io.closeDur || .7; } }
          else if (io.closeB !== undefined) im.off = t0 + d + io.closeB;
          else if (io.close !== undefined) im.off = t0 + d + .012;
        }
        if (io && io.slit) F.line(o.par || R, [x - .015, zb], [x + W + .015, zb], io.slit, COL.INK, .0009);
        if (o.fold) { // Falzlinie N4: gestrichelt, über Anfang und Ende hinaus, im Bogen auf der Fußlinie. fold: { x0, len, lw, dash, gap, col } in Welteinheiten
          const f = o.fold, wpx = 2400, hpx = 24, k = wpx / f.len;
          const fd = mkDecal(wpx, hpx, (c, cw, ch) => { c.strokeStyle = f.col; c.lineWidth = f.lw * k; c.setLineDash([f.dash * k, f.gap * k]); c.beginPath(); c.moveTo(0, ch / 2); c.lineTo(cw, ch / 2); c.stroke(); }, f.len, f.len * hpx / wpx, -1);
          F.attach(o.par || R, fd.mesh, [x + f.x0 + f.len / 2, zb], [0, -1], 1, .0007);
        }
        const L = K.panel(o.par || R, [x, zb], [x + W, zb], [0, -1], t0, d, o.ang || Q, { clock: ck, nocut: 1, nofold: 1, over: o.over !== undefined ? o.over : .07 });
        const u = (pr.w / 2 - pr.t.padX * e), v = base + (pr.h / 2 - pr.t.bfb * e);
        F.attach(L, pr.mesh, L.uv(u, v), [0, -1], 1, .0015);
        if (im) F.attach(o.par || R, im.mesh, L.uv(u, v), [0, -1], 1, .0006);
        pr.W = W; pr.node = L;
        return pr;
      },
      // Statuspunkt: rote Scheibe, tickt im festen Takt, kein Schein
      ticker(nd, r, p, q, side, on) {
        const g = new THREE.Group();
        const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
        const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.55, r * 1.75, 40), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
        ring.position.z = .0005; g.add(m, ring); add(g);
        F.attach(nd, g, p, q, side, .004);
        anims.push((b, t) => {
          const k = win(b, on, .02); g.visible = k > 0; m.scale.setScalar(sm(k));
          // Daueranimation nur melden, wenn der Punkt voll da ist und im Bild steht (sonst darf die Schleife ruhen)
          if (k >= 1) { _pulseP.setFromMatrixPosition(m.matrixWorld).project(camera); if (_pulseP.z < 1 && Math.abs(_pulseP.x) < 1.3 && Math.abs(_pulseP.y) < 1.3) pulse.on = true; }
          const ph = (t % PULSE_T) / PULSE_T, beat = ph < .12 ? Math.sin(ph / .12 * PI) : 0;
          if (k >= 1) m.scale.setScalar(1 + .18 * beat);
          ring.material.opacity = k >= 1 ? .55 * (1 - ph) * (ph < .7 ? 1 : 0) : 0;
          ring.scale.setScalar(1 + ph * .9);
        });
        return g;
      },
      // Kabel aus Papier, zieht sich von seinem Anfang aus
      cable(pts, r, col, t0, d) {
        const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5);
        const TS = 140, RS = 10, geo = new THREE.TubeGeometry(curve, TS, r, RS, false);
        const mesh = add(new THREE.Mesh(geo, paperMaterial(col)));
        anims.push(b => { const k = sm(win(b, t0, d)); geo.setDrawRange(0, Math.floor(k * TS) * RS * 6); mesh.visible = k > 0; });
        return mesh;
      },
      // Bogen: dünne Papierplatte, Oberseite y = 0, feine Haarkante
      sheet(x0, x1, z0, z1, col = "#f5f8fd", from = -1) {
        const g = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .03, z1 - z0), paperMaterial(col));
        g.position.set((x0 + x1) / 2, -.0152, (z0 + z1) / 2);
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(g.geometry), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .32, depthWrite: false }));
        g.add(e); add(g); sheets.push(g); sheetBox.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]);
        if (from >= 0) anims.push(b => { g.visible = b >= from; });
        return g;
      }
    });
    buildScale = I.idx === 0 && START_FULL ? 1 : SMALL; I.lodSmall = buildScale < 1;
    const def = cfg.mod(K, cfg.modOpt);
    buildScale = 1;
    const M = F.finish();
    const mesh = add(new THREE.Mesh(M.geoT, paperMaterial()));
    const lines = add(new THREE.LineSegments(M.geoL, edgeMaterial()));
    const riss = add(new THREE.LineSegments(M.geoR, rissMat));
    for (const o of [mesh, lines, riss]) o.frustumCulled = false;
    mesh.renderOrder = 0; lines.renderOrder = 1; riss.renderOrder = 1;
    // Konstruktionsphase: Raster auf dem Bogen und den liegenden Teilen (def.grid bzw. cfg.grid), Gerüst im Raum (F.geruest)
    const grid = cfg.grid !== undefined ? cfg.grid : def.grid;
    if (grid) { gridOn(mesh.material, true, grid); bMats.push(mesh.material); for (const g of sheets) { gridOn(g.material, false, grid); bMats.push(g.material); } }
    if (M.geoG) { const gm = geruestMaterial(), gl = add(new THREE.LineSegments(M.geoG, gm)); gl.frustumCulled = false; gl.renderOrder = 1; bMats.push(gm); I.gerLine = gl; }
    bMats.push(rissMat);
    I.buildLines = [riss]; if (I.gerLine) I.buildLines.push(I.gerLine);        // Bastel- und Gerüstlinien: nur in der eigenen Szene sichtbar
    // Schlüssel: Ausschnitt aus der Bahn der Szene (cfg.keys), erster Schlüssel ohne Vorlauf. Die Schlüssel tragen nur noch den Bauzustand (b) und die Lesestellen;
    // die Kamera kommt aus der Spur der Seite (computeChunk), nur die Eröffnung (cfg.keyed) fährt bis zum Tablett ihre eigenen Schlüssel.
    def.allKeys = def.keys;
    def.keys = (cfg.keys ? cfg.keys(def) : def.keys).map((k, i) => i === 0 ? { ...k, w: 0 } : k);
    Object.assign(I, { group, lines, prints, anims, sheets, sheetBox, bMats, rissMat, F, K, M, def, built: true });
    if (cfg.stops) { let n = 0; const seen = new Set(); for (const k of def.keys) if (k.stop && !seen.has(k.stop)) { seen.add(k.stop); n++; const ov = cfg.stops[n]; if (!ov) continue; const o = { ...ov, ...((narrow ? ov.n : ov.d) || {}) }; if (o.pose) Object.assign(k.stop, o.pose); if (o.at) k.stop.at = o.at; if (o.near) k.stop.near = o.near; if (o.nearR !== undefined) k.stop.nearR = o.nearR; if (o.hold !== undefined) k.stop.hold = o.hold; } }
    prep(I);
    I.b0 = clamp(def.bOfU(0), 0, 1);
    I.bMax = cfg.bMax !== undefined ? cfg.bMax : 1;
    I.bLast = I.bMax;
    // Ausschnitt: Szenen, die nur einen Teil eines Bogens zeigen (abschluss), oder deren Bogen weit nach hinten reicht (stimmen)
    I.clip = cfg.clip || null;
    I.fcfg = typeof cfg.faden === "function" ? cfg.faden(def, I) : cfg.faden || null;                      // Wegpunkte und Ausnahmen des Fadens (Szenenkoordinaten)
    I.sb = stateBoxes(I, 24);                                            // Umgrenzungen je Zustand (Szenenkoordinaten, die Gruppe steht noch am Ursprung)
    placeScene(I);
    group.position.copy(I.O); group.rotation.y = I.rot; group.updateMatrixWorld(true);
    I.boxes = partBoxes(I);
    // Ausschnitt für Materialien ohne eigenen Shader: Ebenen in Szenenkoordinaten, mit der Gruppe in die Welt gedreht
    const planes = I.clip ? [
      new THREE.Plane(V(1, 0, 0), -I.clip[0]), new THREE.Plane(V(-1, 0, 0), I.clip[1]),
      new THREE.Plane(V(0, 0, 1), -I.clip[2]), new THREE.Plane(V(0, 0, -1), I.clip[3])].map(pl => pl.applyMatrix4(group.matrixWorld)) : null;
    group.traverse(o => {
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) { if (!frameOn(m, I.O, I.clip, I.rot) && planes) m.clippingPlanes = planes; patchPaper(m); }
    });
    I.shadowPlanes = planes;
    I.mesh = mesh; mesh.layers.enable(1 + I.idx);                             // Schattenwerfer: das Modell der Szene (Ebene 1 + Nummer der Szene, siehe shadowPass())
    fitSheets(I, group, sheets, sheetBox);
    I.ext = extentOf(I);
    // Dunst je Szene: eigene Grenzen (I.far), damit Nachbarszenen aus dem Dunst auftauchen und nicht im Hintergrund stehen (applyState)
    I.far = new THREE.Vector2(FAR.x, FAR.y); I.farS = new THREE.Vector2(FAR.x, FAR.y); I.farP = new THREE.Vector2(FAR.x, FAR.y);       // farS: die Bögen (Karten) bleiben länger sichtbar als stehende Teile
    group.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.uniforms && m.uniforms.uFar) m.uniforms.uFar = { value: I.farP }; });
    for (const sh of sheets) if (sh.material.uniforms && sh.material.uniforms.uFar) sh.material.uniforms.uFar = { value: I.farS };
    I.M.update(I.b0, 0); I.curB = I.b0; I.curT = 0;
    plan(I);
    dbg("Szene " + (I.idx + 1) + " " + I.name + " gebaut");
    try { updateTable(); } catch (e) { console.error("Boden:", e); }
    group.visible = false;
    if (INST.every(X => X.built)) allBuilt();
    return I;
  }

  // ---------- Bahn je Szene ----------
  // Endstellung durchrechnen: Mitte, Normale, Leserichtung und Geviert der Drucke jeder Lesestelle (Szenenkoordinaten)
  function frameOf(s) {
    const v = V(), pts = [];
    for (const pr of s.prints) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pts.push(v.set(sx * pr.w / 2, sy * pr.h / 2, 0).applyMatrix4(pr.mesh.matrix).clone());
    const m = s.prints[0].mesh.matrix;
    s.pts = pts;                                                      // Ecken aller Drucke (Szenenkoordinaten), für die Lage des Punktes an der Lesestelle (routeFor)
    // Mitte, Normale und Schriftgröße je Textdruck im Lesezustand (Schräge und Schrift je Druck, readingFit)
    s.prT = s.prints.filter(pr => pr.t && pr.t.rows).map(pr => ({ c: V().setFromMatrixPosition(pr.mesh.matrix), n: V().setFromMatrixColumn(pr.mesh.matrix, 2).normalize(), e: pr.e }));
    s.C = pts.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / pts.length);
    s.N = V().setFromMatrixColumn(m, 2).normalize(); s.Y = V().setFromMatrixColumn(m, 1).normalize();
    // Schriftgröße der Lesestellung bemisst sich am größten Druck (Vorgabe) bzw. am kleinsten Text (minE, alle frontalen Lesestellen): dann hat auch die kleinste Zeile die verlangte Größe
    const te = s.prints.filter(pr => pr.t && pr.t.rows).map(pr => pr.e);
    s.e = s.e0 || ((s.minE || s.frontal) && te.length ? Math.min(...te) : Math.max(...s.prints.map(pr => pr.e)));
    s.wm = Math.max(...pts.map(p => p.clone().sub(s.C).dot(V().setFromMatrixColumn(m, 0).normalize()))) * 2;
    if (s.b === undefined) s.b = Math.max(...s.prints.map(pr => pr.on)) + .03;
  }
  function prep(I) {
    const def = I.def;
    // Lesestelle am Zustand s.fb (Vorgabe: fertiges Modell, b = 1); Teile, die später wieder zuklappen, brauchen ein früheres fb
    for (const s of def.stops) { I.M.update(s.fb !== undefined ? s.fb : 1, 1e9); frameOf(s); }
    for (const k of def.keys) if (k.fromStop && !def.stops.includes(k.fromStop)) { I.M.update(1, 1e9); frameOf(k.fromStop); }
    I.M.update(0, 0);
    let acc = 0; const tot = def.keys.reduce((a, k) => a + k.w, 0) || 1;
    for (const k of def.keys) { acc += k.w; k.u = acc / tot; if (k.stop) k.b = k.stop.b; }
    const keyU = def.keys.map(k => k.u);
    def.bOfU = pchip(keyU, def.keys.map(k => k.b));
    def.idxOfU = pchip(keyU, def.keys.map((k, i) => i));
    // Zeit: keine Bremsen. Die Schlüssel liegen in buildPath() (retime) so in der Zeit, dass die Kamera mit annähernd gleichem Tempo
    // durch alle Stellungen fährt; an Lesestellen nimmt das Tempo nur weich bis TEMPO_F ab (applyWarp), an Szenenrändern gar nicht.
    applyWarp(def);
    // Anteil Fahrt (0 an einer Lesestelle, 1 auf freier Strecke): dämpft nur den Atem der Kamera an Lesestellen, nicht die Fahrt
    const BW = def.warpW || .028;
    def.travel = u => {
      const ks = def.keys; let m = 0;
      for (let i = 0; i < ks.length; i++) { const k = ks[i]; if (((k.stop || k.slow) && !k.noWarp) || i === 0 || i === ks.length - 1) m = Math.max(m, Math.exp(-(((u - k.u) / BW) ** 2))); }
      return clamp(1 - m, 0, 1);
    };
  }
  // Weicher Tempoabfall an Lesestellen (und Schlüsseln mit slow): das Tempo sinkt dort nie unter TEMPO_F des Tempos auf freier Strecke
  // (Glocke, ohne Einrasten und Stillstand), übers Bild gerechnet daher noch höher als TEMPO_F der mittleren Szenengeschwindigkeit.
  const TEMPO_F = .6;
  function applyWarp(def) {
    if (def.noWarp) { def.pOfU = u => clamp(u, 0, 1); def.uOfP = p => clamp(p, 0, 1); return; }
    const ks = def.keys, NW = 3000, BW = def.warpW || .028, F = TEMPO_F;
    const su = ks.filter(k => (k.stop || k.slow) && !k.noWarp).map(k => k.u);
    const sp = u => { let m = 0; for (const c of su) m = Math.max(m, Math.exp(-(((u - c) / BW) ** 2))); return 1 - (1 - F) * m; };
    const warpP = new Float64Array(NW + 1); let T = 0;
    for (let i = 0; i < NW; i++) T += 1 / sp((i + .5) / NW) / NW;
    let a2 = 0; for (let i = 0; i < NW; i++) { a2 += 1 / sp((i + .5) / NW) / NW; warpP[i + 1] = a2 / T; }
    def.pOfU = u => { const f = clamp(u, 0, 1) * NW, i = Math.min(NW - 1, Math.floor(f)); return warpP[i] + (warpP[i + 1] - warpP[i]) * (f - i); };
    def.uOfP = p => {
      if (p <= 0) return 0; if (p >= 1) return 1;
      let lo = 0, hi = NW;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (warpP[mid] < p) lo = mid; else hi = mid; }
      return (lo + (p - warpP[lo]) / (warpP[hi] - warpP[lo])) / NW;
    };
  }
  // Schlüssel in der Zeit (Abschnitt 0 … 1): die Dauer zwischen zwei Schlüsseln folgt dem Weg (Ort plus Blickdrehung) der Bahn dazwischen,
  // damit das Tempo durch die Lesestellungen gleich bleibt. Gemischt mit der Vorgabe w (RETIME_B Weganteil), mit Untergrenze (RETIME_MIN
  // Anteil von w), damit Teile, die sich bei stehender Kamera aufbauen, nicht in einem Zug springen.
  const RETIME_B = .85, RETIME_MIN = .2, RETIME_R = 10;
  function retime(I) {
    const def = I.def, ks = def.keys, n = ks.length; if (n < 2) return;
    const SUB = 24, tot = (n - 1) * SUB, cum = new Float64Array(tot + 1);
    const c0 = V(), c1 = V(), g0 = V(), g1 = V(), d0 = V(), d1 = V();
    I.camC.getPoint(0, c0); I.tgtC.getPoint(0, g0); d0.subVectors(g0, c0).normalize();
    for (let j = 1; j <= tot; j++) {
      const t = j / tot; I.camC.getPoint(t, c1); I.tgtC.getPoint(t, g1); d1.subVectors(g1, c1).normalize();
      cum[j] = cum[j - 1] + c1.distanceTo(c0) + RETIME_R * Math.acos(clamp(d1.dot(d0), -1, 1));
      c0.copy(c1); d0.copy(d1);
    }
    // Haltepunkte (k.hold in vh, Folgefahrt): feste Dauer, keine Bewegung; die Fahrt zwischen den Schlüsseln füllt den Rest der Szene
    const lenVh = I.cfg.len[narrow ? "n" : "d"], isH = i => !!ks[i].hold;
    const rb = I.cfg.retimeB !== undefined ? I.cfg.retimeB : RETIME_B;
    const sw = ks.reduce((a, k, i) => a + (i && !isH(i) ? k.w : 0), 0) || 1, sm = cum[tot] || 1, dur = [0];
    for (let i = 1; i < n; i++) { if (isH(i)) { dur.push(0); continue; } const a = ks[i].w / sw, m = (cum[i * SUB] - cum[(i - 1) * SUB]) / sm; dur.push(Math.max(RETIME_MIN * a, (1 - rb) * a + rb * m)); }
    {
      let hs = ks.reduce((a, k, i) => a + (isH(i) ? k.hold / lenVh : 0), 0); const hf = hs > .8 ? .8 / hs : 1;
      if (hf < 1) console.warn("Haltezeiten zu lang für die Szene", I.name, (hs * lenVh).toFixed(0), "von", lenVh, "vh");
      hs *= hf; I.holdShare = hs;
      const sd = dur.reduce((a, b) => a + b, 0) || 1; let acc = 0;
      ks.forEach((k, i) => { acc += isH(i) ? k.hold / lenVh * hf : dur[i] / sd * (1 - hs); k.u = acc; });
      const kU = ks[n - 1].u; ks.forEach(k => { k.u /= kU; });
    }
    const keyU = ks.map(k => k.u), keyS = ks.map((k, i) => cum[i * SUB]);
    def.bOfU = pchip(keyU, ks.map(k => k.b));
    const sOfU = pchip(keyU, keyS);
    const tOfS = s => {
      if (s <= 0) return 0; if (s >= cum[tot]) return 1;
      let lo = 0, hi = tot; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
      return (lo + (s - cum[lo]) / Math.max(1e-12, cum[hi] - cum[lo])) / tot;
    };
    def.idxOfU = u => tOfS(sOfU(u)) * (n - 1);
    applyWarp(def);
  }
  // Lesestellung aus der Textfläche (Vorlage readingPose() in Raumtext 2): Blickrichtung aus Normale bzw. Leserichtung (oder s.face),
  // Gier- und Neigungswinkel, Abstand aus der gewünschten Schriftgröße in Pixeln, Lage des Textes im Ausschnitt (sx, sy in −1 … 1)
  function readingPose(I, s) {
    const W = VW(), H = VH(), nar = aspect < 1, TAN = Math.tan(fovOf(I) * PI / 360);
    let px = nar ? s.pxN : s.px;
    if (typeof px === "function") px = px(W, H, s);
    if (px === undefined) px = nar ? 22 : clamp(27 + (H - 900) / 540 * 2.5, 27, 30);          // Großbuchstaben mindestens 16 px (Handy 13 px): Schibsted Grotesk H = 0,703 em
    const fit = nar ? s.fitN : s.fit;
    if (fit) px = Math.min(px, fit * W / (s.wm / s.e));
    px = Math.max(px, nar ? 19.6 : 23.8);
    const depth = s.e * H / (2 * TAN * px);
    const yaw = (nar && s.nyaw !== undefined ? s.nyaw : s.yaw || 0) * PI / 180, pitch = (nar && s.npitch !== undefined ? s.npitch : s.pitch) * PI / 180;
    // sx/sy dürfen auch Funktionen (W, H) sein (Bildaufteilung je Seitenverhältnis)
    const fv = v => typeof v === "function" ? v(W, H) : v || 0;
    const sx = nar ? fv(s.nsx) : fv(s.sx), sy = nar ? fv(s.nsy) : fv(s.sy);
    // s.face (stimmen): waagerechte Blickrichtung vorgeben (Zickzack aus Flächen mit wechselnder Normale)
    const h = s.face ? s.face.clone() : Math.abs(s.N.y) > .7 ? s.Y.clone() : s.N.clone().negate(); h.y = 0; h.normalize();
    const c = Math.cos(yaw), sn = Math.sin(yaw); h.set(h.x * c + h.z * sn, 0, -h.x * sn + h.z * c);
    // s.frontal (Folgefahrt): die Sehlinie zum Text liegt fest (waagerecht entgegen der Normale, um tilt Grad nach unten geneigt, um yaw gedreht), die Kamera wird so gedreht,
    // dass der Text bei (sx, sy) im Bild steht. Die Kamera steht damit auf der Sehlinie vor dem Text, die Schräge des Textes ist genau tilt (Vorgabe 0).
    if (s.frontal) {
      const tilt = (nar && s.ntilt !== undefined ? s.ntilt : s.tilt || 0) * PI / 180;
      const Dv = h.clone().multiplyScalar(Math.cos(tilt)).add(V(0, -Math.sin(tilt), 0)).normalize(), Fw2 = Dv.clone(), Rt2 = V(), U2 = V();
      const sx2 = nar ? fv(s.nsx) : fv(s.sx), sy2 = nar ? fv(s.nsy) : fv(s.sy);
      for (let it = 0; it < 8; it++) {
        Rt2.crossVectors(Fw2, UP).normalize(); U2.crossVectors(Rt2, Fw2);
        const Dn = Fw2.clone().addScaledVector(Rt2, sx2 * TAN * aspect).addScaledVector(U2, sy2 * TAN).normalize();
        Fw2.add(Dv.clone().sub(Dn)).normalize();
      }
      const P2 = s.C.clone().addScaledVector(Dv, -depth / Dv.dot(Fw2));
      return { cam: P2, tgt: P2.clone().addScaledVector(Fw2, depth), px };
    }
    const Fw = h.clone().multiplyScalar(Math.cos(pitch)).add(V(0, -Math.sin(pitch), 0)).normalize();
    const Rt = V().crossVectors(Fw, UP).normalize(), U = V().crossVectors(Rt, Fw);
    const D = Fw.clone().addScaledVector(Rt, sx * TAN * aspect).addScaledVector(U, sy * TAN).normalize();
    const P = s.C.clone().addScaledVector(D, -depth / D.dot(Fw));
    return { cam: P, tgt: P.clone().addScaledVector(Fw, depth), px };
  }
  // Bahn durch die Schlüssel ohne Überschwingen (statt Catmull-Rom von Ort und Ziel getrennt, deren Blickrichtung zwischen den Schlüsseln pendelte):
  // Ort je Achse, Blickrichtung (Gier, Neigung) und Abstand (Logarithmus) monoton kubisch (pchip) durch die Schlüssel; zwischen zwei Schlüsseln
  // kehrt keine dieser Größen ihre Richtung um, wenn sie es an den Schlüsseln nicht tut. t = 0 … 1 gleichmäßig über die Schlüssel.
  function monoPath(cams, tgts) {
    const n = cams.length, xs = cams.map((_, i) => i / (n - 1)), D = tgts.map((t, i) => t.clone().sub(cams[i]));
    const yaw = []; D.forEach((d, i) => yaw.push(i ? yaw[i - 1] + wrapPi(yawOf(d) - yaw[i - 1]) : yawOf(d)));
    const fx = pchip(xs, cams.map(c => c.x)), fy = pchip(xs, cams.map(c => c.y)), fz = pchip(xs, cams.map(c => c.z));
    const fw = pchip(xs, yaw), fp = pchip(xs, D.map(pitchOf)), fl = pchip(xs, D.map(d => Math.log(Math.max(.01, d.length()))));
    const cam = (t, out) => out.set(fx(t), fy(t), fz(t));
    const tgt = (t, out) => { cam(t, out); return out.addScaledVector(dirAng(fw(t), fp(t), _c0), Math.exp(fl(t))); };
    return { cam, tgt };
  }
  // ---------- Faden, Punkt und Lesestellen in der Szene (Kamera-Umbau 23.10.2026) ----------
  // Ein Faden für die ganze Seite. In jeder Insel ein Szenenlauf: Eingang vorn (Tür der Insel), an den Lesestellen vorbei (je Lesestelle eine Station links unter dem Satz,
  // „Lesezeichen“), um die Bauteile herum zum Ausgang hinten; zwischen den Inseln der Fluss (Lage der Inseln). Jeder Lauf ist eine Ausgleichskurve (fair(): kleinste Änderung
  // der Krümmung, Übergänge wie Klothoiden, keine Ecken), Anfang und Ende gerade (Krümmung 0), so schließen Insel und Fluss ohne Krümmungssprung aneinander.
  // Der Punkt läuft mit gleichem Tempo je Scrollweg; an Lesestellen wird er weich langsamer (SLOW_F des Tempos) und fließt weiter, er rastet nie ein (Erik 23.10.2026).
  const CLEAR = .75, HOLD_PER_CHAR = .46, HOLD_MIN = 24;
  const boxNear = (bx, x, z, m) => x > bx.min.x - m && x < bx.max.x + m && z > bx.min.z - m && z < bx.max.z + m;
  // Strecke a→b trifft die Box (mit Rand m)?
  function segBox(a, b, bx, m) {
    let t0 = 0, t1 = 1;
    for (const ax of ["x", "y", "z"]) {
      const d = b[ax] - a[ax], lo = bx.min[ax] - m, hi = bx.max[ax] + m;
      if (Math.abs(d) < 1e-9) { if (a[ax] < lo || a[ax] > hi) return false; continue; }
      let u = (lo - a[ax]) / d, w = (hi - a[ax]) / d; if (u > w) { const t = u; u = w; w = t; }
      t0 = Math.max(t0, u); t1 = Math.min(t1, w); if (t0 > t1) return false;
    }
    return true;
  }
  const textChars = s => s.prints.reduce((a, pr) => a + (pr.t && pr.t.lines ? pr.t.lines.join("").replace(/\s/g, "").length : 0), 0);
  // Station des Punktes an einer Lesestelle („Lesezeichen“, Erik 23.10.2026): immer an derselben Stelle zum Text, links unter dem Satz. Gesucht wird der Boden im Bild der
  // Lesestellung, der dem Punkt links unter dem Textrahmen am nächsten liegt (Abstand BM_DX links der Textkante, BM_DY unter der Unterkante), frei von Bauteilen und ungedeckt.
  const BM_DX = .07, BM_DY = .15;
  function stationFor(I, s, obs, obsAll = obs) {
    if (s.at) return { p: s.at.slice(), how: "fest" };
    const pose = readingPose(I, s), pc = new THREE.PerspectiveCamera(fovOf(I), aspect, .1, 300);
    pc.position.copy(pose.cam); pc.lookAt(pose.tgt); pc.updateMatrixWorld(); pc.updateProjectionMatrix();
    let rx0 = 1e9, ry0 = 1e9, rx1 = -1e9, ry1 = -1e9;
    for (const p of s.pts) { const q = p.clone().project(pc); if (q.z > 1) continue; rx0 = Math.min(rx0, q.x); rx1 = Math.max(rx1, q.x); ry0 = Math.min(ry0, q.y); ry1 = Math.max(ry1, q.y); }
    if (rx0 > rx1) { rx0 = ry0 = -.2; rx1 = ry1 = .2; }
    const ob2 = obsAll.filter(bx => bx.max.y > .12), front = Math.abs(s.N.y) > .7 ? null : V(s.N.x, 0, s.N.z).normalize();
    // Rahmen ohne Kopfzeile und Knopfleiste (Pixel → NDC); der Punkt bleibt innerhalb der Grenzen der Nachführung (DOT_FRAME), sonst zöge sie die stehende Kamera nach
    const H = VH(), W = VW(), topN = Math.min(DOT_FRAME.y1 - .14, 1 - 2 * 84 / H), botN = Math.max(DOT_FRAME.y0 + .18, -1 + 2 * 96 / H), sideN = Math.min(DOT_FRAME.x - .14, 1 - 2 * 28 / W);
    const tx = clamp(rx0 - BM_DX, -sideN, sideN), ty = clamp(ry0 - BM_DY, botN, topN);
    const d = V(), q = V(), cand = [];
    // bevorzugt: auf der Laufbahn der Szene (I.laneZ, vor den Bauteilen), knapp links der linken Textkante, sofern frei, im Bild und ungedeckt
    if (I.laneZ !== undefined && front) {
      const xl = Math.min(...s.pts.map(p => p.x));
      for (const dx of [.35, .8, 1.3, 0, -.4]) {
        const x = xl - dx, z = I.laneZ, P = V(x, THREAD_Y + .05, z), pr = P.clone().project(pc);
        if (Math.hypot(x - I.disc.cx, z - I.disc.cz) > I.disc.R - 2.2 || obs.some(bx => boxNear(bx, x, z, CLEAR * .8))) continue;
        if (pr.z > 1 || Math.abs(pr.x) > sideN || pr.y < botN || pr.y > topN || ((x - s.C.x) * front.x + (z - s.C.z) * front.z) < .9) continue;
        if (pr.x > rx0 + .02 && pr.y > ry0 - .02) continue;                                            // nicht rechts im Text
        if (ob2.some(bx => segBox(pc.position, P, bx, .1))) continue;
        return { p: [x, z], how: "Laufbahn", ndc: [pr.x, pr.y], off: 0 };
      }
    }
    for (let iy = 0; iy <= 70; iy++) for (let ix = 0; ix <= 50; ix++) {
      const nx = -sideN + 2 * sideN * ix / 50, ny = botN + (topN - botN) * iy / 70;
      if (nx > rx0 - .02 && nx < rx1 + .02 && ny > ry0 - .02 && ny < ry1 + .02) continue;          // nicht auf den Text
      cand.push([Math.hypot((nx - tx) * (W / H) * .5, ny - ty), nx, ny]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    let best = null, nOk = 0;
    for (const [cost, nx, ny] of cand) {
      if (nOk > 80) break;
      q.set(nx, ny, .5).unproject(pc); d.copy(q).sub(pc.position).normalize();
      if (d.y > -.02) continue;
      const t = (THREAD_Y - pc.position.y) / d.y; if (t < 0 || t > 80) continue;
      const x = pc.position.x + d.x * t, z = pc.position.z + d.z * t;
      if (Math.hypot(x - I.disc.cx, z - I.disc.cz) > I.disc.R - 2.2) continue;
      if (obs.some(bx => boxNear(bx, x, z, CLEAR * .8))) continue;
      if (front && ((x - s.C.x) * front.x + (z - s.C.z) * front.z) < .9) continue;          // vor der Textfläche, nicht dahinter
      const P = V(x, THREAD_Y + .05, z);
      if (ob2.some(bx => segBox(pc.position, P, bx, .1))) continue;
      // hinter der Laufbahn (zwischen den Bauteilen) kostet: der Faden müsste sonst eine Kehre machen
      const c2 = cost + (I.laneZ !== undefined ? Math.max(0, I.laneZ - z) * .06 : 0);
      nOk++; if (!best || c2 < best.c2) best = { p: [x, z], how: "ndc " + nx.toFixed(2) + "," + ny.toFixed(2) + " (Ziel " + tx.toFixed(2) + "," + ty.toFixed(2) + ")", ndc: [nx, ny], off: cost, c2 };
    }
    if (best) return best;
    // keine freie Bodenstelle im Bild: Boden vor dem Text (Notlösung)
    const h = V(s.N.x, 0, s.N.z).normalize();
    dbg("Station " + I.name + ": keine freie Stelle im Bild, Notlösung");
    return { p: [s.C.x + h.x * 1.5, s.C.z + h.z * 1.5], how: "Notlösung", off: 9 };
  }
  // Lesestellung samt Station (Kamera-Umbau 23.10.2026): zuerst freie Bodenstellen links unter dem Satz (vor dem Text, sonst daneben bzw. dahinter), dann wird die
  // Lesestellung aus readingPose() minimal angepasst (zurück, um den Textmittelpunkt leicht nach unten geneigt, Bild nach oben verschoben), bis Text und Station sicher im
  // Rahmen stehen, die Schräge höchstens FIT_SLANT ist und die Schrift nicht unter die Mindestgröße fällt. Ergebnis: { cam, tgt, p (Station), how }
  const FIT_SLANT = 14.5;
  function readingFit(I, s, obs, obsAll, level = 0) {
    // Stufen: 0 Text, Nachbartexte und Punkt im Bild; 1 Text und Nachbarn (Punkt so nah wie möglich); 2 nur der Text (angeschnittene Nachbarn kosten);
    // 3 nur wenn der Text bei Mindestschrift gar nicht ins Bild passt (schmale Handys): ganzer Text bei bis zu 15 % kleinerer Schrift statt angeschnitten
    const textOnly = level > 0, nbSoft = level > 1;
    const base = readingPose(I, s), nar = aspect < 1, H = VH(), W = VW(), pxMin = (nar ? 18.7 : 23.0) * (level > 2 ? .85 : 1), pxGood = nar ? 21.4 : 26.3;
    // Schrift: maßgeblich ist der kleinste Textdruck der Lesestelle; Mitten aller Drucke für die Schräge
    const te = s.prT || [], eMin = te.length ? Math.min(...te.map(q => q.e)) : s.e, pxS = base.px * eMin / s.e;
    const pcs = te.length ? te.map(q => q.c) : [s.C], nrms = te.length ? te.map(q => q.n) : [s.N];
    const flat = Math.abs(s.N.y) > .7, Nn = s.N.clone(), Yt = s.Y.clone();
    const Rt = V().crossVectors(Yt, Nn).normalize();                                     // Leserichtung
    const fwd = flat ? V(-Yt.x, 0, -Yt.z).normalize() : V(Nn.x, 0, Nn.z).normalize();     // „vor“ dem Text auf dem Boden
    const Rh = V(Rt.x, 0, Rt.z).normalize();
    let uL = 1e9, uR = -1e9, vF = -1e9; for (const p of s.pts) { const d = p.clone().sub(s.C); uL = Math.min(uL, d.dot(Rh)); uR = Math.max(uR, d.dot(Rh)); vF = Math.max(vF, d.dot(fwd)); }
    const Cf = V(s.C.x, 0, s.C.z);
    // Bodenstellen (Szenenkoordinaten): frei von Bauteilen, im Boden der Insel
    const cands = [];
    // hochkant ist das Bild schmal: die Station darf auch unter dem Satz liegen (bis zur rechten Textkante)
    for (let u = uL - 7.5; u <= (nar ? Math.max(uL + 1, uR) : uL + 1) + .01; u += .6) for (let v = -9.4; v <= 4.01; v += .6) {
      const vv = vF + v, P = Cf.clone().addScaledVector(Rh, u).addScaledVector(fwd, vv);
      if (Math.hypot(P.x - I.disc.cx, P.z - I.disc.cz) > I.disc.R - 2.2 || obs.some(bx => boxNear(bx, P.x, P.z, CLEAR * 1.1))) continue;
      if (s.near && Math.hypot(P.x - s.near[0], P.z - s.near[1]) > (s.nearR !== undefined ? s.nearR : nar ? 2.6 : 1.7)) continue;
      cands.push({ P: V(P.x, THREAD_Y, P.z), c: s.near ? Math.hypot(P.x - s.near[0], P.z - s.near[1]) : Math.abs(u - (uL - .4)) + .6 * Math.abs(v - 1.2) + (v < .5 ? 2.5 : 0) });
    }
    // Wunschlage aus der Tabelle gilt auch, wenn ringsum kein Rasterpunkt frei ist (die Bahn führt ohnehin dorthin)
    if (s.near && !cands.length) cands.push({ P: V(s.near[0], THREAD_Y, s.near[1]), c: 0 });
    cands.sort((a, b) => a.c - b.c);
    if (textOnly && !cands.length) cands.push({ P: V(s.C.x, THREAD_Y, s.C.z), c: 50 });
    if (s.fixP) { cands.length = 0; cands.push({ P: V(s.fixP[0], THREAD_Y, s.fixP[1]), c: 0 }); }
    const pc = new THREE.PerspectiveCamera(FOVC(), aspect, .1, 300), ob2 = obsAll.filter(bx => bx.max.y > .12);
    const lim = { x: DOT_FRAME.x - .1, y0: DOT_FRAME.y0 + .1, y1: DOT_FRAME.y1 - .1, ty: 1 - 2 * 70 / H, by: -1 + 2 * 80 / H };
    const d0 = base.cam.distanceTo(base.tgt), F0 = base.tgt.clone().sub(base.cam).normalize();
    const others = []; { const seenO = new Set([s]); for (const k of I.def.keys) if (k.stop && !seenO.has(k.stop)) { seenO.add(k.stop); if (k.stop.pts && k.stop.pts.length) others.push(k.stop.pts); } }
    let best = null; const dbgC = { cands: cands.length, poses: 0, textOk: 0, inFrame: 0, occl: 0, slant: 0, px: base.px };
    const bMax = pxS / pxMin;
    // Schriftgröße (px der Schrift): nie unter pxMin (Messflug: Großbuchstaben 16 px Breitbild, 13 px hochkant), jeder Pixel unter pxGood (Ampel grün) kostet; lieber etwas kleiner als Text oder Punkt außerhalb des Bildes
    for (const b of [.6, .66, .72, .8, .88, .95, 1, 1.12, 1.25, 1.38, 1.52, 1.68]) {
      if (b > bMax + 1e-6 && b > .7) continue;
      // näher als die Grundstellung (b < 1) ist erlaubt: größere Schrift (bis pxGood) wiegt die Abweichung auf, sofern Text und Punkt im Bild bleiben
      for (const dt of flat ? [0] : [0, 5, 10, 15]) for (const dy of [0, .2, .4, .6]) for (const dx of [0, .2, -.2, .35, -.35, .5, -.5, .6, -.6, .7, -.7]) {
        let poseCost = Math.abs(b - 1) * 30 + dt * .35 + dy * 4 + Math.abs(dx) * 5 + Math.max(0, pxGood - pxS / b) * 6; if (best && poseCost >= best.cost) continue;
        // Kamera um den Textmittelpunkt um dt nach oben schwenken (Blick neigt sich), dann zurück, dann senkrecht verschieben
        const rel = base.cam.clone().sub(s.C).applyAxisAngle(Rh, dt * PI / 180 * (Rh.dot(V().crossVectors(UP, F0)) >= 0 ? 1 : -1));
        const cam = s.C.clone().add(rel.multiplyScalar(b)), tgt0 = base.tgt.clone().sub(base.cam).applyAxisAngle(Rh, 0);
        const Fd = s.C.clone().sub(cam).normalize().lerp(F0, 0).normalize(), tgt = cam.clone().addScaledVector(s.C.clone().sub(base.cam).applyAxisAngle(V(0, 1, 0), 0).length() ? Fd : F0, d0 * b);
        // Bildlage des Textes wie in der Grundstellung (Text im gleichen Bildort): Blick parallel zur alten Richtung, gekippt mit dt
        const Fn = F0.clone().applyAxisAngle(Rh, dt * PI / 180 * (Rh.dot(V().crossVectors(UP, F0)) >= 0 ? 1 : -1));
        tgt.copy(cam).addScaledVector(Fn, d0 * b);
        const slant = Math.acos(clamp(cam.clone().sub(s.C).normalize().dot(flat ? Nn : Nn), -1, 1)) * 180 / PI;
        dbgC.poses++;
        const Up = V().crossVectors(V().crossVectors(Fn, UP).normalize(), Fn), hh = d0 * b * Math.tan(FOVC() * PI / 360);
        const RtC = V().crossVectors(Fn, UP).normalize();
        cam.addScaledVector(Up, -dy * hh).addScaledVector(RtC, -dx * hh * aspect); tgt.addScaledVector(Up, -dy * hh).addScaledVector(RtC, -dx * hh * aspect);
        // Schräge nach dem Verschieben: Winkel zwischen Textnormale und Sicht auf die Textmitte
        if (pcs.some((c0, k) => Math.acos(clamp(Math.abs(cam.clone().sub(c0).normalize().dot(nrms[k])), -1, 1)) * 180 / PI > FIT_SLANT)) { dbgC.slant++; continue; }
        pc.position.copy(cam); pc.lookAt(tgt); pc.updateMatrixWorld(); pc.updateProjectionMatrix();
        // der ganze Text steht im Bild, frei von Kopfzeile und Knopfleiste (Erik: ganzer Satz vollständig und frontal im Bild, vor Punkt und Schriftgröße)
        let ok = true; for (const p of s.pts) { const q = p.clone().project(pc); if (q.z > 1 || Math.abs(q.x) > .96 || q.y > lim.ty || q.y < lim.by) { ok = false; break; } }
        if (!ok) continue;
        dbgC.textOk++;
        // andere Texte der Szene nicht am Bildrand anschneiden: ganz im Bild oder ganz draußen
        let cut = 0; for (const o of others) { let inn = 0; for (const p of o) { const q = p.clone().project(pc); if (q.z < 1 && Math.abs(q.x) < 1 && Math.abs(q.y) < 1) inn++; } if (inn && inn < o.length) cut++; }
        if (cut && !nbSoft) continue;
        poseCost += cut * 30;
        for (const cd of cands) {
          let tot = poseCost + cd.c; if (best && tot >= best.cost) break;
          const q = cd.P.clone().project(pc);
          const out = q.z > 1 ? 9 : Math.max(0, Math.abs(q.x) - lim.x) + Math.max(0, lim.y0 - q.y) + Math.max(0, q.y - lim.y1);
          if (out > 0 && !textOnly) continue;
          // Text gewinnt: der Punkt darf außerhalb liegen, aber so nah am Bild wie möglich (je NDC-Einheit draußen 40)
          tot += out * 40; if (best && tot >= best.cost) continue;
          dbgC.inFrame++;
          const occl = ob2.some(bx => segBox(cam, V(cd.P.x, THREAD_Y + .05, cd.P.z), bx, .1));
          if (occl && !textOnly) { dbgC.occl++; continue; }
          if (occl) tot += 15;
          if (best && tot >= best.cost) continue;
          best = { cost: tot, cam: cam.clone(), tgt: tgt.clone(), p: [cd.P.x, cd.P.z], how: "fit b" + b + " t" + dt + " y" + dy + " x" + dx + (textOnly ? " (Text vor Punkt)" : ""), px: base.px / b };
          if (!textOnly) break;
        }
      }
    }
    s.fitDbg = dbgC;
    if (best) return best;
    // keine Stellung, in der Text und Punkt zusammen passen: zweiter Versuch, in dem der Text gewinnt (ganz und frontal im Bild, Mindestschrift), der Punkt darf außerhalb liegen
    if (level < 3) return readingFit(I, s, obs, obsAll, level + 1);      // zuletzt: Text gewinnt, der Punkt darf außerhalb des Bildes liegen
    dbg("Lesestelle " + I.name + ": keine Station im Bild, Grundstellung");
    return null;
  }
  // kleinster Krümmungsradius einer Punktfolge (Dreipunkt-Radius, ab Abstand ≥ 0,05 zwischen den Punkten)
  function minRadiusOf(pts, key = p => [p.x, p.z]) {
    let rmin = 1e9, at = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const a = key(pts[i - 1]), b = key(pts[i]), c = key(pts[i + 1]);
      const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ca = Math.hypot(a[0] - c[0], a[1] - c[1]);
      const ar = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
      if (ar < 1e-9 || ab < .05 || bc < .05) continue;
      const r = ab * bc * ca / (2 * ar); if (r < rmin) { rmin = r; at = i; }
    }
    return { r: rmin, at };
  }
  // Hindernisse der Szene (Szenenkoordinaten, x0, x1, z0, z1): was in irgendeinem Zustand zwischen Eintreffen und Ende steht (flach liegende Faltpläne zählen nicht),
  // ohne Teile in cfg.faden.free (Überschriften, die vor dem Weg ausblenden)
  function obstaclesOf(I) {
    const SB = I.sb, fr = (I.fcfg && I.fcfg.free) || [], seen = new Set(), out = [];
    const ok = b => !b.isEmpty() && b.max.y > .15 && b.min.y < 3 && (b.max.x - b.min.x) * (b.max.z - b.min.z) < 400 && !fr.some(r => b.min.x >= r[0] && b.max.x <= r[1] && b.min.z >= r[2] && b.max.z <= r[3]);
    const cl = I.clip;
    // nur Zustände, in denen der Punkt durch die Szene läuft (ab kurz vor der ersten Lesestelle): Teile, die vorher aufklappen und dabei die Fläche überstreichen, hindern ihn nicht
    const bFrom = Math.max(I.b0, Math.min(...I.def.keys.filter(k => k.stop).map(k => k.stop.b), I.bMax) - .04);
    for (const st of SB.steps.filter(q => q.b >= bFrom - 1e-6 || q === SB.steps[SB.steps.length - 1])) for (const b0 of [...st.list, ...SB.extra]) {
      let b = b0;
      if (cl) { if (b.max.x < cl[0] || b.min.x > cl[1] || b.max.z < cl[2] || b.min.z > cl[3]) continue; b = b.clone(); b.min.x = Math.max(b.min.x, cl[0]); b.max.x = Math.min(b.max.x, cl[1]); b.min.z = Math.max(b.min.z, cl[2]); b.max.z = Math.min(b.max.z, cl[3]); }
      if (!ok(b)) continue;
      const key = [b.min.x, b.max.x, b.min.z, b.max.z].map(q => Math.round(q * 10)).join(); if (seen.has(key)) continue; seen.add(key);
      out.push(b);
    }
    return out;
  }
  // Stationen aller Lesestellen der Szene in Reihenfolge der Schlüssel (Szenenkoordinaten)
  function stationsOf(I) {
    const SB = I.sb, fr = (I.fcfg && I.fcfg.free) || [];
    const cl = I.clip, inClip = b => !cl || !(b.max.x < cl[0] || b.min.x > cl[1] || b.max.z < cl[2] || b.min.z > cl[3]);
    const okBox = b => !b.isEmpty() && inClip(b) && b.max.y > .08 && b.min.y < 3 && (b.max.x - b.min.x) * (b.max.z - b.min.z) < 400 && !fr.some(r => b.min.x >= r[0] && b.max.x <= r[1] && b.min.z >= r[2] && b.max.z <= r[3]);
    const stepOf = bq => { let bs = SB.steps[0]; for (const t of SB.steps) if (Math.abs(t.b - bq) < Math.abs(bs.b - bq)) bs = t; return bs; };
    const obsOne = bq => { const bs = stepOf(bq); return [...bs.list, ...SB.extra].filter(okBox); };
    const obsAllOf = bq => { const bs = stepOf(bq); return [...bs.list, ...SB.extra].filter(b => !b.isEmpty() && inClip(b) && b.max.y > .12 && (b.max.x - b.min.x) * (b.max.z - b.min.z) < 400); };
    const seen = new Set(), stops = []; for (const k of I.def.keys) if (k.stop && !seen.has(k.stop)) { seen.add(k.stop); stops.push(k.stop); }
    const obsUnion = obstaclesOf(I);
    const out = [];
    for (const s of stops) {
      const fit = s.at ? null : readingFit(I, s, obsUnion, obsAllOf(s.b));
      s.fitPose = fit ? { cam: fit.cam, tgt: fit.tgt, px: fit.px } : null;
      const st = { stop: s, ...(fit ? { p: fit.p, how: fit.how } : s.near && !s.at ? { p: s.near.slice(), how: "Wunschlage" } : stationFor(I, s, obsOne(s.b), obsAllOf(s.b))) }, prev = out[out.length - 1];
      // gleiche Stelle wie die vorige Lesestelle (z. B. Blätter auf einer Staffelei): der Punkt bleibt dort (eine Station für alle)
      if (prev && Math.hypot(prev.p[0] - st.p[0], prev.p[1] - st.p[1]) < .8) { st.p = prev.p; st.same = true; }
      out.push(st);
    }
    // Bahn: alle Stationen auf derselben Tiefe (Mittel), sofern dort frei: der Faden läuft dann ruhig an den Texten vorbei statt zu zacken (f.lane = Tiefe oder false)
    const fl = I.fcfg && I.fcfg.lane;
    if (fl !== false && out.length > 1) {
      const zs = out.map(o => o.p[1]).sort((a, b) => a - b), lz = typeof fl === "number" ? fl : zs[Math.floor(zs.length / 2)];
      for (const o of out) {
        if (o.same || Math.abs(o.p[1] - lz) > 2.5) continue;
        if (!obsUnion.some(bx => boxNear(bx, o.p[0], lz, CLEAR * 1.1))) { o.p = [o.p[0], lz]; o.lane = true; }
      }
      for (let i = 1; i < out.length; i++) if (out[i].same) out[i].p = out[i - 1].p;
    }
    return out;
  }

  // Ausgleichskurve: Punktfolge P ([x, z]), feste Punkte pins (Index → [x, z]), weiche Bindungen soft (Index → { p, w }). Minimiert Σ|Δ³|² + a2·Σ|Δ²|² + Σ w·|x − p|²
  // (dritte Differenzen: die Krümmung ändert sich stetig und gleichmäßig, wie bei Klothoiden; keine Ecken). Bandmatrix der Breite 3, Cholesky.
  function fair(P, pins, soft, a2 = .002) {
    const n = P.length, idx = new Int32Array(n).fill(-1), fr = [];
    for (let j = 0; j < n; j++) if (!pins.has(j)) { idx[j] = fr.length; fr.push(j); }
    const m = fr.length, B = 3, W = B + 1;
    if (!m) return P.map((p, j) => pins.get(j).slice());
    const A = new Float64Array(m * W), bx = new Float64Array(m), bz = new Float64Array(m);
    const term = (cs, ws, g) => {
      for (let a = 0; a < cs.length; a++) {
        const ia = idx[cs[a]]; if (ia < 0) continue;
        for (let b = 0; b < cs.length; b++) {
          const jb = cs[b], v = g * ws[a] * ws[b], ib = idx[jb];
          if (ib >= 0) { if (ib <= ia) A[ia * W + (ia - ib)] += v; } else { const pp = pins.get(jb); bx[ia] -= v * pp[0]; bz[ia] -= v * pp[1]; }
        }
      }
    };
    for (let r = 0; r + 3 < n; r++) term([r, r + 1, r + 2, r + 3], [-1, 3, -3, 1], 1);
    if (a2) for (let r = 0; r + 2 < n; r++) term([r, r + 1, r + 2], [1, -2, 1], a2);
    if (soft) for (const [j, s] of soft) { const i = idx[j]; if (i < 0) continue; A[i * W] += s.w; bx[i] += s.w * s.p[0]; bz[i] += s.w * s.p[1]; }
    for (let i = 0; i < m; i++) A[i * W] += 1e-10;
    for (let i = 0; i < m; i++) {
      for (let k = Math.max(0, i - B); k <= i; k++) {
        let s = A[i * W + (i - k)];
        for (let l = Math.max(0, i - B); l < k; l++) s -= A[i * W + (i - l)] * A[k * W + (k - l)];
        if (i === k) A[i * W] = Math.sqrt(Math.max(s, 1e-16)); else A[i * W + (i - k)] = s / A[k * W];
      }
    }
    const solve = b => {
      const y = new Float64Array(m);
      for (let i = 0; i < m; i++) { let s = b[i]; for (let k = Math.max(0, i - B); k < i; k++) s -= A[i * W + (i - k)] * y[k]; y[i] = s / A[i * W]; }
      for (let i = m - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k <= Math.min(m - 1, i + B); k++) s -= A[k * W + (k - i)] * y[k]; y[i] = s / A[i * W]; }
      return y;
    };
    const sx = solve(bx), sz = solve(bz);
    return P.map((p, j) => pins.has(j) ? pins.get(j).slice() : [sx[idx[j]], sz[idx[j]]]);
  }
  // Weg durch Knoten: Anfang und Ende fest mit Richtung (t0, t1) und geradem Stück (lead), Zwischenknoten mit weicher Bindung w; stößt die Kurve an Hindernisse (Rechtecke
  // [x0, x1, z0, z1] mit Rand clear) oder verlässt sie den Boden (disc), wird sie dort schrittweise hinausgedrückt (die Kurve bleibt dabei eine Ausgleichskurve).
  // Ergebnis: Punkte [x, z] und für jeden Zwischenknoten seinen Index (nd.j)
  function fairPath(nodes, o) {
    const ds = o.ds || .25, lead = Math.max(2, Math.round((o.lead || .5) / ds)), t0 = o.t0, t1 = o.t1;
    const P0 = nodes[0].p, P1 = nodes[nodes.length - 1].p, pts = [], pins = new Map(), soft = new Map();
    for (let k = 0; k <= lead; k++) { const q = [P0[0] + t0[0] * ds * k, P0[1] + t0[1] * ds * k]; pins.set(pts.length, q); pts.push(q); }
    const endLead = []; for (let k = lead; k >= 0; k--) endLead.push([P1[0] - t1[0] * ds * k, P1[1] - t1[1] * ds * k]);
    let prev = pts[pts.length - 1];
    for (const nd of [...nodes.slice(1, -1), { p: endLead[0], end: true }]) {
      const a = nd.p, L = Math.hypot(a[0] - prev[0], a[1] - prev[1]), n = Math.max(1, Math.round(L / ds));
      for (let k = 1; k <= n; k++) pts.push([prev[0] + (a[0] - prev[0]) * k / n, prev[1] + (a[1] - prev[1]) * k / n]);
      if (nd.end) pins.set(pts.length - 1, a.slice()); else if (nd.w) soft.set(pts.length - 1, { p: a.slice(), w: nd.w });
      nd.j = pts.length - 1; prev = a;
    }
    for (let k = 1; k < endLead.length; k++) { pins.set(pts.length, endLead[k]); pts.push(endLead[k]); }
    const m = o.clear !== undefined ? o.clear : CLEAR * .47, obs = o.obs || [], push = new Map(), sideOf = new Map();
    let P = pts;
    for (let it = 0; it < 60; it++) {
      const sf = new Map(soft); for (const [j, q] of push) sf.set(j, q);
      P = fair(pts, pins, sf, o.a2);
      let bad = 0;
      const inside = (q, b) => q[0] > b[0] - m && q[0] < b[1] + m && q[1] > b[2] - m && q[1] < b[3] + m;
      obs.forEach((b, bi) => {
        let j = 0;
        while (j < P.length) {
          if (pins.has(j) || !inside(P[j], b)) { j++; continue; }
          let j1 = j; while (j1 + 1 < P.length && !pins.has(j1 + 1) && inside(P[j1 + 1], b)) j1++;
          const key = bi + ":" + Math.round((j + j1) / 2 / 12);
          let side = sideOf.get(key);
          if (side === undefined) {
            const cost = [0, 0, 0, 0];
            for (let k = j; k <= j1; k++) { const q = P[k]; cost[0] += q[0] - (b[0] - m); cost[1] += (b[1] + m) - q[0]; cost[2] += q[1] - (b[2] - m); cost[3] += (b[3] + m) - q[1]; }
            side = cost.indexOf(Math.min(...cost)); sideOf.set(key, side);
          }
          for (let k = j; k <= j1; k++) {
            const q = P[k], tgt = side === 0 ? [b[0] - m - .25, q[1]] : side === 1 ? [b[1] + m + .25, q[1]] : side === 2 ? [q[0], b[2] - m - .25] : [q[0], b[3] + m + .25];
            const old = push.get(k); push.set(k, { p: tgt, w: old ? Math.min(300, old.w * 1.6) : 1.5 }); bad++;
          }
          j = j1 + 1;
        }
      });
      if (o.disc) P.forEach((q, j) => { if (pins.has(j)) return; const dx = q[0] - o.disc.cx, dz = q[1] - o.disc.cz, r = Math.hypot(dx, dz), lim = o.disc.R - 1; if (r > lim) { const old = push.get(j); push.set(j, { p: [o.disc.cx + dx / r * (lim - .3), o.disc.cz + dz / r * (lim - .3)], w: old ? Math.min(4000, old.w * 1.8) : 2 }); bad++; } });
      if (!bad) break;
      if (it === 59) dbg("Ausgleichskurve: " + bad + " Punkte noch an Hindernissen");
    }
    P.nodes = nodes;
    return P;
  }
  // Mindestradius erzwingen: wo drei aufeinanderfolgende Punkte (Abstand ds) einen kleineren Radius als rmin bilden, werden sie örtlich geglättet (Laplace), die ersten und
  // letzten keep Punkte bleiben fest (gerade Ein- und Austritte). Danach gleichmäßig neu abgetastet. Punkte als Vector3 (y bleibt).
  function relaxRadius(pts, rmin, keep = 8, iters = 2000, fixed = [], maxD = 1e9) {
    const P = pts.map(p => p.clone()), n = P.length; if (n < 2 * keep + 3) return P;
    const P0 = pts.map(p => p.clone());
    const fix = new Uint8Array(n); for (const i of fixed) if (i >= 0 && i < n) fix[i] = 1;
    const rad = i => { const a = P[i - 1], b = P[i], c = P[i + 1], ab = Math.hypot(b.x - a.x, b.z - a.z), bc = Math.hypot(c.x - b.x, c.z - b.z), ca = Math.hypot(a.x - c.x, a.z - c.z), ar = Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)); return ar < 1e-12 ? 1e9 : ab * bc * ca / (2 * ar); };
    for (let it = 0; it < iters; it++) {
      let bad = 0;
      for (let i = keep; i < n - keep; i++) {
        if (rad(i) >= rmin) continue; bad++;
        for (let j = Math.max(keep, i - 3); j <= Math.min(n - keep - 1, i + 3); j++) { if (fix[j]) continue; const w = j === i ? .5 : .5 / (1 + Math.abs(j - i)); const mx = (P[j - 1].x + P[j + 1].x) / 2, mz = (P[j - 1].z + P[j + 1].z) / 2; P[j].x += (mx - P[j].x) * w; P[j].z += (mz - P[j].z) * w; const dx = P[j].x - P0[j].x, dz = P[j].z - P0[j].z, dd = Math.hypot(dx, dz); if (dd > maxD) { P[j].x = P0[j].x + dx / dd * maxD; P[j].z = P0[j].z + dz / dd * maxD; } }
      }
      if (!bad) break;
    }
    return P;
  }
  // Polygonzug mit Bogenlänge (Vector3): at(s), tan(s); dazu die Schnittstelle einer three.js-Kurve (getLength, getPointAt, getSpacedPoints) für Prüfwerkzeuge
  function mkPoly(pts) {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const len = cum[cum.length - 1];
    const seg = s => { let lo = 0, hi = pts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; } return lo; };
    const at = (s, out = V()) => { if (s <= 0) return out.copy(pts[0]); if (s >= len) return out.copy(pts[pts.length - 1]); const i = seg(s), d = cum[i + 1] - cum[i]; return out.copy(pts[i]).lerp(pts[i + 1], d > 1e-9 ? (s - cum[i]) / d : 0); };
    const tan = (s, out = V()) => { const a = at(Math.max(0, Math.min(len - .5, s - .25))), b = at(Math.min(len, Math.max(.5, s + .25))); return out.subVectors(b, a).normalize(); };
    const near = (x, z) => { let bi = 0, bd = 1e9; for (let i = 0; i < pts.length; i++) { const d = Math.hypot(pts[i].x - x, pts[i].z - z); if (d < bd) { bd = d; bi = i; } } return { s: cum[bi], d: bd }; };
    return { pts, cum, len, at, tan, near, getLength: () => len, getPointAt: (u, out) => at(u * len, out || V()), getPoint: (u, out) => at(u * len, out || V()),
      getSpacedPoints: n => Array.from({ length: n + 1 }, (_, k) => at(len * k / n)), getPoints: n => Array.from({ length: n + 1 }, (_, k) => at(len * k / n)) };
  }
  // Korridor zwischen zwei Punkten (Szenenkoordinaten) um die Hindernisse (Rechtecke mit Rand cl) herum, im Boden (disc): Rastersuche (A*, Raster .25, Wege nahe an
  // Bauteilen kosten mehr), danach auf die Eckpunkte vereinfacht (längste freie Sichtlinie). Die Eckpunkte dienen nur als weiche Leitpunkte der Ausgleichskurve.
  function corridor(a, b, obs, disc, cl) {
    const res = .25, x0 = disc.cx - disc.R, z0 = disc.cz - disc.R, nx = Math.floor(2 * disc.R / res) + 1, nz = nx, N = nx * nz, blk = new Uint8Array(N);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (Math.hypot(x0 + i * res - disc.cx, z0 + j * res - disc.cz) > disc.R - 1.1) blk[j * nx + i] = 1;
    for (const o of obs) {
      const i0 = Math.max(0, Math.floor((o[0] - cl - x0) / res)), i1 = Math.min(nx - 1, Math.ceil((o[1] + cl - x0) / res)), j0 = Math.max(0, Math.floor((o[2] - cl - z0) / res)), j1 = Math.min(nz - 1, Math.ceil((o[3] + cl - z0) / res));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) blk[j * nx + i] = 1;
    }
    // Anfang und Ende liegen oft knapp an Bauteilen (Stationen): dort frei geben statt weit entfernt einzurasten
    for (const p of [a, b]) { const ci = Math.round((p[0] - x0) / res), cj = Math.round((p[1] - z0) / res), r = Math.ceil(.7 / res); for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const i = ci + di, j = cj + dj; if (i >= 0 && j >= 0 && i < nx && j < nz && di * di + dj * dj <= r * r) blk[j * nx + i] = 0; } }
    const dst = new Float32Array(N).fill(12); for (let k = 0; k < N; k++) if (blk[k]) dst[k] = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; let d = dst[k]; if (i) d = Math.min(d, dst[k - 1] + 1); if (j) { d = Math.min(d, dst[k - nx] + 1); if (i) d = Math.min(d, dst[k - nx - 1] + 1.4); if (i < nx - 1) d = Math.min(d, dst[k - nx + 1] + 1.4); } dst[k] = d; }
    for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; let d = dst[k]; if (i < nx - 1) d = Math.min(d, dst[k + 1] + 1); if (j < nz - 1) { d = Math.min(d, dst[k + nx] + 1); if (i < nx - 1) d = Math.min(d, dst[k + nx + 1] + 1.4); if (i) d = Math.min(d, dst[k + nx - 1] + 1.4); } dst[k] = d; }
    const cell = p => [clamp(Math.round((p[0] - x0) / res), 0, nx - 1), clamp(Math.round((p[1] - z0) / res), 0, nz - 1)];
    const snap = c => { if (!blk[c[1] * nx + c[0]]) return c; for (let r = 1; r < 60; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const i = c[0] + di, j = c[1] + dj; if (i >= 0 && j >= 0 && i < nx && j < nz && !blk[j * nx + i]) return [i, j]; } return c; };
    const s0 = snap(cell(a)), g0 = snap(cell(b)), S = s0[1] * nx + s0[0], G = g0[1] * nx + g0[0];
    const gs = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N), heap = [];
    const push = (f, k) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const t = heap[0], l = heap.pop(); if (heap.length) { heap[0] = l; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= heap.length) break; if (c + 1 < heap.length && heap[c + 1][0] < heap[c][0]) c++; if (heap[i][0] <= heap[c][0]) break; [heap[i], heap[c]] = [heap[c], heap[i]]; i = c; } } return t; };
    const gi = G % nx, gj = (G / nx) | 0, hx = k => Math.hypot((k % nx) - gi, ((k / nx) | 0) - gj);
    gs[S] = 0; push(hx(S), S);
    while (heap.length) {
      const [, k] = pop(); if (closed[k]) continue; closed[k] = 1; if (k === G) break;
      const ki = k % nx, kj = (k / nx) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const i = ki + di, j = kj + dj; if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        const q = j * nx + i; if (blk[q] || closed[q] || (di && dj && (blk[kj * nx + i] || blk[j * nx + ki]))) continue;
        const near = Math.max(0, 8 - dst[q]) / 8, g = gs[k] + (di && dj ? 1.414 : 1) * (1 + 2 * near * near);
        if (g < gs[q]) { gs[q] = g; from[q] = k; push(g + hx(q), q); }
      }
    }
    if (from[G] < 0 && G !== S) return [a.slice(), b.slice()];
    const path = []; for (let k = G; k >= 0; k = from[k]) path.push([x0 + (k % nx) * res, z0 + ((k / nx) | 0) * res]);
    path.reverse();
    const pts = [a.slice(), ...path.slice(1, -1), b.slice()];
    const free = (p, q) => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.ceil(L / .15)); for (let t = 1; t < n; t++) { const x = p[0] + (q[0] - p[0]) * t / n, z = p[1] + (q[1] - p[1]) * t / n; const c = cell([x, z]); if (blk[c[1] * nx + c[0]]) return false; } return true; };
    const out = [pts[0]]; let i = 0;
    while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !free(pts[i], pts[j])) j--; out.push(pts[j]); i = j; }
    return out;
  }
  // Szenenlauf (Szenenkoordinaten): Eingang (oder Start der Szene, def.dotStart) → Stationen der Lesestellen bzw. Wegpunkte der Szene (def.way, cfg.faden.way: [x, z, k],
  // nach k Lesestellen) → rechts um die Bauteile herum → Ausgang. Ergebnis: Polygonzug (Szenenkoordinaten, y = THREAD_Y; bei dotStart vorn die Punkte im Raum)
  let R_USED = 0;
  function routeFor(I) {
    const def = I.def, f = I.fcfg || {}, disc = I.disc, obsB = obstaclesOf(I), obs = obsB.map(b => [b.min.x, b.max.x, b.min.z, b.max.z]);
    const st = I.stations || [], way = [...(def.way || []), ...(pickN(f.way) || [])].map(w => ({ p: [w[0], w[1]], k: w[2] === undefined ? 1e9 : w[2], w: w[3] || 4 }));
    const nodes = [];
    for (let i = 0; i <= st.length; i++) {
      for (const w of way) if ((w.k === i) || (i === st.length && w.k > st.length)) nodes.push({ p: w.p, w: w.w });
      if (i < st.length && !st[i].same) nodes.push({ p: st[i].p, w: pickN(f.stW) || LAY.ST_W, st: st[i] });
    }
    const X = I.outL;
    const start = def.dotStart ? def.dotStart.p : I.inL, t0 = def.dotStart ? def.dotStart.t : [0, -1];
    // Teilstücke zwischen den Knoten: Korridor um die Bauteile (beginnt nach dem geraden Eintritt und endet vor dem geraden Austritt), seine Ecken als weiche Leitpunkte
    const cl = (f.clear !== undefined ? f.clear : CLEAR * .6) + .1, all = [{ p: start }, ...nodes, { p: X }], full = [all[0]];
    const sA = [start[0] + t0[0] * 1.6, start[1] + t0[1] * 1.6], xB = [X[0], X[1] + 1.6];
    for (let k = 1; k < all.length; k++) {
      const a = k === 1 ? sA : all[k - 1].p, b = k === all.length - 1 ? xB : all[k].p;
      const c = corridor(a, b, obs, disc, cl);
      for (let q = 1; q < c.length - 1; q++) full.push({ p: c[q], w: LAY.GUIDE_W, guide: true });
      full.push(all[k]);
    }
    const P = fairPath(full, { t0, t1: [0, -1], obs, disc, lead: 1.2, clear: f.clear, a2: pickN(f.a2) || LAY.A2 });
    const head = def.dotStart && def.dotStart.head ? def.dotStart.head.map(q => q.clone()) : [];
    // gleichmäßig neu abtasten (Abstand .2): keine doppelten oder sehr nahen Punkte (die Catmull-Rom-Kurve des Bandes bildet dort sonst kleine Schleifen)
    const flat0 = mkPoly(P.map(q => V(q[0], THREAD_Y, q[1]))), nR0 = Math.max(4, Math.round(flat0.len / .2));
    // keine engen Kehren: Mindestradius 2,6 (örtlich geglättet), danach erneut gleichmäßig
    // Stationen bleiben bei der Entspannung fest (der Lauf muss sie treffen), gerundet wird um sie herum
    const samp0 = Array.from({ length: nR0 + 1 }, (_, k) => flat0.at(flat0.len * k / nR0)), fixIdx = [];
    for (const nd of nodes) if (nd.st && P[nd.j]) { let bi = 0, bd = 1e9; samp0.forEach((q, k) => { const d = Math.hypot(q.x - P[nd.j][0], q.z - P[nd.j][1]); if (d < bd) { bd = d; bi = k; } }); fixIdx.push(bi); }
    // möglichst großer Mindestradius (ruhiger Faden, auch auf der Karte ohne Haken): von R_MAX abwärts der größte, bei dem der Faden kein Bauteil schneidet
    const mOb = Math.min(.3, cl * .6), hitsN = P2 => P2.reduce((n, q) => n + (obs.some(b => q.x > b[0] - mOb && q.x < b[1] + mOb && q.z > b[2] - mOb && q.z < b[3] + mOb) ? 1 : 0), 0);
    const base0 = relaxRadius(samp0, LAY.R_MIN, 2, 4000), hit0 = hitsN(base0), hitsObs = P2 => hitsN(P2) > hit0;      // enge Durchlässe (faden.clear) zählen nicht gegen einen größeren Radius
    let relaxed = null; const rTop = pickN(f.rMin) || LAY.R_MAX, rLow = LAY.R_MIN;
    for (let rr = rTop; rr >= rLow - 1e-6; rr -= .5) { const q = relaxRadius(samp0, rr, 2, 4000); relaxed = q; R_USED = rr; if (!hitsObs(q) && minRadiusOf(q, p => [p.x, p.z]).r > rr * .8) break; }
    if (hitsObs(relaxed) || minRadiusOf(relaxed, p => [p.x, p.z]).r < R_USED * .8) { relaxed = base0; R_USED = rLow; }
    const flat = mkPoly(relaxed), nR = Math.max(4, Math.round(flat.len / .2)), Pr = Array.from({ length: nR + 1 }, (_, k) => flat.at(flat.len * k / nR));
    const pts = [...head, ...Pr.slice(head.length ? 1 : 0)];
    // Szenen mit Höhe (Treppe): def.lift(x, z) hebt den Lauf über den Boden, der Faden klettert mit
    if (def.lift) for (const q of pts) q.y = THREAD_Y + def.lift(q.x, q.z);
    // Ebenen im Bild (faden.hub, aus werkzeug/beats/*.mjs: [x0, x1, z0, z1, Höhe, Auslauf in x, Auslauf in z]): der Lauf steigt auf Tische, Regale, Ablagen und läuft dort, der Punkt steht im Motiv statt davor
    const hub = pickN(f.hub); if (hub && hub.length) for (const q of pts) { let hy = 0; for (const h of hub) { const dx = Math.max(h[0] - q.x, 0, q.x - h[1]), dz = Math.max(h[2] - q.z, 0, q.z - h[3]), sx = Math.max(0, 1 - dx / (h[5] || .01)), sz = Math.max(0, 1 - dz / (h[6] || .01)); hy = Math.max(hy, h[4] * (sx * sx * (3 - 2 * sx)) * (sz * sz * (3 - 2 * sz))); } q.y = Math.max(q.y, THREAD_Y + hy); }
    const R = mkPoly(pts);
    R.minR = minRadiusOf(Pr); R.rUsed = R_USED;
    R.st = st;
    let sMin = 0;
    for (const o of st) {
      const nd = nodes.find(n => n.st === o) || nodes.find(n => n.st && n.st.p === o.p), q = nd && full.includes(nd) && P[nd.j] ? P[nd.j] : o.p;
      let bi = -1, bd = 1e9; for (let i = 0; i < R.pts.length; i++) { if (R.cum[i] < sMin - 1e-6) continue; const d = Math.hypot(R.pts[i].x - q[0], R.pts[i].z - q[1]); if (d < bd) { bd = d; bi = i; } }
      o.s = bi >= 0 ? R.cum[bi] : sMin; o.d = bd; sMin = o.s;
    }
    R.nodes = nodes; R.obs = obsB;
    if (R.minR.r < 2.5) dbg("Fadenlauf " + I.name + ": kleinster Radius " + R.minR.r.toFixed(2));
    return R;
  }
  // Haltezeit je Lesestelle in vh (Standzeit: mindestens 40 vh je 100 Zeichen, hier etwas mehr)
  const holdVh = s => s.hold !== undefined ? s.hold : Math.max(HOLD_MIN, textChars(s) * HOLD_PER_CHAR);
  // Tempo des Punktes (Erik 23.10.2026: „gleiches Tempo je Scrollweg“): DOT_V Welteinheiten je vh, in Flügen genau, in den Szenen so, dass der Lauf die Länge der Szene füllt
  // (folge.js: Längen so gewählt, dass dort fast dasselbe Tempo herauskommt). An Lesestellen sinkt das Tempo weich auf SLOW_F (Schulter SLOW_SH Einheiten), dort steht die Kamera.
  const { DOT_V, SLOW_F, SLOW_SH, GROUP_GAP } = BAHN;               // stationen.js
  // Zeitplan der Szene (vh ab Szenenanfang): Lage des Punktes (sAt), Bauzustand (bAt), Lesestellen und Ansichten mit Haltefenster (an)
  function timeline(I) {
    const def = I.def, R = I.route, T = I.cfg.len[narrow ? "n" : "d"], keyed = !!I.cfg.keyed, an = [];
    const seen = new Set();
    def.keys.forEach((k, ki) => {
      if (k.stop && !seen.has(k.stop)) { seen.add(k.stop); const o = R.st.find(q => q.stop === k.stop); an.push({ kind: "text", ki, stop: k.stop, s: o && o.s !== undefined ? o.s : null, hold: holdVh(k.stop), b: k.stop.b }); }
      else if (k.view) an.push({ kind: "view", ki, key: k, s: R.near(k.view.at[0], k.view.at[1]).s, hold: k.view.hold || 40, b: k.b, b1: k.view.b1 !== undefined ? k.view.b1 : k.b });
    });
    const slow = (def.slow || []).map(o => ({ kind: "slow", s: R.near(o.at[0], o.at[1]).s, b: o.b, f: o.f || .4 }));
    // Eröffnung: vorne der Schlüsselteil (Startbild, Podest, Aufbau, Tablett), danach läuft der Punkt vom Statuspunkt zum Ausgang
    let Tpre = 0, preAn = null;
    const dotAn = an.filter(a => !keyed && a.s !== null);
    // Zonen (in s): Lesestellen mit gleicher Station bilden eine Zone, ihre Haltefenster folgen nacheinander
    const zones = [];
    for (const a of dotAn) { const z = zones.find(q => Math.abs(q.s - a.s) < .6); if (z) z.list.push(a); else zones.push({ s: a.s, list: [a], f: SLOW_F }); }
    for (const z of zones) z.H = z.list.reduce((x, a) => x + a.hold, 0) + (z.list.length - 1) * GROUP_GAP;
    for (const o of slow) if (!zones.some(q => Math.abs(q.s - o.s) < .6)) zones.push({ s: o.s, list: [], f: o.f, H: 0, slowOnly: true });
    zones.sort((a, b) => a.s - b.s);
    let tDot0 = 0, tVis = 0;
    if (keyed) {
      const tab = an[an.length - 1];
      tab.hold = holdVh(tab.stop);
      tDot0 = T - R.len / DOT_V - .0001;                 // vorläufig, genau unten
    }
    const L = R.len, NS = Math.max(400, Math.ceil(L / .04)), dsS = L / NS;
    const fz = (z, V0) => z.slowOnly ? z.f : Math.min(z.f, 1.1 / Math.max(1e-6, V0 * z.H));             // Tempo in der Zone: der Punkt kriecht dort höchstens gut eine Einheit
    // Tempo (Anteil von V0) weich überblendet: 1 auf freier Strecke, f in der Zone, dazwischen eine Kosinus-Schulter; Zeit je Weg = 1 / Tempo
    const slowAt = (s, V0) => { let g = 1; for (const z of zones) { const f = fz(z, V0), hw = z.slowOnly ? .25 : f * V0 * z.H / 2, sh = z.slowOnly ? 1.6 : SLOW_SH, d = Math.abs(s - z.s); const pl = d <= hw ? 1 : d < hw + sh ? .5 * (1 + Math.cos(PI * (d - hw) / sh)) : 0; g = Math.min(g, 1 - (1 - f) * pl); } return 1 / g; };
    const runT = V0 => { let t = 0; for (let k = 0; k < NS; k++) t += slowAt((k + .5) * dsS, V0) * dsS / V0; return t; };
    let V0 = DOT_V, Tavail = T;
    if (keyed) {
      // Schlüsselteil: Dauer so, dass der Punkt danach mit DOT_V zum Ausgang läuft; Tablett-Halt und Wechsel zur Verfolgung dazwischen
      const tab = an[an.length - 1], Trun = runT(DOT_V);
      const rOut = I.cfg.rampOut || RAMP_OUT;
      Tpre = Math.max(200, T - Trun - tab.hold - rOut);
      tab.h0 = Tpre; tab.h1 = Tpre + tab.hold;
      tDot0 = tab.h1 + rOut; tVis = tab.h1 + rOut * .7; Tavail = T - tDot0;
      for (const a of an.slice(0, -1)) { const u = a.ki < def.keys.length ? def.keys[a.ki].u : 0; a.h0 = a.h1 = Tpre * (def.pOfU ? def.pOfU(u) : u); }
      preAn = { T: Tpre };
    }
    for (let it = 0; it < 40; it++) { const t = runT(V0); V0 = clamp(V0 * t / Tavail, DOT_V * .4, DOT_V * 3); }
    if (Math.abs(V0 / DOT_V - 1) > .12) console.warn("Punkttempo in", I.name, (V0 / DOT_V * 100).toFixed(0) + " % von DOT_V (Länge in stationen.js: " + Math.round(runT(DOT_V) + (T - Tavail)) + " vh)");
    // Zeit je Bogenlänge (Tabelle) und Umkehrung
    const tS = new Float64Array(NS + 1); for (let k = 0; k < NS; k++) tS[k + 1] = tS[k] + slowAt((k + .5) * dsS, V0) * dsS / V0;
    const tOfS = s => { const f = clamp(s / dsS, 0, NS), k = Math.min(NS - 1, Math.floor(f)); return tDot0 + tS[k] + (tS[k + 1] - tS[k]) * (f - k); };
    const sOfT = t => { const u = t - tDot0; if (u <= 0) return 0; if (u >= tS[NS]) return L; let lo = 0, hi = NS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tS[m] <= u) lo = m; else hi = m; } return (lo + (u - tS[lo]) / Math.max(1e-12, tS[hi] - tS[lo])) * dsS; };
    // Haltefenster: Zone um ihre Mitte, Lesestellen einer Zone nacheinander
    for (const z of zones) {
      if (z.slowOnly) { z.t = tOfS(z.s); continue; }
      const hw = fz(z, V0) * V0 * z.H / 2, ta = tOfS(z.s - hw), tb = tOfS(z.s + hw), sc = (tb - ta) / z.H;
      let t = ta; for (const a of z.list) { a.h0 = t; a.h1 = t + a.hold * sc; t = a.h1 + GROUP_GAP * sc; }
    }
    // Bauzustand: monotone Kurve durch (0, b beim Eintreffen), die Haltefenster (Text steht ab stop.b) und die Langsamstellen (Gerwing: Stempel), zuletzt bMax
    const kn = [];
    const firstB = an.length ? an[0].b : slow.length ? slow[0].b : I.bMax;
    const bIn = keyed ? I.b0 : I.b0 + .5 * Math.max(0, firstB - I.b0);
    kn.push([0, bIn]);
    if (keyed) {
      const NP = 60; for (let k = 1; k <= NP; k++) { const q = k / NP; kn.push([Tpre * q, clamp(def.bOfU(def.uOfP(q)), 0, 1)]); }
    }
    const evs = [];
    for (const a of an) if (!keyed || a === an[an.length - 1]) evs.push({ t0: a.h0, t1: a.h1, b0: a.b, b1: a.kind === "view" ? a.b1 : a.b });
    for (const z of zones) if (z.slowOnly) { const o = slow.find(q => Math.abs(q.s - z.s) < .6); evs.push({ t0: z.t, t1: z.t, b0: o.b, b1: o.b }); }
    for (const o of slow) { const z = zones.find(q => !q.slowOnly && Math.abs(q.s - o.s) < .6); if (z && z.list.length) { const a = z.list[0]; evs.push({ t0: (a.h0 + a.h1) / 2, t1: (a.h0 + a.h1) / 2, b0: o.b, b1: o.b }); } }
    evs.sort((a, b) => a.t0 - b.t0);
    for (const e of evs) {
      const lastK = kn[kn.length - 1];
      if (e.t0 <= lastK[0] + 1) continue;
      kn.push([e.t0, Math.max(lastK[1], e.b0)]);
      if (e.t1 > e.t0 + 1) kn.push([e.t1, Math.max(e.b0, e.b1, e.b0 + .004)]);
    }
    if (kn[kn.length - 1][0] < T - 1) kn.push([T, Math.max(kn[kn.length - 1][1], I.bMax)]);
    for (let k = 1; k < kn.length; k++) kn[k][1] = Math.max(kn[k][1], kn[k - 1][1]);
    const bP = pchip(kn.map(q => q[0]), kn.map(q => q[1]));
    return { lenNeed: Math.round(runT(DOT_V) + (T - Tavail)), T, Tpre, preAn, tDot0, tVis, V0, an, zones, sAt: sOfT, tOfS, bAt: t => clamp(bP(t), 0, I.bMax), bIn, bEnd: clamp(bP(T), 0, I.bMax) };
  }
  function buildPath(I) {
    const def = I.def, k = aspect < 1.25 ? Math.pow(1.25 / aspect, .55) : 1, nar = aspect < 1;
    const cams = [], tgts = [];
    for (const key of def.keys) {
      if (key.stop) { const ps = readingPose(I, key.stop); key.stop.pose = ps; cams.push(ps.cam); tgts.push(ps.tgt); continue; }
      // Anfahrt auf eine Lesestelle der Szene (Ausschnitte): Lesestellung, um back weiter weg und um up höher
      if (key.fromStop) { const ps = readingPose(I, key.fromStop), off = ps.cam.clone().sub(ps.tgt); cams.push(ps.tgt.clone().addScaledVector(off, key.back || 1.5).add(V(0, key.up || 0, 0))); tgts.push(ps.tgt.clone()); continue; }
      if (nar && key.camN) { cams.push(key.camN.clone()); tgts.push(key.tgtN.clone()); continue; }
      const off = key.cam.clone().sub(key.tgt);
      cams.push(key.tgt.clone().addScaledVector(off, k)); tgts.push(key.tgt.clone());
    }
    if (cams.length === 1) { cams.push(cams[0].clone()); tgts.push(tgts[0].clone()); }
    const mp = monoPath(cams, tgts); I.camC = { getPoint: mp.cam }; I.tgtC = { getPoint: mp.tgt };
    I.nK = def.keys.length;
    retime(I);
  }
  // Kamera in der Szene, q = Anteil des Szenenabschnitts (0 … 1), Szenenkoordinaten
  function localPose(I, q, cam, tgt) {
    const def = I.def, u = def.uOfP(clamp(q, 0, 1)), t = I.nK > 1 ? clamp(def.idxOfU(u) / (I.nK - 1), 0, 1) : 0;
    I.camC.getPoint(t, cam); I.tgtC.getPoint(t, tgt);
    return { u, b: clamp(def.bOfU(u), 0, 1) };
  }

  // ---------- Lage der Inseln: Fluss in zwei Reihen (Kamera-Umbau 23.10.2026, Erik: „Flusslauf mit Höhenlinien“) ----------
  // Die Szenen liegen als runde Inseln (Radius cfg.R, Gerwing etwas größer) in zwei Reihen: die erste fließt nach rechts (+x), die mittlere Insel liegt im Scheitel, die zweite
  // Reihe fließt zurück; danach mündet der Fluss in einer weiten Schleife in der Mitte der Karte im roten Schlusspunkt, links daneben steht die Wortmarke. Jede Insel hat
  // feste Türen (cfg.door: seitliche Lage von Eingang vorn und Ausgang hinten), Laufrichtung = Blickrichtung der Szene (−z der Szene). Zwischen zwei Inseln einer Reihe
  // fließt der Fluss als immer gleicher ruhiger S-Bogen (Länge LAY.FL, seitlich LAY.FA zurück: die Insel versetzt den Lauf nach rechts, der Fluss zurück; gleiche Amplitude),
  // um die Scheitelinsel in Viertelbögen (Radius LAY.RT, die Kamera dreht dort langsam mit). Lage und Fluss hängen nur von der Szenenfolge ab, nicht vom Inhalt der Szenen:
  // Fluglängen stehen damit beim Laden fest.
  const LAY = BAHN;                                                // Fluss: Zahlen in stationen.js (BAHN)
  const PAD = 1.2;                // Rand zwischen Inhalt und Kante der Parzelle
  let LAYC = null;
  const hdir = yaw => V(Math.sin(yaw), 0, -Math.cos(yaw));       // Laufrichtung zur Gier (wie yawOf)
  const hright = yaw => V(Math.cos(yaw), 0, Math.sin(yaw));      // rechts davon (Blick von oben)
  const setXf = I => { I.R4.makeRotationY(I.rot); I.M4.copy(I.R4).setPosition(I.O); };
  const pickN = v => v && !Array.isArray(v) && typeof v === "object" ? v[narrow ? "n" : "d"] : v;
  const doorOf = cfg => pickN(cfg.door) || [-6, 6];
  function islandAt(C, yaw, R, door) {
    const f = hdir(yaw), r = hright(yaw), de = Math.sqrt(Math.max(0, R * R - door[0] * door[0])), dx = Math.sqrt(Math.max(0, R * R - door[1] * door[1]));
    return { C, yaw, R, door, E: C.clone().addScaledVector(r, door[0]).addScaledVector(f, -de), X: C.clone().addScaledVector(r, door[1]).addScaledVector(f, dx) };
  }
  // Flussstück von P0 (Richtung y0) nach P1 (Richtung y1) durch Leitpunkte (weich): Ausgleichskurve, an beiden Enden gerade
  function riverPath(P0, y0, P1, y1, guides = []) {
    const t0 = hdir(y0), t1 = hdir(y1);
    const P = fairPath([{ p: [P0.x, P0.z] }, ...guides.map(g => ({ p: [g.x, g.z], w: g.w || 1 })), { p: [P1.x, P1.z] }], { t0: [t0.x, t0.z], t1: [t1.x, t1.z], ds: .5, lead: 2, a2: .0005 });
    const f = mkPoly(P.map(q => V(q[0], THREAD_Y, q[1]))), n = Math.max(4, Math.round(f.len / .4));
    return mkPoly(Array.from({ length: n + 1 }, (_, k) => f.at(f.len * k / n)));
  }
  // Viertel- bzw. Halbbogen nach rechts: Leitpunkte auf dem Kreis (Radius r) nach einem geraden Stück l0
  function arcGuides(P0, y0, r, ang, l0) {
    const f = hdir(y0), rt = hright(y0), O = P0.clone().addScaledVector(f, l0).addScaledVector(rt, r), out = [];
    for (let k = 0; k <= 8; k++) { const a = ang * k / 8; out.push(O.clone().addScaledVector(rt, -r * Math.cos(a)).addScaledVector(f, r * Math.sin(a))); }
    return out;
  }
  function layoutOf() {
    const n = INST.length, key = narrow + ":" + n;
    if (LAYC && LAYC.key === key) return LAYC;
    const cf = INST.map(I => I.cfg), isl = [], rivers = [null], apex = Math.floor(n / 2);
    isl.push(islandAt(V(0, 0, 0), PI / 2, cf[0].R || 18, doorOf(cf[0])));
    for (let i = 1; i < n; i++) {
      const A = isl[i - 1], R = cf[i].R || 18, door = doorOf(cf[i]), turn = n > 3 && (i === apex || i === apex + 1);
      const y1 = A.yaw + (turn ? PI / 2 : 0), f0 = hdir(A.yaw), r0 = hright(A.yaw);
      let E, guides = [];
      if (!turn) E = A.X.clone().addScaledVector(f0, LAY.FL).addScaledVector(r0, -LAY.FA);
      else { E = A.X.clone().addScaledVector(f0, LAY.L0 + LAY.RT).addScaledVector(r0, LAY.RT + LAY.L1); guides = arcGuides(A.X, A.yaw, LAY.RT, PI / 2, LAY.L0).slice(1, -1); }
      const f1 = hdir(y1), r1 = hright(y1), de = Math.sqrt(Math.max(0, R * R - door[0] * door[0]));
      const C = E.clone().addScaledVector(r1, -door[0]).addScaledVector(f1, de);
      isl.push(islandAt(C, y1, R, door));
      rivers.push(riverPath(A.X, A.yaw, E, y1, guides));
    }
    LAYC = { key, isl, rivers, apex };
    return LAYC;
  }
  const slotOf = idx => layoutOf().isl[idx];
  function extentOf(I) {
    const box = new THREE.Box3();
    const cl = (x0, x1, z0, z1) => I.clip ? [Math.max(x0, I.clip[0]), Math.min(x1, I.clip[1]), Math.max(z0, I.clip[2]), Math.min(z1, I.clip[3])] : [x0, x1, z0, z1];
    for (const s of I.sheetBox) { const [x0, x1, z0, z1] = cl(...s); if (x1 > x0 && z1 > z0) { box.expandByPoint(V(x0, 0, z0)); box.expandByPoint(V(x1, 0, z1)); } }
    for (const bb of [I.b0, I.bMax, 1]) {
      I.M.update(bb, 1e9);
      const v = V(), { posT, nT } = I.M.dbg;
      for (let j = 0; j < nT.length; j++) {
        v.set(posT[j * 3], posT[j * 3 + 1], posT[j * 3 + 2]);
        if (I.clip && (v.x < I.clip[0] || v.x > I.clip[1] || v.z < I.clip[2] || v.z > I.clip[3])) continue;
        box.expandByPoint(v);
      }
    }
    I.M.update(I.b0, 0);
    return box;
  }
  // Inhalt der Szene (Szenenkoordinaten x0, x1, z0, z1): alle Teile (ohne die Wurzel) in mehreren Zuständen, alle Drucke, im Ausschnitt der Szene
  function contentRect(I) {
    const cl = I.clip || [-1e5, 1e5, -1e5, 1e5], r = [1e9, -1e9, 1e9, -1e9], v = V();
    const add = (x, z) => { r[0] = Math.min(r[0], x); r[1] = Math.max(r[1], x); r[2] = Math.min(r[2], z); r[3] = Math.max(r[3], z); };
    const nB = 8;
    for (let k = 0; k <= nB; k++) {
      const bb = I.b0 + (I.bMax - I.b0) * k / nB;
      I.M.update(bb, 1e9);
      const { posT, nT, nodes } = I.M.dbg;
      for (let j = 0; j < nT.length; j++) {
        if (nodes[nT[j]] === nodes[0]) continue;
        v.set(posT[j * 3], posT[j * 3 + 1], posT[j * 3 + 2]);
        if (v.x < cl[0] || v.x > cl[1] || v.z < cl[2] || v.z > cl[3]) continue;
        add(v.x, v.z);
      }
      for (const pr of I.prints) {
        const xs = [], zs = [];
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { v.set(sx * pr.w / 2, sy * pr.h / 2, 0).applyMatrix4(pr.mesh.matrix); xs.push(v.x); zs.push(v.z); }
        const a = Math.max(Math.min(...xs), cl[0]), b = Math.min(Math.max(...xs), cl[1]), c = Math.max(Math.min(...zs), cl[2]), d = Math.min(Math.max(...zs), cl[3]);
        if (b > a && d > c) { add(a, c); add(b, d); }
      }
    }
    I.M.update(I.b0, 0);
    return r;
  }
  const ptX = a => a.isVector3 ? a.x : a[0], ptZ = a => a.isVector3 ? a.z : a.length === 3 ? a[2] : a[1];
  // Parzelle der Szene (Szenenkoordinaten): Rechteck um den Inhalt samt Rand (die Bögen der Szene bleiben darin, sie liegen auf dem runden Boden)
  function cellOf(I) {
    const c = contentRect(I), [x0, x1, z0, z1] = c;
    I.content = c;
    return [x0 - PAD, x1 + PAD, z0 - PAD, z1 + PAD];
  }
  // Szene in ihre Insel setzen: Mitte des Bodens = Mitte des Inhalts (+ cfg.ctr), Blickrichtung der Szene = Laufrichtung der Insel. Eingang und Ausgang (Türen) in Szenenkoordinaten.
  function placeScene(I) {
    const sl = slotOf(I.idx), R = sl.R;
    I.slot = sl; I.cell = cellOf(I); I.lf = I.cell;
    const ctr = pickN(I.cfg.ctr) || [0, 0];
    const cx = (I.cell[0] + I.cell[1]) / 2 + ctr[0], cz = (I.cell[2] + I.cell[3]) / 2 + ctr[1];
    const far = Math.max(...[[0, 2], [0, 3], [1, 2], [1, 3]].map(([a, b]) => Math.hypot(I.cell[a] - cx, I.cell[b] - cz)));
    if (far > R + .01) console.warn("Insel zu klein für", I.name, "Inhalt bis", far.toFixed(1), "Radius", R);
    I.disc = { cx, cz, R };
    I.rot = -sl.yaw; I.theta = 0;
    const [xe, xx] = sl.door;
    I.inL = [cx + xe, cz + Math.sqrt(Math.max(0, R * R - xe * xe))]; I.outL = [cx + xx, cz - Math.sqrt(Math.max(0, R * R - xx * xx))];
    I.O.copy(sl.C).sub(V(cx, 0, cz).applyAxisAngle(UP, I.rot));
    setXf(I);
    I.fp = [sl.C.x - R, sl.C.x + R, sl.C.z - R, sl.C.z + R];
  }
  // Parzelle als runder Papierboden unter dem Bogen der Szene; die Bögen der Szene werden auf das Rechteck um den Inhalt zugeschnitten (Skalierung der Platte, Haarkante aus)
  function fitSheets(I, group, sheets, sheetBox) {
    const [x0, x1, z0, z1] = I.cell;
    sheets.forEach((g, i) => {
      const s = sheetBox[i], a = Math.max(s[0], x0), b = Math.min(s[1], x1), c = Math.max(s[2], z0), d = Math.min(s[3], z1);
      if (g.children[0]) g.children[0].visible = false;
      if (b > a && d > c) { g.scale.set((b - a) / (s[1] - s[0]), 1, (d - c) / (s[3] - s[2])); g.position.x = (a + b) / 2; g.position.z = (c + d) / 2; sheetBox[i] = [a, b, c, d]; }
      else { g.scale.set(1e-4, 1, 1e-4); sheetBox[i] = [s[0], s[0], s[2], s[2]]; }
    });
    const D = I.disc, pl = new THREE.Mesh(new THREE.CylinderGeometry(D.R, D.R, .03, 96), paperMaterial(PAL.plate));
    pl.position.set(D.cx, -.0192, D.cz);
    pl.add(new THREE.LineSegments(new THREE.EdgesGeometry(pl.geometry, 40), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .32, depthWrite: false })));
    group.add(pl); sheets.push(pl);
    frameOn(pl.material, I.O, null, I.rot); patchPaper(pl.material);
    return pl;
  }


  // Umgrenzungen der Teile (je Knoten) im Anfangs- und im Endzustand und der eigenen Objekte (Kabel usw.), Welt
  function partBoxes(I) {
    const out = [];
    for (const bb of [I.b0, I.bMax]) {
      I.M.update(bb, 1e9);
      const { posT, nT, nodes } = I.M.dbg, per = new Map(), v = V();
      for (let j = 0; j < nT.length; j++) {
        const nd = nodes[nT[j]]; if (nd === nodes[0]) continue;
        v.set(posT[j * 3], posT[j * 3 + 1], posT[j * 3 + 2]);
        if (I.clip && (v.x < I.clip[0] || v.x > I.clip[1] || v.z < I.clip[2] || v.z > I.clip[3])) continue;
        let bx = per.get(nd); if (!bx) { bx = new THREE.Box3(); per.set(nd, bx); } bx.expandByPoint(v.clone().applyMatrix4(I.M4));
      }
      out.push(...per.values());
    }
    const skip = new Set([I.M.geoT, I.M.geoL, I.M.geoR, I.M.geoG]);
    I.group.updateMatrixWorld(true);
    for (const ch of I.group.children) {
      if ((ch.geometry && skip.has(ch.geometry)) || I.sheets.includes(ch) || I.prints.some(pr => pr.mesh === ch)) continue;
      const bx = new THREE.Box3().setFromObject(ch); if (!bx.isEmpty() && bx.max.y > .05) out.push(bx);
    }
    I.M.update(I.b0, 0);
    return out;
  }
  // Umgrenzungen je Zustand b (Szenenkoordinaten, die Gruppe steht noch am Ursprung) für den Fadenlauf: je Teil im jeweiligen Zustand, nur was dort steht (flach liegende
  // Faltpläne zählen nicht), dazu stehende Textdrucke (Lettern der Überschrift sind Drucke an Gelenken ohne eigene Fläche) und die festen Zusatzobjekte (Kabel usw.)
  function stateBoxes(I, nSteps) {
    const steps = [], v = V();
    for (let k = 0; k <= nSteps; k++) {
      const bb = I.b0 + (I.bMax - I.b0) * k / nSteps, list = [], seen = new Set();
      I.M.update(bb, 1e9);
      const { posT, nT, nodes } = I.M.dbg, per = new Map();
      for (let j = 0; j < nT.length; j++) {
        const nd = nodes[nT[j]]; if (nd === nodes[0]) continue;
        v.set(posT[j * 3], posT[j * 3 + 1], posT[j * 3 + 2]);
        if (I.clip && (v.x < I.clip[0] || v.x > I.clip[1] || v.z < I.clip[2] || v.z > I.clip[3])) continue;
        let bx = per.get(nd); if (!bx) { bx = new THREE.Box3(); per.set(nd, bx); } bx.expandByPoint(v);
      }
      const add = (bx, pre) => {
        if (bx.max.y < .15) return;
        const key = pre + [bx.min.x, bx.max.x, bx.min.z, bx.max.z, bx.max.y].map(q => Math.round(q * 5)).join();
        if (!seen.has(key)) { seen.add(key); list.push(bx); }
      };
      for (const bx of per.values()) add(bx, "n");
      for (const pr of I.prints) {
        if (!(pr.t && pr.t.rows)) continue;
        // nur Drucke, die in diesem Zustand sichtbar sind (Überschriften blenden aus)
        let o = pr.sched ? pr.sched(bb) : (pr.on < 0 ? 1 : sm((bb - pr.on) / pr.fade));
        if (!pr.sched && pr.off !== undefined) o *= 1 - sm((bb - pr.off) / .03);
        if (o < .3) continue;
        const m = pr.mesh.matrix, bx = new THREE.Box3();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) bx.expandByPoint(v.set(sx * pr.w / 2, sy * pr.h / 2, 0).applyMatrix4(m));
        if (bx.max.y - bx.min.y < .1) continue;
        add(bx, "p");
      }
      steps.push({ b: bb, list });
    }
    const skip = new Set([I.M.geoT, I.M.geoL, I.M.geoR, I.M.geoG]), extra = [];
    I.group.updateMatrixWorld(true);
    for (const ch of I.group.children) {
      if ((ch.geometry && skip.has(ch.geometry)) || I.sheets.includes(ch) || I.prints.some(pr => pr.mesh === ch)) continue;
      const bx = new THREE.Box3().setFromObject(ch); if (!bx.isEmpty() && bx.max.y > .05) extra.push(bx);
    }
    I.M.update(I.b0, 0);
    return { steps, extra };
  }
  // ---------- Abschnitte der Seite: Szene, Flug, Szene, … ----------
  // Längen in vh: Szenen aus der Szenenfolge (cfg.len), Flüge aus der Länge des Flusses (Punkt mit DOT_V), Schluss aus der Mündung; alles steht beim Laden fest
  function makeSegments() {
    SEGS = []; let acc = 0; const LA = layoutOf();
    INST.forEach((I, i) => {
      const L = I.cfg.len[narrow ? "n" : "d"], T = i ? Math.round(LA.rivers[i].len / DOT_V) : 0;
      if (i) { SEGS.push({ kind: "t", i, v0: acc, v1: acc + T }); acc += T; }
      SEGS.push({ kind: "b", i, v0: acc, v1: acc + L }); acc += L;
    });
    TOTAL = acc;
    for (const s of SEGS) { s.p0 = s.v0 / TOTAL; s.p1 = s.v1 / TOTAL; }
    INST.forEach(I => { I.body = SEGS.find(s => s.kind === "b" && s.i === I.idx); I.trIn = SEGS.find(s => s.kind === "t" && s.i === I.idx) || null; });
    document.querySelector(".track").style.height = (TOTAL + 100) + "vh";
  }
  const segAt = p => { for (let k = 0; k < SEGS.length; k++) if (p <= SEGS[k].p1 + 1e-12) return k; return SEGS.length - 1; };
  // Szenenanfänge und benannte Stellen (cfg.anchors: Schlüsselnummer im Ausschnitt) als p
  function anchorsOf() {
    const out = [];
    for (const I of INST) {
      out.push({ name: I.name, label: I.cfg.label, p: I.body.p0, main: true });
      if (I.cfg.anchors) for (const [nm, ki] of Object.entries(I.cfg.anchors)) out.push({ name: nm, label: nm, p: null, inst: I, ki, main: true });
    }
    return out;
  }
  const anchorP = a => {
    if (a.p === null && a.inst) {
      ensure(a.inst.idx);
      const ki = typeof a.ki === "function" ? a.ki(a.inst.def) : a.ki, an = a.inst.tl && a.inst.tl.an.find(q => q.ki === ki && q.h0 !== undefined);
      a.p = an ? (a.inst.body.v0 + (an.h0 + an.h1) / 2) / TOTAL : a.inst.body.p0;
    }
    return a.p;
  };

  // Szene bis einschließlich Nummer i bauen (Reihenfolge nötig: die Lage hängt von der vorigen Szene ab)
  function ensure(i) {
    for (let k = 0; k <= Math.min(i, INST.length - 1); k++) if (!INST[k].built) build(INST[k]);
  }
  // Zustand der Seite bei p: Abschnitt, Szene, Übergangsanteil, b je Szene
  function stateAt(p) {
    const k = segAt(clamp(p, 0, 1)), sg = SEGS[k], q = clamp((p - sg.p0) / Math.max(1e-9, sg.p1 - sg.p0), 0, 1);
    return { k, sg, q, kind: sg.kind, i: sg.i };
  }
  function bOf(I, st) {
    if (!I.built) return 0;
    const tl = I.tl, bEnd = tl ? tl.bEnd : I.bMax;
    if (I.idx < st.i - 1 || (st.kind === "b" && I.idx < st.i)) return I.bMax;
    if (st.kind === "t" && I.idx === st.i - 1) return bEnd + (I.bMax - bEnd) * sm(st.q);
    if (st.kind === "b" && I.idx === st.i) return tl ? tl.bAt(st.q * (I.body.v1 - I.body.v0)) : I.b0;
    // Flug in die Szene: sie beginnt sich schon aufzubauen (aus der Mausperspektive ragt sie auf)
    if (st.kind === "t" && I.idx === st.i) return tl ? I.b0 + (tl.bIn - I.b0) * smoother(st.q) : I.b0;
    return I.b0;
  }
  // Übergangsanteil der Fahrt in Szene i (0 davor, 1 danach)
  function sInto(i, st) {
    const tr = INST[i] && INST[i].trIn; if (!tr) return 1;
    const k = SEGS.indexOf(tr);
    return st.k < k ? 0 : st.k > k ? 1 : st.q;
  }

  // Kamera, Ziel und Sichtfeld zu einem Zustand (Welt), ohne Atem
  const _c = V(), _t = V(), _c2 = V(), _t2 = V();
  const wrapPi = a => { a = (a + PI) % (2 * PI); if (a < 0) a += 2 * PI; return a - PI; };
  const yawOf = v => Math.atan2(v.x, -v.z), pitchOf = v => Math.atan2(-v.y, Math.hypot(v.x, v.z));
  const dirAng = (yaw, pitch, out) => out.set(Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  const smoother = x => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  const _c0 = V();
  // ---------- Kamera: eine stetige Spur über die ganze Seite (Kamera-Umbau 23.10.2026) ----------
  // Erik: „Die Kamera muss ein einziger Fluss sein, genauso stetig wie der Faden.“ Die Stellung (Ort und Blickpunkt) wird für jeden vh Scrollweg vorab gerechnet (je Szene ein
  // Stück: Flug in die Szene und die Szene selbst) und zwischen den Stützstellen kubisch gelesen. Sie setzt sich zusammen aus
  // - Grundstellung: folgt dem Punkt. Im Fluss knapp über dem Papier hinter ihm (Mausperspektive), Blick in die über YAW_WIN gemittelte Laufrichtung (zu YAW_K in die
  //   eigene Richtung des Fadens), so dreht sie in S-Bögen kaum und um den Scheitel gleichmäßig. In der Insel mit fester Blickrichtung der Szene etwas höher (FOLLOW),
  //   Wechsel weich über LAMBDA_T. Nie in einem Bauteil (Mindesthöhe, geglättet).
  // - Haltestellungen: Lesestellen frontal vor dem Text (readingPose), Ansichten (k.view); dort steht die Kamera still, solange gelesen wird. Aufstieg zur ersten Lesestelle
  //   über RAMP_IN, Rückkehr in die Verfolgung über RAMP_OUT, nahe Lesestellen gehen ohne Zwischenstellung ineinander über (JOIN).
  // - Nachführung: steht der Punkt außerhalb von DOT_FRAME, dreht der Blick weich mit (Totzone, keine Wirkung, solange er im Rahmen steht).
  // - Glättung: Gaußfilter (SMOOTH_S vh) über Ort und Blickpunkt; das Startbild und die Schlüsselfahrt der Eröffnung bleiben unberührt.
  // Rig-Vorgaben: stationen.js (RIG)
  const RAMP_IN = RIG.rampIn, RAMP_OUT = RIG.rampOut, RAMP_MID = RIG.rampMid, JOIN = RIG.join, LAMBDA_T = RIG.lambda, SMOOTH_S = RIG.smooth, FIN_DEC = 70;
  const CHASE = RIG.chase, FOLLOW = RIG.follow, YAW_K = RIG.yawK, YAW_WIN = RIG.yawWin, DOT_FRAME = RIG.frame;
  const segAtV = v => { for (let k = 0; k < SEGS.length; k++) if (v <= SEGS[k].v1 + 1e-9) return k; return SEGS.length - 1; };
  // Punkt bei Scrollweg v (vh der ganzen Seite): Lage (Welt, in out), Art, Insel, Laufrichtung (Gier); null, solange es ihn noch nicht gibt (Eröffnung vor dem Statuspunkt)
  function dotAt(v, out) {
    const sg = SEGS[segAtV(v)], LA = layoutOf();
    if (sg.kind === "t") { const R = LA.rivers[sg.i], q = clamp((v - sg.v0) / Math.max(1e-9, sg.v1 - sg.v0), 0, 1), s = q * R.len; R.at(s, out); return { kind: "t", i: sg.i, s, vis: true, yaw: yawOf(R.tan(s, _d0)) }; }
    const I = INST[sg.i]; if (!I.built || !I.tl) return null;
    const t = v - sg.v0, tl = I.tl;
    if (t < tl.tBase0) return null;
    const s = tl.sAt(t); I.route.at(s, out).applyMatrix4(I.M4);
    return { kind: "b", i: sg.i, I, s, t, vis: t >= tl.tVis, yaw: I.slot.yaw };
  }
  const _d0 = V(), _m0 = V(), _m1 = V(), _m2 = V(), _k0 = V(), _k1 = V(), _k2 = V();
  // Gier des Laufs bei v (Signal für die gemittelte Blickrichtung): Fluss = Richtung des Fadens, Insel = Blickrichtung der Szene (auch ungebaut, aus der Lage)
  function yawSignal(v) {
    v = clamp(v, 0, TOTAL);
    const sg = SEGS[segAtV(v)], LA = layoutOf();
    if (sg.kind === "t") { const R = LA.rivers[sg.i], q = clamp((v - sg.v0) / Math.max(1e-9, sg.v1 - sg.v0), 0, 1); return yawOf(R.tan(q * R.len, _d0)); }
    return LA.isl[sg.i].yaw;
  }
  // zwei Stellungen mischen: Ort linear, Blickrichtung über Gier und Neigung, Abstand zum Blickpunkt logarithmisch
  function mixP(c0, t0, c1, t1, w, cO, tO) {
    if (w <= 0) { cO.copy(c0); tO.copy(t0); return; }
    if (w >= 1) { cO.copy(c1); tO.copy(t1); return; }
    const D0 = _m0.subVectors(t0, c0), D1 = _m1.subVectors(t1, c1), y0 = yawOf(D0), p0 = pitchOf(D0), l0 = Math.log(Math.max(.3, D0.length())), l1 = Math.log(Math.max(.3, D1.length())), y1 = yawOf(D1), p1 = pitchOf(D1);
    cO.lerpVectors(c0, c1, w);
    dirAng(y0 + wrapPi(y1 - y0) * w, p0 + (p1 - p0) * w, _m2);
    tO.copy(cO).addScaledVector(_m2, Math.exp(l0 + (l1 - l0) * w));
  }
  // Mischung über den Blickpunkt: Ort und Blickpunkt linear (der Blick wandert vom einen Gegenstand zum anderen, beide bleiben dabei im Bild)
  function mixT(c0, t0, c1, t1, w, cO, tO) { if (w <= 0) { cO.copy(c0); tO.copy(t0); return; } if (w >= 1) { cO.copy(c1); tO.copy(t1); return; } cO.lerpVectors(c0, c1, w); tO.lerpVectors(t0, t1, w); }
  // Überschreitung von x über [lo, hi] mit weicher Totzone (δ): 0 im Rahmen, dann stetig steigend
  const softOver = (x, lo, hi, d = .05) => { const e = x > hi ? x - hi : x < lo ? x - lo : 0, a = Math.abs(e); return a <= 0 ? 0 : Math.sign(e) * (a < d ? a * a / (2 * d) : a - d / 2); };
  // Blick so nachführen, dass der Punkt D im Rahmen DOT_FRAME bleibt (Winkel, Totzone)
  const _kc = new THREE.PerspectiveCamera(32, 1, .1, 300);
  function keepDot(cam, tgt, D, k = 1) {
    if (k <= 0) return;
    // über die tatsächliche Bildlage (NDC): Überschreitung des Rahmens weich (Totzone), in Gier und Neigung zurückgedreht, drei Durchgänge
    _kc.fov = FOVC(); _kc.aspect = aspect; _kc.updateProjectionMatrix();
    const tanV = Math.tan(FOVC() * PI / 360), tanH = tanV * aspect, dist = tgt.distanceTo(cam);
    for (let it = 0; it < 3; it++) {
      _kc.position.copy(cam); _kc.lookAt(tgt); _kc.updateMatrixWorld();
      const q = _k1.copy(D).applyMatrix4(_kc.matrixWorldInverse);
      if (q.z > -.2) { // hinter der Kamera: in Richtung des Punktes drehen
        const Dv = _k0.subVectors(tgt, cam), yv = yawOf(Dv), pv = pitchOf(Dv), Dd = _k2.subVectors(D, cam);
        dirAng(yv + wrapPi(yawOf(Dd) - yv) * .5 * k, pv + (pitchOf(Dd) - pv) * .5 * k, _k2); tgt.copy(cam).addScaledVector(_k2, dist); continue;
      }
      const nx = q.x / (-q.z * tanH), ny = q.y / (-q.z * tanV);
      const ex = softOver(nx, -DOT_FRAME.x, DOT_FRAME.x, .08), ey = softOver(ny, DOT_FRAME.y0, DOT_FRAME.y1, .08);
      if (!ex && !ey) return;
      const Dv = _k0.subVectors(tgt, cam), yv = yawOf(Dv), pv = pitchOf(Dv);
      const dyaw = (Math.atan(nx * tanH) - Math.atan((nx - ex) * tanH)) * k, dpit = (Math.atan(ny * tanV) - Math.atan((ny - ey) * tanV)) * k;
      dirAng(yv + dyaw, pv - dpit, _k2); tgt.copy(cam).addScaledVector(_k2, dist);
    }
  }
  // ---------- Kamerabahn aus Stützstellen ----------
  // Je Szene eine Datei kamera/<szene>.js: Ort und Blickziel der Kamera RELATIV ZUM PUNKT, in Blickrichtung der Szene, über der Szenenzeit u. Eine glatte Kurve (pchip je Wert)
  // läuft durch diese Stützstellen; weil die Werte auf den Punkt bezogen sind, hält die Kamera nie an: auch beim Lesen schwimmt sie mit dem langsamen Punkt mit.
  // Zwischen den Szenen (und wo keine Stützstellen stehen) folgt die Kamera dem Punkt in Mausperspektive (RIG.chase) und blendet über KAM_FADE vh zur Kurve über.
  const KAM_FADE = 30, KAM_REF = { d: 1.6, n: .462 };
  function kameraKurve(I) {
    const key = narrow ? "n" : "d", dat = I.cfg.kamera && I.cfg.kamera[key]; if (!dat || dat.length < 2 || !I.body) return null;
    const sig = key + ":" + I.body.v0 + ":" + I.body.v1;
    if (I.kam && I.kam.sig === sig) return I.kam;
    const v0 = I.body.v0, len = I.body.v1 - v0, xs = [];
    dat.forEach((k, j) => { let x = v0 + k.u * len; if (j && x <= xs[j - 1] + .01) x = xs[j - 1] + .01; xs.push(x); });
    const fs = [0, 1, 2, 3, 4, 5].map(c => pchip(xs, dat.map(k => c < 3 ? k.c[c] : k.t[c - 3])));
    // o = 1 an zwei aufeinanderfolgenden Stützstellen: Text hat Vorrang, der Punkt darf dort aus dem Bild laufen (nur wo beides zugleich nicht passt); sonst bleibt der Punkt immer im Bild
    const pl = []; dat.forEach((k, j) => { if (k.o && dat[j + 1] && dat[j + 1].o) pl.push([xs[j], xs[j + 1]]); });
    return I.kam = { sig, xs, fs, x0: xs[0], x1: xs[xs.length - 1], pl };
  }
  // Länge der Blende zur Verfolgung am Anfang bzw. Ende der Kurve (0, wenn die Nachbarkurve ohne Lücke anschließt oder die Seite dort beginnt bzw. endet)
  function kameraBlende(I, K) {
    const pk = INST[I.idx - 1] && kameraKurve(INST[I.idx - 1]), nk = INST[I.idx + 1] && kameraKurve(INST[I.idx + 1]);
    return { f0: I.idx === 0 || (pk && pk.x1 >= K.x0 - 2.5) ? 0 : KAM_FADE, f1: I.idx === INST.length - 1 || (nk && nk.x0 <= K.x1 + 2.5) ? 0 : KAM_FADE };
  }
  // Fensterbreite: schmalere Bilder als die Bezugsform ziehen die Kamera entlang der Blickachse zurück, damit Text und Gerät nicht seitlich anschneiden
  const kameraZug = () => { const r = KAM_REF[narrow ? "n" : "d"]; return aspect < r ? Math.min(1.8, Math.pow(r / aspect, .85)) : 1; };
  function kameraPose(I, K, v, D, cO, tO) {
    const yw = slotOf(I.idx).yaw, fw = hdir(yw), rt = hright(yw), f = K.fs;
    const c0 = f[0](v), c1 = f[1](v), c2 = f[2](v), t0 = f[3](v), t1 = f[4](v), t2 = f[5](v);
    tO.set(D.x + rt.x * t0 + fw.x * t2, D.y + t1, D.z + rt.z * t0 + fw.z * t2);
    cO.set(D.x + rt.x * c0 - fw.x * c2, D.y + c1, D.z + rt.z * c0 - fw.z * c2);
    const z = kameraZug(); if (z !== 1) cO.sub(tO).multiplyScalar(z).add(tO);
  }
  // Verfolgung im Fluss: hinter dem Punkt, Blick in die gemittelte Laufrichtung (Vorgaben RIG.chase)
  function chasePose(D, yawC, cO, tO) {
    const K = CHASE[narrow ? "n" : "d"], f = hdir(yawC), y = Math.max(0, D.y - THREAD_Y);
    cO.copy(D).addScaledVector(f, -K.back); cO.y = K.h + y;
    tO.copy(D).addScaledVector(f, K.ahead); tO.y = K.ty + y;
  }
  // Spur eines Stücks (Flug in Szene i und Szene i): Ort und Blickpunkt je vh
  const CHUNKS = [];
  function computeChunk(i) {
    const I = INST[i]; if (!I.built || !I.tl) return;
    const va = I.trIn ? I.trIn.v0 : 0, vb = I.body.v1, PADS = 120;
    const a0 = Math.floor(va) - PADS, n = Math.ceil(vb) - a0 + PADS + 1;
    // Kurven aller Szenen, die in diesen Bereich reichen (die Pads greifen in die Nachbarn)
    const curves = []; for (const X of INST) { const K = kameraKurve(X); if (K && K.x1 >= a0 - 5 && K.x0 <= a0 + n + 5) curves.push({ X, K, ...kameraBlende(X, K) }); }
    const hasCurve = v => { let hit = null; for (const c of curves) if (v >= c.K.x0 - (c.f0 ? 0 : 2.5) && v <= c.K.x1 + (c.f1 ? 0 : 2.5)) hit = c; return hit; };
    // gemittelte Laufrichtung (Gier, entfaltet) über ±YAW_WIN
    const W2 = YAW_WIN, ny = n + 2 * W2, sig = new Float64Array(ny);
    for (let k = 0; k < ny; k++) { const y = yawSignal(a0 - W2 + k); sig[k] = k ? sig[k - 1] + wrapPi(y - sig[k - 1]) : y; }
    const pre = new Float64Array(ny + 1); for (let k = 0; k < ny; k++) pre[k + 1] = pre[k] + sig[k];
    const avg = k => { const lo = Math.max(0, k), hi = Math.min(ny, k + 2 * W2 + 1); return (pre[hi] - pre[lo]) / (hi - lo); };
    const cam = new Float64Array(3 * n), tgt = new Float64Array(3 * n), hasB = new Uint8Array(n), hkA = new Float64Array(n), dotP = new Float64Array(3 * n), dotV = new Uint8Array(n);
    const bc = V(), bt = V(), D = V(), kc = V(), kt = V();
    const boxes = []; for (const X of [INST[i - 1], I, INST[i + 1]]) if (X && X.built && X.boxes) boxes.push(...X.boxes);
    const need = new Float64Array(n), D0 = I.route.at(0).clone().applyMatrix4(I.M4);
    for (let k = 0; k < n; k++) {
      const v = clamp(a0 + k, 0, TOTAL), d = dotAt(v, D), c = hasCurve(v);
      if (d) { hasB[k] = 1; dotP[3 * k] = D.x; dotP[3 * k + 1] = D.y; dotP[3 * k + 2] = D.z; dotV[k] = d.vis ? 1 : 0; }
      else if (c && c.X.cfg.keyed) D.copy(D0);                          // Eröffnung vor dem Statuspunkt: die Stützstellen sind auf den Startpunkt des Fadens bezogen
      else { if (k) { for (let q = 0; q < 3; q++) { cam[3 * k + q] = cam[3 * k - 3 + q]; tgt[3 * k + q] = tgt[3 * k - 3 + q]; } need[k] = need[k - 1]; } continue; }
      const ya = avg(k), sk = sig[k + W2], yawC = ya + YAW_K * wrapPi(sk - ya);
      if (d) chasePose(D, yawC, bc, bt); else { bc.copy(D0); bt.copy(D0); }
      if (c) {
        kameraPose(c.X, c.K, clamp(v, c.K.x0, c.K.x1), D, kc, kt);
        let w = (c.f0 ? smoother((v - c.K.x0) / c.f0) : 1) * (c.f1 ? 1 - smoother((v - (c.K.x1 - c.f1)) / c.f1) : 1);
        if (!d) w = 1;
        mixT(bc, bt, kc, kt, w, bc, bt);
        let hk = 0; for (const [p0, p1] of c.K.pl) { const dd = v < p0 ? p0 - v : v > p1 ? v - p1 : 0; hk = Math.max(hk, 1 - smoother(dd / 90)); } hkA[k] = hk;
      }
      // Mindesthöhe über Bauteilen unter der Kamera
      let m = .35; for (const bx of boxes) if (bc.x > bx.min.x - .45 && bc.x < bx.max.x + .45 && bc.z > bx.min.z - .45 && bc.z < bx.max.z + .45) m = Math.max(m, Math.min(bc.y + 3, bx.max.y + .9));
      need[k] = m;
      cam[3 * k] = bc.x; cam[3 * k + 1] = bc.y; cam[3 * k + 2] = bc.z; tgt[3 * k] = bt.x; tgt[3 * k + 1] = bt.y; tgt[3 * k + 2] = bt.z;
    }
    // Mindesthöhe: über ±30 vh aufgeweitet und zweimal geglättet (die Kamera steigt vor einem Bauteil und sinkt erst danach)
    const nd = new Float64Array(n); for (let k = 0; k < n; k++) { let m = 0; for (let j = Math.max(0, k - 30); j <= Math.min(n - 1, k + 30); j++) m = Math.max(m, need[j]); nd[k] = m; }
    const box = (src, r) => { const out = new Float64Array(n); for (let k = 0; k < n; k++) { let a = 0, cc = 0; for (let j = Math.max(0, k - r); j <= Math.min(n - 1, k + r); j++) { a += src[j]; cc++; } out[k] = a / cc; } return out; };
    const ndS = box(box(nd, 20), 20);
    const keyedEnd = I.cfg.keyed ? I.body.v0 + I.tl.an[I.tl.an.length - 1].h1 : -1e9;
    for (let k = 0; k < n; k++) {
      const v = a0 + k;
      bc.set(cam[3 * k], cam[3 * k + 1], cam[3 * k + 2]); bt.set(tgt[3 * k], tgt[3 * k + 1], tgt[3 * k + 2]);
      const lift = Math.max(0, ndS[k] - bc.y); if (lift > 0) { bc.y += lift; bt.y += lift * .5; }
      // Eröffnung: die Nachführung setzt nach dem Erscheinen des Punktes am Statuspunkt weich ein
      const kv = I.cfg.keyed && v < I.body.v1 ? smoother((v - I.body.v0 - I.tl.tVis + 40) / 80) : 1;
      if (hasB[k] && dotV[k]) keepDot(bc, bt, D.set(dotP[3 * k], dotP[3 * k + 1], dotP[3 * k + 2]), (1 - hkA[k]) * kv);
      cam[3 * k] = bc.x; cam[3 * k + 1] = bc.y; cam[3 * k + 2] = bc.z; tgt[3 * k] = bt.x; tgt[3 * k + 1] = bt.y; tgt[3 * k + 2] = bt.z;
    }
    // Glättung (Gauß, SMOOTH_S vh); ausgenommen die Schlüsselfahrt der Eröffnung (Startbild bleibt genau)
    const S = SMOOTH_S, R3 = Math.ceil(3 * S), ker = []; for (let j = -R3; j <= R3; j++) ker.push(Math.exp(-j * j / (2 * S * S)));
    const smooth = arr => { const out = new Float64Array(arr.length); for (let k = 0; k < n; k++) for (let c = 0; c < 3; c++) { let s = 0, ws = 0; for (let j = -R3; j <= R3; j++) { const q = k + j; if (q < 0 || q >= n) continue; s += arr[3 * q + c] * ker[j + R3]; ws += ker[j + R3]; } out[3 * k + c] = s / ws; } return out; };
    const cS = smooth(cam), tS = smooth(tgt);
    for (let k = 0; k < n; k++) {
      const v = a0 + k, m = smoother((v - keyedEnd) / (3 * S));
      for (let c = 0; c < 3; c++) { cam[3 * k + c] += (cS[3 * k + c] - cam[3 * k + c]) * m; tgt[3 * k + c] += (tS[3 * k + c] - tgt[3 * k + c]) * m; }
    }
    CHUNKS[i] = { va, vb, a0, n, cam, tgt };
  }
  // Stellung bei v aus der Spur (kubisch zwischen den Stützstellen je vh)
  const _q0 = V(), _q1 = V(), _q2 = V(), _q3 = V();
  function trackAt(v, cam, tgt) {
    let C = null;
    for (let i = CHUNKS.length - 1; i >= 0; i--) { const c = CHUNKS[i]; if (c && v >= c.va - 1e-6 && v <= c.vb + 1e-6) { C = c; break; } }
    if (!C) { for (const c of CHUNKS) if (c) { C = c; break; } }
    if (!C) { cam.set(0, 5, 20); tgt.set(0, 0, 0); return false; }
    const u = clamp(v - C.a0, 1, C.n - 3), k = Math.floor(u), f = u - k;
    for (const [arr, out] of [[C.cam, cam], [C.tgt, tgt]]) {
      _q0.fromArray(arr, 3 * (k - 1)); _q1.fromArray(arr, 3 * k); _q2.fromArray(arr, 3 * (k + 1)); _q3.fromArray(arr, 3 * (k + 2));
      cr(_q0, _q1, _q2, _q3, f, out);
    }
    return true;
  }
  // Catmull-Rom durch vier Stützwerte
  const cr = (p0, p1, p2, p3, u, out) => out.set(0, 0, 0).addScaledVector(p0, -.5 * u + u * u - .5 * u * u * u).addScaledVector(p1, 1 - 2.5 * u * u + 1.5 * u * u * u).addScaledVector(p2, .5 * u + 2 * u * u - 1.5 * u * u * u).addScaledVector(p3, -.5 * u * u + .5 * u * u * u);
  // Sichtfeld überall gleich (Breitbild 32°, hochkant 44°): kein Zoom über die Brennweite
  const FOVC = () => narrow ? 44 : 32;
  let FREE = null;                                                    // Prüfhilfe: feste Kamera (Szenenkoordinaten) zum Entwerfen der Stützstellen
  function poseOf(st, cam, tgt) {
    const v = st.sg.v0 + clamp(st.q, 0, 1) * (st.sg.v1 - st.sg.v0);
    trackAt(v, cam, tgt);
    if (FREE) { cam.copy(FREE.cam); tgt.copy(FREE.tgt); }
    return FOVC();
  }

  // ---------- Füllung entlang des Fadens zwischen den Parzellen (Erik 22.10.2026: „Mit Mausperspektive zusammen“) ----------
  // Niedrige weiße Papierblöcke (Kästen, Stufen, Kanten wie die Dachaufbauten in Mirror's Edge), locker gestreut, dazu feine Schnitt- und Falzspuren im Boden.
  // Nie höher als die Szenen (FILL_H), nie zwischen Kamera und Punkt (Abstand zum Faden mindestens FILL_GAP: die Kamera fährt auf dem Faden), nie auf einer Parzelle,
  // ohne Text, ohne Rot, Farben der Seite (PAL). Fester Zufallssamen je Brücke (deterministisch). Handy sparsamer. Die Füllung entsteht, sobald alle Szenen gebaut sind,
  // weil sie allen Fäden ausweicht.
  const FILL_H = 1.3, FILL_GAP = 3.2;
  let fill = null;
  const rng32 = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  function boxTris(x0, x1, y0, y1, z0, z1, pos) {
    const P = (x, y, z) => pos.push(x, y, z);
    const q = (a, b, c, d) => { P(...a); P(...b); P(...c); P(...a); P(...c); P(...d); };
    q([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]);                       // oben
    q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);                       // vorn (+z)
    q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);                       // hinten
    q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);                       // links
    q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);                       // rechts
  }
  function boxEdges(x0, x1, y0, y1, z0, z1, e) {
    const c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) e.push(...c[a], ...c[b]);
  }
  function buildFiller() {
    if (fill) { scene.remove(fill.group); fill.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); fill = null; }
    const bridges = pieces.filter(pc => pc.time.br);
    if (!bridges.length) return;
    const dens = narrow ? .55 : 1, tone = [PAL.plate, "#eef2f8", "#e3e9f1"].map(c => new THREE.Color(c));
    // Parzellen (Welt, runde Böden), mit Rand
    const cells = INST.map((_, i) => { const sl = slotOf(i); return [sl.C.x, sl.C.z, sl.R + .8]; });
    // alle Fäden (Brücken und Szenenfäden) als Punktwolke, dicht genug für den Abstand
    const thr = []; for (const pc of pieces) for (const p of pc.curve.getSpacedPoints(Math.max(8, Math.round(pc.curve.getLength() / 1.2)))) thr.push([p.x, p.z]);
    const nearThr = (x, z, m) => { for (const t of thr) if (Math.abs(t[0] - x) < m && Math.abs(t[1] - z) < m && Math.hypot(t[0] - x, t[1] - z) < m) return true; return false; };
    const inCell = (x, z, m) => cells.some(c => Math.hypot(x - c[0], z - c[1]) < c[2] + m);
    const pos = [[], [], []], ed = [], placed = [], lines = [];
    const addBox = (ci, x, z, w, d, y0, h, rot) => {
      // Fuß (w × d) um (x, z), um y gedreht rot; Dreiecke und Kanten in Weltkoordinaten
      const c = Math.cos(rot), s = Math.sin(rot), tmp = [], te = [];
      boxTris(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, tmp); boxEdges(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, te);
      for (let i = 0; i < tmp.length; i += 3) pos[ci].push(x + tmp[i] * c + tmp[i + 2] * s, tmp[i + 1], z - tmp[i] * s + tmp[i + 2] * c);
      for (let i = 0; i < te.length; i += 3) ed.push(x + te[i] * c + te[i + 2] * s, te[i + 1], z - te[i] * s + te[i + 2] * c);
    };
    bridges.forEach((pc, bi) => {
      const rnd = rng32(1000 + 77 * bi), L = pc.curve.getLength(), n = Math.max(6, Math.round(L / 1.5)), sp = pc.curve.getSpacedPoints(n);
      const tangent = i => { const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n, i + 1)]; return Math.atan2(b.x - a.x, b.z - a.z); };
      for (let d0 = 2 + rnd() * 3; d0 < L - 2; d0 += (4.5 + rnd() * 5) / dens) {
        const i = Math.min(n, Math.round(d0 / L * n)), p = sp[i], th = tangent(i), nx = Math.cos(th), nz = -Math.sin(th);      // Normale (quer zum Faden)
        for (const sd of [-1, 1]) {
          if (rnd() > .62 * dens + .12) continue;
          const off = FILL_GAP + .8 + rnd() * rnd() * 11, w = .8 + rnd() * 2.4, dd = .8 + rnd() * 2.2, rot = rnd() < .5 ? 0 : th, along = (rnd() - .5) * 3;
          const x = p.x + sd * nx * off + Math.sin(th) * along, z = p.z + sd * nz * off + Math.cos(th) * along, hw = Math.hypot(w, dd) / 2 + .3;
          if (inCell(x, z, hw) || nearThr(x, z, FILL_GAP + hw - 1) || placed.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2] + hw + .5)) continue;
          placed.push([x, z, hw]);
          const ci = Math.floor(rnd() * 3), kind = rnd();
          const hs = [.22, .35, .5, .7, .95, 1.3], h1 = hs[Math.floor(rnd() * rnd() * hs.length)];
          if (kind < .28) {
            // Stufen: zwei bis drei Lagen, jede kleiner und höher
            const steps = 2 + (rnd() < .4 ? 1 : 0); let y = 0, ww = w + .8, ddd = dd + .6;
            for (let k = 0; k < steps; k++) { const hh = Math.min(h1 * .55, FILL_H / steps); addBox(ci, x + (k * .35) * Math.cos(rot), z - (k * .35) * Math.sin(rot), ww, ddd, y, hh, rot); y += hh; ww *= .66; ddd *= .7; }
          } else if (kind < .42) {
            // lange niedrige Kante (Mauer)
            addBox(ci, x, z, w + 2.4, .45 + rnd() * .35, 0, Math.min(h1, .7), rot);
          } else if (kind < .55) {
            // Winkel aus zwei Kästen
            addBox(ci, x, z, w + 1, .8, 0, h1, rot); addBox((ci + 1) % 3, x + Math.cos(rot) * (w + 1) / 2 - .4 * Math.sin(rot), z - Math.sin(rot) * (w + 1) / 2 - .4 * Math.cos(rot), .8, dd + 1, 0, Math.min(h1 * .7, FILL_H), rot);
          } else addBox(ci, x, z, w, dd, 0, h1, rot);
        }
      }
      // Schnitt- und Falzspuren im Boden: lange feine Linien parallel zum Faden (Schnitt durchgehend, Falz gestrichelt) und kurze Passermarken
      for (let d0 = 1 + rnd() * 3; d0 < L - 1; d0 += (3 + rnd() * 5) / dens) {
        const i = Math.min(n, Math.round(d0 / L * n)), p = sp[i], th = tangent(i), nx = Math.cos(th), nz = -Math.sin(th), sd = rnd() < .5 ? -1 : 1, off = 1.4 + rnd() * 7, len = 2.5 + rnd() * 8, fold = rnd() < .45;
        const x0 = p.x + sd * nx * off, z0 = p.z + sd * nz * off, dx = Math.sin(th), dz = Math.cos(th);
        if (inCell(x0, z0, 0) || inCell(x0 + dx * len, z0 + dz * len, 0)) continue;
        if (fold) { for (let t = 0; t < len; t += .55) lines.push([x0 + dx * t, z0 + dz * t, x0 + dx * Math.min(len, t + .3), z0 + dz * Math.min(len, t + .3), .13]); }
        else lines.push([x0, z0, x0 + dx * len, z0 + dz * len, .2]);
        if (rnd() < .4) lines.push([x0, z0, x0 + nx * sd * (1 + rnd() * 2.5), z0 + nz * sd * (1 + rnd() * 2.5), .17]);
      }
    });
    const group = new THREE.Group(); group.renderOrder = -2;
    pos.forEach((arr, ci) => {
      if (!arr.length) return;
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
      const m = paperMaterial("#" + tone[ci].getHexString()); patchPaper(m);
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; group.add(mesh);
    });
    const ink = new THREE.Color(INK);
    if (ed.length) {
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(ed, 3));
      const cols = []; for (let i = 0; i < ed.length / 3; i++) cols.push(ink.r, ink.g, ink.b, .34); g.setAttribute("aCol", new THREE.Float32BufferAttribute(cols, 4));
      const ls = new THREE.LineSegments(g, edgeMaterial()); ls.frustumCulled = false; ls.renderOrder = 1; group.add(ls);
    }
    if (lines.length) {
      const arr = [], cols = [];
      for (const [a, b, c, d, al] of lines) { arr.push(a, .006, b, c, .006, d); for (let k = 0; k < 2; k++) cols.push(ink.r, ink.g, ink.b, al); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); g.setAttribute("aCol", new THREE.Float32BufferAttribute(cols, 4));
      const ls = new THREE.LineSegments(g, edgeMaterial()); ls.frustumCulled = false; ls.renderOrder = 0; group.add(ls);
    }
    scene.add(group); fill = { group, n: placed.length, built: INST.length };
    dbg("Füllung: " + placed.length + " Blöcke, " + lines.length + " Spuren");
  }

  // ---------- Roter Faden ----------
  // Ein Faden durch die ganze Seite, als Bänder: je Szene der Flug hinein (Fluss, „Brücke“), der Szenenlauf und am Schluss die Mündung. Der Faden ist bis zum Punkt gezeichnet;
  // der Punkt sitzt auf seinem Ende (Zeitlage: dotAt, Szenenlauf: tl.sAt). Keine Markierungen an Lesestellen (Erik 23.10.2026: Ringe fallen ersatzlos weg).
  const pieces = [];
  let dot = null;
  const tmat = new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const THREAD_HW = .03;
  let threadHW = THREAD_HW;
  // Faden und Punkt liegen immer über jeder flachen Bodenfläche: Teile und Abdrücke liegen auf Ebenen y = Ebene · EPS (bis etwa .01), der
  // Bogen auf 0; Stützpunkte darunter werden auf THREAD_Y angehoben (Stehende Teile verdecken den Faden weiterhin über die Tiefe)
  const THREAD_Y = .02;
  function ribbon(pts0) {
    const pts = pts0.map(p => p.y < THREAD_Y ? V(p.x, THREAD_Y, p.z) : p);
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5);
    const len = curve.getLength(), N = Math.round(clamp(len * 12, 24, 4000)), sp = curve.getSpacedPoints(N);
    for (const q of sp) if (q.y < THREAD_Y) q.y = THREAD_Y;
    // Querschnitt als flacher Giebel (links, Mitte oben, rechts): von oben ein flaches Band, aus der Mausperspektive eine Kante mit Höhe (sonst flimmert das dünne Band im flachen Blick)
    const pos = new Float32Array((N + 1) * 9), idx = [];
    // fill(hw): Halbbreite des Bandes neu schreiben (in der Karte wächst sie mit dem Abstand, damit der Faden ~2,5 px breit bleibt)
    const fill = hw => {
      let prev = null; const hT = Math.min(hw * 1.5, .06);
      for (let i = 0; i <= N; i++) {
        const p = sp[i], q = sp[Math.min(N, i + 1)], r = sp[Math.max(0, i - 1)];
        const d = V().subVectors(q, r); const vert = Math.abs(d.y) > .5 * d.length();
        let sd;
        if (vert) sd = V(hw, 0, 0); else { d.y = 0; d.normalize(); sd = V().crossVectors(d, UP).multiplyScalar(hw); }
        if (prev && sd.dot(prev) < 0) sd.negate();
        prev = sd;
        pos.set([p.x - sd.x, p.y, p.z - sd.z, p.x, p.y + hT, p.z, p.x + sd.x, p.y, p.z + sd.z], i * 9);
      }
    };
    fill(THREAD_HW);
    for (let i = 0; i < N; i++) { const a = i * 3, b = (i + 1) * 3; idx.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const mesh = new THREE.Mesh(g, tmat); mesh.renderOrder = 2; mesh.frustumCulled = false; scene.add(mesh);
    return { curve, N, g, mesh, fill };
  }
  function addPiece(pts, info) {
    if (pts.length < 2) return null;
    const r = ribbon(pts); Object.assign(r, info); pieces.push(r); return r;
  }
  function buildThreadFor(I) {
    if (!dot) {
      dot = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); dot.renderOrder = 6; dot.visible = false; scene.add(dot);
      // „Sie sind hier“ in der Karte (kein Lesestellen-Ring): dünner Ring um den Punkt, nur in der Übersicht
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.6, 48), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, depthWrite: false, transparent: true, opacity: .35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); ring.renderOrder = 6; ring.visible = false; dot.add(ring); dot.userData.ring = ring;
    }
    for (let k = pieces.length - 1; k >= 0; k--) if (pieces[k].i === I.idx) { scene.remove(pieces[k].mesh); pieces[k].g.dispose(); pieces.splice(k, 1); }
    const LA = layoutOf();
    if (I.idx > 0) addPiece(LA.rivers[I.idx].pts, { i: I.idx, kind: "br", time: { br: true, tr: I.idx }, I, poly: LA.rivers[I.idx] });
    addPiece(I.route.pts.map(p => p.clone().applyMatrix4(I.M4)), { i: I.idx, kind: "route", time: { route: true, I }, I, poly: I.route });
  }
  // Fortschritt je Band (0 … 1) im Zustand st; dazu das Band des Punktes
  function threadK(pc, st) {
    const i = pc.i;
    if (pc.kind === "br") return st.i > i ? 1 : st.i === i ? (st.kind === "t" ? st.q : 1) : 0;
    if (pc.kind === "route") {
      if (st.i > i) return 1;
      if (st.i < i || st.kind !== "b" || !pc.I.tl) return 0;
      const t = st.q * (pc.I.body.v1 - pc.I.body.v0); return t < pc.I.tl.tBase0 ? 0 : pc.I.tl.sAt(t) / pc.I.route.len;
    }
    return 0;
  }
  function updateThread(st) {
    let own = null, ownK = 0;
    for (const pc of pieces) {
      const k = threadK(pc, st), kd = k;
      pc.mesh.visible = kd > 0;
      pc.g.setDrawRange(0, Math.floor(kd * pc.N) * 12);
      const mine = (st.kind === "t" && pc.kind === "br" && pc.i === st.i) || (st.kind === "b" && pc.kind === "route" && pc.i === st.i);
      if (mine) { own = pc; ownK = k; }
    }
    let vis = !!own;
    if (own && own.kind === "route" && own.I.tl) { const t = st.q * (own.I.body.v1 - own.I.body.v0); vis = t >= own.I.tl.tVis; }
    dot.visible = vis;
    if (vis) {
      own.curve.getPointAt(clamp(ownK, 0, 1), dot.position); if (dot.position.y < THREAD_Y) dot.position.y = THREAD_Y;
      dot.quaternion.copy(camera.quaternion);
      const dd = camera.position.distanceTo(dot.position), rN = Math.max(.05, dd * .0065);
      dot.scale.setScalar(rN); if (dot.userData.ring) dot.userData.ring.visible = false;
      // Tiefentest wie beim Faden (Bauteile verdecken den Punkt); die Scheibe steht senkrecht zum Blick und würde zur Hälfte im Boden stecken:
      // entlang des Sehstrahls um ihren Radius nach vorn (die Lage im Bild ändert sich dabei nicht), nie über die halbe Entfernung
      (dot.userData.base || (dot.userData.base = V())).copy(dot.position);                                // Lage auf dem Faden (Prüfhilfe)
      dot.position.addScaledVector(_nn.copy(camera.position).sub(dot.position).normalize(), Math.min(dot.scale.x * 2.1, dd * .5));
    }
    // Gerwing: der Lieferschein reist mit dem Punkt (Lage in Szenenkoordinaten für die Szene, siehe applyState)
    return own;
  }

  // ---------- Text ganz im Bild oder ganz draußen ----------
  // Anteil des Textträgers (Umgrenzung der vier Ecken), der im Rahmen [0, cw] × [BAND_TOP, ch - BAND_BOT] liegt; hinter der Kamera 0
  const _q = [V(), V(), V(), V()];
  function frameFrac(pr, cw, ch) {
    // Tintenfläche: der Textträger ohne den Rand der Textur (sonst schaltet der leere Rand den Text ab, obwohl die Schrift noch ganz im Bild steht)
    const m = pr.mesh.matrixWorld, hw = pr.w / 2 - (pr.t ? pr.t.padX * pr.e : 0), hh = pr.h / 2 - (pr.t && pr.t.padY ? pr.t.padY * pr.e : 0);
    // Ecken in Blickkoordinaten, an der Nahebene (z = −.1) abgeschnitten (Sutherland–Hodgman): so ändert sich der Anteil stetig, wenn die Fläche an der Kamera vorbeigeht
    let poly = [];
    for (let i = 0; i < 4; i++) poly.push(_q[i].set(i === 0 || i === 3 ? -hw : hw, i < 2 ? -hh : hh, 0).applyMatrix4(m).applyMatrix4(camera.matrixWorldInverse).clone());
    const NZ = -.1, cut = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], c = poly[(i + 1) % poly.length], ia = a.z < NZ, ic = c.z < NZ;
      if (ia) cut.push(a);
      if (ia !== ic) cut.push(a.clone().lerp(c, (NZ - a.z) / (c.z - a.z)));
    }
    if (cut.length < 3) return { f: 0, r: null, a: 0, ia: 0 };
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const v of cut) {
      v.applyMatrix4(camera.projectionMatrix);
      const X = (v.x + 1) / 2 * cw, Y = (1 - v.y) / 2 * ch;
      x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
    }
    const A = (x1 - x0) * (y1 - y0); if (A <= 0) return { f: 0, r: [x0, y0, x1, y1], a: 0, ia: 0 };
    const ox = Math.max(0, Math.min(x1, cw) - Math.max(x0, 0)), oy = Math.max(0, Math.min(y1, ch - BAND_BOT) - Math.max(y0, BAND_TOP));
    return { f: ox * oy / A, r: [x0, y0, x1, y1], a: A, ia: ox * oy };
  }

  // ---------- Boden ----------
  // Der Boden ist ein sehr großer Bogen im Papierton, der zum Horizont weich in den Dunst ausläuft (keine Kante, kein Raster, keine Karte).
  const TM = 5.5;
  let table = null;
  const revealN = 99;
  let lowRatio = false;
  // Fläche des Bodens aus den Plätzen aller Szenen
  function tableRect() {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, h = 0;
    for (let i = 0; i < INST.length; i++) { const sl = slotOf(i); x0 = Math.min(x0, sl.C.x - sl.R); x1 = Math.max(x1, sl.C.x + sl.R); z0 = Math.min(z0, sl.C.z - sl.R); z1 = Math.max(z1, sl.C.z + sl.R); }
    const LA = layoutOf();
    for (const P of LA.rivers.filter(Boolean)) for (let q = 0; q <= 40; q++) { const pt = P.at(P.len * q / 40); x0 = Math.min(x0, pt.x - 2); x1 = Math.max(x1, pt.x + 2); z0 = Math.min(z0, pt.z - 2); z1 = Math.max(z1, pt.z + 2); }
    x0 -= TM; x1 += TM; z0 -= TM; z1 += TM;
    for (const I of INST) if (I.built && I.ext) h = Math.max(h, I.ext.max.y);
    return { x0, x1, z0, z1, h };
  }
  const GROUND_FRAG = `
    uniform vec3 uPaper; uniform vec3 uInk; uniform vec2 uGW; uniform vec2 uFar; uniform vec2 uC; uniform vec2 uH; uniform vec2 uGO; uniform vec2 uFade;
    uniform sampler2D uCont; uniform vec4 uContBox; uniform float uContA;
    varying vec3 vW; varying float vDepth;
    float gridLine(vec2 q) {
      vec2 fw = max(fwidth(q), vec2(1e-4));
      vec2 d = abs(fract(q - 0.5) - 0.5) / fw;
      return (1.0 - min(min(d.x, d.y), 1.0)) * (1.0 - smoothstep(.2, .45, max(fw.x, fw.y)));
    }
    void main() {
      vec2 p = vW.xz - uC;
      float dd = length(max(abs(p) - uH + vec2(14.0), 0.0)) - 14.0;
      vec2 q = (vW.xz - uGO) / 2.0;
      float gl = max(gridLine(q) * uGW.x, gridLine(q / 5.0) * uGW.y);
      vec3 c = mix(uPaper, uInk, gl);
      // Höhenlinien (ins Papier geprägt, nur in der Übersicht): Textur über dem Gebiet der Karte, Liniendichte 1 in Rot
      vec2 cuv = (vW.xz - uContBox.xy) * uContBox.zw;
      if (uContA > 0.001 && cuv.x > 0.0 && cuv.x < 1.0 && cuv.y > 0.0 && cuv.y < 1.0) { float cl = texture2D(uCont, cuv).r; c = mix(c, uInk, cl * uContA); }
      c = shaded(c, shadowAmt(vW, vec3(0.0, 1.0, 0.0)));
      float k = 1.0 - smoothstep(uFar.x, uFar.y, vDepth);
      c = mix(hazeAt(1.0 - k), c, k);
      c = mix(c, hazeAt(1.0), smoothstep(uFade.x, uFade.y, dd));
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`;
  function updateTable() {
    const R = tableRect(); if (R.x0 > R.x1) return;
    if (!table) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uPaper: { value: new THREE.Color(PAL.ground) }, uInk: { value: new THREE.Color(PAL.gridInk) }, uGW: { value: new THREE.Vector2(0, 0) }, uFar: { value: new THREE.Vector2(160, 1100) }, uC: { value: new THREE.Vector2() }, uH: { value: new THREE.Vector2(1, 1) }, uGO: { value: new THREE.Vector2() }, uFade: { value: new THREE.Vector2(4, 90) }, uCont: { value: null }, uContBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uContA: { value: 0 },
          uHaze: U.haze, uHazeF: U.hazeF, uShC: U.shc, uSM: U.sm, uSMM: U.smm, uSMP: U.smp },
        vertexShader: "varying vec3 vW; varying float vDepth; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }",
        fragmentShader: SHADOW_GLSL + GROUND_FRAG, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4
      });
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), mat);
      ground.frustumCulled = false; ground.renderOrder = -3; ground.position.y = -.04; ground.scale.set(6000, 1, 6000);
      scene.add(ground); table = { ground, mat };
    }
    const cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2, u = table.mat.uniforms;
    u.uC.value.set(cx, cz); u.uH.value.set((R.x1 - R.x0) / 2, (R.z1 - R.z0) / 2);
    // Raster liegt auf den Kanten der Parzellen (die erste Parzelle als Ursprung; die Maße der Raster sind Vielfache von 2)
    u.uGO.value.set(0, 0);                                                // Raster am Ursprung der Spirale (das Auge liegt auf einer Linie)
  }
  // Texturen: entfernte Szenen (und alle in der Karte) zeigen ihre Drucke in kleiner Auflösung (höchstens 512 px Kantenlänge), nahe Szenen
  // voll. Der Tausch kostet ein neues Hochladen, daher höchstens LOD_BUDGET Drucke je Bild; kleine Texturen werden gleich hochgeladen.
  const LOD_BUDGET = 3;
  // Druck auf Auflösung sx (1 oder SMALL) bringen: neu zeichnen (unter ctx.scale), altes Canvas freigeben, Textur neu hochladen
  function setScale(pr, sx, warm) {
    const tex = pr.map; if (!tex || !pr.mk || pr.sc === sx) return;
    const old = tex.image, cv = pr.mk(sx);
    tex.image = cv; tex.dispose(); tex.needsUpdate = true; pr.sc = sx;
    if (old && old !== cv) { old.width = 0; old.height = 0; }
    if (sx < 1 && warm && renderer.initTexture && !pr.mesh.visible) { try { renderer.initTexture(tex); } catch (e) { /* kein Vorwärmen */ } }
  }
  function lodStep(full, cur) {
    let budget = LOD_BUDGET;
    for (const I of INST) {
      if (!I.built) continue;
      const small = !full.has(I.idx);
      if (I.lodSmall === small && I.lodPos === undefined) continue;
      if (I.lodPos === undefined || I.lodTarget !== small) { I.lodPos = 0; I.lodTarget = small; }
      const free = I.idx === cur;                                   // die Szene, in der die Kamera ist, wird sofort voll (sonst Unschärfe)
      while (I.lodPos < I.prints.length && (budget > 0 || free)) { const pr = I.prints[I.lodPos++]; if (pr.mk) { setScale(pr, small ? SMALL : 1, true); if (!free) budget--; } }
      if (I.lodPos >= I.prints.length) { I.lodSmall = small; I.lodPos = undefined; }
      if (budget <= 0 && !(I.idx === cur)) return;
    }
  }

  // ---------- Bild zu einem Zustand ----------
  const visible = new Set(), _pp = V(), _nn = V(), _vv = V();
  const FOREIGN_S = [70, 140], FOREIGN = [70, 140];                    // Dunst der Nachbarszenen (wie FAR: Nachbarparzellen bleiben klar sichtbar, nur Schrift von hinten fällt weg)
  let state = null, lastApply = 0;
  // Text (nicht Bilder) steht, solange sein Träger im Bild ist, und läuft am Bildrand natürlich hinaus (Anschnitt wie bei jedem Inhalt der Seite);
  // erst wenn weniger als rund ein Viertel seiner Fläche im Bild steht, blendet er weich aus (voll ab 25 %, null bei 1 %). Drucke einer Gruppe
  // (pr.grp, z. B. die Wortmarke) bemessen sich an ihrer gemeinsamen Fläche und blenden zusammen aus: ein Name steht ganz oder gar nicht.
  // Früher: ganz im Bild (56 px oben, 48 px unten Rand) oder gar nicht, Übergang über 1,4 % der Fläche: Wörter schalteten einzeln und schlagartig ab.
  // In der Karte zusätzlich erst ab ein paar Pixeln Höhe (sonst flimmert die Schrift)
  const FADE_T = .3;                                                    // Sekunden, kürzeste Dauer jedes Ein- und Ausblendens von Drucken
  const FR0 = .01, FR1 = .24, BAND_TOP = 0, BAND_BOT = 0;
  const textFactor = (pr, cw, ch, gf) => {
    const fr = frameFrac(pr, cw, ch), f = gf !== undefined ? gf : fr.f; let o = sm((f - FR0) / FR1);
    return o;
  };
  const isText = pr => (pr.t && pr.t.rows) || pr.textual;
  // Anteil im Rahmen je Gruppe (Summe der sichtbaren Flächen durch Summe der Flächen)
  function groupFrac(I, cw, ch) {
    let g = null;
    for (const pr of I.prints) {
      if (!pr.grp || !isText(pr)) continue;
      const fr = frameFrac(pr, cw, ch); g = g || new Map();
      const e = g.get(pr.grp) || { a: 0, ia: 0 }; e.a += fr.a; e.ia += fr.ia; g.set(pr.grp, e);
    }
    if (g) for (const e of g.values()) e.f = e.a > 0 ? e.ia / e.a : 0;
    return g;
  }
  function applyState(st, now, opts = {}) {
    // sichtbar: aktuelle Szene und ihre Nachbarn (im Übergang beide Szenen und die davor)
    const want = new Set(st.kind === "b" ? [st.i - 1, st.i, st.i + 1] : [st.i - 2, st.i - 1, st.i, st.i + 1]);
    // nötig ist nur die aktuelle Szene (im Übergang: beide); Nachbarn erscheinen, sobald der Hintergrundbau sie fertig hat
    ensure(st.i);
    visible.clear();
    for (const I of INST) {
      if (!I.built) continue;
      const on = want.has(I.idx);
      I.group.visible = on; if (on) visible.add(I); else I.fadeReady = false;
    }
    if (!opts.still) {
      // volle Auflösung nur für die Szene der Kamera (im Übergang beide Enden, kurz vor dem Übergang schon die nächste)
      const full = new Set();
      if (st.kind === "t") { full.add(st.i - 1); full.add(st.i); } else { full.add(st.i); if (st.kind === "b" && st.q > .6) full.add(st.i + 1); }
      try { lodStep(full, st.i); } catch (e) { console.error("Texturstufe:", e); }
    }
    // Dunst: die Szene, in der die Kamera ist, sieht weit (FAR); Nachbarszenen werden ab FOREIGN ausgeblendet und tauchen beim Näherkommen auf
    const wOf = I => st.kind === "t" ? (I.idx === st.i ? sm(st.q) : I.idx === st.i - 1 ? 1 - sm(st.q) : 0) : I.idx === st.i ? 1 : 0;
    // Zeit der Lettern: läuft ab dem Eintreffen der Szene (Fahrt in die Szene beginnt)
    const time = now / 1000, dtS = Math.min(.05, Math.max(0, (now - lastApply) / 1000)); lastApply = now;
    for (const I of INST) if (I.built && I.tStart === undefined && (I.idx < st.i || (I.idx === st.i))) I.tStart = now;
    pulse.on = false;
    let fov = poseOf(st, camera.position, _t);
    FAR.set(70, 140);
    if (table) table.mat.uniforms.uFar.value.set(160, 1100);                  // der Boden läuft viel weiter aus als die Papiere der Szenen
    // Dunstfarbe: am Startbild weiß (wie das HTML-Vorbild), mit den ersten Scrollschritten zu den Farben der Palette (PAL); die Ferne ist zugleich die Hintergrundfarbe
    { const hk = st.kind === "b" && st.i === 0 ? smoother(win(st.q, .02, .25)) : 1;
      hazeC.copy(WHITE).lerp(hazeN, hk); hazeCF.copy(WHITE).lerp(hazeF, hk);
      U.haze.value.set(hazeC.r, hazeC.g, hazeC.b); U.hazeF.value.set(hazeCF.r, hazeCF.g, hazeCF.b); renderer.setClearColor(hazeCF, 1);
      // Startbild: auch der Boden ist weiß (breite Fenster zeigen sonst den blauen Boden neben dem Boden der Parzelle: im Startbild steht nur der Name)
      if (table) { table.mat.uniforms.uPaper.value.copy(WHITE).lerp(GROUND_C, hk); table.mat.uniforms.uGW.value.set(0, 0); } }
    const nearV = .1;
    if (camera.fov !== fov || camera.near !== nearV || camera.far !== 1500) { camera.fov = fov; camera.near = nearV; camera.far = 1500; camera.updateProjectionMatrix(); }
    // Kein Atem: die Kamera bewegt sich nur, wenn gescrollt wird (Erik: „sinnloses Kamerageeier“)
    camera.lookAt(_t);
    camera.updateMatrixWorld();
    const cw = VW(), ch = VH();
    for (const I of visible) {
      const wI = wOf(I);
      for (const bl of I.buildLines) bl.visible = wI >= .5;
      I.far.set(FOREIGN[0] + (FAR.x - FOREIGN[0]) * wI, FOREIGN[1] + (FAR.y - FOREIGN[1]) * wI);
      I.farS.set(FOREIGN_S[0] + (FAR.x - FOREIGN_S[0]) * wI, FOREIGN_S[1] + (FAR.y - FOREIGN_S[1]) * wI);
      // Startbild am Handy (Erik: „nur der Name“): das Podest steht dort schon (zwei Stufen), liegt aber im Dunst: bis zu den ersten Scrollschritten ist alles Papier der Eröffnung
      // in den weißen Dunst getaucht, nur der Name (Drucke) steht; mit dem Scrollen taucht das Papier auf
      I.farP.copy(I.far);
      if (narrow && I.idx === 0) { const kk0 = st.kind === "b" && st.i === 0 ? smoother(win(st.q, .004, .045)) : 1; I.farP.set(2 + (I.farP.x - 2) * kk0, 6 + (I.farP.y - 6) * kk0); I.farS.set(2 + (I.farS.x - 2) * kk0, 6 + (I.farS.y - 6) * kk0); }
      // Uhr der Lettern: nach 6 s ist alles aufgestanden und jeder Abdruck geschlossen (danach rechnet das Modell nur, wenn sich b ändert)
      // Anzeige-b: bricht b beim Sprung aus der Karte um (Parzellen vorn bauen sich zurück), läuft es mit begrenztem Tempo nach
      let b = bOf(I, st);
      if (I.bShown === undefined || opts.still || !I.easing) { I.bShown = b; I.easing = false; }
      else {
        const stp = 1.3 * dtS, dlt = b - I.bShown;
        if (Math.abs(dlt) <= Math.max(1e-4, stp)) { I.bShown = b; I.easing = false; } else { I.bShown += Math.sign(dlt) * stp; I.easing = true; }
      }
      b = I.bShown;
      const tl = I.tStart === undefined ? 0 : Math.min(6, (now - I.tStart) / 1000);
      I.curB = b; I.curT = tl;
      I.M.update(b, tl);
      for (const m of I.bMats) { if (m.uniforms.uGB) m.uniforms.uGB.value = b; else m.uniforms.uB.value = b; }
      // def.linesFrom: Haarkanten der Teile erst ab diesem b (Startbild flach über Papierhöhe: sonst liegen alle Kanten als Linie auf dem Horizont)
      if (I.def.linesFrom !== undefined) I.lines.visible = b >= I.def.linesFrom;
      // Lage des Punktes auf dem Lauf der Szene (Szenenkoordinaten) für Bauteile, die mit ihm reisen (Gerwing: Lieferschein)
      if (I.route && I.tl) { const sI = st.kind === "b" && st.i === I.idx ? I.tl.sAt(st.q * (I.body.v1 - I.body.v0)) : (st.i > I.idx) ? I.route.len : 0; I.K.dotS = sI; I.K.dotL = I.route.at(sI, I.K.dotL || V()); }
      for (const a of I.anims) a(b, time);
      I.group.updateMatrixWorld(true);
      const gfr = groupFrac(I, cw, ch);
      for (const pr of I.prints) {
        let o;
        if (pr.sched) o = pr.sched(b);
        else {
          o = pr.on < 0 ? 1 : sm((b - pr.on) / pr.fade);
          if (pr.off !== undefined) o *= 1 - sm((b - pr.off) / .03);
          if (pr.tOff !== undefined) o *= 1 - sm((tl - pr.tOff) / pr.tDur);
        }
        // Text (nicht Bilder) nur ganz im Bild oder gar nicht; Decals mit Text (Kontaktkarten) tragen pr.textual
        if (o > .001 && isText(pr)) o *= textFactor(pr, cw, ch, pr.grp && gfr ? gfr.get(pr.grp).f : undefined);
        // Dunst auch auf den Drucken; fremde Schrift nur von vorn (nie von hinten gelesen)
        if (o > .001) {
          _pp.setFromMatrixPosition(pr.mesh.matrixWorld);
          const dd = camera.position.distanceTo(_pp); o *= 1 - sm((dd - I.far.x) / Math.max(1, I.far.y - I.far.x));
          if (wI < 1 && o > .001 && ((pr.t && pr.t.rows) || pr.textual)) { _nn.set(0, 0, 1).transformDirection(pr.mesh.matrixWorld); _vv.copy(camera.position).sub(_pp).normalize(); o *= sm(_nn.dot(_vv) / .25); }
        }
        // Nie schlagartig: die Deckkraft folgt ihrem Ziel höchstens mit 1/FADE_T je Sekunde (jedes Ein- und Ausblenden dauert mindestens FADE_T,
        // auch wenn Fenster in b, Bildrand, Dunst oder Gruppe das Ziel springen lassen). Sprünge der Seite (Anker, Karte, Prüfstand: still) und
        // das erste Bild einer Szene setzen direkt.
        if (!opts.still && I.fadeReady && pr.oS !== undefined) { const mx = dtS / FADE_T; o = pr.oS + clamp(o - pr.oS, -mx, mx); }
        pr.oS = o;
        if (pr.mat.opacity !== o) pr.mat.opacity = o;
        pr.mesh.visible = o > .001;
      }
    }
    for (const I of visible) I.fadeReady = true;
    // Haarkanten der Bögen (LineBasicMaterial, ohne eigenen Shader) folgen dem Dunst ihrer Szene
    for (const I of visible) for (const sh of I.sheets) { const e = sh.children[0]; if (e && e.material) { _pp.setFromMatrixPosition(sh.matrixWorld); e.material.opacity = (camera.position.y > 2.5 ? .32 : 0) * (1 - sm((camera.position.distanceTo(_pp) - I.farS.x) / Math.max(1, I.farS.y - I.farS.x))); } }
    updateThread(st);
    state = st;
  }

  // ---------- Schatten ----------
  // Eine Tiefenkarte aus Richtung des Lichts (orthografisch), nur die Modelle der sichtbaren Szenen (Ebene 1 + Nummer der Szene, je Szene ein eigener Durchgang mit deren
  // Ausschnitt). Bereich: in der Karte der ganze Tisch (2048 px), sonst die Parzelle der Szene (im Übergang beide Parzellen) mit Rand (1024 px). Empfangen wird im
  // Papier-Shader auf waagerechten Flächen (weiche Probenmuster). Hochkant (Handy) ohne Schatten.
  const SM = { rt: null, size: 0, cam: null, mat: null, off: false };
  const LIGHT_DIR = V(...PAL.light).normalize();
  function shadowPass(st) {
    const on = !SM.off && !narrow && aspect >= 1 && INST[0].built;
    if (!on) { U.smp.value.x = 0; return; }
    let x0, x1, z0, z1;
    {
      const ids = st.kind === "t" ? [st.i - 1, st.i] : [st.i]; x0 = z0 = 1e9; x1 = z1 = -1e9;
      for (const i of ids) { const fp = INST[i].fp; x0 = Math.min(x0, fp[0] - 12); x1 = Math.max(x1, fp[1] + 12); z0 = Math.min(z0, fp[2] - 12); z1 = Math.max(z1, fp[3] + 12); }
    }
    const R = Math.hypot(x1 - x0, z1 - z0) / 2, size = R > 60 ? 2048 : 1024;
    if (!SM.rt || SM.size !== size) {
      if (SM.rt) { SM.rt.dispose(); if (SM.rt.depthTexture) SM.rt.depthTexture.dispose(); }
      const dt = new THREE.DepthTexture(size, size); dt.type = THREE.UnsignedIntType; dt.minFilter = dt.magFilter = THREE.NearestFilter;
      SM.rt = new THREE.WebGLRenderTarget(size, size, { depthTexture: dt, depthBuffer: true, generateMipmaps: false }); SM.size = size;
      SM.cam = SM.cam || new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 600);
      SM.mat = SM.mat || new THREE.MeshDepthMaterial({ side: THREE.DoubleSide, colorWrite: false });
    }
    const cam = SM.cam, ctr = V((x0 + x1) / 2, 0, (z0 + z1) / 2);
    cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R; cam.updateProjectionMatrix();
    cam.position.copy(ctr).addScaledVector(LIGHT_DIR, 300); cam.lookAt(ctr); cam.updateMatrixWorld(true);
    U.smm.value.copy(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    const ac = renderer.autoClear; renderer.autoClear = false;
    renderer.setRenderTarget(SM.rt); renderer.clear();
    scene.overrideMaterial = SM.mat;
    for (const I of visible) {
      if (!I.mesh || !I.mesh.visible) continue;
      SM.mat.clippingPlanes = I.shadowPlanes || null;
      cam.layers.set(1 + I.idx); renderer.render(scene, cam);
    }
    scene.overrideMaterial = null; renderer.setRenderTarget(null); renderer.autoClear = ac;
    U.sm.value = SM.rt.depthTexture; U.smp.value.set(1, 1 / size, PAL.shadowStrength, .3 / 599);
  }

  // ---------- Fortschritt, Scrollen, Knöpfe ----------
  const bar = document.getElementById("bar"), hint = document.getElementById("hint");
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let target = 0, p = 0, pVel = 0, hold = false;
  const SMOOTH_W = 4.2;                                                  // 1/s: Zeitkonstante der Feder rund 0,24 s, 90 % des Weges nach rund 0,9 s
  // Höchstgeschwindigkeit der Fahrt in Bildschirmhöhen je Sekunde: Mausrad und Wischen liefern je nach Kraft sehr unterschiedliche Sprünge;
  // langsames Scrollen bleibt eins zu eins, schnelles wird gedeckelt. Zum Ausprobieren: ?vmax=2 in der Adresse (0 = aus).
  const VMAX = (() => { const q = parseFloat(new URLSearchParams(location.search).get("vmax")); return isFinite(q) && q >= 0 ? q : 1.6; })();
  let navFahrt = false;                                                   // Sprung über Navigation/Vor/Zurück: ohne Deckel
  function jumpTo(pp, instant) {
    pp = clamp(pp, 0, 1);
    const st = stateAt(pp); ensure(st.i);
    // Sprung: frühere Szenen stehen schon fertig da (Lettern nach der Zeit eingeschlossen), die aktuelle auch, wenn p > 0
    for (const I of INST) if (I.built && (I.idx < st.i || (I.idx === st.i && pp > 0))) I.tStart = -1e9;
    target = p = pp; pVel = 0; hold = true;
    scrollTo(0, pp * maxScroll()); wake();
  }
  // Sprung beim Laden weit nach hinten: erst vorn malen, dann Szene für Szene bauen (zwischen den Schritten wird gemalt), dann springen; liegt das Ziel in der
  // Karte (ab Zoom-Beginn), erst bei Kontakt landen und die Kamera von dort zur Karte fahren lassen, nicht im ersten Bild alles auf einmal zeigen
  let initPhase = true, pendingJump = null;
  function jumpAny(pp) {
    const st = stateAt(clamp(pp, 0, 1));
    if (!initPhase || st.i <= 1 || INST[st.i].built) { jumpTo(pp); return; }
    pendingJump = pp; target = p = 0; pVel = 0; dbg("Sprung zu p=" + pp.toFixed(4) + " gestaffelt (Szene " + (st.i + 1) + ")");
    const step = () => {
      if (pendingJump === null) return;
      if (!INST[st.i].built) { build(INST.find(I => !I.built)); setTimeout(step, 30); return; }
      const pj = pendingJump; pendingJump = null; dbg("Szenen gebaut, springe");
      jumpTo(pj);
    };
    setTimeout(step, 400);
  }
  function applyHash() {
    const q = hashQ();
    const hp = q.get("p"), hs = q.get("s");
    if (hp !== null && hp !== "" && isFinite(+hp)) { jumpAny(+hp); return true; }
    if (hs) { const a = ANCH.find(a => a.name === hs); if (a) { jumpAny(anchorP(a) + 1e-6); return true; } }
    return false;
  }
  addEventListener("hashchange", () => { applyHash(); wake(); });
  addEventListener("scroll", () => { if (!hold) target = clamp(scrollY / maxScroll(), 0, 1); wake(); }, { passive: true });
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(ev, () => { hold = false; navFahrt = false; pendingJump = null; wake(); }, { passive: true });
  // Vor/Zurück und Navigation: normales (weiches) Scrollen an den Anfang einer Szene, kein Einrasten
  function scrollToP(pp) { hold = false; navFahrt = true; scrollTo({ top: clamp(pp, 0, 1) * maxScroll(), behavior: "smooth" }); }
  function go(dir) {
    const list = ANCH.filter(a => a.main).map(anchorP).filter(v => v !== null).sort((a, b) => a - b);
    const now = target;
    let to = dir > 0 ? list.find(s => s > now + .0015) : [...list].reverse().find(s => s < now - .0015);
    if (to === undefined) to = dir > 0 ? 1 : 0;
    scrollToP(to);
  }
  const nx = document.getElementById("next"), pv = document.getElementById("prev");
  if (nx) nx.addEventListener("click", () => go(1));
  if (pv) pv.addEventListener("click", () => go(-1));
  addEventListener("click", ev => {
    const l = ev.target.closest && ev.target.closest("[data-scene]"); if (!l) return;
    const a = ANCH.find(a => a.name === l.dataset.scene); if (!a) return;
    ev.preventDefault();
    scrollToP(anchorP(a) + 1e-6);
  });

  // ---------- Klickbare Drucke (Kontaktwege) ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function linkAt(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = null, bd = 1e9;
    for (const l of links3) {
      if (!l.I.group.visible || !l.pr.mesh.visible || l.pr.mat.opacity < .6) continue;
      const h = ray.intersectObject(l.pr.mesh, false)[0];
      if (h && h.distance < bd) { bd = h.distance; best = l; }
    }
    return best;
  }
  canvas.addEventListener("pointermove", ev => { canvas.style.cursor = ev.pointerType === "mouse" && linkAt(ev) ? "pointer" : ""; });
  canvas.addEventListener("click", ev => {
    const l = linkAt(ev); if (!l || !l.href || l.href === "#") return;
    if (/^(https?:)/.test(l.href)) window.open(l.href, "_blank", "noopener"); else location.href = l.href;
  });

  function resize() {
    const w = VW(), h = VH();
    if (FORCE) Object.assign(canvas.style, { width: w + "px", height: h + "px", left: "50%", top: "0", transform: "translateX(-50%)", outline: "1px solid #999" });
    renderer.setPixelRatio(lowRatio ? 1.25 : Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    if (post) post.resize(w, h, renderer.getPixelRatio());
    aspect = w / h;
    camera.aspect = aspect; camera.updateProjectionMatrix();
    // Lesestellungen hängen von der Fenstergröße ab: Bahnen neu (Lage der Szenen bleibt)
    for (const I of INST) if (I.built) plan(I);
    if (INST.length && INST.every(I => I.built)) try { buildFiller(); } catch (e) { console.error("Füllung:", e); }
  }

  // ---------- Aufbau ----------
  function init() {
    for (const I of INST) if (I.built) { scene.remove(I.group); I.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    for (const pc of pieces) { scene.remove(pc.mesh); pc.g.dispose(); }
    pieces.length = 0; links3.length = 0; CHUNKS.length = 0; LAYC = null;
    if (fill) { scene.remove(fill.group); fill.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); fill = null; }
    if (table) { scene.remove(table.ground); table.ground.geometry.dispose(); table.mat.dispose(); table = null; }
    aspect = VW() / VH(); narrow = aspect < 1;
    INST = SEQ.map((cfg, i) => newInstance(cfg, i));
    resize();
    makeSegments();
    ANCH = anchorsOf();
    build(INST[0]); INST[0].tStart = performance.now();
  }
  init();
  addEventListener("resize", () => {
    const n = VW() / VH() < 1;
    if (n !== narrow) { const keep = target; init(); jumpTo(keep); } else resize();
    if (hold) scrollTo(0, target * maxScroll());
    wake();
  });
  if (!applyHash()) { target = p = clamp(scrollY / maxScroll(), 0, 1); pVel = 0; }
  initPhase = false;
  // übrige Szenen im Hintergrund nacheinander bauen, erst nach dem ersten Bild (das Startbild steht vorher)
  function more() { const n = INST.find(I => !I.built); if (!n) return; build(n); wake(); setTimeout(more, 40); }

  // Zeichnen mit Nachbearbeitung (FX): Stufe voll am Desktop, leicht (nur Tonemapping + SMAA) hochkant/Handy und bei Software-Rendering, aus per Hash fx=aus.
  // Gelingt der Aufbau nicht, wird ohne Nachbearbeitung gezeichnet (wie bisher).
  const weakGpu = (() => { try { const gl = renderer.getContext(), e = gl.getExtension("WEBGL_debug_renderer_info"); return !!e && /swiftshader|llvmpipe|software|microsoft basic/i.test(String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL))); } catch (e) { return false; } })();
  const fxMode = () => { const q = fq.get("fx"); if (q === "aus" || q === "leicht" || q === "voll") return q; return narrow || aspect < 1 || weakGpu ? "leicht" : "voll"; };
  function drawScene() {
    const m = fxMode();
    if (m !== "aus" && !fxFailed) {
      try { if (!post) post = makePost(renderer, scene, camera, VW(), VH(), renderer.getPixelRatio()); post.draw(m); return; }
      catch (e) { console.error("Nachbearbeitung abgeschaltet:", e); fxFailed = true; post = null; renderer.setRenderTarget(null); }
    }
    renderer.toneMapping = THREE.NoToneMapping; renderer.setRenderTarget(null); renderer.render(scene, camera);
  }
  let last = performance.now(), first = true;
  function frameStep(now) {
    const dtRoh = Math.min(.25, (now - last) / 1000), dt = Math.min(.05, dtRoh); last = now;
    const p0 = p;
    // Dargestellter Fortschritt folgt dem Scrollfortschritt wie eine kritisch gedämpfte Feder (Eigenfrequenz SMOOTH_W, bildratenunabhängig,
    // ohne Überschwingen aus der Ruhe): Mausrad-Sprünge und schnelles Wischen werden weich, Beschleunigung und Abbremsen sind stetig
    {
      const x = p - target, ex = Math.exp(-SMOOTH_W * dt), tm = (pVel + SMOOTH_W * x) * dt;
      pVel = (pVel - SMOOTH_W * tm) * ex; p = clamp(target + (x + tm) * ex, 0, 1);
      if (Math.abs(target - p) < 1e-5 && Math.abs(pVel) < 1e-4) { p = target; pVel = 0; }
      const lim = VMAX * innerHeight / maxScroll() * dtRoh;   // echte Zeit: auch bei niedriger Bildrate gilt dasselbe Tempo
      if (VMAX > 0 && !navFahrt && Math.abs(p - p0) > lim) { p = p0 + Math.sign(p - p0) * lim; pVel = (p - p0) / dt; }
      if (navFahrt && Math.abs(target - p) < 1e-4) navFahrt = false;
    }
    const st = stateAt(p);
    hint && hint.classList.toggle("off", p > .004);
    document.body.classList.toggle("scrolled", scrollY > innerHeight * .6 || p > INST[0].body.p1 * .1);
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
    applyState(st, now);
    // Bewegt sich noch etwas? (Feder, Anzeige-b, Lettern-Uhr 6 s, Texturstufen) -> Schleife läuft weiter, sonst ruht sie nach SETTLE_MS
    if (p !== p0 || p !== target || pVel !== 0 || INST.some(I => I.easing || I.lodPos !== undefined) || [...visible].some(I => I.tStart !== undefined && now - I.tStart < 6100)) lastChange = now;
    try { shadowPass(st); } catch (e) { console.error("Schatten abgeschaltet:", e); SM.off = true; U.smp.value.x = 0; scene.overrideMaterial = null; renderer.setRenderTarget(null); }
    drawScene();
    if (first) dbg("erster Frame gezeichnet");
    if (first) {
      first = false; opt.onFirstFrame && opt.onFirstFrame(); setTimeout(more, 250);
      // Das HTML-Vorbild geht mit dem ersten 3D-Frame hart weg (kein Überblenden: sonst stünden Vorbild und Marke gleichzeitig im Bild); die Marke steht dann schon fertig
      const vb = document.querySelector(".vorbild"); if (vb) { vb.style.transition = "none"; vb.classList.add("weg"); }
    }
  }
  // Renderschleife nur bei Bedarf: gezeichnet wird bei Scroll/Resize/Eingabe, laufender Bewegung (Feder, Lettern, Ein-/Ausblenden, Texturtausch) und danach noch
  // SETTLE_MS; in Ruhe steht die Schleife still (kein requestAnimationFrame, 0 Bilder). Einzige Daueranimation: der Puls des roten Punktes, nur solange er im Bild
  // steht, mit höchstens 30 Bildern/s und nur in den Phasen, in denen sich am Bild etwas ändert. Verstecktes Fenster: nichts. Das Bild selbst bleibt unverändert.
  const SETTLE_MS = 1000, PULSE_MIN_MS = 30;
  let frameErrors = 0, rafId = 0, lastChange = performance.now(), lastDraw = -1e9;
  const pulseHide = t => ((t / 1000) % PULSE_T) / PULSE_T >= .7;       // Ring unsichtbar, Punkt in Ruhe: nichts ändert sich
  function frame(now) {
    rafId = 0;
    if (document.hidden) return;
    const settled = now - lastChange >= SETTLE_MS;
    if (settled && !pulse.on) return;                                   // Ruhe: Schleife stoppt, wake() startet sie wieder
    // nur Puls: gedrosselt, und ohne Zeichnen, solange er in der unveränderten Ruhephase steht (letztes Bild lag schon darin)
    if (settled && (now - lastDraw < PULSE_MIN_MS || (pulseHide(now) && pulseHide(lastDraw)))) { rafId = requestAnimationFrame(frame); return; }
    lastDraw = now;
    try { frameStep(now); }
    catch (e) {
      console.error(e); frameErrors++; lastChange = now;
      if (first) { first = false; try { opt.onFirstFrame && opt.onFirstFrame(); } catch (e3) { /* nichts */ } setTimeout(more, 250); }
    }
    rafId = requestAnimationFrame(frame);
  }
  wake = () => { lastChange = performance.now(); if (!rafId && !document.hidden) { last = performance.now(); rafId = requestAnimationFrame(frame); } };
  document.addEventListener("visibilitychange", () => { if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); rafId = 0; } else wake(); });
  renderer.domElement.addEventListener("webglcontextrestored", () => wake());
  wake();

  // Prüfhilfe (nur Entwurf): Zustände ohne Atem setzen, Lesestellen und Abschnitte als p
  const api = {
    THREE, scene, camera, frameFrac, readingPose, stateAt, poseOf, bOf, ensure,
    labelAt: pp => { const st = stateAt(pp), I = INST[st.i]; if (st.kind === "b" && I.cfg.labels) { ensure(I.idx); let lb = I.cfg.label; for (const L of I.cfg.labels) { const ki = typeof L.ki === "function" ? L.ki(I.def) : L.ki, kk = I.def.keys[ki]; const an = kk && I.tl && I.tl.an.find(q => q.ki === ki); if (an && pp >= (I.body.v0 + an.h0) / TOTAL) lb = L.label; } return lb; } return I.cfg.label; },
    inst: () => INST, segs: () => SEGS, total: () => TOTAL, anchors: () => ANCH.map(a => ({ name: a.name, p: anchorP(a) })),
    setP(v) { jumpTo(v); },
    // Zustand bei p ohne Atem anwenden (für Rechnungen), liefert den Zustand
    at(v, now = 1e9, still = true) { const st = stateAt(v); for (const I of INST) if (I.built && I.idx <= st.i) I.tStart = -1e9; applyState(st, now, { still }); return st; },       // Lettern stehen (die Uhr der Lettern läuft über 6 s)
    state: () => state, p: () => p,
    // Lesestellen aller Szenen als p der ganzen Seite
    stops() {
      ensure(INST.length - 1);
      const out = [];
      // Lesestellen (Text) mit der Mitte ihres Haltefensters als p
      for (const I of INST) for (const a of I.tl.an) if (a.kind === "text" && a.h0 !== undefined) out.push({ scene: I.name, ki: a.ki, stop: a.stop, slow: false, p: (I.body.v0 + (a.h0 + a.h1) / 2) / TOTAL, b: a.b, hold: a.h1 - a.h0 });
      return out;
    },
    pieces: () => pieces, dotV: DOT_V,
    // aktueller Blickpunkt der Kamera (Messflug: Abstand Kamera–Blickpunkt)
    camTgt: () => _t,
    route: i => { const I = INST[i]; ensure(i); if (!I.route) return null; const R = I.route; return { pts: R.pts.map(p => [p.x, p.z]), len: R.len, st: (R.st || []).map(o => ({ p: o.p, s: o.s, d: o.d, how: o.how, c: o.stop.C.toArray() })), nodes: (R.nodes || []).map(n => n.p), obs: (R.obs || []).map(b => [b.min.x, b.max.x, b.min.z, b.max.z, b.max.y]), cell: I.cell, disc: I.disc, inL: I.inL, outL: I.outL, content: I.content, minR: R.minR.r, minAt: [R.pts[R.minR.at] ? R.pts[R.minR.at].x : 0, R.pts[R.minR.at] ? R.pts[R.minR.at].z : 0], tl: { T: I.tl.T, V0: I.tl.V0, Tpre: I.tl.Tpre, tDot0: I.tl.tDot0, bIn: I.tl.bIn, an: I.tl.an.map(a => ({ kind: a.kind, ki: a.ki, s: a.s, h0: a.h0, h1: a.h1, b: a.b })) } }; },
    chunk: i => CHUNKS[i] ? CHUNKS[i] : null,
    free(sceneName, camLocal, tgtLocal) { wake(); if (!sceneName) { FREE = null; return; } const I = INST.find(q => q.name === sceneName); FREE = { cam: V(...camLocal).applyMatrix4(I.M4), tgt: V(...tgtLocal).applyMatrix4(I.M4) }; },
    dot: v => { const D = V(), d = dotAt(clamp(v, 0, TOTAL), D); return d ? { p: D.toArray(), vis: d.vis, kind: d.kind } : null; },
    lay: () => { const L = layoutOf(); return { isl: L.isl.map(q => ({ C: q.C.toArray(), yaw: q.yaw, R: q.R, door: q.door, E: q.E.toArray(), X: q.X.toArray() })), rivers: L.rivers.map(r => r ? r.len : 0) }; },
    // Anordnung und Karte (Prüfung): Bahn, Parzellen, Tisch, Kartenstellung, Segment der Karte
    layout: () => INST.map(I => ({ name: I.name, rot: Math.round(I.rot * 180 / PI), O: I.O.toArray(), fp: I.fp, cell: I.cell, content: I.content })),
    cards: () => INST.map(I => { const c = cardCorners(I); return [Math.min(...c.map(v => v.x)), Math.max(...c.map(v => v.x)), Math.min(...c.map(v => v.z)), Math.max(...c.map(v => v.z))]; }),
    table: () => tableRect()
  };
  window.__seite = api;
  return api;
}
