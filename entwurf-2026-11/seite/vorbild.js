// Das HTML-Vorbild (Name und Unterzeile) gehört nur zum Startbild: Bei Einstieg mitten auf der Seite (Anker #p/#s oder
// wiederhergestellte Scrollposition) sofort weg, noch bevor three.js geladen ist. Klassisches Skript, läuft synchron.
(function () {
  var v = document.querySelector(".vorbild"); if (!v) return;
  var h = new URLSearchParams(location.hash.slice(1));
  function mitten() { return (h.has("p") && +h.get("p") > .004) || h.has("s") || scrollY > innerHeight * .1; }
  // Schriftgröße des Namens im Breitbild so, dass sie dem 3D-Startbild (eroeffnung.js, startD()) gleicht: Name höchstens 1000 px und 70 % der Breite,
  // dazu die Perspektive der Lettern (gerechnet an 1024 × 768 bis 3440 × 1440, Abweichung unter 0,1 px); Schrift höchstens 15,87 % der Höhe.
  // Am Handy (Hochformat) setzt index.html 17vw.
  function groesse() {
    var W = innerWidth, H = innerHeight;
    if (W < H) { v.style.removeProperty("--vf"); return; }
    var Wn = Math.min(.7 * W, 1000);
    // 0,9817: gemessen (1440 × 900 und 2560 × 1440): die 3D-Marke steht um diesen Faktor kleiner als die Rechnung; so deckt das Vorbild die Marke bis auf 1 px
    v.style.setProperty("--vf", (Math.min(1 / (7.389 / Wn + .3 / H), .1587 * H) * .9817).toFixed(2) + "px");
  }
  // am Handy gehört die Unterzeile (Ortszeile) nicht zum Startbild: beim Laden steht nur der Name, die Ortszeile kommt mit dem Scrollen auf dem Podest
  var pz = v.querySelector("p"); if (pz) pz.style.display = "none";
  groesse(); addEventListener("resize", groesse);
  if (mitten()) v.classList.add("weg");
  else addEventListener("load", function () { if (mitten()) v.classList.add("weg"); }, { once: true });
})();
