// Leben auf dem Schreibtisch der Eröffnung (Erik, 22.10.2026): Tastatur, Maus, Grafiktablett mit Stift, Kaffeetasse, Pflanze, Schreibtischlampe,
// Stiftebecher. Alles aus gefaltetem Papier, gleiche Bauweise wie Tisch, Monitor und Rechner: Teile hängen als Kinder an der Tischplatte (K.panel,
// F.lift, F.poly aus falt.js); Randstreifen klappen an ihren Kanten auf, die Platte hebt sich parallel (wie der Fuß des Monitors), stehende
// Teile (Lampe, Blätter, Stifte, Henkel) schwenken an echten Kanten hoch.
// Ruhelage: Die Teile liegen in Ruhe knapp UNTER der Tischplatte (Ebene −40 · EPS, 0,06 tief) und sind darin verborgen; beim Aufklappen kommen sie durch
// die Platte nach oben, ihre Standfläche sitzt damit genau auf dem Tisch (Streifen und Hub sind um die Versenkung BUR länger). Der Tisch trägt so keine
// Zuschnitte, solange die Teile fehlen; auf der Platte zeichnen sich nur die Umrisse der Standflächen (Bastellinien, wie bei den übrigen Teilen).
// Das Tablett trägt die drei Sätze, die früher an den Armen des roten Fadens standen. Sie werden beim Scrollen Zeile für Zeile geschrieben:
// die Stiftspitze fährt an der Schreibkante mit (Wisch von links nach rechts, mit kleinen Pausen zwischen den Wörtern), danach bleiben sie stehen.
// Der Stift ist ein Papierstab (sechskantig, Spitze heller) und liegt vor und nach dem Schreiben auf dem unteren Rand des Tabletts.
// Schnittstelle: schreibtisch(K, { top, HT, MX, N }) liefert { prints (die sechs Zeilen für die Lesestelle), e, ctr, timeline }.
// Die einzelnen Bauteile (Tastatur, Maus, Tasse, Becher, Pflanze, Lampe) sind als dtTastatur, dtMaus, dtTasse, dtBecher, dtPflanze, dtLampe einzeln
// ausgeführt (Zusammenarbeit, abschluss.js: je Arbeitsplatz eine andere Mischung in hellen Papiertönen). Die Eröffnung ruft sie mit den alten Werten auf.

const PI = Math.PI;
const BUR = .06, LV = -40, ink = a => `rgba(48,48,51,${a})`;
// Rechteck mit abgeschrägten Ecken (Gegen-/Uhrzeigersinn egal, konvex)
const rrect = (x0, x1, z0, z1, ch) => [[x0 + ch, z0], [x1 - ch, z0], [x1, z0 + ch], [x1, z1 - ch], [x1 - ch, z1], [x0 + ch, z1], [x0, z1 - ch], [x0, z0 + ch]];
// regelmäßiges Achteck, Seitenmitte im Abstand r (Seiten stehen parallel zu den Achsen)
const oct = (cx, cz, r) => { const R = r / Math.cos(PI / 8); return Array.from({ length: 8 }, (_, k) => [cx + R * Math.cos(PI / 8 + k * PI / 4), cz + R * Math.sin(PI / 8 + k * PI / 4)]); };
const hex6 = (cx, cz, r) => Array.from({ length: 6 }, (_, k) => [cx + r * Math.cos(k * PI / 3), cz + r * Math.sin(k * PI / 3)]);

