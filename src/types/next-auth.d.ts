import type { DefaultSession } from 'next-auth';
import type { UserRole, UserStatus } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
      status: UserStatus;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  }
}
