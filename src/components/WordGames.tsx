import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, Shuffle } from 'lucide-react';
import { FIRST_GRADE_WORDS } from '../data/words';
import { PERSIAN_LETTERS, toPersianDigits } from '../data/persianAlphabet';
import { WordItem, PersianLetter } from '../types';
import { getLetterById, computePersianForms, getLetterGlyph } from '../utils/persianEngine';
import { sound } from '../utils/audio';
import { MascotGuide } from './MascotGuide';
import { boardLessonWords } from '../data/wordBank';
import { useCurrentLesson } from '../utils/lessonState';
import { plainWord } from '../utils/pieces';

interface WordGamesProps {
  onActivityComplete: (type: 'word', id?: string) => void;
}

export const WordGames: React.FC<WordGamesProps> = ({ onActivityComplete }) => {
  const [lessonOrder] = useCurrentLesson();
  const availableWords = useMemo(() => {
    const allowed = new Set(boardLessonWords(lessonOrder).map(w => w.plain));
    const exact = FIRST_GRADE_WORDS.filter(w => allowed.has(plainWord(w.word)));
    return exact.length ? exact : FIRST_GRADE_WORDS.filter(w => {
      const plain = plainWord(w.word);
      return boardLessonWords(lessonOrder).some(source => source.lesson <= lessonOrder && source.plain === plain);
    });
  }, [lessonOrder]);
  const [wordIndex, setWordIndex] = useState(0);
  const activeWord: WordItem = availableWords[wordIndex % Math.max(1, availableWords.length)] || FIRST_GRADE_WORDS[0];

  // Missing slot index
  const missingSlot = activeWord.missingIndex ?? 0;
  const missingLetterId = activeWord.letters[missingSlot];
  const missingLetterDef = getLetterById(missingLetterId);

  // Solved state
  const [isSolved, setIsSolved] = useState(false);
  const [shakingOptionId, setShakingOptionId] = useState<string | null>(null);

  // Generate 3 choices: the correct letter + 2 random distractors
  const [options, setOptions] = useState<PersianLetter[]>([]);
  const autoTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(autoTimer.current), []);
  useEffect(() => { setWordIndex(0); }, [lessonOrder]);

  useEffect(() => {
    setIsSolved(false);
    setShakingOptionId(null);

    const correct = missingLetterDef;
    if (!correct) return;

    // حروف انحرافی هم فقط از نشانه‌های واژه‌های همین درس و پیش‌نیازهایش باشند
    const learnedIds = new Set(availableWords.flatMap(w => w.letters));
    const otherLetters = PERSIAN_LETTERS.filter((l) => l.id !== correct.id && learnedIds.has(l.id));
    const shuffledOthers = [...otherLetters].sort(() => 0.5 - Math.random());
    const choices = [correct, shuffledOthers[0] || PERSIAN_LETTERS.find(l => l.id !== correct.id), shuffledOthers[1] || PERSIAN_LETTERS.find(l => l.id !== correct.id && l.id !== shuffledOthers[0]?.id)].filter((l): l is PersianLetter => Boolean(l)).sort(() => 0.5 - Math.random());
    setOptions(choices);

    sound.speakPersian(`جای خالی در کلمه ${activeWord.word} را با حرف مناسب پر کن.`);
  }, [wordIndex, activeWord.id, lessonOrder]);

  // Handle option selection
  const handleSelectOption = (chosen: PersianLetter) => {
    if (isSolved) return;

    if (chosen.id === missingLetterId) {
      // Correct!
      sound.playSnap();
      sound.playSuccess();
      setIsSolved(true);
      sound.speakPersian(activeWord.word);
      onActivityComplete('word', activeWord.id);
      window.clearTimeout(autoTimer.current); autoTimer.current = window.setTimeout(() => setWordIndex((p) => (p + 1) % Math.max(1, availableWords.length)), 2000);
    } else {
      // Gentle hint (never harsh or punishing)
      sound.playGentleHint();
      setShakingOptionId(chosen.id);
      setTimeout(() => setShakingOptionId(null), 600);
      sound.speakPersian('دوباره امتحان کن عزیزم');
    }
  };

  const handleNextWord = () => {
    window.clearTimeout(autoTimer.current);
    sound.playPop();
    setWordIndex((p) => (p + 1) % Math.max(1, availableWords.length));
  };

  const handlePrevWord = () => {
    window.clearTimeout(autoTimer.current);
    sound.playPop();
    setWordIndex((p) => (p - 1 + Math.max(1, availableWords.length)) % Math.max(1, availableWords.length));
  };

  // Convert the word's letter sequence into displayable glyphs with missing blank slot
  const letterObjects = activeWord.letters
    .map((id) => getLetterById(id))
    .filter((l): l is PersianLetter => Boolean(l));

  const forms = computePersianForms(letterObjects);

  return (
    <div 
      id="word-games-view"
      className="flex flex-col h-full w-full max-w-4xl mx-auto p-2 md:p-4 gap-3 select-none"
    >
      {/* Mascot Guidance */}
      <MascotGuide
        message={
          isSolved
            ? `آفرین! کلمه «${activeWord.word}» کامل شد!`
            : `کدام حرف جای خالی را پر می‌کند تا کلمه «${activeWord.word}» ساخته شود؟`
        }
        subMessage={activeWord.hint}
        onVoiceClick={() => {
          sound.speakPersian(`کلمه ${activeWord.word}`);
        }}
      />

      {/* Main Interactive Flashcard Stage */}
      <div className="relative flex-1 min-h-[380px] bg-white rounded-3xl border-4 border-slate-200 shadow-md p-6 flex flex-col items-center justify-between overflow-hidden">
        {/* Carousel buttons */}
        <button
          onClick={handlePrevWord}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center border border-slate-300 shadow-sm active:scale-95 transition-all z-10"
          title="کلمه قبلی"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <button
          onClick={handleNextWord}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center border border-slate-300 shadow-sm active:scale-95 transition-all z-10"
          title="کلمه بعدی"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Top Word Level & Sound Tag */}
        <div className="flex items-center justify-between w-full max-w-md">
          <span className="px-3 py-1 bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-900">
            کلمهٔ {toPersianDigits(wordIndex % Math.max(1, availableWords.length) + 1)}
          </span>

          {/* بلندگوی «شنیدن کلمه» تا آماده شدن صدای ضبط‌شدهٔ کلمه‌ها برداشته شد */}
        </div>

        {/* Center Picture Illustration */}
        <div className="flex flex-col items-center justify-center gap-3 my-auto">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 border-4 border-amber-200 flex items-center justify-center text-6xl shadow-inner relative overflow-hidden group">
            <span className="drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
              {activeWord.imageEmoji}
            </span>
            {isSolved && (
              <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>

          <p className="text-sm font-bold text-slate-500">
            {activeWord.meaning}
          </p>

          {/* Connected Word Display with Blank Slot */}
          <div className="flex items-center gap-2 mt-2 bg-slate-50 border-2 border-slate-200 px-6 py-3 rounded-2xl">
            {letterObjects.map((letter, idx) => {
              const isMissing = idx === missingSlot;
              const glyph = getLetterGlyph(letter, forms[idx]);

              if (isMissing && !isSolved) {
                return (
                  <div
                    key={`slot_${idx}`}
                    className="w-14 h-16 rounded-xl border-2 border-dashed border-sky-400 bg-sky-50 flex items-center justify-center text-sky-500 font-black text-2xl animate-pulse shadow-inner"
                  >
                    ؟
                  </div>
                );
              }

              return (
                <div
                  key={`slot_${idx}`}
                  className={`w-14 h-16 rounded-xl flex items-center justify-center font-black text-3xl border-2 shadow-sm transition-all ${
                    isMissing && isSolved
                      ? 'bg-emerald-500 border-emerald-600 text-white animate-bounce'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {glyph}
                </div>
              );
            })}
          </div>
        </div>

        {/* Letter Choices Options */}
        <div className="w-full max-w-md flex flex-col items-center gap-2 mt-auto">
          <p className="text-xs font-bold text-slate-500">
            حرف درست را لمس کن:
          </p>
          <div className="flex items-center justify-center gap-4 w-full">
            {options.map((option) => {
              const isShaking = shakingOptionId === option.id;
              const isCorrectTarget = option.id === missingLetterId;

              return (
                <button
                  key={option.id}
                  id={`word-option-${option.id}`}
                  onClick={() => handleSelectOption(option)}
                  disabled={isSolved}
                  className={`w-18 h-18 rounded-2xl flex flex-col items-center justify-center font-black text-3xl border-2 shadow-md transition-all active:scale-95 ${
                    isShaking
                      ? 'bg-rose-100 border-rose-400 text-rose-700 animate-wiggle'
                      : isSolved && isCorrectTarget
                      ? 'bg-emerald-500 border-emerald-600 text-white scale-105'
                      : 'bg-white border-slate-300 hover:border-amber-400 text-slate-800 hover:bg-amber-50'
                  }`}
                  style={{
                    boxShadow: isSolved && isCorrectTarget ? '0 6px 0 #059669' : '0 6px 0 #CBD5E1'
                  }}
                >
                  <span>{option.isolated}</span>
                  <span className="text-[10px] font-bold opacity-70">
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Footer Action */}
      {isSolved && (
        <div className="flex justify-center">
          <button
            onClick={handleNextWord}
            className="toy-btn-green px-8 py-3 rounded-2xl text-white font-black text-base flex items-center gap-2 shadow-lg"
          >
            <span>کلمه بعدی</span>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
