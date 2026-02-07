import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) return null;

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedToken;
  } catch (e) {
    return null;
  }
}
