// Trägerform „Abreißkalender“ für die Lesebahn (Szene Betreuung, Drehbuch Abschnitt 6).
// Ein Kalenderblock steht auf einer Fußlasche mit Lochung (der rote Faden läuft durch die Löcher), zurückgelehnt um die Neigung der Kamera, mit zwei
// Stützen wie der Anhänger. Der Block trägt oben die dunkle Kopfleiste mit Aufhängeloch und Spiralbindung, darunter klein den Monatsnamen
// (Perforation darüber), dann den ganzen Satz; am Fuß des Blattes deuten drei gestufte Linien die Blätter darunter an.
// Mechanik wie der Anhänger (Fuß, Falz, Stützen), das Blatt schlägt mit Rückprall an (bounce), wie die Monatsblätter der Szenerie.
// Geometrie und Druck sind rechnerisch geprüft (bahnpr.mjs), die Sichtprüfung steht aus.
const PI = Math.PI;
const ink = a => `rgba(48,48,51,${a})`;

export function kalender(monate) {
  const form = {
    name: "kalender",
    maxEm: narrow => narrow ? 15 : 18,
    FD: .46,
    build(c) {
      const { K, x, z, lines, e, tw, th, i, t, lean, tag } = c, { Q, R } = K, FD = form.FD;
      const mx = 1.6 * e, hb = 1.5 * e, mt = hb + 1.9 * e, mb = 1.9 * e;      // Ränder: seitlich, Kopfleiste, bis Textbeginn, unten
      const Wc = tw + 2 * mx, Hc = mt + th + mb;
      const col = c.col || K.COL.WHITE.map((v, k) => [.969, .957, .925][k]);
      // Fuß mit Lochung (Faltplan: Lasche vor der Grundlinie), Blatt am hinteren Rand angeschlagen
      const foot = K.panel(R, [x, z + FD], [x + Wc, z + FD], [0, -1], t.line + .02, .02, 0, { nofold: true, over: 0 });
      K.rect(foot, 0, 0, Wc, FD, col, .42);
      const nd = K.panel(foot, foot.uv(0, FD), foot.uv(Wc, FD), [0, -1], t.rise, .045, Q - lean, { over: .04, bounce: .03 });
      K.rect(nd, 0, 0, Wc, Hc, col, .4);
      // Stützen: Dreiecke an den Rändern, klappen senkrecht nach hinten
      const ws = Math.min(.42, Hc * .5), ug = ws * Math.sin(lean), vg = ws * Math.cos(lean), uT = Math.min(Hc * .9, .75), tw0 = t.rise + .03;
      const wl = K.panel(nd, nd.uv(0, 0), nd.uv(0, uT), [-1, 0], tw0, .035, -Q, { over: .07 });
      K.P(wl, [[0, 0], [uT, 0], [ug, vg]], col, .3);
      const wr = K.panel(nd, nd.uv(Wc, 0), nd.uv(Wc, uT), [1, 0], tw0 + .004, .035, -Q, { over: .07 });
      K.P(wr, [[0, 0], [uT, 0], [ug, vg]], col, .3);
      // Aufdruck des Blattes: Kopfleiste, Aufhängeloch, Spirale, Perforation, Monatsname, Blattstapel
      const label = String(monate[i % monate.length]).toUpperCase();
      const S = 200, pw = Math.round(Wc * S), ph = Math.round(Hc * S);
      const face = (x2, w, h) => {
        const s = w / Wc, lw = Math.max(1.5, .02 * s);
        x2.fillStyle = ink(.86); x2.beginPath(); x2.roundRect(0, 0, w, hb * s, [.05 * s, .05 * s, 0, 0]); x2.fill();
        x2.fillStyle = "#e7e2d7"; x2.beginPath(); x2.arc(w / 2, hb * s * .42, .2 * hb * s, 0, 2 * PI); x2.fill();
        x2.strokeStyle = "rgba(255,255,255,.55)"; x2.lineWidth = lw; x2.stroke();
        const n = Math.max(5, Math.round(Wc / (2.7 * e)));
        for (let j = 0; j < n; j++) {
          const cx = (j + .5) * w / n;
          x2.beginPath(); x2.roundRect(cx - .13 * e * s, (hb - .55 * e) * s, .26 * e * s, 1.25 * e * s, .13 * e * s);
          x2.fillStyle = "#f4f1ea"; x2.fill(); x2.strokeStyle = ink(.6); x2.lineWidth = lw; x2.stroke();
          x2.fillStyle = ink(.5); x2.beginPath(); x2.arc(cx, (hb + .12 * e) * s, .045 * e * s, 0, 2 * PI); x2.fill();
        }
        x2.strokeStyle = ink(.3); x2.lineWidth = lw; x2.setLineDash([.18 * s, .14 * s]);
        x2.beginPath(); x2.moveTo(.1 * s, (hb + .95 * e) * s); x2.lineTo(w - .1 * s, (hb + .95 * e) * s); x2.stroke(); x2.setLineDash([]);
        x2.fillStyle = ink(.7); x2.font = `700 ${.56 * e * s}px "Schibsted Grotesk", sans-serif`; x2.textAlign = "left"; x2.textBaseline = "alphabetic";
        try { x2.letterSpacing = (.12 * .56 * e * s) + "px"; } catch (err) { /* ohne Laufweite */ }
        x2.fillText(label, mx * s, (hb + 1.6 * e) * s);
        for (let j = 0; j < 3; j++) {
          const y = h - (.5 + .4 * j) * e * s, ins = (.06 + .1 * j) * s;
          x2.strokeStyle = ink(.24 - .06 * j); x2.lineWidth = lw; x2.beginPath(); x2.moveTo(ins, y); x2.lineTo(w - ins, y); x2.stroke();
        }
      };
      K.onPanel(nd, K.decal(pw, ph, face, Wc, Hc, t.rise + .005, .02), Wc / 2, Hc / 2, 1, null, .001);
      // Lochung im Fuß (hier läuft der Faden durch), die erste unter dem Textbeginn
      const od = Math.min(.36, FD * .8), u1 = mx + 2 * e, u2 = Wc - mx - 2 * e;
      const loch = (x2, w) => {
        const r = w / 2; x2.translate(r, r);
        x2.fillStyle = "#e7e2d7"; x2.strokeStyle = ink(.55); x2.lineWidth = r * .08; x2.beginPath(); x2.arc(0, 0, r * .92, 0, 2 * PI); x2.fill(); x2.stroke();
        x2.fillStyle = ink(.2); x2.beginPath(); x2.arc(r * .06, r * .1, r * .7, 0, 2 * PI); x2.fill();
        x2.fillStyle = "#e7e2d7"; x2.beginPath(); x2.arc(0, 0, r * .62, 0, 2 * PI); x2.fill();
      };
      for (const u of [u1, u2]) K.onPanel(foot, K.decal(256, 256, loch, od, od, t.rise), u, FD / 2, 1);
      const pr = K.print(lines, e, t.text, { lh: c.lh });
      K.onPanel(nd, pr, mx - pr.t.padX * e + pr.w / 2, Hc - mt + .34 * e - pr.h / 2, 1);
      const zA = z + FD / 2;
      return { w: Wc, h: Hc, pr, nd, foot, anchor: [x + u1, .004, zA], anchors: [[x + u1, .004, zA], [x + u2, .004, zA]], quiet: [nd, wl, wr], side: vg, tags: [tag] };
    }
  };
  return form;
}
