# Lesebahn-Baukasten (entwurf-2026-11/lesebahn/), Fassung „Gleichmäßige Fahrt“

Stand 22.10.2026, mittags. Ersetzt die frühere Fassung (Träger am Faden, Lesestellen mit Bremsen). Leitprinzip: `PRINZIP-SZENE-IST-TRAEGER.md`. Inhalte: `DREHBUCH-LESEBAHN.md` (Satzlisten gelten, Trägerformen dort sind ersetzt).

## 1. Wie die Seite fährt (kern.js)

* Alle Szenen liegen **nebeneinander auf einer Papierbahn** in Richtung +x. Die Kamera fährt mit fester Neigung (`PITCH` = 30°), Gier 0 und festem Abstand **gleichmäßig nach rechts**: Tempo je Scrollweg überall gleich, keine Lesestellen, kein Bremsen, kein Drehen, kein Zoomen.
  Ausnahmen: der Anfang (Eröffnung, `def.intro`: vom frontalen Podest einmal auf Fahrthöhe) und eine Szene mit `def.rise` (Treppe: die Bahn steigt weich an, die Kamera mit).
* Tempo: Desktop 1,25 px Wanderung je px Scrollweg (bei 1280 × 900: 0,107 Welteinheiten je vh), Handy 1,0 (0,099 E/vh). Die halbe Bildbreite an der Leselinie ist `K.halfW` (Desktop 6,1 E, Handy 2,3 E).
* Schrift: 1 em = `K.EC` = 0,2 Welteinheiten an der Lesetiefe ergibt Desktop 21 px, Handy 17 px. Flächen, die senkrecht stehen (Setzstufe, Schrankfront), nehmen `e: K.EV` (= EC / cos 30°), damit die Schrift trotz Verkürzung gleich groß wirkt. Flächen mit Text stehen sonst **um `K.lean` zurückgelehnt** (Scharnierwinkel `Q − K.lean` aus dem Liegen), dann sind sie der Kamera genau zugewandt.
* Jede Szene läuft **nach der Lage der Kamera**: `b = (X − xs) / (xe − xs)` über ihrer Strecke `def.strecke = [xs, xe]` (x der Bildmitte in Szenenkoordinaten). Vorher steht b auf 0, danach auf 1. Was ins Bild kommt, baut sich auf (Bastellinien, dann einrastende Papierteile; Gerüst und Bleistiftspur ergänzt `falt.js` selbst).
* Lesbarkeit entsteht, weil ein Satz **lange ganz im Bild steht**: Desktop von selbst (das Bild ist breit, ein Satz wandert 60 bis 100 vh durchs Bild). Am Handy ist das Bild schmal; dort fährt der Träger mit `K.trage` ein Stück mit der Kamera mit (steht dabei still in Bildmitte) und kommt an seiner Endlage zur Ruhe. Die Mitfahrt muss **aus dem Ding erklärbar** sein (Platte gleitet an der Schnur, Karton wandert ins Regal, Fahne rutscht am Kabel, Blatt läuft auf Ringen an der Leiste).
* Text ist ganz im Bild oder ganz weg: Ein Druck, der den Rahmen (oben 64 px, unten 70 px, seitlich 0) anschneidet, blendet der Kern aus.
* Lage der Szenen: Die Szene wird so gelegt, dass ihre Leselinie `def.lineZ` (Szenen-z der Lesetiefe, dort stehen die Textflächen) bei Welt-z = 0 liegt; ihre Strecke beginnt am Ende der vorigen und ihre Bauteile liegen mindestens 1,2 E rechts von denen der vorigen.
* Der rote Faden ist eine Linie durch alle Szenen: `def.faden` (Punkte `[x, y, z]` in Szenenkoordinaten, **x streng steigend**). Der Punkt steht immer **in der Bildmitte** (bei x = X) und zieht den Faden hinter sich her. Der Faden läuft vor den Textflächen (z etwa `lineZ` + 0,8 … 1,0) auf dem Bogen (y 0,004) und darf auf das Ding steigen, wo es Sinn ergibt (Maurerschnur auf Nägeln, Kabel, Treppe). Fehlt `def.faden`, legt der Kern eine Gerade bei `lineZ` an.

## 2. Szenenmodul

