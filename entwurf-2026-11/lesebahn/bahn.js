// Lesebahn-Baukasten (entwurf-2026-11/lesebahn/), zweiteilig:
//  (1) bahn(K, o): die gemeinsame Bahn-Schicht. Aus einer Satzliste, einer Grundlinie (Start, Richtung +x, Abstand) und einer Trägerform entstehen
//      Träger, Lesestellen (Kamera), Fadenpunkte (Haltepunkte am Träger), thread.map (der Punkt hält an jedem Träger) und Kameraschlüssel.
//  (2) Trägerformen (FORMEN.*): austauschbare Geometrie/Mechanik je Szene. Eine Form baut nur den Träger (Fläche, Falz, Stütze, Öse, Text)
//      und nennt den Haltepunkt des Fadens; Satzumbruch, Zeiten, Schriftgrößen, Kamera und Faden macht die Bahn-Schicht.
// Anleitung und Beispiel für eigene Formen: LESEBAHN-BAUKASTEN.md
const PI = Math.PI;
const EC = .2;                      // Bezugsgröße der Schrift (em in Welteinheiten); alle Träger lesen sich bei gleichem Abstand gleich groß: px wächst mit e / EC
const LH = 1.25;                    // Zeilenhöhe der Sätze
const ink = a => `rgba(48,48,51,${a})`;

// Satz ganz auf den Träger: Umbruch nur an Wortgrenzen, möglichst gleichmäßig lange Zeilen (gemessen mit K.measure, Breiten in em)
export function wrap(K, text, maxEm) {
  const words = text.split(" "), count = m => { let n = 1, cur = ""; for (const w of words) { const t = cur ? cur + " " + w : w; if (cur && K.measure([t]).tw > m) { n++; cur = w; } else cur = t; } return n; };
  const n0 = count(maxEm); let m = maxEm; while (count(m - .4) === n0 && m > 6) m -= .4;
  const lines = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (cur && K.measure([t]).tw > m) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur); return lines;
}
// deterministische Streuung 0 … 1 (Zettel sind von Hand geschnitten, aber bei jedem Laden gleich)
const rnd = (i, k) => { const s = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };

