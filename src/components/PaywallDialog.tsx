import React, { useEffect, useState } from 'react';
import { sound } from '../utils/audio';
import { useBackHandler } from '../utils/backNav';
import { FREE_LESSON_LIMIT, isBazaarInstalled, onPaywallRequest, openBazaarPage, purchaseFullVersion, restorePurchase, billingErrorMessage } from '../utils/billing';
import { setCurrentLesson, toFa } from '../utils/lessonState';
import { CURRICULUM } from '../data/curriculum';

type Phase = 'idle' | 'busy' | 'done' | 'error';

/**
 * پنجرهٔ خرید نسخهٔ کامل (کافه‌بازار)
 * با openPaywall(lesson) از هر جای برنامه باز می‌شود؛ پیش‌فرض با انتخاب درس قفل.
 */
export const PaywallDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<number | undefined>();
  const [phase, setPhase] = useState<Phase>('idle');
  const [msg, setMsg] = useState('');
  const [noBazaar, setNoBazaar] = useState(false);

  useEffect(() => onPaywallRequest(lesson => {
    setTarget(lesson); setPhase('idle'); setMsg(''); setOpen(true); sound.playGentleHint();
    isBazaarInstalled().then(ok => setNoBazaar(!ok));
  }), []);
  const close = () => { if (phase !== 'busy') setOpen(false); };
  useBackHandler(() => { close(); }, open);
  if (!open) return null;

  const success = () => {
    setPhase('done'); sound.playPop();
    window.setTimeout(() => { setOpen(false); if (target) setCurrentLesson(target); }, 1400);
  };
  const buy = async () => {
    sound.playPop(); setPhase('busy'); setMsg('');
    const r = await purchaseFullVersion();
    if (r.status === 'purchased') success();
    else if (r.status === 'canceled') setPhase('idle');
    else { setPhase('error'); setMsg(r.message); }
  };
  const restore = async () => {
    sound.playPop(); setPhase('busy'); setMsg('');
    try {
      if (await restorePurchase()) success();
      else { setPhase('error'); setMsg('خریدی با این حساب کافه‌بازار پیدا نشد.'); }
    } catch (e: any) { setPhase('error'); setMsg(billingErrorMessage(e?.code)); }
  };

  const lesson = target ? CURRICULUM[target - 1] : null;
  const busy = phase === 'busy';
  return <div className="paywall-scene" role="presentation" onClick={close}>
    <section className="paywall-panel" dir="rtl" role="dialog" aria-modal="true" aria-label="خرید نسخهٔ کامل" onClick={e => e.stopPropagation()}>
      {phase === 'done' ? <>
        <div className="paywall-emoji">🎉</div>
        <h2>آفرین! همهٔ درس‌ها باز شد</h2>
        <p>از حالا همهٔ {toFa(CURRICULUM.length)} درس در دسترس است.</p>
      </> : <>
        <div className="paywall-emoji">🔒</div>
        <h2>{lesson ? <>درس {toFa(lesson.order)} قفل است</> : 'نسخهٔ کامل'}</h2>
        <p>درس‌های ۱ تا {toFa(FREE_LESSON_LIMIT)} رایگان است. برای باز شدن درس {toFa(FREE_LESSON_LIMIT + 1)} تا {toFa(CURRICULUM.length)} و همهٔ بازی‌هایشان، نسخهٔ کامل را یک بار از کافه‌بازار بخر.</p>
        <p className="paywall-note">👨‍👩‍👧 این بخش برای پدر و مادر است.</p>
        {msg && <p className="paywall-error" role="alert">{msg}</p>}
        {noBazaar
          ? <button className="paywall-buy" onClick={() => { sound.playPop(); openBazaarPage(); }}>نصب کافه‌بازار</button>
          : <button className="paywall-buy" onClick={buy} disabled={busy}>{busy ? 'در حال اتصال به بازار…' : 'خرید نسخهٔ کامل'}</button>}
        <div className="paywall-actions">
          <button onClick={restore} disabled={busy || noBazaar}>قبلاً خریده‌ام</button>
          <button onClick={close} disabled={busy}>بعداً</button>
        </div>
      </>}
    </section>
  </div>;
};
