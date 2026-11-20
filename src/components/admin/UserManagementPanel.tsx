'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Download,
  Edit3,
  Plus,
  Power,
  Printer,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import type { UserDTO, UserRole, UserStatus } from '@/types';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, TableSkeleton } from '@/components/ui/EmptyState';

interface UserManagementPanelProps {
  fixedRole?: UserRole;
  currentAdminId: string;
}

export function UserManagementPanel({
  fixedRole,
  currentAdminId,
}: UserManagementPanelProps) {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>(fixedRole || 'ALL');
  const [alert, setAlert] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: (fixedRole || 'PATIENT') as UserRole,
    status: 'ACTIVE' as UserStatus,
    specialization: '',
    licenseNumber: '',
    department: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = fixedRole ? `?role=${fixedRole}` : '';
      const res = await fetch(`/api/users${qs}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setAlert({ variant: 'error', message: 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  }, [fixedRole]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function openCreateModal() {
    setEditingUser(null);
    setForm({
      fullName: '',
      email: '',
      password: '',
      role: fixedRole || 'PATIENT',
      status: 'ACTIVE',
      specialization: '',
      licenseNumber: '',
      department: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
    });
    setModalOpen(true);
  }

  function openEditModal(u: UserDTO) {
    setEditingUser(u);
    setForm({
      fullName: u.fullName,
      email: u.email,
      password: '',
      role: u.role,
      status: u.status,
      specialization: u.doctorProfile?.specialization || '',
      licenseNumber: u.doctorProfile?.licenseNumber || '',
      department: u.doctorProfile?.department || '',
      phone: u.doctorProfile?.phone || u.patientProfile?.phone || '',
      dateOfBirth: u.patientProfile?.dateOfBirth || '',
      gender: u.patientProfile?.gender || '',
      bloodGroup: u.patientProfile?.bloodGroup || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Could not save user.' });
        return;
      }
      setModalOpen(false);
      setAlert({
        variant: 'success',
        message: editingUser ? 'User updated successfully.' : 'User created successfully.',
      });
      await loadUsers();
    } catch {
      setAlert({ variant: 'error', message: 'Network error while saving user.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(u: UserDTO) {
    const nextStatus: UserStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Status update failed.' });
        return;
      }
      setAlert({
        variant: 'success',
        message: `${u.fullName} marked as ${nextStatus.toLowerCase()}.`,
      });
      await loadUsers();
    } catch {
      setAlert({ variant: 'error', message: 'Failed to update status.' });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Delete failed.' });
        return;
      }
      setDeleteTarget(null);
      setAlert({ variant: 'success', message: 'User deleted.' });
      await loadUsers();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' ? true : u.role === roleFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const exportUrl =
    fixedRole === 'DOCTOR'
      ? '/api/export/doctors'
      : fixedRole === 'PATIENT'
      ? '/api/export/patients'
      : null;

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>

          {!fixedRole && (
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['ALL', 'ADMIN', 'DOCTOR', 'PATIENT'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    roleFilter === r
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'ALL' ? 'All Roles' : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {exportUrl && (
            <a
              href={exportUrl}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export CSV</span>
            </a>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>
              {fixedRole === 'DOCTOR'
                ? 'Add Doctor'
                : fixedRole === 'PATIENT'
                ? 'Add Patient'
                : 'Create User'}
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No accounts found"
          description="Try clearing your search or create a new user account."
          actionLabel="Create User"
          onAction={openCreateModal}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Name & Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Clinical Details</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900">{u.fullName}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge value={u.role} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    {u.role === 'DOCTOR' && u.doctorProfile ? (
                      <span>
                        {u.doctorProfile.specialization} · {u.doctorProfile.licenseNumber}
                      </span>
                    ) : u.role === 'PATIENT' && u.patientProfile ? (
                      <span>
                        {u.patientProfile.bloodGroup || 'Blood N/A'} ·{' '}
                        {u.patientProfile.dateOfBirth || 'DOB N/A'}
                      </span>
                    ) : (
                      <span>System Administrator</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge value={u.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {u.role === 'PATIENT' && (
                        <Link
                          href={`/print/patient-summary/${u.id}`}
                          target="_blank"
                          title="Print patient medical summary"
                          className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        title="Edit user"
                        className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {u.id !== currentAdminId && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Deactivate user' : 'Activate user'}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Power className="h-3.5 w-3.5" />
                            <span>{u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            title="Delete user"
                            className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
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
        title={editingUser ? 'Edit User Account' : 'Create User Account'}
        subtitle="Configure account credentials, role permissions, and clinical profile metadata."
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={form.role}
                disabled={Boolean(fixedRole)}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none disabled:bg-slate-100"
              >
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {editingUser ? 'New Password (optional)' : 'Password'}
              </label>
              <input
                type="password"
                required={!editingUser}
                minLength={editingUser ? undefined : 8}
                placeholder={editingUser ? 'Leave blank to keep' : 'Min 8 characters'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {form.role === 'DOCTOR' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Specialization</label>
                <input
                  type="text"
                  placeholder="Internal Medicine"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">License #</label>
                <input
                  type="text"
                  placeholder="MD-104829"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Cardiology"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {form.role === 'PATIENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                >
                  <option value="">Select...</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+1 (555)..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>
          )}

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
              {submitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete User Account"
        description={`Permanently delete ${deleteTarget?.fullName} (${deleteTarget?.email}) and associated clinical links?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
