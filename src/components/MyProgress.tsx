import React, { useEffect, useRef } from 'react';
import { UserProgress } from '../types';
import { CURRICULUM, kidDisplay } from '../data/curriculum';
import { toFa, useCurrentLesson } from '../utils/lessonState';
import { useBackHandler } from '../utils/backNav';
import { sound } from '../utils/audio';
import { CloseArt } from './shared/ArtButtons';

/**
 * صفحهٔ «پیشرفت من»
 * کودک می‌بیند تا کدام نشانهٔ کتاب جلو آمده، چند ستاره گرفته و در هر دهکده چقدر بازی کرده است.
 */
const ROW = 5;
const WORD_GOAL = 30;

export const MyProgress: React.FC<{ progress: UserProgress; onBack: () => void }> = ({ progress, onBack }) => {
  const [lesson] = useCurrentLesson();
  const total = CURRICULUM.length;
  const practiced = new Set(progress.lettersLearned);
  const practicedCount = CURRICULUM.filter(l => practiced.has(l.id)).length;
  const reached = Math.max(lesson, 1);
  const pct = Math.round((reached / total) * 100);
  const curRef = useRef<HTMLButtonElement>(null);
  useBackHandler(() => { onBack(); });

  useEffect(() => {
    document.title = 'پیشرفت من · دهکده الفبا';
    const t = window.setTimeout(() => curRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 450);
    return () => window.clearTimeout(t);
  }, []);

  const rows: typeof CURRICULUM[] = [];
  for (let i = 0; i < CURRICULUM.length; i += ROW) rows.push(CURRICULUM.slice(i, i + ROW));

  const cheer = pct >= 100 ? 'همهٔ نشانه‌های کتاب را یاد گرفتی! قهرمانی! 🏆'
    : pct >= 50 ? 'بیشتر از نصف راه را رفتی، ادامه بده! 🚀'
    : reached > 1 ? 'داری عالی جلو می‌روی! 🌟' : 'سفر تازه شروع شده، بزن بریم! 🎒';

  const villages = [
    { id: 'rec', title: 'آشنایی با حروف', art: '/assets/map-island-3.webp', value: practicedCount, goal: total, unit: 'نشانه', tone: 'coral' },
    { id: 'word', title: 'کلمه‌نویسی', art: '/assets/map-island-2.webp', value: progress.wordsCompleted.length, goal: WORD_GOAL, unit: 'کلمه و جمله', tone: 'green' },
    { id: 'sent', title: 'جمله‌سازی', art: '/assets/map-island-1.webp', value: reached >= 4 ? Math.min(reached, total) - 3 : 0, goal: total - 3, unit: reached >= 4 ? 'درس باز شده' : 'از درس ۴ باز می‌شود', tone: 'blue' },
  ];

  return <main className="mp-screen" dir="rtl">
    <div className="mp-sky" aria-hidden="true"><span className="mp-sun" /><span className="mp-cloud a" /><span className="mp-cloud b" /></div>

    <header className="mp-top">
      <div className="mp-ribbon"><small>دفترچهٔ من</small><strong>پیشرفت من</strong></div>
      <CloseArt className="mp-close" onClick={() => { sound.playPop(); onBack(); }} label="بازگشت به صفحهٔ شروع" />
    </header>

    <section className="mp-hero" aria-label="خلاصهٔ پیشرفت">
      <div className="mp-ring" style={{ ['--p' as string]: pct } as React.CSSProperties} role="img" aria-label={`${toFa(pct)} درصد از نشانه‌های کتاب`}>
        <div><b>{toFa(pct)}٪</b><small>از کتاب</small></div>
      </div>
      <div className="mp-hero-text">
        <h1>درس {toFa(reached)} از {toFa(total)}</h1>
        <p>{cheer}</p>
        <div className="mp-now">
          <span>نشانهٔ الان من</span>
          <b className="tahriri">{kidDisplay(CURRICULUM[reached - 1].sign)}</b>
        </div>
      </div>
    </section>

    <section className="mp-loot" aria-label="جایزه‌های من">
      <div className="mp-jar star"><i>⭐</i><b>{toFa(progress.starsCount)}</b><span>ستاره</span></div>
      <div className="mp-jar leaf"><i>🌱</i><b>{toFa(progress.gardenLeaves)}</b><span>برگ باغچه</span></div>
      <div className="mp-jar today"><i>🎯</i><b>{toFa(progress.activitiesDoneToday)}</b><span>تمرین امروز</span></div>
    </section>

    <section className="mp-villages" aria-label="دهکده‌ها">
      <h2>دهکده‌های من</h2>
      {villages.map(v => {
        const r = Math.min(1, v.value / v.goal);
        return <div key={v.id} className={`mp-village tone-${v.tone}`}>
          <img src={v.art} alt="" />
          <div className="mp-village-body">
            <div className="mp-village-head"><b>{v.title}</b><span>{v.value ? `${toFa(v.value)} ` : ''}{v.unit}</span></div>
            <div className="mp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={v.goal} aria-valuenow={v.value}><i style={{ transform: `scaleX(${Math.max(r, 0.04)})` }} /></div>
          </div>
        </div>;
      })}
    </section>

    <section className="mp-path" aria-label="مسیر نشانه‌های کتاب">
      <h2>مسیر نشانه‌ها</h2>
      <p className="mp-legend"><span className="done">⭐ یاد گرفتم</span><span className="cur">🎒 الان اینجام</span><span className="lock">🔒 بعداً</span></p>
      <ol className="mp-stones">
        {rows.map((row, ri) => <li key={ri} className={`mp-stone-row ${ri % 2 ? 'rev' : ''}`}>
          {row.map(l => {
            const state = l.order < reached || practiced.has(l.id) ? (l.order === reached ? 'cur' : 'done') : l.order === reached ? 'cur' : 'lock';
            return <button key={l.id} ref={l.order === reached ? curRef : undefined} className={`mp-stone ${state}`}
              onClick={() => { sound.playPop(); sound.playLetter(l.order); }} aria-label={`درس ${toFa(l.order)}: نشانهٔ ${l.spoken}`}>
              <span className="mp-stone-num">{toFa(l.order)}</span>
              <b className="tahriri">{kidDisplay(l.sign)}</b>
              {state === 'cur' && <em aria-hidden="true">🎒</em>}
              {state === 'done' && <u aria-hidden="true">⭐</u>}
            </button>;
          })}
        </li>)}
      </ol>
    </section>
  </main>;
};
