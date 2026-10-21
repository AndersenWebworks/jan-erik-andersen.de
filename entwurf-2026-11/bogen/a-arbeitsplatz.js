// Variante A – Arbeitsplatz aus dem Bogen. Modelle und Satzteile aus entwurf-2026-11/a-arbeitsplatz.js:
// Laptop (Websites), Handy (Onlineshops), Rechner mit Kabel (anbinden) und tickendem Statuspunkt (betreuen, solange sie laufen),
// Projektmappe (Agenturen holen mich ins Projekt), Telefon (Unternehmen arbeiten direkt mit mir).
// Beim Laden stehen die Lettern des Namens aus dem Bogen auf, das Übrige ist flacher Bogen.
// Phase 1 (b .015 … .19): Schnitt- und Falzlinien der Teile zeichnen sich als Welle von links nach rechts, der Druck erscheint.
// Phase 2 (b .2 … .45): die Teile schneiden sich frei und klappen hoch (Vorspann-Mechanik), zuletzt klappt der Laptop auf.
// Im Bogen bleibt der Abdruck jedes Teils.
import { website, shop, keyboard, trackpad, rack } from "./zeichnungen.js";

const ink = a => `rgba(48,48,51,${a})`;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
// Bildschirm mit schmalem Rahmen, darin die Website
export function screenDraw(x, W, H) {
  x.fillStyle = ink(.86); x.fillRect(0, 0, W, H);
  const m = W * .035, ww = W - 2 * m, hh = Math.min(H - 2 * m, ww / 1.6);
  x.save(); x.translate(m, (H - hh) / 2); x.beginPath(); x.rect(0, 0, ww, hh); x.clip(); website(x, ww, hh); x.restore();
}

