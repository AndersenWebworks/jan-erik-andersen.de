// Messkern der Bildprüfung: misst an einer three.js-Szene, ob wichtige Teile im Bild liegen, Titel und Text unverdeckt sind, Bildschirme
// lesbar stehen und gefüllt sind und Teile so liegen, wie es deklariert ist. Projektneutral: keine Pfade, keine Szenennamen, keine Seitenbegriffe.
// Der Kern misst nur (Zahlen). Bewertet wird in bewertung.py (Grenzwerte als benannte Konstanten, OK/WARNUNG/FEHLER).
//
// Aufruf:  import { messen } from "./messkern.js";   const ergebnis = await messen(zugriff, deklaration, { provokation: null });
//
// ---------- Szenenzugriff (die kleine Schnittstelle; sie kann aus einem geladenen glb ebenso bedient werden wie aus einer zur Laufzeit gebauten Szene) ----------
//   THREE        das three.js-Modul des Projekts (der Kern importiert three nicht selbst)
//   wurzel       Object3D, unter dem die Teile gesucht werden; seine matrixWorld legt die Szenenkoordinaten fest
//   kamera       PerspectiveCamera; nach stelle() mit aktueller matrixWorld und projectionMatrix (auch Objektivverschiebung)
//   stelle(zeit) Szene und Kamera auf den Zeitpunkt stellen (Animation, Einblenden, Kamerafahrt) und updateMatrixWorld(true) aufrufen
//   -- optional --
//   welt         Object3D mit allen Dingen, die verdecken können (Vorgabe: wurzel)
//   name(o)      Name eines Knotens (Vorgabe o.name; glb-Namen werden von three bereinigt, dann den Originalnamen liefern)
//   hilfsgeometrie(o)  true für Linien, Schienen, Boden, Himmel usw.: zählt weder als Teil noch als Verdecker
//   sichtbar(o)  Vorgabe: o und alle Eltern haben visible
//   flaeche(name)      Fläche mit Inhalt (Bildschirm, Schild, Tafel): { ecken:[p00,p10,p11,p01] (Welt, Vector3, einmal um die Fläche), normale (Welt, zur Vorderseite),
//                      eigene:[Object3D] (verdecken nicht), punkte():[Vector3] (Messpunkte der Verdeckung, z. B. Textzeilen), sichtbar():bool,
//                      ebenen(zeit):{ quellen:[{ quelle: Canvas/Bild, hintergrund: Farbstring }], erwartet: n } (Beitrag dieser Fläche zum gezeichneten Inhalt zum Zeitpunkt, für den Füllgrad; n = Zahl der Ebenen, die dann da sein müssten) }
//
// ---------- Deklaration (nur Daten) ----------
//   teile:       { <alias>: [<knotenname oder muster mit *>, ...] }   Teilnamen in den anderen Einträgen dürfen Aliase, Knotennamen oder Muster sein
//   anschnitt:   [{ teil, bei }]                      Teil muss vollständig im Bild liegen
//   verdeckung:  [{ teil | flaeche, bei, ignorieren?, punkte? }]   keine fremde Geometrie zwischen Kamera und Teil/Fläche
//   bildschirme: [{ name?, flaechen:[<flächenname>...], bei, luecke? }]   Blickwinkel, Anteil am Bild, Füllgrad (erste Fläche gibt die Lage vor)
//   regeln:      [{ teil, bei, unter?, auf?, neben?, innerhalb?, links_von?, rechts_von?, vor?, hinter?, front?:{flaeche,zur}, aufrecht?:<flächenteil>|{flaeche} }]
//   grenzen:     (an jedem Eintrag, optional) { <schlüssel>: wert } überschreibt Grenzwerte der Bewertung, wird nur durchgereicht
//   bei:         [Zeitpunkt]; Zeitpunkt = Zahl oder { zeit, name }   (die Auflösung von Namen ist Sache der Anbindung, der Kern kennt nur zeit und name)
// Szenenkoordinaten in den Ergebnissen: x rechts, y in die Tiefe, z oben (three: x, -z, y).

