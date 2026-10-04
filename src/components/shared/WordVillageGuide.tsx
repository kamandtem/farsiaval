import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { sound } from '../../utils/audio';
import { toFa } from '../../utils/lessonState';

/** راهنمای قدم‌به‌قدمِ دهکدهٔ کلمه‌نویسی؛ فقط بار اول خودکار باز می‌شود، بعد با دکمهٔ «؟» */
export const WV_GUIDE_KEY = 'alefba_wv_guide_seen_v1';
export const guideSeen = () => { try { return localStorage.getItem(WV_GUIDE_KEY) === '1'; } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(WV_GUIDE_KEY, '1'); } catch { /* ignore */ } };

interface Step { sel?: string; emoji: string; title: string; text: string }
const STEPS: Step[] = [
  { emoji: '👋', title: 'سلام! بیا با هم یاد بگیریم', text: 'اینجا کلمه می‌سازی. قدم‌به‌قدم نشانت می‌دهم هر بخش چه کار می‌کند.' },
  { sel: '.wv-modes', emoji: '🧭', title: 'سه بازی داریم', text: 'کلمه‌های درس: کلمه را با حرف‌های آماده بساز. دیکته: کلمه را خودت بنویس یا جای خالی را پر کن. نوشتن آزاد: هر کلمه‌ای دوست داری بساز.' },
  { sel: '.wv-target-emoji', emoji: '🖼️', title: 'عکس کلمه', text: 'به عکس نگاه کن تا بفهمی چه کلمه‌ای باید بسازی.' },
  { sel: '.wv-reveal-word', emoji: '👆', title: 'کلمهٔ پوشیده', text: 'کلمه زیر پوشش است. اگر کمک خواستی، دو بار رویش بزن تا دیده شود. بعد با زدن دوباره، کلمه را می‌شنوی.' },
  { sel: '.wv-board', emoji: '🧲', title: 'تختهٔ مغناطیسی', text: 'حرف‌ها بالای تخته هستند. هر حرف را بگیر و روی خط مغناطیسی بکش. حرف‌های کنار هم خودشان به هم می‌چسبند.' },
  { sel: '.wv-actions', emoji: '✅', title: 'دکمه‌های پایین', text: 'جعبهٔ حروف همهٔ حرف‌ها را دارد. «از اول» تخته را پاک می‌کند. وقتی کلمه تمام شد، دکمهٔ تأیید را بزن.' },
  { sel: '.wv-next', emoji: '➡️', title: 'کلمهٔ بعدی', text: 'هر وقت خواستی کلمهٔ تازه بیاید، این دکمه را بزن. هر وقت هم راهنما خواستی، دکمهٔ «؟» را بزن.' },
];

export const WordVillageGuide: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = STEPS[Math.min(i, STEPS.length - 1)];

  useEffect(() => { if (open) setI(0); }, [open]);

  const measure = useCallback(() => {
    if (!step.sel) { setRect(null); return; }
    const el = document.querySelector(step.sel) as HTMLElement | null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step.sel]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener('resize', measure);
    const t = window.setTimeout(measure, 120);
    return () => { window.removeEventListener('resize', measure); window.clearTimeout(t); };
  }, [open, i, measure]);

  useEffect(() => { if (open) sound.speakPersian(`${step.title}. ${step.text}`); }, [open, i]); // eslint-disable-line

  if (!open) return null;
  const close = () => { markSeen(); sound.playPop(); onClose(); };
  const next = () => { sound.playPop(); if (i >= STEPS.length - 1) close(); else setI(i + 1); };
  const prev = () => { sound.playPop(); setI(Math.max(0, i - 1)); };

  const pad = 8;
  const hole = rect ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null;
  // کارت راهنما در نیمهٔ خالیِ صفحه می‌نشیند تا روی بخشِ نشان‌داده‌شده را نپوشاند
  const cardAtTop = !!rect && rect.top + rect.height / 2 > window.innerHeight / 2;

  return <div className="wv-guide" role="dialog" aria-modal="true" aria-label="راهنمای کلمه‌نویسی" dir="rtl">
    {hole ? <div className="wv-guide-hole" style={hole} /> : <div className="wv-guide-dim" />}
    <div className="wv-guide-catch" onClick={e => e.stopPropagation()} />
    <section className={`wv-guide-card ${hole ? (cardAtTop ? 'at-top' : 'at-bottom') : 'at-center'}`} key={i}>
      <span className="wv-guide-emoji" aria-hidden="true">{step.emoji}</span>
      <b>{step.title}</b>
      <p>{step.text}</p>
      <div className="wv-guide-dots" aria-hidden="true">{STEPS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      <div className="wv-guide-btns">
        <button className="wv-guide-next" onClick={next}>{i >= STEPS.length - 1 ? 'شروع کنیم!' : `بعدی (${toFa(i + 1)} از ${toFa(STEPS.length)})`}</button>
        {i > 0 && <button className="wv-guide-ghost" onClick={prev}>قبلی</button>}
        {i < STEPS.length - 1 && <button className="wv-guide-ghost" onClick={close}>رد شدن</button>}
      </div>
    </section>
  </div>;
};
