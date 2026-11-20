import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import {
  listAppointments,
  listLabReports,
  listMedicalRecords,
  listPrescriptions,
  listUsers,
} from '@/lib/data-store';
import { buildCsv } from '@/lib/csv';

export async function GET(
  _request: Request,
  { params }: { params: { entity: string } }
) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { role, id: userId } = auth.session.user;
  const entity = params.entity;
  let csv = '';
  const filename = `mhms-${entity}-${new Date().toISOString().slice(0, 10)}.csv`;

  if (entity === 'appointments') {
    const rows = await listAppointments(
      role === 'PATIENT' ? { patientId: userId } : role === 'DOCTOR' ? { doctorId: userId } : {}
    );
    csv = buildCsv(
      ['ID', 'Date', 'Time', 'Patient', 'Doctor', 'Status', 'Reason', 'Notes'],
      rows.map((r) => [
        r.id,
        r.appointmentDate,
        r.appointmentTime,
        r.patient?.fullName || r.patientId,
        r.doctor?.fullName || r.doctorId,
        r.status,
        r.reason,
        r.notes || '',
      ])
    );
  } else if (entity === 'patients') {
    if (role === 'PATIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const patients = await listUsers({ role: 'PATIENT' });
    csv = buildCsv(
      ['ID', 'Full Name', 'Email', 'Status', 'DOB', 'Gender', 'Blood Group', 'Phone', 'Insurance Number'],
      patients.map((p) => [
        p.id,
        p.fullName,
        p.email,
        p.status,
        p.patientProfile?.dateOfBirth || '',
        p.patientProfile?.gender || '',
        p.patientProfile?.bloodGroup || '',
        p.patientProfile?.phone || '',
        p.patientProfile?.insuranceNumber || '',
      ])
    );
  } else if (entity === 'doctors') {
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const doctors = await listUsers({ role: 'DOCTOR' });
    csv = buildCsv(
      ['ID', 'Full Name', 'Email', 'Status', 'Specialization', 'License Number', 'Department', 'Availability', 'Fee'],
      doctors.map((d) => [
        d.id,
        d.fullName,
        d.email,
        d.status,
        d.doctorProfile?.specialization || '',
        d.doctorProfile?.licenseNumber || '',
        d.doctorProfile?.department || '',
        d.doctorProfile?.availability || '',
        d.doctorProfile?.consultationFee ?? '',
      ])
    );
  } else if (entity === 'records') {
    const records = await listMedicalRecords(
      role === 'PATIENT' ? { patientId: userId } : role === 'DOCTOR' ? { doctorId: userId } : {}
    );
    csv = buildCsv(
      ['ID', 'Record Date', 'Patient', 'Doctor', 'Diagnosis', 'Symptoms', 'Treatment', 'Notes'],
      records.map((r) => [
        r.id,
        r.recordDate,
        r.patient?.fullName || r.patientId,
        r.doctor?.fullName || r.doctorId,
        r.diagnosis,
        r.symptoms,
        r.treatment,
        r.notes || '',
      ])
    );
  } else if (entity === 'prescriptions') {
    const prescriptions = await listPrescriptions(
      role === 'PATIENT' ? { patientId: userId } : role === 'DOCTOR' ? { doctorId: userId } : {}
    );
    csv = buildCsv(
      ['ID', 'Prescribed Date', 'Patient', 'Doctor', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions'],
      prescriptions.map((p) => [
        p.id,
        p.prescribedDate,
        p.patient?.fullName || p.patientId,
        p.doctor?.fullName || p.doctorId,
        p.medicineName,
        p.dosage,
        p.frequency,
        p.duration,
        p.instructions || '',
      ])
    );
  } else if (entity === 'lab-reports') {
    const reports = await listLabReports(
      role === 'PATIENT' ? { patientId: userId } : role === 'DOCTOR' ? { doctorId: userId } : {}
    );
    csv = buildCsv(
      ['ID', 'Report Date', 'Title', 'Type', 'Patient', 'Doctor', 'File Name', 'Notes'],
      reports.map((l) => [
        l.id,
        l.reportDate,
        l.reportTitle,
        l.reportType,
        l.patient?.fullName || l.patientId,
        l.doctor?.fullName || l.doctorId,
        l.fileName,
        l.notes || '',
      ])
    );
  } else {
    return NextResponse.json({ error: 'Unknown export entity.' }, { status: 400 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
