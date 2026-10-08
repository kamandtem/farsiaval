/**
 * صدای ضبط‌شدهٔ نشانه‌ها (آفلاین، داخل برنامه: public/assets/audio/letters/lNN.mp3)
 * NN = شمارهٔ درس در curriculum.ts
 * - درس ۲۶ «ـو (اُ)» عمداً همان صدای «اُ» (درس ۱۶) را دارد.
 * - درس ۳۰ «خوا» و ۳۱ «تشدید» فعلاً صدا ندارند: بی‌صدا (نه صدای ماشینی).
 * - «و» (درس ۱۸) صدای «و» مثل داور/یاور است؛ «او» (درس ۷) جداست.
 * - «ایـ یـ ی ای» (درس ۱۱، مثل ایران) با «یـ ی» (درس ۱۵، مثل یخ) فرق دارد.
 */
const SILENT = new Set([30, 31]);
const MAX_ORDER = 40;

/** مسیر فایل صدای یک درس، یا null اگر صدا ندارد */
export const letterClip = (order: number): string | null => {
  if (!Number.isInteger(order) || order < 1 || order > MAX_ORDER || SILENT.has(order)) return null;
  return `/assets/audio/letters/l${String(order).padStart(2, '0')}.mp3`;
};
/** درس‌هایی که عمداً بی‌صدا هستند */
export const isSilentLesson = (order: number) => SILENT.has(order);

/** شناسهٔ حروف در persianAlphabet.ts ← شمارهٔ درس (برای تخته حروف و تمرین نوشتن) */
const BY_LETTER_ID: Record<string, number> = {
  alef: 1, be: 2, pe: 19, te: 8, se_3: 35, jim: 25, che: 28, he_jimi: 36, khe: 22,
  dal: 4, zal: 33, re: 9, ze: 12, zhe: 29, sin: 6, shin: 14, sad: 32, zad: 37,
  ta: 38, za: 40, eyn: 34, gheyn: 39, fe: 21, ghaf: 23, kaf: 17, gaf: 20, lam: 24,
  mim: 5, noon: 10, vav: 18, he: 27, ye: 15,
  // اعراب
  fathe: 3, kasre: 13, zamme: 16, tashdid: 31,
};
/** شمارهٔ درسِ یک حرف/اعراب با شناسه؛ undefined یعنی صدای ضبط‌شده ندارد (مثل سکون) */
export const lessonOfLetterId = (id: string | undefined) => (id ? BY_LETTER_ID[id] : undefined);

/** یک نویسهٔ تنها (حرف یا اعراب) ← شمارهٔ درس؛ و/ی/ه به شکل صامت (مثل داور، یخ، هوا) */
const BY_CHAR: Record<string, number> = {
  'آ': 1, 'ا': 1, 'ب': 2, 'پ': 19, 'ت': 8, 'ث': 35, 'ج': 25, 'چ': 28, 'ح': 36, 'خ': 22,
  'د': 4, 'ذ': 33, 'ر': 9, 'ز': 12, 'ژ': 29, 'س': 6, 'ش': 14, 'ص': 32, 'ض': 37,
  'ط': 38, 'ظ': 40, 'ع': 34, 'غ': 39, 'ف': 21, 'ق': 23, 'ک': 17, 'ك': 17, 'گ': 20,
  'ل': 24, 'م': 5, 'ن': 10, 'و': 18, 'ه': 27, 'ی': 15, 'ي': 15,
  '\u064E': 3, '\u0650': 13, '\u064F': 16, '\u0651': 31,
};
/** متنِ یک حرف تنها (با کشیده/اعراب احتمالی) ← شمارهٔ درس؛ اگر بیش از یک حرف بود undefined */
export const lessonOfGlyph = (text: string): number | undefined => {
  const t = (text || '').replace(/[\u0640\u200C\u200D\s]/g, '');
  if (!t) return undefined;
  const letters = [...t].filter(c => !/[\u064B-\u0652]/.test(c));
  if (letters.length > 1) return undefined;
  if (letters.length === 0) return BY_CHAR[[...t][0]]; // فقط اعراب
  // «اَ / اِ / اُ»: الف با اعراب = صدای همان اعراب
  const mark = [...t].find(c => /[\u064E\u064F\u0650]/.test(c));
  if (letters[0] === 'ا' && mark) return BY_CHAR[mark];
  return BY_CHAR[letters[0]];
};
