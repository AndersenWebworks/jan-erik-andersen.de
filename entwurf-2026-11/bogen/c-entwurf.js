// Variante C – Vom Entwurf zur Technik, aus dem Bogen. Modelle und Satzteile aus entwurf-2026-11/c-entwurf.js:
// ein Schreibtisch, auf dem eine Website-Skizze in Haarlinien liegt; das Blatt klappt hoch, ein Standfuß hebt es, es wird zum Bildschirm.
// Ein Kabel läuft über die Tischplatte zum Rechner am Boden (anbinden), dort tickt der Statuspunkt (betreuen).
// Satz zwei steht auf der Vorderkante der Tischplatte.
// Pop-up-Logik: Die Tischplatte hebt sich parallel aus dem Bogen, Beine und Zarge schwenken von ihren Kanten nach unten;
// Blatt und Standfuß sind aus der Tischplatte geschnitten. Im Bogen bleibt der Abdruck.
import { website, rack } from "./zeichnungen.js";

const ink = a => `rgba(48,48,51,${a})`;
// Website-Skizze in Haarlinien, Koordinaten wie im Druckbild website (Breite 1000, Höhe 625)
function sketchSegs(P) {
  const segs = [];
  const line = (x0, y0, x1, y1) => segs.push([P(x0, y0), P(x1, y1)]);
  const rect = (x, y, w, h) => { line(x, y, x + w, y); line(x + w, y, x + w, y + h); line(x + w, y + h, x, y + h); line(x, y + h, x, y); };
  rect(60, 52, 130, 18);
  for (let i = 0; i < 4; i++) line(560 + i * 100, 61, 630 + i * 100, 61);
  line(0, 112, 1000, 112);
  rect(60, 170, 470, 46); rect(60, 236, 330, 46);
  for (let i = 0; i < 3; i++) line(60, 328 + i * 30, 500 - i * 60, 328 + i * 30);
  rect(60, 430, 170, 50);
  rect(580, 160, 360, 320); line(580, 160, 940, 480); line(940, 160, 580, 480);
  for (let c = 0; c < 3; c++) { const X = 60 + c * 300; line(X, 544, X + 160, 544); line(X, 570, X + 250, 570); line(X, 588, X + 210, 588); }
  return segs;
}

