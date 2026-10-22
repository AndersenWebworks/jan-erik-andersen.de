# Lesebahn-Baukasten (entwurf-2026-11/lesebahn/)

Leitbild: Die Seite ist ein kleiner Film. Der rote Faden ist die Lesebahn: Jeder Satz steht **ganz** auf einem eigenen Träger am Faden,
dem Leser zugewandt, alle gleich ausgerichtet. Der Faden läuft durch eine Öse am Fuß jedes Trägers, der Punkt hält an jedem Träger kurz
(Lesestelle). Die Kamera fährt stetig nach rechts, mit gleichem Abstand und gleicher Neigung, und bremst an den Lesestellen. Die Konstrukte
der Szene (Rechner, Shop, Steine …) stehen als Szenerie dahinter und tragen höchstens kurze Typenschilder. Pro Szene steht die Kernaussage zuerst und groß.

Zweiteilig:

1. **Bahn-Schicht** (`bahn.js`, in jeder Szene als `K.bahn(opt)`): Satzumbruch, Zeiten, Schriftgrößen, Lesestellen, Fadenpunkte, `thread.map`, Kameraschlüssel.
2. **Trägerform** (`K.formen.*` oder eigene): nur Geometrie und Mechanik des Trägers, der Text darauf und der Haltepunkt des Fadens.

Fertige Form: `K.formen.anhaenger` (Papierzettel mit Fußlasche, zwei Ösen, Falz, schräg geschnittener Kante, Seitenstützen). Referenzszene: `schnittstellen.js` (Szene
„Schnittstellen“, nicht `opt.wbg`).

## 1. K.bahn(opt)

```js
const B = K.bahn({
  prefix: "s",                  // Namen der Lesestellen: s0 (Kopf), s1, s2 … ; Tags der Träger: s1t, s2t …
  form: K.formen.anhaenger,     // Vorgabe; eigene Form: siehe Abschnitt 3
  x0: -1.5,                     // linke Kante des ersten Trägers (Welt, x)
  z: 8.6,                       // Grundlinie (Falz) der Träger; oder front: <vorderste Kante der Szenerie>, gapZ: <Abstand>  → z = front + gapZ
  gap: 1.3,                     // freier Abstand zwischen zwei Trägern (Stützen rechnet die Bahn dazu)
  pitch: 26,                    // Neigung der Kamera in Grad (alle Szenen der Lesebahn gleich, Vorgabe 26)
  sy: -.34, nsy: -.3,           // Lage des Textes im Bild (−1 … 1; Desktop / Handy); die Szenerie liegt darüber
  head: { prints: [H1], e0: eH, b: 0, fit: .72, fitN: .72, x: xLinks, w: breite }, // optional: Überschrift als erste Lesestelle (von der Szene gebaut)
  sentences: [
    { text: SATZ1, t: [.15, .185, .25], b: .285, big: 1.25 },   // ein ganzer Satz je Träger
    { text: SATZ2, t: [.38, .43, .495], b: .53 }
  ]
});
```

Satz (`sentences[i]`):

| Feld | Bedeutung |
|------|-----------|
| `text` (oder `lines`) | ganzer Satz; Umbruch macht die Bahn über gemessene Breiten (`K.wrap(text, maxEm)` steht auch einzeln zur Verfügung) |
| `t: [line, rise, text]` | Zeiten in b: Schnittlinien des Trägers, Aufklappen (Träger klappt aus dem Bogen), Text blendet ein. **Der Text erscheint erst, wenn der Träger steht**: `text` ≥ `rise` + Dauer der Mechanik (Anhänger: Zettel `rise` + .045, Stützen bis `rise` + .068; Vorgabe `text = rise + .065`) |
| `b` | Lesestelle (b, bei dem die Kamera den Satz fasst); Vorgabe `text + .03` |
| `big` | Schriftfaktor; 1 = Normalsatz (e = 0,2), 1,25 = Kernaussage. Abstand der Kamera bleibt gleich, die Schrift wächst auf dem Bildschirm mit (Desktop 20,5 px × big, Handy 16 px × big) |
| `w` | Gewicht des Kameraschlüssels (Vorgabe 2; bestimmt, wie viel Scrollweg der Fahrt zum Träger zufällt) |
| `maxEm` | größte Zeilenbreite in em (Vorgabe der Form: Anhänger 24 / Handy 21; bei `big` am Handy ×0,72) |
| `form` | andere Trägerform nur für diesen Satz |

