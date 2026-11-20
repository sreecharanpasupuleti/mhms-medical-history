'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  UserCheck,
  CalendarClock,
  FileText,
  AlertTriangle,
  Pill,
  FlaskConical,
  UserCircle,
  LogOut,
  Menu,
  X,
  Activity,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'User Management', href: '/admin/users', icon: Users },
    { label: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
    { label: 'Patients', href: '/admin/patients', icon: UserCheck },
    { label: 'Appointments', href: '/admin/appointments', icon: CalendarClock },
    { label: 'Medical Records', href: '/admin/records', icon: FileText },
    { label: 'Allergies', href: '/admin/allergies', icon: AlertTriangle },
    { label: 'Prescriptions', href: '/admin/prescriptions', icon: Pill },
    { label: 'Lab Reports', href: '/admin/lab-reports', icon: FlaskConical },
    { label: 'Profile', href: '/admin/profile', icon: UserCircle },
  ],
  DOCTOR: [
    { label: 'Clinical Desk', href: '/doctor', icon: LayoutDashboard },
    { label: 'My Patients', href: '/doctor/patients', icon: UserCheck },
    { label: 'Appointments', href: '/doctor/appointments', icon: CalendarClock },
    { label: 'Medical Records', href: '/doctor/records', icon: FileText },
    { label: 'Allergies', href: '/doctor/allergies', icon: AlertTriangle },
    { label: 'Prescriptions', href: '/doctor/prescriptions', icon: Pill },
    { label: 'Lab Reports', href: '/doctor/lab-reports', icon: FlaskConical },
    { label: 'My Profile', href: '/doctor/profile', icon: UserCircle },
  ],
  PATIENT: [
    { label: 'Health Summary', href: '/patient', icon: LayoutDashboard },
    { label: 'Appointments', href: '/patient/appointments', icon: CalendarClock },
    { label: 'Medical Records', href: '/patient/records', icon: FileText },
    { label: 'Allergies', href: '/patient/allergies', icon: AlertTriangle },
    { label: 'Prescriptions', href: '/patient/prescriptions', icon: Pill },
    { label: 'Lab Reports', href: '/patient/lab-reports', icon: FlaskConical },
    { label: 'My Profile', href: '/patient/profile', icon: UserCircle },
  ],
};

interface DashboardShellProps {
  role: UserRole;
  title: string;
  breadcrumb: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  title,
  breadcrumb,
  actions,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_BY_ROLE[role];

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.replace('/login');
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              MHMS Portal
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1" aria-label="Workspace navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-teal-50 text-teal-800 border border-teal-200/80'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? 'text-teal-700' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {session?.user?.fullName || 'Signed In'}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {session?.user?.role} · {session?.user?.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <LogOut className="h-4 w-4 text-slate-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 w-64 max-w-[85vw] h-full">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{breadcrumb}</p>
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 truncate">
                  {title}
                </h1>
              </div>
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
