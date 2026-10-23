#!/usr/bin/env python
# Baubefehl des Neubaus.
#   python neubau/bauen.py modernisierung               Vollbau: Blender (breit + hochkant), glb, Prüfungen, Probebilder, Browserprüfung
#   python neubau/bauen.py modernisierung --nur-text    ohne Blender: Szenendatei -> assets, Text/Lage im Browser prüfen
#   python neubau/bauen.py pruefen modernisierung       nur die Browserprüfung (Text an den Lesestellen, breit und hochkant)
# Optionen: --ohne-proben (keine Blender-Probebilder), --bilder (Browser-Bilder bei p=0.15/0.4/0.7/0.95 nach proben/<szene>/browser),
#           --trotzdem (--nur-text auch bei geänderter Form; der Browser zeigt dann den alten Bau mit neuem Text)
import hashlib, json, os, re, shutil, subprocess, sys, time, html

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HIER, "blender"))
import szene as szn

BLENDER = os.environ.get("BLENDER") or r"D:\Tools\blender\blender-5.2.3-windows-x64\blender.exe"
ASSETS = os.path.join(HIER, "seite", "assets")
TMP = os.path.join(HIER, "tmp")
ANORDNUNGEN = ("breit", "hochkant")


def sync_schriften():
    quelle, ziel = os.path.join(HIER, "blender", "schriften"), os.path.join(HIER, "seite", "schriften")
    os.makedirs(ziel, exist_ok=True)
    for f in os.listdir(quelle):
        a, b = os.path.join(quelle, f), os.path.join(ziel, f)
        if not os.path.exists(b) or open(a, "rb").read() != open(b, "rb").read():
            shutil.copyfile(a, b)


def html_text(name, sz):
    """Text im statischen HTML (Screenreader, ohne JavaScript) aus der Szenendatei nachziehen (data-szene="fläche:nr")."""
    seite = os.path.join(HIER, "seite", "index.html")
    h = open(seite, encoding="utf8").read()
    def flach(n):
        out = []
        for e in sz["druckflaechen"][n]["elemente"]:
            out += e.get("absaetze") or ([e["text"]] if e.get("text") else [])
        return out
    def ers(m):
        n, i = m.group(3).split(":")
        return m.group(1) + html.escape(flach(n)[int(i)], quote=False) + m.group(4)
    neu = re.sub(r'(<(\w+)[^>]*data-szene="([^"]+)"[^>]*>)[^<]*(</\2>)', lambda m: ers(m) if m.group(0) else m.group(0), h)
    # Gruppennummerierung im Regex: group(2) ist der Tag, daher Index anpassen
    if neu != h:
        open(seite, "w", encoding="utf8", newline="").write(neu)
        return True
    return False


def szene_schreiben(name, sz):
    os.makedirs(ASSETS, exist_ok=True)
    ziel = os.path.join(ASSETS, name + ".szene.json")
    text = json.dumps(sz, ensure_ascii=False, indent=2) + "\n"
    if not os.path.exists(ziel) or open(ziel, encoding="utf8").read() != text:
        open(ziel, "w", encoding="utf8", newline="\n").write(text)


def blender_bauen(name, proben):
    """Beide Anordnungen parallel (eigener Druckordner je Lauf)."""
    procs = {}
    for a in ANORDNUNGEN:
        env = dict(os.environ, NEUBAU_DRUCK=os.path.join(TMP, "druck", a))
        cmd = [BLENDER, "-b", "--factory-startup", "--python", os.path.join(HIER, "blender", name + ".py"), "--", "--export"]
        if a == "hochkant":
            cmd.append("--hochkant")
        if proben:
            cmd.append("--proben")
        log = open(os.path.join(TMP, f"{name}_{a}_blender.log"), "w", encoding="utf8")
        procs[a] = (subprocess.Popen(cmd, stdout=log, stderr=subprocess.STDOUT, env=env, cwd=os.path.dirname(HIER)), log)
    ergebnis = {}
    for a, (p, log) in procs.items():
        rc = p.wait(); log.close()
        ergebnis[a] = rc
    return ergebnis


def browser(befehl, *args):
    r = subprocess.run(["node", os.path.join(HIER, "werkzeug", "browser.mjs"), befehl, *args], capture_output=True, text=True, encoding="utf8")
    zeilen = [z for z in r.stdout.strip().splitlines() if z.startswith("{")]
    if not zeilen:
        return {"ok": False, "fehler": ["Browserlauf ohne Ergebnis: " + (r.stderr or r.stdout)[-400:]], "ansichten": {}, "logs": []}
    return json.loads(zeilen[-1])


def vergleiche_vertrag(sz, bericht, a):
    """Eingang/Ausgang laut Szenendatei gegen die gebauten Werte (Warnung bei Abweichung)."""
    warn = []
    for seite in ("eingang", "ausgang"):
        soll = (sz.get(seite) or {}).get(a)
        ist = bericht["uebergang"][seite]
        if not soll:
            warn.append(f"{a} {seite}: in der Szenendatei nicht festgelegt")
            continue
        def flach(d, p=""):
            for k, v in d.items():
                if isinstance(v, dict): yield from flach(v, p + k + ".")
                elif isinstance(v, list): yield from ((p + k + f"[{i}]", x) for i, x in enumerate(v))
                else: yield p + k, v
        s, i = dict(flach(soll)), dict(flach(ist))
        for k, v in s.items():
            if k in i and isinstance(v, (int, float)) and abs(i[k] - v) > .06:
                warn.append(f"{a} {seite} {k}: Soll {v}, gebaut {i[k]}")
    return warn


