/**
 * بانک واژه‌های کلاس اول (اعراب‌گذاری‌شده به سبک کتاب).
 * درسِ «باز شدن» هر واژه به‌طور خودکار از روی نشانه‌هایش محاسبه می‌شود؛
 * پس هیچ تمرینی واژه‌ای با نشانهٔ آموزش‌داده‌نشده نشان نمی‌دهد.
 */
import { hasSign, lessonOfWord, plainWord, signMap, wordToTokenSpans, wordToTokens, ZWJ, ZWNJ, parseToken, connectsLeft } from '../utils/pieces';
import { BOARD_WORDS } from './boardWords';

import { bookLessonOf } from './curriculum';

export interface WordEntry { id: string; word: string; plain: string; emoji: string; lesson: number; tokens: string[]; /** شمارهٔ درس کتاب نگارش که این واژه در آن آمده */ book?: number }
/**
 * واژه‌های هر درسِ کتاب «نگارش فارسی اول دبستان» (۱۴۰۴)، به همان ترتیبی که در صفحه‌های «بنویس / کامل کن» آمده‌اند.
 * تمرین‌های هر درس اول از همین واژه‌ها ساخته می‌شوند. واژه‌ای که نشانهٔ آموزش‌داده‌نشده دارد
 * (مثلاً «اَمین» در درس ۲) خودکار تا درسِ مناسبِ خودش عقب می‌افتد.
 */
const BOOK_RAW: Record<number, string> = {
  1: `آب|💧 بابا|👨 با`,
  2: `باد|🌬️ داد دَر|🚪 اَبر|☁️ بَد`,
  3: `بام|🏠 دام بادام|🌰 آمَد آدَم|🧑 سَبَد|🧺 اَسب|🐎 سام سَد`,
  4: `بو|👃 سو بود سود مو|💇 دود|💨 تاب|🎠 دَست|✋ دوست|🤝 اَست بَست ماست|🥛 توت|🍓`,
  5: `مادَر|👩 اَبرو|🤨 سَرد|🥶 دَرس|📚 آرام سارا|👧 بَرادَر|👦 نان|🍞 باران|🌧️ آسمان|🌌 اَنار دَندان|🦷 آبان مَن|🙋`,
  6: `سیب|🍎 بیدار ایستاد ایران|🇮🇷 ایرانی اَمیر|👦 سینی|🍽️ آبی|🔵 سَرباز|💂 زود سَبز|🟢 آزاد زَمین|🌍 زیبا|🌸 زَرد|🟡 میز|🪑 زَنبور|🐝 سوزَن|🪡`,
  7: `اِمام ساده دانه|🌱 مِداد|✏️ اِنسان تازه دَبِستان|🏫 مَدرِسه|🏫 نَرده شَب|🌙 آش|🍲 شیر|🦁 تَراش|✏️ شانه|🪮 آتَش|🔥 نامه|✉️ سِتاره|⭐ رِشته ماشین|🚗 شیرین`,
  8: `یاس|🌼 دَریا|🌊 سایه|🌳 مِیمون|🐒 اُمید تُند مُدیر|🧑‍🏫 دُرُست|✅ شُتُر|🐫 بُز|🐐 دُرُشت دُم`,
  9: `کَبوتَر|🕊️ اُردَک|🦆 کَندو|🍯 کودَک|🧒 بادبادَک|🪁 کَباب|🍢 کُمُد|🗄️ کَریم وَرزِش|🏃 دَوَنده|🏃 سَوارکار|🏇 سَماوَر|🫖 نانوا|👨‍🍳 میوه|🍎`,
  10: `پَرواز|🕊️ پَرَستو|🐦 پَروانه|🦋 توپ|⚽ می‌پَزَد پَرَنده|🐦 پِدَر|👨 پَنیر|🧀 اَنگور|🍇 سَگ|🐕 زَنگ|🔔 گُرگ|🐺 بَرگ|🍃 گُربه|🐈 نَرگِس|🌼 بُزُرگ|🐘 آموزگار|👩‍🏫`,
  11: `بَرف|❄️ کیف|🎒 آفتابی|☀️ دَفتَر|📓 کَفش|👟 فَرزانه|👧 فِرِشته|👧 خُدا خوب|👍 دِرَخت|🌳 رودخانه|🏞️ خُروس|🐓 خَرگوش|🐰 خانه|🏠 شاخه|🌿`,
  12: `اُتاق|🚪 قاشُق|🥄 بُشقاب|🍽️ قوری|🫖 قایِق|⛵ قَندان|🍬 لانه|🪺 بُلبُل|🐦 گُل|🌸 لَبخَند|😊 فیل|🐘 سَلام|👋`,
  13: `بِرِنج|🍚 جوجه|🐥 نارِنج|🍊 گُنجِشک|🐦 مَسجِد|🕌 جوراب|🧦 کاج|🌲 جارو|🧹 خورشید|☀️ نوروز|🌷 خود می‌خورَد دو|2️⃣ خودکار|🖊️`,
  14: `مَهتاب|🌙 هَوا|🌬️ مِهرَبان|🥰 آهو|🦌 ماه|🌙 کوه|⛰️ چوپان|🧑‍🌾 قوچ|🐏 چِشمه|⛲ چَراگاه|🌾 می‌چَرَند قارچ|🍄 پَرچَم|🇮🇷 ماهی|🐟`,
  15: `ژاله|💧 مَنیژه|👧 بیژَن|👦 مُژده ماژیک|🖍️ ژاکَت|🧥 پَژمُرده|🥀 خواهَر|👧 خواب|😴 خوابید خواندَن|📖 می‌خوانَد`,
  16: `نَجّار|🧑‍🔧 کَفّاش|👞 قَنّاد|🍰 تَشَکُّر|🙏 بَنّا|🧱 نَقّاش|🎨 اَوَّل|🥇`,
  17: `صِدا|🔊 صاف صَدَف|🐚 صورَت|🙂 صابون|🧼 صَندوق|🧰 فَصل|🍂 گُذَشته اَذان|🕌 لَذَّت آذَر|🍂`,
  18: `عَلی|👦 مُعَلِّم|👩‍🏫 جَمع شُروع عَزیز|💛 مَعصومه|👧 عَمو|👨 عید|🎁 مَزرَعه|🌾 ثُرَیّا|👧 مِثل ثانیه|⏱️ کَثیف|🗑️ لِثه|🦷`,
  19: `حَلَزون|🐌 اِحساس حَرَکَت|🏃 صُبح|🌅 حِیوان|🐾 حوله|🧺 مُحَمَّد|👦 خوشحال|😄`,
  20: `حوض|⛲ مَریض|🤒 بَعضی وُضو|💧 رِضا|👦 حَیاط|🏡 خاطِرات اِنقِلاب قَطار|🚂 وَطَن|🇮🇷 طوطی|🦜 طَناب|🪢`,
  21: `مُرغابی|🦆 کَلاغ|🐦‍⬛ جیغ|😱 جُغد|🦉 تیغ|🌵`,
  22: `اَعظَم|👧 ظُلم مُواظِب ناظِم|🧑‍🏫 نَظم خُداحافِظی|👋`,
};


