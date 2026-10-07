# مرطبان عسل ثلاثي الأبعاد (Cycles): زجاج حقيقي، عسل بيشع بالضو الخلفي، ملعقة خشب على الحافة،
# وسطح العسل بيتموّج لما تنزل النقطة (Wave modifier). خلفية شفافة + ظل تلامس.
#
#   .venv-blender/bin/python projects/bees/blender/jar.py -- --out projects/bees/assets/gen/jar --frames 0-50 [--res 800x1000] [--samples 48]
#   الفريم 0 = t 15.0s بالفيديو (30fps)؛ النقطة بتلمس العسل بالفريم IMPACT.
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(k, d):
    return argv[argv.index(k) + 1] if k in argv else d
OUT = arg('--out', '/tmp/jar')
F0, F1 = map(int, arg('--frames', '0-50').split('-'))
RW, RH = map(int, arg('--res', '800x1000').split('x'))
SAMPLES = int(arg('--samples', '48'))
STILL = '--still' in argv
IMPACT = 18  # t 15.6

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.cycles.samples = SAMPLES; sc.cycles.use_adaptive_sampling = True; sc.cycles.use_denoising = True
sc.cycles.max_bounces = 10; sc.cycles.transmission_bounces = 10; sc.cycles.transparent_max_bounces = 8
sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = RW, RH
sc.render.film_transparent = True
sc.render.fps = 30
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'Medium High Contrast'; sc.view_settings.exposure = -0.2
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'

w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.95, 0.9, 0.8, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 0.6

def mat(name, f):
    m = bpy.data.materials.new(name); m.use_nodes = True; f(m.node_tree, m.node_tree.nodes['Principled BSDF']); return m
def glass_f(nt, b):
    b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 0.02
    b.inputs['Transmission Weight'].default_value = 1.0; b.inputs['IOR'].default_value = 1.47
GLASS = mat('glass', glass_f)
def honey_f(nt, b):
    b.inputs['Base Color'].default_value = (1.0, 0.62, 0.12, 1); b.inputs['Roughness'].default_value = 0.04
    b.inputs['Transmission Weight'].default_value = 1.0; b.inputs['IOR'].default_value = 1.49
    vol = nt.nodes.new('ShaderNodeVolumeAbsorption'); vol.inputs['Color'].default_value = (0.95, 0.5, 0.07, 1); vol.inputs['Density'].default_value = 0.85
    nt.links.new(vol.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
HONEY = mat('honey', honey_f)
def wood_f(nt, b):
    b.inputs['Base Color'].default_value = (0.55, 0.32, 0.14, 1); b.inputs['Roughness'].default_value = 0.55
    n = nt.nodes.new('ShaderNodeTexWave'); n.inputs['Scale'].default_value = 6; n.inputs['Distortion'].default_value = 4
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = (0.42, 0.22, 0.09, 1); cr.color_ramp.elements[1].color = (0.66, 0.42, 0.2, 1)
    nt.links.new(n.outputs['Fac'], cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
WOOD = mat('wood', wood_f)

def lathe(name, prof, segs=96, m=None, smooth=True):
    bm = bmesh.new()
    rings = []
    for k in range(segs):
        a = 2 * math.pi * k / segs
        rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in prof])
    for k in range(segs):
        A, B = rings[k], rings[(k + 1) % segs]
        for i in range(len(prof) - 1):
            bm.faces.new((A[i], B[i], B[i + 1], A[i + 1]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o)
    if m: o.data.materials.append(m)
    return o

# بروفايل المرطبان (نص قطر، ارتفاع): قاعدة ← بطن منفوخ ← رقبة ← حافة
P = [(0.0, 0.0), (0.7, 0.0), (0.92, 0.08), (1.02, 0.35), (1.05, 0.7), (1.0, 1.05), (0.86, 1.32), (0.7, 1.45), (0.66, 1.55), (0.7, 1.62), (0.7, 1.7)]
jar = lathe('jar', P, m=GLASS)
sol = jar.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.045; sol.offset = 1
sub = jar.modifiers.new('sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2

# العسل: نفس البروفايل لجوّا، لحد ارتفاع 1.22، وسطح مقسّم للتموّج
HL = 1.22
def inner(r, z): return (max(0, r - 0.05), z + 0.04)
hp = [inner(r, z) for r, z in P if z <= HL] + [(0.93, HL)]
honey = lathe('honey', hp, m=HONEY)
hs = honey.modifiers.new('sub', 'SUBSURF'); hs.levels = 2; hs.render_levels = 2
bpy.ops.mesh.primitive_circle_add(vertices=128, radius=0.93, fill_type='NGON', location=(0, 0, HL))
top = bpy.context.object; top.data.materials.append(HONEY)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.poke(); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.subdivide(number_cuts=10); bpy.ops.object.mode_set(mode='OBJECT')
for p in top.data.polygons: p.use_smooth = True
wv = top.modifiers.new('wave', 'WAVE'); wv.use_x = wv.use_y = True; wv.use_normal = False
wv.height = 0.035; wv.width = 0.22; wv.speed = 0.045; wv.narrowness = 1.6
wv.time_offset = IMPACT; wv.lifetime = 40; wv.damping_time = 30
wv.start_position_x = 0.12; wv.start_position_y = -0.05

# الملعقة الخشب: مسنودة على الحافة، راسها جوّا العسل
spoon = bpy.data.objects.new('spoon', None); sc.collection.objects.link(spoon)
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.045, depth=1.7, location=(0, 0, 0.85))
h = bpy.context.object; h.data.materials.append(WOOD); h.parent = spoon
for i in range(5):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.12 + 0.025 * math.sin(i / 4 * math.pi), minor_radius=0.05, location=(0, 0, 0.05 + i * 0.09))
    t = bpy.context.object; t.data.materials.append(WOOD); t.parent = spoon
