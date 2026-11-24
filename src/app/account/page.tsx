import type { Metadata } from 'next';
import Shell from '@/components/Shell';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import PasswordForm from './PasswordForm';

export const metadata: Metadata = { title: 'Change password' };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { first } = await searchParams;
  return (
    <Shell user={user}>
      <div className="stack">
        <div><div className="eyebrow">Your account · {user.username}</div><h1>Change your password</h1></div>
        {(first || user.mustChangePassword) && <div className="alert info">You signed in with a temporary password. Please choose your own password to continue.</div>}
        <div className="card"><PasswordForm min={user.role === 'student' ? 6 : 10} /></div>
      </div>
    </Shell>
  );
}
