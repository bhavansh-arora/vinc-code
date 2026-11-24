'use client';
import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { loginAction, type LoginState } from '@/app/login/actions';
import { signupAction, type SignupDone, type SignupState } from '@/app/signup/actions';

type Tab = 'login' | 'signup';
type Role = 'student' | 'parent' | 'teacher' | 'school';

const ROLES: { id: Role; label: string; icon: string; blurb: string }[] = [
  { id: 'student', label: 'Student', icon: 'star', blurb: 'I am in Class 3 to 8 and have a joining code' },
  { id: 'parent', label: 'Parent', icon: 'home', blurb: "I want to follow my child's progress" },
  { id: 'teacher', label: 'Teacher', icon: 'book', blurb: 'I teach coding at my school' },
  { id: 'school', label: 'School', icon: 'school', blurb: 'Register my school as its coordinator' }
];
const TITLES: Record<Role, [string, string]> = {
  student: ['Join your class', 'Your teacher gives you the joining code.'],
  parent: ["Follow your child's coding", "You need your child's family code."],
  teacher: ['Join your school', 'Your school coordinator gives you the teacher code.'],
  school: ['Register your school', 'VINC Lab gives each school a School ID.']
};
const BOARDS = ['CBSE', 'ICSE', 'State board', 'IB', 'Cambridge', 'Other'];

/* ---------- small helpers ---------- */
function suggestUser(name: string): string {
  const parts = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(Boolean);
  if (!parts.length) return '';
  return (parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0]).slice(0, 30);
}
function strength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: 'Use 8 or more characters' };
  if (pw.length < 8) return { score: 1, label: `${8 - pw.length} more character${8 - pw.length === 1 ? '' : 's'}` };
  let s = 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /\D/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  s = Math.min(4, s);
  return { score: s, label: ['', 'Weak: add numbers or symbols', 'Okay', 'Good', 'Strong'][s] };
}
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function Field({ id, label, icon, error, hint, optional, children }: { id: string; label: string; icon?: string; error?: string; hint?: React.ReactNode; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className={'au-field' + (error ? ' bad' : '')}>
      <label htmlFor={id}>{label}{optional && <small className="au-opt"> optional</small>}</label>
      <div className="au-input">{icon && <Icon name={icon} />}{children}</div>
      {error ? <small className="au-err" id={id + '-err'} role="alert">{error}</small> : hint ? <small className="au-hint" id={id + '-hint'}>{hint}</small> : null}
    </div>
  );
}

function PasswordInput({ id, name, auto, meter, error, label = 'Password', extra }: { id: string; name: string; auto: string; meter?: boolean; error?: string; label?: string; extra?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [val, setVal] = useState('');
  const st = strength(val);
  return (
    <div className={'au-field' + (error ? ' bad' : '')}>
      <div className="au-label-row"><label htmlFor={id}>{label}</label>{extra}</div>
      <div className="au-input"><Icon name="lock" />
        <input id={id} name={name} type={show ? 'text' : 'password'} autoComplete={auto} required value={val} onChange={e => setVal(e.target.value)} aria-invalid={!!error} aria-describedby={error ? id + '-err' : meter ? id + '-meter' : undefined} />
        <button type="button" className="au-eye" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}><Icon name={show ? 'eyeOff' : 'eye'} /></button>
      </div>
      {error ? <small className="au-err" id={id + '-err'} role="alert">{error}</small> : meter ? (
        <div className="au-meter" id={id + '-meter'} data-score={st.score}><span /><span /><span /><span /><small>{st.label}</small></div>
      ) : null}
    </div>
  );
}

/* ---------- Log in ---------- */
function LoginForm({ onSignup }: { onSignup: () => void }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [forgot, setForgot] = useState(false);
  const shake = useShake(state.error);
  return (
    <form onSubmit={keep(action)} className={'au-form' + shake} noValidate>
      <div className="au-head"><h1>Welcome back</h1><p>Log in with your User ID and password.</p></div>
      <Field id="username" label="User ID" icon="user">
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required placeholder="e.g. aarav.sharma" defaultValue={state.username} />
      </Field>
      <PasswordInput id="password" name="password" auto="current-password" extra={<button type="button" className="au-link sm" onClick={() => setForgot(true)}>Forgot password?</button>} />
      {state.error && <p className="au-form-err" role="alert">{state.error}</p>}
      <button className="btn primary au-go" disabled={pending}>{pending ? <span className="au-spin" aria-label="Logging in" /> : <>Log in <Icon name="arrow" /></>}</button>
      <p className="au-switch">New to VINC Code? <button type="button" className="au-link strong" onClick={onSignup}>Create an account</button></p>
      {forgot && <ForgotDialog onClose={() => setForgot(false)} />}
    </form>
  );
}

function ForgotDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector('button')?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="au-modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="au-modal-card" role="dialog" aria-modal="true" aria-labelledby="forgot-title" ref={ref}>
        <h2 id="forgot-title">Forgot your password?</h2>
        <p>Passwords are reset by the people who run your account:</p>
        <ul className="au-list">
          <li><Icon name="star" /><span><b>Students:</b> ask your teacher. They can make you a new password straight away.</span></li>
          <li><Icon name="book" /><span><b>Teachers:</b> ask your school coordinator.</span></li>
          <li><Icon name="school" /><span><b>School coordinators and parents:</b> write to VINC Lab.</span></li>
        </ul>
        <p className="au-small">Adults get a temporary password and choose a new one after logging in.</p>
        <div className="au-modal-actions"><button type="button" className="btn primary" onClick={onClose}>Got it</button></div>
      </div>
    </div>
  );
}

/* ---------- Sign up ---------- */
function RolePicker({ onPick, onLogin }: { onPick: (r: Role) => void; onLogin: () => void }) {
  return (
    <div className="au-form">
      <div className="au-head"><h1>Create your account</h1><p>Who are you signing up as?</p></div>
      <div className="au-roles">
        {ROLES.map((r, i) => (
          <button key={r.id} type="button" className={'au-role r-' + r.id} style={{ ['--i' as string]: i }} onClick={() => onPick(r.id)}>
            <span className="au-role-ic"><Icon name={r.icon} /></span>
            <span className="au-role-txt"><b>{r.label}</b><small>{r.blurb}</small></span>
            <Icon name="arrow" className="au-role-go" />
          </button>
        ))}
      </div>
      <p className="au-switch">Already have an account? <button type="button" className="au-link strong" onClick={onLogin}>Log in</button></p>
    </div>
  );
}

type JoinInfo = { kind: 'student' | 'teacher'; school: { name: string; city: string | null }; sections: { id: number; grade: number; name: string; hasTeacher: boolean }[] };

function useLookup<T>(url: string | null): { data: T | null; error: string; loading: boolean } {
  const [res, setRes] = useState<{ data: T | null; error: string; loading: boolean }>({ data: null, error: '', loading: false });
  useEffect(() => {
    if (!url) { setRes({ data: null, error: '', loading: false }); return; }
    let live = true;
    setRes(r => ({ ...r, loading: true }));
    fetch(url).then(async r => { const j = await r.json(); if (live) setRes(r.ok ? { data: j, error: '', loading: false } : { data: null, error: j.error ?? 'Not found.', loading: false }); })
      .catch(() => live && setRes({ data: null, error: 'Could not check. Check your internet.', loading: false }));
    return () => { live = false; };
  }, [url]);
  return res;
}

