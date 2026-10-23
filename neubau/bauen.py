#!/usr/bin/env python
# Baubefehl des Neubaus.
#   python neubau/bauen.py eroeffnung                  Vollbau einer Szene: Blender (breit + hochkant), glb, Prüfungen, Probebilder, Browserprüfung
#   python neubau/bauen.py modernisierung --nur-text   ohne Blender: Szenendatei -> assets, Text/Lage im Browser prüfen
#   python neubau/bauen.py pruefen eroeffnung          nur die Browserprüfung (Text an den Lesestellen, breit und hochkant)
#   python neubau/bauen.py uebergang eroeffnung modernisierung   Übergangsstück aus Ausgang der einen und Eingang der anderen Szene
#   python neubau/bauen.py seite                       ganze Seite: alle Szenen der Folge (szenen/folge.json), alle Übergänge, folge.js, Prüfungen, Nähte
# Optionen: --ohne-proben (keine Blender-Probebilder), --bilder (Browser-Bilder nach proben/<szene>/browser),
#           --trotzdem (--nur-text auch bei geänderter Form; der Browser zeigt dann den alten Bau mit neuem Text),
#           --nur-neu (bei "seite": Szenen und Übergänge, deren Szenendatei sich nicht geändert hat, nicht neu bauen)
# Exitcode 0 = ok, 2 = Prüfung fehlgeschlagen, 3 = Blender nötig.
import hashlib, json, os, re, shutil, subprocess, sys, time, html

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HIER, "blender"))
import szene as szn

BLENDER = os.environ.get("BLENDER") or r"D:\Tools\blender\blender-5.2.3-windows-x64\blender.exe"
ASSETS = os.path.join(HIER, "seite", "assets")
TMP = os.path.join(HIER, "tmp")
ANORDNUNGEN = ("breit", "hochkant")
SCHWELLE = {"tempo_min": 0.004, "ruck_ausreisser": 8.0, "kruemmung_tor": 0.01, "dkruemmung_max": 6.0, "radius_min_fehler": 0.5, "radius_min_warnung": 1.5, "wendepunkte_max": 1}


def sync_schriften():
    quelle, ziel = os.path.join(HIER, "blender", "schriften"), os.path.join(HIER, "seite", "schriften")
    os.makedirs(ziel, exist_ok=True)
    for f in os.listdir(quelle):
        a, b = os.path.join(quelle, f), os.path.join(ziel, f)
        if not os.path.exists(b) or open(a, "rb").read() != open(b, "rb").read():
            shutil.copyfile(a, b)


def html_text(name, sz):
    """Text im statischen HTML (Screenreader, ohne JavaScript) aus der Szenendatei nachziehen (data-szene="<szene>/<fläche>:<nr>")."""
    seite = os.path.join(HIER, "seite", "index.html")
    h = open(seite, encoding="utf8").read()
    def flach(n):
        out = []
        for e in sz["druckflaechen"][n]["elemente"]:
            out += e.get("absaetze") or ([e["text"]] if e.get("text") else [])
        return out
    def ers(m):
        kopf, wert, tag = m.group(1), m.group(3), m.group(2)
        ziel = wert.split(":")
        sn, fn = ziel[0].split("/") if "/" in ziel[0] else (name, ziel[0])
        if sn != name:
            return m.group(0)
        if fn == "texte":      # Wortlaut aus dem Block "texte" der Szenendatei (Verweis über den Schlüssel)
            if ziel[1] not in sz.get("texte", {}):
                return m.group(0)
            t = sz["texte"][ziel[1]]
            return kopf + html.escape(t if isinstance(t, str) else " ".join(t), quote=False) + m.group(4)
        if fn not in sz["druckflaechen"]:
            return m.group(0)
        return kopf + html.escape(flach(fn)[int(ziel[1])], quote=False) + m.group(4)
    neu = re.sub(r'(<(\w+)[^>]*data-szene="([^"]+)"[^>]*>)[^<]*(</\2>)', ers, h)
    if neu != h:
        open(seite, "w", encoding="utf8", newline="").write(neu)
        return True
    return False


