# قرص عسل ثلاثي الأبعاد حقيقي (Cycles): خلايا سداسية شمعية، عسل لامع جوّا، خلايا مختومة،
# حافة مكسورة. الكاميرا بتبلّش ماكرو جوّا خلية (عمق ميدان) وبتسحب لورا لتكشف القرص، وموجة ضو
# بتمرق على الخلايا مع العدّاد. الخلفية شفافة + ظل تلامس، فبيتركّب بـ Remotion فوق الحقل.
#
#   .venv-blender/bin/python projects/bees/blender/comb.py -- --out projects/bees/assets/gen/comb --frames 0-113 [--res 1080x1920] [--samples 32]
#   الفريم 0 = t 11.1s بالفيديو (30fps).
import bpy, bmesh, math, sys, random
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(k, d):
    return argv[argv.index(k) + 1] if k in argv else d
OUT = arg('--out', '/tmp/comb')
F0, F1 = map(int, arg('--frames', '0-113').split('-'))
RW, RH = map(int, arg('--res', '1080x1920').split('x'))
SAMPLES = int(arg('--samples', '32'))
STILL = '--still' in argv

random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SAMPLES
sc.cycles.use_adaptive_sampling = True
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.cycles.transmission_bounces = 6
sc.cycles.glossy_bounces = 3
sc.render.resolution_x, sc.render.resolution_y = RW, RH
sc.render.film_transparent = True
sc.render.fps = 30
sc.render.use_motion_blur = True
sc.render.motion_blur_shutter = 0.45
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'Medium High Contrast'
sc.view_settings.exposure = -0.35
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.frame_start, sc.frame_end = F0, F1

# العالم: كريمي دافي (انعكاسات وانكسارات بلون خلفية الفيديو)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.93, 0.88, 0.78, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 0.35

def mat(name, build):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    build(nt, b); return m

def bump(nt, b, scale=40, strength=0.15):
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = 8
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength
    nt.links.new(n.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])

def wax_b(nt, b):
    b.inputs['Base Color'].default_value = (0.62, 0.33, 0.05, 1)
    b.inputs['Roughness'].default_value = 0.32
    b.inputs['Subsurface Weight'].default_value = 0.15
    b.inputs['Subsurface Radius'].default_value = (1.0, 0.55, 0.15)
    b.inputs['Subsurface Scale'].default_value = 0.08
    bump(nt, b, 60, 0.2)
WAX = mat('wax', wax_b)

def cap_b(nt, b):
    b.inputs['Base Color'].default_value = (0.82, 0.55, 0.16, 1)
    b.inputs['Roughness'].default_value = 0.5
    b.inputs['Subsurface Weight'].default_value = 0.12
    b.inputs['Subsurface Radius'].default_value = (1.0, 0.7, 0.3)
    b.inputs['Subsurface Scale'].default_value = 0.05
    bump(nt, b, 25, 0.35)
CAP = mat('cap', cap_b)

# العسل: لامع + subsurface عنبري + موجة ضو (emission) بتنتشر من النص
wave = None
def honey_b(nt, b):
    global wave
    b.inputs['Base Color'].default_value = (0.8, 0.36, 0.02, 1)
    b.inputs['Roughness'].default_value = 0.05
    b.inputs['Coat Weight'].default_value = 1.0
    b.inputs['Coat Roughness'].default_value = 0.03
    b.inputs['Subsurface Weight'].default_value = 0.35
    b.inputs['Subsurface Radius'].default_value = (1.0, 0.35, 0.03)
    b.inputs['Subsurface Scale'].default_value = 0.25
    tc = nt.nodes.new('ShaderNodeTexCoord')
    ln = nt.nodes.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'
    nt.links.new(tc.outputs['Object'], ln.inputs[0])
    wave = nt.nodes.new('ShaderNodeValue'); wave.label = 'R'
    sub = nt.nodes.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'
    nt.links.new(ln.outputs['Value'], sub.inputs[0]); nt.links.new(wave.outputs[0], sub.inputs[1])
    ab = nt.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'; nt.links.new(sub.outputs[0], ab.inputs[0])
    band = nt.nodes.new('ShaderNodeMapRange'); band.inputs['From Min'].default_value = 0.0; band.inputs['From Max'].default_value = 1.4
    band.inputs['To Min'].default_value = 1.0; band.inputs['To Max'].default_value = 0.0
    nt.links.new(ab.outputs[0], band.inputs['Value'])
    sm = nt.nodes.new('ShaderNodeMath'); sm.operation = 'POWER'; sm.inputs[1].default_value = 2.0
    nt.links.new(band.outputs['Result'], sm.inputs[0])
    gain = nt.nodes.new('ShaderNodeMath'); gain.operation = 'MULTIPLY'; gain.inputs[1].default_value = 3.2; gain.label = 'gain'
    nt.links.new(sm.outputs[0], gain.inputs[0])
    b.inputs['Emission Color'].default_value = (1.0, 0.72, 0.25, 1)
    nt.links.new(gain.outputs[0], b.inputs['Emission Strength'])
