# Übergang zwischen zwei Szenen (DREHBUCH-NEUBAU, Abschnitt 4 „Übergänge“). Ein Generator, kein Handwerk:
#   Eingabe  Ausgang der Szene A (Fadenpunkt, Richtung, Kamerapose) und Eingang der Szene B (dasselbe), gelesen aus den Bau-Manifesten
#            neubau/seite/assets/<szene>.bau.json (dort schreibt bauen.py die gemessenen Tore jeder Szene hin)
#   Ausgabe  ein eigenes Stück (glb) im Bezugssystem von A: Schiene (G2-Bahn von Tor zu Tor), Punkt, Kamerafahrt, niedrige weiße Papierblöcke
#            als Füllung, ein Streifen Bogen zwischen den beiden Szenen. Dazu die starre Platzierung von B (Verschiebung, Drehung), die der
#            Abspieler anwendet, damit Eingang und Ausgang an den Nähten aufeinanderfallen.
# Immer dieselbe Regel (Konstanten unten): B steht LANGE vor dem Ausgang von A in Laufrichtung, um QUER nach rechts versetzt, mit derselben
# Laufrichtung (S-Kurve mit genau einem Wendepunkt, Krümmung 0 an beiden Toren). Die Kamera ist EINE durchgehende Fahrt (basis.kamerafahrt):
# Stützposen sind die Pose am Ausgang von A (mit dem Tempo, das A dort hat, entlang der Fadenrichtung), drei Posen in Mausperspektive hinter dem
# Punkt (Höhe über dem Papier, Ort auf der Schiene stetig vorwärts, Blick entlang der Schiene, leicht nach unten; der Punkt läuft aus der Ruhe an
# und überholt die Kamera, am Ende liegt er vor ihr) und die Pose am Eingang von B (mit dem Tempo, das B dort hat). Ort, Blick und Tempo laufen stetig durch beide Nähte, nie Rollen. Ändert sich eine Szene innen, bleibt der Übergang gültig,
# solange ihre Tore (samt Kameratempo) gleich bleiben.
#   blender.exe -b --factory-startup --python neubau/blender/uebergang.py -- --von=eroeffnung --nach=modernisierung [--hochkant] [--proben] [--export]
import importlib, json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import basis, szene
importlib.reload(basis)
from basis import PAL, material, karton, bewegung, smm
from mathutils import Vector, Euler
import bpy

REGEL = {"lange": 34.0, "quer": 6.0, "bilder": 340, "lag": 4.2, "voraus": 11.0, "ziel_hoehe": 0.35, "posen": [(.16, .09, 3.8), (.34, .23, 2.8), (.52, .43, 2.4), (.68, .66, 2.9), (.8, .81, 4.0)],
         "abstand_bahn": 1.7, "rand_szene": 3.0, "streifen_breite": 70.0, "streifen_ueberstand": 45.0, "frei_vor_b": 20.0, "frei_breite": 6.0, "frei_nach_a": 7.0, "hoehe_max": .55}

A = basis.args()
HOCH = "--hochkant" in sys.argv
ANORDNUNG = "hochkant" if HOCH else "breit"
arg = lambda k: next((x.split("=", 1)[1] for x in sys.argv if x.startswith(f"--{k}=")), None)
VON, NACH = arg("von"), arg("nach")
NAME = f"uebergang-{VON}-{NACH}"
ASSETS = os.path.join(basis.NEUBAU, "seite", "assets")
PROBEN = os.path.join(basis.NEUBAU, "proben", NAME, "blender")
os.makedirs(PROBEN, exist_ok=True)
man = lambda n: json.load(open(os.path.join(ASSETS, n + ".bau.json"), encoding="utf8"))["tore"][ANORDNUNG]
TA, TB = man(VON)["ausgang"], man(NACH)["eingang"]
HA, HB = man(VON)["huelle"], man(NACH)["huelle"]
SZA = szene.lade(VON)
KC = SZA["kamera"][ANORDNUNG]
VF = KC["vfov"]; ASP = KC["aspekt"][0] / KC["aspekt"][1]; BILD = tuple(KC["proben_aufloesung"])
F = REGEL["bilder"]

# ---------------------------------------------------------------- Geometrie der Platzierung von B
def drehen(v, grad):
    c, s = math.cos(math.radians(grad)), math.sin(math.radians(grad))
    return Vector((v.x * c - v.y * s, v.x * s + v.y * c))
