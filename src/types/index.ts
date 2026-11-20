export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export interface PatientProfileDTO {
  id: string;
  userId: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  insuranceNumber?: string | null;
}

export interface DoctorProfileDTO {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  department?: string | null;
  phone?: string | null;
  bio?: string | null;
  availability?: string | null;
  consultationFee?: number | null;
}

export interface UserDTO {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  patientProfile?: PatientProfileDTO | null;
  doctorProfile?: DoctorProfileDTO | null;
}

export interface AppointmentDTO {
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
  patient?: { id: string; fullName: string; email: string } | null;
  doctor?: {
    id: string;
    fullName: string;
    email: string;
    doctorProfile?: DoctorProfileDTO | null;
  } | null;
}

export interface MedicalRecordDTO {
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
  patient?: { id: string; fullName: string; email: string } | null;
  doctor?: { id: string; fullName: string; email: string } | null;
}

export interface AllergyDTO {
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
  patient?: { id: string; fullName: string; email: string } | null;
  doctor?: { id: string; fullName: string; email: string } | null;
}

export interface PrescriptionDTO {
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
  patient?: { id: string; fullName: string; email: string } | null;
  doctor?: {
    id: string;
    fullName: string;
    email: string;
    doctorProfile?: DoctorProfileDTO | null;
  } | null;
}

export interface LabReportDTO {
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
  patient?: { id: string; fullName: string; email: string } | null;
  doctor?: { id: string; fullName: string; email: string } | null;
}

export interface UploadedFileDTO {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  patientId?: string | null;
  category: string;
  createdAt: string;
}

export interface SystemStatsDTO {
  totalUsers: number;
  activeUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  totalRecords: number;
  totalAllergies: number;
  totalPrescriptions: number;
  totalLabReports: number;
}
