'use client';

import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface AlertBannerProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}

const STYLES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  info: 'bg-teal-50 border-teal-200 text-teal-900',
};

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function AlertBanner({ variant, message, onDismiss }: AlertBannerProps) {
  const Icon = ICONS[variant];

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${STYLES[variant]}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="rounded p-0.5 hover:bg-black/5 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
