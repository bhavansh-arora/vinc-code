import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import VincArt from '@/components/VincArt';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/types';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  return (
    <div className="auth">
      <div className="auth-art"><VincArt label="Vinc the robot waving hello" /></div>
      <div className="auth-form">
        <div className="auth-card">
          <div>
            <div className="eyebrow">VINC Code</div>
            <h1>Welcome back!</h1>
            <p className="muted">Students: your username and password are on the login card from your teacher.</p>
          </div>
          <LoginForm />
          <p className="small muted">Forgot your password? Your teacher can reset it. Teachers and schools can ask their school admin or VINC.</p>
        </div>
      </div>
    </div>
  );
}