const RAW = `
آب|💧 بابا|👨 باب
بَد باد|🌬️ داد آباد
بام|🏠 دام آدَم|🧑 آمَد بادام|🌰 مَداد|✏️ دَم بَم
سَبَد|🧺 سَد|🏞️ بَس سَم
دود|💨 بو|👃 سود مو|💇 بوم|🖼️ موم|🕯️
توت|🍓 دَست|✋ تاب|🎠 تَب|🤒 دوست|🤝 تاس|🎲 تَمام بَست توتو
دَر|🚪 اَبر|☁️ مار|🐍 بَرد سَرد|🥶 مادَر|👩 بَرادَر|👦 بار تار دار سَر|🙂 رود|🏞️ مَرد|👨 آرام دَرس|📚 سارا|👧
نان|🍞 اَنار باران|🌧️ آسمان|🌌 مَن|🙋 تَن دَندان|🦷 دانا ماندَن سَمَند|🐴 آبان مانَند بَستَن مَتن آمَدَن اَبرو|🤨 نَمَد دامَن|👗
مِداد|✏️ اِسم نامه|✉️ دانه|🌱 سِتاره|⭐ ماسه|🏖️ دَسته بَسته|📦 تِمبر
شَب|🌙 شام|🍽️ شانه|🪮 آش|🍲 موش|🐭 آتَش|🔥 داداش|👦 شاد|😀 تَشت دوش|🚿 شَش|6️⃣ روشَن|💡 دانِش شِن
سیب|🍎 ایران|🇮🇷 سینی|🍽️ بینی|👃 دید سیم شیر|🥛 تیر|🏹 سیر|🧄 ایمان مینا|👧 آبی|🔵 بیدار ریشه|🌱 شیشه|🫙 تیشه میش|🐑 نیمه نی بیمار|🤒 سیمین
میز|🪑 زَمین|🌍 زَنبور|🐝 باز|🦅 زیبا|🌸 روز|☀️ سَبز|🟢 سَرباز|💂 تازه مَرز زَرد|🟡 زود زیر اِمروز|📅 نَماز|🙏 راز دیروز زَن|👩 بازی|🎮 تَمیز|✨
یاد یار سایه|🌳 زیاد نیاز یاس|🌼 دَریا|🌊 بایَد آینه|🪞 دایی|👨 یاسَمَن|🌼
بُز|🐐 دُم اُمید تُند شُتُر|🐫 دُرُست|✅ اُستاد|👨‍🏫 شُد تُرُش|🍋 سُرسُره|🛝
کِتاب|📘 کَبوتَر|🕊️ کودَک|🧒 کِشتی|🚢 موشَک|🚀 کَمان|🏹 کار کاسه|🥣 کَره|🧈 کَدو|🎃 کیسه|🛍️ کَمَک|🤝 یَک|1️⃣ نَمَک|🧂 سَرکه اِشک|😢 تاریک|🌑 نَزدیک کُت|🧥 بادبادَک|🪁 کُمُد|🗄️ بیکار
نانوا|👨‍🍳 دیوار|🧱 وَرزِش|🏃 آواز|🎶 سوار|🏇 داوَر|⚖️ گاو|🐄 هَوا|🌬️ دَوا|💊 دارو|💊 ناودان|🚰 روان|🏃 جَوان|🧒 جَواب|💬 نَوار|🎞️ وَسَط نَو|🆕 تَوان
پا|🦶 توپ|⚽ پَر|🪶 پِدَر|👨 پَروانه|🦋 پَرَنده|🐦 پیاز|🧅 پاک|🧼 پوست پیراهَن|👕 پُل|🌉 پیر|👴 پَنیر|🧀 سوپ|🍜 پاییز|🍂 پَتو|🛌 پِسَر|👦 پارک|🏞️
گُل|🌸 گاو|🐄 سَگ|🐕 گُربه|🐈 گوش|👂 بَرگ|🍃 رَنگ|🎨 زَنگ|🔔 سَنگ|🪨 گِرد|⭕ گَرم|♨️ بُزُرگ|🐘 اَنگور|🍇 تَنگ|🐠 گِریه|😭 گَوَزن|🦌 گِردو|🌰 گوسفَند|🐑 مِگو
فیل|🐘 بَرف|❄️ کَفش|👟 فانوس|🏮 فَرش|🧶 سِفید|⚪ فَردا کَف نَفَس اَفسانه|📖 دَفتَر|📓 فَرفِره|🌀 شِکوفه|🌸 فِکر|💭
خانه|🏠 یَخ|🧊 خَرگوش|🐰 خُروس|🐓 دَرَخت|🌳 خیار|🥒 خَنده|😂 خوب|👍 خاک|🟤 تَخته|🪧 میخ|📌 نَخ|🧵 سُرخ|🔴 شاخ|🦌 خَسته|😩 خُرما|🌴 آخَر
قایِق|⛵ قاشُق|🥄 اُتاق|🚪 قَند|🍬 بُشقاب|🍽️ قَفَس|🪺 قَشَنگ|😍 قِرمِز|🔴 قو|🦢 قاب|🖼️ باقی دَقیقه بَرق|⚡ آقا|👨 قاری
لیمو|🍋 قَلَم|🖊️ لانه|🪺 لَب|👄 سَلام|👋 کَلاس|🏫 بُلبُل|🐦 دِل|❤️ شَلوار|👖 لِباس|👗 گِلابی|🍐 سال لاله|🌷 بَلَند زُلال تِلِفُن|☎️ لاک|💅 بالا|⬆️ گِل
جوجه|🐥 جوراب|🧦 تاج|👑 جَنگَل|🌲 مَسجِد|🕌 گَنج|💰 کاج|🌲 جیب|👖 پَنجِره|🪟 بِرِنج|🍚 جَشن|🎉 اُجاق|🔥 جارو|🧹 جام|🏆
تو|👉 دو|2️⃣ خود|🏠 خودکار|🖊️ خودم|🙋 خورشید|☀️ خوش|😊 خوشحال|😄 خوشمزه|😋 خوراک|🍲 نو|🆕 نوروز|🌷
ماه|🌙 کوه|⛰️ راه|🛣️ ماهی|🐟 هَوا|🌬️ هَواپیما|✈️ شَهر|🏙️ مِهر هَفت|7️⃣ هُدهُد|🐦 هَویج|🥕 روباه|🦊 سیاه|⚫ بَهار|🌼 مِهمان|🧑‍🤝‍🧑 دَهان|👄 گیاه|🌿 مِهرَبان|🥰 هَمه آهو|🦌 آهَن|🔩 آهَنگ|🎵 شاه|🤴 نَگاه|👀 دَه|🔟 نِهال|🌱 کُلاه|🧢 مُهره|📿
چَتر|☂️ چای|🍵 قیچی|✂️ چَکُش|🔨 پارچه|🧵 کوچه|🏘️ چَشم|👁️ بَچّه|👶 کوچَک|🐜 چوب|🪵 چَهار|4️⃣ چَرخ|🛞 پیچ|🔩 چِنار|🌳 قارچ|🍄 چَشمه|⛲ چِرا|❓
ژاکَت|🧥 مُژه|👁️ ژِله|🍮 دِژ|🏰 ژاله|💧 پِژمان|👦 مُژده
خواهَر|👧 خواب|😴 خواهِش|🙏 خواستَن|🙋 خواندَن|📖 خوابید|🛌 خواننده|🎤
اَرّه|🪚 سِکّه|🪙 بَرّه|🐑 پِلّه|🪜 اَوَّل|🥇 نَجّار|🧑‍🔧 گُلّه|🐑 کَلّه مُرَبّا|🍓 نَقّاش|🎨
عَسَل|🍯 عَروسَک|🪆 شَمع|🕯️ ساعَت|⏰ مُعَلِّم|👩‍🏫 عَینَک|👓 عَلی|👦 عَمو|👨 عَمّه|👩 جُمعه|📅 شُعله|🔥 عَکس|📷 بَعد رَعد|⛈️ عید|🎁 شَمعدانی|🌺
صابون|🧼 صَندَلی|🪑 صَدَف|🐚 صَدا|🔊 رَقص|💃 صورَت|🙂 صَبر قِصّه|📖 صَد|💯
ذُرَّت|🌽 کاغَذ|📄 لَذیذ|😋 ذوق|🤩 آذَر لَذَّت
مُثَلَّث|🔺 ثانیه|⏱️ کَثیف|🗑️ اَثَر مِثل
حَلَزون|🐌 حوض|⛲ صُبح|🌅 حَمّام|🛁 حَیوان|🐾 صُبحانه|🍳 حَسَن|👦 حالا حَرف|🔤 تِمساح|🐊 خوشحال|😄
مَریض|🤒 قاضی|⚖️ رِضا|👦 ضَرب|✖️ فَضا|🪐 راضی|😊
طوطی|🦜 طَناب|🪢 قَطار|🚂 طَبل|🥁 حَیاط|🏡 بَطری|🍾 خَط|✏️ طَلا|🥇 نُقطه|⚫ وَطَن|🇮🇷
کَلاغ|🐦‍⬛ غَذا|🍲 باغ|🌳 مُرغ|🐔 اَلاغ|🫏 چِراغ|🚦 غاز|🦢 دوغ|🥛 جیغ|😱 مُرغابی|🦆 باغچه|🌷 تیغ|🌵 غُنچه|🌹 غَمگین|😢 لاغَر مَغز|🧠
ظَرف|🥣 ظُهر|🕛 حافِظ|📜 مُحافِظ|💂 لَحظه|⏳ مَنظَره|🏞️
`;

