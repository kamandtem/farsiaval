import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { CURRICULUM, CurriculumLesson, bookLessonOf, kidDisplay } from '../data/curriculum';
import { boardLessonWords, WORD_BANK, emojiText, hasRealEmoji } from '../data/wordBank';
import { WordPic } from './shared/WordPic';
import { lessonOfWord, plainWord } from '../utils/pieces';
import { parseSyllables, ParsedWord, SoundCell, SOUND_ONLY_UNTIL_BOOK, SYLLABLE_EXCEPTION_WORDS, SYLLABLE_EXCLUDED_WORDS, SYLLABLE_WORDS } from '../utils/syllables';
import { sound } from '../utils/audio';
import { shuffle, toFa } from '../utils/lessonState';
import { vibrate } from '../utils/native';
import { FeedbackState, FeedbackToast, praise } from './shared/Feedback';
import { RoundComplete } from './shared/RoundComplete';
import { SignText } from './shared/SignText';

/**
 * بازی پنجم دهکدهٔ اول: «بخش‌بخش کن» (هجا و صدا) — مثل جدول‌های صفحهٔ ۴۸، ۵۰، ۵۵ و ۶۴ کتاب نگارش اول.
 * طبقهٔ اول: خود کلمه (حرف‌ها لمسی‌اند) ← با کشیدن انگشت چند حرف را انتخاب کن و در طبقهٔ دوم بگذار.
 * طبقهٔ دوم: به تعداد بخش‌های کلمه خانه دارد. طبقهٔ سوم: هر خانه فقط یک حرف/صدا می‌گیرد؛ اعراب خانهٔ خط‌تیره‌دار دارد.
 * درس‌های ۱ تا ۳ کتاب فقط «صداهای هر کلمه» را جدا می‌کنند (گردی‌ها، مثل صفحهٔ ۲۸، ۳۴، ۴۰ و ۴۳).
 */

const speakable = (s: string) => s.replace(/[\u064B-\u0652\u200D\u0640]/g, '');
const emojiOf = (w: string) => WORD_BANK.find(e => e.plain === plainWord(w))?.emoji
  || [18, 26, 30].flatMap(o => boardLessonWords(o)).find(e => e.plain === plainWord(w))?.emoji || '';

/** ۳ تا ۴ واژه برای درس انتخاب‌شده؛ فقط واژه‌هایی که همهٔ نشانه‌هایشان خوانده شده */
export function syllableWordsFor(order: number): string[] {
  const o = Math.max(1, order);
  if (SYLLABLE_EXCEPTION_WORDS[o]) return SYLLABLE_EXCEPTION_WORDS[o];
  const book = bookLessonOf(o);
  const out: string[] = [];
  const add = (w: string) => {
    if (out.length >= 5 || out.includes(w) || SYLLABLE_EXCLUDED_WORDS.has(w) || lessonOfWord(w) > o) return;
    try { parseSyllables(w); } catch { return; }
    out.push(w);
  };
  // اول واژه‌های خودِ نشانهٔ انتخاب‌شده را می‌آوریم. این جلوی افتادن درس‌هایی مثل «گـ گ»
  // روی فهرست درس قبلی (پـ پ) را می‌گیرد.
  (CURRICULUM[o - 1]?.likeWords || []).forEach(w => add(w.word));
  boardLessonWords(o).forEach(w => add(w.word));
  for (let b = book; b >= 1 && out.length < 5; b--) {
    (SYLLABLE_WORDS[b] || []).forEach(add);
  }
  if (out.length < 4) WORD_BANK.filter(w => w.lesson <= o).forEach(w => add(w.word));
  return out.slice(0, 5).length >= 4 ? out.slice(0, 5) : (out.length ? out : ['آب', 'بابا', 'با', 'باد']);
}

type CombinationVowel = { id: string; lesson: number; forms: string[] };
type CombinationConsonant = { id: string; lesson: number; form: string; name: string };

/** جدول ترکیبات مقدماتی کتاب: مصوت‌ها افقی، صامت‌های خوانده‌شده عمودی. */
const COMBINATION_VOWELS: CombinationVowel[] = [
  { id: 'aa', lesson: 1, forms: ['آ', 'ا'] },
  { id: 'a', lesson: 3, forms: ['اَ', 'ـَ'] },
  { id: 'e', lesson: 13, forms: ['اِ', 'ـِ', 'ـه', 'ه'] },
  { id: 'o', lesson: 16, forms: ['اُ', 'ـُ'] },
  { id: 'ou', lesson: 7, forms: ['او', 'و'] },
  { id: 'ey', lesson: 11, forms: ['ایـ', 'یـ', 'ی'] },
];

