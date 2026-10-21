// Szene „Betreuung und Absicherung“ (Fassung 2026-11, Bogen + Bastellinien). Drehbuch: DREHBUCH.md in diesem Ordner.
// Drei Gegenstände klappen aus dem Bogen, jeder trägt seinen Satzteil (Text wörtlich aus Raumtext 2, #leistungen):
// - Bildschirm im Stil der Eröffnung mit der Plugin-Liste der WordPress-Verwaltung. In einer Zeile wird eine Lücke bekannt
//   (roter Rahmen, das Stück färbt sich rot), dann kippt das Stück nach hinten heraus: im Papier ist ein Loch.
//   T1 „Zwischen dem Bekanntwerden einer Lücke in einem WordPress-Plugin“ im Kinn.
// - Tischuhr (Faltschachtel) rechts daneben: solange die Lücke offen ist, laufen die Zeiger schnell (Stunden vergehen).
//   T2 „und dem ersten Angriff vergehen oft nur Stunden.“ unter dem Zifferblatt.
// - Flicken: steht nach dem Aufbau wie eine halb offene Tür an der rechten Bildschirmkante, schwenkt zu, legt sich über die Lücke
//   und rastet mit kleinem Rückprall ein. T3 „Ich halte Ihre Seite deshalb laufend aktuell“ steht auf ihm.
// - Aufstellkalender (Zeltfaltung): Blätter mit Haken schlagen eins nach dem anderen über den Rücken um.
//   T4 „und sehe regelmäßig nach, ob sie sauber läuft.“ auf dem Fuß der Vorderseite.
// Rot nur an der Lücke. Keine Ziffern, keine Daten (der Text nennt weder Uhrzeit noch Rhythmus).

const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Bildschirminhalt: Plugin-Liste, in Welteinheiten der Bildschirmfläche (DX × DY, Ursprung oben links, Y nach unten) ----------
const DX = 3.6, DY = 2.25, RH = .34, ROWS = [.5, .84, 1.18, 1.52, 1.86], GR = 1;
// Lücke: rechter Teil der zweiten Zeile (Beschreibung und Version), etwas eingerückt
const HOLE = { x0: 1.56, x1: 3.42, y0: ROWS[GR] + .045, y1: ROWS[GR] + RH - .045 };
function drawList(x, s) {
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, DX * s, DY * s);
  const bar = (X, Y, w, h, a) => { x.fillStyle = ink(a); rr(x, X * s, Y * s, w * s, h * s, h * s / 2); x.fill(); };
  // Werkzeugleiste oben, Seitenleiste links (dunkel, Menüpunkte hell, „Plugins“ hervorgehoben)
  x.fillStyle = ink(.9); x.fillRect(0, 0, DX * s, .09 * s);
  x.fillStyle = ink(.8); x.fillRect(0, .09 * s, .6 * s, (DY - .09) * s);
  for (let i = 0; i < 11; i++) {
    const Y = .2 + i * .17;
    if (i === 5) { x.fillStyle = "rgba(255,255,255,.18)"; x.fillRect(0, (Y - .05) * s, .6 * s, .14 * s); }
    x.fillStyle = `rgba(255,255,255,${i === 5 ? .9 : .38})`; rr(x, .1 * s, Y * s, (i % 3 ? .3 : .38) * s, .04 * s, .02 * s); x.fill();
  }
  // Seitentitel und Knopf
  bar(.72, .19, .5, .07, .82);
  x.strokeStyle = ink(.5); x.lineWidth = .012 * s; rr(x, 1.32 * s, .175 * s, .46 * s, .1 * s, .02 * s); x.stroke();
  bar(1.4, .21, .3, .03, .45);
  // Tabellenkopf
  x.fillStyle = ink(.14); x.fillRect(.66 * s, .46 * s, (DX - .7) * s, .006 * s);
  bar(.84, .405, .3, .03, .32); bar(1.62, .405, .45, .03, .32);
  ROWS.forEach((Y, i) => {
    x.strokeStyle = ink(.5); x.lineWidth = .01 * s; x.strokeRect(.71 * s, (Y + .085) * s, .06 * s, .06 * s);
    bar(.84, Y + .085, [.56, .48, .6, .44, .52][i], .055, .78);
    bar(.84, Y + .2, .16, .03, .3); bar(1.04, Y + .2, .2, .03, .3);
    bar(1.62, Y + .09, [1.6, 1.4, 1.66, 1.5, 1.58][i], .032, .36);
    bar(1.62, Y + .155, [1.2, 1.5, 1.0, 1.3, 1.1][i], .032, .36);
    bar(1.62, Y + .235, .62, .026, .22);
    x.fillStyle = ink(.1); x.fillRect(.66 * s, (Y + RH) * s, (DX - .7) * s, .005 * s);
  });
}

