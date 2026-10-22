// Shops und Shop-Wechsel (Szene 5), Fassung „Die Szene ist der Träger“ (PRINZIP-SZENE-IST-TRAEGER.md).
// Das Ding: Umzugskartons auf Rollbrettern. Ein Shopwechsel ist ein Umzug; die Kartons tragen die Sätze als Aufschrift auf ihrer Vorderseite.
//  S0 Kopf       großer Umzugskarton am Anfang, die Deckelklappen stehen auf.
//  S1 Sonderkarton: lang und hoch, passt in kein Fach des Standardregals (Shopify-Wand mit lauter gleichen Fächern dahinter).
//  S2 Karton am Shopify-Regal, an dem Gebührenetiketten Stufe für Stufe wachsen (ohne Beträge).
//  S3 Karton auf der Waage zwischen den Regalen: erst wiegen (Zeiger pendelt, ohne Ergebnis), dann bewegen.
//  S4 drei Kartons „Produkte“, „Kunden“, „Bestellungen“ rollen vom Shopify-Regal zum WooCommerce-Regal (Fächer nach Maß) und rasten ein;
//     der Satz steht auf dem vordersten. Die Wanderung ist echte Bewegung entlang der Bahn (K.trage mit minD, auch am Desktop).
// Am Handy rollen die Kartons auf ihren Rollbrettern ein Stück mit der Kamera mit (K.trage) und bleiben dann stehen.
export default function (K) {
  const { F, R, Q, THREE, narrow: N, COL } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const { DARK } = COL;
  const EV = K.EV, PI = Math.PI;
  const CF = c3("#e7d9b9"), CS = c3("#d9c8a4"), CL = c3("#e0cfab"), TAPE = c3("#c9b58c"), METAL = c3("#cfc9bc");
  const WALL = c3("#ece7dd"), PART = c3("#ddd5c2"), PLATE = c3("#f1ede4"), TREAD = c3("#e3ddcf"), TAG = c3("#fbf8f0"), SIGN = c3("#faf8f3");
  const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const circ = (cx, cz, r, n = 14) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * 2 * PI), cz + r * Math.sin(i / n * 2 * PI)]);
  const OUT = -.003;                       // Zeichnung auf der Außenseite einer aufgestellten Wand (Unterseite der Ruhelage)
  const LZ = 0, FZ = .95, DP = .62;         // Lesetiefe (Vorderseiten der Kartons), Faden davor, Tiefe der Kartons
  const ZW = -5.2, HW = N ? 4.6 : 4.0, SY = HW - .6;                // Rückwand der Regale: Lage und Höhe
  const ink = a => `rgba(48,48,51,${a})`;

  // ---------- Texte ----------
  const kp = K.kopf({ head: "Shops und Shop-Wechsel", headLines: N ? ["Shops und", "Shop-Wechsel"] : undefined, e: EV * (N ? 1.55 : 1.8), on: 9 });
  const mk = (t, em) => K.satz(t, { e: EV * (N ? 1.05 : 1), maxEm: em, on: 9 });
  const T1 = mk("Ich baue WooCommerce-Shops für Produkte, die *in kein Standardformular passen*, etwa mit Mengen nach Fläche oder Fracht nach Entfernung.", N ? 11 : 19);
  const T2 = mk("Wer bei Shopify mit wachsendem Umsatz immer höhere *Gebühren* zahlt, kann zu *WooCommerce wechseln*.", N ? 12 : 15);
  const T3 = mk("Ich *rechne vorher durch*, ob sich das lohnt.", N ? 10.5 : 13.5);
  const T4 = mk("Dann ziehe ich *Produkte, Kunden und Bestellungen* um.", N ? 10.5 : 12);

  // ---------- Größen der Kartons ----------
  const W0 = kp.w + (N ? 1.0 : 1.3), H0 = N ? 2.5 : 2.3;
  const W1 = T1.tw + 1.0, H1 = N ? Math.max(3.2, T1.h + 1.0) : T1.h + .85;   // Sonderformat: Breitbild sehr lang und flach, Hochkant hoch und schmal
  const WS = 1.2, HS = 1.0;                                                     // Standardkartons daneben: passen in ein Fach (Fach 1,5 x 1,1)
  const W2 = T2.tw + 1.0, H2 = T2.h + 1.0;
  const W3 = T3.tw + 1.0, H3 = Math.max(1.8, T3.h + 1.0);
  const W4 = T4.tw + 1.0, H4 = Math.max(2.1, T4.h + 1.35);
  const WP = N ? 1.55 : 1.75, HP = Math.max(1.5, H4 - .5);   // „Produkte“ und „Kunden“
  const gp = .4;                                              // Abstand der drei Kartons (und Breite der Fachwand dazwischen)
  const trioW = WP + gp + WP + gp + W4;
  const NT = 4, TW = .5;                                      // Gebührenetiketten

  // ---------- Mitfahrt (Handy; am Desktop nur wo sie etwas bedeutet): erst die Weglängen, dann das Layout ----------
  const Dof = (w, o) => K.trage(0, w, o || {}).D;
  const D0 = Dof(kp.w), D1 = Dof(T1.tw), D2 = Dof(T2.tw), D3 = Dof(T3.tw);
  const DD = Dof(T4.tw, { minD: trioW + .25 });

  // ---------- Layout (x in Szenenkoordinaten; Korridor = Startlage bis Endlage samt Anbauten) ----------
  const GP = .5;
  let cur = 0;
  const it = {};
  const put = (key, W, D, pre = 0, post = 0, gap = GP) => {
    const c0 = cur + pre + W / 2, cF = c0 + D;
    it[key] = { c0, cF, W, xl: cur, xr: cF + W / 2 + post };
    cur = it[key].xr + gap;
  };
  put("k0", W0, D0); put("ks", WS * 2 + .2, 0, 0, 0, .6); put("k1", W1, D1); put("k2", W2, D2); put("k3", W3, D3, .7, .7);
  const L4 = cur;                                    // linke Kante des Zugs der drei Kartons
  const cP0 = L4 + WP / 2, cK0 = cP0 + WP / 2 + gp + WP / 2, cB0 = cK0 + WP / 2 + gp + W4 / 2;
  const cPF = cP0 + DD, cKF = cK0 + DD, cBF = cB0 + DD;
  const xW0 = cPF - WP / 2 - gp / 2 - .35, xW1 = cBF + W4 / 2 + gp / 2 + .35;   // WooCommerce-Wand
  const xe = cBF + Math.min(DD, K.halfW * .5) / 2 + 1.1, xs = it.k0.xl - K.halfW;
  K.strecke(xs, xe);
  const SPAN = xe - xs, bE = e => e / SPAN, tIn = x => K.sicht(x).in;
  const ride = (key, w, o) => K.trage(it[key].cF, w, o);

  K.sheet(it.k0.xl - 3, xe + 3.5, LZ - 12, LZ + 3.2);

  // ---------- Bauzeiten und Gerüst ----------
  const GER = [];
  const ger = (tag, t0, bAt) => GER.push({ tags: [tag], t0, t1: t0 + bE(.8), du: bE(.4), a: .5, bAt });

  // ---------- Umzugskarton: Rollbrett, Wände klappen hoch, Deckel hebt sich (oder Klappen stehen offen) ----------
  function carton(par, tag, x0, x1, h, o = {}) {
    const z0 = LZ, z1 = LZ - DP, W = x1 - x0, tl = tIn(x0), tf = tl + bE(.8), d = bE(1.0);
    const op = { over: .04 }, sop = { over: .04, nocut: 1, nofold: 1 };
    F.part(tag, tl, bE(.75));
    const fr = K.panel(par, [x0, z0], [x1, z0], [0, 1], tf, d, Q, { over: .04, nocut: 1 });
    K.rect(fr, 0, 0, W, h, CF);
    // Rollbrett: Leiste am Fuß der Vorderseite mit zwei Rollen
    K.P(fr, [[0, 0], [W, 0], [W, .2], [0, .2]], METAL, .4, OUT);
    for (const u of [.34, W - .34]) { const c = fr.uv(u, .1); F.poly(fr, circ(c[0], c[1], .07), DARK, 0, OUT - .001); }
    const lf = K.panel(par, [x0, z0], [x0, z1], [1, 0], tf + d * .12, d, Q, sop); K.rect(lf, 0, 0, DP, h, CS, .4);
    const rt = K.panel(par, [x1, z0], [x1, z1], [-1, 0], tf + d * .12, d, Q, sop); K.rect(rt, 0, 0, DP, h, CS, .4);
    let tDone = tf + d * 1.1;
    if (o.open) {
      // aufgefaltet: Rückwand und vier Klappen, die nach außen stehen
      const bk = K.panel(par, [x0, z1], [x1, z1], [0, -1], tf + d * .06, d, Q, op); K.rect(bk, 0, 0, W, h, CS);
      const fh = DP * .62, tk = tf + d * .85, dk = d * .9, ang = 1.25, fo = { over: .06 };
      K.rect(K.panel(fr, fr.uv(0, h), fr.uv(W, h), [0, 1], tk, dk, -ang, fo), 0, 0, W, fh, CL);
      K.rect(K.panel(bk, bk.uv(0, h), bk.uv(W, h), [0, -1], tk + d * .05, dk, -ang, fo), 0, 0, W, fh, CL);
      K.rect(K.panel(lf, lf.uv(0, h), lf.uv(DP, h), [1, 0], tk + d * .1, dk, ang, { ...fo, nocut: 1, nofold: 1 }), 0, 0, DP, fh, CL);
      K.rect(K.panel(rt, rt.uv(0, h), rt.uv(DP, h), [-1, 0], tk + d * .1, dk, ang, { ...fo, nocut: 1, nofold: 1 }), 0, 0, DP, fh, CL);
      tDone = tk + dk * 1.1;
    } else {
      const L = F.lift(par, h, tf + d * .1, d, op);
      F.poly(L, rect(x0, z0, x1, z1), CL, .5);
      const xm = (x0 + x1) / 2;
      F.poly(L, rect(xm - .15, z0, xm + .15, z1), TAPE, .35, .0009);
    }
    ger(tag, tl + bE(.05), o.bAt !== undefined ? o.bAt : 1);
    return { fr, W, h, tDone, tl };
  }
  // Aufschrift: Satz (oder Kopf) mittig auf der Vorderseite
  const aufschrift = (c, pr, dv = 0, dt = bE(.15)) => {
    pr.on = c.tDone + dt;
    K.onPanel(c.fr, pr, c.W / 2, c.h / 2 + .1 + dv, -1);
    return pr;
  };
  // Typenschild: kurzer Name auf der Vorderseite
  const schild = (c, txt, v, emax) => {
    const tw = K.measure([txt], { font: "kicker" }).tw, e = Math.min(emax, (c.W - .45) / tw);
    const pr = K.print([txt], e, c.tDone + bE(.15), { font: "kicker", col: "#5f5f63", align: "center", text: txt });
    K.onPanel(c.fr, pr, c.W / 2, v, -1);
    return pr;
  };

  // ---------- Wandabschnitt (Rückwand der Regale) mit gedrucktem Fachmuster ----------
  function wand(tag, xa, xb, t0, draw, signs) {
    const wl = xb - xa, s = 96;
    F.part(tag, t0, bE(1.3));
    const w = K.panel(R, [xa, ZW], [xb, ZW], [0, -1], t0 + bE(1.0), bE(1.6), Q, { over: .04 });
    K.rect(w, 0, 0, wl, HW, WALL, .45);
    const on = t0 + bE(2.8);
    K.onPanel(w, K.decal(Math.round(wl * s), Math.round(HW * s), (x, W, H) => draw(x, W / wl, H), wl, HW, on), wl / 2, HW / 2, 1);
    for (const sg of signs) {
      const tw = K.measure([sg.t], { font: "kicker" }).tw, e = Math.min(.5, (sg.w - .6) / tw);
      const pr = K.print([sg.t], e, on + bE(.2), { font: "kicker", col: "#303033", align: "center", text: sg.t });
      K.onPanel(w, pr, sg.x - xa, SY, 1);
    }
    ger(tag, t0 + bE(.1), 1);
    return w;
  }
  const BW = 1.5, RH = (HW - .9) / 3;                       // Standardregal: lauter gleiche Fächer

  // ================== Kartons und Anbauten ==================
  // ---------- S0: großer Umzugskarton, Deckelklappen aufgefaltet ----------
  const R0 = ride("k0", kp.w);
  const c0 = carton(R0.node(R), "k0", R0.c0 - W0 / 2, R0.c0 + W0 / 2, H0, { open: true, bAt: R0.D > 0 ? R0.bA : 1 });
  aufschrift(c0, kp.h, -.05);

  // ---------- zwei Standardkartons (passen in ein Fach) als Maß neben dem Sonderkarton ----------
  for (let k = 0; k < 2; k++) { const xa = it.ks.xl + k * (WS + .2); carton(R, "ks" + k, xa, xa + WS, HS, {}); }

  // ---------- S1: Sonderkarton, zu lang und zu hoch für ein Standardfach ----------
  const R1 = ride("k1", T1.tw);
  const c1 = carton(R1.node(R), "k1", R1.c0 - W1 / 2, R1.c0 + W1 / 2, H1, { bAt: R1.D > 0 ? R1.bA : 1 });
  aufschrift(c1, T1);

  // ---------- Shopify-Wand (Standardregal, hinter allen Kartons bis zum Zug der drei Kartons) ----------
  {
    const xS1 = xW0 - .12, nb = Math.ceil((xS1 - (it.k0.xl - 1.0)) / BW), xS0 = xS1 - nb * BW, per = 5;   // Fächer je Wandabschnitt
    const segs = [];
    for (let a = 0; a < nb; a += per) segs.push([xS0 + a * BW, xS0 + Math.min(nb, a + per) * BW]);
    // Typenschilder bleiben ganz auf einem Abschnitt
    const signs = [it.k1.cF, cK0].map(x => {
      const sg = segs.find(q => x >= q[0] && x <= q[1]) || segs[segs.length - 1], w = Math.min(4.0, sg[1] - sg[0] - .2);
      return { x: Math.max(sg[0] + w / 2 + .1, Math.min(sg[1] - w / 2 - .1, x)), w, t: "SHOPIFY", seg: sg };
    });
    segs.forEach(([xa, xb], i) => {
      const mine = signs.filter(sg => sg.seg === segs[i]), n = Math.round((xb - xa) / BW);
      wand("shop" + i, xa, xb, tIn(xa), (x, s, H) => {
        x.fillStyle = "#ece7dd"; x.fillRect(0, 0, 4000, H);
        for (let r = 0; r < 3; r++) for (let k = 0; k < n; k++) {
          const X = k * BW * s, Y = H - (.1 + (r + 1) * RH) * s;
          x.fillStyle = "#ddd5c3"; x.fillRect(X + .06 * s, Y + .06 * s, (BW - .12) * s, (RH - .06) * s);
          x.fillStyle = "#cfc6b2"; x.fillRect(X + .06 * s, Y + .06 * s, (BW - .12) * s, .09 * s);
          x.strokeStyle = ink(.3); x.lineWidth = 1.4; x.strokeRect(X + .06 * s, Y + .06 * s, (BW - .12) * s, (RH - .06) * s);
        }
        x.fillStyle = ink(.35); x.fillRect(0, H - .1 * s, 4000, .1 * s);
        for (const sg of mine) { x.fillStyle = "#faf8f3"; x.fillRect((sg.x - xa - sg.w / 2) * s, H - (SY + .25) * s, sg.w * s, .5 * s); x.strokeStyle = ink(.5); x.lineWidth = 1.6; x.strokeRect((sg.x - xa - sg.w / 2) * s, H - (SY + .25) * s, sg.w * s, .5 * s); }
      }, mine);
    });
  }

  // ---------- S2: Karton am Shopify-Regal, Gebührenetiketten wachsen ----------
  const R2 = ride("k2", T2.tw);
  const p2 = R2.node(R);
  const c2 = carton(p2, "k2", R2.c0 - W2 / 2, R2.c0 + W2 / 2, H2, { bAt: R2.D > 0 ? R2.bA : 1 });
  aufschrift(c2, T2);
  {
    // Etiketten stehen hinter dem Karton auf, jedes höher als das vorige (die Gebühr wächst mit dem Umsatz); die Spitzen ragen über ihn hinaus. Keine Beträge.
    const tz = LZ - DP - .35, step = (W2 - .3 - TW) / (NT - 1), x0 = R2.c0 - W2 / 2 + .15;
    for (let k = 0; k < NT; k++) {
      const h = H2 + .15 + k * .5, xa = x0 + k * step, t0 = c2.tDone + bE(.2 + k * .38);
      F.part("e" + k, t0 - bE(.6), bE(.5));
      const tg = K.panel(p2, [xa, tz], [xa + TW, tz], [0, -1], t0, bE(.5), Q, { over: .06 });
      K.P(tg, [[0, 0], [TW, 0], [TW, h - .2], [TW - .14, h], [.14, h], [0, h - .2]], TAG);
      const hc = tg.uv(TW / 2, h - .13); F.poly(tg, circ(hc[0], hc[1], .045), DARK, 0, -OUT);
      [[.9, .8], [.8, .6], [.7, .7]].forEach(([f, l], j) => F.line(tg, tg.uv(.1, h - .32 - j * .12), tg.uv(.1 + (TW - .2) * l, h - .32 - j * .12), .55, DARK, -OUT));
      ger("e" + k, t0 - bE(.6), R2.D > 0 ? R2.bA : 1);
    }
  }

  // ---------- S3: Karton auf der Waage zwischen den Regalen ----------
  const R3 = ride("k3", T3.tw);
  const p3 = R3.node(R);
  const xp0 = R3.c0 - W3 / 2 - .7, xp1 = it.k3.cF + W3 / 2 + .7;
  {
    // Wiegeplatte (flach), darüber Rollbrett und Karton; hinter dem Karton die Anzeige
    F.part("waage", tIn(xp0), bE(.8));
    const pl = K.slab(R, xp0, xp1, 1.45, -.85, .05, tIn(xp0) + bE(.9), bE(.8), { col: PLATE, top: PLATE, walls: "flr" });
    F.poly(pl, rect(xp0 + .25, 1.2, xp1 - .25, -.6), TREAD, .35, .0009);
    ger("waage", tIn(xp0) + bE(.05), 1);
  }
  const c3_ = carton(p3, "k3", R3.c0 - W3 / 2, R3.c0 + W3 / 2, H3, { bAt: R3.D > 0 ? R3.bA : 1 });
  aufschrift(c3_, T3);
  {
    const TX = it.k3.cF, TWd = 1.7, TZ = LZ - 1.15, xt0 = TX - TWd / 2, tl = tIn(xt0);
    F.part("anzeige", tl, bE(.8));
    const tw = K.panel(R, [xt0, TZ], [xt0 + TWd, TZ], [0, -1], tl + bE(.9), bE(1.0), Q, { over: .04 });
    K.P(tw, [[0, 0], [TWd, 0], [TWd, 3.3], [TWd / 2, 3.8], [0, 3.3]], SIGN);
    const dv = 2.85, dr = .6, on = tl + bE(2.0);
    K.onPanel(tw, K.decal(256, 256, (x, W, H) => {
      const c = W / 2, r = W * .46;
      x.fillStyle = "#ffffff"; x.beginPath(); x.arc(c, c, r, 0, 2 * PI); x.fill();
      x.strokeStyle = ink(.6); x.lineWidth = 3; x.beginPath(); x.arc(c, c, r, 0, 2 * PI); x.stroke();
      for (let i = -5; i <= 5; i++) { const a = -PI / 2 + i * .27, l = i % 5 === 0 ? .2 : .11; x.lineWidth = i === 0 ? 4 : 2.2; x.beginPath(); x.moveTo(c + Math.cos(a) * r * (1 - l), c + Math.sin(a) * r * (1 - l)); x.lineTo(c + Math.cos(a) * r * .94, c + Math.sin(a) * r * .94); x.stroke(); }
      x.fillStyle = ink(.5); x.beginPath(); x.arc(c, c, 7, 0, 2 * PI); x.fill();
    }, dr * 2, dr * 2, on), TWd / 2, dv, 1);
    // Zeiger: pendelt beim Durchrechnen nach beiden Seiten und kommt ruhig in die Mitte (kein Ergebnis vorweg)
    const swing = q => Math.sin(3 * PI * q) * (1 - q) * (1 - q);
    const t0 = R3.D > 0 ? Math.max(c3_.tDone + bE(.3), R3.bB - bE(.3)) : Math.max(c3_.tDone + bE(.3), K.sicht(it.k3.cF).mitte - bE(1.4));
    const piv = tw.uv(TWd / 2, dv);
    const ndl = F.spin(tw, piv, -.55, t0, bE(2.8), { ease: swing, lv: tw.lvl });
    F.poly(ndl, [tw.uv(TWd / 2 - .028, dv - .09), tw.uv(TWd / 2 + .028, dv - .09), tw.uv(TWd / 2 + .012, dv + dr - .08), tw.uv(TWd / 2 - .012, dv + dr - .08)], DARK, .5, .012);
    F.poly(ndl, circ(piv[0], piv[1], .045), DARK, .5, .013);
    ger("anzeige", tl + bE(.05), 1);
  }

  // ---------- S4: drei Kartons wandern vom Shopify- ins WooCommerce-Regal, der vorderste trägt den Satz ----------
  const R4 = K.trage(cBF, T4.tw, { minD: trioW + .25 });
  const tr = [
    { key: "p", c0: cP0, W: WP, h: HP, txt: "PRODUKTE" },
    { key: "k", c0: cK0, W: WP, h: HP, txt: "KUNDEN" },
    { key: "b", c0: R4.c0, W: W4, h: H4, txt: "BESTELLUNGEN" }
  ];
  const D4 = R4.D;
  tr.forEach(q => {
    q.c = carton(R4.node(R), "t" + q.key, q.c0 - q.W / 2, q.c0 + q.W / 2, q.h, { bAt: R4.bA });
    if (q.key === "b") { aufschrift(q.c, T4, -.18); schild(q.c, q.txt, q.h - .38, EV * .46); }
    else schild(q.c, q.txt, q.h / 2 + .1, EV * .62);
  });
  {
    // Fächer nach Maß in der WooCommerce-Wand: Wand mit Fachumrissen, Trennwände stehen auf, Sperrleisten rasten vor den Rollen ein
    const bays = tr.map(q => ({ x0: q.c0 + D4 - q.W / 2 - gp / 2, x1: q.c0 + D4 + q.W / 2 + gp / 2, h: q.h + .55 }));
    const wl = xW1 - xW0, s = 96;
    wand("woo", xW0, xW1, tIn(xW0), (x, sc, H) => {
      x.fillStyle = "#ece7dd"; x.fillRect(0, 0, 4000, H);
      for (const b of bays) {
        const X = (b.x0 - xW0) * sc, Wd = (b.x1 - b.x0) * sc, Y = H - (.1 + b.h) * sc;
        x.fillStyle = "#ddd5c3"; x.fillRect(X + .05 * sc, Y, Wd - .1 * sc, b.h * sc);
        x.fillStyle = "#cfc6b2"; x.fillRect(X + .05 * sc, Y, Wd - .1 * sc, .1 * sc);
        x.strokeStyle = ink(.34); x.lineWidth = 1.4; x.strokeRect(X + .05 * sc, Y, Wd - .1 * sc, b.h * sc);
      }
      x.fillStyle = ink(.35); x.fillRect(0, H - .1 * sc, 4000, .1 * sc);
      const sx = (xW0 + xW1) / 2 - xW0, sw = 4.6;
      x.fillStyle = "#faf8f3"; x.fillRect((sx - sw / 2) * sc, H - (SY + .25) * sc, sw * sc, .5 * sc); x.strokeStyle = ink(.5); x.lineWidth = 1.6; x.strokeRect((sx - sw / 2) * sc, H - (SY + .25) * sc, sw * sc, .5 * sc);
    }, [{ x: (xW0 + xW1) / 2, w: 4.6, t: "WOOCOMMERCE" }]);
    const tW = tIn(xW0) + bE(3.2);
    const xd = [bays[0].x0, bays[1].x0, bays[2].x0, bays[2].x1], hd = [bays[0].h, Math.max(bays[0].h, bays[1].h), Math.max(bays[1].h, bays[2].h), bays[2].h];
    F.part("fach", tW - bE(.4), bE(.8));
    xd.forEach((x, k) => {
      const p = K.panel(R, [x, -1.0], [x, ZW], [k % 2 ? -1 : 1, 0], tW + bE(.35 * k), bE(.7), Q, { over: .05 });
      K.rect(p, 0, 0, -1.0 - ZW, hd[k], PART, .45);
    });
    ger("fach", tW - bE(.4), 1);
    // Sperrleisten: rasten ein, sobald die Kartons stehen
    F.part("riegel", Math.max(tW, R4.bB - bE(.8)), bE(.6));
    tr.forEach((q, k) => {
      const xa = q.c0 + D4 - q.W / 2 + .12, xb = q.c0 + D4 + q.W / 2 - .12;
      K.rect(K.panel(R, [xa, LZ + .22], [xb, LZ + .22], [0, 1], R4.bB + bE(.15 + .15 * k), bE(.4), Q, { over: .1 }), 0, 0, xb - xa, .24, METAL, .45);
    });
    ger("riegel", Math.max(tW, R4.bB - bE(.8)), 1);
  }

  // ---------- Konstruktionsphase: Gerüst je Teil im Fenster seiner Bauzeit ----------
  for (const g of GER) F.geruest(g);

  // ---------- Faden: auf dem Boden vor den Kartons, über die Wiegeplatte ----------
  // Stützpunkte dicht setzen: sonst überschwingt der Spline vor dem Anstieg an der Wiegeplatte unter den Boden (y < 0) und der Faden verschwindet
  const FY = .035, faden = [];
  const run = (xa, xb) => { for (let x = xa; x < xb - .01; x += 1.0) faden.push([x, FY, FZ]); };
  run(xs + 4.6, xp0 - .12);
  faden.push([xp0 - .12, FY, FZ], [xp0, .09, FZ], [xp1, .09, FZ], [xp1 + .12, FY, FZ]);
  run(xp1 + .12 + 1.0, xe + 4); faden.push([xe + 4, FY, FZ]);

  return {
    strecke: [xs, xe], lineZ: LZ,
    faden,
    stops: [
      { name: "s0", prints: [kp.h] },
      { name: "s1", prints: [T1] },
      { name: "s2", prints: [T2] },
      { name: "s3", prints: [T3] },
      { name: "s4", prints: [T4] }
    ]
  };
}
