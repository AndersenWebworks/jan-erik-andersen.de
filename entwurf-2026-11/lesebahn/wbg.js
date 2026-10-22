// WBG Pooling (Szene 7, direkt hinter „Schnittstellen“): Das Ding ist ein Messestand.
// Ableitung: Ein Industrie- und Vertriebsportal ist der Messestand des Herstellers im Netz; auf dem Stand dreht sich das Produkt auf dem
// Drehteller (360 Grad), die Ware für den Vertrieb liegt in der abschließbaren Theke, und die Leitungen laufen hinaus zu den Systemen.
// Messetheken tragen ihre Aufschrift auf der Front, also stehen die Sätze auf den Thekenfronten:
//  W0 Namensmodul: Kicker und Kopf auf der Front (wie das Firmenschild einer Messetheke).
//  W1 Drehteller-Modul: Satz auf der Front, oben dreht sich das Produkt auf dem Drehteller einmal ganz, solange das Modul vorbeizieht.
//  W2 Abschließbare Theke: der Satz steht auf der Schiebetür; sie gleitet vor die offene Hälfte (die Ordner dahinter verschwinden),
//     dann rastet der Bügel des Vorhängeschlosses ein. Aus der Theke laufen zwei Kabel zu zwei Geräten mit Typenschild Salesforce und Concludis.
// Dahinter steht die Standrückwand mit Blende (oberes Bilddrittel), auf der Wand hinter dem Drehteller die Produktgrafik mit Rundumpfeil.
// Handy: Namens- und Drehteller-Modul sind Messetheken auf Rollen und rollen ein Stück mit (K.trage), die Schiebetür gleitet auf ihrer
// Schiene mit (an Desktop und Handy: die Tür schließt, das ist die Aussage „geschützter Bereich“).

