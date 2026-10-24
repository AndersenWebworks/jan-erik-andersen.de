// Szene „Betreuung und Absicherung“ (Fassung 2026-11, Bogen + Bastellinien). Drehbuch: DREHBUCH.md in diesem Ordner.
// Drei Gegenstände klappen aus dem Bogen; die zwei Sätze (Text wörtlich aus Raumtext 2, #leistungen) stehen ganz auf Uhr und Kalender
// (Entscheidung „Uhr und Kalender“, vorher vier Satzteile auf vier Bauteilen):
// - Bildschirm im Stil der Eröffnung mit der Plugin-Liste der WordPress-Verwaltung (geschlossene Fläche). An einer Zeile springt ein
//   rotes Schild „Update verfügbar“ auf, ein Fortschrittsbalken läuft durch die Zeile, am Ende wird das Schild zum roten Haken.
// - Tischuhr (Faltschachtel) rechts daneben: solange das Update ansteht, laufen die Zeiger schnell (Stunden vergehen).
//   Satz 1 „Zwischen dem Bekanntwerden einer Lücke in einem WordPress-Plugin und dem ersten Angriff vergehen oft nur Stunden.“
//   in fünf Zeilen unter dem Zifferblatt (Lesestelle 1; Desktop mit dem Bildschirm im Bild, Handy nur die Uhr).
// - Aufstellkalender (Zeltfaltung): Blätter mit Haken (je Blatt ein Monatsname, Erik sieht monatlich nach) schlagen Monat für Monat über den Rücken um.
//   Satz 2 „Ich halte Ihre Seite deshalb laufend aktuell und sehe regelmäßig nach, ob sie sauber läuft.“ in vier Zeilen auf dem Fuß der
//   Vorderseite, unterhalb der umschlagenden Blätter (Lesestelle 2, nachdem das Update durch ist).
// Lesestellen: genau zwei, Uhr, dann Kalender.
// Rot am Update-Schild und sparsam bei den Sonntagen im Kalenderraster. Keine Jahreszahl (Kalenderblätter: Monatsname-Abkürzung, Raster der Tage 2026).
// Kopie von entwurf-2026-11/betreuung/betreuung.js für die durchgehende Seite (entwurf-2026-11/seite/). Ergänzt: Bleistiftspur
// (Raster und Gerüst hatte die Szene schon).

