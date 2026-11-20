import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { requireSession } from '@/lib/auth';
import { isBlobConfigured } from '@/lib/db-mode';
import { createUploadedFileRecord } from '@/lib/data-store';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from '@/lib/validation';

const UPLOAD_ROOT = path.resolve(process.cwd(), '.mhms-uploads');

export async function POST(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const patientId = (formData.get('patientId') as string | null) || null;
    const category = (formData.get('category') as string | null) || 'LAB_REPORT';

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file attached. Please choose a PDF, JPG, PNG, or DOCX file.' },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'File exceeds the 10 MB maximum upload limit.' },
        { status: 400 }
      );
    }

    const originalName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext) || (file.type && !ALLOWED_UPLOAD_MIME_TYPES.has(file.type))) {
      return NextResponse.json(
        { error: 'Unsupported file format. Allowed formats: PDF, JPG, PNG, and DOCX.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeMime = file.type || (ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'image/jpeg');

    if (isBlobConfigured()) {
      const blob = await put(`mhms-reports/${Date.now()}-${originalName}`, buffer, {
        access: 'public',
        contentType: safeMime,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      const record = await createUploadedFileRecord({
        fileName: originalName,
        fileUrl: blob.url,
        fileType: safeMime,
        fileSize: file.size,
        uploadedById: auth.session.user.id,
        patientId,
        category,
      });

      return NextResponse.json(
        {
          file: record,
          downloadUrl: `/api/files/${record.id}/download`,
          storageMode: 'vercel-blob',
        },
        { status: 201 }
      );
    }

    // Local preview storage fallback when BLOB_READ_WRITE_TOKEN is a placeholder
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
    const fileId = `file_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
    const storedName = `${fileId}${ext}`;
    const resolvedTarget = path.resolve(UPLOAD_ROOT, storedName);
    if (!resolvedTarget.startsWith(UPLOAD_ROOT + path.sep)) {
      return NextResponse.json({ error: 'Invalid upload destination path.' }, { status: 400 });
    }

    fs.writeFileSync(resolvedTarget, buffer);

    const record = await createUploadedFileRecord({
      id: fileId,
      fileName: originalName,
      fileUrl: `/api/files/${fileId}/download`,
      fileType: safeMime,
      fileSize: file.size,
      uploadedById: auth.session.user.id,
      patientId,
      category,
      localPath: resolvedTarget,
    });

    return NextResponse.json(
      {
        file: record,
        downloadUrl: `/api/files/${record.id}/download`,
        storageMode: 'local-preview',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed. Please check file size and format and try again.' },
      { status: 500 }
    );
  }
}
