import React from 'react';
import { Sparkles, ArrowLeft, Heart, Volume2 } from 'lucide-react';
import { ActiveScreen, UserProgress } from '../types';
import { toPersianDigits } from '../data/persianAlphabet';
import { sound } from '../utils/audio';

interface HomeScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  progress: UserProgress;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, progress }) => {
  const handleSelect = (screen: ActiveScreen, voicePrompt: string) => {
    sound.playPop();
    sound.speakPersian(voicePrompt);
    onNavigate(screen);
  };

  return (
    <div 
      id="home-screen-view"
      className="flex flex-col h-full w-full max-w-5xl mx-auto p-3 md:p-6 gap-5 select-none justify-between"
    >
      {/* Friendly Welcome Banner */}
      <div className="flex items-center justify-between bg-white rounded-3xl border-2 border-amber-200/80 p-4 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-inner animate-bounce" style={{ animationDuration: '3s' }}>
            🦁
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">
              سلام دوست باهوش من! 🌸
            </h1>
            <p className="text-xs md:text-sm font-bold text-slate-500 mt-0.5">
              دوست داری امروز چی با هم یاد بگیریم و بازی کنیم؟
            </p>
          </div>
        </div>

        {/* Small Garden Progress Button */}
        <button
          id="home-progress-garden-btn"
          onClick={() => handleSelect('progress_garden', 'باغچه پیشرفت من')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 text-emerald-800 font-extrabold text-sm shadow-sm active:scale-95 transition-all"
        >
          <span className="text-xl">🌱</span>
          <span className="hidden sm:inline">پیشرفت من</span>
          <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-lg text-xs font-black">
            {toPersianDigits(progress.gardenLeaves)} برگ
          </span>
        </button>
      </div>

      {/* 4 Primary Big Joyful Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 flex-1 items-center">
        {/* Card 1: تخته حروف مغناطیسی */}
        <button
          id="nav-magnetic-board-card"
          onClick={() => handleSelect('magnetic_board', 'تخته حروف مغناطیسی')}
          className="group relative h-40 sm:h-52 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-5 md:p-6 text-right flex flex-col justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all overflow-hidden border-3 border-amber-300"
          style={{
            boxShadow: '0 8px 0 #CA8A04, 0 16px 24px rgba(234, 179, 8, 0.25)'
          }}
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
              🧲
            </div>
            <span className="px-3 py-1 bg-amber-600/30 text-white rounded-xl text-xs font-black backdrop-blur">
              مهم‌ترین بخش
            </span>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide drop-shadow-sm">
              تخته حروف
            </h2>
            <p className="text-amber-100 font-bold text-xs md:text-sm mt-1 drop-shadow-xs">
              ساختن حروف و کلمات با قطعات مغناطیسی هوشمند
            </p>
          </div>

          {/* Decorative background shape */}
          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
        </button>

        {/* Card 2: تمرین نوشتن و خط‌کشی */}
        <button
          id="nav-trace-card"
          onClick={() => handleSelect('trace_practice', 'تمرین نوشتن حروف و اعداد')}
          className="group relative h-40 sm:h-52 bg-gradient-to-br from-sky-400 to-blue-500 rounded-3xl p-5 md:p-6 text-right flex flex-col justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all overflow-hidden border-3 border-sky-300"
          style={{
            boxShadow: '0 8px 0 #2563EB, 0 16px 24px rgba(59, 130, 246, 0.25)'
          }}
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
              ✏️
            </div>
            <span className="px-3 py-1 bg-blue-600/30 text-white rounded-xl text-xs font-black backdrop-blur">
              دست‌ورزی و خط
            </span>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide drop-shadow-sm">
              تمرین نوشتن
            </h2>
            <p className="text-sky-100 font-bold text-xs md:text-sm mt-1 drop-shadow-xs">
              کشیدن مسیر درست حروف و اعداد با هدایت هوشمند
            </p>
          </div>

          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
        </button>

        {/* Card 3: کلمه‌ها */}
        <button
          id="nav-words-card"
          onClick={() => handleSelect('word_games', 'بازی کلمه‌ها')}
          className="group relative h-40 sm:h-52 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl p-5 md:p-6 text-right flex flex-col justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all overflow-hidden border-3 border-emerald-300"
          style={{
            boxShadow: '0 8px 0 #16A34A, 0 16px 24px rgba(34, 197, 94, 0.25)'
          }}
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
              📖
            </div>
            <span className="px-3 py-1 bg-emerald-600/30 text-white rounded-xl text-xs font-black backdrop-blur">
              کلاس اول
            </span>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide drop-shadow-sm">
              کلمه‌ها
            </h2>
            <p className="text-emerald-100 font-bold text-xs md:text-sm mt-1 drop-shadow-xs">
              شناخت، تکمیل جای خالی و خواندن کلمات زیبا
            </p>
          </div>

          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
        </button>

        {/* Card 4: بازی با عددها و چینه */}
        <button
          id="nav-math-card"
          onClick={() => handleSelect('math_games', 'بازی با عددها و چینه')}
          className="group relative h-40 sm:h-52 bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl p-5 md:p-6 text-right flex flex-col justify-between shadow-lg hover:shadow-xl active:scale-98 transition-all overflow-hidden border-3 border-rose-300"
          style={{
            boxShadow: '0 8px 0 #E11D48, 0 16px 24px rgba(244, 63, 94, 0.25)'
          }}
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
              🔢
            </div>
            <span className="px-3 py-1 bg-pink-600/30 text-white rounded-xl text-xs font-black backdrop-blur">
              چینه و شمارش
            </span>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide drop-shadow-sm">
              بازی با عددها
            </h2>
            <p className="text-rose-100 font-bold text-xs md:text-sm mt-1 drop-shadow-xs">
              شمارش اشیا، عددنویسی، جمع و تفریق عینی با چینه
            </p>
          </div>

          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
        </button>
      </div>

      {/* Gentle Footer Metaphor: 100% Offline & Child Safe */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 pt-2">
        <span>⭐ کاملاً آفلاین و امن برای کودکان</span>
        <span>•</span>
        <span>بدون تبلیغات و بدون اینترنت</span>
      </div>
    </div>
  );
};