Rückgabe `B`:

| Feld | Inhalt |
|------|--------|
| `B.items[i]` | `{ pr, nd, w, h, anchor:[x,y,z], anchors:[…], x0, e, lines, b, stop, tags, quiet, … }` |
| `B.stops`, `B.names` | Lesestellen (Kopf + je Satz) als Liste bzw. nach Namen (`s1` …); in `def.stops` / `def.names` eintragen |
| `B.keys({ b, shift, w })` | Kameraschlüssel: Kopf → Träger 1 … n → Auslauf in derselben Richtung (`b`: Ende der Bahn, ≥ letzte Lesestelle; `shift`: Weg nach rechts, Vorgabe 1,8) |
| `B.thread({ hold, depart, bEnd, startX, y })` | `def.thread` mit `map`: der Punkt hält ±`hold` (Vorgabe .04) um jede Lesestelle am Haltepunkt des Trägers (Öse), dazwischen weich (smoothstep); `depart`: b, ab dem er vom Kopf losläuft; `bEnd`: Ende der Bahn (danach läuft der Faden in der Fahrt zur nächsten Szene weiter, der Punkt bleibt bis dahin am letzten Träger) |
| `B.faden({ inn, out, run, turn, back })` | Ein- und Ausgang für `folge.js` (`faden: d => d.fadenIO`): setzt die Bahn stetig fort (siehe Abschnitt 5) |
| `B.spur` | `{ tags, quiet }` für `F.spur` (nur nötig, wenn die Szene `F.spur` selbst aufruft; sonst ergänzt der Kern sie selbsttätig) |
| `B.endX`, `B.z`, `B.lean` | rechter Rand der Bahn, Grundlinie, Neigung (rad) |

Einbau in eine Szene (Muster aus `schnittstellen.js`):

```js
const B = K.bahn({ … });
…
return {
  fov: 32, fovN: 44, smooth: true,                  // smooth: stetige Kamerabahn über der Sehnenlänge (kein Schlüsselindex-Tempo)
  stops: B.stops, names: B.names,
  keys: B.keys({ b: .55, shift: 1.8, w: .6 }),
  thread: B.thread({ hold: .04, depart: .10, bEnd: .55 }),
  fadenIO: B.faden({ inn: [-9.1, 18.8], out: [10.0, -6.8] }),   // inn: Vorderkante des Bogens, out: Hinterkante
  bMax: …                                           // in folge.js: bMax = Ende der Bahn (b)
};
```
In `folge.js` der Szene: `faden: d => d.fadenIO`, `lead: 1` mit `leadShift: [-2.2, 0, 0], leadW: .6` (die Kamera kommt von links an), `bMax: <bEnd>`.

Die Kamera: Gier 0, Neigung `pitch`, Abstand aus der Schriftgröße (`px` wächst mit `e / 0,2`, also bleibt der Abstand gleich), `sx` 0, `sy` aus `opt`. Zwischen den Lesestellen
fährt sie nur nach rechts (`def.smooth`). Der Haltepunkt des Fadens wird in `readingPose` (kern.js) über `stop.keep` mit ins Bild genommen (Rand 24 px seitlich, oben 76 px, unten 82 px);
der Ausschnitt wird dafür nur in der Bildlage verschoben (Abstand und Neigung bleiben). Szenerie oben im Bild, Bahn unten: **Abstand Bahn–Szenerie = `z` − vorderste Szeneriekante** (`front` + `gapZ`);
je kleiner, desto weniger Leerfläche dazwischen; Text höchstens bei `sy` −.34 (Desktop) / −.3 (Handy) belassen, sonst rutscht der Punkt aus dem Bild.

## 2. Anhänger (Referenzform)

Aufbau im Bogen (flach): Fuß (Lasche mit zwei Ösen, liegt vor der Grundlinie `z`) – Falz bei `z` – Zettel (hinter `z`) – links und rechts je ein Dreieck. Aufgeklappt: Der Zettel steht um `pitch`
zurückgelehnt auf dem Fuß, die Stützen klappen senkrecht nach hinten bis zum Boden. Der Zettel ist von Hand geschnitten (schräge Oberkante, abgeschnittene Ecke, nach innen geneigte Ränder,
abwechselnd links/rechts je Träger), Papierfarbe wie der Bogen eine Spur wärmer, Haarkante 0,3 → im Kern auf 0,35 angehoben (kein harter Rahmen), gedruckte gestrichelte Falzlinie unter dem Text.
Fadenlinie: z = `z` + 0,23 über dem Fuß; erste Öse bei x0 + Rand + 2 em (dort hält der Punkt), zweite am rechten Ende. Maße (Welt) bei e = 0,2: Rand seitlich 0,38, oben 0,3, unten 0,42; Stütze 0,42 tief.

