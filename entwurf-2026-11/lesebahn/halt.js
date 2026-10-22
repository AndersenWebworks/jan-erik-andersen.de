// Roter Faden mit Haltepunkten für Szenen, die ihre Träger nicht über K.bahn bauen (Leporello, Briefumschlag) oder die Bahn über ihr Ende hinaus
// verlängern: Der Punkt hält ±hold in b um jede Lesestelle an der angegebenen Stelle des Fadens und läuft dazwischen weich (smoothstep),
// genau wie B.thread der Bahn-Schicht (bahn.js). Die Stelle wird als Punkt auf der Fadenlinie angegeben (nächster Punkt der Kurve),
// Bogenlänge und Kurve sind dieselben wie im Kern (CatmullRom, centripetal).
// pts: Punkte des Fadens (Vector3); holds: [{ at: Vector3, b }] in aufsteigender Reihenfolge; o: { hold: .04, depart, bEnd }
//   depart: b, ab dem der Punkt von der ersten Stelle losläuft (Vorgabe b + hold); bEnd: Ende des Fadens in b (Vorgabe letzte Lesestelle + hold)
export function halt(THREE, pts, holds, o = {}) {
  const hold = o.hold === undefined ? .04 : o.hold, NS = 6000;
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", .5), sp = curve.getSpacedPoints(NS);
  const fr = holds.map(h => { let bi = 0, bd = 1e9; sp.forEach((p, i) => { const d = p.distanceToSquared(h.at); if (d < bd) { bd = d; bi = i; } }); return bi / NS; });
  const hh = holds.map(h => h.hold !== undefined ? h.hold : hold);
  const dep = holds.map((h, k) => k === 0 && o.depart !== undefined ? o.depart : h.b + hh[k]), arr = holds.map((h, k) => h.b - hh[k]);
  const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const map = b => {
    if (b <= dep[0]) return fr[0];
    for (let k = 1; k < holds.length; k++) {
      if (b < arr[k]) return fr[k - 1] + (fr[k] - fr[k - 1]) * smooth((b - dep[k - 1]) / Math.max(1e-4, arr[k] - dep[k - 1]));
      if (b < dep[k]) return fr[k];
    }
    return fr[holds.length - 1];
  };
  const bEnd = o.bEnd !== undefined ? o.bEnd : dep[dep.length - 1];
  return { pts, t0: Math.min(dep[0], arr[1] === undefined ? dep[0] : arr[1]) - .04, t1: bEnd, map, dbg: { fr, dep, arr } };
}