export const WORD_PLACEHOLDER = '__paper__';
/** آیا این مقدار یک ایموجی واقعی است (نه نماد جایگزین)؟ */
export const hasRealEmoji = (e?: string) => !!e && e !== WORD_PLACEHOLDER && e !== '📖';
/** برای متن‌های نوشتاری (پیام‌ها): نماد جایگزین هرگز به صورت متن دیده نشود */
export const emojiText = (e?: string, fallback = '') => hasRealEmoji(e) ? e! : fallback;

/* ایموجی مناسب برای واژه‌هایی که در فهرست‌ها بی‌تصویر آمده بودند (کلید: واژهٔ بی‌اعراب) */
const FALLBACK_EMOJI: Record<string, string> = Object.fromEntries(
  `آبان|🍂 آبگیر|🏞️ آرام|🤫 آمد|🚶 آمدن|🚶 ارزان|🏷️ انبار|🏚️ اکبر|👦 امید|🌈 اسم|🏷️ انسان|🧍 ایرانی|🇮🇷 ایستاد|🧍 بار|📦 بد|👎 برد|🏆 بستن|🔒 بست|🔒 بلند|🦒 بیدار|⏰ بیداری|⏰ تار|🎸 تازه|🥬 تور|🥅 ترسو|😨 تشت|🪣 تن|🧍 تند|🏃 تمبر|📮 تیشه|🪓 خبر|📰 خوش‌آواز|🐦 دام|🐄 دانا|🦉 دانش|🧠 دسته|💐 دیروز|📅 ذره|✨ راز|🤫 راست|👉 رشته|🍜 زمان|⏳ سال|📅 سام|👦 سه|3️⃣ سیم|🔌 سیمین|👧 سرکه|🍶 سنگین|🏋️ شن|🏖️ شیرین|🍬 صدای|🔊 غار|🕳️ فردا|📅 ما|👨‍👩‍👧 مادربزرگ|👵 مهر|❤️ میدان|🏟️ می‌بارد|🌧️ می‌خواند|📖 می‌خورد|🍽️ می‌پزد|🍳 می‌چرند|🐑 نرده|🚧 نرم|🧸 نی|🎋 نیمه|🌓 هفته|📅 چاه|🕳️ کریم|👦 گل|🟤 کار|🛠️ سرسبز|🌳 نفس|🌬️ نمد|🧶 تمام|✅ جمع|➕ اثر|👣 می‌آید|🚶 آخر|🏁`.split(' ').map(p => { const [w, e] = p.split('|'); return [plainWord(w), e] as [string, string]; }),
);

