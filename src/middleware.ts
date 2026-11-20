import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SESSION_COOKIE_NAME } from './lib/auth-cookies';

function roleHomePath(role: string): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'DOCTOR') return '/doctor';
  return '/patient';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/doctor') ||
    pathname.startsWith('/patient') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/print');

  if (!isProtected) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({
    req: request,
    secret,
    cookieName: SESSION_COOKIE_NAME,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.status !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/access-denied?reason=inactive', request.url));
  }

  const role = String(token.role || '');

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return NextResponse.redirect(new URL(roleHomePath(role), request.url));
  }

  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  if (pathname.startsWith('/doctor') && role !== 'DOCTOR') {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  if (pathname.startsWith('/patient') && role !== 'PATIENT') {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/doctor/:path*',
    '/patient/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/print/:path*',
  ],
};