const COMBINATION_CONSONANTS: CombinationConsonant[] = [
  { id: 'be', lesson: 2, form: 'بـ', name: 'ب' },
  { id: 'dal', lesson: 4, form: 'د', name: 'د' },
  { id: 'mim', lesson: 5, form: 'مـ', name: 'م' },
  { id: 'sin', lesson: 6, form: 'سـ', name: 'س' },
  { id: 'te', lesson: 8, form: 'تـ', name: 'ت' },
  { id: 're', lesson: 9, form: 'ر', name: 'ر' },
  { id: 'noon', lesson: 10, form: 'نـ', name: 'ن' },
  { id: 'ze', lesson: 12, form: 'ز', name: 'ز' },
  { id: 'shin', lesson: 14, form: 'شـ', name: 'ش' },
  { id: 'kaf', lesson: 17, form: 'کـ', name: 'ک' },
  { id: 'pe', lesson: 19, form: 'پـ', name: 'پ' },
];

const ZWJ_C = '\u200D';
/** حروفی که در کتاب شکل میانیِ ویژه دارند و در ردیف آخر با همان شکل میانی (ـهـ ـعـ ـغـ) نوشته می‌شوند */
const OWN_MIDDLE = new Set(['ه', 'ع', 'غ']);
/**
 * شکل هر صدا در طبقهٔ سوم (و در مهره‌های طبقهٔ دوم)، مطابق نوشتار کلمه ولی بدون اتصال به حرف قبل:
 * زنگ ← ز نـ گ ، سمند ← سـ مـ نـ د (نه سـ ـمـ ـنـ د). حرف آخر شکل تنها دارد.
 * فقط «ه ع غ» که شکل میانیِ مستقل دارند، اتصال قبلی را نگه می‌دارند (ـهـ ـعـ ـغـ).
 */
const soundGlyph = (c: SoundCell) => {
  if (c.mark) return `ـ${c.text}`;
  const base = [...c.text].filter(ch => !/[\u064B-\u0652]/.test(ch)).pop() || c.text;
  const g = OWN_MIDDLE.has(base) ? c.glyph : c.glyph.replace(/^\u200D/, '');
  return kidDisplay(g);
};

/** مسیرهای اعراب (فتحه، کسره، ضمه) از خود فونت تحریری؛ برای نشاندن دقیق روی/زیر حرف، مستقل از موتور شکل‌دهی گوشی */
const MARK_SVG: Record<string, { box: string; d: string; w: number; h: number }> = {
  '\u064E': { box: '-81 -180 163 156', w: 163, h: 156, d: 'M75 158Q41 116 9.5 84.5Q-22 53 -53 32Q-67 24 -74 24Q-81 24 -81 29Q-81 38 -69 47Q-40 69 -10.5 97.5Q19 126 50 164Q66 180 75 180Q82 180 82 173Q82 166 75 158Z' },
  '\u0650': { box: '-81 24 163 156', w: 163, h: 156, d: 'M75 -46Q7 -134 -53 -172Q-67 -180 -74 -180Q-81 -180 -81 -175Q-81 -169 -69 -157Q-40 -135 -10.5 -106.5Q19 -78 50 -42Q65 -24 75 -24Q82 -24 82 -31Q82 -40 75 -46Z' },
  '\u064F': { box: '-65 -189 120 166', w: 120, h: 166, d: 'M53 167Q55 157 55 150Q55 113 12 69Q-26 31 -54 24Q-65 21 -65 28Q-65 35 -57 41Q-49 46 -42.0 51.5Q-35 57 -27 62Q-17 70 -8.5 79.0Q0 88 8 99Q-33 99 -33 134Q-33 155 -19.5 172.0Q-6 189 14 189Q47 189 53 167ZM30 150Q27 162 12 162Q-11 162 -11 143Q-11 119 10 119Q14 119 17 120Q31 123 31 143Q31 147 30 150Z' },
};
/** بلندی بالا/پایینِ هر صامت از خط کرسی (بر حسب em، اندازه‌گیری‌شده از فونت) برای جای اعراب */
const LETTER_TOP: Record<string, number> = { 'ب': .17, 'د': .31, 'م': .24, 'س': .27, 'ت': .46, 'ر': .32, 'ن': .44, 'ز': .52, 'ش': .56, 'ک': 1.03, 'پ': .17 };
const LETTER_BOTTOM: Record<string, number> = { 'ب': .2, 'پ': .3, 'ر': .12, 'ز': .12 };
/** ترکیب صامت + اعراب: حرف با شکل خود فونت، اعراب جداگانه دقیقاً بالای حرف (فتحه/ضمه) یا زیرش (کسره) */
const MarkedLetter: React.FC<{ letter: string; glyph: string; mark: string }> = ({ letter, glyph, mark }) => {
  const m = MARK_SVG[mark];
  const below = mark === '\u0650';
  const scale = 1.35; // کمی درشت‌تر از اندازهٔ فونت تا کودک اعراب را واضح ببیند
  const h = (m.h / 1000) * scale, w = (m.w / 1000) * scale;
  // در این جعبه (line-height: 1) خط کرسی ۰٫۷۵em پایین‌تر از لبهٔ بالاست (ascent 1.5 / descent 1.0)
  const top = below ? 0.75 + (LETTER_BOTTOM[letter] ?? 0.05) + 0.1 : 0.75 - (LETTER_TOP[letter] ?? 0.4) - 0.1 - h;
  return <span className="combo-stack">
    <span className="combo-base">{glyph}</span>
    <svg className="combo-mark" viewBox={m.box} style={{ top: `${top}em`, width: `${w}em`, height: `${h}em` }} aria-hidden="true">
      <path d={m.d} transform="scale(1,-1)" />
    </svg>
  </span>;
};
const combinationText = (consonant: CombinationConsonant, vowel: CombinationVowel, form: string) => {
  // ترکیب با شکل پیوستهٔ خود فونت نوشته می‌شود (بدون کشیده): «با»، «بو»، «بی».
  // برای اعراب، حرکت مستقیم روی خود حرف می‌نشیند و ZWJ بعد از آن می‌آید تا شکل آغازی بماند: «بَـ» نه «بـِ».
  const c = consonant.name;
  const joins = consonant.form.endsWith('ـ');
  const withMark = (m: string) => joins ? `${c}${m}${ZWJ_C}` : `${c}${m}`;
  if (vowel.id === 'aa') return `${c}ا`;
  if (vowel.id === 'ou') return `${c}و`;
  if (vowel.id === 'ey') return `${c}ی`;
  if (vowel.id === 'e' && (form === 'ـه' || form === 'ه')) return `${c}ه`;
  if (vowel.id === 'a') return withMark('\u064E');
  if (vowel.id === 'e') return withMark('\u0650');
  if (vowel.id === 'o') return withMark('\u064F');
  return `${c}${form.replace(/ـ/g, '')}`;
};

