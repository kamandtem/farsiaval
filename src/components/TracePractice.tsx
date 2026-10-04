import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Pencil,
  Eye,
  Zap
} from 'lucide-react';
import { PERSIAN_LETTERS, PERSIAN_NUMBERS, toPersianDigits } from '../data/persianAlphabet';
import { PersianLetter, NumberItem, TraceStroke, TracePoint } from '../types';
import { sound } from '../utils/audio';
import { MascotGuide } from './MascotGuide';

interface TracePracticeProps {
  onActivityComplete: (type: 'letter' | 'math', id?: string) => void;
  curriculumLetterIds?: string[];
}

export const TracePractice: React.FC<TracePracticeProps> = ({ onActivityComplete, curriculumLetterIds }) => {
  // Mode: Letters or Numbers
  const [traceType, setTraceType] = useState<'letters' | 'numbers'>('letters');
  
  // Levels: 1 (full guide), 2 (faint guide), 3 (freehand independent)
  const [level, setLevel] = useState<1 | 2 | 3>(1);

  // Available items with stroke data
  const curriculumLettersWithStrokes = (curriculumLetterIds?.length ? PERSIAN_LETTERS.filter((l) => curriculumLetterIds.includes(l.id)) : PERSIAN_LETTERS).filter((l) => l.strokeData && l.strokeData.length > 0);
  const lettersWithStrokes = curriculumLettersWithStrokes.length ? curriculumLettersWithStrokes : PERSIAN_LETTERS.filter((l) => l.strokeData && l.strokeData.length > 0);
  const [selectedLetterIndex, setSelectedLetterIndex] = useState(0);
  const [selectedNumberIndex, setSelectedNumberIndex] = useState(1); // Start with '1'

  const activeLetter: PersianLetter = lettersWithStrokes[selectedLetterIndex % lettersWithStrokes.length];
  const activeNumber: NumberItem = PERSIAN_NUMBERS[selectedNumberIndex % PERSIAN_NUMBERS.length];

  const currentStrokes: TraceStroke[] = traceType === 'letters' 
    ? (activeLetter.strokeData || []) 
    : activeNumber.strokeData;

  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [userPoints, setUserPoints] = useState<TracePoint[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [startAccepted, setStartAccepted] = useState(false);
  const [guideArrowPulse, setGuideArrowPulse] = useState(0);

  // Periodic subtle animation for guide point
  useEffect(() => {
    const timer = setInterval(() => {
      setGuideArrowPulse((p) => (p + 1) % 100);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Reset drawing when changing item or mode
  useEffect(() => {
    handleClearCanvas();
    if (traceType === 'letters') sound.playLetterById(activeLetter.id, activeLetter.name);
    else sound.speakPersian(`بنویس: ${activeNumber.word}`);
  }, [traceType, selectedLetterIndex, selectedNumberIndex, level]);

  const handleClearCanvas = () => {
    setUserPoints([]);
    setProgressPercent(0);
    setIsCompleted(false);
    setStartAccepted(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Distance helper
  const dist = (p1: TracePoint, p2: TracePoint) => 
    Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

  // Smart Path Correction & Progress Evaluation
  const processPoint = (rawX: number, rawY: number) => {
    if (isCompleted) return false;

    const canvas = canvasRef.current;
    if (!canvas) return false;

    const rect = canvas.getBoundingClientRect();
    // Normalize into 0..100 coordinate space of the template
    const normX = ((rawX - rect.left) / rect.width) * 100;
    const normY = ((rawY - rect.top) / rect.height) * 100;

    // Flatten all points of current stroke
    const targetPoints = currentStrokes.flatMap((s) => s.points);
    if (targetPoints.length === 0) return false;

    // Smart smoothing: find nearest point on target stroke
    let nearestPoint: TracePoint = targetPoints[0];
    let minD = Infinity;

    for (const pt of targetPoints) {
      const d = dist({ x: normX, y: normY }, pt);
      if (d < minD) {
        minD = d;
        nearestPoint = pt;
      }
    }

    // دو تلاش اول عمداً آزادند، بعد مسیر هر بار جدی‌تر دنبال می‌شود.
    const pathTolerance = [30, 30, 20, 13, 9][Math.min(4, attempt - 1)];
    const dotTolerance = [28, 28, 20, 13, 9][Math.min(4, attempt - 1)];
    if (!startAccepted) {
      if (dist({ x: normX, y: normY }, startPt) > dotTolerance) return false;
      setStartAccepted(true);
    }

    if (minD < pathTolerance) {
      // Blend 70% toward nearest correct point to smooth kid's jitter!
      const smoothedX = normX * 0.3 + nearestPoint.x * 0.7;
      const smoothedY = normY * 0.3 + nearestPoint.y * 0.7;

      const newPoint = { x: smoothedX, y: smoothedY };
      const updated = [...userPoints, newPoint];
      setUserPoints(updated);

      // Estimate progress along target path
      // Count how many target points have been touched/visited
      let touchedCount = 0;
      for (const tPt of targetPoints) {
        const hasNearUserPoint = updated.some((uPt) => dist(uPt, tPt) < 14);
        if (hasNearUserPoint) touchedCount++;
      }

      const percent = Math.min(100, Math.round((touchedCount / targetPoints.length) * 100));
      setProgressPercent(percent);

      // Sound pop at key checkpoints
      if (percent > 0 && percent % 25 === 0) {
        sound.playPop();
      }

      // هر تلاش بعدی واقعاً نیاز به دنبال کردن بخش بیشتری از مسیر دارد.
      const completionThreshold = [70, 70, 78, 88, 94][Math.min(4, attempt - 1)];
      if (percent >= completionThreshold && !isCompleted) {
        completeTrace(targetPoints);
      }
      return true;
    }
    return false;
  };

  const completeTrace = (targetPoints: TracePoint[]) => {
    setIsCompleted(true);
    setProgressPercent(100);
    setUserPoints(targetPoints);
    sound.playSuccess();
    
    if (traceType === 'letters') {
      sound.speakPersian(`آفرین! حرف ${activeLetter.name}`);
      onActivityComplete('letter', activeLetter.id);
    } else {
      sound.speakPersian(`آفرین! عدد ${activeNumber.word}`);
      onActivityComplete('math', String(activeNumber.digit));
    }
  };

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDrawing(processPoint(e.clientX, e.clientY));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    processPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    if (!isCompleted && progressPercent < 70) {
      setAttempt(a => Math.min(5, a + 1));
      handleClearCanvas();
    }
  };

  // Next/Prev item
  const handleNext = () => {
    sound.playPop();
    if (traceType === 'letters') {
      setSelectedLetterIndex((p) => (p + 1) % lettersWithStrokes.length);
    } else {
      setSelectedNumberIndex((p) => (p + 1) % PERSIAN_NUMBERS.length);
    }
  };

  const handlePrev = () => {
    sound.playPop();
    if (traceType === 'letters') {
      setSelectedLetterIndex((p) => (p - 1 + lettersWithStrokes.length) % lettersWithStrokes.length);
    } else {
      setSelectedNumberIndex((p) => (p - 1 + PERSIAN_NUMBERS.length) % PERSIAN_NUMBERS.length);
    }
  };

  const firstStroke = currentStrokes[0];
  const startPt = firstStroke ? firstStroke.startPoint : { x: 50, y: 30 };

  return (
    <div 
      id="trace-practice-view"
      className="flex flex-col h-full w-full max-w-5xl mx-auto p-2 md:p-4 gap-3 select-none"
    >
      {/* Top Banner with Mascot Guidance */}
      <MascotGuide
        message={
          isCompleted
            ? 'بسیار عالی نوشتی! ستاره طلایی گرفتی! ✨'
            : traceType === 'letters'
            ? `با انگشت روی خط‌چین‌ها بکش تا حرف «${activeLetter.name}» نوشته شود:`
            : `با دست روی خط‌چین بکش تا عدد «${activeNumber.persianDigit}» (${activeNumber.word}) را بنویسی:`
        }
        subMessage={
          traceType === 'letters'
            ? activeLetter.phoneticDescription
            : 'از نقطه زرد شروع کن و به جهت فلش حرکت کن'
        }
        onVoiceClick={() => {
          if (traceType === 'letters') sound.playLetterById(activeLetter.id, activeLetter.name);
          else sound.speakPersian(`این عدد ${activeNumber.word} است.`);
        }}
      />

      {/* Control Toolbar: Mode Selection + Difficulty Levels */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl border-2 border-slate-200 p-2 px-3 shadow-sm">
        {/* Letters vs Numbers Mode */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="trace-type-letters-btn"
            onClick={() => {
              sound.playPop();
              setTraceType('letters');
            }}
            className={`px-3 py-1.5 rounded-lg font-black text-xs md:text-sm transition-all ${
              traceType === 'letters'
                ? 'bg-amber-400 text-amber-950 shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✏️ نوشتن حروف
          </button>
          <button
            id="trace-type-numbers-btn"
            onClick={() => {
              sound.playPop();
              setTraceType('numbers');
            }}
            className={`px-3 py-1.5 rounded-lg font-black text-xs md:text-sm transition-all ${
              traceType === 'numbers'
                ? 'bg-emerald-400 text-emerald-950 shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔢 عددنویسی (۰ تا ۹)
          </button>
        </div>

        {/* 3 Difficulty Levels */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 font-bold ml-1 hidden sm:inline">
            راهنما:
          </span>
          {[
            { lvl: 1, title: 'راهنمای کامل' },
            { lvl: 2, title: 'کم‌رنگ' },
            { lvl: 3, title: 'مستقل' }
          ].map((item) => (
            <button
              key={item.lvl}
              onClick={() => {
                sound.playPop();
                setLevel(item.lvl as 1 | 2 | 3);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                level === item.lvl
                  ? 'bg-sky-500 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              سطح {toPersianDigits(item.lvl)}
            </button>
          ))}
        </div>

        {/* Clear & Speak */}
        <div className="flex items-center gap-1.5">
          <button
            id="trace-speak-btn"
            onClick={() => {
              sound.playPop();
              if (traceType === 'letters') sound.playLetterById(activeLetter.id, activeLetter.name);
              else sound.speakPersian(activeNumber.word);
            }}
            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 shadow-sm transition-all"
            title="شنیدن صدا"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            id="trace-restart-btn"
            onClick={handleClearCanvas}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 shadow-sm transition-all"
            title="شروع مجدد"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tracing Stage */}
      <div className="relative flex-1 min-h-[360px] md:min-h-[420px] bg-white rounded-3xl border-4 border-slate-200 shadow-md flex items-center justify-center overflow-hidden touch-none">
        {/* Lined Notebook Paper Background for 1st grade realism */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="w-full h-full flex flex-col justify-around py-4">
            <div className="w-full h-0.5 bg-blue-400" />
            <div className="w-full h-0.5 bg-rose-400 border-b border-dashed border-rose-400" />
            <div className="w-full h-0.5 bg-blue-400" />
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          id="trace-prev-btn"
          onClick={handlePrev}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/90 hover:bg-amber-100 border-2 border-slate-300 text-slate-800 flex items-center justify-center shadow-md active:scale-95 transition-all z-20"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <button
          id="trace-next-btn"
          onClick={handleNext}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/90 hover:bg-amber-100 border-2 border-slate-300 text-slate-800 flex items-center justify-center shadow-md active:scale-95 transition-all z-20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Tracing SVG Canvas */}
        <div 
          id="trace-interactive-stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-[320px] h-[320px] md:w-[380px] md:h-[380px] flex items-center justify-center cursor-pointer"
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible drop-shadow-md select-none"
          >
            {/* Guide Stroke Paths */}
            {currentStrokes.map((stroke) => {
              const pathD = stroke.points.reduce(
                (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
                ''
              );

              return (
                <g key={stroke.id}>
                  {/* Outer Guide Channel */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={level === 3 ? '#E2E8F0' : level === 2 ? '#CBD5E1' : '#E0E7FF'}
                    strokeWidth={level === 3 ? 12 : 18}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dashed Center Guidance Line */}
                  {level <= 2 && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      opacity={level === 1 ? 0.8 : 0.4}
                    />
                  )}

                  {/* Direction Arrow if Level 1 */}
                  {level === 1 && stroke.directionArrow && (
                    <g
                      transform={`translate(${stroke.directionArrow.x}, ${stroke.directionArrow.y}) rotate(${stroke.directionArrow.angle})`}
                    >
                      <path
                        d="M -3 -4 L 4 0 L -3 4 Z"
                        fill="#4F46E5"
                        className="animate-pulse"
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Starting Yellow Dot */}
            {level <= 2 && !isCompleted && (
              <g transform={`translate(${startPt.x}, ${startPt.y})`}>
                <circle
                  r="6"
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="animate-ping"
                  opacity="0.6"
                />
                <circle
                  r="5"
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="1"
                  fontSize="4"
                  fontWeight="bold"
                  fill="#FFFFFF"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  شروع
                </text>
              </g>
            )}

            {/* Kid's Drawn Path */}
            {userPoints.length > 1 && (
              <path
                d={userPoints.reduce(
                  (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
                  ''
                )}
                fill="none"
                stroke={isCompleted ? '#10B981' : '#3B82F6'}
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            )}
          </svg>

          {/* Hidden Canvas ref for coordinate sizing */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
          />
        </div>

        {/* Star Sparkle Reward upon Completion */}
        {isCompleted && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-30 pointer-events-none animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-400 flex items-center justify-center text-4xl shadow-lg mb-2 animate-bounce">
              ⭐
            </div>
            <h3 className="text-2xl font-black text-emerald-800">
              آفرین! خیلی تمیز نوشتی
            </h3>
            <p className="text-sm font-bold text-slate-600 mt-1">
              {traceType === 'letters'
                ? `حرف «${activeLetter.name}» کامل شد!`
                : `عدد «${activeNumber.persianDigit}» را یاد گرفتی!`}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar & Quick Select Tray */}
      <div className="flex flex-col gap-2 bg-white rounded-2xl border-2 border-slate-200 p-3 shadow-sm">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600 min-w-[70px]">
            پیشرفت: {toPersianDigits(progressPercent)}٪
          </span>
          <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {isCompleted && (
            <button
              onClick={handleNext}
              className="toy-btn-green px-4 py-1.5 rounded-xl text-white font-black text-xs md:text-sm flex items-center gap-1 shadow"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Selection Tiles */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {traceType === 'letters' ? (
            lettersWithStrokes.map((l, idx) => (
              <button
                key={l.id}
                onClick={() => {
                  sound.playPop();
                  setSelectedLetterIndex(idx);
                }}
                className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg border-2 transition-all ${
                  selectedLetterIndex === idx
                    ? 'bg-amber-400 text-amber-950 border-amber-500 scale-105 shadow'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {l.isolated}
              </button>
            ))
          ) : (
            PERSIAN_NUMBERS.map((n, idx) => (
              <button
                key={n.digit}
                onClick={() => {
                  sound.playPop();
                  setSelectedNumberIndex(idx);
                }}
                className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg border-2 transition-all ${
                  selectedNumberIndex === idx
                    ? 'bg-emerald-400 text-emerald-950 border-emerald-500 scale-105 shadow'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {n.persianDigit}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
