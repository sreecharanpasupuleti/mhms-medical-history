import { requirePageRole } from '@/lib/page-guard';
import { getDoctorAssignedPatients } from '@/lib/data-store';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { DoctorPatientsPanel } from '@/components/doctor/DoctorPatientsPanel';

export default async function DoctorPatientsPage() {
  const user = await requirePageRole('DOCTOR');
  const assigned = await getDoctorAssignedPatients(user.id);

  return (
    <DashboardShell
      role="DOCTOR"
      title="Patients"
      breadcrumb="Doctor / Patients"
    >
      <DoctorPatientsPanel assignedIds={assigned.map((p) => p.id)} />
    </DashboardShell>
  );
}
