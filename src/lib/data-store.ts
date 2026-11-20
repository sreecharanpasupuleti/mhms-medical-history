import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { isDatabaseConfigured } from './db-mode';
import { getPreviewDb, makeId, persistPreviewDb } from './preview-store';
import type {
  AllergyDTO,
  AllergySeverity,
  AppointmentDTO,
  AppointmentStatus,
  DoctorProfileDTO,
  LabReportDTO,
  MedicalRecordDTO,
  PatientProfileDTO,
  PrescriptionDTO,
  SystemStatsDTO,
  UploadedFileDTO,
  UserDTO,
  UserRole,
  UserStatus,
} from '@/types';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

function serializeDate(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : String(d);
}

// ---------- AUTH / USER LOOKUPS ----------

export async function findAuthUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (isDatabaseConfigured()) {
    return prisma.user.findUnique({ where: { email: normalized } });
  }
  const db = getPreviewDb();
  return db.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function listUsers(filters?: { role?: UserRole; status?: UserStatus; search?: string }): Promise<UserDTO[]> {
  if (isDatabaseConfigured()) {
    const users = await prisma.user.findMany({
      where: {
        ...(filters?.role ? { role: filters.role } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.search
          ? {
              OR: [
                { fullName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: serializeDate(u.createdAt),
      updatedAt: serializeDate(u.updatedAt),
      patientProfile: u.patientProfile,
      doctorProfile: u.doctorProfile,
    }));
  }

  const db = getPreviewDb();
  let users = db.users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    patientProfile: db.patientProfiles.find((p) => p.userId === u.id) ?? null,
    doctorProfile: db.doctorProfiles.find((d) => d.userId === u.id) ?? null,
  }));

  if (filters?.role) users = users.filter((u) => u.role === filters.role);
  if (filters?.status) users = users.filter((u) => u.status === filters.status);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    users = users.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }
  return users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUserById(id: string): Promise<UserDTO | null> {
  if (isDatabaseConfigured()) {
    const u = await prisma.user.findUnique({
      where: { id },
      include: { patientProfile: true, doctorProfile: true },
    });
    if (!u) return null;
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: serializeDate(u.createdAt),
      updatedAt: serializeDate(u.updatedAt),
      patientProfile: u.patientProfile,
      doctorProfile: u.doctorProfile,
    };
  }

  const db = getPreviewDb();
  const u = db.users.find((x) => x.id === id);
  if (!u) return null;
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    patientProfile: db.patientProfiles.find((p) => p.userId === u.id) ?? null,
    doctorProfile: db.doctorProfiles.find((d) => d.userId === u.id) ?? null,
  };
}

export async function createUserAccount(input: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  specialization?: string;
  licenseNumber?: string;
  department?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
}): Promise<UserDTO> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(normalizedEmail);
  if (existing) {
    throw new ConflictError('An account with this email address already exists.');
  }
  const passwordHash = await bcrypt.hash(input.password, 10);

  if (isDatabaseConfigured()) {
    const created = await prisma.user.create({
      data: {
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: input.role,
        status: input.status ?? 'ACTIVE',
        ...(input.role === 'PATIENT'
          ? {
              patientProfile: {
                create: {
                  dateOfBirth: input.dateOfBirth || null,
                  gender: input.gender || null,
                  bloodGroup: input.bloodGroup || null,
                  phone: input.phone || null,
                },
              },
            }
          : {}),
        ...(input.role === 'DOCTOR'
          ? {
              doctorProfile: {
                create: {
                  specialization: input.specialization || 'General Practice',
                  licenseNumber: input.licenseNumber || `MD-${Math.floor(100000 + Math.random() * 899999)}`,
                  department: input.department || 'Outpatient Clinical Care',
                  phone: input.phone || null,
                  availability: 'Mon - Fri, 09:00 - 17:00',
                  consultationFee: 150,
                },
              },
            }
          : {}),
      },
      include: { patientProfile: true, doctorProfile: true },
    });
    return {
      id: created.id,
      fullName: created.fullName,
      email: created.email,
      role: created.role,
      status: created.status,
      createdAt: serializeDate(created.createdAt),
      updatedAt: serializeDate(created.updatedAt),
      patientProfile: created.patientProfile,
      doctorProfile: created.doctorProfile,
    };
  }

  const db = getPreviewDb();
  const now = new Date().toISOString();
  const userId = makeId('usr');
  db.users.push({
    id: userId,
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    role: input.role,
    status: input.status ?? 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  });

  let patientProfile: PatientProfileDTO | null = null;
  let doctorProfile: DoctorProfileDTO | null = null;

  if (input.role === 'PATIENT') {
    patientProfile = {
      id: makeId('pat_prof'),
      userId,
      dateOfBirth: input.dateOfBirth || null,
      gender: input.gender || null,
      bloodGroup: input.bloodGroup || null,
      phone: input.phone || null,
      address: null,
      emergencyContact: null,
      insuranceNumber: null,
    };
    db.patientProfiles.push(patientProfile);
  } else if (input.role === 'DOCTOR') {
    doctorProfile = {
      id: makeId('doc_prof'),
      userId,
      specialization: input.specialization || 'General Practice',
      licenseNumber: input.licenseNumber || `MD-${Math.floor(100000 + Math.random() * 899999)}`,
      department: input.department || 'Outpatient Clinical Care',
      phone: input.phone || null,
      bio: null,
      availability: 'Mon - Fri, 09:00 - 17:00',
      consultationFee: 150,
    };
    db.doctorProfiles.push(doctorProfile);
  }

  persistPreviewDb(db);
  return {
    id: userId,
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    role: input.role,
    status: input.status ?? 'ACTIVE',
    createdAt: now,
    updatedAt: now,
    patientProfile,
    doctorProfile,
  };
}

