// Variante C – Vom Entwurf zur Technik, aus dem Bogen (Eröffnung).
// Ein Schreibtisch hebt sich aus dem Bogen, auf der Platte zeichnet sich eine Website-Skizze in Haarlinien;
// das Blatt steht auf Fuß und Hals auf und wird zum Bildschirm (Satzteil 1 im Kinn).
// Ein Kabel läuft hinten über die Platte, am Tischbein hinunter und über den Bogen zum Rechner (anbinden),
// einem Mini-Tower mit Laufwerk, Einschalter und tickendem Statuspunkt (betreuen).
// Satz zwei steht auf der Zarge an der Vorderkante der Tischplatte.
// Pop-up-Logik: Die Tischplatte hebt sich parallel, Beine (L-Profil) und Zarge schwenken von ihren Kanten nach unten;
// Fuß, Hals und Bildschirm sind aus der Tischplatte geschnitten. Im Bogen bleibt der Abdruck.
// Der Name kommt aus wortmarke.js (eine Stelle, später tauschbar).
// Kopie von entwurf-2026-11/bogen/c-entwurf.js für die durchgehende Seite (entwurf-2026-11/seite/). Geändert: kein zweiter Bogen mit dem
// Anriss „Gerwing“ und keine Lesestelle dort (die echte Gerwing-Szene liegt dahinter in der Welt), der rote Faden endet an der
// Hinterkante des Bogens (von dort führt der gemeinsame Faden der Seite weiter).
import { wortmarke, faltkante } from "./wortmarke.js";