pa = Vector(TA["faden"]["punkt"]); ha = TA["faden"]["richtung_grad"]
pb = Vector(TB["faden"]["punkt"]); hb = TB["faden"]["richtung_grad"]
d_a = basis.richtung_vektor(ha); r_a = Vector((d_a.y, -d_a.x))               # Laufrichtung, rechte Seite
Q = pa + d_a * REGEL["lange"] + r_a * REGEL["quer"]                           # Eingang von B in Koordinaten von A
THETA = hb - ha                                                                # Drehung (links herum, Grad), damit die Laufrichtung von B auf die von A fällt
T = Q - drehen(pb, THETA)
ZIEL = {"versatz": [round(T.x, 5), round(T.y, 5)], "drehung_grad": round(THETA, 5)}
von_b = lambda p: drehen(Vector(p) - T, -THETA)                               # Punkt in A-Koordinaten -> Koordinaten von B
in_b = lambda p: drehen(Vector(p), THETA) + T                                 # Punkt in B-Koordinaten -> A-Koordinaten

sc = basis.buehne(F, bogen=(-1, 1, -1, 1))
for n in ("Bogen", "Boden"):
    bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)

# ---------------------------------------------------------------- Streifen Bogen unter dem Korridor (liegt knapp unter den Bögen der Szenen: nichts flackert)
lang = (Q - pa).length
mitte = (pa + Q) / 2; dirn = (Q - pa).normalized()
ang = math.atan2(dirn.x, dirn.y)                                              # Laufrichtung (rechts herum von +y)
streifen = karton("Uebergang_Bogen", REGEL["streifen_breite"], lang + 2 * REGEL["streifen_ueberstand"], .002, mats={"alle": material("Papier", PAL["papier"])}, liegend=True, mitte_x=True)
start = mitte - dirn * (lang / 2 + REGEL["streifen_ueberstand"])
streifen.location = (start.x, start.y, -.0035); streifen.rotation_euler = (0, 0, -ang)

# ---------------------------------------------------------------- Schiene (G2) und Punkt
bahn, kap, laenge = basis.bahn_g2((tuple(pa), ha), (tuple(Q), ha), [], schritt=REGEL["lange"] * .3, n=900)
BERICHT = basis.bahn_bericht(bahn, kap, laenge)
print("BAHN", json.dumps(BERICHT))
rail = basis.schiene("Schiene", bahn)
s_punkt = lambda f: smm(f / F)                                                 # Ruhe an beiden Enden, wie die Szenen sie verlassen und betreten
pkt = basis.punkt("Punkt", bahn, laenge, s_punkt)

def pos(s):
    """Punkt der (nach beiden Seiten gerade verlängerten) Bahn bei Bogenlänge s."""
    n = len(bahn) - 1
    if s <= 0:
        return bahn[0] + (bahn[0] - bahn[1]).normalized() * (-s)
    if s >= laenge:
        return bahn[n] + (bahn[n] - bahn[n - 1]).normalized() * (s - laenge)
    u = s / laenge * n; i = min(n - 1, int(u))
    return bahn[i].lerp(bahn[i + 1], u - i)

# ---------------------------------------------------------------- Füllung: niedrige weiße Papierblöcke entlang der Schiene (ohne Text, ohne Rot)
rnd_state = [12345]
def rnd():
    rnd_state[0] = (rnd_state[0] * 1103515245 + 12345) & 0x7fffffff
    return rnd_state[0] / 0x7fffffff
def bahn_nah(p):
    """(Bogenlänge, seitlicher Abstand) des der Position p nächsten Schienenpunkts (grob, über die Stützpunkte)."""
    i = min(range(0, len(bahn), 3), key=lambda k: (bahn[k] - p).length)
    return i / (len(bahn) - 1) * laenge, (bahn[i] - p).length
def frei(p, r):
    """Kein Zusammenstoß mit den Szenen (Hüllrechtecke samt Rand), genug Abstand zur Schiene und ein freier Sichtkorridor: vor Szene B (der Titel am
    Eingang muss unverdeckt sein) und hinter dem Ausgang von A (der Abstieg der Kamera) steht nichts nahe der Schiene."""
    s_, lat = bahn_nah(p)
    if s_ > laenge - REGEL["frei_vor_b"] and lat < REGEL["frei_breite"] + r: return False
    if s_ < REGEL["frei_nach_a"] and lat < REGEL["frei_breite"] + r: return False
    m = REGEL["rand_szene"] + r
    if HA[0] - m < p.x < HA[1] + m and HA[2] - m < p.y < HA[3] + m: return False
    q = von_b(p)
    if HB[0] - m < q.x < HB[1] + m and HB[2] - m < q.y < HB[3] + m: return False
    return True
