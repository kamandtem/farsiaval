import React, { useLayoutEffect, useRef } from 'react';
import { kidDisplay } from '../../data/curriculum';
import { useEducationalFont } from '../../utils/fontSettings';

/**
 * نمایش چند شکل یک نشانه (مثل «هـ ـهـ ـه ه») کنار هم با ترتیب درست راست‌به‌چپ.
 * شکل‌های کتابیِ «ه» نویسه‌های اختصاصی فونت‌اند و مرورگر آن‌ها را چپ‌به‌راست می‌چیند؛
 * اگر همه در یک متن باشند ترتیبشان به‌هم می‌ریزد. این‌جا هر شکل جداگانه و ایزوله چیده می‌شود.
 *
 * fit: انتخابگر CSS نزدیک‌ترین والدی که نوشته باید توی عرض آن جا شود (مثلاً '.lesson-tile').
 * با fit، چهار شکلِ یک حرف (ع، غ، ه ...) دو ردیفِ دوتایی می‌شوند و اگر با فونتِ پهن (مثل «اول دبستان قدیم»)
 * باز هم از کادر بزنند، اندازهٔ نوشته خودکار کوچک می‌شود تا هیچ شکلی بیرون نزند.
 */
export const SignText: React.FC<{ text: string | string[]; className?: string; fit?: string }> = ({ text, className = '', fit }) => {
  const parts = Array.isArray(text) ? text : text.split(/\s+/).filter(Boolean);
  const ref = useRef<HTMLSpanElement>(null);
  const font = useEducationalFont(); // با عوض‌شدن فونت دوباره اندازه‌گیری شود
  const key = parts.join('|');
  const grid = !!fit && parts.length >= 3;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!fit || !el) return;
    const box = el.closest(fit) as HTMLElement | null;
    if (!box) return;
    let lastWidth = -1;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      el.style.fontSize = '';
      const cs = getComputedStyle(box);
      const avail = box.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0') - 6;
      if (avail <= 0) return;
      const items = Array.from(el.children) as HTMLElement[];
      if (!items.length) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const widths = items.map(i => i.offsetWidth);
      const need = grid
        ? Math.max(...widths) * 2 + gap
        : widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
      if (need > avail) el.style.fontSize = `${Math.max(0.4, avail / need).toFixed(3)}em`;
    };
    run();
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => { if (box.clientWidth !== lastWidth) { lastWidth = box.clientWidth; run(); } })
      : null;
    ro?.observe(box);
    // فونت‌ها ممکن است دیرتر بارگذاری شوند؛ بعدش دوباره اندازه بگیر
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(run).catch(() => undefined);
    fonts?.addEventListener?.('loadingdone', run);
    return () => { cancelled = true; ro?.disconnect(); fonts?.removeEventListener?.('loadingdone', run); };
  }, [fit, grid, key, font]);

  return <span ref={ref} className={`lesson-form-run ${grid ? 'grid2' : ''} ${className}`}>{parts.map((p, i) => <span key={`${p}-${i}`}>{kidDisplay(p)}</span>)}</span>;
};
