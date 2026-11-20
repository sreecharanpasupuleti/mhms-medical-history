'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Download, FileText, Plus, Printer, Search, Trash2 } from 'lucide-react';
import type { MedicalRecordDTO, UserDTO, UserRole } from '@/types';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, TableSkeleton } from '@/components/ui/EmptyState';

export function MedicalRecordsPanel({
  role,
  currentUserId,
}: {
  role: UserRole;
  currentUserId: string;
}) {
  const [records, setRecords] = useState<MedicalRecordDTO[]>([]);
  const [patients, setPatients] = useState<UserDTO[]>([]);
  const [doctors, setDoctors] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MedicalRecordDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    notes: '',
    recordDate: new Date().toISOString().slice(0, 10),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const reqs: Promise<Response>[] = [fetch('/api/records')];
      if (role !== 'PATIENT') reqs.push(fetch('/api/users?role=PATIENT'));
      if (role === 'ADMIN') reqs.push(fetch('/api/users?role=DOCTOR'));

      const responses = await Promise.all(reqs);
      const recJson = await responses[0].json();
      setRecords(recJson.records || []);

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
      setAlert({ variant: 'error', message: 'Failed to load medical records.' });
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
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Could not save medical record.' });
        return;
      }
      setModalOpen(false);
      setForm((p) => ({ ...p, diagnosis: '', symptoms: '', treatment: '', notes: '' }));
      setAlert({ variant: 'success', message: 'Medical record added.' });
      await loadData();
    } catch {
      setAlert({ variant: 'error', message: 'Network error while saving record.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/records/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Delete failed.' });
        return;
      }
      setDeleteTarget(null);
      setAlert({ variant: 'success', message: 'Medical record deleted.' });
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.diagnosis.toLowerCase().includes(q) ||
      r.symptoms.toLowerCase().includes(q) ||
      r.treatment.toLowerCase().includes(q) ||
      (r.patient?.fullName || '').toLowerCase().includes(q) ||
      (r.doctor?.fullName || '').toLowerCase().includes(q)
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
            placeholder="Search diagnosis, symptoms, patient..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {role === 'PATIENT' && (
            <Link
              href={`/print/patient-summary/${currentUserId}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Print Summary</span>
            </Link>
          )}
          <a
            href="/api/export/records"
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
              <span>Add Medical Record</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No medical records found"
          description={
            role === 'PATIENT'
              ? 'Clinical diagnoses and visit notes recorded by your physician will appear here.'
              : 'Add a patient diagnosis, symptoms, and treatment plan to begin their clinical history.'
          }
          actionLabel={role !== 'PATIENT' ? 'Add Medical Record' : undefined}
          onAction={role !== 'PATIENT' ? () => setModalOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                    <span>{rec.recordDate}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-sans text-slate-700 font-medium">
                      Patient: {rec.patient?.fullName || rec.patientId}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-sans">Attending: {rec.doctor?.fullName || rec.doctorId}</span>
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-slate-900">
                    {rec.diagnosis}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/print/patient-summary/${rec.patientId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Summary</span>
                  </Link>
                  {(role === 'ADMIN' || (role === 'DOCTOR' && rec.doctorId === currentUserId)) && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(rec)}
                      aria-label="Delete medical record"
                      className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-500">Observed Symptoms</p>
                  <p className="mt-1 text-slate-700">{rec.symptoms}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Treatment Plan</p>
                  <p className="mt-1 text-slate-700">{rec.treatment}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Clinical Notes</p>
                  <p className="mt-1 text-slate-600">{rec.notes || 'None documented'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="New Medical Record"
        subtitle="Document diagnosis, presenting symptoms, and prescribed treatment."
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Record Date</label>
              <input
                type="date"
                required
                value={form.recordDate}
                onChange={(e) => setForm({ ...form, recordDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {role === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Attending Doctor</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
            <input
              type="text"
              required
              placeholder="e.g., Acute Viral Bronchitis"
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms</label>
            <textarea
              rows={2}
              required
              placeholder="Document patient-reported symptoms and vital observations"
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Treatment</label>
            <textarea
              rows={2}
              required
              placeholder="Outline therapeutic regimen, lifestyle counseling, or follow-up"
              value={form.treatment}
              onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes (optional)</label>
            <textarea
              rows={2}
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
              {submitting ? 'Saving...' : 'Save Medical Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Medical Record"
        description={`Remove diagnosis "${deleteTarget?.diagnosis}" from this patient's history?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
