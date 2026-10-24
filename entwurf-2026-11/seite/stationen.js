// Stationstabelle der Seite (Kamera-Umbau 23.10.2026): alle Zahlen, die Bahn, Inseln, Punkt und Kamera bestimmen, an einer Stelle.
// Eine Station verschieben = eine Zahl hier ändern. kern.js baut daraus die eine Bahn (Szenenläufe und Fluss), die Lage der Inseln (Karte) und die Spur des Kamera-Rigs.
//
// BAHN: der Fluss zwischen den Inseln (Welteinheiten). FL Länge eines Flugs in der Reihe, FA seitlicher Versatz des S-Bogens (die Insel versetzt den Lauf nach rechts,
//   der Fluss gleich weit zurück: gleiche Amplitude), RT Radius der Viertelbögen um die Scheitelinsel, L0/L1 gerade Stücke davor/danach, Q Abstand der Mündung unter
//   der Wortmarke. DOT_V: Tempo des Punktes (Welteinheiten je vh Scrollweg), überall gleich; SLOW_F: Tempo an Lesestellen (Anteil), SLOW_SH: weiche Schulter (Einheiten).
//   ST_W: wie stark die Stationen den Faden in der Insel anziehen (klein = ruhiger Faden, der Punkt darf an einer Lesestelle danebenliegen), R_MAX/R_MIN: gewünschter bzw. kleinster erlaubter Radius
//   des Fadens in der Insel, GUIDE_W: Zug der Umwege um Bauteile (A*-Korridor), A2: Steifigkeit des Fadens (größer = weniger Krümmung, weite ruhige Bögen; je Szene überschreibbar: faden.stW, faden.rMin, faden.a2).
export const BAHN = { FL: 30, FA: 12, RT: 40, L0: 4, L1: 4, Q: 4.2, DOT_V: .17, SLOW_F: .08, SLOW_SH: 3, GROUP_GAP: 90, ST_W: 4, R_MIN: 2.85, R_MAX: 8, A2: .2, GUIDE_W: .08 };
// RIG: Vorgaben der Kamera. chase = Mausperspektive im Fluss (hinter dem Punkt: back, Höhe h, Blick voraus ahead auf Höhe ty), follow = in der Insel (feste Blickrichtung
//   der Szene; side/tx seitlich), je d (Breitbild) und n (hochkant). rampIn/rampOut/rampMid: weiche Übergänge zu und von Lesestellen (vh), join: nahe Lesestellen gehen ohne
//   Zwischenstellung ineinander über (vh), lambda: Wechsel Fluss ↔ Insel (vh), yawK/yawWin: im Fluss folgt der Blick zu yawK der Richtung des Fadens, sonst der über ±yawWin vh
//   gemittelten Richtung, smooth: Glättung (vh), frame: Rahmen für den Punkt (NDC; außerhalb dreht der Blick weich mit).
export const RIG = {
  chase: { d: { back: 4.6, h: .85, ahead: 9, ty: .25 }, n: { back: 5.6, h: 1.0, ahead: 11, ty: .25 } },
  follow: { d: { back: 8, h: 2.7, ahead: 3, ty: .6, side: 0, tx: 0 }, n: { back: 10.5, h: 3.4, ahead: 3, ty: .8, side: 0, tx: 0 } },
  rampIn: 150, rampOut: 150, rampMid: 90, join: 150, lambda: 150, yawK: .15, yawWin: 260, smooth: 7,
  frame: { x: .82, y0: -.76, y1: .74 }
};
// STATIONEN je Szene (Name wie in folge.js):
//   len    Scrollweg der Szene in vh (d/n); so gewählt, dass der Punkt dort mit DOT_V läuft (kern.js meldet Abweichungen über 12 % mit dem passenden Wert)
//   R      Radius der Insel; door [Eingang, Ausgang]: seitliche Lage der Türen im Inselmaß (vorn bzw. hinten am Rand), ctr: Mitte der Insel gegen die Mitte des Inhalts
//   lane   Tiefe der Laufbahn vor den Bauteilen (Szenenkoordinaten z; ohne Angabe gerechnet)
//   view   Rig-Werte in der Insel (überschreibt RIG.follow), faden: { way: [[x, z, k, Gewicht]], free: [[x0, x1, z0, z1]], noGuide }
//   stops  je Lesestelle (Nummer in der Szene ab 1): near [x, z] Wunschlage des Punktes (Umkreis nearR, sonst 1,7 bzw. 2,6 hochkant), at [x, z] feste Station, hold Haltezeit (vh), pose: Werte der Lesestellung (px, tilt, sx, sy, yaw …)
//   Werte mit { d, n } gelten je Breitbild bzw. hochkant.
export const STATIONEN = {
  // Eröffnung: Tablett (Lesestelle 3) steil von oben, damit die liegende Schrift kaum schräg steht
  // Eröffnung: vom Tablett (steil von oben) langer, weicher Wechsel zur Verfolgung (rampOut, vh)
  eroeffnung: { len: { d: 1650, n: 1650 }, rampOut: 520, R: 18, door: { d: [0, 11.2], n: [0, 9.6] }, stops: { 3: { pose: { pitch: 83, npitch: 83, px: 28, pxN: 22 } } } },
  gerwing: { len: { d: 1095, n: 1049 }, R: 21.5, door: { d: [-12, 15], n: [-12, 13] },
    view: { d: { back: 5.2, h: 2.2, ahead: 2.6, ty: .55, side: -.8, tx: .4 }, n: { back: 6.8, h: 2.8, ahead: 2.6, ty: .6, side: -.4, tx: 0 } },
    // durch die Lücke zwischen zweiter und dritter Halle (1,0 breit): dort nur 0,25 Abstand zu den Bauteilen
    // Wand: von links vorn kommend, der Punkt biegt vor der Wand nach rechts und steht beim Lesen links unten an der Wand
    faden: { clear: .25, way: { d: [], n: [] } },
    // Wand mit dem Gerwing-Text: frontal (Schräge unter 15°), etwas größere Schrift
    stops: { 1: { near: [-9.8, -4.4], d: { pose: { frontal: true, tilt: 6, yaw: -2, px: 23.8, sy: 0 } } } } },
  // Betreuung: von vorn rechts am Bildschirmfuß vorbei zur Uhr, am Kalender vorbei, rechts um ihn herum nach hinten
  betreuung: { len: { d: 515, n: 487 }, R: 18, faden: { way: [[1.8, 6.5, 0, 2], [12.2, 2.6, 2, 2], [11.6, -5, 2, 2]] } },
  // Modernisierung: der flach gelegte Röhrenmonitor wird schräg von vorn gelesen (76°, Schräge 14°), nicht senkrecht von oben
  modernisierung: { len: { d: 392, n: 435 }, R: 18, faden: { free: [[-5.5, 3.2, 5.2, 7]] }, stops: { 1: { pose: { pitch: 76, npitch: 76 } } } },
  // Shop: Überschrift und Regal werden von links vorn gelesen, der Wechsel vor der Brücke; rechts an den Kartons vorbei nach hinten
  shop: { len: { d: 665, n: 658 }, R: 18, stops: { 1: { near: [-5.2, 2.6] }, 2: { near: [-3.3, 1.9] }, 3: { near: [0.6, 1.6] } },
    faden: { way: [[-7, 6, 0, 2]] } },
  // Schnittstellen: WBG-Seite (Lesestelle 4) mit größerer Schrift (die Kennzeile ist der kleinste Druck)
  schnittstellen: { len: { d: 915, n: 980 }, R: 18, door: [-12, 6], stops: { 1: { near: [-5.8, 10.9] }, 2: { near: [2.4, 10.9] }, 3: { near: [5.6, 10.9] }, 4: { near: [10.8, 10.9], d: { pose: { px: 24 } } } }, lane: 10.9,
    faden: { way: [[20.6, 9.5, 4, 2], [20.8, -6, 4, 2]] } },
  // Gestaltung: alle Blätter liegen auf derselben Staffelei (Schrift nach vorn, +z). Sichtbarer Boden beim frontalen Lesen ist der hinter der Staffelei: die Station liegt
  // links hinter ihr vor der Fensterwand (z −2,4), der Punkt kommt links vorn herein, läuft hinter der Staffelei nach rechts und rechts um die Wand nach hinten
  gestaltung: { len: { d: 900, n: 770 }, R: 18, door: [-8, 9], stops: { 1: { near: [-3.0, -1.25] }, 2: { near: [-3.0, -1.25] }, 3: { near: [-3.0, -1.25] }, 4: { near: [-3.0, -1.25] } },
    faden: { way: [[-5.4, 2.6, 0, 2], [-4.6, -.6, 0, 2], [0, -1.3, 4, 2], [3.6, -1.2, 4, 2], [7.8, -1.2, 4, 2], [8.4, -4.6, 4, 2]] } },
  ausserdem: { len: { d: 925, n: 880 }, R: 18, door: [-13, 11] },
  // Wie ich arbeite: Titel vorn, dann in weitem Bogen links herum zu den Armen, an Band und Prüfrahmen entlang nach rechts, rechts nach hinten
  arbeitsweise: { len: { d: 898, n: 911 }, R: 18, door: [-6, 11],
    faden: { way: [[-8, 6.4, 1, 2], [9.3, .8, 6, 2], [9.8, -5, 6, 2]] } },
  // Werdegang: Eingang rechts vor dem Titel, der Punkt läuft vor der Treppe nach links und an ihrem Fuß links entlang nach hinten; die Kamera liest jede Setzstufe
  // tief von links (Text oben rechts im Bild, der Punkt unten links auf dem Boden neben der Treppe)
  werdegang: { len: { d: 1280, n: 1258 }, R: 18, door: [9, -6],
    // Lesestellung der Setzstufen: frontal (Erik: Stufen frontal lesbar), der Punkt am Treppenfuß darf dabei am Bildrand oder knapp außerhalb sein
    stops: Object.fromEntries([2, 3, 4, 5, 6, 7, 8, 9].map(n => [n, { near: [-4.8, 4.3 - 1.9 * n], nearR: .3, d: { pose: { frontal: true, tilt: 6, sx: 0, sy: 0, px: 28 } }, n: { pose: { frontal: true, ntilt: 6, nsx: 0, nsy: 0, pxN: 22 } } }])),
    // gerade am Treppenfuß entlang (die Stationen ziehen kaum, der Faden zackt nicht)
    faden: { stW: .01, way: [[-4.8, 2.5, 1, 4], ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => [-4.8, 4.3 - 1.9 * (i + 1) - .95, i + 1, 4])] } },
  // Zusammenarbeit: ruhiger Weg (Erik: lieber ruhig als um jedes Bauteil): vom Titel links an der linken Station vorbei nach hinten, hinter der Tafel in weitem Bogen nach
  // rechts zur rechten Station und zum Ausgang. Hinter der Tafel ist der Punkt verdeckt, an den Lesestellen steht er links bzw. rechts neben der Wand.
  agenturen: { len: { d: 1128, n: 1315 }, R: 18, stops: { 1: { near: [12.4, 6.8] }, 2: { near: [9.4, -3.4] }, 3: { near: [23.6, -9.6] }, 4: { near: [23.6, -9.6] } },
    faden: { clear: .5, way: [[9.8, 2, 1, 2], [10.6, -8.6, 2, 2], [16.5, -10.8, 2, 2]] } }
};
