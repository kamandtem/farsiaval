// بعد از «npx cap add/sync android» اجرا شود.
// Poolakey (SDK پرداخت کافه‌بازار) فقط روی JitPack منتشر شده؛ پوشهٔ android هر بار ساخته می‌شود،
// پس مخزن JitPack را اینجا به build.gradle ریشه اضافه می‌کنیم (تکرار اجرا مشکلی ندارد).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const file = 'android/build.gradle';
if (!existsSync(file)) { console.error(`[patch-android] ${file} پیدا نشد؛ اول npx cap add android`); process.exit(1); }
let src = readFileSync(file, 'utf8');
if (src.includes('jitpack.io')) { console.log('[patch-android] JitPack از قبل هست'); process.exit(0); }
src += `\n// Added by scripts/patch-android.mjs (Cafe Bazaar Poolakey)\nallprojects {\n    repositories {\n        maven { url 'https://jitpack.io' }\n    }\n}\n`;
writeFileSync(file, src);
console.log('[patch-android] JitPack اضافه شد');
