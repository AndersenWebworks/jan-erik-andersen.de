// Abschluss der Lesebahn: „Wie ich arbeite“, „Für Agenturen“ und „Kontakt“ (Drehbuch: DREHBUCH-LESEBAHN.md, Abschnitte 13, 16, 17;
// Baukasten: LESEBAHN-BAUKASTEN.md). Das Modul baut je Aufruf eine Szene (opt.scene):
//  "arbeit"     Wie ich arbeite: Tunnelbuch aus Prüfrahmen. Drei Rahmen (Bögen aus Papier, Fenster bis zum Boden) stehen auf der Bahn, der rote
//               Faden läuft unter dem Sturz durch jedes Fenster, der Satz steht ganz auf dem Sturz. Hinter jedem Rahmen stehen zwei kleinere
//               Rahmen als Tunnel. Szenerie: Teile (Schnittstelle, Datenumzug, Website) laufen durch die Rahmen; was den Prüfrahmen
//               passiert, bekommt ein Häkchen, das Teil ohne Häkchen bleibt vor dem Prüfrahmen stehen.
//  "agenturen"  Für Agenturen und Kontakt auf einem Bogen: Einsteckschiene mit drei Steckschildern (Schienenstücke mit Nut für den Faden), dahinter
//               eine Reihe gleicher Bausteine (laufendes Projekt) mit einer Lücke, in die sich ein neuer Baustein einsteckt (Themes, Plugins).
//               Danach läuft der Faden zum Briefumschlag: Er steht hinter drei Karten (Mail, Telefon, LinkedIn, echte Links); der Faden endet im
//               roten Siegel vor den Karten. Letztes Bild: Überschrift, alle Karten und der Standort ganz im Bild.
// Jeder Satz steht ganz auf einem Träger (keine Satzketten), Lesereihenfolge = Bahnrichtung, Kamera Gier 0, Neigung 26 (K.bahn).
import { halt } from "./halt.js";
const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235", INKC = "#303033", MUTED = "#66666a";
const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2 };
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
// Siegel: Wachsscheibe mit gezacktem Rand (der rote Punkt des Fadens liegt in der Mitte)
function sealDraw(x, W, H) {
  x.translate(W / 2, H / 2); const r = W * .46;
  x.fillStyle = "#b50029"; x.beginPath();
  for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2, q = r * (i % 2 ? .94 : 1); x.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  x.closePath(); x.fill();
  x.fillStyle = RED; x.beginPath(); x.arc(0, 0, r * .82, 0, Math.PI * 2); x.fill();
  x.strokeStyle = "rgba(255,255,255,.3)"; x.lineWidth = r * .05; x.beginPath(); x.arc(0, 0, r * .58, 0, Math.PI * 2); x.stroke();
}
// Karte eines Kontaktwegs: Etikett (grau) über dem Wert (Tinte, unterstrichen), roter Punkt davor zeigt „anklickbar“. em: Schrifthöhe in Welteinheiten
function cardDraw(label, value, CW, CH, em, box) {
  const pxu = 520;
  return {
    wpx: Math.round(CW * pxu), hpx: Math.round(CH * pxu),
    draw: (x, W, H) => {
      const u = pxu * em, padX = .2 * pxu;
      if (box) { x.strokeStyle = ink(.2); x.lineWidth = Math.max(2, u * .03); rr(x, 2, 2, W - 4, H - 4, u * .25); x.stroke(); }
      x.textBaseline = "alphabetic";
      x.fillStyle = MUTED; x.font = `500 ${u * .86}px "Schibsted Grotesk"`;
      x.fillText(label, padX + u * .55, H * .36);
      x.fillStyle = INKC; x.font = `500 ${u}px "Schibsted Grotesk"`;
      const yb = H * .76, w = x.measureText(value).width, xv = padX + u * .55;
      x.fillText(value, xv, yb);
      x.fillStyle = RED; x.beginPath(); x.arc(padX + u * .16, yb - u * .3, u * .13, 0, Math.PI * 2); x.fill();
      x.strokeStyle = ink(.7); x.lineWidth = Math.max(2, u * .045); x.beginPath(); x.moveTo(xv, yb + u * .16); x.lineTo(xv + w, yb + u * .16); x.stroke();
    }
  };
}

