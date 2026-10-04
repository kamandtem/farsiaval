import React, { useState } from 'react';
import { 
  Sparkles, 
  Volume2, 
  RotateCcw, 
  Plus, 
  Minus, 
  Equal, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { toPersianDigits } from '../data/persianAlphabet';
import { sound } from '../utils/audio';
import { MascotGuide } from './MascotGuide';

type MathSubMode = 'counting' | 'comparison' | 'chineh_add' | 'chineh_sub';

interface MathGamesProps {
  onActivityComplete: (type: 'math', id?: string) => void;
}

export const MathGames: React.FC<MathGamesProps> = ({ onActivityComplete }) => {
  const [subMode, setSubMode] = useState<MathSubMode>('chineh_add');

  // --- 1. Counting State ---
  const [targetCount, setTargetCount] = useState(4);
  const [tappedItems, setTappedItems] = useState<number[]>([]);
  const [countingFinished, setCountingFinished] = useState(false);

  // --- 2. Comparison State (Frogs vs Monkeys from uploaded image) ---
  const [compLevel, setCompLevel] = useState(0);
  const compQuestions = [
    { leftCount: 3, leftIcon: '🐸', leftName: 'قورباغه‌ها', rightCount: 2, rightIcon: '🐵', rightName: 'میمون‌ها', question: 'کدام دسته بیشتر است؟', target: 'left' },
    { leftCount: 2, leftIcon: '🐑', leftName: 'گوسفندها', rightCount: 4, rightIcon: '🐥', rightName: 'جوجه‌ها', question: 'کدام دسته کمتر است؟', target: 'left' },
    { leftCount: 3, leftIcon: '🍎', leftName: 'سیب‌ها', rightCount: 3, rightIcon: '🍊', rightName: 'پرتقال‌ها', question: 'آیا تعدادشان مساوی است؟', target: 'equal' }
  ];
  const activeComp = compQuestions[compLevel % compQuestions.length];
  const [compAnswered, setCompAnswered] = useState<string | null>(null);

  // --- 3. Chineh Addition State (۲ + ۳ = ۵) ---
  const [addNum1, setAddNum1] = useState(2);
  const [addNum2, setAddNum2] = useState(3);
  // Child places chineh blocks onto the combined tray
  const [placedChinehCount, setPlacedChinehCount] = useState(0);
  const [addCompleted, setAddCompleted] = useState(false);

  // --- 4. Chineh Subtraction State (۵ - ۲ = ۳) ---
  const [subTotal, setSubTotal] = useState(5);
  const [subRemoved, setSubRemoved] = useState(2);
  const [removedChinehIds, setRemovedChinehIds] = useState<number[]>([]);
  const [subCompleted, setSubCompleted] = useState(false);

  // Switching submodes
  const handleSwitchSubmode = (mode: MathSubMode) => {
    sound.playPop();
    setSubMode(mode);
    setTappedItems([]);
    setCountingFinished(false);
    setCompAnswered(null);
    setPlacedChinehCount(0);
    setAddCompleted(false);
    setRemovedChinehIds([]);
    setSubCompleted(false);
  };

  // 1. Counting logic
  const handleTapCountItem = (idx: number) => {
    if (tappedItems.includes(idx)) return;
    const newTapped = [...tappedItems, idx];
    setTappedItems(newTapped);
    const countNumber = newTapped.length;
    sound.playCount(countNumber);
    sound.speakPersian(toPersianDigits(countNumber));

    if (countNumber === targetCount) {
      setCountingFinished(true);
      sound.playSuccess();
      onActivityComplete('math', `count_${targetCount}`);
    }
  };

  const handleNextCounting = () => {
    sound.playPop();
    setTargetCount((prev) => (prev % 8) + 2);
    setTappedItems([]);
    setCountingFinished(false);
  };

  // 2. Comparison logic
  const handleCompChoice = (choice: 'left' | 'equal' | 'right') => {
    setCompAnswered(choice);
    if (choice === activeComp.target) {
      sound.playSuccess();
      sound.speakPersian('آفرین! کاملاً درسته');
      onActivityComplete('math', `comp_${compLevel}`);
    } else {
      sound.playGentleHint();
      sound.speakPersian('دوباره بشمار و نگاه کن عزیزم');
    }
  };

  const handleNextComp = () => {
    sound.playPop();
    setCompLevel((prev) => prev + 1);
    setCompAnswered(null);
  };

  // 3. Chineh Addition logic
  const handlePlaceChineh = () => {
    const totalNeeded = addNum1 + addNum2;
    if (placedChinehCount < totalNeeded) {
      const nextCount = placedChinehCount + 1;
      setPlacedChinehCount(nextCount);
      sound.playSnap();
      sound.playCount(nextCount);

      if (nextCount === totalNeeded) {
        setAddCompleted(true);
        sound.playSuccess();
        sound.speakPersian(`${toPersianDigits(addNum1)} به علاوه ${toPersianDigits(addNum2)} مساوی است با ${toPersianDigits(totalNeeded)}`);
        onActivityComplete('math', `add_${addNum1}_${addNum2}`);
      }
    }
  };

  const handleNextAddition = () => {
    sound.playPop();
    const pairs = [[2, 3], [1, 4], [3, 3], [2, 4], [1, 2]];
    const nextPair = pairs[(Math.floor(Math.random() * pairs.length))];
    setAddNum1(nextPair[0]);
    setAddNum2(nextPair[1]);
    setPlacedChinehCount(0);
    setAddCompleted(false);
  };

  // 4. Chineh Subtraction logic
  const handleRemoveChineh = (id: number) => {
    if (removedChinehIds.includes(id)) return;
    const nextRemoved = [...removedChinehIds, id];
    setRemovedChinehIds(nextRemoved);
    sound.playSnap();

    const remaining = subTotal - nextRemoved.length;
    sound.playCount(remaining);

    if (nextRemoved.length === subRemoved) {
      setSubCompleted(true);
      sound.playSuccess();
      sound.speakPersian(`${toPersianDigits(subTotal)} منهای ${toPersianDigits(subRemoved)} مساوی است با ${toPersianDigits(remaining)}`);
      onActivityComplete('math', `sub_${subTotal}_${subRemoved}`);
    }
  };

  const handleNextSubtraction = () => {
    sound.playPop();
    const problems = [[5, 2], [4, 1], [6, 3], [5, 3], [3, 1]];
    const nextProb = problems[Math.floor(Math.random() * problems.length)];
    setSubTotal(nextProb[0]);
    setSubRemoved(nextProb[1]);
    setRemovedChinehIds([]);
    setSubCompleted(false);
  };

  return (
    <div 
      id="math-games-view"
      className="flex flex-col h-full w-full max-w-5xl mx-auto p-2 md:p-4 gap-3 select-none"
    >
      {/* Top Banner with Mascot Guide */}
      <MascotGuide
        message={
          subMode === 'counting'
            ? 'روی میوه‌ها دونه‌دونه بزن تا با هم بشماریمشان!'
            : subMode === 'comparison'
            ? activeComp.question
            : subMode === 'chineh_add'
            ? `چینه‌های رنگی را لمس کن تا جمع شوند: ${toPersianDigits(addNum1)} + ${toPersianDigits(addNum2)}`
            : `از ${toPersianDigits(subTotal)} چینه، ${toPersianDigits(subRemoved)} تا را بردار تا ببینیم چند تا باقی می‌ماند:`
        }
        subMessage="ریاضی با بازی و شکل‌های ملموس و شیرین"
        onVoiceClick={() => {
          if (subMode === 'chineh_add') {
            sound.speakPersian(`${toPersianDigits(addNum1)} به علاوه ${toPersianDigits(addNum2)}`);
          } else if (subMode === 'chineh_sub') {
            sound.speakPersian(`${toPersianDigits(subTotal)} منهای ${toPersianDigits(subRemoved)}`);
          } else if (subMode === 'comparison') {
            sound.speakPersian(activeComp.question);
          } else {
            sound.speakPersian('اشیا را بشمار');
          }
        }}
      />

      {/* Sub-modes Navigator */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSwitchSubmode('chineh_add')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs md:text-sm transition-all ${
              subMode === 'chineh_add'
                ? 'bg-blue-500 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🟦 جمع با چینه
          </button>
          <button
            onClick={() => handleSwitchSubmode('chineh_sub')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs md:text-sm transition-all ${
              subMode === 'chineh_sub'
                ? 'bg-rose-500 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🟧 تفریق با چینه
          </button>
          <button
            onClick={() => handleSwitchSubmode('counting')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs md:text-sm transition-all ${
              subMode === 'counting'
                ? 'bg-emerald-500 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🍎 شمارش اشیا
          </button>
          <button
            onClick={() => handleSwitchSubmode('comparison')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs md:text-sm transition-all ${
              subMode === 'comparison'
                ? 'bg-amber-400 text-amber-950 shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ⚖️ بیشتر و کمتر
          </button>
        </div>
      </div>

      {/* Main Math Stage */}
      <div className="relative flex-1 min-h-[380px] md:min-h-[440px] bg-gradient-to-b from-[#FDFEFE] to-[#F1F5F9] rounded-3xl border-4 border-slate-200 shadow-md p-6 flex flex-col items-center justify-center overflow-hidden">
        {/* MODE 1: CHINEH ADDITION */}
        {subMode === 'chineh_add' && (
          <div className="flex flex-col items-center justify-between h-full w-full max-w-xl gap-6">
            {/* Visual Formula Display */}
            <div className="flex items-center gap-3 md:gap-4 bg-white px-6 py-3 rounded-2xl border-2 border-blue-200 shadow-sm">
              <span className="text-3xl md:text-4xl font-black text-blue-600">
                {toPersianDigits(addNum1)}
              </span>
              <Plus className="w-6 h-6 text-slate-400" />
              <span className="text-3xl md:text-4xl font-black text-emerald-600">
                {toPersianDigits(addNum2)}
              </span>
              <Equal className="w-6 h-6 text-slate-400" />
              <span className="text-3xl md:text-4xl font-black text-amber-600">
                {addCompleted ? toPersianDigits(addNum1 + addNum2) : '؟'}
              </span>
            </div>

            {/* Chineh Manipulative Blocks Workspace */}
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Target Row: The Child fills this row */}
              <div className="w-full bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  ردیف جمع چینه (روی دکمه «گذاشتن چینه» بزن):
                </span>
                <div className="flex items-center gap-2 min-h-[60px] p-2 bg-white rounded-xl shadow-inner overflow-x-auto max-w-full">
                  {Array.from({ length: addNum1 + addNum2 }).map((_, idx) => {
                    const isFilled = idx < placedChinehCount;
                    const isGroup1 = idx < addNum1;

                    return (
                      <div
                        key={idx}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 flex items-center justify-center font-black text-xl transition-all duration-300 ${
                          isFilled
                            ? isGroup1
                              ? 'bg-blue-500 border-blue-600 text-white shadow-md scale-100'
                              : 'bg-emerald-500 border-emerald-600 text-white shadow-md scale-100'
                            : 'bg-slate-50 border-dashed border-slate-300 text-slate-300 scale-95'
                        }`}
                        style={{
                          boxShadow: isFilled ? '0 5px 0 rgba(0,0,0,0.15)' : undefined
                        }}
                      >
                        {isFilled ? toPersianDigits(idx + 1) : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button: Add a Chineh */}
              {!addCompleted ? (
                <button
                  id="add-chineh-block-btn"
                  onClick={handlePlaceChineh}
                  className="toy-btn-yellow px-8 py-3.5 rounded-2xl text-amber-950 font-black text-base md:text-lg flex items-center gap-2 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>یک چینه بگذار ({toPersianDigits(placedChinehCount)} از {toPersianDigits(addNum1 + addNum2)})</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3 animate-bounce">
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-lg">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>آفرین! حاصل جمع برابر شد با {toPersianDigits(addNum1 + addNum2)}</span>
                  </div>
                  <button
                    onClick={handleNextAddition}
                    className="toy-btn-green px-8 py-2.5 rounded-2xl text-white font-black text-sm flex items-center gap-2"
                  >
                    جمع بعدی
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: CHINEH SUBTRACTION */}
        {subMode === 'chineh_sub' && (
          <div className="flex flex-col items-center justify-between h-full w-full max-w-xl gap-6">
            <div className="flex items-center gap-3 md:gap-4 bg-white px-6 py-3 rounded-2xl border-2 border-rose-200 shadow-sm">
              <span className="text-3xl md:text-4xl font-black text-rose-600">
                {toPersianDigits(subTotal)}
              </span>
              <Minus className="w-6 h-6 text-slate-400" />
              <span className="text-3xl md:text-4xl font-black text-amber-600">
                {toPersianDigits(subRemoved)}
              </span>
              <Equal className="w-6 h-6 text-slate-400" />
              <span className="text-3xl md:text-4xl font-black text-emerald-600">
                {subCompleted ? toPersianDigits(subTotal - subRemoved) : '؟'}
              </span>
            </div>

            <p className="text-sm font-bold text-slate-600 text-center">
              روی {toPersianDigits(subRemoved)} تا از چینه‌ها بزن تا برداشته شوند:
            </p>

            {/* Interactive Chineh Blocks for Subtraction */}
            <div className="flex items-center gap-3 flex-wrap justify-center p-4 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300">
              {Array.from({ length: subTotal }).map((_, idx) => {
                const isRemoved = removedChinehIds.includes(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => handleRemoveChineh(idx)}
                    disabled={isRemoved || subCompleted}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 font-black text-2xl flex items-center justify-center transition-all ${
                      isRemoved
                        ? 'opacity-20 scale-75 bg-slate-200 border-slate-300 line-through text-slate-400'
                        : 'bg-rose-500 hover:bg-rose-600 border-rose-600 text-white shadow-md active:scale-95'
                    }`}
                    style={{
                      boxShadow: isRemoved ? undefined : '0 6px 0 #BE123C'
                    }}
                  >
                    {toPersianDigits(idx + 1)}
                  </button>
                );
              })}
            </div>

            {subCompleted && (
              <div className="flex flex-col items-center gap-2 animate-fade-in">
                <p className="text-emerald-700 font-extrabold text-base">
                  {toPersianDigits(subTotal - subRemoved)} چینه باقی ماند! ✨
                </p>
                <button
                  onClick={handleNextSubtraction}
                  className="toy-btn-green px-8 py-2.5 rounded-2xl text-white font-black text-sm flex items-center gap-2"
                >
                  مسئله بعدی
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 3: COUNTING OBJECTS */}
        {subMode === 'counting' && (
          <div className="flex flex-col items-center justify-between h-full w-full max-w-lg gap-6">
            <div className="text-center">
              <span className="text-xs text-slate-500 font-bold block">تعداد شمرده‌شده:</span>
              <span className="text-4xl md:text-5xl font-black text-amber-500">
                {toPersianDigits(tappedItems.length)}
              </span>
            </div>

            {/* Objects Grid to Tap */}
            <div className="flex flex-wrap items-center justify-center gap-4 max-w-sm">
              {Array.from({ length: targetCount }).map((_, idx) => {
                const isTapped = tappedItems.includes(idx);
                const tapOrder = tappedItems.indexOf(idx) + 1;

                return (
                  <button
                    key={idx}
                    onClick={() => handleTapCountItem(idx)}
                    disabled={isTapped}
                    className={`relative w-20 h-20 rounded-3xl flex items-center justify-center text-4xl border-2 transition-all active:scale-90 ${
                      isTapped
                        ? 'bg-emerald-100 border-emerald-400 scale-105 shadow-md'
                        : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
                    }`}
                  >
                    <span>🍎</span>
                    {isTapped && (
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white font-black text-sm flex items-center justify-center shadow">
                        {toPersianDigits(tapOrder)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {countingFinished && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-base font-black text-emerald-600">
                  آفرین! دقیقاً {toPersianDigits(targetCount)} تا سیب بود! 🍎
                </p>
                <button
                  onClick={handleNextCounting}
                  className="toy-btn-green px-8 py-2.5 rounded-2xl text-white font-black text-sm"
                >
                  شمارش بعدی
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 4: COMPARISON (MORE VS LESS - INSPIRED BY 8888888888888.png) */}
        {subMode === 'comparison' && (
          <div className="flex flex-col items-center justify-between h-full w-full max-w-xl gap-6">
            <h3 className="text-xl font-black text-slate-800">
              {activeComp.question}
            </h3>

            {/* Two Side Comparison Cards */}
            <div className="flex items-center justify-center gap-4 md:gap-8 w-full">
              {/* Left Group */}
              <div className="flex-1 bg-white rounded-3xl border-3 border-emerald-200 p-4 flex flex-col items-center gap-2 shadow-sm">
                <span className="text-xs font-bold text-slate-500">
                  {activeComp.leftName}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2 min-h-[80px]">
                  {Array.from({ length: activeComp.leftCount }).map((_, i) => (
                    <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
                      {activeComp.leftIcon}
                    </span>
                  ))}
                </div>
                <span className="text-2xl font-black text-emerald-600">
                  {toPersianDigits(activeComp.leftCount)}
                </span>
              </div>

              {/* Center Divider / Equal Tag */}
              <span className="text-slate-300 font-bold text-lg">یا</span>

              {/* Right Group */}
              <div className="flex-1 bg-white rounded-3xl border-3 border-amber-200 p-4 flex flex-col items-center gap-2 shadow-sm">
                <span className="text-xs font-bold text-slate-500">
                  {activeComp.rightName}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2 min-h-[80px]">
                  {Array.from({ length: activeComp.rightCount }).map((_, i) => (
                    <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
                      {activeComp.rightIcon}
                    </span>
                  ))}
                </div>
                <span className="text-2xl font-black text-amber-600">
                  {toPersianDigits(activeComp.rightCount)}
                </span>
              </div>
            </div>

            {/* Answer Options */}
            <div className="flex items-center gap-3 w-full max-w-sm">
              <button
                onClick={() => handleCompChoice('left')}
                className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 transition-all ${
                  compAnswered === 'left' && activeComp.target === 'left'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow'
                    : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800'
                }`}
              >
                {activeComp.leftName}
              </button>

              <button
                onClick={() => handleCompChoice('equal')}
                className={`px-4 py-3 rounded-2xl font-black text-sm border-2 transition-all ${
                  compAnswered === 'equal' && activeComp.target === 'equal'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow'
                    : 'bg-white border-slate-200 hover:border-sky-300 text-slate-800'
                }`}
              >
                مساوی
              </button>

              <button
                onClick={() => handleCompChoice('right')}
                className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 transition-all ${
                  compAnswered === 'right' && activeComp.target === 'right'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow'
                    : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800'
                }`}
              >
                {activeComp.rightName}
              </button>
            </div>

            {compAnswered === activeComp.target && (
              <button
                onClick={handleNextComp}
                className="toy-btn-green px-8 py-2.5 rounded-2xl text-white font-black text-sm flex items-center gap-2"
              >
                سؤال بعدی
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
