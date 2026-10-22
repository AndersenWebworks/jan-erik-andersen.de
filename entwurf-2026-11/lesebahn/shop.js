// Shop-Szene „Shops und Shop-Wechsel“, Bogen + Bastellinien (Kameradrehbuch: DREHBUCH.md in diesem Ordner).
// Ein kleines Lager faltet sich aus dem Bogen (Modelle und Reihenfolge nach entwurf-2026-10-b-blatt/modelle.js, „3 Shops“):
// hinten das Lagerschild mit der Überschrift; links das Standardregal (Shopify) mit gleichförmigen Fächern, daneben Preisschild
// und Gebührenstapel, der Stufe für Stufe wächst; rechts das Regal nach Maß (WooCommerce) mit Böden in der Höhe des Guts
// (schwerer Block, flacher Plattenstapel), daneben ein Paket mit Strecke zur Fahne; dazwischen die Brücke; vorn die Waage.
// Text wörtlich aus dem Seitentext (entwurf-2026-10-b-raumtext-2/index.html, Z. 173), Satz für Satz am Bauteil:
// S1 auf der Blende des Regals nach Maß, S2 auf der Blende des Standardregals, S3 geteilt: Sockel der Waage und Blende der Brücke.
// Pop-up-Logik: Böden heben sich parallel (Hubknoten), Stützen und Blenden schwenken von ihren Kanten, Fachteiler stehen auf,
// Pakete falten sich aus dem obersten Boden und fahren über einen Schiebeknoten (F.slide, nur in dieser Kopie des Kerns) hinüber.
// Kopie von entwurf-2026-11/shop/shop.js für die durchgehende Seite (entwurf-2026-11/seite/). Geändert: F.spin mit lv der Elternfläche
// (der gemeinsame Kern legt Drehknoten sonst eine Ebene höher), Konstruktionsphase ergänzt (Raster, Gerüst der festen Teile, Bleistiftspur).
export default function (K) {
  const { F, R, V, COL, Q, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const { INK, DARK, RED, WHITE } = COL;
  const STD = c3("#e3e2dd"), STD2 = c3("#d8d6cf"), MASS = c3("#ebe2cf"), MASS2 = c3("#dfd4bd"), BOX = c3("#dccaa8"), BOX2 = c3("#cfbb95");
  const FEE = c3("#dedad2"), SIGN = c3("#fbfaf6"), METAL = c3("#d9d5cc"), HEAVY = c3("#cdc6b8"), PLATE = c3("#e6e0d4"), TAG = c3("#fffdf7");
  const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const circ = (cx, cz, r, n = 18) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * 2 * Math.PI), cz + r * Math.sin(i / n * 2 * Math.PI)]);
  const OUT = -.003; // Druck auf der Außenseite hochgeklappter Wände (Unterseite der Ruhelage)

  // Block aus dem Bogen: Deckel hebt sich parallel, Vorder- und Seitenwände stehen von den Kanten auf (Außenseite: -1)
  function block(par, x0, x1, z0, z1, h, t0, d, o = {}) {
    const W = x1 - x0, D = z0 - z1, col = o.col || COL.PAPER, op = { over: o.over !== undefined ? o.over : .04 }, sop = o.sideNocut ? { ...op, nocut: 1, nofold: 1 } : op;
    const fr = K.panel(par, [x0, z0], [x1, z0], [0, 1], t0, d, Q, op); K.rect(fr, 0, 0, W, h, o.fcol || col);
    const lf = o.noLeft ? null : K.panel(par, [x0, z0], [x0, z1], [-1, 0], t0 + d * .1, d, Q, sop); if (lf) K.rect(lf, 0, 0, D, h, o.scol || col);
    const rt = o.noRight ? null : K.panel(par, [x1, z0], [x1, z1], [1, 0], t0 + d * .1, d, Q, sop); if (rt) K.rect(rt, 0, 0, D, h, o.scol || col);
    const L = F.lift(par, h, t0, d, op); F.poly(L, rect(x0, z0, x1, z1), o.top || col, .5);
    return { fr, lf, rt, L, W, D, h };
  }

  // ---------- Bogen ----------
  K.sheet(-7.9, 7.9, N ? -10.5 : -9.5, N ? 9.6 : 5.25);

  // ---------- Lagerschild mit Überschrift (zwei Stützen, eine Tafel), steht als erstes auf ----------
  F.part("schild", 0, .07);
  // Stützen so hoch, dass die Tafel an allen Lesestellen außer der eigenen ganz über dem Bild liegt (gerechnet, _pruefung/schild.mjs);
  // hochkant ist das Bild steiler, dort höher
  const SZ = -3.6, LH = N ? 5.6 : 4.6, BH = .85, so = { over: .03 };
  const legL = K.panel(R, [-2.6, SZ], [-2.4, SZ], [0, -1], .18, .08, Q, so);
  const legR = K.panel(R, [2.4, SZ], [2.6, SZ], [0, -1], .18, .08, Q, so);
  K.P(legL, [[0, 0], [.2, 0], [.2, LH], [0, LH]], SIGN, [.5, .5, 0, .5]);
  K.P(legR, [[0, 0], [.2, 0], [.2, LH], [0, LH]], SIGN, [.5, .5, 0, .5]);
  // Tafel hängt an der linken Stütze, beide schwenken gleich; über den Stützen keine Kante
  K.P(legL, [[-.3, LH], [0, LH], [.2, LH], [5.0, LH], [5.2, LH], [5.5, LH], [5.5, LH + BH], [-.3, LH + BH]], SIGN, [.5, 0, .5, 0, .5, .5, .5, .5]);
  const HEAD = K.print(["Shops und Shop-Wechsel"], .42, -1, { font: "serif", lh: 1.1 });
  K.onPanel(legL, HEAD, 2.6, LH + BH / 2, 1);

  // ---------- Regale ----------
  const ZF = 0, ZB = -1.3, PW = .14, SH = N ? .9 : .74, TE = .12;
  function regal(name, x0, x1, ys, ht, col, col2, t0, lt) {
    F.part(name, lt, .08);
    const boards = [];
    for (const y of [...ys, ht]) {
      const L = F.lift(R, y, t0, .08, { over: .02 });
      F.poly(L, rect(x0, ZF, x1, ZB), col, .5);
      // Vorderkante als schmale Leiste (ohne eigene Bastellinie)
      K.rect(K.panel(L, [x0, ZF], [x1, ZF], [0, 1], t0 + .05, .03, -Q, { nocut: 1, nofold: 1, own: R }), 0, 0, x1 - x0, .05, col2);
      boards.push(L);
    }
    const top = boards[boards.length - 1], down = { own: R, over: .035 }, tp = t0 + .07;
    for (const [a, b] of [[x0, x0 + PW], [x1 - PW, x1]]) {
      K.rect(K.panel(top, [a, ZF], [b, ZF], [0, 1], tp, .05, -Q, down), 0, 0, PW, ht, col2);
      K.rect(K.panel(top, [a, ZB], [b, ZB], [0, -1], tp + .006, .05, -Q, down), 0, 0, PW, ht, col2);
    }
    // Blende: steht auf der Vorderkante des obersten Bodens auf, trägt den Satz (Außenseite -1)
    const sign = K.panel(top, [x0 + PW, ZF], [x1 - PW, ZF], [0, 1], t0 + .12, .05, Q, { own: R, over: .04 });
    K.rect(sign, 0, 0, x1 - x0 - 2 * PW, SH, SIGN);
    return { boards, top, sign, x0, x1, ys, ht, sw: x1 - x0 - 2 * PW };
  }

  // Standardregal (Shopify): drei gleiche Ebenen, je drei gleiche Fächer (oben ohne Teiler, dort stehen die drei Pakete)
  const SX0 = -4.4, SX1 = -1.0, WX0 = 1.0, WX1 = 4.4;
  const std = regal("standard", SX0, SX1, [.15, .8, 1.45], 2.1, STD, STD2, .24, .03);
  const cw = (SX1 - SX0) / 3;
  for (let k = 0; k < 2; k++) for (let c = 1; c < 3; c++) {
    const xd = SX0 + c * cw, hL = std.ys[k + 1] - std.ys[k];
    K.rect(K.panel(std.boards[k], [xd, ZF], [xd, ZB], [1, 0], .33 + k * .008, .04, Q, { nocut: 1, nofold: 1, fresh: 1, over: .03 }), 0, 0, ZF - ZB, hL, STD2);
  }
  // Regal nach Maß (WooCommerce): Böden in der Höhe des Guts
  const mass = regal("mass", WX0, WX1, [.15, 1.0, 1.45], 2.0, MASS, MASS2, .27, .06);

  // ---------- Brücke zwischen den Regalen, Satzteil S3b auf ihrer Blende ----------
  F.part("bruecke", .08, .06);
  const BY = 1.45, AH = .44;
  const deck = F.lift(R, BY, .35, .05, { over: .02 });
  F.poly(deck, rect(SX1, ZF, WX0, ZB), SIGN, .5);
  const apron = K.panel(deck, [SX1, ZF], [WX0, ZF], [0, 1], .39, .04, -Q, { own: R, over: .035 });
  K.rect(apron, 0, 0, WX0 - SX1, AH, SIGN);

  // ---------- Waage vorn: Sockel mit Satzteil S3a, Säule, Balken und Schalen ----------
  F.part("waage", .1, .08);
  // Hochkant steht sie weiter vorn, hinter der Kamera der Lesestelle S3b (sonst läge der Balken quer vor der Brücke)
  const WZ = N ? 4.4 : 0;
  const plat = block(R, -1.55, 1.55, 4.3 + WZ, 2.6 + WZ, .42, .36, .05, { col: SIGN, scol: SIGN });
  const PZh = 2.75 + WZ;
  const pil = K.panel(plat.L, [-.35, PZh], [.35, PZh], [0, 1], .40, .05, Q, { over: .04 });
  K.P(pil, [[0, 0], [.7, 0], [.55, .1], [.15, .1]], METAL);
  K.P(pil, [[.29, .1], [.41, .1], [.40, 1.15], [.30, 1.15]], METAL);
  // Pendeln beim Durchrechnen: schlägt nach beiden Seiten aus, wird ruhiger und kommt waagerecht zur Ruhe (kein Ergebnis vorweg)
  const swing = x => Math.sin(3 * Math.PI * x) * (1 - x) * (1 - x);
  const TH = -.16, TW0 = .70, TWD = .10;
  const piv = pil.uv(.35, 1.2);
  const beam = F.spin(pil, piv, TH, TW0, TWD, { ease: swing, lv: pil.lvl });
  F.poly(beam, [pil.uv(-.7, 1.17), pil.uv(1.4, 1.17), pil.uv(1.4, 1.23), pil.uv(-.7, 1.23)], DARK, .5);
  F.poly(beam, circ(piv[0], piv[1], .055, 16), METAL, .5);
  for (const sg of [-1, 1]) {
    const eu = .35 + sg * 1.0, ex = pil.uv(eu, 1.2);
    const pan = F.spin(beam, ex, -TH, TW0, TWD, { ease: swing, lv: beam.lvl });
    for (const du of [-.28, .28]) F.line(pan, ex, pil.uv(eu + du, .72), .5, INK, OUT);
    F.poly(pan, [pil.uv(eu - .34, .72), pil.uv(eu + .34, .72), pil.uv(eu + .26, .62), pil.uv(eu - .26, .62)], METAL, .5);
    // links (Shopify): Gebühren gestapelt, rechts (WooCommerce): ein Block
    if (sg < 0) for (let k = 0; k < 3; k++) F.poly(pan, [pil.uv(eu - .24 + .05 * k, .72 + .06 * k), pil.uv(eu + .24 - .05 * k, .72 + .06 * k), pil.uv(eu + .24 - .05 * k, .78 + .06 * k), pil.uv(eu - .24 + .05 * k, .78 + .06 * k)], FEE, .5, OUT - .001 * k);
    else F.poly(pan, [pil.uv(eu - .15, .72), pil.uv(eu + .15, .72), pil.uv(eu + .15, .8), pil.uv(eu - .15, .8)], MASS, .5, OUT);
  }

  // ---------- Gebühren: Preisschild und Stapel links vom Standardregal ----------
  F.part("gebuehr", .11, .07);
  // Breitbild: links neben dem Regal. Hochkant: vor dem Regal (sonst bei 16 px Schrift außerhalb des Bildes)
  const CWD = N ? .45 : .55, GX = N ? -3.85 : -6.95, GZ0 = N ? 1.75 : -.35, GZ1 = N ? 1.1 : -1.0, TX = N ? -5.55 : -6.55, TZ = N ? 1.75 : .9;
  const tag = K.panel(R, [TX, TZ], [TX + .95, TZ], [0, 1], .52, .03, Q, { over: .05 });
  K.P(tag, [[0, 0], [.95, 0], [.95, .55], [0, .55], [-.25, .275]], TAG);
  F.poly(tag, circ(tag.uv(-.06, .275)[0], tag.uv(-.06, .275)[1], .045, 14), DARK, 0, OUT);
  [.55, .5, .32].forEach((l, k) => F.line(tag, tag.uv(.12, .4 - k * .12), tag.uv(.12 + l, .4 - k * .12), .55, INK, OUT));
  const fees = [];
  for (let k = 0; k < 4; k++) {
    const h = .35 * (k + 1), x0 = GX + k * CWD;
    const b = block(R, x0, x0 + CWD, GZ0, GZ1, h, .575 + k * .02, .045, { col: FEE, sideNocut: 1, noRight: 1, over: .05 });
    for (let j = 1; j < (k + 1) * 2; j++) F.line(b.fr, b.fr.uv(0, j * .175), b.fr.uv(CWD, j * .175), .35, DARK, OUT);
    fees.push(b);
  }

  // ---------- Pakete: falten sich aus dem obersten Boden des Standardregals, fahren über die Brücke ins Regal nach Maß ----------
  F.part("pakete", .36, .04);
  // Ziel im Regal nach Maß: dicht nebeneinander um seine Mitte (Abstand .75)
  const PKW = .55, PKH = .28, PT = [1.95, 2.7, 3.45];
  const icon = [
    // Produkt: Karton mit Klebeband
    (fr, c) => { F.poly(fr, [fr.uv(c - .09, .06), fr.uv(c + .09, .06), fr.uv(c + .09, .2), fr.uv(c - .09, .2)], WHITE, .5, OUT); F.line(fr, fr.uv(c, .14), fr.uv(c, .2), .5, INK, OUT - .001); F.line(fr, fr.uv(c - .09, .14), fr.uv(c + .09, .14), .5, INK, OUT - .001); },
    // Kunde: Kopf und Schultern
    (fr, c) => { const p = fr.uv(c, .175); F.poly(fr, circ(p[0], p[1], .04, 14), DARK, 0, OUT); F.poly(fr, [fr.uv(c - .08, .05), fr.uv(c + .08, .05), fr.uv(c + .055, .12), fr.uv(c - .055, .12)], DARK, 0, OUT); },
    // Bestellung: Liste mit Punkten
    (fr, c) => { for (let k = 0; k < 3; k++) { const v = .2 - k * .055; F.line(fr, fr.uv(c - .04, v), fr.uv(c + .1, v), .55, INK, OUT); const p = fr.uv(c - .08, v); F.poly(fr, circ(p[0], p[1], .013, 8), DARK, 0, OUT); } }
  ];
  const packs = [];
  for (let i = 0; i < 3; i++) {
    const cx = SX0 + (i + .5) * cw;
    // alle drei fahren gemeinsam als Zug los (gleicher Lauf, die Abstände ziehen sich von 1,13 auf 0,75 zusammen);
    // an der Lesestelle S3b (b .9) stehen sie mittig auf und an der Brücke
    const sl = F.slide(std.boards[2], [PT[i] - cx, 0, 0], .866, .09, { over: .012, fresh: 1 });
    const pk = block(sl, cx - PKW / 2, cx + PKW / 2, -.45, -.85, PKH, .40 + i * .012, .04, { col: BOX, scol: BOX2 });
    icon[i](pk.fr, PKW / 2);
    F.line(pk.L, [cx, -.45], [cx, -.85], .6, DARK);
    packs.push(pk);
  }

  // ---------- Inhalt Regal nach Maß: schwerer Block unten, Plattenstapel im flachen Fach ----------
  F.part("inhalt", .41, .03);
  const hv = block(mass.boards[0], 1.7, 3.3, -.62, -1.22, .62, .44, .045, { col: HEAVY, over: .02 });
  {
    const c = hv.W / 2, fr = hv.fr;
    F.poly(fr, [fr.uv(c - .17, .1), fr.uv(c + .17, .1), fr.uv(c + .11, .34), fr.uv(c - .11, .34)], DARK, 0, OUT);
    const p = fr.uv(c, .42); F.poly(fr, circ(p[0], p[1], .065, 16), DARK, 0, OUT); F.poly(fr, circ(p[0], p[1], .032, 12), HEAVY, 0, OUT - .001);
  }
  const pl = block(mass.boards[1], 1.45, 3.95, -.32, -1.08, .22, .455, .04, { col: PLATE, over: .03 });
  for (let j = 1; j < 4; j++) { F.line(pl.fr, pl.fr.uv(0, j * .055), pl.fr.uv(pl.W, j * .055), .4, DARK, OUT); for (const s of [pl.lf, pl.rt]) F.line(s, s.uv(0, j * .055), s.uv(pl.D, j * .055), .4, DARK, OUT); }

  // ---------- Fracht: Paket neben dem Regal, gestrichelte Strecke zur Fahne ----------
  F.part("fracht", .13, .05);
  const fp = block(R, 5.05, 5.65, -.4, -1.0, .45, .46, .04, { col: BOX, scol: BOX2 });
  F.poly(fp.fr, [fp.fr.uv(.12, .14), fp.fr.uv(.48, .14), fp.fr.uv(.48, .34), fp.fr.uv(.12, .34)], WHITE, .4, OUT);
  for (const [v, l] of [[.29, .26], [.23, .2], [.18, .14]]) F.line(fp.fr, fp.fr.uv(.16, v), fp.fr.uv(.16 + l, v), .45, INK, OUT - .001);
  const flag = K.panel(R, [6.9, 2.3], [6.95, 2.3], [0, -1], .49, .04, Q, { over: .05 });
  K.P(flag, [[0, 0], [.05, 0], [.05, .95], [0, .95]], DARK);
  K.P(flag, [[.05, .95], [.05, .68], [.48, .815]], RED);
  {
    const P0 = [5.35, .2], P1 = [5.55, 1.7], P2 = [6.3, 2.55], P3 = [6.92, 2.42], segs = [];
    const bz = t => { const u = 1 - t; return [0, 1].map(k => u * u * u * P0[k] + 3 * u * u * t * P1[k] + 3 * u * t * t * P2[k] + t * t * t * P3[k]); };
    for (let i = 0; i < 16; i++) segs.push([bz(i / 16), bz((i + 1) / 16)]);
    F.sketch(R, segs, .48, .05, { dash: true, a: .6, dy: .0012 });
  }

  // ---------- Text (wörtlich), Satz für Satz am Bauteil ----------
  const S1 = N
    ? ["Ich baue WooCommerce-Shops", "für Produkte, die in kein", "Standardformular passen, etwa", "mit Mengen nach Fläche oder", "Fracht nach Gewicht und Entfernung."]
    : ["Ich baue WooCommerce-Shops für Produkte,", "die in kein Standardformular passen, etwa", "mit Mengen nach Fläche oder Fracht nach", "Gewicht und Entfernung."];
  const S2 = N
    ? ["Wer bei Shopify mit wachsendem", "Umsatz immer höhere Gebühren", "zahlt, kann zu WooCommerce", "wechseln."]
    : ["Wer bei Shopify mit wachsendem Umsatz", "immer höhere Gebühren zahlt, kann zu", "WooCommerce wechseln."];
  const S3a = ["Ich rechne vorher durch,", "ob sich das lohnt,"];
  const S3b = ["und ziehe Produkte, Kunden", "und Bestellungen um."];
  const to = { lh: 1.22 };
  const T1 = K.onPanel(mass.sign, K.print(S1, TE, .47, to), mass.sw / 2, SH / 2, -1);
  const T2 = K.onPanel(std.sign, K.print(S2, TE, .55, to), std.sw / 2, SH / 2, -1);
  const T3 = K.onPanel(plat.fr, K.print(S3a, TE, .69, { ...to, align: "center" }), plat.W / 2, plat.h / 2, -1);
  const T4 = K.onPanel(apron, K.print(S3b, TE, .82, { ...to, align: "center" }), (WX0 - SX1) / 2, AH / 2, 1, [0, -1]);

  // ---------- Konstruktionsphase (seite/): Gerüst der festen Teile, bevor sie hochklappen; Bleistiftspur auf den Flächen ----------
  // Ohne Pakete (fahren), Waage (pendelt), Gebühren und Fracht (stehen erst zu den Lesestellen auf).
  F.geruest({ tags: ["schild", "standard", "mass", "bruecke"], t0: .1, t1: .2, du: .03, a: .5 });
  F.spur({ tags: ["schild", "standard", "mass", "bruecke", "waage"], quiet: [legL, mass.sign, std.sign, plat.fr, apron], a: .3 });

  // ---------- Lesestellen ----------
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const S = {
    head: { prints: [HEAD], b: .31, px: 30, pitch: 22, sy: .42, pxN: 24, fitN: .9, npitch: 22, nsy: .5 },
    s1: { prints: [T1], b: .5, px: pxD, pitch: 14, yaw: -8, sx: -.45, sy: .42, npitch: 14, nyaw: 0, nsy: .5 },
    s2: { prints: [T2], b: .64, px: pxD, pitch: 14, yaw: 10, sx: .2, sy: .42, npitch: 14, nyaw: 0, nsy: .5 },
    // tief im Bild liegende Drucke erscheinen durch die Neigung etwas kleiner: Sollgröße dort angehoben (gerechnet 19–20 bzw. 16 px)
    s3a: { prints: [T3], b: .76, px: (W, H) => pxD(W, H) * 1.1, pxN: 17.8, pitch: 18, sy: -.5, npitch: 18, nsy: -.45 },
    s3b: { prints: [T4], b: .9, px: (W, H) => pxD(W, H) * 1.1, pxN: 17, pitch: 21, sy: -.25, npitch: 16, nsy: -.25 }
  };
  return {
    fov: 32, fovN: 44,
    track: 620,
    // Raster (seite/): mit den Bastellinien, weg bevor das Lager steht
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .24 },
    stops: Object.values(S),
    keys: [
      // Start: über dem flach liegenden Schild, Überschrift lesbar im Bogen (Blickhöhe 55°)
      { w: 0, b: 0, cam: V(0, 10.65, -1.17), tgt: V(0, 0, -8.63), camN: V(0, 11.88, -1.3), tgtN: V(0, 0, -9.63) },
      // Bastellinien fertig: Überblick über den Bogen
      // eingepasst (_pruefung/fit.mjs): Desktop alle Teile 70 bis 810 px, Handy Regale, Brücke, Waage, Gebühren 6 bis 384 px breit
      { w: .6, b: .18, cam: V(.11, 20.85, 11.52), tgt: V(.11, -.51, -1.31), camN: V(-.75, 23.62, 17.92), tgtN: V(-.75, -.38, 3.5) },
      { w: .8, stop: S.head },
      // Aufbau fertig: das ganze Lager, Blickhöhe 28°
      // Desktop: ganzes Lager (Blickhöhe 22°, eingepasst 30 bis 1250 px); Handy: Regal nach Maß und Brücke (Blickhöhe 20°), sonst wäre der Anflug auf S1 zu steil
      { w: .8, b: .45, cam: V(-2.89, 8.03, 18.7), tgt: V(-.18, 1.04, 1.62), camN: V(.2, 6.33, 14.21), tgtN: V(1.75, .96, -.46) },
      { w: .9, stop: S.s1 },
      { w: .8, stop: S.s2 },
      { w: .7, stop: S.s3a },
      { w: .7, stop: S.s3b },
      // Schluss: Überblick
      { w: .6, b: 1, cam: V(2.05, 9.72, 17.63), tgt: V(.56, 2.11, .59), camN: V(.65, 12.37, 27.43), tgtN: V(-.58, .92, 3.98) }
    ]
  };
}
