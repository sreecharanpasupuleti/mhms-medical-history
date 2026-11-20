import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  FileText,
  FlaskConical,
  Lock,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { getCurrentSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getCurrentSession();
  const portalHref =
    session?.user?.role === 'ADMIN'
      ? '/admin'
      : session?.user?.role === 'DOCTOR'
      ? '/doctor'
      : session?.user?.role === 'PATIENT'
      ? '/patient'
      : '/login';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Zone 1 / Zone 2 / Zone 3 Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Activity className="h-4 w-4" />
            </span>
            <span>MHMS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#capabilities"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#diagnostics"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Diagnostics
            </a>
            <a
              href="#roles"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Clinical Roles
            </a>
            <Link
              href="/register"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Patient Sign Up
            </Link>
          </nav>

          <div className="shrink-0">
            <Link
              href={portalHref}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              <span>{session?.user ? 'Open Dashboard' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Split */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs font-medium tracking-wide text-teal-700">
                  Medical History Management System
                </p>
                <h1
                  className="mt-3 font-display font-bold tracking-tight text-slate-900 leading-[1.1]"
                  style={{
                    fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                    textWrap: 'balance',
                  }}
                >
                  Longitudinal patient records built for clinical clarity.
                </h1>
                <p className="mt-5 max-w-xl text-base text-slate-600 leading-relaxed">
                  Unify patient appointments, diagnoses, allergy alerts, prescriptions, and
                  diagnostic lab reports in one role-protected clinical portal powered by
                  PostgreSQL, Prisma, and Next.js.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href={portalHref}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
                  >
                    <span>{session?.user ? 'Continue to Workspace' : 'Access Clinical Portal'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    <span>Register as Patient</span>
                  </Link>
                </div>

                <p className="mt-6 text-xs text-slate-500">
                  Role-based access for Administrators · Attending Physicians · Registered Patients
                </p>
              </div>

              <div className="lg:col-span-6">
                <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <img
                    src="/images/hero-clinical.jpg"
                    alt="Physician consulting with patient in a modern clinical suite"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* 4-column structural strip below hero split */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-slate-200 pt-8">
              <div>
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">3 Roles</p>
                <p className="mt-1 text-sm text-slate-600">
                  Admin, Doctor, and Patient isolated portals
                </p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">Zero Double-Book</p>
                <p className="mt-1 text-sm text-slate-600">
                  Server-enforced slot conflict validation
                </p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">6 CSV Exports</p>
                <p className="mt-1 text-sm text-slate-600">
                  Appointments, patients, doctors, records, Rx, labs
                </p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">4 Print Views</p>
                <p className="mt-1 text-sm text-slate-600">
                  Medical summaries, slips, Rx sheets, and lab reports
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section id="capabilities" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              01. Structured clinical workflows from booking to discharge
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Every module enforces strict ownership checks, clean auditability, and rapid export.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CalendarCheck2,
                title: 'Conflict-Free Scheduling',
                desc: 'Patients book available physician slots while doctors confirm, complete, or cancel appointments without double-booking.',
              },
              {
                icon: FileText,
                title: 'Medical Records & Allergies',
                desc: 'Record diagnoses, symptoms, treatment regimens, and Mild, Moderate, or Severe allergen alerts per patient.',
              },
              {
                icon: FlaskConical,
                title: 'Diagnostic Lab Uploads',
                desc: 'Attach PDF, JPG, PNG, and DOCX lab documents via Vercel Blob with role-verified download links.',
              },
              {
                icon: Printer,
                title: 'Print-Ready Clinical Forms',
                desc: 'Generate formatted medical summaries, appointment slips, official Rx sheets, and diagnostic lab printouts.',
              },
              {
                icon: ShieldCheck,
                title: 'Verified Role Authorization',
                desc: 'NextAuth credentials with bcrypt password hashing and middleware-enforced Admin, Doctor, and Patient boundaries.',
              },
              {
                icon: Lock,
                title: 'Instant CSV Reporting',
                desc: 'Export clean, formula-safe CSV files across appointments, clinical records, prescriptions, and directories.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Diagnostics & Lab Section */}
        <section id="diagnostics" className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-[4/3]">
                  <img
                    src="/images/clinical-lab.jpg"
                    alt="Clinical diagnostic laboratory analytical equipment"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-6">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  02. Integrated diagnostic lab archive
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Physicians attach hematology panels, imaging PDFs, and pathology DOCX reports
                  directly to patient charts. Authorized patients and doctors download or print
                  official copies on demand.
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Accepted File Types</p>
                    <p className="mt-1 font-mono text-xs text-slate-600">PDF · JPG · PNG · DOCX</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Authorized Delivery</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Session-checked downloads via Vercel Blob
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role Portals */}
        <section id="roles" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                03. Dedicated portals for every clinical role
              </h2>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold text-slate-900">Administrator Console</h3>
                    <span className="font-mono text-xs text-slate-500">admin@mhms.com</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Create, edit, activate/deactivate, and audit all user accounts, doctors,
                    patients, appointments, records, prescriptions, and system metrics.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold text-slate-900">Doctor Clinical Desk</h3>
                    <span className="font-mono text-xs text-slate-500">doctor1@example.com</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Manage assigned patients, confirm or complete consultations, log diagnoses and
                    allergies, prescribe medications, and upload lab reports.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold text-slate-900">Patient Health Portal</h3>
                    <span className="font-mono text-xs text-slate-500">patient1@example.com</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Book conflict-free appointments, review medical history and allergy warnings,
                    access active prescriptions, and download or print lab summaries.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 aspect-square max-w-[260px] mx-auto">
                  <img
                    src="/images/doctor-reed.jpg"
                    alt="Dr. Evelyn Reed, Internal Medicine Lead"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-5 text-center">
                  <h3 className="text-base font-semibold text-slate-900">Dr. Evelyn Reed, MD</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Internal Medicine · License MD-482910
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    &ldquo;Having allergies, prescriptions, and prior diagnostic panels unified on a
                    single patient summary eliminates intake delays during consultations.&rdquo;
                  </p>
                  <div className="mt-5">
                    <Link
                      href="/login"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
                    >
                      <span>Sign In to Demo Accounts</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <p>MHMS — Medical History Management System</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-900">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-900">
              Patient Registration
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
