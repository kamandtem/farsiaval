import { PersianLetter, HarakatSymbol, NumberItem } from '../types';

export const PERSIAN_LETTERS: PersianLetter[] = [
  {
    id: 'alef',
    name: 'الف',
    soundLabel: 'آ / ا',
    category: 'vowel',
    isolated: 'ا',
    initial: 'ا',
    medial: 'ـا',
    final: 'ـا',
    canConnectBefore: true,
    canConnectAfter: false, // غیرمتصل شونده به بعد
    color: '#3B82F6', // Sky blue
    phoneticDescription: 'صدای «آ» یا «اَ» مثل آب و انار',
    exampleWord: 'انار',
    exampleEmoji: '🍎',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 50, y: 15 },
        points: [
          { x: 50, y: 15 },
          { x: 50, y: 45 },
          { x: 50, y: 85 },
        ],
        directionArrow: { x: 50, y: 50, angle: 90 }
      }
    ]
  },
  {
    id: 'be',
    name: 'بِ',
    soundLabel: 'بـ / ب',
    category: 'consonant',
    isolated: 'ب',
    initial: 'بـ',
    medial: 'ـبـ',
    final: 'ـب',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#EF4444', // Red/coral
    phoneticDescription: 'صدای «بـ» مثل باران و بابا',
    exampleWord: 'باران',
    exampleEmoji: '🌧️',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 80, y: 50 },
        points: [
          { x: 80, y: 50 },
          { x: 80, y: 65 },
          { x: 50, y: 65 },
          { x: 20, y: 65 },
          { x: 20, y: 50 },
        ],
        directionArrow: { x: 50, y: 65, angle: 180 }
      },
      {
        id: 2,
        startPoint: { x: 50, y: 80 },
        points: [
          { x: 50, y: 80 },
          { x: 50, y: 82 }
        ]
      }
    ]
  },
  {
    id: 'pe',
    name: 'پِ',
    soundLabel: 'پـ / پ',
    category: 'consonant',
    isolated: 'پ',
    initial: 'پـ',
    medial: 'ـپـ',
    final: 'ـپ',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#10B981', // Emerald
    phoneticDescription: 'صدای «پـ» مثل پروانه و توپ',
    exampleWord: 'پروانه',
    exampleEmoji: '🦋',
  },
  {
    id: 'te',
    name: 'تِ',
    soundLabel: 'تـ / ت',
    category: 'consonant',
    isolated: 'ت',
    initial: 'تـ',
    medial: 'ـتـ',
    final: 'ـت',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#F59E0B', // Amber
    phoneticDescription: 'صدای «تـ» مثل توت و تاب',
    exampleWord: 'توت',
    exampleEmoji: '🍓',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 80, y: 50 },
        points: [
          { x: 80, y: 50 },
          { x: 80, y: 65 },
          { x: 50, y: 65 },
          { x: 20, y: 65 },
          { x: 20, y: 50 }
        ],
        directionArrow: { x: 50, y: 65, angle: 180 }
      },
      {
        id: 2,
        startPoint: { x: 45, y: 35 },
        points: [{ x: 45, y: 35 }, { x: 55, y: 35 }]
      }
    ]
  },
  {
    id: 'se_3',
    name: 'ثِ',
    soundLabel: 'ثـ / ث',
    category: 'consonant',
    isolated: 'ث',
    initial: 'ثـ',
    medial: 'ـثـ',
    final: 'ـث',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#8B5CF6',
    phoneticDescription: 'صدای «ثـ» مثل ثریا',
    exampleWord: 'مثلث',
    exampleEmoji: '🔺',
  },
  {
    id: 'jim',
    name: 'جیم',
    soundLabel: 'جـ / ج',
    category: 'consonant',
    isolated: 'ج',
    initial: 'جـ',
    medial: 'ـجـ',
    final: 'ـج',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#06B6D4', // Cyan
    phoneticDescription: 'صدای «جـ» مثل جوجه',
    exampleWord: 'جوجه',
    exampleEmoji: '🐥',
  },
  {
    id: 'che',
    name: 'چِ',
    soundLabel: 'چـ / چ',
    category: 'consonant',
    isolated: 'چ',
    initial: 'چـ',
    medial: 'ـچـ',
    final: 'ـچ',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#EC4899', // Pink
    phoneticDescription: 'صدای «چـ» مثل چتر',
    exampleWord: 'چتر',
    exampleEmoji: '☂️',
  },
  {
    id: 'he_jimi',
    name: 'حِ',
    soundLabel: 'حـ / ح',
    category: 'consonant',
    isolated: 'ح',
    initial: 'حـ',
    medial: 'ـحـ',
    final: 'ـح',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#14B8A6',
    phoneticDescription: 'صدای «حـ» مثل حلزون',
    exampleWord: 'حلزون',
    exampleEmoji: '🐌',
  },
  {
    id: 'khe',
    name: 'خِ',
    soundLabel: 'خـ / خ',
    category: 'consonant',
    isolated: 'خ',
    initial: 'خـ',
    medial: 'ـخـ',
    final: 'ـخ',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#F97316',
    phoneticDescription: 'صدای «خـ» مثل خانه و خرگوش',
    exampleWord: 'خانه',
    exampleEmoji: '🏠',
  },
  {
    id: 'dal',
    name: 'دال',
    soundLabel: 'د',
    category: 'consonant',
    isolated: 'د',
    initial: 'د',
    medial: 'ـد',
    final: 'ـد',
    canConnectBefore: true,
    canConnectAfter: false, // غیر متصل به بعد
    color: '#6366F1', // Indigo
    phoneticDescription: 'صدای «د» مثل درخت و دست',
    exampleWord: 'درخت',
    exampleEmoji: '🌳',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 65, y: 30 },
        points: [
          { x: 65, y: 30 },
          { x: 45, y: 55 },
          { x: 30, y: 70 },
          { x: 60, y: 70 },
        ],
        directionArrow: { x: 45, y: 55, angle: 135 }
      }
    ]
  },
  {
    id: 'zal',
    name: 'ذال',
    soundLabel: 'ذ',
    category: 'consonant',
    isolated: 'ذ',
    initial: 'ذ',
    medial: 'ـذ',
    final: 'ـذ',
    canConnectBefore: true,
    canConnectAfter: false,
    color: '#84CC16',
    phoneticDescription: 'صدای «ذ» مثل ذره‌بین',
    exampleWord: 'ذرت',
    exampleEmoji: '🌽',
  },
  {
    id: 're',
    name: 'رِ',
    soundLabel: 'ر',
    category: 'consonant',
    isolated: 'ر',
    initial: 'ر',
    medial: 'ـر',
    final: 'ـر',
    canConnectBefore: true,
    canConnectAfter: false, // غیر متصل به بعد
    color: '#EAB308',
    phoneticDescription: 'صدای «ر» مثل رنگین‌کمان',
    exampleWord: 'روباه',
    exampleEmoji: '🦊',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 60, y: 35 },
        points: [
          { x: 60, y: 35 },
          { x: 55, y: 55 },
          { x: 35, y: 75 },
        ],
        directionArrow: { x: 50, y: 60, angle: 120 }
      }
    ]
  },
  {
    id: 'ze',
    name: 'زِ',
    soundLabel: 'ز',
    category: 'consonant',
    isolated: 'ز',
    initial: 'ز',
    medial: 'ـز',
    final: 'ـز',
    canConnectBefore: true,
    canConnectAfter: false,
    color: '#0284C7',
    phoneticDescription: 'صدای «ز» مثل زنبور',
    exampleWord: 'زنبور',
    exampleEmoji: '🐝',
  },
  {
    id: 'zhe',
    name: 'ژِ',
    soundLabel: 'ژ',
    category: 'consonant',
    isolated: 'ژ',
    initial: 'ژ',
    medial: 'ـژ',
    final: 'ـژ',
    canConnectBefore: true,
    canConnectAfter: false,
    color: '#D946EF',
    phoneticDescription: 'صدای «ژ» مثل ژاله',
    exampleWord: 'ژاکت',
    exampleEmoji: '🧥',
  },
  {
    id: 'sin',
    name: 'سین',
    soundLabel: 'سـ / س',
    category: 'consonant',
    isolated: 'س',
    initial: 'سـ',
    medial: 'ـسـ',
    final: 'ـس',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#10B981',
    phoneticDescription: 'صدای «سـ» با سه دندانه مثل سیب و ستاره',
    exampleWord: 'سیب',
    exampleEmoji: '🍏',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 80, y: 40 },
        points: [
          { x: 80, y: 40 },
          { x: 75, y: 55 },
          { x: 68, y: 40 },
          { x: 62, y: 55 },
          { x: 55, y: 40 },
          { x: 45, y: 60 },
          { x: 30, y: 75 },
          { x: 20, y: 60 },
          { x: 20, y: 45 }
        ],
        directionArrow: { x: 70, y: 45, angle: 180 }
      }
    ]
  },
  {
    id: 'shin',
    name: 'شین',
    soundLabel: 'شـ / ش',
    category: 'consonant',
    isolated: 'ش',
    initial: 'شـ',
    medial: 'ـشـ',
    final: 'ـش',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#F43F5E',
    phoneticDescription: 'صدای «شـ» با سه نقطه مثل شیر و خورشید',
    exampleWord: 'شیر',
    exampleEmoji: '🦁',
  },
  {
    id: 'sad',
    name: 'صاد',
    soundLabel: 'صـ / ص',
    category: 'consonant',
    isolated: 'ص',
    initial: 'صـ',
    medial: 'ـصـ',
    final: 'ـص',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#059669',
    phoneticDescription: 'صدای «صـ» مثل صابون',
    exampleWord: 'صابون',
    exampleEmoji: '🧼',
  },
  {
    id: 'zad',
    name: 'ضاد',
    soundLabel: 'ضـ / ض',
    category: 'consonant',
    isolated: 'ض',
    initial: 'ضـ',
    medial: 'ـضـ',
    final: 'ـض',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#9333EA',
    phoneticDescription: 'صدای «ضـ» مثل رضا',
    exampleWord: 'حوض',
    exampleEmoji: '🏊',
  },
  {
    id: 'ta',
    name: 'طا',
    soundLabel: 'ط',
    category: 'consonant',
    isolated: 'ط',
    initial: 'طـ',
    medial: 'ـطـ',
    final: 'ـط',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#EA580C',
    phoneticDescription: 'صدای «طـ» دسته‌دار مثل طوطی',
    exampleWord: 'طوطی',
    exampleEmoji: '🦜',
  },
  {
    id: 'za',
    name: 'ظا',
    soundLabel: 'ظ',
    category: 'consonant',
    isolated: 'ظ',
    initial: 'ظـ',
    medial: 'ـظـ',
    final: 'ـظ',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#4F46E5',
    phoneticDescription: 'صدای «ظـ» مثل ظرف',
    exampleWord: 'ظرف',
    exampleEmoji: '🥣',
  },
  {
    id: 'eyn',
    name: 'عین',
    soundLabel: 'عـ / ع',
    category: 'consonant',
    isolated: 'ع',
    initial: 'عـ',
    medial: 'ـعـ',
    final: 'ـع',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#0D9488',
    phoneticDescription: 'صدای «عـ» مثل عینک',
    exampleWord: 'عینک',
    exampleEmoji: '👓',
  },
  {
    id: 'gheyn',
    name: 'غین',
    soundLabel: 'غـ / غ',
    category: 'consonant',
    isolated: 'غ',
    initial: 'غـ',
    medial: 'ـغـ',
    final: 'ـغ',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#DB2777',
    phoneticDescription: 'صدای «غـ» مثل غاز',
    exampleWord: 'غذا',
    exampleEmoji: '🍲',
  },
  {
    id: 'fe',
    name: 'فِ',
    soundLabel: 'فـ / ف',
    category: 'consonant',
    isolated: 'ف',
    initial: 'فـ',
    medial: 'ـفـ',
    final: 'ـف',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#0891B2',
    phoneticDescription: 'صدای «فـ» مثل فیل',
    exampleWord: 'فیل',
    exampleEmoji: '🐘',
  },
  {
    id: 'ghaf',
    name: 'قاف',
    soundLabel: 'قـ / ق',
    category: 'consonant',
    isolated: 'ق',
    initial: 'قـ',
    medial: 'ـقـ',
    final: 'ـق',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#CA8A04',
    phoneticDescription: 'صدای «قـ» مثل قایق',
    exampleWord: 'قایق',
    exampleEmoji: '⛵',
  },
  {
    id: 'kaf',
    name: 'کاف',
    soundLabel: 'کـ / ک',
    category: 'consonant',
    isolated: 'ک',
    initial: 'کـ',
    medial: 'ـکـ',
    final: 'ـک',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#2563EB',
    phoneticDescription: 'صدای «کـ» مثل کتاب و کبوتر',
    exampleWord: 'کتاب',
    exampleEmoji: '📚',
  },
  {
    id: 'gaf',
    name: 'گاف',
    soundLabel: 'گـ / گ',
    category: 'consonant',
    isolated: 'گ',
    initial: 'گـ',
    medial: 'ـگـ',
    final: 'ـگ',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#16A34A',
    phoneticDescription: 'صدای «گـ» با کلاهک مثل گل و گربه',
    exampleWord: 'گل',
    exampleEmoji: '🌸',
  },
  {
    id: 'lam',
    name: 'لام',
    soundLabel: 'لـ / ل',
    category: 'consonant',
    isolated: 'ل',
    initial: 'لـ',
    medial: 'ـلـ',
    final: 'ـل',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#E11D48',
    phoneticDescription: 'صدای «لـ» مثل لیمو و لک‌لک',
    exampleWord: 'لیمو',
    exampleEmoji: '🍋',
  },
  {
    id: 'mim',
    name: 'میم',
    soundLabel: 'مـ / م',
    category: 'consonant',
    isolated: 'م',
    initial: 'مـ',
    medial: 'ـمـ',
    final: 'ـم',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#7C3AED',
    phoneticDescription: 'صدای «مـ» مثل مادر و ماه',
    exampleWord: 'مادر',
    exampleEmoji: '👩‍👧',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 70, y: 40 },
        points: [
          { x: 70, y: 40 },
          { x: 60, y: 35 },
          { x: 50, y: 45 },
          { x: 60, y: 55 },
          { x: 70, y: 40 },
          { x: 45, y: 50 },
          { x: 30, y: 75 }
        ],
        directionArrow: { x: 60, y: 35, angle: 180 }
      }
    ]
  },
  {
    id: 'noon',
    name: 'نون',
    soundLabel: 'نـ / ن',
    category: 'consonant',
    isolated: 'ن',
    initial: 'نـ',
    medial: 'ـنـ',
    final: 'ـن',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#D97706',
    phoneticDescription: 'صدای «نـ» مثل نان و نمک',
    exampleWord: 'نان',
    exampleEmoji: '🥖',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 75, y: 35 },
        points: [
          { x: 75, y: 35 },
          { x: 75, y: 60 },
          { x: 50, y: 75 },
          { x: 25, y: 60 },
          { x: 25, y: 40 }
        ],
        directionArrow: { x: 50, y: 75, angle: 180 }
      },
      {
        id: 2,
        startPoint: { x: 50, y: 50 },
        points: [{ x: 50, y: 50 }, { x: 50, y: 52 }]
      }
    ]
  },
  {
    id: 'vav',
    name: 'واو',
    soundLabel: 'و',
    category: 'vowel',
    isolated: 'و',
    initial: 'و',
    medial: 'ـو',
    final: 'ـو',
    canConnectBefore: true,
    canConnectAfter: false, // غیرمتصل به بعد
    color: '#059669',
    phoneticDescription: 'صدای «و» یا «او» مثل ورزش و آهو',
    exampleWord: 'ورزش',
    exampleEmoji: '⚽',
  },
  {
    id: 'he',
    name: 'هِ',
    soundLabel: 'هـ / ه',
    category: 'consonant',
    isolated: 'ه',
    initial: 'هـ',
    medial: 'ـهـ',
    final: 'ـه',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#0284C7',
    phoneticDescription: 'صدای «هـ» چهارشکلی مثل ماه و هویج',
    exampleWord: 'ماه',
    exampleEmoji: '🌙',
  },
  {
    id: 'ye',
    name: 'یِ',
    soundLabel: 'یـ / ی',
    category: 'vowel',
    isolated: 'ی',
    initial: 'یـ',
    medial: 'ـیـ',
    final: 'ـی',
    canConnectBefore: true,
    canConnectAfter: true,
    color: '#E11D48',
    phoneticDescription: 'صدای «یـ» یا «ای» مثل یاس و ماهی',
    exampleWord: 'ماهی',
    exampleEmoji: '🐟',
  }
];

