/**
 * تقویم محتوایی جزیره الفبا
 * ترتیب نشانه‌ها دقیقاً مطابق جدول بودجه‌بندی کتاب «نگارش فارسی اول دبستان» (۱۴۰۴) است (نه ترتیب الفبایی):
 * درس ۶: ای، ز — درس ۷: اِ ـه، ش — درس ۱۷: ص، ذ — درس ۱۸: ع، ث
 * بخش ۱: «آموزش نشانه‌ها ۱» (۳۱ درس) — بخش ۲: «آموزش نشانه‌ها ۲» (۹ درس).
 * همه تمرین‌های برنامه فقط از واژه‌هایی استفاده می‌کنند که همه نشانه‌هایشان تا درسِ انتخاب‌شده آموزش داده شده باشد.
 */

const ZWJ = '\u200D';
/** شکل‌های نمایشی بدون کشیده؛ با ZWJ تا خود glyph فونت تحریری نمایش داده شود */
export const G = {
  init: (c: string) => c + ZWJ,
  med: (c: string) => ZWJ + c + ZWJ,
  fin: (c: string) => ZWJ + c,
  mark: (m: string) => 'ـ' + m,
};

/**
 * شکل آغازینِ کودکانه برای «بـ نـ تـ مـ هـ»
 * این‌ها glyph خود فونت تحریری‌اند: بـ و نـ با نقطهٔ کتابی، تـ دونقطه، مـ گردِ روی خط و هـ دوچشم؛ دقیقاً به سبک کتاب نگارش اول.
 * اگر روزی خواستید به حالت قبل برگردید، کافی است KID_INIT را خالی کنید.
 */
/* «بـ نـ تـ» با شکل آغازیِ خود فونت نمایش داده می‌شوند (glyph کشیدهٔ اختصاصی حذف شد). */
export const KID_INIT: Record<string, string> = { 'م': '\uE103', 'ه': '\uE104' };
/** حروفی که شکل آغازی‌شان باید دقیقاً glyph خود فونت باشد، بدون کشیده */
const FONT_INIT = new Set(['ب', 'ن', 'ت']);
const CONNECTOR = new Set([ZWJ, '\u0640']);
/** شکل نمایشی یک قطعهٔ تک (مثل «مـ» یا «هـ») با glyph کودکانهٔ کتاب؛ فقط برای نمایش، نه برای ساختن متن کلمه */
/** شکل میانی و آخرِ کتابیِ «ه» (صفحهٔ ۹۱ کتاب): ـهـ قلاب رو به پایین، ـه برآمدگی کوچک. فقط برای قطعه‌های تک؛ در کلمهٔ وصل‌شده همان فونت. */
export const KID_FORMS: Record<string, string> = { [ZWJ + 'ه' + ZWJ]: '\uE106', ['\u0640' + 'ه' + '\u0640']: '\uE106', [ZWJ + 'ه']: '\uE107', ['\u0640' + 'ه']: '\uE107' };
/** نمایش یک قطعهٔ آموزشی با glyph خود فونت، حتی وقتی کشیده به صورت ZWJ ذخیره شده باشد. */
export const kidGlyph = (g: string) => {
  const normalized = g.replace(/\u0640/g, ZWJ);
  if (KID_FORMS[normalized]) return KID_FORMS[normalized];
  const init = normalized.match(/^([بنمهت])\u200D([\u064B-\u0652\u0670اوی]*)$/);
  if (init && KID_INIT[init[1]]) return KID_INIT[init[1]] + init[2];
  // اعراب باید روی خود حرف بنشیند؛ اگر بعد از ZWJ بیاید فونت آن را پایینِ حرف می‌اندازد (بَ → بِ)
  if (init && FONT_INIT.has(init[1])) return init[2] ? init[1] + init[2] + ZWJ : normalized;
  const markFirst = normalized.match(/^([بنمهت])([\u064B-\u0652\u0670]+)\u200D$/);
  if (markFirst && KID_INIT[markFirst[1]]) return KID_INIT[markFirst[1]] + markFirst[2];
  return g;
};
/** جایگزینی امن برای همهٔ نمایش‌های مستقل نشانه‌ها؛ متن واژه‌ها دست‌نخورده می‌ماند. */
export const kidDisplay = (text: string) => text.split(/(\s+)/).map(part => /^\s+$/.test(part) ? part : kidGlyph(part)).join('');

