import crypto from 'crypto';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { findAuthUserByEmail } from './data-store';
import type { UserRole } from '@/types';

import {
  SESSION_COOKIE_NAME,
  isHttpsContext,
  isIframePreview,
} from './auth-cookies';

const globalForSecret = globalThis as unknown as {
  __mhmsRuntimeSecret?: string;
};

export function getAuthSecret(): string {
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.trim().length > 0) {
    return process.env.NEXTAUTH_SECRET.trim();
  }
  if (!globalForSecret.__mhmsRuntimeSecret) {
    globalForSecret.__mhmsRuntimeSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalForSecret.__mhmsRuntimeSecret;
}

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  cookies: isIframePreview
    ? {
        sessionToken: {
          name: SESSION_COOKIE_NAME,
          options: {
            httpOnly: true,
            sameSite: 'none',
            path: '/',
            secure: true,
          },
        },
        callbackUrl: {
          name: 'mhms.callback-url',
          options: {
            sameSite: 'none',
            path: '/',
            secure: true,
          },
        },
        csrfToken: {
          name: 'mhms.csrf-token',
          options: {
            httpOnly: true,
            sameSite: 'none',
            path: '/',
            secure: true,
          },
        },
      }
    : isHttpsContext
    ? {
        sessionToken: {
          name: SESSION_COOKIE_NAME,
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true,
          },
        },
      }
    : undefined,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }

        const user = await findAuthUserByEmail(credentials.email);
        if (!user) {
          throw new Error('Invalid email or password.');
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('This account has been deactivated. Contact an administrator.');
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.fullName = user.fullName;
        token.email = user.email;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          fullName: token.fullName,
          email: token.email,
          role: token.role,
          status: token.status,
          name: token.fullName,
        };
      }
      return session;
    },
  },
};

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireSession(allowedRoles?: UserRole[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 as const, session: null };
  }
  if (session.user.status !== 'ACTIVE') {
    return { error: 'Account inactive', status: 403 as const, session: null };
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: 'Forbidden', status: 403 as const, session: null };
  }
  return { error: null, status: 200 as const, session };
}
