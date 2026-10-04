import React, { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { sound } from '../../utils/audio';

/**
 * پیام پایان یک دور بازی: وقتی کودک همهٔ کارت‌ها/کلمه‌ها/دورهای یک بازی را تمام کرد،
 * به جای برگشتنِ بی‌خبر به مورد اول، این پیام تبریک نشان داده می‌شود.
 * بازی فقط با زدن «یک دور دیگر» دوباره از اول شروع می‌شود.
 */
export const RoundComplete: React.FC<{
  open: boolean;
  text?: string;
  onAgain: () => void;
  againLabel?: string;
}> = ({ open, text, onAgain, againLabel = 'یک دور دیگر' }) => {
  useEffect(() => {
    if (!open) return;
    sound.playSuccess();
    sound.speakPersian('آفرین! موفق شدی');
  }, [open]);
  if (!open) return null;
  return <div className="round-done-backdrop" role="dialog" aria-modal="true" aria-label="موفق شدی">
    <section className="round-done-card">
      <span className="round-done-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></span>
      <span className="round-done-trophy" aria-hidden="true">🏆</span>
      <h2>آفرین! موفق شدی!</h2>
      {text && <p>{text}</p>}
      <div className="round-done-stars" aria-hidden="true">⭐⭐⭐</div>
      <button type="button" className="round-done-again" onClick={() => { sound.playPop(); onAgain(); }}><RotateCcw /> {againLabel}</button>
    </section>
  </div>;
};
