import { redirect } from 'next/navigation';
import { getCurrentSession } from './auth';
import type { UserRole } from '@/types';

export async function requirePageRole(role: UserRole) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.status !== 'ACTIVE') {
    redirect('/access-denied?reason=inactive');
  }
  if (session.user.role !== role) {
    redirect('/access-denied');
  }
  return session.user;
}
