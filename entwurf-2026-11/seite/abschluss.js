// Abschluss: Wie ich arbeite und Zusammenarbeit (zwei Szenen auf einem langen Bogen, eine Kamerabahn).
// Jedes Konstrukt tut, was im Absatz steht (Drehbuch: DREHBUCH.md):
//  1  Wie ich arbeite („Sätze aufs Fließband“, Erik 22.10.): drei Helferarme legen je eine Karte mit einem ganzen Satz aufs Papierband
//     (KI-Abläufe, allein statt Team, fremder oder älterer Code). Die Karten fahren zusammen nach rechts durch den Prüfrahmen, auf dessen Balken der
//     Satz zur Verantwortung steht, und bekommen danach den roten Haken. Am Ende liegt die letzte Karte (Konzept und klickbarer Entwurf) am Bandende.
//     Gelesen von links nach rechts, die Kamera gleitet frontal am Band entlang. Die Arme stehen hinter dem Band, damit keine Armglieder vor dem Text stehen.
//  2  Zusammenarbeit („Kanban-Tafel dahinter“): ein Teamtisch mit drei Arbeitsplätzen, auf jedem eine andere Mischung Schreibtischdinge (Bauteile aus
//     schreibtisch.js), die Zarge bleibt leer. Hinter den Plätzen steht eine Projekttafel aus Papier mit drei Spalten (Erledigt, In Arbeit, Als Nächstes);
//     die Sätze des Absatzes stehen ganz auf Karten in den Spalten. Die frühere Szene „Kontakt“ (Umschlag) entfällt: Kontaktdaten stehen im Menü und in der Fußzeile.
// Alle Bauteile liegen in Ruhe flach auf dem Bogen (Faltplan) und klappen mit dem Baufortschritt b hoch.
// b-Fenster: Szene 1 0 … .36, Szene 2 .36 … .70.
// Kopie von entwurf-2026-11/abschluss/abschluss.js für die durchgehende Seite (entwurf-2026-11/seite/). Die Seite zeigt das Modul zweimal,
// je mit Ausschnitt des Bogens: „Wie ich arbeite“ (x bis 8,5, b 0 … .36) und nach Werdegang und Stimmen „Zusammenarbeit“
// (x ab 8,5, b .37 … .70). Ergänzt: Konstruktionsphase (Raster, Gerüst je Bauabschnitt, Bleistiftspur).
import { dtTastatur, dtMaus, dtTasse, dtBecher, dtPflanze, dtLampe } from "./schreibtisch.js";
const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Druckbilder ----------
function checkDraw(x, W, H) {
  x.fillStyle = RED; x.beginPath(); x.arc(W / 2, H / 2, W * .46, 0, Math.PI * 2); x.fill();
  x.strokeStyle = "#fff"; x.lineWidth = W * .1; x.lineCap = "round"; x.lineJoin = "round";
  x.beginPath(); x.moveTo(W * .3, H * .52); x.lineTo(W * .45, H * .66); x.lineTo(W * .72, H * .36); x.stroke();
}
// Papierband: feine Querstriche im Abstand der Karten
function bandDraw(x, W, H) {
  x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(0, 0, W, H);
  x.strokeStyle = ink(.16); x.lineWidth = Math.max(1, H * .012);
  x.beginPath(); x.moveTo(0, H * .1); x.lineTo(W, H * .1); x.moveTo(0, H * .9); x.lineTo(W, H * .9); x.stroke();
  x.strokeStyle = ink(.11); x.lineWidth = Math.max(1, H * .01);
  for (let i = 1; i < 120; i++) { const X = W * i / 120; x.beginPath(); x.moveTo(X, H * .1); x.lineTo(X, H * .9); x.stroke(); }
}
// Website-Layout für die Monitore der Arbeitsplätze (ein Theme, überall gleich)
function themeDraw(x, W, H) {
  x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
  const s = W / 1000, S = H / 625;
  x.fillStyle = ink(.8); rr(x, 60 * s, 46 * S, 118 * s, 22 * S, 2 * s); x.fill();
  x.fillStyle = ink(.35); for (let i = 0; i < 3; i++) { rr(x, (620 + i * 100) * s, 52 * S, 70 * s, 10 * S, 5 * S); x.fill(); }
  x.fillStyle = ink(.12); x.fillRect(0, 100 * S, W, 2 * S);
  x.fillStyle = ink(.78); rr(x, 60 * s, 150 * S, 430 * s, 42 * S, 2 * s); x.fill(); rr(x, 60 * s, 204 * S, 300 * s, 42 * S, 2 * s); x.fill();
  x.fillStyle = ink(.26); [400, 380, 260].forEach((w, i) => { rr(x, 60 * s, (276 + i * 24) * S, w * s, 10 * S, 5 * S); x.fill(); });
  x.fillStyle = ink(.07); x.fillRect(560 * s, 140 * S, 380 * s, 280 * S);
  x.strokeStyle = ink(.3); x.lineWidth = 3 * s; x.strokeRect(560 * s, 140 * S, 380 * s, 280 * S);
  for (let c = 0; c < 3; c++) { x.fillStyle = ink(.65); rr(x, (60 + c * 300) * s, 470 * S, 150 * s, 14 * S, 2 * s); x.fill(); x.fillStyle = ink(.22); [240, 220, 170].forEach((w, i) => { rr(x, (60 + c * 300) * s, (500 + i * 20) * S, w * s, 8 * S, 4 * S); x.fill(); }); }
}
// Platzset: Rahmen (und, wo keine Tastatur aus Papier steht, eine aufgedruckte Tastatur) im Raster, 1,9 × 0,9; oben im Bild = hinten am Monitor
function matDraw(kb) {
  return (x, W, H) => {
    x.strokeStyle = ink(.28); x.lineWidth = H * .012; rr(x, H * .01, H * .01, W - H * .02, H - H * .02, H * .05); x.stroke();
    if (!kb) return;
    const kx = W * .22, kw = W * .56, ky = H * .62, kh = H * .3;
    x.strokeStyle = ink(.4); x.lineWidth = H * .012; rr(x, kx, ky, kw, kh, H * .02); x.stroke();
    x.strokeStyle = ink(.2); x.lineWidth = H * .007;
    for (let r = 1; r < 4; r++) { x.beginPath(); x.moveTo(kx, ky + kh * r / 4); x.lineTo(kx + kw, ky + kh * r / 4); x.stroke(); }
    for (let c = 1; c < 14; c++) { x.beginPath(); x.moveTo(kx + kw * c / 14, ky); x.lineTo(kx + kw * c / 14, ky + kh); x.stroke(); }
  };
}
// Bildschirm eines Platzes: dunkler Rahmen mit Seite, darunter das Kinn (Papierfarbe); W × H in Pixeln, Oberkante = Oberkante des Monitors
function monDraw(scrFrac) {
  return (x, W, H) => {
    const bz = W * .035, sh = H * scrFrac;
    x.fillStyle = ink(.86); rr(x, 0, 0, W, sh, bz * .6); x.fill();
    x.save(); x.beginPath(); x.rect(bz, bz, W - 2 * bz, sh - 2 * bz); x.clip(); x.translate(bz, bz); themeDraw(x, W - 2 * bz, sh - 2 * bz); x.restore();
  };
}

