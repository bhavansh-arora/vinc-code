'use client';
import { useActionState } from 'react';

type Cred = { name: string; username: string; password: string };
type State = { error?: string; ok?: string; creds?: Cred[] };

/** A form bound to a server action that may return an error, a success message, or new login details. */
export default function ActionForm({ action, children, submit, className, cardsTitle, buttonClass = 'btn primary' }: {
  action: (prev: State, form: FormData) => Promise<State>;
  children?: React.ReactNode;
  submit: string;
  className?: string;
  cardsTitle?: string;
  buttonClass?: string;
}) {
  const [state, run, pending] = useActionState<State, FormData>(action, {});
  return (
    <div className="stack" style={{ gap: 12 }}>
      <form action={run} className={className ?? 'stack'} style={className ? undefined : { gap: 12 }}>
        {children}
        <div><button className={buttonClass} disabled={pending}>{pending ? 'Working…' : submit}</button></div>
      </form>
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
      {state.ok && <div className="alert ok" role="status">{state.ok}</div>}
      {state.creds && state.creds.length > 0 && (
        <div className="stack" style={{ gap: 10 }}>
          <div className="spread no-print">
            <strong>{cardsTitle ?? 'Login details'}: shown only once. Print or copy them now.</strong>
            <button type="button" className="btn small" onClick={() => window.print()}>Print login cards</button>
          </div>
          <div className="cards-print">
            {state.creds.map(c => (
              <div className="login-card" key={c.username}>
                <span className="eyebrow">VINC Code login</span>
                <span className="name">{c.name}</span>
                <span className="cred">Username: <b>{c.username}</b></span>
                <span className="cred">Password: <b>{c.password}</b></span>
                <span className="small muted">Sign in at your school&apos;s VINC Code address.</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
