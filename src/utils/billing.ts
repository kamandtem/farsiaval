import { Capacitor, registerPlugin } from '@capacitor/core';
import { useSyncExternalStore } from 'react';

/**
 * پرداخت درون‌برنامه‌ای کافه‌بازار (SDK رسمی Poolakey از طریق پلاگین محلی کاپازیتور)
 * plugins/capacitor-bazaar-billing ← کد بومی اندروید
 */

/** شناسهٔ محصول در پیشخان بازار (نوع: غیرمصرفی / Non-consumable) */
export const FULL_VERSION_SKU = 'full_version';
/** درس‌های ۱ تا ۱۱ (تا «ایـ یـ ی ای») رایگان‌اند؛ از درس ۱۲ («ز») خرید لازم است */
export const FREE_LESSON_LIMIT = 11;
/** کلید عمومی RSA از پیشخان بازار ← برنامه ← پرداخت درون‌برنامه‌ای (کلید عمومی است، نه رمز) */
const BAZAAR_RSA_PUBLIC_KEY = 'MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwCeAvx3y5OqUWODVNKi0gYPm8atIXM8p4QSgsUPNaoSIuTNiwDNwpNXoFlZn69155DYHraf6L7f1wUYQQ199iABx5Kbu3uSfc483TMSOqUKit7y4aPjhJMAAC0++HEJQ19NE/m4Bb3kzx2WKV5TTmqjZ5aBpPeXszYLmdSqnmUMo+DUaowtVCKk7KV2YQHlYPLo8KYc5aIF0AIKOc8NblbSPaU0bTT7eOKjRr9eTG8CAwEAAQ==';

export interface BazaarPurchase {
  orderId: string; purchaseToken: string; payload: string; packageName: string;
  productId: string; purchaseTime: number; purchaseState: string; originalJson: string; dataSignature: string;
}
interface BazaarBillingPlugin {
  connect(o: { rsaPublicKey: string }): Promise<{ connected: boolean }>;
  disconnect(): Promise<void>;
  purchase(o: { productId: string; payload?: string }): Promise<BazaarPurchase>;
  getPurchases(): Promise<{ purchases: BazaarPurchase[] }>;
  isBazaarInstalled(): Promise<{ installed: boolean }>;
  openAppPage(): Promise<void>;
}
const Bazaar = registerPlugin<BazaarBillingPlugin>('BazaarBilling');

// ---------- وضعیت خرید (کش محلی برای کار بدون اینترنت) ----------
const CACHE_KEY = 'alefba_full_version_v2';
const LEGACY_KEY = 'lic_full_version'; // نسخهٔ ۱۵ بدون پرداخت واقعی true می‌گذاشت؛ دیگر معتبر نیست
interface Cache { sku: string; token: string; orderId: string; time: number }

const readCache = (): Cache | null => {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return c && c.sku === FULL_VERSION_SKU && c.token ? c : null;
  } catch { return null; }
};
let unlocked = !!readCache();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const setUnlocked = (v: boolean) => { if (unlocked !== v) { unlocked = v; emit(); } };

function grant(p: BazaarPurchase) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ sku: p.productId, token: p.purchaseToken, orderId: p.orderId, time: p.purchaseTime } satisfies Cache)); } catch { /* ignore */ }
  setUnlocked(true);
}
function revoke() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
  setUnlocked(false);
}

export const isFullVersion = () => unlocked;
export const onFullVersionChange = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const useFullVersion = () => useSyncExternalStore(onFullVersionChange, isFullVersion, isFullVersion);
export const isLessonLocked = (order: number) => order > FREE_LESSON_LIMIT && !unlocked;

// ---------- اتصال ----------
const native = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
let connecting: Promise<void> | null = null;
function ensureConnected(): Promise<void> {
  if (!connecting) {
    connecting = Bazaar.connect({ rsaPublicKey: BAZAAR_RSA_PUBLIC_KEY }).then(() => undefined)
      .catch(e => { connecting = null; throw e; });
  }
  return connecting;
}
/** اگر اتصال قطع شده بود یک بار دوباره وصل می‌شود */
async function withConnection<T>(fn: () => Promise<T>): Promise<T> {
  await ensureConnected();
  try { return await fn(); } catch (e: any) {
    if (e?.code !== 'NOT_CONNECTED' && e?.code !== 'DISCONNECTED') throw e;
    connecting = null;
    await ensureConnected();
    return fn();
  }
}

