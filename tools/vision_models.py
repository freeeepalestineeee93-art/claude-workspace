"""تنزيل وتحميل نماذج الرؤية (مرة وحدة، بـ .cache/models):

  sam2      SAM 2.1 tiny: قص وتتبّع أي عنصر عبر الفيديو (فصل الطبقات)
  depth     Depth Anything V2 small: عمق نسبي لكل فريم (parallax حقيقي ولا طبقات؟)
  raft      RAFT small (torchvision): تدفق بصري كثيف دقيق (حركة كاميرا، motion blur)
  demucs    htdemucs: فصل صوت (كلام / موسيقى / مؤثرات)
  clip      OpenCLIP ViT-B/32: embeddings للبحث بالمكتبة
  transnet  TransNetV2: كشف قطعات وانتقالات تدريجية

python tools/vision_models.py [all|sam2|depth|raft|demucs|clip|transnet]
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "models"
CACHE.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("HF_HOME", str(CACHE / "hf"))
os.environ.setdefault("TORCH_HOME", str(CACHE / "torch"))
for ca in ("/root/.ccr/ca-bundle.crt",):
    if os.path.exists(ca):
        os.environ.setdefault("REQUESTS_CA_BUNDLE", ca)
        os.environ.setdefault("SSL_CERT_FILE", ca)

SAM2_URL = "https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_tiny.pt"


def sam2():
    """بيرجع predictor للفيديو (SAM 2.1 tiny)."""
    import urllib.request
    ck = CACHE / "sam2.1_hiera_tiny.pt"
    if not ck.exists():
        urllib.request.urlretrieve(SAM2_URL, ck)
    from sam2.build_sam import build_sam2_video_predictor
    return build_sam2_video_predictor("configs/sam2.1/sam2.1_hiera_t.yaml", str(ck), device="cpu")


def depth():
    from transformers import pipeline
    return pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")


def raft():
    from torchvision.models.optical_flow import raft_small, Raft_Small_Weights
    m = raft_small(weights=Raft_Small_Weights.DEFAULT).eval()
    return m, Raft_Small_Weights.DEFAULT.transforms()


def demucs():
    from demucs.pretrained import get_model
    return get_model("htdemucs")


def clip():
    import open_clip
    model, _, pre = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k", cache_dir=str(CACHE / "clip"))
    return model.eval(), pre, open_clip.get_tokenizer("ViT-B-32")


def transnet():
    from transnetv2_pytorch import TransNetV2
    return TransNetV2()


ALL = {"sam2": sam2, "depth": depth, "raft": raft, "demucs": demucs, "clip": clip, "transnet": transnet}

if __name__ == "__main__":
    names = sys.argv[1:] or ["all"]
    for n in (ALL if names == ["all"] else names):
        try:
            ALL[n]()
            print(f"✓ {n}")
        except Exception as e:  # نموذج واحد فاشل ما بيوقف الباقي
            print(f"✗ {n}: {type(e).__name__}: {str(e)[:200]}")