def szene_schreiben(name, sz):
    """Laufzeitdaten für den Browser als ES-Modul (die Webvorschau liefert keine .json aus)."""
    os.makedirs(ASSETS, exist_ok=True)
    ziel = os.path.join(ASSETS, name + ".szene.js")
    text = "// erzeugt von neubau/bauen.py aus neubau/szenen/" + name + ".json – nicht von Hand ändern\nexport default " + json.dumps(sz, ensure_ascii=False, indent=1) + ";\n"
    if not os.path.exists(ziel) or open(ziel, encoding="utf8").read() != text:
        open(ziel, "w", encoding="utf8", newline="\n").write(text)


def manifest_pfad(name):
    return os.path.join(ASSETS, name + ".bau.json")


def manifest_lesen(name):
    p = manifest_pfad(name)
    return json.load(open(p, encoding="utf8")) if os.path.exists(p) else {}


def blender_lauf(skript, args, tag, proben, anordnungen=ANORDNUNGEN):
    """Beide Anordnungen parallel (eigener Druckordner je Lauf)."""
    procs = {}
    for a in anordnungen:
        env = dict(os.environ, NEUBAU_DRUCK=os.path.join(TMP, "druck", tag + "_" + a))
        cmd = [BLENDER, "-b", "--factory-startup", "--python", os.path.join(HIER, "blender", skript + ".py"), "--", "--export", *args]
        if a == "hochkant":
            cmd.append("--hochkant")
        if proben:
            cmd.append("--proben")
        log = open(os.path.join(TMP, f"{tag}_{a}_blender.log"), "w", encoding="utf8")
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
        return {"ok": False, "fehler": ["Browserlauf ohne Ergebnis: " + (r.stderr or r.stdout)[-600:]], "ansichten": {}, "logs": []}
    return json.loads(zeilen[-1])


def flach(d, p=""):
    for k, v in d.items():
        if isinstance(v, dict): yield from flach(v, p + k + ".")
        elif isinstance(v, list): yield from ((p + k + f"[{i}]", x) for i, x in enumerate(v))
        else: yield p + k, v


def vergleiche_vertrag(sz, bericht, a):
    """Eingang/Ausgang laut Szenendatei (Faden: Punkt und Richtung) gegen die gebauten Werte (Warnung bei Abweichung)."""
    warn = []
    for seite in ("eingang", "ausgang"):
        soll = ((sz.get(seite) or {}).get(a) or {}).get("faden")
        ist = bericht["uebergang"][seite]["faden"]
        if not soll:
            warn.append(f"{a} {seite}: in der Szenendatei nicht festgelegt"); continue
        s, i = dict(flach(soll)), dict(flach(ist))
        for k, v in s.items():
            if k in i and isinstance(v, (int, float)) and abs(i[k] - v) > .06:
                warn.append(f"{a} {seite} faden.{k}: Soll {v}, gebaut {i[k]}")
    return warn


def bahn_pruefen(b, a, wer, fehler, hinweise):
    """Krümmungsregeln der Schiene (Eingabe: bericht['bahn'] aus Blender)."""
    br = b.get("bahn")
    if not br:
        fehler.append(f"{a}: {wer}: kein Bahnbericht"); return
    S = SCHWELLE
    if abs(br["kruemmung_anfang"]) > S["kruemmung_tor"] or abs(br["kruemmung_ende"]) > S["kruemmung_tor"]:
        fehler.append(f"{a}: {wer}: Krümmung an den Toren nicht 0 ({br['kruemmung_anfang']}, {br['kruemmung_ende']})")
    if br["dkruemmung_max"] > S["dkruemmung_max"]:
        fehler.append(f"{a}: {wer}: Krümmungssprung/Knick (größte Krümmungsänderung {br['dkruemmung_max']} je Einheit)")
    if br["radius_min"] < S["radius_min_fehler"]:
        fehler.append(f"{a}: {wer}: Bogen zu eng (Radius {br['radius_min']})")
    elif br["radius_min"] < S["radius_min_warnung"]:
        hinweise.append(f"{a}: {wer}: Bogen eng (Radius {br['radius_min']}, ruhiger wäre größer)")
    if br["wendepunkte"] > S["wendepunkte_max"]:
        fehler.append(f"{a}: {wer}: {br['wendepunkte']} Wendepunkte (höchstens {S['wendepunkte_max']})")


