import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation';
import { ConflictError, createUserAccount } from '@/lib/data-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid registration data.' },
        { status: 400 }
      );
    }

    const user = await createUserAccount({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      password: parsed.data.password,
      role: 'PATIENT',
      status: 'ACTIVE',
      dateOfBirth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      bloodGroup: parsed.data.bloodGroup,
      phone: parsed.data.phone,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Unable to complete registration.' }, { status: 500 });
  }
}