# طبقة عسل على راس الملعقة
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.2, location=(0, 0, 0.2)); hc = bpy.context.object
hc.scale = (1, 1, 1.7); hc.data.materials.append(HONEY); hc.parent = spoon
for o in (h, hc):
    for p in o.data.polygons: p.use_smooth = True
spoon.location = (0.25, 0.1, 0.95); spoon.rotation_euler = (math.radians(4), math.radians(-24), 0)

# أرض بتلقط الظل
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0)); bpy.context.object.is_shadow_catcher = True

# ضو: مفتاح دافي من فوق-يسار، ضو خلفي قوي (العسل بيشع)، تعبئة ناعمة
def area(name, loc, energy, size, color):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = size; l.color = color
    o = bpy.data.objects.new(name, l); o.location = loc; sc.collection.objects.link(o)
    c = o.constraints.new('TRACK_TO'); c.target = jar; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'; return o
area('key', (-4, -3, 5), 900, 3, (1.0, 0.88, 0.7))
area('rim', (2.5, 5, 2.5), 1400, 2.5, (1.0, 0.75, 0.4))
area('fill', (4, -4, 2), 160, 6, (0.9, 0.93, 1.0))

cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 70; cam_d.sensor_fit = 'VERTICAL'
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -10.2, 4.3)
tgt = bpy.data.objects.new('tgt', None); tgt.location = (0, 0, 1.2); sc.collection.objects.link(tgt)
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
# لفّة بطيئة جداً للمرطبان (بتبيّن إنه مجسم حقيقي)
root = bpy.data.objects.new('root', None); sc.collection.objects.link(root)
for o in (jar, honey, top, spoon): o.parent = root
root.rotation_euler = (0, 0, math.radians(-6)); root.keyframe_insert('rotation_euler', frame=0)
root.rotation_euler = (0, 0, math.radians(10)); root.keyframe_insert('rotation_euler', frame=75)

os.makedirs(OUT, exist_ok=True)
frames = [int(arg('--still', '0'))] if STILL else range(F0, F1 + 1, int(arg('--step', '1')))  # step 2 = 15fps (اللفّة بطيئة)
for f in frames:
    sc.frame_set(f)
    p = os.path.join(OUT, f'{f:04d}.png')
    if os.path.exists(p) and not STILL: continue
    sc.render.filepath = p
    bpy.ops.render.render(write_still=True)
    print('frame', f, flush=True)
