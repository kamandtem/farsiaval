import React from 'react';

/** دکمهٔ بستن/رد کودکانه (قرمز با ضربدر) — جایگزین همهٔ ضربدرهای برنامه */
export const CloseArt: React.FC<{ onClick: () => void; className?: string; label?: string; src?: string }> = ({ onClick, className = '', label = 'بستن', src = '/assets/ui/btn-close.svg' }) =>
  <button type="button" className={`art-btn art-close ${className}`} onClick={onClick} aria-label={label}>
    <img src={src} alt="" draggable={false} />
  </button>;

/** دکمهٔ تایید کودکانه (سبز با تیک) — جایگزین همهٔ دکمه‌های تایید برنامه */
export const OkArt: React.FC<{ onClick: () => void; className?: string; label?: string; caption?: string; ready?: boolean }> = ({ onClick, className = '', label = 'تایید', caption, ready }) =>
  <button type="button" className={`art-btn art-ok ${ready ? 'ready' : ''} ${className}`} onClick={onClick} aria-label={label}>
    <img src="/assets/ui/btn-ok.svg" alt="" draggable={false} />
    {caption && <span>{caption}</span>}
  </button>;
