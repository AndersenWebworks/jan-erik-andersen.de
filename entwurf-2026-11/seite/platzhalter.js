// Platzhalter-Szenen für die Seite (Fassung 2026-11, Bogen + Bastellinien): `gloves` („Weitere Arbeit“: Take the Gloves Off) und `ausserdem`
// („Außerdem: …“). Je ein aufgestelltes Papierschild mit Stütze (Aufsteller), das aus dem Bogen klappt, mit dem vorhandenen Seitentext
// bzw. dem Vermerk aus der Quelle (entwurf-2026-10-b-raumtext-2/index.html, <section id="weitere">) und einem Bleistift-Stempel „Platzhalter“.
// Wortlaut wörtlich, nichts ergänzt:
//   gloves:   Kicker „Ehrenamtlich“, Überschrift „Take the Gloves Off“, Vermerk „[Ein Satz zum Erscheinungsbild, nach Abstimmung]“
//   ausserdem: „Außerdem: Onkologie Laatzen, Mindblossom und Soundhealing Hamburg, der digitale Wirkungsbericht für Seniorpartner in School,
//              Bäckerei Behrens.“ und Vermerk „[je ein Satz nach erneuter Sichtung]“
//
// Aufbau: Schild (Brett, lehnt 80° nach hinten, an der Fußlinie im Bogen gefalzt) und Stütze (schmaler Streifen am Kopf des Schilds, klappt
// nach hinten zum Boden, ohne Überschwingen). Bastellinien, Raster, Gerüst und Bleistiftspur wie in der Eröffnung. Der Stempel zeichnet sich
// als Bleistiftumriss mit dem Wort, sobald das Schild steht.
//
// Genutzte Kern-API (kern.js/falt.js der Szene „Schnittstellen“, nichts darüber hinaus):
//   K.sheet, K.print, K.decal, K.onPanel, K.panel, K.rect, F.part, F.geruest, F.spur; falt.js: Knotenoptionen over, lv.
// Rückgabe und Parameter (K, o) wie in staffelei.js: { fov, fovN, track, grid, stops, keys, names, dbg, info }; o.x/o.z verschieben,
// o.b0/o.b1 bilden den Szenenfortschritt 0 … 1 auf einen Abschnitt des Baufortschritts ab, o.sheet = false lässt den eigenen Bogen weg.

const ink = a => `rgba(48,48,51,${a})`;
const MUTED = "#66666a";

// Bleistift-Stempel: gestrichelter, leicht gedrehter Umriss mit dem Wort „Platzhalter“ (Newsreader kursiv)
function stamp(x, W, H) {
  x.save(); x.translate(W / 2, H / 2); x.rotate(-.05);
  const w = W * .94, h = H * .8;
  x.strokeStyle = ink(.5); x.lineWidth = H * .045; x.setLineDash([H * .16, H * .1]); x.lineCap = "round";
  x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, h * .22); x.stroke();
  x.setLineDash([]); x.fillStyle = ink(.62); x.textAlign = "center"; x.textBaseline = "middle";
  x.font = `italic 300 ${Math.round(H * .46)}px "Newsreader", Georgia, serif`;
  x.fillText("Platzhalter", 0, H * .03);
  x.restore();
}

