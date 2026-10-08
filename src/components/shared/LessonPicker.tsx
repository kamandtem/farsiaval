import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CURRICULUM, kidDisplay, lessonForToday, weekLabel } from '../../data/curriculum';
import { toFa, useCurrentLesson } from '../../utils/lessonState';
import { sound } from '../../utils/audio';
import { useBackHandler } from '../../utils/backNav';
import { isLessonLocked, useFullVersion } from '../../utils/billing';
import { CloseArt } from './ArtButtons';
import { SignText } from './SignText';

/** پنجرهٔ انتخاب درس (کاشی‌های رنگی به ترتیب کتاب) */
export const LessonSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [lesson, setLesson] = useCurrentLesson();
  const today = lessonForToday();
  useFullVersion(); // بعد از خرید قفل‌ها فوراً برداشته شوند
  useBackHandler(() => { onClose(); }, open);
  if (!open) return null;
  return <div className="kid-sheet-backdrop" onClick={onClose}>
    <section className="kid-sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <span className="kid-sheet-grip" aria-hidden="true" />
      <header>
        <div><b>کدام درس؟</b><small>درسی را که در کلاس خوانده‌ای انتخاب کن</small></div>
        <CloseArt className="sheet-close" onClick={onClose} />
      </header>
      <div className="lesson-tiles">
        {CURRICULUM.map(l => { const locked = isLessonLocked(l.order); return <button key={l.id}
          className={`lesson-tile ${l.order === lesson ? 'active' : ''} ${l.order < lesson ? 'done' : ''} ${l.part === 2 ? 'part2' : ''} ${locked ? 'locked' : ''}`}
          aria-label={locked ? `درس ${toFa(l.order)} (قفل)` : undefined}
          onClick={() => { sound.playPop(); if (setLesson(l.order)) { sound.playLetter(l.order); window.setTimeout(onClose, 180); } }}>
          {locked && <span className="lesson-tile-lock" aria-hidden="true">🔒</span>}
          <span className="lesson-tile-num">{toFa(l.order)}</span>
          {l.order === 27
            ? <b className="tahriri lesson-tile-forms" aria-label="شکل‌های حرف ه">
                {['ه', 'ـه', 'ـهـ', 'هـ'].map(form => <span key={form}>{kidDisplay(form)}</span>)}
              </b>
            : <b className="tahriri"><SignText text={l.sign} /></b>}
          <small>{weekLabel(l.week)}</small>
          {l.order === today && <em>امروز ⭐</em>}
        </button>; })}
      </div>
    </section>
  </div>;
};

/** دکمهٔ انتخاب درس بر اساس سرفصل کتاب */
export const LessonPicker: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [lesson] = useCurrentLesson();
  const [open, setOpen] = useState(false);
  const current = CURRICULUM[lesson - 1];
  return <>
    <button className={`lesson-pill ${compact ? 'compact' : ''}`} onClick={() => { sound.playPop(); setOpen(true); }} aria-label="انتخاب درس">
      <span className="lesson-pill-sign tahriri"><SignText text={current.sign} /></span>
      <span className="lesson-pill-text"><b>درس {toFa(lesson)}</b>{!compact && <small>{current.part === 1 ? 'نشانه‌ها ۱' : 'نشانه‌ها ۲'} · {weekLabel(current.week)}</small>}</span>
      <ChevronDown className="lesson-pill-caret" strokeWidth={3} />
    </button>
    <LessonSheet open={open} onClose={() => setOpen(false)} />
  </>;
};