/** نمایش ترکیب؛ اگر اعراب دارد، اعراب جدا روی/زیر حرف نشانده می‌شود تا هیچ‌وقت جابه‌جا (مثلاً فتحه زیر «سـ») نیفتد */
const combinationView = (text: string, consonant: CombinationConsonant | null, vowel: { group: CombinationVowel; form: string } | null) => {
  const mark = [...text].find(ch => ch === '\u064E' || ch === '\u0650' || ch === '\u064F');
  if (!mark || !consonant || !vowel) return kidDisplay(text);
  const c = consonant.name;
  const glyph = consonant.form.endsWith('ـ') ? kidDisplay(`${c}${ZWJ_C}`) : c; // شکل آغازیِ خود فونت، بدون کشیده
  return <MarkedLetter letter={c} glyph={glyph} mark={mark} />;
};

type Chip = { id: string; cell: SoundCell; used: boolean };
type Drag = { kind: 'sel' | 'chip'; chipId?: string; x: number; y: number; sx: number; sy: number; moved: boolean; label: string } | null;
type UnitBox = { left: number; top: number; width: number; height: number };

/** کلمهٔ طبقهٔ اول به صورت یک متن کامل و خوانا دیده می‌شود؛ لایه‌های نامرئی روی هر حرف، انتخاب با کشیدن را ممکن می‌کنند. */
const SelectableWord: React.FC<{
  parsed: ParsedWord;
  usedUnits: Set<number>;
  sel: { a: number; b: number } | null;
  /** تابعی که از روی مختصات افقی لمس، شمارهٔ هجای زیر انگشت را برمی‌گرداند */
  zoneRef: React.MutableRefObject<((clientX: number) => number | null) | null>;
}> = ({ parsed, usedUnits, sel, zoneRef }) => {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [boxes, setBoxes] = useState<UnitBox[]>([]);
  const [fontPx, setFontPx] = useState<number | null>(null);

  /* کلمه خوانا ولی کمی کوچک‌تر از عرض ردیف نوشته می‌شود (۴۴ تا ۱۱۶px) تا سرکشِ «ک» و «گ» کامل دیده شود.
     ارتفاع ردیف هم در نظر گرفته می‌شود: فونت تحریری سرکش را تا حدود ۱٫۲em بالای خط کرسی می‌برد. */
  useLayoutEffect(() => {
    const wrap = wrapRef.current, textEl = textRef.current;
    const row = wrap?.parentElement;
    if (!wrap || !textEl || !row) return;
    let alive = true;
    const fit = () => {
      if (!alive) return;
      const cs = getComputedStyle(row);
      const avail = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 8;
      const probe = 100;
      const prev = textEl.style.fontSize;
      textEl.style.fontSize = `${probe}px`;
      const w = textEl.getBoundingClientRect().width;
      textEl.style.fontSize = prev;
      if (!w || avail <= 0) return;
      const px = Math.max(44, Math.min(116, Math.floor(probe * avail * 0.78 / w)));
      setFontPx(old => (old === px ? old : px));
    };
    fit();
    try { document.fonts.load('100px "Tahriri"', parsed.word).then(fit).catch(() => undefined); } catch { /* ignore */ }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(row);
    return () => { alive = false; ro?.disconnect(); };
  }, [parsed]);

  /* انتخاب خودکار هجا: کلمه به ناحیه‌های افقی تقسیم می‌شود (راست = هجای اول). مرز هر ناحیه وسطِ مرکز دو هجای کنار هم است.
     اگر اندازه‌گیری حروف به‌خاطر ادغام حروف نامعتبر بود، کلمه به تعداد هجاها مساوی تقسیم می‌شود. */
  zoneRef.current = (clientX: number) => {
    const textEl = textRef.current, wrap = wrapRef.current;
    const n = parsed.syllables.length;
    if (!textEl || !wrap || !n) return null;
    if (n === 1) return 0;
    const base = wrap.getBoundingClientRect();
    const tr = textEl.getBoundingClientRect();
    const x = clientX - base.left;
    let centers = parsed.syllables.map(sy => {
      const bs = sy.units.map(u => boxes[parsed.units.findIndex(t => t.index === u)]).filter(Boolean) as UnitBox[];
      if (!bs.length) return NaN;
      const l = Math.min(...bs.map(b => b.left)), r = Math.max(...bs.map(b => b.left + b.width));
      return (l + r) / 2;
    });
    const ok = centers.every((c, i) => Number.isFinite(c) && (i === 0 || c < centers[i - 1] - 6));
    if (!ok) {
      const left = tr.left - base.left, w = tr.width / n;
      centers = parsed.syllables.map((_, i) => left + tr.width - w * (i + 0.5));
    }
    let best = 0;
    centers.forEach((c, i) => { if (Math.abs(x - c) < Math.abs(x - centers[best])) best = i; });
    return best;
  };

  useLayoutEffect(() => {
    const wrap = wrapRef.current, textEl = textRef.current;
    const node = textEl?.firstChild;
    if (!wrap || !textEl || !node) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const base = wrap.getBoundingClientRect();
      const next: UnitBox[] = [];
      for (const unit of parsed.units) {
        const start = Math.min(...unit.cells.map(c => c.i));
        const end = Math.max(...unit.cells.map(c => c.i)) + 1;
        const range = document.createRange();
        try { range.setStart(node, start); range.setEnd(node, end); } catch { continue; }
        const rects = Array.from(range.getClientRects()).filter(r => r.width > 0 || r.height > 0);
        if (!rects.length) continue;
        const left = Math.min(...rects.map(r => r.left));
        const top = Math.min(...rects.map(r => r.top));
        const right = Math.max(...rects.map(r => r.right));
        const bottom = Math.max(...rects.map(r => r.bottom));
        next.push({ left: left - base.left - 3, top: top - base.top - 5, width: right - left + 6, height: bottom - top + 10 });
      }
      if (next.length !== parsed.units.length) {
        const r = textEl.getBoundingClientRect();
        const w = r.width / Math.max(1, parsed.units.length);
        setBoxes(parsed.units.map((_, i) => ({ left: r.width - (i + 1) * w, top: 0, width: w, height: r.height })));
      } else setBoxes(next);
    };
    measure();
    try { document.fonts.load('80px "Tahriri"', parsed.word).then(measure).catch(() => undefined); } catch { /* ignore */ }
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer) observer.observe(wrap);
    window.addEventListener('resize', measure);
    return () => { alive = false; observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [parsed, fontPx]);

  return <span ref={wrapRef} className="syl-word-select" dir="rtl" style={fontPx ? { fontSize: fontPx } : undefined}>
    <span ref={textRef} className="syl-word-visible tahriri">{parsed.word}</span>
    {boxes.map((box, i) => {
      const unit = parsed.units[i];
      if (!unit) return null;
      const used = usedUnits.has(unit.index);
      return <span key={unit.index} aria-hidden="true"
        className={`syl-unit-hit ${used ? 'used' : ''} ${sel && unit.index >= sel.a && unit.index <= sel.b ? 'sel' : ''}`}
        style={{ left: box.left, top: box.top, width: box.width, height: box.height, pointerEvents: 'none' }} />;
    })}
  </span>;
};