export const HARAKAT_LIST: HarakatSymbol[] = [
  {
    id: 'fathe',
    name: 'فتحه (اَ)',
    symbol: 'َ',
    position: 'above',
    sound: 'اَ',
    color: '#EF4444'
  },
  {
    id: 'kasre',
    name: 'کسره (اِ)',
    symbol: 'ِ',
    position: 'below',
    sound: 'اِ',
    color: '#3B82F6'
  },
  {
    id: 'zamme',
    name: 'ضمه (اُ)',
    symbol: 'ُ',
    position: 'above',
    sound: 'اُ',
    color: '#10B981'
  },
  {
    id: 'tashdid',
    name: 'تشدید',
    symbol: 'ّ',
    position: 'above',
    sound: 'تکرار محکم',
    color: '#F59E0B'
  },
  {
    id: 'sokoon',
    name: 'ساکن',
    symbol: 'ْ',
    position: 'above',
    sound: 'بدون حرکت',
    color: '#8B5CF6'
  }
];

export const PERSIAN_NUMBERS: NumberItem[] = [
  {
    digit: 0,
    persianDigit: '۰',
    word: 'صفر',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 50, y: 50 },
        points: [{ x: 50, y: 50 }, { x: 51, y: 51 }]
      }
    ]
  },
  {
    digit: 1,
    persianDigit: '۱',
    word: 'یک',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 50, y: 20 },
        points: [{ x: 50, y: 20 }, { x: 50, y: 50 }, { x: 50, y: 80 }],
        directionArrow: { x: 50, y: 50, angle: 90 }
      }
    ]
  },
  {
    digit: 2,
    persianDigit: '۲',
    word: 'دو',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 65, y: 25 },
        points: [
          { x: 65, y: 25 },
          { x: 55, y: 35 },
          { x: 45, y: 25 },
          { x: 40, y: 40 },
          { x: 40, y: 80 }
        ],
        directionArrow: { x: 55, y: 35, angle: 180 }
      }
    ]
  },
  {
    digit: 3,
    persianDigit: '۳',
    word: 'سه',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 75, y: 25 },
        points: [
          { x: 75, y: 25 },
          { x: 65, y: 35 },
          { x: 55, y: 25 },
          { x: 45, y: 35 },
          { x: 40, y: 40 },
          { x: 40, y: 80 }
        ],
        directionArrow: { x: 65, y: 35, angle: 180 }
      }
    ]
  },
  {
    digit: 4,
    persianDigit: '۴',
    word: 'چهار',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 65, y: 20 },
        points: [
          { x: 65, y: 20 },
          { x: 45, y: 40 },
          { x: 65, y: 55 },
          { x: 45, y: 80 }
        ],
        directionArrow: { x: 45, y: 40, angle: 135 }
      }
    ]
  },
  {
    digit: 5,
    persianDigit: '۵',
    word: 'پنج',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 50, y: 25 },
        points: [
          { x: 50, y: 25 },
          { x: 30, y: 45 },
          { x: 40, y: 75 },
          { x: 60, y: 75 },
          { x: 70, y: 45 },
          { x: 50, y: 25 }
        ],
        directionArrow: { x: 30, y: 45, angle: 135 }
      }
    ]
  },
  {
    digit: 6,
    persianDigit: '۶',
    word: 'شش',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 35, y: 25 },
        points: [
          { x: 35, y: 25 },
          { x: 65, y: 25 },
          { x: 65, y: 80 }
        ],
        directionArrow: { x: 50, y: 25, angle: 0 }
      }
    ]
  },
  {
    digit: 7,
    persianDigit: '۷',
    word: 'هفت',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 35, y: 25 },
        points: [
          { x: 35, y: 25 },
          { x: 50, y: 75 },
          { x: 65, y: 25 }
        ],
        directionArrow: { x: 50, y: 75, angle: 60 }
      }
    ]
  },
  {
    digit: 8,
    persianDigit: '۸',
    word: 'هشت',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 35, y: 75 },
        points: [
          { x: 35, y: 75 },
          { x: 50, y: 25 },
          { x: 65, y: 75 }
        ],
        directionArrow: { x: 50, y: 25, angle: 300 }
      }
    ]
  },
  {
    digit: 9,
    persianDigit: '۹',
    word: 'نه',
    strokeData: [
      {
        id: 1,
        startPoint: { x: 60, y: 40 },
        points: [
          { x: 60, y: 40 },
          { x: 45, y: 25 },
          { x: 30, y: 40 },
          { x: 45, y: 55 },
          { x: 60, y: 40 },
          { x: 60, y: 80 }
        ],
        directionArrow: { x: 45, y: 25, angle: 180 }
      }
    ]
  }
];

export const toPersianDigits = (n: number | string): string => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};
