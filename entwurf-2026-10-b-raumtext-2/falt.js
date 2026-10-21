// Faltkern für Entwurf B Raumtext 2 (Prinzip aus Konstruktion 7: Pop-up-Buch).
// Alle Flächen liegen in Ruhelage flach auf dem Boden (Faltplan in x/z, y = Ebene * EPS).
// Jede Fläche hängt an einem Scharnier ihrer Elternfläche und klappt mit dem Faltzustand s (0 flach, 1 aufgefaltet) hoch.
// Neu gegenüber Konstruktion 7: Maßstab 1 (Meter), freie Platzierung (Ort + Gierwinkel) und angehängte Objekte
// (Textgruppen, Bildschirmbilder), die mit ihrer Fläche mitfalten.
import * as THREE from "three";

export const PI = Math.PI, Q = PI / 2;
export const EPS = .006;
const lin = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
export const COL = {
  PAPER: lin("#fbfaf6"), BASE: lin("#f2efe8"), OLD: lin("#e4ddcf"), SHADE: lin("#d6cfc2"), DARK: lin("#9d978d"),
  RED: lin("#d40235"), INK: lin("#303033"), STONE: lin("#ebe6dc"), STONE2: lin("#ddd6c8"), GLASS: lin("#e9ebec")
};
const { PAPER, SHADE, INK } = COL;
export const sm5 = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10);

