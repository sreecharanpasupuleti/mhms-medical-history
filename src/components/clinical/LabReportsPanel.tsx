'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Download,
  FlaskConical,
  Plus,
  Printer,
  Trash2,
  UploadCloud,
  FileCheck2,
} from 'lucide-react';
import type { LabReportDTO, UserDTO, UserRole } from '@/types';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, TableSkeleton } from '@/components/ui/EmptyState';

export function LabReportsPanel({
  role,
  currentUserId,
}: {
  role: UserRole;
  currentUserId: string;
}) {
  const [reports, setReports] = useState<LabReportDTO[]>([]);
  const [patients, setPatients] = useState<UserDTO[]>([]);
  const [doctors, setDoctors] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LabReportDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    reportTitle: '',
    reportType: 'Hematology',
    reportDate: new Date().toISOString().slice(0, 10),
    notes: '',
    fileUrl: '',
    fileName: '',
    fileType: '',
    fileSize: 0,
    uploadedFileId: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const reqs: Promise<Response>[] = [fetch('/api/lab-reports')];
      if (role !== 'PATIENT') reqs.push(fetch('/api/users?role=PATIENT'));
      if (role === 'ADMIN') reqs.push(fetch('/api/users?role=DOCTOR'));

      const responses = await Promise.all(reqs);
      const labJson = await responses[0].json();
      setReports(labJson.labReports || []);

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
      setAlert({ variant: 'error', message: 'Failed to load lab reports.' });
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'jpg', 'jpeg', 'png', 'docx'].includes(ext)) {
      setUploadError('Unsupported file format. Please select a PDF, JPG, PNG, or DOCX file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10 MB maximum size.');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (form.patientId) fd.append('patientId', form.patientId);
      fd.append('category', 'LAB_REPORT');

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'File upload failed.');
        return;
      }

      setForm((prev) => ({
        ...prev,
        fileUrl: data.downloadUrl || data.file.fileUrl,
        fileName: data.file.fileName,
        fileType: data.file.fileType,
        fileSize: data.file.fileSize,
        uploadedFileId: data.file.id,
      }));
    } catch {
      setUploadError('Network error while uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fileUrl) {
      setUploadError('Please upload a lab report file (PDF, JPG, PNG, or DOCX) before saving.');
      return;
    }

    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch('/api/lab-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Could not save lab report.' });
        return;
      }
      setModalOpen(false);
      setForm((p) => ({
        ...p,
        reportTitle: '',
        notes: '',
        fileUrl: '',
        fileName: '',
        fileType: '',
        fileSize: 0,
        uploadedFileId: '',
      }));
      setAlert({ variant: 'success', message: 'Lab report uploaded and attached to patient record.' });
      await loadData();
    } catch {
      setAlert({ variant: 'error', message: 'Network error while creating lab report.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lab-reports/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Delete failed.' });
        return;
      }
      setDeleteTarget(null);
      setAlert({ variant: 'success', message: 'Lab report deleted.' });
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

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
        <p className="text-sm text-slate-600">
          Authorized diagnostic files (PDF, JPG, PNG, DOCX) stored securely for clinical review.
        </p>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/lab-reports"
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
              <span>Upload Lab Report</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={3} cols={5} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No lab reports uploaded"
          description="Diagnostic lab results and imaging documents will appear here once attached."
          actionLabel={role !== 'PATIENT' ? 'Upload Lab Report' : undefined}
          onAction={role !== 'PATIENT' ? () => setModalOpen(true) : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Report Title & Type</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Attachment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                    {rep.reportDate}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900">{rep.reportTitle}</p>
                    <p className="text-xs text-slate-500">
                      {rep.reportType} · Ordered by {rep.doctor?.fullName || 'Doctor'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">{rep.patient?.fullName || rep.patientId}</td>
                  <td className="px-4 py-3.5">
                    <a
                      href={rep.fileUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[180px]">{rep.fileName}</span>
                    </a>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/print/lab-report/${rep.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print</span>
                      </Link>
                      {(role === 'ADMIN' || (role === 'DOCTOR' && rep.doctorId === currentUserId)) && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(rep)}
                          aria-label="Delete lab report"
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
        title="Upload Lab Report"
        subtitle="Attach PDF, JPG, PNG, or DOCX files (up to 10 MB) via Vercel Blob."
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Report Date</label>
              <input
                type="date"
                required
                value={form.reportDate}
                onChange={(e) => setForm({ ...form, reportDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {role === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ordering Doctor</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Report Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Comprehensive Metabolic Panel"
                value={form.reportTitle}
                onChange={(e) => setForm({ ...form, reportTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Report Category</label>
              <select
                value={form.reportType}
                onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="Hematology">Hematology</option>
                <option value="Cardiometabolic">Cardiometabolic</option>
                <option value="Radiology & Imaging">Radiology & Imaging</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Pathology">Pathology</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Diagnostic File (PDF, JPG, PNG, DOCX)
            </label>
            <label className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center cursor-pointer hover:border-teal-600 hover:bg-teal-50/40 transition-colors">
              <UploadCloud className="h-6 w-6 text-slate-400" />
              <span className="mt-2 text-sm font-medium text-slate-700">
                {uploading ? 'Uploading document...' : 'Click to choose file'}
              </span>
              <span className="mt-0.5 text-xs text-slate-500">
                Accepted: PDF, JPG, PNG, DOCX up to 10 MB
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>
            {uploadError && (
              <p className="mt-2 text-xs font-medium text-red-600">{uploadError}</p>
            )}
            {form.fileName && !uploadError && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-700" />
                <span className="truncate font-medium">{form.fileName}</span>
                <span className="font-mono text-emerald-700 shrink-0">
                  ({Math.max(1, Math.round(form.fileSize / 1024))} KB)
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Findings & Notes</label>
            <textarea
              rows={2}
              placeholder="Summarize key values or interpretation notes"
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
              disabled={submitting || uploading}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Lab Report'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Lab Report"
        description={`Delete "${deleteTarget?.reportTitle}" from this patient's records?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