def fahrt_pruefen(sz, b, a, wer, fehler, hinweise):
    """Kamerafahrt (eine durchgehende Bewegung): Tempo nirgends nahe 0 (außer in den ersten Bildern am Seitenanfang), Anschlusstempo gegen die Szenendatei."""
    k = b.get("kamera")
    if not k:
        return
    grenze = (sz.get("pruefung") or {}).get("tempo_min", SCHWELLE["tempo_min"])
    if k["tempo_min"] < grenze:
        fehler.append(f"{a}: {wer}: Kameratempo fällt auf {k['tempo_min']} (Grenze {grenze} Einheiten/Bild)")
    for seite, schl in (("ausgang", "tempo_ende"), ("eingang", "tempo_anfang")):
        soll = ((sz.get(seite) or {}).get(a) or {}).get("kamera_tempo")
        if soll and abs(k[schl] - soll) > .2 * soll:
            fehler.append(f"{a}: {wer}: Anschlusstempo {seite} {k[schl]} statt {soll}")
    if k.get("ruck_ausreisser", 0) > SCHWELLE["ruck_ausreisser"]:
        fehler.append(f"{a}: {wer}: Ruck-Ausreißer (größter Ruck {k['ruck_max']} = {k['ruck_ausreisser']}-fach des 98. Perzentils)")


def groesse(p):
    return f"{os.path.getsize(p) / 1024:.0f} KB" if os.path.exists(p) else "fehlt"


# ------------------------------------------------------------------ Szene
def szene_bauen(name, flags, ausgabe=True):
    """Gibt (modus, fehler, hinweise, gebaut, bericht, zeiten, h) zurück."""
    sz = szn.lade(name)
    h = szn.form_hash(sz)
    os.makedirs(TMP, exist_ok=True)
    zeiten, fehler, hinweise = {}, [], []
    manifest = manifest_lesen(name)
    modus = "pruefen" if "pruefen" in flags else ("nur-text" if "--nur-text" in flags else "voll")
    t_ges = time.time()
    if modus != "voll" and manifest.get("form_hash") != h:
        msg = "Form der Szene geändert (Blender-Bau nötig): " + ("kein früherer Bau" if not manifest else "Hash weicht vom letzten Bau ab")
        if "--trotzdem" in flags or modus == "pruefen":
            hinweise.append(msg + " – Ergebnis zeigt den alten Bau")
        else:
            print("FEHLER:", msg, "\n  -> python neubau/bauen.py", name, "(Vollbau) oder --trotzdem"); return modus, ["Blender nötig"], hinweise, {}, None, zeiten, h, 3
    if modus != "pruefen":
        sync_schriften()
        szene_schreiben(name, sz)
        if html_text(name, sz): hinweise.append("seite/index.html: Text nachgezogen")
    gebaut = {}
    if modus == "voll":
        t = time.time()
        rc = blender_lauf(name, [], name, "--ohne-proben" not in flags)
        zeiten["blender"] = time.time() - t
        for a in ANORDNUNGEN:
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
            bahn_pruefen(b, a, "Schiene", fehler, hinweise)
            fahrt_pruefen(sz, b, a, name, fehler, hinweise)
        if not fehler:
            tore = {a: {"eingang": b["uebergang"]["eingang"], "ausgang": b["uebergang"]["ausgang"], "bahn": b.get("bahn"), "huelle": b.get("huelle")} for a, b in gebaut.items()}
            json.dump({"form_hash": h, "gebaut": time.strftime("%Y-%m-%d %H:%M:%S"), "glb": {a: os.path.getsize(os.path.join(ASSETS, f"{name}-{a}.glb")) for a in ANORDNUNGEN}, "tore": tore},
                      open(manifest_pfad(name), "w", encoding="utf8"), indent=1)
    bericht = None
    if not (modus == "voll" and fehler):
        t = time.time()
        ordner = os.path.join(HIER, "proben", name, "browser")
        bericht = browser("pruefen", "--szene", szn.datei(name), "--nur", name, "--ordner", ordner, "--praefix", "text")
        zeiten["browser"] = time.time() - t
        fehler += bericht.get("fehler", []) + [l for l in bericht.get("logs", []) if l.startswith("pageerror")]
        if "--bilder" in flags:
            browser("bilder", "--nur", name, "--ordner", ordner, "--praefix", "p")
    zeiten["gesamt"] = time.time() - t_ges
    return modus, fehler, hinweise, gebaut, bericht, zeiten, h, (0 if not fehler else 2)