export async function updateUserAccount(
  id: string,
  input: {
    fullName?: string;
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    password?: string;
    specialization?: string;
    licenseNumber?: string;
    department?: string;
    phone?: string;
    bio?: string;
    availability?: string;
    consultationFee?: number;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    address?: string;
    emergencyContact?: string;
    insuranceNumber?: string;
  }
): Promise<UserDTO> {
  const existing = await getUserById(id);
  if (!existing) throw new NotFoundError('User not found.');

  if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
    const clash = await findAuthUserByEmail(input.email);
    if (clash && clash.id !== id) {
      throw new ConflictError('Another user already uses that email address.');
    }
  }

  const passwordHash =
    input.password && input.password.trim().length > 0
      ? await bcrypt.hash(input.password, 10)
      : undefined;

  if (isDatabaseConfigured()) {
    const targetRole = input.role ?? existing.role;
    await prisma.user.update({
      where: { id },
      data: {
        ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
        ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    if (targetRole === 'PATIENT') {
      await prisma.patientProfile.upsert({
        where: { userId: id },
        update: {
          ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth || null } : {}),
          ...(input.gender !== undefined ? { gender: input.gender || null } : {}),
          ...(input.bloodGroup !== undefined ? { bloodGroup: input.bloodGroup || null } : {}),
          ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
          ...(input.address !== undefined ? { address: input.address || null } : {}),
          ...(input.emergencyContact !== undefined ? { emergencyContact: input.emergencyContact || null } : {}),
          ...(input.insuranceNumber !== undefined ? { insuranceNumber: input.insuranceNumber || null } : {}),
        },
        create: {
          userId: id,
          dateOfBirth: input.dateOfBirth || null,
          gender: input.gender || null,
          bloodGroup: input.bloodGroup || null,
          phone: input.phone || null,
          address: input.address || null,
          emergencyContact: input.emergencyContact || null,
          insuranceNumber: input.insuranceNumber || null,
        },
      });
    } else if (targetRole === 'DOCTOR') {
      await prisma.doctorProfile.upsert({
        where: { userId: id },
        update: {
          ...(input.specialization !== undefined ? { specialization: input.specialization } : {}),
          ...(input.licenseNumber !== undefined ? { licenseNumber: input.licenseNumber } : {}),
          ...(input.department !== undefined ? { department: input.department || null } : {}),
          ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
          ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
          ...(input.availability !== undefined ? { availability: input.availability || null } : {}),
          ...(input.consultationFee !== undefined ? { consultationFee: input.consultationFee } : {}),
        },
        create: {
          userId: id,
          specialization: input.specialization || 'General Practice',
          licenseNumber: input.licenseNumber || `MD-${Math.floor(100000 + Math.random() * 899999)}`,
          department: input.department || null,
          phone: input.phone || null,
          bio: input.bio || null,
          availability: input.availability || null,
          consultationFee: input.consultationFee ?? 150,
        },
      });
    }

    const updated = await getUserById(id);
    if (!updated) throw new NotFoundError('User not found after update.');
    return updated;
  }

  const db = getPreviewDb();
  const userIdx = db.users.findIndex((u) => u.id === id);
  if (userIdx === -1) throw new NotFoundError('User not found.');
  const now = new Date().toISOString();
  const targetRole = input.role ?? db.users[userIdx].role;

  db.users[userIdx] = {
    ...db.users[userIdx],
    fullName: input.fullName ? input.fullName.trim() : db.users[userIdx].fullName,
    email: input.email ? input.email.trim().toLowerCase() : db.users[userIdx].email,
    role: targetRole,
    status: input.status ?? db.users[userIdx].status,
    passwordHash: passwordHash ?? db.users[userIdx].passwordHash,
    updatedAt: now,
  };

  if (targetRole === 'PATIENT') {
    const pIdx = db.patientProfiles.findIndex((p) => p.userId === id);
    const base: PatientProfileDTO =
      pIdx >= 0
        ? db.patientProfiles[pIdx]
        : { id: makeId('pat_prof'), userId: id };
    const updatedProf: PatientProfileDTO = {
      ...base,
      ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth || null } : {}),
      ...(input.gender !== undefined ? { gender: input.gender || null } : {}),
      ...(input.bloodGroup !== undefined ? { bloodGroup: input.bloodGroup || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.address !== undefined ? { address: input.address || null } : {}),
      ...(input.emergencyContact !== undefined ? { emergencyContact: input.emergencyContact || null } : {}),
      ...(input.insuranceNumber !== undefined ? { insuranceNumber: input.insuranceNumber || null } : {}),
    };
    if (pIdx >= 0) db.patientProfiles[pIdx] = updatedProf;
    else db.patientProfiles.push(updatedProf);
  } else if (targetRole === 'DOCTOR') {
    const dIdx = db.doctorProfiles.findIndex((d) => d.userId === id);
    const base: DoctorProfileDTO =
      dIdx >= 0
        ? db.doctorProfiles[dIdx]
        : {
            id: makeId('doc_prof'),
            userId: id,
            specialization: 'General Practice',
            licenseNumber: `MD-${Math.floor(100000 + Math.random() * 899999)}`,
          };
    const updatedDoc: DoctorProfileDTO = {
      ...base,
      ...(input.specialization !== undefined ? { specialization: input.specialization } : {}),
      ...(input.licenseNumber !== undefined ? { licenseNumber: input.licenseNumber } : {}),
      ...(input.department !== undefined ? { department: input.department || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
      ...(input.availability !== undefined ? { availability: input.availability || null } : {}),
      ...(input.consultationFee !== undefined ? { consultationFee: input.consultationFee } : {}),
    };
    if (dIdx >= 0) db.doctorProfiles[dIdx] = updatedDoc;
    else db.doctorProfiles.push(updatedDoc);
  }

  persistPreviewDb(db);
  return (await getUserById(id))!;
}

export async function deleteUserAccount(id: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('User not found.');
    await prisma.user.delete({ where: { id } });
    return;
  }

  const db = getPreviewDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) throw new NotFoundError('User not found.');
  db.users.splice(idx, 1);
  db.patientProfiles = db.patientProfiles.filter((p) => p.userId !== id);
  db.doctorProfiles = db.doctorProfiles.filter((d) => d.userId !== id);
  db.appointments = db.appointments.filter((a) => a.patientId !== id && a.doctorId !== id);
  db.medicalRecords = db.medicalRecords.filter((r) => r.patientId !== id && r.doctorId !== id);
  db.allergies = db.allergies.filter((a) => a.patientId !== id);
  db.prescriptions = db.prescriptions.filter((p) => p.patientId !== id && p.doctorId !== id);
  db.labReports = db.labReports.filter((l) => l.patientId !== id && l.doctorId !== id);
  persistPreviewDb(db);
}