export const SyllableGame: React.FC<{ lesson: CurriculumLesson; onDone: () => void }> = ({ lesson, onDone }) => {
  const [section, setSection] = useState<'syllable' | 'combination'>('syllable');
  const combinationVowels = useMemo(() => COMBINATION_VOWELS.filter(v => v.lesson <= Math.min(lesson.order, 19)), [lesson.order]);
  const combinationConsonants = useMemo(() => COMBINATION_CONSONANTS.filter(c => c.lesson <= Math.min(lesson.order, 19)), [lesson.order]);
  const [selectedConsonant, setSelectedConsonant] = useState<CombinationConsonant | null>(null);
  const [selectedVowel, setSelectedVowel] = useState<{ group: CombinationVowel; form: string } | null>(null);
  const [combination, setCombination] = useState('');
  const [combinationNonce, setCombinationNonce] = useState(0);
  const [showHint, setShowHint] = useState(() => {
    try { return localStorage.getItem('alefba_syllable_hint_closed_v1') !== '1'; } catch { return true; }
  });
  const words = useMemo(() => syllableWordsFor(lesson.order), [lesson.order]);
  const soundOnly = bookLessonOf(Math.max(1, lesson.order)) <= SOUND_ONLY_UNTIL_BOOK;
  const [idx, setIdx] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const word = words[idx % words.length];
  const parsed: ParsedWord = useMemo(() => parseSyllables(word), [word]);
  const N = parsed.cells.length;

  const [stage, setStage] = useState<1 | 2 | 3>(soundOnly ? 2 : 1); // ۱: بخش‌ها ، ۲: صداها ، ۳: تمام
  const [sylDone, setSylDone] = useState<boolean[]>([]);
  const [sel, setSel] = useState<{ a: number; b: number } | null>(null);
  const [filled, setFilled] = useState<(SoundCell | null)[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const swipe = useRef<{ anchor: number } | null>(null);
  const zoneRef = useRef<((clientX: number) => number | null) | null>(null);
  const timer = useRef(0);
  const usedUnits = useMemo(() => { const s = new Set<number>(); parsed.syllables.forEach((sy, k) => { if (sylDone[k]) sy.units.forEach(u => s.add(u)); }); return s; }, [parsed, sylDone]);

  const makeChips = useCallback((p: ParsedWord) => {
    const groups = soundOnly ? [p.cells] : p.syllables.map(s => s.cells);
    return groups.flatMap(g => { let s = shuffle(g); if (g.length > 1 && s.every((c, i) => c.i === g[i].i)) s = [...s].reverse(); return s.map(cell => ({ id: `${cell.i}-${Math.random().toString(36).slice(2, 6)}`, cell, used: false })); });
  }, [soundOnly]);

  // شروع هر کلمه
  useEffect(() => {
    window.clearTimeout(timer.current);
    setStage(soundOnly ? 2 : 1); setSylDone(parsed.syllables.map(() => false)); setSel(null); setPicked(null);
    setFilled(parsed.cells.map(() => null)); setChips(makeChips(parsed));
    // صدای خود کلمه خودکار پخش نمی‌شود؛ فقط راهنمای کلی
    sound.speakPersian(soundOnly ? 'صداهای این کلمه را جدا کن' : 'این کلمه را بخش بخش کن');
  }, [word, parsed, soundOnly, makeChips]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const nudge = (text: string, key?: string, emoji = '🙈') => {
    vibrate(60); setFb({ tone: 'try', text, emoji }); sound.speakPersian(speakable(text.replace(/«[^»]*»/g, '')));
    if (key) { setShake(key); window.setTimeout(() => setShake(null), 600); }
  };
  // بعد از کلمهٔ آخر: پیام «موفق شدی»؛ دوباره از اول فقط با دکمهٔ «یک دور دیگر»
  const goNext = useCallback(() => {
    window.clearTimeout(timer.current);
    if (idx % words.length === words.length - 1) { setRoundDone(true); return; }
    setIdx(i => i + 1);
  }, [idx, words.length]);

  const chooseConsonant = (consonant: CombinationConsonant) => {
    setSelectedConsonant(consonant);
    if (selectedVowel) {
      setCombination(combinationText(consonant, selectedVowel.group, selectedVowel.form));
      setCombinationNonce(n => n + 1);
      sound.playSnap();
    } else sound.playPop();
  };
  const chooseVowel = (group: CombinationVowel, form: string) => {
    setSelectedVowel({ group, form });
    if (selectedConsonant) {
      setCombination(combinationText(selectedConsonant, group, form));
      setCombinationNonce(n => n + 1);
      sound.playSnap();
    } else sound.playPop();
  };
  const clearCombination = () => {
    setSelectedConsonant(null);
    setSelectedVowel(null);
    setCombination('');
    sound.playPop();
  };

  const finishWord = () => {
    setStage(3); sound.playSuccess(); const p = praise();
    const last = (idx % words.length) === words.length - 1;
    setFb({ tone: 'good', text: last ? `${p} همهٔ کلمه‌های این درس را ${soundOnly ? 'صدا به صدا جدا کردی' : 'بخش‌بخش کردی'}!` : `${p} «${speakable(word)}» را درست ${soundOnly ? 'جدا کردی' : 'بخش کردی'}.`, emoji: emojiText(emojiOf(word), '🌟') });
    sound.speakPersian(p); onDone();
    timer.current = window.setTimeout(goNext, 2000); // خودکار ← کلمهٔ بعد (یا پیام پایان بعد از کلمهٔ آخر)
  };

  /* ---------------- طبقهٔ اول ← دوم: انتخاب چند حرف و گذاشتن در خانهٔ بخش ---------------- */
  const rangeFree = (a: number, b: number) => { for (let u = Math.min(a, b); u <= Math.max(a, b); u++) if (usedUnits.has(u)) return false; return true; };
  const sylRange = (k: number) => { const u = parsed.syllables[k].units; return { a: Math.min(...u), b: Math.max(...u) }; };
  /** هجای زیر انگشت؛ اگر آن هجا قبلاً در جدول گذاشته شده، نزدیک‌ترین هجای آزاد */
  const sylAt = (x: number) => {
    const k = zoneRef.current?.(x); if (k == null) return null;
    if (!sylDone[k]) return k;
    let best: number | null = null;
    parsed.syllables.forEach((_, i) => { if (!sylDone[i] && (best === null || Math.abs(i - k) < Math.abs(best - k))) best = i; });
    return best;
  };
  const dropAt = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest('[data-drop]') as HTMLElement | null;

  /* لمس هر جای طبقهٔ اول: هجای همان ناحیه خودکار انتخاب می‌شود (اول/وسط/آخر کلمه) */
  const rowDown = (e: React.PointerEvent) => {
    if (stage !== 1) return;
    const k = sylAt(e.clientX); if (k === null) return;
    e.preventDefault();
    const { a, b } = sylRange(k);
    if (sel && a >= sel.a && b <= sel.b) { // کشیدن گروه انتخاب‌شده به سمت طبقهٔ دوم
      setDrag({ kind: 'sel', x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, label: parsed.units.slice(sel.a, sel.b + 1).map(x => x.glyph).join('') });
      return;
    }
    sound.playPop();
    setSel({ a, b }); swipe.current = { anchor: k };
  };
  useEffect(() => {
    if (stage !== 1) return;
    const move = (e: PointerEvent) => {
      if (!swipe.current) return;
      // کشیدن انگشت روی کلمه: هجاهای بعدی/قبلی هم به انتخاب اضافه می‌شوند (کامل، نه حرف‌به‌حرف)
      const k = zoneRef.current?.(e.clientX); const k0 = swipe.current.anchor;
      if (k == null) return;
      const r0 = sylRange(Math.min(k, k0)), r1 = sylRange(Math.max(k, k0));
      const n = { a: r0.a, b: r1.b };
      if (!rangeFree(n.a, n.b)) return;
      setSel(s => { if (s && s.a === n.a && s.b === n.b) return s; sound.playPop(); return n; });
    };
    const up = () => { swipe.current = null; };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }); // eslint-disable-line

  const placeSyllable = (k: number) => {
    if (stage !== 1 || sylDone[k]) { if (sylDone[k]) sound.speakPersian(speakable(parsed.syllables[k].plain)); return; }
    if (!sel) { nudge('اول با انگشت روی حرف‌های یک بخش در طبقهٔ اول دست بکش.', undefined, '👆'); return; }
    const need = parsed.syllables[k].units; const got: number[] = []; for (let u = sel.a; u <= sel.b; u++) got.push(u);
    const same = need.length === got.length && need.every((u, i) => u === got[i]);
    if (!same) {
      const inside = got.every(u => need.includes(u));
      if (inside) nudge(`هنوز همهٔ حرف‌های بخش ${toFa(k + 1)} را برنداشتی.`, `syl-${k}`, '✏️');
      else if (need.every(u => got.includes(u))) nudge('زیادی حرف برداشتی! فقط حرف‌های همین بخش را بردار.', `syl-${k}`);
      else if (need[0] > got[got.length - 1] || need[need.length - 1] < got[0]) nudge(`این حرف‌ها مال بخش ${toFa(k + 1)} نیستند؛ خانهٔ دیگری را امتحان کن.`, `syl-${k}`);
      else nudge('این بخش درست نیست. کلمه را آرام بخوان و دوباره انتخاب کن.', `syl-${k}`);
      return;
    }
    const n = sylDone.map((d, i) => d || i === k); setSylDone(n); setSel(null); sound.playSnap();
    sound.speakPersian(speakable(parsed.syllables[k].plain));
    if (n.every(Boolean)) { window.setTimeout(() => { setStage(2); sound.speakPersian('حالا حرف‌های هر بخش را یکی یکی در خانه‌ها بگذار'); }, 700); }
  };

  /* ---------------- طبقهٔ دوم ← سوم: هر خانه فقط یک حرف ---------------- */
  const placeChip = (chipId: string, j: number) => {
    const chip = chips.find(c => c.id === chipId); if (!chip || chip.used) return;
    const target = parsed.cells[j];
    if (filled[j]) { nudge('هر خانه فقط یک حرف می‌گیرد؛ این خانه پُر است.', `cell-${j}`, '✋'); return; }
    if (!soundOnly && target.syl !== chip.cell.syl) { nudge(`این حرف مال بخش ${toFa(chip.cell.syl + 1)} است؛ آن را زیر همان بخش بگذار.`, `cell-${j}`); return; }
    if (target.key !== chip.cell.key) { nudge(target.mark ? 'روی خطِ تیره فقط اعراب (ـَ ـِ ـُ) می‌نشیند.' : chip.cell.mark ? 'اعراب را روی خانهٔ خط‌تیره‌دار بگذار.' : 'این‌جا جای این حرف نیست. به ترتیب صداها دقت کن.', `cell-${j}`); return; }
    const nf = filled.map((f, i) => i === j ? target : f); setFilled(nf);
    setChips(cs => cs.map(c => c.id === chipId ? { ...c, used: true } : c)); setPicked(null); sound.playSnap();
    sound.speakPersian(target.mark ? (target.text === '\u064E' ? 'اَ' : target.text === '\u0650' ? 'اِ' : 'اُ') : speakable(target.text));
    if (nf.every(Boolean)) finishWord();
  };
  const cellTap = (j: number) => { if (stage !== 2) return; if (!picked) { if (!filled[j]) nudge('اول یک حرف از بالا انتخاب کن.', undefined, '👆'); return; } placeChip(picked, j); };
  const chipDown = (e: React.PointerEvent, c: Chip) => {
    if (stage !== 2 || c.used) return; e.preventDefault(); sound.playPop();
    setPicked(c.id); setDrag({ kind: 'chip', chipId: c.id, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, label: soundGlyph(c.cell) });
  };

  // کشیدن و رها کردن (گروه حروف یا یک حرف)
  useLayoutEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag(d => d ? { ...d, x: e.clientX, y: e.clientY, moved: d.moved || Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 8 } : d);
    const up = (e: PointerEvent) => {
      const d = drag; setDrag(null); if (!d) return;
      if (!d.moved) { if (d.kind === 'sel') setSel(null); return; }
      const el = dropAt(e.clientX, e.clientY); if (!el) return;
      const [kind, n] = (el.dataset.drop || '').split(':');
      if (d.kind === 'sel' && kind === 'syl') placeSyllable(Number(n));
      if (d.kind === 'chip' && kind === 'cell' && d.chipId) placeChip(d.chipId, Number(n));
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }); // eslint-disable-line

  const restart = () => { window.clearTimeout(timer.current); setStage(soundOnly ? 2 : 1); setSylDone(parsed.syllables.map(() => false)); setSel(null); setPicked(null); setFilled(parsed.cells.map(() => null)); setChips(makeChips(parsed)); sound.playPop(); };

  const hint = stage === 3 ? ((idx % words.length) === words.length - 1 ? 'آفرین! همهٔ کلمه‌ها تمام شد.' : 'آفرین! کلمهٔ بعدی می‌آید…')
    : soundOnly ? 'صداهای کلمه را یکی‌یکی از جعبه بردار و به ترتیب در گردی‌ها بگذار.'
    : stage === 1 ? 'با انگشت روی حرف‌های یک بخش دست بکش، بعد آن را در خانهٔ همان بخش در طبقهٔ دوم بگذار.'
    : 'حرف‌های هر بخش را یکی‌یکی بردار و در خانه‌های طبقهٔ سوم بگذار. هر خانه فقط یک حرف!';
  const cellGlyph = (c: SoundCell) => soundGlyph(c);

  const cellView = (c: SoundCell, j: number, extra = '') => {
    const f = filled[j];
    return <button key={`c${j}`} data-drop={`cell:${j}`} onClick={() => cellTap(j)}
      className={`syl-cell ${extra} ${c.mark ? 'is-mark' : ''} ${f ? 'filled' : ''} ${shake === `cell-${j}` ? 'shake' : ''} ${stage === 2 && picked && !f ? 'ready' : ''}`}
      style={soundOnly ? undefined : { gridColumn: 'span 1' }} aria-label={f ? speakable(f.text) : 'خانهٔ خالی'}>
      {f ? <span className="tahriri">{cellGlyph(f)}</span> : c.mark ? <i className="syl-dash" aria-hidden="true" /> : <i className="syl-line" aria-hidden="true" />}
    </button>;
  };

  return <div className="mini-game syl-game">
    <div className="syl-top">
      <span className="syl-count">{section === 'combination' ? 'ترکیب صامت و مصوت' : soundOnly ? 'صداهای هر کلمه' : 'بخش‌بخش کن'}{section === 'syllable' && ` · کلمهٔ ${toFa(idx % words.length + 1)} از ${toFa(words.length)}`}</span>
    </div>
    <nav className="syl-section-switch" aria-label="بخش‌های بازی پنجم">
      <button className={section === 'syllable' ? 'active' : ''} onClick={() => { setSection('syllable'); sound.playPop(); }}>بخش‌بخش کردن</button>
      <button className={section === 'combination' ? 'active' : ''} onClick={() => { setSection('combination'); sound.playPop(); }}>ترکیبات</button>
    </nav>
    {section === 'syllable' && showHint && <div className="syl-hint">
      <span>{hint}</span>
      <button type="button" aria-label="بستن راهنما" onClick={() => {
        setShowHint(false);
        try { localStorage.setItem('alefba_syllable_hint_closed_v1', '1'); } catch { /* ignore */ }
      }}>×</button>
    </div>}

    {section === 'combination' ? <section className="combination-game" aria-label="بخش ترکیبات">
      <div className="combination-caption">
        <b>با این چی می‌شود؟</b>
        <span>اول یک صامت، بعد یک مصوت را انتخاب کن.</span>
        <small>این تمرین تا درس «پـ پ» ادامه دارد.</small>
      </div>
      <div className="combination-vowel-rail" aria-label="مصوت‌ها">
        {combinationVowels.map(group => <div key={group.id} className="combination-vowel-group">
          <span className="combination-group-label"><SignText text={group.forms} /></span>
          <div className="combination-vowel-forms">
            {group.forms.map(form => <button key={`${group.id}-${form}`} className={`combination-vowel ${selectedVowel?.group.id === group.id && selectedVowel.form === form ? 'selected' : ''}`} onClick={() => chooseVowel(group, form)}>{kidDisplay(form)}</button>)}
          </div>
        </div>)}
      </div>
      <div className="combination-board-body">
        <div className="combination-consonant-rail" aria-label="صامت‌ها">
          {combinationConsonants.map(c => <button key={c.id} className={`combination-consonant tahriri ${selectedConsonant?.id === c.id ? 'selected' : ''}`} onClick={() => chooseConsonant(c)}>
            <span>{kidDisplay(c.form)}</span><small>{c.name}</small>
          </button>)}
        </div>
        <div className="combination-stage" aria-live="polite">
          {!combination && selectedConsonant && <span className="combination-stage-consonant tahriri">{kidDisplay(selectedConsonant.form)}</span>}
          {!combination && selectedVowel && <span className="combination-stage-vowel tahriri">{kidDisplay(selectedVowel.form)}</span>}
          {combination && <button key={combinationNonce} className="combination-result tahriri" onClick={() => sound.speakPersian(speakable(combination))} aria-label={speakable(combination)}>{combinationView(combination, selectedConsonant, selectedVowel)}</button>}
          {!combination && <span className="combination-placeholder">اینجا ترکیب ساخته می‌شود</span>}
        </div>
      </div>
      <div className="combination-actions">
        <button type="button" className="soft-btn combination-clear" onClick={clearCombination} disabled={!selectedConsonant && !selectedVowel && !combination}><RotateCcw /> پاک کردن تخته</button>
      </div>
      {!combinationConsonants.length && <p className="combination-empty">با خواندن درس «بـ ب»، صامت‌ها یکی‌یکی اینجا اضافه می‌شوند.</p>}
    </section> : soundOnly ? <section className="syl-sounds">
      <div className="syl-word-card"><WordPic className="syl-emoji" value={emojiOf(word)} /><b className="tahriri" onClick={() => sound.speakPersian(speakable(word))}>{word}</b></div>
      <div className="syl-tray" aria-label="صداهای درهم">{chips.map(c => <button key={c.id} className={`syl-chip tahriri ${c.used ? 'used' : ''} ${picked === c.id ? 'picked' : ''} ${c.cell.mark ? 'is-mark' : ''}`} onPointerDown={e => chipDown(e, c)} disabled={c.used}>{soundGlyph(c.cell)}</button>)}</div>
      <div className="syl-circles">{parsed.cells.map((c, j) => cellView(c, j, 'circle'))}</div>
    </section> :
    <section className="syl-table" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }} aria-label="جدول بخش‌ها">
      {/* طبقهٔ اول: خود کلمه، حرف‌ها لمسی */}
      <div className={`syl-row1 ${stage === 1 ? 'active' : ''}`} style={{ gridColumn: `1 / span ${N}`, touchAction: 'none' }} onPointerDown={rowDown}>
        {hasRealEmoji(emojiOf(word)) && <span className="syl-emoji small">{emojiOf(word)}</span>}
        <SelectableWord parsed={parsed} usedUnits={usedUnits} sel={sel} zoneRef={zoneRef} />
      </div>
      {/* طبقهٔ دوم: خانه‌های بخش (به تعداد هجاها) */}
      {parsed.syllables.map((s, k) => <div key={`s${k}`} data-drop={`syl:${k}`} onClick={() => placeSyllable(k)} style={{ gridColumn: `span ${s.cells.length}` }}
        className={`syl-slot ${sylDone[k] ? 'filled' : ''} ${stage === 1 && sel ? 'ready' : ''} ${shake === `syl-${k}` ? 'shake' : ''}`}>
        {sylDone[k] ? <>
          <b className="tahriri syl-slot-text">{s.glyph}</b>
          {stage === 2 && <div className="syl-slot-chips">{chips.filter(c => c.cell.syl === k).map(c => <button key={c.id} className={`syl-chip mini tahriri ${c.used ? 'used' : ''} ${picked === c.id ? 'picked' : ''} ${c.cell.mark ? 'is-mark' : ''}`} onPointerDown={e => { e.stopPropagation(); chipDown(e, c); }} onClick={e => e.stopPropagation()} disabled={c.used}>{soundGlyph(c.cell)}</button>)}</div>}
        </> : <span className="syl-slot-empty">بخش {toFa(k + 1)}</span>}
      </div>)}
      {/* طبقهٔ سوم: یک خانه برای هر صدا */}
      {parsed.cells.map((c, j) => cellView(c, j, stage < 2 ? 'locked' : ''))}
    </section>}

    {section === 'syllable' && <div className="syl-actions">
      <button className="soft-btn" onClick={restart}><RotateCcw /> از اول</button>
      <button className="soft-btn" onClick={() => { sound.playPop(); goNext(); }}>کلمهٔ بعدی <ChevronLeft /></button>
    </div>}
    {drag && drag.moved && <span className="drag-ghost tahriri syl-ghost" style={{ left: drag.x, top: drag.y }}>{drag.label}</span>}
    <FeedbackToast state={fb} onClose={() => setFb(null)} />
    <RoundComplete open={roundDone && section === 'syllable'} text={`همهٔ ${toFa(words.length)} کلمهٔ این درس را ${soundOnly ? 'صدا به صدا جدا کردی' : 'بخش‌بخش کردی'}.`}
      onAgain={() => { setRoundDone(false); if (idx % words.length === 0) restart(); else setIdx(0); }} />
  </div>;
};
