'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import type { AllergyDTO, AllergySeverity, UserDTO, UserRole } from '@/types';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, TableSkeleton } from '@/components/ui/EmptyState';

export function AllergiesPanel({ role }: { role: UserRole }) {
  const [allergies, setAllergies] = useState<AllergyDTO[]>([]);
  const [patients, setPatients] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AllergySeverity>('ALL');
  const [alert, setAlert] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AllergyDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    patientId: '',
    allergyName: '',
    severity: 'MODERATE' as AllergySeverity,
    reaction: '',
    notes: '',
    diagnosedDate: new Date().toISOString().slice(0, 10),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const reqs: Promise<Response>[] = [fetch('/api/allergies')];
      if (role !== 'PATIENT') reqs.push(fetch('/api/users?role=PATIENT'));

      const responses = await Promise.all(reqs);
      const algJson = await responses[0].json();
      setAllergies(algJson.allergies || []);

      if (role !== 'PATIENT' && responses[1]) {
        const patJson = await responses[1].json();
        const pats = (patJson.users || []).filter((u: UserDTO) => u.role === 'PATIENT');
        setPatients(pats);
        if (pats.length > 0) setForm((p) => ({ ...p, patientId: p.patientId || pats[0].id }));
      }
    } catch {
      setAlert({ variant: 'error', message: 'Failed to load allergies.' });
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
      const res = await fetch('/api/allergies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Could not record allergy.' });
        return;
      }
      setModalOpen(false);
      setForm((p) => ({ ...p, allergyName: '', reaction: '', notes: '' }));
      setAlert({ variant: 'success', message: 'Allergy alert recorded.' });
      await loadData();
    } catch {
      setAlert({ variant: 'error', message: 'Network error while saving allergy.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/allergies/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Delete failed.' });
        return;
      }
      setDeleteTarget(null);
      setAlert({ variant: 'success', message: 'Allergy entry deleted.' });
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = allergies.filter((a) =>
    severityFilter === 'ALL' ? true : a.severity === severityFilter
  );

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
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['ALL', 'SEVERE', 'MODERATE', 'MILD'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                severityFilter === sev
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sev === 'ALL' ? 'All Severities' : sev.charAt(0) + sev.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {(role === 'DOCTOR' || role === 'ADMIN') && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Allergy</span>
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={3} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No allergies recorded"
          description="Known drug, food, and environmental allergies appear here to guide safe prescribing."
          actionLabel={role !== 'PATIENT' ? 'Add Allergy' : undefined}
          onAction={role !== 'PATIENT' ? () => setModalOpen(true) : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Allergen</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Reaction & Clinical Notes</th>
                <th className="px-4 py-3">Recorded</th>
                {role !== 'PATIENT' && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((alg) => (
                <tr key={alg.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-medium text-slate-900">{alg.allergyName}</td>
                  <td className="px-4 py-3.5 text-slate-700">{alg.patient?.fullName || alg.patientId}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge value={alg.severity} />
                  </td>
                  <td className="px-4 py-3.5 max-w-md">
                    {alg.reaction && <p className="text-slate-800 font-medium">{alg.reaction}</p>}
                    <p className="text-xs text-slate-500">{alg.notes || 'No extra notes'}</p>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                    {alg.diagnosedDate || alg.createdAt.slice(0, 10)}
                  </td>
                  {role !== 'PATIENT' && (
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(alg)}
                        aria-label="Delete allergy"
                        className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Record Patient Allergy"
        subtitle="Document allergen sensitivity and clinical severity."
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
              <select
                required
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as AllergySeverity })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allergy / Substance</label>
              <input
                type="text"
                required
                placeholder="e.g., Penicillin, Sulfa drugs, Peanuts"
                value={form.allergyName}
                onChange={(e) => setForm({ ...form, allergyName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosed Date</label>
              <input
                type="date"
                value={form.diagnosedDate}
                onChange={(e) => setForm({ ...form, diagnosedDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observed Reaction</label>
            <input
              type="text"
              placeholder="e.g., Urticaria, wheezing, localized swelling"
              value={form.reaction}
              onChange={(e) => setForm({ ...form, reaction: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Guidance / Notes</label>
            <textarea
              rows={2}
              placeholder="Precautions or alternative medications"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              {submitting ? 'Saving...' : 'Save Allergy'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Allergy Record"
        description={`Remove "${deleteTarget?.allergyName}" from the patient's allergy profile?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
