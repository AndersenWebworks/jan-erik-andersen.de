// Szene „Betreuung und Absicherung“ als Lesebahn (Fassung 2026-11, Bogen + Bastellinien). Drehbuch: DREHBUCH-LESEBAHN.md, Abschnitt 6.
// Trägerform: Abreißkalender (kalenderform.js). Auf dem roten Faden stehen drei Kalenderblätter, jedes mit einem ganzen Satz und klein dem Monatsnamen:
//   B1 „Zwischen dem Bekanntwerden einer Lücke … vergehen oft nur Stunden.“ (Kernaussage, größer)  -> Szenerie: Bildschirm mit der Lücke, Tischuhr
//   B2 „Ich halte Ihre Seite deshalb laufend aktuell.“                                              -> Szenerie: der Flicken legt sich über die Lücke
//   B3 „Bei betreuten Websites sehe ich monatlich nach, ob sie sauber läuft.“                       -> Szenerie: Aufstellkalender, Monatsblätter schlagen um
// Die Konstrukte (hier wie zuvor, nur ohne Text) stehen als Szenerie hinter der Bahn und zeigen im Moment der Lesestelle, was der Satz sagt:
// - Bildschirm im Stil der Eröffnung mit der Plugin-Liste. In einer Zeile wird eine Lücke bekannt (roter Rahmen, das Stück färbt sich rot),
//   dann kippt das Stück nach hinten heraus: im Papier ist ein Loch.
// - Tischuhr (Faltschachtel) links vom Bildschirm: solange die Lücke offen ist, laufen die Zeiger schnell (Stunden vergehen).
// - Flicken: steht nach dem Aufbau wie eine halb offene Tür an der rechten Bildschirmkante, schwenkt zu, legt sich über die Lücke
//   und rastet mit kleinem Rückprall ein.
// - Aufstellkalender (Zeltfaltung): Blätter mit Haken (je Blatt ein Monatsname, Erik sieht monatlich nach) schlagen Monat für Monat über den Rücken um.
// Rot nur an der Lücke. Keine Ziffern, keine Daten, keine Jahreszahlen (nur Monatsnamen auf den Blättern).
// Lage: Bahn und Überschrift stehen auf einer Linie vor der Szenerie; Uhr über Blatt 1, Bildschirm zwischen Blatt 1 und 2 (Handy: über Blatt 2), Kalender über Blatt 3.
import { kalender } from "./kalenderform.js";

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

  // ---------- Lage der Bahn: eine Linie vor der Szenerie (vorderste Kante: Kalender bei z 1,7), Überschrift links davon ----------
  const PITCH = K.PITCH, LEAN = PITCH * PI / 180, ZB = 3.6, XL1 = -3.4, eH = N ? .5 : .62;
  F.part("titel", 0, .01);
  const titleW = K.measure(["Betreuung und"], { font: "serif" }).tw * eH, titleX = XL1 - .7 - titleW;
  const H1 = K.word(["Betreuung und", "Absicherung"], eH, titleX, ZB, .15, .85,
    { font: "serif", foot: 1, imprint: { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2, close: .25, closeDur: .7 }, ang: Q - LEAN });
  const heads = [H1];
  // ---------- Drei Kalenderblätter, je ein ganzer Satz (Zeiten b: Schnittlinien, Aufklappen, Text; Lesestelle b) ----------
  // Die Lesestellen folgen der Szenerie: B1, wenn die Lücke offen ist und die Uhr läuft (Lücke ab .465); B2, wenn der Flicken eingerastet ist (.6 … .66);
  // B3, wenn die Monatsblätter umschlagen (.75 … .94)
  const SATZ1 = "Zwischen dem Bekanntwerden einer Lücke in einem WordPress-Plugin und dem ersten Angriff vergehen oft nur Stunden.";
  const SATZ2 = "Ich halte Ihre Seite deshalb laufend aktuell.";
  const SATZ3 = "Bei betreuten Websites sehe ich monatlich nach, ob sie sauber läuft.";
  const BA = K.bahn({
    prefix: "b", form: kalender(["Januar", "Februar", "März"]), x0: XL1, z: ZB, gap: .5, pitch: PITCH, sy: -.34, nsy: -.3,
    head: { prints: [H1], e0: eH, b: 0, fit: .72, fitN: .72, x: titleX, w: titleW },
    sentences: [
      { text: SATZ1, t: [.30, .34, .405], b: .48, big: 1.2, w: 4.2 },
      { text: SATZ2, t: [.52, .56, .625], b: .69 },
      { text: SATZ3, t: [.74, .78, .845], b: .90 }
    ]
  });
  const bc = BA.items.map(it => it.x0 + it.w / 2);
  // Szenerie über der Bahn: Mitte des Bildschirms zwischen Blatt 1 und 2 (Lücke rechts, Flicken am rechten Rand), Uhr über Blatt 1, Kalender über Blatt 3
  // Handy (Bild nur rund 5 Einheiten breit): der Bildschirm steht ganz über Blatt 2, wenn der Flicken die Lücke schließt; die Uhr über Blatt 1
  const MX = N ? bc[1] - .3 : (bc[0] + bc[1]) / 2 + .3;
  const ZSH = -12;
  K.sheet(titleX - 1.2, BA.endX + 4.2, ZSH, ZB + .46 + 1.3);


  // ---------- Bildschirm: Fuß, Hals, Bildschirm (wie in der Eröffnung), steht direkt auf dem Bogen ----------
  F.part("monitor", .03, .08);
  const FW = 1.6, ZFB = -1.6, NH = .8, NW = .34, CH = .58, SW = DX + .3, SL = CH + DY + .1;
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
  const TM = .11, tv0 = vOf(ROWS[GR] + RH) - TM, tv1 = vOf(ROWS[GR]) + TM, GW = SW / 2 - (HOLE.x0 - DX / 2 - .1);
  const tA = K.panel(scr, scr.uv(uR, tv0), scr.uv(uR, tv1), [1, 0], .31, .06, -Q, { own: R, lv: -2, over: .04 });
  const tab = K.panel(tA, scr.uv(uR, tv0), scr.uv(uR, tv1), [1, 0], B_PATCH, D_PATCH, -Q, { own: R, lv: -2, nofold: 1, bounce: .045 });
  K.rect(tab, 0, 0, tv1 - tv0, GW, FACE, [0, .5, .5, .5]);

  // ---------- Uhr: Faltschachtel rechts neben dem Bildschirm, Zeiger drehen sich ----------
  F.part("uhr", .07, .08);
  const CX0 = bc[0] - 1.8, CZ0 = .3, { W: TW, D: TD, H: TH } = CLK;
  const ck = K.box(R, CX0, CX0 + TW, CZ0, CZ0 - TD, TH, .24, .1, { col: CASE, fcol: FRONTC });
  K.onPanel(ck.fr, K.decal(Math.round(TW * 600), Math.round(TH * 600), clockFront, TW, TH, .31, .04), TW / 2, TH / 2, -1);
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

  // ---------- Kalender: Zelt aus dem Bogen, Blätter schlagen Monat für Monat über den Rücken um ----------
  F.part("kalender", .1, .08);
  const CW = 2.0, KX0 = bc[2] - CW / 2, KZ = 1.7, L = 2.0, AL = 68 * PI / 180, ko = { over: .03 };
  const cf = K.panel(R, [KX0, KZ], [KX0 + CW, KZ], [0, -1], .28, .07, AL, ko);
  K.rect(cf, 0, 0, CW, L, CALC, .5);
  const cb = K.panel(cf, cf.uv(0, L), cf.uv(CW, L), [0, -1], .28, .07, -2 * AL, ko);
  K.rect(cb, 0, 0, CW, L, CALC, .5);
  F.part("blaetter", .5, .01);
  const NP = 6, PU0 = .1, PWc = CW - .2, PL = 1.3, PA = PI + 2 * AL - .06, PF0 = .75, PFS = .035, PFD = .05;
  const MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"];
  const pageBase = k => (x, W, H) => {
    const s = W / PWc;
    x.fillStyle = ink(.8); x.fillRect(0, 0, W, .17 * s);
    x.fillStyle = "#ffffff"; for (const u of [.42, PWc - .42]) { x.beginPath(); x.arc(u * s, .085 * s, .035 * s, 0, 2 * Math.PI); x.fill(); }
    // Monatsname unter dem Haken (Abkürzung, keine Jahreszahl)
    x.fillStyle = ink(.7); x.font = `600 ${.25 * s}px "Schibsted Grotesk", sans-serif`; x.textAlign = "center"; x.textBaseline = "alphabetic";
    x.fillText(MON[k].toUpperCase(), PWc / 2 * s, 1.2 * s);
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
    // Monatsname erst, wenn das Blatt darüber wegklappt: die Drucke der tieferen Blätter (Abstand nur 0,003) schienen sonst durch das oberste Blatt (Geisterkontur „JAN“)
    const base = K.decal(Math.round(PWc * 500), Math.round(PL * 500), pageBase(k), PWc, PL, k === 0 ? .35 : PF0 + (k - 1) * PFS + .7 * PFD, k === 0 ? .03 : .015);
    const chk = K.decal(Math.round(PWc * 500), Math.round(PL * 500), pageCheck, PWc, PL, k === 0 ? .7 : PF0 + (k - 1) * PFS + .7 * PFD, .015);
    chk.mesh.renderOrder = 4;
    K.onPanel(pg, base, PWc / 2, PL / 2, 1, [0, -1], .001);
    K.onPanel(pg, chk, PWc / 2, PL / 2, 1, [0, -1], .0012);
    if (!last) base.off = chk.off = t0 + PFD;
    pages.push(pg);
  }

  // ---------- Konstruktionsphase wie in der Eröffnung: Raster auf dem Bogen, Gerüst der festen Teile im Raum ----------
  F.geruest({ tags: ["monitor", "uhr", "kalender"], t0: .1, t1: .24, du: .03, a: .5 });
  // Bleistiftspur (seite/): auf Flächen mit Druck nur Eckmarken; der Bildschirm ohne Spur (er besteht aus vier Stücken um die Lücke,
  // deren Eckmarken lägen mitten in der Plugin-Liste)
  F.spur({ tags: ["monitor", "uhr", "kalender"], quiet: [ck.fr, cf], filter: nd => nd !== scr, a: .3 });

  // ---------- Kamera und Faden: die Bahn (Überschrift, drei Blätter, Auslauf nach rechts); Gier 0, gleiche Neigung ----------
  const BEND = .98, SHX0 = titleX - 1.2, SHX1 = BA.endX + 4.2, SHZ1 = ZB + .46 + 1.3;
  return {
    fov: 32, fovN: 44, smooth: true,
    track: 400,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .4 },
    stops: BA.stops, names: BA.names,
    dbg: { heads, scr, flap, tA, tab, ck, cf, cb, pages, hands, minutes, bahn: BA },
    keys: BA.keys({ b: BEND, shift: 1.8, w: .6 }),
    thread: BA.thread({ hold: .04, depart: .10, bEnd: BEND, startX: titleX - .1 }),
    // Ein- und Ausgang des Fadens für folge.js: Vorderkante des Bogens links, Hinterkante rechts hinter dem Ende der Bahn
    fadenIO: BA.faden({ inn: [SHX0 + .4, SHZ1 - .2], out: [BA.endX + 3.0, -3.4] })
  };
}
