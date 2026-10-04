/**
 * تصویرهای اختصاصی برای واژه‌هایی که ایموجی‌شان نادرست است (مثلاً «اَنار» با سیب)
 * یا روی گوشی‌های اندرویدی قدیمی به‌صورت مربع خالی دیده می‌شود (🪮 🫖 🪺 🛝 🪢 🫏 ...).
 * کلید: واژهٔ بی‌اعراب. اگر فایلی بار نشد، WordPic خودکار به همان ایموجی برمی‌گردد.
 */
import { plainWord } from '../utils/pieces';

const BASE = '/assets/words/';
const MAP: Record<string, string> = {
  'انار': 'anar', 'توت': 'toot', 'داس': 'daas', 'دام': 'daam', 'نان': 'naan', 'آش': 'aash',
  'ماست': 'maast', 'تراش': 'tarash', 'نرده': 'narde',
  'شانه': 'shane', 'شیشه': 'shishe', 'قوری': 'ghoori', 'لانه': 'lane', 'سرسره': 'sorsore', 'طناب': 'tanab',
  'الاغ': 'olagh', 'کلاغ': 'kalagh', 'قفس': 'ghafas',
  'حوله': 'hoole', 'کندو': 'kandoo', 'انجیر': 'anjir', 'گچ': 'gach', 'دارو': 'daroo', 'سنگ': 'sang',
  'صندوق': 'sandoogh', 'سینی': 'sini', 'سوزن': 'soozan',
  // واژه‌هایی که قبلاً هیچ تصویری نداشتند (آیکون صفحهٔ خالی)
  'قیف': 'ghif', 'چانه': 'chane', 'دم': 'dom', 'کله': 'kalle', 'پوست': 'poost', 'مس': 'mes', 'صف': 'saf', 'کف': 'kaf',
};

/** مسیر تصویر اختصاصی واژه، یا undefined */
export const wordImage = (word?: string): string | undefined => {
  if (!word) return undefined;
  const key = MAP[plainWord(word)];
  return key ? `${BASE}${key}.webp` : undefined;
};