export default function (K) {
  const { F, R, V, COL, Q, sm, narrow: N } = K;
  const { OLD, PAPER } = COL;
  const leftU = (pr, u0) => u0 + pr.w / 2 - pr.t.padX * pr.e;

  // ---------- Bogen ----------
  K.sheet(-5.2, 9.8, -5.3, N ? 7.9 : 6.6);
  K.sheet(-4.6, 4.6, -16.4, -11.2, undefined, .86);

  // ---------- Name: Lettern stehen aus dem Bogen auf ----------
  F.part("name", 0, .01);
  const e = .95;
  const w1 = K.measure(["Jan-Erik"], { font: "serif" }).tw * e, w2 = K.measure(["Andersen"], { font: "serif", italic: 1 }).tw * e;
  let n1, n2, kick;
  if (!N) {
    const gap = .36, x0 = -(w1 + gap + w2) / 2;
    n1 = K.word(["Jan-Erik"], e, x0, 5.1, .15, .85, { font: "serif" });
    n2 = K.word(["Andersen"], e, x0 + w1 + gap, 5.1, .38, .85, { font: "serif", italic: 1, col: "#d40235" });
    const kt = ["Webentwicklung · Raum Plau am See · remote"];
    kick = K.word(kt, .17, -K.measure(kt, { track: .03 }).tw * .17 / 2, 5.95, .65, .7, { track: .03, col: "#66666a", noImprint: 1 });
  } else {
    n1 = K.word(["Jan-Erik"], e, -.2 - w1 / 2, 5.0, .15, .85, { font: "serif" });
    n2 = K.word(["Andersen"], e, .2 - w2 / 2, 6.35, .38, .85, { font: "serif", italic: 1, col: "#d40235" });
    const kt = ["Webentwicklung", "Raum Plau am See · remote"];
    kick = K.word(kt, .2, -K.measure(kt, { track: .03 }).tw * .2 / 2, 7.35, .65, .7, { track: .03, col: "#66666a", align: "center", noImprint: 1 });
  }

  // ---------- Schreibtisch: Platte hebt sich, Beine und Zarge schwenken nach unten ----------
  F.part("tisch", .015, .08);
  const X0 = -3.5, X1 = 3.5, ZF = 1.6, ZB = -1.8, HT = 2.4, LW = .22, AP = .3;
  const top = F.lift(R, HT, .2, .07, { over: .03 });
  F.poly(top, [[X0, ZF], [X0 + LW, ZF], [X1 - LW, ZF], [X1, ZF], [X1, ZB], [X1 - LW, ZB], [X0 + LW, ZB], [X0, ZB]], OLD, .5);
  const down = { own: R, over: .05 };
  for (const [xa, xb] of [[X0, X0 + LW], [X1 - LW, X1]]) {
    K.rect(K.panel(top, [xa, ZF], [xb, ZF], [0, 1], .25, .07, -Q, down), 0, 0, LW, HT, OLD);
    K.rect(K.panel(top, [xa, ZB], [xb, ZB], [0, -1], .255, .07, -Q, down), 0, 0, LW, HT, OLD);
  }
  const apron = K.panel(top, [X0 + LW, ZF], [X1 - LW, ZF], [0, 1], .265, .06, -Q, down);
  K.rect(apron, 0, 0, X1 - X0 - 2 * LW, AP, OLD);
  K.rect(K.panel(top, [X0 + LW, ZB], [X1 - LW, ZB], [0, -1], .265, .06, -Q, down), 0, 0, X1 - X0 - 2 * LW, AP, OLD);
  K.rect(K.panel(top, [X0, ZF], [X0, ZB], [-1, 0], .27, .06, -Q, down), 0, 0, ZF - ZB, AP, OLD);
  K.rect(K.panel(top, [X1, ZF], [X1, ZB], [1, 0], .27, .06, -Q, down), 0, 0, ZF - ZB, AP, OLD);
  // Satz 2 auf der Vorderkante (Zarge, Außenseite +1, oben = zum Scharnier)
  // am Handy zweizeilig (eine Zeile wäre bei 16 px breiter als der Ausschnitt); zwei Zeilen passen in die Zarge (.28 von .3)
  const T4 = K.print(N ? ["Agenturen holen mich als", "Entwickler ins Projekt,"] : ["Agenturen holen mich als Entwickler ins Projekt,"], .105, .72, { lh: 1.15, align: "center" });
  const T5 = K.print(N ? ["Unternehmen arbeiten", "direkt mit mir."] : ["Unternehmen arbeiten direkt mit mir."], .105, .79, { lh: 1.15, align: "center" });
  K.onPanel(apron, T4, -1.75 - (X0 + LW), AP / 2, 1, [0, -1]);
  K.onPanel(apron, T5, 1.8 - (X0 + LW), AP / 2, 1, [0, -1]);

  // ---------- Skizzenblatt, das zum Bildschirm wird ----------
  F.part("blatt", .05, .06);
  const SH = .32, sz0 = -1.1, sz1 = -1.4;
  K.rect(K.panel(top, [-.5, sz0], [-.5, sz1], [-1, 0], .37, .045, Q), 0, 0, sz0 - sz1, SH, OLD);
  K.rect(K.panel(top, [.5, sz0], [.5, sz1], [1, 0], .37, .045, Q), 0, 0, sz0 - sz1, SH, OLD);
  K.rect(K.panel(top, [-.5, sz1], [.5, sz1], [0, -1], .37, .045, Q), 0, 0, 1.0, SH, OLD);
  const stand = F.lift(top, SH, .37, .05, { over: .05 });
  F.poly(stand, [[-.5, sz0], [.5, sz0], [.5, sz1], [-.5, sz1]], OLD, .5);
  const SW = 3.5, SL = 2.6;
  const scr = K.panel(stand, [-SW / 2, sz0], [SW / 2, sz0], [0, 1], .31, .07, Q + .1, { own: top, over: .05 });
  K.rect(scr, 0, 0, SW, SL, PAPER);
  // Skizze liegt lesbar von vorn auf dem Blatt (Seitenkopf hinten), zeichnet sich in Phase 1, geht beim Hochklappen
  const P = (x, y) => scr.uv(.15 + 3.2 * x / 1000, .52 + 2.0 * y / 625);
  F.sketch(scr, sketchSegs(P), .08, .1, { a: .58, fade: b => 1 - sm((b - .31) / .05) });
  // Bildschirmseite (Unterseite, nach dem Hochklappen vorn): fertige Website, darunter im Kinn Satzteil 1
  K.onPanel(scr, K.decal(1600, 1000, (x, W, H) => { website(x, W, H); x.strokeStyle = ink(.75); x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6); }, 3.2, 2.0, .4, .05), SW / 2, .52 + 1.0, -1);
  const T1 = K.print(["Ich entwickle Websites", "und Onlineshops,"], N ? .13 : .095, .5, { align: "center" });
  K.onPanel(scr, T1, SW / 2, .27, -1);

  // ---------- Rechner neben dem Tisch auf dem Bogen ----------
  F.part("rechner", .1, .08);
  const pc = K.box(R, 5.9, 7.3, 0, -1.4, 2.0, .3, .09);
  K.onPanel(pc.fr, K.decal(900, 300, rack, 1.2, .4, .17), .7, .45, -1);
  const T2 = K.print(["binde sie an Ihre", "übrigen Systeme an"], .1, .57);
  K.onPanel(pc.fr, T2, leftU(T2, .12), 1.2, -1);
  K.ticker(pc.fr, .05, pc.fr.uv(1.2, 1.72), [0, 1], -1, .62);
  const T3 = K.print(["und betreue sie,", "solange sie laufen."], .1, .64);
  K.onPanel(pc.top, T3, leftU(T3, .14), .7, -1, [0, 1]);
  // Kabel vom Standfuß über die Tischplatte, über die rechte Kante zum Rechner
  K.cable([V(.25, 2.43, -1.5), V(1.8, 2.43, -1.55), V(3.3, 2.43, -1.4), V(3.62, 2.36, -1.35), V(4.3, 1.55, -1.1), V(5.0, 1.25, -.9), V(5.9, 1.3, -.75)], .028, "#d6cfc2", .42, .05);

  // ---------- Anriss des nächsten Abschnitts am Ende der Linie ----------
  F.part("gerwing", .9, .06);
  const ge = N ? .26 : .17, g1 = K.print(["Gerwing · WooCommerce · seit 2023"], ge, .93, { track: .03, col: "#66666a" });
  const g2 = K.print(N ? ["Pflaster nach", "Fläche bestellen"] : ["Pflaster nach Fläche bestellen"], .5, .94, { font: "serif", lh: 1.1 });
  K.onFlat(R, g1, -3.6 + g1.w / 2 - g1.t.padX * ge, N ? -14.75 : -14.35);
  K.onFlat(R, g2, -3.6 + g2.w / 2 - g2.t.padX * .5, N ? -13.85 : -13.75);

  // Statuspunkt in Weltkoordinaten: Rechnerfront z = 0, Lage (1.2, 1.72) auf der Front
  const LED = V(7.1, 1.72, .012);
  const S = {
    name: { prints: [n1, n2, kick], e0: e, px: 150, fit: .56, pxN: 120, fitN: .84, pitch: 24, sy: -.3, npitch: 36, nsy: -.12, b: 0 },
    t1: { prints: [T1], pitch: 17, yaw: -18, sy: -.42, sx: .12, npitch: 14, nyaw: -8, nsy: -.5 },
    t2: { prints: [T2], pitch: 12, yaw: 12, sy: .05, npitch: 12, nyaw: 6, nsy: 0 },
    t3: { prints: [T3], pitch: 55, yaw: 8, sy: -.1, npitch: 56, nsy: -.2 },
    t4: { prints: [T4], pitch: 12, yaw: 8, sy: -.2, npitch: 14, nyaw: 4, nsy: -.3 },
    t5: { prints: [T5], pitch: 12, yaw: -8, sy: -.2, npitch: 14, nyaw: -4, nsy: -.3 },
    g: { prints: [g1, g2], e0: .5, px: 60, fit: .5, pxN: 40, fitN: .86, pitch: 50, sy: 0, npitch: 54, b: 1 }
  };
  return {
    track: 720,
    thread: { pts: [LED, V(7.25, 1.0, .012), V(7.45, .004, .2), V(8.6, .004, .45), V(9.5, .004, -.2), V(9.5, .004, -3.0), V(8.6, .004, -5.3), V(5.0, .004, -9.2), V(-2.6, .004, -12.6), V(-4.0, .004, -13.6)], t0: .88, t1: 1 },
    stops: Object.values(S),
    keys: [
      { w: 0, stop: S.name },
      // Bastellinien: von vorn oben auf den Bogen (el ≈ 52°, Abstand ≈ 16)
      { w: 1, b: .2, cam: V(1.6, 13.4, 12.4), tgt: V(1.6, 0, 1.4), camN: V(0, 18.2, 15.3), tgtN: V(0, 0, 2.2) },
      // Hochklappen und Einrasten: tiefer (el ≈ 30°, Abstand ≈ 15)
      { w: 1.2, b: .45, cam: V(1.8, 10.4, 17.4), tgt: V(1.8, 2.0, 1.4), camN: V(.3, 13.2, 22.0), tgtN: V(.3, 2.2, 2.2) },
      { w: .9, stop: S.t1 },
      { w: 1.1, stop: S.t2 },
      { w: .8, stop: S.t3 },
      { w: 1.1, stop: S.t4 },
      { w: .9, stop: S.t5 },
      { w: 1, b: .89, cam: V(2.0, 13.0, 16.2), tgt: V(2.0, 1.2, 1.4), camN: V(1.0, 17.0, 19.0), tgtN: V(1.0, 1.2, 1.8) },
      { w: 1, b: .945, cam: V(13, 7, 2), tgt: V(5, 0, -7), camN: V(11, 10, 4), tgtN: V(4, 0, -8) },
      { w: 1.1, stop: S.g }
    ]
  };
}