// ---------- APPOINTMENTS ----------

export async function listAppointments(filters?: {
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
}): Promise<AppointmentDTO[]> {
  if (isDatabaseConfigured()) {
    const rows = await prisma.appointment.findMany({
      where: {
        ...(filters?.patientId ? { patientId: filters.patientId } : {}),
        ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            doctorProfile: true,
          },
        },
      },
      orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'asc' }],
    });
    return rows.map((r) => ({
      ...r,
      createdAt: serializeDate(r.createdAt),
      updatedAt: serializeDate(r.updatedAt),
    }));
  }

  const db = getPreviewDb();
  let rows = db.appointments;
  if (filters?.patientId) rows = rows.filter((a) => a.patientId === filters.patientId);
  if (filters?.doctorId) rows = rows.filter((a) => a.doctorId === filters.doctorId);
  if (filters?.status) rows = rows.filter((a) => a.status === filters.status);

  return rows
    .map((a) => {
      const patient = db.users.find((u) => u.id === a.patientId);
      const doctor = db.users.find((u) => u.id === a.doctorId);
      const doctorProfile = db.doctorProfiles.find((d) => d.userId === a.doctorId) ?? null;
      return {
        ...a,
        patient: patient ? { id: patient.id, fullName: patient.fullName, email: patient.email } : null,
        doctor: doctor
          ? { id: doctor.id, fullName: doctor.fullName, email: doctor.email, doctorProfile }
          : null,
      };
    })
    .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate) || a.appointmentTime.localeCompare(b.appointmentTime));
}

