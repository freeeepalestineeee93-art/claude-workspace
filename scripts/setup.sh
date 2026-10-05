#!/usr/bin/env bash
# تجهيز استوديو الموشن: بيثبّت كل الأدوات من الصفر بأي جهاز أو جلسة سحابية.
# آمن للتشغيل أكتر من مرة (بيتخطى اللي متثبّت).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$PWD

echo "▸ حزم Node"
[ -d node_modules ] && [ node_modules -nt package-lock.json ] || npm ci --no-audit --no-fund

echo "▸ بيئة Python الرئيسية (صورة، فيديو، صوت، عربي)"
[ -x .venv/bin/python ] || python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt

echo "▸ Blender بدون واجهة (bpy) ببيئة منفصلة"
[ -x .venv-blender/bin/python ] || python3 -m venv .venv-blender
.venv-blender/bin/python -c "import bpy" 2>/dev/null || .venv-blender/bin/pip install -q bpy

echo "▸ نماذج AI المحلية (إزالة خلفية + تفريغ صوت)"
.venv/bin/python - <<'PY'
from rembg import new_session; new_session('u2net'); new_session('isnet-general-use')
from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')
PY

echo "▸ تسجيل الخطوط بالنظام (لـ Chromium وffmpeg)"
mkdir -p "$HOME/.local/share/fonts"
ln -sfn "$ROOT/assets/fonts" "$HOME/.local/share/fonts/motion-studio"
fc-cache -f >/dev/null

echo "✓ الاستوديو جاهز"
