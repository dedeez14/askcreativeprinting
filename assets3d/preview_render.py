"""Render a GLB from two angles so the drape can be judged by eye.

Run: blender -b -P preview_render.py -- <glb> <outpng>
"""
import bpy, sys, math, os
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
GLB, OUT = a[0], a[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
ob = obs[0]

mat = bpy.data.materials.new("cloth")
mat.use_nodes = True
b = mat.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.05, 0.22, 0.55, 1)
b.inputs["Roughness"].default_value = 0.78
ob.data.materials.clear()
ob.data.materials.append(mat)

# soft studio light: a big area key, a weaker fill, and a rim
for pos, energy, size in [((2.2, -2.6, 2.4), 900, 3.0),
                          ((-2.6, -1.4, 1.2), 260, 3.0),
                          ((0.0, 3.0, 2.0), 320, 2.5)]:
    l = bpy.data.lights.new("k", type='AREA'); l.energy = energy; l.size = size
    o = bpy.data.objects.new("k", l); o.location = pos
    o.rotation_euler = (Vector((0, 0, 0.9)) - Vector(pos)).to_track_quat('Z', 'Y').to_euler()
    bpy.context.collection.objects.link(o)

world = bpy.data.worlds.new("w"); world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.9, 0.91, 0.93, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
bpy.context.scene.world = world

sc = bpy.context.scene
sc.render.engine = 'CYCLES'   # EEVEE needs a GL context; this runs headless
sc.render.resolution_x, sc.render.resolution_y = 900, 1000
sc.render.film_transparent = False
sc.cycles.device = 'CPU'
sc.cycles.samples = 64
sc.cycles.use_denoising = True

cam_data = bpy.data.cameras.new("c"); cam_data.lens = 70
cam = bpy.data.objects.new("c", cam_data)
bpy.context.collection.objects.link(cam)
sc.camera = cam

target = Vector((0, 0, 0.66))
for tag, ang in (("front", math.radians(0)), ("side", math.radians(55))):
    d = 2.9
    cam.location = (math.sin(ang) * d, -math.cos(ang) * d, 0.95)
    cam.rotation_euler = (target - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = OUT.replace(".png", f"-{tag}.png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED", sc.render.filepath)