export async function getAppointmentById(id: string): Promise<AppointmentDTO | null> {
  if (isDatabaseConfigured()) {
    const r = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true, doctorProfile: true } },
      },
    });
    if (!r) return null;
    return { ...r, createdAt: serializeDate(r.createdAt), updatedAt: serializeDate(r.updatedAt) };
  }

  const list = await listAppointments();
  return list.find((a) => a.id === id) ?? null;
}

export async function createAppointment(input: {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  notes?: string;
}): Promise<AppointmentDTO> {
  if (isDatabaseConfigured()) {
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: input.doctorId,
        appointmentDate: input.appointmentDate,
        appointmentTime: input.appointmentTime,
        status: { not: 'CANCELLED' },
      },
    });
    if (conflict) {
      throw new ConflictError(
        `This doctor already has an active appointment on ${input.appointmentDate} at ${input.appointmentTime}. Please select another time slot.`
      );
    }
    const created = await prisma.appointment.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointmentDate: input.appointmentDate,
        appointmentTime: input.appointmentTime,
        reason: input.reason.trim(),
        notes: input.notes?.trim() || null,
        status: 'PENDING',
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true, doctorProfile: true } },
      },
    });
    return {
      ...created,
      createdAt: serializeDate(created.createdAt),
      updatedAt: serializeDate(created.updatedAt),
    };
  }

  const db = getPreviewDb();
  const conflict = db.appointments.find(
    (a) =>
      a.doctorId === input.doctorId &&
      a.appointmentDate === input.appointmentDate &&
      a.appointmentTime === input.appointmentTime &&
      a.status !== 'CANCELLED'
  );
  if (conflict) {
    throw new ConflictError(
      `This doctor already has an active appointment on ${input.appointmentDate} at ${input.appointmentTime}. Please select another time slot.`
    );
  }
  const now = new Date().toISOString();
  const created = {
    id: makeId('apt'),
    patientId: input.patientId,
    doctorId: input.doctorId,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    reason: input.reason.trim(),
    status: 'PENDING' as AppointmentStatus,
    notes: input.notes?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
  db.appointments.push(created);
  persistPreviewDb(db);
  return (await getAppointmentById(created.id))!;
}

export async function updateAppointment(
  id: string,
  input: {
    status?: AppointmentStatus;
    appointmentDate?: string;
    appointmentTime?: string;
    reason?: string;
    notes?: string;
  }
): Promise<AppointmentDTO> {
  const existing = await getAppointmentById(id);
  if (!existing) throw new NotFoundError('Appointment not found.');

  const targetDate = input.appointmentDate ?? existing.appointmentDate;
  const targetTime = input.appointmentTime ?? existing.appointmentTime;
  const targetStatus = input.status ?? existing.status;

  if (targetStatus !== 'CANCELLED') {
    if (isDatabaseConfigured()) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          doctorId: existing.doctorId,
          appointmentDate: targetDate,
          appointmentTime: targetTime,
          status: { not: 'CANCELLED' },
        },
      });
      if (conflict) {
        throw new ConflictError(
          `Double booking prevented: slot ${targetDate} at ${targetTime} is already reserved.`
        );
      }
    } else {
      const db = getPreviewDb();
      const conflict = db.appointments.find(
        (a) =>
          a.id !== id &&
          a.doctorId === existing.doctorId &&
          a.appointmentDate === targetDate &&
          a.appointmentTime === targetTime &&
          a.status !== 'CANCELLED'
      );
      if (conflict) {
        throw new ConflictError(
          `Double booking prevented: slot ${targetDate} at ${targetTime} is already reserved.`
        );
      }
    }
  }

  if (isDatabaseConfigured()) {
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.appointmentDate ? { appointmentDate: input.appointmentDate } : {}),
        ...(input.appointmentTime ? { appointmentTime: input.appointmentTime } : {}),
        ...(input.reason ? { reason: input.reason.trim() } : {}),
        ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true, doctorProfile: true } },
      },
    });
    return {
      ...updated,
      createdAt: serializeDate(updated.createdAt),
      updatedAt: serializeDate(updated.updatedAt),
    };
  }

  const db = getPreviewDb();
  const idx = db.appointments.findIndex((a) => a.id === id);
  if (idx === -1) throw new NotFoundError('Appointment not found.');
  db.appointments[idx] = {
    ...db.appointments[idx],
    ...(input.status ? { status: input.status } : {}),
    ...(input.appointmentDate ? { appointmentDate: input.appointmentDate } : {}),
    ...(input.appointmentTime ? { appointmentTime: input.appointmentTime } : {}),
    ...(input.reason ? { reason: input.reason.trim() } : {}),
    ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
    updatedAt: new Date().toISOString(),
  };
  persistPreviewDb(db);
  return (await getAppointmentById(id))!;
}

