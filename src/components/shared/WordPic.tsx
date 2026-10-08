import React, { useEffect, useState } from 'react';
import { hasRealEmoji } from '../../data/wordBank';
import { wordImage } from '../../data/wordImages';

/**
 * تصویر یک واژه:
 * ۱) اگر برای واژه تصویر اختصاصی داریم، همان (اگر بار نشد خودکار ← ایموجی)
 * ۲) ایموجی واقعی
 * ۳) نماد واحد «صفحهٔ خالی» برای واژه‌هایی که تصویر ندارند
 */
export const WordPic: React.FC<{ value?: string; word?: string; className?: string }> = ({ value, word, className = '' }) => {
  const src = wordImage(word);
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [src]);
  if (src && !broken) return <img className={`word-art-img ${className}`} src={src} alt="" draggable={false} onError={() => setBroken(true)} />;
  return hasRealEmoji(value)
    ? <span className={className} aria-hidden="true">{value}</span>
    : <img className={`word-placeholder-icon ${className}`} src="/assets/word-placeholder.svg" alt="" draggable={false} />;
};
