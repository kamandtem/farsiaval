import React, { useEffect, useState } from 'react';
import { sound } from '../utils/audio';
import { exitApp, onExitRequest, useBackHandler } from '../utils/backNav';

const UI = '/assets/ui/exit';

/**
 * پنجرهٔ «میخوای بری؟»
 * وقتی کودک در صفحهٔ آخر (شروع) دوباره دکمهٔ برگشت گوشی را بزند باز می‌شود؛
 * پس‌زمینه همان برنامه است که محو (blur) شده.
 */
export const ExitDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => onExitRequest(() => { setOpen(true); sound.playGentleHint(); }), []);
  // برگشتِ دوباره وقتی پنجره باز است = «نه هنوز»
  useBackHandler(() => { setOpen(false); }, open);
  if (!open) return null;

  const stay = () => { sound.playPop(); setOpen(false); };
  const leave = () => { sound.playPop(); sound.pauseMusic(); setOpen(false); exitApp(); };

  return <div className="exit-scene" role="presentation" onClick={stay}>
    <section className="exit-panel" dir="ltr" role="alertdialog" aria-modal="true" aria-label="میخوای بری؟" onClick={e => e.stopPropagation()}>
      <img className="exit-panel-art" src={`${UI}/panel.svg`} alt="" draggable={false} />
      <button type="button" className="exit-btn exit-no" onClick={stay} aria-label="نه هنوز، می‌مانم" autoFocus>
        <img src={`${UI}/btn-no.svg`} alt="" draggable={false} />
      </button>
      <button type="button" className="exit-btn exit-yes" onClick={leave} aria-label="آره، خارج شو">
        <img src={`${UI}/btn-yes.svg`} alt="" draggable={false} />
      </button>
    </section>
  </div>;
};
