'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidth = 'max-w-xl',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
