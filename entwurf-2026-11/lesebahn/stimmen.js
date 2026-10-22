// Szene „Stimmen“ (Lesebahn, gleichmäßige Fahrt; Prinzip: PRINZIP-SZENE-IST-TRAEGER.md, Drehbuch Abschnitt 15). Das Ding sind zwei Leporellos:
//  1. SiS-Wirkungsbericht, sechs Seiten. Geschlossen steht der Bericht aus dem Bogen auf, auf seiner Vorderseite stehen Kicker und Kopf („Was Kunden sagen“).
//     Die Seiten 1 bis 5 tragen die fünf Sätze, Seite 6 (die Rückseite der Titelseite) die Quelle. Seite für Seite schlägt sich auf, während die Kamera
//     vorbeifährt; ungerade Seiten decken beim Aufschlagen die Seite davor auf (Vorder- und Rückseite berühren sich im Stapel), darum erscheinen die
//     Sätze paarweise: erst wenn die Seite nach rechts weggeklappt ist, steht der Satz dahinter da.
//  2. ai-coustics: zwei breite Seiten, jede trägt einen ganzen Zitatsatz. Über der ersten Seite steht eine Zackenreihe (Schallwelle, jede Zacke eigene Länge);
//     die Zacken klappen eine nach der anderen hinter die Seite, die Kante wird glatt (verlässlich). Aus der glatten Kante der zweiten Seite steht danach eine
//     einzige Fahne auf (der letzte Schliff überrascht); sie trägt keinen Text.
// Die Seiten stehen der Kamera zugewandt: flache Zickzack-Faltung mit kleinem Winkel (Seiten senkrecht, Text mit K.EV). Der rote Faden läuft am Fuß (Falz)
// der Seiten entlang; der Punkt in Bildmitte sitzt damit am Falz unter dem Text, nicht auf dem Zitat.
// Handy: Das Bild ist schmal, darum fährt der Bericht an jeder Lesestelle ein Stück mit der Kamera mit (Schiebeknoten): Der noch gefaltete Stapel wird
// gleichsam vom Punkt gezogen, die nächste Seite schlägt sich aus ihm auf, dann bleibt die Seite stehen und die Kamera fährt zur nächsten.
const ink = a => `rgba(48,48,51,${a})`;
const MUTED = "#66666a";

// ---------- Text, wörtlich (Drehbuch Abschnitt 15, Zitate nicht korrigiert; *…* = Schlüsselgruppe) ----------
export const TEXT = {
  kicker: "Stimmen", kopf: "Was Kunden sagen",
  sis: [
    "Seniorpartner in School (SiS) ist eine bundesweit agierende Sozialorganisation.",
    "Ein gut aufgestellter *digitaler Wirkungsbericht* ist für unsere Arbeit wichtig.",
    "Jan-Erik und die kompetente Texterin Annemarie haben das für uns neue Format *professionell und barrierefreundlich* aufgesetzt.",
    "Super Teamarbeit, *verlässlich und engagiert*.",
    "SiS sagt *DANKE!*"
  ],
  sisQuelle: "Karin, Seniorpartner in School · Google-Bewertung",
  ai: [
    "Berufsbedingt habe ich schon mit verschiedenen Mediendesignern zusammengearbeitet und freue mich mit Andersen Webworks seit nun mehreren Jahren *einen zuverlässigen Partner* gefunden zu haben.",
    "Professionelles Webdesign das mich *immer wieder überrascht*, meine Vorstellungen werden ernst genommen und bekommen von Herrn Andersen den letzten Schliff, so setzt man sich von der Konkurrenz ab!"
  ],
  aiQuelle: "Corvin Jädicke, ai-coustics · Google-Bewertung"
};