export default function (K) {
  const { F, R, V, COL, Q, narrow: N } = K;
  const { OLD, PAPER, STONE2 } = COL;
  const leftU = (pr, u0) => u0 + pr.w / 2 - pr.t.padX * pr.e;

  // ---------- Bogen ----------
  K.sheet(-7.4, 8.0, -4.9, N ? 7.0 : 5.9);
  K.sheet(-4.6, 4.6, -16.4, -11.2, undefined, .86);

  // ---------- Name: Lettern stehen aus dem Bogen auf ----------
  F.part("name", 0, .01);
  const e = .95;
  let n1, n2, kick;
  const w1 = K.measure(["Jan-Erik"], { font: "serif" }).tw * e, w2 = K.measure(["Andersen"], { font: "serif", italic: 1 }).tw * e;
  if (!N) {
    const gap = .36, x0 = .3 - (w1 + gap + w2) / 2;
    n1 = K.word(["Jan-Erik"], e, x0, 4.25, .15, .85, { font: "serif" });
    n2 = K.word(["Andersen"], e, x0 + w1 + gap, 4.25, .38, .85, { font: "serif", italic: 1, col: "#d40235" });
    const kt = ["Webentwicklung · Raum Plau am See · remote"];
    kick = K.word(kt, .17, .3 - K.measure(kt, { track: .03 }).tw * .17 / 2, 5.2, .65, .7, { track: .03, col: "#66666a", noImprint: 1 });
  } else {
    n1 = K.word(["Jan-Erik"], e, -.1 - w1 / 2, 3.95, .15, .85, { font: "serif" });
    n2 = K.word(["Andersen"], e, .4 - w2 / 2, 5.3, .38, .85, { font: "serif", italic: 1, col: "#d40235" });
    const kt = ["Webentwicklung", "Raum Plau am See · remote"];
    kick = K.word(kt, .2, .3 - K.measure(kt, { track: .03 }).tw * .2 / 2, 6.35, .65, .7, { track: .03, col: "#66666a", align: "center", noImprint: 1 });
  }

  // ---------- Projektmappe: Agenturen ----------
  F.part("mappe", .015, .065);
  const fd = K.slab(R, 1.8, 3.9, 1.9, .3, .07, .2, .05, { col: OLD, top: OLD });
  const tab = K.panel(R, [2.95, .3], [3.55, .3], [0, -1], .235, .045, Q - .22);
  K.rect(tab, 0, 0, .6, .26, OLD);
  K.onFlat(fd, K.decal(600, 160, (x, W, H) => { x.strokeStyle = ink(.5); x.lineWidth = 4; rr(x, 4, 4, W - 8, H - 8, 10); x.stroke(); x.fillStyle = ink(.45); x.fillRect(40, 50, 330, 18); x.fillStyle = ink(.25); x.fillRect(40, 95, 220, 12); }, .6, .16, .07), 3.45, .58);
  const T5 = K.print(["Agenturen holen mich", "als Entwickler ins Projekt,"], .118, .74);
  K.onFlat(fd, T5, 1.98 + T5.w / 2 - T5.t.padX * T5.e, 1.25);

  // ---------- Laptop: Websites ----------
  F.part("laptop", .035, .08);
  const deck = K.slab(R, -5.6, -2.4, 2.0, -.2, .1, .22, .05);
  K.onFlat(deck, K.decal(1400, 500, keyboard, 2.95, 1.05, .09), -4.0, .48);
  K.onFlat(deck, K.decal(600, 300, trackpad, 1.05, .52, .09), -4.0, 1.32);
  const T1 = K.print(["Ich entwickle Websites"], .13, .5);
  K.onFlat(deck, T1, -5.48 + T1.w / 2 - T1.t.padX * T1.e, 1.74);
  // Bildschirm: liegt hinter der Tastatur im Bogen, klappt zuletzt auf
  const scr = K.panel(R, [-5.5, -.2], [-2.5, -.2], [0, -1], .385, .065, Q - .2, { over: .05 });
  K.rect(scr, 0, 0, 3.0, 2.0, PAPER);
  K.onPanel(scr, K.decal(1500, 1000, screenDraw, 3.0, 2.0, .09), 1.5, 1.0, 1);

  // ---------- Handy: Onlineshops (steht leicht zurückgelehnt) ----------
  F.part("handy", .07, .06);
  const ph = K.panel(R, [-1.75, 2.0], [-.85, 2.0], [0, -1], .25, .055, Q - .28);
  K.rect(ph, 0, 0, .9, 1.7, PAPER);
  K.onPanel(ph, K.decal(450, 850, (x, W, H) => {
    x.fillStyle = ink(.5); x.fillRect(W / 2 - 40, 34, 80, 8);
    x.save(); x.translate(28, 66); x.beginPath(); x.rect(0, 0, W - 56, 560); x.clip(); shop(x, W - 56, 560); x.restore();
    x.strokeStyle = ink(.6); x.lineWidth = 3; x.strokeRect(28, 66, W - 56, 560);
  }, .9, 1.7, .12), .45, .85, 1);
  const T2 = K.print(["und Onlineshops,"], .085, .55);
  K.onPanel(ph, T2, .45, .21, 1);

  // ---------- Rechner: Ihre übrigen Systeme ----------
  F.part("rechner", .09, .08);
  const pc = K.box(R, -.3, 1.2, -.8, -1.8, 1.5, .27, .09);
  K.onPanel(pc.fr, K.decal(900, 260, rack, 1.36, .4, .16), .75, .27, -1);
  const T3 = K.print(["binde sie an Ihre", "übrigen Systeme an"], .105, .61);
  K.onPanel(pc.fr, T3, leftU(T3, .07), .84, -1);
  K.ticker(pc.fr, .05, pc.fr.uv(1.3, 1.3), [0, 1], -1, .63);
  const T4 = K.print(["und betreue sie,", "solange sie laufen."], .112, .67);
  K.onPanel(pc.top, T4, leftU(T4, .07), .66, -1, [0, 1]);
  // Kabel vom Laptop zum Rechner, zieht sich, sobald der Rechner steht
  K.cable([V(-2.38, .05, .55), V(-1.7, .03, .05), V(-1.1, .03, -.45), V(-.6, .1, -1.0), V(-.3, .38, -1.25)], .028, "#d6cfc2", .4, .05);

  // ---------- Telefon: direkt ----------
  F.part("telefon", .12, .07);
  const tb = K.box(R, 4.6, 6.6, .4, -.6, .42, .3, .085);
  const T6 = K.print(["Unternehmen arbeiten", "direkt mit mir."], .095, .81, { align: "center" });
  K.onPanel(tb.fr, T6, 1.0, .21, -1);
  K.onPanel(tb.top, K.decal(1000, 340, (x, W, H) => {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { x.strokeStyle = ink(.55); x.lineWidth = 4; rr(x, 30 + c * 240, 20 + r * 105, 200, 80, 14); x.stroke(); }
  }, 1.0, .34, .18), 1.0, .78, -1, [0, 1]);
  // Hörer: Platte mit Randstreifen, steigt aus dem Gehäuse
  const hs = K.slab(R, 5.15, 6.05, -.18, -.42, .52, .355, .045, { col: STONE2, top: STONE2 });
  K.onFlat(hs, K.decal(900, 240, (x, W, H) => { x.fillStyle = ink(.5); for (const cx of [110, W - 110]) { x.beginPath(); x.arc(cx, H / 2, 70, 0, Math.PI * 2); x.fill(); } }, .9, .24, .18), 5.6, -.3);

  // ---------- Anriss des nächsten Abschnitts am Ende der Linie ----------
  F.part("gerwing", .9, .06);
  const ge = N ? .26 : .17, g1 = K.print(["Gerwing · WooCommerce · seit 2023"], ge, .93, { track: .03, col: "#66666a" });
  const g2 = K.print(N ? ["Pflaster nach", "Fläche bestellen"] : ["Pflaster nach Fläche bestellen"], .5, .94, { font: "serif", lh: 1.1 });
  K.onFlat(R, g1, -3.6 + g1.w / 2 - g1.t.padX * ge, N ? -14.75 : -14.35);
  K.onFlat(R, g2, -3.6 + g2.w / 2 - g2.t.padX * .5, N ? -13.85 : -13.75);

  // Statuspunkt in Weltkoordinaten: Rechnerfront z = -.8, Lage (1.3, 1.3) auf der Front
  const LED = V(1.0, 1.3, -.79);
  const S = {
    name: { prints: [n1, n2, kick], e0: e, px: 150, fit: .56, pxN: 120, fitN: .84, pitch: 24, sy: -.3, npitch: 36, nsy: -.12, b: 0 },
    t1: { prints: [T1], pitch: 48, sy: -.38, sx: 0, npitch: 50, nsy: -.42 },
    t2: { prints: [T2], pitch: 14, yaw: 8, sy: -.3, npitch: 16, nsy: -.42 },
    t3: { prints: [T3], pitch: 10, yaw: -12, sy: .05, npitch: 12, nyaw: -6, nsy: 0 },
    t4: { prints: [T4], pitch: 52, yaw: -8, sy: -.1, npitch: 54, nsy: -.2 },
    t5: { prints: [T5], pitch: 50, yaw: 6, sy: -.15, npitch: 52, nsy: -.25 },
    t6: { prints: [T6], pitch: 14, yaw: -10, sy: -.1, npitch: 16, nyaw: -4, nsy: -.2 },
    g: { prints: [g1, g2], e0: .5, px: 60, fit: .5, pxN: 40, fitN: .86, pitch: 50, sy: 0, npitch: 54, b: 1 }
  };
  return {
    track: 760,
    thread: { pts: [LED, V(1.15, .7, -.785), V(1.25, .004, -.62), V(2.2, .004, -.45), V(3.3, .004, -1.25), V(3.4, .004, -3.0), V(3.0, .004, -4.9), V(1.0, .004, -9.0), V(-2.6, .004, -12.6), V(-4.0, .004, -13.6)], t0: .88, t1: 1 },
    stops: Object.values(S),
    keys: [
      { w: 0, stop: S.name },
      // Bastellinien: von vorn oben auf den ganzen Bogen samt Name (el ≈ 48°, Abstand ≈ 16)
      { w: 1, b: .2, cam: V(.3, 12.3, 11.0), tgt: V(.3, 0, .7), camN: V(.1, 16.4, 13.0), tgtN: V(.1, 0, 1.3) },
      // Hochklappen und Einrasten: tiefer (el ≈ 35°, Abstand ≈ 14,5)
      { w: 1.2, b: .45, cam: V(.3, 8.9, 12.6), tgt: V(.3, .4, .9), camN: V(.1, 11.6, 15.0), tgtN: V(.1, .6, 1.2) },
      { w: .9, stop: S.t1 },
      { w: 1, stop: S.t2 },
      { w: 1, stop: S.t3 },
      { w: .8, stop: S.t4 },
      { w: 1.1, stop: S.t5 },
      { w: 1, stop: S.t6 },
      { w: 1, b: .89, cam: V(.3, 12.2, 13.6), tgt: V(.3, .5, .6), camN: V(.3, 17.4, 15.1), tgtN: V(.3, .5, 1.0) },
      { w: 1, b: .945, cam: V(9.5, 6.5, 2.0), tgt: V(2.5, 0, -7), camN: V(8, 9, 4), tgtN: V(2, 0, -8) },
      { w: 1.1, stop: S.g }
    ]
  };
}
