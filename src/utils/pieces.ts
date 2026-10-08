/**
 * موتور قطعه‌های مغناطیسی و قوانین اتصال حروف (بر پایهٔ شکل‌های آموزشی کتاب اول)
 */
export const ZWJ = '\u200D';
export const ZWNJ = '\u200C';
export const HARAKAT = new Set(['َ', 'ِ', 'ُ', 'ّ']);
/** حروفی که به حرف بعد نمی‌چسبند */
export const NON_CONNECTORS = new Set(['ا', 'آ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'و']);
/** حروف چهارشکلی کتاب */
export const FOUR_FORM = new Set(['ه', 'ع', 'غ']);
/** حروف تک‌شکلِ چسبان (شکل آموزشی یکی است) */
export const FLEX = new Set(['ط', 'ظ']);

export type PieceKind =
  | 'start'      // آ اَ اِ اُ او : فقط اول کلمه، بعدش می‌شود ادامه داد
  | 'startCont'  // ایـ : فقط اول کلمه، باید ادامه پیدا کند
  | 'startEnd'   // ای : اول و آخر
  | 'nonfinal'   // سـ : غیرآخر
  | 'final'      // س : آخر
  | 'single'     // د ر ز ... : یک شکل، نمی‌چسبد به بعد
  | 'flex'       // ط ظ
  | 'init4'      // هـ
  | 'mid'        // ـهـ
  | 'endJoin'    // ـه (آخر چسبان)
  | 'alone4'     // ه (آخر تنها)
  | 'mark';      // ـَ ـِ ـُ ـّ

export interface PieceDef { token: string; base: string; kind: PieceKind; glyph: string; notFirst?: boolean }

const letterOf = (t: string) => t.replace(/ـ/g, '');

export function parseToken(token: string): PieceDef {
  const t = token;
  const toGlyph = (s: string) => s.replace(/^ـ/, ZWJ).replace(/ـ$/, ZWJ);
  if (['آ', 'اَ', 'اِ', 'اُ', 'او'].includes(t)) return { token: t, base: t, kind: 'start', glyph: t };
  if (t === 'ایـ') return { token: t, base: 'ای', kind: 'startCont', glyph: 'ای' + ZWJ };
  if (t === 'ای') return { token: t, base: 'ای', kind: 'startEnd', glyph: 'ای' };
  // «خوا» در کتاب یک نشانهٔ یک‌تکه است؛ به حرف بعد نمی‌چسبد ولی کلمه بعدش ادامه دارد (خواب، خواهَر)
  if (t === 'خوا') return { token: t, base: 'خوا', kind: 'single', glyph: 'خوا' };
  if (t === 'ا') return { token: t, base: 'ا', kind: 'single', glyph: 'ا', notFirst: true };
  if (t.length === 2 && t[0] === 'ـ' && HARAKAT.has(t[1])) return { token: t, base: t[1], kind: 'mark', glyph: t };
  const c = letterOf(t);
  const lead = t.startsWith('ـ'), tail = t.endsWith('ـ');
  if (NON_CONNECTORS.has(c)) return { token: t, base: c, kind: 'single', glyph: c };
  if (FLEX.has(c)) return { token: t, base: c, kind: 'flex', glyph: c };
  if (FOUR_FORM.has(c)) {
    const kind: PieceKind = lead && tail ? 'mid' : lead ? 'endJoin' : tail ? 'init4' : 'alone4';
    return { token: t, base: c, kind, glyph: toGlyph(t) };
  }
  if (tail) return { token: t, base: c, kind: 'nonfinal', glyph: c + ZWJ };
  // «ی» آخر در کتاب شکل آخرِ چسبان دارد
  return { token: t, base: c, kind: 'final', glyph: c === 'ی' ? ZWJ + 'ی' : c };
}

const START_ONLY: PieceKind[] = ['start', 'startCont', 'startEnd'];
const CONTINUES: PieceKind[] = ['start', 'startCont', 'nonfinal', 'single', 'flex', 'init4', 'mid'];
const CAN_END: PieceKind[] = ['start', 'startEnd', 'final', 'single', 'flex', 'endJoin', 'alone4'];
const CONNECTS_LEFT: PieceKind[] = ['startCont', 'nonfinal', 'flex', 'init4', 'mid'];

export const connectsLeft = (p: PieceDef) => CONNECTS_LEFT.includes(p.kind);

export interface Validation { ok: boolean; message?: string; zwnjBefore: Set<number> }

/** بررسی درستی یک دنبالهٔ قطعه‌ها از راست به چپ */
export function validateSequence(seq: PieceDef[]): Validation {
  const zwnjBefore = new Set<number>();
  let prev: PieceDef | null = null;
  let afterBreak = false;
  let letters = '';
  let marksSinceLetter = 0;
  for (let i = 0; i < seq.length; i++) {
    const p = seq[i];
    if (p.kind === 'mark') {
      if (!prev) return { ok: false, message: 'نشانهٔ صدا (اعراب) را بعد از یک حرف بگذار.', zwnjBefore };
      if (marksSinceLetter >= 2) return { ok: false, message: 'روی این حرف به اندازهٔ کافی نشانه گذاشته‌ای.', zwnjBefore };
      marksSinceLetter++;
      continue;
    }
    marksSinceLetter = 0;
    if (!prev) {
      if (p.notFirst) return { ok: false, message: 'اولِ کلمه «آ» یا «اَ» می‌آید، نه «ا».', zwnjBefore };
      if (p.kind === 'mid' || p.kind === 'endJoin') return { ok: false, message: `«${p.glyph}» به حرفِ قبل می‌چسبد؛ برای اولِ کلمه شکلِ «${letterOf(p.token)}${ZWJ}» را بردار.`, zwnjBefore };
    } else {
      afterBreak = false;
      if (!CONTINUES.includes(prev.kind)) {
        // تنها استثنا: «می» در اول فعل‌ها (می‌روم، می‌خوانَد)
        if (letters === 'می' && prev.base === 'ی' && !START_ONLY.includes(p.kind) && p.kind !== 'mid' && p.kind !== 'endJoin') {
          zwnjBefore.add(i); afterBreak = true;
        } else {
          return { ok: false, message: `«${prev.glyph}» شکلِ آخر است؛ بعد از آن حرفی نمی‌آید. برای ادامه، شکلِ غیرآخر را بردار.`, zwnjBefore };
        }
      }
      if (START_ONLY.includes(p.kind)) return { ok: false, message: `«${p.glyph}» فقط اولِ کلمه می‌آید.`, zwnjBefore };
      const joins = !afterBreak && connectsLeft(prev);
      if ((p.kind === 'mid' || p.kind === 'endJoin') && !joins)
        return { ok: false, message: `حرفِ قبلی به «${p.glyph}» نمی‌چسبد؛ شکلِ «${p.kind === 'mid' ? letterOf(p.token) + ZWJ : letterOf(p.token)}» را بردار.`, zwnjBefore };
      if ((p.kind === 'init4' || p.kind === 'alone4') && joins)
        return { ok: false, message: `اینجا حرف به حرفِ قبل می‌چسبد؛ شکلِ «${p.kind === 'init4' ? ZWJ + p.base + ZWJ : ZWJ + p.base}» را بردار.`, zwnjBefore };
    }
    letters += p.base;
    prev = p;
  }
  return { ok: true, zwnjBefore };
}

/** آیا کلمه می‌تواند اینجا تمام شود؟ */
export function finishProblem(seq: PieceDef[]): string | null {
  const letters = seq.filter(p => p.kind !== 'mark');
  if (!letters.length) return 'اول چند حرف روی خط بگذار.';
  const last = letters[letters.length - 1];
  if (CAN_END.includes(last.kind)) return null;
  const alt = last.kind === 'nonfinal' ? parseToken(last.base).glyph
    : last.kind === 'init4' ? last.base
    : last.kind === 'mid' ? ZWJ + last.base
    : last.kind === 'startCont' ? 'ای' : last.base;
  return `کلمه با «${last.glyph}» تمام نمی‌شود؛ برای آخرِ کلمه شکلِ «${alt}» را بگذار.`;
}

/** متن نمایشی کلمه برای شکل‌دهی خودکار فونت */
export function renderSequence(seq: PieceDef[]): string {
  const v = validateSequence(seq);
  let out = '';
  seq.forEach((p, i) => { if (v.zwnjBefore.has(i)) out += ZWNJ; out += p.base; });
  const letters = seq.filter(p => p.kind !== 'mark');
  const last = letters[letters.length - 1];
  if (last && connectsLeft(last)) out += ZWJ;
  return out;
}

export function plainWord(s: string): string {
  return s.replace(/[\u064B-\u0652\u0670]/g, '').replace(/[\u200C\u200D\u200F\u200E ـ]/g, '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
}
export const plainSequence = (seq: PieceDef[]) => plainWord(seq.filter(p => p.kind !== 'mark').map(p => p.base).join(''));

/** یک قطعه همراه با بازهٔ نویسه‌هایش در واژه (برای دیکته: کدام قطعه نشانهٔ درس است) */
export interface TokenSpan { token: string; start: number; end: number }

/** تبدیل یک واژهٔ اعراب‌دار به قطعه‌های آموزشی، همراه با جای هر قطعه در واژه */
export function wordToTokenSpans(word: string): TokenSpan[] {
  const chars = [...word];
  const spans: TokenSpan[] = [];
  const push = (token: string, start: number, end: number) => spans.push({ token, start, end });
  const nextLetterExists = (j: number) => {
    for (let k = j; k < chars.length; k++) {
      if (chars[k] === ZWNJ) return false;
      if (!HARAKAT.has(chars[k])) return true;
    }
    return false;
  };
  let prevConnects = false;
  let started = false;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === ZWNJ) { prevConnects = false; continue; }
    if (HARAKAT.has(c)) { push('ـ' + c, i, i + 1); continue; }
    if (!started) {
      started = true;
      if (c === 'ا' && HARAKAT.has(chars[i + 1]) && chars[i + 1] !== 'ّ') { push('ا' + chars[i + 1], i, i + 2); i++; prevConnects = false; continue; }
      if (c === 'ا' && chars[i + 1] === 'و') { push('او', i, i + 2); i++; prevConnects = false; continue; }
      if (c === 'ا' && chars[i + 1] === 'ی') { const n = nextLetterExists(i + 2); push(n ? 'ایـ' : 'ای', i, i + 2); i++; prevConnects = n; continue; }
    }
    if (c === 'خ' && chars[i + 1] === 'و' && chars[i + 2] === 'ا') { push('خوا', i, i + 3); i += 2; prevConnects = false; continue; }
    const next = nextLetterExists(i + 1);
    if (NON_CONNECTORS.has(c)) { push(c, i, i + 1); prevConnects = false; }
    else if (FLEX.has(c)) { push(c, i, i + 1); prevConnects = next; }
    else if (FOUR_FORM.has(c)) { push(prevConnects ? (next ? `ـ${c}ـ` : `ـ${c}`) : (next ? `${c}ـ` : c), i, i + 1); prevConnects = next; }
    else { push(next ? `${c}ـ` : c, i, i + 1); prevConnects = next; }
  }
  return spans;
}

/** تبدیل یک واژهٔ اعراب‌دار به قطعه‌های آموزشی (برای چیدن خودکار روی تخته) */
export function wordToTokens(word: string): string[] {
  return wordToTokenSpans(word).map(s => s.token);
}

/** جایگاه تشدید نسبت به حروف کلمه، از راست به چپ. برای پذیرش دقیق تشدید در تخته. */
export function tashdidProfile(value: string | PieceDef[]): string {
  let letterIndex = -1;
  const positions: number[] = [];
  if (typeof value === 'string') {
    for (const c of [...value]) {
      if (c === 'ّ') positions.push(letterIndex);
      else if (!HARAKAT.has(c) && c !== ZWNJ && c !== ZWJ && c !== 'ـ') letterIndex++;
    }
  } else {
    for (const piece of value) {
      if (piece.kind === 'mark') { if (piece.base === 'ّ') positions.push(letterIndex); }
      else letterIndex++;
    }
  }
  return positions.join(',');
}

const LETTER_LESSON: Record<string, number> = {
  'آ': 1, 'ا': 1, 'ب': 2, 'د': 4, 'م': 5, 'س': 6, 'ت': 8, 'ر': 9, 'ن': 10, 'ز': 12, 'ش': 14, 'ک': 17,
  'پ': 19, 'گ': 20, 'ف': 21, 'خ': 22, 'ق': 23, 'ل': 24, 'ج': 25, 'چ': 28, 'ژ': 29,
  'ص': 32, 'ذ': 33, 'ع': 34, 'ث': 35, 'ح': 36, 'ض': 37, 'ط': 38, 'غ': 39, 'ظ': 40,
  'َ': 3, 'ِ': 13, 'ُ': 16, 'ّ': 31,
};
/** واژه‌هایی که «و» در آن‌ها صدای «اُ» می‌دهد (درس ۲۶) */
const O_WORDS = new Set([
  'تو', 'دو', 'خود', 'خودکار', 'خودم', 'خورشید', 'خوش', 'خوشحال', 'خوشبو',
  'خوراک', 'نوروز', 'نو', 'خوشمزه', 'میخورد', 'خوردن', 'خورد', 'دوشنبه',
  'دوچرخه', 'خودرو',
]);

/** هر نشانه (شمارهٔ درس) روی کدام نویسهٔ واژه است؛ نمایه‌ها روی واژهٔ بدون ZWJ حساب می‌شوند */
export function signMap(word: string): { index: number; sign: number }[] {
  const chars = [...word].filter(c => c !== ZWJ);
  const plain = plainWord(word);
  const out: { index: number; sign: number }[] = [];
  let i = 0;
  const bump = (n: number) => { out.push({ index: i, sign: n }); };
  const isLetter = (c?: string) => !!c && !HARAKAT.has(c) && c !== ZWNJ;
  for (i = 0; i < chars.length; i++) {
    const c = chars[i], prev = chars[i - 1], next = chars[i + 1];
    const prevBase = [...chars.slice(0, i)].reverse().find(x => isLetter(x));
    const nextBase = chars.slice(i + 1).find(x => isLetter(x));
    const atStart = i === 0 || prev === ZWNJ;
    if (c === ZWNJ) continue;
    if (LETTER_LESSON[c] !== undefined) bump(LETTER_LESSON[c]);
    if (c === 'ا' && atStart && next === 'و') bump(7);
    if (c === 'ا' && atStart && next === 'ی') bump(11);
    if (c === 'و') {
      if (O_WORDS.has(plain) && (prevBase === 'خ' || prevBase === 'د' || prevBase === 'ت' || prevBase === 'ن')) bump(26);
      else if (prevBase === 'خ' && nextBase === 'ا') bump(30);
      else if (i === 1 && chars[0] === 'ا') { /* «او» اول کلمه */ }
      else if (atStart || next === 'َ' || next === 'ِ' || next === 'ا' || prev === 'َ' || prev === 'ا' || prev === 'آ' || prev === 'ی') bump(18);
      else if (!next && prev && prev !== 'ا') bump(18); // مثل «دارو»: وِ پایانی صدای «او» دارد
      else bump(7);
    }
    if (c === 'ی') {
      if (i === 1 && chars[0] === 'ا') { /* «ای» اول کلمه */ }
      else if (atStart || next === 'َ' || next === 'ِ' || next === 'ُ' || next === 'ا' || prev === 'َ' || ((prev === 'ا' || prev === 'آ' || prev === 'و') && isLetter(next))) bump(15);
      else bump(11);
    }
    if (c === 'ه') {
      const isFinal = !chars.slice(i + 1).some(isLetter);
      if (isFinal && prev === 'ّ' && i > 1) bump(13);
      else if (isFinal && prev === 'و' && chars[i - 2] === 'ی') bump(13); // میوه
      else if (isFinal && isLetter(prev) && !['ا', 'و'].includes(prev!) && i > 1) bump(13);
      else bump(27);
    }
  }
  return out;
}

/** همهٔ نشانه‌هایی (شمارهٔ درس) که این واژه دارد؛ مثلاً «چَتر» ← {۳, ۹, ۲۸} */
export function signsOfWord(word: string): Set<number> {
  const out = new Set<number>(signMap(word).map(m => m.sign));
  if (!out.size) out.add(1);
  return out;
}

/** نخستین درسی که همه نشانه‌های این واژه در آن آموزش داده شده‌اند */
export function lessonOfWord(word: string): number {
  return Math.max(1, ...signsOfWord(word));
}
/** آیا این واژه نشانهٔ درسِ داده‌شده را دارد؟ */
export const hasSign = (word: string, order: number) => signsOfWord(word).has(order);
