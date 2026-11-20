'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Activity } from 'lucide-react';

export default function DashboardRouterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login');
      return;
    }
    if (session.user.role === 'ADMIN') {
      router.replace('/admin');
    } else if (session.user.role === 'DOCTOR') {
      router.replace('/doctor');
    } else {
      router.replace('/patient');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2.5 text-slate-700">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
          <Activity className="h-4 w-4 animate-pulse" />
        </span>
        <span className="text-sm font-medium">Opening your clinical workspace...</span>
      </div>
    </div>
  );
}
