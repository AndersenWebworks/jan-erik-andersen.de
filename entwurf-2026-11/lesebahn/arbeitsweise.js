// Wie ich arbeite (Szene 10): die Werkbank eines Einzelnen. Ein Rollenband, das einer allein bedient, trägt die Sätze als Werkstückträger;
// jedes Band-Modul ist eine eigene Vorrichtung (Anschlag, Werkzeugtafel dahinter), wo früher an jeder Station jemand saß.
// Ableitung: Eigene Abläufe sind selbst gebaute Vorrichtungen an einem Band, das einer allein bedient; am Ende legt er selbst die Prüflehre an,
// und nur was passt, verlässt das Band.
//  X0 Kopf: erster Träger auf dem Band (Kicker und Kopf), er läuft aus dem Einlauf an seinen Anschlag.
//  X1 Träger am ersten Anschlag; dahinter die Werkzeugtafel (eigene Werkzeuge, jedes an seinem Platz).
//  X2 Träger am zweiten Anschlag; hinter dem Band liegen die Plätze des früheren Teams nur noch als Schnittmuster eines Hockers im Bogen.
//  X3 Prüfstation: der Träger steht auf, der Prüfbügel schwenkt von hinten über seine Oberkante, passt, der rote Prüfpunkt sitzt; der Bügel schwenkt zurück,
//     die Ausgabeklappe am Bandende senkt sich, erst dann läuft der Träger zur Ausgabe. Hinter der Prüfstation steht der einzige Hocker
//     (Entscheidungen bleiben bei mir).
// Am Handy (und kurz am Desktop) läuft jeder Träger auf den Rollen ein Stück mit der Kamera mit (K.trage) und rastet am Anschlag ein.
// Am Handy stehen Tafel und Hocker genau hinter der Mitte der Mitfahrt (über dem Satz im schmalen Bild).
// Der rote Faden steigt am Bandanfang auf das Band, läuft auf den Rollen vor den Trägern entlang und verlässt es über die Ausgabeklappe.

