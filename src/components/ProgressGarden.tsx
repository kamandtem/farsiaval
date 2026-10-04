import React from 'react';
import { Sparkles, Trophy, Heart, Award, ArrowLeft, Sun } from 'lucide-react';
import { UserProgress } from '../types';
import { toPersianDigits } from '../data/persianAlphabet';
import { sound } from '../utils/audio';

interface ProgressGardenProps {
  progress: UserProgress;
  onBack: () => void;
}

export const ProgressGarden: React.FC<ProgressGardenProps> = ({ progress, onBack }) => {
  return (
    <div 
      id="progress-garden-view"
      className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-6 gap-6 select-none"
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-6 h-6 text-amber-300 animate-spin" style={{ animationDuration: '15s' }} />
            <h2 className="text-2xl md:text-3xl font-black">
              باغچه دانایی من 🌱
            </h2>
          </div>
          <p className="text-emerald-100 text-sm md:text-base font-bold">
            امروز {toPersianDigits(progress.activitiesDoneToday)} تمرین با دست‌های خودت انجام دادی! آفرین به پشتکارت!
          </p>
        </div>

        <button
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="relative z-10 px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm backdrop-blur transition-all"
        >
          بازگشت به خانه
        </button>

        {/* Decorative background sun & grass */}
        <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      </div>

      {/* Gentle Growth Metaphor / Interactive Garden */}
      <div className="flex-1 bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-100 rounded-3xl border-4 border-emerald-200 shadow-md p-6 flex flex-col items-center justify-between relative overflow-hidden min-h-[340px]">
        {/* Sky with stars */}
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur px-5 py-2.5 rounded-2xl border border-amber-200 shadow-sm">
          <Sparkles className="w-6 h-6 text-amber-500 fill-amber-400" />
          <span className="text-lg font-black text-slate-800">
            ستاره‌های طلایی من: {toPersianDigits(progress.starsCount)} ⭐
          </span>
        </div>

        {/* The Growing Plant Graphic */}
        <div className="flex flex-col items-center my-auto">
          {/* Animated Flower / Sprout based on leaves */}
          <div className="relative flex flex-col items-center">
            {/* Flower Top */}
            <div className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>
              🌸
            </div>
            {/* Stem */}
            <div className="w-3 h-24 bg-emerald-500 rounded-full relative flex flex-col justify-around">
              {Array.from({ length: Math.min(progress.gardenLeaves, 8) }).map((_, i) => (
                <span
                  key={i}
                  className={`text-2xl absolute ${i % 2 === 0 ? '-left-6' : '-right-6'}`}
                  style={{ top: `${i * 12}px` }}
                >
                  🍃
                </span>
              ))}
            </div>
            {/* Pot / Soil */}
            <div className="w-24 h-14 bg-amber-700 rounded-b-2xl border-4 border-amber-800 shadow-lg flex items-center justify-center text-amber-200 font-black text-xs">
              گلدان من
            </div>
          </div>
        </div>

        {/* 3 Gentle, Pressure-Free Milestone Cards */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
          <div className="bg-white/90 border-2 border-sky-200 rounded-2xl p-3 flex flex-col items-center text-center shadow-sm">
            <span className="text-2xl">🧲</span>
            <span className="text-xs text-slate-500 font-bold mt-1">حروف یادگرفته</span>
            <span className="text-lg font-black text-sky-700 mt-0.5">
              {toPersianDigits(progress.lettersLearned.length)} حرف
            </span>
          </div>

          <div className="bg-white/90 border-2 border-amber-200 rounded-2xl p-3 flex flex-col items-center text-center shadow-sm">
            <span className="text-2xl">📖</span>
            <span className="text-xs text-slate-500 font-bold mt-1">کلمه‌های کامل‌شده</span>
            <span className="text-lg font-black text-amber-700 mt-0.5">
              {toPersianDigits(progress.wordsCompleted.length)} کلمه
            </span>
          </div>

          <div className="bg-white/90 border-2 border-emerald-200 rounded-2xl p-3 flex flex-col items-center text-center shadow-sm">
            <span className="text-2xl">🔢</span>
            <span className="text-xs text-slate-500 font-bold mt-1">چالش‌های ریاضی</span>
            <span className="text-lg font-black text-emerald-700 mt-0.5">
              {toPersianDigits(progress.mathChallengesSolved)} بازی
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
