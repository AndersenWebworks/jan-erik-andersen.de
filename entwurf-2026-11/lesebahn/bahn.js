// Satzhilfen der Lesebahn (entwurf-2026-11/lesebahn/), Fassung „Die Szene ist der Träger“ (PRINZIP-SZENE-IST-TRAEGER.md, LESEBAHN-BAUKASTEN.md).
// Der Kern (kern.js) fährt die Kamera gleichmäßig über alle Szenen; jede Szene baut ihr Ding selbst und setzt die Sätze darauf. Diese Datei liefert
// dafür die gemeinsamen Größen und Hilfen (als K.* in jeder Szene):
//   K.strecke(xs, xe, bI)   Strecke der Szene (x der Bildmitte, Szenenkoordinaten): b = bI + (1 − bI)·(X − xs)/(xe − xs). Liefert bAt(x), xAt(b).
//   K.satz(text, o)          Satz als Druck in der Lesetypografie (Newsreader N4 440, *…* = Schlüsselgruppe kursiv), ganz umbrochen nach maxEm.
//   K.kopf(o)                Kicker (Grotesk, Versalien, gesperrt) und Kopf (Newsreader N4 groß), als zwei Drucke.
//   K.trage(cF, w, o)        Mitfahrt eines Trägers am Handy: der Träger fährt so weit mit der Kamera mit, dass sein Satz mindestens R vh ruhig
//                            und ganz im Bild steht, und kommt bei cF zur Ruhe (Desktop: meist ohne Mitfahrt, dort reicht das Bild).
//   K.sicht(x)               b, bei dem x am rechten Bildrand auftaucht (sicht.in), in der Bildmitte steht (sicht.mitte), links hinausgeht (sicht.aus)
export const PITCH = 30;            // Neigung der Kamera auf der ganzen Bahn (Grad); Träger stehen um diesen Winkel zurückgelehnt
export const EC = .2;               // Bezugsgröße der Schrift: 1 em = EC Welteinheiten; die Kamera rechnet daraus den Abstand (kern.js, rigOf)
export const YL = .62;              // Höhe des Lesepunkts über der Bahn (Mitte einer Satzzeile, die in Bildmitte steht)
export const LH = 1.36;             // Zeilenhöhe der Sätze
export const READ_VH = 38;          // Mindestdauer (mit Reserve für Rampen und Rand; geprüft wird ≥ 30), die ein Satz ruhig und ganz im Bild steht (vh Scrollweg)

const S5 = t => t * t * t - t * t * t * t / 2;   // Integral von smoothstep (0 … 1/2)

// Umbruch an Wortgrenzen, möglichst gleich lange Zeilen; Schlüsselgruppen (*…*) zählen mit ihrer kursiven Breite
export function wrap(K, text, maxEm, o = { font: "lese" }) {
  const words = text.split(" ");
  const wid = s => K.measure([s], o).tw;
  const count = m => { let n = 1, cur = ""; for (const w of words) { const t = cur ? cur + " " + w : w; if (cur && wid(t) > m) { n++; cur = w; } else cur = t; } return n; };
  const n0 = count(maxEm); let m = maxEm; while (count(m - .4) === n0 && m > 6) m -= .4;
  const lines = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (cur && wid(t) > m) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur);
  // Kursivmarke über Zeilenenden: jede Zeile schließt ihre offene Gruppe und die nächste öffnet sie wieder (der Druck rechnet je Zeile neu)
  let open = false;
  return lines.map(l => { const pre = open ? "*" : ""; const n = (l.match(/\*/g) || []).length; const t = pre + l; open = (open ? 1 : 0) + n & 1 ? true : false; return open ? t + "*" : t; });
}