const parseItem = (item: string) => {
  const [word, emoji = ''] = item.split('|');
  // برای واژه‌هایی که تصویر مناسب ندارند از یک نماد واحد استفاده می‌کنیم،
  // نه ایموجی کتاب که معنی واژه را اشتباه حدس می‌زند.
  return { word, emoji: emoji || FALLBACK_EMOJI[plainWord(word)] || WORD_PLACEHOLDER };
};
/** واژه‌های کتاب اول (به ترتیب درس)، بعد بقیهٔ واژه‌ها؛ هر واژه فقط یک بار */
const buildBank = (): WordEntry[] => {
  const out: WordEntry[] = [];
  const seen = new Map<string, WordEntry>();
  const add = (item: string, book?: number) => {
    const { word, emoji } = parseItem(item);
    const plain = plainWord(word);
    const old = seen.get(plain);
    if (old) { if (!old.emoji && emoji) old.emoji = emoji; if (book && !old.book) old.book = book; return; }
    const e: WordEntry = { id: `w${out.length}`, word, plain, emoji, lesson: lessonOfWord(word), tokens: wordToTokens(word), book };
    seen.set(plain, e); out.push(e);
  };
  Object.keys(BOOK_RAW).map(Number).sort((a, b) => a - b).forEach(b => BOOK_RAW[b].split(/\s+/).filter(Boolean).forEach(it => add(it, b)));
  RAW.split(/\s+/).filter(Boolean).forEach(it => add(it));
  return out;
};
export const WORD_BANK: WordEntry[] = buildBank();