```js
export default function (K, opt) {
  const { F, R, V, Q, sm, THREE, narrow: N } = K;
  // 1. Layout rechnen (reine Zahlen), dann die Strecke setzen
  K.strecke(xs, xe);                       // xs: linke Kante des ersten Bauteils − K.halfW (es taucht bei b = 0 am rechten Rand auf); xe: Mitte des letzten Bauteils
  // 2. Kopf und Sätze
  const kopf = K.kopf({ kicker: "Gerwing · WooCommerce · seit 2023", head: "Pflaster nach Fläche bestellen", on: … });   // { k, h, w, eH, eK, gap }
  const s1 = K.satz("Für Gerwing habe ich 2023 einen *WooCommerce-Shop* gebaut, …", { on: …, maxEm: 18 });   // Druck; s1.tw/s1.th Breite/Höhe des Textblocks (Welt)
  // 3. Teile bauen: F.part(tag, t0, d) (Bastellinien im Fenster [t0, t0 + d] von b), K.panel / K.rect / K.P / K.box / K.slab / F.lift / F.spin / F.slide
  //    Druck auf eine Fläche: K.onPanel(nd, pr, u, v, side, q)
  // 4. Rückgabe
  return {
    strecke: [xs, xe], lineZ: LZ,
    faden: [[x, .004, z], …],
    stops: [{ name: "g0", prints: [kopf.k, kopf.h] }, { name: "g1", prints: [s1] }, …],   // alle Köpfe und Sätze in Lesereihenfolge (für die Prüfung)
    anchor: x,                              // optional: Sprungziel #s=<szene> (x der Bildmitte), Vorgabe xs
    rise: { x0, x1, h }                     // nur Treppe: Bahn steigt zwischen x0 und x1 um h (Szenenkoordinaten)
  };
}
```

Hilfen (bahn.js, als `K.*`):

| Hilfe | Zweck |
|---|---|
| `K.strecke(xs, xe)` | Strecke setzen; danach gelten `K.bAt(x)` (b, bei dem x in Bildmitte steht) und `K.xAt(b)` |
| `K.sicht(x)` | `{ in, mitte, aus }`: b, bei dem x am rechten Rand auftaucht, in Bildmitte steht, links hinausgeht. Bauteile bauen sich ab `sicht(linkeKante).in` auf |
| `K.satz(text, o)` | Satz als Druck, Newsreader N4 440, ganze Zeilen nach `o.maxEm` (Vorgabe Desktop 25, Handy 18), Zeilenhöhe 1,36. `*…*` = Schlüsselgruppe (kursiv 470, Durchflieger-Spur). `o.on`: b, ab dem der Text eingeblendet wird (erst, wenn seine Fläche steht). `o.e`: Größe (Vorgabe `K.EC`; `K.EV` auf senkrechten Flächen; Kernaussage bis 1,35 × EC). Rückgabe: Druck mit `tw`, `th` (Welt), `w`, `h`, `t.padX` |
| `K.kopf({ kicker, head, on, align })` | Kicker (Grotesk, Versalien, gesperrt) und Kopf (Newsreader N4 400, Desktop 1,9 × EC, Handy 1,6 × EC) als zwei Drucke; Kicker über dem Kopf, Abstand `gap` |
| `K.trage(cF, w, o)` | Mitfahrt: `cF` Mitte des Trägers in der Endlage, `w` Breite des Satzes. Rechnet, ob der Satz mindestens `o.R` (Vorgabe 34) vh ganz im Bild steht; wenn nicht, `D` (Weg) und `node(par)`: Schiebeknoten, unter dem der Träger in der **Startlage** `c0 = cF − D` gebaut wird. `o.minD` erzwingt eine Mitfahrt (wenn sie Bedeutung trägt). Desktop meist `D = 0` und `node(par) = par` |
| `K.onPanel(nd, pr, u, v, side, q)` | Druck auf Fläche: Mitte bei (u entlang des Scharniers, v vom Scharnier weg), `side` +1 Oberseite der Ruhelage, −1 Unterseite; `q` Richtung „oben“ des Drucks in der Ruhelage |
| `K.print(lines, e, on, o)` | freier Druck (Etiketten, Typenschilder: `font: "kicker"`, kurze Namen, keine Sätze) |
| `K.decal(wpx, hpx, draw, w, h, on)` | gezeichnete Fläche (Canvas): Bildschirme, Etiketten, Muster |
| `K.ticker`, `K.cable`, `K.sheet(x0, x1, z0, z1)` | Statuspunkt, Papierkabel, Bogen der Szene |

