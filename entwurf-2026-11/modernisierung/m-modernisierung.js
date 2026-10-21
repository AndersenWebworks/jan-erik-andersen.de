// Szene Modernisierung (Fassung 2026-11, Bogen + Bastellinien): Röhrenmonitor wird zum Flachbildschirm.
// Text (wörtlich aus entwurf-2026-10-b-raumtext-2/index.html, #leistungen, Abschnitt Modernisierung):
//   Überschrift  Modernisierung  (Lettern stehen aus dem Bogen auf)
//   Satz 1       Viele WordPress-Seiten laufen seit Jahren auf veralteten Themes, Plugins und PHP-Versionen.   -> Kinn des Röhrenmonitors
//   Satz 2, Teil 1  Ich bringe sie technisch und gestalterisch auf den heutigen Stand                          -> Kinn des Flachbildschirms
//   Satz 2, Teil 2  und achte darauf, dass Inhalte und Adressen erhalten bleiben.                               -> auf der Adresszeile
// Ablauf (b): Überschrift steht auf, Bastellinien beider Geräte zeichnen sich, der Röhrenmonitor (Keilgehäuse, Frontwand = Bildschirm) klappt auf
// und zeigt eine alte Seite; der Flachbildschirm (Fuß, Hals, Bildschirm) klappt daneben hoch; die Blöcke der alten Seite und die Adresszeile
// heben sich ab, drehen sich um (alte Gestaltung -> neue Gestaltung), wandern hinüber und rasten in ihre Felder im neuen Layout ein;
// zuletzt legt sich der alte Monitor wieder flach in den Bogen (Schnitt- und Falzlinien kehren zurück).
// Technik: Gerät = Faltmodell aus falt.js (kit.box, kit.panel, kit.slab); Blöcke = freie Papierstücke, deren Anfangs- und Endlage
// aus Ankerobjekten an der alten Frontwand bzw. am neuen Bildschirm folgen (F.attach), dazwischen Bogenbahn, Wendung, kleines Überschwingen.
const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

