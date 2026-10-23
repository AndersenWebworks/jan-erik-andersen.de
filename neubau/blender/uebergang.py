# Übergang zwischen zwei Szenen (DREHBUCH-NEUBAU, Abschnitt 4 „Übergänge“). Ein Generator, kein Handwerk:
#   Eingabe  Ausgang der Szene A (Fadenpunkt, Richtung, Kamerapose) und Eingang der Szene B (dasselbe), gelesen aus den Bau-Manifesten
#            neubau/seite/assets/<szene>.bau.json (dort schreibt bauen.py die gemessenen Tore jeder Szene hin)
#   Ausgabe  ein eigenes Stück (glb) im Bezugssystem von A: Schiene (G2-Bahn von Tor zu Tor), Punkt, Kamerafahrt, niedrige weiße Papierblöcke
#            als Füllung, ein Streifen Bogen zwischen den beiden Szenen. Dazu die starre Platzierung von B (Verschiebung, Drehung), die der
#            Abspieler anwendet, damit Eingang und Ausgang an den Nähten aufeinanderfallen.
# Immer dieselbe Regel (Konstanten unten): B steht LANGE vor dem Ausgang von A in Laufrichtung, um QUER nach rechts versetzt, mit derselben
# Laufrichtung (S-Kurve mit genau einem Wendepunkt, Krümmung 0 an beiden Toren). Die Kamera folgt dem Punkt in Mausperspektive (knapp über
# dem Papier, LAG hinter dem Punkt, Blick entlang der Schiene), weicher Abstieg aus der Pose am Ausgang von A, weicher Aufstieg in die Pose am
# Eingang von B, durchgehend ohne Schnitt. Ändert sich eine Szene innen, bleibt der Übergang gültig, solange ihre Tore gleich bleiben.
#   blender.exe -b --factory-startup --python neubau/blender/uebergang.py -- --von=eroeffnung --nach=modernisierung [--hochkant] [--proben] [--export]
import importlib, json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import basis, szene
importlib.reload(basis)
from basis import PAL, material, karton, bewegung, smm
from mathutils import Vector, Euler
import bpy

REGEL = {"lange": 34.0, "quer": 6.0, "bilder": 300, "bilder_ab": 110, "bilder_auf": 110, "lag": 3.6, "voraus": 12.0, "hoehe": 0.55, "ziel_hoehe": 0.3,
         "abstand_bahn": 1.7, "rand_szene": 3.0, "streifen_breite": 70.0, "streifen_ueberstand": 45.0}

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
def frei(p, r):
    """Kein Zusammenstoß mit den Szenen (Hüllrechtecke samt Rand) und genug Abstand zur Schiene."""
    m = REGEL["rand_szene"] + r
    if HA[0] - m < p.x < HA[1] + m and HA[2] - m < p.y < HA[3] + m: return False
    q = von_b(p)
    if HB[0] - m < q.x < HB[1] + m and HB[2] - m < q.y < HB[3] + m: return False
    return True
bloecke, kreise = [], []
mats = [material("Fuell1", "#f3f6fb"), material("Fuell2", "#e8edf4"), material("Fuell3", "#dde4ee")]
for m_ in mats:   # weiß auch auf der Schattenseite: leichtes Eigenleuchten
    b_ = m_.node_tree.nodes["Principled BSDF"]; b_.inputs["Emission Color"].default_value = (.62, .68, .78, 1); b_.inputs["Emission Strength"].default_value = .35
kante = material("FuellKante", "#e6ebf3")
b_ = kante.node_tree.nodes["Principled BSDF"]; b_.inputs["Emission Color"].default_value = (.62, .68, .78, 1); b_.inputs["Emission Strength"].default_value = .45
versuche = 0
while len(bloecke) < 70 and versuche < 4000:
    versuche += 1
    s = rnd() * laenge; side = 1 if rnd() < .5 else -1
    u = REGEL["abstand_bahn"] + .9 + rnd() ** 1.4 * 10.5
    t = (pos(min(laenge, s + .05)) - pos(max(0, s - .05))).normalized(); nrm = Vector((-t.y, t.x))
    c = pos(s) + nrm * u * side
    w, dp, h = .8 + rnd() * 2.4, .8 + rnd() * 2.2, .16 + rnd() ** 1.5 * .62
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

