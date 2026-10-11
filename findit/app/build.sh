#!/bin/bash
# يبني FindIt.app وينسخه لمجلد Applications.
# بيحتاج Xcode Command Line Tools (إذا مو موجودين: xcode-select --install)
set -e
cd "$(dirname "$0")"

if ! command -v swiftc >/dev/null 2>&1; then
  echo "لازم تثبّت أدوات المطوّر أول: xcode-select --install"
  exit 1
fi

APP="FindIt.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

echo "عم ابني التطبيق..."
swiftc -O -parse-as-library FindItApp.swift -o "$APP/Contents/MacOS/FindIt"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key><string>FindIt</string>
  <key>CFBundleIdentifier</key><string>local.findit</string>
  <key>CFBundleName</key><string>FindIt</string>
  <key>CFBundleDisplayName</key><string>FindIt</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

codesign --force --sign - "$APP" >/dev/null 2>&1 || true

rm -rf "/Applications/$APP"
cp -R "$APP" /Applications/
echo "تم ✅  التطبيق صار بمجلد Applications — افتحه من Launchpad أو اكتب FindIt بـ Spotlight"
open "/Applications/$APP"
