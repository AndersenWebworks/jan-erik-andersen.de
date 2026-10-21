// Variante C – Vom Entwurf zur Technik: ein Schreibtisch aus Papier, Blick schräg von oben.
// Beim Laden (Auftakt bis b .29) zeichnen sich Tisch und Skizzenblatt als Netz, auf dem Blatt entsteht Strich für Strich
// eine Website-Skizze (b .0–.12), dann schließen sich Tisch- und Blattflächen (b .14–.28); die Skizze bleibt als Motiv liegen.
// Scrollen: die Tischflächen schließen sich, das Blatt klappt an seiner Hinterkante hoch, der Standfuß steigt aus
// der Tischplatte und hebt es zum Bildschirm, die Skizze füllt sich zur fertigen Seite (Websites und Onlineshops).
// Ein Kabel läuft über die Tischplatte zum Rechner am Boden (anbinden), dort tickt der Statuspunkt (betreuen).
// Satz 2 steht auf der vorderen Tischkante. Danach verlässt der rote Punkt den Rechner zum nächsten Abschnitt.
import { website, rack } from "./zeichnungen.js";

// Website-Skizze in Haarlinien, Koordinaten wie im Druckbild website (Breite 1000, Höhe 625)
function sketchSegs(P) {
  const segs = [];
  const line = (x0, y0, x1, y1) => segs.push([P(x0, y0), P(x1, y1)]);
  const rect = (x, y, w, h) => { line(x, y, x + w, y); line(x + w, y, x + w, y + h); line(x + w, y + h, x, y + h); line(x, y + h, x, y); };
  rect(60, 52, 130, 18);                                   // Kopfzeile: Marke
  for (let i = 0; i < 4; i++) line(560 + i * 100, 61, 630 + i * 100, 61); // Navigation
  line(0, 112, 1000, 112);                                 // Trennlinie unter dem Kopf
  rect(60, 170, 470, 46); rect(60, 236, 330, 46);          // Überschriftbalken
  for (let i = 0; i < 3; i++) line(60, 328 + i * 30, 500 - i * 60, 328 + i * 30); // Textzeilen
  rect(60, 430, 170, 50);                                  // Knopf
  rect(580, 160, 360, 320); line(580, 160, 940, 480); line(940, 160, 580, 480); // Bildfeld mit Diagonalen
  for (let c = 0; c < 3; c++) {                            // drei Spalten
    const X = 60 + c * 300;
    line(X, 568, X + 160, 568); line(X, 596, X + 250, 596); line(X, 616, X + 210, 616);
  }
  return segs;
}

