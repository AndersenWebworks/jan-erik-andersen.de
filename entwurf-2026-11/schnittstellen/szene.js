// Schnittstellen und eigene Werkzeuge (Katalog 5) + WBG Pooling (Katalog 7), zwei Szenen auf einer Kamerabahn, Bogen + Bastellinien.
// Szene 1 (b 0 … .54): Ein Bildschirm mit Website steht auf, daneben drei Geräte (CRM, ERP, Bewerbermanagement) mit leeren Buchsen.
//   Kabel mit Stecker laufen vom Bildschirm zu den Geräten und stecken ein. Beim ERP passt der Stecker nicht (runde Buchse):
//   der Stecker stößt an, zieht sich zurück, ein rotes Adapterstück faltet sich aus dem Bogen dazwischen und rastet ein, dann steckt der Stecker.
// Szene 2 (b .55 … 1): Dieselben Geräte. Davor ein Bildschirm mit Portal, ein Drehteller mit Produkt (dreht sich beim Scrollen),
//   eine Login-Tafel mit Schloss (der Bügel rastet ein) und zwei Kabel zur zweiten Buchse von CRM (Salesforce) und Bewerbermanagement (Concludis).
// Alle Texte wörtlich aus entwurf-2026-10-b-raumtext-2/index.html, Satz für Satz an dem Bauteil, von dem er handelt.

const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235", MUTED = "#66666a";
const IMPRINT = { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2 };
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Bildschirminhalte (Koordinaten 1000 × 625) ----------
function pageSite(x, W, H) {
  const s = W / 1000, S = H / 625, L = [];
  L.push({ t: "box", x: 60, y: 46, w: 118, h: 22, a: .85 });
  for (let i = 0; i < 4; i++) L.push({ t: "txt", x: 600 + i * 88, y: 52, w: 62, h: 10, a: .4 });
  L.push({ t: "rule", y: 100 }, { t: "box", x: 60, y: 150, w: 430, h: 42, a: .82 }, { t: "box", x: 60, y: 204, w: 300, h: 42, a: .82 });
  [400, 380, 260].forEach((w, i) => L.push({ t: "txt", x: 60, y: 276 + i * 24, w, h: 10, a: .3 }));
  L.push({ t: "btn", x: 60, y: 362, w: 150, h: 44 }, { t: "img", x: 560, y: 140, w: 380, h: 280 });
  for (let c = 0; c < 3; c++) { const X = 60 + c * 300; L.push({ t: "box", x: X, y: 470, w: 150, h: 14, a: .7 }); [240, 220, 170].forEach((w, i) => L.push({ t: "txt", x: X, y: 500 + i * 20, w, h: 8, a: .26 })); }
  L.push({ t: "rule", y: 590 });
  draw(x, s, S, W, H, L);
}
// Portal: Kopfzeile, Produktbild mit Rundumpfeil, Textzeilen, Schaltfläche, Anmelde-Reiter
function pagePortal(x, W, H) {
  const s = W / 1000, S = H / 625, L = [];
  L.push({ t: "box", x: 60, y: 46, w: 118, h: 22, a: .85 });
  for (let i = 0; i < 3; i++) L.push({ t: "txt", x: 600 + i * 88, y: 52, w: 62, h: 10, a: .4 });
  L.push({ t: "box", x: 830, y: 40, w: 110, h: 30, a: .0, tab: 1 });
  L.push({ t: "rule", y: 100 }, { t: "prod", x: 80, y: 140, w: 400, h: 330 });
  L.push({ t: "box", x: 540, y: 150, w: 360, h: 40, a: .82 }, { t: "box", x: 540, y: 202, w: 250, h: 40, a: .82 });
  [340, 320, 220].forEach((w, i) => L.push({ t: "txt", x: 540, y: 274 + i * 24, w, h: 10, a: .3 }));
  L.push({ t: "btn", x: 540, y: 372, w: 150, h: 44 });
  for (let c = 0; c < 4; c++) { const X = 80 + c * 220; L.push({ t: "txt", x: X, y: 510, w: 150, h: 10, a: .5 }, { t: "txt", x: X, y: 536, w: 110, h: 8, a: .26 }); }
  L.push({ t: "rule", y: 590 });
  draw(x, s, S, W, H, L);
}
function draw(x, s, S, W, H, L) {
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  for (const o of L) {
    if (o.t === "rule") { x.fillStyle = ink(.12); x.fillRect(0, o.y * S, W, 2 * S); continue; }
    const X = o.x * s, Y = o.y * S, w = o.w * s, h = o.h * S;
    if (o.tab) { x.strokeStyle = ink(.5); x.lineWidth = 2.5 * s; rr(x, X, Y, w, h, 4 * s); x.stroke(); x.strokeStyle = ink(.6); rr(x, X + 14 * s, Y + 13 * S, 12 * s, 10 * S, 2 * s); x.stroke(); x.beginPath(); x.arc(X + 20 * s, Y + 13 * S, 5 * s, PI, 0); x.stroke(); x.fillStyle = ink(.4); rr(x, X + 38 * s, Y + 10 * S, 54 * s, 10 * S, 5 * s); x.fill(); continue; }
    if (o.t === "box" || o.t === "txt") { x.fillStyle = ink(o.a); rr(x, X, Y, w, h, o.t === "txt" ? h / 2 : 2 * s); x.fill(); }
    else if (o.t === "btn") { x.fillStyle = RED; rr(x, X, Y, w, h, 4 * s); x.fill(); x.fillStyle = "rgba(255,255,255,.92)"; rr(x, X + 30 * s, Y + h / 2 - 5 * S, w - 60 * s, 10 * S, 5 * S); x.fill(); }
    else if (o.t === "img") {
      x.fillStyle = ink(.07); x.fillRect(X, Y, w, h); x.strokeStyle = ink(.3); x.lineWidth = 2.5 * s; x.lineJoin = "round";
      x.beginPath(); x.moveTo(X, Y + h); x.lineTo(X + w * .32, Y + h * .45); x.lineTo(X + w * .55, Y + h * .72); x.lineTo(X + w * .7, Y + h * .58); x.lineTo(X + w, Y + h); x.stroke();
      x.beginPath(); x.arc(X + w * .74, Y + h * .28, 24 * s, 0, PI * 2); x.stroke();
    } else if (o.t === "prod") {
      // Produktbild: Würfel auf Standfläche, Rundumpfeil darum (360°)
      x.fillStyle = ink(.05); x.fillRect(X, Y, w, h); x.strokeStyle = ink(.55); x.lineWidth = 3 * s; x.lineJoin = "round";
      const cx = X + w / 2, cy = Y + h * .48, a = 62 * s;
      x.beginPath(); x.moveTo(cx - a, cy - a * .25); x.lineTo(cx, cy - a * .75); x.lineTo(cx + a, cy - a * .25); x.lineTo(cx + a, cy + a * .65); x.lineTo(cx, cy + a * 1.15); x.lineTo(cx - a, cy + a * .65); x.closePath(); x.stroke();
      x.beginPath(); x.moveTo(cx - a, cy - a * .25); x.lineTo(cx, cy + a * .25); x.lineTo(cx + a, cy - a * .25); x.moveTo(cx, cy + a * .25); x.lineTo(cx, cy + a * 1.15); x.stroke();
      x.strokeStyle = ink(.35); x.lineWidth = 2.5 * s; x.beginPath(); x.ellipse(cx, cy + a * .55, a * 1.9, a * .55, 0, .15 * PI, 1.55 * PI); x.stroke();
      x.fillStyle = ink(.35); x.beginPath(); x.moveTo(cx + a * 1.9 * Math.cos(.15 * PI) - 12 * s, cy + a * .55 + a * .55 * Math.sin(.15 * PI) - 4 * s); x.lineTo(cx + a * 1.9 * Math.cos(.15 * PI) + 6 * s, cy + a * .55 + a * .55 * Math.sin(.15 * PI) + 8 * s); x.lineTo(cx + a * 1.9 * Math.cos(.15 * PI) + 10 * s, cy + a * .55 + a * .55 * Math.sin(.15 * PI) - 14 * s); x.fill();
    }
  }
}
const PI = Math.PI;

