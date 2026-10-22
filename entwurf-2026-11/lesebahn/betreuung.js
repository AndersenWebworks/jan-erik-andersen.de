// Szene „Betreuung und Absicherung“ (Lesebahn, Fassung „Die Szene ist der Träger“). Drehbuch Abschnitt 6, Satzliste wörtlich.
// Das Ding: ein Wandkalender (Jahresplaner), dessen Blätter die Website zeigen. Eine Stange mit Ringen läuft durch die ganze Szene, an ihr hängen
// Monatsblätter. Jedes Blatt trägt oben den Monatsnamen (keine Jahreszahl), darunter dieselbe kleine Website als Zeichnung, unten das Kalenderfeld
// mit dem Satz. Zeit und monatliches Nachsehen sind der Inhalt, deshalb ist die Kalenderform der Träger.
//  B0 Kalenderkopf (Deckblatt, dunkleres Papier): der Kopf; die Website ist darauf noch heil.
//  B1 Blatt „März“: in der Website klafft ein ausgeschnittenes Loch im Baustein rechts unten, daneben läuft eine kleine Uhr. Der Satz steht im Kalenderfeld.
//  B2 Blatt „April“: der Baustein sitzt wieder; er klappt auf und rastet mit kleinem Rückprall ein. Der Satz steht im Kalenderfeld.
//  B3 Blätter „Mai“, „Juni“, „Juli“: dieselbe Seite, jedes Blatt mit einem ruhigen Häkchen (ohne Rot). Der Satz steht auf dem aktuellen Blatt „Juli“.
// Aufbau: Hinter jedem Blatt steht ein Stück Wand (Bretter, die nacheinander hochklappen und die Stange tragen). Das Blatt hängt an den Ringen,
// schwingt beim Aufbau von der Wand nach vorn und fällt zurück (kleiner Rückprall). Keine Zahlen als Beleg, kein Angriff abgebildet, Rot nur am Faden.
// Handy: Das Blatt mit dem Satz läuft auf seinen Ringen an der Stange mit (K.trage) und bleibt dann hängen, wie ein Vorhang auf der Stange.

const ink = a => `rgba(48,48,51,${a})`;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Website als Zeichnung, Koordinaten 1000 × 480 (der Aufrufer legt Verschiebung und Maßstab fest) ----------
const HOLE = { x: 690, y: 318, w: 260, h: 124 };            // Inhalt des Bausteins rechts unten (Loch bzw. Flicken)
function card(x, cx, o = {}) {
  x.fillStyle = "#ffffff"; x.strokeStyle = o.fresh ? ink(.8) : ink(.3); x.lineWidth = o.fresh ? 5 : 2.4; x.strokeRect(cx, 310, 280, 140);
  if (o.empty) return;
  const a = o.fresh ? 1.7 : 1;
  x.fillStyle = ink(.08 * a); x.fillRect(cx + 14, 324, 92, 112);
  x.strokeStyle = ink(.3); x.lineWidth = 2.4; x.beginPath(); x.moveTo(cx + 14, 436); x.lineTo(cx + 46, 386); x.lineTo(cx + 66, 410); x.lineTo(cx + 80, 396); x.lineTo(cx + 106, 436); x.stroke();
  x.fillStyle = ink(.36 * a); rr(x, cx + 122, 336, 130, 12, 6); x.fill();
  x.fillStyle = ink(.2 * a); rr(x, cx + 122, 364, 104, 9, 4.5); x.fill(); rr(x, cx + 122, 386, 118, 9, 4.5); x.fill();
  x.strokeStyle = ink(.5); x.lineWidth = 2.4; rr(x, cx + 122, 410, 70, 24, 4); x.stroke();
}
function drawSite(x, o = {}) {
  x.save(); x.globalAlpha = o.a === undefined ? 1 : o.a;
  x.fillStyle = "#ffffff"; x.strokeStyle = ink(.5); x.lineWidth = 2.8; rr(x, 1.5, 1.5, 997, 477, 12); x.fill(); x.stroke();
  x.fillStyle = ink(.07); x.fillRect(3, 3, 994, 32);
  x.fillStyle = ink(.34); for (const cx of [22, 42, 62]) { x.beginPath(); x.arc(cx, 19, 6, 0, 7); x.fill(); }
  x.fillStyle = ink(.1); rr(x, 110, 10, 420, 18, 9); x.fill();
  x.fillStyle = ink(.8); rr(x, 40, 58, 120, 20, 3); x.fill();
  x.fillStyle = ink(.4); for (let i = 0; i < 4; i++) { rr(x, 580 + i * 100, 63, 70, 10, 5); x.fill(); }
  x.fillStyle = ink(.12); x.fillRect(3, 94, 994, 2.5);
  x.fillStyle = ink(.78); rr(x, 40, 124, 440, 24, 4); x.fill(); rr(x, 40, 158, 350, 24, 4); x.fill();
  x.fillStyle = ink(.28); rr(x, 40, 204, 420, 11, 5); x.fill(); rr(x, 40, 226, 380, 11, 5); x.fill();
  x.strokeStyle = ink(.6); x.lineWidth = 2.6; rr(x, 40, 256, 150, 34, 5); x.stroke();
  x.fillStyle = ink(.07); x.fillRect(560, 112, 400, 176);
  x.strokeStyle = ink(.3); x.lineWidth = 2.6; x.lineJoin = "round";
  x.beginPath(); x.moveTo(560, 288); x.lineTo(660, 190); x.lineTo(720, 246); x.lineTo(780, 206); x.lineTo(960, 288); x.stroke();
  x.beginPath(); x.arc(870, 162, 18, 0, 7); x.stroke();
  card(x, 40); card(x, 360);
  card(x, 680, { empty: o.empty });
  x.restore();
}

