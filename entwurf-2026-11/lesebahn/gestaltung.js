// Szene „Gestaltung“ (Lesebahn, Fassung „Die Szene ist der Träger“). Drehbuch: DREHBUCH-LESEBAHN.md, Abschnitt 11 (Trägerform dort ersetzt).
// Das Ding ist ein Atelier aus vier Staffeleien in einer Reihe, auf denen die Sätze entstehen: erst Bleistift (Hilfslinien, Schriftlinien,
// Umriss der Buchstaben), dann ausgeführt (gefüllt). Entwurf und Umsetzung aus einer Hand, so wie der Satz es sagt.
//   S1  Staffelei mit Schild „Gestaltung“ (Kopf, D0) und Entwurfsblatt: „Für mich gehört Gestaltung zur Entwicklung.“ (D1)
//   S2  Entwurfsblatt: „Ich entwerfe Erscheinungsbilder … selbst oder setze vorhandene Entwürfe sorgfältig um.“ (D2)
//   S3  breite Staffelei (Doppelstaffelei) mit den Blättern der Beispiele: NOVUM-Cover (hochkant) und „100 Jahre Audi“ (quer), die Bildflächen
//       bleiben Bleistiftflächen, der Titel steht klein am Rand; auf dem Schild darüber steht der Satz der Beispiele (D3)
//   S4  Staffelei mit dem Plakat (hochkant): nur der kleine Kicker „Ehrenamtlich“ und eine leere Bleistiftfläche (Zustimmung fehlt, kein Name)
// Jede Staffelei ist echt gebaut: Mittelmast (ragt über das Blatt hinaus), zwei Vorderbeine in A-Form (klappen aus dem Mast auseinander und stehen
// gespreizt auf dem Bogen), Klemmleiste oben am Blatt, Ablage unter dem Blatt, ein drittes Bein nach hinten. Das Blatt steht auf der Ablage.
// Alle Staffeleien lehnen zurück (um die Neigung der Kamera, K.lean): ihre Fläche steht der Kamera genau zugewandt, die Schrift hat dort überall
// dieselbe Größe. Alles klappt aus dem Bogen.
// Handy: die Staffelei steht auf Laufschienen (zwei Schienen, vorn und unter der hinteren Stütze) und rollt ein Stück mit der Kamera mit
// (K.trage), bis der Satz lange genug ruhig im Bild steht.

const ink = a => `rgba(48,48,51,${a})`;
const PEN = "rgba(58,58,66,.68)", PENW = 5.5;     // Bleistift: Umriss der Buchstaben (Breite in Pixeln der Druckfläche, 120 px je em)

