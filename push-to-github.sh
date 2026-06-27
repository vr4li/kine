#!/bin/bash
# رفع مشروع KineAI إلى GitHub — repo: kine
set -e
cd "$(dirname "$0")"

GH="${GH:-/tmp/gh-install/gh_2.63.2_macOS_arm64/bin/gh}"
if [ ! -x "$GH" ]; then
  echo "Installing GitHub CLI..."
  TMP=/tmp/gh-install
  mkdir -p "$TMP"
  curl -sL "https://github.com/cli/cli/releases/download/v2.63.2/gh_2.63.2_macOS_arm64.zip" -o "$TMP/gh.zip"
  unzip -qo "$TMP/gh.zip" -d "$TMP"
  GH="$TMP/gh_2.63.2_macOS_arm64/bin/gh"
fi

if ! "$GH" auth status &>/dev/null; then
  echo ""
  echo "=== سجّل دخول GitHub (مرة واحدة) ==="
  "$GH" auth login --hostname github.com --git-protocol https --web
fi

USER=$("$GH" api user -q .login)
echo "GitHub user: $USER"

if "$GH" repo view "$USER/kine" &>/dev/null; then
  echo "Repo exists: https://github.com/$USER/kine"
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$USER/kine.git"
else
  "$GH" repo create kine --public --source=. --remote=origin --description "KineAI — تعافي الذكي | إعادة التأهيل بالذكاء الاصطناعي"
fi

git push -u origin main
echo ""
echo "Done: https://github.com/$USER/kine"
