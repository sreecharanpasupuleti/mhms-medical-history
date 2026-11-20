import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  phone: z.string().optional(),
});

export const adminCreateUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(['ADMIN', 'DOCTOR', 'PATIENT']),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
});

export const adminUpdateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  role: z.enum(['ADMIN', 'DOCTOR', 'PATIENT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: z.string().min(8).max(100).optional().or(z.literal('')),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  availability: z.string().optional(),
  consultationFee: z.coerce.number().int().min(0).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  insuranceNumber: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().max(40).optional(),
  dateOfBirth: z.string().max(20).optional(),
  gender: z.string().max(30).optional(),
  bloodGroup: z.string().max(10).optional(),
  address: z.string().max(250).optional(),
  emergencyContact: z.string().max(120).optional(),
  insuranceNumber: z.string().max(80).optional(),
  specialization: z.string().max(120).optional(),
  licenseNumber: z.string().max(80).optional(),
  department: z.string().max(120).optional(),
  bio: z.string().max(1000).optional(),
  availability: z.string().max(120).optional(),
  consultationFee: z.coerce.number().int().min(0).max(50000).optional(),
});

export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1).optional(),
  doctorId: z.string().min(1, 'Please select a doctor'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format'),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM time format'),
  reason: z.string().trim().min(3, 'Please describe the reason for visit').max(500),
  notes: z.string().max(1000).optional(),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reason: z.string().trim().min(3).max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const medicalRecordSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  doctorId: z.string().min(1).optional(),
  diagnosis: z.string().trim().min(2, 'Diagnosis is required').max(300),
  symptoms: z.string().trim().min(2, 'Symptoms are required').max(1000),
  treatment: z.string().trim().min(2, 'Treatment plan is required').max(1500),
  notes: z.string().max(1500).optional(),
  recordDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format'),
});

export const allergySchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  doctorId: z.string().min(1).optional(),
  allergyName: z.string().trim().min(2, 'Allergy name is required').max(160),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  reaction: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
  diagnosedDate: z.string().optional(),
});

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  doctorId: z.string().min(1).optional(),
  medicineName: z.string().trim().min(2, 'Medicine name is required').max(200),
  dosage: z.string().trim().min(1, 'Dosage is required').max(100),
  frequency: z.string().trim().min(1, 'Frequency is required').max(120),
  duration: z.string().trim().min(1, 'Duration is required').max(100),
  instructions: z.string().max(1000).optional(),
  prescribedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format'),
});

export const labReportSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  doctorId: z.string().min(1).optional(),
  reportTitle: z.string().trim().min(2, 'Report title is required').max(200),
  reportType: z.string().trim().min(2, 'Report type is required').max(120),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format'),
  notes: z.string().max(1500).optional(),
  fileUrl: z.string().min(1, 'Uploaded file URL is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.coerce.number().int().nonnegative().optional(),
  uploadedFileId: z.string().optional(),
});

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const ALLOWED_UPLOAD_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.docx']);
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
