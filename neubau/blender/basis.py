# Gemeinsame Basis für alle Szenen des Neubaus (Blender 5.2, headless).
# Module: Palette und Bühne (Licht, Boden, Bogen), Papier (Karton, Prisma, Scharnier), Druck (Text und Kanten im Papier),
# Kamera (Einstellungen rahmen ihren Inhalt, Fahrt ohne Rollen), Bewegung (gebacken je Bild), Faden und Punkt,
# Prüfung (Durchdringung, Text sichtbar und groß genug, Faden frei), Probebilder, Export.
#
# Eine Szene ist eine Beschreibung: sie baut Teile, gibt Zeitfenster und Einstellungen an und ruft am Ende bau_ab().
# Aufruf: blender.exe -b --factory-startup --python neubau/blender/<szene>.py -- [--proben] [--export] [--nur-pruefen]
import bpy, bmesh, json, math, os, subprocess, sys, time
from mathutils import Vector, Matrix, Euler, Quaternion
from mathutils.bvhtree import BVHTree

HIER = os.path.dirname(os.path.abspath(__file__))
NEUBAU = os.path.dirname(HIER)

# ---------- Palette „Mirror's Edge mit Papier“ (FASSUNG-2026-11, Farbpalette; Werte aus dem Bestand kern.js / modernisierung.js) ----------
PAL = {
    "papier": "#f4f7fc",      # Bogen: kühles Weiß, etwas gedämpfter als die weißen Teile (Teile stehen heller vor dem Bogen)
    "flaeche": "#f2f6fc",     # helle Bauteilfläche
    "grau1": "#d8e0ec",       # feine kühle Grauabstufungen für Flächen, die sich absetzen
    "grau2": "#b0bacb",       # Gehäuse des alten Geräts
    "grau3": "#a2acbe",       # Front des alten Geräts
    "metall": "#a0abbd",
    "kante": "#7c879e",       # Schnittkante des Kartons (Dicke), zeichnet die Kontur mit der Fläche
    "boden": "#c2d1e4",       # Tisch unter dem Bogen: deutlich dunkler und kühler als der Bogen, damit der Bogen als Fläche steht
    "dunst": "#e8f0fa",       # Horizont und Boden in der Ferne: sehr heller kühler Dunst, kaum von Papier zu unterscheiden (Mirror's Edge)
    "himmel": "#dfebf8",      # Zenit des Verlaufs über dem Horizont: nur ein Hauch Himmelblau (nur ein Farbverlauf)
    "schatten": "#bccbe0",    # Schattenfarbe (bläulich)
    "tinte": "#303033",       # Schrift dunkel und kontrastreich
    "rot": "#d40235",         # einzige kräftige Farbe: Faden, Punkt, wenige Akzente
}
HIMMEL_STEIL = .42        # Höhe über dem Horizont (sin der Erhebung), bei der der Verlauf den Zenitton erreicht
KARTON = .03          # Dicke des Kartons (Einheiten)
SPALT = .0015         # Luft zwischen Teilen, die sich berühren (Prüfung meldet erst darunter)
FPS = 24


def lin(hexs):
    """sRGB-Hex -> lineares RGBA (Blender rechnet linear)."""
    h = hexs.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda v: v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4
    return (f(c[0]), f(c[1]), f(c[2]), 1.0)


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return {"proben": "--proben" in a, "export": "--export" in a, "nur": [x.split("=", 1)[1] for x in a if x.startswith("--nur=")],
            "frames": [int(v) for x in a if x.startswith("--frames=") for v in x.split("=", 1)[1].split(",")]}