export const wordsUpTo = (lesson: number) => WORD_BANK.filter(w => w.lesson <= lesson);
/**
 * واژه‌های تمرینِ یک درس:
 * ۱) واژه‌های همان درسِ کتاب نگارش که همهٔ نشانه‌هایشان تا این نشانه خوانده شده
 * ۲) واژه‌های تازهٔ همین نشانه از بانک
 * ۳) اگر کم بود، واژه‌های درس‌های قبلی کتاب (نزدیک‌ترین درس اول)
 */
export function lessonWords(lesson: number, min = 6): WordEntry[] {
  const book = bookLessonOf(lesson);
  const list: WordEntry[] = [];
  const push = (w: WordEntry) => { if (!list.includes(w)) list.push(w); };
  WORD_BANK.filter(w => w.book === book && w.lesson <= lesson).forEach(push);
  WORD_BANK.filter(w => w.book && w.book < book && w.lesson === lesson).forEach(push);
  WORD_BANK.filter(w => !w.book && w.lesson === lesson).forEach(push);
  if (list.length < min) WORD_BANK.filter(w => w.book && w.book < book && w.lesson <= lesson).sort((a, b) => (b.book! - a.book!)).forEach(w => { if (list.length < min) push(w); });
  if (list.length < min) WORD_BANK.filter(w => w.lesson < lesson).sort((a, b) => b.lesson - a.lesson).forEach(w => { if (list.length < min) push(w); });
  return list;
}
export const findWord = (plain: string) => WORD_BANK.find(w => w.plain === plain);