bloecke, kreise = [], []
mats = [material("Fuell1", "#fafcff"), material("Fuell2", "#eef2f9"), material("Fuell3", "#e2e8f2")]
for m_ in mats:   # weiß auch auf der Schattenseite: leichtes Eigenleuchten
    b_ = m_.node_tree.nodes["Principled BSDF"]; b_.inputs["Emission Color"].default_value = (.62, .68, .78, 1); b_.inputs["Emission Strength"].default_value = .35
kante = material("FuellKante", "#d3dbe8")
b_ = kante.node_tree.nodes["Principled BSDF"]; b_.inputs["Emission Color"].default_value = (.62, .68, .78, 1); b_.inputs["Emission Strength"].default_value = .45
versuche = 0
while len(bloecke) < 70 and versuche < 4000:
    versuche += 1
    s = rnd() * laenge; side = 1 if rnd() < .5 else -1
    u = REGEL["abstand_bahn"] + .9 + rnd() ** 1.4 * 10.5
    t = (pos(min(laenge, s + .05)) - pos(max(0, s - .05))).normalized(); nrm = Vector((-t.y, t.x))
    c = pos(s) + nrm * u * side
    w, dp, h = .8 + rnd() * 2.4, .8 + rnd() * 2.2, .16 + rnd() ** 1.5 * (REGEL["hoehe_max"] - .16)
    r = math.hypot(w, dp) / 2
    if u - r < REGEL["abstand_bahn"]: continue
    if not frei(c, r): continue
    if any((c - c2).length < r + r2 + .5 for c2, r2 in kreise): continue
    kreise.append((c, r))
    ob = karton(f"Fuell_{len(bloecke):02d}", w, dp, h, mats={"vorn": mats[int(rnd() * 3)], "rand": kante}, liegend=True, mitte_x=True)
    wink = math.atan2(t.x, t.y) + (rnd() - .5) * .35
    ob.rotation_euler = (0, 0, -wink)
    # Ursprung des liegenden Kartons: Mitte unten an der Vorderkante -> um die halbe Tiefe in Richtung des Blocks zurücksetzen
    ob.location = (c.x + math.sin(wink) * dp / 2 * -1, c.y - math.cos(wink) * dp / 2, 0)
    bloecke.append(ob)
print(f"FUELLUNG {len(bloecke)} Blöcke nach {versuche} Versuchen")

# ---------------------------------------------------------------- Kamera: eine durchgehende Fahrt durch Stützposen
cam = basis.kamera("Kamera_Handy" if HOCH else "Kamera_Desktop", VF)
kA, kB = TA["kamera"], TB["kamera"]
VA, VB = kA.get("tempo"), kB.get("tempo")
if not VA or not VB:
    raise SystemExit(f"Kameratempo der Anschlüsse fehlt (Ausgang {VON}: {VA}, Eingang {NACH}: {VB}); Szenendatei: eingang/ausgang.<anordnung>.kamera_tempo, dann die Szene neu bauen")
ob_ = drehen(Vector(kB["ort"][:2]), THETA) + T
def richtung_gier(v):
    return math.degrees(math.atan2(-v.x, v.y))
posen = [{"name": "Ausgang " + VON, "bild": 0, "ort": Vector(kA["ort"]), "neigung": kA["neigung"], "gier": kA["gier"], "verschiebung": kA["verschiebung"]}]
for u, anteil, hoehe in REGEL["posen"]:
    f = int(round(u * F)); s = anteil * laenge          # Ort der Kamera auf der Schiene (stetig vorwärts, kein Zurückfahren hinter den Punkt)
    c = pos(s); z = pos(s + REGEL["voraus"]); v = z - c
    posen.append({"name": f"Maus {int(u * 100)} %", "bild": f, "ort": Vector((c.x, c.y, hoehe)), "neigung": math.degrees(math.atan2(hoehe - REGEL["ziel_hoehe"], v.length)),
                  "gier": richtung_gier(v), "verschiebung": 0.0})
