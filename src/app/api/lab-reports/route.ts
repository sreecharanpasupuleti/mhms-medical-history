import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createLabReport, listLabReports } from '@/lib/data-store';
import { labReportSchema } from '@/lib/validation';

export async function GET(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const patientIdParam = searchParams.get('patientId') || undefined;
  const { role, id: userId } = auth.session.user;

  const labReports = await listLabReports({
    ...(role === 'PATIENT' ? { patientId: userId } : patientIdParam ? { patientId: patientIdParam } : {}),
    ...(role === 'DOCTOR' ? { doctorId: userId } : {}),
  });

  return NextResponse.json({ labReports });
}

export async function POST(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const doctorId =
      auth.session.user.role === 'DOCTOR' ? auth.session.user.id : body.doctorId;

    const parsed = labReportSchema.safeParse({ ...body, doctorId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid lab report data.' },
        { status: 400 }
      );
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'Ordering doctor is required.' }, { status: 400 });
    }

    const labReport = await createLabReport({
      patientId: parsed.data.patientId,
      doctorId,
      reportTitle: parsed.data.reportTitle,
      reportType: parsed.data.reportType,
      reportDate: parsed.data.reportDate,
      notes: parsed.data.notes,
      fileUrl: parsed.data.fileUrl,
      fileName: parsed.data.fileName,
      fileType: parsed.data.fileType,
      fileSize: parsed.data.fileSize,
      uploadedFileId: parsed.data.uploadedFileId,
    });

    return NextResponse.json({ labReport }, { status: 201 });
  } catch (error) {
    console.error('Create lab report error:', error);
    return NextResponse.json({ error: 'Failed to create lab report.' }, { status: 500 });
  }
}
