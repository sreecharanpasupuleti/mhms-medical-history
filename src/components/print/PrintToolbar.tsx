'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="no-print border-b border-slate-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Portal</span>
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>
    </div>
  );
}