const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Werkzeuge (Schattenbrett): Formen in Einheiten der Werkzeuglänge (y 0 = Haken, y 1 = Ende) ----------
const TOOL = {
  hammer: [{ r: [-.035, .2, .035, 1, .03] }, { p: [[-.22, .02], [.16, .02], [.2, .1], [.16, .17], [-.22, .17]] }],
  dreher: [{ r: [-.075, .02, .075, .38, .06] }, { r: [-.02, .38, .02, .9, 0] }, { p: [[-.02, .9], [.02, .9], [.011, 1], [-.011, 1]] }],
  schluessel: [{ ring: [0, .11, .055, .11] }, { r: [-.04, .2, .04, .8, .02] }, { ring: [0, .89, .055, .11] }],
  zange: [{ p: [[-.04, 0], [.04, 0], [.06, .3], [.15, 1], [.08, 1], [0, .4], [-.08, 1], [-.15, 1], [-.06, .3]] }, { c: [0, .3, .04] }],
  winkel: [{ p: [[-.22, 0], [-.13, 0], [-.13, .9], [.42, .9], [.42, 1], [-.22, 1]] }],
  zwinge: [{ p: [[-.2, .06], [.2, .06], [.2, .14], [-.12, .14], [-.12, .86], [.2, .86], [.2, .94], [-.2, .94]] }, { r: [.1, .0, .14, .62, 0] }, { r: [.05, .62, .19, .67, .01] }, { r: [.02, -.02, .22, .03, .015] }],
  saege: [{ p: [[-.1, 0], [.1, 0], [.12, .26], [-.12, .26]] }, { p: [[-.12, .26], [.12, .26], [.07, 1], [-.03, 1]] }],
  lehre: [{ r: [-.035, 0, .035, 1, .01] }, { p: [[.035, .02], [.24, .02], [.24, .06], [.1, .15], [.035, .15]] }, { r: [-.06, .42, .07, .56, .01] }, { p: [[.07, .42], [.24, .42], [.24, .46], [.1, .52], [.07, .52]] }],
  lupe: [{ ring: [0, .2, .14, .19] }, { r: [-.035, .38, .035, 1, .03] }],
  zirkel: [{ p: [[-.03, .04], [.01, .04], [-.13, 1], [-.16, 1]] }, { p: [[-.01, .04], [.03, .04], [.16, 1], [.13, 1]] }, { c: [0, .05, .05] }],
  pinsel: [{ r: [-.04, 0, .04, .55, .03] }, { r: [-.055, .55, .055, .7, 0] }, { p: [[-.055, .7], [.055, .7], [.045, 1], [-.045, 1]] }]
};
// Werkzeugtafel: Lochraster, gemalte Umrisse (Schatten), darauf die Werkzeuge an Haken. set: [[art, x (E), y (E von oben), Länge (E), Drehung]]
function tafel(x, W, H, BW, BH, set) {
  const s = W / BW, BG = "#ece7dd";
  x.fillStyle = BG; x.fillRect(0, 0, W, H);
  x.fillStyle = ink(.1);
  for (let gy = .18; gy < BH - .1; gy += .16) for (let gx = .18; gx < BW - .1; gx += .16) { x.beginPath(); x.arc(gx * s, gy * s, .014 * s, 0, 7); x.fill(); }
  x.strokeStyle = ink(.3); x.lineWidth = .008 * s; x.strokeRect(.05 * s, .05 * s, W - .1 * s, H - .1 * s);
  const shape = (pr, L) => {
    x.beginPath();
    if (pr.r) { const [a, b, c, d, q] = pr.r; x.roundRect(a * L, b * L, (c - a) * L, (d - b) * L, q * L); }
    else if (pr.c) x.arc(pr.c[0] * L, pr.c[1] * L, pr.c[2] * L, 0, 7);
    else if (pr.ring) x.arc(pr.ring[0] * L, pr.ring[1] * L, pr.ring[3] * L, 0, 7);
    else { pr.p.forEach(([u, v], i) => i ? x.lineTo(u * L, v * L) : x.moveTo(u * L, v * L)); x.closePath(); }
  };
  for (const [k, tx, ty, len, rot] of set) {
    const L = len * s;
    x.save(); x.translate(tx * s, ty * s); x.rotate(rot || 0);
    // gemalter Schattenumriss (etwas größer als das Werkzeug, leicht versetzt): so hängt es auf einem echten Schattenbrett
    x.save(); x.translate(.018 * s, .026 * s); x.fillStyle = x.strokeStyle = "#d3c9b8"; x.lineWidth = .05 * s; x.lineJoin = "round";
    for (const pr of TOOL[k]) { shape(pr, L); x.fill(); x.stroke(); }
    x.restore();
    // Werkzeug: Papierfläche mit Haarkante
    x.lineWidth = .009 * s; x.strokeStyle = ink(.6); x.lineJoin = "round";
    for (const pr of TOOL[k]) {
      shape(pr, L); x.fillStyle = "#f7f4ee"; x.fill(); x.stroke();
      if (pr.ring) { x.beginPath(); x.arc(pr.ring[0] * L, pr.ring[1] * L, pr.ring[2] * L, 0, 7); x.fillStyle = BG; x.fill(); x.stroke(); }
    }
    // Haken am Aufhängepunkt
    x.fillStyle = ink(.55); x.beginPath(); x.arc(0, -.035 * s, .022 * s, 0, 7); x.fill();
    x.restore();
  }
}
// je Tafel drei Werkzeuge in eigener Lage: [Art, x (Anteil der Breite), y (Anteil der Höhe), Länge (E), Drehung (0 = hängt senkrecht, −π/2 = liegt quer)]
const QT = Math.PI / 2;
const SETS = [
  [["hammer", .14, .14, 1.25, -QT], ["zange", .74, .1, 1.15, .3], ["dreher", .16, .5, 1.05, -QT + .12]],
  [["pinsel", .15, .12, 1.05, -.55], ["zirkel", .62, .1, 1.15, 0], ["winkel", .18, .58, 1.1, -QT]],
  [["zwinge", .2, .1, 1.05, 0], ["schluessel", .72, .1, .95, .55], ["saege", .45, .55, 1.35, -QT]],
  [["lehre", .1, .2, 1.9, -QT], ["lupe", .22, .5, .95, .35], ["winkel", .55, .55, 1.0, -QT]]
];

