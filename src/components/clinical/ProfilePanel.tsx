'use client';

import { useEffect, useState } from 'react';
import type { UserDTO } from '@/types';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function ProfilePanel() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
    insuranceNumber: '',
    specialization: '',
    licenseNumber: '',
    department: '',
    availability: '',
    consultationFee: '',
    bio: '',
  });

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          const u: UserDTO = d.user;
          setUser(u);
          setForm({
            fullName: u.fullName || '',
            phone: u.patientProfile?.phone || u.doctorProfile?.phone || '',
            dateOfBirth: u.patientProfile?.dateOfBirth || '',
            gender: u.patientProfile?.gender || '',
            bloodGroup: u.patientProfile?.bloodGroup || '',
            address: u.patientProfile?.address || '',
            emergencyContact: u.patientProfile?.emergencyContact || '',
            insuranceNumber: u.patientProfile?.insuranceNumber || '',
            specialization: u.doctorProfile?.specialization || '',
            licenseNumber: u.doctorProfile?.licenseNumber || '',
            department: u.doctorProfile?.department || '',
            availability: u.doctorProfile?.availability || '',
            consultationFee:
              u.doctorProfile?.consultationFee !== undefined && u.doctorProfile?.consultationFee !== null
                ? String(u.doctorProfile.consultationFee)
                : '',
            bio: u.doctorProfile?.bio || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const payload: Record<string, unknown> = { fullName: form.fullName };
      if (user?.role === 'PATIENT') {
        Object.assign(payload, {
          phone: form.phone,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          bloodGroup: form.bloodGroup,
          address: form.address,
          emergencyContact: form.emergencyContact,
          insuranceNumber: form.insuranceNumber,
        });
      } else if (user?.role === 'DOCTOR') {
        Object.assign(payload, {
          phone: form.phone,
          specialization: form.specialization,
          licenseNumber: form.licenseNumber,
          department: form.department,
          availability: form.availability,
          consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
          bio: form.bio,
        });
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ variant: 'error', message: data.error || 'Could not update profile.' });
        return;
      }
      setUser(data.user);
      setAlert({ variant: 'success', message: 'Profile saved successfully.' });
    } catch {
      setAlert({ variant: 'error', message: 'Network error while saving profile.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-5">
      {alert && (
        <AlertBanner
          variant={alert.variant}
          message={alert.message}
          onDismiss={() => setAlert(null)}
        />
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user.fullName}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge value={user.role} />
            <StatusBadge value={user.status} />
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
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

          {user.role === 'PATIENT' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Insurance ID</label>
                  <input
                    type="text"
                    value={form.insuranceNumber}
                    onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </>
          )}

          {user.role === 'DOCTOR' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medical License #</label>
                  <input
                    type="text"
                    value={form.licenseNumber}
                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
                  <input
                    type="text"
                    value={form.availability}
                    onChange={(e) => setForm({ ...form, availability: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.consultationFee}
                    onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Bio</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