export const MESS = {
  nahe: .05,                 // Tiefe (Einheiten), ab der ein Punkt vor der Kamera zählt
  verdeckung_punkte: 400,    // Messpunkte je Teil, nach Fläche gleichmäßig verteilt
  verdeckung_abstand: .004,  // der Strahl endet so weit vor dem Messpunkt (Einheiten)
  fuell_spalten: 320,        // Raster der Füllgradmessung (Spalten über die Breite der Fläche)
  fuell_farbabstand: 12,     // größter Kanalunterschied (0..255) zur Hintergrundfarbe, ab dem ein Rasterpunkt Inhalt ist
  fuell_luecke: .04,         // Lücke (Anteil der Breite), die zwischen Inhalten noch als gefüllt gilt (Absatzabstand, Rand um Blöcke)
};

const grad = r => r * 180 / Math.PI;

export async function messen(z, d, opt = {}) {
  const THREE = z.THREE;
  const welt = z.welt || z.wurzel;
  const nameVon = z.name || (o => o.name);
  const hilfs = z.hilfsgeometrie || (() => false);
  const sichtbar = z.sichtbar || (o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; });
  const T2B = v => [v.x, -v.z, v.y];
  const zeiten = bei => [].concat(bei ?? []).map(x => typeof x === "number" ? { zeit: x, name: `Zeit ${x}` } : x);

  // ---------- Teile finden ----------
  const alle = []; z.wurzel.traverse(o => alle.push(o));
  const glob = s => new RegExp("^" + s.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
  const aufl = (spec, tiefe = 0) => {
    if (tiefe > 6) throw new Error("Teil-Alias zu tief verschachtelt: " + JSON.stringify(spec));
    const aus = new Set();
    for (const s of [].concat(spec)) {
      if (d.teile && Object.prototype.hasOwnProperty.call(d.teile, s)) { aufl(d.teile[s], tiefe + 1).forEach(x => aus.add(x)); continue; }
      const re = glob(s); alle.forEach(o => { if (re.test(nameVon(o))) aus.add(o); });
    }
    return aus;
  };
  const knoten = spec => [...aufl(spec)];
  const meshes = spec => {
    const m = new Set();
    for (const n of knoten(spec)) n.traverse(o => { if (o.isMesh && !hilfs(o) && o.geometry && o.geometry.attributes.position) m.add(o); });
    return [...m];
  };
  const eckenWelt = (mesh, fn) => {
    const pos = mesh.geometry.attributes.position, M = mesh.matrixWorld, p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) fn(p.fromBufferAttribute(pos, i).applyMatrix4(M), i);
  };

  // ---------- Kamera ----------
  function projektor() {
    const cam = z.kamera, inv = cam.matrixWorld.clone().invert(), P = cam.projectionMatrix, v = new THREE.Vector3();
    const pr = (w, aus = {}) => {
      v.copy(w).applyMatrix4(inv); const t = -v.z; aus.t = t;
      if (t > MESS.nahe) { v.applyMatrix4(P); aus.x = (v.x + 1) / 2; aus.y = (v.y + 1) / 2; } else { aus.x = NaN; aus.y = NaN; }
      return aus;
    };
    pr.pos = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
    pr.blick = new THREE.Vector3(0, 0, -1).transformDirection(cam.matrixWorld);
    pr.inv = inv;
    return pr;
  }
  const imBild = q => q.x >= 0 && q.x <= 1 && q.y >= 0 && q.y <= 1;

  // ---------- 1 Anschnitt ----------
  function mAnschnitt(e) {
    const alleM = meshes(e.teil);
    if (!alleM.length) return { fehler: "Teil nicht gefunden: " + JSON.stringify(e.teil) };
    const ms = alleM.filter(sichtbar);
    if (!ms.length) return { unsichtbar: true };
    const pr = projektor(), q = {};
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, hinten = 0, n = 0;
    for (const m of ms) eckenWelt(m, p => {
      pr(p, q); n++;
      if (Number.isNaN(q.x)) { hinten++; return; }
      if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y;
    });
    if (hinten) return { hinter_kamera: hinten, punkte: n, rand_min: -1, kante: "hinter der Kamera" };
    const rand = { links: x0, rechts: 1 - x1, unten: y0, oben: 1 - y1 };
    const kante = Object.keys(rand).reduce((a, b) => rand[a] <= rand[b] ? a : b);
    return { rand, rand_min: rand[kante], kante, punkte: n, ausdehnung: [x1 - x0, y1 - y0] };
  }

  // ---------- 2 Verdeckung ----------
  function blockerListe(aus) {
    const l = [];
    welt.traverse(o => {
      if (!o.isMesh || hilfs(o) || !sichtbar(o) || !o.material || aus.has(o)) return;
      const m = o.material;
      if (m.side === THREE.BackSide || m.opacity === 0 || m.transparent === true) return;     // Himmelskugeln, durchsichtige Überlagerungen
      l.push(o);
    });
    return l;
  }
  function flaechenpunkte(ms, N, camPos) {
    const tris = []; let summe = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    for (const m of ms) {
      const pos = m.geometry.attributes.position, idx = m.geometry.index, W = new Float32Array(pos.count * 3), p = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) { p.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld); W.set([p.x, p.y, p.z], i * 3); }
      const nt = idx ? idx.count / 3 : pos.count / 3;
      for (let t = 0; t < nt; t++) {
        const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
        a.fromArray(W, i0 * 3); b.fromArray(W, i1 * 3); c.fromArray(W, i2 * 3);
        const fl = n.crossVectors(b.clone().sub(a), c.clone().sub(a)).length() / 2;
        if (fl < 1e-9) continue;
        summe += fl; tris.push({ W, i0, i1, i2, cum: summe });
      }
    }
    const aus = [], a1 = .7548776662466927, a2 = .5698402909980532;     // R2-Folge: gleichmäßig und ohne Zufall
    for (let i = 0; i < N && tris.length; i++) {
      const u = (i + .5) / N * summe; let lo = 0, hi = tris.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid].cum < u) lo = mid + 1; else hi = mid; }
      const t = tris[lo]; let r1 = (.5 + a1 * i) % 1, r2 = (.5 + a2 * i) % 1; if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
      a.fromArray(t.W, t.i0 * 3); b.fromArray(t.W, t.i1 * 3); c.fromArray(t.W, t.i2 * 3);
      const nn = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
      const p = a.clone().addScaledVector(b.clone().sub(a), r1).addScaledVector(c.clone().sub(a), r2);
      if (nn.dot(camPos.clone().sub(p)) > 0) aus.push(p);       // nur Flächen, die zur Kamera zeigen
    }
    return aus;
  }
  function mVerdeckung(e) {
    const pr = projektor(), q = {}, eigene = new Set();
    let punkte;
    if (e.flaeche) {
      const f = z.flaeche(e.flaeche);
      if (!f) return { fehler: "Fläche nicht gefunden: " + e.flaeche };
      if (!f.sichtbar()) return { unsichtbar: true };
      punkte = f.punkte ? f.punkte() : []; (f.eigene || []).forEach(o => eigene.add(o));
      if (!punkte.length) return { fehler: "Fläche ohne Messpunkte: " + e.flaeche };
    } else {
      const alleM = meshes(e.teil);
      if (!alleM.length) return { fehler: "Teil nicht gefunden: " + JSON.stringify(e.teil) };
      const ms = alleM.filter(sichtbar);
      if (!ms.length) return { unsichtbar: true };
      alleM.forEach(m => eigene.add(m));
      punkte = flaechenpunkte(ms, e.punkte || MESS.verdeckung_punkte, pr.pos);
    }
    for (const nm of e.ignorieren || []) meshes(nm).forEach(m => eigene.add(m));
    const blocker = blockerListe(eigene), rc = new THREE.Raycaster(), wer = {};
    let im = 0, verd = 0, aussen = 0;
    for (const p of punkte) {
      pr(p, q);
      if (Number.isNaN(q.x) || !imBild(q)) { aussen++; continue; }
      im++;
      const dv = p.clone().sub(pr.pos), L = dv.length();
      rc.set(pr.pos, dv.normalize()); rc.far = L - MESS.verdeckung_abstand;
      const h = rc.intersectObjects(blocker, false);
      if (h.length) { verd++; let o = h[0].object; while (o && !nameVon(o)) o = o.parent; const nm = o ? nameVon(o) : "?"; wer[nm] = (wer[nm] || 0) + 1; }
    }
    return { punkte: punkte.length, im_bild: im, ausserhalb: aussen, verdeckt: verd, anteil: im ? verd / im : null, blocker: wer };
  }

  // ---------- 3 Bildschirm: Blickwinkel und Anteil am Bild ----------
  function flaecheAnteil(pr, ecken) {
    const vs = ecken.map(p => p.clone().applyMatrix4(pr.inv)), out = [], N = MESS.nahe;
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i], b = vs[(i + 1) % vs.length], ai = -a.z > N, bi = -b.z > N;
      if (ai) out.push(a);
      if (ai !== bi) { const s = (-N - a.z) / (b.z - a.z); out.push(a.clone().lerp(b, s)); }
    }
    let poly = out.map(v => { const w = v.clone().applyMatrix4(z.kamera.projectionMatrix); return [(w.x + 1) / 2, (w.y + 1) / 2]; });
    const flaeche = pg => { let s = 0; for (let i = 0; i < pg.length; i++) { const [x1, y1] = pg[i], [x2, y2] = pg[(i + 1) % pg.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s) / 2; };
    const gesamt = poly.length > 2 ? flaeche(poly) : 0;
    const kappe = (pg, f, inside) => {      // Sutherland-Hodgman gegen eine Halbebene
      const r = [];
      for (let i = 0; i < pg.length; i++) { const a = pg[i], b = pg[(i + 1) % pg.length], ia = inside(a), ib = inside(b); if (ia) r.push(a); if (ia !== ib) r.push(f(a, b)); }
      return r;
    };
    const sx = c => (a, b) => { const t = (c - a[0]) / (b[0] - a[0]); return [c, a[1] + (b[1] - a[1]) * t]; };
    const sy = c => (a, b) => { const t = (c - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, c]; };
    poly = kappe(poly, sx(0), p => p[0] >= 0); if (poly.length) poly = kappe(poly, sx(1), p => p[0] <= 1);
    if (poly.length) poly = kappe(poly, sy(0), p => p[1] >= 0); if (poly.length) poly = kappe(poly, sy(1), p => p[1] <= 1);
    return { im_bild: poly.length > 2 ? flaeche(poly) : 0, gesamt };
  }
  function mBildschirm(e) {
    const f = z.flaeche(e.flaechen[0]);
    if (!f) return { fehler: "Fläche nicht gefunden: " + e.flaechen[0] };
    if (!f.sichtbar()) return { unsichtbar: true };
    const pr = projektor(), n = f.normale.clone().normalize();
    const mitte = f.ecken[0].clone().add(f.ecken[2]).multiplyScalar(.5);
    const zumAuge = pr.pos.clone().sub(mitte), abstand = zumAuge.length(); zumAuge.normalize();
    const winkel = grad(Math.acos(Math.min(1, Math.max(-1, n.dot(zumAuge)))));
    const achse = grad(Math.acos(Math.min(1, Math.max(-1, n.dot(pr.blick.clone().negate())))));
    const an = flaecheAnteil(pr, f.ecken);
    return { winkel, winkel_achse: achse, vorderseite: n.dot(zumAuge) > 0, abstand, anteil: an.im_bild, anteil_gesamt: an.gesamt, normale: T2B(n).map(x => +x.toFixed(3)) };
  }

  // ---------- 4 Füllgrad ----------
  let leereEbenen = false;       // nur der Selbsttest setzt das
  const farbeRGB = s => {
    const c = document.createElement("canvas"); c.width = c.height = 1; const x = c.getContext("2d", { willReadFrequently: true });
    x.fillStyle = s; x.fillRect(0, 0, 1, 1); const px = x.getImageData(0, 0, 1, 1).data; return [px[0], px[1], px[2]];
  };
  function mFuellung(e, zeit) {
    const fl = e.flaechen.map(n => z.flaeche(n));
    if (fl.some(f => !f || !f.ebenen)) return { fehler: "Fläche ohne Inhaltsebenen: " + e.flaechen.join(", ") };
    const eb = { quellen: [], erwartet: 0 };
    for (const f of fl) { const x = f.ebenen(zeit); eb.quellen.push(...x.quellen); eb.erwartet += x.erwartet ?? x.quellen.length; }
    const f = fl[0];
    const br = f.ecken[0].distanceTo(f.ecken[1]), ho = f.ecken[0].distanceTo(f.ecken[3]);
    const R = MESS.fuell_spalten, Z = Math.max(1, Math.round(R * ho / br)), maske = new Uint8Array(R * Z);
    for (const l of eb.quellen) {
      const cv = document.createElement("canvas"); cv.width = R; cv.height = Z;
      const cx = cv.getContext("2d", { willReadFrequently: true }); cx.imageSmoothingQuality = "high";
      const bg = l.hintergrund || "#ffffff", rgb = farbeRGB(bg);
      cx.fillStyle = bg; cx.fillRect(0, 0, R, Z); if (!leereEbenen) cx.drawImage(l.quelle, 0, 0, R, Z);
      const px = cx.getImageData(0, 0, R, Z).data;
      for (let i = 0; i < R * Z; i++) {
        const dv = Math.max(Math.abs(px[i * 4] - rgb[0]), Math.abs(px[i * 4 + 1] - rgb[1]), Math.abs(px[i * 4 + 2] - rgb[2]));
        if (dv >= MESS.fuell_farbabstand) maske[i] = 1;
      }
    }
    let tinte = 0; for (let i = 0; i < maske.length; i++) tinte += maske[i];
    const r = Math.max(1, Math.round((e.luecke ?? MESS.fuell_luecke) * R / 2));      // Aufweitung um r Rasterpunkte (zwei Durchgänge)
    const aufweiten = (m, w, h, horiz) => {
      const o = new Uint8Array(m.length);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let v = 0;
        if (horiz) { for (let dx = -r; dx <= r && !v; dx++) { const xx = x + dx; if (xx >= 0 && xx < w && m[y * w + xx]) v = 1; } }
        else { for (let dy = -r; dy <= r && !v; dy++) { const yy = y + dy; if (yy >= 0 && yy < h && m[yy * w + x]) v = 1; } }
        o[y * w + x] = v;
      }
      return o;
    };
    const voll = aufweiten(aufweiten(maske, R, Z, true), R, Z, false);
    let gef = 0; for (let i = 0; i < voll.length; i++) gef += voll[i];
    return { tinte: tinte / maske.length, fuellung: gef / voll.length, ebenen_da: eb.quellen.length, ebenen_erwartet: eb.erwartet ?? eb.quellen.length, raster: [R, Z] };
  }

  // ---------- 5 Platzierung ----------
  function szenenBox(ms) {
    const inv = z.wurzel.matrixWorld.clone().invert(), p = new THREE.Vector3();
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], pts = [];
    for (const m of ms) {
      const pos = m.geometry.attributes.position, M = m.matrixWorld.clone().premultiply(inv);
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(M); const b = T2B(p);
        for (let j = 0; j < 3; j++) { if (b[j] < mn[j]) mn[j] = b[j]; if (b[j] > mx[j]) mx[j] = b[j]; }
        pts.push(b);
      }
    }
    return { min: mn, max: mx, pts };
  }
  const ueber1 = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
  function achseDicke(pts) {      // Normale einer flachen Platte: Richtung kleinster Streuung der Punktwolke (Hauptachsen, Jacobi)
    const n = pts.length, m = [0, 0, 0]; pts.forEach(p => { for (let j = 0; j < 3; j++) m[j] += p[j] / n; });
    const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    pts.forEach(p => { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += (p[i] - m[i]) * (p[j] - m[j]) / n; });
    const V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let it = 0; it < 30; it++) {
      let pi = 0, qi = 1, mx = 0;
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(C[i][j]) > mx) { mx = Math.abs(C[i][j]); pi = i; qi = j; }
      if (mx < 1e-12) break;
      const th = .5 * Math.atan2(2 * C[pi][qi], C[qi][qi] - C[pi][pi]), c = Math.cos(th), s = Math.sin(th);
      for (let k = 0; k < 3; k++) { const a = C[k][pi], b = C[k][qi]; C[k][pi] = c * a - s * b; C[k][qi] = s * a + c * b; }
      for (let k = 0; k < 3; k++) { const a = C[pi][k], b = C[qi][k]; C[pi][k] = c * a - s * b; C[qi][k] = s * a + c * b; }
      for (let k = 0; k < 3; k++) { const a = V[k][pi], b = V[k][qi]; V[k][pi] = c * a - s * b; V[k][qi] = s * a + c * b; }
    }
    let j = 0; for (let i = 1; i < 3; i++) if (C[i][i] < C[j][j]) j = i;
    return { achse: [V[0][j], V[1][j], V[2][j]], mitte: m };
  }
  function mPlatzierung(r) {
    const aus = [], kasten = spec => { const ms = meshes(spec).filter(sichtbar); if (!ms.length) throw new Error("Teil nicht gefunden oder unsichtbar: " + JSON.stringify(spec)); return szenenBox(ms); };
    const A_ = kasten(r.teil), mitteA = A_.min.map((v, i) => (v + A_.max[i]) / 2);
    const grund = B_ => ue(A_, B_, 0) * ue(A_, B_, 1);
    function ue(a, b, i) { return ueber1(a.min[i], a.max[i], b.min[i], b.max[i]); }
    const flaecheA = Math.max(1e-9, (A_.max[0] - A_.min[0]) * (A_.max[1] - A_.min[1]));
    const rel = (relation, wert) => aus.push({ relation, ...wert });
    for (const kind of ["unter", "auf", "neben", "innerhalb", "links_von", "rechts_von", "vor", "hinter"]) {
      if (!r[kind]) continue;
      try {
        const B_ = kasten(r[kind]), ziel = r[kind];
        if (kind === "unter") rel(kind, { ziel, abstand_z: B_.min[2] - A_.max[2], ueberlappung: grund(B_) / flaecheA });
        else if (kind === "auf") rel(kind, { ziel, abstand_z: A_.min[2] - B_.max[2], ueberlappung: grund(B_) / flaecheA });
        else if (kind === "innerhalb") rel(kind, { ziel, ueberlappung: grund(B_) / flaecheA });
        else if (kind === "neben") {
          const dx = Math.max(0, A_.min[0] - B_.max[0], B_.min[0] - A_.max[0]), dy = Math.max(0, A_.min[1] - B_.max[1], B_.min[1] - A_.max[1]);
          rel(kind, { ziel, abstand: Math.hypot(dx, dy), z_ueberlappung: ue(A_, B_, 2) });
        }
        else if (kind === "links_von") rel(kind, { ziel, luft: B_.min[0] - A_.max[0] });
        else if (kind === "rechts_von") rel(kind, { ziel, luft: A_.min[0] - B_.max[0] });
        else if (kind === "vor") rel(kind, { ziel, luft: B_.min[1] - A_.max[1] });
        else if (kind === "hinter") rel(kind, { ziel, luft: A_.min[1] - B_.max[1] });
      } catch (err) { rel(kind, { ziel: r[kind], fehler: err.message }); }
    }
    const platte = spec => { const b = kasten(spec); return { ...achseDicke(b.pts) }; };
    if (r.front) {
      try {
        const f = r.front, pl = platte(f.flaeche);
        let n = pl.achse; if (n[0] * (pl.mitte[0] - mitteA[0]) + n[1] * (pl.mitte[1] - mitteA[1]) < 0) n = n.map(x => -x);
        const hn = Math.hypot(n[0], n[1]);
        let ziel;
        if (Array.isArray(f.zur)) ziel = f.zur; else { const c = T2B(projektor().pos.clone().applyMatrix4(z.wurzel.matrixWorld.clone().invert())); ziel = [c[0] - pl.mitte[0], c[1] - pl.mitte[1], 0]; }
        const dz = Math.abs(((grad(Math.atan2(n[1], n[0]) - Math.atan2(ziel[1], ziel[0])) + 540) % 360) - 180);
        rel("front", { flaeche: f.flaeche, abweichung_grad: hn < .5 ? 90 : dz, neigung_grad: grad(Math.asin(Math.min(1, Math.abs(n[2])))), normale: n.map(x => +x.toFixed(3)) });
      } catch (err) { rel("front", { fehler: err.message }); }
    }
    if (r.aufrecht) {
      try {
        const f = typeof r.aufrecht === "string" ? { flaeche: r.aufrecht } : r.aufrecht, pl = platte(f.flaeche);
        rel("aufrecht", { flaeche: f.flaeche, neigung_grad: grad(Math.acos(Math.min(1, Math.abs(pl.achse[2])))), platte_unten: pl.mitte[2] < mitteA[2] });
      } catch (err) { rel("aufrecht", { fehler: err.message }); }
    }
    return { teil: r.teil, relationen: aus, box: { min: A_.min.map(x => +x.toFixed(3)), max: A_.max.map(x => +x.toFixed(3)) } };
  }

  // ---------- Provokationen für den Selbsttest ----------
  // Jede verändert die Szene im Speicher so, dass die Prüfung anschlagen muss, und gibt eine Funktion zurück, die alles zurücksetzt.
  const PROV = {
    anschnitt(e) {          // Teil 40 Einheiten nach rechts (aus Sicht der Kamera) schieben
      const ks = knoten(e.teil), alt = ks.map(n => n.position.clone()), delta = new THREE.Vector3(1, 0, 0).transformDirection(z.kamera.matrixWorld).multiplyScalar(40);
      ks.forEach(n => { const rot = new THREE.Matrix4(); if (n.parent) rot.extractRotation(n.parent.matrixWorld).invert(); n.position.add(delta.clone().applyMatrix4(rot)); });
      welt.updateMatrixWorld(true);
      return () => { ks.forEach((n, i) => n.position.copy(alt[i])); welt.updateMatrixWorld(true); };
    },
    verdeckung(e) {         // Platte auf halbem Weg zwischen Kamera und Ziel
      const pr = projektor();
      let ziel;
      if (e.flaeche) { const ps = z.flaeche(e.flaeche).punkte(); ziel = ps[0].clone().add(ps[ps.length - 1]).multiplyScalar(.5); }
      else { const b = new THREE.Box3(); meshes(e.teil).filter(sichtbar).forEach(m => b.expandByObject(m)); ziel = b.getCenter(new THREE.Vector3()); }
      const m = new THREE.Mesh(new THREE.BoxGeometry(20, 20, .02), new THREE.MeshStandardMaterial({ color: 0xff00ff, side: THREE.DoubleSide }));
      m.name = "Provokation_Platte"; m.position.copy(pr.pos).lerp(ziel, .5); m.lookAt(pr.pos);
      welt.add(m); welt.updateMatrixWorld(true);
      return () => { welt.remove(m); m.geometry.dispose(); welt.updateMatrixWorld(true); };
    },
    bildschirm(e) {         // Kamera um 60 Grad von der Normale weg um die Mitte der Fläche schwenken, Abstand und Blick auf die Mitte bleiben
      const f = z.flaeche(e.flaechen[0]), mitte = f.ecken[0].clone().add(f.ecken[2]).multiplyScalar(.5), cam = z.kamera;
      const alt = { p: cam.position.clone(), q: cam.quaternion.clone() };
      const pos = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld), n = f.normale.clone().normalize();
      const aufAchse = pos.clone().sub(mitte), ax = new THREE.Vector3().crossVectors(n, aufAchse);
      if (ax.lengthSq() < 1e-8) ax.set(1, 0, 0); ax.normalize();       // Drehachse quer zu Normale und Sichtlinie: der Winkel zur Normale wächst um 60 Grad
      const neu = mitte.clone().add(aufAchse.applyAxisAngle(ax, Math.PI / 3));
      const M = new THREE.Matrix4().compose(neu, new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(neu, mitte, new THREE.Vector3(0, 1, 0))), new THREE.Vector3(1, 1, 1));
      if (cam.parent) M.premultiply(cam.parent.matrixWorld.clone().invert());
      M.decompose(cam.position, cam.quaternion, new THREE.Vector3()); cam.updateMatrix(); cam.updateMatrixWorld(true);
      return () => { cam.position.copy(alt.p); cam.quaternion.copy(alt.q); cam.updateMatrix(); cam.updateMatrixWorld(true); };
    },
    fuellung() {            // Bildschirminhalt weglassen: die Messung sieht nur leere Ebenen (die gezeichneten Flächen der Szene bleiben unberührt)
      leereEbenen = true;
      return () => { leereEbenen = false; };
    },
    platzierung(e) {        // Teil seitlich und nach hinten verschieben und um 90 Grad kippen
      const ks = knoten(e.teil), alt = ks.map(n => [n.position.clone(), n.quaternion.clone()]);
      ks.forEach(n => { n.position.x += 1.8; n.position.z -= 1.2; n.rotateX(Math.PI / 2); });
      welt.updateMatrixWorld(true);
      return () => { ks.forEach((n, i) => { n.position.copy(alt[i][0]); n.quaternion.copy(alt[i][1]); }); welt.updateMatrixWorld(true); };
    },
  };

  // ---------- Durchlauf ----------
  const aus = { anschnitt: [], verdeckung: [], bildschirm: [], fuellung: [], platzierung: [], fehler: [] };
  const nur = opt.provokation || null;
  const lauf = (typ, eintraege, fn) => {
    (nur ? (eintraege || []).slice(0, 1) : (eintraege || [])).forEach((e, ei) => {
      for (const t of zeiten(e.bei)) {
        let zurueck = null;
        try {
          z.stelle(t.zeit);
          if (nur) zurueck = PROV[nur](e, t.zeit);
          const r = fn(e, t.zeit);
          aus[typ].push({ eintrag: ei, id: e.id || e.name || e.teil || e.flaeche || (e.flaechen && e.flaechen[0]) || String(ei), zeit: t.zeit, zeitpunkt: t.name, provoziert: !!nur, grenzen: e.grenzen || {}, ...r });
        } catch (err) { aus.fehler.push(`${typ}[${ei}] ${t.name}: ${err.message}`); }
        finally { if (zurueck) zurueck(); }
      }
    });
  };
  if (!nur || nur === "anschnitt") lauf("anschnitt", d.anschnitt, e => ({ teil: e.teil, ...mAnschnitt(e) }));
  if (!nur || nur === "verdeckung") lauf("verdeckung", d.verdeckung, e => ({ ziel: e.teil || ("Fläche " + e.flaeche), ...mVerdeckung(e) }));
  if (!nur || nur === "bildschirm") lauf("bildschirm", d.bildschirme, e => mBildschirm(e));
  if (!nur || nur === "fuellung") lauf("fuellung", (d.bildschirme || []).filter(e => e.fuellung !== false), (e, zeit) => mFuellung(e, zeit));
  if (!nur || nur === "platzierung") lauf("platzierung", d.regeln, e => mPlatzierung(e));
  return aus;
}