export interface LikeWord { word: string; emoji: string }

export interface CurriculumLesson {
  id: string;
  order: number;
  part: 1 | 2;
  /** برچسب کتابی نشانه، مثل «سـ س» */
  sign: string;
  /** نام خواندنی برای تلفظ */
  spoken: string;
  /** شکل‌های نوشتاری نشانه برای نمایش با فونت تحریری */
  forms: string[];
  /** نویسه‌هایی که حضورشان در واژه یعنی این نشانه را دارد (برای ساخت گزینه‌های انحرافی) */
  chars: string[];
  /** واژه‌های کلیدی و تصویری درس (برای «چی مثل چی» و فلش‌کارت) */
  likeWords: LikeWord[];
  /** هفتهٔ آموزشی از ابتدای مهر */
  week: number;
  /** شمارهٔ درس در کتاب نگارش فارسی اول (۱ تا ۲۲) */
  book: number;
}

const L = (order: number, sign: string, spoken: string, forms: string[], chars: string[], like: string): Omit<CurriculumLesson, 'week' | 'part' | 'id' | 'book'> & { order: number } => ({
  order, sign, spoken, forms, chars,
  likeWords: like.split(' ').filter(Boolean).map(p => { const [word, emoji] = p.split('|'); return { word, emoji: emoji || '' }; }),
});

/** شکل‌های کتابی با کشیدهٔ واقعی، نه ZWJ؛ ZWJ در عنوان‌های چندشکلی باعث چسبیدن فرم‌ها به هم می‌شد. */
const two = (c: string) => [`${c}ـ`, c];
const four = (c: string) => [`${c}ـ`, `ـ${c}ـ`, `ـ${c}`, c];

