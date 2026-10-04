#!/usr/bin/env bash
# ساخت APK امضاشدهٔ انتشار برای کافه‌بازار (لینوکس / مک)
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"; SECRETS="$ROOT/release-secrets"
[ -f "$SECRETS/keystore.properties" ] || { echo "release-secrets/keystore.properties پیدا نشد"; exit 1; }
set -a; # shellcheck disable=SC1091
. <(grep -v '^#' "$SECRETS/keystore.properties" | tr -d '\r'); set +a
export RELEASE_STORE_FILE="$SECRETS/$RELEASE_STORE_FILE"
[ -f "$RELEASE_STORE_FILE" ] || { echo "فایل کلید پیدا نشد: $RELEASE_STORE_FILE"; exit 1; }
[ -d node_modules ] || npm install --no-audit --no-fund
npm run lint && npm run build
[ -d android ] || npx cap add android
npm run assets:generate && npx cap sync android
(cd android && ./gradlew -I "$ROOT/scripts/release.gradle" assembleRelease)
mkdir -p release
OUT="release/alfba-island-${RELEASE_VERSION_NAME}.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$OUT"
echo "تمام: $OUT  (نسخهٔ بعدی: RELEASE_VERSION_CODE را یکی بیشتر کن)"