const isOwned = (p: BazaarPurchase) => p.productId === FULL_VERSION_SKU && p.purchaseState === 'PURCHASED';

/**
 * بازیابی خرید از بازار. اگر بازار در دسترس نباشد کش قبلی دست نمی‌خورد.
 * @returns true اگر نسخهٔ کامل خریداری شده باشد
 */
export async function restorePurchase(): Promise<boolean> {
  if (!native()) return unlocked;
  const { purchases } = await withConnection(() => Bazaar.getPurchases());
  const owned = purchases.find(isOwned);
  if (owned) grant(owned); else revoke(); // خرید برگشت‌خورده (refund) هم اینجا قفل می‌شود
  return !!owned;
}

/** یک بار در شروع برنامه: پاک کردن لایسنس قدیمی و همگام‌سازی بی‌صدا با بازار */
let initDone = false;
export function initBilling() {
  if (initDone) return; initDone = true;
  try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
  if (native()) restorePurchase().catch(() => { /* بازار نیست یا اینترنت قطع است: کش قبلی می‌ماند */ });
}

export type PurchaseResult = { status: 'purchased' } | { status: 'canceled' } | { status: 'error'; message: string; code?: string };

export function billingErrorMessage(code?: string): string {
  switch (code) {
    case 'BAZAAR_NOT_FOUND': return 'برای خرید باید برنامهٔ «کافه‌بازار» روی گوشی نصب باشد.';
    case 'BAZAAR_NOT_SUPPORTED': return 'نسخهٔ کافه‌بازارِ گوشی قدیمی است. لطفاً بازار را به‌روز کن و دوباره امتحان کن.';
    case 'IAP_NOT_SUPPORTED': return 'پرداخت درون‌برنامه‌ای در این نسخهٔ بازار پشتیبانی نمی‌شود.';
    case 'PURCHASE_HIJACKED': return 'امضای خرید معتبر نبود. اگر پول کم شده، با پشتیبانی تماس بگیر.';
    case 'WEB': return 'خرید فقط در نسخهٔ اندروید (نصب‌شده از کافه‌بازار) ممکن است.';
    default: return 'خرید انجام نشد. اینترنت و ورود به حساب کافه‌بازار را بررسی کن و دوباره امتحان کن.';
  }
}

export async function purchaseFullVersion(): Promise<PurchaseResult> {
  if (!native()) {
    // فقط برای تست در مرورگر هنگام توسعه
    if (import.meta.env.DEV) { grant({ productId: FULL_VERSION_SKU, purchaseToken: 'dev', orderId: 'dev', purchaseTime: Date.now() } as BazaarPurchase); return { status: 'purchased' }; }
    return { status: 'error', code: 'WEB', message: billingErrorMessage('WEB') };
  }
  try {
    const payload = `${FULL_VERSION_SKU}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
    const p = await withConnection(() => Bazaar.purchase({ productId: FULL_VERSION_SKU, payload }));
    if (isOwned(p)) { grant(p); return { status: 'purchased' }; }
    return { status: 'error', message: billingErrorMessage() };
  } catch (e: any) {
    const code: string | undefined = e?.code;
    if (code === 'CANCELED') return { status: 'canceled' };
    // اگر قبلاً خریده باشد بازار خطای «قبلاً خریداری شده» می‌دهد: بازیابی کن
    try { if (await restorePurchase()) return { status: 'purchased' }; } catch { /* ignore */ }
    return { status: 'error', code, message: billingErrorMessage(code) };
  }
}

export async function isBazaarInstalled(): Promise<boolean> {
  if (!native()) return false;
  try { return (await Bazaar.isBazaarInstalled()).installed; } catch { return false; }
}
export const openBazaarPage = () => { if (native()) Bazaar.openAppPage().catch(() => { /* ignore */ }); };

// ---------- پنجرهٔ خرید ----------
const PAYWALL_EVT = 'alefba-paywall-open';
/** درخواست باز شدن پنجرهٔ خرید؛ اگر خرید موفق شد درس خواسته‌شده انتخاب می‌شود */
export const openPaywall = (lesson?: number) => window.dispatchEvent(new CustomEvent(PAYWALL_EVT, { detail: lesson }));
export const onPaywallRequest = (fn: (lesson?: number) => void) => {
  const h = (e: Event) => fn((e as CustomEvent).detail);
  window.addEventListener(PAYWALL_EVT, h);
  return () => window.removeEventListener(PAYWALL_EVT, h);
};
