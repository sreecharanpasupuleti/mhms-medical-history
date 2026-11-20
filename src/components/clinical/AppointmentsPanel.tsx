'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Download,
  Plus,
  Printer,
  Trash2,
  Check,
  X,
  CheckCheck,
} from 'lucide-react';
import type { AppointmentDTO, AppointmentStatus, UserDTO, UserRole } from '@/types';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, TableSkeleton } from '@/components/ui/EmptyState';

const TIME_SLOTS = [
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
];

export function AppointmentsPanel({ role }: { role: UserRole }) {
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [doctors, setDoctors] = useState<UserDTO[]>([]);
  const [patients, setPatients] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [alert, setAlert] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    appointmentTime: '09:30',
    reason: '',
    notes: '',
  });

  const [deleteTarget, setDeleteTarget] = useState<AppointmentDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const requests: Promise<Response>[] = [fetch('/api/appointments')];
      if (role !== 'DOCTOR') {
        requests.push(fetch('/api/users?role=DOCTOR'));
      }
      if (role !== 'PATIENT') {
        requests.push(fetch('/api/users?role=PATIENT'));
      }

      const responses = await Promise.all(requests);
      const apptsRes = await responses[0].json();
      setAppointments(apptsRes.appointments || []);

      let idx = 1;
      if (role !== 'DOCTOR' && responses[idx]) {
        const docsRes = await responses[idx].json();
        const docList = (docsRes.users || []).filter((u: UserDTO) => u.role === 'DOCTOR');
        setDoctors(docList);
        if (docList.length > 0) {
          setForm((prev) => ({ ...prev, doctorId: prev.doctorId || docList[0].id }));
        }
        idx++;
      }
      if (role !== 'PATIENT' && responses[idx]) {
        const patsRes = await responses[idx].json();
        const patList = (patsRes.users || []).filter((u: UserDTO) => u.role === 'PATIENT');
        setPatients(patList);
        if (patList.length > 0) {
          setForm((prev) => ({ ...prev, patientId: prev.patientId || patList[0].id }));
        }
      }
    } catch {
      setAlert({ variant: 'error', message: 'Failed to load appointments.' });
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live slot availability lookup for double-booking prevention
  useEffect(() => {
    if (!modalOpen || !form.doctorId || !form.appointmentDate) return;
    let active = true;
    fetch(
      `/api/appointments?slotsOnly=true&doctorId=${encodeURIComponent(
        form.doctorId
      )}&date=${encodeURIComponent(form.appointmentDate)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (active && Array.isArray(d.bookedTimes)) {
          setBookedTimes(d.bookedTimes);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [modalOpen, form.doctorId, form.appointmentDate]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Could not schedule appointment.' });
        return;
      }
      setModalOpen(false);
      setForm((prev) => ({ ...prev, reason: '', notes: '' }));
      setAlert({ variant: 'success', message: 'Appointment scheduled successfully.' });
      await loadData();
    } catch {
      setAlert({ variant: 'error', message: 'Network error while scheduling appointment.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(id: string, status: AppointmentStatus) {
    setAlert(null);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Unable to update appointment.' });
        return;
      }
      setAlert({ variant: 'success', message: `Appointment marked as ${status.toLowerCase()}.` });
      await loadData();
    } catch {
      setAlert({ variant: 'error', message: 'Failed to update appointment status.' });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/appointments/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Delete failed.' });
        return;
      }
      setDeleteTarget(null);
      setAlert({ variant: 'success', message: 'Appointment deleted.' });
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = appointments.filter((a) =>
    statusFilter === 'ALL' ? true : a.status === statusFilter
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
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Appointments' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/appointments"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </a>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>{role === 'PATIENT' ? 'Book Appointment' : 'Schedule Appointment'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No appointments found"
          description="There are no appointments matching the selected status filter."
          actionLabel={role === 'PATIENT' ? 'Book Appointment' : 'Schedule Appointment'}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Attending Doctor</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-900 tabular-nums whitespace-nowrap">
                    {apt.appointmentDate} · {apt.appointmentTime}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-900">{apt.patient?.fullName || 'Patient'}</p>
                    <p className="text-xs text-slate-500">{apt.patient?.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-900">{apt.doctor?.fullName || 'Doctor'}</p>
                    <p className="text-xs text-slate-500">
                      {apt.doctor?.doctorProfile?.specialization || 'Physician'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <p className="text-slate-700 line-clamp-2">{apt.reason}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge value={apt.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {(role === 'DOCTOR' || role === 'ADMIN') && apt.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(apt.id, 'CONFIRMED')}
                          title="Confirm appointment"
                          className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-100 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Confirm</span>
                        </button>
                      )}
                      {(role === 'DOCTOR' || role === 'ADMIN') &&
                        (apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(apt.id, 'COMPLETED')}
                            title="Mark completed"
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            <span>Complete</span>
                          </button>
                        )}
                      {((role === 'PATIENT' && apt.status === 'PENDING') ||
                        ((role === 'DOCTOR' || role === 'ADMIN') &&
                          (apt.status === 'PENDING' || apt.status === 'CONFIRMED'))) && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(apt.id, 'CANCELLED')}
                          title="Cancel appointment"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                      <Link
                        href={`/print/appointment/${apt.id}`}
                        target="_blank"
                        title="Print appointment details"
                        className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Link>
                      {role === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(apt)}
                          title="Delete appointment"
                          className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 transition-colors"
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
        title={role === 'PATIENT' ? 'Book Clinical Appointment' : 'Schedule Appointment'}
        subtitle="Double booking is automatically blocked for occupied doctor time slots."
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleBook} className="space-y-4">
          {role !== 'PATIENT' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient
              </label>
              <select
                required
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="">Select patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {role !== 'DOCTOR' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Doctor
              </label>
              <select
                required
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="">Select doctor...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} — {d.doctorProfile?.specialization || 'Physician'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time Slot
              </label>
              <select
                required
                value={form.appointmentTime}
                onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                {TIME_SLOTS.map((slot) => {
                  const occupied = bookedTimes.includes(slot);
                  return (
                    <option key={slot} value={slot} disabled={occupied}>
                      {slot} {occupied ? '(Booked)' : '(Available)'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason for Consultation
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Annual physical exam, follow-up blood panel"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Additional Notes (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any fasting requirements or symptoms to note"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
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
              {submitting ? 'Scheduling...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Appointment Record"
        description="Are you sure you want to permanently remove this appointment? This action cannot be undone."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
