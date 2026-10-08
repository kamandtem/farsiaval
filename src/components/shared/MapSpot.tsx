import React from 'react';
import { toFa } from '../../utils/lessonState';

export interface SpotPlace { left: number; top: number; w: number; ratio: number; bb: [number, number, number, number] }

/**
 * یک خانه/جزیره روی نقشه. موقعیت‌ها درصدی از بوم نقشه‌اند (نسبت ثابت)، پس روی همهٔ گوشی‌ها
 * دقیقاً روی جای خودش در تصویر می‌نشیند. bb = محدودهٔ واقعی نقاشی داخل فایل [x0,x1,y0,y1] به درصد.
 */
export const MapSpot: React.FC<{
  place: SpotPlace; art: string; index: number; title: string; subtitle?: string;
  tone: string; onClick: () => void; hint?: boolean; badge?: React.ReactNode;
}> = ({ place, art, index, title, subtitle, tone, onClick, hint, badge }) => {
  const [x0, x1, y0, y1] = place.bb;
  const style = { left: `${place.left}%`, top: `${place.top}%`, width: `${place.w}%`, aspectRatio: `${1 / place.ratio}`, '--delay': `${-index * 0.7}s` } as React.CSSProperties;
  return <div className={`map-spot tone-${tone}`} style={style}>
    <span className="map-spot-glow" style={{ left: `${(x0 + x1) / 2}%`, top: `${y1 - 3}%`, width: `${(x1 - x0) * 0.95}%` }} aria-hidden="true" />
    <div className="map-spot-float"><img src={art} alt="" draggable={false} decoding="async" /></div>
    <button className="map-spot-hit" onClick={onClick} aria-label={subtitle ? `${title}: ${subtitle}` : title}
      style={{ left: `${x0}%`, top: `${y0}%`, width: `${x1 - x0}%`, height: `${y1 - y0}%` }} />
    <button className="map-spot-label" onClick={onClick} tabIndex={-1} aria-hidden="true" style={{ left: `${(x0 + x1) / 2}%`, top: `${y1 - 1}%` }}>
      <em>{badge ?? toFa(index + 1)}</em>
      <b>{title}</b>
      {subtitle && <small>{subtitle}</small>}
    </button>
    {hint && <span className="map-spot-hint" style={{ left: `${(x0 + x1) / 2 + 12}%`, top: `${(y0 + y1) / 2}%` }} aria-hidden="true">👆</span>}
  </div>;
};
