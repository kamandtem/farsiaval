import React from 'react';
import { sound } from '../utils/audio';
import { useBackHandler } from '../utils/backNav';
import { LESSON_FONTS, setEducationalFont, useEducationalFont, type EducationalFont } from '../utils/fontSettings';

/** راهنمای تغییر فونت؛ فقط بار اولِ باز شدن برنامه خودکار نشان داده می‌شود */
const FONT_TIP_KEY = 'alefba_font_tip_seen_v1';
export const fontTipSeen = () => { try { return localStorage.getItem(FONT_TIP_KEY) === '1'; } catch { return true; } };
const markFontTipSeen = () => { try { localStorage.setItem(FONT_TIP_KEY, '1'); } catch { /* ignore */ } };

const SAMPLE = 'الفبا';

export const FontTip: React.FC<{ onClose: () => void; onOpenSettings: () => void }> = ({ onClose, onOpenSettings }) => {
  const current = useEducationalFont();
  const close = () => { markFontTipSeen(); sound.playPop(); onClose(); };
  const goSettings = () => { markFontTipSeen(); sound.playPop(); onOpenSettings(); };
  const pick = (f: EducationalFont) => { if (f !== current) { setEducationalFont(f); sound.playPop(); } };
  useBackHandler(() => { markFontTipSeen(); onClose(); }, true);

  return <div className="paywall-scene" role="presentation" onClick={close}>
    <section className="paywall-panel" dir="rtl" role="dialog" aria-modal="true" aria-label="راهنمای تغییر فونت" onClick={e => e.stopPropagation()}>
      <div className="paywall-emoji" aria-hidden="true">🔤</div>
      <h2>می‌توانی خط را عوض کنی!</h2>
      <p>حرف‌ها و کلمه‌های بازی‌ها را به سه شکل می‌توانی ببینی. هر کدام را که دوست داری بزن:</p>
      <div className="fonttip-options" role="radiogroup" aria-label="انتخاب فونت">
        {LESSON_FONTS.map(f => <button
          key={f.id}
          type="button"
          role="radio"
          aria-checked={current === f.id}
          className={`fonttip-opt ${current === f.id ? 'on' : ''}`}
          onClick={() => pick(f.id)}
        >
          <b style={{ fontFamily: f.family, fontSize: `${1.7 * f.previewScale}rem` }}>{SAMPLE}</b>
          <small>{f.label}</small>
        </button>)}
      </div>
      <p className="paywall-note">هر وقت خواستی، از «تنظیمات» هم می‌توانی فونت را عوض کنی.</p>
      <button type="button" className="paywall-buy" onClick={close}>فهمیدم</button>
      <div className="paywall-actions">
        <button type="button" onClick={goSettings}>⚙️ رفتن به تنظیمات</button>
      </div>
    </section>
  </div>;
};
