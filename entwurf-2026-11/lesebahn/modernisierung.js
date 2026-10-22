// Szene Modernisierung als Lesebahn (Fassung 2026-11, Bogen + Bastellinien). Drehbuch: DREHBUCH-LESEBAHN.md, Abschnitt 7.
// Trägerform: Schieber mit Lasche (schieberform.js). Auf dem roten Faden stehen drei Taschen, aus jeder gleitet ein Papierstreifen mit Lasche,
// der einen ganzen Satz trägt (die Satzkette „Ich bringe sie …“ über mehrere Träger ist aufgelöst); der Streifen altert von Satz zu Satz zu neu:
//   M1 „Viele WordPress-Seiten laufen seit Jahren auf veralteten Themes, Plugins und PHP-Versionen.“ (Kernaussage, größer)  -> Szenerie: der alte Röhrenmonitor mit der alten Seite
//   M2 „Ich bringe sie technisch und gestalterisch auf den heutigen Stand.“                                                 -> Szenerie: die Blöcke wandern hinüber in den Flachbildschirm
//   M3 „Dabei achte ich darauf, dass Inhalte und Adressen erhalten bleiben.“                                                 -> Szenerie: die Adresszeile bleibt, der alte Monitor legt sich flach
// Die Geräte stehen wie zuvor als Szenerie hinter der Bahn, jetzt ohne Text, und zeigen im Moment der Lesestelle, was der Satz sagt:
// Röhrenmonitor (Keilgehäuse, Frontwand = Bildschirm) klappt auf und zeigt eine alte Seite; der Flachbildschirm (Fuß, Hals, Bildschirm) klappt daneben hoch;
// die Blöcke der alten Seite und die Adresszeile heben sich ab, drehen sich um (alte Gestaltung -> neue Gestaltung), wandern hinüber und rasten ein;
// zuletzt legt sich der alte Monitor wieder flach in den Bogen (Schnitt- und Falzlinien kehren zurück).
// Technik: Gerät = Faltmodell aus falt.js (kit.box, kit.panel, kit.slab); Blöcke = freie Papierstücke, deren Anfangs- und Endlage aus Ankerobjekten an der
// alten Frontwand bzw. am neuen Bildschirm folgen (F.attach), dazwischen Bogenbahn, Wendung, kleines Überschwingen.
import { schieber } from "./schieberform.js";

const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

