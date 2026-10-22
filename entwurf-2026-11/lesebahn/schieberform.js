// Trägerform „Schieber mit Lasche“ für die Lesebahn (Szene Modernisierung, Drehbuch Abschnitt 7).
// Eine Tasche (Schlitzkarton) steht auf einer Fußlasche mit zwei Ösen (der rote Faden läuft hindurch), zurückgelehnt um die Neigung der Kamera, mit zwei
// Stützen wie der Anhänger. In der Tasche steckt ein Papierstreifen mit Lasche und Fingerloch. Der Streifen gleitet nach oben aus der Tasche
// (F.slide mit kleinem Überschwingen) und trägt den ganzen Satz; erst wenn er steht, blendet der Text ein.
// Alt → neu: Der Streifen ist je Satz anders gesetzt: gealtertes Papier mit doppeltem Rahmen und Fase (alt), einfacher Rahmen, klares weißes Papier
// ohne Rahmen (neu); die Tasche trägt einen kleinen Pfeil nach oben, der Streifen folgt der Reihenfolge der Sätze.
// Geometrie und Druck sind rechnerisch geprüft (bahnpr.mjs), die Sichtprüfung steht aus.
const PI = Math.PI;
const ink = a => `rgba(48,48,51,${a})`;

// stufen: Papierfarbe und Gestaltung je Satz, von alt (0) nach neu (n-1)
export function schieber(stufen) {
  const form = {
    name: "schieber",
    maxEm: narrow => narrow ? 15 : 21,
    FD: .46,
    build(c) {
      const { K, x, z, lines, e, tw, th, i, t, lean, tag } = c, { Q, R, F } = K, FD = form.FD;
      const st = stufen[Math.min(i, stufen.length - 1)];
      const mx = 1.8 * e, sm = .45 * e, vm = 1.1 * e;                          // Rand der Tasche, Überstand der Tasche neben dem Streifen, Rand im Streifen oben/unten
      const Wc = tw + 2 * mx, Ws = Wc - 2 * sm;
      const bodyH = th + 2 * vm, tabH = 1.0 * e, ov = 1.0 * e;                 // Streifen: Körper, Lasche, Rest, der nach dem Ausziehen in der Tasche bleibt
      const Hh = bodyH + .4 * e;                                               // Höhe der Tasche
      const D = bodyH - .6 * e;                                                // Weg des Streifens
      const vA = Hh - ov;                                                      // Unterkante des Streifens nach dem Ausziehen
      const pap = c.col || K.COL.WHITE.map((v, kk) => [.969, .957, .925][kk]);
      const col = st.col;
      // Fuß mit Ösen (Faltplan: Lasche vor der Grundlinie), Tasche am hinteren Rand angeschlagen
      const foot = K.panel(R, [x, z + FD], [x + Wc, z + FD], [0, -1], t.line + .02, .02, 0, { nofold: true, over: 0 });
      K.rect(foot, 0, 0, Wc, FD, pap, .42);
      const nd = K.panel(foot, foot.uv(0, FD), foot.uv(Wc, FD), [0, -1], t.rise, .045, Q - lean, { over: .04 });
      K.rect(nd, 0, 0, Wc, Hh, pap, .4);
      // Stützen
      const ws = Math.min(.42, Hh * .5), ug = ws * Math.sin(lean), vg = ws * Math.cos(lean), uT = Math.min(Hh * .9, .75), tw0 = t.rise + .03;
      const wl = K.panel(nd, nd.uv(0, 0), nd.uv(0, uT), [-1, 0], tw0, .035, -Q, { over: .07 });
      K.P(wl, [[0, 0], [uT, 0], [ug, vg]], pap, .3);
      const wr = K.panel(nd, nd.uv(Wc, 0), nd.uv(Wc, uT), [1, 0], tw0 + .004, .035, -Q, { over: .07 });
      K.P(wr, [[0, 0], [uT, 0], [ug, vg]], pap, .3);
      // Streifen: gleitet in der Ebene der Tasche um D nach oben (Ruhelage: fast ganz in der Tasche, nur die Lasche schaut heraus)
      const tS = t.rise + .055, dS = .045;
      const ps = F.slide(nd, [0, 0, -D], tS, dS, { over: .03, fresh: 1 });
      const uS0 = sm, uS1 = sm + Ws, vTopRest = vA + bodyH - D, vBotRest = vA - D;
      const P = (u, v) => nd.uv(u, v);
      F.poly(ps, [P(uS0, vBotRest), P(uS1, vBotRest), P(uS1, vTopRest), P(uS0, vTopRest)], col, .4, .012);
      const tu0 = uS1 - 4.2 * e, tu1 = uS1 - .8 * e, tR = .3 * e;
      F.poly(ps, [P(tu0, vTopRest), P(tu1, vTopRest), P(tu1 - tR, vTopRest + tabH), P(tu0 + tR, vTopRest + tabH)], col, [0, .4, .4, .4], .012);
      // Gestaltung des Streifens (Rahmen, Fase) und Fingerloch in der Lasche
      const S = 200, pw = Math.round(Ws * S), ph = Math.round((bodyH + tabH) * S);
      const face = (x2, w, h) => {
        const s = w / Ws, lw = Math.max(1.5, .014 * s), by = tabH * s, bh = h - by;
        x2.strokeStyle = ink(st.frame); x2.lineWidth = lw;
        if (st.frame) {
          x2.strokeRect(.06 * e * s, by + .06 * e * s, w - .12 * e * s, bh - .12 * e * s);
          if (st.double) x2.strokeRect(.2 * e * s, by + .2 * e * s, w - .4 * e * s, bh - .4 * e * s);
        }
        if (st.fase) { x2.fillStyle = "rgba(255,255,255,.7)"; x2.fillRect(0, by, w, .1 * e * s); x2.fillRect(0, by, .1 * e * s, bh); x2.fillStyle = ink(.3); x2.fillRect(0, h - .1 * e * s, w, .1 * e * s); x2.fillRect(w - .1 * e * s, by, .1 * e * s, bh); }
        // Lasche: Fingerloch und kleiner Pfeil nach oben
        const cx = w - 2.5 * e * s, cy = .5 * e * s;
        x2.fillStyle = "#e7e2d7"; x2.beginPath(); x2.arc(cx, cy, .26 * e * s, 0, 2 * PI); x2.fill();
        x2.strokeStyle = ink(.55); x2.lineWidth = lw; x2.stroke();
      };
      const dec = K.decal(pw, ph, face, Ws, bodyH + tabH, t.rise + .005, .02);
      F.attach(ps, dec.mesh, P(uS0 + Ws / 2, vBotRest + (bodyH + tabH) / 2), nd.n, 1, .0155);
      // Tasche vorn: bedeckt den unteren Teil des Streifens, mit Pfeil nach oben
      const fT = Hh - .3 * e;
      F.poly(nd, [P(.28 * e, .28 * e), P(Wc - .28 * e, .28 * e), P(Wc - .28 * e, fT), P(.28 * e, fT)], pap, .4, .024);
      const front = K.decal(Math.round((Wc - .56 * e) * 160), Math.round((fT - .28 * e) * 160), (x2, w, h) => {
        x2.strokeStyle = ink(.34); x2.lineWidth = 2.2; x2.lineCap = "round"; x2.lineJoin = "round";
        const a = Math.min(w, h) * .12, cx = w / 2;
        x2.beginPath(); x2.moveTo(cx - a, h * .5); x2.lineTo(cx, h * .5 - a); x2.lineTo(cx + a, h * .5); x2.moveTo(cx, h * .5 - a); x2.lineTo(cx, h * .5 + a * 1.4); x2.stroke();
      }, Wc - .56 * e, fT - .28 * e, t.rise + .005, .02);
      F.attach(nd, front.mesh, P(Wc / 2, .28 * e + (fT - .28 * e) / 2), nd.n, 1, .0265);
      // Lochung der Ösen im Fuß
      const od = Math.min(.36, FD * .8), u1 = mx + 2 * e, u2 = Wc - mx - 2 * e;
      const eyelet = (x2, w) => {
        const r = w / 2; x2.translate(r, r);
        x2.fillStyle = "#e9e3d6"; x2.strokeStyle = ink(.5); x2.lineWidth = r * .08; x2.beginPath(); x2.arc(0, 0, r * .92, 0, 2 * PI); x2.fill(); x2.stroke();
        x2.fillStyle = ink(.22); x2.beginPath(); x2.arc(0, 0, r * .46, 0, 2 * PI); x2.fill();
        x2.strokeStyle = ink(.55); x2.lineWidth = r * .07; x2.stroke();
        x2.strokeStyle = "rgba(255,255,255,.7)"; x2.lineWidth = r * .06; x2.beginPath(); x2.arc(0, 0, r * .7, PI * 1.05, PI * 1.45); x2.stroke();
      };
      for (const u of [u1, u2]) K.onPanel(foot, K.decal(256, 256, eyelet, od, od, t.rise), u, FD / 2, 1);
      // Satz auf dem Streifen (gleitet mit)
      const pr = K.print(lines, e, t.text, { lh: c.lh });
      // Mitte des Druckblocks: seitlich Rand mx (von der Karte), oben vm unter der Oberkante des Streifenkörpers (Ruhelage, gleitet mit)
      F.attach(ps, pr.mesh, P(mx - pr.t.padX * e + pr.w / 2, vBotRest + bodyH - vm + .34 * e - pr.h / 2), nd.n, 1, .0165);
      const zA = z + FD / 2;
      return { w: Wc, h: Hh + bodyH - ov + tabH, pr, nd, foot, anchor: [x + u1, .004, zA], anchors: [[x + u1, .004, zA], [x + u2, .004, zA]], quiet: [nd, wl, wr], side: vg, tags: [tag] };
    }
  };
  return form;
}