def szene_ausgeben(name, modus, fehler, hinweise, gebaut, bericht, zeiten, h):
    print("=" * 60)
    print(f"{name} [{modus}]: {'OK' if not fehler else 'FEHLER'}   Form-Hash {h}")
    if modus == "voll":
        for a in ANORDNUNGEN:
            b = gebaut.get(a)
            print(f"  {a:9s} glb {groesse(os.path.join(ASSETS, f'{name}-{a}.glb'))}" + (f", Kollisionen {len(b['kollisionen'])}, Einstellungen außerhalb {sum(v['punkte_ausserhalb'] for v in b['einstellungen'].values())}"
                  + (f", Schiene Länge {b['bahn']['laenge']}, Radius min {b['bahn']['radius_min']}, Krümmung Tore {b['bahn']['kruemmung_anfang']}/{b['bahn']['kruemmung_ende']}" if b.get("bahn") else "")
                  + (f", Kamera Tempo {b['kamera']['tempo_min']}…{b['kamera']['tempo_max']}, Ruck max {b['kamera']['ruck_max']}" if b.get("kamera") else "") if b else ""))
    if bericht:
        for a, v in bericht["ansichten"].items():
            for fn, fl in v["flaechen"].items():
                es = fl["bilder"].values()
                if not es: continue
                print(f"  Browser {a:9s} {fn:10s} min {min(e['min_em_px'] for e in es):5.1f} px, verdeckt {sum(e['verdeckt'] for e in es)}, außerhalb {sum(e['ausserhalb'] for e in es)}, Bilder {list(fl['bilder'])}")
    for hw in hinweise: print("  Hinweis:", hw)
    for f in fehler: print("  FEHLER:", f)
    print("  Zeiten: " + ", ".join(f"{k} {v:.1f} s" for k, v in zeiten.items()))


# ------------------------------------------------------------------ Übergang
def tore_hash(a, b):
    ma, mb = manifest_lesen(a), manifest_lesen(b)
    return hashlib.sha256(json.dumps([ma.get("tore"), mb.get("tore")], sort_keys=True).encode()).hexdigest()[:16]


def uebergang_name(a, b):
    return f"uebergang-{a}-{b}"