HONEY = mat('honey', honey_b)

# ── الهندسة ──
R = 0.5            # نص قطر الخلية (ركن لركن)
T = 0.085          # سماكة الجدار
D = 0.9            # عمق الخلية
dx, dy = math.sqrt(3) * R, 1.5 * R

def hex_pts(r, z):
    return [Vector((r * math.cos(math.pi / 6 + i * math.pi / 3), r * math.sin(math.pi / 6 + i * math.pi / 3), z)) for i in range(6)]

bm_w, bm_h, bm_c = bmesh.new(), bmesh.new(), bmesh.new()
def ring(bm, cx, cy, h):
    o0, o1 = hex_pts(R, 0), hex_pts(R, h)
    i0, i1 = hex_pts(R - T, 0), hex_pts(R - T, h)
    vs = [[bm.verts.new(p + Vector((cx, cy, 0))) for p in L] for L in (o0, o1, i0, i1)]
    for k in range(6):
        j = (k + 1) % 6
        bm.faces.new((vs[0][k], vs[0][j], vs[1][j], vs[1][k]))   # برّا
        bm.faces.new((vs[2][j], vs[2][k], vs[3][k], vs[3][j]))   # جوّا
        bm.faces.new((vs[1][k], vs[1][j], vs[3][j], vs[3][k]))   # الحافة
def plug(bm, cx, cy, z, dome, r):
    c = bm.verts.new((cx, cy, z + dome))
    ring_v = [bm.verts.new(p + Vector((cx, cy, 0))) for p in hex_pts(r, z)]
    mid = [bm.verts.new(Vector((cx, cy, 0)) + (p - Vector((0, 0, z))) * 0.55 + Vector((0, 0, z + dome * 0.75))) for p in hex_pts(r, z)]
    for k in range(6):
        j = (k + 1) % 6
        bm.faces.new((ring_v[k], ring_v[j], mid[j], mid[k])); bm.faces.new((mid[k], mid[j], c))

cells = []
for row in range(-9, 10):
    for col in range(-8, 9):
        cx, cy = col * dx + (row % 2) * dx / 2, row * dy
        # حافة طبيعية مش مستطيلة: إهليلج مع ضجيج
        e = (cx / 4.6) ** 2 + (cy / 3.9) ** 2 + random.uniform(-0.12, 0.12)
        if e > 1: continue
        broken = e > 0.82
        h = D * (random.uniform(0.35, 0.8) if broken else random.uniform(0.97, 1.0))
        ring(bm_w, cx, cy, h)
        d = math.hypot(cx, cy)
        capped = (cx > 2.2 and cy < 0.8 and random.random() < 0.85) or random.random() < 0.06
        if capped and not broken:
            plug(bm_c, cx, cy, h * 0.97, 0.07, R - T * 0.6)
        elif not broken or random.random() < 0.5:
            lvl = h * random.uniform(0.8, 0.93)
            plug(bm_h, cx, cy, lvl, -0.05 + random.uniform(-0.02, 0.03), R - T * 0.55)
        cells.append((cx, cy))

def to_obj(bm, name, m, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); o.data.materials.append(m)
    sc.collection.objects.link(o); return o

comb = bpy.data.objects.new('comb', None); sc.collection.objects.link(comb)
walls = to_obj(bm_w, 'walls', WAX, smooth=False)
bev = walls.modifiers.new('bev', 'BEVEL'); bev.width = 0.012; bev.segments = 2
honey = to_obj(bm_h, 'honey', HONEY)
caps = to_obj(bm_c, 'caps', CAP)
# القاعدة (الجدار الأوسط) — مسطحة بشكل القرص
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1, depth=0.12, location=(0, 0, -0.06))
base = bpy.context.object; base.scale = (4.1, 3.4, 1); base.data.materials.append(WAX)
for o in (walls, honey, caps, base): o.parent = comb
# مركز موجة الضو = مركز القرص (Texture Coordinate → Object بيستعمل الأوبجكت نفسه: honey مركزه 0)

