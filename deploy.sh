#!/bin/bash

# Deploy script for ZeroGame

if [ -z "$1" ]; then
  echo "❌ Vui lòng cung cấp GitHub Token"
  echo "Usage: ./deploy.sh YOUR_GITHUB_TOKEN"
  echo ""
  echo "Để lấy token:"
  echo "1. Vào https://github.com/settings/tokens"
  echo "2. Click 'Generate new token (classic)'"
  echo "3. Chọn scope: repo"
  echo "4. Copy token và chạy script"
  exit 1
fi

TOKEN=$1
REPO_NAME="zerogame"

echo "🚀 Bắt đầu deploy ZeroGame..."

# Tạo repo nếu chưa có
echo "📦 Tạo repo $REPO_NAME..."
curl -s -H "Authorization: token $TOKEN" \
  -d '{"name":"'$REPO_NAME'","private":false}' \
  https://api.github.com/user/repos > /dev/null

# Cấu hình git remote
REMOTE_URL="https://$TOKEN@github.com/dodoanloc/$REPO_NAME.git"
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"

# Push code
echo "📤 Pushing code..."
git add -A
git commit -m "Deploy ZeroGame - $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || true
git branch -M main
git push -u origin main --force

echo ""
echo "✅ Code đã push lên: https://github.com/dodoanloc/$REPO_NAME"
echo ""
echo "🌐 Để enable GitHub Pages:"
echo "1. Vào: https://github.com/dodoanloc/$REPO_NAME/settings/pages"
echo "2. Source: Deploy from a branch"
echo "3. Branch: main / (root)"
echo "4. Click Save"
echo ""
echo "🔗 Sau khi enable, truy cập: https://dodoanloc.github.io/$REPO_NAME"