posen.append({"name": "Eingang " + NACH, "bild": F, "ort": Vector((ob_.x, ob_.y, kB["ort"][2])), "neigung": kB["neigung"], "gier": kB["gier"] + THETA, "verschiebung": kB["verschiebung"]})
fahrt = basis.kamerafahrt(cam, posen, F, ASP, ein=(ha, VA), aus=(ha, VB))
basis.backen(F)
KENN = basis.fahrt_kennwerte(fahrt)
print("FAHRT", json.dumps(KENN))
pz = fahrt["pose"]
kamera_zustand = lambda f: (pz[f]["loc"], pz[f]["neigung"], pz[f]["gier"], pz[f]["verschiebung"])
posA = (Vector(kA["ort"]), kA["neigung"], kA["gier"], kA["verschiebung"])
posB = (posen[-1]["ort"], posen[-1]["neigung"], posen[-1]["gier"], posen[-1]["verschiebung"])

# ---------------------------------------------------------------- Messung der Anschlüsse: Pose der Kamera an den Enden gegen die Posen der Szenen
fehler, hinweise = [], []
z0, z1 = kamera_zustand(0), kamera_zustand(F)
d0 = (z0[0] - posA[0]).length; d1 = (z1[0] - posB[0]).length
if d0 > 1e-4 or d1 > 1e-4: fehler.append(f"Kamera springt an den Enden ({d0:.5f}, {d1:.5f})")
# Tempo: nirgends nahe 0, am Anfang das Ausgangstempo von A, am Ende das Eingangstempo von B (Richtung entlang der Fadenrichtung)
if KENN["tempo_min"] < .004: fehler.append(f"Kameratempo fällt auf {KENN['tempo_min']}")
if abs(KENN["tempo_anfang"] - VA) > .2 * VA: fehler.append(f"Anfangstempo {KENN['tempo_anfang']} statt {VA}")
if abs(KENN["tempo_ende"] - VB) > .2 * VB: fehler.append(f"Endtempo {KENN['tempo_ende']} statt {VB}")
if KENN["ruck_ausreisser"] > 8.0: fehler.append(f"Ruck-Ausreißer: {KENN['ruck_max']} = {KENN['ruck_ausreisser']}-fach des 98. Perzentils")
mind_z = min(z["loc"].z for z in pz)
if mind_z < 1.0: hinweise.append(f"Kamera sinkt auf Höhe {mind_z:.2f} (Mausperspektive soll nicht zu tief liegen)")
# Mindestabstand der Kamera zur Hülle der Szenen nicht gemessen (nur Hinweis): Fahrt hinter dem Punkt liegt auf der Schiene
kol = basis.kollisionen(bloecke, 0, schritt=1)
pr = {"form_hash": szene.form_hash({"regel": REGEL, "a": TA, "b": TB}), "kollisionen": {f"{a} x {b}": {"bilder": [f for f, n in fs][:6]} for (a, b), fs in kol.items()},
      "fehler": fehler, "hinweise": hinweise, "bahn": BERICHT, "ziel": ZIEL, "bilder": F, "fuellung": {"anzahl": len(bloecke)},
      "kamera_ende_diff": [d0, d1], "kamera": {k: v for k, v in KENN.items()}}
print("PRUEFUNG", json.dumps(pr, ensure_ascii=False))
json.dump(pr, open(os.path.join(basis.NEUBAU, "tmp", f"{NAME}_{ANORDNUNG}_pruefung.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)

if A["proben"]:
    for f in A["frames"] or [0, 60, 110, 150, 190, 240, 300]:
        t1 = basis.probe(cam, f, os.path.join(PROBEN, f"{ANORDNUNG}_{f:03d}.png"), BILD[0], BILD[1], prozent=200 if HOCH else 100)
        print(f"PROBE {f}: {t1:.1f}s")

if A["export"]:
    extras = {"szene": NAME, "art": "uebergang", "frames": F, "fps": basis.FPS, "anordnung": ANORDNUNG, "kamera": {"name": cam.name, "vfov": VF, "aspekt": ASP},
              "licht": basis.LICHT, "pal": PAL, "verschiebung": json.loads(cam["neubau_verschiebung"]), "faden_s": [round(s_punkt(f) * laenge, 5) for f in range(F + 1)],
              "bahn": BERICHT, "uebergang": {"von": VON, "nach": NACH, "ziel": ZIEL, "regel": REGEL}}
    pruef = [o for o in bpy.data.objects if o.get("neubau_pruef")]
    out = os.path.join(ASSETS, f"{NAME}-{ANORDNUNG}.glb")
    n = basis.export_glb(out, extras, draco=False)
    print(f"EXPORT {out} {n / 1024:.0f} KB")
