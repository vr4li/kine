#!/bin/bash
# استبدال index.html بتصميمك من التحميلات (نسخ لصق)
set -e
cd "$(dirname "$0")"
SRC=$(ls "$HOME/Downloads/"*"دأب"*.html 2>/dev/null | head -1)
if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "لم أجد ملف التصميم في Downloads (اسم يحتوي: دأب ... .html)"
  exit 1
fi
cp "$SRC" index.html
mkdir -p public
cp index.html public/index.html
echo "✓ تم — index.html + public/index.html = نسخة من تصميمك ($(wc -c < index.html | tr -d ' ') بايت)"
