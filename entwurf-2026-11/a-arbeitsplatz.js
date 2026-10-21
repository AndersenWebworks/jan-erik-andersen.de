// Variante A – Arbeitsplatz aus Papier: der Einstiegssatz baut sich als Arbeitsplatz.
// Laptop (Websites), Handy (Onlineshops), Kabel zum Rechner (anbinden), tickender Statuspunkt (betreuen, solange sie laufen),
// Projektmappe (Agenturen holen mich ins Projekt), Visitenkarte (Unternehmen arbeiten direkt mit mir).
// Beim Laden steht der Name lesbar da, vom Arbeitsplatz nur der Anriss (Eckmarken der Grundrisse, eine Fluchtlinie).
// Scrollen, Phase 1 (b 0 … .2): Bauraster am Boden, dann wachsen die Kanten aller Geräte als Haarlinien, von links nach rechts.
// Phase 2 (b .2 … .42): die Papierflächen klappen in die Kanten und rasten ein, als Welle von links nach rechts;
// der Laptop klappt auf, das Kabel zieht sich zum Rechner, Raster und Anriss verblassen.
// Danach die Satzteile an ihren Bauteilen, zuletzt verlässt der rote Punkt den Rechner und läuft zum nächsten Abschnitt.
import { website, shop, keyboard, trackpad, rack } from "./zeichnungen.js";

