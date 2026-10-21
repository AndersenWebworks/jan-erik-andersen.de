// Die drei Pop-up-Modelle. Koordinaten: x nach rechts, z nach unten auf dem Blatt (-z = Blatt oben), y = Blattnormale zum Betrachter.
// Der Faltzustand s läuft von 0 bis 1; jeder Knoten hat sein eigenes Zeitfenster (t0, Dauer d).
import { Model, kit, COL } from "./faltwerk.js";

const PI = Math.PI, Q = PI / 2;
const { W, BASE, OLD, SHADE, MID, DARK, RED, INK, PALE } = COL;

// ---------- 1 Einstieg: Haus mit Fenstern, Dachfalz, Tür; zwei Nachbarbauten, Stege mit Geländer; zuletzt wird die Tür rot ----------
function einstieg(F, K) {
  const R = F.root;
  // Haus
  const hx0 = -1.45, hx1 = 1.45, hz0 = 1.0, hz1 = -.9, hh = 1.5, hw = hx1 - hx0;
  const hs = K.box(R, hx0, hx1, hz0, hz1, hh, .02, .3, { gable: 1.0, lv: 1, ov: .16 });
  const fr = hs.fr;
  for (const u of [.3, 2.0]) {
    K.deco(fr, u, .72, u + .6, 1.42, SHADE, .6);
    K.ln(fr, [u + .3, .72], [u + .3, 1.42], .5); K.ln(fr, [u, 1.07], [u + .6, 1.07], .5);
  }
  K.deco(fr, 1.15, 0, 1.75, 1.18, OLD, .65);
  K.decoP(fr, K.circle(1.6, .58, .035, 8), DARK);
  K.decoP(fr, K.circle(hw / 2, 1.75, .18, 18), SHADE, .6);
  K.ln(fr, [hw / 2, 1.57], [hw / 2, 1.93], .4); K.ln(fr, [hw / 2 - .18, 1.75], [hw / 2 + .18, 1.75], .4);
  // Fenster in den Seitenwänden
  for (const w of [hs.lf, hs.rt]) for (const u of [.45, 1.45]) { K.deco(w, u, .72, u + .5, 1.34, SHADE, .55); K.ln(w, [u + .25, .72], [u + .25, 1.34], .45); }
  // Dach: Ziegelreihen, Dachfalz entlang des Firsts
  for (const r of hs.roofs) {
    const S = Math.hypot(hw / 2, 1.0);
    for (let v = .3; v < S - .1; v += .28) K.ln(r, [-.1, v], [hs.D + .1, v], .22);
    K.deco(r, -.16, S - .14, hs.D + .16, S, SHADE, .6);
  }
  // Stufe vor der Tür
  K.box(R, -.5, .5, 1.55, 1.1, .13, .3, .1, { lv: 1 });

  // Nachbar links: hoher Turm mit Fensterreihen
  const nl = K.box(R, -4.2, -2.8, .5, -.7, 2.5, .24, .22, { lv: 2 });
  for (let k = 0; k < 4; k++) for (const u of [.22, .78]) K.deco(nl.fr, u, .32 + k * .52, u + .4, .62 + k * .52, SHADE, .5);
  K.deco(nl.fr, .5, 0, .9, .2, MID, .5);
  for (let k = 0; k < 5; k++) K.ln(nl.top, [.12, .12 + k * .26], [1.28, .12 + k * .26], .3);
  // Nachbar rechts: breite Halle mit Streifen
  const nr = K.box(R, 2.75, 4.2, .85, -.75, 1.35, .3, .22, { lv: 2 });
  for (let k = 0; k < 4; k++) K.deco(nr.fr, .15 + k * .33, .25, .38 + k * .33, 1.0, SHADE, .5);
  K.deco(nr.fr, .15, 1.15, 1.3, 1.3, MID, .5);
  for (let k = 1; k < 6; k++) K.ln(nr.top, [k * .24, .1], [k * .24, 1.7], .3);

  // Stege mit Geländer
  const bridge = (x0, x1, t0) => {
    const b = K.box(R, x0, x1, .4, -.2, 1.05, t0, .15, { sides: false, lv: 4 });
    const L = x1 - x0, D = .6;
    for (const side of [0, 1]) {
      const v = side ? D : 0, n = side ? [0, -1] : [0, 1];
      const rl = K.panel(b.top, b.top.uv(0, v), b.top.uv(L, v), n, t0 + .13, .08, -Q);
      K.ln(rl, [0, .0], [L, .0], .5); K.ln(rl, [0, .3], [L, .3], .65); K.ln(rl, [0, .15], [L, .15], .3);
      for (let u = 0; u <= L + .01; u += .15) K.ln(rl, [Math.min(u, L), 0], [Math.min(u, L), .3], u < .01 || u > L - .01 ? .65 : .35);
    }
    K.grid(b.top, 0, 0, L, D, 8, 1, .25);
    return b;
  };
  bridge(-2.8, -1.45, .46);
  bridge(1.45, 2.75, .52);

  // Tür wird rot
  const door = F.still(fr, .86, .1, { lv: fr.lvl });
  door.uv = fr.uv;
  K.rect(door, 1.15, 0, 1.75, 1.18, RED, .9, -.0055);
  K.rect(door, 1.15, 0, 1.75, 1.18, RED, .9, .0055);
  const knob = F.still(fr, .9, .06, { lv: fr.lvl }); knob.uv = fr.uv;
  F.poly(knob, K.circle(1.6, .58, .035, 8).map(q => fr.uv(q[0], q[1])), W, .6, -.0075);
}