def groesse(p):
    return f"{os.path.getsize(p) / 1024:.0f} KB" if os.path.exists(p) else "fehlt"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    flags = {x for x in sys.argv[1:] if x.startswith("--")}
    nur_pruefen = bool(args) and args[0] == "pruefen"
    if nur_pruefen:
        args = args[1:]
    if not args:
        print(__doc__ or "python neubau/bauen.py <szene> [--nur-text] | pruefen <szene>"); return 1
    name = args[0]
    sz = szn.lade(name)
    h = szn.form_hash(sz)
    os.makedirs(TMP, exist_ok=True)
    zeiten, fehler, hinweise = {}, [], []
    manifest_datei = os.path.join(ASSETS, name + ".bau.json")
    manifest = json.load(open(manifest_datei, encoding="utf8")) if os.path.exists(manifest_datei) else {}
    modus = "pruefen" if nur_pruefen else ("nur-text" if "--nur-text" in flags else "voll")
    t_ges = time.time()

    if modus != "voll" and manifest.get("form_hash") != h:
        msg = "Form der Szene geändert (Blender-Bau nötig): " + ("kein früherer Bau" if not manifest else "Hash weicht vom letzten Bau ab")
        if "--trotzdem" in flags or modus == "pruefen":
            hinweise.append(msg + " – Ergebnis zeigt den alten Bau")
        else:
            print("FEHLER:", msg, "\n  -> python neubau/bauen.py", name, "(Vollbau) oder --trotzdem"); return 3

    if modus != "pruefen":
        sync_schriften()
        szene_schreiben(name, sz)
        if html_text(name, sz): hinweise.append("seite/index.html: Text nachgezogen")

    gebaut = {}
    if modus == "voll":
        t = time.time()
        rc = blender_bauen(name, "--ohne-proben" not in flags)
        zeiten["blender"] = time.time() - t
        for a in ANORDNUNGEN:
            glb = os.path.join(ASSETS, f"{name}-{a}.glb")
            if rc[a]:
                fehler.append(f"Blender {a}: Exitcode {rc[a]} (Log tmp/{name}_{a}_blender.log)"); continue
            b = json.load(open(os.path.join(TMP, f"{name}_{a}_pruefung.json"), encoding="utf8"))
            gebaut[a] = b
            if b["kollisionen"]: fehler.append(f"{a}: Kollisionen {list(b['kollisionen'])}")
            for k, v in b["einstellungen"].items():
                if v["punkte_ausserhalb"]: fehler.append(f"{a}: {k}: {v['punkte_ausserhalb']} Punkte außerhalb des Bildes")
            for k, v in b.get("hinweise", {}).items():
                if v["punkte_ausserhalb"]: hinweise.append(f"{k}: {v['punkte_ausserhalb']} Punkte außerhalb (nur Hinweis)")
            hinweise += ["Vertrag " + w for w in vergleiche_vertrag(sz, b, a)]
        if not fehler:
            json.dump({"form_hash": h, "gebaut": time.strftime("%Y-%m-%d %H:%M:%S"),
                       "glb": {a: os.path.getsize(os.path.join(ASSETS, f"{name}-{a}.glb")) for a in ANORDNUNGEN}},
                      open(manifest_datei, "w", encoding="utf8"), indent=1)

    bericht = None
    if not (modus == "voll" and fehler):
        t = time.time()
        ordner = os.path.join(HIER, "proben", name, "browser")
        bericht = browser("pruefen", "--szene", szn.datei(name), "--ordner", ordner, "--praefix", "text")
        zeiten["browser"] = time.time() - t
        fehler += bericht.get("fehler", []) + [l for l in bericht.get("logs", []) if l.startswith("pageerror")]
        if "--bilder" in flags:
            browser("bilder", "--ordner", ordner, "--praefix", "p")

    zeiten["gesamt"] = time.time() - t_ges
    print("=" * 60)
    print(f"{name} [{modus}]: {'OK' if not fehler else 'FEHLER'}   Form-Hash {h}")
    if modus == "voll":
        for a in ANORDNUNGEN:
            b = gebaut.get(a)
            print(f"  {a:9s} glb {groesse(os.path.join(ASSETS, f'{name}-{a}.glb'))}" + (f", Kollisionen {len(b['kollisionen'])}, Einstellungen außerhalb {sum(v['punkte_ausserhalb'] for v in b['einstellungen'].values())}" if b else ""))
    if bericht:
        for a, v in bericht["ansichten"].items():
            for fn, fl in v["flaechen"].items():
                es = fl["bilder"].values()
                print(f"  Browser {a:9s} {fn:10s} min {min(e['min_em_px'] for e in es):5.1f} px, verdeckt {sum(e['verdeckt'] for e in es)}, außerhalb {sum(e['ausserhalb'] for e in es)}, Bilder {list(fl['bilder'])}")
    for hw in hinweise: print("  Hinweis:", hw)
    for f in fehler: print("  FEHLER:", f)
    print("  Zeiten: " + ", ".join(f"{k} {v:.1f} s" for k, v in zeiten.items()))
    return 0 if not fehler else 2


if __name__ == "__main__":
    sys.exit(main())