## 3. Eigene Trägerform einhängen

Eine Form ist ein Objekt `{ name, maxEm(narrow), build(c) }`. Die Bahn ruft `build(c)` je Satz nacheinander auf (nach `F.part(tag, t.line, .04)`) und ruft danach selbst `F.geruest` für den Träger.

`c` (Eingabe):

| Feld | Inhalt |
|------|--------|
| `K` | Kit der Szene (`K.panel`, `K.rect`, `K.P`, `K.print`, `K.onPanel`, `K.decal`, `K.R` = Wurzelfläche, `K.Q` = 90°, `K.F` …) |
| `x`, `z` | linke Kante des Trägers (Welt) und Grundlinie |
| `lines`, `e`, `lh`, `tw`, `th` | umbrochene Zeilen, Schriftgröße in Welteinheiten je em, Zeilenhöhe (1,25), Breite des breitesten Zeilenblocks und Höhe des Textblocks in Welt (Zeilen−1)·lh·e + 0,8·e |
| `t` | `{ line, rise, text }` Zeiten in b |
| `lean` | Neigung der Kamera in rad: der Träger muss **um diesen Winkel zurückgelehnt** stehen (Winkel des Scharniers `Q − lean`), sonst ist die Schrift nicht zugewandt |
| `tag`, `i`, `narrow`, `text`, `col` | Tag des Teils (Gerüst/Spur), Index, Handy, Satz, Farbe |

Rückgabe (Pflicht): `pr` (der Text-Druck dieses Trägers), `w` (Breite entlang der Bahn), `anchor: [x, y, z]` (Haltepunkt des Fadens in Szenenkoordinaten, y ≈ 0,004), `anchors` (alle Fadenpunkte),
`h`, `nd`. Optional: `quiet` (Knoten mit Text: Spur dort nur als Eckmarken), `tags`, `side` (seitlicher Überstand je Seite, wird zum Abstand addiert).

Regeln für Formen: (a) alle Teile klappen mit der Faltmechanik des Bogens (`K.panel` mit Scharnier, Winkel `Q − lean`, `over` ≈ .04), Flächen mit Bastellinien (`K.rect` mit Haarkante 0,35 … 0,5);
(b) der Druck wird erst mit `t.text` sichtbar (`K.print(lines, e, t.text, …)`); (c) alle Träger einer Szene liegen auf **einer** Grundlinie `z`, der Faden bleibt auf einer Geraden (`anchor[2]` gleich);
(d) im Faltplan dürfen sich Flächen nicht überlappen (Stützen, Laschen brauchen seitlich Platz, `side`); (e) der Haltepunkt gehört **in** den Textbereich (nicht links davor), damit er am Handy im Bild liegt.

Gerüst (läuft als Test in `tmp/lesebahn/testform.mjs`, 1280×900 und 390×844 grün): ein Kassenbon als stehender Streifen auf einer Fußlasche.

```js
const bon = {
  name: "bon",
  maxEm: narrow => narrow ? 17 : 20,
  build(c) {
    const { K, x, z, lines, e, tw, th, t, lean, tag } = c, { Q, R } = K;
    const m = 1.6 * e, W = tw + 2 * m, H = th + 3.2 * e, FD = .4, col = [.93, .91, .85];
    // Fuß: liegt flach vor der Grundlinie; der Träger ist an seiner Hinterkante angeschlagen
    const foot = K.panel(R, [x, z + FD], [x + W, z + FD], [0, -1], t.line + .02, .02, 0, { nofold: true, over: 0 });
    K.rect(foot, 0, 0, W, FD, col, .42);
    const nd = K.panel(foot, foot.uv(0, FD), foot.uv(W, FD), [0, -1], t.rise, .045, Q - lean, { over: .04 });
    K.rect(nd, 0, 0, W, H, col, .4);                       // hier eine eigene Form zeichnen (K.P mit beliebigem Umriss, im Fächer von der Ecke 0,0 aus)
    const pr = K.print(lines, e, t.text, { lh: c.lh });
    K.onPanel(nd, pr, m - pr.t.padX * e + pr.w / 2, H - 1.5 * e + .34 * e - pr.h / 2, 1);
    const a = [x + m + 2 * e, .004, z + FD / 2];           // Haltepunkt des Fadens
    return { w: W, h: H, pr, nd, anchor: a, anchors: [a], quiet: [nd], tags: [tag] };
  }
};
// in der Szene: K.bahn({ form: bon, … })
```

