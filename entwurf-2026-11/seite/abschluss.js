// Abschluss: Wie ich arbeite, Für Agenturen, Kontakt (drei Szenen auf einem langen Bogen, eine Kamerabahn).
// Jedes Konstrukt tut, was im Absatz steht (Drehbuch: DREHBUCH.md):
//  1  Wie ich arbeite: drei Helferarme liefern Teile zu, jedes Teil passiert den Prüfrahmen, erst danach rastet es ein (roter Haken).
//  2  Für Agenturen: ein Teamtisch mit drei laufenden Plätzen; ein vierter Platz entsteht exakt im vorhandenen Raster.
//  3  Kontakt: die rote Linie endet an einem Briefumschlag, der sich aufklappt; Mail, Telefon und LinkedIn (kein Lebenslauf-PDF) stehen auf Aufstellkarten.
// Alle Bauteile liegen in Ruhe flach auf dem Bogen (Faltplan) und klappen mit dem Baufortschritt b hoch.
// b-Fenster: Szene 1 0 … .36, Szene 2 .36 … .68, Szene 3 .68 … 1.
// Kopie von entwurf-2026-11/abschluss/abschluss.js für die durchgehende Seite (entwurf-2026-11/seite/). Die Seite zeigt das Modul zweimal,
// je mit Ausschnitt des Bogens: „Wie ich arbeite“ (x bis 8,5, b 0 … .36) und nach Werdegang und Stimmen „Für Agenturen“ mit „Kontakt“
// (x ab 8,5, b .37 … 1). Ergänzt: Konstruktionsphase (Raster, Gerüst je Bauabschnitt, Bleistiftspur).
const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235", INKC = "#303033";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Druckbilder ----------
// Teil 1: Schnittstelle (zwei Stecker treffen sich), Teil 2: Datenumzug (Datenbank, Pfeil, Datenbank), Teil 3: Website
const GLYPH = [
  (x, W, H) => {
    x.strokeStyle = ink(.6); x.lineWidth = W * .035; x.lineCap = "round"; x.lineJoin = "round";
    rr(x, W * .08, H * .3, W * .26, H * .4, W * .04); x.stroke();
    rr(x, W * .66, H * .3, W * .26, H * .4, W * .04); x.stroke();
    x.beginPath(); x.moveTo(W * .34, H * .42); x.lineTo(W * .66, H * .42); x.moveTo(W * .6, H * .36); x.lineTo(W * .66, H * .42); x.lineTo(W * .6, H * .48); x.stroke();
    x.beginPath(); x.moveTo(W * .66, H * .58); x.lineTo(W * .34, H * .58); x.moveTo(W * .4, H * .52); x.lineTo(W * .34, H * .58); x.lineTo(W * .4, H * .64); x.stroke();
  },
  (x, W, H) => {
    x.strokeStyle = ink(.6); x.lineWidth = W * .035; x.lineCap = "round"; x.lineJoin = "round";
    const db = cx => { const w = W * .2, t = H * .28, b = H * .72, e = H * .06;
      x.beginPath(); x.ellipse(cx, t, w, e, 0, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.moveTo(cx - w, t); x.lineTo(cx - w, b); x.ellipse(cx, b, w, e, 0, Math.PI, 0, true); x.lineTo(cx + w, t); x.stroke();
      x.beginPath(); x.ellipse(cx, (t + b) / 2, w, e, 0, 0, Math.PI); x.stroke(); };
    db(W * .22); db(W * .78);
    x.beginPath(); x.moveTo(W * .42, H * .5); x.lineTo(W * .58, H * .5); x.moveTo(W * .52, H * .43); x.lineTo(W * .58, H * .5); x.lineTo(W * .52, H * .57); x.stroke();
  },
  (x, W, H) => {
    x.strokeStyle = ink(.6); x.lineWidth = W * .035; x.lineCap = "round"; x.lineJoin = "round";
    rr(x, W * .1, H * .2, W * .8, H * .6, W * .04); x.stroke();
    x.beginPath(); x.moveTo(W * .1, H * .36); x.lineTo(W * .9, H * .36); x.stroke();
    x.fillStyle = ink(.45); rr(x, W * .2, H * .48, W * .32, H * .06, W * .02); x.fill(); rr(x, W * .2, H * .6, W * .5, H * .06, W * .02); x.fill();
  }
];
function checkDraw(x, W, H) {
  x.fillStyle = RED; x.beginPath(); x.arc(W / 2, H / 2, W * .46, 0, Math.PI * 2); x.fill();
  x.strokeStyle = "#fff"; x.lineWidth = W * .1; x.lineCap = "round"; x.lineJoin = "round";
  x.beginPath(); x.moveTo(W * .3, H * .52); x.lineTo(W * .45, H * .66); x.lineTo(W * .72, H * .36); x.stroke();
}
// Website-Layout für die Monitore der Teamplätze (ein Theme, überall gleich)
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
// Platzset: Rahmen und Tastatur (vorn) im Raster, 1,9 × 0,9; oben im Bild = hinten am Monitor
function matDraw(x, W, H) {
  x.strokeStyle = ink(.28); x.lineWidth = H * .012; rr(x, H * .01, H * .01, W - H * .02, H - H * .02, H * .05); x.stroke();
  const kx = W * .22, kw = W * .56, ky = H * .62, kh = H * .3;
  x.strokeStyle = ink(.4); x.lineWidth = H * .012; rr(x, kx, ky, kw, kh, H * .02); x.stroke();
  x.strokeStyle = ink(.2); x.lineWidth = H * .007;
  for (let r = 1; r < 4; r++) { x.beginPath(); x.moveTo(kx, ky + kh * r / 4); x.lineTo(kx + kw, ky + kh * r / 4); x.stroke(); }
  for (let c = 1; c < 14; c++) { x.beginPath(); x.moveTo(kx + kw * c / 14, ky); x.lineTo(kx + kw * c / 14, ky + kh); x.stroke(); }
}
// Bildschirm eines Platzes: dunkler Rahmen mit Seite, darunter das Kinn (Papierfarbe); W × H in Pixeln, Oberkante = Oberkante des Monitors
function monDraw(scrFrac) {
  return (x, W, H) => {
    const bz = W * .035, sh = H * scrFrac;
    x.fillStyle = ink(.86); rr(x, 0, 0, W, sh, bz * .6); x.fill();
    x.save(); x.beginPath(); x.rect(bz, bz, W - 2 * bz, sh - 2 * bz); x.clip(); x.translate(bz, bz); themeDraw(x, W - 2 * bz, sh - 2 * bz); x.restore();
  };
}
// Innenseite der Umschlagklappe: feines Sicherheitsmuster, auf das Dreieck begrenzt
function liningDraw(x, W, H) {
  x.beginPath(); x.moveTo(0, H); x.lineTo(W, H); x.lineTo(W / 2, 0); x.closePath(); x.clip();
  x.strokeStyle = ink(.1); x.lineWidth = Math.max(1, W * .002);
  for (let i = -H; i < W + H; i += W * .028) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H, H); x.stroke(); }
}
// Aufstellkarte eines Kontaktwegs: Etikett klein, Wert groß unterstrichen, roter Punkt davor (zeigt „anklickbar“). em: Höhe 1 em in Weltmaßen
function cardDraw(label, value, CW, CH, em) {
  const pxu = 520;
  return {
    wpx: Math.round(CW * pxu), hpx: Math.round(CH * pxu),
    draw: (x, W, H) => {
      const u = pxu * em, padX = .2 * pxu;
      x.textBaseline = "alphabetic";
      x.fillStyle = "#66666a"; x.font = `500 ${u * .68}px "Schibsted Grotesk"`;
      x.fillText(label, padX, H * .3);
      x.fillStyle = INKC; x.font = `500 ${u}px "Schibsted Grotesk"`;
      const yb = H * .66, w = x.measureText(value).width, xv = padX + u * .55;
      x.fillText(value, xv, yb);
      x.fillStyle = RED; x.beginPath(); x.arc(padX + u * .16, yb - u * .3, u * .13, 0, Math.PI * 2); x.fill();
      x.strokeStyle = ink(.7); x.lineWidth = Math.max(2, u * .045); x.beginPath(); x.moveTo(xv, yb + u * .16); x.lineTo(xv + w, yb + u * .16); x.stroke();
    }
  };
}

