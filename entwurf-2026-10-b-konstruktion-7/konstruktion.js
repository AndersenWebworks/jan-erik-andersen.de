// Konstruktionen für Entwurf B Konstruktion 7: Papierfaltungen, je Textabschnitt eine.
// Prinzip wie ein Pop-up-Buch: Alle Flächen liegen in Ruhelage flach auf dem Boden (Faltplan in x/z).
// Jede Fläche hängt an einem Scharnier ihrer Elternfläche und klappt mit dem Faltzustand s (0 flach, 1 aufgefaltet) hoch.
// Die Seite rechnet je Bild nur die sichtbaren Modelle neu (CPU, wenige tausend Punkte), Licht und Kanten im Shader.
import * as THREE from "three";

const PI = Math.PI, Q = PI / 2;
const EPS = .006; // Ruhelage: jede Faltebene liegt minimal über der vorigen, damit flache Lagen nicht flimmern
const lin = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
const PAPER = lin("#faf8f3"), BASE = lin("#f3f0ea"), OLD = lin("#e6e0d4"), SHADE = lin("#d2cbbe"), DARK = lin("#9b958b"), RED = lin("#d40235");
const INK = lin("#303033");
const sm5 = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10);

// ---------- Shader ----------
// Papier: flache Normale aus den Bildschirmableitungen (beidseitig), weiches Licht, leichte Bodenverschattung.
// Nahes wird per Raster ausgedünnt (bleibt tiefenrichtig), Fernes sinkt in den hellen Raum.
const PAPER_VERT = `
  attribute vec3 aCol;
  varying vec3 vCol; varying vec3 vW; varying float vDepth;
  void main() {
    vCol = aCol; vW = position;
    vec4 mv = viewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const PAPER_FRAG = `
  uniform vec3 uBg; uniform vec3 uL; uniform vec2 uFar; uniform float uVis; uniform float uFloor;
  varying vec3 vCol; varying vec3 vW; varying float vDepth;
  void main() {
    float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    if (smoothstep(1.2, 4.2, vDepth) < ign) discard;
    vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
    if (dot(n, cameraPosition - vW) < 0.0) n = -n;
    float dif = dot(n, uL);
    float sh = 0.74 + 0.26 * max(dif, 0.0) - 0.16 * max(-dif, 0.0);
    float ao = mix(1.0, mix(0.84, 1.0, smoothstep(0.0, 0.8, vW.y - uFloor)), 1.0 - abs(n.y));
    vec3 c = vCol * sh * ao;
    float k = uVis * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
    gl_FragColor = vec4(mix(uBg, c, k), 1.0);
    #include <colorspace_fragment>
  }`;
const EDGE_VERT = `
  attribute vec4 aCol;
  varying vec4 vC; varying float vDepth;
  void main() {
    vC = aCol;
    vec4 mv = viewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const EDGE_FRAG = `
  uniform vec2 uFar; uniform float uVis;
  varying vec4 vC; varying float vDepth;
  void main() {
    float a = vC.a * uVis * smoothstep(1.4, 4.6, vDepth) * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
    if (a < 0.005) discard;
    gl_FragColor = vec4(vC.rgb, min(a, 1.0));
    #include <colorspace_fragment>
  }`;
const LIGHT = new THREE.Vector3(-.5, .78, .42).normalize();
export function paperMaterial(floorY) {
  return new THREE.ShaderMaterial({
    uniforms: { uBg: { value: new THREE.Vector3(1, 1, 1) }, uL: { value: LIGHT }, uFar: { value: new THREE.Vector2(12, 38) }, uVis: { value: 1 }, uFloor: { value: floorY } },
    vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2
  });
}
export function edgeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uFar: { value: new THREE.Vector2(12, 38) }, uVis: { value: 1 } },
    vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG, transparent: true, depthWrite: false
  });
}

