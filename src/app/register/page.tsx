'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Activity, ArrowRight } from 'lucide-react';
import { AlertBanner } from '@/components/ui/AlertBanner';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          bloodGroup: form.bloodGroup,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      const signInRes = await signIn('credentials', {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push('/login');
        return;
      }

      router.replace('/patient');
    } catch {
      setError('Network error during registration.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Activity className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            MHMS Portal
          </span>
        </Link>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="font-display text-xl font-bold text-slate-900">Patient Registration</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create your patient profile to book appointments and access records.
          </p>

          {error && (
            <div className="mt-4">
              <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Jordan Taylor"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jordan@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 019-2834"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50 transition-colors"
            >
              <span>{loading ? 'Creating account...' : 'Register & Open Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link href="/login" className="font-medium text-teal-700 hover:text-teal-800">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
