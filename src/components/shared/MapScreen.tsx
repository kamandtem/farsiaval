import React, { useLayoutEffect, useRef } from 'react';

/**
 * بوم نقشهٔ عمودی با نسبت ثابتِ تصویر مرجع (۶۵۰×۱۷۷۴).
 * اسکرول داخل همین صفحه انجام می‌شود تا روان باشد و جای اسکرول بعد از برگشت حفظ شود.
 * بار اول از بالا (نقطهٔ شروع مسیر: دهکده/بازی اول) باز می‌شود.
 */
export const MapScreen: React.FC<{ id: string; map: string; alt: string; overlay?: React.ReactNode; children: React.ReactNode }> = ({ id, map, alt, overlay, children }) => {
  const ref = useRef<HTMLElement>(null);
  const key = `alefba_scroll_v4_${id}`; // کلید تازه تا جای اسکرولِ قدیمی (پایینِ نقشه) دوباره استفاده نشود
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const restore = () => {
      const saved = sessionStorage.getItem(key);
      el.scrollTop = saved !== null ? Number(saved) : 0;
    };
    restore();
    const img = el.querySelector('img.map-canvas-art') as HTMLImageElement | null;
    if (img && !img.complete) img.addEventListener('load', restore, { once: true });
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => sessionStorage.setItem(key, String(Math.round(el.scrollTop)))); };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [key]);
  return <main ref={ref} className="map-screen-v2" dir="rtl">
    <div className="map-stage">
      <div className="map-canvas">
        <img className="map-canvas-art" src={map} alt={alt} draggable={false} decoding="async" />
        {children}
      </div>
    </div>
    {overlay}
  </main>;
};