// ---------- Faltmodell ----------
function Model() {
  const nodes = [];
  const tv = [], tc = [], tn = []; // Dreiecke: Ruhepunkte, Farbe, Knoten
  const lv = [], lc = [], ln = []; // Kanten
  const mk = (par, kind, P, A, ang, t0, d, back, lvl) => {
    const n = { i: nodes.length, par, kind, P, A, ang, t0, d: Math.max(d, 1e-3), back, lvl, M: new Float64Array(12) };
    nodes.push(n); return n;
  };
  const root = mk(null, 0, null, null, 0, 0, 1, null, 0);
  const F = {
    root,
    // Scharnier a-b (Boden x/z) in der Ruhelage; side: ein Punkt der Fläche. ang > 0 hebt die Fläche zur Oberseite der Elternfläche.
    hinge(par, a, b, side, ang, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl + 1;
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      const sx = side[0] - a[0], sz = side[1] - a[1], pr = sx * ux + sz * uz, vx = sx - ux * pr, vz = sz - uz * pr, al = Math.hypot(vx, vz);
      return mk(par, 1, [a[0], lvl * EPS, a[1]], [-vz / al, 0, vx / al], ang, t0, d, opt.back, lvl);
    },
    // Drehung um die Senkrechte der Ruhelage (Drehteller, Fächer)
    spin(par, c, ang, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl;
      return mk(par, 1, [c[0], 0, c[1]], [0, 1, 0], ang, t0, d, opt.back, lvl);
    },
    // konvexes Vieleck in der Ebene des Knotens; e: Deckkraft der Kanten (Zahl oder je Kante)
    poly(nd, pts, col = PAPER, e = .5, dy = 0, ecol = INK) {
      const y = nd.lvl * EPS + dy, n = pts.length;
      for (let k = 1; k < n - 1; k++) for (const p of [pts[0], pts[k], pts[k + 1]]) { tv.push(p[0], y, p[1]); tc.push(...col); tn.push(nd.i); }
      for (let k = 0; k < n; k++) {
        const w = Array.isArray(e) ? e[k] : e; if (!w) continue;
        const p = pts[k], q = pts[(k + 1) % n];
        lv.push(p[0], y, p[1], q[0], y, q[1]); lc.push(...ecol, w, ...ecol, w); ln.push(nd.i, nd.i);
      }
    },
    line(nd, a, b, w = .35, col = INK, dy = .004) {
      const y = nd.lvl * EPS + dy;
      lv.push(a[0], y, a[1], b[0], y, b[1]); lc.push(...col, w, ...col, w); ln.push(nd.i, nd.i);
    },
    finish(o) {
      const restT = new Float32Array(tv), restL = new Float32Array(lv), nT = Int32Array.from(tn), nL = Int32Array.from(ln);
      const posT = new Float32Array(restT.length), posL = new Float32Array(restL.length);
      const geoT = new THREE.BufferGeometry(), geoL = new THREE.BufferGeometry();
      geoT.setAttribute("position", new THREE.BufferAttribute(posT, 3).setUsage(THREE.DynamicDrawUsage));
      geoT.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(tc), 3));
      geoL.setAttribute("position", new THREE.BufferAttribute(posL, 3).setUsage(THREE.DynamicDrawUsage));
      geoL.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(lc), 4));
      const { ox, oy, oz, lat, hs } = o;
      const xf = (rest, nid, out) => {
        for (let i = 0, j = 0; j < nid.length; j++, i += 3) {
          const M = nodes[nid[j]].M, x = rest[i], y = rest[i + 1], z = rest[i + 2];
          out[i] = ox + (M[0] * x + M[1] * y + M[2] * z + M[3]) * lat;
          out[i + 1] = oy + (M[4] * x + M[5] * y + M[6] * z + M[7]) * hs;
          out[i + 2] = oz + M[8] * x + M[9] * y + M[10] * z + M[11];
        }
      };
      let last = -1;
      function update(s) {
        if (s === last) return; last = s;
        for (const nd of nodes) {
          const M = nd.M;
          if (!nd.par) { M.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]); continue; }
          let w = sm5((s - nd.t0) / nd.d); if (nd.back) w -= sm5((s - nd.back[0]) / nd.back[1]);
          const th = nd.ang * w, c = Math.cos(th), sn = Math.sin(th), t = 1 - c, [x, y, z] = nd.A, [px, py, pz] = nd.P;
          const r = [t * x * x + c, t * x * y - sn * z, t * x * z + sn * y, t * x * y + sn * z, t * y * y + c, t * y * z - sn * x, t * x * z - sn * y, t * y * z + sn * x, t * z * z + c];
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
        xf(restT, nT, posT); xf(restL, nL, posL);
        geoT.attributes.position.needsUpdate = true; geoL.attributes.position.needsUpdate = true;
      }
      return { geoT, geoL, update };
    }
  };
  return F;
}

