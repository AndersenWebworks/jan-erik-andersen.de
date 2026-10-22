// Durchgehende Startseite jan-erik-andersen.de, Fassung 2026-11 (entwurf-2026-11/seite/). Gemeinsamer Kern für alle Szenen.
// Grundlage: entwurf-2026-11/bogen/kern.js. Jede Szene ist ein Modul im bisherigen Format (default (K) => { keys, stops, track, … }),
// sie wird als Parzelle auf einen gemeinsamen Tisch gestellt (Raster wie ein Setzkasten: gleich große Parzellen mit gleichen Abständen, Schlangenlinie durch das
// Raster, siehe layout() und slotOf()). Die Kamera folgt zwischen zwei Szenen dem roten Punkt am Faden (chaseTrack(), eine stetige Verfolgungsfahrt ohne Überblick);
// in der Szene läuft ihre eigene Bahn (Zeitverzerrung, Lesestellungen aus readingPose()). Am Ende zoomt die Kamera aus der letzten Szene weit heraus zur Karte des
// Tisches von oben (Segment "z"), dort sind die Parzellen anklickbar; der Knopf „Übersicht“ öffnet dieselbe Karte an jeder Stelle (M, blendMap()).
// Boden: sehr großer Bogen mit zartem Raster, der zum Horizont in den Dunst ausläuft; weiche Schatten der Modelle (Tiefenkarte, shadowPass()); Farben von Dunst,
// Schatten und Licht an einer Stelle (PAL).
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
    gridMinor: .09, gridMajor: .17,      // Deckkraft der feinen Linien (alle 2 Einheiten) und der kräftigen (alle 10)
    penumbra: 1.8,                // Weichzeichner der Schattenkante in Texeln der Schattenkarte (klein = klarer umrissen)
    light: [-.45, .8, .5]         // Richtung zum Licht (Welt), bestimmt die Richtung der Schatten
  };
  // Gemeinsame Uniforms aller Papier-Shader. uHaze/uHazeF: Dunstfarbe nah und fern, uSM/uSMM/uSMP: Schattenkarte (Tiefe aus Richtung des Lichts), ihre Matrix
  // Welt → Licht und (an, Texelgröße, Stärke, Bias), uShC: Schattenfarbe.
  const WHITE = new THREE.Color(PAL.hazeStart), hazeN = new THREE.Color(PAL.hazeNear), hazeF = new THREE.Color(PAL.hazeFar), hazeC = new THREE.Color(), hazeCF = new THREE.Color();
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
  const fovOf = I => narrow ? (I.def.fovN || 44) : (I.def.fov || 36);

  // ---------- Szenen ----------
  const links3 = [];
  let INST = [], SEGS = [], ANCH = [], TOTAL = 1, thread = null, ZSEG = null;
  // Länge des Schluss-Zooms in vh (Breitbild, hochkant)
  const ZOOM = { d: 320, n: 320 };

  function newInstance(cfg, idx) {
    return { cfg, idx, name: cfg.name, built: false, O: V(), rot: 0, M4: new THREE.Matrix4(), R4: new THREE.Matrix4(), fp: null, tStart: undefined, parked: false, lastKey: "" };
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
      const pr = { mesh, mat, on, e, w, h, t, map: t.tex, sc, mk: sx => printTex(lines, { ...o, scale: sx }).tex.image, fade: o.fade || .02, off: o.off, grp: o.grp, I };
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
      onPanel(nd, pr, u, v, side = 1, q = null, lift = .002) { F.attach(nd, pr.mesh, nd.uv(u, v), q || nd.n, side, lift); return pr; },
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
          const ph = (t % 1.4) / 1.4, beat = ph < .12 ? Math.sin(ph / .12 * PI) : 0;
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
    // Schlüssel: Ausschnitt aus der Bahn der Szene (cfg.keys), erster Schlüssel ohne Vorlauf (sonst stünde die Kamera am Szenenanfang still)
    def.allKeys = def.keys;
    let keys = (cfg.keys ? cfg.keys(def) : def.keys).map((k, i) => i === 0 ? { ...k, w: 0 } : k);
    // cfg.lead / cfg.tail: beginnt bzw. endet die Szene mit einer Lesestelle, kommt die Kamera aus etwas weiterem Abstand an bzw.
    // zieht sich danach langsam zurück; so liegt die Lesestelle ganz in der Szene und nicht direkt an der Fahrt zur Nachbarszene
    if (cfg.lead && keys[0].stop) keys = [{ w: 0, b: keys[0].stop.b, fromStop: keys[0].stop, back: 1.25, up: .4 }, { ...keys[0], w: .35 }, ...keys.slice(1)];
    const lk = keys[keys.length - 1];
    if (cfg.tail && lk.stop) keys = [...keys, { w: .35, b: lk.stop.b, fromStop: lk.stop, back: 1.2, up: .3 }];
    def.keys = keys;
    Object.assign(I, { group, lines, prints, anims, sheets, sheetBox, bMats, rissMat, F, K, M, def, built: true });
    prep(I);
    I.b0 = clamp(def.bOfU(0), 0, 1);
    I.bLast = clamp(def.bOfU(1), 0, 1);
    I.bMax = cfg.bMax !== undefined ? cfg.bMax : 1;
    // Ausschnitt: Szenen, die nur einen Teil eines Bogens zeigen (abschluss), oder deren Bogen weit nach hinten reicht (stimmen)
    I.clip = cfg.clip || null;
    I.fcfg = cfg.faden ? cfg.faden(def, I) : null;                      // Eingang und Ausgang des Fadens (Szenenkoordinaten), vor dem Zuschnitt der Bögen gerechnet
    layout(I);
    group.position.copy(I.O); group.rotation.y = I.rot; group.updateMatrixWorld(true);
    I.boxes = partBoxes(I);
    laneArrival(I);
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
    // Dunst je Szene: eigene Grenzen (I.far), damit Nachbarszenen aus dem Dunst auftauchen und nicht im Hintergrund stehen (applyState)
    I.far = new THREE.Vector2(FAR.x, FAR.y); I.farS = new THREE.Vector2(FAR.x, FAR.y);       // farS: die Bögen (Karten) bleiben länger sichtbar als stehende Teile
    group.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.uniforms && m.uniforms.uFar) m.uniforms.uFar = { value: I.far }; });
    for (const sh of sheets) if (sh.material.uniforms && sh.material.uniforms.uFar) sh.material.uniforms.uFar = { value: I.farS };
    buildThreadFor(I);
    I.M.update(I.b0, 0); I.curB = I.b0; I.curT = 0;
    dbg("Szene " + (I.idx + 1) + " " + I.name + " gebaut");
    try { updateTable(); } catch (e) { mapFail(e); }
    group.visible = false;
    return I;
  }

  // ---------- Bahn je Szene ----------
  // Endstellung durchrechnen: Mitte, Normale, Leserichtung und Geviert der Drucke jeder Lesestelle (Szenenkoordinaten)
  function frameOf(s) {
    const v = V(), pts = [];
    for (const pr of s.prints) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pts.push(v.set(sx * pr.w / 2, sy * pr.h / 2, 0).applyMatrix4(pr.mesh.matrix).clone());
    const m = s.prints[0].mesh.matrix;
    s.C = pts.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / pts.length);
    s.N = V().setFromMatrixColumn(m, 2).normalize(); s.Y = V().setFromMatrixColumn(m, 1).normalize();
    s.e = s.e0 || Math.max(...s.prints.map(pr => pr.e));
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
    const sw = ks.reduce((a, k, i) => a + (i ? k.w : 0), 0) || 1, sm = cum[tot] || 1, dur = [0];
    for (let i = 1; i < n; i++) { const a = ks[i].w / sw, m = (cum[i * SUB] - cum[(i - 1) * SUB]) / sm; dur.push(Math.max(RETIME_MIN * a, (1 - RETIME_B) * a + RETIME_B * m)); }
    const sd = dur.reduce((a, b) => a + b, 0); let acc = 0;
    ks.forEach((k, i) => { acc += dur[i]; k.u = acc / sd; });
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
    if (px === undefined) px = nar ? 16 : clamp(20.5 + (H - 900) / 540 * 2.5, 19.5, 23);
    const fit = nar ? s.fitN : s.fit;
    if (fit) px = Math.min(px, fit * W / (s.wm / s.e));
    const depth = s.e * H / (2 * TAN * px);
    const yaw = (nar && s.nyaw !== undefined ? s.nyaw : s.yaw || 0) * PI / 180, pitch = (nar && s.npitch !== undefined ? s.npitch : s.pitch) * PI / 180;
    // sx/sy dürfen auch Funktionen (W, H) sein (Bildaufteilung je Seitenverhältnis)
    const fv = v => typeof v === "function" ? v(W, H) : v || 0;
    const sx = nar ? fv(s.nsx) : fv(s.sx), sy = nar ? fv(s.nsy) : fv(s.sy);
    // s.face (stimmen): waagerechte Blickrichtung vorgeben (Zickzack aus Flächen mit wechselnder Normale)
    const h = s.face ? s.face.clone() : Math.abs(s.N.y) > .7 ? s.Y.clone() : s.N.clone().negate(); h.y = 0; h.normalize();
    const c = Math.cos(yaw), sn = Math.sin(yaw); h.set(h.x * c + h.z * sn, 0, -h.x * sn + h.z * c);
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

  // ---------- Lage der Szenen in der Welt ----------
  // Raster wie ein Setzkasten (Erik, 22.10.2026): alle Parzellen sind gleich groß (cl quer zur Bahn, cf entlang der Bahn) und stehen in einem Raster mit
  // gleichen Abständen (gl quer, gf längs). Je Bahn (eine Spalte) stehen per Szenen hintereinander, die Bahnen wechseln die Richtung
  // (Schlangenlinie): Bahn 0 läuft nach S, Bahn 1 zurück nach N, und so fort; elf Szenen füllen Breitbild 4 × 3, hochkant 3 × 4 Felder, das letzte bleibt frei.
  // Jede Szene ist eine Gruppe, gedreht um y (Blickrichtung der Bahn) und verschoben um O; Welt = R · Szene + O. Die Kamera fährt in jeder Szene von vorn (+z)
  // nach hinten (−z), also in Blickrichtung der Bahn. Die Parzelle ist ein Papierbogen in Einheitsgröße (Mitte auf der Mitte des Inhalts der Szene);
  // die Bögen der Szenen selbst werden auf diese Fläche zugeschnitten (Bauteile, Lesestellen und Kamerabahnen bleiben, wie sie sind).
  // Maße gerechnet mit tmp/raster/inhalt.mjs (größter Inhalt aller Szenen plus Rand PAD). Hinweis: gf deckt den Anlauf der Kamera vor der nächsten Parzelle ab (die erste Stellung von Zusammenarbeit steht bis 24 Einheiten vor der Parzelle).
  const GRID = { d: { cl: 34, cf: 22, gl: 12, gf: 24, per: 3 }, n: { cl: 34, cf: 26, gl: 12, gf: 24, per: 4 } };
  const PAD = 1.2;                // Rand zwischen Inhalt und Kante der Parzelle
  const BRIDGE_R = 8;             // Radius der Ecken des Fadens zwischen zwei Parzellen einer Bahn (Versatz)
  const U_R = 9, U_E = 21;        // Wende zwischen zwei Bahnen: Radius der Ecken und Länge des Auslaufs über die Parzelle hinaus
  const HEAD = { N: 0, E: -PI / 2, S: PI, W: PI / 2 };
  const headOf = I => V(-Math.sin(I.rot), 0, -Math.cos(I.rot));
  const setXf = I => { I.R4.makeRotationY(I.rot); I.M4.copy(I.R4).setPosition(I.O); };
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
  function camExtent(I) {
    const c = V(), t = V(); let zmax = -1e9, xmin = 1e9, xmax = -1e9;
    for (let i = 0; i <= 400; i++) { localPose(I, i / 400, c, t); zmax = Math.max(zmax, c.z); xmin = Math.min(xmin, c.x); xmax = Math.max(xmax, c.x); }
    return { zmax, xmin, xmax };
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
  // Parzelle der Szene (Szenenkoordinaten): Einheitsgröße, Mitte auf der Mitte von Inhalt samt Eingang und Ausgang des Fadens
  function cellOf(I) {
    const G = GRID[narrow ? "n" : "d"], c = contentRect(I), f = I.fcfg;
    const [x0, x1, z0, z1] = c;
    const ends = f ? [f.in, f.out].filter(Boolean) : [];
    let lo = z0, hi = z1, xl = x0, xh = x1;
    for (const a of ends) { lo = Math.min(lo, ptZ(a)); hi = Math.max(hi, ptZ(a)); xl = Math.min(xl, ptX(a)); xh = Math.max(xh, ptX(a)); }
    if (hi - lo > G.cf - 2 * PAD) { lo = z0; hi = z1; }                 // Eingang oder Ausgang liegen weiter draußen (Anlauf): der Inhalt hat Vorrang, die Enden werden an die Kante gelegt
    if (xh - xl > G.cl - 2 * PAD) { xl = x0; xh = x1; }
    if (hi - lo > G.cf - 2 * PAD + .01 || xh - xl > G.cl - 2 * PAD + .01) console.warn("Parzelle zu klein für", I.name, (xh - xl).toFixed(1), "x", (hi - lo).toFixed(1));
    const cx = (xl + xh) / 2, cz = (lo + hi) / 2;
    I.content = c;
    return [cx - G.cl / 2, cx + G.cl / 2, cz - G.cf / 2, cz + G.cf / 2];
  }
  // lokales Rechteck → Rechteck der Welt (x0, x1, z0, z1) für Ursprung O und Drehung rot
  function worldRect(lr, O, rot) {
    const m = new THREE.Matrix4().makeRotationY(rot).setPosition(O), out = [1e9, -1e9, 1e9, -1e9];
    for (const [x, z] of [[lr[0], lr[2]], [lr[1], lr[2]], [lr[1], lr[3]], [lr[0], lr[3]]]) {
      const w = V(x, 0, z).applyMatrix4(m); out[0] = Math.min(out[0], w.x); out[1] = Math.max(out[1], w.x); out[2] = Math.min(out[2], w.z); out[3] = Math.max(out[3], w.z);
    }
    return out;
  }
  // Platz im Raster: Bahn t (Spalte), Platz j in der Bahn; gerade Bahnen laufen nach S, ungerade zurück nach N (Breitbild: vier Spalten zu drei Feldern, hochkant: drei Spalten zu vier Feldern)
  function slotOf(idx) {
    const G = GRID[narrow ? "n" : "d"], per = G.per, nL = Math.ceil(INST.length / per), t = Math.floor(idx / per), j = idx % per, fw = t % 2 === 0;
    const PL = G.cl + G.gl, PF = G.cf + G.gf, a = (fw ? j - (per - 1) / 2 : (per - 1) / 2 - j) * PF, l = (t - (nL - 1) / 2) * PL;
    return { rot: fw ? HEAD.S : HEAD.N, P: V(l, 0, a) };
  }
  function layout(I) {
    buildPath(I);
    I.ext = extentOf(I); I.cext = camExtent(I);
    const c = V(), t = V();
    localPose(I, 0, c, t); I.camStart = c.clone(); I.tgtStart = t.clone();
    localPose(I, 1, c, t); I.camEnd = c.clone(); I.tgtEnd = t.clone();
    const sl = slotOf(I.idx);
    I.rot = sl.rot;
    I.cell = cellOf(I); I.lf = I.cell;
    const cc = V((I.cell[0] + I.cell[1]) / 2, 0, (I.cell[2] + I.cell[3]) / 2);
    I.O.copy(sl.P).sub(cc.applyMatrix4(new THREE.Matrix4().makeRotationY(I.rot)));
    setXf(I);
    I.fp = worldRect(I.cell, I.O, I.rot);
  }
  // Parzelle als Papierbogen unter dem Bogen der Szene; die Bögen der Szene werden auf die Parzelle zugeschnitten (Skalierung der Platte, Haarkante aus)
  function fitSheets(I, group, sheets, sheetBox) {
    const [x0, x1, z0, z1] = I.cell;
    sheets.forEach((g, i) => {
      const s = sheetBox[i], a = Math.max(s[0], x0), b = Math.min(s[1], x1), c = Math.max(s[2], z0), d = Math.min(s[3], z1);
      if (g.children[0]) g.children[0].visible = false;
      if (b > a && d > c) { g.scale.set((b - a) / (s[1] - s[0]), 1, (d - c) / (s[3] - s[2])); g.position.x = (a + b) / 2; g.position.z = (c + d) / 2; sheetBox[i] = [a, b, c, d]; }
      else { g.scale.set(1e-4, 1, 1e-4); sheetBox[i] = [s[0], s[0], s[2], s[2]]; }
    });
    const pl = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .03, z1 - z0), paperMaterial(PAL.plate));
    pl.position.set((x0 + x1) / 2, -.0192, (z0 + z1) / 2);
    pl.add(new THREE.LineSegments(new THREE.EdgesGeometry(pl.geometry), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .32, depthWrite: false })));
    group.add(pl); sheets.push(pl);
    frameOn(pl.material, I.O, null, I.rot); patchPaper(pl.material);
    return pl;
  }


  // Ankunft des Fadens in der Parzelle (Szenen ohne eigenen Faden: der Faden läuft als gerade Bahn vom Eingang zum Ausgang): die erste Stellung der Kamera
  // zeigt meist nur die Überschrift auf dem Papier, die Bahn am Rand der Parzelle läge außerhalb des Bildes. Die Bahn rückt deshalb so weit zur Mitte, bis
  // sie in der ersten Stellung im Bild steht (|x| ≤ ARR_X), und der Punkt kommt erst dort an, wo sie ins Bild tritt (I.arrive = z der Ankunft, y im Bild ≥ ARR_Y):
  // so bleibt er bis zum Ende des Flugs im Bild.
  const ARR_X = .9, ARR_Y = -.62;
  function laneArrival(I) {
    const f = I.fcfg, own = I.cfg.ownThread === false ? null : I.def.thread;
    I.arrive = null;
    if (I.idx === 0 || !f || own || !f.in || !f.out || f.in.length !== 2 || f.out.length !== 2 || f.via) return;
    const pc = new THREE.PerspectiveCamera(fovOf(I), aspect, .1, 300);
    pc.position.copy(I.camStart); pc.lookAt(I.tgtStart); pc.updateMatrixWorld(); pc.updateProjectionMatrix();
    const zf = I.cell[3] - .2, zb = I.cell[2] + .2, p = V();
    const firstVisible = x => {
      for (let z = zf; z >= zb; z -= .25) { p.set(x, .02, z).project(pc); if (p.z < 1 && p.y >= ARR_Y && p.y <= .6 && Math.abs(p.x) <= ARR_X) return z; }
      return null;
    };
    // Bahn möglichst frei von Bauteilen (Faden läuft um sie herum, nicht durch sie): Abstand zu den Kanten aller Bauteile über 5 cm Höhe
    const inv = I.M4.clone().invert(), bx = I.boxes.map(b => b.clone().applyMatrix4(inv)).filter(b => b.max.y > .1);
    const free = x => !bx.some(b => x > b.min.x - .35 && x < b.max.x + .35 && b.max.z > zb && b.min.z < zf);
    // Seite der Bahn: wo die Kamera am Ende der Szene steht (mehr als 4 Einheiten neben der Mitte des Inhalts), dort läuft auch die Bahn, damit der Punkt beim Abflug
    // nicht hinter den Bauteilen der Szene verschwindet; sonst bleibt sie, wo sie war (gespiegelt an der Mitte des Inhalts)
    const mid = (I.content[0] + I.content[1]) / 2, side = I.camEnd.x - mid > 4 ? 1 : I.camEnd.x - mid < -4 ? -1 : 0;
    let xo = f.in[0]; if (side && Math.sign(xo - mid) !== side) xo = 2 * mid - xo;
    const x0 = clamp(xo, I.cell[0] + .4, I.cell[1] - .4);
    let best = null, fallback = null;
    for (let k = 0; k <= 160 && !best; k++) {
      for (const sg of k ? [-1, 1] : [1]) {
        const x = x0 + sg * k * .25; if (x < I.cell[0] + .4 || x > I.cell[1] - .4) continue;
        const z = firstVisible(x); if (z === null) continue;
        if (free(x)) { best = { x, z }; break; }
        if (!fallback) fallback = { x, z };
      }
    }
    const pick = best || fallback; if (!pick) return;
    const x = pick.x, zA = pick.z;
    if (!best) dbg("Bahn " + I.name + " liegt in der ersten Stellung nur an Bauteilen im Bild");
    f.in = [x, f.in[1]]; f.out = [x, f.out[1]];
    I.arrive = zA < zf - .05 ? zA : null;
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
  // ---------- Abschnitte der Seite: Szene, Übergang, Szene, … ----------
  // Längen in vh aus der Szenenfolge (cfg.len, cfg.tr), fest, damit #p-Werte schon vor dem Bau aller Szenen gelten
  function makeSegments() {
    SEGS = []; let acc = 0;
    INST.forEach((I, i) => {
      const L = I.cfg.len[narrow ? "n" : "d"], T = i ? I.cfg.tr[narrow ? "n" : "d"] : 0;
      if (i) { SEGS.push({ kind: "t", i, v0: acc, v1: acc + T }); acc += T; }
      SEGS.push({ kind: "b", i, v0: acc, v1: acc + L }); acc += L;
    });
    // Schluss: Zoom-out aus der letzten Stellung zur Karte (letztes Fünftel steht), danach ist die Seite zu Ende
    const ZL = ZOOM[narrow ? "n" : "d"];
    SEGS.push({ kind: "z", i: INST.length - 1, v0: acc, v1: acc + ZL }); acc += ZL;
    TOTAL = acc;
    for (const s of SEGS) { s.p0 = s.v0 / TOTAL; s.p1 = s.v1 / TOTAL; }
    INST.forEach(I => { I.body = SEGS.find(s => s.kind === "b" && s.i === I.idx); I.trIn = SEGS.find(s => s.kind === "t" && s.i === I.idx) || null; });
    ZSEG = SEGS[SEGS.length - 1];
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
    out.push({ name: "uebersicht", label: "Übersicht", p: 1, main: false });                 // die stehende Karte am Seitenende
    return out;
  }
  const anchorP = a => {
    if (a.p === null && a.inst) {
      ensure(a.inst.idx);
      const ki = typeof a.ki === "function" ? a.ki(a.inst.def) : a.ki, k = a.inst.def.keys[ki];
      a.p = k ? a.inst.body.p0 + a.inst.def.pOfU(k.u) * (a.inst.body.p1 - a.inst.body.p0) : a.inst.body.p0;
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
    if (st.kind === "b") {
      if (I.idx < st.i) return I.bMax;
      if (I.idx > st.i) return I.b0;
      return clamp(I.def.bOfU(I.def.uOfP(st.q)), 0, 1);
    }
    if (st.kind === "z") return I.idx < st.i ? I.bMax : I.bLast + (I.bMax - I.bLast) * sm(st.q * 3);
    if (I.idx < st.i - 1) return I.bMax;
    if (I.idx === st.i - 1) return I.bLast + (I.bMax - I.bLast) * sm(st.q);
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
  // ---------- Verfolgungsfahrt zwischen den Szenen ----------
  // Zwischen zwei Szenen läuft der rote Punkt am Faden von der verlassenen zur kommenden Parzelle (Teil des Fadens der Szene, falls er erst im Übergang
  // gezeichnet wird, danach die Brücke), gleichmäßig nach Bogenlänge an den Scrollweg des Flugs gebunden (linkTimes). Die Kamera folgt ihm nah und flach:
  // auf dem Faden hinter und über dem Punkt (nie über ihm, auch nicht in Haarnadeln), Blick auf die Stelle vor ihm. Position und Blickpunkt folgen dieser
  // Idealstellung wie kritisch gedämpfte Federn (Zeitkonstante in vh Scrollweg), gerechnet über die Bogenlänge vorab als Spur, damit die Stellung bei jedem
  // p gilt; sie starten an der letzten Stellung der verlassenen Szene. Eine weiche Nachführung hält den Punkt im Bild, die Höhe weicht Bauteilen aus.
  // Im letzten Teil blendet die Spur zur ersten Stellung der kommenden Szene (Winkel und Logarithmus des Abstands, kein Schnitt, kein Knick).
  const CHASE = { back: 8.5, hgt: 3.2, ahead: 12, tauC: 8, tauT: 7 };
  const CHASE_N = { back: 9.5, hgt: 3.8, ahead: 15, tauC: 8, tauT: 7 };       // hochkant: etwas weiter zurück, Blick weiter voraus
  const CHASE_MAXH = 14;                                                // höchste Kamerahöhe der Verfolgung (Sicht über Bauteile)
  const CHASE_I0 = 18, CHASE_I1 = 4;                                      // Weg (Einheiten) vor dem Ende, in dem die Idealstellung zur ersten Stellung der kommenden Szene läuft (ab I0 bis I1)
const CHASE_END = 8;                                                  // letztes Stück des Weges (Einheiten): Blende zur ersten Stellung der kommenden Szene
  const threadPieces = B => pieces.filter(pc => pc.time.tr === B.idx);
  // Zeitfenster der Fadenstücke eines Übergangs nach Bogenlänge (gleichmäßige Geschwindigkeit des Punktes über den ganzen Flug).
  // Stücke der verlassenen Szene, die am Ende ihrer Bahn noch nicht fertig gezeichnet sind (b läuft im Übergang weiter), laufen in den Übergang hinein
  // (time.k0: Anteil bei Beginn, time.lin0: Verlauf in der Szene selbst), sonst spränge der Punkt beim Losfahren auf das Stück des Übergangs
  function linkTimes(B) {
    const A = INST[B.idx - 1];
    if (A && A.built) {
      let end = null;
      for (const pc of pieces) {
        const tm = pc.time; if (tm.I !== A || tm.tr !== undefined || tm.b1 <= A.bLast + 1e-6) continue;
        if (end && pc.curve.getPointAt(0).distanceTo(end) > .5) break;
        const w0 = win(A.bLast, tm.b0, Math.max(1e-4, tm.b1 - tm.b0));
        tm.lin0 = !!tm.lin; tm.k0 = tm.lin ? w0 : sm(w0); tm.tr = B.idx; tm.s0 = 0; tm.s1 = 1; end = pc.curve.getPointAt(1);
      }
    }
    const pcs = threadPieces(B); if (!pcs.length) return;
    const len = pcs.map(pc => pc.curve.getLength() * (1 - (pc.time.k0 || 0))), tot = len.reduce((a, b) => a + b, 0); if (tot < 1e-3) return;
    let a = 0; pcs.forEach((pc, i) => { pc.time.s0 = a / tot; a += len[i]; pc.time.s1 = a / tot; pc.time.lin = true; });
  }
  // Weg des Punktes im Übergang als Polygonzug
  function dotPath(A, B) {
    const pts = [];
    for (const pc of threadPieces(B)) {
      const k0 = pc.time.k0 || 0, L = pc.curve.getLength() * (1 - k0), n = Math.max(8, Math.ceil(L * 4));
      for (let i = 0; i <= n; i++) { const r = pc.curve.getPointAt(k0 + (1 - k0) * i / n); if (r.y < THREAD_Y) r.y = THREAD_Y; if (!pts.length || r.distanceTo(pts[pts.length - 1]) > 1e-4) pts.push(r); }
    }
    if (pts.length < 2) { pts.length = 0; pts.push(A.exit ? A.exit.clone() : V(), B.entry ? B.entry.clone() : V(1, 0, 1)); }
    return pts;
  }
  function mixPose(c0, t0, c1, t1, w, cOut, tOut) {
    const D0 = t0.clone().sub(c0), D1 = t1.clone().sub(c1), y0 = yawOf(D0), p0 = pitchOf(D0), d0 = Math.max(.5, D0.length()), d1 = Math.max(.5, D1.length());
    cOut.copy(c0).lerp(c1, w);
    // zuerst dreht sich der Blick (flach, Gier), dann erst neigt er sich (steil gerechnet wird die Gierrichtung unruhig)
    dirAng(y0 + wrapPi(yawOf(D1) - y0) * smoother(w * 1.6), p0 + (pitchOf(D1) - p0) * smoother((w - .4) / .6), _c0);
    tOut.copy(cOut).addScaledVector(_c0, Math.exp(Math.log(d0) + (Math.log(d1) - Math.log(d0)) * w));
  }
  function chaseTrack(A, B) {
    const K = narrow ? CHASE_N : CHASE, pts = dotPath(A, B), cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const L = Math.max(1e-3, cum[cum.length - 1]);
    // Punkt bei Bogenlänge s; vor dem Anfang und hinter dem Ende geradeaus in Richtung des ersten bzw. letzten Stücks verlängert
    const last = pts.length - 1, f0 = V(), f1 = V();
    { let j = 1; while (j < last && cum[j] < .5) j++; f0.copy(pts[j]).sub(pts[0]).setY(0).normalize(); j = last - 1; while (j > 0 && L - cum[j] < .5) j--; f1.copy(pts[last]).sub(pts[j]).setY(0).normalize(); }
    const at = (s, out) => {
      if (s <= 0) return out.copy(pts[0]).addScaledVector(f0, s);
      if (s >= L) return out.copy(pts[last]).addScaledVector(f1, s - L);
      let lo = 0, hi = last; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
      return out.copy(pts[lo]).lerp(pts[hi], (s - cum[lo]) / Math.max(1e-9, cum[hi] - cum[lo]));
    };
    const n = Math.round(clamp(L * 6, 90, 900)), ds = L / n, sub = 4, hs = ds / sub;
    const P1 = B.camStart.clone().applyMatrix4(B.M4), T1 = B.tgtStart.clone().applyMatrix4(B.M4);
    const c = A.camEnd.clone().applyMatrix4(A.M4), t = A.tgtEnd.clone().applyMatrix4(A.M4), cv = V(), tv = V();
    const cams = [], tgts = [], D = V(), a = V(), b = V(), ci = V(), ti = V();
    const vh = Math.max(1, B.trIn.v1 - B.trIn.v0), upv = L / vh;                      // Einheiten Bogenlänge je vh Scrollweg
    const wc = 1 / (K.tauC * upv), wt = 1 / (K.tauT * upv);                         // Zeitkonstanten in vh Scrollweg
    // Mindesthöhe der Kamera über Bauteilen der Parzellen (Kamera nie in einem Bauteil): je Stelle des Weges die Oberkante der Bauteile unter der Kamera plus Abstand,
    // über ein Fenster vor und hinter der Stelle aufgeweitet, damit die gedämpfte Kamera schon vor dem Bauteil steigt und erst danach sinkt
    const need = new Float32Array(n + 1), boxes = []; for (const X of INST) if (X.boxes) boxes.push(...X.boxes);
    for (let j = 0; j <= n; j++) {
      at(j * ds - K.back, ci); let m = 0;
      for (const bx of boxes) if (ci.x > bx.min.x - 1.5 && ci.x < bx.max.x + 1.5 && ci.z > bx.min.z - 1.5 && ci.z < bx.max.z + 1.5) m = Math.max(m, bx.max.y + 1.8);
      // Sicht auf den Punkt: steht ein Bauteil zwischen der Idealkamera und dem Punkt, muss die Kamera so hoch stehen, dass der Blick über seine Oberkante geht
      at(j * ds, D);
      for (const bx of boxes) {
        if (bx.max.y < D.y + .1) continue;
        let t0 = 0, t1 = 1, ok = true;
        for (const ax of ["x", "z"]) {
          const d = ci[ax] - D[ax];
          if (Math.abs(d) < 1e-9) { if (D[ax] < bx.min[ax] || D[ax] > bx.max[ax]) ok = false; continue; }
          const u = (bx.min[ax] - D[ax]) / d, w = (bx.max[ax] - D[ax]) / d; t0 = Math.max(t0, Math.min(u, w)); t1 = Math.min(t1, Math.max(u, w));
        }
        if (ok && t0 > 1e-3 && t0 < t1) m = Math.max(m, Math.min(CHASE_MAXH, D.y + (bx.max.y + .4 - D.y) / t0));
      }
      need[j] = m;
    }
    // Länge des Weges, auf dem die Idealstellung zur ersten Stellung läuft: je weiter diese von der Stellung hinter dem letzten Punkt des Weges entfernt ist,
    // desto früher beginnt es (die Kamera bewegt sich dann höchstens etwa so schnell wie der Punkt), nie früher als bei 80 % des Weges
    at(L - K.back, ci); at(L + K.ahead, ti); ti.y = pts[last].y + .2;
    const dEnd = ci.distanceTo(P1), dAng = Math.acos(clamp(ti.clone().sub(ci).normalize().dot(T1.clone().sub(P1).normalize()), -1, 1)) * 180 / PI;
    const i0 = clamp(1.3 * dEnd + CHASE_I1 + 2, CHASE_I0, .8 * L), endW = clamp(.2 * dAng, CHASE_END, 2 * CHASE_END), i0o = clamp(i0 + .5 * dAng, i0, .9 * L);       // i0o: der Blick dreht schon früher (weniger Drehung je Weg), der Punkt bleibt durch die Nachführung im Bild
    const D1v = T1.clone().sub(P1), y1 = yawOf(D1v), p1 = pitchOf(D1v);
    // Steht der Punkt am Ende in der ersten Stellung im Bild? Dann hält die Nachführung ihn bis kurz vor dem Ende dort, sonst lässt sie früher los (der Blick dreht sich dann
    // über einen längeren Weg zur ersten Stellung, statt in den letzten Schritten)
    const vc = new THREE.PerspectiveCamera(fovOf(B), aspect, .1, 300); vc.position.copy(P1); vc.lookAt(T1); vc.updateMatrixWorld(); vc.updateProjectionMatrix();
    at(L, ci); ci.y = Math.max(ci.y, THREAD_Y); ci.project(vc);
    const endSeen = ci.z < 1 && Math.abs(ci.x) <= .95 && Math.abs(ci.y) <= .95;
    const hw = Math.ceil(Math.max(K.back, 3 * K.tauC * upv) / ds), hmin = new Float32Array(n + 1);
    for (let j = 0; j <= n; j++) { let m = 0; for (let i = Math.max(0, j - hw); i <= Math.min(n, j + hw); i++) m = Math.max(m, need[i]); hmin[j] = m; }
    for (let j = 0; j <= n; j++) {
      // Idealstellung auf dem Faden: Kamera um K.back hinter dem Punkt auf dem Weg (nie über ihm, auch nicht in Haarnadeln), Blick auf die Stelle K.ahead davor
      const s = j * ds; at(s, D); at(s - K.back, ci); ci.y = Math.max(D.y + K.hgt, hmin[j]); at(s + K.ahead, ti); ti.y = D.y + .2;
      // gegen Ende wandert schon die Idealstellung zur ersten Stellung der kommenden Szene (CHASE_I0 … CHASE_I1 des Weges): die gedämpfte Kamera kommt so
      // ohne weiten Sprung dort an, der Rest der Blende (CHASE_END) ist kurz
      const wI = smoother(win(s, L - i0, i0 - CHASE_I1)); if (wI > 0) mixPose(ci.clone(), ti.clone(), P1, T1, wI, ci, ti);
      const wO = smoother(win(s, L - i0o, i0o - CHASE_I1)) * (1 - wI);
      if (wO > 0) { const Dd = ti.clone().sub(ci), dl = Math.max(.5, Dd.length()), yy = yawOf(Dd), pp = pitchOf(Dd); dirAng(yy + wrapPi(y1 - yy) * wO, pp + (p1 - pp) * wO, _c0); ti.copy(ci).addScaledVector(_c0, dl); }
      // Der Punkt bleibt im Bild (unteres Drittel bis Mitte): läuft die gedämpfte Blickrichtung zu weit hinter ihm her, wird sie weich (tanh) so nachgeführt,
      // dass er höchstens bis zu einer Grenze aus der Mitte wandert (Gier 45 % der halben Bildbreite, Neigung zwischen etwa 8 % und 68 % der halben Bildhöhe)
      const hV = (fovOf(A) + (fovOf(B) - fovOf(A)) * sm(j / n)) * PI / 360, hH = Math.atan(Math.tan(hV) * aspect), ly = .45 * hH, lp = .3 * hV, cp = .38 * hV;
      a.copy(t).sub(c); b.copy(D).sub(c);
      const dl = Math.max(.5, a.length()), yd = yawOf(b), pd = pitchOf(b), ey = wrapPi(yd - yawOf(a)), ep = pd - pitchOf(a);
      // (die Gier-Nachführung entfällt, wenn der Punkt fast senkrecht unter der Kamera liegt: dort ist seine Richtung unbestimmt)
      const wk = smoother(win(s / L, 0, .2));                           // am Anfang gilt noch die Stellung der verlassenen Szene (kein Sprung), dann greift die Nachführung
      dirAng(yd - (ey + (ly * Math.tanh(ey / ly) - ey) * wk * (1 - smoother(win(pd, 1, .5)))), pd - (ep + (cp + lp * Math.tanh((ep - cp) / lp) - ep) * wk), a);
      cams.push(c.clone()); tgts.push(c.clone().addScaledVector(a, dl));
      for (let k = 0; k < sub; k++) {
        cv.addScaledVector(_nn.copy(ci).sub(c).multiplyScalar(wc * wc), hs).multiplyScalar(1 - 2 * wc * hs); c.addScaledVector(cv, hs);
        tv.addScaledVector(_nn.copy(ti).sub(t).multiplyScalar(wt * wt), hs).multiplyScalar(1 - 2 * wt * hs); t.addScaledVector(tv, hs);
      }
    }
    return { cams, tgts, n, L, P1, T1, endW, at, endSeen };
  }
  // Catmull-Rom durch vier Stützwerte
  const cr = (p0, p1, p2, p3, u, out) => out.set(0, 0, 0).addScaledVector(p0, -.5 * u + u * u - .5 * u * u * u).addScaledVector(p1, 1 - 2.5 * u * u + 1.5 * u * u * u).addScaledVector(p2, .5 * u + 2 * u * u - 1.5 * u * u * u).addScaledVector(p3, -.5 * u * u + .5 * u * u * u);
  function poseOf(st, cam, tgt) {
    const I = INST[st.i];
    if (st.kind === "b") { localPose(I, st.q, cam, tgt); cam.applyMatrix4(I.M4); tgt.applyMatrix4(I.M4); return fovOf(I); }
    // nach der letzten Szene (Schluss-Zoom, Karte): die Kamera startet an der letzten Stellung der letzten Szene, die Karte blendet kern (blendMap)
    if (st.kind === "z") { localPose(I, 1, cam, tgt); cam.applyMatrix4(I.M4); tgt.applyMatrix4(I.M4); return fovOf(I); }
    const A = INST[st.i - 1], B = I;
    if (!B.trVel || B.trVelKey !== aspect) { B.trVel = chaseTrack(A, B); B.trVelKey = aspect; }
    const tr = B.trVel, q = clamp(st.q, 0, 1), u = q * tr.n, i = Math.min(tr.n - 1, Math.floor(u)), f = u - i, g = k => clamp(k, 0, tr.n);
    cr(tr.cams[g(i - 1)], tr.cams[i], tr.cams[i + 1], tr.cams[g(i + 2)], f, cam);
    cr(tr.tgts[g(i - 1)], tr.tgts[i], tr.tgts[i + 1], tr.tgts[g(i + 2)], f, tgt);
    const wo = smoother(win(q * tr.L, tr.L - tr.endW, tr.endW));
    if (wo > 0) mixPose(cam.clone(), tgt.clone(), tr.P1, tr.T1, wo, cam, tgt);
    const fovP = fovOf(A) + (fovOf(B) - fovOf(A)) * sm(q);
    // Der Punkt bleibt im Bild, auch in der Blende zur ersten Stellung: steht er außerhalb der Grenze (Gier 50 %, Neigung 75 % der halben Bildbreite bzw. -höhe),
    // wird der Blick weich (tanh) so nachgeführt, dass er an der Grenze bleibt; die Führung läuft in den letzten 10 % des Flugs aus (die Stellung am Ende ist die der Szene)
    const qa = tr.endSeen ? .9 : .55, pw = 1 - smoother(win(q, qa, 1 - qa));
    if (pw > 0) {
      tr.at(q * tr.L, _t2); if (_t2.y < THREAD_Y) _t2.y = THREAD_Y;
      const Dv = tgt.clone().sub(cam), Dd = _t2.clone().sub(cam), yv = yawOf(Dv), pv = pitchOf(Dv), yd = yawOf(Dd), pd = pitchOf(Dd), ey = wrapPi(yd - yv), ep = pd - pv;
      if (Math.abs(ey) < 1.9 && Dd.length() > .5) {
        const hV = fovP * PI / 360, hH = Math.atan(Math.tan(hV) * aspect), ly = .5 * hH, lp = .75 * hV;
        const wy = pw * (1 - smoother(win(Math.abs(pd), 1, .5)));
        dirAng(yv + (ey - ly * Math.tanh(ey / ly)) * wy, pv + (ep - lp * Math.tanh(ep / lp)) * pw, _c0);
        tgt.copy(cam).addScaledVector(_c0, Dv.length());
      }
    }
    return fovP;
  }

  // ---------- Roter Faden ----------
  // Ein Faden durch alle Szenen: je Szene Eingang (Vorderkante des Bogens), der eigene Faden der Szene (def.thread) und Ausgang
  // (Hinterkante), dazwischen Brücken über die Lücke. Stücke laufen nach b ihrer Szene oder nach dem Anteil eines Übergangs.
  const pieces = [];
  let dot = null;
  const tmat = new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const THREAD_HW = .022;
  let threadHW = THREAD_HW;
  // Faden und Punkt liegen immer über jeder flachen Bodenfläche: Teile und Abdrücke liegen auf Ebenen y = Ebene · EPS (bis etwa .01), der
  // Bogen auf 0; Stützpunkte darunter werden auf THREAD_Y angehoben (Stehende Teile verdecken den Faden weiterhin über die Tiefe)
  const THREAD_Y = .02;
  function ribbon(pts0) {
    const pts = pts0.map(p => p.y < THREAD_Y ? V(p.x, THREAD_Y, p.z) : p);
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5);
    const len = curve.getLength(), N = Math.round(clamp(len * 18, 24, 1400)), sp = curve.getSpacedPoints(N);
    // Catmull-Rom schwingt zwischen steilem Abstieg und flachem Lauf unter die Stützpunkte (am Rechner bis y −0,08: Lücke unter dem Bogen): nie unter THREAD_Y
    for (const q of sp) if (q.y < THREAD_Y) q.y = THREAD_Y;
    const pos = new Float32Array((N + 1) * 6), idx = [];
    // fill(hw): Halbbreite des Bandes neu schreiben (in der Karte wächst sie mit dem Abstand, damit der Faden ~2,5 px breit bleibt)
    const fill = hw => {
      let prev = null;
      for (let i = 0; i <= N; i++) {
        const p = sp[i], q = sp[Math.min(N, i + 1)], r = sp[Math.max(0, i - 1)];
        const d = V().subVectors(q, r); const vert = Math.abs(d.y) > .5 * d.length();
        let sd;
        if (vert) sd = V(hw, 0, 0); else { d.y = 0; d.normalize(); sd = V().crossVectors(d, UP).multiplyScalar(hw); }
        // Seite des Bandes stetig halten: beim Übergang von steil zu flach kehrte sich sonst die Seite um, das Band verdrehte sich (Schleife, Lücke)
        if (prev && sd.dot(prev) < 0) sd.negate();
        prev = sd;
        pos.set([p.x - sd.x, p.y, p.z - sd.z, p.x + sd.x, p.y, p.z + sd.z], i * 6);
      }
    };
    fill(THREAD_HW);
    for (let i = 0; i < N; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const mesh = new THREE.Mesh(g, tmat); mesh.renderOrder = 2; mesh.frustumCulled = false; scene.add(mesh);
    return { curve, N, g, mesh, fill };
  }
  // Punkt (x, z) oder (x, y, z) in Szenenkoordinaten → Welt
  const wpt = (I, a) => (a.isVector3 ? a.clone() : a.length === 3 ? V(a[0], a[1], a[2]) : V(a[0], .004, a[1])).applyMatrix4(I.M4);
  function addPiece(I, pts, time) {
    if (pts.length < 2) return;
    const r = ribbon(pts); r.time = time; r.I = I; r.end = pts[pts.length - 1].clone(); pieces.push(r);
  }
  // Weg des Fadens über den Tisch von der Hinterkante von A zur Vorderkante von I (wie bei einem U-Bahn-Plan: gerade Strecken, Ecken als Kreisbögen).
  // Gleiche Richtung (Parzellen einer Bahn): aus A gerade hinaus, in der Mitte der Gasse quer (Versatz), gerade in I hinein. Gegenrichtung (Wende zwischen
  // zwei Bahnen): aus A gerade hinaus, über die Parzellen hinaus (U_E) quer zur Nachbarbahn, gerade zurück in I hinein; Ecken mit Radius U_R, keine Schleifen.
  const along = (r, h) => { let mx = -1e9, mn = 1e9; for (const [x, z] of [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]]) { const d = x * h.x + z * h.z; mx = Math.max(mx, d); mn = Math.min(mn, d); } return [mn, mx]; };
  function bridge(A, I) {
    const e0 = A.exit.clone().setY(.004), e1 = I.entry.clone().setY(.004), hA = headOf(A), hB = headOf(I), pa = V(-hA.z, 0, hA.x);
    const f0 = e0.dot(hA), f1 = e1.dot(hA), lat = e1.clone().sub(e0).dot(pa);
    const [, backA] = along(A.fp, hA);
    const pt = (f, base, ref) => base.clone().addScaledVector(hA, f - ref);       // Punkt auf der Längslinie von base bei Längskoordinate f
    if (hA.dot(hB) > .9) {
      // gerade hinaus, schräg über die Gasse (Versatz), gerade hinein: Ecken als Bögen, kein rechtwinkliger Zickzack
      if (Math.abs(lat) < .3 || f1 - f0 < 4) return fillet([e0, e0.clone().lerp(e1, .5), e1], BRIDGE_R);
      const stub = clamp((f1 - f0) * .3, 2, 7), P1 = pt(f0 + stub, e0, f0), P2 = pt(f1 - stub, e1, f1);
      return fillet([e0, P1, P2, e1], BRIDGE_R);
    }
    if (hA.dot(hB) < -.9) {
      const fu = backA + U_E, W1 = pt(fu, e0, f0), W2 = pt(fu, e1, f1);
      return fillet([e0, W1, W2, e1], U_R);
    }
    return fillet([e0, e0.clone().lerp(e1, .5), e1], BRIDGE_R);
  }
  // Polygonzug mit Ecken als Kreisbögen (Radius r, bei kurzen Schenkeln kleiner): je Ecke Anfang und Ende des Bogens und Zwischenpunkte
  function fillet(W, r) {
    const out = [W[0].clone()];
    for (let i = 1; i < W.length - 1; i++) {
      const a = W[i - 1], c = W[i], b = W[i + 1], din = c.clone().sub(a), dout = b.clone().sub(c), li = din.length(), lo = dout.length();
      din.normalize(); dout.normalize();
      const th = Math.acos(clamp(din.dot(dout), -1, 1));
      if (th < 1e-3 || li < 1e-6 || lo < 1e-6) { out.push(c.clone()); continue; }
      const tl = Math.tan(th / 2), tmax = Math.min(i === 1 ? .98 * li : .5 * li, i === W.length - 2 ? .98 * lo : .5 * lo), rr = Math.min(r, tmax / tl), t = rr * tl;
      const p0 = c.clone().addScaledVector(din, -t), p1 = c.clone().addScaledVector(dout, t);
      const ctr = c.clone().addScaledVector(dout.clone().sub(din).normalize(), rr / Math.cos(th / 2));
      const v0 = p0.clone().sub(ctr), v1 = p1.clone().sub(ctr), n = Math.max(6, Math.ceil(th / (PI / 20)));
      out.push(p0);
      for (let k = 1; k < n; k++) { const u = k / n; out.push(ctr.clone().addScaledVector(v0, Math.sin((1 - u) * th) / Math.sin(th)).addScaledVector(v1, Math.sin(u * th) / Math.sin(th))); }
      out.push(p1);
    }
    out.push(W[W.length - 1].clone());
    return out;
  }
  // Ankunft auf einem Zulauf (Weltpunkte): erster Punkt, der in der ersten Stellung der Szene im Bild steht (|x| ≤ ARR_X, y von ARR_Y bis .6), sonst null;
  // steht schon der Anfang im Bild (oder erst gar nichts), ebenfalls null. Ergebnis: Zulauf bis zur Ankunft (head) und der Rest ab dort (tail, kann fehlen).
  function preArrival(I, pre) {
    if (I.idx === 0) return null;
    const pc = new THREE.PerspectiveCamera(fovOf(I), aspect, .1, 300), P1 = I.camStart.clone().applyMatrix4(I.M4), T1 = I.tgtStart.clone().applyMatrix4(I.M4);
    pc.position.copy(P1); pc.lookAt(T1); pc.updateMatrixWorld(); pc.updateProjectionMatrix();
    const seen = p => { const q = p.clone().project(pc); return q.z < 1 && q.y >= ARR_Y && q.y <= .6 && Math.abs(q.x) <= ARR_X + .06; };
    if (seen(pre[0])) return null;
    for (let i = 0; i < pre.length - 1; i++) {
      const a = pre[i], b = pre[i + 1], len = a.distanceTo(b), n = Math.max(1, Math.ceil(len / .25));
      for (let k = 1; k <= n; k++) {
        const p = a.clone().lerp(b, k / n); if (!seen(p)) continue;
        const head = [...pre.slice(0, i + 1), p], tail = k / n < 1 || i + 1 < pre.length - 1 ? [p, ...pre.slice(i + 1)] : null;
        return { head, tail: tail && tail.length > 1 && tail[0].distanceTo(tail[tail.length - 1]) > .05 ? tail : null };
      }
    }
    return null;
  }
  function buildThreadFor(I) {
    if (!dot) {
      dot = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); dot.renderOrder = 6; dot.visible = false; scene.add(dot);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.95, 48), new THREE.MeshBasicMaterial({ color: RED, toneMapped: false, depthWrite: false, transparent: true, opacity: .75, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); ring.renderOrder = 6; ring.visible = false; dot.add(ring); dot.userData.ring = ring;
    }
    const f = I.fcfg; if (!f) return;
    // Eingang und Ausgang liegen innerhalb der Parzelle (Anlauf vor der Kante entfällt), sonst bliebe der Faden außerhalb des Bogens
    const [cx0, cx1, cz0, cz1] = I.cell, inCell = a => a && !a.isVector3 && a.length === 2 ? [clamp(a[0], cx0 + .4, cx1 - .4), clamp(a[1], cz0 + .2, cz1 - .2)] : a;
    f.in = inCell(f.in); f.out = inCell(f.out);
    const own = I.cfg.ownThread === false ? null : I.def.thread;
    const ownPts = own ? own.pts.slice(f.ownFrom || 0).map(p => p.clone().applyMatrix4(I.M4)) : null;
    I.entry = f.in ? wpt(I, f.in) : (ownPts ? ownPts[0] : null);
    // own.arms / own.post (Eröffnung): der Faden verzweigt sich; Arme laufen von der Teilung (Ende von pts) zur Vereinigung (Anfang von post)
    const postPts = own && own.post ? own.post.pts.map(p => p.clone().applyMatrix4(I.M4)) : null;
    I.exit = f.out ? wpt(I, f.out) : (postPts ? postPts[postPts.length - 1] : ownPts ? ownPts[ownPts.length - 1] : null);
    // Brücke aus der vorigen Szene: läuft im zweiten Teil der Fahrt hinüber
    const A = INST[I.idx - 1];
    if (A && A.exit && I.entry) addPiece(I, bridge(A, I), { tr: I.idx, s0: .3, s1: 1 });
    const outTime = (b1) => b1 + .06 <= I.bMax ? { I, b0: b1, b1: b1 + .06 } : { tr: I.idx + 1, s0: 0, s1: .3 };
    if (ownPts) {
      const t0 = Math.max(own.t0, I.b0), t1 = Math.max(own.t1, t0 + .01);
      if (f.in) {
        // Zulauf zum eigenen Faden: steht sein Anfang nicht im Bild der ersten Stellung, kommt der Punkt im Flug bis dorthin, wo der Zulauf ins Bild tritt (Rest in der Szene)
        const pre = [I.entry, ...(f.viaPre || []).map(a => wpt(I, a)), ownPts[0]], cut = preArrival(I, pre), tm = { I, b0: Math.max(I.b0, t0 - .05), b1: t0 };
        if (cut) { addPiece(I, cut.head, { tr: I.idx, s0: .3, s1: 1 }); if (cut.tail) addPiece(I, cut.tail, tm); } else addPiece(I, pre, tm);
      }
      addPiece(I, ownPts, { I, b0: t0, b1: Math.min(t1, I.bMax), lin: !!own.lin });
      if (own.arms) for (const a of own.arms) addPiece(I, a.pts.map(p => p.clone().applyMatrix4(I.M4)), { I, b0: a.t0, b1: a.t1, lin: !!a.lin });
      if (postPts) addPiece(I, postPts, { I, b0: own.post.t0, b1: own.post.t1, lin: !!own.post.lin });
      if (f.out) addPiece(I, [ownPts[ownPts.length - 1], ...(f.viaPost || []).map(a => wpt(I, a)), I.exit], outTime(Math.min(t1, I.bMax)));
    } else if (I.entry && I.exit) {
      // Bahn durch die Parzelle: bis zur Ankunft (zeigt die erste Stellung) im Flug in diese Szene, der Rest im Flug aus ihr heraus
      if (I.arrive !== null && I.arrive !== undefined) {
        const A = wpt(I, [f.in[0], I.arrive]);
        addPiece(I, [I.entry, A], { tr: I.idx, s0: .3, s1: 1 });
        addPiece(I, [A, ...(f.via || []).map(a => wpt(I, a)), I.exit], { tr: I.idx + 1, s0: 0, s1: .3 });
      } else addPiece(I, [I.entry, ...(f.via || []).map(a => wpt(I, a)), I.exit], { tr: I.idx + 1, s0: 0, s1: .3 });
    }
    linkTimes(I);       // Punkt im Übergang in diese Szene: gleichmäßig nach Bogenlänge über den ganzen Flug
  }
  function updateThread(st) {
    let last = null;
    // Karte: Faden und Punkt behalten eine feste Größe in Pixeln (Faden ~2,5 px breit, Punkt ~7 px Radius mit dünnem Ring)
    const kk = smoother(win(Mcur, .25, .85)), mp0 = kk > 0 ? mapPose() : null;
    const wpp = mp0 ? 2 * Math.tan(camera.fov * PI / 360) * camera.position.distanceTo(mp0.tgt) / VH() : 0;
    const hwT = THREAD_HW + (Math.max(THREAD_HW, 1.3 * wpp) - THREAD_HW) * kk;
    if (Math.abs(hwT - threadHW) > .004 * Math.max(1, threadHW / THREAD_HW) || (kk === 0 && threadHW !== THREAD_HW)) {
      threadHW = hwT; for (const pc of pieces) { pc.fill(hwT); pc.g.attributes.position.needsUpdate = true; }
    }
    for (const pc of pieces) {
      const tm = pc.time; let k;
      if (tm.k0 !== undefined && sInto(tm.tr, st) <= 0) { const w0 = win(bOf(tm.I, st), tm.b0, Math.max(1e-4, tm.b1 - tm.b0)); k = tm.lin0 ? w0 : sm(w0); }     // noch in der Szene
      else if (tm.tr !== undefined) { const w = win(sInto(tm.tr, st), tm.s0, tm.s1 - tm.s0); k = tm.tr >= INST.length ? 0 : (tm.k0 || 0) + (1 - (tm.k0 || 0)) * (tm.lin ? w : sm(w)); }
      else { const b = bOf(tm.I, st), w0 = win(b, tm.b0, Math.max(1e-4, tm.b1 - tm.b0)); k = tm.lin ? w0 : sm(w0); }
      pc.mesh.visible = k > 0;
      pc.g.setDrawRange(0, Math.floor(k * pc.N) * 6);
      if (k > 0) last = { pc, k };
    }
    dot.visible = !!last;
    if (last) {
      last.pc.curve.getPointAt(last.k, dot.position); if (dot.position.y < THREAD_Y) dot.position.y = THREAD_Y;
      dot.quaternion.copy(camera.quaternion);
      const dd = camera.position.distanceTo(dot.position), rN = Math.max(.05, dd * .0065), rM = 7 * 2 * Math.tan(camera.fov * PI / 360) * dd / VH();
      dot.scale.setScalar(rN + (rM - rN) * kk); if (dot.userData.ring) dot.userData.ring.visible = kk > .3;
      // Tiefentest wie beim Faden (Bauteile verdecken den Punkt); die Scheibe steht senkrecht zum Blick und würde zur Hälfte im Boden stecken:
      // entlang des Sehstrahls um ihren Ring-Radius nach vorn (die Lage im Bild ändert sich dabei nicht), nie über die halbe Entfernung
      dot.position.addScaledVector(_nn.copy(camera.position).sub(dot.position).normalize(), Math.min(dot.scale.x * 2.1, dd * .5));
    }
    return last;
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

  // ---------- Tisch und Karte ----------
  // Der Tisch ist der gemeinsame Bogen unter allen Parzellen (etwas dunkler als die Bögen der Szenen, mit Haarkante und weichem Schatten).
  // Die Karte ist die halb isometrische Draufsicht auf den ganzen Tisch: Zustand M (0 = Fahrt der Seite, 1 = Karte). M kommt aus dem Schluss-
  // Zoom (Segment "z", an p gebunden) oder aus dem Knopf „Übersicht“ (Mextra, zeitlich geglättet); die Kamera blendet von ihrer Stellung zur
  // Kartenstellung (zuerst hoch, dann seitlich, die Blickrichtung dreht ruhig über die Mitte).
  let Muser = 0, Mextra = 0, MAP = null, table = null;
  const mSeg = st => st.kind === "z" ? smoother(win(st.q, 0, .88)) : 0;
  let mapOK = true, revealN = 0, lowRatio = false;                       // lowRatio: in der Karte geringere Pixeldichte (weniger Füllrate)                                        // mapOK: bricht ein Teil der Karte, bleibt die Seite ohne Karte nutzbar
  const mNow = st => mapOK ? Math.max(mSeg(st), Mextra) : 0;
  function mapFail(e) {
    console.error("Karte abgeschaltet:", e); dbg("Karte abgeschaltet: " + (e && e.message));
    if (!mapOK) return;
    mapOK = false; Muser = 0; Mextra = 0;
    try { const b = document.getElementById("uebersicht"); if (b && b.style) b.style.display = "none"; const k = document.getElementById("karte"); if (k && k.style) k.style.display = "none"; } catch (e2) { /* nichts */ }
  }
  const TM = 5.5;                                                       // Rand des Tisches um die Parzellen (der Faden läuft nirgends näher an der Kante)
  const KARTE = { d: { pitch: 48, yaw: 0, fov: 25 }, n: { pitch: 60, yaw: 0, fov: 30 } };
  // Fläche des Rasters samt Wenden des Fadens (Welt): aus den Plätzen aller Szenen, auch solange erst ein Teil gebaut ist
  function tableRect() {
    const G = GRID[narrow ? "n" : "d"];
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, h = 0;
    for (let i = 0; i < INST.length; i++) {
      const P = slotOf(i).P; x0 = Math.min(x0, P.x - G.cl / 2); x1 = Math.max(x1, P.x + G.cl / 2); z0 = Math.min(z0, P.z - G.cf / 2); z1 = Math.max(z1, P.z + G.cf / 2);
    }
    x0 -= TM; x1 += TM; z0 -= TM + U_E; z1 += TM + U_E;                  // oben und unten laufen die Wenden aus
    for (const I of INST) if (I.built) h = Math.max(h, I.ext.max.y);
    for (const pc of pieces) for (const pt of pc.curve.getPoints(40)) { x0 = Math.min(x0, pt.x - 5); x1 = Math.max(x1, pt.x + 5); z0 = Math.min(z0, pt.z - 5); z1 = Math.max(z1, pt.z + 5); }
    return { x0, x1, z0, z1, h };
  }
  // Der Tisch ist der Boden unter allen Parzellen: ein sehr großer Bogen im Papierton mit zartem Raster (Schneidematte; Linien alle 2 Einheiten, kräftiger alle 10, die
  // Parzellen sitzen genau auf Linien), der außerhalb des Rasters und zum Horizont weich in den Dunst ausläuft (keine Kante, kein Weiß). Mit Schatten wie das Papier der Szenen.
  const GROUND_FRAG = `
    uniform vec3 uPaper; uniform vec3 uInk; uniform vec2 uGW; uniform vec2 uFar; uniform vec2 uC; uniform vec2 uH; uniform vec2 uGO; uniform vec2 uFade;
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
        uniforms: { uPaper: { value: new THREE.Color(PAL.ground) }, uInk: { value: new THREE.Color(PAL.gridInk) }, uGW: { value: new THREE.Vector2(PAL.gridMinor, PAL.gridMajor) }, uFar: { value: new THREE.Vector2(160, 1100) }, uC: { value: new THREE.Vector2() }, uH: { value: new THREE.Vector2(1, 1) }, uGO: { value: new THREE.Vector2() }, uFade: { value: new THREE.Vector2(4, 90) },
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
    const o = slotOf(0).P, G = GRID[narrow ? "n" : "d"]; u.uGO.value.set(o.x - G.cl / 2, o.z - G.cf / 2);
    MAP = null;
  }
  // Kartenstellung: Blickrichtung fest (Neigung, Drehung um y), Abstand so, dass der ganze Tisch samt Bauteilen im Rahmen steht
  // (oben 74 px Kopfzeile, unten 82 px Knöpfe und Fortschritt), danach die Mitte in den Rahmen geschoben
  function mapPose() {
    const key = [aspect.toFixed(3), narrow, INST.filter(I => I.built).length, VW(), VH()].join();
    if (MAP && MAP.key === key) return MAP;
    const R = tableRect(), P = KARTE[narrow ? "n" : "d"], W = VW(), H = VH();
    const yaw = P.yaw * PI / 180, pitch = P.pitch * PI / 180, fwd = dirAng(yaw, pitch, V());
    const ctr = V((R.x0 + R.x1) / 2, 0, (R.z0 + R.z1) / 2), pts = [];
    for (const x of [R.x0, R.x1]) for (const z of [R.z0, R.z1]) for (const y of [-.2, R.h + 1]) pts.push(V(x, y, z));
    const tc = new THREE.PerspectiveCamera(P.fov, W / H, 1, 6000);
    const mx = 2 * 14 / W, mt = 2 * 62 / H, mb = 2 * 74 / H;
    const place = (c, d) => { tc.position.copy(c).addScaledVector(fwd, -d); tc.lookAt(c); tc.updateMatrixWorld(); tc.updateProjectionMatrix(); };
    const box = () => { let a = 1e9, b = -1e9, c = 1e9, e = -1e9; for (const p of pts) { const v = p.clone().project(tc); a = Math.min(a, v.x); b = Math.max(b, v.x); c = Math.min(c, v.y); e = Math.max(e, v.y); } return [a, b, c, e]; };
    let c0 = ctr.clone(), d = 100;
    const fits = dd => { place(c0, dd); const [a, b, c, e] = box(); return a >= -1 + mx && b <= 1 - mx && c >= -1 + mb && e <= 1 - mt; };
    for (let it = 0; it < 3; it++) {
      let lo = 5, hi = 3000; for (let k = 0; k < 34; k++) { const m = (lo + hi) / 2; if (fits(m)) hi = m; else lo = m; }
      d = hi; place(c0, d); const [a, b, c, e] = box();
      // Mitte des Kastens soll auf der Mitte des freien Rahmens liegen: Ziel entlang rechts/oben verschieben
      const ty = (mb - mt) / 2, ox = (a + b) / 2, oy = (c + e) / 2 - ty;
      const hh = d * Math.tan(P.fov * PI / 360), ww = hh * (W / H), right = V().setFromMatrixColumn(tc.matrixWorld, 0), up = V().setFromMatrixColumn(tc.matrixWorld, 1);
      c0.addScaledVector(right, ox * ww).addScaledVector(up, oy * hh);
    }
    place(c0, d); d *= 1.015; dbg("Kartenstellung fertig, Abstand " + d.toFixed(0));
    MAP = { key, tgt: c0.clone(), cam: c0.clone().addScaledVector(fwd, -d), fov: P.fov, yaw, pitch, dist: d, R };
    return MAP;
  }
  // Kamera von der Fahrtstellung zur Kartenstellung blenden (M 0 … 1); verändert cam und tgt, liefert das Sichtfeld
  function blendMap(cam, tgt, fov, M) { return M <= 0 ? fov : blendPose(cam, tgt, fov, mapPose(), M); }
  // allgemein: von der Stellung (cam, tgt, fov) zur Stellung mp = { cam, yaw, pitch, dist, fov } blenden (M 0 … 1): zuerst hoch, dann seitlich,
  // Blickrichtung (Drehung, Neigung) und Abstand in Winkeln und Logarithmen, nicht als Punkte (sonst schwenkt der Blick am Rand schneller)
  function blendPose(cam, tgt, fov, mp, M) {
    const D = tgt.clone().sub(cam), yB = yawOf(D), pB = pitchOf(D), dB = Math.max(.5, D.length());
    const eY = smoother(win(M, 0, .72)), eXZ = smoother(win(M, .16, .84)), eO = smoother(win(M, .04, .96));
    cam.x += (mp.cam.x - cam.x) * eXZ; cam.z += (mp.cam.z - cam.z) * eXZ; cam.y += (mp.cam.y - cam.y) * eY;
    const yaw = yB + wrapPi(mp.yaw - yB) * eO, pitch = pB + (mp.pitch - pB) * eO, dist = Math.exp(Math.log(dB) + (Math.log(mp.dist) - Math.log(dB)) * eO);
    dirAng(yaw, pitch, _c0); tgt.copy(cam).addScaledVector(_c0, dist);
    return fov + (mp.fov - fov) * eO;
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

  // ---------- Übersicht: anklickbare Parzellen (SVG über der Karte) ----------
  const SVGNS = "http://www.w3.org/2000/svg";
  let cards = [], cardHost = null, hereI = null;
  function buildCards() {
    cards = []; cardHost = document.getElementById("karte");
    if (!cardHost || !cardHost.appendChild || !document.createElementNS) { cardHost = null; return; }
    while (cardHost.firstChild) cardHost.removeChild(cardHost.firstChild);
    INST.forEach(I => {
      const a = document.createElementNS(SVGNS, "a"), poly = document.createElementNS(SVGNS, "polygon"), txt = document.createElementNS(SVGNS, "text"), rect = document.createElementNS(SVGNS, "rect");
      a.setAttribute("href", "#s=" + I.name); a.setAttribute("data-scene", I.name); a.setAttribute("tabindex", "-1");
      a.setAttribute("aria-label", (I.idx + 1) + ". " + I.cfg.label);
      txt.textContent = (I.idx + 1 < 10 ? "0" : "") + (I.idx + 1) + "  " + (I.cfg.short || I.cfg.label);
      rect.setAttribute("rx", 2); rect.setAttribute("ry", 2);
      a.appendChild(poly); a.appendChild(rect); a.appendChild(txt); cardHost.appendChild(a);
      cards.push({ I, a, poly, txt, rect, tw: 0, twW: 0 });
    });
  }
  // Fläche der Parzelle (Einheitsgröße) als Viereck der Welt
  function cardCorners(I) {
    if (I.card) return I.card;
    const [x0, x1, z0, z1] = I.cell;
    return I.card = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => V(x, 0, z).applyMatrix4(I.M4));
  }
  function updateCards(M, active) {
    if (!cardHost) return;
    const W = VW(), H = VH();
    cardHost.setAttribute("viewBox", "0 0 " + W + " " + H);
    cardHost.style.opacity = String(clamp((M - .55) / .4, 0, 1));
    for (const c of cards) {
      if (!c.I.built) continue;
      const pts = cardCorners(c.I).map(p => { const v = p.clone().project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; });
      c.poly.setAttribute("points", pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "));
      // Beschriftung als kleine Papier-Pille an der Vorderkante der Parzelle (untere Kante im Bild, mittig, bei allen im gleichen Abstand), nie auf der Miniatur
      const low = pts.slice().sort((p, q) => q[1] - p[1]).slice(0, 2), cx = (low[0][0] + low[1][0]) / 2, yb = (low[0][1] + low[1][1]) / 2, ph = W < 560 ? 17 : 21;
      if (!c.tw || c.twW !== W) { c.twW = W; c.tw = c.txt.getComputedTextLength ? c.txt.getComputedTextLength() : c.txt.textContent.length * 6.5; if (!c.tw) c.tw = c.txt.textContent.length * 6.5; }
      const ly = Math.min(yb + 5 + ph / 2, H - 80), lx = clamp(cx, c.tw / 2 + 12, W - c.tw / 2 - 12), bw = c.tw + 14;
      c.txt.setAttribute("x", lx.toFixed(1)); c.txt.setAttribute("y", (ly + .5).toFixed(1));
      c.rect.setAttribute("x", (lx - bw / 2).toFixed(1)); c.rect.setAttribute("y", (ly - ph / 2).toFixed(1)); c.rect.setAttribute("width", bw.toFixed(1)); c.rect.setAttribute("height", ph);
      c.a.setAttribute("tabindex", active ? "0" : "-1");
      if (c.a.classList) c.a.classList.toggle("hier", c.I === hereI);
    }
  }

  // ---------- Bild zu einem Zustand ----------
  const visible = new Set(), _pp = V(), _nn = V(), _vv = V();
  const FOREIGN_S = [70, 140], FOREIGN = [70, 140];                    // Dunst der Nachbarszenen (wie FAR: Nachbarparzellen bleiben klar sichtbar, nur Schrift von hinten fällt weg)
  let state = null, Mcur = 0, lastApply = 0;
  // Text (nicht Bilder) steht, solange sein Träger im Bild ist, und läuft am Bildrand natürlich hinaus (Anschnitt wie bei jedem Inhalt der Seite);
  // erst wenn weniger als rund ein Viertel seiner Fläche im Bild steht, blendet er weich aus (voll ab 25 %, null bei 1 %). Drucke einer Gruppe
  // (pr.grp, z. B. die Wortmarke) bemessen sich an ihrer gemeinsamen Fläche und blenden zusammen aus: ein Name steht ganz oder gar nicht.
  // Früher: ganz im Bild (56 px oben, 48 px unten Rand) oder gar nicht, Übergang über 1,4 % der Fläche: Wörter schalteten einzeln und schlagartig ab.
  // In der Karte zusätzlich erst ab ein paar Pixeln Höhe (sonst flimmert die Schrift)
  const FADE_T = .3;                                                    // Sekunden, kürzeste Dauer jedes Ein- und Ausblendens von Drucken
  const FR0 = .01, FR1 = .24, BAND_TOP = 0, BAND_BOT = 0;
  const textFactor = (pr, cw, ch, M, gf) => {
    const fr = frameFrac(pr, cw, ch), f = gf !== undefined ? gf : fr.f; let o = sm((f - FR0) / FR1);
    if (M > .02 && fr.r) o *= sm((fr.r[3] - fr.r[1] - 3) / 5);
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
    // Karte: M > 0 zeigt alle Parzellen; sonst sichtbar: aktuelle Szene und ihre Nachbarn (im Übergang beide Szenen und die davor)
    const M = opts.M !== undefined ? opts.M : mNow(st), mapOn = M > .001;
    Mcur = M;
    if (!mapOn) revealN = 0; else if (opts.still) revealN = 99; else { revealN++; if (revealN <= INST.length + 1 || revealN % 30 === 0) dbg("Karte: aufgedeckt " + revealN + " M=" + M.toFixed(2)); }       // Karte: Parzellen erscheinen eine je Bild (Hochladen verteilen)
    const want = new Set(st.kind === "b" ? [st.i - 1, st.i, st.i + 1] : st.kind === "z" ? [st.i - 1, st.i] : [st.i - 2, st.i - 1, st.i, st.i + 1]);
    // nötig ist nur die aktuelle Szene (im Übergang: beide); Nachbarn erscheinen, sobald der Hintergrundbau sie fertig hat
    ensure(mapOn ? INST.length - 1 : st.i);
    visible.clear();
    for (const I of INST) {
      if (!I.built) continue;
      const on = mapOn ? (I.idx === st.i || I.idx < revealN) : want.has(I.idx);
      I.group.visible = on; if (on) visible.add(I); else I.fadeReady = false;
    }
    if (!opts.still) {
      // volle Auflösung nur für die Szene der Kamera (im Übergang beide Enden, kurz vor dem Übergang schon die nächste)
      const full = new Set();
      if (!mapOn) { if (st.kind === "t") { full.add(st.i - 1); full.add(st.i); } else { full.add(st.i); if (st.kind === "b" && st.q > .6) full.add(st.i + 1); } }
      try { lodStep(full, st.i); } catch (e) { mapFail(e); }
    }
    hereI = INST[st.i];
    // Dunst: die Szene, in der die Kamera ist, sieht weit (FAR); Nachbarszenen werden ab FOREIGN ausgeblendet und tauchen beim Näherkommen auf
    const wOf = I => mapOn ? 1 : st.kind === "t" ? (I.idx === st.i ? sm(st.q) : I.idx === st.i - 1 ? 1 - sm(st.q) : 0) : I.idx === st.i ? 1 : 0;
    // Zeit der Lettern: läuft ab dem Eintreffen der Szene (Fahrt in die Szene beginnt)
    const time = now / 1000, dtS = Math.min(.05, Math.max(0, (now - lastApply) / 1000)); lastApply = now;
    for (const I of INST) if (I.built && I.tStart === undefined && (I.idx < st.i || (I.idx === st.i))) I.tStart = now;
    let fov = poseOf(st, camera.position, _t);
    if (mapOn) { try { fov = blendMap(camera.position, _t, fov, M); } catch (e) { mapFail(e); } }
    // Dunst der Ferne und Nahebene folgen der Karte (aus der Karte heraus: Vorgabe)
    const hz = smoother(win(M, 0, .5)); FAR.set(70 + 830 * hz, 140 + 1660 * hz);
    if (table) table.mat.uniforms.uFar.value.set(160 + 740 * hz, 1100 + 1300 * hz);                  // der Boden läuft viel weiter aus als die Papiere der Szenen
    // Dunstfarbe: am Startbild weiß (wie das HTML-Vorbild), mit den ersten Scrollschritten zu den Farben der Palette (PAL); die Ferne ist zugleich die Hintergrundfarbe
    { const hk = st.kind === "b" && st.i === 0 ? smoother(win(st.q, .02, .25)) : 1;
      hazeC.copy(WHITE).lerp(hazeN, hk); hazeCF.copy(WHITE).lerp(hazeF, hk);
      U.haze.value.set(hazeC.r, hazeC.g, hazeC.b); U.hazeF.value.set(hazeCF.r, hazeCF.g, hazeCF.b); renderer.setClearColor(hazeCF, 1); }
    // Nahebene: in der Karte weit weg vom Tisch (Abstand mindestens 300, die Tiefengenauigkeit bleibt sonst bei großem Tisch zu grob, der Schatten unter dem Tisch flimmert)
    let nearV = .1 + 2.9 * smoother(win(M, .1, .6));
    if (mapOn) { try { nearV = .1 + (Math.max(3, mapPose().dist * .3) - .1) * smoother(win(M, .1, .6)); } catch (e) { mapFail(e); } }
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
      // Uhr der Lettern: nach 6 s ist alles aufgestanden und jeder Abdruck geschlossen (danach rechnet das Modell nur, wenn sich b ändert)
      // Anzeige-b: bricht b beim Sprung aus der Karte um (Parzellen vorn bauen sich zurück), läuft es mit begrenztem Tempo nach
      let b = bOf(I, st);
      if (I.bShown === undefined || opts.still || (!mapOn && !I.easing)) { I.bShown = b; I.easing = false; }
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
        if (o > .001 && isText(pr)) o *= textFactor(pr, cw, ch, M, pr.grp && gfr ? gfr.get(pr.grp).f : undefined);
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
    try { updateCards(M, M > .92); } catch (e) { mapFail(e); }
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
    if (Mcur > .5) { const R = tableRect(); [x0, x1, z0, z1] = [R.x0, R.x1, R.z0, R.z1]; }
    else {
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
  function jumpTo(pp, instant) {
    pp = clamp(pp, 0, 1);
    const st = stateAt(pp); ensure(st.i);
    // Sprung: frühere Szenen stehen schon fertig da (Lettern nach der Zeit eingeschlossen), die aktuelle auch, wenn p > 0
    for (const I of INST) if (I.built && (I.idx < st.i || (I.idx === st.i && pp > 0))) I.tStart = -1e9;
    target = p = pp; pVel = 0; hold = true;
    scrollTo(0, pp * maxScroll());
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
      if (pj >= ZSEG.p0) { jumpTo(ZSEG.p0); setTimeout(() => { if (!pendingJump) scrollToP(pj); }, 600); } else jumpTo(pj);
    };
    setTimeout(step, 400);
  }
  function applyHash() {
    const q = hashQ();
    const hp = q.get("p"), hs = q.get("s");
    if (hp !== null && hp !== "" && isFinite(+hp)) { jumpAny(+hp); return true; }
    if (hs) { const a = ANCH.find(a => a.name === hs); if (a) { if (Mcur > .05) Mextra = Math.max(Mextra, Mcur); Muser = 0; jumpAny(anchorP(a) + 1e-6); syncMapUi(); return true; } }
    return false;
  }
  addEventListener("hashchange", applyHash);
  // Übersicht (Karte): Knopf, Esc, Klick auf eine Parzelle. Die Karte schließt, sobald jemand scrollt oder eine Taste drückt.
  const mapBtn = document.getElementById("uebersicht"), mapNote = document.getElementById("kartenhinweis");
  let mapUiKey = "";
  function syncMapUi() {
    const st = stateAt(p), open = Muser > 0 || mSeg(st) > .5;
    if (mapUiKey === String(open)) return; mapUiKey = String(open);
    if (mapBtn) { mapBtn.setAttribute("aria-pressed", open ? "true" : "false"); mapBtn.setAttribute("aria-label", open ? "Übersicht schließen" : "Übersicht"); if (mapBtn.classList) mapBtn.classList.toggle("an", open); }
    if (cardHost) cardHost.setAttribute("aria-hidden", open ? "false" : "true");
  }
  // Karte öffnen: fehlen noch Szenen, werden sie erst Bild für Bild gebaut (zwischendurch wird gemalt), danach fährt M hoch
  function openMap() {
    if (INST.every(I => I.built)) { Muser = 1; syncMapUi(); return; }
    const step = () => { const n = INST.find(I => !I.built); if (!n) { Muser = 1; syncMapUi(); return; } build(n); setTimeout(step, 20); };
    setTimeout(step, 0);
  }
  function closeMap() {
    const st = stateAt(p);
    // am Seitenende steht die Karte an p: zurück an die letzte Stellung der letzten Szene, die Kamera sinkt dorthin
    if (mSeg(st) > .02) { Mextra = Math.max(Mextra, mNow(st)); Muser = 0; jumpTo(ZSEG.p0); } else Muser = 0;
    syncMapUi();
  }
  function flyTo(name) {
    const a = ANCH.find(a => a.name === name); if (!a) return;
    Mextra = Math.max(Mextra, mNow(stateAt(p))); Muser = 0;
    jumpTo(anchorP(a) + 1e-6); syncMapUi();
  }
  addEventListener("scroll", () => { if (!hold) { target = clamp(scrollY / maxScroll(), 0, 1); if (Muser) { Muser = 0; syncMapUi(); } } }, { passive: true });
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(ev, () => { hold = false; pendingJump = null; }, { passive: true });
  addEventListener("wheel", () => { if (Muser) { Muser = 0; syncMapUi(); } }, { passive: true });
  addEventListener("keydown", ev => {
    if (ev.key === "Escape") { if (Muser > 0 || mSeg(stateAt(p)) > .5) closeMap(); return; }
    if (Muser && ev.key !== "Tab" && ev.key !== "Enter" && ev.key !== " ") { Muser = 0; syncMapUi(); }
  });
  if (mapBtn) mapBtn.addEventListener("click", () => { const open = Muser > 0 || mSeg(stateAt(p)) > .5; if (open) closeMap(); else openMap(); });
  const karteEl = document.getElementById("karte");
  if (karteEl && karteEl.addEventListener) karteEl.addEventListener("click", ev => {
    const l = ev.target.closest && ev.target.closest("a"); if (!l) return;
    ev.preventDefault(); ev.stopPropagation();
    if (Mcur > .8) flyTo(l.getAttribute("data-scene"));
  });
  // Vor/Zurück und Navigation: normales (weiches) Scrollen an den Anfang einer Szene, kein Einrasten
  function scrollToP(pp) { hold = false; scrollTo({ top: clamp(pp, 0, 1) * maxScroll(), behavior: "smooth" }); }
  function go(dir) {
    const list = ANCH.filter(a => a.main).map(anchorP).filter(v => v !== null).sort((a, b) => a - b);
    const now = target;
    let to = dir > 0 ? list.find(s => s > now + .0015) : [...list].reverse().find(s => s < now - .0015);
    if (to === undefined) to = dir > 0 ? 1 : 0;
    scrollToP(to);
  }
  const nx = document.getElementById("next"), pv = document.getElementById("prev");
  if (nx) nx.addEventListener("click", () => { if (Muser) closeMap(); else go(1); });
  if (pv) pv.addEventListener("click", () => { if (Muser) closeMap(); else go(-1); });
  addEventListener("click", ev => {
    const l = ev.target.closest && ev.target.closest("[data-scene]"); if (!l) return;
    const a = ANCH.find(a => a.name === l.dataset.scene); if (!a) return;
    ev.preventDefault();
    if (Mcur > .3) flyTo(l.dataset.scene); else scrollToP(anchorP(a) + 1e-6);
  });

  // ---------- Klickbare Drucke (Kontaktwege) ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function linkAt(ev) {
    if (Mcur > .3) return null;                          // in der Karte gehören Klicks den Parzellen
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
    for (const I of INST) if (I.built) { buildPath(I); const c = V(), t = V(); localPose(I, 0, c, t); I.camStart = c.clone(); I.tgtStart = t.clone(); localPose(I, 1, c, t); I.camEnd = c.clone(); I.tgtEnd = t.clone(); I.trVel = null; }
  }

  // ---------- Aufbau ----------
  function init() {
    for (const I of INST) if (I.built) { scene.remove(I.group); I.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    for (const pc of pieces) { scene.remove(pc.mesh); pc.g.dispose(); }
    pieces.length = 0; links3.length = 0;
    if (table) { scene.remove(table.ground); table.ground.geometry.dispose(); table.mat.dispose(); table = null; }
    MAP = null; Muser = 0; Mextra = 0;
    aspect = VW() / VH(); narrow = aspect < 1;
    INST = SEQ.map((cfg, i) => newInstance(cfg, i));
    resize();
    makeSegments();
    ANCH = anchorsOf();
    try { buildCards(); } catch (e) { mapFail(e); }
    build(INST[0]); INST[0].tStart = performance.now();
  }
  init();
  addEventListener("resize", () => {
    const n = VW() / VH() < 1;
    if (n !== narrow) { const keep = target; init(); jumpTo(keep); } else resize();
    if (hold) scrollTo(0, target * maxScroll());
  });
  if (!applyHash()) { target = p = clamp(scrollY / maxScroll(), 0, 1); pVel = 0; }
  initPhase = false;
  // übrige Szenen im Hintergrund nacheinander bauen, erst nach dem ersten Bild (das Startbild steht vorher)
  function more() { const n = INST.find(I => !I.built); if (!n) return; build(n); setTimeout(more, 40); }

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
  let last = performance.now(), first = true, drawKey = "";
  function frameStep(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    // Dargestellter Fortschritt folgt dem Scrollfortschritt wie eine kritisch gedämpfte Feder (Eigenfrequenz SMOOTH_W, bildratenunabhängig,
    // ohne Überschwingen aus der Ruhe): Mausrad-Sprünge und schnelles Wischen werden weich, Beschleunigung und Abbremsen sind stetig
    {
      const x = p - target, ex = Math.exp(-SMOOTH_W * dt), tm = (pVel + SMOOTH_W * x) * dt;
      pVel = (pVel - SMOOTH_W * tm) * ex; p = clamp(target + (x + tm) * ex, 0, 1);
      if (Math.abs(target - p) < 1e-5 && Math.abs(pVel) < 1e-4) { p = target; pVel = 0; }
    }
    // Übersicht per Knopf: M läuft zeitlich (ruhig an und aus), unabhängig vom Scrollen
    Mextra += (Muser - Mextra) * (1 - Math.exp(-dt * 3.2)); if (Math.abs(Muser - Mextra) < .002) Mextra = Muser;
    const st = stateAt(p);
    hint && hint.classList.toggle("off", p > .004);
    document.body.classList.toggle("scrolled", scrollY > innerHeight * .6 || p > INST[0].body.p1 * .1);
    document.body.classList.toggle("kartenmodus", mNow(st) > .5);
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
    syncMapUi();
    const lr = mNow(st) > .6 && (devicePixelRatio || 1) > 1.25;
    if (lr !== lowRatio) { lowRatio = lr; renderer.setPixelRatio(lr ? 1.25 : Math.min(devicePixelRatio || 1, 2)); renderer.setSize(VW(), VH(), false); if (post) post.resize(VW(), VH(), renderer.getPixelRatio()); drawKey = ""; }
    // steht die Karte still (alle Szenen fertig, keine Textur im Tausch), wird nichts neu gezeichnet
    const key = p.toFixed(6) + "|" + mNow(st).toFixed(5) + "|" + aspect.toFixed(4) + "|" + INST.filter(I => I.built).length;
    if (mNow(st) >= .9999 && key === drawKey && INST.every(I => I.built && I.lodSmall === true && !I.easing) && revealN >= INST.length) return;
    drawKey = key;
    applyState(st, now);
    try { shadowPass(st); } catch (e) { console.error("Schatten abgeschaltet:", e); SM.off = true; U.smp.value.x = 0; scene.overrideMaterial = null; renderer.setRenderTarget(null); }
    drawScene();
    if (first) dbg("erster Frame gezeichnet");
    if (first) {
      first = false; opt.onFirstFrame && opt.onFirstFrame(); setTimeout(more, 250);
      // Das HTML-Vorbild geht mit dem ersten 3D-Frame hart weg (kein Überblenden: sonst stünden Vorbild und Marke gleichzeitig im Bild); die Marke steht dann schon fertig
      const vb = document.querySelector(".vorbild"); if (vb) { vb.style.transition = "none"; vb.classList.add("weg"); }
    }
  }
  // Ein Fehler im Bild darf die Seite nie weiß lassen: der nächste Frame wird immer geplant; liegt es an der Karte, wird sie abgeschaltet
  let frameErrors = 0;
  function frame(now) {
    try { frameStep(now); }
    catch (e) {
      console.error(e); frameErrors++;
      if (mapOK && (Mextra > 0 || Muser > 0 || mSeg(stateAt(p)) > 0)) { mapFail(e); if (mSeg(stateAt(p)) > 0) { try { jumpTo(ZSEG.p0); } catch (e2) { /* nichts */ } } }
      if (first) { first = false; try { opt.onFirstFrame && opt.onFirstFrame(); } catch (e3) { /* nichts */ } setTimeout(more, 250); }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Prüfhilfe (nur Entwurf): Zustände ohne Atem setzen, Lesestellen und Abschnitte als p
  const api = {
    THREE, scene, camera, frameFrac, readingPose, stateAt, poseOf, bOf, ensure,
    labelAt: pp => { const st = stateAt(pp), I = INST[st.i]; if (st.kind === "z") return "Übersicht"; if (st.kind === "b" && I.cfg.labels) { ensure(I.idx); let lb = I.cfg.label; for (const L of I.cfg.labels) { const ki = typeof L.ki === "function" ? L.ki(I.def) : L.ki, kk = I.def.keys[ki]; if (kk && pp >= I.body.p0 + I.def.pOfU(kk.u) * (I.body.p1 - I.body.p0)) lb = L.label; } return lb; } return I.cfg.label; },
    inst: () => INST, segs: () => SEGS, total: () => TOTAL, anchors: () => ANCH.map(a => ({ name: a.name, p: anchorP(a) })),
    setP(v) { jumpTo(v); },
    // Zustand bei p ohne Atem anwenden (für Rechnungen), liefert den Zustand
    at(v, now = 1e9, still = true) { const st = stateAt(v); applyState(st, now, { still }); return st; },
    state: () => state, p: () => p,
    // Lesestellen aller Szenen als p der ganzen Seite
    stops() {
      ensure(INST.length - 1);
      const out = [];
      for (const I of INST) I.def.keys.forEach((k, ki) => { if (k.stop || k.slow) out.push({ scene: I.name, ki, stop: k.stop || null, slow: !!k.slow, p: I.body.p0 + I.def.pOfU(k.u) * (I.body.p1 - I.body.p0), b: k.b }); });
      return out;
    },
    pieces: () => pieces,
    // Anordnung und Karte (Prüfung): Bahn, Parzellen, Tisch, Kartenstellung, Segment der Karte
    layout: () => INST.map(I => ({ name: I.name, rot: Math.round(I.rot * 180 / PI), O: I.O.toArray(), fp: I.fp, cell: I.cell, content: I.content })),
    cards: () => INST.map(I => { const c = cardCorners(I); return [Math.min(...c.map(v => v.x)), Math.max(...c.map(v => v.x)), Math.min(...c.map(v => v.z)), Math.max(...c.map(v => v.z))]; }),
    table: () => tableRect(), mapPose: () => { ensure(INST.length - 1); return mapPose(); }, zseg: () => ZSEG, mAt: pp => mNow(stateAt(pp)),
    openMap(v) { Muser = v ? 1 : 0; Mextra = Muser; }
  };
  window.__seite = api;
  return api;
}