Faltkern (falt.js): `K.panel(par, a, b, n, t0, d, ang, opt)` Scharnier a→b (x, z), Fläche liegt in Richtung n und klappt um `ang` hoch (`Q` senkrecht, `Q − K.lean` der Kamera zugewandt); `opt.ease` eigener Lauf; `opt.dn {t0, d}` klappt wieder zurück. `F.lift(par, dy, t0, d)` Platte hebt sich parallel. `F.spin(par, c, ang, t0, d, opt)` Drehung. `F.slide(par, v, t0, d, opt)` Verschiebung. `K.box`, `K.slab` fertige Faltschachtel/Platte. Teile hängen am Bogen `R` oder aneinander; was aus dem Bogen geschnitten ist, hinterlässt einen Abdruck.

Referenz: `eroeffnung.js` (Laptop: Satz als Überschrift der Website; Rechnerschrank: Satz auf der Blindplatte mit `K.EV`, am Handy rollt er mit `K.trage`; Mappe: der Faden holt sie mit `K.trage({ minD })` ins Bild).

## 3. Regeln (gelten für jede Szene)

1. **Ein Ding je Szene, das Text und Bild zugleich ist.** Kein Zettel, Schild oder Kalender neben einer Szenerie. Die Form folgt aus dem Inhalt und lässt sich in einem Satz erklären. Typenschilder an Bauteilen nur kurz (Namen), keine Sätze.
2. **Jeder Satz der Satzliste erscheint**, ganz, wörtlich wie im Drehbuch (Schlüsselgruppen dort fett = hier `*…*`), in Lesereihenfolge von links nach rechts. Fakten unverändert; nichts erfinden (keine Zahlen, Preise, Kunden, Auszeichnungen). ClautzGPT und „Andersen Web Tools“ erscheinen nicht, RPLC nicht, kein Lebenslauf-PDF.
3. **Kernaussage zuerst:** Kicker und Kopf am Anfang der Szene, auf dem Ding selbst.
4. **Lesefenster:** jeder Kopf und Satz mindestens 30 vh ganz im Bild und voll deckend, Desktop 1280 × 900 und Handy 390 × 844 (`lauf.mjs` meldet `KURZ`). Schrift mindestens 19,5 px Desktop, 16,5 px Handy (`KLEIN`).
5. **Konstruktionsphase:** Teile entstehen aus dem Bogen: Bastellinien (`F.part`), dann klappen sie mit der Faltmechanik hoch und rasten ein; die Bewegung läuft, **während das Teil schon im Bild ist** (ab `sicht(x).in`), nicht unsichtbar.
6. **Stil „Bogen + Bastellinien“:** gefüllte Papierflächen in warmen Papiertönen (#faf8f3, #ece9e2, #e8e1d2, #e1d9c9 …), Haarkanten 0,35 … 0,5, Tinte #303033, **Rot nur für Faden und Punkt** (kleine rote Akzente wie ein Statuspunkt nur, wo sie Bedeutung haben). Kein Glow, keine Maße, keine Planziffern.
7. **Länge:** Richtwert je Szene aus dem Drehbuch (Abschnitt 3, Spalte Länge in Bildschirmhöhen); Länge der Szene = Strecke / Tempo, `lauf.mjs` zeigt sie.
8. **Faden:** x streng steigend, läuft durch die Szene und ist dort Teil des Dings, wo es passt.

## 4. Prüfweg (nur Rechnen; im Ordner `tmp/lesebahn`)

```
node --check ../../entwurf-2026-11/lesebahn/<szene>.js
NUR=<szene> node --import ./reg.mjs lauf.mjs 1280 900      Szene allein: Länge, Lesefenster je Satz, px, Reihenfolge, Tempo
NUR=<szene> node --import ./reg.mjs lauf.mjs 390 844
node --import ./reg.mjs lauf.mjs 1280 900                   ganze Seite (Folge aus folge.js)
```
`<szene>` ist der Name aus `folge.js`. Sichtprüfung macht der Hauptlauf im Browser (Vorschau mit `#nur=<szene>&p=<wert>`).
