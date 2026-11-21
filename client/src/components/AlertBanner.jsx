/**
 * @AUTHOR: Garima Mittal
 * @FILE: AlertBanner.jsx
 * @RESPONSIBILITY: Prominent accessible toast / alert banner: big green ✅ for success, big red ⚠️ for errors, plain non-technical language and a × close button.
 * @DEPENDENCIES: react, friendlyMessage.js
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { toFriendlyMessage } from '../utils/friendlyMessage';

export const AlertBanner = ({
  type = 'info',
  message = '',
  onDismiss = () => { },
  autoDismissMs = null,
  className = '',
  inline = false
}) => {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const friendlyText = useMemo(() => toFriendlyMessage(message, type), [message, type]);

  useEffect(() => {
    if (!friendlyText) return undefined;
    const timeoutDuration = autoDismissMs !== null ? autoDismissMs : (type === 'success' ? 7000 : 12000);
    if (timeoutDuration <= 0) return undefined;
    const timer = setTimeout(() => dismissRef.current && dismissRef.current(), timeoutDuration);
    return () => clearTimeout(timer);
  }, [friendlyText, type, autoDismissMs]);

  if (!friendlyText) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  let tone = {
    wrapper: 'bg-white border-slate-300 text-slate-900',
    badge: 'bg-slate-100 border-slate-200',
    icon: 'ℹ️',
    title: 'Please note'
  };
  if (isSuccess) {
    tone = { wrapper: 'bg-emerald-50 border-emerald-500 text-emerald-950', badge: 'bg-emerald-100 border-emerald-300', icon: '✅', title: 'Success!' };
  } else if (isError) {
    tone = { wrapper: 'bg-rose-50 border-rose-500 text-rose-950', badge: 'bg-rose-100 border-rose-300', icon: '⚠️', title: 'Something needs your attention' };
  } else if (isWarning) {
    tone = { wrapper: 'bg-amber-50 border-amber-500 text-amber-950', badge: 'bg-amber-100 border-amber-300', icon: '⚠️', title: 'Please check' };
  }

  const positionClasses = inline
    ? 'w-full'
    : 'fixed top-20 left-1/2 -translate-x-1/2 z-[70] w-[min(94vw,36rem)]';

  return (
    <div
      role="alert"
      aria-live={isError ? 'assertive' : 'polite'}
      data-alert-type={type}
      className={`${positionClasses} flex items-start gap-4 p-4 rounded-2xl border-2 shadow-xl ${tone.wrapper} ${className}`}
    >
      <div
        className={`shrink-0 w-14 h-14 rounded-full border flex items-center justify-center text-4xl leading-none ${tone.badge}`}
        aria-hidden="true"
      >
        {tone.icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="font-heading font-black text-sm tracking-tight">{tone.title}</div>
        <p className="text-[13px] font-semibold leading-relaxed mt-0.5 break-words">{friendlyText}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close notification"
        className="shrink-0 w-8 h-8 rounded-full text-2xl leading-none font-bold text-slate-500 hover:text-slate-900 hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
};

export default AlertBanner;