// ===================================================================================================
// Trägerform „Anhänger“: Papierzettel mit Fußlasche und Öse, steht auf einem Falz, zwei Seitenstützen klappen hinten aus
// ===================================================================================================
// Aufbau (Bogen, flach): Fuß (Lasche mit zwei Ösen, liegt vor der Grundlinie z) – Falz bei z – Zettel (hinter der Grundlinie, leicht
// unregelmäßig geschnitten: schräge Oberkante, abgeschnittene Ecke, nach innen geneigte Ränder) – links und rechts je ein Dreieck (Stütze).
// Aufgeklappt: Der Zettel steht um den Neigungswinkel der Kamera zurückgelehnt auf dem Fuß, die Stützen klappen senkrecht nach hinten
// (bis zum Boden), die Schrift ist der Kamera zugewandt. Der Faden liegt über dem Fuß und läuft durch beide Ösen.
// Platzbedarf in der Bahn: Breite des Zettels; die Stützen ragen seitlich je ws·cos(Neigung) heraus (it.side), die Bahn-Schicht rechnet das zum Abstand dazu.
const anhaenger = {
  name: "anhaenger",
  maxEm: narrow => narrow ? 21 : 24,
  // Fußtiefe (Welt): fest, damit der Faden bei allen Trägern auf einer Geraden läuft
  FD: .46,
  build(c) {
    const { K, x, z, lines, e, tw, th, i, t, lean, tag } = c, { Q, R } = K;
    const FD = anhaenger.FD;
    const mx = 1.9 * e, mt = 1.5 * e, mb = 2.1 * e;               // Ränder (Seiten, oben, unten) in Welteinheiten
    const Wc = tw + 2 * mx, Hc = mt + th + mb;
    const col = c.col || K.COL.WHITE.map((v, k) => [.969, .957, .925][k]);   // Papierfarbe wie der Bogen, eine Spur wärmer als weiß
    const sgn = i % 2 ? 1 : -1, tilt = e * .34 * sgn * (.8 + .4 * rnd(i, 1)), cutX = e * (1.3 + .7 * rnd(i, 2)), cutY = e * (1.0 + .6 * rnd(i, 3));
    const slR = -e * .12 * (1 + rnd(i, 4)), slL = e * .1 * (1 + rnd(i, 5));       // Ränder oben leicht nach innen geneigt (Handschnitt)
    const Hs = Math.min(Hc - cutY - Math.abs(tilt) - .15, Hc * .62);               // Höhe des geraden Randstücks (hier hängen die Stützen)
    // Fuß: flache Lasche vor der Grundlinie (Faltplan)
    const foot = K.panel(R, [x, z + FD], [x + Wc, z + FD], [0, -1], t.line + .02, .02, 0, { nofold: true, over: 0 });
    K.rect(foot, 0, 0, Wc, FD, col, .42);
    // Zettel: am hinteren Rand des Fußes angeschlagen (Falz bei z), steht um die Neigung zurückgelehnt
    const nd = K.panel(foot, foot.uv(0, FD), foot.uv(Wc, FD), [0, -1], t.rise, .045, Q - lean, { over: .04 });
    // Umriss gegen den Uhrzeigersinn ab der Fußkante (0,0); jeder Punkt liegt (vom ersten aus gesehen) im Winkel hinter dem vorigen, damit der Fächer sauber füllt
    const L = Hc + tilt, Rr = Hc - tilt;                                         // linke und rechte Oberkante (schräg geschnitten)
    const pts = sgn > 0 ? [[0, 0], [Wc, 0], [Wc, Hs], [Wc + slR, Rr - cutY], [Wc + slR - cutX, Rr], [slL, L], [0, Hs]]
      : [[0, 0], [Wc, 0], [Wc, Hs], [Wc + slR, Rr], [slL + cutX, L], [slL, L - cutY], [0, Hs]];
    K.P(nd, pts, col, .3);
    // Stützen: Dreiecke an den geraden Rändern, klappen senkrecht nach hinten (bis zum Boden)
    const ws = Math.min(.42, Hs * .5), ug = ws * Math.sin(lean), vg = ws * Math.cos(lean), uT = Math.min(Hs * .9, .75);
    const tw0 = t.rise + .03;
    const wl = K.panel(nd, nd.uv(0, 0), nd.uv(0, uT), [-1, 0], tw0, .035, -Q, { over: .07 });
    K.P(wl, [[0, 0], [uT, 0], [ug, vg]], col, .3);
    const wr = K.panel(nd, nd.uv(Wc, 0), nd.uv(Wc, uT), [1, 0], tw0 + .004, .035, -Q, { over: .07 });
    K.P(wr, [[0, 0], [uT, 0], [ug, vg]], col, .3);
    // gedruckte Falzlinie (gestrichelt) knapp unter dem Text, zwei Ösen im Fuß
    const dash = K.decal(Math.max(256, Math.round((Wc - .3) * 220)), 14, (x2, w, h) => { x2.strokeStyle = ink(.34); x2.lineWidth = 3; x2.setLineDash([16, 12]); x2.beginPath(); x2.moveTo(0, h / 2); x2.lineTo(w, h / 2); x2.stroke(); }, Wc - .3, (Wc - .3) * 14 / Math.max(256, Math.round((Wc - .3) * 220)), t.rise + .02);
    K.onPanel(nd, dash, Wc / 2, mb * .42, 1);
    const od = Math.min(.36, FD * .8), u1 = mx + 2 * e, u2 = Wc - mx - 2 * e;
    const eyelet = (x2, w, h) => {
      const r = w / 2; x2.translate(r, r);
      x2.fillStyle = "#e9e3d6"; x2.strokeStyle = ink(.5); x2.lineWidth = r * .08; x2.beginPath(); x2.arc(0, 0, r * .92, 0, 2 * PI); x2.fill(); x2.stroke();
      x2.fillStyle = ink(.22); x2.beginPath(); x2.arc(0, 0, r * .46, 0, 2 * PI); x2.fill();
      x2.strokeStyle = ink(.55); x2.lineWidth = r * .07; x2.stroke();
      x2.strokeStyle = "rgba(255,255,255,.7)"; x2.lineWidth = r * .06; x2.beginPath(); x2.arc(0, 0, r * .7, PI * 1.05, PI * 1.45); x2.stroke();
    };
    for (const u of [u1, u2]) K.onPanel(foot, K.decal(256, 256, eyelet, od, od, t.rise), u, FD / 2, 1);
    // Unterkante der Fußlasche: gedruckte Linie über die ganze Breite (die Haarkante allein verschwindet auf dem weißen Bogen), mit zwei Ösenkerben
    const fw = Math.max(256, Math.round(Wc * 220)), fh = 10;
    K.onPanel(foot, K.decal(fw, fh, (x2, w, h) => { x2.strokeStyle = ink(.5); x2.lineWidth = 3.2; x2.lineCap = "round"; x2.beginPath(); x2.moveTo(2, h / 2); x2.lineTo(w - 2, h / 2); x2.stroke(); }, Wc, Wc * fh / fw, t.line + .03), Wc / 2, .02, 1);
    const pr = K.print(lines, e, t.text, { lh: c.lh });
    K.onPanel(nd, pr, mx - pr.t.padX * e + pr.w / 2, Hc - mt + .34 * e - pr.h / 2, 1);
    const zA = z + FD / 2;
    return { w: Wc, h: Hc, pr, nd, foot, anchor: [x + u1, .004, zA], anchors: [[x + u1, .004, zA], [x + u2, .004, zA]], quiet: [nd, wl, wr], side: vg, tags: [tag] };
  }
};

