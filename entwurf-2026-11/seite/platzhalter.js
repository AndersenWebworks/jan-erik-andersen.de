// Szene `ausserdem` („Weitere Arbeit“: Außerdem) für die Seite (Fassung 2026-11, Bogen + Bastellinien): eine Wand aus Geräten.
// Erik: „den außerdem bereich würd ich stark ausbauen und viel cooler machen – da fehlen screenshots der ganzen seiten … links fehlen eh
// überall wo sie möglich wären! live projekte sind viel wert!“
//
// Aufbau (alles aus dem Bogen geklappt, Faltplan flach in x/z):
// - Rückwand: hohes Brett, steht aus dem Bogen auf (90°).
// - Ablage: Streifen, klappt aus der Rückwand waagerecht nach vorn (die Geräte stehen darauf, alle auf einer Linie).
// - Front: Streifen an der Vorderkante der Ablage, klappt senkrecht zum Boden. Auf ihm steht je Gerät der Text: Projektname (groß), ein
//   ganzer Satz (wörtlich aus dem Seitentext) und die Adresse (rot, anklickbar). Text nie auf dem Bildschirm.
// - Geräte aus Papier, je Projekt eins: Monitor, Laptop, Tablet, Handy, Monitor (größer) in den Maßen von SPEC; sie klappen nacheinander auf,
//   während die Kamera heranfährt. Bildschirm = Bild der Startseite (bilder/projekte-bilder.js, Data-URL); fehlt das Bild, steht ein ruhiger
//   Papierbildschirm ohne Text.
// - Links: Gerät und Adresse sind per Raycast anklickbar (neuer Tab, noopener), sobald url im Eintrag steht. Die Klicklogik steckt schon in kern.js
//   (K.link, Zeiger pointer beim Überfahren); verlinken() unten setzt nur userData.href und ruft K.link, andere Szenen können es ebenso nutzen.
// - Kamera: gleitet in einer Bahn ohne Lesestelle (kein Bremsen) von links nach rechts an der Wand entlang, an jedem Gerät steht Gerät und Text
//   im Bild. Text blendet nach der Regel der Seite erst aus, wenn sein Träger fast aus dem Bild ist; die drei Drucke eines Geräts als Gruppe.
//
// Genutzte Kern-API (kern.js/falt.js): K.sheet, K.print, K.measure, K.decal, K.link, K.onPanel, K.onFlat, K.panel, K.rect, K.P, K.slab,
//   F.part, F.geruest, F.spur. Rückgabe und Parameter (K, o) wie in staffelei.js: { fov, fovN, track, grid, stops, keys, names, dbg, info };
//   o.x/o.z verschieben, o.b0/o.b1 bilden den Szenenfortschritt 0 … 1 auf einen Abschnitt des Baufortschritts ab, o.sheet = false lässt den Bogen weg.
import { keyboard } from "./zeichnungen.js";

const ink = a => `rgba(48,48,51,${a})`;
const RED_TXT = "#d40235", SATZ_TXT = "#3d3d41";
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// ---------- Projekte und Bilder (bilder/projekte-bilder.js, eingebettet) ----------
const { PROJEKTE } = await import("./bilder/projekte-bilder.js");
// Data-URL -> ImageBitmap (kein fetch: die Vorschau-Sandbox sperrt Nachladungen)
async function decode(url) {
  const m = typeof url === "string" && /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(url);
  if (!m) return null;
  try {
    const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return await createImageBitmap(new Blob([buf], { type: m[1] }));
  } catch (e) { return null; }
}
const BMP = {};
await Promise.all(PROJEKTE.map(async p => { BMP[p.id] = { desktop: await decode(p.desktop), mobil: await decode(p.mobil) }; }));

// Klickbarer Druck bzw. Bildschirm: Adresse in userData.href, Raycast und Zeiger übernimmt kern.js (K.link); ohne href nichts
export function verlinken(K, pr, href) {
  if (!pr || !href) return pr;
  pr.mesh.userData.href = href;
  return K.link(pr, href);
}

