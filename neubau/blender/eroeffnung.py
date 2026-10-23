# Szene 1 Eröffnung (DREHBUCH-NEUBAU, Abschnitt 3.1). Baut Form, Animation und beide Kameraspuren, prüft und exportiert.
# Inhalte kommen aus neubau/szenen/eroeffnung.json. Normalerweise ruft das neubau/bauen.py auf; einzeln:
#   blender.exe -b --factory-startup --python neubau/blender/eroeffnung.py -- [--hochkant] [--proben] [--export] [--frames=0,120]
#
# Ablauf (Bilder 0…670, Scrollweg gleichmäßig, EINE durchgehende Kamerafahrt, siehe basis.kamerafahrt):
#   0       Startbild: nur der Name (Papierlettern, Marke N4) steht auf dem Bogen, Kamera flach davor, keine Fläche im Bild.
#   8–40    Falzlinie unter den Lettern zeichnet sich, die Kamera hebt sich.
#   30–262  Konstruktionsphase (basis.Konstruktion): Schnitt- und Falzlinien (gestrichelt), Raster, Gerüst, Bleistiftspur, dann Hochklappen:
#           Schreibtisch (Platte hebt sich parallel, Beine schwenken nach unten), Rechner (Tower); der Abdruck im Bogen färbt sich.
#   252–312 Auf dem Bildschirmblatt zeichnet sich die Skizze der Website, das Blatt (Fuß, Hals, Schirm) steht auf; die Seite schaltet sich ein.
#   296–358 Leben auf dem Tisch: Tablett (Deko), Tastatur, Maus, Tasse, Becher, Pflanze, Lampe; das Kabel zeichnet sich zum Rechner.
#   412–576 Mockup: Kopf der Seite (Ortszeile, Kernsatz) und danach die drei Sätze erscheinen nacheinander als Abschnitte auf dem Monitor
#           (Hochkant: auf dem Smartphone, das flach auf dem Tisch liegt). Die Kamera fährt im Fluss heran, in Zeitlupe über die Lesestelle.
#   576–670 Weiterfahrt zum Rechner; der Punkt kommt am Statuspunkt an (Ausgang der Szene), die Kamera bewegt sich dabei mit dem Tempo des
#           Anschlusses entlang der Fadenrichtung.
import importlib, json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import basis, szene
importlib.reload(basis)
from basis import PAL, KARTON as T, SPALT as G, material, karton, prisma, leer, anhaengen, klappe, bewegung, fenster, smm, sm, zylinder, faltpanel, gefaess, lettern
from mathutils import Vector, Euler, Matrix
import bpy

A = basis.args()
HOCH = "--hochkant" in sys.argv
ANORDNUNG = "hochkant" if HOCH else "breit"
SZ = szene.lade("eroeffnung")
FORM_HASH = szene.form_hash(SZ)
GEG, Z = SZ["gegenstaende"], SZ["zeiten"]
F_END = SZ["bilder"]
NEU = basis.NEUBAU
PROBEN = os.path.join(NEU, "proben", "eroeffnung", "blender")
os.makedirs(PROBEN, exist_ok=True)
SCHRIFTEN = os.path.join(basis.HIER, "schriften")


def ov(v):
    """Wert je Anordnung: {"breit": a, "hochkant": b} oder einfacher Wert."""
    return v[ANORDNUNG] if isinstance(v, dict) and ("breit" in v or "hochkant" in v) else v


def form(g):
    return {k: ov(v) for k, v in GEG[g]["form"].items()}


def lage(g):
    return GEG[g]["lage"][ANORDNUNG]


sc = basis.buehne(F_END, bogen=tuple(SZ["bogen"]))

