/**
 * بخش‌بخش کردن (هجابندی) واژه‌های فارسی و جدا کردن صداهای هر بخش، به سبک کتاب نگارش اول.
 *
 * قاعده‌های علمی هجای فارسی که این‌جا پیاده شده‌اند:
 * ۱) هر هجا با یک «صامت» شروع می‌شود و فقط یک «مصوّت» دارد. (در آغاز واژه، «آ اَ اِ اُ او ای» خودشان
 *    صامتِ همزه + مصوّت‌اند؛ برای همین در کتاب یک خانه دارند.)
 * ۲) الگوهای هجا فقط سه تاست: صامت+مصوّت (CV)، صامت+مصوّت+صامت (CVC)، صامت+مصوّت+دو صامت (CVCC).
 * ۳) پس صامتی که درست پیش از یک مصوّت آمده، آغازِ هجای همان مصوّت است و صامت‌های پیش از آن
 *    پایانِ هجای قبلی‌اند. (بَ‌را‌دَر ، دَن‌دان ، گُن‌جِشک)
 * ۴) مصوّت‌ها: ـَ ـِ ـُ ، «ا» در میان/پایان، «و» و «ی» وقتی صدای «او / ای» می‌دهند، و «ه» پایانیِ
 *    بعد از صامت (صدای «اِ» مثل دانه). «و/ی» در آغاز واژه، بعد از مصوّت یا پیش از مصوّت صامت‌اند
 *    (وَطَن، سایه، حَیوان، دَریا). «ه» بعد از مصوّت یا در میان واژه صامت است (ماه، کوه، مَهتاب).
 * هر «خانهٔ صدا» همان خانه‌ای است که کودک در طبقهٔ سوم جدول کتاب می‌نویسد؛ اعرابِ ـَ ـِ ـُ خانهٔ
 * جدا با یک خط تیره دارند.
 */