// ---------- 2 Gerwing ----------
function gerwing(F, K) {
  const R = F.root;
  // (a) Fläche wird umrissen
  const ax0 = -4.0, cw = .64, nc = 6, ax1 = ax0 + cw * nc, az0 = -4.35, rh = .5, az1 = az0 + rh * 5.5, mg = .14;
  const o1 = F.still(R, .0, .05, { lv: 1 });
  F.poly(o1, [[ax0 - mg, az0 - mg], [ax1 + mg, az0 - mg], [ax1 + mg, az1], [ax0 - mg, az1]], BASE, .8, 0, INK);
  for (const [x, z, dx, dz] of [[ax0 - mg, az0 - mg, 1, 1], [ax1 + mg, az0 - mg, -1, 1], [ax1 + mg, az1, -1, -1], [ax0 - mg, az1, 1, -1]]) {
    F.line(o1, [x, z], [x + dx * .3, z], 1, INK, .004); F.line(o1, [x, z], [x, z + dz * .3], 1, INK, .004);
  }
  F.line(o1, [ax0 - mg, az1], [ax1 + mg, az1], 1, INK, .2); // die Kontur läuft über die Steine, die letzte Reihe ragt darüber hinaus
  // (b) Reihe für Reihe in ganze Steine, die letzte Reihe ragt über die Kontur und ist rot
  for (let r = 0; r < 6; r++) {
    const za = az0 + rh * (r + 1), zb = za - rh, last = r === 5;
    let k = 0;
    for (let x = ax0; x < ax1 - .1; x += cw, k++) {
      const xa = x + .02, xb = x + cw - .02;
      K.box(R, xa, xb, za - .02, zb + .02, .17, .06 + r * .045 + (xa - ax0) * .006, .1, { lv: 2 + ((r + k) % 2) * 2, e: last ? .95 : .5, ecol: last ? RED : INK, col: (r * 3 + k) % 5 === 0 ? OLD : W });
    }
  }
  // (c) Terrasse mit Platten und Treppe
  const tx0 = 1.45, tx1 = 4.15, tz0 = -2.8, tz1 = -4.55, th = .8;
  const dk = K.box(R, tx0, tx1, tz0, tz1, th, .3, .24, { lv: 1 });
  K.grid(dk.top, 0, 0, tx1 - tx0, tz0 - tz1, 4, 3, .35, true);
  for (const w of [dk.fr, dk.lf, dk.rt]) K.ln(w, [0, th - .1], [w.L, th - .1], .3);
  for (let u = .3; u < (tx1 - tx0) - .2; u += .45) K.ln(dk.fr, [u, 0], [u, th - .1], .18);
  K.stairs(R, 2.15, 3.45, tz0 + 1.6, 4, .2, .4, .4, .22, -1, W, .65);

  // (d) Steinstapel auf einer Palette mit Lattung (Gewicht)
  const px0 = -4.1, px1 = -1.85, pz0 = .95, pz1 = -.45;
  const pal = K.box(R, px0, px1, pz0, pz1, .46, .5, .22, { lv: 1, through: true, holes: [[.2, .75, 0, .3], [1.5, 2.05, 0, .3]] });
  for (let u = .0; u < px1 - px0; u += .34) K.ln(pal.top, [u, 0], [u, pz0 - pz1], .4);
  const sx0 = pal.top.uv(.18, .14), sx1 = pal.top.uv(px1 - px0 - .18, pz0 - pz1 - .14);
  const stk = K.box(pal.top, Math.min(sx0[0], sx1[0]), Math.max(sx0[0], sx1[0]), Math.max(sx0[1], sx1[1]), Math.min(sx0[1], sx1[1]), .95, .6, .18, { sg: -1, lv: 1 });
  for (const w of [stk.fr, stk.bk]) K.brick(w, 0, 0, stk.W, stk.h, .5, .16, .35);
  for (const w of [stk.lf, stk.rt]) K.brick(w, 0, 0, stk.D, stk.h, .45, .16, .35);
  K.brick(stk.top, 0, 0, stk.W, stk.D, .5, .22, .3);

  // (e) Fracht nach Postleitzahl: rote Linie von der Palette zu einem von drei Händlern
  const hallX0 = 2.7, hallX1 = 4.2;
  const hallZ = [[-.95, -.35], [-.05, .55], [.85, 1.45]];
  hallZ.forEach(([z1, z0], i) => {
    const hl = K.box(R, hallX0, hallX1, z0, z1, .5, .62 + i * .06, .16, { lv: 2 });
    // Lagerhalle: flaches Dach mit Dachkante, zwei Rolltore, Seitenwand mit Fensterband
    for (const w of [hl.lf, hl.rt]) { K.deco(w, .08, .28, z0 - z1 - .08, .4, SHADE, .5); }
    K.deco(hl.fr, .14, 0, .62, .32, MID, .55); K.deco(hl.fr, .88, 0, 1.36, .32, MID, .55);
    for (let k = 1; k < 5; k++) { K.ln(hl.fr, [.14, k * .064], [.62, k * .064], .3); K.ln(hl.fr, [.88, k * .064], [1.36, k * .064], .3); }
    K.rect(hl.top, .07, .07, hallX1 - hallX0 - .07, z0 - z1 - .07, W, .35, 0);
    for (let k = 1; k < 5; k++) K.ln(hl.top, [k * .3, .07], [k * .3, z0 - z1 - .07], .2);
  });
  // Weiche: Haarlinien zu den beiden anderen Händlern, rot zum zuständigen
  const ry = (hallZ[1][0] + hallZ[1][1]) / 2, jx = -.25;
  const hz = hallZ.map(([a, b]) => (a + b) / 2);
  const wire = (pts, t0, dd, red) => {
    for (let i = 1; i < pts.length; i++) {
      const nd = F.still(R, t0 + dd * (i - 1) / (pts.length - 1), dd / (pts.length - 1), { lv: 3 });
      const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l * (red ? .03 : 0), nz = dx / l * (red ? .03 : 0);
      if (red) F.poly(nd, [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]], RED, 0, .003);
      else F.line(nd, a, b, .6, INK, .003);
    }
  };
  wire([[px1 + .05, ry], [jx, ry]], .72, .05, false);
  wire([[jx, ry], [1.2, hz[0]], [hallX0 - .02, hz[0]]], .74, .08, false);
  wire([[jx, ry], [1.2, hz[2]], [hallX0 - .02, hz[2]]], .74, .08, false);
  wire([[px1 + .05, ry], [jx, ry], [hallX0 - .02, ry]], .76, .16, true);
  const knot = F.still(R, .76, .02, { lv: 3 });
  F.poly(knot, K.circle(jx, ry, .08, 12), RED, 0, .004);

  // Laptop und Handy mit den echten Shopbildern
  const lw = 5.14, lh = lw / 2.16 + .12;
  const lap = K.box(R, -4.25, -4.25 + lw, 1.8 + lh, 1.8, .52, .56, .24, { lv: 1, e: .85 });
  K.tex(lap.top, .12, .06, lw - .12, lh - .06, "prod", [0, 1, 1, 0]);
  const kb = K.box(R, -4.5, -4.25 + lw + .25, 1.8 + lh + .5, 1.8 + lh + .05, .1, .7, .18, { lv: 1, e: .7 });
  for (let k = 1; k < 3; k++) K.ln(kb.top, [.2, k * .15], [lw + .3, k * .15], .3);
  K.rect(kb.top, lw / 2 - .4, .06, lw / 2 + .8, .16, SHADE, 0, -.003);
  const phw = 2.5, phh = 1.78;
  const ph = K.box(R, 1.7, 1.7 + phw, 2.7 + phh, 2.7, .3, .64, .2, { lv: 1, e: .85 });
  K.tex(ph.top, .26, .09, phw - .09, phh - .09, "order", [0, 1, 1, 0]);
  K.decoP(ph.top, K.circle(.13, phh / 2, .04, 10), DARK);
  K.rect(ph.top, .07, phh / 2 - .35, .19, phh / 2 + .35, SHADE, 0, -.003);
}