/* ---------------- تختهٔ مغناطیسی: کلمه‌های درس و پیشنهاد کلمه ---------------- */
const splitItems = (raw: string) => raw.split(/\s+/).filter(Boolean).map(parseItem);
const extraCache = new Map<string, WordEntry>();
/** واژه را از بانک برمی‌دارد (برای ثبت پیشرفت یکسان)، وگرنه یک مدخل تازه می‌سازد */
const entryOf = (word: string, emoji: string): WordEntry => {
  const plain = plainWord(word);
  const known = WORD_BANK.find(w => w.plain === plain);
  if (known) return known.emoji || !emoji ? known : { ...known, emoji };
  let e = extraCache.get(plain);
  if (!e) { e = { id: `b_${plain}`, word, plain, emoji, lesson: lessonOfWord(word), tokens: wordToTokens(word) }; extraCache.set(plain, e); }
  return e;
};
/** شمار حرف‌ها (بی‌اعراب) برای چیدن از ساده به سخت */
const letterCount = (w: WordEntry) => [...w.plain].length;
const byEase = (list: WordEntry[]) => list.map((w, i) => ({ w, i })).sort((a, b) => letterCount(a.w) - letterCount(b.w) || a.i - b.i).map(x => x.w);
/**
 * واژه‌های فعلیِ «می‌» دار (مثل «بَرمی‌دارَد»، «می‌آید») در تختهٔ مغناطیسی پیشنهاد نمی‌شوند:
 * نیم‌فاصلهٔ وسطشان ساختن واژه روی خط مغناطیسی را به هم می‌ریزد.
 */
export const hasMiPrefix = (word: string) => /می[\u200C\u200D ]/.test(word.replace(/[\u064B-\u0652\u0670]/g, ''));
const noMi = (list: WordEntry[]) => list.filter(w => !hasMiPrefix(w.word));
const uniq = (list: WordEntry[]) => { const seen = new Set<string>(); return list.filter(w => !seen.has(w.plain) && !!seen.add(w.plain)); };

/** همهٔ واژه‌هایی که در کتاب آمده‌اند (برای این‌که «پیشنهاد کلمه» فقط واژهٔ بیرون از کتاب بدهد) */
const BOOK_PLAINS = new Set<string>([
  ...WORD_BANK.filter(w => w.book).map(w => w.plain),
  ...Object.values(BOARD_WORDS).flatMap(d => [...splitItems(d.write), ...splitItems(d.review)].map(x => plainWord(x.word))),
]);

/**
 * «کلمه‌های درس» در تختهٔ مغناطیسی:
 * ۱) واژه‌های بخش «بنویس» زیر عنوان درس (نشانهٔ درس را دارند)، از کوتاه به بلند
 * ۲) چند واژهٔ مهم دیگرِ همان درس / مرور درس قبل، از کوتاه به بلند
 * همه فقط با نشانه‌های خوانده‌شده.
 */
export function boardLessonWords(order: number): WordEntry[] {
  const list = boardLessonWordsRaw(order);
  const clean = noMi(list);
  return clean.length ? clean : list;
}
function boardLessonWordsRaw(order: number): WordEntry[] {
  const d = BOARD_WORDS[order];
  if (!d) return lessonWords(order, 8);
  const ok = (w: WordEntry) => w.lesson <= order;
  // سه درس واژه‌محورِ و، و(اُ) و خوا فهرست صریح خودشان را دارند؛
  // واژهٔ کتابیِ همان درس نباید به‌خاطر یک نشانهٔ فرعی به درس قبلی پرت شود.
  const keepCurated = order === 18 || order === 26 || order === 30;
  // املای دقیقِ فهرست تعیین‌شده حفظ شود (مثلاً «نو» در درس و(اُ) نباید «نَو» شود)
  if (keepCurated) return splitItems(d.write).map(x => {
    const e = entryOf(x.word, x.emoji);
    return e.word === x.word && (!x.emoji || e.emoji === x.emoji) ? e : { ...e, word: x.word, emoji: x.emoji || e.emoji, tokens: wordToTokens(x.word) };
  });
  const write = splitItems(d.write).map(x => entryOf(x.word, x.emoji)).filter(w => keepCurated || ok(w));
  const withSign = write.filter(w => hasSign(w.word, order));
  const first = byEase([...withSign, ...write.filter(w => !withSign.includes(w))]);
  const second = byEase(splitItems(d.review).map(x => entryOf(x.word, x.emoji)).filter(ok));
  const list = uniq([...first, ...second]);
  // اگر تشخیص نشانه برای یک واژهٔ تازه موقتاً نتوانست لیست را بسازد،
  // به‌جای نمایش درس قبلی، خود واژه‌های همین رکورد را نگه می‌داریم.
  const current = byEase([...write, ...splitItems(d.review).map(x => entryOf(x.word, x.emoji)).filter(ok)]);
  return list.length ? list : (current.length ? uniq(current) : lessonWords(order, 8));
}

/**
 * «پیشنهاد کلمه» در تختهٔ مغناطیسی: واژه‌های بیرون از کتاب که نشانهٔ همین درس را دارند
 * و همهٔ نشانه‌هایشان پیش‌تر خوانده شده؛ از ساده به سخت.
 */
