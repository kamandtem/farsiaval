import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Eraser, RefreshCw, Volume2 } from 'lucide-react';
import { CURRICULUM, CurriculumLesson, LikeWord, kidDisplay } from '../data/curriculum';
import { boardLessonWords, WORD_BANK, hasRealEmoji } from '../data/wordBank';
import { sound } from '../utils/audio';
import { shuffle, toFa, useCurrentLesson } from '../utils/lessonState';
import { hasSign as wordHasSign, lessonOfWord, plainWord } from '../utils/pieces';
import { LessonPicker, LessonSheet } from './shared/LessonPicker';
import { GameHeader } from './shared/GameHeader';
import { MapScreen } from './shared/MapScreen';
import { MapSpot } from './shared/MapSpot';
import { useBackHandler } from '../utils/backNav';
import { setStatusBarColor, vibrate } from '../utils/native';
import { cheer, FeedbackState, FeedbackToast, praise } from './shared/Feedback';
import { CloseArt, OkArt } from './shared/ArtButtons';
import { SyllableGame } from './SyllableGame';
import { RoundComplete } from './shared/RoundComplete';
import { SignText } from './shared/SignText';

type Place = { left: number; top: number; w: number; ratio: number; bb: [number, number, number, number] };
const HR = 258 / 246;
/* چینش از بالا به پایین: «بازی اول» بالاترین خانه است و خانهٔ درس‌ها پایینِ مسیر (روی سکو).
   جای هر خانه و نقاشیِ همان جا دقیقاً مطابق تصویر مرجع مانده؛ فقط ترتیب بازی‌ها برعکس شده است. */
const houses = [
  { id: 'trace' as const, title: 'بازی اول', subtitle: 'روی نشانه دست بکش', emoji: '✍️', asset: '/assets/letters-house-4.webp', tone: 'coral', place: { left: 23.70, top: 5.92, w: 44.46, ratio: HR, bb: [19.2, 80.0, 22.1, 70.1] } as Place },
  { id: 'hunt' as const, title: 'بازی دوم', subtitle: 'حرف را پیدا کن', emoji: '🔎', asset: '/assets/letters-house-3.webp', tone: 'green', place: { left: 43.11, top: 22.66, w: 44.12, ratio: HR, bb: [19.0, 75.7, 9.7, 79.2] } as Place },
  { id: 'like' as const, title: 'بازی سوم', subtitle: 'چی مثلِ چی؟', emoji: '🧩', asset: '/assets/letters-house-5.webp', tone: 'blue', place: { left: 21.16, top: 37.86, w: 44.31, ratio: HR, bb: [20.0, 82.2, 10.0, 90.6] } as Place },
  { id: 'flash' as const, title: 'بازی چهارم', subtitle: 'فلش‌کارت', emoji: '🃏', asset: '/assets/letters-house-2.webp', tone: 'violet', place: { left: 41.24, top: 54.56, w: 43.76, ratio: HR, bb: [11.0, 87.3, 17.3, 73.9] } as Place },
  /* خانهٔ پنجم (جای «خانهٔ درس‌ها»): تمرین هجا / بخش‌بخش کردن و جدا کردن صداها؛ انتخاب درس از دکمهٔ «نشانهٔ امروز» */
  { id: 'syllable' as const, title: 'بازی پنجم', subtitle: 'بخش و ترکیب', emoji: '✂️', asset: '/assets/letters-house-1.webp', tone: 'sun', place: { left: 41.13, top: 75.40, w: 43.56, ratio: HR, bb: [16.0, 89.0, 23.2, 75.8] } as Place },
] as const;
type House = typeof houses[number]['id'];

const FormRun: React.FC<{ forms: string[]; className?: string }> = ({ forms, className = '' }) => (
  <span className={`lesson-form-run ${className}`}>{forms.map((form, i) => <span key={`${form}-${i}`}>{kidDisplay(form)}</span>)}</span>
);

