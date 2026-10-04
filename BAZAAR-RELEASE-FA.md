# انتشار «دهکده الفبا» در کافه‌بازار

شناسهٔ بسته (package name): `ir.alfba.magicboard` ← **بعد از اولین انتشار هرگز عوضش نکن.**

## روش ۱: ساخت روی کامپیوتر خودت (ویندوز)

پیش‌نیازها: Node.js 22، JDK 21، Android Studio (برای Android SDK).

1. پوشهٔ `release-secrets` را (از فایل جداگانهٔ رمزها) کنار `package.json` بگذار. داخلش باید `alfba-release.jks` و `keystore.properties` باشد.
2. در CMD داخل پوشهٔ پروژه:
   ```
   npm install
   npm run release:android:win
   ```
3. فایل نهایی: `release\alfba-island-1.0.0.apk`

## روش ۲: GitHub Actions

چهار Secret را در `Settings ← Secrets and variables ← Actions` ثبت کن (مقادیرشان در فایل رمزهاست):
`ANDROID_KEYSTORE_BASE64`، `ANDROID_KEYSTORE_PASSWORD`، `ANDROID_KEY_ALIAS`، `ANDROID_KEY_PASSWORD`.
بعد یک tag مثل `v1.0.0` بساز و push کن؛ APK از بخش Artifacts دانلود می‌شود.

## بارگذاری در پنل توسعه‌دهندگان بازار

1. در pishkhan.cafebazaar.ir ثبت‌نام و احراز هویت کن.
2. «برنامهٔ جدید» ← بارگذاری APK.
3. اطلاعات لازم: نام، توضیح کوتاه و کامل، دسته (آموزشی / کودک)، رده‌بندی سنی، آیکن ۵۱۲×۵۱۲، حداقل ۳ اسکرین‌شات، و **لینک سیاست حریم خصوصی** (متن آماده در `PRIVACY-POLICY-FA.md`؛ باید جایی آنلاین منتشرش کنی).

## هر نسخهٔ بعدی

- در `release-secrets/keystore.properties` مقدار `RELEASE_VERSION_CODE` را **یکی بیشتر** کن (۱ ← ۲ ← ۳…) و `RELEASE_VERSION_NAME` را مثلاً `1.0.1` کن. بازار APK با کد نسخهٔ تکراری یا کمتر را قبول نمی‌کند.
- همیشه با **همان کلید** امضا کن. اگر کلید گم شود، دیگر نمی‌توانی برنامه را در بازار به‌روزرسانی کنی.