export default function (K) {
  const { F, R, V, COL, Q, sm, mech, win, clamp, THREE, narrow: N } = K;
  const PI = Math.PI;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const DESK = c3("#e8e1d2"), LEG = c3("#e1d9c9"), METAL = c3("#dcd7cd"), SIGN = c3("#f6f3ec"), FRAMEC = c3("#e4dccb"),
    ARM = c3("#dcd7cd"), ARM2 = c3("#d6d1c7"), BODY = c3("#efe6d2"), FLAPC = c3("#e8dcc4"), CARD = c3("#f8f6f1"), DECK = c3("#ece8de"), LIGHT = c3("#f8f6f1");
  const IMP = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2, closeB: .03 }, IMP_T = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2, close: .25, closeDur: .7 };
  // Kamera auf der Kugel um das Ziel (Blickhöhe el, Gier az, Abstand dist); Handy: eigener Abstand und eigene Blickhöhe (sonst würde die Breitbild-Stellung gestreckt)
  const ring = (tgt, el, az, dist) => { const e = el * PI / 180, a = az * PI / 180; return tgt.clone().add(V(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(dist)); };
  const orbit = (tgt, el, az, dist, distN, elN, tgtN) => ({ tgt, cam: ring(tgt, el, az, dist), tgtN: tgtN || tgt, camN: ring(tgtN || tgt, elN || el + 6, az * .6, distN || dist * .7) });
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const stops = {};
  const carriers = []; // Textträger mit ihren Drucken (Prüfung: ganz im Bild oder ganz draußen)

  // Bogen: ein langer Streifen, die drei Szenen liegen hintereinander (x von -9,5 bis 46)
  K.sheet(-9.5, 46, -13, 6.6);

  // ---------- Überschrift als Teil des Modells ----------
  // rows: Zeilen aus Wörtern {t, it}; Zeilen stehen hintereinander (hinterste zuerst), jedes Wort steht an seiner Fußlinie aus dem Bogen auf
  function heading(rows, e, zb, t0, tag, xo = 0, clk = "b") {
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
        prints.push(clk === "t" ? K.word([w.t], e, x, z, .15 + .23 * n, .85, { ...(w.it ? it : up), foot: 1, imprint: IMP_T })
          : K.word([w.t], e, x, z, t0 + .005 * (ri + wi), .04, { ...(w.it ? it : up), foot: 1, clock: "b", imprint: IMP }));
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
    const LX = [-1.6, 0, 1.6];
    // Überschrift: Breitbild eine Zeile, Handy zwei Zeilen
    const rows = N ? [[{ t: "Wie ich" }], [{ t: "arbeite", it: 1 }]] : [[{ t: "Wie ich" }, { t: "arbeite", it: 1 }]];
    const H1 = heading(rows, HE, z(5.0), 0, "kopf1", 0, "t");

    // Schild links: Satz 1 (Werkzeuge und Abläufe); Schild rechts: Satz 2 (Lieferschein neben der Bahn)
    F.part("pult", 0, .05);
    const SW = 3.0, SHH = 1.3;
    const sl = K.panel(R, [-4.1 - SW / 2, z(1.0)], [-4.1 + SW / 2, z(1.0)], [0, -1], .065, .035, Q, { over: .05 });
    K.rect(sl, 0, 0, SW, SHH, SIGN);
    const T1 = K.print(["Ich arbeite mit aktuellen", "KI-Werkzeugen und habe dafür", "eigene Abläufe entwickelt."], .145, .11, { align: "center", lh: 1.2 });
    K.onPanel(sl, T1, SW / 2, SHH / 2, 1);

    // Drei Greifarme aus Papier: Sockel, Glied 1 (Schulter), Glied 2 (Ellbogen), Gabel mit zwei Zinken, die das Teil halten
    F.part("arme", .005, .05);
    const BWd = .9, BHt = .45, GW = .3, L1 = 1.5, L2 = 2.4, TH1 = 1.1, TH2 = -.15, YK = .15, FNL = .5, az = z(1.2);
    LX.forEach((x, i) => {
      const t = .06 + .006 * i;
      const base = K.panel(R, [x - BWd / 2, az], [x + BWd / 2, az], [0, -1], t, .03, Q, { over: .05 });
      K.rect(base, 0, 0, BWd, BHt, ARM2);
      const g1 = K.panel(base, base.uv(BWd / 2 - GW / 2, BHt), base.uv(BWd / 2 + GW / 2, BHt), [0, -1], t + .02, .03, TH1 - Q, { over: .05 });
      K.rect(g1, 0, 0, GW, L1, ARM);
      const g2 = K.panel(g1, g1.uv(0, L1), g1.uv(GW, L1), [0, -1], t + .035, .035, TH2 - TH1, { over: .05 });
      K.P(g2, [[0, 0], [GW, 0], [GW, L2 - YK], [0, L2 - YK]], ARM2, [.5, .5, 0, .5]);
      K.rect(g2, -.35, L2 - YK, GW + .35, L2, ARM2);
      for (const [u0, u1] of [[-.35, -.25], [GW + .25, GW + .35]]) {
        const fi = K.panel(g2, g2.uv(u0, L2), g2.uv(u1, L2), [0, -1], t + .05, .025, -Q - TH2, { over: .05 });
        K.rect(fi, 0, 0, u1 - u0, FNL, ARM);
      }
      // Gelenke: Ring mit Bolzen auf Schulter und Ellbogen
      const joint = (nd, v) => K.onPanel(nd, K.decal(128, 128, (c, W, H) => { c.strokeStyle = ink(.7); c.lineWidth = W * .07; c.beginPath(); c.arc(W / 2, H / 2, W * .38, 0, 7); c.stroke(); c.fillStyle = ink(.75); c.beginPath(); c.arc(W / 2, H / 2, W * .13, 0, 7); c.fill(); }, .24, .24, .1, .02), GW / 2, v, 1);
      joint(g1, .17); joint(g1, L1 - .17);
    });
    const ZH = az - L1 * Math.cos(TH1) - L2 * Math.cos(TH2), HOLD = BHt + L1 * Math.sin(TH1) + L2 * Math.sin(TH2) - .3;

    F.part("schild", .015, .05);
    const sr = K.panel(R, [4.1 - SW / 2, z(-.4)], [4.1 + SW / 2, z(-.4)], [0, -1], .09, .035, Q, { over: .05 });
    K.rect(sr, 0, 0, SW, SHH, SIGN);
    const T2 = K.print(["Damit schaffe ich allein Projekte,", "für die früher ein kleines Team", "nötig war, etwa Schnittstellen", "oder Datenumzüge."], .14, .125, { align: "center", lh: 1.22 });
    K.onPanel(sr, T2, SW / 2, SHH / 2, 1);

    // Prüfrahmen: zwei Pfosten und ein Sturz; der ganze Satz 3 steht auf dem Sturz
    F.part("rahmen", .02, .05);
    const FO = 2.5, FHt = 2.4, PO = .3, LI = 1.0, fz = z(-5.0), HP = FHt - LI;
    const fr = K.panel(R, [-FO, fz], [FO, fz], [0, -1], .10, .04, Q, { over: .05 });
    K.P(fr, [[0, 0], [PO, 0], [PO, HP], [0, HP]], FRAMEC, [.5, .5, 0, .5]);
    K.P(fr, [[2 * FO - PO, 0], [2 * FO, 0], [2 * FO, HP], [2 * FO - PO, HP]], FRAMEC, [.5, .5, 0, .5]);
    K.P(fr, [[0, HP], [2 * FO, HP], [2 * FO, FHt], [0, FHt]], FRAMEC);
    const T3 = K.print(["Entscheidungen und Verantwortung", "bleiben bei mir, und ausgeliefert", "wird nur, was ich geprüft habe."], .2, .14, { align: "center", lh: 1.2 });
    K.onPanel(fr, T3, FO, HP + LI / 2, 1);

    // Plätze im Bogen hinter dem Rahmen
    const ZS = z(-9.4);
    K.onFlat(R, K.decal(1200, 300, (x, W, H) => {
      x.strokeStyle = ink(.4); x.lineWidth = 5; x.lineCap = "round";
      LX.forEach(lx => {
        const cx = W / 2 + lx / 4.8 * W, s = .86 / 4.8 * W, hh = s * .5;
        const c = s * .2;
        for (const [sx2, sy2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const px = cx + sx2 * hh, py = H / 2 + sy2 * hh; x.beginPath(); x.moveTo(px - sx2 * c, py); x.lineTo(px, py); x.lineTo(px, py - sy2 * c); x.stroke(); }
      });
    }, 4.8, 1.2, .16), 0, ZS);

    // Teile: kommen aus der Hand, laufen durch den Prüfrahmen (roter Haken), rasten im Platz ein
    const TS = .76, TT = .12, TCOL = ["#f1ece0", "#ebe6da", "#f4efe6"], S0 = [.15, .19, .23];
    LX.forEach((x, i) => {
      const g = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(TS, TT, TS), K.paperMaterial(TCOL[i]));
      box.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .38, depthWrite: false })));
      g.add(box);
      const gl = K.decal(256, 256, GLYPH[i], TS * .86, TS * .86, -1); gl.mesh.rotation.x = -Q; gl.mesh.position.y = TT / 2 + .004; g.add(gl.mesh);
      const ck = K.decal(128, 128, checkDraw, .3, .3, -1); ck.mesh.rotation.x = -Q; ck.mesh.position.set(TS / 2 - .17, TT / 2 + .008, TS / 2 - .17); g.add(ck.mesh);
      K.add(g);
      const s = S0[i], DROP = .02, L1 = .045, PAUSE = .02, L2 = .045;
      K.anim(b => {
        // Greifer hält das Teil, sobald die Hand steht
        const k0 = sm((b - (.133 + .006 * i)) / .01);
        g.visible = k0 > 0;
        let y = HOLD, zz = ZH, ck0 = 0;
        if (b > s) {
          const d = clamp((b - s) / DROP, 0, 1);
          y = HOLD - (HOLD - TT / 2) * d * d;
          const a = clamp((b - s - DROP) / L1, 0, 1);
          zz = ZH + (fz - ZH) * sm(a);
          const c2 = clamp((b - s - DROP - L1 - PAUSE) / L2, 0, 1);
          if (c2 > 0) zz = fz + (ZS - fz) * mech(c2, .03);
          ck0 = sm((b - (s + DROP + L1 + .004)) / .012);
        }
        g.position.set(x, y, zz);
        g.scale.setScalar(k0);
        ck.mesh.scale.setScalar(Math.max(.001, ck0 * (1 + .25 * Math.sin(clamp((b - (s + DROP + L1 + .004)) / .02, 0, 1) * PI))));
      });
    });

    // Konstruktionsphase (seite/): Gerüst von Schildern, Armen und Prüfrahmen vor dem Hochklappen, Bleistiftspur (Schilder mit Text nur Eckmarken)
    F.geruest({ tags: ["pult", "schild", "rahmen", "arme"], t0: .02, t1: .06, du: .02, a: .5 });
    F.spur({ tags: ["pult", "schild", "rahmen"], quiet: [sl, sr, fr], a: .3 });

    // Lesestellen
    carriers.push({ n: "h1", nodes: [], prints: H1 });
    stops.h1 = { prints: H1, pitch: 9, sy: 0, nsy: 0, px: (W, H) => H * .075, pxN: 38, fit: .74, fitN: .86, b: .06 };
    carriers.push({ n: 'T1', nodes: [sl], prints: [T1] }, { n: 'T2', nodes: [sr], prints: [T2] }, { n: 'T3', nodes: [fr], prints: [T3] });
    stops.t1 = { carrier: [sl], prints: [T1], px: pxD, pitch: 14, yaw: -10, sy: -.1, nsy: -.1, npitch: 16, nyaw: 0, b: .14 };
    stops.t2 = { carrier: [sr], prints: [T2], px: pxD, pitch: 14, yaw: 14, sy: -.15, nsy: -.1, npitch: 16, nyaw: 8, b: .205 };
    stops.t3 = { carrier: [fr], prints: [T3], px: pxD, pitch: 38, yaw: -8, sy: .1, nsy: .1, npitch: 38, nyaw: 0, b: .35 };
  }

  // =====================================================================================================
  // Szene 2: Für Agenturen (x0 = 17)
  // =====================================================================================================
  const OX2 = 17;
  const LED2 = V(OX2 + 4.05, 1.0, 1.3 + .006);
  {
    const z = v => v;
    const rows = N ? [[{ t: "Für" }], [{ t: "Agenturen", it: 1 }]] : [[{ t: "Für" }, { t: "Agenturen", it: 1 }]];
    const H2 = heading(rows, HE, z(4.9), .395, "kopf2", OX2);

    const HT = 1.25, ZF = z(1.3), ZB = z(-1.3), LW = .18, AP = .5, X0 = OX2 - 4.4, XM = OX2 + 2.2, X1 = OX2 + 4.4;
    const MW = 1.5, NK = .42, CHN = .26, SHT = .8, MZ = z(.2), MH = NK + CHN + SHT;
    const down = { own: R, over: .035 };
    // Teamtisch: bestehender Teil (drei Plätze) und neuer Teil (vierter Platz) im selben Raster
    function table(tag, xa, xb, t0, legsL, legsR, sideL, sideR, d) {
      F.part(tag, tag === "tisch1" ? .36 : .37, .05);
      const top = F.lift(R, HT, t0, d, { over: .02 });
      F.poly(top, [[xa, ZF], [xb, ZF], [xb, ZB], [xa, ZB]], DESK, .5);
      const lt = t0 + d * .55;
      const legs = [];
      if (legsL) legs.push([xa, xa + LW]);
      if (legsR) legs.push([xb - LW, xb]);
      legs.forEach(([p, q], k) => {
        K.rect(K.panel(top, [p, ZF], [q, ZF], [0, 1], lt, .05, -Q, down), 0, 0, LW, HT, LEG);
        K.rect(K.panel(top, [p, ZB], [q, ZB], [0, -1], lt + .004, .05, -Q, down), 0, 0, LW, HT, LEG);
      });
      if (sideL) {
        K.rect(K.panel(top, [xa, ZF], [xa, ZF - LW], [-1, 0], lt + .002, .05, -Q, down), 0, 0, LW, HT, LEG);
        K.rect(K.panel(top, [xa, ZB + LW], [xa, ZB], [-1, 0], lt + .012, .05, -Q, down), 0, 0, LW, HT, LEG);
      }
      if (sideR) {
        K.rect(K.panel(top, [xb, ZF], [xb, ZF - LW], [1, 0], lt + .002, .05, -Q, down), 0, 0, LW, HT, LEG);
        K.rect(K.panel(top, [xb, ZB + LW], [xb, ZB], [1, 0], lt + .012, .05, -Q, down), 0, 0, LW, HT, LEG);
      }
      const ax0 = legsL ? xa + LW : xa, ax1 = legsR ? xb - LW : xb;
      const apron = K.panel(top, [ax0, ZF], [ax1, ZF], [0, 1], lt + .01, .045, -Q, down);
      K.rect(apron, 0, 0, ax1 - ax0, AP, LEG);
      return { top, apron, ax0, ax1, lt, d };
    }
    function monitor(top, xk, t0) {
      const m = K.panel(top, [xk - MW / 2, MZ], [xk + MW / 2, MZ], [0, -1], t0, .04, Q, { over: .05 });
      K.P(m, [[MW / 2 - .16, 0], [MW / 2 + .16, 0], [MW / 2 + .16, NK], [MW / 2 - .16, NK]], METAL, [.5, .5, 0, .5]);
      K.P(m, [[0, NK], [MW, NK], [MW, MH], [0, MH]], LIGHT);
      return m;
    }
    const monDecal = (m, on) => K.onPanel(m, K.decal(Math.round(MW * 400), Math.round((CHN + SHT) * 400), monDraw(SHT / (CHN + SHT)), MW, CHN + SHT, on, .02), MW / 2, NK + (CHN + SHT) / 2, 1);
    const matDecal = (top, xk, on) => K.onFlat(top, K.decal(Math.round(1.9 * 400), Math.round(.9 * 400), matDraw, 1.9, .9, on, .02), xk, z(.78));

    // bestehend: drei laufende Plätze
    const T_A = table("tisch1", X0, XM, .40, true, true, true, false, .05);
    const PL = [-3.3, -1.1, 1.1].map(v => OX2 + v);
    F.part("monitore1", .37, .05);
    const mons = [];
    PL.forEach((xk, i) => { const m = monitor(T_A.top, xk, .47 + .008 * i); mons.push(m); monDecal(m, .50); matDecal(T_A.top, xk, .50); });
    // Satz 1 auf der Zarge des bestehenden Tisches
    const tA = K.print(["Ich steige in laufende", "Projekte ein,"], .13, .49, { align: "center", lh: 1.2 });
    K.onPanel(T_A.apron, tA, (T_A.ax1 - T_A.ax0) / 2, AP / 2, 1, [0, -1]);

    // neu: vierter Platz exakt im selben Raster (sein Umriss steht von Anfang an in den Bastellinien)
    const T_B = table("tisch2", XM, X1, .52, false, true, false, true, .05);
    F.part("monitor2", .38, .05);
    const m4 = monitor(T_B.top, OX2 + 3.3, .585);
    monDecal(m4, .60); matDecal(T_B.top, OX2 + 3.3, .60);
    // Satz 2 im Kinn des neuen Monitors, Satz 3 auf der neuen Zarge, Satz 4 auf dem Platzset
    const tS2 = K.print(["arbeite mich in bestehende", "Themes und Plugins ein"], .075, .61, { align: "center", lh: 1.15 });
    K.onPanel(m4, tS2, MW / 2, NK + CHN / 2, 1);
    const tS3 = K.print(["und halte mich an Ihre", "Abläufe und Werkzeuge."], .1, .62, { align: "center", lh: 1.2 });
    K.onPanel(T_B.apron, tS3, (T_B.ax1 - T_B.ax0) / 2 - .15, AP / 2, 1, [0, -1]);
    K.ticker(T_B.apron, .04, T_B.apron.uv(T_B.ax1 - T_B.ax0 - .2, AP / 2), [0, -1], 1, .625);
    const tS4 = K.print(["Konditionen und freie", "Kapazität nenne ich Ihnen", "auf Anfrage."], .085, .63, { align: "center", lh: 1.2 });
    K.onFlat(T_B.top, tS4, OX2 + 3.3, z(.63));

    // Konstruktionsphase (seite/): Gerüst je Tischteil kurz vor dem Heben, Bleistiftspur (Zargen, Platzset und Monitore nur Eckmarken)
    F.geruest({ tags: ["tisch1", "monitore1"], t0: .365, t1: .4, du: .02, a: .5 });
    F.geruest({ tags: ["tisch2", "monitor2"], t0: .48, t1: .52, du: .02, a: .5 });
    F.spur({ tags: ["tisch1", "tisch2", "monitore1", "monitor2"], quiet: [T_A.apron, T_B.apron, T_B.top, m4, ...mons], a: .3 });

    carriers.push({ n: "h2", nodes: [], prints: H2 });
    stops.h2 = { prints: H2, pitch: 10, sy: 0, nsy: 0, px: (W, H) => H * .075, pxN: 38, fit: .74, fitN: .86, b: .43 };
    carriers.push({ n: 'sA', nodes: [T_A.apron], prints: [tA] }, { n: 'sMon', nodes: [m4], prints: [tS2] }, { n: 'sB', nodes: [T_B.apron], prints: [tS3] }, { n: 'sMat', nodes: [T_B.top], prints: [tS4], only: 1 });
    // seite/: Lesestellen erst, wenn ihr Druck ganz eingeblendet ist (vorher stand dort halbe Deckkraft: Druck ab b + Blende .02)
    stops.s1 = { carrier: [T_A.apron], prints: [tA], px: pxD, pitch: 14, yaw: -8, sy: -.2, nsy: -.1, npitch: 16, nyaw: 0, b: .515 };
    stops.s2 = { carrier: [m4], prints: [tS2], px: pxD, pitch: 12, yaw: 10, sy: .05, nsy: 0, npitch: 14, nyaw: 4, b: .635 };
    stops.s3 = { carrier: [T_B.apron], prints: [tS3], px: pxD, pitch: 14, yaw: 8, sy: -.2, nsy: -.1, npitch: 16, nyaw: 4, b: .645 };
    stops.s4 = { carrier: [T_B.top], prints: [tS4], px: pxD, pitch: 52, yaw: 0, sy: -.05, nsy: 0, npitch: 54, nyaw: 0, b: .655 };
  }

  // =====================================================================================================
  // Szene 3: Kontakt (x0 = 36)
  // =====================================================================================================
  const OX3 = 36;
  {
    const z = v => v;
    const rows = [[{ t: "Schreiben Sie mir," }], [{ t: "worum es geht.", it: 1 }]];
    const H3 = heading(rows, N ? .5 : .72, z(4.6), .715, "kopf3", OX3);

    // Umschlag: der Körper liegt als Papier auf dem Bogen (die Karten stehen aus ihm auf), die Klappe liegt hinten und klappt auf
    const BW = 7.2, zF = z(1.9), zB = z(N ? -2.95 : -2.7), CX = N ? 2.1 : 1.6, ZBK = N ? -1.3 : -.95, ZFR = N ? 1.5 : 1.15;
    F.poly(R, [[OX3 - BW / 2, zF], [OX3 + BW / 2, zF], [OX3 + BW / 2, zB], [OX3 - BW / 2, zB]], BODY, .5, .01);
    F.part("klappe", .70, .05);
    const FH = 3.2, flap = K.panel(R, [OX3 - BW / 2, zB], [OX3 + BW / 2, zB], [0, -1], .83, .06, Q + .3, { over: .04 });
    K.P(flap, [[0, 0], [BW, 0], [BW / 2, FH]], FLAPC, [.5, .5, .5]);
    K.onPanel(flap, K.decal(1440, Math.round(1440 * FH / BW), liningDraw, BW, FH, .86, .03), BW / 2, FH / 2, 1);

    F.part("karten", .71, .06);
    const CW = 2.6, CHt = .95, DD = .5, EM = .115, LV = { over: .05 };
    const spots = [
      { x: OX3 - CX, zh: z(ZBK), label: "Mail", val: "mail@andersen-webworks.de", href: "mailto:mail@andersen-webworks.de" },
      { x: OX3 + CX, zh: z(ZBK), label: "Telefon", val: "+49 38733 270015", href: "tel:+4938733270015" },
      { x: OX3, zh: z(ZFR), label: "LinkedIn", val: "andersen-erik", href: "https://www.linkedin.com/in/andersen-erik/" }
    ];
    const faces = [];
    const decs = spots.map((s, i) => {
      const t = .88 + .014 * i;
      const face = K.panel(R, [s.x - CW / 2, s.zh], [s.x + CW / 2, s.zh], [0, -1], t, .04, Q, LV); faces.push(face);
      K.rect(face, 0, 0, CW, CHt, CARD);
      const deck = K.panel(face, face.uv(0, CHt), face.uv(CW, CHt), [0, -1], t + .025, .035, -Q, LV);
      K.rect(deck, 0, 0, CW, DD, DECK);
      const c = cardDraw(s.label, s.val, CW, CHt, EM);
      const dec = K.decal(c.wpx, c.hpx, c.draw, CW, CHt, .93 + .01 * i, .02);
      K.onPanel(face, dec, CW / 2, CHt / 2, 1);
      K.link(dec, s.href);
      dec.textual = true;   // Kartendruck ist Text: ganz im Bild oder gar nicht (Rahmenregel im Kern)
      carriers.push({ n: 'card' + s.label, nodes: [face], prints: [dec] });
      return dec;
    });

    // Konstruktionsphase (seite/): Gerüst von Klappe und Karten, bevor sie aufgehen, Bleistiftspur (Karten nur Eckmarken)
    F.geruest({ tags: ["klappe", "karten"], t0: .8, t1: .875, du: .02, a: .5 });
    F.spur({ tags: ["klappe", "karten"], quiet: [flap, ...faces], a: .3 });

    carriers.push({ n: "h3", nodes: [], prints: H3 });
    stops.h3 = { prints: H3, pitch: 10, sy: 0, nsy: 0, px: (W, H) => H * .07, pxN: 34, fit: .74, fitN: .86, b: .77 };
    if (!N) stops.all = { prints: decs, e0: EM, px: pxD, fit: .8, pitch: 30, yaw: 0, sy: -.05, b: 1 };
    else spots.forEach((s, i) => { stops["c" + i] = { prints: [decs[i]], e0: EM, px: 16, pxN: 16, fitN: .94, pitch: 28, npitch: 28, nyaw: 0, nsy: -.05, b: .955 + .015 * i }; });
  }

  // ---------- Roter Faden: vom Statuspunkt des neuen Platzes zum Umschlag ----------
  const thread = { pts: [LED2, V(OX2 + 4.05, .62, 1.38), V(OX2 + 4.05, .3, 1.7), V(OX2 + 4.05, .09, 2.0), V(OX2 + 4.1, .012, 2.35), V(OX2 + 4.6, .012, 2.8), V(OX2 + 6.0, .012, 2.9), V(OX2 + 10, .012, 2.6), V(OX3 - 5.2, .012, 1.4), V(OX3 - 4.3, .012, -.3), V(OX3 - 3.0, .012, .05)], t0: .65, t1: .80 };

  // ---------- Kamerabahn ----------
  const S = stops;
  const keys = [
    // Szene 1: Überschrift steht (nach der Zeit), Bastellinien zeichnen sich, Kamera hebt sich über den Bogen, Teile klappen hoch, Teile laufen durch
    { w: .3, b: 0, cam: V(0, 3.1, 22.9), tgt: V(0, .27, 5), camN: V(0, 2.6, 19.8), tgtN: V(0, .2, 4.6) },
    { w: .4, stop: S.h1 },
    { w: .5, slow: 1, b: .09, ...orbit(V(0, .6, -3), 34, 8, 26, 21, 44, V(0, .6, -3.5)) },
    { w: .7, stop: S.t1 },
    { w: .6, slow: 1, b: .17, ...orbit(V(0, .6, -1.5), 30, 0, 17, 9, 38) },
    { w: .7, stop: S.t2 },
    { w: .6, slow: 1, b: .26, ...orbit(V(0, .6, -2.5), 34, 0, 17, 9.5, 38) },
    { w: .8, stop: S.t3 },
    { w: .7, slow: 1, b: .385, ...orbit(V(9, .5, -2), 30, 0, 24, 30, 40) },
    // Szene 2
    { w: .9, stop: S.h2 },
    { w: .75, slow: 1, b: .47, ...orbit(V(OX2, 1, 0), 30, 0, 17, 25, 38) },
    { w: .9, stop: S.s1 },
    { w: .9, stop: S.s2 },
    { w: .8, stop: S.s3 },
    { w: .8, stop: S.s4 },
    { w: .9, slow: 1, b: .72, ...orbit(V(OX2 + 10, 0, 1), 30, 0, 18, 24, 40) },
    // Szene 3: der Faden kommt an, die Klappe geht auf, die Karten stehen auf
    { w: 1, stop: S.h3 },
    { w: 1.8, slow: 1, b: .86, ...orbit(V(OX3, .8, -.5), 32, 0, 15, 20, 40) },
    ...(N ? [S.c0, S.c1, S.c2].map(s => ({ w: 1.1, stop: s })) : [{ w: 1.4, slow: 1, b: .93, ...orbit(V(OX3, .8, -.5), 34, 10, 12) }, { w: 2, stop: S.all }])
  ];
  Object.entries(S).forEach(([k, v]) => { v.name = k; });
  // Raster (seite/) für „Wie ich arbeite“; „Für Agenturen“ setzt in der Szenenfolge ein eigenes Zeitfenster
  const grid = { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .05 }; // weg vor der ersten Lesestelle (t1, b .14)
  return { fov: 32, fovN: 44, track: 1250, grid, stops: Object.values(S), keys, thread, carriers };
}