function SignupForm({ role, schoolIdParam, onBack, onDone }: { role: Role; schoolIdParam: string; onBack: () => void; onDone: (d: SignupDone) => void }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signupAction, {});
  const err = (f: string) => (state.field === f ? state.error : undefined);
  const shake = useShake(state.error);
  useEffect(() => { if (state.done) onDone(state.done); }, [state.done, onDone]);

  // User ID: suggested from the name until edited, with a live availability check.
  const [name, setName] = useState('');
  const [user, setUser] = useState('');
  const [touched, setTouched] = useState(false);
  const shownUser = touched ? user : suggestUser(name);
  const checkUser = useDebounced(shownUser, 300);
  const userCheck = useLookup<{ valid: boolean; available: boolean }>(checkUser.length >= 1 ? `/api/signup/check?u=${encodeURIComponent(checkUser)}` : null);
  const userHint = !shownUser ? 'You will log in with this. Lowercase letters, numbers and dots.'
    : userCheck.loading || checkUser !== shownUser ? 'Checking…'
    : userCheck.data && !userCheck.data.valid ? 'Start with a letter; use 3 to 30 letters, numbers, dots, dashes or underscores.'
    : userCheck.data && !userCheck.data.available ? `${shownUser} is taken. Try adding a number.`
    : userCheck.data ? <span className="au-good"><Icon name="check" /> {shownUser} is available</span> : '';

  // Codes
  const [code, setCode] = useState(role === 'school' ? schoolIdParam : '');
  const dCode = useDebounced(code, 350);
  const codeUrl = role === 'student' || role === 'teacher' ? (dCode.length >= 6 ? `/api/signup/join?code=${encodeURIComponent(dCode)}` : null)
    : role === 'parent' ? (dCode.length === 6 ? `/api/signup/family?code=${encodeURIComponent(dCode)}` : null)
    : dCode.length === 9 ? `/api/signup/school-id?code=${encodeURIComponent(dCode)}` : null;
  const look = useLookup<JoinInfo & { name: string; grade: number; section: string; school: string; note: string | null }>(codeUrl);
  const join = (role === 'student' || role === 'teacher') && look.data && (look.data as JoinInfo).kind === role ? (look.data as JoinInfo) : null;
  const wrongKind = (role === 'student' || role === 'teacher') && look.data && (look.data as JoinInfo).kind !== role;
  const codeMsg = look.error || (wrongKind ? (role === 'student' ? 'This is a teacher code. Ask your teacher for the student code.' : 'This is a student code. Ask your coordinator for the teacher code.') : '');
  const upper = (v: string, max: number, dash = true) => v.toUpperCase().replace(dash ? /[^A-Z0-9-]/g : /[^A-Z0-9]/g, '').slice(0, max);

  const [title, sub] = TITLES[role];
  const r = ROLES.find(x => x.id === role)!;
  return (
    <form onSubmit={keep(action)} className={'au-form' + shake} noValidate>
      <input type="hidden" name="role" value={role} />
      <div className="au-form-top">
        <button type="button" className="au-back" onClick={onBack} aria-label="Back: choose who you are"><Icon name="back" /></button>
        <span className={'au-chip r-' + role}><Icon name={r.icon} /> {r.label}</span>
      </div>
      <div className="au-head"><h1>{title}</h1><p>{sub}</p></div>

      {role === 'school' && <>
        <Field id="schoolId" label="School ID" icon="id" error={err('schoolId') || (look.error && code.length === 9 ? look.error : undefined)} hint={look.data ? <span className="au-good"><Icon name="check" /> School ID accepted{look.data.note ? ` (${look.data.note})` : ''}</span> : 'VINC Lab gives each school its own School ID. No ID yet? Contact VINC Lab.'}>
          <input id="schoolId" name="schoolId" required placeholder="e.g. VL-7KQ2X9" value={code} onChange={e => setCode(upper(e.target.value, 9))} autoComplete="off" spellCheck={false} />
        </Field>
        <Field id="schoolName" label="School name" icon="school" error={err('schoolName')}><input id="schoolName" name="schoolName" required maxLength={60} placeholder="e.g. Sunflower Public School" /></Field>
        <div className="au-row2">
          <Field id="city" label="City" icon="city" optional><input id="city" name="city" maxLength={40} autoComplete="address-level2" /></Field>
          <Field id="board" label="Board" icon="book" error={err('board')}><select id="board" name="board" defaultValue="CBSE">{BOARDS.map(b => <option key={b}>{b}</option>)}</select></Field>
        </div>
      </>}

      <Field id="name" label={role === 'school' ? 'Your name (coordinator)' : 'Full name'} icon="user" error={err('name')}>
        <input id="name" name="name" required maxLength={60} autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder={role === 'student' ? 'As in school records' : ''} />
      </Field>

      {(role === 'student' || role === 'teacher') && <>
        <Field id="code" label={role === 'student' ? 'School joining code' : 'Teacher joining code'} icon="key" error={err('code') || codeMsg || undefined}
          hint={join ? <span className="au-good"><Icon name="check" /> {join.school.name}{join.school.city ? `, ${join.school.city}` : ''}</span> : role === 'student' ? 'Your teacher gives it to you, e.g. DPS-7KQ2.' : 'Your coordinator finds it on the school dashboard.'}>
          <input id="code" name="code" required placeholder="e.g. DPS-7KQ2" value={code} onChange={e => setCode(upper(e.target.value, 12))} autoComplete="off" spellCheck={false} />
        </Field>
        {role === 'student' && (
          <Field id="sectionId" label="Class and section" icon="users" error={err('sectionId')}>
            <select id="sectionId" name="sectionId" required disabled={!join} defaultValue="">
              <option value="">{join ? 'Choose your class' : 'Enter your joining code first'}</option>
              {join?.sections.map(s => <option key={s.id} value={s.id}>Class {s.grade} · {s.name}</option>)}
            </select>
          </Field>
        )}
        {role === 'teacher' && join && (
          <fieldset className="au-field au-picks">
            <legend>Sections you teach <small className="au-opt">optional</small></legend>
            <div className="au-chips">
              {join.sections.length ? join.sections.map(s => (
                <label key={s.id} className={'au-pick' + (s.hasTeacher ? ' taken' : '')}>
                  <input type="checkbox" name="sectionIds" value={s.id} disabled={s.hasTeacher} />
                  <span>Class {s.grade} · {s.name}<small>{s.hasTeacher ? 'has a teacher' : 'no teacher yet'}</small></span>
                </label>
              )) : <small className="au-hint">No sections yet. Your coordinator can add you later.</small>}
            </div>
          </fieldset>
        )}
        {role === 'teacher' && <div className="au-row2">
          <Field id="email" label="Email" icon="mail" error={err('email')}><input id="email" name="email" type="email" required maxLength={80} autoComplete="email" /></Field>
          <Field id="phone" label="Mobile number" icon="phone" error={err('phone')} optional><input id="phone" name="phone" type="tel" inputMode="tel" maxLength={15} autoComplete="tel" placeholder="10-digit mobile" /></Field>
        </div>}
      </>}

      {role === 'parent' && <>
        <div className="au-row2">
          <Field id="relation" label="You are their" icon="home" error={err('relation')}><select id="relation" name="relation" defaultValue="Mother"><option>Mother</option><option>Father</option><option>Guardian</option></select></Field>
          <Field id="phone" label="Mobile number" icon="phone" error={err('phone')}><input id="phone" name="phone" type="tel" inputMode="tel" required maxLength={15} autoComplete="tel" placeholder="10-digit mobile" /></Field>
        </div>
        <Field id="email" label="Email" icon="mail" error={err('email')} optional><input id="email" name="email" type="email" maxLength={80} autoComplete="email" /></Field>
        <Field id="code" label="Child's family code" icon="link" error={err('code') || (code.length === 6 ? look.error : '') || undefined}
          hint={look.data?.name ? <span className="au-found"><Icon name="check" /> <span><b>{look.data.name}</b> · Class {look.data.grade}{look.data.section ? ` · ${look.data.section}` : ''}{look.data.school ? ` · ${look.data.school}` : ''}</span></span> : 'Six letters or numbers. Your child finds it on their dashboard.'}>
          <input id="code" name="code" required placeholder="e.g. BCAVC5" value={code} onChange={e => setCode(upper(e.target.value, 6, false))} autoComplete="off" spellCheck={false} />
        </Field>
      </>}

      {role === 'school' && <div className="au-row2">
        <Field id="email" label="Email" icon="mail" error={err('email')}><input id="email" name="email" type="email" required maxLength={80} autoComplete="email" /></Field>
        <Field id="phone" label="Mobile number" icon="phone" error={err('phone')} optional><input id="phone" name="phone" type="tel" inputMode="tel" maxLength={15} autoComplete="tel" placeholder="10-digit mobile" /></Field>
      </div>}

      <fieldset className="au-login-fs">
        <legend><Icon name="lock" /> Your login</legend>
        <Field id="newUser" label="User ID" icon="id" error={err('username')} hint={userHint}>
          <input id="newUser" name="username" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={30}
            value={shownUser} onChange={e => { setTouched(true); setUser(e.target.value.toLowerCase().replace(/\s+/g, '.')); }} />
        </Field>
        <PasswordInput id="newPassword" name="password" auto="new-password" meter error={err('password')} />
      </fieldset>

      {state.error && !state.field && <p className="au-form-err" role="alert">{state.error}</p>}
      {state.error && state.field && <p className="au-form-err" role="alert">Please fix the highlighted field.</p>}
      <button className="btn primary au-go" disabled={pending}>{pending ? <span className="au-spin" aria-label="Creating your account" /> : <>Create account <Icon name="arrow" /></>}</button>
      {role === 'student' && <p className="au-fine">We only ask for your name. No email address or phone number is needed.</p>}
    </form>
  );
}

