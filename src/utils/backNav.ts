import { useEffect, useRef } from 'react';

/**
 * مدیریت دکمهٔ «برگشت» گوشی.
 * هر صفحه یا پنجره یک هندلر ثبت می‌کند؛ آخرین هندلرِ ثبت‌شده اول اجرا می‌شود.
 * اگر هیچ هندلری نبود (صفحهٔ شروع) برنامه بسته می‌شود.
 */
type Handler = () => boolean | void;
const stack: { id: number; fn: React.MutableRefObject<Handler> }[] = [];
let seq = 0;
let started = false;

function runBack(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    const r = stack[i].fn.current();
    if (r !== false) return true;
  }
  return false;
}

/** وقتی کودک در آخرین صفحه باز هم «برگشت» بزند، به جای بستن ناگهانی، پنجرهٔ «میخوای بری؟» باز می‌شود */
type ExitListener = () => void;
const exitListeners = new Set<ExitListener>();
export function onExitRequest(fn: ExitListener): () => void { exitListeners.add(fn); return () => { exitListeners.delete(fn); }; }
function requestExit() { if (exitListeners.size) exitListeners.forEach(l => l()); else exitApp(); }

export async function exitApp() {
  try {
    const { App } = await import('@capacitor/app');
    await App.exitApp();
  } catch { /* وب: کاری نکن */ }
}

export function initBackNavigation() {
  if (started) return;
  started = true;
  const cap = (window as any).Capacitor;
  const isNative = !!cap?.isNativePlatform?.();
  if (isNative) {
    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', () => { if (!runBack()) requestExit(); });
    }).catch(() => { /* پلاگین نصب نیست */ });
    return;
  }
  // در مرورگر: یک وضعیت اضافه در تاریخچه نگه می‌داریم تا دکمهٔ برگشت از برنامه خارج نشود
  try {
    history.pushState({ alefba: true }, '');
    window.addEventListener('popstate', () => {
      if (!runBack()) requestExit();
      history.pushState({ alefba: true }, '');
    });
  } catch { /* ignore */ }
}

/** ثبت هندلر برگشت؛ تا زمانی که active باشد فعال می‌ماند. برگرداندن false یعنی «من رسیدگی نکردم». */
export function useBackHandler(fn: Handler, active = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const id = ++seq;
    stack.push({ id, fn: ref });
    return () => { const i = stack.findIndex(s => s.id === id); if (i >= 0) stack.splice(i, 1); };
  }, [active]);
}
