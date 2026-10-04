import { useEffect, useState } from 'react';
import { CURRICULUM, lessonForToday } from '../data/curriculum';

const KEY = 'alefba_current_lesson_v2';
const EVT = 'alefba-lesson-change';

export function getCurrentLesson(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? Number(raw) : NaN;
    if (n >= 1 && n <= CURRICULUM.length) return n;
  } catch { /* ignore */ }
  return lessonForToday();
}
export function setCurrentLesson(order: number) {
  try { localStorage.setItem(KEY, String(order)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(EVT, { detail: order }));
}
/** درسی که دانش‌آموز الان در آن است؛ همهٔ دهکده‌ها محتوا را تا همین درس نشان می‌دهند */
export function useCurrentLesson(): [number, (n: number) => void] {
  const [lesson, setLesson] = useState(getCurrentLesson);
  useEffect(() => {
    const on = (e: Event) => setLesson((e as CustomEvent).detail);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return [lesson, setCurrentLesson];
}

export const shuffle = <T,>(arr: T[]): T[] => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const toFa = (n: number | string) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
