// Variante B – Die Seite baut sich selbst: das Konstrukt ist die Website, die man gerade ansieht, als Papiermodell.
// Auf dem Boden liegt ein Browserfenster als flaches Blatt. Daraus heben sich Papierlagen gestaffelt auf Stegen:
// Kopfzeile, Überschrift (Name, steht von Anfang an), Textblock (Websites und Onlineshops) mit drei Shop-Kacheln,
// hinter dem Fenster ein Kabel zum System-Quader (anbinden, betreuen), vorn zwei Knopf-Lagen (Satz 2).
// Beim Laden zeichnen sich die Netze der Satz-1-Bauteile (b .0–.12), dann klappen ihre Flächen ein und die Lagen heben
// sich (b .14–.28): das Startbild ist fertiges Papier. Scrollen erzählt den Satz: Bilder blenden ein, Drucke ab b .38,
// Kabel zieht sich, Statuspunkt startet. Die Knöpfe (Satz 2) entstehen erst beim Scrollen mit Netz und Fläche.
// Danach verlässt der rote Punkt das System und läuft auf der Messlinie zum nächsten Abschnitt.
export default function (K) {
  const { V, C, model, box, printOn, decalOn, mech, win } = K;
  const G = () => new K.THREE.Group();
  const INK = a => `rgba(48,48,51,${a})`;
  K.ground(-13, 13, -20, 8);

  const Y0 = .05;   // Oberseite des Fensterblatts
  const TH = .05;   // Stärke einer Lage

  // ---------- Druckbilder (nur Striche und Flächen, kein Text) ----------
  // Fensterrahmen: Titelleiste hinten (oben im Bild), drei Kreise links, Adressfeld, Haarrahmen
  const frame = (x, W, H) => {
    const s = W / 9.0;
    x.fillStyle = C.old; x.fillRect(0, 0, W, .62 * s);
    x.strokeStyle = INK(.35); x.lineWidth = 2; x.beginPath(); x.moveTo(0, .62 * s); x.lineTo(W, .62 * s); x.stroke();
    x.strokeStyle = INK(.6); x.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { x.beginPath(); x.arc((.4 + i * .3) * s, .31 * s, .08 * s, 0, Math.PI * 2); x.stroke(); }
    x.strokeStyle = INK(.3); x.lineWidth = 2; x.beginPath(); x.roundRect(2.2 * s, .17 * s, 4.6 * s, .28 * s, .14 * s); x.stroke();
    x.strokeStyle = INK(.5); x.lineWidth = 3; x.strokeRect(1.5, 1.5, W - 3, H - 3);
  };
  // Navigation: Logo-Balken links, vier Menüstriche, Knopf rechts
  const nav = (x, W, H) => {
    const s = W / 8.2;
    x.fillStyle = INK(.85); x.fillRect(.25 * s, .24 * s, 1.1 * s, .12 * s);
    x.fillStyle = INK(.4); for (let i = 0; i < 4; i++) x.fillRect((4.2 + i * .65) * s, .26 * s, .45 * s, .08 * s);
    x.strokeStyle = INK(.75); x.lineWidth = 3; x.beginPath(); x.roundRect(6.85 * s, .16 * s, 1.05 * s, .28 * s, .06 * s); x.stroke();
  };
  // Produktkachel: Bildfläche mit Horizontlinie, Namensstrich, Preisstrich
  const product = (x, W, H) => {
    x.fillStyle = INK(.1); x.fillRect(0, 0, W, H * .64);
    x.strokeStyle = INK(.25); x.lineWidth = 2; x.beginPath();
    x.moveTo(0, H * .64); x.lineTo(W * .32, H * .34); x.lineTo(W * .55, H * .52); x.lineTo(W * .72, H * .4); x.lineTo(W, H * .64); x.stroke();
    x.fillStyle = INK(.45); x.fillRect(0, H * .73, W * .7, H * .045);
    x.fillStyle = INK(.85); x.fillRect(0, H * .86, W * .3, H * .06);
  };
  // Knopf: Pillenrahmen mit Haarkante
  const pill = (x, W, H) => {
    x.strokeStyle = INK(.55); x.lineWidth = 3; x.beginPath(); x.roundRect(2, 2, W - 4, H - 4, (H - 4) / 2); x.stroke();
  };

  // Lage: flaches Blatt auf schmalen Stegen; hebt sich im Fenster lift = [t0, d] auf Höhe H (null = steht schon)
  function layer(x0, x1, z0, z1, H, net, face, lift, top = C.white) {
    const g = G(); model.add(g);
    const up = G(); g.add(up);
    const sheet = box(x0, x1, 0, TH, z0, z1, { net, face, col: C.paper, top });
    up.add(sheet);
    const legs = G(); legs.position.y = Y0; g.add(legs);
    const xs = [x0 + .35, x1 - .35]; if (x1 - x0 > 5) xs.splice(1, 0, (x0 + x1) / 2);
    const dz = Math.min(.2, (z1 - z0) * .15);
    for (const sx of xs) legs.add(box(sx - .03, sx + .03, 0, H, z0 + dz, z1 - dz, { net, face, col: C.shade }));
    K.anim(b => {
      const k = lift ? mech(win(b, lift[0], lift[1]), .02) : 1;
      up.position.y = Y0 + .001 + H * k;
      legs.scale.y = Math.max(.001, k);
    });
    return { g, sheet };
  }

  // ---------- Browserfenster am Boden ----------
  const winB = box(-4.5, 4.5, 0, Y0, -4.0, 3.1, { net: [0, .05], face: [.14, .04], col: C.shade, top: C.paper });
  model.add(winB);
  decalOn(winB, "py", 1440, 1136, frame, 9.0, 7.1, 0, 0, .2, .03);

  // ---------- 1. Kopfzeile ----------
  const head = layer(-4.1, 4.1, -3.15, -2.55, 1.2, [.015, .04], [.16, .04], [.19, .05]);
  decalOn(head.sheet, "py", 1640, 120, nav, 8.2, .6, 0, 0, .22, .03);

  // ---------- 2. Überschrift: Name, steht von Anfang an ----------
  const nameL = layer(-4.1, 4.1, -2.3, -.7, .92, [-1, .001], [-1, .001], null);
  const kicker = printOn(nameL.sheet, "py", ["Webentwicklung · Raum Plau am See · remote"], .16, -3.7, .55, -1, { track: .03, col: "#66666a" });
  const name = printOn(nameL.sheet, "py", ["Jan-Erik Andersen"], .72, -3.7, -.15, -1, { font: "serif", weight: 300 });

  // ---------- 3. Textblock: Websites und Onlineshops ----------
  const textL = layer(-4.1, -.9, -.3, .9, .62, [.03, .04], [.19, .04], [.22, .05]);
  const T1 = printOn(textL.sheet, "py", ["Ich entwickle Websites"], .15, -1.35, .12, .38);
  const T2 = printOn(textL.sheet, "py", ["und Onlineshops,"], .15, -1.35, .12 - 1.36 * .15, .48);
  // Platzhalterzeilen im Startbild; sie weichen, sobald der Satz gedruckt wird
  const ph = decalOn(textL.sheet, "py", 900, 300, (x, W, H) => { x.fillStyle = "rgba(48,48,51,.16)"; [.82, .7, .76, .5].forEach((w, i) => x.fillRect(0, H * (.12 + i * .22), W * w, H * .09)); }, 2.7, .9, -.05, 0, -1);
  K.anim(b => { const o = 1 - K.sm((b - .33) / .04); ph.mat.opacity = o; ph.mesh.visible = o > .001 && b > .2; });

  // ---------- 4. Drei Shop-Kacheln ----------
  const tiles = G(); model.add(tiles);
  const TW = (4.6 - .6) / 3;
  for (let i = 0; i < 3; i++) {
    const x0 = -.5 + i * (TW + .3);
    const tb = box(x0, x0 + TW, Y0, Y0 + .38, -.35, .95, { net: [.045 + i * .01, .03], face: [.20 + i * .02, .03], col: C.paper, top: C.white });
    tiles.add(tb);
    decalOn(tb, "py", 400, 400, product, 1.1, 1.1, 0, 0, .24 + i * .01, .03);
  }

  // ---------- 5. Hinter dem Fenster: Kabel zum System ----------
  K.cable([V(.9, .03, -3.98), V(1.0, .025, -4.6), V(1.4, .025, -5.6), V(1.9, .12, -6.2), V(2.2, .35, -6.2)], .03, C.shade, .52, .05);
  const sys = box(2.2, 4.2, 0, 1.3, -6.8, -5.6, { net: [.45, .04], face: [.49, .05], col: C.paper, top: C.paper });
  model.add(sys);
  decalOn(sys, "pz", 900, 225, (x, W, H) => {
    x.strokeStyle = INK(.3); x.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(W * .06, H * (.18 + i * .13)); x.lineTo(W * .46, H * (.18 + i * .13)); x.stroke(); }
    x.beginPath(); x.roundRect(W * .56, H * .25, W * .38, H * .5, W * .01); x.stroke();
  }, 1.8, .45, 0, -.38, .57, .03);
  const T3 = printOn(sys, "pz", ["binde sie an Ihre", "übrigen Systeme an"], .115, -.85, .12, .60);
  K.ticker(sys.userData.faces.pz.holder, .055, .75, .45, .002, .62);
  const T4 = printOn(sys, "py", ["und betreue sie,", "solange sie laufen."], .12, -.85, -.05, .64);

  // ---------- 6. Satz 2 auf zwei Knopf-Lagen ----------
  const btn1 = layer(-4.1, -.25, 1.5, 2.5, .3, [.69, .03], [.72, .03], [.745, .04], C.old);
  decalOn(btn1.sheet, "py", 900, 200, pill, 3.6, .8, 0, 0, .785);
  const T5 = printOn(btn1.sheet, "py", ["Agenturen holen mich", "als Entwickler ins Projekt,"], .14, 0, 0, .79, { anchor: "c" });
  const btn2 = layer(.25, 4.1, 1.5, 2.5, .3, [.75, .03], [.78, .03], [.80, .04]);
  decalOn(btn2.sheet, "py", 900, 200, pill, 3.6, .8, 0, 0, .84);
  const T6 = printOn(btn2.sheet, "py", ["Unternehmen arbeiten", "direkt mit mir."], .14, 0, 0, .845, { anchor: "c" });

  // ---------- Nächster Abschnitt am Ende der Linie ----------
  const g1 = K.flat(["Gerwing · WooCommerce · seit 2023"], .17, -4.4, -14.5, .95, { track: .03, col: "#66666a" });
  const g2 = K.flat(["Pflaster nach Fläche bestellen"], .62, -4.5, -13.75, .96, { font: "serif" });

  // Statuspunkt in Weltkoordinaten: Mitte des Systems (3.2, .65, -6.2) + Frontfläche (z -5.6) + Lage auf der Front
  const LED = V(3.2 + .75, .65 + .45, -5.6 + .0035);
  const S = {
    name: { prints: [kicker, name], b: 0, az: 0, el: 60, with: [winB], grow: 3, bias: 1, px: 15, room: .62 },
    t1: { prints: [T1], az: -8, el: 48, with: [textL.g], grow: 1.4 },
    t2: { prints: [T2], az: 6, el: 50, with: [tiles], grow: 1.3 },
    t3: { prints: [T3], az: 30, el: 18, with: [sys], grow: 1.4 },
    t4: { prints: [T4], az: 20, el: 55, with: [sys], grow: 1.25 },
    t5: { prints: [T5], az: -4, el: 50, with: [btn1.g], grow: 1.3 },
    t6: { prints: [T6], az: 4, el: 50, with: [btn2.g], grow: 1.3 },
    g: { prints: [g1, g2], b: 1, az: 0, el: 55 }
  };
  return {
    track: 760, introB: .29, introT: 4.2,
    thread: { pts: [LED, V(3.95, .7, -5.5), V(3.95, .006, -5.35), V(4.7, .006, -5.45), V(5.4, .006, -6.6), V(5.6, .006, -9.5), V(3.0, .006, -12.0), V(-1.0, .006, -12.9), V(-4.6, .006, -13.0)], t0: .89, t1: 1 },
    stops: Object.values(S),
    keys: [
      { w: 0, stop: S.name },
      { w: 1.1, b: .34, cam: V(-1.5, 9.0, 9.5), tgt: V(0, .4, -.6) },
      { w: 1, stop: S.t1 },
      { w: 1, stop: S.t2 },
      { w: 1.1, b: .55, cam: V(7.5, 8.5, 6.5), tgt: V(1.8, .5, -3.2) },
      { w: .9, stop: S.t3 },
      { w: .8, stop: S.t4 },
      { w: 1.1, b: .73, cam: V(0, 8, 10.5), tgt: V(0, .3, .6) },
      { w: 1, stop: S.t5 },
      { w: 1, stop: S.t6 },
      { w: 1, b: .89, cam: V(9.5, 7.5, -1.5), tgt: V(3.2, .5, -6) },
      { w: 1, b: .94, cam: V(9, 6, -6.5), tgt: V(3.5, 0, -10.5) },
      { w: 1.1, stop: S.g }
    ]
  };
}
