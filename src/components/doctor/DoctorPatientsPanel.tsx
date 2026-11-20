'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Printer, Search, UserCheck } from 'lucide-react';
import type { UserDTO } from '@/types';
import { EmptyState, TableSkeleton } from '@/components/ui/EmptyState';

export function DoctorPatientsPanel({ assignedIds }: { assignedIds: string[] }) {
  const [patients, setPatients] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'assigned' | 'all'>('assigned');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/users?role=PATIENT')
      .then((r) => r.json())
      .then((d) => setPatients(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  const visible = patients.filter((p) => {
    const matchesScope =
      scope === 'all' || assignedIds.length === 0 ? true : assignedIds.includes(p.id);
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.patientProfile?.insuranceNumber || '').toLowerCase().includes(q);
    return matchesScope && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient name or insurance ID..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setScope('assigned')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                scope === 'assigned'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assigned Patients
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                scope === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Active Patients
            </button>
          </div>
        </div>

        <a
          href="/api/export/patients"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Export CSV</span>
        </a>
      </div>

      {loading ? (
        <TableSkeleton rows={3} cols={5} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No patients found"
          description="Patients with appointments, records, prescriptions, or lab reports under your care appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">DOB & Gender</th>
                <th className="px-4 py-3">Blood Group</th>
                <th className="px-4 py-3">Contact & Insurance</th>
                <th className="px-4 py-3 text-right">Clinical Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900">{p.fullName}</p>
                    <p className="text-xs text-slate-500">{p.email}</p>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-700 tabular-nums">
                    {p.patientProfile?.dateOfBirth || 'Not recorded'} ·{' '}
                    <span className="font-sans">{p.patientProfile?.gender || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900">
                    {p.patientProfile?.bloodGroup || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    <p>{p.patientProfile?.phone || 'No phone'}</p>
                    <p className="font-mono text-slate-500">
                      {p.patientProfile?.insuranceNumber || 'Self-pay'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/print/patient-summary/${p.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Medical Summary</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
