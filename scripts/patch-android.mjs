// بعد از «npx cap add/sync android» اجرا شود. دو کار می‌کند:
// ۱) مخزن JitPack را برای Poolakey (SDK پرداخت کافه‌بازار) به android/build.gradle اضافه می‌کند.
// ۲) versionCode و versionName را داخل android/app/build.gradle با مقدار version.properties جایگزین می‌کند.
//    (قالب کاپازیتور خودش versionCode 1 را داخل defaultConfig می‌نویسد و همین باعث می‌شد
//     بازار همیشه «شمارهٔ نسخهٔ تکراری» بگوید.)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// ---------- ۱) JitPack ----------
const root = 'android/build.gradle';
if (!existsSync(root)) { console.error(`[patch-android] ${root} پیدا نشد؛ اول npx cap add android`); process.exit(1); }
let src = readFileSync(root, 'utf8');
if (src.includes('jitpack.io')) {
  console.log('[patch-android] JitPack از قبل هست');
} else {
  src += `\n// Added by scripts/patch-android.mjs (Cafe Bazaar Poolakey)\nallprojects {\n    repositories {\n        maven { url 'https://jitpack.io' }\n    }\n}\n`;
  writeFileSync(root, src);
  console.log('[patch-android] JitPack اضافه شد');
}

// ---------- ۲) نسخه ----------
const props = {};
if (existsSync('version.properties')) {
  for (const line of readFileSync('version.properties', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) props[m[1]] = m[2];
  }
}
const versionName = (process.env.RELEASE_VERSION_NAME || props.VERSION_NAME || '').trim();
const versionCode = (process.env.RELEASE_VERSION_CODE || props.VERSION_CODE || '').trim();
if (!versionName || !/^\d+$/.test(versionCode)) {
  console.error('[patch-android] VERSION_NAME / VERSION_CODE در version.properties معتبر نیست'); process.exit(1);
}
const appFile = 'android/app/build.gradle';
if (!existsSync(appFile)) { console.error(`[patch-android] ${appFile} پیدا نشد`); process.exit(1); }
let app = readFileSync(appFile, 'utf8');
const codeRe = /versionCode\s*=?\s*\d+/;
const nameRe = /versionName\s*=?\s*["'][^"']*["']/;
if (!codeRe.test(app) || !nameRe.test(app)) {
  console.error('[patch-android] versionCode/versionName در android/app/build.gradle پیدا نشد'); process.exit(1);
}
app = app.replace(codeRe, `versionCode ${versionCode}`).replace(nameRe, `versionName "${versionName}"`);
writeFileSync(appFile, app);
console.log(`[patch-android] نسخه تنظیم شد: versionName=${versionName} versionCode=${versionCode}`);
