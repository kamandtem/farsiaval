import { useEffect, useState } from 'react';

/**
 * فونت آموزشی = فونتِ حروف، کلمه‌ها و جمله‌های تمرین‌ها (کلاس .tahriri و بوم تمرین نوشتن).
 * فونت خودِ برنامه (تنظیمات، عنوان‌ها، دکمه‌ها) با این گزینه تغییر نمی‌کند.
 *
 * برای افزودن فونت سوم فقط دو کار لازم است: یک @font-face در index.css و یک ردیف در LESSON_FONTS
 * (گزینهٔ تازه خودکار در تنظیمات هم نشان داده می‌شود).
 */
export type EducationalFont = 'tahriri' | 'badkhat' | 'kelasaval';

export interface LessonFontInfo {
  id: EducationalFont;
  /** نام نمایشی در تنظیمات */
  label: string;
  /** نام family برای CSS/canvas؛ تحریری همیشه پشتیبان است چون نویسه‌های کودکانهٔ کتاب (U+E101..) فقط در آن هست */
  family: string;
  /** آیا نویسه‌های اختصاصی کودکانهٔ تحریری (مثل «مـ» و «هـ» کتابی) را دارد؟ */
  hasKidForms: boolean;
  /** ضریب اندازهٔ نوشتهٔ دکمه در تنظیمات تا فونت‌ها هم‌اندازه دیده شوند */
  previewScale: number;
}

export const LESSON_FONTS: readonly LessonFontInfo[] = [
  { id: 'tahriri', label: 'تحریری', family: '"Tahriri"', hasKidForms: true, previewScale: 1.1 },
  { id: 'badkhat', label: 'فونت کتاب درسی', family: '"Badkhat","Tahriri"', hasKidForms: false, previewScale: 1.02 },
  { id: 'kelasaval', label: 'فونت اول دبستان قدیم', family: '"KelasAval","Tahriri"', hasKidForms: false, previewScale: .86 },
];

const DEFAULT_FONT: EducationalFont = 'tahriri';
const FONT_KEY = 'alefba_educational_font_v1';
const FONT_EVENT = 'alefba:educational-font-change';

const isEducationalFont = (value: unknown): value is EducationalFont => LESSON_FONTS.some(f => f.id === value);
const infoOf = (font: EducationalFont) => LESSON_FONTS.find(f => f.id === font) || LESSON_FONTS[0];

/** مقدار ذخیره‌شده را می‌خواند؛ مقدار ناشناخته (مثلاً نسخهٔ قدیمی) به تحریری برمی‌گردد */
export const getEducationalFont = (): EducationalFont => {
  try {
    const saved = localStorage.getItem(FONT_KEY);
    return isEducationalFont(saved) ? saved : DEFAULT_FONT;
  } catch {
    return DEFAULT_FONT;
  }
};

/** نام family آمادهٔ CSS/canvas، مثل '"Badkhat","Tahriri"' */
export const getEducationalFontFamily = () => infoOf(getEducationalFont()).family;

/** فقط تحریری شکل‌های کودکانهٔ کتاب (PUA) را دارد؛ برای فونت‌های دیگر باید شکل معمولیِ حرف نمایش داده شود */
export const educationalFontHasKidForms = () => infoOf(getEducationalFont()).hasKidForms;

const applyToDocument = (font: EducationalFont) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.educationalFont = font;
  document.documentElement.style.setProperty('--lesson-font', infoOf(font).family);
};

/** یک بار هنگام شروع برنامه (قبل از render) صدا زده شود */
export const initEducationalFont = () => applyToDocument(getEducationalFont());

export const setEducationalFont = (font: EducationalFont) => {
  if (!isEducationalFont(font)) return;
  try { localStorage.setItem(FONT_KEY, font); } catch { /* ignore */ }
  applyToDocument(font);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(FONT_EVENT, { detail: font }));
};

export const subscribeEducationalFont = (listener: (font: EducationalFont) => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const onChange = (event: Event) => {
    const font = (event as CustomEvent<EducationalFont>).detail;
    if (isEducationalFont(font)) listener(font);
  };
  window.addEventListener(FONT_EVENT, onChange);
  return () => window.removeEventListener(FONT_EVENT, onChange);
};

/** هر کامپوننتی که این را صدا بزند با تغییر فونت دوباره رسم می‌شود */
export const useEducationalFont = (): EducationalFont => {
  const [font, setFont] = useState<EducationalFont>(getEducationalFont);
  useEffect(() => subscribeEducationalFont(setFont), []);
  return font;
};
