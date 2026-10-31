"""
Build draped garment meshes for the online design studio.

The studio used to draw its garments from lathed profiles, so every shirt came out as a
smooth slab: no folds, no weight, no hint that it was cloth. Here the garment is cut as a
real pattern — neck hole, armholes, sleeves grown from the armhole edge, open hem — and
then dropped onto an invisible body form and run through Blender's cloth solver, so the
hem, the waist and the underarms settle the way fabric settles. The result is baked into
the geometry; nothing is simulated in the browser.

Artwork placement is deliberately NOT tied to the UVs. The web side projects the print
from object space, so these meshes only need one UV map, for tiling the fabric weave.

Run: blender -b -P make_garments.py -- <outdir> [name ...]
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = ARGS[0] if ARGS else "/out"
ONLY = {a for a in ARGS[1:] if not a.startswith("--")}
NO_DRAPE = "--no-drape" in ARGS      # export the cut shape alone, to check the pattern

# Body form, as ellipse cross-sections up the torso: (height, half-width, half-depth).
# Roughly a men's M on a 1.0-unit torso. x is left-right, y is front-back, z is up.
TORSO = [
    (0.995, 0.080, 0.072),   # base of the neck
    (0.950, 0.165, 0.095),
    (0.910, 0.215, 0.108),   # shoulder line
    (0.845, 0.224, 0.120),
    (0.775, 0.214, 0.126),   # chest
    (0.690, 0.198, 0.121),
    (0.600, 0.188, 0.115),   # waist
    (0.505, 0.196, 0.120),   # hip
    (0.410, 0.194, 0.118),
    (0.330, 0.190, 0.116),
]
SEG = 40                      # points around a ring; must be divisible by 4
SHOULDER_Z = 0.910
ARM_DROP = math.radians(55)   # how far the sleeves hang below horizontal
ARM_LEN = 0.46

# The armhole is cut around the left and right extremes of the tube (x = +/- max), which
# sit at segment 0 and segment SEG/2.
ARM_HALF = 3                  # segments either side of the extreme
ARM_BANDS = 2                 # ring bands the armhole spans
ARM_TOP = 0                   # first ring of the armhole; 0 puts the sleeve head on the
                              # shoulder line, which is how a loose tee is cut


def ell(z, rx, ry, i, segments=SEG):
    a = 2 * math.pi * i / segments
    return (math.cos(a) * rx, math.sin(a) * ry, z)


def make_body():
    bm = bmesh.new()
    rings = [[bm.verts.new(ell(z, rx, ry, i)) for i in range(SEG)] for (z, rx, ry) in TORSO]
    for k in range(len(rings) - 1):
        for i in range(SEG):
            j = (i + 1) % SEG
            bm.faces.new((rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]))
    bmesh.ops.contextual_create(bm, geom=rings[0])
    bmesh.ops.contextual_create(bm, geom=rings[-1])
    for sign in (1, -1):
        d = Vector((sign * math.cos(ARM_DROP), 0, -math.sin(ARM_DROP))).normalized()
        start = Vector((sign * 0.20, 0.0, SHOULDER_Z - 0.03))
        side = d.cross(Vector((0, 0, 1))).normalized()
        other = d.cross(side).normalized()
        loops = []
        for k in range(8):
            t = k / 7
            c = start + d * (ARM_LEN * t)
            r = 0.064 - 0.016 * t
            loops.append([bm.verts.new(c + side * math.cos(2 * math.pi * i / 16) * r
                                         + other * math.sin(2 * math.pi * i / 16) * r)
                          for i in range(16)])
        for k in range(7):
            for i in range(16):
                j = (i + 1) % 16
                bm.faces.new((loops[k][i], loops[k][j], loops[k + 1][j], loops[k + 1][i]))
    me = bpy.data.meshes.new("body")
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new("body", me)
    bpy.context.collection.objects.link(ob)
    return ob


def armhole_segments():
    """Segment indices the armholes occupy, as two ordered runs (right side, left side)."""
    runs = []
    for centre in (0, SEG // 2):
        runs.append([(centre + d) % SEG for d in range(-ARM_HALF, ARM_HALF + 1)])
    return runs


def make_garment(sleeve, hem_z, neck_wide, ease):
    """`sleeve` is 0..1 of the arm length; `ease` is how much looser than the body it is cut."""
    bm = bmesh.new()

    body_rings = [t for t in TORSO if t[0] >= hem_z]
    # the shirt hangs past the lowest body section, so add a hem ring below it
    lz, lrx, lry = body_rings[-1]
    profile = [(z, rx, ry) for (z, rx, ry) in body_rings if z <= SHOULDER_Z]
    profile.append((hem_z - 0.05, lrx, lry))

    def grow(z, r):
        # Keep the shoulders close to the body. Widening them as much as the waist is what
        # made the yoke read as a cape rather than a shoulder line.
        if z >= 0.86:
            return r * (1.0 + ease * 0.3) + 0.006
        return r * (1.0 + ease) + 0.014

    rings = [[bm.verts.new(ell(z, grow(z, rx), grow(z, ry), i)) for i in range(SEG)]
             for (z, rx, ry) in profile]

    holes = armhole_segments()
    blocked = set()
    for run in holes:
        for band in range(ARM_TOP, ARM_TOP + ARM_BANDS):
            for i in run[:-1]:
                blocked.add((band, i))

    for k in range(len(rings) - 1):
        for i in range(SEG):
            j = (i + 1) % SEG
            if (k, i) in blocked:
                continue
            bm.faces.new((rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]))

    # Yoke: neck ring -> shoulder ring. This closes the top and leaves the neck hole.
    # Yoke in two steps — neck, shoulder slope, shoulder line — so the shoulder actually
    # slopes instead of jumping straight out to full width.
    nz, nrx, nry = TORSO[0]
    neck = [bm.verts.new(ell(0.974, nrx * neck_wide, nry * neck_wide, i)) for i in range(SEG)]
    sz, srx, sry = TORSO[1]
    slope = [bm.verts.new(ell(sz, grow(sz, srx), grow(sz, sry), i)) for i in range(SEG)]
    for a, b in ((neck, slope), (slope, rings[0])):
        for i in range(SEG):
            j = (i + 1) % SEG
            bm.faces.new((a[i], a[j], b[j], b[i]))

    pinned = ([tuple(v.co) for v in neck] + [tuple(v.co) for v in slope]
              + [tuple(v.co) for v in rings[0]])

    # Sleeves: grow straight out of the armhole edge, so the counts always match.
    if sleeve > 0.02:
        for run, sign in zip(holes, (1, -1)):
            lo, hi = ARM_TOP, ARM_TOP + ARM_BANDS
            loop = ([rings[lo][i] for i in run]
                    + [rings[b][run[-1]] for b in range(lo + 1, hi + 1)]
                    + [rings[hi][i] for i in reversed(run)]
                    + [rings[b][run[0]] for b in range(hi, lo, -1)])
            seen, ordered = set(), []
            for v in loop:
                if v not in seen:
                    seen.add(v); ordered.append(v)
            centre = sum((v.co for v in ordered), Vector()) / len(ordered)
            d = Vector((sign * math.cos(ARM_DROP), 0, -math.sin(ARM_DROP))).normalized()
            prev, steps = ordered, 6
            for s in range(1, steps + 1):
                t = s / steps
                taper = 1.0 - 0.34 * t
                cur = [bm.verts.new(centre + d * (0.04 + ARM_LEN * sleeve * t)
                                    + (v.co - centre) * taper) for v in ordered]
                # Hold the sleeves to their cut shape. Left to the solver they roll up on
                # themselves, because there is no arm inside them pushing back.
                pinned.extend(tuple(v.co) for v in cur)
                n = len(ordered)
                for i in range(n):
                    j = (i + 1) % n
                    bm.faces.new((prev[i], prev[j], cur[j], cur[i]))
                prev = cur

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("garment")
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new("garment", me)
    bpy.context.collection.objects.link(ob)

    vg = ob.vertex_groups.new(name="pin")
    want = {tuple(round(c, 6) for c in p) for p in pinned}
    vg.add([v.index for v in me.vertices
            if tuple(round(c, 6) for c in v.co) in want], 1.0, 'REPLACE')
    return ob


def drape(garment, body, frames=32):
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.modifier_add(type='COLLISION')
    body.modifiers["Collision"].settings.thickness_outer = 0.010
    body.select_set(False)

    bpy.context.view_layer.objects.active = garment
    garment.select_set(True)
    bpy.ops.object.modifier_add(type='SUBSURF')
    sub = garment.modifiers["Subdivision"]
    sub.levels = sub.render_levels = 1
    bpy.ops.object.modifier_apply(modifier="Subdivision")

    bpy.ops.object.modifier_add(type='CLOTH')
    c = garment.modifiers["Cloth"].settings
    c.quality = 5
    c.mass = 0.30
    c.tension_stiffness = 14
    c.compression_stiffness = 14
    c.shear_stiffness = 5
    c.bending_stiffness = 2.5         # enough body that the shirt settles rather than crumples
    c.air_damping = 2.0
    c.vertex_group_mass = "pin"
    col = garment.modifiers["Cloth"].collision_settings
    col.distance_min = 0.006
    col.use_self_collision = True
    col.self_distance_min = 0.004
    col.collision_quality = 4

    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, frames
    for f in range(1, frames + 1):
        sc.frame_set(f)
    bpy.ops.object.convert(target='MESH')     # bake the simulated shape into the mesh


def finish(garment, tris):
    bpy.context.view_layer.objects.active = garment
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.quads_convert_to_tris()
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.01)
    bpy.ops.object.mode_set(mode='OBJECT')
    if len(garment.data.polygons) > tris:
        bpy.ops.object.modifier_add(type='DECIMATE')
        garment.modifiers["Decimate"].ratio = tris / len(garment.data.polygons)
        bpy.ops.object.modifier_apply(modifier="Decimate")
    bpy.ops.object.shade_smooth()
    garment.data.use_auto_smooth = True
    garment.data.auto_smooth_angle = math.radians(62)


CUTS = {
    "tee-sleeveless":   dict(sleeve=0.00, hem_z=0.410, neck_wide=1.45, ease=0.07),
    "tee-short":        dict(sleeve=0.30, hem_z=0.410, neck_wide=1.30, ease=0.09),
    "tee-threequarter": dict(sleeve=0.68, hem_z=0.410, neck_wide=1.30, ease=0.10),
    "tee-long":         dict(sleeve=0.92, hem_z=0.380, neck_wide=1.30, ease=0.11),
}

os.makedirs(OUT, exist_ok=True)
for name, kw in CUTS.items():
    if ONLY and name not in ONLY:
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    body = make_body()
    g = make_garment(**kw)
    if not NO_DRAPE:
        drape(g, body)
    bpy.data.objects.remove(body, do_unlink=True)
    finish(g, tris=9000)
    g.name = name
    bpy.ops.object.select_all(action='DESELECT')
    g.select_set(True)
    bpy.context.view_layer.objects.active = g
    path = os.path.join(OUT, f"{name}.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB',
                              use_selection=True, export_apply=True,
                              export_materials='NONE', export_yup=True)
    print(f"WROTE {path}  tris={len(g.data.polygons)}  verts={len(g.data.vertices)}")