// ---------- Uhr: Front als Druck (Rahmen, Zifferblatt mit zwölf Strichen, keine Ziffern) ----------
const CLK = { W: 1.6, D: .7, H: 1.9, cv: 1.24, r: .52 };
function clockFront(x, W, H) {
  const s = W / CLK.W, cx = W / 2, cy = (CLK.H - CLK.cv) * s, r = CLK.r * s;
  x.strokeStyle = ink(.3); x.lineWidth = .014 * s; rr(x, .05 * s, .05 * s, W - .1 * s, H - .1 * s, .04 * s); x.stroke();
  x.fillStyle = "#ffffff"; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  x.strokeStyle = ink(.6); x.lineWidth = .02 * s; x.stroke();
  x.lineCap = "round";
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, big = i % 3 === 0, r0 = (big ? .36 : .41) * s, r1 = .46 * s;
    x.strokeStyle = ink(big ? .78 : .5); x.lineWidth = (big ? .03 : .016) * s;
    x.beginPath(); x.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0); x.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1); x.stroke();
  }
  // Sockel
  x.fillStyle = ink(.1); x.fillRect(.05 * s, H - .1 * s, W - .1 * s, .045 * s);
}

export default function (K) {
  const { F, R, V, COL, Q, PI, sm, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const FACE = c3("#f8f6f1"), METAL = c3("#dcd7cd"), CASE = c3("#ece9e2"), FRONTC = c3("#e7e3da"), CALC = c3("#e9e3d6"), PAGE = c3("#fbfaf7");

  K.sheet(-5.6, 9.2, -3.6, N ? 4.6 : 4.0);

  // ---------- Überschrift: Lettern stehen beim Scrollen aus dem Bogen auf (Desktop eine Zeile, Handy zwei) ----------
  F.part("titel", 0, .01);
  const MX = -1.8, he = N ? .5 : .42, ho = { font: "marke", clock: "b", foot: 1, imprint: { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2 } };
  const HL = N ? [["Betreuung und"], ["Absicherung"]] : [["Betreuung und Absicherung"]];
  const heads = HL.map((l, i) => {
    const w = K.measure(l, { font: "marke" }).tw * he;
    return K.word(l, he, MX - w / 2, 3.4 + i * .62, .005 + i * .015, .05, ho);
  });

  // ---------- Bildschirm: Fuß, Hals, Bildschirm (wie in der Eröffnung), steht direkt auf dem Bogen ----------
  F.part("monitor", .03, .08);
  // am Handy höheres Kinn für den größeren dreizeiligen Druck (größerer Druck = Kamera weiter weg = Bildschirm ganz im Bild)
  const FW = 1.6, ZFB = -1.6, NH = .8, NW = .34, CH = N ? .9 : .58, SW = DX + .3, SL = CH + DY + .1;
  const foot = K.slab(R, MX - FW / 2, MX + FW / 2, ZFB + NH, ZFB, .04, .2, .04, { col: METAL, top: METAL, walls: "lrb" });
  const neck = K.panel(foot, [MX - NW / 2, ZFB], [MX + NW / 2, ZFB], [0, 1], .22, .08, Q, { over: .04 });
  K.P(neck, [[0, 0], [NW, 0], [NW, NH], [0, NH]], METAL, [.5, .5, 0, .5]);
  const scr = K.panel(neck, neck.uv(0, NH), neck.uv(NW, NH), [0, 1], .3, .04, .1, { own: R, over: .3 });
  const U = x => x + NW / 2, uL = U(-SW / 2), uR = U(SW / 2);
  // Lücke im Blatt (u, v auf dem Bildschirm; v von der Unterkante des Kinns nach oben)
  const vOf = Y => CH + DY - Y;
  const hu0 = U(HOLE.x0 - DX / 2), hu1 = U(HOLE.x1 - DX / 2), hv0 = vOf(HOLE.y1), hv1 = vOf(HOLE.y0);
  // Blatt aus vier Flächen um das Loch (ohne eigene Schnittlinien), Umriss und Abdruck als Geist
  const PS = (pts, e) => F.poly(scr, pts.map(q => scr.uv(q[0], q[1])), FACE, e, 0, COL.INK, { nocut: 1 });
  PS([[uL, 0], [0, 0], [NW, 0], [uR, 0], [uR, hv0], [hu1, hv0], [hu0, hv0], [uL, hv0]], [.5, 0, .5, .5, 0, .5, 0, .5]);
  PS([[uL, hv1], [hu0, hv1], [hu1, hv1], [uR, hv1], [uR, SL], [uL, SL]], [0, .5, 0, .5, .5, .5]);
  PS([[uL, hv0], [hu0, hv0], [hu0, hv1], [uL, hv1]], [0, .5, 0, .5]);
  PS([[hu1, hv0], [uR, hv0], [uR, hv1], [hu1, hv1]], [0, .5, 0, .5]);
  F.poly(scr, [[uL, 0], [0, 0], [NW, 0], [uR, 0], [uR, SL], [uL, SL]].map(q => scr.uv(q[0], q[1])), FACE, [.5, 0, .5, .5, .5, .5], 0, COL.INK, { ghost: 1 });
  // Bildschirmseite (nach dem Aufstehen vorn): Rahmen und Plugin-Liste, im Loch durchsichtig
  const PXU = 420, bz = .055;
  const screenDraw = (x, W, H) => {
    const ox = (SW - DX) / 2 * PXU, oy = (SL - CH - DY) * PXU;
    x.fillStyle = ink(.84); rr(x, ox - bz * PXU, oy - bz * PXU, (DX + 2 * bz) * PXU, (DY + 2 * bz) * PXU, bz * PXU * .5); x.fill();
    x.save(); x.translate(ox, oy); x.beginPath(); x.rect(0, 0, DX * PXU, DY * PXU); x.clip(); drawList(x, PXU); x.restore();
    x.clearRect(ox + HOLE.x0 * PXU, oy + HOLE.y0 * PXU, (HOLE.x1 - HOLE.x0) * PXU, (HOLE.y1 - HOLE.y0) * PXU);
  };
  K.onPanel(scr, K.decal(Math.round(SW * PXU), Math.round(SL * PXU), screenDraw, SW, SL, .29, .04), U(0), SL / 2, -1);
  // am Handy dreizeilig: die erste Zeile wäre bei 16 px rund 330 von 390 px breit
  const T1 = K.print(N ? ["Zwischen dem Bekanntwerden", "einer Lücke in einem", "WordPress-Plugin"] : ["Zwischen dem Bekanntwerden einer Lücke", "in einem WordPress-Plugin"], N ? .21 : .12, .38, { align: "center", lh: 1.18 });
  K.onPanel(scr, T1, U(0), (CH - bz) / 2 - .01, -1);

  // ---------- Lücke: das Stück der Zeile färbt sich rot, ein roter Rahmen legt sich herum, dann kippt es nach hinten ----------
  F.part("luecke", .5, .01);
  const B_KNOWN = .44, B_OPEN = .465, B_PATCH = .6, D_PATCH = .06;
  const hw = hu1 - hu0, hh = hv1 - hv0;
  const flap = K.panel(scr, scr.uv(hu0, hv0), scr.uv(hu1, hv0), [0, 1], B_OPEN, .055, 1.1, { nocut: 1, nofold: 1, over: .05 });
  K.rect(flap, 0, 0, hw, hh, FACE, .5);
  K.onPanel(flap, K.decal(Math.round(hw * PXU), Math.round(hh * PXU), (x) => { x.translate(-HOLE.x0 * PXU, -HOLE.y0 * PXU); drawList(x, PXU); }, hw, hh, .29, .04), hw / 2, hh / 2, -1);
  K.onPanel(flap, K.decal(64, 16, (x, W, H) => { x.fillStyle = RED; x.fillRect(0, 0, W, H); }, hw, hh, B_KNOWN + .005, .02), hw / 2, hh / 2, -1, null, .003);
  const rm = .05, rim = K.decal(Math.round((hw + 2 * rm) * PXU), Math.round((hh + 2 * rm) * PXU), (x, W, H) => {
    const lw = .03 * PXU; x.strokeStyle = RED; x.lineWidth = lw; x.strokeRect(lw / 2 + .012 * PXU, lw / 2 + .012 * PXU, W - lw - .024 * PXU, H - lw - .024 * PXU);
  }, hw + 2 * rm, hh + 2 * rm, B_KNOWN, .02);
  rim.off = B_PATCH + D_PATCH - .01; rim.mesh.renderOrder = 4;
  K.onPanel(scr, rim, (hu0 + hu1) / 2, (hv0 + hv1) / 2, -1, null, .004);

  // ---------- Flicken: Tür an der rechten Bildschirmkante, schwenkt zu und legt sich über die Lücke ----------
  // Zwei Knoten am selben Scharnier: A öffnet die Tür beim Aufbau (−90°, zeigt nach vorn), B schließt sie auf die Lücke (weitere −90°).
  // Ebene −2: nach beiden Drehungen liegt der Flicken 0,0075 vor dem Bildschirm (Ebene des Endzustands = Höhe des Scharniers A).
  F.part("flicken", .05, .05);
  // höherer Flicken für den dreizeiligen, größeren Druck (größerer Druck = Kamera weiter weg = Bildschirm ganz im Bild)
  const TM = N ? .145 : .11, tv0 = vOf(ROWS[GR] + RH) - TM, tv1 = vOf(ROWS[GR]) + TM, GW = SW / 2 - (HOLE.x0 - DX / 2 - .1);
  const tA = K.panel(scr, scr.uv(uR, tv0), scr.uv(uR, tv1), [1, 0], .31, .06, -Q, { own: R, lv: -2, over: .04 });
  const tab = K.panel(tA, scr.uv(uR, tv0), scr.uv(uR, tv1), [1, 0], B_PATCH, D_PATCH, -Q, { own: R, lv: -2, nofold: 1, bounce: .045 });
  K.rect(tab, 0, 0, tv1 - tv0, GW, FACE, [0, .5, .5, .5]);
  const T3 = K.print(["Ich halte Ihre Seite", "deshalb laufend", "aktuell"], N ? .16 : .14, .58, { align: "center", lh: 1.18 });
  // Mitte des Drucks über der Mitte der Lücke (Abstand von der rechten Bildschirmkante)
  K.onPanel(tab, T3, (tv1 - tv0) / 2, SW / 2 - ((HOLE.x0 + HOLE.x1) / 2 - DX / 2), 1, [0, 1]);

  // ---------- Uhr: Faltschachtel rechts neben dem Bildschirm, Zeiger drehen sich ----------
  F.part("uhr", .07, .08);
  const CX0 = 2.6, CZ0 = .3, { W: TW, D: TD, H: TH } = CLK;
  const ck = K.box(R, CX0, CX0 + TW, CZ0, CZ0 - TD, TH, .24, .1, { col: CASE, fcol: FRONTC });
  K.onPanel(ck.fr, K.decal(Math.round(TW * 600), Math.round(TH * 600), clockFront, TW, TH, .31, .04), TW / 2, TH / 2, -1);
  // dreizeilig und größer: an der Lesestelle steht die Kamera dadurch weiter weg, Bildschirm mit Lücke und Uhr passen zusammen ins Bild
  const T2 = K.print(["und dem ersten", "Angriff vergehen", "oft nur Stunden."], .15, .44, { align: "center", lh: 1.18 });
  K.onPanel(ck.fr, T2, TW / 2, .4, -1);
  // Zeiger: eigene Gruppe auf der Front (oben = Oberkante), drehen sich um die Mitte des Zifferblatts
  const hands = new THREE.Group(); K.add(hands);
  F.attach(ck.fr, hands, ck.fr.uv(TW / 2, CLK.cv), [0, 1], -1, .006);
  const hm = () => new THREE.MeshBasicMaterial({ color: "#303033", transparent: true, opacity: 0, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const hand = (w, l, tail, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l + tail).translate(0, (l - tail) / 2, z), hm()); m.renderOrder = 5; hands.add(m); return m; };
  const hH = hand(.05, .27, .06, 0), hMin = hand(.03, .42, .07, .0005);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(.04, 24).translate(0, 0, .001), hm()); cap.renderOrder = 5; hands.add(cap);
  // Zeit: ruhiger Grundlauf, dazu drei Runden des Minutenzeigers, solange die Lücke offen ist (Anlauf und Auslauf weich)
  const G0 = .47, G1 = .64, TURNS = 3;
  const sm5 = v => v <= 0 ? 0 : v >= 1 ? 1 : v * v * v * (v * (v * 6 - 15) + 10);
  const minutes = b => .35 * b + TURNS * sm5((b - G0) / (G1 - G0));
  K.anim(b => {
    const o = sm((b - .33) / .03), m = minutes(b);
    for (const h of [hH, hMin, cap]) { h.material.opacity = o; h.visible = o > .001; }
    hMin.rotation.z = -m * 2 * PI;
    hH.rotation.z = -(10 + m) / 12 * 2 * PI; // Beginn 10 Uhr
  });

  // ---------- Kalender: Zelt aus dem Bogen, Blätter schlagen über den Rücken um ----------
  F.part("kalender", .1, .08);
  const KX0 = 6.4, CW = 2.0, KZ = 1.7, L = 2.0, AL = 68 * PI / 180, ko = { over: .03 };
  const cf = K.panel(R, [KX0, KZ], [KX0 + CW, KZ], [0, -1], .28, .07, AL, ko);
  K.rect(cf, 0, 0, CW, L, CALC, .5);
  const cb = K.panel(cf, cf.uv(0, L), cf.uv(CW, L), [0, -1], .28, .07, -2 * AL, ko);
  K.rect(cb, 0, 0, CW, L, CALC, .5);
  // größerer Druck: Kamera weiter weg, die umschlagenden Blätter bleiben im Bild
  const T4 = K.print(["und sehe regelmäßig nach,", "ob sie sauber läuft."], .13, .7, { align: "center", lh: 1.18 });
  K.onPanel(cf, T4, CW / 2, .34, 1, [0, -1]);
  F.part("blaetter", .5, .01);
  const NP = 6, PU0 = .1, PWc = CW - .2, PL = 1.3, PA = PI + 2 * AL - .06, PF0 = .75, PFS = .035, PFD = .05;
  const pageBase = (x, W, H) => {
    const s = W / PWc;
    x.fillStyle = ink(.8); x.fillRect(0, 0, W, .17 * s);
    x.fillStyle = "#ffffff"; for (const u of [.42, PWc - .42]) { x.beginPath(); x.arc(u * s, .085 * s, .035 * s, 0, 2 * Math.PI); x.fill(); }
    x.fillStyle = ink(.12); for (let i = 0; i < 3; i++) x.fillRect(.2 * s, (1.04 + i * .07) * s, (i === 2 ? .8 : PWc - .4) * s, .012 * s);
  };
  const pageCheck = (x, W, H) => {
    const s = W / PWc; x.strokeStyle = ink(.86); x.lineWidth = .075 * s; x.lineCap = "round"; x.lineJoin = "round";
    const c = PWc / 2; x.beginPath(); x.moveTo((c - .36) * s, .62 * s); x.lineTo((c - .1) * s, .86 * s); x.lineTo((c + .36) * s, .34 * s); x.stroke();
  };
  const pages = [];
  for (let k = 0; k < NP; k++) {
    const last = k === NP - 1, t0 = last ? 9 : PF0 + k * PFS;
    const pg = K.panel(cf, cf.uv(PU0, L), cf.uv(PU0 + PWc, L), [0, 1], t0, PFD, PA, { nocut: 1, nofold: 1, lv: cf.lvl + 2 * (NP - k), bounce: .03 });
    K.rect(pg, 0, 0, PWc, PL, PAGE, .5);
    const base = K.decal(Math.round(PWc * 500), Math.round(PL * 500), pageBase, PWc, PL, .35, .03);
    const chk = K.decal(Math.round(PWc * 500), Math.round(PL * 500), pageCheck, PWc, PL, k === 0 ? .7 : PF0 + (k - 1) * PFS + .7 * PFD, .015);
    chk.mesh.renderOrder = 4;
    K.onPanel(pg, base, PWc / 2, PL / 2, 1, [0, -1], .001);
    K.onPanel(pg, chk, PWc / 2, PL / 2, 1, [0, -1], .0012);
    if (!last) base.off = chk.off = t0 + PFD;
    pages.push(pg);
  }

  // ---------- Konstruktionsphase wie in der Eröffnung: Raster auf dem Bogen, Gerüst der festen Teile im Raum ----------
  F.geruest({ tags: ["monitor", "uhr", "kalender"], t0: .1, t1: .24, du: .03, a: .5 });

  // ---------- Lesestellen ----------
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const S = {
    // Bildlagen gerechnet (_pruefung/suche3.mjs): Textträger an jeder Lesestelle ganz im Bild (x 0…W, y 64…H−70) oder ganz draußen,
    // gemeinsam für 1280×900, 1920×1080, 1366×768, 1440×900, 1536×864, 1280×720 bzw. 390×844, 360×780, 414×896; Kamera-x steigt von T1 bis T4.
    // Sicherheitsabstand 20 px im Bild bzw. 100 px draußen (Handy 5–10 / 30–60), damit es auch kurz vor und nach der Lesestelle gilt
    t1: { prints: [T1], px: pxD, pitch: 6, yaw: 4, sy: -.45, sx: .2, b: .47, npitch: 10, nyaw: 10, nsy: -.2, nsx: 0 },
    // Uhr-Lesestelle: Bildschirm mit offener Lücke, Flicken und Uhr zusammen im Bild (Text rechts), am Handy nur die Uhr
    t2: { prints: [T2], px: pxD, pitch: 8, yaw: -2, sy: -.4, sx: .7, b: .56, npitch: 8, nyaw: -6, nsy: -.2, nsx: 0 },
    t3: { prints: [T3], px: pxD, pitch: 6, yaw: 18, sy: 0, sx: .45, b: .7, npitch: 12, nyaw: 42, nsy: -.15, nsx: .25 },
    // Kalender: Abstand mit Luft nach oben für die umschlagenden Blätter, Uhr ganz draußen
    t4: { prints: [T4], px: pxD, pitch: 16, yaw: -12, sy: -.45, sx: -.65, b: .86, npitch: 16, nyaw: -4, nsy: -.2, nsx: 0 }
  };
  return {
    fov: 32, fovN: 44,
    track: 540,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .4 },
    stops: Object.values(S),
    dbg: { heads, scr, flap, tA, tab, ck, cf, cb, pages, hands, T1, T2, T3, T4, minutes },
    keys: [
      // Start: nah auf die liegende Überschrift (Blickhöhe 32°, Handy 34°, Breite rund zwei Drittel bzw. 85 % des Bildes); sie steht beim ersten Scrollen auf
      { w: 0, b: 0, cam: V(-1.8, 5.13, 11.06), tgt: V(-1.8, .1, 3.0), camN: V(-1.8, 5.97, 12.1), tgtN: V(-1.8, .1, 3.4) },
      // Bastellinien fertig: Überblick über den ganzen Bogen (36°); Handy über Bildschirm, Flicken und Uhr (40°)
      { w: .7, b: .2, cam: V(1.75, 11.73, 15.25), tgt: V(1.75, .8, .2), camN: V(-.9, 11.73, 13.52), tgtN: V(-.9, .8, .5) },
      // alles steht: Blickhöhe sinkt auf 21°, Handy 22° und näher an den Bildschirm
      { w: 1, b: .38, cam: V(1.75, 8.21, 17.74), tgt: V(1.75, 1.4, 0), camN: V(-1.3, 7.41, 13.77), tgtN: V(-1.3, 1.6, -.6) },
      { w: 1, stop: S.t1 },
      { w: 1, stop: S.t2 },
      { w: 1, stop: S.t3 },
      { w: 1.1, stop: S.t4 },
      // Ende: Überblick über alle drei Gegenstände (rund 22°)
      { w: 1, b: 1, cam: V(1.9, 8.6, 17.6), tgt: V(1.9, 1.4, 0), camN: V(4.5, 6.89, 13.09), tgtN: V(4.5, 1.2, .3) }
    ]
  };
}