# ---------- Bühne ----------
def buehne(frames, bogen=(-8, 8, -10, 10)):
    """Leere Szene mit Farbmanagement, Licht, Tisch (Boden mit weichem Horizont) und Bogen."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 0, frames
    sc.render.fps = FPS
    sc.render.engine = "BLENDER_EEVEE"
    try:
        sc.view_settings.view_transform = "Khronos PBR Neutral"   # entspricht THREE.NeutralToneMapping im Browser
    except TypeError:
        sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0
    sc.render.film_transparent = False
    sc.eevee.taa_render_samples = 32
    sc.eevee.use_shadows = True
    sc.eevee.shadow_resolution_scale = 1.0
    # Welt: Kamera sieht den Dunst, das Licht der Umgebung ist ein kühles Grauweiß (Schatten leicht bläulich)
    w = bpy.data.worlds.new("Welt"); sc.world = w
    w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    lp = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    bg_cam = nt.nodes.new("ShaderNodeBackground"); bg_cam.inputs[1].default_value = 1
    # Himmelsverlauf: Horizont (Dunst) -> Zenit über die Blickrichtung (Texture Coordinate „Generated“ ist in der Welt die Richtung)
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"; mr.inputs["From Min"].default_value = 0; mr.inputs["From Max"].default_value = HIMMEL_STEIL
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"
    mx.inputs["A"].default_value = lin(PAL["dunst"]); mx.inputs["B"].default_value = lin(PAL["himmel"])
    nt.links.new(mr.outputs["Result"], mx.inputs["Factor"]); nt.links.new(mx.outputs["Result"], bg_cam.inputs[0])
    bg_amb = nt.nodes.new("ShaderNodeBackground"); bg_amb.inputs[0].default_value = lin(LICHT["umgebung_farbe"]); bg_amb.inputs[1].default_value = LICHT["umgebung"]
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
    nt.links.new(bg_amb.outputs[0], mix.inputs[1]); nt.links.new(bg_cam.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    # Sonne: hell, klare Schatten mit weicher Kante
    sd = bpy.data.lights.new("Sonne", "SUN"); sd.energy = LICHT["sonne"]; sd.angle = math.radians(LICHT["winkel"]); sd.color = (1, 1, 1)
    so = bpy.data.objects.new("Sonne", sd); sc.collection.objects.link(so)
    so.rotation_euler = Euler((math.radians(LICHT["hoehe"]), 0, math.radians(LICHT["richtung"])), "XYZ")
    # Tisch: große Scheibe, unbeleuchtet, Verlauf vom Tisch zum Dunst (weicher Horizont statt Kante)
    boden_bild = druck([{"name": "boden", "w": 1, "h": 1, "px": 256, "bg": PAL["boden"], "radial": True}])[0]["out"]
    m = material("Boden", PAL["boden"], bild=boden_bild, unbeleuchtet=True)
    bpy.ops.mesh.primitive_circle_add(vertices=96, radius=90, fill_type="TRIFAN", location=(0, 0, -.004))
    b = bpy.context.object; b.name = "Boden"; b.data.materials.append(m)
    uv = b.data.uv_layers.new()
    for l in b.data.loops:
        co = b.data.vertices[l.vertex_index].co
        uv.data[l.index].uv = (co.x / 180 + .5, co.y / 180 + .5)
    # Bogen: das gemeinsame Papier der Szene, Oberseite auf z = 0
    x0, x1, y0, y1 = bogen
    bo = karton("Bogen", x1 - x0, y1 - y0, .004, mats={"alle": material("Papier", PAL["papier"])}, liegend=True)
    bo.location = (x0, y0, -.004)
    return sc


# Licht: an einer Stelle, der Browser liest dieselben Werte aus den Extras (licht) der glb
LICHT = {"sonne": 4.6, "winkel": 2.5, "hoehe": 38, "richtung": 32, "umgebung": .80, "umgebung_farbe": "#dfe9f6", "himmel_steil": HIMMEL_STEIL}


# ---------- Material ----------
_mat = {}


def material(name, farbe, bild=None, unbeleuchtet=False, rau=.85, einblenden=None, extra=None, transparent=False):
    """einblenden=(f0, f1): der Druck erscheint weich zwischen Bild f0 und f1 (vorher nur die Grundfarbe). Im Browser
    liest der Abspieler das aus den Extras des Materials (neubau.einblenden)."""
    key = (name, farbe, bild, unbeleuchtet, einblenden, json.dumps(extra, sort_keys=True) if extra else None, transparent)
    if key in _mat:
        return _mat[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    if unbeleuchtet:
        sh = nt.nodes.new("ShaderNodeEmission"); sh.inputs["Strength"].default_value = 1
        col_in = sh.inputs["Color"]
    else:
        sh = nt.nodes.new("ShaderNodeBsdfPrincipled")
        sh.inputs["Roughness"].default_value = rau
        sh.inputs["Specular IOR Level"].default_value = .25
        col_in = sh.inputs["Base Color"]
        if transparent:   # Überlagerung (Druck mit Alphakanal): in den Blender-Proben unsichtbar, der Browser zeichnet sie
            sh.inputs["Alpha"].default_value = 0.0
            m.surface_render_method = "BLENDED"
    col_in.default_value = lin(farbe)
    if bild:
        tx = nt.nodes.new("ShaderNodeTexImage")
        img = bpy.data.images.load(bild, check_existing=True)
        tx.image = img; tx.interpolation = "Cubic"; tx.extension = "EXTEND"
        if einblenden:
            mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.name = "Einblenden"
            mix.inputs["A"].default_value = lin(farbe)
            k = _frame_fenster(nt, *einblenden)
            nt.links.new(k, mix.inputs["Factor"])
            nt.links.new(tx.outputs["Color"], mix.inputs["B"])
            nt.links.new(mix.outputs["Result"], col_in)
        else:
            nt.links.new(tx.outputs["Color"], col_in)
    nt.links.new(sh.outputs[0], out.inputs[0])
    m["neubau"] = json.dumps({"farbe": farbe, "unbeleuchtet": unbeleuchtet, "einblenden": list(einblenden) if einblenden else None, "transparent": bool(transparent), **(extra or {})})
    _mat[key] = m
    return m


def _frame_wert(nt):
    v = nt.nodes.new("ShaderNodeValue"); v.name = "Bild"
    fc = v.outputs[0].driver_add("default_value"); fc.driver.type = "SCRIPTED"; fc.driver.expression = "frame"
    return v.outputs[0]


def _frame_fenster(nt, f0, f1):
    """Knoten: weicher Fortschritt 0..1 der aktuellen Bildnummer im Fenster [f0, f1]."""
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"
    mr.inputs["From Min"].default_value = f0; mr.inputs["From Max"].default_value = f1
    nt.links.new(_frame_wert(nt), mr.inputs["Value"])
    return mr.outputs["Result"]


# ---------- Druck ----------
_druck_n = [0]


def druck(auftraege):
    """Rastert Druckbilder mit druck.py (System-Python mit PIL). Gibt je Auftrag {out, px, zeilen} zurück."""
    d = os.environ.get("NEUBAU_DRUCK") or os.path.join(NEUBAU, "tmp", "druck"); os.makedirs(d, exist_ok=True)
    for a in auftraege:
        a.setdefault("out", os.path.join(d, a["name"] + ".png"))
    radial = [a for a in auftraege if a.get("radial")]
    for a in radial:  # Bodenverlauf braucht keinen Text: direkt hier als kleines Bild
        _radial(a)
    rest = [a for a in auftraege if not a.get("radial")]
    erg = []
    if rest:
        _druck_n[0] += 1
        jf = os.path.join(d, f"auftrag_{_druck_n[0]}.json")
        json.dump(rest, open(jf, "w", encoding="utf8"))
        r = subprocess.run(["python", os.path.join(HIER, "druck.py"), jf], capture_output=True, text=True, encoding="utf8")
        if r.returncode:
            raise RuntimeError("druck.py: " + r.stderr)
        erg = json.loads(r.stdout.strip().splitlines()[-1])
    it = iter(erg)
    return [({"out": a["out"], "px": [256, 256], "zeilen": []} if a.get("radial") else next(it)) for a in auftraege]


def _radial(a):
    """Verlauf Tisch -> Dunst als Blender-Bild (ohne PIL)."""
    n = 256
    img = bpy.data.images.new("boden_verlauf", n, n, alpha=False)
    srgb = lambda h: [int(h.lstrip("#")[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c0, c1 = srgb(PAL["boden"]), srgb(PAL["dunst"])
    px = []
    for j in range(n):
        for i in range(n):
            r = (((i + .5) / n - .5) ** 2 + ((j + .5) / n - .5) ** 2) ** .5 * 2
            k = min(1, max(0, (r - .12) / .55)); k = k * k * (3 - 2 * k)
            px += [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k, 1]
    img.pixels = px
    img.filepath_raw = a["out"]; img.file_format = "PNG"; img.save()


# ---------- Papier: Karton (dünner Quader) mit Druck auf Vorder- und Rückseite ----------
def karton(name, w, h, t=KARTON, mats=None, uv_hinten=(True, False), liegend=False, mitte_x=False, zentriert=False):
    """Quader in lokalen Koordinaten x in [0,w] (bzw. mittig), Höhe z in [0,h], Dicke y in [0,t].
    Vorderseite bei y=0 (zeigt -y), Rückseite bei y=t (zeigt +y). liegend=True: Höhe läuft entlang +y, Dicke entlang z
    (Vorderseite oben). mats: {"vorn": m, "hinten": m, "rand": m} oder {"alle": m}. uv_hinten: (u spiegeln, v spiegeln)
    der Rückseite, damit ein Druck nach dem Umklappen richtig herum steht."""
    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    xa = -w / 2 if (mitte_x or zentriert) else 0
    X = [xa, xa + w]; Y = [0, t]; Z = [0, h]
    v = [(X[i], Y[j], Z[k]) for i in (0, 1) for j in (0, 1) for k in (0, 1)]
    idx = lambda i, j, k: i * 4 + j * 2 + k
    faces = {
        "vorn": [idx(0, 0, 0), idx(1, 0, 0), idx(1, 0, 1), idx(0, 0, 1)],
        "hinten": [idx(1, 1, 0), idx(0, 1, 0), idx(0, 1, 1), idx(1, 1, 1)],
        "links": [idx(0, 1, 0), idx(0, 0, 0), idx(0, 0, 1), idx(0, 1, 1)],
        "rechts": [idx(1, 0, 0), idx(1, 1, 0), idx(1, 1, 1), idx(1, 0, 1)],
        "unten": [idx(0, 1, 0), idx(1, 1, 0), idx(1, 0, 0), idx(0, 0, 0)],
        "oben": [idx(0, 0, 1), idx(1, 0, 1), idx(1, 1, 1), idx(0, 1, 1)],
    }
    names = list(faces)
    me.from_pydata(v, [], [faces[n] for n in names])
    me.update()
    mats = mats or {}
    def mat_von(n):
        m = mats.get(n)
        if m is None and n in ("vorn", "hinten"):
            m = mats.get("flaeche")
        return m or mats.get("rand") or mats.get("alle") or material("Papier", PAL["papier"])
    slots = []
    for n in names:
        m = mat_von(n)
        if m.name not in [s.name for s in slots]:
            slots.append(m)
    for m in slots:
        me.materials.append(m)
    uv = me.uv_layers.new()
    for pi, n in enumerate(names):
        p = me.polygons[pi]
        p.material_index = [s.name for s in slots].index(mat_von(n).name)
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            u, vv = (co.x - xa) / w, co.z / h
            if n == "hinten":
                if uv_hinten[0]: u = 1 - u
                if uv_hinten[1]: vv = 1 - vv
            uv.data[li].uv = (u, vv)
    if zentriert:
        me.transform(Matrix.Translation((0, -t / 2, -h / 2)))
    if liegend:
        # Höhe entlang +y, Dicke nach oben: um x drehen (-90°), Vorderseite zeigt dann nach oben
        # Rotation -90° um x: (y,z) -> (z,-y); vorher y nach [-t,0] schieben, dann liegt die Dicke bei z in [0,t]
        me.transform(Matrix.Rotation(-math.pi / 2, 4, "X") @ Matrix.Translation((0, -t, 0)))
    me.update()
    return ob


# ---------- Druckflächen: benannte, leere Flächen für Text, der erst im Browser gedruckt wird ----------
def druckflaeche(name, traeger, seite, w, h, mat, dicke, abstand=.001, x0=0, z0=0):
    """Leere Druckfläche ("druck:<name>") dicht über einer Seite des Trägers (Kind des Trägers, bewegt sich mit ihm).
    seite "hinten": Rückseite des Kartons bei y = dicke (Druckkoordinaten x -> x, y -> z, von unten gezählt wie die Rückseite der
    Front); seite "vorn": Vorderseite bei y = 0 (Druckkoordinaten y von oben, also z = h - y). w, h: Maße in Einheiten, = Maße des
    Druckbilds im Browser. x0, z0: Lage der unteren linken Ecke der Fläche in den lokalen Koordinaten des Trägers (für Flächen, die
    nur einen Teil des Trägers einnehmen, etwa ein Schild auf einem Pfeilbrett). Die UV füllt die Fläche (u nach rechts, v nach oben,
    Blender-Konvention). Der Abspieler liest Name, w und h aus den Extras (neubau.druck, w, h) und legt das gezeichnete Bild als Textur auf."""
    me = bpy.data.meshes.new("druck:" + name)
    ob = bpy.data.objects.new("druck:" + name, me); bpy.context.scene.collection.objects.link(ob)
    if seite == "hinten":
        pt = lambda px, py: (x0 + px, dicke + abstand, z0 + py)
        gewollt = 1
    else:
        pt = lambda px, py: (x0 + px, -abstand, z0 + h - py)
        gewollt = -1
    ecken = [(0, 0), (w, 0), (w, h), (0, h)]
    me.from_pydata([pt(*e) for e in ecken], [], [[0, 1, 2, 3]])
    me.update()
    if me.polygons[0].normal.y * gewollt < 0:
        me.polygons[0].flip()
    uv = me.uv_layers.new()
    for li in me.polygons[0].loop_indices:
        e = ecken[me.loops[li].vertex_index]
        uv.data[li].uv = (e[0] / w, 1 - e[1] / h)
    me.materials.append(mat)
    ob.parent = traeger
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob["neubau"] = json.dumps({"druck": name, "w": round(w, 5), "h": round(h, 5), "traeger": traeger.name, "seite": seite})
    ob.visible_shadow = False
    return ob


def druckflaeche_oben(name, traeger, w, h, mat, z, x0=0, y0=0):
    """Leere Druckfläche ("druck:<name>") auf der Oberseite eines liegenden Trägers (Kind des Trägers): Ebene bei z (lokal), die Fläche reicht von
    (x0, y0) um w nach +x und h nach +y; Bildoberkante liegt am fernen (+y) Ende, Blickrichtung +y liest also aufrecht. Extras wie bei druckflaeche()."""
    me = bpy.data.meshes.new("druck:" + name)
    ob = bpy.data.objects.new("druck:" + name, me); bpy.context.scene.collection.objects.link(ob)
    ecken = [(0, 0), (w, 0), (w, h), (0, h)]
    pt = lambda px, py: (x0 + px, y0 + h - py, z)
    me.from_pydata([pt(*e) for e in ecken], [], [[0, 1, 2, 3]])
    me.update()
    if me.polygons[0].normal.z < 0:
        me.polygons[0].flip()
    uv = me.uv_layers.new()
    for li in me.polygons[0].loop_indices:
        e = ecken[me.loops[li].vertex_index]
        uv.data[li].uv = (e[0] / w, 1 - e[1] / h)
    me.materials.append(mat)
    ob.parent = traeger
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob["neubau"] = json.dumps({"druck": name, "w": round(w, 5), "h": round(h, 5), "traeger": traeger.name, "seite": "oben"})
    ob.visible_shadow = False
    return ob


# ---------- Weitere Papierbausteine (gemeinsam für alle Szenen) ----------
def zylinder(name, r, h, n, mat, ort=(0, 0, 0)):
    """Geschlossenes n-Eck-Prisma mit senkrechter Achse (z), Boden auf z = ort[2]. Papierrolle, Scheibe, Fuß."""
    me = bpy.data.meshes.new(name); ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    bm = bmesh.new()
    v0 = [bm.verts.new((r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), 0)) for i in range(n)]
    v1 = [bm.verts.new((r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), h)) for i in range(n)]
    bm.faces.new(v0[::-1]); bm.faces.new(v1)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([v0[i], v0[j], v1[j], v1[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    me.materials.append(mat)
    uv = me.uv_layers.new()
    for l in me.loops:
        co = me.vertices[l.vertex_index].co
        uv.data[l.index].uv = (co.x / (2 * r) + .5, co.y / (2 * r) + .5)
    ob.location = ort
    return ob


def faltpanel(name, mitte, azimut_grad, breite, hoehe, t, mats, auf, flach=90, eltern=None):
    """Blatt, das sich nach außen flach in den Bogen legt und senkrecht aufstellt (Seitenwand eines Gefäßes, Blatt einer Pflanze, Stift).
    mitte: Weltpunkt unten auf der Außenfläche des Blattes; azimut_grad: Richtung nach außen (0 = +y, 90 = +x). Das Scharnier liegt in der
    Außenfläche am Fuß, das Blatt ist in der Bauform senkrecht (Außenfläche = Vorderseite, Dicke nach innen). Die Dicke geht beim
    Flachlegen nach oben, nichts taucht in die Unterlage. flach: Winkel Bauform -> flach (90 = ganz flach; kleiner für ein nach außen
    geneigtes Blatt, dann steht es in der Bauform um 90 - flach nach außen geneigt). Gibt (Blatt, Scharnier, Rahmen) zurück."""
    psi = math.radians(180 - azimut_grad)
    rahmen_ = leer(name + "_rahmen", Vector(mitte), eltern)
    rahmen_.rotation_euler = (0, 0, psi)
    gelenk = klappe(name + "_gelenk", (0, 0, 0), "x", flach, auf, None, [], eltern=rahmen_)
    b = karton(name, breite, hoehe, t, mats=mats, mitte_x=True)
    b.parent = gelenk; b.matrix_parent_inverse = Matrix.Identity(4); b.location = (0, 0, 0)
    if flach < 90:
        b.rotation_euler = (math.radians(90 - flach), 0, 0)   # Bauform: nach außen geneigt (+x-Drehung kippt +z nach -y = außen)
    return b, gelenk, rahmen_


def gefaess(name, mitte, z0, apothem, h, n, t, mat_aussen, mat_boden, auf, versatz=0, boden_dicke=.012, mat_kante=None):
    """Gefäß (Tasse, Becher, Topf) als n-eckiges Papiernetz: Boden und n Seitenblätter, die flach nach außen liegen und sich
    nacheinander (versatz Bilder je Blatt) aufstellen. apothem: Abstand Mitte - Außenfläche. Gibt (Boden, [Blätter]) zurück."""
    kante = mat_kante or material("Kante", PAL["kante"])
    boden = zylinder(name + "_boden", (apothem - t - SPALT) / math.cos(math.pi / n), boden_dicke, n, mat_boden, ort=(mitte[0], mitte[1], z0))
    boden.rotation_euler = (0, 0, math.pi / n)
    teile = []
    w = 2 * (apothem - t) * math.tan(math.pi / n) - SPALT * 4
    for i in range(n):
        az = 360 * i / n
        u = richtung_vektor(az)
        p = (mitte[0] + u.x * apothem, mitte[1] + u.y * apothem, z0)
        a0 = auf[0] + versatz * i
        b, g, r_ = faltpanel(f"{name}_w{i}", p, az, w, h, t, {"vorn": mat_aussen, "hinten": mat_boden, "rand": kante}, (a0, a0 + (auf[1] - auf[0])))
        teile.append(b)
    return boden, teile


def lettern(name, text, schriften, em, mat, dicke, kursiv_ab=None):
    """Papierlettern aus einer Schrift (Newsreader): Mesh in der x-z-Ebene, Vorderseite bei y = 0 (zeigt nach -y), Grundlinie auf z = 0,
    Dicke nach +y. schriften: {"aufrecht": ttf, "kursiv": ttf}; kursiv_ab: Index des ersten kursiven Zeichens. Gibt (Objekt, (x0, x1, z0, z1))
    zurück, Maße in Einheiten (em = Schriftgröße)."""
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = text
    cu.font = bpy.data.fonts.load(schriften["aufrecht"])
    if kursiv_ab is not None:
        cu.font_italic = bpy.data.fonts.load(schriften["kursiv"])
        for i in range(kursiv_ab, len(text)):
            cu.body_format[i].use_italic = True
    cu.size = em; cu.extrude = dicke / 2; cu.resolution_u = 12; cu.fill_mode = "BOTH"
    cu.align_x = "LEFT"
    tmp = bpy.data.objects.new(name + "_text", cu); bpy.context.scene.collection.objects.link(tmp)
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(tmp, do_unlink=True)
    me.transform(Matrix.Rotation(math.pi / 2, 4, "X") @ Matrix.Identity(4))
    me.transform(Matrix.Translation((0, dicke / 2, 0)))
    me.materials.clear(); me.materials.append(mat)
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    xs = [v.co.x for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    return ob, (min(xs), max(xs), min(zs), max(zs))


def gruppe(name, objekte, pivot=(0, 0, 0), versatz=(0, 0, 0), drehung_z=0):
    """Wurzelknoten für einen Gegenstand aus mehreren Teilen: Versatz und Drehung um die z-Achse (Grad, um pivot) aus der
    Szenendatei. Der Abspieler setzt dieselbe Matrix aus der Szenendatei neu, ohne dass Blender läuft. Gibt (Knoten, Matrix) zurück."""
    e = leer("Gruppe_" + name)
    for o in objekte:
        anhaengen(o, e)
    pv = Vector(pivot)
    M = Matrix.Translation(Vector(versatz)) @ Matrix.Translation(pv) @ Matrix.Rotation(math.radians(drehung_z), 4, "Z") @ Matrix.Translation(-pv)
    e.matrix_basis = M
    e["neubau"] = json.dumps({"gruppe": name, "pivot": [round(v, 5) for v in pivot], "versatz": list(versatz), "drehung_z": drehung_z})
    bpy.context.view_layer.update()
    return e, M


def prisma(name, umriss, achse, dicke, mat, ursprung=(0, 0, 0)):
    """Konvexes Prisma: Umriss als 2D-Polygon (gegen den Uhrzeigersinn) in der Ebene senkrecht zur Achse ('x' oder 'y'),
    entlang der Achse um dicke ausgezogen. Für Wände mit schräger Oberkante (Keilgehäuse)."""
    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    bm = bmesh.new()
    def P(a, b, d):
        if achse == "x":
            return (d, a, b)
        return (a, d, b)
    v0 = [bm.verts.new(P(a, b, 0)) for a, b in umriss]
    v1 = [bm.verts.new(P(a, b, dicke)) for a, b in umriss]
    n = len(umriss)
    bm.faces.new(v0[::-1] if achse == "x" else v0)
    bm.faces.new(v1 if achse == "x" else v1[::-1])
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([v0[i], v0[j], v1[j], v1[i]] if achse == "x" else [v0[j], v0[i], v1[i], v1[j]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    me.materials.append(mat)
    uv = me.uv_layers.new()
    for l in me.loops:
        co = me.vertices[l.vertex_index].co
        uv.data[l.index].uv = (co.y if achse == "x" else co.x, co.z)
    ob.location = ursprung
    return ob


def leer(name, ort=(0, 0, 0), eltern=None):
    e = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(e)
    e.empty_display_size = .2
    if eltern:
        e.parent = eltern
    e.location = ort
    return e


def anhaengen(kind, eltern):
    """Kind an Eltern hängen, ohne dass es sich in der Welt bewegt."""
    bpy.context.view_layer.update()
    mw = kind.matrix_world.copy()
    kind.parent = eltern
    kind.matrix_parent_inverse = eltern.matrix_world.inverted()
    kind.matrix_world = mw


# ---------- Bewegung: alles wird je Bild gebacken (keine Kurven-Überraschungen im Export) ----------
def sm(x):
    x = min(1, max(0, x)); return x * x * (3 - 2 * x)


def smm(x):
    x = min(1, max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10)


def fenster(f, f0, f1):
    """Fortschritt 0..1 im Zeitfenster [f0,f1] (Bilder), sanft ein- und auslaufend."""
    return smm((f - f0) / max(1e-6, f1 - f0))


_spuren = []   # (objekt, funktion(frame) -> dict(loc, rot, scale)) – wird in backen() abgetastet


def bewegung(ob, fn):
    _spuren.append((ob, fn))


def backen(frames):
    sc = bpy.context.scene
    for f in range(0, frames + 1):
        for ob, fn in _spuren:
            v = fn(f)
            if "shift" in v:
                ob.data.shift_x = v.pop("shift"); ob.data.keyframe_insert("shift_x", frame=f)
            for k, val in v.items():
                setattr(ob, {"loc": "location", "rot": "rotation_euler", "quat": "rotation_quaternion", "scale": "scale"}[k], val)
                ob.keyframe_insert({"loc": "location", "rot": "rotation_euler", "quat": "rotation_quaternion", "scale": "scale"}[k], frame=f)
    # alle Kurven linear (zwischen den gebackenen Bildern)
    for a in bpy.data.actions:
        for fc in _fcurves(a):
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
    sc.frame_set(0)


def _fcurves(action):
    try:
        return list(action.fcurves)
    except AttributeError:
        out = []
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    out += list(cb.fcurves)
        return out


def scharnier(name, ort, achse, winkel, f0, f1, teile, eltern=None, kurve=None):
    """Klappe: Leeres Objekt am Drehpunkt, die Teile hängen daran. Dreht von 0 auf winkel (Grad) um achse ('x'/'y'/'z')
    im Fenster [f0,f1]."""
    e = leer(name, ort, eltern)
    bpy.context.view_layer.update()
    for t in teile:
        anhaengen(t, e)
    ai = "xyz".index(achse)
    k = kurve or fenster
    def fn(f):
        r = [0, 0, 0]; r[ai] = math.radians(winkel) * k(f, f0, f1)
        return {"rot": Euler(r, "XYZ")}
    bewegung(e, fn)
    return e


def klappe(name, ort, achse, flach, auf, ab, teile, eltern=None):
    """Klappe aus dem Bogen: in Ruhe (Bild 0) um flach Grad gegen die Bauform gedreht (liegt im Bogen), klappt im Fenster auf
    hoch in die Bauform (Winkel 0) und im Fenster ab (oder None) wieder flach. Die Teile sind in der Bauform modelliert."""
    e = leer(name, ort, eltern)
    bpy.context.view_layer.update()
    for t in teile:
        anhaengen(t, e)
    ai = "xyz".index(achse)
    def fn(f):
        k = 1 - fenster(f, *auf) + (fenster(f, *ab) if ab else 0)
        r = [0, 0, 0]; r[ai] = math.radians(flach) * k
        return {"rot": Euler(r, "XYZ")}
    bewegung(e, fn)
    e["neubau_klappe"] = json.dumps({"achse": achse, "flach": flach, "auf": auf, "ab": ab})
    KLAPPEN.append({"leer": e, "teile": teile, "auf": auf, "ab": ab})
    return e


KLAPPEN = []


def drehpunkt_2d(a0, b0, a1, b1):
    """Fixpunkt der ebenen Drehung, die die Strecke (a0,b0) auf (a1,b1) bringt. Punkte als (u,v); gibt (Punkt, Winkel)."""
    ang0 = math.atan2(b0[1] - a0[1], b0[0] - a0[0]); ang1 = math.atan2(b1[1] - a1[1], b1[0] - a1[0])
    th = ang1 - ang0
    th = (th + math.pi) % (2 * math.pi) - math.pi
    c, s = math.cos(th), math.sin(th)
    # a1 = R(a0 - p) + p  ->  (I - R) p = a1 - R a0
    ra = (c * a0[0] - s * a0[1], s * a0[0] + c * a0[1])
    rhs = (a1[0] - ra[0], a1[1] - ra[1])
    m00, m01, m10, m11 = 1 - c, s, -s, 1 - c
    det = m00 * m11 - m01 * m10
    p = ((rhs[0] * m11 - m01 * rhs[1]) / det, (m00 * rhs[1] - m10 * rhs[0]) / det)
    return p, math.degrees(th)


# ---------- Faden und Punkt ----------
def faden_bahn(stuetz, n=400):
    """Weiche Bahn (Catmull-Rom, zentripetal) durch Stützpunkte (x,y) auf dem Bogen. Gibt gleichabständige Punkte zurück."""
    P = [Vector((x, y)) for x, y in stuetz]
    P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]
    roh = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        t0 = 0; t1 = t0 + (p1 - p0).length ** .5; t2 = t1 + (p2 - p1).length ** .5; t3 = t2 + (p3 - p2).length ** .5
        for j in range(40):
            t = t1 + (t2 - t1) * j / 40
            A1 = p0 * ((t1 - t) / (t1 - t0)) + p1 * ((t - t0) / (t1 - t0))
            A2 = p1 * ((t2 - t) / (t2 - t1)) + p2 * ((t - t1) / (t2 - t1))
            A3 = p2 * ((t3 - t) / (t3 - t2)) + p3 * ((t - t2) / (t3 - t2))
            B1 = A1 * ((t2 - t) / (t2 - t0)) + A2 * ((t - t0) / (t2 - t0))
            B2 = A2 * ((t3 - t) / (t3 - t1)) + A3 * ((t - t1) / (t3 - t1))
            roh.append(B1 * ((t2 - t) / (t2 - t1)) + B2 * ((t - t1) / (t2 - t1)))
    roh.append(P[-2])
    L = [0]
    for a, b in zip(roh, roh[1:]):
        L.append(L[-1] + (b - a).length)
    out, j = [], 0
    for i in range(n + 1):
        s = L[-1] * i / n
        while j < len(L) - 2 and L[j + 1] < s:
            j += 1
        k = (s - L[j]) / max(1e-9, L[j + 1] - L[j])
        out.append(roh[j].lerp(roh[j + 1], k))
    return out, L[-1]


def faden(name, bahn, breite=.05, hoehe=.0035):
    """Flaches rotes Band auf dem Papier entlang der Bahn."""
    me = bpy.data.meshes.new(name); ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    v, f = [], []
    for i, p in enumerate(bahn):
        a = bahn[max(0, i - 1)]; b = bahn[min(len(bahn) - 1, i + 1)]
        t = (b - a).normalized(); nrm = Vector((-t.y, t.x))
        v += [(p.x + nrm.x * breite / 2, p.y + nrm.y * breite / 2, hoehe), (p.x - nrm.x * breite / 2, p.y - nrm.y * breite / 2, hoehe)]
        if i:
            f.append([2 * i - 2, 2 * i - 1, 2 * i + 1, 2 * i])
    me.from_pydata(v, [], f); me.update()
    for p in me.polygons:
        if p.normal.z < 0:
            p.flip()
    me.materials.append(material("Rot", PAL["rot"], rau=.6))
    ob["neubau_rolle"] = "faden"
    return ob


# ---------- Schiene (Faden): Bahn mit stetiger Krümmung, Anschluss an Szenen und Übergänge über „Tore“ ----------
# Eine Bahn ist ein offener kubischer B-Spline (C2: Tangente und Krümmung überall stetig). An den Toren (Eingang/Ausgang einer Szene)
# liegen die ersten bzw. letzten drei Kontrollpunkte auf einer Geraden durch den Torpunkt in Torrichtung: dort ist die Krümmung exakt 0.
# Zwei Bahnen, die an einem Tor mit gleichem Punkt und gleicher Richtung enden/beginnen, gehen damit mit gleicher Richtung UND gleicher
# Krümmung (0) ineinander über (G2). Richtung in Grad: 0 = nach +y, 90 = nach +x.
SCHIENE = {"grau": "#c3cad6", "breit": .06, "hoehe": .0022}   # kühles Grau aus der Palette, heller und breiter als die Bau-Linien


def richtung_vektor(grad):
    h = math.radians(grad)
    return Vector((math.sin(h), math.cos(h)))


def tor_kontrolle(punkt, richtung_grad, schritt=1.6):
    """Drei Kontrollpunkte auf der Geraden durch punkt in Richtung richtung_grad (Mitte = Torpunkt)."""
    p = Vector(punkt); d = richtung_vektor(richtung_grad) * schritt
    return [p - d, p, p + d]


def bahn_g2(tor_ein, tor_aus, innen=(), schritt=1.6, n=600, dicht=48):
    """Bahn von Tor 1 nach Tor 2. tor_*: ((x, y), richtung_grad). innen: Kontrollpunkte dazwischen (ohne Gewähr, dass die Bahn durch
    sie läuft: ein B-Spline bleibt innerhalb des Kontrollpolygons). Gibt (Punkte (Vector, gleichabständig), Krümmung je Punkt (1/Einheit,
    vorzeichenbehaftet, links positiv), Länge) zurück."""
    a = tor_kontrolle(tor_ein[0], tor_ein[1], schritt)
    b = tor_kontrolle(tor_aus[0], tor_aus[1], schritt)
    C = a + [Vector(p) for p in innen] + b
    pts, kap = [], []
    def auswerten(P0, P1, P2, P3, t):
        p = ((-P0 + 3 * P1 - 3 * P2 + P3) * t ** 3 + (3 * P0 - 6 * P1 + 3 * P2) * t ** 2 + (-3 * P0 + 3 * P2) * t + (P0 + 4 * P1 + P2)) / 6
        d1 = ((-P0 + 3 * P1 - 3 * P2 + P3) * (3 * t ** 2) + (3 * P0 - 6 * P1 + 3 * P2) * (2 * t) + (-3 * P0 + 3 * P2)) / 6
        d2 = ((-P0 + 3 * P1 - 3 * P2 + P3) * (6 * t) + (3 * P0 - 6 * P1 + 3 * P2) * 2) / 6
        k = (d1.x * d2.y - d1.y * d2.x) / max(1e-12, d1.length ** 3)
        return p, k
    for i in range(len(C) - 3):
        for j in range(dicht):
            p, k = auswerten(*C[i:i + 4], j / dicht)
            pts.append(p); kap.append(k)
    p, k = auswerten(*C[-4:], 1.0)
    pts.append(p); kap.append(k)
    L = [0]
    for u, v in zip(pts, pts[1:]):
        L.append(L[-1] + (v - u).length)
    out, kout, j = [], [], 0
    for i in range(n + 1):
        s = L[-1] * i / n
        while j < len(L) - 2 and L[j + 1] < s:
            j += 1
        f = (s - L[j]) / max(1e-9, L[j + 1] - L[j])
        out.append(pts[j].lerp(pts[j + 1], f)); kout.append(kap[j] + (kap[j + 1] - kap[j]) * f)
    return out, kout, L[-1]


def bahn_bericht(bahn, kap, laenge):
    """Messwerte einer Bahn: Richtung und Krümmung an beiden Enden, größte Krümmung, größte Krümmungsänderung je Einheit, Wendepunkte
    (Vorzeichenwechsel der Krümmung außerhalb eines Rauschbands), kleinster Radius."""
    n = len(bahn) - 1
    rich = lambda i: math.degrees(math.atan2((bahn[min(n, i + 1)] - bahn[max(0, i - 1)]).x, (bahn[min(n, i + 1)] - bahn[max(0, i - 1)]).y))
    ds = laenge / n
    dk = max(abs(kap[i + 1] - kap[i]) / ds for i in range(n))
    vz = [k for k in kap if abs(k) > 2e-3]
    wende = sum(1 for a, b in zip(vz, vz[1:]) if a * b < 0)
    return {"richtung_anfang": round(rich(0), 3), "richtung_ende": round(rich(n), 3), "kruemmung_anfang": round(kap[0], 6), "kruemmung_ende": round(kap[-1], 6),
            "kruemmung_max": round(max(abs(k) for k in kap), 4), "dkruemmung_max": round(dk, 4), "wendepunkte": wende,
            "radius_min": round(1 / max(1e-9, max(abs(k) for k in kap)), 3), "laenge": round(laenge, 3)}


def schiene(name, bahn, breite=None, hoehe=None):
    """Flache Bahn auf dem Papier (nicht erhaben): ein Band mit Attribut _s (Bogenlänge ab Bahnanfang, in Einheiten). Der Abspieler färbt
    es nach dem Scrollfortschritt: hinter dem Punkt rot, davor kühles Grau (Material-Extras neubau.schiene)."""
    breite = breite or SCHIENE["breit"]; hoehe = hoehe or SCHIENE["hoehe"]
    me = bpy.data.meshes.new(name); ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    v, f, s_attr = [], [], []
    s = 0.0
    for i, p in enumerate(bahn):
        a = bahn[max(0, i - 1)]; b = bahn[min(len(bahn) - 1, i + 1)]
        t = (b - a).normalized(); nrm = Vector((-t.y, t.x))
        if i: s += (p - bahn[i - 1]).length
        v += [(p.x + nrm.x * breite / 2, p.y + nrm.y * breite / 2, hoehe), (p.x - nrm.x * breite / 2, p.y - nrm.y * breite / 2, hoehe)]
        s_attr += [s, s]
        if i:
            f.append([2 * i - 2, 2 * i - 1, 2 * i + 1, 2 * i])
    me.from_pydata(v, [], f); me.update()
    for p in me.polygons:
        if p.normal.z < 0:
            p.flip()
    at = me.attributes.new("_s", "FLOAT", "POINT"); at.data.foreach_set("value", s_attr)
    me.materials.append(material("Schiene", SCHIENE["grau"], unbeleuchtet=True, extra={"schiene": True, "grau": SCHIENE["grau"], "rot": PAL["rot"]}))
    ob.visible_shadow = False
    ob["neubau_rolle"] = "schiene"
    ob["neubau_schiene"] = json.dumps({"laenge": round(s, 5)})
    return ob


def faden_pruefkoerper(bahn, breite):
    """Unsichtbarer Prüfkörper: das Fadenband als Wand bis 0,6 hoch. Was ihn schneidet, liegt auf dem Faden."""
    me = bpy.data.meshes.new("Pruef_Faden"); ob = bpy.data.objects.new("Pruef_Faden", me); bpy.context.scene.collection.objects.link(ob)
    bm = bmesh.new()
    pts = bahn[::2]
    vs = []
    for i, p in enumerate(pts):
        a = pts[max(0, i - 1)]; b = pts[min(len(pts) - 1, i + 1)]
        t = (b - a).normalized(); nrm = Vector((-t.y, t.x)) * (breite / 2)
        vs.append([bm.verts.new((p.x + nrm.x, p.y + nrm.y, .0005)), bm.verts.new((p.x - nrm.x, p.y - nrm.y, .0005)),
                   bm.verts.new((p.x - nrm.x, p.y - nrm.y, .6)), bm.verts.new((p.x + nrm.x, p.y + nrm.y, .6))])
    for a, b in zip(vs, vs[1:]):
        for k in range(4):
            bm.faces.new([a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k]])
    bm.to_mesh(me); bm.free()
    ob.hide_render = True
    ob["neubau_pruef"] = True
    return ob


def punkt(name, bahn, laenge, s_von_f, r=.085, erscheint=None):
    """Roter Punkt, flach auf der Schiene. s_von_f(frame) -> Anteil 0..1 der Bahn. erscheint=(f0, f1): wächst in diesem Zeitfenster aus
    dem Papier (Radius 0 -> r, wie ein Tintenpunkt); sonst von Anfang an da."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=r, depth=.012, location=(0, 0, .006))
    ob = bpy.context.object; ob.name = name
    bpy.ops.object.shade_auto_smooth() if hasattr(bpy.ops.object, "shade_auto_smooth") else None
    ob.data.materials.append(material("Rot", PAL["rot"], rau=.6))
    n = len(bahn) - 1
    def fn(f):
        s = min(1, max(0, s_von_f(f))) * n
        i = min(n - 1, int(s)); k = s - i
        p = bahn[i].lerp(bahn[i + 1], k)
        v = {"loc": Vector((p.x, p.y, .007))}
        if erscheint:
            g = max(1e-3, fenster(f, *erscheint)); v["scale"] = Vector((g, g, 1))
        return v
    bewegung(ob, fn)
    ob["neubau_rolle"] = "punkt"
    return ob