Weitere Formen aus der Themenliste (Lieferschein/Kassenbon, Kalenderblätter, Karteikarten, Drehscheibe mit Fenster, Klappe, Tunnelbuch-Ebenen, Treppe, Leporello, Fähnchen, Schieber)
folgen demselben Schema: Geometrie und Mechanik in `build`, ein Druck je Träger, ein Haltepunkt. Wo der Text selbst das Bauteil ist (Werdegang-Treppe, Leporello Stimmen), bleibt das vorhandene Modul
und meldet seine Lesestellen wie bisher; die Regeln aus Abschnitt 4 gelten gleich.

## 4. Regeln

* **Ganze Sätze**: ein Satz, ein Träger, nichts wird zerschnitten oder über mehrere Träger verteilt. Satzzeichen bleiben stehen.
* **Lesereihenfolge = Bahnrichtung**: von links nach rechts, die Sätze stehen in der Reihenfolge des Seitentexts (`docs/FASSUNG-2026-11.md`). Fixe Strecke, keine Verzweigung.
* **Text ganz im Rahmen**: an der Lesestelle und ±0,0015 p liegt der Druck ganz im Bild: oben ab 64 px, unten bis H − 70 px, seitlich 0 … W, oder **ganz draußen**; angeschnitten blendet der Kern ihn aus
  (`frameFrac`, `clipFactor`). Der Haltepunkt des Fadens liegt mit Rand (24 px) im Bild.
* **Schrift**: Desktop 20,5 px (bei höherem Fenster bis 23,5), Kernaussage × `big`; Handy ≥ 16 px an der Lesestelle; Zeilenhöhe ≥ 1,25; die Bahn begrenzt die Zeilenbreite über `maxEm` und `fit` (.92 der Breite).
* **Keine frühere Szene im Vordergrund**: Szenerie und Bahn dürfen die Kamera nicht so weit nach vorn führen, dass Teile der vorigen Szene im Bild stehen (Gesamtrechnung zeigt „Vordergrund-Treffer 0“).
* **Keine Scroll-Locks**: nichts hält das Scrollen an, kein Einrasten; die Bremsung an Lesestellen ist reine Zeitverzerrung der Bahn (`def.warpMin`), der Leser kann jederzeit weiterscrollen.
* **Gleiche Fahrt**: alle Lesestellen einer Bahn gleiche Neigung und Gier 0, nur `sy` darf je Szene abweichen. Pro Szene erst die Kernaussage (`big`), dann die Folgesätze.
* **Typenschilder** an der Szenerie: kurz (Namen), keine Sätze.

### Länge der Szene melden
Die Länge steht in `folge.js` je Szene als `len: L(d, n)` (vh Scrollweg Desktop / Handy) und `tr: TR(...)` für die Fahrt in die Szene; die Szene selbst meldet nur `bMax` (Ende der Bahn in b, Vorgabe 1) und ihre Schlüsselgewichte (`w`).
Richtwert aus den Rechnungen: Das Lesefenster (Scrollweg, in dem der Text ganz im Rahmen, voll deckend, fast gleich groß steht) sollte **≥ 30 vh** sein (gemessen `tmp/lesebahn/fenster.mjs`); die Referenzszene hat 400 vh für Kopf + 2 Sätze
(Fenster Desktop 81 / 59 / 88 vh, Handy 50 / 35 / 48 vh). Sind es weniger, `len` erhöhen (oder `w` des Schlüssels); sind es über 120 vh, `len` kürzen. Tempo der Kamera ≤ 0,2 Einheiten/vh in der Bahn.

## 5. Übergänge zwischen Szenen

