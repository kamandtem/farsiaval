import React from 'react';
import { Home } from 'lucide-react';
import { sound } from '../../utils/audio';

/** هدر کودکانهٔ همهٔ بازی‌ها: دکمهٔ برگشت، عنوان، و دکمه‌های کناری */
export const GameHeader: React.FC<{
  kicker?: string;
  title: string;
  emoji?: string;
  tone?: 'sun' | 'mint' | 'sky' | 'berry';
  onBack: () => void;
  onHome?: () => void;
  /** اگر داده شود، عنوان وسط هدر دکمه می‌شود (مثلاً برای باز کردن جزیرهٔ امتیاز) */
  onTitleClick?: () => void;
  titleRef?: React.Ref<HTMLButtonElement>;
  children?: React.ReactNode;
}> = ({ kicker, title, emoji, tone = 'sun', onBack, onHome, onTitleClick, titleRef, children }) => {
  const inner = <>
        {emoji && <span className="kid-header-emoji" aria-hidden="true">{emoji}</span>}
        <div>
          {kicker && <small>{kicker}</small>}
          <strong>{title}</strong>
        </div>
  </>;
  return (
  <header className={`kid-header tone-${tone}`}>
    <div className="kid-header-row">
      <button className="kid-back-btn" onClick={() => { sound.playPop(); onBack(); }} aria-label="بازگشت">
        <img className="kid-back-art" src="/assets/ui/btn-back.svg" alt="" draggable={false} />
      </button>
      {onTitleClick
        ? <button ref={titleRef} type="button" className="kid-header-title as-button" onClick={onTitleClick} aria-label={`${title}، دیدن امتیاز این دفعه`}>{inner}</button>
        : <div className="kid-header-title">{inner}</div>}
      <div className="kid-header-side">
        {children}
        {onHome && <button className="kid-round-btn home" onClick={() => { sound.playPop(); onHome(); }} aria-label="صفحهٔ شروع"><Home strokeWidth={2.8} /></button>}
      </div>
    </div>
    <svg className="kid-header-wave" viewBox="0 0 400 18" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0h400v6c-25 0-25 12-50 12S325 6 300 6s-25 12-50 12S225 6 200 6s-25 12-50 12S125 6 100 6 75 18 50 18 25 6 0 6z" /></svg>
  </header>
);
};
