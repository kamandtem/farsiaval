import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';
import { toPersianDigits } from '../data/persianAlphabet';
import { ActiveScreen } from '../types';

interface HeaderNavProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  starsCount: number;
  onBack?: () => void;
}

const TITLES: Partial<Record<ActiveScreen, [string, string]>> = {
  home: ['🪄', 'تخته جادویی الفبا'],
  magnetic_board: ['🧲', 'تخته حروف و کلمه‌سازی'],
  trace_practice: ['✏️', 'تمرین نوشتن'],
  word_games: ['📖', 'کلمه‌ها و تکمیل حرف'],
  math_games: ['🔢', 'بازی با عددها'],
  progress_garden: ['🌱', 'باغچهٔ پیشرفت من'],
};

/** هدر کودکانهٔ بخش‌های قدیمی‌تر (ریاضی، باغچه و ...) با همان ظاهر هدر بازی‌ها */
export const HeaderNav: React.FC<HeaderNavProps> = ({ currentScreen, onNavigate, starsCount, onBack }) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [emoji, title] = TITLES[currentScreen] || ['⭐', 'دهکده الفبا'];
  const toggle = () => { const muted = sound.toggleMute(); setIsMuted(muted); if (!muted) sound.playPop(); };
  return <header className="kid-header tone-sun" id="app-header-nav">
    <div className="kid-header-row">
      <button className="kid-back-btn" onClick={() => { sound.playPop(); onBack ? onBack() : onNavigate('village_map'); }} aria-label="بازگشت">
        <img className="kid-back-art" src="/assets/ui/btn-back.svg" alt="" draggable={false} />
      </button>
      <div className="kid-header-title">
        <span className="kid-header-emoji" aria-hidden="true">{emoji}</span>
        <div><strong>{title}</strong></div>
      </div>
      <div className="kid-header-side">
        <button className="kid-star-pill" onClick={() => { sound.playPop(); onNavigate('progress_garden'); }} aria-label="باغچهٔ پیشرفت">
          <Sparkles /> <b>{toPersianDigits(starsCount)}</b>
        </button>
        <button className={`kid-round-btn ${isMuted ? 'muted' : ''}`} onClick={toggle} aria-label={isMuted ? 'روشن کردن صدا' : 'قطع صدا'}>
          {isMuted ? <VolumeX strokeWidth={2.6} /> : <Volume2 strokeWidth={2.6} />}
        </button>
      </div>
    </div>
    <svg className="kid-header-wave" viewBox="0 0 400 18" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0h400v6c-25 0-25 12-50 12S325 6 300 6s-25 12-50 12S225 6 200 6s-25 12-50 12S125 6 100 6 75 18 50 18 25 6 0 6z" /></svg>
  </header>;
};