function werkzeug(K) {
  const { F, THREE, Q } = K;
  // F.poly und K.rect erwarten Farben als [r, g, b] (linear), nicht als Text: sonst verschiebt sich das ganze Farbfeld des Faltmodells (schwarze und Debugfarben)
  const c = s => { const k = new THREE.Color(s); return [k.r, k.g, k.b]; };
  // Block aus Stufen: je Stufe Randstreifen an den Kanten der Grundfläche (klappen nach oben) und Platte, die sich parallel hebt. Erste Stufe um BUR länger.
  // o: side (Farbe der Seiten), top (Farbe der Oberseite), inner { pts, col } (zweite Fläche knapp über der Oberseite, z. B. Bildschirm, Kaffee)
  const block = (par, pts, hs, t0, d, o) => {
    const n = pts.length; let cx = 0, cz = 0; for (const p of pts) { cx += p[0]; cz += p[1]; } cx /= n; cz /= n;
    let cur = par; const dt = d / hs.length; let Lh = null;
    hs.forEach((h0, i) => {
      const h = h0 + (i ? 0 : BUR), t = t0 + i * dt, lv = LV + 2 * i;
      for (let k = 0; k < n; k++) {
        const p = pts[k], q = pts[(k + 1) % n]; let nx = p[1] - q[1], nz = q[0] - p[0]; const l = Math.hypot(nx, nz); nx /= l; nz /= l;
        if ((cx - p[0]) * nx + (cz - p[1]) * nz > 0) { nx = -nx; nz = -nz; }
        K.rect(K.panel(cur, p, q, [nx, nz], t, dt, Q, { lv, nocut: true, nofold: true, over: .05 }), 0, 0, l, h, o.side);
      }
      Lh = F.lift(cur, h, t, dt, { lv: lv + 1, over: .04 });
      const last = i === hs.length - 1;
      F.poly(Lh, pts, last ? o.top : o.side, .5, 0, undefined, i ? { nocut: true } : undefined);
      if (last && o.inner) F.poly(Lh, o.inner.pts, o.inner.col, .5, .0012, undefined, { nocut: true });
      cur = Lh;
    });
    Lh.hTot = hs.reduce((a, b) => a + b, 0); Lh.lvTop = LV + 2 * (hs.length - 1) + 1;
    return Lh;
  };
  // Druck oder Decal auf die Oberseite eines Blocks (knapp über der Fläche, über der zweiten Fläche)
  const onTop = (nd, pr, x, z, lift = .003) => { K.onFlat(nd, pr, x, z, lift); return pr; };
  // schmale hochklappende Fläche (Blatt, Stift, Henkel, Lampenarm): Scharnier a–b auf der Ebene des Elternknotens, Fläche liegt in Ruhe nach n
  const flap = (par, a, b, n, t0, d, ang, lv, ang0) => K.panel(par, a, b, n, t0, d, ang, { lv, nocut: true, nofold: true, over: .04, ang0 });
  return { c, block, onTop, flap };
}

// ---------- Tastatur ----------
// o: top, x0, x1, z0, z1 (Grundfläche), t [t0, d], tag, N (weniger Tasten je Reihe), col { side, top }
export function dtTastatur(K, o) {
  const { F } = K, { c, block, onTop } = werkzeug(K), N = o.N !== undefined ? o.N : K.narrow, T = o.t, col = o.col || {};
  const { x0: kx0, x1: kx1, z0: kz0, z1: kz1 } = o, kcx = (kx0 + kx1) / 2, kcz = (kz0 + kz1) / 2, kw = kx1 - kx0, kd = kz1 - kz0;
  F.part(o.tag || "tastatur", T[0], T[1]);
  const keyb = block(o.top, rrect(kx0, kx1, kz0, kz1, .06), [.09], T[0], T[1], { side: c(col.side || "#ced1d6"), top: c(col.top || "#ebeef3") });
  const PXU = 420, wpx = Math.round(kw * PXU), hpx = Math.round(kd * PXU);
  // Fünf Reihen wie bei einer flachen Tastatur (Zahlen, drei Buchstabenreihen, unten Modifier mit mittiger Leertaste), je 15 Einheiten breit,
  // gleiche Abstände, keine Überlappung (die Reihen teilen sich Breite und Höhe der Fläche gleichmäßig)
  const ROWS = [[...Array(13).fill(1), 2], [1.5, ...Array(12).fill(1), 1.5], [1.75, ...Array(11).fill(1), 2.25], [2.25, ...Array(10).fill(1), 2.75], [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25]];
  const dec = K.decal(wpx, hpx, (x, W, H) => {
    const pad = Math.min(.045 * W, .1 * H), uw = (W - 2 * pad) / 15, rh = (H - 2 * pad) / ROWS.length, gap = Math.min(uw, rh) * .14;
    x.strokeStyle = ink(.34); x.fillStyle = "rgba(255,255,255,.7)"; x.lineWidth = Math.max(1.5, .05 * Math.min(uw, rh));
    ROWS.forEach((row, r) => {
      let X = pad;
      for (const wu of row) {
        x.beginPath(); x.roundRect(X + gap / 2, pad + r * rh + gap / 2, wu * uw - gap, rh - gap, .2 * Math.min(uw, rh)); x.fill(); x.stroke();
        X += wu * uw;
      }
    });
  }, kw, kd, T[0] + T[1] + .002, .012);
  onTop(keyb, dec, kcx, kcz);
  return keyb;
}