export function satzhilfen(K) {
  const RIG = K.RIG, N = K.narrow;
  let ST = { xs: 0, xe: 1, bI: 0 };
  const bAt = x => ST.bI + (1 - ST.bI) * (x - ST.xs) / (ST.xe - ST.xs);
  const xAt = b => ST.xs + (b - ST.bI) / (1 - ST.bI) * (ST.xe - ST.xs);
  Object.assign(K, {
    // EV: Schriftgröße auf senkrechten Flächen (Setzstufe, Schrankfront), gleicht die Verkürzung durch die Neigung aus
    PITCH, EC, EV: EC / Math.cos(PITCH * Math.PI / 180), YL, LH, lean: PITCH * Math.PI / 180, halfW: RIG.halfW, halfH: RIG.halfH, ppw: RIG.ppw, vWorld: RIG.v,
    strecke(xs, xe, bI = 0) { ST = { xs, xe, bI }; return { bAt, xAt }; },
    bAt, xAt,
    sicht(x) { return { in: bAt(x - RIG.halfW), mitte: bAt(x), aus: bAt(x + RIG.halfW) }; },
    wrap: (text, maxEm, o) => wrap(K, text, maxEm, o),
    // Satz: o.on (b, Text blendet ein), o.maxEm (Vorgabe Desktop 25, Handy 18), o.e (Vorgabe EC), o.align
    satz(text, o = {}) {
      const e = o.e || EC, maxEm = o.maxEm || (N ? 18 : 25);
      const fo = { font: "lese", lh: o.lh || LH, align: o.align, col: o.col, weight: o.weight };
      const lines = o.lines || wrap(K, text, maxEm, fo);
      const pr = K.print(lines, e, o.on !== undefined ? o.on : -1, { ...fo, fade: o.fade, text });
      pr.tw = pr.t.tw * e; pr.th = ((lines.length - 1) * (o.lh || LH) + .8) * e; pr.text = text;
      return pr;
    },
    // Kopf einer Szene: { kicker, head, on, e (Kopf), align } → { k, h, w, hgt } (Kicker über dem Kopf, Abstand .55 em des Kopfs)
    kopf(o) {
      const eH = o.e || EC * (N ? 1.6 : 1.9), eK = EC * (N ? .72 : .62);
      const h = K.print(o.headLines || [o.head], eH, o.on !== undefined ? o.on : -1, { font: "kopf", lh: 1.12, align: o.align, text: o.head });
      const k = o.kicker ? K.print([o.kicker], eK, o.on !== undefined ? o.on : -1, { font: "kicker", col: "#5f5f63", align: o.align, text: o.kicker }) : null;
      const w = Math.max(h.t.tw * eH, k ? k.t.tw * eK : 0);
      return { h, k, eH, eK, w, gap: .55 * eH };
    },
    // Mitfahrt: cF Mitte des Trägers in Ruhe (Endlage), w Breite des Satzes (Welt). o.R Mindestlesedauer (vh), o.rim Rand (px).
    // Liefert { D, c0, bA, bB, ease, node(par) }: node hängt einen Schiebeknoten unter par, der alles darunter um D nach rechts schiebt;
    // die Teile werden in der Startlage gebaut (Mitte c0 = cF − D). Ohne nötige Mitfahrt ist D = 0 und node(par) = par.
    trage(cF, w, o = {}) {
      const R = o.R || READ_VH, rim = (o.rim || 24) / RIG.ppw;
      const slack = Math.max(0, 2 * RIG.halfW - w - 2 * rim), still = slack / RIG.v;
      const need = Math.max(0, R - still), D = Math.max(need * RIG.v, o.minD || 0);
      if (D < .05 && !o.force) return { D: 0, c0: cF, bA: bAt(cF), bB: bAt(cF), ease: x => x, node: par => par, still };
      const r = Math.min(D, RIG.halfW * .5), C = D + r, c0 = cF - D, Xa = c0 - r / 2;
      const pos = u => u <= 0 ? 0 : u < r ? r * S5(u / r) : u < C - r ? r / 2 + (u - r) : u < C ? r / 2 + (C - 2 * r) + r * (.5 - S5((C - u) / r)) : D;
      const bA = bAt(Xa), bB = bAt(Xa + C), ease = x => pos(x * C) / D;
      return { D, c0, bA, bB, ease, still, node: (par, lv) => K.F.slide(par, [D, 0, 0], bA, bB - bA, { ease, lv: lv !== undefined ? lv : par.lvl }) };
    }
  });
  return K;
}
