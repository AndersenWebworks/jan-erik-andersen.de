# Konzeptbilder Eröffnung (Art Direction, frei komponiert, nicht an den Bau gebunden).
#   blender.exe -b --factory-startup --python neubau/konzept/konzept.py -- <kb-1-start|kb-2-bau|kb-3-monitor|kb-3-mobil|kb-4-uebergang> [--klein] [--samples=N]
# Mittel: Cycles (weiche klare Schatten, kühler Dunst als Weltvolumen), prozedurale Papierfaser, Bleistiftstriche als Bänder mit
# Überstand und Mehrfachstrich, Freestyle für die Kantenzeichnung, Mockup- und Skizzentextur als PNG.
import bpy, bmesh, math, os, random, sys
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ARGV = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SHOT = ARGV[0]
KLEIN = "--klein" in ARGV
SAMPLES = next((int(a.split("=")[1]) for a in ARGV if a.startswith("--samples=")), 96)
OUT = os.path.join(os.environ.get("KB_OUT", HERE), SHOT.replace("kb-", "kb2-") + ".png")
random.seed(11)

RED = "#d40235"
INK = "#303033"
GRAPH = "#4d586e"


def rgb(h, a=1.0):
    h = h.lstrip("#")
    f = lambda c: (c / 255.0) ** 2.2
    return (f(int(h[0:2], 16)), f(int(h[2:4], 16)), f(int(h[4:6], 16)), a)


# ------------------------------------------------------------------ Grundlagen
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
COLL = bpy.data.collections.new("zeichnung")
sc.collection.children.link(COLL)


def link(o, zeichnung=True):
    (COLL if zeichnung else sc.collection).objects.link(o)
    return o


def nodes_of(m):
    m.use_nodes = True
    n = m.node_tree
    n.nodes.clear()
    return n.nodes, n.links


def principled(nodes, links, color, rough=0.85, **kw):
    b = nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = rgb(color) if isinstance(color, str) else color
    b.inputs["Roughness"].default_value = rough
    for k, v in kw.items():
        b.inputs[k.replace("_", " ")].default_value = v
    return b



FOG_K = 0.02
FOG_COL = "#e8f0fb"


def fogged(nd, ln, bsdf_out, out):
    """Dunst als Mischung zur Dunstfarbe nach Sichtweite (nur Kamerastrahlen); ersetzt das Weltvolumen."""
    lp = nd.new("ShaderNodeLightPath")
    ex = nd.new("ShaderNodeMath"); ex.operation = "MULTIPLY"; ex.inputs[1].default_value = -FOG_K
    ln.new(lp.outputs["Ray Length"], ex.inputs[0])
    ee = nd.new("ShaderNodeMath"); ee.operation = "EXPONENT"
    ln.new(ex.outputs[0], ee.inputs[0])
    inv = nd.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1.0
    ln.new(ee.outputs[0], inv.inputs[1])
    cam = nd.new("ShaderNodeMath"); cam.operation = "MULTIPLY"
    ln.new(inv.outputs[0], cam.inputs[0]); ln.new(lp.outputs["Is Camera Ray"], cam.inputs[1])
    em = nd.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = rgb(FOG_COL)
    em.inputs["Strength"].default_value = FOG_STRENGTH
    mx = nd.new("ShaderNodeMixShader")
    ln.new(cam.outputs[0], mx.inputs[0])
    ln.new(bsdf_out, mx.inputs[1]); ln.new(em.outputs[0], mx.inputs[2])
    ln.new(mx.outputs[0], out.inputs["Surface"])


FOG_STRENGTH = 1.0


def paper_material(name, color, rough=0.9, fiber=0.35, tint=0.03, nofog=False):
    m = bpy.data.materials.new(name)
    nd, ln = nodes_of(m)
    out = nd.new("ShaderNodeOutputMaterial")
    b = principled(nd, ln, color, rough)
    b.inputs["Specular IOR Level"].default_value = 0.12
    tc = nd.new("ShaderNodeTexCoord")
    # Faser: gestreckte Noise-Textur als Bump, grobe Tönung darüber
    mp = nd.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1, 14, 1)
    ln.new(tc.outputs["Object"], mp.inputs["Vector"])
    nz = nd.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 260
    nz.inputs["Detail"].default_value = 6
    ln.new(mp.outputs["Vector"], nz.inputs["Vector"])
    bm = nd.new("ShaderNodeBump")
    bm.inputs["Strength"].default_value = fiber
    bm.inputs["Distance"].default_value = 0.004
    ln.new(nz.outputs["Fac"], bm.inputs["Height"])
    ln.new(bm.outputs["Normal"], b.inputs["Normal"])
    n2 = nd.new("ShaderNodeTexNoise")
    n2.inputs["Scale"].default_value = 3.0
    ln.new(tc.outputs["Object"], n2.inputs["Vector"])
    mix = nd.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = tint
    mix.inputs[6].default_value = (1, 1, 1, 1)
    mix.inputs[7].default_value = (0.82, 0.88, 1.0, 1)
    ln.new(n2.outputs["Fac"], mix.inputs[0])
    mul = nd.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs[0].default_value = 1.0
    mul.inputs[6].default_value = rgb(color)
    ln.new(mix.outputs[2], mul.inputs[7])
    ln.new(mul.outputs[2], b.inputs["Base Color"])
    if nofog:
        ln.new(b.outputs["BSDF"], out.inputs["Surface"])
    else:
        fogged(nd, ln, b.outputs["BSDF"], out)
    return m


