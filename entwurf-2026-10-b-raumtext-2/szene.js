// Abschnitte für Entwurf B Raumtext 2: je Lesestellung ein Faltmodell, dessen Flächen den Text tragen.
// Koordinaten je Abschnitt lokal in Metern: x nach rechts, z zur ankommenden Kamera (+z vorn), Boden y = 0.
// build(F, K, o, T): baut das Modell; T enthält die gesetzten Textblöcke (W, H, group) und legt sie mit K.put auf Flächen.
// Kamera je Lesestellung: side (Desktop: Textspalte links -1 / rechts +1), yaw (Grad, + = Kamera blickt nach links),
// pitch (Grad nach unten). focus = Textblock, auf den die Lesestellung rechnet.
import { COL, Q, PI, circle } from "./falt.js";
const { PAPER, BASE, OLD, SHADE, DARK, RED, INK, STONE, STONE2, GLASS } = COL;

// Fläche, die an der Linie (x0, z)–(x0+W, z) steht; liegt in Ruhe nach hinten (−z) und richtet sich zur Kamera auf. Sichtseite +1.
function stand(K, par, x0, z, W, H, t0, d, opt = {}) {
  const nd = K.panel(par, [x0, z], [x0 + W, z], [0, -1], t0, d, opt.ang || Q, opt.lv !== undefined ? { lv: opt.lv } : undefined);
  K.rect(nd, 0, 0, W, H, opt.col || PAPER, opt.e === undefined ? .5 : opt.e);
  return nd;
}
const base = (F, R, x0, x1, z0, z1) => F.poly(R, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], BASE, .3);
// Baum aus zwei gekreuzten Faltflächen
function tree(K, R, x, z, h, r, t0 = .5) {
  for (const [a, b, n] of [[[x - r, z], [x + r, z], [0, -1]], [[x, z + r], [x, z - r], [1, 0]]]) {
    const nd = K.panel(R, a, b, n, t0, .3, Q);
    K.P(nd, [[r - .05, 0], [r + .05, 0], [r + .05, h * .3], [r - .05, h * .3]], DARK, .4);
    K.P(nd, [[0, h * .3], [2 * r, h * .3], [r, h]], PAPER, .5);
  }
}

export const TOPICS = ["Einstieg", "Gerwing", "Betreuung", "Modernisierung", "Shops", "Schnittstellen", "Gestaltung", "Weitere Arbeit", "Wie ich arbeite", "Werdegang", "Stimmen", "Agenturen", "Kontakt"];