# ---------- Kamera ----------
def kamera_orientierung(neigung, gier):
    """Neigung (Grad nach unten), Gier (Grad, 0 = Blick nach +y). Kein Rollen: Euler (90-Neigung, 0, Gier)."""
    return Euler((math.radians(90 - neigung), 0, math.radians(gier)), "XYZ")


def rahmen(punkte, neigung, gier, vfov, aspekt, rand=.08, rand_v=None, lage_v=.5, lage_h=.5, x_fest=None):
    """Kamera so nah wie möglich, dass alle Punkte im Bild liegen (Rand als Anteil der halben Bildbreite/-höhe).
    lage_v/lage_h: wo der Inhalt im freien Spielraum sitzt (0 = unten/links, 1 = oben/rechts). Geschlossene Lösung,
    weil jede Bedingung linear in der Kameraposition ist."""
    R = kamera_orientierung(neigung, gier).to_matrix()
    r = R @ Vector((1, 0, 0)); u = R @ Vector((0, 1, 0)); fw = R @ Vector((0, 0, -1))
    tV = math.tan(math.radians(vfov) / 2) * (1 - (rand_v if rand_v is not None else rand))
    tH = math.tan(math.radians(vfov) / 2) * aspekt * (1 - rand)
    px = [p.dot(r) for p in punkte]; py = [p.dot(u) for p in punkte]; pz = [p.dot(fw) for p in punkte]
    Ah = min(a + tH * c for a, c in zip(px, pz)); Bh = max(a - tH * c for a, c in zip(px, pz))
    Av = min(b + tV * c for b, c in zip(py, pz)); Bv = max(b - tV * c for b, c in zip(py, pz))
    z = min((Ah - Bh) / (2 * tH), (Av - Bv) / (2 * tV))
    if x_fest is not None:
        # Kamera seitlich fest über der Lesestelle (keine Scherung der Zeilen); der Bildausschnitt wird stattdessen seitlich
        # verschoben (Objektivverschiebung, Bildebene bleibt parallel). Gesucht: größtes z, bei dem die Spanne der
        # Bildkoordinaten u = (px - x) / (pz - z) in die Bildbreite passt und die Höhe passt.
        x = x_fest
        zv = (Av - Bv) / (2 * tV)
        def spanne(zz):
            us = [(a - x) / (c - zz) for a, c in zip(px, pz)]
            return min(us), max(us)
        lo, hi = zv - 200, min(min(pz) - 1e-3, zv)
        for _ in range(80):
            mid = (lo + hi) / 2
            a_, b_ = spanne(mid)
            if b_ - a_ <= 2 * tH: lo = mid
            else: hi = mid
        z = lo
        a_, b_ = spanne(z)
        tH0 = math.tan(math.radians(vfov) / 2) * aspekt
        verschiebung = ((a_ + b_) / 2) / tH0      # NDC-Verschiebung (1 = halbe Bildbreite)
        y = (Bv + tV * z) + ((Av - tV * z) - (Bv + tV * z)) * (1 - lage_v)
        return r * x + u * y + fw * z, verschiebung
    # Spielraum: x in [Bh + tH z, Ah - tH z]; Inhalt rechts im Bild heißt Kamera links -> lage_h spiegeln
    x = (Bh + tH * z) + ((Ah - tH * z) - (Bh + tH * z)) * (1 - lage_h)
    y = (Bv + tV * z) + ((Av - tV * z) - (Bv + tV * z)) * (1 - lage_v)
    return r * x + u * y + fw * z, 0.0