const ink = a => `rgba(48,48,51,${a})`;
const PI = Math.PI;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// Thekenfront: Fläche, feiner Innenrahmen, Sockelleiste
function frontArt(bg, W0, H0) {
  return (x, W, H) => {
    const s = W / W0;
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.2); x.lineWidth = 2.5; x.strokeRect(.09 * s, .09 * s, W - .18 * s, H - .27 * s);
    x.fillStyle = ink(.13); x.fillRect(0, H - .1 * s, W, .1 * s);
  };
}
// Schiebetür: Rahmen, Griffmulde links, Fassung für das Schloss rechts
function doorArt(W0, H0, lockU, lockV) {
  return (x, W, H) => {
    const s = W / W0;
    x.fillStyle = "#faf8f3"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.34); x.lineWidth = 3; rr(x, .04 * s, .04 * s, W - .08 * s, H - .08 * s, .02 * s); x.stroke();
    x.strokeStyle = ink(.18); x.lineWidth = 2; x.strokeRect(.13 * s, .13 * s, W - .26 * s, H - .26 * s);
    x.fillStyle = ink(.22); rr(x, .055 * s, H * .38, .035 * s, H * .24, .015 * s); x.fill();
    // Überfalle: Lasche am rechten Rand, in die der Bügel greift
    x.fillStyle = ink(.55); rr(x, (lockU - .07) * s, (lockV - .3) * s, .14 * s, .2 * s, .02 * s); x.fill();
    x.fillStyle = "#faf8f3"; rr(x, (lockU - .03) * s, (lockV - .26) * s, .06 * s, .09 * s, .01 * s); x.fill();
  };
}
// Vorhängeschloss: Körper mit Schlüsselloch; Bügel eigenes Teil
function lockBody(x, W, H) {
  x.fillStyle = ink(.82); rr(x, 0, 0, W, H, W * .12); x.fill();
  x.fillStyle = "#faf8f3"; x.beginPath(); x.arc(W / 2, H * .42, W * .09, 0, PI * 2); x.fill(); x.fillRect(W / 2 - W * .035, H * .42, W * .07, H * .3);
}
function shackleArt(x, W, H) {
  x.strokeStyle = ink(.82); x.lineWidth = W * .16; x.lineCap = "butt";
  const r = W * .27;
  x.beginPath(); x.moveTo(W / 2 - r, H); x.lineTo(W / 2 - r, r + W * .1); x.arc(W / 2, r + W * .1, r, PI, 0); x.lineTo(W / 2 + r, H); x.stroke();
}
// Gerät (Salesforce, Concludis): Rahmen, Lüftung, belegte Buchse
function deviceArt(W0, H0) {
  return (x, W, H) => {
    const s = W / W0;
    x.fillStyle = "#e4e0d6"; x.fillRect(0, 0, W, H);
    x.strokeStyle = ink(.34); x.lineWidth = 3; rr(x, .04 * s, .04 * s, W - .08 * s, H - .08 * s, .03 * s); x.stroke();
    x.strokeStyle = ink(.26); x.lineWidth = .022 * s; x.lineCap = "round";
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { const x0 = (.14 + c * (W0 - .28) / 5) * s, y = (.14 + r * .07) * s; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + .08 * s, y); x.stroke(); }
    x.strokeStyle = ink(.6); x.lineWidth = 4; rr(x, W / 2 - .16 * s, (H0 - .4) * s - .1 * s, .32 * s, .2 * s, .02 * s); x.stroke();
    x.fillStyle = ink(.12); x.fillRect(.1 * s, (H0 - .16) * s, W - .2 * s, .07 * s);
  };
}
// Ordnerrücken hinter der offenen Theke
function folderArt(n) {
  return (x, W, H) => {
    const w = W / n;
    for (let i = 0; i < n; i++) {
      x.fillStyle = ["#e9dfcb", "#e1d9c9", "#ece9e2", "#e6dccb"][i % 4]; x.fillRect(i * w + 2, 0, w - 4, H);
      x.strokeStyle = ink(.3); x.lineWidth = 2; x.strokeRect(i * w + 2, 1, w - 4, H - 2);
      x.fillStyle = "#faf8f3"; x.fillRect(i * w + w * .2, H * .14, w * .6, H * .22);
      x.strokeStyle = ink(.25); x.beginPath(); x.arc(i * w + w / 2, H * .72, w * .16, 0, PI * 2); x.stroke();
    }
  };
}
// Standrückwand: Blende oben, Fugen der Wandelemente; g: Produktgrafik mit Rundumpfeil (Lage in Welt, relativ zur Wand)
function wallArt(W0, H0, blende, seams, g) {
  return (x, W, H) => {
    const s = W / W0, Y = v => (H0 - v) * s;
    x.fillStyle = "#f1ede5"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#e6e0d3"; x.fillRect(0, 0, W, blende * s);
    x.fillStyle = ink(.3); x.fillRect(0, blende * s, W, 2);
    x.strokeStyle = ink(.16); x.lineWidth = 2;
    for (const u of seams) { x.beginPath(); x.moveTo(u * s, blende * s); x.lineTo(u * s, H); x.stroke(); }
    if (g) {
      // Paneel mit drei Ansichten desselben Produkts (vorn, seitlich, hinten), darunter ein dünner Rundpfeil: 360-Grad-Ansichten
      const k = g.a * s, cx = g.u * s, base = Y(g.v);
      x.fillStyle = "#f7f4ee"; x.fillRect(cx - 2.2 * k, base - 1.05 * k, 4.4 * k, 1.65 * k);
      x.strokeStyle = ink(.2); x.lineWidth = 2; x.strokeRect(cx - 2.2 * k, base - 1.05 * k, 4.4 * k, 1.65 * k);
      prodViews(x, cx, base, k);
    }
  };
}
// Strichzeichnung des Produkts (Pumpe mit Motor) in drei Ansichten; k: Maßstab (px je Einheit), base: Standlinie
function prodViews(x, cx, base, k) {
  const L = (pts, close) => { x.beginPath(); pts.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); if (close) x.closePath(); x.stroke(); };
  const box = (u0, v0, u1, v1) => L([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], true);
  x.lineJoin = "round"; x.strokeStyle = ink(.5); x.lineWidth = Math.max(2, .028 * k);
  const S = .62, h = v => base - v * k * S;
  // seitlich (Mitte): Grundrahmen, Lüfterhaube, Motor mit Rippen, Flansch, Spiralgehäuse, Saugstutzen
  const u = v => cx + v * k * S;
  box(u(-1), h(0), u(.95), h(.1));
  box(u(-.98), h(.1), u(-.78), h(.72));
  box(u(-.78), h(.1), u(.12), h(.88));
  for (let i = 0; i < 5; i++) L([[u(-.7), h(.24 + i * .12)], [u(.04), h(.24 + i * .12)]]);
  box(u(.12), h(.1), u(.24), h(1.0));
  box(u(.24), h(.1), u(.78), h(.92));
  x.beginPath(); x.arc(u(.51), h(.5), .22 * k * S, 0, PI * 2); x.stroke();
  box(u(.78), h(.32), u(.95), h(.66));
  // vorn (links): Lüfterseite mit Gitter
  const fu = v => cx - 1.6 * k + v * k * S;
  box(fu(-.42), h(0), fu(.42), h(.1));
  box(fu(-.36), h(.1), fu(.36), h(.88));
  for (const r of [.26, .17, .08]) { x.beginPath(); x.arc(fu(0), h(.49), r * k * S, 0, PI * 2); x.stroke(); }
  // hinten (rechts): Pumpenseite mit Saugstutzen
  const bu = v => cx + 1.6 * k + v * k * S;
  box(bu(-.42), h(0), bu(.42), h(.1));
  box(bu(-.38), h(.1), bu(.38), h(.92));
  x.beginPath(); x.arc(bu(0), h(.5), .3 * k * S, 0, PI * 2); x.stroke();
  x.beginPath(); x.arc(bu(0), h(.5), .1 * k * S, 0, PI * 2); x.stroke();
  // Rundpfeil darunter (dünn)
  x.strokeStyle = ink(.36); x.lineWidth = Math.max(1.5, .016 * k);
  const ey = base + .3 * k, ex = 1.9 * k, er = .14 * k;
  x.beginPath(); x.ellipse(cx, ey, ex, er, 0, .08 * PI, 1.92 * PI, false); x.stroke();
  const ta = .08 * PI, px = cx + ex * Math.cos(ta), py = ey + er * Math.sin(ta);
  x.fillStyle = ink(.36); x.beginPath(); x.moveTo(px - .1 * k, py + .05 * k); x.lineTo(px + .03 * k, py + .01 * k); x.lineTo(px - .08 * k, py - .05 * k); x.fill();
}
// Markierungsstrich am Tellerrand (dreht mit), feiner Kreis
function scaleArt(x, W, H) {
  x.translate(W / 2, H / 2); x.strokeStyle = ink(.22); x.lineWidth = 3;
  x.beginPath(); x.arc(0, 0, W * .47, 0, PI * 2); x.stroke();
  x.lineWidth = 12; x.strokeStyle = ink(.8); x.lineCap = "round"; x.beginPath(); x.moveTo(0, W * .38); x.lineTo(0, W * .49); x.stroke();
}
// Gradteilung (fest) als Ring um den Teller; f = Innenradius / Außenradius
function gradArt(f) {
  return (x, W) => {
    x.translate(W / 2, W / 2); x.strokeStyle = ink(.5); x.lineCap = "butt";
    const R1 = W * .5 - 2, R0 = R1 * f;
    x.lineWidth = 2; x.beginPath(); x.arc(0, 0, R0 + 1, 0, PI * 2); x.stroke();
    for (let k = 0; k < 72; k++) {
      const a = k * PI / 36, l = k % 18 === 0 ? 1 : k % 2 === 0 ? .6 : .35, r1 = R0 + (R1 - R0) * l;
      x.lineWidth = k % 18 === 0 ? 5 : 3; x.beginPath(); x.moveTo(R0 * Math.sin(a), R0 * Math.cos(a)); x.lineTo(r1 * Math.sin(a), r1 * Math.cos(a)); x.stroke();
    }
  };
}
// Motor: Kühlrippen, Typenschild ohne Schrift
function motorArt(x, W, H) {
  x.fillStyle = "#ebe5d8"; x.fillRect(0, 0, W, H);
  x.strokeStyle = ink(.32); x.lineWidth = 3;
  for (let i = 0; i < 7; i++) { const y = H * (.12 + i * .12); x.beginPath(); x.moveTo(W * .04, y); x.lineTo(W * .96, y); x.stroke(); }
  x.fillStyle = "#faf8f3"; x.fillRect(W * .55, H * .3, W * .24, H * .2); x.strokeStyle = ink(.4); x.lineWidth = 2; x.strokeRect(W * .55, H * .3, W * .24, H * .2);
  x.fillStyle = ink(.25); for (let i = 0; i < 3; i++) x.fillRect(W * .58, H * (.34 + i * .045), W * .16, 3);
}
// Spiralgehäuse der Pumpe
function pumpArt(x, W, H) {
  x.fillStyle = "#f1ecdf"; x.fillRect(0, 0, W, H);
  x.strokeStyle = ink(.45); x.lineWidth = 4; const r = Math.min(W, H) * .36, cx = W / 2, cy = H * .52;
  x.beginPath(); for (let t = 0; t <= 1.85 * PI; t += .05) { const q = r * (.55 + .45 * t / (1.85 * PI)); x.lineTo(cx + q * Math.cos(t), cy + q * Math.sin(t)); } x.stroke();
  x.beginPath(); x.arc(cx, cy, r * .2, 0, PI * 2); x.stroke();
  x.fillStyle = ink(.35); for (const [u, v] of [[.12, .1], [.88, .1], [.12, .9], [.88, .9]]) { x.beginPath(); x.arc(W * u, H * v, W * .03, 0, PI * 2); x.fill(); }
}
// Lüfterhaube: Gitter
function fanArt(x, W, H) {
  x.fillStyle = "#e4dece"; x.fillRect(0, 0, W, H);
  x.strokeStyle = ink(.35); x.lineWidth = 3;
  for (let i = 1; i < 6; i++) { const y = H * i / 6; x.beginPath(); x.moveTo(W * .15, y); x.lineTo(W * .85, y); x.stroke(); }
}