// ---------- Geräte (Anzeige dw × dh, Rahmen bx seitlich, bt oben, bb unten; lean: Rückneigung in rad) ----------
const SPEC = {
  monitor: { dw: 3.0, dh: 1.875, bx: .1, bt: .1, bb: .17, neck: .42, nw: .46, rad: .07, lean: 0 },
  laptop: { dw: 2.4, dh: 1.5, bx: .1, bt: .1, bb: .1, base: .06, bd: .75, rad: .08, lean: .17 },
  tablet: { dw: 2.0, dh: 1.5, bx: .12, bt: .12, bb: .12, rad: .12, lean: .14 },
  handy: { dw: .86, dh: 1.86, bx: .07, bt: .14, bb: .12, rad: .13, lean: 0 }
};
const SCR = "#3a3a3e";

// Anzeige: Bild (oben bündig, randlos, Verhältnis nur beschnitten) oder ruhiger Papierbildschirm ohne Text (nur stille Flächen)
function anzeige(x, X, Y, w, h, im) {
  x.save(); rr(x, X, Y, w, h, Math.min(w, h) * .018); x.clip();
  if (im) {
    const da = w / h, ia = im.width / im.height; let sw = im.width, sh = im.height, sx = 0;
    if (ia > da) { sw = im.height * da; sx = (im.width - sw) / 2; } else sh = im.width / da;
    x.drawImage(im, sx, 0, sw, sh, X, Y, w, h);
  } else {
    x.fillStyle = "#eff1f7"; x.fillRect(X, Y, w, h);
    const s = w, tall = h > w * 1.3;
    x.fillStyle = ink(.06); x.fillRect(X, Y, w, h * (tall ? .075 : .1));
    x.fillStyle = ink(.16); rr(x, X + .05 * s, Y + h * (tall ? .027 : .035), .16 * s, h * (tall ? .022 : .03), 3); x.fill();
    if (tall) { for (let i = 0; i < 3; i++) { x.fillStyle = ink(.12); x.fillRect(X + .79 * s + i * 0, Y + h * (.027 + i * .013), .1 * s, h * .004); } }
    else { x.fillStyle = ink(.12); for (let i = 0; i < 4; i++) rr(x, X + w * (.56 + i * .1), Y + h * .043, w * .07, h * .016, 3), x.fill(); }
    x.fillStyle = ink(.075); x.fillRect(X, Y + h * (tall ? .075 : .1), w, h * (tall ? .3 : .36));
    x.fillStyle = ink(.16); rr(x, X + .06 * w, Y + h * (tall ? .17 : .2), w * (tall ? .62 : .4), h * (tall ? .026 : .05), 4); x.fill();
    x.fillStyle = ink(.1); rr(x, X + .06 * w, Y + h * (tall ? .22 : .28), w * (tall ? .5 : .3), h * (tall ? .02 : .035), 4); x.fill();
    const cols = tall ? 1 : 3, cw = (w * .88 - (cols - 1) * w * .04) / cols;
    for (let c = 0; c < cols; c++) for (let r = 0; r < (tall ? 3 : 1); r++) {
      const cx = X + w * .06 + c * (cw + w * .04), cy = Y + h * ((tall ? .43 : .52) + r * (tall ? .17 : 0));
      x.fillStyle = ink(.07); rr(x, cx, cy, cw, h * (tall ? .12 : .17), 5); x.fill();
      x.fillStyle = ink(.12); rr(x, cx, cy + h * (tall ? .14 : .2), cw * .7, h * .016, 3); x.fill();
      x.fillStyle = ink(.08); rr(x, cx, cy + h * (tall ? .16 : .23), cw * .5, h * .012, 3); x.fill();
    }
  }
  x.restore();
}

// Satz in Zeilen umbrechen (Breite in em des Drucks)
function umbruch(K, text, maxEm) {
  const lines = []; let cur = "";
  for (const w of text.split(" ")) {
    const t = cur ? cur + " " + w : w;
    if (cur && K.measure([t], {}).tw > maxEm) { lines.push(cur); cur = w; } else cur = t;
  }
  lines.push(cur); return lines;
}
const adresse = u => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