export const STATIONS = [
  // ---------- 0 Einstieg ----------
  {
    id: "start", topic: 0, mob: { x: -1.9, z: 2.9 }, place: { x: 0, z: 0, yaw: 0 },
    texts: {
      main: { def: { sec: "#start", sel: ".panel", kicker: 1 }, w: 25, nw: 21 },
      w1: { word: "Jan-Erik", font: "disp", s: .92, ns: .62 },
      w2: { word: "Andersen", font: "dispi", s: .8, ns: .56, red: 1 }
    },
    focus: "main", side: 1, yaw: -6, pitch: 10, nyaw: 0, npitch: 12,
    build(F, K, o, T) {
      const R = F.root, nar = o.narrow, B = T.main;
      base(F, R, -5.5, 5.5, 1.4, -8.5);
      // Website-Seite: Kopfleiste mit Zeichen und Navigation, darunter der Text, unten drei Kacheln
      const mg = .24, bar = .26, Wp = B.W + 2 * mg, tile = .34, Hp = bar + .2 + B.H + .26 + tile + .22;
      const xp = nar ? -Wp / 2 : .35, zp = nar ? -1.2 : -2.0;
      const pg = stand(K, R, xp, zp, Wp, Hp, .1, .3, { lv: 2 });
      K.deco(pg, 0, Hp - bar, Wp, Hp, STONE); K.deco(pg, .12, Hp - bar + .08, .22, Hp - .08, RED, 0, .0045);
      for (let k = 0; k < 4; k++) K.ln(pg, [Wp - .26 - k * .28, Hp - bar / 2], [Wp - .12 - k * .28, Hp - bar / 2], .5);
      const tw = (Wp - 2 * mg - .16) / 3;
      for (let k = 0; k < 3; k++) { const u0 = mg + k * (tw + .08); K.deco(pg, u0, .22, u0 + tw, .22 + tile, k === 1 ? STONE2 : STONE); }
      K.put(pg, B.group, mg, Hp - bar - .2, 1);
      // Name: zwei Reihen ausgeschnittener Lettern auf Stufen; im Bogen bleibt der Abdruck
      const w1 = T.w1, w2 = T.w2;
      const x1 = nar ? -w1.W / 2 : -3.55, z1 = nar ? -5.2 : -5.0, x2 = nar ? -w2.W / 2 + .1 : -3.25, z2 = nar ? -3.4 : -3.1;
      const h1 = nar ? 2.3 : .62, h2 = nar ? 1.5 : 0;
      const tier = (x, z, w, hh, t0, lv) => {
        const b = K.box(R, x - .22, x + w + .22, z + .34, z - .3, hh, t0, .26, { lv, open: true });
        K.deco(b.fr, .14, hh - .1, w + .3, hh - .07, STONE2);
        const pl = F.lift(R, hh, t0, .26 * .55, { lv: lv + 2 });
        F.poly(pl, [[x - .22, z + .34], [x + w + .22, z + .34], [x + w + .22, z - .3], [x - .22, z - .3]], PAPER, .5);
        return pl;
      };
      const P1 = tier(x1, z1, w1.W, h1, .16, 4), P2 = h2 ? tier(x2, z2, w2.W, h2, .12, 8) : R;
      const L1 = K.panel(P1, [x1, z1], [x1 + w1.W, z1], [0, -1], .4, .26, Q, { lv: P1.lvl + 2 });
      K.put(L1, w1.group, 0, .24 * w1.s, 1, .001);
      F.attach(P1, T.w1i.group, [x1, z1 - .24 * w1.s], [0, -1], 1, .002);
      const L2 = K.panel(P2, [x2, z2], [x2 + w2.W, z2], [0, -1], .3, .28, Q, { lv: P2.lvl + 2 });
      K.put(L2, w2.group, 0, .24 * w2.s, 1, .001);
      F.attach(P2, T.w2i.group, [x2, z2 - .24 * w2.s], [0, -1], 1, .002);
      // Shop mit Markise und angebundenes System hinter der Seite, rote Verbindungen am Boden
      const sx = nar ? -2.4 : -.2, sz = nar ? -7.0 : -6.7, sw = 1.6;
      const sh = K.box(R, sx, sx + sw, sz, sz - 1.5, 1.45, .46, .3, { lv: 14 });
      K.deco(sh.fr, .2, .22, 1.05, .95, GLASS); K.deco(sh.fr, 1.25, 0, 1.6, 1.0, DARK);
      const aw = K.panel(sh.fr, sh.fr.uv(0, 1.45), sh.fr.uv(sw, 1.45), [0, 1], .66, .18, -2.0);
      for (let k = 0; k < 8; k++) K.rect(aw, k * sw / 8, 0, (k + 1) * sw / 8, .6, k % 2 ? PAPER : RED, .3);
      const vx = nar ? 1.2 : 2.1, vz = nar ? -7.4 : -6.0;
      const sv = K.box(R, vx, vx + .62, vz, vz - .7, 2.5, .56, .3, { lv: 16 });
      for (let k = 0; k < 6; k++) K.ln(sv.fr, [.1, .45 + k * .3], [.52, .45 + k * .3], .55);
      K.deco(sv.fr, .42, 2.2, .52, 2.3, RED);
      F.line(R, [xp + Wp * .55, zp - .08], [sx + sw * .5, sz + .02], .6, RED, .012);
      F.line(R, [sx + sw, sz - .75], [vx, vz - .35], .6, RED, .012);
    },
    thread: [[-2.0, 4.0], [.1, -1.5]], dot: 1,
    // über die Oberkante der Website-Seite, über den Shop hinweg, dann von oben auf Gerwing zu
    out: c => [
      { u: .16, p: c.W(1.2, 2.75, .2), t: c.W(1.0, 1.2, -6) },
      { u: .34, p: c.W(.6, 2.6, -4.6), t: c.W(.9, .6, -12) },
      { u: .7, p: c.W2(-3.4, 3.4, 7.5), t: c.W2(-1.6, .9, -2.4) }
    ]
  },
  // ---------- 1 Gerwing ----------
  {
    id: "arbeit", topic: 1, mob: { x: 1.6, z: 2.8 }, place: { x: 2.5, z: -21, yaw: .1 },
    texts: { main: { def: { sec: "#arbeit", sel: ".panel", head: 1 }, w: 29, nw: 21.5, headScale: 5 } },
    focus: "main", side: -1, yaw: -8, pitch: 7, npitch: 10,
    build(F, K, o, T) {
      const R = F.root, nar = o.narrow, B = T.main;
      // Haus als Winkel: der vordere Flügel trägt auf seiner Stirnwand den Text, der zurückliegende Hauptbau öffnet sich mit Glastüren zur Terrasse
      const h = o.mobile ? 1.5 : B.H + .7, tw = B.W + .9, ax0 = nar ? -tw / 2 : -tw, az = nar ? -1.6 : -2.6, ad = 2.2;
      const bx0 = nar ? ax0 - .6 : ax0 + tw - .05, bw = nar ? tw + 1.2 : 3.9, bz = az - ad - (nar ? 1.6 : .2), bd = 2.2, bh = 2.45;
      base(F, R, ax0 - 1.0, bx0 + bw + 2.2, 1.6, bz - bd - 1.0);
      const A = K.box(R, ax0, ax0 + tw, az, az - ad, h, .06, .3, { lv: 1 });
      K.put(A.fr, B.group, .45, h - .38, -1);
      K.deco(A.fr, 0, h - .09, tw, h - .04, STONE2);
      K.deco(A.rt, .5, 1.0, 1.1, 2.0, GLASS); K.deco(A.rt, 1.35, 1.0, 1.95, 2.0, GLASS);
      const Bb = K.box(R, bx0, bx0 + bw, bz, bz - bd, bh, .14, .3, { lv: 3 });
      const gd = [[.3, 1.35], [1.5, 2.55], [2.85, bw - .3]];
      for (const [u0, u1] of gd) if (u1 - u0 > .3) { K.deco(Bb.fr, u0, 0, u1, 1.95, GLASS); K.ln(Bb.fr, [(u0 + u1) / 2, 0], [(u0 + u1) / 2, 1.95], .4); }
      K.deco(Bb.fr, 0, bh - .09, bw, bh - .04, STONE2);
      K.deco(Bb.rt, .4, .9, bd - .4, 1.9, GLASS);
      // Terrasse vor dem Hauptbau: Wände klappen hoch, die Plattenfläche hebt sich
      const tx0 = bx0 + (nar ? .1 : .05), tx1 = bx0 + bw, tz1 = bz, tz0 = nar ? az + .1 : az - .5, th = .3;
      K.box(R, tx0, tx1, tz0, tz1, th, .24, .22, { lv: 5, open: true });
      const TP = F.lift(R, th, .24, .22 * .55, { lv: 7 });
      F.poly(TP, [[tx0, tz0], [tx1, tz0], [tx1, tz1], [tx0, tz1]], STONE, .5);
      for (let x = tx0 + .45; x < tx1 - .05; x += .45) F.line(TP, [x, tz0], [x, tz1], .2);
      for (let z = tz0 - .45; z > tz1 + .05; z -= .45) F.line(TP, [tx0, z], [tx1, z], .2);
      // Treppe vor der Terrasse
      const sx0 = tx0 + (nar ? tw * .5 : .5), sw = .8;
      K.stairs(R, sx0, sx0 + sw, tz0 + .56, 2, th / 2, .28, .34, .24);
      // Pflaster im Läuferverband, Reihe für Reihe
      const px0 = nar ? ax0 + tw * .45 : tx0 - .3, px1 = tx1 + 1.0, rows = 4, cw = .5, ch = .27, pz0 = tz0 + .62 + rows * ch;
      for (let r = 0; r < rows; r++) {
        const za = pz0 - r * ch, t = .42 + .34 * (rows - 1 - r) / rows; let k = 0;
        for (let x = px0 - (r % 2) * cw / 2; x < px1 - .05; x += cw, k++) {
          const xa = Math.max(x, px0) + .015, xb = Math.min(x + cw, px1) - .015;
          if (xb - xa < .14) continue;
          K.box(R, xa, xb, za - .015, za - ch + .015, .07, t + (xa - px0) * .012, .1, { lv: (r + k) % 2 ? 9 : 11, col: (r * 3 + k) % 5 ? STONE : STONE2 });
        }
      }
      // Laptop auf der Terrasse mit der Produktseite, daneben ein Handy mit der Bestellung
      const lw = .92, ld = .52, lx = sx0 + sw + .2, lz = tz0 - .35;
      K.box(TP, lx, lx + lw, lz, lz - ld, .035, .6, .14, { lv: 2 });
      const LT = F.lift(TP, .035, .6, .08, { lv: 4 });
      F.poly(LT, [[lx, lz], [lx + lw, lz], [lx + lw, lz - ld], [lx, lz - ld]], PAPER, .5);
      for (let k = 0; k < 4; k++) F.line(LT, [lx + .07, lz - .12 - k * .07], [lx + lw - .07, lz - .12 - k * .07], .25);
      F.poly(LT, [[lx + lw * .38, lz - .04], [lx + lw * .62, lz - .04], [lx + lw * .62, lz - .1], [lx + lw * .38, lz - .1]], STONE, .3, .002);
      const sH = lw * .6, scr = K.panel(LT, [lx, lz - ld], [lx + lw, lz - ld], [0, -1], .66, .22, Q - .2, { lv: 6 });
      K.rect(scr, 0, 0, lw, sH, PAPER, .55); K.deco(scr, .03, .03, lw - .03, sH - .03, INK);
      K.put(scr, T.img("prod", lw - .07, sH - .07), .035, sH - .035, 1, .005);
      const pwid = .24, phgt = .45, phx = Math.min(lx + lw + .2, tx1 - .35);
      const PS = F.lift(TP, .02, .7, .1, { lv: 8 });
      const ph = K.panel(PS, [phx, lz - .3], [phx + pwid, lz - .3], [0, -1], .72, .2, Q - .25, { lv: 10 });
      K.rect(ph, 0, 0, pwid, phgt, PAPER, .55); K.deco(ph, .015, .03, pwid - .015, phgt - .03, INK);
      K.put(ph, T.img("order", pwid - .04, phgt - .07, [.02, 0, .389, 1]), .02, phgt - .035, 1, .005);
      // Palette mit Steinstapel
      if (!nar) {
        const qx = tx1 + .3, qz = bz + .2;
        K.box(R, qx, qx + .9, qz, qz - .7, .1, .48, .14, { lv: 13 });
        const QP = F.lift(R, .1, .48, .08, { lv: 15 });
        for (let k = 0; k < 4; k++) {
          const lf = k ? F.lift(QP, k * .11, .52 + k * .05, .1, { lv: 15 + k * 4 }) : QP;
          K.box(lf, qx + .03, qx + .87, qz - .03, qz - .67, .1, .52 + k * .05, .12, { lv: lf.lvl + 1, col: k % 2 ? STONE2 : STONE });
        }
      }
      F.line(R, [lx + lw / 2, tz0 + .01], [lx + lw / 2, pz0 + .25], .6, RED, .012);
    },
    thread: [[-4.2, 3.2], [-1.4, -1.9]], dot: 1,
    // dicht vor dem Laptopbildschirm vorbei, um die Terrassenecke herum
    out: c => [
      { u: .2, p: c.W(1.9, .95, -1.75), t: c.W(1.95, .62, -4.2) },
      { u: .38, p: c.W(5.4, 1.25, -3.3), t: c.W(4.4, 1.0, -9) },
      { u: .7, p: c.W2(4.8, 2.9, 7.0), t: c.W2(1.4, 1.3, -2.6) }
    ]
  },
  // ---------- 2 Betreuung und Absicherung ----------
  {
    id: "leistungen", topic: 2, mob: { x: .9, z: 2.6 }, place: { x: 8.5, z: -42, yaw: .14 },
    texts: { main: { def: { sec: "#leistungen", sel: "article", i: 0, head: 1 }, w: 27, nw: 21.5, headScale: 3.6 } },
    focus: "main", side: 1, yaw: 8, pitch: 8,
    build(F, K, o, T) {
      const R = F.root, nar = o.narrow, B = T.main;
      const Wh = B.W + .7, h = B.H + .75, x0 = nar ? -Wh / 2 : 0, zf = -2.6, zb = -5.0;
      base(F, R, x0 - 3.2, x0 + Wh + 1.8, 1.4, zb - 2.0);
      const hs = K.box(R, x0, x0 + Wh, zf, zb, h, .06, .32, { gable: .72, lv: 2 });
      K.put(hs.fr, B.group, .35, h - .22, -1);
      K.deco(hs.rt, .5, 0, 1.15, 1.7, DARK); K.deco(hs.rt, 1.45, 1.0, 2.0, 1.6, GLASS);
      K.deco(hs.lf, .5, 1.0, 1.05, 1.6, GLASS); K.deco(hs.lf, 1.4, 1.0, 1.95, 1.6, GLASS);
      K.box(R, x0 + Wh - .75, x0 + Wh - .45, zb + .8, zb + .5, h + .95, .3, .2, { lv: 6 });
      // Zaun rundum, Feld für Feld
      const X0 = x0 - 1.6, X1 = x0 + Wh + .6, Z0 = zf + .5, Z1 = zb - 1.0, gx = x0 + Wh / 2;
      const ring = [[[gx - .4, Z0], [X0, Z0]], [[X0, Z0], [X0, Z1]], [[X0, Z1], [X1, Z1]], [[X1, Z1], [X1, Z0]], [[X1, Z0], [gx + .4, Z0]]];
      const segs = [];
      for (const [a, b] of ring) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / .85)); for (let i = 0; i < n; i++) segs.push([[a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n], [a[0] + (b[0] - a[0]) * (i + 1) / n, a[1] + (b[1] - a[1]) * (i + 1) / n]]); }
      const cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
      segs.forEach(([a, b], k) => {
        const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
        let n = [-dz / L, dx / L]; if (n[0] * ((a[0] + b[0]) / 2 - cx) + n[1] * ((a[1] + b[1]) / 2 - cz) < 0) n = [-n[0], -n[1]];
        const f = K.panel(R, a, b, n, .32 + .46 * k / segs.length, .12, Q, { lv: 1 });
        for (let u = .04; u < L - .06; u += .2) K.rect(f, u, 0, u + .09, .46, PAPER, .45);
        K.rect(f, 0, .26, L, .32, PAPER, .4, .002);
      });
      F.line(R, [X0 + .25, Z0 - .25], [X0 + .25, Z1 + .25], .7, RED, .012);
      F.line(R, [X0 + .25, Z1 + .25], [X1 - .25, Z1 + .25], .7, RED, .012);
      // Ausguck an der vorderen Ecke
      const tx = X0 + .1, tz = Z1 + .1;
      const tw = K.box(R, tx - .32, tx + .32, tz + .32, tz - .32, 2.2, .5, .3, { gable: .45, lv: 4 });
      K.deco(tw.fr, .2, 1.6, .44, 1.95, RED); K.deco(tw.rt, .2, 1.6, .44, 1.95, GLASS);
      tree(K, R, X0 - .9, Z0 - 1.0, 1.6, .56);
    },
    thread: [[3.6, 3.0], [-.6, -1.6]], dot: 1,
    // links um den Zaun herum, am Ausguck vorbei
    out: c => [
      { u: .24, p: c.W(-2.9, 1.5, -.4), t: c.W(-2.0, 1.3, -6.5) },
      { u: .44, p: c.W(-3.0, 2.1, -6.4), t: c.W(-1.6, 1.5, -12) },
      { u: .72, p: c.W2(-.8, 3.0, 7.2), t: c.W2(-1.4, 1.2, -2.6) }
    ]
  },
  // ---------- 3 Modernisierung ----------
  {
    id: "modern", topic: 3, mob: { x: .2, z: 2.6 }, place: { x: 5.5, z: -63, yaw: .04 },
    texts: { main: { def: { sec: "#leistungen", sel: "article", i: 1 }, w: 27, nw: 21.5 } },
    focus: "main", side: -1, yaw: -8, pitch: 7,
    build(F, K, o, T) {
      const R = F.root, nar = o.narrow, B = T.main;
      const h = o.mobile ? 2.0 : B.H + .85, tw = B.W + .9, gw = nar ? 1.3 : 2.4, W = tw + gw, x0 = nar ? -tw / 2 : -tw, zf = -2.6, zb = -5.2;
      base(F, R, x0 - 1.0, x0 + W + 2.4, 1.6, zb - 1.6);
      // Weg zur Tür (die Adressen bleiben)
      const du0 = W - 1.0, du1 = W - .4, wx = x0 + (du0 + du1) / 2;
      F.poly(R, [[wx - .32, 1.4], [wx + .32, 1.4], [wx + .32, zf], [wx - .32, zf]], SHADE, .25);
      // altes Haus legt sich flach
      const old = K.box(R, x0 + .5, x0 + 3.5, zf - .35, zb + .35, 1.6, .03, .22, { gable: 1.2, col: OLD, back: [.33, .2], lv: 1 });
      K.deco(old.fr, 1.25, 0, 1.75, 1.05, DARK); K.deco(old.fr, .35, .7, .8, 1.15, SHADE); K.deco(old.fr, 2.2, .7, 2.65, 1.15, SHADE);
      // heutiger Bau richtet sich auf
      const nb = K.box(R, x0, x0 + W, zf, zb, h, .46, .4, { lv: 6, door: [du0, du1, 0, 2.0] });
      K.put(nb.fr, B.group, .45, h - .38, -1);
      if (!nar) {
        K.deco(nb.fr, tw + .1, .8, du0 - .25, h - .45, GLASS);
        for (let u = tw + .1 + .5; u < du0 - .3; u += .5) K.ln(nb.fr, [u, .8], [u, h - .45], .4);
      }
      K.deco(nb.fr, 0, h - .12, W, h - .05, DARK);
      K.deco(nb.rt, .4, .8, 2.2, h - .45, GLASS);
      // Briefkasten am Weg: die Adresse bleibt
      const mx = wx + .7, mz = .4;
      K.box(R, mx - .04, mx + .04, mz + .04, mz - .04, .75, .6, .2, { lv: 14 });
      const MP = F.lift(R, .75, .6, .12, { lv: 16 });
      K.box(MP, mx - .16, mx + .16, mz + .12, mz - .12, .22, .66, .14, { lv: 17, col: RED, roof: RED });
      tree(K, R, x0 + W + 1.3, zf - .6, 1.9, .7);
    },
    thread: [[-4.4, 3.0], [-1.0, -2.0]], dot: 1,
    // an der Fassade hinauf, über die Dachkante und über das Flachdach
    out: c => [
      { u: .2, p: c.W(-.9, 3.4, -1.3), t: c.W(-.6, 2.0, -9) },
      { u: .36, p: c.W(-.4, 3.1, -4.1), t: c.W(-.2, .6, -14) },
      { u: .7, p: c.W2(-2.4, 2.8, 6.8), t: c.W2(-1.6, 1.1, -2.2) }
    ]
  },
  // ---------- 4 Shops und Shop-Wechsel ----------
  {
    id: "shops", topic: 4, mob: { x: .1, z: 2.6 }, place: { x: 4, z: -84, yaw: -.04 },
    texts: {
      main: { def: { sec: "#leistungen", sel: "article", i: 2, skip: ["h3"] }, w: 27, nw: 21.5 },
      sign: { def: { sec: "#leistungen", sel: "article", i: 2, only: ["h3"] }, w: 40, nw: 30, h3Scale: 2.5 }
    },
    focus: "main", side: -1, yaw: -8, pitch: 8,
    build(F, K, o, T) {
      const R = F.root, nar = o.narrow, B = T.main, S = T.sign;
      // Palette mit großer Kiste: die Seitenfläche trägt den Text
      const cw = B.W + .5, chh = o.mobile ? 1.0 : B.H + .55, cx0 = nar ? -cw / 2 : -cw - .2, cz = nar ? -1.6 : -2.2, cd = 1.0;
      base(F, R, cx0 - 1.0, 4.6, 1.6, -6.6);
      K.box(R, cx0 - .06, cx0 + cw + .06, cz + .06, cz - cd - .06, .12, .06, .14, { lv: 1 });
      const CP = F.lift(R, .12, .06, .08, { lv: 3 });
      const cr = K.box(CP, cx0, cx0 + cw, cz, cz - cd, chh, .12, .34, { lv: 4 });
      K.put(cr.fr, B.group, .25, chh - .27, -1);
      K.deco(cr.fr, 0, .03, cw, .09, STONE2); K.deco(cr.fr, 0, chh - .09, cw, chh - .03, STONE2);
      for (const w of [cr.lf, cr.rt]) { K.deco(w, 0, .03, cd, .09, STONE2); K.deco(w, 0, chh - .09, cd, chh - .03, STONE2); K.ln(w, [.06, .09], [cd - .06, chh - .09], .35); }
      // Laden mit Schild und Markise
      const Ws = Math.max(S.W + .6, 2.9), hsh = 2.35, sx0 = nar ? -Ws / 2 : .25, sz = nar ? -4.8 : -3.4;
      const sh = K.box(R, sx0, sx0 + Ws, sz, sz - 1.9, hsh, .24, .34, { lv: 8 });
      K.put(sh.fr, S.group, (Ws - S.W) / 2, hsh - .12, -1);
      K.deco(sh.fr, .22, .25, Ws - 1.0, 1.45, GLASS); K.deco(sh.fr, Ws - .78, 0, Ws - .25, 1.5, DARK);
      for (let u = .22 + .6; u < Ws - 1.05; u += .6) K.ln(sh.fr, [u, .25], [u, 1.45], .35);
      const aw = K.panel(sh.fr, sh.fr.uv(0, 1.72), sh.fr.uv(Ws, 1.72), [0, 1], .56, .2, -2.05);
      const nS = Math.round(Ws / .3);
      for (let k = 0; k < nS; k++) K.rect(aw, k * Ws / nS, 0, (k + 1) * Ws / nS, .62, k % 2 ? PAPER : RED, .3);
      // Pakete in Formaten, die in keine Norm passen
      const P = [
        [.3, 2.3, -1.0, -1.42, .14, PAPER], [.5, 1.1, -1.7, -2.3, .62, PAPER], [1.35, 1.65, -1.65, -1.95, 1.15, PAPER],
        [1.9, 2.9, -1.6, -2.2, .38, STONE], [3.15, 3.6, -.9, -2.4, .22, PAPER], [2.55, 3.0, -2.5, -2.95, .86, STONE2]
      ];
      if (!nar) P.forEach(([a, b, c, d, hh, col], k) => {
        const bx = K.box(R, a, b, c, d, hh, .42 + k * .06, .2, { lv: 12 + 2 * k, col });
        if (hh > .3) K.ln(bx.fr, [(b - a) / 2, 0], [(b - a) / 2, hh], .5, RED);
      });
      F.line(R, [cx0 + cw + .1, cz - .5], [sx0 + .25, sz + .05], .6, RED, .012);
    },
    thread: [[-4.6, 3.4], [-.8, -1.0]], dot: 1,
    // zwischen Kiste und Paketen hindurch, hinter der Kiste vorbei
    out: c => [
      { u: .22, p: c.W(.05, 1.05, -.6), t: c.W(-.1, .9, -6) },
      { u: .4, p: c.W(-.9, 1.5, -4.6), t: c.W(-1.2, 1.1, -11) },
      { u: .72, p: c.W2(1.6, 3.0, 7.0), t: c.W2(1.0, 1.2, -2.6) }
    ]
  }
];