export const RecognitionVillage: React.FC<{ onBack: () => void; onHome: () => void; onComplete: (t: 'letter' | 'word', id?: string) => void }> = ({ onBack, onHome, onComplete }) => {
  const [house, setHouse] = useState<House | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [lessonsOpen, setLessonsOpen] = useState(false);
  const [lessonOrder] = useCurrentLesson();
  const lesson = CURRICULUM[lessonOrder - 1];
  const chooseHouse = (id: House) => { sound.playPop(); setHouse(id); };
  const done = useCallback(() => onComplete('letter', lesson.id), [onComplete, lesson.id]);
  // دکمهٔ برگشت گوشی: پنجره‌ها ← بازی ← نقشهٔ خانه‌ها ← نقشهٔ جزیره
  useBackHandler(() => { if (helpOpen) { setHelpOpen(false); return; } if (house) { setHouse(null); return; } onBack(); });

  useEffect(() => { setStatusBarColor(house ? '#FFD25A' : '#57C3F1'); }, [house]);

  if (house) {
    const h = houses.find(x => x.id === house)!;
    return <main className="recognition-game-screen" dir="rtl">
      <GameHeader kicker={h.title} title={h.subtitle} emoji={h.emoji} tone="sun" onBack={() => setHouse(null)}>
        <LessonPicker compact />
      </GameHeader>
      <div className="recognition-game-body">
        {house === 'trace' && <LetterTrace key={lesson.id} lesson={lesson} onDone={done} />}
        {house === 'hunt' && <LetterHunt key={lesson.id} lesson={lesson} onDone={done} />}
        {house === 'like' && <LikeWhat key={lesson.id} lesson={lesson} onDone={done} />}
        {house === 'flash' && <FlashCards key={lesson.id} lesson={lesson} />}
        {house === 'syllable' && <SyllableGame key={lesson.id} lesson={lesson} onDone={done} />}
      </div>
    </main>;
  }
  return <MapScreen id="letters" map="/assets/letters-map.webp" alt="مسیر دهکده آشنایی با حروف" overlay={<>
    <header className="map-topbar">
      <button className="kid-back-btn big" onClick={() => { sound.playPop(); onBack(); }} aria-label="بازگشت به نقشهٔ جزیره"><img className="kid-back-art" src="/assets/ui/btn-back.svg" alt="" draggable={false} /></button>
      <div className="map-title-ribbon coral"><small>دهکدهٔ اول</small><strong>آشنایی با حروف</strong></div>
      <button className="map-svg-button" onClick={() => { sound.playPop(); setHelpOpen(true); }} aria-label="راهنما"><img src="/assets/letters-help.svg" alt="راهنما" /></button>
    </header>
    <button className="lesson-chip" onClick={() => { sound.playPop(); setLessonsOpen(true); }}><span>نشانهٔ امروز</span><b className="tahriri"><SignText text={lesson.sign} /></b><small>درس {toFa(lessonOrder)}</small></button>
    <LessonSheet open={lessonsOpen} onClose={() => setLessonsOpen(false)} />
    {helpOpen && <div className="letters-help-backdrop" onClick={() => setHelpOpen(false)}><section className="letters-help-panel" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <CloseArt className="letters-help-close" onClick={() => setHelpOpen(false)} />
      <div className="letters-help-mark">؟</div><h2>آشنایی با حروف</h2>
      <p>همهٔ بازی‌ها طبق ترتیب درس‌های کتاب فارسی اول جلو می‌روند و فقط از نشانه‌هایی استفاده می‌کنند که تا درسِ انتخاب‌شده خوانده‌ای.</p>
      <div className="letters-help-lesson"><LessonPicker /></div>
      <div className="letters-help-list">{houses.map((h, i) => <button key={h.id} onClick={() => { setHelpOpen(false); chooseHouse(h.id); }}><span>{toFa(i + 1)}</span><b>{h.title}</b><small>{h.subtitle}</small></button>)}</div>
    </section></div>}
  </>}>
    {/* از پایین به بالا در DOM تا لایه‌بندیِ هم‌پوشانیِ خانه‌ها مثل قبل بماند */}
    {houses.map((h, i) => ({ h, i })).reverse().map(({ h, i }) => <MapSpot key={h.id} place={h.place} art={h.asset} index={i} title={h.title} subtitle={h.subtitle} tone={h.tone} hint={i === 0} onClick={() => chooseHouse(h.id)} />)}
  </MapScreen>;
};

/** بعد از تمام شدن هر تمرین، خودکار سراغ تمرین بعدی می‌رود (تایمر با خروج از بازی پاک می‌شود) */
export function useAutoNext() {
  const t = useRef(0);
  useEffect(() => () => window.clearTimeout(t.current), []);
  return useMemo(() => {
    const run = (next: () => void, ms = 1800) => { window.clearTimeout(t.current); t.current = window.setTimeout(next, ms); };
    return Object.assign(run, { cancel: () => window.clearTimeout(t.current) });
  }, []);
}

/* ------------------------------------------------------------------ */
/* تمرین ۱: شکل پررنگ بالا، شکل توخالی/خط‌چین بزرگ پایین، دست‌کشیدن و «انجام دادم»
   - نشانه همیشه کامل داخل کادر جا می‌شود (اندازه‌گیری پیکسلی، نه متریک فونت؛ مثلاً مدِّ «آ» بیرون نمی‌زند)
   - برای قبول شدن باید حدود ۷۰٪ خط‌چین پوشانده شود و بیشترِ خط کودک روی خود نشانه باشد
   - اگر کودک زیاد از خط‌چین بیرون برود، همان لحظه هشدار می‌گیرد
   - ضربه زدن (تَپ) و خط‌های خیلی کوتاه پوشش حساب نمی‌شوند، مگر روی نقطه‌های حرف
   - فقط تکه‌هایی از خط کودک که روی نشانه‌اند پوشش می‌دهند؛ خطی که بیشترش بیرون است کلاً حساب نمی‌شود
   - هر تکهٔ جدای شکل (هر شکل حرف، بدنه، نقطه‌ها) باید جداگانه کشیده شود؛ با کشیدن فقط یک بخش قبول نمی‌شود */
const TRACE_FONT = '"Tahriri"';
const NEED_COVER = 0.75;     // حداقل پوشش کل خط‌چین
const NEED_PART = 0.6;       // حداقل پوشش هر تکهٔ بزرگ (بدنهٔ هر شکل)
const NEED_DOT = 0.3;        // نقطه‌ها/تکه‌های کوچک باید دست‌کم لمس شوند
const NEED_PRECISION = 0.78; // حداقل سهم طولِ خط کودک که روی/نزدیک نشانه است
const STROKE_OUTSIDE_MAX = 0.5; // خطی که بیش از نصفش بیرون باشد، پوشش حساب نمی‌شود
const AUTO_COVER = 0.9;      // با این پوشش (و کامل بودن همهٔ تکه‌ها)، خودکار قبول می‌شود
const TRACE_RUNS = 3;        // هر نشانه/واژهٔ آغازین سه بار کشیده می‌شود؛ بعد «آفرین، انجام دادی»