# ---------------------------------------------------------------- Kamera: Abstieg aus der Pose am Ausgang von A, Fahrt hinter dem Punkt, Aufstieg in die Pose am Eingang von B
cam = basis.kamera("Kamera_Handy" if HOCH else "Kamera_Desktop", VF)
kA, kB = TA["kamera"], TB["kamera"]
posA = (Vector(kA["ort"]), kA["neigung"], kA["gier"], kA["verschiebung"])
ob_ = drehen(Vector(kB["ort"][:2]), THETA) + T
posB = (Vector((ob_.x, ob_.y, kB["ort"][2])), kB["neigung"], kB["gier"] + THETA, kB["verschiebung"])   # Gier wie die Drehung der Szene (links herum)
def wink_zu(a, b):
    return a + ((b - a + 180) % 360 - 180)
def mischen(p, q, k):
    return (p[0].lerp(q[0], k), p[1] + (q[1] - p[1]) * k, p[2] + ((q[2] - p[2] + 180) % 360 - 180) * k, p[3] + (q[3] - p[3]) * k)
def rig(f):
    s = s_punkt(f) * laenge
    c = pos(s - REGEL["lag"]); z = pos(s + REGEL["voraus"])
    v = z - c; gier = math.degrees(math.atan2(-v.x, v.y))
    neig = math.degrees(math.atan2(REGEL["hoehe"] - REGEL["ziel_hoehe"], v.length))
    return (Vector((c.x, c.y, REGEL["hoehe"])), neig, gier, 0.0)
def kamera_zustand(f):
    wi = smm(f / REGEL["bilder_ab"]); wo = smm((F - f) / REGEL["bilder_auf"])
    r = rig(f)
    # Gier der Pose B auf den Wert nahe der Fahrtrichtung bringen (kürzester Weg)
    pB = (posB[0], posB[1], wink_zu(r[2], posB[2]), posB[3])
    pA = (posA[0], posA[1], wink_zu(r[2], posA[2]), posA[3])
    p = mischen(pA, r, wi)
    return mischen(pB, p, wo)
def fn(f):
    o, n, g, v = kamera_zustand(f)
    return {"loc": o.copy(), "rot": basis.kamera_orientierung(n, g), "shift": v * ASP / 2}
bewegung(cam, fn)
cam["neubau_verschiebung"] = json.dumps([round(kamera_zustand(f)[3], 5) for f in range(F + 1)])
basis.backen(F)

# ---------------------------------------------------------------- Messung der Anschlüsse: Pose der Kamera an den Enden gegen die Posen der Szenen
fehler, hinweise = [], []
z0, z1 = kamera_zustand(0), kamera_zustand(F)
d0 = (z0[0] - posA[0]).length; d1 = (z1[0] - posB[0]).length
if d0 > 1e-4 or d1 > 1e-4: fehler.append(f"Kamera springt an den Enden ({d0:.5f}, {d1:.5f})")
# Mindestabstand der Kamera zur Hülle der Szenen nicht gemessen (nur Hinweis): Fahrt hinter dem Punkt liegt auf der Schiene
kol = basis.kollisionen(bloecke, 0, schritt=1)
pr = {"form_hash": szene.form_hash({"regel": REGEL, "a": TA, "b": TB}), "kollisionen": {f"{a} x {b}": {"bilder": [f for f, n in fs][:6]} for (a, b), fs in kol.items()},
      "fehler": fehler, "hinweise": hinweise, "bahn": BERICHT, "ziel": ZIEL, "bilder": F, "fuellung": {"anzahl": len(bloecke)},
      "kamera_ende_diff": [d0, d1]}
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