const ink = a => `rgba(48,48,51,${a})`;
const RED = "#d40235";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Website: eine Vorlage für Skizze (Haarlinien) und Bildschirmdruck, Koordinaten 1000 × 625 ----------
const WEB = (() => {
  const L = [{ t: "box", x: 60, y: 46, w: 118, h: 22, a: .85 }];
  for (let i = 0; i < 4; i++) L.push({ t: "txt", x: 600 + i * 88, y: 52, w: 62, h: 10, a: .4 });
  L.push({ t: "rule", y: 100 });
  L.push({ t: "box", x: 60, y: 150, w: 430, h: 42, a: .82 }, { t: "box", x: 60, y: 204, w: 300, h: 42, a: .82 });
  [400, 380, 260].forEach((w, i) => L.push({ t: "txt", x: 60, y: 276 + i * 24, w, h: 10, a: .3 }));
  L.push({ t: "btn", x: 60, y: 362, w: 150, h: 44 });
  L.push({ t: "img", x: 560, y: 140, w: 380, h: 280 });
  for (let c = 0; c < 3; c++) {
    const X = 60 + c * 300;
    L.push({ t: "box", x: X, y: 470, w: 150, h: 14, a: .7 });
    [240, 220, 170].forEach((w, i) => L.push({ t: "txt", x: X, y: 500 + i * 20, w, h: 8, a: .26 }));
  }
  L.push({ t: "rule", y: 590 });
  return L;
})();
function webDraw(x, W, H) {
  const s = W / 1000, S = H / 625;
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  for (const o of WEB) {
    if (o.t === "rule") { x.fillStyle = ink(.12); x.fillRect(0, o.y * S, W, 2 * S); continue; }
    const X = o.x * s, Y = o.y * S, w = o.w * s, h = o.h * S;
    if (o.t === "box" || o.t === "txt") { x.fillStyle = ink(o.a); rr(x, X, Y, w, h, o.t === "txt" ? h / 2 : 2 * s); x.fill(); }
    else if (o.t === "btn") { x.fillStyle = RED; rr(x, X, Y, w, h, 4 * s); x.fill(); x.fillStyle = "rgba(255,255,255,.92)"; rr(x, X + 30 * s, Y + h / 2 - 5 * S, w - 60 * s, 10 * S, 5 * S); x.fill(); }
    else if (o.t === "img") {
      x.fillStyle = ink(.07); x.fillRect(X, Y, w, h);
      x.strokeStyle = ink(.3); x.lineWidth = 2.5 * s; x.lineJoin = "round";
      x.beginPath(); x.moveTo(X, Y + h); x.lineTo(X + w * .32, Y + h * .45); x.lineTo(X + w * .55, Y + h * .72); x.lineTo(X + w * .7, Y + h * .58); x.lineTo(X + w, Y + h); x.stroke();
      x.beginPath(); x.arc(X + w * .74, Y + h * .28, 24 * s, 0, Math.PI * 2); x.stroke();
    }
  }
}
// dieselbe Seite als Skizze: Blöcke als Rahmen, Textzeilen als Strich, Bild als Rahmen mit Kreuz
function sketchSegs(P) {
  const segs = [], line = (x0, y0, x1, y1) => segs.push([P(x0, y0), P(x1, y1)]);
  const rect = (x, y, w, h) => { line(x, y, x + w, y); line(x + w, y, x + w, y + h); line(x + w, y + h, x, y + h); line(x, y + h, x, y); };
  rect(0, 0, 1000, 625);
  for (const o of WEB) {
    if (o.t === "rule") line(0, o.y, 1000, o.y);
    else if (o.t === "txt") line(o.x, o.y + o.h / 2, o.x + o.w, o.y + o.h / 2);
    else if (o.t === "box") rect(o.x, o.y, o.w, o.h);
    else if (o.t === "btn") { rect(o.x, o.y, o.w, o.h); line(o.x + 30, o.y + o.h / 2, o.x + o.w - 30, o.y + o.h / 2); }
    else if (o.t === "img") { rect(o.x, o.y, o.w, o.h); line(o.x, o.y, o.x + o.w, o.y + o.h); line(o.x + o.w, o.y, o.x, o.y + o.h); }
  }
  return segs;
}
// Front des Mini-Towers (Druck, oben = Oberkante): Rahmen, Laufwerk, Kartenleser, Einschalter, zwei Buchsen, Lüftung, Sockel.
// LED: Lage des Statuspunkts (u, v von unten), dort bleibt im Druck ein feiner Ring als Fassung.
const TOWER = { W: 1.1, D: 1.7, H: 1.85, led: [.86, 1.24] };
function towerFront(x, W, H) {
  const s = W / TOWER.W, Y = v => (TOWER.H - v) * s;
  x.strokeStyle = ink(.34); x.lineWidth = 3; rr(x, .05 * s, .05 * s, W - .1 * s, H - .1 * s, .03 * s); x.stroke();
  // Laufwerk mit Schlitz und Auswurftaste
  x.strokeStyle = ink(.5); x.lineWidth = 3; rr(x, .14 * s, Y(1.73), .82 * s, .16 * s, .015 * s); x.stroke();
  x.fillStyle = ink(.55); x.fillRect(.22 * s, Y(1.645), .5 * s, .012 * s);
  rr(x, .84 * s, Y(1.663), .07 * s, .026 * s, .01 * s); x.fill();
  // Kartenleser
  x.strokeStyle = ink(.42); x.lineWidth = 2.5; rr(x, .14 * s, Y(1.52), .42 * s, .07 * s, .012 * s); x.stroke();
  x.fillStyle = ink(.45); x.fillRect(.2 * s, Y(1.485), .3 * s, .01 * s);
  // Einschalter: Ring mit Symbol
  const bx = .26 * s, by = Y(TOWER.led[1]), br = .085 * s;
  x.strokeStyle = ink(.62); x.lineWidth = 4; x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 3.5; x.lineCap = "round";
  x.beginPath(); x.arc(bx, by + br * .08, br * .48, -Math.PI * .32, Math.PI * 1.32); x.stroke();
  x.beginPath(); x.moveTo(bx, by - br * .58); x.lineTo(bx, by - br * .05); x.stroke();
  // Fassung des Statuspunkts
  x.strokeStyle = ink(.3); x.lineWidth = 2.5; x.beginPath(); x.arc(TOWER.led[0] * s, Y(TOWER.led[1]), .062 * s, 0, Math.PI * 2); x.stroke();
  // zwei Buchsen zwischen Einschalter und Statuspunkt
  x.strokeStyle = ink(.45); x.lineWidth = 2.5;
  for (let i = 0; i < 2; i++) { rr(x, (.45 + i * .15) * s, Y(TOWER.led[1] + .022), .1 * s, .044 * s, .008 * s); x.stroke(); }
  // Lüftung: Langlöcher im Raster
  x.strokeStyle = ink(.3); x.lineWidth = .028 * s; x.lineCap = "round";
  for (let r = 0; r < 11; r++) {
    const yy = Y(.98 - r * .07), off = r % 2 ? .1 : 0;
    for (let c = 0; c < 4; c++) { const x0 = (.18 + off + c * .2) * s; if (x0 + .12 * s > W - .14 * s) continue; x.beginPath(); x.moveTo(x0, yy); x.lineTo(x0 + .12 * s, yy); x.stroke(); }
  }
  // Sockel
  x.fillStyle = ink(.1); x.fillRect(.05 * s, Y(.07), W - .1 * s, .045 * s);
}

