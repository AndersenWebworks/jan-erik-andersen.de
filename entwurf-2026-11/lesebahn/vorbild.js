// Das HTML-Vorbild (Name und Unterzeile) gehört nur zum Startbild: Bei Einstieg mitten auf der Seite (Anker #p/#s oder
// wiederhergestellte Scrollposition) sofort weg, noch bevor three.js geladen ist. Klassisches Skript, läuft synchron.
(function () {
  var v = document.querySelector(".vorbild"); if (!v) return;
  var h = new URLSearchParams(location.hash.slice(1));
  function mitten() { return (h.has("p") && +h.get("p") > .004) || h.has("s") || scrollY > innerHeight * .1; }
  if (mitten()) v.classList.add("weg");
  else addEventListener("load", function () { if (mitten()) v.classList.add("weg"); }, { once: true });
})();