function CopyRow({ label, value, icon = 'id' }: { label?: string; value: string; icon?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* user can select the text */ } };
  return (
    <div className="au-uid">
      <Icon name={icon} />{label && <span className="au-uid-label">{label}</span>}<code>{value}</code>
      <button type="button" onClick={copy} aria-label={`Copy ${label ?? 'User ID'}`}><Icon name={copied ? 'check' : 'copy'} /></button>
    </div>
  );
}

function Done({ d }: { d: SignupDone }) {
  const first = d.name.split(' ')[0];
  return (
    <div className="au-done">
      <svg className="au-done-check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" /><path d="M20 33l8 8 16-17" /></svg>
      <h1>Welcome, {first}!</h1>
      <p>Your {d.role} account is ready. Keep your User ID handy:</p>
      <CopyRow value={d.username} />
      {d.role === 'student' && d.familyCode && <div className="au-note"><Icon name="link" /><div><p>Your <b>family code</b> is below. Give it to your parent so they can follow your progress. It is also on your dashboard.</p><CopyRow label="Family code" value={d.familyCode} icon="link" /></div></div>}
      {d.role === 'teacher' && <div className="au-note"><Icon name="school" /><p>{d.sections ? `You teach ${d.sections} section${d.sections === 1 ? '' : 's'} at ${d.schoolName}. They are ready on your dashboard.` : `You have joined ${d.schoolName}. Your coordinator will give you your sections.`}</p></div>}
      {d.role === 'parent' && d.child && <div className="au-note"><Icon name="check" /><p>Linked to <b>{d.child}</b>.</p></div>}
      {d.role === 'school' && <div className="au-note"><Icon name="key" /><div><p><b>{d.schoolName}</b> is ready. Share these codes so people can join. They are also on your dashboard.</p><CopyRow label="Teachers" value={d.teacherCode!} icon="book" /><CopyRow label="Students" value={d.studentCode!} icon="star" /></div></div>}
      <a className="btn primary au-go" href={d.home}>Go to my dashboard <Icon name="arrow" /></a>
    </div>
  );
}