def kamera(name, vfov):
    cd = bpy.data.cameras.new(name); cd.sensor_fit = "VERTICAL"; cd.angle_y = math.radians(vfov)
    cd.clip_start = .1; cd.clip_end = 250
    ob = bpy.data.objects.new(name, cd); bpy.context.scene.collection.objects.link(ob)
    ob.rotation_mode = "XYZ"
    return ob


# ---------- Kamerafahrt: EINE durchgehende Bewegung (DREHBUCH, Kamera „Eine einzige Kamerabewegung“) ----------
# Die Einstellungen der Szenendatei sind Stützposen (Durchgangsposen) bei bestimmten Bildern, keine Standbilder. Ort, Neigung, Gier und
# Bildverschiebung laufen als eine C2-Kurve (kubischer Spline; bei Anschlüssen mit vorgegebener Tangente und Beschleunigung 0 am Anschluss)
# durch alle Stützposen. Die Zeit läuft über die Bogenlänge dieser Kurve mit einem stetigen Tempoprofil: an Lesestellen („zeitlupe“) deutlich
# langsamer, aber nie null; das Tempo ist das mit einem C1-Kern geglättete mittlere Tempo der Spannen, ohne Stufen und ohne Hügel je Spanne.
# Nie Rollen: nur Neigung und Gier. Anschluss an Übergänge: ein/aus = (Richtung_grad, Tempo) legen Anfangs-/Endgeschwindigkeit fest (Bewegung
# entlang der Fadenrichtung, Drehraten 0); ohne Angabe läuft die Kamera am Seitenanfang aus der Ruhe an bzw. am Seitenende in die Ruhe aus.
KAMERA_MASS = {"grad": .08, "shift": 3.0}      # Gewicht von Winkeln (Einheiten je Grad) und Bildverschiebung (Einheiten je NDC) in der Bogenlänge der Fahrt