def floor_material(name, grid=True):
    """Bogen: kühles Weiß, Faser, feines Raster (nur nah am Bau, läuft zum Rand aus)."""
    m = bpy.data.materials.new(name)
    nd, ln = nodes_of(m)
    out = nd.new("ShaderNodeOutputMaterial")
    b = principled(nd, ln, "#f5f8fc", 0.92)
    tc = nd.new("ShaderNodeTexCoord")
    mp = nd.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1, 12, 1)
    ln.new(tc.outputs["Object"], mp.inputs["Vector"])
    nz = nd.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 300
    nz.inputs["Detail"].default_value = 7
    ln.new(mp.outputs["Vector"], nz.inputs["Vector"])
    bm = nd.new("ShaderNodeBump")
    bm.inputs["Strength"].default_value = 0.3
    bm.inputs["Distance"].default_value = 0.003
    ln.new(nz.outputs["Fac"], bm.inputs["Height"])
    ln.new(bm.outputs["Normal"], b.inputs["Normal"])
    col = nd.new("ShaderNodeMix")
    col.data_type = "RGBA"
    col.inputs[6].default_value = rgb("#f5f8fc")
    col.inputs[7].default_value = rgb("#9db0cf")
    if grid:
        sep = nd.new("ShaderNodeSeparateXYZ")
        ln.new(tc.outputs["Object"], sep.inputs["Vector"])
        def line(axis, step, w):
            md = nd.new("ShaderNodeMath"); md.operation = "PINGPONG"; md.inputs[1].default_value = step / 2.0
            ln.new(sep.outputs[axis], md.inputs[0])
            lt = nd.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = w
            ln.new(md.outputs[0], lt.inputs[0])
            return lt
        # pingpong(x, s/2) hat Spitzen bei s/2-Vielfachen; abs(p - s/2) ≈ 0 genau bei den Gitterlinien
        lx, ly = line("X", 0.1, 0.0011), line("Y", 0.1, 0.0011)
        gx, gy = line("X", 0.5, 0.0016), line("Y", 0.5, 0.0016)
        a = nd.new("ShaderNodeMath"); a.operation = "MAXIMUM"
        ln.new(lx.outputs[0], a.inputs[0]); ln.new(ly.outputs[0], a.inputs[1])
        c = nd.new("ShaderNodeMath"); c.operation = "MAXIMUM"
        ln.new(gx.outputs[0], c.inputs[0]); ln.new(gy.outputs[0], c.inputs[1])
        # Maske: Raster nur im Baubereich (radial um (0, 0.4))
        vm = nd.new("ShaderNodeVectorMath"); vm.operation = "DISTANCE"
        vm.inputs[1].default_value = GRID_C
        ln.new(tc.outputs["Object"], vm.inputs[0])
        cr = nd.new("ShaderNodeMapRange")
        cr.inputs[1].default_value = GRID_R0; cr.inputs[2].default_value = GRID_R1
        cr.inputs[3].default_value = 1.0; cr.inputs[4].default_value = 0.0
        cr.clamp = True
        ln.new(vm.outputs["Value"], cr.inputs[0])
        s1 = nd.new("ShaderNodeMath"); s1.operation = "MULTIPLY"; s1.inputs[1].default_value = 0.22
        ln.new(a.outputs[0], s1.inputs[0])
        s2 = nd.new("ShaderNodeMath"); s2.operation = "MULTIPLY"; s2.inputs[1].default_value = 0.55
        ln.new(c.outputs[0], s2.inputs[0])
        s3 = nd.new("ShaderNodeMath"); s3.operation = "MAXIMUM"
        ln.new(s1.outputs[0], s3.inputs[0]); ln.new(s2.outputs[0], s3.inputs[1])
        s4 = nd.new("ShaderNodeMath"); s4.operation = "MULTIPLY"
        ln.new(s3.outputs[0], s4.inputs[0]); ln.new(cr.outputs[0], s4.inputs[1])
        ln.new(s4.outputs[0], col.inputs[0])
    ln.new(col.outputs[2], b.inputs["Base Color"])
    fogged(nd, ln, b.outputs["BSDF"], out)
    return m


GRID_R0, GRID_R1 = 2.2, 4.5
GRID_C = (3.0, 3.0, 0.0)


def pencil_material(name, color=GRAPH, alpha=0.85, tooth=1.0):
    m = bpy.data.materials.new(name)
    nd, ln = nodes_of(m)
    out = nd.new("ShaderNodeOutputMaterial")
    b = principled(nd, ln, color, 0.55)
    tr = nd.new("ShaderNodeBsdfTransparent")
    tc = nd.new("ShaderNodeTexCoord")
    nz = nd.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 140
    nz.inputs["Detail"].default_value = 5
    ln.new(tc.outputs["Object"], nz.inputs["Vector"])
    cr = nd.new("ShaderNodeMapRange")
    cr.inputs[1].default_value = 0.35; cr.inputs[2].default_value = 0.7
    cr.inputs[3].default_value = alpha * (1 - 0.45 * tooth); cr.inputs[4].default_value = alpha
    cr.clamp = True
    ln.new(nz.outputs["Fac"], cr.inputs[0])
    mx = nd.new("ShaderNodeMixShader")
    ln.new(cr.outputs[0], mx.inputs[0])
    ln.new(tr.outputs[0], mx.inputs[1])
    ln.new(b.outputs["BSDF"], mx.inputs[2])
    ln.new(mx.outputs[0], out.inputs["Surface"])
    return m


def red_material(name="rot", gloss=0.35):
    m = bpy.data.materials.new(name)
    nd, ln = nodes_of(m)
    out = nd.new("ShaderNodeOutputMaterial")
    b = principled(nd, ln, RED, gloss, Emission_Strength=0.35)
    b.inputs["Emission Color"].default_value = rgb(RED)
    ln.new(b.outputs["BSDF"], out.inputs["Surface"])
    return m