export async function deleteAppointment(id: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Appointment not found.');
    await prisma.appointment.delete({ where: { id } });
    return;
  }
  const db = getPreviewDb();
  const idx = db.appointments.findIndex((a) => a.id === id);
  if (idx === -1) throw new NotFoundError('Appointment not found.');
  db.appointments.splice(idx, 1);
  persistPreviewDb(db);
}

// ---------- MEDICAL RECORDS ----------

export async function listMedicalRecords(filters?: {
  patientId?: string;
  doctorId?: string;
}): Promise<MedicalRecordDTO[]> {
  if (isDatabaseConfigured()) {
    const rows = await prisma.medicalRecord.findMany({
      where: {
        ...(filters?.patientId ? { patientId: filters.patientId } : {}),
        ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}),
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { recordDate: 'desc' },
    });
    return rows.map((r) => ({ ...r, createdAt: serializeDate(r.createdAt), updatedAt: serializeDate(r.updatedAt) }));
  }

  const db = getPreviewDb();
  let rows = db.medicalRecords;
  if (filters?.patientId) rows = rows.filter((r) => r.patientId === filters.patientId);
  if (filters?.doctorId) rows = rows.filter((r) => r.doctorId === filters.doctorId);

  return rows
    .map((r) => {
      const patient = db.users.find((u) => u.id === r.patientId);
      const doctor = db.users.find((u) => u.id === r.doctorId);
      return {
        ...r,
        patient: patient ? { id: patient.id, fullName: patient.fullName, email: patient.email } : null,
        doctor: doctor ? { id: doctor.id, fullName: doctor.fullName, email: doctor.email } : null,
      };
    })
    .sort((a, b) => b.recordDate.localeCompare(a.recordDate));
}

export async function createMedicalRecord(input: {
  patientId: string;
  doctorId: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes?: string;
  recordDate: string;
}): Promise<MedicalRecordDTO> {
  if (isDatabaseConfigured()) {
    const created = await prisma.medicalRecord.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        diagnosis: input.diagnosis.trim(),
        symptoms: input.symptoms.trim(),
        treatment: input.treatment.trim(),
        notes: input.notes?.trim() || null,
        recordDate: input.recordDate,
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true } },
      },
    });
    return { ...created, createdAt: serializeDate(created.createdAt), updatedAt: serializeDate(created.updatedAt) };
  }

  const db = getPreviewDb();
  const now = new Date().toISOString();
  const created = {
    id: makeId('rec'),
    patientId: input.patientId,
    doctorId: input.doctorId,
    diagnosis: input.diagnosis.trim(),
    symptoms: input.symptoms.trim(),
    treatment: input.treatment.trim(),
    notes: input.notes?.trim() || null,
    recordDate: input.recordDate,
    createdAt: now,
    updatedAt: now,
  };
  db.medicalRecords.push(created);
  persistPreviewDb(db);
  const all = await listMedicalRecords();
  return all.find((r) => r.id === created.id)!;
}

export async function deleteMedicalRecord(id: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const existing = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Medical record not found.');
    await prisma.medicalRecord.delete({ where: { id } });
    return;
  }
  const db = getPreviewDb();
  const idx = db.medicalRecords.findIndex((r) => r.id === id);
  if (idx === -1) throw new NotFoundError('Medical record not found.');
  db.medicalRecords.splice(idx, 1);
  persistPreviewDb(db);
}

