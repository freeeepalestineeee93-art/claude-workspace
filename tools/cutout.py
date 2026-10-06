"""قص خلفية صورة (لاعب، منتج، مبنى…) → PNG شفاف جاهز لـ S.sticker.
python tools/cutout.py in.jpg out.png [--model isnet-general-use|u2net_human_seg]"""
import sys
from PIL import Image
from rembg import remove, new_session

src, dst = sys.argv[1], sys.argv[2]
model = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else "isnet-general-use"
img = Image.open(src).convert("RGBA")
out = remove(img, session=new_session(model), alpha_matting=False)
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)
out.save(dst)
print(f"✓ {dst} {out.size[0]}x{out.size[1]}")
