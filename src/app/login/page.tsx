'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { Activity, ArrowRight, Lock, Mail } from 'lucide-react';
import { AlertBanner } from '@/components/ui/AlertBanner';

const TEST_ACCOUNTS = [
  { label: 'Admin', email: 'admin@mhms.com', pass: 'Admin@123', desc: 'Full system console' },
  { label: 'Doctor', email: 'doctor1@example.com', pass: 'Doctor@123', desc: 'Dr. Evelyn Reed' },
  { label: 'Patient', email: 'patient1@example.com', pass: 'Patient@123', desc: 'Claire Bennett' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error === 'CredentialsSignin' ? 'Invalid email or password.' : res.error);
        return;
      }

      let destination = callbackUrl && callbackUrl !== '/dashboard' ? callbackUrl : '';
      if (!destination) {
        const session = await getSession();
        const role = session?.user?.role;
        destination =
          role === 'ADMIN' ? '/admin' : role === 'DOCTOR' ? '/doctor' : '/patient';
      }

      router.replace(destination);
    } catch {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Activity className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            MHMS Portal
          </span>
        </Link>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="font-display text-xl font-bold text-slate-900">Sign in to your account</h1>
          <p className="mt-1 text-sm text-slate-600">
            Access your role-authorized medical history workspace.
          </p>

          {error && (
            <div className="mt-4">
              <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50 transition-colors"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-xs font-medium text-slate-500 mb-2.5">
              Fill seeded test credentials:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TEST_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                    setError(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left hover:border-teal-600 hover:bg-teal-50/40 transition-colors"
                >
                  <p className="text-xs font-semibold text-slate-900">{acc.label}</p>
                  <p className="text-[11px] text-slate-500 truncate">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            New patient?{' '}
            <Link href="/register" className="font-medium text-teal-700 hover:text-teal-800">
              Create a patient account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}