export default function (K) {
  const { F, R, V, Q, COL, narrow: N } = K;
  const c3 = s => { const c = new K.THREE.Color(s); return [c.r, c.g, c.b]; };
  const PLATE = c3("#faf8f3"), BELT = c3("#e8e1d2"), BODY = c3("#e1d9c9"), WOOD = c3("#e1d9c9"), BOARD = c3("#ece7dd"), GAUGE = c3("#d6ccba"), STOOL = c3("#e8e1d2");
  const lean = K.lean, UP = Q - lean;

  // ---------- Sätze ----------
  const kp = K.kopf({ kicker: "Wie ich arbeite", head: "Allein, wofür früher ein Team nötig war", headLines: ["Allein, wofür früher", "ein Team nötig war"] });
  const mE = N ? 15.5 : 16.5;
  const S = [
    "Ich arbeite mit aktuellen *KI-Werkzeugen* und habe dafür *eigene Abläufe* entwickelt.",
    "Damit schaffe ich *allein* Projekte, für die früher ein kleines Team nötig war, etwa Schnittstellen oder Datenumzüge.",
    "Entscheidungen und Verantwortung bleiben bei mir, und *ausgeliefert wird nur, was ich geprüft habe*."
  ].map(t => K.satz(t, { maxEm: mE }));

  // ---------- Maße der Träger ----------
  const PX = N ? .3 : .4, PY = N ? .24 : .3;
  const visS = s => (.72 + (s.t.lines.length - 1) * K.LH + .24) * s.e;
  const kopfVis = .72 * kp.eK + .5 * kp.eH + (.72 + 1.12 + .24) * kp.eH;
  const PW = Math.max(kp.w, ...S.map(s => s.tw)) + 2 * PX;
  const PH = [kopfVis + 2 * PY, ...S.map(() => Math.max(...S.map(visS)) + 2 * PY)];
  const tw = [kp.w, ...S.map(s => s.tw)];

  // ---------- Tiefen ----------
  const HB = .5;                                   // Höhe des Bandes
  const ZH = 0;                                    // Scharnierlinie der Träger
  const LZ = -.3;                                  // Lesetiefe (Mitte der Textflächen)
  const HBP = .08;                                 // Grundplatte der Werkstückträger
  const ZF = ZH + 1.35;                            // Vorderkante des Bandes
  const ZBK = ZH - Math.max(...PH) - .15;          // Hinterkante (Platz für die liegenden Träger)
  const FZ = ZH + .95;                             // Faden auf dem Band
  const ZST = ZBK - .8;                            // Hocker hinter dem Band
  const ZTB = ZBK - 2.5, BH = N ? 4.2 : 3.6;       // Werkzeugtafeln

  // ---------- Lage entlang x (Mitfahrt vorab: der Weg D hängt nicht von der Strecke ab) ----------
  const minD = N ? 0 : .9;
  const Dk = tw.map(w => K.trage(0, w, { minD }).D);
  const BX0 = 0, GD = 3.0;
  const cF = [];
  cF[0] = BX0 + .45 + Dk[0] + PW / 2;
  for (let i = 1; i < 4; i++) cF[i] = cF[i - 1] + PW + Math.max(N ? 0 : GD, Dk[i] + .9);
  // Band-Module: jedes beginnt kurz vor der Startlage seines Trägers
  const mx = [BX0];
  for (let i = 1; i < 4; i++) mx[i] = cF[i] - Dk[i] - PW / 2 - .35;
  const XEND = cF[3] + PW / 2 + .5;                // Bandende (Ausgabeklappe)
  mx[4] = XEND;
  // Bild zum Satz (Tafel, Hocker): am Handy genau hinter der Mitte der Mitfahrt, damit es über dem Satz im schmalen Bild steht
  const xm = cF.map((c, i) => N ? c - Dk[i] / 2 : c);
  const rr3 = Math.min(Dk[3], K.halfW * .5);
  const XS = BX0 - K.halfW, XE = cF[3] + rr3 / 2 + (N ? 1.6 : 1.2);
  K.strecke(XS, XE);
  const sicht = K.sicht;

  // ---------- Bogen ----------
  K.sheet(BX0 - 3, XEND + 3, LZ - 12, LZ + 3);

  // ---------- Band-Module (Rollenbahn): Platte hebt sich, Schürze und Seiten klappen hoch ----------
  const mods = [];
  for (let i = 0; i < 4; i++) {
    const x0 = mx[i], x1 = mx[i + 1], W = x1 - x0, D = ZF - ZBK;
    const t = Math.max(0, sicht(x0).in - .004);
    F.part("band" + i, Math.max(0, t - .02), .03);
    const fr = K.panel(R, [x0, ZF], [x1, ZF], [0, 1], t, .03, Q);
    K.rect(fr, 0, 0, W, HB, BODY, .45);
    // Schürze: Oberholm und Beine (gezogene Linien)
    F.line(fr, fr.uv(.04, HB - .09), fr.uv(W - .04, HB - .09), .3);
    for (const u of [.12, W - .12]) { F.line(fr, fr.uv(u - .05, 0), fr.uv(u - .05, HB - .09), .3); F.line(fr, fr.uv(u + .05, 0), fr.uv(u + .05, HB - .09), .3); }
    if (i === 0) { const sl = K.panel(R, [x0, ZF], [x0, ZBK], [-1, 0], t, .03, Q); K.rect(sl, 0, 0, D, HB, BODY, .45); }
    if (i === 3) { const sr = K.panel(R, [x1, ZF], [x1, ZBK], [1, 0], t, .03, Q); K.rect(sr, 0, 0, D, HB, BODY, .45); }
    const L = F.lift(R, HB, t, .035, { over: .03 });
    F.poly(L, [[x0, ZF], [x1, ZF], [x1, ZBK], [x0, ZBK]], BELT, .45);
    // Rollen: Querlinien, seitlich zwei Leisten
    const col = COL.INK;
    for (let x = x0 + .14; x < x1 - .05; x += .22) F.line(L, [x, ZF - .1], [x, ZBK + .1], .16, col, .0006);
    F.line(L, [x0, ZF - .1], [x1, ZF - .1], .3, col, .0006);
    F.line(L, [x0, ZBK + .1], [x1, ZBK + .1], .3, col, .0006);
    mods.push({ L, t });
  }

  // ---------- Träger: liegen auf dem Band, stehen zurückgelehnt auf, laufen an ihren Anschlag ----------
  const prints = [[kp.k, kp.h], [S[0]], [S[1]], [S[2]]];
  const TR = [];
  for (let i = 0; i < 4; i++) {
    const T = K.trage(cF[i], tw[i], { minD });
    const c0 = T.c0, xl = c0 - PW / 2;
    const tIn = sicht(xl + (N ? 0 : PW * .3)).in;
    const tP = Math.max(mods[i].t + .035, tIn);
    F.part("traeger" + i, Math.max(0, tP - .025), .025);
    const par = T.node(mods[i].L);
    // Werkstückträger: Grundplatte auf den Rollen, darin steckt die Karte zwischen zwei Passecken
    const base = K.slab(par, xl - .14, xl + PW + .14, ZH + .22, ZH - .3, HBP, Math.max(mods[i].t + .03, tP - .012), .02, { col: GAUGE, top: GAUGE });
    F.line(base, [xl - .1, ZH + .17], [xl + PW + .1, ZH + .17], .3);
    const pl = K.panel(base, [xl, ZH], [xl + PW, ZH], [0, -1], tP, N ? .03 : .04, UP, { over: .04 });
    const H = PH[i];
    K.rect(pl, 0, 0, PW, H, PLATE, .5);
    for (const u0 of [-.07, PW - .12]) {
      const ec = K.panel(base, [xl + u0, ZH + .035], [xl + u0 + .19, ZH + .035], [0, -1], tP + .012, .03, UP, { over: .03 });
      K.rect(ec, 0, 0, .19, .27, WOOD, .5);
    }
    const on = tP + (N ? .035 : .045);
    // Druck: Textblock links bei uL, Oberkante (Versalhöhe) bei vTop
    const put = (pr, uL, vTop) => { pr.on = on; K.onPanel(pl, pr, uL + pr.w / 2 - pr.t.padX * pr.e, vTop + .32 * pr.e - pr.h / 2, 1, [0, -1]); };
    if (i === 0) {
      const uL = (PW - kp.w) / 2, vT = H - PY;
      put(kp.k, uL, vT);
      put(kp.h, uL, vT - .72 * kp.eK - .5 * kp.eH);
    } else {
      const s = S[i - 1], vis = visS(s);
      put(s, (PW - s.tw) / 2, H / 2 + vis / 2);
    }
    // Anschlag (eigene Vorrichtung) rechts der Endlage
    const xa = cF[i] + PW / 2 + .17;
    const an = K.panel(mods[i].L, [xa, ZH + .14], [xa, ZH - .42], [1, 0], mods[i].t + .02, .03, Q, { over: .03 });
    K.rect(an, 0, 0, .56, .2, WOOD, .45);
    TR.push({ T, c0, tP, on, pl });
  }

  // ---------- Prüfstation: hinter dem letzten Träger steht der Prüfbügel hochgeklappt. Er schwenkt nach vorn und greift über die Oberkante
  //            der Karte (passt), der rote Prüfpunkt sitzt dort, wo Bügel und Karte sich treffen; der Bügel schwenkt zurück, die Ausgabeklappe
  //            senkt sich, erst dann läuft der Träger zur Ausgabe ----------
  const T3 = TR[3].T, cS = TR[3].c0, bGo = T3.D > 0 ? T3.bA : sicht(cF[3]).mitte;
  const tUp = Math.max(TR[3].on + .004, bGo - .075), tDot = tUp + .016, tDn = Math.max(tDot + .008, Math.min(tUp + .045, bGo - .017));
  const yT = HB + HBP + PH[3] * Math.cos(lean) + .03, zT = ZH - PH[3] * Math.sin(lean) + .04, z0 = zT - .95;
  const Lb = Math.hypot(yT - HB, zT - z0), aC = Math.atan2(yT - HB, z0 - zT), aO = Q - .35;
  const GW = PW + .34, gx0 = cS - GW / 2, GB = .09;
  F.part("lehre", Math.max(0, mods[3].t + .01), .03);
  const bA = K.panel(mods[3].L, [gx0, z0], [gx0 + GW, z0], [0, -1], TR[3].tP, .035, aO, { over: .03 });
  const bug = K.panel(bA, [gx0, z0], [gx0 + GW, z0], [0, -1], tUp, .016, aC - aO, { over: .02, dn: { t0: tDn, d: .015 } });
  K.rect(bug, 0, 0, GB, Lb, GAUGE, .5);
  K.rect(bug, GW - GB, 0, GW, Lb, GAUGE, .5);
  K.rect(bug, GB, Lb - .14, GW - GB, Lb, GAUGE, .5);
  // Lagerböcke des Bügels auf dem Band
  for (const u of [0, GW - .16]) K.rect(K.panel(mods[3].L, [gx0 + u, z0 + .06], [gx0 + u + .16, z0 + .06], [0, 1], mods[3].t + .03, .03, Q), 0, 0, .16, .16, WOOD, .45);
  // roter Prüfpunkt: sitzt auf dem Träger in der Ecke, die die Lehre freilässt, und fährt mit ihm zur Ausgabe
  const dot = K.decal(96, 96, (x, W, H) => { x.fillStyle = RED; x.beginPath(); x.arc(W / 2, H / 2, W * .46, 0, 7); x.fill(); }, .17, .17, tDot, .008);
  K.onPanel(TR[3].pl, dot, PW - .24, PH[3] - .12, 1, [0, -1]);
  // Ausgabeklappe am Bandende: steht als Sperre, senkt sich nach der Prüfung
  const gate = K.panel(mods[3].L, [XEND, ZH + .4], [XEND, ZBK + .25], [1, 0], mods[3].t + .02, .03, Q, { dn: { t0: tDot + .006, d: .03 }, over: .03 });
  K.rect(gate, 0, 0, ZH + .4 - (ZBK + .25), .62, WOOD, .45);

  // ---------- Plätze hinter dem Band: drei Schnittmuster eines Hockers (früheres Team), ein Hocker steht an der Prüfstation ----------
  const HS = .5, HH = .62, LW = .08;
  const hockerNetz = (x, z) => {
    const x0 = x - HS / 2, x1 = x + HS / 2, zf = z + HS / 2, zb = z - HS / 2;
    return [[[x0, zf], [x1, zf], [x1, zb], [x0, zb]],
      ...[[x0, x0 + LW], [x1 - LW, x1]].flatMap(([a, b]) => [[[a, zf], [b, zf], [b, zf + HH], [a, zf + HH]], [[a, zb], [b, zb], [b, zb - HH], [a, zb - HH]]])];
  };
  for (let i = 0; i < 3; i++) {
    const x = xm[i] + (N ? 0 : PW * .18), t = Math.max(0, sicht(x - .5).in);
    F.part("platz" + i, t, .03);
    const g = F.lift(R, 0, t + .02, .02);
    for (const pts of hockerNetz(x, ZST)) F.poly(g, pts, STOOL, .5, 0, COL.INK, { ghost: 1 });
  }
  {
    const x = xm[3] + (N ? 0 : PW * .18), z = ZST, t = Math.max(0, sicht(x - .5).in + .005);
    F.part("hocker", t, .03);
    const x0 = x - HS / 2, x1 = x + HS / 2, zf = z + HS / 2, zb = z - HS / 2;
    const top = F.lift(R, HH, t + .02, .04, { over: .02 });
    F.poly(top, [[x0, zf], [x1, zf], [x1, zb], [x0, zb]], STOOL, .5);
    const down = { own: R, over: .03 };
    for (const [a, b] of [[x0, x0 + LW], [x1 - LW, x1]]) {
      K.rect(K.panel(top, [a, zf], [b, zf], [0, 1], t + .045, .03, -Q, down), 0, 0, LW, HH, WOOD, .45);
      K.rect(K.panel(top, [a, zb], [b, zb], [0, -1], t + .05, .03, -Q, down), 0, 0, LW, HH, WOOD, .45);
    }
  }

  // ---------- Werkzeugtafeln hinter jeder Station (eigene Werkzeuge, jedes an seinem Platz) ----------
  for (let i = 0; i < 4; i++) {
    const BW = Math.min(PW + .2, 3.3), bx0 = xm[i] - BW / 2 + (N ? 0 : i % 2 ? .25 : -.25);
    const t = Math.max(0, sicht(bx0).in + .005);
    F.part("tafel" + i, t, .035);
    const bd = K.panel(R, [bx0, ZTB], [bx0 + BW, ZTB], [0, -1], t + .02, .045, Q - .14, { over: .04 });
    K.rect(bd, 0, 0, BW, BH, BOARD, .45);
    const wpx = 1400, hpx = Math.round(wpx * BH / BW);
    const set = SETS[i].map(([k, fx, fy, l, r]) => [k, fx * BW, fy * BH, l * Math.min(1, BW / 3.3), r]);
    K.onPanel(bd, K.decal(wpx, hpx, (x, W, H) => tafel(x, W, H, BW, BH, set), BW, BH, t + .06), BW / 2, BH / 2, 1, [0, -1]);
    // Stützen hinten
    for (const [u, sd] of [[.1, -1], [BW - .1, 1]]) {
      const st = K.panel(bd, bd.uv(u, 0), bd.uv(u, BH * .8), [sd, 0], t + .05, .03, -Q, { over: .03 });
      K.P(st, [[0, 0], [BH * .8, 0], [0, .55]], WOOD, .35);
    }
  }

  // ---------- Faden: steigt am Bandanfang auf die Rollen, läuft vor den Trägern, verlässt das Band über die Ausgabeklappe ----------
  const yB = HB + .012;
  const faden = [
    [BX0 - 1.4, .004, FZ], [BX0 - .3, .004, FZ], [BX0 - .04, HB * .6, FZ], [BX0 + .25, yB, FZ],
    [XEND - .3, yB, FZ], [XEND + .04, HB * .55, FZ], [XEND + .4, .004, FZ], [XEND + 3, .004, FZ]
  ];

  return {
    strecke: [XS, XE], lineZ: LZ,
    faden,
    anchor: XS,
    stops: prints.map((p, i) => ({ name: "x" + i, prints: p }))
  };
}