export const ZWJ = '\u200D';
const MARKS = new Set(['\u064E', '\u0650', '\u064F']); // ـَ ـِ ـُ
const NON_CONNECT = new Set(['ا', 'آ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'و']);

export type CellKind = 'C' | 'V' | 'CV';
export interface SoundCell {
  /** شمارهٔ خانه در واژه */
  i: number;
  /** نویسهٔ خام (مثل «ب»، «ـَ» ، «آ») */
  text: string;
  kind: CellKind;
  mark: boolean;
  /** شکل نمایشیِ همین نویسه در همان جای واژه (با اتصال) */
  glyph: string;
  /** نویسهٔ مقایسه (برای حروف تکراری مثل «بابا») */
  key: string;
  /** شمارهٔ هجا */
  syl: number;
  /** شمارهٔ واحد لمسی در طبقهٔ اول (حرف + اعرابش) */
  unit: number;
}
export interface Syllable { index: number; cells: SoundCell[]; glyph: string; plain: string; units: number[] }
export interface TouchUnit { index: number; cells: SoundCell[]; glyph: string; syl: number }
export interface ParsedWord { word: string; plain: string; cells: SoundCell[]; units: TouchUnit[]; syllables: Syllable[] }

const baseLetter = (t: string) => [...t].filter(c => !MARKS.has(c)).pop() || t;
const connects = (t: string) => !NON_CONNECT.has(baseLetter(t));

/** تبدیل واژهٔ اعراب‌دار به خانه‌های صدا و هجاها */
export function parseSyllables(word: string): ParsedWord {
  const chars = [...word].filter(c => c !== ZWJ);
  if (chars.some(c => c === '\u0651' || c === '\u200C')) throw new Error(`واژهٔ «${word}» تشدید یا نیم‌فاصله دارد`);
  const raw: { text: string; kind: CellKind; mark: boolean }[] = [];
  const isLetterAt = (k: number) => k < chars.length && !MARKS.has(chars[k]);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i], next = chars[i + 1];
    if (MARKS.has(c)) { raw.push({ text: c, kind: 'V', mark: true }); continue; }
    if (i === 0) {
      if (c === 'آ') { raw.push({ text: 'آ', kind: 'CV', mark: false }); continue; }
      if (c === 'ا' && next && MARKS.has(next)) { raw.push({ text: c + next, kind: 'CV', mark: false }); i++; continue; }
      if (c === 'ا' && (next === 'و' || next === 'ی')) { raw.push({ text: c + next, kind: 'CV', mark: false }); i++; continue; }
    }
    // «خوا» یک صداست (خا)؛ «و»ی آن خوانده نمی‌شود، پس یک خانه می‌گیرد: خوا|ب ، خوا|هَر
    if (c === 'خ' && next === 'و' && chars[i + 2] === 'ا') { raw.push({ text: 'خوا', kind: 'CV', mark: false }); i += 2; continue; }
    const prev = raw[raw.length - 1];
    const afterVowel = !prev || prev.kind !== 'C';
    const beforeVowel = !!next && (MARKS.has(next) || next === 'ا');
    let kind: CellKind = 'C';
    if (c === 'ا') kind = 'V';
    else if (c === 'و' || c === 'ی') kind = (!prev || afterVowel || beforeVowel) ? 'C' : 'V';
    else if (c === 'ه') kind = (!isLetterAt(i + 1) && prev && prev.kind === 'C') ? 'V' : 'C';
    raw.push({ text: c, kind, mark: false });
  }
  // هجابندی: آغاز هر هجا = صامتِ درست پیش از مصوّت
  const nuclei: number[] = [];
  raw.forEach((r, k) => { if (r.kind !== 'C') { if (r.mark && k > 0 && raw[k - 1].kind === 'CV') return; nuclei.push(k); } });
  const starts = nuclei.map(k => raw[k].kind === 'CV' ? k : (k > 0 && raw[k - 1].kind === 'C' ? k - 1 : k));
  if (!starts.length) starts.push(0);
  starts[0] = 0;
  const sylOf = (k: number) => { let s = 0; starts.forEach((st, j) => { if (k >= st) s = j; }); return s; };

  // شکل نمایشی با اتصال
  const letterIdx = raw.map((r, k) => r.mark ? -1 : k).filter(k => k >= 0);
  const joinInfo = new Map<number, { prev: boolean; next: boolean }>();
  letterIdx.forEach((k, p) => {
    const prevK = letterIdx[p - 1], nextK = letterIdx[p + 1];
    joinInfo.set(k, { prev: prevK !== undefined && connects(raw[prevK].text), next: nextK !== undefined && connects(raw[k].text) });
  });
  let unit = -1;
  const cells: SoundCell[] = raw.map((r, k) => {
    if (!r.mark) unit++;
    const j = joinInfo.get(k);
    const glyph = r.mark ? '\u0640' + r.text : (j?.prev ? ZWJ : '') + r.text + (j?.next ? ZWJ : '');
    return { i: k, text: r.text, kind: r.kind, mark: r.mark, glyph, key: r.text, syl: sylOf(k), unit: Math.max(0, unit) };
  });
  const units: TouchUnit[] = [];
  cells.forEach(c => {
    if (!units[c.unit]) units[c.unit] = { index: c.unit, cells: [], glyph: '', syl: c.syl };
    units[c.unit].cells.push(c);
  });
  units.forEach(u => {
    const letter = u.cells.find(c => !c.mark)!; const marks = u.cells.filter(c => c.mark).map(c => c.text).join('');
    const j = joinInfo.get(letter.i);
    u.glyph = (j?.prev ? ZWJ : '') + letter.text + marks + (j?.next ? ZWJ : '');
  });
  const syllables: Syllable[] = starts.map((_, s) => {
    const sc = cells.filter(c => c.syl === s);
    const firstL = sc.find(c => !c.mark), lastL = [...sc].reverse().find(c => !c.mark);
    const jf = firstL ? joinInfo.get(firstL.i) : undefined, jl = lastL ? joinInfo.get(lastL.i) : undefined;
    const plain = sc.map(c => c.text).join('');
    return { index: s, cells: sc, plain, glyph: (jf?.prev ? ZWJ : '') + plain + (jl?.next ? ZWJ : ''), units: [...new Set(sc.map(c => c.unit))] };
  });
  return { word, plain: chars.join(''), cells, units, syllables };
}

