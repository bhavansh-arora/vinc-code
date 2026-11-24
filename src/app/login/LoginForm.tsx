'use client';
import { useActionState } from 'react';
import { loginAction, type LoginState } from './actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="stack" style={{ gap: 14 }}>
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
      <div className="field">
        <label htmlFor="username">Username</label>
        <input className="input" id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required defaultValue={state.username} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn primary" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
