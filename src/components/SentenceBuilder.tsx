import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, RotateCcw, X } from 'lucide-react';
import { sentenceSuggestionsForLesson } from '../data/sentenceBank';
import { CURRICULUM } from '../data/curriculum';
import { sound } from '../utils/audio';
import { shuffle, toFa, useCurrentLesson } from '../utils/lessonState';
import { LessonPicker } from './shared/LessonPicker';
import { GameHeader } from './shared/GameHeader';
import { useBackHandler } from '../utils/backNav';
import { CloseArt, OkArt } from './shared/ArtButtons';
import { RoundComplete } from './shared/RoundComplete';

/** جمله‌هایی که کودک درست ساخته، در صندوقچهٔ پایین صفحه جمع می‌شوند (بین اجراها می‌ماند) */
const DONE_KEY = 'alefba_done_sentences_v1';
const readDone = (): string[] => { try { const v = JSON.parse(localStorage.getItem(DONE_KEY) || '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; } catch { return []; } };

const plain = (s: string) => s.replace(/[\u064B-\u0652]/g, '');

/** دهکده سوم: جمله‌سازی — فقط جمله‌هایی که همهٔ نشانه‌هایشان تا درس انتخاب‌شده خوانده شده */
export const SentenceBuilder: React.FC<{ onBack: () => void; onComplete: (t: 'word', id?: string) => void }> = ({ onBack, onComplete }) => {
  const [lessonOrder] = useCurrentLesson();
  const pool = useMemo(() => sentenceSuggestionsForLesson(lessonOrder), [lessonOrder]);
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [result, setResult] = useState<'idle' | 'good' | 'try'>('idle');
  const sentence = pool.length ? pool[index % pool.length] : null;
  const words = useMemo(() => sentence ? sentence.text.split(' ') : [], [sentence]);
  const shuffled = useMemo(() => { let s = shuffle(words.map((_, i) => i)); if (words.length > 1 && s.every((v, i) => v === i)) s = s.reverse(); return s; }, [words]);
  useEffect(() => { setOrder([]); setResult('idle'); }, [sentence?.id]);
  const [done, setDone] = useState<string[]>(readDone);
  const [listOpen, setListOpen] = useState(false);
  const [roundDone, setRoundDone] = useState(false);
  const [bump, setBump] = useState(false);
  const [fly, setFly] = useState<{ text: string; x: number; y: number; dx: number; dy: number; key: number } | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const chestRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { setRoundDone(false); setIndex(0); }, [lessonOrder]);
  useBackHandler(() => { if (listOpen) { setListOpen(false); return; } onBack(); });
  /** جملهٔ درست به صندوقچه پرواز می‌کند و به فهرست اضافه می‌شود */
  const storeSentence = (text: string) => {
    setDone(old => {
      if (old.includes(text)) return old;
      const n = [...old, text];
      try { localStorage.setItem(DONE_KEY, JSON.stringify(n)); } catch { /* ignore */ }
      return n;
    });
    const a = answerRef.current?.getBoundingClientRect(), c = chestRef.current?.getBoundingClientRect();
    if (a && c) {
      const x = a.left + a.width / 2, y = a.top + a.height / 2;
      setFly({ text, x, y, dx: c.left + c.width / 2 - x, dy: c.top + c.height / 2 - y, key: Date.now() });
      window.setTimeout(() => { setFly(null); setBump(true); sound.playSnap(); window.setTimeout(() => setBump(false), 700); }, 900);
    } else { setBump(true); window.setTimeout(() => setBump(false), 700); }
  };
  const autoTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(autoTimer.current), []);
  // بعد از جملهٔ آخر: پیام «موفق شدی» به‌جای برگشتِ بی‌خبر به جملهٔ اول
  const nextSentence = () => {
    window.clearTimeout(autoTimer.current);
    if (pool.length && index % pool.length === pool.length - 1) { setRoundDone(true); return; }
    setIndex(i => i + 1);
  };
  const playAgain = () => { setRoundDone(false); if (index % Math.max(1, pool.length) === 0) { setOrder([]); setResult('idle'); } else setIndex(0); };
  const reset = () => { setOrder([]); setResult('idle'); };
  const check = () => {
    if (!sentence) return;
    const ok = order.map(i => words[i]).join(' ') === sentence.text;
    setResult(ok ? 'good' : 'try');
    if (ok) { sound.playSuccess(); onComplete('word', sentence.id); storeSentence(sentence.text); window.clearTimeout(autoTimer.current); autoTimer.current = window.setTimeout(nextSentence, 2400); /* خودکار ← جملهٔ بعدی */ }
    else { /* جمله‌سازی عمداً بدون صدای گفتاری است. */ }
  };
  return <main className="sentence-screen" dir="rtl">
    <GameHeader kicker="دهکدهٔ سوم" title="جمله‌سازی" emoji="💬" tone="sky" onBack={onBack}><LessonPicker compact /></GameHeader>
    {!sentence ? <section className="sentence-workspace"><div className="sentence-prompt"><h2>هنوز زود است!</h2><p>جمله‌سازی از درس {toFa(4)} (نشانهٔ «د») شروع می‌شود. درس را از بالا عوض کن.</p></div></section> :
      <section className="sentence-workspace">
        <div className="sentence-prompt"><span>جمله {toFa(index % pool.length + 1)} از {toFa(pool.length)} · تا نشانهٔ «{CURRICULUM[lessonOrder - 1].sign}»</span><h2>کلمه‌ها را به ترتیب بچین</h2><p>روی کلمه‌ها به ترتیب بزن تا جمله ساخته شود.</p></div>
        <div ref={answerRef} className={`sentence-answer ${result}`}>{order.length ? order.map((wi, i) => <button key={`${wi}-${i}`} className="tahriri" onClick={() => { setOrder(o => o.filter((_, j) => j !== i)); setResult('idle'); }}>{words[wi]}</button>) : <span>کلمه‌ها اینجا کنار هم می‌نشینند</span>}</div>
        <div className="sentence-words">{shuffled.filter(i => !order.includes(i)).map(i => <button key={i} className="tahriri" onClick={() => { setOrder(o => [...o, i]); sound.playPop(); }}>{words[i]}</button>)}</div>
        <div className="sentence-actions"><button onClick={reset}><RotateCcw /> از اول</button><OkArt className="sentence-ok" onClick={check} /><button className="sentence-next" onClick={() => { sound.playPop(); nextSentence(); }}>جملهٔ بعدی <ChevronLeft /></button></div>
        {result === 'good' && <div className="feedback good"><Check /> آفرین! جمله را درست ساختی.</div>}
        {result === 'try' && <div className="feedback try"><X /> هنوز درست نشده؛ تو می‌توانی، یک بار دیگر.</div>}
      </section>}
    <div className="sentence-chest-wrap">
      <button ref={chestRef} className={`sentence-chest ${bump ? 'bump' : ''}`} onClick={() => { sound.playPop(); setListOpen(true); }} aria-label="صندوقچهٔ جمله‌های من">
        <img src="/assets/ui/letter-chest.svg" alt="" draggable={false} />
        <span>جمله‌های من</span>
        {done.length > 0 && <b>{toFa(done.length)}</b>}
      </button>
    </div>
    {fly && <span key={fly.key} className="sentence-fly tahriri" style={{ left: fly.x, top: fly.y, '--dx': `${fly.dx}px`, '--dy': `${fly.dy}px` } as React.CSSProperties}>{fly.text}</span>}
    {listOpen && <div className="sentence-list-backdrop" onClick={() => setListOpen(false)}>
      <section className="sentence-list" onClick={e => e.stopPropagation()} aria-label="جمله‌هایی که ساختی">
        <header><img src="/assets/ui/letter-chest.svg" alt="" draggable={false} /><div><b>جمله‌هایی که ساختی</b><small>روی هر جمله بزن تا آن را بشنوی</small></div><CloseArt onClick={() => setListOpen(false)} /></header>
        {done.length ? <ol>{done.map((t, i) => <li key={t}><em>{toFa(i + 1)}</em><button className="tahriri">{t}</button></li>)}</ol>
          : <p className="sentence-list-empty">هنوز جمله‌ای نساخته‌ای. هر جمله‌ای که درست بسازی، این‌جا می‌آید.</p>}
      </section>
    </div>}
    <RoundComplete open={roundDone} text={`همهٔ ${toFa(pool.length)} جملهٔ این درس را درست ساختی.`} onAgain={playAgain} />
  </main>;
};