// ---------- Maus ----------
// o: top, cx, cz, t, tag, col { side, top }
export function dtMaus(K, o) {
  const { F } = K, { c, block, onTop } = werkzeug(K), T = o.t, col = o.col || {};
  const mcx = o.cx, mcz = o.cz, mw = .3, md = .5;
  F.part(o.tag || "maus", T[0], T[1]);
  // abgerundet länglich (Tropfen): vorn (zum Bildschirm, −z) schmaler, hinten (zur Hand) breiter
  const mpts = Array.from({ length: 12 }, (_, k) => { const a = k * PI / 6; return [mcx + (mw / 2) * Math.cos(a) * (1 + .1 * Math.sin(a)), mcz + (md / 2) * Math.sin(a)]; });
  const mouse = block(o.top, mpts, [.11], T[0], T[1], { side: c(col.side || "#ced1d6"), top: c(col.top || "#ebeef3") });
  const PXU = 420, wpx = Math.round(mw * 1.1 * PXU), hpx = Math.round(md * PXU);
  const dec = K.decal(wpx, hpx, (x, W, H) => {
    x.strokeStyle = ink(.4); x.lineWidth = 3; x.lineCap = "round";
    x.beginPath(); x.moveTo(W / 2, H * .1); x.lineTo(W / 2, H * .4); x.stroke();            // Trennfuge der beiden Tasten
    x.beginPath(); x.moveTo(W * .26, H * .4); x.quadraticCurveTo(W / 2, H * .46, W * .74, H * .4); x.stroke();   // Tastenkante
    x.fillStyle = ink(.5); x.beginPath(); x.roundRect(W / 2 - .03 * W, H * .2, .06 * W, .13 * H, .03 * W); x.fill();  // Rad
  }, mw * 1.1, md, T[0] + T[1] + .002, .012);
  onTop(mouse, dec, mcx, mcz);
  return mouse;
}

// ---------- Kaffeetasse (Achteck, zwei Stufen, Henkel) ----------
// o: top, cx, cz, t, th (Henkel), tag, tagH, col { cup, coffee }
export function dtTasse(K, o) {
  const { F, Q, EPS } = K, { c, block, flap } = werkzeug(K), T = o.t, TH = o.th, col = o.col || {};
  const ccx = o.cx, ccz = o.cz, CR = .2, CH = .38, cup = c(col.cup || "#f1f3f9");
  F.part(o.tag || "tasse", T[0], T[1]);
  block(o.top, oct(ccx, ccz, CR), [CH / 2, CH / 2], T[0], T[1], { side: cup, top: cup, inner: { pts: oct(ccx, ccz, CR * .78), col: c(col.coffee || "#616265") } });
  // Henkel: C-Form aus drei Rechtecken in einer senkrechten Fläche an der rechten Seite (Fläche z = ccz, steht an der Kante x = ccx + CR)
  F.part(o.tagH || "henkel", TH[0], TH[1]);
  // (das Scharnier liegt wie die Standflächen BUR unter der Platte: Höhen um HB nach oben versetzt)
  const hd = flap(o.top, [ccx + CR, ccz], [ccx + CR + .2, ccz], [0, 1], TH[0], TH[1], Q, LV + 6), HB = -(LV + 6) * EPS;
  K.rect(hd, 0, HB + .27, .2, HB + .32, cup); K.rect(hd, 0, HB + .1, .2, HB + .15, cup); K.rect(hd, .15, HB + .1, .2, HB + .32, cup);
}

