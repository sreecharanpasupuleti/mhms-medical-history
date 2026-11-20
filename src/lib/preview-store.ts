import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type {
  AllergySeverity,
  AppointmentStatus,
  DoctorProfileDTO,
  PatientProfileDTO,
  UserRole,
  UserStatus,
} from '@/types';

export interface PreviewUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewMedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes?: string | null;
  recordDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewAllergy {
  id: string;
  patientId: string;
  doctorId?: string | null;
  allergyName: string;
  severity: AllergySeverity;
  reaction?: string | null;
  notes?: string | null;
  diagnosedDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewPrescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
  prescribedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewLabReport {
  id: string;
  patientId: string;
  doctorId: string;
  reportTitle: string;
  reportType: string;
  reportDate: string;
  notes?: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number | null;
  uploadedFileId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewUploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  patientId?: string | null;
  category: string;
  localPath?: string | null;
  createdAt: string;
}

export interface PreviewDbState {
  users: PreviewUser[];
  patientProfiles: PatientProfileDTO[];
  doctorProfiles: DoctorProfileDTO[];
  appointments: PreviewAppointment[];
  medicalRecords: PreviewMedicalRecord[];
  allergies: PreviewAllergy[];
  prescriptions: PreviewPrescription[];
  labReports: PreviewLabReport[];
  uploadedFiles: PreviewUploadedFile[];
}

const DB_FILE = path.resolve(process.cwd(), '.mhms-preview-db.json');

const globalStore = globalThis as unknown as {
  __mhmsPreviewDb?: PreviewDbState;
};

function buildInitialState(): PreviewDbState {
  const now = new Date().toISOString();
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const doctorHash = bcrypt.hashSync('Doctor@123', 10);
  const patientHash = bcrypt.hashSync('Patient@123', 10);

  return {
    users: [
      {
        id: 'usr_admin_1',
        fullName: 'Marcus Vance',
        email: 'admin@mhms.com',
        passwordHash: adminHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_doc_1',
        fullName: 'Dr. Evelyn Reed',
        email: 'doctor1@example.com',
        passwordHash: doctorHash,
        role: 'DOCTOR',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_doc_2',
        fullName: 'Dr. Arjun Mehta',
        email: 'doctor2@example.com',
        passwordHash: doctorHash,
        role: 'DOCTOR',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_pat_1',
        fullName: 'Claire Bennett',
        email: 'patient1@example.com',
        passwordHash: patientHash,
        role: 'PATIENT',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_pat_2',
        fullName: 'David Kowalski',
        email: 'patient2@example.com',
        passwordHash: patientHash,
        role: 'PATIENT',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
    ],
    doctorProfiles: [
      {
        id: 'doc_prof_1',
        userId: 'usr_doc_1',
        specialization: 'Internal Medicine',
        licenseNumber: 'MD-482910',
        department: 'Internal Medicine & Primary Care',
        phone: '+1 (555) 234-8910',
        bio: 'Board-certified internist focusing on preventive diagnostics, chronic condition management, and longitudinal care.',
        availability: 'Mon - Fri, 08:30 - 17:00',
        consultationFee: 150,
      },
      {
        id: 'doc_prof_2',
        userId: 'usr_doc_2',
        specialization: 'Cardiology',
        licenseNumber: 'MD-719344',
        department: 'Cardiovascular Diagnostics',
        phone: '+1 (555) 391-4420',
        bio: 'Preventive cardiologist specializing in hypertension, lipid management, and non-invasive cardiac imaging.',
        availability: 'Tue - Sat, 09:00 - 16:30',
        consultationFee: 210,
      },
    ],
    patientProfiles: [
      {
        id: 'pat_prof_1',
        userId: 'usr_pat_1',
        dateOfBirth: '1988-04-14',
        gender: 'Female',
        bloodGroup: 'A+',
        phone: '+1 (555) 842-1193',
        address: '742 Cedar Ridge Lane, Suite 4B, Portland, OR',
        emergencyContact: 'Thomas Bennett · +1 (555) 842-1199',
        insuranceNumber: 'MH-INS-904821',
      },
      {
        id: 'pat_prof_2',
        userId: 'usr_pat_2',
        dateOfBirth: '1979-11-02',
        gender: 'Male',
        bloodGroup: 'O-',
        phone: '+1 (555) 619-3304',
        address: '128 Harborview Ave, Seattle, WA',
        emergencyContact: 'Anna Kowalski · +1 (555) 619-3305',
        insuranceNumber: 'MH-INS-553109',
      },
    ],
    appointments: [
      {
        id: 'apt_1',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_1',
        appointmentDate: '2026-11-26',
        appointmentTime: '09:30',
        reason: 'Annual metabolic panel review and blood pressure follow-up',
        status: 'CONFIRMED',
        notes: 'Fasting 12 hours prior to lab draw.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'apt_2',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_2',
        appointmentDate: '2026-12-03',
        appointmentTime: '14:00',
        reason: 'Routine echocardiogram consultation',
        status: 'PENDING',
        notes: 'Patient requested afternoon slot.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'apt_3',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_1',
        appointmentDate: '2026-10-12',
        appointmentTime: '10:00',
        reason: 'Seasonal respiratory evaluation',
        status: 'COMPLETED',
        notes: 'Vitals stable, resolved without complications.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'apt_4',
        patientId: 'usr_pat_2',
        doctorId: 'usr_doc_2',
        appointmentDate: '2026-11-27',
        appointmentTime: '11:00',
        reason: 'Lipid profile review & medication titration',
        status: 'CONFIRMED',
        notes: 'Bring home blood pressure log.',
        createdAt: now,
        updatedAt: now,
      },
    ],
    medicalRecords: [
      {
        id: 'rec_1',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_1',
        diagnosis: 'Mild Iron-Deficiency Anemia',
        symptoms: 'Intermittent fatigue, mild exertional dyspnea over 4 weeks',
        treatment: 'Oral ferrous sulfate 325mg daily with vitamin C; dietary iron counseling',
        notes: 'Recheck ferritin and CBC in 8 weeks.',
        recordDate: '2026-10-12',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rec_2',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_2',
        diagnosis: 'Borderline Elevated Blood Pressure',
        symptoms: 'Asymptomatic; clinic reading 132/84 mmHg',
        treatment: 'DASH dietary modification, sodium restriction <2000mg/day, 150 min/wk aerobic exercise',
        notes: 'Home BP monitoring twice weekly.',
        recordDate: '2026-09-18',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rec_3',
        patientId: 'usr_pat_2',
        doctorId: 'usr_doc_2',
        diagnosis: 'Mixed Hyperlipidemia',
        symptoms: 'Routine preventive screening; LDL 162 mg/dL',
        treatment: 'Initiated Rosuvastatin 10mg nightly; repeat lipid panel in 12 weeks',
        notes: 'Liver enzymes within normal reference range.',
        recordDate: '2026-10-05',
        createdAt: now,
        updatedAt: now,
      },
    ],
    allergies: [
      {
        id: 'alg_1',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_1',
        allergyName: 'Penicillin V / Amoxicillin',
        severity: 'SEVERE',
        reaction: 'Generalized urticaria and angioedema',
        notes: 'Avoid all beta-lactam penicillins; use macrolides or fluoroquinolones if indicated.',
        diagnosedDate: '2019-06-22',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'alg_2',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_1',
        allergyName: 'Pollen (Birch & Ragweed)',
        severity: 'MILD',
        reaction: 'Seasonal allergic rhinitis',
        notes: 'Managed with OTC cetirizine PRN during spring/fall.',
        diagnosedDate: '2022-04-10',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'alg_3',
        patientId: 'usr_pat_2',
        doctorId: 'usr_doc_2',
        allergyName: 'Iodinated Contrast Media',
        severity: 'MODERATE',
        reaction: 'Flushing and localized hives',
        notes: 'Pre-medication protocol required prior to contrast CT imaging.',
        diagnosedDate: '2024-02-15',
        createdAt: now,
        updatedAt: now,
      },
    ],
    prescriptions: [
      {
        id: 'prx_1',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_1',
        medicineName: 'Ferrous Sulfate 325 mg',
        dosage: '325 mg (65 mg elemental iron)',
        frequency: 'Once daily',
        duration: '60 days',
        instructions: 'Take on an empty stomach with orange juice; avoid taking with calcium or dairy.',
        prescribedDate: '2026-10-12',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prx_2',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_1',
        medicineName: 'Cetirizine Hydrochloride',
        dosage: '10 mg',
        frequency: 'Once daily as needed',
        duration: '30 days',
        instructions: 'Take in the evening if mild drowsiness occurs.',
        prescribedDate: '2026-09-20',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prx_3',
        patientId: 'usr_pat_2',
        doctorId: 'usr_doc_2',
        medicineName: 'Rosuvastatin Calcium',
        dosage: '10 mg',
        frequency: 'Once daily at bedtime',
        duration: '90 days',
        instructions: 'Continue low-saturated-fat diet; report any unexplained muscle soreness.',
        prescribedDate: '2026-10-05',
        createdAt: now,
        updatedAt: now,
      },
    ],
    uploadedFiles: [
      {
        id: 'file_seed_1',
        fileName: 'claire-bennett-cbc-ferritin-2026.pdf',
        fileUrl: '/api/files/file_seed_1/download',
        fileType: 'application/pdf',
        fileSize: 1840,
        uploadedById: 'usr_doc_1',
        patientId: 'usr_pat_1',
        category: 'LAB_REPORT',
        localPath: null,
        createdAt: now,
      },
      {
        id: 'file_seed_2',
        fileName: 'david-kowalski-lipid-panel-2026.pdf',
        fileUrl: '/api/files/file_seed_2/download',
        fileType: 'application/pdf',
        fileSize: 1790,
        uploadedById: 'usr_doc_2',
        patientId: 'usr_pat_2',
        category: 'LAB_REPORT',
        localPath: null,
        createdAt: now,
      },
    ],
    labReports: [
      {
        id: 'lab_1',
        patientId: 'usr_pat_1',
        doctorId: 'usr_doc_1',
        reportTitle: 'Complete Blood Count (CBC) & Iron Panel',
        reportType: 'Hematology',
        reportDate: '2026-10-10',
        notes: 'Hemoglobin 11.4 g/dL, Ferritin 14 ng/mL. Consistent with mild iron deficiency.',
        fileUrl: '/api/files/file_seed_1/download',
        fileName: 'claire-bennett-cbc-ferritin-2026.pdf',
        fileType: 'application/pdf',
        fileSize: 1840,
        uploadedFileId: 'file_seed_1',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'lab_2',
        patientId: 'usr_pat_2',
        doctorId: 'usr_doc_2',
        reportTitle: 'Comprehensive Lipid & Hepatic Panel',
        reportType: 'Cardiometabolic',
        reportDate: '2026-10-03',
        notes: 'Total Cholesterol 238 mg/dL, LDL 162 mg/dL, HDL 48 mg/dL, Triglycerides 140 mg/dL.',
        fileUrl: '/api/files/file_seed_2/download',
        fileName: 'david-kowalski-lipid-panel-2026.pdf',
        fileType: 'application/pdf',
        fileSize: 1790,
        uploadedFileId: 'file_seed_2',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

export function getPreviewDb(): PreviewDbState {
  if (globalStore.__mhmsPreviewDb) {
    return globalStore.__mhmsPreviewDb;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PreviewDbState;
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        globalStore.__mhmsPreviewDb = parsed;
        return parsed;
      }
    }
  } catch {
    // Fall back to fresh seeded state if disk snapshot is unavailable or corrupt
  }
  const initial = buildInitialState();
  globalStore.__mhmsPreviewDb = initial;
  persistPreviewDb(initial);
  return initial;
}

export function persistPreviewDb(state: PreviewDbState): void {
  globalStore.__mhmsPreviewDb = state;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Ignore write failure on read-only serverless file systems
  }
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
