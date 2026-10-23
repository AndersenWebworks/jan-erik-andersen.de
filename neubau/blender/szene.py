# Szenendatei lesen und die Form der Szene prüfen (ohne bpy, läuft im System-Python und in Blender).
# Die Szenendatei (neubau/szenen/<name>.json) ist die einzige Quelle für Inhalte. Was der Browser ohne Blender übernehmen kann
# (Text, Einblendzeit, Versatz und Drehung der Gegenstände, Prüfbilder), steht in BROWSER; alles andere ist „Form“ und braucht
# einen Blender-Bau. form_hash() bildet die Form ab: stimmt er nicht mit dem Hash des letzten Baus überein, braucht es Blender.
import copy, hashlib, json, os

HIER = os.path.dirname(os.path.abspath(__file__))
NEUBAU = os.path.dirname(HIER)
SZENEN = os.path.join(NEUBAU, "szenen")

# Pfade, die der Browser selbst auswertet (Platzhalter * = jeder Schlüssel dieser Ebene)
BROWSER = [
    "druckflaechen.*.elemente", "druckflaechen.*.einblenden", "druckflaechen.*.aufloesung", "druckflaechen.*.pruefen",
    "gegenstaende.*.versatz", "gegenstaende.*.drehung_z",
    "eingang", "ausgang", "pruefung",
]


def datei(name):
    return os.path.join(SZENEN, name + ".json")


def lade(name):
    with open(datei(name), encoding="utf8") as f:
        return json.load(f)


def _entfernen(d, pfad):
    teile = pfad.split(".")
    def rek(o, t):
        if not isinstance(o, dict):
            return
        k, rest = t[0], t[1:]
        ziele = list(o.keys()) if k == "*" else ([k] if k in o else [])
        for z in ziele:
            if rest:
                rek(o[z], rest)
            else:
                del o[z]
    rek(d, teile)


def form(d):
    """Der Teil der Szene, den nur Blender umsetzen kann."""
    f = copy.deepcopy(d)
    for p in BROWSER:
        _entfernen(f, p)
    return f


def form_hash(d):
    return hashlib.sha256(json.dumps(form(d), sort_keys=True, ensure_ascii=False).encode("utf8")).hexdigest()[:16]
