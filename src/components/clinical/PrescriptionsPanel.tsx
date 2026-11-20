'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Download, Pill, Plus, Printer, Search, Trash2 } from 'lucide-react';
import type { PrescriptionDTO, UserDTO, UserRole } from '@/types';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, TableSkeleton } from '@/components/ui/EmptyState';

export function PrescriptionsPanel({
  role,
  currentUserId,
}: {
  role: UserRole;
  currentUserId: string;
}) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDTO[]>([]);
  const [patients, setPatients] = useState<UserDTO[]>([]);
  const [doctors, setDoctors] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PrescriptionDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    prescribedDate: new Date().toISOString().slice(0, 10),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const reqs: Promise<Response>[] = [fetch('/api/prescriptions')];
      if (role !== 'PATIENT') reqs.push(fetch('/api/users?role=PATIENT'));
      if (role === 'ADMIN') reqs.push(fetch('/api/users?role=DOCTOR'));

      const responses = await Promise.all(reqs);
      const prxJson = await responses[0].json();
      setPrescriptions(prxJson.prescriptions || []);

      if (role !== 'PATIENT' && responses[1]) {
        const patJson = await responses[1].json();
        const pats = (patJson.users || []).filter((u: UserDTO) => u.role === 'PATIENT');
        setPatients(pats);
        if (pats.length > 0) setForm((p) => ({ ...p, patientId: p.patientId || pats[0].id }));
      }
      if (role === 'ADMIN' && responses[2]) {
        const docJson = await responses[2].json();
        const docs = (docJson.users || []).filter((u: UserDTO) => u.role === 'DOCTOR');
        setDoctors(docs);
        if (docs.length > 0) setForm((p) => ({ ...p, doctorId: p.doctorId || docs[0].id }));
      }
    } catch {
      setAlert({ variant: 'error', message: 'Failed to load prescriptions.' });
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Could not issue prescription.' });
        return;
      }
      setModalOpen(false);
      setForm((p) => ({
        ...p,
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      }));
      setAlert({ variant: 'success', message: 'Prescription issued successfully.' });
      await loadData();
    } catch {
      setAlert({ variant: 'error', message: 'Network error while issuing prescription.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/prescriptions/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Delete failed.' });
        return;
      }
      setDeleteTarget(null);
      setAlert({ variant: 'success', message: 'Prescription deleted.' });
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = prescriptions.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.medicineName.toLowerCase().includes(q) ||
      p.dosage.toLowerCase().includes(q) ||
      (p.patient?.fullName || '').toLowerCase().includes(q) ||
      (p.doctor?.fullName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {alert && (
        <AlertBanner
          variant={alert.variant}
          message={alert.message}
          onDismiss={() => setAlert(null)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medication, dosage, patient..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/prescriptions"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </a>
          {(role === 'DOCTOR' || role === 'ADMIN') && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Create Prescription</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No prescriptions found"
          description="Active and past medication orders will appear here."
          actionLabel={role !== 'PATIENT' ? 'Create Prescription' : undefined}
          onAction={role !== 'PATIENT' ? () => setModalOpen(true) : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Medication</th>
                <th className="px-4 py-3">Dosage & Regimen</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Prescriber</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prx) => (
                <tr key={prx.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                    {prx.prescribedDate}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900">{prx.medicineName}</p>
                    {prx.instructions && (
                      <p className="text-xs text-slate-500 max-w-xs line-clamp-1">{prx.instructions}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {prx.dosage}
                    </span>
                    <p className="mt-1 text-xs text-slate-600">
                      {prx.frequency} · {prx.duration}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">{prx.patient?.fullName || prx.patientId}</td>
                  <td className="px-4 py-3.5 text-slate-700">{prx.doctor?.fullName || prx.doctorId}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/print/prescription/${prx.id}`}
                        target="_blank"
                        title="Print prescription"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print Rx</span>
                      </Link>
                      {(role === 'ADMIN' || (role === 'DOCTOR' && prx.doctorId === currentUserId)) && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(prx)}
                          aria-label="Delete prescription"
                          className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Issue New Prescription"
        subtitle="Specify medication, dosage, schedule, and patient guidance."
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
              <select
                required
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="">Select patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prescribed Date</label>
              <input
                type="date"
                required
                value={form.prescribedDate}
                onChange={(e) => setForm({ ...form, prescribedDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {role === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prescribing Doctor</label>
              <select
                required
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="">Select doctor...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Lisinopril"
              value={form.medicineName}
              onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosage</label>
              <input
                type="text"
                required
                placeholder="e.g., 10 mg"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
              <input
                type="text"
                required
                placeholder="e.g., Once daily"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                required
                placeholder="e.g., 30 days"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient Instructions</label>
            <textarea
              rows={2}
              placeholder="Take with food, avoid alcohol, monitor blood pressure..."
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {submitting ? 'Issuing...' : 'Issue Prescription'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Prescription"
        description={`Remove prescription for "${deleteTarget?.medicineName}"?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
