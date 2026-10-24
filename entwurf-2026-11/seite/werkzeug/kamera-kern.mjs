// Kern: aus Beats (Motivpunkte, Blickwinkel, Zeitfenster) und Bildformat die Kameraposen und Stützstellen rechnen.
// Kennt nur Zahlen: Koordinaten (rechts, hoch, voraus) in einem Rahmen, den die Anbindung vorgibt. Keine Seite, keine Dateien.
const R = Math.PI / 180;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => mul(a, 1 / Math.hypot(...a));

// Bildausschnitt: Rahmen so stellen, dass alle Punkte im nutzbaren Fenster (Bild minus Ränder in px) liegen.
// fmt: { width, height, fov (senkrecht, Grad), rand: { o, u, l, r } }; az = Blick von rechts (Grad, 0 = von hinten), el = Blick von oben (Grad)
export function rahmen(punkte, fmt, { az = 0, el = 12, knapp = 1.05, minL = 4 } = {}) {
  const th = Math.tan(fmt.fov * R / 2), asp = fmt.width / fmt.height, W = fmt.rand;
  const wx0 = -1 + 2 * W.l / fmt.width, wx1 = 1 - 2 * W.r / fmt.width, wy0 = -1 + 2 * W.u / fmt.height, wy1 = 1 - 2 * W.o / fmt.height;
  const d = [Math.sin(az * R) * Math.cos(el * R), Math.sin(el * R), -Math.cos(az * R) * Math.cos(el * R)];      // von Ziel zur Kamera
  const f = mul(d, -1), r = norm(cross([0, 1, 0], f)), u = cross(f, r);
  let T = [0, 0, 0]; for (const p of punkte) T = add(T, mul(p, 1 / punkte.length));
  let L = 12;
  for (let it = 0; it < 40; it++) {
    const C = add(T, mul(d, L));
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of punkte) { const q = sub(p, C), z = dot(q, f); if (z < .3) { L *= 1.5; x0 = null; break; } const nx = dot(q, r) / (z * th * asp), ny = dot(q, u) / (z * th); x0 = Math.min(x0, nx); x1 = Math.max(x1, nx); y0 = Math.min(y0, ny); y1 = Math.max(y1, ny); }
    if (x0 === null) continue;
    // Mitte des Motivs auf die Mitte des Fensters schieben, dann Abstand so, dass die Ausdehnung gerade passt
    const sx = (x0 + x1) / 2 - (wx0 + wx1) / 2, sy = (y0 + y1) / 2 - (wy0 + wy1) / 2;
    T = add(add(T, mul(r, sx * L * th * asp)), mul(u, sy * L * th));
    const k = Math.max((x1 - x0) / (wx1 - wx0), (y1 - y0) / (wy1 - wy0)) * knapp;
    L = Math.max(minL, L * k);
    if (Math.abs(k - 1) < .003 && Math.abs(sx) < .003 && Math.abs(sy) < .003) break;
  }
  const C = add(T, mul(d, L));
  return { C, T, L, pxProEinheit: fmt.height / (2 * L * th) };
}

// Stützstellen aus Beats. beats: [{ name, punkte (Rahmenkoordinaten), u: [a, b], az, el, text (Höhe in Einheiten), behalten }]
// punktBei(u) → Position des Punktes im Rahmen; alt: bisherige Stützstellen (relativ zum Punkt) für Anlauf und Auslauf; fmt wie oben
export function stuetzstellen(beats, fmt, punktBei, alt = [], { anlauf = .07, auslauf = .07 } = {}) {
  const keys = [], info = [];
  const a0 = Math.min(...beats.map(b => b.u[0])) - anlauf, a1 = Math.max(...beats.map(b => b.u[1])) + auslauf;
  const rd = x => +x.toFixed(2), ru = x => +x.toFixed(4);
  for (const k of alt) if (k.u < a0 || k.u > a1) keys.push({ ...k, c: k.c.slice(), t: k.t.slice() });
  for (const b of beats) {
    if (b.behalten) { for (const k of alt) if (k.u >= b.u[0] - .02 && k.u <= b.u[1] + .02) keys.push({ ...k }); continue; }
    const um = (b.u[0] + b.u[1]) / 2, D = punktBei(um), pts = [...b.punkte];
    if (!b.ohnePunkt) for (const u of [b.u[0], um, b.u[1]]) pts.push(punktBei(u));
    const fr = rahmen(pts, fmt, { az: b.az, el: b.el });
    const c = sub(fr.C, D), t = sub(fr.T, D), C = [rd(c[0]), rd(c[1]), rd(-c[2])], T = [rd(t[0]), rd(t[1]), rd(t[2])];
    const o = b.ohnePunkt ? { o: 1 } : {};   // o = 1 an beiden Stützstellen: der Punkt darf hier aus dem Bild laufen, der Text hat Vorrang
    keys.push({ u: ru(b.u[0]), c: C, t: T, l: 1, ...o }, { u: ru(b.u[1]), c: C.slice(), t: T.slice(), l: 1, ...o });
    info.push({ name: b.name, C: fr.C.map(rd), T: fr.T.map(rd), L: +fr.L.toFixed(2), px: b.text ? +(b.text * fr.pxProEinheit).toFixed(1) : null, kameraHoehe: +fr.C[1].toFixed(2), punktSichtbar: true });
  }
  keys.sort((p, q) => p.u - q.u);
  // gleiche u vermeiden (die Kurve braucht streng steigende Stellen)
  for (let i = 1; i < keys.length; i++) if (keys[i].u <= keys[i - 1].u + 1e-4) keys[i].u = ru(keys[i - 1].u + 1e-3);
  return { keys, info };
}