// ---------- Stiftebecher (Sechseck, zwei Stufen, vier Stifte) ----------
// o: top, cx, cz, t, tp (Stifte), tag, tagP, col { side, top, pens: [4 Farben] }
export function dtBecher(K, o) {
  const { F, Q } = K, { c, block, flap } = werkzeug(K), T = o.t, TP = o.tp, col = o.col || {};
  const pcx = o.cx, pcz = o.cz, PR = .16;
  F.part(o.tag || "becher", T[0], T[1]);
  const pcup = block(o.top, hex6(pcx, pcz, PR * 1.1), [.19, .19], T[0], T[1], { side: c(col.side || "#5b5b60"), top: c(col.top || "#2f2f33") });
  F.part(o.tagP || "stifte", TP[0], TP[1]);
  const pc = col.pens || ["#f1f3f9", "#3d3d42", "#dadde2", "#f1f3f9"];
  [[Q * .0, .46, pc[0]], [PI * .8, .52, pc[1]], [PI * 1.15, .4, pc[2]], [PI * 1.55, .48, pc[3]]].forEach(([az, len, cl], k) => {
    const dx = Math.cos(az), dz = Math.sin(az), tx = -dz, tz = dx, hc = [pcx + dx * .04, pcz + dz * .04];
    const pn = flap(pcup, [hc[0] - tx * .028, hc[1] - tz * .028], [hc[0] + tx * .028, hc[1] + tz * .028], [dx, dz], TP[0] + k * .004, TP[1], 1.28 + .05 * (k % 2), LV + 4 + k);
    K.P(pn, [[0, 0], [.056, 0], [.056, len * .88], [.028, len], [0, len * .88]], c(cl));
  });
}

// ---------- Pflanze (Topf aus Achteck, Blätter an der Erde) ----------
// o: top, cx, cz, t, tl (Blätter), tag, tagL, col { pot, soil, leaves: [2 Farben] }
export function dtPflanze(K, o) {
  const { F } = K, { c, block, flap } = werkzeug(K), T = o.t, TL = o.tl, col = o.col || {};
  const plx = o.cx, plz = o.cz, PTR = .26;
  F.part(o.tag || "topf", T[0], T[1]);
  const pot = block(o.top, oct(plx, plz, PTR), [.18, .18], T[0], T[1], { side: c(col.pot || "#c9ccd1"), top: c(col.soil || "#66676a") });
  F.part(o.tagL || "blaetter", TL[0], TL[1]);
  const lc = col.leaves || ["#b9c6ab", "#c4cfb7"];
  [[-.4, .62, 1.0], [.5, .56, 1.15], [1.35, .66, .95], [2.25, .5, 1.2], [3.0, .64, 1.05], [3.85, .55, 1.12], [4.75, .6, .98], [5.5, .48, 1.2]].forEach(([az, len, ang], k) => {
    const dx = Math.cos(az), dz = Math.sin(az), tx = -dz, tz = dx, hc = [plx + dx * .05, plz + dz * .05], wd = .12;
    const lf = flap(pot, [hc[0] - tx * wd / 2, hc[1] - tz * wd / 2], [hc[0] + tx * wd / 2, hc[1] + tz * wd / 2], [dx, dz], TL[0] + k * .004, TL[1] - .004 * 4, ang, LV + 4 + k);
    K.P(lf, [[.015, 0], [wd - .015, 0], [wd + .07, len * .45], [wd / 2, len], [-.07, len * .45]], k % 2 ? c(lc[1]) : c(lc[0]));
  });
}

