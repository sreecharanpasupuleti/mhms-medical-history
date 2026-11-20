import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react';

type StatusValue =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MILD'
  | 'MODERATE'
  | 'SEVERE'
  | 'ADMIN'
  | 'DOCTOR'
  | 'PATIENT';

const CONFIG: Record<
  StatusValue,
  { label: string; className: string; Icon: typeof Clock }
> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
    Icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    Icon: XCircle,
  },
  ACTIVE: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: CheckCircle2,
  },
  INACTIVE: {
    label: 'Inactive',
    className: 'bg-red-50 text-red-800 border-red-200',
    Icon: XCircle,
  },
  MILD: {
    label: 'Mild',
    className: 'bg-slate-100 text-slate-800 border-slate-200',
    Icon: AlertTriangle,
  },
  MODERATE: {
    label: 'Moderate',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: AlertTriangle,
  },
  SEVERE: {
    label: 'Severe',
    className: 'bg-red-50 text-red-800 border-red-200',
    Icon: AlertTriangle,
  },
  ADMIN: {
    label: 'Admin',
    className: 'bg-slate-900 text-white border-slate-900',
    Icon: ShieldCheck,
  },
  DOCTOR: {
    label: 'Doctor',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
    Icon: Stethoscope,
  },
  PATIENT: {
    label: 'Patient',
    className: 'bg-slate-100 text-slate-800 border-slate-200',
    Icon: User,
  },
};

export function StatusBadge({ value }: { value: StatusValue }) {
  const cfg = CONFIG[value];
  const Icon = cfg.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cfg.className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}