type TracePt = { x: number; y: number };
type TraceLayout = {
  w: number; h: number; size: number; x: number; y: number;
  glyph: Uint8Array | null; near: Uint8Array | null; strokes: TracePt[][];
  /** شمارهٔ تکهٔ هر پیکسلِ نشانه (۰ = بیرون یا تکهٔ ناچیز) */
  comp: Int32Array | null;
  /** برای هر تکه: تعداد پیکسل و اینکه کوچک (نقطه) است یا نه؛ اندیس ۰ خالی است */
  parts: { area: number; small: boolean }[];
};

/** تکه‌های جدای نشانه را پیدا می‌کند (هر شکل حرف، بدنه، نقطه، سرکش جدا) */
function labelParts(glyph: Uint8Array, w: number, h: number) {
  const comp = new Int32Array(w * h);
  const areas: number[] = [0];
  const stack = new Int32Array(w * h);
  let total = 0;
  for (let i = 0; i < glyph.length; i++) {
    if (!glyph[i] || comp[i]) continue;
    const id = areas.length; let top = 0, area = 0;
    stack[top++] = i; comp[i] = id;
    while (top) {
      const j = stack[--top]; area++;
      const x = j % w, y = (j / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx;
        if (glyph[k] && !comp[k]) { comp[k] = id; stack[top++] = k; }
      }
    }
    areas.push(area); total += area;
  }
  const big = Math.max(...areas);
  const parts = areas.map((area, id) => ({ area: id === 0 || area < total * 0.004 ? 0 : area, small: area < big * 0.12 }));
  // تکه‌های ناچیز (لبهٔ ضدّنویز فونت) را کنار بگذار
  for (let i = 0; i < comp.length; i++) if (comp[i] && !parts[comp[i]].area) comp[i] = 0;
  return { comp, parts };
}