export default function (K) {
  const { F, R, Q, PI, narrow: N, THREE } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const BOARD = c3("#e8e1d2"), POST = c3("#dcd3c0"), LEDGE = c3("#e1d9c9"), SIGN = c3("#f1ece0"), PAGE = c3("#fbfaf7"), STRUT = c3("#d6cfc0"),
    WALL = c3("#f2eee5"), RAIL = c3("#d9d3c6");
  const lean = K.lean, UP = Q - lean, EC = K.EC, LH = K.LH, HW = K.halfW, sicht = K.sicht;
  const LZ = 0, ZC = LZ + K.YL * Math.tan(lean);          // Fuß der Staffeleien: ihre Fläche geht genau durch den Lesepunkt (überall gleiche Schriftgröße)
  const cosL = Math.cos(lean), sinL = Math.sin(lean);

  // ---------- Text: je Satz ein Druck ausgeführt (fill) und ein Bleistiftumriss (pen) ----------
  const D1 = "Für mich gehört *Gestaltung zur Entwicklung*.";
  const D2 = "Ich *entwerfe Erscheinungsbilder und Oberflächen selbst* oder setze vorhandene Entwürfe sorgfältig um.";
  const D3 = "Beispiele sind das NOVUM-Cover und das Ausstellungsmotiv „100 Jahre Audi“.";
  const satz = (text, e, maxEm) => {
    const lines = K.wrap(text, maxEm, { font: "lese" });
    const fill = K.satz(text, { e, lines, on: 9, fade: .03 });
    const pen = K.print(lines, e, 9, { font: "lese", lh: LH, outline: PENW, col: PEN, text, fade: .025 });
    return { fill, pen, n: lines.length, e, lh: LH };
  };
  const s1 = satz(D1, EC * 1.25, N ? 10.5 : 16), s2 = satz(D2, EC, N ? 10.5 : 17), s3 = satz(D3, EC, N ? 14 : 21);
  const kp = K.kopf({ head: "Gestaltung", on: 9 });
  kp.h.fade = .03;
  const kpen = K.print(["Gestaltung"], kp.eH, 9, { font: "kopf", lh: 1.12, outline: PENW, col: PEN, text: "Gestaltung", fade: .025 });
  const sk = { fill: kp.h, pen: kpen, n: 1, e: kp.eH, lh: 1.12 };

  // ---------- Maße ----------
  const LV0 = .55, LV = LV0, LD = .5, SV0 = LV + .06, GAP = N ? .9 : 1.7, MG = N ? .3 : .8;
  const SHT = N ? 2.7 : 2.9;                                  // Höhe der Entwurfsblätter
  const hSign1 = sk.fill.h + .5, vSign1 = SV0 + SHT + .25;     // Schild „Gestaltung“
  const Hb1 = vSign1 + hSign1 + .3, Hb2 = SV0 + SHT + .8;
  // Beispiele: NOVUM hochkant (230 : 297), Audi quer (3 : 2)
  const Hn = N ? 1.9 : 2.9, Wn = Hn * 230 / 297, Wa = N ? 2.1 : 3.9, Ha = Wa * 2 / 3, SGAP = N ? .3 : .5;
  // Handy: das Satzschild sitzt unten am Mast, die Beispielblätter stehen darüber auf der Ablage (Bild über dem Satz, füllt die obere Bildhälfte)
  const hSign3 = s3.fill.th + .55, vSign3 = N ? .2 : SV0 + Hn + .25;
  const LV3 = N ? vSign3 + hSign3 + .12 : LV, SV3 = LV3 + .06, Hb3 = N ? SV3 + Hn + .8 : vSign3 + hSign3 + .3;
  // Plakat hochkant (594 : 841)
  const Hp = N ? 2.6 : 3.5, Wp = Hp * 594 / 841, Hb4 = SV0 + Hp + .8;
  // Breite der Blattgruppe (halbe Breite hw), Spreizung S der Vorderbeine (halbe Fußweite), Gesamtbreite W
  const HWs = [Math.max(s1.fill.tw + 2 * MG, 0) / 2, (s2.fill.tw + 2 * MG) / 2, (Wn + SGAP + Wa) / 2 + .15, (Wp + .5) / 2];
  const signHW = [kp.w / 2 + .5, 0, Math.max(s3.fill.tw / 2 + .4, 0), 0];
  const SP = HWs.map((h, i) => { const v = Math.max(1.15 * h + .35, signHW[i] + .2, 1.2); return N ? Math.min(v, 2.05) : v; });
  const W = SP.map(v => 2 * v + .3);
  const TW = [s1.fill.tw, s2.fill.tw, s3.fill.tw, 0];

  // ---------- Strecke: Startlagen (links) und Endlagen; Mitfahrt am Handy ----------
  K.strecke(0, 30);
  const TR = [54, 50, 52].map((R_, i) => K.trage(0, TW[i], { R: R_ }));
  const DD = [TR[0].D, TR[1].D, TR[2].D, 0];
  const L = [0, 0, 0, 0], FL = [0, 0, 0, 0];      // linke Kante in Startlage / Endlage
  for (let i = 0; i < 4; i++) { L[i] = i ? FL[i - 1] + W[i - 1] + GAP : 0; FL[i] = L[i] + DD[i]; }
  const CF = FL.map((f, i) => f + W[i] / 2);
  const XS = L[0] - HW, XE = CF[3];
  K.strecke(XS, XE);
  const T = [0, 1, 2].map(i => K.trage(CF[i], TW[i], { R: [54, 50, 52][i] }));
  T.push({ D: 0, c0: CF[3], bA: 0, bB: 0, node: par => par });
  const X0 = i => T[i].c0 - W[i] / 2;               // linke Kante in Startlage
  const bAt = K.bAt;

  // ---------- Bogen und Rückwand ----------
  K.sheet(XS - 3, XE + 3.5, LZ - 40, LZ + 3.5);

  // ---------- Hilfen ----------
  const rectSegs = (nd, u0, v0, u1, v1) => [[nd.uv(u0, v0), nd.uv(u1, v0)], [nd.uv(u1, v0), nd.uv(u1, v1)], [nd.uv(u1, v1), nd.uv(u0, v1)], [nd.uv(u0, v1), nd.uv(u0, v0)]];
  // Bleistift: zwei leicht versetzte Striche
  const pencil = (nd, segs, t0, d, a, opt = {}) => {
    F.sketch(nd, segs, t0, d, { a, dy: .0045, ...opt });
    F.sketch(nd, segs.map(([p, q]) => [[p[0] + .008, p[1] - .007], [q[0] - .006, q[1] + .006]]), t0 + .006, d, { a: a * .5, dy: .0047, ...opt });
  };
  // Schriftlinien (Grundlinie, x-Höhe, Oberlänge) unter den Zeilen eines Satzes
  const guides = (nd, s, cx, cy, on, tf) => {
    const p = s.fill, e = s.e, gw = p.w + .8, gh = p.h + .3, PXU = 150;
    const mk = k => K.decal(Math.round(gw * PXU), Math.round(gh * PXU), (x, Wd) => {
      x.lineCap = "round";
      for (let i = 0; i < s.n; i++) {
        const yb = ((gh - p.h) / 2 + (1.04 + i * s.lh) * e) * PXU;
        for (const [dy, a, lw] of [[0, .3, 2.2], [.46, .17, 1.6], [.72, .1, 1.4]]) {
          x.strokeStyle = ink(a * k); x.lineWidth = lw; x.beginPath(); x.moveTo(.05 * PXU, yb - dy * e * PXU); x.lineTo(Wd - .05 * PXU, yb - dy * e * PXU); x.stroke();
        }
      }
    }, gw, gh, 0, .03);
    const g1 = mk(1), g2 = mk(.3);            // kräftig bis zur Ausführung, danach auf etwa 30 % zurückgenommen
    g1.on = on; g1.off = tf + .02; g2.on = tf;
    K.onPanel(nd, g1, cx, cy, 1, [0, -1], .0055);
    K.onPanel(nd, g2, cx, cy, 1, [0, -1], .0055);
  };
  // Zeitpunkte b: Bleistift und Ausführung eines Satzes (Breite tw, Mitte xc), off = Abstand (Welteinheiten) nach dem vollen Eintritt
  const RIM = .12;
  const zeit = (i, tw, off, tin) => {
    const t = T[i], c0 = t.c0;
    const xin = c0 + tw / 2 + RIM - HW;               // Kamera-x, ab dem der Satz in Startlage ganz im Bild steht
    const pen = Math.max(bAt(xin + .12), tin + .09);
    const fill = Math.max(pen + .012, bAt(xin + off));
    return { pen, fill };
  };
  const setzen = (s, nd, cx, cy, tm, tg) => {
    const f = s.fill, p = s.pen;
    guides(nd, s, cx, cy, tg, tm.fill);
    p.on = tm.pen; f.on = tm.fill; p.off = tm.fill + .02;
    K.onPanel(nd, p, cx, cy, 1, [0, -1], .0065);
    K.onPanel(nd, f, cx, cy, 1, [0, -1], .0078);
  };

  // ---------- Staffelei ----------
  const stand = (i, tag, Hb, struts, tin, LV = LV0) => {
    const x0 = X0(i), Wb = W[i], par = T[i].node(R);
    F.part(tag, tin, .04);
    if (T[i].D > 0) {                                             // Laufschienen (Handy)
      const rx0 = x0 - .3, rx1 = FL[i] + Wb + .3;
      const Pv = (Hb - .35) * .75, zb = ZC - Pv * sinL - Pv * cosL / Math.tan(62 * PI / 180);
      K.slab(R, rx0, rx1, ZC + .2, ZC - .1, .05, tin + .02, .03, { col: RAIL, top: RAIL, walls: "flr" });
      K.slab(R, rx0, rx1, zb + .12, zb - .12, .05, tin + .02, .03, { col: RAIL, top: RAIL, walls: "flr" });
    }
    // Mittelmast (lehnt zurück, ragt über das Blatt hinaus), Vorderbeine in A-Form, Ablage, drittes Bein nach hinten
    const cx = Wb / 2, S = SP[i], Hap = Hb - .35, hwl = HWs[i] + .25;
    const br = K.panel(par, [x0, ZC], [x0 + Wb, ZC], [0, -1], tin + .035, .045, UP, { over: .04 });
    K.P(br, [[cx - .11, 0], [cx + .11, 0], [cx + .11, Hb], [cx - .11, Hb]], POST, .45);
    const Ll = Math.hypot(S, Hap), th = Math.atan2(S, Hap);
    for (const sd of [-1, 1]) {
      const sp = F.spin(br, br.uv(cx, Hap), sd * th, tin + .065, .05, { nocut: true, nofold: true, over: .03, lv: br.lvl + 1 });
      F.poly(sp, [br.uv(cx - .11, Hap), br.uv(cx + .11, Hap), br.uv(cx + .1, Hap - Ll), br.uv(cx - .1, Hap - Ll)], POST, .45);
    }
    const led = K.panel(br, br.uv(cx - hwl, LV), br.uv(cx + hwl, LV), [0, -1], tin + .08, .03, Q, { over: .03 });
    K.rect(led, 0, 0, 2 * hwl, LD, LEDGE, .5);
    const Pv = Hap * .75, phi = 62 * PI / 180, yP = Pv * cosL, Ls = yP / Math.sin(phi);
    const back = -Math.acos(sinL * Math.cos(phi) - cosL * Math.sin(phi));   // Stütze gegen die Brettrichtung, zur Rückseite hin gedreht
    const st = K.panel(br, br.uv(cx - .1, Pv), br.uv(cx + .1, Pv), [0, -1], tin + .075, .04, back, { over: .04 });
    K.rect(st, 0, 0, .2, Ls, STRUT, .4);
    F.geruest({ tags: [tag], t0: tin, t1: tin + .04, du: .02, a: .5 });
    return br;
  };
  const sheet = (br, u0, v0, u1, v1) => { K.rect(br, u0, v0, u1, v1, PAGE, .45, .0035); K.rect(br, u0 - .08, v1 - .03, u1 + .08, v1 + .13, POST, .4, .0042); };
  const sign = (br, u0, v0, u1, v1) => K.rect(br, u0, v0, u1, v1, SIGN, .4, .0030);
  const tIn = i => Math.max(.004, Math.min(sicht(X0(i)).in, T[i].D > 0 ? T[i].bA - .11 : 9));

  const quiet = [];
  // ---------- S1: Schild „Gestaltung“ und Entwurfsblatt D1 ----------
  const tin1 = tIn(0);
  const b1 = stand(0, "s1", Hb1, [W[0] / 2], tin1); quiet.push(b1);
  {
    const Wb = W[0], cx = Wb / 2, sw = kp.w + 1.0;
    sign(b1, cx - sw / 2, vSign1, cx + sw / 2, vSign1 + hSign1);
    const sx = cx - HWs[0];
    sheet(b1, sx, SV0, Wb - sx, SV0 + SHT);
    pencil(b1, rectSegs(b1, sx + .3, SV0 + .3, Wb - sx - .3, SV0 + SHT - .3), tin1 + .08, .05, .2, { dash: true });
    setzen(sk, b1, cx, vSign1 + hSign1 / 2, zeit(0, kp.w, N ? .1 : .15, tin1), tin1 + .075);
    setzen(s1, b1, cx, SV0 + SHT / 2, zeit(0, TW[0], N ? .9 : 2.2, tin1), tin1 + .08);
  }
  // ---------- S2: Entwurfsblatt D2 ----------
  const tin2 = tIn(1);
  const b2 = stand(1, "s2", Hb2, [W[1] / 2], tin2); quiet.push(b2);
  {
    const Wb = W[1], cx = Wb / 2, sx = cx - HWs[1];
    sheet(b2, sx, SV0, Wb - sx, SV0 + SHT);
    pencil(b2, rectSegs(b2, sx + .3, SV0 + .3, Wb - sx - .3, SV0 + SHT - .3), tin2 + .08, .05, .2, { dash: true });
    setzen(s2, b2, cx, SV0 + SHT / 2, zeit(1, TW[1], N ? .7 : 1.6, tin2), tin2 + .08);
  }
  // ---------- S3: Beispiele (NOVUM-Cover, „100 Jahre Audi“) und Satz D3 ----------
  const tin3 = tIn(2);
  const b3 = stand(2, "s3", Hb3, [], tin3, LV3); quiet.push(b3);
  {
    const Wb = W[2], cx = Wb / 2, sw = s3.fill.tw + .8;
    sign(b3, cx - sw / 2, vSign3, cx + sw / 2, vSign3 + hSign3);
    const inner = Wn + SGAP + Wa, u0 = cx - inner / 2;
    const nov = [u0, u0 + Wn], aud = [u0 + Wn + SGAP, u0 + Wn + SGAP + Wa];
    const vb = SV3, tk = tin3 + .1;
    const arb = (u0_, u1_, h, title) => {
      sheet(b3, u0_, vb, u1_, vb + h);
      const fr = [u0_ + .2, vb + .6, u1_ - .2, vb + h - .2], ps = [];
      ps.push(...rectSegs(b3, ...fr));
      pencil(b3, ps, tin3 + .08, .05, .34);
      pencil(b3, [[b3.uv(fr[0], fr[1]), b3.uv(fr[2], fr[3])], [b3.uv(fr[2], fr[1]), b3.uv(fr[0], fr[3])]], tin3 + .09, .05, .14);
      const tp = K.print([title], EC * .78, tk, { font: "lese", col: "#5f5f63", fade: .03, text: title });
      K.onPanel(b3, tp, u0_ + .22 + tp.w / 2 - tp.t.padX * tp.e, vb + .3, 1, [0, -1], .0065);
    };
    arb(nov[0], nov[1], Hn, "NOVUM-Cover");
    arb(aud[0], aud[1], Ha, "„100 Jahre Audi“");
    setzen(s3, b3, cx, vSign3 + hSign3 / 2, zeit(2, TW[2], N ? .8 : 1.8, tin3), tin3 + .08);
  }
  // ---------- S4: Plakat (hochkant), Ehrenamtlich, leere Bleistiftfläche ----------
  const tin4 = tIn(3);
  const b4 = stand(3, "s4", Hb4, [W[3] / 2], tin4); quiet.push(b4);
  {
    const Wb = W[3], cx = Wb / 2, u0 = cx - Wp / 2, u1 = cx + Wp / 2;
    sheet(b4, u0, SV0, u1, SV0 + Hp);
    const fr = [u0 + .2, SV0 + .2, u1 - .2, SV0 + Hp - .6];
    pencil(b4, rectSegs(b4, ...fr), tin4 + .08, .05, .34);
    pencil(b4, [[b4.uv(fr[0], fr[1]), b4.uv(fr[2], fr[3])], [b4.uv(fr[2], fr[1]), b4.uv(fr[0], fr[3])]], tin4 + .09, .05, .14);
    const kk = K.print(["Ehrenamtlich"], EC * .66, tin4 + .1, { font: "kicker", col: "#5f5f63", fade: .03, text: "Ehrenamtlich" });
    K.onPanel(b4, kk, u0 + .22 + kk.w / 2 - kk.t.padX * kk.e, SV0 + Hp - .32, 1, [0, -1], .0065);
  }
  F.spur({ tags: ["s1", "s2", "s3", "s4"], quiet, a: .3 });

  // ---------- Faden: läuft vor den Staffeleien, schwingt leicht ----------
  const FZ = .9, faden = [[L[0] - 1.2, .004, FZ]];
  for (let i = 0; i < 4; i++) {
    faden.push([CF[i], .004, i % 2 ? FZ : FZ + .1]);
    if (i < 3) faden.push([(CF[i] + W[i] / 2 + FL[i + 1] - DD[i + 1] + CF[i + 1] - W[i + 1] / 2) / 2 + DD[i + 1] / 2, .004, FZ]);
  }
  faden.push([XE + 4, .004, FZ]);
  for (let i = 1; i < faden.length; i++) if (faden[i][0] <= faden[i - 1][0]) faden[i][0] = faden[i - 1][0] + .01;

  return {
    strecke: [XS, XE], lineZ: LZ, faden,
    stops: [
      { name: "g0", prints: [kp.h] },
      { name: "g1", prints: [s1.fill] },
      { name: "g2", prints: [s2.fill] },
      { name: "g3", prints: [s3.fill] }
    ]
  };
}