const SATZ_X = [
  "Ich arbeite mit aktuellen KI-Werkzeugen und habe dafür eigene Abläufe entwickelt.",
  "Damit schaffe ich allein Projekte, für die früher ein kleines Team nötig war, etwa Schnittstellen oder Datenumzüge.",
  "Entscheidungen und Verantwortung bleiben bei mir, und ausgeliefert wird nur, was ich geprüft habe."
];
const SATZ_Y = [
  "Ich steige in laufende Projekte ein.",
  "Ich arbeite mich in bestehende Themes und Plugins ein und halte mich an Ihre Abläufe und Werkzeuge.",
  "Konditionen und freie Kapazität nenne ich Ihnen auf Anfrage."
];

export default function (K, opt = {}) {
  const { F, R, V, Q, sm, mech, clamp, THREE, narrow: N } = K;
  const PI = Math.PI, PITCH = K.PITCH, lean = PITCH * PI / 180, SINL = Math.sin(lean), EC = .2;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const PAPER = c3("#f6f3ec"), PAPER2 = c3("#f1ede3"), RAIL = c3("#e3ded1"), NUT = c3("#cfc8b8"), BODY = c3("#efe6d2"), FLAPC = c3("#e8dcc4"), CARD = c3("#f8f6f1"), BLOCK = c3("#f2eee4");

  // Aufsteller: Fläche an einem Scharnier (Grundlinie), um die Neigung der Kamera zurückgelehnt, mit zwei Seitenstützen (Dreiecke, klappen nach hinten)
  function stand(par, a, b, W, H, rise, col, draw, sup = true) {
    const nd = K.panel(par, a, b, [0, -1], rise, .045, Q - lean, { over: .04 });
    if (draw) draw(nd); else K.rect(nd, 0, 0, W, H, col, .4);
    const quiet = [nd]; let vg = 0;
    if (sup) {
      const ws = Math.min(.42, H * .45), ug = ws * Math.sin(lean), uT = Math.min(H * .85, .75);
      vg = ws * Math.cos(lean);
      const wl = K.panel(nd, nd.uv(0, 0), nd.uv(0, uT), [-1, 0], rise + .03, .035, -Q, { over: .07 });
      K.P(wl, [[0, 0], [uT, 0], [ug, vg]], col, .3);
      const wr = K.panel(nd, nd.uv(W, 0), nd.uv(W, uT), [1, 0], rise + .034, .035, -Q, { over: .07 });
      K.P(wr, [[0, 0], [uT, 0], [ug, vg]], col, .3);
      quiet.push(wl, wr);
    }
    return { nd, vg, quiet };
  }
  // Bogen aus Papier: zwei Pfosten und ein Sturz, darunter ein Fenster bis zum Boden
  const arch = (W, H, HP, PO, col) => nd => {
    K.P(nd, [[0, 0], [PO, 0], [PO, HP], [0, HP]], col, [.5, .5, 0, .5]);
    K.P(nd, [[W - PO, 0], [W, 0], [W, HP], [W - PO, HP]], col, [.5, .5, 0, .5]);
    K.P(nd, [[0, HP], [W, HP], [W, H], [0, H]], col, .4);
  };
  const pxD = (W, H) => Math.min(23.5, Math.max(20, 20.5 + (H - 900) / 540 * 2.5));

  // ===================================================================================================
  // Wie ich arbeite: Tunnelbuch aus Prüfrahmen
  // ===================================================================================================
  function arbeit() {
    const z = 5.0, zf = z + 3.0, eH = .5;
    const lines = N ? ["Allein, wofür", "früher ein Team", "nötig war"] : ["Allein, wofür früher", "ein Team nötig war"];
    const titleW = K.measure(lines, { font: "serif" }).tw * eH;
    const x0 = -1.0, xh = x0 - .7 - titleW;
    const H1 = K.word(lines, eH, xh, z, .15, .85, { font: "serif", foot: 1, imprint: { ...IMPRINT, close: .25, closeDur: .7 }, ang: Q - lean });
    // Kicker „Wie ich arbeite“ steht hinter der Überschrift (im Bild darüber)
    const kz = z - (H1.h + .3) / SINL;
    const kick = K.word(["Wie ich arbeite"], .2, xh, kz, .15, .85, { foot: 1, noImprint: true, col: MUTED, track: .02, ang: Q - lean });

    // Trägerform „Prüfrahmen“: Der Faden läuft in der Ebene des Rahmens durch das Fenster unter dem Sturz (Haltepunkt im Fenster).
    // Hinter jedem Rahmen stehen zwei kleinere Rahmen (Tunnel), leicht nach rechts versetzt.
    const rahmen = {
      name: "rahmen", maxEm: n => n ? 14 : 22,
      build(c) {
        const { x, z: zz, lines: ls, e, tw, th, t, tag } = c;
        const mx = 1.5 * e, mt = 1.0 * e, mb = 1.2 * e, PO = Math.max(.34, mx * .8), HP = 1.5;
        const W = tw + 2 * mx, LI = mt + th + mb, H = HP + LI, col = PAPER;
        const s = stand(R, [x, zz], [x + W, zz], W, H, t.rise, col, arch(W, H, HP, PO, col));
        const pr = K.print(ls, e, t.text, { lh: c.lh });
        K.onPanel(s.nd, pr, mx - pr.t.padX * e + pr.w / 2, H - mt + .34 * e - pr.h / 2, 1);
        const quiet = [...s.quiet];
        // Tunnel: zwei kleinere Rahmen dahinter (nur Papier, kein Text)
        let zg = zz - H - .45;
        [[.8, .94, .5], [.62, .88, 1.0]].forEach(([fh, fw, sh], k) => {
          const Hg = H * fh, Wg = W * fw, HPg = HP * fh, xg = x + sh;
          const g = stand(R, [xg, zg], [xg + Wg, zg], Wg, Hg, t.rise + .012 * (k + 1), PAPER2, arch(Wg, Hg, HPg, PO * fw, PAPER2), false);
          quiet.push(g.nd); zg -= Hg + .45;
        });
        const a = [x + mx + 2 * e, .004, zz];
        return { w: W, h: H, pr, nd: s.nd, anchor: a, anchors: [a], quiet, side: s.vg, tags: [tag] };
      }
    };
    const T = [[.10, .14, .20], [.28, .32, .38], [.46, .50, .56]];
    const B = K.bahn({
      prefix: "x", form: rahmen, x0, z, gap: 1.7, pitch: PITCH, sy: -.34, nsy: -.3,
      head: { prints: [H1, kick], e0: eH, b: 0, fit: .72, fitN: .72, x: xh, w: titleW },
      sentences: [
        { text: SATZ_X[0], t: T[0], b: .23 },
        { text: SATZ_X[1], t: T[1], b: .41, big: 1.2 },
        { text: SATZ_X[2], t: T[2], b: .59 }
      ]
    });
    const it = B.items, cx = it.map(i => i.x0 + i.w / 2), x3l = it[2].x0, x3r = x3l + it[2].w;
    const Hmax = Math.max(...it.map(i => i.h));
    K.sheet(xh - 3.4, B.endX + 7, Math.min(kz - 1.6, z - 2.42 * Hmax - 1.6) - 7, zf);

    // Teile laufen hinter dem Faden (zp) durch die Fenster der Rahmen: Schnittstelle, Datenumzug, Website. Was den Prüfrahmen (3) passiert,
    // bekommt ein Häkchen; die Website bleibt davor stehen (ohne Häkchen).
    const TS = .76, TT = .1, zp = z - 1.0, TCOL = ["#f1ece0", "#ebe6da", "#f4efe6"];
    const kk = (b, ks) => {
      if (b <= ks[0][0]) return ks[0][1];
      for (let i = 1; i < ks.length; i++) if (b < ks[i][0]) return ks[i - 1][1] + (ks[i][1] - ks[i - 1][1]) * sm((b - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]));
      return ks[ks.length - 1][1];
    };
    const tiles = [
      { born: .17, ks: [[.17, cx[0] - 1.6], [.23, cx[0]], [.41, cx[1] - .55], [.59, x3r + 1.3]], ck: true },
      { born: .30, ks: [[.30, cx[0] - 1.6], [.41, cx[1] + .55], [.59, x3r + 2.5]], ck: true },
      { born: .44, ks: [[.44, cx[1] - 1.1], [.59, x3l - 1.3]], ck: false }
    ];
    tiles.forEach((tl, i) => {
      const g = new THREE.Group(), box = new THREE.Mesh(new THREE.BoxGeometry(TS, TS, TT), K.paperMaterial(TCOL[i]));
      box.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .38, depthWrite: false })));
      g.add(box);
      const gl = K.decal(256, 256, GLYPH[i], TS * .86, TS * .86, -1); gl.mesh.position.z = TT / 2 + .004; g.add(gl.mesh);
      const ck = K.decal(128, 128, checkDraw, .3, .3, -1); ck.mesh.position.set(TS / 2 - .17, -TS / 2 + .17, TT / 2 + .008); g.add(ck.mesh);
      g.rotation.x = -lean; K.add(g);
      K.anim(b => {
        const k0 = sm((b - tl.born) / .02), x = kk(b, tl.ks);
        g.visible = k0 > 0; g.scale.setScalar(Math.max(.001, k0));
        g.position.set(x, TS / 2 * Math.cos(lean) + TT / 2 * SINL, zp - TS / 2 * SINL);
        const c = tl.ck ? sm((x - (cx[2] - .4)) / .5) : 0;
        ck.mesh.scale.setScalar(Math.max(.001, c * (1 + .2 * Math.sin(clamp(c, 0, 1) * PI))));
      });
    });

    const th = B.thread({ hold: .04, depart: .10, bEnd: .62 });
    const keys = B.keys({ b: .62, shift: 1.8, w: .6 });
    return {
      fov: 32, fovN: 44, smooth: true,
      stops: B.stops, names: B.names, keys, thread: th,
      fadenIO: B.faden({ inn: [xh - 2.2, zf - .2], out: [B.endX + 3, kz - 1.4] }),
      grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .09 }
    };
  }

  // ===================================================================================================
  // Für Agenturen (Einsteckschiene) und Kontakt (Briefumschlag)
  // ===================================================================================================
  function agenturen() {
    const z = 6.0, zf = z + 3.0, eH = N ? .55 : .62;
    const lines = N ? ["Für", "Agenturen"] : ["Für Agenturen"];
    const titleW = K.measure(lines, { font: "serif" }).tw * eH;
    const x0 = -1.0, xh = x0 - .7 - titleW;
    const H1 = K.word(lines, eH, xh, z, .15, .85, { font: "serif", foot: 1, imprint: { ...IMPRINT, close: .25, closeDur: .7 }, ang: Q - lean });

    // Trägerform „Steckschild“: Schienenstück (flach vor der Grundlinie, mit Nut für den Faden), darauf steht das Schild, um die Neigung zurückgelehnt.
    // Die Schienenstücke stoßen aneinander (gap 0): eine durchgehende Einsteckschiene.
    const schild = {
      name: "steckschild", maxEm: n => n ? 15 : 22,
      build(c) {
        const { x, z: zz, lines: ls, e, tw, th, t, tag } = c;
        const PAD = .5, FD = .5, mx = 1.5 * e, mt = 1.2 * e, mb = 1.4 * e, W = tw + 2 * mx, H = mt + th + mb, fw = W + 2 * PAD;
        const rail = K.panel(R, [x, zz + FD], [x + fw, zz + FD], [0, -1], t.line + .02, .02, 0, { nofold: true, over: 0 });
        K.rect(rail, 0, 0, fw, FD, RAIL, .45);
        K.rect(rail, .12, FD * .38, fw - .12, FD * .62, NUT, 0, .0007);
        const s = stand(rail, rail.uv(PAD, FD), rail.uv(PAD + W, FD), W, H, t.rise, PAPER);
        const pr = K.print(ls, e, t.text, { lh: c.lh });
        K.onPanel(s.nd, pr, mx - pr.t.padX * e + pr.w / 2, H - mt + .34 * e - pr.h / 2, 1);
        const a = [x + PAD + mx + 2 * e, .004, zz + FD / 2];
        return { w: fw, h: H, pr, nd: s.nd, foot: rail, anchor: a, anchors: [a], quiet: s.quiet, side: 0, tags: [tag] };
      }
    };
    const T = [[.10, .14, .20], [.30, .34, .40], [.50, .54, .60]];
    const B = K.bahn({
      prefix: "y", form: schild, x0, z, gap: 0, pitch: PITCH, sy: -.34, nsy: -.3,
      head: { prints: [H1], e0: eH, b: 0, fit: .72, fitN: .72, x: xh, w: titleW },
      sentences: [
        { text: SATZ_Y[0], t: T[0], b: .23, big: 1.25, w: 3.0 },
        { text: SATZ_Y[1], t: T[1], b: .43, w: 2.6 },
        { text: SATZ_Y[2], t: T[2], b: .63, w: 2.6 }
      ]
    });
    const it = B.items, endX = B.endX;

    // Szenerie: eine Reihe gleicher Bausteine (laufendes Projekt) hinter der Schiene; unter Schild 1 fehlt einer, er steckt sich nach Satz 1 ein
    const zRow = z - 5.2, BWd = 1.5, BHt = 1.2, pitch = 1.85, nB = Math.max(4, Math.floor((endX - x0 + 1) / pitch));
    const gapIx = Math.round((it[0].x0 + it[0].w / 2 - x0) / pitch);
    const blocks = [];
    F.part("reihe", .04, .06);
    for (let k = 0; k < nB; k++) {
      const bx = x0 - .3 + k * pitch, fill = k === gapIx;
      const s = stand(R, [bx, zRow], [bx + BWd, zRow], BWd, BHt, fill ? T[0][2] + .08 : .08 + .012 * k, BLOCK, null, false);
      blocks.push({ k, nd: s.nd, bx, fill });
    }
    // Beschriftungen zweier Bausteine unter Schild 2: Theme und Plugin (kurze Namen)
    const c2 = it[1].x0 + it[1].w / 2, pick = ix => blocks.reduce((m, b) => !b.fill && Math.abs(b.bx + BWd / 2 - ix) < Math.abs(m.bx + BWd / 2 - ix) ? b : m, blocks[0]);
    const bTheme = pick(c2 - 1.4), bPlug = blocks.find(b => !b.fill && b !== bTheme && Math.abs(b.bx + BWd / 2 - (c2 + 1.4)) < pitch);
    [[bTheme, "Theme"], [bPlug || pick(c2 + 1.4), "Plugin"]].forEach(([b, name]) => {
      const pr = K.print([name], .17, T[1][2] + .01, { align: "center" });
      K.onPanel(b.nd, pr, BWd / 2, BHt / 2, 1);
    });

    // ----- Kontakt: Briefumschlag mit Klappe, Karten (Desktop: drei nebeneinander; Handy: ein Briefbogen mit drei Zeilen), Siegel am Ende des Fadens -----
    const EM = .2, CHt = N ? .8 : 1.0, CT = [["Mail", "mail@andersen-webworks.de", "mailto:mail@andersen-webworks.de"],
      ["Telefon", "+49 38733 270015", "tel:+4938733270015"], ["LinkedIn", "andersen-erik", "https://www.linkedin.com/in/andersen-erik/"]];
    const CW = .4 + EM * (.55 + Math.max(...CT.map(c => K.measure([c[1]]).tw)));
    const GAPC = .5, rowW = 3 * CW + 2 * GAPC;
    const eK = N ? .4 : .56;
    const H3 = K.print(["Schreiben Sie mir,", "worum es geht."], eK, .86, { font: "serif", align: "center", lh: 1.2 });
    const St = K.print(["Raum Plau am See · remote"], EC, .88, { align: "center", col: MUTED });
    const cardDec = (c, k, on) => { const cd = cardDraw(c[0], c[1], CW, CHt, EM, N), dec = K.decal(cd.wpx, cd.hpx, cd.draw, CW, CHt, on, .02); K.link(dec, c[2]); dec.textual = true; return dec; };
    const xS0 = endX + 3.2;
    let xKc, xS, BW, BH, zE, flapTop, decs, zBack;
    const FH = 1.1;
    F.part("umschlag", .60, .05);
    if (!N) {
      // Desktop: Umschlag mit Überschrift und Standort, davor drei Karten in einer Reihe
      BW = rowW + 1.8; xKc = xS0 + BW / 2; xS = xKc; BH = 3.2;
      const tc1 = .15, tHead = 1.9, tSt = .62, zc = z - 1.5;
      zE = zc - (CHt - tc1) / SINL;
      const env = stand(R, [xKc - BW / 2, zE], [xKc + BW / 2, zE], BW, BH, .66, BODY);
      const flap = K.panel(env.nd, env.nd.uv(0, BH), env.nd.uv(BW, BH), [0, -1], .74, .08, -1.1, { over: .04 });
      K.P(flap, [[0, 0], [BW, 0], [BW / 2, FH]], FLAPC, [.5, .5, .5]);
      K.onPanel(env.nd, H3, BW / 2, tHead, 1);
      K.onPanel(env.nd, St, BW / 2, tSt, 1);
      F.part("karten", .75, .05);
      decs = CT.map((c, k) => {
        const x = xKc - rowW / 2 + k * (CW + GAPC), s = stand(R, [x, zc], [x + CW, zc], CW, CHt, .80 + .035 * k, CARD, null, true);
        const dec = cardDec(c, k, .88 + .012 * k); K.onPanel(s.nd, dec, CW / 2, CHt / 2, 1); return dec;
      });
      zBack = Math.min(zE - BH - FH, z - 5.2 - 1.2) - 1.2;
    } else {
      // Handy: Briefbogen (Überschrift, drei Zeilen als Links, Standort) steht in einem Umschlag; alles in einer Ebene, ohne Tiefenstaffel
      const BWb = CW + .5, hH = H3.h, rowsB = .6, gR = .12, rowsTop = rowsB + 3 * CHt + 2 * gR;
      const yHead = rowsTop + .25 + hH / 2, BHb = yHead + hH / 2 + .35, zB = z - 1.5;
      BW = BWb + 1.0; BH = BHb + 1.0; xKc = xS0 + BW / 2; xS = xKc; zE = zB - BHb - .6;
      const env = stand(R, [xKc - BW / 2, zE], [xKc + BW / 2, zE], BW, BH, .66, BODY);
      const flap = K.panel(env.nd, env.nd.uv(0, BH), env.nd.uv(BW, BH), [0, -1], .74, .08, -1.1, { over: .04 });
      K.P(flap, [[0, 0], [BW, 0], [BW / 2, FH]], FLAPC, [.5, .5, .5]);
      F.part("karten", .75, .05);
      const brief = stand(R, [xKc - BWb / 2, zB], [xKc + BWb / 2, zB], BWb, BHb, .80, CARD, null, true);
      K.onPanel(brief.nd, H3, BWb / 2, yHead, 1);
      K.onPanel(brief.nd, St, BWb / 2, .3, 1);
      decs = CT.map((c, k) => {
        const dec = cardDec(c, k, .88 + .012 * k), yc = rowsB + (2 - k) * (CHt + gR) + CHt / 2;
        K.onPanel(brief.nd, dec, BWb / 2, yc, 1); return dec;
      });
      zBack = zE - BH - FH - 1.2;
    }

    // Siegel am Ende des Fadens (flach auf dem Bogen vor den Karten)
    const seal = K.decal(256, 256, sealDraw, .95, .95, .80, .03);
    K.onFlat(R, seal, xS, z, .003);

    K.sheet(xh - 3.4, xKc + BW / 2 + 3.5, zBack - 7, zf);

    // ----- Faden: Bahn (Haltepunkte an den Schildern) und weiter zum Siegel -----
    const t0 = B.thread({ hold: .04, depart: .10 });
    const pts = t0.pts.slice();
    pts.push(V(xS - 1.4, .004, z), V(xS, .004, z));
    const holds = [{ at: pts[0], b: B.head.b }, ...it.map(i => ({ at: V(...i.anchor), b: i.b })), { at: pts[pts.length - 1], b: .93, hold: .05 }];
    const thread = halt(THREE, pts, holds, { hold: .04, depart: .10, bEnd: 1 });

    // ----- Kamera: Überschrift, drei Schilder, dann die letzten Meter ohne Haltepunkte zum Umschlag; letztes Bild: alles ganz im Bild -----
    const sealPt = V(xS, .004, z);
    const all = { name: "kontakt", prints: [...decs, H3, St], e0: EM, b: .97, px: (W, H, s) => pxD(W, H) * s.e / EC, pxN: (W, H, s) => Math.min(19.5 * Math.max(1, W / 390), 19.5 * Math.max(1, H / 844)) * s.e / EC,
      fit: .9, fitN: .95, pitch: PITCH, npitch: PITCH, yaw: 0, nyaw: 0, sx: 0, nsx: 0, sy: N ? -.05 : -.05, nsy: -.05, keep: [sealPt] };
    const stops = [...B.stops, all];
    const names = { ...B.names, kontakt: all };
    const keys = [
      { w: 0, stop: B.head },
      ...it.map(i => ({ w: i.wKey, stop: i.stop })),
      { w: 4.5, b: .80, fromStop: all, back: 1.5, up: .6 },
      { w: 4.0, stop: all }
    ];
    return {
      fov: 32, fovN: 44, smooth: true,
      stops, names, keys, thread,
      fadenIO: B.faden({ inn: [xh - 2.2, zf - .2] }),
      grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .09 }
    };
  }

  return opt.scene === "arbeit" ? arbeit() : agenturen();
}