// ---------- vereinfachte Abschnitte (gleiches Prinzip: Text auf einer Wand des Modells) ----------
function simple(id, topic, def, place, opt = {}) {
  const sd = opt.side || 1;
  return {
    id, topic, place, texts: { main: { def, w: opt.w || 27, nw: 21.5, headScale: opt.headScale || 4.2 } },
    focus: "main", side: sd, yaw: sd * 8, pitch: 8, mob: { x: sd * -.6, z: 2.4 },
    build(F, K, o, T) {
      const R = F.root, B = T.main, nar = o.narrow;
      const Wb = B.W + .8, h = o.mobile ? 1.6 : B.H + .9, x0 = nar ? -Wb / 2 : (sd === -1 ? -Wb : 0);
      base(F, R, x0 - (sd > 0 ? 5 : 1.2), x0 + Wb + (sd > 0 ? 1.2 : 5), 1.6, -6.4);
      const b = K.box(R, x0, x0 + Wb, -2.6, -5.0, h, .06, .34, { lv: 1 });
      K.put(b.fr, B.group, .4, h - .4, -1);
      if (opt.extra) opt.extra(F, K, R, o, x0, Wb, h);
    },
    thread: [[sd * -2.4, 3], [sd * -1.4, -1.9]], dot: 1, passY: opt.passY
  };
}
// Modellteile neben der Textwand. sd = Textseite; die Teile stehen auf der Gegenseite (Richtung g = -sd).
const EX = {
  // 5 Schnittstellen: zwei Türme neben der Textwand, Zugbrücken klappen aus den Wänden und treffen sich, roter Datenweg darüber
  schnitt(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd, xa = g > 0 ? x0 + Wb : x0;
    const T1x = xa + g * 1.2, T2x = xa + g * 3.2, z0 = -3.0, z1 = -4.2;
    const T1 = K.box(R, Math.min(T1x, T1x + g * 1.0), Math.max(T1x, T1x + g * 1.0), z0, z1, 2.6, .2, .3, { lv: 3 });
    const T2 = K.box(R, Math.min(T2x, T2x + g * 1.0), Math.max(T2x, T2x + g * 1.0), z0 + .2, z1 + .2, 1.9, .26, .3, { lv: 5 });
    for (const T of [T1, T2]) for (let y = .5; y < T.h - .3; y += .55) K.deco(T.fr, .25, y, .75, y + .22, SHADE);
    const deck = (w, y, t0, len) => {
      const dk = K.panel(w, w.uv(.3, y), w.uv(.9, y), w.n, t0, .2, -Q);
      K.rect(dk, 0, 0, .6, len); K.ln(dk, [.3, 0], [.3, len], .8, RED);
      for (const u of [0, .6]) { const rl = K.panel(dk, dk.uv(u, 0), dk.uv(u, len), u ? dk.dir : [-dk.dir[0], -dk.dir[1]], t0 + .14, .12); K.rect(rl, 0, 0, len, .2, PAPER, .45); }
    };
    const near = g > 0 ? T1.lf : T1.rt, far = g > 0 ? T1.rt : T1.lf, t2n = g > 0 ? T2.lf : T2.rt;
    deck(near, 1.7, .5, .6); deck(far, 1.3, .56, .5); deck(t2n, 1.3, .62, .5);
  },
  // 6 Gestaltung: goldener Schnitt als Schachtelfolge, die rote Spirale läuft über die Deckel
  gestalt(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd, Wr = 2.7, Hr = Wr / 1.618, xl0 = g > 0 ? x0 + Wb + .9 : x0 - .9 - Wr, z0 = -3.0;
    F.poly(R, [[xl0, z0], [xl0 + Wr, z0], [xl0 + Wr, z0 - Hr], [xl0, z0 - Hr]], PAPER, .5, .002);
    let xl = xl0, xr = xl0 + Wr, yb = 0, yt = Hr; const sq = [];
    for (let k = 0; k < 7; k++) {
      const ph = k % 4, w2 = xr - xl, h2 = yt - yb;
      if (ph === 0) { const s = h2; sq.push([xl, xl + s, yb, yt, s, [xl + s, yt], PI, 1.5 * PI]); xl += s; }
      else if (ph === 1) { const s = w2; sq.push([xl, xr, yb, yb + s, s, [xl, yb + s], 1.5 * PI, 2 * PI]); yb += s; }
      else if (ph === 2) { const s = h2; sq.push([xr - s, xr, yb, yt, s, [xr - s, yb], 0, .5 * PI]); xr -= s; }
      else { const s = w2; sq.push([xl, xr, yt - s, yt, s, [xr, yt - s], .5 * PI, PI]); yt -= s; }
    }
    sq.forEach(([xa, xb, ya, yb2, s, c, a0, a1], k) => {
      const hh = Math.max(.12, s * .45);
      const bx = K.box(R, xa + .015, xb - .015, z0 - ya - .015, z0 - yb2 + .015, hh, .14 + k * .08, .22, { lv: 2 + 2 * k });
      const pts = []; for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * i / 12; pts.push(K.lidPt(bx, c[0] + Math.cos(a) * s, z0 - (c[1] + Math.sin(a) * s))); }
      for (let i = 1; i < pts.length; i++) for (const dy of [.004, -.004]) F.line(bx.top, pts[i - 1], pts[i], 1, RED, dy);
    });
  },
  // 7 WBG Pooling: Produkt faltet sich auf dem Drehteller und dreht sich mit dem Scroll einmal herum
  weitere(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd, c = [g > 0 ? x0 + Wb + 1.9 : x0 - 1.9, -2.2];
    const sp = F.spin(R, c, -2 * PI, .36, .64, { lv: 3 });
    F.poly(sp, circle(c[0], c[1], 1.35, 36), SHADE, .5);
    for (let k = 0; k < 12; k++) { const a = k * PI / 6; F.line(sp, [c[0] + Math.cos(a) * .8, c[1] + Math.sin(a) * .8], [c[0] + Math.cos(a) * 1.28, c[1] + Math.sin(a) * 1.28], .4); }
    const pb = K.box(sp, c[0] - .5, c[0] + .5, c[1] + .45, c[1] - .45, .75, .16, .26, { lv: 5 });
    K.deco(pb.fr, .2, .2, .8, .34, RED);
    K.box(sp, c[0] + .6, c[0] + .95, c[1] + .2, c[1] - .15, .38, .24, .2, { lv: 9 });
    // Tor im geschützten Bereich: zwei Pfeiler mit Sturz
    const gx = g > 0 ? x0 + Wb + .3 : x0 - 1.5;
    K.box(R, gx, gx + .2, -2.8, -3.0, 2.0, .1, .26, { lv: 12 }); K.box(R, gx + 1.0, gx + 1.2, -2.8, -3.0, 2.0, .12, .26, { lv: 14 });
    const L = F.lift(R, 2.0, .16, .2, { lv: 16 }); K.box(L, gx, gx + 1.2, -2.78, -3.02, .2, .2, .2, { lv: 17 });
  },
  // 8 Take the Gloves Off: Plakatfolge auf einem Podest, jedes Format mit eigenem Zeichen
  gloves(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd, px = g > 0 ? x0 + Wb + .5 : x0 - .5 - 3.6;
    K.box(R, px, px + 3.6, -2.2, -3.2, .3, .08, .24, { lv: 2 });
    const L = F.lift(R, .3, .08, .14, { lv: 4 });
    const P1 = K.panel(L, [px + .2, -2.9], [px + 1.2, -2.9], [0, -1], .26, .24, Q, { lv: 6 }); K.rect(P1, 0, 0, 1, 1.4); K.decoP(P1, circle(.5, .85, .3, 24), RED);
    const P2 = K.panel(L, [px + 1.35, -3.1], [px + 2.45, -3.1], [0, -1], .34, .24, Q, { lv: 8 }); K.rect(P2, 0, 0, 1.1, 1.8); K.decoP(P2, [[.2, .5], [.9, .5], [.55, 1.35]], DARK); K.deco(P2, .2, .22, .9, .3, RED);
    const P3 = K.panel(L, [px + 2.6, -2.9], [px + 3.4, -2.9], [0, -1], .42, .24, Q, { lv: 10 }); K.rect(P3, 0, 0, .8, 1.15); for (let k = 0; k < 3; k++) K.deco(P3, .15, .25 + k * .25, .65 - k * .14, .38 + k * .25, k ? DARK : RED);
  },
  // 9 Außerdem: eine Straße kleiner, verschiedener Häuser, eins nach dem anderen
  also(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd, x = g > 0 ? x0 + Wb + .6 : x0 - .6;
    F.poly(R, [[x + g * 1.3, 1.2], [x + g * 1.9, 1.2], [x + g * 1.9, -9], [x + g * 1.3, -9]], SHADE, .2, .002);
    const H = [[0, .9, -1.6, 1.3, .8], [0, 1.1, -3.2, 1.7, 0], [2.0, .8, -1.4, 1.0, .7], [2.1, 1.0, -3.0, 1.5, .6], [0, .9, -5.0, 2.2, .7], [2.0, 1.2, -5.0, 1.2, 0]];
    H.forEach(([dx, w, z, hh, gb], k) => {
      const xa = g > 0 ? x + dx : x - dx - w;
      const hs = K.box(R, xa, xa + w, z, z - .9, hh, .08 + k * .1, .26, { gable: gb, lv: 2 + 3 * k });
      K.deco(hs.fr, w * .55, 0, w * .55 + .25, .6, DARK); K.deco(hs.fr, .15, hh * .5, .4, hh * .5 + .25, k % 3 ? SHADE : RED);
    });
  },
  // 10 Wie ich arbeite: ein Plan am Boden, seine Wände richten sich auf
  arbeitsweise(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd, bx = g > 0 ? x0 + Wb + .5 : x0 - .5 - 3.8, hh = 1.1, z0 = -1.2;
    F.poly(R, [[bx, z0], [bx + 3.8, z0], [bx + 3.8, z0 - 3.6], [bx, z0 - 3.6]], PAPER, .45);
    for (let x = bx + .2; x < bx + 3.7; x += .4) F.line(R, [x, z0 - .1], [x + .25, z0 - 3.5], .08);
    const W = [[0, 0, 1.4, 0, hh * .6], [2.0, 0, 3.8, 0, hh * .6], [3.8, 0, 3.8, -3.6, hh], [3.8, -3.6, 0, -3.6, hh], [0, -3.6, 0, 0, hh], [0, -1.8, 1.6, -1.8, hh * .8], [2.4, -1.8, 3.8, -1.8, hh * .8], [1.9, -1.8, 1.9, -3.6, hh * .8]];
    W.forEach(([a, b, c, d, wh], i) => {
      const A = [bx + a, z0 + b], B = [bx + c, z0 + d];
      F.line(R, A, B, .8, INK, .003);
      const dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz); let n = [-dz / L, dx / L];
      if (i < 5 && n[0] * ((A[0] + B[0]) / 2 - (bx + 1.9)) + n[1] * ((A[1] + B[1]) / 2 - (z0 - 1.8)) < 0) n = [-n[0], -n[1]];
      const wl = K.panel(R, A, B, n, .2 + i * .065, .2, Q, { lv: 1 + i });
      K.rect(wl, 0, 0, L, wh);
      if (L > 2) K.deco(wl, L * .35, wh * .4, L * .35 + .5, wh * .4 + .35, SHADE);
    });
    F.line(R, [bx + 1.45, z0 + .05], [bx + 1.95, z0 + .05], 1, RED, .004);
  },
  // 11/12 Werdegang: ein Weg mit Stationen, jede faltet sich aufwendiger als die vorige
  werdegang(F, K, R, o, x0, Wb, h, sd, second) {
    const g = -sd, x = g > 0 ? x0 + Wb + .9 : x0 - .9;
    F.poly(R, [[x - .5, 1.4], [x + .5, 1.4], [x + .5, -8], [x - .5, -8]], BASE, .4);
    const st = second ? [[-4.8, 5], [-6.4, 6], [-8.0, 7], [-9.6, 8]] : [[-1.0, 1], [-2.4, 2], [-3.8, 3], [-5.2, 4]];
    st.forEach(([z, lvl], k) => {
      const t = .1 + k * .16, xx = x + g * 1.2;
      const w = .5 + lvl * .06, hh = .4 + lvl * .28;
      const b = K.box(R, Math.min(xx, xx + g * w), Math.max(xx, xx + g * w), z + w / 2, z - w / 2, hh, t, .22, { gable: lvl > 2 ? .3 + lvl * .03 : 0, lv: 2 + 3 * k, roof: lvl === 8 ? RED : PAPER });
      for (let v = .3; v < hh - .25; v += .4) K.deco(b.fr, w * .3, v, w * .7, v + .2, SHADE);
    });
  },
  // 13 Stimme 1 (Wirkungsbericht): ein Leporello richtet sich auf und entfaltet Seite für Seite
  stimmen(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd, Lp = .8, hh = 1.5, n = 6, a = 52 * PI / 180, xs = g > 0 ? x0 + Wb + .6 : x0 - .6 - Lp;
    const p0 = K.panel(R, [xs, -2.6], [xs + Lp, -2.6], [0, -1], .06, .22, Q, { lv: 1 });
    let prev = p0;
    for (let k = 0; k < n; k++) {
      const hingeU = (g > 0) === (k % 2 === 1) ? Lp : 0;
      const nd = k === 0 ? p0 : F.hinge(prev, p0.uv(k % 2 ? Lp : 0, 0), p0.uv(k % 2 ? Lp : 0, hh), p0.uv(Lp / 2, hh / 2), (g > 0 ? 1 : -1) * (PI - a), .24 + .56 * (k - 1) / (n - 1), .2, { lv: prev.lvl + 1 });
      nd.uv = p0.uv; K.rect(nd, 0, 0, Lp, hh, PAPER, .5);
      if (k === 2) for (let j = 0; j < 4; j++) K.deco(nd, .12 + j * .15, .2, .22 + j * .15, .4 + j * .2, j === 3 ? RED : DARK);
      for (let j = 0; j < 4; j++) { const v = hh - .25 - j * .16; if (k !== 2 || v > 1.1) K.ln(nd, [.1, v], [Lp - .1 - (j % 2) * .2, v], .4); }
      prev = nd;
    }
  },
  // 14 Stimme 2 (der letzte Schliff): ein Faltfächer steht auf und öffnet sich zum Halbrund
  stimme2(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd, c = [g > 0 ? x0 + Wb + 2.0 : x0 - 2.0, -3.2], Rr = 1.6, N = 13, dl = PI / N;
    const fan = F.hinge(R, [c[0] - 1, c[1]], [c[0] + 1, c[1]], [c[0], c[1] + 1], Q, .06, .28, { lv: 1 });
    for (let k = 0; k < N; k++) {
      const sp = F.spin(fan, c, -k * (PI - dl) / (N - 1), .32, .52, { lv: 2 + k });
      const p = a => [c[0] + Math.cos(a) * Rr, c[1] + Math.sin(a) * Rr], q = a => [c[0] + Math.cos(a) * .25, c[1] + Math.sin(a) * .25];
      F.poly(sp, [q(0), p(0), p(dl * 1.06), q(dl * 1.06)], k === (N - 1) / 2 ? RED : (k % 2 ? SHADE : PAPER), .45);
    }
    F.poly(fan, circle(c[0], c[1], .28, 16), DARK, .5, -2 * .006);
  },
  // 15 Für Agenturen: eine Reihe gleicher Bauten mit einer Lücke; das neue Teil faltet sich passgenau hinein
  agenturen(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd;
    for (let i = 0; i < 4; i++) {
      const xa = g > 0 ? x0 + Wb + .4 + i * 1.05 : x0 - .4 - (i + 1) * 1.05, nw = i === 2;
      const b = K.box(R, xa, xa + 1.0, -1.6, -3.0, 1.1, nw ? .56 : .06 + .08 * i, nw ? .36 : .3, { gable: .6, lv: 1 + 3 * i, roof: nw ? RED : PAPER });
      K.deco(b.fr, .38, 0, .62, .6, DARK);
    }
  },
  // 16 Kontakt: Haus, dessen rote Tür aufschwingt; die rote Linie endet an der Tür
  kontakt(F, K, R, o, x0, Wb, h, sd) {
    const g = -sd, W = 2.4, hx = g > 0 ? x0 + Wb + .6 : x0 - .6 - W, zf = -1.8, zb = -3.8, hh = 1.6, du0 = W / 2 - .3, du1 = W / 2 + .3, dh = 1.15;
    const hs = K.box(R, hx, hx + W, zf, zb, hh, .08, .44, { gable: 1.0, door: [du0, du1, .12, .12 + dh], lv: 2 });
    K.deco(hs.bk, du0, 0, du1, .12 + dh, DARK);
    for (const u of [.3, W - .75]) K.deco(hs.fr, u, .7, u + .45, 1.2, GLASS);
    const dr = F.hinge(hs.fr, hs.fr.uv(du1, .12), hs.fr.uv(du1, .12 + dh), hs.fr.uv(W / 2, .6), .8, .64, .26);
    dr.uv = hs.fr.uv; K.rect(dr, du0 + .02, .12, du1, .12 + dh, RED, .6);
    K.stairs(R, hx + du0 - .1, hx + du1 + .1, zf + .3, 1, .12, .3, .5, .16);
  }
};
const SIMPLE = [
  ["schnitt", 5, { sec: "#leistungen", sel: "article", i: 3 }, { x: 6, z: -105, yaw: .05 }, { side: 1 }],
  ["gestalt", 6, { sec: "#leistungen", sel: "article", i: 4 }, { x: 2, z: -126, yaw: -.05 }, { side: -1 }],
  ["weitere", 7, { sec: "#weitere", sel: ".panel", i: 0, head: 1 }, { x: 6, z: -147, yaw: .05 }, { side: 1 }],
  ["gloves", 7, { sec: "#weitere", sel: ".panel", i: 1 }, { x: 2, z: -168, yaw: -.05 }, { side: -1 }],
  ["also", 7, { sec: "#weitere", sel: ".panel", i: 2 }, { x: 6, z: -189, yaw: .05 }, { side: 1 }],
  ["arbeitsweise", 8, { sec: "#arbeitsweise", sel: ".panel", head: 1, big: 1 }, { x: 2, z: -210, yaw: -.05 }, { side: -1, w: 28 }],
  ["werdegang", 9, { sec: "#werdegang", sel: ".panel", head: 1, rows: [0, 4] }, { x: 6, z: -231, yaw: .05 }, { side: 1, w: 30 }],
  ["werdegang2", 9, { sec: "#werdegang", sel: ".panel", rows: [4, 8] }, { x: 2, z: -252, yaw: -.05 }, { side: -1, w: 30, ex: "werdegang", second: 1, passY: 5.6 }],
  ["stimmen", 10, { sec: "#stimmen", sel: "blockquote", i: 0, head: 1 }, { x: 6, z: -273, yaw: .05 }, { side: 1 }],
  ["stimme2", 10, { sec: "#stimmen", sel: "blockquote", i: 1 }, { x: 2, z: -294, yaw: -.05 }, { side: -1 }],
  ["agenturen", 11, { sec: "#agenturen", sel: ".panel", head: 1 }, { x: 6, z: -315, yaw: .05 }, { side: 1 }],
  ["kontakt", 12, { sec: "#kontakt", sel: ".panel", head: 1, foot: 1 }, { x: 4, z: -336, yaw: 0 }, { side: -1, headScale: 2.6, last: 1 }]
];
for (const [id, topic, def, place, opt] of SIMPLE) {
  const ex = EX[opt.ex || id];
  STATIONS.push(simple(id, topic, def, place, { ...opt, extra: (F, K, R, o, x0, Wb, h) => ex(F, K, R, o, x0, Wb, h, opt.side, opt.second) }));
}
export const SECTION_STOP = { start: 0, arbeit: 1, leistungen: 2, weitere: 7, arbeitsweise: 10, werdegang: 11, stimmen: 13, agenturen: 15, kontakt: 16 };
