import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const doctorHash = await bcrypt.hash('Doctor@123', 10);
  const patientHash = await bcrypt.hash('Patient@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mhms.com' },
    update: {},
    create: {
      fullName: 'Marcus Vance',
      email: 'admin@mhms.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const doctor1 = await prisma.user.upsert({
    where: { email: 'doctor1@example.com' },
    update: {},
    create: {
      fullName: 'Dr. Evelyn Reed',
      email: 'doctor1@example.com',
      passwordHash: doctorHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      doctorProfile: {
        create: {
          specialization: 'Internal Medicine',
          licenseNumber: 'MD-482910',
          department: 'Internal Medicine & Primary Care',
          phone: '+1 (555) 234-8910',
          bio: 'Board-certified internist focusing on preventive diagnostics, chronic condition management, and longitudinal care.',
          availability: 'Mon - Fri, 08:30 - 17:00',
          consultationFee: 150,
        },
      },
    },
  });

  const doctor2 = await prisma.user.upsert({
    where: { email: 'doctor2@example.com' },
    update: {},
    create: {
      fullName: 'Dr. Arjun Mehta',
      email: 'doctor2@example.com',
      passwordHash: doctorHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      doctorProfile: {
        create: {
          specialization: 'Cardiology',
          licenseNumber: 'MD-719344',
          department: 'Cardiovascular Diagnostics',
          phone: '+1 (555) 391-4420',
          bio: 'Preventive cardiologist specializing in hypertension, lipid management, and non-invasive cardiac imaging.',
          availability: 'Tue - Sat, 09:00 - 16:30',
          consultationFee: 210,
        },
      },
    },
  });

  const patient1 = await prisma.user.upsert({
    where: { email: 'patient1@example.com' },
    update: {},
    create: {
      fullName: 'Claire Bennett',
      email: 'patient1@example.com',
      passwordHash: patientHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      patientProfile: {
        create: {
          dateOfBirth: '1988-04-14',
          gender: 'Female',
          bloodGroup: 'A+',
          phone: '+1 (555) 842-1193',
          address: '742 Cedar Ridge Lane, Suite 4B, Portland, OR',
          emergencyContact: 'Thomas Bennett · +1 (555) 842-1199',
          insuranceNumber: 'MH-INS-904821',
        },
      },
    },
  });

  const patient2 = await prisma.user.upsert({
    where: { email: 'patient2@example.com' },
    update: {},
    create: {
      fullName: 'David Kowalski',
      email: 'patient2@example.com',
      passwordHash: patientHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      patientProfile: {
        create: {
          dateOfBirth: '1979-11-02',
          gender: 'Male',
          bloodGroup: 'O-',
          phone: '+1 (555) 619-3304',
          address: '128 Harborview Ave, Seattle, WA',
          emergencyContact: 'Anna Kowalski · +1 (555) 619-3305',
          insuranceNumber: 'MH-INS-553109',
        },
      },
    },
  });

  const existingAppointments = await prisma.appointment.count();
  if (existingAppointments === 0) {
    await prisma.appointment.createMany({
      data: [
        {
          patientId: patient1.id,
          doctorId: doctor1.id,
          appointmentDate: '2026-11-26',
          appointmentTime: '09:30',
          reason: 'Annual metabolic panel review and blood pressure follow-up',
          status: 'CONFIRMED',
          notes: 'Fasting 12 hours prior to lab draw.',
        },
        {
          patientId: patient1.id,
          doctorId: doctor2.id,
          appointmentDate: '2026-12-03',
          appointmentTime: '14:00',
          reason: 'Routine echocardiogram consultation',
          status: 'PENDING',
          notes: 'Patient requested afternoon slot.',
        },
        {
          patientId: patient1.id,
          doctorId: doctor1.id,
          appointmentDate: '2026-10-12',
          appointmentTime: '10:00',
          reason: 'Seasonal respiratory evaluation',
          status: 'COMPLETED',
          notes: 'Vitals stable, resolved without complications.',
        },
        {
          patientId: patient2.id,
          doctorId: doctor2.id,
          appointmentDate: '2026-11-27',
          appointmentTime: '11:00',
          reason: 'Lipid profile review & medication titration',
          status: 'CONFIRMED',
          notes: 'Bring home blood pressure log.',
        },
      ],
    });
  }

  const existingRecords = await prisma.medicalRecord.count();
  if (existingRecords === 0) {
    await prisma.medicalRecord.createMany({
      data: [
        {
          patientId: patient1.id,
          doctorId: doctor1.id,
          diagnosis: 'Mild Iron-Deficiency Anemia',
          symptoms: 'Intermittent fatigue, mild exertional dyspnea over 4 weeks',
          treatment: 'Oral ferrous sulfate 325mg daily with vitamin C; dietary iron counseling',
          notes: 'Recheck ferritin and CBC in 8 weeks.',
          recordDate: '2026-10-12',
        },
        {
          patientId: patient1.id,
          doctorId: doctor2.id,
          diagnosis: 'Borderline Elevated Blood Pressure',
          symptoms: 'Asymptomatic; clinic reading 132/84 mmHg',
          treatment: 'DASH dietary modification, sodium restriction <2000mg/day, 150 min/wk aerobic exercise',
          notes: 'Home BP monitoring twice weekly.',
          recordDate: '2026-09-18',
        },
        {
          patientId: patient2.id,
          doctorId: doctor2.id,
          diagnosis: 'Mixed Hyperlipidemia',
          symptoms: 'Routine preventive screening; LDL 162 mg/dL',
          treatment: 'Initiated Rosuvastatin 10mg nightly; repeat lipid panel in 12 weeks',
          notes: 'Liver enzymes within normal reference range.',
          recordDate: '2026-10-05',
        },
      ],
    });
  }

  const existingAllergies = await prisma.allergy.count();
  if (existingAllergies === 0) {
    await prisma.allergy.createMany({
      data: [
        {
          patientId: patient1.id,
          doctorId: doctor1.id,
          allergyName: 'Penicillin V / Amoxicillin',
          severity: 'SEVERE',
          reaction: 'Generalized urticaria and angioedema',
          notes: 'Avoid all beta-lactam penicillins; use macrolides or fluoroquinolones if indicated.',
          diagnosedDate: '2019-06-22',
        },
        {
          patientId: patient1.id,
          doctorId: doctor1.id,
          allergyName: 'Pollen (Birch & Ragweed)',
          severity: 'MILD',
          reaction: 'Seasonal allergic rhinitis',
          notes: 'Managed with OTC cetirizine PRN during spring/fall.',
          diagnosedDate: '2022-04-10',
        },
        {
          patientId: patient2.id,
          doctorId: doctor2.id,
          allergyName: 'Iodinated Contrast Media',
          severity: 'MODERATE',
          reaction: 'Flushing and localized hives',
          notes: 'Pre-medication protocol required prior to contrast CT imaging.',
          diagnosedDate: '2024-02-15',
        },
      ],
    });
  }

  const existingPrescriptions = await prisma.prescription.count();
  if (existingPrescriptions === 0) {
    await prisma.prescription.createMany({
      data: [
        {
          patientId: patient1.id,
          doctorId: doctor1.id,
          medicineName: 'Ferrous Sulfate 325 mg',
          dosage: '325 mg (65 mg elemental iron)',
          frequency: 'Once daily',
          duration: '60 days',
          instructions: 'Take on an empty stomach with orange juice; avoid taking with calcium or dairy.',
          prescribedDate: '2026-10-12',
        },
        {
          patientId: patient1.id,
          doctorId: doctor1.id,
          medicineName: 'Cetirizine Hydrochloride',
          dosage: '10 mg',
          frequency: 'Once daily as needed',
          duration: '30 days',
          instructions: 'Take in the evening if mild drowsiness occurs.',
          prescribedDate: '2026-09-20',
        },
        {
          patientId: patient2.id,
          doctorId: doctor2.id,
          medicineName: 'Rosuvastatin Calcium',
          dosage: '10 mg',
          frequency: 'Once daily at bedtime',
          duration: '90 days',
          instructions: 'Continue low-saturated-fat diet; report any unexplained muscle soreness.',
          prescribedDate: '2026-10-05',
        },
      ],
    });
  }

  const existingReports = await prisma.labReport.count();
  if (existingReports === 0) {
    const file1 = await prisma.uploadedFile.create({
      data: {
        fileName: 'claire-bennett-cbc-ferritin-2026.pdf',
        fileUrl: '/api/files/seed-report-1/download',
        fileType: 'application/pdf',
        fileSize: 245760,
        uploadedById: doctor1.id,
        patientId: patient1.id,
        category: 'LAB_REPORT',
      },
    });

    await prisma.labReport.createMany({
      data: [
        {
          patientId: patient1.id,
          doctorId: doctor1.id,
          reportTitle: 'Complete Blood Count (CBC) & Iron Panel',
          reportType: 'Hematology',
          reportDate: '2026-10-10',
          notes: 'Hemoglobin 11.4 g/dL, Ferritin 14 ng/mL. Consistent with mild iron deficiency.',
          fileUrl: `/api/files/${file1.id}/download`,
          fileName: file1.fileName,
          fileType: file1.fileType,
          fileSize: file1.fileSize,
          uploadedFileId: file1.id,
        },
        {
          patientId: patient2.id,
          doctorId: doctor2.id,
          reportTitle: 'Comprehensive Lipid & Hepatic Panel',
          reportType: 'Cardiometabolic',
          reportDate: '2026-10-03',
          notes: 'Total Cholesterol 238 mg/dL, LDL 162 mg/dL, HDL 48 mg/dL, Triglycerides 140 mg/dL.',
          fileUrl: '/api/files/seed-report-2/download',
          fileName: 'david-kowalski-lipid-panel-2026.pdf',
          fileType: 'application/pdf',
          fileSize: 198400,
        },
      ],
    });
  }

  console.log('MHMS database seeded successfully:', {
    admin: admin.email,
    doctors: [doctor1.email, doctor2.email],
    patients: [patient1.email, patient2.email],
  });
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
