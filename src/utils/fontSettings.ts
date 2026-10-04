export type EducationalFont = 'tahriri' | 'vazirmatn';

const FONT_KEY = 'alefba_educational_font_v1';
const FONT_EVENT = 'alefba:educational-font-change';

const isEducationalFont = (value: unknown): value is EducationalFont => value === 'tahriri' || value === 'vazirmatn';

export const getEducationalFont = (): EducationalFont => {
  try {
    const saved = localStorage.getItem(FONT_KEY);
    return isEducationalFont(saved) ? saved : 'tahriri';
  } catch {
    return 'tahriri';
  }
};

export const isVazirmatnSelected = () => getEducationalFont() === 'vazirmatn';

export const getEducationalFontFamily = () => isVazirmatnSelected() ? '"Vazirmatn"' : '"Tahriri"';

export const setEducationalFont = (font: EducationalFont) => {
  try { localStorage.setItem(FONT_KEY, font); } catch { /* ignore */ }
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.educationalFont = font;
    document.documentElement.style.setProperty('--lesson-font-family', font === 'vazirmatn' ? '"Vazirmatn"' : '"Tahriri"');
  }
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