def uebergang_bauen(a, b, flags):
    name = uebergang_name(a, b)
    os.makedirs(TMP, exist_ok=True)
    fehler, hinweise, zeiten = [], [], {}
    for n in (a, b):
        if not manifest_lesen(n).get("tore"):
            return ["Szene " + n + " ist noch nicht gebaut (python neubau/bauen.py " + n + ")"], [], {}, {}, 3
    t = time.time()
    rc = blender_lauf("uebergang", [f"--von={a}", f"--nach={b}"], name, "--ohne-proben" not in flags)
    zeiten["blender"] = time.time() - t
    gebaut = {}
    for an in ANORDNUNGEN:
        if rc[an]:
            fehler.append(f"Blender {an}: Exitcode {rc[an]} (Log tmp/{name}_{an}_blender.log)"); continue
        bb = json.load(open(os.path.join(TMP, f"{name}_{an}_pruefung.json"), encoding="utf8"))
        gebaut[an] = bb
        if bb["kollisionen"]: fehler.append(f"{an}: Kollisionen {list(bb['kollisionen'])}")
        for k in bb.get("fehler", []): fehler.append(f"{an}: {k}")
        for k in bb.get("hinweise", []): hinweise.append(f"{an}: {k}")
        bahn_pruefen(bb, an, "Übergang", fehler, hinweise)
    if not fehler:
        json.dump({"tore_hash": tore_hash(a, b), "gebaut": time.strftime("%Y-%m-%d %H:%M:%S"), "von": a, "nach": b,
                   "glb": {an: os.path.getsize(os.path.join(ASSETS, f"{name}-{an}.glb")) for an in ANORDNUNGEN},
                   "ziel": {an: gebaut[an]["ziel"] for an in gebaut}},
                  open(manifest_pfad(name), "w", encoding="utf8"), indent=1)
    zeiten["gesamt"] = time.time() - t
    return fehler, hinweise, gebaut, zeiten, (0 if not fehler else 2)


def uebergang_ausgeben(a, b, fehler, hinweise, gebaut, zeiten):
    name = uebergang_name(a, b)
    print("=" * 60)
    print(f"{name}: {'OK' if not fehler else 'FEHLER'}")
    for an in ANORDNUNGEN:
        bb = gebaut.get(an)
        if bb:
            br = bb["bahn"]
            print(f"  {an:9s} glb {groesse(os.path.join(ASSETS, f'{name}-{an}.glb'))}, Schiene {br['laenge']} lang, Radius min {br['radius_min']}, Krümmung Tore {br['kruemmung_anfang']}/{br['kruemmung_ende']}, "
                  f"größte Krümmungsänderung {br['dkruemmung_max']}, Wendepunkte {br['wendepunkte']}, Füllblöcke {bb.get('fuellung', {}).get('anzahl')}, Bilder {bb.get('bilder')}")
    for hw in hinweise: print("  Hinweis:", hw)
    for f in fehler: print("  FEHLER:", f)
    print("  Zeiten: " + ", ".join(f"{k} {v:.1f} s" for k, v in zeiten.items()))


# ------------------------------------------------------------------ Seite
def folge_lesen():
    return json.load(open(os.path.join(szn.SZENEN, "folge.json"), encoding="utf8"))["szenen"]


def folge_schreiben(szenen):
    segs = []
    for i, n in enumerate(szenen):
        segs.append({"name": n, "art": "szene", "glb": {a: f"./assets/{n}-{a}.glb" for a in ANORDNUNGEN}, "daten": f"./assets/{n}.szene.js"})
        if i + 1 < len(szenen):
            u = uebergang_name(n, szenen[i + 1])
            segs.append({"name": u, "art": "uebergang", "glb": {a: f"./assets/{u}-{a}.glb" for a in ANORDNUNGEN}})
    text = "// erzeugt von neubau/bauen.py (Folge: neubau/szenen/folge.json) – nicht von Hand ändern\nexport default " + json.dumps({"segmente": segs}, indent=1) + ";\n"
    open(os.path.join(ASSETS, "folge.js"), "w", encoding="utf8", newline="\n").write(text)