export default function (K) {
  const { F, R, V, COL, PI, Q, THREE, narrow: N } = K;
  const EV = K.EV, HW = K.halfW, DEG = PI / 180, sm = K.sm;
  const c3 = s => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
  const rnd = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };

  // ---------- Maße ----------
  const hh = 0, gam = PI - 2 * hh, cs = Math.cos(hh), sn = Math.sin(hh);
  const fS = N ? 1 : Math.max(.8, Math.min(1, HW / 6.1));                      // schmalere Fenster: Seiten und Abstände schrumpfen mit der Bildbreite
  const LW = N ? 2.8 : 3.7 * fS, pw = LW * cs, dl = LW * sn;                        // SiS-Seite: Breite, Vorschub je Seite, Tiefenversatz je Seite
  const AW = N ? 3.3 : 6.2 * fS, pa = AW * cs, dla = AW * sn;                       // ai-coustics-Seite
  const MX = N ? .25 : .34 * fS;                                                    // Rand links und rechts
  const LZ = 0;                                                                // Lesetiefe: Mitte der Zickzack-Seiten

  // ---------- Sätze (Drucke, Einblendzeit `on` folgt später) ----------
  const NO = 9;
  const satz = (t, e, W, o = {}) => K.satz(t, { e, maxEm: (W - 2 * MX) / e, on: NO, fade: .012, ...o });
  const Z = TEXT.sis.map((t, i) => satz(t, i === 4 ? EV * 1.3 : EV, LW));
  const qE = EV * .95, NB = " ";
  const quelle = (t, W) => {
    const pr = satz(t.replace(" · ", NB + "· "), qE, W, { col: MUTED });
    pr.text = t; return pr;
  };
  const Q1 = quelle(TEXT.sisQuelle, LW), Q2 = quelle(TEXT.aiQuelle, AW);
  const A = TEXT.ai.map(t => satz(t, EV, AW));
  // Kicker und Kopf auf der Titelseite (Kern: K.kopf, hier auf der senkrechten Fläche mit K.EV statt EC)
  const eH = EV * (N ? 1.6 : 1.4), eK = EV * (N ? .72 : .62);
  const headLines = K.measure([TEXT.kopf], { font: "kopf" }).tw * eH > LW - 2 * MX ? ["Was Kunden", "sagen"] : [TEXT.kopf];
  const kick = K.print([TEXT.kicker], eK, NO, { font: "kicker", col: "#5f5f63", text: TEXT.kicker });
  const head = K.print(headLines, eH, NO, { font: "kopf", lh: 1.12, text: TEXT.kopf });

  // Höhen: Text oben bündig bei ZT (Textmitte etwa in Bildmitte), darüber der Schmuck der Seite; die Seiten sind hoch wie ein Heft (3 : 4)
  const thS = Math.max(...Z.map(z => z.th), head.h + kick.h + eH * .5, Q1.th);
  const ZT = .5 + thS + .25, LH = ZT + (N ? 1.5 : 1.3);
  const thA = Math.max(A[0].th, A[1].th + Q2.th + .35);
  const ZA = .5 + thA + .25, AH = ZA + .5;

  // ---------- Fahrplan: Strecke, Ereignisse (Kameralage X in Szenenkoordinaten) ----------
  const A1x = 0, fx = k => A1x + k * pw;
  const xs = A1x - HW;
  let A2x, xe, ev = {}, dw1 = [], dw2 = [];
  if (!N) {
    const dU = 1.2 * fS, end = k => k === 1 ? 1.95 * fS : fx(k - 1) + .8 * fS;
    ev.rise1 = xs + .5; ev.u1 = [null];
    for (let k = 1; k <= 5; k++) ev.u1[k] = [end(k) - dU, end(k)];
    A2x = fx(6) + 3.8 * fS;
    ev.rise2 = A2x - HW + .3; ev.u2 = [A2x + .5 * fS - 1.7 * fS, A2x + .5 * fS];
    ev.teeth = [A2x + 1.4 * fS, A2x + 3.4 * fS]; ev.flag = [A2x + 1.12 * pa, A2x + 1.12 * pa + 1.2];
    xe = A2x + 1.5 * pa;
  } else {
    // Handy: Kamera X und Lage im Bericht: In `dwell` fährt der Bericht mit (Kamera steht im Bericht still), in `mv` steht er und die Kamera fährt.
    let X = xs; const UN = 1.2;
    const dwell = (list, len) => { const a = X; list.push([a, a + len]); X += len; return a; };
    ev.rise1 = xs + .6; ev.u1 = [null];
    X = fx(0) + pw / 2;                                                       // Stapel in Bildmitte
    let a = dwell(dw1, 2.5 + UN + 3.1);                                       // Titel lesen, Seite 1 schlägt auf, Satz 1 lesen
    ev.u1[1] = [a + 2.5, a + 2.5 + UN];
    X += pw; a = dwell(dw1, 2.5); ev.u1[2] = [a + .1, a + .1 + UN];           // Seite 2 liegt vorn, Seite 3 schlägt auf (verdeckt noch)
    X += pw; a = dwell(dw1, UN + 2.9); ev.u1[3] = [a, a + UN];                 // Seite 4 klappt weg und deckt Satz 3 und 4 auf
    X += pw; a = dwell(dw1, 2.6); ev.u1[4] = [a + .1, a + .1 + UN];
    X += pw; a = dwell(dw1, UN + 2.9); ev.u1[5] = [a, a + UN];
    X += pw; dwell(dw1, 2.1);
    const D1 = dw1.reduce((s, d) => s + d[1] - d[0], 0);
    A2x = fx(6) + D1 + 2.2;
    ev.rise2 = A2x - HW + .5;
    X = A2x + pa / 2;
    a = dwell(dw2, 1.4 + 4.3); ev.u2 = [a, a + 1.4]; ev.teeth = [a + 1.4 + .8, a + 1.4 + 2.2];
    X += pa; a = dwell(dw2, 3.9); ev.flag = [a + .5, a + 1.5];
    xe = X;
  }
  K.strecke(xs, xe);
  const B = X => K.bAt(X), DB = dx => dx / (xe - xs);

  // Schiebeknoten des Berichts (Handy): Verschiebung folgt der Mitfahrt in den Haltestrecken, dazwischen steht der Bericht
  function slideOf(dws) {
    const rho = .6, XA = dws[0][0] - rho / 2 - .02, XB = dws[dws.length - 1][1] + rho / 2 + .02;
    const vs = X => dws.reduce((s, d) => s + sm((X - d[0] + rho / 2) / rho) - sm((X - d[1] + rho / 2) / rho), 0);
    const n = 2400, dX = (XB - XA) / n, tab = [0]; let acc = 0;
    for (let i = 0; i < n; i++) { acc += vs(XA + (i + .5) * dX) * dX; tab.push(acc); }
    const ease = x => { const p = Math.min(n, Math.max(0, x * n)), i = Math.min(n - 1, Math.floor(p)); return (tab[i] + (tab[i + 1] - tab[i]) * (p - i)) / acc; };
    return F.slide(R, [acc, 0, 0], B(XA), B(XB) - B(XA), { ease, lv: 0 });
  }
  const slide1 = N ? slideOf(dw1) : R, slide2 = N ? slideOf(dw2) : R;
  const D1 = N ? dw1.reduce((s, d) => s + d[1] - d[0], 0) : 0, D2 = N ? dw2.reduce((s, d) => s + d[1] - d[0], 0) : 0;

  // ---------- Bogen ----------
  const xmax = A2x + D2 + 2 * pa;
  K.sheet(A1x - 2.5, xmax + 3, -12, N ? 5 : 8);

  // ---------- Leporello: Seiten liegen im Bogen deckungsgleich als geschlossener Bericht (Rechteck, um −hh gedreht, damit das aufgeschlagene Zickzack quer
  // zum Bild läuft). Seite 0 steht an ihrer Fußkante auf, jede weitere schlägt an der abwechselnd rechten und linken Kante um gam auf (geschlossen 0,
  // aufgeschlagen gam = 180° − 2·hh). Ungerade Seiten zeigen dem Betrachter ihre Unterseite (Seite davor wird beim Aufschlagen aufgedeckt).
  const PG = ["#fbfaf6", "#f1eee6"].map(c3);
  function lepo(tag, par, A0, W, H, n, part, rise, TP, DP) {
    const d0 = [cs, -sn], eb = [-sn, -cs];
    const lp = (u, v) => [A0[0] + d0[0] * u + eb[0] * v, A0[1] + d0[1] * u + eb[1] * v];
    F.part(tag, part[0], part[1], { lift: .014 });
    const p0 = K.panel(par, lp(0, 0), lp(W, 0), eb, rise[0], rise[1], Q, { over: .05, lv: 1 });
    K.rect(p0, 0, 0, W, H, PG[0], .5);
    const pg = [p0], rect = [[0, 0], [W, 0], [W, H], [0, H]].map(q => p0.uv(q[0], q[1]));
    for (let k = 1; k < n; k++) {
      const u = k % 2 ? W : 0;
      const nd = F.hinge(pg[k - 1], p0.uv(u, 0), p0.uv(u, H), p0.uv(W / 2, H / 2), gam, TP[k - 1], DP[k - 1], { lv: 1 + 2 * k, over: .05, nofold: k > 2 });
      nd.uv = p0.uv; nd.n = p0.n;
      F.poly(nd, rect, PG[k % 2], .5, 0, COL.INK, { nocut: true });
      pg.push(nd);
    }
    return { p0, pg, lp, eb, W, H };
  }
  // linksbündiger Textblock auf einer Seite: tx Rand, vTop Oberkante der ersten Zeile; Unterseite (side −1) läuft gegen u, daher gespiegelt
  function put(L, k, pr, tx, vTop) {
    const side = k % 2 ? -1 : 1, e = pr.e;
    const cx = tx - pr.t.padX * e + pr.w / 2, cy = vTop + .34 * e - pr.h / 2;
    K.onPanel(L.pg[k], pr, side > 0 ? cx : L.W - cx, cy, side, L.eb);
    return pr;
  }
  const putDecal = (L, k, dec, u, v) => K.onPanel(L.pg[k], dec, k % 2 ? L.W - u : u, v, k % 2 ? -1 : 1, L.eb);

  // ---------- 1. SiS-Wirkungsbericht ----------
  const zA = dl / 2;                                                           // Fußlinie der ersten Falz vorn, die zweite hinten (Zickzack um die Mittelebene)
  const U1 = ev.u1, TP1 = [], DP1 = [];
  for (let k = 1; k <= 5; k++) { TP1.push(B(U1[k][0])); DP1.push(DB(U1[k][1] - U1[k][0])); }
  const L1 = lepo("bericht", slide1, [A1x, LZ + zA], LW, LH, 6, [B(ev.rise1) - .01, DB(1.1)], [B(ev.rise1 + .2), DB(1.2)], TP1, DP1);
  // Sätze auf den Seiten 0 bis 4 (Seite k trägt Satz k + 1), Quelle auf Seite 5; Titel auf der Vorderseite des Stapels (Oberseite der Seite 5)
  const onT = k => B(U1[k][0] + (U1[k][1] - U1[k][0]) * .45), onO = k => B(U1[k][1] - .15);   // Seite k − 1 wird von Seite k aufgedeckt (k ungerade)
  const sOn = [onT(1), onO(1), onT(3), onO(3), onT(5)];
  Z.forEach((z, i) => { z.on = sOn[i]; put(L1, i, z, MX, ZT); });
  Q1.on = onO(5); put(L1, 5, Q1, MX, ZT);
  // Titel: Stapel steht auf, dann Kicker und Kopf; beim Aufschlagen der ersten Seite klappt die Titelseite mit weg
  kick.on = B(ev.rise1 + 1.5); head.on = kick.on;
  kick.off = head.off = B(U1[1][0]);
  {
    const tx = MX, kv = ZT, hv = ZT - kick.h * 1.05 - eH * .3;
    const cx = (pr, e) => tx - pr.t.padX * e + pr.w / 2;
    K.onPanel(L1.pg[5], kick, cx(kick, eK), kv + .34 * eK - kick.h / 2, 1, L1.eb);
    K.onPanel(L1.pg[5], head, cx(head, eH), hv + .34 * eH - head.h / 2, 1, L1.eb);
  }
  // Schmuck der Seiten (Piktogramme, keine Zahlen): Netz der Standorte (Seite 1), Wirkungsgrafik (2), Text und Gestaltung (3), Häkchen (4), Herz (5), Sprechblase (6)
  const vD = ZT + (LH - ZT) / 2 + .05, dw = LW - 2 * MX - .1, PXU = 260;
  const deco = (k, w, h, draw) => putDecal(L1, k, K.decal(Math.round(w * PXU), Math.round(h * PXU), draw, w, h, (k < 5 ? sOn[k] : onO(5)) + .02), LW / 2, vD);
  const strk = (x, a, lw = 4) => { x.strokeStyle = ink(a); x.lineWidth = lw; x.lineCap = "round"; x.lineJoin = "round"; };
  {
    const nw = Math.min(1.7, dw);
    deco(0, nw, nw * .6, (x, W, H) => {
      const nodes = [[.12, .62], [.3, .3], [.46, .72], [.6, .22], [.74, .55], [.9, .3], [.5, .46]], edges = [[0, 1], [1, 2], [1, 3], [2, 6], [3, 4], [4, 5], [6, 4], [3, 6], [0, 2]];
      strk(x, .3, 3); edges.forEach(([i, j]) => { x.beginPath(); x.moveTo(nodes[i][0] * W, nodes[i][1] * H); x.lineTo(nodes[j][0] * W, nodes[j][1] * H); x.stroke(); });
      nodes.forEach(([u, v], i) => { x.beginPath(); x.arc(u * W, v * H, (i === 6 ? .045 : .03) * W, 0, 2 * PI); x.fillStyle = i === 6 ? ink(.7) : ink(.22); x.fill(); strk(x, .55, 3); x.stroke(); });
    });
    const gw = Math.min(1.8, dw);
    deco(1, gw, gw * .5, (x, W, H) => {
      const n = 5, bw = W / (n * 1.6), gap = (W - n * bw) / (n - 1), hs = [.28, .4, .52, .68, .92];
      strk(x, .5, 3); x.beginPath(); x.moveTo(0, H - 2); x.lineTo(W, H - 2); x.stroke();
      hs.forEach((v, i) => { x.fillStyle = i === n - 1 ? ink(.62) : ink(.2); x.fillRect(i * (bw + gap), H - 2 - v * (H - 8), bw, v * (H - 8)); });
    });
    const sw = Math.min(2.0, dw);
    deco(2, sw, sw * .52, (x, W, H) => {
      const half = W / 2, s = Math.min(half * .62, H * .56), cy = H * .4, c1 = half / 2, c2 = half * 1.5;
      strk(x, .62, 4); x.strokeRect(c1 - s / 2, cy - s / 2, s, s); x.strokeRect(c2 - s / 2, cy - s / 2, s, s);
      strk(x, .5, 4);
      [[-.28, .26], [-.1, .26], [.08, .26], [.26, .12]].forEach(([dy, hw]) => { x.beginPath(); x.moveTo(c1 - s * .3, cy + dy * s); x.lineTo(c1 - s * .3 + s * (hw * 2 + .08), cy + dy * s); x.stroke(); });
      x.beginPath(); x.arc(c2 - s * .15, cy - s * .12, s * .17, 0, 2 * PI); x.stroke();
      x.beginPath(); x.moveTo(c2 + s * .02, cy + s * .3); x.lineTo(c2 + s * .22, cy - s * .02); x.lineTo(c2 + s * .38, cy + s * .3); x.closePath(); x.stroke();
      x.fillStyle = MUTED; x.textAlign = "center"; x.font = `500 ${Math.round(H * .13)}px "Schibsted Grotesk", sans-serif`;
      x.fillText("TEXT", c1, H * .93); x.fillText("GESTALTUNG", c2, H * .93);
    });
    const cw = Math.min(1.0, dw);
    deco(3, cw, cw, (x, W, H) => {
      strk(x, .3, 8); x.beginPath(); x.arc(W / 2, H / 2, W * .42, 0, 2 * PI); x.stroke();
      strk(x, .72, 9); x.beginPath(); x.moveTo(W * .3, H * .53); x.lineTo(W * .44, H * .67); x.lineTo(W * .72, H * .35); x.stroke();
    });
    deco(4, cw, cw, (x, W, H) => {
      strk(x, .55, 8); x.beginPath(); x.moveTo(W * .5, H * .8);
      x.bezierCurveTo(W * .05, H * .5, W * .2, H * .12, W * .5, H * .36);
      x.bezierCurveTo(W * .8, H * .12, W * .95, H * .5, W * .5, H * .8); x.stroke();
    });
    deco(5, cw, cw, (x, W, H) => {
      strk(x, .45, 8); x.beginPath(); x.roundRect(W * .08, H * .14, W * .84, H * .58, W * .1); x.stroke();
      x.beginPath(); x.moveTo(W * .3, H * .72); x.lineTo(W * .26, H * .9); x.lineTo(W * .46, H * .72); x.stroke();
      strk(x, .3, 7); [.32, .48].forEach(v => { x.beginPath(); x.moveTo(W * .24, H * v); x.lineTo(W * (v < .4 ? .76 : .6), H * v); x.stroke(); });
    });
  }

  // ---------- 2. ai-coustics ----------
  const RA = [B(ev.rise2 + .2), DB(1.2)], TP2 = [B(ev.u2[0])], DP2 = [DB(ev.u2[1] - ev.u2[0])];
  const L2 = lepo("bericht2", slide2, [A2x, LZ + dla / 2], AW, AH, 2, [B(ev.rise2) - .01, DB(1.1)], RA, TP2, DP2);
  const pa2 = L2.pg, p0a = L2.p0, eb2 = L2.eb;
  A[0].on = B(ev.u2[0] + (ev.u2[1] - ev.u2[0]) * .55); A[1].on = Q2.on = B(ev.u2[1] - .15);
  put(L2, 0, A[0], MX, ZA); put(L2, 1, A[1], MX, ZA);
  put(L2, 1, Q2, MX, ZA - A[1].th - .35);
  // Name auf dem geschlossenen Stapel (Kurzname, kein Satz)
  const nm = K.print(["ai-coustics"], eK * 1.15, B(ev.rise2 + 1.4), { font: "kicker", col: "#5f5f63", text: "ai-coustics" });
  K.onPanel(pa2[1], nm, MX - nm.t.padX * nm.e + nm.w / 2, ZA - nm.h / 2 + .34 * nm.e, 1, eb2);
  nm.off = A[0].on - DB(.2);
  // Zackenreihe über der ersten Seite (Schallwelle: abwechselnd kurz und lang); die Zacken klappen hinter die Seite
  const BWT = N ? .55 : .5, NT = Math.floor(AW / BWT), TOOTH = c3("#dcd5c6"), teeth = [];
  const tx0 = (AW - NT * BWT) / 2;
  for (let i = 0; i < NT; i++) {
    const u0 = tx0 + i * BWT, ht = i % 2 ? .3 + .4 * rnd(i, 1) : .7 + .5 * rnd(i, 1);
    const tF = B(ev.teeth[0] + (ev.teeth[1] - ev.teeth[0]) * i / (NT - 1));
    const t = K.panel(pa2[0], p0a.uv(u0, AH), p0a.uv(u0 + BWT, AH), eb2, tF, DB(.5), -(PI - .3), { over: .035 });
    K.P(t, [[0, 0], [BWT, 0], [BWT / 2, ht]], TOOTH, [.5, .5, .5]);
    teeth.push(t);
  }
  // eine einzige Fahne steht aus der glatten Kante der zweiten Seite auf: der letzte Schliff (Bild, kein Text)
  const FWD = Math.min(1.6, AW * .3), FHT = 1.0;
  const flag = K.panel(pa2[1], p0a.uv((AW - FWD) / 2, AH), p0a.uv((AW + FWD) / 2, AH), eb2, B(ev.flag[0]), DB(ev.flag[1] - ev.flag[0]), 0, { ang0: -(PI - .25), over: .06 });
  K.P(flag, [[0, 0], [FWD, 0], [FWD / 2, FHT]], c3("#fbfaf7"), [.5, .5, .5]);

  // ---------- Konstruktionsphase: Gerüst je Seite kurz vor dem Aufschlagen, Bleistiftspur ----------
  {
    const dg = DB(1.6);
    if (!N) {
      L1.pg.forEach((nd, k) => { const t1 = k === 0 ? B(ev.rise1) : TP1[k - 1]; F.geruest({ tags: ["bericht"], t0: t1 - dg, t1, du: .02, a: .5, filter: n => n === nd }); });
      L2.pg.forEach((nd, k) => { const t1 = k === 0 ? B(ev.rise2) : TP2[0]; F.geruest({ tags: ["bericht2"], t0: t1 - dg, t1, du: .02, a: .5, filter: n => n === nd && n !== flag && !teeth.includes(n) }); });
    } else {
      // Handy: Gerüst nur der stehenden Titelseite, vor dem Mitfahren (der Endzustand läge sonst um die Mitfahrt versetzt)
      F.geruest({ tags: ["bericht"], t0: B(ev.rise1) - dg, t1: B(ev.rise1), du: .02, a: .5, filter: n => n === L1.p0, bAt: B(dw1[0][0]) - .002 });
      F.geruest({ tags: ["bericht2"], t0: B(ev.rise2) - dg, t1: B(ev.rise2), du: .02, a: .5, filter: n => n === L2.p0, bAt: B(dw2[0][0]) - .002 });
    }
    F.spur({ tags: ["bericht", "bericht2"], quiet: [...L1.pg, ...pa2, flag], filter: nd => !teeth.includes(nd), a: .3 });
  }

  // ---------- Roter Faden: am Fuß der Seiten entlang, vor dem Falz (der Punkt in Bildmitte sitzt unter dem Text) ----------
  const zt = LZ + zA + (N ? .4 : .5), xf = Math.max(xe, xmax) + 4;
  const faden = [[xs, .004, zt], [xs + 3, .004, zt], [xf, .004, zt]];

  // ---------- Lesestellen ----------
  const stops = [{ name: "s0", prints: [kick, head], text: TEXT.kicker + " · " + TEXT.kopf }];
  Z.forEach((z, i) => { stops.push({ name: "s" + (i + 1), prints: [z], text: TEXT.sis[i] }); if (i === 4) stops.push({ name: "s5b", prints: [Q1], text: TEXT.sisQuelle }); });
  stops.push({ name: "s6", prints: [A[0]], text: TEXT.ai[0] });
  stops.push({ name: "s7", prints: [A[1], Q2], text: TEXT.ai[1] + " – " + TEXT.aiQuelle });

  return {
    strecke: [xs, xe], lineZ: LZ,
    grid: { step: .5, every: 5, a: .12, aM: .22, t0: .004, wave: .0025, d: .04, out: .1 },
    faden, stops, anchor: xs
  };
}