export default function (K) {
  const { F, R, V, COL, Q, sm, mech, win, clamp, THREE, narrow: N } = K;
  const PI = Math.PI;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const DESK = c3("#dee1e6"), LEG = c3("#d7d9df"), METAL = c3("#d4d7dc"), FRAMEC = c3("#d9dce1"),
    ARM = c3("#d4d7dc"), ARM2 = c3("#ced1d6"), LIGHT = c3("#f3f6fb"), BOARD = c3("#e9ecf1"), TILE = c3("#f6f8fe"), RULE = c3("#c4c7cc");
  const IMP = { fill: "#edeff5", col: "#c9cbd1", line: 2.2, closeB: .03 };
  // Kamera auf der Kugel um das Ziel (Blickhöhe el, Gier az, Abstand dist); Handy: eigener Abstand und eigene Blickhöhe (sonst würde die Breitbild-Stellung gestreckt)
  const ring = (tgt, el, az, dist) => { const e = el * PI / 180, a = az * PI / 180; return tgt.clone().add(V(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(dist)); };
  const orbit = (tgt, el, az, dist, distN, elN, tgtN) => ({ tgt, cam: ring(tgt, el, az, dist), tgtN: tgtN || tgt, camN: ring(tgtN || tgt, elN || el + 6, az * .6, distN || dist * .7) });
  const pxD = (W, H) => Math.min(30, Math.max(27, 27 + (H - 900) / 540 * 2.5));
  const ZH = -1.0;                  // Mitte des Papierbandes (Szene 1)
  const stops = {};
  const carriers = []; // Textträger mit ihren Drucken (Prüfung: ganz im Bild oder ganz draußen)

  // Bogen: ein langer Streifen, die zwei Szenen liegen hintereinander (x von -9,5 bis 26)
  K.sheet(-9.5, 26, -13, 6.6);

  // ---------- Überschrift als Teil des Modells ----------
  // rows: Zeilen aus Wörtern {t, it}; Zeilen stehen hintereinander (hinterste zuerst), jedes Wort steht an seiner Fußlinie aus dem Bogen auf
  function heading(rows, e, zb, t0, tag, xo = 0, clk = "b", base) {
    F.part(tag, -.02, .01);
    const up = { font: "marke" }, it = { font: "marke", italic: 1 };
    const wd = w => K.measure([w.t], w.it ? it : up).tw * e;
    const sp = (K.measure(["x x"], up).tw - K.measure(["xx"], up).tw) * e;
    const prints = [], step = 1.32 * e;
    rows.forEach((row, ri) => {
      const z = zb - (rows.length - 1 - ri) * step, tot = row.reduce((a, w) => a + wd(w), 0) + sp * (row.length - 1);
      let x = xo - tot / 2;
      row.forEach((w, wi) => {
        const n = prints.length;
        prints.push(clk === "t" ? K.word([w.t], e, x, z, .15 + .23 * n, .85, { ...(w.it ? it : up), foot: 1, imprint: { ...IMP, close: .25, closeDur: .7 } })
          : K.word([w.t], e, x, z, t0 + .005 * (ri + wi), .04, { ...(w.it ? it : up), foot: 1, base, clock: "b", imprint: IMP }));
        x += wd(w) + sp;
      });
    });
    return prints;
  }
  const HE = N ? .56 : .78;

  // =====================================================================================================
  // Szene 1: Wie ich arbeite (z0 = 0)
  // =====================================================================================================
  {
    const z = v => v;
    // Überschrift: Breitbild eine Zeile, Handy zwei Zeilen
    const rows = N ? [[{ t: "Wie ich" }], [{ t: "arbeite", it: 1 }]] : [[{ t: "Wie ich" }, { t: "arbeite", it: 1 }]];
    const H1 = heading(rows, HE, z(5.0), 0, "kopf1", 0, "t");

    // Sätze wörtlich aus dem Absatz (Fallbacktext in index.html), auf ganze Sätze verteilt
    const E = .09, TOPT = { lh: 1.22, align: "center" };
    const SATZ = [
      ["Ich arbeite mit aktuellen", "KI-Werkzeugen und habe dafür", "eigene Abläufe entwickelt."],
      ["Damit schaffe ich allein Projekte,", "für die früher ein kleines Team", "nötig war, etwa Schnittstellen", "oder Datenumzüge."],
      ["Auf diese Weise arbeite ich mich", "auch schnell in fremden oder", "älteren Code ein."]
    ];
    const BALKEN = ["Entscheidungen und Verantwortung", "bleiben bei mir, und ausgeliefert", "wird nur, was ich geprüft habe."];
    const LETZTE = ["Wo es passt, bekommen Sie statt", "eines Angebots ein Konzept und", "einen klickbaren Entwurf, an dem", "Sie sehen, wie Ihre Seite wird."];
    const wid = ls => Math.max(...ls.map(l => K.measure([l], TOPT).tw)) * E;
    const NL = Math.max(...SATZ.map(l => l.length), LETZTE.length);
    const CW = Math.max(...SATZ.map(wid)) + .5, CHt = (NL - 1) * 1.22 * E + 1.4 * E + .34, CW5 = wid(LETZTE) + .5;

    // Lage: Band und Karten entlang x, Mitte des Bandes bei z = ZH; die Arme stehen hinter dem Band
    const FZ = .12, BK = .28, ZC = ZH - .1;            // Karte: Vorderseite bei ZC + FZ, Stütze bis ZC − BK
    const AX = [-8.2, -6.2, -4.2], XG = -1.5, DX = 9.05;           // Arme (und Kartenplätze), Mitte des Prüfrahmens, Weg der Karten
    const BWd = .9, BHt = .45, GW = .3, L1 = 1.5, L2 = 2.4, TH1 = 1.1, TH2 = -.15, YK = .15, FNL = .45;
    const REACH = L1 * Math.cos(TH1) + L2 * Math.cos(TH2), YEND = BHt + L1 * Math.sin(TH1) + L2 * Math.sin(TH2);
    const az = ZH - REACH, FW = (CW + .12 - GW) / 2;
    const Y0 = .008, YHOLD = YEND - .12 - CHt;                       // Kartenunterkante: im Band, im Griff

    // Papierband: flacher Streifen auf dem Bogen
    const BX0 = -8.9, BX1 = 8.1, BZ = .52;
    F.poly(R, [[BX0, ZH - BZ], [BX1, ZH - BZ], [BX1, ZH + BZ], [BX0, ZH + BZ]], c3("#e4e7ec"), .5, .0004);
    K.onFlat(R, K.decal(2400, Math.round(2400 * 2 * BZ / (BX1 - BX0)), bandDraw, BX1 - BX0, 2 * BZ, -1, .02), (BX0 + BX1) / 2, ZH, .001);

    // Drei Greifarme aus Papier (stehen hinter dem Band, greifen nach vorn): Sockel, Glied 1 (Schulter), Glied 2 (Ellbogen), breite Gabel mit zwei Zinken, die die Karte oben halten
    F.part("arme", .045, .05);
    AX.forEach((x, i) => {
      const t = .045 + .005 * i;
      const base = K.panel(R, [x - BWd / 2, az], [x + BWd / 2, az], [0, 1], t, .03, Q, { over: .05 });
      K.rect(base, 0, 0, BWd, BHt, ARM2);
      const g1 = K.panel(base, base.uv(BWd / 2 - GW / 2, BHt), base.uv(BWd / 2 + GW / 2, BHt), [0, 1], t + .02, .03, TH1 - Q, { over: .05 });
      K.rect(g1, 0, 0, GW, L1, ARM);
      const g2 = K.panel(g1, g1.uv(0, L1), g1.uv(GW, L1), [0, 1], t + .035, .035, TH2 - TH1, { over: .05 });
      K.P(g2, [[0, 0], [GW, 0], [GW, L2 - YK], [0, L2 - YK]], ARM2, [.5, .5, 0, .5]);
      K.rect(g2, -FW, L2 - YK, GW + FW, L2, ARM2);
      for (const [u0, u1] of [[-FW, -FW + .1], [GW + FW - .1, GW + FW]]) {
        const fi = K.panel(g2, g2.uv(u0, L2), g2.uv(u1, L2), [0, 1], t + .05, .025, -Q - TH2, { over: .05 });
        K.rect(fi, 0, 0, u1 - u0, FNL, ARM);
      }
      // Gelenke: Ring mit Bolzen auf Schulter und Ellbogen (die Armglieder zeigen ihre Rückseite zum Leser)
      const joint = (nd, v) => K.onPanel(nd, K.decal(128, 128, (c, W, H) => { c.strokeStyle = ink(.7); c.lineWidth = W * .07; c.beginPath(); c.arc(W / 2, H / 2, W * .38, 0, 7); c.stroke(); c.fillStyle = ink(.75); c.beginPath(); c.arc(W / 2, H / 2, W * .13, 0, 7); c.fill(); }, .24, .24, .1, .02), GW / 2, v, -1);
      joint(g1, .17); joint(g1, L1 - .17);
    });

    // Prüfrahmen hinter dem Band: zwei Pfosten und ein Balken; der ganze Satz zur Verantwortung steht auf dem Balken
    F.part("tor", .03, .05);
    const ZG = ZH - .75, FO = 1.4, PO = .28, LI = .78, HP = 1.3, FHt = HP + LI;
    const fr = K.panel(R, [XG - FO, ZG], [XG + FO, ZG], [0, -1], .075, .04, Q, { over: .05 });
    K.P(fr, [[0, 0], [PO, 0], [PO, HP], [0, HP]], FRAMEC, [.5, .5, 0, .5]);
    K.P(fr, [[2 * FO - PO, 0], [2 * FO, 0], [2 * FO, HP], [2 * FO - PO, HP]], FRAMEC, [.5, .5, 0, .5]);
    K.P(fr, [[0, HP], [2 * FO, HP], [2 * FO, FHt], [0, FHt]], FRAMEC);
    const T4 = K.print(BALKEN, E, .11, TOPT);
    K.onPanel(fr, T4, FO, HP + LI / 2, 1);

    // Karten: bewegte Papierkärtchen (Vorderseite mit Satz, Stütze dahinter, wie eine Tischkarte), Text und Haken laufen mit
    const edge = geo => new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .38, depthWrite: false }));
    const makeCard = (W, lines) => {
      const g = new THREE.Group(), fg = new THREE.BoxGeometry(W, CHt, .022), front = new THREE.Mesh(fg, K.paperMaterial("#f3f6fb"));
      front.position.set(0, CHt / 2, FZ); front.add(edge(fg));
      const sl = Math.hypot(CHt - .02, FZ + BK), sg = new THREE.BoxGeometry(W * .96, sl, .016), st = new THREE.Mesh(sg, K.paperMaterial("#e2e5ea"));
      st.position.set(0, (CHt + .01) / 2, (FZ - BK) / 2); st.rotation.x = Math.atan2(FZ + BK, CHt - .02); st.add(edge(sg));
      g.add(front, st); K.add(g);
      const pr = K.print(lines, E, 0, TOPT);
      return { g, pr, W };
    };
    // Lage eines Kartentextes aus der Gruppenlage (Mitte der Vorderseite)
    const place = (cd, x, y) => { cd.g.position.set(x, y, ZC); cd.pr.mesh.position.set(x, y + CHt / 2, ZC + FZ + .0125); };
    const cards = SATZ.map((ls, i) => {
      const cd = makeCard(CW, ls);
      cd.app = .132 + .004 * i; cd.drop = .14 + .035 * i;
      const ck = K.decal(128, 128, checkDraw, .34, .34, 0, .01);
      cd.ck = ck;
      return cd;
    });
    const DD = .02, TR0 = .255, TR1 = .305, XPASS = XG + FO - .35;
    const cards5 = makeCard(CW5, LETZTE), X5 = AX[2] + DX + CW / 2 + .42 + CW5 / 2, DR5 = .31;
    cards.forEach((cd, i) => {
      cd.pr.sched = b => sm((b - cd.app) / .01);
      cd.ck.sched = b => cd.ckOn ? 1 : 0;
      place(cd, AX[i], Y0);
      cd.ck.mesh.position.set(AX[i] + CW / 2 - .1, Y0 + CHt - .1, ZC + FZ + .013);
      for (const m of [cd.g, cd.pr.mesh, cd.ck.mesh]) m.updateMatrix();
    });
    cards5.pr.sched = b => sm((b - DR5) / .008);
    place(cards5, X5, Y0); cards5.pr.mesh.updateMatrix();
    K.anim(b => {
      const p = sm(clamp((b - TR0) / (TR1 - TR0), 0, 1));
      cards.forEach((cd, i) => {
        const k0 = sm((b - cd.app) / .008);
        cd.g.visible = k0 > 0;
        let y = YHOLD;
        if (b > cd.drop) { const d = clamp((b - cd.drop) / DD, 0, 1); y = YHOLD - (YHOLD - Y0) * d * d; }
        const x = AX[i] + DX * p;
        place(cd, x, y); cd.g.scale.setScalar(Math.max(.001, k0));
        // roter Haken, sobald die Karte den Rahmen ganz verlassen hat
        const kc = sm((x - XPASS) / .5);
        cd.ckOn = kc > .02;
        cd.ck.mesh.position.set(x + CW / 2 - .1, y + CHt - .1, ZC + FZ + .013);
        cd.ck.mesh.scale.setScalar(Math.max(.001, kc * (1 + .3 * Math.sin(clamp((x - XPASS) / .5, 0, 1) * PI))));
      });
      // letzte Karte: fällt am Bandende auf
      const d5 = clamp((b - DR5) / .02, 0, 1);
      cards5.g.visible = d5 > 0;
      place(cards5, X5, Y0 + 2.2 * (1 - mech(d5, .05)));
    });

    // Konstruktionsphase (seite/): Gerüst von Rahmen und Armen vor dem Hochklappen, Bleistiftspur (Rahmen mit Text nur Eckmarken)
    F.geruest({ tags: ["tor", "arme"], t0: .02, t1: .05, du: .02, a: .5 });
    F.spur({ tags: ["tor"], quiet: [fr], a: .3 });

    // Lesestellen: gleiche Schriftgröße, gleiche Blickhöhe, die Kamera gleitet nur nach rechts
    carriers.push({ n: "h1", nodes: [], prints: H1 }, { n: "T4", nodes: [fr], prints: [T4] });
    cards.forEach((cd, i) => carriers.push({ n: "K" + (i + 1), nodes: [], prints: [cd.pr] }));
    carriers.push({ n: "K5", nodes: [], prints: [cards5.pr] });
    stops.h1 = { prints: H1, frontal: true, tilt: 4, ntilt: 4, sy: .3, nsy: .3, px: (W, H) => H * .075, pxN: 38, fit: .74, fitN: .86, b: .06 };
    const lese = (pr, b, sy = .3) => ({ prints: [pr], px: pxD, frontal: true, tilt: 7, ntilt: 7, sx: 0, sy, nsy: sy, b });
    stops.t1 = lese(cards[0].pr, .172);
    stops.t2 = lese(cards[1].pr, .207);
    stops.t3 = lese(cards[2].pr, .242);
    stops.f = { ...lese(T4, .315, .1), tilt: 13, ntilt: 13, carrier: [fr] };
    stops.t5 = lese(cards5.pr, .352);
  }

  // =====================================================================================================
  // Szene 2: Zusammenarbeit (x0 = 17)
  // =====================================================================================================
  const OX2 = 17;
  {
    const z = v => v;
    const rows = [[{ t: "Zusammenarbeit" }]];
    const H2 = heading(rows, HE, z(4.9), .395, "kopf2", OX2);

    const HT = 1.25, ZF = z(1.3), ZB = z(-1.3), LW = .18, AP = .5, X0 = OX2 - 4.4, X1 = OX2 + 4.4;
    const MW = 1.5, NK = .42, CHN = .26, SHT = .8, MZ = z(.2), MH = NK + CHN + SHT;
    const down = { own: R, over: .035 };
    // Teamtisch: drei Plätze, Zarge leer
    F.part("tisch", .36, .05);
    const top = F.lift(R, HT, .40, .05, { over: .02 });
    F.poly(top, [[X0, ZF], [X1, ZF], [X1, ZB], [X0, ZB]], DESK, .5);
    const lt = .40 + .05 * .55;
    for (const [p, q] of [[X0, X0 + LW], [X1 - LW, X1]]) {
      K.rect(K.panel(top, [p, ZF], [q, ZF], [0, 1], lt, .05, -Q, down), 0, 0, LW, HT, LEG);
      K.rect(K.panel(top, [p, ZB], [q, ZB], [0, -1], lt + .004, .05, -Q, down), 0, 0, LW, HT, LEG);
    }
    K.rect(K.panel(top, [X0, ZF], [X0, ZF - LW], [-1, 0], lt + .002, .05, -Q, down), 0, 0, LW, HT, LEG);
    K.rect(K.panel(top, [X0, ZB + LW], [X0, ZB], [-1, 0], lt + .012, .05, -Q, down), 0, 0, LW, HT, LEG);
    K.rect(K.panel(top, [X1, ZF], [X1, ZF - LW], [1, 0], lt + .002, .05, -Q, down), 0, 0, LW, HT, LEG);
    K.rect(K.panel(top, [X1, ZB + LW], [X1, ZB], [1, 0], lt + .012, .05, -Q, down), 0, 0, LW, HT, LEG);
    const apron = K.panel(top, [X0 + LW, ZF], [X1 - LW, ZF], [0, 1], lt + .01, .045, -Q, down);
    K.rect(apron, 0, 0, X1 - X0 - 2 * LW, AP, LEG);

    // drei Arbeitsplätze: Monitor mit Seite, Platzset
    function monitor(xk, t0) {
      const m = K.panel(top, [xk - MW / 2, MZ], [xk + MW / 2, MZ], [0, -1], t0, .04, Q, { over: .05 });
      K.P(m, [[MW / 2 - .16, 0], [MW / 2 + .16, 0], [MW / 2 + .16, NK], [MW / 2 - .16, NK]], METAL, [.5, .5, 0, .5]);
      K.P(m, [[0, NK], [MW, NK], [MW, MH], [0, MH]], LIGHT);
      return m;
    }
    const monDecal = (m, on) => K.onPanel(m, K.decal(Math.round(MW * 400), Math.round((CHN + SHT) * 400), monDraw(SHT / (CHN + SHT)), MW, CHN + SHT, on, .02), MW / 2, NK + (CHN + SHT) / 2, 1);
    const matDecal = (xk, on, kb) => K.onFlat(top, K.decal(Math.round(1.9 * 400), Math.round(.9 * 400), matDraw(kb), 1.9, .9, on, .02), xk, z(.78));
    const PL = [-2.7, 0, 2.7].map(v => OX2 + v);
    F.part("monitore", .37, .05);
    const mons = PL.map((xk, i) => { const m = monitor(xk, .47 + .008 * i); monDecal(m, .50 + .01 * i); matDecal(xk, .50 + .01 * i, i !== 1); return m; });

    // Schreibtischdinge (Bauteile aus schreibtisch.js, helle Papiertöne, kein Text): je Platz eine andere Mischung
    const HELL = {
      lampe: { base: "#c5c8cd", baseTop: "#d3d6db", stem: "#c9ccd1", shade: "#e7eaef" },
      becher: { side: "#cdcfd5", top: "#9fa1a6", pens: ["#f1f3f9", "#bfc1c7", "#dadde2", "#dfe2e7"] }
    };
    const P1 = PL[0], P2 = PL[1], P3 = PL[2], ZM = z(.78);
    // Platz 1 (links): Pflanze am Rand, Tasse und Maus am Platzset
    dtPflanze(K, { top, cx: OX2 - 3.83, cz: z(0), t: [.50, .05], tl: [.545, .04], tag: "d1pflanze", tagL: "d1blaetter" });
    dtTasse(K, { top, cx: P1 - .82, cz: ZM, t: [.535, .045], th: [.575, .02], tag: "d1tasse", tagH: "d1henkel" });
    dtMaus(K, { top, cx: P1 + .8, cz: ZM + .02, t: [.55, .025], tag: "d1maus" });
    // Platz 2 (Mitte): Lampe links daneben, Tastatur auf dem Platzset, Maus, Stiftebecher rechts daneben
    dtLampe(K, { top, cx: OX2 - 1.35, cz: z(-.1), tb: [.54, .025], ts: [.555, .045], ta: [.60, .03], tsh: [.628, .03], tag: "d2lampe", col: HELL.lampe });
    dtTastatur(K, { top, x0: P2 - .62, x1: P2 + .5, z0: ZM - .22, z1: ZM + .22, t: [.545, .035], tag: "d2tastatur" });
    dtMaus(K, { top, cx: P2 + .82, cz: ZM + .02, t: [.565, .025], tag: "d2maus" });
    // Platz 3 (rechts): Tasse neben dem Monitor, Stiftebecher links am Platzset, Pflanze am Rand
    dtTasse(K, { top, cx: OX2 + 1.4, cz: z(.12), t: [.58, .045], th: [.62, .02], tag: "d3tasse", tagH: "d3henkel" });
    dtBecher(K, { top, cx: P3 - .78, cz: ZM + .05, t: [.60, .045], tp: [.64, .025], tag: "d3becher", tagP: "d3stifte", col: HELL.becher });
    dtPflanze(K, { top, cx: OX2 + 3.83, cz: z(0), t: [.585, .05], tl: [.625, .04], tag: "d3pflanze", tagL: "d3blaetter" });

    // Projekttafel aus Papier hinter den Plätzen: drei Spalten, Sätze wörtlich aus dem Absatz (Fallbacktext in index.html), ganze Sätze auf Karten
    const E = .105, TT = { lh: 1.22 }, CWb = 2.0, GAPB = .18, TPAD = .12;
    const SP = [
      { h: "Erledigt", cards: [["Agenturarbeit kenne ich von", "innen: sechs Jahre bei Tangram,", "danach als freier Partner der", "Runden Group."]] },
      { h: "In Arbeit", cards: [
        ["Ich steige in laufende", "Projekte ein, arbeite mich in", "bestehende Themes und Plugins", "ein und halte mich an Ihre", "Abläufe und Werkzeuge."],
        ["Sie haben ein eigenes Webteam", "und brauchen für eine Weile", "Verstärkung? Dann arbeite ich", "auch angestellt in Teilzeit mit,", "vollständig remote und gern", "befristet."]] },
      { h: "Als Nächstes", cards: [
        ["Ob Projekt, Betreuung oder", "Mitarbeit auf Zeit: Derzeit", "habe ich Kapazität frei."],
        ["Konditionen nenne ich Ihnen", "auf Anfrage."]] }
    ];
    const cardH = ls => ((ls.length - 1) * 1.22 + 1.18 + .2) * E + 2 * TPAD;
    const colH = sp => sp.cards.reduce((a, ls, i) => a + cardH(ls) + (i ? GAPB : 0), 0);
    const HDR = .9, FB0 = 2.45, BOTP = .25, FB1 = FB0 + HDR + Math.max(...SP.map(colH)) + BOTP;
    const COLW = 2.55, MARG = .5, BW2 = 3 * COLW + 2 * MARG, PO2 = .3, ZBd = z(-2.7);
    F.part("tafel", .44, .06);
    const bd = K.panel(R, [OX2 - BW2 / 2, ZBd], [OX2 + BW2 / 2, ZBd], [0, -1], .46, .05, Q, { over: .05 });
    K.P(bd, [[0, 0], [PO2, 0], [PO2, FB0], [0, FB0]], FRAMEC, [.5, .5, 0, .5]);
    K.P(bd, [[BW2 - PO2, 0], [BW2, 0], [BW2, FB0], [BW2 - PO2, FB0]], FRAMEC, [.5, .5, 0, .5]);
    K.P(bd, [[0, FB0], [BW2, FB0], [BW2, FB1], [0, FB1]], BOARD);
    const colPrints = [], colTimes = [.52, .54, .56];
    SP.forEach((sp, ci) => {
      const uc = MARG + COLW * (ci + .5), ons = colTimes[ci];
      const hp = K.print([sp.h], .2, ons, { font: "marke" }); K.onPanel(bd, hp, uc, FB1 - .5, 1);
      K.rect(bd, uc - CWb / 2, FB1 - .82, uc + CWb / 2, FB1 - .8, RULE, 0, .0008);
      const prs = [hp]; let v = FB1 - HDR;
      sp.cards.forEach((ls, k) => {
        const h = cardH(ls);
        K.rect(bd, uc - CWb / 2, v - h, uc + CWb / 2, v, TILE, .5, .0008);
        const pr = K.print(ls, E, ons + .006 * (k + 1), TT);
        K.onPanel(bd, pr, uc, v - h / 2, 1);
        prs.push(pr); v -= h + GAPB;
      });
      colPrints.push(prs);
      carriers.push({ n: "tafel" + ci, nodes: [bd], prints: prs });
    });

    // Konstruktionsphase (seite/): Gerüst je Tischteil kurz vor dem Heben, Bleistiftspur (Zarge, Tafel und Monitore nur Eckmarken)
    F.geruest({ tags: ["tisch", "monitore"], t0: .365, t1: .4, du: .02, a: .5 });
    F.geruest({ tags: ["tafel"], t0: .41, t1: .45, du: .02, a: .5 });
    F.spur({ tags: ["tisch", "monitore", "tafel"], quiet: [apron, bd, ...mons], a: .3 });

    carriers.push({ n: "h2", nodes: [], prints: H2 });
    stops.h2 = { prints: H2, frontal: true, tilt: 4, ntilt: 4, sy: .3, nsy: .3, px: (W, H) => H * .075, pxN: 38, fit: .74, fitN: .86, b: .43 };
    // Lesestellen: Spalte für Spalte von links nach rechts, gleiche Schriftgröße (e0), Kamera frontal
    const spalte = (i, b) => ({ prints: colPrints[i], e0: E, px: pxD, frontal: true, tilt: 6, ntilt: 6, sx: 0, sy: .25, nsy: .25, fit: .9, fitN: .95, b });
    stops.c1 = spalte(0, .585); stops.c2 = spalte(1, .625); stops.c3 = spalte(2, .665);
  }

  // ---------- Roter Faden: vor dem Tisch entlang, endet vor dem rechten Platz ----------
  const thread = { pts: [V(OX2 - 4.6, .012, 3.0), V(OX2 - 2.3, .012, 3.0), V(OX2, .012, 3.0), V(OX2 + 2.3, .012, 3.0), V(OX2 + 4.6, .012, 3.0)], t0: .46, t1: .60 };

  // ---------- Kamerabahn ----------
  const S = stops;
  const keys = [
    // Szene 1: Überschrift steht (nach der Zeit), Bastellinien zeichnen sich, Kamera hebt sich über den Bogen, Arme und Rahmen klappen hoch, Karten fahren durch
    { w: .4, stop: S.h1 },
    { w: .5, slow: 1, b: .09, ...orbit(V(-3.5, .8, ZH - 1.5), 34, 6, 24, 21, 44, V(-3.5, .8, ZH - 2)) },
    { w: .7, stop: S.t1 },
    { w: .6, stop: S.t2 },
    { w: .6, stop: S.t3 },
    { w: .8, stop: S.f },
    { w: .8, stop: S.t5 },
    { w: .7, slow: 1, b: .385, ...orbit(V(9, .5, -2), 30, 0, 24, 30, 40) },
    // Szene 2
    { w: .9, stop: S.h2 },
    { w: .75, slow: 1, b: .50, ...orbit(V(OX2, 2.3, -1.2), 26, 0, 21, 28, 38) },
    { w: .9, stop: S.c1 },
    { w: .8, stop: S.c2 },
    { w: .8, stop: S.c3 },
    // Schluss: die ganze Szene, Tafel und Plätze mit ihren Schreibtischdingen, bevor die Karte kommt
    { w: .9, slow: 1, b: .70, ...orbit(V(OX2, 2.0, -.8), 24, 0, 20, 26, 38) }
  ];
  Object.entries(S).forEach(([k, v]) => { v.name = k; });
  // Raster (seite/) für „Wie ich arbeite“; „Zusammenarbeit“ setzt in der Szenenfolge ein eigenes Zeitfenster
  const grid = { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .05 }; // weg vor der ersten Lesestelle (t1, b .172)
  return { fov: 32, fovN: 44, track: 1250, grid, stops: Object.values(S), keys, thread, carriers };
}
