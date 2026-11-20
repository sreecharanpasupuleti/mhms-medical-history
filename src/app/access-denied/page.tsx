import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function AccessDeniedPage({
  searchParams,
}: {
  searchParams?: { reason?: string };
}) {
  const isInactive = searchParams?.reason === 'inactive';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-xl font-bold text-slate-900">
          {isInactive ? 'Account Deactivated' : 'Access Denied'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {isInactive
            ? 'Your account has been deactivated by an administrator. Please contact support to restore clinical portal access.'
            : 'Your current user role does not have permission to view this clinical workspace.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Go to My Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
