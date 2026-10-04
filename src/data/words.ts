import { WordItem } from '../types';

const W = (id:string, word:string, letters:string[], imageEmoji:string, meaning:string, difficulty:1|2|3, acceptedForms:string[]=[]): WordItem => ({
  id, word, letters, imageEmoji, meaning, difficulty, acceptedForms,
  syllables: [word], hint: `${letters.length} نشانه را از راست به چپ کنار هم بگذار`
});

/** واژه‌های پرکاربرد کتاب فارسی اول، با پذیرش شکل اعراب‌دار و بی‌اعراب. */
export const FIRST_GRADE_WORDS: WordItem[] = [
  W('ab','آب',['alef','be'],'💧','مایه زندگی',1,['اب']),
  W('abr','اَبر',['alef','be','re'],'☁️','ابر آسمان',1,['ابر']),
  W('anar','اَنار',['alef','noon','alef','re'],'🍎','میوه دانه‌دانه',1,['انار']),
  W('baba','بابا',['be','alef','be','alef'],'👨','پدر',1),
  W('bad','باد',['be','alef','dal'],'🌬️','هوای در حرکت',1),
  W('baran','باران',['be','alef','re','alef','noon'],'🌧️','بارش آسمان',1),
  W('nan','نان',['noon','alef','noon'],'🥖','خوراک روزانه',1),
  W('madar','مادر',['mim','alef','dal','re'],'👩‍👧','مادر مهربان',1),
  W('dast','دست',['dal','sin','te'],'✋','عضوی از بدن',1),
  W('sib','سیب',['sin','ye','be'],'🍎','میوه شیرین',1),
  W('dad','داد',['dal','alef','dal'],'🎁','فعل دادن',1),
  W('asb','اَسب',['alef','sin','be'],'🐎','حیوان دونده',1,['اسب']),
  W('tup','توپ',['te','vav','pe'],'⚽','وسیله بازی',1),
  W('tut','توت',['te','vav','te'],'🍓','میوه شیرین',1),
  W('mah','ماه',['mim','alef','he'],'🌙','ماه آسمان',1),
  W('mahi','ماهی',['mim','alef','he','ye'],'🐟','جانور آبزی',2),
  W('ketab','کِتاب',['kaf','te','alef','be'],'📚','دوست دانا',2,['کتاب']),
  W('madrese','مَدرسه',['mim','dal','re','sin','he'],'🏫','جای یادگیری',2,['مدرسه']),
  W('doost','دوست',['dal','vav','sin','te'],'🧒','هم‌بازی مهربان',2),
  W('gol','گُل',['gaf','lam'],'🌷','گل خوش‌بو',2,['گل']),
  W('derakht','دِرَخت',['dal','re','khe','te'],'🌳','درخت سبز',2,['درخت']),
  W('parande','پَرَنده',['pe','re','noon','dal','he'],'🐦','پرنده آسمان',2,['پرنده']),
  W('khane','خانه',['khe','alef','noon','he'],'🏠','جای زندگی',2),
  W('khorshid','خورشید',['khe','vav','re','shin','ye','dal'],'☀️','روشنایی روز',2),
  W('setare','سِتاره',['sin','te','alef','re','he'],'⭐','ستاره آسمان',2,['ستاره']),
  W('dandan','دَندان',['dal','noon','dal','alef','noon'],'🦷','دندان سفید',2,['دندان']),
  W('medad','مِداد',['mim','dal','alef','dal'],'✏️','ابزار نوشتن',2,['مداد']),
  W('mohsen','مُحسِن',['mim','he_jimi','sin','noon'],'🧒','نام پسر',3,['محسن']),
  W('iran','ایران',['alef','ye','re','alef','noon'],'🇮🇷','کشور ما',3),
  W('azadi','آزادی',['alef','ze','alef','dal','ye'],'🕊️','آزاد بودن',3),
  W('mehraban','مِهربان',['mim','he','re','be','alef','noon'],'💛','خوش‌رفتار',3,['مهربان']),
  W('kudak','کودک',['kaf','vav','dal','kaf'],'🧒','بچه',3),
  W('khanvade','خانواده',['khe','alef','noon','vav','alef','dal','he'],'👪','افراد خانه',3),
  W('daftar','دَفتَر',['dal','fe','te','re'],'📒','دفتر نوشتن',3,['دفتر']),
  W('ghayeg','قایق',['ghaf','alef','ye','ghaf'],'⛵','وسیله روی آب',3),
  W('kelas','کِلاس',['kaf','lam','alef','sin'],'🏫','کلاس درس',3,['کلاس'])
];