export const FORMEN = { anhaenger };

// ===================================================================================================
// Bahn-Schicht
// ===================================================================================================
// o: {
//   prefix: "s"                         Namenspräfix der Lesestellen (s1, s2, …) und Teile (Tags)
//   form: FORMEN.anhaenger              Trägerform (siehe oben und LESEBAHN-BAUKASTEN.md)
//   x0: linke Kante des ersten Trägers; z: Grundlinie (Hinterkante des Fußes = Falz) oder front + gap (vorderste Szeneriekante + Abstand)
//   gap: Abstand zwischen zwei Trägern (Welt); pitch: Neigung der Kamera in Grad (Vorgabe 26)
//   sentences: [{ text, t: [line, rise, text], b, big, w, maxEm, form }]   t: Zeiten (b) für Schnittlinien, Aufklappen, Text; b: Lesestelle (Vorgabe text + .03)
//   head: { prints: [pr], e0, b, fit, fitN, x, w }                          erste Lesestelle (Überschrift der Szene, von der Szene gebaut), x/w: Lage für den Faden
//   sy, nsy: Lage des Textes im Bild (−1 … 1, Vorvorgabe −.34 / −.3; die Bahn schiebt nach oben, wenn der Haltepunkt des Fadens sonst unten herausfällt)
// }
export function bahn(K, o) {
  const { F, V, narrow: N } = K;
  const form0 = o.form || FORMEN.anhaenger, pitch = o.pitch === undefined ? 26 : o.pitch, lean = pitch * PI / 180;
  const z = o.z !== undefined ? o.z : o.front + (o.gapZ === undefined ? 6 : o.gapZ);
  const gap = o.gap === undefined ? 1.1 : o.gap, prefix = o.prefix || "s";
  const items = []; let x = o.x0, runT;
  o.sentences.forEach((s, i) => {
    const form = s.form || form0, big = s.big || 1, e = EC * big;
    const maxEm = s.maxEm || form.maxEm(N) * (N && big > 1 ? .72 : 1);
    const lines = s.lines || wrap(K, s.text, maxEm), tw = K.measure(lines).tw * e, th = (lines.length - 1) * LH * e + .8 * e;
    const tag = prefix + (i + 1) + "t", t = { line: s.t[0], rise: s.t[1], text: s.t[2] };
    F.part(tag, t.line, .04);
    const it = form.build({ K, x, z, lines, e, lh: LH, tw, th, i, tag, t, lean, narrow: N, text: s.text, col: s.col || o.col });
    F.geruest({ tags: [tag], t0: t.rise - .035, t1: t.rise, du: .02, a: .5, filter: it.gerFilter });
    Object.assign(it, { i, tag, x0: x, e, lines, b: s.b !== undefined ? s.b : t.text + .03, wKey: s.w || 2.0 });
    items.push(it); x += it.w + gap + (it.side || 0) * 2;
  });
  // Lesestellen (Kamera): gleiche Neigung und Blickrichtung (Gier 0), Abstand so, dass die Schrift in der Welt gleich groß bleibt
  // (px wächst mit e / EC), Text im unteren Bildteil; „keep“: der Haltepunkt des Fadens muss mit ins Bild (siehe readingPose in kern.js)
  const pxD = (W, H) => Math.min(23.5, Math.max(20, 20.5 + (H - 900) / 540 * 2.5));
  const stopOf = (prints, p) => ({ name: p.name, prints, e0: p.e0, b: p.b, px: (W, H, s) => pxD(W, H) * s.e / EC, pxN: (W, H, s) => 16 * s.e / EC,
    fit: p.fit || .92, fitN: p.fitN || .92, pitch, npitch: pitch, yaw: 0, nyaw: 0, sx: 0, nsx: 0, sy: o.sy === undefined ? -.34 : o.sy, nsy: o.nsy === undefined ? -.3 : o.nsy,
    keep: p.keep || null });
  const head = o.head ? stopOf(o.head.prints, { name: prefix + "0", e0: o.head.e0, b: o.head.b, fit: o.head.fit, fitN: o.head.fitN, keep: o.head.keep || (o.head.x !== undefined ? [V(o.head.x - .4, .004, items[0].anchor[2])] : null) }) : null;
  const names = {}; if (head) names[prefix + "0"] = head;
  items.forEach(it => { it.stop = stopOf([it.pr], { name: prefix + (it.i + 1), e0: it.e, b: it.b, keep: it.anchors.map(a => V(...a)).slice(0, 1) }); names[prefix + (it.i + 1)] = it.stop; });
  const stops = [...(head ? [head] : []), ...items.map(it => it.stop)];

  const B = {
    items, names, stops, head, z, lean, pitch, EC,
    // letztes Ende der Bahn (rechter Rand des letzten Trägers samt Stütze)
    endX: items[items.length - 1].x0 + items[items.length - 1].w,
    // Tags und ruhige Knoten für F.spur (Bleistiftspur): { tags, quiet }
    spur: { tags: items.flatMap(it => it.tags || [it.tag]), quiet: items.flatMap(it => it.quiet || []) },
    // Kameraschlüssel: Kopf (w 0), je Träger eine Lesestelle, Auslauf in derselben Richtung (gleicher Abstand und Winkel, nur nach rechts)
    // end: { b, shift, w } b: Ende der Bahn (muss ≥ letzte Lesestelle sein), shift: Weg nach rechts (Welt)
    keys(end = {}) {
      const ks = [];
      if (head) ks.push({ w: 0, stop: head });
      items.forEach((it, k) => ks.push({ w: it.wKey, stop: it.stop }));
      ks.push({ w: end.w || .6, b: end.b !== undefined ? end.b : stops[stops.length - 1].b + .02, fromStop: stops[stops.length - 1], back: 1, up: 0, shift: V(end.shift === undefined ? 1.8 : end.shift, 0, 0) });
      return ks;
    },
    // Roter Faden: gerade Bahn durch die Haltepunkte (Ösen) aller Träger; der Punkt hält an jeder Lesestelle (hold in b um die Lesestelle),
    // dazwischen weich beschleunigt und gebremst. to: { hold: .04, y: .004, startX, depart, bEnd }
    // startX: Beginn des Fadens (Vorgabe links vom Kopf); depart: b, ab dem der Punkt vom Kopf losläuft (Vorgabe Kopf-b + hold);
    // bEnd: Ende der Bahn (Vorgabe letzte Lesestelle + hold): danach läuft der Faden in der Fahrt zur nächsten Szene weiter
    thread(to = {}) {
      const hold = to.hold === undefined ? .04 : to.hold, y = to.y === undefined ? .004 : to.y, zT = items[0].anchor[2];
      const startX = to.startX !== undefined ? to.startX : head && o.head.x !== undefined ? o.head.x - .4 : items[0].anchor[0] - 2.4;
      const hp = [{ x: startX, b: head ? head.b : items[0].b - 0.3 }, ...items.map(it => ({ x: it.anchor[0], b: it.b }))];
      const pts = [V(startX, y, zT)];
      if (head && o.head.w) pts.push(V(startX + .4 + o.head.w * .5, y, zT));
      hp.slice(1).forEach(h => { if (h.x - pts[pts.length - 1].x > 2.6) pts.push(V(h.x - 1.2, y, zT)); pts.push(V(h.x, y, zT)); });
      const x0 = pts[0].x, xe = pts[pts.length - 1].x, fr = hp.map(h => (h.x - x0) / (xe - x0));
      const dep = hp.map((h, k) => k === 0 && to.depart !== undefined ? to.depart : h.b + hold), arr = hp.map(h => h.b - hold);
      const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
      const map = b => {
        if (b <= dep[0]) return 0;
        for (let k = 1; k < hp.length; k++) {
          if (b < arr[k]) return fr[k - 1] + (fr[k] - fr[k - 1]) * smooth((b - dep[k - 1]) / (arr[k] - dep[k - 1]));
          if (b < dep[k]) return fr[k];
        }
        return fr[hp.length - 1];
      };
      const bEnd = to.bEnd !== undefined ? to.bEnd : dep[dep.length - 1];
      // Faden durch beide Ösen: Der Punkt hält an der ersten Öse (Haltepunkt), der Faden selbst läuft schon weiter durch die weiteren Ösen des Trägers
      // (draw: Länge des gezeichneten Fadens, eilt dem Punkt voraus). Beim letzten Träger zeichnet das Ausgangsstück (post) die Strecke bis über die letzte Öse hinaus vor.
      runT = to.run === undefined ? 1.4 : to.run;
      const ext = items.map((it, j) => { const a0 = it.anchors[0][0], a1 = it.anchors[it.anchors.length - 1][0]; return { fr: (a1 - x0) / (xe - x0), k: j + 1, on: a1 > a0 + 1e-6 }; });
      const draw = b => {
        let k = map(b);
        for (let j = 0; j < items.length - 1; j++) { const e = ext[j]; if (e.on) k = Math.max(k, e.fr * smooth((b - arr[e.k]) / Math.max(1e-4, hp[e.k].b - arr[e.k]))); }
        return k;
      };
      const L = items[items.length - 1], post = { b0: arr[hp.length - 1], b1: hp[hp.length - 1].b, len: L.anchors[L.anchors.length - 1][0] + runT - L.anchors[0][0] };
      return { pts, t0: Math.min(dep[0], arr[1]) - .04, t1: bEnd, map, draw, post, dbg: { fr, dep, arr } };
    },
    // Ein- und Ausgang des Fadens für die Szenenfolge (folge.js: faden: () => B.faden({...})): setzt die Bahn stetig fort.
    // Der Faden kommt aus dem Eingang (inn: [x, z], Vorderkante des Bogens) und biegt vor dem Beginn der Bahn in ihre Richtung (+x) ein;
    // am Ende läuft er noch ein Stück geradeaus (gleiche Höhe und Richtung, über die letzte Öse hinaus) und biegt dann zum Ausgang (out: [x, z]) ab.
    faden(fo = {}) {
      const zT = items[0].anchor[2], last = items[items.length - 1], run = fo.run === undefined ? (runT === undefined ? 1.4 : runT) : fo.run, xr = last.anchors[last.anchors.length - 1][0] + run;
      const x0 = fo.startX !== undefined ? fo.startX : head && o.head.x !== undefined ? o.head.x - .4 : items[0].anchor[0] - 2.4;
      // weitere Ösen des letzten Trägers liegen auf dem Weg des Ausgangsstücks (der eigene Faden endet an der ersten Öse)
      const more = last.anchors.slice(1).map(a => [a[0], a[2]]);
      return { in: fo.inn, viaPre: fo.inn ? [[x0 - 2.0, zT + 2.4], [x0 - 1.1, zT + .8], [x0 - .5, zT + .1]] : [], viaPost: [...more, [xr, zT], [xr + (fo.turn === undefined ? 1.6 : fo.turn), zT - (fo.back === undefined ? 1.4 : fo.back)]], out: fo.out, bridge: [.25, .6], preTr: [.6, 1] };
    }
  };
  return B;
}
