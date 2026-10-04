import React, { useEffect, useState } from 'react';
import { sound } from '../utils/audio';
import { useBackHandler } from '../utils/backNav';
import { CloseArt } from './shared/ArtButtons';
import { SettingsPanel } from './SettingsPanel';

interface SplashProps {
  /** دکمهٔ سبز بزرگ: رفتن به نقشهٔ دهکده‌ها برای انتخاب نوع بازی */
  onStart: () => void;
  /** «ادامه»: برگشت به همان بازی‌ای که کودک آخرین بار در آن بود */
  onContinue: () => void;
  /** «پیشرفت من» */
  onProgress: () => void;
  skipNativeSplash?: boolean;
  /** اگر کودک قبلاً بازی را نیمه‌کاره گذاشته، نام آن بخش */
  resumeLabel?: string | null;
}

export const SplashScreen: React.FC<SplashProps> = ({ onStart, onContinue, onProgress, skipNativeSplash = false, resumeLabel }) => {
  const [showStart, setShowStart] = useState(skipNativeSplash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useBackHandler(() => { setSettingsOpen(false); }, settingsOpen);
  useBackHandler(() => { setMenuOpen(false); }, menuOpen && !settingsOpen);

  useEffect(() => {
    document.title = 'دهکده الفبا';
    if (skipNativeSplash) return;
    const timer = window.setTimeout(() => setShowStart(true), 1800);
    return () => window.clearTimeout(timer);
  }, [skipNativeSplash]);

  if (!showStart) {
    return <main className="native-splash" dir="rtl" onClick={() => setShowStart(true)}>
      <img src="/assets/app-icon.png" alt="دهکده الفبا" />
      <div className="native-splash-loader" aria-label="در حال بارگذاری"><i /></div>
    </main>;
  }

  const tap = (fn: () => void) => () => { sound.playPop(); fn(); };

  return <main className="start-screen" dir="rtl">
    {/* همان پس‌زمینهٔ قبلی با دو کاراکتر کودک؛ این تصویر حذف یا جایگزین نشود */}
    <img className="start-background" src="/assets/start-children.png" alt="" draggable={false} />
    <div className="start-brand" aria-label="دهکده الفبا">
      <img className="start-sign" src="/assets/start-sign.svg" alt="" draggable={false} />
    </div>

    {/* نوار سفید موج‌دار پایین با سه دکمه، دقیقاً مثل تصویر مرجع */}
    <section className="start-dock" aria-label="منوی شروع بازی">
      <img className="start-dock-wave" src="/assets/ui/start-wave.svg" alt="" />
      <div className="start-dock-row">
        <button className="start-btn start-btn-menu" onClick={tap(() => setMenuOpen(true))} aria-label="منو">
          <img src="/assets/ui/start-menu.svg" alt="" />
        </button>
        <button className="start-btn start-btn-play" onClick={tap(onStart)} aria-label="شروع بازی">
          <img src="/assets/ui/start-play.svg" alt="" />
        </button>
        <button className="start-btn start-btn-settings" onClick={tap(() => setSettingsOpen(true))} aria-label="تنظیمات">
          <img src="/assets/ui/start-settings.svg" alt="" />
        </button>
      </div>
    </section>

    {/* صفحهٔ منو: دفترچهٔ فنری روی پس‌زمینهٔ آفتابی */}
    {menuOpen && <div className="menu-scene" role="dialog" aria-modal="true" aria-label="منو" onClick={() => setMenuOpen(false)}>
      <div className="menu-rays" aria-hidden="true" />
      <span className="menu-cloud c1" aria-hidden="true" /><span className="menu-cloud c2" aria-hidden="true" /><span className="menu-cloud c3" aria-hidden="true" />
      <span className="menu-spark s1" aria-hidden="true">★</span><span className="menu-spark s2" aria-hidden="true">★</span><span className="menu-spark s3" aria-hidden="true">★</span>
      <div className="menu-book" onClick={e => e.stopPropagation()}>
        <img className="menu-book-art" src="/assets/ui/menu-panel.svg" alt="" draggable={false} />
        <CloseArt className="menu-book-close" src="/assets/ui/btn-close-menu.svg" onClick={tap(() => setMenuOpen(false))} label="بستن منو" />
        <button className="menu-book-btn menu-book-play" onClick={tap(onStart)} aria-label="شروع بازی و رفتن به دهکده‌ها">
          <img src="/assets/ui/menu-play.svg" alt="" draggable={false} />
        </button>
        <button className="menu-book-btn menu-book-cont" onClick={tap(onContinue)} aria-label="ادامهٔ بازی">
          <img src="/assets/ui/btn-continue.svg" alt="" draggable={false} />
        </button>
        <button className="menu-book-btn menu-book-progress" onClick={tap(onProgress)} aria-label="پیشرفت من">
          <img src="/assets/ui/btn-progress.svg" alt="" draggable={false} />
        </button>
        <button className="menu-book-btn menu-book-settings" onClick={tap(() => setSettingsOpen(true))} aria-label="تنظیمات">
          <img src="/assets/ui/btn-settings.svg" alt="" draggable={false} />
        </button>
      </div>
    </div>}

    {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
  </main>;
};
