'use client';
import { useActionState } from 'react';
import { changePasswordAction, type PwState } from './actions';

export default function PasswordForm({ min }: { min: number }) {
  const [state, action, pending] = useActionState<PwState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="stack" style={{ gap: 14, maxWidth: 420 }}>
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
      <div className="field"><label htmlFor="current">Current password</label><input className="input" id="current" name="current" type="password" autoComplete="current-password" required /></div>
      <div className="field"><label htmlFor="next">New password</label><input className="input" id="next" name="next" type="password" autoComplete="new-password" minLength={min} required /><span className="help">At least {min} characters.</span></div>
      <div className="field"><label htmlFor="confirm">New password again</label><input className="input" id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={min} required /></div>
      <button className="btn primary" disabled={pending}>{pending ? 'Saving…' : 'Change password'}</button>
    </form>
  );
}