// ---------- Schreibtischlampe (Fuß, Stiel, Arm, Schirm) ----------
// Arm und Schirm liegen in Ruhe zurückgeklappt (ang0 −π) auf dem Stiel: der Stiel steht als Stab auf, danach klappt der Arm nach vorn, zuletzt der Schirm.
// o: top, cx, cz, tb (Fuß), ts (Stiel), ta (Arm), tsh (Schirm) je [t0, d], tag, col { base, baseTop, stem, shade }
export function dtLampe(K, o) {
  const { F, Q } = K, { c, block, flap } = werkzeug(K), col = o.col || {};
  const lpx = o.cx, lpz = o.cz, tb = o.tb, ts = o.ts, ta = o.ta, tsh = o.tsh;
  F.part(o.tag || "lampe", tb[0], tsh[0] + tsh[1] - tb[0]);
  const lampBase = block(o.top, rrect(lpx - .3, lpx + .3, lpz - .22, lpz + .22, .07), [.07], tb[0], tb[1], { side: c(col.base || "#55555a"), top: c(col.baseTop || "#6a6a70") });
  const LS = 1.25, LA = .85, LW = .12, LD = .62, lvB = LV + 1;
  const dn = o.dir || [0, 1], du = [dn[1], -dn[0]];                               // Ausladung des Arms (Vorgabe +z), Scharnierrichtung quer dazu
  const stem = flap(lampBase, [lpx - du[0] * LW / 2, lpz - du[1] * LW / 2], [lpx + du[0] * LW / 2, lpz + du[1] * LW / 2], dn, ts[0], ts[1], Q, lvB + 1);
  K.rect(stem, 0, 0, LW, LS, c(col.stem || "#5f5f64"));
  const arm = flap(stem, stem.uv(0, LS), stem.uv(LW, LS), dn, ta[0], ta[1], -1.05, lvB + 2, -PI);
  K.rect(arm, 0, 0, LW, LA, c(col.stem || "#5f5f64"));
  const shade = flap(arm, arm.uv(0, LA), arm.uv(LW, LA), dn, tsh[0], tsh[1], -1.22, lvB + 3, -PI);
  K.P(shade, [[0, 0], [LW, 0], [LW + .2, LD], [-.2, LD]], c(col.shade || "#e6e9ee"));
}

