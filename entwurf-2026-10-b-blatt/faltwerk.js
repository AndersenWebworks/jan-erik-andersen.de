// Faltwerk: Papierfaltung als Pop-up. Alle Flächen liegen im Faltplan flach auf dem Blatt (x/z, y = Blattnormale).
// Jede Fläche hängt an einem Scharnier ihrer Elternfläche und klappt mit dem Faltzustand s hoch (0 flach, 1 gefaltet).
// Knoten: Scharnier (Drehung), Drehteller (Drehung um die Blattnormale) und Schlitten (Verschiebung).
// Die Seite rechnet je Bild nur sichtbare Modelle neu (CPU, einige tausend Punkte).
import * as THREE from "three";

const PI = Math.PI, Q = PI / 2;
export const EPS = .008;
const lin = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
export const COL = {
  W: lin("#ffffff"), BASE: lin("#f4f4f5"), OLD: lin("#e9e9eb"), SHADE: lin("#dadadf"), MID: lin("#b9b9c0"), DARK: lin("#8d8d95"),
  RED: lin("#d40235"), INK: lin("#303033"), PALE: lin("#fbe9ed")
};
const { W, INK } = COL;
const sm5 = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10);

// ---------- Shader ----------
const FILL_VERT = `
  attribute vec3 aCol; attribute vec2 aT;
  varying vec3 vCol; varying vec3 vP; varying vec3 vW; varying vec2 vT; varying float vDepth; varying vec2 vUv;
  attribute vec2 aUv;
  void main() {
    vCol = aCol; vP = position; vT = aT; vUv = aUv; vW = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const FILL_FRAG = `
  uniform vec3 uL; uniform vec3 uN; uniform float uS; uniform float uVis; uniform sampler2D uMap; uniform float uTex;
  varying vec3 vCol; varying vec3 vP; varying vec3 vW; varying vec2 vT; varying float vDepth; varying vec2 vUv;
  void main() {
    if (uS < vT.x) discard;
    float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    if (smoothstep(60.0, 220.0, vDepth) * uVis < ign) discard;
    vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
    if (dot(n, cameraPosition - vW) < 0.0) n = -n;
    float dif = dot(n, uL);
    float sh = 0.80 + 0.20 * clamp(dif / 0.745, -1.0, 1.0);
    float ao = mix(1.0, mix(0.86, 1.0, smoothstep(0.0, 0.7, vP.y)), 1.0 - abs(dot(n, uN)));
    vec3 c = vCol * sh * ao;
    if (uTex > 0.5) { c = texture2D(uMap, vUv).rgb * mix(1.0, sh, 0.35); }
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;
const EDGE_VERT = `
  attribute vec4 aCol; attribute vec2 aT;
  varying vec4 vC; varying vec2 vT; varying float vDepth;
  void main() {
    vC = aCol; vT = aT;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const EDGE_FRAG = `
  uniform float uS; uniform float uVis;
  varying vec4 vC; varying vec2 vT; varying float vDepth;
  void main() {
    float k = smoothstep(0.0, 0.3, (uS - vT.x) / vT.y);
    float a = vC.a * k * uVis * smoothstep(40.0, 200.0, vDepth);
    if (a < 0.005) discard;
    gl_FragColor = vec4(vC.rgb, min(a, 1.0));
    #include <colorspace_fragment>
  }`;
export const LIGHT = new THREE.Vector3(-.45, .75, -.5).normalize(); // im Modellraum (y = Blattnormale, -z = Blatt oben)
export function fillMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: { uL: { value: LIGHT.clone() }, uN: { value: new THREE.Vector3(0, 0, 1) }, uS: { value: 0 }, uVis: { value: 1 }, uMap: { value: map || null }, uTex: { value: map ? 1 : 0 } },
    vertexShader: FILL_VERT, fragmentShader: FILL_FRAG, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2
  });
}
export function edgeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uS: { value: 0 }, uVis: { value: 1 } },
    vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG, transparent: true, depthWrite: false
  });
}

// ---------- Modell ----------
export function Model() {
  const nodes = [];
  const off = [0, 0];
  const T = { v: [], c: [], t: [], n: [] };   // Dreiecke
  const Ls = { v: [], c: [], t: [], n: [] };  // Kanten
  const X = {};                               // Bildflächen je Schlüssel
  const mk = (par, kind, P, A, ang, t0, d, back, lvl, V) => {
    const n = { i: nodes.length, par, kind, P, A, ang, t0, d: Math.max(d, 1e-3), back, lvl, V, M: new Float64Array(12) };
    nodes.push(n); return n;
  };
  const root = mk(null, 0, null, null, 0, 0, 1, null, 0);
  const sh = p => [p[0] + off[0], p[1] + off[1]];
  const F = {
    root,
    at(ox, oz, fn) { const o0 = off[0], o1 = off[1]; off[0] += ox; off[1] += oz; fn(); off[0] = o0; off[1] = o1; },
    hinge(par, a, b, side, ang, t0, d, opt = {}) {
      a = sh(a); b = sh(b); side = sh(side);
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl + 1;
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      const sx = side[0] - a[0], sz = side[1] - a[1], pr = sx * ux + sz * uz, vx = sx - ux * pr, vz = sz - uz * pr, al = Math.hypot(vx, vz);
      return mk(par, 1, [a[0], lvl * EPS, a[1]], [-vz / al, 0, vx / al], ang, t0, d, opt.back, lvl);
    },
    spin(par, c, ang, t0, d, opt = {}) {
      c = sh(c);
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl;
      return mk(par, 1, [c[0], 0, c[1]], [0, 1, 0], ang, t0, d, opt.back, lvl);
    },
    slide(par, vec, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl;
      return mk(par, 2, null, null, 0, t0, d, opt.back, lvl, vec);
    },
    still(par, t0, d, opt = {}) { return F.slide(par, [0, 0, 0], t0, d, opt); },
    poly(nd, pts, col = W, e = .5, dy = 0, ecol = INK) {
      pts = pts.map(sh);
      const y = nd.lvl * EPS + dy, n = pts.length;
      for (let k = 1; k < n - 1; k++) for (const p of [pts[0], pts[k], pts[k + 1]]) { T.v.push(p[0], y, p[1]); T.c.push(...col); T.t.push(nd.t0, nd.d); T.n.push(nd.i); }
      for (let k = 0; k < n; k++) {
        const w = Array.isArray(e) ? e[k] : e; if (!w) continue;
        const p = pts[k], q = pts[(k + 1) % n];
        Ls.v.push(p[0], y, p[1], q[0], y, q[1]); Ls.c.push(...ecol, w, ...ecol, w); Ls.t.push(nd.t0, nd.d, nd.t0, nd.d); Ls.n.push(nd.i, nd.i);
      }
    },
    line(nd, a, b, w = .35, col = INK, dy = .004) {
      a = sh(a); b = sh(b);
      const y = nd.lvl * EPS + dy;
      Ls.v.push(a[0], y, a[1], b[0], y, b[1]); Ls.c.push(...col, w, ...col, w); Ls.t.push(nd.t0, nd.d, nd.t0, nd.d); Ls.n.push(nd.i, nd.i);
    },
    // Bildfläche (Bildschirm): Viereck pts (a, b, c, d), uvr = [[u,v] x4] in Texturkoordinaten
    quad(nd, pts, key, uvr, dy = .004) {
      pts = pts.map(sh);
      const y = nd.lvl * EPS + dy, g = X[key] || (X[key] = { v: [], u: [], t: [], n: [] });
      for (const k of [0, 1, 2, 0, 2, 3]) { g.v.push(pts[k][0], y, pts[k][1]); g.u.push(...uvr[k]); g.t.push(nd.t0, nd.d); g.n.push(nd.i); }
    },
    finish() {
      const mkGeo = (src, withUv) => {
        const rest = new Float32Array(src.v), nid = Int32Array.from(src.n), pos = new Float32Array(rest.length);
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
        g.setAttribute("aT", new THREE.BufferAttribute(new Float32Array(src.t), 2));
        if (src.c) g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(src.c), src === Ls ? 4 : 3));
        if (withUv) g.setAttribute("aUv", new THREE.BufferAttribute(new Float32Array(src.u), 2));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
        return { g, rest, nid, pos };
      };
      const parts = [mkGeo(T), mkGeo(Ls)];
      T.u = new Array(T.v.length / 3 * 2).fill(0);
      parts[0].g.setAttribute("aUv", new THREE.BufferAttribute(new Float32Array(T.u), 2));
      const xs = {};
      for (const k in X) { xs[k] = mkGeo(X[k], true); parts.push(xs[k]); }
      let last = -1;
      function update(s) {
        if (s === last) return; last = s;
        for (const nd of nodes) {
          const M = nd.M;
          if (!nd.par) { M.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]); continue; }
          let w = sm5((s - nd.t0) / nd.d); if (nd.back) w -= sm5((s - nd.back[0]) / nd.back[1]);
          let r, lt;
          if (nd.kind === 2) { r = [1, 0, 0, 0, 1, 0, 0, 0, 1]; lt = [nd.V[0] * w, nd.V[1] * w, nd.V[2] * w]; }
          else {
            const th = nd.ang * w, c = Math.cos(th), sn = Math.sin(th), t = 1 - c, [x, y, z] = nd.A, [px, py, pz] = nd.P;
            r = [t * x * x + c, t * x * y - sn * z, t * x * z + sn * y, t * x * y + sn * z, t * y * y + c, t * y * z - sn * x, t * x * z - sn * y, t * y * z + sn * x, t * z * z + c];
            lt = [px - (r[0] * px + r[1] * py + r[2] * pz), py - (r[3] * px + r[4] * py + r[5] * pz), pz - (r[6] * px + r[7] * py + r[8] * pz)];
          }
          const m = nd.par.M;
          for (let a = 0; a < 3; a++) {
            const m0 = m[a * 4], m1 = m[a * 4 + 1], m2 = m[a * 4 + 2];
            M[a * 4] = m0 * r[0] + m1 * r[3] + m2 * r[6];
            M[a * 4 + 1] = m0 * r[1] + m1 * r[4] + m2 * r[7];
            M[a * 4 + 2] = m0 * r[2] + m1 * r[5] + m2 * r[8];
            M[a * 4 + 3] = m0 * lt[0] + m1 * lt[1] + m2 * lt[2] + m[a * 4 + 3];
          }
        }
        for (const p of parts) {
          const { rest, nid, pos } = p;
          for (let i = 0, j = 0; j < nid.length; j++, i += 3) {
            const M = nodes[nid[j]].M, x = rest[i], y = rest[i + 1], z = rest[i + 2];
            pos[i] = M[0] * x + M[1] * y + M[2] * z + M[3];
            pos[i + 1] = M[4] * x + M[5] * y + M[6] * z + M[7];
            pos[i + 2] = M[8] * x + M[9] * y + M[10] * z + M[11];
          }
          p.g.attributes.position.needsUpdate = true;
        }
      }
      return { geoT: parts[0].g, geoL: parts[1].g, geoX: Object.fromEntries(Object.keys(xs).map(k => [k, xs[k].g])), update };
    }
  };
  return F;
}

// ---------- Bauteile ----------
export function kit(F) {
  const K = {};
  const P_ = (nd, uvs, col = W, e = .5, dy = 0, ecol = INK) => F.poly(nd, uvs.map(q => nd.uv(q[0], q[1])), col, e, dy, ecol);
  // Fläche an Scharnier a-b, liegt in Richtung n flach; uv: u entlang a-b, v von der Kante weg
  K.panel = (par, a, b, n, t0, d, ang = Q, opt) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    const nd = F.hinge(par, a, b, [a[0] + n[0], a[1] + n[1]], ang, t0, d, opt);
    nd.L = L; nd.dir = [ux, uz]; nd.n = n;
    nd.uv = (u, v) => [a[0] + ux * u + n[0] * v, a[1] + uz * u + n[1] * v];
    return nd;
  };
  K.P = P_;
  K.rect = (nd, u0, v0, u1, v1, col, e, dy, ecol) => P_(nd, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], col, e, dy, ecol);
  // Aufdruck auf beiden Seiten einer Fläche
  K.deco = (nd, u0, v0, u1, v1, col = COL.SHADE, e = 0, ecol) => { K.rect(nd, u0, v0, u1, v1, col, e, .0025, ecol); K.rect(nd, u0, v0, u1, v1, col, e, -.0025, ecol); };
  K.decoP = (nd, uvs, col, e = 0, ecol) => { P_(nd, uvs, col, e, .0025, ecol); P_(nd, uvs, col, e, -.0025, ecol); };
  K.ln = (nd, a, b, w = .35, col = INK) => { F.line(nd, nd.uv(a[0], a[1]), nd.uv(b[0], b[1]), w, col, .004); F.line(nd, nd.uv(a[0], a[1]), nd.uv(b[0], b[1]), w, col, -.004); };
  // Bild auf beiden Seiten (Rückseite spiegelverkehrt ist hier egal, sie liegt innen)
  K.tex = (nd, u0, v0, u1, v1, key, uvr) => {
    const c = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(q => nd.uv(q[0], q[1]));
    F.quad(nd, c, key, [[uvr[0], uvr[1]], [uvr[2], uvr[1]], [uvr[2], uvr[3]], [uvr[0], uvr[3]]], -.004);
  };
  K.circle = (cx, cy, r, n = 20) => { const p = []; for (let i = 0; i < n; i++) { const a = 2 * PI * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
  // Ziegelverband als Linien auf einer Fläche
  K.brick = (nd, u0, v0, u1, v1, cw, ch, w = .3) => {
    let r = 0;
    for (let v = v0; v < v1 - 1e-6; v += ch, r++) {
      if (r) K.ln(nd, [u0, v], [u1, v], w);
      for (let u = u0 + (r % 2 ? cw / 2 : cw); u < u1 - .05; u += cw) K.ln(nd, [u, v], [u, Math.min(v + ch, v1)], w * .8);
    }
  };
  K.grid = (nd, u0, v0, u1, v1, nu, nv, w = .3, stag = false) => {
    for (let j = 1; j < nv; j++) K.ln(nd, [u0, v0 + (v1 - v0) * j / nv], [u1, v0 + (v1 - v0) * j / nv], w);
    for (let j = 0; j < nv; j++) for (let i = 1; i < nu; i++) { const u = u0 + (u1 - u0) * (i + (stag && j % 2 ? .5 : 0)) / nu; if (u < u1 - .02) K.ln(nd, [u, v0 + (v1 - v0) * j / nv], [u, v0 + (v1 - v0) * (j + 1) / nv], w); }
  };
  // Faltschachtel: vier Wände klappen hoch, Deckel oder Satteldach folgt.
  // o: col, gable, roof, ov, holes [[u0,u1,v0,v1]], open (kein Deckel), sides (false: keine Seitenwände), sg (-1: steht auf der sichtbaren Seite einer Elternfläche), e, ecol, lv, back
  K.box = (par, x0, x1, z0, z1, h, t0, d, o = {}) => {
    const col = o.col || W, D = z0 - z1, Wd = x1 - x0, tw = d * .55, ts = d * .12, rh = o.gable || 0, sg = o.sg || 1, A = Q * sg;
    const e = o.e === undefined ? .5 : o.e, ec = o.ecol || INK;
    const op = o.lv !== undefined ? { lv: o.lv + 1, back: o.back } : { back: o.back };
    const ch = { back: o.back };
    if (o.floor) { const fl = F.still(par, t0, d * .35, { lv: o.lv !== undefined ? o.lv : par.lvl }); F.poly(fl, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], o.floor, 0, 0); }
    const fr = K.panel(par, [x0, z0], [x1, z0], [0, 1], t0, tw, A, op);
    const bk = K.panel(par, [x0, z1], [x1, z1], [0, -1], t0, tw, A, op);
    const sides = o.sides !== false;
    let lf = null, rt = null;
    if (sides) {
      lf = K.panel(par, [x0, z0], [x0, z1], [-1, 0], t0 + ts, tw, A, op);
      rt = K.panel(par, [x1, z0], [x1, z1], [1, 0], t0 + ts, tw, A, op);
    }
    const front = rh ? [[0, 0], [Wd, 0], [Wd, h], [Wd / 2, h + rh], [0, h]] : [[0, 0], [Wd, 0], [Wd, h], [0, h]];
    let holes = o.holes || (o.door ? [o.door] : null);
    const wallFront = (w) => {
      if (!holes) { K.P(w, front, col, e, 0, ec); return; }
      let u = 0;
      for (const [u0, u1, v0, v1] of holes.slice().sort((a, b) => a[0] - b[0])) {
        K.P(w, [[u, 0], [u0, 0], [u0, h], [u, h]], col, e, 0, ec);
        K.P(w, [[u0, v1], [u1, v1], [u1, h], [u0, h]], col, [e, 0, e, 0], 0, ec);
        if (v0 > 0) K.P(w, [[u0, 0], [u1, 0], [u1, v0], [u0, v0]], col, [e, 0, e, 0], 0, ec);
        u = u1;
      }
      K.P(w, [[u, 0], [Wd, 0], [Wd, h], [u, h]], col, e, 0, ec);
      if (rh) K.P(w, [[0, h], [Wd, h], [Wd / 2, h + rh]], col, [0, e, e], 0, ec);
    };
    wallFront(fr);
    if (o.through && holes) { const m = holes.map(([u0, u1, v0, v1]) => [Wd - u1, Wd - u0, v0, v1]); const sv = holes; holes = m; wallFront(bk); holes = sv; } else K.P(bk, front, col, e, 0, ec);
    if (sides) for (const w of [lf, rt]) K.rect(w, 0, 0, D, h, col, e, 0, ec);
    let top = null, roofs = null;
    if (sides && rh) {
      const S = Math.hypot(Wd / 2, rh), ang = Math.atan2(Wd / 2, rh) * sg, ov = o.ov !== undefined ? o.ov : .14;
      roofs = [lf, rt].map(w => { const r = K.panel(w, w.uv(0, h), w.uv(D, h), w.n, t0 + d * .5, d * .5, ang, ch); K.rect(r, -ov, 0, D + ov, S, o.roof || col, e, 0, ec); return r; });
    } else if (!o.open && !rh) {
      top = K.panel(bk, bk.uv(0, h), bk.uv(Wd, h), [0, -1], t0 + d * .5, d * .5, A, ch);
      K.rect(top, 0, 0, Wd, D, o.roof || col, e, 0, ec);
    }
    return { fr, bk, lf, rt, top, roofs, W: Wd, D, h };
  };
  // Zickzack-Treppe aus einem Streifen: Setzstufe und Trittstufe falten abwechselnd (steigt Richtung dir)
  K.stairs = (par, x0, x1, za, n, r, t, t0, d, dir = -1, col = W, e = .55) => {
    let p = par, z = za; const out = [];
    for (let i = 0; i < 2 * n; i++) {
      const len = i % 2 ? t : r, ang = i === 0 ? Q : (i % 2 ? -Q : Q);
      const nd = K.panel(p, [x0, z], [x1, z], [0, dir], t0 + d * .8 * i / (2 * n), d * .35, ang);
      K.rect(nd, 0, 0, nd.L, len, col, e);
      out.push(nd); p = nd; z += dir * len;
    }
    return out;
  };
  // Punkt auf dem Deckel einer Schachtel (Ruhelage zum Endpunkt (x, z) auf der Oberseite)
  K.lidPt = (b, x, z) => [x, b.bk.uv(0, 0)[1] - b.h - (z - b.bk.uv(0, 0)[1])];
  return K;
}