export default function (K) {
  const { F, R, V, COL, Q, sm, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  // Papierfarben: Tisch warm, Beine und Zarge eine Spur tiefer, Bildschirm hell, Fuß und Hals grau, Rechner kühler
  const DESK = c3("#e8e1d2"), LEG = c3("#e1d9c9"), FACE = c3("#f8f6f1"), METAL = c3("#dcd7cd"), CASE = c3("#ece9e2"), FRONTC = c3("#e2ded5");

  // Am Handy schmalerer Tisch und Rechner näher dran: das Hochkantbild ist sonst breitenbegrenzt und bleibt oben und unten leer
  const X1 = N ? 2.65 : 3.6, X0 = -X1, PX0 = N ? 5.1 : 6.2;
  // ---------- Bogen ----------
  // Der Bogen endet knapp vor dem Podest (PZ): die Startkamera steht auf Höhe der Stufenkante, vor dem Podest darf kein Papier liegen
  // ---------- Podest (Kameradrehbuch „Podest“ in docs/FASSUNG-2026-11.md) ----------
  // Ein Streifen aus dem Bogen faltet sich zur Stufe: Vorderseite schwenkt am Scharnier PZ hoch, das Deck bleibt waagerecht und hebt sich,
  // die Rückseite klappt hinten auf den Bogen herab (Parallelfalz, in jeder Zwischenlage stimmig). Der Streifen liegt in Ruhe hinter PZ,
  // im Bogen bleibt sein Abdruck hinter dem Podest. Am Handy zwei Stufen: Vorderseite, Deck 1 („Andersen.“), Setzstufe, Deck 2 („Jan-Erik“), Rückseite.
  // Breite: breiter als das Startbild (sonst läge links und rechts wieder Bogen im Bild); startD() hält die Kamera so nah, dass das auch bei
  // Breitbild gilt. Lage: der Streifen braucht hinter PZ D1 + 2·H1 (Handy D1 + D2 + 2·H2) Platz bis zu den liegenden Vorderbeinen (z 4,1).
  const PZ = N ? 10.4 : 6.25, PW = N ? 3.4 : 5.4, H1 = N ? .85 : .5, D1 = 1.05, H2 = 2.0, D2 = 1.12, K1 = 1.083;
  K.sheet(X0 - 2.9, PX0 + 3.7, -5.6, PZ + .05);
  F.part("podest", -.02, .01); // Schnitt- und Falzlinien des Podests stehen schon (es ist beim Laden aufgestanden)
  const STEP = c3("#f6f3ec"), PL = 2 * PW, pt = { clock: "t", over: .04 }, PT0 = 0, PD = .75;
  const face1 = K.panel(R, [-PW, PZ], [PW, PZ], [0, -1], PT0, PD, Q, pt);
  K.P(face1, [[0, 0], [PL, 0], [PL, H1], [0, H1]], STEP, [.35, .5, 0, .5]);
  const deck1 = K.panel(face1, face1.uv(0, H1), face1.uv(PL, H1), [0, -1], PT0, PD, -Q, pt);
  K.P(deck1, [[0, 0], [PL, 0], [PL, D1], [0, D1]], STEP, [0, .5, .5, .5]);
  let deck2 = null, riser = null, back;
  if (N) {
    riser = K.panel(deck1, deck1.uv(0, D1), deck1.uv(PL, D1), [0, -1], PT0, PD, Q, pt);
    K.P(riser, [[0, 0], [PL, 0], [PL, H2 - H1], [0, H2 - H1]], STEP, [.35, .5, 0, .5]);
    deck2 = K.panel(riser, riser.uv(0, H2 - H1), riser.uv(PL, H2 - H1), [0, -1], PT0, PD, -Q, pt);
    K.P(deck2, [[0, 0], [PL, 0], [PL, D2], [0, D2]], STEP, [0, .5, .5, .5]);
    back = K.panel(deck2, deck2.uv(0, D2), deck2.uv(PL, D2), [0, -1], PT0, PD, -Q, pt);
    K.P(back, [[0, 0], [PL, 0], [PL, H2], [0, H2]], STEP, [.35, .5, .5, .5]);
  } else {
    back = K.panel(deck1, deck1.uv(0, D1), deck1.uv(PL, D1), [0, -1], PT0, PD, -Q, pt);
    K.P(back, [[0, 0], [PL, 0], [PL, H1], [0, H1]], STEP, [.35, .5, .5, .5]);
  }

  // ---------- Name (wortmarke.js) auf dem Podest, Unterzeile auf seiner Vorderseite ----------
  F.part("name", 0, .01);
  // Lettern stehen an der Vorderkante des Decks (Ruhelage z PZ - H1); am Handy „Jan-Erik“ auf Deck 2 (Ruhelage PZ - D1 - H2)
  const mark = N ? wortmarke(K, { cx: 0, narrow: true, par: deck2, zb: PZ - D1 - H2, par2: deck1, zb2: PZ - H1, k1: K1 })
    : wortmarke(K, { cx: 0, zb: PZ - H1, narrow: false, par: deck1 });
  // die gestrichelte Falz läuft über die Stufenkante auf die Oberkante der Vorderseite (frontal ist nur diese zu sehen)
  const [fA, fB] = mark.folds;
  if (N) { faltkante(K, riser, fA, fA.x + PW, H2 - H1 - fA.f.lw / 2); faltkante(K, face1, fB, fB.x + PW, H1 - fB.f.lw / 2); }
  else faltkante(K, face1, fA, fA.x + PW, H1 - fA.f.lw / 2);
  const KT = N ? ["Webentwicklung", "Raum Plau am See · remote"] : ["Webentwicklung · Raum Plau am See · remote"];
  const ko = { track: .05, col: "#66666a", align: "center", lh: 1.45 };
  // gedruckt, mittig auf der Vorderseite (Mitte des Drucks = Mitte des Versalblocks)
  const ke = N ? .19 : .15, kick = K.onPanel(face1, K.print(KT, ke, -1, ko), PW, H1 / 2, 1);
  kick.hold = true;   // erscheint erst mit der Ablösung des HTML-Vorbilds (kern.js, release)

  // ---------- Schreibtisch: Platte hebt sich, L-Beine und Zarge schwenken nach unten ----------
  F.part("tisch", .015, .08);
  const ZF = 1.7, ZB = -1.9, HT = 2.4, LW = .2, AP = .46;
  // Zeitplan (Kameradrehbuch in docs/FASSUNG-2026-11.md): Platte hebt sich ruhig über b .20–.33 (rund 0,4 Bildschirmhöhen),
  // kleines Überschwingen; Beine schwenken erst, wenn die Platte rund neun Zehntel ihrer Höhe erreicht hat, die Zarge danach
  const top = F.lift(R, HT, .2, .13, { over: .02 });
  F.poly(top, [[X0, ZF], [X0 + LW, ZF], [X1 - LW, ZF], [X1, ZF], [X1, ZF - LW], [X1, ZB + LW], [X1, ZB], [X1 - LW, ZB], [X0 + LW, ZB], [X0, ZB], [X0, ZB + LW], [X0, ZF - LW]], DESK, .5);
  const down = { own: R, over: .035 };
  // Beine: je Ecke eine Leiste von der Vorder- bzw. Hinterkante und eine von der Seitenkante (L-Profil)
  for (const [xa, xb] of [[X0, X0 + LW], [X1 - LW, X1]]) {
    K.rect(K.panel(top, [xa, ZF], [xb, ZF], [0, 1], .27, .085, -Q, down), 0, 0, LW, HT, LEG);
    K.rect(K.panel(top, [xa, ZB], [xb, ZB], [0, -1], .276, .085, -Q, down), 0, 0, LW, HT, LEG);
  }
  for (const [xs, sd] of [[X0, -1], [X1, 1]]) {
    K.rect(K.panel(top, [xs, ZF], [xs, ZF - LW], [sd, 0], .273, .085, -Q, down), 0, 0, LW, HT, LEG);
    K.rect(K.panel(top, [xs, ZB + LW], [xs, ZB], [sd, 0], .279, .085, -Q, down), 0, 0, LW, HT, LEG);
  }
  const apron = K.panel(top, [X0 + LW, ZF], [X1 - LW, ZF], [0, 1], .29, .075, -Q, down);
  K.rect(apron, 0, 0, X1 - X0 - 2 * LW, AP, LEG);
  K.rect(K.panel(top, [X0 + LW, ZB], [X1 - LW, ZB], [0, -1], .29, .075, -Q, down), 0, 0, X1 - X0 - 2 * LW, AP, LEG);
  K.rect(K.panel(top, [X0, ZF - LW], [X0, ZB + LW], [-1, 0], .296, .075, -Q, down), 0, 0, ZF - ZB - 2 * LW, AP, LEG);
  K.rect(K.panel(top, [X1, ZF - LW], [X1, ZB + LW], [1, 0], .296, .075, -Q, down), 0, 0, ZF - ZB - 2 * LW, AP, LEG);
  // Satz 2 auf der Zarge (Außenseite +1, oben = zum Scharnier), je Hälfte zweizeilig
  const so = { lh: 1.18, align: "center", track: .005 };
  const T4 = K.print(["Agenturen holen mich als", "Entwickler ins Projekt,"], .132, .72, so);
  const T5 = K.print(["Unternehmen arbeiten", "direkt mit mir."], .132, .79, so);
  const xh = (X1 - LW) / 2;
  K.onPanel(apron, T4, -xh - (X0 + LW), AP / 2, 1, [0, -1]);
  K.onPanel(apron, T5, xh - (X0 + LW), AP / 2, 1, [0, -1]);

  // ---------- Skizzenblatt, das zum Bildschirm wird: Fuß, Hals, Bildschirm ----------
  F.part("blatt", .05, .06);
  // am Handy etwas schmalerer Bildschirm, damit er bei 16 px Kinnschrift ganz ins Hochkantbild passt
  const FW = 1.5, ZFB = -1.78, NH = .8, NW = .34, CH = .58, DX = N ? 2.56 : 3.2, DY = DX / 1.6, SW = DX + .3, SL = CH + DY + .1;
  // Fuß: flache Platte ohne Vorderwand (dort liegt in Ruhe das Bildschirmblatt an)
  const foot = K.slab(top, -FW / 2, FW / 2, ZFB + NH, ZFB, .04, .345, .04, { col: METAL, top: METAL, walls: "lrb" });
  // Hals: liegt auf dem Fuß, steht an dessen Hinterkante auf; seine Oberkante geht nahtlos in den Bildschirm über
  const neck = K.panel(foot, [-NW / 2, ZFB], [NW / 2, ZFB], [0, 1], .37, .07, Q, { over: .04 });
  K.P(neck, [[0, 0], [NW, 0], [NW, NH], [0, NH]], METAL, [.5, .5, 0, .5]);
  const scr = K.panel(neck, neck.uv(0, NH), neck.uv(NW, NH), [0, 1], .435, .04, .1, { own: top, over: .3 });
  const uL = -SW / 2 + NW / 2, uR = SW / 2 + NW / 2, U = x => x + NW / 2;
  K.P(scr, [[uL, 0], [0, 0], [NW, 0], [uR, 0], [uR, SL], [uL, SL]], FACE, [.5, 0, .5, .5, .5, .5]);
  // Skizze liegt lesbar von vorn auf dem Blatt (Seitenkopf hinten), zeichnet sich in Phase 1, geht beim Aufstehen
  const D0 = CH;
  const P = (x, y) => scr.uv(U(-DX / 2 + DX * x / 1000), D0 + DY * y / 625);
  // dy .004: Abstand zum Papier größer als dessen Tiefenversatz, sonst scheint die Skizze beim Aufstehen kopfüber nach vorn durch;
  // sie verblasst, bevor die Vorderseite zur Kamera dreht (rund 30° Aufstellwinkel)
  F.sketch(scr, sketchSegs(P), .08, .1, { a: .58, dy: .004, fade: b => 1 - sm((b - .365) / .03) });
  // Bildschirmseite (Unterseite, nach dem Aufstehen vorn): Rahmen und fertige Website, im Kinn Satzteil 1
  const PXU = 500;
  K.onPanel(scr, K.decal(SW * PXU, SL * PXU, (x, W, H) => {
    const bz = .055 * PXU, dx = (SW - DX) / 2 * PXU, dy = (SL - CH - DY) * PXU;
    x.fillStyle = ink(.84); rr(x, dx - bz, dy - bz, DX * PXU + 2 * bz, DY * PXU + 2 * bz, bz * .5); x.fill();
    x.save(); x.translate(dx, dy); x.beginPath(); x.rect(0, 0, DX * PXU, DY * PXU); x.clip(); webDraw(x, DX * PXU, DY * PXU); x.restore();
  }, SW, SL, .405, .05), U(0), SL / 2, -1);
  const T1 = K.print(["Ich entwickle Websites", "und Onlineshops,"], .135, .5, { align: "center", lh: 1.18 });
  // Kinn: frei zwischen Unterkante und Rahmen (Rahmen reicht .055 ins Kinn), Text mittig darin
  K.onPanel(scr, T1, U(0), (CH - .055) / 2 - .01, -1);

  // ---------- Rechner: Mini-Tower neben dem Tisch auf dem Bogen ----------
  F.part("rechner", .1, .08);
  const PZ0 = .1, { W: TW, D: TD, H: TH } = TOWER;
  const pc = K.box(R, PX0, PX0 + TW, PZ0, PZ0 - TD, TH, .31, .09, { col: CASE, fcol: FRONTC });
  K.onPanel(pc.fr, K.decal(Math.round(TW * 700), Math.round(TH * 700), towerFront, TW, TH, .17), TW / 2, TH / 2, -1);
  // Satzteil 2 auf der rechten Seitenwand (zum Betrachter gedreht), Satzteil 3 auf dem Deckel
  const T2 = K.print(["binde sie an Ihre", "übrigen Systeme an"], .15, .57, { lh: 1.2 });
  K.onPanel(pc.rt, T2, TD / 2 - T2.t.tw * T2.e / 2 + T2.w / 2 - T2.t.padX * T2.e, TH * .64, -1);
  K.ticker(pc.fr, .045, pc.fr.uv(TOWER.led[0], TOWER.led[1]), [0, 1], -1, .62);
  const T3 = K.print(["und betreue sie,", "solange sie laufen."], .09, .64, { lh: 1.22, align: "center" });
  K.onPanel(pc.top, T3, TW / 2, TD * .6, -1, [0, 1]);
  // Kabel: hinter dem Hals auf die Platte, schräg zur rechten Kante, dort über die Kante und zwischen den Beinen
  // auf den Bogen fallend (von vorn sichtbar), über den Bogen zur linken Seitenwand des Rechners
  const ty = HT + .026, xe = X1 + .05, zd = -.6, gap = PX0 - xe;
  K.cable([V(0, 2.62, ZFB - .05), V(.15, ty, ZFB - .08), V(X1 * .5, ty, ZFB - .02), V(X1 * .82, ty, -1.25), V(X1 - .14, ty, zd - .12), V(X1 - .01, ty - .004, zd - .02),
    V(xe, HT - .1, zd), V(xe + .02, 1.4, zd + .02), V(xe + .05, .3, zd + .03), V(xe + .22, .025, zd), V(xe + gap * .45, .025, zd - .12), V(PX0 - .3, .03, -.78), V(PX0 - .07, .12, -.8), V(PX0, .2, -.8)], .024, "#8e8981", .44, .05);

  // ---------- Konstruktionsphase (Drehbuch „Konstruktionsphase“ in docs/FASSUNG-2026-11.md) ----------
  // Gerüst: die Kanten von Tisch, Bildschirm und Rechner im Endzustand (aus dem Faltplan gerechnet) zeichnen sich über b .09–.25
  // Strich für Strich als Welle von links nach rechts im Raum, mit Überständen über die Ecken und zwei bis drei versetzten Strichen;
  // die Teile klappen hinein, beim Einrasten zieht sich der Überstand zurück und die Linie blendet aus.
  F.geruest({ tags: ["tisch", "blatt", "rechner"], t0: .09, t1: .25, du: .03, a: .5 });
  // Bleistiftspur: Eckmarken und zarte Konstruktionskanten auf den Flächen, bleibt stehen; auf Flächen mit Text nur Eckmarken
  F.spur({ tags: ["tisch", "blatt", "rechner"], quiet: [apron, scr, pc.rt, pc.top, pc.fr], a: .3 });

  // Statuspunkt in Weltkoordinaten (Front z = PZ0)
  const LED = V(PX0 + TOWER.led[0], TOWER.led[1], PZ0 + .012);
  // Fließtext Desktop 19–21 px je nach Höhe, Handy 16 px
  const pxD = (W, H) => Math.min(21, Math.max(19, 19 + (H - 700) / 500 * 2));
  // niedrige Fenster zeigen bei gleicher Schriftgröße weniger Welt: Text dort tiefer setzen, damit der Monitor oben im Bild bleibt
  const syH = (lo, hi) => (W, H) => Math.min(hi, Math.max(lo, lo + (H - 720) / 180 * .15 * (hi > lo ? 1 : -1)));
  // Abstand D der Startkamera zur Ebene der Lettern (z = PZ). Desktop: Name rund 70 % der Breite, Schrift höchstens H/6, und das Podest
  // reicht seitlich über das Bild hinaus (sonst sähe man daneben den Bogen). Handy: zweizeiliger Name rund 70 % der Breite.
  const tanS = () => Math.tan((N ? 44 : 32) * Math.PI / 360);
  const startD = (W, H) => {
    const T = tanS(), f = H / (2 * T);
    // Obergrenze: beide Vorderseiten (Handy: auch die Setzstufe, sie steht D1 weiter hinten) reichen mit 0,3 Rand über den Bildrand
    const cap = (PW - .3) / (T * W / H) - (N ? D1 : 0);
    if (N) { const l = Math.min(-.2 - mark.w1 / 2, .2 - mark.l2 / 2), r = Math.max(-.2 + mark.w1 / 2, .2 + mark.l2 / 2); return Math.min(cap, (r - l) * f / (.7 * W)); }
    return Math.min(Math.max(3 * mark.e / T, mark.w * f / (.7 * W)), cap);
  };
  // readingPose() übersetzt: Tiefe bis zur Mitte der Drucke, daraus Schriftgröße und Verschiebung so, dass die Kamera bei (0, H1, PZ + D) steht
  const dep = (W, H) => PZ + startD(W, H) - S.name.C.z;
  const startPx = (W, H, s) => s.e * H / (2 * tanS() * dep(W, H));
  const startSx = (W, H) => S.name.C.x / (tanS() * (W / H) * dep(W, H));
  const startSy = (W, H) => (S.name.C.y - H1) / (tanS() * dep(W, H));
  const S = {
    // Startbild: Kamera genau auf Höhe der vorderen Stufenkante H1, waagerecht und frontal (Neigung 0, Rollen 0): Horizont = Bildmitte = Stufenkante,
    // Deckflächen liegen exakt in Blickhöhe (Desktop) bzw. darüber (Handy, Deck 2), der Bogen liegt ganz hinter der Vorderseite
    name: { prints: [...mark.prints, kick], e0: mark.e, pitch: 0, npitch: 0, b: 0, px: startPx, pxN: startPx, sx: startSx, nsx: startSx, sy: startSy, nsy: startSy },
    // t1: im Breitbild steht der Rechner ganz rechts mit im Bild (Text links der Mitte), sonst bleibt er ganz draußen, nie angeschnitten
    t1: { prints: [T1], px: pxD, pitch: 16, yaw: -14, sy: syH(-.18, .04), sx: (W, H) => W / H >= 1.68 ? -.4 : .03, npitch: 16, nyaw: -6, nsy: .14 },
    t2: { prints: [T2], px: pxD, pitch: 10, yaw: -30, sy: -.33, npitch: 10, nyaw: -30, nsy: -.3 },
    t3: { prints: [T3], px: pxD, pitch: 52, yaw: 8, sy: -.1, npitch: 54, nsy: .16 },
    t4: { prints: [T4], px: pxD, pitch: 16, yaw: -16, sy: syH(-.64, -.4), sx: (W, H) => W / H >= 1.55 ? -.35 : .08, npitch: 18, nyaw: 4, nsy: -.28 },
    t5: { prints: [T5], px: pxD, pitch: 16, yaw: -4, sy: syH(-.64, -.4), sx: -.12, npitch: 18, nyaw: -4, nsy: -.28 }
  };
  return {
    // Sichtfeld Breitbild 32° statt 36° (Kamera rund 12 % weiter weg, Bogen weniger trapezförmig verzerrt); hochkant 44° wie bisher
    fov: 32, fovN: 44,
    track: 750,
    // Raster wie auf einer Schneidematte, auf den Bogen gedruckt: Teilung 0,5, jede fünfte Linie kräftiger; zieht als Welle von links
    // nach rechts mit den Bastellinien ein (b ab .004, voll bis rund .085), geht auf den Teilen weg, sobald sie hochklappen, verblasst b .40–.46
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .40 },
    thread: { pts: [LED, V(LED.x + .06, .8, LED.z), V(LED.x + .2, .004, PZ0 + .25), V(PX0 + 2.2, .004, .6), V(PX0 + 3.2, .004, -.2), V(PX0 + 3.25, .004, -2.6), V(PX0 + 2.2, .004, -5.0), V(PX0 + 2.0, .004, -5.45)], t0: .88, t1: 1 },
    stops: Object.values(S),
    keys: [
      { w: 0, stop: S.name },
      // Kamera hebt sich über den Bogen und gibt die Fläche frei, b bleibt 0 (noch keine Linien): Blickhöhe 0° -> 18°, Abstand 10,8 -> 19;
      // Handy 0° -> 19°, Abstand 13,2 -> 22 (vorher 27,5, dann wieder heran: jetzt wächst der Abstand stetig bis zum nächsten Schlüssel)
      { w: .4, b: 0, cam: V(.1, 6.6, 21.6), tgt: V(.6, .7, 3.5), camN: V(.5, 8.06, 26.8), tgtN: V(.5, .9, 6.0) },
      // Bastellinien fertig, Tisch beginnt sich zu heben: Überblick über den Bogen (el 38°, az −4°, Abstand 22,7; Handy el 42°, 25,4).
      // Eingepasst bei 1280 × 900 (tmp-Rechnung, Podest eingeschlossen): fertiges Modell, flach liegende Beine, Name und Podest 72 bis 815 px,
      // seitlich mindestens 20 px frei; Handy fertiges Modell, Name und Podest zwischen 150 und 680 px, seitlich 12 px frei. Blickhöhe und Gier wie bisher.
      { w: .5, b: .2, cam: V(.08, 15.69, 19.35), tgt: V(1.35, 1.3, 1), camN: V(1.05, 19.12, 24.19), tgtN: V(1.05, 1.3, 4.41) },
      // Platte oben, Beine rasten ein: eigener Schlüssel, damit das Heben gleichmäßig über rund 0,4 Bildschirmhöhen läuft
      // (el 33°, az −5°, Abstand 22,9; Handy el 36°, 26,7)
      { w: 1, b: .34, cam: V(-.7, 13.74, 19.95), tgt: V(.97, 1.3, .86), camN: V(.98, 17.01, 25.93), tgtN: V(.98, 1.3, 4.32) },
      // Tisch steht, Monitor und Rechner fertig: Kamera ist mit dem Heben auf Augenhöhe eines Stehenden gesunken
      // (el 28°, az −6°, Abstand 22,2; Handy el 30°, 26,8), Monitor-Oberkante ≥ 72 px, Name und Podest über der Leiste
      { w: .8, b: .47, cam: V(-1.64, 11.72, 20.19), tgt: V(.41, 1.3, .69), camN: V(.93, 14.71, 27.45), tgtN: V(.93, 1.3, 4.23) },
      { w: .9, stop: S.t1 },
      { w: 1.1, stop: S.t2 },
      { w: .8, stop: S.t3 },
      { w: 1.1, stop: S.t4 },
      { w: .9, stop: S.t5 },
      // Überblick, bevor der Punkt losläuft (el 42°, az 6°; Handy el 40°)
      { w: 1, b: .89, cam: V(2.86, 15.1, 16.01), tgt: V(1.29, 1.62, 1.12), camN: V(1.64, 17.93, 21.73), tgtN: V(1.64, 1.2, 1.79) },
      { w: 1, b: .945, cam: V(13, 7, 2), tgt: V(5, 0, -7), camN: V(11, 10, 4), tgtN: V(4, 0, -8) }
    ]
  };
}