// ---------- 3 Shops und Shop-Wechsel ----------
function shops(F, K) {
  const R = F.root, FL = OLD;
  const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const outline = (nd, x0, z0, x1, z1, w, col, dy) => { const c = rect(x0, z0, x1, z1); for (let i = 0; i < 4; i++) F.line(nd, c[i], c[(i + 1) % 4], w, col, dy); };

  // ----- links: Standard (Shopify) -----
  // Preisschild, flach auf dem Blatt, darunter der Gebührenstapel, der Stufe für Stufe wächst
  const tag = F.still(R, .02, .06, { lv: 1 });
  F.poly(tag, [[-4.35, -4.0], [-4.35, -4.5], [-4.1, -4.74], [-3.25, -4.74], [-3.25, -4.0]], W, .85);
  F.poly(tag, K.circle(-4.09, -4.4, .06, 10), BASE, .8, .002);
  for (let k = 0; k < 3; k++) F.line(tag, [-3.9, -4.56 + k * .14], [-3.9 + (k === 2 ? 0.3 : 0.55), -4.56 + k * .14], .45, INK, .003);
  const hts = [.3, .62, .98, 1.4];
  hts.forEach((h, i) => {
    const b = K.box(R, -4.4 + i * .66, -4.4 + (i + 1) * .66 - .04, -2.45, -3.65, h, .06 + i * .075, .13, { lv: 1 + i * 2, floor: i ? undefined : undefined });
    for (let k = 1; k < Math.floor(h / .2); k++) K.ln(b.fr, [0, k * .2], [b.W, k * .2], .25);
  });
  // Standardregal mit gleichförmigen Fächern
  const sx = -4.4, sw = .9, sz = -1.9, sr = 1.1;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
    K.box(R, sx + c * sw + .012, sx + (c + 1) * sw - .012, sz + (r + 1) * sr - .012, sz + r * sr + .012, .62, .14 + r * .05 + c * .02, .12, { lv: 1 + c + r, open: true, e: .6, floor: FL });

  // ----- rechts: nach Maß (WooCommerce) -----
  const rx = 1.7;
  const cells = [[0, -4.7, 1.2, -3.3], [1.2, -4.7, 2.7, -3.3], [0, -3.3, .8, -1.9], [.8, -3.3, 1.9, -1.9], [1.9, -3.3, 2.7, -1.9]];
  cells.forEach(([a, z1, c, z0], i) => K.box(R, rx + a + .012, rx + c - .012, z0 - .012, z1 + .012, .62, .3 + i * .035, .12, { lv: 1 + i, open: true, e: .6, floor: FL }));
  // Fach in Flächenform und Fach für schweres Gut
  const fx0 = rx + .012, fx1 = rx + 2.688;
  K.box(R, fx0, fx1, -.55, -1.65, .62, .44, .12, { lv: 8, open: true, e: .7, floor: FL });
  K.box(R, fx0, fx1, 1.35, -.25, .95, .48, .13, { lv: 10, open: true, e: .9, floor: FL });
  K.box(R, fx0 + .1, fx1 - .1, 1.25, -.15, .95, .5, .13, { lv: 12, open: true, e: .35 });
  const hv = F.still(R, .56, .06, { lv: 13 });
  F.poly(hv, [[2.7, .75], [3.7, .75], [3.55, .35], [2.85, .35]], SHADE, .8, .004);
  F.poly(hv, K.circle(3.2, .55, .09, 10), W, .8, .006);

  // ----- Brücke zwischen den Regalen -----
  const br = K.box(R, -1.5, 1.7, .0, -.5, .62, .54, .12, { sides: false, lv: 4, e: .7 });
  K.grid(br.top, 0, 0, 3.2, .5, 12, 1, .3);

  // ----- Waage: Rechnung vorher -----
  const wz = 4.5;
  K.box(R, -.55, .55, wz + .1, wz - .22, .1, .5, .1, { lv: 1 });
  const pil = K.panel(R, [-1.3, wz], [1.3, wz], [0, -1], .52, .12, Q, { lv: 6 });
  F.poly(pil, [[pil.uv(1.2, 0), pil.uv(1.4, 0), pil.uv(1.34, 1.42), pil.uv(1.26, 1.42)]][0], W, .6);
  const piv = pil.uv(1.3, 1.45);
  const beam = F.spin(pil, piv, .32, .66, .14, { lv: pil.lvl });
  F.poly(beam, [[piv[0] - 1.2, piv[1] - .03], [piv[0] + 1.2, piv[1] - .03], [piv[0] + 1.2, piv[1] + .03], [piv[0] - 1.2, piv[1] + .03]], DARK, .7, -.004);
  F.poly(beam, K.circle(piv[0], piv[1], .08, 12), RED, 0, -.006);
  for (const sg of [-1, 1]) {
    const ex = [piv[0] + sg * 1.15, piv[1]];
    const pan = F.spin(beam, ex, -.32, .66, .14, { lv: pil.lvl });
    for (const dx of [-.3, .3]) F.line(pan, ex, [ex[0] + dx, ex[1] + .55], .5, INK, -.004);
    F.poly(pan, [[ex[0] - .36, ex[1] + .55], [ex[0] + .36, ex[1] + .55], [ex[0] + .28, ex[1] + .67], [ex[0] - .28, ex[1] + .67]], sg < 0 ? SHADE : W, .8, -.006);
    if (sg < 0) for (let k = 0; k < 3; k++) F.poly(pan, rect(ex[0] - .24 + k * .06, ex[1] + .41 - k * .1, ex[0] + .24 - k * .06, ex[1] + .55 - k * .1), W, .6, -.008);
    else F.poly(pan, rect(ex[0] - .15, ex[1] + .43, ex[0] + .15, ex[1] + .55), W, .6, -.008);
  }

  // ----- drei Karten wandern über die Brücke: Produkte, Kunden, Bestellungen -----
  const icons = [
    (nd, w, h) => { K.rect(nd, w * .3, h * .22, w * .7, h * .7, W, .7, -.003); K.ln(nd, [w * .3, h * .46], [w * .7, h * .46], .6); K.ln(nd, [w * .5, h * .22], [w * .5, h * .46], .6); },
    (nd, w, h) => { K.decoP(nd, K.circle(w * .5, h * .62, h * .14, 12), DARK, .5); K.decoP(nd, [[w * .28, h * .18], [w * .72, h * .18], [w * .66, h * .4], [w * .34, h * .4]], DARK, .5); },
    (nd, w, h) => { for (let k = 0; k < 3; k++) { K.ln(nd, [w * .34, h * (.72 - k * .2)], [w * .76, h * (.72 - k * .2)], .7); K.deco(nd, w * .2, h * (.72 - k * .2) - .025, w * .27, h * (.72 - k * .2) + .03, DARK); } }
  ];
  const cw = .64, ch = .46, row = -.25;
  const startX = [-3.95, -3.05, -2.15], tgt = [[2.1, -2.6], [3.05, -2.6], [4.0, -2.6]], tt = [.66, .71, .76];
  startX.forEach((x, i) => {
    const a = F.slide(R, [0, .9, 0], tt[i], .04, { lv: 3 });
    const b = F.slide(a, [tgt[i][0] - x, 0, 0], tt[i] + .04, .09, { lv: 3 });
    const c = F.slide(b, [0, 0, tgt[i][1] - row], tt[i] + .13, .05, { lv: 3 });
    const d = F.slide(c, [0, -.9, 0], tt[i] + .18, .03, { lv: 3 });
    const card = K.box(d, x - cw / 2, x + cw / 2, row + ch / 2, row - ch / 2, .26, .56 + i * .03, .1, { lv: 3, e: .85 });
    icons[i](card.top, cw, ch);
  });

  // ----- das sperrige Teil: passt links in kein Fach, rastet rechts exakt ein -----
  const bw = 2.3, bd = .7, bx0 = -4.4, bz = 2.45;
  const a = F.slide(R, [0, .9, 0], .84, .03, { lv: 3 });
  const b = F.slide(a, [(rx + 1.35 - bw / 2) - bx0, 0, 0], .87, .06, { lv: 3 });
  const c = F.slide(b, [0, 0, -1.1 - bz], .93, .035, { lv: 3 });
  const d = F.slide(c, [0, -.9, 0], .965, .03, { lv: 3 });
  const big = K.box(d, bx0, bx0 + bw, bz + bd / 2, bz - bd / 2, .26, .6, .1, { lv: 3, e: .9 });
  K.grid(big.top, 0, 0, bw, bd, 6, 1, .3);
  const lock = F.still(R, .96, .04, { lv: 14 });
  outline(lock, fx0, -1.65, fx1, -.55, 1, RED, .64);
  outline(lock, fx0 + .03, -1.62, fx1 - .03, -.58, 1, RED, .65);
}

export const MODELS = {
  start: { w: 9.2, h: 5.4, dy: .9, fn: einstieg },
  arbeit: { w: 9.0, h: 10.2, dy: .45, fn: gerwing },
  shops: { w: 8.8, h: 10.2, dy: .75, fn: shops }
};

export function buildModel(key) {
  const F = Model();
  MODELS[key].fn(F, kit(F));
  return F.finish();
}