export function boardSuggestWords(order: number): WordEntry[] {
  const d = BOARD_WORDS[order];
  const fit = (w: WordEntry) => w.lesson <= order && hasSign(w.word, order) && !BOOK_PLAINS.has(w.plain);
  const curated = d ? splitItems(d.suggest).map(x => entryOf(x.word, x.emoji)).filter(fit) : [];
  let list = noMi(uniq(byEase(curated)));
  if (!list.length && order > 3) list = noMi(uniq(byEase(WORD_BANK.filter(fit))));
  return list;
}

/* ---------------- دیکتهٔ شب: کلمهٔ ناقص ---------------- */
/** یک تمرین دیکته: واژه با یک جای خالی به جای نشانهٔ درس */
export interface DictationItem {
  entry: WordEntry;
  /** بخش پیش از جای خالی (با شکلِ پیوستهٔ درست) */
  before: string;
  /** بخش پس از جای خالی */
  after: string;
  /** قطعه‌ای که باید در جای خالی گذاشته شود (دقیقاً همان شکل جعبهٔ حروف، مثل «نـ» یا «د») */
  answer: string;
}

/**
 * جای خالیِ دیکته: نخستین جایی از واژه که نشانهٔ همین درس روی آن است، با یک قطعه عوض می‌شود.
 * اگر واژه نشانهٔ درس را نداشته باشد null برمی‌گرداند.
 */
export function dictationBlank(entry: WordEntry, order: number): DictationItem | null {
  const word = [...entry.word].filter(c => c !== ZWJ).join('');
  const hit = signMap(word).find(m => m.sign === order);
  if (!hit) return null;
  const spans = wordToTokenSpans(word);
  const k = spans.findIndex(sp => hit.index >= sp.start && hit.index < sp.end);
  if (k < 0) return null;
  const chars = [...word];
  const blank = spans[k];
  const def = parseToken(blank.token);
  // آخرین حرفِ پیش از جای خالی (بی‌اعراب) به جای خالی می‌چسبد؟
  let prevLetter: typeof spans[number] | null = null;
  for (let j = k - 1; j >= 0; j--) { if (parseToken(spans[j].token).kind !== 'mark') { prevLetter = spans[j]; break; } }
  const brokenBefore = prevLetter ? chars.slice(prevLetter.end, blank.start).includes(ZWNJ) : true;
  const prevJoins = !!prevLetter && !brokenBefore && connectsLeft(parseToken(prevLetter.token));
  const blankJoinsNext = def.kind === 'mark' ? prevJoins : connectsLeft(def);
  const hasAfter = spans.slice(k + 1).some(sp => parseToken(sp.token).kind !== 'mark') && !chars.slice(blank.end, spans[k + 1]?.start ?? blank.end).includes(ZWNJ);
  const beforeTxt = chars.slice(0, blank.start).join('');
  const afterTxt = chars.slice(blank.end).join('');
  return {
    entry,
    before: beforeTxt + (prevJoins && beforeTxt ? ZWJ : ''),
    after: (blankJoinsNext && hasAfter && afterTxt ? ZWJ : '') + afterTxt,
    answer: blank.token,
  };
}

/**
 * واژه‌های «دیکتهٔ شب» برای هر نشانه:
 * ۱) واژه‌های بخش «بنویس» همان درس کتاب که نشانهٔ درس را دارند (ساده ← سخت)
 * ۲) بقیهٔ واژه‌های همان درس کتاب که نشانهٔ درس را دارند
 * ۳) اگر فهرست همان درس کوتاه بود، واژه‌های کتابیِ درس‌های پیشین
 * از درس «نـ ن» به بعد فقط واژه‌هایی که همهٔ نشانه‌هایشان پیش‌تر خوانده شده؛
 * در درس‌های آغازین (پیش از «نـ ن») واژه‌های کتاب حتی با نشانهٔ نخوانده هم می‌آیند، چون کتاب هم همین‌طور است.
 */
export function dictationWords(order: number): DictationItem[] {
  const strict = order >= 10;
  // درس‌های و، و(اُ) و خوا فقط با واژه‌های تعیین‌شدهٔ خودشان؛ هَوا/جَوان/خواهَر نباید به‌خاطر حرف فرعی حذف شوند.
  const curatedOnly = order === 18 || order === 26 || order === 30;
  const ok = (w: WordEntry) => curatedOnly || !strict || w.lesson <= order;
  const book = bookLessonOf(order);
  const d = BOARD_WORDS[order];
  const write = d ? splitItems(d.write).map(x => entryOf(x.word, x.emoji)) : [];
  const review = d ? splitItems(d.review).map(x => entryOf(x.word, x.emoji)) : [];
  const bookWords = WORD_BANK.filter(w => w.book === book);
  const withSign = (list: WordEntry[]) => list.filter(w => ok(w) && hasSign(w.word, order));
  const inBook = curatedOnly ? uniq(write.filter(w => hasSign(w.word, order))) : uniq([...byEase(withSign(write)), ...byEase(withSign([...bookWords, ...review]))]);
  return noMi(inBook).map(w => dictationBlank(w, order)).filter((x): x is DictationItem => !!x);
}