def seite_bauen(flags):
    szenen = folge_lesen()
    alle_fehler, alle_hinweise = [], []
    for n in szenen:
        sz = szn.lade(n)
        nur_neu = "--nur-neu" in flags and manifest_lesen(n).get("form_hash") == szn.form_hash(sz)
        f2 = set(flags) | ({"--nur-text"} if nur_neu else set())
        modus, fehler, hinweise, gebaut, bericht, zeiten, h, rc = szene_bauen(n, f2)
        szene_ausgeben(n, modus, fehler, hinweise, gebaut, bericht, zeiten, h)
        alle_fehler += [f"{n}: {f}" for f in fehler]; alle_hinweise += hinweise
        if rc and rc != 2: return 3
    for a, b in zip(szenen, szenen[1:]):
        name = uebergang_name(a, b)
        m = manifest_lesen(name)
        if "--nur-neu" in flags and m.get("tore_hash") == tore_hash(a, b) and os.path.exists(os.path.join(ASSETS, f"{name}-breit.glb")):
            print(f"{name}: unverändert (Eingang/Ausgang gleich), nicht neu gebaut"); continue
        fehler, hinweise, gebaut, zeiten, rc = uebergang_bauen(a, b, flags)
        uebergang_ausgeben(a, b, fehler, hinweise, gebaut, zeiten)
        alle_fehler += [f"{name}: {f}" for f in fehler]
        if rc == 3: return 3
    if not alle_fehler:
        folge_schreiben(szenen)
        t = time.time()
        ordner = os.path.join(HIER, "proben", "seite")
        r = browser("naht", "--ordner", ordner)
        print("=" * 60)
        print("Naht (Messung im Browser an der gebauten Welt):")
        for an, v in r.get("ansichten", {}).items():
            for nm in v.get("nahte", []):
                sc = nm.get("schiene") or {}
                print(f"  {an:9s} {nm['naht']}: Kamera Ort {nm['kamera_ort_diff']:.5f}, Drehung {nm['kamera_dreh_diff_grad']:.4f} Grad, Verschiebung {nm['verschiebung_diff']:.5f}, Rollen {nm['rollen_grad'][0]:.3f}/{nm['rollen_grad'][1]:.3f}, Punkt {nm['punkt_diff']}")
                if sc:
                    print(f"            Schiene Punkt {sc['punkt_diff']:.5f}, Richtung {sc['richtung_diff_grad']:.4f} Grad, Krümmung links {sc['kruemmung_links']:.5f} rechts {sc['kruemmung_rechts']:.5f}")
                if nm["kamera_ort_diff"] > .01 or nm["kamera_dreh_diff_grad"] > .05: alle_fehler.append(f"{an}: Kamerasprung an der Naht {nm['naht']}")
                if sc and (sc["punkt_diff"] > .02 or abs(sc["richtung_diff_grad"]) > .3): alle_fehler.append(f"{an}: Schiene springt an der Naht {nm['naht']}")
        alle_fehler += r.get("fehler", [])
        print(f"  (Naht-Lauf {time.time() - t:.1f} s)")
    print("=" * 60)
    print("seite:", "OK" if not alle_fehler else "FEHLER")
    for hw in alle_hinweise: print("  Hinweis:", hw)
    for f in alle_fehler: print("  FEHLER:", f)
    return 0 if not alle_fehler else 2


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    flags = [x for x in sys.argv[1:] if x.startswith("--")]
    if not args:
        print(__doc__); return 1
    if args[0] == "seite":
        return seite_bauen(flags)
    if args[0] == "uebergang":
        if len(args) < 3:
            print("python neubau/bauen.py uebergang <von> <nach>"); return 1
        fehler, hinweise, gebaut, zeiten, rc = uebergang_bauen(args[1], args[2], flags)
        uebergang_ausgeben(args[1], args[2], fehler, hinweise, gebaut, zeiten)
        return rc
    if args[0] == "pruefen":
        args = args[1:]; flags = flags + ["pruefen"]
    name = args[0]
    modus, fehler, hinweise, gebaut, bericht, zeiten, h, rc = szene_bauen(name, flags)
    if rc == 3 and fehler == ["Blender nötig"]:
        return 3
    szene_ausgeben(name, modus, fehler, hinweise, gebaut, bericht, zeiten, h)
    return rc


if __name__ == "__main__":
    sys.exit(main())