const RAW = [
  L(1, 'آ ا', 'آ', ['آ', 'ا'], ['آ', 'ا'], 'آب|💧 آتَش|🔥 آهو|🦌 آسمان|🌌'),
  L(2, 'بـ ب', 'بِ', two('ب'), ['ب'], 'بابا|👨 باد|🌬️ بَرگ|🍃 باران|🌧️'),
  L(3, 'اَ ـَ', 'اَ', ['اَ', G.mark('َ')], ['َ'], 'اَبر|☁️ اَسب|🐎 اَنگور|🍇 اَرّه|🪚'),
  L(4, 'د', 'دال', ['د'], ['د'], 'دَست|✋ دَر|🚪 دَندان|🦷 دود|💨'),
  L(5, 'مـ م', 'میم', two('م'), ['م'], 'ماه|🌙 ماهی|🐟 مادَر|👩 موز|🍌'),
  L(6, 'سـ س', 'سین', two('س'), ['س'], 'سیب|🍎 سَبَد|🧺 سَگ|🐕 ساعَت|⏰'),
  L(7, 'او و', 'او', ['او', 'و'], ['و'], 'اوتوبوس|🚌 موش|🐭 توپ|⚽ گوش|👂'),
  L(8, 'تـ ت', 'تِ', two('ت'), ['ت'], 'توت|🍓 تاج|👑 تَبَر|🪓 تِلِفُن|☎️'),
  L(9, 'ر', 'رِ', ['ر'], ['ر'], 'مار|🐍 روباه|🦊 اَبر|☁️ دَر|🚪'),
  L(10, 'نـ ن', 'نون', two('ن'), ['ن'], 'نان|🍞 نَردِبان|🪜 نارِنگی|🍊 ناخُن|💅'),
  L(11, 'ایـ یـ ی ای', 'ای', ['ایـ', 'یـ', 'ی', 'ای'], ['ی'], 'ایران|🇮🇷 سیب|🍎 سینی|🍽️ بینی|👃'),
  L(12, 'ز', 'زِ', ['ز'], ['ز'], 'زَنبور|🐝 میز|🪑 سَرباز|💂 زَمین|🌍'),
  L(13, 'اِ ِ ـه ه', 'اِ', ['اِ', 'ِ', 'ـه', 'ه'], ['ِ', 'ه'], 'اِمام|🧑 مِداد|✏️ دانه|🌱 سِتاره|⭐'),
  L(14, 'شـ ش', 'شین', two('ش'), ['ش'], 'شیر|🦁 شانه|🪮 آتَش|🔥 تَراش|✏️'),
  L(15, 'یـ ی', 'یِ', ['یـ', 'ی'], ['ی'], 'یَخ|🧊 یوزپَلَنگ|🐆 یویو|🪀 کَیک|🍰'),
  L(16, 'اُ ـُ', 'اُ', ['اُ', G.mark('ُ')], ['ُ'], 'اُردَک|🦆 گُل|🌸 شُتُر|🐫 گُربه|🐈'),
  L(17, 'کـ ک', 'کاف', two('ک'), ['ک'], 'کِتاب|📘 کَفش|👟 کَبوتَر|🕊️ موشَک|🚀'),
  L(18, 'و', 'واو', ['و'], ['و'], 'داوَر|⚖️ گاو|🐄 هَوا|🌬️ دَوا|💊 دارو|🧴 ناودان|🚰 روان|🏃 جَوان|🧒 جَواب|💬 دیوار|🧱 سَوار|🏇 نَوار|🎞️'),
  L(19, 'پـ پ', 'پِ', two('پ'), ['پ'], 'پَروانه|🦋 پا|🦶 توپ|⚽ پَرَنده|🐦'),
  L(20, 'گـ گ', 'گاف', two('گ'), ['گ'], 'گُل|🌸 گُربه|🐈 سَگ|🐕 گاو|🐄'),
  L(21, 'فـ ف', 'فِ', two('ف'), ['ف'], 'فیل|🐘 فانوس|🏮 بَرف|❄️ کَفش|👟'),
  L(22, 'خـ خ', 'خِ', two('خ'), ['خ'], 'خَرگوش|🐰 خانه|🏠 خُروس|🐓 یَخ|🧊'),
  L(23, 'قـ ق', 'قاف', two('ق'), ['ق'], 'قایِق|⛵ قاشُق|🥄 قورباغه|🐸 بُشقاب|🍽️'),
  L(24, 'لـ ل', 'لام', two('ل'), ['ل'], 'لیمو|🍋 لاک‌پُشت|🐢 گُل|🌸 فیل|🐘'),
  L(25, 'جـ ج', 'جیم', two('ج'), ['ج'], 'جوجه|🐥 جوراب|🧦 تاج|👑 هَویج|🥕'),
  L(26, 'ـو (اُ)', 'واوِ اُ', ['و'], ['و'], 'خوش|😊 خود|🧍 خوشحال|😄 خوشمَزه|😋 خوراک|🍲 خودَم|🙋 خورشید|☀️ نو|🆕 نوروز|🌷'),
  L(27, 'هـ ـهـ ـه ه', 'هِ', four('ه'), ['ه'], 'هَواپیما|✈️ ماه|🌙 کوه|⛰️ هَویج|🥕'),
  L(28, 'چـ چ', 'چِ', two('چ'), ['چ'], 'چَتر|☂️ چای|🍵 قیچی|✂️ چَکُش|🔨'),
  L(29, 'ژ', 'ژِ', ['ژ'], ['ژ'], 'ژاکَت|🧥 مُژه|👁️ ژِله|🍮 دِژ|🏰'),
  L(30, 'خوا', 'خوا', ['خوا'], ['خوا'], 'خواب|😴 خواهَر|👧 خوابیدَن|🛌 خواهِش|🙏 خواند|📖 خوابید|🛌'),
  L(31, 'ـّ', 'تَشدید', [G.mark('ّ')], ['ّ'], 'اَرّه|🪚 بَچّه|👶 سِکّه|🪙 بَرّه|🐑'),
  L(32, 'صـ ص', 'صاد', two('ص'), ['ص'], 'صابون|🧼 صَدَف|🐚 صَندوق|🧰 صورَت|🙂'),
  L(33, 'ذ', 'ذال', ['ذ'], ['ذ'], 'اَذان|🕌 آذَر|🍂 کاغَذ|📄 ذُرَّت|🌽'),
  L(34, 'عـ ـعـ ـع ع', 'عین', four('ع'), ['ع'], 'عَسَل|🍯 عَروسَک|🪆 شَمع|🕯️ ساعَت|⏰'),
  L(35, 'ثـ ث', 'ثِ', two('ث'), ['ث'], 'مُثَلَّث|🔺 ثانیه|⏱️ کَثیف|🗑️'),
  L(36, 'حـ ح', 'حِ', two('ح'), ['ح'], 'حَلَزون|🐌 حوض|⛲ صُبح|🌅 حَمّام|🛁'),
  L(37, 'ضـ ض', 'ضاد', two('ض'), ['ض'], 'مَریض|🤒 قاضی|⚖️ فَضا|🪐 حوض|⛲'),
  L(38, 'ط', 'طا', ['ط'], ['ط'], 'طوطی|🦜 طَناب|🪢 قَطار|🚂 طَبل|🥁'),
  L(39, 'غـ ـغـ ـغ غ', 'غین', four('غ'), ['غ'], 'کَلاغ|🐦‍⬛ غَذا|🍲 باغ|🌳 مُرغ|🐔'),
  L(40, 'ظ', 'ظا', ['ظ'], ['ظ'], 'ظَرف|🥣 ظُهر|🕛 حافِظ|📜'),
];

