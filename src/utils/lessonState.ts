import { useEffect, useState } from 'react';
import { CURRICULUM, lessonForToday } from '../data/curriculum';
import { FREE_LESSON_LIMIT, isLessonLocked, onFullVersionChange, openPaywall } from './billing';

const KEY = 'alefba_current_lesson_v2';
const EVT = 'alefba-lesson-change';

/** درس دلخواه (بدون در نظر گرفتن قفل) */
function storedLesson(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? Number(raw) : NaN;
    if (n >= 1 && n <= CURRICULUM.length) return n;
  } catch { /* ignore */ }
  return lessonForToday();
}
/** درسی که واقعاً نمایش داده می‌شود: بدون خرید، حداکثر درس رایگان */
export function getCurrentLesson(): number {
  const n = storedLesson();
  return isLessonLocked(n) ? FREE_LESSON_LIMIT : n;
}
/** انتخاب درس؛ اگر درس قفل باشد پنجرهٔ خرید باز می‌شود و false برمی‌گردد */
export function setCurrentLesson(order: number): boolean {
  if (isLessonLocked(order)) { openPaywall(order); return false; }
  try { localStorage.setItem(KEY, String(order)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(EVT, { detail: order }));
  return true;
}
/** درسی که دانش‌آموز الان در آن است؛ همهٔ دهکده‌ها محتوا را تا همین درس نشان می‌دهند */
export function useCurrentLesson(): [number, (n: number) => boolean] {
  const [lesson, setLesson] = useState(getCurrentLesson);
  useEffect(() => {
    const on = () => setLesson(getCurrentLesson());
    window.addEventListener(EVT, on);
    const off = onFullVersionChange(on); // خرید یا لغو خرید
    return () => { window.removeEventListener(EVT, on); off(); };
  }, []);
  return [lesson, setCurrentLesson];
}

export const shuffle = <T,>(arr: T[]): T[] => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const toFa = (n: number | string) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