// ---------- ALLERGIES ----------

export async function listAllergies(filters?: {
  patientId?: string;
  doctorId?: string;
}): Promise<AllergyDTO[]> {
  if (isDatabaseConfigured()) {
    const rows = await prisma.allergy.findMany({
      where: {
        ...(filters?.patientId ? { patientId: filters.patientId } : {}),
        ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}),
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({ ...r, createdAt: serializeDate(r.createdAt), updatedAt: serializeDate(r.updatedAt) }));
  }

  const db = getPreviewDb();
  let rows = db.allergies;
  if (filters?.patientId) rows = rows.filter((a) => a.patientId === filters.patientId);
  if (filters?.doctorId) rows = rows.filter((a) => a.doctorId === filters.doctorId);

  return rows
    .map((a) => {
      const patient = db.users.find((u) => u.id === a.patientId);
      const doctor = a.doctorId ? db.users.find((u) => u.id === a.doctorId) : null;
      return {
        ...a,
        patient: patient ? { id: patient.id, fullName: patient.fullName, email: patient.email } : null,
        doctor: doctor ? { id: doctor.id, fullName: doctor.fullName, email: doctor.email } : null,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAllergy(input: {
  patientId: string;
  doctorId?: string;
  allergyName: string;
  severity: AllergySeverity;
  reaction?: string;
  notes?: string;
  diagnosedDate?: string;
}): Promise<AllergyDTO> {
  if (isDatabaseConfigured()) {
    const created = await prisma.allergy.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId || null,
        allergyName: input.allergyName.trim(),
        severity: input.severity,
        reaction: input.reaction?.trim() || null,
        notes: input.notes?.trim() || null,
        diagnosedDate: input.diagnosedDate || new Date().toISOString().slice(0, 10),
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true } },
      },
    });
    return { ...created, createdAt: serializeDate(created.createdAt), updatedAt: serializeDate(created.updatedAt) };
  }

  const db = getPreviewDb();
  const now = new Date().toISOString();
  const created = {
    id: makeId('alg'),
    patientId: input.patientId,
    doctorId: input.doctorId || null,
    allergyName: input.allergyName.trim(),
    severity: input.severity,
    reaction: input.reaction?.trim() || null,
    notes: input.notes?.trim() || null,
    diagnosedDate: input.diagnosedDate || now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };
  db.allergies.push(created);
  persistPreviewDb(db);
  const all = await listAllergies();
  return all.find((a) => a.id === created.id)!;
}

export async function deleteAllergy(id: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const existing = await prisma.allergy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Allergy record not found.');
    await prisma.allergy.delete({ where: { id } });
    return;
  }
  const db = getPreviewDb();
  const idx = db.allergies.findIndex((a) => a.id === id);
  if (idx === -1) throw new NotFoundError('Allergy record not found.');
  db.allergies.splice(idx, 1);
  persistPreviewDb(db);
}

// ---------- PRESCRIPTIONS ----------

export async function listPrescriptions(filters?: {
  patientId?: string;
  doctorId?: string;
}): Promise<PrescriptionDTO[]> {
  if (isDatabaseConfigured()) {
    const rows = await prisma.prescription.findMany({
      where: {
        ...(filters?.patientId ? { patientId: filters.patientId } : {}),
        ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}),
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true, doctorProfile: true } },
      },
      orderBy: { prescribedDate: 'desc' },
    });
    return rows.map((r) => ({ ...r, createdAt: serializeDate(r.createdAt), updatedAt: serializeDate(r.updatedAt) }));
  }

  const db = getPreviewDb();
  let rows = db.prescriptions;
  if (filters?.patientId) rows = rows.filter((p) => p.patientId === filters.patientId);
  if (filters?.doctorId) rows = rows.filter((p) => p.doctorId === filters.doctorId);

  return rows
    .map((p) => {
      const patient = db.users.find((u) => u.id === p.patientId);
      const doctor = db.users.find((u) => u.id === p.doctorId);
      const doctorProfile = db.doctorProfiles.find((d) => d.userId === p.doctorId) ?? null;
      return {
        ...p,
        patient: patient ? { id: patient.id, fullName: patient.fullName, email: patient.email } : null,
        doctor: doctor
          ? { id: doctor.id, fullName: doctor.fullName, email: doctor.email, doctorProfile }
          : null,
      };
    })
    .sort((a, b) => b.prescribedDate.localeCompare(a.prescribedDate));
}