/** جمله‌های ساده کتابی؛ درسِ هر جمله از روی واژه‌هایش محاسبه می‌شود */
const SENTENCE_RAW = `
بابا آب
بابا آب داد
اَسب آمَد
بابا بادام داد
بابا تاب بَست
او با اَسب آمَد
او دَست داد
مادَر آرام آمَد
سارا بَرادَر دارَد
مَن اَنار دارَم
مَن دَرس دارَم
مادَر دَر دَست نان دارَد
اَبر دَر آسمان اَست
ایرانی آزاد اَست
ایران سَرسَبز اَست
ما ایران را دوست داریم
شَب بود
مادَر یاس دَر دَست دارَد
باران تُند آمَد
اُمید دَر باران آمَد
زَنبور دَر کَندو اَست
کَبوتَر روی بام اَست
اَمیر دَوَنده اَست
کَریم سَوارکار اَست
پِدَر پَروانه نانوا اَست
نَرگِس مادَربُزُرگ دارَد
بَرف می‌بارَد
آسمان آفتابی نیست
خُروس خوش‌آواز اَست
بُلبُل آمَد
گُل لَبخَند زَد
مَهتاب زیبا اَست
بابا آمَد
بابا آب داد
مادَر آمَد
سارا آمَد
باد آمَد
اَبر آمَد
باران آمَد
مادَر نان داد
بابا نان داد
آب سَرد اَست
سارا دَست داد
باران آرام اَست
مادَر نامه داد
سارا مِداد دارَد
بابا شاد اَست
مادَر آش داد
شَب آمَد
سارا شاد اَست
سارا سیب دارَد
آسمان آبی اَست
مینا بیدار شُد
ایران زیبا اَست
میز تَمیز اَست
زَمین سَبز اَست
روز آمَد
دَریا آبی اَست
یاس زیبا اَست
اُمید آمَد
بُز سیب دید
اُستاد آمَد
کودَک کِتاب دارَد
کَبوتَر روی بام نِشَست
کِتاب مَن نو اَست
نانوا نان داد
پِدَر آمَد
پَروانه زیبا اَست
توپ مَن سِفید اَست
گُل زیبا اَست
گاو شیر دارَد
سَگ دُم دارَد
گُربه روی دیوار اَست
بَرف سِفید اَست
فیل بُزُرگ اَست
کَفش مَن نو اَست
خانه ما تَمیز اَست
دَرَخت سَبز اَست
خَرگوش سِفید اَست
قایِق روی آب اَست
آقا قاشُق دارَد
لیمو تُرش اَست
سَلام کَلاس
بُلبُل روی گُل نِشَست
جوجه زَرد اَست
جوراب مَن نو اَست
خودکار مَن آبی اَست
ماه روشَن اَست
هَوا سَرد اَست
ماهی دَر آب اَست
روباه دَر جَنگَل اَست
چَتر مَن باز اَست
چای گَرم اَست
ژاله ژاکَت دارَد
خواهَر مَن کِتاب می‌خوانَد
بَچّه خواب اَست
نَجّار اَرّه دارَد
بَرّه سِفید اَست
عَلی عَسَل دارَد
مُعَلِّم مِهرَبان اَست
ساعَت هَفت اَست
صَدای زَنگ آمَد
ذُرَّت زَرد اَست
مُثَلَّث سه گوشه دارَد
حَلَزون آرام اَست
صُبح شُد
رِضا مَریض اَست
طوطی سَبز اَست
قَطار آمَد
کَلاغ روی دَرَخت اَست
باغ ما گُل دارَد
غَذا آماده اَست
ظَرف تَمیز اَست
ظُهر شُد
`;
export interface SentenceEntry { id: string; text: string; lesson: number }
const LEGACY_SENTENCE_BANK: SentenceEntry[] = [...new Set(SENTENCE_RAW.split('\n').map(s => s.trim()).filter(Boolean))]
  .map((text, i) => ({ id: `s${i}`, text, lesson: Math.max(...text.split(' ').map(lessonOfWord)) }));
/** بانک جدیدِ مرحله‌بندی‌شده در sentenceBank.ts مرجع اصلی جمله‌سازی است. */
export { SENTENCE_BANK } from './sentenceBank';