# ---------------------------------------------------------------- Farben
INK = PAL["tinte"]
def ink(a):
    c = [int(INK[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02x%02x%02x" % tuple(round(255 - (255 - v) * a) for v in c)
C = {"platte": "#c4cddb", "bein": "#a7b2c3", "kante": "#7c879e", "gehaeuse": "#b0bacb", "front": "#c6cedb", "metall": "#a0abbd", "fuss": "#b0bacb",
     "grau": "#96a1b3", "hell": "#e4e9f1"}
M = {k: material("E_" + k, v) for k, v in C.items()}
M["kante"] = material("Kante", C["kante"])
M["tinte"] = material("Tinte", PAL["tinte"], rau=.7)
M["rot"] = material("Rot", PAL["rot"], rau=.6)
M["boden"] = material("E_boden", PAL["grau1"])
M["papier"] = material("Papier", PAL["papier"])


def druck_bild(name, w, h, px, bg, cmds):
    return basis.druck([{"name": name, "w": w, "h": h, "px": px, "bg": bg, "cmds": cmds}])[0]["out"]


def platzhalter(name):
    fl = SZ["druckflaechen"][name]
    return basis.druck([{"name": "platzhalter_" + name, "w": 1, "h": 1, "px": 4, "bg": PAL.get(fl["grund"], fl["grund"]), "cmds": []}])[0]["out"]


def fl_mat(name):
    """Material einer leeren Druckfläche. Überlagerungen (transparent) sind in den Blender-Proben unsichtbar; der Browser druckt sie."""
    fl = SZ["druckflaechen"][name]
    return material("Druck_" + name, PAL.get(fl["grund"], fl["grund"]), bild=platzhalter(name), rau=.9, einblenden=tuple(fl["einblenden"]) if fl.get("einblenden") else None,
                    transparent=bool(fl.get("transparent")))


def gebaut(name):
    """Druckfläche gehört zu dieser Anordnung (Schlüssel "nur" der Szenendatei)."""
    n = SZ["druckflaechen"][name].get("nur")
    return n is None or n == ANORDNUNG


# ================================================================ Marke N4: Papierlettern auf dem Bogen (Pop-up: an der Falzlinie angeklebt)
MK = SZ["marke"]; MKL = MK["lage"][ANORDNUNG]
FONTS = {"aufrecht": os.path.join(SCHRIFTEN, "NewsreaderMarke.ttf"), "kursiv": os.path.join(SCHRIFTEN, "NewsreaderMarkeKursiv.ttf")}
ref, (rx0, rx1, rz0, rz1) = lettern("Marke_ref", MK["text"], FONTS, 1.0, M["tinte"], MK["dicke"], MK["kursiv_ab"])
bpy.data.objects.remove(ref, do_unlink=True)
DOT_R = .085                                   # Radius des Schlusspunkts in em (Bestand wortmarke.js)
DOT_GAP = .02                                  # Abstand zum letzten Buchstaben in em
ges = (rx1 - rx0) + DOT_GAP + 2 * DOT_R
EM = ov(MK["breite"]) / ges                    # Schriftgröße so, dass Name samt Punkt die Zielbreite hat
name_ob, (nx0, nx1, nz0, nz1) = lettern("Marke", MK["text"], FONTS, EM, M["tinte"], MK["dicke"], MK["kursiv_ab"])
ges_w = (nx1 - nx0) + (DOT_GAP + 2 * DOT_R) * EM
NAME_X = MKL["x"] - ges_w / 2 - nx0            # linker Nullpunkt des Textes in Weltkoordinaten
NAME_Y = MKL["y"]                              # Vorderseite der Lettern
NAME_Z = G - nz0                               # tiefster Punkt der Rundungen knapp über dem Bogen
name_ob.location = (NAME_X, NAME_Y, NAME_Z)
dot_ob = zylinder("Marke_Punkt", DOT_R * EM, MK["dicke"], 48, M["rot"])
dot_ob.rotation_euler = (-math.pi / 2, 0, 0)
dot_ob.location = (NAME_X + nx1 + DOT_GAP * EM + DOT_R * EM, NAME_Y, NAME_Z + nz0 + DOT_R * EM)
bpy.context.view_layer.update()

# ================================================================ Schreibtisch (Parallelfalz aus Platte und zwei Beinen)
DF = form("schreibtisch"); DL_ = lage("schreibtisch")
DW, DD, DH, DP, DB = DF["breite"], DF["tiefe"], DF["hoehe"], DF["platte"], DF["bein"]
DX, DY = DL_["x"], DL_["y"]
Z_TISCH = tuple(Z["tisch"])
plate = karton("D_Platte", DW, DD, DP, mats={"vorn": M["platte"], "hinten": M["bein"], "rand": M["kante"]}, mitte_x=True, liegend=True)
plate.location = (DX, DY, DH)
LG = DH - G                                      # Beinlänge: zwischen Beinoberkante und Platte bleibt der Spalt G (nichts berührt sich in der Ruhelage)
def bein(name, x_hinge, rot):
    b = karton(name, DD - 2 * G, LG, DB, mats={"vorn": M["bein"], "hinten": M["bein"], "rand": M["kante"]}, mitte_x=True)
    b.rotation_euler = (0, 0, rot); b.location = (x_hinge, DY + DD / 2, 0)
    return b
beinL = bein("D_BeinL", DX - DW / 2, -math.pi / 2)
beinR = bein("D_BeinR", DX + DW / 2, math.pi / 2)
abdruck_t = karton("D_Abdruck", DW - 2 * G, DD - 2 * G, .002, mats={"alle": M["boden"]}, mitte_x=True, liegend=True)
abdruck_t.location = (DX, DY + G, 0)
tisch_wurzel = leer("Tisch_Wurzel", (0, 0, 0))
sch_bl = klappe("Sch_BeinL", (DX - DW / 2, DY + DD / 2, LG), "y", 90, Z_TISCH, None, [beinL])
sch_br = klappe("Sch_BeinR", (DX + DW / 2, DY + DD / 2, LG), "y", -90, Z_TISCH, None, [beinR])
anhaengen(plate, tisch_wurzel); anhaengen(sch_bl, tisch_wurzel); anhaengen(sch_br, tisch_wurzel)
def tisch_hoehe(f):
    a = math.radians(90) * fenster(f, *Z_TISCH)        # Winkel der Beine gegen den Bogen: Unterkante der Platte = DH sin a + DB cos a
    return LG * math.sin(a) + DB * math.cos(a) + G - DH
bewegung(tisch_wurzel, lambda f: {"loc": Vector((0, 0, tisch_hoehe(f)))})
Z_TOP = DH + DP                                 # Oberseite der Platte in der Bauform (Weltkoordinaten)

def auf_platte(g):
    L = lage(g); return DX + L["x"], DY + L["y"]

# ---------------------------------------------------------------- Bildschirm auf der Platte (Fuß, Hals, Blatt mit Skizze -> Bildschirm)
MF = form("monitor"); ML = lage("monitor")
XM, Y_HALS = DX + ML["x"], DY + ML["y_hals"]
FB, FT, FD = MF["fuss"]; NW, NH, NT = MF["hals"]; SW_, SH_, ST = MF["schirm"]
BZ, BZU, Z_SCHIRM = MF["rand_oben"], MF["kinn"], MF["z_schirm"]
NDW, NDH = SW_ - 2 * BZ, SH_ - BZ - BZU
fuss = karton("M_Fuss", FB, FT, FD, mats={"alle": M["metall"], "rand": M["kante"]}, liegend=True)
fuss.location = (XM - FB / 2, Y_HALS - NT - G - FT, Z_TOP + G)
hals = karton("M_Hals", NW, NH, NT, mats={"alle": M["metall"], "rand": M["kante"]})
hals.location = (XM - NW / 2, Y_HALS - NT, Z_TOP + G)
# Blender druckt nur Rahmen und ausgeschaltete Anzeige; die Seite (Mockup) druckt der Browser aus der Szenendatei als Überlagerung
scr_cmds = [{"rect": [0, 0, SW_, SH_], "fill": "#394152", "r": .04}, {"rect": [BZ, BZ, NDW, NDH], "fill": "#121824", "r": .01},
            {"circle": [SW_ / 2, SH_ - BZU / 2, .02], "fill": "#5b6578"}]
mat_scr = material("M_Schirm", PAL["flaeche"], bild=druck_bild("monitor_front", SW_, SH_, 360, PAL["flaeche"], scr_cmds), rau=.45)
schirm = karton("M_Schirm", SW_, SH_, ST, mats={"vorn": mat_scr, "hinten": M["metall"], "rand": M["kante"]})
schirm.location = (XM - SW_ / 2, Y_HALS - NT - ST - G, Z_TOP + G + Z_SCHIRM)
Z_MON = tuple(Z["monitor"])
sch_mon = klappe("Sch_Monitor", (0, Y_HALS, Z_TOP + G), "x", -90, Z_MON, None, [hals, schirm])
anhaengen(fuss, tisch_wurzel); anhaengen(sch_mon, tisch_wurzel)

# ---------------------------------------------------------------- Smartphone: liegt flach auf dem Tisch (trägt am Handy die mobile Fassung der Seite)
HF = form("handy")
HW_, HL_, HT_, HR, HO, HU = HF["breite"], HF["laenge"], HF["dicke"], HF["rand"], HF["oben"], HF["unten"]
HDW, HDH = HW_ - 2 * HR, HL_ - HO - HU
hx, hy = auf_platte("handy")
hand_cmds = [{"rect": [0, 0, HW_, HL_], "fill": "#394152", "r": .13}, {"rect": [HR, HO, HDW, HDH], "fill": "#121824", "r": .05},
             {"rect": [HW_ / 2 - .11, HO / 2 - .013, .22, .026], "fill": "#0b0f17", "r": .013}, {"circle": [HW_ / 2 + .16, HO / 2, .016], "fill": "#0b0f17"}]
m_hand = material("H_Handy", PAL["flaeche"], bild=druck_bild("handy_front", HW_, HL_, 300, "#394152", hand_cmds), rau=.45)
handy = karton("H_Handy", HW_, HL_, HT_, mats={"vorn": m_hand, "hinten": M["grau"], "rand": M["kante"]}, liegend=True, mitte_x=True)
handy.location = (hx, hy, Z_TOP + G)

# ---------------------------------------------------------------- Dinge auf dem Tisch
# Tablett (Deko, ohne Text) mit Stift: liegt von Anfang an auf der Platte
TF = form("tablett"); tx, ty = auf_platte("tablett")
tablett_cmds = [{"rect": [.08, .08, TF["breite"] - .16, TF["tiefe"] - .16], "fill": "#cfd5df", "stroke": ink(.35), "lw": .008, "r": .05},
                {"rect": [.28, .2, TF["breite"] - .86, TF["tiefe"] - .4], "fill": "#eef1f6", "stroke": ink(.5), "lw": .01, "r": .03}]
for i in range(4):
    tablett_cmds.append({"circle": [TF["breite"] - .32, .3 + i * .22, .04], "fill": "#e4e8ef", "stroke": ink(.45), "lw": .006})
m_tab = material("E_tablett", C["grau"], bild=druck_bild("tablett", TF["breite"], TF["tiefe"], 220, C["grau"], tablett_cmds))
tablett = karton("E_Tablett", TF["breite"], TF["tiefe"], TF["dicke"], mats={"vorn": m_tab, "hinten": M["grau"], "rand": M["kante"]}, liegend=True, mitte_x=True)
tablett.location = (tx, ty, Z_TOP + G)
stift = karton("E_Stift", .05, .95, .045, mats={"alle": M["tinte"]}, liegend=True, mitte_x=True)
stift.rotation_euler = (0, 0, math.radians(-24)); stift.location = (tx + .28, ty + .2, Z_TOP + G + TF["dicke"] + G)
# Tastatur und Maus: flache Papierkörper mit Druck
KF = form("tastatur"); kx, ky = auf_platte("tastatur")
key_cmds = [{"rect": [.04, .04, KF["breite"] - .08, KF["tiefe"] - .08], "fill": "#dde2ea", "stroke": ink(.35), "lw": .008, "r": .04}]
rows = [(14, .0), (14, .0), (13, .08), (11, .15)]
for r, (n, off) in enumerate(rows):
    kw = (KF["breite"] - .3) / 14
    for i in range(n):
        key_cmds.append({"rect": [.15 + off + i * kw, .1 + r * .14, kw - .025, .1], "fill": "#f4f6fa", "stroke": ink(.3), "lw": .005, "r": .015})
m_key = material("E_tastatur", C["hell"], bild=druck_bild("tastatur", KF["breite"], KF["tiefe"], 200, C["hell"], key_cmds))
tastatur = karton("E_Tastatur", KF["breite"], KF["tiefe"], KF["dicke"], mats={"vorn": m_key, "hinten": M["grau"], "rand": M["kante"]}, liegend=True, mitte_x=True)
tastatur.location = (kx, ky, Z_TOP + G)
MsF = form("maus"); mx_, my_ = auf_platte("maus")
maus_cmds = [{"rect": [.03, .03, MsF["breite"] - .06, MsF["tiefe"] - .06], "fill": "#e6eaf1", "stroke": ink(.4), "lw": .008, "r": .12},
             {"line": [MsF["breite"] / 2, .05, MsF["breite"] / 2, .32], "stroke": ink(.4), "lw": .007}, {"line": [.04, .32, MsF["breite"] - .04, .32], "stroke": ink(.4), "lw": .007}]
m_maus = material("E_maus", C["hell"], bild=druck_bild("maus", MsF["breite"], MsF["tiefe"], 240, C["hell"], maus_cmds))
maus = karton("E_Maus", MsF["breite"], MsF["tiefe"], MsF["dicke"], mats={"vorn": m_maus, "hinten": M["grau"], "rand": M["kante"]}, liegend=True, mitte_x=True)
maus.location = (mx_, my_, Z_TOP + G)
for o in (tablett, stift, tastatur, maus, handy):
    anhaengen(o, tisch_wurzel)

# Tasse, Becher (mit Stiften), Pflanze: Papiernetze, die sich aufstellen
ZD = Z["dinge"]; Tt = .016
def netz_auf_platte(name, g, mat_aussen, mat_boden, auf_wand, versatz=2):
    F = form(g); x, y = auf_platte(g)
    boden, wande = gefaess(name, (x, y), Z_TOP + G, F["apothem"], F["hoehe"], F["ecken"], Tt, mat_aussen, mat_boden, auf_wand, versatz=versatz)
    return F, x, y, boden, wande
m_innen = material("E_innen", "#d9dee7")
m_kaffee = material("E_kaffee", "#7c8696", rau=.5)
F_t, tx_, ty_, tasse_boden, tasse_w = netz_auf_platte("Tasse", "tasse", M["hell"], m_kaffee, ZD["gefaesse"], ZD["gefaess_versatz"])
F_b, bx_, by_, becher_boden, becher_w = netz_auf_platte("Becher", "becher", M["grau"], m_innen, (ZD["gefaesse"][0] + 6, ZD["gefaesse"][1] + 6), ZD["gefaess_versatz"])
F_p, px_, py_, topf_boden, topf_w = netz_auf_platte("Topf", "pflanze", M["fuss"], m_innen, (ZD["gefaesse"][0] + 26, ZD["gefaesse"][1] + 20), ZD["gefaess_versatz"])
# Stifte im Becher: stehen vor den Wänden auf (die Wände schließen sich danach um sie)
for i, (az, lg, farbe) in enumerate(((20, .78, M["tinte"]), (140, .66, M["grau"]), (265, .86, M["tinte"]))):
    u = basis.richtung_vektor(az); r0 = .1
    p, g_, r_ = faltpanel(f"Stift{i}", (bx_ + u.x * r0, by_ + u.y * r0, Z_TOP + G + .02), az, .05, lg, .04, {"alle": farbe}, (ZD["gefaesse"][0] - 4 + i, ZD["gefaesse"][0] + 8 + i))
# Blätter der Pflanze: stehen zuerst auf, der Topf schließt sich danach um sie
nb = F_p["blaetter"]
for i in range(nb):
    az = 360 * i / nb + 12
    u = basis.richtung_vektor(az); r0 = .1
    bl = prisma(f"Blatt{i}", [(0, 0), (.08, .26), (0, F_p["blatt_hoehe"]), (-.08, .26)], "y", .014, M["hell"] if i % 2 else M["grau"])
    psi = math.radians(180 - az)
    rah = leer(f"Blatt{i}_rahmen", Vector((px_ + u.x * r0, py_ + u.y * r0, Z_TOP + G + .02)))
    rah.rotation_euler = (0, 0, psi)
    gel = klappe(f"Blatt{i}_gelenk", (0, 0, 0), "x", 70, (ZD["blaetter"][0] + 2 * i, ZD["blaetter"][1] + 2 * i), None, [], eltern=rah)
    bl.parent = gel; bl.matrix_parent_inverse = Matrix.Identity(4); bl.location = (0, 0, 0); bl.rotation_euler = (math.radians(20), 0, 0)
# Lampe: Fuß (flache Scheibe) liegt auf der Platte; Arm mit Kopf stellen sich vom Fuß aus nach oben auf
LF = form("lampe"); lx, ly = auf_platte("lampe")
FU_H = .014
lampe_fuss = zylinder("L_Fuss", LF["fuss_radius"], FU_H, 8, M["fuss"], ort=(lx, ly, Z_TOP + G))
Z_ARM = Z_TOP + G + FU_H + G
ARM_Y = ly - LF["fuss_radius"] * .45                       # Vorderfläche des Arms
lampe_arm = karton("L_Arm", .09, LF["arm_hoehe"], .03, mats={"alle": M["grau"], "rand": M["kante"]}, mitte_x=True)
lampe_arm.location = (lx, ARM_Y, Z_ARM)
kw_, kh_, kd_ = LF["kopf"]
lampe_kopf = prisma("L_Kopf", [(-kw_ / 2, 0), (kw_ / 2, 0), (kw_ * .2, kh_), (-kw_ * .2, kh_)], "y", .03, M["hell"], ursprung=(lx, ARM_Y + .03 + G, Z_ARM + LF["arm_hoehe"] - kh_ * .55))
sch_lampe = klappe("Sch_Lampe", (lx, ARM_Y, Z_ARM), "x", 90, ZD["lampe"], None, [lampe_arm, lampe_kopf])
anhaengen(lampe_fuss, tisch_wurzel)
# alles, was auf der Platte steht, hängt an der Tischwurzel (bewegt sich mit der Platte)
for o in [tasse_boden, becher_boden, topf_boden]:
    anhaengen(o, tisch_wurzel)
for o in bpy.data.objects:
    if o.type == "EMPTY" and o.parent is None and any(o.name.startswith(p) for p in ("Tasse_w", "Becher_w", "Topf_w", "Stift", "Blatt", "Sch_Lampe")):
        anhaengen(o, tisch_wurzel)

# ================================================================ Rechner (Tower): Netz aus Boden, vier Wänden und Deckel
RF = form("rechner"); RL = lage("rechner")
RW, RD, RHH = RF["breite"], RF["tiefe"], RF["hoehe"]
RX, RY = RL["x"], RL["y_vorn"]
X0, X1 = RX - RW / 2, RX + RW / 2
FWR = RW + 2 * T
ZR = {k: tuple(v) for k, v in Z["rechner"].items()}
def tower_front_cmds():
    Hh = RHH - G; cmds = [{"rect": [.05, .05, FWR - .1, Hh - .1], "fill": "#cfd6e0", "stroke": ink(.45), "lw": .01, "r": .03}]
    cmds += [{"rect": [.14, .12, FWR - .28, .15], "fill": "#bcc4d0", "stroke": ink(.5), "lw": .008, "r": .015}, {"line": [.24, .195, FWR - .5, .195], "stroke": ink(.55), "lw": .012}]
    cmds += [{"rect": [.14, .38, .42, .07], "fill": "#c8cfda", "stroke": ink(.42), "lw": .008, "r": .012}]
    ly_ = Hh - RF["led"][1]
    cmds += [{"circle": [T + RF["led"][0], ly_, .085], "fill": "#e3e7ee", "stroke": ink(.4), "lw": .01}]          # Fassung des Statuspunkts
    bx = FWR - .38
    cmds += [{"circle": [bx, ly_, .09], "fill": "#e3e7ee", "stroke": ink(.62), "lw": .012}, {"circle": [bx, ly_, .045], "stroke": ink(.62), "lw": .01}]
    for r in range(11):
        yy = .75 + r * .08
        for c_ in range(4):
            xx = .18 + (.1 if r % 2 else 0) + c_ * .2
            if xx + .12 < FWR - .14: cmds.append({"line": [xx, yy, xx + .12, yy], "stroke": ink(.34), "lw": .026})
    return cmds
m_tfront = material("T_Front", C["front"], bild=druck_bild("tower_front", FWR, RHH - G, 280, C["front"], tower_front_cmds()))
boden_r = karton("T_Boden", RW - 2 * G, RD - 2 * G, .002, mats={"alle": M["boden"]}, liegend=True)
boden_r.location = (X0 + G, RY + G, 0)
tfront = karton("T_Front", FWR, RHH - G, T, mats={"vorn": m_tfront, "hinten": M["front"], "rand": M["kante"]}, uv_hinten=(False, True))
tfront.location = (X0 - T, RY - T - G, 0)
trueck = karton("T_Rueck", FWR, RHH - G, T, mats={"alle": M["gehaeuse"], "rand": M["kante"]})
trueck.location = (X0 - T, RY + RD + G, 0)
def seite(name, x_hinge, rot):
    s = karton(name, RD - 2 * G, RHH - G, T, mats={"alle": M["gehaeuse"], "rand": M["kante"]}, mitte_x=True)
    s.rotation_euler = (0, 0, rot); s.location = (x_hinge, RY + RD / 2, 0)
    return s
tlinks = seite("T_Links", X0 - T - G, -math.pi / 2)
trechts = seite("T_Rechts", X1 + T + G, math.pi / 2)
tdeckel = karton("T_Deckel", FWR, RD + 2 * T, T, mats={"vorn": M["gehaeuse"], "hinten": M["gehaeuse"], "rand": M["kante"]}, liegend=True)
tdeckel.location = (X0 - T, RY - T, RHH + G)
bpy.context.view_layer.update()
sch_tf = klappe("Sch_TFront", (0, RY - T - G, 0), "x", 90, ZR["front"], None, [tfront])
y_h = RY + RD + T + G
sch_tr = klappe("Sch_TRueck", (0, y_h, 0), "x", -90, ZR["rueck"], None, [trueck])
A0 = tdeckel.matrix_world @ Vector((0, RD + 2 * T, 0)); B0 = tdeckel.matrix_world @ Vector((0, 0, 0))
L_D = RD + 2 * T; H_R = RHH - G
A1 = Vector((0, y_h + H_R + 2 * G, T)); B1 = Vector((0, y_h + H_R + 2 * G + L_D, T))
zur = lambda p: Vector((0, y_h - p.z, p.y - y_h))
A1r, B1r = zur(A1), zur(B1)
(py_d, pz_d), ang_d = basis.drehpunkt_2d((A0.y, A0.z), (B0.y, B0.z), (A1r.y, A1r.z), (B1r.y, B1r.z))
sch_td = klappe("Sch_TDeckel", (0, py_d, pz_d), "x", ang_d, ZR["deckel"], None, [tdeckel])
anhaengen(sch_td, sch_tr)
sch_tl = klappe("Sch_TLinks", (X0 - T - G, 0, 0), "y", -90, ZR["seiten"], None, [tlinks])
sch_trr = klappe("Sch_TRechts", (X1 + T + G, 0, 0), "y", 90, ZR["seiten"], None, [trechts])
# Statuspunkt: roter Punkt in der Fassung auf der Front, bewegt sich mit der Front
led = zylinder("T_Led", .06, .012, 32, M["rot"])
led.rotation_euler = (-math.pi / 2, 0, 0)
led.location = (X0 + RF["led"][0], RY - T - G - .0008 - .012, RF["led"][1])     # dicht vor der Frontfläche, in der gedruckten Fassung
bpy.context.view_layer.update()
anhaengen(led, sch_tf)

# ================================================================ Druckflächen (leer; der Browser druckt Mockup und Sätze darauf)
DRUCK = {}
for name, fl in SZ["druckflaechen"].items():
    if not gebaut(name):
        continue
    ab = .0012 + .0009 * fl.get("ebene", 0)
    if fl["traeger"] == "M_Schirm":
        DRUCK[name] = basis.druckflaeche(name, schirm, "vorn", NDW, NDH, fl_mat(name), ST, abstand=ab, x0=BZ, z0=BZU)
    elif fl["traeger"] == "H_Handy":
        DRUCK[name] = basis.druckflaeche_oben(name, handy, HDW, HDH, fl_mat(name), HT_ + ab, x0=-HW_ / 2 + HR, y0=HU)
    else:
        raise ValueError("Träger unbekannt: " + fl["traeger"])
TRAGER = "h_seite" if HOCH else "m_seite"     # Fläche, auf die die Kamera zum Lesen fährt

# ================================================================ Schiene und Punkt
FD_ = SZ["faden"]
TOR_EIN = (tuple(SZ["eingang"][ANORDNUNG]["faden"]["punkt"]), SZ["eingang"][ANORDNUNG]["faden"]["richtung_grad"])
TOR_AUS = (tuple(SZ["ausgang"][ANORDNUNG]["faden"]["punkt"]), SZ["ausgang"][ANORDNUNG]["faden"]["richtung_grad"])
bahn, kap, laenge = basis.bahn_g2(TOR_EIN, TOR_AUS, FD_["kontrolle"][ANORDNUNG], schritt=ov(FD_["tor_schritt"]))
BERICHT_BAHN = basis.bahn_bericht(bahn, kap, laenge)
print("BAHN", json.dumps(BERICHT_BAHN))
rail = basis.schiene("Schiene", bahn, breite=FD_["breite"])
pruef_faden = basis.faden_pruefkoerper(bahn, FD_["breite"] + .08)
FP = FD_["punkt"]
S_TAB = []
acc = 0.0
for f in range(0, F_END + 1):
    v = 0.0
    if FP["start_bild"] <= f <= FP["ende_bild"]:
        v = smm((f - FP["start_bild"]) / FP["rampe"]) * smm((FP["ende_bild"] - f) / FP["rampe"])
        br = 0.0
        for a_, b_ in FP["lesen"]:
            br = max(br, smm((f - (a_ - 12)) / 12) * smm(((b_ + 12) - f) / 12))
        v *= 1 - FP["bremse"] * br
    acc += v
    S_TAB.append(acc)
S_TAB = [s / acc for s in S_TAB]
s_punkt = lambda f: S_TAB[min(F_END, max(0, int(round(f))))]
pkt = basis.punkt("Punkt", bahn, laenge, s_punkt, erscheint=(FP["start_bild"] - 10, FP["start_bild"] + 8))
def faden_zustand(f):
    n = len(bahn) - 1; sv = min(1, max(0, s_punkt(f))) * n
    i = min(n - 1, int(sv)); p = bahn[i].lerp(bahn[i + 1], sv - i); d = bahn[i + 1] - bahn[i]
    return {"punkt": [round(p.x, 4), round(p.y, 4)], "richtung_grad": round(math.degrees(math.atan2(d.x, d.y)), 2)}

# ---------------------------------------------------------------- Bewegung backen
basis.backen(F_END)
bpy.context.view_layer.update()

# ================================================================ Konstruktionsphase (gemeinsamer Baustein)
bau = basis.Konstruktion("Bau", skala=1.7 if HOCH else 1.0)
# Skizze der Seite (Haarlinien): auf dem Bildschirmblatt (Desktop) bzw. auf dem Smartphone (Hochkant), gezeichnet nach der Szenendatei
sk0, sk1 = Z["skizze"]
SK = SZ["skizze"]["handy" if HOCH else "monitor"]
def skizze_strecken(liste):
    for s in liste:
        if s[0] == "rect":
            _, x, y, w, h = s
            yield (x, y, x + w, y); yield (x + w, y, x + w, y + h); yield (x + w, y + h, x, y + h); yield (x, y + h, x, y)
        elif s[0] == "line":
            yield tuple(s[1:5])
        elif s[0] == "circ":
            _, cx, cy, r = s
            for k in range(24):
                a, b = 2 * math.pi * k / 24, 2 * math.pi * (k + 1) / 24
                yield (cx + r * math.cos(a), cy + r * math.sin(a), cx + r * math.cos(b), cy + r * math.sin(b))
segs = list(skizze_strecken(SK))
if HOCH:
    ort = lambda px, py: Vector((-HW_ / 2 + HR + px, HL_ - HO - py, HT_))
    tr, nrm = handy, (0, 0, 1)
else:
    ort = lambda px, py: Vector((BZ + px, 0, SH_ - BZ - py))
    tr, nrm = schirm, (0, -1, 0)
for k, (a, b, c, d) in enumerate(segs):
    e0 = sk0 + (sk1 - sk0 - 6) * k / max(1, len(segs) - 1)
    bau.strich(ort(a, b), ort(c, d), e0, 6, .8, normal=nrm, eltern=tr, breite=.011, aus=Z["bildschirm"][0] + 6)

klapp_teile = [plate, beinL, beinR, hals, schirm, tfront, tlinks, trechts, trueck, tdeckel]
ab_bogen = {"D_Platte": Z_TISCH[0], "D_BeinL": Z_TISCH[0], "D_BeinR": Z_TISCH[0], "M_Hals": Z_MON[0], "M_Schirm": Z_MON[0], "T_Front": ZR["front"][0],
            "T_Links": ZR["seiten"][0], "T_Rechts": ZR["seiten"][0], "T_Rueck": ZR["rueck"][0], "T_Deckel": ZR["rueck"][0]}
steht = {"D_Platte": Z_TISCH[1], "D_BeinL": Z_TISCH[1], "D_BeinR": Z_TISCH[1], "M_Hals": Z_MON[1], "M_Schirm": Z_MON[1], "T_Front": ZR["front"][1], "T_Links": ZR["seiten"][1],
         "T_Rechts": ZR["seiten"][1], "T_Rueck": ZR["rueck"][1], "T_Deckel": ZR["deckel"][1], "T_Boden": ZR["front"][1], "D_Abdruck": Z_TISCH[1], "M_Fuss": Z_MON[1]}
bau.schnitt(klapp_teile, 0, *Z["schnitt"], ab_bogen, nachbarn=[boden_r, abdruck_t, fuss])
bau.raster(-5.5, RX + 3.5, -3.5, DY + DD + 2.5, *Z["raster"], aus=Z["raster_aus"])
bauform_frame = Z["tisch"][1] + 60   # Tisch, Monitor und Rechner stehen (nach dem Aufstellen, vor dem Leben auf dem Tisch)
n_ger = bau.geruest([plate, beinL, beinR, tfront, tlinks, trechts, trueck, tdeckel], *Z["geruest"], steht, frame_bauform=bauform_frame)
bau.spur([plate, beinL, beinR, tfront, tlinks, trechts, trueck], {k: v - 10 for k, v in ab_bogen.items()})
# Falzlinie der Marke (gestrichelt, bleibt) auf dem Bogen unter den Lettern
fx0 = NAME_X + nx0 - .1 * EM; fx1 = NAME_X + nx0 + ges_w + .1 * EM
bau.gestrichelt((fx0, NAME_Y + MK["dicke"] / 2, .0016), (fx1, NAME_Y + MK["dicke"] / 2, .0016), Z["name_falz"][0], Z["name_falz"][1] - Z["name_falz"][0], .6, muster=(.16, .08), breite=.016)
# Kabel: Bildschirm -> Platte -> Tischbein -> Bogen -> Rechner (zeichnet sich nach dem Aufstellen)
k0, k1 = Z["kabel"]
cable_w = .055
def lokal_platte(x, y):  # Weltpunkt (x, y) auf der Platte -> lokal im Plattenobjekt
    return Vector((x - DX, y - DY, DP))
yk = DY + DD - .4
wp = [(XM, Y_HALS + .03), (XM, yk), (DX + DW / 2, yk)]
segs_k = list(zip(wp, wp[1:]))
t_ = k0
for a, b in segs_k:
    L = (Vector(b) - Vector(a)).length; d_ = (k1 - k0) * .22 * L / 2.0
    bau.strich(lokal_platte(*a), lokal_platte(*b), t_, d_, .92, normal=(0, 0, 1), eltern=plate, breite=cable_w); t_ += d_
# über die Kante und am Bein hinunter (Außenfläche des rechten Beins, lokal: x entlang der Tiefe, z Höhe, y = Außenfläche)
xl = yk - (DY + DD / 2)
bau.strich(Vector((xl, -0.0, DH + DP)), Vector((xl, -0.0, .0)), t_, (k1 - k0) * .2, .92, normal=(0, -1, 0), eltern=beinR, breite=cable_w); t_ += (k1 - k0) * .2
# über den Bogen zum Rechner (weiche Kurve), dann an der Außenseite der linken Rechnerwand hoch
kb, kk, kl = basis.bahn_g2(((DX + DW / 2 + .02, yk), 90), ((X0 - T - G - .35, RY + RD / 2), 90), [], schritt=1.2, n=60)
dur = (k1 - k0) * .46 / len(kb)
for i, (p, q) in enumerate(zip(kb, kb[1:])):
    bau.strich(Vector((p.x, p.y, .0011)), Vector((q.x, q.y, .0011)), t_ + dur * i, dur * 1.4, .92, normal=(0, 0, 1), breite=cable_w)
t_ += dur * len(kb)
bau.strich(Vector((X0 - T - G - .35, RY + RD / 2, .0011)), Vector((X0 - T - G - .0, RY + RD / 2, .0011)), t_, 3, .92, normal=(0, 0, 1), breite=cable_w)
bau_obs = bau.bauen()
print(f"BAU: {sum(len(v) for v in bau.striche.values())} Striche, {len(bau.flaechen)} Abdrücke, Gerüstkanten {n_ger}, Objekte {[o.name for o in bau_obs][:8]}")

# ================================================================ Kamera: Stützposen, eine durchgehende Fahrt
KC = SZ["kamera"][ANORDNUNG]
VF = KC["vfov"]; ASP = KC["aspekt"][0] / KC["aspekt"][1]; BILD = tuple(KC["proben_aufloesung"])
KNAME = "Kamera_Handy" if HOCH else "Kamera_Desktop"
H = basis.huellpunkte
objs_name = [name_ob, dot_ob]
objs_tisch = [plate, beinL, beinR, abdruck_t]
objs_dinge = [tablett, tastatur, maus, handy, tasse_boden, becher_boden, topf_boden, lampe_fuss, lampe_arm, lampe_kopf] + tasse_w + becher_w + topf_w
objs_monitor = [fuss, hals, schirm]
objs_tower = [boden_r, tfront, trueck, tlinks, trechts, tdeckel]
def flaeche_ecken(ob, frame):
    sc.frame_set(frame); bpy.context.view_layer.update()
    pts = [ob.matrix_world @ v.co for v in ob.data.vertices]
    sc.frame_set(0)
    return pts
def rahmt(r):
    was = r["was"]
    if was == "name": return H(objs_name, [r["bild"]])
    if was == "buehne":
        a_, b_, st = r["bilder"]
        return H(objs_tisch + objs_monitor + objs_tower + objs_dinge, list(range(a_, b_ + 1, st)))
    if was == "handy_umgebung": return H([handy, maus, tastatur, becher_boden, tasse_boden] + becher_w + tasse_w, [r["bild"]])
    if was == "schreibtisch_fertig": return H(objs_tisch + objs_monitor + objs_dinge, [r["bild"]])
    if was == "tisch_fertig": return H(objs_tisch + objs_monitor + objs_dinge + objs_tower, [r["bild"]])
    if was == "flaeche":
        P = flaeche_ecken(DRUCK[TRAGER], r["bild"])
        if r.get("teil"):    # nur ein Streifen der Fläche (Anteile der Höhe von oben): die Kamera fährt am Gerät entlang, wie beim Lesen einer Seite
            a_, b_ = r["teil"]
            return [P[0] + (P[1] - P[0]) * u + (P[3] - P[0]) * v for v in (a_, b_) for u in (0, 1)]
        return P
    if was == "rechner_welt": return H(objs_tower + [pkt], [r["bild"]])
    raise ValueError("unbekannt: rahmt " + was)
E = []
for e in KC["einstellungen"]:
    pts = []
    for r in e["rahmt"]:
        pts += rahmt(r)
    if e.get("mittel") or e.get("anflug"): e = dict(e, rand=0)
    x_fest = None
    if e.get("x_fest") == "mitte":
        x_fest = sum(p.x for p in pts) / len(pts)
    E.append({"name": e["name"], "bild": e["bild"], "f0": e["von"], "f1": e["bis"], "neigung": e["neigung"], "gier": e["gier"], "punkte": pts, "rand": e["rand"],
              "lage_v": e.get("lage_v", .5), "x_fest": x_fest, "z_fest": e.get("z_fest")})
MITTEL = {e["name"]: e.get("mittel") or e.get("anflug") for e in KC["einstellungen"]}
for e in E:
    if not MITTEL.get(e["name"]):
        e["ort"], e["verschiebung"] = basis.rahmen(e["punkte"], e["neigung"], e["gier"], VF, ASP, rand=e["rand"], lage_v=e["lage_v"], x_fest=e["x_fest"])
for e in E:
    m_ = MITTEL.get(e["name"])
    if m_ and "zurueck" in m_:   # Anflug: auf der Blickachse einer anderen Stützpose, um `zurueck` Einheiten davor (die Fahrt endet entlang der Blickachse, ohne Überschwingen)
        a_ = next(x for x in E if x["name"] == m_["von"])
        fw = basis.kamera_orientierung(a_["neigung"], a_["gier"]).to_matrix() @ Vector((0, 0, -1))
        e["ort"] = a_["ort"] - fw * m_["zurueck"]; e["verschiebung"] = a_["verschiebung"]; e["neigung"] = a_["neigung"]; e["gier"] = a_["gier"]
    elif m_:   # Zwischenpose auf halbem Weg zwischen zwei anderen Stützposen (glättet den Tempoverlauf)
        a_ = next(x for x in E if x["name"] == m_["von"]); b_ = next(x for x in E if x["name"] == m_["bis"]); k_ = m_.get("anteil", .5)
        e["ort"] = a_["ort"].lerp(b_["ort"], k_); e["verschiebung"] = a_["verschiebung"] + (b_["verschiebung"] - a_["verschiebung"]) * k_
        e["neigung"] = a_["neigung"] + (b_["neigung"] - a_["neigung"]) * k_; e["gier"] = a_["gier"] + (b_["gier"] - a_["gier"]) * k_
    if e["z_fest"] is not None and e["neigung"] == 0:
        e["ort"].z = e["z_fest"]          # Startbild: Kamera knapp über dem Papier, Horizont gerade hinter dem Namen
cam = basis.kamera(KNAME, VF)
basis._spuren.clear()
KZ = SZ["kamera"]["zeitlupe"]
AUS = SZ["ausgang"][ANORDNUNG]
fahrt = basis.kamerafahrt(cam, E, F_END, ASP, ein=None, aus=(AUS["faden"]["richtung_grad"], AUS["kamera_tempo"]), zeitlupe=[(a_, b_, KZ["faktor"], KZ["rampe"]) for a_, b_ in KZ["fenster"]])
basis.backen(F_END)
KENN = basis.fahrt_kennwerte(fahrt)
print("FAHRT", json.dumps(KENN))
for e in E:
    print(f"STUETZPOSE {e['name']} (Bild {e['bild']}): Ort {tuple(round(v, 2) for v in e['ort'])}, Neigung {e['neigung']}, Verschiebung {e['verschiebung']:.3f}")

# ---------------------------------------------------------------- Eingang und Ausgang
def pose(e, f, tempo=None):
    k = {"ort": [e["ort"].x, e["ort"].y, e["ort"].z], "neigung": e["neigung"], "gier": e["gier"], "vfov": VF, "verschiebung": e["verschiebung"]}
    if tempo is not None: k["tempo"] = tempo
    return {"bild": f, "faden": faden_zustand(f), "kamera": k}
UEBERGANG = {"eingang": pose(E[0], 0), "ausgang": pose(E[-1], F_END, AUS["kamera_tempo"])}
print("EINGANG", json.dumps(UEBERGANG["eingang"]), "AUSGANG", json.dumps(UEBERGANG["ausgang"]))

# ---------------------------------------------------------------- Prüfung
bericht = {"form_hash": FORM_HASH, "einstellungen": {}, "kollisionen": {}, "hinweise": {}, "uebergang": UEBERGANG, "bahn": BERICHT_BAHN, "kamera": {k: v for k, v in KENN.items()}}
alle_meshes = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith("druck:") and o.get("neubau_rolle") not in ("bau", "schiene")
               and o.name not in ("Boden", "Bogen", "Pruef_Faden") and not o.name.startswith("Abdruck")]
teile = [o for o in alle_meshes if o.name not in ("D_Abdruck", "T_Boden")] + [pruef_faden]
# zulässig: Teile, die sich an ihrem gemeinsamen Falz berühren (der Karton biegt dort); der Faden ist auf das Papier gedruckt und
# liegt unter der Rechner-Front, solange sie noch flach im Bogen liegt
erlaubt = [("T_Rueck", "T_Deckel"), ("Pruef_Faden", "T_Front"), ("Pruef_Faden", "T_Led"), ("Punkt", "Pruef_Faden")]
kol = basis.kollisionen(teile, F_END, erlaubt=erlaubt, schritt=2)
for (a, b), fs in kol.items():
    bericht["kollisionen"][f"{a} x {b}"] = {"bilder": [f for f, n in fs][:12], "anzahl_bilder": len(fs)}
print("KOLLISIONEN:", json.dumps(bericht["kollisionen"], ensure_ascii=False) if bericht["kollisionen"] else "keine")
for e in E:
    aus = 0
    for f in range(e["f0"], e["f1"] + 1, 4):
        aus += len(basis.im_bild(cam, ASP, e["punkte"], f, rand=.005))
    bericht["einstellungen"][e["name"]] = {"punkte_ausserhalb": aus}
bericht["huelle"] = basis.huelle_xy([o for o in teile if o.name != "Pruef_Faden"] + [rail], list(range(0, F_END + 1, 20)))
print("PRUEFUNG", json.dumps(bericht, ensure_ascii=False, indent=1))
os.makedirs(os.path.join(NEU, "tmp"), exist_ok=True)
json.dump(bericht, open(os.path.join(NEU, "tmp", f"eroeffnung_{ANORDNUNG}_pruefung.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- Probebilder
pruef_faden.hide_render = True
if A["proben"]:
    frames = A["frames"] or [0, 60, 110, 150, 200, 260, 340, 420, 480, 556, 610, 670]
    for f in frames:
        t1 = basis.probe(cam, f, os.path.join(PROBEN, f"{ANORDNUNG}_{f:03d}.png"), BILD[0], BILD[1], prozent=200 if HOCH else 100)
        print(f"PROBE {f}: {t1:.1f}s")

# ---------------------------------------------------------------- Export
if A["export"]:
    extras = {
        "szene": "eroeffnung", "frames": F_END, "fps": basis.FPS, "form_hash": FORM_HASH,
        "anordnung": ANORDNUNG, "kamera": {"name": KNAME, "vfov": VF, "aspekt": ASP},
        "licht": basis.LICHT, "pal": PAL,
        "einstellungen": [{k: e[k] for k in ("name", "f0", "f1", "bild")} for e in E],
        "lesestellen": [list(Z["lesen"])],
        "verschiebung": json.loads(cam["neubau_verschiebung"]),
        "druckflaechen": {n: {"w": json.loads(o["neubau"])["w"], "h": json.loads(o["neubau"])["h"]} for n, o in DRUCK.items()},
        "faden_s": [round(s_punkt(f) * laenge, 5) for f in range(F_END + 1)],
        "bahn": BERICHT_BAHN,
        "bogen": SZ["bogen"], "huelle": bericht["huelle"],
        "uebergang": UEBERGANG,
    }
    out = os.path.join(NEU, "seite", "assets", f"eroeffnung-{ANORDNUNG}.glb")
    n = basis.export_glb(out, extras, draco="--draco" in sys.argv)
    print(f"EXPORT {out} {n / 1024:.0f} KB")