export default function (K, opt) {
  const { F, R, Q, sm, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const PAGE = c3("#fbfaf7"), COVER = c3("#f1e9d6"), BOARD = c3("#ebe5d6"), FRESH = c3("#fdfcf9");
  const UPA = Q - K.lean;                         // Wand lehnt um die Neigung der Kamera zurück: dem Blick zugewandt
  const LZ = 0, FZ = LZ + .9;
  const ZW = LZ + .62 / Math.tan(UPA);            // Fußlinie der Wand: ihre Ebene geht durch den Lesepunkt (y .62, z LZ)

  // ---------- Maße ----------
  const W = N ? 4.0 : 4.8, MX = N ? .28 : .3, PAD = .12, SWd = W - 2 * MX, HW = SWd * .48, SV0 = .95, RT = .25, PX = 300;
  const EK = K.EC * .95;                           // Monatsname
  const TV = 1.05;                                 // Wandhöhe (Hangneigung) der Mitte des Kalenderfelds
  const MONTH = ["März", "April", "Mai", "Juni", "Juli"];
  const S1T = "Zwischen dem Bekanntwerden einer Lücke in einem WordPress-Plugin und dem ersten Angriff vergehen oft *nur Stunden*.";
  const S2T = "Ich halte Ihre Seite deshalb *laufend aktuell*.";
  const S3T = "Bei betreuten Websites sehe ich *monatlich* nach, ob sie sauber läuft.";
  const mEm = N ? 16.2 : 20.4;
  const kp = K.kopf({ head: "Betreuung und Absicherung", headLines: ["Betreuung und", "Absicherung"], on: 9 });
  const T1 = K.satz(S1T, { maxEm: mEm, on: 9 }), T2 = K.satz(S2T, { maxEm: mEm, on: 9 }), T3 = K.satz(S3T, { maxEm: mEm, on: 9 });
  const FH = Math.max(1.3, Math.max(T1.th, T2.th, T3.th) + .5);       // Höhe des Kalenderfelds
  const SVT = SV0 + HW + .22 + FH / 2;             // Mitte des Kalenderfelds, vom Hängepunkt nach unten gemessen
  const HS = SVT + FH / 2 + .2;                    // Blatthöhe
  const ROD = TV + SVT;                            // Stange: Höhe an der Wand
  const WH = ROD + 1.1;                            // Wandhöhe (oben läuft das Bild aus; das obere Drittel gehört zum Ding)

  // ---------- Layout: Wandstück je Blatt, bei Mitfahrt (Handy) um den Weg D breiter ----------
  const RR = 40;                                   // vh, die der Satz mindestens ruhig und ganz im Bild stehen soll
  const dOf = w => { const slack = Math.max(0, 2 * K.halfW - w - 2 * 24 / K.ppw), still = slack / K.vWorld, D = Math.max(0, RR - still) * K.vWorld; return D < .05 ? 0 : D; };
  const specs = [
    { k: 0, w: kp.h.t.tw * kp.eH },
    { k: 1, w: T1.tw, T: T1 }, { k: 2, w: T2.tw, T: T2 }, { k: 3 }, { k: 4 }, { k: 5, w: T3.tw, T: T3 }
  ];
  let Lc = 0;
  for (const sp of specs) {
    sp.D = sp.w ? dOf(sp.w) : 0; sp.L = Lc; sp.bw = W + 2 * PAD + sp.D; sp.cF = Lc + PAD + sp.D + W / 2; Lc += sp.bw;
  }
  const lastSp = specs[specs.length - 1];
  const xs = -K.halfW, xe = lastSp.cF + (lastSp.D > 0 ? Math.min(lastSp.D, K.halfW * .5) / 2 : 0);   // Handy: die Mitfahrt des letzten Blatts endet noch in der Szene
  K.strecke(xs, xe);
  const bE = e => e / (xe - xs);                   // Strecke (Welteinheiten) in b
  K.sheet(-3, Lc + 5, LZ - 12, LZ + 3);

  // ---------- Hilfen ----------
  // Auslenkung 0 … 1 … 0: hebt sich (sanft), fällt (beschleunigend) und federt einmal kurz zurück
  const flap = (rise, fall) => x => {
    if (x <= 0 || x >= 1) return 0;
    if (x < rise) return sm(x / rise);
    const u = (x - rise) / (1 - rise);
    if (u < fall) { const q = u / fall; return 1 - q * q; }
    const v = (u - fall) / (1 - fall);
    return .09 * (1 - v) * Math.sin(Math.PI * v);
  };
  const sheetEase = flap(.34, .6), patchEase = flap(.4, .6);
  // Lochposition im Blatt (u von links, v vom Hängepunkt nach unten)
  const sx = SWd / 1000, sy = HW / 480;
  const hu0 = MX + HOLE.x * sx, hu1 = MX + (HOLE.x + HOLE.w) * sx, hv0 = SV0 + HOLE.y * sy, hv1 = SV0 + (HOLE.y + HOLE.h) * sy;
  const MIT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const clockR = .27, clockU = W - MX - clockR, clockV = .62;

  // Zeichnung eines Blatts (Ringe, Linien, Website, Uhr, Monatsstreifen), Ursprung am Hängepunkt, oben RT Rand für die Ringe
  const art = k => (x, Wp) => {
    const s = Wp / W;
    x.save(); x.translate(0, RT * s);
    x.strokeStyle = ink(.7); x.lineWidth = .034 * s;
    for (const u of [.8, W - .8]) { x.beginPath(); x.ellipse(u * s, 0, .075 * s, .17 * s, 0, 0, 2 * Math.PI); x.stroke(); }
    if (k > 0) { x.fillStyle = ink(.18); x.fillRect(MX * s, .86 * s, (W - 2 * MX) * s, .012 * s); }
    x.save(); x.translate(MX * s, SV0 * s); x.scale(SWd * s / 1000, HW * s / 480);
    drawSite(x, { a: k === 0 ? .85 : 1, empty: k === 2 });
    if (k === 1) x.clearRect(HOLE.x, HOLE.y, HOLE.w, HOLE.h);
    if (k === 2) { x.fillStyle = ink(.16); x.fillRect(HOLE.x, HOLE.y, HOLE.w, HOLE.h); x.strokeStyle = ink(.5); x.lineWidth = 2.6; x.setLineDash([9, 7]); x.strokeRect(HOLE.x, HOLE.y, HOLE.w, HOLE.h); x.setLineDash([]); }
    x.restore();
    if (k === 0) {
      // Monatsstreifen des Jahresplaners (nur Anfangsbuchstaben)
      const n = 12, g = N ? .07 : .08, t = (W - 2 * MX - (n - 1) * g) / n;
      for (let i = 0; i < n; i++) {
        const X = (MX + i * (t + g)) * s;
        x.fillStyle = i >= 2 && i <= 6 ? ink(.12) : "rgba(255,255,255,.6)"; x.strokeStyle = ink(.3); x.lineWidth = .014 * s;
        rr(x, X, .42 * s, t * s, .4 * s, .03 * s); x.fill(); x.stroke();
        x.fillStyle = ink(.7); x.font = `600 ${.15 * s}px "Schibsted Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
        x.fillText(MIT[i], X + t * s / 2, .62 * s);
      }
    }
    if (k === 1) {
      // Zifferblatt der kleinen Uhr (Zeiger laufen als eigene Teile)
      const cx = clockU * s, cy = clockV * s, r = clockR * s;
      x.fillStyle = "#ffffff"; x.strokeStyle = ink(.6); x.lineWidth = .03 * s; x.beginPath(); x.arc(cx, cy, r, 0, 2 * Math.PI); x.fill(); x.stroke();
      x.lineCap = "round";
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6, big = i % 3 === 0, r0 = r * (big ? .72 : .8), r1 = r * .92;
        x.strokeStyle = ink(big ? .75 : .45); x.lineWidth = (big ? .028 : .016) * s;
        x.beginPath(); x.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0); x.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1); x.stroke();
      }
    }
    if (k === 3 || k === 4) {
      // leeres Kalenderfeld: ruhige Notizlinien
      x.fillStyle = ink(.12);
      for (const d of [-.34, 0, .34]) x.fillRect(MX * s, (SVT + d) * s, (W - 2 * MX) * s, .01 * s);
    }
    if (k > 0) { x.strokeStyle = ink(.16); x.lineWidth = .012 * s; rr(x, (MX - .08) * s, (SVT - FH / 2) * s, (W - 2 * MX + .16) * s, FH * s, .05 * s); x.stroke(); }
    x.restore();
  };
  // Häkchen im Kreis (ruhig, Tinte)
  const stamp = (x, Wp, Hp) => {
    const s = Wp / (2 * clockR + .08), c = Wp / 2;
    x.strokeStyle = ink(.78); x.lineWidth = .034 * s; x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath(); x.arc(c, c, clockR * s, 0, 2 * Math.PI); x.stroke();
    x.lineWidth = .05 * s; x.beginPath(); x.moveTo(c - .12 * s, c + .01 * s); x.lineTo(c - .03 * s, c + .1 * s); x.lineTo(c + .14 * s, c - .1 * s); x.stroke();
  };
  // Stange auf einem Wandstück
  const rodDraw = bw => (x, Wp, Hp) => {
    x.fillStyle = "#a59f92"; x.fillRect(0, Hp * .25, Wp, Hp * .5);
    x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(0, Hp * .3, Wp, Hp * .12);
    x.fillStyle = ink(.35); x.fillRect(0, Hp * .72, Wp, Hp * .06);
  };

  // ---------- Bau ----------
  const prints = [], tags = [];
  const nodes = {};
  specs.forEach(sp => {
    const k = sp.k;
    const T = sp.w ? K.trage(sp.cF, sp.w, { R: RR }) : { D: 0, c0: sp.cF, bA: 0, bB: 0, node: p => p };
    if (Math.abs(T.D - sp.D) > 1e-6) console.warn("Betreuung: Mitfahrt weicht vom Vorab-Layout ab", k, T.D, sp.D);
    const tb = K.sicht(sp.L).in;                   // das Wandstück taucht am rechten Rand auf
    const tag = "kal" + k; tags.push(tag);
    F.part(tag, tb, bE(.9));
    const board = K.panel(R, [sp.L, ZW], [sp.L + sp.bw, ZW], [0, -1], tb + bE(.35), bE(1.1), UPA, { over: .04 });
    K.rect(board, 0, 0, sp.bw, WH, BOARD, .5);
    board.isBoard = true;
    // Zeiten: Blatt schwingt, fällt und hängt; vor der Mitfahrt (Handy) muss es hängen
    const hasPatch = k === 2, fd = bE(1.3), pd = bE(1.3);
    let fs = tb + bE(1.0);
    if (T.D > 0) fs = Math.min(fs, T.bA - bE(.2) - fd);
    fs = Math.max(fs, tb + bE(.6));
    const fe = fs + fd, ps = fe - bE(.3), tOn = fe + bE(.1);
    // Stange (Wandstück) mit Blende nach dem Aufstehen der Wand
    const rod = K.decal(Math.round(sp.bw * 120), 24, rodDraw(sp.bw), sp.bw, .12, tb + bE(1.3), .02);
    K.onPanel(board, rod, sp.bw / 2, ROD, 1);
    // Blatt
    const par = T.node(board), hu = T.c0 - W / 2 - sp.L;
    const sheet = K.panel(par, board.uv(hu, ROD), board.uv(hu + W, ROD), [0, 1], fs, fd, Q * .78, { ease: sheetEase, over: 0 });
    const col = k === 0 ? COVER : PAGE;
    if (k === 1) {
      // Blatt mit Loch: vier Flächen um die Lücke, Umriss und Abdruck als Geist
      const S = (pts, e) => F.poly(sheet, pts.map(q => sheet.uv(q[0], q[1])), col, e, 0, K.COL.INK, { nocut: 1 });
      S([[0, 0], [W, 0], [W, hv0], [hu1, hv0], [hu0, hv0], [0, hv0]], [0, .5, 0, .5, 0, .5]);
      S([[0, hv1], [hu0, hv1], [hu1, hv1], [W, hv1], [W, HS], [0, HS]], [0, .5, 0, .5, .5, .5]);
      S([[0, hv0], [hu0, hv0], [hu0, hv1], [0, hv1]], [0, .5, 0, .5]);
      S([[hu1, hv0], [W, hv0], [W, hv1], [hu1, hv1]], [0, .5, 0, .5]);
      F.poly(sheet, [[0, 0], [W, 0], [W, HS], [0, HS]].map(q => sheet.uv(q[0], q[1])), col, [0, .5, .5, .5], 0, K.COL.INK, { ghost: 1 });
    } else K.rect(sheet, 0, 0, W, HS, col, [0, .5, .5, .5]);
    K.onPanel(sheet, K.decal(Math.round(W * PX), Math.round((HS + RT) * PX), art(k), W, HS + RT, fs + bE(.4), .03), W / 2, (HS - RT) / 2, 1, [0, -1], .002);
    if (k === 1) {
      // Loch: unregelmäßige Ausrisskante (helle Papierfasern), dunkle Öffnung mit Schatten von oben und links
      const hw = hu1 - hu0, hh = hv1 - hv0, m = .09, cw = hw + 2 * m, ch = hh + 2 * m;
      const lo = K.decal(Math.round(cw * PX), Math.round(ch * PX), (x, Wp, Hp) => {
        const s = Wp / cw, X0 = m * s, Y0 = m * s, X1 = (m + hw) * s, Y1 = (m + hh) * s;
        let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
        const pts = [], step = .085 * s;
        const side = (ax, ay, bx, by, nx, ny) => { const L = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(L / step)); for (let i = 0; i < n; i++) { const t = i / n, o = (i % 2 ? .25 : 1) * rnd() * m * s * .95 + .01 * s; pts.push([ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o]); } };
        side(X0, Y0, X1, Y0, 0, -1); side(X1, Y0, X1, Y1, 1, 0); side(X1, Y1, X0, Y1, 0, 1); side(X0, Y1, X0, Y0, -1, 0);
        x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath();
        x.fillStyle = "#e9e2d1"; x.fill(); x.strokeStyle = ink(.4); x.lineWidth = .012 * s; x.lineJoin = "round"; x.stroke();
        x.fillStyle = ink(.62); x.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
        x.fillStyle = ink(.85); x.fillRect(X0, Y0, X1 - X0, .07 * s); x.fillRect(X0, Y0, .06 * s, Y1 - Y0);
        x.fillStyle = ink(.7); x.fillRect(X0, Y0 + .07 * s, X1 - X0, .05 * s);
      }, cw, ch, fs + bE(.4), .03);
      K.onPanel(sheet, lo, (hu0 + hu1) / 2, (hv0 + hv1) / 2, 1, [0, -1], .0035);
    }
    // Monatsname
    if (k > 0) {
      const mo = K.print([MONTH[k - 1]], EK, fe, { font: "kicker", col: "#47474b", text: MONTH[k - 1] });
      K.onPanel(sheet, mo, MX + mo.w / 2 - mo.t.padX * mo.e, .62, 1, [0, -1]);
    }
    // Text im Kalenderfeld (B0 auf dem Deckblatt)
    const P = k === 0 ? kp.h : sp.T, e = k === 0 ? kp.eH : K.EC;
    if (P) { P.on = tOn; K.onPanel(sheet, P, MX + P.w / 2 - P.t.padX * e, SVT, 1, [0, -1]); }
    // Häkchen auf den Blättern Mai, Juni, Juli
    if (k >= 3) {
      const c = K.decal(256, 256, stamp, 2 * clockR + .08, 2 * clockR + .08, (k === 5 ? tOn : fe) + bE(.1), .03);
      K.onPanel(sheet, c, clockU, clockV, 1, [0, -1], .003);
    }
    // Uhr mit laufenden Zeigern (Blatt März)
    if (k === 1) {
      const hands = new THREE.Group(); K.add(hands);
      F.attach(sheet, hands, sheet.uv(clockU, clockV), [0, -1], 1, .006);
      const hm = () => new THREE.MeshBasicMaterial({ color: "#303033", transparent: true, opacity: 0, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
      const hand = (w, l, tail, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l + tail).translate(0, (l - tail) / 2, z), hm()); m.renderOrder = 5; m.frustumCulled = false; hands.add(m); return m; };
      const hH = hand(.034, clockR * .5, .03, 0), hM = hand(.02, clockR * .78, .04, .0004);
      const cap = new THREE.Mesh(new THREE.CircleGeometry(.025, 20).translate(0, 0, .0008), hm()); cap.renderOrder = 5; cap.frustumCulled = false; hands.add(cap);
      const turn = bE(3.2);                       // eine Minutenumdrehung je 3,2 Einheiten Fahrt
      K.anim(b => {
        const o = sm((b - fe) / .03), m = (b - fe) / turn;
        for (const h of [hH, hM, cap]) { h.material.opacity = o; h.visible = o > .001; }
        hM.rotation.z = -m * 2 * Math.PI;
        hH.rotation.z = -(10 + m) / 12 * 2 * Math.PI;
      });
    }
    // Flicken (Blatt April): der Baustein klappt auf und rastet ein
    if (hasPatch) {
      const patch = K.panel(sheet, sheet.uv(hu0, hv0), sheet.uv(hu1, hv0), [0, 1], ps, pd, Q * .92, { ease: patchEase, over: 0 });
      K.rect(patch, 0, 0, hu1 - hu0, hv1 - hv0, FRESH, .5);
      const pw = hu1 - hu0, ph = hv1 - hv0;
      const pd2 = K.decal(Math.round(pw * PX), Math.round(ph * PX), (x, Wp, Hp) => {
        x.save(); x.scale(Wp / HOLE.w, Hp / HOLE.h); x.translate(-HOLE.x, -HOLE.y);
        x.beginPath(); x.rect(HOLE.x, HOLE.y, HOLE.w, HOLE.h); x.clip(); card(x, 680, { fresh: true }); x.restore();
      }, pw, ph, fs + bE(.4), .03);
      K.onPanel(patch, pd2, pw / 2, ph / 2, 1, [0, -1], .002);
    }
    nodes[k] = { board, sheet };
    prints.push(P);
  });

  // ---------- Konstruktionsphase: Bleistiftspur nur auf den Wandstücken, Gerüst selbsttätig ----------
  F.spur({ tags, quiet: [], filter: nd => !!nd.isBoard, a: .3 });

  // ---------- Faden: auf dem Bogen vor der Wand entlang, hinten hinaus ----------
  const mid = (xs + xe) / 2;
  const faden = [[xs, .004, FZ], [mid, .004, FZ], [xe + 4, .004, FZ]];
  return {
    strecke: [xs, xe], lineZ: LZ,
    faden,
    anchor: specs[0].cF,
    stops: [{ name: "b0", prints: [kp.h] }, { name: "b1", prints: [T1] }, { name: "b2", prints: [T2] }, { name: "b3", prints: [T3] }]
  };
}