// gemeinsamer Aufsteller; cfg: { id, W, H (Handy: HN), blocks(N) -> [{ lines, e, col?, font?, gap }], stampW }
function aufsteller(K, o, cfg) {
  const { F, R, V, Q, PI, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const BOARD = c3("#f3efe6"), LEG = c3("#dcd7cd");
  const ox = o.x || 0, oz = o.z || 0, B0 = o.b0 || 0, B1 = o.b1 === undefined ? 1 : o.b1, SP = B1 - B0;
  const T = t => B0 + t * SP, D = d => d * SP;
  const rp = a => [a[0] + ox, a[1] + oz];
  const P3 = (x, y, z) => V(x + ox, y, z + oz);
  const tag = cfg.id + "-schild";

  const W = cfg.W, H = N ? cfg.HN : cfg.H, FC = 80 * PI / 180, FS = 62 * PI / 180, SW = .8;
  const RY = H * Math.sin(FC), LS = RY / Math.sin(FS), ZC = 1.0;
  const BZ0 = ZC - H - LS - 1.0, BZ1 = ZC + (N ? 3.2 : 2.6);
  if (o.sheet !== false) K.sheet(-5.6 + ox, 5.6 + ox, BZ0 + oz, BZ1 + oz, "#faf8f3", o.sheetFrom !== undefined ? o.sheetFrom : -1);

  // Schild und Stütze
  F.part(tag, T(.02), D(.16));
  const card = K.panel(R, rp([-W / 2, ZC]), rp([W / 2, ZC]), [0, -1], T(.24), D(.13), FC, { over: .03 });
  K.rect(card, 0, 0, W, H, BOARD, .5);
  const leg = K.panel(card, card.uv((W - SW) / 2, H), card.uv((W + SW) / 2, H), [0, -1], T(.31), D(.1), -(FC + FS), { over: 0, lv: 1 });
  K.rect(leg, 0, 0, SW, LS, LEG, .5);

  // Text auf dem Schild, von oben nach unten gestapelt, linksbündig als Block
  const blocks = cfg.blocks(N).map(b => ({ ...b, pr: K.print(b.lines, b.e, T(cfg.on), { lh: b.lh || 1.3, font: b.font, col: b.col, align: b.align })}));
  const m = N ? .3 : .38, wMax = Math.max(...blocks.map(b => b.pr.t.tw * b.e));
  const uL = Math.max(m, (W - wMax) / 2);
  let vTop = H - (N ? .28 : .3);
  for (const b of blocks) {
    K.onPanel(card, b.pr, uL - b.pr.t.padX * b.e + b.pr.w / 2, vTop - b.pr.h / 2, 1);
    vTop -= b.pr.h + (b.gap === undefined ? .08 : b.gap);
  }
  // Stempel oben rechts, zeichnet sich nach dem Stehen
  const sw = N ? 1.5 : 1.7, sh = sw * .3;
  const st = K.decal(Math.round(sw * 300), Math.round(sh * 300), stamp, sw, sh, T(cfg.on + .02), .03);
  K.onPanel(card, st, W - m - sw / 2 + .06, H - sh / 2 - (N ? .12 : .14), 1);

  // Konstruktionsphase wie in der Eröffnung
  F.geruest({ tags: [tag], t0: T(.07), t1: T(.24), du: D(.03), a: .5 });
  F.spur({ tags: [tag], quiet: [card], a: .3 });

  // Lesestelle: Fließtextgröße am Hauptblock (e0), Überschrift darf größer sein
  const pxD = (Wv, Hv) => Math.min(21, Math.max(19, 19 + (Hv - 700) / 500 * 2));
  const stopPrints = blocks.map(b => b.pr);
  const S = { read: { prints: stopPrints, px: pxD, b: T(cfg.stopB), e0: cfg.e0(N), pitch: 12, yaw: -6, sy: .15, sx: 0, npitch: 12, nyaw: 0, nsy: .12, nsx: 0 } };
  const look = (tx, ty, tz, el, az, dist) => { const e = el * PI / 180, a = az * PI / 180; return P3(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a)); };
  const tg = (x, y, z) => P3(x, y, z);
  const zc = ZC - H * .45;                          // Mitte des Schilds im Faltplan (Zielpunkt der Überblicke)
  return {
    fov: 32, fovN: 44, track: 420,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: T(.004), wave: .0025 * SP, d: .04 * SP, out: T(.4) },
    names: S, stops: Object.values(S),
    info: { x0: -5.6 + ox, x1: 5.6 + ox, z0: BZ0 + oz, z1: BZ1 + oz, b0: B0, b1: B1, heights: { ridge: RY } },
    dbg: { card, leg, blocks, stamp: st, H, LS, W },
    keys: [
      { w: 0, b: T(0), cam: look(0, .3, zc, 40, 0, 17), tgt: tg(0, .3, zc), camN: look(0, .3, zc, 40, 0, 20), tgtN: tg(0, .3, zc) },
      { w: 1, b: T(.3), cam: look(0, 2.0, ZC - H * .4, 28, -4, 15), tgt: tg(0, 2.0, ZC - H * .4), camN: look(0, 2.2, ZC - H * .4, 28, -3, 19), tgtN: tg(0, 2.2, ZC - H * .4) },
      { w: 1, stop: S.read },
      { w: .9, b: T(1), cam: look(0, 1.4, ZC - H * .3, 22, 4, 14), tgt: tg(0, 1.4, ZC - H * .3), camN: look(0, 1.6, ZC - H * .3, 22, 3, 19), tgtN: tg(0, 1.6, ZC - H * .3) }
    ]
  };
}

// „Weitere Arbeit“: Take the Gloves Off (Ehrenamt). Satz zum Erscheinungsbild steht im Seitentext noch als Vermerk.
export function gloves(K, o = {}) {
  return aufsteller(K, o, {
    id: "gloves", W: 4.6, H: 3.4, HN: 4.1, on: .46, stopB: .58, e0: N => N ? .17 : .14,
    blocks: N => [
      { lines: ["Ehrenamtlich"], e: N ? .15 : .12, col: MUTED, gap: .1 },
      { lines: N ? ["Take the", "Gloves Off"] : ["Take the Gloves Off"], e: N ? .3 : .27, font: "serif", lh: 1.1, gap: .2 },
      { lines: N ? ["[Ein Satz zum", "Erscheinungsbild,", "nach Abstimmung]"] : ["[Ein Satz zum Erscheinungsbild,", "nach Abstimmung]"], e: N ? .17 : .14, col: MUTED }
    ]
  });
}

// Außerdem: kleinere Referenzen, Sätze offen. Satz wörtlich aus dem Seitentext, Vermerk darunter.
export function ausserdem(K, o = {}) {
  return aufsteller(K, o, {
    id: "ausserdem", W: 4.9, H: 3.4, HN: 4.5, on: .46, stopB: .58, e0: N => N ? .17 : .14,
    blocks: N => [
      { lines: N ? ["Außerdem: Onkologie Laatzen,", "Mindblossom und", "Soundhealing Hamburg,", "der digitale Wirkungsbericht", "für Seniorpartner in School,", "Bäckerei Behrens."]
        : ["Außerdem: Onkologie Laatzen, Mindblossom und", "Soundhealing Hamburg, der digitale Wirkungsbericht", "für Seniorpartner in School, Bäckerei Behrens."], e: N ? .17 : .14, gap: .14 },
      { lines: N ? ["[je ein Satz nach", "erneuter Sichtung]"] : ["[je ein Satz nach erneuter Sichtung]"], e: N ? .17 : .14, col: MUTED }
    ]
  });
}
