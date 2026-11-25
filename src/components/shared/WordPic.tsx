import React, { useEffect, useState } from 'react';
import { hasRealEmoji } from '../../data/wordBank';
import { resolveWordVisual } from '../../data/wordImages';

/**
 * تصویر یک واژه:
 * ۱) تصویر سه‌بعدی Fluent (یا تصویر اختصاصی انار/انجیر/...) ؛ اگر بار نشد خودکار ← ایموجی
 * ۲) ایموجی واقعی
 * ۳) نماد واحد «صفحهٔ خالی» برای واژه‌هایی که تصویر ندارند
 */
export const WordPic: React.FC<{ value?: string; word?: string; className?: string }> = ({ value, word, className = '' }) => {
  const visual = resolveWordVisual(word, value);
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [visual?.src]);

  if (visual && !broken) {
    const cls = visual.kind === 'emoji3d' ? `fluent-emoji-img ${className}` : `word-art-img ${className}`;
    return <img className={cls} src={visual.src} alt="" draggable={false} onError={() => setBroken(true)} />;
  }
  return hasRealEmoji(value)
    ? <span className={className} aria-hidden="true">{value}</span>
    : <img className={`word-placeholder-icon ${className}`} src="/assets/word-placeholder.svg" alt="" draggable={false} />;
};