/** Submit without React's automatic form reset, so nothing typed is lost when a check fails. */
function keep(run: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => run(fd)); };
}

function useShake(error?: string): string {
  const [on, setOn] = useState(false);
  useEffect(() => { if (!error) return; setOn(true); const t = setTimeout(() => setOn(false), 450); return () => clearTimeout(t); }, [error]);
  return on ? ' au-shake' : '';
}

/* ---------- The card ---------- */
export default function AuthPanel({ initialTab, initialRole, schoolId, signedIn }: { initialTab: Tab; initialRole?: string; schoolId?: string; signedIn?: { name: string; home: string } }) {
  const startRole = ROLES.some(r => r.id === initialRole) ? (initialRole as Role) : null;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [role, setRole] = useState<Role | null>(startRole);
  const [done, setDone] = useState<SignupDone | null>(null);
  const [dir, setDir] = useState<'fwd' | 'back' | ''>('');
  const go = (t: Tab, r: Role | null, d: 'fwd' | 'back') => {
    setTab(t); setRole(r); setDir(d);
    try { history.replaceState(null, '', t === 'login' ? '/login' : `/signup${r ? `?role=${r}` : ''}`); } catch { /* ignore */ }
  };
  const step = tab === 'login' ? 'login' : done ? 'done' : role ? 'form' : 'role';
  const paneKey = step + (role ?? '');
  return (
    <div className="au-card">
      {signedIn && step !== 'done' && <p className="au-signed"><Icon name="user" /> <span>You are logged in as <b>{signedIn.name}</b>. <a href={signedIn.home}>Go to your dashboard</a></span></p>}
      {step !== 'done' && (
        <div className="au-tabs" role="tablist" aria-label="Log in or create an account" data-tab={tab}>
          <button type="button" role="tab" id="tab-login" aria-selected={tab === 'login'} aria-controls="au-body" onClick={() => tab !== 'login' && go('login', role, 'back')}>Log in</button>
          <button type="button" role="tab" id="tab-signup" aria-selected={tab === 'signup'} aria-controls="au-body" onClick={() => tab !== 'signup' && go('signup', role, 'fwd')}>Create account</button>
          <span className="au-tab-ind" aria-hidden="true" />
        </div>
      )}
      <div className="au-body" id="au-body" role="tabpanel" aria-labelledby={tab === 'login' ? 'tab-login' : 'tab-signup'}>
        <div key={paneKey} className={'au-pane' + (dir ? ' enter-' + dir : '')}>
          {step === 'login' && <LoginForm onSignup={() => go('signup', role, 'fwd')} />}
          {step === 'role' && <RolePicker onPick={r => go('signup', r, 'fwd')} onLogin={() => go('login', null, 'back')} />}
          {step === 'form' && role && <SignupForm role={role} schoolIdParam={(schoolId ?? '').toUpperCase().slice(0, 9)} onBack={() => go('signup', null, 'back')} onDone={d => { setDone(d); setDir('fwd'); }} />}
          {step === 'done' && done && <Done d={done} />}
        </div>
      </div>
    </div>
  );
}
