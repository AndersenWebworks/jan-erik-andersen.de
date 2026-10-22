#!/usr/bin/env bash
# Füllt den Worktree "jea-veroeffentlichung" (Zweig "veroeffentlichung", Basis main) mit der neuen Startseite aus
# entwurf-2026-11/seite/. Wiederholbar (idempotent). Schreibt NUR im Worktree; committet, pusht und mergt nichts.
# Aufruf (Git Bash, im Hauptarbeitsbaum):  bash docs/weg-auf-main.sh
# Der Worktree-Pfad lässt sich mit WT=... überschreiben.
set -euo pipefail

HAUPT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WT="${WT:-C:/Andersen/Webworks/GitHub/Webworks/jea-veroeffentlichung}"
SEITE="$HAUPT/entwurf-2026-11/seite"
STAND="2026-10-22"
SITE="https://jan-erik-andersen.de"
MANIFEST_DIR="$HAUPT/tmp/weg-auf-main"
MANIFEST="$MANIFEST_DIR/kopiert.txt"

# ---------- Sicherheitsprüfungen ----------
[ -d "$SEITE" ] || { echo "FEHLER: $SEITE fehlt" >&2; exit 1; }
[ -d "$WT" ] || { echo "FEHLER: Worktree $WT fehlt" >&2; exit 1; }
WT="$(cd "$WT" && pwd)"
[ "$WT" != "$HAUPT" ] || { echo "FEHLER: Worktree ist der Hauptarbeitsbaum" >&2; exit 1; }
BRANCH="$(git -C "$WT" rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" = "veroeffentlichung" ] || { echo "FEHLER: Worktree steht auf '$BRANCH', erwartet 'veroeffentlichung'" >&2; exit 1; }
mkdir -p "$MANIFEST_DIR"

WTW="$(cd "$WT" && pwd -W)"; HAUPTW="$(cd "$HAUPT" && pwd -W)"; SEITEW="$(cd "$SEITE" && pwd -W)"