// Front eines Geräts (Druck, oben = Oberkante): Rahmen, Lüftungsschlitze, zwei Buchsen. kind: "rect" passt zum Stecker, "round" nicht
function deviceFront(socks) {
  return (x, W, H, dw, dh) => {
    const s = W / dw, Y = v => (dh - v) * s;
    x.strokeStyle = ink(.34); x.lineWidth = 3; rr(x, .05 * s, .05 * s, W - .1 * s, H - .1 * s, .03 * s); x.stroke();
    x.strokeStyle = ink(.28); x.lineWidth = .026 * s; x.lineCap = "round";
    for (let r = 0; r < 3; r++) { const yy = Y(dh - .2 - r * .075); for (let c = 0; c < 9; c++) { const x0 = (.24 + c * (dw - .6) / 9) * s; x.beginPath(); x.moveTo(x0, yy); x.lineTo(x0 + .09 * s, yy); x.stroke(); } }
    for (const k of socks) {
      const cx = k.u * dw * s, cy = Y(.36);
      x.strokeStyle = ink(.6); x.lineWidth = 4;
      if (k.kind === "round") { x.beginPath(); x.arc(cx, cy, .15 * s, 0, PI * 2); x.stroke(); x.beginPath(); x.arc(cx, cy, .055 * s, 0, PI * 2); x.stroke(); }
      else { rr(x, cx - .2 * s, cy - .12 * s, .4 * s, .24 * s, .02 * s); x.stroke(); x.fillStyle = ink(.5); x.fillRect(cx - .13 * s, cy - .02 * s, .26 * s, .04 * s); }
      x.strokeStyle = ink(.3); x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy + .3 * s, .028 * s, 0, PI * 2); x.stroke();
    }
  };
}
// Front des Adapters (rot): Buchse für den rechteckigen Stecker in Weiß
function adapterFront(x, W, H, dw, dh) {
  const s = W / dw, cx = W / 2, cy = (dh - .36) * s;
  x.strokeStyle = "rgba(255,255,255,.95)"; x.lineWidth = 4.5; rr(x, cx - .2 * s, cy - .12 * s, .4 * s, .24 * s, .02 * s); x.stroke();
  x.fillStyle = "rgba(255,255,255,.9)"; x.fillRect(cx - .13 * s, cy - .02 * s, .26 * s, .04 * s);
  x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = 2.5; x.strokeRect(.1 * s, .1 * s, W - .2 * s, H - .2 * s);
}
// Login-Tafel: Titelzeile, zwei Felder, Schaltfläche, Schloss ohne Bügel (der Bügel ist ein eigenes Teil und rastet ein)
function loginFace(x, W, H, bw, bh) {
  const s = W / bw;
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  x.strokeStyle = ink(.34); x.lineWidth = 3; rr(x, .05 * s, .05 * s, W - .1 * s, H - .1 * s, .03 * s); x.stroke();
  x.fillStyle = ink(.82); rr(x, .24 * s, .24 * s, 1.0 * s, .09 * s, .04 * s); x.fill();
  x.fillStyle = ink(.12); x.fillRect(.24 * s, .46 * s, W - .48 * s, 2);
  for (let i = 0; i < 2; i++) { x.strokeStyle = ink(.45); x.lineWidth = 3; rr(x, .24 * s, (.62 + i * .36) * s, W - .48 * s, .26 * s, .02 * s); x.stroke(); x.fillStyle = ink(i ? .55 : .28); if (i) { for (let d = 0; d < 6; d++) { x.beginPath(); x.arc((.4 + d * .17) * s, (.75 + .36) * s, .028 * s, 0, PI * 2); x.fill(); } } else rr(x, .36 * s, .72 * s, .9 * s, .06 * s, .03 * s), x.fill(); }
  x.fillStyle = RED; rr(x, .24 * s, 1.42 * s, .86 * s, .26 * s, .03 * s); x.fill(); x.fillStyle = "rgba(255,255,255,.92)"; rr(x, .4 * s, 1.52 * s, .54 * s, .06 * s, .03 * s); x.fill();
  // Schloss: Körper
  const lx = W - .74 * s, ly = 1.56 * s;
  x.fillStyle = ink(.82); rr(x, lx - .27 * s, ly, .54 * s, .4 * s, .05 * s); x.fill();
  x.fillStyle = "#ffffff"; x.beginPath(); x.arc(lx, ly + .15 * s, .045 * s, 0, PI * 2); x.fill(); x.fillRect(lx - .016 * s, ly + .16 * s, .032 * s, .12 * s);
}
function shackleArt(x, W, H) {
  x.strokeStyle = ink(.82); x.lineWidth = W * .16; x.lineCap = "butt";
  const w = W * .5, r = w / 2;
  x.beginPath(); x.moveTo(W / 2 - r, H); x.lineTo(W / 2 - r, r + H * .1); x.arc(W / 2, r + H * .1, r, PI, 0); x.lineTo(W / 2 + r, H); x.stroke();
}

