import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sound, type AudioSettings, DEFAULT_MUSIC } from '../utils/audio';

const UI = '/assets/ui/settings';

/**
 * نوار کشیدنی تنظیم صدا
 * زیر: slider-track.svg (نقشهArtboard 8) · رو: slider-fill.svg (نقشهArtboard 7) که به اندازهٔ صدا روی آن را می‌پوشاند
 */
const VolumeSlider: React.FC<{ value: number; onChange: (v: number) => void; onRelease?: () => void; label: string }> = ({ value, onChange, onRelease, label }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromPointer = useCallback((clientX: number) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    onChange(Math.round(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * 100) / 100);
  }, [onChange]);

  const pct = Math.round(value * 100);
  return <div
    ref={ref}
    className="vol-slider"
    role="slider"
    tabIndex={0}
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={pct}
    style={{ '--v': `${pct}%` } as React.CSSProperties}
    onPointerDown={e => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e.clientX); }}
    onPointerMove={e => { if (dragging.current) fromPointer(e.clientX); }}
    onPointerUp={() => { if (dragging.current) { dragging.current = false; onRelease?.(); } }}
    onPointerCancel={() => { dragging.current = false; }}
    onKeyDown={e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(1, value + 0.1)); onRelease?.(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(0, value - 0.1)); onRelease?.(); }
    }}
  >
    <img className="vol-track" src={`${UI}/slider-track.svg`} alt="" draggable={false} />
    <img className="vol-fill" src={`${UI}/slider-fill.svg`} alt="" draggable={false} />
    <img className="vol-knob" src={`${UI}/slider-knob.svg`} alt="" draggable={false} />
  </div>;
};

/** پنجرهٔ «صداهای برنامه» دقیقاً مطابق تصویر مرجع */
export const SettingsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [s, setS] = useState<AudioSettings>(() => sound.getSettings());
  const initial = useRef<AudioSettings>(sound.getSettings());
  const lastOn = useRef({ sfx: s.sfx || 0.8, music: s.music || DEFAULT_MUSIC });

  useEffect(() => sound.subscribe(setS), []);
  useEffect(() => { if (s.sfx > 0) lastOn.current.sfx = s.sfx; if (s.music > 0) lastOn.current.music = s.music; }, [s]);

  const toggleSfx = () => {
    if (s.sfx > 0) sound.setSfxVolume(0);
    else { sound.setSfxVolume(lastOn.current.sfx); sound.playPop(); }
  };
  const toggleMusic = () => { sound.playPop(); sound.setMusicVolume(s.music > 0 ? 0 : lastOn.current.music); };

  /** ضربدر: برگشت به تنظیمات قبلی و بستن */
  const cancel = () => {
    sound.setSfxVolume(initial.current.sfx);
    sound.setMusicVolume(initial.current.music);
    sound.playPop();
    onClose();
  };
  /** تیک سبز: ذخیره و بستن (تنظیمات همان لحظه ذخیره شده‌اند) */
  const save = () => { sound.playSuccess(); onClose(); };

  return <div className="settings-scene" role="presentation" onClick={cancel}>
    <div className="menu-rays" aria-hidden="true" />
    <span className="menu-cloud c1" aria-hidden="true" /><span className="menu-cloud c2" aria-hidden="true" /><span className="menu-cloud c3" aria-hidden="true" />
    <span className="menu-spark s1" aria-hidden="true">★</span><span className="menu-spark s2" aria-hidden="true">★</span><span className="menu-spark s3" aria-hidden="true">★</span>
    <div className="settings-sea" aria-hidden="true"><i /><i /><i /></div>

    <section className="sound-panel" dir="ltr" role="dialog" aria-modal="true" aria-label="صداهای برنامه" onClick={e => e.stopPropagation()}>
      <img className="sound-panel-art" src={`${UI}/panel.svg`} alt="" draggable={false} />

      <button type="button" className="sound-btn sound-close" onClick={cancel} aria-label="بستن بدون ذخیره">
        <img src={`${UI}/btn-close.svg`} alt="" draggable={false} />
      </button>

      <div className="sound-row sound-row-sfx">
        <button type="button" className={`sound-btn sound-icon ${s.sfx <= 0 ? 'muted' : ''}`} onClick={toggleSfx} aria-label={s.sfx > 0 ? 'قطع صدای بازی' : 'وصل صدای بازی'}>
          <img src={`${UI}/icon-sound.svg`} alt="" draggable={false} />
        </button>
        <VolumeSlider label="بلندی صدای بازی" value={s.sfx} onChange={v => sound.setSfxVolume(v)} onRelease={() => sound.playPop()} />
      </div>

      <div className="sound-row sound-row-music">
        <button type="button" className={`sound-btn sound-icon ${s.music <= 0 ? 'muted' : ''}`} onClick={toggleMusic} aria-label={s.music > 0 ? 'قطع موسیقی' : 'وصل موسیقی'}>
          <img src={`${UI}/icon-music.svg`} alt="" draggable={false} />
        </button>
        <VolumeSlider label="بلندی موسیقی" value={s.music} onChange={v => sound.setMusicVolume(v)} />
      </div>

      <button type="button" className="sound-btn sound-ok" onClick={save} aria-label="ذخیره و بستن">
        <img src={`${UI}/btn-ok.svg`} alt="" draggable={false} />
      </button>
    </section>
  </div>;
};
