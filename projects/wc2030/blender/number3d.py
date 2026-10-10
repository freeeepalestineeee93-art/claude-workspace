# رقم ثلاثي الأبعاد ضخم (متل «115» بمرجع الجزيرة): وجه معدني رمادي فاتح، جوانب غامقة، حافة مشطوفة،
# واقف على أرض بظل تلامس، كاميرا من تحت شوي. خلفية شفافة.
#   .venv-blender/bin/python projects/wc2030/blender/number3d.py -- --text 100 --out projects/wc2030/assets/gen/num100.png [--res 1600x1100] [--samples 64]
import bpy, bmesh, math, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(k, d): return argv[argv.index(k) + 1] if k in argv else d
TEXT = arg('--text', '100'); OUT = arg('--out', '/tmp/num.png')
RW, RH = map(int, arg('--res', '1600x1100').split('x')); SAMPLES = int(arg('--samples', '64'))
FONT = arg('--font', 'assets/fonts/private/aljazeera/AlJazeera-Heavy.otf')

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = RW, RH; sc.render.film_transparent = True
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'Medium High Contrast'
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.92, 0.9, 0.84, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.18

def mat(name, col, metal, rough, bump=0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    if bump:  # خدوش معدن مصقول خفيفة
        nt = m.node_tree; n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 300; n.inputs['Detail'].default_value = 4
        mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, 40, 1); tc = nt.nodes.new('ShaderNodeTexCoord')
        nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], n.inputs['Vector'])
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
        nt.links.new(n.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m
FACE = mat('face', (0.62, 0.62, 0.6), 0.85, 0.3, 0.06)
SIDE = mat('side', (0.05, 0.05, 0.055), 0.25, 0.55)
EDGE = mat('edge', (0.86, 0.86, 0.82), 1.0, 0.18)

cu = bpy.data.curves.new('num', 'FONT'); cu.body = TEXT
cu.font = bpy.data.fonts.load(FONT); cu.align_x = 'CENTER'; cu.size = 2.0
cu.extrude = 0.32; cu.bevel_depth = 0.035; cu.bevel_resolution = 3; cu.space_character = 1.06
o = bpy.data.objects.new('num', cu); sc.collection.objects.link(o)
o.rotation_euler = (math.radians(90), 0, 0)   # واقف
bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.convert(target='MESH')
o = bpy.context.object
for m in (FACE, SIDE, EDGE): o.data.materials.append(m)
# المواد حسب اتجاه الوجه: لقدّام = وجه، مايل = حافة الشطف، الباقي = جوانب
for p in o.data.polygons:
    n = (o.matrix_world.to_3x3() @ p.normal).normalized()
    p.material_index = 0 if n.y < -0.97 else (2 if n.y < -0.3 else 1)
    p.use_smooth = True
o.data.shade_auto_smooth(angle=math.radians(35)) if hasattr(o.data, 'shade_auto_smooth') else None
# على الأرض
bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
o.location.z -= min(v.z for v in bb)
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2; o.location.x -= cx

bpy.ops.mesh.primitive_plane_add(size=60); bpy.context.object.is_shadow_catcher = True

def area(name, loc, energy, size, color):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = size; l.color = color
    ob = bpy.data.objects.new(name, l); ob.location = loc; sc.collection.objects.link(ob)
    t = ob.constraints.new('TRACK_TO'); t.target = o; t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'
area('key', (-5, -6, 6), 1000, 4, (1.0, 0.97, 0.92))
area('rim', (5, 4, 4), 900, 3, (0.9, 1.0, 0.85))
area('fill', (4, -7, 1.5), 400, 6, (1, 1, 1))

cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 40
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0.35, -5.2, 0.55)
tg = bpy.data.objects.new('tg', None); tg.location = (0, 0, 0.95); sc.collection.objects.link(tg)
c = cam.constraints.new('TRACK_TO'); c.target = tg; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('✓', OUT)