# ---------- a) Dateien aus seite/ kopieren ----------
# Was index.html lädt: main.js (Modul) -> kern.js, folge.js, gerwing.js ... (alle *.js im Ordner), vendor/three.*.js (Importmap),
# bilder/bilder.js + bilder/staffelei-bilder.js (dynamische Importe), fonts/NewsreaderN4*.woff2 (CSS), fonts/schriften.js, Favicons.
# Nicht ausgeliefert: _pruefung/, *.md (DREHBUCH, Notizen), bilder/*.jpg (nur Quellbilder der eingebetteten Daten), OFL-Lizenztexte werden mitgegeben.
( cd "$SEITE"
  ls index.html *.js apple-touch-icon.png favicon.svg favicon-16.png favicon-32.png
  ls bilder/bilder.js bilder/staffelei-bilder.js
  ls fonts/*.woff2 fonts/schriften.js fonts/OFL-*.txt
  ls vendor/*
) > "$MANIFEST.neu"
sort -u "$MANIFEST.neu" -o "$MANIFEST.neu"

# Dateien, die beim letzten Lauf kopiert wurden und in seite/ nicht mehr existieren, im Worktree entfernen
# (nur wenn sie nicht zu main gehören und der Pfad harmlos ist).
if [ -f "$MANIFEST" ]; then
  while IFS= read -r rel; do
    [ -n "$rel" ] || continue
    case "$rel" in /*|*..*|*:*) continue;; esac
    grep -qxF -- "$rel" "$MANIFEST.neu" && continue
    git -C "$WT" cat-file -e "main:$rel" 2>/dev/null && continue
    [ -f "$WT/$rel" ] && rm -f -- "$WT/$rel" && echo "entfernt (nicht mehr in seite/): $rel"
  done < "$MANIFEST"
fi
mv -f "$MANIFEST.neu" "$MANIFEST"

while IFS= read -r rel; do
  mkdir -p "$WT/$(dirname "$rel")"
  cp -f -- "$SEITE/$rel" "$WT/$rel"
done < "$MANIFEST"
echo "kopiert: $(wc -l < "$MANIFEST") Dateien aus seite/"

# ---------- b) Entwurfskennzeichnung in index.html entfernen, Kopf für die Website ----------
python -I - "$WTW/index.html" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
# noindex nur für den Entwurf gesetzt -> raus
s = s.replace('<meta name="robots" content="noindex, nofollow">\n', '')
s = s.replace('<title>Jan-Erik Andersen · Webentwicklung (Entwurf Seite)</title>',
  '<title>Jan-Erik Andersen · Webentwicklung</title>\n'
  '<meta name="description" content="Jan-Erik Andersen entwickelt Websites und Onlineshops, bindet sie an andere Systeme an und betreut sie. Webentwicklung aus dem Raum Plau am See, remote.">\n'
  '<link rel="canonical" href="https://jan-erik-andersen.de/">')
# sichtbares Schild samt Szenenanzeige
s, n = re.subn(r'<div class="draft">.*?</div>\n', '', s, flags=re.S)
if n != 1 and '<div class="draft">' in s:
    sys.exit("FEHLER: Entwurfsschild nicht eindeutig entfernt")
if "Entwurf" in s.split("<main", 1)[0].split("</style>")[-1] or 'class="draft"' in s:
    sys.exit("FEHLER: Entwurfskennzeichnung noch vorhanden")
open(p, "w", encoding="utf-8", newline="\n").write(s)
PY

# ---------- c) Rechtsseiten ----------
mkdir -p "$WT/de"
git -C "$HAUPT" show main:de/impressum.html > "$WT/de/impressum.html"
cp -f -- "$HAUPT/de/datenschutz.html" "$WT/de/datenschutz.html"   # bewusst die Arbeitskopie, nicht HEAD
python -I - "$WTW/de/impressum.html" "$WTW/de/datenschutz.html" <<'PY'
import re, sys
KOPF = ('<header class="site-header" id="site-header">\n'
        '    <div class="site-header-inner">\n'
        '      <a href="/" class="header-brand"><span class="header-brand-name">Jan-Erik</span> <span class="header-brand-surname">Andersen</span></a>\n'
        '    </div>\n'
        '  </header>')
FUSS = ('<footer class="site-footer">\n'
        '    <div class="container">\n'
        '      <div class="footer-content">\n'
        '        <span>© 2026 Andersen Webworks · <a href="/">Jan-Erik Andersen</a></span>\n'
        '        <ul class="footer-links">\n'
        '          <li><a href="/de/impressum.html">Impressum</a></li>\n'
        '          <li><a href="/de/datenschutz.html">Datenschutz</a></li>\n'
        '          <li><a href="/">Startseite</a></li>\n'
        '        </ul>\n'
        '      </div>\n'
        '    </div>\n'
        '  </footer>')
for p in sys.argv[1:]:
    s = open(p, encoding="utf-8").read()
    s, n1 = re.subn(r'<header class="site-header.*?</header>', lambda m: KOPF, s, count=1, flags=re.S)
    s, n2 = re.subn(r'<footer class="site-footer">.*?</footer>', lambda m: FUSS, s, count=1, flags=re.S)
    s, n3 = re.subn(r'\s*<script>(?:(?!</script>).)*darkmode(?:(?!</script>).)*</script>', '', s, flags=re.S)
    # Sprachalternativen zeigen auf die entfernte englische Fassung
    s = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">', '', s)
    if (n1, n2) != (1, 1) or n3 < 1:
        sys.exit("FEHLER: Umbau fehlgeschlagen in " + p + str((n1, n2, n3)))
    # Kopf-/Fußbereich darf keine alten Ziele mehr haben
    teile = re.findall(r'<(?:header|footer)\b.*?</(?:header|footer)>', s, flags=re.S)
    for t in teile:
        if re.search(r'leistungen|projekte|preise|faq|ueber|kontakt|/en/|darkmode|localStorage', t):
            sys.exit("FEHLER: alte Navigation in " + p)
    open(p, "w", encoding="utf-8", newline="\n").write(s)
PY

# ---------- d) Weiterleitungen ----------
# Alle versionierten HTML-Dateien des Worktrees außer: Startseite, Impressum, Datenschutz, standalone/ (Rückfrage), node_modules.
python -I - "$WTW" <<'PY'
import subprocess, sys, os
wt = sys.argv[1]
behalten = {"index.html", "de/impressum.html", "de/datenschutz.html"}
out = subprocess.run(["git", "-C", wt, "ls-tree", "-r", "--name-only", "main"], capture_output=True, text=True, encoding="utf-8", check=True).stdout.split("\n")
HTML = ('<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<title>Weiterleitung · Jan-Erik Andersen</title>\n'
        '<meta http-equiv="refresh" content="0; url=/">\n'
        '<link rel="canonical" href="https://jan-erik-andersen.de/">\n'
        '<meta name="robots" content="noindex">\n</head>\n<body>\n'
        '<p><a href="/">Zur Startseite</a></p>\n</body>\n</html>\n')
liste = []
for rel in out:
    if not rel.endswith(".html") or rel in behalten:
        continue
    if rel.startswith(("standalone/", "entwurf", "node_modules/", "tmp/", "docs/", "tools/")):
        continue
    liste.append(rel)
    pfad = os.path.join(wt, rel)
    os.makedirs(os.path.dirname(pfad), exist_ok=True)
    open(pfad, "w", encoding="utf-8", newline="\n").write(HTML)
print("Weiterleitungen:", len(liste))
for r in liste: print("  ", r)
PY

# ---------- e) sitemap.xml, llms.txt, llms-full.txt ----------
cat > "$WT/sitemap.xml" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>$SITE/</loc>
    <lastmod>$STAND</lastmod>
  </url>
  <url>
    <loc>$SITE/de/impressum.html</loc>
    <lastmod>$STAND</lastmod>
  </url>
  <url>
    <loc>$SITE/de/datenschutz.html</loc>
    <lastmod>$STAND</lastmod>
  </url>
</urlset>
EOF

# llms.txt (kurz) und llms-full.txt (ganzer Text) nur aus dem Text-Fallback (<main class="sr"> und nav.kontaktwege) von seite/index.html
python -I - "$SEITEW/index.html" "$WTW" "$SITE" <<'PY'
import re, sys
from html.parser import HTMLParser
quelle, wt, site = sys.argv[1:4]
src = open(quelle, encoding="utf-8").read()
m = re.search(r'<main class="sr">.*?</main>\s*<nav class="kontaktwege".*?</nav>', src, flags=re.S)
if not m: sys.exit("FEHLER: Text-Fallback nicht gefunden")

class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.blocks = []; s.cur = None; s.stack = []; s.li = None
    def handle_starttag(s, t, a):
        a = dict(a)
        if t in ("h1", "h2", "h3", "p", "dt", "dd", "cite", "li"):
            s.cur = [t, a.get("class", ""), ""]
        elif t == "section": s.blocks.append(["section", a.get("id", ""), ""])
        elif t == "blockquote": s.blocks.append(["bq", "", ""])
        elif t == "a" and s.cur is not None:
            s.cur[2] += ""; s.href = a.get("href", "")
        elif t == "span" and a.get("class") == "y" and s.cur: s.cur[2] += "\u0001"
        elif t == "small" and s.cur: s.cur[2] += "\u0002"
    def handle_endtag(s, t):
        if t in ("h1", "h2", "h3", "p", "dt", "dd", "cite", "li") and s.cur:
            s.cur[2] = re.sub(r"\s+", " ", s.cur[2]).strip(); s.blocks.append(s.cur); s.cur = None
        elif t == "span" and s.cur and "\u0001" in s.cur[2] and "\u0003" not in s.cur[2]: s.cur[2] += "\u0003"
        elif t == "a": pass
    def handle_data(s, d):
        if s.cur is not None: s.cur[2] += d
    def handle_entityref(s, n): pass

p = P(); p.feed(m.group(0))
# Kontaktwege: a-Texte einzeln
kw = re.findall(r'<a href="([^"]*)">([^<]*)</a>', m.group(0).split('class="kontaktwege"', 1)[1])

def md_li(t):
    # Werdegang: "\x01 Zeitraum \x03 Titel \x02 Zusatz"
    if "\u0001" in t:
        y = t.split("\u0001")[1].split("\u0003")[0].strip()
        rest = t.split("\u0003", 1)[1]
        titel, _, zus = rest.partition("\u0002")
        return "- " + y + ": " + titel.strip() + (" – " + zus.strip() if zus.strip() else "")
    return "- " + t

zeilen = []; inbq = False; dl = False
for b in p.blocks:
    t, k, x = b
    if t == "section": continue
    if t == "bq": inbq = True; continue
    if t == "h1": zeilen += ["# " + x.replace("  ", " "), ""]
    elif t == "h2": zeilen += ["", "## " + x, ""]
    elif t == "h3": zeilen += ["", "### " + x, ""]
    elif t == "p" and inbq: zeilen += ["> " + x]
    elif t == "cite": zeilen += [">", "> – " + x, ""]; inbq = False
    elif t == "p": zeilen += [x, ""]
    elif t == "li": zeilen += [md_li(x)]
    elif t == "dt": dtx = x
    elif t == "dd": zeilen += ["- " + dtx + ": " + x]
text = "\n".join(zeilen)
text = re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"
# Kontaktwege anhängen (Text wie im Fallback)
kontakt = "\n".join("- " + (txt if not href.startswith("http") else txt + " (" + href + ")") for href, txt in kw)
voll = text + "\n" + kontakt + "\n"

# llms-full.txt: kompletter Text
kopf_voll = "Quelle: " + site + "/ (Text ohne 3D-Darstellung)\n\n"
open(wt + "/llms-full.txt", "w", encoding="utf-8", newline="\n").write(kopf_voll + voll + "\nRechtliches:\n- Impressum: " + site + "/de/impressum.html\n- Datenschutz: " + site + "/de/datenschutz.html\n")

# llms.txt: je Abschnitt Überschrift und erster Satz des ersten Absatzes (Werdegang: Zeitraum und Station; Stimmen: Hinweis)
def erster_satz(x):
    m = re.match(r".*?[.!?](?=\s|$)", x)
    return m.group(0) if m else x
abschnitte = re.split(r"\n(?=## )", text)
kopf = [l for l in abschnitte[0].split("\n") if l and not l.startswith("# ")]
llms = ["# Jan-Erik Andersen", "", "> " + kopf[0], ">", "> " + " ".join(kopf[1:]), "", "Ausführliche Fassung: " + site + "/llms-full.txt", ""]
for ab in abschnitte[1:]:
    zl = ab.split("\n")
    titel = zl[0][3:]
    if titel.startswith("Schreiben Sie mir"): continue
    llms += ["## " + titel, ""]
    if titel in ("Werdegang", "Stimmen"):
        if titel == "Werdegang":
            llms += [l for l in zl if re.match(r"- (seit )?\d{4}", l)] + [""]
        else:
            llms += ["Kundenstimmen im Wortlaut: " + site + "/llms-full.txt", ""]
        continue
    h3 = [i for i, l in enumerate(zl) if l.startswith("### ")]
    if not h3:
        par = [l for l in zl[1:] if l and not l.startswith("- ")]
        if par: llms += [par[0] if len(par[0]) < 300 else erster_satz(par[0]), ""]
        continue
    for k, i in enumerate(h3):
        ende = h3[k + 1] if k + 1 < len(h3) else len(zl)
        par = [l for l in zl[i + 1:ende] if l and not l.startswith("- ")]
        meta = par[0] if par and len(par[0]) < 60 and not par[0].endswith(".") else None
        if meta: par = par[1:]
        if not par:
            llms += ["- " + l[2:] for l in zl[i + 1:ende] if l.startswith("- ")]
            continue
        llms.append("- " + zl[i][4:] + (" (" + meta + ")" if meta else "") + (": " + erster_satz(par[0]) if par else ""))
    llms.append("")
llms += ["## Kontakt", ""] + kontakt.split("\n") + ["", "## Rechtliches", "", "- Impressum: " + site + "/de/impressum.html", "- Datenschutz: " + site + "/de/datenschutz.html", ""]
s = re.sub(r"\n{3,}", "\n\n", "\n".join(llms))
open(wt + "/llms.txt", "w", encoding="utf-8", newline="\n").write(s)
PY

# ---------- g) Alte Entwürfe und KI-Spiegel der alten Seite raus (Erik, 22.10.2026) ----------
# standalone/ (alte Entwürfe) und ai/ (Spiegel der alten Seite mit Preisen) fallen weg, der Spiegel-Workflow ebenso,
# robots.txt verliert den Verweis auf /ai/manifest.json. Nur versionierte Pfade im Worktree, per git rm.
for p in standalone ai .github/workflows/ai-readable-mirrors.yml; do
    if [ -n "$(git -C "$WT" ls-files -- "$p")" ]; then git -C "$WT" rm -r -q -- "$p" && echo "entfernt: $p"; fi
done
sed -i '/^# AI-Manifest/d; /\/ai\/manifest\.json/d' "$WT/robots.txt"

echo "Fertig. Worktree: $WT (nichts committet, nichts gepusht)."