export async function getPrescriptionById(id: string): Promise<PrescriptionDTO | null> {
  const rows = await listPrescriptions();
  return rows.find((p) => p.id === id) ?? null;
}

export async function createPrescription(input: {
  patientId: string;
  doctorId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  prescribedDate: string;
}): Promise<PrescriptionDTO> {
  if (isDatabaseConfigured()) {
    const created = await prisma.prescription.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        medicineName: input.medicineName.trim(),
        dosage: input.dosage.trim(),
        frequency: input.frequency.trim(),
        duration: input.duration.trim(),
        instructions: input.instructions?.trim() || null,
        prescribedDate: input.prescribedDate,
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true, doctorProfile: true } },
      },
    });
    return { ...created, createdAt: serializeDate(created.createdAt), updatedAt: serializeDate(created.updatedAt) };
  }

  const db = getPreviewDb();
  const now = new Date().toISOString();
  const created = {
    id: makeId('prx'),
    patientId: input.patientId,
    doctorId: input.doctorId,
    medicineName: input.medicineName.trim(),
    dosage: input.dosage.trim(),
    frequency: input.frequency.trim(),
    duration: input.duration.trim(),
    instructions: input.instructions?.trim() || null,
    prescribedDate: input.prescribedDate,
    createdAt: now,
    updatedAt: now,
  };
  db.prescriptions.push(created);
  persistPreviewDb(db);
  return (await getPrescriptionById(created.id))!;
}

export async function deletePrescription(id: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Prescription not found.');
    await prisma.prescription.delete({ where: { id } });
    return;
  }
  const db = getPreviewDb();
  const idx = db.prescriptions.findIndex((p) => p.id === id);
  if (idx === -1) throw new NotFoundError('Prescription not found.');
  db.prescriptions.splice(idx, 1);
  persistPreviewDb(db);
}

// ---------- LAB REPORTS & UPLOADED FILES ----------

export async function createUploadedFileRecord(input: {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  patientId?: string | null;
  category?: string;
  localPath?: string | null;
}): Promise<UploadedFileDTO & { localPath?: string | null }> {
  if (isDatabaseConfigured()) {
    const created = await prisma.uploadedFile.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        fileSize: input.fileSize,
        uploadedById: input.uploadedById,
        patientId: input.patientId || null,
        category: input.category || 'LAB_REPORT',
      },
    });
    return {
      ...created,
      createdAt: serializeDate(created.createdAt),
    };
  }

  const db = getPreviewDb();
  const created = {
    id: input.id || makeId('file'),
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    fileType: input.fileType,
    fileSize: input.fileSize,
    uploadedById: input.uploadedById,
    patientId: input.patientId || null,
    category: input.category || 'LAB_REPORT',
    localPath: input.localPath || null,
    createdAt: new Date().toISOString(),
  };
  db.uploadedFiles.push(created);
  persistPreviewDb(db);
  return created;
}

export async function getUploadedFileById(id: string): Promise<(UploadedFileDTO & { localPath?: string | null }) | null> {
  if (isDatabaseConfigured()) {
    const f = await prisma.uploadedFile.findUnique({ where: { id } });
    if (!f) return null;
    return { ...f, createdAt: serializeDate(f.createdAt) };
  }
  const db = getPreviewDb();
  return db.uploadedFiles.find((f) => f.id === id) ?? null;
}

export async function listLabReports(filters?: {
  patientId?: string;
  doctorId?: string;
}): Promise<LabReportDTO[]> {
  if (isDatabaseConfigured()) {
    const rows = await prisma.labReport.findMany({
      where: {
        ...(filters?.patientId ? { patientId: filters.patientId } : {}),
        ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}),
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { reportDate: 'desc' },
    });
    return rows.map((r) => ({ ...r, createdAt: serializeDate(r.createdAt), updatedAt: serializeDate(r.updatedAt) }));
  }

  const db = getPreviewDb();
  let rows = db.labReports;
  if (filters?.patientId) rows = rows.filter((l) => l.patientId === filters.patientId);
  if (filters?.doctorId) rows = rows.filter((l) => l.doctorId === filters.doctorId);

  return rows
    .map((l) => {
      const patient = db.users.find((u) => u.id === l.patientId);
      const doctor = db.users.find((u) => u.id === l.doctorId);
      return {
        ...l,
        patient: patient ? { id: patient.id, fullName: patient.fullName, email: patient.email } : null,
        doctor: doctor ? { id: doctor.id, fullName: doctor.fullName, email: doctor.email } : null,
      };
    })
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
}

