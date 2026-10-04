import React from 'react';
import { kidDisplay } from '../../data/curriculum';

/**
 * نمایش چند شکل یک نشانه (مثل «هـ ـهـ ـه ه») کنار هم با ترتیب درست راست‌به‌چپ.
 * شکل‌های کتابیِ «ه» نویسه‌های اختصاصی فونت‌اند و مرورگر آن‌ها را چپ‌به‌راست می‌چیند؛
 * اگر همه در یک متن باشند ترتیبشان به‌هم می‌ریزد. این‌جا هر شکل جداگانه و ایزوله چیده می‌شود.
 */
export const SignText: React.FC<{ text: string | string[]; className?: string }> = ({ text, className = '' }) => {
  const parts = Array.isArray(text) ? text : text.split(/\s+/).filter(Boolean);
  return <span className={`lesson-form-run ${className}`}>{parts.map((p, i) => <span key={`${p}-${i}`}>{kidDisplay(p)}</span>)}</span>;
};