export default function (K) {
  const { THREE, V, C, model, box, printOn, decalOn, mech, sm, win } = K;
  K.ground(-13, 13, -20, 8);

  // ---------- Name vor dem Tisch ----------
  const kicker = K.flat(["Webentwicklung · Raum Plau am See · remote"], .17, 0, 3.4, -1, { track: .03, col: "#66666a", anchor: "c" });
  const name = K.flat(["Jan-Erik Andersen"], .86, 0, 4.4, -1, { font: "serif", weight: 300, anchor: "c" });

  // ---------- Schreibtisch: Platte (Stirnfläche .3 hoch) und vier schlanke Beine ----------
  const desk = new THREE.Group(); model.add(desk);
  const top = box(-3.5, 3.5, 2.1, 2.4, -1.8, 1.6, { net: [0, .05], face: [.14, .1], col: C.old, top: C.paper });
  desk.add(top);
  [[-3.25, 1.35], [3.25, 1.35], [3.25, -1.55], [-3.25, -1.55]].forEach(([x, z], i) => {
    desk.add(box(x - .11, x + .11, 0, 2.1, z - .11, z + .11, { net: [.02 + i * .012, .04], face: [.19 + i * .012, .05], col: C.old }));
  });

  // ---------- Skizzenblatt, das zum Bildschirm wird ----------
  // Scharnier an der Hinterkante (z = -1.4) auf der Tischplatte; das Blatt liegt nach vorn bis z = 1.2.
  // Nach dem Klappen (-1.66 rad, leicht nach hinten geneigt) zeigt die Unterseite ny nach vorn:
  // mit v: ny = +z liegt „oben“ der Schrift auf der ehemaligen Vorderkante, also oben am Bildschirm.
  const sheetP = new THREE.Group(); sheetP.position.set(0, 2.401, -1.4); model.add(sheetP);
  const sheet = box(-1.75, 1.75, 0, .06, 0, 2.6, { net: [.035, .04], face: [.22, .06], skip: [], v: { ny: V(0, 0, 1) }, col: C.paper });
  sheetP.add(sheet);
  // Koordinaten im Blatt (Mitte des Quaders): Skizze oben liest sich liegend von vorn (Seitenkopf hinten),
  // die Kopie auf der Unterseite liest sich nach dem Klappen (Seitenkopf oben), deckungsgleich mit dem Druckbild.
  const sketchTop = K.netLines(sketchSegs((x, y) => V(-1.6 + 3.2 * x / 1000, .034, -1.15 + 2.0 * y / 625)));
  const sketchScr = K.netLines(sketchSegs((x, y) => V(-1.6 + 3.2 * x / 1000, -.034, 1.15 - 2.0 * y / 625)));
  sheet.add(sketchTop); sheet.add(sketchScr);
  K.net(sketchTop, .045, .08);
  K.net(sketchScr, .3, .07);
  const OP = .58;
  K.anim(b => {
    sketchTop.material.uniforms.uOp.value = OP * (1 - sm(win(b, .31, .05)));
    sketchScr.material.uniforms.uOp.value = OP * (1 - sm(win(b, .47, .06)));
  });
  const screen = decalOn(sheet, "ny", 1600, 1000, website, 3.2, 2.0, 0, .15, .41, .05);
  // Kinn unter dem Bild (ny von -1.3 bis -.85): Satzteil 1
  const T1 = printOn(sheet, "ny", ["Ich entwickle Websites", "und Onlineshops,"], .095, 0, -1.075, .43, { anchor: "c" });

  // Standfuß hinter dem Bildschirm, steigt aus der Tischplatte und hebt den Bildschirm an
  const stand = new THREE.Group(); stand.position.set(0, 2.4, -1.65); model.add(stand);
  stand.add(box(-.14, .14, 0, 1.0, -.1, .1, { net: [.32, .02], face: [.35, .04], col: C.old }));
  stand.add(box(-.6, .6, 0, .05, -.15, .15, { net: [.32, .02], face: [.35, .04], col: C.old }));
  K.anim(b => {
    sheetP.rotation.x = -1.66 * mech(win(b, .3, .08), .05);
    const k = mech(win(b, .37, .05));
    stand.scale.y = Math.max(.001, k); stand.visible = k > 0;
    sheetP.position.y = 2.401 + .3 * k;
  });

  // ---------- Rechner neben dem Tisch auf dem Boden ----------
  const pc = box(4.0, 5.4, 0, 2.0, -1.4, 0, { net: [.47, .04], face: [.51, .07], col: C.paper, top: C.paper });
  model.add(pc);
  decalOn(pc, "pz", 900, 300, rack, 1.2, .4, 0, -.55, .58);
  const T2 = printOn(pc, "pz", ["binde sie an Ihre", "übrigen Systeme an"], .1, -.58, .2, .6);
  K.ticker(pc.userData.faces.pz.holder, .05, .5, .72, .002, .62);
  const T3 = printOn(pc, "py", ["und betreue sie,", "solange sie laufen."], .1, -.56, 0, .65);
  // Kabel vom Standfuß über die Tischplatte, über die rechte Kante hinab in die Seite des Rechners
  K.cable([V(.2, 2.44, -1.72), V(1.6, 2.43, -1.62), V(3.0, 2.43, -1.45), V(3.45, 2.43, -1.35), V(3.63, 2.3, -1.25), V(3.8, 1.6, -1.05), V(4.0, 1.25, -.95)], .028, C.shade, .46, .06);

  // ---------- Satz 2 auf der vorderen Tischkante (pz, 7 × .3) ----------
  const T4 = printOn(top, "pz", ["Agenturen holen mich als Entwickler ins Projekt,"], .105, -1.75, 0, .71, { anchor: "c" });
  const T5 = printOn(top, "pz", ["Unternehmen arbeiten direkt mit mir."], .105, 1.8, 0, .77, { anchor: "c" });

  // ---------- Nächster Abschnitt am Ende der Linie ----------
  const g1 = K.flat(["Gerwing · WooCommerce · seit 2023"], .17, -4.4, -15.2, .95, { track: .03, col: "#66666a" });
  const g2 = K.flat(["Pflaster nach Fläche bestellen"], .62, -4.5, -14.45, .96, { font: "serif" });

  // Statuspunkt in Weltkoordinaten: Rechnermitte (4.7, 1.0, -.7) + Front (+.7 in z) + Lage auf der Front (.5, .72)
  const LED = V(4.7 + .5, 1.0 + .72, -.7 + .7 + .004);
  const S = {
    name: { prints: [kicker, name], b: 0, az: 0, el: 62, with: [desk, sheetP], grow: 3, bias: 1, px: 15, room: .68 },
    t1: { prints: [T1], az: -4, el: 16, with: [sheetP], grow: 1.6 },
    t2: { prints: [T2], az: 12, el: 12, with: [pc], grow: 1.3 },
    t3: { prints: [T3], az: 8, el: 55, with: [pc], grow: 1.3 },
    t4: { prints: [T4], az: 8, el: 12, with: [top], grow: 1.3 },
    t5: { prints: [T5], az: -8, el: 12, with: [top], grow: 1.3 },
    g: { prints: [g1, g2], b: 1, az: 0, el: 55 }
  };
  return {
    track: 760, introB: .29, introT: 4.2,
    thread: { pts: [LED, V(5.2, 1.6, .25), V(5.2, .006, .4), V(6.6, .006, -1.2), V(7.2, .006, -5.5), V(5.0, .006, -10.5), V(.5, .006, -13.0), V(-4.6, .006, -13.7)], t0: .89, t1: 1 },
    stops: Object.values(S),
    keys: [
      { w: 0, stop: S.name },
      // Überblick Tisch + klappendes Blatt: Ziel Mitte Tisch/Bildschirm, Abstand ≈ 1,5 × Tischbreite, el ≈ 35°
      { w: 1.1, b: .3, cam: V(-1.4, 8.7, 7.8), tgt: V(0, 3.0, -.2) },
      { w: 1, stop: S.t1 },
      // Überblick Bildschirm bis Rechner (x -1.75 … 5.4): Ziel Mitte, Abstand ≈ 10, el ≈ 28°, von rechts
      { w: 1.1, b: .54, cam: V(5.6, 7.1, 7.6), tgt: V(2.6, 2.4, -.7) },
      { w: .9, stop: S.t2 },
      { w: .8, stop: S.t3 },
      { w: 1.1, stop: S.t4 },
      { w: .9, stop: S.t5 },
      // Gesamtüberblick (x -3.5 … 5.4), Abstand ≈ 15, el ≈ 40°
      { w: 1, b: .89, cam: V(3.5, 11.1, 10.8), tgt: V(1.5, 1.5, -.5) },
      // dem Punkt folgen: von rechts auf den Bodenweg
      { w: 1, b: .94, cam: V(10.5, 6.5, 1.5), tgt: V(6.0, 0, -5) },
      { w: 1.1, stop: S.g }
    ]
  };
}
