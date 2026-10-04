/** تنظیمات مخصوص اندروید: نوار وضعیت (ساعت، باتری، آنتن) و نوار پایین */
export async function initNativeChrome() {
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  document.documentElement.classList.add('is-native');
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Light }); // آیکن‌های تیره روی زمینهٔ روشن
    await StatusBar.setBackgroundColor({ color: '#57C3F1' });
  } catch { /* پلاگین در دسترس نیست */ }
}

/** رنگ نوار وضعیت را با رنگ بالای هر صفحه هماهنگ می‌کند */
export async function setStatusBarColor(color: string, darkIcons = true) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setBackgroundColor({ color });
    await StatusBar.setStyle({ style: darkIcons ? Style.Light : Style.Dark });
  } catch { /* ignore */ }
}

export const vibrate = (ms = 60) => { try { navigator.vibrate?.(ms); } catch { /* ignore */ } };
