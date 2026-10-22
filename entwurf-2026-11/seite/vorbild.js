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
    v.style.setProperty("--vf", Math.min(1 / (7.389 / Wn + .3 / H), .1587 * H).toFixed(2) + "px");
  }
  groesse(); addEventListener("resize", groesse);
  if (mitten()) v.classList.add("weg");
  else addEventListener("load", function () { if (mitten()) v.classList.add("weg"); }, { once: true });
})();