export function ausserdem(K, o = {}) {
  const { F, R, V, Q, PI, THREE, narrow: N } = K;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const WALLC = c3("#e4e7ec"), SHELFC = c3("#e0e3e8"), FRONTC = c3("#eceff4"), SCRC = c3(SCR), LAPC = c3("#dee1e6"), STEMC = c3("#c1c4c9");
  const ox = o.x || 0, oz = o.z || 0, B0 = o.b0 || 0, B1 = o.b1 === undefined ? 1 : o.b1, SP = B1 - B0;
  const T = t => B0 + t * SP, D = d => d * SP;
  const rp = a => [a[0] + ox, a[1] + oz];
  const P3 = (x, y, z) => V(x + ox, y, z + oz);
  const n = PROJEKTE.length, SC = N ? .82 : 1;

  // ---------- Zeiten (Szenenfortschritt 0 … 1): Wand .02, danach je Gerät eines; die Kamera steht bei BS[i] vor Gerät i ----------
  const BS = PROJEKTE.map((p, i) => .2 + i * (.72 / Math.max(1, n - 1)));
  const BUILD = PROJEKTE.map((p, i) => i === 0 ? .1 : BS[i - 1] + .04), BD = .06;

  // ---------- Maße ----------
  const PITCH = N ? 3.7 : 4.2, WL = n * PITCH + .9, X0 = -WL / 2;
  const cxs = PROJEKTE.map((p, i) => (i - (n - 1) / 2) * PITCH);
  const DS = N ? 1.2 : 1.3, ZW = -2.0;

  // ---------- Text je Gerät (zuerst, die Höhe der Front folgt dem höchsten Block) ----------
  const eN = N ? .24 : .21, eS = N ? .15 : .13, eA = eS, gap = N ? .1 : .09, mT = .22;
  let prev = null;
  const items = PROJEKTE.map((p, i) => {
    const on = T(BUILD[i] + BD), fade = D(.03), grp = "ax" + i;
    const name = K.print([p.name], eN, on, { align: "center", fade, grp });
    const dup = !p.satz || p.satz === prev; prev = p.satz;
    const satz = dup ? null : K.print(umbruch(K, p.satz, (PITCH - .4) / eS), eS, on, { align: "center", lh: 1.32, col: SATZ_TXT, fade, grp });
    const adr = p.url ? K.print([adresse(p.url)], eA, on, { align: "center", col: RED_TXT, fade, grp }) : null;
    const list = [name, satz, adr].filter(Boolean);
    const h = list.reduce((a, pr) => a + pr.h, 0) + gap * (list.length - 1);
    return { p, name, satz, adr, h };
  });
  const HF = Math.max(N ? 1.9 : 1.5, Math.max(...items.map(it => it.h)) + 2 * mT);
  const HW = HF + (N ? 3.4 : 3.8);

  const BZ0 = ZW - HW - 1.0, BZ1 = ZW + DS + (N ? 4.4 : 3.6);
  if (o.sheet !== false) K.sheet(X0 - .9 + ox, -X0 + .9 + ox, BZ0 + oz, BZ1 + oz, "#f5f8fd", o.sheetFrom !== undefined ? o.sheetFrom : -1);

  // ---------- Wand: Rückwand, Ablage (klappt aus der Rückwand nach vorn), Front (klappt von der Ablage zum Boden) ----------
  F.part("ax-wand", T(.02), D(.14));
  const wall = K.panel(R, rp([X0, ZW]), rp([-X0, ZW]), [0, -1], T(.03), D(.08), Q, { over: .02 });
  K.rect(wall, 0, 0, WL, HW, WALLC, .5);
  const shelf = K.panel(wall, wall.uv(0, HF), wall.uv(WL, HF), [0, 1], T(.1), D(.05), Q, { over: 0 });
  K.rect(shelf, 0, 0, WL, DS, SHELFC, .5);
  const front = K.panel(shelf, shelf.uv(0, DS), shelf.uv(WL, DS), [0, 1], T(.15), D(.05), -Q, { over: 0 });
  K.rect(front, 0, 0, WL, HF, FRONTC, .5);

  // Text auf der Front: Mitte unter dem Gerät, von oben nach unten (v vom Scharnier abwärts), Bilddrehung zum Scharnier (q)
  items.forEach((it, i) => {
    const u = cxs[i] - X0;
    let v = mT;
    for (const pr of [it.name, it.satz, it.adr]) {
      if (!pr) continue;
      K.onPanel(front, pr, u, v + pr.h / 2, 1, [0, -1], .004);
      v += pr.h + gap;
    }
    if (it.adr) verlinken(K, it.adr, it.p.url);
  });

  // ---------- Geräte ----------
  const geruest = [], quiet = [front], screens = [];
  const PX = N ? 300 : 340;
  PROJEKTE.forEach((p, i) => {
    const sp = SPEC[p.geraet] || SPEC.monitor, k = SC * (p.groesse || 1), s = {};
    for (const key of Object.keys(sp)) s[key] = key === "lean" ? sp[key] : sp[key] * k;
    const W = s.dw + 2 * s.bx, Hs = s.dh + s.bt + s.bb, tb = BUILD[i], on = T(tb + BD + .01), U = cxs[i] - X0;
    const im = BMP[p.id] && (p.geraet === "handy" ? BMP[p.id].mobil : BMP[p.id].desktop);
    const tag = "ax-g" + i; F.part(tag, T(tb - .01), D(.1)); geruest.push({ tag, t0: tb - .05, t1: tb });
    // Bildschirmfläche (Rahmen und Anzeige) als Druck mit Bild bzw. Papierbildschirm
    const face = () => K.decal(Math.round(W * PX), Math.round(Hs * PX), (x, Wp, Hp) => {
      const q = Wp / W;
      x.fillStyle = SCR; rr(x, 0, 0, Wp, Hp, s.rad * q); x.fill();
      if (p.geraet === "handy") { x.fillStyle = "#55555a"; rr(x, Wp / 2 - .14 * q, .05 * q, .28 * q, .032 * q, .016 * q); x.fill(); }
      anzeige(x, s.bx * q, s.bt * q, s.dw * q, s.dh * q, im);
    }, W, Hs, on, D(.04));
    let dec;
    if (p.geraet === "laptop") {
      // Tastaturteil (flache Platte mit Randstreifen) und Deckel, der sich an der Hinterkante aufstellt
      const Wb = W + .1 * k, vF = DS - .1, vB = vF - s.bd;
      const bx0 = shelf.uv(U - Wb / 2, 0)[0], bx1 = bx0 + Wb, zF = shelf.uv(0, vF)[1], zB = shelf.uv(0, vB)[1];
      const base = K.slab(shelf, bx0, bx1, zF, zB, s.base, T(tb), D(.04), { walls: "flr", col: LAPC, over: .03 });
      const KBD = s.bd * .6;
      K.onFlat(base, K.decal(1000, Math.round(1000 * KBD / (Wb - .2)), keyboard, Wb - .2, KBD, on, D(.04)), (bx0 + bx1) / 2, zB + .07 + KBD / 2, .004);
      const lid = K.panel(base, [bx0 + .05 * k, zB], [bx1 - .05 * k, zB], [0, -1], T(tb + .04), D(.05), Q - s.lean, { over: .03, own: R });
      K.rect(lid, 0, 0, W, Hs, SCRC, .5);
      // der Deckel ist schmaler als der Tastaturteil: Mitte auf der Mitte
      dec = K.onPanel(lid, face(), W / 2, Hs / 2, 1, null, .004);
      quiet.push(lid);
    } else {
      const vz = DS * .6;
      const neck = p.geraet === "monitor" ? s.neck : 0;
      const pn = K.panel(shelf, shelf.uv(U - W / 2, vz), shelf.uv(U + W / 2, vz), [0, -1], T(tb), D(BD), Q - s.lean, { over: .03 });
      if (neck) K.rect(pn, W / 2 - s.nw / 2, 0, W / 2 + s.nw / 2, neck + .02, STEMC, .5);
      K.rect(pn, 0, neck, W, neck + Hs, SCRC, .5);
      dec = K.onPanel(pn, face(), W / 2, neck + Hs / 2, 1, null, .004);
      if (neck) {                                                                  // Standfuß des Monitors auf der Ablage
        const fw = 1.15 * k, fd = .5 * k;
        K.onPanel(shelf, K.decal(Math.round(fw * 200), Math.round(fd * 200), (x, Wp, Hp) => {
          x.fillStyle = "#c1c4c9"; rr(x, 0, 0, Wp, Hp, Hp * .35); x.fill();
          x.strokeStyle = ink(.28); x.lineWidth = Math.max(1.2, Hp * .03); rr(x, 1, 1, Wp - 2, Hp - 2, Hp * .35); x.stroke();
        }, fw, fd, on, D(.03)), U, vz - .02, 1, null, .004);
      }
      quiet.push(pn);
    }
    screens.push(dec);
    verlinken(K, dec, p.url);
  });

  // ---------- Konstruktionsphase wie in der Eröffnung: Raster auf dem Bogen, Gerüst der festen Teile, Bleistiftspur ----------
  F.geruest({ tags: ["ax-wand"], t0: T(0), t1: T(.1), du: D(.03), a: .5 });
  for (const g of geruest) F.geruest({ tags: [g.tag], t0: T(g.t0), t1: T(g.t1), du: D(.03), a: .5 });
  F.spur({ tags: ["ax-wand", ...geruest.map(g => g.tag)], quiet, a: .3 });

  // ---------- Kamera: ohne Lesestellen, eine Bahn an der Wand entlang ----------
  const look = (tx, ty, tz, el, az, dist) => { const e = el * PI / 180, a = az * PI / 180; return P3(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a)); };
  const tg = (x, y, z) => P3(x, y, z);
  const HD = Math.max(...PROJEKTE.map(p => { const sp = SPEC[p.geraet] || SPEC.monitor, k = SC * (p.groesse || 1); return (sp.dh + sp.bt + sp.bb + (sp.neck || (sp.base ? sp.base : 0))) * k; }));
  const ty = (HF + HD) / 2, tz = ZW + DS * .5, DIST = N ? 9.2 : 10.2, EL = 9;
  const slot = i => { const az = n > 1 ? -3 + 6 * i / (n - 1) : 0, c = look(cxs[i], ty, tz, EL, az, DIST), t = tg(cxs[i], ty, tz); return { cam: c, tgt: t, camN: c, tgtN: t }; };
  // Lesestellen (Folgefahrt, 23.10.): je Gerät Name, Satz und Adresse auf der Front, frontal; der Satz bestimmt die Schriftgröße (Großbuchstaben mindestens 16 px, Handy 13 px)
  const pxD = (W, H) => Math.min(30, Math.max(27, 27 + (H - 900) / 540 * 2.5));
  const stops = items.map((it, i) => ({ prints: [it.name, it.satz, it.adr].filter(Boolean), e0: eS, b: T(BS[i]), px: pxD, pxN: 22, frontal: true, tilt: 4, ntilt: 4, sx: 0, nsx: 0, sy: .05, nsy: .05, fit: .96, fitN: .98 }));
  const keys = [
    { w: 0, b: T(0), cam: look(cxs[0] + 3, 1.2, ZW + 1, 40, 0, 27), tgt: tg(cxs[0] + 3, 1.2, ZW + 1), camN: look(cxs[0] + 3.2, 1.4, ZW + 1, 40, 0, 31), tgtN: tg(cxs[0] + 3.2, 1.4, ZW + 1) },
    ...stops.map((st, i) => ({ w: i === 0 ? 1.1 : 1, stop: st })),
    { w: .8, b: T(1), cam: look(cxs[n - 1] + 1.6, ty + .3, tz, 16, 3, DIST + 3), tgt: tg(cxs[n - 1] + 1.6, ty + .3, tz), camN: look(cxs[n - 1] + 1.6, ty + .3, tz, 16, 3, DIST + 3), tgtN: tg(cxs[n - 1] + 1.6, ty + .3, tz) }
  ];
  return {
    fov: 32, fovN: 44, track: 640,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: T(.004), wave: .0025 * SP, d: .04 * SP, out: T(.4) },
    names: {}, stops,
    info: { x0: X0 - .9 + ox, x1: -X0 + .9 + ox, z0: BZ0 + oz, z1: BZ1 + oz, b0: B0, b1: B1, heights: { ridge: HF + HD } },
    dbg: { wall, shelf, front, screens, items, HF, HW, DS, PITCH, cxs },
    keys
  };
}