* **Kamera**: Der Kern fährt zwischen zwei Szenen auf einer Hermite-Kurve aus Endstellung der einen und Startstellung der nächsten Szene mit den Geschwindigkeiten an beiden Enden (kein Sprung, kein Knick im Tempo). Haben beide Szenen
  dieselbe Neigung (Lesebahn: 26°) und Gier 0, bleibt die Blickrichtung in der Fahrt konstant: gemessen zwei Lesebahn-Szenen hintereinander (`TWICE=1 … uebergang.mjs`): Gier 0°/0°, Neigung 26° → 26,7° → 27,1°, Drehrate max. 0,02 °/vh.
  Die erste Lesestelle der nächsten Szene kommt über `lead: 1` mit `leadShift` von links (Auslauf der vorigen Szene geht per `B.keys({ shift })` nach rechts).
* **Faden**: `B.faden({ inn, out })` liefert Ein- und Ausgang so, dass die Bahn stetig weiterläuft: am Ende noch ein Stück geradeaus (gleiche Höhe y = 0,004, Richtung +x, über die letzte Öse hinaus), dann Abbiegen zur Hinterkante;
  am Anfang kommt der Faden vom Bogenrand in drei Zwischenpunkten in die Richtung +x und liegt beim Eintreffen der Szene schon am Anfang der Bahn (`preTr`/`bridge` in `kern.js`: Brücke und Zulauf laufen noch in der Fahrt, nicht erst in der Szene).
  Gemessen (`fadenpr.mjs`, zwei Szenen): Tangente am Ausgang (+1, 0, 0) → vor dem Eingang (−0,04, 0, −1) → am Anfang der Bahn (0,98, 0, −0,2) → (1, 0, 0).
* Andere Szenenmodule sind nicht umgebaut; wer eines auf die Bahn umstellt, übernimmt `lead`/`leadShift`, `bMax`, `faden: d => d.fadenIO`.

## 6. Konstruktionsphase und Material (Standard für alle Szenen, kern/falt)

* Teile ohne eigene `F.spur` / `F.geruest` bekommen beides selbsttätig (`falt.js`, `autoOn`; Flächen mit Druck/Abbild nur Eckmarken, Gerüst im Fenster `[t0 − .055, t0]` vor dem ersten Hochklappen).
  Zusätzliche eigene Aufrufe bleiben gültig. Abdeckung prüfen: `F.coverage()` (`tmp/lesebahn/material6.mjs`).
* Haarkanten: Gewicht 0,35 … 0,5 (Wert 0 = keine Kante an dieser Seite). Papier, Licht und Nebel sind für alle Szenen derselbe Shader (`paperMaterial`, `uL`, `uFar`, `uNear`).
* Startbild: Teile des Namens tragen `hold: 1` und erscheinen erst, wenn das HTML-Vorbild abgelöst wird (`kern.js`, `release`); für eigene Startbild-Teile `pr.hold = true` setzen.

## 7. Prüfweg (nur Rechnen, kein Browser; im Ordner `tmp/lesebahn`)

```
node --check kern.js falt.js bahn.js schnittstellen.js folge.js main.js        (im Ordner entwurf-2026-11/lesebahn)
node --import ./reg.mjs rechnen.mjs 1280 900 d.json        Gesamtrechnung Desktop: „Lesestellen N nicht ganz im Rahmen: 0“, „Vordergrund-Treffer: 0“
node --import ./reg.mjs rechnen.mjs 390 844 n.json         dasselbe Handy
node --import ./reg.mjs bahnpr.mjs 1280 900 schnittstellen   eine Szene: Text und Punkt im Rahmen (±0,0015 p), px, Gier/Neigung, Fadenpunkt in Pixeln, Geometrie der Träger (Tags …t)
node --import ./reg.mjs bahnpr.mjs 390 844 schnittstellen
node --import ./reg.mjs fenster.mjs 1280 900               Lesefenster je Lesestelle (vh)
node --import ./reg.mjs geschw.mjs 1280 900 schnittstellen Tempo/Drehrate: Szene Drehrate ≈ 0,04 °/vh, keine Tempospitzen
node --import ./reg.mjs uebergang.mjs 1280 900             Blickrichtung an Szenengrenzen, Drehrate in der Fahrt   (TWICE=1: Schnittstellen dreimal hintereinander)
node --import ./reg.mjs fadenpr.mjs                        Fadenstücke: Anfang/Ende/Richtung
node --import ./reg.mjs testform.mjs 390 844               Gerüst-Beispiel einer eigenen Form
```
Weitere Größen prüfen: 1024×768, 1440×900, 360×740, 820×1180. Die Sichtprüfung (Papiercharme, Leerfläche zwischen Szenerie und Bahn, Gesamteindruck) macht der Hauptlauf im Browser.