# القرص مايل شوي متل الصورة الأصلية
comb.rotation_euler = (math.radians(-8), math.radians(4), math.radians(-14))

# أرض شفافة بتلقط الظل بس (ظل تلامس حقيقي)
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -0.9))
ground = bpy.context.object; ground.is_shadow_catcher = True

# ── إضاءة: شمس دافية من فوق-يسار + ضو خلفي بيخلّي العسل يشع + تعبئة ناعمة ──
def area(name, loc, rot, energy, size, color):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = size; l.color = color
    o = bpy.data.objects.new(name, l); o.location = loc; o.rotation_euler = rot; sc.collection.objects.link(o); return o
area('key', (-7, 5, 9), (math.radians(35), math.radians(-30), math.radians(-35)), 2600, 4, (1.0, 0.84, 0.6))
area('rim', (6, -8, 3), (math.radians(70), math.radians(25), math.radians(40)), 1600, 4, (1.0, 0.7, 0.35))
area('fill', (4, 9, 6), (math.radians(-45), math.radians(20), 0), 120, 10, (0.85, 0.9, 1.0))

# ── الكاميرا: ماكرو جوّا خلية ← سحب لورا بـ ease قوي ← drift بطيء ──
cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 50; cam_d.sensor_fit = 'VERTICAL'
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
tgt = bpy.data.objects.new('tgt', None); sc.collection.objects.link(tgt)
tc = cam.constraints.new('TRACK_TO'); tc.target = tgt; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
cam_d.dof.use_dof = True; cam_d.dof.focus_object = tgt

# خلية البطل (أقرب خلية عسل للنص)
hx, hy = min(cells, key=lambda c: math.hypot(c[0] + 0.4, c[1] - 0.3))
def key(f, cam_loc, tgt_loc, fstop, ease='BEZIER'):
    cam.location = cam_loc; tgt.location = tgt_loc; cam_d.dof.aperture_fstop = fstop
    for o, p in ((cam, 'location'), (tgt, 'location')): o.keyframe_insert(p, frame=f)
    cam_d.dof.keyframe_insert('aperture_fstop', frame=f)
key(0, (hx + 0.15, hy - 0.55, 1.75), (hx, hy, 0.7), 1.2)
key(38, (2.4, -20.0, 27.0), (0.0, 0.2, 0), 8.0)
key(113, (0.6, -20.8, 26.0), (0.0, 0.2, 0), 9.0)
# ease أفتر: خروج ناعم من الماكرو ووصول طويل (influence عالي)
for o in (cam, tgt, cam_d):
    ad = o.animation_data
    for fc in ad.action.fcurves if hasattr(ad.action, 'fcurves') else []:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'; kp.easing = 'EASE_IN_OUT'
            kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'

# موجة الضو: نص القطر R من 0 لـ 9 بين t 12.25 و 13.95 (فريم 34 ← 85)، وبعدها بتطفى
HONEY.node_tree.nodes['Value'].outputs[0].default_value = -3
HONEY.node_tree.nodes['Value'].outputs[0].keyframe_insert('default_value', frame=34)
HONEY.node_tree.nodes['Value'].outputs[0].default_value = 9.5
HONEY.node_tree.nodes['Value'].outputs[0].keyframe_insert('default_value', frame=88)

# --dump: بعد الكاميرا عن الهدف لكل فريم (لإعادة توقيت التشغيل بـ Remotion بسرعة ناعمة)
if '--dump' in argv:
    import json
    d = []
    for f in range(F0, F1 + 1):
        sc.frame_set(f); d.append(round((cam.matrix_world.translation - tgt.matrix_world.translation).length, 4))
    print('DIST', json.dumps(d)); sys.exit(0)

# رندر
import os
os.makedirs(OUT, exist_ok=True)
frames = [int(arg('--still', '0'))] if STILL else range(F0, F1 + 1)
for f in frames:
    sc.frame_set(f)
    p = os.path.join(OUT, f'{f:04d}.png')
    if os.path.exists(p) and not STILL: continue   # قابل للاستكمال
    sc.render.filepath = p
    bpy.ops.render.render(write_still=True)
    print('frame', f, flush=True)
