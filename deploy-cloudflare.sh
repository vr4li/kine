#!/bin/bash
# رفع KineAI على Cloudflare Pages
set -e
cd "$(dirname "$0")"

NODE_DIR="/tmp/node-portable/node-v20.18.0-darwin-arm64/bin"
if [ ! -x "$NODE_DIR/npx" ]; then
  echo "جاري تحميل Node..."
  ARCH=arm64
  NODE_VER=v20.18.0
  TMP=/tmp/node-portable
  mkdir -p "$TMP"
  curl -fsL "https://nodejs.org/dist/${NODE_VER}/node-${NODE_VER}-darwin-${ARCH}.tar.gz" -o "$TMP/node.tgz"
  tar -xzf "$TMP/node.tgz" -C "$TMP"
fi
export PATH="/tmp/node-portable/node-v20.18.0-darwin-arm64/bin:$PATH"

echo ""
echo "=== Cloudflare Pages — KineAI ==="
npx wrangler@3 whoami 2>/dev/null || {
  echo "سجّل دخول Cloudflare من المتصفح..."
  npx wrangler@3 login
}

echo ""
echo "جاري الرفع..."
npx wrangler@3 pages deploy . --project-name=kine --commit-dirty=true

echo ""
echo "Done! رابطك: https://kine.pages.dev (أو الاسم اللي اخترتيه)"
