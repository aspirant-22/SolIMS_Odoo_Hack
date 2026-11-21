/**
 * @AUTHOR: Garima Mittal
 * @FILE: AlertBanner.jsx
 * @RESPONSIBILITY: Reusable accessible alert/toast banner with auto-dismiss timers and explicit close button.
 * @DEPENDENCIES: react, lucide-react
 */

import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const AlertBanner = ({
  type = 'info',
  message = '',
  onDismiss = () => {},
  autoDismissMs = null,
  className = ''
}) => {
  useEffect(() => {
    if (!message) return;
    const timeoutDuration = autoDismissMs !== null 
      ? autoDismissMs 
      : (type === 'success' ? 6000 : 10000);

    if (timeoutDuration <= 0) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [message, type, autoDismissMs, onDismiss]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  let bannerStyle = 'bg-slate-100 text-slate-800 border-slate-200';
  let IconComponent = Info;
  let iconColor = 'text-slate-600';

  if (isSuccess) {
    bannerStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    IconComponent = CheckCircle2;
    iconColor = 'text-emerald-700';
  } else if (isError) {
    bannerStyle = 'bg-rose-50 text-rose-800 border-rose-200';
    IconComponent = AlertCircle;
    iconColor = 'text-rose-600';
  } else if (isWarning) {
    bannerStyle = 'bg-amber-50 text-amber-900 border-amber-200';
    IconComponent = AlertTriangle;
    iconColor = 'text-amber-600';
  }

  return (
    <div
      role="alert"
      className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 border shadow-2xs transition-all animate-in fade-in slide-in-from-top-1 ${bannerStyle} ${className}`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <IconComponent className={`w-4 h-4 shrink-0 ${iconColor}`} />
        <span className="leading-relaxed break-words">{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AlertBanner;