/** اندازه و جای نشانه را طوری پیدا می‌کند که کل جوهرِ آن (با نقطه و مد و سرکش) داخل کادر باشد */
function fitText(text: string, w: number, h: number) {
  const probe = 200;
  const c = document.createElement('canvas');
  const cw = Math.ceil(probe * (text.length + 2) * 1.2) + 200, ch = probe * 3;
  c.width = cw; c.height = ch;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${probe}px ${TRACE_FONT}`; g.fillStyle = '#000';
  const ox = cw / 2, oy = ch / 2;
  g.fillText(text, ox, oy);
  g.lineWidth = probe * 0.02; g.strokeText(text, ox, oy);
  const d = g.getImageData(0, 0, cw, ch).data;
  let x0 = cw, y0 = ch, x1 = 0, y1 = 0;
  for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) if (d[(y * cw + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) return { size: h * 0.6, x: w / 2, y: h / 2 };
  const bw = x1 - x0 + 2, bh = y1 - y0 + 2;
  const k = Math.min((w * 0.86) / bw, (h * 0.78) / bh);
  return { size: probe * k, x: w / 2 - ((x0 + x1) / 2 - ox) * k, y: h / 2 - ((y0 + y1) / 2 - oy) * k };
}

function textMask(text: string, L: TraceLayout, grow: number) {
  const c = document.createElement('canvas'); c.width = L.w; c.height = L.h;
  const m = c.getContext('2d', { willReadFrequently: true })!;
  m.direction = 'rtl'; m.textAlign = 'center'; m.textBaseline = 'middle'; m.font = `${L.size}px ${TRACE_FONT}`;
  m.fillStyle = '#000'; m.strokeStyle = '#000'; m.lineJoin = 'round'; m.lineCap = 'round';
  m.fillText(text, L.x, L.y);
  if (grow > 0) { m.lineWidth = grow * 2; m.strokeText(text, L.x, L.y); }
  const d = m.getImageData(0, 0, L.w, L.h).data; const out = new Uint8Array(L.w * L.h);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] > 60 ? 1 : 0;
  return out;
}

const LetterTrace: React.FC<{ lesson: CurriculumLesson; onDone: () => void }> = ({ lesson, onDone }) => {
  const items = useMemo(() => {
    const list: { text: string; label: string }[] = [];
    const formsText = lesson.forms.join('  ');
    list.push({ text: formsText, label: `نشانهٔ «${kidDisplay(lesson.sign)}»` });
    if (lesson.forms.length > 2) lesson.forms.forEach(f => list.push({ text: f, label: `یک شکل از «${kidDisplay(lesson.sign)}»` }));
    const traceWords = [18, 26, 30].includes(lesson.order) ? boardLessonWords(lesson.order) : WORD_BANK.filter(w => w.lesson === lesson.order);
    // بازی اول فقط برای کشیدن واژه‌های کوتاه است: هیچ واژهٔ چهارحرفی یا بلندتر وارد نشود.
    traceWords.filter(w => [...plainWord(w.word)].length <= 3).slice(0, 4).forEach(w => list.push({ text: w.word, label: hasRealEmoji(w.emoji) ? `واژهٔ درس: ${w.emoji}` : 'واژهٔ درس' }));
    return list;
  }, [lesson]);
  const [index, setIndex] = useState(0);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [meter, setMeter] = useState(0);
  const [solved, setSolved] = useState(false);
  const [traceRun, setTraceRun] = useState(1);
  const [roundDone, setRoundDone] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const layout = useRef<TraceLayout>({ w: 0, h: 0, size: 100, x: 0, y: 0, glyph: null, near: null, strokes: [], comp: null, parts: [] });
  const drawing = useRef(false);
  const pointerId = useRef<number | null>(null);
  const lastTapWarn = useRef(0);
  const outsideRun = useRef(0);
  const lastWarn = useRef(0);
  const item = items[index % items.length];
  const displayText = kidDisplay(item.text);

  const brush = () => Math.max(24, layout.current.size * 0.1);
  const tolerance = () => Math.max(20, layout.current.size * 0.07);
  /** کمترین طولی که یک خط باید داشته باشد تا «دست‌کشیدن» حساب شود، نه ضربه */
  const minStroke = () => Math.max(26, layout.current.size * 0.12);
  const strokeLen = (s: TracePt[]) => { let d = 0; for (let i = 1; i < s.length; i++) d += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y); return d; };

  const drawGuide = useCallback(async () => {
    const wrap = wrapRef.current, guide = guideRef.current, ink = inkRef.current;
    if (!wrap || !guide || !ink) return;
    try { await document.fonts.load(`100px ${TRACE_FONT}`); } catch { /* ignore */ }
    const w = wrap.clientWidth;
    const h = Math.round(Math.max(280, Math.min(520, w * 0.8, window.innerHeight * 0.56)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    for (const c of [guide, ink]) { c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`; c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0); }
    const fit = fitText(displayText, w, h);
    const L: TraceLayout = { w, h, size: fit.size, x: fit.x, y: fit.y, glyph: null, near: null, strokes: [], comp: null, parts: [] };
    const ctx = guide.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${L.size}px ${TRACE_FONT}`;
    // شکل توخالی: درون کم‌رنگ، دور خط‌چین
    ctx.fillStyle = 'rgba(206,218,236,.6)';
    ctx.fillText(displayText, L.x, L.y);
    ctx.setLineDash([Math.max(5, L.size * 0.03), Math.max(4, L.size * 0.022)]);
    ctx.lineWidth = Math.max(1.8, L.size * 0.009); ctx.strokeStyle = '#6f7d92'; ctx.lineJoin = 'round';
    ctx.strokeText(displayText, L.x, L.y);
    ctx.setLineDash([]);
    layout.current = L;
    L.glyph = textMask(displayText, L, 0);
    L.near = textMask(displayText, L, Math.max(20, L.size * 0.07));
    const lp = labelParts(L.glyph, w, h); L.comp = lp.comp; L.parts = lp.parts;
    ink.getContext('2d')!.clearRect(0, 0, w, h);
    setMeter(0); setSolved(false);
  }, [displayText]);

  useEffect(() => { drawGuide(); let t = 0; const on = () => { window.clearTimeout(t); t = window.setTimeout(drawGuide, 150); }; window.addEventListener('resize', on); return () => { window.removeEventListener('resize', on); window.clearTimeout(t); }; }, [drawGuide]);
  useEffect(() => { sound.speakPersian(`روی ${item.text.includes(' ') ? 'نشانه‌ها' : 'نشانه'} دست بکش`); }, [index]); // eslint-disable-line

  const isNear = (p: { x: number; y: number }) => { const L = layout.current; const x = Math.round(p.x), y = Math.round(p.y); if (!L.near || x < 0 || y < 0 || x >= L.w || y >= L.h) return false; return L.near[y * L.w + x] === 1; };
  const pos = (e: React.PointerEvent) => { const r = inkRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (e: React.PointerEvent) => {
    if (solved) return; e.preventDefault();
    // فقط یک انگشت: لمس دوم (یا کف دست) خط جدید نمی‌سازد
    if (drawing.current || !e.isPrimary) return;
    (e.target as Element).setPointerCapture(e.pointerId); pointerId.current = e.pointerId;
    drawing.current = true; outsideRun.current = 0; layout.current.strokes.push([pos(e)]);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || e.pointerId !== pointerId.current) return; const p = pos(e); const s = layout.current.strokes[layout.current.strokes.length - 1]; const last = s[s.length - 1];
    const dist = Math.hypot(p.x - last.x, p.y - last.y); if (dist < 1.5) return; s.push(p);
    const inside = isNear(p);
    if (inside) outsideRun.current = 0; else outsideRun.current += dist;
    const ctx = inkRef.current!.getContext('2d')!;
    ctx.strokeStyle = inside ? (lesson.part === 1 ? '#ef5b5b' : '#6c5ce7') : 'rgba(150,160,175,.75)';
    ctx.lineWidth = Math.max(12, layout.current.size * 0.06); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    if (outsideRun.current > Math.max(45, layout.current.size * 0.18) && Date.now() - lastWarn.current > 2600) {
      lastWarn.current = Date.now(); outsideRun.current = 0; vibrate(90);
      setFb({ tone: 'try', emoji: '🙈', text: 'از خط‌چین بیرون رفتی! روی خود نشانه دست بکش.' });
      sound.speakPersian('روی خط‌چین دست بکش');
    }
  };

  /** پوشش خط‌چین (کل و هر تکه) و دقت خط کودک.
   *  - خط کوتاه/ضربه فقط روی نقطه‌ها و تکه‌های کوچک اثر دارد
   *  - فقط بخش‌هایی از خط که روی نشانه است رنگ پوشش می‌گیرد
   *  - خطی که بیشترش بیرون نشانه است، هیچ پوششی نمی‌دهد */
  const measure = () => {
    const L = layout.current;
    const empty = { cover: 0, precision: 0, partsOk: false, taps: 0, missing: 0 };
    if (!L.glyph || !L.near || !L.comp) return empty;
    const mk = () => { const c = document.createElement('canvas'); c.width = L.w; c.height = L.h; const k = c.getContext('2d', { willReadFrequently: true })!; k.strokeStyle = '#000'; k.lineWidth = brush(); k.lineCap = 'round'; k.lineJoin = 'round'; return k; };
    const longK = mk(), shortK = mk();
    let len = 0, okLen = 0, taps = 0;
    L.strokes.forEach(s => {
      let sl = 0, sIn = 0;
      for (let i = 1; i < s.length; i++) {
        const d = Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
        sl += d; if (isNear(s[i]) && isNear(s[i - 1])) sIn += d;
      }
      const isShort = sl < minStroke();
      if (isShort) {
        taps++;
        // ضربه: فقط اگر روی نشانه باشد، و بعداً فقط برای تکه‌های کوچک (نقطه) شمرده می‌شود
        if (isNear(s[0])) { shortK.beginPath(); shortK.moveTo(s[0].x, s[0].y); s.forEach(p => shortK.lineTo(p.x, p.y)); shortK.lineTo(s[0].x + 0.1, s[0].y); shortK.stroke(); }
        return;
      }
      len += sl; okLen += sIn;
      if (sl - sIn > sl * STROKE_OUTSIDE_MAX) return; // خطِ بیشتر بیرون: پوشش نمی‌دهد
      // فقط تکه‌های داخل نشانه رسم می‌شوند
      longK.beginPath(); let open = false;
      for (let i = 1; i < s.length; i++) {
        if (isNear(s[i]) && isNear(s[i - 1])) { if (!open) { longK.moveTo(s[i - 1].x, s[i - 1].y); open = true; } longK.lineTo(s[i].x, s[i].y); }
        else open = false;
      }
      longK.stroke();
    });
    const a = longK.getImageData(0, 0, L.w, L.h).data, b = shortK.getImageData(0, 0, L.w, L.h).data;
    const hitPart = new Array(L.parts.length).fill(0), allPart = new Array(L.parts.length).fill(0);
    let glyph = 0, hit = 0;
    for (let i = 0; i < L.glyph.length; i += 2) {
      const c = L.comp[i]; if (!c) continue;
      const part = L.parts[c];
      glyph++; allPart[c]++;
      const on = a[i * 4 + 3] > 60 || (part.small && b[i * 4 + 3] > 60);
      if (on) { hit++; hitPart[c]++; }
    }
    let missing = 0;
    for (let c = 1; c < L.parts.length; c++) {
      if (!L.parts[c].area || !allPart[c]) continue;
      if (hitPart[c] / allPart[c] < (L.parts[c].small ? NEED_DOT : NEED_PART)) missing++;
    }
    return { cover: glyph ? hit / glyph : 0, precision: len ? okLen / len : 0, partsOk: missing === 0, taps, missing };
  };

  const clearInk = () => {
    layout.current.strokes = [];
    const { w, h } = layout.current;
    inkRef.current?.getContext('2d')!.clearRect(0, 0, w, h);
    setMeter(0);
  };

  const succeed = () => {
    if (traceRun < TRACE_RUNS) {
      const nextRun = traceRun + 1;
      setTraceRun(nextRun);
      clearInk();
      sound.playSnap();
      const text = `خوب کشیدی! حالا بار ${toFa(nextRun)} از ${toFa(TRACE_RUNS)}.`;
      setFb({ tone: 'info', emoji: '✏️', text });
      sound.speakPersian(text);
      return;
    }
    setSolved(true); setMeter(1);
    sound.playSuccess();
    const p = 'آفرین، انجام دادی!';
    sound.speakPersian(p);
    setFb({ tone: 'good', text: `${p} خیلی خوب کشیدی.` });
    onDone();
    // آخرین مورد: پیام «موفق شدی»، نه برگشتِ بی‌خبر به مورد اول
    const last = index % items.length === items.length - 1;
    window.setTimeout(() => { if (last) setRoundDone(true); else { setTraceRun(1); setIndex(i => (i + 1) % items.length); } }, 1500);
  };
  const traceNext = () => {
    clear(); setTraceRun(1);
    if (index % items.length === items.length - 1) setRoundDone(true);
    else setIndex(i => (i + 1) % items.length);
  };
  const traceAgain = () => { setRoundDone(false); setTraceRun(1); if (index === 0) drawGuide(); else setIndex(0); };

  const up = (e?: React.PointerEvent) => {
    if (!drawing.current || (e && e.pointerId !== pointerId.current)) return; drawing.current = false; pointerId.current = null;
    const strokes = layout.current.strokes, s = strokes[strokes.length - 1];
    // ضربهٔ کوتاه روی بدنهٔ حرف: یادآوری کن که باید دست کشید
    if (s && strokeLen(s) < minStroke()) {
      const c = layout.current.comp; const x = Math.round(s[0].x), y = Math.round(s[0].y);
      const onSmall = c && x >= 0 && y >= 0 && x < layout.current.w && y < layout.current.h && layout.current.parts[c[y * layout.current.w + x]]?.small;
      if (!onSmall && Date.now() - lastTapWarn.current > 2600) {
        lastTapWarn.current = Date.now();
        setFb({ tone: 'try', emoji: '👆', text: 'ضربه نزن! انگشتت را روی خط‌چین بکش و حرکت بده.' });
        sound.speakPersian('انگشتت را روی خط‌چین بکش');
      }
    }
    const { cover, precision, partsOk } = measure();
    // تا همهٔ تکه‌ها کشیده نشده، نوار کامل پر نمی‌شود
    const m = Math.min(1, cover / NEED_COVER);
    setMeter(partsOk && precision >= NEED_PRECISION ? m : Math.min(m, 0.95));
    if (cover >= AUTO_COVER && partsOk && precision >= NEED_PRECISION && !solved) succeed();
  };
  const clear = () => { clearInk(); setSolved(false); };

  const finish = () => {
    if (solved) return;
    if (!layout.current.strokes.length) { setFb({ tone: 'info', text: 'اول با انگشتت روی خط‌چین‌ها دست بکش.' }); return; }
    const { cover, precision, partsOk, missing } = measure();
    if (cover >= NEED_COVER && partsOk && precision >= NEED_PRECISION) succeed();
    else {
      vibrate(60);
      if (cover === 0 && precision === 0) { sound.speakPersian('انگشتت را روی خط‌چین بکش'); setFb({ tone: 'try', emoji: '👆', text: 'با ضربه زدن نمی‌شود! انگشتت را روی خط‌چین بکش و حرکت بده.' }); }
      else if (precision < NEED_PRECISION) { sound.speakPersian('روی خط‌چین دست بکش'); setFb({ tone: 'try', emoji: '🙈', text: 'خیلی از خط‌چین بیرون رفتی. پاک کن و آرام روی خود نشانه بکش.' }); }
      else if (cover >= NEED_COVER && !partsOk) { sound.speakPersian('یک تکه را جا انداختی'); setFb({ tone: 'try', emoji: '🔍', text: missing > 1 ? `${toFa(missing)} تکه از شکل را هنوز نکشیده‌ای (شاید نقطه‌ها). همه را بکش.` : 'یک تکه از شکل را هنوز نکشیده‌ای (شاید نقطه). آن را هم بکش.' }); }
      else { sound.speakPersian('کمی بیشتر روی خط‌چین دست بکش'); setFb({ tone: 'try', emoji: '✏️', text: `هنوز همهٔ شکل را نکشیده‌ای (${toFa(Math.round(cover * 100))}٪). بقیهٔ خط‌چین را هم بکش.` }); }
    }
  };

  return <div className="mini-game trace-game">
    <div className="trace-model" aria-label="شکل نشانه">
      <span className="tahriri trace-model-glyph">{displayText}</span>
      <button onClick={() => sound.playLetter(lesson.order)} aria-label="شنیدن" disabled={sound.isSilentLetter(lesson.order)}><Volume2 /></button>
    </div>
    <p className="trace-label">{item.label} · بار {toFa(traceRun)} از {toFa(TRACE_RUNS)} <em>({toFa(index % items.length + 1)} از {toFa(items.length)})</em></p>
    <div className="trace-canvas-wrap" ref={wrapRef}>
      <canvas ref={guideRef} className="trace-guide" />
      <canvas ref={inkRef} className="trace-ink" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />
    </div>
    <div className={`trace-meter ${meter >= 1 ? 'full' : ''}`} aria-label="مقدار کشیده‌شده">
      <i style={{ width: `${Math.round(meter * 100)}%` }} />
      <span>{meter >= 1 ? '⭐ آماده است!' : 'روی همهٔ خط‌چین دست بکش'}</span>
    </div>
    <div className="trace-actions">
      <button className="soft-btn" onClick={clear}><Eraser /> پاک کن</button>
      <OkArt className="trace-ok" ready={meter >= 1 && !solved} onClick={finish} label="انجام دادم" caption="انجام دادم" />
      <button className="soft-btn" onClick={traceNext}>بعدی <ChevronLeft /></button>
    </div>
    <FeedbackToast state={fb} onClose={() => setFb(null)} />
    <RoundComplete open={roundDone} text={`همهٔ ${toFa(items.length)} تمرین این درس را کشیدی.`} onAgain={traceAgain} />
  </div>;
};

/* ------------------------------------------------------------------ */
/* تمرین ۲: پیدا کردن حرف در میان حروف خاکستری درهم */
const LetterHunt: React.FC<{ lesson: CurriculumLesson; onDone: () => void }> = ({ lesson, onDone }) => {
  const [round, setRound] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  /** هر دور بازی: به تعداد شکل‌های نشانه (حداقل ۳ مرحله)؛ بعد پیام «موفق شدی» */
  const ROUNDS = Math.max(3, lesson.forms.length);
  const target = lesson.forms[round % lesson.forms.length];
  const cells = useMemo(() => {
    const targetCount = 4 + Math.floor(Math.random() * 3);
    const pool = new Set<string>();
    CURRICULUM.forEach(l => { if (l.order <= Math.max(lesson.order + 3, 10)) l.forms.forEach(f => pool.add(f)); });
    lesson.forms.forEach(f => pool.add(f));
    pool.delete(target);
    const distractors = shuffle([...pool]).filter(f => f.replace(/[\u200D]/g, '') !== target.replace(/[\u200D]/g, ''));
    const list: string[] = [];
    for (let i = 0; i < targetCount; i++) list.push(target);
    for (let i = 0; list.length < 24; i++) list.push(distractors[i % distractors.length]);
    return shuffle(list).map((g, i) => ({ id: i, g, isTarget: g === target, rot: Math.round(Math.random() * 24 - 12), dx: Math.round(Math.random() * 30 - 15), dy: Math.round(Math.random() * 24 - 12), scale: 0.85 + Math.random() * 0.35 }));
  }, [round, lesson, target]);
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [fb, setFb] = useState<FeedbackState>(null);
  const total = cells.filter(c => c.isTarget).length;
  const autoNext = useAutoNext();
  useEffect(() => { setFound([]); sound.playLetter(lesson.order); }, [round]); // eslint-disable-line

  const tap = (c: typeof cells[number]) => {
    if (found.includes(c.id)) return;
    if (c.isTarget) {
      const n = [...found, c.id]; setFound(n); sound.playPop();
      if (n.length === total) { sound.playSuccess(); const p = praise(); sound.speakPersian(p); setFb({ tone: 'good', text: `${p} همه را پیدا کردی.` }); onDone(); autoNext(() => { if (round + 1 >= ROUNDS) setRoundDone(true); else setRound(r => r + 1); }); }
    } else { setWrong(c.id); sound.speakPersian('این نیست'); window.setTimeout(() => setWrong(null), 600); }
  };

  return <div className="mini-game hunt-game">
    <div className="hunt-target">
      <span>این را پیدا کن:</span>
      <b className="tahriri">{kidDisplay(target)}</b>
      <button onClick={() => sound.playLetter(lesson.order)} aria-label="شنیدن" disabled={sound.isSilentLetter(lesson.order)}><Volume2 /></button>
    </div>
    <div className="hunt-field" aria-label="حروف درهم">
      {cells.map(c => <button key={c.id} className={`hunt-glyph tahriri ${found.includes(c.id) ? 'found' : ''} ${wrong === c.id ? 'wrong' : ''}`} style={{ transform: `translate(${c.dx}%, ${c.dy}%) rotate(${c.rot}deg) scale(${c.scale})` }} onClick={() => tap(c)}>{kidDisplay(c.g)}</button>)}
    </div>
    <div className="hunt-footer"><span>{toFa(found.length)} از {toFa(total)} پیدا شد · مرحلهٔ {toFa(round + 1)} از {toFa(ROUNDS)}</span><button className="soft-btn" onClick={() => { autoNext.cancel(); if (round + 1 >= ROUNDS) setRoundDone(true); else setRound(r => r + 1); }}><RefreshCw /> دور بعد</button></div>
    <FeedbackToast state={fb} onClose={() => setFb(null)} />
    <RoundComplete open={roundDone} text={`هر ${toFa(ROUNDS)} مرحلهٔ «پیدا کن» را تمام کردی.`} onAgain={() => { setRoundDone(false); setRound(0); }} />
  </div>;
};

/* ------------------------------------------------------------------ */
/* تمرین ۳: «آ» مثلِ ...؟ انتخاب همهٔ کلمه‌های درست */
/** درس‌های و (دارو)، و(اُ) (خوش) و خوا (خواب): فقط واژه‌هایی که کاربر/کتاب برای همان درس تعیین کرده. */
const EXCEPTION_LESSONS = new Set([18, 26, 30]);
const curatedPlains = (order: number) => new Set(boardLessonWords(order).map(w => w.plain));
const hasSign = (lesson: CurriculumLesson, word: string) => EXCEPTION_LESSONS.has(lesson.order)
  ? curatedPlains(lesson.order).has(plainWord(word))
  : lesson.chars.some(ch => word.includes(ch)) || (lesson.order === 1 && word.includes('آ'));
/** گزینهٔ غلط: نه در فهرست درس، نه با همین صدای «و»/«خوا» (تا کودک گیج نشود) */
const lacksSign = (lesson: CurriculumLesson, word: string) => EXCEPTION_LESSONS.has(lesson.order)
  ? !hasSign(lesson, word) && !wordHasSign(word, lesson.order)
  : !hasSign(lesson, word);

/** واژه‌های تصویریِ همین نشانه و پیش‌نیازهایش، فقط از فهرست کتابی تختهٔ واژه‌ها */
const lessonPictureWords = (order: number): LikeWord[] => {
  const seen = new Set<string>();
  const out: LikeWord[] = [];
  const add = (word: string, emoji = '') => {
    const plain = plainWord(word);
    // «چی مثلِ چی» و فلش‌کارت بازی تصویری‌اند: واژهٔ بی‌تصویر اینجا نمی‌آید
    if (seen.has(plain) || !hasRealEmoji(emoji)) return;
    seen.add(plain);
    out.push({ word, emoji });
  };
  for (let n = 1; n <= order; n++) {
    CURRICULUM[n - 1]?.likeWords.forEach(w => { if (n === order || lessonOfWord(w.word) <= order) add(w.word, w.emoji); });
    // در سه درس واژه‌محور، فهرست «بنویس» خودِ کتاب مرجع است؛
    // واژهٔ همان درس را به‌خاطر وجود یک نشانهٔ فرعی به درس قبلی/بعدی پرت نکن.
    boardLessonWords(n).forEach(w => { if (n === order || w.lesson <= order) add(w.word, w.emoji); });
  }
  WORD_BANK.forEach(w => { if (w.lesson <= order) add(w.word, w.emoji); });
  return out.sort((a, b) => [...a.word].length - [...b.word].length);
};

const LIKE_ROUNDS = 3;
const LikeWhat: React.FC<{ lesson: CurriculumLesson; onDone: () => void }> = ({ lesson, onDone }) => {
  const [round, setRound] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const bookWords = useMemo(() => lessonPictureWords(lesson.order), [lesson.order]);
  const options = useMemo(() => {
    const correctPool = shuffle(bookWords.filter(w => hasSign(lesson, w.word)));
    const needCount = Math.min(correctPool.length, 2 + (round % 2)); // هر دور فقط ۲ یا ۳ واژهٔ درست
    const correct = correctPool.slice(0, needCount);
    const wrong = shuffle(bookWords.filter(w => lacksSign(lesson, w.word))).slice(0, Math.max(0, 8 - correct.length));
    return shuffle([...correct.map(w => ({ ...w, ok: true })), ...wrong.map(w => ({ ...w, ok: false }))]);
  }, [lesson, bookWords, round]);
  const [picked, setPicked] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [fb, setFb] = useState<FeedbackState>(null);
  const need = options.filter(o => o.ok).length;
  const autoNext = useAutoNext();
  useEffect(() => { setPicked([]); sound.playLetter(lesson.order); }, [round]); // eslint-disable-line

  const choose = (o: typeof options[number]) => {
    if (picked.includes(o.word)) return;
    sound.speakWord(o.word);
    if (o.ok) {
      const n = [...picked, o.word]; setPicked(n); sound.playPop();
      if (n.length === need) { sound.playSuccess(); const p = praise(); setFb({ tone: 'good', text: `${p} همهٔ کلمه‌های «${kidDisplay(lesson.sign)}» را پیدا کردی.` }); onDone(); autoNext(() => { if (round + 1 >= LIKE_ROUNDS) setRoundDone(true); else setRound(r => r + 1); }); }
    } else { setShake(o.word); setFb({ tone: 'try', text: `«${o.word}» صدای «${kidDisplay(lesson.sign)}» ندارد. ${cheer()}` }); window.setTimeout(() => setShake(null), 650); }
  };

  return <div className="mini-game like-game">
    <h2 className="like-prompt"><b className="tahriri"><FormRun forms={lesson.forms} /></b> مثلِ ...؟</h2>
    <p className="game-hint">فقط {toFa(need)} کلمه‌ای را انتخاب کن که صدای «{kidDisplay(lesson.sign)}» دارند ({toFa(picked.length)} از {toFa(need)})</p>
    <div className="like-grid">
      {options.map(o => <button key={o.word} className={`like-card ${picked.includes(o.word) ? 'picked' : ''} ${shake === o.word ? 'wrong' : ''}`} onClick={() => choose(o)}>
        <span className="like-emoji">{o.emoji}</span><b className="tahriri">{o.word}</b><span className="word-card-speaker" onClick={e=>{e.stopPropagation();sound.speakWord(o.word)}}><Volume2/></span>{picked.includes(o.word)&&<i><Check/></i>}
      </button>)}
    </div>
    <div className="hunt-footer"><span>مرحلهٔ {toFa(round + 1)} از {toFa(LIKE_ROUNDS)}</span><button className="soft-btn" onClick={() => { autoNext.cancel(); if (round + 1 >= LIKE_ROUNDS) setRoundDone(true); else setRound(r => r + 1); }}><RefreshCw /> کلمه‌های تازه</button></div>
    <FeedbackToast state={fb} onClose={() => setFb(null)} />
    <RoundComplete open={roundDone} text={`هر ${toFa(LIKE_ROUNDS)} مرحلهٔ «چی مثلِ چی» را درست جواب دادی.`} onAgain={() => { setRoundDone(false); setRound(0); }} />
  </div>;
};

/* ------------------------------------------------------------------ */
/* تمرین ۴: فلش‌کارت؛ رو: «نـ ن مثلِ؟» — پشت: تصویر و نوشتهٔ کلمه */
const FlashCards: React.FC<{ lesson: CurriculumLesson }> = ({ lesson }) => {
  const cards = useMemo(() => {
    const current = lessonPictureWords(lesson.order).filter(w => hasSign(lesson, w.word));
    return current.length ? current : [{ word: 'آب', emoji: '💧' }];
  }, [lesson]);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [roundDone, setRoundDone] = useState(false);
  const iRef = useRef(0); iRef.current = i;
  const card = cards[i % cards.length];
  const autoNext = useAutoNext();
  // بعد از کارتِ آخر (مثلاً ۵ از ۵) پیام تبریک می‌آید، نه برگشتِ بی‌خبر به کارت ۱
  const go = (d: number) => {
    autoNext.cancel(); setFlip(false); sound.playPop();
    if (d > 0 && iRef.current % cards.length === cards.length - 1) { window.setTimeout(() => setRoundDone(true), 180); return; }
    if (d < 0 && iRef.current % cards.length === 0) return;
    window.setTimeout(() => setI(x => (x + d + cards.length) % cards.length), 180);
  };
  // بعد از دیدن جواب (پشت کارت)، خودکار کارت بعدی می‌آید
  const toggle = () => { const toBack = !flip; setFlip(toBack); if (toBack) { sound.speakWord(card.word); autoNext(() => go(1), 2600); } else { autoNext.cancel(); sound.playLetter(lesson.order); } };
  return <div className="mini-game flash-game">
      <div className={`flash-card ${flip ? 'flipped' : ''}`} onClick={toggle} role="button" aria-label="کارت را برگردان">
      <div className="flash-face front"><b className="tahriri"><FormRun forms={lesson.forms} /></b><span>مثلِ ...؟</span><small>برای دیدن جواب، روی کارت بزن</small></div>
      <div className="flash-face back"><span className="flash-emoji">{card.emoji}</span><b className="tahriri">{card.word}</b><button className="flash-speaker" onClick={e=>{e.stopPropagation();sound.speakWord(card.word)}}><Volume2/> شنیدن کلمه</button><small className="tahriri"><FormRun forms={lesson.forms} /> مثلِ {card.word}</small></div>
    </div>
    <div className="flash-nav">
      <button className="soft-btn" onClick={() => go(-1)} disabled={i % cards.length === 0}><ChevronRight /> قبلی</button>
      <span>{toFa(i % cards.length + 1)} / {toFa(cards.length)}</span>
      <button className="soft-btn" onClick={() => go(1)}>بعدی <ChevronLeft /></button>
    </div>
    <RoundComplete open={roundDone} text={`همهٔ ${toFa(cards.length)} فلش‌کارت این درس را دیدی.`} onAgain={() => { setRoundDone(false); setFlip(false); setI(0); }} />
  </div>;
};