// ---------- Bauteile ----------
function kit(F) {
  const K = {};
  // Fläche an Scharnier a-b, liegt in Richtung n (Einheitsvektor) flach; uv: u entlang a-b, v von der Kante weg
  K.panel = (par, a, b, n, t0, d, ang = Q, opt) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    const nd = F.hinge(par, a, b, [a[0] + n[0], a[1] + n[1]], ang, t0, d, opt);
    nd.L = L; nd.dir = [ux, uz]; nd.n = n;
    nd.uv = (u, v) => [a[0] + ux * u + n[0] * v, a[1] + uz * u + n[1] * v];
    return nd;
  };
  K.P = (nd, uvs, col = PAPER, e = .5, dy = 0) => F.poly(nd, uvs.map(q => nd.uv(q[0], q[1])), col, e, dy);
  K.rect = (nd, u0, v0, u1, v1, col, e, dy) => K.P(nd, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], col, e, dy);
  // Aufdruck auf beiden Seiten einer Fläche
  K.deco = (nd, u0, v0, u1, v1, col = SHADE, e = 0) => { K.rect(nd, u0, v0, u1, v1, col, e, .0025); K.rect(nd, u0, v0, u1, v1, col, e, -.0025); };
  K.decoP = (nd, uvs, col, e = 0) => { K.P(nd, uvs, col, e, .0025); K.P(nd, uvs, col, e, -.0025); };
  K.ln = (nd, a, b, w = .35, col = INK) => { F.line(nd, nd.uv(a[0], a[1]), nd.uv(b[0], b[1]), w, col, .004); F.line(nd, nd.uv(a[0], a[1]), nd.uv(b[0], b[1]), w, col, -.004); };
  // Faltschachtel: vier Wände klappen nach innen hoch, Deckel oder Satteldach folgt
  K.box = (par, x0, x1, z0, z1, h, t0, d, o = {}) => {
    const col = o.col || PAPER, D = z0 - z1, W = x1 - x0, tw = d * .55, ts = d * .12, rh = o.gable || 0;
    const op = o.lv !== undefined ? { lv: o.lv + 1, back: o.back } : { back: o.back };
    const ch = { back: o.back };
    const fr = K.panel(par, [x0, z0], [x1, z0], [0, 1], t0, tw, Q, op);
    const bk = K.panel(par, [x0, z1], [x1, z1], [0, -1], t0, tw, Q, op);
    const lf = K.panel(par, [x0, z0], [x0, z1], [-1, 0], t0 + ts, tw, Q, op);
    const rt = K.panel(par, [x1, z0], [x1, z1], [1, 0], t0 + ts, tw, Q, op);
    const front = rh ? [[0, 0], [W, 0], [W, h], [W / 2, h + rh], [0, h]] : [[0, 0], [W, 0], [W, h], [0, h]];
    if (o.door) {
      const [u0, u1, v0, v1] = o.door;
      K.P(fr, [[0, 0], [u0, 0], [u0, h], [0, h]], col, [.5, .5, 0, .5]);
      K.P(fr, [[u1, 0], [W, 0], [W, h], [u1, h]], col, [.5, .5, .5, 0]);
      K.P(fr, [[u0, v1], [u1, v1], [u1, h], [u0, h]], col, [.5, 0, 0, 0]);
      if (v0 > 0) K.P(fr, [[u0, 0], [u1, 0], [u1, v0], [u0, v0]], col, [.5, 0, .5, 0]);
      if (rh) K.P(fr, [[0, h], [W, h], [W / 2, h + rh]], col, [0, .5, .5]);
    } else K.P(fr, front, col);
    K.P(bk, front, col);
    for (const w of [lf, rt]) K.rect(w, 0, 0, D, h, col);
    let top = null, roofs = null;
    if (rh) {
      const S = Math.hypot(W / 2, rh), ang = Math.atan2(W / 2, rh), ov = o.ov !== undefined ? o.ov : .16;
      roofs = [lf, rt].map(w => { const r = K.panel(w, w.uv(0, h), w.uv(D, h), w.n, t0 + d * .5, d * .5, ang, ch); K.rect(r, -ov, 0, D + ov, S, o.roof || col); return r; });
    } else if (!o.open) {
      top = K.panel(bk, bk.uv(0, h), bk.uv(W, h), [0, -1], t0 + d * .5, d * .5, Q, ch);
      K.rect(top, 0, 0, W, D, o.roof || col);
    }
    return { fr, bk, lf, rt, top, roofs, W, D, h };
  };
  // Zickzack-Treppe aus einem Streifen: Setzstufe und Trittstufe falten abwechselnd
  K.stairs = (par, x0, x1, za, n, r, t, t0, d, dir = -1, col = PAPER) => {
    let p = par, z = za;
    for (let i = 0; i < 2 * n; i++) {
      const len = i % 2 ? t : r, ang = i === 0 ? Q : (i % 2 ? -Q : Q);
      const nd = K.panel(p, [x0, z], [x1, z], [0, dir], t0 + d * .8 * i / (2 * n), d * .35, ang);
      K.rect(nd, 0, 0, nd.L, len, col);
      p = nd; z += dir * len;
    }
    return p;
  };
  // Punkt auf dem Deckel einer Schachtel: Ruhelage zum Endpunkt (x, z) auf der Oberseite
  K.lidPt = (b, x, z) => [x, b.bk.uv(0, 0)[1] - b.h - (z - b.bk.uv(0, 0)[1])];
  return K;
}
const circle = (cx, cy, r, n) => { const p = []; for (let i = 0; i < n; i++) { const a = 2 * PI * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };

// ---------- Einheiten ----------
// sel: Textelement, an dem Zeit und Kamera hängen; side: 0 mittig/feste Lage
export const UNITS = [
  // 0 Einstieg: Website, Shop und angebundenes System falten sich aus einem Bogen
  { sel: ["#start .panel", 0], side: 0, fn(F, K, o) {
    const R = F.root, X = o.narrow ? -7 : 0; // Desktop: rechts neben dem großen Namen
    F.poly(R, [[X + 1.5, -4], [X + 12.6, -4], [X + 12.6, -14.5], [X + 1.5, -14.5]], BASE, .3);
    const pg = K.panel(R, [X + 3.2, -12.4], [X + 9.2, -12.4], [0, 1], .1, .34, Q, { lv: 2 });
    K.rect(pg, 0, 0, 6, 4.2);
    K.deco(pg, .3, 3.55, 5.7, 3.95, SHADE); K.deco(pg, 4.7, 3.63, 5.5, 3.87, RED);
    K.deco(pg, .3, 1.0, 2.9, 3.25, SHADE);
    for (let k = 0; k < 5; k++) K.ln(pg, [3.3, 3.05 - k * .45], [5.6 - (k % 2) * .7, 3.05 - k * .45], .45);
    K.deco(pg, 3.3, .45, 4.6, .8, DARK);
    const sh = K.box(R, X + 5.4, X + 8.4, -7.2, -9.8, 2.2, .26, .34, { lv: 4 });
    K.deco(sh.fr, .3, .35, 1.7, 1.5, SHADE); K.deco(sh.fr, 2.0, 0, 2.65, 1.6, DARK);
    const aw = K.panel(sh.fr, sh.fr.uv(0, 2.2), sh.fr.uv(3, 2.2), [0, 1], .56, .2, -2.0);
    for (let k = 0; k < 8; k++) K.rect(aw, k * .375, 0, (k + 1) * .375, .95, k % 2 ? PAPER : RED, .3);
    const sv = K.box(R, X + 10.2, X + 11.7, -7.6, -9.4, 3.4, .42, .34);
    for (let k = 0; k < 5; k++) K.ln(sv.fr, [.25, .6 + k * .55], [1.25, .6 + k * .55], .55);
    K.deco(sv.fr, 1.05, 3.0, 1.25, 3.2, RED);
    for (const [a, b] of [[[X + 8.4, -8.6], [X + 10.2, -8.6]], [[X + 9.2, -12.2], [X + 10.6, -9.4]]]) F.line(R, a, b, .55, RED, .01);
  } },
  // 1 Gerwing: Fläche aus Steinen im Läuferverband, Reihe für Reihe; Treppe zur Terrasse
  { sel: ["#arbeit .panel", 0], side: 0, fn(F, K, o) {
    const R = F.root, nar = o.narrow;
    F.poly(R, [[-8, 0], [8.5, 0], [8.5, -13.5], [-8, -13.5]], BASE, .3);
    const x0 = -7.2, x1 = .8, z0 = -1.2, rows = nar ? 8 : 11, cw = nar ? 1.6 : 1.15, ch = .56;
    for (let r = 0; r < rows; r++) {
      const za = z0 - r * ch, t = .08 + .42 * r / rows; let k = 0;
      for (let x = x0 - (r % 2) * cw / 2; x < x1 - .1; x += cw, k++) {
        const xa = Math.max(x, x0) + .03, xb = Math.min(x + cw, x1) - .03;
        if (xb - xa < .25) continue;
        K.box(R, xa, xb, za - .03, za - ch + .03, .24, t + (xa - x0) * .005, .13, { lv: (r + k) % 2 ? 0 : 2, col: (r * 3 + k) % 5 ? PAPER : OLD });
      }
    }
    K.box(R, 1.6, 7.6, -6.6, -12, 1.0, .36, .3);
    K.stairs(R, 3.0, 6.0, -3.4, 4, .25, .8, .44, .36);
    K.stairs(R, -6.4, -3.6, -8.6, 3, .3, .7, .58, .3);
  } },
  // 2 Betreuung und Absicherung: Haus, rundum klappt ein Zaun Feld für Feld hoch, an der Ecke ein Ausguck
  { sel: ["#leistungen article", 0], fn(F, K, o) {
    const R = F.root;
    F.poly(R, [[-5.4, -1.6], [6, -1.6], [6, -12.2], [-5.4, -12.2]], BASE, .3);
    const hs = K.box(R, -2, 2, -5, -9, 2.5, .08, .32, { gable: 1.5, lv: 2 });
    K.deco(hs.fr, 1.6, 0, 2.4, 1.6, DARK); K.deco(hs.fr, .4, 1.0, 1.1, 1.7, SHADE); K.deco(hs.fr, 2.9, 1.0, 3.6, 1.7, SHADE);
    const ring = [[[-.8, -3.2], [-3.8, -3.2]], [[-3.8, -3.2], [-3.8, -10.8]], [[-3.8, -10.8], [3.8, -10.8]], [[3.8, -10.8], [3.8, -3.2]], [[3.8, -3.2], [.8, -3.2]]];
    const segs = [];
    for (const [a, b] of ring) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 1.25); for (let i = 0; i < n; i++) segs.push([[a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n], [a[0] + (b[0] - a[0]) * (i + 1) / n, a[1] + (b[1] - a[1]) * (i + 1) / n]]); }
    segs.forEach(([a, b], k) => {
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      let n = [-dz / L, dx / L]; if (n[0] * (a[0] + b[0]) / 2 + n[1] * ((a[1] + b[1]) / 2 + 7) < 0) n = [-n[0], -n[1]];
      const f = K.panel(R, a, b, n, .36 + .44 * k / segs.length, .12, Q, { lv: 1 });
      for (let u = .06; u < L - .1; u += .3) K.rect(f, u, 0, u + .13, .95, PAPER, .45);
      K.rect(f, 0, .55, L, .66, PAPER, .4, .002);
    });
    const tw = K.box(R, 4.3, 5.4, -9.6, -10.8, 3.6, .5, .3, { gable: .8, lv: 3 });
    K.deco(tw.fr, .3, 2.6, .8, 3.2, DARK);
  } },
  // 3 Modernisierung: das alte Haus legt sich flach, an seiner Stelle faltet sich ein heutiger Bau auf; der Weg bleibt
  { sel: ["#leistungen article", 1], fn(F, K, o) {
    const R = F.root;
    F.poly(R, [[-5.2, -1.4], [5.6, -1.4], [5.6, -12.6], [-5.2, -12.6]], BASE, .3);
    F.poly(R, [[-.5, -1.4], [.5, -1.4], [.5, -4.4], [-.5, -4.4]], SHADE, .25, .002);
    const old = K.box(R, -2.2, 1.8, -5, -8.8, 2.2, .06, .24, { gable: 1.8, col: OLD, back: [.4, .18], lv: 1 });
    K.deco(old.fr, 1.6, 0, 2.4, 1.4, DARK); K.deco(old.fr, .4, .9, .9, 1.5, SHADE); K.deco(old.fr, 3.1, .9, 3.6, 1.5, SHADE);
    const nb = K.box(R, -3, 3.4, -4.4, -9.8, 3.0, .5, .42, { lv: 5 });
    K.deco(nb.fr, .3, 1.75, 6.1, 2.55, SHADE); K.deco(nb.fr, .3, .25, 2.4, 1.25, SHADE); K.deco(nb.fr, 2.75, 0, 3.65, 1.5, DARK); K.deco(nb.fr, 4.0, .25, 6.1, 1.25, SHADE);
    for (const w of [nb.lf, nb.rt]) K.deco(w, .4, 1.75, 5.0, 2.55, SHADE);
  } },
  // 4 Shops und Shop-Wechsel: Ladenfront mit Markise, daneben Pakete in Formaten, die in keine Norm passen
  { sel: ["#leistungen article", 2], fn(F, K, o) {
    const R = F.root;
    F.poly(R, [[-5, -1.6], [6.4, -1.6], [6.4, -11.4], [-5, -11.4]], BASE, .3);
    const sh = K.box(R, -3.8, .4, -5, -8.6, 2.6, .06, .32, { lv: 1 });
    K.deco(sh.fr, .3, .35, 2.5, 1.85, SHADE); K.deco(sh.fr, 2.95, 0, 3.8, 1.95, DARK);
    const aw = K.panel(sh.fr, sh.fr.uv(0, 2.6), sh.fr.uv(4.2, 2.6), [0, 1], .38, .2, -2.05);
    for (let k = 0; k < 10; k++) K.rect(aw, k * .42, 0, (k + 1) * .42, 1.15, k % 2 ? PAPER : RED, .3);
    const B = [[1.4, 2.7, -4.4, -5.8, .9], [3.0, 3.7, -4.6, -5.4, 1.7], [1.5, 4.4, -6.3, -7.3, .5], [4.4, 5.8, -4.4, -6.0, 1.15], [4.8, 5.5, -6.6, -8.8, 2.3], [1.8, 3.4, -7.8, -9.4, 1.3]];
    B.forEach(([a, b, c, d, h], k) => K.box(R, a, b, c, d, h, .4 + k * .07, .2, { lv: 2 + 2 * k }));
  } },
  // 5 Schnittstellen und eigene Werkzeuge: drei Türme, Zugbrücken klappen aus den Wänden und treffen sich
  { sel: ["#leistungen article", 3], fn(F, K, o) {
    const R = F.root, zA = -5.8, zB = -8.2;
    F.poly(R, [[-6.6, -1.6], [6.6, -1.6], [6.6, -12], [-6.6, -12]], BASE, .3);
    const A = K.box(R, -5.6, -3.6, zA, zB, 2.8, .06, .28, { lv: 1 }), B = K.box(R, -1, 1, zA, zB, 4.2, .12, .3, { lv: 3 }), C = K.box(R, 3.6, 5.6, zA, zB, 3.4, .18, .28, { lv: 5 });
    for (const T of [A, B, C]) for (let y = .7; y < T.h - .3; y += .9) K.deco(T.fr, .4, y, 1.6, y + .35, SHADE);
    const deck = (w, y, t0) => {
      const dk = K.panel(w, w.uv(.75, y), w.uv(1.65, y), w.n, t0, .2, -Q);
      K.rect(dk, 0, 0, .9, 1.3);
      for (const u of [0, .9]) {
        const rl = K.panel(dk, dk.uv(u, 0), dk.uv(u, 1.3), u ? dk.dir : [-dk.dir[0], -dk.dir[1]], t0 + .16, .12);
        K.rect(rl, 0, 0, 1.3, .38, PAPER, .45);
      }
    };
    deck(A.rt, 2.0, .5); deck(B.lf, 2.0, .54); deck(B.rt, 2.7, .66); deck(C.lf, 2.7, .7);
  } },
  // 6 Gestaltung: der goldene Schnitt als Folge von Schachteln, die Spirale läuft über die Deckel
  { sel: ["#leistungen article", 4], fn(F, K, o) {
    const R = F.root, W = 8, H = W / 1.618, x0 = -4, z0 = -3;
    F.poly(R, [[-5.4, -1.6], [5.4, -1.6], [5.4, -10.4], [-5.4, -10.4]], BASE, .3);
    F.poly(R, [[x0, z0], [x0 + W, z0], [x0 + W, z0 - H], [x0, z0 - H]], PAPER, .5, .002);
    let xl = x0, xr = x0 + W, yb = 0, yt = H; const sq = [];
    for (let k = 0; k < 7; k++) {
      const ph = k % 4, w2 = xr - xl, h2 = yt - yb;
      if (ph === 0) { const s = h2; sq.push([xl, xl + s, yb, yt, s, [xl + s, yt], PI, 1.5 * PI]); xl += s; }
      else if (ph === 1) { const s = w2; sq.push([xl, xr, yb, yb + s, s, [xl, yb + s], 1.5 * PI, 2 * PI]); yb += s; }
      else if (ph === 2) { const s = h2; sq.push([xr - s, xr, yb, yt, s, [xr - s, yb], 0, .5 * PI]); xr -= s; }
      else { const s = w2; sq.push([xl, xr, yt - s, yt, s, [xr, yt - s], .5 * PI, PI]); yt -= s; }
    }
    sq.forEach(([xa, xb, ya, yb2, s, c, a0, a1], k) => {
      const h = Math.max(.25, s * .5) * (o.narrow ? .8 : 1);
      const b = K.box(R, xa + .02, xb - .02, z0 - ya - .02, z0 - yb2 + .02, h, .1 + k * .085, .22, { lv: 1 + 2 * k, col: k === 0 ? PAPER : PAPER });
      // Viertelkreis auf dem Deckel
      const pts = []; for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * i / 12; pts.push(K.lidPt(b, c[0] + Math.cos(a) * s, z0 - (c[1] + Math.sin(a) * s))); }
      for (let i = 1; i < pts.length; i++) for (const dy of [.004, -.004]) F.line(b.top, pts[i - 1], pts[i], 1, RED, dy);
    });
  } },
  // 7 WBG Pooling: Produkt faltet sich auf dem Drehteller und dreht sich einmal ganz herum; dahinter der geschützte Bereich
  { sel: ["#weitere .panel", 0], fn(F, K, o) {
    const R = F.root, c = [0, -5.8];
    F.poly(R, [[-5.4, -1.4], [5.4, -1.4], [5.4, -12], [-5.4, -12]], BASE, .3);
    const gt = K.panel(R, [-4.2, -10.4], [4.2, -10.4], [0, 1], .08, .26, Q, { lv: 1 });
    K.rect(gt, 0, 0, 8.4, 3.0);
    K.deco(gt, 3.5, 0, 4.9, 2.2, DARK); K.deco(gt, 5.1, 1.0, 5.35, 1.3, RED);
    for (let k = 0; k < 6; k++) K.ln(gt, [.4 + k * .5, 0], [.4 + k * .5, 3.0], .25);
    const sp = F.spin(R, c, -2 * PI, .4, .6, { lv: 3 });
    F.poly(sp, circle(c[0], c[1], 2.5, 32), SHADE, .5);
    for (let k = 0; k < 12; k++) { const a = k * PI / 6; F.line(sp, [c[0] + Math.cos(a) * 1.4, c[1] + Math.sin(a) * 1.4], [c[0] + Math.cos(a) * 2.4, c[1] + Math.sin(a) * 2.4], .4); }
    const pb = K.box(sp, -.9, .9, -5.0, -6.6, 1.3, .14, .26);
    K.deco(pb.fr, .3, .3, 1.5, .6, RED);
    K.box(sp, 1.05, 1.65, -5.5, -6.1, .65, .22, .2, { lv: 6 });
  } },
  // 8 Take the Gloves Off: Erscheinungsbild als Plakatfolge auf einem Podest, jedes Format mit eigenem Zeichen
  { sel: ["#weitere .panel", 1], fn(F, K, o) {
    const R = F.root;
    F.poly(R, [[-5, -1.6], [5, -1.6], [5, -12], [-5, -12]], BASE, .3);
    K.box(R, -3.6, 3.6, -5.2, -7.2, .45, .06, .24, { lv: 1 });
    const P1 = K.panel(R, [-3.3, -7.6], [-1.3, -7.6], [0, 1], .26, .24, Q, { lv: 4 });
    K.rect(P1, 0, 0, 2, 2.6); K.decoP(P1, circle(1, 1.5, .6, 24), RED);
    const P2 = K.panel(R, [-1.0, -8.2], [1.2, -8.2], [0, 1], .34, .24, Q, { lv: 6 });
    K.rect(P2, 0, 0, 2.2, 3.4); K.decoP(P2, [[.4, .9], [1.8, .9], [1.1, 2.5]], DARK); K.deco(P2, .4, .4, 1.8, .55, RED);
    const P3 = K.panel(R, [1.5, -7.6], [3.3, -7.6], [0, 1], .42, .24, Q, { lv: 8 });
    K.rect(P3, 0, 0, 1.8, 2.2); for (let k = 0; k < 3; k++) K.deco(P3, .35, .5 + k * .45, 1.45 - k * .3, .75 + k * .45, k ? DARK : RED);
  } },
  // 9 Außerdem: eine Straße kleiner, verschiedener Häuser, eins nach dem anderen
  { sel: ["#weitere .panel", 2], fn(F, K, o) {
    const R = F.root;
    F.poly(R, [[-4.8, -1.6], [4.8, -1.6], [4.8, -14.4], [-4.8, -14.4]], BASE, .3);
    F.poly(R, [[-.5, -1.6], [.6, -1.6], [.6, -14.4], [-.5, -14.4]], SHADE, .2, .002);
    const H = [[-3.2, -.9, -3.2, -5.2, 2.0, 1.1], [1.2, 3.6, -3.8, -6.0, 2.8, 0], [-3.6, -.9, -6.8, -9.2, 1.6, 1.3], [1.0, 3.4, -7.4, -9.8, 2.1, 0], [-3.2, -.8, -10.6, -13, 2.4, 1.5], [1.4, 2.8, -11, -12.8, 3.8, .9]];
    H.forEach(([a, b, c, d, h, g], k) => {
      const hs = K.box(R, a, b, c, d, h, .06 + k * .1, .28, { gable: g, lv: 1 + 3 * k });
      const W = b - a; K.deco(hs.fr, W * .55, 0, W * .55 + .5, 1.1, DARK); K.deco(hs.fr, .3, h * .5, .8, h * .5 + .5, SHADE);
    });
  } },
  // 10 Wie ich arbeite: ein Plan am Boden, seine Wände richten sich auf
  { sel: ["#arbeitsweise .panel", 0], dz: -4.5, fn(F, K, o) {
    const R = F.root, h = 2.4;
    F.poly(R, [[-5, -1.2], [5, -1.2], [5, -12.6], [-5, -12.6]], PAPER, .45);
    for (let x = -4.6; x < 4.4; x += .9) F.line(R, [x, -1.5], [x + .6, -12.3], .08);
    const W = [[-3.6, -2.6, -.6, -2.6, h], [.6, -2.6, 3.6, -2.6, h], [3.6, -2.6, 3.6, -11, h], [3.6, -11, -3.6, -11, h], [-3.6, -11, -3.6, -2.6, h],
      [-3.6, -6.4, -1, -6.4, h * .8], [.9, -6.4, 3.6, -6.4, h * .8], [.2, -6.4, .2, -11, h * .8], [.2, -8.8, 3.6, -8.8, h * .8]];
    W.forEach(([a, b, c, d, hh], i) => {
      F.line(R, [a, b], [c, d], .8, INK, .003);
      const dx = c - a, dz = d - b, L = Math.hypot(dx, dz); let n = [-dz / L, dx / L];
      if (i < 5 && n[0] * (a + c) / 2 + n[1] * ((b + d) / 2 + 6.8) < 0) n = [-n[0], -n[1]];
      const wl = K.panel(R, [a, b], [c, d], n, .2 + i * .065, .2, Q, { lv: 1 + i });
      K.rect(wl, 0, 0, L, hh);
      if (L > 3) K.deco(wl, L * .35, hh * .45, L * .35 + .9, hh * .45 + .7, SHADE);
    });
    for (const [c, a0] of [[[-1, -6.4], 0], [[.2, -10.2], Q]]) { const p = []; for (let i = 0; i <= 8; i++) { const a = a0 + Q * i / 8; p.push([c[0] + Math.cos(a) * 1.2, c[1] - Math.sin(a) * 1.2]); } for (let i = 1; i < p.length; i++) F.line(R, p[i - 1], p[i], .5); }
  } },
  // 11 Werdegang: ein Weg mit sechs Stationen, jede faltet sich aufwendiger als die vorige
  { sel: ["#werdegang .panel", 0], depth: 16, fn(F, K, o) {
    const R = F.root, st = [-1.8, -4.3, -6.9, -9.4, -11.9, -14.6];
    F.poly(R, [[-2, 1], [2, 1], [2, -16], [-2, -16]], BASE, .4);
    for (let z = .2; z > -16; z -= 1.2) F.line(R, [-2, z], [-1.6, z], .4);
    const T = k => [.06 + k * .13, .2];
    { const p = K.panel(R, [-.5, st[0]], [.5, st[0]], [0, 1], ...T(0), Q, { lv: 2 }); K.rect(p, 0, 0, 1, 1.5); }
    { const p = K.panel(R, [-1, st[1]], [1, st[1]], [0, 1], ...T(1), Q, { lv: 2 }); K.P(p, [[0, 0], [.45, 0], [.45, 2.2], [0, 2.2]], PAPER, [.5, .5, 0, .5]); K.P(p, [[1.55, 0], [2, 0], [2, 2.2], [1.55, 2.2]], PAPER, [.5, .5, .5, 0]); K.P(p, [[.45, 1.7], [1.55, 1.7], [1.55, 2.2], [.45, 2.2]], PAPER, [.5, 0, .5, 0]); }
    K.box(R, -.8, .8, st[2] + .8, st[2] - .8, 1.3, ...T(2), { lv: 2 });
    { const b = K.box(R, -1, 1, st[3] + .8, st[3] - .8, 1.4, ...T(3), { gable: 1, lv: 2 }); K.deco(b.fr, .75, 0, 1.25, 1, DARK); }
    { const b = K.box(R, -1.1, 1.1, st[4] + .9, st[4] - .9, 2.6, ...T(4), { gable: .9, lv: 2 }); for (const v of [.5, 1.7]) { K.deco(b.fr, .3, v, .8, v + .5, SHADE); K.deco(b.fr, 1.4, v, 1.9, v + .5, SHADE); } }
    { const b = K.box(R, -.9, .9, st[5] + .9, st[5] - .9, 4.4, ...T(5), { gable: 1.1, lv: 2 }); for (let v = .6; v < 4; v += .9) K.deco(b.fr, .6, v, 1.2, v + .5, SHADE); K.deco(b.fr, .75, 3.7, 1.05, 4.0, RED); }
  } },
  // 12 Stimme 1 (Wirkungsbericht): ein Leporello richtet sich auf und entfaltet Seite für Seite
  { sel: ["#stimmen blockquote", 0], fn(F, K, o) {
    const R = F.root, L = 1.35, h = 2.5, n = o.narrow ? 5 : 6, a = 52 * PI / 180;
    F.poly(R, [[-5, -1.6], [5, -1.6], [5, -12], [-5, -12]], BASE, .3);
    const p0 = K.panel(R, [-3.8, -6.6], [-3.8 + L, -6.6], [0, 1], .06, .22, Q, { lv: 1 });
    let prev = p0;
    for (let k = 0; k < n; k++) {
      const nd = k === 0 ? p0 : F.hinge(prev, p0.uv(k % 2 ? L : 0, 0), p0.uv(k % 2 ? L : 0, h), p0.uv(L / 2, h / 2), PI - a, .24 + .56 * (k - 1) / (n - 1), .2, { lv: prev.lvl + 1 });
      nd.uv = p0.uv;
      K.rect(nd, 0, 0, L, h, PAPER, .5);
      if (k === 0) K.deco(nd, .2, 1.4, 1.15, 2.2, DARK);
      if (k === 2) for (let j = 0; j < 4; j++) K.deco(nd, .25 + j * .24, .4, .41 + j * .24, .7 + j * .32, j === 3 ? RED : DARK);
      for (let j = 0; j < (k === 0 ? 3 : 5); j++) { const v = (k === 0 ? 1.1 : 2.2) - j * .26; if (k !== 2 || v > 1.9) K.ln(nd, [.2, v], [L - .2 - (j % 2) * .3, v], .4); }
      prev = nd;
    }
  } },
  // 13 Stimme 2 (der letzte Schliff, der überrascht): ein Faltfächer steht auf und öffnet sich zum Halbrund
  { sel: ["#stimmen blockquote", 1], fn(F, K, o) {
    const R = F.root, c = [0, -7.2], Rr = 3.1, N = o.narrow ? 11 : 15, dl = PI / N;
    F.poly(R, [[-5, -1.6], [5, -1.6], [5, -12], [-5, -12]], BASE, .3);
    const fan = F.hinge(R, [-1, c[1]], [1, c[1]], [0, c[1] + 1], Q, .06, .28, { lv: 1 });
    for (let k = 0; k < N; k++) {
      const sp = F.spin(fan, c, -k * (PI - dl) / (N - 1), .32, .52, { lv: 2 + k });
      const p = a => [c[0] + Math.cos(a) * Rr, c[1] + Math.sin(a) * Rr], q = a => [c[0] + Math.cos(a) * .45, c[1] + Math.sin(a) * .45];
      F.poly(sp, [q(0), p(0), p(dl * 1.06), q(dl * 1.06)], k === (N - 1) / 2 ? RED : (k % 2 ? SHADE : PAPER), .45);
    }
    F.poly(fan, circle(c[0], c[1], .5, 16), DARK, .5, -2 * EPS); // Nabe auf der Seite zur Kamera
  } },
  // 14 Für Agenturen: eine Reihe gleicher Bauten mit einer Lücke; das neue Teil faltet sich passgenau hinein
  { sel: ["#agenturen .panel", 0], depth: 16, fn(F, K, o) {
    const R = F.root;
    F.poly(R, [[-6.2, -2], [6.2, -2], [6.2, -12], [-6.2, -12]], BASE, .3);
    const xs = [-5.5, -3.3, -1.1, 1.1, 3.3];
    xs.forEach((x, i) => {
      const nw = i === 2, b = K.box(R, x, x + 2.0, -5.8, -9.2, 1.9, nw ? .58 : .06 + .08 * i, nw ? .36 : .3, { gable: 1.1, lv: 1 + 3 * i, roof: nw ? RED : PAPER });
      K.deco(b.fr, .75, 0, 1.25, 1.1, DARK);
    });
    K.box(R, -5.5, 5.3, -9.6, -11.2, 1.1, .2, .3, { lv: 16 });
  } },
  // 15 Kontakt: die rote Linie läuft auf ein Haus zu, dessen Tür aufschwingt
  { sel: ["#kontakt .panel", 0], side: 0, doorX: -4.8, lineEnd: -4.6, fn(F, K, o) {
    const R = F.root, x0 = -3.4, x1 = 3.4, zf = -5.4, zb = -10, h = 2.9, W = x1 - x0, du0 = W / 2 - .6, du1 = W / 2 + .6, sv = .4, dh = 2.0;
    F.poly(R, [[-6, -1.5], [6, -1.5], [6, -12], [-6, -12]], BASE, .3);
    const hs = K.box(R, x0, x1, zf, zb, h, .08, .44, { gable: 1.6, door: [du0, du1, sv, sv + dh], lv: 1 });
    K.deco(hs.bk, du0, 0, du1, sv + dh, DARK);
    for (const u of [.8, W - 1.8]) K.deco(hs.fr, u, 1.2, u + 1, 2.1, SHADE);
    const dr = F.hinge(hs.fr, hs.fr.uv(du1, sv), hs.fr.uv(du1, sv + dh), hs.fr.uv(W / 2, sv + 1), .72, .64, .26);
    dr.uv = hs.fr.uv; K.rect(dr, du0 + .03, sv, du1, sv + dh, RED, .6);
    K.stairs(R, -.9, .9, zf + .8, 2, .2, .4, .5, .16);
  } }
];

export function buildUnit(i, o) {
  const F = Model();
  UNITS[i].fn(F, kit(F), o);
  return F.finish(o);
}