export default function (K) {
  const { F, R, V, Q, sm, mech, win, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const TOPC = c3("#ece9e2"), SIDEC = c3("#e1d9c9"), FRONTC = c3("#f6f3ec"), BACKC = c3("#e8e1d2"), PLATE = c3("#e9e4d8"), RIM = c3("#e1dccf");
  const DEV = c3("#ece9e2"), DEVF = c3("#e4e0d6"), WHEEL = c3("#dcd7cd"), WALL = c3("#f1ede5");
  // Schrift auf den senkrechten Thekenfronten: K.EV gleicht die Neigung aus; der Blick fällt auf Lesehöhe etwas steiler auf die Front,
  // daher 6 % mehr (gerechnet: sonst Desktop 20 px, Handy 16 px statt 21 und 17)
  const EV = K.EV * 1.06, LZ = 0;

  // ---------- Sätze ----------
  const KICK = "2023 bis 2025 · für die Runden Group";
  const eH = EV * (N ? 1.6 : 1.9), eK = EV * (N ? .72 : .62);
  const kp = K.kopf({ head: "WBG Pooling", e: eH, on: 0 });
  // Handy: Kicker in zwei Zeilen (der Mittelpunkt wird zum Zeilenumbruch), sonst ist das Namensmodul breiter als das Bild
  const KL = N ? ["2023 bis 2025", "für die Runden Group"] : [KICK], KLH = 1.35;
  const kk = K.print(KL, eK, 0, { font: "kicker", col: "#5f5f63", text: KICK, lh: KLH });
  const T1 = K.satz("WBG Pooling ist ein *Industrie- und Vertriebsportal* mit *360-Grad-Produktansichten*.", { e: EV, maxEm: N ? 15.5 : 22, on: 0 });
  const T2 = K.satz("Es hat einen *geschützten Bereich* für den Vertrieb und *Anbindungen an Salesforce und Concludis*.", { e: EV, maxEm: N ? 15.5 : 18, on: 0 });
  const kw = Math.max(kp.h.t.tw * eH, kk.t.tw * eK);
  const kH = eK * (1.05 + (KL.length - 1) * KLH), hH = eH * 1.05, kGap = .5 * eH;

  // ---------- Maße ----------
  const MG = N ? .3 : .45;                                   // Rand der Schrift auf den Fronten
  const H =Math.max(1.3, kH + kGap + hH + .5, T1.th + .55, T2.th + .6);   // Thekenhöhe
  const LOCKW = .5;                                          // Platz für das Schloss rechts auf der Tür
  const w1 = kw + 2 * MG, w2 = Math.max(T1.tw + 2 * MG, N ? 1.6 : 2.0), dw = T2.tw + 2 * MG + LOCKW;
  const w3 = 2 * dw + .2;
  // Drehteller: der Teller füllt das Modul, die Tiefe der Theke folgt aus ihm (feste Gradteilung als Ring um den Teller)
  const RP = Math.min(N ? .95 : 1.2, w2 / 2 - .35), RG = RP + .17;
  const TD = Math.max(1.6, 2 * RG + .3);                     // Tiefe der Theke (Front bei z = 0)
  // Mitfahrt (nur Weg, Lage folgt): Namensmodul und Drehteller-Modul rollen am Handy mit; die Tür schließt immer (minD = Türbreite)
  const D1 = K.trage(0, kw).D, D2 = K.trage(0, T1.tw).D;
  const gap = D => N ? (D > 0 ? D + .4 : .5) : .06;
  const x1L = 0, x2L = x1L + w1 + gap(D2), x3L = x2L + w2 + (N ? .6 : .06), x3R = x3L + w3;
  const DVW = N ? .8 : .95, DVG = N ? .25 : .35, dvX0 = x3R + (N ? 1.0 : 1.1);
  const XE = dvX0 + DVW + DVG / 2;
  const XL = Math.min(-.4, x1L - D1);                         // linke Kante des ersten Bauteils (Startlage am Handy)
  const XS = XL - K.halfW;
  K.strecke(XS, XE);
  const sicht = K.sicht, Lst = XE - XS, bx = dx => dx / Lst;
  const BZ = -(TD + (N ? 3.4 : 3.8)), BH = N ? 3.0 : 3.6, BL = .42;   // Standrückwand: Lage, Höhe, Blende

  K.sheet(XL - 1.5, XE + 3, -12, 3);

  // ---------- Thekenmodul: Platte hebt sich, Front und Wangen schwenken von der Platte herab (liegen vorher auf ihr, nichts ragt über) ----------
  // par: Bogen oder Schiebeknoten, x0/w Lage in der Startlage, tIn: b, ab dem das Modul im Bild ist. Liefert { top, fr, tF } (tF: Front steht)
  function theke(tag, par, x0, w, tIn, o = {}) {
    F.part(tag, Math.max(0, tIn - bx(.2)), bx(1.2));
    const tL = tIn + bx(.6), tW = tL + bx(.9), dW = bx(1.0);
    const top = F.lift(par, H, tL, bx(1.2), { over: .02 });
    F.poly(top, [[x0 - .04, .07], [x0 + w + .04, .07], [x0 + w + .04, -TD - .02], [x0 - .04, -TD - .02]], TOPC, .5);
    const hang = { own: R, over: .03 };
    const r = { top, tF: tW + dW };
    if (o.front !== false) {
      const fw = o.frontW || w;
      r.fr = K.panel(top, [x0, 0], [x0 + fw, 0], [0, -1], tW, dW, -Q, hang);
      K.rect(r.fr, 0, 0, fw, H, FRONTC);
      K.onPanel(r.fr, K.decal(Math.min(2048, Math.round(fw * 260)), Math.round(H * 260), frontArt("#f6f3ec", fw, H), fw, H, tW + dW * .6), fw / 2, H / 2, -1, [0, 1]);
    }
    K.rect(K.panel(top, [x0, 0], [x0, -TD], [1, 0], tW + bx(.25), dW, -Q, hang), 0, 0, TD, H, SIDEC);
    K.rect(K.panel(top, [x0 + w, 0], [x0 + w, -TD], [-1, 0], tW + bx(.25), dW, -Q, hang), 0, 0, TD, H, SIDEC);
    if (o.back) K.rect(K.panel(top, [x0, -TD], [x0 + w, -TD], [0, 1], tW + bx(.35), dW, -Q, hang), 0, 0, w, H, BACKC);
    // Rollen
    for (const u of [.32, w - .32]) K.rect(K.panel(par, [x0 + u - .12, .03], [x0 + u + .12, .03], [0, 1], tW + dW * .5, bx(.5), Q, { over: .02 }), 0, 0, .24, .11, WHEEL, .4);
    return r;
  }
  // Text links bündig auf eine herabhängende Front (v von der Oberkante gemessen, Druck aufrecht)
  const onFront = (nd, pr, u0, vc) => K.onPanel(nd, pr, u0 + pr.w / 2 - pr.t.padX * pr.e, vc, -1, [0, 1]);

  // ---------- Standrückwand mit Blende ----------
  // Grafik hinter dem Satz W1 (Handy: über der Mitte seiner Mitfahrt); die Wandelemente teilen sich um sie herum
  const cx2F = x2L + w2 / 2, gx = N ? cx2F - D2 / 2 : cx2F, GA = N ? .62 : .78;
  const xW1 = Math.min(x2L - .1, gx - 2.5 * GA), xW2 = Math.max(x3L - .1, gx + 2.5 * GA);
  const walls = [[XL - .2, xW1], [xW1, xW2], [xW2, x3R + .5]];
  walls.forEach(([a, c], i) => {
    const tIn = sicht(a).in;
    F.part("wand" + i, Math.max(0, tIn), bx(1.4));
    const L = c - a, nd = K.panel(R, [a, BZ], [c, BZ], [0, -1], tIn + bx(.8), bx(1.6), Q, { over: .03 });
    K.rect(nd, 0, 0, L, BH, WALL);
    const seams = []; const n = Math.max(1, Math.round(L / 2.2)); for (let k = 1; k < n; k++) seams.push(L * k / n);
    const g = i === 1 ? { u: gx - a, v: BH - BL - .2 - 1.05 * GA, a: GA } : null;
    const pxu = Math.min(200, 2048 / L);
    K.onPanel(nd, K.decal(Math.round(L * pxu), Math.round(BH * pxu), wallArt(L, BH, BL, seams.filter(u => !g || Math.abs(u - g.u) > 2.3 * GA), g), L, BH, tIn + bx(2.0)), L / 2, BH / 2, 1);
    if (i === 1) K.onPanel(nd, K.print(["WBG Pooling"], N ? .2 : .22, tIn + bx(2.2), { font: "kicker", col: "#5f5f63", align: "center" }), gx - a, BH - BL / 2, 1);
  });

  // ---------- W0: Namensmodul (Kopf auf der Front) ----------
  const T0 = K.trage(x1L + w1 / 2, kw, {});
  const m1x = T0.c0 - w1 / 2, m1 = theke("name", T0.node(R), m1x, w1, sicht(m1x).in);
  kk.on = kp.h.on = m1.tF + bx(.1);
  const kTop = (H - (kH + kGap + hH)) / 2 - .02;
  onFront(m1.fr, kk, MG, kTop + kH / 2);
  onFront(m1.fr, kp.h, MG, kTop + kH + kGap + hH / 2);

  // ---------- W1: Drehteller-Modul ----------
  const T1t = K.trage(cx2F, T1.tw, {});
  const m2x = T1t.c0 - w2 / 2, m2par = T1t.node(R), m2 = theke("drehteller", m2par, m2x, w2, sicht(m2x).in);
  T1.on = m2.tF + bx(.1);
  onFront(m2.fr, T1, MG, H / 2 + .02);
  // Drehteller: Rand steht auf, Teller hebt sich, Produkt faltet sich auf ihm auf; dann dreht er sich einmal ganz, solange das Modul durchs Bild zieht
  const cx = T1t.c0, cz = -TD / 2;
  // Handy: Teller und Produkt bauen sich doppelt so schnell auf, damit sie stehen, solange der Satz mitfährt
  const bt = d => bx(d * (N ? .5 : 1));
  const tT = m2.tF + bt(.2);
  F.part("teller", tT - bt(.3), bt(.8));
  // feste Gradteilung als Ring auf der Platte; der Teller dreht sich darin, der Markierungsstrich an seinem Rand dreht mit
  K.onFlat(m2.top, K.decal(1024, 1024, gradArt(RP / RG), 2 * RG, 2 * RG, tT + bt(.4)), cx, cz, .003);
  const ring = []; for (let k = 0; k < 24; k++) { const a = (k + .5) * PI / 12; ring.push([cx + RP * Math.sin(a), cz + RP * Math.cos(a)]); }
  ring.forEach((p, k) => {
    const q = ring[(k + 1) % 24], mx = (p[0] + q[0]) / 2 - cx, mz = (p[1] + q[1]) / 2 - cz, ml = Math.hypot(mx, mz);
    K.rect(K.panel(m2.top, p, q, [mx / ml, mz / ml], tT + k * bt(.015), bt(.6), Q, { over: .03 }), 0, 0, Math.hypot(q[0] - p[0], q[1] - p[1]), .1, RIM);
  });
  const plate = F.lift(m2.top, .1, tT + bt(.5), bt(.6), { over: .04 });
  F.poly(plate, ring, PLATE, .5);
  const tP = tT + bt(1.1), tS0 = tP + bt(1.8), tS1 = Math.max(tS0 + bx(3), sicht(cx2F).aus);
  const spin = F.spin(plate, [cx, cz], 2 * PI, tS0, tS1 - tS0, { lin: true });
  K.onFlat(spin, K.decal(1024, 1024, scaleArt, 2 * RP, 2 * RP, tT + bt(1.0)), cx, cz, .004);
  // Produkt: Kreiselpumpe mit Motor auf einem Grundrahmen (Lüfterhaube, Motor mit Rippen, Flansch, Spiralgehäuse, Saugstutzen)
  F.part("produkt", tP - bt(.2), bt(.9));
  const s = RP / 1.2, X = v => cx + v * s, Z = v => cz + v * s, po = { own: plate, mvOwn: true };
  const foot = K.slab(spin, X(-1.0), X(.95), Z(.42), Z(-.42), .1 * s, tP, bt(.6), { col: c3("#ddd6c8"), top: c3("#e6e0d3"), own: plate });
  const tB = tP + bt(.5), dB = bt(.9);
  const fan = K.box(foot, X(-.98), X(-.78), Z(.3), Z(-.3), .62 * s, tB, dB, { col: c3("#e4dece"), ...po });
  const mot = K.box(foot, X(-.78), X(.12), Z(.36), Z(-.36), .78 * s, tB + bt(.2), dB, { col: c3("#ebe5d8"), roof: c3("#f3efe6"), ...po });
  K.box(foot, X(.12), X(.24), Z(.44), Z(-.44), .9 * s, tB + bt(.4), dB, { col: c3("#e1dccf"), ...po });
  const pump = K.box(foot, X(.24), X(.78), Z(.38), Z(-.38), .84 * s, tB + bt(.6), dB, { col: c3("#f1ecdf"), roof: c3("#f7f3ea"), ...po });
  K.box(foot, X(.78), X(.95), Z(.17), Z(-.17), .5 * s, tB + bt(.8), dB, { col: c3("#e8e2d4"), ...po });
  const dOn = tB + bt(.8) + dB;
  K.onPanel(mot.fr, K.decal(512, Math.round(512 * .78 / .9), motorArt, .9 * s, .78 * s, dOn), .45 * s, .39 * s, -1);
  K.onPanel(pump.fr, K.decal(400, Math.round(400 * .84 / .54), pumpArt, .54 * s, .84 * s, dOn), .27 * s, .42 * s, -1);
  K.onPanel(fan.lf, K.decal(256, 256, fanArt, .6 * s, .62 * s, dOn), .3 * s, .31 * s, -1);

  // ---------- W2: abschließbare Theke mit Schiebetür ----------
  const m3 = theke("theke", R, x3L, w3, sicht(x3L).in, { frontW: dw + .1, back: true });
  // Ordner in der offenen Hälfte
  const fx0 = x3L + dw + .35, fx1 = x3R - .25, fH = H - .4;
  F.part("ordner", m3.tF - bx(.6), bx(.6));
  const fol = K.panel(R, [fx0, -.75], [fx1, -.75], [0, -1], m3.tF - bx(.3), bx(.8), Q, { over: .03 });
  K.rect(fol, 0, 0, fx1 - fx0, fH, c3("#e9dfcb"));
  K.onPanel(fol, K.decal(Math.round((fx1 - fx0) * 200), Math.round(fH * 200), folderArt(Math.max(4, Math.round((fx1 - fx0) / .42))), fx1 - fx0, fH, m3.tF), (fx1 - fx0) / 2, fH / 2, 1);
  // Tür: hängt sich an der Schiene unter der Platte ein (über der geschlossenen Hälfte), gleitet dann vor die offene Hälfte
  // Mitfahrt nach der Mitte des Satzes (er steht links auf der Tür, rechts bleibt Platz für das Schloss)
  const tU = MG - .05 + T2.tw / 2, doorL = x3L + .1 + dw;
  const TD2 = K.trage(doorL + tU, T2.tw, { minD: dw });
  const dx0 = TD2.c0 - tU;
  F.part("tuer", Math.max(0, sicht(dx0).in), bx(1.0));
  const dpar = TD2.node(m3.top);
  const tDo = Math.min(m3.tF + bx(.3), TD2.bA - bx(1.0));
  const door = K.panel(dpar, [dx0, .1], [dx0 + dw, .1], [0, -1], tDo, bx(1.0), -Q, { own: R, over: .03 });
  const DH = H - .06;
  K.rect(door, 0, .02, dw, DH, c3("#faf8f3"));
  const lockU = dw - LOCKW / 2 - .05, lockV = .62;
  K.onPanel(door, K.decal(Math.round(dw * 240), Math.round(DH * 240), doorArt(dw, DH, lockU, lockV), dw, DH, tDo + bx(.8)), dw / 2, .02 + DH / 2, -1, [0, 1]);
  T2.on = tDo + bx(1.0);
  onFront(door, T2, MG - .05, .02 + DH / 2);
  // Vorhängeschloss: Körper sitzt an der Überfalle, der Bügel fällt ein, wenn die Tür zu ist
  const LW = .2, LHt = .17;
  K.onPanel(door, K.decal(160, 136, lockBody, LW, LHt, T2.on), lockU, lockV + .02, -1, [0, 1], .004);
  const shPr = K.decal(160, 160, shackleArt, LW, LW, T2.on), shG = new THREE.Group();
  shG.add(shPr.mesh); K.add(shG);
  F.attach(door, shG, door.uv(lockU, lockV - LHt / 2 - LW / 2 + .045), [0, 1], -1, .005);
  const tLk = TD2.bB, open = .12;
  K.anim(b => { shPr.mesh.position.y = open * (1 - mech(win(b, tLk, bx(.6)), .15)); });

  // ---------- Anbindungen: zwei Kabel aus der Theke zu zwei Geräten mit Typenschild ----------
  const dvIn = sicht(dvX0).in, DVH = .78, DZ0 = -.35, DZ1 = DZ0 - .9;
  const names = ["Salesforce", "Concludis"];
  names.forEach((nm, i) => {
    const x0 = dvX0 + i * (DVW + DVG);
    F.part("geraet" + i, Math.max(0, dvIn + i * bx(.3)), bx(1.0));
    const t0 = dvIn + bx(.8) + i * bx(.3);
    const bxx = K.box(R, x0, x0 + DVW, DZ0, DZ1, DVH, t0, bx(1.2), { col: DEV, fcol: DEVF });
    K.onPanel(bxx.fr, K.decal(Math.round(DVW * 260), Math.round(DVH * 260), deviceArt(DVW, DVH), DVW, DVH, t0 + bx(1.0)), DVW / 2, DVH / 2, -1);
    const lab = K.print([nm], N ? .11 : .1, t0 + bx(1.1), { font: "kicker", col: "#5f5f63", align: "center" });
    K.onPanel(bxx.fr, lab, DVW / 2, DVH - .2, -1);
    // Kabel: aus der rechten Wange der Theke, über den Bogen, in die Buchse des Geräts
    const zc = -.6 - i * .35, sx = x0 + DVW / 2, sy = .4;
    K.cable([V(x3R + .01, .3, zc), V(x3R + .25, .025, zc + .05), V(sx - .3, .025, DZ0 + .5 + i * .15), V(sx, .03, DZ0 + .35), V(sx, sy - .05, DZ0 + .06), V(sx, sy, DZ0 + .01)],
      .022, "#8e8981", t0 + bx(1.2), bx(1.6));
  });

  // ---------- Faden: vor den Theken über den Bogen, an den Geräten vorbei weiter ----------
  const FZ = LZ + .95;
  const faden = [[XL - 1, .004, FZ], [XE + 4, .004, FZ]];

  return {
    strecke: [XS, XE], lineZ: LZ,
    faden,
    anchor: XS,
    stops: [{ name: "w0", prints: [kp.h, kk] }, { name: "w1", prints: [T1] }, { name: "w2", prints: [T2] }]
  };
}