export default function (K) {
  const { F, R, V, COL, Q, sm, mech, win, clamp, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const BODY = c3("#e2dac8"), FRONTC = c3("#d9d0bc"), FACE = c3("#f8f6f1"), METAL = c3("#dcd7cd");

  // ---------- Maße ----------
  // Röhrenmonitor (links): Keilgehäuse, vorn hoch, hinten niedrig. Frontwand = Bildschirm mit Kinn.
  // Breitbild: Röhrenmonitor links, Flachbildschirm rechts. Hochkant (Handy): hintereinander, Röhrenmonitor hinten, Flachbildschirm vorn,
  // so füllt die Szene das Hochkantbild (nebeneinander wäre sie dort nur ein schmaler Streifen).
  const CW = N ? 3.2 : 3.5, CHT = N ? 3.0 : 2.9, HB = 1.5, DEP = 2.4, ZF = N ? -6 : 1.2, CX = N ? 0 : -3.4, X0 = CX - CW / 2, X1 = CX + CW / 2;
  const ISX = .36, TOPI = .22, CHIN = N ? .9 : .76, DW = CW - 2 * ISX, DH = CHT - TOPI - CHIN;
  // Flachbildschirm (rechts): Fuß, Hals, Bildschirm mit Kinn, 16:10
  const XN = N ? 0 : 2.55, ZFB = N ? 2.6 : 1.0, NH = .8, NW = .34, FW = 1.5, DX = 3.7, DY = DX / 1.6, CH = N ? .8 : .62, BZ = .055, SW = DX + .2, SL = CH + DY + .08;
  const U = x => x + NW / 2;
  // ---------- Blöcke der Seite: Größe in der alten Fassung, im neuen Layout 12 % größer ----------
  const S = 1.12, M0 = .07, G0 = .05, CW0 = DW - 2 * M0;
  const BLK = {
    bar: { w: CW0, h: N ? .36 : .30 }, kopf: { w: CW0, h: .26 }, bild: { w: (CW0 - G0) * .505, h: .66 }, text: { w: (CW0 - G0) * .495, h: .66 }, karten: { w: CW0, h: .34 }
  };
  // alte Mitten (x von links, v von unten im Display), von oben nach unten gestapelt: Adresszeile, Kopf, Bild | Text, Karten
  let yTop = M0;
  const oldC = {};
  for (const [k, rowH] of [["bar", BLK.bar.h], ["kopf", BLK.kopf.h], ["hero", BLK.bild.h], ["karten", BLK.karten.h]]) {
    const v = DH - (yTop + rowH / 2);
    if (k === "hero") { oldC.bild = [M0 + BLK.bild.w / 2, v]; oldC.text = [M0 + BLK.bild.w + G0 + BLK.text.w / 2, v]; } else oldC[k] = [DW / 2, v];
    yTop += rowH + G0;
  }
  // neue Mitten: Adresszeile oben, Kopf, Text | Bild (vertauscht), Karten; gleichmäßige Zwischenräume
  const MX = (DX - CW0 * S) / 2, MT = .075;
  const hs = [BLK.bar.h, BLK.kopf.h, BLK.text.h, BLK.karten.h].map(h => h * S);
  const GN = (DY - 2 * MT - hs.reduce((a, b) => a + b, 0)) / 3;
  const newC = {};
  let yn = MT;
  [["bar", hs[0]], ["kopf", hs[1]], ["hero", hs[2]], ["karten", hs[3]]].forEach(([k, h]) => {
    const v = DY - (yn + h / 2);
    if (k === "hero") { newC.text = [MX + BLK.text.w * S / 2, v]; newC.bild = [DX - MX - BLK.bild.w * S / 2, v]; } else newC[k] = [DX / 2, v];
    yn += h + GN;
  });

  // ---------- Bogen ----------
  K.sheet(...(N ? [-7, 7, -13.4, 9.8] : [-9.6, 6.4, -6.4, 7.2]));

  // ---------- Überschrift: Lettern stehen aus dem Bogen auf ----------
  const HE = N ? .76 : .85, HEAD = ["Modernisierung"], hw = K.measure(HEAD, { font: "serif" }).tw * HE;
  const HZ = N ? 8.6 : 6.2, HCX = N ? 0 : -1.1;
  const head = K.word(HEAD, HE, HCX - hw / 2, HZ, 0, .07, { font: "serif", foot: 1, clock: "b", on: .004, over: .05,
    imprint: { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2 } });

  // Die Überschrift gehört zum Anfang und zum Schluss: sie klappt zurück, bevor die Kamera dicht an die Geräte geht (sonst ragt sie angeschnitten
  // ins untere Bildfeld), im Bogen bleibt ihr Abdruck, und steht am Ende wieder auf.
  head.node.dn = { t0: .12, d: .06 }; head.node.re = { t0: .96, d: .04 };
  head.sched = b => (b < .5 ? sm((b - .004) / .01) * (1 - sm((b - .16) / .02)) : sm((b - .988) / .008));

  // ---------- Röhrenmonitor: Frontwand und Wände klappen hoch, der Deckel folgt ----------
  F.part("crt", .02, .1);
  const crt = K.box(R, X0, X1, ZF, ZF - DEP, CHT, .13, .19, { col: BODY, fcol: FRONTC, hf: CHT, hb: HB, over: .05 });
  // alter Bildschirm: Glas (immer), Seite (schaltet sich ein, wenn das Gehäuse steht)
  const PX = 300;
  const glass = K.decal(Math.round(CW * PX), Math.round(CHT * PX), (x, W, H) => {
    const k = W / CW;
    // Wulst um das Glas, Glas mit Eckenrundung, Knöpfe im Kinn
    x.fillStyle = ink(.07); rr(x, (ISX - .11) * k, (TOPI - .11) * k, (DW + .22) * k, (DH + .22) * k, .2 * k); x.fill();
    x.strokeStyle = ink(.28); x.lineWidth = 3; rr(x, (ISX - .11) * k, (TOPI - .11) * k, (DW + .22) * k, (DH + .22) * k, .2 * k); x.stroke();
    x.fillStyle = "#d8d5ca"; rr(x, ISX * k, TOPI * k, DW * k, DH * k, .14 * k); x.fill();
    x.strokeStyle = ink(.6); x.lineWidth = 4; rr(x, ISX * k, TOPI * k, DW * k, DH * k, .14 * k); x.stroke();
    x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 5; x.lineCap = "round";
    x.beginPath(); x.arc((ISX + .3) * k, (TOPI + .3) * k, .18 * k, Math.PI * 1.05, Math.PI * 1.5); x.stroke();
    const cy = (CHT - CHIN / 2) * k;
    for (const cx of [CW - .55, CW - .3]) {
      x.strokeStyle = ink(.5); x.lineWidth = 3.5; x.beginPath(); x.arc(cx * k, cy, .1 * k, 0, Math.PI * 2); x.stroke();
      x.lineWidth = 3; x.beginPath(); x.moveTo(cx * k, cy - .02 * k); x.lineTo(cx * k + .035 * k, cy - .075 * k); x.stroke();
    }
    x.strokeStyle = ink(.26); x.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo((CW - .67 + i * .12) * k, cy + .19 * k); x.lineTo((CW - .67 + i * .12) * k, cy + .25 * k); x.stroke(); }
  }, CW, CHT, -1);
  K.onPanel(crt.fr, glass, CW / 2, CHT / 2, -1);
  const T_ON = .33;
  const oldPage = K.decal(Math.round(DW * PX), Math.round(DH * PX), (x, W, H) => {
    const k = W / DW;
    x.fillStyle = "#e6e2d6"; x.fillRect(0, 0, W, H);
    // Vertiefungen, in denen die Blöcke liegen
    for (const key of Object.keys(oldC)) {
      const [cx, cv] = oldC[key], { w, h } = BLK[key];
      x.fillStyle = ink(.07); x.fillRect((cx - w / 2) * k, (DH - cv - h / 2) * k, w * k, h * k);
      x.strokeStyle = ink(.22); x.lineWidth = 1.5; x.strokeRect((cx - w / 2) * k, (DH - cv - h / 2) * k, w * k, h * k);
    }
    // Reste einer alten Seite: Fußzeile mit kleinen Links, Zählerkästchen
    const fy = (DH - .035) * k, fh = .05 * k;
    x.fillStyle = ink(.26);
    [.35, .5, .3, .42, .26].forEach((w, i) => { rr(x, (M0 + i * .56) * k, fy - fh / 2, w * k * .9, fh, fh / 2); x.fill(); });
    x.strokeStyle = ink(.4); x.lineWidth = 2;
    for (let i = 0; i < 5; i++) x.strokeRect((DW - M0 - .56 + i * .11) * k, fy - .045 * k, .095 * k, .09 * k);
  }, DW, DH, T_ON, .025);
  K.onPanel(crt.fr, oldPage, ISX + DW / 2, CHIN + DH / 2, -1, null, .004);
  // Lüftungsschlitze auf dem Deckel (hinten, zwei Gruppen), damit die schräge Fläche als Gehäuse einer Röhre erkennbar bleibt
  const vent = K.decal(Math.round(CW * PX), Math.round(crt.topL * PX), (x, W) => {
    const k = W / CW; x.strokeStyle = ink(.3); x.lineWidth = 3.5; x.lineCap = "round";
    for (let r = 0; r < 7; r++) {
      const y = (crt.topL - .4 - r * .14) * k;
      for (const [a, b] of [[.45, 1.5], [CW - 1.5, CW - .45]]) { x.beginPath(); x.moveTo(a * k, y); x.lineTo(b * k, y); x.stroke(); }
    }
  }, CW, crt.topL, -1);
  K.onPanel(crt.top, vent, CW / 2, crt.topL / 2, -1);
  // Zurückklappen: Deckel zuerst, dann Seiten, Front, Rückwand
  const DN = .78;
  crt.top.dn = { t0: DN, d: .06 }; crt.lf.dn = { t0: DN + .04, d: .06 }; crt.rt.dn = { t0: DN + .045, d: .06 };
  crt.fr.dn = { t0: DN + .07, d: .07 }; crt.bk.dn = { t0: DN + .09, d: .06 };

  // Satz 1 im Kinn des Röhrenmonitors
  const T1lines = N ? ["Viele WordPress-Seiten", "laufen seit Jahren auf", "veralteten Themes, Plugins", "und PHP-Versionen."] : ["Viele WordPress-Seiten laufen", "seit Jahren auf veralteten Themes,", "Plugins und PHP-Versionen."];
  const T1 = K.print(T1lines, N ? .15 : .125, T_ON, { lh: 1.2 });
  K.onPanel(crt.fr, T1, .32 - T1.t.padX * T1.e + T1.w / 2, CHIN / 2, -1);

  // ---------- Flachbildschirm: Fuß, Hals, Bildschirm ----------
  F.part("neu", .05, .1);
  const foot = K.slab(R, XN - FW / 2, XN + FW / 2, ZFB + NH, ZFB, .04, .33, .04, { col: METAL, top: METAL, walls: "lrb" });
  const neck = K.panel(foot, [XN - NW / 2, ZFB], [XN + NW / 2, ZFB], [0, 1], .35, .07, Q, { over: .04 });
  K.P(neck, [[0, 0], [NW, 0], [NW, NH], [0, NH]], METAL, [.5, .5, 0, .5]);
  const scr = K.panel(neck, neck.uv(0, NH), neck.uv(NW, NH), [0, 1], .4, .06, .1, { own: R, over: .3 });
  const uL = -SW / 2 + NW / 2, uR = SW / 2 + NW / 2;
  K.P(scr, [[uL, 0], [0, 0], [NW, 0], [uR, 0], [uR, SL], [uL, SL]], FACE, [.5, 0, .5, .5, .5, .5]);
  const T_NEU = .46;
  const PXU = 360, dxp = (SW - DX) / 2, dyp = SL - CH - DY;
  const newScr = K.decal(Math.round(SW * PXU), Math.round(SL * PXU), (x, W, H) => {
    const bz = BZ * PXU, X = dxp * PXU, Y = dyp * PXU, w = DX * PXU, h = DY * PXU;
    x.fillStyle = ink(.84); rr(x, X - bz, Y - bz, w + 2 * bz, h + 2 * bz, bz * .5); x.fill();
    x.fillStyle = "#ffffff"; x.fillRect(X, Y, w, h);
    // leere Felder im neuen Layout: gestrichelte Kontur
    x.setLineDash([7, 6]); x.strokeStyle = ink(.22); x.lineWidth = 2;
    for (const key of Object.keys(newC)) {
      const [cx, cv] = newC[key], bw = BLK[key].w * S, bh = BLK[key].h * S;
      x.strokeRect(X + (cx - bw / 2) * PXU, Y + (DY - cv - bh / 2) * PXU, bw * PXU, bh * PXU);
    }
    x.setLineDash([]);
  }, SW, SL, T_NEU - .02, .03);
  K.onPanel(scr, newScr, U(0), SL / 2, -1);
  const T2lines = N ? ["Ich bringe sie technisch", "und gestalterisch auf", "den heutigen Stand"] : ["Ich bringe sie technisch und gestalterisch", "auf den heutigen Stand"];
  const T2 = K.print(T2lines, N ? .16 : .125, T_NEU, { align: "center", lh: 1.2 });
  K.onPanel(scr, T2, U(0), (CH - BZ) / 2 - .01, -1);

  // ---------- Blöcke: heben ab, drehen sich, wandern, rasten ein ----------
  const LIFT = .03, BPX = 300;
  const poseOf = (nd, u, v) => { const o = new THREE.Object3D(); F.attach(nd, o, nd.uv(u, v), nd.n, -1, LIFT); return o; };
  const ART = {};
  // Alte Gestaltung: Rahmen mit Fase, graue Flächen, dichtes Gedränge. Neue: weiß, Haarlinien, Luft.
  const bevel = (x, X, Y, w, h, t = 2) => {
    x.fillStyle = "rgba(255,255,255,.85)"; x.fillRect(X, Y, w, t); x.fillRect(X, Y, t, h);
    x.fillStyle = ink(.4); x.fillRect(X, Y + h - t, w, t); x.fillRect(X + w - t, Y, t, h);
  };
  const lines = (x, X, Y, w, n, gap, th, a, widths) => { for (let i = 0; i < n; i++) { x.fillStyle = ink(a); rr(x, X, Y + i * gap, w * (widths ? widths[i % widths.length] : 1), th, th / 2); x.fill(); } };
  ART.bar = {
    old(x, W, H) {
      x.fillStyle = "#d6d2c6"; x.fillRect(0, 0, W, H); bevel(x, 0, 0, W, H, 3);
      const b = H * .6, y = (H - b) / 2;
      for (let i = 0; i < 3; i++) { x.fillStyle = "#e4e0d5"; x.fillRect(H * .3 + i * (b + H * .12), y, b, b); bevel(x, H * .3 + i * (b + H * .12), y, b, b, 2); }
      const fx = H * .3 + 3 * (b + H * .12) + H * .1, fw = W - fx - H * 1.1;
      x.fillStyle = "#f2efe6"; x.fillRect(fx, y, fw, b); x.fillStyle = ink(.45); x.fillRect(fx, y, fw, 2); x.fillRect(fx, y, 2, b);
      lines(x, fx + H * .2, y + b * .4, fw * .22, 1, 0, b * .2, .5); lines(x, fx + H * .2 + fw * .26, y + b * .4, fw * .18, 1, 0, b * .2, .35);
      x.fillStyle = "#e4e0d5"; x.fillRect(W - H * .9, y, b, b); bevel(x, W - H * .9, y, b, b, 2);
    },
    neu(x, W, H) {
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
      x.strokeStyle = ink(.3); x.lineWidth = 2.5; rr(x, 3, 3, W - 6, H - 6, (H - 6) / 2); x.stroke();
      x.fillStyle = RED; x.beginPath(); x.arc(H * .52, H / 2, H * .15, 0, Math.PI * 2); x.fill();
      x.fillStyle = ink(.4); for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(W - H * .8 + i * H * .22, H / 2, H * .045, 0, Math.PI * 2); x.fill(); }
    }
  };
  ART.kopf = {
    old(x, W, H) {
      x.fillStyle = ink(.7); x.fillRect(0, 0, W, H); bevel(x, 0, 0, W, H, 3);
      x.fillStyle = "#e4e0d5"; x.fillRect(H * .15, H * .15, H * 2.1, H * .7); bevel(x, H * .15, H * .15, H * 2.1, H * .7, 2);
      for (let i = 0; i < 5; i++) { const bx = W - (5 - i) * H * 1.1 - H * .1; x.fillStyle = "#d6d2c6"; x.fillRect(bx, H * .22, H * 1.0, H * .56); bevel(x, bx, H * .22, H * 1.0, H * .56, 2); }
    },
    neu(x, W, H) {
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H); x.fillStyle = ink(.12); x.fillRect(0, H - 3, W, 3);
      x.fillStyle = ink(.84); rr(x, H * .1, H * .22, H * 1.8, H * .5, 4); x.fill();
      for (let i = 0; i < 4; i++) { x.fillStyle = ink(.4); rr(x, W - (4 - i) * H * 1.7 - H * .2, H * .38, H * 1.2, H * .18, H * .09); x.fill(); }
    }
  };
  ART.text = {
    old(x, W, H) {
      x.fillStyle = "#e9e5da"; x.fillRect(0, 0, W, H); x.strokeStyle = ink(.5); x.lineWidth = 3; x.strokeRect(3, 3, W - 6, H - 6); x.lineWidth = 1.5; x.strokeRect(9, 9, W - 18, H - 18);
      x.fillStyle = ink(.78); x.fillRect(H * .1, H * .12, W * .7, H * .1);
      lines(x, H * .1, H * .32, W - H * .2, 7, H * .082, H * .045, .35, [1, .94, 1, .88, .97, 1, .55]);
    },
    neu(x, W, H) {
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
      x.fillStyle = ink(.84); rr(x, 0, H * .04, W * .88, H * .15, H * .03); x.fill(); rr(x, 0, H * .24, W * .6, H * .15, H * .03); x.fill();
      lines(x, 0, H * .5, W * .92, 3, H * .075, H * .04, .28, [1, .94, .66]);
      x.fillStyle = RED; rr(x, 0, H * .76, W * .34, H * .18, H * .03); x.fill();
      x.fillStyle = "rgba(255,255,255,.92)"; rr(x, W * .06, H * .81, W * .22, H * .08, H * .04); x.fill();
    }
  };
  ART.bild = {
    old(x, W, H) {
      x.fillStyle = "#e9e5da"; x.fillRect(0, 0, W, H); x.strokeStyle = ink(.5); x.lineWidth = 3; x.strokeRect(3, 3, W - 6, H - 6); x.lineWidth = 1.5; x.strokeRect(9, 9, W - 18, H - 18);
      x.fillStyle = "#cfcbbf"; x.fillRect(H * .1, H * .1, W - H * .2, H * .68);
      x.strokeStyle = ink(.4); x.lineWidth = 2.5; x.strokeRect(H * .1, H * .1, W - H * .2, H * .68);
      x.beginPath(); x.moveTo(H * .1, H * .1); x.lineTo(W - H * .1, H * .78); x.moveTo(W - H * .1, H * .1); x.lineTo(H * .1, H * .78); x.stroke();
      lines(x, H * .1, H * .86, W * .5, 1, 0, H * .045, .45);
    },
    neu(x, W, H) {
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
      x.fillStyle = ink(.07); rr(x, 0, 0, W, H, H * .03); x.fill();
      x.strokeStyle = ink(.3); x.lineWidth = 3; x.lineJoin = "round"; x.beginPath();
      x.moveTo(0, H); x.lineTo(W * .32, H * .45); x.lineTo(W * .55, H * .72); x.lineTo(W * .7, H * .58); x.lineTo(W, H); x.stroke();
      x.beginPath(); x.arc(W * .74, H * .28, H * .09, 0, Math.PI * 2); x.stroke();
    }
  };
  ART.karten = {
    old(x, W, H) {
      x.fillStyle = "#e9e5da"; x.fillRect(0, 0, W, H);
      const cw = (W - H * .2) / 3;
      for (let i = 0; i < 3; i++) {
        const X = H * .06 + i * (cw + H * .04); x.fillStyle = "#e2ded2"; x.fillRect(X, H * .08, cw, H * .84); x.strokeStyle = ink(.5); x.lineWidth = 2.5; x.strokeRect(X + 1, H * .08, cw - 2, H * .84);
        x.fillStyle = ink(.7); x.fillRect(X + cw * .08, H * .2, cw * .6, H * .14); lines(x, X + cw * .08, H * .46, cw * .84, 3, H * .13, H * .06, .32, [1, .9, .7]);
      }
    },
    neu(x, W, H) {
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
      const cw = (W - H * .6) / 3;
      for (let i = 0; i < 3; i++) {
        const X = i * (cw + H * .3); x.strokeStyle = ink(.16); x.lineWidth = 2.5; rr(x, X + 1, 1, cw - 2, H - 2, H * .06); x.stroke();
        x.fillStyle = ink(.7); rr(x, X + cw * .08, H * .16, cw * .5, H * .12, H * .06); x.fill(); lines(x, X + cw * .08, H * .42, cw * .84, 3, H * .17, H * .075, .26, [1, .9, .68]);
      }
    }
  };
  const blocks = [];
  const mkBlock = (key, t0, d, hover, rise) => {
    // Handy: der Röhrenmonitor steht hinter dem Flachbildschirm; die Blöcke schwenken seitlich aus, damit sie nie vor dem Satz im Kinn des Röhrenmonitors fliegen
    const side = N ? 2.2 : 0;
    const { w, h } = BLK[key];
    const A = K.decal(Math.round(w * BPX), Math.round(h * BPX), ART[key].old, w, h, -1);
    const B = K.decal(Math.round(w * BPX), Math.round(h * BPX), ART[key].neu, w, h, -1);
    const g = new THREE.Group();
    A.mesh.position.z = .006; B.mesh.rotation.y = Math.PI; B.mesh.position.z = -.006;
    g.add(A.mesh, B.mesh);
    const hw = w / 2, hh = h / 2, rim = new Float32Array([-hw, -hh, 0, hw, -hh, 0, hw, hh, 0, -hw, hh, 0]);
    for (const z of [.0075, -.0075]) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(rim, 3));
      g.add(new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: 0x303033, transparent: true, opacity: .42, depthWrite: false })));
      g.children[g.children.length - 1].position.z = z;
    }
    K.add(g);
    const poseA = poseOf(crt.fr, ISX + oldC[key][0], CHIN + oldC[key][1]), poseB = poseOf(scr, U(-DX / 2 + newC[key][0]), CH + newC[key][1]);
    const pa = new THREE.Vector3(), pb = new THREE.Vector3(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), s1 = new THREE.Vector3(), s2 = new THREE.Vector3();
    const flipY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), q = new THREE.Quaternion(), p = new THREE.Vector3(), nA = new THREE.Vector3();
    const blk = { key, g, poseA, poseB, t0, d, A, B };
    blocks.push(blk);
    K.anim(b => {
      const on = sm((b - (T_ON + .012)) / .02);
      g.visible = on > 0.001;
      if (!g.visible) return;
      A.mat.opacity = B.mat.opacity = on;
      for (const c of g.children) if (c.material && c.isLine) c.material.opacity = .42 * on;
      poseA.matrix.decompose(pa, qa, s1); poseB.matrix.decompose(pb, qb, s2);
      const k = win(b, t0, d), e = mech(k, .035), ka = clamp(k / .8, 0, 1);
      // Wendung (Mitte der Bahn), Maßstab wächst mit
      const kr = sm(clamp((k - .08) / .62, 0, 1));
      q.copy(qa).slerp(qb.clone().multiply(flipY), kr);
      p.lerpVectors(pa, pb, e);
      // Bogenbahn: weg vom Bildschirm (Blickrichtung des Bildschirms) und etwas nach oben, endet vor dem Überschwingen
      nA.set(0, 0, 1).applyQuaternion(qa);
      const arc = Math.sin(Math.PI * ka);
      p.addScaledVector(nA, hover * arc).y += rise * arc; p.x += side * arc;
      g.position.copy(p); g.quaternion.copy(q);
      const sc = 1 + (S - 1) * kr; g.scale.set(sc, sc, 1);
    });
    return blk;
  };
  // Reihenfolge: Kopf, Bild, Text, Karten, zuletzt die Adresszeile (der Satz endet mit den Adressen)
  const FL = { kopf: .52, bild: .55, text: .575, karten: .6, bar: .635 }, FD = .09;
  mkBlock("kopf", FL.kopf, FD, .75, 1.3);
  mkBlock("bild", FL.bild, FD, .8, 1.8);
  mkBlock("text", FL.text, FD, .75, 1.1);
  mkBlock("karten", FL.karten, FD, .75, 1.6);
  mkBlock("bar", FL.bar, FD, .75, 1.4);
  const T_BAR = FL.bar + FD + .005;

  // Satz 2, Teil 2 auf der Adresszeile (liegt auf dem neuen Platz des Blocks, über dem Papierstück)
  const bw = BLK.bar.w * S, bh = BLK.bar.h * S;
  const T3lines = ["und achte darauf, dass Inhalte", "und Adressen erhalten bleiben."];
  const T3 = K.print(T3lines, N ? .14 : .105, T_BAR, { align: "center", lh: 1.15 });
  K.onPanel(scr, T3, U(-DX / 2 + newC.bar[0]), CH + newC.bar[1], -1, null, .06);

  // ---------- Konstruktionsphase: Gerüst im Raum, Bleistiftspur auf den Flächen ----------
  F.geruest({ tags: ["crt", "neu"], t0: .09, t1: .27, du: .03, a: .5, bAt: .62 });
  F.spur({ tags: ["crt", "neu"], quiet: [crt.fr, scr], a: .3 });

  // ---------- Lesestellen und Kamera ----------
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  const ST = {
    t1: { prints: [T1], px: pxD, fb: .5, pitch: 14, yaw: 16, sx: -.05, sy: -.1, npitch: 14, nyaw: 4, nsx: -.16, nsy: -.05 },
    t2: { prints: [T2], px: pxD, fb: .5, pitch: 14, yaw: -10, sx: (W, H) => -clamp((W / H - 1.4) * 1.15, 0, .46), sy: -.1, npitch: 14, nyaw: -10, nsx: 0, nsy: -.1 },
    t3: { prints: [T3], px: pxD, fb: .8, pitch: 14, yaw: -8, sx: 0, sy: .6, npitch: 14, nyaw: -8, nsx: 0, nsy: .3 }
  };
  return {
    info: { head: { cx: HCX, z: HZ, w: hw, h: .8 } },
    fov: 32, fovN: 44,
    track: 540,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .34 },
    stops: Object.values(ST),
    keys: [
      // Überblick über den ganzen Bogen (Überschrift, beide Geräte als Bastellinien): eingepasst mit tmp-Rechnung (fit.mjs),
      // Breitbild 1280 x 900 Rand 60 px, Hochkant 390 x 844 Rand 14 px
      { w: 0, b: 0, cam: V(-1.26, 11.5, 15.52), tgt: V(-1.26, -.35, 1.41), camN: V(0, 14.35, 17.52), tgtN: V(0, -1.15, .31) },
      { w: .55, b: .12, cam: V(-1.25, 11.01, 15.95), tgt: V(-1.25, -.36, 1.4), camN: V(0, 13.54, 17.86), tgtN: V(0, -1.21, .28) },
      // Röhrenmonitor klappt auf
      { w: .55, b: .27, cam: V(.43, 7.95, 14.11), tgt: V(-.03, .4, 1.04), camN: V(.31, 11.12, 15.3), tgtN: V(-.24, -.4, -.55) },
      { w: .9, stop: ST.t1 },
      // Flachbildschirm klappt hoch
      { w: .7, b: .42, cam: V(.18, 6.59, 13.39), tgt: V(-.27, .25, .39), camN: V(.32, 11.02, 11.24), tgtN: V(-.12, .52, -1.26) },
      { w: .9, stop: ST.t2 },
      // Blöcke wandern
      { w: 1.1, b: .6, cam: V(-.5, 7.17, 14.55), tgt: V(-.5, .29, .45), camN: V(0, 10.94, 11.16), tgtN: V(0, .52, -1.26) },
      { w: .9, b: .72, cam: V(-.5, 7.17, 14.55), tgt: V(-.5, .29, .45), camN: V(0, 10.94, 11.16), tgtN: V(0, .52, -1.26) },
      { w: .9, stop: ST.t3 },
      // alter Monitor legt sich flach, Schlussbild
      { w: 1, b: .86, cam: V(-1.49, 9.4, 16.2), tgt: V(-1.49, .67, 1.08), camN: V(-.11, 13.79, 15.14), tgtN: V(-.11, 1.33, -2.02) },
      { w: .8, b: 1, cam: V(-1.41, 10.96, 15.44), tgt: V(-1.41, -.17, 1.19), camN: V(0, 14.35, 17.52), tgtN: V(0, -1.16, .3) }
    ]
  };
}
