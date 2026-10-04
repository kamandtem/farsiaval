import React, { useEffect, useRef, useState } from 'react';
import { WordPic } from './WordPic';

export type FeedbackState = { tone: 'good' | 'try' | 'info'; text: string; emoji?: string } | null;

const PRAISE = ['آفرین!', 'عالی بود!', 'صد آفرین!', 'باریکلا!', 'تو فوق‌العاده‌ای!'];
const CHEER = ['اشکالی ندارد، دوباره امتحان کن.', 'نزدیک بودی! یک بار دیگر.', 'تو می‌توانی، دوباره تلاش کن.', 'کمی بیشتر دقت کن، موفق می‌شوی.'];
export const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
export const cheer = () => CHEER[Math.floor(Math.random() * CHEER.length)];

const DEFAULT_MS = { good: 1500, try: 1900, info: 1900 } as const;

/** پیام تشویق/خطا: حباب کودکانه که سریع می‌آید و سریع می‌رود */
export const FeedbackToast: React.FC<{ state: FeedbackState; onClose: () => void; ms?: number }> = ({ state, onClose, ms }) => {
  const [leaving, setLeaving] = useState(false);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    if (!state) return;
    setLeaving(false);
    const life = Math.min(ms ?? DEFAULT_MS[state.tone], DEFAULT_MS[state.tone] + 400);
    const a = window.setTimeout(() => setLeaving(true), life - 220);
    const b = window.setTimeout(() => closeRef.current(), life);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [state, ms]); // eslint-disable-line
  if (!state) return null;
  const emoji = state.emoji || (state.tone === 'good' ? '🌟' : state.tone === 'try' ? '🙈' : '💡');
  return <div className="kid-toast-layer" aria-live="polite">
    <div className={`kid-toast ${state.tone} ${leaving ? 'leaving' : ''}`} role="status" onClick={onClose}>
      {state.tone === 'good' && <span className="kid-toast-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>}
      <span className="kid-toast-emoji"><WordPic value={emoji} /></span>
      <p>{state.text}</p>
    </div>
  </div>;
};
