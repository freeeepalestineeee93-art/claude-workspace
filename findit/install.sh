#!/bin/bash
# تثبيت findit بحيث تقدر تشغّله من أي مكان بالتيرمنال.
set -e
SRC="$(cd "$(dirname "$0")" && pwd)/findit"
DEST="/usr/local/bin/findit"

chmod +x "$SRC"
if [ -w "$(dirname "$DEST")" ]; then
  cp "$SRC" "$DEST"
else
  echo "بدنا صلاحية مدير لننسخ الأداة لـ $DEST"
  sudo mkdir -p "$(dirname "$DEST")"
  sudo cp "$SRC" "$DEST"
fi
echo "تم ✅  جرّب:  findit اسم-الملف"