/** هر نشانه در کدام درسِ کتاب نگارش اول است (ترتیب جدول بودجه‌بندی کتاب) */
const BOOK_LESSON_BY_ORDER = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 17, 17, 18, 18, 19, 20, 20, 21, 22];
export const bookLessonOf = (order: number) => BOOK_LESSON_BY_ORDER[Math.max(1, Math.min(40, order))];
/** آخرین نشانهٔ یک درسِ کتاب */
export const lastOrderOfBook = (book: number) => { let o = 1; for (let i = 1; i <= 40; i++) if (BOOK_LESSON_BY_ORDER[i] <= book) o = i; return o; };

export const CURRICULUM: CurriculumLesson[] = RAW.map(r => ({
  ...r,
  sign: r.sign,
  forms: r.forms,
  id: `l${String(r.order).padStart(2, '0')}`,
  book: BOOK_LESSON_BY_ORDER[r.order],
  part: r.order <= 31 ? 1 : 2,
  // سه هفته اول مهر: نگاره‌ها. نشانه‌های ۱ تا پایان بهمن، نشانه‌های ۲ در اسفند.
  week: r.order <= 31 ? 4 + Math.floor((r.order - 1) * 19 / 31) : 23 + Math.floor((r.order - 32) * 4 / 9),
}));

export const lessonForOrder = (order: number) => CURRICULUM.find(l => l.order === order) || CURRICULUM[0];

const PERSIAN_MONTHS = ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت', 'خرداد'];
/** برچسب تقریبی تقویمی هر هفته: «هفته دوم آبان» */
export function weekLabel(week: number): string {
  const monthIndex = Math.min(PERSIAN_MONTHS.length - 1, Math.floor((week - 1) / 4.3));
  const weekInMonth = Math.min(4, Math.floor((week - 1) - monthIndex * 4.3) + 1);
  const names = ['اول', 'دوم', 'سوم', 'چهارم'];
  return `هفته ${names[Math.max(0, weekInMonth - 1)]} ${PERSIAN_MONTHS[monthIndex]}`;
}

/** یافتن اول مهر سال تحصیلی جاری */
function schoolYearStart(today = new Date()): Date {
  const find = (year: number) => {
    try {
      const fmt = new Intl.DateTimeFormat('en-US-u-ca-persian', { month: 'numeric', day: 'numeric' });
      for (let d = 19; d <= 25; d++) {
        const date = new Date(year, 8, d);
        const parts = fmt.formatToParts(date);
        const m = parts.find(p => p.type === 'month')?.value;
        const dd = parts.find(p => p.type === 'day')?.value;
        if (m === '7' && dd === '1') return date;
      }
    } catch { /* ignore */ }
    return new Date(year, 8, 23);
  };
  const thisYear = find(today.getFullYear());
  return today >= thisYear ? thisYear : find(today.getFullYear() - 1);
}

