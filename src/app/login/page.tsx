import type { Metadata } from 'next';
import AuthShell from '@/components/auth/AuthShell';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/types';

export const metadata: Metadata = { title: 'Log in or create an account' };

/*
 * Serves both /login and /signup (see the rewrite in next.config.ts). Using one page means the
 * welcome screen after signing up survives the refresh that follows a new sign-in.
 * Signed-in people see a "go to your dashboard" note instead of a redirect for the same reason.
 */
export default async function AuthPage({ searchParams }: { searchParams: Promise<{ tab?: string; role?: string; id?: string }> }) {
  const user = await getCurrentUser();
  const { tab, role, id } = await searchParams;
  return (
    <AuthShell tab={tab === 'signup' ? 'signup' : 'login'} role={role} schoolId={id}
      signedIn={user ? { name: user.name, home: ROLE_HOME[user.role] } : undefined} />
  );
}
