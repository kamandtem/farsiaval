import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Eraser, Flag, RefreshCw, Undo2, Volume2 } from 'lucide-react';
import { CURRICULUM, kidGlyph, LETTER_BOX } from '../data/curriculum';
import { boardLessonWords, boardSuggestWords, dictationWords, DictationItem, findWord, WordEntry, emojiText } from '../data/wordBank';
import { WordPic } from './shared/WordPic';
import { finishProblem, parseToken, plainSequence, renderSequence, tashdidProfile, validateSequence } from '../utils/pieces';
import { sound } from '../utils/audio';
import { shuffle, toFa, useCurrentLesson } from '../utils/lessonState';
import { LessonPicker } from './shared/LessonPicker';
import { GameHeader } from './shared/GameHeader';
import { useBackHandler } from '../utils/backNav';
import { ScoreIsland } from './shared/ScoreIsland';

/** امتیازِ «این دفعه»: با رفتن به «پیشرفت من» و برگشتن صفر نمی‌شود، فقط با خروج از دهکده */
let sessionPoints = 0;
import { cheer, FeedbackState, FeedbackToast, praise } from './shared/Feedback';
import { CloseArt, OkArt } from './shared/ArtButtons';
import { RoundComplete } from './shared/RoundComplete';
import { guideSeen, WordVillageGuide } from './shared/WordVillageGuide';

type Mode = 'lesson' | 'suggest' | 'dictation' | 'free';
interface FreePiece { id: string; token: string; x: number; y: number }
interface SeqItem { id: string; token: string }
interface LineWord { id: string; x: number; seq: SeqItem[]; closed: boolean; status?: 'good' | 'bad' }
type Drag =
  | { kind: 'new'; token: string; cx: number; cy: number }
  | { kind: 'free'; id: string; token: string; cx: number; cy: number; ox: number; oy: number; moved: boolean }
  | { kind: 'word'; id: string; cx: number; cy: number; ox: number; oy: number; moved: boolean };

const uid = () => Math.random().toString(36).slice(2, 9);
const speakable = (s: string) => s.replace(/[\u064B-\u0652\u200D]/g, '');
/** سانسور دو لایه است: دو لمس برای دیدن کلمه */
const REVEAL_PIECES = 2;
const WordVisual = WordPic;