def _loese(A, B):
    """Lineares Gleichungssystem A x = b für mehrere rechte Seiten (Gauß mit Spaltenpivot). B: Liste von rechten Seiten."""
    n = len(A)
    M = [list(A[i]) + [b[i] for b in B] for i in range(n)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            f = M[r][c] / M[c][c]
            for k in range(c, len(M[r])):
                M[r][k] -= f * M[c][k]
    X = [[0.0] * n for _ in B]
    for j in range(len(B)):
        for i in range(n - 1, -1, -1):
            X[j][i] = (M[i][n + j] - sum(M[i][k] * X[j][k] for k in range(i + 1, n))) / M[i][i]
    return X


class Kurve:
    """C2-Kurve durch Stützpunkte Y_i (Listen) bei Parametern t_i. d_ein/d_aus: Ableitung nach t am Anfang/Ende (sonst natürlicher Rand).
    Ist eine Ableitung vorgegeben, ist die erste/letzte Spanne ein Quintik-Hermite mit Beschleunigung 0 am Rand und den Werten (Ort, Tangente,
    Beschleunigung) des Splines am inneren Ende: die Beschleunigung am Anschluss ist 0, die Kurve überall C2."""

    def __init__(self, t, Y, d_ein=None, d_aus=None):
        n = len(t) - 1
        self.t, self.Y, self.n, self.dim = t, Y, n, len(Y[0])
        h = [t[i + 1] - t[i] for i in range(n)]
        self.h = h
        A = [[0.0] * (n + 1) for _ in range(n + 1)]
        B = [[0.0] * (n + 1) for _ in range(self.dim)]
        for k in range(self.dim):
            y = [p[k] for p in Y]
            if d_ein is None:
                A[0][0] = 1.0; B[k][0] = 0.0
            else:
                A[0][0] = 2 * h[0]; A[0][1] = h[0]; B[k][0] = 6 * ((y[1] - y[0]) / h[0] - d_ein[k])
            if d_aus is None:
                A[n][n] = 1.0; B[k][n] = 0.0
            else:
                A[n][n - 1] = h[n - 1]; A[n][n] = 2 * h[n - 1]; B[k][n] = 6 * (d_aus[k] - (y[n] - y[n - 1]) / h[n - 1])
            for i in range(1, n):
                A[i][i - 1] = h[i - 1]; A[i][i] = 2 * (h[i - 1] + h[i]); A[i][i + 1] = h[i]
                B[k][i] = 6 * ((y[i + 1] - y[i]) / h[i] - (y[i] - y[i - 1]) / h[i - 1])
        # A ändert sich nicht je Komponente: die Zeilen 0 und n hängen nur von d_ein/d_aus ab (Struktur gleich), nur B unterscheidet sich
        self.M = _loese(A, B)       # M[k][i]: zweite Ableitung der Komponente k am Stützpunkt i
        self.quint = {}
        if d_ein is not None:
            self.quint[0] = self._quintik(0, True, d_ein)
        if d_aus is not None:
            self.quint[n - 1] = self._quintik(n - 1, False, d_aus)

    def _kubisch(self, i, t):
        h = self.h[i]; a = (self.t[i + 1] - t) / h; b = (t - self.t[i]) / h
        X, V, W = [], [], []
        for k in range(self.dim):
            y0, y1 = self.Y[i][k], self.Y[i + 1][k]; m0, m1 = self.M[k][i], self.M[k][i + 1]
            X.append(a * y0 + b * y1 + ((a ** 3 - a) * m0 + (b ** 3 - b) * m1) * h * h / 6)
            V.append((y1 - y0) / h - (3 * a * a - 1) / 6 * h * m0 + (3 * b * b - 1) / 6 * h * m1)
            W.append(a * m0 + b * m1)
        return X, V, W

    def _quintik(self, i, anfang, d):
        """Randwerte der Quintik-Hermite-Spanne i: am Rand (d, Beschleunigung 0), am inneren Ende die Werte des Splines."""
        h = self.h[i]
        if anfang:
            inner = self._kubisch(i + 1, self.t[i + 1]) if i + 1 < self.n else ([*self.Y[i + 1]], [(self.Y[i + 1][k] - self.Y[i][k]) / h for k in range(self.dim)], [0.0] * self.dim)
            return (self.Y[i], d, [0.0] * self.dim, *inner)
        inner = self._kubisch(i - 1, self.t[i]) if i - 1 >= 0 else ([*self.Y[i]], [(self.Y[i + 1][k] - self.Y[i][k]) / h for k in range(self.dim)], [0.0] * self.dim)
        return (*inner, self.Y[i + 1], d, [0.0] * self.dim)

    def __call__(self, t):
        """(Ort, 1. Ableitung, 2. Ableitung) bei Parameter t."""
        t = min(self.t[-1], max(self.t[0], t))
        i = next((j for j in range(self.n) if t < self.t[j + 1]), self.n - 1)
        if i in self.quint:
            p0, v0, a0, p1, v1, a1 = self.quint[i]
            h = self.h[i]; u = (t - self.t[i]) / h
            c = [(1, 0, 0, -10, 15, -6), (0, 1, 0, -6, 8, -3), (0, 0, .5, -1.5, 1.5, -.5), (0, 0, 0, 10, -15, 6), (0, 0, 0, -4, 7, -3), (0, 0, 0, .5, -1, .5)]
            def pe(co, d):
                s = 0.0
                for e, a in enumerate(co):
                    if e >= d and a:
                        f = 1.0
                        for q in range(d): f *= (e - q)
                        s += a * f * u ** (e - d)
                return s
            X, V, W = [], [], []
            for k in range(self.dim):
                g = (p0[k], v0[k] * h, a0[k] * h * h, p1[k], v1[k] * h, a1[k] * h * h)
                X.append(sum(g[j] * pe(c[j], 0) for j in range(6)))
                V.append(sum(g[j] * pe(c[j], 1) for j in range(6)) / h)
                W.append(sum(g[j] * pe(c[j], 2) for j in range(6)) / (h * h))
            return X, V, W
        return self._kubisch(i, t)


def _fensterbump(f, f0, halb, rampe):
    """1 innerhalb von f0 ± halb, danach weich (C2) auf 0 über rampe Bilder."""
    d = abs(f - f0) - halb
    return 1.0 if d <= 0 else (0.0 if d >= rampe else 1 - smm(d / rampe))


def kamerafahrt(cam, einstellungen, frames, aspekt=16 / 9, ein=None, aus=None, zeitlupe=(), sub=8):
    """Eine durchgehende Kamerafahrt durch die Stützposen. einstellungen: Liste mit {name, bild (Durchgangsbild), ort (Vector), neigung, gier,
    verschiebung}; erstes Bild 0, letztes `frames`. ein/aus: None oder (richtung_grad, tempo): Bewegung entlang der Fadenrichtung mit diesem Tempo
    (Einheiten je Bild), Drehraten 0. zeitlupe: Lesestellen als Liste (von, bis, faktor, rampe): zwischen den Bildern von und bis läuft die Fahrt mit dem
    Tempofaktor (< 1), davor und danach weich (C2) über rampe Bilder hinein und heraus; nie null. Gibt einen Bericht zurück: tempo je Bild, Stationen,
    pose je Bild."""
    E = sorted(einstellungen, key=lambda e: e["bild"])
    assert E[0]["bild"] == 0 and E[-1]["bild"] == frames, f"Stützposen müssen bei Bild 0 und {frames} beginnen/enden ({E[0]['bild']}, {E[-1]['bild']})"
    kg, ks = KAMERA_MASS["grad"], KAMERA_MASS["shift"]
    gier = []
    for e in E:
        g = e["gier"]
        if gier: g = gier[-1] + ((g - gier[-1] + 180) % 360 - 180)
        gier.append(g)
    Y = [[e["ort"].x, e["ort"].y, e["ort"].z, e["neigung"] * kg, g * kg, e.get("verschiebung", 0) * ks] for e, g in zip(E, gier)]
    t = [0.0]
    for p, q in zip(Y, Y[1:]):
        t.append(t[-1] + math.sqrt(sum((a - b) ** 2 for a, b in zip(p, q))))
    def tangente(spec):
        if spec is None: return None
        r = richtung_vektor(spec[0])
        return [r.x, r.y, 0, 0, 0, 0]
    k = Kurve(t, Y, d_ein=tangente(ein), d_aus=tangente(aus))
    # Bogenlänge dicht abtasten und an den Stützposen ablesen
    N = 6000
    ts = [t[-1] * i / N for i in range(N + 1)]
    S = [0.0]
    prev = k(ts[0])[0]
    for tt in ts[1:]:
        X = k(tt)[0]
        S.append(S[-1] + math.sqrt(sum((a - b) ** 2 for a, b in zip(prev, X)))); prev = X
    def t_von_s(s):
        s = min(S[-1], max(0.0, s))
        lo, hi = 0, N
        while hi - lo > 1:
            m = (lo + hi) // 2
            if S[m] <= s: lo = m
            else: hi = m
        w = (s - S[lo]) / max(1e-12, S[hi] - S[lo])
        return ts[lo] + (ts[hi] - ts[lo]) * w
    sig = []
    for tt in t:
        j = min(N, max(0, round(tt / t[-1] * N)))
        sig.append(S[j])
    # Tempoprofil: v(f) = c(f) * B(f). c = Zeitlupe an den Lesestellen (weich hinein und heraus), B = mittleres Tempo der Spannen zwischen den Stützposen,
    # an den Spannengrenzen mit smootherstep überblendet (keine Tempostufen, keine Hügel je Spanne). Die Spannentempi werden
    # iterativ so bestimmt, dass jede Stützpose genau im vorgegebenen Bild erreicht wird. Am Anfang und Ende geht v mit smootherstep in das
    # Anschlusstempo (oder 0 am Seitenrand) über; dort ist die Beschleunigung 0.
    import numpy as np
    W = 40                                                   # größte Halbbreite des weichen Übergangs zwischen zwei Spannen in Bildern
    T0 = 36                                                  # Länge des Einlaufs und Auslaufs in Bildern
    fs = [e["bild"] for e in E]
    M = frames * sub
    fm = (np.arange(M) + .5) / sub                           # Bildzeit der Teilschritte (Mittelpunkte)
    seg = np.clip(np.searchsorted(fs, fm, side="right") - 1, 0, len(E) - 2)
    c = np.array([1.0] * M)
    for von, bis, z, rampe in zeitlupe:                      # überlappende Zeitlupen: die langsamere gilt
        mitte, halb = (von + bis) / 2, (bis - von) / 2
        d = np.abs(fm - mitte) - halb
        x = np.clip(d / rampe, 0, 1)
        bump = 1 - x ** 3 * (x * (x * 6 - 15) + 10)
        c = np.minimum(c, 1 - (1 - z) * bump)
    v_ein = ein[1] if ein else 0.0
    v_aus = aus[1] if aus else 0.0
    sm5 = lambda u: u * u * u * (u * (u * 6 - 15) + 10)
    e_ein = np.where(fm < T0, sm5(np.clip(fm / T0, 0, 1)), 1.0)
    e_aus = np.where(fm > frames - T0, sm5(np.clip((frames - fm) / T0, 0, 1)), 1.0)
    nseg = len(E) - 1
    Tn = np.array([fs[i + 1] - fs[i] for i in range(nseg)], dtype=float)
    wb = [None] + [min(W, .45 * min(Tn[i - 1], Tn[i])) for i in range(1, nseg)]    # Breite des weichen Übergangs an jeder Spannengrenze
    D = np.array([sig[i + 1] - sig[i] for i in range(len(E) - 1)])
    Tn = np.array([fs[i + 1] - fs[i] for i in range(len(E) - 1)], dtype=float)
    kk = D / Tn                                              # Anfangswerte: mittleres Tempo je Spanne
    def profil(kk):
        B = kk[seg].astype(float)
        for i in range(1, nseg):    # an der Grenze zwischen Spanne i-1 und i weich (smootherstep, C2) vom einen zum anderen Tempo
            w = wb[i]
            m = (fm > fs[i] - w) & (fm < fs[i] + w)
            B[m] = kk[i - 1] + (kk[i] - kk[i - 1]) * sm5((fm[m] - (fs[i] - w)) / (2 * w))
        v = c * B
        v = v_ein + (v - v_ein) * e_ein                      # Einlauf aus dem Anschlusstempo (oder aus der Ruhe)
        v = v_aus + (v - v_aus) * e_aus
        return v
    for _ in range(200):
        v = profil(kk)
        ist = np.array([v[seg == i].sum() / sub for i in range(nseg)])
        kk = kk * np.clip(D / np.maximum(ist, 1e-9), .7, 1.4)
        if np.max(np.abs(ist - D) / D) < 2e-5: break
    v = profil(kk)
    warnungen = []
    ist = np.array([v[seg == i].sum() / sub for i in range(len(E) - 1)])
    if np.max(np.abs(ist - D) / D) > 1e-3: warnungen.append(f"Stützposen werden nur auf {np.max(np.abs(ist - D) / D) * 100:.2f} % genau erreicht")
    cum = np.concatenate([[0.0], np.cumsum(v) / sub])
    sigma = [float(cum[f * sub]) for f in range(frames + 1)]    # Bogenlänge der Fahrt je Bild
    pose = []
    for f in range(frames + 1):
        X, V, W = k(t_von_s(sigma[f]))
        pose.append({"loc": Vector((X[0], X[1], X[2])), "neigung": X[3] / kg, "gier": X[4] / kg, "verschiebung": X[5] / ks})
    # Kameratempo = bildwirksames Tempo: Ort plus gewichtete Neigung, Gier und Bildverschiebung (dasselbe Maß wie die Bogenlänge der Fahrt);
    # tempo_pos ist nur der Weg des Kameraorts
    tempo = [math.sqrt((pose[f + 1]["loc"] - pose[f]["loc"]).length ** 2 + (kg * (pose[f + 1]["neigung"] - pose[f]["neigung"])) ** 2 + (kg * (pose[f + 1]["gier"] - pose[f]["gier"])) ** 2
                       + (ks * (pose[f + 1]["verschiebung"] - pose[f]["verschiebung"])) ** 2) for f in range(frames)]
    tempo_pos = [(pose[f + 1]["loc"] - pose[f]["loc"]).length for f in range(frames)]
    bericht = {"warnungen": warnungen, "tempo": tempo, "tempo_pos": tempo_pos, "ein_tempo": ein[1] if ein else 0, "aus_tempo": aus[1] if aus else 0, "laenge": S[-1], "pose": pose,
               "stationen": [{"name": e["name"], "bild": e["bild"], "tempo": round(tempo[min(frames - 1, e["bild"])], 5), "zeitlupe": None} for e in E]}
    def fn(f):
        z = pose[f]
        return {"loc": z["loc"].copy(), "rot": kamera_orientierung(z["neigung"], z["gier"]), "shift": z["verschiebung"] * aspekt / 2}
    bewegung(cam, fn)
    cam["neubau_verschiebung"] = json.dumps([round(z["verschiebung"], 5) for z in pose])
    return bericht


def fahrt_kennwerte(bericht, ohne_rand=30):
    """Kennzahlen der Fahrt für die Prüfung im Baubefehl: kleinstes/größtes Tempo (ohne die ersten/letzten Bilder am Seitenrand, wo aus der
    Ruhe angelaufen wird), größte Beschleunigung und Ruck (Einheiten je Bild² bzw. ³), Tempo am Anfang und Ende."""
    v = bericht["tempo"]
    lo = 0 if bericht["ein_tempo"] else ohne_rand
    hi = len(v) if bericht["aus_tempo"] else len(v) - ohne_rand
    vv = v[lo:hi]
    a = [vv[i + 1] - vv[i] for i in range(len(vv) - 1)]
    j = [a[i + 1] - a[i] for i in range(len(a) - 1)]
    # Ruck als Vektor (Ort): dritte Differenz der Positionen; so zählt auch ein Knick der Fahrtrichtung
    P = [z["loc"] for z in bericht["pose"]]
    lo_p, hi_p = (0 if bericht["ein_tempo"] else ohne_rand), (len(P) if bericht["aus_tempo"] else len(P) - ohne_rand)
    P = P[lo_p:hi_p]
    acc3 = [P[i + 1] - 2 * P[i] + P[i - 1] for i in range(1, len(P) - 1)]
    jv = [(acc3[i + 1] - acc3[i]).length for i in range(len(acc3) - 1)]
    aj = sorted(jv)
    p98 = aj[min(len(aj) - 1, int(len(aj) * .98))]
    jb = max(range(len(jv)), key=lambda i: jv[i])
    j = [jv[jb]] if False else j
    return {"ruck_max_bei": lo_p + jb + 2, "ruck_vektor_max": round(max(jv), 6), "ruck_ausreisser": round(max(aj) / max(1e-12, p98), 2), "tempo_min_bei": lo + vv.index(min(vv)), "tempo_min": round(min(vv), 5), "tempo_max": round(max(vv), 5), "beschleunigung_max": round(max(abs(x) for x in a), 6), "ruck_max": round(max(abs(x) for x in j), 6),
            "tempo_anfang": round(v[0], 5), "tempo_ende": round(v[-1], 5), "stationen": bericht["stationen"], "warnungen": bericht["warnungen"]}


# ---------- Konstruktionsphase (DREHBUCH 5, Frage 2, Erik 23.10.: in jeder Szene dieselbe Abfolge, gestrafft) ----------
# Abfolge: Schnitt- und Falzlinien auf dem Bogen -> Raster -> Gerüst im Raum -> Bleistiftspur auf den Flächen -> Hochklappen.
# Alle Bau-Linien sind dünne Streifen (Papierstriche) mit Zeit-Attributen je Ecke:
#   _ein  Bild, ab dem der Strich an dieser Stelle sichtbar ist (Anfang -> Ende des Strichs: er zeichnet sich)
#   _aus  Bild, ab dem er ausblendet (BAU["aus_dauer"] Bilder lang), 1e5 = bleibt
#   _deck Deckkraft
# Ein Material („Bau_Tinte“) wertet das gegen die Bildnummer aus: in Blender per Treiber, im Browser per Uniform (seite/abspieler.js).
BAU = {"tinte": "#2a3a58", "breite": .022, "aus_dauer": 10, "zeichnen": .8}   # Tinte kräftig (dunkles Blaugrau), Striche breit genug für die Entfernung der Übersichtseinstellungen
_BAU_MAT = []


def bau_material():
    if _BAU_MAT:
        return _BAU_MAT[0]
    m = bpy.data.materials.new("Bau_Tinte")
    m.use_nodes = True; m.surface_render_method = "BLENDED"; m.use_backface_culling = False
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    fr = _frame_wert(nt)
    def attr(n):
        a = nt.nodes.new("ShaderNodeAttribute"); a.attribute_type = "GEOMETRY"; a.attribute_name = n; return a.outputs["Fac"]
    def op(o, a, b=None, clamp=False):
        n = nt.nodes.new("ShaderNodeMath"); n.operation = o; n.use_clamp = clamp
        for i, v in enumerate((a, b)):
            if v is None: continue
            if isinstance(v, (int, float)): n.inputs[i].default_value = v
            else: nt.links.new(v, n.inputs[i])
        return n.outputs[0]
    # an = clamp((frame - ein) / zeichnen), weg = clamp((frame - aus) / aus_dauer)
    an = op("DIVIDE", op("SUBTRACT", fr, attr("_ein")), BAU["zeichnen"], clamp=True)
    weg = op("DIVIDE", op("SUBTRACT", fr, attr("_aus")), BAU["aus_dauer"], clamp=True)
    alpha = op("MULTIPLY", op("MULTIPLY", an, op("SUBTRACT", 1.0, weg)), attr("_deck"), clamp=True)
    em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Color"].default_value = lin(BAU["tinte"]); em.inputs["Strength"].default_value = 1
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(alpha, mix.inputs[0]); nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    m["neubau"] = json.dumps({"bau": True, "tinte": BAU["tinte"], "zeichnen": BAU["zeichnen"], "aus_dauer": BAU["aus_dauer"]})
    _BAU_MAT.append(m)
    return m


class Konstruktion:
    """Sammelt die Bau-Linien einer Szene und baut daraus Meshes (eins in Weltlage, eins je bewegtem Teil)."""

    def __init__(self, name="Bau", skala=1.0):
        self.name = name
        self.skala = skala   # Strichbreite je Anordnung (am Handy sind die Übersichtsbilder kleiner: dickere Striche)
        self.striche = {}   # eltern-Name (oder None) -> Liste
        self.flaechen = []  # gefüllte Polygone (Abdruck), in Weltlage

    def strich(self, A, B, ein, dauer, deck, aus=1e5, normal=None, breite=None, eltern=None):
        self.striche.setdefault(eltern.name if eltern else None, []).append(
            (Vector(A), Vector(B), ein, dauer, deck, aus, Vector(normal) if normal is not None else None, (breite or BAU["breite"]) * self.skala))

    def bauen(self):
        obs = []
        for en, S in self.striche.items():
            me = bpy.data.meshes.new(f"{self.name}_{en or 'Welt'}")
            ob = bpy.data.objects.new(me.name, me); bpy.context.scene.collection.objects.link(ob)
            V, F, ein, aus, deck = [], [], [], [], []
            for A, B, e0, du, dk, au, n, w in S:
                d = (B - A)
                if d.length < 1e-6:
                    continue
                d.normalize()
                if n is not None:
                    quer = [d.cross(n).normalized() * (w / 2)]
                    hub = n.normalized() * .0025
                else:   # frei im Raum: Kreuzquerschnitt, aus jeder Richtung sichtbar
                    a = d.cross(Vector((0, 0, 1)) if abs(d.z) < .9 else Vector((1, 0, 0))).normalized()
                    b = d.cross(a).normalized()
                    quer = [a * (w / 2), b * (w / 2)]
                    hub = Vector()
                for q in quer:
                    i = len(V)
                    V += [A - q + hub, A + q + hub, B + q + hub, B - q + hub]
                    F.append((i, i + 1, i + 2, i + 3))
                    ein += [e0, e0, e0 + du, e0 + du]; aus += [au] * 4; deck += [dk] * 4
            me.from_pydata(V, [], F); me.update()
            for nm, vals in (("_ein", ein), ("_aus", aus), ("_deck", deck)):
                at = me.attributes.new(nm, "FLOAT", "POINT")
                at.data.foreach_set("value", vals)
            me.materials.append(bau_material())
            ob.visible_shadow = False
            ob["neubau_rolle"] = "bau"
            if en:
                eltern = bpy.data.objects[en]
                ob.parent = eltern
                ob.matrix_parent_inverse = Matrix.Identity(4)
            obs.append(ob)
        if self.flaechen:
            me = bpy.data.meshes.new(f"{self.name}_Abdruecke")
            ob = bpy.data.objects.new(me.name, me); bpy.context.scene.collection.objects.link(ob)
            V, F, ein, aus, deck = [], [], [], [], []
            for P, e0, du, dk, z, au in self.flaechen:
                xs = [p.x for p in P]; x0, x1 = min(xs), max(xs)
                i0 = len(V)
                for p in P:   # Einfärben läuft von links nach rechts über die Fläche
                    V.append((p.x, p.y, z)); ein.append(e0 + du * (p.x - x0) / max(1e-6, x1 - x0)); aus.append(au); deck.append(dk)
                for k in range(1, len(P) - 1):
                    F.append((i0, i0 + k, i0 + k + 1))
            me.from_pydata(V, [], F); me.update()
            for nm, vals in (("_ein", ein), ("_aus", aus), ("_deck", deck)):
                at = me.attributes.new(nm, "FLOAT", "POINT"); at.data.foreach_set("value", vals)
            for pl in me.polygons:
                if pl.normal.z < 0: pl.flip()
            me.materials.append(bau_material())
            ob.visible_shadow = False
            ob["neubau_rolle"] = "bau"
            obs.append(ob)
        return obs

    # ----- Hilfen: gestrichelte Linien und Schraffur -----
    def gestrichelt(self, A, B, ein, dauer, deck, muster=(.2, .09), aus=1e5, normal=(0, 0, 1), breite=None, eltern=None):
        """Strichlinie von A nach B, die sich in [ein, ein + dauer] von A nach B zeichnet. muster: (Strich, Lücke) in Einheiten, oder
        (Strich, Lücke, Punkt, Lücke) für Strich-Punkt (Falz)."""
        A, B = Vector(A), Vector(B)
        L = (B - A).length
        if L < 1e-6: return
        d = (B - A) / L
        per = sum(muster); x = 0.0
        while x < L - 1e-6:
            for j in range(0, len(muster), 2):
                a0 = x; a1 = min(L, x + muster[j])
                if a0 >= L: break
                self.strich(A + d * a0, A + d * a1, ein + dauer * a0 / L, max(.01, dauer * (a1 - a0) / L), deck, aus=aus, normal=normal, breite=breite, eltern=eltern)
                x += muster[j] + (muster[j + 1] if j + 1 < len(muster) else 0)
                if x >= L: break

    def schraffur(self, P, abstand, ein, dauer, deck, winkel=45, aus=1e5, breite=.012, z=.0008):
        """Schraffur (parallele Linien) in einem konvexen Polygon P (Liste Vector, Ebene des Bogens). Die Linien zeichnen sich nacheinander."""
        w = math.radians(winkel); d = Vector((math.cos(w), math.sin(w))); nrm = Vector((-d.y, d.x))
        pts = [Vector((p.x, p.y)) for p in P]
        cs = [p.dot(nrm) for p in pts]
        lo, hi = min(cs), max(cs)
        n = max(1, int((hi - lo) / abstand))
        k = 0
        for i in range(1, n + 1):
            c = lo + (hi - lo) * i / (n + 1)
            x = []
            for a, b in zip(pts, pts[1:] + pts[:1]):
                ca, cb = a.dot(nrm), b.dot(nrm)
                if (ca - c) * (cb - c) < 0:
                    t = (c - ca) / (cb - ca); x.append(a.lerp(b, t))
            if len(x) >= 2:
                x.sort(key=lambda q: q.dot(d))
                A, B = x[0] + d * .03, x[-1] - d * .03
                if (B - A).length > .08:
                    self.strich((A.x, A.y, z), (B.x, B.y, z), ein + dauer * k / n, max(.5, dauer / n * 1.5), deck, aus=aus, normal=(0, 0, 1), breite=breite)
                    k += 1

    def flaeche(self, P, ein, dauer, deck, z=.0006, aus=1e5, richtung=(1, 0)):
        """Gefülltes konvexes Polygon (Tintenton, Deckkraft deck), das sich von einer Seite zur anderen (richtung) in [ein, ein + dauer] einfärbt."""
        self.flaechen.append((list(P), ein, dauer, deck, z, aus))

    # ----- Schnitt- und Falzlinien: Umriss jedes Teils in der flachen Lage auf dem Bogen -----
    def schnitt(self, teile, frame_flach, ein0, ein1, ab_klappe, nachbarn=(), deck=.8, abdruck=True):
        """teile: Objekte, die im Bogen liegen und hochklappen. ab_klappe: Name -> Bild, ab dem das Teil den Bogen verlässt: der Schnitt (gestrichelt)
        wird zu einem dünnen Umriss des Abdrucks, der Falz (Strich-Punkt) verschwindet, die Fläche des Abdrucks färbt sich mit Schraffur.
        nachbarn: weitere Umrisse (Grundplatte), an denen ein Falz liegen kann, ohne selbst gezeichnet zu werden."""
        sc = bpy.context.scene; sc.frame_set(frame_flach); bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        umr = {o.name: _umriss_xy(o, dg) for o in list(teile) + list(nachbarn)}
        kanten = {n: [(P[i], P[(i + 1) % len(P)]) for i in range(len(P))] for n, P in umr.items()}
        def ist_falz(n, a, b):
            d = (b - a).normalized()
            for m, K in kanten.items():
                if m == n: continue
                for c, e in K:
                    d2 = (e - c)
                    if d2.length < 1e-6 or abs(d.dot(d2.normalized())) < .999: continue
                    nrm = Vector((-d.y, d.x))
                    if abs((c - a).dot(nrm)) > .08: continue
                    t = sorted([0, (b - a).length]); u = sorted([(c - a).dot(d), (e - a).dot(d)])
                    if min(t[1], u[1]) - max(t[0], u[0]) > .1: return True
            return False
        n = len(teile)
        for i, o in enumerate(teile):
            P = umr[o.name]
            L = sum((P[(j + 1) % len(P)] - P[j]).length for j in range(len(P)))
            t0 = ein0 + (ein1 - ein0) * .55 * (i / max(1, n - 1))
            dur = (ein1 - ein0) * .45
            s = 0
            hoch = ab_klappe.get(o.name, 1e5)
            for j in range(len(P)):
                a, b = P[j], P[(j + 1) % len(P)]
                l = (b - a).length
                e_a = t0 + dur * s / L; e_b = t0 + dur * (s + l) / L; s += l
                # außen neben die Kante legen (Umriss gegen den Uhrzeigersinn: außen = rechts der Laufrichtung)
                d = (b - a).normalized(); aussen = Vector((d.y, -d.x)) * (BAU["breite"] * .5)
                A = Vector((a.x + aussen.x, a.y + aussen.y, .0012)); B = Vector((b.x + aussen.x, b.y + aussen.y, .0012))
                if ist_falz(o.name, a, b):
                    self.gestrichelt(A, B, e_a, e_b - e_a, deck * .9, muster=(.2, .07, .035, .07), aus=hoch, breite=.026)
                else:
                    self.gestrichelt(A, B, e_a, e_b - e_a, deck, muster=(.26, .1), aus=hoch, breite=.03)
                    if abdruck:   # dünner Umriss des Abdrucks, bleibt
                        self.strich(A - Vector((0, 0, .0004)), B - Vector((0, 0, .0004)), hoch if hoch < 1e4 else e_a, 6 if hoch < 1e4 else e_b - e_a, .35, normal=(0, 0, 1), breite=.012)
            if abdruck and hoch < 1e4:
                self.flaeche(P, hoch + 2, 14, .13)
                self.schraffur(P, .16, hoch + 4, 16, .24, breite=.012)
        sc.frame_set(0)

    # ----- Raster: Schneidematte auf dem Bogen, Welle von links nach rechts, blendet nach dem Hochklappen aus -----
    def raster(self, x0, x1, y0, y1, ein0, ein1, aus, schritt=.5, jede=5, deck=(.17, .38)):
        nx = int(round((x1 - x0) / schritt)); ny = int(round((y1 - y0) / schritt))
        span = ein1 - ein0
        for i in range(nx + 1):
            x = x0 + i * schritt
            haupt = i % jede == 0
            self.strich((x, y0, .0007), (x, y1, .0007), ein0 + span * .7 * (i / nx), span * .3, deck[1] if haupt else deck[0], aus=aus + 6 * i / nx, normal=(0, 0, 1), breite=.032 if haupt else .02)
        for j in range(ny + 1):
            y = y0 + j * schritt
            haupt = j % jede == 0
            self.strich((x0, y, .0007), (x1, y, .0007), ein0 + span * .15 * (j / ny), span * .85, deck[1] if haupt else deck[0], aus=aus + 6, normal=(0, 0, 1), breite=.032 if haupt else .02)

    # ----- Gerüst: Kanten der Bauform im Raum, je Kante zwei bis drei Striche mit Überstand, wie von Hand -----
    def geruest(self, teile, ein0, ein1, fertig, deck=.8, frame_bauform=None):
        """fertig: Name -> Bild, an dem das Teil in der Bauform steht (sein Gerüst blendet dann aus)."""
        sc = bpy.context.scene
        if frame_bauform is not None:
            sc.frame_set(frame_bauform)
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        roh = []
        for o in teile:
            ev = o.evaluated_get(dg); me = ev.to_mesh(); mw = ev.matrix_world
            p = max(me.polygons, key=lambda p: p.area)   # Umriss der größten Fläche (bei dünnem Karton reicht eine Seite)
            vs = [mw @ me.vertices[v].co for v in p.vertices]
            for k in range(len(vs)):
                a, b = vs[k], vs[(k + 1) % len(vs)]
                if (b - a).length > .05:
                    roh.append((a.copy(), b.copy(), fertig.get(o.name, ein1)))
            ev.to_mesh_clear()
        gruppen = []
        for a, b, f in roh:
            d = (b - a).normalized()
            m = max(range(3), key=lambda k: abs(d[k]))
            if d[m] < 0: d = -d
            g = next((g for g in gruppen if g["d"].dot(d) > .9995 and (a - g["o"]).cross(g["d"]).length < .045), None)
            if g is None:
                g = {"d": d, "o": a.copy(), "iv": []}; gruppen.append(g)
            t0, t1 = (a - g["o"]).dot(g["d"]), (b - g["o"]).dot(g["d"])
            g["iv"].append([min(t0, t1), max(t0, t1), f])
        E = []
        for g in gruppen:
            g["iv"].sort()
            cur = None
            for iv in g["iv"]:
                if cur and iv[0] <= cur[1] + .03:
                    cur[1] = max(cur[1], iv[1]); cur[2] = max(cur[2], iv[2])
                else:
                    if cur: E.append((g, cur))
                    cur = list(iv)
            if cur: E.append((g, cur))
        E = [(g["o"] + g["d"] * c[0], g["o"] + g["d"] * c[1], g["d"], c[1] - c[0], c[2]) for g, c in E if c[1] - c[0] > .05]
        E.sort(key=lambda e: (e[0].x + e[1].x) / 2 + .15 * (e[0].z + e[1].z) / 2)
        rnd = lambda i, k: (math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1
        n = len(E); du = (ein1 - ein0) * .18
        for i, (A, B, d, L, f) in enumerate(E):
            st = ein0 + (ein1 - ein0 - du * 1.9) * (i / max(1, n - 1))
            n1 = d.cross(Vector((0, 0, 1)) if abs(d.z) < .9 else Vector((1, 0, 0))).normalized(); n2 = d.cross(n1)
            ov = min(.26, .09 + .07 * L)
            aus = f + 4
            self.strich(A - d * ov * (.7 + .6 * rnd(i, 1)), B + d * ov * (.7 + .6 * rnd(i, 2)), st, du, deck, aus=aus, breite=.022)
            off = .036 + .01 * rnd(i, 3)
            self.strich(A + n1 * off * .8 + n2 * off * .4 - d * ov * (.35 + .3 * rnd(i, 4)), B + n1 * off * 1.15 + n2 * off * .55 + d * ov * (.35 + .3 * rnd(i, 5)),
                        st + du * .45, du * .9, deck * .6, aus=aus, breite=.018)
            if L > 1.2:
                self.strich(A + d * L * (.06 + .06 * rnd(i, 6)) - n1 * .028 - n2 * .018, B - d * L * (.08 + .1 * rnd(i, 7)) - n1 * .03 - n2 * .02,
                            st + du * .9, du, deck * .4, aus=aus, breite=.016)
        sc.frame_set(0)
        return len(E)

    # ----- Bleistiftspur: Eckmarken knapp innerhalb der Kanten auf beiden großen Seiten jedes Teils, wandern mit dem Teil -----
    def spur(self, teile, ein, deck=.55):
        """ein: Name -> Bild, ab dem sich die Spur des Teils zeichnet."""
        for o in teile:
            me = o.data
            for p in sorted(me.polygons, key=lambda p: -p.area)[:2]:
                if p.area < .08: continue
                P = [me.vertices[v].co.copy() for v in p.vertices]
                nrm = p.normal.copy(); c = sum(P, Vector()) / len(P)
                e0 = ein.get(o.name, 0)
                for k in range(len(P)):
                    a, b = P[k], P[(k + 1) % len(P)]
                    L = (b - a).length
                    if L < .25: continue
                    u = (b - a) / L
                    inn = nrm.cross(u).normalized()
                    if (c - a).dot(inn) < 0: inn = -inn
                    s = .045; arm = min(.4, .3 * L)
                    at = lambda uu, vv: a + u * uu + inn * vv
                    self.strich(at(.4 * s, s), at(arm, s), e0, 3, deck, normal=nrm, eltern=o, breite=.017)
                    self.strich(at(L - arm, s), at(L - .4 * s, s), e0 + 1, 3, deck, normal=nrm, eltern=o, breite=.017)
                    self.strich(at(.6 * s, s + .012), at(arm * .78, s + .02), e0 + 2, 3, deck * .6, normal=nrm, eltern=o, breite=.014)
                    self.strich(at(L - arm * .78, s + .02), at(L - .6 * s, s + .012), e0 + 3, 3, deck * .6, normal=nrm, eltern=o, breite=.014)


def _umriss_xy(o, dg):
    """Konvexe Hülle (gegen den Uhrzeigersinn) der Ecken eines Teils in der Draufsicht."""
    ev = o.evaluated_get(dg); me = ev.to_mesh(); mw = ev.matrix_world
    pts = sorted({(round((mw @ v.co).x, 5), round((mw @ v.co).y, 5)) for v in me.vertices})
    ev.to_mesh_clear()
    def kreuz(o_, a, b): return (a[0] - o_[0]) * (b[1] - o_[1]) - (a[1] - o_[1]) * (b[0] - o_[0])
    lo, hi = [], []
    for p in pts:
        while len(lo) >= 2 and kreuz(lo[-2], lo[-1], p) <= 1e-9: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(hi) >= 2 and kreuz(hi[-2], hi[-1], p) <= 1e-9: hi.pop()
        hi.append(p)
    return [Vector(p) for p in lo[:-1] + hi[:-1]]


# ---------- Prüfung ----------
def _bvh(ob, dg):
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    mw = ev.matrix_world
    verts = [mw @ v.co for v in me.vertices]
    polys = [tuple(p.vertices) for p in me.polygons]
    ev.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys, epsilon=0.0), verts


def kollisionen(objekte, frames, erlaubt=(), schritt=1):
    """Durchdringung aller Paare über alle Bilder (exakter Dreieckstest). erlaubt: Paare (Name, Name), die sich an einem
    Scharnier berühren dürfen. Gibt Liste (frame, a, b, anzahl) zurück."""
    sc = bpy.context.scene
    erl = {frozenset(p) for p in erlaubt}
    funde = {}
    for f in range(0, frames + 1, schritt):
        sc.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        bv = {}
        for o in objekte:
            if not o.visible_get():
                continue
            bv[o.name] = _bvh(o, dg)
        names = list(bv)
        # grobe Vorprüfung über Hüllquader
        box = {n: (Vector((min(v.x for v in bv[n][1]), min(v.y for v in bv[n][1]), min(v.z for v in bv[n][1]))),
                   Vector((max(v.x for v in bv[n][1]), max(v.y for v in bv[n][1]), max(v.z for v in bv[n][1])))) for n in names}
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                if frozenset((a, b)) in erl:
                    continue
                (a0, a1), (b0, b1) = box[a], box[b]
                if any(a1[k] < b0[k] or b1[k] < a0[k] for k in range(3)):
                    continue
                ov = bv[a][0].overlap(bv[b][0])
                if ov:
                    key = (a, b)
                    funde.setdefault(key, []).append((f, len(ov)))
    sc.frame_set(0)
    return funde


def projektion(cam, p, aspekt):
    """Welt -> normierte Bildkoordinaten (0..1, unten links) und Tiefe, für ein Bild mit gegebenem Seitenverhältnis."""
    sc = bpy.context.scene
    from bpy_extras.object_utils import world_to_camera_view
    rx, ry = sc.render.resolution_x, sc.render.resolution_y
    sc.render.resolution_x, sc.render.resolution_y = int(1000 * aspekt), 1000
    co = world_to_camera_view(sc, cam, p)
    sc.render.resolution_x, sc.render.resolution_y = rx, ry
    return co


def textpruefung(cam, aspekt, bildhoehe_px, frame, traeger, zeilen, flaeche_zu_welt, sichtbar_gegen, rand=.02):
    """Je gesetzter Zeile: liegt sie ganz im Bild, ist sie unverdeckt (Strahlen von der Kamera treffen zuerst den Träger),
    und wie hoch ist ihre Versalhöhe bzw. ihr Geviert in CSS-Pixeln. flaeche_zu_welt(x,y) bildet Druckkoordinaten
    (Einheiten, oben links) auf Weltpunkte ab."""
    sc = bpy.context.scene; sc.frame_set(frame)
    bau = [o for o in sc.objects if o.get("neubau_rolle") == "bau" or o.get("neubau_pruef")]
    for o in bau: o.hide_viewport = True
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    camp = cam.matrix_world.translation
    erg = {"frame": frame, "zeilen": [], "min_em_px": 1e9, "verdeckt": 0, "ausserhalb": 0}
    for z in zeilen:
        pts = []
        for fx in (0, .25, .5, .75, 1):
            for fy in (0, 1):
                pts.append(flaeche_zu_welt(z["x"] + z["w"] * fx, z["y"] + z["h"] * fy))
        aus = 0; verd = 0
        for p in pts:
            co = projektion(cam, p, aspekt)
            if not (rand <= co.x <= 1 - rand and rand <= co.y <= 1 - rand and co.z > 0):
                aus += 1
            d = (p - camp); L = d.length
            hit, loc, nrm, idx, ob, mx = sc.ray_cast(dg, camp, d.normalized(), distance=L + .01)
            if hit and ob.name != traeger.name and (loc - camp).length < L - .01:
                verd += 1
        # Geviert in Pixeln: senkrechter Abstand Ober-/Unterkante der Versalhöhe, auf em umgerechnet
        top = projektion(cam, flaeche_zu_welt(z["x"] + z["w"] / 2, z["y"]), aspekt)
        bot = projektion(cam, flaeche_zu_welt(z["x"] + z["w"] / 2, z["y"] + z["h"]), aspekt)
        em_px = abs(top.y - bot.y) * bildhoehe_px / .72
        erg["zeilen"].append({"text": z["text"], "em_px": round(em_px, 1), "ausserhalb": aus, "verdeckt": verd})
        erg["min_em_px"] = min(erg["min_em_px"], em_px)
        erg["verdeckt"] += verd; erg["ausserhalb"] += aus
    erg["min_em_px"] = round(erg["min_em_px"], 1)
    for o in bau: o.hide_viewport = False
    return erg


def im_bild(cam, aspekt, punkte, frame, rand=0.0):
    """Anteil der Punkte im Bild (für 'Gegenstand ganz im Bild')."""
    sc = bpy.context.scene; sc.frame_set(frame)
    aus = []
    for p in punkte:
        co = projektion(cam, p, aspekt)
        if not (rand <= co.x <= 1 - rand and rand <= co.y <= 1 - rand and co.z > 0):
            aus.append(p)
    return aus


def huelle_xy(objekte, frames):
    """Achsenparalleles Rechteck [x0, x1, y0, y1] (Ebene des Bogens) um alle Teile über die angegebenen Bilder: Platzbedarf der Szene für Übergänge."""
    pts = huellpunkte(objekte, frames)
    return [round(min(p.x for p in pts), 3), round(max(p.x for p in pts), 3), round(min(p.y for p in pts), 3), round(max(p.y for p in pts), 3)]


def huellpunkte(objekte, frames):
    """Ecken der Hüllquader (Welt) der Objekte über die angegebenen Bilder – Grundlage, um eine Einstellung zu rahmen."""
    sc = bpy.context.scene
    pts = []
    for f in frames:
        sc.frame_set(f)
        bpy.context.view_layer.update()
        for o in objekte:
            if o.type == "MESH":
                pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    sc.frame_set(0)
    return pts


# ---------- Probebilder und Export ----------
def probe(cam, frame, datei, breite, hoehe, prozent=100):
    sc = bpy.context.scene
    sc.camera = cam
    sc.frame_set(frame)
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = breite, hoehe, prozent
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = datei
    t = time.time()
    bpy.ops.render.render(write_still=True)
    return time.time() - t


def export_glb(datei, extras, draco=False):
    """Export als glb. Vorher: Prüfkörper raus; Einblend-Knoten überbrücken (der Exporter erkennt nur Bild -> Grundfarbe,
    das Einblenden übernimmt der Abspieler nach den Material-Extras)."""
    sc = bpy.context.scene
    sc["neubau"] = json.dumps(extras, ensure_ascii=False)
    for o in list(bpy.data.objects):
        if o.get("neubau_pruef"):
            bpy.data.objects.remove(o, do_unlink=True)
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        nt = m.node_tree
        mix = nt.nodes.get("Einblenden")
        if mix:
            tx = next(n for n in nt.nodes if n.type == "TEX_IMAGE")
            bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
            nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
    bpy.ops.export_scene.gltf(
        filepath=datei, export_format="GLB", export_cameras=True, export_lights=False, export_extras=True,
        export_animations=True, export_animation_mode="SCENE", export_force_sampling=True, export_frame_range=True,
        export_optimize_animation_size=True, export_anim_slide_to_zero=False, export_yup=True, export_attributes=True,
        export_image_format="AUTO", export_draco_mesh_compression_enable=draco, export_apply=False)
    return os.path.getsize(datei)
