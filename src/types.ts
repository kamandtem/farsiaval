export type LetterCategory = 'vowel' | 'consonant' | 'harakat';

export interface TracePoint {
  x: number;
  y: number;
}

export interface TraceStroke {
  id: number;
  points: TracePoint[];
  startPoint: TracePoint;
  directionArrow?: { x: number; y: number; angle: number };
}

export interface PersianLetter {
  id: string;
  name: string; // e.g. "میم"
  soundLabel: string; // e.g. "مـ"
  category: LetterCategory;
  isolated: string; // م
  initial: string; // مـ
  medial: string; // ـمـ
  final: string; // ـم
  canConnectBefore: boolean; // right connection (from preceding letter)
  canConnectAfter: boolean; // left connection (to following letter) - FALSE for ا، د، ذ، ر، ز، ژ، و
  color: string;
  phoneticDescription: string;
  exampleWord: string;
  exampleEmoji: string;
  strokeData?: TraceStroke[];
}

export interface HarakatSymbol {
  id: string;
  name: string; // "زِبَر (اَ)", "زیر (اِ)", "پیش (اُ)", "تشدید", "ساکن"
  symbol: string; // َ ِ ُ ّ ْ
  position: 'above' | 'below';
  sound: string;
  color: string;
}

export interface PlacedMagneticPiece {
  id: string;
  type: 'letter' | 'harakat';
  letterId?: string;
  harakatId?: string;
  x: number; // board x in px
  y: number; // board y in px
  clusterId?: string; // Group ID if connected
  clusterOrder?: number; // Position in word cluster
  form?: 'isolated' | 'initial' | 'medial' | 'final';
  preferredForm?: 'isolated' | 'initial' | 'medial' | 'final';
  customGlyph?: string;
  attachedToLetterId?: string; // For harakat attached to letter
}

export interface WordItem {
  id: string;
  word: string;
  syllables: string[];
  letters: string[]; // letter ids
  missingIndex?: number;
  imageEmoji: string;
  meaning: string;
  hint: string;
  difficulty: 1 | 2 | 3;
  acceptedForms?: string[];
}

export interface NumberItem {
  digit: number; // 0 - 9
  persianDigit: string; // ۰ - ۹
  word: string; // صفر - نه
  strokeData: TraceStroke[];
}

export type ActiveScreen = 
  | 'home' 
  | 'magnetic_board' 
  | 'trace_practice' 
  | 'word_games' 
  | 'math_games'
  | 'progress_garden'
  | 'splash'
  | 'subject_select'
  | 'village_map'
  | 'recognition_village'
  | 'sentence_builder'
  | 'word_village'
  | 'my_progress';

export interface UserProgress {
  activitiesDoneToday: number;
  lettersLearned: string[];
  wordsCompleted: string[];
  mathChallengesSolved: number;
  gardenLeaves: number;
  starsCount: number;
  lastActiveDate: string;
}