export default function (K) {
  const { F, R, V, COL, Q, sm, mech, win, clamp, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const BODY = c3("#e2dac8"), FRONTC = c3("#d9d0bc"), FACE = c3("#f8f6f1"), METAL = c3("#dcd7cd");

  // ---------- Lage der Bahn: eine Linie vor der Szenerie (vorderste Kante: Fuß des Flachbildschirms bei z 1,8), Überschrift links davon ----------
  const PITCH = 26, LEAN = PITCH * Math.PI / 180, ZB = 3.7, XL1 = -3.4, eH = N ? .5 : .62;
  F.part("titel", 0, .01);
  const HEAD = ["Modernisierung"], titleW = K.measure(HEAD, { font: "serif" }).tw * eH, titleX = XL1 - .7 - titleW;
  const head = K.word(HEAD, eH, titleX, ZB, .15, .85,
    { font: "serif", foot: 1, imprint: { fill: "#f3f0e8", col: "#d2cbbe", line: 2.2, close: .25, closeDur: .7 }, ang: Q - LEAN });
  // ---------- Drei Schieber, je ein ganzer Satz (Zeiten b: Schnittlinien, Aufklappen, Text; Lesestelle b) ----------
  // Lesestellen: M1, wenn der Röhrenmonitor mit der alten Seite steht (.33); M2 mitten im Wandern der Blöcke (.52 … .725); M3, wenn alles eingerastet ist
  const SATZ1 = "Viele WordPress-Seiten laufen seit Jahren auf veralteten Themes, Plugins und PHP-Versionen.";
  const SATZ2 = "Ich bringe sie technisch und gestalterisch auf den heutigen Stand.";
  const SATZ3 = "Dabei achte ich darauf, dass Inhalte und Adressen erhalten bleiben.";
  const BA = K.bahn({
    prefix: "m", form: schieber([
      { col: c3("#e6dfd1"), frame: .5, double: true, fase: true },     // alt: gealtertes Papier, doppelter Rahmen, Fase
      { col: c3("#f1ece1"), frame: .3 },                                // dazwischen
      { col: c3("#fbfaf7"), frame: 0 }                                  // neu: klares Papier, kein Rahmen
    ]), x0: XL1, z: ZB, gap: .5, pitch: PITCH, sy: -.34, nsy: -.3,
    head: { prints: [head], e0: eH, b: 0, fit: .72, fitN: .72, x: titleX, w: titleW },
    sentences: [
      { text: SATZ1, t: [.17, .21, .315], b: .385, big: 1.2, w: 4.2 },
      { text: SATZ2, t: [.44, .48, .585], b: .63 },
      { text: SATZ3, t: [.69, .73, .835], b: .87, w: 3.2 }
    ]
  });
  const bc = BA.items.map(it => it.x0 + it.w / 2);
  // ---------- Maße ----------
  // Röhrenmonitor (links): Keilgehäuse, vorn hoch, hinten niedrig. Frontwand = Bildschirm mit Kinn. Beide Geräte stehen nebeneinander hinter der Bahn:
  // der Röhrenmonitor über Satz 1, der Flachbildschirm zwischen Satz 2 und 3 (Handy: weiter rechts, damit er bei Satz 2 ganz und bei Satz 3 zum Teil im Bild steht).
  const CW = 3.5, CHT = 2.9, HB = 1.5, DEP = 2.4, ZF = 1.2, CX = N ? bc[0] : bc[0] - .4, X0 = CX - CW / 2, X1 = CX + CW / 2;
  const ISX = .36, TOPI = .22, CHIN = .76, DW = CW - 2 * ISX, DH = CHT - TOPI - CHIN;
  // Flachbildschirm: Fuß, Hals, Bildschirm mit Kinn, 16:10
  const XN = N ? bc[1] + 1.0 : bc[1] + .5, ZFB = 1.0, NH = .8, NW = .34, FW = 1.5, DX = 3.7, DY = DX / 1.6, CH = .62, BZ = .055, SW = DX + .2, SL = CH + DY + .08;
  const U = x => x + NW / 2;
  // ---------- Blöcke der Seite: Größe in der alten Fassung, im neuen Layout 12 % größer ----------
  const S = 1.12, M0 = .07, G0 = .05, CW0 = DW - 2 * M0;
  const BLK = {
    bar: { w: CW0, h: .30 }, kopf: { w: CW0, h: .26 }, bild: { w: (CW0 - G0) * .505, h: .66 }, text: { w: (CW0 - G0) * .495, h: .66 }, karten: { w: CW0, h: .34 }
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
  K.sheet(titleX - 1.2, BA.endX + 4.2, -3.4, ZB + .46 + 1.3);

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
    const side = 0;
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

  // ---------- Konstruktionsphase: Gerüst im Raum, Bleistiftspur auf den Flächen ----------
  F.geruest({ tags: ["crt", "neu"], t0: .09, t1: .27, du: .03, a: .5, bAt: .62 });
  F.spur({ tags: ["crt", "neu"], quiet: [crt.fr, scr], a: .3 });

  // ---------- Kamera und Faden: die Bahn (Überschrift, drei Taschen, Auslauf nach rechts); Gier 0, gleiche Neigung ----------
  const BEND = .98, SHX0 = titleX - 1.2, SHZ1 = ZB + .46 + 1.3;
  return {
    fov: 32, fovN: 44, smooth: true,
    track: 400,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .29 },
    stops: BA.stops, names: BA.names,
    keys: BA.keys({ b: BEND, shift: 1.8, w: 1 }),
    thread: BA.thread({ hold: .04, depart: .10, bEnd: BEND, startX: titleX - .1 }),
    // Ein- und Ausgang des Fadens für folge.js: Vorderkante des Bogens links, Hinterkante rechts hinter dem Ende der Bahn
    fadenIO: BA.faden({ inn: [SHX0 + .4, SHZ1 - .2], out: [BA.endX + 3.0, -3.2] })
  };
}