export async function getLabReportById(id: string): Promise<LabReportDTO | null> {
  const rows = await listLabReports();
  return rows.find((r) => r.id === id) ?? null;
}

export async function createLabReport(input: {
  patientId: string;
  doctorId: string;
  reportTitle: string;
  reportType: string;
  reportDate: string;
  notes?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  uploadedFileId?: string;
}): Promise<LabReportDTO> {
  if (isDatabaseConfigured()) {
    const created = await prisma.labReport.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        reportTitle: input.reportTitle.trim(),
        reportType: input.reportType.trim(),
        reportDate: input.reportDate,
        notes: input.notes?.trim() || null,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize ?? null,
        uploadedFileId: input.uploadedFileId || null,
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { select: { id: true, fullName: true, email: true } },
      },
    });
    return { ...created, createdAt: serializeDate(created.createdAt), updatedAt: serializeDate(created.updatedAt) };
  }

  const db = getPreviewDb();
  const now = new Date().toISOString();
  const created = {
    id: makeId('lab'),
    patientId: input.patientId,
    doctorId: input.doctorId,
    reportTitle: input.reportTitle.trim(),
    reportType: input.reportType.trim(),
    reportDate: input.reportDate,
    notes: input.notes?.trim() || null,
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    fileType: input.fileType,
    fileSize: input.fileSize ?? null,
    uploadedFileId: input.uploadedFileId || null,
    createdAt: now,
    updatedAt: now,
  };
  db.labReports.push(created);
  persistPreviewDb(db);
  return (await getLabReportById(created.id))!;
}

export async function deleteLabReport(id: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const existing = await prisma.labReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Lab report not found.');
    await prisma.labReport.delete({ where: { id } });
    return;
  }
  const db = getPreviewDb();
  const idx = db.labReports.findIndex((l) => l.id === id);
  if (idx === -1) throw new NotFoundError('Lab report not found.');
  db.labReports.splice(idx, 1);
  persistPreviewDb(db);
}

// ---------- AGGREGATES & SUMMARIES ----------

export async function getSystemStats(): Promise<SystemStatsDTO> {
  const [users, appointments, records, allergies, prescriptions, labReports] = await Promise.all([
    listUsers(),
    listAppointments(),
    listMedicalRecords(),
    listAllergies(),
    listPrescriptions(),
    listLabReports(),
  ]);

  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'ACTIVE').length,
    totalDoctors: users.filter((u) => u.role === 'DOCTOR').length,
    totalPatients: users.filter((u) => u.role === 'PATIENT').length,
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter((a) => a.status === 'PENDING').length,
    confirmedAppointments: appointments.filter((a) => a.status === 'CONFIRMED').length,
    completedAppointments: appointments.filter((a) => a.status === 'COMPLETED').length,
    totalRecords: records.length,
    totalAllergies: allergies.length,
    totalPrescriptions: prescriptions.length,
    totalLabReports: labReports.length,
  };
}

export async function getDoctorAssignedPatients(doctorId: string): Promise<UserDTO[]> {
  const [allPatients, appointments, records, prescriptions, labReports] = await Promise.all([
    listUsers({ role: 'PATIENT' }),
    listAppointments({ doctorId }),
    listMedicalRecords({ doctorId }),
    listPrescriptions({ doctorId }),
    listLabReports({ doctorId }),
  ]);

  const patientIds = new Set<string>();
  appointments.forEach((a) => patientIds.add(a.patientId));
  records.forEach((r) => patientIds.add(r.patientId));
  prescriptions.forEach((p) => patientIds.add(p.patientId));
  labReports.forEach((l) => patientIds.add(l.patientId));

  // Include all active patients if doctor is viewing directory, or filter to assigned
  // Return assigned patients first; if none yet, return empty array
  return allPatients.filter((p) => patientIds.has(p.id));
}

export async function getPatientMedicalSummary(patientId: string) {
  const [patient, appointments, records, allergies, prescriptions, labReports] = await Promise.all([
    getUserById(patientId),
    listAppointments({ patientId }),
    listMedicalRecords({ patientId }),
    listAllergies({ patientId }),
    listPrescriptions({ patientId }),
    listLabReports({ patientId }),
  ]);

  if (!patient || patient.role !== 'PATIENT') {
    return null;
  }

  return {
    patient,
    appointments,
    records,
    allergies,
    prescriptions,
    labReports,
  };
}