export function schreibtisch(K, G) {
  const { F, THREE, Q, mech, sm, narrow: N } = K;
  const { top, HT, MX } = G;
  const { c, block, onTop } = werkzeug(K);

  // ---------- Zeitplan (Baufortschritt b) ----------
  const T = {
    lampBase: [.500, .025], lampStem: [.515, .045], lampArm: [.560, .030], lampShade: [.588, .030],
    keyboard: [.505, .035], mouse: [.525, .025], tablet: [.530, .040],
    cup: [.620, .045], handle: [.660, .020], pencup: [.560, .045], pens: [.600, .025],
    pot: [.575, .050], leaves: [.620, .040]
  };
  const WB0 = .700, WB1 = .830, PEN_AP = .02, PEN_RET = .012;     // Schreiben: Beginn, Ende (b); Stift fährt davor an und danach zurück

  // ---------- Lage (Tischplatte: x ±X1, z −1,9 … 1,7; Monitor steht ab MX nach rechts, Skizzenfläche bis z 0,9) ----------
  // Breitbild: links des Monitors liegt die Fläche für Tablett, Pflanze, Lampe, Stiftebecher; vor dem Monitor (Streifen z 1,0 … 1,6) Tastatur und Maus.
  // Handy: Tisch schmaler, Bildausschnitt schmal (rund 1,9 Einheiten bei 15 px Schrift): alles rückt in eine Spalte, Tastatur vor dem Tablett, Tasse hinter dem Tablett (sie entsteht nach den Blättern der Pflanze, deren Schwenk sonst durch sie ginge).
  // Die Ruhelage der Randstreifen liegt unter der Platte, darf aber nirgends über deren Rand ragen (Streifen = Stufenhöhe + BUR): Abstand zum Rand
  // mindestens so groß wie die Streifen (Tastatur .15, Tasse und Becher .25, Lampenfuß .13).
  const L = N ? {
    tab: [-2.4, -1.15, -.35, .95], key: [-2.3, -1.2, 1.0, 1.5], mouse: [-.88, 1.25], cup: [-1.15, -.75], plant: [-1.9, -.9], pencup: [-1.2, -1.35], lamp: [-2.1, -1.5]
  } : {
    tab: [-3.4, -1.25, -.45, 1.15], key: [MX - 1.1, MX + 1.1, .6, 1.38], mouse: [MX + 1.1 + .4, 1.0], cup: [-.8, 1.12], plant: [-2.4, -1.2], pencup: [-1.35, -1.25], lamp: [-3.1, -1.5]
  };

  // ---------- Tastatur ----------
  const [kx0, kx1, kz0, kz1] = L.key, kcx = (kx0 + kx1) / 2, kcz = (kz0 + kz1) / 2;
  dtTastatur(K, { top, x0: kx0, x1: kx1, z0: kz0, z1: kz1, t: T.keyboard, tag: "tastatur", N });

  // ---------- Maus (rechts neben der Tastatur) ----------
  const [mcx, mcz] = L.mouse;
  dtMaus(K, { top, cx: mcx, cz: mcz, t: T.mouse, tag: "maus" });

  // ---------- Grafiktablett (trägt die drei Sätze) ----------
  const [tx0, tx1, tz0, tz1] = L.tab, tcx = (tx0 + tx1) / 2, TH = .06;
  const BZ = { l: .1, r: .1, t: .08, b: .22 };                                   // Rand: unten breiter (dort liegt der Stift)
  const sx0 = tx0 + BZ.l, sx1 = tx1 - BZ.r, sz0 = tz0 + BZ.t, sz1 = tz1 - BZ.b;      // Schreibfläche
  F.part("tablett", T.tablet[0], T.tablet[1]);
  const tab = block(top, rrect(tx0, tx1, tz0, tz1, .08), [TH], T.tablet[0], T.tablet[1], {
    side: c("#46464b"), top: c("#5b5b60"), inner: { pts: rrect(sx0, sx1, sz0, sz1, .02), col: c("#f3f6fb") } });
  // Sätze: je Satz zwei Zeilen (Texte wie im Fallbacktext der Seite), Grotesk wie bisher, linksbündig auf der Schreibfläche
  const SENT = [["Agenturen holen mich", "als Entwickler ins Projekt."], ["Unternehmen arbeiten", "direkt mit mir."], ["Auf Wunsch arbeite ich auch", "befristet im Team mit."]];
  const LINES = SENT.flat(), POPT = { track: .005, lh: 1.22 };
  const tw = LINES.map(s => K.measure([s], POPT).tw);
  const padX = .09 * (sx1 - sx0), padZ = .11 * (sz1 - sz0);                       // gleichmäßiger Innenrand (9 % der Schreibfläche), links wie oben, rechts und unten
  const mx = sx1 - sx0 - 2 * padX;                                                // nutzbare Breite
  const lhK = 1.32, gapK = .62 * lhK, hK = 5 * lhK + 2 * gapK + .9;                // Blockhöhe in Schrifthöhen (e)
  const e = Math.min(.15, mx / Math.max(...tw), (sz1 - sz0 - 2 * padZ) / hK);
  const lh = lhK * e, gapP = gapK * e;                                            // Zeilenabstand, Absatz zwischen den Sätzen
  const blockH = hK * e;                                                          // erste Grundlinie bis letzte + Schrifthöhe
  const zFirst = (sz0 + sz1) / 2 - blockH / 2 + e * .98;                          // erste Grundlinie
  const x0 = sx0 + padX;                                                          // einheitlicher linker Einzug
  const zBase = LINES.map((_, i) => zFirst + i * lh + Math.floor(i / 2) * gapP);
  const prints = LINES.map(s => K.print([s], e, 0, POPT));
  const TOPY = HT + TH + .0075;                                                    // Oberfläche der Schreibfläche (mit Auflage)
  prints.forEach((pr, i) => {
    pr.sched = b => b >= T.tablet[0] + T.tablet[1] ? 1 : 0;
    const cx = x0 + pr.w / 2 - pr.t.padX * e, cz = zBase[i] + (pr.h / 2 - (pr.t.padY + .94) * e);
    pr.cx = cx; pr.zb = zBase[i];
    onTop(tab, pr, cx, cz, .004);
  });
  // Wisch: Fläche der Schrift wächst von links (Geometrie und Texturkoordinate der Fläche), frac = Anteil der Druckbreite
  const frac = (pr, u) => u >= 1 ? 1 : Math.min(1, (pr.t.padX + u * pr.t.tw) / pr.t.w);
  const setFrac = (pr, f) => {
    if (pr._f === f) return; pr._f = f;
    const g = pr.mesh.geometry, P = g.attributes.position, U = g.attributes.uv;
    for (const i of [1, 3]) { P.setX(i, -pr.w / 2 + f * pr.w); U.setX(i, f); }
    P.needsUpdate = true; U.needsUpdate = true;
  };
  prints.forEach(pr => setFrac(pr, 0));
  // Wortkurve je Zeile: u (0 … 1 der Schrift) über s (0 … 1 der Schreibzeit); Zeit je Wort nach Zeichen, kurzer Sprung zwischen den Wörtern
  const wordCurve = s => {
    const words = s.split(" "), W = K.measure([s], POPT).tw, pts = [[0, 0]]; let t = 0, pre = "";
    words.forEach((w, j) => {
      const u0 = j ? K.measure([pre + " "], POPT).tw / W : 0;
      pre = pre ? pre + " " + w : w;
      const u1 = K.measure([pre], POPT).tw / W;
      if (j) { t += .55; pts.push([t, u0]); }
      else pts.push([0, 0]);
      t += w.length; pts.push([t, u1]);
    });
    const tot = t; return x => { const q = x * tot; for (let k = 1; k < pts.length; k++) if (q <= pts[k][0] + 1e-9) { const a = pts[k - 1], b = pts[k]; return b[0] === a[0] ? b[1] : a[1] + (b[1] - a[1]) * (q - a[0]) / (b[0] - a[0]); } return 1; };
  };
  const curves = LINES.map(wordCurve);
  // Schreibplan: Zeilen nacheinander, dazwischen Setzen der Spitze (Zeile → nächste Zeile, Absatz länger)
  const plan = []; { let acc = 0; const wts = [];
    LINES.forEach((s, i) => { wts.push({ k: "w", i, w: s.length + 2 }); if (i < LINES.length - 1) wts.push({ k: "m", i, w: i % 2 ? 7 : 4 }); });
    const sum = wts.reduce((a, q) => a + q.w, 0);
    for (const q of wts) { plan.push({ ...q, b0: WB0 + (WB1 - WB0) * acc / sum, b1: WB0 + (WB1 - WB0) * (acc + q.w) / sum }); acc += q.w; } }

  // ---------- Stift (Papierstab, Spitze hellere Farbe), liegt auf dem unteren Rand des Tabletts ----------
  const pen = new THREE.Group(), PL = .96;
  {
    const body = new THREE.CylinderGeometry(.03, .03, PL - .14, 6, 1).rotateX(PI / 2).translate(0, 0, .14 + (PL - .14) / 2);
    const tipG = new THREE.CylinderGeometry(.03, .007, .14, 6, 1).rotateX(PI / 2).translate(0, 0, .07);
    const m1 = new THREE.Mesh(body, K.paperMaterial("#3d3d42")), m2 = new THREE.Mesh(tipG, K.paperMaterial("#e2e5ea"));
    const em = g => new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .55, depthWrite: false }));
    pen.add(m1, m2, em(body), em(tipG));
    for (const o of pen.children) o.frustumCulled = false;
    pen.frustumCulled = false; K.add(pen);
  }
  const Z = new THREE.Vector3(0, 0, 1);
  const dirLie = new THREE.Vector3(1, 0, 0), dirWr = new THREE.Vector3(.5, .62, .6).normalize();
  const qLie = new THREE.Quaternion().setFromUnitVectors(Z, dirLie), qWr = new THREE.Quaternion().setFromUnitVectors(Z, dirWr), qTmp = new THREE.Quaternion();
  const tipAt = (i, u) => new THREE.Vector3(prints[i].cx - prints[i].w / 2 + (prints[i].t.padX + u * prints[i].t.tw) * e, 0, zBase[i] - .12 * e);
  const lieZ = tz1 - BZ.b / 2 - .005, lieTip = new THREE.Vector3(tx0 + Math.min(.4, (tx1 - tx0 - PL) / 2), 0, lieZ);
  const smooth = x => sm(x), lerpV = (a, b, t) => a.clone().lerp(b, t);
  const penState = b => {
    const rev = LINES.map(() => 0); let tip, wr = 1, arc = 0;
    const first = tipAt(0, 0), last = tipAt(LINES.length - 1, 1);
    if (b < WB0 - PEN_AP) { tip = lieTip; wr = 0; }
    else if (b < WB0) { const q = smooth((b - (WB0 - PEN_AP)) / PEN_AP); tip = lerpV(lieTip, first, q); wr = q; arc = Math.sin(PI * q) * .22; }
    else if (b <= WB1) {
      let sgm = plan[plan.length - 1]; for (const q of plan) if (b <= q.b1) { sgm = q; break; }
      const s = Math.min(1, Math.max(0, (b - sgm.b0) / (sgm.b1 - sgm.b0)));
      LINES.forEach((_, i) => { if (i < sgm.i || (i === sgm.i && sgm.k === "m")) rev[i] = 1; });
      if (sgm.k === "w") { const u = curves[sgm.i](s); rev[sgm.i] = u; tip = tipAt(sgm.i, u); }
      else { const q = smooth(s); tip = lerpV(tipAt(sgm.i, 1), tipAt(sgm.i + 1, 0), q); arc = Math.sin(PI * q) * .1; }
    } else { rev.fill(1); const q = smooth((b - WB1) / PEN_RET); tip = lerpV(last, lieTip, q); wr = 1 - q; arc = Math.sin(PI * q) * .22; if (b >= WB1 + PEN_RET) { tip = lieTip; wr = 0; arc = 0; } }
    return { rev, tip, wr, arc };
  };
  K.anim(b => {
    const w = mech((b - T.tablet[0]) / T.tablet[1], .04), yb = HT - BUR + (TH + BUR) * w + .0075;
    pen.visible = w > .02;
    const st = penState(b);
    pen.position.set(st.tip.x, yb + .03 * (1 - st.wr) + st.arc + (st.wr ? .004 : 0), st.tip.z);
    qTmp.copy(qLie).slerp(qWr, st.wr); pen.quaternion.copy(qTmp);
    prints.forEach((pr, i) => setFrac(pr, st.rev[i] >= 1 ? 1 : st.rev[i] <= 0 ? 0 : frac(pr, st.rev[i])));
  });

  // ---------- Kaffeetasse (Achteck, zwei Stufen, Henkel) ----------
  const [ccx, ccz] = L.cup, CH = .38;
  dtTasse(K, { top, cx: ccx, cz: ccz, t: T.cup, th: T.handle, tag: "tasse", tagH: "henkel" });

  // ---------- Stiftebecher (Sechseck, zwei Stufen, vier Stifte) ----------
  const [pcx, pcz] = L.pencup;
  dtBecher(K, { top, cx: pcx, cz: pcz, t: T.pencup, tp: T.pens, tag: "becher", tagP: "stifte" });

  // ---------- Pflanze (Topf aus Achteck, Blätter an der Erde) ----------
  const [plx, plz] = L.plant;
  dtPflanze(K, { top, cx: plx, cz: plz, t: T.pot, tl: T.leaves, tag: "topf", tagL: "blaetter" });

  // ---------- Schreibtischlampe (Fuß, Stiel, Arm, Schirm) ----------
  const [lpx, lpz] = L.lamp;
  dtLampe(K, { top, cx: lpx, cz: lpz, tb: T.lampBase, ts: T.lampStem, ta: T.lampArm, tsh: T.lampShade, tag: "lampe", dir: [1, 0] });

  // ---------- Daten für die Szene ----------
  const sum = prints.reduce((a, p) => a.add(new THREE.Vector3(p.cx, TOPY, p.zb)), new THREE.Vector3()).multiplyScalar(1 / prints.length);
  return { prints, e, ctr: sum, tablet: { x0: tx0, x1: tx1, z0: tz0, z1: tz1 }, win: [WB0, WB1], T, L,
    // Punkte zur Prüfung der Bildausschnitte (Welt, Szenenkoordinaten): Tasse, Pflanze, Tastatur, Lampe, Becher, Maus
    marks: { tasse: [ccx, HT + CH, ccz], pflanze: [plx, HT + .9, plz], tastatur: [kcx, HT + .09, kcz], lampe: [lpx, HT + 1.8, lpz], becher: [pcx, HT + .4, pcz], maus: [mcx, HT + .11, mcz] } };
}