def image_emission(name, path, strength=1.0, rough=0.4):
    m = bpy.data.materials.new(name)
    nd, ln = nodes_of(m)
    out = nd.new("ShaderNodeOutputMaterial")
    im = nd.new("ShaderNodeTexImage")
    im.image = bpy.data.images.load(path)
    im.image.colorspace_settings.name = "sRGB"
    b = principled(nd, ln, "#ffffff", rough, Emission_Strength=strength)
    ln.new(im.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Base Color"].default_value = (0.05, 0.05, 0.05, 1)
    b.inputs["Specular IOR Level"].default_value = 0.08
    ln.new(b.outputs["BSDF"], out.inputs["Surface"])
    return m


MAT = {}
def mat(key):
    if key in MAT:
        return MAT[key]
    d = {
        "weiss": lambda: paper_material("weiss", "#f4f7fc"),
        "hell": lambda: paper_material("hell", "#e6ebf3"),
        "grau": lambda: paper_material("grau", "#c9d2e0"),
        "mittel": lambda: paper_material("mittel", "#a9b6ca"),
        "dunkel": lambda: paper_material("dunkel", "#3c465b", 0.7, 0.2),
        "tinte": lambda: paper_material("tinte", INK, 0.95, 0.15, 0.0, True),
        "boden": lambda: floor_material("boden"),
        "bleistift": lambda: pencil_material("bleistift", "#3a4458", 0.95),
        "bleistift_fein": lambda: pencil_material("bleistift_fein", "#58647c", 0.8),
        "bleistift_dunkel": lambda: pencil_material("bleistift_dunkel", "#2d3547", 0.95),
        "abdruck": lambda: paper_material("abdruck", "#dfe6f1", 0.95, 0.3, 0.0),
        "abdruck_buchst": lambda: paper_material("abdruck_buchst", "#d6deeb", 0.95, 0.3, 0.0),
        "rot": lambda: red_material(),
        "pflanze": lambda: paper_material("pflanze", "#bccbb3"),
    }
    MAT[key] = d[key]()
    return MAT[key]


# ------------------------------------------------------------------ Geometrie
BASE = Matrix.Identity(4)
HINGE = Matrix.Identity(4)


def finish(o, m, bevel=0.003, smooth=False):
    o.data.materials.append(m)
    if bevel:
        md = o.modifiers.new("b", "BEVEL")
        md.width = bevel; md.segments = 2; md.limit_method = "ANGLE"
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    return o


def box(name, size, loc, m, rot=(0, 0, 0), bevel=0.003, pivot=None, axis=None, angle=0.0, zeich=True):
    """Quader mit Mittelpunkt loc (lokal zur BASE). Optional um eine Kante geklappt: pivot + axis + angle (lokal)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me)
    o.scale = size
    link(o, zeich)
    loc_m = Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4()
    if pivot is not None:
        hinge = Matrix.Translation(pivot) @ Matrix.Rotation(angle, 4, axis) @ Matrix.Translation(-Vector(pivot))
        loc_m = hinge @ loc_m
    o.matrix_world = BASE @ HINGE @ loc_m @ Matrix.Diagonal((*size, 1.0))
    return finish(o, m, bevel)


def cyl(name, r, h, loc, m, rot=(0, 0, 0), seg=48, bevel=0.002, scale=(1, 1, 1), zeich=True, r2=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=(r if r2 is None else r2), depth=h)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me)
    link(o, zeich)
    o.matrix_world = BASE @ Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*scale, 1.0))
    return finish(o, m, bevel, smooth=True)


LINES = {}


def quad(key, a, b, c, d):
    v, f = LINES.setdefault(key, ([], []))
    i = len(v)
    v.extend([a, b, c, d]); f.append((i, i + 1, i + 2, i + 3))


def stroke(key, p0, p1, w, z=0.002, over=(0.02, 0.1), jitter=0.004, n=2):
    """Handstrich: n Durchgänge mit Überstand, leichtem Versatz, wechselnder Breite. Alles lokal (BASE), flach in der Höhe z."""
    p0, p1 = Vector(p0), Vector(p1)
    dvec = (p1 - p0).normalized()
    nrm = Vector((-dvec.y, dvec.x, 0))
    for k in range(n):
        o0 = random.uniform(*over); o1 = random.uniform(*over)
        off = nrm * random.uniform(-jitter, jitter)
        a = p0 - dvec * o0 + off; b = p1 + dvec * o1 + off
        ww = w * random.uniform(0.7, 1.2)
        for s in range(6):  # in Teilstücken, damit der Strich leicht „wandert“
            t0, t1 = s / 6, (s + 1) / 6
            wob = nrm * random.uniform(-jitter * 0.3, jitter * 0.3)
            pa = a.lerp(b, t0) + wob * (s > 0); pb = a.lerp(b, t1) + wob
            quad(key, pa + nrm * ww / 2 + Vector((0, 0, z)), pb + nrm * ww / 2 + Vector((0, 0, z)),
                 pb - nrm * ww / 2 + Vector((0, 0, z)), pa - nrm * ww / 2 + Vector((0, 0, z)))


def exact(key, p0, p1, w, z=0.002):
    p0, p1 = Vector(p0), Vector(p1)
    d = (p1 - p0).normalized(); n = Vector((-d.y, d.x, 0)) * w / 2; h = Vector((0, 0, z))
    quad(key, p0 + n + h, p1 + n + h, p1 - n + h, p0 - n + h)


def dashed(key, p0, p1, w=0.006, dash=0.055, gap=0.035, z=0.002):
    p0, p1 = Vector(p0), Vector(p1)
    L = (p1 - p0).length; d = (p1 - p0).normalized(); t = 0.0
    while t < L:
        e = min(t + dash, L)
        exact(key, p0 + d * t, p0 + d * e, w, z)
        t = e + gap


def arc(key, c, r, a0, a1, w, z=0.002, seg=48, dash=False):
    pts = [Vector((c[0] + r * math.cos(a0 + (a1 - a0) * i / seg), c[1] + r * math.sin(a0 + (a1 - a0) * i / seg), z)) for i in range(seg + 1)]
    for i in range(seg):
        if dash and (i // 2) % 2:
            continue
        exact(key, pts[i], pts[i + 1], w, z)


def rect_pencil(x0, y0, x1, y1, key="bleistift", w=0.006, z=0.002, over=(0.03, 0.14), n=2, dash=False):
    for (a, b) in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
        if dash:
            dashed(key, (*a, z), (*b, z), w * 0.9, z=z)
        else:
            stroke(key, (*a, z), (*b, z), w, z, over, n=n)


def flush_lines():
    for key, (v, f) in LINES.items():
        me = bpy.data.meshes.new("l_" + key)
        me.from_pydata([tuple(BASE @ x) for x in v], [], f)
        o = bpy.data.objects.new("l_" + key, me)
        link(o, False)
        o.data.materials.append(mat(key))
        o.visible_shadow = False
    LINES.clear()


def thread(pts, width=0.016, flat=0.55, z=0.0):
    """Roter Faden: weich geschwungene Bezier (AUTO-Griffe), flach auf dem Papier."""
    cu = bpy.data.curves.new("faden", "CURVE")
    cu.dimensions = "3D"; cu.bevel_depth = width; cu.bevel_resolution = 4; cu.resolution_u = 48
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(pts) - 1)
    for p, q in zip(sp.bezier_points, pts):
        p.co = (q[0], q[1], 0.0); p.handle_left_type = p.handle_right_type = "AUTO"
    o = bpy.data.objects.new("faden", cu)
    o.matrix_world = BASE @ Matrix.Translation((0, 0, width * flat * 0.85 + z)) @ Matrix.Diagonal((1, 1, flat, 1))
    link(o, False)
    cu.materials.append(mat("rot"))
    return o


def dot(loc, r=0.07, flat=0.5):
    o = cyl("punkt", r, r * 2 * flat, (loc[0], loc[1], loc[2] + r * flat), mat("rot"), bevel=r * 0.25, seg=64)
    return o


def letters(text_pos, size=0.5, extrude=0.014, stand=True, abdruck=False):
    """Marke N4 als Papierlettern. Gibt (rechtes Ende, Grundlinie) zurück."""
    f1 = bpy.data.fonts.load(os.path.join(HERE, "..", "blender", "schriften", "NewsreaderMarke.ttf"))
    f2 = bpy.data.fonts.load(os.path.join(HERE, "..", "blender", "schriften", "NewsreaderMarkeKursiv.ttf"))
    cu = bpy.data.curves.new("name", "FONT")
    cu.body = "Jan-Erik Andersen"
    cu.font = f1; cu.font_italic = f2
    for i in range(9, 17):
        cu.body_format[i].use_italic = True
    cu.size = size; cu.extrude = extrude; cu.bevel_depth = 0.0012; cu.resolution_u = 14
    o = bpy.data.objects.new("name", cu)
    link(o, not abdruck)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.view_layer.objects.active
    xs = [v.co.x for v in o.data.vertices]
    ys = [v.co.z for v in o.data.vertices]
    o.data.materials.append(mat("abdruck_buchst" if abdruck else "tinte"))
    for p in o.data.polygons:
        p.use_smooth = True
    if abdruck:
        o.matrix_world = BASE @ Matrix.Translation(Vector(text_pos) + Vector((max(xs), 0, 0))) @ Matrix.Rotation(math.pi, 4, "Z")
        o.visible_shadow = False
    else:
        o.matrix_world = BASE @ Matrix.Translation(text_pos) @ Matrix.Rotation(math.pi / 2, 4, "X")
    return o, max(xs), min(ys)


# ------------------------------------------------------------------ Welt, Licht, Kamera
def welt(haze=0.02, sky_top="#cddff6", sky_hor="#eef4fc", sun=(2.6, 1.0), sun_dir=(-35, 55), strength=1.0, haze_col=None, light=0.6, lower=None):
    lower = lower or sky_hor
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    nd, ln = w.node_tree.nodes, w.node_tree.links
    nd.clear()
    out = nd.new("ShaderNodeOutputWorld")
    gm = nd.new("ShaderNodeNewGeometry")
    sp2 = nd.new("ShaderNodeSeparateXYZ")
    ln.new(gm.outputs["Incoming"], sp2.inputs["Vector"])
    ramp = nd.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = rgb(sky_hor)
    ramp.color_ramp.elements[1].position = 0.45
    ramp.color_ramp.elements[1].color = rgb(sky_top)
    ab = nd.new("ShaderNodeMath"); ab.operation = "ABSOLUTE"
    ln.new(sp2.outputs["Z"], ab.inputs[0])
    ln.new(ab.outputs[0], ramp.inputs["Fac"])
    # untere Halbkugel (Blick unter den Horizont): leicht kühler und dunkler, wie die Fläche im alten Startbild
    low = nd.new("ShaderNodeValToRGB")
    low.color_ramp.elements[0].position = 0.0
    low.color_ramp.elements[0].color = rgb(sky_hor)
    low.color_ramp.elements[1].position = 0.35
    low.color_ramp.elements[1].color = rgb(lower)
    ln.new(sp2.outputs["Z"], low.inputs["Fac"])
    cmix = nd.new("ShaderNodeMix"); cmix.data_type = "RGBA"
    ste = nd.new("ShaderNodeMapRange")
    ste.inputs[1].default_value = -0.02; ste.inputs[2].default_value = 0.02
    ln.new(sp2.outputs["Z"], ste.inputs[0])
    ln.new(ste.outputs[0], cmix.inputs[0])
    ln.new(ramp.outputs["Color"], cmix.inputs[6])
    ln.new(low.outputs["Color"], cmix.inputs[7])
    bgv = nd.new("ShaderNodeBackground"); bgv.inputs["Strength"].default_value = strength
    bgl = nd.new("ShaderNodeBackground"); bgl.inputs["Strength"].default_value = strength * light
    ln.new(cmix.outputs[2], bgv.inputs["Color"]); ln.new(cmix.outputs[2], bgl.inputs["Color"])
    lp = nd.new("ShaderNodeLightPath")
    mxs = nd.new("ShaderNodeMixShader")
    ln.new(lp.outputs["Is Camera Ray"], mxs.inputs[0])
    ln.new(bgl.outputs[0], mxs.inputs[1]); ln.new(bgv.outputs[0], mxs.inputs[2])
    ln.new(mxs.outputs[0], out.inputs["Surface"])
    global FOG_K, FOG_COL
    FOG_K = haze
    FOG_COL = haze_col or sky_hor
    global FOG_STRENGTH
    FOG_STRENGTH = strength
    sd = bpy.data.lights.new("sonne", "SUN")
    sd.energy = sun[0]; sd.angle = math.radians(sun[1] * 3)
    sd.color = (1.0, 0.985, 0.96)
    so = bpy.data.objects.new("sonne", sd)
    so.rotation_euler = (math.radians(sun_dir[1]), 0, math.radians(sun_dir[0]))
    sc.collection.objects.link(so)


def kamera(loc, target, lens=40.0, roll=0.0, shift=(0, 0)):
    cd = bpy.data.cameras.new("cam")
    cd.lens = lens; cd.sensor_width = 36
    cd.sensor_fit = "HORIZONTAL"
    cd.clip_start = 0.05; cd.clip_end = 400
    cd.shift_x, cd.shift_y = shift
    o = bpy.data.objects.new("cam", cd)
    sc.collection.objects.link(o)
    o.location = loc
    d = Vector(target) - Vector(loc)
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    sc.camera = o
    return o


def render_setup(w, h, expo=0.0, freestyle=True, fs_width=1.1, fs_alpha=0.55):
    sc.render.engine = "CYCLES"
    cy = sc.cycles
    cy.device = "CPU"
    cy.samples = 24 if KLEIN else SAMPLES
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.max_bounces = 6
    cy.volume_bounces = 2
    cy.volume_step_rate = 1.5
    sc.render.resolution_x = w // 2 if KLEIN else w
    sc.render.resolution_y = h // 2 if KLEIN else h
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.exposure = expo
    sc.view_settings.look = "None"
    sc.render.image_settings.file_format = "PNG"
    sc.render.film_transparent = False
    if freestyle:
        sc.render.use_freestyle = True
        sc.render.line_thickness_mode = "ABSOLUTE"
        sc.render.line_thickness = fs_width * (0.5 if KLEIN else 1.0)
        vl = sc.view_layers[0]
        vl.use_freestyle = True
        fs = vl.freestyle_settings
        for ls in list(fs.linesets):
            fs.linesets.remove(ls)
        ls = fs.linesets.new("zeichnung")
        ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True
        ls.select_by_collection = True; ls.collection = COLL
        ls.select_by_visibility = True; ls.select_by_image_border = False
        fs.crease_angle = math.radians(100)
        st = ls.linestyle
        st.color = rgb(GRAPH)[:3]
        st.color = (0.17, 0.2, 0.3)
        st.alpha = fs_alpha
        st.thickness = fs_width


def render():
    sc.render.filepath = OUT
    bpy.ops.render.render(write_still=True)
    print("FERTIG", OUT)


# ------------------------------------------------------------------ Bauteile
def boden(y0=-400.0):
    me = bpy.data.meshes.new("boden")
    s = 400.0
    me.from_pydata([(-s, y0, 0), (s, y0, 0), (s, s, 0), (-s, s, 0)], [], [(0, 1, 2, 3)])
    o = bpy.data.objects.new("boden", me)
    link(o, False)
    me.materials.append(mat("boden"))
    return o


MOCK = os.path.join(HERE, "mockup.png")
SKIZZE = os.path.join(HERE, "skizze.png")
DESK_H = 0.78


def schreibtisch(zustand="fertig"):
    """Schreibtisch, Monitor, Zubehör. 'bau': Monitor als Blatt halb aufgeklappt mit Skizze, Zubehör teils noch Zuschnitt (Stiftlinien), Tower öffnet sich;
    'fertig': alles steht, Mockup auf dem Monitor."""
    global HINGE
    bau = zustand == "bau"
    top_t = 0.05
    for sx in (-1, 1):
        box("bein", (0.05, 0.86, DESK_H - top_t), (sx * 1.12, 0.45, (DESK_H - top_t) / 2), mat("hell"), bevel=0.002)
    box("steg", (2.2, 0.03, 0.22), (0, 0.84, DESK_H - top_t - 0.13), mat("grau"), bevel=0.002)
    box("platte", (2.4, 0.96, top_t), (0, 0.45, DESK_H - top_t / 2), mat("weiss"), bevel=0.004)
    zt = DESK_H
    mw, mh, mt = 1.24, 0.70, 0.035
    cx, cy_ = 0.0, 0.50
    foot_h = 0.2
    zc = zt + foot_h + 0.05 + mh / 2
    if not bau:
        box("fuss", (0.5, 0.26, 0.018), (cx, cy_ - 0.02, zt + 0.009), mat("grau"), bevel=0.004)
        box("hals", (0.14, 0.03, foot_h + 0.04), (cx, cy_ + 0.02, zt + 0.02 + (foot_h + 0.04) / 2), mat("mittel"), bevel=0.003)
        box("rahmen", (mw, mt, mh), (cx, cy_ + 0.02, zc), mat("dunkel"), bevel=0.006)
        scr = box("schirm", (mw - 0.07, 0.004, mh - 0.07), (cx, cy_ + 0.02 - mt / 2 - 0.001, zc), image_emission("mockup", MOCK, 1.05), bevel=0)
        uvscreen(scr)
    else:
        # Monitorblatt: aufgeklappt um die Vorderkante, lehnt noch zurück (zeigt die Skizze der Seite)
        piv = Vector((cx, cy_ - 0.14, zt))
        HINGE = Matrix.Translation(piv) @ Matrix.Rotation(math.radians(-34), 4, "X") @ Matrix.Translation(-piv)
        zb = zt + mh / 2 + 0.01
        box("rahmen", (mw, mt * 0.6, mh), (cx, cy_ - 0.14, zb), mat("mittel"), bevel=0.004)
        scr = box("schirm", (mw - 0.07, 0.004, mh - 0.07), (cx, cy_ - 0.14 - mt * 0.3 - 0.0012, zb), image_emission("skizze", SKIZZE, 0.85), bevel=0)
        uvscreen(scr)
        HINGE = Matrix.Identity(4)
        # Fuß und Hals sind erst Zuschnitt: Umriss auf der Platte
        rect_pencil(cx - 0.25, cy_ - 0.15, cx + 0.25, cy_ + 0.11, "bleistift", 0.004, z=zt + 0.003, over=(0.01, 0.05))
        rect_pencil(cx - 0.07, cy_ + 0.12, cx + 0.07, cy_ + 0.36, "bleistift_fein", 0.003, z=zt + 0.003, over=(0.0, 0.03), dash=True)
    kb = box("tastatur", (0.52, 0.18, 0.016), (0.02, 0.30, zt + 0.008), mat("hell"), bevel=0.004)
    for r in range(4):
        for c in range(14):
            if r == 3 and 2 < c < 11:
                continue
            box("taste", (0.027, 0.027, 0.006), (-0.222 + c * 0.0345 + (0.012 * r), 0.355 - r * 0.036, zt + 0.019), mat("weiss"), bevel=0.0015)
    box("leertaste", (0.24, 0.027, 0.006), (0.02, 0.355 - 3 * 0.036, zt + 0.019), mat("weiss"), bevel=0.0015)
    if bau:
        # Rest noch Zuschnitt: Umrisse mit Falzlinien auf der Platte
        z3 = zt + 0.003
        rect_pencil(-0.8, 0.2, -0.44, 0.42, "bleistift", 0.004, z=z3, over=(0.01, 0.05))          # Tablett
        arc("bleistift", (0.66, 0.24), 0.04, 0, math.tau, 0.003, z=z3, seg=40)                       # Maus
        arc("bleistift", (0.95, 0.62), 0.075, 0, math.tau, 0.004, z=z3, seg=56)                      # Topf
        arc("bleistift_fein", (0.95, 0.62), 0.14, 0, math.tau, 0.003, z=z3, seg=56, dash=True)
        arc("bleistift", (0.76, 0.12), 0.045, 0, math.tau, 0.004, z=z3, seg=40)                      # Tasse
        rect_pencil(0.82, -0.02, 0.98, 0.1, "bleistift", 0.004, z=z3, over=(0.01, 0.04))             # Smartphone
        rect_pencil(-1.0, 0.55, -0.74, 0.85, "bleistift", 0.004, z=z3, over=(0.01, 0.05))            # Lampe
        dashed("bleistift_fein", (-1.0, 0.7, z3), (-0.74, 0.7, z3), 0.003, z=z3)
        tower(offen=True)
        return
    box("tablett", (0.34, 0.22, 0.012), (-0.62, 0.30, zt + 0.006), mat("dunkel"), bevel=0.003)
    box("tfeld", (0.26, 0.15, 0.003), (-0.62, 0.30, zt + 0.0135), mat("weiss"), bevel=0.001)
    box("stift", (0.15, 0.012, 0.012), (-0.60, 0.28, zt + 0.024), mat("tinte"), rot=(0, 0, math.radians(35)), bevel=0.003)
    cyl("maus", 0.032, 0.03, (0.66, 0.24, zt + 0.015), mat("weiss"), scale=(1, 1.45, 1), bevel=0.008)
    cyl("lampenfuss", 0.09, 0.015, (-0.88, 0.7, zt + 0.0075), mat("mittel"), bevel=0.004)
    box("arm1", (0.016, 0.016, 0.5), (-0.88, 0.7, zt + 0.265), mat("mittel"), rot=(math.radians(8), 0, 0), bevel=0.002)
    box("arm2", (0.016, 0.42, 0.016), (-0.87, 0.54, zt + 0.5), mat("mittel"), bevel=0.002)
    cyl("schirm_l", 0.1, 0.14, (-0.87, 0.36, zt + 0.46), mat("weiss"), rot=(math.radians(60), 0, 0), bevel=0.004, r2=0.04)
    cyl("topf", 0.075, 0.13, (0.95, 0.62, zt + 0.065), mat("dunkel"), bevel=0.004, r2=0.06, seg=8)
    for i in range(7):
        a = i * 2.4
        box("blatt", (0.012, 0.2, 0.05), (0.95 + math.cos(a) * 0.045, 0.62 + math.sin(a) * 0.045, zt + 0.25 + (i % 3) * 0.03), mat("pflanze"),
            rot=(math.radians(22 + (i % 3) * 8), 0, a + math.pi / 2), bevel=0.0015)
    cyl("tasse", 0.045, 0.1, (0.76, 0.12, zt + 0.05), mat("weiss"), bevel=0.003, r2=0.04, seg=8)
    cyl("becher", 0.04, 0.11, (0.66, 0.72, zt + 0.055), mat("dunkel"), bevel=0.003, seg=6)
    for i, a in enumerate((-8, 5, 12)):
        box("pen", (0.008, 0.008, 0.18), (0.66 + (i - 1) * 0.012, 0.72, zt + 0.15), mat("weiss"), rot=(math.radians(a), math.radians(a * .6), 0), bevel=0.001)
    box("handy", (0.075, 0.15, 0.009), (0.92, 0.06, zt + 0.0045), mat("dunkel"), rot=(0, 0, math.radians(-14)), bevel=0.003)
    tower()
    kabel()


def tower(offen=False):
    z0 = 0.0
    box("tower", (0.22, 0.46, 0.46), (0.86, 0.45, 0.23), mat("hell"), bevel=0.004)
    if offen:
        box("deckel", (0.22, 0.46, 0.012), (0.86, 0.45, 0.466), mat("weiss"), bevel=0.003, pivot=(0.86, 0.68, 0.46), axis=(1, 0, 0), angle=math.radians(-62))
        box("innen", (0.19, 0.42, 0.004), (0.86, 0.45, 0.462), mat("abdruck"), bevel=0)
    box("tfront", (0.19, 0.004, 0.40), (0.86, 0.45 - 0.232, 0.24), mat("grau"), bevel=0.002)
    cyl("status", 0.011, 0.006, (0.86, 0.45 - 0.236, 0.40), mat("rot"), rot=(math.pi / 2, 0, 0), bevel=0.001, zeich=False)
    for i in range(3):
        box("schlitz", (0.12, 0.003, 0.004), (0.86, 0.45 - 0.236, 0.28 - i * 0.03), mat("mittel"), bevel=0)


def kabel():
    zt = DESK_H
    cu = bpy.data.curves.new("kabel", "CURVE")
    cu.dimensions = "3D"; cu.bevel_depth = 0.006; cu.resolution_u = 24
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(3)
    pts = [(0.86, 0.68, 0.38), (0.6, 0.85, 0.2), (0.35, 0.72, zt - 0.03), (0.0, 0.62, zt + 0.03)]
    for p, q in zip(sp.bezier_points, pts):
        p.co = BASE @ Vector(q); p.handle_left_type = p.handle_right_type = "AUTO"
    ko = bpy.data.objects.new("kabel", cu); link(ko, False); cu.materials.append(mat("dunkel"))


def uvscreen(o):
    """UV nur für die Vorderseite (−Y): Würfel-UV reicht, Vorderfläche bekommt volles Bild."""
    me = o.data
    uv = me.uv_layers.new(name="uv")
    for p in me.polygons:
        for li in p.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = (v.x + 0.5, v.z + 0.5)


def desk_bau():
    """Schreibtisch mitten im Aufklappen (physikalisch gedacht): linke Wange steht, die Platte ist an ihrer Oberkante angeschlagen und hebt sich
    rechts an, die rechte Wange hängt als Klappe am Plattenende und schwenkt nach unten. Monitorblatt klappt vorn am Boden auf, Tower öffnet den Deckel."""
    global HINGE
    zt = DESK_H
    tt = 0.05
    L = DESK_H - tt                      # Beinhöhe
    box("bein_l", (0.05, 0.86, L), (-1.12, 0.45, L / 2), mat("hell"), bevel=0.002)
    P = Vector((-1.2, 0.45, zt - tt / 2))
    th = math.radians(-7)                # Platte rechts angehoben
    Htop = Matrix.Translation(P) @ Matrix.Rotation(th, 4, "Y") @ Matrix.Translation(-P)
    # Platte
    HINGE = Htop
    box("platte", (2.4, 0.96, tt), (0, 0.45, zt - tt / 2), mat("weiss"), bevel=0.004)
    # rechte Wange hängt am rechten Plattenende, schwenkt um die Unterkante nach unten (60 Grad zur Platte)
    Q = Vector((1.2, 0.45, zt - tt))
    psi = math.radians(-72)
    HINGE = Htop @ Matrix.Translation(Q) @ Matrix.Rotation(psi, 4, "Y") @ Matrix.Translation(-Q)
    box("bein_r", (L, 0.86, 0.05), (1.2 - L / 2, 0.45, zt - tt - 0.025), mat("hell"), bevel=0.002)
    HINGE = Matrix.Identity(4)
    # Abdruck der Platte im Bogen
    box("abdr", (2.4, 0.96, 0.002), (0, 0.45, 0.001), mat("abdruck"), bevel=0, zeich=False)
    # Monitorblatt: vorn am Boden, hinten angehoben, Skizze zeigt zur Kamera
    piv = Vector((0.55, -0.95, 0.0))
    HINGE = Matrix.Translation(piv) @ Matrix.Rotation(math.radians(62), 4, "X") @ Matrix.Translation(-piv)
    box("m_rahmen", (1.24, 0.7, 0.012), (0.55, -0.95 + 0.35, 0.007), mat("mittel"), bevel=0.004)
    scr = box("m_skizze", (1.17, 0.63, 0.004), (0.55, -0.95 + 0.35, 0.0155), image_emission("skizze", SKIZZE, 1.2), bevel=0)
    # UV auf der Oberseite
    me = scr.data
    uv = me.uv_layers.new(name="uv")
    for p in me.polygons:
        for li in p.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = (v.x + 0.5, v.y + 0.5)
    HINGE = Matrix.Identity(4)
    # Tower mit halb offenem Deckel
    tower(offen=True)


# ------------------------------------------------------------------ EINE Bahn
DESK = Matrix.Translation((7.4, 3.2, 0)) @ Matrix.Rotation(math.radians(-9), 4, "Z")
NAME_X0 = -1.65
BREITE = 0.045     # Breite des flachen Fadens


def dl(x, y):
    v = DESK @ Vector((x, y, 0))
    return (v.x, v.y)


def bahn_ctrl():
    pts = [(1.77, 0.0), (3.1, -0.05), (4.4, 0.55)]
    pts += [dl(-1.75, -2.4), dl(-1.62, -0.6), dl(-1.58, 0.9), dl(-1.62, 2.2), dl(-1.8, 3.4)]
    pts += [(3.6, 9.5), (2.2, 17.0), (-0.5, 27.0), (-1.0, 40.0), (0.8, 55.0), (1.2, 72.0)]
    return [Vector((x, y)) for x, y in pts]


def crom(P, n=40):
    """Catmull-Rom (zentripetal), danach geglättet: dichte Punktliste, stetige Richtung und Krümmung."""
    Q = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]
    out = []
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        t0 = 0.0
        t1 = t0 + (p1 - p0).length ** 0.5
        t2 = t1 + (p2 - p1).length ** 0.5
        t3 = t2 + (p3 - p2).length ** 0.5
        for k in range(n):
            t = t1 + (t2 - t1) * k / n
            a1 = p0 * ((t1 - t) / (t1 - t0)) + p1 * ((t - t0) / (t1 - t0))
            a2 = p1 * ((t2 - t) / (t2 - t1)) + p2 * ((t - t1) / (t2 - t1))
            a3 = p2 * ((t3 - t) / (t3 - t2)) + p3 * ((t - t2) / (t3 - t2))
            b1 = a1 * ((t2 - t) / (t2 - t0)) + a2 * ((t - t0) / (t2 - t0))
            b2 = a2 * ((t3 - t) / (t3 - t1)) + a3 * ((t - t1) / (t3 - t1))
            out.append(b1 * ((t2 - t) / (t2 - t1)) + b2 * ((t - t1) / (t2 - t1)))
    out.append(P[-1])
    for _ in range(40):   # Glättung, Enden fest
        out = [out[0]] + [(out[i - 1] + out[i] * 2 + out[i + 1]) / 4 for i in range(1, len(out) - 1)] + [out[-1]]
    return out


BAHN = crom(bahn_ctrl())
LEN = [0.0]
for i in range(1, len(BAHN)):
    LEN.append(LEN[-1] + (BAHN[i] - BAHN[i - 1]).length)


def bahn_at(s):
    s = max(0.0, min(LEN[-1], s))
    lo, hi = 0, len(LEN) - 1
    while hi - lo > 1:
        m = (lo + hi) // 2
        if LEN[m] <= s:
            lo = m
        else:
            hi = m
    f = (s - LEN[lo]) / max(1e-9, LEN[hi] - LEN[lo])
    return BAHN[lo].lerp(BAHN[hi], f)


def s_nearest(x, y):
    q = Vector((x, y))
    i = min(range(len(BAHN)), key=lambda k: (BAHN[k] - q).length)
    return LEN[i]


def band(name, s0, s1, m, z=0.0035, w=BREITE):
    """Flaches Band auf dem Papier von s0 bis s1 (Streifen, keine Rohrform)."""
    idx = [i for i in range(len(BAHN)) if s0 <= LEN[i] <= s1]
    if len(idx) < 2:
        return
    vs, fs = [], []
    for k, i in enumerate(idx):
        a = BAHN[max(i - 1, 0)]
        b = BAHN[min(i + 1, len(BAHN) - 1)]
        t = (b - a).normalized()
        n = Vector((-t.y, t.x))
        vs.append((BAHN[i].x + n.x * w / 2, BAHN[i].y + n.y * w / 2, z))
        vs.append((BAHN[i].x - n.x * w / 2, BAHN[i].y - n.y * w / 2, z))
        if k:
            j = 2 * k
            fs.append((j - 2, j - 1, j + 1, j))
    me = bpy.data.meshes.new(name)
    me.from_pydata(vs, [], fs)
    o = bpy.data.objects.new(name, me)
    link(o, False)
    me.materials.append(m)
    o.visible_shadow = False


def schiene_material():
    m = bpy.data.materials.new("schiene")
    nd, ln = nodes_of(m)
    out = nd.new("ShaderNodeOutputMaterial")
    b = principled(nd, ln, "#c3ccda", 0.9)
    b.inputs["Specular IOR Level"].default_value = 0.05
    fogged(nd, ln, b.outputs["BSDF"], out)
    return m


def faden(s_dot, rot_bis=None, w=BREITE):
    """Rot hinter dem Punkt, hellgraue Schiene davor (die eine Bahn, in jedem Bild identisch)."""
    band("faden_rot", 0.0, rot_bis if rot_bis is not None else s_dot, mat("rot"), w=w)
    if rot_bis is None:
        band("schiene", s_dot, LEN[-1], schiene_material(), w=w)


def scheibe(s, r=0.14):
    p = bahn_at(s)
    return cyl("punkt", r, 0.008, (p.x, p.y, 0.0075), mat("rot"), bevel=0.003, seg=96)


def export_bahn():
    import json
    pts = [[round(p.x, 4), round(p.y, 4)] for p in BAHN[::6]]
    json.dump({"einheit": "m", "ebene": "xy", "hoehe": 0.0035, "breite": BREITE, "laenge": round(LEN[-1], 3), "punkte": pts},
              open(os.path.join(HERE, "bahn.json"), "w"))


def local_cam(loc, tgt, lens, **kw):
    return kamera(tuple(DESK @ Vector(loc)), tuple(DESK @ Vector(tgt)), lens=lens, **kw)


HELL = dict(sky_top="#c4daf6", sky_hor="#f2f7fd", lower="#dfe8f5")


# ------------------------------------------------------------------ Bilder
def kb1():
    global GRID_R0, GRID_R1
    GRID_R0, GRID_R1 = 0.0, 0.01
    welt(haze=0.03, sun=(3.2, 1.0), sun_dir=(-40, 56), strength=1.15, light=0.55, **HELL)
    boden(y0=-0.35)
    o, xe, zb = letters((NAME_X0, 0, 0), size=0.5, extrude=0.016)
    r = 0.078
    cyl("punkt", r, 0.02, (1.77, 0.008, r * 0.95), mat("rot"), rot=(math.pi / 2, 0, 0), bevel=0.004, seg=96)
    dashed("bleistift_fein", (-2.15, 0.0, 0.002), (2.35, 0.0, 0.002), w=0.007, dash=0.07, gap=0.045)
    flush_lines()
    faden(0.0, rot_bis=22.0, w=0.09)
    kamera((0.9, -5.2, 0.075), (0.25, 0, 0.075), lens=40)
    render_setup(1440, 900, expo=-0.1, freestyle=False)
    render()


def name_stehend():
    letters((NAME_X0, 0, 0), size=0.5, extrude=0.016)
    letters((NAME_X0, -0.03, 0.0015), size=0.5, extrude=0.0, abdruck=True)
    dashed("bleistift_fein", (-2.15, 0.0, 0.002), (2.35, 0.0, 0.002), w=0.007, dash=0.07, gap=0.045)
    flush_lines()


def konstruktion():
    """Bleistift in der Schreibtischebene (BASE = DESK): Schnitt, Falz, Fluchtlinien mit Überstand, Netze, Maßlinie."""
    rect_pencil(-1.2, -0.03, 1.2, 0.93, "bleistift_fein", 0.007, dash=True)
    rect_pencil(-1.2, -0.03, 1.2, 0.93, "bleistift", 0.009, n=2)
    rect_pencil(1.5, 0.55, 2.1, 0.95, "bleistift", 0.009)
    dashed("bleistift_fein", (1.5, 0.75, 0.002), (2.1, 0.75, 0.002), 0.005)
    rect_pencil(1.5, -0.2, 2.2, 0.35, "bleistift", 0.009)
    arc("bleistift", (1.9, 1.6), 0.22, 0, math.tau, 0.005, seg=64)
    arc("bleistift_fein", (1.9, 1.6), 0.32, 0, math.tau, 0.004, seg=64, dash=True)
    for (a, b) in (((0, -1.8), (0, 2.6)), ((-1.7, 0.45), (3.2, 0.45))):
        dashed("bleistift_fein", (*a, 0.002), (*b, 0.002), 0.004, dash=0.2, gap=0.04)
    exact("bleistift_fein", (-1.2, -0.45, 0.002), (1.2, -0.45, 0.002), 0.005)
    for x in (-1.2, 1.2):
        stroke("bleistift_fein", (x, -0.55, 0.002), (x, -0.35, 0.002), 0.005, over=(0.0, 0.02), n=1)
        stroke("bleistift_fein", (x - 0.06, -0.51, 0.002), (x + 0.06, -0.39, 0.002), 0.005, over=(0.0, 0.01), n=1)
    for sx in (-1, 1):
        stroke("bleistift_fein", (sx * 1.2, 0.9, 0.002), (sx * 1.2, 2.6, 0.002), 0.004, over=(0.2, 0.5), n=1)
        stroke("bleistift_fein", (sx * 1.2, -0.03, 0.002), (sx * 1.2 + sx * 1.6, -0.03, 0.002), 0.004, over=(0.05, 0.15), n=1)
    rect_pencil(-0.07, -1.3, 1.17, -0.6, "bleistift", 0.009, dash=False)
    flush_lines()


def kb2():
    global BASE, GRID_R0, GRID_R1, GRID_C
    GRID_R0, GRID_R1, GRID_C = 4.0, 9.0, (3.0, 2.0, 0.0)
    welt(haze=0.016, sun=(3.4, 1.0), sun_dir=(-48, 55), strength=1.1, light=0.5, **HELL)
    boden()
    BASE = Matrix.Identity(4)
    name_stehend()
    BASE = DESK
    desk_bau()
    konstruktion()
    sd = s_nearest(*dl(-1.6, 0.2))
    pd = bahn_at(sd)
    BASE = Matrix.Identity(4)
    for tgt in (dl(-1.2, 0.0), dl(-1.5, 1.4), dl(-1.2, -0.8)):
        stroke("bleistift_dunkel", (pd.x + 0.5, pd.y, 0.002), (tgt[0], tgt[1], 0.002), 0.011, over=(0.0, 0.03), n=2)
    flush_lines()
    faden(sd)
    scheibe(sd)
    export_bahn()
    kamera((3.4, -0.9, 1.9), (6.4, 3.3, -0.5), lens=30)
    render_setup(1440, 900, expo=-0.15, freestyle=True, fs_alpha=0.6)
    render()


def szene_fertig(grid=(4.0, 9.0), gc=(3.0, 2.0, 0.0)):
    global BASE, GRID_R0, GRID_R1, GRID_C
    GRID_R0, GRID_R1 = grid
    GRID_C = gc
    boden()
    BASE = Matrix.Identity(4)
    name_stehend()
    BASE = DESK
    schreibtisch("fertig")
    box("abdr_platte", (2.4, 0.96, 0.002), (0, 0.45, 0.001), mat("abdruck"), bevel=0, zeich=False)
    rect_pencil(-1.2, -0.03, 1.2, 0.93, "bleistift_fein", 0.007, dash=True)
    flush_lines()
    BASE = Matrix.Identity(4)


def kb3(mobil=False):
    welt(haze=0.012, sun=(4.0, 1.0), sun_dir=(-38, 57), strength=1.1, light=0.45, **HELL)
    szene_fertig()
    sd = s_nearest(*dl(-1.58, 0.7))
    faden(sd)
    scheibe(sd)
    for (x, y, w, d, h) in [(-3.0, 14.0, 2.5, 1.5, 0.5), (9.0, 12.0, 3.0, 1.8, 0.7), (2.0, 20.0, 4.0, 2.0, 0.6)]:
        box("deko", (w, d, h), (x, y, h / 2), mat("weiss"), bevel=0.02, zeich=False)
    if mobil:
        local_cam((-0.45, -1.5, 1.5), (-0.2, 0.5, 0.95), 28)
        render_setup(780, 1688, expo=-0.15, freestyle=True, fs_alpha=0.65, fs_width=1.0)
    else:
        local_cam((-0.5, -2.5, 1.8), (-0.45, 0.5, 0.95), 38)
        render_setup(1440, 900, expo=-0.15, freestyle=True, fs_alpha=0.65)
    render()


def kb4():
    global BASE
    welt(haze=0.011, sun=(3.6, 1.0), sun_dir=(150, 48), strength=1.05, light=0.5, sky_top="#b9d3f5", sky_hor="#f2f7fd", lower="#dfe8f5")
    szene_fertig(grid=(10.0, 30.0), gc=(3.0, 8.0, 0.0))
    sd = s_nearest(*dl(-1.65, 2.8))
    faden(sd)
    scheibe(sd)
    rnd = random.Random(5)
    for i in range(30):
        t = i / 30.0
        y = 10.0 + t * 50
        side = -1 if i % 2 else 1
        x = side * (3.0 + rnd.random() * 3.0 + t * 6.0) + 1.0
        w = 0.8 + rnd.random() * 1.6 + t * 2.5
        d = 0.8 + rnd.random() * 1.6 + t * 2.0
        h = 0.15 + rnd.random() * 0.5 + t * 0.5
        if min((b - Vector((x, y))).length for b in BAHN[::8]) < 3.5 + w:
            continue
        box("block", (w, d, h), (x, y, h / 2), mat("weiss" if i % 3 else "hell"), bevel=0.01, zeich=False)

    def crt(x, y, s, rot):
        global BASE
        BASE = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(rot), 4, "Z")
        box("crt_k", (4.2 * s, 3.4 * s, 3.3 * s), (0, 0, 1.95 * s), mat("grau"), bevel=0.06 * s)
        box("crt_h", (3.0 * s, 2.8 * s, 2.3 * s), (0, 2.9 * s, 2.0 * s), mat("hell"), bevel=0.3 * s)
        box("crt_b", (3.6 * s, 0.12 * s, 2.7 * s), (0, -1.7 * s, 2.0 * s), mat("dunkel"), bevel=0.05 * s)
        box("crt_s", (3.1 * s, 0.1 * s, 2.2 * s), (0, -1.78 * s, 2.0 * s), mat("weiss"), bevel=0.2 * s)
        box("crt_f", (3.2 * s, 1.6 * s, 0.4 * s), (0, 0, 0.2 * s), mat("mittel"), bevel=0.05 * s)

    def flach(x, y, s, rot):
        global BASE
        BASE = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(rot), 4, "Z")
        box("fl_r", (6.4 * s, 0.22 * s, 3.9 * s), (0, 0, 3.5 * s), mat("dunkel"), bevel=0.04 * s)
        box("fl_s", (6.0 * s, 0.05 * s, 3.5 * s), (0, -0.13 * s, 3.5 * s), mat("weiss"), bevel=0.0)
        box("fl_h", (0.7 * s, 0.3 * s, 1.4 * s), (0, 0.3 * s, 1.0 * s), mat("mittel"), bevel=0.04 * s)
        box("fl_f", (2.8 * s, 1.3 * s, 0.15 * s), (0, 0, 0.08 * s), mat("grau"), bevel=0.03 * s)
    crt(-9.0, 62.0, 2.6, 25)
    flach(10.0, 70.0, 2.4, -20)
    BASE = Matrix.Identity(4)
    cp = bahn_at(sd - 3.4)
    tp = bahn_at(sd + 12)
    kamera((cp.x - 0.3, cp.y, 0.5), (tp.x + 7.0, tp.y - 4.5, 1.1), lens=20)
    render_setup(1440, 900, expo=-0.3, freestyle=True, fs_alpha=0.55)
    render()


{"kb-1-start": kb1, "kb-2-bau": kb2, "kb-3-monitor": kb3, "kb-3-mobil": lambda: kb3(True), "kb-4-uebergang": kb4}[SHOT]()