export default function (K) {
  const { F, R, V, COL, Q, sm, mech, win, clamp, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const METAL = c3("#dcd7cd"), FACE = c3("#f8f6f1"), DEV = c3("#e4e0d6"), DECK = c3("#f0ede6"), REDC = c3("#d40235"), TAG = c3("#f6f3ec"), PLATE = c3("#e9e4d8");
  const WALL = c3("#e1dccf"), PROD = c3("#efe9dc"), PRODT = c3("#f7f3ea"), BOARD = c3("#f8f6f1");

  // ---------- Lage ----------
  const M1X = -4.0, DW = 2.4, DH = 1.5, DD = 1.5, DEVX = [-.8, 2.6, 6.0];
  const SOCK = [.26, .74];                                   // erste Buchse (Szene 1), zweite Buchse (Szene 2) als Anteil der Breite
  const ZR = 12.5, M2X = 1.4, TX = 5.9, TZ = 9.9, TR = 2.3, LGX = 11.2;
  const sockX = (i, k) => DEVX[i] + DW * SOCK[k];
  K.sheet(-9.5, 17, -7, 19);

  // ---------- Zeitplan (b) ----------
  const TT = {
    m1: { line: [.01, .05], neck: [.085, .05], scr: [.125, .045], decal: .168, text: .178 },
    dev: { line: [.03, .09], fr: [.150, .170, .190], dk: [.185, .205, .225], dur: .05, durD: .04 },
    cab1: { crm: [.275, .31], bew: [.295, .34], erp1: [.31, .35], erpBack: [.352, .372], erp2: [.49, .53] },
    ad: { line: [.375, .04], fr: [.405, .05], dk: [.445, .045], decal: .452, text: .495 },
    h2: .56,
    m2: { line: [.575, .045], neck: [.615, .04], scr: [.65, .04], decal: .69, text: .70 },
    tt: { line: [.60, .06], walls: .655, plate: [.69, .045], prodLine: [.725, .035], prod: [.76, .77, .78, .795], spin: [.85, .10], text: .735 },
    lg: { line: [.78, .05], rise: [.86, .045], decal: .91, text: .915, shackle: [.965, .03] },
    cab2: { sf: [.955, .99], co: [.965, 1.0] },
    an: { line: [.93, .02], text: .975 }
  };


  // ---------- Bildschirm (Fuß-Hals-Schirm wie in der Eröffnung, nach hinten gefaltet) ----------
  function monitor(cx, zh, T, name, page, chinLines) {
    F.part(name, T.line[0], T.line[1]);
    const FW = 1.5, NW = .34, NH = .75, SW = N ? 3.0 : 3.4, DX = SW - .4, DY = DX / 1.6, CH = .55, SL = CH + DY + .1, PXU = 500;
    const neck = K.panel(R, [cx - FW / 2, zh], [cx + FW / 2, zh], [0, -1], T.neck[0], T.neck[1], Q, { over: .04 });
    K.P(neck, [[0, 0], [FW, 0], [FW / 2 + NW / 2, NH], [FW / 2 - NW / 2, NH]], METAL, [.5, .5, 0, .5]);
    const scr = K.panel(neck, neck.uv(FW / 2 - NW / 2, NH), neck.uv(FW / 2 + NW / 2, NH), [0, -1], T.scr[0], T.scr[1], -.1, { over: .25 });
    const uL = -(SW - NW) / 2, uR = NW + (SW - NW) / 2;
    K.P(scr, [[uL, 0], [0, 0], [NW, 0], [uR, 0], [uR, SL], [uL, SL]], FACE, [.5, 0, .5, .5, .5, .5]);
    const dec = K.decal(SW * PXU, SL * PXU, (x, W, H) => {
      const bz = .055 * PXU, dx = (SW - DX) / 2 * PXU, dy = (SL - CH - DY) * PXU;
      x.fillStyle = ink(.84); rr(x, dx - bz, dy - bz, DX * PXU + 2 * bz, DY * PXU + 2 * bz, bz * .5); x.fill();
      x.save(); x.translate(dx, dy); x.beginPath(); x.rect(0, 0, DX * PXU, DY * PXU); x.clip(); page(x, DX * PXU, DY * PXU); x.restore();
    }, SW, SL, T.decal, .03);
    K.onPanel(scr, dec, NW / 2, SL / 2, 1);
    const chin = K.print(chinLines, .135, T.text, { align: "center", lh: 1.18 });
    K.onPanel(scr, chin, NW / 2, (CH - .055) / 2 - .01, 1);
    return { neck, scr, chin, dec, cx, zh, top: NH + SL, SW };
  }

  // ---------- Gerät: Front steht auf, Deckel klappt nach hinten ----------
  function device(i, label, socks, tFr, tDk, tFront, textLines, e) {
    const x0 = DEVX[i];
    const fr = K.panel(R, [x0, 0], [x0 + DW, 0], [0, -1], tFr, TT.dev.dur, Q, { over: .05 });
    K.rect(fr, 0, 0, DW, DH, DEV);
    const dk = K.panel(fr, fr.uv(0, DH), fr.uv(DW, DH), [0, -1], tDk, TT.dev.durD, -Q, { over: .05 });
    K.rect(dk, 0, 0, DW, DD, DECK);
    const dec = K.decal(Math.round(DW * 300), Math.round(DH * 300), (x, W, H) => deviceFront(socks)(x, W, H, DW, DH), DW, DH, tFront);
    K.onPanel(fr, dec, DW / 2, DH / 2, 1);
    const front = K.print(textLines, e, tFront + .01, { align: "center", lh: 1.15 });
    K.onPanel(fr, front, DW / 2, DH * .56, 1);
    return { fr, dk, front, dec, x0 };
  }

  // ---------- Kabel mit Stecker, der vorn mitläuft ----------
  const PLUGL = .62;
  function cable(pts, stages, opt = {}) {
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5), total = curve.getLength(), TS = 700, RS = 10;
    const geo = new THREE.TubeGeometry(curve, TS, opt.r || .042, RS, false);
    const tube = K.add(new THREE.Mesh(geo, K.paperMaterial("#8e8981")));
    const plug = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(.46, .3, .4), K.paperMaterial("#4b4a4e")); body.position.set(0, 0, -.42);
    const neckp = new THREE.Mesh(new THREE.BoxGeometry(.26, .2, .1), K.paperMaterial("#6a6862")); neckp.position.set(0, 0, -.67);
    plug.add(body, neckp);
    for (const sx of [-.1, .1]) { const pr = new THREE.Mesh(new THREE.BoxGeometry(.07, .04, .22), K.paperMaterial("#c9c4b8")); pr.position.set(sx, 0, -.11); plug.add(pr); }
    for (const o of [body]) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .45, depthWrite: false })); o.add(e); }
    K.add(plug);
    const tmp = new THREE.Vector3(), tg = new THREE.Vector3();
    // k: Anteil der Kabellänge, bei dem der Anfang des Steckers (seine Rückseite) sitzt
    K.anim(b => {
      let k = 0;
      for (const s of stages) {
        if (b < s.b0) continue;
        const x = clamp((b - s.b0) / (s.b1 - s.b0), 0, 1);
        k = s.k0 + (s.k1 - s.k0) * (s.lin ? sm(x) : mech(x, s.over === undefined ? .02 : s.over));
      }
      k = clamp(k, 0, 1);
      tube.visible = k > .004; plug.visible = k > .004;
      geo.setDrawRange(0, Math.floor(k * TS) * RS * 6);
      curve.getPointAt(k, tmp); curve.getTangentAt(k, tg);
      plug.position.copy(tmp).addScaledVector(tg, PLUGL);
      plug.lookAt(plug.position.x + tg.x, plug.position.y + tg.y, plug.position.z + tg.z);
    });
    return { curve, total, plug, tube };
  }

  // ===================================================================================================
  // SZENE 1
  // ===================================================================================================
  // Überschrift steht sofort (Zeitlauf wie der Name der Eröffnung)
  const eH = N ? .5 : .62, H1 = K.word(["Schnittstellen und", "eigene Werkzeuge"], eH, N ? -4.6 : -5.4, 6.6, .15, .85, { font: "serif", foot: 1, imprint: { ...IMPRINT, close: .25, closeDur: .7 } });

  // Bildschirm mit Website
  const m1 = monitor(M1X, 0, TT.m1, "m1", pageSite, ["Ich verbinde Websites und Shops"]);

  // Drei Geräte: Texte der Fronten sind die Satzteile
  F.part("geraete", TT.dev.line[0], TT.dev.line[1]);
  const crm = device(0, "CRM", [{ u: SOCK[0], kind: "rect" }, { u: SOCK[1], kind: "rect" }], TT.dev.fr[0], TT.dev.dk[0], TT.dev.fr[0] + TT.dev.dur, ["mit CRM-,"], .14);
  const erp = device(1, "ERP", [{ u: SOCK[0], kind: "round" }, { u: SOCK[1], kind: "round" }], TT.dev.fr[1], TT.dev.dk[1], TT.dev.fr[1] + TT.dev.dur, ["ERP- und"], .14);
  const bew = device(2, "Bewerbermanagement", [{ u: SOCK[0], kind: "rect" }, { u: SOCK[1], kind: "rect" }], TT.dev.fr[2], TT.dev.dk[2], TT.dev.fr[2] + TT.dev.dur, ["Bewerbermanagementsystemen,"], .14);
  // Deckel: Rest des ersten Satzes (CRM, Bewerbermanagement) und der zweite Satz (ERP)
  const lidO = { lh: 1.2, align: "center" };
  const lidC = K.print(["bei WBG etwa", "mit Salesforce"], .17, TT.dev.dk[0] + TT.dev.durD + .03, lidO);
  const lidB = K.print(["und Concludis."], .17, TT.dev.dk[2] + TT.dev.durD + .06, lidO);
  const lidE = K.print(["Wo ein gekauftes", "Werkzeug nicht zu Ihren", "Abläufen passt,"], .165, .365, lidO);
  K.onPanel(crm.dk, lidC, DW / 2, DD / 2, 1);
  K.onPanel(bew.dk, lidB, DW / 2, DD / 2, 1);
  K.onPanel(erp.dk, lidE, DW / 2, DD / 2, 1);

  // Rotes Adapterstück: Front steht vor der Buchse auf (Vorderseite Unterseite), Deckel klappt zurück gegen das Gerät
  F.part("adapter", TT.ad.line[0], TT.ad.line[1]);
  const AW = 1.5, AH = .85, AD = .7, ax = sockX(1, 0);
  const adF = K.panel(R, [ax - AW / 2, AD], [ax + AW / 2, AD], [0, 1], TT.ad.fr[0], TT.ad.fr[1], Q, { over: .06 });
  K.rect(adF, 0, 0, AW, AH, REDC);
  const adD = K.panel(adF, adF.uv(0, AH), adF.uv(AW, AH), [0, 1], TT.ad.dk[0], TT.ad.dk[1], Q, { over: .06 });
  K.rect(adD, 0, 0, AW, AD, REDC);
  K.onPanel(adF, K.decal(Math.round(AW * 300), Math.round(AH * 300), (x, W, H) => adapterFront(x, W, H, AW, AH), AW, AH, TT.ad.decal), AW / 2, AH / 2, -1);
  const adT = K.print(["entwickle ich eines,", "das passt."], .15, TT.ad.text, { align: "center", lh: 1.2, col: "#ffffff" });
  K.onPanel(adD, adT, AW / 2, AD / 2, -1, [0, 1]);

  // Kabel: Anfang am Hals des Bildschirms, eigene Bahn je Gerät (das fernste außen), zuletzt gerade auf die Buchse
  const SY = .36, laneZ = [3.1, 4.1, 5.1];
  function path1(i, zEnd) {
    const xs = sockX(i, 0), z = laneZ[i], ox = M1X;
    return [V(ox + .2, .36, .05), V(ox + .3, .14, .35), V(ox + .62, .04, .85), V(ox + 1.4, .03, z * .6), V(ox + 2.6, .03, z), V(xs - 1.4, .03, z), V(xs - .5, .04, z), V(xs, .1, z - .55), V(xs, SY, z - 1.2), V(xs, SY, zEnd + 1.0), V(xs, SY, zEnd)];
  }
  const cC = cable(path1(0, PLUGL), [{ b0: TT.cab1.crm[0], b1: TT.cab1.crm[1], k0: 0, k1: 1, over: .03 }]);
  const cB = cable(path1(2, PLUGL), [{ b0: TT.cab1.bew[0], b1: TT.cab1.bew[1], k0: 0, k1: 1, over: .03 }]);
  // ERP: stößt an der runden Buchse an (k = 1), zieht sich zurück, steckt später in den Adapter (Rückseite des Steckers bei z = AD + PLUGL)
  const eP = path1(1, PLUGL);
  const cE = (() => {
    const c0 = new THREE.CatmullRomCurve3(eP, false, "centripetal", .5), L = c0.getLength(), zr = eP[eP.length - 1].z;
    const kBack = zb => 1 - (zb - zr) / L;
    return cable(eP, [
      { b0: TT.cab1.erp1[0], b1: TT.cab1.erp1[1], k0: 0, k1: 1, over: .0 },
      { b0: TT.cab1.erpBack[0], b1: TT.cab1.erpBack[1], k0: 1, k1: kBack(zr + 1.9), over: .0 },
      { b0: TT.cab1.erp2[0], b1: TT.cab1.erp2[1], k0: kBack(zr + 1.9), k1: kBack(AD + PLUGL), over: .03 }
    ]);
  })();

  // ===================================================================================================
  // SZENE 2
  // ===================================================================================================
  const eW = N ? .55 : .7, hx = N ? -4.4 : -4.2, hz = 15.6;
  const h2w = K.word(["WBG Pooling"], eW, hx, hz, TT.h2, .035, { font: "serif", foot: 1, clock: "b", on: TT.h2 - .004, imprint: { ...IMPRINT, close: 1 } });
  // Etikett (flach, kleiner Streifen auf dem Bogen); liefert den Knoten
  function etikett(name, t0, d, cx, z, w, h) {
    const x = cx - w / 2;
    F.part(name, t0, d);
    const nd = K.panel(R, [x, z], [x + w, z], [0, -1], t0 + d * .6, d * .5, 0, { nofold: true, over: 0 });
    K.rect(nd, 0, 0, w, h, TAG);
    return nd;
  }
  // Kicker und Angabe stehen als kleine Lettern vor der Überschrift (Kamera blickt von oben genug, um die Überschrift nicht zu verdecken)
  const kick = K.word(["Weitere Arbeit", "2023 bis 2025 · im Auftrag von RPLC"], N ? .15 : .13, hx + .05, hz + 1.8, TT.h2 + .01, .035, { foot: 1, clock: "b", on: TT.h2 + .006, noImprint: true, col: MUTED, lh: 1.5, track: .02 });

  // Bildschirm mit Portal
  const m2 = monitor(M2X, ZR, TT.m2, "m2", pagePortal, ["Ein Industrie- und Vertriebsportal"]);

  // Drehteller: Achteck, Wände stehen am Rand, Platte hebt sich, darauf faltet sich das Produkt und dreht sich beim Scrollen
  F.part("tt", TT.tt.line[0], TT.tt.line[1]);
  const oct = []; for (let k = 0; k < 8; k++) { const a = (22.5 + 45 * k) * PI / 180; oct.push([TX + TR * Math.sin(a), TZ + TR * Math.cos(a)]); }
  const TH = .5;
  oct.forEach((p, k) => {
    const q = oct[(k + 1) % 8], mx = (p[0] + q[0]) / 2 - TX, mz = (p[1] + q[1]) / 2 - TZ, ml = Math.hypot(mx, mz);
    const wl = K.panel(R, p, q, [mx / ml, mz / ml], TT.tt.walls + k * .003, .05, Q, { over: .03 });
    K.rect(wl, 0, 0, Math.hypot(q[0] - p[0], q[1] - p[1]), TH, WALL);
  });
  const plate = F.lift(R, TH, TT.tt.plate[0], TT.tt.plate[1], { over: .04 });
  F.poly(plate, oct, PLATE, .5);
  const spin = F.spin(plate, [TX, TZ], 2 * PI, TT.tt.spin[0], TT.tt.spin[1], { lin: true });
  F.part("produkt", TT.tt.prodLine[0], TT.tt.prodLine[1]);
  // Produkt: Keil mit schräger Oberseite, aus der Platte geschnitten
  const PWd = .9, PDp = .8, PHf = .45, PHb = .8;
  const prod = K.box(spin, TX - PWd / 2, TX + PWd / 2, TZ + PDp / 2, TZ - PDp / 2, PHf, TT.tt.prod[0], .05, { hf: PHf, hb: PHb, col: PROD, roof: PRODT, own: plate, mvOwn: true });
  // Markierung auf der Platte, dreht mit dem Produkt (Rundum-Skala mit Anschlagstrich)
  const scale = K.decal(900, 900, (x, W, H) => {
    x.translate(W / 2, H / 2); x.strokeStyle = ink(.45); x.lineWidth = 6;
    for (let k = 0; k < 36; k++) { const a = k * PI / 18, r0 = W * (k % 3 ? .445 : .43), r1 = W * .465; x.beginPath(); x.moveTo(r0 * Math.sin(a), r0 * Math.cos(a)); x.lineTo(r1 * Math.sin(a), r1 * Math.cos(a)); x.stroke(); }
    x.strokeStyle = RED; x.lineWidth = 12; x.beginPath(); x.moveTo(0, W * .405); x.lineTo(0, W * .47); x.stroke();
  }, 2 * (TR - .2), 2 * (TR - .2), TT.tt.plate[0] + TT.tt.plate[1], .02);
  K.onFlat(spin, scale, TX, TZ, .004);
  const ttext = K.print(["mit 360-Grad-Produktansichten,"], .15, TT.tt.text);
  const ttp = etikett("e1", TT.tt.prodLine[0] - .03, .04, TX, TZ + TR + 2.0, ttext.w + .3, .8);
  K.onPanel(ttp, ttext, ttext.w / 2 + .15, .4, 1);

  // Login-Tafel mit Schloss
  F.part("login", TT.lg.line[0], TT.lg.line[1]);
  const BW = 2.4, BH = 2.5;
  const board = K.panel(R, [LGX - BW / 2, ZR], [LGX + BW / 2, ZR], [0, -1], TT.lg.rise[0], TT.lg.rise[1], Q, { over: .05 });
  K.rect(board, 0, 0, BW, BH, BOARD);
  K.onPanel(board, K.decal(Math.round(BW * 300), Math.round(BH * 300), (x, W, H) => loginFace(x, W, H, BW, BH), BW, BH, TT.lg.decal), BW / 2, BH / 2, 1);
  const lgT = K.print(["einem geschützten Bereich", "für den Vertrieb"], .125, TT.lg.text, { align: "center", lh: 1.2 });
  K.onPanel(board, lgT, BW / 2, .3, 1);
  // Bügel: eigenes Teil, rastet von oben in den Schlosskörper (Körper in der Tafel bei u = BW - .74, v = BH - .4 - 1.56 ... Mitte des Körpers)
  const SHW = .5, SHH = .5, shPr = K.decal(240, 240, shackleArt, SHW, SHH, TT.lg.decal), shG = new THREE.Group();
  shG.add(shPr.mesh); K.add(shG);
  const lockU = BW - .74, lockTop = BH - 1.56 + 0;       // Oberkante des Körpers in v (die Zeichnung zählt von oben)
  F.attach(board, shG, board.uv(lockU, lockTop + SHH / 2 - .03), board.n, 1, .004);
  const shOpen = .3;
  K.anim(b => { shPr.mesh.position.y = shOpen * (1 - mech(win(b, TT.lg.shackle[0], TT.lg.shackle[1]), .12)); });

  // Etikett für die Anbindungen
  const anP = K.print(["und Anbindungen an Salesforce und Concludis."], .15, TT.an.text);
  const anT = etikett("e2", TT.an.line[0], TT.an.line[1], 6.45, 6.7, anP.w + .3, .9);
  K.onPanel(anT, anP, anP.w / 2 + .15, .45, 1);

  // Kabel Szene 2: vom Hals des Portal-Bildschirms zur zweiten Buchse von CRM (Salesforce) und Bewerbermanagement (Concludis)
  const ox = M2X, oz = ZR;
  const startP = [V(ox + .2, .36, oz + .05), V(ox + .5, .12, oz + .5), V(ox + 1.05, .03, oz + .2), V(ox + 1.05, .03, oz - .6)];
  const pSF = startP.concat([V(2.2, .06, 9.4), V(1.5, .2, 7.4), V(1.1, SY, 5.8), V(sockX(0, 1), SY, 4.4), V(sockX(0, 1), SY, PLUGL + 1.0), V(sockX(0, 1), SY, PLUGL)]);
  const pCO = startP.concat([V(2.6, .06, 9.6), V(3.0, .2, 7.6), V(3.4, SY, 6.0), V(4.4, SY, 5.5), V(sockX(2, 1) - .5, SY, 5.5), V(sockX(2, 1), SY, 4.7), V(sockX(2, 1), SY, PLUGL + 1.0), V(sockX(2, 1), SY, PLUGL)]);
  cable(pSF, [{ b0: TT.cab2.sf[0], b1: TT.cab2.sf[1], k0: 0, k1: 1, over: .03 }]);
  cable(pCO, [{ b0: TT.cab2.co[0], b1: TT.cab2.co[1], k0: 0, k1: 1, over: .03 }]);

  // ===================================================================================================
  // Kamera
  // ===================================================================================================
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const look = (tx, ty, tz, el, az, dist) => { const e = el * PI / 180, a = az * PI / 180; return V(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a)); };
  const S = {};
  // Handy übernimmt Lage und Einpassung des Desktops, solange nichts Eigenes (n…) angegeben ist; Schriftgröße dort immer 16 px
  const frontStop = (prints, o) => { const s = { prints, px: pxD, pitch: 14, yaw: 0, sx: 0, sy: 0, ...o }; s.nsx = o.nsx !== undefined ? o.nsx : s.sx; s.nsy = o.nsy !== undefined ? o.nsy : s.sy; s.fitN = o.fitN !== undefined ? o.fitN : s.fit; return s; };
  S.h1 = { prints: [H1], b: 0, px: 999, pxN: 999, fit: .72, fitN: .84, pitch: 12, sy: -.1, nsy: -.05, nsx: 0, sx: 0 };
  S.t1 = frontStop([m1.chin, m1.dec], { b: TT.m1.text + .02, pitch: 16, yaw: -10, sy: -.1, e0: .135, fit: .96 });
  S.fr = frontStop([crm.front, erp.front, bew.front, crm.dec, erp.dec, bew.dec], { b: .285, pitch: 16, yaw: 0, fit: .96, sy: .2, e0: .14 });
  S.lids = frontStop([lidC, lidB], { b: .335, pitch: 52, yaw: 0, fit: .96, px: 22 });
  S.erp = frontStop([lidE], { b: .385, pitch: 48, yaw: -8, px: 22 });
  S.ad = frontStop([adT], { b: .53, pitch: 46, yaw: 0, px: 22 });
  S.h2 = { prints: [h2w, kick], b: TT.h2 + .05, px: 999, pxN: 999, fit: .8, fitN: .9, pitch: 22, sy: -.05, nsy: -.05, sx: 0, nsx: 0 };
  S.t2 = frontStop([m2.chin, m2.dec], { b: TT.m2.text + .02, pitch: 16, yaw: -10, sy: -.1, e0: .135, fit: .96 });
  S.tt = frontStop([ttext], { b: .84, pitch: 48, yaw: 0, sy: -.45, px: 22, pxN: 14 });
  S.tt2 = frontStop([ttext], { b: .945, pitch: 48, yaw: 0, sy: -.45, px: 22, pxN: 14, noWarp: true });
  S.lg = frontStop([lgT], { b: .975, pitch: 16, yaw: 12, sy: -.2 });
  S.an = frontStop([anP], { b: 1, pitch: 46, yaw: 0, sy: -.5 });
  // Handy: jede Front und jeder Deckel für sich (drei Texte nebeneinander passen nicht in 390 px)
  S.fr1 = frontStop([crm.front, crm.dec], { b: .27, pitch: 16, e0: .14, fit: .96, sy: .2 });
  S.fr2 = frontStop([erp.front, erp.dec], { b: .278, pitch: 16, e0: .14, fit: .96, sy: .2 });
  S.fr3 = frontStop([bew.front, bew.dec], { b: .285, pitch: 16, e0: .14, fit: .96, sy: .2 });
  S.l1 = frontStop([lidC], { b: .31, pitch: 52, px: 22 });
  S.l2 = frontStop([lidB], { b: .335, pitch: 52, px: 22 });
  const stops = Object.values(S);
  const kFronts = N ? [{ w: 1.0, stop: S.fr1 }, { w: .55, stop: S.fr2 }, { w: .55, stop: S.fr3 }] : [{ w: 1.1, stop: S.fr }];
  const kLids = N ? [{ w: .9, stop: S.l1 }, { w: .6, stop: S.l2 }] : [{ w: .9, stop: S.lids }];

  return {
    names: S, fov: 32, fovN: 44, track: 1000,
    stops,
    keys: [
      { w: 0, stop: S.h1 },
      // Überblick über die Zeile: alle Bastellinien der Szene 1 stehen (el 40°, Abstand 21; Handy Abstand 46)
      { w: .9, b: .115, cam: look(1.3, .3, -.5, 40, -3, 21), tgt: V(1.3, .3, -.5), camN: look(1.3, .3, -.5, 40, -3, 46), tgtN: V(1.3, .3, -.5) },
      { w: 1.0, stop: S.t1 },
      ...kFronts,
      ...kLids,
      { w: .9, stop: S.erp },
      { w: 1.1, stop: S.ad },
      { w: 1.1, stop: S.h2 },
      { w: .9, b: .66, cam: look(7.0, 1.0, 10.2, 30, 0, 24), tgt: V(7.0, 1.0, 10.2) },
      { w: 1.0, stop: S.t2 },
      { w: 1.0, stop: S.tt },
      { w: .9, stop: S.tt2 },
      { w: .9, stop: S.lg },
      { w: 1.0, stop: S.an }
    ]
  };
}