/**
 * واژه‌های تمرین بخش‌بخش کردن برای هر درسِ کتاب (۳ تا ۴ واژه، اغلب همان واژه‌های صفحه‌های کتاب).
 * درس‌های ۱ تا ۳ کتاب فقط «صداهای هر کلمه» (مثل صفحهٔ ۲۸، ۳۴ و ۴۰)؛ از درس ۴ جدول سه‌طبقه (صفحهٔ ۴۸، ۵۰، ۵۵).
 */
export const SYLLABLE_WORDS: Record<number, string[]> = {
  1: ['آب', 'بابا', 'با'],
  2: ['باد', 'داد', 'بَد', 'اَبر'],
  3: ['اَسب', 'آمَد', 'سَبَد', 'بادام'],
  4: ['دَست', 'تاب', 'بادام', 'دوست'],
  5: ['بَرادَر', 'اَبرو', 'دَندان', 'آبادان'],
  6: ['آبی', 'بیداری', 'سَرباز', 'زیبا'],
  7: ['آتَش', 'شانه', 'سِتاره', 'شیر'],
  8: ['دُرُست', 'اُمید', 'شُتُر', 'دَریا'],
  9: ['کَبوتَر', 'اُردَک', 'کودَک', 'سَماوَر'],
  10: ['پَرَنده', 'پَروانه', 'بُزُرگ', 'نَرگِس'],
  11: ['خَرگوش', 'دَفتَر', 'فِرِشته', 'رودخانه'],
  12: ['بُلبُل', 'سَلام', 'قاشُق', 'گُل'],
  13: ['گُنجِشک', 'مَسجِد', 'جوراب', 'نارِنج'],
  14: ['مَهتاب', 'مِهرَبان', 'چِشمه', 'چوپان'],
  15: ['ژاله', 'ژاکَت', 'مُژده', 'بیژَن'],
  16: ['بازار', 'نَردِبان', 'دانِشمَند', 'کَبوتَر'],
  17: ['صَدَف', 'صابون', 'صورَت', 'آذَر'],
  18: ['عَروسَک', 'ساعَت', 'عَسَل', 'کَثیف'],
  19: ['حَلَزون', 'صُبحانه', 'حَیوان', 'تِمساح'],
  20: ['طوطی', 'طَناب', 'قَطار', 'مَریض'],
  21: ['مُرغابی', 'کَلاغ', 'غُنچه', 'چِراغ'],
  22: ['ظَرف', 'مَنظَره', 'حافِظ', 'ناظِم'],
};
/** درس‌های و، و(اُ) و خوا: فقط از واژه‌های تعیین‌شدهٔ همان درس (بی‌تشدید و قابل بخش‌کردن) */
export const SYLLABLE_EXCEPTION_WORDS: Record<number, string[]> = {
  18: ['سَوار', 'جَواب', 'دیوار', 'جَوان'],
  26: ['خوراک', 'خورشید', 'نوروز', 'خوشمَزه'],
  30: ['خواب', 'خواهَر', 'خوابید', 'خواهِش'],
};
export const SOUND_ONLY_UNTIL_BOOK = 3;

/** در جدول بخش‌بندی، واژه‌های فشردهٔ کتابی برای لمس و جداسازی مناسب نیستند. */
export const SYLLABLE_EXCLUDED_WORDS = new Set(['گُنجِشک', 'مَسجِد']);
