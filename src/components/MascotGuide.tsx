import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface MascotGuideProps {
  message: string;
  subMessage?: string;
  onVoiceClick?: () => void;
  character?: 'dana' | 'star' | 'lion';
}

export const MascotGuide: React.FC<MascotGuideProps> = ({
  message,
  subMessage,
  onVoiceClick,
  character = 'dana'
}) => {
  const handleVoice = () => {
    sound.playPop();
    if (onVoiceClick) {
      onVoiceClick();
    } else {
      sound.speakPersian(message);
    }
  };

  return (
    <div
      id="mascot-guide-bar"
      className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border-2 border-amber-200/80 rounded-2xl p-2.5 px-4 shadow-sm select-none"
    >
      {/* Friendly Mascot Avatar */}
      <div className="relative flex-shrink-0 w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center border-2 border-amber-300 shadow-inner">
        {character === 'dana' ? (
          // Cute friendly pencil buddy
          <div className="text-2xl animate-bounce" style={{ animationDuration: '2.5s' }}>
            ✏️
          </div>
        ) : character === 'lion' ? (
          <div className="text-2xl">🦁</div>
        ) : (
          <div className="text-2xl text-amber-400">⭐</div>
        )}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
      </div>

      {/* Message Balloon */}
      <div className="flex-1 min-w-0">
        <p className="text-slate-800 text-sm md:text-base font-bold leading-tight truncate">
          {message}
        </p>
        {subMessage && (
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
            {subMessage}
          </p>
        )}
      </div>

      {/* Audio Hear Button */}
      <button
        id="mascot-speak-btn"
        onClick={handleVoice}
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-900 flex items-center justify-center shadow transition-all"
        title="شنیدن صدای راهنما"
        aria-label="شنیدن راهنما"
      >
        <Volume2 className="w-5 h-5 text-amber-950" />
      </button>
    </div>
  );
};