// ---------- Shader ----------
// Papier: flache Normale aus den Bildschirmableitungen, weiches Licht, leichte Bodenverschattung.
// Ganz Nahes wird per Raster ausgedünnt (die Kamera fliegt durch Konstruktionen), Fernes sinkt in den weißen Raum.
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
  uniform vec3 uL; uniform vec2 uFar; uniform vec2 uNear; uniform float uVis; uniform float uFloor;
  varying vec3 vCol; varying vec3 vW; varying float vDepth;
  void main() {
    float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    if (smoothstep(uNear.x, uNear.y, vDepth) < ign) discard;
    vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
    if (dot(n, cameraPosition - vW) < 0.0) n = -n;
    float dif = dot(n, uL);
    float sh = 0.84 + 0.16 * max(dif, 0.0) - 0.12 * max(-dif, 0.0);
    float ao = mix(1.0, mix(0.88, 1.0, smoothstep(0.0, 0.9, vW.y - uFloor)), 1.0 - abs(n.y));
    vec3 c = vCol * sh * ao;
    float k = uVis * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
    gl_FragColor = vec4(mix(vec3(1.0), c, k), 1.0);
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
  uniform vec2 uFar; uniform vec2 uNear; uniform float uVis;
  varying vec4 vC; varying float vDepth;
  void main() {
    float a = vC.a * uVis * smoothstep(uNear.x, uNear.y + .3, vDepth) * (1.0 - smoothstep(uFar.x, uFar.y, vDepth));
    if (a < 0.005) discard;
    gl_FragColor = vec4(vC.rgb, min(a, 1.0));
    #include <colorspace_fragment>
  }`;
const LIGHT = new THREE.Vector3(-.45, .8, .5).normalize();
export const FAR = new THREE.Vector2(16, 46), NEAR = new THREE.Vector2(.35, 1.3);
export function paperMaterial(floorY = 0) {
  return new THREE.ShaderMaterial({
    uniforms: { uL: { value: LIGHT }, uFar: { value: FAR }, uNear: { value: NEAR }, uVis: { value: 1 }, uFloor: { value: floorY } },
    vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2
  });
}
export function edgeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uFar: { value: FAR }, uNear: { value: NEAR }, uVis: { value: 1 } },
    vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG, transparent: true, depthWrite: false
  });
}

// ---------- Faltmodell ----------
export function Model() {
  const nodes = [];
  const tv = [], tc = [], tn = [];
  const lv = [], lc = [], ln = [];
  const att = []; // angehängte Objekte: { nd, obj, R }
  const mk = (par, P, A, ang, t0, d, back, lvl) => {
    const n = { i: nodes.length, par, P, A, ang, t0, d: Math.max(d, 1e-3), back, lvl, M: new Float64Array(12) };
    n.M.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]);
    nodes.push(n); return n;
  };
  const root = mk(null, null, null, 0, 0, 1, null, 0);
  const F = {
    root, nodes,
    // Scharnier a-b (Boden x/z); side: ein Punkt der Fläche. ang > 0 hebt die Fläche zur Oberseite der Elternfläche.
    hinge(par, a, b, side, ang, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl + 1;
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      const sx = side[0] - a[0], sz = side[1] - a[1], pr = sx * ux + sz * uz, vx = sx - ux * pr, vz = sz - uz * pr, al = Math.hypot(vx, vz);
      return mk(par, [a[0], lvl * EPS, a[1]], [-vz / al, 0, vx / al], ang, t0, d, opt.back, lvl);
    },
    // Hubknoten: die Ebene hebt sich parallel um dy (Plattform, Deckel, Tischplatte); Kinder bauen in denselben x/z-Koordinaten weiter
    lift(par, dy, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl + 1;
      const n = mk(par, [0, 0, 0], [1, 0, 0], 0, t0, d, opt.back, lvl); n.lift = dy; return n;
    },
    spin(par, c, ang, t0, d, opt = {}) {
      const lvl = opt.lv !== undefined ? opt.lv : par.lvl;
      return mk(par, [c[0], 0, c[1]], [0, 1, 0], ang, t0, d, opt.back, lvl);
    },
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
    // Objekt an einen Knoten hängen. p: Punkt (x, z) in der Ruhelage, q: Richtung "oben" des Objekts in der Ruhelage,
    // side +1: Oberseite der Ruhelage (zeigt nach dem Hochklappen zur Gegenseite von q... siehe Konzept), -1: Unterseite.
    attach(nd, obj, p, q, side = 1, lift = .004) {
      const ql = Math.hypot(q[0], q[1]), qx = q[0] / ql, qz = q[1] / ql;
      const X = new THREE.Vector3(-qz * side, 0, qx * side), Y = new THREE.Vector3(qx, 0, qz), N = new THREE.Vector3(0, side, 0);
      const R = new THREE.Matrix4().makeBasis(X, Y, N).setPosition(p[0], nd.lvl * EPS + side * lift, p[1]);
      obj.matrixAutoUpdate = false;
      att.push({ nd, obj, R });
      return { X, Y };
    },
    finish(place) {
      const restT = new Float32Array(tv), restL = new Float32Array(lv), nT = Int32Array.from(tn), nL = Int32Array.from(ln);
      const posT = new Float32Array(restT.length), posL = new Float32Array(restL.length);
      const geoT = new THREE.BufferGeometry(), geoL = new THREE.BufferGeometry();
      geoT.setAttribute("position", new THREE.BufferAttribute(posT, 3).setUsage(THREE.DynamicDrawUsage));
      geoT.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(tc), 3));
      geoL.setAttribute("position", new THREE.BufferAttribute(posL, 3).setUsage(THREE.DynamicDrawUsage));
      geoL.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(lc), 4));
      const c = Math.cos(place.yaw || 0), sn = Math.sin(place.yaw || 0), ox = place.x, oy = place.y || 0, oz = place.z;
      const PL = new THREE.Matrix4().makeRotationY(place.yaw || 0).setPosition(ox, oy, oz);
      const xf = (rest, nid, out) => {
        for (let i = 0, j = 0; j < nid.length; j++, i += 3) {
          const M = nodes[nid[j]].M, x = rest[i], y = rest[i + 1], z = rest[i + 2];
          const px = M[0] * x + M[1] * y + M[2] * z + M[3], py = M[4] * x + M[5] * y + M[6] * z + M[7], pz = M[8] * x + M[9] * y + M[10] * z + M[11];
          out[i] = ox + c * px + sn * pz; out[i + 1] = oy + py; out[i + 2] = oz - sn * px + c * pz;
        }
      };
      const m4 = new THREE.Matrix4();
      const nodeMat = (nd, out) => { const M = nd.M; m4.set(M[0], M[1], M[2], M[3], M[4], M[5], M[6], M[7], M[8], M[9], M[10], M[11], 0, 0, 0, 1); return out.multiplyMatrices(PL, m4); };
      let last = -1;
      function solve(s) {
        for (const nd of nodes) {
          const M = nd.M;
          if (!nd.par) continue;
          let w = sm5((s - nd.t0) / nd.d); if (nd.back) w -= sm5((s - nd.back[0]) / nd.back[1]);
          if (nd.lift) { const m = nd.par.M, ty = nd.lift * w; for (let a = 0; a < 3; a++) { M[a * 4] = m[a * 4]; M[a * 4 + 1] = m[a * 4 + 1]; M[a * 4 + 2] = m[a * 4 + 2]; M[a * 4 + 3] = m[a * 4 + 1] * ty + m[a * 4 + 3]; } continue; }
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
      }
      const tmp = new THREE.Matrix4();
      function update(s) {
        if (s === last) return false; last = s;
        solve(s);
        xf(restT, nT, posT); xf(restL, nL, posL);
        geoT.attributes.position.needsUpdate = true; geoL.attributes.position.needsUpdate = true;
        for (const a of att) { nodeMat(a.nd, tmp); a.obj.matrix.multiplyMatrices(tmp, a.R); a.obj.matrixWorldNeedsUpdate = true; }
        return true;
      }
      // Weltmatrix eines angehängten Objekts im Faltzustand s (für die Kamerarechnung), ohne die Geometrie anzufassen
      function frameAt(obj, s) {
        solve(s); last = -1;
        const a = att.find(q => q.obj === obj); if (!a) return null;
        return nodeMat(a.nd, new THREE.Matrix4()).multiply(a.R);
      }
      const toWorld = (x, y, z) => new THREE.Vector3(ox + c * x + sn * z, oy + y, oz - sn * x + c * z);
      return { geoT, geoL, update, frameAt, toWorld, att, PL };
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
  K.deco = (nd, u0, v0, u1, v1, col = SHADE, e = 0, dy = .0025) => { K.rect(nd, u0, v0, u1, v1, col, e, dy); K.rect(nd, u0, v0, u1, v1, col, e, -dy); };
  K.decoP = (nd, uvs, col, e = 0) => { K.P(nd, uvs, col, e, .0025); K.P(nd, uvs, col, e, -.0025); };
  K.ln = (nd, a, b, w = .35, col = INK) => { F.line(nd, nd.uv(a[0], a[1]), nd.uv(b[0], b[1]), w, col, .004); F.line(nd, nd.uv(a[0], a[1]), nd.uv(b[0], b[1]), w, col, -.004); };
  // Text oder Bild auf einer Fläche: ul = Abstand der linken Blockkante von der (vom Betrachter aus) linken Kante der Fläche,
  // vt = Höhe der Blockoberkante über dem Scharnier, side = sichtbare Seite (+1 Oberseite der Ruhelage, -1 Unterseite).
  K.put = (nd, obj, ul, vt, side = 1, lift) => {
    const q = nd.n, X0 = [-q[1] * side, q[0] * side], sg = X0[0] * nd.dir[0] + X0[1] * nd.dir[1] > 0 ? 1 : -1;
    const u = sg > 0 ? ul : nd.L - ul;
    return F.attach(nd, obj, nd.uv(u, vt), q, side, lift);
  };
  // Faltschachtel: vier Wände klappen nach innen hoch, Deckel oder Satteldach folgt. Außenseite aller Wände: side -1.
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
    } else K.P(fr, front, o.fcol || col);
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
  // Zickzack-Treppe aus einem Streifen
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
  K.lidPt = (b, x, z) => [x, b.bk.uv(0, 0)[1] - b.h - (z - b.bk.uv(0, 0)[1])];
  return K;
}
export const circle = (cx, cy, r, n, a0 = 0) => { const p = []; for (let i = 0; i < n; i++) { const a = a0 + 2 * PI * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
