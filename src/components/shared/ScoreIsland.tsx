import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toFa } from '../../utils/lessonState';

const UI = '/assets/ui/score';

/** نوار امتیاز: سکه + عدد فارسی + دکمهٔ سبز (رفتن به «پیشرفت من») */
export const ScoreBar: React.FC<{ total: number; onPlus?: () => void }> = ({ total, onPlus }) => {
  const [bump, setBump] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 700);
    return () => window.clearTimeout(t);
  }, [total]);
  return <div className={`score-bar ${bump ? 'bump' : ''}`} dir="ltr" role="status" aria-label={`امتیاز من: ${toFa(total)}`}>
    <img className="score-coin" src={`${UI}/coin.svg`} alt="" draggable={false} />
    <span className="score-plate">
      <img src={`${UI}/plate.svg`} alt="" draggable={false} />
      <b>{toFa(total)}</b>
    </span>
    <button type="button" className="score-plus" onClick={onPlus} aria-label="دیدن پیشرفت من">
      <img src={`${UI}/plus.svg`} alt="" draggable={false} />
    </button>
  </div>;
};

type Phase = 'closed' | 'open' | 'closing';
const EASE_OUT = 'cubic-bezier(.2,1.25,.35,1)'; // کمی فنری، مثل Dynamic Island
const EASE_IN = 'cubic-bezier(.4,0,.2,1)';

/**
 * جزیرهٔ امتیاز به سبک Dynamic Island آیفون.
 * از دل دکمهٔ عنوان بیرون می‌آید، و با لمسِ هر جای دیگرِ صفحه نرم کوچک می‌شود و به همان دکمه برمی‌گردد.
 */
export const ScoreIsland: React.FC<{
  open: boolean;
  anchor: React.RefObject<HTMLElement | null>;
  session: number;
  total: number;
  onClose: () => void;
}> = ({ open, anchor, session, total, onClose }) => {
  const [phase, setPhase] = useState<Phase>('closed');
  const box = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);

  useEffect(() => {
    if (open && phase !== 'open') setPhase('open');
    if (!open && phase === 'open') setPhase('closing');
  }, [open, phase]);

  const rects = () => {
    const a = anchor.current?.getBoundingClientRect();
    const w = Math.min(window.innerWidth - 24, 340);
    const h = 78;
    const top = a ? Math.max(6, a.top + a.height / 2 - h / 2) : 12;
    const to = { left: (window.innerWidth - w) / 2, top, width: w, height: h };
    const from = a ? { left: a.left, top: a.top, width: a.width, height: a.height } : { ...to, width: 40, left: (window.innerWidth - 40) / 2 };
    return { from, to };
  };
  const px = (r: { left: number; top: number; width: number; height: number }, radius: number) =>
    ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: `${radius}px` });

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const { from, to } = rects();
    Object.assign(el.style, px(to, to.height / 2));
    anim.current?.cancel();
    if (phase === 'open') {
      if (anchor.current) anchor.current.style.visibility = 'hidden';
      anim.current = el.animate([px(from, from.height / 2), px(to, to.height / 2)], { duration: 520, easing: EASE_OUT });
    } else if (phase === 'closing') {
      const a = el.animate([px(to, to.height / 2), px(from, from.height / 2)], { duration: 340, easing: EASE_IN, fill: 'forwards' });
      anim.current = a;
      a.onfinish = () => { if (anchor.current) anchor.current.style.visibility = ''; setPhase('closed'); };
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // لمسِ هر جای دیگرِ صفحه ← بسته شدن (خودِ لمس هم کارش را انجام می‌دهد)
  useEffect(() => {
    if (phase !== 'open') return;
    const down = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) onClose(); };
    const t = window.setTimeout(() => document.addEventListener('pointerdown', down, true), 0);
    return () => { window.clearTimeout(t); document.removeEventListener('pointerdown', down, true); };
  }, [phase, onClose]);

  useEffect(() => () => { if (anchor.current) anchor.current.style.visibility = ''; }, [anchor]);

  if (phase === 'closed') return null;
  const msg = session > 0 ? 'آفرین! این دفعه گرفتی' : 'هنوز امتیازی نگرفتی';
  return <div ref={box} className={`score-island ${phase}`} role="status" aria-live="polite" onClick={onClose}>
    <div className="score-island-body" dir="rtl">
      <img className="score-island-chest" src={`${UI}/chest.svg`} alt="" draggable={false} />
      <div className="score-island-text">
        <small>{msg}</small>
        <b>{session > 0 ? <>+{toFa(session)} <span>امتیاز</span></> : <span>یک کلمه بساز! ✨</span>}</b>
      </div>
      <div className="score-island-total" dir="ltr">
        <img src={`${UI}/coin.svg`} alt="" draggable={false} />
        <span>{toFa(total)}</span>
      </div>
    </div>
  </div>;
};