/** درسی که طبق بودجه‌بندی امروز باید در کلاس تدریس شود */
export function lessonForToday(today = new Date()): number {
  const start = schoolYearStart(today);
  const week = Math.floor((today.getTime() - start.getTime()) / (7 * 86400000)) + 1;
  let order = 1;
  for (const l of CURRICULUM) if (l.week <= week) order = l.order;
  return order;
}
export function currentSchoolWeek(today = new Date()): number {
  const start = schoolYearStart(today);
  return Math.floor((today.getTime() - start.getTime()) / (7 * 86400000)) + 1;
}

/** جعبهٔ حروف: دکمه‌ها به ترتیب کتاب، هر دکمه همه شکل‌های نوشتاری آن نشانه را دارد */
export interface BoxKey { id: string; lesson: number; pieces: string[]; label?: string; hint?: string }
export const LETTER_BOX: BoxKey[] = [
  { id: 'alef', lesson: 1, pieces: ['آ', 'ا'] },
  { id: 'be', lesson: 2, pieces: ['بـ', 'ب'] },
  { id: 'a', lesson: 3, pieces: ['اَ', 'ـَ'] },
  { id: 'dal', lesson: 4, pieces: ['د'] },
  { id: 'mim', lesson: 5, pieces: ['مـ', 'م'] },
  { id: 'sin', lesson: 6, pieces: ['سـ', 'س'] },
  { id: 'u', lesson: 7, pieces: ['او', 'و'] },
  { id: 'te', lesson: 8, pieces: ['تـ', 'ت'] },
  { id: 're', lesson: 9, pieces: ['ر'] },
  { id: 'noon', lesson: 10, pieces: ['نـ', 'ن'] },
  { id: 'ye', lesson: 11, pieces: ['ایـ', 'یـ', 'ی', 'ای'] },
  { id: 'ze', lesson: 12, pieces: ['ز'] },
  { id: 'e', lesson: 13, pieces: ['اِ', 'ـِ'] },
  { id: 'shin', lesson: 14, pieces: ['شـ', 'ش'] },
  { id: 'o', lesson: 16, pieces: ['اُ', 'ـُ'] },
  { id: 'kaf', lesson: 17, pieces: ['کـ', 'ک'] },
  { id: 'vav', lesson: 18, pieces: ['و'], label: 'و', hint: 'مثل دارو، گاو، هَوا' },
  { id: 'pe', lesson: 19, pieces: ['پـ', 'پ'] },
  { id: 'gaf', lesson: 20, pieces: ['گـ', 'گ'] },
  { id: 'fe', lesson: 21, pieces: ['فـ', 'ف'] },
  { id: 'khe', lesson: 22, pieces: ['خـ', 'خ'] },
  { id: 'ghaf', lesson: 23, pieces: ['قـ', 'ق'] },
  { id: 'lam', lesson: 24, pieces: ['لـ', 'ل'] },
  { id: 'jim', lesson: 25, pieces: ['جـ', 'ج'] },
  { id: 'u_o', lesson: 26, pieces: ['و'], label: 'و(اُ)', hint: 'مثل خوش، خود، نو' },
  { id: 'he', lesson: 27, pieces: ['هـ', 'ـهـ', 'ـه', 'ه'] },
  { id: 'che', lesson: 28, pieces: ['چـ', 'چ'] },
  { id: 'zhe', lesson: 29, pieces: ['ژ'] },
  { id: 'kha', lesson: 30, pieces: ['خوا'], label: 'خوا', hint: 'مثل خواب، خواهَر' },
  { id: 'tashdid', lesson: 31, pieces: ['ـّ'] },
  { id: 'sad', lesson: 32, pieces: ['صـ', 'ص'] },
  { id: 'zal', lesson: 33, pieces: ['ذ'] },
  { id: 'eyn', lesson: 34, pieces: ['عـ', 'ـعـ', 'ـع', 'ع'] },
  { id: 'se', lesson: 35, pieces: ['ثـ', 'ث'] },
  { id: 'he2', lesson: 36, pieces: ['حـ', 'ح'] },
  { id: 'zad', lesson: 37, pieces: ['ضـ', 'ض'] },
  { id: 'ta', lesson: 38, pieces: ['ط'] },
  { id: 'gheyn', lesson: 39, pieces: ['غـ', 'ـغـ', 'ـغ', 'غ'] },
  { id: 'za', lesson: 40, pieces: ['ظ'] },
];