const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Bildschirminhalt: Plugin-Liste, in Welteinheiten der Bildschirmfläche (DX × DY, Ursprung oben links, Y nach unten) ----------
const DX = 3.6, DY = 2.25, RH = .34, ROWS = [.5, .84, 1.18, 1.52, 1.86], GR = 1;
// Update-Feld: rechter Teil der zweiten Zeile (Beschreibung und Version), etwas eingerückt
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
const CLK = { W: 2.1, D: .7, H: 2.3, cv: 1.64, r: .52 };
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
  const FACE = c3("#f3f6fb"), METAL = c3("#d4d7dc"), CASE = c3("#e6e9ee"), FRONTC = c3("#e0e3e8"), CALC = c3("#e0e3e8"), PAGE = c3("#f6f8fe");

  K.sheet(-5.6, 9.2, -3.6, N ? 4.6 : 4.0);

  // ---------- Überschrift: Lettern stehen beim Scrollen aus dem Bogen auf (Desktop eine Zeile, Handy zwei) ----------
  F.part("titel", 0, .01);
  const MX = -1.8, he = N ? .5 : .42, ho = { font: "marke", clock: "b", foot: 1, imprint: { fill: "#edeff5", col: "#c9cbd1", line: 2.2, closeB: .01 } };
  const HL = N ? [["Betreuung und"], ["Absicherung"]] : [["Betreuung und Absicherung"]];
  const heads = HL.map((l, i) => {
    const w = K.measure(l, { font: "marke" }).tw * he;
    return K.word(l, he, MX - w / 2, 3.4 + i * .62, .005 + i * .015, .05, ho);
  });

  // ---------- Bildschirm: Fuß, Hals, Bildschirm (wie in der Eröffnung), steht direkt auf dem Bogen ----------
  F.part("monitor", .03, .08);
  const FW = 1.6, ZFB = -1.6, NH = .8, NW = .34, CH = .58, SW = DX + .3, SL = CH + DY + .1;
  const foot = K.slab(R, MX - FW / 2, MX + FW / 2, ZFB + NH, ZFB, .04, .2, .04, { col: METAL, top: METAL, walls: "lrb" });
  const neck = K.panel(foot, [MX - NW / 2, ZFB], [MX + NW / 2, ZFB], [0, 1], .22, .08, Q, { over: .04 });
  K.P(neck, [[0, 0], [NW, 0], [NW, NH], [0, NH]], METAL, [.5, .5, 0, .5]);
  const scr = K.panel(neck, neck.uv(0, NH), neck.uv(NW, NH), [0, 1], .3, .04, .1, { own: R, over: .3 });
  const U = x => x + NW / 2, uL = U(-SW / 2), uR = U(SW / 2);
  // Update-Feld auf dem Bildschirm (u, v auf dem Bildschirm; v von der Unterkante des Kinns nach oben)
  const vOf = Y => CH + DY - Y;
  const hu0 = U(HOLE.x0 - DX / 2), hu1 = U(HOLE.x1 - DX / 2), hv0 = vOf(HOLE.y1), hv1 = vOf(HOLE.y0);
  // Blatt: eine geschlossene Fläche
  F.poly(scr, [[uL, 0], [0, 0], [NW, 0], [uR, 0], [uR, SL], [uL, SL]].map(q => scr.uv(q[0], q[1])), FACE, [.5, 0, .5, .5, .5, .5], 0, COL.INK, { nocut: 1 });
  // Bildschirmseite (nach dem Aufstehen vorn): Rahmen und Plugin-Liste
  const PXU = 420, bz = .055;
  const screenDraw = (x, W, H) => {
    const ox = (SW - DX) / 2 * PXU, oy = (SL - CH - DY) * PXU;
    x.fillStyle = ink(.84); rr(x, ox - bz * PXU, oy - bz * PXU, (DX + 2 * bz) * PXU, (DY + 2 * bz) * PXU, bz * PXU * .5); x.fill();
    x.save(); x.translate(ox, oy); x.beginPath(); x.rect(0, 0, DX * PXU, DY * PXU); x.clip(); drawList(x, PXU); x.restore();
  };
  K.onPanel(scr, K.decal(Math.round(SW * PXU), Math.round(SL * PXU), screenDraw, SW, SL, .29, .04), U(0), SL / 2, -1);

  // ---------- Update: rotes Schild „Update verfügbar“ springt an der Zeile auf, Balken läuft durch die Zeile, das Schild wird zum Haken ----------
  // Ein Decal über dem Feld der Zeile, in Abhängigkeit von b neu gezeichnet (Zustand st; Neuzeichnen nur bei geänderter Stufe)
  const B_KNOWN = .42, B_BAR = .46, B_DONE = .52;
  const hw = hu1 - hu0, hh = hv1 - hv0, OW = Math.round(hw * PXU), OH = Math.round(hh * PXU);
  const st = { p: 0, g: 0, m: 0 }, fam = '"Schibsted Grotesk", sans-serif';
  const back = v => { const c1 = 1.70158, c3 = c1 + 1, t = v - 1; return 1 + c3 * t * t * t + c1 * t * t; };
  const ovDraw = (x, W, H) => {
    const s = W / hw, { p, g, m } = st, mid = k => k < 0 ? 0 : k > 1 ? 1 : k;
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
    if (p <= 0) return;
    // Schild: rote Pille, springt auf (kleiner Überschwung), zum Schluss Kreis mit weißem Haken
    const ph = .15 + .02 * m, pw = 1.02 + (.17 - 1.02) * m, cx = .06 + pw / 2, cy = .09, sc = Math.max(.01, back(mid(p)));
    x.save(); x.translate(cx * s, cy * s); x.scale(sc, sc);
    x.fillStyle = RED; rr(x, -pw / 2 * s, -ph / 2 * s, pw * s, ph * s, ph / 2 * s); x.fill();
    const ta = 1 - mid(m * 2.2);
    if (ta > .01) {
      x.globalAlpha = ta; x.fillStyle = "#ffffff"; x.font = `700 ${.082 * s}px ${fam}`; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("Update verfügbar", 0, .004 * s); x.globalAlpha = 1;
    }
    const ca = mid((m - .45) / .55);
    if (ca > .01) {
      x.globalAlpha = ca; x.strokeStyle = "#ffffff"; x.lineWidth = .028 * s; x.lineCap = "round"; x.lineJoin = "round";
      x.beginPath(); x.moveTo(-.04 * s, .002 * s); x.lineTo(-.01 * s, .034 * s); x.lineTo(.045 * s, -.03 * s); x.stroke(); x.globalAlpha = 1;
    }
    x.restore();
    // Balken: Spur über die Breite des Feldes, rote Füllung wächst, verschwindet mit dem Haken
    const ba = mid(p) * (1 - mid(m * 1.6));
    if (ba > .01) {
      x.globalAlpha = ba; const bx = .06, bw = hw - .12, by = .2, bh = .034;
      x.fillStyle = ink(.12); rr(x, bx * s, by * s, bw * s, bh * s, bh / 2 * s); x.fill();
      if (g > 0) { x.fillStyle = RED; rr(x, bx * s, by * s, Math.max(bh, bw * g) * s, bh * s, bh / 2 * s); x.fill(); }
      x.globalAlpha = 1;
    }
  };
  const ov = K.decal(OW, OH, ovDraw, hw, hh, B_KNOWN, .02);
  ov.sched = b => sm((b - B_KNOWN) / .012);
  ov.mesh.renderOrder = 4;
  K.onPanel(scr, ov, (hu0 + hu1) / 2, (hv0 + hv1) / 2, -1, null, .004);
  let ovKey = "0";
  K.anim(b => {
    const p = sm((b - B_KNOWN) / .04), g = sm((b - B_BAR) / (B_DONE - B_BAR - .01)), m = sm((b - B_DONE) / .04);
    const key = [Math.round(p * 40), Math.round(g * 160), Math.round(m * 40)].join();
    if (key === ovKey) return; ovKey = key;
    st.p = p; st.g = g; st.m = m;
    const cv = ov.map.image; if (!cv || !cv.getContext) return;
    const x = cv.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
    x.scale(cv.width / OW, cv.height / OH); ovDraw(x, OW, OH); ov.map.needsUpdate = true;
  });

  // ---------- Uhr: Faltschachtel rechts neben dem Bildschirm, Zeiger drehen sich ----------
  F.part("uhr", .07, .08);
  const CX0 = 2.6, CZ0 = .3, { W: TW, D: TD, H: TH } = CLK;
  const ck = K.box(R, CX0, CX0 + TW, CZ0, CZ0 - TD, TH, .24, .1, { col: CASE, fcol: FRONTC });
  K.onPanel(ck.fr, K.decal(Math.round(TW * 600), Math.round(TH * 600), clockFront, TW, TH, .31, .04), TW / 2, TH / 2, -1);
  // Satz 1 ganz auf der Uhr, Umbrüche nach Satzgliedern; Uhr höher und breiter für fünf Zeilen unter dem Zifferblatt
  const T1 = K.print(["Zwischen dem Bekanntwerden", "einer Lücke in einem", "WordPress-Plugin und dem", "ersten Angriff vergehen", "oft nur Stunden."], .13, .4, { align: "center", lh: 1.18 });
  K.onPanel(ck.fr, T1, TW / 2, .6, -1);
  // Zeiger: eigene Gruppe auf der Front (oben = Oberkante), drehen sich um die Mitte des Zifferblatts
  const hands = new THREE.Group(); K.add(hands);
  F.attach(ck.fr, hands, ck.fr.uv(TW / 2, CLK.cv), [0, 1], -1, .006);
  const hm = () => new THREE.MeshBasicMaterial({ color: "#303033", transparent: true, opacity: 0, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const hand = (w, l, tail, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l + tail).translate(0, (l - tail) / 2, z), hm()); m.renderOrder = 5; hands.add(m); return m; };
  const hH = hand(.05, .27, .06, 0), hMin = hand(.03, .42, .07, .0005);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(.04, 24).translate(0, 0, .001), hm()); cap.renderOrder = 5; hands.add(cap);
  // Zeit: ruhiger Grundlauf, dazu drei Runden des Minutenzeigers, solange das Update läuft (Anlauf und Auslauf weich)
  const G0 = B_KNOWN, G1 = B_DONE + .04, TURNS = 3;
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
  const KX0 = 6.4, CW = 2.2, KZ = 1.7, L = 2.3, AL = 68 * PI / 180, ko = { over: .03 };
  const cf = K.panel(R, [KX0, KZ], [KX0 + CW, KZ], [0, -1], .28, .07, AL, ko);
  K.rect(cf, 0, 0, CW, L, CALC, .5);
  const cb = K.panel(cf, cf.uv(0, L), cf.uv(CW, L), [0, -1], .28, .07, -2 * AL, ko);
  K.rect(cb, 0, 0, CW, L, CALC, .5);
  // Satz 2 ganz auf dem Fuß der Vorderseite (höherer Fuß: die Blätter bedecken nur die oberen 1,3 von 2,3), vier Zeilen nach Satzgliedern
  const T2 = K.print(["Ich halte Ihre Seite", "deshalb laufend aktuell", "und sehe regelmäßig nach,", "ob sie sauber läuft."], .14, .7, { align: "center", lh: 1.18 });
  K.onPanel(cf, T2, CW / 2, .5, 1, [0, -1]);
  F.part("blaetter", .5, .01);
  const NP = 6, PU0 = .1, PWc = CW - .2, PL = 1.3, PA = PI + 2 * AL - .06, PF0 = .75, PFS = .035, PFD = .05;
  const MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"];
  // Kalenderblatt (Hochformat PWc × PL, Ursprung oben links): Haken oben, darunter der Monatsname mit dem Haken des Nachsehens rechts daneben,
  // darunter das Raster der Monatstage (Kopfzeile Mo bis So, Tageszahlen 2026, Sonntage in Rot). Jeder Monat nach echtem Kalender: Wochentag des Ersten
  // und Länge des Monats kommen aus Date, bis zu sechs Zeilen.
  const GRID = { x0: .17, x1: PWc - .17, yH: .565, y1: .64, dy: .1 };
  const pageBase = k => (x, W, H) => {
    const s = W / PWc, fam = '"Schibsted Grotesk", sans-serif';
    x.fillStyle = ink(.8); x.fillRect(0, 0, W, .17 * s);
    x.fillStyle = "#ffffff"; for (const u of [.42, PWc - .42]) { x.beginPath(); x.arc(u * s, .085 * s, .035 * s, 0, 2 * Math.PI); x.fill(); }
    // Monatsname unter dem Haken (Abkürzung, keine Jahreszahl)
    x.fillStyle = ink(.96); x.font = `700 ${.22 * s}px ${fam}`; x.textAlign = "left"; x.textBaseline = "alphabetic";
    x.fillText(MON[k].toUpperCase(), GRID.x0 * s, .42 * s);
    // Raster der Monatstage
    const cw = (GRID.x1 - GRID.x0) / 7, lead = (new Date(2026, k, 1).getDay() + 6) % 7, nd = new Date(2026, k + 1, 0).getDate();
    x.textAlign = "center";
    x.fillStyle = ink(.3); x.fillRect(GRID.x0 * s, (GRID.yH + .035) * s, (GRID.x1 - GRID.x0) * s, .008 * s);
    x.font = `600 ${.066 * s}px ${fam}`; if ("letterSpacing" in x) x.letterSpacing = (.012 * s) + "px";
    ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].forEach((d, i) => { x.fillStyle = i === 6 ? RED : ink(.66); x.fillText(d, (GRID.x0 + (i + .5) * cw) * s, GRID.yH * s); });
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.font = `500 ${.09 * s}px ${fam}`;
    for (let d = 1; d <= nd; d++) {
      const c = (lead + d - 1) % 7, r = Math.floor((lead + d - 1) / 7);
      x.fillStyle = c === 6 ? RED : ink(.9); x.fillText(String(d), (GRID.x0 + (c + .5) * cw) * s, (GRID.y1 + r * GRID.dy + .085) * s);
    }
  };
  // Haken des Nachsehens: rechts neben dem Monatsnamen
  const pageCheck = (x, W, H) => {
    const s = W / PWc; x.strokeStyle = ink(.86); x.lineWidth = .05 * s; x.lineCap = "round"; x.lineJoin = "round";
    const c = PWc - .5; x.beginPath(); x.moveTo((c - .15) * s, .27 * s); x.lineTo((c - .04) * s, .37 * s); x.lineTo((c + .17) * s, .15 * s); x.stroke();
  };
  const pages = [];
  for (let k = 0; k < NP; k++) {
    const last = k === NP - 1, t0 = last ? 9 : PF0 + k * PFS;
    const pg = K.panel(cf, cf.uv(PU0, L), cf.uv(PU0 + PWc, L), [0, 1], t0, PFD, PA, { nocut: 1, nofold: 1, lv: cf.lvl + 2 * (NP - k), bounce: .03 });
    K.rect(pg, 0, 0, PWc, PL, PAGE, .5);
    // Alle Blätter tragen von Anfang an ihren ganzen Druck. Damit der Druck eines unteren Blattes nicht durch das Papier darüber scheint
    // (Abstand der Blätter 2 · EPS = 0,003), liegt er nur 0,0008 bzw. 0,0011 über seinem Blatt und ohne Tiefenversatz (polygonOffset aus):
    // der Tiefentest verdeckt ihn dann exakt hinter dem Blatt darüber.
    const base = K.decal(Math.round(PWc * 500), Math.round(PL * 500), pageBase(k), PWc, PL, -1, .02);
    const chk = K.decal(Math.round(PWc * 500), Math.round(PL * 500), pageCheck, PWc, PL, -1, .015);
    chk.mesh.renderOrder = 4; base.mat.polygonOffset = false; chk.mat.polygonOffset = false;
    K.onPanel(pg, base, PWc / 2, PL / 2, 1, [0, -1], .0008);
    K.onPanel(pg, chk, PWc / 2, PL / 2, 1, [0, -1], .0011);
    pages.push(pg);
  }

  // ---------- Konstruktionsphase wie in der Eröffnung: Raster auf dem Bogen, Gerüst der festen Teile im Raum ----------
  F.geruest({ tags: ["monitor", "uhr", "kalender"], t0: .1, t1: .24, du: .03, a: .5 });
  // Bleistiftspur (seite/): auf Flächen mit Druck nur Eckmarken; der Bildschirm ohne Spur (Eckmarken lägen mitten in der Plugin-Liste)
  F.spur({ tags: ["monitor", "uhr", "kalender"], quiet: [ck.fr, cf], filter: nd => nd !== scr, a: .3 });

  // ---------- Lesestellen ----------
  const pxD = (W, H) => Math.min(30, Math.max(27, 27 + (H - 900) / 540 * 2.5));
  const S = {
    // Bildlagen gerechnet (tmp/seite-pruefung/rechnen.mjs): Textträger ganz im Bild (x 0…W, y 64…H−70)
    // Uhr-Lesestelle: Bildschirm mit laufendem Update und Uhr zusammen im Bild (Text rechts), am Handy nur die Uhr
    // Folgefahrt (kern.js): frontal vor dem Text (Sehlinie senkrecht zur Fläche, tilt = Neigung der Fläche), Text bei (sx, sy) im Bild: Platz unten für den Punkt
    t1: { prints: [T1], px: pxD, frontal: true, tilt: 3, sx: .3, sy: .3, b: .56, ntilt: 3, nsx: 0, nsy: .3 },
    // Kalender: Update ist durch, Abstand mit Luft nach oben für die umschlagenden Blätter, Uhr ganz draußen
    t2: { prints: [T2], px: pxD, frontal: true, tilt: 20, sx: .1, sy: .3, b: .86, ntilt: 20, nsx: 0, nsy: .3 }
  };
  return {
    fov: 32, fovN: 44,
    track: 540,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .4 },
    stops: Object.values(S),
    dbg: { heads, scr, ov, ck, cf, cb, pages, hands, T1, T2, minutes },
    keys: [
      // Start: nah auf die liegende Überschrift (Blickhöhe 32°, Handy 34°, Breite rund zwei Drittel bzw. 85 % des Bildes); sie steht beim ersten Scrollen auf
      { w: 0, b: 0, cam: V(-1.8, 5.13, 11.06), tgt: V(-1.8, .1, 3.0), camN: V(-1.8, 5.97, 12.1), tgtN: V(-1.8, .1, 3.4) },
      // Bastellinien fertig: Überblick über den ganzen Bogen (36°); Handy über Bildschirm und Uhr (40°)
      { w: .7, b: .2, cam: V(1.75, 11.73, 15.25), tgt: V(1.75, .8, .2), camN: V(-.9, 11.73, 13.52), tgtN: V(-.9, .8, .5) },
      // alles steht: Blickhöhe sinkt auf 21°, Handy 22° und näher an den Bildschirm
      { w: 1, b: .38, cam: V(1.75, 8.21, 17.74), tgt: V(1.75, 1.4, 0), camN: V(-1.3, 7.41, 13.77), tgtN: V(-1.3, 1.6, -.6) },
      // nah am Bildschirm: Schild, Balken und Haken der Update-Zeile (Plugin-Liste rund zwei Drittel der Bildbreite; Handy rund 85 %)
      { w: .9, b: .4, cam: V(-3.4, 3.55, 6.4), tgt: V(-1.8, 2.35, -1.1), camN: V(-2.0, 3.4, 11.6), tgtN: V(-1.8, 2.1, -1.1) },
      // langsamer Schwenk nach rechts über den Bildschirm (die Dauer folgt dem Weg der Kamera), am Ende zur Uhr hin
      { w: .9, b: .555, cam: V(.1, 3.55, 6.0), tgt: V(-1.6, 2.35, -1.1), camN: V(-1.4, 3.4, 10.8), tgtN: V(-1.6, 2.1, -1.1) },
      { w: 1.1, stop: S.t1 },
      { w: 1.2, stop: S.t2 },
      // Ende: Überblick über alle drei Gegenstände (rund 22°)
      { w: 1, b: 1, cam: V(1.9, 8.6, 17.6), tgt: V(1.9, 1.4, 0), camN: V(4.5, 6.89, 13.09), tgtN: V(4.5, 1.2, .3) }
    ]
  };
}