export const WordVillage: React.FC<{ onBack: () => void; onComplete: (t: 'word', id?: string) => void; stars: number; onProgress?: () => void }> = ({ onBack: leave, onComplete: record, stars }) => {
  const [session, setSession] = useState(sessionPoints);
  const [islandOpen, setIslandOpen] = useState(false);
  const titleRef = useRef<HTMLButtonElement>(null);
  const onBack = () => { sessionPoints = 0; leave(); };
  const onComplete = (t: 'word', id?: string) => { sessionPoints += 1; setSession(sessionPoints); record(t, id); };
  const closeIsland = useCallback(() => setIslandOpen(false), []);
  const [lessonOrder] = useCurrentLesson();
  const lesson = CURRICULUM[lessonOrder - 1];
  const [mode, setMode] = useState<Mode>('lesson');
  const boardRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef(new Map<string, HTMLSpanElement>());
  const [size, setSize] = useState({ w: 360, h: 460 });
  const [free, setFree] = useState<FreePiece[]>([]);
  const [words, setWords] = useState<LineWord[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [boxOpen, setBoxOpen] = useState(false);
  const [boxKey, setBoxKey] = useState<string | null>(null);
  const [boxAnchor, setBoxAnchor] = useState<number | null>(null);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [shakeWord, setShakeWord] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [revealPeels, setRevealPeels] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  // بار اولِ ورود: راهنمای قدم‌به‌قدم
  useEffect(() => { if (guideSeen()) return; const t = window.setTimeout(() => setGuideOpen(true), 700); return () => window.clearTimeout(t); }, []);
  const lastWord = useRef<string | null>(null);
  const autoTimer = useRef(0);
  const modeRef = useRef<Mode>(mode); modeRef.current = mode;
  useEffect(() => () => window.clearTimeout(autoTimer.current), []);
  useEffect(() => { window.clearTimeout(autoTimer.current); setRoundDone(false); }, [mode]);

  // --- هندسهٔ تخته
  useLayoutEffect(() => {
    const b = boardRef.current; if (!b) return;
    const ro = new ResizeObserver(() => setSize({ w: b.clientWidth, h: b.clientHeight }));
    ro.observe(b); setSize({ w: b.clientWidth, h: b.clientHeight });
    return () => ro.disconnect();
  }, []);
  const parkH = size.h * 0.42;               // بخش بالایی: جای حروف (بدون چسبندگی)
  const lineY = parkH + (size.h - parkH) * 0.55; // خط مغناطیسی
  const band = Math.max(38, (size.h - parkH) * 0.2);

  // --- کلمه‌های هدف
  // کلمه‌های درس: اول واژه‌های «بنویس» کتاب (ساده ← سخت)، بعد واژه‌های مهم دیگر درس
  const lessonList = useMemo<WordEntry[]>(() => boardLessonWords(Math.max(2, lessonOrder)), [lessonOrder]);
  // پیشنهاد کلمه: واژه‌های بیرون از کتاب با همین نشانه که پیش‌نیازشان خوانده شده (ساده ← سخت)
  const suggestList = useMemo<WordEntry[]>(() => boardSuggestWords(lessonOrder), [lessonOrder]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [suggestIdx, setSuggestIdx] = useState(0);
  const suggestion: WordEntry | null = suggestList.length ? suggestList[suggestIdx % suggestList.length] : null;
  // دیکتهٔ شب (کلمهٔ ناقص): واژه‌های درس + چند واژهٔ بیرون از کتاب، با یک جای خالی به جای نشانهٔ درس
  const dictList = useMemo<DictationItem[]>(() => dictationWords(lessonOrder), [lessonOrder]);
  const [dictIdx, setDictIdx] = useState(0);
  const dictItem: DictationItem | null = dictList.length ? dictList[dictIdx % dictList.length] : null;
  const [dictFilled, setDictFilled] = useState(false);
  const [dictShake, setDictShake] = useState(false);
  const [dictChooser, setDictChooser] = useState(false);
  const blankRef = useRef<HTMLSpanElement>(null);
  const target: WordEntry | null = mode === 'lesson' ? lessonList[targetIdx % lessonList.length] : mode === 'suggest' ? suggestion : mode === 'dictation' ? (dictItem?.entry ?? null) : null;

  const slot = useCallback((i: number, jitter = true) => {
    const cols = Math.max(3, Math.floor((size.w - 40) / 84));
    const r = Math.floor(i / cols), c = i % cols;
    const cellW = (size.w - 40) / cols;
    return { x: size.w - 20 - cellW * (c + 0.5) + (jitter ? Math.random() * 16 - 8 : 0), y: 58 + r * 78 + (jitter ? Math.random() * 12 - 6 : 0) };
  }, [size.w]);
  const freeSlot = useCallback((list: FreePiece[]) => {
    for (let i = 0; i < 40; i++) { const s = slot(i, false); if (s.y > parkH - 30) break; if (!list.some(p => Math.abs(p.x - s.x) < 40 && Math.abs(p.y - s.y) < 36)) return slot(i); }
    return { x: 40 + Math.random() * (size.w - 80), y: 50 + Math.random() * (parkH - 90) };
  }, [slot, parkH, size.w]);

  const resetBoard = useCallback((t: WordEntry | null, m: Mode) => {
    setWords([]); setSolved(false); lastWord.current = null; setDictFilled(false);
    if (m === 'dictation') {
      setFree([]);
      if (t) sound.speakPersian(`${speakable(t.word)}. جای خالی را پر کن`);
      return;
    }
    if (m === 'lesson' && t) {
      const tokens = shuffle(t.tokens.filter(tk => parseToken(tk).kind !== 'mark'));
      setFree(tokens.map((token, i) => ({ id: uid(), token, ...slot(i) })));
      sound.speakPersian(`کلمهٔ ${speakable(t.word)} را بساز`);
    } else {
      setFree([]);
      if (t) sound.speakPersian(`کلمهٔ ${speakable(t.word)} را بنویس`);
    }
  }, [slot]);

  useEffect(() => { setTargetIdx(0); setSuggestIdx(0); setDictIdx(0); setRoundDone(false); }, [lessonOrder]);
  useEffect(() => { setRevealPeels(0); }, [mode, target?.id]);
  useEffect(() => { resetBoard(target, mode); }, [mode, target?.id, size.w > 0, mode === 'dictation' ? dictIdx : 0]); // eslint-disable-line

  // --- پیام‌ها
  const say = (tone: 'good' | 'try' | 'info', text: string, emoji?: string) => { setFb({ tone, text, emoji }); sound.speakPersian(text.replace(/[«»]/g, '')); };
  const block = (msg: string, wordId?: string) => { setFb({ tone: 'try', text: msg, emoji: '✋' }); sound.speakPersian(msg.replace(/«[^»]*»/g, '')); if (wordId) { setShakeWord(wordId); window.setTimeout(() => setShakeWord(null), 600); } };

  // --- هندسهٔ کلمه‌ها روی خط
  const wordSpan = (w: LineWord) => { const el = wordRefs.current.get(w.id); const width = el ? el.getBoundingClientRect().width : 60 * w.seq.length; return { right: w.x, left: w.x - width }; };

  /** گذاشتن یک قطعه روی خط مغناطیسی */
  const dropOnLine = (token: string, x: number): boolean => {
    const def = parseToken(token);
    let best: { w: LineWord; where: 'append' | 'prepend'; d: number } | null = null;
    for (const w of words) {
      const s = wordSpan(w);
      const dl = Math.abs(x - s.left), dr = Math.abs(x - s.right);
      if (x >= s.left - 80 && x <= s.right + 80) {
        const where = dl <= dr ? 'append' : 'prepend';
        const d = Math.min(dl, dr);
        if (!best || d < best.d) best = { w, where, d };
      }
    }
    if (best) {
      const w = best.w;
      if (w.closed) { block('این کلمه تمام شده؛ کلمهٔ تازه را جای دیگری روی خط شروع کن.', w.id); return false; }
      if (def.kind === 'mark' && best.where === 'prepend') best.where = 'append';
      const item = { id: uid(), token };
      const seq = best.where === 'append' ? [...w.seq, item] : [item, ...w.seq];
      const v = validateSequence(seq.map(s => parseToken(s.token)));
      if (!v.ok) { block(v.message!, w.id); return false; }
      setWords(ws => ws.map(o => o.id === w.id ? { ...o, seq, status: undefined } : o));
      lastWord.current = w.id; sound.playSnap(); return true;
    }
    const v = validateSequence([def]);
    if (!v.ok) { block(v.message!); return false; }
    const id = uid();
    setWords(ws => [...ws, { id, x: Math.min(size.w - 12, x + 30), seq: [{ id: uid(), token }], closed: false }]);
    lastWord.current = id; sound.playSnap(); return true;
  };

  // --- کشیدن و رها کردن با اشاره‌گر (سازگار با لمس در اندروید)
  const toLocal = (cx: number, cy: number) => { const r = boardRef.current!.getBoundingClientRect(); return { x: cx - r.left, y: cy - r.top, inside: cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom }; };
  const onLine = (y: number) => y > parkH && Math.abs(y - lineY) <= band;

  const startNew = (e: React.PointerEvent, token: string) => { e.preventDefault(); setDrag({ kind: 'new', token, cx: e.clientX, cy: e.clientY }); setBoxOpen(false); sound.playPop(); };
  const startFree = (e: React.PointerEvent, p: FreePiece) => { e.preventDefault(); const l = toLocal(e.clientX, e.clientY); setDrag({ kind: 'free', id: p.id, token: p.token, cx: e.clientX, cy: e.clientY, ox: l.x - p.x, oy: l.y - p.y, moved: false }); };
  const startWord = (e: React.PointerEvent, w: LineWord) => { e.preventDefault(); const l = toLocal(e.clientX, e.clientY); setDrag({ kind: 'word', id: w.id, cx: e.clientX, cy: e.clientY, ox: l.x - w.x, oy: l.y - lineY, moved: false }); };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag(d => d ? { ...d, cx: e.clientX, cy: e.clientY, ...(d.kind !== 'new' ? { moved: d.moved || Math.hypot(e.clientX - d.cx, e.clientY - d.cy) > 3 } : {}) } as Drag : d);
    const up = (e: PointerEvent) => { finishDrag(e.clientX, e.clientY); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }); // eslint-disable-line

  /** دیکته: آیا نقطهٔ رها کردن روی جای خالی (یا نزدیکش) است؟ */
  const nearBlank = (cx: number, cy: number) => {
    const r = blankRef.current?.getBoundingClientRect(); if (!r) return false;
    const pad = 46;
    return cx >= r.left - pad && cx <= r.right + pad && cy >= r.top - pad && cy <= r.bottom + pad;
  };
  const dropOnBlank = (token: string, cx: number, cy: number) => {
    if (!dictItem || dictFilled) return;
    if (!nearBlank(cx, cy)) { say('info', 'شکل را بکش و روی جای خالی رها کن.', '👆'); return; }
    const ans = dictItem.answer;
    if (token === ans) {
      setDictFilled(true); setSolved(true); sound.playSnap();
      window.setTimeout(() => sound.playSuccess(), 120);
      say('good', `${praise()} موفق شدی!`, emojiText(dictItem.entry.emoji, '🎉'));
      onComplete('word', dictItem.entry.id);
      const m0 = modeRef.current;
      window.clearTimeout(autoTimer.current); autoTimer.current = window.setTimeout(() => { if (modeRef.current === m0) next(); }, 2400);
      return;
    }
    // اشتباه: شکل برمی‌گردد و غلط اعلام می‌شود
    setDictShake(true); window.setTimeout(() => setDictShake(false), 600);
    sound.playGentleHint();
    setFb({ tone: 'try', text: 'دوباره تلاش کن.', emoji: '🔁' });
    sound.speakPersian('دوباره تلاش کن');
  };

  const finishDrag = (cx: number, cy: number) => {
    const d = drag; setDrag(null); if (!d || !boardRef.current) return;
    const l = toLocal(cx, cy);
    const clampX = (x: number) => Math.max(30, Math.min(size.w - 30, x));
    const clampY = (y: number) => Math.max(34, Math.min(size.h - 34, y));
    if (d.kind === 'new' && modeRef.current === 'dictation') { dropOnBlank(d.token, cx, cy); return; }
    if (d.kind === 'new') {
      if (!l.inside) return;
      if (onLine(l.y)) { if (!dropOnLine(d.token, l.x)) setFree(f => [...f, { id: uid(), token: d.token, ...freeSlot(f) }]); }
      else setFree(f => [...f, { id: uid(), token: d.token, x: clampX(l.x), y: clampY(l.y) }]);
      return;
    }
    if (d.kind === 'free') {
      if (!d.moved) { sound.speakPersian(speakable(parseToken(d.token).glyph)); return; }
      const x = l.x - d.ox, y = l.y - d.oy;
      if (onLine(l.y)) {
        const ok = dropOnLine(d.token, x);
        setFree(f => ok ? f.filter(p => p.id !== d.id) : f.map(p => p.id === d.id ? { ...p, ...freeSlot(f.filter(q => q.id !== d.id)) } : p));
      } else setFree(f => f.map(p => p.id === d.id ? { ...p, x: clampX(x), y: clampY(y) } : p));
      return;
    }
    // کشیدن کلمه
    const w = words.find(o => o.id === d.id); if (!w) return;
    if (!d.moved) { sound.speakPersian(speakable(renderSequence(w.seq.map(s => parseToken(s.token))))); return; }
    const x = l.x - d.ox;
    if (onLine(l.y)) setWords(ws => ws.map(o => o.id === w.id ? { ...o, x: Math.max(40, Math.min(size.w - 8, x)) } : o));
    else { // کلمه از خط جدا شد: حروفش آزاد می‌شوند
      const letters = w.seq;
      setWords(ws => ws.filter(o => o.id !== w.id));
      setFree(f => [...f, ...letters.map((s, i) => ({ id: s.id, token: s.token, x: clampX(x - i * 70), y: clampY(l.y - d.oy) }))]);
      sound.playPop();
    }
  };

  const popLast = (w: LineWord) => {
    const last = w.seq[w.seq.length - 1]; if (!last) return;
    const seq = w.seq.slice(0, -1);
    setWords(ws => seq.length ? ws.map(o => o.id === w.id ? { ...o, seq, closed: false, status: undefined } : o) : ws.filter(o => o.id !== w.id));
    setFree(f => [...f, { id: last.id, token: last.token, ...freeSlot(f) }]); sound.playPop();
  };

  // --- پایان / تایید
  const finish = () => {
    const open = words.filter(w => !w.closed && w.seq.length);
    if (!open.length) { say('info', 'اول حروف را روی خطِ مغناطیسی کنار هم بگذار.'); return; }
    if (mode !== 'free' && open.length > 1) { block('حروف را روی خط به هم بچسبان تا یک کلمه شود.'); return; }
    const w = mode === 'free' ? (open.find(o => o.id === lastWord.current) || open[open.length - 1]) : open[0];
    const defs = w.seq.map(s => parseToken(s.token));
    const problem = finishProblem(defs);
    if (problem) { block(problem, w.id); return; }
    const plain = plainSequence(defs);
    if (mode === 'free') {
      const known = findWord(plain);
      setWords(ws => ws.map(o => o.id === w.id ? { ...o, closed: true, status: 'good' } : o));
      if (known) { sound.playSuccess(); say('good', `${praise()} کلمهٔ «${plain}» را نوشتی.`, emojiText(known.emoji, '🎉')); onComplete('word', known.id); }
      else say('info', `کلمه‌ات تمام شد: «${plain}». آن را بلند بخوان!`, '📝');
      return;
    }
    if (!target) return;
    const m0 = mode;
    const expectedTashdid = tashdidProfile(target.tokens.map(parseToken));
    const actualTashdid = tashdidProfile(defs);
    if (plain === target.plain && (!expectedTashdid || expectedTashdid === actualTashdid)) {
      setWords(ws => ws.map(o => o.id === w.id ? { ...o, closed: true, status: 'good' } : o)); setSolved(true);
      sound.playSuccess(); say('good', `${praise()} «${target.plain}» را درست ساختی.`, emojiText(target.emoji, '🎉')); onComplete('word', target.id);
      // خودکار ← کلمهٔ بعدی (کلمه‌های درس و پیشنهاد کلمه)
      window.clearTimeout(autoTimer.current); autoTimer.current = window.setTimeout(() => { if (modeRef.current === m0) next(); }, 2200);
    } else {
      setWords(ws => ws.map(o => o.id === w.id ? { ...o, status: 'bad' } : o));
      say('try', expectedTashdid && expectedTashdid !== actualTashdid
        ? 'تشدید را دقیقاً روی همان حرف بگذار و دوباره تلاش کن.'
        : `این «${plain}» شد. ${cheer()}`, '💪');
    }
  };

  /** آیا کلمهٔ فعلی، آخرین کلمهٔ فهرستِ همین بخش است؟ */
  const atLast = () => {
    const m = modeRef.current;
    if (m === 'lesson') return lessonList.length > 0 && targetIdx % lessonList.length === lessonList.length - 1;
    if (m === 'dictation') return dictList.length > 0 && dictIdx % dictList.length === dictList.length - 1;
    if (m === 'suggest') return suggestList.length > 0 && suggestIdx % suggestList.length === suggestList.length - 1;
    return false;
  };
  // بعد از آخرین کلمه: پیام «موفق شدی» به‌جای برگشتِ بی‌خبر به کلمهٔ اول
  const next = () => {
    window.clearTimeout(autoTimer.current);
    if (atLast()) { setRoundDone(true); return; }
    if (modeRef.current === 'lesson') setTargetIdx(i => i + 1); else if (modeRef.current === 'dictation') setDictIdx(i => i + 1); else setSuggestIdx(i => i + 1);
  };
  const playAgain = () => {
    setRoundDone(false);
    const m = modeRef.current;
    const idx = m === 'lesson' ? targetIdx : m === 'dictation' ? dictIdx : suggestIdx;
    if (idx % Math.max(1, m === 'lesson' ? lessonList.length : m === 'dictation' ? dictList.length : suggestList.length) === 0) { resetBoard(target, m); return; }
    if (m === 'lesson') setTargetIdx(0); else if (m === 'dictation') setDictIdx(0); else setSuggestIdx(0);
  };
  const roundTotal = mode === 'lesson' ? lessonList.length : mode === 'dictation' ? dictList.length : suggestList.length;
  const clearAll = () => { resetBoard(target, mode); sound.playPop(); };
  const revealedTarget = revealPeels >= REVEAL_PIECES;
  const revealTarget = () => {
    if (revealedTarget) {
      sound.speakPersian(speakable(target?.word || ''));
      return;
    }
    const nextPeels = Math.min(REVEAL_PIECES, revealPeels + 1);
    setRevealPeels(nextPeels);
    sound.playPop();
    if (nextPeels === REVEAL_PIECES && target) sound.speakPersian(speakable(target.word));
  };

  const renderDragGhost = () => {
    if (!drag) return null;
    if (drag.kind === 'word') return null;
    if (drag.kind === 'free' && !drag.moved) return null;
    return <span className="drag-ghost tahriri" style={{ left: drag.cx, top: drag.cy }}>{kidGlyph(parseToken(drag.token).glyph)}</span>;
  };

  const dragFreeId = drag?.kind === 'free' && drag.moved ? drag.id : null;
  useBackHandler(() => { if (guideOpen) { setGuideOpen(false); return; } if (islandOpen) { setIslandOpen(false); return; } if (dictChooser) { setDictChooser(false); return; } if (boxOpen) { setBoxOpen(false); return; } onBack(); });
  const dragWord = drag?.kind === 'word' && drag.moved ? drag : null;
  const boardRect = boardRef.current?.getBoundingClientRect();
  const hoverLine = !!drag && !!boardRect && drag.kind !== 'word' && onLine(drag.cy - boardRect.top);
  const hoverBlank = mode === 'dictation' && drag?.kind === 'new' && nearBlank(drag.cx, drag.cy);
  const targetNumber = mode === 'lesson'
    ? targetIdx % Math.max(1, lessonList.length) + 1
    : mode === 'dictation'
      ? dictIdx % Math.max(1, dictList.length) + 1
      : suggestIdx % Math.max(1, suggestList.length) + 1;

  return <main className="word-village" dir="rtl">
    <GameHeader kicker="دهکدهٔ دوم" title="کلمه‌نویسی" emoji="🧲" tone="mint" onBack={onBack} titleRef={titleRef} onTitleClick={() => { if (!islandOpen) { sound.playPop(); setIslandOpen(true); } }}>
      <LessonPicker compact />
    </GameHeader>
    <nav className="wv-modes">
      <button className={mode === 'lesson' ? 'active' : ''} onClick={() => { setMode('lesson'); sound.playPop(); }}>کلمه‌های درس</button>
      <button className={mode === 'suggest' || mode === 'dictation' ? 'active' : ''} onClick={() => { setDictChooser(true); sound.playPop(); }}>دیکته</button>
      <button className={mode === 'free' ? 'active' : ''} onClick={() => { setMode('free'); sound.playPop(); }}>نوشتن آزاد</button>
      <button className="wv-help-btn" onClick={() => { setBoxOpen(false); setDictChooser(false); setGuideOpen(true); sound.playPop(); }} aria-label="راهنما">؟</button>
    </nav>
    {dictChooser && <div className="dict-chooser-backdrop" onClick={() => setDictChooser(false)}>
      <section className="dict-chooser" onClick={e => e.stopPropagation()} aria-label="نوع دیکته">
        <b>دیکتهٔ شب</b>
        <button className={mode === 'suggest' ? 'active' : ''} onClick={() => { setMode('suggest'); setDictChooser(false); sound.playPop(); }}><span className="tahriri">کلمه</span><small>کلمهٔ کامل</small></button>
        <button className={mode === 'dictation' ? 'active' : ''} onClick={() => { setMode('dictation'); setDictChooser(false); sound.playPop(); }}><span className="tahriri">کلـ<i>..</i>ه</span><small>کلمهٔ ناقص</small></button>
      </section>
    </div>}

    {target && <section className="wv-target">
      <span className="wv-target-num">کلمهٔ {toFa(targetNumber)}</span>
      <span className="wv-target-emoji"><WordVisual value={target.emoji} word={target.word} /></span>
      <div>
        <button
          type="button"
          className={`wv-reveal-word ${revealedTarget ? 'revealed' : ''}`}
          onClick={revealTarget}
          aria-label={revealedTarget ? `کلمهٔ ${target.word}` : `کلمه پوشانده شده؛ ${REVEAL_PIECES - revealPeels} بار دیگر لمس کن`}
          title={revealedTarget ? 'شنیدن کلمه' : 'هر بار یک تکه از پوشش برداشته می‌شود'}
        >
          <span className="wv-reveal-text tahriri">{target.word}</span>
          {!revealedTarget && <span className="wv-tap-hint" aria-hidden="true">👆</span>}
          {!revealedTarget && <span className={`wv-censor peel-${revealPeels}`} aria-hidden="true">
            {Array.from({ length: REVEAL_PIECES }, (_, i) => <i key={i} className={i >= REVEAL_PIECES - revealPeels ? 'gone' : ''} style={{ '--peel-index': i } as React.CSSProperties} />)}
          </span>}
        </button>
      </div>
      <button className={`wv-next ${solved ? 'pulse' : ''}`} onClick={next}><RefreshCw /> کلمهٔ بعدی</button>
    </section>}
    {mode === 'lesson' && lessonOrder === 1 && <p className="wv-note">در درس ۱ هنوز کلمه‌ای نداریم؛ کلمه‌های درس ۲ (آب، بابا) نمایش داده می‌شوند.</p>}
    {mode === 'dictation' && !dictList.length && <p className="wv-note">برای این نشانه هنوز کلمه‌ای برای دیکته نداریم؛ «کلمه‌های درس» را تمرین کن.</p>}
    {mode === 'suggest' && !suggestList.length && <p className="wv-note">برای این نشانه هنوز کلمهٔ تازه‌ای بیرون از کتاب نداریم که فقط با حرف‌های خوانده‌شده نوشته شود؛ «کلمه‌های درس» را تمرین کن.</p>}
    {mode === 'free' && <p className="wv-note">هر کلمه‌ای دوست داری بساز؛ هر وقت کلمه‌ات تمام شد دکمهٔ «پایان» را بزن.</p>}

    <div ref={boardRef} className={`wv-board ${drag ? 'is-dragging' : ''} ${mode === 'dictation' ? 'dict-mode' : ''}`}>
      {mode === 'dictation' ? <div className="dict-stage">
        {dictItem && <>
          <span className="dict-emoji"><WordVisual value={dictItem.entry.emoji} word={dictItem.entry.word} /></span>
          {dictFilled
            ? <div className="dict-word tahriri solved" role="status" aria-label={`آفرین! ${dictItem.entry.word}`}>{dictItem.entry.word}</div>
            : <div className={`dict-word tahriri ${dictShake ? 'shake' : ''}`} aria-label="کلمه با یک جای خالی">
                {dictItem.before && <span className="dict-part">{dictItem.before}</span>}
                <span ref={blankRef} className={`dict-blank ${hoverBlank ? 'hot' : ''}`} aria-label="جای خالی">{'\u00A0'}</span>
                {dictItem.after && <span className="dict-part">{dictItem.after}</span>}
              </div>}
          <p className="dict-help">{dictFilled ? 'آفرین! کلمهٔ بعدی می‌آید…' : 'جعبهٔ حروف را باز کن، شکلِ درست را بردار و روی نقطه‌چین رها کن'}</p>
        </>}
      </div> : <>
      <div className="wv-park" style={{ height: parkH }}><span>جای حروف</span></div>
      <div className="wv-magnet" style={{ top: parkH }}><span>تختهٔ مغناطیسی</span></div>
      <div className={`wv-line ${hoverLine ? 'hot' : ''}`} style={{ top: lineY }} />
      <div className="wv-band" style={{ top: lineY - band, height: band * 2 }} />

      {free.map(p => p.id === dragFreeId ? null : <span key={p.id} className="wv-piece tahriri" style={{ left: p.x, top: p.y }} onPointerDown={e => startFree(e, p)}>{kidGlyph(parseToken(p.token).glyph)}</span>)}

      {words.map(w => {
        const defs = w.seq.map(s => parseToken(s.token));
        const moving = dragWord?.id === w.id && boardRect;
        const x = moving ? dragWord!.cx - boardRect!.left - dragWord!.ox : w.x;
        const y = moving ? dragWord!.cy - boardRect!.top - dragWord!.oy : lineY;
        return <div key={w.id} className={`wv-word ${w.closed ? 'closed' : ''} ${w.status || ''} ${shakeWord === w.id ? 'shake' : ''}`} style={{ right: size.w - x, top: y }}>
          <span ref={el => { if (el) wordRefs.current.set(w.id, el); else wordRefs.current.delete(w.id); }} className="tahriri wv-word-text" onPointerDown={e => startWord(e, w)}>{renderSequence(defs)}</span><button className="wv-word-speaker" onClick={e=>{e.stopPropagation();sound.speakWord(w.seq.map(s=>parseToken(s.token).glyph).join(''))}}><Volume2/></button>
          {!w.closed && <button className="wv-pop" onClick={() => popLast(w)} aria-label="برداشتن حرف آخر"><Undo2 /></button>}
        </div>;
      })}
      {!free.length && !words.length && <p className="wv-empty">{mode === 'lesson' ? '' : 'جعبهٔ حروف را باز کن و حرف‌ها را روی تخته بکش'}</p>}
      </>}
    </div>

    <footer className="wv-actions">
      {mode !== 'lesson' && <button className={`wv-chest-btn ${boxOpen ? 'open' : ''}`} onClick={() => { setBoxOpen(o => !o); setBoxKey(null); sound.playPop(); }} aria-label="جعبهٔ حروف"><img src="/assets/ui/letter-chest.svg" alt="" draggable={false} /><span>جعبهٔ حروف</span></button>}
      <button className="soft-btn" onClick={clearAll}><Eraser /> از اول</button>
      {mode === 'free' ? <button className="big-done" onClick={finish}><Flag /> پایان</button> : mode === 'dictation' ? null : <OkArt className="wv-ok" onClick={finish} />}
    </footer>

    {boxOpen && <div className="letter-box-backdrop" onClick={() => setBoxOpen(false)}>
      <section className="letter-box" onClick={e => e.stopPropagation()} aria-label="جعبه حروف">
        <header><img className="letter-box-chest" src="/assets/ui/letter-chest.svg" alt="" draggable={false} /><div><b>جعبهٔ حروف</b><small>روی یک نشانه بزن، بعد شکلش را روی تخته بکش</small></div><CloseArt className="box-close" onClick={() => setBoxOpen(false)} /></header>
        {boxKey && <div className="box-forms" dir="rtl" style={{ '--box-anchor': `${boxAnchor ?? 50}%` } as React.CSSProperties}>
          {/* ترتیب شکل‌ها از راست به چپ مثل انتخاب درس: هـ ـهـ ـه ه */}
          {LETTER_BOX.find(k => k.id === boxKey)!.pieces.map(t => <span key={t} className="box-form tahriri" onPointerDown={e => startNew(e, t)}>{kidGlyph(parseToken(t).glyph)}</span>)}
          {LETTER_BOX.find(k => k.id === boxKey)!.hint && <small className="box-form-hint">{LETTER_BOX.find(k => k.id === boxKey)!.hint}</small>}
        </div>}
        <div className="box-keys">
          {LETTER_BOX.map(k => <button key={k.id} className={`box-key tahriri ${boxKey === k.id ? 'active' : ''} ${k.lesson > lessonOrder ? 'later' : 'read'} ${mode === 'dictation' ? 'dict' : ''}`} onClick={e => {
            const parent = e.currentTarget.closest('.letter-box')?.getBoundingClientRect();
            const rect = e.currentTarget.getBoundingClientRect();
            setBoxAnchor(parent ? ((rect.left + rect.width / 2 - parent.left) / parent.width * 100) : 50);
            setBoxKey(k.id); sound.playPop();
          }}>
            {k.label ? <span className="box-key-label">{k.label}</span> : <span className="box-key-forms">{k.pieces.map(t => <span key={t}>{kidGlyph(parseToken(t).glyph)}</span>)}</span>}
          </button>)}
        </div>
      </section>
    </div>}
    <ScoreIsland open={islandOpen} anchor={titleRef} session={session} total={stars} onClose={closeIsland} />
    {renderDragGhost()}
    <FeedbackToast state={fb} onClose={() => setFb(null)} ms={3800} />
    <WordVillageGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    <RoundComplete open={roundDone && mode !== 'free'} text={`همهٔ ${toFa(roundTotal)} کلمهٔ ${mode === 'lesson' ? 'این درس' : 'این دیکته'} را نوشتی.`} onAgain={playAgain} />
  </main>;
};