export default function (K) {
  const { V, C, model, box, printOn, decalOn, mech, win } = K;
  K.ground(-14, 14, -20, 16);
  const N = K.narrow;

  // ---------- Name auf dem Bogen (am Handy zweizeilig und größer) ----------
  const kicker = N
    ? K.flat(["Webentwicklung", "Raum Plau am See · remote"], .2, -2.95, 3.45, -1, { track: .03, col: "#66666a", off: .42 })
    : K.flat(["Webentwicklung · Raum Plau am See · remote"], .17, -2.95, 3.55, -1, { track: .03, col: "#66666a", off: .42 });
  const name = N
    ? K.flat(["Jan-Erik", "Andersen"], .86, -3.1, 5.2, -1, { font: "serif", off: .42 })
    : K.flat(["Jan-Erik Andersen"], .86, -3.1, 4.55, -1, { font: "serif", off: .42 });

  // ---------- Anriss und Bauraster ----------
  // Raster nur hinter dem Namen (z bis 2.6), zeichnet sich zuerst und verblasst, wenn die Flächen einrasten
  K.grid(-6.5, 4.5, -2.4, 2.6, .5, 4, 0, .07, .3, .1);
  // Fluchtlinie der Laptop-Vorderkante, steht von Anfang an mit den Eckmarken
  K.guide(model, [[V(-10, .004, 2.0), V(9, .004, 2.0)]], -1, 1, .3, .1, .2);

  // ---------- Laptop: Websites ----------
  const lap = new K.THREE.Group(); model.add(lap);
  K.anriss(lap, [[-3.1, .1, -.2, 2.0]], .3, .1);
  const base = box(-3.1, .1, 0, .1, -.2, 2.0, { net: [.05, .07], face: [.22, .07] });
  lap.add(base);
  decalOn(base, "py", 1400, 500, keyboard, 2.95, 1.05, 0, .42, .29);
  decalOn(base, "py", 600, 300, trackpad, 1.05, .52, 0, -.42, .29);
  const T1 = printOn(base, "py", ["Ich entwickle Websites"], .13, -1.48, -.83, .425);
  // Deckel: liegt zu, klappt nach dem Einrasten seiner Flächen auf und rastet ein; innen der Bildschirm mit einer Website
  const lidP = new K.THREE.Group(); lidP.position.set(-1.5, .1, -.2); lap.add(lidP);
  const lid = box(-1.6, 1.6, 0, .06, 0, 2.1, { net: [.08, .06], face: [.25, .06], skip: [], v: { ny: V(0, 0, 1) } });
  lidP.add(lid);
  decalOn(lid, "ny", 1600, 1000, website, 2.95, 1.84, 0, 0, .33, .04);
  K.anim(b => { lidP.rotation.x = -1.83 * mech(win(b, .3, .08), .05); });

  // ---------- Handy: Onlineshops ----------
  const ph = new K.THREE.Group(); ph.position.set(1.35, 0, 1.45); ph.rotation.y = -.16; model.add(ph);
  K.anriss(ph, [[-.45, .45, -.85, .85]], .3, .1, .34, .14);
  const phone = box(-.45, .45, 0, .08, -.85, .85, { net: [.1, .05], face: [.27, .06] });
  ph.add(phone);
  decalOn(phone, "py", 400, 560, (x, W, H) => shop(x, W, H), .8, 1.12, 0, .2, .33);
  const T2 = printOn(phone, "py", ["und Onlineshops,"], .085, -.37, -.58, .46);

  // ---------- Rechner: Ihre übrigen Systeme ----------
  K.anriss(model, [[1.9, 3.4, -1.4, -.4]], .3, .1);
  const pc = box(1.9, 3.4, 0, 1.5, -1.4, -.4, { net: [.12, .06], face: [.29, .07], top: C.paper });
  model.add(pc);
  decalOn(pc, "pz", 900, 260, rack, 1.36, .4, 0, -.48, .36);
  const T3 = printOn(pc, "pz", ["binde sie an Ihre", "übrigen Systeme an"], .105, -.68, .08, .6);
  K.ticker(pc.userData.faces.pz.holder, .05, .55, .55, .002, .63);
  const T4 = printOn(pc, "py", ["und betreue sie,", "solange sie laufen."], .112, -.68, -.18, .66);
  // Kabel vom Laptop zum Rechner, zieht sich, sobald der Rechner steht
  K.cable([V(.1, .05, .1), V(.7, .03, -.35), V(1.5, .03, -.7), V(1.75, .15, -.95), V(1.9, .35, -.9)], .028, C.shade, .36, .06);

  // ---------- Projektmappe: Agenturen ----------
  const folder = new K.THREE.Group(); folder.position.set(-4.55, 0, 1.75); folder.rotation.y = .1; model.add(folder);
  K.anriss(folder, [[-1.05, 1.05, -.78, .78]], .3, .1);
  const fb = box(-1.05, 1.05, 0, .07, -.78, .78, { net: [.03, .06], face: [.2, .07], col: C.old, top: C.old });
  folder.add(fb);
  const tab = box(.35, 1.0, 0, .07, -.95, -.78, { net: [.07, .03], face: [.25, .04], col: C.old });
  folder.add(tab);
  const T5 = printOn(fb, "py", ["Agenturen holen mich", "als Entwickler ins Projekt,"], .118, -.9, -.05, .735);

  // ---------- Visitenkarte: direkt ----------
  const card = new K.THREE.Group(); card.position.set(2.5, 0, 3.0); card.rotation.y = -.08; model.add(card);
  K.anriss(card, [[-.95, .95, -.55, .55]], .3, .1, .34, .14);
  const cb = box(-.95, .95, 0, .03, -.55, .55, { net: [.15, .04], face: [.33, .05], col: C.white });
  card.add(cb);
  const T6 = printOn(cb, "py", ["Unternehmen arbeiten", "direkt mit mir."], .112, -.8, -.02, .835);

  // ---------- Nächster Abschnitt am Ende der Linie ----------
  const g1 = K.flat(["Gerwing · WooCommerce · seit 2023"], .17, -4.4, -15.2, .95, { track: .03, col: "#66666a" });
  const g2 = K.flat(["Pflaster nach Fläche bestellen"], .62, -4.5, -14.45, .96, { font: "serif" });

  // Statuspunkt in Weltkoordinaten: Mitte des Rechners + Lage auf der Front
  const LED = V(2.65 + .55, .75 + .55, -.4 + .01);
  const S = {
    name: { prints: [kicker, name], b: 0, az: 0, el: 62, with: [lap, ph, pc], grow: 2.4, growN: 1.12, bias: 1, biasN: 0, pxN: 16, px: 15, room: .68 },
    t1: { prints: [T1], az: -6, el: 40, with: [lap], grow: 1.5, growN: 1.15 },
    t2: { prints: [T2], az: 14, el: 60, with: [ph], grow: 1.3 },
    t3: { prints: [T3], az: -14, el: 10, with: [pc], grow: 1.2 },
    t4: { prints: [T4], az: -8, el: 46, with: [pc], grow: 1.2 },
    t5: { prints: [T5], az: 8, el: 52, with: [folder], grow: 1.3 },
    t6: { prints: [T6], az: -8, el: 54, with: [card], grow: 1.3 },
    g: { prints: [g1, g2], b: 1, az: 0, el: 55 }
  };
  return {
    track: 760,
    thread: { pts: [LED, V(3.2, .7, -.38), V(3.2, .006, -.25), V(3.9, .006, -.2), V(4.7, .006, -1.3), V(5.4, .006, -5.5), V(3.5, .006, -10.5), V(-1.0, .006, -13.0), V(-4.6, .006, -13.7)], t0: .89, t1: 1 },
    stops: Object.values(S),
    keys: [
      { w: 0, stop: S.name },
      // Kantenphase: tiefer und schräg von links, damit die senkrechten Kanten im Raum stehen (az ≈ -10°, el ≈ 33°, Abstand ≈ 11)
      { w: 1, b: .2, cam: V(-2.9, 6.3, 10.7), tgt: V(-1.0, .3, 1.6) },
      // Einrasten: näher, gleiche Seite (az ≈ -8°, el ≈ 38°, Abstand ≈ 9)
      { w: 1.2, b: .42, cam: V(-2.0, 6.0, 7.5), tgt: V(-1.0, .5, .4) },
      { w: .9, stop: S.t1 },
      { w: 1, stop: S.t2 },
      { w: 1.1, b: .54, cam: V(.3, 4.2, 5.5), tgt: V(2.0, .7, -.8) },
      { w: .9, stop: S.t3 },
      { w: .8, stop: S.t4 },
      { w: 1.1, stop: S.t5 },
      { w: 1, stop: S.t6 },
      { w: 1, b: .89, cam: V(-.4, 8.5, 12), tgt: V(-.6, .5, .4) },
      { w: 1, b: .94, cam: V(8.8, 6, 2.5), tgt: V(4.4, 0, -5) },
      { w: 1.1, stop: S.g }
    ]
  };
}
